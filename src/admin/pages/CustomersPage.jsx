/*
  CUSTOMERS — Lara's Figma "Customer" and "Customer Details" frames.
  They are one screen: click a row and the details card slides in on the
  right (the "Customer Details" frame); click it again to close it.

  Customers are worked out from orders (one per email address), so
  #CUST001 is simply the first person who ever ordered.
*/
import { useMemo, useState } from "react";
import { Copy, MapPin, MessageSquare, Phone, Trash2, Mail } from "lucide-react";
import { useAdmin } from "../AdminData";
import { AreaChart } from "../charts";
import { cx, compactNumber, dateDots, naira, niceTicks, number, pageCount } from "../fmt";
import { PAGE_SIZE } from "../model";
import { Card, Delta, EmptyState, HeadRow, Kebab, Pager, StatusDot, WeekSwitch, useToast } from "../ui";

const COLS = "grid-cols-[1fr_1.3fr_1.5fr_1fr_1.2fr_1fr_.9fr]";
const STATUS = {
  active: { tone: "green", label: "Active" },
  inactive: { tone: "red", label: "Inactive" },
  vip: { tone: "yellow", label: "VIP" },
};

function StatCard({ title, value, delta, sub = "Last 7 days" }) {
  return (
    <Card className="flex flex-col justify-center px-5 py-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[18px] font-bold text-[var(--a-ink)]">{title}</h3>
        <Kebab />
      </div>
      <div className="mt-1 flex items-baseline gap-2.5">
        <span className="text-[32px] font-bold leading-10 text-[var(--a-ink)]">{value}</span>
        <Delta value={delta} />
      </div>
      <p className="text-[14px] text-[var(--a-muted)]">{sub}</p>
    </Card>
  );
}

function Overview({ overview, today }) {
  const [tab, setTab] = useState("active");
  const [range, setRange] = useState("this");
  const [active, setActive] = useState(today);

  const series = overview.series[tab]?.[range];
  const percent = tab === "conversion";
  const data = series ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, i) => ({ label, value: series[i] })) : null;
  const ticks = niceTicks(series ? Math.max(...series, percent ? 1 : 5) : 5, 5);
  const fmt = (v) => (percent ? `${v}%` : compactNumber(v).toLowerCase());

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[20px] font-bold text-[var(--a-ink)]">Customer Overview</h3>
        <div className="flex items-center gap-3">
          <WeekSwitch value={range} onChange={setRange} />
          <Kebab />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-2 sm:grid-cols-4">
        {overview.stats.map((s) => {
          const on = s.key === tab;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setTab(s.key)}
              className={cx(
                "border-b px-3 pb-2.5 pt-2 text-left",
                on ? "border-b-2 border-[var(--a-maroon)] bg-gradient-to-b from-transparent to-[#f7f7f8]" : "border-[#e5e7eb] hover:bg-[#fafafa]"
              )}
            >
              <span className="block text-[24px] font-bold leading-8 text-[var(--a-ink)]">{s.value}</span>
              <span className="block text-[13px] leading-5 text-[var(--a-muted)]">{s.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex-1">
        {data ? (
          <AreaChart
            data={data}
            ticks={ticks}
            formatTick={fmt}
            formatTip={fmt}
            active={active}
            onActive={setActive}
            height={276}
          />
        ) : (
          <EmptyState title="Visitor numbers aren't reporting yet" text="This chart fills in once the shop has been visited and the server has the latest update." />
        )}
      </div>
    </Card>
  );
}

function Details({ c, onToast }) {
  const initials = String(c.name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const phoneDigits = String(c.phone || "").replace(/\D/g, "");

  async function copy() {
    try {
      await navigator.clipboard.writeText(c.email);
      onToast("Email copied.");
    } catch {
      onToast("Couldn't copy — select it and copy by hand.", "error");
    }
  }

  const box = "flex h-10 items-center gap-2 rounded-md border border-[var(--a-line-strong)] bg-white px-3 text-[14px] text-[var(--a-ink)]";

  return (
    <Card className="self-start p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-[var(--a-pink)] text-[18px] font-bold text-[var(--a-maroon)]">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[18px] font-bold text-[var(--a-ink)]">{c.name}</p>
          <p className="truncate text-[13px] text-[var(--a-muted)]">{c.email}</p>
        </div>
        <button type="button" onClick={copy} aria-label="Copy email" className="text-[var(--a-blue)]">
          <Copy size={16} />
        </button>
      </div>

      <p className="mt-4 text-[14px] text-[var(--a-muted)]">Customer Info</p>
      <div className="mt-2 space-y-2">
        <div className={box}>
          <Phone size={15} /> <span className="truncate">{c.phone || "—"}</span>
        </div>
        <div className={cx(box, "h-auto min-h-10 items-start py-2")}>
          <MapPin size={15} className="mt-0.5 shrink-0" /> <span className="break-words">{c.address || "—"}</span>
        </div>
      </div>

      <p className="mt-4 text-[14px] text-[var(--a-muted)]">Contact</p>
      <div className="mt-2 flex gap-2">
        {phoneDigits && (
          <a
            href={`https://wa.me/${phoneDigits}`}
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
            className="flex size-7 items-center justify-center rounded-full bg-[#25d366] text-white"
          >
            <MessageSquare size={14} />
          </a>
        )}
        <a href={`mailto:${c.email}`} aria-label="Email" className="flex size-7 items-center justify-center rounded-full bg-[var(--a-maroon)] text-white">
          <Mail size={14} />
        </a>
      </div>

      <p className="mt-4 text-[14px] text-[var(--a-muted)]">Activity</p>
      <p className="mt-1 text-[14px] text-[var(--a-ink)]">Registration: {dateDots(c.firstOrder)}</p>
      <p className="mt-2 text-[14px] text-[var(--a-ink)]">Last purchase: {dateDots(c.lastPaid || c.lastOrder)}</p>

      <p className="mt-4 text-[14px] text-[var(--a-muted)]">Order overview</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {[
          ["Total order", c.orders, "text-[var(--a-blue)]"],
          ["Completed", c.completed, "text-[var(--a-green)]"],
          ["Canceled", c.canceled, "text-[var(--a-red)]"],
        ].map(([label, n, color]) => (
          <div key={label} className="rounded-md border border-[var(--a-line-strong)] py-2 text-center">
            <p className="text-[18px] font-bold text-[var(--a-ink)]">{n}</p>
            <p className={cx("text-[12px]", color)}>{label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function CustomersPage() {
  const { models } = useAdmin();
  const m = models.customers;
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [toast, toastNode] = useToast();

  const pages = pageCount(m.rows.length, PAGE_SIZE);
  const current = Math.min(page, pages);
  const visible = useMemo(() => m.rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), [m.rows, current]);
  const selected = m.rows.find((c) => c.id === selectedId) || null;
  const today = new Date().getDay();

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[270px_minmax(0,1fr)]">
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1 xl:grid-rows-3">
          <StatCard title="Total Customers" value={number(m.stats.total.value)} delta={m.stats.total.delta} />
          <StatCard title="New Customers" value={number(m.stats.fresh.value)} delta={m.stats.fresh.delta} />
          <StatCard
            title="Visitor"
            value={m.stats.visitors ? m.stats.visitors.value : "—"}
            delta={m.stats.visitors?.delta}
            sub={m.stats.visitors ? "Last 7 days" : "Not reporting yet"}
          />
        </div>
        <Overview overview={m.overview} today={today} />
      </div>

      {selected && <h2 className="pt-1 text-[20px] font-bold text-[var(--a-ink)]">Customer Details</h2>}

      <div className={cx("grid items-start gap-5", selected && "xl:grid-cols-[minmax(0,1fr)_270px]")}>
        <Card className="px-5 pb-6 pt-5">
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <HeadRow className={cx("h-14 text-center", COLS)}>
                <span>Customer Id</span>
                <span>Name</span>
                <span>Phone</span>
                <span>Order Count</span>
                <span>Total Spend</span>
                <span>Status</span>
                <span>Action</span>
              </HeadRow>

              {visible.length === 0 && <EmptyState title="No customers yet" text="Everyone who orders from the shop shows up here." />}

              {visible.map((c) => {
                const st = STATUS[c.status];
                return (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelectedId(c.id === selectedId ? null : c.id)}
                    className={cx(
                      "grid h-16 cursor-pointer items-center border-b border-[var(--a-line-strong)] px-4 text-center text-[15px] text-[var(--a-ink)] hover:bg-[#f3f4f6]",
                      COLS,
                      c.id === selectedId && "bg-[#f3f4f6]"
                    )}
                  >
                    <span>{c.id}</span>
                    <span className="truncate">{c.name}</span>
                    <span className="truncate">{c.phone}</span>
                    <span>{c.orders}</span>
                    <span>{naira(c.spend)}</span>
                    <span className="flex justify-center">
                      <StatusDot tone={st.tone}>{st.label}</StatusDot>
                    </span>
                    <span className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <a href={`mailto:${c.email}`} aria-label={`Email ${c.name}`} className="text-[#4b5563] hover:text-[var(--a-maroon)]">
                        <MessageSquare size={17} />
                      </a>
                      <button
                        type="button"
                        aria-label={`Delete ${c.name}`}
                        onClick={() => toast("Customers can't be deleted here — they're built from orders, and the orders are kept for your records.", "error")}
                        className="text-[#4b5563] hover:text-[var(--a-red)]"
                      >
                        <Trash2 size={17} />
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <Pager page={current} pages={pages} onPage={setPage} />
        </Card>

        {selected && <Details c={selected} onToast={toast} />}
      </div>
      {toastNode}
    </div>
  );
}
