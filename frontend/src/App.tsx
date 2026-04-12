import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { PrivateRoute } from './components/PrivateRoute';
import { useAuthStore } from './store/authStore';

const Dashboard = () => {
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-[#f7f7f8] p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">ログイン成功</h1>
        <p className="mt-4 text-gray-600">ようこそ、{user?.display_name || user?.email} さん</p>
        <button 
          onClick={handleLogout}
          className="mt-6 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366f1]"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
};

function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

export default App;
