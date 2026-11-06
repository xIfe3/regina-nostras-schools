import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, BookOpen, CreditCard, FileText, Users } from "lucide-react";
import { parentAPI } from "../../services/api";
import type { ParentChild } from "../../services/api";
import { childFullName, useParentContext } from "./parentContext";

interface ResultSummary {
  _id: string;
  academicSession: string;
  term: string;
  subjects: unknown[];
  summary: {
    averageScore: number;
    overallGrade: string;
    position: number;
    totalStudents: number;
  };
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const statusColor: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  graduated: "bg-blue-100 text-blue-800",
  transferred: "bg-gray-100 text-gray-800",
  suspended: "bg-red-100 text-red-800",
};

const ChildAvatar: React.FC<{ child: ParentChild; size?: string }> = ({
  child,
  size = "h-14 w-14",
}) =>
  child.personalInfo.profilePhoto ? (
    <img
      src={child.personalInfo.profilePhoto}
      alt={childFullName(child)}
      className={`${size} rounded-full object-cover`}
    />
  ) : (
    <div
      className={`${size} rounded-full bg-[#0C4A9F] flex items-center justify-center text-white text-lg font-semibold`}
    >
      {child.personalInfo.firstName.charAt(0)}
      {child.personalInfo.lastName.charAt(0)}
    </div>
  );

const ParentOverview: React.FC = () => {
  const { profile, children, selectedChild, selectChild } = useParentContext();
  const navigate = useNavigate();
  const [latestResult, setLatestResult] = useState<ResultSummary | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);

  useEffect(() => {
    if (!selectedChild) return;
    let cancelled = false;
    setLoadingResult(true);
    parentAPI
      .getChildResults(selectedChild._id)
      .then((res) => {
        if (!cancelled) setLatestResult((res.data.data || [])[0] || null);
      })
      .catch(() => {
        if (!cancelled) setLatestResult(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingResult(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedChild]);

  const goTo = (child: ParentChild, path: string) => {
    selectChild(child._id);
    navigate(path);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome{profile?.name ? `, ${profile.name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Follow your {children.length === 1 ? "child's" : "children's"}{" "}
          results and school payments.
        </p>
      </div>

      {children.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No children linked yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Please contact the school office to link your child to this
            account.
          </p>
        </div>
      ) : (
        <>
          {/* Children cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {children.map((child, index) => {
              const isSelected = child._id === selectedChild?._id;
              return (
                <motion.div
                  key={child._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white shadow rounded-lg p-6 border-2 ${
                    isSelected ? "border-[#0C4A9F]" : "border-transparent"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectChild(child._id)}
                    className="flex items-center w-full text-left"
                  >
                    <ChildAvatar child={child} />
                    <div className="ml-4 min-w-0">
                      <p className="text-lg font-semibold text-gray-900 truncate">
                        {childFullName(child)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {child.academicInfo.currentClass}
                        {child.academicInfo.classArm
                          ? ` ${child.academicInfo.classArm}`
                          : ""}{" "}
                        · {child.studentId}
                      </p>
                      <span
                        className={`mt-1 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColor[child.academicInfo.status] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {capitalize(child.academicInfo.status)}
                      </span>
                    </div>
                  </button>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => goTo(child, "/parent/results")}
                      className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-white bg-[#0C4A9F] hover:bg-[#0A2F66]"
                    >
                      <FileText className="h-4 w-4 mr-1.5" />
                      Results
                    </button>
                    <button
                      onClick={() => goTo(child, "/parent/payments")}
                      className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                    >
                      <CreditCard className="h-4 w-4 mr-1.5" />
                      Payments
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Latest result for the selected child */}
          {selectedChild && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Latest result — {childFullName(selectedChild)}
                </h2>
              </div>
              <div className="px-6 py-5">
                {loadingResult ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C4A9F]"></div>
                  </div>
                ) : !latestResult ? (
                  <p className="text-sm text-gray-500">
                    No published results yet. You will see them here as soon
                    as the school publishes them.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="text-sm text-gray-500">Term</p>
                      <p className="font-medium text-gray-900">
                        {latestResult.academicSession} ·{" "}
                        {capitalize(latestResult.term)} term
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Award className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Average / Grade</p>
                        <p className="font-medium text-gray-900">
                          {latestResult.summary.averageScore}% · Grade{" "}
                          {latestResult.summary.overallGrade}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Position</p>
                        <p className="font-medium text-gray-900">
                          {latestResult.summary.position} of{" "}
                          {latestResult.summary.totalStudents}
                        </p>
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <button
                        onClick={() => navigate("/parent/results")}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-[#0C4A9F] hover:bg-[#0A2F66]"
                      >
                        View all results
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ParentOverview;
