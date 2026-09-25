import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { sendContactMessage, useStore } from "@/lib/store";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Support — IoT SimLab" },
      {
        name: "description",
        content:
          "Contact the IoT SimLab organising team for help with registration, simulation issues or submission queries.",
      },
      { property: "og:title", content: "Contact Support — IoT SimLab" },
      { property: "og:description", content: "Reach the IoT SimLab organising team." },
    ],
  }),
  component: ContactPage,
});

const FIELD =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan";

function ContactPage() {
  const { update } = useStore();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      await sendContactMessage(form);
      toast.success("Message sent — we'll reply within 24 hours.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      toast.error("Could not send the message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="hero-glow border-b border-border py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-4xl font-extrabold sm:text-5xl">
            Contact <span className="text-gradient">Support</span>
          </h1>
          <p className="mt-5 text-muted-foreground">
            Stuck somewhere? Send us a message and the organising team will get back to you.
          </p>
        </div>
      </section>
      <section className="py-14">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 lg:grid-cols-[1fr_1.4fr] lg:px-8">
          <div className="panel space-y-6 p-7">
            {[
              { icon: Mail, label: "Email", value: "support@iotsimlab.com" },
              { icon: Phone, label: "Phone", value: "+91 98765 43210" },
              { icon: MapPin, label: "Venue", value: "Innovation Center, Block C" },
            ].map((i) => (
              <div key={i.label} className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient">
                  <i.icon className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{i.label}</p>
                  <p className="mt-1 font-medium">{i.value}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={submit} className="panel space-y-4 p-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                required
                className={FIELD}
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                required
                type="email"
                className={FIELD}
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <input
              required
              className={FIELD}
              placeholder="Subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
            <textarea
              required
              rows={6}
              className={FIELD}
              placeholder="How can we help?"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
            <button className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-6 py-3 text-sm font-semibold text-primary-foreground">
              Send Message <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
