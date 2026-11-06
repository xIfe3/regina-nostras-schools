import React, { useCallback, useEffect, useState } from "react";
import { KeyRound, Users } from "lucide-react";
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
  const [confirmReset, setConfirmReset] = useState(false);

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

  const run = async (resend: boolean) => {
    try {
      setWorking(true);
      setConfirmReset(false);
      const res = await adminAPI.createOrResendParentAccount(studentId, resend);
      const result = res.data.data || null;
      setLastResult(result);
      if (result?.emailSent === false) {
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
                This sets a new password and emails it to the parent. Their
                old password will stop working.
              </span>
              <button
                onClick={() => run(true)}
                disabled={working}
                className="px-3 py-1.5 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                Yes, reset
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              disabled={working}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              <KeyRound className="h-4 w-4 mr-2" />
              Reset &amp; resend parent password
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            No parent login is linked to this student yet. A login is created
            from the parent/guardian email on the student record.
          </p>
          <button
            onClick={() => run(false)}
            disabled={working}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-[#0C4A9F] hover:bg-[#0A2F66] disabled:opacity-50"
          >
            <KeyRound className="h-4 w-4 mr-2" />
            {working ? "Working..." : "Create parent login"}
          </button>
        </div>
      )}

      {lastResult?.temporaryPassword && lastResult.emailSent === false && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3 text-sm">
          <p className="text-red-800">
            The email could not be sent. Give the parent these login details:
          </p>
          <p className="mt-1 font-mono text-gray-900">
            {lastResult.email} / {lastResult.temporaryPassword}
          </p>
        </div>
      )}
    </div>
  );
};

export default ParentPortalAccess;
