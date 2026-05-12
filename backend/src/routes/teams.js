const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');

const auth = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');
const validate = require('../middleware/validate');
const { createTeamSchema } = require('../validators/team');

const router = Router();
const prisma = new PrismaClient();

router.get('/', async(req,res) => {
    try{
        const teams = await prisma.team.findMany({
            select:{
                id: true,
                name:true,
                logoUrl:true,
                league:{
                    id:true, name:true,
                }
            }
        });
        res.json(teams);
    }catch(err){
        console.error(err);
        res.status(500).json('Ошибка при получении команд')
    }
})

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

module.exports = router;