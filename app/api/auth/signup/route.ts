import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByEmail } from '@/lib/auth'
import { errorResponse, successResponse, handleApiError } from '@/lib/api'
import { getAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password, unit_id, resident_type } = await request.json()

    // Validation
    if (!name || !email || !password || !unit_id || !resident_type) {
      return NextResponse.json(
        errorResponse('Missing required fields'),
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        errorResponse('Password must be at least 6 characters'),
        { status: 400 }
      )
    }

    // Check if email exists
    const existingUser = await getUserByEmail(email)

    if (existingUser) {
      return NextResponse.json(
        errorResponse('Email already exists'),
        { status: 409 }
      )
    }

    // Verify unit exists
    const admin = await getAdminClient()
    const { data: unit, error: unitError } = await admin
      .from('units')
      .select('id')
      .eq('id', unit_id)
      .single()

    if (unitError || !unit) {
      return NextResponse.json(
        errorResponse('Invalid unit selected'),
        { status: 400 }
      )
    }

    // Hash password on server-side (dynamic import for server-only)
    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.default.hash(password, 10)

    // Create user
    const newUser = await createUser(name, email, phone, passwordHash, unit_id, resident_type)

    if (!newUser) {
      return NextResponse.json(
        errorResponse('Failed to create user'),
        { status: 500 }
      )
    }

    // Return user data without password
    const { password_hash, ...userWithoutPassword } = newUser

    return NextResponse.json(
      successResponse({
        user: userWithoutPassword,
        message: 'Account created. Pending admin approval.',
      }),
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] Signup error:', error)
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    )
  }
}
