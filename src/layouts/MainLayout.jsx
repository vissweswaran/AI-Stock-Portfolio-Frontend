import { NavLink, Outlet } from 'react-router-dom'
import {
  FiActivity,
  FiBarChart2,
  FiBriefcase,
  FiCreditCard,
  FiHome,
  FiPieChart,
  FiShield,
  FiClipboard,
} from 'react-icons/fi'

const menu = [
  { label: 'Dashboard', path: '/', icon: FiHome },
  { label: 'Transactions', path: '/transactions', icon: FiCreditCard },
  { label: 'Holdings', path: '/holdings', icon: FiBriefcase },
  { label: 'Analysis', path: '/analysis', icon: FiActivity },
  { label: 'Fundamental Rules', path: '/fundamental-rules', icon: FiClipboard },
  { label: 'Intelligence', path: '/portfolio-intelligence', icon: FiShield },
  { label: 'Dividends', path: '/dividends', icon: FiBarChart2 },
  { label: 'Portfolio Summary', path: '/summary', icon: FiPieChart },
]

const MainLayout = () => (
  <div className="min-h-screen bg-slate-100 lg:flex">
    <aside className="border-b border-slate-200 bg-white lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">AI Portfolio</h1>
          <p className="text-sm text-slate-500">Analyzer v1.5</p>
        </div>
      </div>

      <nav className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-1">
        {menu.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </aside>

    <div className="min-w-0 flex-1">
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <p className="text-sm text-slate-500">Personal stock portfolio management</p>
      </header>
      <main className="p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  </div>
)

export default MainLayout
