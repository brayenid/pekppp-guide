// src/app/api/admin/media/route.ts
// Server-Side Real Pagination API Route for Media Manager (No Gimmick Loadmore)

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/services/db'
import { getCurrentUserAction } from '@/actions/auth-actions'
import { MediaAssetItem } from '@/actions/media-actions'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserAction()
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const pageParam = searchParams.get('page') || '1'
    const limitParam = searchParams.get('limit') || '18'
    const search = (searchParams.get('search') || '').trim()
    const category = searchParams.get('category') || 'ALL'
    const fileType = searchParams.get('fileType') || 'ALL'

    const page = Math.max(1, parseInt(pageParam, 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(limitParam, 10) || 18))
    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category !== 'ALL') {
      where.category = category
    }

    if (fileType !== 'ALL') {
      where.fileType = fileType
    }

    const [items, totalCount] = await Promise.all([
      db.mediaAsset.findMany({
        where,
        orderBy: [{ category: 'asc' }, { updatedAt: 'desc' }],
        skip,
        take: limit
      }),
      db.mediaAsset.count({ where })
    ])

    return NextResponse.json({
      success: true,
      items: items as unknown as MediaAssetItem[],
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    })
  } catch (error: any) {
    console.error('Error in /api/admin/media:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
