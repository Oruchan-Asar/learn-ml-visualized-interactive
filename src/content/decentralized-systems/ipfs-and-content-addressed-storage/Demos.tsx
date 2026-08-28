"use client";

import { useEffect, useId, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { contentAddress, isDuplicate, chunkedRootAddress } from "@/lib/math-core/ipfs-and-content-addressed-storage";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "./Controls.module.css";

const CONCEPT_ID = "ipfs-and-content-addressed-storage";

const CAT_CONTENT = "meow";
const DOG_CONTENT = "woof";

function AddressBadge({ matches }: { matches: boolean }) {
  return <span className={matches ? styles.pillMatch : styles.pillNoMatch}>{matches ? "same address" : "different address"}</span>;
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className={styles.row}>
      <label htmlFor={id}>{label}</label>
      <input id={id} className={styles.textInput} type="text" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** Intuition beat: edit a "second file"'s content and watch its address snap into or out of matching cat.txt's. */
export function IntuitionDemo() {
  const [copyContent, setCopyContent] = useState(CAT_CONTENT);
  const catAddr = contentAddress(CAT_CONTENT);
  const dogAddr = contentAddress(DOG_CONTENT);
  const copyAddr = contentAddress(copyContent);
  const matchesCat = isDuplicate(copyContent, CAT_CONTENT);

  return (
    <>
      <div className={styles.card}>
        <div className={styles.fileRow}>
          <span className={styles.fileName}>cat.txt = &ldquo;{CAT_CONTENT}&rdquo;</span>
          <span className={styles.address}>address {catAddr}</span>
        </div>
        <div className={styles.fileRow}>
          <span className={styles.fileName}>your-file.txt = &ldquo;{copyContent}&rdquo;</span>
          <span className={styles.address}>
            address {copyAddr} <AddressBadge matches={matchesCat} />
          </span>
        </div>
        <div className={styles.fileRow}>
          <span className={styles.fileName}>dog.txt = &ldquo;{DOG_CONTENT}&rdquo;</span>
          <span className={styles.address}>address {dogAddr}</span>
        </div>
      </div>
      <div className={styles.controls}>
        <TextField label="your-file.txt content" value={copyContent} onChange={setCopyContent} />
      </div>
    </>
  );
}

/** Play beat: split content into two chunks, combine their addresses into one root — edit either chunk
 *  and watch the root address change completely, the same way editing content changes a file's address. */
export function PlayDemo() {
  const [chunk1, setChunk1] = useState(CAT_CONTENT);
  const [chunk2, setChunk2] = useState(DOG_CONTENT);
  const addr1 = contentAddress(chunk1);
  const addr2 = contentAddress(chunk2);
  const root = chunkedRootAddress(chunk1, chunk2);

  return (
    <>
      <div className={styles.card}>
        <div className={styles.fileRow}>
          <span className={styles.fileName}>chunk 1 = &ldquo;{chunk1}&rdquo;</span>
          <span className={styles.address}>address {addr1}</span>
        </div>
        <div className={styles.fileRow}>
          <span className={styles.fileName}>chunk 2 = &ldquo;{chunk2}&rdquo;</span>
          <span className={styles.address}>address {addr2}</span>
        </div>
        <div className={styles.fileRow}>
          <span className={styles.fileName}>root (chunk 1 | chunk 2)</span>
          <span className={styles.address}>address {root}</span>
        </div>
      </div>
      <div className={styles.controls}>
        <TextField label="chunk 1" value={chunk1} onChange={setChunk1} />
        <TextField label="chunk 2" value={chunk2} onChange={setChunk2} />
      </div>
    </>
  );
}

/** Checkpoint: make the edited file a true byte-exact duplicate of cat.txt — close doesn't count. */
export function IpfsCheckpoint() {
  const [content, setContent] = useState("meow!");
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const passed = isDuplicate(content, CAT_CONTENT);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Edit the content below until it becomes a true duplicate of <strong>cat.txt</strong> (&ldquo;{CAT_CONTENT}&rdquo;) —
          same address, one stored block. Content addressing is byte-exact: close doesn&rsquo;t count.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Edit the text to try it"
    >
      <div className={styles.card}>
        <div className={styles.fileRow}>
          <span className={styles.fileName}>your-file.txt = &ldquo;{content}&rdquo;</span>
          <span className={styles.address}>
            address {contentAddress(content)} <AddressBadge matches={passed} />
          </span>
        </div>
      </div>
      <div className={styles.controls}>
        <TextField
          label="content"
          value={content}
          onChange={(v) => {
            setHasInteracted(true);
            setContent(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
