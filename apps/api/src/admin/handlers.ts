import type { AdminHandlers } from './context';
import { adminActivityHandlers } from './handlers/activities';
import { adminAuditHandlers } from './handlers/audit';
import { adminAuthHandlers } from './handlers/auth';
import { adminReportHandlers } from './handlers/reports';
import { adminStatsHandlers } from './handlers/stats';
import { adminUserHandlers } from './handlers/users';

// Registre des handlers de l'admin (contrat @lokky/shared/admin).
export const adminHandlers: AdminHandlers = {
  ...adminAuthHandlers,
  ...adminStatsHandlers,
  ...adminReportHandlers,
  ...adminUserHandlers,
  ...adminActivityHandlers,
  ...adminAuditHandlers,
};
