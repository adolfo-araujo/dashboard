import { Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from './contexts/auth'
import { LoginPage } from './pages/login'
import { SignupPage } from './pages/signup'
import { DashboardPage } from './pages/dashboard'
import { ForgotPasswordPage } from './pages/forgot-password'
import { ResetPasswordPage } from './pages/reset-password'
import { VerifyEmailPage } from './pages/verify-email'
import { VerifyEmailNoticePage } from './pages/verify-email-notice'

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  )
}

function PrivateRoute({ children }) {
  const { user, isInitializing } = useAuth()
  if (isInitializing) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace />
  // conta criada, mas e-mail ainda não confirmado
  if (!user.email_verified_at) return <VerifyEmailNoticePage />
  return children
}

function PublicRoute({ children }) {
  const { user, isInitializing } = useAuth()
  if (isInitializing) return <FullScreenLoader />
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
