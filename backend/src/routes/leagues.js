const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');

const auth = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');
const validate = require('../middleware/validate');
const { createLeagueSchema } = require('../validators/league');

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/leagues:
 *   get:
 *     summary: Получить список всех лиг (публичный)
 *     tags: [Leagues]
 *     responses:
 *       200:
 *         description: Список лиг
 *       500:
 *         description: Ошибка сервера
 */
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
/**
 * @swagger
 * /api/leagues:
 *   post:
 *     summary: Создать новую лигу (только Admin)
 *     tags: [Leagues]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "Моя Любительская Лига" }
 *               logoUrl: { type: string, example: "https://..." }
 *     responses:
 *       201:
 *         description: Лига успешно создана
 *       403:
 *         description: Недостаточно прав (нужен Admin)
 */
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
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Лига с таким названием уже существует' });
        }
        console.error(err);
        res.status(500).json({ error: 'Ошибка при создании лиги' });
    }

})

router.put('/:id', auth, requireRole('admin'), validate(createLeagueSchema), async (req, res) => {
  res.json({ message: 'Данные обновлены' });
});

/**
 * @swagger
 * /api/leagues/{id}:
 *   delete:
 *     summary: Удалить лигу и все связанные данные (только Admin)
 *     tags: [Leagues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Лига удалена
 *       404:
 *         description: Лига не найдена
 */
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const league = await prisma.league.findUnique({ where: { id } });
        if (!league) {
            return res.status(404).json({ error: 'Лига не найдена' });
        }
        await prisma.league.delete({ where: { id } });
    
        res.json({ message: 'Лига и все связанные данные успешно удалены' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при удалении лиги' });
    }
});

module.exports = router;