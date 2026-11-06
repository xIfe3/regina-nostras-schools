import React, { useCallback, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Settings,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { parentAPI } from "../../services/api";
import type { ParentProfile } from "../../services/api";
import type { ParentOutletContext } from "./parentContext";
import { childFullName } from "./parentContext";
import DashboardShell from "../../components/dashboard/DashboardShell";
import LoginNotices from "../../components/dashboard/LoginNotices";
import type { NavSection } from "../../components/dashboard/DashboardShell";

const SELECTED_CHILD_KEY = "parent_selected_child";

const ParentDashboard: React.FC = () => {
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    () => localStorage.getItem(SELECTED_CHILD_KEY)
  );
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const sections: NavSection[] = [
    {
      items: [{ name: "Dashboard", href: "/parent/dashboard", icon: LayoutDashboard }],
    },
    {
      title: "My Children",
      items: [
        { name: "Results", href: "/parent/results", icon: FileText },
        { name: "Payments", href: "/parent/payments", icon: CreditCard },
      ],
    },
    {
      title: "Account",
      items: [{ name: "Settings", href: "/parent/settings", icon: Settings }],
    },
  ];

  const reloadProfile = useCallback(async () => {
    try {
      const response = await parentAPI.getProfile();
      if (response.data.success && response.data.data) {
        setProfile(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load parent profile:", error);
      toast.error("Failed to load your children's information");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadProfile();
  }, [reloadProfile]);

  const children = profile?.children || [];
  const selectedChild =
    children.find((c) => c._id === selectedChildId) || children[0] || null;

  const selectChild = (id: string) => {
    setSelectedChildId(id);
    localStorage.setItem(SELECTED_CHILD_KEY, id);
  };

  const handleLogout = () => {
    localStorage.removeItem(SELECTED_CHILD_KEY);
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const outletContext: ParentOutletContext = {
    profile,
    children,
    selectedChild,
    selectChild,
    reloadProfile,
  };

  const childPicker =
    children.length > 0 ? (
      <div className="flex items-center gap-2">
        <label htmlFor="child-select" className="hidden sm:block text-sm text-slate-500">
          Viewing
        </label>
        <select
          id="child-select"
          value={selectedChild?._id || ""}
          onChange={(e) => selectChild(e.target.value)}
          className="max-w-[11rem] sm:max-w-xs rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-[#0C4A9F] focus:outline-none focus:ring-2 focus:ring-[#0C4A9F]/20"
        >
          {children.map((child) => (
            <option key={child._id} value={child._id}>
              {childFullName(child)} ({child.academicInfo.currentClass})
            </option>
          ))}
        </select>
      </div>
    ) : null;

  return (
    <DashboardShell
      portalName="Parent Portal"
      sections={sections}
      userName={profile?.name || "Parent"}
      userSubtitle={user?.email}
      onLogout={handleLogout}
      topBarRight={childPicker}
    >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-[#0C4A9F]"></div>
        </div>
      ) : (
        <Outlet context={outletContext} />
      )}
      <LoginNotices />
    </DashboardShell>
  );
};

export default ParentDashboard;
