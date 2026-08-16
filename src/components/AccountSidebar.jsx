/*
  TIP: Pulling this out of AccountPage.jsx and into its own component
  is the same move as ProductGrid earlier — three pages (Account,
  Order History, Addresses) need the EXACT same sidebar with just a
  different active link. Rather than copy-pasting the nav + logout
  logic into all three, one component takes an `active` prop and
  every page renders <AccountSidebar active="orders" /> etc.
*/
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <nav className="flex flex-row gap-4 overflow-x-auto text-xs uppercase tracking-wide md:flex-col md:gap-3">
        {LINKS.map((link) => (
          <Link
            key={link.key}
            to={link.to}
            className={
              active === link.key
                ? 'shrink-0 font-bold text-[var(--ink)] underline underline-offset-4'
                : 'shrink-0 text-[var(--muted)] hover:text-[var(--ink)]'
            }
          >
            {link.label}
          </Link>
        ))}
        <button
          onClick={() => setConfirmOpen(true)}
          className="shrink-0 text-left text-[var(--muted)] hover:text-[var(--ink)]"
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
