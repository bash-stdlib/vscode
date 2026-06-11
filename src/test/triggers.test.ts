import * as assert from "assert";
import { getAlphanumericTriggers } from "@/triggers";

suite("getAlphanumericTriggers Test Suite", () => {
  test("should return an array of triggers", () => {
    const triggers = getAlphanumericTriggers();
    assert.ok(Array.isArray(triggers));
  });

  test("should include lowercase letters a-z", () => {
    const triggers = getAlphanumericTriggers();
    for (let i = 97; i <= 122; i++) {
      assert.ok(triggers.includes(String.fromCharCode(i)));
    }
  });

  test("should include uppercase letters A-Z", () => {
    const triggers = getAlphanumericTriggers();
    for (let i = 65; i <= 90; i++) {
      assert.ok(triggers.includes(String.fromCharCode(i)));
    }
  });

  test("should include numbers 0-9", () => {
    const triggers = getAlphanumericTriggers();
    for (let i = 0; i <= 9; i++) {
      assert.ok(triggers.includes(i.toString()));
    }
  });

  test("should include underscore", () => {
    const triggers = getAlphanumericTriggers();
    assert.ok(triggers.includes("_"));
  });

  test("should not contain duplicates", () => {
    const triggers = getAlphanumericTriggers();
    const unique = new Set(triggers);
    assert.strictEqual(triggers.length, unique.size);
  });

  test("should have correct length (26 lowercase + 26 uppercase + 10 digits + 1 underscore)", () => {
    const triggers = getAlphanumericTriggers();
    assert.strictEqual(triggers.length, 26 + 26 + 10 + 1);
  });
});
