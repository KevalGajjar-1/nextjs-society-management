import { NextRequest, NextResponse } from 'next/server'
import { successResponse } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(successResponse({ message: 'Logged out successfully' }))

    // Clear auth cookie via response
    response.cookies.delete('auth-token')

    return response
  } catch (error) {
    console.error('[v0] Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}
