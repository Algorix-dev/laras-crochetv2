import { useEffect, useRef } from "react";

/*
  TIP: same physics as the portfolio's cursor — a small dot that
  tracks the mouse exactly, and a larger ring that lerps toward it
  (rx += (mx-rx)*0.11), which is what gives it that slight "chasing"
  lag instead of moving 1:1. Colors are pulled from your CSS
  variables (--ink / --maroon) instead of the portfolio's neon cyan,
  since that glow reads as "tech site" not "handmade crochet."

  Desktop only — on touch devices there's no real cursor to follow,
  so this renders nothing (checked once on mount, not on resize,
  since a phone doesn't turn into a mouse mid-session).
*/
export default function CursorFollow() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const pos = useRef({ mx: 0, my: 0, rx: 0, ry: 0 });
  const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  useEffect(() => {
    if (isTouch) return;

    const handleMove = (e) => {
      pos.current.mx = e.clientX;
      pos.current.my = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`;
        dotRef.current.style.top = `${e.clientY}px`;
      }
    };
    window.addEventListener("mousemove", handleMove);

    let raf;
    const animate = () => {
      const p = pos.current;
      p.rx += (p.mx - p.rx) * 0.11;
      p.ry += (p.my - p.ry) * 0.11;
      if (ringRef.current) {
        ringRef.current.style.left = `${p.rx}px`;
        ringRef.current.style.top = `${p.ry}px`;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(raf);
    };
  }, [isTouch]);

  if (isTouch) return null;

  return (
    <>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[10010] w-2 h-2 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
        style={{ backgroundColor: "var(--maroon)" }}
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 z-[10005] w-8 h-8 rounded-full border pointer-events-none -translate-x-1/2 -translate-y-1/2"
        style={{ borderColor: "var(--ink)", opacity: 0.35 }}
      />
    </>
  );
}