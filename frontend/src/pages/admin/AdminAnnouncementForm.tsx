import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Save,
  ArrowLeft,
  Upload,
  X,
  Tag,
  Calendar,
  Users,
  AlertTriangle,
  Eye,
  Paperclip,
  CheckCircle,
  XCircle,
  Plus,
  Settings,
  GraduationCap,
  Check,
  UserCheck,
  Info,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Trash2,
  Type,
  AlignLeft,
  Hash,
  Clock,
  Target,
} from "lucide-react";
import { announcementsAPI, type Announcement } from "../../services/api";
import { PageLoading } from "../../components/Loading";
import { usePageTitle } from "../../usePageTitle";
import toast from "react-hot-toast";

const AdminAnnouncementForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    category: "general",
    priority: "medium",
    status: "draft",
    isPinned: false,
    publishDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    targetAudience: "all",
    customAudience: {
      classes: [] as string[],
      roles: [] as string[],
    },
    tags: [] as string[],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [tagInput, setTagInput] = useState("");

  usePageTitle(isEditing ? "Edit Announcement" : "Create Announcement");

  const categories = [
    { value: "general", label: "General" },
    { value: "academic", label: "Academic" },
    { value: "sports", label: "Sports" },
    { value: "achievement", label: "Achievement" },
    { value: "event", label: "Event" },
    { value: "important", label: "Important" },
  ];

  const priorities = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  const statuses = [
    { value: "draft", label: "Draft" },
    { value: "published", label: "Published" },
    { value: "archived", label: "Archived" },
  ];

  const targetAudiences = [
    { value: "all", label: "All Users" },
    { value: "students", label: "Students Only" },
    { value: "parents", label: "Parents Only" },
    { value: "staff", label: "Staff Only" },
    { value: "custom", label: "Custom Audience" },
  ];

  const availableClasses = [
    "Nursery 1",
    "Nursery 2",
    "Nursery 3",
    "KG 1",
    "KG 2",
    "Primary 1",
    "Primary 2",
    "Primary 3",
    "Primary 4",
    "Primary 5",
    "Primary 6",
  ];

  const availableRoles = ["student", "admin", "teacher", "parent"];

  useEffect(() => {
    if (isEditing && id) {
      fetchAnnouncement();
    }
  }, [isEditing, id]);

  const fetchAnnouncement = async () => {
    try {
      setLoading(true);
      const response = await announcementsAPI.getAnnouncement(id!);

      if (response.data.success && response.data.data) {
        const announcement = response.data.data;
        setFormData({
          title: announcement.title,
          content: announcement.content,
          excerpt: announcement.excerpt,
          category: announcement.category,
          priority: announcement.priority,
          status: announcement.status,
          isPinned: announcement.isPinned,
          publishDate: announcement.publishDate.split("T")[0],
          expiryDate: announcement.expiryDate
            ? announcement.expiryDate.split("T")[0]
            : "",
          targetAudience: announcement.targetAudience,
          customAudience: {
            classes: announcement.customAudience?.classes ?? [],
            roles: announcement.customAudience?.roles ?? [],
          },
          tags: announcement.tags || [],
        });

        if (announcement.imageUrl) {
          setImagePreview(announcement.imageUrl);
        }

        if (announcement.attachments) {
          setExistingAttachments(announcement.attachments);
        }
      }
    } catch (error: any) {
      console.error("Error fetching announcement:", error);
      toast.error("Failed to load announcement");
      navigate("/admin/announcements");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCustomAudienceChange = (
    type: "classes" | "roles",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      customAudience: {
        ...prev.customAudience,
        [type]: prev.customAudience[type].includes(value)
          ? prev.customAudience[type].filter((item) => item !== value)
          : [...prev.customAudience[type], value],
      },
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error("Image size should be less than 5MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    setAttachmentFiles((prev) => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (index: number) => {
    setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim().toLowerCase()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.content.trim()) {
      toast.error("Content is required");
      return;
    }

    try {
      setSaving(true);

      const submitData: any = {
        ...formData,
        publishDate: new Date(formData.publishDate).toISOString(),
        expiryDate: formData.expiryDate
          ? new Date(formData.expiryDate).toISOString()
          : null,
      };

      if (imageFile) {
        submitData.imageFile = imageFile;
      }

      if (attachmentFiles.length > 0) {
        submitData.attachmentFiles = attachmentFiles;
      }

      let response;
      if (isEditing) {
        response = await announcementsAPI.updateAnnouncement(id!, submitData);
      } else {
        response = await announcementsAPI.createAnnouncement(submitData);
      }

      if (response.data.success) {
        toast.success(
          isEditing
            ? "Announcement updated successfully"
            : "Announcement created successfully"
        );
        navigate("/admin/announcements");
      }
    } catch (error: any) {
      console.error("Error saving announcement:", error);
      toast.error(error.message || "Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <PageLoading text="Loading announcement..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/admin/announcements")}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? "Edit Announcement" : "Create Announcement"}
            </h1>
            <p className="mt-1 text-gray-500">
              {isEditing
                ? "Update announcement details"
                : "Create a new announcement for the school community"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Basic Information
              </h3>

              <div className="space-y-6">
                {/* Enhanced Title Input */}
                <div>
                  <label
                    htmlFor="title"
                    className="flex items-center text-sm font-semibold text-gray-700 mb-2"
                  >
                    <span className="text-red-500 mr-1">*</span>
                    Title
                    <span className="ml-2 text-xs text-gray-500 font-normal">
                      (Required)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      className={`block w-full px-4 py-3 border-2 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-0 ${
                        formData.title.length > 200
                          ? "border-red-300 focus:border-red-500 bg-red-50"
                          : formData.title.length > 0
                          ? "border-green-300 focus:border-green-500 bg-green-50"
                          : "border-gray-300 focus:border-blue-500 bg-gray-50 focus:bg-white"
                      }`}
                      placeholder="Enter a compelling announcement title..."
                      required
                      maxLength={200}
                    />
                    {formData.title && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {formData.title.length <= 200 ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-500">
                      Make it clear and attention-grabbing
                    </p>
                    <span
                      className={`text-xs font-medium ${
                        formData.title.length > 200
                          ? "text-red-500"
                          : formData.title.length > 150
                          ? "text-yellow-500"
                          : "text-gray-500"
                      }`}
                    >
                      {formData.title.length}/200
                    </span>
                  </div>
                </div>

                {/* Enhanced Excerpt Input */}
                <div>
                  <label
                    htmlFor="excerpt"
                    className="flex items-center text-sm font-semibold text-gray-700 mb-2"
                  >
                    Excerpt
                    <span className="ml-2 text-xs text-gray-500 font-normal">
                      (Optional - auto-generated if empty)
                    </span>
                  </label>
                  <div className="relative">
                    <textarea
                      id="excerpt"
                      rows={4}
                      value={formData.excerpt}
                      onChange={(e) =>
                        handleInputChange("excerpt", e.target.value)
                      }
                      className={`block w-full px-4 py-3 border-2 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-0 resize-none ${
                        formData.excerpt.length > 300
                          ? "border-red-300 focus:border-red-500 bg-red-50"
                          : formData.excerpt.length > 0
                          ? "border-green-300 focus:border-green-500 bg-green-50"
                          : "border-gray-300 focus:border-blue-500 bg-gray-50 focus:bg-white"
                      }`}
                      placeholder="Brief summary of the announcement (will be visible in previews and social media shares)..."
                      maxLength={300}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-500">
                      {formData.excerpt.length === 0
                        ? "Will be auto-generated from content"
                        : "Brief description for preview cards"}
                    </p>
                    <span
                      className={`text-xs font-medium ${
                        formData.excerpt.length > 300
                          ? "text-red-500"
                          : formData.excerpt.length > 250
                          ? "text-yellow-500"
                          : "text-gray-500"
                      }`}
                    >
                      {formData.excerpt.length}/300
                    </span>
                  </div>
                </div>

                {/* Enhanced Content Input */}
                <div>
                  <label
                    htmlFor="content"
                    className="flex items-center text-sm font-semibold text-gray-700 mb-2"
                  >
                    <span className="text-red-500 mr-1">*</span>
                    Content
                    <span className="ml-2 text-xs text-gray-500 font-normal">
                      (Required)
                    </span>
                  </label>
                  <div className="relative">
                    <textarea
                      id="content"
                      rows={12}
                      value={formData.content}
                      onChange={(e) =>
                        handleInputChange("content", e.target.value)
                      }
                      className={`block w-full px-4 py-3 border-2 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-0 resize-none ${
                        formData.content.length > 5000
                          ? "border-red-300 focus:border-red-500 bg-red-50"
                          : formData.content.length > 0
                          ? "border-green-300 focus:border-green-500 bg-green-50"
                          : "border-gray-300 focus:border-blue-500 bg-gray-50 focus:bg-white"
                      }`}
                      placeholder="Write the full announcement content here. You can include details, instructions, dates, and any other relevant information..."
                      required
                      maxLength={5000}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center space-x-4">
                      <p className="text-sm text-gray-500">
                        Write clearly and include all important details
                      </p>
                      {formData.content.length > 0 && (
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>
                            ≈{" "}
                            {Math.ceil(
                              formData.content.split(" ").length / 200
                            )}{" "}
                            min read
                          </span>
                          <span>•</span>
                          <span>
                            {formData.content.split(" ").length} words
                          </span>
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        formData.content.length > 5000
                          ? "text-red-500"
                          : formData.content.length > 4000
                          ? "text-yellow-500"
                          : "text-gray-500"
                      }`}
                    >
                      {formData.content.length}/5000
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Media Section */}
            <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-blue-500" />
                Media & Attachments
              </h3>

              {/* Enhanced Image Upload */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Featured Image
                    <span className="ml-2 text-xs text-gray-500 font-normal">
                      (Optional - recommended for better engagement)
                    </span>
                  </label>

                  {!imagePreview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors duration-200 bg-gray-50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <span className="text-lg font-medium text-gray-700 hover:text-blue-600">
                          Click to upload image
                        </span>
                        <p className="text-sm text-gray-500 mt-2">
                          PNG, JPG, WEBP up to 5MB
                        </p>
                        <div className="mt-4">
                          <span className="inline-flex items-center px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium">
                            <Upload className="w-4 h-4 mr-2" />
                            Choose Image
                          </span>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-3 right-3 flex space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview("");
                          }}
                          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 shadow-lg"
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <p className="text-white text-sm font-medium">
                          Featured Image
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced File Attachments */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    File Attachments
                    <span className="ml-2 text-xs text-gray-500 font-normal">
                      (Optional - documents, PDFs, etc.)
                    </span>
                  </label>

                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors duration-200 bg-gray-50">
                    <input
                      type="file"
                      multiple
                      onChange={handleAttachmentChange}
                      className="hidden"
                      id="attachment-upload"
                    />
                    <Paperclip className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                    <label
                      htmlFor="attachment-upload"
                      className="cursor-pointer block"
                    >
                      <span className="text-sm font-medium text-gray-700 hover:text-blue-600">
                        Add supporting files
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Multiple files up to 10MB each
                      </p>
                      <div className="mt-3">
                        <span className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm">
                          <Paperclip className="w-4 h-4 mr-1" />
                          Choose Files
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Existing Attachments */}
                  {existingAttachments.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <Paperclip className="w-4 h-4 mr-1" />
                        Current Attachments:
                      </h5>
                      <div className="space-y-2">
                        {existingAttachments.map((attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-100 p-3 rounded-lg border"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Paperclip className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {attachment.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {attachment.size
                                    ? `${(
                                        attachment.size /
                                        1024 /
                                        1024
                                      ).toFixed(1)} MB`
                                    : "Unknown size"}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeExistingAttachment(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Remove attachment"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Attachments */}
                  {attachmentFiles.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <Plus className="w-4 h-4 mr-1" />
                        New Attachments:
                      </h5>
                      <div className="space-y-2">
                        {attachmentFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                <Paperclip className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(1)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Remove attachment"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Tags Section */}
            <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-purple-500" />
                Tags
                <span className="ml-2 text-xs text-gray-500 font-normal">
                  (Help users find related content)
                </span>
              </h3>

              <div className="space-y-4">
                {/* Tag Input */}
                <div className="relative">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 relative">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        className="pl-10 pr-4 block w-full px-4 py-3 border-2 border-gray-300 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-0 focus:border-purple-500 bg-gray-50 focus:bg-white"
                        placeholder="Add a tag and press Enter (e.g., competition, achievement, sports)"
                        maxLength={50}
                      />
                      {tagInput && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-xs text-gray-500">
                            Press Enter to add
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={addTag}
                      disabled={
                        !tagInput.trim() ||
                        formData.tags.includes(tagInput.trim())
                      }
                      className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                  {tagInput.trim() &&
                    formData.tags.includes(tagInput.trim()) && (
                      <p className="text-sm text-yellow-600 mt-1 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        This tag already exists
                      </p>
                    )}
                </div>

                {/* Popular Tags Suggestions */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Popular tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "academic",
                      "sports",
                      "competition",
                      "achievement",
                      "important",
                      "event",
                      "announcement",
                    ].map((suggestedTag) => (
                      <button
                        key={suggestedTag}
                        type="button"
                        onClick={() => {
                          if (!formData.tags.includes(suggestedTag)) {
                            setTagInput(suggestedTag);
                            addTag();
                            setTagInput("");
                          }
                        }}
                        disabled={formData.tags.includes(suggestedTag)}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-purple-100 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        #{suggestedTag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Tags */}
                {formData.tags.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-700 font-medium mb-3 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                      Current tags ({formData.tags.length}/10):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium group hover:bg-purple-200 transition-colors duration-200"
                        >
                          <Tag className="w-3 h-3 mr-1" />#{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 p-0.5 text-purple-600 hover:text-purple-800 hover:bg-purple-300 rounded-full transition-colors duration-200"
                            title="Remove tag"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Tag className="h-4 w-4 text-blue-400 mt-0.5" />
                    </div>
                    <div className="ml-2">
                      <p className="text-sm text-blue-800 font-medium">
                        Tips for effective tagging:
                      </p>
                      <ul className="text-xs text-blue-700 mt-1 space-y-1">
                        <li>
                          • Use relevant keywords that users might search for
                        </li>
                        <li>
                          • Keep tags short and descriptive (e.g., "sports",
                          "academic")
                        </li>
                        <li>
                          • Maximum 10 tags recommended for better organization
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-6">
            {/* Enhanced Publish Settings */}
            <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-green-500" />
                Publishing Settings
              </h3>

              <div className="space-y-5">
                {/* Status */}
                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Status
                  </label>
                  <div className="relative">
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) =>
                        handleInputChange("status", e.target.value)
                      }
                      className="block w-full px-4 py-3 border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-0 focus:border-green-500 bg-gray-50 focus:bg-white appearance-none transition-all duration-200"
                    >
                      {statuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      {formData.status === "published" && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {formData.status === "draft" && (
                        <Eye className="w-5 h-5 text-yellow-500" />
                      )}
                      {formData.status === "archived" && (
                        <XCircle className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                  {formData.status === "published" && (
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Will be visible to selected audience
                    </p>
                  )}
                  {formData.status === "draft" && (
                    <p className="text-xs text-yellow-600 mt-1 flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      Only visible to admins
                    </p>
                  )}
                </div>

                {/* Pin to Top */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <label
                        htmlFor="isPinned"
                        className="text-sm font-semibold text-gray-700 flex items-center"
                      >
                        <Tag className="w-4 h-4 mr-1 text-red-500" />
                        Pin to top
                      </label>
                      <p className="text-xs text-gray-600 mt-1">
                        Pinned announcements appear first
                      </p>
                    </div>
                    <div className="relative inline-block">
                      <input
                        type="checkbox"
                        id="isPinned"
                        checked={formData.isPinned}
                        onChange={(e) =>
                          handleInputChange("isPinned", e.target.checked)
                        }
                        className="sr-only"
                      />
                      <label
                        htmlFor="isPinned"
                        className={`block w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
                          formData.isPinned ? "bg-red-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${
                            formData.isPinned
                              ? "translate-x-6"
                              : "translate-x-0.5"
                          } mt-0.5`}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Publish Date */}
                <div>
                  <label
                    htmlFor="publishDate"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Publish Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="date"
                      id="publishDate"
                      value={formData.publishDate}
                      onChange={(e) =>
                        handleInputChange("publishDate", e.target.value)
                      }
                      className="pl-10 block w-full px-4 py-3 border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-0 focus:border-green-500 bg-gray-50 focus:bg-white transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Expiry Date */}
                <div>
                  <label
                    htmlFor="expiryDate"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Expiry Date
                    <span className="ml-2 text-xs text-gray-500 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="date"
                      id="expiryDate"
                      value={formData.expiryDate}
                      onChange={(e) =>
                        handleInputChange("expiryDate", e.target.value)
                      }
                      min={formData.publishDate}
                      className="pl-10 block w-full px-4 py-3 border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-0 focus:border-green-500 bg-gray-50 focus:bg-white transition-all duration-200"
                    />
                    {formData.expiryDate && (
                      <button
                        type="button"
                        onClick={() => handleInputChange("expiryDate", "")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        title="Clear expiry date"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {formData.expiryDate && (
                    <p className="text-xs text-blue-600 mt-1">
                      Will be hidden after{" "}
                      {new Date(formData.expiryDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Categorization */}
            <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-indigo-500" />
                Categorization
              </h3>

              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Category
                  </label>
                  <div className="relative">
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) =>
                        handleInputChange("category", e.target.value)
                      }
                      className="block w-full px-4 py-3 border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-0 focus:border-indigo-500 bg-gray-50 focus:bg-white appearance-none transition-all duration-200"
                    >
                      {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <Tag className="w-5 h-5 text-indigo-400" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Choose the most appropriate category for this announcement
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="priority"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Priority Level
                  </label>
                  <div className="relative">
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) =>
                        handleInputChange("priority", e.target.value)
                      }
                      className="block w-full px-4 py-3 border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-0 focus:border-indigo-500 bg-gray-50 focus:bg-white appearance-none transition-all duration-200"
                    >
                      {priorities.map((priority) => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      {formData.priority === "urgent" && (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      )}
                      {formData.priority === "high" && (
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                      )}
                      {formData.priority === "medium" && (
                        <Target className="w-5 h-5 text-blue-500" />
                      )}
                      {formData.priority === "low" && (
                        <Target className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className="mt-1 text-xs">
                    {formData.priority === "urgent" && (
                      <span className="text-red-600 font-medium flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Will be prominently displayed
                      </span>
                    )}
                    {formData.priority === "high" && (
                      <span className="text-orange-600 font-medium">
                        High priority - shown above normal announcements
                      </span>
                    )}
                    {formData.priority === "medium" && (
                      <span className="text-blue-600">
                        Medium priority - standard display
                      </span>
                    )}
                    {formData.priority === "low" && (
                      <span className="text-gray-600">
                        Low priority - minimal emphasis
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Audience Settings */}
            <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-500" />
                Target Audience
              </h3>

              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="targetAudience"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Audience Type
                  </label>
                  <div className="relative">
                    <select
                      id="targetAudience"
                      value={formData.targetAudience}
                      onChange={(e) =>
                        handleInputChange("targetAudience", e.target.value)
                      }
                      className="block w-full px-4 py-3 border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-0 focus:border-purple-500 bg-gray-50 focus:bg-white appearance-none transition-all duration-200"
                    >
                      {targetAudiences.map((audience) => (
                        <option key={audience.value} value={audience.value}>
                          {audience.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <Users className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Choose who should see this announcement
                  </p>
                </div>

                {formData.targetAudience === "custom" && (
                  <div className="space-y-5 border-2 border-dashed border-purple-200 rounded-xl p-4 bg-purple-25">
                    <div className="flex items-center mb-3">
                      <Settings className="w-4 h-4 text-purple-500 mr-2" />
                      <span className="text-sm font-semibold text-purple-700">
                        Custom Audience Settings
                      </span>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <GraduationCap className="w-4 h-4 mr-1 text-blue-500" />
                        Classes
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {availableClasses.map((className) => {
                          const isSelected =
                            formData.customAudience.classes.includes(className);
                          return (
                            <label
                              key={className}
                              className={`relative flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                                isSelected
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 bg-white hover:border-blue-300"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  handleCustomAudienceChange(
                                    "classes",
                                    className
                                  )
                                }
                                className="sr-only"
                              />

                              <div
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center mr-3 transition-colors duration-200 ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {isSelected && (
                                  <Check className="w-2.5 h-2.5 text-white" />
                                )}
                              </div>

                              <span
                                className={`text-sm font-medium transition-colors duration-200 ${
                                  isSelected ? "text-blue-900" : "text-gray-700"
                                }`}
                              >
                                {className}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <UserCheck className="w-4 h-4 mr-1 text-green-500" />
                        Roles
                      </label>
                      <div className="space-y-3">
                        {availableRoles.map((role) => {
                          const isSelected =
                            formData.customAudience.roles.includes(role);
                          return (
                            <label
                              key={role}
                              className={`relative flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                                isSelected
                                  ? "border-green-500 bg-green-50"
                                  : "border-gray-200 bg-white hover:border-green-300"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  handleCustomAudienceChange("roles", role)
                                }
                                className="sr-only"
                              />

                              <div
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center mr-3 transition-colors duration-200 ${
                                  isSelected
                                    ? "border-green-500 bg-green-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {isSelected && (
                                  <Check className="w-2.5 h-2.5 text-white" />
                                )}
                              </div>

                              <span
                                className={`text-sm font-medium capitalize transition-colors duration-200 ${
                                  isSelected
                                    ? "text-green-900"
                                    : "text-gray-700"
                                }`}
                              >
                                {role}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Audience Summary */}
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <div className="flex items-center mb-2">
                        <Info className="w-4 h-4 text-purple-500 mr-2" />
                        <span className="text-sm font-medium text-purple-700">
                          Selection Summary
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>
                          Classes: {formData.customAudience.classes.length}{" "}
                          selected
                        </div>
                        <div>
                          Roles: {formData.customAudience.roles.length} selected
                        </div>
                        {formData.customAudience.classes.length === 0 &&
                          formData.customAudience.roles.length === 0 && (
                            <div className="text-amber-600 font-medium">
                              ⚠️ No audience selected
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Actions */}
            <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Save className="w-5 h-5 mr-2 text-green-500" />
                Actions
              </h3>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-xl hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-4 focus:ring-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      {isEditing
                        ? "Update Announcement"
                        : "Create Announcement"}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/admin/announcements")}
                  className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-500/30 flex items-center justify-center font-medium text-sm transition-all duration-200 border-2 border-gray-200 hover:border-gray-300"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancel & Go Back
                </button>
              </div>

              {/* Status Warning */}
              {formData.status === "published" && (
                <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-semibold text-amber-800">
                        Publishing Notice
                      </h4>
                      <p className="text-sm text-amber-700 mt-1">
                        This announcement will be published immediately and
                        visible to the selected audience.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview Link */}
              {isEditing && (
                <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <a
                    href={`/announcements/${id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-600 transition-colors duration-200"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Live Announcement
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                  <p className="text-xs text-blue-600 mt-1">
                    Opens in a new tab to show how users will see this
                    announcement
                  </p>
                </div>
              )}

              {/* Form Status Indicator */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center text-xs text-gray-600 mb-1">
                  <Info className="w-3 h-3 mr-1" />
                  <span className="font-medium">
                    {isEditing ? "Editing Mode" : "Creation Mode"}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  All fields marked with <span className="text-red-500">*</span>{" "}
                  are required
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminAnnouncementForm;
