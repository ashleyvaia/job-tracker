import {useEffect, useState} from 'react';
import AddApplicationModal from './AddApplicationModal';


type applicationStatus = "applied" | "interviewing" | "offer" | "rejected" | "ghosted" | "withdrawn";

export interface Application {
  id: number
  company: string
  role: string
  location: string | null
  status: applicationStatus
  interview_round: number | null
  url: string
  date_applied: string
  notes: string | null
  last_checked: string | null
  is_stale: boolean
  created_at: string
  updated_at: string
}

function App() {
  const [applications, setApplications] = useState<Application[]>([])

  useEffect(() => {
    fetch('http://localhost:8000/applications/')
    .then((res) => res.json())
    .then((data: Application[]) => setApplications(data))
    .catch((err) => console.error('Failed to fetch applications:', err))
  }, [])

  const [isModalOpen, setIsModalOpen] = useState(false)

  function handleCreated(newApp: Application) {
    setApplications((prev) => [...prev, newApp])
    setIsModalOpen(false)
  }

  return (
    <>
      <button type="button" onClick={() => setIsModalOpen(true)}>
        Add new application
      </button>
      <AddApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreated}/>
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
            <tr key={app.id}>
              <td>{app.id}</td>
              <td>{app.company}</td>
              <td>{app.role}</td>
              <td>{app.location}</td>
              <td>{app.notes}</td>
              <td>{app.date_applied}</td>
              <td>{app.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
  

}

export default App

