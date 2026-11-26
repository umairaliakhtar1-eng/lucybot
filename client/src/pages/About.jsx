import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const channels = [
  { icon: '💬', name: 'Facebook Messenger', desc: 'Receive and reply to Facebook Page messages from the same inbox.' },
  { icon: '📸', name: 'Instagram DM', desc: 'Manage Instagram direct messages alongside your other channels.' },
  { icon: '🟢', name: 'WhatsApp', desc: 'Handle WhatsApp Business conversations with your team workflow.' },
  { icon: '✈️', name: 'Telegram', desc: 'Connect Telegram bots and respond to customers in one place.' },
];

const features = [
  {
    title: 'Unified Omnichannel Inbox',
    desc: 'All customer conversations from connected channels appear in one dashboard, so your team does not need to switch between apps.',
  },
  {
    title: 'Real-Time Messaging',
    desc: 'New messages and conversation updates appear instantly, helping agents respond quickly and stay up to date.',
  },
  {
    title: 'Smart Conversation Management',
    desc: 'Track chats with Open, Pending, and Resolved statuses, assign conversations to agents, and keep ownership clear.',
  },
  {
    title: 'Internal Notes & Team Collaboration',
    desc: 'Add private team notes, forward conversations, and share context internally without sending it to the customer.',
  },
  {
    title: 'Rich Media Support',
    desc: 'Send and receive images, videos, and files. Preview attachments, open images in full view, and keep media organized inside the chat.',
  },
  {
    title: 'Message Actions',
    desc: 'Right-click a message to reply, copy, translate to English, edit eligible messages, or delete messages based on permissions.',
  },
  {
    title: 'Translation Assistance',
    desc: 'Translate incoming messages to English in a quick in-page popup, making it easier to support customers across languages.',
  },
  {
    title: 'Role-Based Access Control',
    desc: 'Owner, Admin, and Agent roles ensure each team member gets the right level of access and responsibility.',
  },
  {
    title: 'Audit-Friendly Message Deletion',
    desc: 'Deleted messages are handled safely. Owners can review deletion details for accountability, while the team workspace stays clean.',
  },
  {
    title: 'Reliable Workflow Visibility',
    desc: 'Unread counts, assignment indicators, blocked-contact visibility, and conversation history help teams manage support efficiently.',
  },
];

const roles = [
  {
    role: 'Owner',
    points: [
      'Full access to inbox, channels, agents, and settings.',
      'Can manage admins, agents, and connected channels.',
      'Can review deleted message audit details and manage chats.',
    ],
  },
  {
    role: 'Admin',
    points: [
      'Can manage inbox operations, assignments, and team workflow.',
      'Can handle channels and support operations based on permissions.',
      'Can delete messages when needed for moderation and cleanup.',
    ],
  },
  {
    role: 'Agent',
    points: [
      'Can focus on assigned customer conversations.',
      'Can reply, use internal collaboration tools, and resolve chats.',
      'Gets a simplified workspace for daily support work.',
    ],
  },
];

export default function About() {
  const { user } = useAuth();
  const dashboardPath = user ? (user.role === 'agent' ? '/my-chats' : '/inbox') : '/login';

  return (
    <div className="min-h-full overflow-y-auto bg-cloud">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src="/wolf-logo.png" alt="Boss Lucy" className="h-11 w-11 rounded-xl object-contain shadow-md shadow-slate-300" />
            <span className="bg-gradient-to-br from-brand to-lemon bg-clip-text text-lg font-bold text-transparent">Boss Lucy</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Home</Link>
            <Link to={dashboardPath} className="rounded-lg bg-gradient-to-br from-brand to-lemon px-4 py-2 text-sm font-semibold text-white shadow-md shadow-lemon/30 transition hover:brightness-110">
              {user ? 'Open Dashboard' : 'Login'}
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-12 pt-14">
        <div className="max-w-3xl">
          <p className="mb-3 inline-block rounded-full border border-lemon/40 bg-lemon-soft px-4 py-1 text-sm font-semibold text-brand">About Boss Lucy</p>
          <h1 className="text-4xl font-extrabold leading-tight text-slate-800 sm:text-5xl">
            One smart inbox for all your customer conversations.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Boss Lucy is a unified customer support and messaging platform designed to help businesses manage conversations from multiple channels in one place. Instead of switching between Facebook, Instagram, WhatsApp, and Telegram, your team can handle every customer message from a single, organized dashboard.
          </p>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Built for speed, clarity, and teamwork, Boss Lucy helps businesses respond faster, stay organized, and deliver a better customer experience.
          </p>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-bold text-slate-800">Channels We Support</h2>
          <p className="mt-2 max-w-3xl text-slate-600">Connect your communication channels and manage them together with one consistent workflow.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {channels.map((c) => (
              <div key={c.name} className="rounded-2xl border border-slate-200 bg-cloud p-5 shadow-sm">
                <div className="text-3xl">{c.icon}</div>
                <h3 className="mt-3 font-semibold text-slate-800">{c.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold text-slate-800">What Boss Lucy Can Do</h2>
        <p className="mt-2 max-w-3xl text-slate-600">Everything your team needs to manage customer conversations professionally, from first message to resolution.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-bold text-slate-800">Built for Teams</h2>
          <p className="mt-2 max-w-3xl text-slate-600">Boss Lucy supports structured team access so owners, admins, and agents can work with the right permissions.</p>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {roles.map((r) => (
              <div key={r.role} className="rounded-2xl border border-slate-200 bg-cloud p-6">
                <h3 className="text-lg font-bold text-brand">{r.role}</h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {r.points.map((p) => (
                    <li key={p} className="flex gap-2"><span className="mt-0.5 text-lemon">●</span><span>{p}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-3xl bg-gradient-to-br from-brand to-lemon p-8 text-white shadow-xl shadow-lemon/30 sm:p-10">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Why Businesses Use Boss Lucy</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {['Faster customer responses', 'One dashboard for all channels', 'Better team collaboration', 'Organized and professional support'].map((item) => (
              <div key={item} className="rounded-xl bg-white/10 px-4 py-3 text-sm font-medium backdrop-blur">
                {item}
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-white/90">
            Boss Lucy gives your business a simple, powerful way to manage customer communication — so you can focus on growth while your team delivers excellent support.
          </p>
          <Link to={dashboardPath} className="mt-6 inline-block rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand shadow-lg transition hover:bg-slate-50">
            {user ? 'Go to Dashboard' : 'Login to Boss Lucy'}
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/wolf-logo.png" alt="Boss Lucy" className="h-8 w-8 rounded-lg object-contain" />
            <span className="text-sm font-semibold text-slate-600">Boss Lucy</span>
          </div>
          <p className="text-xs text-slate-400">Unified inbox for Facebook, Instagram, WhatsApp & Telegram.</p>
        </div>
      </footer>
    </div>
  );
}
