export default function BrandMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 17L17 9"
        stroke="var(--accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M11.5 6.5H8A4.5 4.5 0 0 0 3.5 11v0A4.5 4.5 0 0 0 8 15.5h1"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M14.5 19.5H18A4.5 4.5 0 0 0 22.5 15v0A4.5 4.5 0 0 0 18 10.5h-1"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
