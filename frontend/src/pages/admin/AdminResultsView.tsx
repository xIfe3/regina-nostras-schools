import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  FileText,
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Target,
  CheckCircle,
  XCircle,
  Printer,
  Mail,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";

interface Student {
  _id: string;
  studentId?: string;
  personalInfo?: {
    firstName?: string;
    lastName?: string;
  };
  academicInfo?: {
    currentClass?: string;
  };
}

interface Subject {
  subjectName: string;
  subjectCode?: string;
  scores: {
    firstCA?: number;
    secondCA?: number;
    thirdCA?: number;
    exam: number;
    total: number;
  };
  grade: string;
  remark: string;
  position?: number;
}

interface Result {
  _id: string;
  studentId: Student;
  academicSession: string;
  term: "first" | "second" | "third";
  class: string;
  subjects: Subject[];
  summary: {
    totalScore: number;
    averageScore: number;
    overallGrade: string;
    position: number;
    totalStudents: number;
    remark: string;
  };
  attendance: {
    schoolOpened: number;
    timesPresent: number;
    timesAbsent: number;
  };
  behavioralAssessment?: {
    punctuality: string;
    neatness: string;
    politeness: string;
    honesty: string;
    leadership: string;
    relationship: string;
  };
  teacherComments?: string;
  principalComments?: string;
  nextTermBegins?: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ResultStats {
  totalStudents: number;
  classAverage: number;
  gradeDistribution: { [key: string]: number };
  topPerformers: {
    position: number;
    studentName: string;
    averageScore: number;
    overallGrade: string;
  }[];
  academicSession: string;
  term: string;
  class: string;
}

const AdminResultsView: React.FC = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [stats, setStats] = useState<ResultStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams] = useSearchParams();
  const [classFilter, setClassFilter] = useState(searchParams.get("class") || "all");
  const [sessionFilter, setSessionFilter] = useState(searchParams.get("session") || "all");
  const [termFilter, setTermFilter] = useState(searchParams.get("term") || "all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">(
    (["published", "draft"].includes(searchParams.get("status") || "")
      ? searchParams.get("status")
      : "all") as "all" | "published" | "draft"
  );
  const [busyIds, setBusyIds] = useState<string[]>([]);
  const [confirmPublishAll, setConfirmPublishAll] = useState(false);
  const [publishingAll, setPublishingAll] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingResult, setEditingResult] = useState<Result | null>(null);
  const [availableSessions, setAvailableSessions] = useState<string[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchResults();
  }, [sessionFilter, termFilter, classFilter]);

  useEffect(() => {
    fetchResultStats();
  }, [sessionFilter, termFilter, classFilter]);

  const fetchOptions = async () => {
    try {
      // Fetch available sessions and terms
      const sessionsResponse = await api.get("/results/sessions-terms");
      if (sessionsResponse.data.success) {
        setAvailableSessions(sessionsResponse.data.data.sessions);
      }

      // Get distinct classes from students
      const studentsResponse = await api.get("/admin/students?limit=1000");
      if (studentsResponse.data.success) {
        const classes = Array.from(
          new Set(
            studentsResponse.data.data
              .map((student: any) => student.academicInfo?.currentClass)
              .filter(Boolean)
          )
        ) as string[];
        setAvailableClasses(classes.sort());
      }
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  };

  const fetchResults = async () => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams();
      queryParams.append("limit", "1000");

      if (sessionFilter !== "all") {
        queryParams.append("academicSession", sessionFilter);
      }
      if (termFilter !== "all") {
        queryParams.append("term", termFilter);
      }
      if (classFilter !== "all") {
        queryParams.append("class", classFilter);
      }

      const response = await api.get(`/results?${queryParams.toString()}`);

      if (response.data.success) {
        console.log("Fetched response", response);
        console.log(
          "First result student data:",
          response.data.data[0]?.studentId
        );
        setResults(response.data.data);
        const resultClasses = (response.data.data as Result[])
          .map((r) => r.class)
          .filter(Boolean);
        setAvailableClasses((prev) =>
          Array.from(new Set([...prev, ...resultClasses])).sort()
        );
      } else {
        throw new Error(response.data.message || "Failed to fetch results");
      }
    } catch (error: any) {
      console.error("Error fetching results:", error);
      toast.error(error.response?.data?.message || "Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const fetchResultStats = async () => {
    try {
      // Only fetch stats if we have session and term filters
      if (sessionFilter === "all" || termFilter === "all") {
        setStats({
          totalStudents: 0,
          classAverage: 0,
          gradeDistribution: {},
          topPerformers: [],
          academicSession: "N/A",
          term: "N/A",
          class: "N/A",
        });
        return;
      }

      const queryParams = new URLSearchParams();
      queryParams.append("academicSession", sessionFilter);
      queryParams.append("term", termFilter);

      if (classFilter !== "all") {
        queryParams.append("class", classFilter);
      }

      const response = await api.get(
        `/results/statistics?${queryParams.toString()}`
      );

      if (response.data.success) {
        setStats(response.data.data);
      } else {
        throw new Error(response.data.message || "Failed to fetch stats");
      }
    } catch (error: any) {
      console.error("Error fetching result stats:", error);
      // Don't show error toast for stats as it's not critical
    }
  };

  const filteredResults = results.filter((result) => {
    // Check if studentId is properly populated
    if (!result.studentId || typeof result.studentId === "string") {
      console.warn("Student not populated or invalid:", result.studentId);
      return false;
    }

    const student = result.studentId;
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      student.personalInfo?.firstName?.toLowerCase().includes(searchLower) ||
      student.personalInfo?.lastName?.toLowerCase().includes(searchLower) ||
      student.studentId?.toLowerCase().includes(searchLower);

    const matchesClass = classFilter === "all" || result.class === classFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" ? result.isPublished : !result.isPublished);
    const matchesSession =
      sessionFilter === "all" || result.academicSession === sessionFilter;
    const matchesTerm = termFilter === "all" || result.term === termFilter;

    return (
      matchesSearch && matchesClass && matchesSession && matchesTerm && matchesStatus
    );
  });

  const getGradeColor = (grade: string) => {
    switch (grade.charAt(0)) {
      case "A":
        return "text-emerald-700 bg-emerald-100";
      case "B":
        return "text-blue-700 bg-blue-100";
      case "C":
        return "text-amber-700 bg-amber-100";
      case "D":
        return "text-orange-700 bg-orange-100";
      case "F":
        return "text-red-700 bg-red-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  const getPositionSuffix = (position: number) => {
    const j = position % 10;
    const k = position % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  const exportResults = () => {
    if (filteredResults.length === 0) {
      toast.error("No results to export");
      return;
    }
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Student ID", "Name", "Class", "Session", "Term", "Subjects", "Total", "Average", "Grade", "Position", "Out of", "Status"],
      ...filteredResults.map((r) => [
        r.studentId?.studentId,
        `${r.studentId?.personalInfo?.firstName || ""} ${r.studentId?.personalInfo?.lastName || ""}`.trim(),
        r.class,
        r.academicSession,
        r.term,
        r.subjects.length,
        r.summary.totalScore,
        r.summary.averageScore,
        r.summary.overallGrade,
        r.summary.position,
        r.summary.totalStudents,
        r.isPublished ? "Published" : "Draft",
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.map(esc).join(",")).join("\n")], {
      type: "text/csv",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `results_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`${filteredResults.length} result(s) exported`);
  };

  const generateResultSheet = async (result: Result) => {
    try {
      toast.loading("Generating result sheet...");

      const response = await api.post(
        "/results/generate-sheet",
        {
          resultId: result._id,
        },
        {
          responseType: "blob",
        }
      );

      // Create a download link for the PDF
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${result.studentId?.personalInfo?.firstName}_${result.studentId?.personalInfo?.lastName}_${result.academicSession}_${result.term}_result.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success("Result sheet generated and downloaded successfully");
    } catch (error: any) {
      console.error("Error generating result sheet:", error);
      toast.dismiss();
      toast.error(
        error.response?.data?.message || "Failed to generate result sheet"
      );
    }
  };

  const sendResultNotification = async (result: Result) => {
    try {
      toast.loading("Sending result notification...");

      const response = await api.post("/results/send-notification", {
        resultId: result._id,
      });

      if (response.data.success) {
        toast.dismiss();
        toast.success("Result notification sent to parent successfully");
      } else {
        throw new Error(response.data.message || "Failed to send notification");
      }
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast.dismiss();
      toast.error(
        error.response?.data?.message || "Failed to send notification"
      );
    }
  };

  const setPublishedLocally = (ids: string[], isPublished: boolean) =>
    setResults((prev) =>
      prev.map((r) => (ids.includes(r._id) ? { ...r, isPublished } : r))
    );

  const togglePublish = async (result: Result) => {
    const next = !result.isPublished;
    setBusyIds((b) => [...b, result._id]);
    try {
      await api.put(`/results/${result._id}/publish`, { isPublished: next });
      setPublishedLocally([result._id], next);
      toast.success(
        next
          ? "Published. Student and parent are being emailed."
          : "Result hidden from student and parent"
      );
    } catch (error: any) {
      toast.error(error?.message || "Could not update result");
    } finally {
      setBusyIds((b) => b.filter((id) => id !== result._id));
    }
  };

  const draftsShown = filteredResults.filter((r) => !r.isPublished);

  const publishAllShown = async () => {
    const ids = draftsShown.map((r) => r._id);
    if (ids.length === 0) return;
    setPublishingAll(true);
    setConfirmPublishAll(false);
    try {
      const res = await api.post("/results/publish", {
        resultIds: ids,
        isPublished: true,
      });
      setPublishedLocally(ids, true);
      toast.success(res.data.message || `${ids.length} results published`);
    } catch (error: any) {
      toast.error(error?.message || "Could not publish results");
    } finally {
      setPublishingAll(false);
    }
  };

  const editResult = (result: Result) => {
    setEditingResult({ ...result });
    setShowEditModal(true);
  };

  const updateResult = async () => {
    if (!editingResult) return;

    try {
      toast.loading("Updating result...");

      const response = await api.put(
        `/results/${editingResult._id}`,
        editingResult
      );

      if (response.data.success) {
        // Update the results list
        setResults((prev) =>
          prev.map((r) =>
            r._id === editingResult._id ? response.data.data : r
          )
        );

        toast.dismiss();
        toast.success("Result updated successfully");
        setShowEditModal(false);
        setEditingResult(null);
      } else {
        throw new Error(response.data.message || "Failed to update result");
      }
    } catch (error: any) {
      console.error("Error updating result:", error);
      toast.dismiss();
      toast.error(error.response?.data?.message || "Failed to update result");
    }
  };

  const updateSubjectScore = (
    subjectIndex: number,
    field: string,
    value: number
  ) => {
    if (!editingResult) return;

    const updatedResult = { ...editingResult };
    const subject = updatedResult.subjects[subjectIndex];

    if (
      field === "firstCA" ||
      field === "secondCA" ||
      field === "thirdCA" ||
      field === "exam"
    ) {
      subject.scores[field as keyof typeof subject.scores] = value;

      // Recalculate total
      const { firstCA = 0, secondCA = 0, thirdCA = 0, exam } = subject.scores;
      subject.scores.total = firstCA + secondCA + thirdCA + exam;

      // Update grade based on total
      if (subject.scores.total >= 80) subject.grade = "A";
      else if (subject.scores.total >= 70) subject.grade = "B";
      else if (subject.scores.total >= 60) subject.grade = "C";
      else if (subject.scores.total >= 50) subject.grade = "D";
      else subject.grade = "F";
    }

    // Recalculate summary
    const totalScore = updatedResult.subjects.reduce(
      (sum, s) => sum + s.scores.total,
      0
    );
    const averageScore = totalScore / updatedResult.subjects.length;

    updatedResult.summary.totalScore = totalScore;
    updatedResult.summary.averageScore = averageScore;

    if (averageScore >= 80) updatedResult.summary.overallGrade = "A";
    else if (averageScore >= 70) updatedResult.summary.overallGrade = "B";
    else if (averageScore >= 60) updatedResult.summary.overallGrade = "C";
    else if (averageScore >= 50) updatedResult.summary.overallGrade = "D";
    else updatedResult.summary.overallGrade = "F";

    setEditingResult(updatedResult);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-[#0C4A9F] mx-auto mb-3"></div>
          <p className="text-sm text-slate-500">Loading results...</p>
        </div>
      </div>
    );
  }

  const shownCount = filteredResults.length;
  const shownAverage =
    shownCount > 0
      ? filteredResults.reduce((sum, r) => sum + (r.summary?.averageScore || 0), 0) /
        shownCount
      : 0;
  const shownPassRate =
    shownCount > 0
      ? (filteredResults.filter((r) => (r.summary?.averageScore || 0) >= 50).length /
          shownCount) *
        100
      : 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Results
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review uploaded results and publish them to students and parents.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowStatsModal(true)}
            disabled={sessionFilter === "all" || termFilter === "all"}
            title={
              sessionFilter === "all" || termFilter === "all"
                ? "Choose a session and term to see class analytics"
                : "Class analytics"
            }
            className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </button>
          <button
            onClick={exportResults}
            className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => navigate("/admin/results")}
            className="inline-flex items-center rounded-md bg-[#0C4A9F] px-3 py-2 text-sm font-medium text-white hover:bg-[#0A2F66]"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Results
          </button>
        </div>
      </div>

      <div>
        {/* Summary of what is shown */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Results shown", value: shownCount.toLocaleString(), icon: FileText, tone: "bg-[#0C4A9F]/10 text-[#0C4A9F]" },
            { label: "Average score", value: `${shownAverage.toFixed(1)}%`, icon: Target, tone: "bg-emerald-50 text-emerald-700" },
            { label: "Pass rate (50%+)", value: `${shownPassRate.toFixed(0)}%`, icon: Award, tone: "bg-[#C4A356]/15 text-[#8a6d2b]" },
            { label: "Drafts (not visible)", value: draftsShown.length.toLocaleString(), icon: XCircle, tone: "bg-amber-50 text-amber-700" },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{c.label}</p>
                <span className={`rounded-lg p-1.5 ${c.tone}`}>
                  <c.icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#0C4A9F]/20 focus:border-[#0C4A9F]"
              />
            </div>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#0C4A9F]/20 focus:border-[#0C4A9F]"
            >
              <option value="all">All Classes</option>
              {availableClasses.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>

            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#0C4A9F]/20 focus:border-[#0C4A9F]"
            >
              <option value="all">All Sessions</option>
              {availableSessions.map((session) => (
                <option key={session} value={session}>
                  {session}
                </option>
              ))}
            </select>

            <select
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#0C4A9F]/20 focus:border-[#0C4A9F]"
            >
              <option value="all">All Terms</option>
              <option value="first">First Term</option>
              <option value="second">Second Term</option>
              <option value="third">Third Term</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "published" | "draft")
              }
              className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#0C4A9F]/20 focus:border-[#0C4A9F]"
            >
              <option value="all">All statuses</option>
              <option value="draft">Drafts (not visible)</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Student Results
              </h3>
              <p className="text-sm text-gray-500">
                {filteredResults.length} shown ·{" "}
                <span className={draftsShown.length ? "text-amber-600 font-medium" : ""}>
                  {draftsShown.length} draft(s) not visible to students/parents
                </span>
              </p>
            </div>
            {draftsShown.length > 0 &&
              (confirmPublishAll ? (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-gray-700">
                    Publish {draftsShown.length} result(s) and email students &amp; parents?
                  </span>
                  <button
                    onClick={publishAllShown}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Yes, publish
                  </button>
                  <button
                    onClick={() => setConfirmPublishAll(false)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmPublishAll(true)}
                  disabled={publishingAll}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {publishingAll
                    ? "Publishing..."
                    : `Publish all shown drafts (${draftsShown.length})`}
                </button>
              ))}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Session/Term
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Average Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Subjects
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No results found</p>
                        <p className="text-sm">
                          {results.length === 0
                            ? "No results have been uploaded yet."
                            : "Try adjusting your search or filter criteria."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((result) => (
                    <tr key={result._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-9 w-9">
                            <div className="h-9 w-9 rounded-full bg-[#0C4A9F] flex items-center justify-center">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {result.studentId?.personalInfo?.firstName ||
                                "N/A"}{" "}
                              {result.studentId?.personalInfo?.lastName ||
                                "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {result.studentId?.studentId || "N/A"} •{" "}
                              {result.class ||
                                result.studentId?.academicInfo?.currentClass ||
                                "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        <div>{result.academicSession}</div>
                        <div className="capitalize">{result.term} term</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {result.summary.averageScore.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">
                          {result.summary.totalScore}/
                          {result.subjects.length * 100}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(
                            result.summary.overallGrade
                          )}`}
                        >
                          {result.summary.overallGrade}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.summary.position}
                        {getPositionSuffix(result.summary.position)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {result.subjects.length} subjects
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <button
                          onClick={() => togglePublish(result)}
                          disabled={busyIds.includes(result._id)}
                          title={
                            result.isPublished
                              ? "Click to hide from student and parent"
                              : "Click to publish to student and parent"
                          }
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium disabled:opacity-50 ${
                            result.isPublished
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          }`}
                        >
                          {result.isPublished ? (
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                          )}
                          {busyIds.includes(result._id)
                            ? "Saving..."
                            : result.isPublished
                            ? "Published"
                            : "Draft - publish"}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedResult(result);
                              setShowResultModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => window.open(`/results/sheet/${result._id}`, "_blank")}
                            className="text-emerald-600 hover:text-emerald-900"
                            title="Open printable report sheet"
                          >
                            <Printer className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => sendResultNotification(result)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Send to Parent"
                          >
                            <Mail className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => editResult(result)}
                            className="text-amber-600 hover:text-amber-900"
                            title="Edit Result"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Result Details Modal */}
      {showResultModal && selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-screen overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Result Details -{" "}
                {selectedResult.studentId?.personalInfo?.firstName || "N/A"}{" "}
                {selectedResult.studentId?.personalInfo?.lastName || "N/A"}
              </h3>
              <button
                onClick={() => setShowResultModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Student Information
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium">
                      {selectedResult.studentId?.personalInfo?.firstName ||
                        "N/A"}{" "}
                      {selectedResult.studentId?.personalInfo?.lastName ||
                        "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedResult.studentId?.studentId || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedResult.studentId?.academicInfo?.currentClass ||
                        "N/A"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Academic Period
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium">
                      {selectedResult.academicSession}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">
                      {selectedResult.term} term
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Performance Summary
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Score</p>
                        <p className="text-lg font-bold">
                          {selectedResult.summary.totalScore}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Average</p>
                        <p className="text-lg font-bold">
                          {selectedResult.summary.averageScore.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Grade</p>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getGradeColor(
                            selectedResult.summary.overallGrade
                          )}`}
                        >
                          {selectedResult.summary.overallGrade}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Position</p>
                        <p className="text-lg font-bold">
                          {selectedResult.summary.position}
                          {getPositionSuffix(selectedResult.summary.position)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Breakdown */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Subject Breakdown
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedResult.subjects.map((subject, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {subject.subjectName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {subject.scores.total}/100
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(
                              subject.grade
                            )}`}
                          >
                            {subject.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Remarks
                </label>
                <p className="bg-gray-50 rounded-lg p-4 text-sm">
                  {selectedResult.summary.remark}
                </p>
              </div>

              {selectedResult.teacherComments && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Class Teacher's Comment
                  </label>
                  <p className="bg-gray-50 rounded-lg p-4 text-sm">
                    {selectedResult.teacherComments}
                  </p>
                </div>
              )}

              {selectedResult.principalComments && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Principal's Comment
                  </label>
                  <p className="bg-gray-50 rounded-lg p-4 text-sm">
                    {selectedResult.principalComments}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowResultModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => window.open(`/results/sheet/${selectedResult._id}`, "_blank")}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Result
              </button>
              <button
                onClick={() => sendResultNotification(selectedResult)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send to Parent
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && stats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-screen overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Results Analytics
              </h3>
              <button
                onClick={() => setShowStatsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Grade Distribution */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Grade Distribution
                </h4>
                <div className="space-y-3">
                  {Object.entries(stats.gradeDistribution).map(
                    ([grade, count]) => (
                      <div
                        key={grade}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <span
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white ${
                              grade.startsWith("A")
                                ? "bg-emerald-500"
                                : grade.startsWith("B")
                                ? "bg-blue-500"
                                : grade.startsWith("C")
                                ? "bg-amber-500"
                                : grade.startsWith("D")
                                ? "bg-orange-500"
                                : "bg-red-500"
                            }`}
                          >
                            {grade}
                          </span>
                          <span className="text-sm text-gray-600">
                            Grade {grade}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                grade.startsWith("A")
                                  ? "bg-emerald-500"
                                  : grade.startsWith("B")
                                  ? "bg-blue-500"
                                  : grade.startsWith("C")
                                  ? "bg-amber-500"
                                  : grade.startsWith("D")
                                  ? "bg-orange-500"
                                  : "bg-red-500"
                              }`}
                              style={{
                                width: `${
                                  stats.totalStudents > 0
                                    ? (count / stats.totalStudents) * 100
                                    : 0
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-12">
                            {count}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Top Performers */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Top Performers
                </h4>
                <div className="space-y-3">
                  {stats.topPerformers.slice(0, 5).map((performer) => (
                    <div
                      key={performer.position}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold flex items-center justify-center">
                          {performer.position}
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {performer.studentName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {performer.averageScore.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500">
                            Grade {performer.overallGrade}
                          </p>
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${performer.averageScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowStatsModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Result Modal */}
      {showEditModal && editingResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-6xl w-full max-h-screen overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Edit Result -{" "}
                {editingResult.studentId?.personalInfo?.firstName || "N/A"}{" "}
                {editingResult.studentId?.personalInfo?.lastName || "N/A"}
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingResult(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Student Info - Read Only */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Student Information
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Name:</span>{" "}
                      {editingResult.studentId?.personalInfo?.firstName ||
                        "N/A"}{" "}
                      {editingResult.studentId?.personalInfo?.lastName || "N/A"}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Student ID:</span>{" "}
                      {editingResult.studentId?.studentId || "N/A"}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Class:</span>{" "}
                      {editingResult.studentId?.academicInfo?.currentClass ||
                        "N/A"}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Session:</span>{" "}
                      {editingResult.academicSession}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Term:</span>{" "}
                      <span className="capitalize">{editingResult.term}</span>
                    </p>
                  </div>
                </div>

                {/* Summary - Auto calculated */}
                <div className="bg-blue-50 rounded-lg p-4 mt-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Performance Summary
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Total Score:</span>{" "}
                      {editingResult.summary.totalScore}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Average:</span>{" "}
                      {editingResult.summary.averageScore.toFixed(1)}%
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Grade:</span>{" "}
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor(
                          editingResult.summary.overallGrade
                        )}`}
                      >
                        {editingResult.summary.overallGrade}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Subjects Scores - Editable */}
              <div className="lg:col-span-2">
                <h4 className="font-medium text-gray-900 mb-3">
                  Subject Scores
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          1st CA (20)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          2nd CA (20)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          3rd CA (20)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Exam (40)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Grade
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {editingResult.subjects.map((subject, index) => (
                        <tr key={index}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {subject.subjectName}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={subject.scores.firstCA || 0}
                              onChange={(e) =>
                                updateSubjectScore(
                                  index,
                                  "firstCA",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={subject.scores.secondCA || 0}
                              onChange={(e) =>
                                updateSubjectScore(
                                  index,
                                  "secondCA",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={subject.scores.thirdCA || 0}
                              onChange={(e) =>
                                updateSubjectScore(
                                  index,
                                  "thirdCA",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="0"
                              max="40"
                              value={subject.scores.exam}
                              onChange={(e) =>
                                updateSubjectScore(
                                  index,
                                  "exam",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {subject.scores.total}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(
                                subject.grade
                              )}`}
                            >
                              {subject.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Teacher's Comment
                </label>
                <textarea
                  value={editingResult.teacherComments || ""}
                  onChange={(e) =>
                    setEditingResult((prev) =>
                      prev ? { ...prev, teacherComments: e.target.value } : null
                    )
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter teacher's comment..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Principal's Comment
                </label>
                <textarea
                  value={editingResult.principalComments || ""}
                  onChange={(e) =>
                    setEditingResult((prev) =>
                      prev
                        ? { ...prev, principalComments: e.target.value }
                        : null
                    )
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter principal's comment..."
                />
              </div>
            </div>

            {/* Attendance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School Opened (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingResult.attendance.schoolOpened}
                  onChange={(e) =>
                    setEditingResult((prev) =>
                      prev
                        ? {
                            ...prev,
                            attendance: {
                              ...prev.attendance,
                              schoolOpened: parseInt(e.target.value) || 0,
                            },
                          }
                        : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Times Present
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingResult.attendance.timesPresent}
                  onChange={(e) =>
                    setEditingResult((prev) =>
                      prev
                        ? {
                            ...prev,
                            attendance: {
                              ...prev.attendance,
                              timesPresent: parseInt(e.target.value) || 0,
                            },
                          }
                        : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Times Absent
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingResult.attendance.timesAbsent}
                  onChange={(e) =>
                    setEditingResult((prev) =>
                      prev
                        ? {
                            ...prev,
                            attendance: {
                              ...prev.attendance,
                              timesAbsent: parseInt(e.target.value) || 0,
                            },
                          }
                        : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingResult(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateResult}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminResultsView;
