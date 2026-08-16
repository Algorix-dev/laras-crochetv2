/*
  TIP: This page redirects to sign-in if there's no user — that's
  what makes this a "protected page" on the frontend. The actual
  security still lives on the backend (any API route that returns
  real order data checks the JWT token), but this stops a
  signed-out visitor from even seeing the account UI.
*/
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Pencil, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { updateUsername } from "../api";
import { products } from "../data/products";
import ProductGrid from "../components/ProductGrid";
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
      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <p className="mb-6 text-xs text-[var(--muted)]">
          <Link to="/" className="hover:underline">
            Home
          </Link>{" "}
          / Account
        </p>

        <div className="grid gap-10 md:grid-cols-[180px_1fr]">
          <AccountSidebar active="about" />

          {/* About You content */}
          <div>
            <h1 className="mb-8 text-2xl font-bold uppercase tracking-tight">
              About You
            </h1>

            <div className="mb-8 max-w-sm">
              <span className="text-sm font-bold text-[var(--ink)]">
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
                  <span className="text-sm text-[var(--muted)]">
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

            <div className="mb-8 max-w-sm">
              <span className="text-sm font-bold text-[var(--ink)]">Email</span>
              <p className="mt-1 text-sm text-[var(--muted)]">{user?.email}</p>
            </div>

            <div className="mb-8">
              <span className="text-sm font-bold text-[var(--ink)]">
                Preferences
              </span>
              <p className="mt-1 text-sm text-[var(--muted)] underline underline-offset-2">
                Unsubscribe from marketing emails
              </p>
            </div>

            <div>
              <span className="text-sm font-bold text-[var(--ink)]">
                Loyalty Status
              </span>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {user?.loyaltyStatus || "Guest"}
              </p>
            </div>
          </div>
        </div>

        {/* Recommendations — reuses the same ProductGrid as the shop/homepage */}
        <div className="mt-16">
          <h2 className="mb-6 text-sm font-bold">
            Lara Thinks You'd Love These Too
          </h2>
          <ProductGrid products={products} />
        </div>
      </section>

      <Footer showNewsletter />
    </>
  );
}
