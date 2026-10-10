import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Subjects from './pages/Subjects';
import Timer from './pages/Timer';
import Stats from './pages/Stats';

function NotFound() {
  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1>Страница не найдена</h1>
          <p>Такого раздела в Study Tracker нет.</p>
        </div>
      </header>
      <Link className="btn btn-primary" to="/">На панель</Link>
    </section>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="timer" element={<Timer />} />
          <Route path="stats" element={<Stats />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
