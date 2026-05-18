import { useAuth } from '../../store/useAuth';
import { Trophy, Users, Calendar, Bell } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    { label: 'Активные лиги', value: '12', icon: Trophy, color: 'bg-blue-500' },
    { label: 'Команды', value: '48', icon: Users, color: 'bg-green-500' },
    { label: 'Предстоящие матчи', value: '23', icon: Calendar, color: 'bg-orange-500' },
    { label: 'Уведомления', value: '5', icon: Bell, color: 'bg-purple-500' },
  ];

  return (
    <main className="flex-1 p-6">
      {/* Приветствие */}
      <div className="mb-8">
        <h3 className="text-lg text-gray-600">Добро пожаловать,</h3>
        <h1 className="text-3xl font-bold text-gray-900">{user?.name || 'Пользователь'} 👋</h1>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Быстрые действия (зависят от роли) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h4 className="font-semibold text-gray-900 mb-4">Быстрые действия</h4>
        <div className="flex flex-wrap gap-3">
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryHover transition">
              + Добавить матч
            </button>
          )}
          {user?.role === 'admin' && (
            <>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                + Создать лигу
              </button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                Синхронизация с API
              </button>
            </>
          )}
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
            Подписаться на уведомления
          </button>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;