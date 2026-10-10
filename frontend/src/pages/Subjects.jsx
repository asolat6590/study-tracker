import { useEffect, useState } from 'react';
import { api } from '../api';
import EmptyState from '../components/EmptyState';
import { formatDuration, plural } from '../utils';

const COLORS = ['#2b7a68', '#3d6f9a', '#a8742d', '#8b5e83', '#b55252', '#5c6b4a', '#c47b5a', '#4f6f8f'];

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  async function load() {
    setSubjects(await api.getSubjects());
  }

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

  async function onSubmit(event) {
    event.preventDefault();
    if (!name.trim()) {
      setError('Укажите название предмета');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await api.createSubject({ name, color });
      setName('');
      setColor(COLORS[0]);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    setError('');
    try {
      await api.deleteSubject(id);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setPendingDelete(null);
      setError(err.message);
    }
  }

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1>Предметы</h1>
          <p>Добавляйте дисциплины, к которым потом привяжете задачи и занятия.</p>
        </div>
      </header>

      {error ? <p className="error-banner" role="alert">{error}</p> : null}

      <form className="panel form-card" onSubmit={onSubmit}>
        <div className="panel-head">
          <h2>Новый предмет</h2>
        </div>
        <div className="subject-form">
          <label className="field">
            <span>Название</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={40}
              placeholder="Например, биология"
              required
            />
          </label>
          <div className="field">
            <span>Цвет</span>
            <div className="swatches" role="listbox" aria-label="Цвет предмета">
              {COLORS.map((item) => (
                <button
                  key={item}
                  className={color === item ? 'swatch selected' : 'swatch'}
                  type="button"
                  style={{ background: item }}
                  aria-label={`Цвет ${item}`}
                  aria-selected={color === item}
                  onClick={() => setColor(item)}
                />
              ))}
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Сохранение…' : 'Добавить'}
          </button>
        </div>
      </form>

      {loading ? <p className="muted">Загрузка…</p> : null}

      {!loading && subjects.length === 0 ? (
        <article className="panel">
          <EmptyState
            title="Предметов пока нет"
            text="Начните с биологии, химии, математики или английского — как вам удобнее."
          />
        </article>
      ) : null}

      {subjects.length > 0 ? (
        <div className="subject-grid">
          {subjects.map((subject) => (
            <article className="subject-card" key={subject.id}>
              <div className="subject-stripe" style={{ background: subject.color }} />
              <div className="subject-body">
                <h3>{subject.name}</h3>
                <p className="meta">
                  <span>
                    {subject.taskCount} {plural(subject.taskCount, 'задача', 'задачи', 'задач')}
                  </span>
                  <span>{formatDuration(subject.studySeconds)}</span>
                </p>
                <div className="row-actions">
                  {pendingDelete === subject.id ? (
                    <>
                      <button className="btn btn-danger btn-small" type="button" onClick={() => remove(subject.id)}>Удалить</button>
                      <button className="btn btn-ghost btn-small" type="button" onClick={() => setPendingDelete(null)}>Отмена</button>
                    </>
                  ) : (
                    <button className="btn btn-ghost btn-small" type="button" onClick={() => setPendingDelete(subject.id)}>Удалить</button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
