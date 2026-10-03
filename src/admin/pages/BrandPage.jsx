/*
  BRAND — the settings that appear on the shop itself:
    - logo (top bar) and favicon (browser tab)
    - main brand colour (optional — empty keeps the site's built-in colour)
    - Instagram / TikTok / WhatsApp / business email (shown in the footer)
  Saved in the database (server/routes/brand.js). The storefront reads them
  when a page opens (src/BrandProvider.jsx).
*/
import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Save } from "lucide-react";
import { getBrand, saveBrand, uploadBrandImage } from "../../api";
import { useAdmin } from "../AdminData";
import { Btn, Card, useToast } from "../ui";

const inp =
  "h-11 w-full rounded-md border border-[#eceef1] bg-[var(--a-bg)] px-3.5 text-[15px] text-[var(--a-ink)] outline-none focus:border-[var(--a-maroon)]";
const lbl = "mb-2 block text-[14px] font-bold text-[var(--a-ink)]";

// the colour the shop uses today (src/index.css --maroon); shown when none is chosen
const SITE_DEFAULT_COLOR = "#412b2d";

const EMPTY = { logoUrl: "", faviconUrl: "", primaryColor: "", instagramUrl: "", tiktokUrl: "", whatsappNumber: "", email: "" };

function Section({ title, children }) {
  return (
    <Card className="p-6">
      <h3 className="mb-5 text-[18px] font-bold text-[var(--a-ink)]">{title}</h3>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

export default function BrandPage() {
  const { demo } = useAdmin();
  const [toast, toastNode] = useToast();
  const logoInput = useRef(null);
  const faviconInput = useRef(null);

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!demo);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");

  useEffect(() => {
    if (demo) return undefined;
    let cancelled = false;
    getBrand()
      .then((b) => !cancelled && setForm({ ...EMPTY, ...b }))
      .catch((err) => !cancelled && setLoadError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [demo]);

  const fail = (err) => toast(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message, "error");
  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Uploads straight to Cloudinary so the picture is permanent — the old
  // version kept a temporary browser link that stopped working after a reload.
  async function pick(field, e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (demo) return toast("Sample data — nothing is saved in demo mode.");
    setUploading(field);
    try {
      const url = await uploadBrandImage(file);
      setForm((f) => ({ ...f, [field]: url }));
      toast("Image uploaded — press Save changes to keep it.");
    } catch (err) {
      fail(err);
    } finally {
      setUploading("");
    }
  }

  async function save() {
    if (demo) return toast("Sample data — nothing is saved in demo mode.");
    setSaving(true);
    try {
      setForm({ ...EMPTY, ...(await saveBrand(form)) });
      toast("Brand settings saved.");
    } catch (err) {
      fail(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="py-24 text-center text-[16px] text-[var(--a-muted)]">Loading brand settings…</p>;
  if (loadError) {
    return <p role="alert" className="rounded-md bg-[#fff1f2] px-4 py-3 text-[14px] text-[var(--a-red)]">{loadError}</p>;
  }

  const logoPreview = form.logoUrl;
  const faviconPreview = form.faviconUrl;
  const shownColor = form.primaryColor || SITE_DEFAULT_COLOR;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        <h2 className="text-[22px] font-bold text-[var(--a-ink)]">Brand Settings</h2>
        <Btn className="h-12 rounded-md px-5" onClick={save} disabled={saving}>
          <Save size={18} /> {saving ? "Saving…" : "Save changes"}
        </Btn>
      </div>

      {/* Logos */}
      <Section title="Logo &amp; Favicon">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Logo */}
          <div>
            <label className={lbl}>Shop logo</label>
            <input ref={logoInput} type="file" accept="image/*" hidden onChange={(e) => pick("logoUrl", e)} />
            <div
              onClick={() => logoInput.current?.click()}
              className="flex h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-[#d1d5db] bg-[#fafafa] transition hover:border-[var(--a-maroon)] hover:bg-[var(--a-pink)]"
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="max-h-[100px] max-w-[80%] object-contain" />
              ) : (
                <>
                  <ImageIcon size={28} className="text-[var(--a-muted)]" />
                  <span className="text-[13px] text-[var(--a-muted)]">{uploading === "logoUrl" ? "Uploading…" : "Click to upload logo"}</span>
                </>
              )}
            </div>
            <p className="mt-1.5 text-[12px] text-[var(--a-muted)]">PNG or SVG, transparent background recommended. Max 2 MB.</p>
          </div>

          {/* Favicon */}
          <div>
            <label className={lbl}>Favicon</label>
            <input ref={faviconInput} type="file" accept="image/*,.ico" hidden onChange={(e) => pick("faviconUrl", e)} />
            <div
              onClick={() => faviconInput.current?.click()}
              className="flex h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-[#d1d5db] bg-[#fafafa] transition hover:border-[var(--a-maroon)] hover:bg-[var(--a-pink)]"
            >
              {faviconPreview ? (
                <img src={faviconPreview} alt="Favicon preview" className="size-12 object-contain" />
              ) : (
                <>
                  <ImageIcon size={28} className="text-[var(--a-muted)]" />
                  <span className="text-[13px] text-[var(--a-muted)]">{uploading === "faviconUrl" ? "Uploading…" : "Click to upload favicon"}</span>
                </>
              )}
            </div>
            <p className="mt-1.5 text-[12px] text-[var(--a-muted)]">16×16 or 32×32 ICO / PNG. Shows in the browser tab.</p>
          </div>
        </div>
      </Section>

      {/* Colour */}
      <Section title="Brand Colour">
        <div>
          <label className={lbl}>Main colour</label>
          <div className="flex items-center gap-3">
            <input type="color" value={shownColor} onChange={upd("primaryColor")} className="size-10 cursor-pointer rounded-md border border-[#eceef1] p-0.5" />
            <input className={inp} value={form.primaryColor} onChange={upd("primaryColor")} maxLength={7} placeholder={`Empty = the shop's current colour (${SITE_DEFAULT_COLOR})`} />
            {form.primaryColor && (
              <button type="button" onClick={() => setForm((f) => ({ ...f, primaryColor: "" }))} className="shrink-0 text-[14px] font-bold text-[var(--a-maroon)] underline">
                Reset
              </button>
            )}
          </div>
          <p className="mt-1.5 text-[12px] text-[var(--a-muted)]">Used for buttons and highlights across the shop.</p>
        </div>
        <div className="h-12 rounded-md border border-[#e5e7eb]" style={{ background: shownColor }} />
      </Section>

      {/* Social & contact */}
      <Section title="Social &amp; Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={lbl}>Instagram URL</label>
            <input className={inp} placeholder="https://instagram.com/larascrochet" value={form.instagramUrl} onChange={upd("instagramUrl")} />
          </div>
          <div>
            <label className={lbl}>TikTok URL</label>
            <input className={inp} placeholder="https://tiktok.com/@larascrochet" value={form.tiktokUrl} onChange={upd("tiktokUrl")} />
          </div>
          <div>
            <label className={lbl}>WhatsApp number</label>
            <input className={inp} placeholder="+2348012345678" value={form.whatsappNumber} onChange={upd("whatsappNumber")} />
          </div>
          <div>
            <label className={lbl}>Business email</label>
            <input type="email" className={inp} placeholder="hello@larascrochet.com" value={form.email} onChange={upd("email")} />
          </div>
        </div>
      </Section>

      {toastNode}
    </div>
  );
}
