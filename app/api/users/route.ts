import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { successResponse, errorResponse, handleApiError } from '@/lib/api'
import { getCurrentSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminClient()

    const { data: users, error } = await admin
      .from('users')
      .select('id, name, email, phone, role, status, unit_id, resident_type, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching users:', error)
      return NextResponse.json(successResponse([]))
    }

    const { data: units } = await admin
      .from('units')
      .select('*')
      .order('unit_number', { ascending: true })

    const { data: vehicles } = await admin
      .from('vehicles')
      .select('*')

    const usersWithDetails = (users || []).map((user: any) => ({
      ...user,
      unit: units?.find((u: any) => u.id === user.unit_id),
      vehicles: vehicles?.filter((v: any) => v.user_id === user.id) || [],
    }))

    return NextResponse.json(successResponse({
      users: usersWithDetails,
      units: units || [],
    }))
  } catch (error) {
    console.error('[v0] Users API error:', error)
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

    const { name, email, phone, role, status, unit_id, resident_type } = await request.json()

    if (!name || !email || !unit_id || !resident_type) {
      return NextResponse.json(errorResponse('Missing required fields'), { status: 400 })
    }

    const admin = await getAdminClient()

    const { data: existingUser } = await admin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(errorResponse('Email already exists'), { status: 409 })
    }

    const { data, error } = await admin
      .from('users')
      .insert([{
        name,
        email,
        phone,
        role: role || 'MEMBER',
        status: status || 'PENDING',
        unit_id,
        resident_type,
      }])
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating user:', error)
      return NextResponse.json(errorResponse('Failed to create user'), { status: 500 })
    }

    return NextResponse.json(successResponse(data), { status: 201 })
  } catch (error) {
    console.error('[v0] Users API error:', error)
    return NextResponse.json(handleApiError(error), { status: 500 })
  }
}
