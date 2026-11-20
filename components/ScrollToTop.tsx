import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/** Opens every new page at the top; without this a page keeps the previous page's scroll position. */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}
