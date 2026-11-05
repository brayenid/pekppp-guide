'use server'

import { db } from '../services/db'
import { getCurrentUserAction } from './auth-actions'
import { createNotificationHelper } from './notification-actions'
import { revalidatePath } from 'next/cache'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { TicketStatus, TicketPriority } from '@prisma/client'

// Helper generator kode tiket publik unik (misal: TKT-2026-X8B9Q)
function generateTicketCode(): string {
  const year = new Date().getFullYear()
  const randomChars = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5)
  return `TKT-${year}-${randomChars}`
}

export interface TicketAttachment {
  url: string
  fileName: string
  fileSize: number
  fileType: string
}

// ── 1. Create Ticket Action (Mendukung Anonim 1-Arah & Berakun 2-Arah) ────────
export async function createTicketAction(formData: FormData) {
  try {
    const title = (formData.get('title') as string)?.trim()
    const description = (formData.get('description') as string)?.trim()
    const category = (formData.get('category') as string)?.trim() || 'Lainnya'
    const priority = (formData.get('priority') as TicketPriority) || TicketPriority.MEDIUM
    const isAnonymous = formData.get('isAnonymous') === 'true'
    const reporterName = (formData.get('reporterName') as string)?.trim() || null
    const reporterContact = (formData.get('reporterContact') as string)?.trim() || null
    const contactChannel = (formData.get('contactChannel') as string)?.trim() || 'WHATSAPP'
    const allowContact = formData.get('allowContact') !== 'false'
    const targetUnitId = (formData.get('targetUnitId') as string)?.trim() || null

    if (!title || !description) {
      return { success: false, error: 'Judul dan uraian laporan wajib diisi.' }
    }

    const currentUser = await getCurrentUserAction()
    
    // Tentukan kepemilikan akun:
    // Jika user sedang login dan tidak memilih anonim, kaitkan ke akun profile
    const authorId = !isAnonymous && currentUser ? currentUser.id : null
    const finalReporterName = isAnonymous 
      ? (reporterName || 'Warga Anonim')
      : (currentUser?.fullName || reporterName || 'Pengguna Terdaftar')

    // Handle Upload File Lampiran (Opsional)
    const attachments: TicketAttachment[] = []
    const fileEntries = formData.getAll('attachments') as File[]

    if (fileEntries && fileEntries.length > 0) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'tickets')
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      for (const file of fileEntries) {
        if (file && file.size > 0 && file.name) {
          const timestamp = Date.now()
          const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
          const savedFileName = `${timestamp}_${cleanName}`
          const diskPath = path.join(uploadDir, savedFileName)
          
          const bytes = await file.arrayBuffer()
          fs.writeFileSync(diskPath, Buffer.from(bytes))

          attachments.push({
            url: `/uploads/tickets/${savedFileName}`,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type || 'application/octet-stream'
          })
        }
      }
    }

    // Pastikan kode tiket unik
    let ticketCode = generateTicketCode()
    let isCodeTaken = await db.ticket.findUnique({ where: { ticketCode } })
    while (isCodeTaken) {
      ticketCode = generateTicketCode()
      isCodeTaken = await db.ticket.findUnique({ where: { ticketCode } })
    }

    const ticket = await db.ticket.create({
      data: {
        ticketCode,
        title,
        description,
        category,
        priority,
        status: targetUnitId ? TicketStatus.DISPATCHED : TicketStatus.OPEN,
        isAnonymous,
        reporterName: finalReporterName,
        reporterContact,
        contactChannel,
        allowContact,
        authorId,
        targetUnitId: targetUnitId || null,
        dispatchedAt: targetUnitId ? new Date() : null,
        attachments: attachments.length > 0 ? (attachments as any) : null
      },
      include: {
        targetUnit: { select: { id: true, name: true } }
      }
    })

    // ── Notifikasi Otomatis ──────────────────────────────────────────────
    // 1. Notifikasi ke Super Admin
    await createNotificationHelper({
      roleTarget: 'SUPER_ADMIN',
      title: `Tiket Baru: ${ticket.ticketCode}`,
      message: `[${category}] ${title} diajukan oleh ${finalReporterName}.`,
      type: 'TICKET_NEW',
      link: `/admin/tiket/${ticket.id}`
    })

    // 2. Jika ada target lokus spesifik, notifikasi ke OPD terkait
    if (targetUnitId) {
      await createNotificationHelper({
        unitId: targetUnitId,
        roleTarget: 'OPD',
        title: `Tiket Ditujukan ke Unit: ${ticket.ticketCode}`,
        message: `Terdapat laporan [${category}] ditujukan ke unit Anda: ${title}`,
        type: 'TICKET_NEW',
        link: `/opd/tiket/${ticket.id}`
      })
    }

    revalidatePath('/admin/tiket')
    revalidatePath('/opd/tiket')
    revalidatePath('/lapor')

    return {
      success: true,
      ticketCode: ticket.ticketCode,
      ticketId: ticket.id,
      isAnonymous: ticket.isAnonymous
    }
  } catch (err: any) {
    console.error('Error in createTicketAction:', err)
    return { success: false, error: err.message || 'Gagal mengirim tiket laporan.' }
  }
}

// ── 2. Get Public Ticket Status Action (Aman, Tanpa Bocor Privasi) ────────────
export async function getPublicTicketStatusAction(ticketCode: string) {
  try {
    const cleanCode = ticketCode.trim().toUpperCase()
    const ticket = await db.ticket.findUnique({
      where: { ticketCode: cleanCode },
      include: {
        targetUnit: { select: { name: true } },
        messages: {
          where: { isInternal: false },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            senderRole: true,
            senderName: true,
            message: true,
            attachments: true,
            createdAt: true
          }
        }
      }
    })

    if (!ticket) {
      return { success: false, error: 'Tiket tidak ditemukan. Periksa kembali format kode tiket.' }
    }

    // Cek apakah pengguna saat ini adalah pemilik tiket berakun
    const currentUser = await getCurrentUserAction()
    const isOwner = currentUser && ticket.authorId === currentUser.id
    const isStaff = currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'OPD')

    return {
      success: true,
      ticket: {
        id: ticket.id,
        ticketCode: ticket.ticketCode,
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        isAnonymous: ticket.isAnonymous,
        reporterName: ticket.reporterName,
        targetUnitName: ticket.targetUnit?.name || 'Bagian Organisasi Setdakab',
        attachments: ticket.attachments as unknown as TicketAttachment[] | null,
        resolutionNotes: ticket.resolutionNotes,
        resolvedAt: ticket.resolvedAt,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        // Izinkan interaksi chat 2-arah jika berakun atau staf
        canChat: Boolean((!ticket.isAnonymous && isOwner) || isStaff),
        messages: ticket.messages
      }
    }
  } catch (err: any) {
    console.error('Error in getPublicTicketStatusAction:', err)
    return { success: false, error: 'Terjadi gangguan saat mengambil data tiket.' }
  }
}

// ── 3. Get Admin Tickets Action (Super Admin) ─────────────────────────────────
export async function getAdminTicketsAction(params?: {
  page?: number
  limit?: number
  status?: string
  priority?: string
  category?: string
  unitId?: string
  search?: string
}) {
  try {
    const user = await getCurrentUserAction()
    if (!user || user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Akses ditolak.' }
    }

    const page = Math.max(1, params?.page || 1)
    const limit = Math.max(5, Math.min(params?.limit || 15, 100))
    const skip = (page - 1) * limit

    const where: any = {}
    if (params?.status && params.status !== 'ALL') {
      where.status = params.status as TicketStatus
    }
    if (params?.priority && params.priority !== 'ALL') {
      where.priority = params.priority as TicketPriority
    }
    if (params?.category && params.category !== 'ALL') {
      where.category = params.category
    }
    if (params?.unitId && params.unitId !== 'ALL') {
      where.targetUnitId = params.unitId
    }
    if (params?.search && params.search.trim()) {
      const q = params.search.trim()
      where.OR = [
        { ticketCode: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { reporterName: { contains: q, mode: 'insensitive' } }
      ]
    }

    const [items, total] = await Promise.all([
      db.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          targetUnit: { select: { id: true, name: true } },
          author: { select: { id: true, fullName: true, email: true } },
          _count: { select: { messages: true } }
        }
      }),
      db.ticket.count({ where })
    ])

    // Metrik ringkasan tiket
    const [openCount, inProgressCount, dispatchedCount, resolvedCount] = await Promise.all([
      db.ticket.count({ where: { status: TicketStatus.OPEN } }),
      db.ticket.count({ where: { status: TicketStatus.IN_PROGRESS } }),
      db.ticket.count({ where: { status: TicketStatus.DISPATCHED } }),
      db.ticket.count({ where: { status: TicketStatus.RESOLVED } })
    ])

    return {
      success: true,
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        total,
        open: openCount,
        inProgress: inProgressCount,
        dispatched: dispatchedCount,
        resolved: resolvedCount
      }
    }
  } catch (err: any) {
    console.error('Error in getAdminTicketsAction:', err)
    return { success: false, error: 'Gagal memuat daftar tiket admin.' }
  }
}

// ── 4. Get OPD Tickets Action (Unit Lokus) ───────────────────────────────────
export async function getOpdTicketsAction(params?: {
  page?: number
  limit?: number
  status?: string
  priority?: string
  category?: string
  search?: string
}) {
  try {
    const user = await getCurrentUserAction()
    if (!user) {
      return { success: false, error: 'Silakan login terlebih dahulu.' }
    }

    // Ambil unit yang dibinding ke user ini
    const userUnits = await db.userUnit.findMany({
      where: { userId: user.id },
      select: { unitId: true }
    })
    const unitIds = userUnits.map((u) => u.unitId)

    // Base condition: Tiket yang ditujukan ke unit lokus OPD, ATAU tiket yang diajukan oleh akun OPD ini
    const baseConditions: any[] = []
    if (unitIds.length > 0) {
      baseConditions.push({ targetUnitId: { in: unitIds } })
    }
    baseConditions.push({ authorId: user.id })

    const baseWhere: any = baseConditions.length > 1
      ? { OR: baseConditions }
      : baseConditions[0] || {}

    const page = Math.max(1, params?.page || 1)
    const limit = Math.max(5, Math.min(params?.limit || 15, 100))
    const skip = (page - 1) * limit

    const andConditions: any[] = [baseWhere]

    if (params?.status && params.status !== 'ALL') {
      andConditions.push({ status: params.status as TicketStatus })
    }
    if (params?.priority && params.priority !== 'ALL') {
      andConditions.push({ priority: params.priority as TicketPriority })
    }
    if (params?.category && params.category !== 'ALL') {
      andConditions.push({ category: params.category })
    }
    if (params?.search && params.search.trim()) {
      const q = params.search.trim()
      andConditions.push({
        OR: [
          { ticketCode: { contains: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { reporterName: { contains: q, mode: 'insensitive' } }
        ]
      })
    }

    const where: any = andConditions.length > 1 ? { AND: andConditions } : andConditions[0]

    const [items, total] = await Promise.all([
      db.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          targetUnit: { select: { id: true, name: true } },
          author: { select: { id: true, fullName: true, email: true } },
          _count: { select: { messages: true } }
        }
      }),
      db.ticket.count({ where })
    ])

    const [openCount, inProgressCount, dispatchedCount, resolvedCount] = await Promise.all([
      db.ticket.count({ where: { AND: [baseWhere, { status: TicketStatus.OPEN }] } }),
      db.ticket.count({ where: { AND: [baseWhere, { status: TicketStatus.IN_PROGRESS }] } }),
      db.ticket.count({ where: { AND: [baseWhere, { status: TicketStatus.DISPATCHED }] } }),
      db.ticket.count({ where: { AND: [baseWhere, { status: TicketStatus.RESOLVED }] } })
    ])

    return {
      success: true,
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        total,
        open: openCount,
        inProgress: inProgressCount,
        dispatched: dispatchedCount,
        resolved: resolvedCount
      }
    }
  } catch (err: any) {
    console.error('Error in getOpdTicketsAction:', err)
    return { success: false, error: 'Gagal memuat daftar tiket OPD.' }
  }
}

// ── 5. Get Ticket Detail Action ───────────────────────────────────────────────
export async function getTicketDetailAction(ticketId: string) {
  try {
    const user = await getCurrentUserAction()
    const ticket = await db.ticket.findUnique({
      where: { id: ticketId },
      include: {
        targetUnit: { select: { id: true, name: true, code: true } },
        author: { select: { id: true, fullName: true, email: true, phone: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, fullName: true, email: true, role: true } }
          }
        }
      }
    })

    if (!ticket) {
      return { success: false, error: 'Tiket tidak ditemukan.' }
    }

    const isSuperAdmin = user?.role === 'SUPER_ADMIN'
    let isAssignedOpd = false
    if (user?.role === 'OPD' && ticket.targetUnitId) {
      const bound = await db.userUnit.findFirst({
        where: { userId: user.id, unitId: ticket.targetUnitId }
      })
      isAssignedOpd = Boolean(bound)
    }
    const isAuthor = user && ticket.authorId === user.id

    // Validasi izin akses detail
    if (!isSuperAdmin && !isAssignedOpd && !isAuthor) {
      return { success: false, error: 'Anda tidak memiliki hak akses untuk tiket ini.' }
    }

    // Filter pesan internal jika pelapor bukan staf (Super Admin / OPD)
    const canSeeInternal = isSuperAdmin || isAssignedOpd
    const filteredMessages = canSeeInternal
      ? ticket.messages
      : ticket.messages.filter((m) => !m.isInternal)

    return {
      success: true,
      ticket: {
        ...ticket,
        messages: filteredMessages
      },
      permissions: {
        canDispatch: isSuperAdmin,
        canResolve: isSuperAdmin || isAssignedOpd,
        canChat: !ticket.isAnonymous || isSuperAdmin || isAssignedOpd,
        canInternalMemo: canSeeInternal
      }
    }
  } catch (err: any) {
    console.error('Error in getTicketDetailAction:', err)
    return { success: false, error: 'Gagal memuat detail tiket.' }
  }
}

// ── 6. Send Ticket Message Action (Thread 2-Arah & Catatan Internal) ──────────
export async function sendTicketMessageAction(formData: FormData) {
  try {
    const user = await getCurrentUserAction()
    if (!user) {
      return { success: false, error: 'Silakan login terlebih dahulu untuk mengirim tanggapan.' }
    }

    const ticketId = (formData.get('ticketId') as string)?.trim()
    const message = (formData.get('message') as string)?.trim()
    const isInternal = formData.get('isInternal') === 'true'

    if (!ticketId || !message) {
      return { success: false, error: 'Isi tanggapan tidak boleh kosong.' }
    }

    const ticket = await db.ticket.findUnique({
      where: { id: ticketId },
      include: { targetUnit: { select: { id: true, name: true } } }
    })

    if (!ticket) {
      return { success: false, error: 'Tiket tidak ditemukan.' }
    }

    // Anonim tanpa akun strictly 1-way jika dari luar; jika user staff, diperbolehkan menambahkan catatan
    if (ticket.isAnonymous && !isInternal && user.role !== 'SUPER_ADMIN' && user.role !== 'OPD') {
      return { success: false, error: 'Tiket anonim hanya bersifat satu arah.' }
    }

    const newMessage = await db.ticketMessage.create({
      data: {
        ticketId,
        senderId: user.id,
        senderRole: user.role,
        senderName: user.fullName,
        message,
        isInternal
      }
    })

    // Jika bukan catatan rahasia internal, perbarui status menjadi IN_PROGRESS jika masih OPEN
    if (!isInternal && ticket.status === TicketStatus.OPEN) {
      await db.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.IN_PROGRESS }
      })
    } else {
      await db.ticket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() }
      })
    }

    // ── Notifikasi Balasan ──────────────────────────────────────────────
    if (!isInternal) {
      // Jika pengirim adalah staf (Admin/OPD), notifikasi pelapor berakun
      if ((user.role === 'SUPER_ADMIN' || user.role === 'OPD') && ticket.authorId) {
        await createNotificationHelper({
          userId: ticket.authorId,
          title: `Tanggapan Baru Tiket: ${ticket.ticketCode}`,
          message: `${user.fullName} memberikan tanggapan pada laporan Anda.`,
          type: 'TICKET_REPLY',
          link: `/lapor/${ticket.ticketCode}`
        })
      }

      // Jika pengirim adalah pelapor, notifikasi Super Admin dan OPD terkait
      if (ticket.authorId === user.id) {
        await createNotificationHelper({
          roleTarget: 'SUPER_ADMIN',
          title: `Balasan Pelapor: ${ticket.ticketCode}`,
          message: `${user.fullName} membalas tiket: ${ticket.title}`,
          type: 'TICKET_REPLY',
          link: `/admin/tiket/${ticket.id}`
        })
        if (ticket.targetUnitId) {
          await createNotificationHelper({
            unitId: ticket.targetUnitId,
            roleTarget: 'OPD',
            title: `Balasan Pelapor: ${ticket.ticketCode}`,
            message: `${user.fullName} membalas tiket: ${ticket.title}`,
            type: 'TICKET_REPLY',
            link: `/opd/tiket/${ticket.id}`
          })
        }
      }
    }

    revalidatePath(`/admin/tiket/${ticketId}`)
    revalidatePath(`/opd/tiket/${ticketId}`)
    revalidatePath(`/lapor/${ticket.ticketCode}`)

    return { success: true, message: newMessage }
  } catch (err: any) {
    console.error('Error in sendTicketMessageAction:', err)
    return { success: false, error: 'Gagal mengirim pesan tanggapan.' }
  }
}

// ── 7. Dispatch Ticket Action (Super Admin Disposisi ke OPD) ──────────────────
export async function dispatchTicketAction(ticketId: string, targetUnitId: string) {
  try {
    const user = await getCurrentUserAction()
    if (!user || user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Hanya Super Admin yang berhak mendisposisikan tiket.' }
    }

    const unit = await db.unit.findUnique({
      where: { id: targetUnitId },
      select: { id: true, name: true }
    })
    if (!unit) {
      return { success: false, error: 'Unit lokus tujuan tidak ditemukan.' }
    }

    const ticket = await db.ticket.update({
      where: { id: ticketId },
      data: {
        targetUnitId,
        dispatchedAt: new Date(),
        dispatchedById: user.id,
        status: TicketStatus.DISPATCHED
      }
    })

    // Tambahkan catatan log internal bahwa tiket telah didisposisikan
    await db.ticketMessage.create({
      data: {
        ticketId,
        senderId: user.id,
        senderRole: user.role,
        senderName: user.fullName,
        message: `Tiket telah didisposisikan secara resmi ke unit: ${unit.name}`,
        isInternal: true
      }
    })

    // Notifikasi ke Lokus yang ditugaskan
    await createNotificationHelper({
      unitId: targetUnitId,
      roleTarget: 'OPD',
      title: `Disposisi Tiket Baru: ${ticket.ticketCode}`,
      message: `Tiket "${ticket.title}" telah didisposisikan oleh Bagian Organisasi Setdakab.`,
      type: 'TICKET_DISPATCH',
      link: `/opd/tiket/${ticket.id}`
    })

    revalidatePath(`/admin/tiket/${ticketId}`)
    revalidatePath(`/opd/tiket/${ticketId}`)
    revalidatePath('/admin/tiket')
    revalidatePath('/opd/tiket')
    revalidatePath(`/lapor/${ticket.ticketCode}`)

    return { success: true, unitName: unit.name }
  } catch (err: any) {
    console.error('Error in dispatchTicketAction:', err)
    return { success: false, error: 'Gagal mendisposisikan tiket.' }
  }
}

// ── 8. Update Ticket Status Action (Selesaikan / Ubah Status) ─────────────────
export async function updateTicketStatusAction(
  ticketId: string,
  status: TicketStatus,
  resolutionNotes?: string
) {
  try {
    const user = await getCurrentUserAction()
    if (!user) {
      return { success: false, error: 'Silakan login terlebih dahulu.' }
    }

    const ticket = await db.ticket.findUnique({
      where: { id: ticketId },
      include: { targetUnit: { select: { id: true, name: true } } }
    })
    if (!ticket) {
      return { success: false, error: 'Tiket tidak ditemukan.' }
    }

    const isSuperAdmin = user.role === 'SUPER_ADMIN'
    let isAssignedOpd = false
    if (user.role === 'OPD' && ticket.targetUnitId) {
      const bound = await db.userUnit.findFirst({
        where: { userId: user.id, unitId: ticket.targetUnitId }
      })
      isAssignedOpd = Boolean(bound)
    }

    if (!isSuperAdmin && !isAssignedOpd) {
      return { success: false, error: 'Anda tidak memiliki hak mengubah status tiket ini.' }
    }

    const isResolved = status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED

    const updated = await db.ticket.update({
      where: { id: ticketId },
      data: {
        status,
        resolutionNotes: resolutionNotes?.trim() || ticket.resolutionNotes,
        resolvedAt: isResolved ? (ticket.resolvedAt || new Date()) : null
      }
    })

    // Tambahkan catatan perubahan status
    await db.ticketMessage.create({
      data: {
        ticketId,
        senderId: user.id,
        senderRole: user.role,
        senderName: user.fullName,
        message: `Status tiket diperbarui menjadi "${status}".${
          resolutionNotes ? ` Catatan: ${resolutionNotes.trim()}` : ''
        }`,
        isInternal: false
      }
    })

    // Notifikasi ke pelapor jika tiket diselesaikan dan pelapor berakun
    if (isResolved && ticket.authorId) {
      await createNotificationHelper({
        userId: ticket.authorId,
        title: `Laporan Anda Telah Selesai: ${ticket.ticketCode}`,
        message: `Tiket "${ticket.title}" telah ditindaklanjuti dan diselesaikan oleh petugas.`,
        type: 'TICKET_RESOLVED',
        link: `/lapor/${ticket.ticketCode}`
      })
    }

    revalidatePath(`/admin/tiket/${ticketId}`)
    revalidatePath(`/opd/tiket/${ticketId}`)
    revalidatePath('/admin/tiket')
    revalidatePath('/opd/tiket')
    revalidatePath(`/lapor/${ticket.ticketCode}`)

    return { success: true, ticket: updated }
  } catch (err: any) {
    console.error('Error in updateTicketStatusAction:', err)
    return { success: false, error: 'Gagal memperbarui status tiket.' }
  }
}

// ── 9. Get Units Helper untuk Dropdown Formulir Laporan ───────────────────────
export async function getActiveUnitsForTicketAction() {
  try {
    const units = await db.unit.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true, category: { select: { name: true } } },
      orderBy: { name: 'asc' }
    })
    return { success: true, units }
  } catch (err: any) {
    console.error('Error in getActiveUnitsForTicketAction:', err)
    return { success: false, units: [] }
  }
}
