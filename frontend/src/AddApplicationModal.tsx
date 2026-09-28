import type { Application } from "./App";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { authFetch } from "./authFetch";

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newApp: Application) => void;
  onUpdated: (app: Application) => void;
  editingApplication: Application | null;
}

const inputStyle = {
  background: "var(--surface-2)",
  color: "var(--text)",
  border: "1px solid var(--border)",
};

function AddApplicationModal({
  isOpen,
  onClose,
  onCreated,
  onUpdated,
  editingApplication,
}: AddApplicationModalProps) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [url, setUrl] = useState("");
  const [dateApplied, setDateApplied] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { getToken } = useAuth();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (editingApplication) {
      authFetch(
        `http://localhost:8000/applications/${editingApplication.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company,
            role,
            location,
            url,
            date_applied: dateApplied,
            notes,
          }),
        },
        getToken,
      )
        .then((res) => {
          if (!res.ok) {
            return res.json().then((body) => {
              const detail = Array.isArray(body.detail)
                ? body.detail.map((d: { msg: string }) => d.msg).join(", ")
                : body.detail;
              throw new Error(detail ?? "Failed to add application.");
            });
          }
          return res.json();
        })
        .then((updatedApp: Application) => onUpdated(updatedApp))
        .catch((err: Error) => setError(err.message));
    } else {
      authFetch(
        "http://localhost:8000/applications/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company,
            role,
            location,
            url,
            date_applied: dateApplied,
            notes,
          }),
        },
        getToken,
      )
        .then((res) => {
          if (!res.ok) {
            return res.json().then((body) => {
              const detail = Array.isArray(body.detail)
                ? body.detail.map((d: { msg: string }) => d.msg).join(", ")
                : body.detail;
              throw new Error(detail ?? "Failed to add application.");
            });
          }
          return res.json();
        })
        .then((newApplication: Application) => {
          onCreated(newApplication);
          setCompany("");
          setRole("");
          setLocation("");
          setUrl("");
          setDateApplied("");
          setNotes("");
        })
        .catch((err: Error) => setError(err.message));
    }
  }

  useEffect(() => {
    if (editingApplication) {
      setCompany(editingApplication.company);
      setRole(editingApplication.role);
      setLocation(editingApplication.location ?? "");
      setUrl(editingApplication.url);
      setDateApplied(editingApplication.date_applied);
      setNotes(editingApplication.notes ?? "");
    } else {
      setCompany("");
      setRole("");
      setLocation("");
      setUrl("");
      setDateApplied("");
      setNotes("");
    }
  }, [editingApplication]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0, 0, 0, 0.4)" }}
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <p className="text-lg font-bold">
            {editingApplication ? "Edit application" : "Add new application"}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex items-center justify-center w-7 h-7 rounded-full"
            style={{ color: "var(--text-3)" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error && (
            <div
              className="rounded-lg px-3 py-2 text-sm"
              style={{
                background: "color-mix(in srgb, var(--bad) 12%, transparent)",
                color: "var(--bad)",
              }}
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="eyebrow text-xs">Company</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm"
              style={inputStyle}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="eyebrow text-xs">Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm"
              style={inputStyle}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="eyebrow text-xs">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm"
              style={inputStyle}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="eyebrow text-xs">URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm"
              style={inputStyle}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="eyebrow text-xs">Date applied</label>
            <input
              type="date"
              value={dateApplied}
              onChange={(e) => setDateApplied(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm"
              style={inputStyle}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="eyebrow text-xs">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded-lg px-3 py-2 text-sm resize-none"
              style={inputStyle}
            />
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button
              type="submit"
              className="flex-1 text-sm font-semibold px-4 py-2 rounded-full"
              style={{ background: "var(--accent)", color: "var(--surface)" }}
            >
              {editingApplication ? "Save changes" : "Add application"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-semibold px-4 py-2 rounded-full"
              style={{
                background: "var(--surface-2)",
                color: "var(--text-2)",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddApplicationModal;
