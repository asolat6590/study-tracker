import { useEffect, useState } from 'react';
import { api } from '../api';
import BarList from '../components/BarList';
import ProgressRing from '../components/ProgressRing';
import WeekChart from '../components/WeekChart';
import { formatDuration, formatStudyHours } from '../utils';

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.getStats()
      .then((data) => {
        if (active) setStats(data);
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

  const items = stats
    ? stats.hoursBySubject.map((subject) => ({
      id: subject.id,
      label: subject.name,
      value: subject.seconds,
      color: subject.color,
      display: formatDuration(subject.seconds),
    }))
    : [];

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1>Статистика</h1>
          <p>Часы по предметам, занятия за неделю и общий прогресс.</p>
        </div>
      </header>

      {error ? <p className="error-banner" role="alert">{error}</p> : null}
      {loading ? <p className="muted">Загрузка…</p> : null}

      {stats ? (
        <div className="stats-layout">
          <article className="panel">
            <div className="panel-head">
              <h2>Часы по предметам</h2>
              <span className="muted">Всего {formatStudyHours(stats.totalSeconds)}</span>
            </div>
            <BarList
              items={items}
              emptyText="Добавьте предмет и запишите занятие через таймер."
            />
          </article>

          <div className="split">
            <article className="panel">
              <div className="panel-head">
                <h2>Последняя неделя</h2>
              </div>
              <WeekChart days={stats.week} />
            </article>

            <article className="panel progress-panel">
              <div className="panel-head">
                <h2>Общий прогресс</h2>
              </div>
              <ProgressRing value={stats.progress} />
              <p className="progress-caption">
                {stats.completedTasks} из {stats.totalTasks} задач выполнено
              </p>
              <p className="muted center">Доля учебных задач со статусом «выполнена».</p>
            </article>
          </div>
        </div>
      ) : null}
    </section>
  );
}
