import React, { useCallback, useEffect, useState } from "react";
import { Copy, Eye, KeyRound, Mail, Users, X } from "lucide-react";
import toast from "react-hot-toast";
import { adminAPI } from "../../services/api";
import type { ParentAccountResult } from "../../services/api";

interface LinkedParent {
  _id: string;
  name: string;
  phoneNumber?: string;
  childrenCount: number;
  user?: { email: string; isActive: boolean; lastLogin?: string };
}

/**
 * Admin panel on the student page: shows the parent portal login linked to the
 * student and lets the admin create it or reset/resend the password.
 */
const ParentPortalAccess: React.FC<{ studentId: string }> = ({ studentId }) => {
  const [parent, setParent] = useState<LinkedParent | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [lastResult, setLastResult] = useState<ParentAccountResult | null>(
    null
  );
  // Which reset the admin is confirming: email the new password, or show it on screen
  const [confirmReset, setConfirmReset] = useState<null | "email" | "show">(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getStudentParentAccount(studentId);
      setParent(res.data.data || null);
    } catch (error) {
      console.error("Failed to load parent account:", error);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (resend: boolean, sendEmail = true) => {
    try {
      setWorking(true);
      setConfirmReset(null);
      const res = await adminAPI.createOrResendParentAccount(studentId, resend, sendEmail);
      const result = res.data.data || null;
      setLastResult(result);
      if (result?.shownOnScreen) {
        toast.success("New password ready. Give it to the parent privately.");
      } else if (result?.emailSent === false) {
        toast(result.message, { icon: "⚠️", duration: 6000 });
      } else {
        toast.success(res.data.message || "Done");
      }
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update parent login"
      );
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <Users className="h-5 w-5 mr-2" />
        Parent Portal Access
      </h3>

      {loading ? (
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      ) : parent ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-500">Login email</p>
              <p className="text-gray-900">{parent.user?.email}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Parent name</p>
              <p className="text-gray-900">{parent.name || "—"}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Last login</p>
              <p className="text-gray-900">
                {parent.user?.lastLogin
                  ? new Date(parent.user.lastLogin).toLocaleString()
                  : "Never logged in"}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Children on account</p>
              <p className="text-gray-900">{parent.childrenCount}</p>
            </div>
          </div>

          {confirmReset ? (
            <div className="flex flex-wrap items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm">
              <span className="text-yellow-800">
                {confirmReset === "email"
                  ? "This sets a new password and emails it to the parent."
                  : "This sets a new password and shows it here so you can give it to the parent (by phone, SMS or in person). No email is sent."}{" "}
                Their old password will stop working.
              </span>
              <button
                onClick={() => run(true, confirmReset === "email")}
                disabled={working}
                className="px-3 py-1.5 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                {working ? "Working..." : "Yes, reset"}
              </button>
              <button
                onClick={() => setConfirmReset(null)}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setConfirmReset("email")}
                disabled={working}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email a new password
              </button>
              <button
                onClick={() => setConfirmReset("show")}
                disabled={working}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Show a new password
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            No parent login is linked to this student yet. A login is created
            from the parent/guardian email on the student record.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => run(false)}
              disabled={working}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-[#0C4A9F] hover:bg-[#0A2F66] disabled:opacity-50"
            >
              <KeyRound className="h-4 w-4 mr-2" />
              {working ? "Working..." : "Create & email parent login"}
            </button>
            <button
              onClick={() => run(false, false)}
              disabled={working}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              Create & show password
            </button>
          </div>
        </div>
      )}

      {lastResult?.temporaryPassword && lastResult.emailSent === false && (
        <div
          className={`mt-4 rounded-md border p-4 text-sm ${
            lastResult.shownOnScreen
              ? "border-[#0C4A9F]/30 bg-[#0C4A9F]/5"
              : "border-red-200 bg-red-50"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className={lastResult.shownOnScreen ? "text-slate-800" : "text-red-800"}>
              {lastResult.shownOnScreen
                ? "Give the parent these login details privately. They can change the password under Settings after signing in."
                : "The email could not be sent. Give the parent these login details:"}
            </p>
            <button
              onClick={() => setLastResult(null)}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Hide login details"
              title="Hide"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <dl className="mt-3 grid grid-cols-[auto,1fr] gap-x-4 gap-y-1">
            <dt className="text-slate-500">Website</dt>
            <dd className="font-mono text-slate-900">{window.location.origin}/login</dd>
            <dt className="text-slate-500">Email</dt>
            <dd className="font-mono text-slate-900">{lastResult.email}</dd>
            <dt className="text-slate-500">Password</dt>
            <dd className="font-mono text-lg font-semibold tracking-wider text-slate-900">
              {lastResult.temporaryPassword}
            </dd>
          </dl>
          <button
            onClick={() => {
              navigator.clipboard
                .writeText(
                  `Parent portal login\nWebsite: ${window.location.origin}/login\nEmail: ${lastResult.email}\nPassword: ${lastResult.temporaryPassword}`
                )
                .then(() => toast.success("Login details copied"))
                .catch(() => toast.error("Could not copy. Please copy them by hand."));
            }}
            className="mt-3 inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy login details
          </button>
        </div>
      )}
    </div>
  );
};

export default ParentPortalAccess;
