import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UsersRound,
  ClipboardCheck,
  Wallet,
  UserPlus,
  Upload,
  FileSpreadsheet,
  Megaphone,
  CalendarDays,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Activity as ActivityIcon,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import api from "../../services/api";

interface Overview {
  totalStudents: number;
  totalResults: number;
  draftResults: number;
  publishedResults: number;
  parentAccounts: number;
  pendingPayments: number;
  totalPayments: number;
  verifiedPayments: number;
}

interface PaymentStat {
  _id: "pending" | "verified" | "rejected";
  count: number;
  totalAmount: number;
}

interface ActivityItem {
  _id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
}

const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const timeAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

/** Academic year starts in September */
const currentSession = () => {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 8 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
};

const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  hint: React.ReactNode;
  icon: LucideIcon;
  to: string;
  tone: "navy" | "gold" | "green" | "amber";
}> = ({ label, value, hint, icon: Icon, to, tone }) => {
  const tones = {
    navy: "bg-[#0C4A9F]/10 text-[#0C4A9F]",
    gold: "bg-[#C4A356]/15 text-[#8a6d2b]",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <Link
      to={to}
      className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`rounded-lg p-2 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{hint}</p>
    </Link>
  );
};

const Panel: React.FC<{
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, action, children, className = "" }) => (
  <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </section>
);

const quickActions: Array<{ label: string; desc: string; to: string; icon: LucideIcon }> = [
  { label: "Add a student", desc: "Creates student & parent logins", to: "/admin/students/add", icon: UserPlus },
  { label: "Bulk add students", desc: "From an Excel or CSV sheet", to: "/admin/students/bulk-upload", icon: FileSpreadsheet },
  { label: "Upload results", desc: "Download a class sheet, fill, upload", to: "/admin/results", icon: Upload },
  { label: "Publish results", desc: "Make drafts visible to families", to: "/admin/results/view?status=draft", icon: ClipboardCheck },
  { label: "Post announcement", desc: "News for students and parents", to: "/admin/announcements/create", icon: Megaphone },
  { label: "Add an event", desc: "School calendar", to: "/admin/events", icon: CalendarDays },
];

const AdminOverview: React.FC = () => {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [classes, setClasses] = useState<Array<{ _id: string; count: number }>>([]);
  const [payments, setPayments] = useState<PaymentStat[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, actRes] = await Promise.all([
        api.get("/admin/dashboard/stats"),
        api.get("/activities/recent?limit=25").catch(() => ({ data: { data: [] } })),
      ]);
      const d = statsRes.data.data || {};
      const o = d.overview || {};
      // Default every number so an older backend (missing fields) can't break the page
      setOverview({
        totalStudents: o.totalStudents || 0,
        totalResults: o.totalResults || 0,
        draftResults: o.draftResults || 0,
        publishedResults:
          o.publishedResults ?? Math.max((o.totalResults || 0) - (o.draftResults || 0), 0),
        parentAccounts: o.parentAccounts || 0,
        pendingPayments: o.pendingPayments || 0,
        totalPayments: o.totalPayments || 0,
        verifiedPayments: o.verifiedPayments || 0,
      });
      setClasses(d.classDistribution || []);
      setPayments(d.paymentStats || []);
      // Logins are noise on the overview; show school work only
      setActivities(
        ((actRes.data.data || []) as ActivityItem[])
          .filter((a) => !["user_login", "user_logout"].includes(a.type))
          .slice(0, 6)
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const today = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading && !overview) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="h-8 w-64 rounded bg-slate-200 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 flex items-center justify-between gap-4">
          <span>{error || "Could not load the dashboard"}</span>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 border border-red-200 font-medium">
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      </div>
    );
  }

  const pendingAmount = payments.find((p) => p._id === "pending")?.totalAmount || 0;
  const verifiedAmount = payments.find((p) => p._id === "verified")?.totalAmount || 0;
  const maxClass = Math.max(1, ...classes.map((c) => c.count));

  const attention = [
    overview.draftResults > 0 && {
      text:
        overview.draftResults === 1
          ? "1 result is still a draft — the student and parent can't see it yet"
          : `${overview.draftResults} results are still drafts — students and parents can't see them yet`,
      cta: "Review & publish",
      to: "/admin/results/view?status=draft",
    },
    overview.pendingPayments > 0 && {
      text: `${overview.pendingPayments} payment${overview.pendingPayments === 1 ? "" : "s"} (${formatNaira(pendingAmount)}) waiting for verification`,
      cta: "Verify payments",
      to: "/admin/payments",
    },
    overview.totalStudents > 0 &&
      overview.parentAccounts === 0 && {
        text: "No parent logins yet. Add a parent email to each student so parents can follow results.",
        cta: "Open students",
        to: "/admin/students",
      },
  ].filter(Boolean) as Array<{ text: string; cta: string; to: string }>;

  return (
    <div className="px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{today}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {greeting()}, Administrator
          </h2>
        </div>
        <span className="inline-flex items-center rounded-full border border-[#C4A356]/40 bg-[#C4A356]/10 px-3 py-1 text-sm font-medium text-[#7a5f22]">
          {currentSession()} academic session
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Active students"
          value={overview.totalStudents.toLocaleString()}
          hint={`${classes.length} class${classes.length === 1 ? "" : "es"}`}
          icon={Users}
          to="/admin/students"
          tone="navy"
        />
        <StatCard
          label="Parent logins"
          value={overview.parentAccounts.toLocaleString()}
          hint="Families using the parent portal"
          icon={UsersRound}
          to="/admin/students"
          tone="gold"
        />
        <StatCard
          label="Published results"
          value={overview.publishedResults.toLocaleString()}
          hint={
            overview.draftResults > 0 ? (
              <span className="text-amber-700 font-medium">{overview.draftResults} draft(s) waiting</span>
            ) : (
              "No drafts waiting"
            )
          }
          icon={ClipboardCheck}
          to="/admin/results/view"
          tone="green"
        />
        <StatCard
          label="Payments to verify"
          value={overview.pendingPayments.toLocaleString()}
          hint={`${formatNaira(verifiedAmount)} verified so far`}
          icon={Wallet}
          to="/admin/payments"
          tone="amber"
        />
      </div>

      {/* Attention */}
      <Panel title="Needs your attention">
        {attention.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            You're all caught up. Nothing is waiting on you.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 -my-2">
            {attention.map((a) => (
              <li key={a.to + a.cta} className="flex flex-wrap items-center gap-3 py-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <p className="flex-1 min-w-[12rem] text-sm text-slate-700">{a.text}</p>
                <Link
                  to={a.to}
                  className="inline-flex items-center rounded-md bg-[#0C4A9F] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0A2F66]"
                >
                  {a.cta}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Quick actions */}
        <Panel title="Quick actions" className="xl:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((q) => (
              <Link
                key={q.to}
                to={q.to}
                className="group flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:border-[#0C4A9F]/40 hover:bg-[#0C4A9F]/[0.03]"
              >
                <span className="rounded-md bg-slate-100 p-2 text-slate-600 group-hover:bg-[#0C4A9F] group-hover:text-white transition-colors">
                  <q.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-900">{q.label}</span>
                  <span className="block text-xs text-slate-500 truncate">{q.desc}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#0C4A9F]" />
              </Link>
            ))}
          </div>
        </Panel>

        {/* Students by class */}
        <Panel
          title="Students by class"
          action={
            <Link to="/admin/students" className="text-xs font-medium text-[#0C4A9F] hover:underline">
              View all
            </Link>
          }
        >
          {classes.length === 0 ? (
            <p className="text-sm text-slate-500">No active students yet.</p>
          ) : (
            <ul className="space-y-3">
              {classes.map((c) => (
                <li key={c._id || "none"}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">{c._id || "No class"}</span>
                    <span className="font-medium text-slate-900">{c.count}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-[#0C4A9F]"
                      style={{ width: `${Math.max(4, (c.count / maxClass) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Recent activity */}
      <Panel title="Recent activity">
        {activities.length === 0 ? (
          <p className="text-sm text-slate-500">No activity recorded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 -my-2">
            {activities.map((a) => (
              <li key={a._id} className="flex items-start gap-3 py-3">
                <span className="mt-0.5 rounded-full bg-slate-100 p-1.5 text-slate-500">
                  <ActivityIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{a.title}</p>
                  <p className="text-sm text-slate-500 truncate">{a.description}</p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
};

export default AdminOverview;
