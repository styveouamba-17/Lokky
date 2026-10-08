import {
  CalendarDots,
  ChartBar,
  ClipboardText,
  Flag,
  SignOut,
  UsersThree,
  type Icon,
} from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, Outlet, useNavigate, useRouteContext } from '@tanstack/react-router';
import { api } from '@/api/client';
import { useLiveOpenReports } from '@/api/live';
import { displayName, ROLE_LABELS } from '@/lib/labels';
import { Avatar } from '@/ui';

type NavItem = {
  to: '/reports' | '/users' | '/activities' | '/stats' | '/audit';
  label: string;
  icon: Icon;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { to: '/reports', label: 'Signalements', icon: Flag },
  { to: '/users', label: 'Comptes', icon: UsersThree },
  { to: '/activities', label: 'Sorties', icon: CalendarDots },
  { to: '/stats', label: 'Statistiques', icon: ChartBar },
  { to: '/audit', label: 'Journal', icon: ClipboardText, adminOnly: true },
];

export function Shell() {
  const { staff } = useRouteContext({ from: '/app' });
  const openReports = useLiveOpenReports();
  const client = useQueryClient();
  const navigate = useNavigate();

  const logout = async () => {
    await api('admin.auth.logout', {}).catch(() => undefined);
    client.clear();
    await navigate({ to: '/login' });
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/logo.svg" alt="" />
          <div>
            <div className="brand-name">Lokky</div>
            <div className="brand-tag">Équipe de modération</div>
          </div>
        </div>
        <nav className="nav" aria-label="Sections">
          {NAV.filter((item) => !item.adminOnly || staff.role === 'admin').map(
            ({ to, label, icon: NavIcon }) => (
              <Link key={to} to={to} title={label}>
                <NavIcon size={20} />
                <span className="label">{label}</span>
                {to === '/reports' && openReports ? (
                  <span className="nav-count" aria-label={`${openReports} à traiter`}>
                    {openReports}
                  </span>
                ) : null}
              </Link>
            ),
          )}
        </nav>
        <div className="sidebar-footer">
          <Avatar name={staff.firstName ?? staff.email} url={null} size={30} />
          <div className="who">
            <strong>{displayName(staff.firstName)}</strong>
            <span>{ROLE_LABELS[staff.role]}</span>
          </div>
          <button type="button" onClick={logout} aria-label="Se déconnecter" title="Se déconnecter">
            <SignOut size={18} />
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
