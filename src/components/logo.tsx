export function RoosterLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#7f1620" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#rg)" />
      <path
        d="M11 22c0-5 4-9 9-9 1.6 0 3 .3 4.3 1l3.7-3 .6 4.5c1 1.4 1.4 3 1.4 4.6 0 1.7-.5 3.2-1.4 4.5l1.4 3-3.6-.7c-1.3 1-2.8 1.5-4.4 1.5-1.8 0-3.5-.6-4.8-1.7l-3.6.7 1.5-3.4C11.4 25 11 23.6 11 22z"
        fill="#fff"
      />
      <circle cx="22" cy="20" r="1.4" fill="#7f1620" />
      <path d="M27 18l3-1-2 2.5 2 1-3 .5z" fill="#f59e0b" />
    </svg>
  );
}
