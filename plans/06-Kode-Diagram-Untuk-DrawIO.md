# KUMPULAN KODE SUMBER DIAGRAM (UNTUK TRANSFORMASI KE DRAW.IO / DIAGRAM EDITOR)
## SISTEM INFORMASI PEKPPP MANDIRI KABUPATEN KUTAI BARAT

Dokumen ini berisi kode sumber (**Mermaid**, **PlantUML**, dan **SQL DDL**) yang siap Anda *copy-paste* langsung ke **Draw.io (diagrams.net)** agar otomatis berubah menjadi diagram kotak/panah yang bisa diedit warna, ukuran, dan tata letaknya.

### Cara Import ke Draw.io (diagrams.net):
1. Buka [app.diagrams.net](https://app.diagrams.net/) (Draw.io).
2. Klik menu **Arrange** (Atur) $\rightarrow$ **Insert** (Sisipkan) $\rightarrow$ **Advanced** (Lanjutan) $\rightarrow$ pilih **Mermaid...**, **PlantUML...**, atau **SQL...** sesuai jenis blok kode di bawah ini.
3. *Copy-paste* kode di dalam blok di bawah ini, lalu klik **Insert**.

---

## 1. UML USE CASE DIAGRAM (FORMAT PLANTUML UNTUK DRAW.IO)
> **Cara Pakai di Draw.io:** Menu `Arrange` $\rightarrow$ `Insert` $\rightarrow$ `Advanced` $\rightarrow$ `PlantUML...`  
> *(Atau gunakan blok Mermaid Flowchart di bagian 1B jika ingin bentuk kotak yang bisa digeser satu per satu di Draw.io).*

### 1A. Kode PlantUML (Standar Gambar Aktor & Oval Use Case)
```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle
skinparam shadowing false

actor "Bagian Organisasi\n(Super Admin)" as Admin
actor "Tim Evaluator Daerah" as Eval
actor "Admin Lokus / UPPP\n(OPD, Kecamatan, Puskesmas)" as OPD
actor "Masyarakat /\nPengguna Layanan" as Publik
actor "Portal KemenPAN-RB\n(evaluasi.menpan.go.id)" as Menpan

rectangle "Sistem Informasi PEKPPP Mandiri Kabupaten Kutai Barat" {
  package "1. Perencanaan & Pembinaan" {
    usecase "UC-01: Kelola Periode & 6 Fase Jadwal (PeriodWindow)" as UC01
    usecase "UC-02: Kelola Master Unit & Tagging Lokus Prioritas" as UC02
    usecase "UC-03: Kurasi Contoh Berkas & Slot Bukti Dukung" as UC03
  }

  package "2. Pengisian Mandiri & Survei Masyarakat" {
    usecase "UC-04: Isi Formulir Mandiri F-01 (31 Indikator)" as UC04
    usecase "UC-05: Unggah & Perbarui Living Document (Pohon Versi)" as UC05
    usecase "UC-06: Sebarkan QR Code & Pantau Kuota Survei F-03" as UC06
    usecase "UC-07: Isi Kuesioner Persepsi Masyarakat (F-03)" as UC07
  }

  package "3. Asistensi AI & Evaluasi F-02" {
    usecase "UC-08: Jalankan AI Pre-Evaluator (Audit 14 Komponen SP)" as UC08
    usecase "UC-09: Verifikasi Bukti & Input Nilai F-02" as UC09
    usecase "UC-10: Diskusi & Sanggah per Indikator (2-Arah)" as UC10
  }

  package "4. Penetapan IPP, Integrasi Nasional & Helpdesk" {
    usecase "UC-11: Kalkulasi Otomatis IPP (75% F-02 + 25% F-03)" as UC11
    usecase "UC-12: Cetak Berita Acara Resmi (PDF)" as UC12
    usecase "UC-13: Validasi & Sinkronisasi API ke KemenPAN-RB" as UC13
    usecase "UC-14: Kirim & Tindak Lanjuti Tiket Pengaduan Layanan" as UC14
  }
}

Admin --> UC01
Admin --> UC02
Admin --> UC03
Admin --> UC11
Admin --> UC12
Admin --> UC13

OPD --> UC03 : "Unduh Acuan"
OPD --> UC04
OPD --> UC05
OPD --> UC06
OPD --> UC10
OPD --> UC14 : "Tindak Lanjut Disposisi"

Publik --> UC07
Publik --> UC14 : "Buat Laporan"

Eval --> UC08
Eval --> UC09
Eval --> UC10
Eval --> UC12

UC13 --> Menpan : "OpenAPI 3.0.3 Sync"
@enduml
```

### 1B. Kode Mermaid Use Case (Native Editable Shapes di Draw.io)
> **Cara Pakai di Draw.io:** Menu `Arrange` $\rightarrow$ `Insert` $\rightarrow$ `Advanced` $\rightarrow$ `Mermaid...`

```mermaid
flowchart LR
    Admin(["👤 Bagian Organisasi\n(Super Admin)"])
    Eval(["🕵️ Tim Evaluator Daerah"])
    OPD(["🏢 Admin Lokus / OPD"])
    Publik(["👥 Masyarakat"])
    Menpan(["🌐 Portal KemenPAN-RB\nevaluasi.menpan.go.id"])

    subgraph Sistem_PEKPPP ["Sistem Informasi PEKPPP Mandiri"]
        direction TB
        UC01(["UC-01: Atur Periode & 6 Fase Jadwal"])
        UC02(["UC-02: Penetapan Lokus & Lokus Prioritas"])
        UC03(["UC-03: Kurasi Contoh Berkas Standar"])
        UC04(["UC-04: Pengisian Mandiri F-01 (31 Indikator)"])
        UC05(["UC-05: Kelola Living Document & Versi Bukti"])
        UC06(["UC-06: Survei Masyarakat F-03 via QR Publik"])
        UC07(["UC-07: Analisis AI Pre-Evaluator"])
        UC08(["UC-08: Penilaian Evaluator F-02 & Diskusi Indikator"])
        UC09(["UC-09: Kalkulasi IPP (75:25) & Cetak Berita Acara"])
        UC10(["UC-10: Validasi & Sinkronisasi API MenPAN-RB"])
        UC11(["UC-11: Pengelolaan Tiket Pengaduan Publik"])
    end

    Admin --> UC01 & UC02 & UC03 & UC09 & UC10
    OPD --> UC03 & UC04 & UC05 & UC06 & UC08 & UC11
    Publik --> UC06 & UC11
    Eval --> UC07 & UC08 & UC09
    UC10 --> Menpan
```

---

## 2. UML ACTIVITY DIAGRAM / CROSS-FUNCTIONAL SWIMLANE (MERMAID UNTUK DRAW.IO)
> **Cara Pakai di Draw.io:** Menu `Arrange` $\rightarrow$ `Insert` $\rightarrow$ `Advanced` $\rightarrow$ `Mermaid...`  
> Diagram ini memetakan alur kerja lintas aktor (*Swimlane*) dari perencanaan hingga pelaporan ke KemenPAN-RB.

```mermaid
flowchart TD
    subgraph Lane_Admin ["Bagian Organisasi (Super Admin)"]
        A1(["Mulai Periode Evaluasi"]) --> A2["Tetapkan 6 Fase Waktu (PeriodWindow)\n& Unggah Contoh Berkas Acuan"]
        A2 --> A3["Tetapkan Daftar Lokus & Lokus Prioritas"]
        A8["Kalkulasi Skor Akhir IPP\n(75% F-02 + 25% F-03)"] --> A9["Cetak Berita Acara PDF\n& Publikasi Rapor IPP"]
        A9 --> A10["Jalankan SyncValidatorService\n& Kirim API ke evaluasi.menpan.go.id"]
        A10 --> A11(["Selesai Siklus Evaluasi"])
    end

    subgraph Lane_OPD ["Unit Lokus / UPPP (OPD, Kecamatan, Puskesmas)"]
        B1["Tarik Bukti Tahun Lalu dari\nUnitEvidenceMaster (Living Document)"]
        B2["Perbarui Dokumen yang Berubah (v2, v3)\n& Isi Klaim F-01 (31 Indikator)"]
        B3["Sebarkan QR Code Kuesioner F-03\ndi Ruang Layanan"]
        B4["Unggah Perbaikan Bukti Dukung\n& Balas Komentar Indikator"]
    end

    subgraph Lane_Publik ["Masyarakat / Pengguna Layanan"]
        P1["Pindai QR Code & Isi Survei F-03\nHingga Kuota Terpenuhi"]
    end

    subgraph Lane_Eval ["Tim Evaluator Daerah + AI Pre-Evaluator"]
        E1["Jalankan AI Pre-Evaluator per Aspek\n(Deteksi 14 Komponen SP & Audit Klaim F-01)"]
        E2["Verifikasi Bukti, Observasi Lapangan\n& Input Nilai F-02"]
        E3{"Ada Sanggahan /\nPerlu Revisi Bukti?"}
        E4["Verifikasi Ulang Revisi OPD\n& Kunci Nilai Final F-02"]
    end

    A3 --> B1
    B1 --> B2
    B2 --> B3
    B3 --> P1
    B2 & P1 --> E1
    E1 --> E2
    E2 --> E3
    E3 -- "Ya (Fase Revision/Appeal)" --> B4
    B4 --> E4
    E3 -- "Tidak (Lengkap)" --> E4
    E4 --> A8
```

---

## 3. ENTITY RELATIONSHIP DIAGRAM (ERD) — SQL DDL UNTUK DRAW.IO
> **Cara Pakai Paling Rapi di Draw.io:**  
> Di Draw.io, klik menu **Arrange** $\rightarrow$ **Insert** $\rightarrow$ **Advanced** $\rightarrow$ **SQL...**, lalu *paste* skrip SQL di bawah ini. Draw.io akan langsung membuat **Tabel ERD Profesional lengkap dengan kotak kolom PK/FK** yang siap dihubungkan!

```sql
CREATE TABLE EvaluationPeriod (
  id VARCHAR(36) PRIMARY KEY,
  year INT UNIQUE NOT NULL,
  title VARCHAR(100),
  targetF03Quota INT DEFAULT 30,
  f03CalculationMethod VARCHAR(20) DEFAULT 'PROPORTIONAL',
  isOpen BOOLEAN DEFAULT TRUE,
  isPublished BOOLEAN DEFAULT FALSE,
  publishedAt TIMESTAMP
);

CREATE TABLE PeriodWindow (
  id VARCHAR(36) PRIMARY KEY,
  periodId VARCHAR(36) REFERENCES EvaluationPeriod(id),
  phaseKey VARCHAR(50) NOT NULL,
  title VARCHAR(150) NOT NULL,
  startDate TIMESTAMP,
  endDate TIMESTAMP,
  canFillF01 BOOLEAN DEFAULT FALSE,
  canUploadEvidence BOOLEAN DEFAULT FALSE,
  canFillF03 BOOLEAN DEFAULT FALSE,
  canEvaluateF02 BOOLEAN DEFAULT FALSE,
  isActiveOverride BOOLEAN
);

CREATE TABLE Category (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE Unit (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(50),
  name VARCHAR(200) UNIQUE NOT NULL,
  categoryId VARCHAR(36) REFERENCES Category(id),
  isActive BOOLEAN DEFAULT TRUE
);

CREATE TABLE Profile (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL,
  fullName VARCHAR(150) NOT NULL,
  phone VARCHAR(30),
  role VARCHAR(20) DEFAULT 'OPD'
);

CREATE TABLE UserUnit (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) REFERENCES Profile(id),
  unitId VARCHAR(36) REFERENCES Unit(id)
);

CREATE TABLE Aspect (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  aspectWeight FLOAT NOT NULL,
  orderIndex INT NOT NULL
);

CREATE TABLE Indicator (
  id VARCHAR(36) PRIMARY KEY,
  aspectId VARCHAR(36) REFERENCES Aspect(id),
  code VARCHAR(30) NOT NULL,
  indicatorNumber INT UNIQUE NOT NULL,
  question TEXT NOT NULL,
  indicatorWeight FLOAT NOT NULL,
  maxScore FLOAT DEFAULT 5.0,
  isSupplementary BOOLEAN DEFAULT FALSE
);

CREATE TABLE Evaluation (
  id VARCHAR(36) PRIMARY KEY,
  year INT NOT NULL,
  unitId VARCHAR(36) REFERENCES Unit(id),
  totalScore FLOAT DEFAULT 0,
  percentage FLOAT DEFAULT 0,
  scale5 FLOAT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'DRAFT',
  isFinished BOOLEAN DEFAULT FALSE,
  isPriority BOOLEAN DEFAULT FALSE,
  f03Count INT DEFAULT 0,
  f03Scale5 FLOAT DEFAULT 0,
  finalIppScore FLOAT DEFAULT 0,
  aiEvaluatorNotes JSON,
  syncStatus VARCHAR(20) DEFAULT 'IDLE',
  menpanEvaluationId VARCHAR(100),
  syncedAt TIMESTAMP
);

CREATE TABLE EvaluationScore (
  id VARCHAR(36) PRIMARY KEY,
  evaluationId VARCHAR(36) REFERENCES Evaluation(id),
  indicatorId VARCHAR(36) REFERENCES Indicator(id),
  f01Data JSON,
  f01Submitted BOOLEAN DEFAULT FALSE,
  score FLOAT,
  notes TEXT,
  aiSuggestedScore FLOAT,
  aiConfidence FLOAT,
  aiCriticalAudit TEXT,
  aiWeaknessNotes TEXT,
  aiVerificationTips TEXT
);

CREATE TABLE IndicatorComment (
  id VARCHAR(36) PRIMARY KEY,
  evaluationScoreId VARCHAR(36) REFERENCES EvaluationScore(id),
  authorId VARCHAR(36) REFERENCES Profile(id),
  message TEXT NOT NULL,
  isResolved BOOLEAN DEFAULT FALSE,
  parentId VARCHAR(36)
);

CREATE TABLE F03Respondent (
  id VARCHAR(36) PRIMARY KEY,
  evaluationId VARCHAR(36) REFERENCES Evaluation(id),
  respondentNo INT NOT NULL,
  name VARCHAR(100),
  answers JSON NOT NULL,
  totalScore FLOAT DEFAULT 0,
  scale5 FLOAT DEFAULT 0,
  submittedVia VARCHAR(30) DEFAULT 'PUBLIC'
);

CREATE TABLE EvidenceSlotConfig (
  id VARCHAR(36) PRIMARY KEY,
  aspectCode VARCHAR(10) NOT NULL,
  slotKey VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  isMandatory BOOLEAN DEFAULT TRUE,
  orderIndex INT DEFAULT 0
);

CREATE TABLE IndicatorEvidenceSubmission (
  id VARCHAR(36) PRIMARY KEY,
  evaluationId VARCHAR(36) REFERENCES Evaluation(id),
  aspectCode VARCHAR(10) NOT NULL,
  slotKey VARCHAR(50) NOT NULL,
  slotConfigId VARCHAR(36) REFERENCES EvidenceSlotConfig(id),
  title VARCHAR(200) NOT NULL,
  fileUrl TEXT NOT NULL,
  storageProvider VARCHAR(30) DEFAULT 'R2',
  isInherited BOOLEAN DEFAULT FALSE,
  attachments JSON,
  history JSON,
  aiStatus VARCHAR(20) DEFAULT 'IDLE',
  aiInsights JSON
);

CREATE TABLE UnitEvidenceMaster (
  id VARCHAR(36) PRIMARY KEY,
  unitId VARCHAR(36) REFERENCES Unit(id),
  aspectCode VARCHAR(10) NOT NULL,
  slotKey VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  fileUrl TEXT NOT NULL,
  lastSourceYear INT,
  attachments JSON,
  history JSON
);

CREATE TABLE MediaAsset (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(50) DEFAULT 'UMUM',
  fileName VARCHAR(200) NOT NULL,
  fileUrl TEXT UNIQUE NOT NULL,
  fileType VARCHAR(30) NOT NULL,
  isPublic BOOLEAN DEFAULT TRUE
);

CREATE TABLE ContohBerkas (
  id VARCHAR(36) PRIMARY KEY,
  mediaAssetId VARCHAR(36) REFERENCES MediaAsset(id),
  title VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  isActive BOOLEAN DEFAULT TRUE
);

CREATE TABLE Ticket (
  id VARCHAR(36) PRIMARY KEY,
  ticketCode VARCHAR(30) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  priority VARCHAR(20) DEFAULT 'MEDIUM',
  status VARCHAR(20) DEFAULT 'OPEN',
  isAnonymous BOOLEAN DEFAULT FALSE,
  authorId VARCHAR(36) REFERENCES Profile(id),
  targetUnitId VARCHAR(36) REFERENCES Unit(id),
  resolutionNotes TEXT
);

CREATE TABLE TicketMessage (
  id VARCHAR(36) PRIMARY KEY,
  ticketId VARCHAR(36) REFERENCES Ticket(id),
  senderId VARCHAR(36) REFERENCES Profile(id),
  senderRole VARCHAR(20),
  message TEXT NOT NULL,
  isInternal BOOLEAN DEFAULT FALSE
);
```

---

## 4. STATE MACHINE DIAGRAM — SIKLUS STATUS EVALUASI & SINKRONISASI (MERMAID UNTUK DRAW.IO)
> **Cara Pakai di Draw.io:** Menu `Arrange` $\rightarrow$ `Insert` $\rightarrow$ `Advanced` $\rightarrow$ `Mermaid...`

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Periode Dibuka (Inisiasi Lokus)
    
    state "Proses Pengisian & Evaluasi Daerah" as Daerah {
        DRAFT --> SUBMITTED : OPD Submit F-01 & Bukti Living Document
        SUBMITTED --> DRAFT : Masa Sanggah / Revisi Dibuka (REVISION_APPEAL)
        SUBMITTED --> FINAL : Evaluator Kunci Skor F-02 & Kuota F-03 Terpenuhi
    }

    state "Proses Integrasi Nasional (evaluasi.menpan.go.id)" as Nasional {
        IDLE --> VALIDATING : Klik Sinkronkan (SyncValidatorService)
        VALIDATING --> IDLE : Validasi Gagal (Indikator Belum Lengkap)
        VALIDATING --> SYNCED : OpenAPI Push Sukses (HTTP 200 OK)
        VALIDATING --> FAILED : Gangguan Koneksi / Token Expired (HTTP 401/429)
        FAILED --> VALIDATING : Retry Sinkronisasi
    }

    FINAL --> IDLE : Siap Sinkronisasi (Khusus Lokus Prioritas)
    SYNCED --> [*] : Berita Acara & Rapor IPP Dipublikasikan
```
