export default function ProgressRing({ value }) {
  const safe = Math.min(100, Math.max(0, Number(value) || 0));
  const rounded = Math.round(safe);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;

  return (
    <div className="ring-wrap">
      <svg className="ring" viewBox="0 0 140 140" role="img" aria-label={`Прогресс ${rounded} процентов`}>
        <circle className="ring-track" cx="70" cy="70" r={radius} />
        <circle
          className="ring-value"
          cx="70"
          cy="70"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <text x="70" y="76" textAnchor="middle">{rounded}%</text>
      </svg>
    </div>
  );
}
