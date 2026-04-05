'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// ── Constants ─────────────────────────────────────────────────────────────────
const OTP_DEFAULT           = '12345';   // TEMP: replace with SMS/email gateway
const OTP_TTL_MINS          = 10;
const OTP_MAX_TRIES         = 5;
const OTP_MAX_SENDS         = 3;        // per contact per 24h
const SESSION_DAYS          = 7;        // rolling window
const VERIFIED_TOKEN_MINS   = 30;       // time to complete signup after OTP verified

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateToken(bytes = 48) {
  return crypto.randomBytes(bytes).toString('hex');
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isMobile(s) {
  return /^[+]?[0-9]{10,15}$/.test(s.replace(/[\s\-()]/g, ''));
}

function normalizeContact(raw) {
  const trimmed = (raw ?? '').trim();
  if (isEmail(trimmed))       return { value: trimmed.toLowerCase(), type: 'email' };
  const digits = trimmed.replace(/[\s\-()]/g, '');
  if (isMobile(digits))       return { value: digits, type: 'mobile' };
  return null;
}

function generateCustomerId() {
  return 'INF-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

async function touchSession(db, token) {
  const newExpiry = new Date(Date.now() + SESSION_DAYS * 86400 * 1000);
  await db.query(
    `UPDATE user_sessions SET expires_at=$1, last_used_at=now() WHERE token=$2`,
    [newExpiry, token]
  );
}

function formatUser(u) {
  return {
    id:                   u.id,
    customerId:           u.customer_id,
    email:                u.email ?? null,
    mobile:               u.mobile_number ?? null,
    fullName:             u.full_name,
    emailVerified:        u.email_verified ?? false,
    mobileVerified:       u.mobile_verified ?? false,
    isPremium:            u.is_premium,
    premiumScope:         u.premium_scope,
    premiumLanguageSlugs: u.premium_language_slugs ?? [],
    createdAt:            u.created_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = async (fastify) => {

  // ── POST /v1/auth/send-otp ──────────────────────────────────────────────────
  // Send OTP for signup. Rate limited to OTP_MAX_SENDS per 24h per contact.
  fastify.post('/send-otp', {
    schema: {
      body: {
        type: 'object', required: ['contact'],
        properties: { contact: { type: 'string', minLength: 5 } },
      },
    },
  }, async (req, reply) => {
    const parsed = normalizeContact(req.body.contact);
    if (!parsed) {
      return reply.status(400).send({
        error: { code: 'INVALID_CONTACT', message: 'Enter a valid email address or mobile number' },
      });
    }
    const { value: contact, type: contactType } = parsed;

    // Already registered?
    const field = contactType === 'email' ? 'email' : 'mobile_number';
    const { rows: existing } = await fastify.db.query(
      `SELECT id FROM users WHERE ${field} = $1 AND is_active = true`, [contact]
    );
    if (existing.length) {
      return reply.status(409).send({
        error: { code: 'ALREADY_REGISTERED', message: 'This contact is already registered. Please log in.' },
      });
    }

    // Rate limit
    const { rows: [rl] } = await fastify.db.query(
      `SELECT COUNT(*)::int AS cnt FROM otp_send_log
       WHERE contact = $1 AND sent_at > now() - INTERVAL '24 hours'`,
      [contact]
    );
    if (rl.cnt >= OTP_MAX_SENDS) {
      return reply.status(429).send({
        error: {
          code: 'OTP_LIMIT_REACHED',
          message: `Maximum ${OTP_MAX_SENDS} OTPs allowed per 24 hours. Try again later.`,
        },
      });
    }

    // Expire previous unverified OTPs
    await fastify.db.query(
      `UPDATE otp_verifications SET expires_at = now()
       WHERE contact=$1 AND verified_at IS NULL AND purpose='signup'`,
      [contact]
    );

    const otpHash  = await bcrypt.hash(OTP_DEFAULT, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINS * 60 * 1000);

    await fastify.db.query(
      `INSERT INTO otp_verifications (contact, contact_type, otp_hash, purpose, expires_at, ip_address)
       VALUES ($1, $2, $3, 'signup', $4, $5)`,
      [contact, contactType, otpHash, expiresAt, req.ip]
    );

    await fastify.db.query(
      `INSERT INTO otp_send_log (contact, ip_address) VALUES ($1, $2)`,
      [contact, req.ip]
    );

    // TODO: send real OTP via SMS / email gateway here
    const remainingSends = OTP_MAX_SENDS - rl.cnt - 1;

    return {
      success:            true,
      contact,
      contactType,
      message:            `OTP sent to your ${contactType === 'email' ? 'email address' : 'mobile number'}`,
      expiresInMinutes:   OTP_TTL_MINS,
      remainingSendsToday: remainingSends,
      // TEMP dev helper — remove or gate behind NODE_ENV in production
      _devOtp:            process.env.NODE_ENV !== 'production' ? OTP_DEFAULT : undefined,
    };
  });

  // ── POST /v1/auth/verify-otp ────────────────────────────────────────────────
  // Verify OTP. Returns a short-lived verifiedToken to complete signup.
  fastify.post('/verify-otp', {
    schema: {
      body: {
        type: 'object', required: ['contact', 'otp'],
        properties: {
          contact: { type: 'string' },
          otp:     { type: 'string', minLength: 4, maxLength: 8 },
        },
      },
    },
  }, async (req, reply) => {
    const parsed = normalizeContact(req.body.contact);
    if (!parsed) {
      return reply.status(400).send({ error: { code: 'INVALID_CONTACT', message: 'Invalid contact' } });
    }
    const { value: contact, type: contactType } = parsed;

    const { rows: [otpRow] } = await fastify.db.query(
      `SELECT id, otp_hash, attempts FROM otp_verifications
       WHERE contact=$1 AND purpose='signup' AND verified_at IS NULL AND expires_at > now()
       ORDER BY created_at DESC LIMIT 1`,
      [contact]
    );

    if (!otpRow) {
      return reply.status(400).send({
        error: { code: 'OTP_EXPIRED', message: 'OTP not found or expired. Request a new one.' },
      });
    }

    if (otpRow.attempts >= OTP_MAX_TRIES) {
      return reply.status(400).send({
        error: { code: 'OTP_MAX_TRIES', message: 'Too many wrong attempts. Request a new OTP.' },
      });
    }

    const valid = await bcrypt.compare(req.body.otp, otpRow.otp_hash);

    if (!valid) {
      await fastify.db.query(
        `UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = $1`, [otpRow.id]
      );
      const remaining = OTP_MAX_TRIES - otpRow.attempts - 1;
      return reply.status(400).send({
        error: {
          code: 'OTP_INVALID',
          message: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
          attemptsRemaining: remaining,
        },
      });
    }

    // Mark verified and store the verified token on the same row
    const verifiedToken  = generateToken(32);
    const verifiedExpiry = new Date(Date.now() + VERIFIED_TOKEN_MINS * 60 * 1000);

    await fastify.db.query(
      `UPDATE otp_verifications
       SET verified_at=now(), verified_token=$1, verified_token_expires_at=$2
       WHERE id=$3`,
      [verifiedToken, verifiedExpiry, otpRow.id]
    );

    return {
      success:          true,
      verifiedToken,
      contact,
      contactType,
      expiresInMinutes: VERIFIED_TOKEN_MINS,
      message:          'OTP verified successfully.',
    };
  });

  // ── POST /v1/auth/signup ────────────────────────────────────────────────────
  // Complete signup: verifiedToken + fullName + password + confirmPassword.
  fastify.post('/signup', {
    schema: {
      body: {
        type: 'object',
        required: ['verifiedToken', 'fullName', 'password', 'confirmPassword'],
        properties: {
          verifiedToken:   { type: 'string' },
          fullName:        { type: 'string', minLength: 2 },
          password:        { type: 'string', minLength: 6 },
          confirmPassword: { type: 'string', minLength: 6 },
          email:           { type: 'string' },
          mobile:          { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const { verifiedToken, fullName, password, confirmPassword, email, mobile } = req.body;

    if (password !== confirmPassword) {
      return reply.status(400).send({
        error: { code: 'PASSWORD_MISMATCH', message: 'Passwords do not match' },
      });
    }

    // Validate verified token — look it up in the verified_token column
    const { rows: [vtRow] } = await fastify.db.query(
      `SELECT contact, contact_type FROM otp_verifications
       WHERE verified_token=$1
         AND verified_at IS NOT NULL
         AND verified_token_expires_at > now()
       LIMIT 1`,
      [verifiedToken]
    );

    if (!vtRow) {
      return reply.status(400).send({
        error: { code: 'INVALID_VERIFIED_TOKEN', message: 'Signup session expired. Please start again.' },
      });
    }

    const { contact, contact_type: contactType } = vtRow;

    // Primary contact from OTP
    let emailValue  = contactType === 'email'  ? contact : null;
    let mobileValue = contactType === 'mobile' ? contact : null;

    // Optional secondary contact
    if (email && contactType !== 'email') {
      const p = normalizeContact(email);
      if (!p || p.type !== 'email') {
        return reply.status(400).send({ error: { code: 'INVALID_EMAIL', message: 'Invalid email address' } });
      }
      emailValue = p.value;
    }
    if (mobile && contactType !== 'mobile') {
      const p = normalizeContact(mobile);
      if (!p || p.type !== 'mobile') {
        return reply.status(400).send({ error: { code: 'INVALID_MOBILE', message: 'Invalid mobile number' } });
      }
      mobileValue = p.value;
    }

    // Uniqueness checks
    if (emailValue) {
      const { rows: ex } = await fastify.db.query(`SELECT id FROM users WHERE email=$1`, [emailValue]);
      if (ex.length) return reply.status(409).send({ error: { code: 'EMAIL_TAKEN', message: 'Email already registered' } });
    }
    if (mobileValue) {
      const { rows: ex } = await fastify.db.query(`SELECT id FROM users WHERE mobile_number=$1`, [mobileValue]);
      if (ex.length) return reply.status(409).send({ error: { code: 'MOBILE_TAKEN', message: 'Mobile already registered' } });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Unique customer ID
    let customerId;
    for (let i = 0; i < 10; i++) {
      const cid = generateCustomerId();
      const { rows: ex } = await fastify.db.query(`SELECT id FROM users WHERE customer_id=$1`, [cid]);
      if (!ex.length) { customerId = cid; break; }
    }
    if (!customerId) customerId = generateCustomerId(); // fallback

    const { rows: [user] } = await fastify.db.query(
      `INSERT INTO users (
         email, mobile_number, password_hash, full_name, customer_id,
         email_verified, mobile_verified, is_active
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING id, customer_id, email, mobile_number, full_name,
                 email_verified, mobile_verified, is_premium, premium_scope,
                 premium_language_slugs, created_at`,
      [emailValue, mobileValue, passwordHash, fullName.trim(), customerId,
       contactType === 'email', contactType === 'mobile']
    );

    // Invalidate verified token so it can't be reused
    await fastify.db.query(
      `UPDATE otp_verifications SET verified_token_expires_at=now()
       WHERE verified_token=$1`,
      [verifiedToken]
    );

    // Create session
    const token     = generateToken();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400 * 1000);
    await fastify.db.query(
      `INSERT INTO user_sessions (user_id, token, expires_at, ip_address, user_agent, last_used_at)
       VALUES ($1, $2, $3, $4, $5, now())`,
      [user.id, token, expiresAt, req.ip, req.headers['user-agent'] ?? null]
    );

    return reply.status(201).send({ token, expiresAt, user: formatUser(user) });
  });

  // ── POST /v1/auth/login ─────────────────────────────────────────────────────
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object', required: ['contact', 'password'],
        properties: {
          contact:  { type: 'string' },
          password: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const parsed = normalizeContact(req.body.contact);
    if (!parsed) {
      return reply.status(400).send({
        error: { code: 'INVALID_CONTACT', message: 'Enter a valid email address or mobile number' },
      });
    }
    const { value: contact, type: contactType } = parsed;
    const field = contactType === 'email' ? 'email' : 'mobile_number';

    const { rows: [user] } = await fastify.db.query(
      `SELECT id, customer_id, email, mobile_number, full_name, password_hash,
              email_verified, mobile_verified, is_premium, premium_scope,
              premium_language_slugs, is_active
       FROM users WHERE ${field}=$1`,
      [contact]
    );

    const ERR = { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email/mobile or password' } };
    if (!user || !user.is_active || !user.password_hash) return reply.status(401).send(ERR);

    const valid = await bcrypt.compare(req.body.password, user.password_hash);
    if (!valid) return reply.status(401).send(ERR);

    await fastify.db.query(`UPDATE users SET last_login_at=now() WHERE id=$1`, [user.id]);

    // Expire old sessions (keep last 5)
    await fastify.db.query(
      `UPDATE user_sessions SET is_active=false WHERE user_id=$1
       AND id NOT IN (SELECT id FROM user_sessions WHERE user_id=$1 AND is_active=true ORDER BY created_at DESC LIMIT 5)`,
      [user.id]
    );

    const token     = generateToken();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400 * 1000);
    await fastify.db.query(
      `INSERT INTO user_sessions (user_id, token, expires_at, ip_address, user_agent, last_used_at)
       VALUES ($1, $2, $3, $4, $5, now())`,
      [user.id, token, expiresAt, req.ip, req.headers['user-agent'] ?? null]
    );

    return { token, expiresAt, user: formatUser(user) };
  });

  // ── POST /v1/auth/logout ────────────────────────────────────────────────────
  fastify.post('/logout', {
    preHandler: [fastify.verifyAuth],
  }, async (req) => {
    await fastify.db.query(
      `UPDATE user_sessions SET is_active=false WHERE token=$1`,
      [req.headers['x-auth-token'] ?? '']
    );
    return { success: true };
  });

  // ── GET /v1/auth/me ─────────────────────────────────────────────────────────
  fastify.get('/me', {
    preHandler: [fastify.requireAuth],
  }, async (req) => {
    // Roll the session forward on every authenticated request
    await touchSession(fastify.db, req.headers['x-auth-token'] ?? '');

    const { rows: subs } = await fastify.db.query(
      `SELECT us.id, us.plan_type, us.language_slug,
              us.price_paid, us.currency, us.starts_at, us.ends_at,
              us.is_active, us.payment_status, us.created_at, sp.name AS plan_name
       FROM user_subscriptions us
       JOIN subscription_plans sp ON sp.id=us.plan_id
       WHERE us.user_id=$1 ORDER BY us.created_at DESC`,
      [req.user.id]
    );

    return { user: req.user, subscriptions: subs };
  });

  // ── POST /v1/auth/activate-token ────────────────────────────────────────────
  fastify.post('/activate-token', {
    preHandler: [fastify.requireAuth],
    schema: {
      body: {
        type: 'object', required: ['activationToken'],
        properties: { activationToken: { type: 'string' } },
      },
    },
  }, async (req, reply) => {
    const { activationToken } = req.body;

    const { rows: [sub] } = await fastify.db.query(
      `SELECT us.* FROM user_subscriptions us WHERE us.activation_token=$1`,
      [activationToken]
    );

    if (!sub) {
      return reply.status(404).send({
        error: { code: 'INVALID_TOKEN', message: 'Activation token not found or already used' },
      });
    }
    if (sub.is_active && sub.user_id !== null && sub.user_id !== req.user.id) {
      return reply.status(409).send({
        error: { code: 'TOKEN_USED', message: 'Token already activated' },
      });
    }

    await fastify.db.query(
      `UPDATE user_subscriptions
       SET user_id=$1, is_active=true, activation_token=NULL, updated_at=now()
       WHERE id=$2`,
      [req.user.id, sub.id]
    );

    const { rows: [fresh] } = await fastify.db.query(
      `SELECT id, customer_id, email, mobile_number, full_name,
              email_verified, mobile_verified, is_premium, premium_scope, premium_language_slugs
       FROM users WHERE id=$1`,
      [req.user.id]
    );

    return { success: true, user: formatUser(fresh) };
  });

  // ── POST /v1/auth/forgot-password ───────────────────────────────────────────
  // Step 1: Send OTP to verify identity before allowing password reset.
  // Uses the same OTP infrastructure, purpose = 'reset'.
  fastify.post('/forgot-password', {
    schema: {
      body: {
        type: 'object', required: ['contact'],
        properties: { contact: { type: 'string' } },
      },
    },
  }, async (req, reply) => {
    const parsed = normalizeContact(req.body.contact);
    if (!parsed) {
      return reply.status(400).send({
        error: { code: 'INVALID_CONTACT', message: 'Enter a valid email address or mobile number' },
      });
    }
    const { value: contact, type: contactType } = parsed;
    const field = contactType === 'email' ? 'email' : 'mobile_number';

    // Check user exists (but always return the same success response to
    // avoid leaking whether a contact is registered — security best practice)
    const { rows: [user] } = await fastify.db.query(
      `SELECT id FROM users WHERE ${field}=$1 AND is_active=true`, [contact]
    );

    if (user) {
      // Rate limit same as signup OTP
      const { rows: [rl] } = await fastify.db.query(
        `SELECT COUNT(*)::int AS cnt FROM otp_send_log
         WHERE contact=$1 AND sent_at > now() - INTERVAL '24 hours'`,
        [contact]
      );
      if (rl.cnt < OTP_MAX_SENDS) {
        // Expire previous reset OTPs for this contact
        await fastify.db.query(
          `UPDATE otp_verifications SET expires_at=now()
           WHERE contact=$1 AND purpose='reset' AND verified_at IS NULL`,
          [contact]
        );

        const otpHash  = await bcrypt.hash(OTP_DEFAULT, 10);
        const expiresAt = new Date(Date.now() + OTP_TTL_MINS * 60 * 1000);

        await fastify.db.query(
          `INSERT INTO otp_verifications (contact, contact_type, otp_hash, purpose, expires_at, ip_address)
           VALUES ($1,$2,$3,'reset',$4,$5)`,
          [contact, contactType, otpHash, expiresAt, req.ip]
        );

        await fastify.db.query(
          `INSERT INTO otp_send_log (contact, ip_address) VALUES ($1,$2)`,
          [contact, req.ip]
        );
        // TODO: send OTP via SMS/email
      }
    }

    // Always return success (don't reveal if contact exists)
    return {
      success: true,
      message: 'If that contact is registered, an OTP has been sent.',
      _devOtp: process.env.NODE_ENV !== 'production' && user ? OTP_DEFAULT : undefined,
    };
  });

  // ── POST /v1/auth/verify-reset-otp ──────────────────────────────────────────
  // Step 2: Verify the reset OTP, get back a resetToken to change password.
  fastify.post('/verify-reset-otp', {
    schema: {
      body: {
        type: 'object', required: ['contact', 'otp'],
        properties: {
          contact: { type: 'string' },
          otp:     { type: 'string', minLength: 4, maxLength: 8 },
        },
      },
    },
  }, async (req, reply) => {
    const parsed = normalizeContact(req.body.contact);
    if (!parsed) {
      return reply.status(400).send({ error: { code: 'INVALID_CONTACT', message: 'Invalid contact' } });
    }
    const { value: contact, type: contactType } = parsed;

    const { rows: [otpRow] } = await fastify.db.query(
      `SELECT id, otp_hash, attempts FROM otp_verifications
       WHERE contact=$1 AND purpose='reset' AND verified_at IS NULL AND expires_at>now()
       ORDER BY created_at DESC LIMIT 1`,
      [contact]
    );

    if (!otpRow) {
      return reply.status(400).send({
        error: { code: 'OTP_EXPIRED', message: 'OTP not found or expired. Request a new one.' },
      });
    }

    if (otpRow.attempts >= OTP_MAX_TRIES) {
      return reply.status(400).send({
        error: { code: 'OTP_MAX_TRIES', message: 'Too many wrong attempts. Request a new OTP.' },
      });
    }

    const valid = await bcrypt.compare(req.body.otp, otpRow.otp_hash);
    if (!valid) {
      await fastify.db.query(
        `UPDATE otp_verifications SET attempts=attempts+1 WHERE id=$1`, [otpRow.id]
      );
      const remaining = OTP_MAX_TRIES - otpRow.attempts - 1;
      return reply.status(400).send({
        error: {
          code: 'OTP_INVALID',
          message: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
        },
      });
    }

    const resetToken  = generateToken(32);
    const resetExpiry = new Date(Date.now() + VERIFIED_TOKEN_MINS * 60 * 1000);

    await fastify.db.query(
      `UPDATE otp_verifications
       SET verified_at=now(), verified_token=$1, verified_token_expires_at=$2
       WHERE id=$3`,
      [resetToken, resetExpiry, otpRow.id]
    );

    return { success: true, resetToken, contactType, expiresInMinutes: VERIFIED_TOKEN_MINS };
  });

  // ── POST /v1/auth/reset-password ────────────────────────────────────────────
  // Step 3: Set a new password using the resetToken from verify-reset-otp.
  fastify.post('/reset-password', {
    schema: {
      body: {
        type: 'object', required: ['resetToken', 'password', 'confirmPassword'],
        properties: {
          resetToken:      { type: 'string' },
          password:        { type: 'string', minLength: 6 },
          confirmPassword: { type: 'string', minLength: 6 },
        },
      },
    },
  }, async (req, reply) => {
    const { resetToken, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return reply.status(400).send({
        error: { code: 'PASSWORD_MISMATCH', message: 'Passwords do not match' },
      });
    }

    const { rows: [row] } = await fastify.db.query(
      `SELECT contact, contact_type FROM otp_verifications
       WHERE verified_token=$1
         AND verified_at IS NOT NULL
         AND verified_token_expires_at > now()
       LIMIT 1`,
      [resetToken]
    );

    if (!row) {
      return reply.status(400).send({
        error: { code: 'INVALID_RESET_TOKEN', message: 'Reset session expired. Please start again.' },
      });
    }

    const field = row.contact_type === 'email' ? 'email' : 'mobile_number';
    const passwordHash = await bcrypt.hash(password, 12);

    const { rows: [updated] } = await fastify.db.query(
      `UPDATE users SET password_hash=$1, updated_at=now()
       WHERE ${field}=$2 AND is_active=true
       RETURNING id`,
      [passwordHash, row.contact]
    );

    if (!updated) {
      return reply.status(404).send({
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
    }

    // Invalidate the reset token
    await fastify.db.query(
      `UPDATE otp_verifications SET verified_token_expires_at=now()
       WHERE verified_token=$1`,
      [resetToken]
    );

    // Invalidate all existing sessions (force re-login with new password)
    await fastify.db.query(
      `UPDATE user_sessions SET is_active=false WHERE user_id=$1`, [updated.id]
    );

    return { success: true, message: 'Password reset successfully. Please log in with your new password.' };
  });
};
