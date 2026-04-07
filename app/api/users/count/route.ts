import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { successResponse, handleApiError } from '@/lib/api'

export async function GET() {
  try {
    const admin = await getAdminClient()

    const { count, error } = await admin
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('[v0] Error counting users:', error)
      return NextResponse.json(successResponse({ count: 0 }))
    }

    return NextResponse.json(successResponse({ count: count || 0 }))
  } catch (error) {
    console.error('[v0] Users count API error:', error)
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}