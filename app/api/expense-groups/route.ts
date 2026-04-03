import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { successResponse, errorResponse, handleApiError } from '@/lib/api'
import { getCurrentSession } from '@/lib/auth'

export async function GET() {
  try {
    const admin = await getAdminClient()

    const { data, error } = await admin
      .from('expense_groups')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('[v0] Error fetching expense groups:', error)
      return NextResponse.json(successResponse([]))
    }

    return NextResponse.json(successResponse(data))
  } catch (error) {
    console.error('[v0] Expense groups API error:', error)
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    
    if (!session) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 })
    }

    if (session.role !== 'ADMIN') {
      return NextResponse.json(errorResponse('Forbidden'), { status: 403 })
    }

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json(errorResponse('Name is required'), { status: 400 })
    }

    const admin = await getAdminClient()

    const { data, error } = await admin
      .from('expense_groups')
      .insert([{ name, description }])
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating expense group:', error)
      return NextResponse.json(errorResponse('Failed to create expense group'), { status: 500 })
    }

    return NextResponse.json(successResponse(data), { status: 201 })
  } catch (error) {
    console.error('[v0] Expense groups API error:', error)
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}
