/*
  PRODUCT MEDIA — A central gallery of every photo that's been uploaded
  for Lara's products. Grid view with angle labels, delete option,
  and a direct link to the product it belongs to.
*/
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Trash2, X } from "lucide-react";
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
        <div className="ml-auto">
          <SearchField value={query} onChange={setQuery} placeholder="Filter by product…" className="w-[200px]" />
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
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m) => (
            <Card key={m.key} className="group overflow-hidden">
              {/* Photo */}
              <div
                className="relative flex h-[200px] cursor-zoom-in items-center justify-center bg-[#f6f3f3]"
                onClick={() => setLightbox(m)}
              >
                <img
                  src={m.url}
                  alt={`${m.productName} — ${ANGLE_LABEL[m.angle]}`}
                  className="max-h-full max-w-full object-contain transition duration-200 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Angle badge */}
                <span className="absolute left-2 top-2 rounded bg-[var(--a-maroon)] px-2 py-0.5 text-[11px] font-bold uppercase text-white">
                  {ANGLE_LABEL[m.angle]}
                </span>
              </div>

              {/* Meta row */}
              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <p className="min-w-0 flex-1 truncate text-[14px] font-bold text-[var(--a-ink)]">
                  {m.productName}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    to={`/admin/products/${m.productId}`}
                    className="flex size-7 items-center justify-center rounded-md text-[var(--a-muted)] hover:bg-[#f3f4f5] hover:text-[var(--a-maroon)]"
                    aria-label={`Edit ${m.productName}`}
                  >
                    <ExternalLink size={14} />
                  </Link>
                </div>
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
