import type { APIRoute } from 'astro';
import { z } from 'zod';
import { SignupApiSchema } from '../../../lib/auth/validators';
import { createSupabaseServerInstance } from '../../../lib/supabase.server';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate input using Zod schema
    let validatedData;
    try {
      validatedData = SignupApiSchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((e) => e.message).join(', ');
        return new Response(JSON.stringify({ error: errorMessages }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Invalid input data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt to sign up
    const { data, error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Signup failed:', {
        email: validatedData.email,
        error: error.message,
      });

      // Map Supabase errors to user-friendly messages
      if (error.message.includes('User already registered')) {
        return new Response(
          JSON.stringify({ error: 'Email is already in use.' }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (error.message.includes('Password should be')) {
        return new Response(
          JSON.stringify({ error: 'Password does not meet requirements.' }),
          {
            status: 422,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Generic error
      return new Response(
        JSON.stringify({ error: 'Failed to create account.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if email confirmation is required
    // If user.identities is empty, it means email confirmation is required
    const requiresEmailConfirmation = !data.user?.identities || data.user.identities.length === 0;

    if (requiresEmailConfirmation) {
      // User needs to confirm email before they can log in
      return new Response(
        JSON.stringify({
          message: 'Check your email inbox',
          requiresConfirmation: true,
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Success - account created and user is auto-confirmed
    return new Response(
      JSON.stringify({
        message: 'Account created',
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unhandled error in POST /api/auth/signup:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
