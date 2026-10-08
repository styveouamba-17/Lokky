import { ADMIN_PAGE_SIZE } from '@lokky/shared/admin';
import { MagnifyingGlass, UsersThree } from '@phosphor-icons/react';
import { getRouteApi, useNavigate as useAppNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useUsers } from '@/api/queries';
import { formatDate } from '@/lib/format';
import { ROLE_LABELS } from '@/lib/labels';
import {
  Badge,
  Empty,
  ErrorBox,
  ModerationBadge,
  Pager,
  Person,
  Segmented,
  SkeletonRows,
} from '@/ui';

const route = getRouteApi('/app/users');

// Recherche tapée : envoyée après une courte pause, pas à chaque touche.
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function UsersPage() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const open = useAppNavigate();
  const [q, setQ] = useState(search.q ?? '');
  const debounced = useDebounced(q);

  useEffect(() => {
    if ((search.q ?? '') !== debounced) {
      void navigate({
        search: (s) => ({ ...s, q: debounced || undefined, page: 1 }),
        replace: true,
      });
    }
  }, [debounced, search.q, navigate]);

  const users = useUsers({ q: search.q, filter: search.filter, page: search.page });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Comptes</h1>
          <p>Les comptes avec des signalements ouverts apparaissent en premier.</p>
        </div>
      </div>
      <div className="toolbar">
        <label className="search">
          <MagnifyingGlass size={17} />
          <span className="visually-hidden">Rechercher un compte</span>
          <input
            className="input"
            type="search"
            placeholder="Prénom, email ou identifiant"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <Segmented
          label="Statut du compte"
          value={search.filter}
          onChange={(filter) => navigate({ search: (s) => ({ ...s, filter, page: 1 }) })}
          options={[
            { value: 'all', label: 'Tous' },
            { value: 'warned', label: 'Avertis' },
            { value: 'suspended', label: 'Suspendus' },
            { value: 'banned', label: 'Bannis' },
            { value: 'deleted', label: 'Supprimés' },
          ]}
        />
      </div>

      {users.error ? <ErrorBox error={users.error} /> : null}
      {users.isPending ? (
        <SkeletonRows rows={8} />
      ) : users.data?.items.length === 0 ? (
        <div className="panel">
          <Empty icon={<UsersThree size={40} weight="duotone" />} title="Aucun compte trouvé">
            Vérifie l’orthographe, ou cherche par adresse email.
          </Empty>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Compte</th>
                  <th>Statut</th>
                  <th className="num">Signalements ouverts</th>
                  <th>Inscription</th>
                </tr>
              </thead>
              <tbody>
                {users.data?.items.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => open({ to: '/users/$id', params: { id: u.id } })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void open({ to: '/users/$id', params: { id: u.id } });
                    }}
                    tabIndex={0}
                  >
                    <td>
                      <Person name={u.firstName} url={u.avatarUrl} sub={u.email} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {u.deletedAt ? (
                          <Badge>Supprimé</Badge>
                        ) : (
                          <ModerationBadge
                            status={u.moderation.status}
                            until={u.moderation.suspendedUntil}
                          />
                        )}
                        {u.role ? <Badge tone="ok">{ROLE_LABELS[u.role]}</Badge> : null}
                        {!u.onboardedAt && !u.deletedAt ? <Badge>Profil incomplet</Badge> : null}
                      </div>
                    </td>
                    <td className="num">
                      {u.openReports ? <Badge tone="brand">{u.openReports}</Badge> : '0'}
                    </td>
                    <td className="nowrap muted">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager
            page={search.page}
            pageSize={ADMIN_PAGE_SIZE}
            total={users.data?.total ?? 0}
            noun={['compte', 'comptes']}
            onPage={(page) => navigate({ search: (s) => ({ ...s, page }) })}
          />
        </>
      )}
    </>
  );
}
