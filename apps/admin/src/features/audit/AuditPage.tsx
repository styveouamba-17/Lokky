import { ADMIN_PAGE_SIZE, type AuditEntry } from '@lokky/shared/admin';
import {
  ChatsCircle,
  CheckCircle,
  ClipboardText,
  Eye,
  Prohibit,
  SignIn,
  UserMinus,
  Warning,
  XCircle,
  type Icon,
} from '@phosphor-icons/react';
import { getRouteApi, Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useAudit } from '@/api/queries';
import { formatDate, formatTime } from '@/lib/format';
import { displayName } from '@/lib/labels';
import { Avatar, Empty, ErrorBox, Pager, Segmented, SkeletonRows } from '@/ui';

const route = getRouteApi('/app/audit');

// Phrase de chaque action, du point de vue de la personne qui l'a faite.
const ACTIONS: Record<string, { verb: string; icon: Icon; tone?: string }> = {
  'user.warned': { verb: 'a averti', icon: Warning, tone: 'warned' },
  'user.suspended': { verb: 'a suspendu', icon: UserMinus, tone: 'suspended' },
  'user.banned': { verb: 'a banni', icon: Prohibit, tone: 'banned' },
  'user.active': { verb: 'a rétabli le compte de', icon: CheckCircle, tone: 'ok' },
  'report.resolved': { verb: 'a traité les signalements sur', icon: CheckCircle, tone: 'ok' },
  'report.dismissed': { verb: 'a classé sans suite les signalements sur', icon: XCircle },
  'activity.cancel': { verb: 'a annulé la sortie', icon: Prohibit, tone: 'suspended' },
  'activity.messages.view': { verb: 'a lu la discussion de la sortie', icon: ChatsCircle },
  'report.context.view': { verb: 'a lu la conversation privée entre', icon: Eye },
  'session.open': { verb: 's’est connecté·e à l’admin', icon: SignIn },
};

const TARGET_NOUNS: Record<string, string> = {
  user: 'un compte',
  activity: 'une sortie',
  message: 'un message',
  conversation: 'une conversation',
};

export function AuditPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const audit = useAudit({ kind: search.kind, page: search.page });
  const items = audit.data?.items ?? [];

  // Regroupées par jour, du plus récent au plus ancien.
  const days: { day: string; entries: AuditEntry[] }[] = [];
  for (const entry of items) {
    const day = formatDate(entry.createdAt);
    const last = days.at(-1);
    if (last?.day === day) last.entries.push(entry);
    else days.push({ day, entries: [entry] });
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Journal de l’équipe</h1>
          <p>Toutes les décisions, les lectures de conversations et les connexions à l’admin.</p>
        </div>
      </div>
      <div className="toolbar">
        <Segmented
          label="Type d’action"
          value={search.kind}
          onChange={(kind) => navigate({ search: { kind, page: 1 } })}
          options={[
            { value: 'all', label: 'Tout' },
            { value: 'decisions', label: 'Décisions' },
            { value: 'reads', label: 'Lectures' },
            { value: 'logins', label: 'Connexions' },
          ]}
        />
      </div>

      {audit.error ? <ErrorBox error={audit.error} /> : null}
      {audit.isPending ? (
        <SkeletonRows rows={8} height={56} />
      ) : items.length === 0 ? (
        <div className="panel">
          <Empty icon={<ClipboardText size={40} weight="duotone" />} title="Rien dans le journal">
            Les actions de l’équipe apparaîtront ici au fur et à mesure.
          </Empty>
        </div>
      ) : (
        <>
          {days.map(({ day, entries }) => (
            <section key={day} className="audit-day">
              <h2>{day}</h2>
              <ol className="audit-list">
                {entries.map((e) => (
                  <AuditRow key={e.id} entry={e} />
                ))}
              </ol>
            </section>
          ))}
          <Pager
            page={search.page}
            pageSize={ADMIN_PAGE_SIZE}
            total={audit.data?.total ?? 0}
            noun={['action', 'actions']}
            onPage={(page) => navigate({ search: (s) => ({ ...s, page }) })}
          />
        </>
      )}
    </>
  );
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const action = ACTIONS[entry.action] ?? { verb: entry.action, icon: ClipboardText };
  const ActionIcon = action.icon;
  const details = entry.details ?? {};
  const reason = typeof details.reason === 'string' ? details.reason : null;
  const note = typeof details.note === 'string' ? details.note : null;
  const days = typeof details.days === 'number' ? details.days : null;

  return (
    <li className="audit-row">
      <span className="audit-icon" data-tone={action.tone}>
        <ActionIcon size={18} weight="bold" />
      </span>
      <div className="audit-text">
        <p>
          <span className="audit-actor">
            <Avatar name={entry.actor?.firstName ?? null} url={null} size={22} />
            <strong>{entry.actor ? displayName(entry.actor.firstName) : 'Compte supprimé'}</strong>
          </span>{' '}
          {action.verb}
          {entry.action === 'session.open' ? null : <> {target(entry)}</>}
          {days ? ` pour ${days === 1 ? '1 jour' : `${days} jours`}` : null}
        </p>
        {reason || note ? <p className="audit-quote">{reason ?? note}</p> : null}
      </div>
      <time className="audit-time" dateTime={entry.createdAt}>
        {formatTime(entry.createdAt)}
      </time>
    </li>
  );
}

function target(entry: AuditEntry): ReactNode {
  const label = entry.targetLabel ?? TARGET_NOUNS[entry.targetType] ?? 'un élément supprimé';
  if (entry.targetLabel && entry.targetType === 'user') {
    return (
      <Link to="/users/$id" params={{ id: entry.targetId }} className="audit-target">
        {label}
      </Link>
    );
  }
  if (entry.targetLabel && entry.targetType === 'activity') {
    return (
      <Link to="/activities/$id" params={{ id: entry.targetId }} className="audit-target">
        « {label} »
      </Link>
    );
  }
  return <strong>{label}</strong>;
}
