import type { Application, applicationStatus } from "./App";
import { useAuth } from "@clerk/react";
import { authFetch } from "./authFetch";
import { API_URL } from "./apiUrl";
import StatusDropdown from "./StatusDropdown";
import { formatDate } from "./formatDate";

interface ApplicationRowProps {
  application: Application;
  onStatusChange: (updatedApp: Application) => void;
  onDelete: (id: number) => void;
  onEdit: (application: Application) => void;
}

function ApplicationRow({
  application,
  onStatusChange,
  onDelete,
  onEdit,
}: ApplicationRowProps) {
  const { getToken } = useAuth();

  function handleStatusChange(newStatus: applicationStatus) {
    authFetch(
      `${API_URL}/applications/${application.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      },
      getToken,
    )
      .then((res) => res.json())
      .then((updatedApp: Application) => onStatusChange(updatedApp))
      .catch((err) => console.error("Failed to update status:", err));
  }

  function handleDelete() {
    const confirmed = window.confirm(
      `Delete the application for ${application.company}? This can't be undone.`,
    );
    if (!confirmed) return;

    authFetch(
      `${API_URL}/applications/${application.id}`,
      {
        method: "DELETE",
      },
      getToken,
    )
      .then(() => onDelete(application.id))
      .catch((err) => console.error("Failed to delete application:", err));
  }

  return (
    <tr
      className="app-row text-sm"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <td className="py-3 px-3 truncate" style={{ color: "var(--text-3)" }}>
        {application.id}
      </td>
      <td className="py-3 px-3 font-semibold truncate">
        <span className="inline-flex items-center gap-1.5">
          {application.company}
          <a
            href={application.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open job listing"
            onClick={(e) => e.stopPropagation()}
            style={{ color: "var(--text-3)" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
          {application.is_stale && (
            <span
              className="chip chip-sm"
              title="This listing may no longer be active"
              style={{
                background: "color-mix(in srgb, var(--bad) 15%, transparent)",
                color: "var(--bad)",
                fontWeight: 700,
              }}
            >
              stale
            </span>
          )}
        </span>
      </td>
      <td className="py-3 px-3 truncate" style={{ color: "var(--text-2)" }}>
        {application.role}
      </td>
      <td className="py-3 px-3 truncate" style={{ color: "var(--text-2)" }}>
        {application.location}
      </td>
      <td className="py-3 px-3 truncate" style={{ color: "var(--text-2)" }}>
        {application.notes}
      </td>
      <td className="py-3 px-3 mono" style={{ color: "var(--text-2)" }}>
        {formatDate(application.date_applied)}
      </td>
      <td className="py-3 px-3">
        <StatusDropdown value={application.status} onChange={handleStatusChange} />
      </td>
      <td className="py-3 px-3 text-right">
        <span className="row-actions inline-flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={() => onEdit(application)}
            className="text-xs font-semibold"
            style={{ color: "var(--text-2)" }}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs font-semibold"
            style={{ color: "var(--bad)" }}
          >
            Delete
          </button>
        </span>
      </td>
    </tr>
  );
}

export default ApplicationRow;
