const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');

const auth = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');
const validate = require('../middleware/validate');
const { createTeamSchema } = require('../validators/team');

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: Получить список команд
 *     tags: [Teams]
 *     parameters:
 *       - in: query
 *         name: leagueId
 *         schema: { type: string }
 *         description: Фильтр по ID лиги
 *     responses:
 *       200:
 *         description: Массив команд
 */
router.get('/', async(req,res) => {
    try{
        const teams = await prisma.team.findMany({
            select:{
                id: true,
                name:true,
                logoUrl:true,
                league:{
                    select:{
                        id:true, name:true,
                    }
                }
            }
        });
        res.json(teams);
    }catch(err){
        console.error(err);
        res.status(500).json('Ошибка при получении команд')
    }
})
/**
 * @swagger
 * /api/teams:
 *   post:
 *     summary: Добавить команду в лигу (Admin/Manager)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, leagueId]
 *             properties:
 *               name: { type: string, example: "ФК Зенит" }
 *               leagueId: { type: string }
 *               logoUrl: { type: string }
 *     responses:
 *       201:
 *         description: Команда создана
 *       400:
 *         description: Ошибка валидации или дубль названия
 */
router.post('/', auth, requireRole('admin', 'manager'), validate(createTeamSchema), async(req,res) =>{
    try{
        const {name, logoUrl, leagueId} = req.body;

        const league = await prisma.league.findUnique({where: {id: leagueId}});
        if (!league){
            return res.status(400).json({error: 'Лига не найдена'});
        }

        const newTeam = await prisma.team.create({
            data: {
                name,
                logoUrl: logoUrl||null,
                leagueId
            },
            select:{
                id:true,
                name:true,
                logoUrl:true,
                leagueId:true
            }
        });
        res.status(201).json(newTeam);
    }catch (err) {
        if (err.code === 'P2002'){
            return res.status(400).json({ error: 'Команда с таким названием уже есть в этой лиге' });
        }
        console.error(err);
        res.status(500).json({error: 'Ошибка при создании команды'})
    }
});

/**
 * @swagger
 * /api/teams/{id}:
 *   delete:
 *     summary: Удалить команду (Admin/Manager)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Команда удалена
 *       404:
 *         description: Команда не найдена
 */
router.delete('/:id', auth, requireRole('admin', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;
        const team = await prisma.team.findUnique({ where: { id } });
        if (!team) {
            return res.status(404).json({ error: 'Команда не найдена' });
        }
        await prisma.team.delete({ where: { id } });
        res.json({ message: 'Команда и связанные данные успешно удалены' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при удалении команды' });
    }
});

module.exports = router;