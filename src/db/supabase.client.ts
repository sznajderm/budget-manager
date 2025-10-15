import { createClient } from '@supabase/supabase-js'

import type { Database } from '../db/database.types'
import type { SupabaseClient as SupabaseClientPkg } from '@supabase/supabase-js'

export type SupabaseClient = SupabaseClientPkg<Database>

const supabaseUrl = import.meta.env.SUPABASE_URL
const supabaseAnonKey = import.meta.env.SUPABASE_KEY

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)


