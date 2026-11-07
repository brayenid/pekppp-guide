# SPESIFIKASI TEKNIS & RANCANG BANGUN SISTEM (TECHNICAL BLUEPRINT)
## ARSITEKTUR SPBE, BASIS DATA (ERD), DAN PEMODELAN UML
### SISTEM INFORMASI PEKPPP MANDIRI KABUPATEN KUTAI BARAT

---

### 1. PENDAHULUAN & KESELARASAN STANDAR SPBE
Dokumen Spesifikasi Teknis ini disusun sebagai lampiran rancang bangun perangkat lunak (*Software Design Document*) untuk memenuhi standar **Sistem Pemerintahan Berbasis Elektronik (SPBE)** sebagaimana diatur dalam Perpres Nomor 95 Tahun 2018 dan Arsitektur SPBE Nasional.

Aplikasi PEKPPP Mandiri Kabupaten Kutai Barat dirancang dengan prinsip:
1. **Modular & Clean Domain Architecture:** Memisahkan logika bisnis perhitungan regulasi KemenPAN-RB (`src/core/domain`) dari lapisan antarmuka dan akses basis data (`src/services` & `src/actions`).
2. **Interoperabilitas Terbuka (OpenAPI 3.0.3):** Menyediakan modul konektor (`MenpanApiService`) dan validator pra-sinkronisasi (`SyncValidatorService`) untuk pertukaran data langsung dengan portal nasional `evaluasi.menpan.go.id`.
3. **Efisiensi Penyimpanan & Living Document:** Mengimplementasikan arsitektur *Master Evidence Repository* (`UnitEvidenceMaster`) yang mendukung pewarisan dokumen lintas tahun, pohon versi (*version tree*), serta kompresi PDF/citra otomatis sebelum disimpan ke *Object Storage* (*Cloudflare R2 / S3*).
4. **Kecerdasan Buatan Terkendali (*Human-in-the-Loop AI*):** Mengintegrasikan *Multimodal AI Engine* (Google Gemini API) yang dipadukan dengan *Rule-based Heuristic Fallback* untuk menganalisis kelengkapan 14 komponen Standar Pelayanan dan kesesuaian bukti fisik F-01 tanpa mengambil alih wewenang keputusan akhir evaluator manusia.

---

### 2. ARSITEKTUR TEKNOLOGI (TECHNOLOGY STACK)
| Lapisan Sistem | Teknologi yang Digunakan | Fungsi & Peran dalam Arsitektur |
| :--- | :--- | :--- |
| **Application Framework** | Next.js 15 (App Router) + React 19 + TypeScript 5.7 | Kerangka kerja *full-stack* modern dengan *Server Actions* dan *Server-Side Rendering (SSR)* untuk performa tinggi dan keamanan tipe data. |
| **Database & ORM** | PostgreSQL + Prisma ORM 6.3 | Basis data relasional transaksional dengan dukung *JSONB* untuk pohon versi dokumen, log sinkronisasi, dan catatan audit AI. |
| **Cloud Object Storage** | AWS SDK S3 / Cloudflare R2 + Local Fallback | Penyimpanan berkas bukti dukung PDF dan foto sarana-prasarana berkapasitas besar dengan biaya efisiensi tinggi. |
| **Document & Image Processing** | `pdf-lib`, `pdfjs-dist`, `@react-pdf/renderer`, Client Image Compressor | Ekstraksi teks PDF untuk audit AI, optimasi/kompresi ukuran berkas PDF, serta pencetakan Berita Acara resmi secara dinamis. |
| **AI Pre-Evaluator Engine** | Multimodal Gemini AI + Heuristic Rule Engine | Pemindaian dokumen bukti dukung dan foto fasilitas untuk menghasilkan rekomendasi skor, *confidence level*, dan *critical audit*. |
| **Keamanan & Autentikasi** | `jose` (JWT Edge-compatible) + `bcryptjs` | Autentikasi berbasis *JSON Web Token* pada *HTTP-Only Cookie*, *Role-Based Access Control* (`SUPER_ADMIN` & `OPD`), serta *Middleware Guard*. |
| **Notifikasi & PWA** | `web-push` (VAPID) + Integrasi WhatsApp | Dukungan *Progressive Web App* (dapat diinstal di perangkat mobile/desktop) dengan notifikasi *real-time* ke evaluator dan OPD. |

---

### 3. ARSITEKTUR TINGKAT TINGGI (HIGH-LEVEL SYSTEM ARCHITECTURE)

```mermaid
flowchart TB
    subgraph Client_Layer ["Lapisan Pengguna (Client & PWA Layer)"]
        U_Admin["Koordinator / Tim Evaluator\n(Bagian Organisasi)"]
        U_OPD["Admin Lokus / UPPP\n(OPD, Kecamatan, RSUD, Puskesmas)"]
        U_Pub["Masyarakat Pengguna Layanan\n(QR Survey F-03 & Helpdesk)"]
    end

    subgraph App_Layer ["Lapisan Aplikasi (Next.js 15 App Router & Server Actions)"]
        MW["Auth Guard & PeriodWindow Access Control\n(Middleware & Role Verification)"]
        
        subgraph Core_Modules ["Modul Bisnis Utama"]
            M_Eval["Evaluation & Weighted Calculator\n(F-01, F-02, F-03, IPP 75:25)"]
            M_Doc["Living Document & Version Tree\n(Evidence Master & Compliance)"]
            M_AI["AI Pre-Evaluator Service\n(14 Komponen SP & Gap Analysis)"]
            M_Sync["MenPAN-RB Sync & Validator\n(OpenAPI 3.0.3 Client)"]
            M_Tkt["Omnichannel Helpdesk & Public Portal\n(Ticketing & Contoh Berkas)"]
        end
    end

    subgraph Data_External ["Lapisan Penyimpanan & Integrasi Eksternal"]
        DB[("PostgreSQL Database\n(20 Tabel Relasional & JSONB)")]
        R2[("Cloudflare R2 / S3 Storage\n(Repositori Berkas PDF & Foto)")]
        AI_API["Multimodal AI API\n(Gemini Vision & Document Analyzer)"]
        MENPAN["Portal Nasional KemenPAN-RB\n(evaluasi.menpan.go.id API)"]
        PUSH["Web Push Notification & WhatsApp\n(VAPID Service Worker)"]
    end

    U_Admin & U_OPD & U_Pub --> MW
    MW --> Core_Modules
    M_Eval & M_Doc & M_Tkt --> DB
    M_Doc --> R2
    M_AI --> AI_API
    M_AI --> DB
    M_Sync --> MENPAN
    Core_Modules --> PUSH
```

---

### 4. ENTITY RELATIONSHIP DIAGRAM (ERD) — BASIS DATA SISTEM
Basis data terdiri atas **20 entitas tabel** yang saling berelasi secara terstruktur untuk menangani siklus perencanaan periode, instrumen 6 aspek & 31 indikator, penilaian F-01/F-02/F-03, repositori *Living Document*, hingga tiket pengaduan masyarakat.

```mermaid
erDiagram
    EvaluationPeriod ||--o{ PeriodWindow : "memiliki 6 fase"
    EvaluationPeriod ||--o{ EvaluationAgenda : "memiliki agenda"
    EvaluationAgenda ||--o{ Evaluation : "menaungi"

    Category ||--o{ Unit : "mengelompokkan"
    Profile ||--o{ UserUnit : "terikat ke"
    Unit ||--o{ UserUnit : "dikelola oleh"

    Unit ||--o{ Evaluation : "dievaluasi per tahun"
    Unit ||--o{ UnitEvidenceMaster : "menyimpan living document"
    Unit ||--o{ Ticket : "menerima disposisi"

    Aspect ||--o{ Indicator : "memuat 31 indikator"
    Evaluation ||--o{ EvaluationScore : "memiliki rincian nilai"
    Indicator ||--o{ EvaluationScore : "dinilai pada"

    EvaluationScore ||--o{ IndicatorComment : "didiskusikan dalam"
    Profile ||--o{ IndicatorComment : "menulis komentar"

    Evaluation ||--o{ F03Respondent : "mengumpulkan responden"
    Evaluation ||--o{ IndicatorEvidenceSubmission : "melampirkan bukti tahunan"
    EvidenceSlotConfig ||--o{ IndicatorEvidenceSubmission : "mengatur slot wajib"

    MediaAsset ||--o{ ContohBerkas : "dikurasi sebagai"
    MediaAsset ||--o{ Article : "menjadi sampul"

    Profile ||--o{ Ticket : "melaporkan"
    Ticket ||--o{ TicketMessage : "memiliki riwayat pesan"
    Profile ||--o{ TicketMessage : "membalas"

    EvaluationPeriod {
        string id PK
        int year UK
        int targetF03Quota
        string f03CalculationMethod
        boolean isOpen
        boolean isPublished
    }

    PeriodWindow {
        string id PK
        string periodId FK
        string phaseKey
        datetime startDate
        datetime endDate
        boolean canFillF01
        boolean canUploadEvidence
        boolean canFillF03
        boolean canEvaluateF02
    }

    Unit {
        string id PK
        string code
        string name UK
        string categoryId FK
        boolean isActive
    }

    Aspect {
        string id PK
        string code UK
        string name
        float aspectWeight
        int orderIndex
    }

    Indicator {
        string id PK
        string aspectId FK
        string code
        int indicatorNumber UK
        string question
        float indicatorWeight
        boolean isSupplementary
    }

    Evaluation {
        string id PK
        int year
        string unitId FK
        float totalScore
        float percentage
        float scale5
        string status
        boolean isPriority
        int f03Count
        float f03Scale5
        float finalIppScore
        string syncStatus
        string menpanEvaluationId
        json aiEvaluatorNotes
    }

    EvaluationScore {
        string id PK
        string evaluationId FK
        string indicatorId FK
        json f01Data
        boolean f01Submitted
        float score
        float aiSuggestedScore
        float aiConfidence
        string aiCriticalAudit
        string aiWeaknessNotes
        string aiVerificationTips
    }

    IndicatorEvidenceSubmission {
        string id PK
        string evaluationId FK
        string aspectCode
        string slotKey
        string fileUrl
        json attachments
        json history
        string aiStatus
        json aiInsights
    }

    UnitEvidenceMaster {
        string id PK
        string unitId FK
        string aspectCode
        string slotKey
        string fileUrl
        int lastSourceYear
        json attachments
        json history
    }

    F03Respondent {
        string id PK
        string evaluationId FK
        int respondentNo
        json answers
        float totalScore
        float scale5
        string submittedVia
    }
```

---

### 5. PEMODELAN UML (UNIFIED MODELING LANGUAGE)

#### 5.1. Diagram Arsitektur Kelas & Layanan Inti (Class / Domain Diagram)
Menggambarkan pemisahan tanggung jawab antara *Domain Calculator*, *AI Evaluator*, *Living Document Master*, dan *MenPAN API Service*.

```mermaid
classDiagram
    class PekpppCalculator {
        +calculatePekpppScore(inputs: IndicatorScoreInput[]) PekpppCalculationResult
        +calculateFinalIpp(f02Scale5: number, f03Scale5: number) number
        +resolvePredicate(percentage: number) GradePredicate
    }

    class PeriodWindowService {
        +getActiveWindows(year: number) PeriodWindow[]
        +checkPermission(year: number, action: PermissionAction) boolean
        +toggleManualOverride(windowId: string, state: boolean) void
    }

    class EvidenceMasterService {
        +inheritFromMaster(evaluationId: string, unitId: string) int
        +syncSubmissionToMaster(submissionId: string) UnitEvidenceMaster
        +appendVersionTree(masterId: string, fileMeta: AttachmentMeta) void
    }

    class AiEvaluatorService {
        +runPreEvaluation(evaluationId: string, aspectCode: string) AiAspectEvaluationResult
        -analyzeWithGeminiMultimodal(files: Buffer[], f01Claims: Json) AiAspectEvaluationResult
        -analyzeWithHeuristicFallback(submissions: Submission[], indicators: Indicator[]) AiAspectEvaluationResult
    }

    class SyncValidatorService {
        +validateForMenpanSync(evaluationId: string) ValidationReport
        +checkF01Completeness(evaluationId: string) boolean
        +checkF02Completeness(evaluationId: string) boolean
        +checkF03Quota(evaluationId: string) boolean
    }

    class MenpanApiService {
        +testConnection() ConnectionResult
        +fetchRemoteEvaluations(year: number) MenpanEvaluationItem[]
        +pushEvaluationScores(evaluationId: string) MenpanSyncResponse
    }

    AiEvaluatorService --> EvidenceMasterService : "membaca berkas bukti"
    MenpanApiService --> SyncValidatorService : "memvalidasi sebelum kirim"
    MenpanApiService --> PekpppCalculator : "mengambil nilai terhitung"
```

---

#### 5.2. Sequence Diagram: Alur Kerja *AI Pre-Evaluator* (Analisis Bukti & Deteksi Anomali F-01)
Menjelaskan bagaimana sistem membantu Tim Evaluator memeriksa klaim F-01 terhadap berkas PDF/foto yang diunggah OPD.

```mermaid
sequenceDiagram
    autonumber
    actor Evaluator as Tim Evaluator Daerah
    participant UI as Antarmuka Evaluasi F-02
    participant Action as ai-evaluator-actions.ts
    participant Service as AiEvaluatorService
    participant Storage as Cloudflare R2 / Storage
    participant Gemini as Multimodal Gemini AI
    participant DB as PostgreSQL (Prisma)

    Evaluator->>UI: Klik "Jalankan Pre-Evaluasi AI" pada Aspek (misal: Aspek I)
    UI->>Action: triggerAiPreEvaluation(evaluationId, aspectCode)
    Action->>Service: runPreEvaluation(evaluationId, aspectCode)
    Service->>DB: Set status bukti dukung -> PROCESSING
    Service->>DB: Ambil klaim F-01 OPD (EvaluationScore) & Berkas (IndicatorEvidenceSubmission)
    Service->>Storage: Unduh buffer PDF (SK SP, BA FKP, Maklumat) & Foto Sarpras
    
    alt API Key Multimodal AI Tersedia & Aktif
        Service->>Gemini: Kirim Prompt Standar PermenPANRB + Klaim F-01 + Dokumen PDF/Foto
        Gemini-->>Service: Kembalikan JSON (SuggestedScore, Confidence, CriticalAudit, VerificationTips)
    else Fallback / Mode Offline
        Service->>Service: Jalankan Heuristic Rule Engine (Cek kelengkapan slot & metadata 14 komponen)
    end

    Service->>DB: Simpan rekomendasi ke EvaluationScore & ringkasan ke Evaluation.aiEvaluatorNotes
    Service->>DB: Set status bukti dukung -> COMPLETED
    Service-->>UI: Tampilkan Kartu Analisis AI (Skor Awal, Peringatan Anomali, & Tips Observasi)
    Evaluator->>UI: Tinjau rekomendasi AI, lakukan verifikasi lapangan, & tetapkan skor final F-02
```

---

#### 5.3. Sequence Diagram: Pewarisan & Pembaruan *Living Document* Lintas Tahun
Menjelaskan mekanisme efisiensi pemberkasan sehingga OPD tidak perlu mengunggah ulang dokumen dari nol setiap tahun.

```mermaid
sequenceDiagram
    autonumber
    actor OPD as Admin Lokus (OPD)
    participant UI as Panel Bukti Dukung F-01
    participant MasterSvc as EvidenceMasterService
    participant Optimizer as PDF & Image Optimizer
    participant R2 as Object Storage (R2/Local)
    participant DB as PostgreSQL Database

    Note over OPD,DB: Skenario A: Awal Tahun Evaluasi Baru (Pewarisan Otomatis)
    OPD->>UI: Buka Halaman Bukti Dukung Tahun Berjalan (misal: 2026)
    UI->>MasterSvc: checkAndInheritMasterEvidence(evaluationId, unitId)
    MasterSvc->>DB: Ambil berkas aktif terakhir dari UnitEvidenceMaster (misal: 2025)
    MasterSvc->>DB: Salin referensi ke IndicatorEvidenceSubmission (isInherited = true)
    MasterSvc-->>UI: Tampilkan seluruh berkas tahun lalu siap pakai (Tanpa Upload Ulang)

    Note over OPD,DB: Skenario B: Pembaruan Versi Dokumen (Misal Revisi SK Standar Pelayanan)
    OPD->>UI: Unggah Berkas Baru pada Slot "sk_sp"
    UI->>Optimizer: Kompresi PDF / Citra Otomatis
    Optimizer->>R2: Simpan berkas teroptimasi & dapatkan URL baru
    UI->>MasterSvc: updateEvidenceSlot(evaluationId, slotKey, newFileMeta)
    MasterSvc->>DB: Simpan berkas sebelumnya ke array versions[] (v1 -> v2)
    MasterSvc->>DB: Catat log aktivitas ke array history[] (Actor, Timestamp, Action)
    MasterSvc->>DB: Perbarui UnitEvidenceMaster untuk digunakan tahun berikutnya
    MasterSvc-->>UI: Tampilkan badge "Versi Terbaru (v2)" beserta Pohon Riwayat Versi
```

---

#### 5.4. Sequence Diagram: Validasi & Sinkronisasi ke Portal Nasional (`evaluasi.menpan.go.id`)
Menjelaskan tahapan pengamanan kualitas data sebelum dikirimkan ke server Kementerian PANRB.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Super Admin (Bagian Organisasi)
    participant UI as Panel Sinkronisasi MenPAN-RB
    participant Val as SyncValidatorService
    participant Api as MenpanApiService
    participant DB as PostgreSQL Database
    participant Menpan as API evaluasi.menpan.go.id

    Admin->>UI: Pilih Lokus Prioritas & Klik "Sinkronkan ke MenPAN-RB"
    UI->>Val: validateEvaluationBeforeSync(evaluationId)
    Val->>DB: Periksa kelengkapan 31 Indikator F-01, Skor F-02, Bukti Dukung, & Kuota F-03
    
    alt Data Belum Lengkap
        Val-->>UI: Tolak Sinkronisasi & Tampilkan Daftar Indikator yang Belum Lengkap
    else Data Lengkap 100% (Valid)
        Val->>DB: Update syncStatus = VALIDATING
        UI->>Api: syncEvaluationToMenpan(evaluationId)
        Api->>Menpan: GET /user (Verifikasi Bearer Token & Government Instance ID)
        Menpan-->>Api: HTTP 200 OK (Token Valid)
        Api->>Menpan: POST / PUT Payload Evaluasi (F-01, F-02, F-03 & Tautan Bukti)
        
        alt Sinkronisasi Berhasil
            Menpan-->>Api: HTTP 200 OK (menpanRefId)
            Api->>DB: Update syncStatus = SYNCED, syncedAt = now(), simpan syncLogs
            Api-->>UI: Tampilkan Status "Tersinkronisasi Resmi dengan KemenPAN-RB"
        else Gangguan Jaringan / Rate Limit (HTTP 429/401)
            Menpan-->>Api: Error Response
            Api->>DB: Update syncStatus = FAILED, catat detail error di syncLogs
            Api-->>UI: Tampilkan Pesan Diagnostik & Tombol Coba Ulang (Retry)
        end
    end
```

---

### 6. SPESIFIKASI KEAMANAN INFORMASI & REKAM JEJAK AUDIT
Untuk memenuhi standar keamanan informasi SPBE (Indeks KAMI / BSSN):
1. **Otorisasi Berlapis (*Defense-in-Depth*):**
   - Setiap rute halaman dan *Server Action* dilindungi oleh `auth-guard.ts` dan `middleware.ts` menggunakan tanda tangan kriptografi JWT (`jose`).
   - Isolasi data ketat antar-unit (`UserUnit`): Akun OPD hanya dapat membaca dan mengubah evaluasi milik unit kerjanya sendiri.
2. **Penguncian Jendela Waktu (*Temporal Access Control*):**
   - Sekalipun pengguna memiliki akun OPD yang sah, sistem menolak perubahan data pada tingkat server apabila fase `PeriodWindow` sedang tertutup (`canFillF01 = false` atau `canUploadEvidence = false`).
3. **Integritas & Auditabilitas Bukti Dukung:**
   - Setiap tindakan pengunggahan, penggantian versi, maupun penghapusan lampiran terekam secara permanen di dalam kolom JSON `history` (`timestamp`, `actorName`, `action`, `fileName`, `fileUrl`).
4. **Kerahasiaan Catatan Internal Evaluator & AI:**
   - Hasil analisis kritis AI (`aiCriticalAudit`, `aiWeaknessNotes`, `aiEvaluatorNotes`) dan pesan internal tiket (`isInternal = true`) diisolasi di sisi server sehingga hanya dapat dilihat oleh Tim Evaluator Daerah (`SUPER_ADMIN`) dan tidak terekspos ke antarmuka OPD maupun publik.
