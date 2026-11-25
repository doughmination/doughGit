/* test/highlight.test.mjs
 * LICENCED DASL-1.0 (c) Clove Twilight
 */

import assert from "node:assert/strict";
import { fileLanguage, highlightCode } from "../src/lib/server/highlight.ts";

assert.equal(fileLanguage("bin/start", "#!/bin/sh\nexit 0"), "bash");
assert.equal(fileLanguage("bin/task", "#!/usr/bin/env node\n"), "javascript");
assert.equal(fileLanguage("tool.unknown", "#!/usr/bin/env -S python3.14 -u\r\n"), "python");
assert.equal(fileLanguage("tool", "#!/usr/bin/env -S MODE=dev /opt/bin/lua5.4\n"), "lua");
assert.equal(fileLanguage("tool", "#!/usr/bin/env -S -u MODE -- ruby\n"), "ruby");
assert.equal(fileLanguage("config.jp", "#!/usr/bin/env node\n"), "jpcl");
assert.equal(fileLanguage("tool", "#!/usr/bin/env unsupported\n"), undefined);
assert.equal(fileLanguage("tool", "plain text\n#!/bin/sh\n"), undefined);

const python = "#!/usr/bin/python3\nif True:\n    print('hello')\n";
assert.match(highlightCode(python, fileLanguage("bin/hello", python)), /hljs-keyword/);
