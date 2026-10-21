// api/contact.js — Production Serverless Function (Vercel / Node.js 18+)
// Zero external dependencies required; uses native fetch.

const submissionCache = new Map();

function isRateLimited(key, windowMs = 15000) {
  const now = Date.now();
  const lastTime = submissionCache.get(key);
  if (lastTime && now - lastTime < windowMs) {
    return true;
  }
  submissionCache.set(key, now);

  // Periodic cleanup
  if (submissionCache.size > 1000) {
    for (const [k, v] of submissionCache.entries()) {
      if (now - v > 60000) submissionCache.delete(k);
    }
  }
  return false;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. Please use POST.'
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { name, email, intent, message, _hp } = body;

    // 1. Spam Honeypot Check: if hidden field is filled, silently discard or reject
    if (_hp) {
      return res.status(400).json({
        success: false,
        error: 'Spam submission detected.'
      });
    }

    // 2. Input Sanitization & Validation
    const trimmedName = (name || '').trim();
    const trimmedEmail = (email || '').trim();
    const trimmedMessage = (message || '').trim();
    const cleanIntent = (intent || 'general').trim();

    if (!trimmedName || trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide your name (at least 2 characters).'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.'
      });
    }

    if (!trimmedMessage || trimmedMessage.length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a message (at least 5 characters).'
      });
    }

    // 3. Rate limiting check (per IP / email)
    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const rateLimitKey = `${clientIp}_${trimmedEmail.toLowerCase()}`;
    if (isRateLimited(rateLimitKey)) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait a moment before submitting again.'
      });
    }

    // 4. Configuration Check
    const apiKey = process.env.RESEND_API_KEY;
    const recipient = process.env.CONTACT_RECIPIENT_EMAIL;
    const sender = process.env.CONTACT_SENDER_EMAIL || 'Portfolio Contact Form <onboarding@resend.dev>';

    if (!apiKey || apiKey.startsWith('re_placeholder') || apiKey.startsWith('[') || !apiKey.startsWith('re_') || !recipient) {
      return res.status(503).json({
        success: false,
        code: 'CONFIG_MISSING',
        error: 'Email delivery is not yet configured. Please set your real RESEND_API_KEY and CONTACT_RECIPIENT_EMAIL environment variables.'
      });
    }

    const intentMap = {
      job: 'Full-Time Role / Hiring',
      freelance: 'Freelance AI Video / Creative Production',
      paid_media: 'Paid Media / Performance Marketing',
      networking: 'Professional Networking / General'
    };
    const intentLabel = intentMap[cleanIntent] || cleanIntent;
    const subject = `New Portfolio Inquiry — ${intentLabel}`;
    const timestamp = new Date().toUTCString();

    const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(subject)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #07080a; color: #f1f5f9; padding: 24px; margin: 0; }
  .card { max-width: 600px; margin: 0 auto; background: #0d0f15; border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
  .header { background: linear-gradient(135deg, #0077b5, #00e5ff); padding: 24px; color: #ffffff; }
  .header h2 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; }
  .header p { margin: 0; font-size: 13px; opacity: 0.9; }
  .content { padding: 24px; }
  .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  .meta-table td { padding: 8px 0; font-size: 14px; vertical-align: top; }
  .meta-label { width: 120px; color: #94a3b8; font-weight: 600; }
  .meta-value { color: #ffffff; }
  .intent-badge { display: inline-block; padding: 3px 10px; background: rgba(0, 229, 255, 0.15); border: 1px solid rgba(0, 229, 255, 0.4); border-radius: 14px; color: #00e5ff; font-size: 12px; font-weight: 600; }
  .msg-heading { font-size: 13px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
  .msg-box { padding: 18px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; line-height: 1.65; white-space: pre-wrap; font-size: 15px; color: #e2e8f0; }
  .footer { border-top: 1px solid rgba(255,255,255,0.08); padding: 16px 24px; font-size: 12px; color: #64748b; text-align: center; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h2>New Portfolio Inquiry</h2>
    <p>Received via your portfolio contact form at tusharpandey.com</p>
  </div>
  <div class="content">
    <table class="meta-table">
      <tr>
        <td class="meta-label">From:</td>
        <td class="meta-value"><strong>${escapeHtml(trimmedName)}</strong> &lt;<a href="mailto:${escapeHtml(trimmedEmail)}" style="color:#00e5ff;text-decoration:none;">${escapeHtml(trimmedEmail)}</a>&gt;</td>
      </tr>
      <tr>
        <td class="meta-label">Inquiry Type:</td>
        <td class="meta-value"><span class="intent-badge">${escapeHtml(intentLabel)}</span></td>
      </tr>
      <tr>
        <td class="meta-label">Submitted At:</td>
        <td class="meta-value">${escapeHtml(timestamp)}</td>
      </tr>
    </table>
    <div class="msg-heading">Message Content:</div>
    <div class="msg-box">${escapeHtml(trimmedMessage)}</div>
  </div>
  <div class="footer">
    To respond directly to ${escapeHtml(trimmedName)}, simply click 'Reply' in your email client.
  </div>
</div>
</body>
</html>`;

    const textBody = `New Inquiry via Tushar Pandey Portfolio
=========================================
From: ${trimmedName} <${trimmedEmail}>
Inquiry Type: ${intentLabel}
Submitted At: ${timestamp}

Message:
${trimmedMessage}
-----------------------------------------
(Reply directly to this email to reach ${trimmedEmail})`;

    // 5. Send Email via Resend REST API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        reply_to: trimmedEmail,
        subject,
        html: htmlBody,
        text: textBody
      })
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      return res.status(resendResponse.status).json({
        success: false,
        code: 'PROVIDER_ERROR',
        error: resendData.message || 'Resend provider returned an error.'
      });
    }

    return res.status(200).json({
      success: true,
      id: resendData.id,
      message: 'Inquiry delivered successfully.'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while processing your inquiry.'
    });
  }
}
