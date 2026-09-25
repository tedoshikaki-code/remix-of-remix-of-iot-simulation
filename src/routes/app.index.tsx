import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, CheckCircle2, CircuitBoard, Clock, ListChecks, Trophy } from "lucide-react";
import {
  ANNOUNCEMENTS,
  EVENT_END,
  PROBLEMS,
  computeStats,
  timeAgo,
  useStore,
} from "@/lib/store";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Team Dashboard — IoT SimLab" },
      { name: "description", content: "Track your team's progress, submissions and rank." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function useCountdown() {
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(EVENT_END).getTime() - Date.now());
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return left;
}

function Dashboard() {
  const { state } = useStore();
  const stats = computeStats(state);
  const t = useCountdown();
  const team = state.team;

  const fetchBoard = useServerFn(getLeaderboard);
  const boardQuery = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => fetchBoard(),
    refetchInterval: 15000,
  });
  const board = boardQuery.data?.rows ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="panel p-7">
          <h1 className="text-2xl font-bold">
            {team?.teamName} <span className="text-gradient">Progress</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {stats.attempted} of {PROBLEMS.length} problems attempted
          </p>
          <div className="mt-6 flex items-end justify-between">
            <p className="font-display text-5xl font-bold">{stats.completion}%</p>
            <p className="text-sm text-muted-foreground">completed</p>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full bg-brand-gradient" style={{ width: `${stats.completion}%` }} />
          </div>
        </div>
        <div className="panel p-7">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Clock className="h-4 w-4 text-cyan" /> Event Countdown
          </h2>
          <div className="mt-6 grid grid-cols-4 gap-3 text-center">
            {[
              ["Days", t.d],
              ["Hours", t.h],
              ["Mins", t.m],
              ["Secs", t.s],
            ].map(([label, v]) => (
              <div key={label as string} className="rounded-xl border border-border bg-surface-2 p-3">
                <p className="font-mono text-2xl font-bold text-cyan">
                  {String(v).padStart(2, "0")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{label as string}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: ListChecks, label: "Problems Attempted", value: `${stats.attempted}/${PROBLEMS.length}`, to: "/app/problems" as const },
          { icon: CircuitBoard, label: "Simulations Run", value: String(stats.simsRun), to: "/app/builder" as const },
          { icon: CheckCircle2, label: "Submissions", value: String(stats.submitted), to: "/app/problems" as const },
          { icon: Trophy, label: "Average Score", value: `${stats.score}`, to: "/app/leaderboard" as const },
        ].map((c) => (
          <Link key={c.label} to={c.to} className="panel p-6 transition-transform hover:-translate-y-1">
            <c.icon className="h-6 w-6 text-cyan" />
            <p className="mt-4 font-display text-2xl font-bold">{c.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="panel p-6">
          <h2 className="text-base font-semibold">Recent Activity</h2>
          <ul className="mt-4 space-y-3">
            {state.activity.length === 0 && (
              <li className="text-sm text-muted-foreground">No activity yet — open a problem to begin.</li>
            )}
            {state.activity.slice(0, 6).map((a) => (
              <li key={a.id} className="text-sm">
                <p>{a.text}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(a.when)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Bell className="h-4 w-4 text-cyan" /> Announcements
          </h2>
          <ul className="mt-4 space-y-4">
            {ANNOUNCEMENTS.map((a) => (
              <li key={a.id}>
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-sm text-muted-foreground">{a.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{a.date}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Trophy className="h-4 w-4 text-cyan" /> Leaderboard
          </h2>
          <ul className="mt-4 space-y-3">
            {boardQuery.isLoading && (
              <li className="text-sm text-muted-foreground">Loading…</li>
            )}
            {!boardQuery.isLoading && board.length === 0 && (
              <li className="text-sm text-muted-foreground">No registered teams yet.</li>
            )}
            {board.slice(0, 5).map((r, i) => (
              <li key={r.userId} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">#{i + 1}</span>
                  {r.team}
                </span>
                <span className="font-mono text-cyan">{r.score}</span>
              </li>
            ))}
          </ul>
          <Link to="/app/leaderboard" className="mt-5 inline-block text-sm font-semibold text-cyan hover:underline">
            View full leaderboard
          </Link>
        </section>
      </div>
    </div>
  );
}
