/*
  CATEGORIES — Lara's Figma "Categories" frame.
  "Discover" cards for each category, then every piece in a table.
  Click a category card to filter the table to it.
*/
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CirclePlus, Ellipsis, ListFilter, SquarePen, Trash2 } from "lucide-react";
import { deleteProduct } from "../../api";
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
    if (!window.confirm(`Hide "${row.name}" from the shop? You can bring it back later from the database.`)) return;
    setBusy(true);
    try {
      await deleteProduct(row.id);
      toast(`${row.name} is hidden from the shop.`);
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
        <div className="flex gap-3">
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {m.cards.slice(0, 8).map((c) => {
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
          <div className="flex items-center gap-3">
            <SearchField
              value={query}
              onChange={(v) => {
                setQuery(v);
                setPage(1);
              }}
              placeholder="Search your product"
              className="w-[200px] max-w-full"
            />
            <IconBtn label="Show all categories" onClick={() => setCat("")}>
              <ListFilter size={18} />
            </IconBtn>
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
              <span className="pl-1">No.</span>
              <span className="pl-16">Product</span>
              <span>Created Date</span>
              <span className="pl-10">Order</span>
              <span className="text-center">Action</span>
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
                <button type="button" onClick={() => navigate(`/admin/products/${r.id}`)} className="flex min-w-0 items-center gap-3 pl-4 text-left">
                  <Thumb src={r.image} alt="" size={40} className="rounded border border-[#e5e7eb] bg-white" />
                  <span className="truncate hover:underline">{r.name}</span>
                </button>
                <span>{r.created ? dateDMY(r.created) : "—"}</span>
                <span className="pl-10">{r.orders}</span>
                <span className="flex items-center justify-center gap-3">
                  <button type="button" aria-label={`Edit ${r.name}`} onClick={() => navigate(`/admin/products/${r.id}`)} className="text-[#4b5563] hover:text-[var(--a-maroon)]">
                    <SquarePen size={17} />
                  </button>
                  <button type="button" aria-label={`Hide ${r.name}`} disabled={busy} onClick={() => remove(r)} className="text-[#4b5563] hover:text-[var(--a-red)] disabled:opacity-50">
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

