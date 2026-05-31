import * as assert from "assert";
import * as vscode from "vscode";
import { debug } from "@/debug";

suite("Debug Utility Test Suite", () => {
  const originalLogger = debug.logger;
  let loggedMessages: any[][] = [];

  setup(() => {
    loggedMessages = [];
    debug.logger = (...args: any[]) => {
      loggedMessages.push(args);
    };
  });

  teardown(async () => {
    debug.logger = originalLogger;
    const config = vscode.workspace.getConfiguration("bash-stdlib");
    await config.update("debug", undefined, vscode.ConfigurationTarget.Global);
  });

  suite("when debug is enabled", () => {
    setup(async () => {
      const config = vscode.workspace.getConfiguration("bash-stdlib");
      await config.update("debug", true, vscode.ConfigurationTarget.Global);

      debug("test message", { key: "value" });
    });

    test("it should log the message to the logger", () => {
      assert.ok(loggedMessages.length > 0);
      assert.strictEqual(loggedMessages[0][0], "[stdlib-completion] test message");
      assert.deepStrictEqual(loggedMessages[0][1], { key: "value" });
    });
  });

  suite("when debug is disabled", () => {
    setup(async () => {
      const config = vscode.workspace.getConfiguration("bash-stdlib");
      await config.update("debug", false, vscode.ConfigurationTarget.Global);

      debug("hidden message");
    });

    test("it should not log anything to the logger", () => {
      assert.strictEqual(loggedMessages.length, 0);
    });
  });
});
