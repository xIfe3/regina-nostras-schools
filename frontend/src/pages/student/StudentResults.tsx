import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Search,
  Filter,
  BookOpen,
  Award,
  Calendar,
  Eye,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

interface Result {
  _id: string;
  academicSession: string;
  term: string;
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
    position?: number;
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

const StudentResults: React.FC = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [filteredResults, setFilteredResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [termFilter, setTermFilter] = useState("all");
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchResults();
  }, []);

  useEffect(() => {
    filterResults();
  }, [results, searchTerm, sessionFilter, termFilter]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await api.get("/results/student");

      console.log("Response from result", response);

      const resultsData = response.data.data || response.data || [];
      setResults(resultsData);
    } catch (error) {
      console.error("Error fetching results:", error);
      toast.error("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const filterResults = () => {
    let filtered = [...results];

    if (searchTerm) {
      filtered = filtered.filter(
        (result) =>
          result.academicSession
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          result.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.subjects.some((subject) =>
            subject.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    if (sessionFilter !== "all") {
      filtered = filtered.filter(
        (result) => result.academicSession === sessionFilter
      );
    }

    if (termFilter !== "all") {
      filtered = filtered.filter((result) => result.term === termFilter);
    }

    // Sort by most recent first
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setFilteredResults(filtered);
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

  const getPerformanceColor = (score: number): string => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const downloadResult = (result: Result) => {
    // Create a formatted text content for the result
    const content = `
REGINA NOSTRAS SCHOOLS
STUDENT RESULT SHEET

Academic Session: ${result.academicSession}
Term: ${result.term.charAt(0).toUpperCase() + result.term.slice(1)} Term
Overall Score: ${result.summary.averageScore}%
Overall Grade: ${result.summary.overallGrade}
Position: ${result.summary.position} out of ${result.summary.totalStudents}

SUBJECT BREAKDOWN:
${result.subjects
  .map(
    (subject) =>
      `${subject.subjectName}: ${subject.scores.total}% (Grade ${subject.grade})`
  )
  .join("\n")}

${result.teacherComments ? `Teacher's Comments: ${result.teacherComments}` : ""}
${
  result.principalComments
    ? `Principal's Comments: ${result.principalComments}`
    : ""
}

${
  result.attendance
    ? `Attendance: ${result.attendance.timesPresent}/${
        result.attendance.schoolOpened
      } (${Math.round(
        (result.attendance.timesPresent / result.attendance.schoolOpened) * 100
      )}%)`
    : ""
}

${
  result.nextTermBegins
    ? `Next Term Begins: ${new Date(
        result.nextTermBegins
      ).toLocaleDateString()}`
    : ""
}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `result_${result.academicSession.replace(
      "/",
      "-"
    )}_${result.term.replace(" ", "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Result downloaded successfully");
  };

  const exportAllResults = () => {
    if (filteredResults.length === 0) {
      toast.error("No results to export");
      return;
    }

    const csvContent = [
      "Academic Session,Term,Overall Score,Overall Grade,Position,Total Students,Date",
      ...filteredResults.map((result) =>
        [
          result.academicSession,
          result.term,
          result.summary.averageScore,
          result.summary.overallGrade,
          result.summary.position,
          result.summary.totalStudents,
          new Date(result.createdAt).toLocaleDateString(),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my_results_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Results exported successfully");
  };

  // Get unique sessions and terms for filters
  const uniqueSessions = Array.from(
    new Set(results.map((r) => r.academicSession))
  );
  const uniqueTerms = Array.from(new Set(results.map((r) => r.term)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Results</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and download your academic results
            </p>
          </div>
          <button
            onClick={exportAllResults}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export All
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search results..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
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
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">All Terms</option>
            {uniqueTerms.map((term) => (
              <option key={term} value={term}>
                {term.charAt(0).toUpperCase() + term.slice(1)} Term
              </option>
            ))}
          </select>
          <div className="flex items-center text-sm text-gray-500">
            <Filter className="h-4 w-4 mr-1" />
            {filteredResults.length} result(s) found
          </div>
        </div>
      </div>

      {/* Results List */}
      {filteredResults.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No results found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {results.length === 0
              ? "Your results haven't been uploaded yet."
              : "Try adjusting your search or filter criteria."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredResults.map((result, index) => (
            <motion.div
              key={result._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {result.academicSession} -{" "}
                      {result.term.charAt(0).toUpperCase() +
                        result.term.slice(1)}{" "}
                      term
                    </h3>
                    <p className="text-sm text-gray-500">
                      Published on{" "}
                      {new Date(result.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Overall Score</p>
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
                          {result.attendance.schoolOpened} (
                          {Math.round(
                            (result.attendance.timesPresent /
                              result.attendance.schoolOpened) *
                              100
                          )}
                          %)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subject Scores Preview */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Subject Scores
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {result.subjects.slice(0, 8).map((subject) => (
                      <div
                        key={subject.subjectCode}
                        className="text-xs bg-gray-50 rounded p-2"
                      >
                        <p className="font-medium truncate">
                          {subject.subjectName}
                        </p>
                        <p
                          className={`${getPerformanceColor(
                            subject.scores.total
                          )}`}
                        >
                          {subject.scores.total}% (Grade {subject.grade})
                        </p>
                      </div>
                    ))}
                    {result.subjects.length > 8 && (
                      <div className="text-xs bg-gray-100 rounded p-2 flex items-center justify-center">
                        +{result.subjects.length - 8} more
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => {
                      setSelectedResult(result);
                      setShowDetails(true);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </button>
                  <button
                    onClick={() => downloadResult(result)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Result Details Modal */}
      {showDetails && selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Result Details - {selectedResult.academicSession}{" "}
                {selectedResult.term.charAt(0).toUpperCase() +
                  selectedResult.term.slice(1)}{" "}
                Term
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Eye className="h-6 w-6" />
              </button>
            </div>

            {/* Detailed Subject Breakdown */}
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CA Scores
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exam
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedResult.subjects.map((subject) => (
                      <tr key={subject.subjectCode}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {subject.subjectName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {[
                            subject.scores.firstCA &&
                              `CA1: ${subject.scores.firstCA}`,
                            subject.scores.secondCA &&
                              `CA2: ${subject.scores.secondCA}`,
                            subject.scores.thirdCA &&
                              `CA3: ${subject.scores.thirdCA}`,
                          ]
                            .filter(Boolean)
                            .join(", ") || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {subject.scores.exam}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {subject.scores.total}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
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

              {/* Comments Section */}
              {(selectedResult.teacherComments ||
                selectedResult.principalComments) && (
                <div className="space-y-4">
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
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => downloadResult(selectedResult)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
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

export default StudentResults;
