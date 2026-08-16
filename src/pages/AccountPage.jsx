/*
  TIP: This page redirects to sign-in if there's no user — that's
  what makes this a "protected page" on the frontend. The actual
  security still lives on the backend (any API route that returns
  real order data checks the JWT token), but this stops a
  signed-out visitor from even seeing the account UI.
*/
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Pencil, Check, Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { updateUsername } from "../api";
import { products } from "../data/products";
import AccountSidebar from "../components/AccountSidebar";
import Footer from "../components/Footer";

export default function AccountPage() {
  const { user, isSignedIn, updateUser } = useAuth();
  const navigate = useNavigate();

  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(user?.username || "");
  const [savingUsername, setSavingUsername] = useState(false);

  useEffect(() => {
    if (!isSignedIn) navigate("/signin?redirect=/account");
  }, [isSignedIn, navigate]);

  if (!isSignedIn) return null; // avoids a flash of empty content before the redirect kicks in

  async function handleSaveUsername() {
    if (!usernameInput.trim()) return;
    setSavingUsername(true);
    try {
      const { user: updated } = await updateUsername(usernameInput.trim());
      updateUser(updated);
      setEditingUsername(false);
    } catch {
      // TIP: simplest possible error handling for now — swap this for
      // a toast component later if you add one elsewhere in the app.
      alert("Could not update username — try again.");
    } finally {
      setSavingUsername(false);
    }
  }

  return (
    <>
      <section className="mx-auto max-w-[1280px] px-5 py-10 md:px-0 md:pt-[62px]">
        <p className="mb-[62px] text-[9px] text-[#454545]">
          <Link to="/" className="hover:underline">
            Home
          </Link>{" "}
          / Account
        </p>

        <div className="grid min-h-[470px] gap-10 md:grid-cols-[180px_1fr]">
          <AccountSidebar active="about" />

          {/* About You content */}
          <div>
            <h1 className="mb-6 text-[18px] font-bold uppercase tracking-tight">
              About You
            </h1>

            <div className="mb-7 max-w-sm">
              <span className="text-[9px] font-bold text-[var(--ink)]">
                Username
              </span>
              <div className="mt-1 flex items-center justify-between gap-2">
                {editingUsername ? (
                  <input
                    autoFocus
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveUsername()}
                    className="w-full border-b border-[var(--line)] bg-transparent text-sm outline-none"
                  />
                ) : (
                  <span className="text-[9px] text-[#454545]">
                    {user?.username || "–"}
                  </span>
                )}
                <button
                  aria-label={
                    editingUsername ? "Save username" : "Edit username"
                  }
                  onClick={() =>
                    editingUsername
                      ? handleSaveUsername()
                      : setEditingUsername(true)
                  }
                  disabled={savingUsername}
                  className="shrink-0 text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  {editingUsername ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Pencil className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="mb-7 max-w-sm">
              <span className="text-[9px] font-bold text-[var(--ink)]">Email</span>
              <p className="mt-1 text-[9px] text-[#454545]">{user?.email}</p>
            </div>

            <div className="mb-8">
              <span className="text-[9px] font-bold text-[var(--ink)]">
                Preferences
              </span>
              <p className="mt-1 text-[9px] text-[#454545] underline underline-offset-2">
                Unsubscribe from marketing emails
              </p>
            </div>

            <div>
              <span className="text-[9px] font-bold text-[var(--ink)]">
                Loyalty Status
              </span>
              <p className="mt-1 text-[9px] text-[#454545]">
                {user?.loyaltyStatus || "Guest"}
              </p>
            </div>
          </div>
        </div>

        {/* Recommendations — reuses the same ProductGrid as the shop/homepage */}
        <div className="pb-[52px]">
          <h2 className="mb-4 text-[18px] font-bold">
            Lara Thinks You'd Love These Too
          </h2>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {[...products, products[0]].map((product, index) => (
              <article key={`${product.id}-${index}`}>
                <div className="relative aspect-[3/4] bg-white">
                  <img src={product.image} alt={product.name} className="h-full w-full object-contain" />
                  <Heart className="absolute bottom-2 right-1.5 h-3 w-3" strokeWidth={1} />
                </div>
                <p className="mt-2 text-[8px] font-medium uppercase leading-none">{product.name}</p>
                <p className="mt-1 text-[8px] leading-none">70,000</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer showNewsletter />
    </>
  );
}
