import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const studentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email address"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female"], { message: "Gender is required" }),
  class: z.string().min(1, "Class is required"),
  phone: z.string().optional(),
  // Address fields
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  // Personal info
  nationality: z.string().min(1, "Nationality is required"),
  stateOfOrigin: z.string().min(1, "State of origin is required"),
  localGovernmentArea: z.string().min(1, "Local government area is required"),
  religion: z.string().optional(),
  bloodGroup: z.string().optional(),
  // Parent info
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  parentEmail: z.email("Invalid parent email").optional().or(z.literal("")),
  medicalInfo: z.string().optional(),
});

type StudentForm = z.infer<typeof studentSchema>;

const AddStudent: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const classes = [
    "Pre-Nursery",
    "Nursery 1",
    "Nursery 2",
    "Primary 1",
    "Primary 2",
    "Primary 3",
    "Primary 4",
    "Primary 5",
    "Primary 6",
  ];

  const nigerianStates = [
    "Abia",
    "Adamawa",
    "Akwa Ibom",
    "Anambra",
    "Bauchi",
    "Bayelsa",
    "Benue",
    "Borno",
    "Cross River",
    "Delta",
    "Ebonyi",
    "Edo",
    "Ekiti",
    "Enugu",
    "FCT",
    "Gombe",
    "Imo",
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Kogi",
    "Kwara",
    "Lagos",
    "Nasarawa",
    "Niger",
    "Ogun",
    "Ondo",
    "Osun",
    "Oyo",
    "Plateau",
    "Rivers",
    "Sokoto",
    "Taraba",
    "Yobe",
    "Zamfara",
  ];

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // Sample LGAs for Enugu State (you can expand this)
  const enuguLGAs = [
    "Aninri",
    "Awgu",
    "Enugu East",
    "Enugu North",
    "Enugu South",
    "Ezeagu",
    "Igbo Etiti",
    "Igbo Eze North",
    "Igbo Eze South",
    "Isi Uzo",
    "Nkanu East",
    "Nkanu West",
    "Nsukka",
    "Oji River",
    "Udenu",
    "Udi",
    "Uzo Uwani",
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    mode: "onChange", // This will validate on change
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error("Image size should be less than 5MB");
        return;
      }

      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setImagePreview(null);
  };

  const onSubmit = async (data: StudentForm) => {
    try {
      setLoading(true);

      console.log("Form validation passed!");
      console.log("Form data:", data);

      // Transform the flat form data to match the backend Student model structure
      const transformedData = {
        personalInfo: {
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          nationality: data.nationality || "Nigerian",
          stateOfOrigin: data.stateOfOrigin,
          localGovernmentArea: data.localGovernmentArea,
          religion: data.religion || "",
          bloodGroup: data.bloodGroup || "",
        },
        contactInfo: {
          email: data.email,
          phoneNumber: data.phone || "",
          address: {
            street: data.street,
            city: data.city,
            state: data.state,
            country: "Nigeria",
          },
        },
        parentGuardianInfo: {
          guardian: {
            name: data.parentName || "",
            phoneNumber: data.parentPhone || "",
            email: data.parentEmail || "",
            relationship: "Parent/Guardian",
            occupation: "",
          },
        },
        academicInfo: {
          currentClass: data.class,
          status: "active",
          admissionDate: new Date().toISOString(),
        },
        medicalInfo: {
          allergies: data.medicalInfo ? [data.medicalInfo] : [],
          emergencyContact: {
            name: data.parentName || "",
            relationship: "Parent/Guardian",
            phoneNumber: data.parentPhone || "",
          },
        },
      };

      console.log("Transformed data:", transformedData);

      // Create FormData for multipart form submission
      const formData = new FormData();

      // Add the structured data as JSON
      formData.append("studentData", JSON.stringify(transformedData));

      // Add profile image if selected
      if (profileImage) {
        formData.append("profilePicture", profileImage);
        console.log("Profile image added:", profileImage.name);
      }

      // Log what's being sent
      console.log("FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(
          key,
          typeof value === "string" ? value : `File: ${(value as File).name}`
        );
      }

      const response = await api.post("/admin/students", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Student created successfully:", response.data);
      toast.success("Student added successfully!");
      navigate("/admin/students");
    } catch (error: any) {
      console.error("Error adding student:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to add student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/admin/students")}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Students
          </button>
        </div>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 tracking-tight">
          Add New Student
        </h1>
        <p className="mt-2 text-base text-gray-600">
          Fill in the information below to add a new student to the system.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Profile Picture */}
          <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full mr-3"></div>
              Profile Picture
            </h3>
            <div className="flex items-center space-x-8">
              <div className="relative">
                {imagePreview ? (
                  <div className="relative group">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-32 w-32 rounded-full object-cover border-4 border-blue-100 shadow-lg group-hover:border-blue-200 transition-colors duration-200"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg transform hover:scale-110 transition-all duration-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-32 w-32 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-4 border-dashed border-gray-300 hover:border-blue-400 transition-colors duration-200">
                    <Upload className="h-10 w-10 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="cursor-pointer inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 transform hover:scale-105 transition-all duration-200 shadow-lg">
                  <Upload className="h-5 w-5 mr-2" />
                  <span>Choose Profile Picture</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                </label>
                <p className="mt-3 text-sm text-gray-500 font-medium">
                  PNG, JPG up to 5MB
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Recommended: 400x400 pixels
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full mr-3"></div>
              Basic Information
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  {...register("firstName")}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400 text-sm font-medium"
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  {...register("lastName")}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400 text-sm font-medium"
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {errors.lastName.message}
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400 text-sm font-medium"
                  placeholder="student@example.com"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  {...register("phone")}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400 text-sm font-medium"
                  placeholder="+234 xxx xxx xxxx"
                />
                {errors.phone && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  {...register("dateOfBirth")}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400 text-sm font-medium"
                />
                {errors.dateOfBirth && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {errors.dateOfBirth.message}
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Class *
                </label>
                <select
                  {...register("class")}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400 text-sm font-medium bg-white"
                >
                  <option value="" className="text-gray-500">
                    Select a class
                  </option>
                  {classes.map((cls) => (
                    <option key={cls} value={cls} className="text-gray-900">
                      {cls}
                    </option>
                  ))}
                </select>
                {errors.class && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {errors.class.message}
                  </p>
                )}
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  {...register("gender")}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400 text-sm font-medium bg-white"
                >
                  <option value="" className="text-gray-500">
                    Select gender
                  </option>
                  <option value="male" className="text-gray-900">
                    Male
                  </option>
                  <option value="female" className="text-gray-900">
                    Female
                  </option>
                </select>
                {errors.gender && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {errors.gender.message}
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Blood Group
                </label>
                <select
                  {...register("bloodGroup")}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400 text-sm font-medium bg-white"
                >
                  <option value="" className="text-gray-500">
                    Select blood group
                  </option>
                  {bloodGroups.map((bg) => (
                    <option key={bg} value={bg} className="text-gray-900">
                      {bg}
                    </option>
                  ))}
                </select>
                {errors.bloodGroup && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {errors.bloodGroup.message}
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  State of Origin *
                </label>
                <select
                  {...register("stateOfOrigin")}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400 text-sm font-medium bg-white"
                >
                  <option value="" className="text-gray-500">
                    Select state of origin
                  </option>
                  {nigerianStates.map((state) => (
                    <option key={state} value={state} className="text-gray-900">
                      {state}
                    </option>
                  ))}
                </select>
                {errors.stateOfOrigin && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {errors.stateOfOrigin.message}
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Local Government Area *
                </label>
                <select
                  {...register("localGovernmentArea")}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400 text-sm font-medium bg-white"
                >
                  <option value="" className="text-gray-500">
                    Select LGA
                  </option>
                  {enuguLGAs.map((lga) => (
                    <option key={lga} value={lga} className="text-gray-900">
                      {lga}
                    </option>
                  ))}
                </select>
                {errors.localGovernmentArea && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {errors.localGovernmentArea.message}
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Religion
                </label>
                <input
                  type="text"
                  {...register("religion")}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400 text-sm font-medium"
                  placeholder="Enter religion"
                />
                {errors.religion && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {errors.religion.message}
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nationality *
                </label>
                <input
                  type="text"
                  {...register("nationality")}
                  defaultValue="Nigerian"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400 text-sm font-medium"
                  placeholder="Enter nationality"
                />
                {errors.nationality && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {errors.nationality.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <h4 className="text-lg font-semibold text-gray-800">
                Address Information
              </h4>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    {...register("street")}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400 text-sm font-medium"
                    placeholder="Enter street address"
                  />
                  {errors.street && (
                    <p className="mt-2 text-sm text-red-600 font-medium">
                      {errors.street.message}
                    </p>
                  )}
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    {...register("city")}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400 text-sm font-medium"
                    placeholder="Enter city"
                  />
                  {errors.city && (
                    <p className="mt-2 text-sm text-red-600 font-medium">
                      {errors.city.message}
                    </p>
                  )}
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    State *
                  </label>
                  <select
                    {...register("state")}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400 text-sm font-medium bg-white"
                  >
                    <option value="" className="text-gray-500">
                      Select state
                    </option>
                    {nigerianStates.map((state) => (
                      <option
                        key={state}
                        value={state}
                        className="text-gray-900"
                      >
                        {state}
                      </option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="mt-2 text-sm text-red-600 font-medium">
                      {errors.state.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Parent/Guardian Information */}
          <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-violet-600 rounded-full mr-3"></div>
              Parent/Guardian Information
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Parent/Guardian Name
                </label>
                <input
                  type="text"
                  {...register("parentName")}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400 text-sm font-medium"
                  placeholder="Enter parent/guardian name"
                />
                {errors.parentName && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {errors.parentName.message}
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Parent Phone Number
                </label>
                <input
                  type="tel"
                  {...register("parentPhone")}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400 text-sm font-medium"
                  placeholder="+234 xxx xxx xxxx"
                />
                {errors.parentPhone && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {errors.parentPhone.message}
                  </p>
                )}
              </div>

              <div className="group sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Parent Email Address
                </label>
                <input
                  type="email"
                  {...register("parentEmail")}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400 text-sm font-medium"
                  placeholder="parent@example.com"
                />
                {errors.parentEmail && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {errors.parentEmail.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <div className="w-2 h-8 bg-gradient-to-b from-red-500 to-pink-600 rounded-full mr-3"></div>
              Additional Information
            </h3>
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Medical Information & Allergies
              </label>
              <textarea
                {...register("medicalInfo")}
                rows={4}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400 text-sm font-medium resize-none"
                placeholder="Any medical conditions, allergies, or special needs the school should be aware of..."
              />
              {errors.medicalInfo && (
                <p className="mt-2 text-sm text-red-600 font-medium">
                  {errors.medicalInfo.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => navigate("/admin/students")}
              className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:scale-105"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-semibold rounded-lg shadow-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform hover:scale-105 transition-all duration-200"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              ) : (
                <Save className="h-5 w-5 mr-3" />
              )}
              {loading ? "Adding Student..." : "Add Student"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddStudent;
