import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Download,
  Users,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Loader,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";

interface BulkUploadResult {
  success: any[];
  errors: Array<{
    row: number;
    studentId?: string;
    error: string;
  }>;
}

const AdminStudentBulkUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(
    null
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast.error("Please upload a CSV file");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.get("/admin/students/bulk-template", {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "student_bulk_upload_template.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Template downloaded successfully");
    } catch (error) {
      console.error("Error downloading template:", error);

      // Fallback: create a basic template
      const templateContent = [
        "firstName,lastName,email,phoneNumber,currentClass,dateOfBirth,gender,address,parentName,parentPhone,parentEmail",
        "John,Doe,john.doe@email.com,08012345678,JSS 1A,2010-01-15,male,123 Main St Lagos,Mr. Doe,08098765432,parent@email.com",
        "Jane,Smith,jane.smith@email.com,08023456789,JSS 1B,2010-03-20,female,456 Oak Ave Abuja,Mrs. Smith,08087654321,mother@email.com",
      ].join("\n");

      const blob = new Blob([templateContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "student_bulk_upload_template.csv";
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("Template downloaded successfully");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/admin/students/bulk-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const result = response.data.data;
      setUploadResult(result);

      if (result.success.length > 0) {
        toast.success(
          `Successfully uploaded ${result.success.length} students`
        );
      }
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} errors occurred during upload`);
      }
    } catch (error: any) {
      console.error("Error uploading students:", error);
      toast.error(error.response?.data?.message || "Failed to upload students");
    } finally {
      setUploading(false);
    }
  };

  const downloadErrors = () => {
    if (!uploadResult?.errors.length) return;

    const errorContent = [
      "Row,Student ID,Error",
      ...uploadResult.errors.map(
        (error) => `${error.row},${error.studentId || ""},${error.error}`
      ),
    ].join("\n");

    const blob = new Blob([errorContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `upload_errors_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Error report downloaded");
  };

  const resetUpload = () => {
    setFile(null);
    setUploadResult(null);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            to="/admin/students"
            className="mr-4 p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bulk Upload Students
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Upload multiple students at once using a CSV file
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white shadow rounded-lg p-6"
          >
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Upload CSV File
            </h2>

            {/* Download Template */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start">
                <Download className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-800">
                    Download Template
                  </h3>
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

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".csv"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    CSV files only, up to 10MB
                  </p>
                  {file && (
                    <p className="text-sm text-green-600 font-medium">
                      Selected: {file.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Upload Button */}
            <div className="flex justify-end space-x-3">
              {file && (
                <button
                  onClick={resetUpload}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {uploading ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Students
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white shadow rounded-lg p-6"
          >
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Instructions
            </h2>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-900">
                    Download the CSV template to see the required format
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-900">
                    Fill in the student information following the template
                    format
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-900">
                    Upload the completed CSV file using the upload area
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-900">
                    Review the upload results and fix any errors if needed
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Important Notes
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Email addresses must be unique for each student</li>
                      <li>Date format should be YYYY-MM-DD</li>
                      <li>Gender should be either "male" or "female"</li>
                      <li>All required fields must be filled</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Upload Results */}
        {uploadResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white shadow rounded-lg p-6"
          >
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Upload Results
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Successfully Added
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {uploadResult.success.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-800">Errors</p>
                  <p className="text-2xl font-bold text-red-900">
                    {uploadResult.errors.length}
                  </p>
                </div>
              </div>
            </div>

            {uploadResult.errors.length > 0 && (
              <div className="border border-gray-200 rounded-md">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-900">
                    Error Details
                  </h3>
                  <button
                    onClick={downloadErrors}
                    className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Error Report
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {uploadResult.errors.slice(0, 10).map((error, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 border-b border-gray-200 last:border-b-0"
                    >
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">Row {error.row}:</span>{" "}
                        {error.error}
                        {error.studentId && (
                          <span className="text-gray-500">
                            {" "}
                            (ID: {error.studentId})
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                  {uploadResult.errors.length > 10 && (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      ... and {uploadResult.errors.length - 10} more errors.
                      Download the full report to see all errors.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={resetUpload}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Upload Another File
              </button>
              <Link
                to="/admin/students"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                <Users className="h-4 w-4 mr-2" />
                View All Students
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminStudentBulkUpload;
