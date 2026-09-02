/*
  Navbar
  - Sticky header
  - Search overlay
  - Wishlist/cart badges
  - Account navigation
  - Country selector with flags + 3-letter country code when closed
  - Full country name + currency when the selector is opened
  - Mobile hamburger menu
*/
import { useState } from "react";
import { Heart, Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import CountrySelectorModal from "./CountrySelectorModal";
import SearchOverlay from "./SearchOverlay";
import laraCrochetLogo from "../assets/lara-crochet-logo.png";

const LINKS = [
  { label: "Shop", to: "/shop" },
  { label: "Custom Orders", to: "/contact?flow=custom" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (to) => {
    if (to === "/") {
      return (
        location.pathname === "/" &&
        !location.hash &&
        !location.search
      );
    }

    return location.pathname + location.search === to;
  };

  /* Bag button with count badge */
  const BagButton = () => (
    <button
      type="button"
      aria-label={`Bag, ${cartCount} items`}
      onClick={() => navigate("/bag")}
      className="relative hover:text-[var(--maroon)]"
    >
      <ShoppingBag size={18} />
      {cartCount > 0 && (
        <span className="absolute -right-2 -top-2 rounded-full bg-[var(--maroon)] px-1 text-[9px] text-white">
          {cartCount}
        </span>
      )}
    </button>
  );

  /* Wishlist button with count badge */
  const WishlistButton = () => (
    <button
      type="button"
      aria-label={`Wishlist, ${wishlistCount} items`}
      onClick={() => navigate("/wishlist")}
      className="relative hover:text-[var(--maroon)]"
    >
      <Heart size={18} />
      {wishlistCount > 0 && (
        <span className="absolute -right-2 -top-2 rounded-full bg-[var(--maroon)] px-1 text-[9px] text-white">
          {wishlistCount}
        </span>
      )}
    </button>
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#E5E5E5] bg-[#FAFAFA]">
        <div className="flex h-[66px] items-center justify-between px-5 md:px-8 lg:px-[15.83%]">
          {/* Brand logo */}
          <Link to="/" aria-label="Lara's Crochet home">
            <img
              src={laraCrochetLogo}
              alt="Lara's Crochet"
              className="h-9 w-auto"
            />
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden gap-5 text-sm uppercase md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={
                  "flex h-10 items-center rounded-[10px] px-[10px] hover:bg-black/5 " +
                  (isActive(link.to)
                    ? "font-nav-active text-[var(--ink)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)]")
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop utility icons */}
          <div className="hidden items-center gap-5 md:flex">
            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={18} />
            </button>

            <WishlistButton />
            <BagButton />

            <button
              type="button"
              aria-label="Account"
              onClick={() =>
                navigate(isSignedIn ? "/account" : "/signin")
              }
            >
              <User size={18} />
            </button>

            {/* Country selector
                Closed: flag + 3-letter country code
                Open: full country name + currency */}
            <CountrySelectorModal />
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <nav className="flex flex-col gap-4 px-5 pb-6 text-sm uppercase md:hidden">
            {LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={
                  isActive(link.to)
                    ? "font-nav-active text-[var(--ink)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }
              >
                {link.label}
              </Link>
            ))}

            <div className="flex gap-5">
              <button
                type="button"
                aria-label="Search"
                onClick={() => {
                  setSearchOpen(true);
                  setMenuOpen(false);
                }}
              >
                <Search size={18} />
              </button>

              <WishlistButton />
              <BagButton />

              <button
                type="button"
                aria-label="Account"
                onClick={() => {
                  navigate(isSignedIn ? "/account" : "/signin");
                  setMenuOpen(false);
                }}
              >
                <User size={18} />
              </button>
            </div>

            <div className="pt-2">
              <CountrySelectorModal />
            </div>
          </nav>
        )}
      </header>

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}
