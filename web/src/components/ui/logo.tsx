export function LogoIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Dot */}
      <circle cx="8" cy="14" r="4" fill="currentColor" />
      {/* Wave */}
      <path
        d="M14 10 Q17 6 20 10 Q23 14 20 18 Q17 22 14 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
