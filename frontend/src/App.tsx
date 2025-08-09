import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Suspense, lazy } from "react";
import LandingLayout from "./layout/LandingLayout";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Academics from "./pages/Academics";
import Admissions from "./pages/Admissions";
import PayFees from "./pages/PayFees";
import ScrollToTop from "./ScrollToTop";
import Gallery from "./pages/Gallery";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import FAQ from "./pages/FAQ";

// Announcement imports
import Announcements from "./pages/Announcements";
import AnnouncementDetail from "./pages/AnnouncementDetail";

// Auth & Dashboard imports
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { PageLoading } from "./components/Loading";
import Login from "./pages/auth/Login";
import DashboardRedirect from "./components/DashboardRedirect";

// Lazy load auth components
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

// Lazy load admin components for code splitting
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminStudents = lazy(() => import("./pages/admin/AdminStudents"));
const AddStudent = lazy(() => import("./pages/admin/AddStudent"));
const StudentView = lazy(() => import("./pages/admin/StudentView"));
const StudentEdit = lazy(() => import("./pages/admin/StudentEdit"));
const AdminResults = lazy(() => import("./pages/admin/AdminResults"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminResultsView = lazy(() => import("./pages/admin/AdminResultsView"));
const AdminStudentBulkUpload = lazy(
  () => import("./pages/admin/AdminStudentBulkUpload")
);
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const AdminAnnouncements = lazy(
  () => import("./pages/admin/AdminAnnouncements")
);
const AdminAnnouncementForm = lazy(
  () => import("./pages/admin/AdminAnnouncementForm")
);

// Lazy load student components for code splitting
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const StudentOverview = lazy(() => import("./pages/student/StudentOverview"));
const StudentProfile = lazy(() => import("./pages/student/StudentProfile"));
const StudentResults = lazy(() => import("./pages/student/StudentResults"));
const StudentPayments = lazy(() => import("./pages/student/StudentPayments"));
const StudentCalendar = lazy(() => import("./pages/student/StudentCalendar"));
const StudentSettings = lazy(() => import("./pages/student/StudentSettings"));

/**
 * Main Application Component
 * Production-ready with error boundaries, authentication, and routing
 */
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: "#10B981",
                  secondary: "#fff",
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: "#EF4444",
                  secondary: "#fff",
                },
              },
            }}
          />
          <Routes>
            {/* Public Routes */}
            <Route element={<LandingLayout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="admission" element={<Admissions />} />
              <Route path="academics" element={<Academics />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="pay-fees" element={<PayFees />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="announcements" element={<Announcements />} />
              <Route
                path="announcements/:id"
                element={<AnnouncementDetail />}
              />
            </Route>

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route
              path="/forgot-password"
              element={
                <Suspense fallback={<PageLoading text="Loading..." />}>
                  <ForgotPassword />
                </Suspense>
              }
            />
            <Route
              path="/reset-password/:resetToken"
              element={
                <Suspense fallback={<PageLoading text="Loading..." />}>
                  <ResetPassword />
                </Suspense>
              }
            />
            <Route path="/dashboard" element={<DashboardRedirect />} />

            {/* Admin Routes - Protected */}
            <Route
              path="/admin"
              element={
                <ErrorBoundary>
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Suspense
                      fallback={
                        <PageLoading text="Loading Admin Dashboard..." />
                      }
                    >
                      <AdminDashboard />
                    </Suspense>
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            >
              <Route
                index
                element={
                  <Suspense
                    fallback={<PageLoading text="Loading Overview..." />}
                  >
                    <AdminOverview />
                  </Suspense>
                }
              />
              <Route
                path="dashboard"
                element={
                  <Suspense
                    fallback={<PageLoading text="Loading Overview..." />}
                  >
                    <AdminOverview />
                  </Suspense>
                }
              />
              <Route
                path="students"
                element={
                  <Suspense
                    fallback={<PageLoading text="Loading Students..." />}
                  >
                    <AdminStudents />
                  </Suspense>
                }
              />
              <Route
                path="students/:id"
                element={
                  <Suspense
                    fallback={<PageLoading text="Loading Student Details..." />}
                  >
                    <StudentView />
                  </Suspense>
                }
              />
              <Route
                path="students/:id/edit"
                element={
                  <Suspense
                    fallback={<PageLoading text="Loading Student Editor..." />}
                  >
                    <StudentEdit />
                  </Suspense>
                }
              />
              <Route
                path="students/add"
                element={
                  <Suspense
                    fallback={
                      <PageLoading text="Loading Add Student Form..." />
                    }
                  >
                    <AddStudent />
                  </Suspense>
                }
              />
              <Route
                path="students/bulk-upload"
                element={
                  <Suspense
                    fallback={<PageLoading text="Loading Bulk Upload..." />}
                  >
                    <AdminStudentBulkUpload />
                  </Suspense>
                }
              />
              <Route
                path="results"
                element={
                  <Suspense
                    fallback={<PageLoading text="Loading Results..." />}
                  >
                    <AdminResults />
                  </Suspense>
                }
              />
              <Route
                path="results/view"
                element={
                  <Suspense
                    fallback={<PageLoading text="Loading Results View..." />}
                  >
                    <AdminResultsView />
                  </Suspense>
                }
              />
              <Route
                path="events"
                element={
                  <Suspense fallback={<PageLoading text="Loading Events..." />}>
                    <AdminEvents />
                  </Suspense>
                }
              />
              <Route
                path="announcements"
                element={
                  <Suspense
                    fallback={<PageLoading text="Loading Announcements..." />}
                  >
                    <AdminAnnouncements />
                  </Suspense>
                }
              />
              <Route
                path="announcements/create"
                element={
                  <Suspense fallback={<PageLoading text="Loading Form..." />}>
                    <AdminAnnouncementForm />
                  </Suspense>
                }
              />
              <Route
                path="announcements/:id/edit"
                element={
                  <Suspense fallback={<PageLoading text="Loading Form..." />}>
                    <AdminAnnouncementForm />
                  </Suspense>
                }
              />
              <Route
                path="payments"
                element={
                  <Suspense
                    fallback={<PageLoading text="Loading Payments..." />}
                  >
                    <AdminPayments />
                  </Suspense>
                }
              />
              <Route
                path="profile"
                element={
                  <Suspense
                    fallback={<PageLoading text="Loading Profile..." />}
                  >
                    <AdminProfile />
                  </Suspense>
                }
              />
            </Route>

            {/* Student Routes - Protected */}
            <Route
              path="/student"
              element={
                <ErrorBoundary>
                  <ProtectedRoute allowedRoles={["student"]}>
                    <Suspense
                      fallback={
                        <PageLoading text="Loading Student Dashboard..." />
                      }
                    >
                      <StudentDashboard />
                    </Suspense>
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            >
              <Route
                index
                element={
                  <Suspense
                    fallback={<PageLoading text="Loading Overview..." />}
                  >
                    <StudentOverview />
                  </Suspense>
                }
              />
              <Route
                path="dashboard"
                element={
                  <Suspense
                    fallback={<PageLoading text="Loading Overview..." />}
                  >
                    <StudentOverview />
                  </Suspense>
                }
              />
              <Route
                path="profile"
                element={
                  <Suspense
                    fallback={<PageLoading text="Loading Profile..." />}
                  >
                    <StudentProfile />
                  </Suspense>
                }
              />
              <Route
                path="results"
                element={
                  <Suspense
                    fallback={<PageLoading text="Loading Results..." />}
                  >
                    <StudentResults />
                  </Suspense>
                }
              />
              <Route
                path="payments"
                element={
                  <Suspense
                    fallback={<PageLoading text="Loading Payments..." />}
                  >
                    <StudentPayments />
                  </Suspense>
                }
              />
              <Route
                path="calendar"
                element={
                  <Suspense
                    fallback={<PageLoading text="Loading Calendar..." />}
                  >
                    <StudentCalendar />
                  </Suspense>
                }
              />
              <Route
                path="settings"
                element={
                  <Suspense
                    fallback={<PageLoading text="Loading Settings..." />}
                  >
                    <StudentSettings />
                  </Suspense>
                }
              />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
