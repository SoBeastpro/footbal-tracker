import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/useAuth';

const Register = () => {
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const register = useAuth((state) => state.register);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(formData);
      alert('Регистрация успешна! Теперь войдите в систему.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка регистрации.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Регистрация</h2>
        {error && <p className="text-danger text-sm text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Имя" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="input-field" />
          <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required className="input-field" />
          <input type="password" placeholder="Пароль" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required className="input-field" />
          <button type="submit" className="btn-primary">Создать аккаунт</button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Уже есть аккаунт? <button onClick={() => navigate('/login')} className="text-primary font-medium hover:underline">Войти</button>
        </p>
      </div>
    </div>
  );
};

export default Register;