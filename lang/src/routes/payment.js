'use strict';

const crypto = require('crypto');

// ── /v1/payment/* ─────────────────────────────────────────────────────────────
//
// POST /v1/payment/initiate            — create order, return gateway details
// POST /v1/payment/razorpay/verify     — verify signature after payment
// POST /v1/payment/razorpay/webhook    — Razorpay server-to-server webhook
// POST /v1/payment/paypal/capture      — capture PayPal order after approval
// POST /v1/payment/paypal/webhook      — PayPal IPN/webhook
// GET  /v1/payment/status/:txnId       — poll status (for post-redirect check)

// ── Transaction ID format ──────────────────────────────────────────────────────
// {3 chars of userId hex}{3 letters of name}{YYMMDDHHMMSS}{3-digit seq}
// e.g.  "a3f_joh_240501143012_007"
function makeTransactionId(userId, fullName, seqNum) {
  const userPart = userId.replace(/-/g, '').slice(0, 3).toLowerCase();

  const nameClean = (fullName ?? '').replace(/[^a-zA-Z]/g, '').toUpperCase();
  const namePart  = nameClean.length >= 3
    ? nameClean.slice(0, 3).toLowerCase()
    : nameClean.length === 2
      ? nameClean.toLowerCase() + 'x'
      : nameClean.length === 1
        ? nameClean.toLowerCase() + 'xx'
        : 'xxx';

  const now = new Date();
  const yy  = String(now.getFullYear()).slice(-2);
  const mm  = String(now.getMonth() + 1).padStart(2, '0');
  const dd  = String(now.getDate()).padStart(2, '0');
  const hh  = String(now.getHours()).padStart(2, '0');
  const mi  = String(now.getMinutes()).padStart(2, '0');
  const ss  = String(now.getSeconds()).padStart(2, '0');
  const datePart = `${yy}${mm}${dd}${hh}${mi}${ss}`;

  const seqPart = String(seqNum).padStart(3, '0');

  return `${userPart}_${namePart}_${datePart}_${seqPart}`;
}

// ── Currency: INR for India (+91 mobile or .in email), else USD ───────────────
function resolveCurrency(user) {
  if (user.mobile && user.mobile.startsWith('+91')) return 'INR';
  if (user.email  && user.email.endsWith('.in'))    return 'INR';
  return 'INR'; // default INR; frontend passes explicit currency from plan
}

// ── Razorpay lazy-load (only if keys are set) ─────────────────────────────────
let _razorpay = null;
function getRazorpay() {
  if (_razorpay) return _razorpay;
  const Razorpay = require('razorpay');
  _razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  return _razorpay;
}

// ── PayPal REST API helper ────────────────────────────────────────────────────
// We call PayPal directly (no extra SDK) to keep deps minimal.
const PAYPAL_BASE = {
  sandbox:    'https://api-m.sandbox.paypal.com',
  production: 'https://api-m.paypal.com',
};

async function paypalToken() {
  const mode = process.env.PAYPAL_MODE ?? 'sandbox';
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');
  const res  = await fetch(`${PAYPAL_BASE[mode]}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  return data.access_token;
}

async function paypalCreate(txnId, amountUsd, planName, languageSlug) {
  const mode  = process.env.PAYPAL_MODE ?? 'sandbox';
  const token = await paypalToken();
  const appUrl = process.env.APP_URL ?? 'http://localhost:5173';
  const res = await fetch(`${PAYPAL_BASE[mode]}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: txnId,
        description:  `InfinityOdyssey — ${planName}${languageSlug ? ` (${languageSlug})` : ''}`,
        amount: { currency_code: 'USD', value: String(Number(amountUsd).toFixed(2)) },
      }],
      application_context: {
        return_url: `${appUrl}/payment/paypal/return?txn=${txnId}`,
        cancel_url: `${appUrl}/payment/paypal/cancel?txn=${txnId}`,
        brand_name: 'InfinityOdyssey',
        user_action: 'PAY_NOW',
      },
    }),
  });
  return res.json();
}

async function paypalCapture(ppOrderId) {
  const mode  = process.env.PAYPAL_MODE ?? 'sandbox';
  const token = await paypalToken();
  const res = await fetch(`${PAYPAL_BASE[mode]}/v2/checkout/orders/${ppOrderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = async (fastify) => {

  // ── POST /v1/payment/initiate ───────────────────────────────────────────────
  // Creates a payment record and Razorpay/PayPal order.
  // Returns everything the frontend needs to open the gateway.
  fastify.post('/initiate', {
    preHandler: [fastify.requireAuth],
    schema: {
      body: {
        type: 'object',
        required: ['planId', 'provider'],
        properties: {
          planId:   { type: 'string' },
          provider: { type: 'string', enum: ['razorpay', 'paypal'] },
          currency: { type: 'string', enum: ['INR', 'USD'] },
        },
      },
    },
  }, async (req, reply) => {
    const { planId, provider } = req.body;
    const user = req.user;

    // Fetch plan
    const { rows: [plan] } = await fastify.db.query(
      `SELECT sp.*, l.name AS language_name
       FROM subscription_plans sp
       LEFT JOIN languages l ON l.id = sp.language_id
       WHERE sp.id = $1 AND sp.is_active = true`,
      [planId]
    );
    if (!plan) {
      return reply.status(404).send({ error: { code: 'PLAN_NOT_FOUND', message: 'Plan not found' } });
    }

    // Fetch user details for transaction ID
    const { rows: [userFull] } = await fastify.db.query(
      `SELECT id, full_name, email, mobile_number FROM users WHERE id = $1`,
      [user.id]
    );

    // Determine currency based on user's locale (not gateway)
    const currency = req.body.currency ?? (
      (userFull.mobile_number && userFull.mobile_number.startsWith('+91')) ||
      (userFull.email && userFull.email.endsWith('.in'))
        ? 'INR' : 'INR'  // default INR, frontend passes explicit value
    );

    const amount = currency === 'INR'
      ? Number(plan.price_inr ?? 0)
      : Number(plan.price_usd ?? 0);

    if (amount <= 0) {
      return reply.status(400).send({ error: { code: 'INVALID_AMOUNT', message: 'Plan has no price set for this currency' } });
    }

    // Generate transaction ID using sequence
    const { rows: [seqRow] } = await fastify.db.query(`SELECT nextval('payment_seq')::int AS seq`);
    const txnId = makeTransactionId(userFull.id, userFull.full_name, seqRow.seq);

    // Insert payment row with pending status
    const { rows: [payment] } = await fastify.db.query(
      `INSERT INTO payments
         (transaction_id, user_id, plan_id, plan_type, language_slug,
          amount, currency, provider, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')
       RETURNING id`,
      [txnId, user.id, planId, plan.plan_type, plan.language_slug,
       amount, currency, provider]
    );

    // ── Razorpay ──────────────────────────────────────────────
    if (provider === 'razorpay') {
      const rzp   = getRazorpay();
      const order = await rzp.orders.create({
        amount:   Math.round(amount * 100),  // paise
        currency: 'INR',
        receipt:  txnId,
        notes: {
          plan_name:     plan.name,
          language_slug: plan.language_slug ?? 'all',
          user_id:       user.id,
          payment_db_id: payment.id,
        },
      });

      await fastify.db.query(
        `UPDATE payments SET gateway_order_id=$1 WHERE id=$2`,
        [order.id, payment.id]
      );

      return {
        provider:   'razorpay',
        txnId,
        paymentId:  payment.id,
        orderId:    order.id,
        amount,
        currency:   'INR',
        keyId:      process.env.RAZORPAY_KEY_ID,
        plan: {
          id:           plan.id,
          name:         plan.name,
          planType:     plan.plan_type,
          languageSlug: plan.language_slug,
          languageName: plan.language_name,
          durationDays: plan.duration_days,
        },
        user: {
          name:  userFull.full_name,
          email: userFull.email,
          phone: userFull.mobile_number,
        },
      };
    }

    // ── PayPal ────────────────────────────────────────────────
    if (provider === 'paypal') {
      const ppOrder = await paypalCreate(txnId, amount, plan.name, plan.language_slug);
      const approvalLink = ppOrder.links?.find(l => l.rel === 'approve')?.href;

      await fastify.db.query(
        `UPDATE payments SET gateway_order_id=$1 WHERE id=$2`,
        [ppOrder.id, payment.id]
      );

      return {
        provider:    'paypal',
        txnId,
        paymentId:   payment.id,
        ppOrderId:   ppOrder.id,
        approvalUrl: approvalLink,
        amount,
        currency:    'USD',
        plan: {
          id:           plan.id,
          name:         plan.name,
          planType:     plan.plan_type,
          languageSlug: plan.language_slug,
          languageName: plan.language_name,
          durationDays: plan.duration_days,
        },
      };
    }
  });

  // ── POST /v1/payment/razorpay/verify ───────────────────────────────────────
  // Called from frontend after Razorpay checkout completes.
  // Verifies the signature and activates the subscription.
  fastify.post('/razorpay/verify', {
    preHandler: [fastify.requireAuth],
    schema: {
      body: {
        type: 'object',
        required: ['razorpayOrderId', 'razorpayPaymentId', 'razorpaySignature', 'txnId'],
        properties: {
          razorpayOrderId:   { type: 'string' },
          razorpayPaymentId: { type: 'string' },
          razorpaySignature: { type: 'string' },
          txnId:             { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, txnId } = req.body;

    // Verify HMAC signature
    const body      = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected  = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpaySignature) {
      await fastify.db.query(
        `UPDATE payments SET status='failed', updated_at=now() WHERE transaction_id=$1`,
        [txnId]
      );
      return reply.status(400).send({
        error: { code: 'INVALID_SIGNATURE', message: 'Payment signature verification failed' },
      });
    }

    // Activate
    const result = await activatePayment(fastify.db, txnId, razorpayPaymentId, null, 'razorpay');

    return {
      success:      true,
      status:       'completed',
      txnId,
      languageSlug: result.languageSlug,
      user:         result.user,
      message:      'Payment successful! Your premium access is now active.',
    };
  });

  // ── POST /v1/payment/razorpay/webhook ──────────────────────────────────────
  // Razorpay server-to-server event (backup — in case frontend verify fails)
  fastify.post('/razorpay/webhook', {
    config: { rawBody: true },
  }, async (req, reply) => {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody   = req.rawBody ?? JSON.stringify(req.body);

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(rawBody)
      .digest('hex');

    if (signature !== expected) {
      return reply.status(400).send({ error: 'Invalid webhook signature' });
    }

    const event = req.body;
    if (event.event === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      if (payment) {
        const txnId = payment.receipt;
        if (txnId) {
          await activatePayment(fastify.db, txnId, payment.id, null, 'razorpay').catch(() => {});
        }
      }
    }
    if (event.event === 'payment.failed') {
      const payment = event.payload?.payment?.entity;
      const txnId   = payment?.receipt;
      if (txnId) {
        await fastify.db.query(
          `UPDATE payments SET status='failed', gateway_payload=$1::jsonb, updated_at=now()
           WHERE transaction_id=$2 AND status='pending'`,
          [JSON.stringify(event), txnId]
        );
      }
    }

    return reply.status(200).send({ received: true });
  });

  // ── POST /v1/payment/paypal/capture ────────────────────────────────────────
  // Called after user returns from PayPal approval URL.
  fastify.post('/paypal/capture', {
    preHandler: [fastify.requireAuth],
    schema: {
      body: {
        type: 'object',
        required: ['ppOrderId', 'txnId'],
        properties: {
          ppOrderId: { type: 'string' },
          txnId:     { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const { ppOrderId, txnId } = req.body;

    const capture = await paypalCapture(ppOrderId);

    if (capture.status !== 'COMPLETED') {
      await fastify.db.query(
        `UPDATE payments SET status='failed', gateway_payload=$1::jsonb, updated_at=now()
         WHERE transaction_id=$2`,
        [JSON.stringify(capture), txnId]
      );
      return reply.status(400).send({
        error: {
          code:    'PAYPAL_CAPTURE_FAILED',
          message: `Payment could not be completed (status: ${capture.status})`,
        },
      });
    }

    const captureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    const result    = await activatePayment(fastify.db, txnId, captureId, ppOrderId, 'paypal');

    return {
      success:      true,
      status:       'completed',
      txnId,
      languageSlug: result.languageSlug,
      user:         result.user,
      message:      'Payment successful! Your premium access is now active.',
    };
  });

  // ── POST /v1/payment/paypal/webhook ────────────────────────────────────────
  fastify.post('/paypal/webhook', async (req, reply) => {
    // PayPal webhooks can be verified via PayPal API — simplified here
    const event = req.body;
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const refId = event.resource?.supplementary_data?.related_ids?.order_id;
      if (refId) {
        // Find payment by gateway_order_id
        const { rows: [p] } = await fastify.db.query(
          `SELECT transaction_id FROM payments WHERE gateway_order_id=$1 AND status='pending'`,
          [refId]
        );
        if (p) {
          await activatePayment(fastify.db, p.transaction_id, event.resource?.id, refId, 'paypal').catch(() => {});
        }
      }
    }
    return reply.status(200).send({ received: true });
  });

  // ── GET /v1/payment/status/:txnId ──────────────────────────────────────────
  // Frontend polls this after redirect to check payment status.
  fastify.get('/status/:txnId', {
    preHandler: [fastify.requireAuth],
  }, async (req, reply) => {
    const { rows: [payment] } = await fastify.db.query(
      `SELECT p.transaction_id, p.status, p.amount, p.currency, p.provider,
              p.plan_type, p.language_slug, p.created_at,
              sp.name AS plan_name,
              us.id   AS subscription_id, us.ends_at
       FROM payments p
       LEFT JOIN subscription_plans sp ON sp.id = p.plan_id
       LEFT JOIN user_subscriptions us ON us.id = p.subscription_id
       WHERE p.transaction_id = $1 AND p.user_id = $2`,
      [req.params.txnId, req.user.id]
    );

    if (!payment) {
      return reply.status(404).send({ error: { message: 'Transaction not found' } });
    }

    return { payment };
  });
};

// ── Helper: activate subscription after successful payment ────────────────────
async function activatePayment(db, txnId, gatewayPaymentId, gatewayOrderId, provider) {
  // Get payment record
  const { rows: [payment] } = await db.query(
    `SELECT * FROM payments WHERE transaction_id=$1 AND status='pending'`,
    [txnId]
  );

  // Already processed (idempotent)
  if (!payment) {
    const { rows: [done] } = await db.query(
      `SELECT p.language_slug, p.user_id FROM payments p WHERE p.transaction_id=$1`,
      [txnId]
    );
    if (done) {
      const { rows: [u] } = await db.query(
        `SELECT id, customer_id, email, mobile_number, full_name, is_premium,
                premium_scope, premium_language_slugs, email_verified, mobile_verified
         FROM users WHERE id=$1`, [done.user_id]
      );
      return { languageSlug: done.language_slug, user: formatUser(u) };
    }
    throw new Error('Transaction not found');
  }

  // Calculate subscription period
  const startsAt = new Date();
  let endsAt = null;
  if (payment.plan_type !== 'lifetime_all') {
    const { rows: [plan] } = await db.query(
      `SELECT duration_days FROM subscription_plans WHERE id=$1`, [payment.plan_id]
    );
    if (plan?.duration_days) {
      endsAt = new Date(Date.now() + plan.duration_days * 86400 * 1000);
    }
  }

  // Create subscription
  const { rows: [sub] } = await db.query(
    `INSERT INTO user_subscriptions
       (user_id, plan_id, plan_type, language_slug, price_paid, currency,
        starts_at, ends_at, is_active, payment_provider, payment_id, payment_status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9,$10,'completed')
     RETURNING id`,
    [payment.user_id, payment.plan_id, payment.plan_type, payment.language_slug,
     payment.amount, payment.currency, startsAt, endsAt, provider, gatewayPaymentId]
  );

  // Update payment
  await db.query(
    `UPDATE payments SET
       status='completed',
       gateway_payment_id=$1,
       gateway_order_id=COALESCE($2,gateway_order_id),
       subscription_id=$3,
       updated_at=now()
     WHERE transaction_id=$4`,
    [gatewayPaymentId, gatewayOrderId, sub.id, txnId]
  );

  // DB trigger syncs is_premium flags automatically
  const { rows: [u] } = await db.query(
    `SELECT id, customer_id, email, mobile_number, full_name, is_premium,
            premium_scope, premium_language_slugs, email_verified, mobile_verified
     FROM users WHERE id=$1`, [payment.user_id]
  );

  return { languageSlug: payment.language_slug, user: formatUser(u) };
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
  };
}
