#!/usr/bin/env node
// Mechanical quality gates for a feature branch.
//
// Run from the repository root of the project being checked:
//   node gates.mjs --base <branch> [--test "<cmd>"] [--lint "<cmd>"]
//                  [--protected <path,path>] [--notes <notes.md>] [--json]
//
// Exit code: 0 when no check failed (warnings allowed), 1 when any check
// failed, 2 on a usage error.
//
// Patterns that this file itself would match are assembled from parts, so the
// script can be run against a branch that contains it.

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const OUTPUT_TAIL_LINES = 40;

// Skip markers only count in test files; `.skip(` is a normal method name elsewhere.
const TEST_FILE = /(^|\/)(tests?|__tests__|specs?|e2e)\/|\.(test|spec)\.[^./]+$|(^|\/)test_[^/]+\.py$|_test\.(py|go)$/;
const SKIP_MARKER = new RegExp(
  [
    '\\.(?:sk' + 'ip|on' + 'ly)\\b',
    '\\b(?:it|test)\\.to' + 'do\\b',
    '\\bx(?:it|describe|test)\\s*\\(',
    'pytest\\.sk' + 'ip',
    '@pytest\\.mark\\.sk' + 'ip',
    '@unittest\\.sk' + 'ip',
  ].join('|'),
);

// Debug leftovers are not checked in prose and data files, where the words are ordinary text.
const PROSE_FILE = /\.(md|mdx|txt|rst|xml|html|json|ya?ml|csv|lock)$/i;
const DEBUG_LEFTOVERS = [
  { label: 'console output', pattern: new RegExp('\\bconsole\\.' + 'log\\s*\\(') },
  { label: 'debugger statement', pattern: new RegExp('^\\s*debug' + 'ger\\s*;?\\s*$') },
  { label: 'unresolved marker', pattern: new RegExp('\\b(?:TO' + 'DO|FIX' + 'ME)\\b') },
];

// Rule Zero of the git-standards skill.
const ATTRIBUTION = [
  /co-authored-by:.*\b(claude|anthropic|copilot|openai|chatgpt|gpt|gemini|cursor|codex|ai)\b/i,
  /generated (with|by) .*(claude|copilot|chatgpt|gpt|gemini|cursor|codex|\bai\b)/i,
  /claude-session/i,
  /claude\.ai\/code\/session_/i,
  /\bai-assisted\b/i,
  /written by ai\b/i,
];

const PROTECTED_DEFAULTS = [
  /^\.github\/workflows\//,
  /(^|\/)Dockerfile[^/]*$/,
  /(^|\/)docker-compose[^/]*\.ya?ml$/,
  /(^|\/)(package|package-lock)\.json$/,
  /(^|\/)(yarn\.lock|pnpm-lock\.yaml|bun\.lockb?)$/,
  /(^|\/)(pyproject\.toml|poetry\.lock|Pipfile|Pipfile\.lock|requirements[^/]*\.txt)$/,
  /(^|\/)(Cargo\.(toml|lock)|go\.(mod|sum)|Gemfile|Gemfile\.lock)$/,
  /(^|\/)tsconfig[^/]*\.json$/,
  /(^|\/)(vite|webpack|rollup|babel|eslint|prettier)\.config\.[^/]+$/,
  /(^|\/)\.(eslintrc|prettierrc|babelrc)[^/]*$/,
];

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function refExists(ref, cwd) {
  try {
    git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], cwd);
    return true;
  } catch {
    return false;
  }
}

/** Lines the branch added, as { file, line, text }, from a zero-context diff. */
export function parseAddedLines(diff) {
  const added = [];
  let file = null;
  let line = 0;
  for (const raw of diff.split('\n')) {
    if (raw.startsWith('+++ ')) {
      file = raw === '+++ /dev/null' ? null : raw.slice(4).replace(/^b\//, '');
    } else if (raw.startsWith('@@')) {
      const match = /\+(\d+)/.exec(raw);
      line = match ? Number(match[1]) : 0;
    } else if (raw.startsWith('+') && file) {
      added.push({ file, line, text: raw.slice(1) });
      line += 1;
    }
  }
  return added;
}

function runCommand(command, cwd) {
  const result = spawnSync(command, { cwd, shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const output = `${result.stdout || ''}${result.stderr || ''}`.trimEnd();
  return { ok: result.status === 0, tail: output.split('\n').slice(-OUTPUT_TAIL_LINES).join('\n') };
}

/** Runs every gate and returns { passed, failures, warnings }. */
export function runGates({ cwd = process.cwd(), base, test, lint, protectedPaths = [] }) {
  const failures = [];
  const warnings = [];

  if (test && test !== 'none') {
    const result = runCommand(test, cwd);
    if (!result.ok) {
      failures.push({
        check: 'test',
        title: 'Test command failed',
        severity: 'blocker',
        route: 'architect',
        where: 'n/a',
        detail: `\`${test}\` exited non-zero. Last output:\n${result.tail}`,
      });
    }
  }

  if (lint && lint !== 'none') {
    const result = runCommand(lint, cwd);
    if (!result.ok) {
      failures.push({
        check: 'lint',
        title: 'Lint command failed',
        severity: 'important',
        route: 'direct',
        where: 'n/a',
        detail: `\`${lint}\` exited non-zero. Last output:\n${result.tail}`,
      });
    }
  }

  // Three dots: only what this branch added, even when the base has moved ahead.
  const added = parseAddedLines(git(['diff', '--unified=0', '--no-color', `${base}...HEAD`], cwd));
  for (const { file, line, text } of added) {
    if (TEST_FILE.test(file) && SKIP_MARKER.test(text)) {
      failures.push({
        check: 'skip-marker',
        title: `Skip marker introduced in ${file}`,
        severity: 'important',
        route: 'qa',
        where: `${file}:${line}`,
        detail: `This branch added a skipped, focused, or pending test: \`${text.trim()}\``,
      });
    }
    if (!PROSE_FILE.test(file)) {
      for (const { label, pattern } of DEBUG_LEFTOVERS) {
        if (pattern.test(text)) {
          failures.push({
            check: 'debug-leftover',
            title: `Debug leftover (${label}) in ${file}`,
            severity: 'blocker',
            route: 'direct',
            where: `${file}:${line}`,
            detail: `This branch added: \`${text.trim()}\``,
          });
        }
      }
    }
  }

  const commits = git(['log', `${base}..HEAD`, '--format=%H%x1f%B%x1e'], cwd)
    .split('\x1e')
    .map((entry) => entry.trim())
    .filter(Boolean);
  for (const entry of commits) {
    const [hash, message = ''] = entry.split('\x1f');
    const offending = message.split('\n').find((messageLine) => ATTRIBUTION.some((p) => p.test(messageLine)));
    if (offending) {
      failures.push({
        check: 'ai-attribution',
        title: `AI attribution in commit ${hash.slice(0, 7)}`,
        severity: 'blocker',
        route: 'user',
        where: `commit ${hash}`,
        detail: `Commit message line: \`${offending.trim()}\`. The history must be rewritten by the user.`,
      });
    }
  }

  const changed = git(['diff', '--name-only', `${base}...HEAD`], cwd).split('\n').filter(Boolean);
  const extra = protectedPaths.map((p) => p.replace(/\/+$/, ''));
  for (const file of changed) {
    const isProtected =
      PROTECTED_DEFAULTS.some((p) => p.test(file)) || extra.some((p) => file === p || file.startsWith(`${p}/`));
    if (isProtected) {
      warnings.push({ check: 'protected-file', where: file, detail: `Sensitive file changed: ${file}` });
    }
  }

  // Compare against the remote copy of the base when there is one; the local
  // base branch is often stale. The fetch is best effort (offline is fine).
  let freshnessRef = base;
  if (!base.includes('/') && refExists(`origin/${base}`, cwd)) {
    try {
      git(['fetch', '--quiet', 'origin', base], cwd);
    } catch {
      /* offline or no access: compare against what is already here */
    }
    freshnessRef = `origin/${base}`;
  }
  const behind = Number(git(['rev-list', '--count', `HEAD..${freshnessRef}`], cwd).trim());
  if (behind > 0) {
    warnings.push({
      check: 'branch-freshness',
      where: freshnessRef,
      detail: `${freshnessRef} is ${behind} commit(s) ahead of this branch. A rebase may be needed.`,
    });
  }

  return { passed: failures.length === 0, failures, warnings };
}

function formatFinding(number, failure) {
  return [
    `### F${number} - ${failure.title}`,
    '- source: gates',
    `- severity: ${failure.severity}`,
    `- route: ${failure.route}`,
    `- where: ${failure.where}`,
    `- proof: gate check ${failure.check}`,
    '- status: open',
    `- detail: ${failure.detail.replace(/\n/g, '\n  ')}`,
  ].join('\n');
}

/**
 * Appends each failure to the `## Findings` section of the notes file.
 * A failure that is already recorded as an open finding is not added again.
 * Returns the finding numbers written.
 */
export function appendFindings(notesPath, failures) {
  let text = fs.existsSync(notesPath) ? fs.readFileSync(notesPath, 'utf8') : '';
  if (!/^## Findings\s*$/m.test(text)) {
    text = `${text.trimEnd()}${text.trim() ? '\n\n' : ''}## Findings\n`;
  }

  const lines = text.split('\n');
  const start = lines.findIndex((l) => /^## Findings\s*$/.test(l));
  let end = lines.findIndex((l, i) => i > start && /^## /.test(l));
  if (end === -1) end = lines.length;

  const openEntries = text
    .split(/^(?=### F\d+ - )/m)
    .filter((block) => /^### F\d+ - /.test(block) && /^- status: open\s*$/m.test(block));
  const isRecorded = (failure) =>
    openEntries.some(
      (block) => block.includes(`- where: ${failure.where}\n`) && block.includes(`- proof: gate check ${failure.check}\n`),
    );

  let next = Math.max(0, ...[...text.matchAll(/^### F(\d+) - /gm)].map((m) => Number(m[1]))) + 1;
  const written = [];
  const blocks = [];
  for (const failure of failures) {
    if (isRecorded(failure)) continue;
    blocks.push(formatFinding(next, failure));
    written.push(next);
    next += 1;
  }
  if (blocks.length === 0) return written;

  const section = lines.slice(start, end).join('\n').trimEnd();
  const rest = lines.slice(end).join('\n');
  const updated = [
    lines.slice(0, start).join('\n'),
    `${section}\n\n${blocks.join('\n\n')}\n`,
    rest ? `\n${rest}` : '',
  ].join(start > 0 ? '\n' : '');
  fs.writeFileSync(notesPath, updated.endsWith('\n') ? updated : `${updated}\n`);
  return written;
}

function main() {
  let values;
  try {
    ({ values } = parseArgs({
      options: {
        base: { type: 'string' },
        test: { type: 'string' },
        lint: { type: 'string' },
        protected: { type: 'string' },
        notes: { type: 'string' },
        json: { type: 'boolean', default: false },
      },
    }));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 2;
  }
  if (!values.base) {
    process.stderr.write('Missing --base <branch>.\n');
    return 2;
  }
  const cwd = process.cwd();
  if (!refExists(values.base, cwd)) {
    process.stderr.write(`Base branch "${values.base}" does not exist in this repository.\n`);
    return 2;
  }

  const result = runGates({
    cwd,
    base: values.base,
    test: values.test,
    lint: values.lint,
    protectedPaths: values.protected ? values.protected.split(',').map((p) => p.trim()).filter(Boolean) : [],
  });
  const findings = values.notes ? appendFindings(path.resolve(values.notes), result.failures) : [];

  if (values.json) {
    process.stdout.write(`${JSON.stringify({ ...result, findings }, null, 2)}\n`);
  } else {
    const out = [`Gates: ${result.passed ? 'PASSED' : 'FAILED'}`];
    for (const f of result.failures) out.push(`  FAIL  [${f.check}] ${f.where} - ${f.title} (route: ${f.route})`);
    for (const w of result.warnings) out.push(`  WARN  [${w.check}] ${w.detail}`);
    if (values.notes) out.push(`  ${findings.length} finding(s) written to ${values.notes}`);
    process.stdout.write(`${out.join('\n')}\n`);
  }
  return result.passed ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
