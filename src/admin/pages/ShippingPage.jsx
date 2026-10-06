/*
  SHIPPING — where Lara sets what delivery costs for each place.

  How the prices are picked at checkout (most specific wins):
    1. the customer's STATE (Nigeria only)   -> the state's own price
    2. the customer's COUNTRY                -> the Nigeria-wide / country price
    3. anywhere else                         -> the DEFAULT price at the top
  A blank price means "use the next one down", so Lara only fills in the
  places that are different. Untick "Deliver" to stop orders to a place.

  All prices are in Naira (₦) — that is what Paystack charges, even for
  customers in other countries.
*/
import { useEffect, useMemo, useState } from "react";
import { getShippingRates, saveShippingRates } from "../../api";
import { countries } from "../../data/countries";
import { NIGERIAN_STATES } from "../../data/nigerianStates";
import { useAdmin } from "../AdminData";
import { Btn, Card, CardHead, Checkbox, useToast } from "../ui";
import Select from "../../components/Select";

const DEFAULT_KEY = "*|";
const NG_KEY = "NG|";
const keyOf = (country, state = "") => `${country}|${state}`;
const blank = () => ({ standard: "", express: "", active: true });
const isFilled = (v) => v !== "" && v != null;

const DEMO_ROWS = {
  [DEFAULT_KEY]: { standard: "20440", express: "30440", active: true },
  [NG_KEY]: { standard: "6000", express: "9000", active: true },
  "NG|Lagos": { standard: "3500", express: "5500", active: true },
};

const input =
  "h-10 w-full rounded-md border border-[#e1e4e8] bg-[var(--a-bg)] px-3 text-[15px] text-[var(--a-ink)] outline-none focus:border-[var(--a-maroon)] disabled:opacity-50";

// server rows -> { "NG|Lagos": { standard: "3500", express: "5500", active: true } }
function toMap(list) {
  const map = {};
  for (const r of list) {
    map[keyOf(r.country, r.state)] = {
      standard: String(r.standard),
      express: String(r.express),
      active: r.active !== false,
    };
  }
  return map;
}

function PriceRow({ label, row = blank(), fallback, onChange, onClear, clearLabel = "Clear" }) {
  return (
    <div className="grid min-w-[560px] grid-cols-[1.3fr_1fr_1fr_84px_64px] items-center gap-3 border-b border-[#eef0f3] px-4 py-2.5">
      <span className="text-[15px] font-bold text-[var(--a-ink)]">{label}</span>
      <input
        type="number"
        min="0"
        step="1"
        inputMode="numeric"
        aria-label={`${label} standard price`}
        placeholder={fallback ? fallback.standard : ""}
        value={row.standard}
        onChange={(e) => onChange({ standard: e.target.value })}
        className={input}
      />
      <input
        type="number"
        min="0"
        step="1"
        inputMode="numeric"
        aria-label={`${label} express price`}
        placeholder={fallback ? fallback.express : ""}
        value={row.express}
        onChange={(e) => onChange({ express: e.target.value })}
        className={input}
      />
      <span className="flex justify-start">
        <Checkbox
          checked={row.active !== false}
          onChange={(e) => onChange({ active: e.target.checked })}
          label={`Deliver to ${label}`}
        />
      </span>
      {onClear ? (
        <button type="button" onClick={onClear} className="text-[14px] font-bold text-[var(--a-maroon)] underline">
          {clearLabel}
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}

function TableHead({ first }) {
  return (
    <div className="grid min-w-[560px] grid-cols-[1.3fr_1fr_1fr_84px_64px] gap-3 bg-[var(--a-pink)] px-4 py-2.5 text-[14px] font-bold text-[var(--a-maroon)]">
      <span>{first}</span>
      <span>Standard (₦)</span>
      <span>Express (₦)</span>
      <span>Deliver</span>
      <span />
    </div>
  );
}

export default function ShippingPage() {
  const { demo } = useAdmin();
  const [showToast, toastNode] = useToast();
  const [rows, setRows] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [quick, setQuick] = useState({ standard: "", express: "" });
  const [addCountry, setAddCountry] = useState("");

  useEffect(() => {
    if (demo) {
      setRows(DEMO_ROWS);
      setLoading(false);
      return;
    }
    let cancelled = false;
    getShippingRates()
      .then((list) => !cancelled && setRows(toMap(list)))
      .catch((err) => {
        if (!cancelled) setLoadError(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [demo]);

  const update = (key, patch) => setRows((r) => ({ ...r, [key]: { ...(r[key] || blank()), ...patch } }));
  const clear = (key) => setRows((r) => ({ ...r, [key]: blank() }));

  const def = rows[DEFAULT_KEY] || blank();
  const ngWide = rows[NG_KEY];
  const ngFallback = isFilled(ngWide?.standard) && isFilled(ngWide?.express) ? ngWide : def;

  // other countries = every row that isn't the default or Nigeria
  const extraKeys = useMemo(
    () => Object.keys(rows).filter((k) => !k.startsWith("*|") && !k.startsWith("NG|")).sort(),
    [rows]
  );
  const countryName = (code) => countries.find((c) => c.code === code)?.name || code;
  const addable = countries.filter((c) => c.code !== "NG" && !rows[keyOf(c.code)]);

  function fillEmptyStates() {
    if (!isFilled(quick.standard) || !isFilled(quick.express)) {
      return showToast("Type both a Standard and an Express price first.", "error");
    }
    setRows((r) => {
      const next = { ...r };
      for (const st of NIGERIAN_STATES) {
        const k = keyOf("NG", st);
        const cur = next[k] || blank();
        if (!isFilled(cur.standard) && !isFilled(cur.express)) {
          next[k] = { ...cur, standard: quick.standard, express: quick.express };
        }
      }
      return next;
    });
    showToast("Filled the empty states — press Save to keep them.");
  }

  async function save() {
    // build the list the server wants, checking each row as we go
    const list = [];
    const label = (k) => {
      const [c, s] = k.split("|");
      return c === "*" ? "the default rate" : s || countryName(c);
    };
    for (const [k, row] of Object.entries(rows)) {
      const [country, state] = k.split("|");
      const std = isFilled(row.standard);
      const exp = isFilled(row.express);
      const active = row.active !== false;
      const isDefault = k === DEFAULT_KEY;

      if (!std && !exp && active && !isDefault) continue; // blank = uses the fallback price
      if (isDefault && (!std || !exp)) {
        return showToast("The default rate needs both a Standard and an Express price.", "error");
      }
      if (active && std !== exp) {
        return showToast(`Fill in BOTH prices for ${label(k)}, or clear both.`, "error");
      }
      // switched-off place with no prices typed: reuse the fallback so it can be saved
      const fb = country === "NG" && state ? ngFallback : def;
      list.push({
        country,
        state,
        standard: std ? Number(row.standard) : Number(fb.standard),
        express: exp ? Number(row.express) : Number(fb.express),
        active,
      });
    }
    if (demo) return showToast("Sample data — nothing is saved in demo mode.");
    setSaving(true);
    try {
      const saved = await saveShippingRates(list);
      setRows(toMap(saved));
      showToast("Shipping prices saved.");
    } catch (err) {
      showToast(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="py-24 text-center text-[16px] text-[var(--a-muted)]">Loading shipping prices…</p>;
  if (loadError) {
    return (
      <p role="alert" className="rounded-md bg-[#fff1f2] px-4 py-3 text-[14px] text-[var(--a-red)]">
        {loadError}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <CardHead title="Shipping prices">
          <Btn onClick={save} disabled={saving} className="h-11 rounded-md px-6">
            {saving ? "Saving…" : "Save"}
          </Btn>
        </CardHead>
        <p className="mt-2 text-[14px] leading-5 text-[var(--a-muted)]">
          Set what delivery costs for each place, in Naira (₦). Customers outside Nigeria are charged in Naira too.
          Leave a price blank to use the next price down (state → Nigeria-wide → default). Untick{" "}
          <b>Deliver</b> for a place you can't send to — customers there won't be able to check out.
        </p>
      </Card>

      <Card className="overflow-x-auto p-0">
        <div className="px-6 pt-5">
          <CardHead title="Default price" />
          <p className="mb-3 mt-1 text-[14px] text-[var(--a-muted)]">
            Used for any country you haven't listed below. Untick Deliver if you only ship to the places you list.
          </p>
        </div>
        <TableHead first="Everywhere else" />
        <PriceRow label="Default" row={def} onChange={(p) => update(DEFAULT_KEY, p)} />
      </Card>

      <Card className="overflow-x-auto p-0">
        <div className="px-6 pt-5">
          <CardHead title="Nigeria" />
          <p className="mb-3 mt-1 text-[14px] text-[var(--a-muted)]">
            Set a Nigeria-wide price, then only fill in the states that are different. States left blank use the
            Nigeria-wide price.
          </p>
          <div className="mb-4 flex flex-wrap items-end gap-3 rounded-md bg-[var(--a-bg)] p-3">
            <span className="text-[14px] font-bold text-[var(--a-ink)]">Quick fill</span>
            <label className="text-[13px] text-[var(--a-muted)]">
              Standard (₦)
              <input
                type="number"
                min="0"
                step="1"
                value={quick.standard}
                onChange={(e) => setQuick((q) => ({ ...q, standard: e.target.value }))}
                className={`${input} mt-1 w-32 bg-white`}
              />
            </label>
            <label className="text-[13px] text-[var(--a-muted)]">
              Express (₦)
              <input
                type="number"
                min="0"
                step="1"
                value={quick.express}
                onChange={(e) => setQuick((q) => ({ ...q, express: e.target.value }))}
                className={`${input} mt-1 w-32 bg-white`}
              />
            </label>
            <Btn variant="outline" onClick={fillEmptyStates} className="h-10 rounded-md px-4">
              Apply to empty states
            </Btn>
          </div>
        </div>
        <TableHead first="Location" />
        <PriceRow
          label="All of Nigeria"
          row={rows[NG_KEY] || blank()}
          fallback={def}
          onChange={(p) => update(NG_KEY, p)}
          onClear={() => clear(NG_KEY)}
        />
        {NIGERIAN_STATES.map((st) => (
          <PriceRow
            key={st}
            label={st}
            row={rows[keyOf("NG", st)] || blank()}
            fallback={ngFallback}
            onChange={(p) => update(keyOf("NG", st), p)}
            onClear={() => clear(keyOf("NG", st))}
          />
        ))}
      </Card>

      <Card className="overflow-x-auto p-0">
        <div className="px-6 pt-5">
          <CardHead title="Other countries" />
          <p className="mb-3 mt-1 text-[14px] text-[var(--a-muted)]">
            One price per country. Any country not listed here uses the default price.
          </p>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Select
              value={addCountry}
              onChange={(e) => setAddCountry(e.target.value)}
              aria-label="Choose a country to add"
              className={`${input} w-64`}
            >
              <option value="">Choose a country…</option>
              {addable.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Btn
              variant="outline"
              className="h-10 rounded-md px-4"
              disabled={!addCountry}
              onClick={() => {
                update(keyOf(addCountry), {});
                setAddCountry("");
              }}
            >
              Add country
            </Btn>
          </div>
        </div>
        {extraKeys.length === 0 ? (
          <p className="px-6 pb-6 text-[14px] text-[var(--a-muted)]">No other countries added yet.</p>
        ) : (
          <>
            <TableHead first="Country" />
            {extraKeys.map((k) => (
              <PriceRow
                key={k}
                label={countryName(k.split("|")[0])}
                row={rows[k]}
                fallback={def}
                onChange={(p) => update(k, p)}
                onClear={() =>
                  setRows((r) => {
                    const next = { ...r };
                    delete next[k];
                    return next;
                  })
                }
                clearLabel="Remove"
              />
            ))}
          </>
        )}
      </Card>

      <div className="flex justify-end pb-6">
        <Btn onClick={save} disabled={saving} className="h-11 rounded-md px-8">
          {saving ? "Saving…" : "Save"}
        </Btn>
      </div>
      {toastNode}
    </div>
  );
}
