/// <reference types="astro/client" />

import type { SupabaseClient as SupabaseClientPkg } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";
import type { User } from "./lib/auth/session.server";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClientPkg<Database>;
      user?: User;
      runtime?: {
        waitUntil: (p: Promise<unknown>) => void;
      };
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly OPENROUTER_DEFAULT_MODEL?: string;
  readonly OPENROUTER_BASE_URL?: string;
  readonly OPENROUTER_TIMEOUT?: string;
  readonly OPENROUTER_MAX_RETRIES?: string;
  readonly AI_SUGGESTION_SYNC_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
