const {z} = require('zod');

exports.createMatchSchema = z.object({
    homeTeamId: z.string().min('1', "ID домашней команды обязателен"),
    awayTeamId: z.string().min('1',"ID гостевой команды обязателен"),
    leagueId: z.string().min('1',"ID лиги обязателен"),
    date: z.string().datetime("Некорректный формат даты"),
    status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED']),
    stage: z.string().optional()
})

exports.updateScoreSchema = z.object({
  homeScore: z.number().int().min(0, "Счёт не может быть отрицательным"),
  awayScore: z.number().int().min(0, "Счёт не может быть отрицательным"),
});