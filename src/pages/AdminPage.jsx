/*
  LARA'S ADMIN PAGE  —  /admin

  Three screens in one file:
    1. Sign in         (the admin account from server/seedAdmin.js)
    2. Your pieces     (every piece + how many angle shots it has)
    3. Add / edit form (where the piece appears + the angle shots)

  TIP — WHY THE FORM ASKS TWO THINGS, IN THIS ORDER:
    1. "Where should this piece appear?"  → Shop is automatic; Hero and
       Featured are optional extras. Hero is the carousel at the top of
       the home page, Featured is the "Shop Our Pieces" row.
    2. "Angle shots"  → front / left / right / back. The same four photos
       feed everything: the product page shows all four as thumbnails,
       and the hero uses front (middle) + left / right (the sides).
       The form nudges for all four every time, and asks once more before
       saving with any missing.

  TIP: each photo is uploaded the moment it's chosen (POST /api/upload),
  which removes the background and stores it on Cloudinary. Only the
  resulting URLs are saved with the piece.
*/
import { useEffect, useState } from "react";
import { Check, Loader2, LogOut, Pencil, Plus, Upload, X } from "lucide-react";
import {
  adminLogin,
  adminSession,
  getProducts,
  normalizeProduct,
  saveProduct,
  uploadPhoto,
} from "../api";
import { CATEGORIES } from "../data/products";

const ANGLES = [
  { key: "front", label: "Front", hint: "Facing the camera", required: true },
  { key: "left", label: "Left", hint: "Turned toward the left edge of the photo" },
  { key: "right", label: "Right", hint: "Turned toward the right edge of the photo" },
  { key: "back", label: "Back", hint: "Seen from behind" },
];

const PLACEMENTS = [
  {
    key: "hero",
    title: "Hero",
    text: "The big carousel at the top of the home page. Looks best with 3, 5 or more pieces.",
  },
  {
    key: "featured",
    title: "Featured",
    text: "The “Shop Our Pieces” row on the home page — featured pieces come first.",
  },
];

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const DEFAULT_SIZES = ["XS", "S", "M", "XL", "XXL"];

const inputClass =
  "w-full border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--maroon)]";
const primaryButton =
  "bg-[var(--maroon)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-[var(--maroon-dark)] disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "border border-[var(--ink)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--ink)] hover:bg-[var(--ink)] hover:text-white";

function countAngles(views) {
  return ANGLES.filter(({ key }) => views?.[key]).length;
}

/* ============================================================
   1. SIGN IN
   ============================================================ */

function LoginForm({ onSignedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { token } = await adminLogin(email.trim(), password);
      adminSession.set(token);
      onSignedIn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <h1 className="mb-1 text-2xl font-bold uppercase tracking-[-0.02em]">Admin</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">Sign in to add or edit pieces.</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          required
          autoComplete="username"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className={`${primaryButton} w-full`}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

/* ============================================================
   2. YOUR PIECES
   ============================================================ */

function PieceList({ onNew, onEdit, onSignOut, refreshKey }) {
  const [pieces, setPieces] = useState(null); // null = loading
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getProducts("all")
      .then((data) => !cancelled && setPieces(data.map(normalizeProduct)))
      .catch(() => !cancelled && setError("Couldn't load the pieces."));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold uppercase tracking-[-0.02em]">Your pieces</h1>
        <div className="flex gap-3">
          <button type="button" onClick={onNew} className={`${primaryButton} inline-flex items-center gap-2`}>
            <Plus size={14} /> New piece
          </button>
          <button type="button" onClick={onSignOut} className={`${secondaryButton} inline-flex items-center gap-2`}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!pieces && !error && <p className="text-sm text-[var(--muted)]">Loading…</p>}
      {pieces?.length === 0 && (
        <p className="text-sm text-[var(--muted)]">No pieces yet — add your first one.</p>
      )}

      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {pieces?.map((piece) => {
          const angles = countAngles(piece.views);
          return (
            <div key={piece.id} className="bg-white p-3">
              <div className="flex aspect-[3/4] items-center justify-center bg-[#E5E5E5]">
                {piece.image && (
                  <img src={piece.image} alt={piece.name} className="h-full w-full object-contain" />
                )}
              </div>
              <p className="mt-3 text-sm font-bold uppercase">{piece.name}</p>
              <p className="text-xs text-[var(--muted)]">{piece.categoryLabel}</p>

              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                <span className={angles === 4 ? "bg-green-100 px-2 py-1 text-green-800" : "bg-amber-100 px-2 py-1 text-amber-800"}>
                  {angles}/4 angles
                </span>
                {piece.placements.map((placement) => (
                  <span key={placement} className="bg-[var(--maroon)] px-2 py-1 text-white">
                    {placement}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onEdit(piece)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs underline underline-offset-2 hover:text-[var(--maroon)]"
              >
                <Pencil size={12} /> {angles < 4 ? "Add angle shots" : "Edit"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   3. ADD / EDIT A PIECE
   ============================================================ */

function AngleSlot({ angle, url, busy, highlight, onFile, onClear }) {
  return (
    <div>
      <div
        className={`relative flex aspect-[3/4] items-center justify-center overflow-hidden border border-dashed bg-white ${
          highlight ? "border-[var(--maroon)]" : "border-[var(--line)]"
        }`}
      >
        {url && <img src={url} alt={`${angle.label} view`} className="h-full w-full object-contain" />}

        {busy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/85 text-xs text-[var(--muted)]">
            <Loader2 size={18} className="animate-spin" />
            Removing background…
          </div>
        )}

        {!url && !busy && (
          <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 p-3 text-center text-xs text-[var(--muted)] hover:bg-[var(--cream)]">
            <Upload size={18} />
            Add photo
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                onFile(event.target.files?.[0]);
                event.target.value = ""; // lets the same file be picked again
              }}
            />
          </label>
        )}

        {url && !busy && (
          <button
            type="button"
            onClick={onClear}
            aria-label={`Remove ${angle.label} photo`}
            className="absolute right-1.5 top-1.5 bg-white p-1 shadow hover:bg-[var(--cream)]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <p className="mt-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wide">
        {url && <Check size={12} className="text-green-700" />}
        {angle.label}
        {angle.required && <span className="font-normal normal-case text-[var(--muted)]">(required)</span>}
      </p>
      <p className="text-[11px] leading-snug text-[var(--muted)]">{angle.hint}</p>
    </div>
  );
}

function PieceForm({ piece, onDone, onCancel, onExpired }) {
  const [name, setName] = useState(piece?.name ?? "");
  const [price, setPrice] = useState(piece?.price ?? "");
  const [category, setCategory] = useState(piece?.category ?? CATEGORIES[0]);
  const [stock, setStock] = useState(piece?.stock ?? 10);
  const [description, setDescription] = useState(piece?.description ?? "");
  const [sizes, setSizes] = useState(piece?.sizes?.length ? piece.sizes : DEFAULT_SIZES);
  const [placements, setPlacements] = useState(piece?.placements ?? []);
  const [views, setViews] = useState(
    piece?.views ?? { front: "", left: "", right: "", back: "" }
  );

  const [uploading, setUploading] = useState({});
  const [askAboutMissing, setAskAboutMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const onHero = placements.includes("hero");
  const added = countAngles(views);
  const missing = ANGLES.filter(({ key }) => !views[key]);

  function togglePlacement(key) {
    setPlacements((list) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]));
  }

  function toggleSize(size) {
    setSizes((list) => (list.includes(size) ? list.filter((s) => s !== size) : [...list, size]));
  }

  async function handleFile(key, file) {
    if (!file) return;
    setError("");
    setAskAboutMissing(false);
    setUploading((state) => ({ ...state, [key]: true }));
    try {
      const url = await uploadPhoto(file);
      setViews((state) => ({ ...state, [key]: url }));
    } catch (err) {
      if (err.message === "SESSION_EXPIRED") return onExpired();
      setError(`The ${key} photo didn't upload: ${err.message}`);
    } finally {
      setUploading((state) => ({ ...state, [key]: false }));
    }
  }

  async function submit({ skipAngleCheck = false } = {}) {
    setError("");

    if (!name.trim()) return setError("Give the piece a name.");
    const priceNumber = Number(price);
    if (!priceNumber || priceNumber < 0) return setError("Enter the price in naira.");
    if (!views.front) return setError("The front photo is required — it's the main photo everywhere.");
    if (Object.values(uploading).some(Boolean)) return setError("Wait for the photos to finish uploading.");

    // the "are you sure?" moment — angle shots are always encouraged
    if (!skipAngleCheck && missing.length > 0) {
      setAskAboutMissing(true);
      return;
    }

    setSaving(true);
    try {
      await saveProduct(
        {
          name: name.trim(),
          price: priceNumber,
          category,
          stock: Number(stock) || 0,
          description,
          sizes,
          placements,
          views,
        },
        piece?._id
      );
      onDone();
    } catch (err) {
      if (err.message === "SESSION_EXPIRED") return onExpired();
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold uppercase tracking-[-0.02em]">
          {piece ? `Edit ${piece.name}` : "New piece"}
        </h1>
        <button type="button" onClick={onCancel} className="text-xs underline underline-offset-2">
          Back to pieces
        </button>
      </div>

      {/* ---------- WHERE IT APPEARS ---------- */}
      <section className="mb-10">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide">Where should this piece appear?</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Every piece is in the Shop. Tick the extras you want:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {PLACEMENTS.map(({ key, title, text }) => {
            const on = placements.includes(key);
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                onClick={() => togglePlacement(key)}
                className={`border p-4 text-left ${
                  on ? "border-[var(--maroon)] bg-white" : "border-[var(--line)] bg-transparent hover:bg-white"
                }`}
              >
                <span className="flex items-center justify-between text-sm font-bold uppercase">
                  {title}
                  {on && <Check size={16} className="text-[var(--maroon)]" />}
                </span>
                <span className="mt-1 block text-xs leading-snug text-[var(--muted)]">{text}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---------- ANGLE SHOTS ---------- */}
      <section className="mb-10">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide">Angle shots</h2>
          <span className="text-xs text-[var(--muted)]">{added} of 4 added</span>
        </div>
        <div className="mb-3 h-1 bg-[var(--line)]">
          <div className="h-1 bg-[var(--maroon)] transition-all" style={{ width: `${(added / 4) * 100}%` }} />
        </div>

        <p className="mb-2 text-sm text-[var(--muted)]">
          Photograph the same outfit from each direction. The product page shows all four under the main
          photo; a missing one shows a placeholder.
        </p>
        {onHero && (
          <p className="mb-2 text-sm text-[var(--maroon)]">
            On the hero, <b>Front</b> is shown when this piece is in the middle, and <b>Left</b> /{" "}
            <b>Right</b> when it sits beside the middle — turned away from the centre. If you skip one side, the
            other is mirrored.
          </p>
        )}
        <p className="mb-5 text-xs text-[var(--muted)]">
          Tip: crop every photo to the model, head to feet, with the same framing, so switching between angles
          doesn’t jump.
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {ANGLES.map((angle) => (
            <AngleSlot
              key={angle.key}
              angle={angle}
              url={views[angle.key]}
              busy={Boolean(uploading[angle.key])}
              highlight={onHero && (angle.key === "left" || angle.key === "right") && !views[angle.key]}
              onFile={(file) => handleFile(angle.key, file)}
              onClear={() => {
                setAskAboutMissing(false);
                setViews((state) => ({ ...state, [angle.key]: "" }));
              }}
            />
          ))}
        </div>
      </section>

      {/* ---------- DETAILS ---------- */}
      <section className="mb-10 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide">Details</h2>
        <input
          placeholder="Name (e.g. Reina)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <input
            type="number"
            min="0"
            placeholder="Price (₦)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            {CATEGORIES.map((slug) => (
              <option key={slug} value={slug}>
                {slug.replace("-", " ")}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            placeholder="Stock"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              aria-pressed={sizes.includes(size)}
              onClick={() => toggleSize(size)}
              className={`border px-3 py-1.5 text-xs font-bold ${
                sizes.includes(size)
                  ? "border-[var(--maroon)] bg-[var(--maroon)] text-white"
                  : "border-[var(--line)] bg-white"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </section>

      {/* ---------- SAVE ---------- */}
      {askAboutMissing && (
        <div className="mb-5 border border-amber-300 bg-amber-50 p-4 text-sm">
          <p className="mb-1 font-bold">
            Missing: {missing.map(({ label }) => label).join(", ")}
          </p>
          <p className="mb-3 text-[var(--muted)]">
            Customers will see a placeholder for {missing.length === 1 ? "that angle" : "those angles"} on the
            product page
            {onHero ? ", and the hero will mirror or reuse the photos you did add" : ""}. Want to add{" "}
            {missing.length === 1 ? "it" : "them"} now?
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setAskAboutMissing(false)} className={primaryButton}>
              Add them now
            </button>
            <button type="button" onClick={() => submit({ skipAngleCheck: true })} className={secondaryButton}>
              Save anyway
            </button>
          </div>
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={() => submit()} disabled={saving} className={primaryButton}>
          {saving ? "Saving…" : piece ? "Save changes" : "Add piece"}
        </button>
        <button type="button" onClick={onCancel} className={secondaryButton}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   THE PAGE
   ============================================================ */

export default function AdminPage() {
  const [signedIn, setSignedIn] = useState(() => Boolean(adminSession.get()));
  const [screen, setScreen] = useState({ name: "list" }); // list | form
  const [refreshKey, setRefreshKey] = useState(0);

  function signOut() {
    adminSession.clear();
    setSignedIn(false);
    setScreen({ name: "list" });
  }

  return (
    <div className="min-h-screen bg-[var(--cream)] text-[var(--ink)]">
      {!signedIn && <LoginForm onSignedIn={() => setSignedIn(true)} />}

      {signedIn && screen.name === "list" && (
        <PieceList
          refreshKey={refreshKey}
          onNew={() => setScreen({ name: "form", piece: null })}
          onEdit={(piece) => setScreen({ name: "form", piece })}
          onSignOut={signOut}
        />
      )}

      {signedIn && screen.name === "form" && (
        <PieceForm
          key={screen.piece?.id ?? "new"}
          piece={screen.piece}
          onCancel={() => setScreen({ name: "list" })}
          onDone={() => {
            setRefreshKey((key) => key + 1);
            setScreen({ name: "list" });
          }}
          onExpired={signOut}
        />
      )}
    </div>
  );
}
