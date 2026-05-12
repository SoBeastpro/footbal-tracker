const { z } = require('zod');

exports.createLeagueSchema = z.object({
  name: z.string().min(2, "Название слишком короткое"),
  logoUrl: z.string().url("Должна быть ссылка").optional(),
  // Для первой версии сделаем жестко false, так как "официальные" будем грузить скриптом
  isOfficial: z.boolean().default(false) 
});