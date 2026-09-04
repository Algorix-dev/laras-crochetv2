/*
  STATIC REBUILD — no click handlers, no state, no Framer Motion.
  Matches Figma's Frame 61 / Group 29 / Frame 62 layout exactly, at
  the request to "just make it static like the figma, we'll do the
  interactions later." When that's ready, the selection logic from
  the earlier interactive version can be layered back on top of this
  same markup.

  IMAGE MAPPING — this follows Figma's own layer names:
    Model 2  (outer-left,  dimmed)              -> swuvvw
    Model 3  (inner-left,  dimmed)               -> 3lo3ls
    Frame 62 (center, full color, the hero item) -> REINA — see note below
    Model 5  (inner-right, dimmed, mirrored)     -> kj37u6
    Model 6  (outer-right, dimmed, mirrored)     -> yyuymy

  FIX (build was broken): these 4 imports pointed at
  src/assets/model-images/model2-swuvvw.png etc., but those files
  were never actually placed in the repo — only referenced by a
  filename that matched Figma's internal layer names. Vercel's build
  caught it (UNRESOLVED_IMPORT x4). The real images were sitting in
  the Figma export the whole time (Gemini_Generated_Image_swuvvw...,
  _3lo3ls..., _kj37u6..., _yyuymy...) — copied them into
  src/assets/model-images/ under the names Hero.jsx already expected,
  so this file itself didn't need to change, just the missing files.

  REINA: was pointing at sunset-front.png as a visible-but-wrong
  placeholder (noted below). Swapped for your actual reina-front.png,
  which already exists and is used elsewhere (CustomOrderBanner).

  WHY NO OVERSIZED/NEGATIVE-OFFSET IMAGE TRICK: Figma's own CSS
  handles the dimmed models with an oversized image + overflow-clip
  box + negative left offset (e.g. width:335px, left:-96px inside a
  173px box) — that's their workaround for the same "huge invisible
  side padding" problem covered a few messages back. Since these
  4 images are already tightly cropped to the real subject (not the
  raw uploads), that workaround isn't needed here — they're just
  sized directly by height, same clamp() approach as before.
*/

import model2 from "../assets/model-images/model2-swuvvw.png";
import model3 from "../assets/model-images/model3-3lo3ls.png";
import model5 from "../assets/model-images/model5-kj37u6.png";
import model6 from "../assets/model-images/model6-yyuymy.png";
import heroCenter from "../assets/reina-front.png";

export default function Hero() {
  return (
    <section className="pt-10 md:pt-16 pb-16 text-center">
      {/* Padding: 304/1920 = 15.83vw of Figma's frame, capped at
          304px (19rem). */}
      <div className="relative mx-auto px-[clamp(1rem,15.83vw,19rem)]">
        {/* Gap: 128px / 173.14px model width in Figma ≈ 6.667vw,
            capped at 128px (8rem). */}
        <div className="flex items-end justify-center gap-[clamp(1.5rem,6.667vw,8rem)]">
          {/* Model 2 — outer-left, dimmed */}
          <img
            src={model2}
            alt=""
            className="hidden md:block relative w-auto shrink-0 h-[clamp(9rem,27.8125vw,33.375rem)] opacity-30"
          />

          {/* Model 3 — inner-left, dimmed */}
          <img
            src={model3}
            alt=""
            className="relative w-auto shrink-0 h-[clamp(9rem,27.8125vw,33.375rem)] opacity-30"
          />

          {/* Frame 62 — center, the hero piece. Name + podium + price
              are nested inside this slot's own wrapper so they're
              trivially centered on this exact image with plain CSS,
              no measurement needed. */}
          <div className="relative">
            {/* Name — z-0, BEHIND the image (z-10). Bottom-anchored
                at 87.9% (73px overlap / 603px image height from
                Figma) so it's correct regardless of the image's
                actual rendered height. */}
            <h1 className="absolute left-1/2 -translate-x-1/2 bottom-[87.9%] z-0 font-['Raleway'] font-bold tracking-[-0.07em] text-[clamp(2.5rem,5vw,6rem)] leading-[1.18] text-[var(--maroon-dark)] select-none whitespace-nowrap pointer-events-none">
              REINA
            </h1>

            {/* Podium — 3 dashed ellipses (Figma's Group 29 /
                Ellipse 24-25-26), fully static. */}
            <div
              aria-hidden="true"
              className="absolute left-1/2 -translate-x-1/2 bottom-[-7.2%] z-0 w-[clamp(9rem,12.7vw,15.24rem)] aspect-[243.81/116.05] opacity-30 pointer-events-none"
            >
              <span
                className="absolute rounded-[50%] border-[var(--maroon-dark)]"
                style={{ left: "0%", top: "3.3%", width: "100%", height: "96.7%", borderStyle: "dashed", borderWidth: "clamp(1px, 0.26vw, 5px)" }}
              />
              <span
                className="absolute rounded-[50%] border-[var(--maroon-dark)]"
                style={{ left: "4.7%", top: "7.9%", width: "90.6%", height: "87.6%", borderStyle: "dashed", borderWidth: "clamp(1px, 0.26vw, 5px)" }}
              />
              <span
                className="absolute rounded-[50%] border-[var(--maroon-dark)]"
                style={{ left: "5.7%", top: "0%", width: "90.6%", height: "87.6%", borderStyle: "dashed", borderWidth: "clamp(1px, 0.26vw, 5px)" }}
              />
            </div>

            <img
              src={heroCenter}
              alt="Reina"
              className="relative z-10 w-auto max-w-none shrink-0 h-[clamp(11rem,31.40625vw,37.6875rem)]"
            />

            {/* Price row — Frame 62's "Name and Price tag", centered
                on this same slot, sitting right below the image. */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-6 z-10 w-[clamp(11rem,18.75vw,22.5rem)] flex items-center justify-between text-xl">
              <span className="uppercase tracking-wide">Reina</span>
              <span className="font-bold tracking-[-0.04em]">₦70,000</span>
            </div>
          </div>

          {/* Model 5 — inner-right, dimmed, mirrored (Figma:
              transform: matrix(-1,0,0,1,0,0) = scaleX(-1)) */}
          <img
            src={model5}
            alt=""
            style={{ transform: "scaleX(-1)" }}
            className="relative w-auto shrink-0 h-[clamp(9rem,27.8125vw,33.375rem)] opacity-30"
          />

          {/* Model 6 — outer-right, dimmed, mirrored */}
          <img
            src={model6}
            alt=""
            style={{ transform: "scaleX(-1)" }}
            className="hidden md:block relative w-auto shrink-0 h-[clamp(9rem,27.8125vw,33.375rem)] opacity-30"
          />
        </div>
      </div>
    </section>
  );
}