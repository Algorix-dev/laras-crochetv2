/*
  ADMIN ROLE — Lara's Figma "Admin role" frame.

  What is real:
    - name        saved on the server (PUT /api/auth/profile)
    - password    changed on the server (PUT /api/auth/password)
    - email       shown, not editable — it is the login
  What stays in this browser only: phone, date of birth, location,
  biography and the profile photo (see profileStore.js).

  Left out on purpose: "Linked with Social media" and the Credit Card field
  from the template — there is nothing behind either.
*/
import { useRef, useState } from "react";
import { CalendarDays, Copy, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { adminSession, changeAdminPassword, updateAdminName } from "../../api";
import { useAdmin } from "../AdminData";
import { Avatar } from "../AdminShell";
import { cx } from "../fmt";
import { photoToDataUrl, useProfileExtra, writeExtra } from "../profileStore";
import { Btn, Card, useToast } from "../ui";

const field =
  "h-11 w-full rounded-md border border-[#eceef1] bg-[var(--a-bg)] px-3.5 text-[15px] font-bold text-[var(--a-ink)] outline-none focus:border-[var(--a-maroon)] disabled:cursor-default disabled:opacity-100 placeholder:font-normal";

function Label({ children }) {
  return <label className="mb-2 block text-[14px] text-[var(--a-ink)]">{children}</label>;
}

function PasswordInput({ value, onChange, placeholder = "Enter password", label, id }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex h-11 items-center rounded-md border border-[#eceef1] bg-[var(--a-bg)] focus-within:border-[var(--a-maroon)]">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-[15px] text-[var(--a-ink)] outline-none"
        />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="px-3 text-[var(--a-muted)]">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function AdminRolePage() {
  const { profile, demo } = useAdmin();
  const extra = useProfileExtra();
  const [toast, toastNode] = useToast();

  const fullName = profile?.name || (demo ? "Lara Olafolorunsho" : "");
  const email = profile?.email || (demo ? "laraolafolorunsho@gmail.com" : "");
  const [first, ...rest] = fullName.split(" ");

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(first || "");
  const [lastName, setLastName] = useState(rest.join(" "));
  const [phone, setPhone] = useState(extra.phone || "");
  const [dob, setDob] = useState(extra.dob || "");
  const [location, setLocation] = useState(extra.location || "");
  const [bio, setBio] = useState(extra.bio || "");
  const photoRef = useRef(null);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  async function saveProfile() {
    const name = `${firstName} ${lastName}`.trim();
    try {
      if (!demo && name && name !== fullName) {
        const saved = await updateAdminName(name);
        adminSession.setProfile({ name: saved.name, email: saved.email });
      }
      writeExtra({ phone, dob, location, bio });
      setEditing(false);
      toast(demo ? "Sample data — saved on this browser only." : "Profile saved.");
    } catch (err) {
      toast(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message, "error");
    }
  }

  async function pickPhoto(file) {
    if (!file) return;
    try {
      writeExtra({ avatar: await photoToDataUrl(file) });
      toast("Profile photo updated on this browser.");
    } catch (err) {
      toast(err.message, "error");
    }
  }

  async function savePassword() {
    setPwError("");
    if (!current || !next || !again) return setPwError("Fill in all three password boxes.");
    if (next.length < 8) return setPwError("The new password needs at least 8 characters.");
    if (next !== again) return setPwError("The two new passwords don't match.");
    if (demo) return toast("Sample data — nothing is changed in demo mode.");
    setPwBusy(true);
    try {
      await changeAdminPassword(current, next);
      setCurrent("");
      setNext("");
      setAgain("");
      toast("Password changed.");
    } catch (err) {
      setPwError(err.message === "SESSION_EXPIRED" ? "Your session ended — please sign in again." : err.message);
    } finally {
      setPwBusy(false);
    }
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      toast("Email copied.");
    } catch {
      toast("Couldn't copy — select it and copy by hand.", "error");
    }
  }

  return (
    <div>
      <h2 className="pb-4 text-[22px] font-bold text-[var(--a-ink)]">About section</h2>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,309fr)_minmax(0,630fr)]">
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[var(--a-ink)]">Profile</h3>
              <button type="button" onClick={() => setEditing(true)} aria-label="Edit profile" className="text-[var(--a-ink)]">
                <Pencil size={17} />
              </button>
            </div>
            <div className="mt-4 flex flex-col items-center">
              <Avatar size={80} />
              <p className="mt-4 text-[18px] font-bold text-[var(--a-ink)]">{fullName || "Admin"}</p>
              <p className="mt-1 flex items-center gap-2 text-[13px] text-[var(--a-muted)]">
                {email}
                {email && (
                  <button type="button" onClick={copyEmail} aria-label="Copy email" className="text-[var(--a-blue)]">
                    <Copy size={15} />
                  </button>
                )}
              </p>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-[18px] font-bold text-[var(--a-ink)]">Change Password</h3>
            <div className="mt-4 space-y-4">
              <PasswordInput id="pw-current" label="Current Password" value={current} onChange={setCurrent} />
              <PasswordInput id="pw-new" label="New Password" value={next} onChange={setNext} />
              <PasswordInput id="pw-again" label="Re-enter Password" value={again} onChange={setAgain} />
            </div>
            {pwError && (
              <p role="alert" className="mt-3 text-[13px] text-[var(--a-red)]">
                {pwError}
              </p>
            )}
            <Btn onClick={savePassword} disabled={pwBusy} className="mt-5 h-11 w-full rounded-md text-[15px]">
              {pwBusy ? "Saving…" : "Save Change"}
            </Btn>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[18px] font-bold text-[var(--a-ink)]">Profile Update</h3>
            <Btn
              variant={editing ? "primary" : "white"}
              onClick={() => (editing ? saveProfile() : setEditing(true))}
              className="h-9 rounded-md px-4 text-[14px]"
            >
              {editing ? "Save" : (<><Pencil size={14} /> Edit</>)}
            </Btn>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <Avatar size={56} />
            <input ref={photoRef} type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
            <Btn onClick={() => photoRef.current?.click()} className="h-10 rounded-md px-5 text-[14px]">
              Upload New
            </Btn>
            <Btn variant="white" onClick={() => writeExtra({ avatar: "" })} className="h-10 rounded-md px-6 text-[14px]">
              <Trash2 size={14} /> Delete
            </Btn>
          </div>

          <div className="mt-6 grid gap-x-5 gap-y-5 sm:grid-cols-2">
            <div>
              <Label>First Name</Label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={!editing} className={field} />
            </div>
            <div>
              <Label>Last Name</Label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={!editing} className={field} />
            </div>
            <div>
              <Label>E-mail</Label>
              <input value={email} disabled className={cx(field, "text-[var(--a-ink)]")} />
            </div>
            <div>
              <Label>Phone Number</Label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!editing} placeholder="+234…" className={field} />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <div className="relative">
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} disabled={!editing} className={cx(field, "pr-10")} />
                <CalendarDays size={17} className="pointer-events-none absolute right-3 top-3.5 text-[var(--a-ink)]" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label>Location</Label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} disabled={!editing} placeholder="Where you're based" className={field} />
            </div>
            <div className="sm:col-span-2">
              <Label>Biography</Label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={!editing}
                rows={4}
                placeholder="Enter a biography about you"
                className={cx(field, "h-auto resize-none py-3 font-normal leading-6")}
              />
            </div>
          </div>
        </Card>
      </div>
      {toastNode}
    </div>
  );
}
