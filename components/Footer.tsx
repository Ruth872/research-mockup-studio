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
          Kabwata Clinic, Lusaka · Online assessments are reviewed by clinic staff. In an emergency, go to the nearest health facility.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
