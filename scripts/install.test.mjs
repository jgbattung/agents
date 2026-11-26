import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { install } from './install.mjs';

function tempDir() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'install-test-')));
}

// A minimal repository with one agent, one skill, one command, and AGENTS.md.
function fakeRepo() {
  const repo = tempDir();
  fs.mkdirSync(path.join(repo, 'agents'));
  fs.mkdirSync(path.join(repo, 'skills', 'alpha'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'skills', 'not-a-skill'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'commands'));
  fs.writeFileSync(path.join(repo, 'agents', 'builder.md'), 'agent');
  fs.writeFileSync(path.join(repo, 'skills', 'alpha', 'SKILL.md'), 'skill');
  fs.writeFileSync(path.join(repo, 'commands', 'builder.md'), 'command');
  fs.writeFileSync(path.join(repo, 'AGENTS.md'), 'instructions');
  return repo;
}

test('links each agent, skill, and command individually into the target', () => {
  const repo = fakeRepo();
  const targetRoot = path.join(tempDir(), '.claude');

  install({ repo, targetRoot, scope: 'project' });

  // The containing folders are real directories, so other tools can add
  // their own files there without writing into the repository.
  for (const folder of ['agents', 'skills', 'commands']) {
    assert.equal(fs.lstatSync(path.join(targetRoot, folder)).isSymbolicLink(), false);
  }
  assert.equal(fs.readlinkSync(path.join(targetRoot, 'agents', 'builder.md')), path.join(repo, 'agents', 'builder.md'));
  assert.equal(fs.readlinkSync(path.join(targetRoot, 'skills', 'alpha')), path.join(repo, 'skills', 'alpha'));
  assert.equal(fs.readlinkSync(path.join(targetRoot, 'commands', 'builder.md')), path.join(repo, 'commands', 'builder.md'));
  assert.equal(fs.readFileSync(path.join(targetRoot, 'skills', 'alpha', 'SKILL.md'), 'utf8'), 'skill');
  // A folder without SKILL.md is not a skill, and project scope links no global instructions file.
  assert.deepEqual(fs.readdirSync(path.join(targetRoot, 'skills')), ['alpha']);
  assert.equal(fs.existsSync(path.join(targetRoot, 'CLAUDE.md')), false);
});

test('global scope links AGENTS.md as the instructions file', () => {
  const repo = fakeRepo();
  const targetRoot = path.join(tempDir(), '.claude');

  install({ repo, targetRoot, scope: 'global' });

  assert.equal(fs.readlinkSync(path.join(targetRoot, 'CLAUDE.md')), path.join(repo, 'AGENTS.md'));
});

test('never overwrites an existing path and reports it as skipped', () => {
  const repo = fakeRepo();
  const targetRoot = path.join(tempDir(), '.claude');
  fs.mkdirSync(path.join(targetRoot, 'agents'), { recursive: true });
  fs.writeFileSync(path.join(targetRoot, 'agents', 'builder.md'), 'mine');
  fs.writeFileSync(path.join(targetRoot, 'CLAUDE.md'), 'my instructions');

  const results = install({ repo, targetRoot, scope: 'global' });

  assert.equal(fs.readFileSync(path.join(targetRoot, 'agents', 'builder.md'), 'utf8'), 'mine');
  assert.equal(fs.readFileSync(path.join(targetRoot, 'CLAUDE.md'), 'utf8'), 'my instructions');
  const skipped = results.filter((r) => r.action === 'skipped').map((r) => path.relative(targetRoot, r.dest));
  assert.deepEqual(skipped.sort(), ['CLAUDE.md', path.join('agents', 'builder.md')]);
});

test('refuses to link into a folder that is itself a symlink to somewhere else', () => {
  const repo = fakeRepo();
  const targetRoot = path.join(tempDir(), '.claude');
  const elsewhere = tempDir();
  fs.mkdirSync(targetRoot, { recursive: true });
  fs.symlinkSync(elsewhere, path.join(targetRoot, 'skills'), 'dir');

  const results = install({ repo, targetRoot, scope: 'project' });

  assert.deepEqual(fs.readdirSync(elsewhere), []);
  const skill = results.find((r) => r.dest.endsWith(path.join('skills', 'alpha')));
  assert.equal(skill.action, 'skipped');
});

test('a dry run changes nothing', () => {
  const repo = fakeRepo();
  const parent = tempDir();
  const targetRoot = path.join(parent, '.claude');

  const results = install({ repo, targetRoot, scope: 'global', dryRun: true });

  assert.deepEqual(fs.readdirSync(parent), []);
  assert.equal(results.length, 4);
  assert.ok(results.every((r) => r.action === 'would-link'));
});

test('running twice reports existing links instead of failing', () => {
  const repo = fakeRepo();
  const targetRoot = path.join(tempDir(), '.claude');

  install({ repo, targetRoot, scope: 'project' });
  const second = install({ repo, targetRoot, scope: 'project' });

  assert.ok(second.every((r) => r.action === 'already-linked'));
});
