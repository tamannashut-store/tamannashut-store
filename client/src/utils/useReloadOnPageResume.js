import { useEffect } from "react";

export const useReloadOnPageResume = (setReloadKey) => {
  useEffect(() => {
    let hiddenAt = null;
    const reload = () => setReloadKey((value) => value + 1);
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
      } else if (hiddenAt && Date.now() - hiddenAt >= 30000) {
        hiddenAt = null;
        reload();
      }
    };
    const handlePageShow = (event) => { if (event.persisted) reload(); };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", reload);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", reload);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [setReloadKey]);
};
