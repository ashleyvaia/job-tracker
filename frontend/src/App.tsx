import { useEffect, useState } from "react";
import AddApplicationModal from "./AddApplicationModal";
import ApplicationRow from "./ApplicationRow";
import Dashboard from "./Dashboard.tsx";
import ThemeToggle from "./ThemeToggle.tsx";
import Logo from "./Logo.tsx";
import { authFetch } from "./authFetch.ts";
import { API_URL } from "./apiUrl.ts";
import { useAuth, SignInButton, UserButton } from "@clerk/react";

export type applicationStatus =
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected"
  | "ghosted"
  | "withdrawn";

export interface Application {
  id: number;
  company: string;
  role: string;
  location: string | null;
  status: applicationStatus;
  interview_round: number | null;
  url: string;
  date_applied: string;
  notes: string | null;
  last_checked: string | null;
  is_stale: boolean;
  created_at: string;
  updated_at: string;
}

function App() {
  const { isSignedIn, getToken } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    if (isSignedIn) {
      setIsLoadingApplications(true);
      setApplicationsError(null);
      authFetch(`${API_URL}/applications/`, {}, getToken)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load applications.");
          return res.json();
        })
        .then((data: Application[]) => setApplications(data))
        .catch(() =>
          setApplicationsError("Couldn't load your applications. Try refreshing the page."),
        )
        .finally(() => setIsLoadingApplications(false));
    }
  }, [getToken, isSignedIn, refreshTrigger]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleCreated(newApp: Application) {
    setApplications((prev) => [...prev, newApp]);
    setRefreshTrigger(prev => prev + 1)
    setIsModalOpen(false);
  }

  function handleStatusChange(updatedApp: Application) {
    setApplications((prev) =>
      prev.map((app) => (app.id === updatedApp.id ? updatedApp : app)),
    );
    setRefreshTrigger(prev => prev + 1)
  }

  function handleDelete(id: number) {
    setApplications((prev) => prev.filter((app) => app.id !== id));
    setRefreshTrigger(prev => prev + 1)
  }

  const [ editingApplication, setEditingApplication ] = useState<Application | null>(null);

  function handleEdit(app: Application) {
    setEditingApplication(app);
    setIsModalOpen(true);
  }

  function handleUpdate(updatedApp: Application) {
    setApplications((prev) =>
      prev.map((app) => (app.id === updatedApp.id ? updatedApp : app)),
    );
    setRefreshTrigger(prev => prev + 1)
  }

  return isSignedIn ? (
    <div>
      <div
        className="w-full flex items-center justify-between px-4 sm:px-6 py-4"
        style={{
          background: "var(--glass-bg)",
          borderBottom: "1px solid var(--glass-border)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-end gap-2">
          <p className="brand text-2xl leading-none m-0">Job Tracker</p>
          <Logo size={24} />
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserButton />
        </div>
      </div>
      <AddApplicationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingApplication(null);
        }}
        onCreated={handleCreated}
        onUpdated={handleUpdate}
        editingApplication={editingApplication}
      />
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10 lg:px-16 pt-6 pb-16">
        <div className="mt-4">
          <Dashboard refreshTrigger={refreshTrigger}/>
        </div>
      <div className="card mt-4 p-4 w-full min-w-0 overflow-x-auto">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-baseline gap-3">
            <p className="text-lg font-bold">Applications</p>
            <p className="mono text-xs" style={{ color: "var(--text-3)" }}>
              {applications.length} {applications.length === 1 ? "row" : "rows"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingApplication(null);
              setIsModalOpen(true);
            }}
            title="Add new application"
            aria-label="Add new application"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full"
            style={{ background: "var(--accent)", color: "var(--surface)" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
        {applicationsError ? (
          <div className="error-banner">{applicationsError}</div>
        ) : (
          <table
            className="w-full min-w-[720px] border-collapse"
            style={{ tableLayout: "fixed" }}
          >
            <colgroup>
              <col style={{ width: "5%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="text-left py-3 px-3 eyebrow text-xs">ID</th>
                <th className="text-left py-3 px-3 eyebrow text-xs">Company</th>
                <th className="text-left py-3 px-3 eyebrow text-xs">Role</th>
                <th className="text-left py-3 px-3 eyebrow text-xs">Location</th>
                <th className="text-left py-3 px-3 eyebrow text-xs">Notes</th>
                <th className="text-left py-3 px-3 eyebrow text-xs">Date</th>
                <th className="text-left py-3 px-3 eyebrow text-xs">Status</th>
                <th className="text-right py-3 px-3 eyebrow text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingApplications ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="py-3 px-3">
                        <div className="skeleton h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <p className="font-semibold mb-1">No applications yet</p>
                    <p className="text-sm" style={{ color: "var(--text-3)" }}>
                      Add your first application to start tracking it here.
                    </p>
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <ApplicationRow
                    key={app.id}
                    application={app}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))
              )}
            </tbody>
          </table>
        )}
        </div>
      </div>
    </div>
  ) : (
    <SignInButton mode="modal" />
  );
}

export default App;
