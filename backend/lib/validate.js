const { badRequest } = require('./http');

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

function requireText(value, label, max) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw badRequest(`Укажите ${label}`);
  }

  const text = value.trim().replace(/\s+/g, ' ');
  if (text.length > max) {
    throw badRequest(`Поле «${label}» не должно быть длиннее ${max} символов`);
  }

  return text;
}

function parseColor(value) {
  if (value == null || value === '') return '#2b7a68';
  if (typeof value !== 'string' || !HEX_COLOR.test(value)) {
    throw badRequest('Цвет укажите в формате #RRGGBB');
  }
  return value.toLowerCase();
}

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw badRequest('Некорректный идентификатор');
  }
  return id;
}

function parseSubjectId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw badRequest('Выберите предмет');
  }
  return id;
}

function parseStatus(value) {
  if (value !== 'pending' && value !== 'completed') {
    throw badRequest('Статус может быть только «не выполнена» или «выполнена»');
  }
  return value;
}

function parseDueDate(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') {
    throw badRequest('Срок укажите в формате ГГГГ-ММ-ДД');
  }

  const match = DATE_ONLY.exec(value);
  if (!match) {
    throw badRequest('Срок укажите в формате ГГГГ-ММ-ДД');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const real = date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;

  if (!real) throw badRequest('Некорректная дата срока');
  return value;
}

function parseIso(value, label) {
  if (typeof value !== 'string') throw badRequest(`Укажите ${label}`);
  const time = Date.parse(value);
  if (Number.isNaN(time)) throw badRequest(`Некорректное время: ${label}`);
  return new Date(time).toISOString();
}

function parseOffset(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw == null || raw === '') return 0;
  const offset = Number(raw);
  if (!Number.isInteger(offset) || offset < -840 || offset > 840) {
    throw badRequest('Некорректный часовой пояс');
  }
  return offset;
}

function ensureSubject(db, id) {
  const subject = db.prepare('SELECT id FROM subjects WHERE id = ?').get(id);
  if (!subject) throw badRequest('Выбранный предмет не найден');
}

module.exports = {
  requireText,
  parseColor,
  parseId,
  parseSubjectId,
  parseStatus,
  parseDueDate,
  parseIso,
  parseOffset,
  ensureSubject,
};
