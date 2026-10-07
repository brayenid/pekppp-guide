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
      <div className="space-y-5">
        {/* Card Penuh: Pengantar Inisiatif Mandiri */}
        <div className="rounded-bento border border-stroke/50 bg-surface p-6 sm:p-7 shadow-soft-card space-y-3 relative overflow-hidden">
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

        {/* Grid 2 Card yang Ada - Lebih Compact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Inisiatif Mandiri Bagian Organisasi */}
          <div className="rounded-2xl border border-stroke/50 bg-surface p-4 sm:p-5 shadow-soft-card space-y-2.5 relative overflow-hidden flex flex-col justify-between">
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
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-surface-subtle border border-stroke/60 text-ink">
                <Zap className="w-3 h-3 text-brand" /> AI Pre-Evaluator
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-surface-subtle border border-stroke/60 text-ink">
                <Building2 className="w-3 h-3 text-brand" /> Puluhan – Ratusan Lokus
              </span>
            </div>
          </div>

          {/* Card 2: Bukan Tandingan evaluasi.menpan.go.id, Melainkan Ekstensi Khusus */}
          <div className="rounded-2xl border border-stroke/50 bg-surface p-4 sm:p-5 shadow-soft-card space-y-2.5 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-pastel-blue border border-pastel-blue-border flex items-center justify-center shrink-0">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
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
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-surface-subtle border border-stroke/60 text-ink">
                <Globe2 className="w-3 h-3 text-blue-600" /> Selaras Portal KemenPAN-RB
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-surface-subtle border border-stroke/60 text-ink">
                <Share2 className="w-3 h-3 text-emerald-600" /> Format Siap Ekspor
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* UNIFIED ACTOR-BASED STEP-BY-STEP DIAGRAM CANVAS */}
      {/* ========================================================================= */}
      <div className="rounded-bento border border-stroke/50 bg-surface p-6 sm:p-10 shadow-soft-card space-y-10 relative overflow-hidden">
        
        {/* Top Header Label */}
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h3 className="text-lg sm:text-xl font-semibold text-ink">
            Bagaimana Proses Intinya Bekerja?
          </h3>
          <p className="text-xs sm:text-sm text-ink-secondary">
            Alur kolaborasi terintegrasi: persiapan eviden lokus, audit kelayakan AI, hingga validasi dan penetapan evaluator.
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* DESKTOP CONNECTED SYSTEM (UNIFIED MULTI-STEP SVG CANVAS)      */}
        {/* ------------------------------------------------------------- */}
        <div className="hidden lg:block w-full bg-surface-subtle/30 rounded-2xl border border-stroke/50 p-6 shadow-2xs overflow-x-auto">
          
          <svg className="w-full h-auto min-w-[1020px]" viewBox="0 0 1060 590" fill="none">
            <defs>
              <marker id="arrGold" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <polygon points="0 0, 7 3.5, 0 7" fill="#1D5BB9" />
              </marker>
              <marker id="arrMuted" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <polygon points="0 0, 7 3.5, 0 7" fill="#B8B4AD" />
              </marker>

              {/* Icon box fill - subtle blue tint */}
              <linearGradient id="gradIcon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EEF4FD" />
                <stop offset="100%" stopColor="#DDEBFC" />
              </linearGradient>

              {/* Gateway fill - very light subtle blue */}
              <linearGradient id="gradGateway" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F8FAFD" />
                <stop offset="100%" stopColor="#E5EFFF" />
              </linearGradient>

              {/* Step 7 dark card */}
              <linearGradient id="gradFinal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#122442" />
                <stop offset="100%" stopColor="#0B1628" />
              </linearGradient>

              {/* Step 7 top accent bar - fades at edges */}
              <linearGradient id="gradFinalBar" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1D5BB9" stopOpacity="0" />
                <stop offset="25%" stopColor="#1D5BB9" stopOpacity="0.8" />
                <stop offset="75%" stopColor="#1D5BB9" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#1D5BB9" stopOpacity="0" />
              </linearGradient>

              {/* Subtle card shadow */}
              <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="125%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1C1C1A" floodOpacity="0.06" />
              </filter>

              {/* Gateway: contained gold glow only */}
              <filter id="gatewayGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#1D5BB9" floodOpacity="0.28" />
              </filter>

              {/* Step 7: single soft gold shadow */}
              <filter id="finalGlow" x="-5%" y="-5%" width="110%" height="120%">
                <feDropShadow dx="0" dy="3" stdDeviation="8" floodColor="#1D5BB9" floodOpacity="0.3" />
              </filter>
            </defs>

            {/* SWIMLANES */}
            {/* Zone 1: Lokus */}
            <rect x="25" y="28" width="310" height="172" rx="14" fill="#FBFBFA" stroke="#E5E2DC" strokeDasharray="4 4" />
            <text x="40" y="48" fill="#1D5BB9" fontSize="10.5" fontWeight="700" fontFamily="var(--font-plus-jakarta), sans-serif">
              FASE 1: PERSIAPAN &amp; INPUT LOKUS
            </text>

            {/* Zone 2: AI Pre-Evaluator - gold border to distinguish */}
            <rect x="370" y="28" width="265" height="172" rx="14" fill="#FBFBFA" stroke="#1D5BB9" strokeOpacity="0.5" strokeWidth="1.2" strokeDasharray="4 4" />
            <text x="385" y="48" fill="#1D5BB9" fontSize="10.5" fontWeight="700" fontFamily="var(--font-plus-jakarta), sans-serif">
              FASE 2: ENGINE AI PRE-EVALUATOR
            </text>

            {/* Zone 3: Tim Evaluator */}
            <rect x="760" y="28" width="270" height="547" rx="14" fill="#FBFBFA" stroke="#E5E2DC" strokeDasharray="4 4" />
            <text x="775" y="48" fill="#1D5BB9" fontSize="10.5" fontWeight="700" fontFamily="var(--font-plus-jakarta), sans-serif">
              FASE 3: TIM EVALUATOR (VERIFIKASI &amp; SKOR)
            </text>

            {/* MAIN FLOW ARROWS */}
            {/* Step 1 -> Step 2 */}
            <line x1="165" y1="125" x2="195" y2="125" stroke="#E5E2DC" strokeWidth="2" />
            <line x1="165" y1="125" x2="190" y2="125" stroke="#1D5BB9" strokeWidth="1.8" strokeDasharray="5 5" className="animate-flow-dash" markerEnd="url(#arrGold)" />

            {/* Step 2 -> Step 3 */}
            <line x1="320" y1="125" x2="385" y2="125" stroke="#E5E2DC" strokeWidth="2" />
            <line x1="320" y1="125" x2="380" y2="125" stroke="#1D5BB9" strokeWidth="1.8" strokeDasharray="5 5" className="animate-flow-dash" markerEnd="url(#arrGold)" />

            {/* Step 3 -> Gateway 1 */}
            <line x1="620" y1="122" x2="681" y2="122" stroke="#E5E2DC" strokeWidth="2" />
            <line x1="620" y1="122" x2="678" y2="122" stroke="#1D5BB9" strokeWidth="1.8" strokeDasharray="5 5" className="animate-flow-dash" markerEnd="url(#arrGold)" />

            {/* BPMN GATEWAY 1 - decision point, gold glow */}
            {/* Center (705, 122), half = 24 */}
            <g transform="translate(705, 122)" filter="url(#gatewayGlow)">
              <polygon points="0,-24 24,0 0,24 -24,0" fill="url(#gradGateway)" stroke="#1D5BB9" strokeWidth="2" />
              <text x="0" y="5" fill="#1D5BB9" fontSize="13" fontWeight="800" textAnchor="middle" fontFamily="var(--font-plus-jakarta), sans-serif">?</text>
            </g>

            {/* Gateway 1 -> Step 4 */}
            <line x1="729" y1="122" x2="775" y2="122" stroke="#E5E2DC" strokeWidth="2" />
            <line x1="729" y1="122" x2="771" y2="122" stroke="#1D5BB9" strokeWidth="1.8" strokeDasharray="5 5" className="animate-flow-dash" markerEnd="url(#arrGold)" />

            {/* Badge Lengkap */}
            <g transform="translate(750, 104)">
              <rect x="-24" y="-9" width="48" height="18" rx="9" fill="#FEF7EA" stroke="#1D5BB9" strokeWidth="1" />
              <text x="0" y="4" fill="#C07818" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="var(--font-plus-jakarta), sans-serif">Lengkap</text>
            </g>

            {/* FEEDBACK LOOP 1 (bawah Gateway 1 -> kembali ke Lokus) */}
            <path d="M 705 146 L 705 278 L 102 278 L 102 190" stroke="#E5E2DC" strokeWidth="1.8" fill="none" />
            <path d="M 705 146 L 705 278 L 102 278 L 102 190" stroke="#B8B4AD" strokeWidth="1.5" strokeDasharray="5 5" fill="none" className="animate-flow-dash" markerEnd="url(#arrMuted)" />

            {/* Feedback label 1 */}
            <g transform="translate(360, 278)">
              <rect x="-108" y="-12" width="216" height="24" rx="12" fill="#FBFBFA" stroke="#E5E2DC" strokeWidth="1" />
              <text x="0" y="4.5" fill="#8D8C86" fontSize="10" fontWeight="500" textAnchor="middle" fontFamily="var(--font-plus-jakarta), sans-serif">
                Bukti Kurang Sesuai &rarr; Perbaiki Bukti
              </text>
            </g>

            {/* EVALUATOR CONNECTORS */}
            {/* Step 4 -> Step 5 */}
            <line x1="895" y1="140" x2="895" y2="170" stroke="#E5E2DC" strokeWidth="2" />
            <line x1="895" y1="140" x2="895" y2="165" stroke="#1D5BB9" strokeWidth="1.8" strokeDasharray="5 5" className="animate-flow-dash" markerEnd="url(#arrGold)" />

            {/* Step 5 -> Step 6 */}
            <line x1="895" y1="255" x2="895" y2="285" stroke="#E5E2DC" strokeWidth="2" />
            <line x1="895" y1="255" x2="895" y2="280" stroke="#1D5BB9" strokeWidth="1.8" strokeDasharray="5 5" className="animate-flow-dash" markerEnd="url(#arrGold)" />

            {/* Step 6 -> Gateway 2 */}
            <line x1="895" y1="370" x2="895" y2="396" stroke="#E5E2DC" strokeWidth="2" />
            <line x1="895" y1="370" x2="895" y2="393" stroke="#1D5BB9" strokeWidth="1.8" strokeDasharray="5 5" className="animate-flow-dash" markerEnd="url(#arrGold)" />

            {/* BPMN GATEWAY 2 - decision point, gold glow */}
            {/* Center (895, 416), half = 22 */}
            <g transform="translate(895, 416)" filter="url(#gatewayGlow)">
              <polygon points="0,-22 22,0 0,22 -22,0" fill="url(#gradGateway)" stroke="#1D5BB9" strokeWidth="2" />
              <text x="0" y="4.5" fill="#1D5BB9" fontSize="12" fontWeight="800" textAnchor="middle" fontFamily="var(--font-plus-jakarta), sans-serif">?</text>
            </g>

            {/* Gateway 2 -> Step 7 */}
            <line x1="895" y1="438" x2="895" y2="475" stroke="#E5E2DC" strokeWidth="2" />
            <line x1="895" y1="438" x2="895" y2="471" stroke="#1D5BB9" strokeWidth="1.8" strokeDasharray="5 5" className="animate-flow-dash" markerEnd="url(#arrGold)" />

            {/* Badge Sesuai */}
            <g transform="translate(936, 456)">
              <rect x="-24" y="-9" width="48" height="18" rx="9" fill="#FEF7EA" stroke="#1D5BB9" strokeWidth="1" />
              <text x="0" y="4" fill="#C07818" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="var(--font-plus-jakarta), sans-serif">Sesuai</text>
            </g>

            {/* FEEDBACK LOOP 2 (kiri Gateway 2 -> kembali ke Lokus) */}
            <path d="M 873 416 L 102 416 L 102 285" stroke="#E5E2DC" strokeWidth="1.8" fill="none" />
            <path d="M 873 416 L 102 416 L 102 285" stroke="#B8B4AD" strokeWidth="1.5" strokeDasharray="5 5" fill="none" className="animate-flow-dash" markerEnd="url(#arrMuted)" />

            {/* Feedback label 2 */}
            <g transform="translate(480, 416)">
              <rect x="-94" y="-12" width="188" height="24" rx="12" fill="#FBFBFA" stroke="#E5E2DC" strokeWidth="1" />
              <text x="0" y="4.5" fill="#8D8C86" fontSize="10" fontWeight="500" textAnchor="middle" fontFamily="var(--font-plus-jakarta), sans-serif">
                Rekomendasi &rarr; Perbaiki Bukti
              </text>
            </g>

            {/* STEP CARDS 1-6 (clean flat, on-brand) */}

            {/* STEP 1: Upload Bukti */}
            <g transform="translate(40, 65)" filter="url(#cardShadow)">
              <rect width="125" height="120" rx="14" fill="#FBFBFA" stroke="#E5E2DC" strokeWidth="1.5" />
              <rect x="42" y="12" width="40" height="40" rx="10" fill="#FBF3E6" stroke="#1D5BB9" strokeOpacity="0.6" strokeWidth="1" />
              <g transform="translate(54, 24) scale(0.7)" stroke="#1D5BB9" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 21 15 v 4 a 2 2 0 0 1 -2 2 H 5 a 2 2 0 0 1 -2 -2 v -4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </g>
              <text x="62" y="68" fill="#1C1C1A" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="var(--font-plus-jakarta), sans-serif">1. Upload Bukti</text>
              <line x1="15" y1="76" x2="110" y2="76" stroke="#E5E2DC" strokeWidth="1" />
              <text x="62" y="93" fill="#1D5BB9" fontSize="9.5" fontWeight="600" textAnchor="middle" fontFamily="var(--font-plus-jakarta), sans-serif">Upload Bukti</text>
              <text x="62" y="107" fill="#1D5BB9" fontSize="9.5" fontWeight="600" textAnchor="middle" fontFamily="var(--font-plus-jakarta), sans-serif">Lengkap</text>
            </g>

            {/* STEP 2: Uji Kelayakan */}
            <g transform="translate(195, 65)" filter="url(#cardShadow)">
              <rect width="125" height="120" rx="14" fill="#FBFBFA" stroke="#E5E2DC" strokeWidth="1.5" />
              <rect x="42" y="12" width="40" height="40" rx="10" fill="#FBF3E6" stroke="#1D5BB9" strokeOpacity="0.6" strokeWidth="1" />
              <g transform="translate(54, 24) scale(0.7)" stroke="#1D5BB9" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" fill="#1D5BB9" />
              </g>
              <text x="62" y="68" fill="#1C1C1A" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="var(--font-plus-jakarta), sans-serif">2. Uji Kelayakan</text>
              <line x1="15" y1="76" x2="110" y2="76" stroke="#E5E2DC" strokeWidth="1" />
              <text x="62" y="93" fill="#1D5BB9" fontSize="9" fontWeight="600" textAnchor="middle" fontFamily="var(--font-plus-jakarta), sans-serif">Klik Tombol</text>
              <text x="62" y="107" fill="#1D5BB9" fontSize="9" fontWeight="600" textAnchor="middle" fontFamily="var(--font-plus-jakarta), sans-serif">Cek Kelayakan</text>
            </g>

            {/* STEP 3: Pre-Evaluasi AI (HIGHLIGHTED POINT 3) */}
            <g transform="translate(385, 60)" filter="url(#cardShadow)">
              <rect width="235" height="125" rx="16" fill="#FBFBFA" stroke="#1D5BB9" strokeWidth="2.2" />
              <rect x="18" y="16" width="44" height="44" rx="12" fill="#FBF3E6" stroke="#1D5BB9" strokeWidth="1.2" />
              <g transform="translate(30, 28) scale(0.75)" stroke="#1D5BB9" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 12 8 V 4 H 8" />
                <rect width="16" height="12" x="4" y="8" rx="2" />
                <path d="M 2 14 h 2 M 20 14 h 2 M 15 13 v 2 M 9 13 v 2" />
              </g>
              <text x="72" y="37" fill="#1C1C1A" fontSize="12" fontWeight="700" fontFamily="var(--font-plus-jakarta), sans-serif">3. Pre-Evaluasi AI</text>
              <text x="72" y="52" fill="#1D5BB9" fontSize="10" fontWeight="600" fontFamily="var(--font-plus-jakarta), sans-serif">Audit Otomatis 31 Indikator</text>
              <line x1="18" y1="72" x2="217" y2="72" stroke="#E5E2DC" strokeWidth="1" />
              <text x="18" y="90" fill="#54534F" fontSize="10" fontWeight="500" fontFamily="var(--font-plus-jakarta), sans-serif">&bull; Cek kelengkapan eviden</text>
              <text x="18" y="107" fill="#71716E" fontSize="10" textAnchor="start" fontFamily="var(--font-plus-jakarta), sans-serif">&bull; Uji kesesuaian instrumen</text>
            </g>

            {/* STEP 4: Cek Bukti Baru Lokus */}
            <g transform="translate(775, 55)" filter="url(#cardShadow)">
              <rect width="240" height="85" rx="14" fill="#FBFBFA" stroke="#E5E2DC" strokeWidth="1.5" />
              <rect x="14" y="14" width="36" height="36" rx="10" fill="#FBF3E6" stroke="#1D5BB9" strokeOpacity="0.6" strokeWidth="1" />
              <g transform="translate(24, 24) scale(0.65)" stroke="#1D5BB9" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </g>
              <text x="60" y="31" fill="#1C1C1A" fontSize="11" fontWeight="700" fontFamily="var(--font-plus-jakarta), sans-serif">4. Cek Bukti Baru Lokus</text>
              <text x="60" y="45" fill="#1D5BB9" fontSize="9" fontWeight="600" fontFamily="var(--font-plus-jakarta), sans-serif">Tim Evaluator Membuka Berkas</text>
              <line x1="14" y1="57" x2="226" y2="57" stroke="#E5E2DC" strokeWidth="1" />
              <text x="14" y="71" fill="#71716E" fontSize="9" fontFamily="var(--font-plus-jakarta), sans-serif">Menerima data siap uji per aspek dari lokus</text>
            </g>

            {/* STEP 5: Analisis Nilai AI (HIGHLIGHTED POINT 5) */}
            <g transform="translate(775, 170)" filter="url(#cardShadow)">
              <rect width="240" height="85" rx="14" fill="#FBFBFA" stroke="#1D5BB9" strokeWidth="2.2" />
              <rect x="14" y="14" width="36" height="36" rx="10" fill="#FBF3E6" stroke="#1D5BB9" strokeWidth="1.2" />
              <g transform="translate(24, 24) scale(0.65)" stroke="#1D5BB9" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 12 8 V 4 H 8" />
                <rect width="16" height="12" x="4" y="8" rx="2" />
                <path d="M 2 14 h 2 M 20 14 h 2 M 15 13 v 2 M 9 13 v 2" />
              </g>
              <text x="60" y="31" fill="#1C1C1A" fontSize="11" fontWeight="700" fontFamily="var(--font-plus-jakarta), sans-serif">5. Analisis Nilai AI</text>
              <text x="60" y="45" fill="#1D5BB9" fontSize="9" fontWeight="600" fontFamily="var(--font-plus-jakarta), sans-serif">Langkah Awal Pre-Evaluasi</text>
              <line x1="14" y1="57" x2="226" y2="57" stroke="#E5E2DC" strokeWidth="1" />
              <text x="14" y="71" fill="#71716E" fontSize="9" fontFamily="var(--font-plus-jakarta), sans-serif">1-Klik perintah guna peroleh insight segera</text>
            </g>

            {/* STEP 6: Cek Mandiri */}
            <g transform="translate(775, 285)" filter="url(#cardShadow)">
              <rect width="240" height="85" rx="14" fill="#FBFBFA" stroke="#E5E2DC" strokeWidth="1.5" />
              <rect x="14" y="14" width="36" height="36" rx="10" fill="#FBF3E6" stroke="#1D5BB9" strokeOpacity="0.6" strokeWidth="1" />
              <g transform="translate(24, 24) scale(0.65)" stroke="#1D5BB9" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="m 9 12 2 2 4-4" />
              </g>
              <text x="60" y="31" fill="#1C1C1A" fontSize="11" fontWeight="700" fontFamily="var(--font-plus-jakarta), sans-serif">6. Cek Mandiri</text>
              <text x="60" y="45" fill="#1D5BB9" fontSize="9" fontWeight="600" fontFamily="var(--font-plus-jakarta), sans-serif">Verifikasi Faktual Tim Evaluator</text>
              <line x1="14" y1="57" x2="226" y2="57" stroke="#E5E2DC" strokeWidth="1" />
              <text x="14" y="71" fill="#71716E" fontSize="9" fontFamily="var(--font-plus-jakarta), sans-serif">Menelaah kesesuaian data riil lapangan</text>
            </g>

            {/* STEP 7 - TUJUAN AKHIR: dark card, satu gold accent bar */}
            <g transform="translate(775, 475)" filter="url(#finalGlow)" className="animate-final-glow">
              <rect width="240" height="85" rx="16" fill="url(#gradFinal)" stroke="#1D5BB9" strokeWidth="2" />
              {/* single slim gold top bar */}
              <rect x="20" y="0" width="200" height="3" rx="1.5" fill="url(#gradFinalBar)" />
              <rect x="14" y="14" width="38" height="38" rx="10" fill="#1D5BB9" />
              <g transform="translate(25, 25) scale(0.68)" stroke="#FFFFFF" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 16 21 v-2 a 4 4 0 0 0-4-4 H 6 a 4 4 0 0 0-4 4 v 2" />
                <circle cx="9" cy="7" r="4" />
                <polyline points="16 11 18 13 22 9" stroke="#FFFFFF" />
              </g>
              <text x="62" y="31" fill="#FFFFFF" fontSize="11.5" fontWeight="700" fontFamily="var(--font-plus-jakarta), sans-serif">7. Penilaian &amp; Rekomendasi</text>
              <text x="62" y="45" fill="#1D5BB9" fontSize="10" fontWeight="700" fontFamily="var(--font-plus-jakarta), sans-serif">&#9733; Hasil Akhir Resmi Terbit</text>
              <line x1="14" y1="58" x2="226" y2="58" stroke="#2E2920" strokeWidth="1" />
              <text x="14" y="72" fill="#8A8478" fontSize="9" fontFamily="var(--font-plus-jakarta), sans-serif">Penerbitan indeks nilai &amp; rekomendasi final</text>
            </g>

          </svg>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MOBILE & TABLET STEP-BY-STEP VERTICAL FLOW                    */}
        {/* ------------------------------------------------------------- */}
        <div className="block lg:hidden space-y-4 relative pl-6 border-l-2 border-dashed border-brand/60">
          
          {/* Step 1 Mobile */}
          <div className="space-y-1 relative bg-surface-subtle/50 p-4 rounded-xl border border-stroke/60">
            <span className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-brand ring-4 ring-brand/20 animate-pulse" />
            <div className="font-semibold text-xs text-brand">TAHAP 1 (LOKUS)</div>
            <div className="font-bold text-sm text-ink flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand" /> Upload Bukti Lengkap
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Unit lokus mengunggah berkas bukti dukung secara lengkap per aspek (F-01 s/d F-06) ke Google Drive atau form sistem.
            </p>
          </div>

          {/* Step 2 Mobile */}
          <div className="space-y-1 relative bg-surface-subtle/50 p-4 rounded-xl border border-stroke/60">
            <span className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-brand ring-4 ring-brand/20" />
            <div className="font-semibold text-xs text-brand">TAHAP 2 (LOKUS)</div>
            <div className="font-bold text-sm text-ink flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand" /> Klik Tombol Cek Kelayakan
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Setelah bukti dukung berstatus lengkap, tombol cek kelayakan aktif dan lokus mengeklik tombol untuk meminta audit otomatis AI.
            </p>
          </div>

          {/* Step 3 Mobile */}
          <div className="space-y-1 relative bg-surface-subtle/50 p-4 rounded-xl border border-stroke/60">
            <span className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-brand ring-4 ring-brand/20 animate-pulse" />
            <div className="font-semibold text-xs text-brand">TAHAP 3 (ENGINE AI)</div>
            <div className="font-bold text-sm text-ink flex items-center gap-2">
              <Bot className="w-4 h-4 text-brand" /> Pre-Evaluasi AI &amp; Audit Otomatis
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              AI memeriksa 31 indikator. <strong>Jika berhasil</strong> lanjut ke evaluator. <strong>Jika bukti kurang sesuai</strong>, sistem mengembalikan alur ke Lokus untuk melengkapi eviden yang belum valid.
            </p>
          </div>

          {/* Step 4 Mobile */}
          <div className="space-y-1 relative bg-surface-subtle/50 p-4 rounded-xl border border-stroke/60">
            <span className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-ink ring-4 ring-ink/20" />
            <div className="font-semibold text-xs text-ink-muted">TAHAP 4 (EVALUATOR)</div>
            <div className="font-bold text-sm text-ink flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-ink" /> Evaluator Melihat Bukti Baru Per Aspek
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Tim Evaluator membuka dashboard dan memantau bukti dukung baru per aspek yang telah lolos pra-uji.
            </p>
          </div>

          {/* Step 5 Mobile */}
          <div className="space-y-1 relative bg-surface-subtle/50 p-4 rounded-xl border border-stroke/60">
            <span className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-brand ring-4 ring-brand/20" />
            <div className="font-semibold text-xs text-brand">TAHAP 5 (EVALUATOR + AI)</div>
            <div className="font-bold text-sm text-ink flex items-center gap-2">
              <Bot className="w-4 h-4 text-brand" /> Tombol Analisis Nilai AI
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Evaluator menekan perintah Analisis Nilai AI untuk memperoleh insight instan kondisi riil eviden dan gambaran skor awal secara otomatis.
            </p>
          </div>

          {/* Step 6 Mobile */}
          <div className="space-y-1 relative bg-surface-subtle/50 p-4 rounded-xl border border-stroke/60">
            <span className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-brand ring-4 ring-brand/20" />
            <div className="font-semibold text-xs text-brand">TAHAP 6 (EVALUATOR MANDIRI)</div>
            <div className="font-bold text-sm text-ink flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-ink" /> Pengecekan Mandiri Evaluator
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Evaluator melakukan verifikasi faktual terhadap eviden riil. Jika data kurang, sistem menerbitkan rekomendasi perbaikan kembali ke Lokus.
            </p>
          </div>

          {/* Step 7 Mobile */}
          <div className="space-y-1 relative bg-surface-subtle/50 p-4 rounded-xl border border-stroke/60">
            <span className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-ink ring-4 ring-ink/20" />
            <div className="font-semibold text-xs text-ink">TAHAP 7 (PENILAIAN RESMI)</div>
            <div className="font-bold text-sm text-ink flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand" /> Penilaian &amp; Rekomendasi Akhir
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Setelah seluruh eviden terverifikasi valid, Evaluator menetapkan skor resmi dan menerbitkan indeks evaluasi final.
            </p>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* DETAILED SUMMARY ACCORDIONS / KEY PILLARS                                */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-stroke/40 text-xs">
          
          <div className="p-4 rounded-xl bg-surface-subtle/40 border border-stroke/60 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <Building2 className="w-4 h-4 text-brand" />
              <span>1. Peran Lokus</span>
            </div>
            <p className="text-ink-secondary leading-relaxed">
              Fokus pada input bukti dukung secara tertib per aspek. Terbantu karena tahu persis celah kekurangan dokumen sebelum dinilai evaluator resmi.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-subtle/40 border border-stroke/60 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <Bot className="w-4 h-4 text-brand" />
              <span>2. Peran AI Engine</span>
            </div>
            <p className="text-ink-secondary leading-relaxed">
              Berperan sebagai filter cerdas dan akselerator analisis: menguji kelayakan dokumen lokus serta memberi prediksi skor instan kepada evaluator.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-subtle/40 border border-stroke/60 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <UserCheck className="w-4 h-4 text-brand" />
              <span>3. Peran Evaluator</span>
            </div>
            <p className="text-ink-secondary leading-relaxed">
              Memegang kewenangan keputusan akhir. Menghemat 80% waktu audit manual dengan bantuan rekomendasi AI tanpa kehilangan ketajaman cek mandiri.
            </p>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* BAGIAN 3: DIAGRAM ALUR KERJA PRE-EVALUASI AI (ASPEK KEBIJAKAN PELAYANAN)   */}
      {/* ========================================================================= */}
      <div className="rounded-bento border border-stroke/50 bg-surface p-6 sm:p-10 shadow-soft-card space-y-8 relative overflow-hidden">
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
        <div className="space-y-6">
          {/* Baris 1: Langkah 1, 2, 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-stretch">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-stroke/70 bg-surface p-5 shadow-soft-card flex flex-col justify-between hover:border-brand/40 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-surface-subtle border border-stroke flex items-center justify-center text-xs font-bold text-ink">
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
              <div className="mt-4 pt-3 border-t border-stroke/40 flex items-center justify-between">
                <span className="text-xs text-ink-muted">Format PDF &amp; Foto</span>
                {/* Desktop arrow pointing to Step 2 */}
                <div className="hidden md:flex items-center text-brand font-bold text-sm">
                  &rarr;
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-stroke/70 bg-surface p-5 shadow-soft-card flex flex-col justify-between hover:border-brand/40 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-xs font-bold text-brand">
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
              <div className="mt-4 pt-3 border-t border-stroke/40 flex items-center justify-between">
                <span className="text-xs text-brand font-medium">Ringkas &amp; Bebas Beban</span>
                {/* Desktop arrow pointing to Step 3 */}
                <div className="hidden md:flex items-center text-brand font-bold text-sm">
                  &rarr;
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-stroke/70 bg-surface p-5 shadow-soft-card flex flex-col justify-between hover:border-brand/40 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-surface-subtle border border-stroke flex items-center justify-center text-xs font-bold text-ink">
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
              <div className="mt-4 pt-3 border-t border-stroke/40 flex items-center justify-between">
                <span className="text-xs text-ink-muted">Pemeriksaan Serentak</span>
                {/* Desktop down indicator */}
                <div className="hidden md:flex items-center text-brand font-bold text-sm">
                  &darr;
                </div>
              </div>
            </div>
          </div>

          {/* Baris 2: Langkah 4, 5 (Lega 2 Kolom) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 items-stretch">
            {/* Step 4 */}
            <div className="relative rounded-2xl border border-stroke/70 bg-surface p-5 shadow-soft-card flex flex-col justify-between hover:border-brand/40 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-xs font-bold text-brand">
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
              <div className="mt-4 pt-3 border-t border-stroke/40 flex items-center justify-between">
                <span className="text-xs text-brand font-medium">Audit Multimodal Teliti</span>
                {/* Desktop arrow pointing to Step 5 */}
                <div className="hidden md:flex items-center text-brand font-bold text-sm">
                  &rarr;
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="relative rounded-2xl border border-stroke/70 bg-surface p-5 shadow-soft-card flex flex-col justify-between hover:border-brand/40 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-surface-subtle border border-stroke flex items-center justify-center text-xs font-bold text-ink">
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
              <div className="mt-4 pt-3 border-t border-stroke/40 flex items-center justify-between">
                <span className="text-xs text-ink-muted">Siap Ditelaah Evaluator</span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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
