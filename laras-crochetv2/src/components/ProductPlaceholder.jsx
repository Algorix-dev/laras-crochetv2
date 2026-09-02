// TIP: this stands in for her real product photography, which
// isn't ready yet. Keeping it as its own tiny component means
// swapping to real <img> tags later is a one-file change —
// every ProductCard and gallery that uses it updates at once.
export default function ProductPlaceholder({ className = '' }) {
  return (
    <div
      className={`bg-[#e9e6e0] flex items-center justify-center ${className}`}
      role="img"
      aria-label="Product photo placeholder"
    >
      <svg width="60%" height="80%" viewBox="0 0 100 220" fill="none">
        <ellipse cx="50" cy="24" rx="14" ry="16" fill="#c7c2b8" />
        <path
          d="M22 46 L50 60 L78 46 L88 90 L66 100 L74 210 L50 220 L26 210 L34 100 L12 90 Z"
          fill="#b9b3a6"
        />
      </svg>
    </div>
  );
}
