import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { Logo } from './logo'
import { useAuth } from '../contexts/auth'
import { api } from '../lib/api'

export function Header({ onOpenAccount }) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  // Mostra o atalho da administração só para quem é admin.
  // Quem decide é a API; esconder o link é só conveniência.
  const { data: adminInfo } = useQuery({
    queryKey: ['admin-me'],
    queryFn: async () => (await api.get('/admin/me')).data,
    enabled: Boolean(user),
    retry: false,
    staleTime: 10 * 60 * 1000,
  })
  const isAdmin = adminInfo?.isAdmin === true

  useEffect(() => {
    if (!open) return
    const onClick = (e) => !menuRef.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase()

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-2"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-semibold leading-tight">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="block text-xs text-muted">{user?.email}</span>
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
              {initials}
            </span>
          </button>
          {open && (
            <div
              role="menu"
              className="absolute right-0 z-40 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-surface-2 py-1 shadow-xl"
            >
              <button
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  onOpenAccount()
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-border"
              >
                <UserRound className="h-4 w-4" /> Minha conta
              </button>
              {isAdmin && (
                <Link
                  role="menuitem"
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-border"
                >
                  <ShieldCheck className="h-4 w-4 text-primary" /> Administração
                </Link>
              )}
              <button
                role="menuitem"
                onClick={logout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-expense hover:bg-border"
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
