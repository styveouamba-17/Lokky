import type { AdminReport, ReportTarget } from '@lokky/shared/admin';
import {
  CalendarDots,
  ChatCircleText,
  Flag,
  SealCheck,
  UserCircle,
  type Icon,
} from '@phosphor-icons/react';
import { getRouteApi } from '@tanstack/react-router';
import { useReports } from '@/api/queries';
import { formatRelative } from '@/lib/format';
import { displayName, REASON_LABELS, TARGET_LABELS } from '@/lib/labels';
import { Empty, ErrorBox, Pager, Segmented, SkeletonRows } from '@/ui';
import { ReportCase } from './ReportCase';

const route = getRouteApi('/app/reports');
const PAGE_SIZE = 30;

export const TARGET_ICONS: Record<ReportTarget['type'], Icon> = {
  message: ChatCircleText,
  user: UserCircle,
  activity: CalendarDots,
};

// Ce que la file affiche du contenu signalé : quelques mots pour le reconnaître.
export function targetExcerpt(target: ReportTarget): string {
  if (target.type === 'message') {
    return target.message ? `« ${target.message.body} »` : 'Message supprimé';
  }
  if (target.type === 'user') {
    return target.user ? displayName(target.user.firstName) : 'Compte supprimé';
  }
  return target.activity ? target.activity.title : 'Sortie supprimée';
}

export function ReportsPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const reports = useReports({
    status: search.status,
    targetType: search.type,
    page: search.page,
    pageSize: PAGE_SIZE,
  });
  const items = reports.data?.items ?? [];
  const selectedId = search.id ?? items[0]?.id;

  const select = (id: string | undefined) =>
    navigate({ search: (s) => ({ ...s, id }), replace: true });

  // Après une décision, on passe au signalement suivant de la file.
  const next = (current: AdminReport) => {
    const others = items.filter(
      (r) => r.target.type !== current.target.type || r.target.id !== current.target.id,
    );
    const index = items.findIndex((r) => r.id === current.id);
    const following = others.find((r) => items.indexOf(r) > index) ?? others[0];
    void select(following?.id);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Signalements</h1>
          <p>
            {search.status === 'open'
              ? 'Les plus anciens d’abord : chaque signalement attend une décision.'
              : 'Historique des décisions de l’équipe.'}
          </p>
        </div>
      </div>
      <div className="toolbar">
        <Segmented
          label="Statut"
          value={search.status}
          onChange={(status) => navigate({ search: { status, type: search.type, page: 1 } })}
          options={[
            { value: 'open', label: 'À traiter' },
            { value: 'resolved', label: 'Traités' },
            { value: 'dismissed', label: 'Classés sans suite' },
          ]}
        />
        <Segmented
          label="Type de contenu"
          value={search.type ?? 'all'}
          onChange={(type) =>
            navigate({
              search: { status: search.status, type: type === 'all' ? undefined : type, page: 1 },
            })
          }
          options={[
            { value: 'all', label: 'Tout' },
            { value: 'message', label: 'Messages' },
            { value: 'user', label: 'Profils' },
            { value: 'activity', label: 'Sorties' },
          ]}
        />
      </div>

      {reports.error ? <ErrorBox error={reports.error} /> : null}
      {reports.isPending ? (
        <SkeletonRows rows={5} height={84} />
      ) : items.length === 0 ? (
        <div className="panel">
          <Empty
            icon={<SealCheck size={40} weight="duotone" />}
            title={search.status === 'open' ? 'Rien à traiter' : 'Aucun signalement ici'}
          >
            {search.status === 'open'
              ? 'Tous les signalements ont reçu une décision. Les nouveaux apparaîtront ici.'
              : 'Change de filtre pour voir les autres décisions.'}
          </Empty>
        </div>
      ) : (
        <div className="inbox">
          <div>
            <div className="queue" role="list" aria-label="Signalements">
              {items.map((r) => (
                <QueueItem
                  key={r.id}
                  report={r}
                  current={r.id === selectedId}
                  onSelect={() => select(r.id)}
                />
              ))}
            </div>
            <Pager
              page={search.page}
              pageSize={PAGE_SIZE}
              total={reports.data?.total ?? 0}
              noun={['signalement', 'signalements']}
              onPage={(page) => navigate({ search: (s) => ({ ...s, page, id: undefined }) })}
            />
          </div>
          {selectedId ? <ReportCase id={selectedId} onDecided={next} /> : null}
        </div>
      )}
    </>
  );
}

function QueueItem({
  report,
  current,
  onSelect,
}: {
  report: AdminReport;
  current: boolean;
  onSelect: () => void;
}) {
  const TargetIcon = TARGET_ICONS[report.target.type];
  return (
    <button
      type="button"
      role="listitem"
      className="queue-item"
      aria-current={current}
      onClick={onSelect}
    >
      <div className="queue-top">
        <TargetIcon size={16} />
        {TARGET_LABELS[report.target.type]}
        {report.sameTargetOpen > 1 ? (
          <span className="repeat" title="Signalements ouverts sur ce contenu">
            <Flag size={13} weight="fill" />
            {report.sameTargetOpen}
          </span>
        ) : null}
        <span className="when">{formatRelative(report.createdAt)}</span>
      </div>
      <h3>{REASON_LABELS[report.reason]}</h3>
      <p className="queue-excerpt">{targetExcerpt(report.target)}</p>
    </button>
  );
}
