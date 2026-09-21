/*
  Two small screens that have no frame in the Figma:
    - Product List   Lara's pieces as photo cards (this is the old admin
                     grid, restyled) — the quickest way to see angle photos
                     and where each piece appears on the home page.
    - ComingSoon     the menu items that aren't designed yet
                     (Coupon Code, Brand, Product Media, Product Reviews,
                     Control Authority).
*/
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CirclePlus, Hourglass } from "lucide-react";
import { useAdmin } from "../AdminData";
import { titleFor } from "../AdminShell";
import { naira } from "../fmt";
import { Btn, Card, EmptyState } from "../ui";

const ANGLE_KEYS = ["front", "left", "right", "back"];

export function ProductListPage() {
  const { models } = useAdmin();
  const navigate = useNavigate();
  const pieces = models.products;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <h2 className="text-[22px] font-bold text-[var(--a-ink)]">Your pieces ({pieces.length})</h2>
        <Btn as={Link} to="/admin/products/new" className="h-12 rounded-md px-5">
          <CirclePlus size={22} /> Add Product
        </Btn>
      </div>

      {pieces.length === 0 ? (
        <Card>
          <EmptyState title="No pieces yet" text="Add your first piece and it will show up in the shop." />
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {pieces.map((p) => {
            const angles = ANGLE_KEYS.filter((k) => p.views?.[k]).length;
            return (
              <li key={p._id || p.id}>
                <Card className="overflow-hidden">
                  <button type="button" onClick={() => navigate(`/admin/products/${p._id || p.id}`)} className="block w-full text-left">
                    <div className="flex h-[220px] items-center justify-center bg-[#f6f3f3]">
                      {p.image && <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain" loading="lazy" />}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[17px] font-bold text-[var(--a-ink)]">{p.name}</p>
                        <p className="text-[15px] font-bold text-[var(--a-ink)]">{naira(p.price)}</p>
                      </div>
                      <p className="mt-0.5 text-[13px] capitalize text-[var(--a-muted)]">
                        {p.categoryLabel} · {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
                        <span className={angles === 4 ? "rounded-full bg-[#e7f7ec] px-2.5 py-1 text-[var(--a-green)]" : "rounded-full bg-[#fff4e0] px-2.5 py-1 text-[var(--a-amber)]"}>
                          {angles}/4 angle photos
                        </span>
                        {(p.placements || []).map((pl) => (
                          <span key={pl} className="rounded-full bg-[var(--a-pink)] px-2.5 py-1 capitalize text-[var(--a-maroon)]">
                            {pl}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function ComingSoonPage() {
  const { pathname } = useLocation();
  return (
    <Card className="mx-auto mt-6 max-w-xl">
      <div className="flex flex-col items-center px-6 py-14 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-[var(--a-pink)] text-[var(--a-maroon)]">
          <Hourglass size={26} />
        </span>
        <h2 className="mt-5 text-[22px] font-bold text-[var(--a-ink)]">{titleFor(pathname)} is coming soon</h2>
        <p className="mt-2 max-w-sm text-[15px] text-[var(--a-muted)]">
          This part of the dashboard isn&rsquo;t designed yet. Everything else in the menu works.
        </p>
        <Btn as={Link} to="/admin" className="mt-6 h-11 rounded-md px-6 text-[15px]">
          Back to the dashboard
        </Btn>
      </div>
    </Card>
  );
}
