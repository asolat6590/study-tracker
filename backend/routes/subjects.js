const express = require('express');
const db = require('../db');
const { mapSubject } = require('../lib/map');
const { asyncHandler, conflict, notFound, isUniqueError } = require('../lib/http');
const { requireText, parseColor, parseId } = require('../lib/validate');

const router = express.Router();

const selectSubjects = `
  SELECT s.id, s.name, s.color, s.created_at,
         (SELECT COUNT(*) FROM tasks t WHERE t.subject_id = s.id) AS task_count,
         (SELECT COALESCE(SUM(se.duration_seconds), 0) FROM sessions se WHERE se.subject_id = s.id) AS study_seconds
  FROM subjects s
`;

function readSubject(id) {
  return db.prepare(`${selectSubjects} WHERE s.id = ?`).get(id);
}

function assertUniqueName(name) {
  const key = name.toLocaleLowerCase('ru-RU');
  const rows = db.prepare('SELECT name FROM subjects').all();
  const exists = rows.some((row) => row.name.toLocaleLowerCase('ru-RU') === key);
  if (exists) throw conflict('Предмет с таким названием уже есть');
}

router.get('/', asyncHandler((req, res) => {
  const rows = db.prepare(`${selectSubjects} ORDER BY s.name COLLATE NOCASE`).all();
  res.json(rows.map(mapSubject));
}));

router.post('/', asyncHandler((req, res) => {
  const name = requireText(req.body?.name, 'название предмета', 40);
  const color = parseColor(req.body?.color);
  assertUniqueName(name);

  try {
    const info = db.prepare(
      'INSERT INTO subjects (name, color, created_at) VALUES (?, ?, ?)',
    ).run(name, color, new Date().toISOString());
    res.status(201).json(mapSubject(readSubject(Number(info.lastInsertRowid))));
  } catch (error) {
    if (isUniqueError(error)) throw conflict('Предмет с таким названием уже есть');
    throw error;
  }
}));

router.delete('/:id', asyncHandler((req, res) => {
  const id = parseId(req.params.id);
  const subject = db.prepare('SELECT id FROM subjects WHERE id = ?').get(id);
  if (!subject) throw notFound('Предмет не найден');

  const usage = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM tasks WHERE subject_id = ?) AS tasks,
      (SELECT COUNT(*) FROM sessions WHERE subject_id = ?) AS sessions
  `).get(id, id);

  if (Number(usage.tasks) > 0 || Number(usage.sessions) > 0) {
    throw conflict('Нельзя удалить предмет: к нему привязаны задачи или занятия');
  }

  db.prepare('DELETE FROM subjects WHERE id = ?').run(id);
  res.status(204).end();
}));

module.exports = router;
