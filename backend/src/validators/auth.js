const { z } = require('zod');

exports.registerSchema = z.object(
    {
        email: z.string().email('Некорректный формат email').trim(),
        password: z.string().min(6, 'Пароль должен содержать не менее 6 символов').max(100, 'Пароль слишком длинный'),
    }
);  

exports.loginSchema = z.object(
    {
        email: z.string().email('Некорректный формат email').trim(),
        password: z.string().min(1, 'Пароль обязателен'),
    }
);