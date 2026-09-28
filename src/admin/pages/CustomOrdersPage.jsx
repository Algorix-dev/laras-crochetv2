/*
  CUSTOM ORDERS — what customers send from the custom-order form on the
  Contact page. Lara reads each request, then marks it:
    New -> Contacted (she has replied) -> Closed (done or dropped)
*/
import { useEffect, useState } from "react";
import { getCustomOrders, updateCustomOrderStatus } from "../../api";
import { useAdmin } from "../AdminData";
import { Btn, Card, CardHead, useToast } from "../ui";

const STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
];

// shown at /admin?demo so you can preview the page without real requests
const DEMO_ROWS = [
  {
    _id: "demo1",
    customerEmail: "ada@example.com",
    garmentType: "Two-piece",
    sizeChoice: "Custom",
    customMeasurements: { size: "M", bust: "36", waist: "28", hip: "40" },
    colorNote: "Deep green with gold trim",
    customDetails: "Beach holiday in December, would like a matching cover-up.",
    photoUrls: [],
    status: "new",
    createdAt: new Date().toISOString(),
  },
];

// TIP: to change how the dropdown or filter buttons look, edit this one
// class string (h-10 = height, rounded-md = corners, px-3 = side padding).
const select =
  "h-10 rounded-md border border-[#e1e4e8] bg-[var(--a-bg)] px-3 text-[15px] text-[var(--a-ink)] outline-none focus:border-[var(--a-maroon)]";

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function Field({ label, children }) {
  if (!children) return null;
  return (
    <div>
      <p className="text-[13px] font-bold text-[var(--a-muted)]">{label}</p>
      <p className="text-[15px] leading-6 text-[var(--a-ink)]">{children}</p>
    </div>
  );
}

export default function CustomOrdersPage() {
  const { demo } = useAdmin();
  const [showToast, toastNode] = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (demo) {
      setRows(DEMO_ROWS);
      setLoading(false);
      return;
    }
    let cancelled = false;
    getCustomOrders()
      .then((list) => !cancelled && setRows(list))
      .catch((err) => {
        if (!cancelled) setLoadError(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [demo]);

  async function changeStatus(id, status) {
    if (demo) {
      setRows((r) => r.map((x) => (x._id === id ? { ...x, status } : x)));
      return showToast("Sample data, nothing is saved in demo mode.");
    }
    try {
      const updated = await updateCustomOrderStatus(id, status);
      setRows((r) => r.map((x) => (x._id === id ? updated : x)));
      showToast("Status updated.");
    } catch (err) {
      showToast(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message, "error");
    }
  }

  if (loading) return <p className="py-24 text-center text-[16px] text-[var(--a-muted)]">Loading custom orders…</p>;
  if (loadError) {
    return (
      <p role="alert" className="rounded-md bg-[#fff1f2] px-4 py-3 text-[14px] text-[var(--a-red)]">
        {loadError}
      </p>
    );
  }

  const shown = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  const count = (value) => rows.filter((r) => r.status === value).length;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <CardHead title="Custom orders" />
        <p className="mt-2 text-[14px] leading-5 text-[var(--a-muted)]">
          Requests customers send from the custom-order form. Click an email to reply, then set the status so you can
          see what still needs an answer.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[{ value: "all", label: `All (${rows.length})` }, ...STATUSES.map((s) => ({ value: s.value, label: `${s.label} (${count(s.value)})` }))].map(
            (f) =>
              filter === f.value ? (
                <Btn key={f.value} className="h-10 rounded-md px-4" onClick={() => setFilter(f.value)}>
                  {f.label}
                </Btn>
              ) : (
                <Btn key={f.value} variant="outline" className="h-10 rounded-md px-4" onClick={() => setFilter(f.value)}>
                  {f.label}
                </Btn>
              )
          )}
        </div>
      </Card>

      {shown.length === 0 && (
        <p className="py-12 text-center text-[16px] text-[var(--a-muted)]">No custom orders here yet.</p>
      )}

      {shown.map((r) => {
        const m = r.customMeasurements || {};
        const measurements = [
          m.size && `Size ${m.size}`,
          m.bust && `Bust ${m.bust}`,
          m.waist && `Waist ${m.waist}`,
          m.hip && `Hip ${m.hip}`,
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <Card key={r._id} className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>                
                <a href={`mailto:${r.customerEmail}`}
                  className="text-[17px] font-bold text-[var(--a-maroon)] underline"
                >
                  {r.customerEmail}
                </a>
                <p className="text-[13px] text-[var(--a-muted)]">Sent {fmtDate(r.createdAt)}</p>
              </div>
              <label className="text-[13px] text-[var(--a-muted)]">
                Status
                <select
                  value={r.status}
                  onChange={(e) => changeStatus(r._id, e.target.value)}
                  className={`${select} mt-1 block w-40`}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Piece">{r.garmentType}</Field>
              <Field label="Size">{r.sizeChoice}</Field>
              <Field label="Measurements">{measurements}</Field>
              <Field label="Colour">{r.colorNote}</Field>
            </div>
            <div className="mt-4">
              <Field label="Details">{r.customDetails}</Field>
            </div>

            {r.photoUrls?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {r.photoUrls.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" aria-label="Open photo full size">
                    <img src={url} alt="Customer reference" className="h-24 w-24 rounded-md object-cover" />
                  </a>
                ))}
              </div>
            )}
          </Card>
        );
      })}
      {toastNode}
    </div>
  );
}