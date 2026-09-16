import {useEffect, useState} from 'react';


interface HealthResponse {
  status: string;
}

function App() {
  const [status, setStatus] = useState<string>('checking...')

  useEffect(() => {
    fetch('http://localhost:8000/health')
    .then((res) => res.json())
    .then((data: HealthResponse) => setStatus(data.status))
    .catch(() => setStatus('unreachable'))
  }, [])

return <p>Backend status: {status}</p>
}


export default App
