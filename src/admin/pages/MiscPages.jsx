/*
  Two small screens that have no frame in the Figma:
    - Product List   Lara's pieces as photo cards or a compact list — also the
                     place to see every angle photo, enlarge it, search and
                     delete. (It replaced the old separate Product Media page.)
    - ComingSoon     the menu items that aren't designed yet
                     (Coupon Code, Brand, Product Media, Product Reviews,
                     Control Authority).
*/
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CirclePlus, Expand, Hourglass, LayoutGrid, List, Trash2, X } from "lucide-react";
import { deleteProduct } from "../../api";
import { useAdmin } from "../AdminData";
import { titleFor } from "../AdminShell";
import { cx, naira } from "../fmt";
import { Btn, Card, EmptyState, SearchField, useToast } from "../ui";

const ANGLE_LABEL = { front: "Front", left: "Left", right: "Right", back: "Back" };
const ANGLE_KEYS = Object.keys(ANGLE_LABEL);

// the big-photo popup (this used to live on the separate Product Media page)
function Lightbox({ src, alt, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X size={20} />
      </button>
      <img src={src} alt={alt} className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

export function ProductListPage() {
  const { models, refresh, demo } = useAdmin();
  const navigate = useNavigate();
  const [toast, toastNode] = useToast();
  const [query, setQuery] = useState("");
  // TIP: "cards" = one photo card per piece, "rows" = a compact list.
  // The choice is only remembered while this page is open.
  const [view, setView] = useState("cards");
  const [lightbox, setLightbox] = useState(null);

  const all = models.products;
  const pieces = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? all.filter((p) => `${p.name} ${p.categoryLabel || ""}`.toLowerCase().includes(q)) : all;
  }, [all, query]);

  const idOf = (p) => p._id || p.id;
  const openPiece = (p) => navigate(`/admin/products/${idOf(p)}`);
  const anglePhotos = (p) => ANGLE_KEYS.filter((k) => p.views?.[k]).map((k) => ({ key: k, url: p.views[k] }));

  // TIP: "Delete" hides the piece from the shop but keeps its record, so past
  // orders that mention it still make sense (see DELETE /api/products/:id).
  async function remove(p) {
    if (demo) return toast("Sample data — nothing is saved in demo mode.");
    if (!window.confirm(`Delete "${p.name}"? It will disappear from the shop. Past orders keep their record of it.`)) return;
    try {
      await deleteProduct(idOf(p));
      toast(`${p.name} was deleted.`);
      await refresh();
    } catch (err) {
      toast(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message, "error");
    }
  }

  const DeleteBtn = ({ p }) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        remove(p);
      }}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] text-[var(--a-muted)] hover:bg-[#ffe4e6] hover:text-[var(--a-red)]"
    >
      <Trash2 size={15} /> Delete
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <h2 className="text-[22px] font-bold text-[var(--a-ink)]">Your pieces ({all.length})</h2>
        <div className="flex flex-wrap items-center gap-3">
          <SearchField value={query} onChange={setQuery} placeholder="Search pieces…" className="w-[200px]" />
          <div className="flex overflow-hidden rounded-md bg-white shadow-[0_1px_2px_rgba(16,24,40,0.12)]" role="group" aria-label="Choose how to view pieces">
            {[["cards", "Card view", LayoutGrid], ["rows", "List view", List]].map(([val, label, Icon]) => (
              <button
                key={val}
                type="button"
                aria-label={label}
                aria-pressed={view === val}
                onClick={() => setView(val)}
                className={cx("flex h-10 w-10 items-center justify-center", view === val ? "bg-[var(--a-maroon)] text-white" : "text-[var(--a-ink)] hover:bg-[#f3f4f5]")}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
          <Btn as={Link} to="/admin/products/new" className="h-12 rounded-md px-5">
            <CirclePlus size={22} /> Add Product
          </Btn>
        </div>
      </div>

      {pieces.length === 0 ? (
        <Card>
          <EmptyState
            title={all.length ? "No pieces match your search" : "No pieces yet"}
            text={all.length ? "Try a different name or clear the search." : "Add your first piece and it will show up in the shop."}
          />
        </Card>
      ) : view === "rows" ? (
        <Card className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[72px_minmax(0,2fr)_1fr_110px_110px_90px] items-center gap-4 border-b border-[var(--a-line)] bg-[var(--a-pink)] px-4 py-3 text-left text-[15px] text-[var(--a-ink)]">
              <span>Photo</span>
              <span>Piece</span>
              <span>Category</span>
              <span>Price</span>
              <span>Stock</span>
              <span />
            </div>
            {pieces.map((p) => (
              <div
                key={idOf(p)}
                className="grid cursor-pointer grid-cols-[72px_minmax(0,2fr)_1fr_110px_110px_90px] items-center gap-4 border-b border-[var(--a-line)] px-4 py-2.5 text-left text-[15px] text-[var(--a-ink)] hover:bg-[#fafafa]"
                onClick={() => openPiece(p)}
              >
                <span className="flex h-[56px] w-[56px] items-center justify-center rounded bg-[#f6f3f3]">
                  {p.image && <img src={p.image} alt="" className="max-h-full max-w-full object-contain" loading="lazy" />}
                </span>
                <span className="truncate font-bold">{p.name}</span>
                <span className="truncate capitalize">{p.categoryLabel}</span>
                <span>{naira(p.price)}</span>
                <span>{p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}</span>
                <span className="flex justify-end">
                  <DeleteBtn p={p} />
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {pieces.map((p) => {
            const photos = anglePhotos(p);
            return (
              <li key={idOf(p)}>
                <Card className="overflow-hidden">
                  <div role="button" tabIndex={0} onClick={() => openPiece(p)} onKeyDown={(e) => e.key === "Enter" && openPiece(p)} className="block w-full cursor-pointer text-left">
                    <div className="flex h-[220px] items-center justify-center bg-[#f6f3f3]">
                      {p.image && <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain" loading="lazy" />}
                    </div>
                    <div className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[17px] font-bold text-[var(--a-ink)]">{p.name}</p>
                        <p className="text-[15px] font-bold text-[var(--a-ink)]">{naira(p.price)}</p>
                      </div>
                      <p className="mt-0.5 text-[13px] capitalize text-[var(--a-muted)]">
                        {p.categoryLabel} · {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
                        <span className={photos.length === 4 ? "rounded-full bg-[#e7f7ec] px-2.5 py-1 text-[var(--a-green)]" : "rounded-full bg-[#fff4e0] px-2.5 py-1 text-[var(--a-amber)]"}>
                          {photos.length}/4 angle photos
                        </span>
                        {(p.placements || []).map((pl) => (
                          <span key={pl} className="rounded-full bg-[var(--a-pink)] px-2.5 py-1 capitalize text-[var(--a-maroon)]">
                            {pl}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* every angle photo, click one to see it big */}
                  {photos.length > 0 && (
                    <div className="flex gap-2 px-4 pb-3">
                      {photos.map((ph) => (
                        <button
                          key={ph.key}
                          type="button"
                          title={`${ANGLE_LABEL[ph.key]} — view larger`}
                          aria-label={`View ${p.name} ${ANGLE_LABEL[ph.key]} photo larger`}
                          onClick={() => setLightbox({ url: ph.url, alt: `${p.name} — ${ANGLE_LABEL[ph.key]}` })}
                          className="group relative flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded bg-[#f6f3f3] ring-1 ring-[var(--a-line)] hover:ring-[var(--a-maroon)]"
                        >
                          <img src={ph.url} alt="" className="max-h-full max-w-full object-contain" loading="lazy" />
                          <span className="absolute inset-0 hidden items-center justify-center bg-black/35 text-white group-hover:flex">
                            <Expand size={14} />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end border-t border-[var(--a-line)] px-3 py-2">
                    <DeleteBtn p={p} />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {lightbox && <Lightbox src={lightbox.url} alt={lightbox.alt} onClose={() => setLightbox(null)} />}
      {toastNode}
    </div>
  );
}

export function ComingSoonPage() {
  const { pathname } = useLocation();
  return (
    <Card className="mx-auto mt-6 max-w-xl">
      <div className="flex flex-col items-center px-6 py-14 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-[var(--a-pink)] text-[var(--a-maroon)]">
          <Hourglass size={26} />
        </span>
        <h2 className="mt-5 text-[22px] font-bold text-[var(--a-ink)]">{titleFor(pathname)} is coming soon</h2>
        <p className="mt-2 max-w-sm text-[15px] text-[var(--a-muted)]">
          This part of the dashboard isn&rsquo;t designed yet. Everything else in the menu works.
        </p>
        <Btn as={Link} to="/admin" className="mt-6 h-11 rounded-md px-6 text-[15px]">
          Back to the dashboard
        </Btn>
      </div>
    </Card>
  );
}
