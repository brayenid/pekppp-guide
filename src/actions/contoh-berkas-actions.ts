// src/actions/contoh-berkas-actions.ts
'use server'

import { db } from '../services/db'
import { requireSuperAdmin } from '../services/auth-guard'
import { revalidatePath } from 'next/cache'
import { MediaAssetItem } from './media-actions'

export interface CuratedContohBerkasItem {
  id: string
  mediaAssetId: string
  title: string
  description?: string | null
  category: string
  orderIndex: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  mediaAsset: MediaAssetItem
}

/**
 * Mengambil daftar kurasi Contoh Berkas untuk ditampilkan ke lokus (publik) atau dikelola admin
 */
export async function getContohBerkasListAction(params?: {
  search?: string
  category?: string
  fileType?: string
  aspectFilter?: string
  onlyActive?: boolean
}) {
  try {
    const onlyActive = params?.onlyActive !== false
    const where: any = {}

    if (onlyActive) {
      where.isActive = true
    }

    if (params?.category && params.category !== 'ALL') {
      where.category = params.category
    }

    if (params?.search) {
      const q = params.search.trim()
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
        {
          mediaAsset: {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { fileName: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } }
            ]
          }
        }
      ]
    }

    if (params?.fileType && params.fileType !== 'ALL') {
      where.mediaAsset = {
        ...(where.mediaAsset || {}),
        fileType: params.fileType
      }
    }

    const [items, allCurated] = await Promise.all([
      db.contohBerkas.findMany({
        where,
        include: { mediaAsset: true },
        orderBy: [{ orderIndex: 'asc' }, { createdAt: 'desc' }]
      }),
      db.contohBerkas.findMany({
        where: onlyActive ? { isActive: true } : {},
        include: { mediaAsset: { select: { fileType: true, metadata: true } } }
      })
    ])

    // Filter keterkaitan aspek jika ada
    let finalItems = items as unknown as CuratedContohBerkasItem[]
    if (params?.aspectFilter && params.aspectFilter !== 'ALL') {
      finalItems = finalItems.filter((item) => {
        const meta = (item.mediaAsset?.metadata as any) || {}
        const aspects = Array.isArray(meta.relatedAspects) ? meta.relatedAspects : []
        return aspects.includes(params.aspectFilter!)
      })
    }

    // Hitung aggregasi kategori & format dari berkas yang terkurasi
    const categoryCounts: Record<string, number> = { ALL: allCurated.length }
    const fileTypeCounts: Record<string, number> = { ALL: allCurated.length }

    for (const item of allCurated) {
      if (item.category) {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
      }
      const ft = item.mediaAsset?.fileType
      if (ft) {
        fileTypeCounts[ft] = (fileTypeCounts[ft] || 0) + 1
      }
    }

    return {
      success: true,
      items: finalItems,
      totalCount: finalItems.length,
      categoryCounts,
      fileTypeCounts
    }
  } catch (error: any) {
    console.error('Error fetching contoh berkas list:', error)
    return {
      success: false,
      items: [],
      totalCount: 0,
      categoryCounts: {},
      fileTypeCounts: {},
      error: error.message || 'Gagal memuat katalog contoh berkas.'
    }
  }
}

/**
 * Menambahkan aset dari Media Manager ke halaman kurasi Contoh Berkas
 */
export async function addMediaAssetToContohBerkasAction(params: {
  mediaAssetId: string
  title?: string
  description?: string
  category?: string
}) {
  try {
    await requireSuperAdmin()

    const asset = await db.mediaAsset.findUnique({
      where: { id: params.mediaAssetId }
    })

    if (!asset) {
      return { success: false, error: 'Berkas media tidak ditemukan di pustaka.' }
    }

    // Cek apakah berkas sudah pernah ditambahkan ke kurasi
    const existing = await db.contohBerkas.findFirst({
      where: { mediaAssetId: params.mediaAssetId }
    })

    if (existing) {
      return { success: false, error: 'Berkas ini sudah ada di dalam katalog Contoh Berkas.' }
    }

    // Ambil orderIndex tertinggi
    const lastItem = await db.contohBerkas.findFirst({
      orderBy: { orderIndex: 'desc' }
    })
    const nextOrder = (lastItem?.orderIndex ?? -1) + 1

    const created = await db.contohBerkas.create({
      data: {
        mediaAssetId: asset.id,
        title: params.title?.trim() || asset.title,
        description: params.description?.trim() || asset.description || '',
        category: params.category?.trim() || asset.category || 'Template Dokumen',
        orderIndex: nextOrder,
        isActive: true
      },
      include: { mediaAsset: true }
    })

    revalidatePath('/contoh-berkas')
    revalidatePath('/admin/contoh-berkas')

    return { success: true, item: created as unknown as CuratedContohBerkasItem }
  } catch (error: any) {
    console.error('Error adding media to contoh berkas:', error)
    return { success: false, error: error.message || 'Gagal menambahkan berkas ke contoh berkas.' }
  }
}

/**
 * Memperbarui info tampilan contoh berkas (judul, petunjuk lokus, kategori, urutan, aktif/tidak)
 */
export async function updateContohBerkasAction(
  id: string,
  data: {
    title?: string
    description?: string
    category?: string
    orderIndex?: number
    isActive?: boolean
  }
) {
  try {
    await requireSuperAdmin()

    const updated = await db.contohBerkas.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description.trim() } : {}),
        ...(data.category !== undefined ? { category: data.category.trim() } : {}),
        ...(data.orderIndex !== undefined ? { orderIndex: data.orderIndex } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {})
      },
      include: { mediaAsset: true }
    })

    revalidatePath('/contoh-berkas')
    revalidatePath('/admin/contoh-berkas')

    return { success: true, item: updated as unknown as CuratedContohBerkasItem }
  } catch (error: any) {
    console.error('Error updating contoh berkas:', error)
    return { success: false, error: error.message || 'Gagal memperbarui data contoh berkas.' }
  }
}

/**
 * Melepaskan berkas dari halaman Contoh Berkas (Aman: Berkas fisik di MediaAsset tetap utuh)
 */
export async function removeContohBerkasAction(id: string) {
  try {
    await requireSuperAdmin()

    await db.contohBerkas.delete({
      where: { id }
    })

    revalidatePath('/contoh-berkas')
    revalidatePath('/admin/contoh-berkas')

    return { success: true }
  } catch (error: any) {
    console.error('Error removing contoh berkas:', error)
    return { success: false, error: error.message || 'Gagal menghapus berkas dari katalog.' }
  }
}
