"use client";

import { FormEvent } from "react";
import { ArrowUpLeft, Sparkles } from "lucide-react";

export function AiPrompt() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form className="ai-prompt" onSubmit={handleSubmit}>
      <div className="prompt-topline"><Sparkles aria-hidden="true" />از پروژه‌تان بپرسید</div>
      <textarea aria-label="سؤال خود را درباره پروژه بنویسید" placeholder="مثلاً: چرا این معماری را انتخاب کردیم؟" rows={3} />
      <div className="prompt-footer">
        <span>پاسخ‌ها بر پایه مستندات پروژه هستند</span>
        <button type="submit" aria-label="ارسال سؤال"><ArrowUpLeft data-icon="inline-start" /></button>
      </div>
    </form>
  );
}
