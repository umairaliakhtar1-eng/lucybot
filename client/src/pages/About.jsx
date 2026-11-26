import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const copy = {
  en: {
    navHome: 'Home',
    navAbout: 'About',
    openDashboard: 'Open Dashboard',
    login: 'Login',
    badge: 'About Boss Lucy',
    title: 'One smart inbox for all your customer conversations.',
    intro1:
      'Boss Lucy is a unified customer support and messaging platform designed to help businesses manage conversations from multiple channels in one place. Instead of switching between Facebook, Instagram, WhatsApp, and Telegram, your team can handle every customer message from a single, organized dashboard.',
    intro2:
      'Built for speed, clarity, and teamwork, Boss Lucy helps businesses respond faster, stay organized, and deliver a better customer experience.',
    channelsTitle: 'Channels We Support',
    channelsDesc: 'Connect your communication channels and manage them together with one consistent workflow.',
    channels: [
      { icon: '💬', name: 'Facebook Messenger', desc: 'Receive and reply to Facebook Page messages from the same inbox.' },
      { icon: '📸', name: 'Instagram DM', desc: 'Manage Instagram direct messages alongside your other channels.' },
      { icon: '🟢', name: 'WhatsApp', desc: 'Handle WhatsApp Business conversations with your team workflow.' },
      { icon: '✈️', name: 'Telegram', desc: 'Connect Telegram bots and respond to customers in one place.' },
    ],
    featuresTitle: 'What Boss Lucy Can Do',
    featuresDesc: 'Everything your team needs to manage customer conversations professionally, from first message to resolution.',
    features: [
      { title: 'Unified Omnichannel Inbox', desc: 'All customer conversations from connected channels appear in one dashboard, so your team does not need to switch between apps.' },
      { title: 'Real-Time Messaging', desc: 'New messages and conversation updates appear instantly, helping agents respond quickly and stay up to date.' },
      { title: 'Smart Conversation Management', desc: 'Track chats with Open, Pending, and Resolved statuses, assign conversations to agents, and keep ownership clear.' },
      { title: 'Internal Notes & Team Collaboration', desc: 'Add private team notes, forward conversations, and share context internally without sending it to the customer.' },
      { title: 'Rich Media Support', desc: 'Send and receive images, videos, and files. Preview attachments, open images in full view, and keep media organized inside the chat.' },
      { title: 'Message Actions', desc: 'Right-click a message to reply, copy, translate to English, edit eligible messages, or delete messages based on permissions.' },
      { title: 'Translation Assistance', desc: 'Translate incoming messages to English in a quick in-page popup, making it easier to support customers across languages.' },
      { title: 'Role-Based Access Control', desc: 'Owner, Admin, and Agent roles ensure each team member gets the right level of access and responsibility.' },
      { title: 'Audit-Friendly Message Deletion', desc: 'Deleted messages are handled safely. Owners can review deletion details for accountability, while the team workspace stays clean.' },
      { title: 'Reliable Workflow Visibility', desc: 'Unread counts, assignment indicators, blocked-contact visibility, and conversation history help teams manage support efficiently.' },
    ],
    teamTitle: 'Built for Teams',
    teamDesc: 'Boss Lucy supports structured team access so owners, admins, and agents can work with the right permissions.',
    roles: [
      { role: 'Owner', points: ['Full access to inbox, channels, agents, and settings.', 'Can manage admins, agents, and connected channels.', 'Can review deleted message audit details and manage chats.'] },
      { role: 'Admin', points: ['Can manage inbox operations, assignments, and team workflow.', 'Can handle channels and support operations based on permissions.', 'Can delete messages when needed for moderation and cleanup.'] },
      { role: 'Agent', points: ['Can focus on assigned customer conversations.', 'Can reply, use internal collaboration tools, and resolve chats.', 'Gets a simplified workspace for daily support work.'] },
    ],
    whyTitle: 'Why Businesses Use Boss Lucy',
    whyPoints: ['Faster customer responses', 'One dashboard for all channels', 'Better team collaboration', 'Organized and professional support'],
    whyDesc: 'Boss Lucy gives your business a simple, powerful way to manage customer communication — so you can focus on growth while your team delivers excellent support.',
    cta: 'Go to Dashboard',
    ctaLogin: 'Login to Boss Lucy',
    footer: 'Unified inbox for Facebook, Instagram, WhatsApp & Telegram.',
  },
  zh: {
    navHome: '首页',
    navAbout: '关于',
    openDashboard: '打开仪表盘',
    login: '登录',
    badge: '关于 Boss Lucy',
    title: '一个智能收件箱，管理所有客户对话。',
    intro1:
      'Boss Lucy 是一个统一的客户支持与消息管理平台，帮助企业在一个地方管理来自多个渠道的客户对话。无需在 Facebook、Instagram、WhatsApp 和 Telegram 之间切换，您的团队可以在一个井然有序的仪表盘中处理所有客户消息。',
    intro2:
      'Boss Lucy 专为速度、清晰度和团队协作而打造，帮助企业更快响应、保持高效组织，并提供更好的客户体验。',
    channelsTitle: '支持的渠道',
    channelsDesc: '连接您的沟通渠道，并通过一致的工作流程统一管理。',
    channels: [
      { icon: '💬', name: 'Facebook Messenger', desc: '在同一个收件箱中接收并回复 Facebook 公共主页消息。' },
      { icon: '📸', name: 'Instagram 私信', desc: '将 Instagram 私信与其他渠道一起统一管理。' },
      { icon: '🟢', name: 'WhatsApp', desc: '通过团队工作流程高效处理 WhatsApp Business 对话。' },
      { icon: '✈️', name: 'Telegram', desc: '连接 Telegram 机器人，在一个平台回复客户。' },
    ],
    featuresTitle: 'Boss Lucy 能做什么',
    featuresDesc: '从第一条消息到问题解决，您的团队所需的一切专业客户对话管理功能。',
    features: [
      { title: '统一全渠道收件箱', desc: '所有已连接渠道的客户对话都显示在一个仪表盘中，团队无需在多个应用之间切换。' },
      { title: '实时消息', desc: '新消息和对话更新即时显示，帮助客服人员快速响应并保持最新状态。' },
      { title: '智能对话管理', desc: '通过“待处理、处理中、已解决”状态跟踪聊天，将对话分配给客服人员，明确责任归属。' },
      { title: '内部备注与团队协作', desc: '添加仅团队可见的内部备注、转发对话并分享上下文，不会发送给客户。' },
      { title: '丰富的媒体支持', desc: '发送和接收图片、视频和文件。预览附件、全屏查看图片，并在聊天中有序管理媒体。' },
      { title: '消息操作', desc: '右键点击消息即可回复、复制、翻译成英文、编辑符合条件的消息，或根据权限删除消息。' },
      { title: '翻译辅助', desc: '在页面内的小弹窗中将收到的消息翻译成英文，更轻松地支持不同语言的客户。' },
      { title: '基于角色的访问控制', desc: '所有者、管理员和客服角色确保每位团队成员拥有合适的访问权限和职责。' },
      { title: '可审计的消息删除', desc: '删除消息会被安全处理。所有者可查看删除详情以便追责，同时保持团队工作区整洁。' },
      { title: '可靠的工作流程可见性', desc: '未读计数、分配标识、被封锁联系人提示和对话历史帮助团队高效管理支持工作。' },
    ],
    teamTitle: '为团队而生',
    teamDesc: 'Boss Lucy 支持结构化的团队访问权限，让所有者、管理员和客服人员以合适的权限协作。',
    roles: [
      { role: '所有者', points: ['完全访问收件箱、渠道、客服人员和设置。', '可以管理管理员、客服人员和已连接渠道。', '可以查看已删除消息的审计详情并管理聊天。'] },
      { role: '管理员', points: ['可以管理收件箱运营、分配和团队工作流程。', '可以根据权限处理渠道和支持运营。', '在需要审核和清理时可以删除消息。'] },
      { role: '客服人员', points: ['可以专注于分配给自己的客户对话。', '可以回复、使用内部协作工具并解决聊天。', '获得简洁的日常支持工作空间。'] },
    ],
    whyTitle: '企业为什么选择 Boss Lucy',
    whyPoints: ['更快的客户响应', '一个仪表盘管理所有渠道', '更好的团队协作', '专业且有条理的客户支持'],
    whyDesc: 'Boss Lucy 为您的企业提供简单而强大的客户沟通管理方式——让您专注于业务增长，同时团队提供卓越的客户支持。',
    cta: '前往仪表盘',
    ctaLogin: '登录 Boss Lucy',
    footer: 'Facebook、Instagram、WhatsApp 和 Telegram 的统一收件箱。',
  },
};

export default function About() {
  const { user } = useAuth();
  const [lang, setLang] = useState('en');
  const t = copy[lang];
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
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
              <button onClick={() => setLang('en')} className={`rounded-md px-2.5 py-1.5 transition ${lang === 'en' ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>EN</button>
              <button onClick={() => setLang('zh')} className={`rounded-md px-2.5 py-1.5 transition ${lang === 'zh' ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>中文</button>
            </div>
            <Link to="/" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:block">{t.navHome}</Link>
            <Link to={dashboardPath} className="rounded-lg bg-gradient-to-br from-brand to-lemon px-4 py-2 text-sm font-semibold text-white shadow-md shadow-lemon/30 transition hover:brightness-110">
              {user ? t.openDashboard : t.login}
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-12 pt-14">
        <div className="max-w-3xl">
          <p className="mb-3 inline-block rounded-full border border-lemon/40 bg-lemon-soft px-4 py-1 text-sm font-semibold text-brand">{t.badge}</p>
          <h1 className="text-4xl font-extrabold leading-tight text-slate-800 sm:text-5xl">{t.title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">{t.intro1}</p>
          <p className="mt-4 text-base leading-relaxed text-slate-600">{t.intro2}</p>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-bold text-slate-800">{t.channelsTitle}</h2>
          <p className="mt-2 max-w-3xl text-slate-600">{t.channelsDesc}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.channels.map((c) => (
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
        <h2 className="text-2xl font-bold text-slate-800">{t.featuresTitle}</h2>
        <p className="mt-2 max-w-3xl text-slate-600">{t.featuresDesc}</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {t.features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-bold text-slate-800">{t.teamTitle}</h2>
          <p className="mt-2 max-w-3xl text-slate-600">{t.teamDesc}</p>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {t.roles.map((r) => (
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
          <h2 className="text-2xl font-extrabold sm:text-3xl">{t.whyTitle}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.whyPoints.map((item) => (
              <div key={item} className="rounded-xl bg-white/10 px-4 py-3 text-sm font-medium backdrop-blur">
                {item}
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-white/90">{t.whyDesc}</p>
          <Link to={dashboardPath} className="mt-6 inline-block rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand shadow-lg transition hover:bg-slate-50">
            {user ? t.cta : t.ctaLogin}
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/wolf-logo.png" alt="Boss Lucy" className="h-8 w-8 rounded-lg object-contain" />
            <span className="text-sm font-semibold text-slate-600">Boss Lucy</span>
          </div>
          <p className="text-xs text-slate-400">{t.footer}</p>
        </div>
      </footer>
    </div>
  );
}
