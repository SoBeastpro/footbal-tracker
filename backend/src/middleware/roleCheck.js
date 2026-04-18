module.exports = (...allowedRoles) =>{
    return (req,res,next) => {
        if (!req.user){
            return res.status(401).json({ error: 'Сначала авторизуйтесь' });
        }

        if (!allowedRoles.includes(req.user.role)){
            return res.status(403).json({ 
                error: `Доступ запрещён. Требуется роль: ${allowedRoles.join(' или ')}` 
            });
        }
        
        next();
    };
};