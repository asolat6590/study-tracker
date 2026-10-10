export default function BarList({ items, emptyText }) {
  if (!items.length) {
    return <p className="muted">{emptyText}</p>;
  }

  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="bar-list">
      {items.map((item) => (
        <div className="bar-row" key={item.id ?? item.label}>
          <span className="bar-label">
            <i className="dot" style={{ background: item.color || '#2b7a68' }} />
            {item.label}
          </span>
          <div className="bar-track" aria-hidden="true">
            <div
              className="bar-fill"
              style={{
                width: `${(item.value / max) * 100}%`,
                background: item.color || '#2b7a68',
              }}
            />
          </div>
          <span className="bar-value">{item.display}</span>
        </div>
      ))}
    </div>
  );
}
