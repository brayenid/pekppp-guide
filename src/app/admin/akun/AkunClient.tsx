'use client'

import { useState } from 'react'
import { createProfileAction, bindUnitToProfileAction, unbindUnitFromProfileAction, updateProfileAction, deleteProfileAction, importProfilesAction } from '../../../actions/account-actions'
import { UserCog, Plus, Building2, X, Pencil, Trash2, FileSpreadsheet, Search, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { toast } from 'sonner'
import { FormModal } from '../../../components/ui/FormModal'
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'
import { DataTable } from '../../../components/ui/DataTable'
import * as XLSX from 'xlsx'

export interface ProfileItem {
  id: string
  email: string
  fullName: string
  phone?: string | null
  role: 'SUPER_ADMIN' | 'OPD'
  userUnits: Array<{
    unitId: string
    unit: { id: string; name: string }
  }>
}

export interface UnitSimple {
  id: string
  name: string
}

export default function AkunClient({
  initialProfiles,
  allUnits
}: {
  initialProfiles: ProfileItem[]
  allUnits: UnitSimple[]
}) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'SUPER_ADMIN' | 'OPD'>('OPD')
  const [loading, setLoading] = useState(false)

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SUPER_ADMIN' | 'OPD'>('ALL')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Excel Import states
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importedItems, setImportedItems] = useState<Array<{
    email: string
    password?: string
    fullName: string
    phone?: string
    role: 'SUPER_ADMIN' | 'OPD'
    conflictResolution: 'OVERWRITE' | 'SKIP'
    hasConflict: boolean
  }>>([])

  // Edit states
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<ProfileItem | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editRole, setEditRole] = useState<'SUPER_ADMIN' | 'OPD'>('OPD')

  // Delete states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingProfile, setDeletingProfile] = useState<ProfileItem | null>(null)

  // Modals for CRUD Actions
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false)
  const [bindState, setBindState] = useState<{
    isOpen: boolean
    userId?: string
    unitId?: string
    unitName?: string
    profileName?: string
  }>({ isOpen: false })
  const [unbindState, setUnbindState] = useState<{ isOpen: boolean; userId?: string; unitId?: string; unitName?: string }>(
    { isOpen: false }
  )

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      toast.error('Harap lengkapi seluruh field!')
      return
    }
    setCreateConfirmOpen(true)
  }

  const handleConfirmCreateAccount = async () => {
    setLoading(true)
    try {
      const res = await createProfileAction({
        fullName: fullName.trim(),
        email: email.trim(),
        password: password.trim(),
        phone: phone.trim() || undefined,
        role
      })

      if (res.success) {
        toast.success(`Akun "${fullName}" berhasil dibuat!`)
        setFullName('')
        setEmail('')
        setPassword('')
        setPhone('')
        setIsFormOpen(false)
        window.location.reload()
      } else {
        toast.error(res.error || 'Gagal membuat akun.')
      }
    } catch {
      toast.error('Terjadi kesalahan.')
    } finally {
      setLoading(false)
      setCreateConfirmOpen(false)
    }
  }

  const handleConfirmBind = async () => {
    if (!bindState.userId || !bindState.unitId) return
    setLoading(true)
    try {
      await bindUnitToProfileAction(bindState.userId, bindState.unitId)
      toast.success(`Lokus berhasil ditautkan!`)
      window.location.reload()
    } catch {
      toast.error('Gagal menautkan lokus.')
    } finally {
      setLoading(false)
      setBindState({ isOpen: false })
    }
  }

  const handleConfirmUnbind = async () => {
    if (!unbindState.userId || !unbindState.unitId) return
    setLoading(true)
    try {
      await unbindUnitFromProfileAction(unbindState.userId, unbindState.unitId)
      toast.success(`Tautan lokus dihapus.`)
      window.location.reload()
    } catch {
      toast.error('Gagal melepaskan lokus.')
    } finally {
      setLoading(false)
      setUnbindState({ isOpen: false })
    }
  }

  const handleEditClick = (profile: ProfileItem) => {
    setEditingProfile(profile)
    setEditFullName(profile.fullName)
    setEditEmail(profile.email)
    setEditPassword('')
    setEditPhone(profile.phone || '')
    setEditRole(profile.role)
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProfile || !editFullName.trim() || !editEmail.trim()) {
      toast.error('Nama Lengkap dan Email wajib diisi!')
      return
    }

    setLoading(true)
    try {
      const res = await updateProfileAction(editingProfile.id, {
        fullName: editFullName.trim(),
        email: editEmail.trim(),
        password: editPassword.trim() || undefined,
        phone: editPhone.trim() || undefined,
        role: editRole
      })

      if (res.success) {
        toast.success(`Akun "${editFullName}" berhasil diperbarui!`)
        setIsEditOpen(false)
        setEditingProfile(null)
        window.location.reload()
      } else {
        toast.error(res.error || 'Gagal memperbarui akun.')
      }
    } catch {
      toast.error('Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (profile: ProfileItem) => {
    setDeletingProfile(profile)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingProfile) return
    setLoading(true)
    try {
      const res = await deleteProfileAction(deletingProfile.id)
      if (res.success) {
        toast.success(`Akun "${deletingProfile.fullName}" berhasil dihapus!`)
        setIsDeleteOpen(false)
        setDeletingProfile(null)
        window.location.reload()
      } else {
        toast.error('Gagal menghapus akun.')
      }
    } catch {
      toast.error('Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const data = [
      { 'Nama Lengkap': 'John Doe', 'Email': 'johndoe@kubar.go.id', 'Password': 'password123', 'Role': 'OPD' },
      { 'Nama Lengkap': 'Admin Utama', 'Email': 'admin@kubar.go.id', 'Password': 'password321', 'Role': 'SUPER_ADMIN' }
    ]
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template Akun')
    XLSX.writeFile(wb, 'template_akun.xlsx')
    toast.success('Template Excel berhasil diunduh!')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet)

        const parsed: any[] = []
        for (const row of jsonData) {
          const emailVal = (row['Email'] || row['email'])?.toString().trim()
          const nameVal = (row['Nama Lengkap'] || row['nama lengkap'] || row['Nama'] || row['nama'])?.toString().trim()
          const passVal = (row['Password'] || row['password'])?.toString().trim()
          let roleVal = (row['Role'] || row['role'])?.toString().trim().toUpperCase()

          if (!emailVal || !nameVal) continue
          if (roleVal !== 'SUPER_ADMIN' && roleVal !== 'OPD') {
            roleVal = 'OPD'
          }

          const hasConflict = initialProfiles.some(p => p.email.toLowerCase() === emailVal.toLowerCase())

          parsed.push({
            email: emailVal,
            fullName: nameVal,
            password: passVal || '123456',
            role: roleVal as 'SUPER_ADMIN' | 'OPD',
            conflictResolution: 'SKIP', // default to skip
            hasConflict
          })
        }

        if (parsed.length === 0) {
          toast.error('Tidak ada data akun valid yang ditemukan di file Excel!')
        } else {
          setImportedItems(parsed)
          toast.success(`Berhasil memuat ${parsed.length} akun dari Excel!`)
        }
      } catch {
        toast.error('Gagal membaca file Excel.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const executeImport = async () => {
    if (importedItems.length === 0) return
    setLoading(true)
    try {
      const res = await importProfilesAction(importedItems)
      if (res.success) {
        toast.success(`Impor selesai! Berhasil membuat ${res.createdCount} akun baru, memperbarui ${res.updatedCount} akun, dan mengabaikan ${res.skippedCount} konflik.`)
        setIsImportOpen(false)
        setImportedItems([])
        window.location.reload()
      } else {
        toast.error('Gagal memproses impor.')
      }
    } catch {
      toast.error('Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  const handleConflictChange = (index: number, val: 'OVERWRITE' | 'SKIP') => {
    setImportedItems(prev => prev.map((item, i) => i === index ? { ...item, conflictResolution: val } : item))
  }

  const filteredProfiles = initialProfiles.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || p.role === roleFilter
    return matchesSearch && matchesRole
  })

  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage)
  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <PageHeader
        icon={<UserCog className="w-5 h-5 text-brand" />}
        title="Manajemen Akun"
        description="Kelola akun Super Admin dan OPD. Tautkan (bind) lokus pelayanan ke akun OPD terkait."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={() => setIsFormOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Tambah Akun Baru
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsImportOpen(true)}
              leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-ink-muted" />}>
              Import Excel
            </Button>
          </div>
        }
      />

      {/* Full Width Account List via DataTable */}
      <DataTable
        headerTitle="AKUN PENGGUNA TERDAFTAR"
        headerMeta={
          <Badge variant="neutral" size="sm">
            {searchQuery || roleFilter !== 'ALL'
              ? `${filteredProfiles.length} dari ${initialProfiles.length} akun`
              : `${initialProfiles.length} akun`}
          </Badge>
        }
        headerActions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama atau email akun..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-48 sm:w-64 pl-9 pr-3.5 py-1.5 text-xs rounded-full bg-surface-elevated border border-stroke/60 text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand transition-all shadow-2xs"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as any)
                setCurrentPage(1)
              }}
              className="px-3.5 py-1.5 text-xs rounded-full border border-stroke/60 bg-surface-elevated text-ink font-normal cursor-pointer focus:outline-none focus:border-brand shadow-2xs">
              <option value="ALL">Semua Peran</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="OPD">Perangkat Daerah (OPD)</option>
            </select>
          </div>
        }
        isEmpty={filteredProfiles.length === 0}
        emptyMessage={
          initialProfiles.length === 0
            ? 'Belum ada akun. Klik tombol Tambah Akun di atas.'
            : 'Tidak ada akun yang cocok dengan pencarian atau filter peran.'
        }>
        <div className="divide-y divide-line">
          {paginatedProfiles.map((profile) => (
            <div
              key={profile.id}
              className="px-5 py-3.5 flex items-center justify-between hover:bg-surface-subtle transition-colors">
              {/* User Info */}
              <div className="min-w-0 flex-1 pr-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs text-ink truncate">{profile.fullName}</span>
                  {profile.role === 'SUPER_ADMIN' ? (
                    <span className="inline-flex items-center rounded-full text-[10px] font-semibold px-2 py-0.5 bg-brand-light text-brand border border-brand/30">
                      Super Admin
                    </span>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      Perangkat Daerah
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-1 text-[11px] text-ink-muted">
                  <span>{profile.email}</span>
                  {profile.phone && (
                    <>
                      <span className="text-ink-muted/40">•</span>
                      <span className="font-mono text-emerald-700 font-medium">WA: {profile.phone}</span>
                    </>
                  )}
                  <span className="text-ink-muted/40">•</span>
                  {profile.role === 'SUPER_ADMIN' ? (
                    <span className="italic">Akses global semua lokus</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleEditClick(profile)}
                      className="inline-flex items-center gap-1 text-pastel-blue-text hover:underline cursor-pointer">
                      <Building2 className="w-3 h-3" />
                      <span>{profile.userUnits.length} Lokus Ditautkan</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons styled like Master Lokus */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleEditClick(profile)}
                  className="w-8 h-8 rounded-full border border-stroke/60 bg-white flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors shadow-2xs cursor-pointer"
                  title="Edit Akun">
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteClick(profile)}
                  className="w-8 h-8 rounded-full border border-stroke/60 bg-white flex items-center justify-center text-ink-muted hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-2xs cursor-pointer"
                  title="Hapus Akun">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Paginasi Footer */}
        {filteredProfiles.length > 0 && (
          <div className="px-5 py-3 bg-surface-subtle/30 border-t border-stroke/40 flex items-center justify-between flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-3 text-ink-muted">
              <span>
                Menampilkan <strong className="text-ink">{(currentPage - 1) * itemsPerPage + 1}</strong> -{' '}
                <strong className="text-ink">
                  {Math.min(currentPage * itemsPerPage, filteredProfiles.length)}
                </strong>{' '}
                dari <strong className="text-ink">{filteredProfiles.length}</strong> akun
              </span>

              <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-stroke/40">
                <span>Per halaman:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="px-2 py-0.5 text-xs rounded-md bg-surface-elevated border border-stroke/60 text-ink focus:outline-none focus:border-brand cursor-pointer">
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}>
                Sebelumnya
              </Button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      currentPage === page
                        ? 'bg-brand text-white shadow-2xs font-semibold'
                        : 'text-ink-muted hover:text-ink hover:bg-surface-subtle'
                    }`}>
                    {page}
                  </button>
                ))}
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </DataTable>

      {/* Form Modal for Account Creation */}
      <FormModal
        isOpen={isFormOpen}
        title="Tambah Akun Baru"
        description="Masukkan kredensial pengguna baru (Super Admin atau OPD)."
        onClose={() => setIsFormOpen(false)}>
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ink-secondary">Nama Lengkap</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Budi Santoso"
              className="w-full px-3.5 py-2 rounded-xl border border-stroke/70 bg-surface text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand shadow-2xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ink-secondary">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@kubar.go.id"
              className="w-full px-3.5 py-2 rounded-xl border border-stroke/70 bg-surface text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand shadow-2xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ink-secondary">Password</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-xl border border-stroke/70 bg-surface text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand shadow-2xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ink-secondary">Nomor WhatsApp (Opsional)</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08123456789"
              className="w-full px-3.5 py-2 rounded-xl border border-stroke/70 bg-surface text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand shadow-2xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ink-secondary">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'SUPER_ADMIN' | 'OPD')}
              className="w-full px-3.5 py-2 rounded-xl border border-stroke/70 bg-surface text-xs text-ink focus:outline-none focus:border-brand shadow-2xs cursor-pointer">
              <option value="OPD">OPD</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-stroke/40">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm">
              Lanjut Konfirmasi
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Confirmation Modal — Create */}
      <ConfirmationModal
        isOpen={createConfirmOpen}
        title={`Buat Akun "${fullName}"?`}
        description={`Akun dengan email ${email} dan role ${role} akan ditambahkan ke sistem.`}
        confirmText="Ya, Buat Akun"
        cancelText="Batal"
        loading={loading}
        onConfirm={handleConfirmCreateAccount}
        onCancel={() => setCreateConfirmOpen(false)}
      />

      {/* Confirmation Modal — Bind */}
      <ConfirmationModal
        isOpen={bindState.isOpen}
        title={`Tautkan Lokus?`}
        description={`Akun "${bindState.profileName}" akan ditautkan ke lokus yang dipilih.`}
        confirmText="Ya, Tautkan"
        cancelText="Batal"
        loading={loading}
        onConfirm={handleConfirmBind}
        onCancel={() => setBindState({ isOpen: false })}
      />

      {/* Confirmation Modal — Unbind */}
      <ConfirmationModal
        isOpen={unbindState.isOpen}
        title={`Lepaskan Tautan Lokus "${unbindState.unitName}"?`}
        description="Hak akses pengelolaan lokus ini untuk akun OPD terkait akan dicabut."
        confirmText="Ya, Lepaskan"
        cancelText="Batal"
        variant="danger"
        loading={loading}
        onConfirm={handleConfirmUnbind}
        onCancel={() => setUnbindState({ isOpen: false })}
      />

      {/* Form Modal for Account Edit */}
      <FormModal
        isOpen={isEditOpen}
        title={`Edit Akun "${editingProfile?.fullName}"`}
        description="Perbarui informasi nama, email, password, atau hak akses."
        onClose={() => {
          setIsEditOpen(false)
          setEditingProfile(null)
        }}>
        <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ink-secondary">Nama Lengkap</label>
            <input
              type="text"
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stroke/70 bg-surface text-xs text-ink focus:outline-none focus:border-brand shadow-2xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ink-secondary">Email Login</label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stroke/70 bg-surface text-xs text-ink focus:outline-none focus:border-brand shadow-2xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ink-secondary">Password Baru</label>
            <input
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="Biarkan kosong jika tidak diubah"
              className="w-full px-3.5 py-2 rounded-xl border border-stroke/70 bg-surface text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand shadow-2xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ink-secondary">Nomor WhatsApp (Opsional)</label>
            <input
              type="text"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="08123456789"
              className="w-full px-3.5 py-2 rounded-xl border border-stroke/70 bg-surface text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand shadow-2xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ink-secondary">Role</label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as 'SUPER_ADMIN' | 'OPD')}
              className="w-full px-3.5 py-2 rounded-xl border border-stroke/70 bg-surface text-xs text-ink focus:outline-none focus:border-brand shadow-2xs cursor-pointer">
              <option value="OPD">OPD</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>

          {/* Pengelolaan Lokus Pelayanan */}
          <div className="space-y-2 pt-2 border-t border-stroke/40">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-ink-secondary">
                Lokus Pelayanan Ditautkan
              </label>
              {editRole === 'SUPER_ADMIN' && (
                <span className="text-[10px] text-ink-muted italic">Akses Global</span>
              )}
            </div>

            {editRole === 'SUPER_ADMIN' ? (
              <div className="p-2.5 rounded-xl bg-surface-subtle border border-stroke/50 text-[11px] text-ink-muted">
                Akun berstatus <strong className="text-brand">Super Admin</strong> memiliki hak akses otomatis ke seluruh lokus pelayanan tanpa perlu ditautkan secara manual.
              </div>
            ) : (
              <div className="space-y-2.5">
                {editingProfile && editingProfile.userUnits.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {editingProfile.userUnits.map((uu) => (
                      <span
                        key={uu.unitId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-subtle text-ink text-xs border border-stroke/50 group">
                        <Building2 className="w-3 h-3 text-ink-muted shrink-0" />
                        <span className="max-w-[200px] truncate">{uu.unit.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setUnbindState({
                              isOpen: true,
                              userId: editingProfile.id,
                              unitId: uu.unitId,
                              unitName: uu.unit.name
                            })
                          }
                          className="text-ink-muted hover:text-rose-600 hover:bg-rose-50 rounded p-0.5 transition-colors cursor-pointer"
                          title="Lepaskan tautan lokus">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ink-muted italic">Belum ada lokus yang ditautkan ke akun ini.</p>
                )}

                {/* Dropdown Tambah Binding */}
                {editingProfile && (
                  <div>
                    <select
                      onChange={(e) => {
                        const selectedUnit = allUnits.find((u) => u.id === e.target.value)
                        if (selectedUnit) {
                          setBindState({
                            isOpen: true,
                            userId: editingProfile.id,
                            unitId: selectedUnit.id,
                            unitName: selectedUnit.name,
                            profileName: editingProfile.fullName
                          })
                        }
                        e.target.value = ''
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-dashed border-stroke/80 text-ink-secondary hover:text-ink focus:outline-none focus:border-brand bg-surface cursor-pointer shadow-2xs">
                      <option value="">+ Tautkan Lokus Baru ke Akun Ini...</option>
                      {allUnits
                        .filter((u) => !editingProfile.userUnits.some((uu) => uu.unitId === u.id))
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-stroke/40">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsEditOpen(false)
                setEditingProfile(null)
              }}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              isLoading={loading}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Confirmation Modal — Delete */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        title={`Hapus Akun "${deletingProfile?.fullName}"?`}
        description={`Akun dengan email ${deletingProfile?.email} akan dihapus secara permanen dari sistem.`}
        confirmText="Ya, Hapus Akun"
        cancelText="Batal"
        variant="danger"
        loading={loading}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteOpen(false)
          setDeletingProfile(null)
        }}
      />

      {/* Excel Import Modal */}
      <FormModal
        isOpen={isImportOpen}
        title="Impor Akun dari Excel"
        description="Unduh template, lengkapi datanya, lalu unggah berkas Excel Anda."
        onClose={() => {
          setIsImportOpen(false)
          setImportedItems([])
        }}>
        <div className="space-y-4 pt-2">
          {/* Download Template Step */}
          <div className="p-3.5 bg-surface-subtle rounded-2xl border border-stroke/40 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-ink">Format Template Excel</div>
              <div className="text-[10px] text-ink-muted">Gunakan kolom: Nama Lengkap, Email, Password, Role</div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={downloadTemplate}>
              Download Template
            </Button>
          </div>

          {/* Upload File Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ink-secondary">Pilih Berkas Excel (.xlsx)</label>
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileUpload}
              className="w-full text-xs text-ink-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[11px] file:font-medium file:bg-surface-subtle file:text-ink hover:file:bg-surface-hover cursor-pointer"
            />
          </div>

          {/* Preview & Conflict Resolution */}
          {importedItems.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-ink-secondary">
                Preview Data & Resolusi Konflik ({importedItems.length} akun)
              </div>
              <div className="max-h-[220px] overflow-y-auto border border-stroke/50 rounded-xl divide-y divide-stroke/30 text-xs">
                {importedItems.map((item, idx) => (
                  <div key={idx} className="p-2.5 flex items-start justify-between gap-3 bg-surface">
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-medium text-ink truncate">{item.fullName}</div>
                      <div className="text-[11px] text-ink-muted truncate">{item.email}</div>
                      <div className="text-[10px] text-ink-muted">
                        Role: <span className="font-medium text-ink">{item.role}</span> | Pass: <span>{item.password}</span>
                      </div>
                    </div>

                    {item.hasConflict ? (
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge variant="warning" size="sm">
                          Email Bentrok
                        </Badge>
                        <select
                          value={item.conflictResolution}
                          onChange={(e) => handleConflictChange(idx, e.target.value as 'OVERWRITE' | 'SKIP')}
                          className="px-2.5 py-1 rounded-full border border-stroke/60 text-[10px] text-ink-secondary bg-surface focus:outline-none focus:border-brand">
                          <option value="SKIP">Abaikan (Skip)</option>
                          <option value="OVERWRITE">Perbarui (Overwrite)</option>
                        </select>
                      </div>
                    ) : (
                      <Badge variant="success" size="sm">
                        Akun Baru
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-3 flex justify-end gap-2 border-t border-stroke/40">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsImportOpen(false)
                setImportedItems([])
              }}>
              Batal
            </Button>
            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={executeImport}
              disabled={loading || importedItems.length === 0}
              isLoading={loading}>
              Mulai Impor
            </Button>
          </div>
        </div>
      </FormModal>
    </div>
  )
}
