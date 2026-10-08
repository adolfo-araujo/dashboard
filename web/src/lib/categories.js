import {
  Bitcoin,
  Briefcase,
  Building2,
  Car,
  Coins,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  PiggyBank,
  Receipt,
  Repeat,
  RotateCcw,
  ShoppingBag,
  Store,
  Tag,
  TrendingUp,
  Umbrella,
  UtensilsCrossed,
} from 'lucide-react'

// Mantenha as chaves iguais à lista em api/src/constants/categories.js
export const CATEGORIES = {
  EXPENSE: [
    { key: 'moradia', label: 'Moradia', icon: Home },
    { key: 'alimentacao', label: 'Alimentação', icon: UtensilsCrossed },
    { key: 'transporte', label: 'Transporte', icon: Car },
    { key: 'saude', label: 'Saúde', icon: HeartPulse },
    { key: 'educacao', label: 'Educação', icon: GraduationCap },
    { key: 'lazer', label: 'Lazer', icon: Gamepad2 },
    { key: 'compras', label: 'Compras', icon: ShoppingBag },
    { key: 'contas', label: 'Contas e serviços', icon: Receipt },
    { key: 'assinaturas', label: 'Assinaturas', icon: Repeat },
    { key: 'impostos', label: 'Impostos e taxas', icon: Landmark },
    { key: 'outros', label: 'Outros', icon: Tag },
  ],
  EARNING: [
    { key: 'salario', label: 'Salário', icon: Briefcase },
    { key: 'freelance', label: 'Freelance', icon: Laptop },
    { key: 'vendas', label: 'Vendas', icon: Store },
    { key: 'rendimentos', label: 'Rendimentos', icon: TrendingUp },
    { key: 'presentes', label: 'Presentes', icon: Gift },
    { key: 'reembolso', label: 'Reembolso', icon: RotateCcw },
    { key: 'outros', label: 'Outros', icon: Tag },
  ],
  INVESTMENT: [
    { key: 'renda_fixa', label: 'Renda fixa', icon: Coins },
    { key: 'acoes', label: 'Ações', icon: TrendingUp },
    { key: 'fundos', label: 'Fundos', icon: Building2 },
    { key: 'previdencia', label: 'Previdência', icon: Umbrella },
    { key: 'cripto', label: 'Criptomoedas', icon: Bitcoin },
    { key: 'reserva', label: 'Reserva de emergência', icon: PiggyBank },
    { key: 'outros', label: 'Outros', icon: Tag },
  ],
}

export const UNCATEGORIZED = { key: null, label: 'Sem categoria', icon: Tag }

export function getCategory(type, key) {
  if (!key) return UNCATEGORIZED
  return CATEGORIES[type]?.find((c) => c.key === key) ?? UNCATEGORIZED
}
