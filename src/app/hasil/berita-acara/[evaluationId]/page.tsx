import { db } from '../../../../services/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer, ShieldAlert, Award, FileText, ClipboardList } from 'lucide-react'
import { calculatePekpppScore } from '../../../../core/domain/pekppp-calculator'
import { PrintButton } from '../../../../components/ui/PrintButton'

export const revalidate = 0

export default async function BeritaAcaraPage({
  params
}: {
  params: Promise<{ evaluationId: string }>
}) {
  const resolvedParams = await params
  const evaluation = await db.evaluation.findUnique({
    where: { id: resolvedParams.evaluationId },
    include: {
      unit: { include: { category: true } },
      scores: {
        include: {
          indicator: {
            include: { aspect: true }
          }
        },
        orderBy: { indicator: { indicatorNumber: 'asc' } }
      }
    }
  })

  if (!evaluation) {
    notFound()
  }

  // Calculate scores dynamically to display aspect breakdowns
  const calculationInputs = evaluation.scores.map((s) => ({
    indicatorNumber: s.indicator.indicatorNumber,
    aspectCode: s.indicator.aspect.code,
    score: s.score,
    maxScore: s.indicator.maxScore,
    aspectWeight: s.indicator.aspect.aspectWeight,
    indicatorWeight: s.indicator.indicatorWeight,
    isSupplementary: s.indicator.isSupplementary
  }))

  const calculation = calculatePekpppScore(calculationInputs)

  // Group notes by Aspect
  const notesByAspect: Record<string, Array<{ indicatorNumber: number; question: string; score: number | null; notes: string | null }>> = {}
  
  evaluation.scores.forEach((s) => {
    const aspectName = s.indicator.aspect.name
    if (!notesByAspect[aspectName]) {
      notesByAspect[aspectName] = []
    }
    notesByAspect[aspectName].push({
      indicatorNumber: s.indicator.indicatorNumber,
      question: s.indicator.question,
      score: s.score,
      notes: s.notes
    })
  })

  const f02Pct = calculation.totalPercentage
  const f03Pct = evaluation.f03Percentage || 0
  const hasF03 = (evaluation.f03Count || 0) > 0
  const finalPct = hasF03 ? 0.75 * f02Pct + 0.25 * f03Pct : f02Pct
  const finalScale5 = (finalPct / 100) * 5

  const grade = finalPct >= 90 ? 'A' : finalPct >= 75 ? 'B' : finalPct >= 60 ? 'C' : finalPct >= 45 ? 'D' : 'E'
  const predicate = grade === 'A' ? 'Sangat Baik' : grade === 'B' ? 'Baik' : grade === 'C' ? 'Cukup' : grade === 'D' ? 'Kurang' : 'Sangat Kurang'

  // Extract last date of evaluator assessment
  const lastAssessmentDate = evaluation.scores
    .filter(s => s.score !== null)
    .reduce((latest, current) => {
      return current.updatedAt > latest ? current.updatedAt : latest
    }, evaluation.updatedAt)

  function formatIndoDate(date: Date) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const dayName = days[date.getDay()]
    const day = date.getDate()
    const monthName = months[date.getMonth()]
    const year = date.getFullYear()
    return `${dayName}, ${day} ${monthName} ${year}`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* CSS Override for Clean Printing Layout */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide global outer Next.js layouts, navbars, sidebars, headers, floating components */
          body * {
            visibility: hidden !important;
          }
          #print-area, #print-area * {
            visibility: visible !important;
          }
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}} />

      {/* Navigation Bar (Hidden on print) */}
      <div className="flex items-center justify-between border-b border-[#e8e8e8] pb-4 print:hidden">
        <Link
          href="/hasil"
          className="inline-flex items-center gap-1.5 text-xs text-[#646464] hover:text-[#202020] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Hasil Evaluasi
        </Link>
        <PrintButton />
      </div>

      {/* Main Minutes Paper (Isolated Print Area) */}
      <div id="print-area" className="bg-white border border-[#e8e8e8] rounded-[16px] p-8 sm:p-12 shadow-md space-y-8 print:border-none print:shadow-none print:p-0">

        {/* Title */}
        <div className="text-center">
          <h2 className="text-lg font-black text-[#090c1d] uppercase tracking-wide">
            BERITA ACARA PENILAIAN {evaluation.isFinished ? 'FINAL (SELESAI)' : 'SEMENTARA'}
          </h2>
        </div>

        {/* Intro */}
        <p className="text-xs text-[#202020] leading-relaxed">
          Pada tanggal <strong>{formatIndoDate(lastAssessmentDate)}</strong>, Tim Evaluator PEKPPP Kabupaten Kutai Barat telah menyelesaikan pemantauan dan evaluasi penilaian {evaluation.isFinished ? 'final (telah ditandai selesai)' : 'sementara'} terhadap kinerja penyelenggara pelayanan publik pada unit kerja di bawah ini:
        </p>

        {/* Identity Table */}
        <table className="w-full text-xs border border-[#e8e8e8] rounded-[8px] overflow-hidden">
          <tbody>
            <tr className="border-b border-[#e8e8e8]">
              <td className="w-1/3 bg-[#f8f9fa] px-4 py-2.5 font-bold text-[#646464]">Nama Unit / Lokus</td>
              <td className="px-4 py-2.5 font-bold text-[#090c1d]">{evaluation.unit.name}</td>
            </tr>
            <tr className="border-b border-[#e8e8e8]">
              <td className="bg-[#f8f9fa] px-4 py-2.5 font-bold text-[#646464]">Kategori Pelayanan</td>
              <td className="px-4 py-2.5 text-[#202020]">{evaluation.unit.category?.name || '-'}</td>
            </tr>
            <tr className="border-b border-[#e8e8e8]">
              <td className="bg-[#f8f9fa] px-4 py-2.5 font-bold text-[#646464]">Tahun Penilaian</td>
              <td className="px-4 py-2.5 text-[#202020] font-mono">{evaluation.year}</td>
            </tr>
            <tr className="border-b border-[#e8e8e8]">
              <td className="bg-[#f8f9fa] px-4 py-2.5 font-bold text-[#646464]">Status Penilaian</td>
              <td className="px-4 py-2.5 font-bold">
                {evaluation.isFinished ? (
                  <span className="text-emerald-700 font-bold uppercase tracking-wider text-xs">
                    ✓ SELESAI
                  </span>
                ) : (
                  <span className="text-amber-700 font-bold uppercase tracking-wider text-xs">
                    DALAM PROSES / SEMENTARA
                  </span>
                )}
              </td>
            </tr>
            <tr className="border-b border-[#e8e8e8]">
              <td className="bg-[#f8f9fa] px-4 py-2.5 font-bold text-[#646464]">Rincian Instrumen PEKPPP</td>
              <td className="px-4 py-2.5 text-[#202020]">
                F-02 Evaluator (75%): <strong>{f02Pct.toFixed(2)}%</strong> | F-03 Survei Responden (25%): <strong>{hasF03 ? `${f03Pct.toFixed(2)}% (${evaluation.f03Count} resp)` : 'Belum Terisi'}</strong>
              </td>
            </tr>
            <tr className="border-b border-[#e8e8e8]">
              <td className="bg-[#f8f9fa] px-4 py-2.5 font-bold text-[#646464]">Indeks Pelayanan Publik (IPP) Final</td>
              <td className="px-4 py-2.5 text-slate-900 font-bold text-sm">
                {finalPct.toFixed(2)}% (Skala 5: {finalScale5.toFixed(2)})
              </td>
            </tr>
            <tr>
              <td className="bg-[#f8f9fa] px-4 py-2.5 font-bold text-[#646464]">Grade & Predikat</td>
              <td className="px-4 py-2.5 text-[#202020]">
                <span className="font-bold text-sm text-[#090c1d]">{grade}</span> - {predicate}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Aspect Breakdown Summary */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#090c1d] border-b border-[#e8e8e8] pb-1.5">
            1. Rincian Capaian per Aspek Penilaian
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(calculation.aspectResults).map(([code, res]) => (
              <div key={code} className="p-3 bg-[#f8f9fa] border border-[#e8e8e8] rounded-[8px]">
                <span className="text-[9px] font-mono uppercase text-[#838383] block truncate">
                  {code}
                </span>
                <span className="text-xs font-bold text-[#202020] block mt-0.5">
                  {res.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed per Question Section */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#090c1d] border-b border-[#e8e8e8] pb-1.5">
            2. Rincian Penilaian & Catatan Evaluator per Pertanyaan
          </h3>

          <div className="border border-[#e8e8e8] rounded-[8px] overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#f8f9fa] border-b border-[#e8e8e8] text-[10px] font-mono uppercase tracking-[0.06em] text-[#838383]">
                <tr>
                  <th className="px-3 py-2 text-center w-[50px]">No</th>
                  <th className="px-3 py-2">Pertanyaan</th>
                  <th className="px-3 py-2 text-center w-[70px]">Skor</th>
                  <th className="px-3 py-2">Catatan Evaluator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e8e8]">
                {evaluation.scores.map((s) => (
                  <tr key={s.id} className="hover:bg-[#f8f9fa]/50">
                    <td className="px-3 py-2.5 text-center font-bold text-[#646464]">{s.indicator.indicatorNumber}</td>
                    <td className="px-3 py-2.5 text-[#202020] font-medium leading-relaxed">{s.indicator.question}</td>
                    <td className="px-3 py-2.5 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${s.score !== null ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                        {s.score ?? '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[#646464] italic leading-normal">
                      {s.notes && s.notes.trim() !== '' ? s.notes : <span className="text-[#b3b3b3]">Tidak ada catatan</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signature Box */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-xs">
          <div className="text-center space-y-12">
            <div>Perwakilan Unit Kerja / OPD,</div>
            <div className="space-y-0.5">
              <div className="font-bold border-b border-dashed border-[#646464] inline-block px-12 pb-0.5"></div>
              <div className="text-[#838383] text-[10px]">NIP. </div>
            </div>
          </div>

          <div className="text-center space-y-12">
            <div>Tim Evaluator Pemda,</div>
            <div className="space-y-0.5">
              <div className="font-bold border-b border-dashed border-[#646464] inline-block px-12 pb-0.5"></div>
              <div className="text-[#838383] text-[10px]">NIP. </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
