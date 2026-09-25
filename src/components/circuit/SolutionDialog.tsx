import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, KeyRound, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { unlockSolution } from "@/lib/solutions.functions";
import type { Solution } from "@/lib/solutions.server";

export function SolutionButton({ problemId, onUseCode }: { problemId: string; onUseCode: (code: string) => void }) {
  const unlock = useServerFn(unlockSolution);
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [sol, setSol] = useState<Solution | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await unlock({ data: { problemId, password: pw } });
      if (r.ok) setSol(r.solution);
      else toast.error("Incorrect password.");
    } catch {
      toast.error("Please sign in to view the solution.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold transition-colors hover:border-cyan hover:text-cyan"
      >
        <KeyRound className="h-4 w-4" /> Show circuit & code
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="glass-card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Circuit & code</h2>
              <button aria-label="Close" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            {!sol ? (
              <form onSubmit={(e) => void submit(e)} className="mt-5 space-y-3">
                <p className="text-sm text-muted-foreground">Enter the password to see the circuit and code for this problem.</p>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    autoFocus
                    required
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder="Password"
                    className="w-full rounded-xl border border-input bg-background/60 py-3 pl-10 pr-3 text-sm outline-none focus:border-cyan"
                  />
                </div>
                <button disabled={busy} className="w-full rounded-xl bg-brand-gradient py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                  {busy ? "Checking…" : "Unlock"}
                </button>
              </form>
            ) : (
              <div className="mt-5 space-y-6 text-sm">
                <section>
                  <h3 className="mb-2 font-semibold text-cyan">Why this problem matters</h3>
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground">{sol.need.map((n) => <li key={n}>{n}</li>)}</ul>
                </section>
                <section>
                  <h3 className="mb-2 font-semibold text-cyan">Expected outcome</h3>
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground">{sol.outcome.map((n) => <li key={n}>{n}</li>)}</ul>
                </section>
                <section>
                  <h3 className="mb-2 font-semibold text-cyan">How to build it</h3>
                  <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">{sol.steps.map((n) => <li key={n}>{n}</li>)}</ol>
                </section>
                <section>
                  <h3 className="mb-2 font-semibold text-cyan">Circuit connections (ESP32)</h3>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-left">
                      <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                        <tr><th className="px-3 py-2">Part</th><th className="px-3 py-2">Pin</th><th className="px-3 py-2">Connect to</th><th className="px-3 py-2">Note</th></tr>
                      </thead>
                      <tbody>
                        {sol.wiring.map((w, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="px-3 py-2">{w.part}</td><td className="px-3 py-2 font-mono">{w.pin}</td>
                            <td className="px-3 py-2 font-mono text-cyan">{w.board}</td><td className="px-3 py-2 text-muted-foreground">{w.note ?? ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-cyan">Code</h3>
                    <div className="flex gap-2">
                      <button onClick={() => { void navigator.clipboard.writeText(sol.code); toast.success("Code copied"); }} className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs hover:text-cyan">
                        <Copy className="h-3 w-3" /> Copy
                      </button>
                      <button onClick={() => { onUseCode(sol.code); toast.success("Code loaded into editor"); setOpen(false); }} className="rounded-lg bg-brand-gradient px-2 py-1 text-xs font-semibold text-primary-foreground">
                        Use in editor
                      </button>
                    </div>
                  </div>
                  <pre className="max-h-96 overflow-auto rounded-xl border border-border bg-background/70 p-4 font-mono text-xs leading-relaxed">{sol.code}</pre>
                </section>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
