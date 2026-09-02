/*
  TIP: This page went through three versions — the original build, a
  Supabase-based rewrite, and now back to our own Express/Mongo
  email-code system. The visual layer (styling, layout, real logo
  images) survived all three rewrites intact; only the auth calls
  underneath changed. That's the benefit of keeping UI and data-
  fetching separate: swapping the backend doesn't mean rebuilding the
  screen from scratch.

  Flow:
    'splash' → branded intro (logo fade-in + tagline), ~2.5s
    'signin' → email entry, live-validated, or Google (not yet wired)
    'sent'   → "we sent a code to X" transition
    'code'   → 6-digit entry with a real resend countdown
*/
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import fullLogo from '../assets/lara-crochet-logo.png';
import logoMark from '../assets/lac-logo-mark.png';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 53;

export default function SignInPage() {
  const [screen, setScreen] = useState('splash');
  const [clear, setClear] = useState(false);
  const [email, setEmail] = useState('');
  const [emailState, setEmailState] = useState('idle');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputs = useRef([]);
  const emailCheckTimeout = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const clearTimer = setTimeout(() => setClear(true), 1000);
    const screenTimer = setTimeout(() => setScreen('signin'), 2500);
    return () => { clearTimeout(clearTimer); clearTimeout(screenTimer); };
  }, []);

  // Resend countdown — only ticks while the code screen is showing
  useEffect(() => {
    if (screen !== 'code' || secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [screen, secondsLeft]);

  function updateEmail(value) {
    setEmail(value);
    setError('');
    if (emailCheckTimeout.current) clearTimeout(emailCheckTimeout.current);

    if (!value) {
      setEmailState('idle');
      return;
    }

    // TIP: shows a brief spinner while "checking" before resolving to
    // valid/invalid, rather than judging the email instantly on every
    // keystroke. The validation itself is still just the regex below —
    // this delay exists purely so the UI doesn't flip state on every
    // single character typed, which read as broken/flickery.
    setEmailState('checking');
    emailCheckTimeout.current = setTimeout(() => {
      setEmailState(EMAIL.test(value) ? 'valid' : 'invalid');
    }, 500);
  }

  async function continueWithEmail() {
    if (emailState !== 'valid') return;
    setError('');
    setChecking(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/customer/request-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Could not send code — try again.');
      setScreen('sent');
      setTimeout(() => {
        setScreen('code');
        setSecondsLeft(RESEND_SECONDS);
      }, 1300);
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  }

  async function updateCode(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    setError('');
    if (digit && index < 5) inputs.current[index + 1]?.focus();
    if (!next.every(Boolean)) return;

    setChecking(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/customer/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: next.join('') }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code — try again.');

      login(data.user, data.token);
      const redirectTo = new URLSearchParams(location.search).get('redirect') || '/';
      navigate(redirectTo);
    } catch (err) {
      setError(err.message);
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setChecking(false);
    }
  }

  async function handleResend() {
    setSecondsLeft(RESEND_SECONDS);
    setCode(['', '', '', '', '', '']);
    setError('');
    await fetch(`${import.meta.env.VITE_API_URL}/api/auth/customer/request-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  }

  function handleGoogleSignIn() {
    window.dispatchEvent(
      new CustomEvent('lara-toast', {
        detail: 'Google Sign-In needs a Google Client ID to be configured first.',
      })
    );
  }

  if (screen === 'splash') return <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#FAFAFA] font-ui text-center"><div className={`transition duration-[1000ms] ${clear ? 'opacity-100 blur-0' : 'opacity-55 blur-[3px]'}`}><img className="mx-auto h-[120px] w-[186px] object-contain" src={logoMark} alt="Lara's Crochet" /><p className="mt-3 text-[14px] tracking-[0.5em] text-[#A3A3A3]">LIMITED BY NATURE</p></div></main>;

  return <main className="relative min-h-screen overflow-hidden bg-[#FAFAFA] font-ui text-[#404040]"><img className="absolute left-1/2 top-[60px] z-10 h-[88px] w-[149px] -translate-x-1/2 object-contain" src={fullLogo} alt="Lara's Crochet" /><div className="absolute inset-0 flex items-center justify-center px-5 pt-16">{screen === 'signin' && <section className="w-full max-w-[457px]"><h1 className="text-[20px] font-bold leading-[30px] tracking-[-0.04em]">Sign In</h1><p className="text-[14px] leading-5 text-[#737373]">Sign in or create an account</p><button type="button" onClick={handleGoogleSignIn} className="mt-6 flex h-[58px] w-full items-center justify-center gap-3 border border-[#A3A3A3] bg-[#FFFCFC] text-[16px] font-semibold text-[#564345]"><span className="font-bold text-[#4285F4]">G</span>Sign in with Google</button><div className="flex h-10 items-center gap-4 text-[16px] font-semibold text-[#737373]"><span className="h-px flex-1 bg-[#D4D4D4]" />OR<span className="h-px flex-1 bg-[#D4D4D4]" /></div><div className={`flex h-16 items-center border px-4 ${emailState === 'valid' ? 'border-[#43C59E]' : emailState === 'invalid' ? 'border-[#FF6363]' : 'border-[#D4D4D4]'}`}><input className="w-full bg-transparent text-[16px] outline-none placeholder:text-[#A3A3A3] focus:outline-none focus-visible:outline-none" value={email} onChange={(event) => updateEmail(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && continueWithEmail()} placeholder="Email" type="email" />{emailState === 'checking' && <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#A3A3A3]/40 border-t-[#A3A3A3]" aria-label="Checking email" />}{emailState === 'valid' && <span className="text-[#43C59E]">✓</span>}{emailState === 'invalid' && <span className="text-[#FF6363]">×</span>}</div>{emailState === 'invalid' && <p className="mt-1 text-[12px] text-[#FF6363]">Invalid email address</p>}{error && <p className="mt-1 text-[12px] text-[#FF6363]">{error}</p>}{emailState === 'valid' && <button type="button" onClick={continueWithEmail} className="mt-4 w-full bg-[#404040] py-3 text-[14px] text-white">Continue</button>}<p className="mt-6 text-center text-[16px] leading-6 text-[#737373]">By continuing, you agree to receive recurring, automated marketing messages from Lara's Crochet and agree to our Terms of service and Privacy policy.</p></section>}{screen === 'sent' && <p className="text-center text-[24px] font-medium leading-8 text-[#737373]">We have sent a code to {email}<br />Kindly check and input code to verify your email address.</p>}{screen === 'code' && <section className="w-full max-w-[412px]"><h1 className="text-[20px] font-bold leading-[30px] tracking-[-0.04em]">Enter Code</h1><p className="text-[14px] leading-5 text-[#737373]">Sent to {email}</p><div className="mt-6 flex gap-[10px]">{code.map((digit, index) => <div className="h-16 w-[60px] border-2 border-[#D4D4D4]" key={index}><input ref={(node) => { inputs.current[index] = node; }} className="h-full w-full bg-transparent text-center text-[20px] outline-none focus:outline-none focus-visible:outline-none" disabled={checking} inputMode="numeric" maxLength="1" onChange={(event) => updateCode(index, event.target.value)} value={digit} /></div>)}</div>{error && <p className="mt-2 text-[12px] text-[#FF6363]">{error}</p>}<button type="button" onClick={handleResend} disabled={secondsLeft > 0} className="mt-8 block text-right text-[16px] font-semibold text-[#737373] underline disabled:no-underline">{secondsLeft > 0 ? `Resend code in ${secondsLeft} secs` : 'Resend code'}</button></section>}</div>{checking && <div className="absolute inset-0 z-[5] grid place-items-center bg-[#FAFAFA]/70"><span className="h-10 w-10 animate-spin rounded-full border-2 border-[#737373]/30 border-t-[#737373]" /></div>}<a className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[16px] text-[#404040] no-underline" href="#privacy">Privacy Policy</a></main>;
}
