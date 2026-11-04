// src/app/api/media/[id]/download/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../../services/db'
import path from 'path'
import fs from 'fs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const asset = await db.mediaAsset.findUnique({
      where: { id }
    })

    if (!asset || !asset.fileUrl) {
      return NextResponse.json(
        { success: false, error: 'Berkas tidak ditemukan.' },
        { status: 404 }
      )
    }

    // Naikkan counter unduhan secara asynchronous
    db.mediaAsset
      .update({
        where: { id },
        data: { downloadCount: { increment: 1 } }
      })
      .catch((err: any) => console.warn('Failed to increment downloadCount:', err))

    const cleanFileName = asset.fileName || path.basename(asset.fileUrl)
    const encodedFileName = encodeURIComponent(cleanFileName)

    // 1. Kasus Berkas Lokal (/uploads/...)
    if (asset.fileUrl.startsWith('/uploads/')) {
      const localRelPath = asset.fileUrl.replace(/^\//, '')
      const absPath = path.join(process.cwd(), 'public', ...localRelPath.split('/'))

      if (!fs.existsSync(absPath)) {
        return NextResponse.json(
          { success: false, error: 'Berkas fisik tidak ditemukan di server.' },
          { status: 404 }
        )
      }

      const fileBuffer = fs.readFileSync(absPath)
      const mimeType = asset.mimeType || 'application/octet-stream'

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${cleanFileName}"; filename*=UTF-8''${encodedFileName}`,
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'public, max-age=3600'
        }
      })
    }

    // 2. Kasus Berkas Remote (Cloudflare R2 / S3)
    if (asset.fileUrl.startsWith('http://') || asset.fileUrl.startsWith('https://')) {
      const upstreamRes = await fetch(asset.fileUrl)
      if (!upstreamRes.ok) {
        return NextResponse.json(
          { success: false, error: 'Gagal mengambil berkas dari storage R2.' },
          { status: upstreamRes.status }
        )
      }

      const arrayBuffer = await upstreamRes.arrayBuffer()
      const contentType =
        asset.mimeType ||
        upstreamRes.headers.get('content-type') ||
        'application/octet-stream'

      return new NextResponse(Buffer.from(arrayBuffer), {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${cleanFileName}"; filename*=UTF-8''${encodedFileName}`,
          'Content-Length': arrayBuffer.byteLength.toString(),
          'Cache-Control': 'public, max-age=3600'
        }
      })
    }

    return NextResponse.json(
      { success: false, error: 'Protokol berkas tidak didukung.' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error in media download API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan server.' },
      { status: 500 }
    )
  }
}
