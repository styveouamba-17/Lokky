import type { ModerationEvent } from '@lokky/shared/admin';
import { formatDate, formatDateTime } from '@/lib/format';
import { displayName } from '@/lib/labels';
import { ModerationBadge } from '@/ui';

export function ModerationHistory({ events }: { events: ModerationEvent[] }) {
  if (events.length === 0) return <p className="muted">Aucune décision pour ce compte.</p>;
  return (
    <ul className="list">
      {events.map((e) => (
        <li key={e.id}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <ModerationBadge status={e.status} />
            {e.until ? <span className="small muted">jusqu’au {formatDate(e.until)}</span> : null}
            <span className="small muted" style={{ marginLeft: 'auto' }}>
              {formatDateTime(e.createdAt)}
            </span>
          </div>
          {e.reason ? <p style={{ marginTop: 4 }}>{e.reason}</p> : null}
          <p className="small muted">
            {e.actor ? `Par ${displayName(e.actor.firstName)}` : 'En ligne de commande'}
          </p>
        </li>
      ))}
    </ul>
  );
}
