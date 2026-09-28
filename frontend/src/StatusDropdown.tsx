import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { applicationStatus } from "./App";
import { STATUS_COLORS } from "./statusColors";

const STATUS_LABELS: Record<applicationStatus, string> = {
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  ghosted: "Ghosted",
  withdrawn: "Withdrawn",
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as applicationStatus[];

interface StatusDropdownProps {
  value: applicationStatus;
  onChange: (newStatus: applicationStatus) => void;
}

function StatusDropdown({ value, onChange }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    ready: false,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || !containerRef.current || !menuRef.current) return;

    const triggerRect = containerRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current.offsetHeight;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const left = triggerRect.left + window.scrollX;

    const top =
      spaceBelow < menuHeight + 8
        ? triggerRect.top + window.scrollY - menuHeight - 8
        : triggerRect.bottom + window.scrollY + 8;

    setMenuPosition({ top, left, ready: true });
  }, [isOpen]);

  function handleToggle() {
    if (!isOpen) {
      setMenuPosition((prev) => ({ ...prev, ready: false }));
    }
    setIsOpen((prev) => !prev);
  }

  const color = STATUS_COLORS[value] ?? "var(--neutral-status)";

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={handleToggle}
        className="chip chip-sm cursor-pointer lowercase"
        style={{
          background: `color-mix(in srgb, ${color} 15%, transparent)`,
          color: "var(--text)",
          border: "none",
        }}
      >
        <span className="chip-dot" style={{ background: color }} />
        {STATUS_LABELS[value]}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="card absolute z-50 p-2 flex flex-col gap-1"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              minWidth: "160px",
              visibility: menuPosition.ready ? "visible" : "hidden",
            }}
          >
            {STATUS_OPTIONS.map((status) => {
              const optionColor = STATUS_COLORS[status] ?? "var(--neutral-status)";
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    onChange(status);
                    setIsOpen(false);
                  }}
                  className="chip chip-sm cursor-pointer justify-start lowercase"
                  style={{
                    background:
                      status === value
                        ? `color-mix(in srgb, ${optionColor} 15%, transparent)`
                        : "transparent",
                    color: optionColor,
                    border: "none",
                  }}
                >
                  <span className="chip-dot" style={{ background: optionColor }} />
                  {STATUS_LABELS[status]}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}

export default StatusDropdown;
