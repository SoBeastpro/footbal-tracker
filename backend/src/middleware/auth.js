const jwt = require('jsonwebtoken');
const {PrismaClient} = require('@prisma/client');
const Prisma = new PrismaClient

module.exports = async (req, res, next) =>{
    try{
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({error: 'Требуется авторизация'});
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await Prisma.user.findUnique({
            where: {id: decoded.id},
            select: {id: true, email:true, role: true}
        });

        if (!user){
            return res.status(401).json({error: 'Требуется регистрация'})
        }
        req.user = user;
        next();
    }catch (err){
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError'){
            return res.status(401).json({ error: 'Невалидный или просроченный токен' });
        }
        res.staus(500).json({ error: 'Ошибка авторизации' });
    }

};