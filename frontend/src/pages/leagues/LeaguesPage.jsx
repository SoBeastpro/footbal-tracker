import { useEffect, useState } from 'react';
import { leaguesApi } from '../../api/leagues';
import { useAuth } from '../../store/useAuth';
import { Trophy, RefreshCw, Search, ExternalLink } from 'lucide-react';

const LeaguesPage = () => {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchLeagues = async () => {
    try {
      setLoading(true);
      const data = await leaguesApi.getAll();
      setLeagues(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Не удалось загрузить лиги. Попробуйте позже.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await leaguesApi.sync();
      await fetchLeagues(); // Обновляем список после синхронизации
    } catch (err) {
      alert('Ошибка синхронизации: ' + (err.response?.data?.message || 'Нет доступа'));
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchLeagues();
  }, []);

  // Фильтрация по поиску
  const filteredLeagues = leagues.filter(league =>
    league.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (error) {
    return (
      <main className="flex-1 p-6 flex flex-col items-center justify-center">
        <p className="text-danger text-lg font-medium mb-4">{error}</p>
        <button onClick={fetchLeagues} className="btn-primary w-fit px-6">Попробовать снова</button>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6">
      {/* Шапка страницы */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Футбольные лиги</h2>
        
        <div className="flex gap-3 w-full md:w-auto">
          {/* Поиск */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Поиск лиги..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          {/* Кнопка синхронизации (только для Admin) */}
          {user?.role?.toUpperCase() === 'ADMIN' && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
            >
              <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Синхронизация...' : 'Синхронизировать API'}
            </button>
          )}
        </div>
      </div>

      {/* Состояние загрузки */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : filteredLeagues.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <Trophy className="mx-auto text-gray-400 mb-2" size={48} />
          <p className="text-gray-500">Лиги не найдены</p>
          {user?.role?.toUpperCase() === 'ADMIN' && (
            <button onClick={handleSync} className="mt-4 text-primary font-medium hover:underline">
              Запустить синхронизацию
            </button>
          )}
        </div>
      ) : (
        /* Сетка карточек */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeagues.map((league) => (
            <div key={league.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <img 
                    src={league.logoUrl || 'https://placehold.co/48x48/e2e8f0/64748b?text=⚽'} 
                    alt={league.name}
                    className="w-12 h-12 rounded-full object-cover bg-gray-100"
                    onError={(e) => e.target.src = 'https://placehold.co/48x48/e2e8f0/64748b?text=⚽'}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{league.name}</h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                      league.isCustom ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {league.isCustom ? 'Пользовательская' : 'Официальная'}
                    </span>
                  </div>
                </div>
                
                <button className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition">
                  <ExternalLink size={16} />
                  Открыть таблицу
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default LeaguesPage;