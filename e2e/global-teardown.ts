import { FullConfig } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { cleanupTestUsers } from "./utils/test-cleanup";

// Load environment variables from .env.test
loadEnv({ path: ".env.test" });

/**
 * Global teardown runs once after all tests complete.
 * Cleans up test users created during the test run.
 */
async function globalTeardown(config: FullConfig) {
  console.log("\n🧹 Running post-test cleanup...");

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
    console.error("✗ Teardown cleanup failed:", error);
    // Don't fail if cleanup fails
  }

  console.log("");
}

export default globalTeardown;
