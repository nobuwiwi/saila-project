import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { CardsPage } from './features/cards/CardsPage';
import { TrashPage } from './features/cards/TrashPage';
import { Layout } from './components/Layout';
import { PrivateRoute } from './components/PrivateRoute';
import { useAuthStore } from './store/authStore';

import { BillingSuccessPage } from './features/billing/BillingSuccessPage';

import { OnboardingPage } from './features/onboarding/OnboardingPage';

function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);

  return (
    <Routes>
      {/* ルートは認証状態に応じてリダイレクト */}
      <Route
        path="/"
        element={
          isAuthenticated
             ? (user?.onboarding_done ? <Navigate to="/cards" replace /> : <Navigate to="/onboarding" replace />)
             : <Navigate to="/login" replace />
        }
      />

      {/* 認証不要 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* 旧パス互換リダイレクト */}
      <Route path="/dashboard" element={<Navigate to="/cards" replace />} />
      <Route path="/workspaces" element={<Navigate to="/cards" replace />} />
      <Route path="/workspaces/:workspaceId/cards" element={<Navigate to="/cards" replace />} />

      {/* 1画面完結のフロー（レイアウトなし・認証要） */}
      <Route element={<PrivateRoute />}>
        <Route path="/billing/success" element={<BillingSuccessPage />} />
        <Route path="/onboarding" element={
          user?.onboarding_done ? <Navigate to="/cards" replace /> : <OnboardingPage />
        } />
      </Route>

      {/* 認証必須 — Layout を親に */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/cards" element={<CardsPage />} />
          <Route path="/trash" element={<TrashPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
