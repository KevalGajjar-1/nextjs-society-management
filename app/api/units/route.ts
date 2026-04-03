import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { errorResponse, successResponse, handleApiError } from '@/lib/api'
import { getCurrentSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminClient()

    const { data, error } = await admin
      .from('units')
      .select('*')
      .order('unit_number', { ascending: true })

    if (error) {
      console.error('[v0] Error fetching units:', error)
      if (error.message?.includes('does not exist') || error.code === 'PGRST116') {
        return NextResponse.json(successResponse([]))
      }
      return NextResponse.json(errorResponse('Failed to fetch units'), { status: 500 })
    }

    return NextResponse.json(successResponse(data || []))
  } catch (error) {
    console.error('[v0] Units API error:', error)
    return NextResponse.json(successResponse([]))
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

    const { unit_number, wing, floor, type } = await request.json()

    if (!unit_number || !wing || floor === undefined || !type) {
      return NextResponse.json(errorResponse('Missing required fields'), { status: 400 })
    }

    const admin = await getAdminClient()

    const { data: existingUnit } = await admin
      .from('units')
      .select('id')
      .eq('unit_number', unit_number)
      .single()

    if (existingUnit) {
      return NextResponse.json(errorResponse('Unit number already exists'), { status: 409 })
    }

    const { data, error } = await admin
      .from('units')
      .insert([{ unit_number, wing, floor, type }])
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating unit:', error)
      return NextResponse.json(errorResponse('Failed to create unit'), { status: 500 })
    }

    return NextResponse.json(successResponse(data), { status: 201 })
  } catch (error) {
    console.error('[v0] Units API error:', error)
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}
