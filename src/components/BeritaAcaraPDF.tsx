/* eslint-disable react-refresh/only-export-components */
// src/components/BeritaAcaraPDF.tsx
// Requires: npm install @react-pdf/renderer

import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface RawRow {
  opd_id: number
  opd_name: string
  section: string
  kode_indikator: string
  nama_indikator: string
  nilai: number | null
  keterangan: string
  sumber_data: string
  nilai_maks: number
  nilai_skala5: number | null
}

interface OpdSummary {
  opd_name: string
  kategori: 'OPD' | 'Puskesmas' | 'Kecamatan'
  total: number
  maks: number
  persen: number
  skala5: number // ← nilai dalam skala 0–5 dari data Excel
  bySection: Record<string, { total: number; maks: number }>
  rows: RawRow[]
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION METADATA
// ─────────────────────────────────────────────────────────────────────────────
const SECTION_LABEL: Record<string, string> = {
  'KEBIJAKAN PELAYANAN': 'Kebijakan Pelayanan',
  'PROFESIONALISME SDM': 'Profesionalisme SDM',
  'SARANA PRASARANA': 'Sarana Prasarana',
  'SISTEM INFORMASI PELAYANAN PUBLIK': 'Sistem Informasi Pelayanan Publik',
  'KONSULTASI DAN PENGADUAN': 'Konsultasi dan Pengaduan',
  'INOVASI PELAYANAN PUBLIK': 'Inovasi Pelayanan Publik'
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const F = 10
const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: F,
    paddingTop: 40,
    paddingBottom: 55,
    paddingHorizontal: 45,
    color: '#111111'
  },

  // ── Judul ──
  docTitle: {
    fontSize: F + 2,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 3
  },
  docSubTitle: {
    fontSize: F,
    textAlign: 'center',
    marginBottom: 10
  },
  divider: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
    marginBottom: 10
  },

  // ── Info unit ──
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4
  },
  infoLabel: {
    width: 100,
    fontFamily: 'Helvetica-Bold',
    fontSize: F
  },
  infoColon: { width: 12, fontSize: F },
  infoValue: { flex: 1, fontSize: F },

  // ── Intro teks ──
  introText: {
    marginBottom: 10,
    lineHeight: 1.5,
    textAlign: 'justify',
    fontSize: F
  },

  // ── Ringkasan skor (4 kotak) ──
  summaryBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 12
  },
  summaryCell: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000'
  },
  summaryCellLast: {
    flex: 1,
    padding: 8,
    alignItems: 'center'
  },
  summaryLabel: {
    fontSize: 8,
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 3,
    textAlign: 'center'
  },
  summaryValue: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center'
  },
  summaryUnit: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center'
  },
  // Highlight untuk sel Skala 5
  summaryCellHighlight: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000',
    backgroundColor: '#EBF5FB'
  },

  // ── Tabel ──
  table: {
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 14
  },

  // Header row
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#1F4E79'
  },
  thNo: { width: 30, padding: 5, borderRightWidth: 1, borderRightColor: 'rgba(0,0,0,0.3)' },
  thAspek: { width: 130, padding: 5, borderRightWidth: 1, borderRightColor: 'rgba(0,0,0,0.3)' },
  thNilai: { width: 100, padding: 5, borderRightWidth: 1, borderRightColor: 'rgba(0,0,0,0.3)' },
  thRekom: { flex: 1, padding: 5 },
  thText: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: F, textAlign: 'center' },

  // Section sub-header
  sectionHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#D6E4F0',
    borderTopWidth: 1,
    borderTopColor: '#000'
  },
  sectionHeaderLeft: { flex: 1, padding: 5 },
  sectionHeaderRight: { width: 100, padding: 5, borderLeftWidth: 1, borderLeftColor: '#000' },
  sectionText: { fontFamily: 'Helvetica-Bold', fontSize: F, textTransform: 'uppercase', color: '#1F4E79' },
  sectionScore: { fontFamily: 'Helvetica-Bold', fontSize: F, color: '#1F4E79', textAlign: 'right' },

  // Data rows
  dataRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#ddd' },
  dataRowAlt: { backgroundColor: '#F5F9FF' },
  tdNo: { width: 30, padding: 5, borderRightWidth: 1, borderRightColor: '#000', alignItems: 'center' },
  tdAspek: { width: 130, padding: 5, borderRightWidth: 1, borderRightColor: '#000' },
  tdNilai: { width: 100, padding: 5, borderRightWidth: 1, borderRightColor: '#000', alignItems: 'center' },
  tdRekom: { flex: 1, padding: 5 },

  cellNo: { fontSize: F, textAlign: 'center', color: '#555' },
  cellAspek: { fontSize: F, lineHeight: 1.4 },
  cellKode: { fontSize: F, fontFamily: 'Helvetica-Bold', color: '#1F4E79' },
  cellNilai: { fontSize: F + 1, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  cellRekom: { fontSize: F, lineHeight: 1.5, textAlign: 'justify' },
  cellEmpty: { fontSize: F, color: '#aaa', fontStyle: 'italic' },

  // ── Penutup ──
  penutupText: {
    fontSize: F,
    lineHeight: 1.5,
    textAlign: 'justify',
    marginTop: 4
  },

  // ── Footer ──
  footerNote: {
    position: 'absolute',
    bottom: 36,
    left: 45,
    right: 45,
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
    paddingTop: 4,
    fontSize: 7,
    color: '#999',
    textAlign: 'center'
  },
  pageNumber: {
    position: 'absolute',
    bottom: 22,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 7,
    color: '#999'
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function nilaiColor(nilai: number | null): string {
  if (nilai === null) return '#9ca3af'
  if (nilai >= 4) return '#16a34a'
  if (nilai >= 2) return '#d97706'
  return '#dc2626'
}

function scoreColor(persen: number): string {
  if (persen >= 80) return '#16a34a'
  if (persen >= 60) return '#d97706'
  if (persen >= 40) return '#f59e0b'
  return '#dc2626'
}

function getTodayString(): string {
  return new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF DOCUMENT
// ─────────────────────────────────────────────────────────────────────────────
function BeritaAcaraDocument({ opd }: { opd: OpdSummary }) {
  const today = getTodayString()
  const color = scoreColor(opd.persen)

  const grouped = opd.rows.reduce<Record<string, RawRow[]>>((acc, row) => {
    ;(acc[row.section] ??= []).push(row)
    return acc
  }, {})

  let sectionCounter = 0

  return (
    <Document
      title={`Berita Acara PEKPPP - ${opd.opd_name}`}
      author="Tim Evaluator PEKPPP"
      subject="Berita Acara Evaluasi Kinerja Penyelenggara Pelayanan Publik">
      <Page size="A4" style={S.page}>
        {/* ── JUDUL ── */}
        <Text style={S.docTitle}>Berita Acara Evaluasi</Text>
        <Text style={S.docSubTitle}>
          Pemantauan dan Evaluasi Kinerja Penyelenggara Pelayanan Publik (PEKPPP) 2026 Kab. Kutai Barat
        </Text>
        <View style={S.divider} />

        {/* ── INFO UNIT ── */}
        <View style={{ marginBottom: 10 }}>
          {(
            [
              ['Nama Unit', opd.opd_name],
              ['Kategori', opd.kategori],
              ['Dicetak Pada', today],
              ['Evaluator', '____________________________']
            ] as [string, string][]
          ).map(([label, val]) => (
            <View key={label} style={S.infoRow}>
              <Text style={S.infoLabel}>{label}</Text>
              <Text style={S.infoColon}>:</Text>
              <Text style={S.infoValue}>{val}</Text>
            </View>
          ))}
        </View>

        {/* ── PARAGRAF PEMBUKA ── */}
        <Text style={S.introText}>
          {
            'Berdasarkan hasil pemantauan dan evaluasi yang telah dilakukan, berikut ini disampaikan rekapitulasi penilaian kinerja pelayanan publik beserta rekomendasi perbaikan untuk unit penyelenggara pelayanan '
          }
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{opd.opd_name}</Text>
          {
            '. Penilaian mengacu pada Formulir F-02 PEKPPP sesuai ketentuan KemenPAN-RB. Nilai akhir akan disampaikan setelah proses validasi dan penetapan hasil selesai. Mohon menjadi perhatian untuk perbaikan ke depan.'
          }
        </Text>

        {/* ── RINGKASAN SKOR (4 kotak: Total, Maks, Persen, Skala 5) ── */}
        <View style={S.summaryBox}>
          <View style={S.summaryCell}>
            <Text style={S.summaryLabel}>Total Nilai</Text>
            <Text style={[S.summaryValue, { color }]}>{opd.total}</Text>
            <Text style={S.summaryUnit}>poin</Text>
          </View>
          <View style={S.summaryCell}>
            <Text style={S.summaryLabel}>Nilai Maksimal</Text>
            <Text style={S.summaryValue}>{opd.maks}</Text>
            <Text style={S.summaryUnit}>poin</Text>
          </View>
          <View style={S.summaryCell}>
            <Text style={S.summaryLabel}>Persentase</Text>
            <Text style={[S.summaryValue, { color }]}>{opd.persen.toFixed(1)}%</Text>
            <Text style={S.summaryUnit}>capaian</Text>
          </View>
          {/* Skala 5 — dibaca dari data Excel, bukan dihitung ulang */}
          <View style={S.summaryCellHighlight}>
            <Text style={[S.summaryLabel, { color: '#1F4E79', fontFamily: 'Helvetica-Bold' }]}>Nilai Skala 5</Text>
            <Text style={[S.summaryValue, { color: '#1F4E79' }]}>{opd.skala5.toFixed(2)}</Text>
            <Text style={[S.summaryUnit, { color: '#1F4E79' }]}>dari 5</Text>
          </View>
        </View>

        {/* ── TABEL ── */}
        <View style={S.table}>
          {/* Header kolom */}
          <View style={S.tableHeaderRow} fixed>
            <View style={S.thNo}>
              <Text style={S.thText}>No.</Text>
            </View>
            <View style={S.thAspek}>
              <Text style={S.thText}>Komponen/Aspek</Text>
            </View>
            <View style={S.thNilai}>
              <Text style={S.thText}>Nilai</Text>
            </View>
            <View style={S.thRekom}>
              <Text style={S.thText}>Rekomendasi Perbaikan</Text>
            </View>
          </View>

          {/* Baris per seksi → per indikator */}
          {Object.entries(grouped).map(([sec, secRows]) => {
            sectionCounter++
            const no = sectionCounter
            const secScore = opd.bySection[sec]
            const secPct = secScore ? (secScore.total / secScore.maks) * 100 : 0
            const rekomendasiRows = secRows.filter((r) => r.keterangan?.trim())

            return (
              <View key={sec}>
                {/* Sub-header seksi */}
                <View style={S.sectionHeaderRow}>
                  <View style={S.sectionHeaderLeft}>
                    <Text style={S.sectionText}>
                      {no}. {SECTION_LABEL[sec] ?? sec}
                    </Text>
                  </View>
                  <View style={S.sectionHeaderRight}>
                    <Text style={S.sectionScore}>
                      {secScore ? `${secScore.total}/${secScore.maks}` : '—'} ({secPct.toFixed(0)}%)
                    </Text>
                  </View>
                </View>

                {/* Satu baris per indikator */}
                {secRows.map((row, i) => {
                  const rekom = rekomendasiRows.find((r) => r.kode_indikator === row.kode_indikator)
                  return (
                    <View key={row.kode_indikator} style={[S.dataRow, i % 2 !== 0 ? S.dataRowAlt : {}]} wrap={false}>
                      <View style={S.tdNo}>
                        <Text style={S.cellNo}>{i + 1}</Text>
                      </View>
                      <View style={S.tdAspek}>
                        <Text style={S.cellKode}>{row.kode_indikator}</Text>
                        <Text style={S.cellAspek}>{row.nama_indikator}</Text>
                      </View>
                      <View style={S.tdNilai}>
                        <Text style={[S.cellNilai, { color: nilaiColor(row.nilai) }]}>
                          {row.nilai !== null ? String(row.nilai) : '—'}
                        </Text>
                      </View>
                      <View style={S.tdRekom}>
                        {rekom ? (
                          <Text style={S.cellRekom}>{rekom.keterangan}</Text>
                        ) : (
                          <Text style={S.cellEmpty}>–</Text>
                        )}
                      </View>
                    </View>
                  )
                })}
              </View>
            )
          })}
        </View>

        {/* ── PENUTUP ── */}
        <Text style={S.penutupText}>
          Demikian Berita Acara ini dibuat untuk dapat dipergunakan sebagaimana mestinya. Hasil penilaian ini bersifat
          sementara dan akan ditetapkan setelah proses validasi selesai.
        </Text>

        {/* ── FOOTER ── */}
        <Text style={S.footerNote} fixed>
          Dokumen ini di-generate secara otomatis oleh Sistem PEKPPP Bagian Organisasi Kabupaten Kutai Barat · {today}
        </Text>
        <Text
          style={S.pageNumber}
          render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export async function downloadBA(opd: OpdSummary): Promise<void> {
  const blob = await pdf(<BeritaAcaraDocument opd={opd} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `BA_PEKPPP_2026_${opd.opd_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default BeritaAcaraDocument
