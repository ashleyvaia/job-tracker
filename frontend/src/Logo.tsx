import { useId } from "react";

interface LogoProps {
  size?: number;
  color?: string;
}

const VIEWBOX = 100;
const COLUMNS = 20;
const ROWS = 14;

// The mountain's silhouette: at x=0 it's a point (height 0), at x=1 it's full height.
function topYAtX(xFraction: number): number {
  return (1 - xFraction) * VIEWBOX;
}

function Logo({ size = 32, color = "var(--accent)" }: LogoProps) {
  const clipId = useId();
  const dots: { x: number; y: number; r: number }[] = [];
  const cellWidth = VIEWBOX / (COLUMNS - 1);

  for (let col = 0; col < COLUMNS; col++) {
    const colFraction = col / (COLUMNS - 1);
    const x = colFraction * VIEWBOX;
    const topY = topYAtX(colFraction);

    for (let row = 0; row < ROWS; row++) {
      const rowFraction = row / (ROWS - 1);
      const y = rowFraction * VIEWBOX;
      if (y < topY) continue;

      // Dot radius grows left-to-right until neighboring dots (including
      // diagonal neighbors) fully overlap into a solid field — the core
      // halftone mechanism, with no separate solid shape.
      const minRadius = 1.6;
      const maxRadius = (cellWidth * Math.SQRT2) / 2 + 1.2;
      const r = minRadius + colFraction ** 1.5 * (maxRadius - minRadius);

      dots.push({ x, y, r });
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <defs>
        <clipPath id={clipId}>
          <polygon points={`0,${VIEWBOX} ${VIEWBOX},0 ${VIEWBOX},${VIEWBOX}`} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {dots.map((dot, i) => (
          <circle key={i} cx={dot.x} cy={dot.y} r={dot.r} fill={color} />
        ))}
      </g>
    </svg>
  );
}

export default Logo;
