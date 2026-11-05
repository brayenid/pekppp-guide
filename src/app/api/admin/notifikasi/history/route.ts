// src/app/api/admin/notifikasi/history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserAction } from '../../../../../actions/auth-actions'
import { getRecentBroadcastHistoryAction } from '../../../../../actions/push-actions'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserAction()
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const search = searchParams.get('search') || undefined
    const category = searchParams.get('category') || undefined

    const result = await getRecentBroadcastHistoryAction({
      page,
      limit,
      search,
      category
    })

    return NextResponse.json({
      success: true,
      items: result.items,
      totalCount: result.totalCount,
      hasMore: result.hasMore
    })
  } catch (error: any) {
    console.error('API get broadcast history error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
