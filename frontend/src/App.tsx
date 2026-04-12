import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { WorkspacePage } from './features/workspaces/WorkspacePage';
import { PrivateRoute } from './components/PrivateRoute';
import { useAuthStore } from './store/authStore';

// /workspaces/{id}/cards の仮ページ（次のSTEPで実装）
const CardsPage = () => (
  <div className="min-h-screen bg-[#f7f7f8] flex items-center justify-center">
    <p className="text-gray-500 text-sm">名刺一覧（次のSTEPで実装）</p>
  </div>
);

function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    <Routes>
      {/* 未認証 → /login、認証済み → /workspaces */}
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/workspaces" replace /> : <Navigate to="/login" replace />}
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* 旧 /dashboard → /workspaces にリダイレクト */}
      <Route path="/dashboard" element={<Navigate to="/workspaces" replace />} />

      {/* 認証必須ルート */}
      <Route element={<PrivateRoute />}>
        <Route path="/workspaces" element={<WorkspacePage />} />
        <Route path="/workspaces/:workspaceId/cards" element={<CardsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
