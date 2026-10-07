'use client'

import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  createUnitAction,
  updateUnitAction,
  deleteUnitAction,
  createUnitsBulkAction,
  deleteUnitsBulkAction,
  updateUnitsBulkAction
} from '../../../actions/unit-actions'
import { Building2, Plus, Folder, ExternalLink, Pencil, Trash2, Users, X, Search, Check, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { FormModal } from '../../../components/ui/FormModal'
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal'
import { PageHeader } from '../../../components/ui/PageHeader'
import { DataTable } from '../../../components/ui/DataTable'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'

export interface Category {
  id: string
  name: string
}

export interface UnitItem {
  id: string
  name: string
  driveFolderUrl?: string | null
  category?: Category | null
}

export default function LokusClient({
  initialUnits,
  categories
}: {
  initialUnits: UnitItem[]
  categories: Category[]
}) {
  // Create State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [driveUrl, setDriveUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Edit State
  const [editingUnit, setEditingUnit] = useState<UnitItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [editDriveUrl, setEditDriveUrl] = useState('')
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)

  // Delete State
  const [deletingUnit, setDeletingUnit] = useState<UnitItem | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Bulk Modal State
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [bulkTab, setBulkTab] = useState<'insert' | 'edit' | 'delete'>('insert')

  // Bulk Edit state: track per-row edits as a Map { id -> { name, categoryId } }
  const [editDrafts, setEditDrafts] = useState<Record<string, { name: string; categoryId: string }>>({})
  const [editSearchTerm, setEditSearchTerm] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  // Bulk Insert state
  const [bulkText, setBulkText] = useState('')
  const [bulkCategoryId, setBulkCategoryId] = useState('')

  // Bulk Delete state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false)

  // Parse textarea lines for insert preview
  const bulkEntries = useMemo(
    () =>
      bulkText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    [bulkText]
  )

  // Table Search & Filter State
  const [tableSearchTerm, setTableSearchTerm] = useState('')
  const [tableCategoryFilter, setTableCategoryFilter] = useState('ALL')

  // Filtered units for main table display
  const filteredTableUnits = useMemo(() => {
    return initialUnits.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
        (u.category?.name || 'OPD').toLowerCase().includes(tableSearchTerm.toLowerCase())
      const matchesCat = tableCategoryFilter === 'ALL' || u.category?.id === tableCategoryFilter
      return matchesSearch && matchesCat
    })
  }, [initialUnits, tableSearchTerm, tableCategoryFilter])

  // Filtered units for bulk delete checklist
  const filteredUnits = useMemo(
    () =>
      initialUnits.filter(
        (u) =>
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (u.category?.name || 'OPD').toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [initialUnits, searchTerm]
  )

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Nama unit wajib diisi!')
      return
    }
    setConfirmOpen(true)
  }

  const handleConfirmCreate = async () => {
    setLoading(true)
    try {
      await createUnitAction({
        name: name.trim(),
        categoryId: categoryId || undefined,
        driveFolderUrl: driveUrl.trim() || undefined
      })
      toast.success(`Unit "${name}" berhasil ditambahkan!`)
      setName('')
      setCategoryId('')
      setDriveUrl('')
      setIsFormOpen(false)
      window.location.reload()
    } catch {
      toast.error('Gagal menambahkan unit lokus.')
    } finally {
      setLoading(false)
      setConfirmOpen(false)
    }
  }

  const openEditModal = (unit: UnitItem) => {
    setEditingUnit(unit)
    setEditName(unit.name)
    setEditCategoryId(unit.category?.id || '')
    setEditDriveUrl(unit.driveFolderUrl || '')
    setIsEditFormOpen(true)
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUnit || !editName.trim()) {
      toast.error('Nama unit wajib diisi!')
      return
    }
    setLoading(true)
    try {
      const res = await updateUnitAction(editingUnit.id, {
        name: editName.trim(),
        categoryId: editCategoryId || undefined,
        driveFolderUrl: editDriveUrl.trim() || undefined
      })
      if (res.success) {
        toast.success(`Master Lokus "${editName}" berhasil diperbarui!`)
        setIsEditFormOpen(false)
        setEditingUnit(null)
        window.location.reload()
      } else {
        toast.error('Gagal memperbarui unit lokus.')
      }
    } catch {
      toast.error('Terjadi kesalahan saat memperbarui unit lokus.')
    } finally {
      setLoading(false)
    }
  }

  const openDeleteModal = (unit: UnitItem) => {
    setDeletingUnit(unit)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingUnit) return
    setLoading(true)
    try {
      const res = await deleteUnitAction(deletingUnit.id)
      if (res.success) {
        toast.success(`Master Lokus "${deletingUnit.name}" berhasil dihapus!`)
        setIsDeleteModalOpen(false)
        setDeletingUnit(null)
        window.location.reload()
      } else {
        toast.error(res.error || 'Gagal menghapus unit lokus.')
      }
    } catch {
      toast.error('Terjadi kesalahan saat menghapus unit lokus.')
    } finally {
      setLoading(false)
    }
  }

  // Bulk Insert handler
  const handleBulkInsert = async () => {
    if (bulkEntries.length === 0) {
      toast.error('Masukkan minimal satu nama lokus!')
      return
    }
    setBulkLoading(true)
    toast.info(`Menambahkan ${bulkEntries.length} lokus secara massal...`)
    try {
      const res = await createUnitsBulkAction(
        bulkEntries.map((name) => ({ name, categoryId: bulkCategoryId || undefined }))
      )
      if (res.success) {
        toast.success(`Berhasil menambahkan ${res.count} master lokus baru!`)
        setIsBulkOpen(false)
        setBulkText('')
        setBulkCategoryId('')
        window.location.reload()
      } else {
        toast.error(res.error || 'Gagal menambahkan lokus secara massal.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.')
    } finally {
      setBulkLoading(false)
    }
  }

  // Bulk Delete handler
  const executeBulkDelete = async () => {
    setIsBulkDeleteConfirmOpen(false)
    setBulkLoading(true)
    toast.info(`Menghapus ${selectedIds.length} lokus secara massal...`)
    try {
      const res = await deleteUnitsBulkAction(selectedIds)
      if (res.success) {
        toast.success(`Berhasil menghapus ${res.count} master lokus!`)
        setIsBulkOpen(false)
        setSelectedIds([])
        window.location.reload()
      } else {
        toast.error(res.error || 'Gagal menghapus lokus secara massal.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredUnits.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredUnits.map((u) => u.id))
    }
  }

  const handleToggleUnit = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  // Bulk Edit handlers
  const initEditDrafts = () => {
    const drafts: Record<string, { name: string; categoryId: string }> = {}
    initialUnits.forEach((u) => {
      drafts[u.id] = { name: u.name, categoryId: u.category?.id || '' }
    })
    setEditDrafts(drafts)
  }

  const dirtyEditIds = useMemo(() =>
    Object.entries(editDrafts).filter(([id, draft]) => {
      const orig = initialUnits.find(u => u.id === id)
      if (!orig) return false
      return draft.name !== orig.name || draft.categoryId !== (orig.category?.id || '')
    }).map(([id]) => id),
    [editDrafts, initialUnits]
  )

  const filteredEditUnits = useMemo(() =>
    initialUnits.filter(u =>
      u.name.toLowerCase().includes(editSearchTerm.toLowerCase()) ||
      (u.category?.name || 'OPD').toLowerCase().includes(editSearchTerm.toLowerCase())
    ),
    [initialUnits, editSearchTerm]
  )

  const handleSaveBulkEdit = async () => {
    if (dirtyEditIds.length === 0) {
      toast.info('Tidak ada perubahan untuk disimpan.')
      return
    }
    setBulkLoading(true)
    toast.info(`Menyimpan ${dirtyEditIds.length} perubahan...`)
    try {
      const entries = dirtyEditIds.map((id) => ({
        id,
        name: editDrafts[id].name,
        categoryId: editDrafts[id].categoryId || undefined
      }))
      const res = await updateUnitsBulkAction(entries)
      if (res.success) {
        toast.success(`Berhasil memperbarui ${res.count} master lokus!`)
        setIsBulkOpen(false)
        setEditDrafts({})
        window.location.reload()
      } else {
        toast.error(res.error || 'Gagal menyimpan perubahan.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleTabChange = (tab: 'insert' | 'edit' | 'delete') => {
    setBulkTab(tab)
    setSearchTerm('')
    setEditSearchTerm('')
    setSelectedIds([])
    setBulkText('')
    if (tab === 'edit') initEditDrafts()
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <PageHeader
        icon={<Building2 className="w-5 h-5 text-ink" />}
        title="Master Lokus"
        description="Daftar unit pelayanan perangkat daerah (reusable across periods). Tambahkan lokus baru atau kelola secara massal."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={() => setIsFormOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Tambah Lokus Baru
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                handleTabChange('insert')
                setIsBulkOpen(true)
              }}
              leftIcon={<Users className="w-3.5 h-3.5 text-ink-muted" />}>
              Kelola Massal
            </Button>
          </div>
        }
      />

      {/* Full Width Unit List via DataTable */}
      <DataTable
        headerTitle="MASTER LOKUS TERDAFTAR"
        headerMeta={
          <Badge variant="neutral" size="sm">
            {tableSearchTerm || tableCategoryFilter !== 'ALL'
              ? `${filteredTableUnits.length} dari ${initialUnits.length} unit`
              : `${initialUnits.length} unit`}
          </Badge>
        }
        headerActions={
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearchTerm}
                onChange={(e) => setTableSearchTerm(e.target.value)}
                placeholder="Cari master lokus..."
                className="w-48 sm:w-64 pl-9 pr-3.5 py-1.5 text-xs rounded-full bg-surface-elevated border border-stroke/60 text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand transition-all shadow-2xs"
              />
            </div>

            <select
              value={tableCategoryFilter}
              onChange={(e) => setTableCategoryFilter(e.target.value)}
              className="px-3.5 py-1.5 text-xs rounded-full border border-stroke/60 bg-surface-elevated text-ink font-normal cursor-pointer focus:outline-none focus:border-brand shadow-2xs">
              <option value="ALL">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        }
        isEmpty={filteredTableUnits.length === 0}
        emptyMessage={
          initialUnits.length === 0
            ? 'Belum ada lokus. Klik tombol Tambah Lokus Baru di atas.'
            : 'Tidak ada lokus yang cocok dengan pencarian atau filter kategori.'
        }>
        <div className="divide-y divide-line">
          {filteredTableUnits.map((u) => (
            <div
              key={u.id}
              className="px-5 py-3.5 flex items-center justify-between hover:bg-surface-subtle transition-colors">
              <div className="min-w-0 flex-1 pr-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-ink truncate">{u.name}</span>
                  <Badge variant="neutral" size="sm">
                    {u.category?.name || 'OPD'}
                  </Badge>
                </div>
                {u.driveFolderUrl && (
                  <a
                    href={u.driveFolderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-pastel-blue-text hover:underline mt-1 font-normal">
                    <Folder className="w-3 h-3" /> Link Drive
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditModal(u)}
                  className="w-8 h-8 rounded-full border border-stroke/60 bg-white flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors shadow-2xs cursor-pointer"
                  title="Edit Master Lokus">
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => openDeleteModal(u)}
                  className="w-8 h-8 rounded-full border border-stroke/60 bg-white flex items-center justify-center text-ink-muted hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-2xs cursor-pointer"
                  title="Hapus Master Lokus">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </DataTable>

      {/* === BULK MODAL === */}
      {isBulkOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-[250] flex items-center justify-center p-4 animate-fade-in-content">
            <div className="bg-card rounded-2xl shadow-subtle max-w-xl w-full overflow-hidden flex flex-col max-h-[85vh] border border-line">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-line">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-ink" />
                  <h3 className="text-base font-bold text-ink tracking-tight">Kelola Master Lokus Massal</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBulkOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-surface-muted text-ink-muted hover:text-ink transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Triple Tab */}
              <div className="px-6 pt-3 bg-card border-b border-line flex gap-4">
                <button
                  type="button"
                  onClick={() => handleTabChange('insert')}
                  className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${bulkTab === 'insert' ? 'border-ink text-ink' : 'border-transparent text-ink-muted hover:text-ink'}`}>
                  Tambah Massal
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('edit')}
                  className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${bulkTab === 'edit' ? 'border-pastel-blue-text text-pastel-blue-text' : 'border-transparent text-ink-muted hover:text-ink'}`}>
                  Edit Massal {dirtyEditIds.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-pastel-blue text-pastel-blue-text text-[10px] font-bold">{dirtyEditIds.length}</span>}
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('delete')}
                  className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${bulkTab === 'delete' ? 'border-pastel-rose-text text-pastel-rose-text' : 'border-transparent text-ink-muted hover:text-ink'}`}>
                  Hapus Massal ({initialUnits.length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">
                {bulkTab === 'insert' ? (
                  <div className="p-6 space-y-4">
                    {/* Bulk Insert: Category selector */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                        Kategori (berlaku untuk semua)
                      </label>
                      <select
                        value={bulkCategoryId}
                        onChange={(e) => setBulkCategoryId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-line text-xs font-medium text-ink focus:outline-none focus:border-ink bg-card cursor-pointer shadow-2xs">
                        <option value="">- Pilih Kategori -</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Bulk Insert: Textarea */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                        Daftar Nama Lokus <span className="font-normal normal-case">(satu nama per baris)</span>
                      </label>
                      <textarea
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        rows={10}
                        placeholder={
                          'Puskesmas Linggang Bigung\nPuskesmas Barong Tongkok\nRSUD Harapan Insan Sendawar\n...'
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-line text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink font-mono resize-none shadow-2xs"
                      />
                      {bulkEntries.length > 0 && (
                        <p className="text-[11px] text-ink-muted">
                          Preview: <strong className="text-ink font-mono">{bulkEntries.length}</strong> lokus akan
                          ditambahkan
                        </p>
                      )}
                    </div>
                  </div>
                ) : bulkTab === 'edit' ? (
                  <>
                    {/* Bulk Edit: Search bar */}
                    <div className="px-6 py-3 border-b border-line bg-surface-subtle flex items-center gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
                        <input
                          type="text"
                          placeholder="Cari lokus untuk diedit..."
                          value={editSearchTerm}
                          onChange={(e) => setEditSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-4 py-1.5 bg-card border border-line rounded-xl text-xs placeholder:text-ink-faint text-ink focus:outline-none focus:border-ink shadow-2xs"
                        />
                      </div>
                      {dirtyEditIds.length > 0 && (
                        <Badge variant="info" size="sm">
                          {dirtyEditIds.length} diubah
                        </Badge>
                      )}
                    </div>

                    {/* Bulk Edit: Inline edit rows */}
                    <div className="divide-y divide-line">
                      {filteredEditUnits.map((u) => {
                        const draft = editDrafts[u.id] || { name: u.name, categoryId: u.category?.id || '' }
                        const isDirty = dirtyEditIds.includes(u.id)
                        return (
                          <div key={u.id} className={`px-6 py-3 flex items-center gap-3 transition-colors ${isDirty ? 'bg-pastel-blue/30' : 'hover:bg-surface-subtle'}`}>
                            {/* Dirty indicator */}
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDirty ? 'bg-sky-500' : 'bg-transparent'}`} />

                            {/* Name input */}
                            <input
                              type="text"
                              value={draft.name}
                              onChange={(e) => setEditDrafts(prev => ({
                                ...prev,
                                [u.id]: { ...draft, name: e.target.value }
                              }))}
                              className={`flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border text-xs font-medium text-ink focus:outline-none focus:border-ink transition-colors ${
                                isDirty ? 'border-pastel-blue-border bg-card' : 'border-line bg-transparent'
                              }`}
                            />

                            {/* Category dropdown */}
                            <select
                              value={draft.categoryId}
                              onChange={(e) => setEditDrafts(prev => ({
                                ...prev,
                                [u.id]: { ...draft, categoryId: e.target.value }
                              }))}
                              className={`w-36 shrink-0 px-2 py-1.5 rounded-lg border text-xs text-ink focus:outline-none focus:border-ink transition-colors cursor-pointer ${
                                isDirty ? 'border-pastel-blue-border bg-card' : 'border-line bg-transparent'
                              }`}>
                              <option value="">- Kategori -</option>
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>

                            {/* Reset button if dirty */}
                            {isDirty && (
                              <button
                                type="button"
                                onClick={() => setEditDrafts(prev => ({
                                  ...prev,
                                  [u.id]: { name: u.name, categoryId: u.category?.id || '' }
                                }))}
                                className="text-ink-muted hover:text-ink transition-colors cursor-pointer shrink-0"
                                title="Batalkan perubahan baris ini">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )
                      })}
                      {filteredEditUnits.length === 0 && (
                        <div className="py-12 text-center text-xs text-ink-muted">Tidak ada lokus yang cocok.</div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Bulk Delete: Search + Select All */}
                    <div className="px-6 py-3 border-b border-line bg-surface-subtle flex items-center gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
                        <input
                          type="text"
                          placeholder="Cari lokus..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-4 py-1.5 bg-card border border-line rounded-xl text-xs placeholder:text-ink-faint text-ink focus:outline-none focus:border-ink shadow-2xs"
                        />
                      </div>
                      {filteredUnits.length > 0 && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleToggleSelectAll}>
                          {selectedIds.length === filteredUnits.length ? 'Batalkan Semua' : 'Pilih Semua'}
                        </Button>
                      )}
                    </div>

                    {/* Bulk Delete: Checklist */}
                    <div className="p-6 divide-y divide-line">
                      {filteredUnits.length > 0 ? (
                        filteredUnits.map((u) => {
                          const isChecked = selectedIds.includes(u.id)
                          return (
                            <div
                              key={u.id}
                              onClick={() => handleToggleUnit(u.id)}
                              className="flex items-center justify-between py-3 px-1 hover:bg-surface-subtle transition-colors cursor-pointer rounded-lg">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="accent-ink w-4 h-4 rounded border-line"
                                />
                                <div className="space-y-0.5">
                                  <p className="text-xs font-semibold text-ink">{u.name}</p>
                                  <Badge variant="neutral" size="sm">
                                    {u.category?.name || 'OPD'}
                                  </Badge>
                                </div>
                              </div>
                              {isChecked && (
                                <Badge variant="danger" size="sm">
                                  Terpilih
                                </Badge>
                              )}
                            </div>
                          )
                        })
                      ) : (
                        <div className="py-12 text-center text-xs text-ink-muted">Tidak ada lokus yang cocok.</div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-surface-subtle border-t border-line flex items-center justify-between">
                {bulkTab === 'insert' ? (
                  <span className="text-[11px] font-mono text-ink-muted">
                    {bulkEntries.length} nama siap ditambahkan
                  </span>
                ) : bulkTab === 'edit' ? (
                  <span className="text-[11px] font-mono text-ink-muted">
                    <strong className="text-pastel-blue-text font-bold">{dirtyEditIds.length}</strong> dari {initialUnits.length} lokus diubah
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-ink-muted">
                    Terpilih: <strong className="text-ink font-bold">{selectedIds.length}</strong> dari {filteredUnits.length} lokus
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsBulkOpen(false)}
                    disabled={bulkLoading}>
                    Batal
                  </Button>
                  {bulkTab === 'insert' ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleBulkInsert}
                      disabled={bulkEntries.length === 0 || bulkLoading}
                      isLoading={bulkLoading}>
                      Tambahkan ({bulkEntries.length})
                    </Button>
                  ) : bulkTab === 'edit' ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleSaveBulkEdit}
                      disabled={dirtyEditIds.length === 0 || bulkLoading}
                      isLoading={bulkLoading}
                      leftIcon={<Save className="w-3.5 h-3.5" />}>
                      Simpan Perubahan ({dirtyEditIds.length})
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => setIsBulkDeleteConfirmOpen(true)}
                      disabled={selectedIds.length === 0 || bulkLoading}
                      isLoading={bulkLoading}>
                      Hapus Massal ({selectedIds.length})
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Form Modal for Creating Lokus */}
      <FormModal
        isOpen={isFormOpen}
        title="Tambah Master Lokus Baru"
        description="Masukkan detail nama unit pelayanan dan kategori."
        onClose={() => setIsFormOpen(false)}>
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Nama Unit / Lokus
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Puskesmas Linggang Bigung"
              className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-card text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink shadow-2xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">Kategori</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-card text-xs text-ink focus:outline-none focus:border-ink shadow-2xs cursor-pointer">
              <option value="">- Pilih Kategori -</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Link Google Drive
            </label>
            <input
              type="url"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-card text-xs font-mono text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink shadow-2xs"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm">
              Simpan Lokus
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Form Modal for Editing Lokus */}
      <FormModal
        isOpen={isEditFormOpen}
        title={`Edit Master Lokus "${editingUnit?.name}"`}
        description="Perbarui detail nama unit pelayanan atau kategori."
        onClose={() => {
          setIsEditFormOpen(false)
          setEditingUnit(null)
        }}>
        <form onSubmit={handleUpdateSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Nama Unit / Lokus
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. Puskesmas Linggang Bigung"
              className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-card text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink shadow-2xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">Kategori</label>
            <select
              value={editCategoryId}
              onChange={(e) => setEditCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-card text-xs text-ink focus:outline-none focus:border-ink shadow-2xs cursor-pointer">
              <option value="">- Pilih Kategori -</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Link Google Drive
            </label>
            <input
              type="url"
              value={editDriveUrl}
              onChange={(e) => setEditDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-card text-xs font-mono text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink shadow-2xs"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsEditFormOpen(false)
                setEditingUnit(null)
              }}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loading}>
              Perbarui Lokus
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Confirmation Modal for Creating single Lokus */}
      <ConfirmationModal
        isOpen={confirmOpen}
        title={`Tambahkan Unit "${name}"?`}
        description="Unit lokus ini akan didaftarkan ke Master Lokus dan dapat digunakan untuk tahun penilaian saat ini dan masa depan."
        confirmText="Ya, Tambahkan"
        cancelText="Batal"
        loading={loading}
        onConfirm={handleConfirmCreate}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Confirmation Modal for Deleting single Lokus */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title={`Hapus Master Lokus "${deletingUnit?.name}"?`}
        description="Menghapus unit lokus ini akan menghapusnya dari Master Lokus. Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus Master Lokus"
        cancelText="Batal"
        variant="danger"
        loading={loading}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false)
          setDeletingUnit(null)
        }}
      />

      {/* Confirmation Modal for Bulk Delete */}
      <ConfirmationModal
        isOpen={isBulkDeleteConfirmOpen}
        title="Hapus Master Lokus Massal?"
        description={`Apakah Anda yakin ingin menghapus ${selectedIds.length} lokus dari Master Lokus? Semua data penilaian yang terkait juga akan ikut terhapus permanen.`}
        confirmText="Ya, Hapus Massal"
        cancelText="Batal"
        variant="danger"
        loading={bulkLoading}
        onConfirm={executeBulkDelete}
        onCancel={() => setIsBulkDeleteConfirmOpen(false)}
      />
    </div>
  )
}
