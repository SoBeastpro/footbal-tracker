const { Router } = require('express');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = Router();

router.get('/', async(req,res) =>{
    res.json({message: "Список лиг (в разработке)"}) // ДОРАБОТАТЬ
})

router.post('/', auth, roleCheck('admin'), (req,res) =>{
    res.json({message: "Лига создана админом"}) //ДОРАБОТАТЬ
})

router.put('/:id', auth, roleCheck('admin', 'manager'), async (req, res) => {
  res.json({ message: 'Данные обновлены' });
});

module.exports = router;