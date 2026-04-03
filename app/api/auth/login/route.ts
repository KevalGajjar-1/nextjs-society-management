import { NextRequest, NextResponse } from 'next/server'
import { createToken, getUserByEmail } from '@/lib/auth'
import { errorResponse, successResponse, handleApiError } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        errorResponse('Email and password are required'),
        { status: 400 }
      )
    }

    // Get user from database
    const user = await getUserByEmail(email)
    console.log('user', user);
    if (!user) {
      return NextResponse.json(
        errorResponse('Invalid email or password'),
        { status: 401 }
      )
    }

    // Verify password using bcrypt (dynamic import for server-only)
    const bcrypt = await import('bcryptjs')
    const isPasswordValid = await bcrypt.default.compare(password, user.password_hash)
    console.log('isPasswordValid', isPasswordValid);
    console.log('user status:', user.status);
    console.log('password from input:', password);
    console.log('password hash in DB:', user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        errorResponse('Invalid email or password'),
        { status: 401 }
      )
    }

    // Check if user is approved
    if (user.status !== 'APPROVED') {
      return NextResponse.json(
        errorResponse('Your account is not yet approved'),
        { status: 403 }
      )
    }

    // Create token
    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    })

    // Return user data without password
    const { password_hash, ...userWithoutPassword } = user

    const response = NextResponse.json(
      successResponse({
        token,
        user: userWithoutPassword,
      })
    )

    // Set cookie via response headers
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })
    console.log('response', response);
    return response
  } catch (error) {
    console.error('[v0] Login error:', error)
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    )
  }
}
