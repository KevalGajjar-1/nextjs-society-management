import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { successResponse, handleApiError } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminClient()
    const limit = request.nextUrl.searchParams.get('limit') || '10'

    const { data, error } = await admin
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))

    if (error) {
      console.error('[v0] Error fetching notices:', error)
      return NextResponse.json(successResponse([]))
    }

    return NextResponse.json(successResponse(data))
  } catch (error) {
    console.error('[v0] Notices API error:', error)
    return NextResponse.json(successResponse([]))
  }
}
