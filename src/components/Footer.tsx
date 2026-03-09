import { Activity } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-card py-10">
    <div className="mx-auto max-w-7xl px-6">
      <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <span className="font-heading text-sm font-semibold text-foreground">
            KabwataCare
          </span>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          A research prototype by Ruth Mwenya · Information and Communications University, Zambia · 2026
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
