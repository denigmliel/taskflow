# 🗂️ TaskFlow Final — Panduan Deploy ke Vercel

Stack: **Next.js 14 + Prisma + Supabase (PostgreSQL) + NextAuth**

---

## 🚀 SETUP STEP-BY-STEP

### LANGKAH 1 — Setup Supabase (Database)

1. Buka **https://supabase.com** → Sign up / Login
2. Klik **"New Project"**
   - Name: `taskflow`
   - Password: buat password database yang kuat, **simpan di tempat aman**
   - Region: pilih **Southeast Asia (Singapore)**
3. Tunggu project selesai dibuat (~2 menit)

4. Ambil **Connection String**:
   - Buka: `Settings → Database → Connection string`
   - Tab **"URI"**
   - Copy untuk **Transaction mode** (port `6543`) → ini untuk `DATABASE_URL`
   - Copy untuk **Session mode** (port `5432`) → ini untuk `DIRECT_URL`

   Format URL-nya seperti ini:
   ```
   postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

---

### LANGKAH 2 — Setup Project Lokal

```bash
# Clone/extract project
cd taskflow-final

# Install dependencies
npm install

# Salin env file
cp .env.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@...supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@...supabase.com:5432/postgres"
NEXTAUTH_SECRET="jalankan: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

Generate `NEXTAUTH_SECRET`:
```bash
# Mac/Linux:
openssl rand -base64 32

# Windows (PowerShell):
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

---

### LANGKAH 3 — Setup Database & Seed

```bash
# Push schema ke Supabase
npm run db:push

# Isi data awal (user + sample projects)
npm run db:seed
```

Kalau sukses:
```
✅ Seed selesai!
📧 Login: admin@taskflow.dev
🔑 Password: admin123
```

---

### LANGKAH 4 — Test Lokal

```bash
npm run dev
# Buka http://localhost:3000
```

---

### LANGKAH 5 — Deploy ke Vercel

#### A. Push ke GitHub dulu:
```bash
git init
git add .
git commit -m "Initial commit: TaskFlow"
git branch -M main
git remote add origin https://github.com/username/taskflow.git
git push -u origin main
```

#### B. Deploy di Vercel:
1. Buka **https://vercel.com** → Login dengan GitHub
2. Klik **"New Project"**
3. Import repository `taskflow`
4. **PENTING — Tambahkan Environment Variables:**

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | `postgresql://...6543/postgres?pgbouncer=true` |
   | `DIRECT_URL` | `postgresql://...5432/postgres` |
   | `NEXTAUTH_SECRET` | hasil `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | `https://your-app.vercel.app` *(isi setelah dapat URL)* |

5. Klik **Deploy**

#### C. Update NEXTAUTH_URL:
Setelah deploy selesai, kamu dapat URL seperti `https://taskflow-abc.vercel.app`:
1. Di Vercel Dashboard → `Settings → Environment Variables`
2. Update `NEXTAUTH_URL` = `https://taskflow-abc.vercel.app`
3. Redeploy: `Deployments → ⋯ → Redeploy`

---

## 🔐 Akun Default

| Email | Password | Role |
|-------|----------|------|
| admin@taskflow.dev | admin123 | Admin |
| alice@team.com | member123 | Member |
| bob@team.com | member123 | Member |

**⚠️ Ganti password admin setelah login pertama kali!**

Untuk ganti password, jalankan di Prisma Studio:
```bash
npm run db:studio
# Buka http://localhost:5555
# Edit tabel users → update password field dengan bcrypt hash baru
```

Atau via endpoint API (tambahkan sendiri jika diperlukan).

---

## 📁 Struktur File

```
src/
├── app/
│   ├── (auth)/login/          ← Halaman login
│   ├── (app)/
│   │   ├── layout.tsx         ← Sidebar + auth guard
│   │   ├── dashboard/         ← Dashboard + charts
│   │   └── projects/
│   │       ├── page.tsx       ← List projects
│   │       ├── new/           ← Buat project
│   │       └── [id]/
│   │           ├── layout.tsx ← Tabs per project
│   │           ├── board/     ← Kanban board DnD
│   │           ├── team/      ← Manajemen member
│   │           └── activity/  ← Activity log
│   └── api/
│       ├── auth/[...nextauth] ← NextAuth handler
│       ├── dashboard/         ← Stats API
│       ├── projects/          ← CRUD projects
│       └── projects/[id]/
│           ├── tasks/         ← CRUD tasks
│           ├── members/       ← Team management
│           └── activities/    ← Activity log
├── components/
│   ├── layout/AppLayout       ← Sidebar
│   ├── tasks/TaskModal        ← Create/edit task
│   └── shared/Providers       ← Session provider
├── lib/
│   ├── prisma.ts             ← DB client
│   ├── auth.ts               ← NextAuth config
│   ├── activity.ts           ← Activity logger
│   └── utils.ts              ← Helpers
└── types/index.ts            ← TypeScript types
```

---

## 🛠️ Commands

```bash
npm run dev          # Development server
npm run build        # Build untuk production
npm run db:push      # Push schema ke database
npm run db:seed      # Isi data awal
npm run db:studio    # Prisma Studio (GUI database)
```

---

## ✅ Fitur yang Tersedia

- [x] Login email + password (private, 1 akun utama)
- [x] Dashboard statistik + bar chart + pie chart
- [x] CRUD Project dengan color picker
- [x] Kanban Board dengan **drag & drop** (@dnd-kit)
- [x] Filter task (search + priority)
- [x] Create/Edit Task — modal lengkap
- [x] Deadline tracking + overdue indicator
- [x] Progress bar per task
- [x] Team management (tambah member via email)
- [x] Activity Log (semua aksi tercatat)
- [x] Dark theme premium (Instrument Serif + DM Sans)
- [x] Responsive mobile & desktop
- [x] Deploy-ready untuk Vercel + Supabase (gratis)

---

## 💡 Tips Production

1. **Ganti email admin** dari `admin@taskflow.dev` ke email kamu sendiri di `prisma/seed.ts` sebelum seed
2. **Buat password kuat** — ganti dari `admin123` ke password yang lebih aman
3. **Disable registrasi publik** — sistem ini sudah private by design (tidak ada halaman register)
4. **Backup data** — Supabase free tier punya daily backup otomatis

---

## 🔧 Troubleshooting

**Error: "Can't reach database server"**
→ Pastikan `DATABASE_URL` dan `DIRECT_URL` sudah benar di `.env.local`

**Error: "NEXTAUTH_SECRET is not defined"**
→ Pastikan sudah generate secret dan tambahkan ke `.env.local`

**Login tidak bisa setelah deploy**
→ Pastikan `NEXTAUTH_URL` sudah di-update ke URL Vercel yang benar

**Prisma generate error saat build**
→ Pastikan `prisma generate` dijalankan sebelum build (sudah ada di `npm run build`)
