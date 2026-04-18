const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173', // порт Vite по умолчанию
  credentials: true
}));