import { createFileRoute } from "@tanstack/react-router";
import { computeStats, useStore } from "@/lib/store";
...
  const rows = [
    { team: state.team?.teamName ?? "Your Team", score: stats.score, solved: stats.solved },
  ].sort((a, b) => b.score - a.score);

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
            {rows.map((r, i) => {
              const you = r.team === (state.team?.teamName ?? "Your Team");
              return (
                <tr
                  key={r.team}
                  className={`border-t border-border ${you ? "bg-cyan/5 text-cyan" : ""}`}
                >
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
