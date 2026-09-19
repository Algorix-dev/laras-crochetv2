import { useEffect, useState } from 'react';
import logoMark from '../assets/lac-logo-mark.png';

// TIP: this was copy-pasted independently into ShopPage.jsx and
// ProductDetail.jsx (logo fade-in + tagline, shown while a fetch is
// in flight) — same duplication problem RecommendedProducts solved
// for "Lara Thinks You'd Love These Too". Extracted here so every
// page's loading moment stays visually identical automatically,
// instead of drifting the way the 7 old "Lara Thinks" copies did.
// minHeight lets a page use a smaller/larger loading area than the
// default 60vh (e.g. a shorter inline section vs. a full page).
export default function BrandedLoader({ minHeight = '60vh' }) {
  const [clear, setClear] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setClear(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center justify-center text-center" style={{ minHeight }}>
      <div className={`transition duration-[1000ms] ${clear ? 'opacity-100 blur-0' : 'opacity-55 blur-[3px]'}`}>
        <img className="mx-auto h-[120px] w-[186px] object-contain" src={logoMark} alt="Lara's Crochet" />
        <p className="mt-3 text-[14px] tracking-[0.5em] text-[#A3A3A3]">LIMITED BY NATURE</p>
      </div>
    </div>
  );
}