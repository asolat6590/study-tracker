import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import EmptyState from '../components/EmptyState';
import { formatClock, formatDateTime, formatDuration } from '../utils';

const TIMER_KEY = 'study-tracker-active-session';

function elapsedFrom(startedAt) {
  if (!startedAt) return 0;
  return Math.max(0, Math.floor((Date.now() - Date.parse(startedAt)) / 1000));
}

function clearStoredTimer() {
  localStorage.removeItem(TIMER_KEY);
}

export default function Timer() {
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [startedAt, setStartedAt] = useState(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  async function load() {
    const [subjectData, sessionData] = await Promise.all([api.getSubjects(), api.getSessions()]);
    setSubjects(subjectData);
    setSessions(sessionData);
    setSubjectId((current) => current || (subjectData[0] ? String(subjectData[0].id) : ''));
  }

  useEffect(() => {
    const saved = localStorage.getItem(TIMER_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.startedAt && parsed.subjectId) {
        setStartedAt(parsed.startedAt);
        setSubjectId(String(parsed.subjectId));
        setRunning(true);
        setElapsed(elapsedFrom(parsed.startedAt));
      }
    } catch {
      clearStoredTimer();
    }
  }, []);

  useEffect(() => {
    let active = true;
    load()
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!running || !startedAt) return undefined;
    setElapsed(elapsedFrom(startedAt));
    const id = window.setInterval(() => setElapsed(elapsedFrom(startedAt)), 250);
    return () => window.clearInterval(id);
  }, [running, startedAt]);

  function resetTimer() {
    setRunning(false);
    setStartedAt(null);
    setElapsed(0);
    clearStoredTimer();
  }

  function start() {
    if (!subjectId) {
      setError('Выберите предмет');
      return;
    }
    const nextStart = new Date().toISOString();
    setError('');
    setStartedAt(nextStart);
    setRunning(true);
    setElapsed(0);
    localStorage.setItem(TIMER_KEY, JSON.stringify({
      subjectId: Number(subjectId),
      startedAt: nextStart,
    }));
  }

  async function removeSession(id) {
    setError('');
    try {
      await api.deleteSession(id);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function stop() {
    if (!running || !startedAt || saving) return;
    const endedAt = new Date().toISOString();
    const seconds = Math.floor((Date.parse(endedAt) - Date.parse(startedAt)) / 1000);

    if (seconds < 1) {
      resetTimer();
      setError('Занятие короче одной секунды не сохраняется');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await api.createSession({
        subjectId: Number(subjectId),
        startedAt,
        endedAt,
      });
      resetTimer();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const missingSubject = subjectId && !subjects.some((subject) => String(subject.id) === String(subjectId));

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1>Таймер</h1>
          <p>Запустите отсчёт на время занятия. После остановки оно попадёт в историю.</p>
        </div>
      </header>

      {error ? <p className="error-banner" role="alert">{error}</p> : null}
      {loading ? <p className="muted">Загрузка…</p> : null}

      {!loading && subjects.length === 0 ? (
        <article className="panel">
          <EmptyState
            title="Для таймера нужен предмет"
            text="Сначала добавьте хотя бы одну дисциплину, затем вернитесь сюда."
            action={<Link className="btn btn-primary" to="/subjects">Добавить предмет</Link>}
          />
        </article>
      ) : null}

      {subjects.length > 0 || running ? (
        <article className="panel timer-card">
          <div className={running ? 'timer-status running' : 'timer-status'}>
            {running ? <span className="pulse" /> : null}
            <span>{running ? 'Занятие идёт' : 'Таймер остановлен'}</span>
          </div>
          <p className={running ? 'timer-clock running' : 'timer-clock'}>{formatClock(elapsed)}</p>
          <div className="timer-controls">
            <label className="field">
              <span>Предмет занятия</span>
              <select
                value={subjectId}
                disabled={running || subjects.length === 0}
                onChange={(event) => setSubjectId(event.target.value)}
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
                {missingSubject ? <option value={subjectId}>Предмет недоступен</option> : null}
              </select>
            </label>
            <div className="timer-actions">
              {running ? (
                <button className="btn btn-danger" type="button" onClick={stop} disabled={saving}>
                  {saving ? 'Сохранение…' : 'Остановить'}
                </button>
              ) : (
                <button className="btn btn-primary" type="button" onClick={start} disabled={subjects.length === 0}>
                  Начать занятие
                </button>
              )}
              {running && error ? (
                <button className="btn btn-ghost" type="button" onClick={() => { resetTimer(); setError(''); }}>
                  Сбросить таймер
                </button>
              ) : null}
            </div>
          </div>
        </article>
      ) : null}

      {!loading ? (
      <article className="panel">
        <div className="panel-head">
          <h2>История занятий</h2>
        </div>
        {sessions.length === 0 ? (
          <p className="muted">Сохранённых занятий пока нет.</p>
        ) : (
          <ul className="history-list">
            {sessions.map((session) => (
              <li className="history-item" key={session.id}>
                <div>
                  <span className="subject-chip" style={{ backgroundColor: `${session.subjectColor}22`, color: session.subjectColor }}>
                    {session.subjectName}
                  </span>
                  <p className="meta">
                    {formatDateTime(session.startedAt)} — {formatDateTime(session.endedAt)}
                  </p>
                </div>
                <div className="history-side">
                  <strong>{formatDuration(session.durationSeconds)}</strong>
                  {pendingDelete === session.id ? (
                    <>
                      <button className="btn btn-danger btn-small" type="button" onClick={() => removeSession(session.id)}>Удалить</button>
                      <button className="btn btn-ghost btn-small" type="button" onClick={() => setPendingDelete(null)}>Отмена</button>
                    </>
                  ) : (
                    <button className="btn btn-ghost btn-small" type="button" onClick={() => setPendingDelete(session.id)}>Удалить</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>
      ) : null}
    </section>
  );
}
