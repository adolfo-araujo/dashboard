import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { useAuth } from '../contexts/auth'
import { api, getErrorMessage } from '../lib/api'
import { LEGAL } from '../lib/legal'

// Aviso de nova versão dos Termos de uso e da Política de privacidade.
// Aparece para quem aceitou uma versão anterior e registra o novo aceite (data e versão),
// que serve de prova do consentimento. Quem não concordar pode excluir a conta em "Minha conta".
export function TermsUpdateNotice() {
  const { user, refreshUser } = useAuth()
  const [isSaving, setIsSaving] = useState(false)

  if (!user || user.terms_version === LEGAL.version) return null

  const accept = async () => {
    setIsSaving(true)
    try {
      await api.post('/users/me/terms', { version: LEGAL.version })
      await refreshUser()
      toast.success('Obrigado! Aceite registrado.')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível registrar agora. Tente de novo.'))
      setIsSaving(false)
    }
  }

  const link = 'font-semibold text-primary underline-offset-2 hover:underline'

  return (
    <section
      aria-labelledby="terms-update-title"
      className="flex flex-col gap-4 rounded-xl border border-primary/40 bg-primary/5 p-4 sm:flex-row sm:items-center sm:p-5"
    >
      <FileText className="hidden h-6 w-6 shrink-0 text-primary sm:block" aria-hidden="true" />
      <div className="flex-1 text-sm leading-relaxed">
        <h2 id="terms-update-title" className="font-bold text-foreground">
          Atualizamos os Termos de uso e a Política de privacidade
        </h2>
        <p className="mt-1 text-muted">
          Versão de {LEGAL.updatedAt}. Leia os{' '}
          <Link to="/termos" target="_blank" className={link}>
            Termos de uso
          </Link>{' '}
          e a{' '}
          <Link to="/privacidade" target="_blank" className={link}>
            Política de privacidade
          </Link>
          . Se não concordar, você pode excluir sua conta a qualquer momento em Minha conta.
        </p>
      </div>
      <Button onClick={accept} isLoading={isSaving} className="w-full shrink-0 sm:w-auto">
        Li e concordo
      </Button>
    </section>
  )
}
