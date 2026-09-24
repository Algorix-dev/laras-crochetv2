/*
  Contact Page — multi-step wizard for two flows: Custom Orders and
  General Enquiries. Rebuilt to match the Figma flow (see docs/figma
  export): enquiries branch per-topic into their own question before
  reaching a shared resolution, and two topics (Sizing help, Order
  status) are self-serve — they resolve in-app and never collect an
  email, unlike Payment/Something else which do.

  Navigation uses a small history stack (goTo/goBack) instead of a
  numeric step counter, because the step sequence isn't linear (it
  branches and some branches terminate early). The visible
  "Step X of 6" label is looked up per-phase from STEP_META below —
  see the note above STEP_META for why the numbers aren't 1,2,3....
*/
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, ChevronDown, ChevronUp, HelpCircle, UploadCloud, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Footer from "../components/Footer";

const stepVariants = {
  enter: (dir) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir < 0 ? 50 : -50, opacity: 0 }),
};

const TOTAL_STEPS = 6;

// TIP: change this one number to change how many pictures people can upload.
const MAX_PHOTOS = 4;

// TIP: per the Figma export, "Step X of 6" is NOT simply the position
// in each screen's own path — e.g. Payment's "Tell Lara the issue" is
// explicitly labeled step 5 (confirmed on two separate frames), even
// though it's only the 3rd screen a Payment enquiry sees. We follow
// the numbers actually shown in the export rather than renumbering
// sequentially. Two duplicate/inconsistent "Step 1 of 6" labels in the
// source (on the flow chooser and the topic-select screen) have been
// corrected here to 1 and 2 respectively, since those looked like
// leftover copy-paste labels rather than intentional design.
const ENQUIRY_STEP_META = {
  chooser: { n: 1, show: true },
  topic: { n: 2, show: true },
  "sizing-field": { n: 3, show: true },
  "sizing-chart": { n: 4, show: true },
  "sizing-done": { n: 4, show: false },
  "os-field": { n: 3, show: true },
  "os-tracker": { n: 4, show: true },
  "pay-field": { n: 3, show: true },
  "pay-issue": { n: 5, show: true },
  // TIP: the "Something else" issue screen has no step header/dots at
  // all in the Figma export (unlike every other question screen) —
  // preserved as-is rather than "fixed", since it reads as intentional.
  "se-issue": { n: 5, show: false },
  email: { n: 6, show: true },
};

const CUSTOM_STEP_META = {
  garment: { n: 1, show: true },
  "other-fit": { n: 2, show: true },
  size: { n: 2, show: true },
  "custom-measurements": { n: 2, show: true },
  color: { n: 3, show: true },
  photo: { n: 4, show: true },
  more: { n: 5, show: true },
  email: { n: 6, show: true },
};

const SIZE_CHART_ROWS = [
  { size: "XS", bust: 32, waist: 25, hip: 32 },
  { size: "S", bust: 34, waist: 27, hip: 37 },
  { size: "M", bust: 36, waist: 29, hip: 39 },
  { size: "L", bust: 38, waist: 32, hip: 42 },
  { size: "XL", bust: 40, waist: 34, hip: 44 },
  { size: "XXL", bust: 42, waist: 36, hip: 46 },
];

const GARMENT_TYPES = [
  "Dress",
  "Bikini",
  "Shirt",
  "Two piece",
  "Skirt",
  "Other",
];
const SIZE_OPTIONS = ["Small", "Large", "Extra Large", "XXL", "Custom sizing"];
const ENQUIRY_TOPICS = [
  "Sizing help",
  "Order status",
  "Payment",
  "Something else",
];
const COLOR_SWATCHES = [
  "#EF4444",
  "#EAB308",
  "#3B82F6",
  "#22C55E",
  "#D946EF",
  "#FFFFFF",
];
const ORDER_STATUSES = [
  "Order received",
  "In production",
  "Packaging",
  "Delivery",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

/* ---------- Shared building blocks ---------- */

function PillButton({ active, children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`border py-3 px-4 text-base font-medium transition-all text-center cursor-pointer ${
        active
          ? "border-[var(--ink)] bg-[var(--ink)] text-white"
          : "border-[var(--line)] bg-transparent text-[var(--ink)] hover:border-[var(--ink)]"
      } ${className}`}
    >
      {children}
    </button>
  );
}

// TIP: <main> below carries data-no-rise on purpose: the scroll-rise engine
// leaves an identity `transform` on the blocks it marks, and any transform
// turns `position: fixed` into "fixed inside that block", which pushed this
// button off the bottom edge.
// TIP: on phones the wizard is one unscrollable screen (Figma), so the main
// button is pinned to the bottom edge, full width. Pass `pinned={false}` for
// a button that lives inside a pop-up and should stay where it is.
function PrimaryButton({ children, className = "", pinned = true, ...props }) {
  const pin = pinned
    ? "max-md:fixed max-md:bottom-5 max-md:left-5 max-md:right-5 max-md:z-30 max-md:w-auto max-md:max-w-none max-md:mx-0 max-md:mt-0"
    : "";
  return (
    <button
      {...props}
      className={`${pin} w-full hover:bg-[#412B2D] text-white text-base font-bold uppercase tracking-widest sm:py-0.5 md:py-4 transition-colors bg-[var(--maroon)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
}

function TextField({
  value,
  onChange,
  placeholder,
  helpText,
  error,
  ...props
}) {
  return (
    <div>
      <div className="relative flex items-center">
        <input
          {...props}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full border pl-4 pr-11 py-3.5 bg-[var(--cream)]/40 focus:bg-white text-base outline-none transition-all focus:border-[var(--ink)] ${
            error ? "border-red-500" : "border-[var(--line)]"
          }`}
        />
        {helpText && (
          <div
            className="absolute right-4 text-[var(--muted)]"
            title={helpText}
          >
            <HelpCircle size={16} />
          </div>
        )}
      </div>
      {error && <p className="text-base text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}

function StepShell({
  stepNumber,
  totalSteps = TOTAL_STEPS,
  showHeader = true,
  onBack,
  children,
}) {
  return (
    <div className="relative max-w-lg w-full max-md:max-w-none">
      <div className="min-h-8 mb-3 max-md:mb-2">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Go back to previous step"
            className="text-[var(--ink)] hover:text-[var(--maroon)] transition-colors cursor-pointer focus-visible:outline-none"
          >
            <ArrowLeft size={20} />
          </button>
        )}
      </div>
      <div className="bg-[#FAFAFA] p-6 sm:p-8 md:p-12 border border-[#E5E5E5] shadow-[0px_1px_3px_0px_#00000040] max-md:border-0 max-md:shadow-none max-md:p-0 max-md:pb-24">
        {showHeader && (
          <div className="text-center mb-6">
            <p className="text-base tracking-[0.2em] font-semibold text-[var(--muted)] uppercase mb-2">
              Step {stepNumber} of {totalSteps}
            </p>
            <div
              className="flex items-center justify-center gap-1.5"
              aria-hidden="true"
            >
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <div
                  key={idx}
                  className={`rounded-full transition-all duration-300 ${
                    idx + 1 === stepNumber
                      ? "w-2.5 h-2.5 bg-[var(--ink)] scale-110"
                      : "w-1.5 h-1.5 bg-[var(--mauve)]"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// TIP: the closing card in Figma ("All Done!") is visually distinct
// from every wizard step — rounded corners + soft shadow vs. the
// wizard's sharp corners — so it's its own component, not a StepShell
// variant.
function SuccessCard({
  heading,
  subtext,
  linkTo = "/shop",
  linkLabel = "Back to shop",
}) {
  return (
    <div className="text-center max-w-md mx-auto">
      <div className="bg-[#FAFAFA] border border-[#E5E5E5] shadow-[0px_4px_24px_0px_#00000022] rounded-3xl p-8 sm:p-10 sm:border-none">
        
        <h2 className="font-display text-2xl text-[var(--ink)] font-bold mb-1">
          {heading}
        </h2>
        <p className="text-base text-[var(--muted)]">{subtext}</p>
        <div className="mx-auto mt-6 flex items-center justify-center w-14 h-14 rounded-full bg-[#10B981] text-white">
          <Check size={26} />
        </div>
      </div>
      <div className="mt-6"><Link
        to={linkTo}
        className="inline-flex items-center gap-1 text-base underline underline-offset-2 text-[var(--ink)] hover:text-[var(--maroon)] transition-colors cursor-pointer"
      >
        {linkLabel} 
      </Link>
        <span aria-hidden="true">→</span></div>
    </div>
  );
}

// TIP: the two-button footer used by both the order-status tracker and
// the sizing-help completion screen — Figma only shows this pattern on
// the tracker frames, but re-using it for sizing-help's completion is
// a reasonable inference since Figma doesn't include a dedicated
// "done" frame for that self-serve branch. Flagged in the handoff notes.
function TerminalActions({
  primaryTo,
  primaryLabel,
  secondaryTo = "/contact",
  secondaryLabel = "Back to Contact Page",
  onSecondary,
}) {
  return (
    <div className="flex flex-col gap-3 mt-8">
      {/* TIP: when `onSecondary` is passed we render a real button that
          runs it (used to reset the wizard back to the very first screen).
          A <Link to="/contact"> can't do that: we're ALREADY on /contact,
          so React Router treats the click as "nothing changed" and the
          wizard just stays on the last step. */}
      {onSecondary ? (
        <button
          type="button"
          onClick={onSecondary}
          className="w-full border border-[var(--line)] text-[var(--ink)] text-base font-bold uppercase tracking-widest py-3.5 text-center transition-colors hover:border-[var(--ink)] cursor-pointer"
        >
          {secondaryLabel}
        </button>
      ) : (
        <Link
          to={secondaryTo}
          className="w-full border border-[var(--line)] text-[var(--ink)] text-base font-bold uppercase tracking-widest py-3.5 text-center transition-colors hover:border-[var(--ink)] cursor-pointer"
        >
          {secondaryLabel}
        </Link>
      )}
      <Link
        to={primaryTo}
        className="w-full bg-[var(--ink)] text-white text-base font-bold uppercase tracking-widest py-3.5 text-center transition-colors hover:bg-[var(--maroon)] cursor-pointer"
      >
        {primaryLabel}
      </Link>
    </div>
  );
}

function SizeChartTable() {
  return (
    <div className="border border-[var(--line)] mt-4">
      <div className="grid grid-cols-4 bg-white text-base uppercase tracking-wide text-[var(--muted)] border-b border-[var(--line)]">
        <span className="px-3 py-2">Size</span>
        <span className="px-3 py-2 border-l border-[var(--line)]">Bust</span>
        <span className="px-3 py-2 border-l border-[var(--line)]">Waist</span>
        <span className="px-3 py-2 border-l border-[var(--line)]">Hip</span>
      </div>
      {SIZE_CHART_ROWS.map((row) => (
        <div
          key={row.size}
          className="grid grid-cols-4 text-base border-b border-[var(--line)] last:border-b-0 bg-[var(--cream)]/40"
        >
          <span className="px-3 py-2">{row.size}</span>
          <span className="px-3 py-2 border-l border-[var(--line)]">
            {row.bust}&quot;
          </span>
          <span className="px-3 py-2 border-l border-[var(--line)]">
            {row.waist}&quot;
          </span>
          <span className="px-3 py-2 border-l border-[var(--line)]">
            {row.hip}&quot;
          </span>
        </div>
      ))}
    </div>
  );
}

function MeasurementRow({ values, onChange }) {
  const fields = [
    ["size", "Size"],
    ["bust", "Bust"],
    ["waist", "Waist"],
    ["hip", "Hip"],
  ];
  return (
    <div className="border border-[var(--line)] mt-4">
      <div className="grid grid-cols-4 bg-white text-base uppercase tracking-wide text-[var(--muted)] border-b border-[var(--line)]">
        {fields.map(([, label], idx) => (
          <span
            key={label}
            className={`px-3 py-2 ${idx > 0 ? "border-l border-[var(--line)]" : ""}`}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-4">
        {fields.map(([key], idx) => (
          <input
            key={key}
            value={values[key]}
            onChange={(e) => {
              const raw = e.target.value;
              const cleaned =
                key === "size"
                  ? raw.replace(/[^a-zA-Z]/g, "").toUpperCase()
                  : raw.replace(/[^0-9]/g, "");
              onChange(key, cleaned);
            }}
            inputMode={key === "size" ? "text" : "numeric"}
            className={`w-full text-left text-base px-3 py-2.5 outline-none bg-[var(--cream)]/40 focus:bg-white focus:border-[var(--ink)] border-[var(--line)] ${
              idx > 0 ? "border-l" : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Size pop-up ----------
   TIP: shows the exact measurements for the size someone just tapped.
   The numbers come from SIZE_CHART_ROWS at the top of this file. Those are
   PLACEHOLDERS until the client sends her exact measurements. When she
   does, only edit SIZE_CHART_ROWS and this pop-up updates by itself. */
const SIZE_LABEL_TO_CHART = {
  Small: "S",
  Large: "L",
  "Extra Large": "XL",
  XXL: "XXL",
};

function SizePopup({ size, onClose }) {
  const row = SIZE_CHART_ROWS.find((r) => r.size === SIZE_LABEL_TO_CHART[size]);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!row) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${size} measurements`}
        className="w-full max-w-xs bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="font-display text-xl font-bold text-[var(--ink)]">{size}</h3>
          <button aria-label="Close" onClick={onClose} className="cursor-pointer text-[var(--muted)] hover:text-[var(--ink)]">
            <X size={20} />
          </button>
        </div>
        <dl className="mt-4 divide-y divide-[var(--line)] text-base">
          {[["Bust", row.bust], ["Waist", row.waist], ["Hip", row.hip]].map(([label, val]) => (
            <div key={label} className="flex justify-between py-2">
              <dt className="text-[var(--muted)]">{label}</dt>
              <dd className="text-[var(--ink)]">{val}&quot;</dd>
            </div>
          ))}
        </dl>
        <PrimaryButton pinned={false} className="mt-5" onClick={onClose}>
          Got it
        </PrimaryButton>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

export default function ContactPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const flowParam = searchParams.get("flow") || "";
  // TIP: `?step=size` lets another page (the Product Detail size guide)
  // deep-link straight into this flow's sizing screen instead of
  // re-asking "what garment type" first — the `size` phase doesn't
  // depend on garmentType being set, so it's safe to skip ahead to.
  const stepParam = searchParams.get("step") || "";

  const [flow, setFlow] = useState(flowParam === "custom" ? "custom" : "");

  // TIP: internal `flow` state and the `?flow=` URL param used to drift
  // apart — clicking "Make a custom order" from the chooser switched
  // `flow` without touching the URL, so the Navbar (which highlights
  // links by matching pathname+search) kept "Contact" highlighted
  // instead of "Custom Orders". This keeps the URL as the source of
  // truth whenever the flow changes from inside the page.
  const switchFlow = (nextFlow) => {
    setFlow(nextFlow);
    setSearchParams(nextFlow === "custom" ? { flow: "custom" } : {}, {
      replace: true,
    });
  };
  const initialCustomPhase = stepParam === "size" ? "size" : "garment";
  const [phase, setPhase] = useState(
    flowParam === "custom" ? initialCustomPhase : "chooser",
  );
  const [history, setHistory] = useState([]);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (flowParam === "custom") {
      setFlow("custom");
      setPhase(stepParam === "size" ? "size" : "garment");
    } else {
      setFlow("");
      setPhase("chooser");
    }
    setHistory([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowParam, stepParam]);

  const [formData, setFormData] = useState({
    // Enquiry
    enquiryTopic: "",
    itemName: "",
    orderRef: "",
    issueDetails: "",
    enquiryEmail: "",
    wantsSizeHelp: "",
    sizingMeasurements: { size: "", bust: "", waist: "", hip: "" },

    // Custom order
    garmentType: "",
    otherFitDetails: "",
    sizeChoice: "",
    showSizeChart: "",
    wantsCustomSizing: "",
    customMeasurements: { size: "", bust: "", waist: "", hip: "" },
    colorSwatch: "",
    colorNote: "",
    photos: [],
    customDetails: "",
    customEmail: "",
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  /* ---------- Picture upload helpers ----------
     TIP: the old code did `updateField("photos", newFiles)`, which REPLACED
     the array every time, so picking one more picture wiped the earlier ones.
     Now we APPEND to what's already there, skip duplicates, and stop at
     MAX_PHOTOS. */
  const [photoNotice, setPhotoNotice] = useState("");

  const addPhotos = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    const existing = formData.photos;
    const isSame = (a, b) =>
      a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
    const fresh = incoming.filter((f) => !existing.some((e) => isSame(e, f)));
    const room = MAX_PHOTOS - existing.length;
    const accepted = fresh.slice(0, Math.max(0, room));
    if (accepted.length) updateField("photos", [...existing, ...accepted]);
    if (fresh.length > room) {
      setPhotoNotice(
        `Only ${MAX_PHOTOS} pictures allowed, so we kept the first ${MAX_PHOTOS}. Remove one to swap it.`,
      );
    } else {
      setPhotoNotice("");
    }
    // reset the input so picking the same file again later still fires onChange
    const input = document.getElementById("photo-upload");
    if (input) input.value = "";
  };

  const removePhoto = (index) => {
    updateField(
      "photos",
      formData.photos.filter((_, i) => i !== index),
    );
    setPhotoNotice("");
  };

  // TIP: createObjectURL used to run on EVERY render (a slow memory leak).
  // useMemo makes the preview URLs only when the list changes, and the
  // cleanup frees them.
  const photoUrls = useMemo(
    () => formData.photos.map((f) => URL.createObjectURL(f)),
    [formData.photos],
  );
  useEffect(() => {
    return () => photoUrls.forEach((u) => URL.revokeObjectURL(u));
  }, [photoUrls]);

  /* ---------- Size pop-up ----------
     TIP: which size (if any) the pop-up is showing. See SizePopup below. */
  const [sizePopup, setSizePopup] = useState(null);

  const goTo = (nextPhase) => {
    setHistory((h) => [...h, phase]);
    setDirection(1);
    setPhase(nextPhase);
  };

  const goBack = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setDirection(-1);
    setPhase(prev);
  };

  const resetAll = () => {
    switchFlow("");
    setPhase("chooser");
    setHistory([]);
    setDirection(-1);
    setErrors({});
    setFormData({
      enquiryTopic: "",
      itemName: "",
      orderRef: "",
      issueDetails: "",
      enquiryEmail: "",
      wantsSizeHelp: "",
      sizingMeasurements: { size: "", bust: "", waist: "", hip: "" },
      garmentType: "",
      otherFitDetails: "",
      sizeChoice: "",
      showSizeChart: "",
      wantsCustomSizing: "",
      customMeasurements: { size: "", bust: "", waist: "", hip: "" },
      colorSwatch: "",
      colorNote: "",
      photos: [],
      customDetails: "",
      customEmail: "",
    });
  };

  const selectTopic = (topic) => {
    updateField("enquiryTopic", topic);
    if (topic === "Sizing help") goTo("sizing-field");
    else if (topic === "Order status") goTo("os-field");
    else if (topic === "Payment") goTo("pay-field");
    else goTo("se-issue");
  };

  const selectGarment = (garment) => {
    updateField("garmentType", garment);
    goTo(garment === "Other" ? "other-fit" : "size");
  };

  const submitEnquiry = (e) => {
    e.preventDefault();
    if (!formData.enquiryEmail) {
      setErrors((p) => ({ ...p, enquiryEmail: "Email is required" }));
      return;
    }
    if (!EMAIL_REGEX.test(formData.enquiryEmail)) {
      setErrors((p) => ({
        ...p,
        enquiryEmail: "Please enter a valid email address",
      }));
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      goTo("success");
    }, 1000);
  };

  const submitCustom = (e) => {
    e.preventDefault();
    if (!formData.customEmail) {
      setErrors((p) => ({ ...p, customEmail: "Email is required" }));
      return;
    }
    if (!EMAIL_REGEX.test(formData.customEmail)) {
      setErrors((p) => ({
        ...p,
        customEmail: "Please enter a valid email address",
      }));
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      goTo("success");
    }, 1000);
  };

  // TIP: the "Other" garment path has one extra question ("What would
  // this fit be?") before size, that every other garment type skips
  // straight past. That pushes every step after it — size, color,
  // photo, more, email — one number later, and the total step count
  // to 7 for this path specifically, rather than the usual 6.
  const otherPath = flow === "custom" && formData.garmentType === "Other";
  const otherOffset =
    otherPath && ["size", "color", "photo", "more", "email"].includes(phase)
      ? 1
      : 0;
  const baseMeta =
    flow === "custom" ? CUSTOM_STEP_META[phase] : ENQUIRY_STEP_META[phase];
  const meta = baseMeta
    ? { ...baseMeta, n: baseMeta.n + otherOffset }
    : baseMeta;
  const totalStepsForFlow = otherPath ? TOTAL_STEPS + 1 : TOTAL_STEPS;
  const showBack = history.length > 0;
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const orderStatusIndex = formData.orderRef
    ? hashString(formData.orderRef) % ORDER_STATUSES.length
    : 1;
  const currentStatus = ORDER_STATUSES[orderStatusIndex];

  return (
    <>
      {/* TIP: on phones this page is exactly one screen tall (100dvh minus the
          64px navbar) and the page itself doesn't scroll, as in the client's
          Figma (no footer on these pages). If a step is taller than the
          screen, only the area inside scrolls. Desktop is unchanged. */}
      <main data-no-rise="true" className="min-h-[calc(100vh-64px)] max-md:h-[calc(100dvh-134px)] max-md:min-h-0 max-md:overflow-y-auto w-full flex items-center justify-center max-md:items-start py-12 max-md:py-2 px-5 bg-[var(--cream)]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${flow}-${phase}`}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-full flex justify-center"
          >
            {phase === "success" ? (
              flow === "custom" ? (
                <SuccessCard
                  heading="All Done!"
                  subtext="Your quote is on it's way!"
                />
              ) : (
                <SuccessCard
                  heading="All Done!"
                  subtext="Lara is working on it."
                />
              )
            ) : (
              <StepShell
                stepNumber={meta.n}
                totalSteps={totalStepsForFlow}
                showHeader={meta.show}
                onBack={showBack ? goBack : undefined}
              >
                {/* ============ SHARED CHOOSER ============ */}
                {phase === "chooser" && (
                  <div className="text-center">
                    <h1 className="font-display text-2xl text-[var(--ink)] mb-8 font-bold">
                      How would you like Lara to help you?
                    </h1>
                    <div className="space-y-4 max-w-sm mx-auto">
                      <button
                        onClick={() => {
                          switchFlow("custom");
                          goTo("garment");
                        }}
                        className="w-full border border-[var(--line)] py-4 px-6 text-base font-semibold tracking-wide bg-white text-[var(--ink)] transition-all hover:border-[var(--ink)] focus-visible:border-[var(--ink)] cursor-pointer"
                      >
                        Make a custom order
                      </button>
                      <button
                        onClick={() => {
                          switchFlow("enquiry");
                          goTo("topic");
                        }}
                        className="w-full border border-[var(--ink)] py-4 px-6 text-base font-semibold tracking-wide bg-[var(--ink)] text-white transition-all hover:bg-[var(--maroon)] hover:border-[var(--maroon)] cursor-pointer"
                      >
                        Make an enquiry
                      </button>
                    </div>
                  </div>
                )}

                {/* ============ ENQUIRY: topic select ============ */}
                {phase === "topic" && (
                  <div>
                    <h2 className="font-display text-2xl text-center text-[var(--ink)] mb-8 font-bold">
                      What&apos;s your enquiry about?
                    </h2>
                    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                      {ENQUIRY_TOPICS.map((topic) => (
                        <PillButton
                          key={topic}
                          active={formData.enquiryTopic === topic}
                          onClick={() => selectTopic(topic)}
                        >
                          {topic}
                        </PillButton>
                      ))}
                    </div>
                  </div>
                )}

                {/* ============ ENQUIRY: sizing → which item ============ */}
                {phase === "sizing-field" && (
                  <div className="max-w-sm mx-auto">
                    <h2 className="font-display text-2xl text-center text-[var(--ink)] mb-6 font-bold">
                      Which item?
                    </h2>
                    <div className="space-y-4">
                      <TextField
                        value={formData.itemName}
                        onChange={(v) => updateField("itemName", v)}
                        placeholder="Input item name"
                        helpText="This helps Lara pull up the right size chart."
                      />
                      <PrimaryButton
                        disabled={!formData.itemName.trim()}
                        onClick={() => goTo("sizing-chart")}
                      >
                        Next
                      </PrimaryButton>
                    </div>
                  </div>
                )}

                {/* ============ ENQUIRY: sizing → chart + custom sizing ============ */}
                {phase === "sizing-chart" && (
                  <div>
                    <h2 className="font-display text-2xl text-center text-[var(--ink)] mb-6 font-bold">
                      Here is our size chart for{" "}
                      {formData.itemName || "(item name)"}
                    </h2>
                    <SizeChartTable />
                    <div className="flex items-center justify-between mt-5">
                      <span className="text-base font-semibold text-[var(--ink)]">
                        Do you want custom sizing?
                      </span>
                      <div className="flex gap-3 text-base">
                        <button
                          onClick={() => updateField("wantsSizeHelp", "yes")}
                          className={`cursor-pointer ${
                            formData.wantsSizeHelp === "yes"
                              ? "underline font-semibold text-[var(--ink)]"
                              : "text-[var(--muted)]"
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => updateField("wantsSizeHelp", "no")}
                          className={`cursor-pointer ${
                            formData.wantsSizeHelp !== "yes"
                              ? "underline font-semibold text-[var(--ink)]"
                              : "text-[var(--muted)]"
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>

                    {formData.wantsSizeHelp === "yes" && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <p className="text-base text-[var(--muted)] mt-4 mb-1">
                          Fill in your measurements
                        </p>
                        <MeasurementRow
                          values={formData.sizingMeasurements}
                          onChange={(key, val) =>
                            updateField("sizingMeasurements", {
                              ...formData.sizingMeasurements,
                              [key]: val,
                            })
                          }
                        />
                      </motion.div>
                    )}

                    <PrimaryButton
                      className="mt-6"
                      onClick={() => goTo("sizing-done")}
                    >
                      {formData.wantsSizeHelp === "yes" ? "Done" : "Next"}
                    </PrimaryButton>
                  </div>
                )}

                {/* ============ ENQUIRY: sizing → done (self-serve, no email) ============ */}
                {phase === "sizing-done" && (
                  <div>
                    <h2 className="font-display text-2xl text-center text-[var(--ink)] mb-3 font-bold">
                      All set!
                    </h2>
                    <p className="text-lg text-[var(--muted)] text-center leading-relaxed">
                      Thanks — hope that helps with your sizing! Reach out
                      anytime if you need anything else.
                    </p>
                    <TerminalActions
                      primaryTo="/shop"
                      primaryLabel="Back to shop"
                      onSecondary={resetAll}
                    />
                  </div>
                )}

                {/* ============ ENQUIRY: order status / payment → order ref ============ */}
                {(phase === "os-field" || phase === "pay-field") && (
                  <div className="max-w-sm mx-auto">
                    <h2 className="font-display text-2xl text-center text-[var(--ink)] mb-6 font-bold">
                      What is your order reference number?
                    </h2>
                    <div className="space-y-4">
                      <TextField
                        value={formData.orderRef}
                        onChange={(v) => updateField("orderRef", v)}
                        placeholder="Input order ref. number"
                        helpText="Found in your order confirmation email."
                      />
                      <PrimaryButton
                        disabled={!formData.orderRef.trim()}
                        onClick={() =>
                          goTo(
                            phase === "os-field" ? "os-tracker" : "pay-issue",
                          )
                        }
                      >
                        Next
                      </PrimaryButton>
                    </div>
                  </div>
                )}

                {/* ============ ENQUIRY: order status → tracker (self-serve, no email) ============ */}
                {phase === "os-tracker" && (
                  <div>
                    <h2 className="text-[16px] font-display text-2xl text-center text-[var(--ink)] mb-8 font-bold">
                      Here is the status of your order
                    </h2>
                    <div className="flex items-center justify-between mb-10 px-1">
                      {ORDER_STATUSES.map((status, idx) => (
                        <div
                          key={status}
                          className="sm:flex-col flex items-center flex-1 last:flex-none"
                        >
                          <div className="flex flex-col items-center gap-2 relative">
                            <span className="text-[14px] text-[var(--muted)] uppercase tracking-wide absolute -top-5 whitespace-nowrap">
                              {status}
                            </span>
                            <div
                              className={`w-4 h-4 rounded-full ${
                                idx === orderStatusIndex
                                  ? "bg-[#10B981] ring-4 ring-[#10B981]/25"
                                  : idx < orderStatusIndex
                                    ? "bg-[var(--line-2)]"
                                    : "bg-[var(--line)]"
                              }`}
                            />
                          </div>
                          {idx < ORDER_STATUSES.length - 1 && (
                            <div
                              className={`flex-1 h-px mx-2 ${idx < orderStatusIndex ? "bg-[var(--line-2)]" : "bg-[var(--line)]"}`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="sm:text-[14px] text-base text-[#404040] leading-relaxed">
                      Your order (#{formData.orderRef}) has been received on{" "}
                      {today} and{" "}
                      {currentStatus === "Order received" &&
                        "is being reviewed."}
                      {currentStatus === "In production" &&
                        "is currently in production."}
                      {currentStatus === "Packaging" &&
                        "is currently in packaging undergoing proper inspection and quality check."}
                      {currentStatus === "Delivery" &&
                        "is finally on its way to you!"}
                    </p>
                    <p className="sm:text-[14px] text-base text-[#404040] mt-4">
                      Thank you for choosing Lara&apos;s Crochet.
                    </p>
                    <p className="sm:text-[14px] text-base text-[#404040] mt-4">
                      Yours in love,
                      <br />
                      <span className="font-logo text-base">Lara</span>
                    </p>
                    <TerminalActions
                      primaryTo="/shop"
                      primaryLabel="Back to shop"
                      onSecondary={currentStatus === "Delivery" ? undefined : resetAll}
                      secondaryTo={
                        currentStatus === "Delivery"
                          ? "/account/orders"
                          : "/contact"
                      }
                      secondaryLabel={
                        currentStatus === "Delivery"
                          ? "Track delivery"
                          : "Back to Contact Page"
                      }
                    />
                  </div>
                )}

                {/* ============ ENQUIRY: payment → issue ============ */}
                {phase === "pay-issue" && (
                  <div className="max-w-md mx-auto">
                    <h2 className="font-display text-2xl text-center text-[var(--ink)] mb-6 font-bold">
                      What's the issue?
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <textarea
                          rows={4}
                          value={formData.issueDetails}
                          onChange={(e) =>
                            updateField("issueDetails", e.target.value)
                          }
                          placeholder="Speak, Lara is listening..."
                          className="w-full border border-[var(--line)] px-4 py-3.5 bg-[var(--cream)]/40 focus:bg-white text-base outline-none transition-all focus:border-[var(--ink)] resize-none"
                        />
                        <p className="text-base text-[var(--muted)] mt-1.5">
                          This might help Lara understand you better.
                        </p>
                      </div>
                      <PrimaryButton
                        disabled={!formData.issueDetails.trim()}
                        onClick={() => goTo("email")}
                      >
                        Next
                      </PrimaryButton>
                    </div>
                  </div>
                )}

                {/* ============ ENQUIRY: something else → issue (no step header) ============ */}
                {phase === "se-issue" && (
                  <div className="max-w-md mx-auto">
                    <h2 className="font-display text-2xl text-center text-[var(--ink)] mb-6 font-bold">
                      What&apos;s the issue?
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <textarea
                          rows={4}
                          value={formData.issueDetails}
                          onChange={(e) =>
                            updateField("issueDetails", e.target.value)
                          }
                          placeholder="Speak, Lara is listening..."
                          className="w-full border border-[var(--line)] px-4 py-3.5 bg-[var(--cream)]/40 focus:bg-white text-base outline-none transition-all focus:border-[var(--ink)] resize-none"
                        />
                        <p className="text-base text-[var(--muted)] mt-1.5">
                          This might help Lara resolve it faster.
                        </p>
                      </div>
                      <PrimaryButton
                        disabled={!formData.issueDetails.trim()}
                        onClick={() => goTo("email")}
                      >
                        Next
                      </PrimaryButton>
                    </div>
                  </div>
                )}

                {/* ============ ENQUIRY: email (payment + something-else only) ============ */}
                {phase === "email" && flow !== "custom" && (
                  <form onSubmit={submitEnquiry} className="max-w-sm mx-auto">
                    <h2 className="font-display text-2xl text-center text-[var(--ink)] mb-6 font-bold">
                      Where can Lara email you?
                    </h2>
                    <div className="space-y-4">
                      <TextField
                        type="email"
                        value={formData.enquiryEmail}
                        onChange={(v) => updateField("enquiryEmail", v)}
                        placeholder="Email address"
                        helpText="We will only use your email to reply to your enquiry."
                        error={errors.enquiryEmail}
                        required
                      />
                      <PrimaryButton
                        type="submit"
                        disabled={submitting || !formData.enquiryEmail.trim()}
                      >
                        {submitting ? "Sending..." : "Done"}
                      </PrimaryButton>
                    </div>
                  </form>
                )}

                {/* ============ CUSTOM: garment type ============ */}
                {phase === "garment" && (
                  <div>
                    <h2 className="font-display text-2xl text-center text-[var(--ink)] mb-8 font-bold">
                      What would you like Lara to make for you?
                    </h2>
                    <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                      {GARMENT_TYPES.map((garment) => (
                        <PillButton
                          key={garment}
                          active={formData.garmentType === garment}
                          onClick={() => selectGarment(garment)}
                        >
                          {garment}
                        </PillButton>
                      ))}
                    </div>
                  </div>
                )}

                {/* ============ CUSTOM: "Other" → free-text fit ============ */}
                {phase === "other-fit" && (
                  <div className="max-w-md mx-auto">
                    <h2 className="font-display text-2xl text-center text-[var(--ink)] mb-6 font-bold">
                      What would this fit be?
                    </h2>
                    <div className="space-y-4">
                      <textarea
                        rows={4}
                        value={formData.otherFitDetails}
                        onChange={(e) =>
                          updateField("otherFitDetails", e.target.value)
                        }
                        placeholder="Speak Lara's listening 😅..."
                        className="w-full border border-[var(--line)] px-4 py-3.5 bg-[var(--cream)]/40 focus:bg-white text-base outline-none transition-all focus:border-[var(--ink)] resize-none"
                      />
                      <p className="text-base text-[var(--muted)] -mt-2.5">
                        This might help Lara nail your vision faster.
                      </p>
                      <PrimaryButton
                        disabled={!formData.otherFitDetails.trim()}
                        onClick={() => goTo("size")}
                      >
                        Next
                      </PrimaryButton>
                    </div>
                  </div>
                )}

                {/* ============ CUSTOM: size ============ */}
                {phase === "size" && (
                  <div>
                    <h2 className="font-display text-2xl text-center text-[var(--ink)] mb-8 font-bold">
                      What size works for you?
                    </h2>
                    <div className="flex flex-wrap justify-center gap-3 max-w-sm mx-auto">
                      {SIZE_OPTIONS.map((size) => (
                        <PillButton
                          key={size}
                          active={formData.sizeChoice === size}
                          onClick={() => {
                            updateField("sizeChoice", size);
                            if (size === "Custom sizing")
                              goTo("custom-measurements");
                            else setSizePopup(size);
                          }}
                        >
                          {size}
                        </PillButton>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-6 max-w-sm mx-auto">
                      <span className="text-base font-semibold text-[var(--ink)]">
                        See full size chart
                      </span>
                      {/* Phones (Figma): one chevron that opens/closes the chart */}
                      <button
                        type="button"
                        aria-label="Show or hide the full size chart"
                        aria-expanded={formData.showSizeChart === "yes"}
                        onClick={() =>
                          updateField(
                            "showSizeChart",
                            formData.showSizeChart === "yes" ? "no" : "yes",
                          )
                        }
                        className="md:hidden cursor-pointer text-[var(--ink)]"
                      >
                        {formData.showSizeChart === "yes" ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </button>
                      <div className="hidden md:flex gap-3 text-base">
                        <button
                          onClick={() => updateField("showSizeChart", "yes")}
                          className={`cursor-pointer ${
                            formData.showSizeChart === "yes"
                              ? "underline font-semibold text-[var(--ink)]"
                              : "text-[var(--muted)]"
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => updateField("showSizeChart", "no")}
                          className={`cursor-pointer ${
                            formData.showSizeChart !== "yes"
                              ? "underline font-semibold text-[var(--ink)]"
                              : "text-[var(--muted)]"
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                    {formData.showSizeChart === "yes" && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-sm mx-auto"
                      >
                        <SizeChartTable />
                      </motion.div>
                    )}

                    {formData.sizeChoice &&
                      formData.sizeChoice !== "Custom sizing" && (
                        <PrimaryButton
                          className="mt-6 max-w-sm mx-auto block"
                          onClick={() => goTo("color")}
                        >
                          Next
                        </PrimaryButton>
                      )}
                  </div>
                )}

                {/* ============ CUSTOM: custom-measurements (its own step, per Figma) ============ */}
                {phase === "custom-measurements" && (
                  <div className="max-w-sm mx-auto">
                    <h2 className="font-display text-2xl text-center text-[var(--ink)] mb-1 font-bold">
                      Go ahead, fill in your measurements.
                    </h2>
                    <MeasurementRow
                      values={formData.customMeasurements}
                      onChange={(key, val) =>
                        updateField("customMeasurements", {
                          ...formData.customMeasurements,
                          [key]: val,
                        })
                      }
                    />
                    <PrimaryButton
                      className="mt-4"
                      disabled={
                        !formData.customMeasurements.bust.trim() ||
                        !formData.customMeasurements.waist.trim() ||
                        !formData.customMeasurements.hip.trim()
                      }
                      onClick={() => goTo("color")}
                    >
                      Next
                    </PrimaryButton>
                  </div>
                )}

                {/* ============ CUSTOM: color ============ */}
                {phase === "color" && (
                  <div className="max-w-md mx-auto">
                    <h2 className="font-display text-2xl text-center text-[var(--ink)] mb-6 font-bold">
                      What color mix do you have in mind?
                    </h2>
                    <div className="flex justify-center gap-3 flex-wrap mb-4">
                      {COLOR_SWATCHES.map((hex) => (
                        <button
                          key={hex}
                          aria-label={`Select color ${hex}`}
                          onClick={() => updateField("colorSwatch", hex)}
                          className={`w-12 h-12 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.colorSwatch === hex
                              ? "border-[var(--ink)] scale-110"
                              : "border-[var(--line)]"
                          }`}
                          style={{
                            background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.85), ${hex} 55%)`,
                          }}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-3 my-5 max-w-xs mx-auto">
                      <div className="h-px flex-1 bg-[var(--line)]" />
                      <span className="text-base uppercase tracking-widest text-[var(--muted)]">
                        Or
                      </span>
                      <div className="h-px flex-1 bg-[var(--line)]" />
                    </div>

                    <textarea
                      rows={3}
                      value={formData.colorNote}
                      onChange={(e) => updateField("colorNote", e.target.value)}
                      placeholder="Magenta and turquoise etc..."
                      className="w-full border border-[var(--line)] px-4 py-3 bg-[var(--cream)]/40 focus:bg-white text-base outline-none transition-all focus:border-[var(--ink)] resize-none"
                    />
                    <p className="text-base text-[var(--muted)] mt-1.5">
                      Write the specific colors you want.
                    </p>

                    <PrimaryButton
                      className="mt-5"
                      disabled={
                        !formData.colorSwatch && !formData.colorNote.trim()
                      }
                      onClick={() => goTo("photo")}
                    >
                      Next
                    </PrimaryButton>
                  </div>
                )}

                {/* ============ CUSTOM: photo ============ */}
                {phase === "photo" && (
                  <div className="max-w-md mx-auto">
                    <h2 className="font-display text-2xl text-center text-[var(--ink)] mb-6 font-bold">
                      Got a picture of what you want?
                    </h2>

                    <label
                      htmlFor="photo-upload"
                      className={`flex flex-col items-center justify-center gap-2 rounded-none border-2 border-dashed border-[var(--line)] py-10 px-4 text-center transition-colors ${
                        formData.photos.length >= MAX_PHOTOS
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer hover:border-[var(--ink)]"
                      }`}
                      onClick={(e) => {
                        // TIP: at the max, stop the file picker from opening and tell
                        // the person to delete one first instead.
                        if (formData.photos.length >= MAX_PHOTOS) {
                          e.preventDefault();
                          setPhotoNotice(
                            `You've added ${MAX_PHOTOS} pictures, which is the max. Remove one to add another.`,
                          );
                        }
                      }}
                    >
                      <UploadCloud size={22} className="text-[var(--muted)]" />
                      <span className="text-lg text-[var(--ink)]">
                        Drop your image here or{" "}
                        <span className="text-blue-600 underline">browse</span>
                      </span>
                      <span className="text-base text-[var(--muted)]">
                        Supports JPG &amp; PNG ({formData.photos.length}/{MAX_PHOTOS} images)
                      </span>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/jpeg,image/png"
                        multiple
                        className="sr-only"
                        disabled={formData.photos.length >= MAX_PHOTOS}
                        onChange={(e) => addPhotos(e.target.files)}
                      />
                    </label>

                    {photoNotice && (
                      <p role="alert" className="mt-3 text-base text-red-500">
                        {photoNotice}
                      </p>
                    )}

                    {formData.photos.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        {formData.photos.map((file, i) => (
                          <div
                            key={`${file.name}-${file.size}-${file.lastModified}`}
                            className="relative aspect-square overflow-hidden border border-[var(--line)]"
                          >
                            <img
                              src={photoUrls[i]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              aria-label="Remove this picture"
                              onClick={() => removePhoto(i)}
                              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[var(--ink)] shadow hover:bg-white cursor-pointer"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* TIP: the picture step is compulsory now, so Next stays
                        disabled until at least one picture has been added. */}
                    <PrimaryButton
                      className="mt-6"
                      disabled={formData.photos.length === 0}
                      onClick={() => goTo("more")}
                    >
                      Next
                    </PrimaryButton>
                  </div>
                )}

                {/* ============ CUSTOM: anything else ============ */}
                {phase === "more" && (
                  <div className="max-w-md mx-auto">
                    <h2 className="font-display text-2xl text-center text-[var(--ink)] mb-6 font-bold">
                      Anything else you&apos;d like to mention?
                    </h2>
                    <div className="space-y-4">
                      <textarea
                        rows={4}
                        value={formData.customDetails}
                        onChange={(e) =>
                          updateField("customDetails", e.target.value)
                        }
                        placeholder="This might help Lara nail your vision faster. E.g. and for the lady, perhaps a matching bag 😉?"
                        className="w-full border border-[var(--line)] px-4 py-3.5 bg-[var(--cream)]/40 focus:bg-white text-base outline-none transition-all focus:border-[var(--ink)] resize-none"
                      />
                      <PrimaryButton onClick={() => goTo("email")}>
                        {formData.customDetails.trim() ? "Next" : "No"}
                      </PrimaryButton>
                    </div>
                  </div>
                )}

                {/* ============ CUSTOM: email ============ */}
                {phase === "email" && flow === "custom" && (
                  <form onSubmit={submitCustom} className="max-w-sm mx-auto">
                    <h2 className="font-display text-2xl text-center text-[var(--ink)] mb-6 font-bold">
                      Where can Lara email you?
                    </h2>
                    <div className="space-y-4">
                      <TextField
                        type="email"
                        value={formData.customEmail}
                        onChange={(v) => updateField("customEmail", v)}
                        placeholder="Email address"
                        helpText="We will only use your email to coordinate your custom piece details."
                        error={errors.customEmail}
                        required
                      />
                      <PrimaryButton
                        type="submit"
                        disabled={submitting || !formData.customEmail.trim()}
                      >
                        {submitting ? "Submitting..." : "Send Custom Order"}
                      </PrimaryButton>
                    </div>
                  </form>
                )}
              </StepShell>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {sizePopup && (
        <SizePopup size={sizePopup} onClose={() => setSizePopup(null)} />
      )}

      {phase === "success" && (
        <div className="text-center pb-4">
          <button
            onClick={resetAll}
            className="text-base font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors py-2 cursor-pointer"
          >
            Start another request
          </button>
        </div>
      )}

      {/* TIP: footer hidden on phones — see the note on <main> above. */}
      <div className="max-md:hidden">
        <Footer />
      </div>
    </>
  );
}
