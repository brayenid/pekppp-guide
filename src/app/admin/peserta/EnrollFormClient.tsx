'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Users, X, Search, Check, Loader2 } from 'lucide-react'
import {
  enrollUnitToYearAction,
  enrollUnitsBulkAction,
  deleteEvaluationsBulkAction
} from '../../../actions/evaluation-actions'
import { toast } from 'sonner'
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'

interface UnitItem {
  id: string
  name: string
  category: { name: string } | null
}

interface EnrolledItem {
  id: string // Evaluation ID
  unitId: string
  unit: {
    name: string
    category?: { name: string } | null
  }
}

export default function EnrollFormClient({
  year,
  allUnits,
  enrolledUnitIds,
  enrolledEvaluations
}: {
  year: number
  allUnits: UnitItem[]
  enrolledUnitIds: string[]
  enrolledEvaluations: EnrolledItem[]
}) {
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [singleLoading, setSingleLoading] = useState(false)

  // Bulk Modal state
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'enroll' | 'delete'>('enroll')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBulkIds, setSelectedBulkIds] = useState<string[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)

  // Filter units not enrolled yet
  const enrolledSet = new Set(enrolledUnitIds)
  const availableUnits = allUnits.filter((u) => !enrolledSet.has(u.id))

  // Determine current dataset based on active tab
  const currentDataset =
    activeTab === 'enroll'
      ? availableUnits.map((u) => ({ id: u.id, name: u.name, category: u.category }))
      : enrolledEvaluations.map((e) => ({ id: e.id, name: e.unit.name, category: e.unit.category }))

  // Filter current dataset by search term
  const filteredDataset = currentDataset.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category?.name || 'OPD').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSingleEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUnitId) return

    setSingleLoading(true)
    try {
      const enrolled = await enrollUnitToYearAction(year, selectedUnitId)
      if (enrolled) {
        toast.success('Lokus berhasil didaftarkan!')
        setSelectedUnitId('')
        window.location.reload()
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mendaftarkan lokus.')
    } finally {
      setSingleLoading(false)
    }
  }

  const handleBulkEnroll = async () => {
    if (selectedBulkIds.length === 0) return
    setBulkLoading(true)
    try {
      const res = await enrollUnitsBulkAction(year, selectedBulkIds)
      if (res.success) {
        toast.success(`Berhasil mendaftarkan ${res.count} lokus!`)
        setIsBulkOpen(false)
        setSelectedBulkIds([])
        window.location.reload()
      } else {
        toast.error(res.error || 'Gagal mendaftarkan lokus massal.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedBulkIds.length === 0) return
    setIsDeleteConfirmOpen(false)
    setBulkLoading(true)
    try {
      const res = await deleteEvaluationsBulkAction(selectedBulkIds)
      if (res.success) {
        toast.success(`Berhasil mengeluarkan ${res.count} lokus peserta!`)
        setIsBulkOpen(false)
        setSelectedBulkIds([])
        window.location.reload()
      } else {
        toast.error(res.error || 'Gagal mengeluarkan peserta secara massal.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleToggleSelectAll = () => {
    if (selectedBulkIds.length === filteredDataset.length) {
      setSelectedBulkIds([])
    } else {
      setSelectedBulkIds(filteredDataset.map((item) => item.id))
    }
  }

  const handleToggleItem = (itemId: string) => {
    setSelectedBulkIds((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]))
  }

  const handleTabChange = (tab: 'enroll' | 'delete') => {
    setActiveTab(tab)
    setSelectedBulkIds([])
    setSearchTerm('')
  }

  return (
    <div className="pt-2">
      {/* Enroll Form */}
      <form onSubmit={handleSingleEnroll} className="flex items-end gap-3 flex-wrap md:flex-nowrap">
        <div className="flex-1 space-y-1.5 min-w-[200px]">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Daftarkan Lokus ke Periode Ini
          </label>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-line text-xs font-medium text-ink focus:outline-none focus:border-ink bg-card cursor-pointer shadow-2xs"
            required
            disabled={singleLoading || bulkLoading}>
            <option value="">- Pilih Lokus -</option>
            {availableUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.category?.name || 'OPD'})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 mt-2 md:mt-0">
          <Button
            type="submit"
            disabled={!selectedUnitId || singleLoading || bulkLoading}
            isLoading={singleLoading}
            leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Daftarkan
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              handleTabChange('enroll')
              setIsBulkOpen(true)
            }}
            disabled={singleLoading || bulkLoading}
            leftIcon={<Users className="w-3.5 h-3.5 text-ink-muted" />}>
            Kelola Massal
          </Button>
        </div>
      </form>

      {/* Bulk Insert & Delete Modal */}
      {isBulkOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-[250] flex items-center justify-center p-4 animate-fade-in-content">
            <div className="bg-card rounded-2xl shadow-subtle max-w-xl w-full overflow-hidden flex flex-col max-h-[85vh] border border-line">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-line">
                <div className="flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-ink" />
                  <h3 className="text-base font-bold text-ink tracking-tight">Kelola Peserta Massal ({year})</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBulkOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-surface-muted text-ink-muted hover:text-ink transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-line px-6 bg-surface-subtle">
                <button
                  type="button"
                  onClick={() => handleTabChange('enroll')}
                  className={`py-3 text-xs font-semibold border-b-2 mr-6 transition-all cursor-pointer ${
                    activeTab === 'enroll'
                      ? 'border-ink text-ink font-bold'
                      : 'border-transparent text-ink-muted hover:text-ink'
                  }`}>
                  + Daftarkan Massal ({availableUnits.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('delete')}
                  className={`py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                    activeTab === 'delete'
                      ? 'border-pastel-rose-text text-pastel-rose-text font-bold'
                      : 'border-transparent text-ink-muted hover:text-ink'
                  }`}>
                  Hapus / Keluarkan Peserta Massal ({enrolledEvaluations.length})
                </button>
              </div>

              {/* Search & Actions Bar */}
              <div className="p-4 border-b border-line space-y-3 bg-card">
                <div className="relative">
                  <Search className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={
                      activeTab === 'enroll'
                        ? 'Cari lokus yang belum terdaftar...'
                        : 'Cari lokus terdaftar yang ingin dikeluarkan...'
                    }
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-line bg-card placeholder:text-ink-faint text-ink focus:outline-none focus:border-ink shadow-2xs"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-ink-secondary hover:text-ink font-semibold flex items-center gap-1.5 cursor-pointer">
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selectedBulkIds.length > 0 && selectedBulkIds.length === filteredDataset.length
                          ? 'bg-ink border-ink text-white'
                          : 'border-line bg-card'
                      }`}>
                      {selectedBulkIds.length > 0 && selectedBulkIds.length === filteredDataset.length && (
                        <Check className="w-3 h-3 stroke-[3]" />
                      )}
                    </span>
                    <span>Pilih Semua ({filteredDataset.length})</span>
                  </button>

                  <span className="text-ink-muted text-[11px]">
                    <strong className="text-ink font-mono">{selectedBulkIds.length}</strong> dipilih
                  </span>
                </div>
              </div>

              {/* Checklist Items Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-line max-h-72">
                {filteredDataset.length === 0 ? (
                  <div className="text-center py-8 text-xs text-ink-muted italic">
                    {searchTerm ? 'Tidak ada lokus yang cocok dengan pencarian.' : 'Tidak ada lokus yang tersedia.'}
                  </div>
                ) : (
                  filteredDataset.map((item) => {
                    const isChecked = selectedBulkIds.includes(item.id)
                    return (
                      <label
                        key={item.id}
                        onClick={() => handleToggleItem(item.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? activeTab === 'enroll'
                              ? 'bg-surface-muted border-ink font-semibold'
                              : 'bg-pastel-rose border-pastel-rose-border font-semibold'
                            : 'bg-card border-line hover:bg-surface-subtle text-ink-secondary'
                        }`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className={`rounded w-4 h-4 ${activeTab === 'enroll' ? 'accent-ink' : 'accent-rose-600'}`}
                          />
                          <span className="text-xs text-ink leading-snug">{item.name}</span>
                        </div>
                        <Badge variant="neutral" size="sm">
                          {item.category?.name || 'OPD'}
                        </Badge>
                      </label>
                    )
                  })
                )}
              </div>

              {/* Footer Modal Actions */}
              <div className="px-6 py-4 border-t border-line bg-surface-subtle flex items-center justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsBulkOpen(false)}
                  disabled={bulkLoading}>
                  Batal
                </Button>

                {activeTab === 'enroll' ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleBulkEnroll}
                    disabled={selectedBulkIds.length === 0 || bulkLoading}
                    isLoading={bulkLoading}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}>
                    Daftarkan ({selectedBulkIds.length}) Lokus
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    disabled={selectedBulkIds.length === 0 || bulkLoading}
                    isLoading={bulkLoading}>
                    Keluarkan ({selectedBulkIds.length}) Peserta
                  </Button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Confirmation Modal for Bulk Delete */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        title={`Keluarkan ${selectedBulkIds.length} Peserta Sekaligus?`}
        description={`Tindakan ini akan mengeluarkan ${selectedBulkIds.length} lokus dari Tahun Penilaian ${year}. Seluruh skor isian pada tahun ini akan dihapus.`}
        confirmText="Ya, Keluarkan Semua yang Dipilih"
        cancelText="Batal"
        variant="danger"
        loading={bulkLoading}
        onConfirm={handleBulkDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </div>
  )
}
