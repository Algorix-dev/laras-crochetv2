/*
  COUPON CODE — Create, manage and toggle discount codes.
  Lara can issue percentage or fixed-amount coupons, set expiry dates
  and usage limits, and deactivate any code with one click.
*/
import { useEffect, useMemo, useState } from "react";
import { deleteCoupon, getCoupons, saveCoupon as saveCouponApi } from "../../api";
import { CirclePlus, Copy, Pencil, Trash2, X } from "lucide-react";
import { useAdmin } from "../AdminData";
import { cx, dateDMY } from "../fmt";
import { Btn, Card, CardHead, EmptyState, HeadRow, SearchField, StatusDot, useToast } from "../ui";
import Select from "../../components/Select";

/* ---------- helpers ---------- */

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function badgeForStatus(active, expired) {
  if (expired) return <StatusDot tone="amber">Expired</StatusDot>;
  if (active) return <StatusDot tone="green">Active</StatusDot>;
  return <StatusDot tone="red">Inactive</StatusDot>;
}

/* ---------- server shape -> the shape this page uses ---------- */
const fromServer = (c) => ({
  id: c._id,
  code: c.code,
  type: c.type,
  value: c.value,
  minOrder: c.minOrder || "",
  usageLimit: c.usageLimit || "",
  used: c.used || 0,
  expiresAt: c.expiresAt ? String(c.expiresAt).slice(0, 10) : "",
  active: c.active,
});

const DEMO_COUPONS = [
  { id: 1, code: "WELCOME10", type: "percent", value: 10, minOrder: 0, usageLimit: 200, used: 43, expiresAt: "2030-12-31", active: true },
  { id: 2, code: "FLAT5K", type: "fixed", value: 5000, minOrder: 15000, usageLimit: 50, used: 12, expiresAt: "", active: true },
  { id: 3, code: "SUMMER20", type: "percent", value: 20, minOrder: 0, usageLimit: 100, used: 100, expiresAt: "2024-09-01", active: false },
];

/* ---------- blank coupon template ---------- */
const BLANK = {
  code: "",
  type: "percent",   // "percent" | "fixed"
  value: "",
  minOrder: "",
  usageLimit: "",
  expiresAt: "",
  active: true,
};

/* ---------- modal ---------- */
function CouponModal({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial ?? BLANK);
  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const inp = "h-11 w-full rounded-md border border-[#eceef1] bg-[var(--a-bg)] px-3.5 text-[15px] text-[var(--a-ink)] outline-none focus:border-[var(--a-maroon)]";
  const lbl = "mb-1.5 block text-[14px] font-bold text-[var(--a-ink)]";

  function submit(e) {
    e.preventDefault();
    if (!form.code.trim()) return;
    onSave({ ...form, code: form.code.trim().toUpperCase() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[520px] rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h2 className="text-[20px] font-bold text-[var(--a-ink)]">
            {initial ? "Edit coupon" : "New coupon"}
          </h2>
          <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-md text-[var(--a-muted)] hover:bg-[#f3f4f5]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          {/* Code */}
          <div>
            <label className={lbl}>Coupon code</label>
            <div className="flex gap-2">
              <input className={cx(inp, "flex-1")} placeholder="e.g. SUMMER20" value={form.code} onChange={upd("code")} required />
              <Btn variant="white" className="h-11 shrink-0 rounded-md px-3" onClick={() => setForm((f) => ({ ...f, code: randomCode() }))}>
                Generate
              </Btn>
            </div>
          </div>

          {/* Type + value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Discount type</label>
              <Select className={inp} value={form.type} onChange={upd("type")}>
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed amount (₦)</option>
              </Select>
            </div>
            <div>
              <label className={lbl}>{form.type === "percent" ? "Percentage" : "Amount (₦)"}</label>
              <input type="number" min="0" max={form.type === "percent" ? 100 : undefined} step="any" className={inp} placeholder={form.type === "percent" ? "e.g. 20" : "e.g. 5000"} value={form.value} onChange={upd("value")} required />
            </div>
          </div>

          {/* Min order + usage limit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Min order (₦) <span className="font-normal text-[var(--a-muted)]">(optional)</span></label>
              <input type="number" min="0" className={inp} placeholder="e.g. 10000" value={form.minOrder} onChange={upd("minOrder")} />
            </div>
            <div>
              <label className={lbl}>Usage limit <span className="font-normal text-[var(--a-muted)]">(optional)</span></label>
              <input type="number" min="1" className={inp} placeholder="e.g. 100" value={form.usageLimit} onChange={upd("usageLimit")} />
            </div>
          </div>

          {/* Expiry */}
          <div>
            <label className={lbl}>Expiry date <span className="font-normal text-[var(--a-muted)]">(optional)</span></label>
            <input type="date" className={inp} value={form.expiresAt} onChange={upd("expiresAt")} />
          </div>

          {/* Active toggle */}
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" className="size-4 rounded" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
            <span className="text-[15px] text-[var(--a-ink)]">Active — customers can use this code</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Btn variant="white" className="h-11 rounded-md px-5" onClick={onClose}>Cancel</Btn>
            <Btn type="submit" disabled={saving} className="h-11 rounded-md px-5">{saving ? "Saving…" : initial ? "Save changes" : "Create coupon"}</Btn>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- the page ---------- */
const COLS = "grid-cols-[2fr_1fr_1fr_1fr_1fr_100px]";

export default function CouponPage() {
  const { demo } = useAdmin();
  const [toast, toastNode] = useToast();

  // TIP: real coupons live in the database (server/routes/coupons.js).
  // Demo mode shows three sample rows and saves nothing.
  const [coupons, setCoupons] = useState(demo ? DEMO_COUPONS : []);
  const [loading, setLoading] = useState(!demo);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (demo) return undefined;
    let cancelled = false;
    getCoupons()
      .then((list) => !cancelled && setCoupons(list.map(fromServer)))
      .catch((err) => !cancelled && setLoadError(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [demo]);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null); // null | "new" | { coupon }
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? coupons.filter((c) => c.code.toLowerCase().includes(q)) : coupons;
  }, [coupons, query]);

  function isExpired(c) {
    return c.expiresAt && new Date(c.expiresAt) < new Date();
  }

  const fail = (err) => toast(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message, "error");

  async function saveCoupon(data) {
    if (demo) { toast("Sample data — nothing is saved in demo mode."); return; }
    setBusy(true);
    try {
      const saved = fromServer(await saveCouponApi(data, modal?.coupon?.id));
      setCoupons((prev) => (modal?.coupon ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev]));
      toast(modal?.coupon ? "Coupon updated." : "Coupon created.");
      setModal(null);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function remove(c) {
    if (demo) { toast("Sample data — nothing is saved in demo mode."); return; }
    if (!window.confirm(`Delete coupon "${c.code}"? This cannot be undone.`)) return;
    try {
      await deleteCoupon(c.id);
      setCoupons((prev) => prev.filter((x) => x.id !== c.id));
      toast(`"${c.code}" deleted.`);
    } catch (err) {
      fail(err);
    }
  }

  async function toggle(c) {
    if (demo) { toast("Sample data — nothing is saved in demo mode."); return; }
    try {
      const saved = fromServer(await saveCouponApi({ ...c, active: !c.active }, c.id));
      setCoupons((prev) => prev.map((x) => (x.id === c.id ? saved : x)));
    } catch (err) {
      fail(err);
    }
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => toast(`"${code}" copied to clipboard.`));
  }

  if (loading) return <p className="py-24 text-center text-[16px] text-[var(--a-muted)]">Loading coupons…</p>;
  if (loadError) {
    return <p role="alert" className="rounded-md bg-[#fff1f2] px-4 py-3 text-[14px] text-[var(--a-red)]">{loadError}</p>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <h2 className="text-[22px] font-bold text-[var(--a-ink)]">Coupon Codes</h2>
        <Btn className="h-12 rounded-md px-5" onClick={() => setModal("new")}>
          <CirclePlus size={20} /> New coupon
        </Btn>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        {[
          { label: "Total coupons", value: coupons.length },
          { label: "Active", value: coupons.filter((c) => c.active && !isExpired(c)).length },
          { label: "Total uses", value: coupons.reduce((s, c) => s + (c.used || 0), 0) },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-[13px] text-[var(--a-muted)]">{s.label}</p>
            <p className="mt-1 text-[28px] font-bold text-[var(--a-ink)]">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="px-5 pb-6 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <CardHead title={`All coupons (${coupons.length})`} />
          <SearchField value={query} onChange={setQuery} placeholder="Search code…" className="w-[200px]" />
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <HeadRow className={cx("h-12", COLS)}>
              <span>Code</span>
              <span>Discount</span>
              <span>Uses</span>
              <span>Expires</span>
              <span>Status</span>
              <span>Actions</span>
            </HeadRow>

            {rows.length === 0 && (
              <EmptyState title="No coupons found" text="Create your first coupon with the button above." />
            )}

            {rows.map((c) => {
              const exp = isExpired(c);
              return (
                <div key={c.id} className={cx("grid h-14 items-center border-b border-[var(--a-line-strong)] px-4 text-[15px] text-[var(--a-ink)]", COLS)}>
                  <span className="flex items-center gap-2 font-mono font-bold">
                    {c.code}
                    <button type="button" onClick={() => copyCode(c.code)} className="text-[var(--a-muted)] hover:text-[var(--a-maroon)]" aria-label="Copy code">
                      <Copy size={14} />
                    </button>
                  </span>
                  <span>{c.type === "percent" ? `${c.value}%` : `₦${Number(c.value).toLocaleString()}`}</span>
                  <span>{c.used ?? 0}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</span>
                  <span>{c.expiresAt ? dateDMY(c.expiresAt) : "—"}</span>
                  <span>
                    <button type="button" onClick={() => toggle(c)} className="transition-opacity hover:opacity-70">
                      {badgeForStatus(c.active, exp)}
                    </button>
                  </span>
                  <span className="flex items-center justify-start gap-3">
                    <button type="button" aria-label={`Edit ${c.code}`} onClick={() => setModal({ coupon: c })} className="text-[#4b5563] hover:text-[var(--a-maroon)]">
                      <Pencil size={16} />
                    </button>
                    <button type="button" aria-label={`Delete ${c.code}`} onClick={() => remove(c)} className="text-[#4b5563] hover:text-[var(--a-red)]">
                      <Trash2 size={16} />
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {modal && (
        <CouponModal
          initial={modal?.coupon ?? null}
          onSave={saveCoupon}
          saving={busy}
          onClose={() => setModal(null)}
        />
      )}
      {toastNode}
    </div>
  );
}
