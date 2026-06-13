'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AI_AGENT_QUESTIONNAIRE_QUESTIONS } from '@/lib/aiAgentQuestionnaire';
import WhatsAppContactButton from '@/components/ai-agent/WhatsAppContactButton';

type FormState = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  notes: string;
  answers: Record<string, string>;
  website: string;
};

const INITIAL: FormState = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  notes: '',
  answers: {},
  website: '',
};

export default function AiAgentQuestionnaireForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function setAnswer(questionId: string, optionId: string) {
    setForm((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: optionId },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/ai-agent/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = (await res.json()) as { error?: string; ok?: boolean };

      if (!res.ok) {
        setError(json.error ?? '提交失敗，請稍後再試。');
        return;
      }

      setDone(true);
    } catch {
      setError('網絡錯誤，請檢查連線後再試。');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600/20 border border-emerald-500/40 mb-6">
          <span className="text-3xl" aria-hidden>✓</span>
        </div>
        <h1 className="text-2xl font-bold mb-3">收到！多謝你填寫問卷</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          我哋會用你留低嘅聯絡方式跟進，了解 AI Agent 方案同安排會議。
          一般 1–2 個工作天內回覆。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <WhatsAppContactButton className="px-8 py-3" label="WhatsApp 預約會議" />
          <Link
            href="/ai-agent"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-3 text-sm font-semibold hover:bg-white/5 transition-colors"
          >
            返回主頁
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <p className="text-blue-400 text-xs font-bold uppercase tracking-wide mb-2">Professional · AI Agent</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-3">AI Agent 需求問卷</h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          全部係選擇題，約 2 分鐘搞掂。提交後我哋會 email 收到你嘅答案，再同你安排會議。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Honeypot */}
        <input
          type="text"
          name="website"
          value={form.website}
          onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
        />

        <section className="rounded-2xl border border-white/10 bg-gray-900/60 p-6 space-y-5">
          <h2 className="font-bold text-lg">聯絡資料</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-sm text-gray-300 mb-1.5 block">公司名稱 *</span>
              <input
                required
                value={form.companyName}
                onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                className="w-full rounded-xl border border-white/15 bg-[#0b1220] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-blue-500/50 focus:outline-none"
                placeholder="例如：ABC 有限公司"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-300 mb-1.5 block">聯絡人 *</span>
              <input
                required
                value={form.contactName}
                onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))}
                className="w-full rounded-xl border border-white/15 bg-[#0b1220] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-blue-500/50 focus:outline-none"
                placeholder="你的姓名"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-300 mb-1.5 block">電話</span>
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className="w-full rounded-xl border border-white/15 bg-[#0b1220] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-blue-500/50 focus:outline-none"
                placeholder="例如：9123 4567"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm text-gray-300 mb-1.5 block">電郵 *</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full rounded-xl border border-white/15 bg-[#0b1220] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-blue-500/50 focus:outline-none"
                placeholder="name@company.com"
              />
            </label>
          </div>
        </section>

        {AI_AGENT_QUESTIONNAIRE_QUESTIONS.map((q, idx) => (
          <section key={q.id} className="rounded-2xl border border-white/10 bg-gray-900/60 p-6">
            <h2 className="font-bold text-base sm:text-lg mb-4">
              <span className="text-blue-400 mr-2">{idx + 1}.</span>
              {q.label}
            </h2>
            <div className="space-y-2">
              {q.options.map((opt) => {
                const checked = form.answers[q.id] === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                      checked
                        ? 'border-blue-500/60 bg-blue-950/40 text-white'
                        : 'border-white/10 bg-[#0b1220]/50 text-gray-300 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={opt.id}
                      checked={checked}
                      onChange={() => setAnswer(q.id, opt.id)}
                      className="h-4 w-4 shrink-0 accent-blue-500"
                      required
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}

        <section className="rounded-2xl border border-white/10 bg-gray-900/60 p-6">
          <label className="block">
            <span className="font-bold text-lg mb-3 block">有其他想補充？（可選）</span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={4}
              className="w-full rounded-xl border border-white/15 bg-[#0b1220] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-blue-500/50 focus:outline-none resize-y"
              placeholder="例如：想接現有 HR 系統、有特定合規要求等"
            />
          </label>
        </section>

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 text-lg shadow-lg shadow-blue-900/30 transition-colors"
        >
          {submitting ? '提交中…' : '提交問卷'}
        </button>

        <p className="text-center text-xs text-gray-500">
          提交即表示同意我哋用你留低嘅資料跟進 AI Agent 方案。
          <Link href="/ai-agent" className="text-gray-400 hover:text-white ml-1 underline">
            返回主頁
          </Link>
        </p>
      </form>
    </div>
  );
}
