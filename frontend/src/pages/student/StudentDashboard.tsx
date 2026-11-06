import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  FileText,
  CreditCard,
  CalendarDays,
  Settings,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import DashboardShell from "../../components/dashboard/DashboardShell";
import LoginNotices from "../../components/dashboard/LoginNotices";
import type { NavSection } from "../../components/dashboard/DashboardShell";

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const sections: NavSection[] = [
    {
      items: [{ name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard }],
    },
    {
      title: "My School",
      items: [
        { name: "My Results", href: "/student/results", icon: FileText },
        { name: "Payments", href: "/student/payments", icon: CreditCard },
        { name: "Academic Calendar", href: "/student/calendar", icon: CalendarDays },
      ],
    },
    {
      title: "Account",
      items: [
        { name: "My Profile", href: "/student/profile", icon: User },
        { name: "Settings", href: "/student/settings", icon: Settings },
      ],
    },
  ];

  const info = user?.student;
  const name = info
    ? `${info.personalInfo.firstName} ${info.personalInfo.lastName}`
    : user?.email || "Student";
  const subtitle = info
    ? `${info.academicInfo.currentClass} · ${info.studentId}`
    : user?.email;

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <DashboardShell
      portalName="Student Portal"
      sections={sections}
      userName={name}
      userSubtitle={subtitle}
      onLogout={handleLogout}
    >
      <Outlet />
      <LoginNotices />
    </DashboardShell>
  );
};

export default StudentDashboard;
