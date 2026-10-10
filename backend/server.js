const express = require('express');
const cors = require('cors');

require('./db');

const subjectsRouter = require('./routes/subjects');
const tasksRouter = require('./routes/tasks');
const sessionsRouter = require('./routes/sessions');
const statsRouter = require('./routes/stats');

const app = express();
const port = Number(process.env.PORT) || 3001;

app.disable('x-powered-by');
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'Study Tracker API',
    health: '/api/health',
    endpoints: [
      'GET /api/health',
      'GET /api/subjects',
      'POST /api/subjects',
      'DELETE /api/subjects/:id',
      'GET /api/tasks',
      'POST /api/tasks',
      'PUT /api/tasks/:id',
      'PATCH /api/tasks/:id',
      'DELETE /api/tasks/:id',
      'GET /api/sessions',
      'POST /api/sessions',
      'DELETE /api/sessions/:id',
      'GET /api/stats',
    ],
  });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/subjects', subjectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/stats', statsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed' || (error instanceof SyntaxError && error.status === 400)) {
    res.status(400).json({ error: 'Некорректный JSON' });
    return;
  }

  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({
    error: status >= 500 ? 'Внутренняя ошибка сервера' : error.message,
  });
});

app.listen(port, () => {
  console.log(`Study Tracker API: http://localhost:${port}`);
});
