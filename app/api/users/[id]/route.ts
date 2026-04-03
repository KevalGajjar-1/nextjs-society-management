import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { requireRole } from '@/lib/auth'
import { errorResponse, successResponse, handleApiError } from '@/lib/api'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['ADMIN'])

    const { id } = await params
    const body = await request.json()
    const { status, role, name, phone, resident_type } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (role) updateData.role = role
    if (name) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (resident_type) updateData.resident_type = resident_type

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(errorResponse('No fields to update'), { status: 400 })
    }

    const admin = await getAdminClient()

    const { data, error } = await admin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error updating user:', error)
      return NextResponse.json(errorResponse('Failed to update user'), { status: 500 })
    }

    return NextResponse.json(successResponse(data))
  } catch (error) {
    console.error('[v0] User update error:', error)
    return NextResponse.json(
      handleApiError(error),
      { status: error instanceof Error && error.message === 'Forbidden' ? 403 : 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['ADMIN'])

    const { id } = await params

    const admin = await getAdminClient()

    const { error } = await admin
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[v0] Error deleting user:', error)
      return NextResponse.json(errorResponse('Failed to delete user'), { status: 500 })
    }

    return NextResponse.json(successResponse({ message: 'User deleted' }))
  } catch (error) {
    console.error('[v0] User delete error:', error)
    return NextResponse.json(
      handleApiError(error),
      { status: error instanceof Error && error.message === 'Forbidden' ? 403 : 500 }
    )
  }
}
