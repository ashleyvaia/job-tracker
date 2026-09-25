import { useEffect, useState } from "react";
import AddApplicationModal from "./AddApplicationModal";
import ApplicationRow from "./ApplicationRow";
import Dashboard from "./Dashboard.tsx";
import { authFetch } from "./authFetch.ts";
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

  useEffect(() => {
    if (isSignedIn) {
      authFetch("http://localhost:8000/applications/", {}, getToken)
        .then((res) => res.json())
        .then((data: Application[]) => setApplications(data))
        .catch((err) => console.error("Failed to fetch applications:", err));
    }
  }, [getToken, isSignedIn]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleCreated(newApp: Application) {
    setApplications((prev) => [...prev, newApp]);
    setIsModalOpen(false);
  }

  function handleStatusChange(updatedApp: Application) {
    setApplications((prev) =>
      prev.map((app) => (app.id === updatedApp.id ? updatedApp : app)),
    );
  }

  function handleDelete(id: number) {
    setApplications((prev) => prev.filter((app) => app.id !== id));
  }

  return isSignedIn ? (
    <>
      <UserButton />
      <button type="button" onClick={() => setIsModalOpen(true)}>
        Add new application
      </button>
      <AddApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreated}
      />
      <Dashboard />
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Company</th>
            <th>Role</th>
            <th>Location</th>
            <th>Notes</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <ApplicationRow
              key={app.id}
              application={app}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </tbody>
      </table>
    </>
  ) : (
    <SignInButton mode="modal" />
  );
}

export default App;
