import axios from "axios";
import type { AxiosResponse } from "axios";

/**
 * Create axios instance with production-ready configuration
 * Uses centralized environment configuration
 */
const api = axios.create({
  baseURL: "https://regina-nostras-schools.onrender.com/api",
  // baseURL: "https://api.reginanostraschools.com/api",
  // baseURL: "http://localhost:4000/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor to add authentication token
 * Automatically adds Bearer token from localStorage to all requests
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for global error handling
 * Handles common HTTP status codes and authentication errors
 * Gracefully handles network errors without forcing logout
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error("Network error:", error.message);
      throw new Error("Network error. Please check your connection.");
    }

    // Handle authentication errors (401 Unauthorized)
    if (error.response?.status === 401) {
      console.warn("Authentication failed (401), clearing auth data");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");

      // Only redirect to login if not already on login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }

      return Promise.reject(
        new Error("Authentication failed. Please login again.")
      );
    }

    // Handle forbidden errors (403 Forbidden)
    if (error.response?.status === 403) {
      console.warn("Access forbidden (403)");
      return Promise.reject(
        new Error("Access denied. You don't have permission for this action.")
      );
    }

    // Handle server errors (5xx)
    if (error.response?.status >= 500) {
      console.error("Server error:", error.response.data);
      throw new Error("Server error. Please try again later.");
    }

    // Handle client errors (4xx except 401 and 403)
    if (error.response?.status >= 400 && error.response?.status < 500) {
      const message = error.response?.data?.message || "Request failed";
      console.error("Client error:", message);
      return Promise.reject(new Error(message));
    }

    // Handle other errors
    console.error("API error:", error.response?.data);
    return Promise.reject(error);
  }
);

// Types
export interface User {
  _id: string;
  email: string;
  role: "admin" | "student";
  isActive: boolean;
  lastLogin?: string;
  student?: Student;
}

export interface Student {
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
    emergencyContact: {
      name: string;
      relationship: string;
      phoneNumber: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string; // Optional message field for error handling
}

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  excerpt: string;
  imageUrl?: string;
  category:
    | "general"
    | "academic"
    | "sports"
    | "achievement"
    | "event"
    | "important";
  priority: "low" | "medium" | "high" | "urgent";
  status: "draft" | "published" | "archived";
  isPinned: boolean;
  publishDate: string;
  expiryDate?: string;
  targetAudience: "all" | "students" | "parents" | "staff" | "custom";
  customAudience?: {
    classes?: string[];
    roles?: string[];
    individuals?: string[];
  };
  author: {
    _id: string;
    email: string;
  };
  tags: string[];
  views: number;
  attachments?: {
    name: string;
    url: string;
    type: string;
    size?: number;
  }[];
  isNotificationSent: boolean;
  metadata?: {
    readBy?: string[];
    likedBy?: string[];
    commentCount?: number;
  };
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
  authorName?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalStudents?: number;
    totalResults?: number;
    totalPayments?: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Auth API
export const authAPI = {
  login: (
    credentials: LoginCredentials
  ): Promise<AxiosResponse<AuthResponse>> =>
    api.post("/auth/login", credentials),

  getMe: (): Promise<AxiosResponse<ApiResponse<User>>> => api.get("/auth/me"),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.put("/auth/change-password", data),

  forgotPassword: (email: string): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.post("/auth/forgot-password", { email }),

  resetPassword: (
    resetToken: string,
    data: { password: string; confirmPassword: string }
  ): Promise<AxiosResponse<AuthResponse>> =>
    api.put(`/auth/reset-password/${resetToken}`, data),
};

// Student API
export const studentAPI = {
  getProfile: (): Promise<AxiosResponse<ApiResponse<Student>>> =>
    api.get("/student/profile"),

  updateProfile: (
    data: Partial<Student>
  ): Promise<AxiosResponse<ApiResponse<Student>>> =>
    api.put("/student/profile", data),

  uploadProfilePhoto: (
    file: File
  ): Promise<AxiosResponse<ApiResponse<{ profilePhoto: string }>>> => {
    const formData = new FormData();
    formData.append("profilePhoto", file);
    return api.post("/student/profile/photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Settings endpoints
  updateNotificationSettings: (
    data: any
  ): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.put("/student/settings/notifications", data),

  updateSecuritySettings: (
    data: any
  ): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.put("/student/settings/security", data),

  updateProfileSettings: (
    data: any
  ): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.put("/student/settings/profile", data),
};

// Results API
export const resultAPI = {
  getStudentResults: (params?: {
    academicSession?: string;
    term?: string;
  }): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get("/results/student", { params }),

  getResult: (id: string): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get(`/results/student/${id}`),

  getSessionsAndTerms: (): Promise<
    AxiosResponse<ApiResponse<{ sessions: string[]; terms: string[] }>>
  > => api.get("/results/sessions-terms"),
};

// Payment API
export const paymentAPI = {
  getStudentPayments: (params?: {
    page?: number;
    limit?: number;
  }): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get("/payments/student", { params }),

  submitPayment: (
    data: any,
    file: File
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    const formData = new FormData();
    formData.append("receiptImage", file);
    Object.keys(data).forEach((key) => {
      if (typeof data[key] === "object") {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    });
    return api.post("/payments", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// Admin API
export const adminAPI = {
  // Student management
  getStudents: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    class?: string;
    status?: string;
  }): Promise<AxiosResponse<ApiResponse<Student[]>>> =>
    api.get("/admin/students", { params }),

  getStudent: (id: string): Promise<AxiosResponse<ApiResponse<Student>>> =>
    api.get(`/admin/students/${id}`),

  createStudent: (
    data: Partial<Student>
  ): Promise<AxiosResponse<ApiResponse<Student>>> =>
    api.post("/admin/students", data),

  updateStudent: (
    id: string,
    data: Partial<Student>
  ): Promise<AxiosResponse<ApiResponse<Student>>> =>
    api.put(`/admin/students/${id}`, data),

  deleteStudent: (id: string): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.delete(`/admin/students/${id}`),

  // Results management
  getResults: (params?: {
    page?: number;
    limit?: number;
    academicSession?: string;
    term?: string;
    class?: string;
    isPublished?: boolean;
  }): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get("/results", { params }),

  createResult: (data: any): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.post("/results", data),

  updateResult: (
    id: string,
    data: any
  ): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.put(`/results/${id}`, data),

  deleteResult: (id: string): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.delete(`/results/${id}`),

  publishResult: (
    id: string,
    isPublished: boolean
  ): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.put(`/results/${id}/publish`, { isPublished }),

  bulkUploadResults: (
    file: File,
    data: { academicSession: string; term: string; class: string }
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    const formData = new FormData();
    formData.append("file", file);
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key as keyof typeof data]);
    });
    return api.post("/results/bulk-upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  downloadBulkTemplate: (): Promise<AxiosResponse<Blob>> =>
    api.get("/results/bulk-template", { responseType: "blob" }),

  getResultStatistics: (params: {
    academicSession: string;
    term: string;
    class?: string;
  }): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get("/results/statistics", { params }),

  // Payment management
  getPayments: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentType?: string;
  }): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get("/admin/payments", { params }),

  verifyPayment: (
    id: string,
    verificationNotes?: string
  ): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.put(`/admin/payments/${id}/verify`, { verificationNotes }),

  rejectPayment: (
    id: string,
    rejectionReason: string
  ): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.put(`/admin/payments/${id}/reject`, { rejectionReason }),
};

// Events API
export const eventsAPI = {
  // Student events
  getStudentEvents: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
    upcoming?: boolean;
  }): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get("/events/student", { params }),

  getStudentEvent: (id: string): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get(`/events/student/${id}`),

  // Admin events
  getAdminEvents: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get("/events/admin", { params }),

  createEvent: (data: any): Promise<AxiosResponse<ApiResponse<any>>> => {
    const formData = new FormData();

    // Handle file attachments
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file: File) => {
        formData.append("attachments", file);
      });
      delete data.attachments;
    }

    // Append other data
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        if (typeof data[key] === "object") {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      }
    });

    return api.post("/events/admin", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updateEvent: (
    id: string,
    data: any
  ): Promise<AxiosResponse<ApiResponse<any>>> => {
    const formData = new FormData();

    // Handle file attachments
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file: File) => {
        formData.append("attachments", file);
      });
      delete data.attachments;
    }

    // Append other data
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        if (typeof data[key] === "object") {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      }
    });

    return api.put(`/events/admin/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteEvent: (id: string): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.delete(`/events/admin/${id}`),

  getEventStatistics: (): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get("/events/admin/statistics"),

  removeEventAttachment: (
    eventId: string,
    attachmentIndex: number
  ): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.delete(`/events/admin/${eventId}/attachments/${attachmentIndex}`),

  // Common events
  getUpcomingEvents: (params?: {
    limit?: number;
  }): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get("/events/upcoming", { params }),
};

// Announcements API
export const announcementsAPI = {
  // Public announcements (no auth required)
  getPublicAnnouncements: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    pinned?: boolean;
  }): Promise<AxiosResponse<ApiResponse<Announcement[]>>> =>
    api.get("/announcements/public", { params }),

  // Authenticated user announcements
  getAnnouncements: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    pinned?: boolean;
  }): Promise<AxiosResponse<ApiResponse<Announcement[]>>> =>
    api.get("/announcements", { params }),

  getAnnouncement: (
    id: string
  ): Promise<AxiosResponse<ApiResponse<Announcement>>> =>
    api.get(`/announcements/${id}`),

  // Admin announcements
  getAdminAnnouncements: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    search?: string;
  }): Promise<AxiosResponse<ApiResponse<Announcement[]>>> =>
    api.get("/announcements/admin", { params }),

  createAnnouncement: (
    data: any
  ): Promise<AxiosResponse<ApiResponse<Announcement>>> => {
    const formData = new FormData();

    // Handle image upload
    if (data.imageFile && data.imageFile instanceof File) {
      formData.append("image", data.imageFile);
      delete data.imageFile;
    }

    // Handle file attachments
    if (data.attachmentFiles && Array.isArray(data.attachmentFiles)) {
      data.attachmentFiles.forEach((file: File) => {
        formData.append("attachments", file);
      });
      delete data.attachmentFiles;
    }

    // Append other data
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        if (typeof data[key] === "object") {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, String(data[key]));
        }
      }
    });

    return api.post("/announcements/admin", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updateAnnouncement: (
    id: string,
    data: any
  ): Promise<AxiosResponse<ApiResponse<Announcement>>> => {
    const formData = new FormData();

    // Handle image upload
    if (data.imageFile && data.imageFile instanceof File) {
      formData.append("image", data.imageFile);
      delete data.imageFile;
    }

    // Handle file attachments
    if (data.attachmentFiles && Array.isArray(data.attachmentFiles)) {
      data.attachmentFiles.forEach((file: File) => {
        formData.append("attachments", file);
      });
      delete data.attachmentFiles;
    }

    // Append other data
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        if (typeof data[key] === "object") {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, String(data[key]));
        }
      }
    });

    return api.put(`/announcements/admin/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteAnnouncement: (id: string): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.delete(`/announcements/admin/${id}`),

  getAnnouncementStatistics: (): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get("/announcements/admin/statistics"),

  toggleAnnouncementPin: (
    id: string
  ): Promise<AxiosResponse<ApiResponse<{ isPinned: boolean }>>> =>
    api.put(`/announcements/admin/${id}/pin`),
};

export default api;
