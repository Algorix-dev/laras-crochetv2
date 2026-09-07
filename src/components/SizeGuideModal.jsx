/*
  TIP: This was entirely missing from the codebase before — Figma's
  "Size Guide Modal" spec exists, but there was no component for it
  and no "Size guide" trigger link anywhere on the Product Detail
  page to open it. Both are now wired up.

  The "Do you want custom sizing?" row links out to the real Custom
  Orders flow (ContactPage.jsx, ?flow=custom) instead of expanding
  inline here — that flow already asks for measurements as its own
  step, so this deep-links straight to that step (?step=size) rather
  than making the person re-pick a garment type they didn't come here
  to choose.
*/
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ChevronDown } from 'lucide-react';

const SIZE_CHART = [
  { size: 'XS', bust: '32"', waist: '25"', hip: '32"' },
  { size: 'S', bust: '34"', waist: '27"', hip: '37"' },
  { size: 'M', bust: '36"', waist: '29"', hip: '39"' },
  { size: 'L', bust: '38"', waist: '32"', hip: '42"' },
  { size: 'XL', bust: '40"', waist: '34"', hip: '44"' },
  { size: 'XXL', bust: '42"', waist: '36"', hip: '46"' },
];

export default function SizeGuideModal({ onClose }) {
  // TIP: closing on Escape is a small thing but expected of any modal.
  useEffect(() => {
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--ink)]/80 p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[696px] bg-[var(--cream)] p-8 shadow-lg md:p-10"
      >
        <button
          onClick={onClose}
          aria-label="Close size guide"
          className="absolute right-4 top-4 text-[var(--muted)] hover:text-[var(--ink)]"
        >
          <X size={22} />
        </button>

        <h2 className="text-center font-display text-2xl font-bold">Size Chart</h2>

        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr>
              {['Size', 'Bust', 'Waist', 'Hip'].map((col) => (
                <th
                  key={col}
                  className="border border-[var(--line)] bg-white px-6 py-3 text-left font-medium text-[var(--ink)]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SIZE_CHART.map((row) => (
              <tr key={row.size}>
                <td className="border border-[var(--line)] px-6 py-4 text-[var(--muted)]">{row.size}</td>
                <td className="border border-[var(--line)] px-6 py-4 text-[var(--muted)]">{row.bust}</td>
                <td className="border border-[var(--line)] px-6 py-4 text-[var(--muted)]">{row.waist}</td>
                <td className="border border-[var(--line)] px-6 py-4 text-[var(--muted)]">{row.hip}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Link
          to="/contact?flow=custom&step=size"
          onClick={onClose}
          className="mt-6 flex items-center justify-between text-sm font-bold text-[var(--ink)]"
        >
          Do you want custom sizing?
          <ChevronDown size={20} className="-rotate-90" />
        </Link>
      </div>
    </div>
  );
}