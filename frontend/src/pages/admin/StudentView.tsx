import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  BookOpen,
  Camera,
  Download,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

interface Student {
  _id: string;
  userId: string;
  studentId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: string;
    gender: "male" | "female";
    bloodGroup?: string;
    nationality: string;
    stateOfOrigin: string;
    localGovernmentArea: string;
    religion?: string;
    profilePhoto?: string;
  };
  contactInfo: {
    email: string;
    phoneNumber?: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode?: string;
      country: string;
    };
  };
  parentGuardianInfo?: {
    father?: {
      name: string;
      occupation: string;
      phoneNumber: string;
      email?: string;
    };
    mother?: {
      name: string;
      occupation: string;
      phoneNumber: string;
      email?: string;
    };
    guardian?: {
      name: string;
      relationship: string;
      occupation: string;
      phoneNumber: string;
      email?: string;
    };
  };
  academicInfo: {
    currentClass: string;
    classArm?: string;
    admissionDate: string;
    graduationDate?: string;
    status: "active" | "graduated" | "transferred" | "suspended";
    previousSchool?: string;
  };
  medicalInfo?: {
    allergies?: string[];
    medications?: string[];
    emergencyContact?: {
      name: string;
      relationship: string;
      phoneNumber: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

const StudentView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchStudent();
    }
  }, [id]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/students/${id}`);
      setStudent(response.data.data);
    } catch (error) {
      console.error("Error fetching student:", error);
      toast.error("Failed to fetch student details");
      navigate("/admin/students");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!student) return;

    try {
      await api.delete(`/admin/students/${student._id}`);
      toast.success("Student deleted successfully");
      navigate("/admin/students");
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student");
    }
  };

  const downloadStudentRecord = () => {
    if (!student) return;

    const studentData = {
      "Student ID": student.studentId,
      "Full Name": `${student.personalInfo.firstName} ${
        student.personalInfo.middleName || ""
      } ${student.personalInfo.lastName}`.trim(),
      Email: student.contactInfo.email,
      Phone: student.contactInfo.phoneNumber || "Not provided",
      "Date of Birth": new Date(
        student.personalInfo.dateOfBirth
      ).toLocaleDateString(),
      Gender: student.personalInfo.gender,
      "Blood Group": student.personalInfo.bloodGroup || "Not provided",
      Nationality: student.personalInfo.nationality,
      "State of Origin": student.personalInfo.stateOfOrigin,
      LGA: student.personalInfo.localGovernmentArea,
      Religion: student.personalInfo.religion || "Not provided",
      "Current Class": student.academicInfo.currentClass,
      "Class Arm": student.academicInfo.classArm || "Not provided",
      Status: student.academicInfo.status,
      "Admission Date": new Date(
        student.academicInfo.admissionDate
      ).toLocaleDateString(),
      "Previous School": student.academicInfo.previousSchool || "Not provided",
      "Father Name": student.parentGuardianInfo?.father?.name || "Not provided",
      "Father Phone":
        student.parentGuardianInfo?.father?.phoneNumber || "Not provided",
      "Father Email":
        student.parentGuardianInfo?.father?.email || "Not provided",
      "Mother Name": student.parentGuardianInfo?.mother?.name || "Not provided",
      "Mother Phone":
        student.parentGuardianInfo?.mother?.phoneNumber || "Not provided",
      "Mother Email":
        student.parentGuardianInfo?.mother?.email || "Not provided",
      "Guardian Name":
        student.parentGuardianInfo?.guardian?.name || "Not provided",
      "Guardian Phone":
        student.parentGuardianInfo?.guardian?.phoneNumber || "Not provided",
      "Guardian Email":
        student.parentGuardianInfo?.guardian?.email || "Not provided",
      Address: `${student.contactInfo.address.street}, ${student.contactInfo.address.city}, ${student.contactInfo.address.state}, ${student.contactInfo.address.country}`,
    };

    const csvContent = [
      "Field,Value",
      ...Object.entries(studentData).map(
        ([key, value]) => `"${key}","${value}"`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student_${student.studentId}_record.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg">Student not found</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/admin/students")}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {student.personalInfo.firstName} {student.personalInfo.lastName}
              </h1>
              <p className="text-sm text-gray-500">
                Student ID: {student.studentId}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={downloadStudentRecord}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Record
            </button>
            <Link
              to={`/admin/students/${student._id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Student
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Student Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                {student.personalInfo.profilePhoto ? (
                  <img
                    className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
                    src={student.personalInfo.profilePhoto}
                    alt={`${student.personalInfo.firstName} ${student.personalInfo.lastName}`}
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-gray-300 flex items-center justify-center border-4 border-white shadow-lg">
                    <Camera className="h-8 w-8 text-gray-500" />
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {student.personalInfo.firstName} {student.personalInfo.lastName}
              </h3>
              <p className="text-gray-500">
                {student.academicInfo.currentClass}
              </p>
              <div className="mt-4">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    student.academicInfo.status === "active"
                      ? "bg-green-100 text-green-800"
                      : student.academicInfo.status === "suspended"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {student.academicInfo.status.charAt(0).toUpperCase() +
                    student.academicInfo.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center text-gray-600">
                <Mail className="h-4 w-4 mr-3" />
                <span className="text-sm">{student.contactInfo.email}</span>
              </div>
              {student.contactInfo.phoneNumber && (
                <div className="flex items-center text-gray-600">
                  <Phone className="h-4 w-4 mr-3" />
                  <span className="text-sm">
                    {student.contactInfo.phoneNumber}
                  </span>
                </div>
              )}
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-3" />
                <span className="text-sm">
                  Born{" "}
                  {new Date(
                    student.personalInfo.dateOfBirth
                  ).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Details Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white shadow rounded-lg p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Full Name
                </label>
                <p className="text-sm text-gray-900">
                  {student.personalInfo.firstName}{" "}
                  {student.personalInfo.middleName}{" "}
                  {student.personalInfo.lastName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Gender
                </label>
                <p className="text-sm text-gray-900 capitalize">
                  {student.personalInfo.gender}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Blood Group
                </label>
                <p className="text-sm text-gray-900">
                  {student.personalInfo.bloodGroup || "Not specified"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Nationality
                </label>
                <p className="text-sm text-gray-900">
                  {student.personalInfo.nationality}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  State of Origin
                </label>
                <p className="text-sm text-gray-900">
                  {student.personalInfo.stateOfOrigin}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Local Government Area
                </label>
                <p className="text-sm text-gray-900">
                  {student.personalInfo.localGovernmentArea}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Religion
                </label>
                <p className="text-sm text-gray-900">
                  {student.personalInfo.religion || "Not specified"}
                </p>
              </div>
            </div>
            {student.medicalInfo &&
              (student.medicalInfo.allergies?.length ||
                student.medicalInfo.medications?.length ||
                student.medicalInfo.emergencyContact) && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-500">
                    Medical Information
                  </label>
                  <div className="text-sm text-gray-900 mt-1 space-y-1">
                    {student.medicalInfo.allergies?.length && (
                      <p>
                        <strong>Allergies:</strong>{" "}
                        {student.medicalInfo.allergies.join(", ")}
                      </p>
                    )}
                    {student.medicalInfo.medications?.length && (
                      <p>
                        <strong>Medications:</strong>{" "}
                        {student.medicalInfo.medications.join(", ")}
                      </p>
                    )}
                    {student.medicalInfo.emergencyContact && (
                      <p>
                        <strong>Emergency Contact:</strong>{" "}
                        {student.medicalInfo.emergencyContact.name} (
                        {student.medicalInfo.emergencyContact.relationship}) -{" "}
                        {student.medicalInfo.emergencyContact.phoneNumber}
                      </p>
                    )}
                  </div>
                </div>
              )}
          </motion.div>

          {/* Academic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white shadow rounded-lg p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Academic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Current Class
                </label>
                <p className="text-sm text-gray-900">
                  {student.academicInfo.currentClass}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Class Arm
                </label>
                <p className="text-sm text-gray-900">
                  {student.academicInfo.classArm || "Not specified"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Admission Date
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(
                    student.academicInfo.admissionDate
                  ).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Academic Status
                </label>
                <p className="text-sm text-gray-900 capitalize">
                  {student.academicInfo.status}
                </p>
              </div>
              {student.academicInfo.previousSchool && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">
                    Previous School
                  </label>
                  <p className="text-sm text-gray-900">
                    {student.academicInfo.previousSchool}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white shadow rounded-lg p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Contact Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Address
                </label>
                <p className="text-sm text-gray-900">
                  {student.contactInfo.address.street},{" "}
                  {student.contactInfo.address.city},{" "}
                  {student.contactInfo.address.state},{" "}
                  {student.contactInfo.address.country}
                  {student.contactInfo.address.postalCode &&
                    ` (${student.contactInfo.address.postalCode})`}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Parent/Guardian Information */}
          {student.parentGuardianInfo &&
            (student.parentGuardianInfo.father ||
              student.parentGuardianInfo.mother ||
              student.parentGuardianInfo.guardian) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white shadow rounded-lg p-6"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Parent/Guardian Information
                </h3>
                <div className="space-y-6">
                  {student.parentGuardianInfo.father && (
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-2">
                        Father
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Name
                          </label>
                          <p className="text-sm text-gray-900">
                            {student.parentGuardianInfo.father.name}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Phone
                          </label>
                          <p className="text-sm text-gray-900">
                            {student.parentGuardianInfo.father.phoneNumber}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Email
                          </label>
                          <p className="text-sm text-gray-900">
                            {student.parentGuardianInfo.father.email ||
                              "Not provided"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Occupation
                          </label>
                          <p className="text-sm text-gray-900">
                            {student.parentGuardianInfo.father.occupation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {student.parentGuardianInfo.mother && (
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-2">
                        Mother
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Name
                          </label>
                          <p className="text-sm text-gray-900">
                            {student.parentGuardianInfo.mother.name}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Phone
                          </label>
                          <p className="text-sm text-gray-900">
                            {student.parentGuardianInfo.mother.phoneNumber}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Email
                          </label>
                          <p className="text-sm text-gray-900">
                            {student.parentGuardianInfo.mother.email ||
                              "Not provided"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Occupation
                          </label>
                          <p className="text-sm text-gray-900">
                            {student.parentGuardianInfo.mother.occupation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {student.parentGuardianInfo.guardian && (
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-2">
                        Guardian
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Name
                          </label>
                          <p className="text-sm text-gray-900">
                            {student.parentGuardianInfo.guardian.name}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Phone
                          </label>
                          <p className="text-sm text-gray-900">
                            {student.parentGuardianInfo.guardian.phoneNumber}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Email
                          </label>
                          <p className="text-sm text-gray-900">
                            {student.parentGuardianInfo.guardian.email ||
                              "Not provided"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Occupation
                          </label>
                          <p className="text-sm text-gray-900">
                            {student.parentGuardianInfo.guardian.occupation}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Relationship
                          </label>
                          <p className="text-sm text-gray-900">
                            {student.parentGuardianInfo.guardian.relationship}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Delete Student
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">
                    {student.personalInfo.firstName}{" "}
                    {student.personalInfo.lastName}
                  </span>
                  ? This action cannot be undone and will remove all associated
                  data.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStudent}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentView;
