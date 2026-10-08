import type { ModerationStatus } from '@lokky/shared';
import { CaretLeft, CaretRight, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { errorMessage } from '@/api/client';
import { formatDate, plural } from '@/lib/format';
import { MODERATION_LABELS } from '@/lib/labels';

export function Avatar({
  name,
  url,
  size = 32,
}: {
  name: string | null;
  url: string | null;
  size?: number;
}) {
  const style = { width: size, height: size, fontSize: size * 0.42 };
  if (url) return <img className="avatar" src={url} alt="" style={style} />;
  return (
    <span className="avatar" style={style} aria-hidden>
      {(name ?? '?').charAt(0).toUpperCase()}
    </span>
  );
}

export function Person({
  name,
  url,
  sub,
  size = 32,
}: {
  name: string | null;
  url: string | null;
  sub?: ReactNode;
  size?: number;
}) {
  return (
    <span className="person">
      <Avatar name={name} url={url} size={size} />
      <span className="person-text">
        <strong>{name ?? 'Profil incomplet'}</strong>
        {sub ? <span>{sub}</span> : null}
      </span>
    </span>
  );
}

export function ModerationBadge({
  status,
  until,
}: {
  status: ModerationStatus;
  until?: string | null;
}) {
  return (
    <span className="badge" data-tone={status}>
      {MODERATION_LABELS[status]}
      {status === 'suspended' && until ? ` jusqu’au ${formatDate(until)}` : null}
    </span>
  );
}

export function Badge({ tone, children }: { tone?: string; children: ReactNode }) {
  return (
    <span className="badge" data-tone={tone}>
      {children}
    </span>
  );
}

export function Empty({
  icon,
  title,
  children,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      {icon}
      <strong>{title}</strong>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

export function ErrorBox({ error }: { error: unknown }) {
  return (
    <div className="error-box" role="alert">
      <WarningCircle size={20} weight="bold" />
      {errorMessage(error)}
    </div>
  );
}

export function SkeletonRows({ rows = 6, height = 44 }: { rows?: number; height?: number }) {
  return (
    <div style={{ display: 'grid', gap: 8 }} aria-busy="true" aria-label="Chargement">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton" style={{ height }} />
      ))}
    </div>
  );
}

export function Pager({
  page,
  pageSize,
  total,
  noun,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  noun: [string, string];
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="pager">
      <span>
        {plural(total, noun[0], noun[1])}
        {pages > 1 ? `, page ${page} sur ${pages}` : null}
      </span>
      {pages > 1 ? (
        <div>
          <button
            className="btn btn-sm"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            aria-label="Page précédente"
          >
            <CaretLeft size={16} />
          </button>
          <button
            className="btn btn-sm"
            disabled={page >= pages}
            onClick={() => onPage(page + 1)}
            aria-label="Page suivante"
          >
            <CaretRight size={16} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Boîte de dialogue native (<dialog>) : focus, Échap et arrière-plan inerte gérés par le navigateur.
export function Dialog({
  open,
  onClose,
  children,
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog ref={ref} className="dialog" aria-label={label} onClose={onClose}>
      {open ? children : null}
    </dialog>
  );
}

// Confirmation brève après une action (« Compte suspendu »).
const ToastContext = createContext<(message: string) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((text: string) => {
    setMessage(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 3200);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      {message ? (
        <div className="toast" role="status">
          <CheckCircle size={18} weight="fill" />
          {message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
