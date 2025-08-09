import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  FileText,
  CreditCard,
  Plus,
  CheckCircle,
  Clock,
  Download,
  ArrowUpRight,
  Activity,
  BookOpen,
  DollarSign,
  Calendar,
  BarChart3,
  Star,
  Zap,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

interface DashboardStats {
  totalStudents: number;
  totalResults: number;
  pendingPayments: number;
  recentActivity: number;
}

interface RecentActivity {
  _id: string;
  type:
    | "student_added"
    | "student_updated"
    | "student_deleted"
    | "result_uploaded"
    | "result_updated"
    | "result_deleted"
    | "payment_verified"
    | "payment_rejected"
    | "payment_pending"
    | "user_login"
    | "user_logout"
    | "admin_action"
    | "system_event";
  title: string;
  description: string;
  createdAt: string;
  userId?: {
    email: string;
    role: string;
  };
}

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalResults: 0,
    pendingPayments: 0,
    recentActivity: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard stats from the dedicated endpoint
      const dashboardRes = await api.get("/admin/dashboard/stats");
      const dashboardData = dashboardRes.data.data;

      setStats({
        totalStudents: dashboardData.overview.totalStudents || 0,
        totalResults: dashboardData.overview.totalResults || 0,
        pendingPayments: dashboardData.overview.pendingPayments || 0,
        recentActivity:
          dashboardData.recentActivity.recentStudents +
            dashboardData.recentActivity.recentResults +
            dashboardData.recentActivity.recentPayments || 0,
      });

      // Fetch recent activities from the new API endpoint (limit to 4 for overview)
      const activitiesRes = await api.get("/activities/recent?limit=4");
      setRecentActivities(activitiesRes.data.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      link: "/admin/students",
      change: "+12%",
      trend: "up",
    },
    {
      name: "Results Uploaded",
      value: stats.totalResults,
      icon: BookOpen,
      gradient: "from-emerald-500 to-emerald-600",
      link: "/admin/results",
      change: "+8%",
      trend: "up",
    },
    {
      name: "Pending Payments",
      value: stats.pendingPayments,
      icon: DollarSign,
      gradient: "from-amber-500 to-amber-600",
      link: "/admin/payments",
      change: "-5%",
      trend: "down",
    },
    {
      name: "System Performance",
      value: "98.9%",
      icon: Activity,
      gradient: "from-purple-500 to-purple-600",
      link: "/admin/analytics",
      change: "+2%",
      trend: "up",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "student_added":
        return <Users className="h-5 w-5 text-white" />;
      case "result_uploaded":
        return <FileText className="h-5 w-5 text-white" />;
      case "payment_verified":
        return <CheckCircle className="h-5 w-5 text-white" />;
      default:
        return <Clock className="h-5 w-5 text-white" />;
    }
  };

  const formatTimeAgo = (createdAt: string) => {
    const now = new Date();
    const time = new Date(createdAt);
    const diffInHours = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                <BarChart3 className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome back, Admin
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Here's your comprehensive overview of Regina Nostras Schools.
              Everything is running smoothly.
            </p>
          </motion.div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute top-20 right-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        {/* Enhanced Stats cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 mb-12">
          {statCards.map((card, index) => (
            <motion.div
              key={card.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group"
            >
              <Link
                to={card.link}
                className="block relative bg-white/90 backdrop-blur-sm border border-white/30 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden min-h-[160px]"
              >
                {/* Animated background gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-8 transition-all duration-500`}
                ></div>

                {/* Floating icon with enhanced styling */}
                <div className="relative z-10 flex items-start justify-between mb-6">
                  <div
                    className={`p-4 rounded-2xl bg-gradient-to-br ${card.gradient} shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300`}
                  >
                    <card.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                  </div>
                </div>

                {/* Content with improved spacing */}
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      {card.name}
                    </p>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${
                        card.trend === "up"
                          ? "text-emerald-700 bg-emerald-100 border border-emerald-200"
                          : "text-red-700 bg-red-100 border border-red-200"
                      }`}
                    >
                      {card.change}
                    </span>
                  </div>

                  <div className="pt-1">
                    <p className="text-3xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
                      {typeof card.value === "number"
                        ? card.value.toLocaleString()
                        : card.value}
                    </p>
                  </div>
                </div>

                {/* Enhanced shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%]"></div>

                {/* Corner accent */}
                <div
                  className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${card.gradient} opacity-5 rounded-bl-3xl`}
                ></div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* Enhanced Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="xl:col-span-1"
          >
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Quick Actions
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <Link
                  to="/admin/students/add"
                  className="group w-full flex items-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <div className="p-2 bg-white/20 rounded-lg mr-3">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold">Add New Student</p>
                    <p className="text-sm text-blue-100">
                      Register a new student
                    </p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Link>

                <Link
                  to="/admin/results"
                  className="group w-full flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900">
                      Upload Results
                    </p>
                    <p className="text-sm text-gray-500">
                      Bulk upload student results
                    </p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </Link>

                <Link
                  to="/admin/payments"
                  className="group w-full flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-amber-300 hover:bg-amber-50 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="p-2 bg-amber-100 rounded-lg mr-3">
                    <CreditCard className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900">
                      Verify Payments
                    </p>
                    <p className="text-sm text-gray-500">
                      Review pending payments
                    </p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-amber-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </Link>

                <button className="group w-full flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 shadow-sm hover:shadow-md">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <Download className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900">
                      Export Reports
                    </p>
                    <p className="text-sm text-gray-500">
                      Download analytics data
                    </p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="xl:col-span-2"
          >
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Recent Activity
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {recentActivities.map((activity, index) => (
                    <motion.div
                      key={activity._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-start space-x-4 p-4 bg-gray-50/50 rounded-xl hover:bg-gray-100/50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                          {getActivityIcon(activity.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {activity.description}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-500">
                            {formatTimeAgo(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Link
                    to="/admin/analytics"
                    className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    View all activity
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Enhanced System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Star className="h-5 w-5 mr-2" />
                System Health
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="font-semibold text-green-900">Database</p>
                      <p className="text-sm text-green-600">
                        Online & Optimized
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">99.9%</p>
                    <p className="text-xs text-green-500">Uptime</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="font-semibold text-blue-900">
                        Email Service
                      </p>
                      <p className="text-sm text-blue-600">Active & Sending</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">100%</p>
                    <p className="text-xs text-blue-500">Delivery</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-amber-500 mr-3" />
                    <div>
                      <p className="font-semibold text-amber-900">Backup</p>
                      <p className="text-sm text-amber-600">Scheduled Daily</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-600">✓</p>
                    <p className="text-xs text-amber-500">Last: 2hrs ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminOverview;
