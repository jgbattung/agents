import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'gates.mjs');

// Fixture text is assembled from parts so the gates do not flag this file
// when they run against a branch that contains it.
const SKIPPED_TEST = "it.sk" + "ip('adds numbers', () => {});";
const CONSOLE_CALL = 'console.' + "log('debugging');";
const MARKER_COMMENT = '// TO' + 'DO: remove this';
const ATTRIBUTION_TRAILER = 'Co-Authored-' + 'By: Claude <noreply@example.com>';

const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'Test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'Test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
  GIT_CONFIG_GLOBAL: os.devNull,
  GIT_CONFIG_SYSTEM: os.devNull,
};

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, env: GIT_ENV, encoding: 'utf8' });
}

function write(cwd, file, content) {
  fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
  fs.writeFileSync(path.join(cwd, file), content);
}

function commit(cwd, message) {
  git(cwd, 'add', '-A');
  git(cwd, 'commit', '-q', '-m', message);
}

// A repository with one commit on `main` and a checked-out `feature` branch.
function repo(baseFiles = { 'src/app.js': 'export const one = 1;\n' }) {
  const cwd = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'gates-test-')));
  git(cwd, 'init', '-q', '-b', 'main');
  for (const [file, content] of Object.entries(baseFiles)) write(cwd, file, content);
  commit(cwd, 'chore: base');
  git(cwd, 'checkout', '-q', '-b', 'feature');
  return cwd;
}

function gates(cwd, ...args) {
  const result = spawnSync(process.execPath, [SCRIPT, '--base', 'main', '--json', ...args], {
    cwd,
    env: GIT_ENV,
    encoding: 'utf8',
  });
  return { status: result.status, ...JSON.parse(result.stdout) };
}

function checks(result) {
  return result.failures.map((f) => f.check);
}

test('runs its checks when called through a symlinked skill folder', () => {
  const cwd = repo();
  write(cwd, 'src/app.js', `${CONSOLE_CALL}\n`);
  commit(cwd, 'feat: add output');
  // The installed layout: the skill folder is a symlink, and the script is called through it.
  const installed = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'gates-link-'))), 'gates');
  fs.symlinkSync(path.dirname(path.dirname(SCRIPT)), installed, 'dir');

  const result = spawnSync(process.execPath, [path.join(installed, 'scripts', 'gates.mjs'), '--base', 'main'], {
    cwd,
    env: GIT_ENV,
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /^Gates: FAILED/);
});

test('passes with exit 0 when the commands succeed and the branch is clean', () => {
  const cwd = repo();
  write(cwd, 'src/app.js', 'export const one = 1;\nexport const two = 2;\n');
  commit(cwd, 'feat: add two');

  const result = gates(cwd, '--test', 'exit 0', '--lint', 'exit 0');

  assert.equal(result.status, 0);
  assert.equal(result.passed, true);
  assert.deepEqual(result.failures, []);
});

test('exits 1 and names the check when the test or lint command fails', () => {
  const cwd = repo();
  write(cwd, 'src/app.js', 'export const one = 2;\n');
  commit(cwd, 'feat: change one');

  const result = gates(cwd, '--test', 'echo "1 failing"; exit 3', '--lint', 'exit 1');

  assert.equal(result.status, 1);
  assert.deepEqual(checks(result), ['test', 'lint']);
  assert.match(result.failures[0].detail, /1 failing/);
  assert.equal(result.failures[0].route, 'architect');
  assert.equal(result.failures[1].route, 'direct');
});

test('flags a skip marker and a debug leftover only on lines the branch added', () => {
  const cwd = repo({
    // Present before the branch: must not be flagged.
    'src/app.test.js': `${SKIPPED_TEST}\n`,
    'src/app.js': `${CONSOLE_CALL}\n`,
  });
  write(cwd, 'src/app.test.js', `${SKIPPED_TEST}\nit('works', () => {});\n${SKIPPED_TEST}\n`);
  write(cwd, 'src/app.js', `${CONSOLE_CALL}\nexport const two = 2;\n${CONSOLE_CALL}\n${MARKER_COMMENT}\n`);
  commit(cwd, 'feat: add two');

  const result = gates(cwd);

  assert.equal(result.status, 1);
  assert.deepEqual(
    result.failures.map((f) => `${f.check} ${f.where} ${f.route}`).sort(),
    ['debug-leftover src/app.js:3 direct', 'debug-leftover src/app.js:4 direct', 'skip-marker src/app.test.js:3 qa'],
  );
});

test('does not treat a skip method in source code or debug words in prose as hits', () => {
  const cwd = repo();
  write(cwd, 'src/stream.js', 'reader.sk' + 'ip(4);\n');
  write(cwd, 'docs/guide.md', `Remove every ${CONSOLE_CALL} and ${MARKER_COMMENT}\n`);
  commit(cwd, 'feat: add stream');

  const result = gates(cwd);

  assert.equal(result.status, 0);
  assert.deepEqual(result.failures, []);
});

test('flags AI attribution in a branch commit message and routes it to the user', () => {
  const cwd = repo();
  write(cwd, 'src/app.js', 'export const one = 3;\n');
  git(cwd, 'add', '-A');
  git(cwd, 'commit', '-q', '-m', 'feat: change one', '-m', ATTRIBUTION_TRAILER);

  const result = gates(cwd);

  assert.equal(result.status, 1);
  assert.deepEqual(checks(result), ['ai-attribution']);
  assert.equal(result.failures[0].route, 'user');
});

test('reports protected-file changes and a moved base as warnings without failing', () => {
  const cwd = repo();
  write(cwd, 'package.json', '{}\n');
  write(cwd, 'infra/deploy.tf', 'resource {}\n');
  commit(cwd, 'chore: add manifest');
  git(cwd, 'checkout', '-q', 'main');
  write(cwd, 'README.md', 'moved\n');
  commit(cwd, 'docs: move base ahead');
  git(cwd, 'checkout', '-q', 'feature');

  const result = gates(cwd, '--protected', 'infra');

  assert.equal(result.status, 0);
  assert.equal(result.passed, true);
  assert.deepEqual(
    result.warnings.map((w) => `${w.check} ${w.where}`).sort(),
    ['branch-freshness main', 'protected-file infra/deploy.tf', 'protected-file package.json'],
  );
});

test('--notes appends findings in the finding format, numbered after existing ones', () => {
  const cwd = repo();
  write(cwd, 'src/app.js', `export const one = 1;\n${CONSOLE_CALL}\n`);
  commit(cwd, 'feat: add output');
  const notes = path.join(cwd, 'notes.md');
  fs.writeFileSync(
    notes,
    [
      '## Decisions',
      'Chose the simple approach.',
      '',
      '## Findings',
      '',
      '### F1 - Earlier finding',
      '- source: qa',
      '- status: resolved (abc1234)',
      '',
      '## Test Ledger',
      'One test.',
      '',
    ].join('\n'),
  );

  const first = gates(cwd, '--notes', notes);
  const second = gates(cwd, '--notes', notes);
  const text = fs.readFileSync(notes, 'utf8');

  assert.deepEqual(first.findings, [2]);
  // The same open finding is not recorded twice on a re-run.
  assert.deepEqual(second.findings, []);
  const expected = [
    '### F2 - Debug leftover (console output) in src/app.js',
    '- source: gates',
    '- severity: blocker',
    '- route: direct',
    '- where: src/app.js:2',
    '- proof: gate check debug-leftover',
    '- status: open',
    `- detail: This branch added: \`${CONSOLE_CALL}\``,
  ].join('\n');
  assert.ok(text.includes(expected), text);
  // The finding lands inside the Findings section, and the other sections survive.
  assert.ok(text.indexOf('### F1') < text.indexOf('### F2'));
  assert.ok(text.indexOf('### F2') < text.indexOf('## Test Ledger'));
  assert.ok(text.startsWith('## Decisions\nChose the simple approach.\n'));
  assert.ok(text.trimEnd().endsWith('One test.'));
});

test('--notes creates the file and the Findings section when they are missing', () => {
  const cwd = repo();
  write(cwd, 'src/app.js', `${CONSOLE_CALL}\n`);
  commit(cwd, 'feat: add output');
  const notes = path.join(cwd, 'notes.md');

  gates(cwd, '--notes', notes);

  assert.match(fs.readFileSync(notes, 'utf8'), /^## Findings\n\n### F1 - Debug leftover/);
});
