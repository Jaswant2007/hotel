import { query } from '../../db';

export interface AuditLogEntry {
  userId?: string | null;
  event: string;
  ip: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  public async log(entry: AuditLogEntry): Promise<void> {
    try {
      await query(
        `INSERT INTO audit_log (user_id, event, ip, user_agent, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          entry.userId || null,
          entry.event,
          entry.ip,
          entry.userAgent,
          JSON.stringify(entry.metadata || {}),
        ]
      );
    } catch (err: any) {
      console.error('[AuditService Error] Failed to write audit log:', err.message);
    }
  }
}

export const auditService = new AuditService();
