import { useState } from 'react';
import { formatDayMonth, formatNumber } from '@/lib/format';

const W = 600;
const H = 170;
const PAD = { top: 10, right: 4, bottom: 22, left: 30 };
const GAP = 2;

// Échelle « ronde » : 0, puis des paliers lisibles (1, 2, 5 × 10ⁿ).
function niceMax(max: number): number {
  if (max <= 4) return 4;
  const step = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * step >= max) return m * step;
  return 10 * step;
}

// Une série par graphique (le titre la nomme) : colonnes par jour, info-bulle au survol.
export function ColumnChart({
  title,
  points,
}: {
  title: string;
  points: { date: string; value: number }[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const total = points.reduce((sum, p) => sum + p.value, 0);
  const top = niceMax(Math.max(0, ...points.map((p) => p.value)));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / Math.max(1, points.length);
  const barW = Math.max(1, slot - GAP);
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const ticks = [0, top / 2, top];
  const labelEvery = Math.ceil(points.length / 6);
  const hovered = hover === null ? null : points[hover];

  return (
    <section className="panel chart">
      <div className="panel-head">
        <h2>{title}</h2>
        <span className="chart-total">{formatNumber(total)} sur la période</span>
      </div>
      <div style={{ position: 'relative' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${title} : ${formatNumber(total)} sur ${points.length} jours`}
          onMouseLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--chart-grid)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 6}
                y={y(t)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={11}
                fill="var(--ink-3)"
              >
                {formatNumber(t)}
              </text>
            </g>
          ))}
          {points.map((p, i) => {
            const x = PAD.left + i * slot + GAP / 2;
            const h = Math.max(0, y(0) - y(p.value));
            const r = Math.min(4, barW / 2, h);
            return (
              <g key={p.date}>
                {p.value > 0 ? (
                  <path
                    d={`M${x},${y(0)} V${y(0) - h + r} Q${x},${y(0) - h} ${x + r},${y(0) - h} H${x + barW - r} Q${x + barW},${y(0) - h} ${x + barW},${y(0) - h + r} V${y(0)} Z`}
                    fill="var(--chart)"
                    opacity={hover === null || hover === i ? 1 : 0.45}
                  />
                ) : null}
                {i % labelEvery === 0 ? (
                  <text
                    x={x + barW / 2}
                    y={H - 6}
                    textAnchor="middle"
                    fontSize={11}
                    fill="var(--ink-3)"
                  >
                    {formatDayMonth(`${p.date}T12:00:00Z`)}
                  </text>
                ) : null}
                {/* Zone de survol : toute la hauteur de la colonne, plus grande que la barre. */}
                <rect
                  x={PAD.left + i * slot}
                  y={PAD.top}
                  width={slot}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                />
              </g>
            );
          })}
        </svg>
        {hovered && hover !== null ? (
          <div
            className="chart-tooltip"
            style={{
              left: `${((PAD.left + hover * slot + slot / 2) / W) * 100}%`,
              top: `${(y(hovered.value) / H) * 100}%`,
            }}
          >
            {formatDayMonth(`${hovered.date}T12:00:00Z`)} :{' '}
            <strong>{formatNumber(hovered.value)}</strong>
          </div>
        ) : null}
      </div>
      {/* Données lisibles par les lecteurs d’écran. Une <table> ignore overflow : hidden,
          on la masque donc dans un conteneur, sinon elle allonge la page. */}
      <div className="visually-hidden">
        <table>
          <caption>{title}</caption>
          <tbody>
            {points.map((p) => (
              <tr key={p.date}>
                <th scope="row">{p.date}</th>
                <td>{p.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
