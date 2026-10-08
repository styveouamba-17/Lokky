import type { AdminStats } from '@lokky/shared/admin';
import { getRouteApi } from '@tanstack/react-router';
import { useStats } from '@/api/queries';
import { formatNumber } from '@/lib/format';
import { CATEGORY_LABELS } from '@/lib/labels';
import { ErrorBox, Segmented, SkeletonRows } from '@/ui';
import { ColumnChart } from './ColumnChart';

const route = getRouteApi('/app/stats');

export function StatsPage() {
  const { days } = route.useSearch();
  const navigate = route.useNavigate();
  const stats = useStats(days);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Statistiques</h1>
          <p>Jours à l’heure de Dakar, aujourd’hui compris.</p>
        </div>
        <Segmented
          label="Période"
          value={days}
          onChange={(d) => navigate({ search: { days: d } })}
          options={[
            { value: 7, label: '7 jours' },
            { value: 30, label: '30 jours' },
            { value: 90, label: '90 jours' },
          ]}
        />
      </div>
      {stats.error ? <ErrorBox error={stats.error} /> : null}
      {stats.data ? (
        <Dashboard stats={stats.data} />
      ) : stats.isPending ? (
        <SkeletonRows rows={4} height={120} />
      ) : null}
    </>
  );
}

function Dashboard({ stats }: { stats: AdminStats }) {
  const { totals, series } = stats;
  const tiles: { value: number; label: string; hint?: string; alert?: boolean }[] = [
    {
      value: totals.members,
      label: 'Membres',
      hint: `+${formatNumber(totals.newMembers)} sur la période`,
    },
    { value: totals.activitiesUpcoming, label: 'Sorties à venir' },
    { value: totals.activitiesCreated, label: 'Sorties publiées', hint: 'sur la période' },
    { value: totals.joins, label: 'Inscriptions à une sortie', hint: 'sur la période' },
    { value: totals.messages, label: 'Messages envoyés', hint: 'sur la période' },
    {
      value: totals.openReports,
      label: 'Signalements à traiter',
      alert: totals.openReports > 0,
    },
    {
      value: totals.suspended + totals.banned,
      label: 'Comptes restreints',
      hint: `${formatNumber(totals.suspended)} suspendus, ${formatNumber(totals.banned)} bannis`,
    },
  ];
  const pick = (key: 'signups' | 'activities' | 'joins' | 'reports') =>
    series.map((d) => ({ date: d.date, value: d[key] }));
  const maxCategory = Math.max(1, ...stats.categories.map((c) => c.count));

  return (
    <>
      <div className="tiles">
        {tiles.map((t) => (
          <div key={t.label} className="tile" data-alert={t.alert ?? false}>
            <div className="tile-value">{formatNumber(t.value)}</div>
            <div className="tile-label">
              {t.label}
              {t.hint ? <small>{t.hint}</small> : null}
            </div>
          </div>
        ))}
      </div>
      <div className="charts">
        <ColumnChart title="Nouveaux membres par jour" points={pick('signups')} />
        <ColumnChart title="Sorties publiées par jour" points={pick('activities')} />
        <ColumnChart title="Inscriptions aux sorties par jour" points={pick('joins')} />
        <ColumnChart title="Signalements reçus par jour" points={pick('reports')} />
      </div>
      <section className="panel" style={{ marginTop: 16 }}>
        <h2 style={{ marginBottom: 14 }}>Sorties publiées par catégorie</h2>
        {stats.categories.length === 0 ? (
          <p className="muted">Aucune sortie publiée sur la période.</p>
        ) : (
          <div className="bars-h">
            {stats.categories.map((c) => (
              <div
                key={c.category}
                className="bar-row"
                title={`${CATEGORY_LABELS[c.category]} : ${c.count}`}
              >
                <span>{CATEGORY_LABELS[c.category]}</span>
                <div className="track">
                  <div className="fill" style={{ width: `${(c.count / maxCategory) * 100}%` }} />
                </div>
                <span className="num">{formatNumber(c.count)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
