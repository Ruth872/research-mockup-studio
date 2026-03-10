import { Link, useLocation } from "react-router-dom";
import { Activity, Menu, X, LogIn, User, LogOut } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/triage", label: "Symptom Checker" },
  { to: "/chat", label: "AI Chat" },
  { to: "/dashboard", label: "Analytics" },
];

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, userType, user, logout } = useAuth();

  const displayName = userType === "staff"
    ? (user as any)?.first_name
    : (user as any)?.name?.split(" ")[0];

  const portalLink = userType === "staff" ? "/staff/dashboard" : "/patient/portal";

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-lg font-bold text-foreground">
            KabwataCare
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {publicLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="ml-3 border-l border-border pl-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to={portalLink}>
                  <Button variant="ghost" size="sm">
                    <User className="mr-1.5 h-4 w-4" /> {displayName}
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/staff/login">
                  <Button variant="ghost" size="sm">
                    <LogIn className="mr-1.5 h-4 w-4" /> Staff
                  </Button>
                </Link>
                <Link to="/patient/login">
                  <Button variant="outline" size="sm">Patient Portal</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {publicLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 border-t border-border pt-2">
                {isAuthenticated ? (
                  <>
                    <Link to={portalLink} onClick={() => setMobileOpen(false)}
                      className="block rounded-lg px-4 py-3 text-sm font-medium text-foreground">
                      My Dashboard
                    </Link>
                    <button onClick={() => { logout(); setMobileOpen(false); }}
                      className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-destructive">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/staff/login" onClick={() => setMobileOpen(false)}
                      className="block rounded-lg px-4 py-3 text-sm font-medium text-foreground">
                      Staff Login
                    </Link>
                    <Link to="/patient/login" onClick={() => setMobileOpen(false)}
                      className="block rounded-lg px-4 py-3 text-sm font-medium text-primary">
                      Patient Portal
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
