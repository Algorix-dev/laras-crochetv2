/*
  TIP: This page has two visual modes, matching her design:
  - Empty: just an "ADD ADDRESS" button, form hidden
  - Has addresses: saved address card(s) shown, plus a form that
    only appears when adding a new one or editing an existing one
  `formOpen` + `editingId` together decide which of those to show.
*/
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProducts, normalizeProduct } from '../api';
import ProductGrid from '../components/ProductGrid';
import AccountSidebar from '../components/AccountSidebar';
import Footer from '../components/Footer';
import CountryDropdown from '../components/CountryDropdown';
import { defaultCountry } from '../data/countries';

const emptyForm = {
  firstName: '',
  lastName: '',
  company: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: defaultCountry,
  phone: '',
  setDefault: false,
};

export default function AddressesPage() {
  const { isSignedIn, token } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  useEffect(() => {
    if (!isSignedIn) {
      navigate('/signin?redirect=/account/addresses');
      return;
    }
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  const [recommended, setRecommended] = useState([]);
  useEffect(() => {
    getProducts('all')
      .then((data) => setRecommended(data.map(normalizeProduct).slice(0, 4)))
      .catch(() => setRecommended([]));
  }, []);

  async function fetchAddresses() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/account/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setAddresses(await res.json());
    } catch {
      // same pattern as Order History — fail quietly to an empty list
    } finally {
      setLoading(false);
    }
  }

  function startEdit(address) {
    setForm({
      ...address,
      country: address.country || defaultCountry,
      setDefault: address.isDefault,
    });
    setEditingId(address._id);
    setFormOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    const url = editingId
      ? `${import.meta.env.VITE_API_URL}/api/account/addresses/${editingId}`
      : `${import.meta.env.VITE_API_URL}/api/account/addresses`;

    try {
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        await fetchAddresses();
        setFormOpen(false);
        setEditingId(null);
        setForm(emptyForm);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id) {
    await fetch(`${import.meta.env.VITE_API_URL}/api/account/addresses/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setConfirmRemoveId(null);
    fetchAddresses();
  }

  if (!isSignedIn) return null;

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <p className="mb-6 text-xs text-[var(--muted)]">
          <Link to="/" className="hover:underline">Home</Link> / Account
        </p>

        <div className="grid gap-10 md:grid-cols-[180px_1fr]">
          <AccountSidebar active="addresses" />

          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-[var(--ink)]">Addresses</h1>
              {!formOpen && (
                <button
                  onClick={() => {
                    setForm(emptyForm);
                    setEditingId(null);
                    setFormOpen(true);
                  }}
                  className="bg-[var(--ink)] px-4 py-2.5 text-xs uppercase tracking-wide text-white hover:bg-[var(--maroon)]"
                >
                  {addresses.length > 0 ? 'Add a New Address' : 'Add Address'}
                </button>
              )}
            </div>

            {loading ? (
              <div className="max-w-sm animate-pulse space-y-3 border border-[var(--line)] p-4" aria-busy="true" aria-label="Loading addresses">
                <div className="h-3.5 w-32 rounded bg-[var(--line)]" />
                <div className="h-3 w-full rounded bg-[var(--line)]" />
                <div className="h-3 w-3/4 rounded bg-[var(--line)]" />
                <div className="h-3 w-1/2 rounded bg-[var(--line)]" />
              </div>
            ) : (
              <>
                {/* Saved address cards */}
                {!formOpen && addresses.length > 0 && (
                  <div className="space-y-4">
                    {addresses.map((a) => (
                      <div key={a._id} className="max-w-sm border border-[var(--line)] p-4 text-sm">
                        <p className="font-bold">{a.firstName} {a.lastName}</p>
                        <p className="text-[var(--muted)]">
                          {a.addressLine1}, {a.city}
                          <br />
                          {a.postalCode} · {a.state}
                          <br />
                          {a.country?.name}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          {a.isDefault && (
                            <span className="flex items-center gap-1 text-xs">
                              <input type="checkbox" checked readOnly /> Default
                            </span>
                          )}
                          <div className="ml-auto flex gap-3 text-xs">
                            <button onClick={() => startEdit(a)} className="underline hover:text-[var(--maroon)]">
                              Edit
                            </button>
                            <button onClick={() => setConfirmRemoveId(a._id)} className="underline hover:text-[var(--maroon)]">
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty state — no addresses, form not open yet */}
                {!formOpen && addresses.length === 0 && (
                  <p className="text-sm text-[var(--muted)]">No addresses saved yet.</p>
                )}

                {/* Add/edit form */}
                {formOpen && (
                  <form onSubmit={handleSubmit} className="max-w-2xl">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        required
                        placeholder="First Name"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        className="border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
                      />
                      <input
                        required
                        placeholder="Last Name"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        className="border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
                      />
                      <input
                        placeholder="Company (optional)"
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        className="border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ink)] sm:col-span-2"
                      />
                      <input
                        required
                        placeholder="Address Line 1"
                        value={form.addressLine1}
                        onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                        className="border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ink)] sm:col-span-2"
                      />
                      <input
                        placeholder="Address Line 2 (Optional)"
                        value={form.addressLine2}
                        onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                        className="border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ink)] sm:col-span-2"
                      />
                      <input
                        required
                        placeholder="City"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className="border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
                      />
                      <input
                        required
                        placeholder="State/Province"
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        className="border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
                      />
                      <input
                        required
                        placeholder="Postal/Zip Code"
                        value={form.postalCode}
                        onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                        className="border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
                      />
                      <CountryDropdown
                        value={form.country}
                        onChange={(c) => setForm({ ...form, country: c })}
                      />

                      {/* Phone — country dial code prefix comes from the same
                          country selection above, matching her design's
                          combined flag+code+number field */}
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs text-[var(--muted)]">Phone</label>
                        <div className="flex border border-[var(--line)]">
                          <span className="flex items-center gap-1 border-r border-[var(--line)] px-3 text-sm text-[var(--muted)]">
                            {form.country.flag} {form.country.dial}
                          </span>
                          <input
                            required
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder="Phone number"
                            className="w-full px-3 py-2.5 text-sm outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <label className="mt-4 flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={form.setDefault}
                        onChange={(e) => setForm({ ...form, setDefault: e.target.checked })}
                      />
                      Set as default address
                    </label>

                    <div className="mt-5 flex gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-[var(--ink)] px-6 py-2.5 text-xs uppercase tracking-wide text-white hover:bg-[var(--maroon)] disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Add Address'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormOpen(false);
                          setEditingId(null);
                        }}
                        className="px-6 py-2.5 text-xs uppercase tracking-wide text-[var(--muted)] hover:text-[var(--ink)]"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>

        {recommended.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-sm font-bold">Lara Thinks You'd Love These Too</h2>
            <ProductGrid products={recommended} />
          </div>
        )}
      </section>

      {confirmRemoveId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#372A2B]/95 px-5"
          onClick={() => setConfirmRemoveId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs bg-white p-6 text-left shadow-xl"
          >
            <div className="mb-3 flex items-start justify-between">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line-2)] text-[var(--ink)]"
              >
                <Trash2 size={16} />
              </span>
              <button aria-label="Close" onClick={() => setConfirmRemoveId(null)} className="text-[var(--muted)] hover:text-[var(--ink)]">
                <X size={16} />
              </button>
            </div>
            <h2 className="mb-1 text-sm font-bold">Remove Address</h2>
            <p className="mb-5 text-xs text-[var(--muted)]">Are you sure you want to remove this address?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRemoveId(null)}
                className="flex-1 border border-[var(--line-2)] py-2.5 text-xs uppercase tracking-wide hover:bg-black/[0.02]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemove(confirmRemoveId)}
                className="flex-1 bg-[var(--maroon)] py-2.5 text-xs uppercase tracking-wide text-white hover:bg-[var(--maroon-dark)]"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
