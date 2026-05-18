const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');

const auth = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');
const validate = require('../middleware/validate');
const { createPlayerSchema } = require('../validators/player');
const { updatePlayerSchema } = require('../validators/player');

const router = Router();
const prisma = new PrismaClient();

router.get('/',async(req, res) =>{
    try{
        const {teamId} = req.query;
        const where = teamId ? {teamId} : {};

        const players = await prisma.player.findMany({
            where,
            select:{
                id: true,
                name: true,
                position:true,
                number:true,
                team:{select: {id: true, name:true}}
            }
        });
        res.json({players});
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'Ошибка при получении игроков' });
    }
});

router.post('/', auth, requireRole('admin','manager'), validate(createPlayerSchema), async(req,res) =>{
    try{
        const { name, position, number, teamId } = req.body;

        const isTeam = await prisma.team.findUnique({where: {id:teamId}});

        if (!isTeam){
            return res.status(400).json({ error: 'Команда не найдена' });
        }

        const newPlayer = await prisma.player.create({
            data:{
                name,
                position: position||null,
                number: number||null,
                teamId
            },
            select:{
                id:true,
                name:true,
                position:true,
                number:true,
                teamId:true
            }
        })
        res.status(201).json(newPlayer);
    }catch(err){
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Игрок с таким номером уже есть в этой команде' });
        }
        console.error(err);
        res.status(500).json({ error: 'Ошибка при создании игрока' });
    }
})

// PUT: Обновить данные игрока (номер, позиция, имя)
router.put('/:id', 
  auth, 
  requireRole('admin', 'manager'), 
  validate(updatePlayerSchema), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Если меняем номер → проверяем конфликт
      if (updateData.number !== undefined) {
        const conflict = await prisma.player.findFirst({
          where: {
            number: updateData.number,
            team: { id: (await prisma.player.findUnique({ where: { id } })).teamId },
            id: { not: id } // игнорируем самого игрока
          }
        });
        if (conflict) {
          return res.status(409).json({ error: 'Номер уже занят другим игроком в этой команде' });
        }
      }

      const updatedPlayer = await prisma.player.update({
        where: { id },
        data: updateData,
        select: { id: true, name: true, position: true, number: true, teamId: true }
      });

      res.json(updatedPlayer);
    } catch (err) {
      if (err.code === 'P2025') { // Record not found
        return res.status(404).json({ error: 'Игрок не найден' });
      }
      console.error(err);
      res.status(500).json({ error: 'Ошибка при обновлении игрока' });
    }
  }
);

router.delete('/:id', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const player = await prisma.player.findUnique({ where: { id } });
    if (!player) {
      return res.status(404).json({ error: 'Игрок не найден' });
    }

    await prisma.player.delete({ where: { id } });
    
    res.json({ message: 'Игрок успешно удалён из состава' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при удалении игрока' });
  }
});

module.exports = router;