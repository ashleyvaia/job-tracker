import { useAuth } from "@clerk/react";
import { useEffect, useState, Fragment } from "react";
import { authFetch } from "./authFetch";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

interface DashboardStats {
  stale_rate: number;
  ghost_rate: number;
  response_rate: number;
  status_breakdown: Record<string, number>;
  days_since_last_applied: number | null;
  applications_per_week: { week: string; count: number }[];
  current_streak: number;
}

function Dashboard() {
  const { isSignedIn, getToken } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardStats | undefined>();

  useEffect(() => {
    if (isSignedIn) {
      authFetch("http://localhost:8000/dashboard/", {}, getToken)
        .then((res) => res.json())
        .then((data: DashboardStats) => setDashboard(data))
        .catch((err) => console.error("Failed to fetch dashboard stats:", err));
    }
  }, [getToken, isSignedIn]);

  if (!dashboard) return <p>Loading...</p>;

  const labels = dashboard.applications_per_week.map(({ week }) => week);
  const dataset = dashboard.applications_per_week.map(({ count }) => count);

  const chartData = {
    labels,
    datasets: [{ label: "Applications", data: dataset }],
  };

  return isSignedIn ? (
    <div className="grid grid-cols-[1fr_0.7fr_1.6fr] gap-4 p-4">
      <div className="flex flex-col gap-4">
        <div className="tile rounded-lg border border-gray-200 p-3 flex-1">
          <div className="grid grid-cols-3 gap-2 h-full">
            <div className="rounded-md bg-white/5 p-2 flex flex-col items-center justify-center text-center">
              <dt className="text-xs text-gray-500">Stale rate</dt>
              <dd className="text-lg font-semibold">{dashboard.stale_rate}%</dd>
            </div>

            <div className="rounded-md bg-white/5 p-2 flex flex-col items-center justify-center text-center">
              <dt className="text-xs text-gray-500">Response rate</dt>
              <dd className="text-lg font-semibold">{dashboard.response_rate}%</dd>
            </div>

            <div className="rounded-md bg-white/5 p-2 flex flex-col items-center justify-center text-center">
              <dt className="text-xs text-gray-500">Ghost rate</dt>
              <dd className="text-lg font-semibold">{dashboard.ghost_rate}%</dd>
            </div>
          </div>
        </div>

        <div className="tile rounded-lg border border-gray-200 p-3 flex-1">
          <p className="text-xs text-gray-500">Streak</p>
          <p className="text-lg font-semibold">{dashboard.current_streak}</p>
          {dashboard.days_since_last_applied != null ? (
            <p className="text-xs text-gray-500">
              {dashboard.days_since_last_applied} days since last applied
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              Start logging applications today!
            </p>
          )}
        </div>
      </div>

      <div className="tile rounded-lg border border-gray-200 p-4 h-full">
        <dl className="flex flex-col justify-between h-full">
          {Object.entries(dashboard.status_breakdown).map(([status, value]) => (
            <Fragment key={status}>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">{status}</dt>
                <dd className="font-semibold">{value}</dd>
              </div>
            </Fragment>
          ))}
        </dl>
      </div>

      <div className="tile rounded-lg border border-gray-200 p-4 h-80">
        <Bar
          data={chartData}
          options={{ maintainAspectRatio: false, responsive: true }}
        />
      </div>
    </div>
  ) : (
    <p>Hi</p>
  );
}

export default Dashboard;
