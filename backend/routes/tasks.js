const express = require('express');
const db = require('../db');
const { mapTask } = require('../lib/map');
const { asyncHandler, notFound } = require('../lib/http');
const {
  requireText,
  parseId,
  parseSubjectId,
  parseStatus,
  parseDueDate,
  ensureSubject,
} = require('../lib/validate');

const router = express.Router();

const selectTasks = `
  SELECT t.id, t.title, t.subject_id, t.due_date, t.status, t.created_at, t.updated_at,
         s.name AS subject_name, s.color AS subject_color
  FROM tasks t
  JOIN subjects s ON s.id = t.subject_id
`;

function readTask(id) {
  return db.prepare(`${selectTasks} WHERE t.id = ?`).get(id);
}

function readTaskBody(body) {
  const subjectId = parseSubjectId(body?.subjectId);
  ensureSubject(db, subjectId);
  return {
    title: requireText(body?.title, 'название задачи', 120),
    subjectId,
    dueDate: parseDueDate(body?.dueDate),
    status: parseStatus(body?.status),
  };
}

router.get('/', asyncHandler((req, res) => {
  const rows = db.prepare(`
    ${selectTasks}
    ORDER BY CASE t.status WHEN 'pending' THEN 0 ELSE 1 END,
             t.due_date IS NULL,
             t.due_date ASC,
             t.id DESC
  `).all();
  res.json(rows.map(mapTask));
}));

router.post('/', asyncHandler((req, res) => {
  const task = readTaskBody(req.body);
  const now = new Date().toISOString();
  const info = db.prepare(`
    INSERT INTO tasks (title, subject_id, due_date, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(task.title, task.subjectId, task.dueDate, task.status, now, now);

  res.status(201).json(mapTask(readTask(Number(info.lastInsertRowid))));
}));

router.put('/:id', asyncHandler((req, res) => {
  const id = parseId(req.params.id);
  if (!readTask(id)) throw notFound('Задача не найдена');

  const task = readTaskBody(req.body);
  db.prepare(`
    UPDATE tasks
    SET title = ?, subject_id = ?, due_date = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).run(task.title, task.subjectId, task.dueDate, task.status, new Date().toISOString(), id);

  res.json(mapTask(readTask(id)));
}));

router.patch('/:id', asyncHandler((req, res) => {
  const id = parseId(req.params.id);
  if (!readTask(id)) throw notFound('Задача не найдена');

  const status = parseStatus(req.body?.status);
  db.prepare('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?')
    .run(status, new Date().toISOString(), id);

  res.json(mapTask(readTask(id)));
}));

router.delete('/:id', asyncHandler((req, res) => {
  const id = parseId(req.params.id);
  const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  if (!info.changes) throw notFound('Задача не найдена');
  res.status(204).end();
}));

module.exports = router;
