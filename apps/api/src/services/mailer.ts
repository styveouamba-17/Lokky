// Envoi des emails (codes de connexion). Resend en production ; en développement sans clé,
// le code s'affiche dans les journaux du serveur.
export interface Mailer {
  sendLoginCode(to: string, code: string): Promise<void>;
}

const subject = (code: string) => `${code} est ton code Lokky`;
const text = (code: string) =>
  `Salut !\n\nTon code de connexion Lokky : ${code}\nIl est valable 10 minutes.\n\n` +
  `Si tu n'as rien demandé, ignore simplement cet email.\n\nL'équipe Lokky`;

export function createResendMailer({ apiKey, from }: { apiKey: string; from: string }): Mailer {
  return {
    async sendLoginCode(to, code) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, subject: subject(code), text: text(code) }),
      });
      if (!res.ok) throw new Error(`Resend a refusé l'envoi (${res.status}).`);
    },
  };
}

// Développement uniquement : jamais utilisé en production (RESEND_API_KEY y est obligatoire).
export function createConsoleMailer(): Mailer {
  return {
    async sendLoginCode(to, code) {
      console.warn(
        `[email non envoyé : RESEND_API_KEY absente] code de connexion pour ${to} : ${code}`,
      );
    },
  };
}
