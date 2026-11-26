import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { channelOf, formatTime } from '../channels';
import ChatWindow from './ChatWindow.jsx';
import Avatar from './Avatar.jsx';

const MIN_LIST_WIDTH = 200;
const MAX_LIST_WIDTH = 640;
const LIST_WIDTH_KEY = 'inbox-list-width';
// SSE realtime updates karta hai; ye sirf safety-net refresh hai (pehle 10s
// tha - har 10s par poori list + open chat dobara fetch ho rahi thi).
const AUTO_REFRESH_MS = 60000;

// State churn rokne ke liye: agar data wahi hai to purana reference wapas do,
// taake 200-row list aur open chat dobara render na hon.
function conversationsSignature(list) {
  return list
    .map(
      (c) =>
        `${c.id}:${c.last_message_at || 0}:${c.unread || 0}:${c.status}:${
          c.assigned_agent_id || 0
        }:${c.assign_pending || 0}:${(c.note || '').length}:${
          c.contact_name || ''
        }:${c.photo || ''}`
    )
    .join('|');
}

function messagesSignature(list) {
  return list
    .map((m) => `${m.id}:${m.edited_at || 0}:${m.superseded_by || 0}`)
    .join('|');
}

// Inbox tabs: All aur Unread ke sath status filters. "Unread" backend se
// query hota hai (c.unread > 0); status filters bhi API ke through.
const TABS = [
  { key: 'all', label: 'All', status: 'all', unread: false },
  { key: 'unread', label: 'Unread', status: 'all', unread: true },
  { key: 'open', label: 'Open', status: 'open', unread: false },
  { key: 'pending', label: 'Pending', status: 'pending', unread: false },
  { key: 'resolved', label: 'Resolved', status: 'resolved', unread: false },
];

export default function ChatWorkspace({ agentView = false }) {
  const { user } = useAuth();
  const isStaff = user && (user.role === 'admin' || user.role === 'owner');
  const [activeTab, setActiveTab] = useState('all');
  const [conversations, setConversations] = useState([]);
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState('all');
  const [agentCounts, setAgentCounts] = useState({ agents: [], unassigned: 0, total: 0 });
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileNotes, setMobileNotes] = useState(false);
  // Mobile par Inbox list ek popup drawer ki tarah khulti hai (chat ke upar).
  const [mobileInbox, setMobileInbox] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia('(max-width: 767px)').matches
  );
  const [refreshing, setRefreshing] = useState(false);
  const [chatMenu, setChatMenu] = useState(null);
  const [listWidth, setListWidth] = useState(() => {
    try {
      const saved = localStorage.getItem(LIST_WIDTH_KEY);
      return saved ? Math.min(MAX_LIST_WIDTH, Math.max(MIN_LIST_WIDTH, parseInt(saved, 10))) : 320;
    } catch {
      return 320;
    }
  });
  const listWidthRef = useRef(listWidth);
  const activeIdRef = useRef(null);
  activeIdRef.current = activeId;

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const activeTabDef = TABS.find((t) => t.key === activeTab) || TABS[0];
  const filterRef = useRef(activeTabDef);
  filterRef.current = activeTabDef;
  const agentFilterRef = useRef(agentFilter);
  agentFilterRef.current = agentFilter;

  // Kya conversation current tab ke filter ko match karti hai?
  // My Chats ke Unread tab mein naye assignment (assign_pending) bhi "unread"
  // count hoti hain — agent ko red chats wahan bhi dikhein.
  function matchesTab(conversation) {
    const f = filterRef.current;
    if (f.unread && !(conversation.unread > 0) && !(agentView && conversation.assign_pending)) return false;
    if (f.status !== 'all' && conversation.status !== f.status) return false;
    // Agent filter (sirf Inbox/admin): 'none' = unassigned, warna agent id.
    const ag = agentFilterRef.current;
    if (!agentView && ag !== 'all') {
      if (ag === 'none') {
        if (conversation.assigned_agent_id != null) return false;
      } else if (String(conversation.assigned_agent_id) !== ag) {
        return false;
      }
    }
    return true;
  }

  function startListResize(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = listWidthRef.current;
    const onMove = (ev) => {
      const w = Math.min(MAX_LIST_WIDTH, Math.max(MIN_LIST_WIDTH, startW + ev.clientX - startX));
      listWidthRef.current = w;
      setListWidth(w);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      try {
        localStorage.setItem(LIST_WIDTH_KEY, String(listWidthRef.current));
      } catch {}
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  function upsert(list, conversation) {
    let next;
    const idx = list.findIndex((c) => c.id === conversation.id);
    if (idx === -1) next = [conversation, ...list];
    else {
      next = [...list];
      next[idx] = { ...next[idx], ...conversation };
    }
    if (agentView) next = next.filter((c) => c.assigned_agent_id === user?.id);
    return next
      .filter(matchesTab)
      .sort((a, b) => (b.last_message_at || 0) - (a.last_message_at || 0));
  }

  function mergeMessages(prev, incoming) {
    const seen = new Set(prev.map((m) => m.id));
    const fresh = (incoming || []).filter((m) => m && !seen.has(m.id));
    return fresh.length ? [...prev, ...fresh] : prev;
  }

  const select = useCallback(
    async (id) => {
      try {
        const { conversation, messages: list } = await api.conversation(id);
        setActiveId(id);
        setMessages(list);
        setActive(conversation);
        // Mobile: chat khulte hi list drawer band, notes drawer bhi band.
        setMobileInbox(false);
        setMobileNotes(false);
        setConversations((prev) =>
          prev
            .map((c) => (c.id === id ? { ...c, unread: 0, assign_pending: 0 } : c))
            .filter(matchesTab)
        );
        api.markRead(id).catch(() => {});
      } catch (e) {
        console.error(e);
      }
    },
    []
  );

  const refresh = useCallback(
    async (opts = {}) => {
      const { silent = false } = opts;
      if (!silent) setRefreshing(true);
      try {
        const f = filterRef.current;
        // My Chats ka Unread tab client-side filter hota hai (unread ya
        // assign_pending), is liye server ka unread filter sirf Inbox ke liye.
        const { conversations: list } = await api.conversations({
          status: f.status,
          unread: f.unread && !agentView,
          agent: agentFilterRef.current,
        });
        setConversations((prev) => {
          let next = list;
          if (agentView) next = list.filter((c) => c.assigned_agent_id === user?.id);
          next = [...next]
            .filter((c) => matchesTab(c))
            .sort((a, b) => (b.last_message_at || 0) - (a.last_message_at || 0));
          // Data wahi hai to purana reference rakho - list dobara render na ho.
          return conversationsSignature(prev) === conversationsSignature(next) ? prev : next;
        });
        if (!agentView) {
          api.assignmentCounts().then(setAgentCounts).catch(() => {});
        }
        if (activeIdRef.current) {
          try {
            const { conversation, messages: msgs } = await api.conversation(activeIdRef.current);
            setActive((prev) =>
              prev && conversationsSignature([prev]) === conversationsSignature([conversation])
                ? prev
                : conversation
            );
            // Polling se aayi hui bilkul wahi messages ho to reference na badlo
            // (warna poora thread har refresh par re-render hota hai).
            setMessages((prev) =>
              messagesSignature(prev) === messagesSignature(msgs) ? prev : msgs
            );
          } catch {
            setActiveId(null);
            setActive(null);
            setMessages([]);
          }
        }
      } catch (e) {
        console.error('refresh fail:', e);
      } finally {
        if (!silent) setRefreshing(false);
      }
    },
    [agentView, user?.id]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const f = filterRef.current;
        const { conversations: list } = await api.conversations({
          status: f.status,
          unread: f.unread && !agentView,
          agent: agentFilterRef.current,
        });
        let filtered = agentView ? list.filter((c) => c.assigned_agent_id === user?.id) : list;
        if (!agentView) {
          api.assignmentCounts().then((c) => { if (!cancelled) setAgentCounts(c); }).catch(() => {});
        }
        const sorted = [...filtered].sort((a, b) => (b.last_message_at || 0) - (a.last_message_at || 0));
        if (cancelled) return;
        setConversations(sorted.filter((c) => matchesTab(c)));
        // My Chats: koi chat khud nahi khulti — jab tak agent khud click na kare,
        // nayi assigned chat red highlight mein visible rahe. Inbox (admin/owner)
        // mein desktop par pehli chat khud khul jati hai; mobile par list hi
        // dikhti hai (chat tap karne par khulegi).
        if (!agentView && sorted.length && !f.unread && !isMobile) {
          const snap = await api.conversation(sorted[0].id);
          if (cancelled) return;
          setActiveId(sorted[0].id);
          setMessages(snap.messages);
          setActive(snap.conversation);
          api.markRead(sorted[0].id).catch(() => {});
        } else if (!agentView) {
          setActiveId(null);
          setActive(null);
          setMessages([]);
        }
      } catch (e) {
        if (!cancelled) setError('Failed to load conversations.');
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    if (!agentView) {
      api.agents().then(({ agents: list }) => setAgents(list)).catch(() => {});
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, agentView, agentFilter]);

  useEffect(() => {
    const t = setInterval(() => refresh({ silent: true }), AUTO_REFRESH_MS);
    return () => clearInterval(t);
  }, [refresh]);

  // SSE realtime
  useEffect(() => {
    const source = new EventSource('/api/stream');

    const handleMessage = (payload) => {
      const { conversation, message } = payload;
      if (!conversation) return;
      setConversations((prev) => upsert(prev, conversation));
      if (activeIdRef.current === conversation.id) {
        if (message) setMessages((prev) => mergeMessages(prev, [message]));
        if (message?.direction === 'inbound') api.markRead(conversation.id).catch(() => {});
        setActive((t) => (t && t.id === conversation.id ? { ...t, ...conversation } : t));
      }
    };

    const handleMessageUpdated = (payload) => {
      const { conversation_id, message } = payload || {};
      if (!conversation_id || !message) return;
      if (activeIdRef.current === conversation_id) {
        setMessages((prev) => {
          if (message.deleted_at && user?.role !== 'owner') {
            return prev.filter((m) => m.id !== message.id);
          }
          return prev.map((m) => {
            if (m.id !== message.id) return m;
            const next = { ...m, ...message };
            if (m.deleted_body && !next.deleted_body) next.deleted_body = m.deleted_body;
            if (m.deleted_media_url && !next.deleted_media_url) next.deleted_media_url = m.deleted_media_url;
            if (m.deleted_media_type && !next.deleted_media_type) next.deleted_media_type = m.deleted_media_type;
            return next;
          });
        });
      }
    };

    const handleConversation = (payload) => {
      const conversation = payload?.conversation;
      if (!conversation) return;
      if (payload?.owner_only && user?.role !== 'owner') return;
      if (conversation.deleted_at && user?.role !== 'owner') {
        setConversations((prev) => prev.filter((c) => c.id !== conversation.id));
        if (activeIdRef.current === conversation.id) { setActiveId(null); setActive(null); setMessages([]); }
        return;
      }
      setConversations((prev) => {
        if (!matchesTab(conversation) && user?.role !== 'owner') return prev.filter((c) => c.id !== conversation.id);
        return upsert(prev, conversation);
      });
      if (activeIdRef.current === conversation.id) {
        setActive(conversation);
        if (agentView && conversation.assigned_agent_id !== user?.id) {
          setActiveId(null);
          setActive(null);
          setMessages([]);
        } else if (agentView && conversation.assign_pending) {
          api.markRead(conversation.id).catch(() => {});
        }
      }
    };

    const handleMessageDeleted = (payload) => {
      if (activeIdRef.current === payload.conversation_id) {
        setMessages((prev) => prev.filter((m) => m.id !== payload.message_id));
      }
    };

    const handleConversationDeleted = (payload) => {
      if (payload?.hard) {
        setConversations((prev) => prev.filter((c) => c.id !== payload.conversation_id));
      } else if (user?.role === 'owner') {
        setConversations((prev) => prev.map((c) => c.id === payload.conversation_id ? { ...c, deleted_at: c.deleted_at || Date.now() } : c));
      } else {
        setConversations((prev) => prev.filter((c) => c.id !== payload.conversation_id));
      }
      if (activeIdRef.current === payload.conversation_id && user?.role !== 'owner') {
        setActiveId(null);
        setActive(null);
        setMessages([]);
      }
    };

    const handleMessageEdited = (payload) => {
      if (activeIdRef.current !== payload.conversation_id) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.message.id ? { ...m, ...payload.message } : m))
      );
    };

    source.addEventListener('message', (event) => handleMessage(JSON.parse(event.data)));
    source.addEventListener('conversation', (event) => handleConversation(JSON.parse(event.data)));
    source.addEventListener('message-deleted', (event) => handleMessageDeleted(JSON.parse(event.data)));
    source.addEventListener('message-updated', (event) => handleMessageUpdated(JSON.parse(event.data)));
    source.addEventListener('message-edited', (event) => handleMessageEdited(JSON.parse(event.data)));
    source.addEventListener('conversation-deleted', (event) => handleConversationDeleted(JSON.parse(event.data)));

    return () => {
      source.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentView, user?.id]);

  async function send(text, replyToId = null) {
    if (!activeId || !text.trim()) return;
    try {
      const { message, conversation } = await api.reply(activeId, { body: text.trim(), ...(replyToId ? { reply_to_id: replyToId } : {}) });
      setMessages((prev) => mergeMessages(prev, [message]));
      if (conversation) setConversations((prev) => upsert(prev, conversation));
      return message;
    } catch (e) {
      if (e.data?.conversation) {
        setConversations((prev) => upsert(prev, e.data.conversation));
        if (activeIdRef.current === e.data.conversation.id) setActive((p) => p ? { ...p, ...e.data.conversation } : p);
      }
      setError(e.message);
      throw e;
    }
  }

  async function sendMedia(payload) {
    if (!activeId) return;
    try {
      const { message, conversation } = await api.reply(activeId, payload);
      setMessages((prev) => mergeMessages(prev, [message]));
      if (conversation) setConversations((prev) => upsert(prev, conversation));
      return message;
    } catch (e) {
      if (e.data?.conversation) {
        setConversations((prev) => upsert(prev, e.data.conversation));
        if (activeIdRef.current === e.data.conversation.id) setActive((p) => p ? { ...p, ...e.data.conversation } : p);
      }
      setError(e.message);
      throw e;
    }
  }

  // Meta already-sent message edit nahi kar sakta, is liye corrected text naya
  // message ban kar jata hai aur purana "(edited)" mark ho jata hai.
  async function editMessage(messageId, body) {
    if (!activeId) return;
    const { message, edited } = await api.editMessage(activeId, messageId, body);
    setMessages((prev) => prev.map((m) => (m.id === edited.id ? { ...m, ...edited } : m)));
    setMessages((prev) => mergeMessages(prev, [message]));
    setConversations((prev) =>
      upsert(prev, {
        ...prev.find((c) => c.id === activeId),
        last_message: message.body,
        last_message_at: message.created_at,
      })
    );
  }

  async function changeStatus(status) {
    if (!activeId) return;
    try {
      const { conversation } = await api.setStatus(activeId, status);
      setConversations((prev) => upsert(prev, conversation));
      setActive(conversation);
    } catch (e) {
      setError(e.message);
    }
  }

  async function doAssign(agentId, note, media) {
    if (!activeId) return;
    try {
      const { conversation, note: noteRecord } = await api.assign(
        activeId,
        agentId,
        note || '',
        media || {}
      );
      setConversations((prev) => upsert(prev, conversation));
      // Agent-wise counts turant update karo (filter dropdown ke numbers).
      api.assignmentCounts().then(setAgentCounts).catch(() => {});
      setActive((t) => (t && t.id === activeId ? conversation : t));
      if (noteRecord) setMessages((prev) => mergeMessages(prev, [noteRecord]));
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }

  async function addNote(body) {
    if (!activeId) return;
    try {
      const { note } = await api.addNote(activeId, { body });
      setMessages((prev) => mergeMessages(prev, [note]));
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteNote(messageId) {
    if (!activeId) return;
    try {
      await api.deleteNote(activeId, messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteMessage(messageId) {
    if (!activeId) return;
    try {
      const { message } = await api.deleteMessage(activeId, messageId);
      if (message?.deleted && user?.role !== 'owner') {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } else if (message) {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, ...message } : m)));
      }
      refresh({ silent: true });
    } catch (e) {
      setError(e.message);
    }
  }

  async function pinMessage(messageId) {
    if (!activeId) return;
    try {
      const { conversation } = await api.pinMessage(activeId, messageId);
      if (conversation) setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, ...conversation } : c)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function unpinMessage() {
    if (!activeId) return;
    try {
      const { conversation } = await api.unpinMessage(activeId);
      if (conversation) setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, ...conversation } : c)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteConversation(conversationId = activeId) {
    if (!conversationId) return;
    try {
      await api.deleteConversation(conversationId);
      if (user?.role === 'owner') {
        // Owner hard-deletes; remove locally. Soft-deleted-by-staff will come back via refresh/conversation event.
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      } else {
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      }
      if (activeIdRef.current === conversationId && user?.role !== 'owner') dismissChat();
      if (activeIdRef.current === conversationId && user?.role === 'owner') dismissChat();
      refresh({ silent: true });
    } catch (e) {
      setError(e.message);
    }
  }

  async function archiveConversation(conversationId, archived = true) {
    try {
      const { conversation } = await api.archiveConversation(conversationId, archived);
      if (conversation) setConversations((prev) => upsert(prev, conversation));
    } catch (e) { setError(e.message); }
  }

  async function pinConversation(conversationId, pinned = true) {
    try {
      const { conversation } = await api.pinConversation(conversationId, pinned);
      if (conversation) setConversations((prev) => upsert(prev, conversation));
    } catch (e) { setError(e.message); }
  }

  async function markUnread(conversationId) {
    try {
      const { conversation } = await api.markUnread(conversationId);
      if (conversation) setConversations((prev) => upsert(prev, conversation));
      if (activeIdRef.current === conversationId) dismissChat();
    } catch (e) { setError(e.message); }
  }

  function dismissChat() {
    setMobileNotes(false);
    setMobileInbox(false);
    setActiveId(null);
    setActive(null);
    setMessages([]);
  }

  const sorted = useMemo(
    () => [...conversations].sort((a, b) => {
      const ap = a.pinned_at ? 1 : 0;
      const bp = b.pinned_at ? 1 : 0;
      if (ap !== bp) return bp - ap;
      if (ap && bp && a.pinned_at !== b.pinned_at) return (b.pinned_at || 0) - (a.pinned_at || 0);
      return (b.last_message_at || 0) - (a.last_message_at || 0);
    }),
    [conversations]
  );

  const q = search.trim().toLowerCase();
  const visible = useMemo(() => {
    let list = sorted.filter((c) => user?.role === 'owner' || !c.deleted_at);
    if (!q) return list;
    return list.filter((c) => {
      const name = String(c.contact_name || c.external_id || '').toLowerCase();
      return name.includes(q);
    });
  }, [sorted, q, user?.role]);

  // Mobile: jab chat khula hai to list popup drawer banti hai (Inbox icon se
  // khulti hai), warna poori screen. Desktop par hamesha side-by-side.
  const listMobileClasses = !activeId
    ? 'flex w-full'
    : mobileInbox
      ? 'fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-sm shadow-2xl'
      : 'hidden';

  return (
    <div className="relative flex h-full overflow-hidden">
      {mobileInbox && activeId && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileInbox(false)}
        />
      )}
      {/* conversation list */}
      <div
        className={`${listMobileClasses} min-h-0 flex-col border-r border-slate-200 bg-white md:static md:z-auto md:flex md:max-w-none md:shadow-none`}
        style={{ width: isMobile ? undefined : listWidth }}
      >
        <div className="flex items-center justify-between gap-2 bg-[#f0f2f5] px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-800">{agentView ? 'My Chats' : 'Inbox'}</h2>
            <p className="text-xs text-slate-500">{sorted.length} chats</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => refresh()} disabled={refreshing} title="Refresh" className="rounded-full p-2 text-slate-500 hover:bg-slate-200 disabled:opacity-50">{refreshing ? '…' : '↻'}</button>
            {activeId && <button onClick={() => setMobileInbox(false)} title="Close inbox" className="rounded-full p-2 text-slate-500 hover:bg-slate-200 md:hidden">✕</button>}
          </div>
        </div>
        {error && <p className="bg-brand-soft p-2 text-xs text-brand">{error}</p>}
        <div className="border-b border-slate-200 px-3 py-2">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full rounded-xl bg-slate-100 py-2 pl-9 pr-8 text-sm text-slate-800 outline-none ring-1 ring-transparent focus:bg-white focus:ring-sky-300"
            />
            {search && <button type="button" onClick={() => setSearch('')} title="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700">✕</button>}
          </div>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 px-2 py-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`whitespace-nowrap rounded-lg px-3 py-1 text-xs font-semibold transition ${
                activeTab === t.key
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
          {/* Agent tabs (sirf admin/owner): click = us agent ki chats,
              active chip par dobara click = filter hat jata hai.
              Har naam ke saath uske assigned chats ka count hai. */}
          {!agentView && isStaff && agentCounts.agents.length > 0 && (
            <span className="mx-1 h-4 w-px shrink-0 bg-slate-300" />
          )}
          {!agentView && isStaff && (
            <>
              <button
                type="button"
                onClick={() => setAgentFilter(agentFilter === 'none' ? 'all' : 'none')}
                title="Chats not assigned to any agent"
                className={`whitespace-nowrap rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  agentFilter === 'none'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                Unassigned{agentCounts.unassigned > 0 ? ` (${agentCounts.unassigned})` : ''}
              </button>
              {agentCounts.agents.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAgentFilter(agentFilter === String(a.id) ? 'all' : String(a.id))}
                  title={`${a.name}'s assigned chats (${a.count})`}
                  className={`whitespace-nowrap rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    agentFilter === String(a.id)
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  👤 {a.name} ({a.count})
                </button>
              ))}
            </>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && <p className="p-4 text-sm text-slate-500">Loading...</p>}
          {visible.map((c) => {
            const ch = channelOf(c.channel);
            return (
              <button
                key={c.id}
                onClick={() => select(c.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setChatMenu({ x: Math.min(e.clientX, window.innerWidth - 190), y: Math.min(e.clientY, window.innerHeight - 220), chat: c });
                }}
                className={`block w-full px-3 py-2.5 text-left transition ${
                  activeId === c.id ? 'bg-[#3390ec]/10' : c.deleted_at ? 'bg-red-50/60 hover:bg-red-50' : agentView && c.assign_pending ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={c.contact_name} photo={c.photo} className="h-12 w-12 text-base" />
                  <div className="min-w-0 flex-1 border-b border-slate-100 py-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5 truncate text-[15px] font-medium text-slate-800">
                        {c.pinned_at ? <span title="Pinned chat" className="text-[11px] text-amber-500">📌</span> : null}
                        <span className="truncate">{c.contact_name}</span>
                      </span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {agentView && c.assign_pending > 0 && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">new</span>}
                        <span className="text-[11px] text-slate-400">{formatTime(c.last_message_at)}</span>
                      </div>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-sm text-slate-500">
                        {c.deleted_at && user?.role === 'owner' ? `Deleted by ${c.deleted_by_name || 'staff'} · ${c.last_message || ''}` : (c.last_message || (c.status === 'resolved' ? 'Resolved' : 'No messages yet'))}
                      </span>
                      <div className="flex shrink-0 items-center gap-1">
                        {c.archived ? <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">Archived</span> : null}
                        {c.deleted_at && user?.role === 'owner' ? <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700" title={c.deleted_by_name ? `Deleted by ${c.deleted_by_name}` : 'Deleted'}>Deleted</span> : null}
                        {c.blocked ? <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">Blocked</span> : null}
                        {(c.unread || 0) > 0 ? (
                          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#3390ec] px-1.5 text-[10px] font-bold text-white">{c.unread > 99 ? '99+' : c.unread}</span>
                        ) : (
                          <span className={`rounded px-1.5 py-0.5 text-[10px] capitalize ${c.status === 'resolved' ? 'bg-green-100 text-green-700' : c.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{c.status}</span>
                        )}
                      </div>
                    </div>
                    {!agentView && (
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: ch.color }} />{ch.short || ch.label}</span>
                        {isStaff && <span className="truncate">{c.assigned_agent_name || 'Unassigned'}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          {!loading && !visible.length && (
            <p className="p-4 text-sm text-slate-400">
              {q ? `No conversations found for "${search}".` : 'No conversations yet.'}
            </p>
          )}
        </div>
      </div>

      {chatMenu && (
        <div className="fixed z-[90] min-w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-xl" style={{ left: chatMenu.x, top: chatMenu.y }} onClick={(e) => e.stopPropagation()}>
          <button className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { archiveConversation(chatMenu.chat.id, !chatMenu.chat.archived); setChatMenu(null); }}>
            {chatMenu.chat.archived ? 'Unarchive' : 'Archive'}
          </button>
          <button className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { pinConversation(chatMenu.chat.id, !chatMenu.chat.pinned_at); setChatMenu(null); }}>
            {chatMenu.chat.pinned_at ? 'Unpin' : 'Pin'}
          </button>
          <button className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { markUnread(chatMenu.chat.id); setChatMenu(null); }}>
            Mark as unread
          </button>
          {!chatMenu.chat.deleted_at && user?.role !== 'owner' && (
            <button className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50" onClick={() => { if (window.confirm('Delete this chat?')) deleteConversation(chatMenu.chat.id); setChatMenu(null); }}>
              Delete chat
            </button>
          )}
        </div>
      )}

      {/* resize handle */}
      <div
        onMouseDown={startListResize}
        title="Drag to resize"
        className="hidden w-1 shrink-0 cursor-col-resize bg-slate-200 hover:bg-sky-300 md:block"
      />

      {/* chat column */}
      <div className={`${activeId ? 'flex' : 'hidden'} md:flex flex-1`}>
        <ChatWindow
          active={active}
          messages={messages}
          onSend={send}
          onSendMedia={sendMedia}
          onEdit={editMessage}
          canAssign={!agentView && isStaff}
          canNote={isStaff || active?.assigned_agent_id === user?.id}
          agents={agents}
          onAssign={doAssign}
          onAddNote={addNote}
          onDeleteNote={deleteNote}
          onDeleteMessage={deleteMessage}
          onPinMessage={pinMessage}
          onUnpinMessage={unpinMessage}
          onDeleteConversation={deleteConversation}
          onChangeStatus={changeStatus}
          onDismiss={dismissChat}
          onOpenInbox={() => {
            setMobileNotes(false);
            setMobileInbox(true);
          }}
          onToggleNotes={() => {
            setMobileInbox(false);
            setMobileNotes((o) => !o);
          }}
          mobileNotes={mobileNotes}
          onError={setError}
          myId={user?.id}
          isStaff={isStaff}
          isOwner={user?.role === 'owner'}
          showAgent={user?.role === 'owner'}
        />
      </div>
    </div>
  );
}