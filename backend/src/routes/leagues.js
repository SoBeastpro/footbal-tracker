const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');

const auth = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck'); // или как ты назвал
const validate = require('../middleware/validate'); // твоя обертка над Zod
const { createLeagueSchema } = require('../validators/league');

const router = Router();
const prisma = new PrismaClient();

router.get('/', async(req,res) =>{
    try{
        const leagues = await prisma.league.findMany({
            select:{
                id:true,
                name:true,
                logoUrl:true
            }
        })
        res.json({ leagues });
    }catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при получении лиг' });
    }
});

router.post('/', auth, requireRole('admin'), validate(createLeagueSchema), async (req,res) =>{
    try{
        const { name, logoUrl } = req.body;
        const newLeague = await prisma.league.create({
            data:{
                name,
                logoUrl: logoUrl || null,
                isCustom: true,
                createdBy: req.user.id
            }
        });
        
        res.status(201).json(newLeague);
    }catch (err){
        console.error(err);
        res.status(500).json({ error: 'Ошибка при создании лиги' });
    }

})

router.put('/:id', auth, requireRole('admin'), validate(createLeagueSchema), async (req, res) => {
  res.json({ message: 'Данные обновлены' });
});

module.exports = router;