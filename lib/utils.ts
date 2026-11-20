import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** The folder the app is served from: "" locally, "/research-mockup-studio" on GitHub Pages. */
export const APP_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/** A full browser URL for an app route, for redirects outside React Router. */
export const appUrl = (route: string) => `${APP_BASE}${route}`;

/** The current app route, without the folder the app is served from. */
export const currentRoute = () => window.location.pathname.slice(APP_BASE.length) || "/";

/** The page each role lands on after signing in. */
export const dashboardPath = (role: string) =>
  role === "admin" ? "/admin" : role === "patient" ? "/patient/portal" : "/staff/dashboard";
