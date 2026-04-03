import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { requireRole, getCurrentSession } from '@/lib/auth'
import { errorResponse, successResponse, handleApiError } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    // Only admins and committee can create notices
    await requireRole(['ADMIN', 'COMMITTEE'])

    const session = await getCurrentSession()

    const { title, description } = await request.json()

    if (!title) {
      return NextResponse.json(
        errorResponse('Title is required'),
        { status: 400 }
      )
    }

    const admin = await getAdminClient()

    const { data, error } = await admin
      .from('notices')
      .insert([
        {
          title,
          description: description || null,
          created_by: session?.id,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating notice:', error)
      return NextResponse.json(
        errorResponse('Failed to create notice'),
        { status: 500 }
      )
    }

    return NextResponse.json(
      successResponse(data),
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] Notice creation error:', error)
    return NextResponse.json(
      handleApiError(error),
      { status: error instanceof Error && error.message === 'Forbidden' ? 403 : 500 }
    )
  }
}
