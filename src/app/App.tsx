import { useState } from "react";
import {
  ChevronRight, ChevronLeft, FileText, ClipboardList, Star, Receipt,
  Clock, TrendingUp, AlertCircle, CheckCircle2, Users, MapPin, Video,
  Home, Building2, Smartphone, Download, Eye, Plus, Filter, Bell,
  Search, BookOpen, Cpu, Palette, Code2, Beaker, Award, XCircle,
  X, Send, CheckSquare, Square, CalendarCheck,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type SessionDuration = 0.5 | 1 | 1.5;
type ClaimStatus = "not_requested" | "advance_claimed" | "full_claimed" | "approved" | "denied";
type AssignmentStatus = "issued" | "submitted" | "graded";
type ReportPeriod = "weekly" | "monthly" | "final";

type LocationType = "center" | "home" | "online" | "physical" | "googlemeet";

interface Student {
  id: string;
  name: string;
  avatar: string;
}

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
}

interface Report {
  id: string;
  title: string;
  date: string;
  type: ReportPeriod;
}

interface Session {
  id: string;
  number: number;
  date: string;
  duration: SessionDuration;
  attended: boolean;
}

interface StudentAssignment {
  studentId: string;
  assignmentId: string;
  status: AssignmentStatus;
  score?: number;
  feedback?: string;
  submittedAt?: string;
  gradedAt?: string;
}

interface StudentReport {
  studentId: string;
  reportId: string;
  done: boolean;
  content: string;
}

interface StudentSessionAttendance {
  studentId: string;
  sessionId: string;
  present: boolean;
}

interface StudentSessionAssignment {
  studentId: string;
  assignmentId: string;
  sessionId: string;
  status: AssignmentStatus;
  score?: number;
  feedback?: string;
  submittedAt?: string;
  gradedAt?: string;
}

interface StudentSessionReport {
  studentId: string;
  sessionId: string;
  done: boolean;
  content: string;
}

interface InvoiceDoc {
  fileName: string;
  fileUrl: string;
  uploadedAt?: string;
}

type PaymentActivityType = "advance" | "full";
type PaymentActivityStatus = "requested" | "paid" | "approved" | "denied";

interface PaymentActivity {
  id: string;
  type: PaymentActivityType;
  amount: number;
  status: PaymentActivityStatus;
  requestedAt: string;
  note?: string;
  invoiceFileName?: string;
}

interface Course {
  id: string;
  name: string;
  icon: React.ReactNode;
  locationType: LocationType;
  locationName: string;
  students: Student[];
  totalSessions: number;
  sessions: Session[];
  assignments: Assignment[];
  reports: Report[];
  studentAssignments: StudentAssignment[];
  studentReports: StudentReport[];
  attendance?: StudentSessionAttendance[];
  sessionAssignments?: StudentSessionAssignment[];
  sessionReports?: StudentSessionReport[];
  claimStatus: ClaimStatus;
  advancePaidAmount: number;
  invoice?: InvoiceDoc;
  paymentActivities?: PaymentActivity[];
}

// ─── Student Session View (students as rows, metrics as columns) ──────────────

function StudentSessionView({
  course, onUpdate, onOpenSessionAssignment, onOpenSessionReport,
}: {
  course: Course;
  onUpdate: (updates: Partial<Course>) => void;
  onOpenSessionAssignment?: (sessionId: string) => void;
  onOpenSessionReport?: (sessionId: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const sessions = course.sessions;
  const session = sessions[index];

  const attendance = getAttendanceRecords(course);
  const sessionAssignments = getSessionAssignmentRecords(course);
  const sessionReports = getSessionReportRecords(course);

  // navigation callbacks: parent may open a session-level assignment/report page

  const updateSession = (sessionId: string, updates: Partial<Session>) => {
    onUpdate({
      sessions: sessions.map((item) => item.id === sessionId ? { ...item, ...updates } : item),
    });
  };

  const toggleAttendance = (studentId: string) => {
    if (!session) return;
    const updated = getAttendanceRecords(course).map((r) =>
      r.studentId === studentId && r.sessionId === session.id ? { ...r, present: !r.present } : r
    );
    onUpdate({ attendance: updated });
  };

  // session-level updates are handled in the dedicated session pages

  if (!session) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center">
        <p className="text-sm text-muted-foreground">No sessions available for this course.</p>
      </div>
    );
  }

  if (course.locationType === "googlemeet") {
    const formatDuration = (duration: SessionDuration) => {
      if (duration === 0.5) return "30 min";
      if (duration === 1) return "1 hr";
      return "1.5 hrs";
    };
    const formatSchedule = (value: string) => {
      const date = new Date(value.includes("T") ? value : `${value}T09:00`);
      if (Number.isNaN(date.getTime())) return value;
      return date.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };
    const completedCount = sessions.filter((item) => item.attended).length;

    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-foreground">Google Meet Sessions</h3>
            <p className="text-xs text-muted-foreground">{completedCount}/{sessions.length} completed</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground">Scheduled</span>
              <span className="text-sm font-extrabold text-[#25476a]">{sessions.length}</span>
            </div>
            <div className="flex min-h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground">Completed</span>
              <span className="text-sm font-extrabold text-green-700">{completedCount}</span>
            </div>
            <div className="flex min-h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground">Cancelled</span>
              <span className="text-sm font-extrabold text-rose-700">{sessions.length - completedCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="bg-muted/60 border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Session</th>
                  <th className="text-left px-3 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Session Scheduled</th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wide">Session Status</th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wide">Session Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">Session {item.number}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-sm font-semibold text-foreground">{formatSchedule(item.date)}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => updateSession(item.id, { attended: !item.attended })}
                        className={`inline-flex min-w-[108px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${item.attended ? "border-green-200 bg-green-50 text-green-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}
                      >
                        {item.attended ? "Completed" : "Cancelled"}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex min-w-[72px] justify-center rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-bold text-foreground">
                        {formatDuration(item.duration)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const totalStudents = course.students.length;
  const sessionAttendanceCount = attendance.filter((r) => r.sessionId === session.id && r.present).length;
  const sessionAssignmentCount = sessionAssignments.filter((r) => r.sessionId === session.id && r.status !== "issued").length;
  const sessionReportCount = sessionReports.filter((r) => r.sessionId === session.id && r.done).length;
  const sessionPercent = (count: number) => totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
  const sessionSummary = [
    { label: "Attendance", value: `${sessionPercent(sessionAttendanceCount)}%` },
    { label: "Assignment", value: `${sessionPercent(sessionAssignmentCount)}%` },
    { label: "Report", value: `${sessionPercent(sessionReportCount)}%` },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border bg-muted/30 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="min-w-[120px]">
              <h3 className="font-extrabold text-foreground leading-tight">Session {session.number}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{session.date}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {sessionSummary.map((item) => (
                <div
                  key={item.label}
                  className="flex min-h-8 items-center gap-2 rounded-full border border-border bg-white px-3 py-1"
                >
                  <span className="text-[11px] font-semibold text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-extrabold text-[#25476a]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}
              title="Previous session"
              className="p-2 rounded-xl hover:bg-white transition-colors text-muted-foreground disabled:opacity-40">
              <ChevronLeft size={18} />
            </button>
            <div className="min-w-12 text-center text-xs font-semibold text-muted-foreground">{index + 1} / {sessions.length}</div>
            <button onClick={() => setIndex((i) => Math.min(sessions.length - 1, i + 1))} disabled={index === sessions.length - 1}
              title="Next session"
              className="p-2 rounded-xl hover:bg-white transition-colors text-muted-foreground disabled:opacity-40">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-muted/60 border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide sticky left-0 bg-muted/60 min-w-[220px]">Student</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wide">Attendance</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  <button
                    type="button"
                    onClick={() => onOpenSessionAssignment?.(session.id)}
                    className="font-bold uppercase tracking-wide text-[#25476a] hover:text-[#38aae1]"
                  >
                    Assignment
                  </button>
                </th>
                <th className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  <button
                    type="button"
                    onClick={() => onOpenSessionReport?.(session.id)}
                    className="font-bold uppercase tracking-wide text-[#25476a] hover:text-[#38aae1]"
                  >
                    Report
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {course.students.map((st) => {
                const att = attendance.find((r) => r.studentId === st.id && r.sessionId === session.id);
                const aRec = sessionAssignments.find((r) => r.studentId === st.id && r.sessionId === session.id);
                const rRec = sessionReports.find((r) => r.studentId === st.id && r.sessionId === session.id);
                const present = att?.present ?? false;
                return (
                  <tr key={st.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 sticky left-0 bg-card">
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={st.avatar} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{st.name}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleAttendance(st.id)}
                        className={`mx-auto flex h-7 w-14 items-center rounded-full p-1 transition-colors ${present ? "bg-green-500" : "bg-slate-300"}`}
                        title={present ? "Mark absent" : "Mark present"}
                      >
                        <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${present ? "translate-x-7" : "translate-x-0"}`} />
                      </button>
                      <p className={`mt-1 text-[10px] font-semibold ${present ? "text-green-600" : "text-slate-500"}`}>{present ? "Present" : "Absent"}</p>
                    </td>

                    <td className="px-3 py-3 text-center">
                      {aRec ? (
                        <div className="flex justify-center">
                          <AssignmentStatusChip status={aRec.status} />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    <td className="px-3 py-3 text-center">
                      {rRec ? (
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${rRec.done ? "bg-green-50 text-green-700 border border-green-200" : "bg-rose-50 text-rose-600 border border-rose-200"}`}>
                          {rRec.done ? <CheckSquare size={11} /> : <Square size={11} />}
                          {rRec.done ? "Done" : "Pending"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      {/* session-level modals removed; navigation opens dedicated pages */}
    </div>
  );
}

// ─── Invoice View ─────────────────────────────────────────────────────────────
// ─── Session Assignment / Report Views (per-session pages) ─────────────────────

function SessionAssignmentView({ course, sessionId, onUpdate, onBack, onChangeSession }: {
  course: Course;
  sessionId: string;
  onUpdate: (updates: Partial<Course>) => void;
  onBack: () => void;
  onChangeSession?: (offset: number) => void;
}) {
  const sessions = course.sessions;
  const idx = sessions.findIndex((s) => s.id === sessionId);
  const session = sessions[idx];
  const sessionAssignments = getSessionAssignmentRecords(course);
  const recordsForSession = sessionAssignments.filter((record) => record.sessionId === sessionId);
  const gradedCount = recordsForSession.filter((record) => record.status === "graded").length;
  const submittedCount = recordsForSession.filter((record) => record.status === "submitted").length;
  const issuedCount = recordsForSession.filter((record) => record.status === "issued").length;

  const [assignDetail, setAssignDetail] = useState<{
    student: Student;
    assignment: Assignment;
    record: StudentSessionAssignment;
  } | null>(null);

  if (!session) return (
    <div className="p-6 bg-card border border-border rounded-2xl">Session not found.</div>
  );
  const assignmentForSession = makeSessionAssignment(session);

  const handleAssignUpdate = (updated: StudentAssignment | StudentSessionAssignment) => {
    const sessionRecord = updated as StudentSessionAssignment;
    const newRecords = getSessionAssignmentRecords(course).map((r) =>
      r.studentId === sessionRecord.studentId && r.sessionId === sessionRecord.sessionId ? sessionRecord : r
    );
    onUpdate({ sessionAssignments: newRecords });
    setAssignDetail(null);
  };

  const downloadAssignment = (student: Student, record: StudentSessionAssignment) => {
    const assignment = course.assignments.find((a) => a.id === record.assignmentId) ?? assignmentForSession;
    const content = `Assignment: ${assignment?.title || record.assignmentId}\nStudent: ${student.name}\nStatus: ${record.status}\nScore: ${record.score ?? "-"}\nFeedback: ${record.feedback ?? "-"}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${student.name.replace(/\s+/g, "_")}_${assignment?.title.replace(/\s+/g, "_") || record.assignmentId}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} title="Back" className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground flex-shrink-0">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => onChangeSession && onChangeSession(-1)} title="Previous session" disabled={idx <= 0} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
            <ChevronLeft size={18} />
          </button>
          <div>
            <h2 className="font-bold text-foreground">Assignments — Session {session.number}</h2>
            <p className="text-xs text-muted-foreground">{session.date}</p>
          </div>
          <button onClick={() => onChangeSession && onChangeSession(1)} title="Next session" disabled={idx >= sessions.length - 1} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{course.name}</p>
            <h3 className="mt-1 text-lg font-extrabold text-foreground leading-tight">{assignmentForSession.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{session.date} · {course.students.length} students</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-green-50 px-3 py-2">
              <p className="text-base font-extrabold text-green-700">{gradedCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-green-700/70">Graded</p>
            </div>
            <div className="rounded-xl bg-amber-50 px-3 py-2">
              <p className="text-base font-extrabold text-amber-700">{submittedCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700/70">Submitted</p>
            </div>
            <div className="rounded-xl bg-slate-100 px-3 py-2">
              <p className="text-base font-extrabold text-slate-600">{issuedCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Issued</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="bg-muted/60 border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide sticky left-0 bg-muted/60 min-w-[140px]">Student Name</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Assignment</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Progress</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Assignment File</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {course.students.map((student) => {
                const rec = sessionAssignments.find((r) => r.studentId === student.id && r.sessionId === session.id);
                if (!rec) return (
                  <tr key={student.id} className="hover:bg-muted/20"><td colSpan={4} className="px-4 py-3">No assignment record</td></tr>
                );
                const assignment = course.assignments.find((a) => a.id === rec.assignmentId) ?? assignmentForSession;
                const canDownload = rec.status === "graded";
                return (
                  <tr key={student.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 sticky left-0 bg-card">
                      <div className="flex items-center gap-2">
                        <Avatar initials={student.avatar} size="sm" />
                        <span className="font-semibold text-foreground whitespace-nowrap">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-foreground">{assignment.title}</p>
                        <p className="text-xs text-muted-foreground">Session {session.number}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setAssignDetail({ student, assignment: makeSessionAssignment(session), record: rec })}
                        className="rounded-xl px-2 py-1 hover:bg-muted/60"
                        title={`Open ${rec.status} assignment`}
                      >
                        <AssignmentLifecycle status={rec.status} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => downloadAssignment(student, rec)}
                        disabled={!canDownload}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#25476a]/15 bg-white px-3 py-2 text-sm font-bold text-[#25476a] hover:border-[#38aae1]/40 hover:bg-[#e8f0f7] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Download size={14} />
                        <span>{canDownload ? "Download" : "Locked"}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {assignDetail && (
        <AssignmentDetailModal
          student={assignDetail.student}
          assignment={assignDetail.assignment}
          record={assignDetail.record}
          onClose={() => setAssignDetail(null)}
          onUpdate={handleAssignUpdate}
        />
      )}
    </div>
  );
}

function SessionReportView({ course, sessionId, onUpdate, onBack, onChangeSession }: {
  course: Course;
  sessionId: string;
  onUpdate: (updates: Partial<Course>) => void;
  onBack: () => void;
  onChangeSession?: (offset: number) => void;
}) {
  const sessions = course.sessions;
  const idx = sessions.findIndex((s) => s.id === sessionId);
  const session = sessions[idx];
  const sessionReports = getSessionReportRecords(course);
  const recordsForSession = sessionReports.filter((record) => record.sessionId === sessionId);
  const doneCount = recordsForSession.filter((record) => record.done).length;
  const pendingCount = recordsForSession.filter((record) => !record.done).length;

  const [reportDetail, setReportDetail] = useState<{ student: Student; report: Report; record: StudentSessionReport } | null>(null);

  if (!session) return <div className="p-6 bg-card border border-border rounded-2xl">Session not found.</div>;
  const reportForSession = makeSessionReport(session);

  const handleReportUpdate = (updated: StudentReport | StudentSessionReport) => {
    const sessionRecord = updated as StudentSessionReport;
    const newRecords = getSessionReportRecords(course).map((r) =>
      r.studentId === sessionRecord.studentId && r.sessionId === sessionRecord.sessionId ? sessionRecord : r
    );
    onUpdate({ sessionReports: newRecords });
    setReportDetail(null);
  };

  const downloadReport = (student: Student, record: StudentSessionReport) => {
    const content = record.done ? record.content : `${student.name} - Report not available`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${student.name.replace(/\s+/g, "_")}_session_${session.number}_report.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} title="Back" className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground flex-shrink-0">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => onChangeSession && onChangeSession(-1)} title="Previous session" disabled={idx <= 0} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
            <ChevronLeft size={18} />
          </button>
          <div>
            <h2 className="font-bold text-foreground">Reports — Session {session.number}</h2>
            <p className="text-xs text-muted-foreground">{session.date}</p>
          </div>
          <button onClick={() => onChangeSession && onChangeSession(1)} title="Next session" disabled={idx >= sessions.length - 1} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{course.name}</p>
            <h3 className="mt-1 text-lg font-extrabold text-foreground leading-tight">{reportForSession.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{session.date} · {course.students.length} students</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-green-50 px-4 py-2">
              <p className="text-base font-extrabold text-green-700">{doneCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-green-700/70">Done</p>
            </div>
            <div className="rounded-xl bg-rose-50 px-4 py-2">
              <p className="text-base font-extrabold text-rose-600">{pendingCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-rose-600/70">Pending</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="bg-muted/60 border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide sticky left-0 bg-muted/60 min-w-[140px]">Student Name</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Report</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {course.students.map((student) => {
                const rec = sessionReports.find((r) => r.studentId === student.id && r.sessionId === session.id);
                if (!rec) return (
                  <tr key={student.id} className="hover:bg-muted/20"><td colSpan={4} className="px-4 py-3">No report record</td></tr>
                );
                return (
                  <tr key={student.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 sticky left-0 bg-card">
                      <div className="flex items-center gap-2">
                        <Avatar initials={student.avatar} size="sm" />
                        <span className="font-semibold text-foreground whitespace-nowrap">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-foreground">{reportForSession.title}</p>
                        <p className="text-xs text-muted-foreground">Session {session.number}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${rec.done ? "bg-green-50 text-green-700 border border-green-200" : "bg-rose-50 text-rose-600 border border-rose-200"}`}>
                        {rec.done ? "Done" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => downloadReport(student, rec)}
                        disabled={!rec.done}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#25476a]/15 bg-white px-3 py-2 text-sm font-bold text-[#25476a] hover:border-[#38aae1]/40 hover:bg-[#e8f0f7] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Download size={14} />
                        <span>{rec.done ? "Download" : "Locked"}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {reportDetail && (
        <ReportDetailModal student={reportDetail.student} report={reportDetail.report} record={reportDetail.record} onClose={() => setReportDetail(null)} onUpdate={handleReportUpdate} />
      )}
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RATE: Record<LocationType, number> = { center: 904, home: 904, physical: 904, online: 500, googlemeet: 500 };
const LOCATION_LABELS: Record<LocationType, string> = { center: "Center", home: "Home", online: "Online", physical: "Physical", googlemeet: "Google Meet" };
const LOCATION_COLORS: Record<LocationType, string> = {
  center: "bg-[#25476a] text-white", home: "bg-[#38aae1] text-white",
  online: "bg-emerald-600 text-white", physical: "bg-violet-600 text-white", googlemeet: "bg-rose-500 text-white",
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

function makeSessions(count: number, duration: SessionDuration, attended: number): Session[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `sess-${Math.random().toString(36).slice(2)}`,
    number: i + 1,
    date: `2025-${String(Math.floor(i / 4) + 3).padStart(2, "0")}-${String((i % 4) * 7 + 1).padStart(2, "0")}`,
    duration,
    attended: i < attended,
  }));
}

function makeStudentAssignments(students: Student[], assignments: Assignment[], completedRatio: number): StudentAssignment[] {
  const records: StudentAssignment[] = [];
  students.forEach((st) => {
    assignments.forEach((a, ai) => {
      const threshold = Math.floor(assignments.length * completedRatio);
      const status: AssignmentStatus = completedRatio >= 1 ? "graded" : ai < threshold - 1 ? "graded" : ai < threshold ? "submitted" : "issued";
      records.push({
        studentId: st.id, assignmentId: a.id, status,
        score: status === "graded" ? Math.floor(Math.random() * 30) + 70 : undefined,
        feedback: status === "graded" ? "Good work! Needs improvement on the explanation section." : undefined,
        submittedAt: status !== "issued" ? `2025-04-${String(ai * 5 + 10).padStart(2, "0")}` : undefined,
        gradedAt: status === "graded" ? `2025-04-${String(ai * 5 + 12).padStart(2, "0")}` : undefined,
      });
    });
  });
  return records;
}

function makeStudentReports(students: Student[], reports: Report[], doneCount: number): StudentReport[] {
  const records: StudentReport[] = [];
  students.forEach((st) => {
    reports.forEach((r, ri) => {
      const done = ri < doneCount;
      records.push({
        studentId: st.id, reportId: r.id, done,
        content: done
          ? `${st.name} has shown consistent progress throughout this period. Assignments are completed on time and the student demonstrates strong understanding of core concepts. Areas for improvement include verbal explanation and independent problem-solving. Overall performance: Excellent.`
          : "",
      });
    });
  });
  return records;
}

const STUDENTS_C1: Student[] = [
  { id: "s1", name: "Amara Osei", avatar: "AO" },
  { id: "s2", name: "Brian Kamau", avatar: "BK" },
  { id: "s3", name: "Cynthia Mwangi", avatar: "CM" },
  { id: "s4", name: "David Njoroge", avatar: "DN" },
  { id: "s5", name: "Esther Akinyi", avatar: "EA" },
  { id: "s6", name: "Felix Otieno", avatar: "FO" },
];

const ASSIGNMENTS_C1: Assignment[] = [
  { id: "a1", title: "Introduction to Arduino", dueDate: "2025-03-15" },
  { id: "a2", title: "Sensor Integration Lab", dueDate: "2025-04-01" },
  { id: "a3", title: "Motor Control Systems", dueDate: "2025-04-20" },
  { id: "a4", title: "Final Robot Build", dueDate: "2025-05-10" },
];

const REPORTS_C1: Report[] = [
  { id: "r1", title: "Week 1–4 Progress", date: "2025-03-28", type: "weekly" },
  { id: "r2", title: "Week 5–8 Progress", date: "2025-04-25", type: "weekly" },
  { id: "r3", title: "Final Course Report", date: "2025-05-16", type: "final" },
];

const STUDENTS_C2: Student[] = [
  { id: "s7", name: "Grace Wanjiku", avatar: "GW" },
  { id: "s8", name: "Hassan Abdi", avatar: "HA" },
];

const ASSIGNMENTS_C2: Assignment[] = [
  { id: "a5", title: "Variables & Data Types", dueDate: "2025-04-08" },
  { id: "a6", title: "Loops & Functions", dueDate: "2025-04-22" },
  { id: "a7", title: "Mini Project: Calculator", dueDate: "2025-05-06" },
];

const REPORTS_C2: Report[] = [
  { id: "r4", title: "Mid-course Report", date: "2025-04-25", type: "monthly" },
  { id: "r5", title: "Final Course Report", date: "2025-05-20", type: "final" },
];

const STUDENTS_C3: Student[] = [{ id: "s9", name: "Ivy Chebet", avatar: "IC" }];
const ASSIGNMENTS_C3: Assignment[] = [
  { id: "a8", title: "Color Theory Exercise", dueDate: "2025-04-10" },
  { id: "a9", title: "Typography Design", dueDate: "2025-04-24" },
  { id: "a10", title: "Brand Identity Project", dueDate: "2025-05-15" },
];
const REPORTS_C3: Report[] = [
  { id: "r6", title: "Sessions 1–4 Report", date: "2025-04-20", type: "weekly" },
  { id: "r7", title: "Sessions 5–8 Report", date: "2025-05-08", type: "weekly" },
  { id: "r8", title: "Final Session Report", date: "2025-05-28", type: "final" },
];

const STUDENTS_C4: Student[] = [
  { id: "s10", name: "James Kariuki", avatar: "JK" },
  { id: "s11", name: "Lena Omondi", avatar: "LO" },
];
const ASSIGNMENTS_C4: Assignment[] = [
  { id: "a11", title: "States of Matter Lab", dueDate: "2025-03-10" },
  { id: "a12", title: "Chemical Reactions", dueDate: "2025-03-24" },
  { id: "a13", title: "Physics Forces", dueDate: "2025-04-07" },
  { id: "a14", title: "Biology Cell Report", dueDate: "2025-04-21" },
  { id: "a15", title: "Final Science Project", dueDate: "2025-05-05" },
];
const REPORTS_C4: Report[] = [
  { id: "r9", title: "March Report", date: "2025-03-31", type: "monthly" },
  { id: "r10", title: "April Report", date: "2025-04-30", type: "monthly" },
  { id: "r11", title: "Course Completion Report", date: "2025-05-07", type: "final" },
];

const STUDENTS_C5: Student[] = [{ id: "s12", name: "Mercy Njeru", avatar: "MN" }];
const ASSIGNMENTS_C5: Assignment[] = [];
const REPORTS_C5: Report[] = [
  { id: "r12", title: "Opening Moves Progress", date: "2025-05-15", type: "weekly" },
];

const STUDENTS_C6: Student[] = [
  { id: "s13", name: "Noah Kipchoge", avatar: "NK" },
  { id: "s14", name: "Olivia Wambua", avatar: "OW" },
  { id: "s15", name: "Peter Maina", avatar: "PM" },
];
const ASSIGNMENTS_C6: Assignment[] = [
  { id: "a16", title: "Web Basics: HTML", dueDate: "2025-03-20" },
  { id: "a17", title: "CSS Styling", dueDate: "2025-04-03" },
  { id: "a18", title: "JavaScript Intro", dueDate: "2025-04-17" },
  { id: "a19", title: "React Components", dueDate: "2025-05-01" },
];
const REPORTS_C6: Report[] = [
  { id: "r13", title: "Module 1 Report", date: "2025-03-28", type: "weekly" },
  { id: "r14", title: "Module 2 Report", date: "2025-04-25", type: "weekly" },
  { id: "r15", title: "Final Project Report", date: "2025-05-10", type: "final" },
];

const STUDENTS_C7: Student[] = [
  { id: "s16", name: "Aisha Noor", avatar: "AN" },
  { id: "s17", name: "Caleb Muriithi", avatar: "CM" },
  { id: "s18", name: "Diana Atieno", avatar: "DA" },
  { id: "s19", name: "Eliud Mwenda", avatar: "EM" },
];
const ASSIGNMENTS_C7: Assignment[] = [
  { id: "a20", title: "Wireframe a Mobile Flow", dueDate: "2025-06-06" },
  { id: "a21", title: "Build Login Screen", dueDate: "2025-06-20" },
  { id: "a22", title: "Local Storage Exercise", dueDate: "2025-07-04" },
  { id: "a23", title: "Capstone App Demo", dueDate: "2025-07-18" },
];
const REPORTS_C7: Report[] = [
  { id: "r16", title: "Sprint 1 Progress", date: "2025-06-13", type: "weekly" },
  { id: "r17", title: "Sprint 2 Progress", date: "2025-07-04", type: "weekly" },
  { id: "r18", title: "Mobile App Final Report", date: "2025-07-22", type: "final" },
];

const STUDENTS_C8: Student[] = [
  { id: "s20", name: "Farah Hassan", avatar: "FH" },
  { id: "s21", name: "George Mutiso", avatar: "GM" },
];
const ASSIGNMENTS_C8: Assignment[] = [
  { id: "a24", title: "Data Collection Sheet", dueDate: "2025-06-05" },
  { id: "a25", title: "Charts and Insights", dueDate: "2025-06-19" },
  { id: "a26", title: "Simple Prediction Model", dueDate: "2025-07-03" },
];
const REPORTS_C8: Report[] = [
  { id: "r19", title: "Data Skills Report", date: "2025-06-27", type: "monthly" },
  { id: "r20", title: "AI Basics Final Report", date: "2025-07-11", type: "final" },
];

const STUDENTS_C9: Student[] = [
  { id: "s22", name: "Hilda Barasa", avatar: "HB" },
  { id: "s23", name: "Ian Kibet", avatar: "IK" },
  { id: "s24", name: "Joy Makena", avatar: "JM" },
];
const ASSIGNMENTS_C9: Assignment[] = [
  { id: "a27", title: "Speech Outline", dueDate: "2025-05-30" },
  { id: "a28", title: "Voice Projection Practice", dueDate: "2025-06-13" },
  { id: "a29", title: "Recorded Presentation", dueDate: "2025-06-27" },
];
const REPORTS_C9: Report[] = [
  { id: "r21", title: "Confidence Growth Report", date: "2025-06-14", type: "weekly" },
  { id: "r22", title: "Presentation Final Report", date: "2025-07-01", type: "final" },
];

const STUDENTS_C10: Student[] = [
  { id: "s25", name: "Kevin Otieno", avatar: "KO" },
  { id: "s26", name: "Lilian Wairimu", avatar: "LW" },
  { id: "s27", name: "Malik Abdalla", avatar: "MA" },
  { id: "s28", name: "Nadia Cherono", avatar: "NC" },
  { id: "s29", name: "Oscar Muli", avatar: "OM" },
];
const ASSIGNMENTS_C10: Assignment[] = [
  { id: "a30", title: "Game Concept Pitch", dueDate: "2025-06-02" },
  { id: "a31", title: "Sprite and Level Design", dueDate: "2025-06-16" },
  { id: "a32", title: "Playable Prototype", dueDate: "2025-06-30" },
  { id: "a33", title: "Final Game Showcase", dueDate: "2025-07-14" },
];
const REPORTS_C10: Report[] = [
  { id: "r23", title: "Prototype Review", date: "2025-06-21", type: "weekly" },
  { id: "r24", title: "Game Design Final Report", date: "2025-07-18", type: "final" },
];

const STUDENTS_C11: Student[] = [
  { id: "s30", name: "Patricia Wekesa", avatar: "PW" },
  { id: "s31", name: "Quincy Ochieng", avatar: "QO" },
];
const ASSIGNMENTS_C11: Assignment[] = [
  { id: "a34", title: "Fractions and Decimals", dueDate: "2025-05-28" },
  { id: "a35", title: "Algebra Practice Set", dueDate: "2025-06-11" },
  { id: "a36", title: "Geometry Revision", dueDate: "2025-06-25" },
  { id: "a37", title: "Mock Exam Review", dueDate: "2025-07-09" },
];
const REPORTS_C11: Report[] = [
  { id: "r25", title: "May Progress Report", date: "2025-05-31", type: "monthly" },
  { id: "r26", title: "June Progress Report", date: "2025-06-30", type: "monthly" },
  { id: "r27", title: "Math Mastery Final Report", date: "2025-07-12", type: "final" },
];

const STUDENTS_C12: Student[] = [
  { id: "s32", name: "Ruth Nyambura", avatar: "RN" },
  { id: "s33", name: "Samuel Kiptoo", avatar: "SK" },
  { id: "s34", name: "Talia Muthoni", avatar: "TM" },
];
const ASSIGNMENTS_C12: Assignment[] = [
  { id: "a38", title: "Password Safety Audit", dueDate: "2025-06-07" },
  { id: "a39", title: "Phishing Scenario Review", dueDate: "2025-06-21" },
  { id: "a40", title: "Family Safety Plan", dueDate: "2025-07-05" },
];
const REPORTS_C12: Report[] = [
  { id: "r28", title: "Cyber Safety Check-in", date: "2025-06-24", type: "weekly" },
  { id: "r29", title: "Cyber Safety Final Report", date: "2025-07-08", type: "final" },
];

const INITIAL_COURSES: Course[] = [
  {
    id: "c1", name: "Robotics & Automation", icon: <Cpu size={18} />, locationType: "center",
    locationName: "Westlands Learning Center", students: STUDENTS_C1, totalSessions: 12,
    sessions: makeSessions(12, 1.5, 12), assignments: ASSIGNMENTS_C1, reports: REPORTS_C1,
    studentAssignments: makeStudentAssignments(STUDENTS_C1, ASSIGNMENTS_C1, 1),
    studentReports: makeStudentReports(STUDENTS_C1, REPORTS_C1, 3),
    claimStatus: "not_requested", advancePaidAmount: 0,
  },
  {
    id: "c2", name: "Introduction to Coding", icon: <Code2 size={18} />, locationType: "home",
    locationName: "Karen, Nairobi", students: STUDENTS_C2, totalSessions: 8,
    sessions: makeSessions(8, 1, 6), assignments: ASSIGNMENTS_C2, reports: REPORTS_C2,
    studentAssignments: makeStudentAssignments(STUDENTS_C2, ASSIGNMENTS_C2, 1),
    studentReports: makeStudentReports(STUDENTS_C2, REPORTS_C2, 1),
    claimStatus: "not_requested", advancePaidAmount: 0,
  },
  {
    id: "c3", name: "Digital Art & Design", icon: <Palette size={18} />, locationType: "online",
    locationName: "Online – Zoom", students: STUDENTS_C3, totalSessions: 10,
    sessions: makeSessions(10, 1, 4), assignments: ASSIGNMENTS_C3, reports: REPORTS_C3,
    studentAssignments: makeStudentAssignments(STUDENTS_C3, ASSIGNMENTS_C3, 0.67),
    studentReports: makeStudentReports(STUDENTS_C3, REPORTS_C3, 1),
    claimStatus: "not_requested", advancePaidAmount: 0,
  },
  {
    id: "c4", name: "Science Experiments", icon: <Beaker size={18} />, locationType: "physical",
    locationName: "Kileleshwa (Student's Location)", students: STUDENTS_C4, totalSessions: 8,
    sessions: makeSessions(8, 1.5, 8), assignments: ASSIGNMENTS_C4, reports: REPORTS_C4,
    studentAssignments: makeStudentAssignments(STUDENTS_C4, ASSIGNMENTS_C4, 1.0),
    studentReports: makeStudentReports(STUDENTS_C4, REPORTS_C4, 3),
    claimStatus: "approved", advancePaidAmount: 3616,
  },
  {
    id: "c5", name: "Chess & Strategy", icon: <BookOpen size={18} />, locationType: "googlemeet",
    locationName: "Google Meet – Virtual", students: STUDENTS_C5, totalSessions: 12,
    sessions: makeSessions(12, 0.5, 2), assignments: ASSIGNMENTS_C5, reports: REPORTS_C5,
    studentAssignments: makeStudentAssignments(STUDENTS_C5, ASSIGNMENTS_C5, 0),
    studentReports: makeStudentReports(STUDENTS_C5, REPORTS_C5, 0),
    claimStatus: "not_requested", advancePaidAmount: 0,
  },
  {
    id: "c6", name: "Web Development", icon: <Code2 size={18} />, locationType: "center",
    locationName: "Kilimani Tech Hub", students: STUDENTS_C6, totalSessions: 16,
    sessions: makeSessions(16, 1.5, 14), assignments: ASSIGNMENTS_C6, reports: REPORTS_C6,
    studentAssignments: makeStudentAssignments(STUDENTS_C6, ASSIGNMENTS_C6, 0.75),
    studentReports: makeStudentReports(STUDENTS_C6, REPORTS_C6, 2),
    claimStatus: "full_claimed", advancePaidAmount: 9576,
  },
  {
    id: "c7", name: "Mobile App Development", icon: <Smartphone size={18} />, locationType: "center",
    locationName: "Riverside Innovation Lab", students: STUDENTS_C7, totalSessions: 10,
    sessions: makeSessions(10, 1.5, 7), assignments: ASSIGNMENTS_C7, reports: REPORTS_C7,
    studentAssignments: makeStudentAssignments(STUDENTS_C7, ASSIGNMENTS_C7, 0.55),
    studentReports: makeStudentReports(STUDENTS_C7, REPORTS_C7, 1),
    claimStatus: "not_requested", advancePaidAmount: 0,
  },
  {
    id: "c8", name: "AI & Data Basics", icon: <Cpu size={18} />, locationType: "online",
    locationName: "Online - Google Classroom", students: STUDENTS_C8, totalSessions: 8,
    sessions: makeSessions(8, 1, 5), assignments: ASSIGNMENTS_C8, reports: REPORTS_C8,
    studentAssignments: makeStudentAssignments(STUDENTS_C8, ASSIGNMENTS_C8, 0.45),
    studentReports: makeStudentReports(STUDENTS_C8, REPORTS_C8, 1),
    claimStatus: "denied", advancePaidAmount: 0,
  },
  {
    id: "c9", name: "Public Speaking", icon: <Video size={18} />, locationType: "home",
    locationName: "Lavington, Nairobi", students: STUDENTS_C9, totalSessions: 6,
    sessions: makeSessions(6, 1, 6), assignments: ASSIGNMENTS_C9, reports: REPORTS_C9,
    studentAssignments: makeStudentAssignments(STUDENTS_C9, ASSIGNMENTS_C9, 1),
    studentReports: makeStudentReports(STUDENTS_C9, REPORTS_C9, 2),
    claimStatus: "not_requested", advancePaidAmount: 0,
  },
  {
    id: "c10", name: "Game Design Studio", icon: <Code2 size={18} />, locationType: "physical",
    locationName: "Two Rivers Youth Hub", students: STUDENTS_C10, totalSessions: 12,
    sessions: makeSessions(12, 1.5, 9), assignments: ASSIGNMENTS_C10, reports: REPORTS_C10,
    studentAssignments: makeStudentAssignments(STUDENTS_C10, ASSIGNMENTS_C10, 0.7),
    studentReports: makeStudentReports(STUDENTS_C10, REPORTS_C10, 1),
    claimStatus: "advance_claimed", advancePaidAmount: 5424,
  },
  {
    id: "c11", name: "Mathematics Mastery", icon: <BookOpen size={18} />, locationType: "home",
    locationName: "Runda, Nairobi", students: STUDENTS_C11, totalSessions: 14,
    sessions: makeSessions(14, 1, 11), assignments: ASSIGNMENTS_C11, reports: REPORTS_C11,
    studentAssignments: makeStudentAssignments(STUDENTS_C11, ASSIGNMENTS_C11, 0.8),
    studentReports: makeStudentReports(STUDENTS_C11, REPORTS_C11, 2),
    claimStatus: "not_requested", advancePaidAmount: 0,
  },
  {
    id: "c12", name: "Cyber Safety", icon: <AlertCircle size={18} />, locationType: "googlemeet",
    locationName: "Google Meet - Evening Cohort", students: STUDENTS_C12, totalSessions: 8,
    sessions: makeSessions(8, 0.5, 3), assignments: ASSIGNMENTS_C12, reports: REPORTS_C12,
    studentAssignments: makeStudentAssignments(STUDENTS_C12, ASSIGNMENTS_C12, 0.35),
    studentReports: makeStudentReports(STUDENTS_C12, REPORTS_C12, 0),
    claimStatus: "not_requested", advancePaidAmount: 0,
  },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function calcCompletion(course: Course): number {
  const totalStudentSessions = course.students.length * course.sessions.length;
  if (totalStudentSessions === 0) return 0;

  const attendanceRecords = getAttendanceRecords(course);
  const presentCount = attendanceRecords.filter((record) => record.present).length;
  const attendPct = attendanceRecords.length > 0 ? presentCount / attendanceRecords.length : 0;

  const assignmentRecords = getSessionAssignmentRecords(course);
  const gradedAssignments = assignmentRecords.filter((record) => record.status === "graded").length;
  const assignPct = assignmentRecords.length > 0 ? gradedAssignments / assignmentRecords.length : 0;

  const reportRecords = getSessionReportRecords(course);
  const doneReports = reportRecords.filter((record) => record.done).length;
  const reportPct = reportRecords.length > 0 ? doneReports / reportRecords.length : 0;

  return Math.round(((assignPct + attendPct + reportPct) / 3) * 100);
}

function calcTotalEarning(course: Course): number {
  return RATE[course.locationType] * calcPayableSessionCount(course);
}

function calcAdvanceAmount(course: Course): number {
  return Math.round(calcTotalEarning(course) * 0.3);
}

function calcPayableSessionCount(course: Course): number {
  return course.locationType === "googlemeet" ? course.totalSessions : 12;
}

function totalHours(course: Course): number {
  return course.sessions.filter((s) => s.attended).reduce((sum, s) => sum + s.duration, 0);
}

function canClaimFull(course: Course): boolean {
  return calcCompletion(course) >= 100 && !["full_claimed", "approved"].includes(course.claimStatus);
}

function canClaimAdvance(course: Course): boolean {
  const pct = calcCompletion(course);
  return pct >= 50 && pct < 100 && course.claimStatus === "not_requested";
}

function getPaymentActivities(course: Course): PaymentActivity[] {
  if (course.paymentActivities?.length) {
    return [...course.paymentActivities].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  const activities: PaymentActivity[] = [];
  if (course.advancePaidAmount > 0) {
    activities.push({
      id: `${course.id}-advance-paid`,
      type: "advance",
      amount: course.advancePaidAmount,
      status: course.claimStatus === "denied" ? "denied" : "paid",
      requestedAt: course.invoice?.uploadedAt ?? new Date().toISOString(),
      note: "Advance payment",
      invoiceFileName: course.invoice?.fileName,
    });
  }

  if (course.claimStatus === "full_claimed" || course.claimStatus === "approved" || course.claimStatus === "denied") {
    activities.push({
      id: `${course.id}-full-${course.claimStatus}`,
      type: "full",
      amount: Math.max(calcTotalEarning(course) - course.advancePaidAmount, 0),
      status: course.claimStatus === "approved" ? "approved" : course.claimStatus === "denied" ? "denied" : "requested",
      requestedAt: course.invoice?.uploadedAt ?? new Date().toISOString(),
      note: course.claimStatus === "denied"
        ? "Rejected because the claim needs a complete invoice and supporting session records."
        : course.advancePaidAmount > 0 ? "Remaining course payment" : "Full course payment",
      invoiceFileName: course.invoice?.fileName,
    });
  }

  return activities;
}

// ─── Small UI Components ──────────────────────────────────────────────────────

function formatPaymentDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function paymentStatusClass(status: PaymentActivityStatus): string {
  const statusClass: Record<PaymentActivityStatus, string> = {
    requested: "bg-blue-50 text-blue-700 border-blue-200",
    paid: "bg-green-50 text-green-700 border-green-200",
    approved: "bg-green-50 text-green-700 border-green-200",
    denied: "bg-red-50 text-red-700 border-red-200",
  };
  return statusClass[status];
}

function paymentStatusLabel(status: PaymentActivityStatus): string {
  if (status === "denied") return "Rejected";
  if (status === "paid") return "Paid";
  if (status === "approved") return "Approved";
  return "Requested";
}

function ClaimHistoryPanel({ course }: { course: Course }) {
  const activities = getPaymentActivities(course);

  return (
    <aside className="h-full rounded-2xl border border-border bg-card p-4 shadow-sm lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-foreground">Claim History</h3>
          <p className="mt-1 text-xs text-muted-foreground">{course.name}</p>
        </div>
        <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
          {activities.length}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {activities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
            <Receipt size={20} className="mx-auto text-muted-foreground/50" />
            <p className="mt-2 text-sm font-semibold text-foreground">No claims yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Payment requests for this course will appear here.</p>
          </div>
        ) : (
          activities.map((activity) => {
            const isDenied = activity.status === "denied";
            const noteLabel = isDenied ? "Reason" : activity.type === "advance" ? "Advance reason" : "Note";
            return (
              <div key={activity.id} className="rounded-xl border border-border bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">
                      {activity.type === "advance" ? "Advance claim" : "Payment claim"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatPaymentDate(activity.requestedAt)}</p>
                  </div>
                  <span className={`inline-flex flex-shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${paymentStatusClass(activity.status)}`}>
                    {paymentStatusLabel(activity.status)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-[#f8fbfe] px-3 py-2">
                  <span className="text-xs font-semibold text-muted-foreground">Amount</span>
                  <span className="font-mono text-sm font-extrabold text-[#25476a]">KSh {activity.amount.toLocaleString()}</span>
                </div>

                {activity.invoiceFileName && (
                  <p className="mt-2 truncate text-xs text-muted-foreground">
                    Invoice: <span className="font-semibold text-foreground">{activity.invoiceFileName}</span>
                  </p>
                )}

                {(activity.note || isDenied) && (
                  <div className={`mt-3 rounded-lg border px-3 py-2 ${isDenied ? "border-red-200 bg-red-50" : "border-border bg-muted/30"}`}>
                    <p className={`text-[11px] font-bold uppercase ${isDenied ? "text-red-700" : "text-muted-foreground"}`}>{noteLabel}</p>
                    <p className={`mt-1 text-xs ${isDenied ? "text-red-700" : "text-muted-foreground"}`}>
                      {activity.note || "No reason was recorded."}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

function getAttendanceRecords(course: Course): StudentSessionAttendance[] {
  if (course.attendance?.length) return course.attendance;

  return course.students.flatMap((student) =>
    course.sessions.map((session) => ({
      studentId: student.id,
      sessionId: session.id,
      present: session.attended,
    }))
  );
}

function getSessionAssignmentRecords(course: Course): StudentSessionAssignment[] {
  if (course.sessionAssignments?.length) return course.sessionAssignments;

  return course.students.flatMap((student) => {
    const studentRecords = course.studentAssignments.filter((record) => record.studentId === student.id);
    return course.sessions.map((session, index) => {
      const source = studentRecords[index % Math.max(studentRecords.length, 1)];
      const attended = getAttendanceRecords(course).find((record) => record.studentId === student.id && record.sessionId === session.id)?.present;
      return {
        studentId: student.id,
        assignmentId: session.id,
        sessionId: session.id,
        status: source?.status ?? (attended ? "submitted" : "issued"),
        score: source?.score,
        feedback: source?.feedback,
        submittedAt: source?.submittedAt,
        gradedAt: source?.gradedAt,
      };
    });
  });
}

function getSessionReportRecords(course: Course): StudentSessionReport[] {
  if (course.sessionReports?.length) return course.sessionReports;

  return course.students.flatMap((student) => {
    const studentReports = course.studentReports.filter((record) => record.studentId === student.id);
    return course.sessions.map((session, index) => {
      const source = studentReports[index % Math.max(studentReports.length, 1)];
      return {
        studentId: student.id,
        sessionId: session.id,
        done: source?.done ?? false,
        content: source?.content || `${student.name} session ${session.number} report notes for ${course.name}.`,
      };
    });
  });
}

function makeSessionAssignment(session: Session): Assignment {
  return {
    id: session.id,
    title: `Session ${session.number}`,
    dueDate: session.date,
  };
}

function makeSessionReport(session: Session): Report {
  return {
    id: session.id,
    title: `Session ${session.number} Report`,
    date: session.date,
    type: session.number >= 10 ? "final" : "weekly",
  };
}

function StatusBadge({ status: _status }: { status: ClaimStatus }) {
  return null;
}

function AssignmentStatusChip({ status, onClick }: { status: AssignmentStatus; onClick?: () => void }) {
  const map: Record<AssignmentStatus, { label: string; cls: string }> = {
    issued: { label: "Issued", cls: "bg-slate-100 text-slate-500 border border-slate-200" },
    submitted: { label: "Submitted", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
    graded: { label: "Graded", cls: "bg-green-50 text-green-700 border border-green-200" },
  };
  const { label, cls } = map[status];
  return (
    <button
      onClick={onClick}
      className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${cls} ${onClick ? "hover:opacity-80 cursor-pointer" : "cursor-default"}`}
    >
      {label}
    </button>
  );
}

function AssignmentLifecycle({ status }: { status: AssignmentStatus }) {
  const steps: { key: AssignmentStatus; label: string }[] = [
    { key: "issued", label: "Issued" },
    { key: "submitted", label: "Submitted" },
    { key: "graded", label: "Graded" },
  ];
  const currentIndex = steps.findIndex((step) => step.key === status);

  return (
    <div className="flex items-center justify-center gap-1.5">
      {steps.map((step, index) => {
        const complete = index <= currentIndex;
        return (
          <div key={step.key} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${complete ? "bg-[#25476a]" : "bg-slate-200"}`} title={step.label} />
            <span className={`hidden xl:inline text-[11px] font-semibold ${complete ? "text-[#25476a]" : "text-muted-foreground"}`}>{step.label}</span>
            {index < steps.length - 1 && <span className={`h-px w-4 ${index < currentIndex ? "bg-[#25476a]" : "bg-slate-200"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function LocationIcon({ type }: { type: LocationType }) {
  const icons: Record<LocationType, React.ReactNode> = {
    center: <Building2 size={11} />, home: <Home size={11} />,
    online: <Video size={11} />, physical: <MapPin size={11} />, googlemeet: <Smartphone size={11} />,
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${LOCATION_COLORS[type]}`}>
      {icons[type]}
      <span className="hidden sm:inline">{LOCATION_LABELS[type]}</span>
    </span>
  );
}

function ProgressRing({ pct, size = 60 }: { pct: number; size?: number }) {
  const r = (size - 7) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  const color = pct >= 100 ? "#16a34a" : pct >= 50 ? "#feb139" : "#38aae1";
  return (
    <svg width={size} height={size} className="rotate-[-90deg]" style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e4edf5" strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s ease" }} />
    </svg>
  );
}

function ProgressBar({ pct, color = "#38aae1" }: { pct: number; color?: string }) {
  return (
    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
    </div>
  );
}

function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <div className={`${dim} rounded-full bg-[#25476a] text-white font-bold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Assignment Detail Modal ──────────────────────────────────────────────────

interface AssignmentDetailProps {
  student: Student;
  assignment: Assignment;
  record: StudentAssignment | StudentSessionAssignment;
  onClose: () => void;
  onUpdate: (updated: StudentAssignment | StudentSessionAssignment) => void;
}

function AssignmentDetailModal({ student, assignment, record, onClose, onUpdate }: AssignmentDetailProps) {
  const [score, setScore] = useState(record.score?.toString() ?? "");
  const [feedback, setFeedback] = useState(record.feedback ?? "");

  const handleMarkSubmitted = () => {
    onUpdate({ ...record, status: "submitted", submittedAt: new Date().toISOString().split("T")[0] });
  };

  const handleGrade = () => {
    if (!score) return;
    onUpdate({ ...record, status: "graded", score: Number(score), feedback, gradedAt: new Date().toISOString().split("T")[0] });
  };

  const statusSteps: AssignmentStatus[] = ["issued", "submitted", "graded"];
  const currentStep = statusSteps.indexOf(record.status);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-card w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <Avatar initials={student.avatar} />
            <div>
              <p className="font-bold text-sm text-foreground">{student.name}</p>
              <p className="text-xs text-muted-foreground">{assignment.title}</p>
            </div>
          </div>
          <button onClick={onClose} title="Close" className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Assignment info */}
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Assignment Details</p>
            <p className="font-semibold text-foreground">{assignment.title}</p>
            <p className="text-xs text-muted-foreground mt-1">Due: {assignment.dueDate}</p>
          </div>

          {/* Status progress */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Progress</p>
            <div className="flex items-center gap-2">
              {statusSteps.map((step, i) => (
                <div key={step} className="flex items-center gap-2 flex-1">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${i <= currentStep ? "bg-[#25476a] border-[#25476a] text-white" : "border-border text-muted-foreground bg-card"}`}>
                      {i <= currentStep ? <CheckCircle2 size={14} /> : i + 1}
                    </div>
                    <span className="text-xs text-center capitalize text-muted-foreground font-medium">{step}</span>
                  </div>
                  {i < statusSteps.length - 1 && (
                    <div className={`h-0.5 w-6 mb-4 rounded-full ${i < currentStep ? "bg-[#25476a]" : "bg-border"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dates */}
          {(record.submittedAt || record.gradedAt) && (
            <div className="grid grid-cols-2 gap-3">
              {record.submittedAt && (
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-xs text-amber-600 font-semibold">Submitted</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{record.submittedAt}</p>
                </div>
              )}
              {record.gradedAt && (
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-xs text-green-600 font-semibold">Graded</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{record.gradedAt}</p>
                </div>
              )}
            </div>
          )}

          {/* Score display */}
          {record.status === "graded" && (
            <div className="bg-[#25476a] rounded-xl p-4 text-white text-center">
              <p className="text-xs opacity-60 uppercase tracking-wide">Score</p>
              <p className="text-4xl font-extrabold mt-1">{record.score}<span className="text-lg font-normal opacity-60">/100</span></p>
              {record.feedback && <p className="text-xs opacity-70 mt-2 italic">"{record.feedback}"</p>}
            </div>
          )}

          {/* Actions */}
          {record.status === "issued" && (
            <button onClick={handleMarkSubmitted} className="w-full bg-[#feb139] text-[#12253a] py-3 rounded-xl font-bold hover:bg-amber-400 transition-colors flex items-center justify-center gap-2">
              <Send size={15} /> Mark as Submitted
            </button>
          )}

          {record.status === "submitted" && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Score (out of 100)</label>
                <input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)}
                  placeholder="Enter score..."
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#38aae1]/40" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Feedback</label>
                <textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Write feedback for the student..."
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#38aae1]/40 resize-none" />
              </div>
              <button onClick={handleGrade} disabled={!score}
                className="w-full bg-[#25476a] text-white py-3 rounded-xl font-bold hover:bg-[#1a3452] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                <Star size={15} /> Save Grade
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Report Detail Modal ──────────────────────────────────────────────────────

interface ReportDetailProps {
  student: Student;
  report: Report;
  record: StudentReport | StudentSessionReport;
  onClose: () => void;
  onUpdate: (updated: StudentReport | StudentSessionReport) => void;
}

function ReportDetailModal({ student, report, record, onClose, onUpdate }: ReportDetailProps) {
  const [content, setContent] = useState(record.content);

  const typeBadge: Record<ReportPeriod, string> = {
    weekly: "bg-sky-100 text-sky-700",
    monthly: "bg-violet-100 text-violet-700",
    final: "bg-[#25476a] text-white",
  };

  const handleSave = (done: boolean) => {
    onUpdate({ ...record, content, done });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-card w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <Avatar initials={student.avatar} />
            <div>
              <p className="font-bold text-sm text-foreground">{student.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeBadge[report.type]}`}>{report.type}</span>
                <span className="text-xs text-muted-foreground">{report.date}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} title="Close" className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          <div className="bg-muted/50 rounded-xl p-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{report.title}</p>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Report Content</label>
            <textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your report for this student..."
              className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#38aae1]/40 resize-none"
            />
          </div>

          {record.done ? (
            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#38aae1] text-[#38aae1] font-semibold text-sm hover:bg-[#38aae1]/5 transition-colors">
                <Eye size={14} /> Preview
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#38aae1] text-[#38aae1] font-semibold text-sm hover:bg-[#38aae1]/5 transition-colors">
                <Download size={14} /> Download
              </button>
              <button onClick={() => handleSave(true)} className="flex-1 py-2.5 rounded-xl bg-[#25476a] text-white font-semibold text-sm hover:bg-[#1a3452] transition-colors">
                Save
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => handleSave(false)} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground font-semibold text-sm hover:bg-muted transition-colors">
                Save Draft
              </button>
              <button onClick={() => handleSave(true)} disabled={!content.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[#25476a] text-white font-semibold text-sm hover:bg-[#1a3452] transition-colors disabled:opacity-40">
                Mark Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Assignments Matrix View ──────────────────────────────────────────────────

function AttendanceView({
  course, onUpdate, onBack,
}: {
  course: Course;
  onUpdate: (updates: Partial<Course>) => void;
  onBack: () => void;
}) {
  const attendance = getAttendanceRecords(course);
  const presentCount = attendance.filter((record) => record.present).length;
  const totalCount = course.students.length * course.sessions.length;

  const toggleAttendance = (studentId: string, sessionId: string) => {
    const updated = getAttendanceRecords(course).map((record) =>
      record.studentId === studentId && record.sessionId === sessionId
        ? { ...record, present: !record.present }
        : record
    );
    onUpdate({ attendance: updated });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} title="Back" className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground flex-shrink-0">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="font-bold text-foreground">Attendance</h2>
          <p className="text-xs text-muted-foreground">{course.name}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          <span className="font-extrabold">{presentCount}</span> Present marks
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
          <span className="font-extrabold">{Math.max(totalCount - presentCount, 0)}</span> Absent marks
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="bg-muted/60 border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide sticky left-0 bg-muted/60 min-w-[170px]">
                  Student
                </th>
                {course.sessions.map((session) => (
                  <th key={session.id} className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wide min-w-[94px]">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-foreground normal-case font-semibold">Session {session.number}</span>
                      <span className="text-[10px] font-normal">{session.date}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {course.students.map((student) => (
                <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 sticky left-0 bg-card">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={student.avatar} size="sm" />
                      <span className="font-semibold text-foreground text-sm whitespace-nowrap">{student.name}</span>
                    </div>
                  </td>
                  {course.sessions.map((session) => {
                    const record = attendance.find((item) => item.studentId === student.id && item.sessionId === session.id);
                    const present = record?.present ?? false;
                    return (
                      <td key={session.id} className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleAttendance(student.id, session.id)}
                          title={present ? "Mark absent" : "Mark present"}
                          className={`mx-auto flex h-7 w-14 items-center rounded-full p-1 transition-colors ${present ? "bg-green-500" : "bg-slate-300"}`}
                        >
                          <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${present ? "translate-x-7" : "translate-x-0"}`} />
                        </button>
                        <p className={`mt-1 text-[10px] font-semibold ${present ? "text-green-600" : "text-slate-500"}`}>
                          {present ? "Present" : "Absent"}
                        </p>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AssignmentsView({
  course, onUpdate, onBack,
}: {
  course: Course;
  onUpdate: (updates: Partial<Course>) => void;
  onBack: () => void;
}) {
  const sessionAssignments = getSessionAssignmentRecords(course);
  const [detail, setDetail] = useState<{ student: Student; assignment: Assignment; record: StudentSessionAssignment } | null>(null);

  const getRecord = (sid: string, sessionId: string) =>
    sessionAssignments.find((r) => r.studentId === sid && r.sessionId === sessionId);

  const handleUpdate = (updated: StudentAssignment | StudentSessionAssignment) => {
    const sessionRecord = updated as StudentSessionAssignment;
    const newRecords = getSessionAssignmentRecords(course).map((r) =>
      r.studentId === sessionRecord.studentId && r.sessionId === sessionRecord.sessionId ? sessionRecord : r
    );
    onUpdate({ sessionAssignments: newRecords });
    setDetail(null);
  };

  const pendingGrade = sessionAssignments.filter((r) => r.status === "submitted").length;
  const notSubmitted = sessionAssignments.filter((r) => r.status === "issued").length;
  const graded = sessionAssignments.filter((r) => r.status === "graded").length;

  return (
    <div className="flex flex-col gap-5">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} title="Back" className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground flex-shrink-0">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="font-bold text-foreground">Assignments</h2>
          <p className="text-xs text-muted-foreground">{course.name}</p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Not Submitted", val: notSubmitted, cls: "bg-slate-100 text-slate-600" },
          { label: "Awaiting Grade", val: pendingGrade, cls: "bg-amber-100 text-amber-700" },
          { label: "Graded", val: graded, cls: "bg-green-100 text-green-700" },
        ].map((s) => (
          <div key={s.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${s.cls}`}>
            <span className="font-extrabold">{s.val}</span> {s.label}
          </div>
        ))}
      </div>

      {course.sessions.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center gap-3 text-center">
          <ClipboardList size={32} className="text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No sessions for this course.</p>
        </div>
      ) : (
        <>
          {/* Matrix table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide sticky left-0 bg-muted/60 min-w-[140px]">
                      Student
                    </th>
                    {course.sessions.map((session) => (
                      <th key={session.id} className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wide min-w-[118px]">
                        <div className="flex flex-col gap-0.5 items-center">
                          <span className="text-foreground normal-case font-semibold text-xs leading-tight text-center">Session {session.number}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">{session.date}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {course.students.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 sticky left-0 bg-card">
                        <div className="flex items-center gap-2.5">
                          <Avatar initials={student.avatar} size="sm" />
                          <span className="font-semibold text-foreground text-sm whitespace-nowrap">{student.name}</span>
                        </div>
                      </td>
                      {course.sessions.map((session) => {
                        const record = getRecord(student.id, session.id);
                        if (!record) return <td key={session.id} className="px-3 py-3 text-center">—</td>;
                        return (
                          <td key={session.id} className="px-3 py-3 text-center">
                            <div className="flex justify-center">
                              <AssignmentStatusChip
                                status={record.status}
                                onClick={() => setDetail({ student, assignment: makeSessionAssignment(session), record })}
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-session summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {course.sessions.map((session) => {
              const records = sessionAssignments.filter((r) => r.sessionId === session.id);
              const submittedCount = records.filter((r) => r.status !== "issued").length;
              const gradedCount = records.filter((r) => r.status === "graded").length;
              const total = records.length;
              return (
                <div key={session.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="font-semibold text-foreground text-sm leading-tight">Session {session.number}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{session.date}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                    <span><strong className="text-foreground">{submittedCount}</strong>/{total} submitted</span>
                    <span><strong className="text-green-600">{gradedCount}</strong>/{total} graded</span>
                  </div>
                  <ProgressBar pct={total > 0 ? (gradedCount / total) * 100 : 0} color="#16a34a" />
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal */}
      {detail && (
        <AssignmentDetailModal
          student={detail.student}
          assignment={detail.assignment}
          record={detail.record}
          onClose={() => setDetail(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}

// ─── Reports Matrix View ──────────────────────────────────────────────────────

function ReportsView({
  course, onUpdate, onBack,
}: {
  course: Course;
  onUpdate: (updates: Partial<Course>) => void;
  onBack: () => void;
}) {
  const sessionReports = getSessionReportRecords(course);
  const [detail, setDetail] = useState<{ student: Student; report: Report; record: StudentSessionReport } | null>(null);

  const getRecord = (sid: string, sessionId: string) =>
    sessionReports.find((r) => r.studentId === sid && r.sessionId === sessionId);

  const handleUpdate = (updated: StudentReport | StudentSessionReport) => {
    const sessionRecord = updated as StudentSessionReport;
    const newRecords = getSessionReportRecords(course).map((r) =>
      r.studentId === sessionRecord.studentId && r.sessionId === sessionRecord.sessionId ? sessionRecord : r
    );
    onUpdate({ sessionReports: newRecords });
    setDetail(null);
  };

  const typeBadge: Record<ReportPeriod, string> = {
    weekly: "bg-sky-100 text-sky-700",
    monthly: "bg-violet-100 text-violet-700",
    final: "bg-[#25476a] text-white",
  };

  const doneCount = sessionReports.filter((r) => r.done).length;
  const pendingCount = sessionReports.filter((r) => !r.done).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} title="Back" className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground flex-shrink-0">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="font-bold text-foreground">Reports</h2>
          <p className="text-xs text-muted-foreground">{course.name}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          <span className="font-extrabold">{doneCount}</span> Done
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-600">
          <span className="font-extrabold">{pendingCount}</span> Pending
        </div>
      </div>

      {course.sessions.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center gap-3 text-center">
          <FileText size={32} className="text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No sessions for this course.</p>
        </div>
      ) : (
        <>
          {/* Matrix table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide sticky left-0 bg-muted/60 min-w-[140px]">
                      Student
                    </th>
                    {course.sessions.map((session) => {
                      const report = makeSessionReport(session);
                      return (
                      <th key={session.id} className="px-3 py-3 text-center text-xs font-bold text-muted-foreground min-w-[150px]">
                        <div className="flex flex-col gap-1 items-center">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeBadge[report.type]}`}>{report.type}</span>
                          <span className="text-foreground normal-case font-semibold text-xs leading-tight max-w-[130px] text-center">{report.title}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">{report.date}</span>
                        </div>
                      </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {course.students.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 sticky left-0 bg-card">
                        <div className="flex items-center gap-2.5">
                          <Avatar initials={student.avatar} size="sm" />
                          <span className="font-semibold text-foreground text-sm whitespace-nowrap">{student.name}</span>
                        </div>
                      </td>
                      {course.sessions.map((session) => {
                        const rep = makeSessionReport(session);
                        const record = getRecord(student.id, session.id);
                        if (!record) return <td key={session.id} className="px-3 py-3 text-center">—</td>;
                        return (
                          <td key={session.id} className="px-3 py-3 text-center">
                            <button
                              onClick={() => setDetail({ student, report: rep, record })}
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:opacity-80 ${record.done ? "bg-green-50 text-green-700 border border-green-200" : "bg-rose-50 text-rose-600 border border-rose-200"}`}
                            >
                              {record.done ? <CheckSquare size={11} /> : <Square size={11} />}
                              {record.done ? "Done" : "Pending"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {detail && (
        <ReportDetailModal
          student={detail.student}
          report={detail.report}
          record={detail.record}
          onClose={() => setDetail(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}

    // ─── Session Overview (per-session student rows) ─────────────────────────────

    function SessionOverviewView({
      course, onUpdate, onBack, onOpenSessionAssignment, onOpenSessionReport,
    }: {
      course: Course;
      onUpdate: (updates: Partial<Course>) => void;
      onBack: () => void;
      onOpenSessionAssignment?: (sessionId: string) => void;
      onOpenSessionReport?: (sessionId: string) => void;
    }) {
      const [index, setIndex] = useState(0);
      const sessions = course.sessions;
      const session = sessions[index];

      const attendance = getAttendanceRecords(course);
      const sessionAssignments = getSessionAssignmentRecords(course);
      const sessionReports = getSessionReportRecords(course);

      const [assignDetail, setAssignDetail] = useState<{
        student: Student;
        assignment: Assignment;
        record: StudentSessionAssignment;
      } | null>(null);

      const [reportDetail, setReportDetail] = useState<{
        student: Student;
        report: Report;
        record: StudentSessionReport;
      } | null>(null);

      // navigation to session-level pages handled by parent

      const toggleAttendance = (studentId: string) => {
        const updated = getAttendanceRecords(course).map((r) =>
          r.studentId === studentId && r.sessionId === session.id ? { ...r, present: !r.present } : r
        );
        onUpdate({ attendance: updated });
      };

      const handleAssignUpdate = (updated: StudentAssignment | StudentSessionAssignment) => {
        const sessionRecord = updated as StudentSessionAssignment;
        const newRecords = getSessionAssignmentRecords(course).map((r) =>
          r.studentId === sessionRecord.studentId && r.sessionId === sessionRecord.sessionId ? sessionRecord : r
        );
        onUpdate({ sessionAssignments: newRecords });
        setAssignDetail(null);
      };

      const handleReportUpdate = (updated: StudentReport | StudentSessionReport) => {
        const sessionRecord = updated as StudentSessionReport;
        const newRecords = getSessionReportRecords(course).map((r) =>
          r.studentId === sessionRecord.studentId && r.sessionId === sessionRecord.sessionId ? sessionRecord : r
        );
        onUpdate({ sessionReports: newRecords });
        setReportDetail(null);
      };

      if (!session) {
        return (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <button onClick={onBack} title="Back" className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
                <ChevronLeft size={20} />
              </button>
              <div>
                <h2 className="font-bold text-foreground">Session Overview</h2>
                <p className="text-xs text-muted-foreground">No sessions for this course.</p>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <button onClick={onBack} title="Back" className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground flex-shrink-0">
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <button onClick={() => setIndex((i) => Math.max(0, i - 1))} title="Previous session" disabled={index === 0} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
                <ChevronLeft size={18} />
              </button>
              <div>
                <h2 className="font-bold text-foreground">Session {session.number}</h2>
                <p className="text-xs text-muted-foreground">{session.date}</p>
              </div>
              <button onClick={() => setIndex((i) => Math.min(sessions.length - 1, i + 1))} title="Next session" disabled={index === sessions.length - 1} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide sticky left-0 bg-muted/60 min-w-[170px]">Student</th>
                    <th className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wide">Attendance</th>
                    <th className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      <button
                        type="button"
                        onClick={() => onOpenSessionAssignment?.(session.id)}
                        className="font-bold uppercase tracking-wide text-[#25476a] hover:text-[#38aae1]"
                      >
                        Assignment
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      <button
                        type="button"
                        onClick={() => onOpenSessionReport?.(session.id)}
                        className="font-bold uppercase tracking-wide text-[#25476a] hover:text-[#38aae1]"
                      >
                        Report
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {course.students.map((student) => {
                    const att = attendance.find((r) => r.studentId === student.id && r.sessionId === session.id);
                    const aRec = sessionAssignments.find((r) => r.studentId === student.id && r.sessionId === session.id);
                    const rRec = sessionReports.find((r) => r.studentId === student.id && r.sessionId === session.id);
                    const present = att?.present ?? false;
                    return (
                      <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 sticky left-0 bg-card">
                          <div className="flex items-center gap-2.5">
                            <Avatar initials={student.avatar} size="sm" />
                            <span className="font-semibold text-foreground text-sm whitespace-nowrap">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleAttendance(student.id)}
                            title={present ? "Mark absent" : "Mark present"}
                            className={`mx-auto flex h-7 w-14 items-center rounded-full p-1 transition-colors ${present ? "bg-green-500" : "bg-slate-300"}`}
                          >
                            <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${present ? "translate-x-7" : "translate-x-0"}`} />
                          </button>
                          <p className={`mt-1 text-[10px] font-semibold ${present ? "text-green-600" : "text-slate-500"}`}>{present ? "Present" : "Absent"}</p>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {aRec ? (
                            <div className="flex justify-center">
                              <AssignmentStatusChip status={aRec.status} />
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {rRec ? (
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${rRec.done ? "bg-green-50 text-green-700 border border-green-200" : "bg-rose-50 text-rose-600 border border-rose-200"}`}>
                              {rRec.done ? <CheckSquare size={11} /> : <Square size={11} />}
                              {rRec.done ? "Done" : "Pending"}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                    
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* navigation to session-level pages handled by parent */}
        </div>
      );
    }

// ─── Grades View ──────────────────────────────────────────────────────────────

function GradesView({ course, onBack }: { course: Course; onBack: () => void }) {
  const gradedRecords = course.studentAssignments.filter((r) => r.status === "graded");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} title="Back" className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground flex-shrink-0">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="font-bold text-foreground">Grades</h2>
          <p className="text-xs text-muted-foreground">{course.name}</p>
        </div>
      </div>

      {gradedRecords.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center gap-3 text-center">
          <Star size={32} className="text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No grades recorded yet.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="bg-muted/60 border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide sticky left-0 bg-muted/60 min-w-[140px]">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide min-w-[180px]">Assignment</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide min-w-[200px]">Feedback</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">Graded On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {gradedRecords.map((rec) => {
                  const student = course.students.find((s) => s.id === rec.studentId);
                  const assignment = course.assignments.find((a) => a.id === rec.assignmentId);
                  if (!student || !assignment) return null;
                  const pct = rec.score ?? 0;
                  const scoreColor = pct >= 80 ? "text-green-600" : pct >= 60 ? "text-amber-600" : "text-rose-600";
                  return (
                    <tr key={`${rec.studentId}-${rec.assignmentId}`} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 sticky left-0 bg-card">
                        <div className="flex items-center gap-2">
                          <Avatar initials={student.avatar} size="sm" />
                          <span className="font-semibold text-foreground whitespace-nowrap">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground">{assignment.title}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-extrabold font-mono text-lg ${scoreColor}`}>{rec.score}</span>
                        <span className="text-muted-foreground text-xs">/100</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs italic max-w-[200px] truncate">{rec.feedback ?? "—"}</td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">{rec.gradedAt ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Session Matrix View (students as columns, rows = Attendance/Assignment/Report) ──

function SessionMatrixView({
  course, onUpdate,
}: {
  course: Course;
  onUpdate: (updates: Partial<Course>) => void;
}) {
  const [index, setIndex] = useState(0);
  const sessions = course.sessions;
  const session = sessions[index];

  const attendance = getAttendanceRecords(course);
  const sessionAssignments = getSessionAssignmentRecords(course);
  const sessionReports = getSessionReportRecords(course);

  const [assignDetail, setAssignDetail] = useState<{
    student: Student;
    assignment: Assignment;
    record: StudentSessionAssignment;
  } | null>(null);

  const [reportDetail, setReportDetail] = useState<{
    student: Student;
    report: Report;
    record: StudentSessionReport;
  } | null>(null);

  const toggleAttendance = (studentId: string) => {
    if (!session) return;
    const updated = getAttendanceRecords(course).map((r) =>
      r.studentId === studentId && r.sessionId === session.id ? { ...r, present: !r.present } : r
    );
    onUpdate({ attendance: updated });
  };

  const handleAssignUpdate = (updated: StudentAssignment | StudentSessionAssignment) => {
    const sessionRecord = updated as StudentSessionAssignment;
    const newRecords = getSessionAssignmentRecords(course).map((r) =>
      r.studentId === sessionRecord.studentId && r.sessionId === sessionRecord.sessionId ? sessionRecord : r
    );
    onUpdate({ sessionAssignments: newRecords });
    setAssignDetail(null);
  };

  const handleReportUpdate = (updated: StudentReport | StudentSessionReport) => {
    const sessionRecord = updated as StudentSessionReport;
    const newRecords = getSessionReportRecords(course).map((r) =>
      r.studentId === sessionRecord.studentId && r.sessionId === sessionRecord.sessionId ? sessionRecord : r
    );
    onUpdate({ sessionReports: newRecords });
    setReportDetail(null);
  };

  if (!session) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center">
        <p className="text-sm text-muted-foreground">No sessions available for this course.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-foreground">Session {session.number}</h3>
          <p className="text-xs text-muted-foreground">{session.date}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIndex((i) => Math.max(0, i - 1))} title="Previous session" disabled={index === 0}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40">
            <ChevronLeft size={18} />
          </button>
          <div className="text-xs text-muted-foreground">{index + 1} / {sessions.length}</div>
          <button onClick={() => setIndex((i) => Math.min(sessions.length - 1, i + 1))} title="Next session" disabled={index === sessions.length - 1}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-auto">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide sticky left-0 bg-muted/60">Metric</th>
              {course.students.map((st) => (
                <th key={st.id} className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wide min-w-[110px]">
                  <div className="flex items-center gap-2 justify-center">
                    <Avatar initials={st.avatar} size="sm" />
                    <span className="text-[12px] font-semibold max-w-[90px] truncate">{st.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {/* Attendance row */}
            <tr className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 font-semibold text-foreground">Attendance</td>
              {course.students.map((st) => {
                const att = attendance.find((r) => r.studentId === st.id && r.sessionId === session.id);
                const present = att?.present ?? false;
                return (
                  <td key={st.id} className="px-3 py-3 text-center">
                      <button
                      type="button"
                      onClick={() => toggleAttendance(st.id)}
                      title={present ? "Mark absent" : "Mark present"}
                      className={`mx-auto flex h-7 w-14 items-center rounded-full p-1 transition-colors ${present ? "bg-green-500" : "bg-slate-300"}`}
                    >
                      <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${present ? "translate-x-7" : "translate-x-0"}`} />
                    </button>
                    <p className={`mt-1 text-[10px] font-semibold ${present ? "text-green-600" : "text-slate-500"}`}>{present ? "Present" : "Absent"}</p>
                  </td>
                );
              })}
            </tr>

            {/* Assignment row */}
            <tr className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 font-semibold text-foreground">Assignment</td>
              {course.students.map((st) => {
                const aRec = sessionAssignments.find((r) => r.studentId === st.id && r.sessionId === session.id);
                return (
                  <td key={st.id} className="px-3 py-3 text-center">
                    {aRec ? (
                      <AssignmentStatusChip status={aRec.status} onClick={() => setAssignDetail({ student: st, assignment: makeSessionAssignment(session), record: aRec })} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Report row */}
            <tr className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 font-semibold text-foreground">Report</td>
              {course.students.map((st) => {
                const rRec = sessionReports.find((r) => r.studentId === st.id && r.sessionId === session.id);
                return (
                  <td key={st.id} className="px-3 py-3 text-center">
                    {rRec ? (
                      <button onClick={() => setReportDetail({ student: st, report: makeSessionReport(session), record: rRec })}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:opacity-80 ${rRec.done ? "bg-green-50 text-green-700 border border-green-200" : "bg-rose-50 text-rose-600 border border-rose-200"}`}>
                        {rRec.done ? <CheckSquare size={11} /> : <Square size={11} />}
                        {rRec.done ? "Done" : "Pending"}
                      </button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {assignDetail && (
        <AssignmentDetailModal student={assignDetail.student} assignment={assignDetail.assignment} record={assignDetail.record} onClose={() => setAssignDetail(null)} onUpdate={handleAssignUpdate} />
      )}

      {reportDetail && (
        <ReportDetailModal student={reportDetail.student} report={reportDetail.report} record={reportDetail.record} onClose={() => setReportDetail(null)} onUpdate={handleReportUpdate} />
      )}
    </div>
  );
}

// ─── Invoice View ─────────────────────────────────────────────────────────────

function InvoiceView({
  course, courses, setCourses, onBack,
}: {
  course: Course; courses: Course[]; setCourses: (c: Course[]) => void; onBack: () => void;
}) {
  const pct = calcCompletion(course);
  const rate = RATE[course.locationType];
  const completedSessions = course.sessions.filter((s) => s.attended);
  const totalEarning = calcTotalEarning(course);
  const advanceAmount = calcAdvanceAmount(course);
  const remainingAfterAdvance = totalEarning - course.advancePaidAmount;
  const [claimType, setClaimType] = useState<"full" | "advance" | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [requestAmount, setRequestAmount] = useState("");
  const [advanceReason, setAdvanceReason] = useState("");
  const [requestFeedback, setRequestFeedback] = useState<"success" | "error" | null>(null);
  const totalHrs = completedSessions.reduce((s, x) => s + x.duration, 0);
  const defaultRequestAmount = claimType === "advance" ? advanceAmount : remainingAfterAdvance;
  const parsedRequestAmount = Number(requestAmount);
  const requestedAmount = Number.isFinite(parsedRequestAmount) && parsedRequestAmount > 0 ? parsedRequestAmount : defaultRequestAmount;
  const canSubmitRequest = Boolean(
    claimType &&
    selectedFile &&
    requestedAmount > 0 &&
    (claimType === "full" || advanceReason.trim())
  );

  const openRequestDialog = () => {
    setShowRequestDialog(true);
    setClaimType(null);
    setRequestAmount("");
    setAdvanceReason("");
    setRequestFeedback(null);
    removeSelectedFile();
  };

  const openRequestForm = (type: "advance" | "full") => {
    setClaimType(type);
    setRequestAmount(String(type === "advance" ? advanceAmount : remainingAfterAdvance));
    setAdvanceReason("");
    setRequestFeedback(null);
    removeSelectedFile();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setSelectedFile(f);
    setSelectedFileUrl(url);
    setSelectedFileName(f.name);
  };

  const removeSelectedFile = () => {
    if (selectedFileUrl) {
      try { URL.revokeObjectURL(selectedFileUrl); } catch (e) { /**/ }
    }
    setSelectedFile(null);
    setSelectedFileUrl(null);
    setSelectedFileName(null);
  };

  const removeInvoice = () => {
    if (course.invoice?.fileUrl) {
      try { URL.revokeObjectURL(course.invoice.fileUrl); } catch (e) { /**/ }
    }
    const updated = courses.map((c) => c.id === course.id ? { ...c, invoice: undefined } : c);
    setCourses(updated);
  };

  const confirmClaim = () => {
    if (!canSubmitRequest) {
      setRequestFeedback("error");
      return;
    }
    const updated = courses.map((c) => {
      if (c.id !== course.id) return c;
      const base = claimType === "advance" ? { ...c, claimStatus: "advance_claimed" as ClaimStatus, advancePaidAmount: requestedAmount } : { ...c, claimStatus: "full_claimed" as ClaimStatus };
      if (selectedFile && selectedFileUrl) {
        return { ...base, invoice: { fileName: selectedFileName ?? selectedFile.name, fileUrl: selectedFileUrl, uploadedAt: new Date().toISOString() } };
      }
      return base;
    });
    setCourses(updated);
    setShowConfirm(false);
    setShowRequestDialog(false);
    setRequestFeedback("success");
    // clear selection after submit
    setSelectedFile(null);
    setSelectedFileUrl(null);
    setSelectedFileName(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} title="Back" className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground flex-shrink-0">
            <ChevronLeft size={20} />
          </button>
          <div className="min-w-0">
            <h2 className="font-bold text-foreground">Unofficial Invoice</h2>
            <p className="text-xs text-muted-foreground truncate">{course.name}</p>
          </div>
        </div>
      </div>

      {/* Invoice header card */}
      {false && (
      <div className="bg-[#25476a] rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] font-semibold opacity-50 uppercase tracking-widest">Digifunzi · Mentor Invoice</p>
            <p className="text-lg font-bold mt-1 leading-tight">{course.name}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <LocationIcon type={course.locationType} />
              <span className="text-xs opacity-60">{course.locationName}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] opacity-50">Rate / session</p>
            <p className="text-2xl font-extrabold font-mono">KSh {rate.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 bg-white/10 rounded-xl p-4">
          {[
            { label: "Sessions", val: `${completedSessions.length}/${course.totalSessions}` },
            { label: "Total Hours", val: `${totalHrs}h` },
            { label: "Completion", val: `${pct}%` },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[10px] opacity-50 uppercase tracking-wide">{item.label}</p>
              <p className="font-bold font-mono text-base mt-0.5" style={{ color: item.label === "Completion" ? (pct >= 100 ? "#86efac" : "#fcd34d") : "white" }}>
                {item.val}
              </p>
            </div>
          ))}
        </div>
      </div>

      )}

      {/* Session table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">Description</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wide">Session</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wide">Duration</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody>
              {completedSessions.map((sess) => (
                <tr key={sess.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{course.name}</td>
                  <td className="px-4 py-3 text-center font-semibold text-[#38aae1]">Session {sess.number}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{sess.duration}h</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">KSh {rate.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#25476a]/5">
                <td colSpan={2} className="px-4 py-3 text-sm font-bold text-muted-foreground">Total</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-muted-foreground">{totalHrs}h</td>
                <td className="px-4 py-3 text-right font-mono text-base font-extrabold text-[#25476a]">KSh {totalEarning.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="hidden px-4 py-3 border-b border-border bg-muted/40 grid-cols-4 text-xs font-bold text-muted-foreground uppercase tracking-wide">
          <span className="col-span-2">Description</span>
          <span className="text-right">Duration</span>
          <span className="text-right">Amount</span>
        </div>
        <div className="hidden divide-y divide-border max-h-56 overflow-y-auto">
          {completedSessions.map((sess) => (
            <div key={sess.id} className="px-4 py-2.5 grid grid-cols-4 text-sm">
              <span className="col-span-2 text-foreground font-medium">
                {course.name} <span className="text-[#38aae1] font-semibold">· Session {sess.number}</span>
              </span>
              <span className="text-right font-mono text-muted-foreground">{sess.duration}h</span>
              <span className="text-right font-mono font-semibold text-foreground">KSh {rate.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="hidden px-4 py-3 bg-[#25476a]/5 border-t border-border items-center justify-between">
          <span className="text-sm font-bold text-muted-foreground">Total · {totalHrs}h</span>
          <span className="font-extrabold font-mono text-[#25476a] text-base">KSh {totalEarning.toLocaleString()}</span>
        </div>
      </div>

      {/* Advance info */}
      {course.advancePaidAmount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
          <span className="text-amber-700 font-semibold">Advance paid</span>
          <span className="font-bold font-mono text-amber-700">KSh {course.advancePaidAmount.toLocaleString()}</span>
        </div>
      )}

      {/* Claim section */}
      {false && (
      <>
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">Payment Claim</h3>
        {course.claimStatus === "approved" && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
            <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm text-green-700">Payment Approved</p>
              <p className="text-xs mt-0.5 text-green-600">KSh {totalEarning.toLocaleString()} — fully paid</p>
            </div>
          </div>
        )}
        {course.claimStatus === "denied" && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <XCircle size={18} className="text-red-600 flex-shrink-0" />
            <p className="font-bold text-sm text-red-700">Denied — contact your coordinator</p>
          </div>
        )}
        {course.claimStatus === "advance_claimed" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm text-amber-700">Advance submitted</p>
                <p className="text-xs mt-0.5 text-amber-600">KSh {course.advancePaidAmount.toLocaleString()} awaiting approval</p>
              </div>
            </div>
            {pct >= 100 && (
              <button onClick={() => { setClaimType("full"); setShowConfirm(true); }}
                className="w-full bg-[#25476a] text-white py-3 rounded-xl font-bold hover:bg-[#1a3452] transition-colors text-sm">
                Claim Remaining — KSh {remainingAfterAdvance.toLocaleString()}
              </button>
            )}
          </div>
        )}
        {course.claimStatus === "full_claimed" && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <Receipt size={18} className="text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm text-blue-700">Full payment submitted</p>
              <p className="text-xs mt-0.5 text-blue-600">Awaiting coordinator approval</p>
            </div>
          </div>
        )}
        {course.claimStatus === "not_requested" && (
          <div className="flex flex-col gap-3">
            {pct < 50 && (
              <div className="bg-muted rounded-xl p-4 text-center">
                <p className="text-sm text-muted-foreground">Reach <strong>50% completion</strong> to unlock advance payment.</p>
                <div className="mt-3">
                  <ProgressBar pct={pct} color="#38aae1" />
                  <p className="text-xs text-muted-foreground mt-1">{pct}% / 50% required</p>
                </div>
              </div>
            )}
            {pct >= 50 && pct < 100 && (
              <button onClick={() => { setClaimType("advance"); setShowConfirm(true); }}
                className="w-full bg-[#feb139] text-[#12253a] py-3 rounded-xl font-bold hover:bg-amber-400 transition-colors text-sm">
                Claim Advance (30%) — KSh {advanceAmount.toLocaleString()}
              </button>
            )}
            {pct >= 100 && (
              <button onClick={() => { setClaimType("full"); setShowConfirm(true); }}
                className="w-full bg-[#25476a] text-white py-3 rounded-xl font-bold hover:bg-[#1a3452] transition-colors text-sm">
                Claim Full Payment — KSh {totalEarning.toLocaleString()}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">Request Payment</h3>

        {/* ETIMS upload */}
        <div className="mb-4">
          <label htmlFor="etims-upload" className="text-xs font-semibold text-muted-foreground">Upload ETIMS Invoice</label>
          <div className="mt-2 flex items-center gap-3">
            <input id="etims-upload" type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={handleFileChange} />
            {selectedFileName ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate max-w-[260px]">{selectedFileName}</span>
                <button onClick={removeSelectedFile} title="Remove file" className="text-sm text-rose-600 hover:underline">Remove</button>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">No file attached</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Attach the ETIMS document to submit with your payment request. Accepted: PDF, DOC, images.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => { setClaimType("advance"); setShowConfirm(true); }}
            disabled={!canClaimAdvance(course) || !selectedFile}
            className="rounded-xl bg-[#feb139] px-4 py-3 text-sm font-bold text-[#12253a] transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Request Advance - KSh {advanceAmount.toLocaleString()}
          </button>
          <button
            onClick={() => { setClaimType("full"); setShowConfirm(true); }}
            disabled={!canClaimFull(course) || !selectedFile}
            className="rounded-xl bg-[#25476a] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1a3452] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Request Full Payment - KSh {remainingAfterAdvance.toLocaleString()}
          </button>
        </div>

        {course.invoice && (
          <div className="mt-4 bg-muted rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText size={18} />
              <div>
                <p className="font-semibold text-sm">{course.invoice.fileName}</p>
                <p className="text-xs text-muted-foreground">Uploaded: {course.invoice.uploadedAt ? new Date(course.invoice.uploadedAt).toLocaleString() : "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href={course.invoice.fileUrl} download className="inline-flex items-center gap-2 bg-white rounded-xl px-3 py-2 text-sm font-semibold">
                <Download size={14} /> Download
              </a>
              <button onClick={removeInvoice} className="px-3 py-2 rounded-xl border border-border text-sm">Remove</button>
            </div>
          </div>
        )}
      </div>

      </>
      )}

      {false && (
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-extrabold text-foreground leading-tight">Payment Request</h3>
            <p className="text-xs text-muted-foreground mt-1.5">
              {completedSessions.length}/{course.totalSessions} sessions complete · {pct}% completion
            </p>
          </div>
          <StatusBadge status={course.claimStatus} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => openRequestForm("advance")}
            disabled={!canClaimAdvance(course)}
            className="rounded-xl bg-[#feb139] px-4 py-3 text-sm font-bold text-[#12253a] transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Request Advance
          </button>
          <button
            onClick={() => openRequestForm("full")}
            disabled={!canClaimFull(course)}
            className="rounded-xl bg-[#25476a] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1a3452] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Request Full Payment
          </button>
        </div>

        {claimType && (
          <div className="border border-[#38aae1]/20 bg-[#f8fbfe] rounded-xl p-4 flex flex-col gap-4 shadow-sm">
            <div>
              <p className="text-sm font-bold text-foreground">
                {claimType === "advance" ? "Advance Request" : "Full Payment Request"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Upload ETIMS document and confirm the amount.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
                ETIMS Document
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileChange} className="text-sm font-normal" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
                Amount
                <input
                  type="number"
                  min="1"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#38aae1]/40"
                />
              </label>
            </div>

            {claimType === "advance" && (
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
                Advance Reason
                <textarea
                  value={advanceReason}
                  onChange={(e) => setAdvanceReason(e.target.value)}
                  rows={3}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#38aae1]/40"
                />
              </label>
            )}

            {selectedFileName && (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2">
                <span className="truncate text-sm font-medium">{selectedFileName}</span>
                <button onClick={removeSelectedFile} className="text-sm font-semibold text-rose-600">Remove</button>
              </div>
            )}

            <button
              onClick={() => setShowConfirm(true)}
              disabled={!canSubmitRequest}
              className="self-start rounded-xl bg-[#25476a] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1a3452] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Submit Request
            </button>
          </div>
        )}

        {requestFeedback === "success" && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            <CheckCircle2 size={16} />
            Payment request submitted for review.
          </div>
        )}
        {requestFeedback === "error" && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <AlertCircle size={16} />
            Add the required document, amount, and reason before submitting.
          </div>
        )}

        {course.invoice && (
          <div className="bg-muted rounded-lg p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <FileText size={18} className="flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{course.invoice.fileName}</p>
                <p className="text-xs text-muted-foreground">Uploaded: {course.invoice.uploadedAt ? new Date(course.invoice.uploadedAt).toLocaleString() : "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <a href={course.invoice.fileUrl} download className="inline-flex items-center gap-2 bg-white rounded-xl px-3 py-2 text-sm font-semibold">
                <Download size={14} /> Download
              </a>
              <button onClick={removeInvoice} className="px-3 py-2 rounded-xl border border-border text-sm">Remove</button>
            </div>
          </div>
        )}
      </div>
      )}

      {(requestFeedback || course.invoice) && (
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
          {requestFeedback === "success" && (
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
              <CheckCircle2 size={16} />
              Payment request submitted for review.
            </div>
          )}
          {requestFeedback === "error" && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              <AlertCircle size={16} />
              Add the required document, amount, and reason before submitting.
            </div>
          )}
          {course.invoice && (
            <div className="bg-muted rounded-lg p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={18} className="flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{course.invoice.fileName}</p>
                  <p className="text-xs text-muted-foreground">Uploaded: {course.invoice.uploadedAt ? new Date(course.invoice.uploadedAt).toLocaleString() : "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a href={course.invoice.fileUrl} download className="inline-flex items-center gap-2 bg-white rounded-xl px-3 py-2 text-sm font-semibold">
                  <Download size={14} /> Download
                </a>
                <button onClick={removeInvoice} className="px-3 py-2 rounded-xl border border-border text-sm">Remove</button>
              </div>
            </div>
          )}
        </div>
      )}

      {showRequestDialog && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={() => setShowRequestDialog(false)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#e8f0f7] p-2 text-[#25476a]">
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-foreground">Upload invoice</h3>
                  <p className="text-xs text-muted-foreground">{course.name}</p>
                </div>
              </div>
              <button onClick={() => setShowRequestDialog(false)} title="Close" className="rounded-xl p-2 text-muted-foreground hover:bg-muted">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 p-5 lg:grid-cols-[300px_1fr]">
              <div className="rounded-xl border border-[#38aae1]/20 bg-cyan-50 p-4">
                <div className="mb-5">
                  <p className="text-sm font-extrabold text-foreground">{completedSessions.length}/{course.totalSessions} Sessions</p>
                  <p className="text-xs text-muted-foreground">{course.name}</p>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Estimated Earnings</span>
                    <span className="font-extrabold text-[#25476a]">KSh {totalEarning.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Amount Advanced</span>
                    <span className="font-extrabold text-[#25476a]">KSh {course.advancePaidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Amount Claimed</span>
                    <span className="font-extrabold text-[#25476a]">
                      KSh {(course.claimStatus === "full_claimed" ? totalEarning : course.advancePaidAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="mt-6 grid gap-2">
                  <button
                    onClick={() => openRequestForm("advance")}
                    disabled={!canClaimAdvance(course)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-[#f8fbfe] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Download size={14} />
                    Request advance
                  </button>
                  <button
                    onClick={() => openRequestForm("full")}
                    disabled={!canClaimFull(course)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-[#f8fbfe] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Download size={14} />
                    Request Payment
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-white p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-foreground">Activities</h4>
                  <ChevronRight size={16} className="rotate-90 text-muted-foreground" />
                </div>
                <div className="mt-4 rounded-lg border border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  {claimType ? `${claimType === "advance" ? "Advance" : "Full payment"} request in progress` : "No activity yet"}
                </div>
              </div>
            </div>

            {claimType && (
              <div className="border-t border-border p-5">
                <h4 className="font-extrabold text-foreground">
                  {claimType === "advance" ? "Advance request" : "Full payment request"}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">Provide the required details and upload the invoice document.</p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
                      {claimType === "advance" ? "Advance amount" : "Payment amount"}
                      <input
                        type="number"
                        min="1"
                        value={requestAmount}
                        onChange={(e) => setRequestAmount(e.target.value)}
                        className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#38aae1]/40"
                      />
                    </label>
                    {claimType === "advance" && (
                      <label className="mt-4 flex flex-col gap-1.5 text-sm font-semibold text-foreground">
                        Advance reason
                        <input
                          value={advanceReason}
                          onChange={(e) => setAdvanceReason(e.target.value)}
                          placeholder="Advance reason"
                          className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#38aae1]/40"
                        />
                      </label>
                    )}
                  </div>
                  <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#38aae1]/50 bg-white p-5 text-center transition-colors hover:bg-[#f8fbfe]">
                    <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileChange} className="sr-only" />
                    <Download size={28} className="text-[#38aae1]" />
                    <span className="mt-3 text-sm font-semibold text-foreground">Click or drag file to this area to upload</span>
                    <span className="mt-1 text-xs text-muted-foreground">Accepted: PDF, DOC, images.</span>
                    {selectedFileName && (
                      <span className="mt-3 max-w-full truncate rounded-lg bg-muted px-3 py-1 text-xs font-semibold text-foreground">{selectedFileName}</span>
                    )}
                  </label>
                </div>

                {requestFeedback === "error" && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    <AlertCircle size={16} />
                    Add the required document, amount, and reason before submitting.
                  </div>
                )}

                <div className="mt-5 flex justify-end gap-3">
                  <button onClick={() => setShowRequestDialog(false)}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowConfirm(true)}
                    disabled={!canSubmitRequest}
                    className="rounded-xl bg-[#25476a] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1a3452] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {claimType === "advance" ? "Request advance" : "Request payment"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-card rounded-2xl shadow-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-foreground text-base mb-2">
              Confirm {claimType === "advance" ? "Advance" : "Full"} Payment Claim
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              {claimType === "advance"
                ? `Requesting KSh ${requestedAmount.toLocaleString()} advance for ${course.name}. This will be reviewed by your coordinator.`
                : `Requesting full payment of KSh ${requestedAmount.toLocaleString()} for ${course.name}.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-semibold hover:bg-muted transition-colors text-sm">
                Cancel
              </button>
              <button onClick={confirmClaim}
                className="flex-1 py-2.5 rounded-xl bg-[#25476a] text-white font-semibold hover:bg-[#1a3452] transition-colors text-sm">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Module Tile ──────────────────────────────────────────────────────────────

function PaymentRequestView({
  course, courses, setCourses, onBack,
}: {
  course: Course; courses: Course[]; setCourses: (c: Course[]) => void; onBack: () => void;
}) {
  const totalEarning = calcTotalEarning(course);
  const advanceAmount = calcAdvanceAmount(course);
  const remainingAfterAdvance = Math.max(totalEarning - course.advancePaidAmount, 0);
  const hasAdvanceRequest = course.advancePaidAmount > 0;
  const [claimType, setClaimType] = useState<PaymentActivityType | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [requestAmount, setRequestAmount] = useState("");
  const [advanceReason, setAdvanceReason] = useState("");
  const [requestFeedback, setRequestFeedback] = useState<"success" | "error" | null>(null);

  const defaultRequestAmount = claimType === "advance" ? advanceAmount : remainingAfterAdvance;
  const parsedRequestAmount = Number(requestAmount);
  const requestedAmount = Number.isFinite(parsedRequestAmount) && parsedRequestAmount > 0 ? parsedRequestAmount : defaultRequestAmount;
  const canSubmitRequest = Boolean(claimType && selectedFile && requestedAmount > 0 && (claimType === "full" || advanceReason.trim()));

  const removeSelectedFile = () => {
    if (selectedFileUrl) {
      try { URL.revokeObjectURL(selectedFileUrl); } catch (e) { /**/ }
    }
    setSelectedFile(null);
    setSelectedFileUrl(null);
    setSelectedFileName(null);
  };

  const openRequestForm = (type: PaymentActivityType) => {
    setClaimType(type);
    setRequestAmount(String(type === "advance" ? advanceAmount : remainingAfterAdvance));
    setAdvanceReason("");
    setRequestFeedback(null);
    removeSelectedFile();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      removeSelectedFile();
      setRequestFeedback("error");
      e.target.value = "";
      return;
    }
    setRequestFeedback(null);
    if (selectedFileUrl) {
      try { URL.revokeObjectURL(selectedFileUrl); } catch (e) { /**/ }
    }
    const url = URL.createObjectURL(f);
    setSelectedFile(f);
    setSelectedFileUrl(url);
    setSelectedFileName(f.name);
  };

  const confirmClaim = () => {
    if (!canSubmitRequest || !claimType) {
      setRequestFeedback("error");
      return;
    }

    const now = new Date().toISOString();
    const updated = courses.map((c) => {
      if (c.id !== course.id) return c;
      const existingActivities = c.paymentActivities ?? getPaymentActivities(c);
      const activity: PaymentActivity = {
        id: `${c.id}-${claimType}-${now}`,
        type: claimType,
        amount: requestedAmount,
        status: "requested",
        requestedAt: now,
        note: claimType === "advance" ? advanceReason.trim() : hasAdvanceRequest ? "Remaining course payment" : "Full course payment",
        invoiceFileName: selectedFileName ?? selectedFile?.name,
      };
      const base = claimType === "advance"
        ? { ...c, claimStatus: "advance_claimed" as ClaimStatus, advancePaidAmount: requestedAmount }
        : { ...c, claimStatus: "full_claimed" as ClaimStatus };
      return {
        ...base,
        paymentActivities: [...existingActivities, activity],
        invoice: selectedFile && selectedFileUrl
          ? { fileName: selectedFileName ?? selectedFile.name, fileUrl: selectedFileUrl, uploadedAt: now }
          : c.invoice,
      };
    });

    setCourses(updated);
    setShowConfirm(false);
    setClaimType(null);
    setRequestFeedback("success");
    setSelectedFile(null);
    setSelectedFileUrl(null);
    setSelectedFileName(null);
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} title="Close" className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground flex-shrink-0">
          <X size={20} />
        </button>
        <div className="min-w-0">
          <h2 className="font-bold text-foreground">Request Payment</h2>
          <p className="text-xs text-muted-foreground truncate">{course.name}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-[#f8fbfe] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Estimated earnings</p>
            <p className="mt-1 font-mono text-lg font-extrabold text-[#25476a]">KSh {totalEarning.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700/80">Amount advanced</p>
            <p className="mt-1 font-mono text-lg font-extrabold text-amber-800">KSh {advanceAmount.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-[#25476a]/20 bg-white px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Amount claimed</p>
            <p className="mt-1 font-mono text-lg font-extrabold text-[#25476a]">
              {claimType ? `KSh ${requestedAmount.toLocaleString()}` : "Select request"}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => openRequestForm("advance")}
            disabled={!canClaimAdvance(course)}
            className={`rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${claimType === "advance" ? "border-[#25476a] bg-[#f8fbfe] ring-2 ring-[#25476a]/10" : "border-border bg-white hover:bg-[#f8fbfe]"}`}
          >
            <div className="flex items-center gap-2">
              <Receipt size={16} className="text-[#25476a]" />
              <span className="text-sm font-extrabold text-foreground">Advance request</span>
            </div>
            <p className="mt-2 font-mono text-sm font-extrabold text-[#25476a]">KSh {advanceAmount.toLocaleString()}</p>
          </button>

          <button
            type="button"
            onClick={() => openRequestForm("full")}
            disabled={!canClaimFull(course)}
            className={`rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${claimType === "full" ? "border-[#25476a] bg-[#f8fbfe] ring-2 ring-[#25476a]/10" : "border-border bg-white hover:bg-[#f8fbfe]"}`}
          >
            <div className="flex items-center gap-2">
              <Receipt size={16} className="text-[#25476a]" />
              <span className="text-sm font-extrabold text-foreground">Request payment</span>
            </div>
            <p className="mt-2 font-mono text-sm font-extrabold text-[#25476a]">KSh {(hasAdvanceRequest ? remainingAfterAdvance : totalEarning).toLocaleString()}</p>
          </button>
        </div>

        {claimType && (
          <div className="mt-4 rounded-xl border border-border bg-white p-4">
            <h3 className="font-extrabold text-foreground">{claimType === "advance" ? "Advance request" : "Payment request"}</h3>
            <p className="mt-1 text-xs text-muted-foreground">Upload a PDF invoice before submitting.</p>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="flex flex-col gap-4">
                {claimType === "advance" ? (
                  <>
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
                      Advance amount
                      <input type="number" min="1" value={requestAmount} onChange={(e) => setRequestAmount(e.target.value)}
                        className="min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#38aae1]/40" />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
                      Advance reason
                      <input value={advanceReason} onChange={(e) => setAdvanceReason(e.target.value)} placeholder="Advance reason"
                        className="min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#38aae1]/40" />
                    </label>
                  </>
                ) : (
                  <div className="grid gap-3">
                    <div className="rounded-xl border border-border bg-[#f8fbfe] px-4 py-3">
                      <p className="text-xs font-semibold text-muted-foreground">Full amount</p>
                      <p className="mt-1 font-mono text-lg font-extrabold text-[#25476a]">KSh {totalEarning.toLocaleString()}</p>
                    </div>
                    {hasAdvanceRequest && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-xs font-semibold text-amber-700/80">Balance after advance claim</p>
                        <p className="mt-1 font-mono text-lg font-extrabold text-amber-800">KSh {remainingAfterAdvance.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#38aae1]/50 bg-[#f8fbfe] p-4 text-center transition-colors hover:bg-white">
                <input type="file" accept=".pdf,application/pdf" onChange={handleFileChange} className="sr-only" />
                <Download size={26} className="text-[#38aae1]" />
                <span className="mt-2 text-sm font-semibold text-foreground">Upload PDF invoice</span>
                <span className="mt-1 text-xs text-muted-foreground">PDF only.</span>
                {selectedFileName && <span className="mt-3 max-w-full truncate rounded-lg bg-muted px-3 py-1 text-xs font-semibold text-foreground">{selectedFileName}</span>}
              </label>
            </div>

            {requestFeedback === "error" && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                Add the required amount, reason where needed, and a PDF invoice before submitting.
              </div>
            )}

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button onClick={() => setClaimType(null)} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
                Cancel
              </button>
              <button onClick={() => setShowConfirm(true)} disabled={!canSubmitRequest}
                className="rounded-xl bg-[#25476a] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1a3452] disabled:cursor-not-allowed disabled:opacity-40">
                {claimType === "advance" ? "Submit advance request" : "Submit payment request"}
              </button>
            </div>
          </div>
        )}
      </div>

      {requestFeedback === "success" && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          <CheckCircle2 size={16} />
          Payment request added to this course history.
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-card rounded-2xl shadow-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-foreground text-base mb-2">Confirm {claimType === "advance" ? "Advance" : "Full"} Payment Claim</h3>
            <p className="text-sm text-muted-foreground mb-5">
              {claimType === "advance"
                ? `Requesting KSh ${requestedAmount.toLocaleString()} advance for ${course.name}.`
                : `Requesting remaining payment of KSh ${requestedAmount.toLocaleString()} for ${course.name}.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-semibold hover:bg-muted transition-colors text-sm">Cancel</button>
              <button onClick={confirmClaim} className="flex-1 py-2.5 rounded-xl bg-[#25476a] text-white font-semibold hover:bg-[#1a3452] transition-colors text-sm">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleTile({ icon, label, badge, badgeColor = "bg-[#25476a]", onClick }: {
  icon: React.ReactNode; label: string; badge?: string; badgeColor?: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="group bg-card border border-border rounded-2xl p-4 sm:p-5 flex flex-col items-center gap-2 sm:gap-3 hover:shadow-md hover:border-[#38aae1]/40 transition-all duration-200 text-center w-full">
      <div className="bg-[#e8f0f7] text-[#25476a] rounded-xl p-3 sm:p-4 group-hover:bg-[#25476a] group-hover:text-white transition-colors duration-200">
        {icon}
      </div>
      <span className="text-xs sm:text-sm font-bold text-foreground">{label}</span>
      {badge && (
        <span className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full text-white ${badgeColor} leading-tight`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function UnofficialInvoicePreview({ course }: { course: Course }) {
  const rate = RATE[course.locationType];
  const completedSessions = course.sessions.filter((s) => s.attended);
  const totalEarning = calcTotalEarning(course);
  const totalHrs = completedSessions.reduce((sum, session) => sum + session.duration, 0);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border bg-[#f8fbfe] px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Digifunzi Mentor Invoice</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-foreground">{course.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <LocationIcon type={course.locationType} />
              <span className="truncate text-xs text-muted-foreground">{course.locationName}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold text-muted-foreground">Rate / session</p>
            <p className="font-mono text-base font-extrabold text-[#25476a]">KSh {rate.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="bg-muted/40">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">Description</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">Session</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">Duration</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {completedSessions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">No completed sessions yet.</td>
              </tr>
            ) : (
              completedSessions.map((session) => (
                <tr key={session.id}>
                  <td className="px-4 py-3 font-medium text-foreground">{course.name}</td>
                  <td className="px-4 py-3 text-center font-semibold text-[#38aae1]">Session {session.number}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{session.duration}h</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">KSh {rate.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-[#25476a]/5">
              <td colSpan={2} className="px-4 py-3 text-sm font-bold text-muted-foreground">Total</td>
              <td className="px-4 py-3 text-right font-mono font-bold text-muted-foreground">{totalHrs}h</td>
              <td className="px-4 py-3 text-right font-mono text-base font-extrabold text-[#25476a]">KSh {totalEarning.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

    </div>
  );
}

// ─── Course Detail ────────────────────────────────────────────────────────────

type SubView = "attendance" | "assignments" | "grades" | "reports" | "session" | "sessionAssignment" | "sessionReport";

function CourseDetail({
  course, courses, setCourses, onBack,
}: {
  course: Course; courses: Course[]; setCourses: (c: Course[]) => void; onBack: () => void;
}) {
  const [subView, setSubView] = useState<SubView | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(course.sessions?.[0]?.id ?? null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const updateCourse = (updates: Partial<Course>) => {
    setCourses(courses.map((c) => c.id === course.id ? { ...c, ...updates } : c));
  };

  const pct = calcCompletion(course);
  const amountPayable = calcTotalEarning(course);
  const advancePayable = calcAdvanceAmount(course);
  const sessionAssignments = getSessionAssignmentRecords(course);
  const sessionReports = getSessionReportRecords(course);

  const openSessionAssignment = (sessionId: string) => { setActiveSessionId(sessionId); setSubView("sessionAssignment"); };
  const openSessionReport = (sessionId: string) => { setActiveSessionId(sessionId); setSubView("sessionReport"); };
  const changeActiveSessionByOffset = (offset: number) => {
    if (!activeSessionId) return;
    const idx = course.sessions.findIndex((s) => s.id === activeSessionId);
    const newIdx = Math.max(0, Math.min(course.sessions.length - 1, idx + offset));
    setActiveSessionId(course.sessions[newIdx].id);
  };

  if (subView === "attendance") return <AttendanceView course={course} onUpdate={updateCourse} onBack={() => setSubView(null)} />;
  if (subView === "assignments") return <AssignmentsView course={course} onUpdate={updateCourse} onBack={() => setSubView(null)} />;
  if (subView === "session") return <SessionOverviewView course={course} onUpdate={updateCourse} onBack={() => setSubView(null)} onOpenSessionAssignment={openSessionAssignment} onOpenSessionReport={openSessionReport} />;
  if (subView === "sessionAssignment" && activeSessionId) return <SessionAssignmentView course={course} sessionId={activeSessionId} onUpdate={updateCourse} onBack={() => setSubView(null)} onChangeSession={changeActiveSessionByOffset} />;
  if (subView === "sessionReport" && activeSessionId) return <SessionReportView course={course} sessionId={activeSessionId} onUpdate={updateCourse} onBack={() => setSubView(null)} onChangeSession={changeActiveSessionByOffset} />;
  if (subView === "grades") return <GradesView course={course} onBack={() => setSubView(null)} />;
  if (subView === "reports") return <ReportsView course={course} onUpdate={updateCourse} onBack={() => setSubView(null)} />;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={onBack} title="Back" className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground flex-shrink-0 mt-0.5">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="bg-[#25476a] text-white rounded-xl p-2.5 flex-shrink-0">{course.icon}</div>
              <div>
                <h2 className="font-bold text-foreground leading-tight">{course.name}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <LocationIcon type={course.locationType} />
                  <span className="text-xs text-muted-foreground">{course.locationName}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={course.claimStatus} />
            </div>
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1fr_1.35fr_1.15fr]">
          <div className="flex items-center gap-4 p-4 sm:p-5">
            <div className="relative flex-shrink-0">
              <ProgressRing pct={pct} size={76} />
              <span className="absolute inset-0 flex items-center justify-center text-base font-extrabold text-foreground">{pct}%</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Course progress</p>
              <p className="mt-1 text-sm font-extrabold text-foreground">{course.sessions.filter((session) => session.attended).length}/{course.totalSessions} sessions</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f0f7] px-2.5 py-1 text-xs font-bold text-[#25476a]">
                  <Users size={12} />
                  {course.students.length} students
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-border p-4 sm:p-5 lg:border-l lg:border-t-0">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Amount payable</p>
              <p className="mt-1 text-2xl font-extrabold leading-tight text-[#25476a]">KSh {amountPayable.toLocaleString()}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground">Advance payable</p>
                <p className="mt-1 font-mono text-base font-extrabold text-amber-700">KSh {advancePayable.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border bg-[#f8fbfe] p-4 sm:p-5 lg:border-l lg:border-t-0">
            <div className="flex h-full flex-col justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Payment actions</p>
                <p className="mt-1 text-sm font-semibold text-foreground">Submit an invoice for an advance or full payment claim.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentOpen(true)}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25476a] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#1a3452]"
              >
                <Receipt size={16} />
                Request Payment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Eligibility banners */}
      {pct >= 100 && course.claimStatus === "not_requested" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
          <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">Course complete - claim full payment from Request Payment.</p>
        </div>
      )}
      {false && pct >= 50 && pct < 100 && course.claimStatus === "not_requested" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700 font-medium">50% milestone — eligible for advance payment.</p>
        </div>
      )}

      <div className="grid items-stretch gap-4 xl:grid-cols-2">
        <StudentSessionView course={course} onUpdate={updateCourse} onOpenSessionAssignment={openSessionAssignment} onOpenSessionReport={openSessionReport} />
        <ClaimHistoryPanel course={course} />
      </div>

      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-5" onClick={() => setIsPaymentOpen(false)}>
          <div
            className="max-h-[92dvh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-background shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <PaymentRequestView
              course={course}
              courses={courses}
              setCourses={setCourses}
              onBack={() => setIsPaymentOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────

function StatCards({ courses }: { courses: Course[] }) {
  const totalEarning = courses.reduce((s, c) => s + calcTotalEarning(c), 0);
  const outstanding = courses.filter((c) => ["advance_claimed", "full_claimed"].includes(c.claimStatus))
    .reduce((s, c) => s + (c.claimStatus === "full_claimed" ? calcTotalEarning(c) - c.advancePaidAmount : calcAdvanceAmount(c)), 0);
  const paid = courses.filter((c) => c.claimStatus === "approved").reduce((s, c) => s + calcTotalEarning(c), 0);
  const advPaid = courses.reduce((s, c) => s + c.advancePaidAmount, 0);
  const hours = courses.reduce((s, c) => s + totalHours(c), 0);

  const stats = [
    { label: "Total Claimable", value: `KSh ${totalEarning.toLocaleString()}`, sub: `${courses.length} courses`, icon: <TrendingUp size={18} />, light: "bg-[#e8f0f7]", txt: "text-[#25476a]" },
    { label: "Outstanding", value: `KSh ${outstanding.toLocaleString()}`, sub: `Advance paid: KSh ${advPaid.toLocaleString()}`, icon: <AlertCircle size={18} />, light: "bg-amber-50", txt: "text-amber-600" },
    { label: "Paid Invoices", value: `KSh ${paid.toLocaleString()}`, sub: `${courses.filter((c) => c.claimStatus === "approved").length} approved`, icon: <CheckCircle2 size={18} />, light: "bg-green-50", txt: "text-green-600" },
    { label: "Time Tracked", value: `${hours} hrs`, sub: `${courses.reduce((s, c) => s + c.sessions.filter((x) => x.attended).length, 0)} sessions`, icon: <Clock size={18} />, light: "bg-sky-50", txt: "text-sky-600" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="bg-card rounded-2xl p-4 shadow-sm border border-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className={`${s.light} rounded-xl p-2.5 w-fit mb-3`}>
            <span className={s.txt}>{s.icon}</span>
          </div>
          <p className="text-xl font-extrabold text-foreground tracking-tight leading-tight">{s.value}</p>
          <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-wide">{s.label}</p>
          <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({ course, onClick }: { course: Course; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="group w-full min-h-[170px] text-left bg-card rounded-2xl border border-border shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-[#38aae1]/40 transition-all duration-200 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="bg-[#e8f0f7] text-[#25476a] rounded-xl p-2.5 flex-shrink-0 ring-1 ring-[#25476a]/10">{course.icon}</div>
          <div className="min-w-0 pt-0.5">
            <p className="font-extrabold text-foreground text-base leading-tight truncate">{course.name}</p>
            <p className="text-xs font-semibold text-muted-foreground mt-1 truncate">{course.locationName}</p>
          </div>
        </div>
        <div className="h-8 w-8 rounded-full bg-[#e8f0f7] text-[#25476a] flex items-center justify-center flex-shrink-0 group-hover:bg-[#25476a] group-hover:text-white transition-colors">
          <ChevronRight size={16} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-xl bg-[#f5f9fc] px-3 py-2">
        <div className="flex items-center gap-2 min-w-0" title={LOCATION_LABELS[course.locationType]}>
          <LocationIcon type={course.locationType} />
          <span className="text-xs font-semibold text-muted-foreground truncate">{course.locationName}</span>
        </div>
        <StatusBadge status={course.claimStatus} />
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 pt-1">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Sessions</p>
          <p className="text-sm font-extrabold text-foreground leading-tight">
            {course.sessions.filter((s) => s.attended).length}/{course.totalSessions}
          </p>
        </div>
      </div>
    </button>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

type FilterTab = "all" | "new" | "advance_claimed" | "approved" | "denied";

export default function App() {
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  const selectedCourse = selectedId ? courses.find((c) => c.id === selectedId) ?? null : null;

  const filtered = courses.filter((c) => {
    if (filterTab === "new" && c.claimStatus !== "not_requested") return false;
    if (filterTab === "advance_claimed" && c.claimStatus !== "advance_claimed") return false;
    if (filterTab === "approved" && c.claimStatus !== "approved") return false;
    if (filterTab === "denied" && c.claimStatus !== "denied") return false;
    return true;
  });

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "new", label: "Pending" },
    { key: "advance_claimed", label: "Advance" },
    { key: "approved", label: "Approved" },
    { key: "denied", label: "Denied" },
  ];

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      {/* Content */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6">
        {selectedCourse ? (
          <div className="mx-auto w-full max-w-[1440px]">
            <CourseDetail
              course={selectedCourse}
              courses={courses}
              setCourses={setCourses}
              onBack={() => setSelectedId(null)}
            />
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
            {/* Title */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight leading-tight">My Claims</h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Track payments for your teaching sessions</p>
              </div>
            </div>

            {/* Stats */}
            <StatCards courses={courses} />

            {/* Status tabs */}
            <div className="flex items-center gap-0 border-b border-border overflow-x-auto scrollbar-hide">
              {filterTabs.map((tab) => {
                const count = courses.filter((c) => {
                  if (tab.key === "all") return true;
                  if (tab.key === "new") return c.claimStatus === "not_requested";
                  return c.claimStatus === tab.key;
                }).length;
                return (
                  <button key={tab.key} onClick={() => setFilterTab(tab.key)}
                    className={`relative pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${filterTab === tab.key ? "text-[#25476a]" : "text-muted-foreground hover:text-foreground"}`}>
                    {tab.label}
                    {count > 0 && (
                      <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${filterTab === tab.key ? "bg-[#25476a] text-white" : "bg-muted text-muted-foreground"}`}>{count}</span>
                    )}
                    {filterTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#25476a] rounded-t-full" />}
                  </button>
                );
              })}
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center gap-3 text-center">
                <BookOpen size={28} className="text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">No courses match your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((course) => (
                  <CourseCard key={course.id} course={course} onClick={() => setSelectedId(course.id)} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}


