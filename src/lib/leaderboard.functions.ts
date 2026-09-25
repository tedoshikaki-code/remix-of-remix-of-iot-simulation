import { createServerFn } from "@tanstack/react-start";

export type LeaderboardRow = { userId: string; team: string; score: number; solved: number };

type Sub = { score?: number };

/** Public, read-only: team names + scores computed from saved submissions. */
export const getLeaderboard = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [profiles, states] = await Promise.all([
    supabaseAdmin.from("profiles").select("user_id, team_name"),
    supabaseAdmin.from("participant_state").select("user_id, data"),
  ]);
  if (profiles.error) throw new Error(profiles.error.message);
  if (states.error) throw new Error(states.error.message);
  const stateBy = new Map((states.data ?? []).map((s) => [s.user_id, s.data]));
  const rows: LeaderboardRow[] = (profiles.data ?? [])
    .filter((p) => p.team_name.trim() !== "")
    .map((p) => {
      const subs = ((stateBy.get(p.user_id) as { submissions?: Sub[] } | null)?.submissions ?? []);
      const total = subs.reduce((n, s) => n + (Number(s?.score) || 0), 0);
      const score = subs.length ? Math.round((total / subs.length) * 10) / 10 : 0;
      return {
        userId: p.user_id,
        team: p.team_name,
        score,
        solved: subs.filter((s) => (Number(s?.score) || 0) >= 60).length,
      };
    })
    .sort((a, b) => b.score - a.score || b.solved - a.solved);
  return { rows };
});
