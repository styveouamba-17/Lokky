import type { ModerationStatus } from '@lokky/shared';
import {
  MODERATION_REASON_MIN,
  NOTE_MAX,
  type AdminUserRow,
  type Staff,
} from '@lokky/shared/admin';
import { useRouteContext } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { errorMessage } from '@/api/client';
import { useModerateUser } from '@/api/queries';
import { displayName, MODERATION_ACTIONS } from '@/lib/labels';
import { Dialog, useToast } from '@/ui';

const DURATIONS = [1, 3, 7, 30] as const;

const DONE: Record<ModerationStatus, string> = {
  active: 'Compte rétabli',
  warned: 'Avertissement envoyé',
  suspended: 'Compte suspendu',
  banned: 'Compte banni',
};

// Décisions possibles selon l'état du compte et le rôle (les règles sont revérifiées par l'API).
export function availableActions(
  user: Pick<AdminUserRow, 'id' | 'role' | 'moderation'>,
  staff: Staff,
): ModerationStatus[] {
  if (user.id === staff.id) return [];
  const isAdmin = staff.role === 'admin';
  if (user.role && !isAdmin) return [];
  const current = user.moderation.status;
  if (current === 'banned') return isAdmin ? ['active'] : [];
  const all: ModerationStatus[] = ['warned', 'suspended', 'banned', 'active'];
  return all.filter(
    // Un nouvel avertissement reste possible : l'app affiche chaque avertissement une fois.
    (s) =>
      (s !== 'banned' || isAdmin) &&
      (s !== 'active' || current !== 'active') &&
      (s !== current || s === 'warned'),
  );
}

export function ModerationDialog({
  user,
  initial,
  defaultReason = '',
  onClose,
  onDone,
}: {
  user: AdminUserRow;
  initial: ModerationStatus;
  defaultReason?: string;
  onClose: () => void;
  onDone?: () => void;
}) {
  const { staff } = useRouteContext({ from: '/app' });
  const actions = availableActions(user, staff);
  const [status, setStatus] = useState<ModerationStatus>(initial);
  const [days, setDays] = useState<number>(3);
  const [reason, setReason] = useState(defaultReason);
  const moderate = useModerateUser();
  const toast = useToast();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    moderate.mutate(
      { id: user.id, status, reason, days: status === 'suspended' ? days : undefined },
      {
        onSuccess: () => {
          toast(DONE[status]);
          onDone?.();
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open onClose={onClose} label={`Décision pour ${displayName(user.firstName)}`}>
      <form onSubmit={submit}>
        <div>
          <h2>Décision pour {displayName(user.firstName)}</h2>
          <p className="muted small">La personne est prévenue tout de suite dans l’app.</p>
        </div>
        <fieldset className="choices" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="visually-hidden">Décision</legend>
          {actions.map((a) => (
            <label key={a} className="choice">
              <input
                type="radio"
                name="status"
                value={a}
                checked={status === a}
                onChange={() => setStatus(a)}
              />
              <div>
                <strong>{MODERATION_ACTIONS[a].label}</strong>
                <span>{MODERATION_ACTIONS[a].effect}</span>
              </div>
            </label>
          ))}
        </fieldset>
        {status === 'suspended' ? (
          <label className="field">
            <span>Durée</span>
            <select
              className="select"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d === 1 ? '1 jour' : `${d} jours`}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="field">
          <span>Motif (gardé dans l’historique du compte)</span>
          <textarea
            className="textarea"
            required
            minLength={MODERATION_REASON_MIN}
            maxLength={NOTE_MAX}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ce qui justifie la décision"
          />
        </label>
        {moderate.error ? (
          <p className="field-error" role="alert">
            {errorMessage(moderate.error)}
          </p>
        ) : null}
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            className={
              status === 'active' || status === 'warned' ? 'btn btn-primary' : 'btn btn-danger'
            }
            disabled={moderate.isPending || reason.trim().length < MODERATION_REASON_MIN}
          >
            {MODERATION_ACTIONS[status].label}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
