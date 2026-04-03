import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession, getUserById } from '@/lib/auth'
import { errorResponse, successResponse, handleApiError } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      )
    }

    // Get fresh user data
    const user = await getUserById(session.id)

    if (!user) {
      return NextResponse.json(
        errorResponse('User not found'),
        { status: 404 }
      )
    }

    return NextResponse.json(
      successResponse({
        status: user.status,
        user,
      })
    )
  } catch (error) {
    console.error('[v0] Status check error:', error)
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    )
  }
}
