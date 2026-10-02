/*
  ENQUIRIES — messages from the enquiry side of the Contact page (payment
  problems, "something else"). Click the email to reply, then mark it:
    New -> Replied -> Closed
*/
import { useEffect, useState } from "react";
import { getEnquiries, updateEnquiryStatus } from "../../api";
import { useAdmin } from "../AdminData";
import { Btn, Card, CardHead, useToast } from "../ui";

const STATUSES = [
  { value: "new", label: "New" },
  { value: "replied", label: "Replied" },
  { value: "closed", label: "Closed" },
];

const select =
  "h-10 rounded-md border border-[#e1e4e8] bg-[var(--a-bg)] px-3 text-[15px] text-[var(--a-ink)] outline-none focus:border-[var(--a-maroon)]";

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const DEMO_ROWS = [
  {
    _id: "e1",
    customerEmail: "ada@example.com",
    topic: "Payment",
    orderRef: "AG-2026-0001",
    message: "I was charged but didn't get a confirmation email.",
    status: "new",
    createdAt: new Date().toISOString(),
  },
];

function Field({ label, children }) {
  if (!children) return null;
  return (
    <div>
      <p className="text-[13px] font-bold text-[var(--a-muted)]">{label}</p>
      <p className="whitespace-pre-line text-[15px] leading-6 text-[var(--a-ink)]">{children}</p>
    </div>
  );
}

export default function EnquiriesPage() {
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
    getEnquiries()
      .then((list) => !cancelled && setRows(list))
      .catch((err) => !cancelled && setLoadError(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message))
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
      const updated = await updateEnquiryStatus(id, status);
      setRows((r) => r.map((x) => (x._id === id ? updated : x)));
      showToast("Status updated.");
    } catch (err) {
      showToast(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message, "error");
    }
  }

  if (loading) return <p className="py-24 text-center text-[16px] text-[var(--a-muted)]">Loading enquiries…</p>;
  if (loadError) {
    return (
      <p role="alert" className="rounded-md bg-[#fff1f2] px-4 py-3 text-[14px] text-[var(--a-red)]">
        {loadError}
      </p>
    );
  }

  const shown = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  const count = (v) => rows.filter((r) => r.status === v).length;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <CardHead title="Enquiries" />
        <p className="mt-2 text-[14px] leading-5 text-[var(--a-muted)]">
          Messages customers send from the Contact page. Click an email to reply, then set the status.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[{ value: "all", label: `All (${rows.length})` }, ...STATUSES.map((s) => ({ value: s.value, label: `${s.label} (${count(s.value)})` }))].map((f) =>
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

      {shown.length === 0 && <p className="py-12 text-center text-[16px] text-[var(--a-muted)]">No enquiries here yet.</p>}

      {shown.map((r) => (
        <Card key={r._id} className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <a href={`mailto:${r.customerEmail}`} className="text-[17px] font-bold text-[var(--a-maroon)] underline">
                {r.customerEmail}
              </a>
              <p className="text-[13px] text-[var(--a-muted)]">
                {r.topic} · {fmtDate(r.createdAt)}
              </p>
            </div>
            <label className="text-[13px] text-[var(--a-muted)]">
              Status
              <select value={r.status} onChange={(e) => changeStatus(r._id, e.target.value)} className={`${select} mt-1 block w-40`}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Order">{r.orderRef}</Field>
            <Field label="Item">{r.itemName}</Field>
          </div>
          <div className="mt-4">
            <Field label="Message">{r.message}</Field>
          </div>
        </Card>
      ))}
      {toastNode}
    </div>
  );
}
