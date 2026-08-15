/*
  TIP: This is the Contact Page — it houses our multi-step contact wizard.
  It supports two paths: General Enquiries and Custom Orders.
  
  We use 'framer-motion' for fluid animations between steps.
  We also use 'AnimatePresence' with 'mode="wait"' so the outgoing step
  fades/slides out before the incoming step enters, keeping the transition clean.
*/
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, HelpCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Footer from '../components/Footer';

// TIP: Define slide animations. The custom parameter 'dir' (direction)
// allows us to slide right when going "Next" (1) and slide left when going "Back" (-1).
const stepVariants = {
  enter: (dir) => ({
    x: dir > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir) => ({
    x: dir < 0 ? 50 : -50,
    opacity: 0,
  }),
};

export default function ContactPage() {
  const [searchParams] = useSearchParams();
  const flowParam = searchParams.get('flow') || '';

  const [step, setStep] = useState(flowParam ? 2 : 1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [flow, setFlow] = useState(flowParam);
  const [submitting, setSubmitting] = useState(false);

  // TIP: We sync search query updates (like navigating from 'Contact' to 'Custom Orders')
  // directly into the wizard's state so the page transitions instantly.
  useEffect(() => {
    setFlow(flowParam);
    setStep(flowParam ? 2 : 1);
  }, [flowParam]);

  // Form inputs state
  const [formData, setFormData] = useState({
    // General enquiry fields
    enquiryType: '',
    hasOrderNumber: '',
    orderNumber: '',
    enquiryDetails: '',
    enquiryEmail: '',

    // Custom order fields
    pieceType: '',
    measurementsChoice: '', // 'custom', 'standard', 'not_sure'
    bust: '',
    waist: '',
    hips: '',
    height: '',
    standardSize: '',
    customDetails: '',
    customEmail: '',
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  // Navigation helpers
  const nextStep = () => {
    setDirection(1);
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((prev) => prev - 1);
  };

  const resetForm = () => {
    setStep(1);
    setDirection(-1);
    setFlow('');
    setFormData({
      enquiryType: '',
      hasOrderNumber: '',
      orderNumber: '',
      enquiryDetails: '',
      enquiryEmail: '',
      pieceType: '',
      measurementsChoice: '',
      bust: '',
      waist: '',
      hips: '',
      height: '',
      standardSize: '',
      customDetails: '',
      customEmail: '',
    });
    setErrors({});
  };

  // Form state setter helper
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Step 1: Flow selection selection
  const selectFlow = (selectedFlow) => {
    setFlow(selectedFlow);
    nextStep();
  };

  // Step 2: Pill click selectors
  const handlePillSelect = (field, value) => {
    updateField(field, value);
    nextStep();
  };

  // Validation and submit handlers
  const handleEnquirySubmit = (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.enquiryEmail) {
      setErrors((prev) => ({ ...prev, enquiryEmail: 'Email is required' }));
      return;
    }
    if (!emailRegex.test(formData.enquiryEmail)) {
      setErrors((prev) => ({ ...prev, enquiryEmail: 'Please enter a valid email address' }));
      return;
    }

    setSubmitting(true);
    // Simulate submission delay
    setTimeout(() => {
      setSubmitting(false);
      nextStep();
    }, 1000);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.customEmail) {
      setErrors((prev) => ({ ...prev, customEmail: 'Email is required' }));
      return;
    }
    if (!emailRegex.test(formData.customEmail)) {
      setErrors((prev) => ({ ...prev, customEmail: 'Please enter a valid email address' }));
      return;
    }

    setSubmitting(true);
    // Simulate submission delay
    setTimeout(() => {
      setSubmitting(false);
      nextStep();
    }, 1000);
  };

  // Render helpers for specific steps
  const renderDots = () => {
    if (step === 6) return null; // Hide dots on success screen
    return (
      <div className="flex items-center justify-center gap-1.5 mb-6" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className={`rounded-full transition-all duration-300 ${
              idx + 1 === step
                ? 'w-2.5 h-2.5 bg-[var(--ink)] scale-110'
                : 'w-1.5 h-1.5 bg-[var(--line)]'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <main className="min-h-[calc(100vh-64px)] w-full flex items-center justify-center py-12 px-5 bg-[var(--cream)]">
        {/* Card Container with custom glow shadow and border matching Lara's colors */}
        <div className="relative max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 md:p-12 border border-[#f3ebed] shadow-[0_15px_50px_rgba(74,14,30,0.05)] overflow-hidden">
          
          {/* Top Header Row containing Back button and Step indicator */}
          {step < 6 && (
            <div className="flex items-center justify-between min-h-8 mb-5">
              {step > 1 ? (
                <button
                  onClick={prevStep}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors focus-visible:outline-none focus-visible:underline cursor-pointer"
                  aria-label="Go back to previous step"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              ) : (
                <div className="w-12 h-4" />
              )}
              
              <span className="text-[10px] tracking-[0.2em] font-semibold text-[var(--muted)] uppercase">
                Step {step} of 5
              </span>

              <div className="w-12 h-4" />
            </div>
          )}

          {/* Stepper Dot Indicators */}
          {renderDots()}

          {/* Dynamic Content Transitions */}
          <div className="min-h-[300px] flex flex-col justify-center">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`${flow}-${step}`}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="w-full"
              >
                
                {/* ========================================================
                    SHARED STEP 1: Flow selection (Enquiry vs Custom Order)
                    ======================================================== */}
                {step === 1 && (
                  <div className="text-center">
                    <h1 className="font-display text-3xl md:text-4xl text-[var(--ink)] mb-8 font-medium">
                      How would you like Lara to help you?
                    </h1>
                    <div className="space-y-4 max-w-sm mx-auto">
                      <button
                        onClick={() => selectFlow('custom')}
                        className="w-full border border-[var(--line)] rounded-xl py-4 px-6 text-sm font-semibold tracking-wide bg-white text-[var(--ink)] transition-all hover:border-[var(--ink)] focus-visible:border-[var(--ink)] cursor-pointer"
                      >
                        Make a custom order
                      </button>
                      <button
                        onClick={() => selectFlow('enquiry')}
                        className="w-full border border-[var(--ink)] rounded-xl py-4 px-6 text-sm font-semibold tracking-wide bg-[var(--ink)] text-white transition-all hover:bg-[var(--maroon)] hover:border-[var(--maroon)] cursor-pointer"
                      >
                        Make an enquiry
                      </button>
                    </div>
                  </div>
                )}

                {/* ========================================================
                    FLOW A: GENERAL ENQUIRY FLOW (Steps 2 to 6)
                    ======================================================== */}
                {flow === 'enquiry' && (
                  <>
                    {/* Step 2: Enquiry Topic selection */}
                    {step === 2 && (
                      <div>
                        <h2 className="font-display text-3xl text-center text-[var(--ink)] mb-8 font-medium">
                          What&apos;s your enquiry about?
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
                          {[
                            'Product availability',
                            'Sizing help',
                            'Order status',
                            'Delivery & shipping',
                            'Payment issue',
                            'Something else',
                          ].map((topic) => {
                            const isSelected = formData.enquiryType === topic;
                            return (
                              <button
                                key={topic}
                                onClick={() => handlePillSelect('enquiryType', topic)}
                                className={`border rounded-xl py-3 px-4 text-xs font-medium transition-all text-center cursor-pointer ${
                                  isSelected
                                    ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                                    : 'border-[var(--line)] bg-transparent text-[var(--ink)] hover:border-[var(--ink)]'
                                }`}
                              >
                                {topic}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Step 3: Check Order/Reference Number */}
                    {step === 3 && (
                      <div className="max-w-sm mx-auto">
                        <h2 className="font-display text-3xl text-center text-[var(--ink)] mb-6 font-medium">
                          Do you have an order or reference number?
                        </h2>
                        <div className="flex gap-4 mb-6">
                          <button
                            onClick={() => updateField('hasOrderNumber', 'yes')}
                            className={`flex-1 border rounded-xl py-3 text-xs font-semibold uppercase tracking-wide transition-colors cursor-pointer ${
                              formData.hasOrderNumber === 'yes'
                                ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                                : 'border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)]'
                            }`}
                          >
                            Yes, I have one
                          </button>
                          <button
                            onClick={() => {
                              updateField('hasOrderNumber', 'no');
                              updateField('orderNumber', '');
                              nextStep();
                            }}
                            className={`flex-1 border rounded-xl py-3 text-xs font-semibold uppercase tracking-wide transition-colors cursor-pointer ${
                              formData.hasOrderNumber === 'no'
                                ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                                : 'border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)]'
                            }`}
                          >
                            No, I don&apos;t
                          </button>
                        </div>

                        {/* Slide open input field if they select Yes */}
                        {formData.hasOrderNumber === 'yes' && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                          >
                            <div>
                              <label htmlFor="order-number" className="sr-only">Order Number</label>
                              <input
                                id="order-number"
                                type="text"
                                value={formData.orderNumber}
                                onChange={(e) => updateField('orderNumber', e.target.value)}
                                placeholder="Enter order number (e.g. #1024)"
                                className="w-full border border-[var(--line)] rounded-xl px-4 py-3.5 bg-[var(--cream)]/40 focus:bg-white text-sm outline-none transition-all focus:border-[var(--ink)]"
                                required
                              />
                            </div>
                            <button
                              onClick={nextStep}
                              disabled={!formData.orderNumber.trim()}
                              className="w-full bg-[var(--ink)] text-white text-xs font-bold uppercase tracking-widest py-4 rounded-xl transition-colors hover:bg-[var(--maroon)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              Next
                            </button>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Step 4: Tell Lara More details */}
                    {step === 4 && (
                      <div className="max-w-md mx-auto">
                        <h2 className="font-display text-3xl text-center text-[var(--ink)] mb-2 font-medium">
                          Tell Lara More
                        </h2>
                        <p className="text-center text-xs text-[var(--muted)] mb-6">
                          This might help Lara resolve it faster.
                        </p>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="enquiry-details" className="sr-only">Details</label>
                            <textarea
                              id="enquiry-details"
                              rows={4}
                              value={formData.enquiryDetails}
                              onChange={(e) => updateField('enquiryDetails', e.target.value)}
                              placeholder="What's on your mind?"
                              className="w-full border border-[var(--line)] rounded-2xl px-4 py-3.5 bg-[var(--cream)]/40 focus:bg-white text-sm outline-none transition-all focus:border-[var(--ink)] resize-none"
                              required
                            />
                          </div>
                          <button
                            onClick={nextStep}
                            disabled={!formData.enquiryDetails.trim()}
                            className="w-full bg-[var(--ink)] text-white text-xs font-bold uppercase tracking-widest py-4 rounded-xl transition-colors hover:bg-[var(--maroon)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Email capture */}
                    {step === 5 && (
                      <form onSubmit={handleEnquirySubmit} className="max-w-sm mx-auto">
                        <h2 className="font-display text-3xl text-center text-[var(--ink)] mb-6 font-medium">
                          Where can Lara e-mail you?
                        </h2>
                        <div className="space-y-4">
                          <div className="relative flex items-center">
                            <label htmlFor="enquiry-email" className="sr-only">Email address</label>
                            <input
                              id="enquiry-email"
                              type="email"
                              value={formData.enquiryEmail}
                              onChange={(e) => updateField('enquiryEmail', e.target.value)}
                              placeholder="Email address"
                              className={`w-full border rounded-xl pl-4 pr-11 py-3.5 bg-[var(--cream)]/40 focus:bg-white text-sm outline-none transition-all focus:border-[var(--ink)] ${
                                errors.enquiryEmail ? 'border-red-500' : 'border-[var(--line)]'
                              }`}
                              required
                            />
                            {/* SVG help icon on the right side of the input */}
                            <div className="absolute right-4 text-[var(--muted)]" title="We will only use your email to reply to your enquiry.">
                              <HelpCircle size={16} />
                            </div>
                          </div>
                          
                          {errors.enquiryEmail && (
                            <p className="text-xs text-red-500 text-center">{errors.enquiryEmail}</p>
                          )}

                          <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-[var(--ink)] text-white text-xs font-bold uppercase tracking-widest py-4 rounded-xl transition-colors hover:bg-[var(--maroon)] disabled:opacity-75 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {submitting ? 'Sending...' : 'Send Enquiry'}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Step 6: Confirmation/Success Page */}
                    {step === 6 && (
                      <div className="text-center max-w-sm mx-auto">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f3ebed] text-[var(--maroon)] rounded-full mb-6 animate-bounce">
                          <Check size={32} />
                        </div>
                        <h2 className="font-display text-4xl text-[var(--ink)] mb-4 font-medium">
                          Enquiry Sent
                        </h2>
                        <p className="text-sm text-[var(--muted)] leading-relaxed mb-8">
                          Thank you for reaching out! Your message was sent successfully. Lara will check it and reply to you at <strong>{formData.enquiryEmail}</strong> shortly.
                        </p>
                        <div className="flex flex-col gap-3">
                          <Link
                            to="/"
                            className="w-full bg-[var(--ink)] text-white text-xs font-bold uppercase tracking-widest py-4 rounded-xl transition-colors hover:bg-[var(--maroon)] text-center cursor-pointer"
                          >
                            Back to Shop
                          </Link>
                          <button
                            onClick={resetForm}
                            className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors py-2 focus-visible:outline-none cursor-pointer"
                          >
                            Send another enquiry
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ========================================================
                    FLOW B: CUSTOM ORDER FLOW (Steps 2 to 6)
                    ======================================================== */}
                {flow === 'custom' && (
                  <>
                    {/* Step 2: Piece Type selection */}
                    {step === 2 && (
                      <div>
                        <h2 className="font-display text-3xl text-center text-[var(--ink)] mb-8 font-medium">
                          What type of piece are you looking for?
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
                          {[
                            'Swimwear / Bikini',
                            'Dress / Cover-up',
                            'Two-Piece Set',
                            'Custom Design',
                            'Something else',
                          ].map((piece) => {
                            const isSelected = formData.pieceType === piece;
                            return (
                              <button
                                key={piece}
                                onClick={() => handlePillSelect('pieceType', piece)}
                                className={`border rounded-xl py-3 px-4 text-xs font-medium transition-all text-center cursor-pointer ${
                                  isSelected
                                    ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                                    : 'border-[var(--line)] bg-transparent text-[var(--ink)] hover:border-[var(--ink)]'
                                }`}
                              >
                                {piece}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Step 3: Sizing / Measurements details */}
                    {step === 3 && (
                      <div className="max-w-md mx-auto">
                        <h2 className="font-display text-3xl text-center text-[var(--ink)] mb-6 font-medium">
                          Do you know your measurements?
                        </h2>
                        
                        {/* 3 Choice options */}
                        <div className="flex flex-col gap-2 mb-6 max-w-xs mx-auto">
                          {[
                            { label: 'Yes, custom measurements', val: 'custom' },
                            { label: 'No, standard size', val: 'standard' },
                            { label: 'Let\'s discuss over email', val: 'not_sure' },
                          ].map((choice) => (
                            <button
                              key={choice.val}
                              onClick={() => {
                                updateField('measurementsChoice', choice.val);
                                if (choice.val === 'not_sure') {
                                  // Auto-advance if they don't want to type sizing info
                                  updateField('bust', '');
                                  updateField('waist', '');
                                  updateField('hips', '');
                                  updateField('height', '');
                                  updateField('standardSize', '');
                                  nextStep();
                                }
                              }}
                              className={`border rounded-xl py-3 text-xs font-medium transition-all cursor-pointer ${
                                formData.measurementsChoice === choice.val
                                  ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                                  : 'border-[var(--line)] bg-transparent text-[var(--ink)] hover:border-[var(--ink)]'
                              }`}
                            >
                              {choice.label}
                            </button>
                          ))}
                        </div>

                        {/* Case 1: Custom measurements input fields */}
                        {formData.measurementsChoice === 'custom' && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label htmlFor="bust" className="block text-[10px] uppercase font-bold text-[var(--muted)] mb-1">Bust (inches/cm)</label>
                                <input
                                  id="bust"
                                  type="text"
                                  value={formData.bust}
                                  onChange={(e) => updateField('bust', e.target.value)}
                                  placeholder="e.g. 34B or 85cm"
                                  className="w-full border border-[var(--line)] rounded-xl px-3 py-2 bg-[var(--cream)]/40 focus:bg-white text-xs outline-none focus:border-[var(--ink)]"
                                  required
                                />
                              </div>
                              <div>
                                <label htmlFor="waist" className="block text-[10px] uppercase font-bold text-[var(--muted)] mb-1">Waist (inches/cm)</label>
                                <input
                                  id="waist"
                                  type="text"
                                  value={formData.waist}
                                  onChange={(e) => updateField('waist', e.target.value)}
                                  placeholder="e.g. 26 inches"
                                  className="w-full border border-[var(--line)] rounded-xl px-3 py-2 bg-[var(--cream)]/40 focus:bg-white text-xs outline-none focus:border-[var(--ink)]"
                                  required
                                />
                              </div>
                              <div>
                                <label htmlFor="hips" className="block text-[10px] uppercase font-bold text-[var(--muted)] mb-1">Hips (inches/cm)</label>
                                <input
                                  id="hips"
                                  type="text"
                                  value={formData.hips}
                                  onChange={(e) => updateField('hips', e.target.value)}
                                  placeholder="e.g. 90cm"
                                  className="w-full border border-[var(--line)] rounded-xl px-3 py-2 bg-[var(--cream)]/40 focus:bg-white text-xs outline-none focus:border-[var(--ink)]"
                                  required
                                />
                              </div>
                              <div>
                                <label htmlFor="height" className="block text-[10px] uppercase font-bold text-[var(--muted)] mb-1">Height (optional)</label>
                                <input
                                  id="height"
                                  type="text"
                                  value={formData.height}
                                  onChange={(e) => updateField('height', e.target.value)}
                                  placeholder="e.g. 5ft 6in or 170cm"
                                  className="w-full border border-[var(--line)] rounded-xl px-3 py-2 bg-[var(--cream)]/40 focus:bg-white text-xs outline-none focus:border-[var(--ink)]"
                                />
                              </div>
                            </div>
                            <button
                              onClick={nextStep}
                              disabled={!formData.bust.trim() || !formData.waist.trim() || !formData.hips.trim()}
                              className="w-full bg-[var(--ink)] text-white text-xs font-bold uppercase tracking-widest py-3.5 rounded-xl transition-colors hover:bg-[var(--maroon)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              Next
                            </button>
                          </motion.div>
                        )}

                        {/* Case 2: Standard size grid list */}
                        {formData.measurementsChoice === 'standard' && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                          >
                            <div>
                              <p className="block text-[10px] uppercase font-bold text-[var(--muted)] mb-3 text-center">Select Standard Size</p>
                              <div className="flex flex-wrap justify-center gap-2">
                                {['XS', 'S', 'M', 'L', 'XL'].map((sz) => (
                                  <button
                                    key={sz}
                                    onClick={() => updateField('standardSize', sz)}
                                    className={`w-12 h-12 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                      formData.standardSize === sz
                                        ? 'border-[var(--ink)] bg-[var(--ink)] text-white scale-105'
                                        : 'border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)]'
                                    }`}
                                  >
                                    {sz}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={nextStep}
                              disabled={!formData.standardSize}
                              className="w-full bg-[var(--ink)] text-white text-xs font-bold uppercase tracking-widest py-3.5 rounded-xl transition-colors hover:bg-[var(--maroon)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              Next
                            </button>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Step 4: Tell Lara More custom request detail */}
                    {step === 4 && (
                      <div className="max-w-md mx-auto">
                        <h2 className="font-display text-3xl text-center text-[var(--ink)] mb-2 font-medium">
                          Tell Lara More
                        </h2>
                        <p className="text-center text-xs text-[var(--muted)] mb-6">
                          Describe colors, style details, deadlines, or design requests.
                        </p>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="custom-details" className="sr-only">Details</label>
                            <textarea
                              id="custom-details"
                              rows={4}
                              value={formData.customDetails}
                              onChange={(e) => updateField('customDetails', e.target.value)}
                              placeholder="Describe your dream piece here..."
                              className="w-full border border-[var(--line)] rounded-2xl px-4 py-3.5 bg-[var(--cream)]/40 focus:bg-white text-sm outline-none transition-all focus:border-[var(--ink)] resize-none"
                              required
                            />
                          </div>
                          <button
                            onClick={nextStep}
                            disabled={!formData.customDetails.trim()}
                            className="w-full bg-[var(--ink)] text-white text-xs font-bold uppercase tracking-widest py-4 rounded-xl transition-colors hover:bg-[var(--maroon)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Email capture */}
                    {step === 5 && (
                      <form onSubmit={handleCustomSubmit} className="max-w-sm mx-auto">
                        <h2 className="font-display text-3xl text-center text-[var(--ink)] mb-6 font-medium">
                          Where can Lara e-mail you?
                        </h2>
                        <div className="space-y-4">
                          <div className="relative flex items-center">
                            <label htmlFor="custom-email" className="sr-only">Email address</label>
                            <input
                              id="custom-email"
                              type="email"
                              value={formData.customEmail}
                              onChange={(e) => updateField('customEmail', e.target.value)}
                              placeholder="Email address"
                              className={`w-full border rounded-xl pl-4 pr-11 py-3.5 bg-[var(--cream)]/40 focus:bg-white text-sm outline-none transition-all focus:border-[var(--ink)] ${
                                errors.customEmail ? 'border-red-500' : 'border-[var(--line)]'
                              }`}
                              required
                            />
                            {/* SVG help icon */}
                            <div className="absolute right-4 text-[var(--muted)]" title="We will only use your email to coordinate your custom piece details.">
                              <HelpCircle size={16} />
                            </div>
                          </div>

                          {errors.customEmail && (
                            <p className="text-xs text-red-500 text-center">{errors.customEmail}</p>
                          )}

                          <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-[var(--ink)] text-white text-xs font-bold uppercase tracking-widest py-4 rounded-xl transition-colors hover:bg-[var(--maroon)] disabled:opacity-75 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {submitting ? 'Submitting...' : 'Send Custom Request'}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Step 6: Confirmation/Success Page */}
                    {step === 6 && (
                      <div className="text-center max-w-sm mx-auto">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f3ebed] text-[var(--maroon)] rounded-full mb-6 animate-bounce">
                          <Check size={32} />
                        </div>
                        <h2 className="font-display text-4xl text-[var(--ink)] mb-4 font-medium">
                          Request Sent!
                        </h2>
                        <p className="text-sm text-[var(--muted)] leading-relaxed mb-8">
                          Your custom order details were sent to Lara. She will check her design planner and follow up at <strong>{formData.customEmail}</strong> with questions, measurements reviews, and a cost estimate.
                        </p>
                        <div className="flex flex-col gap-3">
                          <Link
                            to="/"
                            className="w-full bg-[var(--ink)] text-white text-xs font-bold uppercase tracking-widest py-4 rounded-xl transition-colors hover:bg-[var(--maroon)] text-center cursor-pointer"
                          >
                            Back to Shop
                          </Link>
                          <button
                            onClick={resetForm}
                            className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors py-2 focus-visible:outline-none cursor-pointer"
                          >
                            Send another request
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
