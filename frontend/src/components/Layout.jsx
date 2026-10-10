import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Панель', end: true, icon: 'dashboard' },
  { to: '/tasks', label: 'Задачи', icon: 'tasks' },
  { to: '/subjects', label: 'Предметы', icon: 'subjects' },
  { to: '/timer', label: 'Таймер', icon: 'timer' },
  { to: '/stats', label: 'Статистика', icon: 'stats' },
];

function NavIcon({ name }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  if (name === 'dashboard') {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1.6" />
        <rect x="14" y="3" width="7" height="7" rx="1.6" />
        <rect x="3" y="14" width="7" height="7" rx="1.6" />
        <rect x="14" y="14" width="7" height="7" rx="1.6" />
      </svg>
    );
  }

  if (name === 'tasks') {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M8 12.5 10.5 15 16 9.5" />
      </svg>
    );
  }

  if (name === 'subjects') {
    return (
      <svg {...common}>
        <path d="M5 6.2A2.2 2.2 0 0 1 7.2 4H19v15H7.2A2.2 2.2 0 0 0 5 21.2Z" />
        <path d="M5 6.2A2.2 2.2 0 0 1 7.2 8.4H19" />
      </svg>
    );
  }

  if (name === 'timer') {
    return (
      <svg {...common}>
        <circle cx="12" cy="13" r="7" />
        <path d="M12 13V9.5" />
        <path d="M9 3h6" />
        <path d="M12 3v2" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-4" />
      <path d="M12 16V8" />
      <path d="M16 16v-6" />
    </svg>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const current = NAV.find((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)));

  useEffect(() => {
    document.title = `${current?.label || 'Study Tracker'} · Study Tracker`;
  }, [current]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth > 860) setOpen(false);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="app-shell">
      {open ? (
        <button className="backdrop" type="button" aria-label="Закрыть меню" onClick={() => setOpen(false)} />
      ) : null}

      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <span className="brand-mark">S</span>
          <span>
            <strong>Study Tracker</strong>
            <small>Трекер учёбы</small>
          </span>
        </div>

        <nav className="nav-list" aria-label="Разделы">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              onClick={() => setOpen(false)}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <p className="sidebar-note">Данные сохраняются на этом компьютере и остаются после перезапуска.</p>
      </aside>

      <div className="content">
        <header className="topbar">
          <button
            className="menu-btn"
            type="button"
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>
          <strong>{current?.label || 'Study Tracker'}</strong>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
