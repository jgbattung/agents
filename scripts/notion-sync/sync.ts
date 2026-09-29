// One-way mirror of a project's backlog/ ticket files into the Notion Tasks database.
// Markdown is the source of truth: rows are created or overwritten to match the files,
// never deleted. Safe to re-run; unchanged rows cost no writes.
//
// Usage: node sync.ts <project-root> [--dry-run]
// Needs NOTION_TOKEN (internal integration "backlog-sync") in the environment.

import { Client, collectPaginatedAPI, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { parse } from "yaml";

const DATA_SOURCE_ID = "d8deea3f-48c5-4f86-8c5e-4d2c433ba57c";
const WRITE_GAP_MS = 350; // Notion allows ~3 requests/second
const PROJECTS = new Set(["ledger", "money-map"]); // must match the Project select options

type Row = {
  id: string;
  title: string;
  project: string;
  epic: string | null;
  status: string;
  priority: string | null;
  type: string;
  review: boolean;
};

function readTickets(root: string): Row[] {
  const project = basename(root);
  const gsd = join(root, ".gsd");
  const hasReview = (slug: string) =>
    existsSync(join(gsd, `${slug}-review.md`)) || existsSync(join(gsd, "archive", `${slug}-review.md`));

  const rows: Row[] = [];
  for (const dir of [join(root, "backlog"), join(root, "backlog", "archive")]) {
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      const match = file.match(/^([A-Z]+-\d{3})-(.+)\.md$/);
      if (!match) continue; // skips ROADMAP.md and anything not named {ID}-{slug}.md
      const text = readFileSync(join(dir, file), "utf8");
      const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!fm) throw new Error(`${file}: no frontmatter`);
      const data = parse(fm[1]);
      rows.push({
        id: data.id,
        title: data.title,
        project,
        epic: data.epic ?? null,
        status: data.status,
        priority: data.priority ?? null,
        type: data.type,
        review: hasReview(match[2]),
      });
    }
  }
  return rows;
}

function toProperties(row: Row) {
  const select = (name: string | null) => ({ select: name ? { name } : null });
  return {
    Title: { title: [{ text: { content: row.title } }] },
    ID: { rich_text: [{ text: { content: row.id } }] },
    Project: select(row.project),
    Epic: select(row.epic),
    Status: select(row.status),
    Priority: select(row.priority),
    Type: select(row.type),
    Review: { checkbox: row.review },
  };
}

function fromPage(page: PageObjectResponse): Row {
  const p = page.properties;
  const text = (prop: (typeof p)[string]) =>
    prop.type === "title" ? prop.title.map((t) => t.plain_text).join("")
    : prop.type === "rich_text" ? prop.rich_text.map((t) => t.plain_text).join("")
    : "";
  const select = (prop: (typeof p)[string]) => (prop.type === "select" ? (prop.select?.name ?? null) : null);
  return {
    id: text(p.ID),
    title: text(p.Title),
    project: select(p.Project) ?? "",
    epic: select(p.Epic),
    status: select(p.Status) ?? "",
    priority: select(p.Priority),
    type: select(p.Type) ?? "",
    review: p.Review.type === "checkbox" && p.Review.checkbox,
  };
}

const sameRow = (a: Row, b: Row) => (Object.keys(a) as (keyof Row)[]).every((k) => a[k] === b[k]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const rootArg = args.find((a) => !a.startsWith("--"));
  if (!rootArg) throw new Error("Usage: node sync.ts <project-root> [--dry-run]");
  const root = resolve(rootArg);
  const project = basename(root);
  if (!PROJECTS.has(project)) {
    console.log(`notion-sync: ${project} is not mirrored to Notion; skipped`);
    return;
  }
  if (!process.env.NOTION_TOKEN) throw new Error("NOTION_TOKEN is not set");

  const tickets = readTickets(root);
  const notion = new Client({ auth: process.env.NOTION_TOKEN });

  const pages = (
    await collectPaginatedAPI(notion.dataSources.query, {
      data_source_id: DATA_SOURCE_ID,
      filter: { property: "Project", select: { equals: project } },
    })
  ).filter(isFullPage);
  const existing = new Map(pages.map((page) => [fromPage(page).id, page]));

  let created = 0, updated = 0, unchanged = 0;
  for (const row of tickets) {
    const page = existing.get(row.id);
    existing.delete(row.id);
    if (page && sameRow(fromPage(page), row)) {
      unchanged++;
      continue;
    }
    console.log(`${page ? "update" : "create"} ${row.id} ${row.title}`);
    if (page) updated++;
    else created++;
    if (dryRun) continue;
    if (page) await notion.pages.update({ page_id: page.id, properties: toProperties(row) });
    else await notion.pages.create({ parent: { data_source_id: DATA_SOURCE_ID }, properties: toProperties(row) });
    await sleep(WRITE_GAP_MS);
  }

  for (const id of existing.keys()) console.log(`orphan ${id} (in Notion, no ticket file; left alone)`);
  console.log(
    `${dryRun ? "[dry run] " : ""}${project}: ${created} created, ${updated} updated, ${unchanged} unchanged, ${existing.size} orphans`,
  );
}

main().catch((err) => {
  console.error(`notion-sync failed: ${err.message}`);
  process.exit(1);
});
