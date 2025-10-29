import type { APIRoute } from 'astro';
import { z } from 'zod';
import { LoginSchema } from '../../../lib/auth/validators';
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
      validatedData = LoginSchema.parse(requestBody);
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

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      console.error('Login failed:', {
        email: validatedData.email,
        error: error.message,
      });

      // Map Supabase errors to user-friendly messages
      if (error.message.includes('Invalid login credentials')) {
        return new Response(
          JSON.stringify({ error: 'Nieprawidłowe dane logowania.' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (error.message.includes('Email not confirmed')) {
        return new Response(
          JSON.stringify({ error: 'Konto nieaktywne lub niepotwierdzone.' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Generic error
      return new Response(
        JSON.stringify({ error: 'Nieprawidłowe dane logowania.' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Success - return user data
    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unhandled error in POST /api/auth/login:', error);
    return new Response(
      JSON.stringify({ error: 'Wystąpił nieoczekiwany błąd.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
