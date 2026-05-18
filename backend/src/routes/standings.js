const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');
const validate = require('../middleware/validate');
const { updateStandingSchema } = require('../validators/standings');
const { syncCompetitions, pollLiveMatches } = require('../services/liveSync');

const router = Router();
const prisma = new PrismaClient();

// GET: Получить турнирную таблицу конкретной лиги
router.get('/', async (req, res) => {
  try {
    const { leagueId } = req.query;

    if (!leagueId) {
      return res.status(400).json({ error: 'Параметр ?leagueId=... обязателен' });
    }

    const standings = await prisma.standing.findMany({
      where: { leagueId }, // ← фильтрация в PostgreSQL, а не в JS
      include: {
        team: {
          select: {
            id: true,
            name: true,
            logoUrl: true
          }
        }
      },
      orderBy: [
        { points: 'desc' },           // 1. Очки (по убыванию)
        { goalDifference: 'desc' },   // 2. Разница мячей
        { goalsFor: 'desc' },         // 3. Забитые голы
        { wins: 'desc' }              // 4. Победы 
      ]
    });

    res.json({ 
      leagueId,
      standings 
    });
  } catch (err) {
    console.error('❌ Error GET /standings:', err);
    res.status(500).json({ error: 'Ошибка при получении турнирной таблицы' });
  }
});

router.put('/:teamId', 
  auth, 
  requireRole('admin'), 
  validate(updateStandingSchema),
  async (req, res) => {
    try {
      const { teamId } = req.params;
      const { wins, draws, losses, goalsFor, goalsAgainst, leagueId } = req.body;

      // 1. Проверяем, что команда существует и получаем её leagueId (если не передали в теле)
      const team = await prisma.team.findUnique({ 
        where: { id: teamId },
        select: { leagueId: true }
      });
      if (!team) return res.status(404).json({ error: 'Команда не найдена' });

      const finalLeagueId = leagueId || team.leagueId;

      // 2. Считаем статистику
      const calculatedData = {
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points: wins * 3 + draws,
        played: wins + draws + losses 
      };

      // 3. upsert с явным подключением связей (connect)
      const updated = await prisma.standing.upsert({
        where: { teamId },
        update: calculatedData,
        create: {
          team: { connect: { id: teamId } },      // ✅ Явная связь с командой
          league: { connect: { id: finalLeagueId } }, // ✅ Явная связь с лигой
          ...calculatedData
        }
      });

      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка при обновлении таблицы' });
    }
  }
);

router.post('/sync', auth, requireRole('admin'), async (req, res) => {
  try {
    res.json({ message: 'Синхронизация запущена в фоне. Смотри консоль сервера.' });

    syncCompetitions().catch(err => {
      console.error('Ошибка фоновой синхронизации:', err.message);
    });

  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Ошибка запуска синхронизации' });
    }
  }
});

router.post('/sync/live', auth, requireRole('admin'), async (req, res) => {
  try {
    res.json({ message: 'Проверка LIVE-матчей запущена.' });
    await pollLiveMatches();
  } catch (err) {
    res.status(500).json({ error: 'Ошибка' });
  }
});

module.exports = router;