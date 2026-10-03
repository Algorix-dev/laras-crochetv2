/*
  CONTROL AUTHORITY — Who can do what in the admin dashboard.
  Lara can invite team members (an email link lets them choose their own
  password), assign roles (Admin / Editor / Viewer), and remove access.
  The roles are ENFORCED by the server (server/middleware/requireAdmin.js),
  not just shown here.
*/
import { useEffect, useState } from "react";
import { changeMemberLevel, getTeam, inviteMember, removeMember, resendInvite } from "../../api";
import { CirclePlus, Crown, Eye, Pencil, Shield, Trash2, X } from "lucide-react";
import { useAdmin } from "../AdminData";
import { cx, dateDMY } from "../fmt";
import { Avatar } from "../AdminShell";
import { Btn, Card, EmptyState, HeadRow, StatusDot, useToast } from "../ui";

/* ---------- types ---------- */
const ROLES = {
  admin: { label: "Admin", Icon: Crown, desc: "Full access — can do everything including managing team members." },
  editor: { label: "Editor", Icon: Pencil, desc: "Can manage products, orders, enquiries, coupons and reviews, but not team, shipping, brand or newsletters." },
  viewer: { label: "Viewer", Icon: Eye, desc: "Read-only access — can view everything but cannot make changes." },
};

function RoleBadge({ role }) {
  const { label, Icon } = ROLES[role] || ROLES.viewer;
  const colours = {
    admin: "bg-[var(--a-pink)] text-[var(--a-maroon)]",
    editor: "bg-[#e8f5e9] text-[#2e7d32]",
    viewer: "bg-[#f3f4f5] text-[var(--a-muted)]",
  };
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-bold", colours[role])}>
      <Icon size={13} />
      {label}
    </span>
  );
}

/* ---------- modal ---------- */
function InviteModal({ onClose, onInvite, busy }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");

  function submit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    onInvite(email.trim(), role); // the page closes this once the invite email is sent
  }

  const inp = "h-11 w-full rounded-md border border-[#eceef1] bg-[var(--a-bg)] px-3.5 text-[15px] text-[var(--a-ink)] outline-none focus:border-[var(--a-maroon)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[480px] rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-bold text-[var(--a-ink)]">Invite team member</h2>
          <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-md text-[var(--a-muted)] hover:bg-[#f3f4f5]">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-[14px] font-bold text-[var(--a-ink)]">Email address</label>
            <input type="email" className={inp} placeholder="colleague@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-2 block text-[14px] font-bold text-[var(--a-ink)]">Role</label>
            <div className="space-y-2">
              {Object.entries(ROLES).map(([key, { label, Icon, desc }]) => (
                <label
                  key={key}
                  className={cx(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition",
                    role === key ? "border-[var(--a-maroon)] bg-[var(--a-pink)]" : "border-[#eceef1] hover:bg-[#fafafa]"
                  )}
                >
                  <input type="radio" name="role" value={key} checked={role === key} onChange={() => setRole(key)} className="mt-1" />
                  <div>
                    <p className="flex items-center gap-1.5 text-[14px] font-bold text-[var(--a-ink)]">
                      <Icon size={14} /> {label}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[var(--a-muted)]">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Btn variant="white" className="h-11 rounded-md px-5" onClick={onClose}>Cancel</Btn>
            <Btn type="submit" disabled={busy} className="h-11 rounded-md px-5">{busy ? "Sending…" : "Send invite"}</Btn>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- the page ---------- */
const COLS = "grid-cols-[2fr_1fr_1fr_80px]";

const DEMO_MEMBERS = [
  { id: 1, name: "Lara", email: "lara@example.com", role: "admin", status: "active" },
  { id: 2, name: "Amara", email: "amara@example.com", role: "editor", status: "active" },
  { id: 3, name: "Tunde", email: "tunde@example.com", role: "viewer", status: "invited" },
];

const fromServer = (m) => ({ id: m.id, name: m.name, email: m.email, role: m.accessLevel, status: m.status });

export default function ControlAuthorityPage() {
  const { demo, profile } = useAdmin();
  const [toast, toastNode] = useToast();
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [members, setMembers] = useState(demo ? DEMO_MEMBERS : []);
  const [loading, setLoading] = useState(!demo);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (demo) return undefined;
    let cancelled = false;
    getTeam()
      .then((list) => !cancelled && setMembers(list.map(fromServer)))
      .catch((err) => !cancelled && setLoadError(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [demo]);

  const fail = (err) => toast(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message, "error");
  const isMe = (m) => profile?.email && m.email.toLowerCase() === profile.email.toLowerCase();

  async function invite(email, role) {
    if (demo) { toast("Sample data — nothing is saved in demo mode."); return; }
    setInviting(true);
    try {
      const created = await inviteMember(email, role);
      setMembers((prev) => [...prev, fromServer(created)]);
      setShowInvite(false);
      toast(`Invite sent to ${email}.`);
    } catch (err) {
      fail(err);
    } finally {
      setInviting(false);
    }
  }

  async function changeRole(id, role) {
    if (demo) { toast("Sample data — nothing is saved in demo mode."); return; }
    try {
      await changeMemberLevel(id, role);
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
      toast("Role updated.");
    } catch (err) {
      fail(err);
    }
  }

  async function resend(m) {
    if (demo) { toast("Sample data — nothing is saved in demo mode."); return; }
    try {
      await resendInvite(m.id);
      toast(`New invite sent to ${m.email}.`);
    } catch (err) {
      fail(err);
    }
  }

  async function revoke(m) {
    if (demo) { toast("Sample data — nothing is saved in demo mode."); return; }
    if (!window.confirm(`Remove ${m.name} from the team?`)) return;
    try {
      await removeMember(m.id);
      setMembers((prev) => prev.filter((x) => x.id !== m.id));
      toast(`${m.name} removed.`);
    } catch (err) {
      fail(err);
    }
  }

  if (loading) return <p className="py-24 text-center text-[16px] text-[var(--a-muted)]">Loading team…</p>;
  if (loadError) {
    return <p role="alert" className="rounded-md bg-[#fff1f2] px-4 py-3 text-[14px] text-[var(--a-red)]">{loadError}</p>;
  }

  // Matches what the server enforces: a viewer can only look, never change.
  const permissions = [
    { area: "View dashboard, orders and customers", admin: true, editor: true, viewer: true },
    { area: "Manage products and photos", admin: true, editor: true, viewer: false },
    { area: "Update orders, custom orders and enquiries", admin: true, editor: true, viewer: false },
    { area: "Manage coupons and reviews", admin: true, editor: true, viewer: false },
    { area: "Edit shipping prices", admin: true, editor: false, viewer: false },
    { area: "Edit brand settings", admin: true, editor: false, viewer: false },
    { area: "Send newsletters", admin: true, editor: false, viewer: false },
    { area: "Manage team", admin: true, editor: false, viewer: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        <h2 className="text-[22px] font-bold text-[var(--a-ink)]">Control Authority</h2>
        <Btn className="h-12 rounded-md px-5" onClick={() => setShowInvite(true)}>
          <CirclePlus size={20} /> Invite member
        </Btn>
      </div>

      {/* Team table */}
      <Card className="px-5 pb-6 pt-5">
        <h3 className="mb-5 text-[18px] font-bold text-[var(--a-ink)]">Team members ({members.length})</h3>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <HeadRow className={cx("h-12", COLS)}>
              <span>Member</span>
              <span>Role</span>
              <span>Status</span>
              <span className="text-center">Remove</span>
            </HeadRow>

            {members.length === 0 && <EmptyState title="No team members" text="Invite colleagues to help manage the shop." />}

            {members.map((m) => (
              <div key={m.id} className={cx("grid h-[72px] items-center border-b border-[var(--a-line-strong)] px-4 text-[15px] text-[var(--a-ink)]", COLS)}>
                {/* Name + email */}
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--a-pink)] text-[13px] font-bold text-[var(--a-maroon)]">
                    {m.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{m.name}</p>
                    <p className="truncate text-[12px] text-[var(--a-muted)]">{m.email}</p>
                  </div>
                </div>

                {/* Role selector */}
                <select
                  value={m.role}
                  disabled={isMe(m)}
                  title={isMe(m) ? "You can't change your own role" : undefined}
                  onChange={(e) => changeRole(m.id, e.target.value)}
                  className="h-9 rounded-md border border-[#eceef1] bg-white px-2 text-[14px] text-[var(--a-ink)] outline-none focus:border-[var(--a-maroon)]"
                >
                  {Object.entries(ROLES).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>

                {/* Status */}
                <span>
                  {m.status === "active"
                    ? <StatusDot tone="green">Active</StatusDot>
                    : (
                      <span className="flex items-center gap-2">
                        <StatusDot tone="amber">Invited</StatusDot>
                        <button type="button" onClick={() => resend(m)} className="text-[12px] font-bold text-[var(--a-maroon)] underline">Resend</button>
                      </span>
                    )}
                </span>

                {/* Remove */}
                <span className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => revoke(m)}
                    disabled={isMe(m)}
                    aria-label={`Remove ${m.name}`}
                    className="flex size-8 items-center justify-center rounded-md text-[var(--a-muted)] hover:bg-[#ffe4e6] hover:text-[var(--a-red)]"
                  >
                    <Trash2 size={16} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Permissions matrix */}
      <Card className="px-5 pb-6 pt-5">
        <h3 className="mb-5 text-[18px] font-bold text-[var(--a-ink)]">Permissions by role</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-[14px]">
            <thead>
              <tr className="border-b border-[var(--a-line-strong)]">
                <th className="pb-3 text-left font-bold text-[var(--a-ink)]">Area</th>
                {Object.entries(ROLES).map(([key, { label, Icon }]) => (
                  <th key={key} className="pb-3 text-center font-bold text-[var(--a-ink)]">
                    <span className="inline-flex items-center gap-1"><Icon size={13} />{label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((p, i) => (
                <tr key={p.area} className={cx("border-b border-[var(--a-line-strong)]", i % 2 === 0 ? "bg-[#fafafa]" : "")}>
                  <td className="py-3 pr-4 text-[var(--a-ink)]">{p.area}</td>
                  {["admin", "editor", "viewer"].map((role) => (
                    <td key={role} className="py-3 text-center">
                      {p[role]
                        ? <span className="text-[var(--a-green)]">✓</span>
                        : <span className="text-[#d1d5db]">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onInvite={invite} busy={inviting} />}
      {toastNode}
    </div>
  );
}
