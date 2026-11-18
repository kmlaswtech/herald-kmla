import { parse } from "yaml";

/** Content files are written by people in Pages CMS, so every field is checked on read. */
export type Fields = Record<string, unknown>;

export function parseYamlFields(text: string): Fields {
  const value: unknown = parse(text);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("expected a set of fields");
  }
  return value as Fields;
}

const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/** Splits a Markdown file into its YAML frontmatter fields and the text below it. */
export function splitFrontmatter(text: string) {
  const match = frontmatter.exec(
    text.charCodeAt(0) === 0xfeff ? text.slice(1) : text,
  );
  if (!match) throw new Error("missing frontmatter");
  return { fields: parseYamlFields(match[1]), body: match[2] };
}

// Pages CMS derives file names from titles; Korean titles keep their letters.
const stemShape = /^[\p{L}\p{N}]+(?:[-_][\p{L}\p{N}]+)*$/u;

export function checkStem(stem: string) {
  if (!stemShape.test(stem)) throw new Error(`unusable file name "${stem}"`);
  return stem;
}

export function requiredText(fields: Fields, name: string) {
  const value = fields[name];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

export function optionalText(fields: Fields, name: string) {
  const value = fields[name];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new Error(`${name} must be text`);
  return value.trim() || undefined;
}

export function flag(fields: Fields, name: string) {
  const value = fields[name];
  if (value === undefined || value === null) return false;
  if (typeof value !== "boolean")
    throw new Error(`${name} must be true or false`);
  return value;
}

/** A calendar date as Pages CMS saves it (`yyyy-MM-dd`). */
export function requiredDate(fields: Fields, name: string) {
  const raw = fields[name];
  const value = raw instanceof Date ? raw.toISOString().slice(0, 10) : raw;
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value
  ) {
    throw new Error(`${name} must be a date like 2026-11-04`);
  }
  return value;
}
