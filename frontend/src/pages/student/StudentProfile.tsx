import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Edit3, Save, X, Camera, Loader } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

interface StudentProfile {
  _id: string;
  studentId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: string;
    gender: string;
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
  academicInfo: {
    currentClass: string;
    classArm?: string;
    admissionDate: string;
    graduationDate?: string;
    status: string;
    previousSchool?: string;
  };
  parentGuardianInfo: {
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
  medicalInfo?: {
    allergies?: string[];
    medications?: string[];
    emergencyContact?: {
      name: string;
      relationship: string;
      phoneNumber: string;
    };
  };
}

const StudentProfile: React.FC = () => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<StudentProfile>({
    _id: "",
    studentId: "",
    personalInfo: {
      firstName: "",
      lastName: "",
      middleName: "",
      dateOfBirth: "",
      gender: "",
      bloodGroup: "",
      nationality: "",
      stateOfOrigin: "",
      localGovernmentArea: "",
      religion: "",
      profilePhoto: "",
    },
    contactInfo: {
      email: "",
      phoneNumber: "",
      address: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      },
    },
    academicInfo: {
      currentClass: "",
      classArm: "",
      admissionDate: "",
      graduationDate: "",
      status: "",
      previousSchool: "",
    },
    parentGuardianInfo: {
      father: {
        name: "",
        occupation: "",
        phoneNumber: "",
        email: "",
      },
      mother: {
        name: "",
        occupation: "",
        phoneNumber: "",
        email: "",
      },
      guardian: {
        name: "",
        relationship: "",
        occupation: "",
        phoneNumber: "",
        email: "",
      },
    },
    medicalInfo: {
      allergies: [],
      medications: [],
      emergencyContact: {
        name: "",
        relationship: "",
        phoneNumber: "",
      },
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/student/profile");
      const profileData = response.data.data || response.data;
      setProfile(profileData);
      setFormData(profileData);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setFormData({ ...profile! });
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setFormData(profile);
    }
  };

  const handleSave = async () => {
    if (!formData) return;

    try {
      setSaving(true);
      const response = await api.put("/student/profile", formData);
      setProfile(response.data.data || response.data);
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string,
    nestedField?: string,
    deepNestedField?: string
  ) => {
    if (!formData) return;

    setFormData((prev) => {
      if (!prev) return prev;

      if (deepNestedField && nestedField) {
        // Handle three-level nesting like parentGuardianInfo.father.name
        const fieldData = prev[field as keyof StudentProfile];
        if (typeof fieldData === "object" && fieldData !== null) {
          const nestedData = (fieldData as any)[nestedField];
          return {
            ...prev,
            [field]: {
              ...fieldData,
              [nestedField]: {
                ...nestedData,
                [deepNestedField]: value,
              },
            },
          };
        }
      } else if (nestedField) {
        // Handle two-level nesting like personalInfo.firstName
        const fieldData = prev[field as keyof StudentProfile];
        if (typeof fieldData === "object" && fieldData !== null) {
          return {
            ...prev,
            [field]: {
              ...fieldData,
              [nestedField]: value,
            },
          };
        }
      }
      return prev;
    });
  };

  const handleAddressChange = (field: string, value: string) => {
    if (!formData) return;

    setFormData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          address: {
            ...prev.contactInfo.address,
            [field]: value,
          },
        },
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md">
          <User className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No profile found
          </h3>
          <p className="text-gray-600">
            Please contact the school administration.
          </p>
        </div>
      </div>
    );
  }

  const currentData = editing ? formData! : profile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Profile
              </h1>
              <p className="text-gray-600">
                Manage your personal information and account settings
              </p>
            </div>
            <div className="flex space-x-3">
              {!editing ? (
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {saving ? (
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Profile Picture and Basic Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100"
          >
            <div className="flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-8">
              <div className="relative">
                <div className="relative">
                  {currentData.personalInfo.profilePhoto ? (
                    <img
                      className="h-32 w-32 rounded-full object-cover border-4 border-green-100 shadow-lg"
                      src={currentData.personalInfo.profilePhoto}
                      alt={`${currentData.personalInfo.firstName} ${currentData.personalInfo.lastName}`}
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center border-4 border-green-100 shadow-lg">
                      <User className="h-16 w-16 text-green-600" />
                    </div>
                  )}
                  {editing && (
                    <button className="absolute -bottom-2 -right-2 p-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full hover:from-green-700 hover:to-green-800 shadow-lg transition-all duration-200 transform hover:scale-105">
                      <Camera className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentData.personalInfo.firstName}{" "}
                  {currentData.personalInfo.lastName}
                </h2>
                <div className="space-y-1">
                  <p className="text-green-600 font-medium">
                    Student ID: {currentData.studentId}
                  </p>
                  <p className="text-gray-600">
                    Class: {currentData.academicInfo.currentClass}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100"
          >
            <div className="flex items-center mb-6">
              <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-green-700 rounded-full mr-4"></div>
              <h3 className="text-xl font-semibold text-gray-900">
                Personal Information
              </h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={currentData.personalInfo.firstName}
                    onChange={(e) =>
                      handleInputChange(
                        "personalInfo",
                        e.target.value,
                        "firstName"
                      )
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">
                    {currentData.personalInfo.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={currentData.personalInfo.lastName}
                    onChange={(e) =>
                      handleInputChange(
                        "personalInfo",
                        e.target.value,
                        "lastName"
                      )
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">
                    {currentData.personalInfo.lastName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date of Birth
                </label>
                {editing ? (
                  <input
                    type="date"
                    value={
                      currentData.personalInfo.dateOfBirth?.split("T")[0] || ""
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "personalInfo",
                        e.target.value,
                        "dateOfBirth"
                      )
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">
                    {new Date(
                      currentData.personalInfo.dateOfBirth
                    ).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gender
                </label>
                {editing ? (
                  <select
                    value={currentData.personalInfo.gender}
                    onChange={(e) =>
                      handleInputChange(
                        "personalInfo",
                        e.target.value,
                        "gender"
                      )
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg capitalize">
                    {currentData.personalInfo.gender}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100"
          >
            <div className="flex items-center mb-6">
              <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full mr-4"></div>
              <h3 className="text-xl font-semibold text-gray-900">
                Contact Information
              </h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                {editing ? (
                  <input
                    type="email"
                    value={currentData.contactInfo.email}
                    onChange={(e) =>
                      handleInputChange("contactInfo", e.target.value, "email")
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">
                    {currentData.contactInfo.email}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={currentData.contactInfo.phoneNumber}
                    onChange={(e) =>
                      handleInputChange(
                        "contactInfo",
                        e.target.value,
                        "phoneNumber"
                      )
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">
                    {currentData.contactInfo.phoneNumber}
                  </p>
                )}
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address
                </label>
                {editing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Street"
                      value={currentData.contactInfo.address.street}
                      onChange={(e) =>
                        handleAddressChange("street", e.target.value)
                      }
                      className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={currentData.contactInfo.address.city}
                      onChange={(e) =>
                        handleAddressChange("city", e.target.value)
                      }
                      className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={currentData.contactInfo.address.state}
                      onChange={(e) =>
                        handleAddressChange("state", e.target.value)
                      }
                      className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    />
                    <input
                      type="text"
                      placeholder="Country"
                      value={currentData.contactInfo.address.country}
                      onChange={(e) =>
                        handleAddressChange("country", e.target.value)
                      }
                      className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    />
                  </div>
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">
                    {[
                      currentData.contactInfo.address.street,
                      currentData.contactInfo.address.city,
                      currentData.contactInfo.address.state,
                      currentData.contactInfo.address.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Academic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100"
          >
            <div className="flex items-center mb-6">
              <div className="h-8 w-1 bg-gradient-to-b from-purple-500 to-purple-700 rounded-full mr-4"></div>
              <h3 className="text-xl font-semibold text-gray-900">
                Academic Information
              </h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Class
                </label>
                <p className="text-gray-900 bg-purple-50 px-4 py-3 rounded-lg font-medium">
                  {currentData.academicInfo.currentClass}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Admission Date
                </label>
                <p className="text-gray-900 bg-purple-50 px-4 py-3 rounded-lg">
                  {new Date(
                    currentData.academicInfo.admissionDate
                  ).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <p className="text-gray-900 bg-green-50 px-4 py-3 rounded-lg capitalize font-medium">
                  {currentData.academicInfo.status}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Parent/Guardian Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100"
          >
            <div className="flex items-center mb-6">
              <div className="h-8 w-1 bg-gradient-to-b from-orange-500 to-orange-700 rounded-full mr-4"></div>
              <h3 className="text-xl font-semibold text-gray-900">
                Parent/Guardian Information
              </h3>
            </div>

            {/* Father Information */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-orange-600 mb-4 flex items-center">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                Father's Information
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Father's Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={currentData.parentGuardianInfo.father?.name || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "parentGuardianInfo",
                          e.target.value,
                          "father",
                          "name"
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    />
                  ) : (
                    <p className="text-gray-900 bg-orange-50 px-4 py-3 rounded-lg">
                      {currentData.parentGuardianInfo.father?.name || "N/A"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Father's Occupation
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={
                        currentData.parentGuardianInfo.father?.occupation || ""
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "parentGuardianInfo",
                          e.target.value,
                          "father",
                          "occupation"
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    />
                  ) : (
                    <p className="text-gray-900 bg-orange-50 px-4 py-3 rounded-lg">
                      {currentData.parentGuardianInfo.father?.occupation ||
                        "N/A"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Father's Phone
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={
                        currentData.parentGuardianInfo.father?.phoneNumber || ""
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "parentGuardianInfo",
                          e.target.value,
                          "father",
                          "phoneNumber"
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    />
                  ) : (
                    <p className="text-gray-900 bg-orange-50 px-4 py-3 rounded-lg">
                      {currentData.parentGuardianInfo.father?.phoneNumber ||
                        "N/A"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Father's Email
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      value={currentData.parentGuardianInfo.father?.email || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "parentGuardianInfo",
                          e.target.value,
                          "father",
                          "email"
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    />
                  ) : (
                    <p className="text-gray-900 bg-orange-50 px-4 py-3 rounded-lg">
                      {currentData.parentGuardianInfo.father?.email || "N/A"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Mother Information */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-pink-600 mb-4 flex items-center">
                <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                Mother's Information
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mother's Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={currentData.parentGuardianInfo.mother?.name || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "parentGuardianInfo",
                          e.target.value,
                          "mother",
                          "name"
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    />
                  ) : (
                    <p className="text-gray-900 bg-pink-50 px-4 py-3 rounded-lg">
                      {currentData.parentGuardianInfo.mother?.name || "N/A"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mother's Occupation
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={
                        currentData.parentGuardianInfo.mother?.occupation || ""
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "parentGuardianInfo",
                          e.target.value,
                          "mother",
                          "occupation"
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    />
                  ) : (
                    <p className="text-gray-900 bg-pink-50 px-4 py-3 rounded-lg">
                      {currentData.parentGuardianInfo.mother?.occupation ||
                        "N/A"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mother's Phone
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={
                        currentData.parentGuardianInfo.mother?.phoneNumber || ""
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "parentGuardianInfo",
                          e.target.value,
                          "mother",
                          "phoneNumber"
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    />
                  ) : (
                    <p className="text-gray-900 bg-pink-50 px-4 py-3 rounded-lg">
                      {currentData.parentGuardianInfo.mother?.phoneNumber ||
                        "N/A"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mother's Email
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      value={currentData.parentGuardianInfo.mother?.email || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "parentGuardianInfo",
                          e.target.value,
                          "mother",
                          "email"
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    />
                  ) : (
                    <p className="text-gray-900 bg-pink-50 px-4 py-3 rounded-lg">
                      {currentData.parentGuardianInfo.mother?.email || "N/A"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Guardian Information */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-indigo-600 mb-4 flex items-center">
                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                Guardian Information
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Guardian's Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={
                        currentData.parentGuardianInfo.guardian?.name || ""
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "parentGuardianInfo",
                          e.target.value,
                          "guardian",
                          "name"
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    />
                  ) : (
                    <p className="text-gray-900 bg-indigo-50 px-4 py-3 rounded-lg">
                      {currentData.parentGuardianInfo.guardian?.name || "N/A"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Relationship
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={
                        currentData.parentGuardianInfo.guardian?.relationship ||
                        ""
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "parentGuardianInfo",
                          e.target.value,
                          "guardian",
                          "relationship"
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    />
                  ) : (
                    <p className="text-gray-900 bg-indigo-50 px-4 py-3 rounded-lg">
                      {currentData.parentGuardianInfo.guardian?.relationship ||
                        "N/A"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Guardian's Occupation
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={
                        currentData.parentGuardianInfo.guardian?.occupation ||
                        ""
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "parentGuardianInfo",
                          e.target.value,
                          "guardian",
                          "occupation"
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    />
                  ) : (
                    <p className="text-gray-900 bg-indigo-50 px-4 py-3 rounded-lg">
                      {currentData.parentGuardianInfo.guardian?.occupation ||
                        "N/A"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Guardian's Phone
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={
                        currentData.parentGuardianInfo.guardian?.phoneNumber ||
                        ""
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "parentGuardianInfo",
                          e.target.value,
                          "guardian",
                          "phoneNumber"
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    />
                  ) : (
                    <p className="text-gray-900 bg-indigo-50 px-4 py-3 rounded-lg">
                      {currentData.parentGuardianInfo.guardian?.phoneNumber ||
                        "N/A"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Guardian's Email
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      value={
                        currentData.parentGuardianInfo.guardian?.email || ""
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "parentGuardianInfo",
                          e.target.value,
                          "guardian",
                          "email"
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    />
                  ) : (
                    <p className="text-gray-900 bg-indigo-50 px-4 py-3 rounded-lg">
                      {currentData.parentGuardianInfo.guardian?.email || "N/A"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
