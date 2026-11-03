'use client'

import {
  Sparkles,
  Building2,
  FileCheck2,
  Bot,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Database,
  Cpu,
  Layers,
  Globe2,
  Share2,
  Info,
  HelpCircle
} from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'

export default function AlurProsesPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16">
      {/* Header Judul di Tengah Tanpa Keterangan */}
      <div className="text-center pt-2 pb-1">
        <div className="inline-flex items-center justify-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-light border border-brand/20 flex items-center justify-center shrink-0">
            <HelpCircle className="w-4 h-4 text-brand" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-normal text-ink">
            Apa itu PEKPPP.ext?
          </h1>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BAGIAN 1: LATAR BELAKANG & KEDUDUKAN STRATEGIS PEKPPP.EXT                  */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Card Penuh: Pengantar Inisiatif Mandiri */}
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-7 shadow-2xs space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-light border border-brand/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-brand" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Tentang PEKPPP.ext</span>
          </div>
          <p className="text-base sm:text-lg text-ink font-medium leading-relaxed">
            Inisiatif mandiri Bagian Organisasi sebagai layer ekstensi cerdas berbasis AI Agent untuk mempercepat dan menstandarisasi pra-evaluasi pelayanan publik PEKPPP.
          </p>
        </div>

        {/* Grid 2 Card yang Ada - Minimalist & Balanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Inisiatif Mandiri Bagian Organisasi */}
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-2xs space-y-3 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-brand-light border border-brand/20 flex items-center justify-center shrink-0">
                  <Cpu className="w-3.5 h-3.5 text-brand" />
                </div>
                <Badge variant="warning" size="sm">Inisiatif Mandiri Internal</Badge>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-ink leading-snug">
                Antisipasi Volume Lokus Besar &amp; Efisiensi Waktu
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed font-normal">
                Lahir dari <strong>Tim Pelayanan Publik &amp; Tata Laksana Bagian Organisasi</strong> guna mengantisipasi beban pemeriksaan dokumen ratusan lokus. AI bertindak sebagai pre-evaluator objektif memangkas jam audit manual tanpa menurunkan mutu.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-surface-subtle border border-line text-ink">
                <Zap className="w-3 h-3 text-brand" /> AI Pre-Evaluator
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-surface-subtle border border-line text-ink">
                <Building2 className="w-3 h-3 text-brand" /> Puluhan – Ratusan Lokus
              </span>
            </div>
          </div>

          {/* Card 2: Bukan Tandingan evaluasi.menpan.go.id, Melainkan Ekstensi Khusus */}
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-2xs space-y-3 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                  <Layers className="w-3.5 h-3.5 text-sky-600" />
                </div>
                <Badge variant="info" size="sm">Kedudukan Sistem</Badge>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-ink leading-snug">
                Bukan Tandingan evaluasi.menpan.go.id
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed font-normal">
                Sistem ini murni merupakan <strong>layer ekstensi pendamping</strong> di tingkat daerah untuk membantu lokus memvalidasi eviden dan membekali evaluator dengan audit awal sebelum penguncian resmi di portal nasional.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-surface-subtle border border-line text-ink">
                <Globe2 className="w-3 h-3 text-sky-600" /> Selaras Portal KemenPAN-RB
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-surface-subtle border border-line text-ink">
                <Share2 className="w-3 h-3 text-emerald-600" /> Format Siap Ekspor
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* UNIFIED ACTOR-BASED STEP-BY-STEP DIAGRAM CANVAS */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 lg:p-10 shadow-2xs space-y-8 relative overflow-hidden">
        
        {/* Top Header Label */}
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-lg sm:text-xl font-semibold text-ink">
            Bagaimana Proses Intinya Bekerja?
          </h2>
          <p className="text-xs sm:text-sm text-ink-secondary">
            Alur kolaborasi terintegrasi: persiapan eviden lokus, audit kelayakan AI, hingga validasi dan penetapan evaluator.
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* DESKTOP CONNECTED SYSTEM (UNIFIED MULTI-STEP SVG CANVAS)      */}
        {/* ------------------------------------------------------------- */}
        <div className="hidden lg:block w-full bg-surface-subtle/35 rounded-2xl border border-line/80 p-6 overflow-x-auto">
          
          <svg className="w-full h-auto min-w-[1020px]" viewBox="0 0 1060 590" fill="none">
            <defs>
              <marker id="arrBrand" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <polygon points="0 0, 7 3.5, 0 7" fill="#1D5BB9" />
              </marker>
              <marker id="arrMuted" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <polygon points="0 0, 7 3.5, 0 7" fill="#94A3B8" />
              </marker>
            </defs>

            {/* SWIMLANES (Clean Minimalist Zones) */}
            {/* Zone 1: Lokus */}
            <rect x="25" y="28" width="310" height="172" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
            <text x="42" y="49" fill="#1D5BB9" fontSize="10.5" fontWeight="600" letterSpacing="0.04em" fontFamily="var(--font-google-sans), sans-serif">
              FASE 1: PERSIAPAN &amp; INPUT LOKUS
            </text>

            {/* Zone 2: AI Pre-Evaluator */}
            <rect x="370" y="28" width="265" height="172" rx="14" fill="#FFFFFF" stroke="#BFDBFE" strokeWidth="1" />
            <text x="387" y="49" fill="#1D5BB9" fontSize="10.5" fontWeight="600" letterSpacing="0.04em" fontFamily="var(--font-google-sans), sans-serif">
              FASE 2: ENGINE AI PRE-EVALUATOR
            </text>

            {/* Zone 3: Tim Evaluator */}
            <rect x="760" y="28" width="270" height="547" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
            <text x="777" y="49" fill="#1D5BB9" fontSize="10.5" fontWeight="600" letterSpacing="0.04em" fontFamily="var(--font-google-sans), sans-serif">
              FASE 3: TIM EVALUATOR (VERIFIKASI &amp; SKOR)
            </text>

            {/* MAIN FLOW ARROWS (Clean 1.5px lines with crisp arrowheads) */}
            {/* Step 1 -> Step 2 */}
            <line x1="165" y1="125" x2="190" y2="125" stroke="#1D5BB9" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrBrand)" />

            {/* Step 2 -> Step 3 */}
            <line x1="320" y1="125" x2="380" y2="125" stroke="#1D5BB9" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrBrand)" />

            {/* Step 3 -> Gateway 1 */}
            <line x1="620" y1="122" x2="678" y2="122" stroke="#1D5BB9" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrBrand)" />

            {/* BPMN GATEWAY 1 - Minimalist Diamond */}
            <g transform="translate(705, 122)">
              <polygon points="0,-22 22,0 0,22 -22,0" fill="#FFFFFF" stroke="#1D5BB9" strokeWidth="1.5" />
              <text x="0" y="4.5" fill="#1D5BB9" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">?</text>
            </g>

            {/* Gateway 1 -> Step 4 */}
            <line x1="728" y1="122" x2="770" y2="122" stroke="#1D5BB9" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrBrand)" />

            {/* Badge Lengkap (Minimalist Emerald Pill) */}
            <g transform="translate(750, 104)">
              <rect x="-24" y="-9" width="48" height="18" rx="9" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1" />
              <text x="0" y="3.5" fill="#047857" fontSize="9" fontWeight="600" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">Lengkap</text>
            </g>

            {/* FEEDBACK LOOP 1 (Gateway 1 -> kembali ke Lokus) */}
            <path d="M 705 145 L 705 278 L 102 278 L 102 190" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="4 4" fill="none" markerEnd="url(#arrMuted)" />

            {/* Feedback label 1 (Clean Minimalist Pill) */}
            <g transform="translate(360, 278)">
              <rect x="-105" y="-11" width="210" height="22" rx="11" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              <text x="0" y="4" fill="#64748B" fontSize="9.5" fontWeight="500" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">
                Bukti Kurang Sesuai &rarr; Perbaiki Bukti
              </text>
            </g>

            {/* EVALUATOR CONNECTORS */}
            {/* Step 4 -> Step 5 */}
            <line x1="895" y1="140" x2="895" y2="165" stroke="#1D5BB9" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrBrand)" />

            {/* Step 5 -> Step 6 */}
            <line x1="895" y1="255" x2="895" y2="280" stroke="#1D5BB9" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrBrand)" />

            {/* Step 6 -> Gateway 2 */}
            <line x1="895" y1="370" x2="895" y2="393" stroke="#1D5BB9" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrBrand)" />

            {/* BPMN GATEWAY 2 - Minimalist Diamond */}
            <g transform="translate(895, 416)">
              <polygon points="0,-22 22,0 0,22 -22,0" fill="#FFFFFF" stroke="#1D5BB9" strokeWidth="1.5" />
              <text x="0" y="4.5" fill="#1D5BB9" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">?</text>
            </g>

            {/* Gateway 2 -> Step 7 */}
            <line x1="895" y1="438" x2="895" y2="470" stroke="#1D5BB9" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrBrand)" />

            {/* Badge Sesuai (Minimalist Emerald Pill) */}
            <g transform="translate(936, 456)">
              <rect x="-24" y="-9" width="48" height="18" rx="9" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1" />
              <text x="0" y="3.5" fill="#047857" fontSize="9" fontWeight="600" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">Sesuai</text>
            </g>

            {/* FEEDBACK LOOP 2 (Gateway 2 -> kembali ke Lokus) */}
            <path d="M 873 416 L 102 416 L 102 284" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="4 4" fill="none" markerEnd="url(#arrMuted)" />

            {/* Feedback label 2 (Clean Minimalist Pill) */}
            <g transform="translate(480, 416)">
              <rect x="-92" y="-11" width="184" height="22" rx="11" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              <text x="0" y="4" fill="#64748B" fontSize="9.5" fontWeight="500" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">
                Rekomendasi &rarr; Perbaiki Bukti
              </text>
            </g>

            {/* STEP CARDS 1-6 (Crisp Minimalist Cards) */}

            {/* STEP 1: Upload Bukti */}
            <g transform="translate(40, 65)">
              <rect width="125" height="120" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              <rect x="44" y="14" width="36" height="36" rx="8" fill="#EEF4FD" />
              <g transform="translate(54, 24) scale(0.68)" stroke="#1D5BB9" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 21 15 v 4 a 2 2 0 0 1 -2 2 H 5 a 2 2 0 0 1 -2 -2 v -4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </g>
              <text x="62" y="68" fill="#0F172A" fontSize="10.5" fontWeight="600" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">1. Upload Bukti</text>
              <line x1="16" y1="76" x2="109" y2="76" stroke="#F1F5F9" strokeWidth="1" />
              <text x="62" y="93" fill="#1D5BB9" fontSize="9" fontWeight="500" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">Upload Bukti</text>
              <text x="62" y="106" fill="#1D5BB9" fontSize="9" fontWeight="500" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">Lengkap</text>
            </g>

            {/* STEP 2: Uji Kelayakan */}
            <g transform="translate(195, 65)">
              <rect width="125" height="120" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              <rect x="44" y="14" width="36" height="36" rx="8" fill="#EEF4FD" />
              <g transform="translate(54, 24) scale(0.68)" stroke="#1D5BB9" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" fill="#1D5BB9" />
              </g>
              <text x="62" y="68" fill="#0F172A" fontSize="10.5" fontWeight="600" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">2. Uji Kelayakan</text>
              <line x1="16" y1="76" x2="109" y2="76" stroke="#F1F5F9" strokeWidth="1" />
              <text x="62" y="93" fill="#1D5BB9" fontSize="9" fontWeight="500" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">Klik Tombol</text>
              <text x="62" y="106" fill="#1D5BB9" fontSize="9" fontWeight="500" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">Cek Kelayakan</text>
            </g>

            {/* STEP 3: Pre-Evaluasi AI (Minimalist AI Card with subtle brand border) */}
            <g transform="translate(385, 60)">
              <rect width="235" height="125" rx="14" fill="#FFFFFF" stroke="#1D5BB9" strokeWidth="1.5" />
              <rect x="16" y="16" width="38" height="38" rx="10" fill="#EEF4FD" />
              <g transform="translate(26, 26) scale(0.72)" stroke="#1D5BB9" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 12 8 V 4 H 8" />
                <rect width="16" height="12" x="4" y="8" rx="2" />
                <path d="M 2 14 h 2 M 20 14 h 2 M 15 13 v 2 M 9 13 v 2" />
              </g>
              <text x="66" y="35" fill="#0F172A" fontSize="11.5" fontWeight="600" fontFamily="var(--font-google-sans), sans-serif">3. Pre-Evaluasi AI</text>
              <text x="66" y="49" fill="#1D5BB9" fontSize="9.5" fontWeight="500" fontFamily="var(--font-google-sans), sans-serif">Audit Otomatis 31 Indikator</text>
              <line x1="16" y1="67" x2="219" y2="67" stroke="#F1F5F9" strokeWidth="1" />
              <text x="16" y="86" fill="#475569" fontSize="9.5" fontWeight="400" fontFamily="var(--font-google-sans), sans-serif">&bull; Cek kelengkapan eviden</text>
              <text x="16" y="103" fill="#64748B" fontSize="9.5" fontWeight="400" fontFamily="var(--font-google-sans), sans-serif">&bull; Uji kesesuaian instrumen</text>
            </g>

            {/* STEP 4: Cek Bukti Baru Lokus */}
            <g transform="translate(775, 55)">
              <rect width="240" height="85" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              <rect x="14" y="14" width="34" height="34" rx="8" fill="#EEF4FD" />
              <g transform="translate(23, 23) scale(0.65)" stroke="#1D5BB9" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </g>
              <text x="58" y="31" fill="#0F172A" fontSize="10.5" fontWeight="600" fontFamily="var(--font-google-sans), sans-serif">4. Cek Bukti Baru Lokus</text>
              <text x="58" y="45" fill="#1D5BB9" fontSize="9" fontWeight="500" fontFamily="var(--font-google-sans), sans-serif">Tim Evaluator Membuka Berkas</text>
              <line x1="14" y1="56" x2="226" y2="56" stroke="#F1F5F9" strokeWidth="1" />
              <text x="14" y="71" fill="#64748B" fontSize="9" fontFamily="var(--font-google-sans), sans-serif">Menerima data siap uji per aspek dari lokus</text>
            </g>

            {/* STEP 5: Analisis Nilai AI */}
            <g transform="translate(775, 170)">
              <rect width="240" height="85" rx="12" fill="#FFFFFF" stroke="#1D5BB9" strokeWidth="1.5" />
              <rect x="14" y="14" width="34" height="34" rx="8" fill="#EEF4FD" />
              <g transform="translate(23, 23) scale(0.65)" stroke="#1D5BB9" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 12 8 V 4 H 8" />
                <rect width="16" height="12" x="4" y="8" rx="2" />
                <path d="M 2 14 h 2 M 20 14 h 2 M 15 13 v 2 M 9 13 v 2" />
              </g>
              <text x="58" y="31" fill="#0F172A" fontSize="10.5" fontWeight="600" fontFamily="var(--font-google-sans), sans-serif">5. Analisis Nilai AI</text>
              <text x="58" y="45" fill="#1D5BB9" fontSize="9" fontWeight="500" fontFamily="var(--font-google-sans), sans-serif">Langkah Awal Pre-Evaluasi</text>
              <line x1="14" y1="56" x2="226" y2="56" stroke="#F1F5F9" strokeWidth="1" />
              <text x="14" y="71" fill="#64748B" fontSize="9" fontFamily="var(--font-google-sans), sans-serif">1-Klik perintah guna peroleh insight segera</text>
            </g>

            {/* STEP 6: Cek Mandiri */}
            <g transform="translate(775, 285)">
              <rect width="240" height="85" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              <rect x="14" y="14" width="34" height="34" rx="8" fill="#EEF4FD" />
              <g transform="translate(23, 23) scale(0.65)" stroke="#1D5BB9" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="m 9 12 2 2 4-4" />
              </g>
              <text x="58" y="31" fill="#0F172A" fontSize="10.5" fontWeight="600" fontFamily="var(--font-google-sans), sans-serif">6. Cek Mandiri</text>
              <text x="58" y="45" fill="#1D5BB9" fontSize="9" fontWeight="500" fontFamily="var(--font-google-sans), sans-serif">Verifikasi Faktual Tim Evaluator</text>
              <line x1="14" y1="56" x2="226" y2="56" stroke="#F1F5F9" strokeWidth="1" />
              <text x="14" y="71" fill="#64748B" fontSize="9" fontFamily="var(--font-google-sans), sans-serif">Menelaah kesesuaian data riil lapangan</text>
            </g>

            {/* STEP 7 - TUJUAN AKHIR: Clean Solid Brand Milestone Card */}
            <g transform="translate(775, 475)">
              <rect width="240" height="85" rx="14" fill="#1D5BB9" stroke="#154694" strokeWidth="1" />
              <rect x="14" y="14" width="36" height="36" rx="8" fill="rgba(255,255,255,0.18)" />
              <g transform="translate(24, 24) scale(0.65)" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 16 21 v-2 a 4 4 0 0 0-4-4 H 6 a 4 4 0 0 0-4 4 v 2" />
                <circle cx="9" cy="7" r="4" />
                <polyline points="16 11 18 13 22 9" stroke="#FFFFFF" />
              </g>
              <text x="60" y="31" fill="#FFFFFF" fontSize="11" fontWeight="600" fontFamily="var(--font-google-sans), sans-serif">7. Rekomendasi &amp; Penetapan</text>
              <text x="60" y="45" fill="#BAE6FD" fontSize="9.5" fontWeight="500" fontFamily="var(--font-google-sans), sans-serif">Validasi Provinsi &rarr; MenPAN-RB</text>
              <line x1="14" y1="56" x2="226" y2="56" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
              <text x="14" y="71" fill="#E0F2FE" fontSize="9" fontFamily="var(--font-google-sans), sans-serif">Penetapan indeks akhir resmi oleh MenPAN-RB</text>
            </g>

          </svg>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MOBILE & TABLET STEP-BY-STEP VERTICAL FLOW                    */}
        {/* ------------------------------------------------------------- */}
        <div className="block lg:hidden space-y-3.5 relative pl-6 border-l-2 border-dashed border-brand/50">
          
          {/* Step 1 Mobile */}
          <div className="space-y-1.5 relative bg-surface p-4 rounded-2xl border border-line shadow-2xs">
            <span className="absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full bg-brand ring-4 ring-brand/15" />
            <div className="font-semibold text-[11px] text-brand tracking-wider uppercase">TAHAP 1 (LOKUS)</div>
            <div className="font-semibold text-sm text-ink flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand" /> Upload Bukti Lengkap
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Unit lokus mengunggah berkas bukti dukung secara lengkap per aspek (F-01 s/d F-06) ke Google Drive atau form sistem.
            </p>
          </div>

          {/* Step 2 Mobile */}
          <div className="space-y-1.5 relative bg-surface p-4 rounded-2xl border border-line shadow-2xs">
            <span className="absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full bg-brand ring-4 ring-brand/15" />
            <div className="font-semibold text-[11px] text-brand tracking-wider uppercase">TAHAP 2 (LOKUS)</div>
            <div className="font-semibold text-sm text-ink flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand" /> Klik Tombol Cek Kelayakan
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Setelah bukti dukung berstatus lengkap, tombol cek kelayakan aktif dan lokus mengeklik tombol untuk meminta audit otomatis AI.
            </p>
          </div>

          {/* Step 3 Mobile */}
          <div className="space-y-1.5 relative bg-surface p-4 rounded-2xl border border-brand/40 shadow-2xs">
            <span className="absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full bg-brand ring-4 ring-brand/20 animate-pulse" />
            <div className="font-semibold text-[11px] text-brand tracking-wider uppercase">TAHAP 3 (ENGINE AI)</div>
            <div className="font-semibold text-sm text-ink flex items-center gap-2">
              <Bot className="w-4 h-4 text-brand" /> Pre-Evaluasi AI &amp; Audit Otomatis
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              AI memeriksa 31 indikator. <strong>Jika berhasil</strong> lanjut ke evaluator. <strong>Jika bukti kurang sesuai</strong>, sistem mengembalikan alur ke Lokus untuk melengkapi eviden yang belum valid.
            </p>
          </div>

          {/* Step 4 Mobile */}
          <div className="space-y-1.5 relative bg-surface p-4 rounded-2xl border border-line shadow-2xs">
            <span className="absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full bg-ink-muted ring-4 ring-ink-muted/15" />
            <div className="font-semibold text-[11px] text-ink-muted tracking-wider uppercase">TAHAP 4 (EVALUATOR)</div>
            <div className="font-semibold text-sm text-ink flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-brand" /> Evaluator Melihat Bukti Baru Per Aspek
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Tim Evaluator membuka dashboard dan memantau bukti dukung baru per aspek yang telah lolos pra-uji.
            </p>
          </div>

          {/* Step 5 Mobile */}
          <div className="space-y-1.5 relative bg-surface p-4 rounded-2xl border border-brand/40 shadow-2xs">
            <span className="absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full bg-brand ring-4 ring-brand/15" />
            <div className="font-semibold text-[11px] text-brand tracking-wider uppercase">TAHAP 5 (EVALUATOR + AI)</div>
            <div className="font-semibold text-sm text-ink flex items-center gap-2">
              <Bot className="w-4 h-4 text-brand" /> Tombol Analisis Nilai AI
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Evaluator menekan perintah Analisis Nilai AI untuk memperoleh insight instan kondisi riil eviden dan gambaran skor awal secara otomatis.
            </p>
          </div>

          {/* Step 6 Mobile */}
          <div className="space-y-1.5 relative bg-surface p-4 rounded-2xl border border-line shadow-2xs">
            <span className="absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full bg-brand ring-4 ring-brand/15" />
            <div className="font-semibold text-[11px] text-brand tracking-wider uppercase">TAHAP 6 (EVALUATOR MANDIRI)</div>
            <div className="font-semibold text-sm text-ink flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-brand" /> Pengecekan Mandiri Evaluator
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Evaluator melakukan verifikasi faktual terhadap eviden riil. Jika data kurang, sistem menerbitkan rekomendasi perbaikan kembali ke Lokus.
            </p>
          </div>

          {/* Step 7 Mobile */}
          <div className="space-y-1.5 relative bg-brand text-white p-4 rounded-2xl shadow-sm">
            <span className="absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full bg-brand ring-4 ring-brand/30" />
            <div className="font-semibold text-[11px] text-sky-200 tracking-wider uppercase">TAHAP 7 (PENETAPAN MENPAN-RB)</div>
            <div className="font-semibold text-sm text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-sky-200" /> Penetapan Resmi MenPAN-RB
            </div>
            <p className="text-xs text-sky-100 leading-relaxed">
              Kabupaten menilai melalui Bagian Organisasi, divalidasi oleh Biro Organisasi Provinsi, dan hasil indeks akhir serta rekomendasi perbaikan ditetapkan secara resmi oleh Kementerian PAN-RB.
            </p>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* DETAILED SUMMARY ACCORDIONS / KEY PILLARS                                */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-line text-xs">
          
          <div className="p-4 rounded-2xl bg-surface-subtle/30 border border-line space-y-2">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <Building2 className="w-4 h-4 text-brand" />
              <span>1. Peran Lokus</span>
            </div>
            <p className="text-ink-secondary leading-relaxed">
              Fokus pada input bukti dukung secara tertib per aspek. Terbantu karena tahu persis celah kekurangan dokumen sebelum dinilai evaluator resmi.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-subtle/30 border border-line space-y-2">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <Bot className="w-4 h-4 text-brand" />
              <span>2. Peran AI Engine</span>
            </div>
            <p className="text-ink-secondary leading-relaxed">
              Berperan sebagai filter cerdas dan akselerator analisis: menguji kelayakan dokumen lokus serta memberi prediksi skor instan kepada evaluator.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-subtle/30 border border-line space-y-2">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <UserCheck className="w-4 h-4 text-brand" />
              <span>3. Evaluator &amp; Penetapan</span>
            </div>
            <p className="text-ink-secondary leading-relaxed">
              Kabupaten menilai melalui Bagian Organisasi, divalidasi Biro Organisasi Provinsi, dan hasil akhir indeks IPP ditetapkan secara resmi oleh Kementerian PAN-RB.
            </p>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* BAGIAN 3: DIAGRAM ALUR KERJA PRE-EVALUASI AI (ASPEK KEBIJAKAN PELAYANAN)   */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 lg:p-10 shadow-2xs space-y-8 relative overflow-hidden">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <h3 className="text-lg sm:text-xl font-semibold text-ink">
            Bagaimana AI Membantu?
          </h3>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            Visualisasi bagaimana AI memproses berkas bukti dukung berukuran besar secara hemat token dan menghasilkan audit komprehensif.
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* STEPPER 2 BARIS LEGA DENGAN PANAH JELAS & BAHASA RAMAH        */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-4">
          {/* Baris 1: Langkah 1, 2, 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 items-stretch">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xs flex flex-col justify-between hover:border-brand/40 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-surface-subtle border border-line flex items-center justify-center text-xs font-bold text-ink">
                      1
                    </span>
                    <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Tahap Awal</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-semibold text-ink leading-snug">
                    Lokus Unggah Dokumen
                  </h4>
                  <p className="text-xs sm:text-sm text-ink-secondary mt-2 leading-relaxed">
                    Unit layanan mengunggah berkas bukti secara mandiri, mulai dari SK standar pelayanan, foto maklumat, hingga publikasi dan laporan survei.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                <span className="text-xs text-ink-muted">Format PDF &amp; Foto</span>
                {/* Desktop arrow pointing to Step 2 */}
                <div className="hidden md:flex items-center text-brand font-bold text-sm">
                  &rarr;
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xs flex flex-col justify-between hover:border-brand/40 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-brand-light border border-brand/20 flex items-center justify-center text-xs font-bold text-brand">
                      2
                    </span>
                    <span className="text-xs font-semibold text-brand uppercase tracking-wider">Penyortiran Cerdas</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-semibold text-ink leading-snug">
                    Penyaringan Halaman Inti
                  </h4>
                  <p className="text-xs sm:text-sm text-ink-secondary mt-2 leading-relaxed">
                    Sistem otomatis memilah lembar yang relevan saja (seperti substansi standar &amp; lembar tanda tangan sah), sehingga berkas tebal diringkas tanpa membuang bukti esensial.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                <span className="text-xs text-brand font-medium">Ringkas &amp; Bebas Beban</span>
                {/* Desktop arrow pointing to Step 3 */}
                <div className="hidden md:flex items-center text-brand font-bold text-sm">
                  &rarr;
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xs flex flex-col justify-between hover:border-brand/40 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-surface-subtle border border-line flex items-center justify-center text-xs font-bold text-ink">
                      3
                    </span>
                    <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Penyelarasan</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-semibold text-ink leading-snug">
                    Penyatuan Pedoman &amp; Isian
                  </h4>
                  <p className="text-xs sm:text-sm text-ink-secondary mt-2 leading-relaxed">
                    Kriteria resmi MenPAN-RB, catatan panduan admin, serta jawaban lokus disatukan ke dalam satu paket pemeriksaan terpadu.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                <span className="text-xs text-ink-muted">Pemeriksaan Serentak</span>
                {/* Desktop down indicator */}
                <div className="hidden md:flex items-center text-brand font-bold text-sm">
                  &darr;
                </div>
              </div>
            </div>
          </div>

          {/* Baris 2: Langkah 4, 5 (Lega 2 Kolom) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 items-stretch">
            {/* Step 4 */}
            <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xs flex flex-col justify-between hover:border-brand/40 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-brand-light border border-brand/20 flex items-center justify-center text-xs font-bold text-brand">
                      4
                    </span>
                    <span className="text-xs font-semibold text-brand uppercase tracking-wider">Telaah Visual AI</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-semibold text-ink leading-snug">
                    AI Membaca Bukti &amp; Foto Fisik
                  </h4>
                  <p className="text-xs sm:text-sm text-ink-secondary mt-2 leading-relaxed">
                    AI meneliti keabsahan berkas: membaca teks SK, memeriksa tanda tangan basah/elektronik, memverifikasi foto maklumat di ruang layanan, hingga mengecek tanggal publikasi.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                <span className="text-xs text-brand font-medium">Audit Multimodal Teliti</span>
                {/* Desktop arrow pointing to Step 5 */}
                <div className="hidden md:flex items-center text-brand font-bold text-sm">
                  &rarr;
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xs flex flex-col justify-between hover:border-brand/40 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-surface-subtle border border-line flex items-center justify-center text-xs font-bold text-ink">
                      5
                    </span>
                    <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Hasil Akhir</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-semibold text-ink leading-snug">
                    Catatan Pra-Evaluasi &amp; Rekomendasi
                  </h4>
                  <p className="text-xs sm:text-sm text-ink-secondary mt-2 leading-relaxed">
                    Sistem langsung menampilkan ringkasan kelayakan dokumen, perkiraan nilai, dan poin perbaikan yang siap diverifikasi oleh tim penilai resmi.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                <span className="text-xs text-ink-muted">Siap Ditelaah Evaluator</span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Tuntas
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
