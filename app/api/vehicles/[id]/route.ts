import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { successResponse, errorResponse, handleApiError } from '@/lib/api'
import { getCurrentSession } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession()
    
    if (!session) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 })
    }

    if (!['ADMIN', 'COMMITTEE'].includes(session.role)) {
      return NextResponse.json(errorResponse('Forbidden'), { status: 403 })
    }

    const { id } = await params
    const { type, sticker_number } = await request.json()

    if (!type || !sticker_number) {
      return NextResponse.json(errorResponse('Missing required fields'), { status: 400 })
    }

    const admin = await getAdminClient()

    const { data: existingVehicle } = await admin
      .from('vehicles')
      .select('id')
      .eq('sticker_number', sticker_number)
      .neq('id', id)
      .single()

    if (existingVehicle) {
      return NextResponse.json(errorResponse('Sticker number already exists'), { status: 409 })
    }

    const { data, error } = await admin
      .from('vehicles')
      .update({ type, sticker_number })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error updating vehicle:', error)
      return NextResponse.json(errorResponse('Failed to update vehicle'), { status: 500 })
    }

    return NextResponse.json(successResponse(data))
  } catch (error) {
    console.error('[v0] Vehicle update API error:', error)
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession()
    
    if (!session) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 })
    }

    if (!['ADMIN', 'COMMITTEE'].includes(session.role)) {
      return NextResponse.json(errorResponse('Forbidden'), { status: 403 })
    }

    const { id } = await params

    const admin = await getAdminClient()

    const { error } = await admin
      .from('vehicles')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[v0] Error deleting vehicle:', error)
      return NextResponse.json(errorResponse('Failed to delete vehicle'), { status: 500 })
    }

    return NextResponse.json(successResponse({ message: 'Vehicle deleted' }))
  } catch (error) {
    console.error('[v0] Vehicle delete API error:', error)
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}
