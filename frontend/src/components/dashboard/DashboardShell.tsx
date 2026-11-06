import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, LogOut, Menu, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  /** Optional small count shown next to the item */
  badge?: number;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

interface DashboardShellProps {
  portalName: string; // e.g. "Admin Portal"
  sections: NavSection[];
  userName: string;
  userSubtitle?: string;
  onLogout: () => void;
  /** Content placed on the right of the top bar (search, child picker...) */
  topBarRight?: React.ReactNode;
  children: React.ReactNode;
}

const initials = (name: string) =>
  name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("") || "U";

/**
 * Shared layout for the admin, student and parent portals:
 * navy sidebar with grouped navigation, white top bar with the page title.
 */
const DashboardShell: React.FC<DashboardShellProps> = ({
  portalName,
  sections,
  userName,
  userSubtitle,
  onLogout,
  topBarRight,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu on navigation
  useEffect(() => setMobileOpen(false), [location.pathname]);

  const allItems = useMemo(() => sections.flatMap((s) => s.items), [sections]);

  // The active item is the one with the longest href that prefixes the path
  const activeHref = useMemo(() => {
    const path = location.pathname.replace(/\/$/, "");
    const matches = allItems
      .filter((i) => path === i.href || path.startsWith(i.href + "/"))
      .sort((a, b) => b.href.length - a.href.length);
    return matches[0]?.href || allItems[0]?.href;
  }, [allItems, location.pathname]);

  const activeItem = allItems.find((i) => i.href === activeHref);

  const sidebar = (
    <div className="flex h-full flex-col bg-[#0A2F66] text-white">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10 flex-shrink-0">
        <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
          <img src="/images/logo.png" alt="Regina Nostra Schools" className="h-8 w-8 object-contain" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight truncate">Regina Nostra Schools</p>
          <p className="text-[11px] uppercase tracking-wider text-[#C4A356] font-medium">
            {portalName}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((section, si) => (
          <div key={si}>
            {section.title && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = item.href === activeHref;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "bg-white/10 text-white"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[#C4A356]" />
                      )}
                      <item.icon
                        className={`h-[18px] w-[18px] flex-shrink-0 ${
                          active ? "text-[#C4A356]" : "text-white/50 group-hover:text-white/80"
                        }`}
                      />
                      <span className="flex-1 truncate">{item.name}</span>
                      {!!item.badge && item.badge > 0 && (
                        <span className="ml-auto inline-flex min-w-[1.25rem] justify-center rounded-full bg-[#C4A356] px-1.5 py-0.5 text-[11px] font-semibold text-[#0A2F66]">
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-3 flex-shrink-0 space-y-1">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
          View school website
        </a>
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <div className="h-9 w-9 rounded-full bg-[#C4A356] text-[#0A2F66] flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {initials(userName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{userName}</p>
            {userSubtitle && (
              <p className="text-xs text-white/50 truncate">{userSubtitle}</p>
            )}
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-md text-white/60 hover:text-white hover:bg-white/10"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-shrink-0">
        <div className="w-64">{sidebar}</div>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="relative w-72 max-w-[85%]"
            >
              {sidebar}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 -right-12 p-2 rounded-full text-white"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="h-16 flex-shrink-0 bg-white border-b border-slate-200 flex items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden -ml-1 p-2 rounded-md text-slate-500 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
              {activeItem?.name || portalName}
            </h1>
          </div>
          {topBarRight && <div className="flex items-center gap-3">{topBarRight}</div>}
        </header>

        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardShell;
