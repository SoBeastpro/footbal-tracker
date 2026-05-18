import api from './axios';

export const leaguesApi = {
  // Получить все лиги
  getAll: async () => {
    const { data } = await api.get('/leagues');
    return data.leagues || data || [];
  },
  
  // Синхронизация с football-data.org (только Admin)
  sync: async () => {
    const { data } = await api.post('/standings/sync');
    return data;
  }
};