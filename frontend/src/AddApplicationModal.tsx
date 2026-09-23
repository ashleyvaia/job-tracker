import type { Application } from "./App";
import { useState } from "react";
import { useAuth } from "@clerk/react";
import { authFetch } from "./authFetch";

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newApp: Application) => void;
}

function AddApplicationModal({
  isOpen,
  onClose,
  onCreated,
}: AddApplicationModalProps) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [url, setUrl] = useState("");
  const [dateApplied, setDateApplied] = useState("");
  const [notes, setNotes] = useState("");

  const { getToken } = useAuth();

  if (!isOpen) return null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      .then((res) => res.json())
      .then((newApplication: Application) => {
        onCreated(newApplication);
        setCompany("");
        setRole("");
        setLocation("");
        setUrl("");
        setDateApplied("");
        setNotes("");
      })
      .catch((err) => console.error("Failed to add application:", err));
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company"
          required
        />
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Role"
          required
        />
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          required
        />
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL"
          required
        />
        <input
          type="date"
          value={dateApplied}
          onChange={(e) => setDateApplied(e.target.value)}
          placeholder="Date applied"
          required
        />
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
        />
        <button type="submit">Add application</button>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      </form>
    </div>
  );
}

export default AddApplicationModal;
