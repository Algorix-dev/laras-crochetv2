/*
  PRODUCT REVIEWS — View and moderate customer reviews.
  Lara can approve, hide, or delete any review. Star rating + comment.
*/
import { useEffect, useMemo, useState } from "react";
import { addManualReview, deleteReview, getAdminReviews, setReviewStatus } from "../../api";
import { Link } from "react-router-dom";
import { CheckCircle, CirclePlus, EyeOff, Star, Trash2 } from "lucide-react";
import { useAdmin } from "../AdminData";
import { cx, dateDMY } from "../fmt";
import { Btn, Card, EmptyState, HeadRow, SearchField, StatusDot, PillTabs, useToast } from "../ui";
import Select from "../../components/Select";

/* ---------- helpers ---------- */

function Stars({ rating, size = 14 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          fill={n <= rating ? "#f5a623" : "none"}
          stroke={n <= rating ? "#f5a623" : "#d1d5db"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

function Avatar({ name }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--a-pink)] text-[13px] font-bold text-[var(--a-maroon)]">
      {initials}
    </span>
  );
}

/* ---------- sample rows (demo mode only) ---------- */
const SEED = [
  { id: 1, productName: "Wisteria Dress", reviewer: "Amara O.", rating: 5, comment: "Absolutely beautiful — the quality is better than I expected.", date: "2026-09-14", status: "approved" },
  { id: 2, productName: "Coral Bikini Set", reviewer: "Tolu A.", rating: 4, comment: "Lovely set, fits true to size.", date: "2026-09-10", status: "pending" },
];

// real review (server) -> row shape this page uses
const fromServer = (r) => ({
  id: r._id,
  productName: r.productName || "Product",
  reviewer: r.reviewerName,
  rating: r.rating,
  comment: [r.title, r.text].filter(Boolean).join(" — "),
  date: String(r.createdAt).slice(0, 10),
  status: r.status,
  manual: r.source === "manual",
});

const COLS = "grid-cols-[2.5fr_1fr_3fr_1fr_120px]";

export default function ProductReviewsPage() {
  const { demo, products } = useAdmin();
  const [toast, toastNode] = useToast();
  const [reviews, setReviews] = useState(demo ? SEED : []);
  const [loading, setLoading] = useState(!demo);
  const [loadError, setLoadError] = useState("");

  // TIP: reviews are written by customers on the product page and land here as
  // "Pending". Only Approved ones are shown on the shop.
  useEffect(() => {
    if (demo) return undefined;
    let cancelled = false;
    getAdminReviews()
      .then((list) => !cancelled && setReviews(list.map(fromServer)))
      .catch((err) => !cancelled && setLoadError(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [demo]);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  // TIP: Lara chooses how the list is ordered. Change SORTS to add another way.
  const [sort, setSort] = useState("newest");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const emptyForm = { productId: "", reviewerName: "", rating: 5, text: "", date: today, status: "approved" };
  const [form, setForm] = useState(emptyForm);

  const counts = {
    all: reviews.length,
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    hidden: reviews.filter((r) => r.status === "hidden").length,
  };

  const SORTS = {
    newest: (a, b) => b.date.localeCompare(a.date),
    oldest: (a, b) => a.date.localeCompare(b.date),
    highest: (a, b) => b.rating - a.rating || b.date.localeCompare(a.date),
    lowest: (a, b) => a.rating - b.rating || b.date.localeCompare(a.date),
    product: (a, b) => a.productName.localeCompare(b.productName) || b.date.localeCompare(a.date),
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews
      .filter((r) => {
        if (tab !== "all" && r.status !== tab) return false;
        return !q || r.productName.toLowerCase().includes(q) || r.reviewer.toLowerCase().includes(q);
      })
      .sort(SORTS[sort]);
  }, [reviews, tab, query, sort]);

  const fail = (err) => toast(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message, "error");

  async function update(id, status) {
    if (demo) { toast("Sample data — nothing is saved in demo mode."); return; }
    try {
      await setReviewStatus(id, status);
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      toast(status === "approved" ? "Review approved." : "Review hidden.");
    } catch (err) {
      fail(err);
    }
  }

  async function submitManual(e) {
    e.preventDefault();
    if (demo) return toast("Sample data — nothing is saved in demo mode.");
    setSaving(true);
    try {
      const made = await addManualReview(form);
      setReviews((prev) => [fromServer(made), ...prev]);
      setForm(emptyForm);
      setAdding(false);
      toast("Review added.");
    } catch (err) {
      fail(err);
    } finally {
      setSaving(false);
    }
  }

  async function remove(r) {
    if (demo) { toast("Sample data — nothing is saved in demo mode."); return; }
    if (!window.confirm(`Delete this review by ${r.reviewer}?`)) return;
    try {
      await deleteReview(r.id);
      setReviews((prev) => prev.filter((x) => x.id !== r.id));
      toast("Review deleted.");
    } catch (err) {
      fail(err);
    }
  }

  const avgRating =
    reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : "—";

  function statusBadge(s) {
    if (s === "approved") return <StatusDot tone="green">Approved</StatusDot>;
    if (s === "hidden") return <StatusDot tone="red">Hidden</StatusDot>;
    return <StatusDot tone="amber">Pending</StatusDot>;
  }

  if (loading) return <p className="py-24 text-center text-[16px] text-[var(--a-muted)]">Loading reviews…</p>;
  if (loadError) {
    return <p role="alert" className="rounded-md bg-[#fff1f2] px-4 py-3 text-[14px] text-[var(--a-red)]">{loadError}</p>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <h2 className="text-[22px] font-bold text-[var(--a-ink)]">Product Reviews</h2>
        <Btn onClick={() => setAdding((v) => !v)} className="h-12 rounded-md px-5">
          <CirclePlus size={22} /> Add Review
        </Btn>
      </div>

      {adding && (
        <Card className="mb-6 p-5">
          <p className="pb-3 text-left text-[15px] text-[var(--a-muted)]">
            For reviews that reached you outside the website, for example in a DM. Pick the date the customer sent it.
          </p>
          <form onSubmit={submitManual} className="grid gap-4 text-left sm:grid-cols-2">
            {[
              ["Piece", <Select key="p" required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="h-11 rounded-md border border-[var(--a-line-strong)] bg-white px-3 text-[15px]">
                <option value="">Choose a piece</option>
                {products.map((p) => <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>)}
              </Select>],
              ["Reviewer name", <input key="n" required maxLength={60} value={form.reviewerName} onChange={(e) => setForm({ ...form, reviewerName: e.target.value })} placeholder="e.g. Amara O." className="h-11 rounded-md border border-[var(--a-line-strong)] bg-white px-3 text-[15px]" />],
              ["Rating", <Select key="r" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} className="h-11 rounded-md border border-[var(--a-line-strong)] bg-white px-3 text-[15px]">
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
              </Select>],
              ["Date received", <input key="d" type="date" max={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-11 rounded-md border border-[var(--a-line-strong)] bg-white px-3 text-[15px]" />],
            ].map(([label, control]) => (
              <label key={label} className="flex flex-col gap-1.5 text-[14px] text-[var(--a-ink)]">
                {label}
                {control}
              </label>
            ))}
            <label className="flex flex-col gap-1.5 text-[14px] text-[var(--a-ink)] sm:col-span-2">
              Review
              <textarea required minLength={5} maxLength={2000} rows={4} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Paste what the customer wrote" className="rounded-md border border-[var(--a-line-strong)] bg-white px-3 py-2 text-[15px]" />
            </label>
            <label className="flex items-center gap-2 text-[14px] text-[var(--a-ink)] sm:col-span-2">
              <input type="checkbox" checked={form.status === "approved"} onChange={(e) => setForm({ ...form, status: e.target.checked ? "approved" : "pending" })} />
              Show it on the shop straight away
            </label>
            <div className="flex gap-3 sm:col-span-2">
              <Btn type="submit" disabled={saving} className="h-11 rounded-md px-5">{saving ? "Saving…" : "Save review"}</Btn>
              <Btn type="button" variant="white" onClick={() => { setAdding(false); setForm(emptyForm); }} className="h-11 rounded-md px-5">Cancel</Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        {[
          { label: "Total reviews", value: reviews.length },
          { label: "Average rating", value: `★ ${avgRating}` },
          { label: "Pending", value: counts.pending },
          { label: "Approved", value: counts.approved },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-[13px] text-[var(--a-muted)]">{s.label}</p>
            <p className="mt-1 text-[28px] font-bold text-[var(--a-ink)]">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Table card */}
      <Card className="px-5 pb-6 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <PillTabs
            value={tab}
            onChange={(v) => setTab(v)}
            tabs={[
              { value: "all", label: "All", count: counts.all },
              { value: "pending", label: "Pending", count: counts.pending },
              { value: "approved", label: "Approved" },
              { value: "hidden", label: "Hidden" },
            ]}
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-[14px] text-[var(--a-muted)]">
              Sort by
              <Select value={sort} onChange={(e) => setSort(e.target.value)} className="h-10 rounded-md border border-[var(--a-line-strong)] bg-white px-2 text-[14px] text-[var(--a-ink)]">
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest rating</option>
                <option value="lowest">Lowest rating</option>
                <option value="product">Product A–Z</option>
              </Select>
            </label>
            <SearchField value={query} onChange={setQuery} placeholder="Search by product or reviewer…" className="w-[240px]" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <HeadRow className={cx("h-12", COLS)}>
              <span>Reviewer</span>
              <span>Rating</span>
              <span>Comment</span>
              <span>Status</span>
              <span>Actions</span>
            </HeadRow>

            {rows.length === 0 && (
              <EmptyState title="No reviews in this view" text="Try a different tab or clear the search." />
            )}

            {rows.map((r) => (
              <div
                key={r.id}
                className={cx("grid min-h-[64px] items-center border-b border-[var(--a-line-strong)] px-4 py-3 text-[15px] text-[var(--a-ink)]", COLS)}
              >
                {/* Reviewer + product */}
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={r.reviewer} />
                  <div className="min-w-0">
                    <p className="truncate font-bold">
                      {r.reviewer}
                      {r.manual && <span className="ml-2 rounded-full bg-[var(--a-pink)] px-2 py-0.5 text-[11px] font-normal text-[var(--a-maroon)]">Added by you</span>}
                    </p>
                    <p className="truncate text-[12px] text-[var(--a-muted)]">{r.productName}</p>
                    <p className="text-[11px] text-[var(--a-muted)]">{dateDMY(r.date)}</p>
                  </div>
                </div>

                {/* Stars */}
                <div>
                  <Stars rating={r.rating} />
                </div>

                {/* Comment */}
                <p className="line-clamp-3 pr-4 text-[13px] leading-5 text-[var(--a-ink)]">{r.comment}</p>

                {/* Status */}
                <span>{statusBadge(r.status)}</span>

                {/* Actions */}
                <span className="flex items-center justify-start gap-2">
                  {r.status !== "approved" && (
                    <button
                      type="button"
                      onClick={() => update(r.id, "approved")}
                      aria-label="Approve"
                      className="flex size-8 items-center justify-center rounded-md text-[var(--a-muted)] hover:bg-[var(--a-green)]/10 hover:text-[var(--a-green)]"
                    >
                      <CheckCircle size={17} />
                    </button>
                  )}
                  {r.status !== "hidden" && (
                    <button
                      type="button"
                      onClick={() => update(r.id, "hidden")}
                      aria-label="Hide"
                      className="flex size-8 items-center justify-center rounded-md text-[var(--a-muted)] hover:bg-[#fff4e0] hover:text-[var(--a-amber)]"
                    >
                      <EyeOff size={17} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(r)}
                    aria-label="Delete"
                    className="flex size-8 items-center justify-center rounded-md text-[var(--a-muted)] hover:bg-[#ffe4e6] hover:text-[var(--a-red)]"
                  >
                    <Trash2 size={17} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
      {toastNode}
    </div>
  );
}
