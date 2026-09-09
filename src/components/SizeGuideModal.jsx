/*
  TIP: "Do you want custom sizing?" expands INLINE within this same
  modal — per the Figma "Size Guide Modal" frame, it reveals a small
  "Fill in your measurements" table (Size / Bust / Waist / Hip, one
  editable row) and a "Done" button, rather than navigating away to
  the Contact page's Custom Orders flow.
*/
import { useEffect, useState } from 'react';
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
  const [customOpen, setCustomOpen] = useState(false);
  const [measurements, setMeasurements] = useState({ size: '', bust: '', waist: '', hip: '' });

  const updateMeasurement = (key) => (e) =>
    setMeasurements((m) => ({ ...m, [key]: e.target.value }));

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

        <button
          type="button"
          onClick={() => setCustomOpen((v) => !v)}
          aria-expanded={customOpen}
          className="mt-6 flex w-full items-center justify-between text-sm font-bold text-[var(--ink)]"
        >
          Do you want custom sizing?
          <ChevronDown size={20} className={customOpen ? 'rotate-180' : ''} />
        </button>

        {customOpen && (
          <div className="mt-4">
            <p className="mb-2 text-xs text-[var(--muted)]">Fill in your measurements</p>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {['Size', 'Bust', 'Waist', 'Hip'].map((col) => (
                    <th
                      key={col}
                      className="border border-[var(--line)] bg-white px-4 py-2 text-left font-medium text-[var(--ink)]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {['size', 'bust', 'waist', 'hip'].map((key) => (
                    <td key={key} className="border border-[var(--line)] p-0">
                      <input
                        aria-label={key}
                        value={measurements[key]}
                        onChange={updateMeasurement(key)}
                        className="w-full bg-transparent px-4 py-2 text-sm outline-none"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full bg-[var(--ink)] py-3.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-[var(--maroon)]"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}