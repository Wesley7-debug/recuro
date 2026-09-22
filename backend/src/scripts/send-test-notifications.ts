import "dotenv/config";
import nodemailer from "nodemailer";

const TO = "eugenefidelis573@gmail.com";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ── Site Colors ──────────────────────────────────────────────────────────────
const C = {
  primary: "#c49a5c",
  primaryHover: "#b38a4e",
  primaryDark: "#9a7440",
  primaryShadow: "rgba(196,154,92,0.18)",
  bg: "#faf6ef",
  surface: "#ffffff",
  surfaceAlt: "#faf8f4",
  ink: "#1c1c1a",
  inkBody: "#3d3b37",
  inkMuted: "#5a5752",
  inkFaint: "#7a7872",
  inkGhost: "#b5b2aa",
  border: "#e5e2da",
  borderLight: "#f0ede6",
  warm: "#f2e6d0",
  warmDark: "#7a6348",
  successBg: "#e8ead8",
  successText: "#4a5638",
  successBorder: "#c5c9ac",
  errorBg: "#fdf5f3",
  errorText: "#a5423a",
  errorBorder: "#f2d4cd",
};

// ── Base Wrapper ─────────────────────────────────────────────────────────────

function baseWrap(title: string, content: string, accentBarColor?: string): string {
  const barColor = accentBarColor || C.primary;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};font-family:'Sora','Space Grotesk',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:48px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:${C.surface};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04);">

          <!-- Gold Accent Bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,${barColor},${C.primaryHover},${barColor});"></td>
          </tr>

          <!-- Logo -->
          <tr>
            <td style="padding:36px 48px 0;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:${C.primary};border-radius:10px;padding:9px 22px;">
                    <span style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:3px;">REC URO</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:36px 48px 0;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:40px 48px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid ${C.borderLight};padding-top:24px;text-align:center;">
                    <p style="color:${C.inkGhost};font-size:11px;margin:0 0 6px;">Recuro &mdash; Know where your money goes.</p>
                    <p style="margin:0;"><a href="http://localhost:5173/dashboard/settings" style="color:${C.inkGhost};font-size:11px;text-decoration:underline;">Manage email preferences</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Billing Reminder ─────────────────────────────────────────────────────────

function billingReminderEmail(
  subName: string,
  amount: number,
  currency: string,
  billingDate: Date,
  reminderType: "7_days" | "3_days" | "1_day",
): { subject: string; html: string } {
  const symbols: Record<string, string> = { USD: "$", EUR: "\u20ac", GBP: "\u00a3", NGN: "\u20a6" };
  const sym = symbols[currency] || "$";
  const dateStr = billingDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const configs = {
    "7_days": {
      timing: "in 7 days",
      badge: "7 DAYS AWAY",
      badgeColor: C.primary,
      badgeBg: C.warm,
      urgency: "Upcoming",
      emoji: "\u23f0",
      barColor: C.primary,
    },
    "3_days": {
      timing: "in 3 days",
      badge: "3 DAYS AWAY",
      badgeColor: C.warmDark,
      badgeBg: "#ede4c8",
      urgency: "Approaching",
      emoji: "\u26a0\ufe0f",
      barColor: C.warmDark,
    },
    "1_day": {
      timing: "tomorrow",
      badge: "DUE TOMORROW",
      badgeColor: C.errorText,
      badgeBg: C.errorBg,
      urgency: "Action Required",
      emoji: "\ud83d\udea8",
      barColor: C.errorText,
    },
  };

  const c = configs[reminderType];

  const html = baseWrap(`${subName} billing ${c.timing}`, `
    <!-- Badge -->
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
      <tr>
        <td style="background:${c.badgeBg};border-radius:999px;padding:7px 18px;">
          <span style="color:${c.badgeColor};font-size:11px;font-weight:700;letter-spacing:1.5px;">${c.emoji} ${c.badge}</span>
        </td>
      </tr>
    </table>

    <!-- Title -->
    <h1 style="color:${C.ink};font-size:26px;font-weight:700;margin:0 0 12px;text-align:center;letter-spacing:-0.5px;">Subscription Reminder</h1>
    <p style="color:${C.inkBody};font-size:15px;margin:0 0 0;text-align:center;line-height:1.6;">
      Your <strong style="color:${C.ink};">${subName}</strong> subscription renews ${c.timing}.
    </p>

    <!-- Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 0;">
      <tr>
        <td style="background:${C.surfaceAlt};border:1px solid ${C.borderLight};border-radius:12px;padding:28px;">

          <!-- Service Name + Status -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr>
              <td>
                <p style="color:${C.inkFaint};font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 6px;">Service</p>
                <p style="color:${C.ink};font-size:20px;font-weight:700;margin:0;letter-spacing:-0.3px;">${subName}</p>
              </td>
              <td align="right" valign="top">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:${c.badgeBg};border-radius:8px;padding:6px 12px;">
                      <span style="color:${c.badgeColor};font-size:11px;font-weight:600;">${c.urgency}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Divider -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td style="border-top:1px solid ${C.borderLight};"></td></tr>
          </table>

          <!-- Amount + Date -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%">
                <p style="color:${C.inkFaint};font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 6px;">Amount</p>
                <p style="color:${C.ink};font-size:28px;font-weight:700;margin:0;letter-spacing:-0.5px;">${sym}${amount.toFixed(2)}</p>
              </td>
              <td width="50%" align="right">
                <p style="color:${C.inkFaint};font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 6px;">Billed On</p>
                <p style="color:${C.inkBody};font-size:15px;font-weight:600;margin:0;">${dateStr}</p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table cellpadding="0" cellspacing="0" style="margin:32px auto 0;">
      <tr>
        <td style="background:${C.primary};border-radius:10px;box-shadow:0 4px 14px ${C.primaryShadow};">
          <a href="http://localhost:5173/dashboard/subscriptions" style="display:inline-block;padding:15px 40px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">View in Dashboard &rarr;</a>
        </td>
      </tr>
    </table>
  `, c.barColor);

  return {
    subject: `${c.emoji} ${subName} subscription due ${c.timing}`,
    html,
  };
}

// ── Magic Link ───────────────────────────────────────────────────────────────

function magicLinkEmail(token: string): { subject: string; html: string } {
  const link = `http://localhost:5173/auth/verify?token=${token}`;

  const html = baseWrap("Sign in to Recuro", `
    <!-- Mail Icon -->
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
      <tr>
        <td style="width:56px;height:56px;background:${C.warm};border-radius:14px;text-align:center;vertical-align:middle;">
          <span style="font-size:26px;line-height:56px;">\u2709\ufe0f</span>
        </td>
      </tr>
    </table>

    <h1 style="color:${C.ink};font-size:26px;font-weight:700;margin:0 0 12px;text-align:center;letter-spacing:-0.5px;">Sign in to Recuro</h1>
    <p style="color:${C.inkBody};font-size:15px;margin:0 0 0;text-align:center;line-height:1.6;">
      Click the button below to access your account. This link expires in 15 minutes.
    </p>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" style="margin:32px auto 0;">
      <tr>
        <td style="background:${C.primary};border-radius:10px;box-shadow:0 4px 14px ${C.primaryShadow};">
          <a href="${link}" style="display:inline-block;padding:15px 48px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">Sign in to Recuro</a>
        </td>
      </tr>
    </table>

    <!-- Token -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td style="background:${C.surfaceAlt};border:1px solid ${C.borderLight};border-radius:10px;padding:18px 24px;text-align:center;">
          <p style="color:${C.inkFaint};font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;">Or copy this token</p>
          <p style="color:${C.primaryDark};font-size:12px;font-family:'SF Mono',Consolas,monospace;margin:0;word-break:break-all;letter-spacing:0.3px;">${token}</p>
        </td>
      </tr>
    </table>

    <p style="color:${C.inkGhost};font-size:12px;margin:28px 0 0;text-align:center;line-height:1.5;">
      If you didn't request this email, you can safely ignore it.
    </p>
  `);

  return {
    subject: "Sign in to Recuro",
    html,
  };
}

// ── Welcome ──────────────────────────────────────────────────────────────────

function welcomeEmail(name: string): { subject: string; html: string } {
  const html = baseWrap("Welcome to Recuro", `
    <!-- Hand Wave -->
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
      <tr>
        <td style="width:56px;height:56px;background:${C.warm};border-radius:14px;text-align:center;vertical-align:middle;">
          <span style="font-size:26px;line-height:56px;">\ud83d\udc4b</span>
        </td>
      </tr>
    </table>

    <h1 style="color:${C.ink};font-size:26px;font-weight:700;margin:0 0 12px;text-align:center;letter-spacing:-0.5px;">Welcome, ${name}</h1>
    <p style="color:${C.inkBody};font-size:15px;margin:0 0 0;text-align:center;line-height:1.6;">
      You're in. Here's how to get the most out of Recuro:
    </p>

    <!-- Steps -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 0;">
      <!-- Step 1 -->
      <tr>
        <td style="padding:0 0 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="40" valign="top">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:32px;height:32px;background:${C.primary};border-radius:8px;text-align:center;vertical-align:middle;">
                      <span style="color:#ffffff;font-size:14px;font-weight:700;line-height:32px;">1</span>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="padding-left:14px;">
                <p style="color:${C.ink};font-size:14px;font-weight:600;margin:0 0 4px;">Add your subscriptions</p>
                <p style="color:${C.inkFaint};font-size:13px;margin:0;line-height:1.5;">Manually add Netflix, Spotify, and any recurring payment.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Step 2 -->
      <tr>
        <td style="padding:0 0 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="40" valign="top">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:32px;height:32px;background:${C.primary};border-radius:8px;text-align:center;vertical-align:middle;">
                      <span style="color:#ffffff;font-size:14px;font-weight:700;line-height:32px;">2</span>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="padding-left:14px;">
                <p style="color:${C.ink};font-size:14px;font-weight:600;margin:0 0 4px;">Upload a bank statement</p>
                <p style="color:${C.inkFaint};font-size:13px;margin:0;line-height:1.5;">Our AI scans for recurring charges automatically.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Step 3 -->
      <tr>
        <td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="40" valign="top">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:32px;height:32px;background:${C.primary};border-radius:8px;text-align:center;vertical-align:middle;">
                      <span style="color:#ffffff;font-size:14px;font-weight:700;line-height:32px;">3</span>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="padding-left:14px;">
                <p style="color:${C.ink};font-size:14px;font-weight:600;margin:0 0 4px;">Never miss a payment</p>
                <p style="color:${C.inkFaint};font-size:13px;margin:0;line-height:1.5;">Get notified 7, 3, and 1 day before each renewal.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" style="margin:32px auto 0;">
      <tr>
        <td style="background:${C.primary};border-radius:10px;box-shadow:0 4px 14px ${C.primaryShadow};">
          <a href="http://localhost:5173/dashboard" style="display:inline-block;padding:15px 48px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">Go to Dashboard &rarr;</a>
        </td>
      </tr>
    </table>
  `);

  return {
    subject: "Welcome to Recuro",
    html,
  };
}

// ── Subscription Detected ────────────────────────────────────────────────────

function subscriptionDetectedEmail(
  subName: string,
  amount: number,
  currency: string,
  billingCycle: string,
): { subject: string; html: string } {
  const symbols: Record<string, string> = { USD: "$", EUR: "\u20ac", GBP: "\u00a3", NGN: "\u20a6" };
  const sym = symbols[currency] || "$";

  const html = baseWrap(`New subscription found`, `
    <!-- Check Icon -->
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
      <tr>
        <td style="width:56px;height:56px;background:${C.successBg};border:1px solid ${C.successBorder};border-radius:14px;text-align:center;vertical-align:middle;">
          <span style="font-size:26px;line-height:56px;">\u2705</span>
        </td>
      </tr>
    </table>

    <h1 style="color:${C.ink};font-size:26px;font-weight:700;margin:0 0 12px;text-align:center;letter-spacing:-0.5px;">Recurring Payment Detected</h1>
    <p style="color:${C.inkBody};font-size:15px;margin:0 0 0;text-align:center;line-height:1.6;">
      We found this subscription in your uploaded statement.
    </p>

    <!-- Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 0;">
      <tr>
        <td style="background:${C.surfaceAlt};border:1px solid ${C.borderLight};border-radius:12px;padding:28px;text-align:center;">
          <p style="color:${C.inkFaint};font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px;">Subscription</p>
          <p style="color:${C.ink};font-size:22px;font-weight:700;margin:0 0 8px;letter-spacing:-0.3px;">${subName}</p>
          <p style="color:${C.inkMuted};font-size:15px;margin:0;">${sym}${amount.toFixed(2)} <span style="color:${C.inkGhost};">&middot;</span> ${billingCycle}</p>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" style="margin:32px auto 0;">
      <tr>
        <td style="background:${C.primary};border-radius:10px;box-shadow:0 4px 14px ${C.primaryShadow};">
          <a href="http://localhost:5173/dashboard/subscriptions" style="display:inline-block;padding:15px 40px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">View Subscriptions &rarr;</a>
        </td>
      </tr>
    </table>
  `, C.successText);

  return {
    subject: `Detected: ${subName} (${sym}${amount.toFixed(2)}/${billingCycle})`,
    html,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n  Recuro Notification Test\n");
  console.log(`  Target: ${TO}`);
  console.log(`  Gmail:  ${process.env.GMAIL_EMAIL}\n`);

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  const emails = [
    billingReminderEmail("Netflix", 15.99, "USD", new Date(now + 7 * DAY), "7_days"),
    billingReminderEmail("Spotify", 9.99, "USD", new Date(now + 3 * DAY), "3_days"),
    billingReminderEmail("Adobe Creative Cloud", 54.99, "USD", new Date(now + 1 * DAY), "1_day"),
    welcomeEmail("Eugene"),
    magicLinkEmail("a".repeat(64)),
    subscriptionDetectedEmail("ChatGPT Plus", 20, "USD", "monthly"),
  ];

  for (let i = 0; i < emails.length; i++) {
    const { subject, html } = emails[i];
    const label = subject.substring(0, 60);
    process.stdout.write(`  [${i + 1}/${emails.length}] ${label}...`);

    try {
      await transporter.sendMail({
        from: `"Recuro" <${process.env.GMAIL_EMAIL}>`,
        to: TO,
        subject,
        html,
        headers: {
          "List-Unsubscribe": `<http://localhost:5173/dashboard/settings>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          "X-Mailer": "Recuro",
        },
      });
      console.log(" sent");
    } catch (err: any) {
      console.log(` FAILED: ${err.message}`);
    }
  }

  console.log(`\n  Done! ${emails.length} emails sent to ${TO}\n`);
}

main();
