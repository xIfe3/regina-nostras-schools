import React, { useEffect, useState } from "react";
import { Lock, User } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI, parentAPI } from "../../services/api";
import { useParentContext } from "./parentContext";

const inputClass =
  "mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-[#0C4A9F]";

const ParentSettings: React.FC = () => {
  const { profile, reloadProfile } = useParentContext();

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setName(profile?.name || "");
    setPhoneNumber(profile?.phoneNumber || "");
  }, [profile]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await parentAPI.updateProfile({ name, phoneNumber });
      await reloadProfile();
      toast.success("Profile updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    try {
      setSavingPassword(true);
      await authAPI.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to change password"
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your contact details and password
        </p>
      </div>

      <form
        onSubmit={saveProfile}
        className="bg-white shadow rounded-lg p-6 mb-6 space-y-4"
      >
        <div className="flex items-center mb-2">
          <User className="h-5 w-5 text-[#0C4A9F] mr-2" />
          <h2 className="text-lg font-medium text-gray-900">My details</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email (login)
          </label>
          <input
            value={profile?.email || ""}
            disabled
            className={`${inputClass} bg-gray-100 text-gray-500`}
          />
          <p className="mt-1 text-xs text-gray-500">
            To change your login email, please contact the school office.
          </p>
        </div>
        <div>
          <label
            htmlFor="parent-name"
            className="block text-sm font-medium text-gray-700"
          >
            Full name
          </label>
          <input
            id="parent-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="parent-phone"
            className="block text-sm font-medium text-gray-700"
          >
            Phone number
          </label>
          <input
            id="parent-phone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingProfile}
            className="px-4 py-2 bg-[#0C4A9F] text-white rounded-md hover:bg-[#0A2F66] disabled:opacity-50"
          >
            {savingProfile ? "Saving..." : "Save details"}
          </button>
        </div>
      </form>

      <form
        onSubmit={changePassword}
        className="bg-white shadow rounded-lg p-6 space-y-4"
      >
        <div className="flex items-center mb-2">
          <Lock className="h-5 w-5 text-[#0C4A9F] mr-2" />
          <h2 className="text-lg font-medium text-gray-900">
            Change password
          </h2>
        </div>
        <div>
          <label
            htmlFor="current-password"
            className="block text-sm font-medium text-gray-700"
          >
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-gray-700"
          >
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-gray-700"
          >
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingPassword}
            className="px-4 py-2 bg-[#0C4A9F] text-white rounded-md hover:bg-[#0A2F66] disabled:opacity-50"
          >
            {savingPassword ? "Updating..." : "Update password"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ParentSettings;
