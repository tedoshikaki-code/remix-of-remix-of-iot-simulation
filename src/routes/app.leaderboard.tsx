import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getLeaderboard } from "@/lib/leaderboard.functions";

export const Route = createFileRoute("/app/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — IoT SimLab" },
      { name: "description", content: "Team rankings for the IoT Simulation Challenge." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Leaderboard,
});

function Leaderboard() {
  const fetchBoard = useServerFn(getLeaderboard);
  const board = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => fetchBoard(),
    refetchInterval: 15000,
  });
  const { data: me } = useQuery({
    queryKey: ["leaderboard-me"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
  });
  useEffect(() => {
    void board.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const rows = board.data?.rows ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold">
        Live <span className="text-gradient">Leaderboard</span>
      </h1>
      <div className="panel mt-8 overflow-x-auto p-2">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Solved</th>
              <th className="px-4 py-3 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {board.isLoading && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {!board.isLoading && rows.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No registered teams yet.</td></tr>
            )}
            {rows.map((r, i) => {
              const you = r.userId === me;
              return (
                <tr key={r.userId} className={`border-t border-border ${you ? "bg-cyan/5 text-cyan" : ""}`}>
                  <td className="px-4 py-3 font-mono">#{i + 1}</td>
                  <td className="px-4 py-3 font-medium">
                    {r.team} {you && <span className="text-xs">(you)</span>}
                  </td>
                  <td className="px-4 py-3">{r.solved}</td>
                  <td className="px-4 py-3 text-right font-mono">{r.score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
