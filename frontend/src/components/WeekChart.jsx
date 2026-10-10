import { formatDuration, formatWeekLabel } from '../utils';

export default function WeekChart({ days }) {
  const max = Math.max(...days.map((day) => day.seconds), 1);
  const total = days.reduce((sum, day) => sum + day.seconds, 0);

  return (
    <div>
      {total === 0 ? <p className="muted">За последние 7 дней занятий пока нет.</p> : null}
      <div className="week-chart" aria-label="Продолжительность занятий за 7 дней">
        {days.map((day) => (
          <div className="week-col" key={day.date}>
            <span className="week-value">{day.seconds ? formatDuration(day.seconds) : ''}</span>
            <div className="week-bar-wrap">
              <div
                className="week-bar"
                style={{ height: `${Math.max((day.seconds / max) * 100, day.seconds ? 8 : 0)}%` }}
              />
            </div>
            <span className="week-label">{formatWeekLabel(day.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
