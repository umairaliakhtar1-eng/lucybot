import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import SupportPopup from '../components/SupportPopup.jsx';

const SERVICES = [
  { icon: "💬", title: "Facebook Automation / Facebook 自动化", desc: "Smart replies, orders, and support on Facebook Messenger — 24/7. / Facebook Messenger 智能回复、订单与客服，全天候运行。" },
  { icon: "📸", title: "Instagram Automation / Instagram 自动化", desc: "Automated DMs, replies, and workflows with full control. / Instagram 私信自动回复与流程管理，尽在掌控。" },
  { icon: "🟢", title: "WhatsApp Automation / WhatsApp 自动化", desc: "Reliable WhatsApp Business messaging, replies, and workflows. / 可靠的 WhatsApp Business 消息、回复与流程自动化。" },
  { icon: "✈️", title: "Telegram Automation / Telegram 自动化", desc: "Telegram bots for DMs, replies, and support in one place. / Telegram 机器人处理私信、回复与客服，集中管理。" },
  { icon: "🚀", title: "Omnichannel Inbox / 全渠道收件箱", desc: "Handle Facebook, Instagram, WhatsApp, and Telegram from one dashboard. / 在一个仪表盘管理 Facebook、Instagram、WhatsApp 和 Telegram。" },
  { icon: "🧠", title: "Smart Agent Tools / 智能客服工具", desc: "Notes, forward, assign, and customer details for your team. / 备注、转发、分配与客户详情，让团队协作更高效。" },
  { icon: "🎯", title: "Reliable & Scalable / 稳定可扩展", desc: "Built to stay reliable as your workload grows. / 随业务增长保持稳定可靠。" },
];

const PERKS = [
  { icon: "⚡", label: "Real-time Replies" },
  { icon: "🚀", label: "Faster Resolution" },
  { icon: "💻", label: "One Dashboard" },
];

export default function Landing() {
  const { user } = useAuth();
  if (user) return <Navigate to={user.role === 'agent' ? '/my-chats' : '/inbox'} replace />;
  return (
    <div className="min-h-full overflow-y-auto bg-cloud">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src="/wolf-logo.png" alt="Boss Lucy" className="h-11 w-11 rounded-xl object-contain shadow-md shadow-slate-300" />
            <span className="bg-gradient-to-br from-brand to-lemon bg-clip-text text-lg font-bold text-transparent">
              Boss Lucy
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/about" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">About</Link>
            <Link
              to="/login"
              className="rounded-lg bg-gradient-to-br from-brand to-lemon px-4 py-2 text-sm font-semibold text-white shadow-md shadow-lemon/30 transition hover:brightness-110"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-4xl overflow-hidden px-4 pb-10 pt-14 text-center">
        <img
          src="/wolf-logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-1/2 w-[420px] max-w-[45%] -translate-y-1/2 select-none opacity-20"
        />
        <div className="relative">
          <p className="mb-4 inline-block rounded-full border border-lemon/40 bg-lemon-soft px-4 py-1 text-sm font-semibold text-brand">
            ⚡ Boss Lucy is here / Boss Lucy 来了
          </p>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
            <span className="bg-gradient-to-br from-brand to-lemon bg-clip-text text-transparent">
              Boss Lucy
            </span>
            <br />
            <span className="text-slate-800">Smart support, one inbox. / 智能客服，一个收件箱。</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Manage{" "}
            <span className="font-semibold text-slate-800">
              Facebook, Instagram, WhatsApp & Telegram
            </span>{" "}
            support from one dashboard. Save time, reply faster, and keep your team organized.
            <br />
            <span className="text-slate-500">
              在一个仪表盘管理多渠道客服，更快回复，更高效率。
            </span>
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="rounded-xl bg-gradient-to-br from-brand to-lemon px-7 py-3 text-base font-semibold text-white shadow-lg shadow-lemon/30 transition hover:brightness-110"
            >
              Get Started → Login / 开始登录
            </Link>
            <Link
              to="/about"
              className="rounded-xl border border-slate-300 bg-white px-7 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              About / Details
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-center text-3xl font-bold">
          <span className="bg-gradient-to-br from-brand to-lemon bg-clip-text text-transparent">
            What We Automate / 我们自动化什么
          </span>
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-slate-500">
          Handle Facebook Messenger, Instagram DMs, WhatsApp Business, and Telegram in one dashboard — automation and human support together.
          <br />
          在一个仪表盘处理多渠道消息，自动化与人工客服协同工作。
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-lemon-soft bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="text-3xl">{s.icon}</div>
              <h3 className="mt-3 font-semibold text-slate-800">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Statement */}
      <section className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-lg text-slate-600">
          Whether you need a{" "}
          <span className="font-semibold text-slate-800">Facebook Messenger inbox</span>,{" "}
          <span className="font-semibold text-slate-800">Instagram DM support</span>, or a complete{" "}
          <span className="font-semibold text-slate-800">omnichannel workflow / 全渠道流程</span> —{" "}
          <span className="font-semibold text-brand">Boss Lucy gets it done.</span>
          <br />
          <span className="text-slate-500">无论是单渠道还是全渠道客服，Boss Lucy 都能胜任。</span>
        </p>
        <div className="mt-8 rounded-2xl border border-lemon-soft bg-white p-8 shadow-sm">
          <p className="text-slate-500">Simple. Fast. Reliable.</p>
          <p className="mt-1 text-xl font-bold text-slate-800">简单 · 快速 · 可靠</p>
          <p className="mt-4 text-2xl font-extrabold">
            <span className="bg-gradient-to-br from-brand to-lemon bg-clip-text text-transparent">
              Boss Lucy — Your Smart Support Hub
            </span>
          </p>
        </div>
      </section>

      {/* Perks */}
      <section className="mx-auto grid max-w-4xl grid-cols-1 gap-4 px-4 py-6 sm:grid-cols-3">
        {PERKS.map((p) => (
          <div
            key={p.label}
            className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm"
          >
            <div className="text-3xl">{p.icon}</div>
            <p className="mt-2 font-semibold text-slate-700">{p.label}</p>
          </div>
        ))}
      </section>

      {/* Big line + CTA */}
      <section className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-2xl font-bold text-slate-800">⚡ One Boss Lucy. Endless Possibilities. / 无限可能</p>
        <div className="mt-8 rounded-3xl bg-gradient-to-br from-brand to-lemon p-10 text-white shadow-xl shadow-lemon/30">
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            BOSS LUCY — AUTOMATE SMART. MOVE FAST.
          </h2>
          <p className="mt-2 text-white/90">
            Facebook · Instagram · WhatsApp · Telegram — one dashboard for your support inbox.
            <br />
            一个仪表盘管理所有客服消息。
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-xl bg-white px-8 py-3 text-base font-bold text-brand shadow-lg transition hover:bg-slate-50"
          >
            Login to Dashboard / 登录仪表盘
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/wolf-logo.png" alt="Boss Lucy" className="h-8 w-8 rounded-lg object-contain" />
            <span className="text-sm font-semibold text-slate-600">Boss Lucy</span>
          </div>
          <p className="text-xs text-slate-400">
            One Boss Lucy. Endless Possibilities. · Facebook · Instagram · WhatsApp · Telegram
          </p>
        </div>
      </footer>
      <SupportPopup />
    </div>
  );
}