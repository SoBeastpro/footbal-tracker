import { useAuth } from '../../store/useAuth';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Добро пожаловать, {user?.name || 'Пользователь'}!</h1>
      <p className="mb-2">Ваша роль: <span className="font-semibold text-primary uppercase">{user?.role}</span></p>
      <button onClick={() => { logout(); navigate('/login'); }} className="btn-danger w-fit">
        Выйти
      </button>
    </div>
  );
};

export default Dashboard;