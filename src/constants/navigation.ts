import {
  Banknote,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Fuel,
  Home,
  LayoutDashboard,
  Bitcoin,
} from '@lucide/vue'
import type { NavItem } from '@/types/navigation'

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Главная', icon: LayoutDashboard, disabled: false },
  { id: 'refuelings', label: 'Заправки', icon: Fuel, disabled: false },
  { id: 'savings', label: 'Накопления', icon: Banknote, disabled: true },
  { id: 'investments', label: 'Инвестиции', icon: ChartNoAxesCombined, disabled: true },
  { id: 'utilities', label: 'ЖКХ', icon: Home, disabled: true },
  { id: 'business', label: 'Бизнес', icon: BriefcaseBusiness, disabled: true },
  { id: 'cryptocurrency', label: 'Криптавалюта', icon: Bitcoin, disabled: true },
]
