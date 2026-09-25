import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const unlockSolution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ problemId: z.string().max(100), password: z.string().max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { createHash, timingSafeEqual } = await import("node:crypto");
    const expected = process.env["SOLUTION_PASSWORD"] ?? "mr.durai";
    const a = createHash("sha256").update(data.password).digest();
    const b = createHash("sha256").update(expected).digest();
    if (!timingSafeEqual(a, b)) return { ok: false as const };
    const { getSolution } = await import("./solutions.server");
    const solution = getSolution(data.problemId);
    if (!solution) return { ok: false as const };
    return { ok: true as const, solution };
  });
