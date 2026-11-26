#!/usr/bin/env node
// Links this repository's agents, skills, and commands into a provider's
// configuration folder, one item at a time.
//
// Items are linked individually (never whole directories) so that files other
// tools install into those folders do not end up inside this repository.
// Nothing is ever overwritten: an existing path is reported and skipped.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function exists(p) {
  // lstat, not stat: a broken symlink still occupies the path.
  try {
    fs.lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

function isSymlink(p) {
  try {
    return fs.lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}

function markdownFiles(dir) {
  if (!exists(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => e.name)
    .sort();
}

function skillFolders(dir) {
  if (!exists(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && exists(path.join(dir, e.name, 'SKILL.md')))
    .map((e) => e.name)
    .sort();
}

/** Lists every link the install would create, without touching the disk. */
export function planLinks({ repo = REPO_ROOT, targetRoot, scope }) {
  const links = [];
  for (const name of markdownFiles(path.join(repo, 'agents'))) {
    links.push({ src: path.join(repo, 'agents', name), dest: path.join(targetRoot, 'agents', name), type: 'file' });
  }
  for (const name of skillFolders(path.join(repo, 'skills'))) {
    links.push({ src: path.join(repo, 'skills', name), dest: path.join(targetRoot, 'skills', name), type: 'dir' });
  }
  for (const name of markdownFiles(path.join(repo, 'commands'))) {
    links.push({ src: path.join(repo, 'commands', name), dest: path.join(targetRoot, 'commands', name), type: 'file' });
  }
  if (scope === 'global') {
    links.push({ src: path.join(repo, 'AGENTS.md'), dest: path.join(targetRoot, 'CLAUDE.md'), type: 'file' });
  }
  return links;
}

/**
 * Creates the links. Returns one result per link:
 * { src, dest, action: 'linked' | 'would-link' | 'already-linked' | 'skipped', reason? }
 */
export function install({ repo = REPO_ROOT, targetRoot, scope, dryRun = false }) {
  const results = [];
  for (const link of planLinks({ repo, targetRoot, scope })) {
    const parent = path.dirname(link.dest);

    // A parent that is itself a symlink points somewhere else (often another
    // repository). Linking into it would write files there, so refuse.
    if (parent !== targetRoot && isSymlink(parent)) {
      results.push({
        ...link,
        action: 'skipped',
        reason: `${parent} is a symlink to ${fs.readlinkSync(parent)}; remove that link first`,
      });
      continue;
    }

    if (exists(link.dest)) {
      const same = isSymlink(link.dest) && path.resolve(parent, fs.readlinkSync(link.dest)) === link.src;
      results.push(same ? { ...link, action: 'already-linked' } : { ...link, action: 'skipped', reason: 'path already exists' });
      continue;
    }

    if (dryRun) {
      results.push({ ...link, action: 'would-link' });
      continue;
    }

    fs.mkdirSync(parent, { recursive: true });
    fs.symlinkSync(link.src, link.dest, link.type);
    results.push({ ...link, action: 'linked' });
  }
  return results;
}

function main() {
  const { values } = parseArgs({
    options: {
      provider: { type: 'string', default: 'claude' },
      scope: { type: 'string', default: 'global' },
      project: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });

  if (values.help) {
    process.stdout.write(
      'Usage: node scripts/install.mjs [--provider claude] [--scope global | --project <path>] [--dry-run]\n',
    );
    return 0;
  }
  if (values.provider !== 'claude') {
    process.stderr.write(`Unsupported provider "${values.provider}". Supported: claude\n`);
    return 2;
  }
  if (!values.project && values.scope !== 'global') {
    process.stderr.write('Use --scope global, or --project <path> for a project-scope install.\n');
    return 2;
  }

  const scope = values.project ? 'project' : 'global';
  const targetRoot = values.project
    ? path.join(path.resolve(values.project), '.claude')
    : path.join(os.homedir(), '.claude');

  const results = install({ targetRoot, scope, dryRun: values['dry-run'] });
  for (const r of results) {
    const note = r.reason ? ` (${r.reason})` : '';
    process.stdout.write(`${r.action.padEnd(14)} ${r.dest}${note}\n`);
  }
  const count = (action) => results.filter((r) => r.action === action).length;
  process.stdout.write(
    `\n${count('linked')} linked, ${count('would-link')} would link, ` +
      `${count('already-linked')} already linked, ${count('skipped')} skipped\n`,
  );
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
