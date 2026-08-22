import { CARD_THEMES } from './cardThemes'

const Card = ({ title, value, subtitle, children, className = '', variant }) => {
  const theme = variant ? CARD_THEMES[variant] : null

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      {theme ? (
        <>
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${theme.gradient}`}
            aria-hidden
          />
          <theme.Icon
            className={`pointer-events-none absolute right-2 bottom-2 h-10 w-10 ${theme.iconClass}`}
            aria-hidden
          />
        </>
      ) : null}

      <div className="relative">
        {title ? <p className="text-sm font-medium text-slate-500">{title}</p> : null}
        {value ? <h2 className="mt-2 text-2xl font-bold text-slate-900">{value}</h2> : null}
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        {children}
      </div>
    </div>
  )
}

export default Card
