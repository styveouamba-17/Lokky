import { ArrowLeft, Envelope, ShieldCheck, WarningCircle } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, errorMessage } from '@/api/client';
import { meQuery } from '@/api/queries';

const CODE_LENGTH = 6;
// Le serveur accepte un nouveau code par minute et par adresse.
const RESEND_SECONDS = 60;

type Step = { kind: 'email' } | { kind: 'code'; email: string };

// Connexion de l'équipe : code reçu par email, comme dans l'app. Le message ne dit jamais si
// l'adresse fait partie de l'équipe.
export function LoginPage() {
  const [step, setStep] = useState<Step>({ kind: 'email' });
  const [email, setEmail] = useState('');

  return (
    <div className="login">
      <section className="login-art" aria-hidden>
        <img
          src="/login-corniche-1600.webp"
          srcSet="/login-corniche-900.webp 900w, /login-corniche-1600.webp 1600w"
          sizes="(max-width: 900px) 100vw, 60vw"
          alt=""
        />
        <div className="login-art-text">
          <h1>Veiller sur la communauté, ensemble</h1>
          <p>Signalements, comptes et sorties : l’espace de l’équipe pour que Lokky reste sûr.</p>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-brand">
          <img src="/logo.svg" alt="" />
          Lokky
          <span>Équipe</span>
        </div>
        <div className="login-body">
          {step.kind === 'email' ? (
            <EmailStep
              email={email}
              onEmail={setEmail}
              onSent={(sent) => setStep({ kind: 'code', email: sent })}
            />
          ) : (
            <CodeStep email={step.email} onBack={() => setStep({ kind: 'email' })} />
          )}
        </div>
        <p className="login-foot">
          <ShieldCheck size={16} />
          Accès réservé à l’équipe Lokky. Chaque décision est inscrite au journal.
        </p>
      </section>
    </div>
  );
}

function EmailStep({
  email,
  onEmail,
  onSent,
}: {
  email: string;
  onEmail: (email: string) => void;
  onSent: (email: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('admin.auth.start', { email });
      onSent(email.trim().toLowerCase());
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div>
        <p className="login-step">Étape 1 sur 2</p>
        <h2>Connexion</h2>
        <p className="login-lead">
          Entre l’adresse de ton compte Lokky : tu recevras un code à 6 chiffres.
        </p>
      </div>
      <label className="field">
        <span>Adresse email</span>
        <div className="input-icon">
          <Envelope size={19} />
          <input
            className="input"
            type="email"
            autoComplete="email"
            placeholder="prenom@exemple.com"
            required
            autoFocus
            value={email}
            onChange={(e) => onEmail(e.target.value)}
          />
        </div>
      </label>
      {error ? <Alert message={error} /> : null}
      <button className="btn btn-primary btn-lg" disabled={busy || !email.includes('@')}>
        {busy ? <span className="spinner" aria-label="Envoi en cours" /> : 'Recevoir un code'}
      </button>
    </form>
  );
}

function CodeStep({ email, onBack }: { email: string; onBack: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [wait, setWait] = useState(RESEND_SECONDS);
  const client = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const verify = async (value: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const staff = await api('admin.auth.verify', { email, code: value });
      client.setQueryData(meQuery().queryKey, staff);
      await navigate({ to: '/reports' });
    } catch (e) {
      setError(errorMessage(e));
      setCode('');
      setBusy(false);
    }
  };

  const change = (value: string) => {
    setCode(value);
    if (error) setError(null);
    // Dernier chiffre tapé ou code collé : on vérifie sans attendre le bouton.
    if (value.length === CODE_LENGTH && !busy) void verify(value);
  };

  const resend = async () => {
    setError(null);
    setNotice(null);
    try {
      await api('admin.auth.start', { email });
      setWait(RESEND_SECONDS);
      setCode('');
      setNotice('Nouveau code envoyé.');
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (code.length === CODE_LENGTH) void verify(code);
  };

  return (
    <form onSubmit={submit}>
      <div>
        <p className="login-step">Étape 2 sur 2</p>
        <h2>Vérifie tes emails</h2>
        <p className="login-lead">
          Si <strong>{email}</strong> fait partie de l’équipe, un code vient d’y arriver. Il est
          valable 10 minutes.
        </p>
      </div>
      <CodeInput value={code} onChange={change} error={Boolean(error)} disabled={busy} />
      {error ? <Alert message={error} /> : null}
      {notice ? (
        <p className="login-lead" role="status">
          {notice}
        </p>
      ) : null}
      <button className="btn btn-primary btn-lg" disabled={busy || code.length !== CODE_LENGTH}>
        {busy ? <span className="spinner" aria-label="Vérification en cours" /> : 'Se connecter'}
      </button>
      <div className="login-links">
        <button type="button" className="link-btn" onClick={onBack}>
          <ArrowLeft size={15} />
          Changer d’adresse
        </button>
        <button type="button" className="link-btn" disabled={wait > 0} onClick={resend}>
          {wait > 0 ? `Renvoyer le code dans ${wait} s` : 'Renvoyer le code'}
        </button>
      </div>
    </form>
  );
}

// Un seul champ invisible par-dessus les cases : collage, remplissage automatique du
// navigateur et effacement fonctionnent comme dans un champ normal.
function CodeInput({
  value,
  onChange,
  error,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  error: boolean;
  disabled: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(true);

  // Après une vérification (code refusé), le champ reprend la main pour retaper.
  useEffect(() => {
    if (!disabled) input.current?.focus();
  }, [disabled]);

  return (
    <div className="code" data-error={error}>
      <input
        ref={input}
        aria-label="Code de connexion à 6 chiffres"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        disabled={disabled}
        value={value}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))}
      />
      <div className="code-cells" aria-hidden>
        {Array.from({ length: CODE_LENGTH }, (_, i) => (
          <span
            key={i}
            className="code-cell"
            data-active={focused && !disabled && i === Math.min(value.length, CODE_LENGTH - 1)}
          >
            {value[i] ?? ''}
          </span>
        ))}
      </div>
    </div>
  );
}

function Alert({ message }: { message: string }) {
  return (
    <p className="login-alert" role="alert">
      <WarningCircle size={18} weight="bold" />
      {message}
    </p>
  );
}
