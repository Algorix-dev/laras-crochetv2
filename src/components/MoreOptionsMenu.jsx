import { useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { shareProduct } from './ShareButton';

export default function MoreOptionsMenu({ product }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();

  /* TIP: close the menu when the user clicks outside or presses Escape. */
  useEffect(() => {
    const close = (e) => {
      if (
        e.key === 'Escape' ||
        (e.type === 'mousedown' && !ref.current?.contains(e.target))
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);

    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, []);

  /* TIP: execute an action and then close the dropdown in one step. */
  const action = (fn) => {
    fn();
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {/* Three-dot trigger button */}
      <button
        aria-label="More options"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="hover:text-[var(--maroon)]"
      >
        <MoreVertical size={17} strokeWidth={1.5} />
      </button>

      {/* Dropdown menu panel */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-7 z-30 w-40 border border-[var(--line)] bg-white p-1 text-left text-xs shadow-lg"
        >
          <button
            role="menuitem"
            onClick={() => action(() => toggleWishlist(product.id))}
            className="w-full px-3 py-2 text-left hover:bg-[var(--cream)]"
          >
            {isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
          </button>

          <button
            role="menuitem"
            onClick={() => action(() => shareProduct(product))}
            className="w-full px-3 py-2 text-left hover:bg-[var(--cream)]"
          >
            Share
          </button>

          <button
            role="menuitem"
            onClick={() => action(() => navigate(`/product/${product.id}`))}
            className="w-full px-3 py-2 text-left hover:bg-[var(--cream)]"
          >
            View Details
          </button>
        </div>
      )}
    </div>
  );
}