import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Pin,
  Calendar,
  Tag,
  User,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  X,
} from "lucide-react";
import { announcementsAPI, type Announcement } from "../../services/api";
import { PageLoading } from "../../components/Loading";
import { usePageTitle } from "../../usePageTitle";
import toast from "react-hot-toast";

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    search: "",
  });
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<
    string | null
  >(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  usePageTitle("Manage Announcements - Admin");

  const itemsPerPage = 10;
  const categories = [
    "general",
    "academic",
    "sports",
    "achievement",
    "event",
    "important",
  ];
  const statuses = ["draft", "published", "archived"];

  useEffect(() => {
    fetchAnnouncements();
  }, [currentPage, filters]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);

      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;

      const response = await announcementsAPI.getAdminAnnouncements(params);

      if (response.data.success && response.data.data) {
        const data = response.data.data as any;
        setAnnouncements(data.announcements || []);

        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalItems(data.pagination.totalItems || 0);
        }
      }
    } catch (error: any) {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleTogglePin = async (id: string) => {
    try {
      const response = await announcementsAPI.toggleAnnouncementPin(id);
      if (response.data.success) {
        toast.success(response.data.message || "Pin status updated");
        fetchAnnouncements();
      }
    } catch (error: any) {
      console.error("Error toggling pin:", error);
      toast.error("Failed to update pin status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await announcementsAPI.deleteAnnouncement(id);
      toast.success("Announcement deleted successfully");
      setShowDeleteModal(false);
      setSelectedAnnouncement(null);
      fetchAnnouncements();
    } catch (error: any) {
      console.error("Error deleting announcement:", error);
      toast.error("Failed to delete announcement");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      published: "bg-green-100 text-green-800",
      archived: "bg-yellow-100 text-yellow-800",
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      general: "bg-gray-100 text-gray-800",
      academic: "bg-blue-100 text-blue-800",
      sports: "bg-green-100 text-green-800",
      achievement: "bg-yellow-100 text-yellow-800",
      event: "bg-purple-100 text-purple-800",
      important: "bg-red-100 text-red-800",
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "text-gray-500",
      medium: "text-blue-500",
      high: "text-orange-500",
      urgent: "text-red-500",
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <PageLoading text="Loading announcements..." />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Manage Announcements
          </h1>
          <p className="mt-1 text-gray-500">
            Create, edit, and manage school announcements
          </p>
        </div>
        <Link
          to="/admin/announcements/create"
          className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Announcement
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Published
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {
                      announcements.filter((a) => a.status === "published")
                        .length
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Drafts
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {announcements.filter((a) => a.status === "draft").length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Pin className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pinned
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {announcements.filter((a) => a.isPinned).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Views
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {announcements.reduce((total, a) => total + a.views, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2 text-blue-500" />
            Filter Announcements
          </h3>
          {(filters.search || filters.category || filters.status) && (
            <button
              onClick={() => {
                setFilters({ category: "", status: "", search: "" });
                setCurrentPage(1);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Enhanced Search */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title, content, or tags..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10 pr-10 py-3 block w-full border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200 text-sm bg-gray-50 focus:bg-white hover:border-gray-400"
              />
              {filters.search && (
                <button
                  onClick={() => handleFilterChange("search", "")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Press Enter or type to search
            </div>
          </div>

          {/* Enhanced Category Filter */}
          <div>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="pl-10 pr-10 py-3 block w-full border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200 text-sm bg-gray-50 focus:bg-white appearance-none hover:border-gray-400"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-1 text-xs text-gray-500">Filter by category</div>
          </div>

          {/* Enhanced Status Filter */}
          <div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                {filters.status === "published" && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {filters.status === "draft" && (
                  <Clock className="w-4 h-4 text-yellow-500" />
                )}
                {filters.status === "archived" && (
                  <XCircle className="w-4 h-4 text-gray-500" />
                )}
                {!filters.status && (
                  <Filter className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="pl-10 pr-10 py-3 block w-full border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200 text-sm bg-gray-50 focus:bg-white appearance-none hover:border-gray-400"
              >
                <option value="">All Status</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-1 text-xs text-gray-500">Filter by status</div>
          </div>

          {/* Enhanced Results Count */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center text-sm text-gray-600 font-medium">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              {totalItems} result{totalItems !== 1 ? "s" : ""}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {currentPage > 1 && `Page ${currentPage} of ${totalPages}`}
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.search || filters.category || filters.status) && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs text-gray-500 font-medium">
                Active filters:
              </span>
              {filters.search && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Search: "{filters.search}"
                  <button
                    onClick={() => handleFilterChange("search", "")}
                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Category:{" "}
                  {filters.category.charAt(0).toUpperCase() +
                    filters.category.slice(1)}
                  <button
                    onClick={() => handleFilterChange("category", "")}
                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-green-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.status && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Status:{" "}
                  {filters.status.charAt(0).toUpperCase() +
                    filters.status.slice(1)}
                  <button
                    onClick={() => handleFilterChange("status", "")}
                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-purple-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Announcements Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {announcements.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No announcements found
            </h3>
            <p className="text-gray-500 mb-4">
              {filters.category || filters.status || filters.search
                ? "Try adjusting your filters to see more results."
                : "Get started by creating your first announcement."}
            </p>
            <Link
              to="/admin/announcements/create"
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Announcement
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {announcements.map((announcement) => (
              <li key={announcement._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          announcement.status
                        )}`}
                      >
                        {announcement.status}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                          announcement.category
                        )}`}
                      >
                        {announcement.category}
                      </span>
                      {announcement.isPinned && (
                        <Pin className="w-4 h-4 text-red-500" />
                      )}
                      <span
                        className={`text-xs font-medium ${getPriorityColor(
                          announcement.priority
                        )}`}
                      >
                        {announcement.priority.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {announcement.title}
                    </h3>

                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {announcement.excerpt}
                    </p>

                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(announcement.publishDate)}
                      </div>
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {announcement.views} views
                      </div>
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {announcement.author.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/announcements/${announcement._id}`}
                      target="_blank"
                      className="text-gray-400 hover:text-gray-600"
                      title="View"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>

                    <button
                      onClick={() => handleTogglePin(announcement._id)}
                      className={`${
                        announcement.isPinned
                          ? "text-red-500 hover:text-red-700"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                      title={announcement.isPinned ? "Unpin" : "Pin"}
                    >
                      <Pin className="w-5 h-5" />
                    </button>

                    <Link
                      to={`/admin/announcements/${announcement._id}/edit`}
                      className="text-gray-400 hover:text-gray-600"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>

                    <button
                      onClick={() => {
                        setSelectedAnnouncement(announcement._id);
                        setShowDeleteModal(true);
                      }}
                      className="text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border-2 border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border-2 border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{" "}
                of <span className="font-medium">{totalItems}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-3 py-2 rounded-l-xl border-2 border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Previous
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page =
                    Math.max(
                      1,
                      Math.min(totalPages - 4, Math.max(1, currentPage - 2))
                    ) + i;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border-2 text-sm font-medium transition-all duration-200 ${
                        currentPage === page
                          ? "z-10 bg-blue-50 border-blue-500 text-blue-600 shadow-md"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-gray-400"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-3 py-2 rounded-r-xl border-2 border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedAnnouncement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-5 text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Announcement
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this announcement? This
                    action cannot be undone.
                  </p>
                </div>
                <div className="mt-5 flex justify-center space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedAnnouncement(null);
                    }}
                    disabled={deletingId === selectedAnnouncement}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 border-2 border-gray-200 hover:border-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(selectedAnnouncement)}
                    disabled={deletingId === selectedAnnouncement}
                    className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {deletingId === selectedAnnouncement
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;
