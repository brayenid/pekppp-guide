// src/services/storage-service.ts
// Hybrid Storage Engine: Cloudflare R2 with Local Filesystem Fallback

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import path from 'path'
import fs from 'fs'

export interface StorageUploadResult {
  success: boolean
  provider: 'R2' | 'LOCAL' | 'EXTERNAL_LINK'
  fileUrl: string
  fileName: string
  fileSize: number
  fileType: 'PDF' | 'IMAGE' | 'DOCUMENT' | 'LINK'
  error?: string
}


function getFileType(fileName: string, mimeType?: string): 'PDF' | 'IMAGE' | 'DOCUMENT' | 'LINK' {
  const ext = path.extname(fileName).toLowerCase()
  if (mimeType?.includes('pdf') || ext === '.pdf') return 'PDF'
  if (
    mimeType?.startsWith('image/') ||
    ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.bmp'].includes(ext)
  ) {
    return 'IMAGE'
  }
  if (['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.zip', '.rar'].includes(ext)) {
    return 'DOCUMENT'
  }
  return 'DOCUMENT'
}

export class StorageService {
  /**
   * Memeriksa apakah konfigurasi kredensial Cloudflare R2 (S3 kompatibel) telah terpasang lengkap.
   * @returns `true` jika semua environment variable R2 tersedia, `false` jika sebaliknya.
   */
  private static isR2Configured(): boolean {
    const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env
    return Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME)
  }

  /**
   * Menginisialisasi dan mengembalikan instance AWS S3Client yang diarahkan ke endpoint Cloudflare R2.
   * @returns S3Client instance atau null jika konfigurasi belum lengkap.
   */
  private static getR2Client(): S3Client | null {
    const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env
    if (!this.isR2Configured()) return null

    return new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!
      }
    })
  }


  /**
   * Mengunggah berkas buffer bukti dukung ke Cloudflare R2 atau Local Filesystem (Hybrid Storage).
   * - Alur 1: Mengunggah ke bucket Cloudflare R2 jika kredensial R2 tersedia di environment.
   * - Alur 2 (Fallback): Menyimpan berkas ke direktori lokal server (`public/uploads/evidence/...`) jika R2 belum diatur atau gagal.
   * @param params.buffer Buffer data biner berkas.
   * @param params.fileName Nama asli berkas.
   * @param params.mimeType Tipe MIME berkas (e.g. application/pdf).
   * @param params.unitId ID unit lokus pemilik berkas.
   * @param params.aspectCode Kode aspek instrumen (e.g. 'I', 'II').
   * @param params.slotKey Kunci slot bukti dukung (e.g. 'sp_lengkap').
   * @returns Hasil unggahan `{ success, provider, fileUrl, fileName, fileSize, fileType, error? }`.
   */
  static async uploadFile({
    buffer,
    fileName,
    mimeType,
    unitId,
    aspectCode,
    slotKey
  }: {
    buffer: Buffer
    fileName: string
    mimeType: string
    unitId: string
    aspectCode: string
    slotKey: string
  }): Promise<StorageUploadResult> {
    const timestamp = Date.now()
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFileName = `${timestamp}_${sanitizedName}`
    const fileType = getFileType(fileName, mimeType)
    const fileSize = buffer.length

    // 1. Coba upload ke Cloudflare R2 jika terkonfigurasi
    if (this.isR2Configured()) {
      try {
        const client = this.getR2Client()
        if (client) {
          const bucketName = process.env.R2_BUCKET_NAME!
          const r2Key = `evidence/${unitId}/${aspectCode}/${slotKey}/${uniqueFileName}`

          await client.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: r2Key,
              Body: buffer,
              ContentType: mimeType
            })
          )

          const publicBaseUrl = process.env.R2_PUBLIC_URL || `https://${bucketName}.r2.dev`
          const fileUrl = `${publicBaseUrl.replace(/\/+$/, '')}/${r2Key}`

          return {
            success: true,
            provider: 'R2',
            fileUrl,
            fileName: sanitizedName,
            fileSize,
            fileType
          }
        }
      } catch (err: any) {
        console.warn('⚠️ Gagal upload ke Cloudflare R2, beralih ke penyimpanan lokal:', err.message)
      }
    }

    // 2. Fallback: Simpan ke Local File Storage (public/uploads/evidence/...)
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'evidence', unitId, aspectCode)
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      const filePath = path.join(uploadDir, uniqueFileName)
      fs.writeFileSync(filePath, buffer)

      const fileUrl = `/uploads/evidence/${unitId}/${aspectCode}/${uniqueFileName}`

      return {
        success: true,
        provider: 'LOCAL',
        fileUrl,
        fileName: sanitizedName,
        fileSize,
        fileType
      }
    } catch (err: any) {
      console.error('Gagal menyimpan berkas ke direktori lokal:', err)
      return {
        success: false,
        provider: 'LOCAL',
        fileUrl: '',
        fileName,
        fileSize: 0,
        fileType: 'DOCUMENT',
        error: err.message || 'Gagal menyimpan berkas'
      }
    }
  }

  /**
   * Menghapus berkas fisik dari media penyimpanan (Cloudflare R2 atau Local Filesystem).
   * Mendeteksi lokasi berkas secara otomatis dari format URL.
   * @param fileUrl Path lokal (`/uploads/...`) atau URL R2 dari berkas yang ingin dihapus.
   * @returns `true` jika berhasil atau file tidak ada, `false` jika terjadi error saat penghapusan.
   */
  static async deleteFile(fileUrl?: string | null): Promise<boolean> {
    if (!fileUrl || typeof fileUrl !== 'string') return true

    // 1. Berkas Lokal (/uploads/evidence/...)
    if (fileUrl.startsWith('/uploads/')) {
      try {
        const relativePath = fileUrl.replace(/^\//, '')
        const localPath = path.join(process.cwd(), 'public', relativePath)
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath)
        }
        return true
      } catch (err: any) {
        console.warn('Gagal menghapus berkas fisik lokal:', err.message)
        return false
      }
    }

    // 2. Berkas Cloudflare R2
    if (
      this.isR2Configured() &&
      (fileUrl.includes('.r2.dev') ||
        fileUrl.includes('.r2.cloudflarestorage.com') ||
        fileUrl.includes('/evidence/'))
    ) {
      try {
        const client = this.getR2Client()
        if (client) {
          const bucketName = process.env.R2_BUCKET_NAME!
          const urlObj = new URL(fileUrl)
          const r2Key = urlObj.pathname.replace(/^\/+/, '')

          await client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: r2Key
            })
          )
          return true
        }
      } catch (err: any) {
        console.warn('Gagal menghapus berkas di Cloudflare R2:', err.message)
        return false
      }
    }

    return true
  }
}
