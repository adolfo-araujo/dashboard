export function Logo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#0F3D2E" />
        <path
          d="M7.5 22.5L13 17l4 3.5 7.5-8"
          stroke="#22C55E"
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M19.5 12.5h5v5" stroke="#22C55E" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-lg font-semibold tracking-tight">
        Valtrea <span className="text-primary">Finance</span>
      </span>
    </div>
  )
}
