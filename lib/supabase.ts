let adminClient: any = null

// Lazy load admin client only when needed
export async function getAdminClient() {
  if (adminClient) return adminClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    adminClient = createClient(supabaseUrl, supabaseServiceKey)
    return adminClient
  } catch (error) {
    console.error('[v0] Supabase client initialization failed:', error)
    throw error
  }
}
