import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('[v0] Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function executeSqlFile(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8')
    console.log(`[v0] Executing ${path.basename(filePath)}...`)
    
    const { error } = await supabase.rpc('exec_sql', { sql_text: sql })
    
    if (error) {
      console.error(`[v0] Error in ${path.basename(filePath)}:`, error)
      return false
    }
    
    console.log(`[v0] ✓ ${path.basename(filePath)} executed successfully`)
    return true
  } catch (err) {
    console.error(`[v0] Failed to read/execute ${filePath}:`, err.message)
    return false
  }
}

async function setupDatabase() {
  const scriptsDir = path.join(process.cwd(), 'scripts')
  const migrationFiles = [
    '001-enums.sql',
    '002-tables.sql',
    '003-indexes.sql',
    '004-rls.sql',
    '005-seed.sql'
  ]

  console.log('[v0] Starting database setup...')

  for (const file of migrationFiles) {
    const filePath = path.join(scriptsDir, file)
    const success = await executeSqlFile(filePath)
    if (!success) {
      console.error(`[v0] Database setup failed at ${file}`)
      process.exit(1)
    }
  }

  console.log('[v0] ✓ Database setup completed successfully!')
}

setupDatabase()
