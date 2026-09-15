/*
  Navbar
  - Sticky header
  - Search overlay
  - Wishlist/cart badges
  - Account navigation
  - Country selector with flags + 3-letter country code when closed
  - Full country name + currency when the selector is opened
  - Mobile hamburger menu

  TIP — CENTERING THE NAV LINKS:
  This used to be a single flex row with `justify-between` across
  logo / nav-links / icon-cluster. That only "spaces the 3 groups
  out evenly" — it does NOT put the nav links at the true center of
  the page, because the logo and the icon-cluster aren't the same
  width. Flex justify-between pushes the middle item to wherever's
  left after the two side groups take their share, not to 50%.

  Fixed with the classic 3-column centering trick instead:
  `grid-cols-[1fr_auto_1fr]`. The two outer columns are equal
  fractions (1fr each) no matter how wide their content is, so the
  middle (auto-sized) column's midpoint always lands on the true
  horizontal center of the row — which is what lines it up with the
  center of the Reina image below it in Hero, since Hero uses the
  same side padding (see below).

  TIP — 304px SIDE MARGIN:
  `lg:px-[15.83%]` is 304px/1920px = 15.83%, i.e. the Figma frame's
  side padding expressed as a fraction of the frame width. Every
  section on the homepage should use this exact same padding class
  (Hero, LaraShowcase, ProductGrid, Footer, etc.) so all their
  content edges land on the same vertical line — like a single
  margin drawn down the page — instead of each section inventing
  its own padding scale.

  TIP — DIMMED IDLE / HOVER-TO-FULL-OPACITY / HIDE-DURING-PIN:
  The navbar now has three opacity states instead of always being
  100% visible:
    1. Hidden (opacity 0, pointer-events none) — only while
       LaraShowcase is actively pinned/scrubbing. Driven by the
       shared NavbarVisibilityContext (see setHidden there) so any
       future pinned/full-screen section can reuse the same
       mechanism without touching this file again.
    2. Dimmed (NAVBAR_IDLE_OPACITY) — the normal resting state on
       every page, all the time, once the navbar is visible at all.
    3. Full opacity — while hovered, AND for NAVBAR_HOVER_HOLD_MS
       after the mouse leaves (a grace period so an accidental
       mouse-off while moving toward a click doesn't dim on you
       mid-intent).
*/
import { useEffect, useRef, useState } from "react";
import { Heart, Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { useNavbarVisibility } from "../context/NavbarVisibilityContext";
import CountrySelectorModal from "./CountrySelectorModal";
import SearchOverlay from "./SearchOverlay";
import laraCrochetLogo from "../assets/lara-crochet-logo.png";

// Tweak these two to taste — nothing else needs to change.
const NAVBAR_IDLE_OPACITY = 1; // resting/dimmed state (try between 0.65–0.8)
const NAVBAR_HOVER_HOLD_MS = 2500; // stays fully visible this long after you stop hovering

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

  /* -------------------- visibility + dim/hover state -------------------- */

  const { hidden } = useNavbarVisibility();
  const [isFocused, setIsFocused] = useState(false);
  const dimTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (dimTimeoutRef.current) {
      clearTimeout(dimTimeoutRef.current);
      dimTimeoutRef.current = null;
    }
    setIsFocused(true);
  };

  const handleMouseLeave = () => {
    // Don't dim immediately — hold at full opacity for a grace
    // window in case this was an accidental mouse-off, or they're
    // about to move back in to click something.
    dimTimeoutRef.current = setTimeout(() => {
      setIsFocused(false);
      dimTimeoutRef.current = null;
    }, NAVBAR_HOVER_HOLD_MS);
  };

  useEffect(() => {
    return () => {
      if (dimTimeoutRef.current) clearTimeout(dimTimeoutRef.current);
    };
  }, []);

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
      <header
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="fixed inset-x-0 top-0 z-50 border-b border-[#E5E5E5] bg-[#FAFAFA] transition-opacity duration-300"
      >
        {/*
          Mobile (below md): 3 cols, middle is a flexible spacer
          (nav links are hidden anyway), so it behaves like the old
          logo-left / button-right layout.

          Desktop (md+): 1fr / auto / 1fr — see TIP above. The nav
          `justify-self-center` is what actually centers it; the two
          1fr tracks just guarantee the center column's midpoint is
          the row's true midpoint regardless of logo/icon width.
        */}
        <div
          className="
            grid h-[66px] grid-cols-[auto_1fr_auto] items-center gap-4
            px-5 md:px-8 lg:px-[15.83%]
            md:grid-cols-[1fr_auto_1fr]
          "
        >
          {/* Brand logo */}
          <Link to="/" aria-label="Lara's Crochet home" className="justify-self-start">
            <img
              src={laraCrochetLogo}
              alt="Lara's Crochet"
              className="h-9 w-auto"
            />
          </Link>

          {/* Desktop nav links — justify-self-center is the piece
              that actually centers this against the page, not the
              grid alone. */}
          <nav className="hidden justify-self-center gap-5 text-sm uppercase md:flex">
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
          <div className="hidden items-center justify-self-end gap-5 md:flex">
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
            className="justify-self-end md:hidden"
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