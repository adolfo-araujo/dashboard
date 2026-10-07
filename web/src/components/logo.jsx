export function Logo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#55B02E" />
        <path
          d="M9 10.5L15.5 23L23.5 9"
          stroke="#fff"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18.5 9H23.5V14"
          stroke="#fff"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-lg font-extrabold tracking-tight">Valtrea</span>
    </div>
  )
}