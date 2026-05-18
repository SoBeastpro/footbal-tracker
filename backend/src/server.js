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

const playersRoutes = require('./routes/player');
app.use('/api/player', playersRoutes);

const standingsRoutes = require('./routes/standings');
app.use('/api/standings', standingsRoutes);

const matchesRoutes = require('./routes/matches');
app.use('/api/matches', matchesRoutes);

const { pollLiveMatches } = require('./services/liveSync');
setInterval(pollLiveMatches, 3 * 60 * 1000);
setTimeout(pollLiveMatches, 10000);
console.log('Live sync started (polling every 3 minutes)');

app.use(errorHandler);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});