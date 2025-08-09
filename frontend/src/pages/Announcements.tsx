import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Tag,
  User,
  Eye,
  Pin,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { announcementsAPI, type Announcement } from "../services/api";
import { PageLoading } from "../components/Loading";
import { usePageTitle } from "../usePageTitle";

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    category: "",
    search: "",
    pinned: false,
  });
  const [showFilters, setShowFilters] = useState(false);

  usePageTitle("Announcements");

  const itemsPerPage = 12;
  const categories = [
    "general",
    "academic",
    "sports",
    "achievement",
    "event",
    "important",
  ];

  useEffect(() => {
    fetchAnnouncements();
  }, [currentPage, filters]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (filters.category) params.category = filters.category;
      if (filters.pinned) params.pinned = true;

      const response = await announcementsAPI.getPublicAnnouncements(params);

      if (response.data.success && response.data.data) {
        const data = response.data.data as any;
        setAnnouncements(data.announcements || []);

        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalItems(data.pagination.totalItems || 0);
        }
      }
    } catch (err: any) {
      console.error("Error fetching announcements:", err);
      setError("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "🚨";
      case "high":
        return "⚠️";
      case "medium":
        return "ℹ️";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            School Announcements
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Stay informed about the latest news, events, and important updates
            from Regina Nostra Schools.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            {/* Pinned Filter */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.pinned}
                onChange={(e) => handleFilterChange("pinned", e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="text-sm text-gray-700">Pinned Only</span>
            </label>

            {/* Results Count */}
            <div className="text-sm text-gray-500">
              {totalItems} announcement{totalItems !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <PageLoading text="Loading announcements..." />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchAnnouncements}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Try again
            </button>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Announcements Found
              </h3>
              <p className="text-gray-600 mb-4">
                {filters.category || filters.search || filters.pinned
                  ? "Try adjusting your filters to see more results."
                  : "There are no announcements available at the moment."}
              </p>
              {(filters.category || filters.search || filters.pinned) && (
                <button
                  onClick={() => {
                    setFilters({ category: "", search: "", pinned: false });
                    setCurrentPage(1);
                  }}
                  className="bg-[var(--color-primary)] hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Announcements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {announcements.map((announcement) => (
                <div
                  key={announcement._id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  {/* Image */}
                  {announcement.imageUrl && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={announcement.imageUrl}
                        alt={announcement.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {announcement.isPinned && (
                        <div className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full shadow-lg">
                          <Pin className="w-4 h-4" />
                        </div>
                      )}
                      {announcement.priority !== "low" && (
                        <div className="absolute top-3 left-3 bg-white text-gray-800 px-2 py-1 rounded-full text-sm font-medium shadow-lg">
                          {getPriorityIcon(announcement.priority)}{" "}
                          {announcement.priority.toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-6">
                    {/* Category and Date */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                          announcement.category
                        )}`}
                      >
                        <Tag className="w-3 h-3 inline mr-1" />
                        {announcement.category.charAt(0).toUpperCase() +
                          announcement.category.slice(1)}
                      </span>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(announcement.publishDate)}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {announcement.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {announcement.excerpt}
                    </p>

                    {/* Tags */}
                    {announcement.tags && announcement.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {announcement.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                        {announcement.tags.length > 3 && (
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                            +{announcement.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center text-sm text-gray-500">
                        <User className="w-4 h-4 mr-1" />
                        <span>By Admin</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Eye className="w-4 h-4 mr-1" />
                        <span>{announcement.views}</span>
                      </div>
                    </div>

                    {/* Read More Button */}
                    <Link
                      to={`/announcements/${announcement._id}`}
                      className="block w-full mt-4 bg-[var(--color-primary)] hover:bg-blue-800 text-white text-center py-2 px-4 rounded-lg transition-colors duration-300 font-medium"
                    >
                      Read More
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
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
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg ${
                        currentPage === page
                          ? "bg-[var(--color-primary)] text-white"
                          : "border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white rounded-lg transition-all duration-300 font-semibold"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Announcements;
