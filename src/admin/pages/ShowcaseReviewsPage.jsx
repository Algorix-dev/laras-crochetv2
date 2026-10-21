/*
  HOME REVIEWS — the nine customer reviews shown on the home page (the section with Lara's photos).

  Lara edits the name and the review text of each of the nine, and can move one up or down. Nothing changes on
  the real site until "Save changes" is pressed. Exactly nine are needed: the home-page animation shows three
  rows of three.

  Saves with PUT /api/showcase-reviews (server/routes/showcaseReviews.js). Until she saves her own, the site
  shows the built-in reviews from src/data/showcaseReviews.js, which is also what this page starts with.
*/
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, RotateCcw } from "lucide-react";
import { getShowcaseReviews, saveShowcaseReviews } from "../../api";
import { DEFAULT_TESTIMONIALS, SHOWCASE_REVIEW_COUNT } from "../../data/showcaseReviews";
import { useAdmin } from "../AdminData";
import { cx } from "../fmt";
import { Btn, Card, useToast } from "../ui";

const input =
  "h-11 w-full rounded-md border border-[#eceef1] bg-[var(--a-bg)] px-3.5 text-[15px] text-[var(--a-ink)] outline-none focus:border-[var(--a-maroon)]";
const MAX_NAME = 60;
const MAX_QUOTE = 300;

const copy = (list) => list.map((r) => ({ name: r.name, quote: r.quote }));
const same = (a, b) => a.length === b.length && a.every((r, i) => r.name === b[i].name && r.quote === b[i].quote);

export default function ShowcaseReviewsPage() {
  const { demo } = useAdmin();
  const [toast, toastNode] = useToast();
  const [items, setItems] = useState(() => copy(DEFAULT_TESTIMONIALS));
  const [saved, setSaved] = useState(() => copy(DEFAULT_TESTIMONIALS));
  const [loading, setLoading] = useState(!demo);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (demo) return undefined;
    let cancelled = false;
    getShowcaseReviews().then((data) => {
      if (cancelled) return;
      if (Array.isArray(data.items) && data.items.length === SHOWCASE_REVIEW_COUNT) {
        setItems(copy(data.items));
        setSaved(copy(data.items));
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [demo]);

  const dirty = useMemo(() => !same(items, saved), [items, saved]);

  const update = (index, patch) => setItems((list) => list.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const move = (index, delta) =>
    setItems((list) => {
      const to = index + delta;
      if (to < 0 || to >= list.length) return list;
      const next = [...list];
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });

  async function save() {
    setError("");
    const cleaned = items.map((r) => ({ name: r.name.trim(), quote: r.quote.trim() }));
    const bad = cleaned.findIndex((r) => !r.name || !r.quote);
    if (bad !== -1) return setError(`Review ${bad + 1} needs both a name and a review.`);
    if (demo) return toast("Sample data — nothing is saved in demo mode.");
    setSaving(true);
    try {
      await saveShowcaseReviews(cleaned);
      setItems(copy(cleaned));
      setSaved(copy(cleaned));
      toast("Home page reviews saved.");
    } catch (err) {
      setError(err.message === "SESSION_EXPIRED" ? "Your session ended — please sign in again." : err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
        <div>
          <h2 className="text-[22px] font-bold text-[var(--a-ink)]">Home Reviews</h2>
          <p className="mt-1 text-[14px] text-[var(--a-muted)]">
            The nine reviews shown on the home page, three per row, in this order. Edit the words, or move a review up or down.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Btn
            variant="white"
            onClick={() => setItems(copy(DEFAULT_TESTIMONIALS))}
            disabled={saving || same(items, DEFAULT_TESTIMONIALS)}
            className="h-11 rounded-md px-4 text-[14px]"
          >
            <RotateCcw size={15} /> Use the original reviews
          </Btn>
          <Btn onClick={save} disabled={saving || !dirty} className="h-11 rounded-md px-6 text-[15px]">
            {saving ? "Saving…" : "Save changes"}
          </Btn>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-[#fff1f2] px-4 py-3 text-[14px] text-[var(--a-red)]">
          {error}
        </p>
      )}
      {loading && <p className="mb-4 text-[14px] text-[var(--a-muted)]">Loading the saved reviews…</p>}

      <div className="grid gap-4 xl:grid-cols-2">
        {items.map((review, index) => (
          <Card key={index} className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[15px] font-bold text-[var(--a-ink)]">
                Review {index + 1}
                <span className="ml-2 text-[13px] font-normal text-[var(--a-muted)]">row {Math.floor(index / 3) + 1}</span>
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move review ${index + 1} up`}
                  className="flex size-8 items-center justify-center rounded-md border border-[#e5e7eb] text-[var(--a-ink)] hover:bg-[#f9fafb] disabled:opacity-40"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label={`Move review ${index + 1} down`}
                  className="flex size-8 items-center justify-center rounded-md border border-[#e5e7eb] text-[var(--a-ink)] hover:bg-[#f9fafb] disabled:opacity-40"
                >
                  <ArrowDown size={16} />
                </button>
              </div>
            </div>

            <label className="mb-1.5 block text-[14px] font-bold text-[var(--a-ink)]">Name</label>
            <input
              value={review.name}
              maxLength={MAX_NAME}
              onChange={(e) => update(index, { name: e.target.value })}
              className={input}
              placeholder="e.g. Amaka O."
            />

            <label className="mb-1.5 mt-4 block text-[14px] font-bold text-[var(--a-ink)]">Review</label>
            <textarea
              value={review.quote}
              maxLength={MAX_QUOTE}
              rows={4}
              onChange={(e) => update(index, { quote: e.target.value })}
              className={cx(input, "h-auto resize-none py-3 leading-6")}
              placeholder="What the customer said"
            />
            <p className="mt-1 text-right text-[12px] text-[var(--a-muted)]">
              {review.quote.length}/{MAX_QUOTE}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Btn onClick={save} disabled={saving || !dirty} className="h-11 rounded-md px-6 text-[15px]">
          {saving ? "Saving…" : "Save changes"}
        </Btn>
      </div>
      {toastNode}
    </div>
  );
}
