"use client";

import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { activeMentionQuery, type MentionPick } from "@/lib/post-text";
import { searchMentions, type MentionCandidate } from "../actions";

type Props = {
  value: string;
  onChange: (text: string) => void;
  picks: MentionPick[];
  onPicksChange: (picks: MentionPick[]) => void;
  placeholder?: string;
  ariaLabel: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  multiline?: boolean;
  className?: string;
  // Enter (single line) or Cmd/Ctrl+Enter (multi line) when no suggestion
  // list is open.
  onSubmit?: () => void;
};

export type MentionTextareaHandle = { focus: () => void };

// A text field with @mention autocomplete. People are found through the
// mention_candidates RPC (excludes self and anyone blocked either way).
export const MentionTextarea = forwardRef<MentionTextareaHandle, Props>(function MentionTextarea(
  {
    value,
    onChange,
    picks,
    onPicksChange,
    placeholder,
    ariaLabel,
    rows = 3,
    maxLength,
    disabled,
    multiline = true,
    className = "",
    onSubmit,
  },
  ref,
) {
  const fieldRef = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState<{ query: string; start: number } | null>(null);
  const [results, setResults] = useState<MentionCandidate[]>([]);
  const [active, setActive] = useState(0);
  const reqId = useRef(0);

  useImperativeHandle(ref, () => ({ focus: () => fieldRef.current?.focus() }));

  useEffect(() => {
    if (!query || query.query.length < 1) {
      setResults([]);
      return;
    }
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      const r = await searchMentions(query.query);
      if (id === reqId.current) {
        setResults(r);
        setActive(0);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [query]);

  function updateQuery(text: string, caret: number | null) {
    if (caret === null) return setQuery(null);
    setQuery(activeMentionQuery(text, caret));
  }

  function choose(c: MentionCandidate) {
    const el = fieldRef.current;
    if (!el || !query) return;
    const caret = el.selectionStart ?? value.length;
    const before = value.slice(0, query.start);
    const after = value.slice(caret);
    const insert = `@${c.display_name} `;
    const next = (before + insert + after).slice(0, maxLength ?? Infinity);
    onChange(next);
    if (!picks.some((p) => p.id === c.id)) onPicksChange([...picks, { id: c.id, name: c.display_name }]);
    setQuery(null);
    setResults([]);
    requestAnimationFrame(() => {
      const pos = before.length + insert.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  const open = results.length > 0 && query !== null;

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) {
    if (open) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => (a + 1) % results.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => (a - 1 + results.length) % results.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        choose(results[active]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setQuery(null);
        setResults([]);
        return;
      }
    }
    if (!onSubmit) return;
    if (multiline && (e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    } else if (!multiline && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  const common = {
    value,
    placeholder,
    disabled,
    maxLength,
    "aria-label": ariaLabel,
    role: "combobox" as const,
    "aria-autocomplete": "list" as const,
    "aria-expanded": open,
    "aria-controls": listId,
    "aria-activedescendant": open ? `${listId}-${active}` : undefined,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      const text = maxLength ? e.target.value.slice(0, maxLength) : e.target.value;
      onChange(text);
      updateQuery(text, e.target.selectionStart);
    },
    onKeyDown,
    onClick: (e: React.MouseEvent<HTMLTextAreaElement | HTMLInputElement>) =>
      updateQuery(e.currentTarget.value, e.currentTarget.selectionStart),
    onBlur: () => setTimeout(() => setQuery(null), 150),
  };

  return (
    <div className="relative w-full">
      {multiline ? (
        <textarea ref={fieldRef} rows={rows} className={className} {...common} />
      ) : (
        <input ref={fieldRef} type="text" className={className} {...common} />
      )}
      <ul
        id={listId}
        role="listbox"
        aria-label="Mention someone"
        hidden={!open}
        className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-1 shadow-xl"
      >
        {results.map((c, i) => (
          <li
            key={c.id}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            onMouseDown={(e) => {
              e.preventDefault();
              choose(c);
            }}
            onMouseEnter={() => setActive(i)}
            className={[
              "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm",
              i === active ? "bg-[var(--surface-2)] text-[var(--fg)]" : "text-[var(--fg-muted)]",
            ].join(" ")}
          >
            <Avatar name={c.display_name} url={c.avatar_url} size="xs" />
            <span className="truncate text-[var(--fg)]">{c.display_name}</span>
            {c.company_name && <span className="truncate text-xs text-[var(--fg-subtle)]">{c.company_name}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
});
