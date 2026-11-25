/* src/lib/server/highlight.ts
 * LICENCED DASL-1.0 (c) Clove Twilight
 */

import hljs from "highlight.js";
import jpcl from "jpcl-lang/highlightjs";

const MAX_HIGHLIGHT_LENGTH = 128 * 1024;

hljs.registerLanguage("jpcl", jpcl);

export const highlightLanguages = hljs.listLanguages().sort();

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

export function fileLanguage(path: string): string | undefined {
  const filename = (path.split("/").pop() ?? "").toLowerCase();
  const extension = /\.([^.]+)$/.exec(filename)?.[1];

  return FILE_LANGUAGES.get(filename)
    ?? (extension && (EXTENSION_LANGUAGES.get(extension) ?? extension));
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
