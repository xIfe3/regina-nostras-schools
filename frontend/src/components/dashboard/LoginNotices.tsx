import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, Megaphone, X } from "lucide-react";
import { noticesAPI } from "../../services/api";
import type { LoginNotice } from "../../services/api";

const SESSION_KEY = "notices_shown_this_session";

const styles: Record<LoginNotice["type"], { icon: React.ElementType; ring: string; chip: string; label: string }> = {
  info: { icon: Info, ring: "bg-[#0C4A9F]/10 text-[#0C4A9F]", chip: "bg-[#0C4A9F]/10 text-[#0C4A9F]", label: "Notice" },
  success: { icon: CheckCircle2, ring: "bg-emerald-50 text-emerald-600", chip: "bg-emerald-50 text-emerald-700", label: "Good news" },
  warning: { icon: AlertTriangle, ring: "bg-amber-50 text-amber-600", chip: "bg-amber-50 text-amber-700", label: "Please note" },
  urgent: { icon: Megaphone, ring: "bg-red-50 text-red-600", chip: "bg-red-50 text-red-700", label: "Important" },
};

/**
 * Shows the school's active notices as a popup after a student/parent opens the portal.
 * "Show once" notices are marked as seen on the server; others show once per browser session.
 */
const LoginNotices: React.FC = () => {
  const [queue, setQueue] = useState<LoginNotice[]>([]);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const shown: string[] = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]");
    noticesAPI
      .active()
      .then((res) => setQueue((res.data.data || []).filter((n) => !shown.includes(n._id))))
      .catch(() => undefined);
  }, []);

  const current = queue[0];

  const close = () => {
    if (!current) return;
    const shown: string[] = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]");
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...shown, current._id]));
    if (current.showOnce) noticesAPI.dismiss(current._id).catch(() => undefined);
    setQueue((q) => q.slice(1));
  };

  // Close with Escape
  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?._id]);

  const style = current ? styles[current.type] || styles.info : styles.info;
  const Icon = style.icon;

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current._id}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-slate-900/50" onClick={close} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="notice-title"
            initial={{ y: 16, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 16, opacity: 0 }}
            className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl"
          >
            <button
              onClick={close}
              className="absolute right-3 top-3 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <span className={`rounded-full p-2.5 ${style.ring}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${style.chip}`}>
                  {style.label}
                </span>
              </div>
              <h2 id="notice-title" className="mt-4 text-xl font-semibold text-slate-900">
                {current.title}
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {current.message}
              </p>
              <p className="mt-4 text-xs text-slate-400">
                From the school office ·{" "}
                {new Date(current.createdAt).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 sm:px-7">
              <span className="text-xs text-slate-400">
                {queue.length > 1 ? `${queue.length - 1} more notice(s)` : ""}
              </span>
              <button
                onClick={close}
                autoFocus
                className="rounded-md bg-[#0C4A9F] px-5 py-2 text-sm font-medium text-white hover:bg-[#0A2F66]"
              >
                {queue.length > 1 ? "Next" : "Got it"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginNotices;
