import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { successResponse, errorResponse, handleApiError } from '@/lib/api'
import { getCurrentSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminClient()

    const { data, error } = await admin
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching transactions:', error)
      return NextResponse.json(successResponse([]))
    }

    return NextResponse.json(successResponse(data))
  } catch (error) {
    console.error('[v0] Transactions API error:', error)
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    
    if (!session) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 })
    }

    if (!['ADMIN', 'COMMITTEE'].includes(session.role)) {
      return NextResponse.json(errorResponse('Forbidden'), { status: 403 })
    }

    const { type, title, amount, group_id, unit_id, payment_mode, transaction_date } = await request.json()

    if (!type || !title || !amount || !transaction_date) {
      return NextResponse.json(errorResponse('Missing required fields'), { status: 400 })
    }

    const admin = await getAdminClient()

    const { data, error } = await admin
      .from('transactions')
      .insert([{
        type,
        title,
        amount,
        group_id,
        unit_id,
        payment_mode,
        transaction_date,
        created_by: session.id,
      }])
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating transaction:', error)
      return NextResponse.json(errorResponse('Failed to create transaction'), { status: 500 })
    }

    return NextResponse.json(successResponse(data), { status: 201 })
  } catch (error) {
    console.error('[v0] Transactions API error:', error)
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}
