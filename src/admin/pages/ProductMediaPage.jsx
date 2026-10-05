/*
  PRODUCT MEDIA — A central gallery of every photo that's been uploaded
  for Lara's products. Grid view with angle labels, delete option,
  and a direct link to the product it belongs to.
*/
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Expand, LayoutGrid, List, X } from "lucide-react";
import { useAdmin } from "../AdminData";
import { cx } from "../fmt";
import { Btn, Card, EmptyState, SearchField, useToast } from "../ui";

const ANGLE_LABEL = { front: "Front", left: "Left", right: "Right", back: "Back" };
const ANGLES = Object.keys(ANGLE_LABEL);

/* ---------- lightbox ---------- */
function Lightbox({ src, alt, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X size={20} />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

/* ---------- filter tabs ---------- */
function FilterPill({ label, active, onClick, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "h-8 rounded-full px-4 text-[14px] transition",
        active
          ? "bg-[var(--a-maroon)] font-bold text-white"
          : "bg-white text-[var(--a-ink)] shadow-[0_1px_2px_rgba(16,24,40,0.12)] hover:bg-[#f9fafb]"
      )}
    >
      {label}
      {count != null && <span className="ml-1 opacity-70">({count})</span>}
    </button>
  );
}

export default function ProductMediaPage() {
  const { models } = useAdmin();
  const [toast, toastNode] = useToast();
  const [query, setQuery] = useState("");
  const [angleFilter, setAngleFilter] = useState("all");
  const [lightbox, setLightbox] = useState(null);
  const navigate = useNavigate();
  // TIP: "grid" shows big photo cards, "list" shows one compact row per photo.
  // The choice is only remembered while this page is open.
  const [view, setView] = useState("grid");

  /* Flatten all product photos into { productId, productName, angle, url } */
  const allMedia = useMemo(() => {
    const out = [];
    for (const p of models.products) {
      const views = p.views || {};
      for (const angle of ANGLES) {
        if (views[angle]) {
          out.push({
            key: `${p._id || p.id}-${angle}`,
            productId: p._id || p.id,
            productName: p.name,
            angle,
            url: views[angle],
          });
        }
      }
    }
    return out;
  }, [models.products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allMedia.filter((m) => {
      if (angleFilter !== "all" && m.angle !== angleFilter) return false;
      return !q || m.productName.toLowerCase().includes(q);
    });
  }, [allMedia, angleFilter, query]);

  const countFor = (a) => allMedia.filter((m) => a === "all" || m.angle === a).length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <h2 className="text-[22px] font-bold text-[var(--a-ink)]">
          Product Media
          <span className="ml-2 text-[16px] font-normal text-[var(--a-muted)]">({allMedia.length} photos)</span>
        </h2>
        <Btn as={Link} to="/admin/products/new" className="h-12 rounded-md px-5">
          + Add Product
        </Btn>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {[["all", "All angles"], ...ANGLES.map((a) => [a, ANGLE_LABEL[a]])].map(([val, label]) => (
          <FilterPill
            key={val}
            label={label}
            active={angleFilter === val}
            onClick={() => setAngleFilter(val)}
            count={countFor(val)}
          />
        ))}
        <div className="ml-auto flex items-center gap-3">
          <SearchField value={query} onChange={setQuery} placeholder="Filter by product…" className="w-[200px]" />
          <div className="flex overflow-hidden rounded-md bg-white shadow-[0_1px_2px_rgba(16,24,40,0.12)]" role="group" aria-label="Choose how to view photos">
            {[["grid", "Grid view", LayoutGrid], ["list", "List view", List]].map(([val, label, Icon]) => (
              <button
                key={val}
                type="button"
                aria-label={label}
                aria-pressed={view === val}
                onClick={() => setView(val)}
                className={cx(
                  "flex h-9 w-10 items-center justify-center",
                  view === val ? "bg-[var(--a-maroon)] text-white" : "text-[var(--a-ink)] hover:bg-[#f3f4f5]"
                )}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            title={allMedia.length ? "No photos match this filter" : "No product photos yet"}
            text={allMedia.length ? "Try a different angle or clear the search." : "Add products and upload their photos to see them here."}
          />
        </Card>
      ) : view === "list" ? (
        <Card className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[88px_minmax(0,2fr)_1fr_120px] items-center gap-4 border-b border-[var(--a-line)] bg-[var(--a-pink)] px-4 py-3 text-left text-[15px] text-[var(--a-ink)]">
              <span>Photo</span>
              <span>Product</span>
              <span>Angle</span>
              <span>Preview</span>
            </div>
            {filtered.map((m) => (
              <div
                key={m.key}
                className="grid cursor-pointer grid-cols-[88px_minmax(0,2fr)_1fr_120px] items-center gap-4 border-b border-[var(--a-line)] px-4 py-2.5 text-left text-[15px] text-[var(--a-ink)] hover:bg-[#fafafa]"
                onClick={() => navigate(`/admin/products/${m.productId}`)}
              >
                <span className="flex h-[64px] w-[64px] items-center justify-center rounded bg-[#f6f3f3]">
                  <img src={m.url} alt="" className="max-h-full max-w-full object-contain" loading="lazy" />
                </span>
                <span className="truncate font-bold">{m.productName}</span>
                <span>{ANGLE_LABEL[m.angle]}</span>
                <span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // don't also open the product
                      setLightbox(m);
                    }}
                    className="inline-flex items-center gap-1.5 text-[var(--a-blue)] hover:underline"
                  >
                    <Expand size={14} /> View photo
                  </button>
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m) => (
            <Card key={m.key} className="group overflow-hidden">
              {/* TIP: clicking the photo now opens the product's details page.
                  The little expand button in the corner opens the big photo. */}
              <div
                className="relative flex h-[200px] cursor-pointer items-center justify-center bg-[#f6f3f3]"
                onClick={() => navigate(`/admin/products/${m.productId}`)}
              >
                <img
                  src={m.url}
                  alt={`${m.productName} — ${ANGLE_LABEL[m.angle]}`}
                  className="max-h-full max-w-full object-contain transition duration-200 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute left-2 top-2 rounded bg-[var(--a-maroon)] px-2 py-0.5 text-[11px] font-bold uppercase text-white">
                  {ANGLE_LABEL[m.angle]}
                </span>
                <button
                  type="button"
                  aria-label={`View ${m.productName} photo larger`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightbox(m);
                  }}
                  className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/90 text-[var(--a-ink)] shadow hover:bg-white"
                >
                  <Expand size={15} />
                </button>
              </div>

              <div className="px-3 py-2.5 text-left">
                <Link
                  to={`/admin/products/${m.productId}`}
                  className="block truncate text-[14px] font-bold text-[var(--a-ink)] hover:underline"
                >
                  {m.productName}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {lightbox && (
        <Lightbox
          src={lightbox.url}
          alt={`${lightbox.productName} — ${ANGLE_LABEL[lightbox.angle]}`}
          onClose={() => setLightbox(null)}
        />
      )}
      {toastNode}
    </div>
  );
}
