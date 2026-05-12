const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validators/auth');

const router = Router();
const prisma = new PrismaClient();

router.post('/register', validate(registerSchema), async (req,res) => {
    try{
        const {email, password} = req.body;

        const existingUser = await prisma.user.findUnique({where: {email}});
        if (existingUser) {
            return res.status(400).json({error: 'Пользователь уже зарегестрирован'});
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await prisma.user.create({
            data: {
                email,
                password:hashedPassword
            },
            select:{
                id:true,
                email:true,
                role:true
            }
        });

        res.status(201).json(newUser);

    } catch (err){
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
})

router.post('/login', validate(loginSchema), async (req,res) => {
    try {
        const {email,password} = req.body || {};

        const user = await prisma.user.findUnique({
            where: {email}
        });
        
        const isPasswordValid = await bcrypt.compare(password,user.password);

        if (!isPasswordValid){
            return res.status(401).json({error: 'Неверный email или пароль'})
        }

        const token = jwt.sign(
            {
                id: user.id,
                email:user.email,
                role: user.role
            }, 
            process.env.JWT_SECRET,
            {expiresIn: '1h'} //Срок хранения токена
        );

        res.json({
            token,
            user: {
                id: user.id,
                email:user.email,
                role: user.role
            }
        });
    } catch (err){
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;