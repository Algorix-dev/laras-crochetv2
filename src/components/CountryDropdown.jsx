/*
  TIP: this is a "controlled" dropdown too (see LogoutModal's comment
  on that pattern) — the parent owns which country is selected via
  `value`/`onChange`, this component just handles the open/closed UI
  and the search-filtering.
*/
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { countries } from '../data/countries';

export default function CountryDropdown({ value, onChange, label = 'Country' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = countries.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative">
      {label && <label className="mb-1 block text-xs text-[var(--muted)]">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between border border-[var(--line)] px-3 py-2.5 text-sm"
      >
        <span>{value.flag} {value.name}</span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full border border-[var(--line)] bg-white shadow-lg">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country"
            className="w-full border-b border-[var(--line)] px-3 py-2 text-sm outline-none"
          />
          <div className="max-h-56 overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                  setQuery('');
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[var(--cream)]"
              >
                <span>{c.flag} {c.name}</span>
                {c.code === value.code && <span aria-hidden="true">✓</span>}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-[var(--muted)]">No matches</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
