import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Calendar,
  Tag,
  User,
  Eye,
  Pin,
  Download,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { announcementsAPI, type Announcement } from "../services/api";
import { PageLoading } from "../components/Loading";
import { usePageTitle } from "../usePageTitle";

const AnnouncementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageTitle(announcement?.title || "Announcement");

  useEffect(() => {
    if (id) {
      fetchAnnouncement();
    }
  }, [id]);

  const fetchAnnouncement = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await announcementsAPI.getAnnouncement(id!);

      if (response.data.success && response.data.data) {
        setAnnouncement(response.data.data);
      } else {
        setError("Announcement not found");
      }
    } catch (err: any) {
      console.error("Error fetching announcement:", err);
      setError(err.message || "Failed to load announcement");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PageLoading text="Loading announcement..." />
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || "Announcement Not Found"}
          </h2>
          <p className="text-gray-600 mb-6">
            The announcement you're looking for doesn't exist or has been
            removed.
          </p>
          <Link
            to="/announcements"
            className="inline-flex items-center px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:bg-blue-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Announcements
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "text-gray-600",
      medium: "text-blue-600",
      high: "text-orange-600",
      urgent: "text-red-600",
    };
    return colors[priority as keyof typeof colors] || colors.medium;
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
        return "📋";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/announcements"
            className="inline-flex items-center text-[var(--color-primary)] hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Announcements
          </Link>
        </div>

        {/* Announcement Card */}
        <article className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Image */}
          {announcement.imageUrl && (
            <div className="relative h-64 md:h-80 overflow-hidden">
              <img
                src={announcement.imageUrl}
                alt={announcement.title}
                className="w-full h-full object-cover"
              />
              {announcement.isPinned && (
                <div className="absolute top-4 right-4 bg-red-500 text-white p-3 rounded-full shadow-lg">
                  <Pin className="w-6 h-6" />
                </div>
              )}
            </div>
          )}

          <div className="p-8">
            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${getCategoryColor(
                  announcement.category
                )}`}
              >
                <Tag className="w-4 h-4 inline mr-2" />
                {announcement.category.charAt(0).toUpperCase() +
                  announcement.category.slice(1)}
              </span>

              <div
                className={`flex items-center text-sm font-medium ${getPriorityColor(
                  announcement.priority
                )}`}
              >
                <span className="mr-2 text-lg">
                  {getPriorityIcon(announcement.priority)}
                </span>
                {announcement.priority.toUpperCase()} PRIORITY
              </div>

              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-2" />
                Published {formatDate(announcement.publishDate)}
              </div>

              <div className="flex items-center text-sm text-gray-500">
                <Eye className="w-4 h-4 mr-2" />
                {announcement.views} views
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
              {announcement.title}
            </h1>

            {/* Author and Date */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-gray-600">
                  Published by Regina Nostra Schools Admin
                </span>
              </div>

              {announcement.expiryDate && (
                <div className="flex items-center text-sm text-amber-600">
                  <Clock className="w-4 h-4 mr-2" />
                  Expires {formatDate(announcement.expiryDate)}
                </div>
              )}
            </div>

            {/* Content */}
            <div
              className="prose prose-lg max-w-none mb-8 text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: announcement.content.replace(/\n/g, "<br />"),
              }}
            />

            {/* Tags */}
            {announcement.tags && announcement.tags.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {announcement.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm transition-colors cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {announcement.attachments &&
              announcement.attachments.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Attachments
                  </h3>
                  <div className="grid gap-4">
                    {announcement.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
                      >
                        <div className="flex items-center">
                          <Download className="w-5 h-5 text-gray-500 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {attachment.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {attachment.type}{" "}
                              {attachment.size &&
                                `• ${Math.round(attachment.size / 1024)} KB`}
                            </p>
                          </div>
                        </div>
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[var(--color-primary)] hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <Link
                to="/announcements"
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-center py-3 px-6 rounded-lg transition-colors font-medium"
              >
                View All Announcements
              </Link>
              <Link
                to="/"
                className="flex-1 bg-[var(--color-primary)] hover:bg-blue-800 text-white text-center py-3 px-6 rounded-lg transition-colors font-medium"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default AnnouncementDetail;
