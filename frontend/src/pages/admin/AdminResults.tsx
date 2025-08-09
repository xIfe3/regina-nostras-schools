import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface UploadResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

const AdminResults: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "application/vnd.ms-excel", // .xls
        "text/csv", // .csv
      ];

      if (!validTypes.includes(file.type)) {
        toast.error("Please select a valid Excel (.xlsx, .xls) or CSV file");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast.error("File size should be less than 10MB");
        return;
      }

      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await api.post("/results/bulk-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Response", response);

      // Check if there are errors in the response data
      const hasErrors =
        response.data.data?.errors && response.data.data.errors.length > 0;
      const successfulUploads = response.data.data?.successfulUploads || 0;
      const totalProcessed = response.data.data?.totalProcessed || 0;

      if (hasErrors && successfulUploads === 0) {
        // All uploads failed
        setUploadResult({
          success: false,
          message: `Upload failed. ${totalProcessed} record(s) processed, ${successfulUploads} successful.`,
          errors: response.data.data.errors.map(
            (err: any) => `Row ${err.row + 1} (${err.studentId}): ${err.error}`
          ),
        });
        toast.error("Upload failed. Please check the errors below.");
      } else if (hasErrors && successfulUploads > 0) {
        // Partial success
        setUploadResult({
          success: true,
          message: `Partial upload completed. ${successfulUploads} of ${totalProcessed} records uploaded successfully.`,
          errors: response.data.data.errors.map(
            (err: any) => `Row ${err.row + 1} (${err.studentId}): ${err.error}`
          ),
          data: response.data.data,
        });
        toast.success(
          `${successfulUploads} results uploaded successfully. Some records had errors.`
        );
      } else {
        // Complete success
        setUploadResult({
          success: true,
          message: "Results uploaded successfully!",
          data: response.data.data,
        });
        toast.success("All results uploaded successfully!");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to upload results";
      const errors = error.response?.data?.errors || [];

      setUploadResult({
        success: false,
        message: errorMessage,
        errors,
      });

      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a simple CSV template that matches the actual Result model with academic info
    const csvContent = [
      "Student ID,Academic Session,Term,Class,Mathematics,English,Science,Computer,Social Studies,French,Art,Music,Physical Education,School_Opened,Times_Present,Times_Absent,punctuality,neatness,politeness,honesty,leadership,relationship,Teacher_Comments,Principal_Comments,Next_Term_Begins",
      "RNS2024001,2023/2024,first,JSS 1A,85,78,92,88,75,70,80,85,90,90,88,2,excellent,very good,excellent,excellent,good,very good,Good performance overall. Keep it up!,Well done. Continue to work hard.,2024-09-15",
      "RNS2024002,2023/2024,first,JSS 1A,75,82,78,90,85,68,75,82,88,90,85,5,good,excellent,good,very good,excellent,good,Shows improvement in all areas.,Excellent progress this term.,2024-09-15",
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "results_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Template downloaded successfully!");
  };

  const navigate = useNavigate();

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Results Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload student results in bulk or manage individual results
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bulk Upload Section */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white shadow-sm rounded-lg p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Bulk Upload Results
            </h3>

            {/* Download Template */}
            <div className="mb-6 p-4 bg-blue-50 rounded-md">
              <div className="flex items-start">
                <Download className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-800">
                    Download Template
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Download the CSV template to see the required format for
                    bulk uploads.
                  </p>
                  <button
                    onClick={downloadTemplate}
                    className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Download Template →
                  </button>
                </div>
              </div>
            </div>

            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              {selectedFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Click to upload or drag and drop
                      </span>
                      <span className="text-xs text-gray-500">
                        Excel (.xlsx, .xls) or CSV files up to 10MB
                      </span>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div className="mt-6">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Results
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Upload Result */}
          {uploadResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-md ${
                uploadResult.success
                  ? uploadResult.errors && uploadResult.errors.length > 0
                    ? "bg-yellow-50 border border-yellow-200"
                    : "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex">
                {uploadResult.success ? (
                  uploadResult.errors && uploadResult.errors.length > 0 ? (
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  )
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
                <div className="ml-3">
                  <h3
                    className={`text-sm font-medium ${
                      uploadResult.success
                        ? uploadResult.errors && uploadResult.errors.length > 0
                          ? "text-yellow-800"
                          : "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {uploadResult.success
                      ? uploadResult.errors && uploadResult.errors.length > 0
                        ? "Partial Upload Success"
                        : "Upload Successful"
                      : "Upload Failed"}
                  </h3>
                  <div
                    className={`mt-2 text-sm ${
                      uploadResult.success
                        ? uploadResult.errors && uploadResult.errors.length > 0
                          ? "text-yellow-700"
                          : "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    <p>{uploadResult.message}</p>
                    {uploadResult.data && (
                      <div className="mt-2">
                        <p>
                          Successfully processed:{" "}
                          {uploadResult.data.successfulUploads || 0} of{" "}
                          {uploadResult.data.totalProcessed || 0} records
                        </p>
                        {uploadResult.data.errors &&
                          uploadResult.data.errors.length > 0 && (
                            <p className="text-red-600">
                              Failed: {uploadResult.data.errors.length} records
                            </p>
                          )}
                      </div>
                    )}
                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium">Errors:</p>
                        <ul className="mt-1 list-disc list-inside max-h-32 overflow-y-auto">
                          {uploadResult.errors.map((error, index) => (
                            <li key={index} className="text-xs">
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Instructions Section */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white shadow-sm rounded-lg p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Upload Instructions
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Required Columns in CSV:
                </h4>
                <ul className="mt-2 text-sm text-gray-600 space-y-1">
                  <li>
                    • <strong>Student ID:</strong> Must match existing student
                    IDs in system
                  </li>
                  <li>
                    • <strong>Academic Session:</strong> Format: YYYY/YYYY
                    (e.g., 2023/2024)
                  </li>
                  <li>
                    • <strong>Term:</strong> first, second, or third
                  </li>
                  <li>
                    • <strong>Class:</strong> e.g., JSS 1A, SSS 2B, Nursery 1
                  </li>
                  <li>
                    • <strong>Subject Scores:</strong> One column per subject
                    with final total score (0-100)
                  </li>
                  <li>
                    • <strong>Examples:</strong> Mathematics, English, Science,
                    Computer, etc.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Optional Columns:
                </h4>
                <ul className="mt-2 text-sm text-gray-600 space-y-1">
                  <li>
                    • <strong>Attendance:</strong> School_Opened, Times_Present,
                    Times_Absent
                  </li>
                  <li>
                    • <strong>Behavioral Assessment:</strong> punctuality,
                    neatness, politeness, honesty, leadership, relationship
                  </li>
                  <li>
                    • <strong>Values:</strong> excellent, very good, good, fair,
                    poor
                  </li>
                  <li>
                    • <strong>Comments:</strong> Teacher_Comments,
                    Principal_Comments
                  </li>
                  <li>
                    • <strong>Next Term:</strong> Next_Term_Begins (YYYY-MM-DD
                    format)
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-yellow-50 rounded-md">
                <h4 className="text-sm font-medium text-yellow-800">
                  Important Notes:
                </h4>
                <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                  <li>
                    • <strong>All students in one CSV:</strong> Should have the
                    same Academic Session, Term, and Class
                  </li>
                  <li>
                    • <strong>Academic Information:</strong> Must be included in
                    every row of the CSV
                  </li>
                  <li>• Student IDs must already exist in the system</li>
                  <li>
                    • Each row represents one student's complete results for the
                    term
                  </li>
                  <li>
                    • Add/remove subject columns as needed for your school
                  </li>
                  <li>
                    • Scores should be the final total for each subject (0-100)
                  </li>
                  <li>• Maximum file size: 10MB</li>
                </ul>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white shadow-sm rounded-lg p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>

            <div className="space-y-3">
              <button
                onClick={() => navigate("/admin/results/view")}
                className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      View All Results
                    </p>
                    <p className="text-xs text-gray-500">
                      Browse and search existing results
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminResults;
