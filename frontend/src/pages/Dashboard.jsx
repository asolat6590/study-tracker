import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import EmptyState from '../components/EmptyState';
import ProgressRing from '../components/ProgressRing';
import StatCard from '../components/StatCard';
import { formatDate, formatStudyHours, isOverdue } from '../utils';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([api.getStats(), api.getTasks()])
      .then(([nextStats, nextTasks]) => {
        if (!active) return;
        setStats(nextStats);
        setTasks(nextTasks.slice(0, 5));
      })
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

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1>Панель</h1>
          <p>Сводка по задачам и времени учёбы.</p>
        </div>
      </header>

      {error ? <p className="error-banner" role="alert">{error}</p> : null}
      {loading ? <p className="muted">Загрузка…</p> : null}

      {stats ? (
        <>
          <div className="stat-grid">
            <StatCard label="Всего задач" value={stats.totalTasks} hint="учебные задачи" tone="ink" />
            <StatCard label="Выполнено" value={stats.completedTasks} hint="закрытые задачи" tone="green" />
            <StatCard label="Не выполнено" value={stats.pendingTasks} hint="ещё в работе" tone="amber" />
            <StatCard label="Часы учёбы" value={formatStudyHours(stats.totalSeconds)} hint="по всем занятиям" tone="teal" />
          </div>

          <div className="split">
            <article className="panel">
              <div className="panel-head">
                <h2>Актуальные задачи</h2>
                <Link to="/tasks">Все задачи</Link>
              </div>
              {tasks.length === 0 ? (
                <EmptyState
                  title="Задач пока нет"
                  text="Добавьте первую учебную задачу, и она появится в этом списке."
                  action={<Link className="btn btn-primary" to="/tasks">Добавить задачу</Link>}
                />
              ) : (
                <ul className="task-list">
                  {tasks.map((task) => (
                    <li
                      key={task.id}
                      className={`task-item preview${task.status === 'completed' ? ' done' : ''}${isOverdue(task) ? ' overdue' : ''}`}
                    >
                      <div className="task-main">
                        <p className="task-title">{task.title}</p>
                        <p className="meta">
                          <span className="subject-chip" style={{ backgroundColor: `${task.subjectColor}22`, color: task.subjectColor }}>
                            {task.subjectName}
                          </span>
                          <span>{formatDate(task.dueDate)}</span>
                          {isOverdue(task) ? <span className="badge badge-rose">Просрочено</span> : null}
                          {task.status === 'completed' ? <span className="badge badge-green">Выполнена</span> : null}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="panel progress-panel">
              <div className="panel-head">
                <h2>Прогресс</h2>
              </div>
              <ProgressRing value={stats.progress} />
              <p className="progress-caption">
                {stats.completedTasks} из {stats.totalTasks} задач выполнено
              </p>
              <Link className="btn btn-ghost" to="/stats">Открыть статистику</Link>
            </article>
          </div>
        </>
      ) : null}
    </section>
  );
}
