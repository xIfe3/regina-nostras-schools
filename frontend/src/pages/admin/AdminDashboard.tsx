import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Upload,
  ClipboardCheck,
  CalendarDays,
  Megaphone,
  Wallet,
  UserCog,
  Search,
  SlidersHorizontal,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import api, { settingsAPI } from "../../services/api";
import DashboardShell from "../../components/dashboard/DashboardShell";
import type { NavSection } from "../../components/dashboard/DashboardShell";

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [counts, setCounts] = useState({ drafts: 0, pendingPayments: 0 });
  const [portalClosed, setPortalClosed] = useState<string | null>(null);

  // Refresh the menu counters when moving between pages
  useEffect(() => {
    api
      .get("/admin/dashboard/stats")
      .then((res) => {
        const o = res.data?.data?.overview || {};
        setCounts({
          drafts: o.draftResults || 0,
          pendingPayments: o.pendingPayments || 0,
        });
      })
      .catch(() => undefined);

    // Remind the admin when students/parents are locked out
    settingsAPI
      .getPublic()
      .then((res) => {
        const a = res.data.data?.access;
        if (!a) return;
        if (a.maintenanceMode) setPortalClosed("Maintenance mode is ON");
        else if (!a.studentLoginEnabled && !a.parentLoginEnabled) setPortalClosed("Student & parent sign-in OFF");
        else if (!a.studentLoginEnabled) setPortalClosed("Student sign-in OFF");
        else if (!a.parentLoginEnabled) setPortalClosed("Parent sign-in OFF");
        else setPortalClosed(null);
      })
      .catch(() => undefined);
  }, [location.pathname]);

  const sections: NavSection[] = [
    {
      items: [{ name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard }],
    },
    {
      title: "Students",
      items: [
        { name: "All Students", href: "/admin/students", icon: Users },
        { name: "Add Student", href: "/admin/students/add", icon: UserPlus },
        { name: "Bulk Upload", href: "/admin/students/bulk-upload", icon: Upload },
      ],
    },
    {
      title: "Academics",
      items: [
        { name: "Upload Results", href: "/admin/results", icon: Upload },
        {
          name: "Publish Results",
          href: "/admin/results/view",
          icon: ClipboardCheck,
          badge: counts.drafts,
        },
        { name: "Events", href: "/admin/events", icon: CalendarDays },
      ],
    },
    {
      title: "School Office",
      items: [
        {
          name: "Payments",
          href: "/admin/payments",
          icon: Wallet,
          badge: counts.pendingPayments,
        },
        { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
      ],
    },
    {
      title: "School Settings",
      items: [
        { name: "System Settings", href: "/admin/settings", icon: SlidersHorizontal },
        { name: "My Profile", href: "/admin/profile", icon: UserCog },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/admin/students?search=${encodeURIComponent(q)}` : "/admin/students");
  };

  return (
    <DashboardShell
      portalName="Admin Portal"
      sections={sections}
      userName="Administrator"
      userSubtitle={user?.email}
      onLogout={handleLogout}
      topBarRight={
        <>
        {portalClosed && (
          <Link
            to="/admin/settings"
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
            title="Open portal access settings"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {portalClosed}
          </Link>
        )}
        <form onSubmit={submitSearch} className="hidden sm:block" role="search">
          <label htmlFor="admin-search" className="sr-only">
            Search students
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="admin-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students by name or ID"
              className="w-72 rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0C4A9F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C4A9F]/20"
            />
          </div>
        </form>
        </>
      }
    >
      <Outlet />
    </DashboardShell>
  );
};

export default AdminDashboard;
