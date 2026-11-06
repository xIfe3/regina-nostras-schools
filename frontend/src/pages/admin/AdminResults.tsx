import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Send,
  Eye,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface UploadError {
  row: number;
  studentId?: string;
  error: string;
}

interface SavedResult {
  id: string;
  row: number;
  studentId: string;
  studentName: string;
  class: string;
  averageScore: number;
  overallGrade: string;
  replaced: boolean;
}

interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    totalRows: number;
    successfulUploads: number;
    created: number;
    replaced: number;
    errors: UploadError[];
    results: SavedResult[];
    groups: { academicSession: string; term: string; class: string }[];
  };
}

/** Academic year starts in September: Nov 2025 -> 2025/2026, Mar 2026 -> 2025/2026 */
const currentSession = () => {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 8 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
};

const DEFAULT_SUBJECTS =
  "Mathematics, English, Basic Science, Basic Technology, Social Studies, Civic Education, Computer Studies, CRS, Agricultural Science, French";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const AdminResults: React.FC = () => {
  const navigate = useNavigate();

  // Template options
  const [classes, setClasses] = useState<string[]>([]);
  const [templateClass, setTemplateClass] = useState("");
  const [templateSession, setTemplateSession] = useState(currentSession());
  const [templateTerm, setTemplateTerm] = useState("first");
  const [templateSubjects, setTemplateSubjects] = useState(DEFAULT_SUBJECTS);
  const [downloading, setDownloading] = useState(false);

  // Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [upload, setUpload] = useState<UploadResponse | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    api
      .get("/admin/students?limit=1000")
      .then((res) => {
        const list = Array.from(
          new Set(
            (res.data.data || [])
              .map(
                (s: { academicInfo?: { currentClass?: string } }) =>
                  s.academicInfo?.currentClass
              )
              .filter(Boolean)
          )
        ) as string[];
        setClasses(list.sort());
      })
      .catch(() => undefined);
  }, []);

  const downloadTemplate = async () => {
    try {
      setDownloading(true);
      const response = await api.get("/results/bulk-template", {
        responseType: "blob",
        params: {
          class: templateClass || undefined,
          academicSession: templateSession || undefined,
          term: templateTerm || undefined,
          subjects: templateSubjects,
        },
      });
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `results_${(templateClass || "sample").replace(/\s+/g, "_")}_${templateTerm}_term.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(
        templateClass
          ? `Template for ${templateClass} downloaded`
          : "Sample template downloaded"
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not download template"
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "xls") {
      toast.error(
        "Old .xls files are not supported. In Excel use File > Save As > Excel Workbook (.xlsx) or CSV."
      );
      return;
    }
    if (ext !== "xlsx" && ext !== "csv") {
      toast.error("Please choose an Excel (.xlsx) or CSV file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size should be less than 10MB");
      return;
    }
    setSelectedFile(file);
    setUpload(null);
    setPublished(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }
    try {
      setUploading(true);
      setPublished(false);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("replaceExisting", String(replaceExisting));

      const response = await api.post("/results/bulk-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const body: UploadResponse = response.data;
      setUpload(body);

      const saved = body.data?.successfulUploads || 0;
      const failed = body.data?.errors.length || 0;
      if (saved > 0 && failed === 0) toast.success(`${saved} result(s) saved`);
      else if (saved > 0) toast(`${saved} saved, ${failed} row(s) need fixing`, { icon: "⚠️" });
      else toast.error("No results were saved. See the errors below.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload results";
      setUpload({ success: false, message });
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const publishUploaded = async () => {
    const ids = upload?.data?.results.map((r) => r.id) || [];
    if (ids.length === 0) return;
    try {
      setPublishing(true);
      const res = await api.post("/results/publish", {
        resultIds: ids,
        isPublished: true,
      });
      setPublished(true);
      toast.success(res.data.message || "Results published");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not publish results");
    } finally {
      setPublishing(false);
    }
  };

  const reviewUploaded = () => {
    const g = upload?.data?.groups?.[0];
    const params = new URLSearchParams();
    if (g && upload?.data?.groups.length === 1) {
      params.set("session", g.academicSession);
      params.set("term", g.term);
      params.set("class", g.class);
    }
    navigate(`/admin/results/view${params.toString() ? `?${params}` : ""}`);
  };

  const downloadErrors = () => {
    const errors = upload?.data?.errors || [];
    if (errors.length === 0) return;
    const csv = [
      "Row,Student ID,Problem",
      ...errors.map(
        (e) => `${e.row || ""},"${e.studentId || ""}","${e.error.replace(/"/g, '""')}"`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "result_upload_errors.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const data = upload?.data;
  const savedCount = data?.successfulUploads || 0;
  const errorCount = data?.errors.length || 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Results</h1>
          <p className="mt-1 text-sm text-gray-500">
            Download a class sheet, fill in the scores in Excel, upload it, then
            publish.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/results/view")}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        >
          <FileText className="h-4 w-4 mr-2" />
          View &amp; publish results
        </button>
      </div>

      {/* Steps */}
      <ol className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
        {[
          ["1", "Download the sheet", "Pick a class. Every student's ID and name are filled in for you."],
          ["2", "Fill in the scores", "One column per subject, a score from 0 to 100. Leave blank if a student doesn't take a subject."],
          ["3", "Upload it here", "Results are saved as drafts. Students and parents can't see drafts yet."],
          ["4", "Publish", "Publish to show the results to students and parents. They get an email."],
        ].map(([n, title, text]) => (
          <li key={n} className="bg-white shadow-sm rounded-lg p-4 flex">
            <span className="flex-shrink-0 h-7 w-7 rounded-full bg-[#0C4A9F] text-white flex items-center justify-center font-semibold mr-3">
              {n}
            </span>
            <div>
              <p className="font-medium text-gray-900">{title}</p>
              <p className="text-gray-500 mt-0.5">{text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Step 1: template */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-sm rounded-lg p-6 space-y-4"
        >
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Download className="h-5 w-5 text-[#0C4A9F] mr-2" />
            1. Download the results sheet
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
              <select
                value={templateClass}
                onChange={(e) => setTemplateClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Sample (no students)</option>
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Session</label>
              <input
                value={templateSession}
                onChange={(e) => setTemplateSession(e.target.value)}
                placeholder="2025/2026"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Term</label>
              <select
                value={templateTerm}
                onChange={(e) => setTemplateTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="first">First</option>
                <option value="second">Second</option>
                <option value="third">Third</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Subjects (comma separated, in the order you want the columns)
            </label>
            <textarea
              value={templateSubjects}
              onChange={(e) => setTemplateSubjects(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <button
            onClick={downloadTemplate}
            disabled={downloading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-[#0C4A9F] hover:bg-[#0A2F66] disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloading
              ? "Preparing..."
              : templateClass
              ? `Download sheet for ${templateClass}`
              : "Download sample sheet"}
          </button>

          <details className="text-sm text-gray-600">
            <summary className="cursor-pointer font-medium text-gray-700">
              Column guide
            </summary>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>
                <strong>Student ID, Academic Session, Term, Class</strong> are
                required on every row. Term can be written first / 1st / First
                Term.
              </li>
              <li>
                <strong>Subject columns:</strong> one per subject with the final
                score (0–100). To record CA separately, use columns like
                "Mathematics CA1", "Mathematics CA2", "Mathematics CA3" (each
                out of 10) and "Mathematics Exam" (out of 70); they are added
                up.
              </li>
              <li>
                Blank or "AB" means the student didn't take that subject.
              </li>
              <li>
                Optional: School_Opened, Times_Present, Times_Absent,
                punctuality / neatness / politeness / honesty / leadership /
                relationship (excellent, very good, good, fair, poor),
                Teacher_Comments, Principal_Comments, Next_Term_Begins
                (e.g. 2026-01-12).
              </li>
              <li>The Student Name column is only there to help you; it's ignored.</li>
              <li>Grades, totals, averages and class positions are calculated automatically.</li>
            </ul>
          </details>
        </motion.div>

        {/* Step 3: upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white shadow-sm rounded-lg p-6 space-y-4"
        >
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Upload className="h-5 w-5 text-[#0C4A9F] mr-2" />
            3. Upload the filled sheet
          </h3>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            {selectedFile ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  <FileText className="h-8 w-8 text-green-600 mr-3 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setUpload(null);
                  }}
                  className="text-red-600 hover:text-red-800"
                  aria-label="Remove file"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <label className="block text-center cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Click to choose a file
                </span>
                <span className="text-xs text-gray-500">
                  Excel (.xlsx) or CSV, up to 10MB
                </span>
                <input
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            )}
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <strong>Replace existing results</strong> for the same student,
              session and term (use this to upload a corrected sheet). Already
              published results stay published with the new scores.
            </span>
          </label>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full flex justify-center items-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-[#0C4A9F] hover:bg-[#0A2F66] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload results
              </>
            )}
          </button>
        </motion.div>
      </div>

      {/* Upload outcome */}
      {upload && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-white shadow-sm rounded-lg p-6 space-y-5"
        >
          <div className="flex items-start">
            {savedCount > 0 && errorCount === 0 ? (
              <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
            ) : (
              <AlertCircle
                className={`h-6 w-6 mr-3 flex-shrink-0 ${
                  savedCount > 0 ? "text-yellow-500" : "text-red-500"
                }`}
              />
            )}
            <div>
              <p className="font-medium text-gray-900">{upload.message}</p>
              {data && (
                <p className="text-sm text-gray-500 mt-1">
                  {savedCount} saved ({data.created} new, {data.replaced} replaced)
                  {errorCount > 0 ? ` · ${errorCount} row(s) with problems` : ""}
                </p>
              )}
            </div>
          </div>

          {/* Step 4: publish */}
          {savedCount > 0 && (
            <div
              className={`rounded-md p-4 ${
                published ? "bg-green-50 border border-green-200" : "bg-blue-50 border border-blue-200"
              }`}
            >
              {published ? (
                <p className="text-sm text-green-800">
                  Published. Students and parents can now see these results and
                  are being emailed.
                </p>
              ) : (
                <>
                  <p className="text-sm text-blue-900 font-medium">
                    4. These results are drafts. Students and parents can't see
                    them until you publish.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      onClick={publishUploaded}
                      disabled={publishing}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {publishing ? "Publishing..." : `Publish these ${savedCount} now`}
                    </button>
                    <button
                      onClick={reviewUploaded}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review first
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Saved list */}
          {data && data.results.length > 0 && (
            <details>
              <summary className="cursor-pointer text-sm font-medium text-gray-700">
                Show saved results ({data.results.length})
              </summary>
              <div className="mt-3 overflow-x-auto max-h-80 overflow-y-auto">
                <table className="min-w-full text-sm divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Row", "Student", "Class", "Average", "Grade", ""].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.results.map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-2 text-gray-500">{r.row}</td>
                        <td className="px-3 py-2">
                          {r.studentName}{" "}
                          <span className="text-gray-400">({r.studentId})</span>
                        </td>
                        <td className="px-3 py-2">{r.class}</td>
                        <td className="px-3 py-2">{r.averageScore}%</td>
                        <td className="px-3 py-2">{r.overallGrade}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {r.replaced ? "replaced" : "new"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}

          {/* Errors */}
          {errorCount > 0 && data && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-red-800">
                  Rows that were not saved — fix them in your sheet and upload
                  again (only these rows need re-uploading)
                </p>
                <button
                  onClick={downloadErrors}
                  className="text-xs font-medium text-red-700 underline"
                >
                  Download list
                </button>
              </div>
              <ul className="text-sm text-red-700 space-y-1 max-h-60 overflow-y-auto">
                {data.errors.map((e, i) => (
                  <li key={i}>
                    {e.row ? `Row ${e.row}` : "File"}
                    {e.studentId ? ` (${e.studentId})` : ""}: {e.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!data && (
            <p className="text-sm text-red-700">{upload.message}</p>
          )}
        </motion.div>
      )}

      {data?.groups && data.groups.length > 0 && (
        <p className="mt-4 text-xs text-gray-500">
          Class positions were recalculated for:{" "}
          {data.groups
            .map((g) => `${g.class} (${g.academicSession}, ${capitalize(g.term)} term)`)
            .join("; ")}
        </p>
      )}
    </div>
  );
};

export default AdminResults;
