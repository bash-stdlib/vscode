import * as assert from "assert";
import { getAlphanumericTriggers } from "@/triggers";

suite("getAlphanumericTriggers Test Suite", () => {
  suite("when getting triggers", () => {
    let triggers: string[];

    setup(() => {
      triggers = getAlphanumericTriggers();
    });

    test("should return an array", () => {
      assert.ok(Array.isArray(triggers));
    });

    test("should include lowercase letters a-z", () => {
      for (let i = 97; i <= 122; i++) {
        assert.ok(triggers.includes(String.fromCharCode(i)));
      }
    });

    test("should include uppercase letters A-Z", () => {
      for (let i = 65; i <= 90; i++) {
        assert.ok(triggers.includes(String.fromCharCode(i)));
      }
    });

    test("should include numbers 0-9", () => {
      for (let i = 0; i <= 9; i++) {
        assert.ok(triggers.includes(i.toString()));
      }
    });

    test("should include underscore", () => {
      assert.ok(triggers.includes("_"));
    });

    test("should not contain duplicates", () => {
      const unique = new Set(triggers);
      assert.strictEqual(triggers.length, unique.size);
    });

    test("should have correct length", () => {
      assert.strictEqual(triggers.length, 26 + 26 + 10 + 1);
    });
  });
});
