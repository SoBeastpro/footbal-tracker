import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import LeaguesPage from './pages/leagues/LeaguesPage'; // ✅ Подключаем реальную страницу
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Header from './components/layout/Header';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Публичные маршруты */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Защищённые маршруты с общим лейаутом */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          
          <Route path="dashboard" element={
            <>
              <Header title="Дашборд" />
              <Dashboard />
            </>
          } />
          
          {/* ✅ Здесь заменяем заглушку на реальный компонент */}
          <Route path="leagues" element={
            <>
              <Header title="Лиги" />
              <LeaguesPage />
            </>
          } />
          
          {/* Остальные страницы (пока заглушки) */}
          <Route path="teams" element={<> <Header title="Команды" /> <div className="p-6">В разработке</div> </>} />
          <Route path="matches" element={<> <Header title="Матчи" /> <div className="p-6">В разработке</div> </>} />
          <Route path="admin" element={<> <Header title="Админ-панель" /> <div className="p-6">Только для Admin</div> </>} />
        </Route>

        <Route path="*" element={<div className="p-8 text-center">404 — Страница не найдена</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;