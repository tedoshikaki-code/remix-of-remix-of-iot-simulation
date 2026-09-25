import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { makeTeamId, refreshStore, useStore, type Team } from "@/lib/store";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — IoT SimLab" },
      {
        name: "description",
        content:
          "Join IoT SimLab as an individual participant — create your account in two quick steps.",
      },
      { property: "og:title", content: "Register — IoT SimLab" },
      { property: "og:description", content: "Join IoT SimLab as an individual participant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterPage,
});

const FIELD =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan";
const LABEL = "mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

const STEPS = ["Your Info", "Verify & Submit"];

function RegisterPage() {
  const navigate = useNavigate();
  const { update, logActivity } = useStore();
  const [step, setStep] = useState(0);
  const [info, setInfo] = useState({
    name: "",
    college: "",
    department: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);

  const next = (): void => {
    if (step === 0) {
      const required = ["name", "college", "department", "email", "phone", "password"] as const;
      if (required.some((k) => !info[k].trim())) {
        toast.error("Please fill all fields.");
        return;
      }
      if (info.password !== info.confirm) {
        toast.error("Passwords do not match.");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 1));
  };

  const submit = async (): Promise<void> => {
    if (!agree) {
      toast.error("Please accept the rules to continue.");
      return;
    }
    if (busy) return;
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: info.email.trim(),
      password: info.password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      setBusy(false);
      toast.success("Account created. Check your email to confirm, then sign in.");
      navigate({ to: "/login" });
      return;
    }

    const team: Team = {
      teamName: info.name,
      teamId: makeTeamId(info.name),
      teamSize: "1",
      college: info.college,
      department: info.department,
      email: info.email,
      phone: info.phone,
      password: "",
      members: [{ name: info.name, role: "Participant", email: info.email }],
      about: "",
      motto: "",
      registeredAt: new Date().toISOString(),
    };
    await refreshStore();
    update((s) => ({ ...s, team }));
    logActivity(`${team.teamName} registered for the challenge`);
    setBusy(false);
    toast.success(`Account created! Your participant ID is ${team.teamId}`);
    navigate({ to: "/app" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-[72px] max-w-5xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login" className="text-sm font-semibold text-cyan hover:underline">
              Login
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-center text-3xl font-extrabold sm:text-4xl">
          Join <span className="text-gradient">IoT SimLab</span>
        </h1>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Create your individual participant account in two quick steps.
        </p>

        {/* Stepper */}
        <div className="mt-10 flex items-center">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                    i <= step
                      ? "bg-brand-gradient text-primary-foreground"
                      : "border border-border bg-surface text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={`hidden text-sm font-medium sm:block ${i <= step ? "" : "text-muted-foreground"}`}
                >
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  className={`mx-4 h-px flex-1 ${i < step ? "bg-brand-gradient" : "bg-border"}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="panel mt-8 p-7">
          {step === 0 && (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={LABEL}>Full Name</label>
                <input
                  className={FIELD}
                  placeholder="e.g. Aarav Sharma"
                  value={info.name}
                  onChange={(e) => setInfo({ ...info, name: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>College / Institution</label>
                <input
                  className={FIELD}
                  placeholder="College name"
                  value={info.college}
                  onChange={(e) => setInfo({ ...info, college: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL}>Department</label>
                <input
                  className={FIELD}
                  placeholder="e.g. Electronics"
                  value={info.department}
                  onChange={(e) => setInfo({ ...info, department: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL}>Phone</label>
                <input
                  className={FIELD}
                  placeholder="+91 00000 00000"
                  value={info.phone}
                  onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>Email</label>
                <input
                  type="email"
                  className={FIELD}
                  placeholder="you@college.edu"
                  value={info.email}
                  onChange={(e) => setInfo({ ...info, email: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL}>Password</label>
                <input
                  type="password"
                  className={FIELD}
                  placeholder="Minimum 6 characters"
                  value={info.password}
                  onChange={(e) => setInfo({ ...info, password: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL}>Confirm Password</label>
                <input
                  type="password"
                  className={FIELD}
                  placeholder="Repeat password"
                  value={info.confirm}
                  onChange={(e) => setInfo({ ...info, confirm: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Name", info.name],
                  ["College", info.college],
                  ["Department", info.department],
                  ["Email", info.email],
                  ["Phone", info.phone],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-border bg-surface-2 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{k}</p>
                    <p className="mt-1 text-sm font-medium">{v}</p>
                  </div>
                ))}
              </div>
              <label className="flex items-start gap-3 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-1 accent-[var(--blue)]"
                />
                <span>
                  I confirm the details are correct and I accept the{" "}
                  <Link to="/rules" className="text-cyan hover:underline">
                    rules & guidelines
                  </Link>
                  .
                </span>
              </label>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            {step < 1 ? (
              <button
                onClick={next}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => void submit()}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {busy ? "Creating account…" : "Submit Registration"} <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
