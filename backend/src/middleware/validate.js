module.exports = (schema) => {
    return (req,res, next) =>{
        const result = schema.safeParse(req.body);
        if (!result.success){
            return res.status(400).json({
                error: 'Ошибка валидации данных',
                details: result.error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
                }))
            });
        }
        req.body = result.data;
        next();
    };
};