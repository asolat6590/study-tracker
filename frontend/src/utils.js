export function formatClock(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return [hours, minutes, rest].map((part) => String(part).padStart(2, '0')).join(':');
}

export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  if (seconds === 0) return '0 мин';
  if (seconds < 60) return `${seconds} сек`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} мин`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} ч`;
  return `${hours} ч ${rest} мин`;
}

export function formatStudyHours(totalSeconds) {
  const seconds = Number(totalSeconds) || 0;
  if (seconds < 3600) return formatDuration(seconds);
  const hours = seconds / 3600;
  if (hours < 10) return `${hours.toFixed(1)} ч`;
  return `${Math.round(hours)} ч`;
}

export function formatDate(value) {
  if (!value) return 'Без срока';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}.${month}.${year}`;
}

export function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatWeekLabel(value) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const names = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  return `${names[date.getDay()]} ${day}`;
}

export function todayInput() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function isOverdue(task) {
  return task.status === 'pending' && Boolean(task.dueDate) && task.dueDate < todayInput();
}

export function plural(count, one, few, many) {
  const value = Math.abs(Number(count)) || 0;
  const mod100 = value % 100;
  const mod10 = value % 10;
  if (mod100 > 10 && mod100 < 20) return many;
  if (mod10 > 1 && mod10 < 5) return few;
  if (mod10 === 1) return one;
  return many;
}
