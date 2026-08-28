import { toyHash, toyHashPair } from "./toy-hash";

/**
 * Content-addressed storage: a file's address IS the hash of its bytes, not a path telling you
 * which server to ask. Same content → same address, always — from any peer, at any time. Built
 * on the same `toyHash` used for Merkle trees in Part V, since content addressing and Merkle
 * hashing are the same idea, just applied to "where is this stored" instead of "is this block valid".
 */

export interface ToyFile {
  name: string;
  content: string;
}

/** The address of a piece of content is simply its hash. No location, no server, no path. */
export function contentAddress(content: string): number {
  return toyHash(content);
}

/** Two pieces of content are the same stored block, regardless of filename, iff their addresses match. */
export function isDuplicate(a: string, b: string): boolean {
  return contentAddress(a) === contentAddress(b);
}

/**
 * A toy 2-chunk DAG, the way IPFS splits a larger file into blocks: each chunk gets its own
 * address, and the two are combined into one root address exactly like a Merkle tree's parent
 * hash. Change either chunk by even one byte and the root address changes completely.
 */
export function chunkedRootAddress(chunk1: string, chunk2: string): number {
  return toyHashPair(contentAddress(chunk1), contentAddress(chunk2));
}

/** A tiny toy "network": a few files, one of which (cat-copy.txt) happens to hold identical bytes to another. */
export const SAMPLE_FILES: ToyFile[] = [
  { name: "cat.txt", content: "meow" },
  { name: "cat-copy.txt", content: "meow" },
  { name: "dog.txt", content: "woof" },
];

/** Groups files by content address — identical content collapses into one group no matter the filename. */
export function groupByAddress(files: ToyFile[]): Map<number, ToyFile[]> {
  const groups = new Map<number, ToyFile[]>();
  for (const f of files) {
    const addr = contentAddress(f.content);
    const group = groups.get(addr) ?? [];
    group.push(f);
    groups.set(addr, group);
  }
  return groups;
}

/** How many distinct blocks actually need to be stored once identical content is deduplicated. */
export function uniqueBlockCount(files: ToyFile[]): number {
  return groupByAddress(files).size;
}
