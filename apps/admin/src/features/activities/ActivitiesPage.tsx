import { ADMIN_PAGE_SIZE } from '@lokky/shared/admin';
import { CalendarDots, MagnifyingGlass } from '@phosphor-icons/react';
import { getRouteApi, useNavigate as useAppNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useActivities } from '@/api/queries';
import { formatDateTime } from '@/lib/format';
import { ACTIVITY_STATUS_LABELS, CATEGORY_LABELS, neighborhoodName } from '@/lib/labels';
import { Badge, Empty, ErrorBox, Pager, Person, Segmented, SkeletonRows } from '@/ui';
import { useDebounced } from '../users/UsersPage';
import { CategoryIcon } from './CategoryIcon';

const route = getRouteApi('/app/activities');

export function ActivitiesPage() {
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

  const activities = useActivities({ q: search.q, filter: search.filter, page: search.page });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Sorties</h1>
          <p>
            {search.filter === 'upcoming'
              ? 'Les prochaines sorties d’abord.'
              : 'Toutes les sorties publiées sur Lokky.'}
          </p>
        </div>
      </div>
      <div className="toolbar">
        <label className="search">
          <MagnifyingGlass size={17} />
          <span className="visually-hidden">Rechercher une sortie</span>
          <input
            className="input"
            type="search"
            placeholder="Titre ou lieu"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <Segmented
          label="Période"
          value={search.filter}
          onChange={(filter) => navigate({ search: (s) => ({ ...s, filter, page: 1 }) })}
          options={[
            { value: 'upcoming', label: 'À venir' },
            { value: 'past', label: 'Passées' },
            { value: 'cancelled', label: 'Annulées' },
            { value: 'all', label: 'Toutes' },
          ]}
        />
      </div>

      {activities.error ? <ErrorBox error={activities.error} /> : null}
      {activities.isPending ? (
        <SkeletonRows rows={8} />
      ) : activities.data?.items.length === 0 ? (
        <div className="panel">
          <Empty icon={<CalendarDots size={40} weight="duotone" />} title="Aucune sortie ici">
            Essaie une autre période ou un autre mot.
          </Empty>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Sortie</th>
                  <th>Date</th>
                  <th>Organisée par</th>
                  <th className="num">Participants</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {activities.data?.items.map((a) => (
                  <tr
                    key={a.id}
                    tabIndex={0}
                    onClick={() => open({ to: '/activities/$id', params: { id: a.id } })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter')
                        void open({ to: '/activities/$id', params: { id: a.id } });
                    }}
                  >
                    <td>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <CategoryIcon category={a.category} />
                        <div>
                          <strong>{a.title}</strong>
                          <p className="small muted">
                            {CATEGORY_LABELS[a.category]}, {a.placeName}
                            {a.neighborhood ? ` (${neighborhoodName(a.neighborhood)})` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="nowrap">{formatDateTime(a.startsAt)}</td>
                    <td>
                      <Person name={a.creator.firstName} url={a.creator.avatarUrl} size={26} />
                    </td>
                    <td className="num">
                      {a.participantCount} / {a.capacity}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Badge tone={a.status === 'cancelled' ? 'suspended' : undefined}>
                          {ACTIVITY_STATUS_LABELS[a.status]}
                        </Badge>
                        {a.openReports ? (
                          <Badge tone="brand">
                            {a.openReports} signalement{a.openReports > 1 ? 's' : ''}
                          </Badge>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager
            page={search.page}
            pageSize={ADMIN_PAGE_SIZE}
            total={activities.data?.total ?? 0}
            noun={['sortie', 'sorties']}
            onPage={(page) => navigate({ search: (s) => ({ ...s, page }) })}
          />
        </>
      )}
    </>
  );
}
