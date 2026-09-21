// @vitest-environment node
import { execFileSync } from "node:child_process";
import { expect, it } from "vitest";

it("loads the server HTML parser without Node require(esm) support", () => {
  // Next.js externalizes jsdom through require(). Production runtimes may
  // disable require(esm), even when the local Node version enables it.
  const output = execFileSync(
    process.execPath,
    [
      "--no-experimental-require-module",
      "-e",
      `const { JSDOM } = require("jsdom");
       const dom = new JSDOM("<p>Job description</p>");
       process.stdout.write(dom.window.document.querySelector("p").textContent);
       dom.window.close();`,
    ],
    { encoding: "utf8" },
  );

  expect(output).toBe("Job description");
});
