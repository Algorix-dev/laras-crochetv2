/*
  TIP: Pulling this out of AccountPage.jsx and into its own component
  is the same move as ProductGrid earlier — four pages (Account,
  Order History, Addresses, Wishlist) need the EXACT same sidebar
  with just a different active link. Rather than copy-pasting the
  nav + logout logic into all four, one component takes an `active`
  prop and every page renders <AccountSidebar active="orders" /> etc.
*/
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LogoutModal from './LogoutModal';

const LINKS = [
  { key: 'about', label: 'About You', to: '/account' },
  { key: 'orders', label: 'Order History', to: '/account/orders' },
  { key: 'addresses', label: 'Addresses', to: '/account/addresses' },
  { key: 'wishlist', label: 'Wishlist', to: '/wishlist' },
];

export default function AccountSidebar({ active }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const activeLabel = LINKS.find((link) => link.key === active)?.label ?? LINKS[0].label;

  return (
    <>
      {/* TIP: Figma's mobile version collapses this whole nav into a
          single bordered "ABOUT YOU ▾" button showing the current
          section — tapping it reveals the other links, same bordered-
          box + chevron language as the promo code accordion on the
          Bag page. It's a real <button> + list rather than a native
          <select> so it can share that styling exactly. */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          className="flex w-full items-center justify-between border border-[var(--line)] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[var(--ink)]"
        >
          {activeLabel}
          <ChevronDown size={16} className={mobileOpen ? 'rotate-180' : ''} />
        </button>
        {mobileOpen && (
          <div className="border border-t-0 border-[var(--line)] text-xs uppercase tracking-wide">
            {LINKS.filter((link) => link.key !== active).map((link) => (
              <Link
                key={link.key}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block border-b border-[var(--line)] px-4 py-3 text-[var(--muted)] last:border-b-0 hover:text-[var(--ink)]"
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => {
                setMobileOpen(false);
                setConfirmOpen(true);
              }}
              className="block w-full px-4 py-3 text-left text-[var(--muted)] hover:text-[var(--ink)]"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Desktop: plain vertical link list, unchanged from before. */}
      <nav className="hidden text-xs uppercase tracking-wide md:flex md:flex-col md:gap-3">
        {LINKS.map((link) => (
          <Link
            key={link.key}
            to={link.to}
            className={
              active === link.key
                ? 'font-bold text-[var(--ink)] underline underline-offset-4'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }
          >
            {link.label}
          </Link>
        ))}
        <button
          onClick={() => setConfirmOpen(true)}
          className="text-left text-[var(--muted)] hover:text-[var(--ink)]"
        >
          Logout
        </button>
      </nav>

      <LogoutModal
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          logout();
          setConfirmOpen(false);
          navigate('/');
        }}
      />
    </>
  );
}
