/*
 * Smoke test over the app's pure logic — reducers, selectors, parsers and the
 * AI helpers. Bundled with the esbuild already inside Vite, so it costs no
 * extra dependency and no test framework. Run it with `npm run smoke`.
 *
 * Each check module runs on import and adds to the shared tally.
 */
import "./checks/core";
import "./checks/importing";
import "./checks/linkedin";
import "./checks/upwork";
import { results } from "./checks/harness";

console.log(`\n${results.pass} passed, ${results.fails.length} failed`);
results.fails.forEach((f) => console.log("  FAIL:", f));

// Throwing rather than process.exit keeps this free of @types/node, and still
// gives npm a non-zero exit code.
if (results.fails.length) throw new Error(`${results.fails.length} smoke checks failed`);
