const {z} = require('zod');

exports.createTeamSchema = z.object({
    name: z.string().min(2, "Название команды слишком короткое").trim(),
    logoUrl: z.string().url("Некорректная ссылка").optional(),
    leagueId: z.string().min(1, "ID лиги обязательно")
})