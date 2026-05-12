require('dotenv').config();

const PORT = process.env.PORT || 3000; 
const express = require('express');
const cors = require('cors');

const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());


const authRoutes = require ('./routes/auth');
app.use('/api/auth', authRoutes);                  // Запросы идут на /api/auth/register

const leaguesRoutes = require('./routes/leagues');
app.use('/api/leagues', leaguesRoutes);

const teamsRoutes = require('./routes/teams');
app.use('/api/teams', teamsRoutes);

const playersRoutes = require('./routes/players');
app.use('/api/players', playersRoutes);

app.use(errorHandler);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});