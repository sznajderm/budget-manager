import { test } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { cleanupTestUsers } from "./utils/test-cleanup";

// Load environment variables
loadEnv({ path: ".env.test" });

/**
 * Manual cleanup test - run with:
 * npm run cleanup:test-users
 *
 * This test is tagged with @manual-cleanup.
 * It can be run manually to cleanup test users without running the full test suite.
 */
test.describe("Manual Cleanup", () => {
  test("cleanup all test users @manual-cleanup", async () => {
    console.log("\n🧹 Manual cleanup initiated...");

    const result = await cleanupTestUsers();

    console.log(`\nCleanup Results:`);
    console.log(`- Deleted users: ${result.deletedUsers}`);

    if (result.errors.length > 0) {
      console.error(`\nErrors encountered:`);
      result.errors.forEach((error) => console.error(`  - ${error}`));
      throw new Error(`Cleanup completed with ${result.errors.length} error(s)`);
    }

    console.log("✓ Cleanup completed successfully\n");
  });
});
