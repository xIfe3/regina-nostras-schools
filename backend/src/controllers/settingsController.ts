import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { getSettings, getSettingsFresh, clearSettingsCache } from "../utils/settings";
import { ActivityLogger } from "../utils/activityLogger.js";

const MAX_IMAGE_BYTES = 1024 * 1024; // 1MB per image

/** Accept "" (remove) or a PNG/JPEG/WebP/SVG data URL up to 1MB. */
const validateImage = (value: unknown, label: string): string | null => {
  if (value === "" || value === null) return null;
  if (typeof value !== "string") return `${label} must be an image`;
  const m = value.match(/^data:image\/(png|jpe?g|webp|svg\+xml);base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return `${label} must be a PNG, JPG, WebP or SVG image`;
  const bytes = Math.floor((m[2].length * 3) / 4);
  if (bytes > MAX_IMAGE_BYTES) return `${label} is too large (max 1MB)`;
  return null;
};

const pick = (src: any, keys: string[]) => {
  const out: Record<string, unknown> = {};
  if (!src || typeof src !== "object") return out;
  for (const k of keys) if (k in src) out[k] = src[k];
  return out;
};

// @desc    Public settings needed before login (branding + whether the portal is open)
// @route   GET /api/settings/public
// @access  Public
export const getPublicSettings = async (_req: AuthRequest, res: Response) => {
  try {
    const s = await getSettings();
    res.status(200).json({
      success: true,
      data: {
        school: {
          name: s.school.name,
          motto: s.school.motto,
          logo: s.school.logo,
        },
        access: {
          maintenanceMode: s.access.maintenanceMode,
          maintenanceMessage: s.access.maintenanceMessage,
          studentLoginEnabled: s.access.studentLoginEnabled,
          parentLoginEnabled: s.access.parentLoginEnabled,
          loginDisabledMessage: s.access.loginDisabledMessage,
        },
      },
    });
  } catch (error) {
    console.error("Get public settings error:", error);
    res.status(500).json({ success: false, message: "Server error getting settings" });
  }
};

// @desc    All settings for the admin settings page
// @route   GET /api/settings
// @access  Private/Admin
export const getAllSettings = async (_req: AuthRequest, res: Response) => {
  try {
    const s = await getSettings();
    res.status(200).json({ success: true, data: s });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ success: false, message: "Server error getting settings" });
  }
};

// @desc    Update settings (any of the school / resultSheet / access groups)
// @route   PUT /api/settings
// @access  Private/Admin
export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body || {};
    const school = pick(body.school, ["name", "motto", "address", "phone", "email", "website", "logo", "letterheadImage"]);
    const resultSheet = pick(body.resultSheet, [
      "title",
      "principalName",
      "principalSignature",
      "schoolStamp",
      "footerNote",
      "showPosition",
      "showBehaviour",
      "showGradeKey",
    ]);
    const access = pick(body.access, [
      "maintenanceMode",
      "maintenanceMessage",
      "studentLoginEnabled",
      "parentLoginEnabled",
      "loginDisabledMessage",
    ]);

    const imageErrors = [
      validateImage(school.logo ?? "", "School logo"),
      validateImage(school.letterheadImage ?? "", "Letterhead image"),
      validateImage(resultSheet.principalSignature ?? "", "Principal's signature"),
      validateImage(resultSheet.schoolStamp ?? "", "School stamp"),
    ].filter(Boolean);
    if (imageErrors.length > 0) {
      return res.status(400).json({ success: false, message: imageErrors.join("; ") });
    }
    if ("name" in school && !String(school.name || "").trim()) {
      return res.status(400).json({ success: false, message: "School name cannot be empty" });
    }

    // Always edit a fresh copy so a cached one can't overwrite newer changes
    const s = await getSettingsFresh();
    const before = { ...s.toObject().access };

    if (Object.keys(school).length) s.set("school", { ...s.toObject().school, ...school });
    if (Object.keys(resultSheet).length)
      s.set("resultSheet", { ...s.toObject().resultSheet, ...resultSheet });
    if (Object.keys(access).length) s.set("access", { ...s.toObject().access, ...access });
    s.updatedBy = req.user!._id as any;
    await s.save();
    clearSettingsCache();

    // Record access changes in the activity log
    const changes: string[] = [];
    if (before.maintenanceMode !== s.access.maintenanceMode)
      changes.push(`maintenance mode ${s.access.maintenanceMode ? "ON" : "OFF"}`);
    if (before.studentLoginEnabled !== s.access.studentLoginEnabled)
      changes.push(`student logins ${s.access.studentLoginEnabled ? "enabled" : "disabled"}`);
    if (before.parentLoginEnabled !== s.access.parentLoginEnabled)
      changes.push(`parent logins ${s.access.parentLoginEnabled ? "enabled" : "disabled"}`);
    if (changes.length > 0) {
      await ActivityLogger.log(req.user!._id, {
        type: "admin_action",
        title: "Portal access changed",
        description: `Admin turned ${changes.join(", ")}`,
      } as any).catch(() => undefined);
    }

    res.status(200).json({ success: true, message: "Settings saved", data: s });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ success: false, message: "Server error saving settings" });
  }
};
