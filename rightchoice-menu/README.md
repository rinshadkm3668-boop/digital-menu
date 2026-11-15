# Right Choice Coolbar — Digital Menu & Owner Dashboard

Customer menu at `/` (opened by QR code, no login) and a private owner-only dashboard at `/admin`.
Stack: React + Vite, Supabase (Auth, Postgres with Row Level Security, Storage).

## What was and was NOT tested

- Done: every source file passes a syntax check (esbuild).
- **Not yet done:** `npm install`, a full build, and a run against a real Supabase project. Your login, database, image uploads and deployment are untested until you complete the checklist at the bottom. Do not treat this as production-ready until every box there is ticked.

## Security model (one owner)

- No sign-up screen exists in the app. In Supabase you also turn **Allow new users to sign up** OFF.
- The database table `owner_config` holds exactly one row: the owner's user id. `is_owner()` is true only for that user.
- Row Level Security: the public can only **read** categories, settings and non-hidden products. Only the owner can insert/update/delete rows or upload/delete photos.
- The app uses only the public `anon` key. **Never** put the `service_role` key anywhere in this project or on Vercel.
- Even a valid Supabase login that is not the owner is signed out immediately by the dashboard and is also blocked by the database.

## Setup (about 20 minutes)

### 1. Create the Supabase project
1. Go to supabase.com, create a free account and a **New project** (choose a region close to you, e.g. Mumbai). Save the database password in a password manager.
2. **Authentication → Sign In / Providers → Email**: keep email enabled. Turn **Allow new users to sign up** OFF. (Turn "Confirm email" off or leave on; both work since you create the user manually.)

### 2. Create the database
1. **SQL Editor → New query**, paste all of `supabase/schema.sql`, click **Run**.
   This creates tables, security policies, the photo bucket, the 13 starter categories and sample products with **placeholder prices**.

### 3. Create your single owner account
1. **Authentication → Users → Add user → Create new user**. Enter your email and a strong password (10+ characters). Tick "Auto Confirm User".
2. Open `supabase/claim_owner.sql`, replace `REPLACE_WITH_YOUR_OWNER_EMAIL` with that same email, paste into SQL Editor and **Run**. The result must show exactly one row.
   Do not create any other users.

### 4. Get your keys
**Project Settings → API**: copy the **Project URL** and the **anon public** key.

### 5. Run locally (optional)
```bash
cp .env.example .env.local   # fill in the two values
npm install
npm run dev
```
Open http://localhost:5173 (menu) and http://localhost:5173/admin (dashboard).

### 6. Deploy (Vercel, free)
1. Put this folder in a private GitHub repository.
2. On vercel.com: **Add New → Project →** import the repo (framework: Vite is auto-detected).
3. Add **Environment Variables**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Deploy.
4. You get a permanent URL like `https://your-project.vercel.app`. (Netlify also works; `public/_redirects` is included.)

### 7. Allow password-reset emails to return to your site
**Authentication → URL Configuration**: set **Site URL** to your Vercel URL and add `https://your-project.vercel.app/admin` to **Redirect URLs**.
Note: Supabase's built-in email sender has a low hourly limit. For reliable reset emails, configure a custom SMTP provider later (Authentication → SMTP).

### 8. First-time use
1. Open `https://your-url/admin`, sign in.
2. **Settings**: enter phone number (Call button), tagline, address, cover photo.
3. **Products**: edit or delete the sample products and set your real prices.
4. **Settings → QR code**: download the PNG and print it. The QR points to the site root and never changes when you edit the menu.

## Everyday tasks (all from phone or laptop)
- **Change a price:** Products → tap the price → type → Save. It is live for customers immediately (the menu reloads data each time it opens).
- **Sold out / hide:** use the dropdown on each product.
- **Photo:** Edit → Replace photo. Photos are resized to max 1000 px and converted to WebP in your browser before upload.
- **New category:** Categories → type name → Add.

## Final verification checklist (tick all before printing QR codes)
- [ ] `npm run build` succeeds locally or on Vercel.
- [ ] Public menu opens on your phone without logging in; sample items appear.
- [ ] Owner login works on phone and laptop; wrong password is rejected.
- [ ] Logout works; visiting `/admin` afterwards shows the login screen.
- [ ] Add product with photo → appears on public menu.
- [ ] Change a price → public menu shows the new price after refresh.
- [ ] Sold out shows a badge; Hidden disappears from public menu.
- [ ] Delete asks for confirmation and removes the product and its photo.
- [ ] Password reset email arrives and the link lets you set a new password.
- [ ] Security test: in a private/incognito window, open the browser console on the public menu and try
      `fetch('YOUR_SUPABASE_URL/rest/v1/products?id=eq.<any id>', {method:'DELETE', headers:{apikey:'YOUR_ANON_KEY'}})` — it must NOT delete anything.
- [ ] Authentication → Users lists only your one account.

## Project structure
```
supabase/schema.sql        tables, RLS policies, storage bucket, starter data
supabase/claim_owner.sql   registers the one owner
src/pages/MenuPage.jsx     customer menu
src/components/            product card, setup notice
src/admin/                 login, reset, dashboard, products, categories, settings (QR)
src/lib/                   supabase client, data functions, image optimiser
src/styles/                menu.css (dark premium), admin.css (light utility)
public/logo.png            your logo, used unmodified
```

## Notes
- Food photos are not included; items without a photo show your logo as a placeholder. Upload real photos in the dashboard.
- The screenshots you shared were used only as layout inspiration (filter pills, search, grid/list toggle, category navigation); the visual design is new.
