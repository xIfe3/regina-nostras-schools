import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  FileText,
  ShieldAlert,
  BellRing,
  Upload,
  Trash2,
  Save,
  Plus,
  Pencil,
  X,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { noticesAPI, settingsAPI } from "../../services/api";
import type { LoginNotice, SystemSettings } from "../../services/api";

type Tab = "school" | "sheet" | "access" | "notices";

const MAX_BYTES = 1024 * 1024;

/**
 * Read an image file as a data URL, scaling it down so it stays well under 1MB.
 * SVGs are kept as they are.
 */
const imageToDataUrl = (file: File, maxWidth: number): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type)) {
      reject(new Error("Please choose a PNG, JPG, WebP or SVG image"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image"));
    reader.onload = () => {
      const src = String(reader.result);
      if (file.type === "image/svg+xml") {
        if (file.size > MAX_BYTES) reject(new Error("Image must be under 1MB"));
        else resolve(src);
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read the image"));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        let out = canvas.toDataURL("image/png");
        if (out.length * 0.75 > MAX_BYTES * 0.9) out = canvas.toDataURL("image/jpeg", 0.85);
        if (out.length * 0.75 > MAX_BYTES) reject(new Error("Image is too large even after resizing"));
        else resolve(out);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });

const inputCls =
  "mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#0C4A9F] focus:outline-none focus:ring-2 focus:ring-[#0C4A9F]/20";

const Label: React.FC<{ htmlFor?: string; children: React.ReactNode; hint?: string }> = ({ htmlFor, children, hint }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
    {children}
    {hint && <span className="ml-1 font-normal text-slate-400">{hint}</span>}
  </label>
);

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  danger?: boolean;
}> = ({ checked, onChange, label, description, danger }) => (
  <div className="flex items-start justify-between gap-4 py-4">
    <div>
      <p className="text-sm font-medium text-slate-900">{label}</p>
      {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
        checked ? (danger ? "bg-amber-500" : "bg-[#0C4A9F]") : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  </div>
);

const ImageField: React.FC<{
  label: string;
  hint: string;
  value?: string;
  maxWidth: number;
  onChange: (v: string) => void;
  previewClass?: string;
}> = ({ label, hint, value, maxWidth, onChange, previewClass = "h-20 w-20" }) => {
  const id = useMemo(() => `img-${Math.random().toString(36).slice(2)}`, []);
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      onChange(await imageToDataUrl(file, maxWidth));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not use that image");
    }
  };
  return (
    <div>
      <Label>{label}</Label>
      <p className="text-xs text-slate-400">{hint}</p>
      <div className="mt-2 flex items-center gap-4">
        <div
          className={`${previewClass} flex items-center justify-center overflow-hidden rounded-md border border-dashed border-slate-300 bg-slate-50`}
        >
          {value ? (
            <img src={value} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-xs text-slate-400">None</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor={id}
            className="inline-flex cursor-pointer items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Upload className="mr-2 h-4 w-4" />
            {value ? "Replace" : "Upload"}
          </label>
          <input id={id} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={pick} />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center text-sm text-red-600 hover:text-red-700"
            >
              <Trash2 className="mr-1 h-4 w-4" /> Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Card: React.FC<{ title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode }> = ({
  title,
  description,
  children,
  footer,
}) => (
  <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-100 px-6 py-4">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
    </div>
    <div className="px-6 py-5">{children}</div>
    {footer && <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-3">{footer}</div>}
  </section>
);

const SaveButton: React.FC<{ saving: boolean; onClick: () => void; dirty: boolean }> = ({ saving, onClick, dirty }) => (
  <button
    onClick={onClick}
    disabled={saving || !dirty}
    className="inline-flex items-center rounded-md bg-[#0C4A9F] px-4 py-2 text-sm font-medium text-white hover:bg-[#0A2F66] disabled:opacity-50"
  >
    <Save className="mr-2 h-4 w-4" />
    {saving ? "Saving..." : dirty ? "Save changes" : "Saved"}
  </button>
);

/* ------------------------------------------------------------------ */

const toDateInput = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

const noticeStatus = (n: LoginNotice) => {
  const now = Date.now();
  if (!n.isActive) return { label: "Off", cls: "bg-slate-100 text-slate-600" };
  if (n.startsAt && new Date(n.startsAt).getTime() > now) return { label: "Scheduled", cls: "bg-blue-50 text-blue-700" };
  if (n.endsAt && new Date(n.endsAt).getTime() <= now) return { label: "Expired", cls: "bg-slate-100 text-slate-500" };
  return { label: "Showing", cls: "bg-emerald-50 text-emerald-700" };
};

const emptyNotice: Partial<LoginNotice> = {
  title: "",
  message: "",
  type: "info",
  audience: "all",
  isActive: true,
  showOnce: true,
  startsAt: "",
  endsAt: "",
};

const NoticesTab: React.FC = () => {
  const [notices, setNotices] = useState<LoginNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<LoginNotice> | null>(null);
  const [resetSeen, setResetSeen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = () =>
    noticesAPI
      .list()
      .then((r) => setNotices(r.data.data || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.title?.trim() || !editing.message?.trim()) {
      toast.error("Give the notice a title and a message");
      return;
    }
    const payload = {
      ...editing,
      startsAt: editing.startsAt ? new Date(editing.startsAt).toISOString() : "",
      endsAt: editing.endsAt ? new Date(editing.endsAt).toISOString() : "",
    };
    try {
      setSaving(true);
      if (editing._id) {
        await noticesAPI.update(editing._id, { ...payload, resetSeen });
        toast.success("Notice updated");
      } else {
        await noticesAPI.create(payload);
        toast.success("Notice created");
      }
      setEditing(null);
      setResetSeen(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save notice");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (n: LoginNotice) => {
    try {
      await noticesAPI.update(n._id, { isActive: !n.isActive });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update notice");
    }
  };

  const remove = async (id: string) => {
    try {
      await noticesAPI.remove(id);
      setConfirmDelete(null);
      toast.success("Notice deleted");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete notice");
    }
  };

  const set = (patch: Partial<LoginNotice>) => setEditing((e) => ({ ...e, ...patch }));

  return (
    <div className="space-y-6">
      <Card
        title="Login notices"
        description="Messages that pop up when students and parents open the portal."
        footer={
          !editing && (
            <button
              onClick={() => setEditing({ ...emptyNotice })}
              className="inline-flex items-center rounded-md bg-[#0C4A9F] px-4 py-2 text-sm font-medium text-white hover:bg-[#0A2F66]"
            >
              <Plus className="mr-2 h-4 w-4" /> New notice
            </button>
          )
        }
      >
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : notices.length === 0 ? (
          <p className="text-sm text-slate-500">No notices yet. Create one to greet students and parents when they log in.</p>
        ) : (
          <ul className="-my-3 divide-y divide-slate-100">
            {notices.map((n) => {
              const st = noticeStatus(n);
              return (
                <li key={n._id} className="flex flex-wrap items-start gap-3 py-3">
                  <div className="min-w-[14rem] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">{n.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{n.message}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      For {n.audience === "all" ? "students & parents" : n.audience} ·{" "}
                      {n.showOnce ? `shown once · seen by ${n.seenBy || 0}` : "shown every visit"}
                      {n.endsAt ? ` · until ${new Date(n.endsAt).toLocaleString("en-NG")}` : ""}
                    </p>
                  </div>
                  {confirmDelete === n._id ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-600">Delete?</span>
                      <button onClick={() => remove(n._id)} className="rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-700">
                        Delete
                      </button>
                      <button onClick={() => setConfirmDelete(null)} className="rounded-md border border-slate-200 px-3 py-1.5 hover:bg-slate-50">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleActive(n)}
                        className="rounded-md px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                      >
                        {n.isActive ? "Turn off" : "Turn on"}
                      </button>
                      <button
                        onClick={() => {
                          setEditing({ ...n, startsAt: toDateInput(n.startsAt), endsAt: toDateInput(n.endsAt) });
                          setResetSeen(false);
                        }}
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(n._id)}
                        className="rounded-md p-2 text-red-500 hover:bg-red-50"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {editing && (
        <Card
          title={editing._id ? "Edit notice" : "New notice"}
          footer={
            <>
              <button
                onClick={() => setEditing(null)}
                className="inline-flex items-center rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <X className="mr-2 h-4 w-4" /> Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center rounded-md bg-[#0C4A9F] px-4 py-2 text-sm font-medium text-white hover:bg-[#0A2F66] disabled:opacity-50"
              >
                <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save notice"}
              </button>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="n-title">Title</Label>
              <input id="n-title" className={inputCls} value={editing.title || ""} maxLength={150} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Second term resumes on 12 January" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="n-msg">Message</Label>
              <textarea id="n-msg" rows={5} className={inputCls} value={editing.message || ""} maxLength={3000} onChange={(e) => set({ message: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="n-type">Style</Label>
              <select id="n-type" className={inputCls} value={editing.type} onChange={(e) => set({ type: e.target.value as LoginNotice["type"] })}>
                <option value="info">Notice (blue)</option>
                <option value="success">Good news (green)</option>
                <option value="warning">Please note (amber)</option>
                <option value="urgent">Important (red)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="n-aud">Show to</Label>
              <select id="n-aud" className={inputCls} value={editing.audience} onChange={(e) => set({ audience: e.target.value as LoginNotice["audience"] })}>
                <option value="all">Students and parents</option>
                <option value="students">Students only</option>
                <option value="parents">Parents only</option>
              </select>
            </div>
            <div>
              <Label htmlFor="n-start" hint="(optional)">Start showing from</Label>
              <input id="n-start" type="datetime-local" className={inputCls} value={editing.startsAt || ""} onChange={(e) => set({ startsAt: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="n-end" hint="(optional)">Stop showing after</Label>
              <input id="n-end" type="datetime-local" className={inputCls} value={editing.endsAt || ""} onChange={(e) => set({ endsAt: e.target.value })} />
            </div>
          </div>
          <div className="mt-2 divide-y divide-slate-100">
            <Toggle
              checked={!!editing.showOnce}
              onChange={(v) => set({ showOnce: v })}
              label="Show only once per person"
              description="Off: the popup appears every time they open the portal until you turn it off or it expires."
            />
            <Toggle checked={!!editing.isActive} onChange={(v) => set({ isActive: v })} label="Active" />
            {editing._id && editing.showOnce && (
              <Toggle
                checked={resetSeen}
                onChange={setResetSeen}
                label="Show again to people who already saw it"
                description="Use this if you changed the message."
              />
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */

const AdminSettings: React.FC = () => {
  const [tab, setTab] = useState<Tab>("school");
  const [saved, setSaved] = useState<SystemSettings | null>(null);
  const [form, setForm] = useState<SystemSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsAPI
      .getAll()
      .then((r) => {
        setSaved(r.data.data!);
        setForm(r.data.data!);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load settings"));
  }, []);

  const dirty = (group: "school" | "resultSheet" | "access") =>
    !!form && !!saved && JSON.stringify(form[group]) !== JSON.stringify(saved[group]);

  const save = async (group: "school" | "resultSheet" | "access") => {
    if (!form) return;
    try {
      setSaving(true);
      const res = await settingsAPI.update({ [group]: form[group] });
      setSaved(res.data.data!);
      setForm(res.data.data!);
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  const setSchool = (p: Partial<SystemSettings["school"]>) => setForm((f) => (f ? { ...f, school: { ...f.school, ...p } } : f));
  const setSheet = (p: Partial<SystemSettings["resultSheet"]>) =>
    setForm((f) => (f ? { ...f, resultSheet: { ...f.resultSheet, ...p } } : f));
  const setAccess = (p: Partial<SystemSettings["access"]>) => setForm((f) => (f ? { ...f, access: { ...f.access, ...p } } : f));

  const tabs: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
    { id: "school", label: "School & letterhead", icon: Building2 },
    { id: "sheet", label: "Result sheet", icon: FileText },
    { id: "access", label: "Portal access", icon: ShieldAlert },
    { id: "notices", label: "Login notices", icon: BellRing },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">System settings</h2>
        <p className="mt-1 text-sm text-slate-500">School details, report sheet layout, portal access and login notices.</p>
      </div>

      {saved?.access.maintenanceMode && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          Maintenance mode is ON. Students and parents cannot use the portal right now.
        </div>
      )}

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px inline-flex items-center whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium ${
              tab === t.id ? "border-[#0C4A9F] text-[#0C4A9F]" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <t.icon className="mr-2 h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "notices" ? (
        <NoticesTab />
      ) : !form ? (
        <div className="h-48 animate-pulse rounded-xl border border-slate-200 bg-white" />
      ) : tab === "school" ? (
        <Card
          title="School details & letterhead"
          description="Shown at the top of every printed report sheet and on the login page."
          footer={<SaveButton saving={saving} dirty={dirty("school")} onClick={() => save("school")} />}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="s-name">School name</Label>
              <input id="s-name" className={inputCls} value={form.school.name} onChange={(e) => setSchool({ name: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="s-motto" hint="(optional)">Motto</Label>
              <input id="s-motto" className={inputCls} value={form.school.motto || ""} onChange={(e) => setSchool({ motto: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="s-addr">Address</Label>
              <input id="s-addr" className={inputCls} value={form.school.address || ""} onChange={(e) => setSchool({ address: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="s-phone">Phone</Label>
              <input id="s-phone" className={inputCls} value={form.school.phone || ""} onChange={(e) => setSchool({ phone: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="s-email">Email</Label>
              <input id="s-email" type="email" className={inputCls} value={form.school.email || ""} onChange={(e) => setSchool({ email: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="s-web" hint="(optional)">Website</Label>
              <input id="s-web" className={inputCls} value={form.school.website || ""} onChange={(e) => setSchool({ website: e.target.value })} />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 border-t border-slate-100 pt-6 md:grid-cols-2">
            <ImageField
              label="School logo"
              hint="Square PNG with a transparent background works best."
              value={form.school.logo}
              maxWidth={600}
              onChange={(v) => setSchool({ logo: v })}
            />
            <ImageField
              label="Full letterhead image (optional)"
              hint="If you already have a designed letterhead, upload it here. It replaces the logo-and-text header on report sheets."
              value={form.school.letterheadImage}
              maxWidth={2000}
              previewClass="h-20 w-48"
              onChange={(v) => setSchool({ letterheadImage: v })}
            />
          </div>
        </Card>
      ) : tab === "sheet" ? (
        <Card
          title="Report sheet"
          description="How printed results look. Open any result from Publish Results (printer icon) to preview."
          footer={<SaveButton saving={saving} dirty={dirty("resultSheet")} onClick={() => save("resultSheet")} />}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="r-title">Sheet title</Label>
              <input id="r-title" className={inputCls} value={form.resultSheet.title} onChange={(e) => setSheet({ title: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="r-principal">Principal's name</Label>
              <input id="r-principal" className={inputCls} value={form.resultSheet.principalName || ""} onChange={(e) => setSheet({ principalName: e.target.value })} placeholder="e.g. Rev. Sr. Mary Okeke" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="r-foot" hint="(optional)">Footer note</Label>
              <input id="r-foot" className={inputCls} value={form.resultSheet.footerNote || ""} onChange={(e) => setSheet({ footerNote: e.target.value })} placeholder="e.g. School fees for next term must be paid before resumption." />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 border-t border-slate-100 pt-6 md:grid-cols-2">
            <ImageField
              label="Principal's signature"
              hint="Sign on white paper, take a clear photo and crop it closely."
              value={form.resultSheet.principalSignature}
              maxWidth={600}
              previewClass="h-16 w-40"
              onChange={(v) => setSheet({ principalSignature: v })}
            />
            <ImageField
              label="School stamp"
              hint="Shown faintly behind the signature."
              value={form.resultSheet.schoolStamp}
              maxWidth={500}
              onChange={(v) => setSheet({ schoolStamp: v })}
            />
          </div>
          <div className="mt-6 divide-y divide-slate-100 border-t border-slate-100">
            <Toggle checked={form.resultSheet.showPosition} onChange={(v) => setSheet({ showPosition: v })} label="Show class position" description="e.g. 3rd out of 32" />
            <Toggle checked={form.resultSheet.showBehaviour} onChange={(v) => setSheet({ showBehaviour: v })} label="Show behaviour ratings" description="Punctuality, neatness, etc. when they were uploaded" />
            <Toggle checked={form.resultSheet.showGradeKey} onChange={(v) => setSheet({ showGradeKey: v })} label="Show grading key" description="A1 = 80–100 … F9 = 0–44" />
          </div>
        </Card>
      ) : (
        <Card
          title="Portal access"
          description="Admins can always sign in, so you can switch these back on at any time."
          footer={<SaveButton saving={saving} dirty={dirty("access")} onClick={() => save("access")} />}
        >
          <div className="divide-y divide-slate-100">
            <Toggle
              checked={form.access.maintenanceMode}
              onChange={(v) => setAccess({ maintenanceMode: v })}
              danger
              label="Maintenance mode"
              description="Signs out every student and parent and shows the message below on the login page."
            />
            <div className="py-4">
              <Label htmlFor="a-mmsg">Maintenance message</Label>
              <textarea id="a-mmsg" rows={2} className={inputCls} value={form.access.maintenanceMessage} onChange={(e) => setAccess({ maintenanceMessage: e.target.value })} />
            </div>
            <Toggle
              checked={form.access.studentLoginEnabled}
              onChange={(v) => setAccess({ studentLoginEnabled: v })}
              label="Students can sign in"
              description="Turn off to close the student portal (e.g. while results are being prepared)."
            />
            <Toggle
              checked={form.access.parentLoginEnabled}
              onChange={(v) => setAccess({ parentLoginEnabled: v })}
              label="Parents can sign in"
            />
            <div className="py-4">
              <Label htmlFor="a-dmsg">Message when sign-in is closed</Label>
              <textarea id="a-dmsg" rows={2} className={inputCls} value={form.access.loginDisabledMessage} onChange={(e) => setAccess({ loginDisabledMessage: e.target.value })} />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminSettings;
