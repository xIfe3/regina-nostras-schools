import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import api from "../services/api";
import type { SystemSettings } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

interface Subject {
  subjectName: string;
  scores: { firstCA?: number; secondCA?: number; thirdCA?: number; exam?: number; total: number };
  grade: string;
  remark: string;
}

interface SheetResult {
  _id: string;
  academicSession: string;
  term: string;
  class: string;
  subjects: Subject[];
  summary: {
    totalScore: number;
    averageScore: number;
    overallGrade: string;
    position: number;
    totalStudents: number;
    remark: string;
  };
  attendance?: { schoolOpened: number; timesPresent: number; timesAbsent: number };
  behavioralAssessment?: Record<string, string>;
  teacherComments?: string;
  principalComments?: string;
  nextTermBegins?: string;
  isPublished: boolean;
}

interface SheetStudent {
  studentId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    middleName?: string;
    gender?: string;
    dateOfBirth?: string;
    profilePhoto?: string;
  };
  academicInfo: { currentClass: string; classArm?: string };
}

interface SheetData {
  result: SheetResult;
  student: SheetStudent;
  school: SystemSettings["school"];
  sheet: SystemSettings["resultSheet"];
}

const GRADE_KEY = [
  ["A1", "80 – 100", "Excellent"],
  ["B2", "75 – 79", "Very Good"],
  ["B3", "70 – 74", "Very Good"],
  ["C4", "65 – 69", "Good"],
  ["C5", "60 – 64", "Good"],
  ["C6", "55 – 59", "Good"],
  ["D7", "50 – 54", "Pass"],
  ["E8", "45 – 49", "Poor"],
  ["F9", "0 – 44", "Fail"],
];

const BEHAVIOUR_LABELS: Record<string, string> = {
  punctuality: "Punctuality",
  neatness: "Neatness",
  politeness: "Politeness",
  honesty: "Honesty",
  leadership: "Leadership",
  relationship: "Relationship with others",
};

const ordinal = (n: number) => {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
};

const cap = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })
    : "";

/** A label/value cell pair in the student details grid */
const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex border-b border-r border-slate-300 last:border-r-0">
    <span className="w-32 flex-shrink-0 bg-slate-50 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-r border-slate-300">
      {label}
    </span>
    <span className="px-2 py-1.5 text-[13px] font-medium text-slate-900">{value || "—"}</span>
  </div>
);

const ResultSheet: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<SheetData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get(`/results/${id}/sheet`)
      .then((res) => setData(res.data.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load this result"));
  }, [id]);

  useEffect(() => {
    if (data) {
      const name = `${data.student.personalInfo.firstName} ${data.student.personalInfo.lastName}`;
      document.title = `${name} - ${cap(data.result.term)} Term ${data.result.academicSession} Result`;
    }
    return () => {
      document.title = "Regina Nostra Schools";
    };
  }, [data]);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(user?.role === "admin" ? "/admin/results/view" : `/${user?.role}/results`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md rounded-xl bg-white p-6 text-center shadow">
          <p className="text-slate-800 font-medium">{error}</p>
          <button onClick={goBack} className="mt-4 rounded-md bg-[#0C4A9F] px-4 py-2 text-sm text-white">
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-[#0C4A9F]" />
      </div>
    );
  }

  const { result, student, school, sheet } = data;
  const fullName = [student.personalInfo.lastName, student.personalInfo.firstName, student.personalInfo.middleName]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();
  const att = result.attendance;
  const attPct = att && att.schoolOpened > 0 ? Math.round((att.timesPresent / att.schoolOpened) * 100) : null;
  const behaviour = Object.entries(result.behavioralAssessment || {}).filter(
    ([k, v]) => BEHAVIOUR_LABELS[k] && v
  );
  const showBehaviour = sheet.showBehaviour && behaviour.length > 0;
  const hasComponents = (s: Subject) =>
    (s.scores.firstCA || 0) + (s.scores.secondCA || 0) + (s.scores.thirdCA || 0) + (s.scores.exam || 0) > 0;
  const contact = [school.phone && `Tel: ${school.phone}`, school.email, school.website].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-200 print:bg-white">
      {/* Toolbar (not printed) */}
      <div className="no-print sticky top-0 z-10 border-b border-slate-300 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[210mm] items-center justify-between gap-3 px-4 py-3">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-3">
            {!result.isPublished && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                Draft – not yet visible to student/parent
              </span>
            )}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-md bg-[#0C4A9F] px-4 py-2 text-sm font-medium text-white hover:bg-[#0A2F66]"
            >
              <Printer className="h-4 w-4" /> Print / Save as PDF
            </button>
          </div>
        </div>
      </div>

      {/* A4 sheet */}
      <div className="print-sheet mx-auto my-6 w-[210mm] max-w-full bg-white p-[12mm] shadow-xl text-slate-900">
        {/* Letterhead */}
        {school.letterheadImage ? (
          <img src={school.letterheadImage} alt={school.name} className="mb-3 w-full object-contain" />
        ) : (
          <header className="flex items-center gap-4 border-b-4 border-[#0C4A9F] pb-3">
            {school.logo ? (
              <img src={school.logo} alt="" className="h-24 w-24 flex-shrink-0 object-contain" />
            ) : (
              <img src="/images/logo.png" alt="" className="h-24 w-24 flex-shrink-0 object-contain" />
            )}
            <div className="flex-1 text-center">
              <h1 className="text-[26px] font-extrabold uppercase leading-tight tracking-wide text-[#0C4A9F]">
                {school.name}
              </h1>
              {school.motto && (
                <p className="mt-0.5 text-sm italic font-medium text-[#8a6d2b]">“{school.motto}”</p>
              )}
              {school.address && <p className="mt-1 text-[13px] text-slate-700">{school.address}</p>}
              {contact.length > 0 && (
                <p className="text-[12px] text-slate-600">{contact.join("  •  ")}</p>
              )}
            </div>
            <div className="h-24 w-24 flex-shrink-0 border border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden">
              {student.personalInfo.profilePhoto ? (
                <img src={student.personalInfo.profilePhoto} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[10px] uppercase tracking-wide text-slate-400 text-center px-1">Passport</span>
              )}
            </div>
          </header>
        )}
        <div className="h-1 bg-[#C4A356]" />

        {/* Title */}
        <div className="mt-3 bg-[#0C4A9F] py-2 text-center text-white">
          <p className="text-[15px] font-bold uppercase tracking-[0.15em]">{sheet.title}</p>
          <p className="text-[12px] font-medium uppercase tracking-wide text-white/85">
            {cap(result.term)} Term · {result.academicSession} Academic Session
          </p>
        </div>

        {/* Student details */}
        <section className="mt-3 grid grid-cols-2 border-l border-t border-slate-300">
          <Field label="Name" value={fullName} />
          <Field label="Student ID" value={student.studentId} />
          <Field label="Class" value={result.class} />
          <Field label="Gender" value={student.personalInfo.gender ? cap(student.personalInfo.gender) : ""} />
          {sheet.showPosition ? (
            <Field
              label="Position"
              value={`${ordinal(result.summary.position)} out of ${result.summary.totalStudents}`}
            />
          ) : (
            <Field label="No. in class" value={result.summary.totalStudents} />
          )}
          <Field
            label="Attendance"
            value={att && att.schoolOpened > 0 ? `${att.timesPresent} of ${att.schoolOpened} days${attPct !== null ? ` (${attPct}%)` : ""}` : ""}
          />
          <Field label="Next term begins" value={formatDate(result.nextTermBegins)} />
          <Field label="Date issued" value={formatDate(new Date().toISOString())} />
        </section>

        {/* Subjects */}
        <table className="mt-4 w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-slate-100 text-[11px] uppercase tracking-wide text-slate-600">
              {["S/N", "Subject", "CA 1", "CA 2", "CA 3", "Exam", "Total", "Grade", "Remark"].map((h, i) => (
                <th
                  key={h}
                  className={`border border-slate-300 px-2 py-1.5 font-semibold ${i === 1 ? "text-left" : "text-center"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
            <tr className="text-[10px] text-slate-400">
              <th className="border border-slate-300" />
              <th className="border border-slate-300" />
              <th className="border border-slate-300 font-normal">10</th>
              <th className="border border-slate-300 font-normal">10</th>
              <th className="border border-slate-300 font-normal">10</th>
              <th className="border border-slate-300 font-normal">70</th>
              <th className="border border-slate-300 font-normal">100</th>
              <th className="border border-slate-300" />
              <th className="border border-slate-300" />
            </tr>
          </thead>
          <tbody>
            {result.subjects.map((s, i) => {
              const comp = hasComponents(s);
              const cell = (v?: number) => (comp ? v ?? 0 : "–");
              return (
                <tr key={`${s.subjectName}-${i}`} className="even:bg-slate-50/60">
                  <td className="border border-slate-300 px-2 py-1 text-center text-slate-500">{i + 1}</td>
                  <td className="border border-slate-300 px-2 py-1 font-medium">{s.subjectName}</td>
                  <td className="border border-slate-300 px-2 py-1 text-center">{cell(s.scores.firstCA)}</td>
                  <td className="border border-slate-300 px-2 py-1 text-center">{cell(s.scores.secondCA)}</td>
                  <td className="border border-slate-300 px-2 py-1 text-center">{cell(s.scores.thirdCA)}</td>
                  <td className="border border-slate-300 px-2 py-1 text-center">{cell(s.scores.exam)}</td>
                  <td className="border border-slate-300 px-2 py-1 text-center font-bold">{s.scores.total}</td>
                  <td className="border border-slate-300 px-2 py-1 text-center font-bold text-[#0C4A9F]">{s.grade}</td>
                  <td className="border border-slate-300 px-2 py-1 text-center text-slate-600">{s.remark}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Summary */}
        <section className="mt-3 grid grid-cols-5 border border-[#0C4A9F] text-center">
          {[
            ["Total score", `${result.summary.totalScore} / ${result.subjects.length * 100}`],
            ["Average", `${result.summary.averageScore.toFixed(2)}%`],
            ["Overall grade", result.summary.overallGrade],
            [
              sheet.showPosition ? "Position" : "Subjects",
              sheet.showPosition
                ? `${ordinal(result.summary.position)} / ${result.summary.totalStudents}`
                : result.subjects.length,
            ],
            ["Performance", result.summary.remark],
          ].map(([label, value], i) => (
            <div key={String(label)} className={`px-2 py-2 ${i < 4 ? "border-r border-[#0C4A9F]/30" : ""}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="text-[14px] font-bold text-[#0C4A9F]">{value}</p>
            </div>
          ))}
        </section>

        {/* Behaviour + grade key */}
        {(showBehaviour || sheet.showGradeKey) && (
          <section className={`mt-4 grid gap-4 ${showBehaviour && sheet.showGradeKey ? "grid-cols-2" : "grid-cols-1"}`}>
            {showBehaviour && (
              <table className="w-full border-collapse text-[12px] self-start">
                <thead>
                  <tr className="bg-slate-100 text-[11px] uppercase tracking-wide text-slate-600">
                    <th className="border border-slate-300 px-2 py-1 text-left">Behaviour</th>
                    <th className="border border-slate-300 px-2 py-1 text-left">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {behaviour.map(([k, v]) => (
                    <tr key={k}>
                      <td className="border border-slate-300 px-2 py-1">{BEHAVIOUR_LABELS[k]}</td>
                      <td className="border border-slate-300 px-2 py-1 font-medium">{cap(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {sheet.showGradeKey && (
              <table className="w-full border-collapse text-[12px] self-start">
                <thead>
                  <tr className="bg-slate-100 text-[11px] uppercase tracking-wide text-slate-600">
                    <th className="border border-slate-300 px-2 py-1">Grade</th>
                    <th className="border border-slate-300 px-2 py-1">Score</th>
                    <th className="border border-slate-300 px-2 py-1 text-left">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {GRADE_KEY.map(([g, range, meaning]) => (
                    <tr key={g}>
                      <td className="border border-slate-300 px-2 py-0.5 text-center font-semibold">{g}</td>
                      <td className="border border-slate-300 px-2 py-0.5 text-center">{range}</td>
                      <td className="border border-slate-300 px-2 py-0.5">{meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* Comments and signature */}
        <section className="mt-4 space-y-3 text-[13px]">
          <div className="border border-slate-300 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Class teacher's comment</p>
            <p className="mt-1 min-h-[1.5rem]">{result.teacherComments || ""}</p>
          </div>
          <div className="border border-slate-300 p-3">
            <div className="flex items-end justify-between gap-6">
              <div className="flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Principal's comment</p>
                <p className="mt-1 min-h-[1.5rem]">{result.principalComments || ""}</p>
              </div>
              <div className="relative w-56 flex-shrink-0 text-center">
                {sheet.schoolStamp && (
                  <img
                    src={sheet.schoolStamp}
                    alt=""
                    className="pointer-events-none absolute -top-10 left-1/2 h-24 w-24 -translate-x-1/2 object-contain opacity-80"
                  />
                )}
                <div className="relative h-14 flex items-end justify-center">
                  {sheet.principalSignature && (
                    <img src={sheet.principalSignature} alt="Signature" className="max-h-14 object-contain" />
                  )}
                </div>
                <div className="border-t border-slate-500 pt-1 text-[12px]">
                  <p className="font-semibold">{sheet.principalName || "Principal"}</p>
                  <p className="text-slate-500">Principal's signature &amp; date</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-4 border-t border-slate-300 pt-2 text-center text-[11px] text-slate-500">
          {sheet.footerNote && <p className="mb-1 text-slate-700">{sheet.footerNote}</p>}
          <p>
            {school.name} · This report was generated from the school portal on {formatDate(new Date().toISOString())}.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ResultSheet;
