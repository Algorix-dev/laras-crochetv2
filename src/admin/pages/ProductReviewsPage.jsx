/*
  PRODUCT REVIEWS — View and moderate customer reviews.
  Lara can approve, hide, or delete any review. Star rating + comment.
*/
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, EyeOff, Star, Trash2 } from "lucide-react";
import { useAdmin } from "../AdminData";
import { cx, dateDMY } from "../fmt";
import { Btn, Card, EmptyState, HeadRow, SearchField, StatusDot, PillTabs, useToast } from "../ui";

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

/* ---------- sample seed data ---------- */
const SEED = [
  { id: 1, productId: "", productName: "Wisteria Dress", reviewer: "Amara Okonkwo", rating: 5, comment: "Absolutely beautiful — the quality is better than I expected. Lara really outdid herself with this one!", date: "2024-10-14", status: "approved" },
  { id: 2, productId: "", productName: "Coral Bikini Set", reviewer: "Tolu Adeyemi", rating: 4, comment: "Lovely set, fits true to size. Shipping was a bit slow but the piece was worth the wait.", date: "2024-10-10", status: "approved" },
  { id: 3, productId: "", productName: "Sage Two-Piece", reviewer: "Nkechi Eze", rating: 5, comment: "Got so many compliments at the beach! Will definitely be ordering again.", date: "2024-10-08", status: "pending" },
  { id: 4, productId: "", productName: "Wisteria Dress", reviewer: "Folake Bello", rating: 3, comment: "Nice dress but the color looked slightly different from the photo. Still pretty though.", date: "2024-09-30", status: "pending" },
  { id: 5, productId: "", productName: "Coral Bikini Set", reviewer: "Sade Williams", rating: 1, comment: "This is spam content", date: "2024-09-25", status: "hidden" },
];

const COLS = "grid-cols-[2.5fr_1fr_3fr_1fr_120px]";

export default function ProductReviewsPage() {
  const { demo } = useAdmin();
  const [toast, toastNode] = useToast();
  const [reviews, setReviews] = useState(SEED);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  const counts = {
    all: reviews.length,
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    hidden: reviews.filter((r) => r.status === "hidden").length,
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews.filter((r) => {
      if (tab !== "all" && r.status !== tab) return false;
      return !q || r.productName.toLowerCase().includes(q) || r.reviewer.toLowerCase().includes(q);
    });
  }, [reviews, tab, query]);

  function update(id, status) {
    if (demo) { toast("Sample data — nothing is saved in demo mode."); return; }
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    toast(status === "approved" ? "Review approved." : "Review hidden.");
  }

  function remove(r) {
    if (demo) { toast("Sample data — nothing is saved in demo mode."); return; }
    if (!window.confirm(`Delete this review by ${r.reviewer}?`)) return;
    setReviews((prev) => prev.filter((x) => x.id !== r.id));
    toast("Review deleted.");
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

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <h2 className="text-[22px] font-bold text-[var(--a-ink)]">Product Reviews</h2>
      </div>

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
          <SearchField value={query} onChange={setQuery} placeholder="Search by product or reviewer…" className="w-[240px]" />
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <HeadRow className={cx("h-12", COLS)}>
              <span>Reviewer</span>
              <span>Rating</span>
              <span>Comment</span>
              <span>Status</span>
              <span className="text-center">Actions</span>
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
                    <p className="truncate font-bold">{r.reviewer}</p>
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
                <span className="flex items-center justify-center gap-2">
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
