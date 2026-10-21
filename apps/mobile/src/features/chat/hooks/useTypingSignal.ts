import { useCallback, useEffect, useMemo, useRef } from 'react';
import { realtime } from '@/api/client';

// Relance « j'écris » au plus toutes les 3 s : en dessous du délai d'effacement côté
// destinataire (6 s, useChatRealtime), donc l'indicateur ne clignote pas.
export const TYPING_RESEND_MS = 3000;
// Sans frappe depuis 4 s, on prévient que la saisie s'est arrêtée.
export const TYPING_IDLE_MS = 4000;

// Signale aux autres membres de la conversation que l'utilisateur est en train d'écrire.
export function useTypingSignal(conversationId: string) {
  const lastSentAt = useRef(0);
  const active = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = null;
    lastSentAt.current = 0;
    if (!active.current) return;
    active.current = false;
    if (realtime.isConnected()) realtime.emit('typing', { conversationId, isTyping: false });
  }, [conversationId]);

  const onTextChange = useCallback(
    (text: string) => {
      if (text.trim().length === 0) return stop();
      // Hors connexion, Socket.IO mettrait l'événement en file : il arriverait périmé.
      if (!realtime.isConnected()) return;
      const now = Date.now();
      if (!active.current || now - lastSentAt.current >= TYPING_RESEND_MS) {
        realtime.emit('typing', { conversationId, isTyping: true });
        active.current = true;
        lastSentAt.current = now;
      }
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(stop, TYPING_IDLE_MS);
    },
    [conversationId, stop],
  );

  // Quitter la conversation arrête la saisie.
  useEffect(() => stop, [stop]);

  return useMemo(() => ({ onTextChange, stop }), [onTextChange, stop]);
}
