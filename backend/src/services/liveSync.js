// backend/src/services/liveSync.js
const { PrismaClient, MatchStatus } = require('@prisma/client');
const { recalculateTeamStanding } = require('../routes/matches');
const prisma = new PrismaClient();

const API_BASE = 'https://api.football-data.org/v4';
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const headers = { 'X-Auth-Token': API_KEY };

async function fetchApi(url) {
  try {
    const response = await fetch(`${API_BASE}${url}`, { headers });
    
    if (response.status === 429) {
      console.warn('Rate limit reached, waiting 60s...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      return fetchApi(url);
    }
    
    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Fetch error: ${error.message}`);
    return null;
  }
}

function mapStatus(apiStatus) {
  const map = {
    'SCHEDULED': 'SCHEDULED',
    'TIMED': 'SCHEDULED',
    'IN_PLAY': 'LIVE',
    'PAUSED': 'HALFTIME',
    'FINISHED': 'FINISHED',
    'POSTPONED': 'CANCELLED',
    'CANCELLED': 'CANCELLED'
  };
  return map[apiStatus] || 'SCHEDULED';
}

async function syncCompetitions() {
  console.log('Начинаю полную синхронизацию с football-data.org...');
  const ALLOWED_CODES = ['PL', 'PD', 'SA', 'BL1', 'FL1', 'CL', 'EL', 'DED', 'PPL'];


  const competitionsData = await fetchApi('/competitions?plan=TIER_ONE');
  if (!competitionsData || !competitionsData.competitions) {
    console.error('Не удалось получить список лиг');
    return;
  };

  const competitionsToSync = competitionsData.competitions.filter(comp => 
    ALLOWED_CODES.includes(comp.code)
  );
  
  
  console.log(`Всего найдено: ${competitionsData.competitions.length}`);
  console.log(`Синхронизируем: ${competitionsToSync.length} (отсекаем сборные)`);
  
  let leaguesCount = 0;
  let teamsCount = 0;
  let matchesCount = 0;
  
  for (const comp of competitionsToSync) {
    try {
      console.log(`\nЛига: ${comp.name} (${comp.code})`);
      
      // 1. Создаём или обновляем лигу
      const league = await prisma.league.upsert({
        where: { externalId: String(comp.id) },
        update: { 
          name: comp.name,
          logoUrl: comp.emblem 
        },
        create: {
          name: comp.name,
          logoUrl: comp.emblem,
          isCustom: false,
          externalId: String(comp.id)
        }
      });
      leaguesCount++;
      console.log(`Лига: ${league.name}`);
      
      // 2. Загружаем команды
      const teamsData = await fetchApi(`/competitions/${comp.code}/teams`);
      if (!teamsData?.teams) {
        console.warn(`Нет команд для ${comp.name}`);
        continue;
      }
      
      console.log(`Команд в лиге: ${teamsData.teams.length}`);
      
      for (const team of teamsData.teams) {
        try {
          const teamName = team.shortName || team.name;
          const apiTeamId = team.id ? String(team.id) : null;
          
          let existingTeam = null;
          if (apiTeamId) {
            existingTeam = await prisma.team.findUnique({
              where: { externalId: apiTeamId }
            });
          }
          
          if (existingTeam) {
            await prisma.team.update({
              where: { id: existingTeam.id },
              data: {
                name: teamName,
                logoUrl: team.crest
              }
            });
            teamsCount++;
            continue;
          }
          
          const existingTeamByName = await prisma.team.findUnique({
            where: {
              name_leagueId: {
                name: teamName,
                leagueId: league.id
              }
            }
          });
          
          if (existingTeamByName) {
            await prisma.team.update({
              where: { id: existingTeamByName.id },
              data: {
                logoUrl: team.crest,
                externalId: apiTeamId
              }
            });
            teamsCount++;
            continue;
          }
          
          await prisma.team.create({
            data: {
              name: teamName,
              logoUrl: team.crest,
              leagueId: league.id,
              externalId: apiTeamId
            }
          });
          teamsCount++;
          
        } catch (err) {
          console.warn(`WARNING: Пропущена команда ${team.name}: ${err.message}`);
          continue;
        }
      }
      console.log(`Команд загружено/обновлено: ${teamsData.teams.length}`);
      
      const currentSeason = comp.currentSeason?.startDate 
        ? new Date(comp.currentSeason.startDate).getFullYear() 
        : 2025;
        
      const matchesData = await fetchApi(`/competitions/${comp.code}/matches?season=${currentSeason}`);
      if (!matchesData?.matches) {
        console.warn(`WARNING: Нет матчей для ${comp.name}`);
        continue;
      }
      
      console.log(`Матчей: ${matchesData.matches.length}`);
      
      for (const match of matchesData.matches) {
        try {
          const homeTeam = await prisma.team.findFirst({
            where: { externalId: String(match.homeTeam.id) }
          });
          const awayTeam = await prisma.team.findFirst({
            where: { externalId: String(match.awayTeam.id) }
          });
          
          if (!homeTeam || !awayTeam) {
            console.warn(`WARNING: Пропущен матч ${match.id}: команды не найдены`);
            continue;
          }
          
          await prisma.match.upsert({
            where: { externalId: String(match.id) },
            update: {
              homeScore: match.score.fullTime.home,
              awayScore: match.score.fullTime.away,
              status: mapStatus(match.status),
              date: new Date(match.utcDate),
              stage: match.stage || 'REGULAR_SEASON'
            },
            create: {
              externalId: String(match.id),
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              leagueId: league.id,
              homeScore: match.score.fullTime.home ?? 0,
              awayScore: match.score.fullTime.away ?? 0,
              status: mapStatus(match.status),
              date: new Date(match.utcDate),
              stage: match.stage || 'REGULAR_SEASON'
            }
          });

          if (matchStatus ==="FINISHED"){
            await recalculateTeamStanding(homeTeam.id,league.id);
            await recalculateTeamStanding(awayTeam.id,league.id);
          }
          matchesCount++;
        } catch (err) {
          console.warn(`WARNING: Пропущен матч ${match.id}: ${err.message}`);
          continue;
        }
      }
      console.log(`Матчи загружены`);
      
    } catch (err) {
      console.error(`Ошибка лиги ${comp.name}:`, err.message);
      continue;
    }
  }
  
  console.log(`\nСинхронизация завершена!`);
  console.log(`Итого: Лиг: ${leaguesCount}, Команд: ${teamsCount}, Матчей: ${matchesCount}`);
}

// 🔁 Функция для фонового обновления LIVE-матчей
async function pollLiveMatches() {
  console.log('Checking for live matches...');
  
  const potentialLive = await prisma.match.findMany({
    where: {
      status: { in: ['SCHEDULED', 'LIVE', 'HALFTIME'] },
      date: {
        gte: new Date(Date.now() - 3 * 60 * 60 * 1000),
        lte: new Date(Date.now() + 3 * 60 * 60 * 1000)
      }
    },
    include: { league: true }
  });
  
  if (potentialLive.length === 0) {
    console.log('No potential live matches found');
    return;
  }
  
  console.log(`Found ${potentialLive.length} matches to check`);
  
  for (let i = 0; i < potentialLive.length; i++) {
    const match = potentialLive[i];
    if (!match.externalId) continue;
    
    try {
      const data = await fetchApi(`/matches/${match.externalId}`);
      if (!data) continue;
      
      const newStatus = mapStatus(data.status);
      const newHome = data.score?.fullTime?.home ?? match.homeScore;
      const newAway = data.score?.fullTime?.away ?? match.awayScore;
      
      if (newStatus !== match.status || newHome !== match.homeScore || newAway !== match.awayScore) {
        await prisma.match.update({
          where: { id: match.id },
          data: { 
            status: newStatus, 
            homeScore: newHome, 
            awayScore: newAway 
          }
        });
        console.log(`⚽ ${match.id}: ${newHome}:${newAway} (${newStatus})`);
        
        // Если матч завершился → пересчитываем таблицу
        if (newStatus === 'FINISHED') {
          await recalculateTeamStanding(match.homeTeamId, match.leagueId);
          await recalculateTeamStanding(match.awayTeamId, match.leagueId);
          console.log(`Standings recalculated for match ${match.id}`);
        }
      }
    } catch (error) {
      console.error(`Error updating match ${match.id}:`, error.message);
    }
    
    // Пауза для соблюдения лимита 10 req/min (6 сек между запросами)
    if (i < potentialLive.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 6000));
    }
  }
  console.log('Live sync cycle completed');
}

module.exports = { syncCompetitions, pollLiveMatches };