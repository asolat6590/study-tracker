const express = require('express');
const db = require('../db');
const { mapSession } = require('../lib/map');
const { asyncHandler, badRequest, notFound } = require('../lib/http');
const { parseSubjectId, parseIso, parseId, ensureSubject } = require('../lib/validate');

const router = express.Router();
const MAX_SECONDS = 24 * 60 * 60;

const selectSessions = `
  SELECT se.id, se.subject_id, se.duration_seconds, se.started_at, se.ended_at,
         s.name AS subject_name, s.color AS subject_color
  FROM sessions se
  JOIN subjects s ON s.id = se.subject_id
`;

router.get('/', asyncHandler((req, res) => {
  const rows = db.prepare(`${selectSessions} ORDER BY se.ended_at DESC, se.id DESC`).all();
  res.json(rows.map(mapSession));
}));

router.post('/', asyncHandler((req, res) => {
  const subjectId = parseSubjectId(req.body?.subjectId);
  ensureSubject(db, subjectId);

  const startedAt = parseIso(req.body?.startedAt, 'начало занятия');
  const endedAt = parseIso(req.body?.endedAt, 'окончание занятия');
  const duration = Math.floor((Date.parse(endedAt) - Date.parse(startedAt)) / 1000);

  if (duration < 1) throw badRequest('Занятие короче одной секунды не сохраняется');
  if (duration > MAX_SECONDS) throw badRequest('Одно занятие не может быть длиннее 24 часов');

  const info = db.prepare(`
    INSERT INTO sessions (subject_id, duration_seconds, started_at, ended_at)
    VALUES (?, ?, ?, ?)
  `).run(subjectId, duration, startedAt, endedAt);

  const row = db.prepare(`${selectSessions} WHERE se.id = ?`).get(Number(info.lastInsertRowid));
  res.status(201).json(mapSession(row));
}));

router.delete('/:id', asyncHandler((req, res) => {
  const id = parseId(req.params.id);
  const info = db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  if (!info.changes) throw notFound('Занятие не найдено');
  res.status(204).end();
}));

module.exports = router;
