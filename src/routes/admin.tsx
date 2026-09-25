import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff, Lock, LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import {
  adminDeleteMessage,
  adminMe,
  adminOverview,
  adminSetRole,
  adminSetUserPassword,
  adminUsers,
  type AdminRegistration,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Portal — IoT SimLab" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Administration portal for IoT SimLab." },
    ],
  }),
  component: AdminPortal,
});

const FIELD =
  "w-full rounded-xl border border-input bg-background/60 py-3 pl-11 pr-11 text-sm outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-cyan focus:bg-background focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--cyan)_18%,transparent)]";

const TABS = [
  { id: "overview", label: "Registrations" },
  { id: "messages", label: "Messages" },
  { id: "access", label: "Access & Roles" },
  { id: "settings", label: "Settings" },
] as const;

type Tab = (typeof TABS)[number]["id"];

function fmtDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

/* --------------------------------- login ---------------------------------- */

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const meFn = useServerFn(adminMe);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const username = form.username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
    const email = `${username}@iotsimlab.admin`;
    const { error } = await supabase.auth.signInWithPassword({ email, password: form.password });
    if (error) {
      setBusy(false);
      toast.error("Invalid username or password.");
      return;
    }
    const me = await meFn();
    if (!me.isAdmin) {
      await supabase.auth.signOut();
      setBusy(false);
      toast.error("This account does not have administrator access.");
      return;
    }
    setBusy(false);
    toast.success("Welcome, administrator.");
    onSuccess();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="glass-card w-full max-w-md p-7 sm:p-9">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <div className="mt-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold">Admin Portal</h1>
            <p className="text-sm text-muted-foreground">Restricted to authorised staff only.</p>
          </div>
        </div>
        <form onSubmit={(e) => void submit(e)} className="mt-8 space-y-4">
          <div className="relative">
            <ShieldCheck className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              required
              type="text"
              className={FIELD}
              placeholder="Username"
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              required
              type={show ? "text" : "password"}
              className={FIELD}
              placeholder="Password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              aria-label="Toggle password"
              onClick={() => setShow((s) => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button
            disabled={busy}
            className="btn-sheen w-full rounded-xl bg-brand-gradient py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Login"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Username and password access only. Activity in this portal is logged.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------ registrations ------------------------------ */

function RegistrationRow({ r }: { r: AdminRegistration }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-surface/60">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left text-sm"
      >
        <span className="font-semibold">{r.teamName || "Unnamed team"}</span>
        <span className="font-mono text-xs text-muted-foreground">{r.teamId}</span>
        <span className="text-muted-foreground">{r.college || "—"}</span>
        <span className="ml-auto text-xs text-muted-foreground">{fmtDate(r.registeredAt)}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-4 py-3 text-sm">
          <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            <p><span className="text-muted-foreground">Department:</span> {r.department || "—"}</p>
            <p><span className="text-muted-foreground">Team size:</span> {r.teamSize}</p>
            <p><span className="text-muted-foreground">Email:</span> {r.email || "—"}</p>
            <p><span className="text-muted-foreground">Phone:</span> {r.phone || "—"}</p>
          </div>
          {r.motto && <p><span className="text-muted-foreground">Motto:</span> {r.motto}</p>}
          {r.about && <p className="text-muted-foreground">{r.about}</p>}
          {r.members.length > 0 && (
            <div>
              <p className="font-medium">Members</p>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                {r.members.map((m, i) => (
                  <li key={i}>
                    {m.name || "—"} — {m.role || "member"} {m.email ? `(${m.email})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- portal --------------------------------- */

function AdminPortal() {
  const qc = useQueryClient();
  const meFn = useServerFn(adminMe);
  const overviewFn = useServerFn(adminOverview);
  const usersFn = useServerFn(adminUsers);
  const setRoleFn = useServerFn(adminSetRole);
  const deleteMsgFn = useServerFn(adminDeleteMessage);
  const setPasswordFn = useServerFn(adminSetUserPassword);

  const [mode, setMode] = useState<"checking" | "login" | "portal">("checking");
  const [tab, setTab] = useState<Tab>("overview");
  const [pw, setPw] = useState({ current: "", next: "" });
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        if (!cancelled) setMode("login");
        return;
      }
      const me = await meFn();
      if (cancelled) return;
      setMode(me.isAdmin ? "portal" : "login");
    })().catch(() => {
      if (!cancelled) setMode("login");
    });
    return () => {
      cancelled = true;
    };
  }, [meFn]);

  const overview = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => overviewFn(),
    enabled: mode === "portal",
  });
  const users = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => usersFn(),
    enabled: mode === "portal",
  });

  if (mode === "checking") {
    return <div className="min-h-screen bg-background" />;
  }
  if (mode === "login") {
    return <AdminLogin onSuccess={() => setMode("portal")} />;
  }

  const logout = async () => {
    await supabase.auth.signOut();
    qc.clear();
    setMode("login");
    setTab("overview");
  };

  const removeMessage = async (id: string) => {
    try {
      await deleteMsgFn({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Message deleted.");
    } catch {
      toast.error("Could not delete the message.");
    }
  };

  const resetPassword = async (userId: string, label: string) => {
    const password = window.prompt(`New password for ${label}:`);
    if (!password) return;
    try {
      await setPasswordFn({ data: { userId, password } });
      toast.success(`Password updated for ${label}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update the password.");
    }
  };

  const changeRole = async (userId: string, role: "admin" | "moderator" | "user", grant: boolean) => {
    try {
      await setRoleFn({ data: { userId, role, grant } });
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(grant ? `Role granted.` : "Role removed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the role.");
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwBusy) return;
    setPwBusy(true);
    const { error } = await supabase.auth.updateUser({
      password: pw.next,
      current_password: pw.current,
    });
    setPwBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPw({ current: "", next: "" });
    toast.success("Password updated.");
  };

  const regs = overview.data?.registrations ?? [];
  const msgs = overview.data?.messages ?? [];
  const acts = overview.data?.activity ?? [];
  const allUsers = users.data?.users ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 lg:px-8">
        <div className="flex items-center gap-3">
          <Logo compact />
          <span className="rounded-full bg-brand-gradient px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => void logout()}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2 lg:px-8">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            data-active={tab === t.id}
            className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-cyan"
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        {tab === "overview" && (
          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="glass-card p-4">
                <p className="text-3xl font-extrabold">{regs.length}</p>
                <p className="text-sm text-muted-foreground">Team registrations</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-3xl font-extrabold">{msgs.length}</p>
                <p className="text-sm text-muted-foreground">Contact messages</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-3xl font-extrabold">{allUsers.length}</p>
                <p className="text-sm text-muted-foreground">Accounts</p>
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold">Team registrations</h2>
              {overview.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : regs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No teams have registered yet.</p>
              ) : (
                <div className="space-y-2">
                  {regs.map((r) => (
                    <RegistrationRow key={r.userId} r={r} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold">Recent participant activity</h2>
              {acts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {acts.slice(0, 20).map((a, i) => (
                    <li key={i} className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-semibold">{a.teamName}</span>
                      <span className="text-muted-foreground">{a.text}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{fmtDate(a.when)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {tab === "messages" && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold">Contact messages</h2>
            {overview.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : msgs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              msgs.map((m) => (
                <div key={m.id} className="glass-card p-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-sm text-muted-foreground">{m.email}</p>
                    <button
                      aria-label="Delete message"
                      onClick={() => void removeMessage(m.id)}
                      className="ml-auto rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {m.subject && <p className="mt-1 text-sm font-medium">{m.subject}</p>}
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{m.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{fmtDate(m.createdAt)}</p>
                </div>
              ))
            )}
          </section>
        )}

        {tab === "access" && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold">Access & roles</h2>
            {users.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : allUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No accounts yet.</p>
            ) : (
              <div className="space-y-2">
                {allUsers.map((u) => (
                  <div key={u.id} className="glass-card flex flex-wrap items-center gap-x-4 gap-y-2 p-4 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{u.username || u.email}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {u.email} · last sign-in {fmtDate(u.lastSignInAt ?? "")}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(["admin", "moderator"] as const).map((role) => {
                        const has = u.roles.includes(role);
                        return (
                          <button
                            key={role}
                            onClick={() => void changeRole(u.id, role, !has)}
                            className={
                              "rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors " +
                              (has
                                ? "bg-brand-gradient text-primary-foreground hover:opacity-90"
                                : "border border-border text-muted-foreground hover:text-foreground")
                            }
                          >
                            {has ? `${role} ✓` : `+ ${role}`}
                          </button>
                        );
                      })}
                      {u.roles.length === 0 && (
                        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                          participant
                        </span>
                      )}
                      <button
                        onClick={() => void resetPassword(u.id, u.username || u.email)}
                        className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                      >
                        Set password
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "settings" && (
          <section className="max-w-md space-y-4">
            <h2 className="text-lg font-bold">Change admin password</h2>
            <form onSubmit={(e) => void changePassword(e)} className="glass-card space-y-4 p-6">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  required
                  type="password"
                  className={FIELD}
                  placeholder="Current password"
                  autoComplete="current-password"
                  value={pw.current}
                  onChange={(e) => setPw({ ...pw, current: e.target.value })}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  required
                  minLength={8}
                  type="password"
                  className={FIELD}
                  placeholder="New password (min 8 characters)"
                  autoComplete="new-password"
                  value={pw.next}
                  onChange={(e) => setPw({ ...pw, next: e.target.value })}
                />
              </div>
              <button
                disabled={pwBusy}
                className="btn-sheen w-full rounded-xl bg-brand-gradient py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {pwBusy ? "Updating…" : "Update password"}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
