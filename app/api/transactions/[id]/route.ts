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
    const { type, title, amount, group_id, unit_id, payment_mode, transaction_date } = await request.json()

    if (!type || !title || !amount || !transaction_date) {
      return NextResponse.json(errorResponse('Missing required fields'), { status: 400 })
    }

    const admin = await getAdminClient()

    const { data, error } = await admin
      .from('transactions')
      .update({
        type,
        title,
        amount,
        group_id,
        unit_id,
        payment_mode,
        transaction_date,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error updating transaction:', error)
      return NextResponse.json(errorResponse('Failed to update transaction'), { status: 500 })
    }

    return NextResponse.json(successResponse(data))
  } catch (error) {
    console.error('[v0] Transaction update API error:', error)
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
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[v0] Error deleting transaction:', error)
      return NextResponse.json(errorResponse('Failed to delete transaction'), { status: 500 })
    }

    return NextResponse.json(successResponse({ message: 'Transaction deleted' }))
  } catch (error) {
    console.error('[v0] Transaction delete API error:', error)
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}
