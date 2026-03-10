# 🚀 Waraka — Production & Admin Guide

This document explains everything you need to:
1. Become an admin and add manuscripts
2. Configure email templates correctly
3. Deploy to production (Vercel)

---

## 🔐 Step 1 — Become an Admin

Admin authorization is based on an **environment variable** (`ADMIN_EMAILS`), not a database role.

### Locally (development)

Create a `.env.local` file at the root of the project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://olqpqxhebeavktkucori.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ADMIN_EMAILS=your@email.com
```

Replace `your@email.com` with the email address you used to register on the platform.
**Multiple admins**: separate with commas → `ADMIN_EMAILS=admin1@example.com,admin2@example.com`

After setting this, restart `npm run dev`. You can now access `/admin` when logged in with that email.

---

## 📄 Step 2 — Add Manuscripts for Contributors

Once you are an admin:

1. Go to **`/admin/manuscripts`**
2. Click **"New Manuscript"**
3. Fill in: **Title** (required), Description, Source/Collection
4. **Drag and drop** all the segmented image files for that manuscript (JPG, PNG, etc.)
   - Files are sorted alphabetically, so name them in order: `page_001.jpg`, `page_002.jpg`, etc.
5. Click **Upload** — images go to Supabase Storage and segment metadata is created automatically
6. Contributors can now see and transcribe them at `/transcribe`

---

## ✉️ Step 3 — Email Templates & Confirmation Links

### Where emails are configured

Waraka uses **Supabase Auth built-in email service** for all transactional emails.

**Go to:** [Supabase Dashboard → Authentication → Email Templates](https://supabase.com/dashboard/project/olqpqxhebeavktkucori/auth/templates)

### Templates to configure

| Template | Description |
|---|---|
| **Confirm signup** | Sent when a new user registers |
| **Magic Link** | If you enable Magic Link login |
| **Reset Password** | When user requests password reset |
| **Change Email Address** | When user changes their email |

### ⚠️ Critical: Fix the redirect URL for production

By default, Supabase uses a placeholder `{{ .SiteURL }}` in templates. Before going live:

1. **Go to:** Supabase Dashboard → Authentication → **URL Configuration**
2. Set **Site URL** to your production URL: `https://your-domain.com`
3. Add **Redirect URLs** (whitelist):
   ```
   https://your-domain.com/auth/callback
   https://your-domain.com/**
   ```

The confirmation email template uses:
```html
<a href="{{ .ConfirmationURL }}">Confirm your email</a>
```
Which automatically uses your Site URL — no code change needed.

### Optional: Use Resend for better deliverability

For high-volume or branded emails (recommended for production):

1. Create an account at [resend.com](https://resend.com) and get an API key
2. Add a custom domain in Resend and verify DNS records
3. In Supabase → Authentication → **SMTP Settings**:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: `your_resend_api_key`
   - Sender email: `noreply@your-domain.com`

---

## 🌐 Step 4 — Deploy to Vercel (Production)

### 4.1 Push your code to GitHub

```bash
git init
git add .
git commit -m "feat: Waraka platform v1"
git remote add origin https://github.com/you/waraka.git
git push -u origin main
```

### 4.2 Connect to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Framework: **Next.js** (auto-detected)

### 4.3 Set Environment Variables on Vercel

In Vercel → Project → **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://olqpqxhebeavktkucori.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service_role key (required for admin bypass RLS) |
| `ADMIN_EMAILS` | `your@email.com` (comma-separated for multiple) |

> 💡 Get your keys from: [Supabase Dashboard → Project Settings → API](https://supabase.com/dashboard/project/olqpqxhebeavktkucori/settings/api)

### 4.4 Deploy

Click **Deploy** in Vercel. Your site will be live at `https://your-project.vercel.app`.

### 4.5 Update Supabase URLs for production

After getting your Vercel URL:

1. **Supabase → Authentication → URL Configuration**:
   - Site URL: `https://your-project.vercel.app`
   - Add to Redirect URLs: `https://your-project.vercel.app/**`

2. **Supabase → Storage → Buckets**:
   - Ensure `manuscripts` bucket is set to **Public** (for image display)

---

## 🛡️ Security Checklist (Already Applied)

All of the following have been hardened in your project:

- ✅ RLS enabled on all tables (`manuscripts`, `segments`, `transcriptions`, `profiles`, `achievements`, `contributor_achievements`, `export_logs`, `webhooks`)
- ✅ Admin routes protected at middleware level (not just client-side)
- ✅ Spam detection server-side before inserting transcriptions
- ✅ Contributor suspension system (`is_suspended` flag)
- ✅ Rate limiting conceptually enforced at DB level
- ✅ `handle_new_user` function with fixed `search_path` (prevents SQL injection via search path manipulation)
- ✅ UUIDs for all file names in Storage (prevents path traversal)
- ✅ All secrets/env vars server-side only (`ADMIN_EMAILS` is never exposed to the browser)
- ⚠️ Enable **Leaked Password Protection** in Supabase → Auth → Password Protection

---

## 🔑 Quick Reference: Get Your Supabase Keys

Go to: https://supabase.com/dashboard/project/olqpqxhebeavktkucori/settings/api

- **Project URL**: `https://olqpqxhebeavktkucori.supabase.co`
- **anon key**: shown as "Project API keys → anon public"
- **service_role key**: shown as "Project API keys → service_role"

---

## 📝 Local `.env.local` Template

Copy this to a `.env.local` file at the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://olqpqxhebeavktkucori.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=REPLACE_WITH_YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=REPLACE_WITH_YOUR_SERVICE_ROLE_KEY
ADMIN_EMAILS=REPLACE_WITH_YOUR_EMAIL
```

> ⚠️ Never commit `.env.local` to git. It is already in `.gitignore`.
