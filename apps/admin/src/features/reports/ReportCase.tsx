import type { ModerationStatus } from '@lokky/shared';
import { NOTE_MAX, type AdminReport, type AdminReportDetail } from '@lokky/shared/admin';
import { ArrowSquareOut, CalendarDots, Eye, Flag, User } from '@phosphor-icons/react';
import { Link, useRouteContext } from '@tanstack/react-router';
import { useState } from 'react';
import { errorMessage } from '@/api/client';
import { useReport, useResolveReport } from '@/api/queries';
import { formatDateTime, formatRelative, formatTime, plural } from '@/lib/format';
import {
  displayName,
  MODERATION_ACTIONS,
  REASON_LABELS,
  REPORT_STATUS_LABELS,
  TARGET_LABELS,
} from '@/lib/labels';
import { Badge, ErrorBox, ModerationBadge, Person, SkeletonRows, useToast } from '@/ui';
import { availableActions, ModerationDialog } from '../users/ModerationDialog';
import { ModerationHistory } from '../users/ModerationHistory';

// Dossier d'un signalement : le contenu tel que la personne l'a vu, le compte concerné et
// son passé, puis la décision.
export function ReportCase({
  id,
  onDecided,
}: {
  id: string;
  onDecided: (report: AdminReport) => void;
}) {
  const report = useReport(id);
  if (report.error) return <ErrorBox error={report.error} />;
  if (!report.data) return <SkeletonRows rows={4} height={120} />;
  return <CaseFile key={id} report={report.data} onDecided={onDecided} />;
}

function CaseFile({
  report,
  onDecided,
}: {
  report: AdminReportDetail;
  onDecided: (report: AdminReport) => void;
}) {
  const { staff } = useRouteContext({ from: '/app' });
  const [dialog, setDialog] = useState<ModerationStatus | null>(null);
  const concerned = report.concernedUser;
  const actions = concerned && !concerned.deletedAt ? availableActions(concerned, staff) : [];

  return (
    <article aria-label="Dossier du signalement">
      <section className="panel">
        <div className="case-head">
          <div>
            <h2>{REASON_LABELS[report.reason]}</h2>
            <div className="case-meta">
              <span>
                <Flag size={15} />
                {TARGET_LABELS[report.target.type]} signalé
                {report.reporter ? ` par ${report.reporter.firstName}` : ''}
              </span>
              <span>{formatDateTime(report.createdAt)}</span>
              {report.sameTargetOpen > 1 ? (
                <span className="repeat">
                  {plural(report.sameTargetOpen, 'signalement ouvert', 'signalements ouverts')} sur
                  ce contenu
                </span>
              ) : null}
            </div>
          </div>
          {report.status !== 'open' ? (
            <Badge tone={report.status === 'resolved' ? 'ok' : undefined}>
              {REPORT_STATUS_LABELS[report.status]}
            </Badge>
          ) : null}
        </div>
        {report.details ? <p className="quote">{report.details}</p> : null}
      </section>

      <section className="panel">
        <TargetView report={report} />
      </section>

      {concerned ? (
        <section className="panel">
          <div className="panel-head">
            <h2>Compte concerné</h2>
            <Link to="/users/$id" params={{ id: concerned.id }} className="btn btn-sm btn-ghost">
              Voir la fiche
              <ArrowSquareOut size={15} />
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Person
              name={concerned.firstName}
              url={concerned.avatarUrl}
              size={44}
              sub={`Inscrit ${formatRelative(concerned.createdAt)}`}
            />
            <ModerationBadge
              status={concerned.moderation.status}
              until={concerned.moderation.suspendedUntil}
            />
            {concerned.openReports > 1 ? (
              <Badge tone="brand">
                {plural(concerned.openReports, 'signalement ouvert', 'signalements ouverts')}
              </Badge>
            ) : null}
            {concerned.deletedAt ? <Badge>Compte supprimé</Badge> : null}
          </div>
          {actions.length ? (
            <div
              className="decision-actions"
              style={{ justifyContent: 'flex-start', marginTop: 14 }}
            >
              {actions.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={
                    a === 'suspended' || a === 'banned' ? 'btn btn-sm btn-danger' : 'btn btn-sm'
                  }
                  onClick={() => setDialog(a)}
                >
                  {MODERATION_ACTIONS[a].label}
                </button>
              ))}
            </div>
          ) : null}
          {report.concernedHistory.length ? (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ marginBottom: 8 }}>Décisions passées</h3>
              <ModerationHistory events={report.concernedHistory} />
            </div>
          ) : null}
        </section>
      ) : null}

      {report.related.length ? (
        <section className="panel">
          <h2 style={{ marginBottom: 10 }}>Autres signalements sur ce contenu</h2>
          <ul className="list">
            {report.related.map((r) => (
              <li key={r.id} style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                <div>
                  <strong>{REASON_LABELS[r.reason]}</strong>
                  {r.details ? <p className="muted small">{r.details}</p> : null}
                </div>
                <div className="small muted nowrap" style={{ textAlign: 'right' }}>
                  {formatRelative(r.createdAt)}
                  <br />
                  {REPORT_STATUS_LABELS[r.status]}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {report.status === 'open' ? (
        <Decision report={report} onDecided={onDecided} />
      ) : (
        <section className="panel">
          <p>
            {REPORT_STATUS_LABELS[report.status]}
            {report.handledBy ? ` par ${displayName(report.handledBy.firstName)}` : ''}
            {report.handledAt ? `, ${formatRelative(report.handledAt)}` : ''}.
          </p>
          {report.note ? <p className="quote">{report.note}</p> : null}
        </section>
      )}

      {dialog && concerned ? (
        <ModerationDialog
          user={concerned}
          initial={dialog}
          defaultReason={`Signalement : ${REASON_LABELS[report.reason]}`}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </article>
  );
}

function TargetView({ report }: { report: AdminReportDetail }) {
  const { target } = report;
  if (target.type === 'message') {
    if (!target.message) return <p className="muted">Ce message a été supprimé depuis.</p>;
    const where = target.message.activity
      ? `dans le groupe « ${target.message.activity.title} »`
      : 'dans une conversation privée';
    return (
      <>
        <div className="panel-head">
          <h2>Message {where}</h2>
          {target.message.activity ? (
            <Link
              to="/activities/$id"
              params={{ id: target.message.activity.id }}
              className="btn btn-sm btn-ghost"
            >
              Voir la sortie
              <ArrowSquareOut size={15} />
            </Link>
          ) : null}
        </div>
        {target.message.conversationType === 'direct' ? (
          <p className="notice" style={{ marginBottom: 12 }}>
            <Eye size={16} />
            Conversation privée : ta consultation de ce contexte est inscrite au journal de
            l’équipe.
          </p>
        ) : null}
        <Thread messages={report.context} flaggedId={target.message.id} />
      </>
    );
  }
  if (target.type === 'user') {
    if (!target.user) return <p className="muted">Ce compte n’existe plus.</p>;
    return (
      <div className="panel-head" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <User size={20} />
          <h2>Profil signalé</h2>
        </div>
        <Person name={target.user.firstName} url={target.user.avatarUrl} size={36} />
      </div>
    );
  }
  if (!target.activity) return <p className="muted">Cette sortie n’existe plus.</p>;
  return (
    <div className="panel-head" style={{ marginBottom: 0 }}>
      <div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <CalendarDots size={20} />
          <h2>{target.activity.title}</h2>
        </div>
        <p className="muted small" style={{ marginTop: 4 }}>
          Organisée par {target.activity.creator.firstName}, le{' '}
          {formatDateTime(target.activity.startsAt)}
          {target.activity.cancelledAt ? ' (annulée)' : ''}
        </p>
      </div>
      <Link to="/activities/$id" params={{ id: target.activity.id }} className="btn btn-sm">
        Ouvrir la sortie
      </Link>
    </div>
  );
}

export function Thread({
  messages,
  flaggedId,
}: {
  messages: AdminReportDetail['context'];
  flaggedId?: string;
}) {
  if (messages.length === 0) return <p className="muted">Aucun message.</p>;
  return (
    <div className="thread">
      {messages.map((m) =>
        m.type === 'system' ? (
          <p key={m.id} className="system-line">
            {m.body}
          </p>
        ) : (
          <div key={m.id} className="bubble" data-flagged={m.id === flaggedId}>
            <span className="bubble-meta">
              {m.sender?.firstName ?? 'Compte supprimé'}, {formatTime(m.createdAt)}
              {m.id === flaggedId ? ' (message signalé)' : ''}
            </span>
            <span className="bubble-body">{m.body}</span>
          </div>
        ),
      )}
    </div>
  );
}

function Decision({
  report,
  onDecided,
}: {
  report: AdminReportDetail;
  onDecided: (report: AdminReport) => void;
}) {
  const [note, setNote] = useState('');
  const resolve = useResolveReport();
  const toast = useToast();
  const others = report.sameTargetOpen - 1;

  const decide = (status: 'resolved' | 'dismissed') =>
    resolve.mutate(
      { id: report.id, status, note: note.trim() || undefined },
      {
        onSuccess: ({ updated }) => {
          toast(
            status === 'resolved'
              ? `${plural(updated, 'signalement traité', 'signalements traités')}`
              : `${plural(updated, 'signalement classé', 'signalements classés')} sans suite`,
          );
          onDecided(report);
        },
      },
    );

  return (
    <section className="panel decision">
      <h2>Clore le signalement</h2>
      <label className="field">
        <span>Note pour l’équipe (facultatif)</span>
        <textarea
          className="textarea"
          maxLength={NOTE_MAX}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ce qui a été décidé, et pourquoi"
        />
      </label>
      {others > 0 ? (
        <p className="muted small">
          Clôt aussi {plural(others, 'autre signalement ouvert', 'autres signalements ouverts')} sur
          ce contenu.
        </p>
      ) : null}
      {resolve.error ? (
        <p className="field-error" role="alert">
          {errorMessage(resolve.error)}
        </p>
      ) : null}
      <div className="decision-actions">
        <button
          type="button"
          className="btn"
          disabled={resolve.isPending}
          onClick={() => decide('dismissed')}
        >
          Classer sans suite
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={resolve.isPending}
          onClick={() => decide('resolved')}
        >
          Marquer comme traité
        </button>
      </div>
    </section>
  );
}
