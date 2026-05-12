const {z} = require('zod');

exports.createPlayerSchema = z.object({
    name: z.string().min(2, "Имя игрока слишком короткое"),
    position: z.string().optional(),
    number: z.number().int().positive().optional(),
    teamId: z.string().min(1, "ID команды обязателен")
})

exports.updatePlayerSchema = z.object({
  name: z.string().min(2).optional(),
  position: z.string().optional(),
  number: z.number().int().positive().max(99).optional(),
  // teamId не меняем здесь! Для переводов нужна отдельная логика
});