import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import EmptyState from '../components/EmptyState';
import { formatDate, isOverdue } from '../utils';

const EMPTY_FORM = {
  title: '',
  subjectId: '',
  dueDate: '',
  status: 'pending',
};

const FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'pending', label: 'Невыполненные' },
  { id: 'completed', label: 'Выполненные' },
];

function statusLabel(status) {
  return status === 'completed' ? 'Выполнена' : 'Не выполнена';
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [taskData, subjectData] = await Promise.all([api.getTasks(), api.getSubjects()]);
    setTasks(taskData);
    setSubjects(subjectData);
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

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function openCreate() {
    setEditingId(null);
    setPendingDelete(null);
    setError('');
    setForm({
      ...EMPTY_FORM,
      subjectId: subjects[0] ? String(subjects[0].id) : '',
    });
    setShowForm(true);
  }

  function openEdit(task) {
    setEditingId(task.id);
    setPendingDelete(null);
    setError('');
    setForm({
      title: task.title,
      subjectId: String(task.subjectId),
      dueDate: task.dueDate || '',
      status: task.status,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('Укажите название задачи');
      return;
    }
    if (!form.subjectId) {
      setError('Выберите предмет');
      return;
    }

    setSaving(true);
    setError('');
    const payload = {
      title: form.title,
      subjectId: Number(form.subjectId),
      dueDate: form.dueDate || null,
      status: form.status,
    };

    try {
      if (editingId) await api.updateTask(editingId, payload);
      else await api.createTask(payload);
      closeForm();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggle(task) {
    setError('');
    try {
      await api.updateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    setError('');
    try {
      await api.deleteTask(id);
      if (editingId === id) closeForm();
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const visible = tasks.filter((task) => filter === 'all' || task.status === filter);

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1>Задачи</h1>
          <p>Название, предмет, срок и статус каждой учебной задачи.</p>
        </div>
        {subjects.length > 0 ? (
          <button className="btn btn-primary" type="button" onClick={showForm && !editingId ? closeForm : openCreate}>
            {showForm && !editingId ? 'Закрыть' : 'Новая задача'}
          </button>
        ) : null}
      </header>

      {error ? <p className="error-banner" role="alert">{error}</p> : null}
      {loading ? <p className="muted">Загрузка…</p> : null}

      {!loading && subjects.length === 0 ? (
        <article className="panel">
          <EmptyState
            title="Сначала добавьте предмет"
            text="Задача всегда относится к предмету: биологии, математике или другому."
            action={<Link className="btn btn-primary" to="/subjects">Перейти к предметам</Link>}
          />
        </article>
      ) : null}

      {subjects.length > 0 && showForm ? (
        <form className="panel form-card" onSubmit={onSubmit}>
          <div className="panel-head">
            <h2>{editingId ? 'Редактирование задачи' : 'Новая задача'}</h2>
          </div>
          <div className="form-grid">
            <label className="field field-wide">
              <span>Название</span>
              <input
                name="title"
                value={form.title}
                onChange={updateField}
                maxLength={120}
                placeholder="Например, решить задачи по параграфу 12"
                required
              />
            </label>
            <label className="field">
              <span>Предмет</span>
              <select name="subjectId" value={form.subjectId} onChange={updateField} required>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Срок</span>
              <input name="dueDate" type="date" value={form.dueDate} onChange={updateField} />
            </label>
            <label className="field">
              <span>Статус</span>
              <select name="status" value={form.status} onChange={updateField}>
                <option value="pending">Не выполнена</option>
                <option value="completed">Выполнена</option>
              </select>
            </label>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Сохранение…' : editingId ? 'Сохранить' : 'Добавить'}
            </button>
            <button className="btn btn-ghost" type="button" onClick={closeForm}>Отмена</button>
          </div>
        </form>
      ) : null}

      {subjects.length > 0 && !loading ? (
        <>
          <div className="filters" role="tablist" aria-label="Фильтр задач">
            {FILTERS.map((item) => {
              const count = item.id === 'all'
                ? tasks.length
                : tasks.filter((task) => task.status === item.id).length;
              return (
                <button
                  key={item.id}
                  className={filter === item.id ? 'chip-btn active' : 'chip-btn'}
                  type="button"
                  role="tab"
                  aria-selected={filter === item.id}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label} ({count})
                </button>
              );
            })}
          </div>

          {visible.length === 0 ? (
            <article className="panel">
              <EmptyState
                title="В этом списке пусто"
                text="Добавьте задачу или выберите другой фильтр."
              />
            </article>
          ) : (
            <ul className="task-list">
              {visible.map((task) => (
                <li
                  key={task.id}
                  className={`task-item${task.status === 'completed' ? ' done' : ''}${isOverdue(task) ? ' overdue' : ''}`}
                >
                  <button
                    className={task.status === 'completed' ? 'check checked' : 'check'}
                    type="button"
                    aria-pressed={task.status === 'completed'}
                    aria-label={task.status === 'completed' ? 'Отметить как невыполненную' : 'Отметить как выполненную'}
                    onClick={() => toggle(task)}
                  >
                    {task.status === 'completed' ? (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6 12.5 10 16.5 18 8" />
                      </svg>
                    ) : null}
                  </button>
                  <div className="task-main">
                    <p className="task-title">{task.title}</p>
                    <p className="meta">
                      <span className="subject-chip" style={{ backgroundColor: `${task.subjectColor}22`, color: task.subjectColor }}>
                        {task.subjectName}
                      </span>
                      <span>{formatDate(task.dueDate)}</span>
                      <span className={task.status === 'completed' ? 'badge badge-green' : 'badge badge-amber'}>
                        {statusLabel(task.status)}
                      </span>
                      {isOverdue(task) ? <span className="badge badge-rose">Просрочено</span> : null}
                    </p>
                  </div>
                  <div className="row-actions">
                    {pendingDelete === task.id ? (
                      <>
                        <button className="btn btn-danger btn-small" type="button" onClick={() => remove(task.id)}>Удалить</button>
                        <button className="btn btn-ghost btn-small" type="button" onClick={() => setPendingDelete(null)}>Отмена</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-ghost btn-small" type="button" onClick={() => openEdit(task)}>Изменить</button>
                        <button className="btn btn-ghost btn-small" type="button" onClick={() => setPendingDelete(task.id)}>Удалить</button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </section>
  );
}
