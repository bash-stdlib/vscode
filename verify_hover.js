"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
async function run() {
  const projectRoot = process.cwd();
  const testFile = path.join(projectRoot, "test_file.sh");
  fs.writeFileSync(testFile, "@parametrize");
  try {
    const document = await vscode.workspace.openTextDocument(testFile);
    await vscode.window.showTextDocument(document);
    // Wait for extension to activate and fetch docs
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const position = new vscode.Position(0, 5); // middle of @parametrize
    const hovers = await vscode.commands.executeCommand(
      "vscode.executeHoverProvider",
      document.uri,
      position,
    );
    console.log("HOVER_RESULT_START");
    if (hovers && hovers.length > 0) {
      hovers.forEach((h) => {
        h.contents.forEach((c) => {
          console.log(typeof c === "string" ? c : c.value);
        });
      });
    } else {
      console.log("No hovers found");
    }
    console.log("HOVER_RESULT_END");
  } finally {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  }
}
run().catch(console.error);
//# sourceMappingURL=verify_hover.js.map
