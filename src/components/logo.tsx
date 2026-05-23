export function CarWorldLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="cwg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="55%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#cwg)" />
      <path
        d="M9 22.5l2-4.5c.4-.9 1.3-1.5 2.3-1.5h13.4c1 0 1.9.6 2.3 1.5l2 4.5v3.5c0 .3-.2.5-.5.5h-2c-.3 0-.5-.2-.5-.5V25H12v1.5c0 .3-.2.5-.5.5h-2c-.3 0-.5-.2-.5-.5z"
        fill="#fff"
      />
      <circle cx="14" cy="25.5" r="1.6" fill="#1e3a8a" />
      <circle cx="26" cy="25.5" r="1.6" fill="#b91c1c" />
      <path d="M19 11.5l.7 1.5 1.6.2-1.2 1.1.3 1.6L19 15l-1.4.9.3-1.6-1.2-1.1 1.6-.2z" fill="#fff" />
    </svg>
  );
}
