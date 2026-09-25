import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AppRole = "admin" | "moderator" | "user";


/* --------------------------------- who am I -------------------------------- */

export const adminMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return {
      userId: context.userId,
      email: typeof context.claims.email === "string" ? context.claims.email : null,
      isAdmin: !roleError && !!isAdmin,
    };
  });

/* --------------------------------- overview -------------------------------- */

export type AdminMember = { name: string; role: string; email: string };

export type AdminRegistration = {
  userId: string;
  teamName: string;
  teamId: string;
  teamSize: string;
  college: string;
  department: string;
  email: string;
  phone: string;
  about: string;
  motto: string;
  registeredAt: string;
  members: AdminMember[];
};

export type AdminMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
};

export type AdminActivity = {
  userId: string;
  teamName: string;
  text: string;
  when: string;
};

export type AdminOverview = {
  registrations: AdminRegistration[];
  messages: AdminMessage[];
  activity: AdminActivity[];
};

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError || !isAdmin) throw new Error("Forbidden: administrator access required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [profiles, messages, states] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").order("registered_at", { ascending: false }),
      supabaseAdmin
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("participant_state").select("user_id, data"),
    ]);

    if (profiles.error) throw new Error(profiles.error.message);
    if (messages.error) throw new Error(messages.error.message);
    if (states.error) throw new Error(states.error.message);

    const registrations: AdminRegistration[] = (profiles.data ?? []).map((p) => ({
      userId: p.user_id,
      teamName: p.team_name,
      teamId: p.team_id,
      teamSize: p.team_size,
      college: p.college,
      department: p.department,
      email: p.email,
      phone: p.phone,
      about: p.about,
      motto: p.motto,
      registeredAt: p.registered_at,
      members: Array.isArray(p.members)
        ? (p.members as Record<string, unknown>[]).map((m) => ({
            name: String(m?.["name"] ?? ""),
            role: String(m?.["role"] ?? ""),
            email: String(m?.["email"] ?? ""),
          }))
        : [],
    }));

    const contactMessages: AdminMessage[] = (messages.data ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      subject: m.subject,
      message: m.message,
      createdAt: m.created_at,
    }));

    const teamByUser = new Map((profiles.data ?? []).map((p) => [p.user_id, p.team_name]));
    type Act = { id?: string; text?: string; when?: string };
    const activity: AdminActivity[] = (states.data ?? [])
      .flatMap((s) => {
        const acts = (s.data as { activity?: Act[] } | null)?.activity ?? [];
        return acts.map((a) => ({
          userId: s.user_id,
          teamName: teamByUser.get(s.user_id) ?? "Unknown team",
          text: String(a?.text ?? ""),
          when: String(a?.when ?? ""),
        }));
      })
      .sort((a, b) => b.when.localeCompare(a.when))
      .slice(0, 60);

    return { registrations, messages: contactMessages, activity };
  });

/* ------------------------------- users + roles ------------------------------ */

export type AdminUser = {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  lastSignInAt: string | null;
  confirmed: boolean;
  roles: AppRole[];
};

export const adminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError || !isAdmin) throw new Error("Forbidden: administrator access required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [usersRes, rolesRes] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ perPage: 500 }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);
    if (usersRes.error) throw new Error(usersRes.error.message);
    if (rolesRes.error) throw new Error(rolesRes.error.message);

    const rolesByUser = new Map<string, AppRole[]>();
    for (const row of rolesRes.data ?? []) {
      const list = rolesByUser.get(row.user_id) ?? [];
      list.push(row.role);
      rolesByUser.set(row.user_id, list);
    }

    const users: AdminUser[] = (usersRes.data.users ?? []).map((u) => ({
      id: u.id,
      email: u.email ?? "",
      username:
        typeof u.user_metadata?.["username"] === "string"
          ? (u.user_metadata["username"] as string)
          : (u.email?.split("@")[0] ?? ""),
      createdAt: u.created_at ?? "",
      lastSignInAt: u.last_sign_in_at ?? null,
      confirmed: !!u.email_confirmed_at,
      roles: rolesByUser.get(u.id) ?? [],
    }));

    return { users };
  });

const setRoleInput = z.object({
  userId: z.string().min(1),
  role: z.enum(["admin", "moderator", "user"]),
  grant: z.boolean(),
});

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => setRoleInput.parse(data))
  .handler(async ({ context, data }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError || !isAdmin) throw new Error("Forbidden: administrator access required");
    if (data.userId === context.userId && data.role === "admin" && !data.grant) {
      throw new Error("You cannot remove your own administrator role.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/* --------------------------------- messages --------------------------------- */

const deleteMessageInput = z.object({ id: z.string().min(1) });

export const adminDeleteMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => deleteMessageInput.parse(data))
  .handler(async ({ context, data }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError || !isAdmin) throw new Error("Forbidden: administrator access required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------ user passwords ------------------------------ */

const setPasswordInput = z.object({
  userId: z.string().min(1),
  password: z.string().min(1).max(200),
});

export const adminSetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => setPasswordInput.parse(data))
  .handler(async ({ context, data }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError || !isAdmin) throw new Error("Forbidden: administrator access required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
