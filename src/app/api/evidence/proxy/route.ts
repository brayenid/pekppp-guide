// src/app/api/evidence/proxy/route.ts
// Same-Origin Proxy untuk memuat berkas Bukti Dukung (R2 CDN / Remote Storage)
// ke dalam HTML5 Canvas & PDF.js pada Studio Sensor tanpa kendala CORS / Tainted Canvas.

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const rawUrl = req.nextUrl.searchParams.get('url')
    if (!rawUrl) {
      return NextResponse.json(
        { success: false, error: 'Parameter url wajib disertakan.' },
        { status: 400 }
      )
    }

    let parsed: URL
    try {
      parsed = new URL(rawUrl)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Format URL berkas tidak valid.' },
        { status: 400 }
      )
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return NextResponse.json(
        { success: false, error: 'Protokol URL tidak didukung.' },
        { status: 400 }
      )
    }

    const upstreamRes = await fetch(parsed.toString(), {
      method: 'GET',
      cache: 'no-store'
    })

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Gagal mengambil berkas dari penyimpanan (${upstreamRes.status}).`
        },
        { status: upstreamRes.status }
      )
    }

    const contentType =
      upstreamRes.headers.get('content-type') || 'application/octet-stream'
    const arrayBuffer = await upstreamRes.arrayBuffer()

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=300',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (err: any) {
    console.error('[EvidenceProxy] Error fetching remote evidence file:', err)
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Gagal memuat berkas dari penyimpanan.'
      },
      { status: 500 }
    )
  }
}
