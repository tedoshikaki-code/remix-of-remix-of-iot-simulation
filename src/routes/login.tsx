import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Cpu, Eye, EyeOff, Lock, Mail, ShieldCheck, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import authImg from "@/assets/auth-hero.jpg";
import { AuthParticles } from "@/components/AuthParticles";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { refreshStore, useStore } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — IoT SimLab" },
      {
        name: "description",
        content: "Sign in to your IoT SimLab account to continue your simulation challenge.",
      },
      { property: "og:title", content: "Login — IoT SimLab" },
      { property: "og:description", content: "Login to your IoT journey." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

const FIELD =
  "w-full rounded-xl border border-input bg-background/60 py-3 pl-11 pr-11 text-sm outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-cyan focus:bg-background focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--cyan)_18%,transparent)]";

const HIGHLIGHTS = [
  { icon: Cpu, title: "Virtual Hardware", text: "ESP32, sensors and displays ready to wire." },
  { icon: Zap, title: "Instant Simulation", text: "Run and debug without any installation." },
  { icon: ShieldCheck, title: "Progress Saved", text: "Your circuits and scores sync to your account." },
];

/** Mouse-driven parallax offsets, normalised to -1..1 on both axes. */
function useParallax<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [p, setP] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      setP({
        x: ((e.clientX - r.left) / r.width - 0.5) * 2,
        y: ((e.clientY - r.top) / r.height - 0.5) * 2,
      });
    };
    const onLeave = () => setP({ x: 0, y: 0 });
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return { ref, p };
}

function LoginPage() {
  const navigate = useNavigate();
  const { logActivity } = useStore();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const { ref: stageRef, p } = useParallax<HTMLDivElement>();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });
    if (error) {
      setBusy(false);
      toast.error("Invalid email or password.");
      return;
    }
    const state = await refreshStore();
    setBusy(false);
    const name = state.team?.teamName ?? "participant";
    logActivity(`${name} signed in`);
    toast.success(`Welcome back, ${name}!`);
    navigate({ to: "/app" });
  };


  return (
    <div ref={stageRef} className="relative grid min-h-screen overflow-hidden lg:grid-cols-2">
      {/* Ambient background: orbs + particle field */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="animate-auth-orb absolute -left-24 top-[-10%] h-[26rem] w-[26rem] rounded-full bg-blue/25 blur-[110px]"
          style={{ transform: `translate3d(${p.x * -26}px, ${p.y * -18}px, 0)` }}
        />
        <div
          className="animate-auth-orb absolute -right-20 bottom-[-15%] h-[30rem] w-[30rem] rounded-full bg-violet/25 blur-[120px]"
          style={{ animationDelay: "-6s", transform: `translate3d(${p.x * 30}px, ${p.y * 22}px, 0)` }}
        />
        <div className="circuit-bg absolute inset-0 opacity-40" />
        <AuthParticles className="absolute inset-0 h-full w-full" />
      </div>

      {/* Left */}
      <div className="hero-glow relative hidden flex-col justify-between border-r border-border/70 p-10 lg:flex">
        <div className="animate-auth-rise">
          <Logo />
        </div>
        <div>
          <div
            className="animate-auth-rise w-full max-w-md"
            style={{ animationDelay: "80ms", transform: `perspective(1100px) rotateY(${p.x * -6}deg) rotateX(${p.y * 5}deg) translate3d(${p.x * 12}px, ${p.y * 10}px, 0)`, transition: "transform 220ms ease-out" }}
          >
            <img
              src={authImg}
              width={1024}
              height={1280}
              alt="IoT hardware kit with ESP32 board, breadboard and sensors"
              className="animate-auth-float w-full rounded-3xl border border-border/70 object-cover shadow-[var(--shadow-glow)]"
            />
          </div>
          <h2 className="animate-auth-rise mt-8 text-3xl font-extrabold" style={{ animationDelay: "160ms" }}>
            Login to Your <span className="text-gradient">IoT Journey</span>
          </h2>
          <div className="mt-6 space-y-3">
            {HIGHLIGHTS.map((h, i) => (
              <div
                key={h.title}
                className="animate-auth-rise glass-card flex items-start gap-3 p-3 transition-transform duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${220 + i * 90}ms` }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-gradient">
                  <h.icon className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{h.title}</p>
                  <p className="text-sm text-muted-foreground">{h.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">© 2025 IoT SimLab</p>
      </div>

      {/* Right */}
      <div className="relative flex flex-col justify-center px-5 py-12 sm:px-12">
        <div className="mb-8 flex items-center justify-between lg:hidden">
          <Logo />
          <ThemeToggle />
        </div>
        <div
          className="animate-auth-rise glass-card mx-auto w-full max-w-md p-7 sm:p-9"
          style={{
            animationDelay: "120ms",
            transform: `translate3d(${p.x * -8}px, ${p.y * -6}px, 0)`,
            transition: "transform 260ms ease-out",
          }}
        >
          <div className="hidden justify-end lg:flex">
            <ThemeToggle />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your credentials to access the dashboard.
          </p>

          <form onSubmit={(e) => void submit(e)} className="mt-8 space-y-4">
            <div className="animate-auth-rise relative" style={{ animationDelay: "220ms" }}>
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                required
                type="email"
                className={FIELD}
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="animate-auth-rise relative" style={{ animationDelay: "290ms" }}>
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                required
                type={show ? "text" : "password"}
                className={FIELD}
                placeholder="Password"
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
            <div className="animate-auth-rise flex items-center justify-between text-sm" style={{ animationDelay: "350ms" }}>
              <label className="inline-flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" className="accent-[var(--blue)]" /> Remember me
              </label>
              <Link to="/contact" className="text-cyan hover:underline">
                Forgot password?
              </Link>
            </div>
            <button
              className="btn-sheen animate-auth-rise w-full rounded-xl bg-brand-gradient py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0"
              style={{ animationDelay: "410ms" }}
            >
              Login
            </button>
          </form>

          <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={() => void google()}
            className="animate-auth-rise flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface/70 py-3.5 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent"
            style={{ animationDelay: "470ms" }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.6c-.1 1.1-.9 2.8-2.5 3.9l3.8 2.9c2.2-2 3.6-5 3.6-8.7z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.2 0-5.9-2.1-6.9-5l-4 3.1C3.2 21.3 7.3 24 12 24z"
              />
              <path fill="#FBBC05" d="M5.1 14.4a7.4 7.4 0 0 1 0-4.8l-4-3.1a12 12 0 0 0 0 11z" />
              <path
                fill="#EA4335"
                d="M12 4.7c2.3 0 3.8 1 4.7 1.8l3.4-3.3C17.9 1.2 15.2 0 12 0 7.3 0 3.2 2.7 1.1 6.5l4 3.1c1-2.9 3.7-4.9 6.9-4.9z"
              />
            </svg>
            Login with Google
          </button>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/register" className="font-semibold text-cyan hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
