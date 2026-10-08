import { MODERATION_REASON_MIN, NOTE_MAX, type AdminActivityDetail } from '@lokky/shared/admin';
import { ArrowLeft, ChatsCircle, Eye, MapPin, Prohibit } from '@phosphor-icons/react';
import { getRouteApi, Link } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { errorMessage } from '@/api/client';
import { useActivity, useActivityMessages, useCancelActivity } from '@/api/queries';
import { formatDateTime, formatNumber, plural } from '@/lib/format';
import {
  ACTIVITY_STATUS_LABELS,
  CATEGORY_LABELS,
  neighborhoodName,
  REASON_LABELS,
  REPORT_STATUS_LABELS,
} from '@/lib/labels';
import { Badge, Dialog, ErrorBox, Pager, Person, SkeletonRows, useToast } from '@/ui';
import { Thread } from '../reports/ReportCase';
import { CategoryIcon } from './CategoryIcon';

const route = getRouteApi('/app/activities/$id');

export function ActivityPage() {
  const { id } = route.useParams();
  const activity = useActivity(id);
  return (
    <>
      <Link to="/activities" className="back">
        <ArrowLeft size={16} />
        Sorties
      </Link>
      {activity.error ? <ErrorBox error={activity.error} /> : null}
      {activity.data ? (
        <ActivityFile activity={activity.data} />
      ) : activity.isPending ? (
        <SkeletonRows rows={5} height={90} />
      ) : null}
    </>
  );
}

function ActivityFile({ activity }: { activity: AdminActivityDetail }) {
  const [cancelling, setCancelling] = useState(false);
  const cost =
    activity.costType === 'free'
      ? 'Gratuit'
      : `Partagé${activity.costEstimateFcfa ? `, environ ${formatNumber(activity.costEstimateFcfa)} FCFA` : ''}`;

  return (
    <>
      <div className="page-head">
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <CategoryIcon category={activity.category} size={48} />
          <div>
            <h1>{activity.title}</h1>
            <p>
              {CATEGORY_LABELS[activity.category]}, {formatDateTime(activity.startsAt)}
            </p>
          </div>
        </div>
        <div className="decision-actions">
          <Badge tone={activity.status === 'cancelled' ? 'suspended' : undefined}>
            {ACTIVITY_STATUS_LABELS[activity.status]}
          </Badge>
          {activity.status === 'upcoming' ? (
            <button type="button" className="btn btn-danger" onClick={() => setCancelling(true)}>
              <Prohibit size={17} />
              Annuler la sortie
            </button>
          ) : null}
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <section className="panel">
            <h2 style={{ marginBottom: 8 }}>Description</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>
              {activity.description || <span className="muted">Pas de description.</span>}
            </p>
          </section>

          {activity.reports.length ? (
            <section className="panel">
              <h2 style={{ marginBottom: 10 }}>Signalements</h2>
              <ul className="list">
                {activity.reports.map((r) => (
                  <li key={r.id}>
                    <Link
                      to="/reports"
                      search={{ status: r.status, page: 1, id: r.id }}
                      style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}
                    >
                      <div>
                        <strong>{REASON_LABELS[r.reason]}</strong>
                        {r.details ? <p className="small muted">{r.details}</p> : null}
                      </div>
                      <span className="small muted nowrap">{REPORT_STATUS_LABELS[r.status]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <ChatPanel activity={activity} />
        </div>

        <aside>
          <section className="panel">
            <dl className="facts">
              <dt>Lieu</dt>
              <dd>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${activity.lat}&mlon=${activity.lng}#map=17/${activity.lat}/${activity.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    gap: 4,
                    alignItems: 'center',
                    color: 'var(--accent)',
                  }}
                >
                  <MapPin size={15} />
                  {activity.placeName}
                </a>
              </dd>
              <dt>Quartier</dt>
              <dd>{neighborhoodName(activity.neighborhood)}</dd>
              {activity.meetingPoint ? (
                <>
                  <dt>Point de RDV</dt>
                  <dd>{activity.meetingPoint}</dd>
                </>
              ) : null}
              <dt>Coût</dt>
              <dd>{cost}</dd>
              <dt>Publiée le</dt>
              <dd>{formatDateTime(activity.createdAt)}</dd>
              {activity.cancelledAt ? (
                <>
                  <dt>Annulée le</dt>
                  <dd>{formatDateTime(activity.cancelledAt)}</dd>
                </>
              ) : null}
            </dl>
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2>Participants</h2>
              <span className="muted">
                {activity.participantCount} / {activity.capacity}
              </span>
            </div>
            <ul className="list">
              {activity.participants.map((p) => (
                <li key={p.id}>
                  <Link to="/users/$id" params={{ id: p.id }}>
                    <Person
                      name={p.firstName}
                      url={p.avatarUrl}
                      sub={
                        p.isCreator
                          ? 'Organise la sortie'
                          : p.attended === null
                            ? `Inscrit le ${formatDateTime(p.joinedAt)}`
                            : p.attended
                              ? 'Présent'
                              : 'Absent'
                      }
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {cancelling ? (
        <CancelDialog activity={activity} onClose={() => setCancelling(false)} />
      ) : null}
    </>
  );
}

const CHAT_PAGE_SIZE = 50;

// Le chat ne s'affiche qu'à la demande : chaque lecture est inscrite au journal de l'équipe.
function ChatPanel({ activity }: { activity: AdminActivityDetail }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const messages = useActivityMessages(activity.id, page, open);
  if (!activity.conversationId) return null;

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Discussion du groupe</h2>
        <span className="muted">{plural(activity.messageCount, 'message', 'messages')}</span>
      </div>
      {!open ? (
        <div className="decision">
          <p className="notice">
            <Eye size={16} />
            Ouvre la discussion seulement si un signalement le justifie : ta lecture est inscrite au
            journal de l’équipe.
          </p>
          <div>
            <button type="button" className="btn" onClick={() => setOpen(true)}>
              <ChatsCircle size={17} />
              Lire la discussion
            </button>
          </div>
        </div>
      ) : messages.error ? (
        <ErrorBox error={messages.error} />
      ) : !messages.data ? (
        <SkeletonRows rows={4} />
      ) : (
        <>
          {/* L'API renvoie les plus récents d'abord ; on lit de haut en bas. */}
          <Thread messages={[...messages.data.items].reverse()} />
          <Pager
            page={page}
            pageSize={CHAT_PAGE_SIZE}
            total={messages.data.total}
            noun={['message', 'messages']}
            onPage={setPage}
          />
        </>
      )}
    </section>
  );
}

function CancelDialog({
  activity,
  onClose,
}: {
  activity: AdminActivityDetail;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const cancel = useCancelActivity();
  const toast = useToast();
  const others = activity.participantCount - 1;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    cancel.mutate(
      { id: activity.id, reason },
      {
        onSuccess: () => {
          toast('Sortie annulée');
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open onClose={onClose} label="Annuler la sortie">
      <form onSubmit={submit}>
        <div>
          <h2>Annuler « {activity.title} » ?</h2>
          <p className="muted small" style={{ marginTop: 6 }}>
            {others > 0
              ? `${plural(others, 'participant est prévenu', 'participants sont prévenus')} par notification. `
              : ''}
            La sortie disparaît de Découvrir et sa discussion passe en lecture seule. C’est
            définitif.
          </p>
        </div>
        <label className="field">
          <span>Motif (gardé dans le journal de l’équipe)</span>
          <textarea
            className="textarea"
            required
            minLength={MODERATION_REASON_MIN}
            maxLength={NOTE_MAX}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Arnaque signalée, lieu dangereux…"
          />
        </label>
        {cancel.error ? (
          <p className="field-error" role="alert">
            {errorMessage(cancel.error)}
          </p>
        ) : null}
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Garder la sortie
          </button>
          <button
            className="btn btn-danger"
            disabled={cancel.isPending || reason.trim().length < MODERATION_REASON_MIN}
          >
            Annuler la sortie
          </button>
        </div>
      </form>
    </Dialog>
  );
}
