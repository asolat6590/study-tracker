const express = require('express');
const db = require('../db');
const { asyncHandler } = require('../lib/http');
const { parseOffset } = require('../lib/validate');

const router = express.Router();

function localDateKey(utcMs, offsetMinutes) {
  const shifted = new Date(utcMs + offsetMinutes * 60 * 1000);
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${shifted.getUTCFullYear()}-${month}-${day}`;
}

function lastSevenDays(offsetMinutes) {
  const todayKey = localDateKey(Date.now(), offsetMinutes);
  const [year, month, day] = todayKey.split('-').map(Number);
  const todayUtc = Date.UTC(year, month - 1, day);
  const days = [];

  for (let index = 6; index >= 0; index -= 1) {
    days.push(new Date(todayUtc - index * 86400000).toISOString().slice(0, 10));
  }

  return days;
}

router.get('/', asyncHandler((req, res) => {
  const offsetMinutes = parseOffset(req.query.offsetMinutes);
  const totals = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM tasks) AS total_tasks,
      (SELECT COUNT(*) FROM tasks WHERE status = 'completed') AS completed_tasks,
      (SELECT COUNT(*) FROM tasks WHERE status = 'pending') AS pending_tasks,
      (SELECT COALESCE(SUM(duration_seconds), 0) FROM sessions) AS total_seconds
  `).get();

  const hoursBySubject = db.prepare(`
    SELECT s.id, s.name, s.color, COALESCE(SUM(se.duration_seconds), 0) AS seconds
    FROM subjects s
    LEFT JOIN sessions se ON se.subject_id = s.id
    GROUP BY s.id
    ORDER BY seconds DESC, s.name COLLATE NOCASE
  `).all();

  const since = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
  const recent = db.prepare(`
    SELECT ended_at, duration_seconds
    FROM sessions
    WHERE ended_at >= ?
  `).all(since);

  const days = lastSevenDays(offsetMinutes);
  const buckets = Object.fromEntries(days.map((day) => [day, 0]));

  for (const row of recent) {
    const key = localDateKey(Date.parse(row.ended_at), offsetMinutes);
    if (key in buckets) buckets[key] += Number(row.duration_seconds);
  }

  const totalTasks = Number(totals.total_tasks);
  const completedTasks = Number(totals.completed_tasks);
  const progress = totalTasks === 0
    ? 0
    : Math.round((completedTasks / totalTasks) * 1000) / 10;

  res.json({
    totalTasks,
    completedTasks,
    pendingTasks: Number(totals.pending_tasks),
    totalSeconds: Number(totals.total_seconds),
    progress,
    hoursBySubject: hoursBySubject.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      seconds: Number(row.seconds),
    })),
    week: days.map((date) => ({ date, seconds: buckets[date] })),
  });
}));

module.exports = router;
