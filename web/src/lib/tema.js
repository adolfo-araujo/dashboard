import { useTema } from '../components/tema'

// Cores dos gráficos (SVG não lê as variáveis CSS do tema): acompanham o tema escolhido.
export const useTemaClaro = () => useTema() === 'claro'

export const coresDoGrafico = (claro) =>
  claro
    ? { texto: '#111827', fraco: '#4B5563', grade: '#D9DDE3', caixa: '#FFFFFF', borda: '#D9DDE3', cursor: 'rgba(0,0,0,0.04)' }
    : { texto: '#F9FAFB', fraco: '#9CA3AF', grade: '#272C34', caixa: '#1C2026', borda: '#272C34', cursor: 'rgba(255,255,255,0.04)' }
