import { FullConfig } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { cleanupTestUsers } from "./utils/test-cleanup";

// Load environment variables from .env.test
loadEnv({ path: ".env.test" });

/**
 * Global setup runs once before all tests.
 * Cleans up any leftover test users from previous runs.
 */
async function globalSetup(config: FullConfig) {
  console.log("\n🧹 Running global test cleanup...");

  try {
    const result = await cleanupTestUsers();

    if (result.deletedUsers > 0) {
      console.log(`✓ Cleaned up ${result.deletedUsers} test user(s)`);
    } else {
      console.log("✓ No test users to clean up");
    }

    if (result.errors.length > 0) {
      console.error("\n⚠️  Cleanup errors:");
      result.errors.forEach((error) => console.error(`  - ${error}`));
    }
  } catch (error) {
    console.error("✗ Global cleanup failed:", error);
    // Don't fail the test run if cleanup fails
  }

  console.log("");
}

export default globalSetup;
