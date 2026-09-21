/*
  ADD PRODUCT — Lara's Figma "Add Product" frame. The same screen edits an
  existing piece (/admin/products/<id>).

  What is saved (all of it goes to the real API, same as before):
    name · description · price (₦) · category · stock · sizes
    "featured" + "hero" placements on the home page
    the four angle photos (front · left · right · back)
    colours

  What is drawn like the Figma but switched off ("coming soon"), because
  the shop has nothing behind it yet: discounted price, tax, expiry dates,
  product tag, "Unlimited" stock and Save to draft.
*/
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarDays, CirclePlus, Image as ImageIcon, Pencil, RefreshCw, Save, Search, X } from "lucide-react";
import { saveProduct, uploadPhoto } from "../../api";
import { useAdmin } from "../AdminData";
import { cx } from "../fmt";
import { Btn, Card, IconBtn, useDismiss, useToast } from "../ui";

const ANGLES = [
  { key: "front", label: "Front" },
  { key: "left", label: "Left" },
  { key: "right", label: "Right" },
  { key: "back", label: "Back" },
];
const CATEGORY_OPTIONS = [
  ["dresses", "Dresses"],
  ["bikinis", "Bikinis"],
  ["two-pieces", "Two-pieces"],
  ["shirts", "Shirts"],
  ["skirts", "Skirts"],
];
const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const DEFAULT_SIZES = ["XS", "S", "M", "XL", "XXL"];
// the five swatches from the Figma; saved on the piece as hex codes
const SWATCHES = ["#d8ebd0", "#f0d5d8", "#d9dee1", "#efe6c2", "#46494c"];
const SOON = "Coming soon";

const input =
  "h-11 w-full rounded-md border border-[#eceef1] bg-[var(--a-bg)] px-3.5 text-[15px] text-[var(--a-ink)] outline-none focus:border-[var(--a-maroon)] disabled:cursor-not-allowed disabled:opacity-60";

function Field({ label, children, hint, className }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-[15px] font-bold text-[var(--a-ink)]">
        {label} {hint && <span className="font-normal text-[var(--a-muted)]">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Section({ children }) {
  return <h3 className="mb-4 mt-7 text-[22px] font-bold text-[var(--a-ink)] first:mt-0">{children}</h3>;
}

/* ---------------- photos ---------------- */

function Tile({ angle, url, busy, onFile, onClear }) {
  const pick = useRef(null);
  return (
    <div className="relative">
      <input ref={pick} type="file" accept="image/*" hidden onChange={(e) => onFile(angle.key, e.target.files?.[0])} />
      {url ? (
        <div className="relative flex h-[84px] items-center justify-center rounded-md border border-[#e5e7eb] bg-white p-1">
          <img src={url} alt={`${angle.label} view`} className="max-h-full max-w-full object-contain" />
          <button
            type="button"
            onClick={onClear}
            aria-label={`Remove ${angle.label} photo`}
            className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border border-[#d1d5db] bg-white text-[#6a717f] hover:text-[var(--a-red)]"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => pick.current?.click()}
          disabled={busy}
          className="flex h-[84px] w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-[#a8adb5] text-[13px] font-bold text-[var(--a-maroon)] hover:bg-[#fafafa] disabled:opacity-60"
        >
          <CirclePlus size={18} />
          {busy ? "Uploading…" : `Add ${angle.label}`}
        </button>
      )}
    </div>
  );
}

function PhotoPicker({ views, uploading, onFile, onClear }) {
  const pick = useRef(null);
  const front = ANGLES[0];
  return (
    <>
      <Field label="Product Image">
        <div className="relative flex h-[210px] items-center justify-center rounded-md border border-[#e5e7eb] bg-white">
          <input ref={pick} type="file" accept="image/*" hidden onChange={(e) => onFile("front", e.target.files?.[0])} />
          {views.front ? (
            <img src={views.front} alt="Front view" className="max-h-[170px] max-w-[70%] object-contain" />
          ) : (
            <p className="text-[14px] text-[var(--a-muted)]">{uploading.front ? "Uploading…" : "No front photo yet"}</p>
          )}
          <button
            type="button"
            onClick={() => pick.current?.click()}
            className="absolute bottom-3 left-3 inline-flex h-8 items-center gap-2 rounded-md border border-[#e5e7eb] bg-white px-3 text-[13px] text-[var(--a-muted)] hover:bg-[#f9fafb]"
          >
            <ImageIcon size={15} /> Browse
          </button>
          {views.front && (
            <button
              type="button"
              onClick={() => pick.current?.click()}
              className="absolute bottom-3 right-3 inline-flex h-8 items-center gap-2 rounded-md border border-[#e5e7eb] bg-white px-3 text-[13px] text-[var(--a-ink)] shadow-sm hover:bg-[#f9fafb]"
            >
              <RefreshCw size={14} /> Replace
            </button>
          )}
        </div>
      </Field>
      <p className="mb-2 mt-3 text-[13px] text-[var(--a-muted)]">
        Photos are cleaned up automatically (the background is removed). {front.label} is the main photo; the other angles
        are used on the product page and in the home-page carousel.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {ANGLES.slice(1).map((angle) => (
          <Tile
            key={angle.key}
            angle={angle}
            url={views[angle.key]}
            busy={uploading[angle.key]}
            onFile={onFile}
            onClear={() => onClear(angle.key)}
          />
        ))}
      </div>
    </>
  );
}

/* ---------------- top search ("Search product for add") ---------------- */

function PieceSearch({ products, onOpen }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const hits = q.trim() ? products.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6) : [];
  return (
    <div ref={ref} className="relative">
      <label className="flex h-11 w-[240px] max-w-full items-center gap-2 rounded-md border border-[#e5e7eb] bg-white px-3">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search product for add"
          className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
        />
        <Search size={17} />
      </label>
      {open && hits.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full rounded-md bg-white py-1 shadow-[0_4px_18px_rgba(16,24,40,0.18)]">
          {hits.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => onOpen(p.id)} className="w-full px-3 py-2 text-left text-[14px] hover:bg-[#f3f4f5]">
                {p.name} <span className="text-[var(--a-muted)]">— edit</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------- the page ---------------- */

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, loading, refresh, demo } = useAdmin();
  const [toast, toastNode] = useToast();

  const piece = useMemo(() => (id ? products.find((p) => String(p._id || p.id) === id) : null), [id, products]);

  const blank = { front: "", left: "", right: "", back: "" };
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("10");
  const [sizes, setSizes] = useState(DEFAULT_SIZES);
  const [placements, setPlacements] = useState([]);
  const [colors, setColors] = useState([]);
  const [views, setViews] = useState(blank);
  const [uploading, setUploading] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const descRef = useRef(null);

  // fill the form when editing a piece (or start empty on /products/new)
  useEffect(() => {
    if (id && !piece) return;
    setName(piece?.name ?? "");
    setDescription(piece?.description ?? "");
    setPrice(piece?.price != null ? String(piece.price) : "");
    setCategory(piece?.category ?? "");
    setStock(piece?.stock != null ? String(piece.stock) : "10");
    setSizes(piece?.sizes?.length ? piece.sizes : DEFAULT_SIZES);
    setPlacements(piece?.placements ?? []);
    setColors(piece?.colors ?? []);
    setViews(piece?.views ?? blank);
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, piece?._id]);

  const stockNumber = Number(stock) || 0;
  const togglePlacement = (key) => setPlacements((l) => (l.includes(key) ? l.filter((k) => k !== key) : [...l, key]));
  const toggleSize = (s) => setSizes((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s]));
  const toggleColor = (c) => setColors((l) => (l.includes(c) ? l.filter((x) => x !== c) : [...l, c]));

  async function onFile(key, file) {
    if (!file) return;
    setError("");
    setUploading((s) => ({ ...s, [key]: true }));
    try {
      const url = demo ? URL.createObjectURL(file) : await uploadPhoto(file);
      setViews((s) => ({ ...s, [key]: url }));
    } catch (err) {
      setError(err.message === "SESSION_EXPIRED" ? "Your session ended — please sign in again." : `The ${key} photo didn't upload: ${err.message}`);
    } finally {
      setUploading((s) => ({ ...s, [key]: false }));
    }
  }

  async function publish() {
    setError("");
    const priceNumber = Number(price);
    if (!name.trim()) return setError("Give the piece a name.");
    if (!priceNumber || priceNumber < 0) return setError("Enter the price in naira.");
    if (!category) return setError("Choose a category.");
    if (!views.front) return setError("The front photo is required — it's the main photo everywhere.");
    if (Object.values(uploading).some(Boolean)) return setError("Wait for the photos to finish uploading.");

    const missing = ANGLES.filter((a) => !views[a.key]);
    if (missing.length && !window.confirm(`Only ${4 - missing.length} of 4 angle photos are added (missing: ${missing.map((a) => a.label.toLowerCase()).join(", ")}). Publish anyway?`)) {
      return;
    }
    if (demo) return toast("Sample data — nothing is saved in demo mode.");

    setSaving(true);
    try {
      await saveProduct(
        { name: name.trim(), price: priceNumber, category, stock: stockNumber, description, sizes, placements, views, colors },
        piece?._id
      );
      await refresh();
      toast(piece ? "Changes saved." : "Piece published.");
      navigate("/admin/products");
    } catch (err) {
      setError(err.message === "SESSION_EXPIRED" ? "Your session ended — please sign in again." : err.message);
    } finally {
      setSaving(false);
    }
  }

  if (id && !piece) {
    return (
      <Card className="p-8 text-center text-[var(--a-muted)]">
        {loading ? "Loading the piece…" : "That piece wasn't found. It may have been hidden from the shop."}
      </Card>
    );
  }

  const check = "size-[18px] shrink-0 cursor-pointer accent-[#412b2d]";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
        <h2 className="text-[22px] font-bold text-[var(--a-ink)]">{piece ? "Edit Product" : "Add New Product"}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <PieceSearch products={products} onOpen={(pid) => navigate(`/admin/products/${pid}`)} />
          <Btn onClick={publish} disabled={saving} className="h-11 rounded-md px-6 text-[15px]">
            {saving ? "Saving…" : "Publish Product"}
          </Btn>
          <Btn variant="white" disabled title={SOON} className="h-11 rounded-md px-5 text-[15px] disabled:opacity-60">
            <Save size={16} /> Save to draft
          </Btn>
          <IconBtn label="Add a new product" onClick={() => navigate("/admin/products/new")} className="h-11 w-11">
            <CirclePlus size={20} />
          </IconBtn>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-[#fff1f2] px-4 py-3 text-[14px] text-[var(--a-red)]">
          {error}
        </p>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,612fr)_minmax(0,485fr)]">
        <Card className="p-5">
          <Section>Basic Details</Section>
          <Field label="Product Name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={input} placeholder="e.g. Reina" />
          </Field>
          <Field label="Product Description" className="mt-5">
            <div className="relative">
              <textarea
                ref={descRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className={cx(input, "h-auto resize-none py-3 pb-10 leading-6")}
                placeholder="Tell shoppers about the piece"
              />
              <button
                type="button"
                onClick={() => descRef.current?.focus()}
                aria-label="Edit description"
                className="absolute bottom-3 right-3 text-[var(--a-ink)]"
              >
                <Pencil size={18} />
              </button>
            </div>
          </Field>

          <Section>Pricing</Section>
          <Field label="Product Price">
            <div className="flex h-11 items-center rounded-md border border-[#eceef1] bg-[var(--a-bg)] focus-within:border-[var(--a-maroon)]">
              <span className="pl-3.5 text-[15px] text-[var(--a-ink)]">₦</span>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
                inputMode="decimal"
                className="h-full min-w-0 flex-1 bg-transparent px-2 text-[15px] text-[var(--a-ink)] outline-none"
                placeholder="0"
              />
              <span className="mr-3 border-l border-[#d8dbe0] pl-3 text-[14px] text-[var(--a-muted)]">NGN</span>
            </div>
          </Field>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Discounted Price" hint="(Optional)">
              <div className="flex h-11 items-center gap-2 rounded-md border border-[#eceef1] bg-[var(--a-bg)] px-1.5 opacity-60" title={SOON}>
                <span className="flex h-8 w-8 items-center justify-center rounded bg-[var(--a-pink)] text-[14px] font-bold text-[var(--a-ink)]">₦</span>
                <input disabled placeholder="0" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
              </div>
            </Field>
            <Field label="Tax Included">
              <div className="space-y-1 opacity-60" title={SOON}>
                <label className="flex items-center gap-2 text-[15px] font-bold text-[var(--a-ink)]">
                  <input type="radio" disabled defaultChecked className={check} /> Yes
                </label>
                <label className="flex items-center gap-2 text-[15px] text-[var(--a-ink)]">
                  <input type="radio" disabled className={check} /> No
                </label>
              </div>
            </Field>
          </div>

          <Field label="Expiration" className="mt-5">
            <div className="grid gap-5 sm:grid-cols-2 opacity-60" title={SOON}>
              {["Start", "End"].map((label) => (
                <div key={label} className="flex h-11 items-center justify-between rounded-md border border-[#eceef1] bg-[var(--a-bg)] px-3.5 text-[15px] text-[var(--a-muted)]">
                  {label}
                  <CalendarDays size={17} className="text-[var(--a-ink)]" />
                </div>
              ))}
            </div>
          </Field>

          <Section>Inventory</Section>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Stock Quantity">
              <input
                value={stock}
                onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                className={input}
              />
            </Field>
            <Field label="Stock Status">
              <select
                value={stockNumber > 0 ? "in" : "out"}
                onChange={(e) => setStock(e.target.value === "out" ? "0" : stockNumber > 0 ? stock : "1")}
                className={input}
              >
                <option value="in">In Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </Field>
          </div>

          <label className="mt-4 flex items-center gap-3 opacity-60" title={SOON}>
            <span className="relative inline-flex h-6 w-10 items-center rounded-full bg-[#d9d2d3]">
              <i className="ml-1 size-4 rounded-full bg-white shadow" />
            </span>
            <span className="text-[15px] text-[var(--a-ink)]">Unlimited</span>
          </label>

          <Field label="Sizes" className="mt-5">
            <div className="flex flex-wrap gap-2">
              {ALL_SIZES.map((s) => {
                const on = sizes.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSize(s)}
                    aria-pressed={on}
                    className={cx(
                      "h-9 min-w-11 rounded-md border px-3 text-[14px]",
                      on ? "border-[var(--a-maroon)] bg-[var(--a-maroon)] text-white" : "border-[#d1d5db] bg-white text-[var(--a-ink)] hover:bg-[#f9fafb]"
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </Field>

          <label className="mt-5 flex items-center gap-3 text-[15px] text-[var(--a-ink)]">
            <input type="checkbox" checked={placements.includes("featured")} onChange={() => togglePlacement("featured")} className={check} />
            Highlight this product in a featured section.
          </label>
          <label className="mt-3 flex items-center gap-3 text-[15px] text-[var(--a-ink)]">
            <input type="checkbox" checked={placements.includes("hero")} onChange={() => togglePlacement("hero")} className={check} />
            Show this piece in the home page hero carousel.
          </label>

          <div className="mt-6 flex justify-end gap-3">
            <Btn variant="white" disabled title={SOON} className="h-10 rounded-md px-4 text-[14px]">
              <Save size={15} /> Save to draft
            </Btn>
            <Btn onClick={publish} disabled={saving} className="h-10 rounded-md px-5 text-[14px]">
              {saving ? "Saving…" : "Publish Product"}
            </Btn>
          </div>
        </Card>

        <Card className="p-5">
          <Section>Upload Product Image</Section>
          <PhotoPicker views={views} uploading={uploading} onFile={onFile} onClear={(key) => setViews((s) => ({ ...s, [key]: "" }))} />

          <Section>Categories</Section>
          <Field label="Product Categories">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={cx(input, "shadow-[0_1px_2px_rgba(16,24,40,0.08)]")}>
              <option value="">Select your product</option>
              {CATEGORY_OPTIONS.map(([slug, label]) => (
                <option key={slug} value={slug}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Product Tag" className="mt-5">
            <select disabled title={SOON} className={input}>
              <option>Select your product</option>
            </select>
          </Field>

          <p className="mb-3 mt-5 text-[15px] font-bold text-[var(--a-ink)]">Select your color</p>
          <div className="flex gap-3">
            {SWATCHES.map((c) => {
              const on = colors.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleColor(c)}
                  aria-label={`Colour ${c}`}
                  aria-pressed={on}
                  className={cx(
                    "size-10 rounded-md shadow-[0_1px_3px_rgba(16,24,40,0.2)]",
                    on && "outline outline-2 outline-offset-2 outline-[var(--a-maroon)]"
                  )}
                  style={{ background: c }}
                />
              );
            })}
          </div>
        </Card>
      </div>
      {toastNode}
    </div>
  );
}
