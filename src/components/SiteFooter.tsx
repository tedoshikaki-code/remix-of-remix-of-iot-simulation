import { Link } from "@tanstack/react-router";
import { Github, Linkedin, Mail, Phone, Twitter, Youtube } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-sidebar">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-sm text-muted-foreground md:grid-cols-3 md:items-center lg:px-8">
        <p>© 2025 IoT SimLab. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-6">
          <span className="inline-flex items-center gap-2">
            <Mail className="h-4 w-4 text-cyan" /> support@iotsimlab.com
          </span>
          <span className="inline-flex items-center gap-2">
            <Phone className="h-4 w-4 text-cyan" /> +91 98765 43210
          </span>
        </div>
        <div className="flex items-center gap-5 md:justify-end">
          <Link to="/rules" className="hover:text-foreground">
            Rules
          </Link>
          <Link to="/faq" className="hover:text-foreground">
            FAQ
          </Link>
          <Link to="/admin" className="text-xs hover:text-foreground">
            Admin
          </Link>
          <Github className="h-4 w-4" />
          <Youtube className="h-4 w-4" />
          <Twitter className="h-4 w-4" />
          <Linkedin className="h-4 w-4" />
        </div>
      </div>
    </footer>
  );
}
