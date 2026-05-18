import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuth((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка входа. Проверьте данные.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Вход в Football Manager</h2>
        {error && <p className="text-danger text-sm text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" />
          <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" />
          <button type="submit" className="btn-primary">Войти</button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Нет аккаунта? <button onClick={() => navigate('/register')} className="text-primary font-medium hover:underline">Зарегистрироваться</button>
        </p>
      </div>
    </div>
  );
};

export default Login;