// Bag icon with a proper "filled" state.
// Filled: body is solid, and the outline + top line + handle are drawn in
// lineColor (the section's background) so they stay visible on the fill.
// Empty: same outline-only look as the Lucide ShoppingBag.
export default function BagIcon({
  size = 18,
  filled = false,
  lineColor = '#FFFFFF',
  strokeWidth = 1.5,
  className = '',
}) {
  const line = filled ? lineColor : 'currentColor';
  const w = filled ? strokeWidth + 0.5 : strokeWidth;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke={line}
        strokeWidth={w}
      />
      <path d="M3 6h18" stroke={line} strokeWidth={w} />
      <path d="M16 10a4 4 0 0 1-8 0" stroke={line} strokeWidth={w} />
    </svg>
  );
}