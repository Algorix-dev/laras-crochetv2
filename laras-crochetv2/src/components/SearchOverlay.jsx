import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, normalizeProduct } from '../api';
import { useCurrency } from '../context/CurrencyContext';

/**
 * SearchOverlay — Full-screen search overlay with animated entrance/exit.
 * Filters products as the user types and displays results with images
 * and prices. Clicking a result navigates to the product detail page.
 *
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  // TIP: fetch the real catalog once, the first time the overlay opens
  // (not on every keystroke) — was previously importing a hardcoded
  // static file, so search results never reflected anything Lara
  // added or removed through the real product database.
  useEffect(() => {
    if (open && products.length === 0) {
      getProducts('all')
        .then((data) => setProducts(data.map(normalizeProduct)))
        .catch(() => setProducts([]));
    }
  }, [open, products.length]);

  // TIP: Close the overlay when the user presses Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // TIP: Filter products by matching the query against product names (case-insensitive)
  const matches = query
    ? products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    // TIP: AnimatePresence enables exit animations on the overlay when `open` becomes false
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] overflow-auto bg-[var(--cream)] p-5 md:p-12"
        >
          <div className="mx-auto max-w-3xl">
            {/* TIP: Search input row with icon, text field, and close button */}
            <div className="flex items-center border-b border-[var(--ink)]">
              <Search size={20} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pieces"
                aria-label="Search products"
                className="w-full bg-transparent px-3 py-4 text-xl outline-none"
              />
              <button onClick={onClose} aria-label="Close search">
                <X />
              </button>
            </div>

            {/* TIP: Results list — each item is a clickable button that navigates to the product page */}
            <div className="mt-8 space-y-3">
              {matches.length ? (
                matches.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      navigate(`/product/${p.id}`);
                      onClose();
                    }}
                    className="flex w-full items-center gap-4 border-b border-[var(--line)] pb-3 text-left"
                  >
                    <img
                      src={p.image}
                      alt=""
                      className="h-20 w-16 object-contain bg-[#efece6]"
                    />
                    <span>
                      <b className="block uppercase">{p.name}</b>
                      <small>{formatPrice(p.price)}</small>
                    </span>
                  </button>
                ))
              ) : query ? (
                // TIP: Empty state shown when no products match the query
                <p className="text-[var(--muted)]">No products found</p>
              ) : (
                <p className="text-[var(--muted)]">Start typing to search pieces</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}