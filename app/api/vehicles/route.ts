import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { successResponse, errorResponse, handleApiError } from '@/lib/api'
import { getCurrentSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminClient()

    const { data, error } = await admin
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching vehicles:', error)
      return NextResponse.json(successResponse([]))
    }

    return NextResponse.json(successResponse(data))
  } catch (error) {
    console.error('[v0] Vehicles API error:', error)
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    
    if (!session) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 })
    }

    if (!['ADMIN', 'COMMITTEE', 'MEMBER'].includes(session.role)) {
      return NextResponse.json(errorResponse('Forbidden'), { status: 403 })
    }

    const { user_id, unit_id, type, sticker_number } = await request.json()

    if (!user_id || !type || !sticker_number) {
      return NextResponse.json(errorResponse('Missing required fields'), { status: 400 })
    }

    const admin = await getAdminClient()

    const { data: existingVehicle } = await admin
      .from('vehicles')
      .select('id')
      .eq('sticker_number', sticker_number)
      .single()

    if (existingVehicle) {
      return NextResponse.json(errorResponse('Sticker number already exists'), { status: 409 })
    }

    const { data, error } = await admin
      .from('vehicles')
      .insert([{
        user_id,
        unit_id,
        type,
        sticker_number,
      }])
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating vehicle:', error)
      return NextResponse.json(errorResponse('Failed to create vehicle'), { status: 500 })
    }

    return NextResponse.json(successResponse(data), { status: 201 })
  } catch (error) {
    console.error('[v0] Vehicles API error:', error)
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}
