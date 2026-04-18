require('dotenv').config();

const PORT = process.env.PORT || 3000; 
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require ('./routers/auth');
app.use('/api/auth', authRoutes);                  // Запросы идут на /api/auth/register

const leaguesRoutes = require('./routes/leagues');
app.use('/api/leagues', leaguesRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});