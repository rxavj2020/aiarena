export type PluginField = { key: string; label: string; type: "text" | "password" | "select" | "toggle" | "textarea"; placeholder?: string; help?: string; options?: string[]; required?: boolean };

export type PluginDef = {
  id: string;
  name: string;
  category: "payments" | "storage" | "email" | "hosting" | "marketing" | "shipping" | "analytics";
  description: string;
  docsUrl: string;
  icon: string;
  fields: PluginField[];
  exclusiveGroup?: string; // only one plugin in group can be enabled (e.g. primary payment gateway)
  setupSteps: string[];
  canTest: boolean;
};

export const PLUGINS: PluginDef[] = [
  {
    id: "razorpay",
    name: "Razorpay",
    category: "payments",
    description: "Accept UPI, cards, netbanking, wallets & EMI. Includes webhook verification for automatic order confirmation.",
    docsUrl: "https://dashboard.razorpay.com/app/keys",
    icon: "💳",
    exclusiveGroup: "payment_gateway",
    canTest: true,
    fields: [
      { key: "keyId", label: "Key ID", type: "text", placeholder: "rzp_live_xxxxxxxx", required: true },
      { key: "keySecret", label: "Key Secret", type: "password", required: true },
      { key: "webhookSecret", label: "Webhook Secret", type: "password", help: "Set the same secret when creating the webhook in Razorpay → Settings → Webhooks" },
      { key: "themeColor", label: "Checkout theme colour", type: "text", placeholder: "#0f172a" },
    ],
    setupSteps: [
      "Create a Razorpay account and complete KYC.",
      "Go to Settings → API Keys → Generate Key. Paste the Key ID and Secret here.",
      "Go to Settings → Webhooks → Add: URL = {SITE_URL}/api/webhooks/razorpay, events: payment.captured, payment.failed. Use the same Webhook Secret.",
      "Enable the plugin. Test with a ₹1 order in Test Mode keys before switching to live keys.",
    ],
  },
  {
    id: "cashfree",
    name: "Cashfree Payments",
    category: "payments",
    description: "Cashfree PG checkout with UPI, cards, netbanking & pay-later. Webhook-based confirmation.",
    docsUrl: "https://merchant.cashfree.com/merchants/pg/developers/api-keys",
    icon: "🟣",
    exclusiveGroup: "payment_gateway",
    canTest: true,
    fields: [
      { key: "appId", label: "App ID (Client ID)", type: "text", required: true },
      { key: "secretKey", label: "Secret Key", type: "password", required: true },
      { key: "environment", label: "Environment", type: "select", options: ["sandbox", "production"], required: true },
    ],
    setupSteps: [
      "Create a Cashfree merchant account and activate Payment Gateway.",
      "Developers → API Keys → copy App ID and Secret Key (use sandbox keys to test).",
      "Developers → Webhooks → add {SITE_URL}/api/webhooks/cashfree for Payment Success/Failed events (version 2023-08-01).",
      "Enable the plugin and place a test order.",
    ],
  },
  {
    id: "smtp",
    name: "Email (SMTP)",
    category: "email",
    description: "Transactional email for order confirmations, shipping updates, password resets and admin new-order alerts. Works with Gmail, Zoho, Resend, SES, Brevo, etc.",
    docsUrl: "https://nodemailer.com/smtp/",
    icon: "✉️",
    canTest: true,
    fields: [
      { key: "host", label: "SMTP host", type: "text", placeholder: "smtp.gmail.com", required: true },
      { key: "port", label: "Port", type: "text", placeholder: "587", required: true },
      { key: "secure", label: "Use TLS (port 465)", type: "toggle" },
      { key: "user", label: "Username", type: "text", required: true },
      { key: "pass", label: "Password / App password", type: "password", required: true },
      { key: "fromName", label: "From name", type: "text", placeholder: "Aurelia Store" },
      { key: "fromEmail", label: "From email", type: "text", placeholder: "orders@yourstore.com", required: true },
      { key: "adminEmail", label: "New order notifications to", type: "text", placeholder: "owner@yourstore.com", help: "Comma-separate multiple recipients" },
    ],
    setupSteps: [
      "Gmail: enable 2-step verification, then create an App Password (Google Account → Security → App passwords). Host smtp.gmail.com, port 587.",
      "Resend/Brevo/SES: create SMTP credentials in the provider dashboard and verify your sending domain (SPF + DKIM).",
      "Paste credentials, set From email, click 'Send test email'.",
    ],
  },
  {
    id: "r2",
    name: "Cloudflare R2 Storage",
    category: "storage",
    description: "Store product images & uploads on Cloudflare R2 (S3-compatible, zero egress fees). Falls back to local storage when disabled.",
    docsUrl: "https://developers.cloudflare.com/r2/api/s3/tokens/",
    icon: "☁️",
    canTest: true,
    fields: [
      { key: "accountId", label: "Cloudflare Account ID", type: "text", required: true },
      { key: "accessKeyId", label: "R2 Access Key ID", type: "text", required: true },
      { key: "secretAccessKey", label: "R2 Secret Access Key", type: "password", required: true },
      { key: "bucket", label: "Bucket name", type: "text", required: true },
      { key: "publicUrl", label: "Public bucket URL", type: "text", placeholder: "https://cdn.yourstore.com or https://pub-xxx.r2.dev", required: true, help: "Enable public access or connect a custom domain on the bucket" },
    ],
    setupSteps: [
      "Cloudflare dashboard → R2 → Create bucket (e.g. store-media).",
      "Bucket → Settings → Public access: connect a custom domain (recommended) or enable r2.dev subdomain.",
      "R2 → Manage R2 API Tokens → Create token with Object Read & Write for the bucket. Copy Access Key ID & Secret.",
      "Paste values here, click 'Test connection', then enable. New uploads go to R2 automatically.",
    ],
  },
  {
    id: "cloudflare",
    name: "Cloudflare Hosting & CDN",
    category: "hosting",
    description: "Deploy behind Cloudflare: DNS, SSL, CDN caching, WAF & bot protection. Includes one-click cache purge and a deployment guide.",
    docsUrl: "https://developers.cloudflare.com/fundamentals/setup/",
    icon: "🟠",
    canTest: true,
    fields: [
      { key: "zoneId", label: "Zone ID", type: "text", help: "Found on the domain Overview page in the Cloudflare dashboard" },
      { key: "apiToken", label: "API Token", type: "password", help: "Create token with Zone → Cache Purge + Zone → Read permissions" },
      { key: "domain", label: "Domain", type: "text", placeholder: "yourstore.com" },
    ],
    setupSteps: [
      "Add your domain to Cloudflare and point the nameservers at Cloudflare.",
      "Host the Next.js app on any Node host (Cloudflare Pages via @opennextjs/cloudflare, a VPS with PM2/Docker, Railway, Render, Fly.io…). See DEPLOY.md.",
      "DNS → add an A/CNAME record for the app host, proxied (orange cloud). SSL/TLS → Full (strict).",
      "Optional: paste Zone ID + API token to enable one-click cache purge from this panel.",
    ],
  },
  {
    id: "whatsapp",
    name: "WhatsApp Chat Button",
    category: "marketing",
    description: "Floating WhatsApp button so customers can reach you instantly.",
    docsUrl: "https://faq.whatsapp.com/5913398998672934",
    icon: "💬",
    canTest: false,
    fields: [
      { key: "number", label: "WhatsApp number (with country code)", type: "text", placeholder: "919876543210", required: true },
      { key: "message", label: "Pre-filled message", type: "text", placeholder: "Hi! I have a question about my order." },
    ],
    setupSteps: ["Enter your business WhatsApp number in international format without + or spaces.", "Enable the plugin."],
  },
  {
    id: "analytics",
    name: "Analytics (GA4 / Meta Pixel)",
    category: "analytics",
    description: "Google Analytics 4 and Meta Pixel with purchase event tracking.",
    docsUrl: "https://support.google.com/analytics/answer/9304153",
    icon: "📈",
    canTest: false,
    fields: [
      { key: "ga4Id", label: "GA4 Measurement ID", type: "text", placeholder: "G-XXXXXXXXXX" },
      { key: "metaPixelId", label: "Meta Pixel ID", type: "text" },
    ],
    setupSteps: ["Create a GA4 property and copy the Measurement ID.", "Create a Meta Pixel in Events Manager and copy its ID.", "Enable the plugin — page views and purchases are tracked automatically."],
  },
  {
    id: "shiprocket",
    name: "Shiprocket (Delivery management)",
    category: "shipping",
    description: "Compare courier rates, create shipments, assign AWB, schedule pickups, print labels and track deliveries — right from the order page. Tracking updates flow back automatically via webhook.",
    docsUrl: "https://app.shiprocket.in/api-user",
    icon: "📦",
    canTest: true,
    fields: [
      { key: "email", label: "API user email", type: "text", required: true, help: "Shiprocket → Settings → API → Configure → Create API user (not your login email)" },
      { key: "password", label: "API user password", type: "password", required: true },
      { key: "pickupLocation", label: "Pickup location name", type: "text", placeholder: "Primary", required: true, help: "Exactly as named under Settings → Pickup Addresses" },
      { key: "pickupPostcode", label: "Pickup PIN code", type: "text", placeholder: "560001", required: true, help: "Used for rate & serviceability checks" },
      { key: "defaultWeightKg", label: "Default package weight (kg)", type: "text", placeholder: "0.5" },
      { key: "defaultDims", label: "Default package L×B×H (cm)", type: "text", placeholder: "20x15x10" },
      { key: "autoShip", label: "Auto-create Shiprocket order when an order is paid / COD placed", type: "toggle" },
      { key: "webhookToken", label: "Webhook token", type: "password", help: "Any secret string; enter the same value as the x-api-key header in Shiprocket → Settings → API → Webhooks" },
    ],
    setupSteps: [
      "Shiprocket → Settings → API → Configure → Create an API user (email + password). Paste them here.",
      "Settings → Pickup Addresses → add your warehouse; enter its name and PIN code here.",
      "Optional: Settings → API → Webhooks → URL {SITE_URL}/api/webhooks/shiprocket, header x-api-key = your Webhook token. Status changes (in transit / delivered / RTO) then update orders automatically.",
      "Test connection and enable. Open any order → 'Shiprocket' panel → compare couriers → Ship.",
    ],
  },
  {
    id: "firestore",
    name: "Google Firestore (Database)",
    category: "storage",
    description: "Use Firestore as the durable database for store data. Every product, order, customer, coupon, review and setting is written through to Firestore in real time; the built-in SQLite file acts as a fast local index that can be rebuilt from Firestore with one click (ideal for redeploys and disaster recovery).",
    docsUrl: "https://console.firebase.google.com/",
    icon: "🔥",
    canTest: true,
    fields: [
      { key: "projectId", label: "Firebase / GCP project ID", type: "text", required: true },
      { key: "clientEmail", label: "Service account email", type: "text", placeholder: "firebase-adminsdk-xxxx@project.iam.gserviceaccount.com", required: true },
      { key: "privateKey", label: "Service account private key", type: "textarea", required: true, help: "The private_key value from the downloaded JSON (including BEGIN/END lines)" },
      { key: "databaseId", label: "Database ID", type: "text", placeholder: "(default)" },
      { key: "collectionPrefix", label: "Collection prefix", type: "text", placeholder: "store_", help: "Lets several stores share one project" },
      { key: "autoSyncMinutes", label: "Background full-sync interval (minutes, 0 = off)", type: "text", placeholder: "15" },
    ],
    setupSteps: [
      "Firebase console → Create project → Build → Firestore Database → Create database (production mode).",
      "Project settings → Service accounts → Generate new private key. Open the JSON.",
      "Paste project_id, client_email and private_key here. Click 'Test connection'.",
      "Enable, then click 'Sync everything to Firestore' once. From then on all writes are mirrored automatically.",
      "On a fresh server: configure this plugin, then click 'Restore from Firestore' to rebuild the local database.",
    ],
  },
];

export const pluginById = (id: string) => PLUGINS.find((p) => p.id === id);
