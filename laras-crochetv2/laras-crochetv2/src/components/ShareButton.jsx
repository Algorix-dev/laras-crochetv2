import { Share2 } from 'lucide-react';

/* TIP: native sharing is used on supported phones; copying is the reliable desktop fallback. */
export async function shareProduct(product) {
  const url = `${window.location.origin}/product/${product.id}`;
  const text = `${product.name} — ${product.price.toLocaleString()} NGN`;

  try {
    /* TIP: navigator.share triggers the native OS share sheet on mobile browsers. */
    if (navigator.share) {
      await navigator.share({
        title: `Lara's Crochet: ${product.name}`,
        text,
        url,
      });
    } else {
      throw new Error('No Web Share');
    }
  } catch (error) {
    /* TIP: the user may have cancelled the native share dialog — that's not an error. */
    if (error.name === 'AbortError') return;

    /* TIP: clipboard fallback for desktop or browsers without Web Share support. */
    await navigator.clipboard?.writeText(url);
    window.dispatchEvent(
      new CustomEvent('lara-toast', { detail: 'Link copied to clipboard!' })
    );
  }
}

export default function ShareButton({ product, className = '' }) {
  return (
    <button
      type="button"
      aria-label={`Share ${product.name}`}
      onClick={(e) => {
        e.stopPropagation();
        shareProduct(product);
      }}
      className={className}
    >
      <Share2 size={17} strokeWidth={1.5} />
    </button>
  );
}