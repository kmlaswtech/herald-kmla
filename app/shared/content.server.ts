import { readdir, readFile } from "node:fs/promises";
import { join, parse, resolve } from "node:path";

/**
 * The Pages CMS content folder: `content/` in this repository, or `HERALD_CONTENT_DIR`
 * (tests point it at fixtures).
 */
export function contentDir() {
  return resolve(process.env.HERALD_CONTENT_DIR ?? "content");
}

export interface ContentEntry {
  /** File name without its extension; it becomes the item's URL id. */
  stem: string;
  file: string;
  text: string;
}

/** Every file with one of `extensions` in a collection folder; a missing folder is empty. */
export async function readCollection(
  folder: string,
  extensions: string[],
): Promise<ContentEntry[]> {
  const dir = join(contentDir(), folder);
  let names: string[];
  try {
    names = await readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const files = names
    .filter((name) => extensions.includes(parse(name).ext.toLowerCase()))
    .sort();
  return Promise.all(
    files.map(async (name) => ({
      stem: parse(name).name,
      file: `${folder}/${name}`,
      text: await readFile(join(dir, name), "utf8"),
    })),
  );
}

/**
 * Parses each entry, logging and skipping files that do not validate, so one bad save in
 * Pages CMS cannot take the whole newspaper down. `null` results (drafts) are dropped too.
 */
export function parseEach<T>(
  entries: ContentEntry[],
  parseEntry: (entry: ContentEntry) => T | null,
): T[] {
  return entries.flatMap((entry) => {
    try {
      const item = parseEntry(entry);
      return item === null ? [] : [item];
    } catch (error) {
      console.error(
        `Skipping ${entry.file}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  });
}
