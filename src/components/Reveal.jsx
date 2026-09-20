// TIP: <Reveal> no longer runs its own framer-motion animation.
//
// It used to (once: true, so it only ever played once, and it kept a
// separate motion component + IntersectionObserver alive per card). Now it
// just marks its content with the shared `.rv` class and lets the global
// scroll engine (utils/scrollReveal.js) do the rest, so EVERYTHING on the
// site rises the same way:
//   - it rises again every time it scrolls back into view
//   - items that appear together rise one after another (automatic stagger)
//   - it is plain CSS transitions, so it stays light on phones
//
// Props (same names as before, so no caller needs to change):
//   delay - extra seconds before this one starts (added on top of the
//           automatic stagger; usually you don't need it any more)
//   y     - how far below it starts, in px (default comes from index.css)
//   className / as - optional, for the wrapper element
export default function Reveal({
  children,
  delay = 0,
  y,
  className = "",
  as: Tag = "div",
}) {
  return (
    <Tag
      className={className ? `rv ${className}` : "rv"}
      data-rise-delay={delay > 0 ? Math.round(delay * 1000) : undefined}
      style={y ? { "--rise": `${y}px` } : undefined}
    >
      {children}
    </Tag>
  );
}