import {
  FiActivity,
  FiBriefcase,
  FiClock,
  FiDollarSign,
  FiHash,
  FiLayers,
  FiPauseCircle,
  FiPieChart,
  FiRepeat,
  FiSearch,
  FiShoppingCart,
  FiTrendingUp,
} from 'react-icons/fi'

export const CARD_THEMES = {
  investment: {
    Icon: FiBriefcase,
    gradient: 'from-blue-50 via-white to-white',
    iconClass: 'text-blue-100',
  },
  portfolio: {
    Icon: FiPieChart,
    gradient: 'from-indigo-50 via-white to-white',
    iconClass: 'text-indigo-100',
  },
  profit: {
    Icon: FiTrendingUp,
    gradient: 'from-emerald-50 via-white to-white',
    iconClass: 'text-emerald-100',
  },
  'profit-percent': {
    Icon: FiActivity,
    gradient: 'from-teal-50 via-white to-white',
    iconClass: 'text-teal-100',
  },
  xirr: {
    Icon: FiTrendingUp,
    gradient: 'from-violet-50 via-white to-white',
    iconClass: 'text-violet-100',
  },
  holdings: {
    Icon: FiLayers,
    gradient: 'from-orange-50 via-white to-white',
    iconClass: 'text-orange-100',
  },
  transactions: {
    Icon: FiRepeat,
    gradient: 'from-cyan-50 via-white to-white',
    iconClass: 'text-cyan-100',
  },
  dividend: {
    Icon: FiDollarSign,
    gradient: 'from-amber-50 via-white to-white',
    iconClass: 'text-amber-100',
  },
  analysis: {
    Icon: FiClock,
    gradient: 'from-slate-100 via-white to-white',
    iconClass: 'text-slate-200',
  },
  'buy-opportunities': {
    Icon: FiShoppingCart,
    gradient: 'from-green-50 via-white to-white',
    iconClass: 'text-green-100',
  },
  hold: {
    Icon: FiPauseCircle,
    gradient: 'from-sky-50 via-white to-white',
    iconClass: 'text-sky-100',
  },
  review: {
    Icon: FiSearch,
    gradient: 'from-yellow-50 via-white to-white',
    iconClass: 'text-yellow-100',
  },
  quantity: {
    Icon: FiHash,
    gradient: 'from-purple-50 via-white to-white',
    iconClass: 'text-purple-100',
  },
}
