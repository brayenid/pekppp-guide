// src/app/api/kabar/[id]/view/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/services/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID artikel tidak valid' }, { status: 400 })
    }

    // Naikkan viewCount secara atomik
    await db.article.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: { id: true, viewCount: true }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    // Fail silently agar tidak mengganggu pengalaman pembaca
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
