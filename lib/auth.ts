import { cookies } from 'next/headers'
import { getAdminClient } from './supabase'
import { User, AuthPayload, UserStatus, UserRole } from './types'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
const COOKIE_NAME = 'auth-token'

/**
 * Create simple JWT token using Web Crypto (compatible with Edge Runtime)
 * Format: header.payload.signature (simplified for Edge compatibility)
 */
export async function createToken(payload: AuthPayload): Promise<string> {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payloadStr = Buffer.from(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  })).toString('base64url')
  
  const message = `${header}.${payloadStr}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  const signatureBase64 = Buffer.from(signature).toString('base64url')
  
  return `${message}.${signatureBase64}`
}

/**
 * Verify JWT token (Edge Runtime compatible)
 */
export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [headerB64, payloadB64, signatureB64] = parts
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    // Verify signature
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const message = `${headerB64}.${payloadB64}`
    const signature = Buffer.from(signatureB64, 'base64url')
    
    const isValid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(message))
    
    if (!isValid) return null

    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      status: payload.status,
    } as AuthPayload
  } catch {
    return null
  }
}

/**
 * Get current session from cookies
 */
export async function getCurrentSession(): Promise<AuthPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) return null

    return await verifyToken(token)
  } catch {
    return null
  }
}

/**
 * Set auth cookie
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  })
}

/**
 * Clear auth cookie
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

/**
 * Get user by ID from database
 */
export async function getUserById(userId: string): Promise<Omit<User, 'password_hash'> | null> {
  const admin = await getAdminClient()

  const { data, error } = await admin
    .from('users')
    .select('id, name, email, phone, role, status, unit_id, resident_type, created_at')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('[v0] Error fetching user:', error)
    return null
  }

  return data
}

/**
 * Get user by email from database
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const admin = await getAdminClient()

  const { data, error } = await admin
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    return null
  }

  return data
}

/**
 * Create new user in database
 */
export async function createUser(
  name: string,
  email: string,
  phone: string | undefined,
  passwordHash: string, // Already hashed on API route
  unitId: string,
  residentType: string
): Promise<User | null> {
  const admin = await getAdminClient()

  const { data, error } = await admin
    .from('users')
    .insert([
      {
        name,
        email,
        phone,
        password_hash: passwordHash,
        unit_id: unitId,
        resident_type: residentType,
        role: 'MEMBER',
        status: 'PENDING',
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('[v0] Error creating user:', error)
    return null
  }

  return data
}

/**
 * Require authentication middleware
 */
export async function requireAuth() {
  const session = await getCurrentSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  return session
}

/**
 * Require specific role middleware
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth()

  if (!allowedRoles.includes(session.role)) {
    throw new Error('Forbidden')
  }

  return session
}

/**
 * Require approved status middleware
 */
export async function requireApproved() {
  const session = await requireAuth()

  if (session.status !== 'APPROVED') {
    throw new Error('User not approved')
  }

  return session
}
