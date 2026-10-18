/*
  HOME HERO — which pieces appear in the carousel at the top of the home page,
  and in what order.

  The list on top IS the hero: the first piece is the one visitors see first, the
  next ones follow. Use the arrows to reorder, "Remove" to take a piece off (it stays
  in the shop), and "Add" on the pieces below to put another one on. Nothing changes
  on the real site until "Save changes" is pressed.

  TIP: every piece here is a real product from the Product List, so clicking it on the
  home page opens its product page and it can be bought. A piece needs a front-facing
  photo to be on the hero; left / right photos are optional (the hero mirrors one side
  or uses the front photo when a side is missing).

  Saves with PUT /api/products/hero/order (server/routes/products.js).
*/
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, CirclePlus, X } from "lucide-react";
import { MAX_HERO_PIECES, saveHeroOrder } from "../../api";
import { useAdmin } from "../AdminData";
import { cx } from "../fmt";
import { Btn, Card, EmptyState, SearchField, Thumb, useToast } from "../ui";

const idOf = (p) => p._id || p.id;
const rank = (p) => (Number.isFinite(p.heroOrder) ? p.heroOrder : 1e9);
const hasFront = (p) => Boolean(p.views?.front || p.images?.[0]);

function photoNote(p) {
  if (!hasFront(p)) return "No front photo yet";
  const sides = ["left", "right"].filter((k) => p.views?.[k]);
  return sides.length ? `Front + ${sides.join(" + ")} photos` : "Front photo only";
}

export default function HeroPage() {
  const { products, refresh, demo } = useAdmin();
  const [toast, toastNode] = useToast();
  const [query, setQuery] = useState("");
  const [edited, setEdited] = useState(null); // null = nothing changed yet
  const [saving, setSaving] = useState(false);

  const byId = useMemo(() => new Map(products.map((p) => [idOf(p), p])), [products]);

  // the order the server currently has
  const savedIds = useMemo(
    () => products.filter((p) => p.placements?.includes("hero")).sort((a, b) => rank(a) - rank(b)).map(idOf),
    [products]
  );

  const ids = edited ?? savedIds;
  const onHero = ids.map((id) => byId.get(id)).filter(Boolean);
  const shownIds = onHero.map(idOf);
  const dirty = edited !== null && shownIds.join("|") !== savedIds.join("|");
  const full = onHero.length >= MAX_HERO_PIECES;
  const over = onHero.length - MAX_HERO_PIECES; // > 0 = too many to save

  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    const taken = new Set(shownIds);
    return products.filter(
      (p) => !taken.has(idOf(p)) && (!q || `${p.name} ${p.categoryLabel || ""}`.toLowerCase().includes(q))
    );
  }, [products, shownIds, query]);

  function move(index, direction) {
    const next = [...shownIds];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setEdited(next);
  }

  const remove = (id) => setEdited(shownIds.filter((x) => x !== id));
  const add = (id) => setEdited([...shownIds, id]);

  async function save() {
    if (demo) return toast("Sample data — nothing is saved in demo mode.");
    if (over > 0) return toast(`The hero holds up to ${MAX_HERO_PIECES} pieces. Remove ${over} to save.`, "error");
    setSaving(true);
    try {
      await saveHeroOrder(shownIds);
      await refresh();
      setEdited(null);
      toast("Home hero saved.");
    } catch (err) {
      toast(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  const arrow = "flex size-9 items-center justify-center rounded-md text-[var(--a-ink)] hover:bg-[#f3f4f5] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        <h2 className="text-[22px] font-bold text-[var(--a-ink)]">On the home page hero ({onHero.length} of {MAX_HERO_PIECES})</h2>
        <div className="flex flex-wrap items-center gap-3">
          {dirty && (
            <Btn variant="white" onClick={() => setEdited(null)} disabled={saving} className="h-10 rounded-md px-4 text-[14px]">
              Discard
            </Btn>
          )}
          <Btn onClick={save} disabled={!dirty || saving || over > 0} className="h-10 rounded-md px-5 text-[14px]">
            {saving ? "Saving…" : "Save changes"}
          </Btn>
        </div>
      </div>
      <p className="pb-4 text-[14px] text-[var(--a-muted)]">
        The first piece is the one visitors see first. Use the arrows to change the order, then press Save changes.
        {dirty && <span className="font-bold text-[var(--a-maroon)]"> You have unsaved changes.</span>}
      </p>
      {over > 0 && (
        <p className="mb-4 rounded-md border border-[#fecaca] bg-[#fef2f2] p-3 text-[13px] text-[#991b1b]">
          The hero holds up to {MAX_HERO_PIECES} pieces, and {onHero.length} are on it. Only the first {MAX_HERO_PIECES} show on the home
          page. Remove {over} to be able to save.
        </p>
      )}

      {onHero.length === 0 ? (
        <Card>
          <EmptyState
            title="Nothing on the hero yet"
            text="Add pieces from the list below. Until you do, the home page shows a “new pieces are on their way” note."
          />
        </Card>
      ) : (
        <Card className="divide-y divide-[#eef0f2]">
          {onHero.map((p, index) => (
            <div key={idOf(p)} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--a-maroon)] text-[13px] font-bold text-white">
                {index + 1}
              </span>
              <Thumb src={p.views?.front} alt={p.name} size={56} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-[var(--a-ink)]">{p.name}</p>
                <p className="text-[13px] text-[var(--a-muted)]">
                  {photoNote(p)} ·{" "}
                  <Link to={`/admin/products/${idOf(p)}`} className="underline">
                    Edit photos
                  </Link>
                </p>
              </div>
              <div className="flex items-center">
                <button type="button" aria-label={`Move ${p.name} earlier`} onClick={() => move(index, -1)} disabled={index === 0} className={arrow}>
                  <ArrowUp size={18} />
                </button>
                <button type="button" aria-label={`Move ${p.name} later`} onClick={() => move(index, 1)} disabled={index === onHero.length - 1} className={arrow}>
                  <ArrowDown size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(idOf(p))}
                  className="ml-1 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] text-[var(--a-muted)] hover:bg-[#ffe4e6] hover:text-[var(--a-red)]"
                >
                  <X size={15} /> Remove
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 pt-8">
        <h2 className="text-[22px] font-bold text-[var(--a-ink)]">Add a piece to the hero</h2>
        <SearchField value={query} onChange={setQuery} placeholder="Search pieces…" className="w-[200px]" />
      </div>
      {full && (
        <p className="mb-3 text-[13px] text-[var(--a-muted)]">
          The hero is full ({onHero.length} of {MAX_HERO_PIECES}). Remove a piece above to add another.
        </p>
      )}

      {available.length === 0 ? (
        <Card>
          <EmptyState
            title={products.length === 0 ? "No pieces yet" : query ? "No pieces match your search" : "Every piece is already on the hero"}
            text={products.length === 0 ? "Add a product first, then you can put it on the hero." : "Removing a piece above makes it show up here again."}
          />
        </Card>
      ) : (
        <Card className="divide-y divide-[#eef0f2]">
          {available.map((p) => {
            const ok = hasFront(p);
            return (
              <div key={idOf(p)} className="flex items-center gap-3 p-3">
                <Thumb src={p.views?.front} alt={p.name} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-[var(--a-ink)]">{p.name}</p>
                  <p className={cx("text-[13px]", ok ? "text-[var(--a-muted)]" : "text-[var(--a-red)]")}>
                    {ok ? photoNote(p) : "Needs a front-facing photo before it can go on the hero"}
                  </p>
                </div>
                <Btn variant="white" onClick={() => add(idOf(p))} disabled={!ok || full} className="h-9 rounded-md px-3 text-[14px]">
                  <CirclePlus size={16} /> Add
                </Btn>
              </div>
            );
          })}
        </Card>
      )}

      {toastNode}
    </div>
  );
}
