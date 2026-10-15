import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { query } from '../../db';
import { UpdateProfileSchema } from '../auth/auth.validator';
import { auditService } from '../audit/audit.service';
import { tokenService } from '../auth/token.service';

const router = Router();

// GET /api/v1/me - Get active authenticated user profile
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  res.json({
    code: 'USER_PROFILE',
    user: {
      id: req.user!.id,
      email: req.user!.email,
      name: req.user!.name,
      phone: req.user!.phone,
      emailVerifiedAt: req.user!.email_verified_at,
      status: req.user!.status,
    },
  });
});

// PATCH /api/v1/me - Update user profile
router.patch('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = UpdateProfileSchema.parse(req.body);
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (validated.name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(validated.name);
    }
    if (validated.phone !== undefined) {
      updates.push(`phone = $${idx++}`);
      values.push(validated.phone);
    }

    if (updates.length === 0) {
      return res.json({ code: 'NO_CHANGES', user: req.user });
    }

    values.push(req.user!.id);
    const { rows } = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} 
       RETURNING id, email, name, phone, email_verified_at, status`,
      values
    );

    await auditService.log({
      userId: req.user!.id,
      event: 'PROFILE_UPDATED',
      ip: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: validated,
    });

    res.json({
      code: 'PROFILE_UPDATED',
      message: 'Profile updated successfully.',
      user: rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/me/sessions - List active devices and sessions
router.get('/me/sessions', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await query(
      `SELECT id, family_id, ip, user_agent, created_at, expires_at 
       FROM refresh_tokens 
       WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [req.user!.id]
    );

    res.json({
      code: 'SESSIONS_LIST',
      sessions: rows,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/me/sessions/:id - Revoke specific session
router.delete('/me/sessions/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user!.id]
    );

    res.json({
      code: 'SESSION_REVOKED',
      message: 'Target session revoked.',
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/me/bookings - Guest bookings
router.get('/me/bookings', requireAuth, async (req: Request, res: Response) => {
  // Demonstration bookings tied to guest
  const mockBookings = [
    {
      id: 'HI-89412',
      roomTitle: 'Waterfront Oceanview King Suite',
      checkIn: '2026-11-12',
      checkOut: '2026-11-16',
      guests: 2,
      totalAmount: 1420,
      status: 'confirmed',
      canCancel: true,
    },
    {
      id: 'HI-73201',
      roomTitle: 'Heritage Coastal Balcony Room',
      checkIn: '2026-08-04',
      checkOut: '2026-08-07',
      guests: 1,
      totalAmount: 890,
      status: 'completed',
      canCancel: false,
    },
  ];

  res.json({
    code: 'BOOKINGS_LIST',
    bookings: mockBookings,
  });
});

// GET /api/v1/me/export - GDPR Data portability export
router.get('/me/export', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRes = await query('SELECT * FROM users WHERE id = $1', [req.user!.id]);
    const auditRes = await query('SELECT * FROM audit_log WHERE user_id = $1 ORDER BY created_at DESC', [req.user!.id]);
    const sessionRes = await query('SELECT id, ip, user_agent, created_at, expires_at FROM refresh_tokens WHERE user_id = $1', [req.user!.id]);

    res.setHeader('Content-Disposition', 'attachment; filename="harbour-inn-guest-data.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json({
      exportDate: new Date(),
      user: userRes.rows[0],
      sessions: sessionRes.rows,
      auditHistory: auditRes.rows,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/me - GDPR Right to erasure
router.delete('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // Revoke all tokens
    await tokenService.revokeAllUserTokens(userId);

    // Delete user (cascades to refresh_tokens)
    await query('DELETE FROM users WHERE id = $1', [userId]);

    await auditService.log({
      event: 'ACCOUNT_DELETED',
      ip: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { deletedUserId: userId },
    });

    res.clearCookie('access_token');
    res.clearCookie('refresh_token', { path: '/api/v1/auth' });
    res.clearCookie('csrf_token');

    res.json({
      code: 'ACCOUNT_DELETED',
      message: 'Your account and personal data have been completely erased.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
