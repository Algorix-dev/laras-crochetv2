/*
  The frame around every admin screen: the left menu and the top bar.
  Measurements come from Lara's Figma (1440px wide frame):
    sidebar 260px · top bar 96px · menu item 42px tall on a 48px rhythm.
*/
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  CirclePlus,
  CircleUser,
  CreditCard,
  House,
  Image as ImageIcon,
  LogOut,
  Menu,
  MessageSquareText,
  PackageSearch,
  Search,
  Settings,
  Shapes,
  ShoppingCart,
  SquareArrowOutUpRight,
  Star,
  Store,
  Ticket,
  Users,
} from "lucide-react";
import logo from "../assets/lara-crochet-logo.png";
import portrait from "../assets/lara-portrait.webp";
import { useAdmin } from "./AdminData";
import { useProfileExtra } from "./profileStore";
import { cx } from "./fmt";

/* ---------------- menu ---------------- */

const MENU = [
  {
    heading: "Main menu",
    items: [
      { to: "/admin", label: "Dashboard", icon: House, title: "Dashboard", exact: true },
      { to: "/admin/orders", label: "Order Management", icon: ShoppingCart, title: "Order Management" },
      { to: "/admin/customers", label: "Customers", icon: Users, title: "Customers" },
      { to: "/admin/coupons", label: "Coupon Code", icon: Ticket, title: "Coupon Code" },
      { to: "/admin/categories", label: "Categories", icon: Shapes, title: "Categories" },
      { to: "/admin/transactions", label: "Transaction", icon: CreditCard, title: "Transaction" },
      { to: "/admin/brand", label: "Brand", icon: Star, title: "Brand" },
    ],
  },
  {
    heading: "Product",
    items: [
      { to: "/admin/products/new", label: "Add Products", icon: CirclePlus, title: "Add Product" },
      { to: "/admin/media", label: "Product Media", icon: ImageIcon, title: "Product Media" },
      { to: "/admin/products", label: "Product List", icon: PackageSearch, title: "Product List", exact: true },
      { to: "/admin/reviews", label: "Product Reviews", icon: MessageSquareText, title: "Product Reviews" },
    ],
  },
  {
    heading: "Admin",
    items: [
      { to: "/admin/role", label: "Admin role", icon: CircleUser, title: "Admin role" },
      { to: "/admin/authority", label: "Control Authority", icon: Settings, title: "Control Authority" },
    ],
  },
];

const ALL_ITEMS = MENU.flatMap((group) => group.items);

function itemIsActive(item, pathname) {
  const clean = pathname.replace(/\/+$/, "") || "/admin";
  if (item.to === "/admin/products") {
    // Product List also covers editing a piece (/admin/products/<id>)
    return clean === "/admin/products" || (clean.startsWith("/admin/products/") && clean !== "/admin/products/new");
  }
  return item.exact ? clean === item.to : clean === item.to || clean.startsWith(`${item.to}/`);
}

export function titleFor(pathname) {
  const item = ALL_ITEMS.find((it) => itemIsActive(it, pathname));
  return item?.title || "Dashboard";
}

/* ---------------- pieces ---------------- */

function CollapseGlyph({ className }) {
  // the little "◀||" icon beside the logo in the Figma
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M8.5 6.2v7.6L4.2 10l4.3-3.8Z" fill="currentColor" />
      <path d="M11.4 4.5v11M15.2 4.5v11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Avatar({ size = 40, className }) {
  const { avatar } = useProfileExtra(); // a photo Lara uploaded on the Admin role page, if any
  return (
    <img
      src={avatar || portrait}
      alt=""
      width={size}
      height={size}
      className={cx("shrink-0 rounded-full object-cover object-[50%_14%]", className)}
      style={{ width: size, height: size }}
    />
  );
}

function Sidebar({ onNavigate, onSignOut, onCollapse }) {
  const { pathname } = useLocation();
  const { profile, demo } = useAdmin();
  const name = profile?.name || (demo ? "Lara Olafolorunsho" : "Lara");
  const email = profile?.email || (demo ? "laraolafolorunsho@gmail.com" : "");

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex shrink-0 items-start justify-between px-[18px] pt-[18px]">
        <Link to="/admin" onClick={onNavigate} aria-label="Lara's Crochet — dashboard">
          <img src={logo} alt="Lara's Crochet" className="h-[42px] w-auto" />
        </Link>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Close menu"
          className="mt-3.5 mr-1 text-[#6a717f] hover:text-[var(--a-maroon)] lg:pointer-events-none"
        >
          <CollapseGlyph />
        </button>
      </div>

      <nav aria-label="Admin" className="a-scroll min-h-0 flex-1 overflow-y-auto px-[14px] pb-4 pt-[28px]">
        {MENU.map((group, gi) => (
          <div key={group.heading} className={gi ? "mt-[20px]" : ""}>
            <p className="mb-[21px] pl-[10px] text-[15px] leading-6 text-[var(--a-muted)]">{group.heading}</p>
            <ul className="space-y-1.5">
              {group.items.map((item) => {
                const active = itemIsActive(item, pathname);
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.exact}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "flex h-[42px] items-center gap-2.5 rounded-lg pl-[18px] pr-3 text-[16px]",
                        active
                          ? "bg-[var(--a-maroon)] font-bold text-white"
                          : "text-[var(--a-muted)] hover:bg-[#f3f4f5] hover:text-[var(--a-ink)]"
                      )}
                    >
                      <Icon
                        size={20}
                        strokeWidth={active ? 2.2 : 1.8}
                        fill={active && item.icon === House ? "currentColor" : "none"}
                        className="shrink-0"
                      />
                      {item.label}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 px-[14px] pb-5 pt-3">
        <div className="flex items-center gap-2.5 px-1 pb-4">
          <Avatar size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold leading-5 text-[var(--a-ink)]">{name}</p>
            {email && <p className="truncate text-[13px] leading-4 text-[var(--a-muted)]">{email}</p>}
          </div>
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign out"
            className="flex size-8 items-center justify-center text-[var(--a-muted)] hover:text-[var(--a-maroon)]"
          >
            <LogOut size={18} />
          </button>
        </div>
        <Link
          to="/"
          target="_blank"
          rel="noreferrer"
          className="flex h-11 items-center gap-2.5 rounded-md bg-white px-3 text-[16px] font-bold text-[var(--a-ink)] shadow-[0_1px_3px_rgba(16,24,40,0.16)] hover:bg-[#f9fafb]"
        >
          <Store size={20} strokeWidth={1.9} />
          <span className="flex-1">Your Shop</span>
          <SquareArrowOutUpRight size={16} className="text-[var(--a-muted)]" />
        </Link>
      </div>
    </div>
  );
}

function Topbar({ title, onMenu }) {
  const navigate = useNavigate();
  const { models } = useAdmin();
  const [query, setQuery] = useState("");
  const fresh = models.orders.rows.filter((r) => r.status === "paid").length;

  function submit(e) {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/admin/orders?q=${encodeURIComponent(q)}` : "/admin/orders");
  }

  return (
    <header className="flex h-[96px] items-center gap-4 bg-white pl-5 pr-5 shadow-[0_1px_0_rgba(16,24,40,0.04),0_2px_6px_rgba(16,24,40,0.03)] sm:pl-6 lg:pr-11">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open menu"
        className="flex size-10 items-center justify-center rounded-md text-[var(--a-ink)] hover:bg-[#f3f4f5] lg:hidden"
      >
        <Menu size={22} />
      </button>

      <h1 className="min-w-0 flex-1 truncate text-[24px] font-bold leading-8 text-[var(--a-ink)]">{title}</h1>

      <form onSubmit={submit} role="search" className="hidden h-12 w-full max-w-[406px] items-center rounded-full bg-[var(--a-bg)] pl-6 pr-4 md:flex">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search data, users, or reports"
          aria-label="Search orders"
          className="min-w-0 flex-1 bg-transparent text-[16px] text-[var(--a-text)] outline-none"
        />
        <button type="submit" aria-label="Search" className="text-[var(--a-text)]">
          <Search size={20} />
        </button>
      </form>

      <Link
        to="/admin/orders"
        aria-label={fresh ? `${fresh} new orders` : "Orders"}
        className="relative ml-2 flex size-8 items-center justify-center text-[var(--a-ink)]"
      >
        <Bell size={22} strokeWidth={1.8} />
        {fresh > 0 && <i className="absolute right-[3px] top-[2px] size-2 rounded-full bg-[var(--a-red)]" />}
      </Link>
      <Avatar size={40} />
    </header>
  );
}

/* ---------------- the shell ---------------- */

export default function AdminShell({ onSignOut, children }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  // close the phone menu whenever you go somewhere
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="admin-root min-h-screen">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] border-r border-[var(--a-line)] lg:block">
        <Sidebar onSignOut={onSignOut} onCollapse={() => {}} />
      </aside>

      {/* phone menu */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] max-w-[86vw] shadow-xl">
            <Sidebar onNavigate={() => setOpen(false)} onSignOut={onSignOut} onCollapse={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="min-w-0 lg:pl-[260px]">
        <Topbar title={titleFor(pathname)} onMenu={() => setOpen(true)} />
        <main className="px-4 pb-12 pt-5 sm:pl-5 sm:pr-5 lg:pr-10">{children}</main>
      </div>
    </div>
  );
}

