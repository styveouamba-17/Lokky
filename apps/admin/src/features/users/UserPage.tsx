import type { ModerationStatus } from '@lokky/shared';
import type { AdminUserDetail } from '@lokky/shared/admin';
import { AppleLogo, ArrowLeft, Envelope, GoogleLogo } from '@phosphor-icons/react';
import { getRouteApi, Link, useRouteContext } from '@tanstack/react-router';
import { useState } from 'react';
import { useUser } from '@/api/queries';
import { ageFrom, formatDate, formatDateTime, formatRelative, plural } from '@/lib/format';
import {
  ACTIVITY_STATUS_LABELS,
  CATEGORY_LABELS,
  MODERATION_ACTIONS,
  neighborhoodName,
  REASON_LABELS,
  REPORT_STATUS_LABELS,
  ROLE_LABELS,
  USER_STATUS_LABELS,
} from '@/lib/labels';
import { Badge, ErrorBox, ModerationBadge, Person, SkeletonRows } from '@/ui';
import { TARGET_ICONS, targetExcerpt } from '../reports/ReportsPage';
import { availableActions, ModerationDialog } from './ModerationDialog';
import { ModerationHistory } from './ModerationHistory';

const route = getRouteApi('/app/users/$id');

export function UserPage() {
  const { id } = route.useParams();
  const user = useUser(id);
  return (
    <>
      <Link to="/users" className="back">
        <ArrowLeft size={16} />
        Comptes
      </Link>
      {user.error ? <ErrorBox error={user.error} /> : null}
      {user.data ? (
        <UserFile user={user.data} />
      ) : user.isPending ? (
        <SkeletonRows rows={5} height={90} />
      ) : null}
    </>
  );
}

function UserFile({ user }: { user: AdminUserDetail }) {
  const { staff } = useRouteContext({ from: '/app' });
  const [dialog, setDialog] = useState<ModerationStatus | null>(null);
  const actions = user.deletedAt ? [] : availableActions(user, staff);
  const { trust } = user;

  return (
    <>
      <div className="page-head">
        <Person name={user.firstName} url={user.avatarUrl} size={56} sub={user.email} />
        <div className="decision-actions">
          {actions.map((a) => (
            <button
              key={a}
              type="button"
              className={a === 'suspended' || a === 'banned' ? 'btn btn-danger' : 'btn'}
              onClick={() => setDialog(a)}
            >
              {MODERATION_ACTIONS[a].label}
            </button>
          ))}
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <section className="panel">
            <div className="panel-head">
              <h2>Signalements reçus</h2>
              {user.openReports ? (
                <Badge tone="brand">{plural(user.openReports, 'ouvert', 'ouverts')}</Badge>
              ) : null}
            </div>
            {user.reportsReceived.length === 0 ? (
              <p className="muted">Personne n’a signalé ce compte ni ses contenus.</p>
            ) : (
              <ul className="list">
                {user.reportsReceived.map((r) => {
                  const TargetIcon = TARGET_ICONS[r.target.type];
                  return (
                    <li key={r.id}>
                      <Link
                        to="/reports"
                        search={{ status: r.status, page: 1, id: r.id }}
                        style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
                      >
                        <TargetIcon size={18} style={{ marginTop: 3, flex: 'none' }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <strong>{REASON_LABELS[r.reason]}</strong>
                          <p className="queue-excerpt">{targetExcerpt(r.target)}</p>
                        </div>
                        <div className="small muted nowrap" style={{ textAlign: 'right' }}>
                          {formatRelative(r.createdAt)}
                          <br />
                          {REPORT_STATUS_LABELS[r.status]}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="panel">
            <h2 style={{ marginBottom: 10 }}>Sorties</h2>
            {user.activities.length === 0 ? (
              <p className="muted">Aucune sortie créée ni rejointe.</p>
            ) : (
              <ul className="list">
                {user.activities.map((a) => (
                  <li key={a.id}>
                    <Link
                      to="/activities/$id"
                      params={{ id: a.id }}
                      style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}
                    >
                      <div>
                        <strong>{a.title}</strong>
                        <p className="small muted">
                          {a.role === 'creator' ? 'Organisée' : 'Rejointe'},{' '}
                          {CATEGORY_LABELS[a.category]}, {formatDateTime(a.startsAt)}
                        </p>
                      </div>
                      <Badge tone={a.status === 'cancelled' ? 'suspended' : undefined}>
                        {ACTIVITY_STATUS_LABELS[a.status]}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <h2 style={{ marginBottom: 10 }}>Historique de modération</h2>
            <ModerationHistory events={user.history} />
          </section>
        </div>

        <aside>
          <section className="panel">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {user.deletedAt ? (
                <Badge>Supprimé le {formatDate(user.deletedAt)}</Badge>
              ) : (
                <ModerationBadge
                  status={user.moderation.status}
                  until={user.moderation.suspendedUntil}
                />
              )}
              {user.role ? <Badge tone="ok">{ROLE_LABELS[user.role]}</Badge> : null}
            </div>
            <dl className="facts">
              <dt>Âge</dt>
              <dd>{user.birthDate ? `${ageFrom(user.birthDate)} ans` : 'Non renseigné'}</dd>
              <dt>Situation</dt>
              <dd>{user.status ? USER_STATUS_LABELS[user.status] : 'Non renseignée'}</dd>
              <dt>Quartier</dt>
              <dd>{neighborhoodName(user.neighborhood)}</dd>
              <dt>Inscription</dt>
              <dd>{formatDate(user.createdAt)}</dd>
              <dt>Connexion</dt>
              <dd style={{ display: 'flex', gap: 8 }}>
                <span title="Code par email">
                  <Envelope size={18} />
                </span>
                {user.providers.includes('apple') ? (
                  <span title="Apple">
                    <AppleLogo size={18} />
                  </span>
                ) : null}
                {user.providers.includes('google') ? (
                  <span title="Google">
                    <GoogleLogo size={18} />
                  </span>
                ) : null}
              </dd>
              <dt>Centres d’intérêt</dt>
              <dd>{user.interests.map((i) => CATEGORY_LABELS[i]).join(', ') || 'Aucun'}</dd>
            </dl>
          </section>
          <section className="panel">
            <h2 style={{ marginBottom: 10 }}>Confiance</h2>
            <dl className="facts">
              <dt>Sorties suivies</dt>
              <dd>{trust.activitiesAttended}</dd>
              <dt>Présence</dt>
              <dd>
                {trust.attendanceRate === null
                  ? 'Pas encore d’historique'
                  : `${Math.round(trust.attendanceRate * 100)} %`}
              </dd>
              <dt>Sorties organisées</dt>
              <dd>{trust.activitiesCreated}</dd>
              <dt>Note d’organisateur</dt>
              <dd>
                {trust.creatorRating === null
                  ? 'Aucun avis'
                  : `${trust.creatorRating.toFixed(1)} sur 5 (${plural(trust.creatorReviewCount, 'avis', 'avis')})`}
              </dd>
              <dt>Signalements faits</dt>
              <dd>{user.reportsMade}</dd>
            </dl>
          </section>
        </aside>
      </div>

      {dialog ? (
        <ModerationDialog user={user} initial={dialog} onClose={() => setDialog(null)} />
      ) : null}
    </>
  );
}
