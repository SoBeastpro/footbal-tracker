const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');
const validate = require('../middleware/validate');
const { createMatchSchema } = require('../validators/match');

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req,res) =>{
    try{
        const {leagueId, teamID, status} = req.query;
        
        const where = {};

        if(leagueId) where.leagueID = leagueID;
        if (teamID){
            where.OR = [
                {homeTeamId: teamID},
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

router.post('/',auth, requireRole('admin','manager'), validate(createMatchSchema),async (req,res) =>{
    try{
        const {homeTeamId, awayTeamId, leagueId, date, status} = req.body;

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

module.exports = router;