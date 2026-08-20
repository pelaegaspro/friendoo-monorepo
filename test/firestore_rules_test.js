/**
 * Firestore Security Rules — Bug Condition Exploration Tests
 *
 * Task 1: Write bug condition exploration test
 * These tests run against UNFIXED rules and assert that the writes SUCCEED,
 * demonstrating the vulnerability exists.
 *
 * EXPECTED OUTCOME: All tests PASS (writes succeed = bug confirmed).
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.5, 1.6
 */

const {
  initializeTestEnvironment,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const { readFileSync } = require("fs");
const { resolve } = require("path");

const PROJECT_ID = "friendoo-test";
const TEST_UID = "test-user-123";
const HOST_UID = "host-user-456";
const LOG_ID = "log-789";

let testEnv;

beforeAll(async () => {
  const rules = readFileSync(resolve(__dirname, "../firestore.rules"), "utf8");
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  if (testEnv) await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();

  // Seed a user document so updates can succeed
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db
      .collection("users")
      .doc(TEST_UID)
      .set({
        uid: TEST_UID,
        displayName: "Test User",
        username: "testuser123",
        onboarded: true,
        bio: null,
        city: null,
        interests: null,
        languages: null,
        coins: 100,
        createdAt: new Date(),
      });

    await db
      .collection("hosts")
      .doc(HOST_UID)
      .set({
        uid: HOST_UID,
        coinsPerMinute: 5,
        displayName: "Test Host",
      });
  });
});

// ---------------------------------------------------------------------------
// Test A: Authenticated user writes { coins: 99999 } to users/{uid}
// EXPECTED: SUCCEEDS on unfixed rules (demonstrates the bug)
// ---------------------------------------------------------------------------
test("Test A — Bug: authenticated user can write coins field to users/{uid}", async () => {
  const db = testEnv.authenticatedContext(TEST_UID).firestore();

  // This should SUCCEED on unfixed rules — the bug is that coins can be written directly
  await assertSucceeds(
    db.collection("users").doc(TEST_UID).update({ coins: 99999 })
  );
});

// ---------------------------------------------------------------------------
// Test B: Authenticated user writes { coinBalance: 99999 } to users/{uid}
// EXPECTED: SUCCEEDS on unfixed rules (demonstrates the bug)
// ---------------------------------------------------------------------------
test("Test B — Bug: authenticated user can write coinBalance field to users/{uid}", async () => {
  const db = testEnv.authenticatedContext(TEST_UID).firestore();

  // This should SUCCEED on unfixed rules — coinBalance is not blocked
  await assertSucceeds(
    db.collection("users").doc(TEST_UID).update({ coinBalance: 99999 })
  );
});

// ---------------------------------------------------------------------------
// Test C: Authenticated user creates a document in transactions/
// EXPECTED: SUCCEEDS on unfixed rules (demonstrates the bug)
// ---------------------------------------------------------------------------
test("Test C — Bug: authenticated user can create a document in transactions/", async () => {
  const db = testEnv.authenticatedContext(TEST_UID).firestore();

  // This should SUCCEED on unfixed rules — no explicit deny on transactions
  await assertSucceeds(
    db.collection("transactions").add({
      userId: TEST_UID,
      type: "credit",
      amount: 99999,
      coins: 99999,
      description: "exploit",
      createdAt: new Date(),
    })
  );
});

// ---------------------------------------------------------------------------
// Test D: Authenticated user writes to hosts/{uid}
// EXPECTED: SUCCEEDS on unfixed rules (demonstrates the bug)
// ---------------------------------------------------------------------------
test("Test D — Bug: authenticated user can write to hosts/{hostId}", async () => {
  const db = testEnv.authenticatedContext(TEST_UID).firestore();

  // This should SUCCEED on unfixed rules — no explicit deny on hosts
  await assertSucceeds(
    db.collection("hosts").doc(HOST_UID).update({ coinsPerMinute: 0 })
  );
});

// ---------------------------------------------------------------------------
// Test E: Authenticated user writes to call_logs/{logId}
// EXPECTED: SUCCEEDS on unfixed rules (demonstrates the bug)
// ---------------------------------------------------------------------------
test("Test E — Bug: authenticated user can write to call_logs/{logId}", async () => {
  const db = testEnv.authenticatedContext(TEST_UID).firestore();

  // This should SUCCEED on unfixed rules — no explicit deny on call_logs
  await assertSucceeds(
    db.collection("call_logs").doc(LOG_ID).set({
      userId: TEST_UID,
      hostId: HOST_UID,
      duration: 60,
      coinsDeducted: 0,
      createdAt: new Date(),
    })
  );
});

// ===========================================================================
// PRESERVATION PROPERTY TESTS (Task 2)
// Run on UNFIXED code — all should PASS (baseline behavior to preserve)
// Validates: Requirements 3.1–3.7
// ===========================================================================

const { assertFails } = require("@firebase/rules-unit-testing");

// ---------------------------------------------------------------------------
// Preservation P1: Authenticated user can read their own users/{uid} document
// ---------------------------------------------------------------------------
test("Preservation P1 — read users/{uid} is permitted for owner", async () => {
  const db = testEnv.authenticatedContext(TEST_UID).firestore();
  await assertSucceeds(
    db.collection("users").doc(TEST_UID).get()
  );
});

// ---------------------------------------------------------------------------
// Preservation P2: Owner can update profile fields (no coins/coinBalance)
// ---------------------------------------------------------------------------
test("Preservation P2 — update users/{uid} with only profile fields is permitted for owner", async () => {
  const db = testEnv.authenticatedContext(TEST_UID).firestore();
  await assertSucceeds(
    db.collection("users").doc(TEST_UID).update({
      displayName: "Updated Name",
      bio: "Hello world",
      photoURL: "https://example.com/photo.jpg",
    })
  );
});

// ---------------------------------------------------------------------------
// Preservation P3: Authenticated user can read hosts/{hostId}
// ---------------------------------------------------------------------------
test("Preservation P3 — read hosts/{hostId} is permitted for authenticated user", async () => {
  const db = testEnv.authenticatedContext(TEST_UID).firestore();
  await assertSucceeds(
    db.collection("hosts").doc(HOST_UID).get()
  );
});

// ---------------------------------------------------------------------------
// Preservation P4: Authenticated user can read transactions (own)
// ---------------------------------------------------------------------------
test("Preservation P4 — read transactions is permitted for authenticated user", async () => {
  // Seed a transaction owned by TEST_UID
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection("transactions").doc("tx-001").set({
      userId: TEST_UID,
      type: "credit",
      amount: 100,
      createdAt: new Date(),
    });
  });

  const db = testEnv.authenticatedContext(TEST_UID).firestore();
  await assertSucceeds(
    db.collection("transactions").doc("tx-001").get()
  );
});

// ---------------------------------------------------------------------------
// Preservation P5: coin_packages can be read publicly
// ---------------------------------------------------------------------------
test("Preservation P5 — read coin_packages is permitted (public)", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection("coin_packages").doc("pkg-001").set({
      coins: 100,
      price: 19,
      isActive: true,
    });
  });

  // Unauthenticated read
  const db = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(
    db.collection("coin_packages").doc("pkg-001").get()
  );
});

// ===========================================================================
// FIX CHECKING TESTS (Task 3.8)
// Run on FIXED rules — all bug condition writes should be DENIED
// Validates: Requirements 2.3, 2.5, 2.6, 2.7, 2.8
// ===========================================================================

// ---------------------------------------------------------------------------
// Fix A: coins write to users/{uid} is now DENIED
// ---------------------------------------------------------------------------
test("Fix A — coins write to users/{uid} is denied after fix", async () => {
  const db = testEnv.authenticatedContext(TEST_UID).firestore();
  await assertFails(
    db.collection("users").doc(TEST_UID).update({ coins: 99999 })
  );
});

// ---------------------------------------------------------------------------
// Fix B: coinBalance write to users/{uid} is now DENIED
// ---------------------------------------------------------------------------
test("Fix B — coinBalance write to users/{uid} is denied after fix", async () => {
  const db = testEnv.authenticatedContext(TEST_UID).firestore();
  await assertFails(
    db.collection("users").doc(TEST_UID).update({ coinBalance: 99999 })
  );
});

// ---------------------------------------------------------------------------
// Fix C: transactions write is now DENIED
// ---------------------------------------------------------------------------
test("Fix C — transactions write is denied after fix", async () => {
  const db = testEnv.authenticatedContext(TEST_UID).firestore();
  await assertFails(
    db.collection("transactions").add({
      userId: TEST_UID,
      type: "credit",
      amount: 99999,
      createdAt: new Date(),
    })
  );
});

// ---------------------------------------------------------------------------
// Fix D: hosts write is now DENIED
// ---------------------------------------------------------------------------
test("Fix D — hosts write is denied after fix", async () => {
  const db = testEnv.authenticatedContext(TEST_UID).firestore();
  await assertFails(
    db.collection("hosts").doc(HOST_UID).update({ coinsPerMinute: 0 })
  );
});

// ---------------------------------------------------------------------------
// Fix E: call_logs write is now DENIED
// ---------------------------------------------------------------------------
test("Fix E — call_logs write is denied after fix", async () => {
  const db = testEnv.authenticatedContext(TEST_UID).firestore();
  await assertFails(
    db.collection("call_logs").doc(LOG_ID).set({
      userId: TEST_UID,
      hostId: HOST_UID,
      duration: 60,
      createdAt: new Date(),
    })
  );
});

// ---------------------------------------------------------------------------
// Fix F: coinsPerMinute write to users/{uid} is DENIED
// ---------------------------------------------------------------------------
test("Fix F — coinsPerMinute write to users/{uid} is denied after fix", async () => {
  const db = testEnv.authenticatedContext(TEST_UID).firestore();
  await assertFails(
    db.collection("users").doc(TEST_UID).update({ coinsPerMinute: 0 })
  );
});
