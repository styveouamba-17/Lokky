import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/ui';
import { API_BASE } from './client';
import { useOpenReportCount } from './queries';

const TITLE = 'Lokky Admin';

// Signalements à traiter, en direct (flux /admin/events). Quand le nombre change, les listes
// de signalements et les statistiques se rechargent ; un nouveau signalement est annoncé.
// Le nombre apparaît aussi dans le titre de l'onglet, visible même sur un autre onglet.
export function useLiveOpenReports(): number | undefined {
  const initial = useOpenReportCount();
  const [live, setLive] = useState<number | undefined>(undefined);
  const previous = useRef<number | undefined>(undefined);
  const client = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    const source = new EventSource(`${API_BASE}/admin/events`);
    source.addEventListener('reports', (event) => {
      const { open } = JSON.parse((event as MessageEvent<string>).data) as { open: number };
      if (previous.current !== undefined && open > previous.current) {
        toast(open - previous.current > 1 ? 'Nouveaux signalements' : 'Nouveau signalement');
      }
      if (previous.current !== undefined && open !== previous.current) {
        void client.invalidateQueries({
          predicate: (q) =>
            String(q.queryKey[0]).startsWith('admin.reports') || q.queryKey[0] === 'admin.stats',
        });
      }
      previous.current = open;
      setLive(open);
    });
    return () => source.close();
  }, [client, toast]);

  const count = live ?? initial.data;
  useEffect(() => {
    document.title = count ? `(${count}) ${TITLE}` : TITLE;
  }, [count]);
  return count;
}
