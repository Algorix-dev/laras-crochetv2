/*
  ORDER MANAGEMENT — Lara's Figma "Order Management" frame.
    "Order List" header + 4 stat cards + tabs / search / table / pager.
  Click an order id (or a row) to open the details panel, and click a
  status to move the order along.
*/
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUpDown, CirclePlus, Ellipsis, ListFilter, Truck } from "lucide-react";
import { useAdmin } from "../AdminData";
import { downloadCsv } from "../csv";
import { cx, dateDMY, naira, number, pageCount } from "../fmt";
import { ORDER_STATUS_KEYS, PAGE_SIZE, STATUS_LABEL, STATUS_TONE } from "../model";
import OrderDrawer from "../OrderDrawer";
import {
  Btn,
  Card,
  Checkbox,
  Delta,
  DropMenu,
  EmptyState,
  HeadRow,
  IconBtn,
  Kebab,
  Pager,
  PillTabs,
  SearchField,
  StatusDot,
  Thumb,
  useToast,
} from "../ui";

// column starts measured from the Figma frame (1440px wide)
const COLS = "grid-cols-[76px_127px_233px_108px_107px_233px_minmax(120px,1fr)]";
const OPEN = ["pending", "paid", "in_production", "packaging", "shipped"];

const TONE_TEXT = {
  green: "text-[var(--a-green)]",
  amber: "text-[var(--a-amber)]",
  red: "text-[var(--a-red)]",
  ink: "text-[var(--a-text)]",
};

function StatCard({ title, value, children, sub = "Last 7 days" }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[18px] font-bold text-[var(--a-ink)]">{title}</h3>
        <Kebab />
      </div>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-[34px] font-bold leading-10 text-[var(--a-ink)]">{value}</span>
        {children}
      </div>
      <p className="mt-1 text-[14px] text-[var(--a-muted)]">{sub}</p>
    </Card>
  );
}

// the status word, with the little truck. Clicking it changes the status.
function StatusMenu({ order, onChange }) {
  const tone = STATUS_TONE[order.status] || "ink";
  return (
    <DropMenu
      align="left"
      trigger={
        <button
          type="button"
          title="Change status"
          className={cx("inline-flex items-center gap-2 text-[15px] hover:underline", TONE_TEXT[tone])}
        >
          <Truck size={18} strokeWidth={1.8} />
          {STATUS_LABEL[order.status] || order.status}
        </button>
      }
      items={ORDER_STATUS_KEYS.map((key) => ({
        label: STATUS_LABEL[key],
        active: key === order.status,
        onClick: () => onChange(order, key),
      }))}
    />
  );
}

export default function OrdersPage() {
  const { models, setStatus, demo } = useAdmin();
  const location = useLocation();
  const m = models.orders;
  const [toast, toastNode] = useToast();

  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState(() => new URLSearchParams(location.search).get("q") || "");
  const [payment, setPayment] = useState("any"); // any | paid | unpaid
  const [oldestFirst, setOldestFirst] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(() => new Set());
  const [openId, setOpenId] = useState(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = m.rows.filter((r) => {
      if (tab === "completed" && r.status !== "delivered") return false;
      if (tab === "pending" && !OPEN.includes(r.status)) return false;
      if (tab === "canceled" && r.status !== "cancelled") return false;
      if (payment === "paid" && !r.paid) return false;
      if (payment === "unpaid" && r.paid) return false;
      if (!q) return true;
      const o = r.raw;
      return [r.orderId, r.productName, o.customerName, o.customerEmail, o.paystackReference]
        .filter(Boolean)
        .some((text) => String(text).toLowerCase().includes(q));
    });
    if (oldestFirst) list = [...list].reverse();
    return list;
  }, [m.rows, tab, query, payment, oldestFirst]);

  const pages = pageCount(rows.length, PAGE_SIZE);
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const openOrder = m.rows.find((r) => r.key === openId)?.raw || null;

  function exportCsv() {
    downloadCsv(
      `orders-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Order", "Date", "Customer", "Email", "Phone", "Address", "Items", "Total (NGN)", "Payment", "Status"],
      rows.map((r) => [
        r.orderId,
        dateDMY(r.date),
        r.raw.customerName,
        r.raw.customerEmail,
        r.raw.customerPhone,
        r.raw.shippingAddress,
        (r.raw.items || []).map((i) => `${i.name} x${i.quantity || 1}`).join("; "),
        r.price,
        r.paid ? "Paid" : "Unpaid",
        STATUS_LABEL[r.status] || r.status,
      ])
    );
  }

  async function changeStatus(order, status) {
    try {
      await setStatus(order.raw._id, status);
      toast(demo ? "Sample data — not saved." : `${order.orderId} marked as ${STATUS_LABEL[status]}.`);
    } catch (err) {
      toast(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message, "error");
    }
  }

  const toggleOne = (key) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <h2 className="text-[22px] font-bold text-[var(--a-ink)]">Order List</h2>
        <div className="flex gap-3">
          <Btn
            onClick={() => toast("Orders are created when a customer checks out on the shop.")}
            className="h-12 rounded-md px-5 text-[16px]"
          >
            <CirclePlus size={22} /> Add Order
          </Btn>
          <DropMenu
            trigger={
              <Btn variant="white" className="h-12 rounded-md px-5 text-[16px]">
                More Action <Ellipsis size={16} className="rotate-90" />
              </Btn>
            }
            items={[
              { label: "Export as CSV", onClick: exportCsv },
              { label: "Clear filters", onClick: () => { setTab("all"); setQuery(""); setPayment("any"); setPage(1); } },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Orders" value={number(m.stats.total.value)}>
          <Delta value={m.stats.total.delta} />
        </StatCard>
        <StatCard title="New Orders" value={number(m.stats.fresh.value)}>
          <Delta value={m.stats.fresh.delta} />
        </StatCard>
        <StatCard title="Completed Orders" value={number(m.stats.completed.value)}>
          <span className="text-[14px] text-[var(--a-green)]">{m.stats.completed.pct}%</span>
        </StatCard>
        <StatCard title="Canceled Orders" value={number(m.stats.canceled.value)}>
          <Delta value={m.stats.canceled.delta} />
        </StatCard>
      </div>

      <Card className="mt-5 px-6 pb-6 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PillTabs
            value={tab}
            onChange={(v) => {
              setTab(v);
              setPage(1);
            }}
            tabs={[
              { value: "all", label: "All order", count: m.counts.all },
              { value: "completed", label: "Completed" },
              { value: "pending", label: "Pending" },
              { value: "canceled", label: "Canceled" },
            ]}
          />
          <div className="flex items-center gap-3">
            <SearchField
              value={query}
              onChange={(v) => {
                setQuery(v);
                setPage(1);
              }}
              placeholder="Search order report"
              className="w-[264px] max-w-full"
            />
            <DropMenu
              trigger={
                <IconBtn label="Filter by payment">
                  <ListFilter size={18} />
                </IconBtn>
              }
              items={[
                { label: "All payments", active: payment === "any", onClick: () => setPayment("any") },
                { label: "Paid only", active: payment === "paid", onClick: () => setPayment("paid") },
                { label: "Unpaid only", active: payment === "unpaid", onClick: () => setPayment("unpaid") },
              ]}
            />
            <IconBtn label={oldestFirst ? "Showing oldest first" : "Showing newest first"} onClick={() => setOldestFirst((o) => !o)}>
              <ArrowUpDown size={18} />
            </IconBtn>
            <DropMenu
              trigger={
                <IconBtn label="More">
                  <Ellipsis size={18} />
                </IconBtn>
              }
              items={[{ label: "Export as CSV", onClick: exportCsv }]}
            />
          </div>
        </div>

        <div className="mt-8 overflow-x-auto">
          <div className="min-w-[860px]">
            <HeadRow className={cx("h-14", COLS)}>
              <span>No.</span>
              <span className="pl-2.5">Order Id</span>
              <span className="pl-[62px]">Product</span>
              <span className="pl-6">Date</span>
              <span className="relative left-[50px] text-right">Price</span>
              <span className="pl-[110px]">Payment</span>
              <span className="text-center">Status</span>
            </HeadRow>

            {visible.length === 0 && (
              <EmptyState
                title={m.rows.length === 0 ? "No orders yet" : "No orders match"}
                text={
                  m.rows.length === 0
                    ? "When a customer checks out, their order appears here."
                    : "Try a different search or clear the filters."
                }
              />
            )}

            {visible.map((r, i) => (
              <div
                key={r.key}
                className={cx(
                  "grid h-[68px] items-center border-b border-[var(--a-line-strong)] px-4 text-[15px] text-[var(--a-ink)] hover:bg-[#fafafa]",
                  COLS
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Checkbox
                    label={`Select ${r.orderId}`}
                    checked={selected.has(r.key)}
                    onChange={() => toggleOne(r.key)}
                  />
                  {(current - 1) * PAGE_SIZE + i + 1}
                </span>
                <button type="button" onClick={() => setOpenId(r.key)} className="text-left hover:underline">
                  {r.orderId}
                </button>
                <button type="button" onClick={() => setOpenId(r.key)} className="flex min-w-0 items-center gap-3 text-left">
                  <Thumb src={r.image} alt="" size={38} className="rounded border border-[#e5e7eb] bg-white" />
                  <span className="leading-[18px]">
                    {r.productName}
                    {r.extra > 0 && <span className="text-[var(--a-muted)]"> +{r.extra} more</span>}
                  </span>
                </button>
                <span>{dateDMY(r.date)}</span>
                <span className="text-right">{naira(r.price).replace("₦", "")}</span>
                <span className="pl-[110px]">
                  <StatusDot tone={r.paid ? "green" : "red"} plain>
                    {r.paid ? "Paid" : "Unpaid"}
                  </StatusDot>
                </span>
                <span className="flex justify-center">
                  <StatusMenu order={r} onChange={changeStatus} />
                </span>
              </div>
            ))}
          </div>
        </div>

        <Pager page={current} pages={pages} onPage={setPage} />
      </Card>

      <OrderDrawer order={openOrder} onClose={() => setOpenId(null)} />
      {toastNode}
    </div>
  );
}
