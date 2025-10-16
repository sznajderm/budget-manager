import { z } from 'zod'
import type { APIRoute } from 'astro'
import { createClient } from '@supabase/supabase-js'
import { createCategory } from '../../../../../lib/services/category.service'
import type { CategoryCreateCommand } from '../../../../../types'

export const prerender = false

const CreateCategorySchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(100, 'Category name cannot exceed 100 characters')
    .refine(val => val.trim().length > 0, 'Category name cannot be empty')
    .refine(val => val.trim().length <= 100, 'Category name cannot exceed 100 characters after trimming')
    .refine(val => !/^\s+$/.test(val), 'Category name cannot contain only whitespace')
    .transform(val => val.trim())
})

export const POST: APIRoute = async (context) => {
  try {
    // For testing purposes, use service role client to bypass RLS
    const supabaseUrl = import.meta.env.SUPABASE_URL
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Create service role client that can bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // For testing, hardcode the user ID from the JWT you were using
    const userId = '59b474a9-8b09-4a80-9046-3bc7c0b482a9'
    const user = { id: userId }

    // Parse request body
    let requestBody: unknown
    try {
      requestBody = await context.request.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Validate request body structure
    if (!requestBody || typeof requestBody !== 'object') {
      return new Response(JSON.stringify({ error: 'Request body must be a JSON object' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Validate required fields are present
    const bodyObj = requestBody as Record<string, unknown>
    const missingFields: string[] = []

    if (!('name' in bodyObj) || bodyObj.name === undefined) {
      missingFields.push('name')
    }

    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({
          error: `Missing required fields: ${missingFields.join(', ')}`
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate input using Zod schema
    let validatedData
    try {
      validatedData = CreateCategorySchema.parse(bodyObj)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((e) => e.message).join(', ')
        return new Response(JSON.stringify({ error: errorMessages }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Fallback for unexpected validation errors
      return new Response(JSON.stringify({ error: 'Invalid input data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const command: CategoryCreateCommand = {
      name: validatedData.name
    }

    // Create category using service
    try {
      const newCategory = await createCategory(supabase, user.id, command)

      return new Response(JSON.stringify(newCategory), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      console.error('Category creation failed:', {
        userId: user.id,
        categoryData: { name: command.name },
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      if (error instanceof Error) {
        // Check if it's a validation error or constraint violation
        if (
          error.message.includes('Validation error') ||
          error.message.includes('cannot be empty') ||
          error.message.includes('already exists')
        ) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 422,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        // Database constraint violations
        if (
          error.message.includes('Failed to create category due to constraint violation') ||
          error.message.includes('Failed to create category due to database error')
        ) {
          return new Response(JSON.stringify({ error: 'Failed to create category due to constraint violation' }), {
            status: 422,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      }

      // Generic server error for unexpected issues
      return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    // Catch-all for any unhandled errors in the endpoint
    console.error('Unhandled error in POST /rest/v1/categories:', error)
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}