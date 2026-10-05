/*
  NEWSLETTER — Lara writes a message here and sends it to everyone who has
  subscribed (footer sign-up, or the "Email me with news and offers" tick-box
  at checkout). People who never subscribed, or who unsubscribed, are never
  included — the server only picks subscribers marked "subscribed".

  Tip: use "Send me a test" first to see exactly how it will look.
*/
import { useEffect, useState } from "react";
import { adminSession, getCampaigns, getSubscribers, sendNewsletter } from "../../api";
import { useAdmin } from "../AdminData";
import { Btn, Card, CardHead, useToast } from "../ui";

const input =
  "w-full rounded-md border border-[#e1e4e8] bg-[var(--a-bg)] px-4 text-[15px] text-[var(--a-ink)] outline-none focus:border-[var(--a-maroon)]";

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const DEMO = {
  subscribers: [
    { _id: "d1", email: "ada@example.com", subscribed: true, source: "footer", subscribedAt: new Date().toISOString() },
    { _id: "d2", email: "tola@example.com", subscribed: true, source: "checkout", subscribedAt: new Date().toISOString() },
    { _id: "d3", email: "old@example.com", subscribed: false, source: "footer", subscribedAt: new Date().toISOString() },
  ],
  campaigns: [],
};

export default function NewsletterPage() {
  const { demo } = useAdmin();
  const [showToast, toastNode] = useToast();
  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState("");
  const [showList, setShowList] = useState(false);
  // TIP: the test copy goes to this address. It starts as the email you signed
  // in with, and you can type any other address.
  const [testEmail, setTestEmail] = useState(() => adminSession.profile()?.email || "");

  const active = subscribers.filter((s) => s.subscribed);

  useEffect(() => {
    if (demo) {
      setSubscribers(DEMO.subscribers);
      setCampaigns(DEMO.campaigns);
      setLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all([getSubscribers(), getCampaigns()])
      .then(([subs, camps]) => {
        if (cancelled) return;
        setSubscribers(subs.subscribers);
        setCampaigns(camps);
      })
      .catch((err) => !cancelled && setLoadError(err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [demo]);

  const canSend = subject.trim() && body.trim();
  const errMsg = (err) => (err.message === "SESSION_EXPIRED" ? "Please sign in again." : err.message);

  async function sendTest() {
    if (demo) return showToast("Sample data, nothing is sent in demo mode.");
    setBusy("test");
    try {
      const result = await sendNewsletter(subject.trim(), body.trim(), true, testEmail.trim());
      showToast(`Test sent to ${result.to || "your email"}.`);
    } catch (err) {
      showToast(errMsg(err), "error");
    } finally {
      setBusy("");
    }
  }

  async function sendToAll() {
    if (demo) return showToast("Sample data, nothing is sent in demo mode.");
    if (!window.confirm(`Send this to ${active.length} subscriber${active.length === 1 ? "" : "s"}? This can't be undone.`)) return;
    setBusy("all");
    try {
      const result = await sendNewsletter(subject.trim(), body.trim());
      setCampaigns((c) => [result.campaign, ...c]);
      setSubject("");
      setBody("");
      showToast(
        result.failed
          ? `Sent to ${result.sent}. ${result.failed} could not be delivered.`
          : `Sent to ${result.sent} subscriber${result.sent === 1 ? "" : "s"}.`
      );
    } catch (err) {
      showToast(errMsg(err), "error");
    } finally {
      setBusy("");
    }
  }

  if (loading) return <p className="py-24 text-center text-[16px] text-[var(--a-muted)]">Loading newsletter…</p>;
  if (loadError) {
    return (
      <p role="alert" className="rounded-md bg-[#fff1f2] px-4 py-3 text-[14px] text-[var(--a-red)]">
        {loadError}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <CardHead title="Newsletter" />
        <p className="mt-2 text-[14px] leading-5 text-[var(--a-muted)]">
          Write a message and it goes to everyone who is subscribed. People who haven't subscribed never receive it, and every
          email has an unsubscribe link.
        </p>
        <p className="mt-4 text-[15px] text-[var(--a-ink)]">
          <b>{active.length}</b> active subscriber{active.length === 1 ? "" : "s"} · {subscribers.length - active.length}{" "}
          unsubscribed
        </p>
      </Card>

      <Card className="p-6">
        <CardHead title="Write a message" />
        <label className="mt-4 block text-[14px] font-bold text-[var(--a-ink)]" htmlFor="nl-subject">
          Subject
        </label>
        <input id="nl-subject" value={subject} maxLength={150} onChange={(e) => setSubject(e.target.value)} className={`mt-2 h-12 ${input}`} />

        <label className="mt-4 block text-[14px] font-bold text-[var(--a-ink)]" htmlFor="nl-body">
          Message
        </label>
        <textarea
          id="nl-body"
          rows={10}
          value={body}
          maxLength={10000}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write to your subscribers…"
          className={`mt-2 py-3 ${input}`}
        />

        <label className="mt-4 block text-[14px] font-bold text-[var(--a-ink)]" htmlFor="nl-test-email">
          Send test to
        </label>
        <input
          id="nl-test-email"
          type="email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          placeholder="you@example.com"
          className={`mt-2 h-12 max-w-[420px] ${input}`}
        />
        <p className="mt-1 text-[13px] text-[var(--a-muted)]">"Send me a test" emails only this address. Subscribers get nothing until you press Send.</p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Btn variant="outline" className="h-11 rounded-md px-5" disabled={!canSend || busy !== ""} onClick={sendTest}>
            {busy === "test" ? "Sending…" : "Send me a test"}
          </Btn>
          <Btn className="h-11 rounded-md px-5" disabled={!canSend || busy !== "" || active.length === 0} onClick={sendToAll}>
            {busy === "all" ? "Sending…" : `Send to ${active.length} subscriber${active.length === 1 ? "" : "s"}`}
          </Btn>
        </div>
      </Card>

      <Card className="p-6">
        <CardHead title="Sent newsletters" />
        {campaigns.length === 0 ? (
          <p className="mt-3 text-[15px] text-[var(--a-muted)]">Nothing sent yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[#eef0f2]">
            {campaigns.map((c) => (
              <li key={c._id} className="py-3">
                <p className="text-[15px] font-bold text-[var(--a-ink)]">{c.subject}</p>
                <p className="text-[13px] text-[var(--a-muted)]">
                  {fmtDate(c.createdAt)} · sent to {c.recipientCount}
                  {c.failedCount ? ` · ${c.failedCount} failed` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <CardHead title="Subscribers" />
          <button type="button" onClick={() => setShowList((v) => !v)} className="text-[14px] font-bold text-[var(--a-maroon)] underline">
            {showList ? "Hide" : "Show"}
          </button>
        </div>
        {showList &&
          (subscribers.length === 0 ? (
            <p className="mt-3 text-[15px] text-[var(--a-muted)]">No subscribers yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[#eef0f2]">
              {subscribers.map((s) => (
                <li key={s._id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[14px]">
                  <span className="text-[var(--a-ink)]">{s.email}</span>
                  <span className="text-[var(--a-muted)]">
                    {s.subscribed ? "Subscribed" : "Unsubscribed"} · via {s.source} · {fmtDate(s.subscribedAt)}
                  </span>
                </li>
              ))}
            </ul>
          ))}
      </Card>
      {toastNode}
    </div>
  );
}
