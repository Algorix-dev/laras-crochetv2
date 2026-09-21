/*
  DASHBOARD — Lara's Figma "Dashboard" frame, card for card.
    row 1  Total Sales · Total Orders · Pending & Canceled
    row 2  Report for this week (chart)  |  live visitors + Sales by Country
    row 3  Transaction  |  Top Products
    row 4  Best selling product  |  Add New Product
*/
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, CirclePlus, ListFilter, Search } from "lucide-react";
import { saveProduct } from "../../api";
import { useAdmin } from "../AdminData";
import { AreaChart, Bars } from "../charts";
import { compactNumber, dateTimeShort, niceTicks, cx } from "../fmt";
import {
  Btn,
  Card,
  CardHead,
  Delta,
  EmptyState,
  HeadRow,
  Kebab,
  PillButton,
  StatusDot,
  Thumb,
  WeekSwitch,
  useToast,
} from "../ui";

/* ---------------- row 1 ---------------- */

function BigNumber({ value, className }) {
  return <span className={cx("text-[36px] font-bold leading-[44px] text-[var(--a-ink)]", className)}>{value}</span>;
}

function TopStat({ title, children, to }) {
  return (
    <Card className="flex min-h-[222px] flex-col p-5">
      <CardHead title={title}>
        <Kebab />
      </CardHead>
      <p className="mt-1 text-[14px] leading-5 text-[var(--a-muted)]">Last 7 days</p>
      <div className="mt-3 flex-1">{children}</div>
      <div className="flex justify-end pt-2">
        <PillButton to={to}>Details</PillButton>
      </div>
    </Card>
  );
}

function SalesAndOrders({ d }) {
  return (
    <>
      <TopStat title="Total Sales" to="/admin/transactions">
        <div className="flex items-baseline gap-3">
          <BigNumber value={d.totalSales.value} />
          <span className="text-[16px] text-[var(--a-text)]">Sales</span>
          <Delta value={d.totalSales.delta} />
        </div>
        <p className="mt-2 text-[14px] text-[var(--a-muted)]">
          Previous 7days <b className="text-[var(--a-blue)]">({d.totalSales.previous})</b>
        </p>
      </TopStat>

      <TopStat title="Total Orders" to="/admin/orders">
        <div className="flex items-baseline gap-3">
          <BigNumber value={d.totalOrders.value} />
          <span className="text-[16px] text-[var(--a-text)]">order</span>
          <Delta value={d.totalOrders.delta} />
        </div>
        <p className="mt-2 text-[14px] text-[var(--a-muted)]">
          Previous 7days <b className="text-[var(--a-blue)]">({d.totalOrders.previous})</b>
        </p>
      </TopStat>

      <TopStat title="Pending & Canceled" to="/admin/orders">
        <div className="flex items-center gap-5">
          <div>
            <p className="text-[14px] text-[var(--a-text)]">Pending</p>
            <p className="flex items-baseline gap-2">
              <span className="text-[26px] font-bold leading-9 text-[var(--a-ink)]">{d.pendingCanceled.pending}</span>
              <span className="text-[16px] text-[var(--a-green)]">user {d.pendingCanceled.pendingUsers}</span>
            </p>
          </div>
          <span className="h-10 w-px bg-[var(--a-line-strong)]" />
          <div>
            <p className="text-[14px] text-[var(--a-text)]">Canceled</p>
            <p className="flex items-baseline gap-2">
              <span className="text-[26px] font-bold leading-9 text-[var(--a-red)]">{d.pendingCanceled.canceled}</span>
              <Delta value={d.pendingCanceled.canceledDelta} className="text-[14px]" />
            </p>
          </div>
        </div>
      </TopStat>
    </>
  );
}

/* ---------------- row 2 ---------------- */

function WeekReport({ week }) {
  const [tab, setTab] = useState("customers");
  const [range, setRange] = useState("this");
  const [active, setActive] = useState(week.today);

  const current = week.stats.find((s) => s.key === tab) || week.stats[0];
  const values = week.series[current.key]?.[range] || Array(7).fill(0);
  const data = week.labels.map((label, i) => ({ label, value: values[i], tip: week.names[i] }));
  const money = current.kind === "money";
  // counts always get whole-number ticks, so never scale below 5
  const ticks = niceTicks(Math.max(...values, money ? 1 : 5), 5);
  const tick = (t) => (money ? `₦${compactNumber(t).toLowerCase()}` : compactNumber(t).toLowerCase());

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[20px] font-bold text-[var(--a-ink)]">Report for this week</h3>
        <div className="flex items-center gap-3">
          <WeekSwitch value={range} onChange={setRange} />
          <Kebab />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-2 gap-y-1 sm:grid-cols-5">
        {week.stats.map((s) => {
          const on = s.key === tab;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setTab(s.key)}
              className={cx(
                "border-b px-2 pb-2.5 pt-2 text-left",
                on
                  ? "border-b-2 border-[var(--a-maroon)] bg-gradient-to-b from-transparent to-[#f7f7f8]"
                  : "border-[#e5e7eb] hover:bg-[#fafafa]"
              )}
            >
              <span className="block text-[24px] font-bold leading-8 text-[var(--a-ink)]">{s.value}</span>
              <span className="block text-[14px] leading-5 text-[var(--a-muted)]">{s.label}</span>
            </button>
          );
        })}
      </div>

      <AreaChart
        className="mt-6"
        data={data}
        ticks={ticks}
        formatTick={tick}
        formatTip={(v) => (money ? `₦${compactNumber(v).toLowerCase()}` : compactNumber(v).toLowerCase())}
        active={active}
        onActive={setActive}
        height={300}
      />
    </Card>
  );
}

function LiveAndCountries({ d }) {
  return (
    <Card className="flex flex-col p-5">
      {d.live ? (
        <>
          <div className="flex items-start justify-between">
            <p className="text-[14px] text-[var(--a-blue)]">Users in last 30 minutes</p>
            <Kebab />
          </div>
          <p className="text-[32px] font-bold leading-10 text-[var(--a-text)]">{d.live.total}</p>
          <p className="mt-3 text-[14px] text-[var(--a-text)]">Users per minute</p>
          <Bars values={d.live.bars} height={38} className="mt-2" />
        </>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <p className="text-[14px] text-[var(--a-blue)]">Users in last 30 minutes</p>
            <Kebab />
          </div>
          <EmptyState
            className="py-6"
            title="Visitor numbers aren't reporting yet"
            text="They appear here once the shop has been visited and the server is running the latest update."
          />
        </>
      )}

      <div className="mt-5 flex items-baseline justify-between">
        <h4 className="text-[18px] font-bold text-[var(--a-ink)]">Sales by Country</h4>
        <span className="text-[18px] font-bold text-[var(--a-ink)]">Sales</span>
      </div>

      <div className="mt-2 flex-1">
        {d.countries.length === 0 ? (
          <EmptyState className="py-6" title="No sales by country yet" text="Countries come from the delivery address on each paid order." />
        ) : (
          <ul>
            {d.countries.map((c) => (
              <li key={c.code} className="flex items-center gap-3 py-2">
                <img
                  src={`https://flagcdn.com/w80/${c.code.toLowerCase()}.png`}
                  alt=""
                  className="size-10 shrink-0 rounded-full border border-[#e5e7eb] object-cover"
                  loading="lazy"
                />
                <div className="w-[64px] shrink-0 leading-tight">
                  <p className="text-[16px] font-bold text-[var(--a-text)]">{c.value}</p>
                  <p className="text-[13px] text-[var(--a-muted)]">{c.name}</p>
                </div>
                <div className="h-1.5 flex-1 rounded-full bg-[#eceefe]">
                  <div className="h-1.5 rounded-full bg-[var(--a-maroon)]" style={{ width: `${Math.max(8, c.share * 100)}%` }} />
                </div>
                <Delta value={c.delta} className="w-[64px] justify-end text-[12px]" />
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        to="/admin/customers"
        className="mt-3 flex h-8 items-center justify-center rounded-full border border-[var(--a-text)] text-[16px] text-[var(--a-text)] hover:bg-[#f9fafb]"
      >
        View Insight
      </Link>
    </Card>
  );
}

/* ---------------- row 3 ---------------- */

function TransactionCard({ rows }) {
  return (
    <Card className="flex flex-col p-5">
      <CardHead title="Transaction" className="[&_h3]:text-[20px]">
        <Btn as={Link} to="/admin/transactions" className="h-8 rounded-md px-4 text-[15px] font-normal">
          Filter <ListFilter size={16} />
        </Btn>
      </CardHead>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] table-fixed text-left text-[15px]">
          <colgroup>
            <col className="w-[16.5%]" />
            <col className="w-[24.7%]" />
            <col className="w-[28%]" />
            <col className="w-[22.8%]" />
            <col />
          </colgroup>
          <thead>
            <tr className="border-b border-[var(--a-line-strong)] text-[var(--a-muted)]">
              <th className="pb-3 pl-1 font-normal">No</th>
              <th className="pb-3 font-normal">Id Customer</th>
              <th className="pb-3 font-normal">Order Date</th>
              <th className="pb-3 font-normal">Status</th>
              <th className="pb-3 pr-1 text-right font-normal">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <EmptyState title="No orders yet" text="New orders will show up here." />
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.key} className="h-[45px] text-[var(--a-text)]">
                <td className="pl-1">{r.no}.</td>
                <td>{r.customer}</td>
                <td>{dateTimeShort(r.date)}</td>
                <td>
                  <StatusDot tone={r.paid ? "green" : "yellow"} plain>
                    {r.paid ? "Paid" : r.pending ? "Pending" : "Unpaid"}
                  </StatusDot>
                </td>
                <td className="pr-1 text-right">{r.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-auto flex justify-end pt-5">
        <PillButton to="/admin/transactions">Details</PillButton>
      </div>
    </Card>
  );
}

function TopProducts({ rows }) {
  const [q, setQ] = useState("");
  const shown = rows.filter((r) => r.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[20px] font-bold text-[var(--a-ink)]">Top Products</h3>
        <Link to="/admin/products" className="text-[13px] text-[var(--a-blue)] hover:underline">
          All product
        </Link>
      </div>

      <label className="mt-3 flex h-9 items-center gap-2 rounded-md bg-[#f3f4f5] px-3">
        <Search size={16} className="text-[var(--a-text)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none"
        />
      </label>

      <ul className="mt-1">
        {shown.length === 0 && <EmptyState title="No products" text="Pieces you add will rank here by how many sold." />}
        {shown.map((p) => (
          <li key={p.id} className="flex items-center gap-3 border-b border-[#e5e7eb] py-[18px] last:border-b-0">
            <Thumb src={p.image} alt={p.name} size={44} className="bg-transparent" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] leading-5 text-[var(--a-ink)]">{p.name}</p>
              <p className="mt-0.5 truncate text-[13px] text-[var(--a-muted)]">{p.item}</p>
            </div>
            <span className="text-[16px] font-bold text-[var(--a-ink)]">{p.price}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ---------------- row 4 ---------------- */

function BestSelling({ rows }) {
  return (
    <Card className="p-5">
      <CardHead title="Best selling product" className="[&_h3]:text-[20px]">
        <Btn as={Link} to="/admin/categories" className="h-8 rounded-md px-4 text-[15px] font-normal">
          Filter <ListFilter size={16} />
        </Btn>
      </CardHead>

      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[520px]">
          <HeadRow className="h-12 grid-cols-[212fr_134fr_133fr_120fr] text-[14px] uppercase text-[var(--a-muted)]">
            <span>Product</span>
            <span>Total order</span>
            <span>Status</span>
            <span>Price</span>
          </HeadRow>
          {rows.length === 0 && <EmptyState title="No products yet" text="Add your first piece to see it here." />}
          {rows.map((r) => (
            <div key={r.id} className="grid h-[58px] grid-cols-[212fr_134fr_133fr_120fr] items-center px-4 text-[16px]">
              <span className="flex min-w-0 items-center gap-3">
                <Thumb src={r.image} alt={r.name} size={32} className="bg-transparent" />
                <b className="truncate text-[var(--a-ink)]">{r.name}</b>
              </span>
              <span className="text-[var(--a-text)]">{r.orders}</span>
              <span>
                <StatusDot tone={r.inStock ? "green" : "red"}>{r.inStock ? "Stock" : "Stock out"}</StatusDot>
              </span>
              <b className="text-[var(--a-ink)]">{r.price}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <PillButton tone="blue" to="/admin/categories">
          Details
        </PillButton>
      </div>
    </Card>
  );
}

function AddNewProduct({ categories, products }) {
  const navigate = useNavigate();
  const { refresh, demo, models } = useAdmin();
  const [toast, toastNode] = useToast();
  const [busy, setBusy] = useState("");

  // "Add" puts a piece on the home page's "Shop Our Pieces" row
  async function feature(id) {
    if (demo) return toast("Sample data — nothing is saved in demo mode.");
    const piece = models.products.find((p) => String(p._id || p.id) === String(id));
    setBusy(String(id));
    try {
      await saveProduct({ placements: [...new Set([...(piece?.placements || []), "featured"])] }, id);
      toast("Added to the home page's Shop Our Pieces row.");
      await refresh();
    } catch (err) {
      toast(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message, "error");
    } finally {
      setBusy("");
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[20px] font-bold text-[var(--a-ink)]">Add New Product</h3>
        <Link to="/admin/products/new" className="inline-flex items-center gap-1.5 text-[15px] text-[var(--a-text)] hover:text-[var(--a-maroon)]">
          <CirclePlus size={20} /> Add New
        </Link>
      </div>

      <p className="mt-1 text-[14px] text-[var(--a-muted)]">Categories</p>
      <ul className="mt-2 space-y-3">
        {categories.map((c) => (
          <li key={c.slug}>
            <button
              type="button"
              onClick={() => navigate(`/admin/categories?cat=${c.slug}`)}
              className="flex h-[58px] w-full items-center gap-3 rounded-md bg-white px-1.5 text-left shadow-[0_1px_4px_rgba(16,24,40,0.16)] hover:bg-[#fafafa]"
            >
              <Thumb src={c.image} alt="" size={48} className="rounded bg-[#f3f4f5]" />
              <span className="flex-1 text-[20px] text-[var(--a-text)]">{c.label}</span>
              <ChevronRight size={18} className="mr-2 text-[var(--a-text)]" />
            </button>
          </li>
        ))}
      </ul>
      <Link to="/admin/categories" className="mt-4 block text-center text-[14px] text-[var(--a-blue)] hover:underline">
        See more
      </Link>

      <p className="mt-4 text-[14px] text-[var(--a-muted)]">Product</p>
      <ul className="mt-1">
        {products.length === 0 && <EmptyState className="py-6" title="Every piece is already featured" />}
        {products.map((p) => (
          <li key={p.id} className="flex items-center gap-3 border-b border-[#e5e7eb] py-3">
            <Thumb src={p.image} alt="" size={48} className="rounded border border-[#e5e7eb] bg-white" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] text-[var(--a-text)]">{p.name}</p>
              <p className="text-[14px] font-bold text-[var(--a-chart)]">{p.price}</p>
            </div>
            <button
              type="button"
              disabled={busy === String(p.id)}
              onClick={() => feature(p.id)}
              title="Add to the home page's Shop Our Pieces row"
              className="inline-flex h-[29px] items-center gap-1.5 rounded-full bg-[var(--a-maroon)] px-2.5 text-[13px] text-white hover:bg-[var(--a-maroon-dark)] disabled:opacity-60"
            >
              <CirclePlus size={15} /> Add
            </button>
          </li>
        ))}
      </ul>
      <Link to="/admin/products" className="mt-3 block text-center text-[14px] text-[var(--a-blue)] hover:underline">
        See more
      </Link>
      {toastNode}
    </Card>
  );
}

/* ---------------- the page ---------------- */

export default function DashboardPage() {
  const { models } = useAdmin();
  const d = models.dashboard;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <SalesAndOrders d={d} />
      </div>

      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,739fr)_minmax(0,361fr)]">
        <WeekReport week={d.week} />
        <LiveAndCountries d={d} />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,808fr)_minmax(0,292fr)]">
        <TransactionCard rows={d.transactions} />
        <TopProducts rows={d.topProducts} />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,739fr)_minmax(0,361fr)]">
        <BestSelling rows={d.bestSelling} />
        <AddNewProduct categories={d.categories} products={d.addProducts} />
      </div>
    </div>
  );
}
