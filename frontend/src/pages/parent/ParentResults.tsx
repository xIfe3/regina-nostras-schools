import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Calendar,
  Download,
  Eye,
  FileText,
  X,
  Printer,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { parentAPI } from "../../services/api";
import { childFullName, useParentContext } from "./parentContext";

interface Result {
  _id: string;
  academicSession: string;
  term: string;
  class?: string;
  subjects: Array<{
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
  }>;
  summary: {
    totalScore: number;
    averageScore: number;
    overallGrade: string;
    position: number;
    totalStudents: number;
    remark: string;
  };
  teacherComments?: string;
  principalComments?: string;
  attendance?: {
    schoolOpened: number;
    timesPresent: number;
    timesAbsent: number;
  };
  nextTermBegins?: string;
  createdAt: string;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const getGradeColor = (grade: string): string => {
  switch (grade.charAt(0).toUpperCase()) {
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

const getPerformanceColor = (score: number): string => {
  if (score >= 90) return "text-green-600";
  if (score >= 80) return "text-blue-600";
  if (score >= 70) return "text-yellow-600";
  if (score >= 60) return "text-orange-600";
  return "text-red-600";
};

const attendancePercent = (a: Result["attendance"]) =>
  a && a.schoolOpened > 0
    ? Math.round((a.timesPresent / a.schoolOpened) * 100)
    : null;

const ParentResults: React.FC = () => {
  const { selectedChild } = useParentContext();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionFilter, setSessionFilter] = useState("all");
  const [termFilter, setTermFilter] = useState("all");
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!selectedChild) return;
    let cancelled = false;
    setLoading(true);
    setSessionFilter("all");
    setTermFilter("all");
    parentAPI
      .getChildResults(selectedChild._id)
      .then((res) => {
        if (!cancelled) setResults(res.data.data || []);
      })
      .catch((error) => {
        console.error("Error fetching results:", error);
        if (!cancelled) {
          setResults([]);
          toast.error("Failed to load results");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedChild]);

  const filteredResults = useMemo(
    () =>
      results.filter(
        (r) =>
          (sessionFilter === "all" || r.academicSession === sessionFilter) &&
          (termFilter === "all" || r.term === termFilter)
      ),
    [results, sessionFilter, termFilter]
  );

  const uniqueSessions = Array.from(
    new Set(results.map((r) => r.academicSession))
  );
  const uniqueTerms = Array.from(new Set(results.map((r) => r.term)));

  const downloadResult = (result: Result) => {
    if (!selectedChild) return;
    const pct = attendancePercent(result.attendance);
    const content = [
      "REGINA NOSTRAS SCHOOLS",
      "STUDENT RESULT SHEET",
      "",
      `Student: ${childFullName(selectedChild)} (${selectedChild.studentId})`,
      `Class: ${result.class || selectedChild.academicInfo.currentClass}`,
      `Academic Session: ${result.academicSession}`,
      `Term: ${capitalize(result.term)} Term`,
      `Average Score: ${result.summary.averageScore}%`,
      `Overall Grade: ${result.summary.overallGrade}`,
      `Position: ${result.summary.position} out of ${result.summary.totalStudents}`,
      "",
      "SUBJECT BREAKDOWN:",
      ...result.subjects.map(
        (s) => `${s.subjectName}: ${s.scores.total}% (Grade ${s.grade})`
      ),
      "",
      result.teacherComments
        ? `Teacher's Comments: ${result.teacherComments}`
        : "",
      result.principalComments
        ? `Principal's Comments: ${result.principalComments}`
        : "",
      result.attendance
        ? `Attendance: ${result.attendance.timesPresent}/${result.attendance.schoolOpened}${
            pct !== null ? ` (${pct}%)` : ""
          }`
        : "",
      result.nextTermBegins
        ? `Next Term Begins: ${new Date(
            result.nextTermBegins
          ).toLocaleDateString()}`
        : "",
    ]
      .join("\n")
      .trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedChild.personalInfo.firstName}_result_${result.academicSession.replace(
      "/",
      "-"
    )}_${result.term}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Result downloaded");
  };

  if (!selectedChild) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            No child is linked to your account yet. Please contact the school.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Results — {childFullName(selectedChild)}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Published term results for {selectedChild.personalInfo.firstName}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-[#0C4A9F]"
          >
            <option value="all">All Sessions</option>
            {uniqueSessions.map((session) => (
              <option key={session} value={session}>
                {session}
              </option>
            ))}
          </select>
          <select
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-[#0C4A9F]"
          >
            <option value="all">All Terms</option>
            {uniqueTerms.map((term) => (
              <option key={term} value={term}>
                {capitalize(term)} Term
              </option>
            ))}
          </select>
          <div className="flex items-center text-sm text-gray-500">
            {filteredResults.length} result(s)
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0C4A9F]"></div>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No results found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {results.length === 0
              ? "No results have been published for this child yet."
              : "Try a different session or term."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredResults.map((result, index) => {
            const pct = attendancePercent(result.attendance);
            return (
              <motion.div
                key={result._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white shadow rounded-lg overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {result.academicSession} - {capitalize(result.term)} term
                    </h3>
                    <p className="text-sm text-gray-500">
                      {result.class ? `${result.class} · ` : ""}Published{" "}
                      {new Date(result.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Average</p>
                      <p
                        className={`text-lg font-bold ${getPerformanceColor(
                          result.summary.averageScore
                        )}`}
                      >
                        {result.summary.averageScore}%
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(
                        result.summary.overallGrade
                      )}`}
                    >
                      Grade {result.summary.overallGrade}
                    </span>
                  </div>
                </div>

                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center">
                      <Award className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Position</p>
                        <p className="font-medium">
                          {result.summary.position} out of{" "}
                          {result.summary.totalStudents}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Subjects</p>
                        <p className="font-medium">
                          {result.subjects.length} subjects
                        </p>
                      </div>
                    </div>
                    {result.attendance && (
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm text-gray-500">Attendance</p>
                          <p className="font-medium">
                            {result.attendance.timesPresent}/
                            {result.attendance.schoolOpened}
                            {pct !== null ? ` (${pct}%)` : ""}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setSelectedResult(result)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                    <Link
                      to={`/results/sheet/${result._id}`}
                      className="inline-flex items-center px-3 py-2 border border-[#0C4A9F]/30 text-sm leading-4 font-medium rounded-md text-[#0C4A9F] bg-[#0C4A9F]/5 hover:bg-[#0C4A9F]/10"
                    >
                      <Printer className="h-4 w-4 mr-1" />
                      Report sheet
                    </Link>
                    <button
                      onClick={() => downloadResult(result)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#0C4A9F] hover:bg-[#0A2F66]"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Result details modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {childFullName(selectedChild)}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedResult.academicSession} ·{" "}
                  {capitalize(selectedResult.term)} Term
                  {selectedResult.class ? ` · ${selectedResult.class}` : ""}
                </p>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Subject", "CA Scores", "Exam", "Total", "Grade", "Remark"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedResult.subjects.map((subject, i) => (
                      <tr key={`${subject.subjectName}-${i}`}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {subject.subjectName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {[
                            subject.scores.firstCA != null &&
                              `CA1: ${subject.scores.firstCA}`,
                            subject.scores.secondCA != null &&
                              `CA2: ${subject.scores.secondCA}`,
                            subject.scores.thirdCA != null &&
                              `CA3: ${subject.scores.thirdCA}`,
                          ]
                            .filter(Boolean)
                            .join(", ") || "N/A"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {subject.scores.exam}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {subject.scores.total}%
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
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {subject.remark}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4 text-sm">
                <div>
                  <p className="text-gray-500">Total score</p>
                  <p className="font-medium">{selectedResult.summary.totalScore}</p>
                </div>
                <div>
                  <p className="text-gray-500">Average</p>
                  <p className="font-medium">
                    {selectedResult.summary.averageScore}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Position</p>
                  <p className="font-medium">
                    {selectedResult.summary.position} of{" "}
                    {selectedResult.summary.totalStudents}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Remark</p>
                  <p className="font-medium">{selectedResult.summary.remark}</p>
                </div>
              </div>

              {selectedResult.teacherComments && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Teacher's Comments
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {selectedResult.teacherComments}
                  </p>
                </div>
              )}
              {selectedResult.principalComments && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Principal's Comments
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {selectedResult.principalComments}
                  </p>
                </div>
              )}
              {selectedResult.nextTermBegins && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Next Term Begins
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {new Date(
                      selectedResult.nextTermBegins
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedResult(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
              <button
                onClick={() => downloadResult(selectedResult)}
                className="px-4 py-2 bg-[#0C4A9F] text-white rounded-lg hover:bg-[#0A2F66] flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ParentResults;
