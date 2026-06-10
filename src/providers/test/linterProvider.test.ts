import * as sinon from "sinon";
import * as vscode from "vscode";
import * as assert from "assert";
import {
  CONFIG_LINTER_EXTRA_FUNCTIONS,
  CONFIG_LINTER_EXTRA_NAMESPACES,
} from "@/constants";
import { LinterProvider } from "@/providers/linterProvider";
import * as linterModule from "@/shell/linter";

suite("LinterProvider Test Suite", () => {
  let linterProvider: LinterProvider;
  let sandbox: sinon.SinonSandbox;
  let runLinterStub: sinon.SinonStub;

  setup(() => {
    sandbox = sinon.createSandbox();
    linterProvider = new LinterProvider();
    runLinterStub = sandbox.stub(linterModule, "runLinter");
  });

  teardown(() => {
    sandbox.restore();
    linterProvider.dispose();
  });

  suite("when running linter for files with extra configurations", () => {
    const filePath = "/path/to/file.sh";

    setup(async () => {
      runLinterStub.resolves([]);

      const configStub = {
        get: sandbox.stub(),
      };
      configStub.get
        .withArgs("bash-stdlib.linter.executablePath", "")
        .returns("main.py");
      configStub.get
        .withArgs(CONFIG_LINTER_EXTRA_NAMESPACES, [])
        .returns(["extra"]);
      configStub.get
        .withArgs(CONFIG_LINTER_EXTRA_FUNCTIONS, [])
        .returns(["extraFunc"]);
      configStub.get
        .withArgs("bash-stdlib.linter.ignoredCodes", [])
        .returns(["SC1090"]);

      sandbox
        .stub(vscode.workspace, "getConfiguration")
        .returns(configStub as any);

      await (linterProvider as any).runLinterForFiles([filePath]);
    });

    test("it should pass extra namespaces, extra functions and ignored codes to runLinter", () => {
      assert.ok(runLinterStub.calledOnce);
      const args = runLinterStub.lastCall.args;
      assert.deepStrictEqual(args[3], ["extra"]);
      assert.deepStrictEqual(args[4], ["extraFunc"]);
      assert.deepStrictEqual(args[5], ["SC1090"]);
    });
  });
});
