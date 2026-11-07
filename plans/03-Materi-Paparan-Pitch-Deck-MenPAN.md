# MATERI PAPARAN EKSEKUTIF (PITCH DECK OUTLINE)
## TRANSFORMASI DIGITAL TATA KELOLA PEKPPP MANDIRI KABUPATEN KUTAI BARAT
**Audiens:** Kementerian PANRB (Kedeputian Bidang Pelayanan Publik)  
**Penyaji:** Bagian Organisasi Sekretariat Daerah Kabupaten Kutai Barat

---

### SLIDE 1: JUDUL & IDENTITAS INOVASI
* **Judul Utama:** Transformasi Tata Kelola PEKPPP Mandiri Berbasis *Living Document* dan *AI Pre-Evaluator* Terintegrasi Portal Nasional
* **Sub-Judul:** Upaya Pemerintah Kabupaten Kutai Barat dalam Meningkatkan Kualitas Pembinaan, Efisiensi Pemberkasan, dan Akuntabilitas Indeks Pelayanan Publik (IPP) Daerah.
* **Poin Kunci Pembuka (Talking Points):**
  * Aplikasi ini dibangun bukan sebagai pengganti aplikasi nasional, melainkan sebagai **Mesin Pembinaan dan Kesiapan Data Daerah (*Regional Coaching & Staging Hub*)** agar seluruh UPPP di Kutai Barat (bukan hanya lokus sampel) menerapkan standar pelayanan sesuai PermenPANRB No. 29 Tahun 2022.

---

### SLIDE 2: LATAR BELAKANG MASALAH (BEFORE VS AFTER)
* **Kondisi Sebelumnya (Konvensional):**
  1. **Sindrom "Cari Berkas dari Nol" Tiap Tahun:** OPD harus mengunggah ulang SK Standar Pelayanan, SOP, dan foto sarpras yang sama setiap tahun ke folder Google Drive baru.
  2. **Kualitas Bukti Dukung Tidak Merata:** Banyak OPD belum memahami standar dokumen yang benar (misal: komponen Standar Pelayanan tidak lengkap 14 poin, Berita Acara FKP tidak memuat unsur masyarakat).
  3. **Beban Berat Tim Evaluator Daerah:** Memeriksa ribuan halaman PDF dari puluhan OPD/Kecamatan/Puskesmas secara manual memakan waktu lama dan rentan terlewat.
  4. **Rekapitulasi Ganda:** Nilai harus dihitung di kertas kerja lokal lalu diinput ulang satu per satu ke portal nasional.
* **Solusi Terobosan Kami:**
  Satu ekosistem digital dari hulu (Perencanaan & Pembinaan) ke hilir (Evaluasi AI, Perhitungan IPP, dan Sinkronisasi API ke KemenPAN-RB).

---

### SLIDE 3: FONDASI PERENCANAAN & PEMBINAAN TERSTANDAR
* **Bagaimana Sistem Mengawal Tahap Perencanaan?**
  1. **Jendela Waktu 6 Fase Terkendali (`PeriodWindow`):** Sistem mengunci dan membuka akses secara disiplin mulai dari *Persiapan*, *Pengisian F-01*, *Survei F-03*, *Evaluasi F-02*, *Masa Sanggah*, hingga *Finalisasi*.
  2. **Pustaka Contoh Berkas (*Golden Standard Repository*):** Sebelum OPD mengunggah bukti, Bagian Organisasi menyediakan **Contoh Berkas Resmi** langsung di dalam aplikasi (contoh format SK SP 14 komponen, contoh BA FKP, contoh Maklumat) agar OPD memiliki acuan baku.
  3. **Slot Bukti Dukung Terarah (*Targeted Evidence Slots*):** Bukti dukung tidak lagi diunggah dalam satu folder campur aduk, melainkan dipetakan ke slot spesifik pada 6 Aspek dan 31 Indikator.

---

### SLIDE 4: INOVASI 1 — REPOSITORI "LIVING DOCUMENT" LINTAS TAHUN
* **Konsep:** *"Unggah Sekali, Perbarui Saat Berubah, Pantau Riwayatnya."*
* **Keunggulan bagi OPD & Evaluator:**
  * Dokumen kebijakan dan bukti fisik tersimpan pada **Master Repositori Unit (`UnitEvidenceMaster`)**.
  * Saat memasuki tahun evaluasi baru, OPD cukup menarik (*inherit*) dokumen yang masih berlaku atau mengunggah revisi baru.
  * Sistem menyimpan **Pohon Versi (*Version Tree*)** dan **Jejak Audit (*Audit Trail*)** seperti Google Drive, sehingga Evaluator dapat membandingkan progres perbaikan dokumen suatu OPD dari tahun ke tahun.
  * Dilengkapi optimasi otomatis (kompresi PDF & gambar) agar hemat penyimpanan dan cepat diakses di daerah dengan keterbatasan sinyal.

---

### SLIDE 5: INOVASI 2 — SOKET "AI PRE-EVALUATOR" (CO-PILOT TIM EVALUATOR)
* **Konsep:** Kecerdasan Buatan (Multimodal AI + Mesin Heuristik) sebagai asisten pemeriksa awal bagi Tim Evaluator Daerah, **bukan pengganti keputusan manusia**.
* **Apa yang Dilakukan AI Pre-Evaluator?**
  1. **Membedah Isi PDF & Foto Sarpras:** Memeriksa apakah dokumen SK Standar Pelayanan benar-benar memuat **14 komponen wajib**, serta memindai kelengkapan foto fasilitas (disabilitas, laktasi, ruang tunggu, atribut petugas).
  2. **Audit Kritis (*Critical Audit*):** Memberi peringatan otomatis jika terdapat anomali antara klaim centangan F-01 OPD dengan isi dokumen yang dilampirkan.
  3. **Rekomendasi Skor & Tingkat Keyakinan (*Confidence Score*):** Memberikan saran nilai awal (0–5) beserta penjelasan eksplisit mengapa bukti tersebut belum layak mendapat nilai maksimal (5).
  4. **Checklist Observasi Lapangan (*Verification Tips*):** Menyusun daftar poin spesifik yang wajib dicek langsung oleh evaluator saat turun ke lapangan.

---

### SLIDE 6: PRESISI METODOLOGI F-01, F-02, DAN F-03 (100% PATUH PERMENPANRB)
* **Kepatuhan Metodologi:**
  * **6 Aspek & 31 Indikator:** Bobot aspek terkunci sesuai standar nasional (Kebijakan Pelayanan 24%, Profesionalisme SDM 25%, Sarpras 18%, SIPP 11%, Konsultasi & Pengaduan 10%, Inovasi 12%), termasuk pemisahan indikator suplemen (Indikator 31).
  * **Survei Masyarakat F-03 Berbasis QR Code & Token Unik:**
    * Setiap lokus memiliki QR Code ruang layanan tersendiri.
    * Perhitungan fleksibel mendukung metode *Proportional* (bertahap) maupun *Strict* (target kuota penuh, misal $\ge$ 30 responden).
  * **Kalkulasi Real-Time Indeks Pelayanan Publik (IPP):**
    $$\text{Skor Akhir IPP} = (75\% \times \text{Skor F-02}) + (25\% \times \text{Skor F-03})$$
    Otomatis menghasilkan nilai skala 0–5 dan predikat (*A Pelayanan Prima* s.d. *F Sangat Buruk*).

---

### SLIDE 7: INTEROPERABILITAS & SINKRONISASI KE PORTAL MENPAN-RB
* **Kesiapan Integrasi Nasional (`evaluasi.menpan.go.id`):**
  * Aplikasi telah dilengkapi modul **`MenpanApiService`** berbasis spesifikasi **OpenAPI 3.0.3 (Bearer Token Authentication)**.
  * **Tagging Lokus Prioritas:** Membedakan lokus pembinaan internal daerah dan lokus prioritas yang wajib disinkronkan ke pusat.
  * **Pre-Sync Validator (`SyncValidatorService`):** Memastikan seluruh indikator F-01, F-02, dan kuota F-03 telah lengkap 100% dan bebas galat sebelum dikirim ke server KemenPAN-RB.

---

### SLIDE 8: KEBERLANJUTAN PASCA-EVALUASI (PUBLIC TRANSPARENCY & HELPDESK)
* **Evaluasi yang Berdampak pada Masyarakat:**
  1. **Publikasi Rapor IPP & Berita Acara Resmi:** Cetakan Berita Acara otomatis berstandar dokumen negara dan publikasi papan peringkat (*leaderboard*) transparansi kinerja OPD untuk memacu kompetisi sehat antar-unit.
  2. **Omnichannel Helpdesk / Tiket Pengaduan Publik (`Ticket`):** Masyarakat dapat mengirimkan laporan/keluhan layanan (baik berakun maupun anonim) yang langsung didisposisikan oleh Bagian Organisasi ke OPD terkait dan dipantau penyelesaiannya (*closed-loop feedback*).

---

### SLIDE 9: ALUR DEMO LANGSUNG (LIVE DEMO SCRIPT — 5 MENIT)
Jika diberikan waktu demonstrasi langsung di hadapan tim KemenPAN-RB, tampilkan urutan layar berikut:
1. **Layar 1 (Perencanaan & Standarisasi — 1 Menit):** Tampilkan pengaturan *6 Tahapan Jadwal (Timeline Windows)* dan menu *Contoh Berkas* yang menjadi panduan OPD.
2. **Layar 2 (Pengisian OPD & Living Document — 1 Menit):** Tampilkan bagaimana OPD mengisi F-01 dan mengunggah bukti pada slot terarah lengkap dengan *Riwayat Versi (Version Tree)*.
3. **Layar 3 (AI Pre-Evaluator & Penilaian F-02 — 2 Menit):** *(Highlight Utama)* Klik tombol **Analisis AI** pada salah satu aspek, tunjukkan hasil *Critical Audit*, *Confidence Score*, dan *Checklist Verifikasi Lapangan*, lalu tunjukkan diskusi 2-arah antara Evaluator dan OPD.
4. **Layar 4 (Hasil IPP, Berita Acara & Sinkronisasi MenPAN — 1 Menit):** Tampilkan rekapitulasi nilai gabungan (75% F-02 + 25% F-03), cetak PDF Berita Acara secara instan, dan tunjukkan panel **Sinkronisasi API KemenPAN-RB**.
