/* src/lib/server/highlight.ts
 * LICENCED DASL-1.0 (c) Clove Twilight
 */

import hljs from "highlight.js";
import jpcl from "jpcl-lang/highlightjs";

const MAX_HIGHLIGHT_LENGTH = 128 * 1024;

hljs.registerLanguage("jpcl", jpcl);

const FILE_LANGUAGES = new Map([
  [".editorconfig", "ini"],
  [".gitconfig", "ini"],
  [".zshrc", "bash"],
  [".bashrc", "bash"],
  ["containerfile", "dockerfile"],
  ["dockerfile", "dockerfile"],
  ["gemfile", "ruby"],
  ["makefile", "makefile"],
  ["rakefile", "ruby"],
]);

const EXTENSION_LANGUAGES = new Map([
  ["astro", "xml"],
  ["bash", "bash"],
  ["h", "c"],
  ["hpp", "cpp"],
  ["jp", "jpcl"],
  ["mdown", "markdown"],
  ["mkd", "markdown"],
  ["mkdn", "markdown"],
  ["rs", "rust"],
  ["svelte", "xml"],
  ["vue", "xml"],
  ["zsh", "bash"],
]);

const INTERPRETER_LANGUAGES = new Map([
  ["awk", "awk"],
  ["bash", "bash"],
  ["bun", "javascript"],
  ["dash", "bash"],
  ["gawk", "awk"],
  ["groovy", "groovy"],
  ["ksh", "bash"],
  ["lua", "lua"],
  ["luajit", "lua"],
  ["mawk", "awk"],
  ["node", "javascript"],
  ["nodejs", "javascript"],
  ["perl", "perl"],
  ["php", "php"],
  ["pwsh", "powershell"],
  ["pypy", "python"],
  ["python", "python"],
  ["Rscript", "r"],
  ["ruby", "ruby"],
  ["sh", "bash"],
  ["tclsh", "tcl"],
  ["zsh", "bash"],
]);

function shebangLanguage(text: string): string | undefined {
  if (!text.startsWith("#!")) return undefined;

  const firstLine = text.slice(2, 512).split(/\r?\n/, 1)[0] ?? "";
  const words = firstLine.match(/[^ \t]+/g) ?? [];
  let command = words[0]?.split("/").pop();

  if (command === "env") {
    let index = 1;
    while (index < words.length) {
      const word = words[index++];
      if (word === "--") break;
      if (word === "-S" || word === "--split-string" || word === "-i" || word === "--ignore-environment") {
        continue;
      }
      if (word === "-u" || word === "--unset") {
        index++;
        continue;
      }
      if (/^[A-Za-z_]\w*=/.test(word ?? "")) continue;
      index--;
      break;
    }
    command = words[index]?.split("/").pop();
  }

  return command && INTERPRETER_LANGUAGES.get(command.replace(/\d+(?:\.\d+)*$/, ""));
}

export function fileLanguage(path: string, text: string): string | undefined {
  const filename = (path.split("/").pop() ?? "").toLowerCase();
  const extension = /\.([^.]+)$/.exec(filename)?.[1];

  const namedLanguage = FILE_LANGUAGES.get(filename)
    ?? (extension && (EXTENSION_LANGUAGES.get(extension) ?? extension));
  if (namedLanguage && hljs.getLanguage(namedLanguage)) return namedLanguage;

  return shebangLanguage(text);
}

export function highlightCode(text: string, language?: string): string | null {
  if (!language || text.length > MAX_HIGHLIGHT_LENGTH) return null;

  const grammar = language.toLowerCase();
  if (!/^[a-z0-9_+.-]+$/.test(grammar)) return null;
  if (!hljs.getLanguage(grammar)) return null;

  return hljs.highlight(text, {
    language: grammar,
    ignoreIllegals: true,
  }).value;
}
