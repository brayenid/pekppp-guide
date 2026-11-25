# PEKPPP Kutai Barat (Platform Evaluasi Kinerja Penyelenggaraan Pelayanan Publik)

Platform pemantauan dan evaluasi kinerja penyelenggaraan pelayanan publik Kabupaten Kutai Barat berbasis Next.js 15, Prisma ORM, dan PostgreSQL (Supabase).

---

## 📖 Dokumentasi Deployment & Troubleshooting Produksi

Untuk panduan lengkap mengenai arsitektur server, alur CI/CD, daftar 9 isu produksi & cara mengatasinya, serta SOP push update ke server cPanel, silakan baca:

👉 **[DEPLOYMENT.md](./DEPLOYMENT.md)**

---

## 🚀 Alur Push Update Cepat (Quick Summary)

1. **Lokal (Developer):**
   ```bash
   git add .
   git commit -m "Update deskripsi"
   git push origin main
   ```
2. **GitHub Actions:**
   Otomatis mengompilasi standalone Next.js dan mem-push artefak ke branch `production-deploy`.
3. **Server (cPanel Terminal):**
   ```bash
   cd /home/aptikakutaibarat/public_html/pekppp.kutaibaratkab.go.id && git fetch origin production-deploy && git reset --hard origin/production-deploy && pkill -f "PORT=3005" ; PORT=3005 nohup /opt/cpanel/ea-nodejs22/bin/node --env-file=.env server.js > ~/app.log 2>&1 & disown -h
   ```

---

## 🛠️ Tech Stack
- **Framework:** Next.js 15 (App Router, Server Actions, Standalone Output)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Lucide React
- **Database & ORM:** PostgreSQL (Supabase) via Prisma ORM
- **Hosting / Web Server:** cPanel EasyApache 4 (Reverse Proxy `mod_proxy`) + Node.js 22 LTS
