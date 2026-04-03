import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require auth
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/waiting', '/api/auth/login', '/api/auth/signup', '/api/auth/status', '/api/auth/logout']

  // Check if route is public
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Protected routes - check for token
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api')) {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Verify token with Web Crypto (Edge Runtime compatible)
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }

      const [headerB64, payloadB64, signatureB64] = parts
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())

      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }

      // Verify signature
      const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(JWT_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      )

      const message = `${headerB64}.${payloadB64}`
      const signature = Buffer.from(signatureB64, 'base64url')
      
      const isValid = await crypto.subtle.verify(
        'HMAC',
        key,
        signature,
        new TextEncoder().encode(message)
      )
      
      if (!isValid) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }

      // Check if user is approved for dashboard access
      if (pathname.startsWith('/dashboard') && payload.status !== 'APPROVED') {
        return NextResponse.redirect(new URL('/auth/waiting', request.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon\\..+|apple-icon\\..+).*)'],
}
