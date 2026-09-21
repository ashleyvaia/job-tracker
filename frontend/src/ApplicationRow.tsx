import type { Application, applicationStatus } from "./App";
import { useState } from "react";

interface ApplicationRowProps {
  application: Application;
  onStatusChange: (updatedApp: Application) => void;
  onDelete: (id: number) => void;
}

function ApplicationRow({
  application,
  onStatusChange,
  onDelete,
}: ApplicationRowProps) {

  function handleStatusChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = event.target.value
    fetch(`http://localhost:8000/applications/${application.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({status: newStatus}),
    })
    .then((res) => res.json())
    .then((updatedApp: Application) => onStatusChange(updatedApp))
    .catch((err) => console.error('Failed to update status:', err))
  }

  function handleDelete() {
    fetch(`http://localhost:8000/applications/${application.id}`, {
      method: 'DELETE',
    })
    .then(() => onDelete(application.id))
    .catch((err) => console.error('Failed to delete application:', err))
  }

  return (
    <tr>
      <td>{application.id}</td>
      <td>{application.company}</td>
      <td>{application.role}</td>
      <td>{application.location}</td>
      <td>{application.notes}</td>
      <td>{application.date_applied}</td>
      <td>
        <select value={application.status} onChange={handleStatusChange}>
          <option value="applied">Applied</option>
          <option value="interviewing">Interviewing</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
          <option value="ghosted">Ghosted</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </td>
      <td>
        <button type="button" onClick={handleDelete}>Delete application</button>
      </td>
    </tr>
  );
}

export default ApplicationRow
