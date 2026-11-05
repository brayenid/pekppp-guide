'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  BookOpen,
  Layers,
  Database,
  ArrowRightLeft,
  FileCode2,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  FolderArchive,
  Calculator,
  CalendarDays,
  FileCheck2,
  Server,
  CheckCircle2,
  AlertTriangle,
  Info,
  Code2,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { UnderlineTabs } from '../../../components/ui/Tabs'

type DocTab = 'fitur' | 'skema-json' | 'mapping-api' | 'payload-api'

const VALID_TABS: DocTab[] = ['fitur', 'skema-json', 'mapping-api', 'payload-api']

function resolveTabParam(raw: string | null): DocTab {
  if (!raw) return 'fitur'
  if (VALID_TABS.includes(raw as DocTab)) return raw as DocTab
  // Dukungan alias lama
  if (raw === 'features') return 'fitur'
  if (raw === 'local-json') return 'skema-json'
  if (raw === 'menpan-spec') return 'mapping-api'
  if (raw === 'json-catalog') return 'payload-api'
  return 'fitur'
}

interface JsonExampleItem {
  id: string
  title: string
  method?: 'GET' | 'POST' | 'SCHEMA'
  endpoint?: string
  statusBadge?: string
  description: string
  json: Record<string, any> | Array<any>
}

const LOCAL_JSON_SCHEMAS: JsonExampleItem[] = [
  {
    id: 'f01Data',
    title: '1. EvaluationScore.f01Data (Jawaban Mandiri F-01 UPP)',
    method: 'SCHEMA',
    endpoint: 'Tabel: EvaluationScore.f01Data (Json)',
    description:
      'Menyimpan jawaban kuesioner mandiri (Self-Assessment) yang diisi oleh Lokus/UPP pada setiap indikator (1..31), termasuk pilihan opsi, rincian teks/angka tambahan, dan tautan bukti dukung.',
    json: {
      selectedOption: 'a',
      selectedOptions: ['a', 'b', 'c'],
      selfScore: 4,
      subAnswers: {
        jumlah_jenis_layanan: 12,
        jumlah_sp_ditetapkan: 12,
        nomor_sk_sp: 'SK Kepala Dinas Nomor 188.4/045/2026'
      },
      notes: 'Seluruh standar pelayanan telah ditetapkan dan dipublikasikan pada portal resmi.',
      updatedBy: 'Operator Dinas Dukcapil',
      updatedAt: '2026-04-15T08:30:00.000Z'
    }
  },
  {
    id: 'aspectNotes',
    title: '2. Evaluation.aspectNotes & aiEvaluatorNotes (Catatan Rekomendasi 6 Aspek)',
    method: 'SCHEMA',
    endpoint: 'Tabel: Evaluation.aspectNotes & aiEvaluatorNotes (Json)',
    description:
      'Menyimpan catatan evaluasi resmi per aspek (Aspek I s.d. VI) yang tampil pada Berita Acara (BAP) serta hasil audit asisten AI khusus Evaluator.',
    json: {
      aspectNotes: {
        I: 'Standar Pelayanan telah ditetapkan lengkap untuk seluruh jenis layanan, namun pelibatan masyarakat dalam FKP perlu diperluas.',
        II: 'Kompetensi SDM pelaksana dan kode etik telah diterapkan dengan baik.',
        III: 'Sarana prasarana ramah kelompok rentan sudah tersedia dan berfungsi optimal.',
        IV: 'SIPP terintegrasi dengan portal nasional dan dimutakhirkan secara berkala.',
        V: 'Pengelolaan pengaduan telah memiliki SOP dan diselesaikan sesuai SLA.',
        VI: 'Inovasi pelayanan memberikan dampak nyata pada pemangkasan waktu layanan.'
      },
      aiEvaluatorNotes: {
        I: {
          confidenceLevel: 'HIGH',
          confidenceScore: 92,
          summary: 'Bukti SK SP dan Berita Acara FKP valid serta bertanggal tahun berjalan.',
          aspectGaps: ['Dokumentasi daftar hadir unsur akademisi pada FKP belum dilampirkan.'],
          analyzedAt: '2026-04-16T10:15:22.000Z'
        }
      }
    }
  },
  {
    id: 'f03Answers',
    title: '3. F03Respondent.answers (Jawaban Survei Persepsi Masyarakat F-03)',
    method: 'SCHEMA',
    endpoint: 'Tabel: F03Respondent.answers (Json)',
    description:
      'Menyimpan skor skala 1..5 dari 14 butir kuesioner F-03 per responden masyarakat (skor mentah maksimal 70, dikonversi otomatis ke skala 0..5).',
    json: {
      respondentNo: 1,
      name: 'Responden Publik #01',
      submittedVia: 'PUBLIC',
      totalScore: 64,
      scale5: 4.57,
      answers: {
        '1': 5,
        '2': 5,
        '3': 4,
        '4': 5,
        '5': 4,
        '6': 5,
        '7': 5,
        '8': 4,
        '9': 5,
        '10': 4,
        '11': 5,
        '12': 4,
        '13': 4,
        '14': 5
      }
    }
  },
  {
    id: 'evidenceMaster',
    title: '4. UnitEvidenceMaster.attachments & history (Living Document Bukti Dukung)',
    method: 'SCHEMA',
    endpoint: 'Tabel: UnitEvidenceMaster & IndicatorEvidenceSubmission (Json)',
    description:
      'Menyimpan daftar berkas bukti dukung multi-file beserta pohon versi lintas tahun (Carry-Over) dan jejak audit (Activity Trail).',
    json: {
      aspectCode: 'I',
      slotKey: 'sk_sp',
      title: 'Dokumen SK Standar Pelayanan (SP) & Lampiran',
      lastSourceYear: 2026,
      attachments: [
        {
          id: 'att-901a-2026',
          fileName: 'SK_Standar_Pelayanan_2026_Signed.pdf',
          fileUrl: 'https://r2.pekppp.go.id/units/dinas-dukcapil/2026/SK_SP_2026.pdf',
          fileSize: 2458112,
          fileType: 'PDF',
          storageProvider: 'R2',
          version: 2,
          uploadedAt: '2026-03-10T09:12:00.000Z'
        }
      ],
      history: [
        {
          id: 'hist-01',
          timestamp: '2026-03-10T09:12:00.000Z',
          action: 'UPLOAD_NEW_VERSION',
          actorName: 'Admin Dukcapil',
          fileName: 'SK_Standar_Pelayanan_2026_Signed.pdf',
          note: 'Pembaruan SK Standar Pelayanan Tahun 2026'
        }
      ]
    }
  },
  {
    id: 'syncLogs',
    title: '5. Evaluation.syncLogs (Cache Pemetaan Soal & Audit Sinkronisasi MenPAN-RB)',
    method: 'SCHEMA',
    endpoint: 'Tabel: Evaluation.syncLogs (Json)',
    description:
      'Menyimpan cache struktur pertanyaan resmi MenPAN-RB (questionMap) untuk lokus terkait serta log respons pengiriman terakhir.',
    json: {
      mode: 'PRODUCTION_API',
      status: 202,
      menpanStatus: 'queued',
      uuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      questionsCount: 31,
      syncedAt: '2026-05-01T14:20:00.000Z',
      lastPayloadSummary: {
        keysCount: 31,
        sample: [
          ['1041', '5'],
          ['1042', '4'],
          ['1043', ['4']]
        ]
      },
      questionMap: [
        {
          id: 1041,
          index: 1,
          name: 'Apakah tersedia Standar Pelayanan (SP) yang sesuai dengan ketentuan peraturan perundang-undangan yang berlaku?',
          bobot: 17,
          is_required: true,
          option_type: 'radio',
          options: [
            { id: 5001, text: 'Tidak tersedia Standar Pelayanan', bobot: 0, index: 1 },
            { id: 5002, text: 'Tersedia SP namun belum memenuhi 14 komponen', bobot: 1, index: 2 },
            { id: 5006, text: 'Tersedia SP lengkap dan ditetapkan secara formal', bobot: 5, index: 6 }
          ]
        }
      ]
    }
  }
]

const MENPAN_API_PAYLOADS: JsonExampleItem[] = [
  {
    id: 'get-user',
    title: '1. Verifikasi Kredensial & Instansi (GET /user)',
    method: 'GET',
    endpoint: '/user',
    statusBadge: '200 OK',
    description:
      'Digunakan oleh fitur "Uji Koneksi" untuk memvalidasi Bearer Token (Sanctum Personal Access Token) dan mengidentifikasi government_instance_id.',
    json: {
      id: 412,
      name: 'Bagian Organisasi Setda',
      email: 'ortala@pemda.go.id',
      roles: ['evaluator_instansi'],
      government_instance_id: 7100
    }
  },
  {
    id: 'get-evaluations',
    title: '2. Daftar Lokus Evaluasi MenPAN-RB (GET /evaluations)',
    method: 'GET',
    endpoint: '/evaluations?year=2026&per_page=100',
    statusBadge: '200 OK',
    description:
      'Menarik daftar lokus evaluasi yang terdaftar di portal evaluasi.menpan.go.id. Atribut uuid disimpan ke Evaluation.menpanEvaluationId untuk pengikatan lokus.',
    json: {
      data: [
        {
          id: 88210,
          uuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          name: 'Dinas Kependudukan dan Pencatatan Sipil',
          year: '2026',
          status: 'Sedang Diisi',
          is_priority: true,
          progress_percentage: 85.5,
          form_sheet: {
            id: 12,
            name: 'Formulir Penilaian PEKPPP Mandiri 2026'
          },
          government_instance: {
            id: 7100,
            name: 'Pemerintah Daerah'
          }
        }
      ],
      meta: {
        current_page: 1,
        per_page: 100,
        total: 1
      }
    }
  },
  {
    id: 'get-questions',
    title: '3. Kamus Pemetaan ID Pertanyaan & Opsi (GET /evaluations/{uuid}/form/questions)',
    method: 'GET',
    endpoint: '/evaluations/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d/form/questions',
    statusBadge: '200 OK',
    description:
      'PENTING: Endpoint ini TIDAK digunakan untuk menimpa 31 indikator baku di aplikasi lokal, melainkan berfungsi sebagai "Kamus Penerjemah ID (Auto-Mapper)". Saat mengirim jawaban (POST /answers), MenPAN-RB tidak menerima nomor urut 1..31, melainkan mewajibkan ID primary key database internal mereka (misal 1041, 1042) yang bersifat dinamis per tahun/form_sheet, serta mewajibkan format nilai sesuai option_type ("radio" berupa string tunggal vs "checkbox" berupa array string).',
    json: {
      data: [
        {
          id: 1041,
          name: 'Apakah tersedia Standar Pelayanan (SP) yang sesuai dengan ketentuan peraturan perundang-undangan yang berlaku?',
          index: 1,
          bobot: 17,
          is_required: true,
          option_type: 'radio',
          options: [
            { id: 5001, text: 'Skala 0 - Tidak tersedia', bobot: 0, index: 1 },
            { id: 5002, text: 'Skala 1 - Tersedia sebagian tanpa penetapan', bobot: 1, index: 2 },
            { id: 5003, text: 'Skala 2 - Tersedia dan ditetapkan sebagian', bobot: 2, index: 3 },
            { id: 5004, text: 'Skala 3 - Tersedia lengkap namun belum melibatkan masyarakat', bobot: 3, index: 4 },
            { id: 5005, text: 'Skala 4 - Tersedia lengkap dengan berita acara FKP', bobot: 4, index: 5 },
            { id: 5006, text: 'Skala 5 - Tersedia lengkap, melibatkan FKP, dan dipublikasikan', bobot: 5, index: 6 }
          ]
        },
        {
          id: 1042,
          name: 'Apakah proses penyusunan dan perubahan SP telah melibatkan unsur masyarakat (FKP)?',
          index: 2,
          bobot: 22,
          is_required: true,
          option_type: 'checkbox',
          options: [
            { id: 5007, text: 'Melibatkan masyarakat pengguna layanan', bobot: 3, index: 1 },
            { id: 5008, text: 'Melibatkan akademisi, praktisi, dan LSM (5 unsur lengkap)', bobot: 5, index: 2 }
          ]
        }
      ]
    }
  },
  {
    id: 'get-answers',
    title: '4. Pemeriksaan Jawaban Tersimpan / Deteksi Konflik (GET /evaluations/{uuid}/answers)',
    method: 'GET',
    endpoint: '/evaluations/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d/answers?per_page=500',
    statusBadge: '200 OK',
    description:
      'Memeriksa jawaban yang sudah tersimpan di server MenPAN-RB sebelum melakukan PUSH untuk mendeteksi potensi konflik timpa data.',
    json: {
      data: [
        {
          id: 990121,
          question_id: 1041,
          value: '5',
          index: 1,
          source: 'api'
        },
        {
          id: 990122,
          question_id: 1042,
          value: ['5'],
          index: 2,
          source: 'api'
        }
      ]
    }
  },
  {
    id: 'post-answers-req',
    title: '5. Payload Pengiriman Jawaban (POST /evaluations/{uuid}/answers — Request Body)',
    method: 'POST',
    endpoint: '/evaluations/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d/answers',
    statusBadge: 'REQUEST BODY',
    description:
      'Struktur JSON yang dikirimkan oleh MenpanApiService.pushEvaluation() sesuai kontrak OpenAPI 3.0.3 MenPAN-RB. Key menggunakan ID pertanyaan MenPAN (string), dan value berisi string bobot opsi ("0".."5") atau array string untuk tipe checkbox.',
    json: {
      answers: {
        '1041': '5',
        '1042': ['5'],
        '1043': '4',
        '1044': '5',
        '1045': '4',
        '1046': '5',
        '1047': '5',
        '1048': '4'
      }
    }
  },
  {
    id: 'post-answers-202',
    title: '6. Respons Sukses Antrean MenPAN-RB (HTTP 202 Accepted)',
    method: 'POST',
    endpoint: '/evaluations/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d/answers',
    statusBadge: '202 ACCEPTED',
    description:
      'Respons standar ketika server MenPAN-RB menerima seluruh jawaban dan memasukkannya ke dalam antrean pemrosesan (queued). Status lokal otomatis diperbarui menjadi SYNCED.',
    json: {
      message: 'Jawaban berhasil diterima dan sedang diproses dalam antrean.',
      data: {
        evaluation_uuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        status: 'queued',
        queued_at: '2026-05-01T14:20:00.000Z'
      }
    }
  },
  {
    id: 'post-answers-422',
    title: '7. Respons Validasi Ditolak (HTTP 422 Unprocessable Entity)',
    method: 'POST',
    endpoint: '/evaluations/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d/answers',
    statusBadge: '422 UNPROCESSABLE',
    description:
      'Respons ketika terdapat pertanyaan wajib (is_required: true) yang belum terjawab atau format nilai tidak sesuai tipe opsi. Sistem mengekstrak daftar errors ke dalam syncLogs.validationErrors.',
    json: {
      message: 'The given data was invalid.',
      errors: {
        'answers.1041': ['Pertanyaan nomor 1 wajib diisi.'],
        'answers.1042': ['Format jawaban untuk pertanyaan nomor 2 harus berupa array.']
      }
    }
  }
]

export function DokumentasiClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeTab = resolveTabParam(searchParams.get('tab'))
  const endpointParam = searchParams.get('endpoint')
  const selectedPayloadId =
    endpointParam && MENPAN_API_PAYLOADS.some((p) => p.id === endpointParam)
      ? endpointParam
      : MENPAN_API_PAYLOADS[4].id

  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleTabChange = (nextTab: DocTab) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', nextTab)
    if (nextTab !== 'payload-api') {
      params.delete('endpoint')
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handlePayloadSelect = (payloadId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', 'payload-api')
    params.set('endpoint', payloadId)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleCopyJson = (id: string, data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopiedId(id)
    toast.success('Struktur JSON berhasil disalin ke clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const activeCatalogItem =
    MENPAN_API_PAYLOADS.find((item) => item.id === selectedPayloadId) || MENPAN_API_PAYLOADS[0]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        icon={<BookOpen className="w-5 h-5 text-brand" />}
        title="Dokumentasi dan Spesifikasi API"
        description="Referensi fitur sistem PEKPPP, skema data JSON internal, serta kompatibilitas OpenAPI 3.0.3 (spec.json) Portal Nasional MenPAN-RB."
        speedDialItems={[
          {
            label: 'Buka Pengaturan API',
            icon: <Server className="w-4 h-4" />,
            href: '/admin/pengaturan-api',
            variant: 'brand'
          }
        ]}
        actions={
          <Link href="/admin/pengaturan-api">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Server className="w-3.5 h-3.5 text-ink-muted" />}>
              Pengaturan API
            </Button>
          </Link>
        }
      />

      {/* Navigation Tabs */}
      <UnderlineTabs<DocTab>
        activeId={activeTab}
        onChange={handleTabChange}
        items={[
          {
            id: 'fitur',
            label: 'Fitur Sistem',
            icon: <Layers className="w-3.5 h-3.5" />
          },
          {
            id: 'skema-json',
            label: 'Skema JSON',
            icon: <Database className="w-3.5 h-3.5" />
          },
          {
            id: 'mapping-api',
            label: 'Mapping API',
            icon: <ArrowRightLeft className="w-3.5 h-3.5" />
          },
          {
            id: 'payload-api',
            label: 'Payload API',
            icon: <FileCode2 className="w-3.5 h-3.5" />
          }
        ]}
      />

      {/* =====================================================================
          TAB 1: FITUR SISTEM
      ===================================================================== */}
      {activeTab === 'fitur' && (
        <div className="space-y-6">
          {/* Ringkasan Eksekutif */}
          <Card padding="sm" className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand">
              <Info className="w-4 h-4" /> Ringkasan Arsitektur Sistem PEKPPP
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Sistem Pemantauan dan Evaluasi Kinerja Penyelenggaraan Pelayanan Publik (PEKPPP) ini
              dirancang sebagai platform terpadu dari hulu ke hilir: mulai dari manajemen lokus dan
              periode tahunan, pengumpulan bukti dukung berkelanjutan (<em>Living Document</em>),
              penilaian mandiri (<strong>F-01</strong>), verifikasi evaluator berbantuan AI (
              <strong>F-02</strong>), survei persepsi masyarakat (<strong>F-03</strong>), penerbitan
              Berita Acara (BAP), hingga sinkronisasi dua arah (<em>PULL &amp; PUSH</em>) dengan
              portal resmi Kementerian PANRB sesuai spesifikasi OpenAPI 3.0.3 (<code>spec.json</code>).
            </p>
          </Card>

          {/* Grid 6 Modul Utama */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Modul 1 */}
            <Card className="flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <Badge variant="neutral" size="sm">
                    EvaluationPeriod &amp; Unit
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-ink">
                  1. Manajemen Tahun Penilaian, Timeline &amp; Master Lokus
                </h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Mengelola siklus tahunan evaluasi PEKPPP, pengelompokan kategori UPP (OPD,
                  Puskesmas, RSUD, Kecamatan), serta tahapan jendela waktu (<code>PeriodWindow</code>)
                  dengan kontrol izin aksi dinamis maupun <em>override</em> manual oleh Super Admin.
                </p>
              </div>
              <div className="pt-3 border-t border-stroke/40 text-[11px] text-ink-muted space-y-1">
                <div>
                  <strong className="text-ink">Output Data:</strong> Relasi unik{' '}
                  <code>@@unique([year, unitId])</code> pada tabel <code>Evaluation</code> beserta
                  6 tahapan jadwal penilaian.
                </div>
              </div>
            </Card>

            {/* Modul 2 */}
            <Card className="flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                    <FolderArchive className="w-4 h-4" />
                  </div>
                  <Badge variant="success" size="sm">
                    Living Document
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-ink">
                  2. Master Bukti Dukung Lintas Tahun (Carry-Over)
                </h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Setiap lokus memiliki repositori <code>UnitEvidenceMaster</code> yang menyimpan
                  dokumen bukti dukung untuk 6 Aspek Utama. Dokumen statis (seperti SK SP atau
                  Maklumat Pelayanan) dapat diwariskan otomatis ke tahun berikutnya beserta riwayat
                  versi (<em>versioning</em>) dan jejak audit.
                </p>
              </div>
              <div className="pt-3 border-t border-stroke/40 text-[11px] text-ink-muted space-y-1">
                <div>
                  <strong className="text-ink">Output Data &amp; Link Gabungan:</strong> Array JSON{' '}
                  <code>attachments</code> &amp; <code>history</code> yang dihimpun otomatis ke
                  dalam 1 tautan etalase publik per aspek:{' '}
                  <code>/shared/evidence/{'{evaluationId}'}/{'{aspectCode}'}</code> (Aspek I s.d. VI).
                </div>
              </div>
            </Card>

            {/* Modul 3 */}
            <Card className="flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <Badge variant="info" size="sm">
                    31 Indikator &amp; 6 Aspek
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-ink">
                  3. Instrumen F-01, F-02 &amp; F-03 Terintegrasi
                </h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Mencakup 31 Indikator PEKPPP yang terbagi dalam 6 Aspek: Kebijakan Pelayanan (24%),
                  Profesionalisme SDM (25%), Sarana Prasarana (18%), SIPP (11%), Konsultasi &amp;
                  Pengaduan (10%), serta Inovasi (12%). Mendukung diskusi berulir (
                  <code>IndicatorComment</code>) per indikator antara UPP dan Evaluator.
                </p>
              </div>
              <div className="pt-3 border-t border-stroke/40 text-[11px] text-ink-muted space-y-1">
                <div>
                  <strong className="text-ink">Output Data:</strong> Nilai skala 0–5 per indikator (
                  <code>EvaluationScore.score</code>), jawaban mandiri <code>f01Data</code>, dan
                  survei publik <code>F03Respondent</code>.
                </div>
              </div>
            </Card>

            {/* Modul 4 */}
            <Card className="flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <Badge variant="warning" size="sm">
                    Dual F-03 Strategy
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-ink">
                  4. Kalkulator IPP &amp; 2 Strategi Perhitungan Kuota F-03
                </h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Menghitung Indeks Pelayanan Publik (IPP) dengan komposisi bobot{' '}
                  <strong>75% Verifikasi F-02 + 25% Survei F-03</strong>. Dilengkapi pengaturan
                  strategi kuota responden F-03 per tahun penilaian:
                </p>
                <ul className="text-xs text-ink-secondary list-disc pl-4 space-y-1">
                  <li>
                    <strong>Hitung Bertahap (PROPORTIONAL):</strong> Responden yang masuk tetap
                    dihitung secara proporsional terhadap target kuota (misal 8/10 responden).
                  </li>
                  <li>
                    <strong>Target Penuh (STRICT):</strong> Nilai F-03 baru dihitung setelah jumlah
                    responden mencapai 100% target kuota; jika belum tercapai, IPP menggunakan 100%
                    nilai F-02.
                  </li>
                </ul>
              </div>
              <div className="pt-3 border-t border-stroke/40 text-[11px] text-ink-muted">
                <strong className="text-ink">Modul Inti:</strong>{' '}
                <code>src/core/domain/pekppp-calculator.ts</code> (
                <code>calculateEffectiveF03AndIpp</code>).
              </div>
            </Card>

            {/* Modul 5 */}
            <Card className="flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <Badge variant="neutral" size="sm">
                    AI Pre-Evaluator
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-ink">
                  5. Asisten Audit Bukti Dukung AI (Pre-Evaluation Socket)
                </h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Menganalisis kesesuaian antara klaim jawaban mandiri UPP (F-01) dan berkas bukti
                  dukung yang diunggah. Memberikan rekomendasi skor awal (
                  <code>aiSuggestedScore</code>), tingkat keyakinan (<code>aiConfidence</code>),
                  temuan kelemahan (<code>aiWeaknessNotes</code>), serta tips verifikasi lapangan
                  khusus untuk Evaluator.
                </p>
              </div>
              <div className="pt-3 border-t border-stroke/40 text-[11px] text-ink-muted">
                <strong className="text-ink">Output Data:</strong> Atribut audit AI pada{' '}
                <code>EvaluationScore</code> &amp; ringkasan per aspek pada{' '}
                <code>Evaluation.aiEvaluatorNotes</code>.
              </div>
            </Card>

            {/* Modul 6 */}
            <Card className="flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                  <Badge variant="info" size="sm">
                    MenPAN-RB Gateway
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-ink">
                  6. Sinkronisasi Dua Arah Portal Nasional MenPAN-RB
                </h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Mendukung rekonsiliasi lokus otomatis/manual (PULL daftar lokus &amp; 31 butir
                  pertanyaan dari portal MenPAN-RB), deteksi konflik jawaban, validasi kelengkapan
                  pra-kirim, serta pengiriman jawaban (PUSH) berformat JSON yang 100% mematuhi
                  kontrak OpenAPI 3.0.3 Kementerian PANRB.
                </p>
              </div>
              <div className="pt-3 border-t border-stroke/40 text-[11px] text-ink-muted">
                <strong className="text-ink">Modul Inti:</strong>{' '}
                <code>src/services/menpan-api-service.ts</code> &amp;{' '}
                <code>src/services/sync-validator-service.ts</code>.
              </div>
            </Card>
          </div>

          {/* Alur Kerja End-to-End Sistem */}
          <div className="p-5 rounded-xl bg-surface border border-stroke/60 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-brand" />
                  Alur Kerja End-to-End Sistem (Penilaian Lokal hingga Sinkronisasi MenPAN-RB)
                </h3>
                <p className="text-xs text-ink-secondary">
                  Urutan siklus kerja aplikasi dari persiapan periode tahunan, pengisian instrumen
                  lokal, hingga pengiriman nilai akhir ke portal evaluasi.menpan.go.id.
                </p>
              </div>
              <Badge variant="info" size="sm">
                6 Tahap Siklus Sistem
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-xl bg-surface-subtle border border-stroke/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand">Tahap 1 — Inisiasi Tahun &amp; Lokus</span>
                  <span className="text-[10px] font-mono text-ink-muted">LOKAL</span>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Admin membuka tahun penilaian baru (<code>EvaluationPeriod</code>), mengatur kuota
                  &amp; strategi perhitungan F-03 (<em>Hitung Bertahap</em> vs{' '}
                  <em>Target Penuh</em>), serta mendaftarkan lokus UPP peserta evaluasi.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-subtle border border-stroke/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand">
                    Tahap 2 — Pengisian F-01 &amp; Bukti Dukung
                  </span>
                  <span className="text-[10px] font-mono text-ink-muted">OPD / UPP</span>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  UPP mengisi 31 indikator mandiri (<code>f01Data</code>) dan melampirkan berkas
                  bukti dukung (atau mewarisi dokumen tahun sebelumnya via{' '}
                  <code>UnitEvidenceMaster</code>).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-subtle border border-stroke/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand">
                    Tahap 3 — Verifikasi F-02, AI &amp; F-03
                  </span>
                  <span className="text-[10px] font-mono text-ink-muted">EVALUATOR &amp; PUBLIK</span>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Asisten AI memberikan pra-analisis bukti dukung, Evaluator memverifikasi skor F-02
                  (skala 0–5 per indikator), masyarakat mengisi survei F-03, dan kalkulator
                  menghitung nilai IPP akhir beserta Berita Acara (BAP).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-subtle border border-stroke/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand">
                    Tahap 4 — Sync &amp; Rekonsiliasi Lokus
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                    PULL API
                  </span>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Sistem memanggil <code>GET /evaluations?year={'{year}'}</code> untuk menarik
                  daftar lokus resmi dari portal MenPAN-RB, lalu mengikat <code>uuid</code> lokus
                  MenPAN ke kolom lokal <code>Evaluation.menpanEvaluationId</code> (otomatis via
                  pencocokan nama atau ditautkan manual).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-subtle border border-stroke/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand">
                    Tahap 5 — Akuisisi Kamus Pertanyaan
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                    PULL API
                  </span>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Saat lokus ditautkan, sistem menarik{' '}
                  <code>GET /evaluations/{'{uuid}'}/form/questions</code>. Data ini{' '}
                  <strong>tidak menimpa 31 indikator lokal</strong>, melainkan disimpan di{' '}
                  <code>syncLogs.questionMap</code> sebagai kamus penerjemah nomor urut indikator
                  (1..31) ke <code>question_id</code> internal MenPAN-RB.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-subtle border border-stroke/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand">
                    Tahap 6 — Cek Konflik &amp; Push Nilai
                  </span>
                  <span className="text-[10px] font-mono text-amber-700 font-semibold">
                    PUSH API
                  </span>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Sistem memeriksa jawaban eksisting di MenPAN (<code>GET .../answers</code>),
                  memvalidasi kelengkapan 31 indikator lokal, menerjemahkan skor 0–5 ke format
                  payload <code>{`{ answers: { [question_id]: value } }`}</code>, dan mengirimkannya
                  ke <code>POST .../answers</code> hingga berstatus <code>202 Accepted (SYNCED)</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: SKEMA JSON (DATABASE / PRISMA)
      ===================================================================== */}
      {activeTab === 'skema-json' && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-surface border border-stroke/60 shadow-2xs flex items-start gap-3">
            <Database className="w-4 h-4 text-brand shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-ink-secondary leading-relaxed">
              <p className="font-semibold text-ink">
                Skema Kolom Bertipe JSON pada Database Lokal (PostgreSQL + Prisma)
              </p>
              <p>
                Berikut adalah struktur objek JSON standar yang dihasilkan oleh fitur-fitur aplikasi
                lokal sebelum diolah oleh kalkulator IPP maupun ditransformasikan ke dalam payload
                API MenPAN-RB.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {LOCAL_JSON_SCHEMAS.map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-surface border border-stroke/60 shadow-2xs overflow-hidden">
                <div className="px-5 py-3.5 bg-surface-subtle/70 border-b border-stroke/50 flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ink">{item.title}</span>
                      <Badge variant="neutral" size="sm">
                        {item.endpoint}
                      </Badge>
                    </div>
                    <p className="text-xs text-ink-secondary">{item.description}</p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCopyJson(item.id, item.json)}
                    leftIcon={
                      copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-ink-muted" />
                      )
                    }>
                    {copiedId === item.id ? 'Tersalin' : 'Salin JSON'}
                  </Button>
                </div>
                <pre className="p-4 bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
                  <code>{JSON.stringify(item.json, null, 2)}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: MAPPING API MENPAN-RB
      ===================================================================== */}
      {activeTab === 'mapping-api' && (
        <div className="space-y-6">
          {/* Header Standar Protokol */}
          <div className="p-5 rounded-xl bg-surface border border-stroke/60 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand" />
                  Standar Protokol &amp; Header HTTP Resmi (OpenAPI 3.0.3 MenPAN-RB)
                </h3>
                <p className="text-xs text-ink-secondary">
                  Seluruh komunikasi HTTP di <code>MenpanApiService</code> wajib menyertakan header
                  autentikasi Bearer Token (Sanctum) dan negosiasi konten JSON:
                </p>
              </div>
              <Badge variant="success" size="sm">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Spec v3.0.3 Terverifikasi
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-surface-subtle border border-stroke/50">
                <div className="text-[11px] font-semibold text-ink-muted uppercase">
                  Authorization Header
                </div>
                <code className="text-xs font-mono text-ink font-semibold mt-1 block">
                  Bearer {'{SANCTUM_PERSONAL_ACCESS_TOKEN}'}
                </code>
              </div>
              <div className="p-3 rounded-lg bg-surface-subtle border border-stroke/50">
                <div className="text-[11px] font-semibold text-ink-muted uppercase">
                  Content-Type &amp; Accept
                </div>
                <code className="text-xs font-mono text-ink font-semibold mt-1 block">
                  application/json
                </code>
              </div>
              <div className="p-3 rounded-lg bg-surface-subtle border border-stroke/50">
                <div className="text-[11px] font-semibold text-ink-muted uppercase">
                  Timeout &amp; Penanganan Antrean
                </div>
                <code className="text-xs font-mono text-ink font-semibold mt-1 block">
                  HTTP 202 Accepted (Queued) / 422 Validation
                </code>
              </div>
            </div>
          </div>

          {/* VISUAL PIPELINE 3 KOLOM: DARI SKOR LOKAL -> KAMUS TRANSLASI -> PAYLOAD MENPAN */}
          <div className="p-5 rounded-xl bg-surface border border-stroke/60 shadow-2xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-brand" />
                  Visualisasi Pipeline Translasi JSON (Lokal &rarr; Kamus Auto-Mapper &rarr; Payload
                  MenPAN-RB)
                </h3>
                <p className="text-xs text-ink-secondary">
                  Perbandingan langsung bagaimana struktur JSON di database lokal kita diterjemahkan
                  menggunakan kamus pertanyaan MenPAN-RB menjadi payload pengiriman resmi.
                </p>
              </div>
              <Badge variant="info" size="sm">
                Transformasi 3 Langkah
              </Badge>
            </div>

            {/* 3 Kolom JSON Berdampingan */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
              {/* Kolom 1: JSON Database Lokal */}
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 overflow-hidden flex flex-col justify-between">
                <div className="p-3.5 border-b border-blue-500/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/15 text-blue-700">
                      1. SUMBER DATA LOKAL (PRISMA)
                    </span>
                    <span className="text-[10px] font-mono text-ink-muted">EvaluationScore[]</span>
                  </div>
                  <div className="text-xs font-bold text-ink">
                    Skor Evaluator &amp; Nomor Indikator Baku (1..31)
                  </div>
                  <p className="text-[11px] text-ink-secondary">
                    Disimpan dengan nomor urut <code>indicatorNumber: 1..31</code> dan nilai angka{' '}
                    <code>score: 0..5</code>.
                  </p>
                </div>
                <pre className="p-3.5 bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed flex-1">
                  <code>{`{
  "evaluationId": "eval-dukcapil-2026",
  "menpanEvaluationId": "9b1deb4d-3b7d...",
  "scores": [
    {
      "indicator": {
        "indicatorNumber": 1,
        "code": "1.a.SP"
      },
      "score": 5.0
    },
    {
      "indicator": {
        "indicatorNumber": 2,
        "code": "2.b.FKP"
      },
      "score": 5.0
    }
  ]
}`}</code>
                </pre>
              </div>

              {/* Kolom 2: JSON Kamus Pertanyaan MenPAN */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden flex flex-col justify-between">
                <div className="p-3.5 border-b border-amber-500/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/15 text-amber-700">
                      2. KAMUS TRANSLASI (QUESTION MAP)
                    </span>
                    <span className="text-[10px] font-mono text-ink-muted">
                      GET .../form/questions
                    </span>
                  </div>
                  <div className="text-xs font-bold text-ink">
                    Cache Peta Soal MenPAN (syncLogs.questionMap)
                  </div>
                  <p className="text-[11px] text-ink-secondary">
                    Menghubungkan <code>index: 1..31</code> dengan <code>id</code> database MenPAN
                    serta aturan <code>option_type</code>.
                  </p>
                </div>
                <pre className="p-3.5 bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed flex-1">
                  <code>{`[
  {
    "id": 1041,
    "index": 1,
    "option_type": "radio",
    "options": [
      { "id": 5001, "bobot": 0 },
      { "id": 5006, "bobot": 5 }
    ]
  },
  {
    "id": 1042,
    "index": 2,
    "option_type": "checkbox",
    "options": [
      { "id": 5007, "bobot": 3 },
      { "id": 5008, "bobot": 5 }
    ]
  },
  {
    "id": 1072,
    "index": 32,
    "name": "Tautan Bukti Dukung Aspek I",
    "option_type": "text",
    "options": []
  }
]`}</code>
                </pre>
              </div>

              {/* Kolom 3: JSON Output Final MenPAN */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 overflow-hidden flex flex-col justify-between">
                <div className="p-3.5 border-b border-emerald-500/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-700">
                      3. PAYLOAD FINAL MENPAN-RB
                    </span>
                    <span className="text-[10px] font-mono text-ink-muted">POST .../answers</span>
                  </div>
                  <div className="text-xs font-bold text-ink">
                    Body JSON yang Dikirim ke Portal Nasional
                  </div>
                  <p className="text-[11px] text-ink-secondary">
                    Key memakai <code>id</code> MenPAN (<code>&quot;1041&quot;</code>) &amp; value
                    mengikuti <code>option_type</code>.
                  </p>
                </div>
                <pre className="p-3.5 bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed flex-1">
                  <code>{`{
  "answers": {
    "1041": "5",
    "1042": ["5"],
    "1072": "https://.../shared/evidence/eval-dukcapil-2026/I"
  }
}

/*
  Bedah Hasil Translasi:
  - Indikator #1 (score: 5.0) + index: 1
    -> id: "1041", radio -> "5"
  - Indikator #2 (score: 5.0) + index: 2
    -> id: "1042", checkbox -> ["5"]
  - Soal Tautan Bukti (option_type: "text")
    -> id: "1072" -> Link Gabungan Bukti Aspek I
*/`}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* BEDAH DETAIL 4 TAHAP SINKRONISASI BESERTA STRUKTUR JSON TIAP TAHAP */}
          <div className="p-5 rounded-xl bg-surface border border-stroke/60 shadow-2xs space-y-5">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Code2 className="w-4 h-4 text-brand" />
                Bedah 4 Tahap Siklus Sinkronisasi beserta Struktur JSON Input &amp; Output
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Berikut adalah rincian setiap tahapan sinkronisasi dari pengikatan lokus hingga
                pengiriman jawaban beserta struktur JSON riil yang dipertukarkan.
              </p>
              <div className="p-3 rounded-lg bg-brand/5 border border-brand/20 text-xs text-ink-secondary">
                <strong className="text-brand">Catatan UI Aplikasi (/admin/periode/[year]):</strong>{' '}
                Di dalam aplikasi kita, <strong>Tahap 1 dan Tahap 2 dieksekusi sebagai 1 kesatuan otomatis</strong>{' '}
                pada modal <em>&quot;Rekonsiliasi Lokus MenPAN-RB&quot;</em>. Saat modal dibuka,
                sistem menarik daftar lokus (Tahap 1), dan begitu tombol{' '}
                <strong>Simpan Rekonsiliasi</strong> diklik, sistem otomatis menyimpan ikatan{' '}
                <code>uuid</code> lokus <strong>sekaligus</strong> menarik &amp; menyimpan kamus
                pertanyaan (<code>syncLogs.questionMap</code>) di latar belakang (Tahap 2).
              </div>
            </div>

            <div className="space-y-4">
              {/* Tahap 1 */}
              <div className="rounded-xl border border-stroke/60 bg-surface-subtle/40 overflow-hidden">
                <div className="px-4 py-3 bg-surface-subtle border-b border-stroke/50 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand/10 text-brand">
                      TAHAP 1 (MODAL REKONSILIASI — BAGIAN A)
                    </span>
                    <span className="text-xs font-bold text-ink">
                      Sync &amp; Rekonsiliasi Lokus (Mengikat UUID MenPAN-RB ke Unit Lokal)
                    </span>
                  </div>
                  <code className="text-[11px] font-mono text-emerald-700 font-semibold">
                    GET /evaluations?year=2026&amp;per_page=100
                  </code>
                </div>
                <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-ink-muted uppercase">
                      Respons JSON dari Server MenPAN-RB:
                    </div>
                    <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed">
                      <code>{`{
  "data": [
    {
      "id": 88210,
      "uuid": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "name": "Dinas Kependudukan dan Pencatatan Sipil",
      "year": "2026",
      "status": "Sedang Diisi",
      "is_priority": true,
      "form_sheet": {
        "id": 12,
        "name": "Formulir Penilaian PEKPPP Mandiri 2026"
      }
    }
  ]
}`}</code>
                    </pre>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-ink-muted uppercase">
                      Data yang Disimpan ke Tabel Lokal Evaluation (Prisma):
                    </div>
                    <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed">
                      <code>{`// Update pada model Evaluation lokal:
{
  "id": "eval-dukcapil-2026",
  "year": 2026,
  "unitId": "unit-dukcapil",
  "menpanEvaluationId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "menpanEvaluationName": "Dinas Kependudukan dan Pencatatan Sipil",
  "menpanFormSheetName": "Formulir Penilaian PEKPPP Mandiri 2026",
  "isPriority": true
}`}</code>
                    </pre>
                  </div>
                </div>
              </div>

              {/* Tahap 2 */}
              <div className="rounded-xl border border-stroke/60 bg-surface-subtle/40 overflow-hidden">
                <div className="px-4 py-3 bg-surface-subtle border-b border-stroke/50 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand/10 text-brand">
                      TAHAP 2 (MODAL REKONSILIASI — BAGIAN B OTOMATIS)
                    </span>
                    <span className="text-xs font-bold text-ink">
                      Akuisisi Kamus Pertanyaan (Otomatis Saat Klik &quot;Simpan Rekonsiliasi&quot;)
                    </span>
                  </div>
                  <code className="text-[11px] font-mono text-emerald-700 font-semibold">
                    GET /evaluations/{'{uuid}'}/form/questions
                  </code>
                </div>
                <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-ink-muted uppercase">
                      Respons JSON Pertanyaan dari Server MenPAN-RB:
                    </div>
                    <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed">
                      <code>{`{
  "data": [
    {
      "id": 1041,
      "index": 1,
      "name": "Apakah tersedia Standar Pelayanan (SP)...",
      "bobot": 17,
      "is_required": true,
      "option_type": "radio",
      "options": [
        { "id": 5001, "bobot": 0, "index": 1, "text": "Skala 0" },
        { "id": 5006, "bobot": 5, "index": 6, "text": "Skala 5" }
      ]
    }
  ]
}`}</code>
                    </pre>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-ink-muted uppercase">
                      Cache JSON yang Disimpan di Evaluation.syncLogs:
                    </div>
                    <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed">
                      <code>{`// Evaluation.syncLogs (Tidak mengubah tabel Indicator lokal!)
{
  "action": "AUTO_BATCH_LINK",
  "uuid": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "questionsCount": 31,
  "questionMap": [
    {
      "id": 1041,        // <-- Dipakai sebagai key saat POST /answers
      "index": 1,        // <-- Dicocokkan dgn Indicator.indicatorNumber
      "option_type": "radio",
      "options": [
        { "id": 5001, "bobot": 0 },
        { "id": 5006, "bobot": 5 }
      ]
    }
  ]
}`}</code>
                    </pre>
                  </div>
                </div>
              </div>

              {/* Tahap 3 */}
              <div className="rounded-xl border border-stroke/60 bg-surface-subtle/40 overflow-hidden">
                <div className="px-4 py-3 bg-surface-subtle border-b border-stroke/50 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand/10 text-brand">
                      TAHAP 3 (MODAL SYNC PER LOKUS — TAB PULL)
                    </span>
                    <span className="text-xs font-bold text-ink">
                      Pemeriksaan Jawaban Eksisting &amp; Deteksi Konflik (Saat Klik Menu &#8942; &rarr; Sync MenPAN-RB)
                    </span>
                  </div>
                  <code className="text-[11px] font-mono text-emerald-700 font-semibold">
                    GET /evaluations/{'{uuid}'}/answers?per_page=500
                  </code>
                </div>
                <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-ink-muted uppercase">
                      Respons JSON Jawaban Eksisting di MenPAN-RB:
                    </div>
                    <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed">
                      <code>{`{
  "data": [
    {
      "id": 990121,
      "question_id": 1041,
      "value": "4",
      "index": 1,
      "source": "web"
    }
  ]
}`}</code>
                    </pre>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-ink-muted uppercase">
                      Output JSON Deteksi Konflik (checkEvaluationConflictAction):
                    </div>
                    <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed">
                      <code>{`{
  "success": true,
  "hasMatchedRemote": true,
  "remoteAnswersCount": 31,
  "hasConflict": true, // Memberi peringatan ke Admin sebelum menimpa
  "localEval": {
    "filledCount": 31,
    "totalIndicators": 31,
    "isQuestionsMapped": true
  }
}`}</code>
                    </pre>
                  </div>
                </div>
              </div>

              {/* Tahap 4 */}
              <div className="rounded-xl border border-stroke/60 bg-surface-subtle/40 overflow-hidden">
                <div className="px-4 py-3 bg-surface-subtle border-b border-stroke/50 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/15 text-amber-700">
                      TAHAP 4 (MODAL SYNC PER LOKUS — TAB PUSH)
                    </span>
                    <span className="text-xs font-bold text-ink">
                      Pengiriman Jawaban Final (Saat Klik &quot;Konfirmasi &amp; Kirim ke MenPAN-RB&quot;)
                    </span>
                  </div>
                  <code className="text-[11px] font-mono text-amber-700 font-semibold">
                    POST /evaluations/{'{uuid}'}/answers
                  </code>
                </div>
                <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-ink-muted uppercase">
                      Request Body JSON yang Dikirim Aplikasi Kita:
                    </div>
                    <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed">
                      <code>{`{
  "answers": {
    "1041": "5",
    "1042": ["5"],
    "1043": "4",
    "1044": "5",
    "...": "... (lengkap 31 question_id)"
  }
}`}</code>
                    </pre>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-ink-muted uppercase">
                      Respons HTTP 202 MenPAN-RB &amp; Audit Log Lokal:
                    </div>
                    <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed">
                      <code>{`// Respons MenPAN-RB (HTTP 202 Accepted):
{
  "message": "Jawaban berhasil diterima dan sedang diproses.",
  "data": { "status": "queued" }
}

// Update Evaluation di Database Lokal:
{
  "syncStatus": "SYNCED",
  "syncedAt": "2026-05-01T14:20:00.000Z"
}`}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Penjelasan Teknis: Mengapa Menarik GET /form/questions Padahal 31 Indikator Lokal Sudah Baku */}
          <div className="p-5 rounded-xl bg-surface border border-stroke/60 shadow-2xs space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Info className="w-4 h-4 text-brand" />
                Mengapa Sistem Menarik Daftar Pertanyaan (GET .../form/questions) Padahal 31
                Indikator Lokal Sudah Baku?
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Aplikasi lokal kita <strong>tidak pernah menimpa atau mengganti</strong> 31
                indikator baku di database lokal dengan data dari MenPAN-RB. Penarikan endpoint{' '}
                <code>GET /evaluations/{'{uuid}'}/form/questions</code> berfungsi murni sebagai{' '}
                <strong>&quot;Kamus Penerjemah ID (Auto-Mapper)&quot;</strong> karena 3 aturan
                validasi server MenPAN-RB berikut:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-xl bg-surface-subtle border border-stroke/50 space-y-1.5">
                <div className="text-xs font-bold text-ink">
                  1. ID Primary Key Dinamis di Server MenPAN-RB
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Saat menerima pengiriman jawaban (<code>POST /answers</code>), server MenPAN-RB
                  tidak menerima nomor urut indikator (<code>1..31</code>), melainkan mewajibkan{' '}
                  <strong>ID primary key database internal mereka</strong> (contoh:{' '}
                  <code>&quot;1041&quot;</code>, <code>&quot;1042&quot;</code>) yang dapat berubah
                  antar tahun atau antar <code>form_sheet</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-subtle border border-stroke/50 space-y-1.5">
                <div className="text-xs font-bold text-ink">
                  2. Perbedaan Tipe Nilai (String vs Array)
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Di database lokal kita, seluruh skor disimpan sebagai angka skala <code>0..5</code>
                  . Namun di MenPAN-RB, pertanyaan bertipe <code>option_type: &quot;radio&quot;</code>{' '}
                  wajib dikirim sebagai string <code>&quot;5&quot;</code>, sedangkan tipe{' '}
                  <code>&quot;checkbox&quot;</code> wajib dibungkus array{' '}
                  <code>[&quot;5&quot;]</code> agar tidak ditolak dengan error{' '}
                  <code>HTTP 422</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-subtle border border-stroke/50 space-y-1.5">
                <div className="text-xs font-bold text-ink">
                  3. Pencocokan Bobot Opsi Resmi (options[].bobot)
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Setiap pertanyaan di MenPAN-RB memiliki daftar opsi dengan atribut{' '}
                  <code>bobot</code>. Auto-Mapper mencocokkan skor bulat evaluator lokal dengan{' '}
                  <code>opt.bobot</code> pada kamus pertanyaan untuk menjamin nilai yang dikirim
                  100% terdaftar pada opsi soal tersebut.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3.5 space-y-1.5">
                <div className="text-[11px] font-bold text-rose-700 uppercase">
                  ❌ Ditolak MenPAN-RB (Jika Menggunakan Nomor Indikator Lokal 1..31)
                </div>
                <pre className="p-3 rounded bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto">
                  <code>{`{
  "answers": {
    "1": 5,
    "2": 5
  }
}
// -> HTTP 422 Unprocessable Entity`}</code>
                </pre>
              </div>

              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-1.5">
                <div className="text-[11px] font-bold text-emerald-700 uppercase">
                  ✅ Diterima MenPAN-RB (Hasil Translasi Auto-Mapper via Question Map)
                </div>
                <pre className="p-3 rounded bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto">
                  <code>{`{
  "answers": {
    "1041": "5",
    "1042": ["5"]
  }
}
// -> HTTP 202 Accepted (Queued)`}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Tabel Pemetaan Skema Lokal vs OpenAPI MenPAN-RB */}
          <div className="rounded-xl bg-surface border border-stroke/60 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 bg-surface-subtle/70 border-b border-stroke/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                Tabel Pemetaan Atribut Data Lokal (Prisma) ke Spesifikasi JSON MenPAN-RB
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stroke/60 bg-surface-subtle/40 text-ink-muted">
                    <th className="py-2.5 px-4 font-semibold">Entitas &amp; Field Lokal (Prisma)</th>
                    <th className="py-2.5 px-4 font-semibold">Tipe Lokal</th>
                    <th className="py-2.5 px-4 font-semibold">Atribut JSON MenPAN-RB (spec.json)</th>
                    <th className="py-2.5 px-4 font-semibold">Endpoint Terkait</th>
                    <th className="py-2.5 px-4 font-semibold">Aturan Transformasi / Kompatibilitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke/40 text-ink-secondary">
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-ink font-medium">
                      Evaluation.menpanEvaluationId
                    </td>
                    <td className="py-2.5 px-4">
                      <code>String (UUID)</code>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-brand">data[].uuid</td>
                    <td className="py-2.5 px-4">
                      <code>GET /evaluations</code>
                    </td>
                    <td className="py-2.5 px-4">
                      Menjadi parameter path <code>{'{uuid}'}</code> pada seluruh endpoint detail,
                      pertanyaan, dan pengiriman jawaban.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-ink font-medium">Evaluation.year</td>
                    <td className="py-2.5 px-4">
                      <code>Int (2026)</code>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-brand">data[].year</td>
                    <td className="py-2.5 px-4">
                      <code>GET /evaluations?year=</code>
                    </td>
                    <td className="py-2.5 px-4">
                      Dikirim sebagai query filter tahun; respons MenPAN berupa string tahun{' '}
                      <code>&quot;2026&quot;</code>.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-ink font-medium">
                      Evaluation.isPriority
                    </td>
                    <td className="py-2.5 px-4">
                      <code>Boolean</code>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-brand">data[].is_priority</td>
                    <td className="py-2.5 px-4">
                      <code>GET /evaluations</code>
                    </td>
                    <td className="py-2.5 px-4">
                      Disinkronkan otomatis saat rekonsiliasi lokus dari portal nasional.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-ink font-medium">
                      Indicator.indicatorNumber
                    </td>
                    <td className="py-2.5 px-4">
                      <code>Int (1..31)</code>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-brand">data[].index</td>
                    <td className="py-2.5 px-4">
                      <code>GET .../form/questions</code>
                    </td>
                    <td className="py-2.5 px-4">
                      Kunci pencocokan urutan indikator lokal (1 s.d. 31) terhadap indeks soal
                      MenPAN-RB untuk mendapatkan <code>question.id</code>.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-ink font-medium">
                      Indicator.indicatorWeight
                    </td>
                    <td className="py-2.5 px-4">
                      <code>Float</code>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-brand">data[].bobot</td>
                    <td className="py-2.5 px-4">
                      <code>GET .../form/questions</code>
                    </td>
                    <td className="py-2.5 px-4">
                      Bobot pertanyaan pada lembar kerja evaluasi MenPAN-RB.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-ink font-medium">
                      EvaluationScore.score
                    </td>
                    <td className="py-2.5 px-4">
                      <code>Float (0..5)</code>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-brand">
                      answers[&quot;{'{question_id}'}&quot;]
                    </td>
                    <td className="py-2.5 px-4">
                      <code>POST .../answers</code>
                    </td>
                    <td className="py-2.5 px-4">
                      Dibulatkan (<code>Math.round</code>), dicocokkan dengan{' '}
                      <code>options[].bobot</code>, lalu dikonversi menjadi string{' '}
                      <code>&quot;0&quot;..&quot;5&quot;</code> atau array string{' '}
                      <code>[&quot;5&quot;]</code> jika <code>option_type === &quot;checkbox&quot;</code>.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-ink font-medium">
                      /shared/evidence/{'{evaluationId}'}/{'{aspectCode}'}
                    </td>
                    <td className="py-2.5 px-4">
                      <code>URL Gabungan Aspek</code>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-brand">
                      answers[&quot;{'{question_id}'}&quot;]
                    </td>
                    <td className="py-2.5 px-4">
                      <code>POST .../answers</code>
                    </td>
                    <td className="py-2.5 px-4">
                      Jika terdapat butir pertanyaan di MenPAN-RB bertipe{' '}
                      <code>option_type: &quot;text&quot; | &quot;url&quot;</code> (tanpa opsi skor),
                      sistem otomatis mengisinya dengan URL halaman gabungan bukti dukung aspek
                      terkait (Aspek <code>I</code> s.d. <code>VI</code>).
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-ink font-medium">
                      Evaluation.syncStatus
                    </td>
                    <td className="py-2.5 px-4">
                      <code>Enum SyncStatus</code>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-brand">data.status (&quot;queued&quot;)</td>
                    <td className="py-2.5 px-4">
                      <code>POST .../answers</code>
                    </td>
                    <td className="py-2.5 px-4">
                      Jika respons HTTP <code>202 Accepted</code>, status lokal menjadi{' '}
                      <code>SYNCED</code>; jika HTTP <code>422</code> atau gagal jaringan, menjadi{' '}
                      <code>FAILED</code>.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: PAYLOAD API INTERAKTIF (REQUEST & RESPONSE)
      ===================================================================== */}
      {activeTab === 'payload-api' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Sidebar Daftar Endpoint */}
          <div className="lg:col-span-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-ink-muted px-1">
              Pilih Endpoint / Skenario Payload
            </div>
            {MENPAN_API_PAYLOADS.map((item) => {
              const isSelected = item.id === selectedPayloadId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handlePayloadSelect(item.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all space-y-1.5 ${
                    isSelected
                      ? 'bg-surface border-brand shadow-xs'
                      : 'bg-surface/60 border-stroke/50 hover:bg-surface hover:border-stroke'
                  }`}>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.method === 'POST'
                          ? 'bg-amber-500/15 text-amber-700'
                          : 'bg-emerald-500/15 text-emerald-700'
                      }`}>
                      {item.method}
                    </span>
                    {item.statusBadge && (
                      <span className="text-[10px] font-mono font-semibold text-ink-muted">
                        {item.statusBadge}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-ink leading-snug">{item.title}</div>
                  <div className="text-[11px] font-mono text-ink-muted truncate">
                    {item.endpoint}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Panel Detail JSON */}
          <div className="lg:col-span-8">
            <div className="rounded-xl bg-surface border border-stroke/60 shadow-2xs overflow-hidden sticky top-6">
              <div className="p-5 bg-surface-subtle/70 border-b border-stroke/50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
                        activeCatalogItem.method === 'POST'
                          ? 'bg-amber-500/15 text-amber-700'
                          : 'bg-emerald-500/15 text-emerald-700'
                      }`}>
                      {activeCatalogItem.method}
                    </span>
                    <code className="text-xs font-mono font-semibold text-ink bg-surface px-2.5 py-1 rounded-md border border-stroke/50">
                      {activeCatalogItem.endpoint}
                    </code>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCopyJson(activeCatalogItem.id, activeCatalogItem.json)}
                    leftIcon={
                      copiedId === activeCatalogItem.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-ink-muted" />
                      )
                    }>
                    {copiedId === activeCatalogItem.id ? 'Tersalin' : 'Salin Payload JSON'}
                  </Button>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-ink">{activeCatalogItem.title}</h3>
                  <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                    {activeCatalogItem.description}
                  </p>
                </div>
              </div>

              <pre className="p-5 bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed max-h-[540px]">
                <code>{JSON.stringify(activeCatalogItem.json, null, 2)}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
