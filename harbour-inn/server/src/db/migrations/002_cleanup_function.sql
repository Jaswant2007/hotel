-- Purge expired OTPs and expired revoked refresh tokens
CREATE OR REPLACE FUNCTION purge_expired_auth_records()
RETURNS void AS $$
BEGIN
    -- Delete expired OTP records older than 24 hours
    DELETE FROM otp_codes 
    WHERE expires_at < NOW() - INTERVAL '24 hours';

    -- Delete expired refresh tokens older than 30 days
    DELETE FROM refresh_tokens 
    WHERE expires_at < NOW() - INTERVAL '30 days';

    -- Delete audit logs older than 180 days (retention policy)
    DELETE FROM audit_log
    WHERE created_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql;
