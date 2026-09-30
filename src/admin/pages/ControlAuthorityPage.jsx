/*
  CONTROL AUTHORITY — Who can do what in the admin dashboard.
  Lara can invite team members, assign roles (Admin / Editor / Viewer),
  and revoke access.
*/
import { useState } from "react";
import { CirclePlus, Crown, Eye, Pencil, Shield, Trash2, X } from "lucide-react";
import { useAdmin } from "../AdminData";
import { cx, dateDMY } from "../fmt";
import { Avatar } from "../AdminShell";
import { Btn, Card, EmptyState, HeadRow, StatusDot, useToast } from "../ui";

/* ---------- types ---------- */
const ROLES = {
  admin: { label: "Admin", Icon: Crown, desc: "Full access — can do everything including managing team members." },
  editor: { label: "Editor", Icon: Pencil, desc: "Can manage products, orders and custom orders, but not team members or settings." },
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
function InviteModal({ onClose, onInvite }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");

  function submit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    onInvite(email.trim(), role);
    onClose();
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
            <Btn type="submit" className="h-11 rounded-md px-5">Send invite</Btn>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- the page ---------- */
const COLS = "grid-cols-[2fr_1fr_1fr_80px]";

export default function ControlAuthorityPage() {
  const { demo, profile } = useAdmin();
  const [toast, toastNode] = useToast();
  const [showInvite, setShowInvite] = useState(false);

  const [members, setMembers] = useState([
    { id: 1, name: "Lara Olafolorunsho", email: "laraolafolorunsho@gmail.com", role: "admin", status: "active", joined: "2024-01-15" },
    { id: 2, name: "Amara Okoye", email: "amara@example.com", role: "editor", status: "active", joined: "2024-06-02" },
    { id: 3, name: "Tunde Adesanya", email: "tunde@example.com", role: "viewer", status: "invited", joined: "2024-09-20" },
  ]);

  function invite(email, role) {
    if (demo) { toast("Sample data — nothing is saved in demo mode."); return; }
    const exists = members.find((m) => m.email === email);
    if (exists) { toast("That email is already in the team.", "error"); return; }
    setMembers((prev) => [
      ...prev,
      { id: Date.now(), name: email.split("@")[0], email, role, status: "invited", joined: new Date().toISOString().slice(0, 10) },
    ]);
    toast(`Invite sent to ${email}.`);
  }

  function changeRole(id, role) {
    if (demo) { toast("Sample data — nothing is saved in demo mode."); return; }
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
  }

  function revoke(m) {
    if (demo) { toast("Sample data — nothing is saved in demo mode."); return; }
    if (m.role === "admin" && members.filter((x) => x.role === "admin").length === 1) {
      toast("You need at least one admin.", "error");
      return;
    }
    if (!window.confirm(`Remove ${m.name} from the team?`)) return;
    setMembers((prev) => prev.filter((x) => x.id !== m.id));
    toast(`${m.name} removed.`);
  }

  const permissions = [
    { area: "View dashboard", admin: true, editor: true, viewer: true },
    { area: "Manage products", admin: true, editor: true, viewer: false },
    { area: "Manage orders", admin: true, editor: true, viewer: true },
    { area: "Manage customers", admin: true, editor: true, viewer: true },
    { area: "Manage coupons", admin: true, editor: true, viewer: false },
    { area: "View transactions", admin: true, editor: true, viewer: true },
    { area: "Edit shipping rates", admin: true, editor: false, viewer: false },
    { area: "Edit brand settings", admin: true, editor: false, viewer: false },
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
                    : <StatusDot tone="amber">Invited</StatusDot>}
                </span>

                {/* Remove */}
                <span className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => revoke(m)}
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

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onInvite={invite} />}
      {toastNode}
    </div>
  );
}
