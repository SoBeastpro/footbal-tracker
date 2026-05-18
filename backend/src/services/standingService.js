const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recalculateTeamStanding(teamId, leagueId) {
  const matches = await prisma.match.findMany({
    where: {
      leagueId,
      status: 'FINISHED',
      OR: [
        { homeTeamId: teamId }, 
        { awayTeamId: teamId }
      ]
    }
  });

  let wins = 0, draws = 0, losses = 0, gf = 0, ga = 0;

  for (const m of matches) {
    const isHome = m.homeTeamId === teamId;
    const teamGoals = isHome ? m.homeScore : m.awayScore;
    const oppGoals = isHome ? m.awayScore : m.homeScore;

    if (teamGoals === null || oppGoals === null) continue; // Пропускаем незавершённые

    gf += teamGoals;
    ga += oppGoals;

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

module.exports = { recalculateTeamStanding };