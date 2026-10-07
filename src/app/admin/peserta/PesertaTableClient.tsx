'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ClipboardList, ArrowRight, Trash2, Send, CheckCircle2, AlertTriangle } from 'lucide-react'
import { deleteEvaluationAction } from '../../../actions/evaluation-actions'
import { toast } from 'sonner'
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal'
import { MenpanSyncModal } from '../../../components/features/MenpanSyncModal'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { DataTable } from '../../../components/ui/DataTable'

export interface EnrolledEvaluationItem {
  id: string
  unitId: string
  year: number
  isFinished?: boolean
  syncStatus?: 'IDLE' | 'VALIDATING' | 'SYNCED' | 'FAILED' | null
  syncedAt?: Date | null
  unit: {
    name: string
    category?: { name: string } | null
  }
  scores: Array<{ score: number | null }>
}

export default function PesertaTableClient({
  enrolledEvaluations,
  targetYear
}: {
  enrolledEvaluations: EnrolledEvaluationItem[]
  targetYear: number
}) {
  const [deletingEv, setDeletingEv] = useState<EnrolledEvaluationItem | null>(null)
  const [syncEv, setSyncEv] = useState<EnrolledEvaluationItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleOpenDelete = (ev: EnrolledEvaluationItem) => {
    setDeletingEv(ev)
    setIsModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingEv) return
    setLoading(true)
    try {
      const res = await deleteEvaluationAction(deletingEv.id)
      if (res.success) {
        toast.success(`Unit "${deletingEv.unit.name}" berhasil dikeluarkan dari periode ${targetYear}!`)
        setIsModalOpen(false)
        setDeletingEv(null)
        window.location.reload()
      } else {
        toast.error(res.error || 'Gagal mengeluarkan peserta.')
      }
    } catch {
      toast.error('Terjadi kesalahan sistem saat mengeluarkan peserta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DataTable
        headerTitle={`PESERTA TERDAFTAR - ${targetYear}`}
        headerMeta={
          <Badge variant="neutral" size="sm">
            {enrolledEvaluations.length} lokus
          </Badge>
        }
        isEmpty={enrolledEvaluations.length === 0}
        emptyMessage={`Belum ada lokus yang terdaftar untuk tahun ${targetYear}.`}>
        <div className="divide-y divide-line">
          {/* Table Header */}
          <div className="grid grid-cols-12 px-6 py-3 text-[11px] font-medium text-ink-muted bg-surface-subtle/30 border-b border-stroke/40">
            <div className="col-span-3">Lokus</div>
            <div className="col-span-2 text-center">Kategori</div>
            <div className="col-span-2 text-center">Progress F02</div>
            <div className="col-span-2 text-center">Status Sync MenPAN</div>
            <div className="col-span-3 text-right">Aksi</div>
          </div>

          {enrolledEvaluations.map((ev) => {
            const filled = ev.scores.filter((s) => s.score !== null).length
            const total = 31
            const pct = Math.round((filled / total) * 100)

            return (
              <div key={ev.id} className="grid grid-cols-12 px-6 py-3 items-center hover:bg-surface-subtle/40 transition-colors gap-2">
                <div className="col-span-3 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="font-medium text-xs text-ink truncate" title={ev.unit.name}>{ev.unit.name}</div>
                    {ev.isFinished && (
                      <Badge variant="success" size="sm" dot>
                        Selesai
                      </Badge>
                    )}
                  </div>
                  <div className="text-[10px] text-ink-muted">ID: {ev.id.slice(0, 8)}…</div>
                </div>

                <div className="col-span-2 text-center">
                  <Badge variant="neutral" size="sm" className="max-w-full truncate" title={ev.unit.category?.name || 'OPD'}>
                    {ev.unit.category?.name || 'OPD'}
                  </Badge>
                </div>

                <div className="col-span-2 text-center">
                  <div className="text-xs font-medium text-ink tabular-nums">{filled}/{total}</div>
                  <div className="w-24 mx-auto h-1.5 bg-surface-subtle rounded-full mt-1.5 overflow-hidden border border-stroke/40">
                    <div
                      className="h-full bg-brand rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Sync Status Badge */}
                <div className="col-span-2 text-center">
                  {ev.syncStatus === 'SYNCED' ? (
                    <Badge variant="success" size="sm" dot>
                      Tersinkron
                    </Badge>
                  ) : ev.syncStatus === 'FAILED' ? (
                    <Badge variant="danger" size="sm" dot>
                      Gagal Sync
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      Belum Sync
                    </Badge>
                  )}
                </div>

                <div className="col-span-3 flex items-center justify-end gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setSyncEv(ev)}
                    title="Sinkronkan data evaluasi ke server MenPAN-RB"
                    leftIcon={<Send className="w-3 h-3 text-ink-muted" />}>
                    Sync
                  </Button>

                  <Link href={`/evaluasi/${ev.unitId}`}>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<ClipboardList className="w-3.5 h-3.5" />}
                      rightIcon={<ArrowRight className="w-3 h-3" />}>
                      Evaluasi
                    </Button>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleOpenDelete(ev)}
                    className="p-1.5 rounded-xl border border-pastel-rose-border text-pastel-rose-text hover:bg-pastel-rose transition-colors cursor-pointer shrink-0"
                    title="Keluarkan dari Tahun Penilaian ini">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </DataTable>

      {/* MenPAN Sync Modal */}
      {syncEv && (
        <MenpanSyncModal
          isOpen={Boolean(syncEv)}
          onClose={() => setSyncEv(null)}
          evaluationId={syncEv.id}
          unitName={syncEv.unit.name}
          year={targetYear}
        />
      )}

      {/* Confirmation Modal for Removing Participant */}
      <ConfirmationModal
        isOpen={isModalOpen}
        title={`Keluarkan "${deletingEv?.unit.name}"?`}
        description={`Mengeluarkan unit lokus ini akan menghapus keikutsertaan peserta dari Tahun Penilaian ${targetYear}. Data skor pada tahun ini akan terhapus.`}
        confirmText="Ya, Keluarkan Peserta"
        cancelText="Batal"
        variant="danger"
        loading={loading}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsModalOpen(false)
          setDeletingEv(null)
        }}
      />
    </>
  )
}
