import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Tag, User, Eye, Pin, Clock } from "lucide-react";
import { announcementsAPI, type Announcement } from "../services/api";
import { PageLoading } from "./Loading";

interface AnnouncementsSectionProps {
  limit?: number;
  showPinnedOnly?: boolean;
  showCategory?: boolean;
}

const AnnouncementsSection = ({
  limit = 6,
  showPinnedOnly = false,
  showCategory = true,
}: AnnouncementsSectionProps) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, [limit, showPinnedOnly]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementsAPI.getPublicAnnouncements({
        limit,
        pinned: showPinnedOnly || undefined,
      });

      if (response.data.success && response.data.data) {
        const announcementsData = response.data.data as any;
        if (Array.isArray(announcementsData)) {
          setAnnouncements(announcementsData);
        } else if (announcementsData.announcements) {
          setAnnouncements(announcementsData.announcements);
        }
      }
    } catch (err: any) {
      console.error("Error fetching announcements:", err);
      setError("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <PageLoading text="Loading announcements..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchAnnouncements}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          No announcements available at the moment.
        </p>
      </div>
    );
  }

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
    <section className="py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Latest {showPinnedOnly ? "Important " : ""}Announcements
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Stay updated with the latest news, achievements, and important
            information from Regina Nostra Schools.
          </p>
        </div>

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
                  {showCategory && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                        announcement.category
                      )}`}
                    >
                      <Tag className="w-3 h-3 inline mr-1" />
                      {announcement.category.charAt(0).toUpperCase() +
                        announcement.category.slice(1)}
                    </span>
                  )}
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

        {/* View All Link */}
        <div className="text-center">
          <Link
            to="/announcements"
            className="inline-flex items-center px-6 py-3 border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white rounded-lg transition-all duration-300 font-semibold"
          >
            <Clock className="w-5 h-5 mr-2" />
            View All Announcements
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AnnouncementsSection;
