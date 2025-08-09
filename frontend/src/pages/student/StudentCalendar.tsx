import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Book,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  CheckCircle,
  Download,
  ExternalLink,
} from "lucide-react";
import { eventsAPI } from "../../services/api";
import toast from "react-hot-toast";

interface CalendarEvent {
  _id: string;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  type: "exam" | "holiday" | "meeting" | "sports" | "academic" | "other";
  location?: string;
  mandatory: boolean;
  organizer?: {
    email: string;
  };
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
  tags?: string[];
}

const StudentCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]); // Refetch when month changes

  useEffect(() => {
    filterEvents();
  }, [events, filterType]);

  const fetchEvents = async () => {
    try {
      setLoading(true);

      // Calculate date range for current month view
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      const response = await eventsAPI.getStudentEvents({
        startDate: startOfMonth.toISOString().split("T")[0],
        endDate: endOfMonth.toISOString().split("T")[0],
        limit: 100, // Get all events for the month
      });

      if (response.data.success) {
        setEvents(response.data.data || []);
      } else {
        toast.error("Failed to fetch events");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Error loading events");
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    if (filterType !== "all") {
      filtered = filtered.filter((event) => event.type === filterType);
    }

    // Sort by date
    filtered.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    setFilteredEvents(filtered);
  };

  const getEventTypeColor = (type: string): string => {
    switch (type) {
      case "exam":
        return "bg-red-100 text-red-800 border-red-200";
      case "holiday":
        return "bg-green-100 text-green-800 border-green-200";
      case "meeting":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "sports":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "academic":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "exam":
        return <Book className="h-4 w-4" />;
      case "holiday":
        return <Calendar className="h-4 w-4" />;
      case "meeting":
        return <Users className="h-4 w-4" />;
      case "sports":
        return <Users className="h-4 w-4" />;
      case "academic":
        return <Book className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateString = date.toISOString().split("T")[0];
    return events.filter((event) => event.date === dateString);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSameMonth = (date: Date, month: Date): boolean => {
    return (
      date.getMonth() === month.getMonth() &&
      date.getFullYear() === month.getFullYear()
    );
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get upcoming events (next 5 events)
  const upcomingEvents = filteredEvents
    .filter((event) => new Date(event.date) >= new Date())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Academic Calendar</h1>
        <p className="mt-1 text-sm text-gray-500">
          View important dates and school events
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth("prev")}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateMonth("next")}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day Headers */}
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="h-8 flex items-center justify-center text-sm font-medium text-gray-700"
                >
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {days.map((day, index) => {
                const dayEvents = getEventsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isTodayDate = isToday(day);

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.01 }}
                    className={`h-20 border border-gray-200 cursor-pointer transition-colors ${
                      isCurrentMonth
                        ? "bg-white hover:bg-gray-50"
                        : "bg-gray-50"
                    } ${isTodayDate ? "ring-2 ring-green-500" : ""}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="p-1 h-full flex flex-col">
                      <div
                        className={`text-sm ${
                          isCurrentMonth ? "text-gray-900" : "text-gray-400"
                        } ${isTodayDate ? "font-bold text-green-600" : ""}`}
                      >
                        {day.getDate()}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event._id}
                            className={`text-xs p-1 mb-1 rounded truncate ${getEventTypeColor(
                              event.type
                            )}`}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Filter */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Filter Events
            </h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="eventFilter"
                  value="all"
                  checked={filterType === "all"}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">All Events</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="eventFilter"
                  value="exam"
                  checked={filterType === "exam"}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Examinations</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="eventFilter"
                  value="holiday"
                  checked={filterType === "holiday"}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Holidays</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="eventFilter"
                  value="academic"
                  checked={filterType === "academic"}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Academic Events
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="eventFilter"
                  value="sports"
                  checked={filterType === "sports"}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Sports</span>
              </label>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Upcoming Events
            </h3>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`p-2 rounded-lg ${getEventTypeColor(
                          event.type
                        )}`}
                      >
                        {getEventTypeIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {event.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {new Date(event.date).toLocaleDateString()}
                        </p>
                        {event.startTime && (
                          <div className="flex items-center mt-1">
                            <Clock className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">
                              {event.startTime}
                              {event.endTime && ` - ${event.endTime}`}
                            </span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center mt-1">
                            <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">
                              {event.location}
                            </span>
                          </div>
                        )}
                        {event.mandatory && (
                          <div className="flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 text-red-500 mr-1" />
                            <span className="text-xs text-red-600 font-medium">
                              Mandatory
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Event Legend */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Event Types
            </h3>
            <div className="space-y-2">
              {[
                { type: "exam", label: "Examinations" },
                { type: "holiday", label: "Holidays" },
                { type: "meeting", label: "Meetings" },
                { type: "sports", label: "Sports" },
                { type: "academic", label: "Academic" },
                { type: "other", label: "Other" },
              ].map((item) => (
                <div key={item.type} className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded ${getEventTypeColor(
                      item.type
                    )}`}
                  ></div>
                  <span className="text-sm text-gray-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Date Events Modal */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Events on {selectedDate.toLocaleDateString()}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <CheckCircle className="h-6 w-6" />
              </button>
            </div>

            {(() => {
              const dayEvents = getEventsForDate(selectedDate);
              if (dayEvents.length === 0) {
                return (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No events
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      There are no events scheduled for this date.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {dayEvents.map((event) => (
                    <div
                      key={event._id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-lg ${getEventTypeColor(
                            event.type
                          )}`}
                        >
                          {getEventTypeIcon(event.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {event.title}
                          </h4>
                          {event.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {event.description}
                            </p>
                          )}
                          {event.startTime && (
                            <div className="flex items-center mt-2">
                              <Clock className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-500">
                                {event.startTime}
                                {event.endTime && ` - ${event.endTime}`}
                              </span>
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center mt-1">
                              <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-500">
                                {event.location}
                              </span>
                            </div>
                          )}
                          {event.mandatory && (
                            <div className="flex items-center mt-1">
                              <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                              <span className="text-sm text-red-600 font-medium">
                                Mandatory
                              </span>
                            </div>
                          )}
                          {event.organizer && (
                            <div className="flex items-center mt-1">
                              <Users className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-500">
                                Organized by: {event.organizer.email}
                              </span>
                            </div>
                          )}
                          {event.attachments &&
                            event.attachments.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700 mb-1">
                                  Attachments:
                                </p>
                                <div className="space-y-1">
                                  {event.attachments.map(
                                    (attachment, index) => (
                                      <a
                                        key={index}
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                                      >
                                        <Download className="h-3 w-3 mr-1" />
                                        {attachment.name}
                                        <ExternalLink className="h-3 w-3 ml-1" />
                                      </a>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          {event.tags && event.tags.length > 0 && (
                            <div className="mt-2">
                              <div className="flex flex-wrap gap-1">
                                {event.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedDate(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StudentCalendar;
