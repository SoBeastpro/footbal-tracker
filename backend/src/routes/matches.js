const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');
const validate = require('../middleware/validate');
const { updateStandingSchema } = require('../validators/standings');
const { createMatchSchema, updateScoreSchema } = require('../validators/match');

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/matches:
 *   get:
 *     summary: Получить список матчей
 *     tags: [Matches]
 *     parameters:
 *       - in: query
 *         name: leagueId
 *         schema: { type: string }
 *       - in: query
 *         name: teamId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [SCHEDULED, LIVE, FINISHED] }
 *     responses:
 *       200:
 *         description: Массив матчей
 */
router.get('/', async (req,res) =>{
    try{
        const {leagueId, teamId, status} = req.query;
        
        const where = {};

        if(leagueId) where.leagueId = leagueId;
        if (teamID){
            where.OR = [
                {homeTeamId: teamId},
                {awayTeamId: teamId}
            ];
        }

        if (status) where.status = status;

        const matches = await prisma.match.findMany({
            where,
            include:{
                homeTeam: { select: { id: true, name: true, logoUrl: true } },
                awayTeam: { select: { id: true, name: true, logoUrl: true } },
                league: { select: { id: true, name: true } }
            },
            orderBy:{date:'desc'}
        });

        res.json({ matches });
    }catch(err){
        console.error(err);
        res.status(500).json({"error": "Ошибка при получении матчей"})
    }
})

/**
 * @swagger
 * /api/matches:
 *   post:
 *     summary: Создать матч (Admin/Manager)
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [homeTeamId, awayTeamId, leagueId, date]
 *             properties:
 *               homeTeamId: { type: string }
 *               awayTeamId: { type: string }
 *               leagueId: { type: string }
 *               date: { type: string, format: date-time, example: "2025-05-20T19:00:00Z" }
 *               stage: { type: string, example: "Group Stage" }
 *     responses:
 *       201:
 *         description: Матч создан
 *       400:
 *         description: Команда не может играть сама с собой
 */
router.post('/',auth, requireRole('admin','manager'), validate(createMatchSchema),async (req,res) =>{
    try{
        const {homeTeamId, awayTeamId, leagueId, date, status, stage} = req.body;

        if (homeTeamId === awayTeamId){
            return res.status(400).json({ error: 'Команда не может играть сама с собой' });
        }

        const newMatch = await prisma.match.create({
            data:{
                homeTeamId,
                awayTeamId,
                leagueId,
                date: new Date(date),
                status: status || "SCHEDULED",
                stage: stage || 'Group Stage',
                homeScore:0,
                awayScore:0
            },
            include: {
                homeTeam:{select:{name:true}},
                awayTeam:{select:{name:true}}                
            }
        });
        res.status(201).json(newMatch);
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'Ошибка при создании матча' });
    }
})

async function recalculateTeamStanding(teamId, leagueId) {
    const matches = await prisma.match.findMany({
        where:{
            leagueId,
            status:'FINISHED',
            OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }]
        }
    });

    let wins = 0, losses = 0, draws = 0, gf = 0, ga = 0;

    for (const m of matches){
        const isHome = m.homeTeamId === teamId;
        const teamGoals = isHome ? m.homeScore : m.awayScore;
        const oppGoals = isHome ? m.awayScore : m.homeScore;

        gf += teamGoals;
        ga += oppGoals

        if (teamGoals > oppGoals) wins++;
        else if (teamGoals === oppGoals) draws++;
        else losses++;
    }

    await prisma.standing.upsert({
    where: { teamId },
    update: {
      wins, draws, losses,
      goalsFor: gf, goalsAgainst: ga,
      goalDifference: gf - ga,
      points: wins * 3 + draws,
      played: wins + draws + losses
    },
    create: {
      teamId, leagueId,
      wins, draws, losses,
      goalsFor: gf, goalsAgainst: ga,
      goalDifference: gf - ga,
      points: wins * 3 + draws,
      played: wins + draws + losses
    }
  });
}

/**
 * @swagger
 * /api/matches/{id}/score:
 *   patch:
 *     summary: Обновить счёт матча (автопересчёт таблицы)
 *     description: Изменяет статус на FINISHED и автоматически пересчитывает Standing
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - homeScore
 *               - awayScore
 *             properties:
 *               homeScore:
 *                 type: integer
 *                 example: 2
 *               awayScore:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Счёт обновлён, таблица пересчитана
 *       404:
 *         description: Матч не найден
 */
router.patch('/:id/score', auth, requireRole('admin', 'manager'), validate(updateScoreSchema), async (req, res) =>{
    try{
        const {id} = req.params;
        const {homeScore, awayScore} = req.body;

        const match = await prisma.match.findUnique({
            where: {id},
            include:{
                homeTeam: true, awayTeam:true
            }
        })
        if (!match){
            return res.status(404).json({ error: 'Матч не найден' });
        }
        const updatedMatch = await prisma.match.update({
            where: {id},
            data: {homeScore,awayScore,status:"FINISHED"}
        })
        await recalculateTeamStanding(match.homeTeamId, match.leagueId);
        await recalculateTeamStanding(match.awayTeamId, match.leagueId);

         res.json({ 
            match: updatedMatch, 
            message: 'Счёт обновлён. Турнирные таблицы для обеих команд пересчитаны.' 
        });
    }  catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка при обновлении счёта' });
    }
})

module.exports = router;