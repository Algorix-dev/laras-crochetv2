// TIP: this is the plain "Loading products..." style line Lara asked
// for — no logo, no fade-in, just text where the content will appear.
// It's what Shop/Wishlist/Product Detail used to show before
// BrandedLoader replaced every loading moment with the full splash.
// Reserve BrandedLoader for the ONE loading moment per visit that
// shouldShowSplash() (utils/splashOnce.js) says is an actual page
// reload — everything else (switching a Shop tab, clicking in from
// another page) uses this instead, so the section never blanks out
// or takes over the page.
export default function InlineLoader({ text = 'Loading…', minHeight = '40vh' }) {
  return (
    <div
      className="flex items-center justify-center text-sm text-[var(--muted)]"
      style={{ minHeight }}
    >
      {text}
    </div>
  );
}
