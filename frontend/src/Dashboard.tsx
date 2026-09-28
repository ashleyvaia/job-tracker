import { useAuth } from "@clerk/react";
import { useEffect, useState } from "react";
import { authFetch } from "./authFetch";
import { API_URL } from "./apiUrl";
import { STATUS_COLORS } from "./statusColors";
import { formatDate } from "./formatDate";
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

function InfoIcon({ tooltip }: { tooltip: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={() => setIsOpen((prev) => !prev)}
    >
      <span
        className="inline-flex items-center justify-center w-4 h-4 rounded-full cursor-help select-none"
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
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </span>

      <span
        role="tooltip"
        className="tooltip-popover absolute z-10 w-72 p-3 text-xs font-medium normal-case"
        style={{
          bottom: "calc(100% + 8px)",
          left: "50%",
          background: "var(--text-2)",
          color: "var(--surface)",
          lineHeight: 1.5,
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? "visible" : "hidden",
          transform: isOpen
            ? "translateX(-50%) translateY(0) scale(1)"
            : "translateX(-50%) translateY(4px) scale(0.96)",
        }}
      >
        {tooltip}
      </span>
    </span>
  );
}

interface DashboardStats {
  stale_rate: number;
  ghost_rate: number;
  response_rate: number;
  status_breakdown: Record<string, number>;
  days_since_last_applied: number | null;
  applications_per_week: { week: string; count: number }[];
  current_streak: number;
}

interface DashboardProps {
  refreshTrigger: number;
}

function Dashboard({ refreshTrigger }: DashboardProps) {
  const { isSignedIn, getToken } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardStats | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      setError(null);
      authFetch(`${API_URL}/dashboard/`, {}, getToken)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load dashboard stats.");
          return res.json();
        })
        .then((data: DashboardStats) => setDashboard(data))
        .catch(() => setError("Couldn't load your dashboard. Try refreshing the page."));
    }
  }, [getToken, isSignedIn, refreshTrigger]);

  if (error) {
    return (
      <div className="w-full min-w-0">
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="w-full min-w-0 flex flex-col gap-4">
        <div className="card p-5 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_2fr] gap-6">
          <div className="flex flex-col gap-3">
            <div className="skeleton h-4 w-16" />
            <div className="skeleton h-16 w-32" />
            <div className="skeleton h-4 w-40" />
          </div>
          <div className="skeleton h-48 w-full" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 flex flex-col gap-2">
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-8 w-14" />
          </div>
          <div className="card p-4 flex flex-col gap-2">
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-8 w-14" />
          </div>
          <div className="card p-4 flex flex-col gap-2">
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-8 w-14" />
          </div>
        </div>
        <div className="card p-4">
          <div className="skeleton h-4 w-32 mb-3" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const labels = dashboard.applications_per_week.map(
    ({ week }) => `Week of ${formatDate(week, { includeYear: false })}`,
  );
  const dataset = dashboard.applications_per_week.map(({ count }) => count);

  const rootStyles = getComputedStyle(document.documentElement);
  const accentColor = rootStyles.getPropertyValue("--accent").trim();
  const borderColor = rootStyles.getPropertyValue("--border").trim();
  const text3Color = rootStyles.getPropertyValue("--text-3").trim();

  const chartData = {
    labels,
    datasets: [
      {
        label: "Applications",
        data: dataset,
        backgroundColor: accentColor,
        hoverBackgroundColor: accentColor,
        borderWidth: 0,
        borderRadius: 6,
        maxBarThickness: 36,
      },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: rootStyles.getPropertyValue("--text").trim(),
        titleColor: rootStyles.getPropertyValue("--bg").trim(),
        bodyColor: rootStyles.getPropertyValue("--bg").trim(),
        padding: 8,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: text3Color, font: { family: "IBM Plex Mono" } },
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0, color: text3Color, font: { family: "IBM Plex Mono" } },
        grid: { color: borderColor },
      },
    },
  };

  return isSignedIn ? (
    <div className="w-full min-w-0 flex flex-col gap-4">
      {/* Hero: streak + chart */}
      <div className="card p-5 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_2fr] gap-6 items-center">
        <div className="min-w-0">
          <p className="eyebrow mb-3 text-base">Streak</p>
          <p className="mono text-5xl md:text-7xl font-extrabold leading-none" style={{ color: "var(--accent)" }}>
            {dashboard.current_streak}
            <span className="text-2xl font-semibold ml-2" style={{ color: "var(--text-2)" }}>
              days
            </span>
          </p>
          {dashboard.days_since_last_applied != null ? (
            <p className="text-base font-medium mt-3" style={{ color: "var(--text-2)" }}>
              {dashboard.days_since_last_applied} days since last applied
            </p>
          ) : (
            <p className="text-base font-medium mt-3" style={{ color: "var(--text-2)" }}>
              Start logging applications today!
            </p>
          )}
        </div>

        <div
          className="min-w-0 pl-0 md:pl-6 pt-6 md:pt-0 border-t md:border-t-0 md:border-l"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="eyebrow mb-4">Applications per week</p>
          <div className="h-48">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Rate stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="eyebrow mb-2 inline-flex items-center gap-1.5">
            Stale rate
            <InfoIcon tooltip="Percentage of your applications that are likely dead: no response after 14+ days, or the job listing itself looks closed." />
          </p>
          <p className="mono text-2xl font-semibold">{dashboard.stale_rate}%</p>
        </div>
        <div className="card p-4">
          <p className="eyebrow mb-2 inline-flex items-center gap-1.5">
            Response rate
            <InfoIcon tooltip="Percentage of your applications that got any reply, whether that's an interview, an offer, or a rejection." />
          </p>
          <p className="mono text-2xl font-semibold">{dashboard.response_rate}%</p>
        </div>
        <div className="card p-4">
          <p className="eyebrow mb-2 inline-flex items-center gap-1.5">
            Ghost rate
            <InfoIcon tooltip="Percentage of your applications marked as ghosted, meaning you never heard back at all." />
          </p>
          <p className="mono text-2xl font-semibold">{dashboard.ghost_rate}%</p>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="card p-4">
        <p className="eyebrow mb-3">Status breakdown</p>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(dashboard.status_breakdown).map(([status, value]) => {
            const color = STATUS_COLORS[status] ?? "var(--neutral-status)";
            return (
              <span
                key={status}
                className="chip justify-between"
                style={{ background: "var(--surface-2)", color: "var(--text)" }}
              >
                <span className="flex items-center gap-2">
                  <span className="chip-dot" style={{ background: color }} />
                  {status}
                </span>
                <span className="mono">{value}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  ) : (
    <p>Hi</p>
  );
}

export default Dashboard;
