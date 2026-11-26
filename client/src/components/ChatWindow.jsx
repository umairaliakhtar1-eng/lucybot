import { useEffect, useRef, useState } from 'react';
import { channelOf, formatClock, formatFull } from '../channels';
import { uploadFile } from '../api';
import Avatar from './Avatar.jsx';

function BrokenImage({ type = 'image' }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500">
      {type === 'image' ? 'Image failed to load' : type === 'video' ? 'Video failed to load' : 'File failed to load'}
    </div>
  );
}

function MediaImage({ src, className, onOpen }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (failed) return <BrokenImage type="image" />;
  return (
    <button type="button" onClick={() => onOpen?.(src)} className="relative block max-w-full overflow-hidden bg-transparent text-left">
      {!loaded && <div className="absolute inset-0 animate-pulse bg-slate-200/60" />}
      <img
        src={src}
        alt="attachment"
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
      />
    </button>
  );
}

function MediaVideo({ src, className }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <BrokenImage type="video" />;
  return <video src={src} controls preload="metadata" onError={() => setFailed(true)} className={`${className} bg-transparent`} />;
}

function isProfilePicUrl(url) {
  const value = String(url || '');
  return /stp=cp0_dst-jpg/i.test(value) || /platform-lookaside\.fbsbx\.com/i.test(value) || /lookaside\.fbsbx\.com/i.test(value);
}

function fileNameOf(url) {
  try {
    const path = String(url || '').split('?')[0].split('#')[0];
    return decodeURIComponent(path.split('/').pop() || '');
  } catch {
    return '';
  }
}

function Media({ m, className = '', mine = false, onOpenImage }) {
  if (!m.media_url || isProfilePicUrl(m.media_url)) return null;
  const kind = String(m.media_type || '').toLowerCase();
  if (kind === 'image' || kind === 'sticker' || kind === 'photo') {
    return <MediaImage src={m.media_url} className={className} onOpen={onOpenImage} />;
  }
  if (kind === 'video') return <MediaVideo src={m.media_url} className={className} />;
  const name = fileNameOf(m.media_url) || 'Attachment';
  return (
    <a
      href={m.media_url}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${mine ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
    >
      <span className="text-base">📄</span>
      <span className="min-w-0 flex-1 truncate">{name}</span>
    </a>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2">
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className="text-right text-xs font-semibold text-slate-700">{value || '—'}</dd>
    </div>
  );
}

function kindOf(file) {
  const t = (file.type || '').split('/')[0];
  return t === 'image' || t === 'video' ? t : 'document';
}

function makePreview(file) {
  return { id: crypto.randomUUID(), file, kind: kindOf(file), preview: kindOf(file) === 'document' ? null : URL.createObjectURL(file) };
}

function Previews({ items, onRemove, small = false }) {
  return (
    <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
      {items.map((p) => (
        <div key={p.id} className="relative shrink-0">
          {p.kind === 'video' ? (
            <video src={p.preview} muted className={`${small ? 'h-12 w-12' : 'h-16 w-16'} rounded-lg border border-slate-200 bg-black object-cover`} />
          ) : p.kind === 'image' ? (
            <img src={p.preview} alt="preview" className={`${small ? 'h-12 w-12' : 'h-16 w-16'} rounded-lg border border-slate-200 object-cover`} />
          ) : (
            <div className={`${small ? 'h-12 max-w-28' : 'h-16 max-w-36'} flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-600`} title={p.file.name}>
              <span>📄</span><span className="truncate">{p.file.name}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => onRemove(p.id)}
            title="Remove"
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white shadow hover:bg-brand"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function QuoteBar({ quote, mine = false }) {
  if (!quote) return null;
  const sender = quote.sender === 'agent' ? 'Agent' : quote.sender === 'note' ? 'Note' : quote.sender === 'customer' ? 'Customer' : 'You';
  const quoteKind = quote.media_url && !isProfilePicUrl(quote.media_url) ? String(quote.media_type || '').toLowerCase() : '';
  const quoteIsImage = quoteKind === 'image' || quoteKind === 'sticker' || quoteKind === 'photo';
  const label = quote.body || (quoteIsImage ? 'Photo' : quoteKind === 'video' ? 'Video' : quoteKind ? 'File' : '');
  return (
    <div className={`mb-1.5 flex items-start gap-2 rounded-md border-l-2 px-2 py-1 text-[11px] ${mine ? 'border-white/60 bg-white/10 text-white/90' : 'border-brand bg-slate-100 text-slate-600'}`}>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{sender}</p>
        <p className="truncate">{label}</p>
      </div>
      {quoteIsImage && <img src={quote.media_url} alt="quoted" className="h-8 w-8 shrink-0 rounded object-cover" />}
    </div>
  );
}

function StatusTicks({ m, mine }) {
  if (!mine) return null;
  if (m.localStatus === 'sending') return <span className="text-[10px] opacity-70">…</span>;
  if (m.localStatus === 'failed') return <span className="text-[10px] text-red-200" title={m.localError || 'Failed'}>!</span>;
  return <span className="text-[10px] opacity-80" title="Sent">✓</span>;
}

function DeletedBody({ m, isOwner }) {
  return (
    <div className={`rounded-md px-2 py-1 text-[13px] italic ${isOwner ? 'bg-red-50 text-red-700' : 'text-slate-500'}`}>
      <p>This message was deleted{m.deleted_by_name ? ` by ${m.deleted_by_name}` : ''}.</p>
      {isOwner && (m.deleted_body || m.deleted_media_url) && (
        <div className="mt-1 not-italic text-slate-700">
          {m.deleted_body ? <p className="whitespace-pre-wrap break-words">{m.deleted_body}</p> : null}
          {m.deleted_media_url ? <a href={m.deleted_media_url} target="_blank" rel="noreferrer" className="text-xs text-sky-600 underline">View deleted media</a> : null}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ m, onReply, replying, onDelete, canDelete, canEdit, onEdit, showAgent, onRetry, onOpenImage, onContextMenu, isOwner }) {
  if (m.sender === 'note') {
    return (
      <div className="flex justify-center py-1">
        <div className="max-w-[85%] rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-slate-700 shadow-sm" onContextMenu={onContextMenu}>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">Team note</p>
          {m.deleted_at ? <DeletedBody m={m} isOwner={isOwner} /> : <>
            <Media m={m} className="mb-1 max-h-64 max-w-full" onOpenImage={onOpenImage} />
            {m.body ? <p className="whitespace-pre-wrap break-words">{m.body}</p> : null}
          </>}
          <div className="mt-1 flex items-center justify-end gap-2 text-[10px] text-slate-400">
            {canDelete && !m.deleted_at && <button onClick={onDelete} title="Delete note" className="hover:text-red-500">Delete</button>}
            <span>{formatClock(m.created_at)}</span>
          </div>
        </div>
      </div>
    );
  }

  const mine = m.direction === 'outbound';
  return (
    <div className={`group flex ${mine ? 'justify-end' : 'justify-start'} px-1`}>
      <div className={`flex max-w-[min(78%,42rem)] items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
        {!mine ? <Avatar name="Customer" photo={null} className="mb-1 hidden h-7 w-7 self-end text-[10px] sm:flex" /> : null}
        <div className="min-w-0">
          <div
            onContextMenu={onContextMenu}
            className={`relative rounded-2xl px-3 py-2 text-[14px] leading-relaxed shadow-sm ${
              mine ? 'bg-[#d9fdd3] text-slate-800 rounded-br-md' : 'bg-white text-slate-800 rounded-bl-md'
            } ${replying ? 'ring-2 ring-sky-400' : ''}`}
          >
            <QuoteBar quote={m.reply_to} mine={mine} />
            {m.deleted_at ? <DeletedBody m={m} isOwner={isOwner} /> : <>
              <Media m={m} className="mb-1 max-h-72 w-full max-w-sm object-contain" mine={mine} onOpenImage={onOpenImage} />
              {m.body ? <p className="whitespace-pre-wrap break-words">{m.body}</p> : null}
            </>}
            <div className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${mine ? 'text-slate-500' : 'text-slate-400'}`}>
              {m.edited_at ? <span className="italic">edited</span> : null}
              {canEdit && !m.localStatus && !m.deleted_at ? <button type="button" onClick={onEdit} title="Edit" className="opacity-0 transition hover:underline group-hover:opacity-100">Edit</button> : null}
              <span>{formatClock(m.created_at)}</span>
              <StatusTicks m={m} mine={mine} />
            </div>
          </div>
          <div className={`mt-0.5 flex items-center gap-2 px-1 ${mine ? 'justify-end' : 'justify-start'}`}>
            {m.localStatus === 'failed' && mine && <button type="button" onClick={onRetry} className="text-[11px] text-red-500 hover:underline">Retry</button>}
            {!m.deleted_at && <button type="button" onClick={onReply} className="text-[11px] text-slate-400 opacity-0 transition hover:text-brand group-hover:opacity-100">Reply</button>}
            {showAgent && mine && m.agent_id ? <span className="text-[10px] text-slate-400">{m.agent_name || `Agent #${m.agent_id}`}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function dayLabel(ts) {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return 'Today';
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export default function ChatWindow({
  active,
  messages,
  onSend,
  canAssign,
  canNote,
  agents,
  onAssign,
  onAddNote,
  onDeleteNote,
  onDeleteMessage,
  onDeleteConversation,
  onChangeStatus,
  onDismiss,
  onOpenInbox,
  onToggleNotes,
  mobileNotes,
  onSendMedia,
  onEdit,
  onError,
  myId,
  isStaff,
  isOwner,
  showAgent,
}) {
  const [text, setText] = useState('');
  const [pending, setPending] = useState([]);
  const [sending, setSending] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [forwardAgent, setForwardAgent] = useState('');
  const [forwardNote, setForwardNote] = useState('');
  const [forwardFiles, setForwardFiles] = useState([]);
  const [forwardBusy, setForwardBusy] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [quickBusy, setQuickBusy] = useState(false);
  const [notesWidth, setNotesWidth] = useState(320);
  const [showInfo, setShowInfo] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [optimistic, setOptimistic] = useState([]);
  const [menu, setMenu] = useState(null);
  const [translatePop, setTranslatePop] = useState(null);
  const fileRef = useRef(null);
  const textRef = useRef(null);
  const forwardFileRef = useRef(null);
  const scrollRef = useRef(null);
  const msgListRef = useRef(null);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const forwardRef = useRef(forwardFiles);
  forwardRef.current = forwardFiles;

  useEffect(() => {
    setPending((prev) => { prev.forEach((p) => p.preview && URL.revokeObjectURL(p.preview)); return []; });
    setText('');
    setForwardFiles((prev) => { prev.forEach((p) => p.preview && URL.revokeObjectURL(p.preview)); return []; });
    setForwardAgent('');
    setForwardNote('');
    setQuickNote('');
    setShowInfo(false);
    setReplyingTo(null);
    setEditing(null);
    setLightbox(null);
    setOptimistic([]);
    setMenu(null);
  }, [active?.id]);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => { window.removeEventListener('click', close); window.removeEventListener('scroll', close, true); };
  }, [menu]);

  useEffect(() => { setTranslatePop(null); }, [active?.id]);

  useEffect(() => () => {
    pendingRef.current.forEach((p) => p.preview && URL.revokeObjectURL(p.preview));
    forwardRef.current.forEach((p) => p.preview && URL.revokeObjectURL(p.preview));
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => scrollRef.current?.scrollIntoView({ block: 'end' }));
    return () => cancelAnimationFrame(raf);
  }, [active?.id]);

  const visibleMessages = messages.filter((m) => m.sender !== 'note');
  const mergedMessages = [...visibleMessages, ...optimistic.filter((o) => !visibleMessages.some((m) => m.id === o.id))];

  useEffect(() => {
    const el = msgListRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [mergedMessages.length, active?.id]);

  useEffect(() => {
    const ta = textRef.current;
    if (!ta) return;
    ta.style.height = '0px';
    ta.style.height = `${Math.min(160, Math.max(44, ta.scrollHeight))}px`;
  }, [text]);

  if (!active) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#e7ebf0]">
        <div className="rounded-full bg-white/80 px-4 py-2 text-sm text-slate-500 shadow-sm">Select a conversation</div>
      </div>
    );
  }

  const channel = channelOf(active.channel);
  const notes = messages.filter((m) => m.sender === 'note');

  function addFiles(files) {
    if (editing) return;
    setPending((prev) => [...prev, ...[...files].map(makePreview)].slice(0, 10));
  }
  function removePending(id) {
    setPending((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found?.preview) URL.revokeObjectURL(found.preview);
      return prev.filter((p) => p.id !== id);
    });
  }
  function addForwardFiles(files) {
    setForwardFiles((prev) => [...prev, ...[...files].map(makePreview)].slice(0, 10));
  }
  function removeForwardFile(id) {
    setForwardFiles((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found?.preview) URL.revokeObjectURL(found.preview);
      return prev.filter((p) => p.id !== id);
    });
  }
  function onPaste(e) {
    const files = [...(e.clipboardData?.items || [])].map((it) => it.getAsFile()).filter(Boolean);
    if (files.length) { e.preventDefault(); addFiles(files); }
  }
  function onDrop(e) {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  }
  function onPasteForward(e) {
    const files = [...(e.clipboardData?.items || [])].map((it) => it.getAsFile()).filter(Boolean);
    if (files.length) { e.preventDefault(); addForwardFiles(files); }
  }
  function onDropForward(e) {
    e.preventDefault();
    if (e.dataTransfer?.files?.length) addForwardFiles(e.dataTransfer.files);
  }
  async function uploadQueue(list) {
    const out = [];
    for (const p of list) {
      const up = await uploadFile(p.file);
      out.push({ media_type: up.media_type, media_url: up.url });
      if (p.preview) URL.revokeObjectURL(p.preview);
    }
    return out;
  }
  function startEdit(m) {
    setEditing(m);
    setReplyingTo(null);
    setPending((prev) => { prev.forEach((p) => p.preview && URL.revokeObjectURL(p.preview)); return []; });
    setText(m.body || '');
    requestAnimationFrame(() => textRef.current?.focus());
  }

  async function sendOptimistic(payload) {
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticMsg = {
      id: tempId,
      conversation_id: active.id,
      direction: 'outbound',
      sender: 'agent',
      body: payload.body || '',
      media_type: payload.media_type || null,
      media_url: payload.media_url || null,
      reply_to_id: payload.reply_to_id || null,
      reply_to: replyingTo ? { id: replyingTo.id, sender: replyingTo.sender, body: replyingTo.body || '', media_type: replyingTo.media_type, media_url: replyingTo.media_url } : null,
      created_at: Math.floor(Date.now() / 1000),
      localStatus: 'sending',
      localPayload: payload,
    };
    setOptimistic((prev) => [...prev, optimisticMsg]);
    try {
      const sent = payload.media_url ? await onSendMedia(payload) : await onSend(payload.body, payload.reply_to_id);
      setOptimistic((prev) => prev.filter((m) => m.id !== tempId));
      return sent;
    } catch (err) {
      setOptimistic((prev) => prev.map((m) => m.id === tempId ? { ...m, localStatus: 'failed', localError: err.message } : m));
      onError?.(err.message);
      return null;
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (sending) return;
    if (editing) {
      if (!text.trim()) return;
      setSending(true);
      try { await onEdit(editing.id, text.trim()); setText(''); setEditing(null); } catch (err) { onError(err.message); } finally { setSending(false); }
      return;
    }
    if (!pending.length && !text.trim()) return;
    setSending(true);
    const replyToId = replyingTo?.id || null;
    const caption = text.trim();
    const toSend = pending;
    setText('');
    setPending([]);
    setReplyingTo(null);
    try {
      if (toSend.length) {
        const uploaded = await uploadQueue(toSend);
        for (let i = 0; i < uploaded.length; i++) {
          await sendOptimistic({ body: i === 0 && caption ? caption : '', reply_to_id: replyToId, ...uploaded[i] });
        }
      } else {
        await sendOptimistic({ body: caption, reply_to_id: replyToId });
      }
    } finally {
      setSending(false);
      textRef.current?.focus();
    }
  }

  async function retryMessage(m) {
    if (!m.localPayload) return;
    setOptimistic((prev) => prev.map((x) => x.id === m.id ? { ...x, localStatus: 'sending', localError: null } : x));
    try {
      const payload = m.localPayload;
      if (payload.media_url) await onSendMedia(payload);
      else await onSend(payload.body, payload.reply_to_id);
      setOptimistic((prev) => prev.filter((x) => x.id !== m.id));
    } catch (err) {
      setOptimistic((prev) => prev.map((x) => x.id === m.id ? { ...x, localStatus: 'failed', localError: err.message } : x));
      onError?.(err.message);
    }
  }

  async function submitForward(e) {
    e.preventDefault();
    if (!forwardAgent || forwardBusy) return;
    setForwardBusy(true);
    try {
      let media;
      if (forwardFiles.length) {
        const uploaded = await uploadQueue(forwardFiles);
        media = uploaded[0];
        setForwardFiles([]);
      }
      await onAssign(Number(forwardAgent), forwardNote, media);
      setForwardAgent(''); setForwardNote('');
    } catch (err) { onError(err.message); } finally { setForwardBusy(false); }
  }
  async function submitQuickNote(e) {
    e.preventDefault();
    if (quickBusy || !quickNote.trim()) return;
    setQuickBusy(true);
    try { await onAddNote(quickNote.trim()); setQuickNote(''); } catch (err) { onError(err.message); } finally { setQuickBusy(false); }
  }
  function handleStatusAction(e) {
    const action = e.target.value; e.target.value = '';
    if (['pending', 'resolved', 'open'].includes(action)) onChangeStatus(action);
  }
  function canDeleteNote(note) { return isStaff || note.agent_id === myId; }
  function canDeleteMessage(m) {
    if (m.sender === 'note') return canDeleteNote(m);
    if (isOwner) return true;
    return isStaff && m.direction === 'outbound' && m.agent_id === myId;
  }
  function openMenu(e, m) {
    e.preventDefault();
    if (m.deleted_at && !isOwner) return;
    setMenu({ x: Math.min(e.clientX, window.innerWidth - 180), y: Math.min(e.clientY, window.innerHeight - 220), message: m });
  }
  async function copyMessage(m) {
    const text = m.deleted_at ? (isOwner ? (m.deleted_body || m.deleted_media_url || '') : '') : (m.body || m.media_url || '');
    if (!text) return;
    try { await navigator.clipboard.writeText(text); } catch {}
  }

  const statusBadge = active.status === 'resolved' ? 'bg-green-100 text-green-700' : active.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700';

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-[#e7ebf0]">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#efeae2]">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-[#f0f2f5] px-3 py-2 sm:px-4">
          <button onClick={onOpenInbox} className="rounded-full p-2 text-slate-600 hover:bg-slate-200 md:hidden" title="Inbox" aria-label="Open inbox">☰</button>
          <button onClick={() => setShowInfo(true)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <Avatar name={active.contact_name} photo={active.photo} className="h-10 w-10 shrink-0 text-base" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-slate-800">{active.contact_name}</p>
              <p className="truncate text-xs text-slate-500">
                <span style={{ color: channel.color }}>{channel.label}</span>
                {active.assigned_agent_name ? ` · ${active.assigned_agent_name}` : ''}
                {active.blocked ? <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">Blocked</span> : null}
              </p>
            </div>
          </button>
          <div className="flex shrink-0 items-center gap-1">
            <span className={`hidden rounded-full px-2 py-0.5 text-[10px] font-medium capitalize sm:inline-flex ${statusBadge}`}>{active.status}</span>
            {isStaff && (
              <select onChange={handleStatusAction} defaultValue="" className="hidden rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600 lg:block">
                <option value="" disabled>Status</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
            )}
            {(isOwner || (isStaff && active.status === 'resolved')) && (
              <button onClick={() => { if (window.confirm('Delete this chat? This cannot be undone.')) onDeleteConversation?.(); }} className="rounded-full p-2 text-slate-600 hover:bg-red-50 hover:text-red-600" title="Delete chat">🗑</button>
            )}
            <button onClick={onToggleNotes} className="rounded-full p-2 text-slate-600 hover:bg-slate-200 md:hidden" title="Notes">📝</button>
            {!isStaff && <button onClick={onDismiss} className="rounded-full p-2 text-slate-600 hover:bg-slate-200" title="Close">✕</button>}
          </div>
        </div>

        <div ref={msgListRef} className="flex-1 overflow-y-auto px-2 py-3 sm:px-4" style={{ backgroundColor: '#efeae2', backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
          <div className="mx-auto flex max-w-5xl flex-col gap-1">
            {mergedMessages.length === 0 && (
              <div className="flex py-16 items-center justify-center"><p className="rounded-lg bg-white/90 px-4 py-2 text-sm text-slate-500 shadow-sm">No messages yet. Send the first reply.</p></div>
            )}
            {mergedMessages.map((m, i) => {
              const prev = mergedMessages[i - 1];
              const showDay = !prev || dayLabel(prev.created_at) !== dayLabel(m.created_at);
              return (
                <div key={m.id}>
                  {showDay && <div className="my-2 flex justify-center"><span className="rounded-full bg-slate-700/10 px-3 py-1 text-[11px] font-medium text-slate-600">{dayLabel(m.created_at)}</span></div>}
                  <MessageBubble
                    m={m}
                    showAgent={showAgent}
                    canDelete={canDeleteMessage(m)}
                    canEdit={m.direction === 'outbound' && !m.media_url && (isOwner || m.agent_id === myId)}
                    onReply={() => { setEditing(null); setReplyingTo(m); textRef.current?.focus(); }}
                    onEdit={() => startEdit(m)}
                    onDelete={() => onDeleteMessage?.(m.id)}
                    replying={replyingTo?.id === m.id}
                    onRetry={() => retryMessage(m)}
                    onOpenImage={setLightbox}
                    onContextMenu={(e) => openMenu(e, m)}
                    isOwner={isOwner}
                  />
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        </div>

        <form
          onSubmit={submit}
          onPaste={onPaste}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); }}
          onDrop={onDrop}
          className="relative border-t border-slate-200 bg-[#f0f2f5] px-2 py-2 sm:px-3"
        >
          {dragging && <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-sky-50/95 text-sm font-medium text-brand">Drop files to attach</div>}
          <div className="mx-auto max-w-5xl">
            {pending.length > 0 && <Previews items={pending} onRemove={removePending} />}
            {editing && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <span><strong>Editing message</strong> — sending creates a new corrected message.</span>
                <button type="button" onClick={() => { setEditing(null); setText(''); }} className="ml-2 text-slate-500 hover:text-slate-800">Cancel</button>
              </div>
            )}
            {replyingTo && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
                <div className="min-w-0"><p className="font-semibold text-brand">Replying</p><p className="truncate">{replyingTo.body || (replyingTo.media_type ? `[${replyingTo.media_type}]` : '')}</p></div>
                <button type="button" onClick={() => setReplyingTo(null)} className="ml-2 text-slate-400 hover:text-slate-700">✕</button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <input ref={fileRef} type="file" accept="image/*,video/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.zip" multiple hidden onChange={(e) => { addFiles(e.target.files || []); if (fileRef.current) fileRef.current.value = ''; }} />
              {!editing && <button type="button" onClick={() => fileRef.current?.click()} className="mb-0.5 rounded-full p-2.5 text-slate-500 hover:bg-slate-100" title="Attach">📎</button>}
              <textarea
                ref={textRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
                rows={1}
                placeholder={editing ? 'Edit message...' : 'Message'}
                className="max-h-40 min-h-[44px] flex-1 resize-none rounded-2xl border-0 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none ring-1 ring-slate-200 focus:ring-sky-300"
              />
              <button type="submit" disabled={sending || (!text.trim() && !pending.length)} className="mb-0.5 rounded-full bg-[#3390ec] p-2.5 text-white hover:bg-[#2b7ed0] disabled:opacity-40" aria-label="Send" title="Send">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </div>
          </div>
        </form>
      </div>

      <div
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX; const startW = notesWidth;
          const onMove = (ev) => setNotesWidth(Math.min(560, Math.max(260, startW - (ev.clientX - startX))));
          const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
          window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
        }}
        className="hidden w-1 shrink-0 cursor-col-resize bg-slate-200 hover:bg-sky-300 md:block"
      />
      {mobileNotes && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onToggleNotes} />}
      <aside className={`flex-col border-l border-slate-200 bg-white ${mobileNotes ? 'fixed inset-y-0 right-0 z-50 flex w-[86vw] max-w-sm shadow-xl' : 'hidden'} md:static md:z-auto md:flex`} style={{ width: mobileNotes ? undefined : notesWidth }}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div><h3 className="text-sm font-semibold text-slate-800">Notes / Forward</h3><p className="text-[11px] text-slate-400">Team only</p></div>
          <button onClick={onToggleNotes} className="rounded-md border border-slate-200 px-2 py-1 text-sm md:hidden">✕</button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {notes.map((m) => (
            <div key={m.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-amber-700">
                <span>{m.agent_name || 'Agent'}</span>
                {canDeleteNote(m) && <button onClick={() => onDeleteNote(m.id)} className="text-slate-400 hover:text-red-500">Delete</button>}
              </div>
              <Media m={m} className="mb-2 max-h-52 w-full rounded-lg object-cover" onOpenImage={setLightbox} />
              {m.body ? <p className="whitespace-pre-wrap break-words text-sm text-slate-700">{m.body}</p> : null}
              <p className="mt-1 text-right text-[10px] text-slate-400">{formatClock(m.created_at)}</p>
            </div>
          ))}
          {!notes.length && <p className="p-2 text-xs text-slate-400">No notes yet.</p>}
        </div>
        {canAssign && (
          <form onSubmit={submitForward} onPaste={onPasteForward} onDragOver={(e) => e.preventDefault()} onDrop={onDropForward} className="border-t border-slate-200 p-3">
            <p className="mb-2 text-xs font-semibold text-slate-500">Forward / Assign</p>
            <select value={forwardAgent} onChange={(e) => setForwardAgent(e.target.value)} className="mb-2 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
              <option value="">Assign agent...</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {forwardFiles.length > 0 && <Previews items={forwardFiles} onRemove={removeForwardFile} small />}
            <textarea value={forwardNote} onChange={(e) => setForwardNote(e.target.value)} rows={2} placeholder="Note (optional)..." className="mb-2 w-full resize-none rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
            <div className="flex gap-2">
              <input ref={forwardFileRef} type="file" accept="image/*,video/*,.pdf,.txt" multiple hidden onChange={(e) => { addForwardFiles(e.target.files || []); if (forwardFileRef.current) forwardFileRef.current.value = ''; }} />
              <button type="button" onClick={() => forwardFileRef.current?.click()} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">Attach</button>
              <button type="submit" disabled={!forwardAgent || forwardBusy} className="flex-1 rounded-lg bg-[#3390ec] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40">{forwardBusy ? 'Sending...' : 'Forward'}</button>
            </div>
          </form>
        )}
        {canNote && !canAssign && (
          <form onSubmit={submitQuickNote} className="border-t border-slate-200 p-3">
            <textarea value={quickNote} onChange={(e) => setQuickNote(e.target.value)} rows={2} placeholder="Internal note..." className="mb-2 w-full resize-none rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
            <button type="submit" disabled={quickBusy || !quickNote.trim()} className="w-full rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40">{quickBusy ? 'Adding...' : 'Add Note'}</button>
          </form>
        )}
      </aside>

      {showInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => setShowInfo(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between"><h3 className="text-sm font-bold text-slate-800">Customer Details</h3><button onClick={() => setShowInfo(false)} className="rounded-md border border-slate-200 px-2 py-0.5 text-sm">✕</button></div>
            <div className="mt-4 flex items-center gap-3"><Avatar name={active.contact_name} photo={active.photo} className="h-14 w-14 text-lg" /><div className="min-w-0"><p className="truncate font-semibold text-slate-800">{active.contact_name}</p><p className="truncate text-sm text-slate-500">{active.external_id}</p></div></div>
            <dl className="mt-4 space-y-2 text-sm">
              <DetailRow label="Channel" value={channel.label} />
              <DetailRow label="Status" value={active.status} />
              <DetailRow label="Assigned to" value={active.assigned_agent_name || 'Unassigned'} />
              <DetailRow label="Unread" value={`${active.unread || 0}`} />
              <DetailRow label="Last message" value={formatFull(active.last_message_at)} />
              <DetailRow label="Created" value={formatFull(active.created_at)} />
            </dl>
          </div>
        </div>
      )}
      {menu && (
        <div className="fixed z-[80] min-w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-xl" style={{ left: menu.x, top: menu.y }} onClick={(e) => e.stopPropagation()}>
          {!menu.message.deleted_at && <button className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { setEditing(null); setReplyingTo(menu.message); setMenu(null); textRef.current?.focus(); }}>Reply</button>}
          {((menu.message.body || menu.message.media_url) || (menu.message.deleted_at && isOwner && (menu.message.deleted_body || menu.message.deleted_media_url))) && <button className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { copyMessage(menu.message); setMenu(null); }}>Copy</button>}
          {!menu.message.deleted_at && menu.message.body && <button className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50" onClick={async () => { const msg = menu.message; setMenu(null); const rect = { x: Math.min(menu.x, window.innerWidth - 340), y: Math.min(menu.y, window.innerHeight - 220) }; setTranslatePop({ x: rect.x, y: rect.y, text: msg.body, translated: '', loading: true, error: '' }); try { const res = await api.translate(msg.body); setTranslatePop((p) => p && p.text === msg.body ? { ...p, translated: res.translated, loading: false } : p); } catch (e) { setTranslatePop((p) => p && p.text === msg.body ? { ...p, loading: false, error: e.message || 'Translation failed' } : p); } }}>Translate to English</button>}
          {!menu.message.deleted_at && menu.message.direction === 'outbound' && !menu.message.media_url && (isOwner || menu.message.agent_id === myId) && <button className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { startEdit(menu.message); setMenu(null); }}>Edit</button>}
          {!menu.message.deleted_at && canDeleteMessage(menu.message) && <button className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50" onClick={() => { if (window.confirm('Delete this message?')) onDeleteMessage?.(menu.message.id); setMenu(null); }}>Delete</button>}
        </div>
      )}
      {translatePop && (
        <div className="fixed z-[80] w-[min(320px,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-3 shadow-xl" style={{ left: translatePop.x, top: translatePop.y }} onClick={(e) => e.stopPropagation()}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-700">Translate to English</p>
            <button onClick={() => setTranslatePop(null)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
          </div>
          <p className="mb-2 max-h-24 overflow-y-auto whitespace-pre-wrap break-words rounded-md bg-slate-50 p-2 text-xs text-slate-500">{translatePop.text}</p>
          <div className="max-h-32 overflow-y-auto whitespace-pre-wrap break-words rounded-md bg-sky-50 p-2 text-sm text-slate-800">
            {translatePop.loading ? 'Translating...' : translatePop.error ? <span className="text-red-500">{translatePop.error}</span> : translatePop.translated}
          </div>
        </div>
      )}
      {lightbox && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1.5 text-white hover:bg-white/20" onClick={() => setLightbox(null)}>Close</button>
          <img src={lightbox} alt="preview" className="max-h-full max-w-full rounded object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}