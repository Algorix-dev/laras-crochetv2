/*
  TRANSACTION — Lara's Figma "Transaction" frame.
  4 stat cards + the payment-method card, then every payment in a table.
  Payments go through Paystack, so the "card" shown here is Paystack (the
  template's fake bank card is not real data).
*/
import { useMemo, useState } from "react";
import { ArrowUpDown, Ellipsis, ExternalLink, ListFilter } from "lucide-react";
import { useAdmin } from "../AdminData";
import { cx, dateDMY, naira, number, pageCount } from "../fmt";
import { PAGE_SIZE } from "../model";
import OrderDrawer from "../OrderDrawer";
import { Card, Delta, DropMenu, EmptyState, HeadRow, IconBtn, Kebab, Pager, PillTabs, SearchField, StatusDot } from "../ui";

const COLS = "grid-cols-[1fr_1.4fr_1.1fr_1fr_1fr_1.1fr_1.1fr]";
const STATUS = {
  complete: { tone: "green", label: "Complete" },
  canceled: { tone: "red", label: "Canceled" },
  pending: { tone: "yellow", label: "Pending" },
};

function Stat({ title, value, children }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[18px] font-bold text-[var(--a-ink)]">{title}</h3>
        <Kebab />
      </div>
      <div className="mt-2 flex items-baseline gap-2.5">
        <span className="text-[32px] font-bold leading-10 text-[var(--a-ink)]">{value}</span>
        {children}
      </div>
      <p className="mt-1 text-[14px] text-[var(--a-muted)]">Last 7 days</p>
    </Card>
  );
}

function PaystackCard({ gateway, onView }) {
  return (
    <Card className="p-4 xl:row-span-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[18px] font-bold text-[var(--a-ink)]">Payment Method</h3>
        <Kebab />
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <div>
          <div className="relative h-[130px] overflow-hidden rounded-lg bg-gradient-to-br from-[#5a3a3d] via-[#412b2d] to-[#2f1f21] p-4 text-white shadow-md">
            <span className="absolute -right-8 -top-10 size-32 rotate-45 rounded-3xl bg-white/[0.07]" />
            <span className="absolute -bottom-12 left-16 size-32 rotate-45 rounded-3xl bg-white/[0.05]" />
            <div className="relative flex items-start justify-between">
              <span className="text-[15px]">Paystack</span>
              <span className="flex">
                <i className="size-5 rounded-full bg-white/90" />
                <i className="-ml-2 size-5 rounded-full bg-[var(--a-pink)]/70" />
              </span>
            </div>
            <p className="relative mt-3 text-[13px] tracking-[0.18em] text-white/85">CARD · BANK · USSD</p>
            <div className="relative mt-2 flex items-end justify-between text-[10px] text-white/70">
              <div>
                <p>Account name</p>
                <p className="text-[12px] font-bold text-white">Lara&rsquo;s Crochet</p>
              </div>
              <div className="text-right">
                <p>Currency</p>
                <p className="text-[12px] font-bold text-white">NGN</p>
              </div>
            </div>
          </div>
          <a
            href="https://dashboard.paystack.com"
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--a-line-strong)] bg-white text-[15px] text-[var(--a-ink)] hover:bg-[#f9fafb]"
          >
            <ExternalLink size={16} /> Open Paystack
          </a>
        </div>

        <div className="space-y-1 text-[14px] text-[var(--a-text)]">
          <p>
            Status: <span className="text-[var(--a-green)]">Active</span>
          </p>
          <p>
            Transactions: <b className="text-[var(--a-ink)]">{number(gateway.transactions)}</b>
          </p>
          <p>
            Revenue: <b className="text-[var(--a-ink)]">{gateway.revenue}</b>
          </p>
          <button type="button" onClick={onView} className="text-[var(--a-blue)] hover:underline">
            View Transactions
          </button>
        </div>
      </div>
    </Card>
  );
}

export default function TransactionsPage() {
  const { models } = useAdmin();
  const m = models.transactions;

  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [oldestFirst, setOldestFirst] = useState(false);
  const [methodFilter, setMethodFilter] = useState("any");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);

  const methods = useMemo(() => [...new Set(m.rows.map((r) => r.method).filter((x) => x && x !== "—"))], [m.rows]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = m.rows.filter((r) => {
      if (tab === "completed" && r.status !== "complete") return false;
      if (tab === "pending" && r.status !== "pending") return false;
      if (tab === "canceled" && r.status !== "canceled") return false;
      if (methodFilter !== "any" && r.method !== methodFilter) return false;
      if (!q) return true;
      return [r.customer, r.name, r.method, r.raw.paystackReference].filter(Boolean).some((t) => String(t).toLowerCase().includes(q));
    });
    if (oldestFirst) list = [...list].reverse();
    return list;
  }, [m.rows, tab, query, methodFilter, oldestFirst]);

  const pages = pageCount(rows.length, PAGE_SIZE);
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const openOrder = m.rows.find((r) => r.key === openId)?.raw || null;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,269fr)_minmax(0,269fr)_minmax(0,540fr)]">
        <Stat title="Total Revenue" value={m.stats.revenue.value}>
          <Delta value={m.stats.revenue.delta} />
        </Stat>
        <Stat title="Completed Transactions" value={number(m.stats.completed.value)}>
          <Delta value={m.stats.completed.delta} />
        </Stat>
        <PaystackCard gateway={m.gateway} onView={() => document.getElementById("payments")?.scrollIntoView({ behavior: "smooth" })} />
        <Stat title="Pending Transactions" value={number(m.stats.pending.value)}>
          <span className="text-[14px] text-[var(--a-green)]">{m.stats.pending.pct}%</span>
        </Stat>
        <Stat title="Failed Transactions" value={number(m.stats.failed.value)}>
          <span className="text-[14px] text-[var(--a-red)]">{m.stats.failed.pct}%</span>
        </Stat>
      </div>

      <Card id="payments" className="px-5 pb-6 pt-5">
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
              placeholder="Search payment history"
              className="w-[224px] max-w-full"
            />
            <DropMenu
              trigger={
                <IconBtn label="Filter by method">
                  <ListFilter size={18} />
                </IconBtn>
              }
              items={[
                { label: "All methods", active: methodFilter === "any", onClick: () => setMethodFilter("any") },
                ...methods.map((x) => ({ label: x, active: methodFilter === x, onClick: () => setMethodFilter(x) })),
              ]}
            />
            <IconBtn label={oldestFirst ? "Showing oldest first" : "Showing newest first"} onClick={() => setOldestFirst((o) => !o)}>
              <ArrowUpDown size={18} />
            </IconBtn>
            <IconBtn label="More">
              <Ellipsis size={18} />
            </IconBtn>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <div className="min-w-[800px]">
            <HeadRow className={cx("h-14 text-center", COLS)}>
              <span>Customer Id</span>
              <span>Name</span>
              <span>Date</span>
              <span>Total</span>
              <span>Method</span>
              <span>Status</span>
              <span>Action</span>
            </HeadRow>

            {visible.length === 0 && (
              <EmptyState
                title={m.rows.length ? "No payments match" : "No payments yet"}
                text={m.rows.length ? "Try a different search or tab." : "Payments from Paystack appear here after the first order."}
              />
            )}

            {visible.map((r) => {
              const st = STATUS[r.status];
              return (
                <div
                  key={r.key}
                  className={cx(
                    "grid h-[62px] items-center border-b border-[var(--a-line-strong)] px-4 text-center text-[15px] text-[var(--a-ink)] hover:bg-[#fafafa]",
                    COLS
                  )}
                >
                  <span>{r.customer}</span>
                  <span className="truncate">{r.name}</span>
                  <span>{dateDMY(r.date)}</span>
                  <span>{naira(r.total)}</span>
                  <span>{r.method}</span>
                  <span className="flex justify-center">
                    <StatusDot tone={st.tone}>{st.label}</StatusDot>
                  </span>
                  <span>
                    <button type="button" onClick={() => setOpenId(r.key)} className="text-[var(--a-blue)] hover:underline">
                      View Details
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Pager page={current} pages={pages} onPage={setPage} />
      </Card>

      <OrderDrawer order={openOrder} onClose={() => setOpenId(null)} />
    </div>
  );
}
