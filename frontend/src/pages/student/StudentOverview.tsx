import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  FileText,
  CreditCard,
  Calendar,
  Award,
  BookOpen,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

interface StudentProfile {
  _id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  class: string;
  profilePicture?: string;
}

interface StudentStats {
  totalResults: number;
  averageGrade: string;
  pendingPayments: number;
  attendance: number;
}

interface RecentResult {
  _id: string;
  academicSession: string;
  term: string;
  summary: {
    totalScore: number;
    averageScore: number;
    overallGrade: string;
    position: number;
    totalStudents: number;
    remark: string;
  };
  subjects: Array<{
    subjectName: string;
    subjectCode: string;
    scores: {
      firstCA?: number;
      secondCA?: number;
      thirdCA?: number;
      exam: number;
      total: number;
    };
    grade: string;
    remark: string;
  }>;
  createdAt: string;
}

interface UpcomingEvent {
  _id: string;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  type: "exam" | "holiday" | "meeting" | "sports" | "academic" | "other";
  location?: string;
  mandatory: boolean;
  status: "draft" | "published" | "cancelled";
  targetAudience: "all" | "students" | "staff" | "parents" | "custom";
}

const StudentOverview: React.FC = () => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState<StudentStats>({
    totalResults: 0,
    averageGrade: "N/A",
    pendingPayments: 0,
    attendance: 0,
  });
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);

      // Fetch student profile
      const profileRes = await api.get("/student/profile");
      setProfile(profileRes.data.data || profileRes.data);

      // Fetch student results
      const resultsRes = await api.get("/results/student");
      const results = resultsRes.data.data || resultsRes.data;
      setRecentResults(results.slice(0, 5)); // Get last 5 results

      // Fetch upcoming events
      try {
        const eventsRes = await api.get("/events/student");
        const events = eventsRes.data.data || eventsRes.data;

        // Filter for upcoming events only
        const now = new Date();
        const upcoming = events
          .filter((event: UpcomingEvent) => {
            const eventDate = new Date(event.date);
            return eventDate >= now && event.status === "published";
          })
          .slice(0, 3); // Get next 3 upcoming events

        setUpcomingEvents(upcoming);
      } catch (eventsError) {
        console.error("Error fetching events:", eventsError);
        // Don't fail the entire function if events fail
      }

      // Calculate average grade
      if (results.length > 0) {
        const totalScore = results.reduce(
          (sum: number, result: any) => sum + result.summary.averageScore,
          0
        );
        const averageScore = totalScore / results.length;
        const averageGrade = getGradeFromScore(averageScore);

        setStats({
          totalResults: results.length,
          averageGrade,
          pendingPayments: 2, // Mock data
          attendance: 92, // Mock data
        });
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      toast.error("Failed to load student data");
    } finally {
      setLoading(false);
    }
  };

  const getGradeFromScore = (score: number): string => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    if (score >= 50) return "E";
    return "F";
  };

  const getGradeColor = (grade: string): string => {
    const gradeFirstChar = grade.charAt(0).toUpperCase();
    switch (gradeFirstChar) {
      case "A":
        return "text-green-600 bg-green-100";
      case "B":
        return "text-blue-600 bg-blue-100";
      case "C":
        return "text-yellow-600 bg-yellow-100";
      case "D":
        return "text-orange-600 bg-orange-100";
      case "E":
        return "text-red-600 bg-red-100";
      case "F":
        return "text-red-800 bg-red-200";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "exam":
        return FileText;
      case "holiday":
        return CheckCircle;
      case "meeting":
        return User;
      case "sports":
        return Award;
      case "academic":
        return BookOpen;
      default:
        return Calendar;
    }
  };

  const getEventTypeColor = (type: string): string => {
    switch (type) {
      case "exam":
        return "border-red-200 bg-red-50 text-red-600";
      case "holiday":
        return "border-green-200 bg-green-50 text-green-600";
      case "meeting":
        return "border-blue-200 bg-blue-50 text-blue-600";
      case "sports":
        return "border-orange-200 bg-orange-50 text-orange-600";
      case "academic":
        return "border-purple-200 bg-purple-50 text-purple-600";
      default:
        return "border-gray-200 bg-gray-50 text-gray-600";
    }
  };

  const statCards = [
    {
      name: "Total Results",
      value: stats.totalResults,
      icon: FileText,
      color: "bg-blue-500",
      link: "/student/results",
    },
    {
      name: "Average Grade",
      value: stats.averageGrade,
      icon: Award,
      color: "bg-green-500",
      link: "/student/results",
    },
    {
      name: "Pending Payments",
      value: stats.pendingPayments,
      icon: CreditCard,
      color: "bg-yellow-500",
      link: "/student/payments",
    },
    {
      name: "Attendance",
      value: `${stats.attendance}%`,
      icon: TrendingUp,
      color: "bg-purple-500",
      link: "/student/calendar",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {profile?.profilePicture ? (
                <img
                  className="h-16 w-16 rounded-full object-cover border-4 border-white"
                  src={profile.profilePicture}
                  alt={`${profile.firstName} ${profile.lastName}`}
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center border-4 border-white">
                  <User className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold">
                Welcome back, {profile?.firstName || "Student"}!
              </h1>
              <p className="text-green-100">
                {profile?.class} • Student ID: {profile?.studentId}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((card, index) => (
          <motion.div
            key={card.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={card.link}
              className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 p-6"
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-lg ${card.color}`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 truncate">
                    {card.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {typeof card.value === "number"
                      ? card.value.toLocaleString()
                      : card.value}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="xl:col-span-1">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  to="/student/results"
                  className="w-full flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View My Results
                </Link>
                <Link
                  to="/student/payments"
                  className="w-full flex items-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Make Payment
                </Link>
                <Link
                  to="/student/profile"
                  className="w-full flex items-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <User className="h-4 w-4 mr-2" />
                  Update Profile
                </Link>
                <Link
                  to="/student/calendar"
                  className="w-full flex items-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Academic Calendar
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Results */}
        <div className="xl:col-span-2">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Results
              </h3>
              {recentResults.length > 0 ? (
                <div className="space-y-4">
                  {recentResults.map((result) => (
                    <div
                      key={result._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {result.academicSession} -{" "}
                            {result.term.charAt(0).toUpperCase() +
                              result.term.slice(1)}{" "}
                            Term
                          </p>
                          <p className="text-xs text-gray-500">
                            {result.subjects.length} subjects • Position{" "}
                            {result.summary.position}/
                            {result.summary.totalStudents}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {result.summary.averageScore}%
                          </p>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(
                              result.summary.overallGrade.charAt(0)
                            )}`}
                          >
                            Grade {result.summary.overallGrade}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link
                      to="/student/results"
                      className="text-sm font-medium text-green-600 hover:text-green-500 flex items-center"
                    >
                      View all results
                      <svg
                        className="ml-1 h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="mt-4 text-sm font-medium text-gray-900">
                    No results yet
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                    Your results will appear here once they are uploaded by your
                    teachers.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="mt-8">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Upcoming Events
            </h3>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => {
                  const EventIcon = getEventTypeIcon(event.type);
                  const eventDate = new Date(event.date);
                  const isToday =
                    eventDate.toDateString() === new Date().toDateString();
                  const isTomorrow =
                    eventDate.toDateString() ===
                    new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();

                  let dateDisplay = eventDate.toLocaleDateString();
                  if (isToday) dateDisplay = "Today";
                  else if (isTomorrow) dateDisplay = "Tomorrow";

                  return (
                    <div
                      key={event._id}
                      className={`flex items-center p-3 rounded-lg border ${getEventTypeColor(
                        event.type
                      )}`}
                    >
                      <div
                        className={`flex-shrink-0 p-2 rounded-lg ${
                          event.type === "exam"
                            ? "bg-red-100"
                            : event.type === "holiday"
                            ? "bg-green-100"
                            : event.type === "meeting"
                            ? "bg-blue-100"
                            : event.type === "sports"
                            ? "bg-orange-100"
                            : "bg-purple-100"
                        }`}
                      >
                        <EventIcon
                          className={`h-5 w-5 ${
                            event.type === "exam"
                              ? "text-red-600"
                              : event.type === "holiday"
                              ? "text-green-600"
                              : event.type === "meeting"
                              ? "text-blue-600"
                              : event.type === "sports"
                              ? "text-orange-600"
                              : "text-purple-600"
                          }`}
                        />
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p
                              className={`text-sm font-medium ${
                                event.type === "exam"
                                  ? "text-red-900"
                                  : event.type === "holiday"
                                  ? "text-green-900"
                                  : event.type === "meeting"
                                  ? "text-blue-900"
                                  : event.type === "sports"
                                  ? "text-orange-900"
                                  : "text-purple-900"
                              }`}
                            >
                              {event.title}
                              {event.mandatory && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  Mandatory
                                </span>
                              )}
                            </p>
                            <p
                              className={`text-xs ${
                                event.type === "exam"
                                  ? "text-red-700"
                                  : event.type === "holiday"
                                  ? "text-green-700"
                                  : event.type === "meeting"
                                  ? "text-blue-700"
                                  : event.type === "sports"
                                  ? "text-orange-700"
                                  : "text-purple-700"
                              }`}
                            >
                              {dateDisplay}
                              {event.startTime && ` • ${event.startTime}`}
                              {event.location && ` • ${event.location}`}
                            </p>
                          </div>
                          <span
                            className={`capitalize px-2 py-1 text-xs font-medium rounded-full ${
                              event.type === "exam"
                                ? "bg-red-200 text-red-800"
                                : event.type === "holiday"
                                ? "bg-green-200 text-green-800"
                                : event.type === "meeting"
                                ? "bg-blue-200 text-blue-800"
                                : event.type === "sports"
                                ? "bg-orange-200 text-orange-800"
                                : "bg-purple-200 text-purple-800"
                            }`}
                          >
                            {event.type}
                          </span>
                        </div>
                        {event.description && (
                          <p
                            className={`text-xs mt-1 ${
                              event.type === "exam"
                                ? "text-red-600"
                                : event.type === "holiday"
                                ? "text-green-600"
                                : event.type === "meeting"
                                ? "text-blue-600"
                                : event.type === "sports"
                                ? "text-orange-600"
                                : "text-purple-600"
                            }`}
                          >
                            {event.description.length > 100
                              ? `${event.description.substring(0, 100)}...`
                              : event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link
                    to="/student/calendar"
                    className="text-sm font-medium text-green-600 hover:text-green-500 flex items-center"
                  >
                    View full calendar
                    <svg
                      className="ml-1 h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="mt-4 text-sm font-medium text-gray-900">
                  No upcoming events
                </h3>
                <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                  Check back later for upcoming school events and activities.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentOverview;
