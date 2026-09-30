/*
  ColorOptionsEditor — lets Lara add / rename / remove her own colors (or
  shades) for a piece. Each option is { name, hex }.

  Use it twice in ProductFormPage.jsx, once for colors and once for shades:

    <ColorOptionsEditor
      label="Colors"
      value={form.colorOptions}
      onChange={(colorOptions) => setForm({ ...form, colorOptions })}
    />
    <ColorOptionsEditor
      label="Shades"
      value={form.shadeOptions}
      onChange={(shadeOptions) => setForm({ ...form, shadeOptions })}
    />

  and make sure the form's starting state has `colorOptions: []` and
  `shadeOptions: []` (or the piece's saved ones when editing), and that
  both are included in the object sent to saveProduct().
*/
export default function ColorOptionsEditor({ label, value = [], onChange }) {
  const update = (index, patch) =>
    onChange(value.map((option, i) => (i === index ? { ...option, ...patch } : option)));
  const remove = (index) => onChange(value.filter((_, i) => i !== index));
  const add = () => onChange([...value, { name: '', hex: '#B7A6E8' }]);

  return (
    <div>
      <p className="text-[14px] font-bold text-[var(--a-ink)]">{label}</p>
      <p className="mt-1 text-[13px] text-[var(--a-muted)]">
        Leave empty to use the standard {label.toLowerCase()} on the product page.
      </p>

      <ul className="mt-3 space-y-2">
        {value.map((option, index) => (
          <li key={index} className="flex items-center gap-3">
            <input
              type="color"
              aria-label={`${label} ${index + 1} color`}
              value={option.hex}
              onChange={(e) => update(index, { hex: e.target.value })}
              className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-[#e1e4e8] bg-white p-1"
            />
            <input
              type="text"
              aria-label={`${label} ${index + 1} name`}
              placeholder="Name, e.g. Lavender"
              value={option.name}
              onChange={(e) => update(index, { name: e.target.value })}
              className="h-10 min-w-0 flex-1 rounded-md border border-[#e1e4e8] bg-white px-3 text-[15px] outline-none focus:border-[var(--a-maroon)]"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              className="text-[14px] font-bold text-[var(--a-red)] underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={add}
        className="mt-3 rounded-md border border-[#e1e4e8] bg-white px-4 py-2 text-[14px] font-bold text-[var(--a-ink)] hover:border-[var(--a-maroon)]"
      >
        + Add {label.toLowerCase().replace(/s$/, '')}
      </button>
    </div>
  );
}