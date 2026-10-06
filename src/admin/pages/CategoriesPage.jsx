/*
  CATEGORIES — Lara's Figma "Categories" frame.
  "Discover" cards for each category, then every piece in a table.
  Click a category card to filter the table to it.
*/
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CirclePlus, Ellipsis, ListFilter, SquarePen, Trash2, X } from "lucide-react";
import { createCategory, deleteCategory, deleteProduct, getCategories } from "../../api";
import { useAdmin } from "../AdminData";
import { cx, dateDMY, pageCount } from "../fmt";
import { PAGE_SIZE } from "../model";
import { Btn, Card, Checkbox, DropMenu, EmptyState, HeadRow, IconBtn, Pager, PillTabs, SearchField, Thumb, useToast } from "../ui";

const COLS = "grid-cols-[72px_2.4fr_1.3fr_1fr_1fr]";

export default function CategoriesPage() {
  const { models, refresh, demo } = useAdmin();
  const m = models.categories;
  const navigate = useNavigate();
  const location = useLocation();
  const [toast, toastNode] = useToast();

  const [cat, setCat] = useState(() => new URLSearchParams(location.search).get("cat") || "");
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(false);

  // TIP: categories Lara adds herself ("custom"). The five built-in ones come from
  // her products automatically; these extra ones can exist before any piece uses them.
  const [customCats, setCustomCats] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (demo) return;
    getCategories()
      .then((list) => setCustomCats(list.filter((c) => c.custom)))
      .catch(() => {});
  }, [demo]);

  // the cards on screen: built-in + products' categories, then her empty custom ones
  const cards = useMemo(() => {
    const have = new Set(m.cards.map((c) => c.slug));
    const extra = customCats
      .filter((c) => !have.has(c.slug))
      .map((c) => ({ slug: c.slug, label: c.label, count: 0, image: "" }));
    return [...m.cards, ...extra];
  }, [m.cards, customCats]);

  async function addCategory(e) {
    e.preventDefault();
    if (demo) return toast("Sample data — nothing is saved in demo mode.");
    setBusy(true);
    try {
      const made = await createCategory(newName);
      setCustomCats((cur) => [...cur, made]);
      setNewName("");
      setAdding(false);
      toast(`${made.label} was added. You can now pick it when adding a piece.`);
    } catch (err) {
      toast(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function removeCategory(c) {
    if (demo) return toast("Sample data — nothing is saved in demo mode.");
    if (!window.confirm(`Remove the "${c.label}" category?`)) return;
    setBusy(true);
    try {
      await deleteCategory(c.slug);
      setCustomCats((cur) => cur.filter((x) => x.slug !== c.slug));
      if (cat === c.slug) setCat("");
      toast(`${c.label} was removed.`);
    } catch (err) {
      toast(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return m.rows.filter((r) => {
      if (cat && r.category !== cat) return false;
      if (tab === "featured" && !r.featured) return false;
      if (tab === "sale" && !r.onSale) return false;
      if (tab === "out" && !r.outOfStock) return false;
      return !q || r.name.toLowerCase().includes(q);
    });
  }, [m.rows, cat, tab, query]);

  const pages = pageCount(rows.length, PAGE_SIZE);
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  async function remove(row) {
    if (demo) return toast("Sample data — nothing is saved in demo mode.");
    if (!window.confirm(`Delete "${row.name}"? It will disappear from the shop. Past orders keep their record of it.`)) return;
    setBusy(true);
    try {
      await deleteProduct(row.id);
      toast(`${row.name} was deleted.`);
      await refresh();
    } catch (err) {
      toast(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  const toggleOne = (id) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <h2 className="text-[22px] font-bold text-[var(--a-ink)]">Discover</h2>
        <div className="flex flex-wrap gap-3">
          <Btn variant="white" onClick={() => setAdding((v) => !v)} className="h-12 rounded-md px-5">
            <CirclePlus size={22} /> Add Category
          </Btn>
          <Btn as={Link} to="/admin/products/new" className="h-12 rounded-md px-5">
            <CirclePlus size={22} /> Add Product
          </Btn>
          <DropMenu
            trigger={
              <Btn variant="white" className="h-12 rounded-md px-5">
                More Action <Ellipsis size={16} className="rotate-90" />
              </Btn>
            }
            items={[
              { label: "Show all categories", onClick: () => { setCat(""); setPage(1); } },
              { label: "Product list", onClick: () => navigate("/admin/products") },
            ]}
          />
        </div>
      </div>

      {adding && (
        <Card className="mb-5 p-5">
          <form onSubmit={addCategory} className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-[240px] flex-1 flex-col gap-1.5 text-left text-[14px] text-[var(--a-ink)]">
              New category name
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Crop Tops"
                maxLength={40}
                autoFocus
                className="h-11 rounded-md border border-[var(--a-line-strong)] bg-white px-3 text-[15px] outline-none"
              />
            </label>
            <Btn type="submit" disabled={busy || newName.trim().length < 2} className="h-11 rounded-md px-5">
              Save category
            </Btn>
            <Btn type="button" variant="white" onClick={() => { setAdding(false); setNewName(""); }} className="h-11 rounded-md px-5">
              Cancel
            </Btn>
          </form>
          {customCats.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-left text-[14px] text-[var(--a-muted)]">
              <span>Your own categories:</span>
              {customCats.map((c) => (
                <span key={c.slug} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--a-pink)] py-1 pl-3 pr-1.5 text-[var(--a-maroon)]">
                  {c.label}
                  <button type="button" aria-label={`Remove ${c.label}`} disabled={busy} onClick={() => removeCategory(c)} className="flex size-5 items-center justify-center rounded-full hover:bg-white/70">
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const on = cat === c.slug;
          return (
            <button
              key={c.slug}
              type="button"
              onClick={() => {
                setCat(on ? "" : c.slug);
                setPage(1);
              }}
              aria-pressed={on}
              className={cx(
                "flex h-[88px] items-center gap-4 rounded-lg bg-white px-3 text-left shadow-[0_1px_4px_rgba(16,24,40,0.16)] hover:bg-[#fafafa]",
                on && "outline outline-2 -outline-offset-2 outline-[var(--a-maroon)]"
              )}
            >
              <Thumb src={c.image} alt="" size={64} className="rounded border border-[#e5e7eb] bg-white" />
              <span className="flex-1 text-[20px] leading-6 text-[var(--a-ink)]">{c.label}</span>
              <span className="pr-2 text-[13px] text-[var(--a-muted)]">{c.count}</span>
            </button>
          );
        })}
      </div>

      <Card className="mt-8 px-5 pb-6 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PillTabs
            value={tab}
            onChange={(v) => {
              setTab(v);
              setPage(1);
            }}
            tabs={[
              { value: "all", label: "All Product", count: m.counts.all },
              { value: "featured", label: "Featured Products" },
              { value: "sale", label: "On Sale" },
              { value: "out", label: "Out of Stock" },
            ]}
          />
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-3">
            <SearchField
              value={query}
              onChange={(v) => {
                setQuery(v);
                setPage(1);
              }}
              placeholder="Search your product"
              className="w-[200px] max-w-full"
            />
            <DropMenu
              trigger={
                <IconBtn label="Filter by category">
                  <ListFilter size={18} />
                </IconBtn>
              }
              items={[
                { label: "All categories", active: !cat, onClick: () => { setCat(""); setPage(1); } },
                ...cards.map((c) => ({ label: c.label, active: cat === c.slug, onClick: () => { setCat(c.slug); setPage(1); } })),
              ]}
            />
            <IconBtn label="Add a product" onClick={() => navigate("/admin/products/new")}>
              <CirclePlus size={18} />
            </IconBtn>
            <DropMenu
              trigger={
                <IconBtn label="More">
                  <Ellipsis size={18} />
                </IconBtn>
              }
              items={[{ label: "Product list", onClick: () => navigate("/admin/products") }]}
            />
          </div>
        </div>

        <div className="mt-8 overflow-x-auto">
          <div className="min-w-[680px]">
            <HeadRow className={cx("h-14", COLS)}>
              <span>No.</span>
              <span>Product</span>
              <span>Created Date</span>
              <span>Order</span>
              <span>Action</span>
            </HeadRow>

            {visible.length === 0 && (
              <EmptyState
                title={m.rows.length ? "Nothing in this view" : "No pieces yet"}
                text={m.rows.length ? "Pick another category or tab." : "Add your first piece with the Add Product button."}
              />
            )}

            {visible.map((r, i) => (
              <div
                key={r.id}
                className={cx(
                  "grid h-16 items-center border-b border-[var(--a-line-strong)] px-4 text-[15px] text-[var(--a-ink)] hover:bg-[#fafafa]",
                  COLS
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Checkbox label={`Select ${r.name}`} checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} />
                  {(current - 1) * PAGE_SIZE + i + 1}
                </span>
                <button type="button" onClick={() => navigate(`/admin/products/${r.id}`)} className="flex min-w-0 items-center gap-3 text-left">
                  <Thumb src={r.image} alt="" size={40} className="rounded border border-[#e5e7eb] bg-white" />
                  <span className="truncate hover:underline">{r.name}</span>
                </button>
                <span>{r.created ? dateDMY(r.created) : "—"}</span>
                <span>{r.orders}</span>
                <span className="flex items-center justify-start gap-3">
                  <button type="button" aria-label={`Edit ${r.name}`} onClick={() => navigate(`/admin/products/${r.id}`)} className="text-[#4b5563] hover:text-[var(--a-maroon)]">
                    <SquarePen size={17} />
                  </button>
                  <button type="button" aria-label={`Delete ${r.name}`} disabled={busy} onClick={() => remove(r)} className="text-[#4b5563] hover:text-[var(--a-red)] disabled:opacity-50">
                    <Trash2 size={17} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>

        <Pager page={current} pages={pages} onPage={setPage} />
      </Card>
      {toastNode}
    </div>
  );
}

