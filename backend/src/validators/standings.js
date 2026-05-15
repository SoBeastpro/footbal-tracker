const { z } = require('zod');

exports.updateStandingSchema = z.object({
  wins: z.number().int().min(0),
  draws: z.number().int().min(0),
  losses: z.number().int().min(0),
  goalsFor: z.number().int().min(0),
  goalsAgainst: z.number().int().min(0),
  leagueId: z.string().optional()
});