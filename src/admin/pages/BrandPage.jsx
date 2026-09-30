/*
  BRAND — Lara's brand settings: shop name, tagline, logo, colours,
  social links and a short "about" blurb.
  Changes here are saved in localStorage until a real API is wired up.
*/
import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Save } from "lucide-react";
import { useAdmin } from "../AdminData";
import { Btn, Card, useToast } from "../ui";

const inp =
  "h-11 w-full rounded-md border border-[#eceef1] bg-[var(--a-bg)] px-3.5 text-[15px] text-[var(--a-ink)] outline-none focus:border-[var(--a-maroon)]";
const lbl = "mb-2 block text-[14px] font-bold text-[var(--a-ink)]";

const STORAGE_KEY = "laras-brand-settings";

function loadBrand() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

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

  const saved = loadBrand();
  const [form, setForm] = useState({
    shopName: "Lara's Crochet",
    tagline: "Handcrafted with love",
    about: "Welcome to Lara's Crochet — where every stitch tells a story.",
    primaryColor: "#412b2d",
    accentColor: "#c9a27e",
    instagramUrl: "",
    tiktokUrl: "",
    whatsappNumber: "",
    email: "",
    ...saved,
  });
  const [logoPreview, setLogoPreview] = useState(saved.logoPreview || null);
  const [faviconPreview, setFaviconPreview] = useState(saved.faviconPreview || null);
  const [saving, setSaving] = useState(false);

  const upd = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function pickLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
  }

  function pickFavicon(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFaviconPreview(url);
  }

  async function save() {
    if (demo) {
      toast("Sample data — nothing is saved in demo mode.");
      return;
    }
    setSaving(true);
    // Persist locally (real API call goes here when the endpoint is ready)
    await new Promise((r) => setTimeout(r, 600));
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...form, logoPreview, faviconPreview })
    );
    setSaving(false);
    toast("Brand settings saved.");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        <h2 className="text-[22px] font-bold text-[var(--a-ink)]">Brand Settings</h2>
        <Btn className="h-12 rounded-md px-5" onClick={save} disabled={saving}>
          <Save size={18} /> {saving ? "Saving…" : "Save changes"}
        </Btn>
      </div>

      {/* Identity */}
      <Section title="Identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={lbl}>Shop name</label>
            <input className={inp} value={form.shopName} onChange={upd("shopName")} />
          </div>
          <div>
            <label className={lbl}>Tagline</label>
            <input className={inp} value={form.tagline} onChange={upd("tagline")} placeholder="Handcrafted with love" />
          </div>
        </div>
        <div>
          <label className={lbl}>About / shop description</label>
          <textarea
            rows={4}
            className="w-full rounded-md border border-[#eceef1] bg-[var(--a-bg)] px-3.5 py-2.5 text-[15px] text-[var(--a-ink)] outline-none focus:border-[var(--a-maroon)] resize-none"
            value={form.about}
            onChange={upd("about")}
          />
        </div>
      </Section>

      {/* Logos */}
      <Section title="Logo &amp; Favicon">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Logo */}
          <div>
            <label className={lbl}>Shop logo</label>
            <input ref={logoInput} type="file" accept="image/*" hidden onChange={pickLogo} />
            <div
              onClick={() => logoInput.current?.click()}
              className="flex h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-[#d1d5db] bg-[#fafafa] transition hover:border-[var(--a-maroon)] hover:bg-[var(--a-pink)]"
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="max-h-[100px] max-w-[80%] object-contain" />
              ) : (
                <>
                  <ImageIcon size={28} className="text-[var(--a-muted)]" />
                  <span className="text-[13px] text-[var(--a-muted)]">Click to upload logo</span>
                </>
              )}
            </div>
            <p className="mt-1.5 text-[12px] text-[var(--a-muted)]">PNG or SVG, transparent background recommended. Max 2 MB.</p>
          </div>

          {/* Favicon */}
          <div>
            <label className={lbl}>Favicon</label>
            <input ref={faviconInput} type="file" accept="image/*,.ico" hidden onChange={pickFavicon} />
            <div
              onClick={() => faviconInput.current?.click()}
              className="flex h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-[#d1d5db] bg-[#fafafa] transition hover:border-[var(--a-maroon)] hover:bg-[var(--a-pink)]"
            >
              {faviconPreview ? (
                <img src={faviconPreview} alt="Favicon preview" className="size-12 object-contain" />
              ) : (
                <>
                  <ImageIcon size={28} className="text-[var(--a-muted)]" />
                  <span className="text-[13px] text-[var(--a-muted)]">Click to upload favicon</span>
                </>
              )}
            </div>
            <p className="mt-1.5 text-[12px] text-[var(--a-muted)]">16×16 or 32×32 ICO / PNG. Shows in the browser tab.</p>
          </div>
        </div>
      </Section>

      {/* Colours */}
      <Section title="Brand Colours">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={lbl}>Primary colour</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.primaryColor} onChange={upd("primaryColor")} className="size-10 cursor-pointer rounded-md border border-[#eceef1] p-0.5" />
              <input className={inp} value={form.primaryColor} onChange={upd("primaryColor")} maxLength={7} />
            </div>
          </div>
          <div>
            <label className={lbl}>Accent colour</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.accentColor} onChange={upd("accentColor")} className="size-10 cursor-pointer rounded-md border border-[#eceef1] p-0.5" />
              <input className={inp} value={form.accentColor} onChange={upd("accentColor")} maxLength={7} />
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="h-12 flex-1 rounded-md border border-[#e5e7eb]" style={{ background: form.primaryColor }} />
          <div className="h-12 flex-1 rounded-md border border-[#e5e7eb]" style={{ background: form.accentColor }} />
        </div>
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
