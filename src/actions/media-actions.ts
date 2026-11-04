// src/actions/media-actions.ts
'use server'

import { db } from '../services/db'
import { requireSuperAdmin } from '../services/auth-guard'
import { StorageService } from '../services/storage-service'
import { revalidatePath } from 'next/cache'
import path from 'path'
import fs from 'fs'

export interface MediaAssetMetadata {
  tags?: string[]
  relatedAspects?: string[] // Opsional: jika berkas ini berkaitan dengan satu atau beberapa aspek
  source?: string          // Asal instansi / penerbit (misal: "Bagian Organisasi", "KemenPAN-RB")
  version?: string         // Versi dokumen (misal: "2026", "v1.0")
  targetAudience?: string  // misal: "Seluruh Lokus", "Evaluator Daerah"
  notes?: string
  [key: string]: any
}

export interface MediaAssetItem {
  id: string
  title: string
  description?: string | null
  category: string
  fileName: string
  fileUrl: string
  fileType: string
  mimeType?: string | null
  fileSize?: number | null
  storageProvider: string
  metadata?: MediaAssetMetadata | null
  isPublic: boolean
  downloadCount: number
  createdAt: Date
  updatedAt: Date
}

function detectFileType(fileName: string, mime?: string | null): string {
  const ext = path.extname(fileName).toLowerCase()
  if (mime?.includes('pdf') || ext === '.pdf') return 'PDF'
  if (
    mime?.includes('word') ||
    mime?.includes('officedocument.wordprocessingml') ||
    ['.doc', '.docx', '.rtf', '.odt'].includes(ext)
  ) {
    return 'DOCUMENT'
  }
  if (
    mime?.includes('excel') ||
    mime?.includes('spreadsheetml') ||
    ['.xls', '.xlsx', '.csv', '.ods'].includes(ext)
  ) {
    return 'SPREADSHEET'
  }
  if (
    mime?.startsWith('image/') ||
    ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'].includes(ext)
  ) {
    return 'IMAGE'
  }
  return 'DOCUMENT'
}

function cleanTitleFromFilename(fileName: string): string {
  const base = path.basename(fileName, path.extname(fileName))
  const stripped = base.replace(/^\d+[\s_-]*/, '')
  return stripped.replace(/[_-]+/g, ' ').trim() || fileName
}

/**
 * Mengambil daftar asset media agnostik dengan filter kategori, format, dan pencarian metadata
 */
export async function getMediaAssetsAction(params?: {
  search?: string
  category?: string
  fileType?: string
  aspectFilter?: string
  page?: number
  limit?: number
  onlyPublic?: boolean
}) {
  try {
    const page = Math.max(1, params?.page || 1)
    const limit = Math.min(100, Math.max(1, params?.limit || 30))
    const skip = (page - 1) * limit

    const where: any = {}

    if (params?.onlyPublic) {
      where.isPublic = true
    }

    if (params?.search) {
      const q = params.search.trim()
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { fileName: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } }
      ]
    }

    if (params?.category && params.category !== 'ALL') {
      where.category = params.category
    }

    if (params?.fileType && params.fileType !== 'ALL') {
      where.fileType = params.fileType
    }

    const [items, totalCount, allItems] = await Promise.all([
      db.mediaAsset.findMany({
        where,
        orderBy: [{ category: 'asc' }, { updatedAt: 'desc' }],
        skip,
        take: limit
      }),
      db.mediaAsset.count({ where }),
      db.mediaAsset.findMany({
        where: params?.onlyPublic ? { isPublic: true } : {},
        select: { category: true, fileType: true, metadata: true }
      })
    ])

    // Hitung aggregasi kategori & format
    const categoryCounts: Record<string, number> = { ALL: allItems.length }
    const fileTypeCounts: Record<string, number> = { ALL: allItems.length }

    for (const item of allItems) {
      if (item.category) {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
      }
      if (item.fileType) {
        fileTypeCounts[item.fileType] = (fileTypeCounts[item.fileType] || 0) + 1
      }
    }

    // Jika ada filter aspectFilter di metadata
    let finalItems = items as unknown as MediaAssetItem[]
    if (params?.aspectFilter && params.aspectFilter !== 'ALL') {
      finalItems = finalItems.filter((it) => {
        const aspects = it.metadata?.relatedAspects
        return Array.isArray(aspects) && aspects.includes(params.aspectFilter!)
      })
    }

    return {
      success: true,
      items: finalItems,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      categoryCounts,
      fileTypeCounts
    }
  } catch (error: any) {
    console.error('Error fetching media assets:', error)
    return {
      success: false,
      items: [],
      totalCount: 0,
      page: 1,
      limit: 30,
      totalPages: 0,
      categoryCounts: {},
      fileTypeCounts: {},
      error: error.message || 'Gagal memuat pustaka berkas.'
    }
  }
}

/**
 * Mengambil daftar aset berkas publik untuk halaman Contoh Berkas / Template Lokus
 */
export async function getPublicMediaAssetsAction(params?: {
  search?: string
  category?: string
  fileType?: string
  aspectFilter?: string
  page?: number
  limit?: number
}) {
  return getMediaAssetsAction({ ...params, onlyPublic: true })
}

/**
 * Mengunggah berkas baru ke Pustaka Media Agnostik
 */
export async function uploadMediaAssetAction(formData: FormData) {
  try {
    await requireSuperAdmin()

    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string) || ''
    const description = (formData.get('description') as string) || ''
    const category = (formData.get('category') as string) || 'Template Dokumen'
    const isPublic = formData.get('isPublic') !== 'false'

    // Metadata ekstra (bisa berkaitan)
    const rawMetadata = formData.get('metadata') as string | null
    let metadata: MediaAssetMetadata = {}
    if (rawMetadata) {
      try {
        metadata = JSON.parse(rawMetadata)
      } catch {
        metadata = {}
      }
    }

    // Ekstrak tags jika ada terpisah
    const rawTags = formData.get('tags') as string | null
    if (rawTags) {
      metadata.tags = rawTags.split(',').map((t) => t.trim()).filter(Boolean)
    }

    // Ekstrak relatedAspects jika ada terpisah
    const rawAspects = formData.get('relatedAspects') as string | null
    if (rawAspects) {
      metadata.relatedAspects = rawAspects.split(',').map((a) => a.trim()).filter(Boolean)
    }

    const rawSource = formData.get('source') as string | null
    if (rawSource) {
      metadata.source = rawSource.trim()
    }

    if (!file) {
      return { success: false, error: 'Berkas wajib dipilih.' }
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const mimeType = file.type
    const fileName = file.name
    const detectedType = detectFileType(fileName, mimeType)

    const uploadRes = await StorageService.uploadFile({
      buffer,
      fileName,
      mimeType,
      unitId: 'media_library',
      aspectCode: 'GENERAL',
      slotKey: 'agnostic'
    })

    if (!uploadRes.success || !uploadRes.fileUrl) {
      return { success: false, error: uploadRes.error || 'Gagal menyimpan berkas ke storage.' }
    }

    const cleanWebUrl = uploadRes.fileUrl.split(path.sep).join('/').replace(/\\/g, '/')

    const asset = await db.mediaAsset.create({
      data: {
        title: title.trim() || cleanTitleFromFilename(fileName),
        description: description.trim() || null,
        category: category.trim() || 'Template Dokumen',
        fileName: uploadRes.fileName,
        fileUrl: cleanWebUrl,
        fileType: detectedType,
        mimeType: mimeType || null,
        fileSize: uploadRes.fileSize,
        storageProvider: uploadRes.provider,
        metadata: metadata as any,
        isPublic
      }
    })

    revalidatePath('/admin/media')
    revalidatePath('/contoh-berkas')

    return { success: true, asset }
  } catch (error: any) {
    console.error('Error uploading media asset:', error)
    return { success: false, error: error.message || 'Gagal mengunggah berkas.' }
  }
}

/**
 * Sinkronisasi otomatis (mapping) seluruh berkas yang sudah pernah diunggah
 * dengan menaruh relasi aspek lama ke dalam metadata.relatedAspects secara aman dan agnostik.
 */
export async function syncExistingMediaAction() {
  try {
    await requireSuperAdmin()

    let countNew = 0
    let countUpdated = 0

    // 1. Ambil bukti dukung dari IndicatorEvidenceSubmission
    const submissions = await db.indicatorEvidenceSubmission.findMany({
      where: { fileUrl: { not: '' } },
      select: {
        fileUrl: true,
        fileName: true,
        fileSize: true,
        fileType: true,
        aspectCode: true,
        title: true,
        storageProvider: true,
        attachments: true
      }
    })

    for (const sub of submissions) {
      if (!sub.fileUrl) continue

      const cleanUrl = sub.fileUrl.split(path.sep).join('/').replace(/\\/g, '/')
      const fName = sub.fileName || path.basename(cleanUrl)
      const fType = sub.fileType || detectFileType(fName)
      const cleanTitle = sub.title || cleanTitleFromFilename(fName)

      const existing = await db.mediaAsset.findUnique({
        where: { fileUrl: cleanUrl }
      })

      const metadata: MediaAssetMetadata = {
        relatedAspects: sub.aspectCode ? [sub.aspectCode] : [],
        source: 'Sistem Evaluasi Mandiri'
      }

      if (!existing) {
        await db.mediaAsset.create({
          data: {
            title: cleanTitle,
            fileName: fName,
            fileUrl: cleanUrl,
            fileType: fType,
            fileSize: sub.fileSize || 0,
            storageProvider: sub.storageProvider || 'LOCAL',
            category: 'Contoh Eviden',
            metadata: metadata as any,
            isPublic: true
          }
        })
        countNew++
      } else {
        // Update metadata jika belum ada
        const currentMeta = (existing.metadata as MediaAssetMetadata) || {}
        if (!currentMeta.relatedAspects && sub.aspectCode) {
          await db.mediaAsset.update({
            where: { id: existing.id },
            data: {
              metadata: {
                ...currentMeta,
                relatedAspects: [sub.aspectCode]
              } as any
            }
          })
          countUpdated++
        }
      }
    }

    // 2. Scan folder fisik public/uploads/evidence untuk mendeteksi berkas lokal
    const baseUploads = path.join(process.cwd(), 'public', 'uploads', 'evidence')
    if (fs.existsSync(baseUploads)) {
      function walkDir(dir: string, fileList: string[] = []) {
        const files = fs.readdirSync(dir)
        for (const file of files) {
          const filePath = path.join(dir, file)
          const stat = fs.statSync(filePath)
          if (stat.isDirectory()) {
            walkDir(filePath, fileList)
          } else {
            fileList.push(filePath)
          }
        }
        return fileList
      }

      const allPhysicalFiles = walkDir(baseUploads)
      for (const absPath of allPhysicalFiles) {
        const relative = path.relative(path.join(process.cwd(), 'public'), absPath)
        const webUrl = '/' + relative.split(path.sep).join('/').replace(/\\/g, '/')
        const fileName = path.basename(absPath)
        const stat = fs.statSync(absPath)

        const parts = relative.split(path.sep)
        const aspectCandidate = parts.find((p) => ['I', 'II', 'III', 'IV', 'V', 'VI'].includes(p))

        const existing = await db.mediaAsset.findUnique({
          where: { fileUrl: webUrl }
        })

        const metadata: MediaAssetMetadata = {
          relatedAspects: aspectCandidate ? [aspectCandidate] : [],
          source: 'Penyimpanan Lokal'
        }

        if (!existing) {
          await db.mediaAsset.create({
            data: {
              title: cleanTitleFromFilename(fileName),
              fileName,
              fileUrl: webUrl,
              fileType: detectFileType(fileName),
              fileSize: stat.size,
              storageProvider: 'LOCAL',
              category: 'Contoh Eviden',
              metadata: metadata as any,
              isPublic: true
            }
          })
          countNew++
        } else {
          // Normalisasi URL jika masih ada backslash
          if (existing.fileUrl !== webUrl) {
            await db.mediaAsset.update({
              where: { id: existing.id },
              data: { fileUrl: webUrl }
            })
          }
        }
      }
    }

    revalidatePath('/admin/media')
    revalidatePath('/contoh-berkas')

    const totalAssets = await db.mediaAsset.count()

    return {
      success: true,
      countNew,
      countUpdated,
      totalAssets
    }
  } catch (error: any) {
    console.error('Error syncing existing media:', error)
    return {
      success: false,
      error: error.message || 'Gagal menyinkronkan berkas.'
    }
  }
}

/**
 * Memperbarui metadata berkas agnostik
 */
export async function updateMediaAssetAction(
  id: string,
  data: {
    title?: string
    description?: string | null
    category?: string
    metadata?: MediaAssetMetadata | null
    isPublic?: boolean
  }
) {
  try {
    await requireSuperAdmin()

    const updated = await db.mediaAsset.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
        ...(data.category !== undefined ? { category: data.category.trim() } : {}),
        ...(data.metadata !== undefined ? { metadata: data.metadata as any } : {}),
        ...(data.isPublic !== undefined ? { isPublic: data.isPublic } : {})
      }
    })

    revalidatePath('/admin/media')
    revalidatePath('/contoh-berkas')

    return { success: true, asset: updated }
  } catch (error: any) {
    console.error('Error updating media asset:', error)
    return { success: false, error: error.message || 'Gagal memperbarui berkas.' }
  }
}

/**
 * Menghapus media dari katalog (dan opsi hapus fisik)
 */
export async function deleteMediaAssetAction(id: string, deletePhysicalFile: boolean = false) {
  try {
    await requireSuperAdmin()

    const asset = await db.mediaAsset.findUnique({ where: { id } })
    if (!asset) {
      return { success: false, error: 'Berkas tidak ditemukan.' }
    }

    if (deletePhysicalFile && asset.fileUrl) {
      await StorageService.deleteFile(asset.fileUrl)
    }

    await db.mediaAsset.delete({ where: { id } })

    revalidatePath('/admin/media')
    revalidatePath('/contoh-berkas')

    return { success: true }
  } catch (error: any) {
    console.error('Error deleting media asset:', error)
    return { success: false, error: error.message || 'Gagal menghapus berkas.' }
  }
}
