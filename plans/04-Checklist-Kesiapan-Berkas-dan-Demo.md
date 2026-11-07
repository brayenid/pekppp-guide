# DAFTAR PERIKSA (CHECKLIST) KESIAPAN BERKAS & DATA SISTEM
## PERSIAPAN PRESENTASI KE KEMENTERIAN PANRB

Gunakan daftar periksa ini untuk memastikan baik **berkas administrasi fisik/PDF** maupun **data di dalam aplikasi** sudah siap sebelum sesi paparan di hadapan KemenPAN-RB.

---

### A. CHECKLIST DOKUMEN REGULASI & PERENCANAAN ADMINISTRATIF
Siapkan berkas-berkas berikut dalam satu map fisik dan satu folder digital (PDF) untuk ditunjukkan apabila tim KemenPAN-RB menanyakan landasan tata kelola:

- [ ] **1. SK Bupati / Sekretaris Daerah tentang Tim Evaluator PEKPPP Mandiri Daerah**
  * *Keterangan:* Memuat susunan Pengarah, Penanggung Jawab (Bagian Organisasi), dan Anggota Tim Evaluator/Verifikator Daerah.
- [ ] **2. SK Penetapan Lokus Evaluasi (UPPP) Tahun Berjalan**
  * *Keterangan:* Mencantumkan daftar seluruh unit yang dievaluasi di daerah (Dinas/Badan, Kecamatan, RSUD, Puskesmas) serta penandaan **Lokus Prioritas** yang dilaporkan ke `evaluasi.menpan.go.id`.
- [ ] **3. Kerangka Acuan Kerja (KAK) / TOR Penyelenggaraan PEKPPP Mandiri Digital**
  * *Acuan File:* Lihat [01-KAK-Perencanaan-Sistem-PEKPPP.md](file:///c:/Users/braye/Documents/Temp%20Storage/Web%20Stuff/pekppp-proj/plans/01-KAK-Perencanaan-Sistem-PEKPPP.md).
- [ ] **4. Dokumen SOP dan Jadwal Tahapan Evaluasi Tahunan**
  * *Acuan File:* Lihat [02-SOP-dan-Timeline-Pelaksanaan-PEKPPP.md](file:///c:/Users/braye/Documents/Temp%20Storage/Web%20Stuff/pekppp-proj/plans/02-SOP-dan-Timeline-Pelaksanaan-PEKPPP.md).
- [ ] **5. Surat Edaran (SE) Sekretaris Daerah tentang Pelaksanaan PEKPPP Mandiri**
  * *Keterangan:* Bukti instruksi resmi kepada seluruh Kepala Perangkat Daerah/Camat/Direktur RSUD/Kepala Puskesmas terkait batas waktu pengisian F-01, pemenuhan bukti dukung, dan kuota F-03.

---

### B. CHECKLIST KESIAPAN DATA DI DALAM APLIKASI (SEBELUM LIVE DEMO)
Agar demonstrasi aplikasi berjalan mulus dan meyakinkan di hadapan KemenPAN-RB, pastikan kondisi data berikut sudah disiapkan di sistem:

- [ ] **1. Konfigurasi Periode & 6 Jendela Waktu (`PeriodWindow`) Sudah Terisi**
  * Pastikan tahun periode aktif (misal: `2026`) memiliki tanggal mulai dan berakhir yang logis untuk ke-6 fase (*Preparation*, *F-01 Filling*, *F-03 Survey*, *Evaluation F-02*, *Revision/Appeal*, *Finalization*).
- [ ] **2. Pustaka "Contoh Berkas" (`ContohBerkas`) Sudah Terisi Minimal 5–6 Dokumen Acuan**
  * Unggah contoh nyata dokumen standar (misal: *Contoh SK Standar Pelayanan 14 Komponen*, *Contoh Berita Acara FKP*, *Contoh Maklumat Pelayanan*, *Contoh Laporan SKM*). Ini sangat disukai oleh KemenPAN-RB karena membuktikan fungsi **pembinaan** berjalan sebelum evaluasi.
- [ ] **3. Satu "Lokus Percontohan" (Showcase Unit) dengan Data Lengkap 100%**
  * Pilih 1 OPD unggulan (misal: Disdukcapil, DPMPTSP, atau RSUD) yang sudah memiliki:
    * Pengisian F-01 lengkap pada 31 indikator.
    * Bukti dukung PDF dan foto terunggah pada ke-6 Aspek (termasuk contoh berkas yang memiliki riwayat versi `v1` dan `v2` untuk memamerkan fitur *Living Document*).
    * Hasil **AI Pre-Evaluator** yang sudah dijalankan (sehingga saat demo Anda bisa langsung menampilkan *Confidence Score*, *Critical Audit*, dan *Verification Tips* tanpa harus menunggu *loading* lama jika koneksi internet ruang rapat tidak stabil).
    * Data responden F-03 ($\ge 30$ responden) lengkap dengan simulasi tampilan QR Code ruang layanan.
    * Skor F-02 yang sudah diisi evaluator dan contoh percakapan dua arah pada kolom komentar indikator (`IndicatorComment`).
- [ ] **4. Kesiapan Panel Integrasi API KemenPAN-RB**
  * Pastikan halaman pengaturan integrasi MenPAN-RB siap ditampilkan untuk mendemonstrasikan mekanisme validasi pra-sinkronisasi (`SyncValidatorService`) dan koneksi *Bearer Token* ke `evaluasi.menpan.go.id`.

---

### C. ANTISIPASI PERTANYAAN KUNCI DARI TIM KEMENPAN-RB (FAQ STRATEGIS)

**1. *"Apakah aplikasi daerah ini tidak tumpang tindih dengan aplikasi nasional (`evaluasi.menpan.go.id`)?"***
> **Jawaban Kunci:**
> Sama sekali tidak tumpang tindih, justru memperkuat. Portal nasional KemenPAN-RB berfokus pada pelaporan akhir lokus prioritas. Sementara di daerah, Bagian Organisasi memiliki kewajiban **membina seluruh unit pelayanan** (termasuk seluruh Kecamatan dan Puskesmas) serta mengkurasi bukti dukung dari awal. Aplikasi ini berfungsi sebagai **dapur pembinaan, repositori dokumen lintas tahun (*Living Document*), dan verifikasi awal berbantuan AI** di tingkat daerah, yang hasilnya kemudian disinkronisasikan langsung ke `evaluasi.menpan.go.id` melalui integrasi API resmi.

**2. *"Bagaimana menjamin AI tidak salah dalam menilai kinerja OPD?"***
> **Jawaban Kunci:**
> Di dalam sistem kami, AI ditempatkan secara ketat sebagai **Pre-Evaluator (Asisten Pemeriksa Awal)**, bukan pengambil keputusan akhir. AI bertugas membaca dokumen PDF yang tebal (seperti mengecek apakah 14 komponen Standar Pelayanan sudah lengkap) dan mendeteksi ketidaksesuaian klaim F-01 OPD dengan lampirannya. Keputusan nilai akhir F-02 tetap 100% berada di tangan **Tim Evaluator Manusia** setelah melakukan verifikasi dan observasi lapangan.

**3. *"Bagaimana cara mengatasi beban OPD yang mengeluh harus mengunggah dokumen berulang-ulang setiap tahun?"***
> **Jawaban Kunci:**
> Kami merancang arsitektur **Master Repositori Bukti Dukung (*Living Document*)**. Dokumen yang masih berlaku dari tahun sebelumnya otomatis diwariskan dan tinggal diperbarui versinya jika ada revisi SK atau peningkatan fasilitas. Seluruh riwayat perubahan tercatat dalam *pohon versi (version tree)* sehingga OPD tidak pernah lagi mulai dari nol setiap tahun.
