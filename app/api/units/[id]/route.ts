import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { errorResponse, successResponse, handleApiError } from '@/lib/api'
import { getCurrentSession } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession()
    
    if (!session) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 })
    }

    if (session.role !== 'ADMIN') {
      return NextResponse.json(errorResponse('Forbidden'), { status: 403 })
    }

    const { id } = await params
    const { unit_number, wing, floor, type } = await request.json()

    if (!unit_number || !wing || floor === undefined || !type) {
      return NextResponse.json(errorResponse('Missing required fields'), { status: 400 })
    }

    const admin = await getAdminClient()

    const { data: existingUnit } = await admin
      .from('units')
      .select('id')
      .eq('unit_number', unit_number)
      .neq('id', id)
      .single()

    if (existingUnit) {
      return NextResponse.json(errorResponse('Unit number already exists'), { status: 409 })
    }

    const { data, error } = await admin
      .from('units')
      .update({ unit_number, wing, floor, type })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error updating unit:', error)
      return NextResponse.json(errorResponse('Failed to update unit'), { status: 500 })
    }

    return NextResponse.json(successResponse(data))
  } catch (error) {
    console.error('[v0] Unit update API error:', error)
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession()
    
    if (!session) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 })
    }

    if (session.role !== 'ADMIN') {
      return NextResponse.json(errorResponse('Forbidden'), { status: 403 })
    }

    const { id } = await params

    const admin = await getAdminClient()

    const { error } = await admin
      .from('units')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[v0] Error deleting unit:', error)
      return NextResponse.json(errorResponse('Failed to delete unit'), { status: 500 })
    }

    return NextResponse.json(successResponse({ message: 'Unit deleted' }))
  } catch (error) {
    console.error('[v0] Unit delete API error:', error)
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}
