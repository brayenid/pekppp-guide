# Dokumentasi Deployment & Arsitektur Produksi PEKPPP Kutai Barat
> **Target URL:** [https://pekppp.kutaibaratkab.go.id](https://pekppp.kutaibaratkab.go.id)  
> **Server:** cPanel Shared Hosting Diskominfopersandi Kutai Barat (`srv-cpanel` / `103.210.105.47`)  
> **User cPanel:** `aptikakutaibarat`  
> **Direktori Aplikasi:** `/home/aptikakutaibarat/public_html/pekppp.kutaibaratkab.go.id/`  
> **Runtime:** Node.js 22 LTS (`/opt/cpanel/ea-nodejs22/bin/node`)  
> **Port Internal:** `3005` (Reverse Proxy Apache mod_proxy)  
> **Database:** PostgreSQL on Supabase (Prisma ORM)

---

## 1. Arsitektur Deployment & Alur CI/CD

Karena firewall inbound server pemerintah (CSF/iptables) memblokir port SSH (22) dan FTP dari luar, deployment menggunakan metode **Git Deployment Branch**:

```
[ Developer ]
      │ (git push)
      ▼
[ GitHub Repository: main ]
      │
      ▼ (Trigger GitHub Actions: .github/workflows/deploy.yml)
[ GitHub Runner ]
      ├─ 1. Setup Node.js 22 & Install Dependencies
      ├─ 2. Prisma Generate
      ├─ 3. npm run build (Next.js Standalone Build)
      ├─ 4. Packaging standalone (.next/standalone + .next/static + public)
      └─ 5. Force-push artefak siap jalan ke branch: [ production-deploy ]
                                                           │
                                                           │ (Pull via HTTPS di Server cPanel)
                                                           ▼
                                            [ cPanel: pekppp.kutaibaratkab.go.id ]
                                            ├─ git reset --hard origin/production-deploy
                                            └─ Restart Node.js 22 di Port 3005
```

---

## 2. Riwayat Masalah (Issues) & Solusi Teknisnya

Berikut adalah rangkuman seluruh kendala yang dihadapi selama proses instalasi dan solusi definitifnya:

### 1. Port SSH (22) Diblokir Firewall Server
- **Gejala:** GitHub Actions mengalami `Connection timed out` saat mencoba rsync / SSH ke server `103.210.105.47:22`.
- **Penyebab:** Server OPD menerapkan firewall whitelist ketat yang memblokir akses port non-HTTP/HTTPS dari IP publik dinamis (seperti runner GitHub Actions).
- **Solusi:** Menghindari koneksi SSH inbound. GitHub Actions bertugas mengompilasi aplikasi, kemudian mem-push hasil build standalone ke branch khusus `production-deploy`. Server cPanel yang menarik kode dari GitHub via HTTPS outbound (port 443 tidak diblokir).

### 2. Kehabisan RAM (*Out of Memory*) Saat `npm install` di Server
- **Gejala:** Proses instalasi modul di server cPanel mati mendadak dengan status `Killed` atau `Exit code 137`.
- **Penyebab:** Lingkungan shared hosting memiliki limit RAM (CloudLinux LVE). Proyek Next.js 15 memiliki 60+ dependencies berat yang melampaui batas alokasi memori saat di-compile atau di-install di server.
- **Solusi:** Mengaktifkan mode **Standalone** di `next.config.js`:
  ```js
  output: 'standalone'
  ```
  Dengan standalone build, Next.js secara otomatis hanya membungkus file `node_modules` yang benar-benar dipakai ke dalam folder `.next/standalone`. Server cPanel tidak perlu menjalankan `npm install` sama sekali.

### 3. Berkas Tersembunyi `.next` Tidak Ikut Ter-copy ke Paket Rilis
- **Gejala:** Saat Node dijalankan di server, muncul error `Could not find a production build in the './.next' directory`.
- **Penyebab:** Sintaks bash glob `cp -r .next/standalone/* deploy-pkg/` hanya menyalin file/folder biasa dan secara default mengabaikan direktori yang diawali titik (dotfiles) seperti `.next/`.
- **Solusi:** Mengubah perintah salin di workflow GitHub Actions menjadi:
  ```bash
  cp -r .next/standalone/. deploy-pkg/
  ```

### 4. Directives Phusion Passenger Ditolak Apache
- **Gejala:** Akses web menghasilkan `500 Internal Server Error`, dan error log mencatat:
  `[core:alert] PassengerEnabled cannot occur within htaccess files`.
- **Penyebab:** Pengaturan EasyApache 4 di server shared hosting melarang direktif Passenger di tingkat `.htaccess` pengguna demi keamanan shared server.
- **Solusi:** Beralih ke **Apache Reverse Proxy murni** (`mod_proxy` + `mod_rewrite`) yang legal dan didukung penuh di `.htaccess`.

### 5. Port 3000 Bentrok (*EADDRINUSE 0.0.0.0:3000*)
- **Gejala:** Server gagal start dengan error: `listen EADDRINUSE: address already in use 0.0.0.0:3000`.
- **Penyebab:** Port default `3000` sudah terikat oleh service lain di server shared tersebut.
- **Solusi:** Memindahkan port aplikasi ke port `3005` menggunakan env flag:
  `PORT=3005 node server.js`

### 6. Variabel `.env` Tidak Terbaca oleh Prisma Client
- **Gejala:** Muncul error `PrismaClientInitializationError: Environment variable not found: DATABASE_URL`.
- **Penyebab:** Eksekusi langsung `node server.js` di lingkungan production tidak otomatis memuat file `.env`.
- **Solusi:** Memanfaatkan fitur bawaan Node.js 22 LTS dengan menambahkan flag `--env-file=.env`:
  ```bash
  /opt/cpanel/ea-nodejs22/bin/node --env-file=.env server.js
  ```

### 7. Root Domain Menampilkan Teks Kode Sumber `server.js` (Bukan Halaman Web)
- **Gejala:** Membuka `https://pekppp.kutaibaratkab.go.id` menampilkan teks kode JavaScript mentah (`performance.mark('next-start')...`), sedangkan membuka `https://pekppp.kutaibaratkab.go.id/login` atau `?v=1` menampilkan halaman normal.
- **Penyebab:** Modul Apache **`mod_dir` (DirectoryIndex)** secara default menyertakan nama file `server.js` ke dalam daftar indeks direktori. Saat user mengakses root domain `/`, Apache mendeteksi file fisik `server.js` di folder tersebut dan langsung menyajikannya sebagai file teks statis sebelum aturan `mod_rewrite` sempat dieksekusi.
- **Solusi:** Mematikan pencarian file index di baris paling atas `.htaccess`:
  ```apache
  DirectoryIndex disabled
  Options -Indexes
  ```

### 8. Server Actions Hang & Error 405 Method Not Allowed
- **Gejala:** Browser mengalami loading tanpa henti saat memuat halaman, dan console mencatat `POST https://pekppp.kutaibaratkab.go.id/ HTTP 405 Not Allowed`.
- **Penyebab:** Reverse proxy Apache tidak meneruskan header SSL asli, sehingga Next.js 15 mendeteksi protokol HTTP lokal dan menolak Server Actions karena dianggap ketidakcocokan Origin (CSRF Protection), atau WAF server menganggap POST ke file statis dilarang.
- **Solusi:** Menambahkan header protokol dan proteksi file di `.htaccess`:
  ```apache
  RewriteRule ^server\.js$ - [F,L]
  RequestHeader set X-Forwarded-Proto "https"
  RequestHeader set X-Forwarded-Port "443"
  ```

### 9. Proses Node.js Berhenti Sendiri Saat Terminal cPanel Ditutup (Error 503)
- **Gejala:** Beberapa menit setelah web aktif, web kembali menampilkan `503 Service Unavailable`.
- **Penyebab:** Proses Node yang dijalankan di terminal browser cPanel menjadi *child process* dari sesi shell tersebut. Begitu tab browser ditutup atau sesi cPanel timeout, sistem operasi mengirim sinyal `SIGHUP` untuk membunuh proses child.
- **Solusi:**
  1. Jalankan proses dengan perintah `disown -h` agar terlepas dari sesi shell.
  2. Pasang cron job pengawas (watchdog) setiap 5 menit di cPanel Cron Jobs yang mengetes ketersediaan port secara otomatis.

---

## 3. Konfigurasi File Penting

### File: `.htaccess`
Lokasi: `/home/aptikakutaibarat/public_html/pekppp.kutaibaratkab.go.id/.htaccess`

```apache
# 1. Matikan pencarian file index agar Apache TIDAK membaca server.js sebagai halaman statis
DirectoryIndex disabled

# 2. Matikan directory indexing demi keamanan
Options -Indexes

# 3. Aktifkan Rewrite Engine
RewriteEngine On

# 4. Amankan: cegah publik mendownload file server.js langsung
RewriteRule ^server\.js$ - [F,L]

# 5. Teruskan semua traffic ke aplikasi Next.js (Port 3005)
RewriteRule ^(.*)$ http://127.0.0.1:3005/$1 [P,L]

# 6. Teruskan header SSL & Protocol asli agar Server Action & koneksi tidak hang/loading terus
RequestHeader set X-Forwarded-Proto "https"
RequestHeader set X-Forwarded-Port "443"
```

### File: Watchdog Cron Job (cPanel)
- **Jadwal:** Once Per 5 Minutes (`*/5 * * * *`)
- **Command:**
  ```bash
  curl -s -m 2 http://127.0.0.1:3005/ > /dev/null || (cd /home/aptikakutaibarat/public_html/pekppp.kutaibaratkab.go.id && PORT=3005 nohup /opt/cpanel/ea-nodejs22/bin/node --env-file=.env server.js >> ~/app.log 2>&1 &)
  ```

---

## 4. SOP Update / Deployment Versi Baru

Ketika ada pembaruan fitur atau perbaikan kode oleh pengembang:

### Langkah A (Di Laptop / Komputer Developer):
1. Pastikan perubahan sudah dites di lokal:
   ```bash
   npm run build
   ```
2. Commit dan push ke branch `main`:
   ```bash
   git add .
   git commit -m "feat/fix: deskripsi pembaruan"
   git push origin main
   ```
3. Pantau tab **Actions** di GitHub repository. Tunggu workflow `Build and Package Standalone for Production` selesai hingga hijau (biasanya 1–2 menit).

---

### Langkah B (Di Server cPanel):
Buka menu **Terminal** di cPanel, lalu cukup jalankan perintah satu baris berikut:

```bash
cd /home/aptikakutaibarat/public_html/pekppp.kutaibaratkab.go.id && git fetch origin production-deploy && git reset --hard origin/production-deploy && pkill -f "PORT=3005" ; PORT=3005 nohup /opt/cpanel/ea-nodejs22/bin/node --env-file=.env server.js > ~/app.log 2>&1 & disown -h
```

### Penjelasan Perintah di Atas:
1. `cd ...`: Berpindah ke direktori domain PEKPPP.
2. `git fetch origin production-deploy && git reset --hard origin/production-deploy`: Menarik hasil kompilasi terbaru dari GitHub dan menimpa direktori dengan bersih.
3. `pkill -f "PORT=3005"`: Menghentikan instance Node.js versi lama yang sedang berjalan.
4. `PORT=3005 nohup ... server.js > ~/app.log 2>&1 &`: Menyalakan instance Node.js versi baru di port 3005 dan menyimpan output log ke `~/app.log`.
5. `disown -h`: Menjaga proses agar tetap hidup selamanya meskipun tab terminal cPanel ditutup.

---

## 5. Batasan & Aturan Keamanan Server (Strict Rules)
- **DILARANG KERAS** menyentuh, mengedit, atau menghapus file di luar folder `/home/aptikakutaibarat/public_html/pekppp.kutaibaratkab.go.id/`.
- Folder OPD lain seperti `/home/aptikakutaibarat/public_html/dashboardrealisasi.kutaibaratkab.go.id/` adalah sistem terpisah milik dinas lain dan tidak boleh dimodifikasi.
- Jangan menjalankan perintah `npm install` dengan dependency development secara utuh di server untuk mencegah server overload/LVE memory kill.
