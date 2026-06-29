import { useState } from "react";
import type { InterviewQuestion } from "../lib/types";

const TYPE_LABEL: Record<InterviewQuestion["type"], string> = {
  "leetcode": "LeetCode",
  "system-design": "System Design",
  "behavioral": "Behavioral",
  "distributed-systems": "Distributed Systems",
  "debugging": "Debugging",
};

const DIFFICULTY_COLOR: Record<InterviewQuestion["difficulty"], string> = {
  easy: "text-green-500",
  medium: "text-amber-500",
  hard: "text-red-500",
};

interface Props {
  question: InterviewQuestion;
}

export function InterviewCard({ question }: Props) {
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-surface-1">
      <div className="flex items-center gap-2">
        <p className="text-xs text-ink-faint font-medium uppercase tracking-wide">Today's Interview Question</p>
        <span className="ml-auto text-xs font-medium bg-surface-2 px-2 py-0.5 rounded-md text-ink-muted">
          {TYPE_LABEL[question.type]}
        </span>
      </div>
      <p className="text-sm font-medium text-ink leading-relaxed">{question.question}</p>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${DIFFICULTY_COLOR[question.difficulty]}`}>
          {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
        </span>
        <button
          onClick={() => setShowHint(!showHint)}
          className="text-xs text-accent hover:text-accent/80 transition-colors"
        >
          {showHint ? "Hide hint" : "Show hint"}
        </button>
      </div>
      {showHint && (
        <p className="text-xs text-ink-muted border-t border-border pt-3 leading-relaxed animate-fade-in">
          💡 {question.hint}
        </p>
      )}
    </div>
  );
}
