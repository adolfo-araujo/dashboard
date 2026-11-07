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
import { TermsPage } from './pages/terms'
import { PrivacyPage } from './pages/privacy'
import { LandingPage } from './pages/landing'
import { AdminPage } from './pages/admin'
import { AccessibilityPage } from './pages/accessibility'
import { HelpPage } from './pages/help'
import { SkipLink } from './components/skip-link'

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  )
}

// Página inicial: visitante vê a apresentação; quem está logado vê o painel
function HomeRoute() {
  const { user, isInitializing } = useAuth()
  if (isInitializing) return <FullScreenLoader />
  if (!user) return <LandingPage />
  // conta criada, mas e-mail ainda não confirmado
  if (!user.email_verified_at) return <VerifyEmailNoticePage />
  return <DashboardPage />
}

function PublicRoute({ children }) {
  const { user, isInitializing } = useAuth()
  if (isInitializing) return <FullScreenLoader />
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <>
      <SkipLink />
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/ajuda" element={<HelpPage />} />
        <Route path="/termos" element={<TermsPage />} />
        <Route path="/privacidade" element={<PrivacyPage />} />
        <Route path="/acessibilidade" element={<AccessibilityPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
