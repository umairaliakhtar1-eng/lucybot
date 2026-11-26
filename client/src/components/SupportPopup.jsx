import { useState } from 'react';

export default function SupportPopup({ className = '' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#229ED9] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-300/40 transition hover:brightness-110 ${className}`}
        aria-label="24/7 Support"
        title="24/7 Support"
      >
        <span className="text-lg">✈️</span>
        <span className="hidden sm:inline">24/7 Support</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-brand">24/7 Support / 24/7 支持</p>
                <h3 className="mt-1 text-xl font-bold text-slate-800">Telegram: @ZEUS9115</h3>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">✕</button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Need help or want to get started? Contact us directly on Telegram.
              <br />
              <span className="text-slate-500">需要帮助或想开始使用？请直接在 Telegram 上联系我们。</span>
            </p>
            <a
              href="https://t.me/ZEUS9115"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#229ED9] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Contact on Telegram / 在 Telegram 联系
            </a>
          </div>
        </div>
      )}
    </>
  );
}
