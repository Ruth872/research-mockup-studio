import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { triageApi, type ChatMessage } from "@/lib/triageApi";

const POLL_MS = 5000;
const MAX_LENGTH = 2000;

const ROLE_LABELS: Record<ChatMessage["sender_role"], string> = {
  patient: "Patient",
  doctor: "Doctor",
  nurse: "Nurse",
  admin: "Administrator",
};

interface CaseChatProps {
  caseId: string;
  /** Called after the conversation is opened or changes, so lists can clear unread badges. */
  onActivity?: () => void;
}

/**
 * The conversation between a patient and the clinicians responsible for one case.
 * Polls for new messages while the page is visible; the API decides who may send.
 */
export default function CaseChat({ caseId, onActivity }: CaseChatProps) {
  const { user } = useAuth();
  const isPatient = user?.role === "patient";
  const myId = user ? Number(user.id) : null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [canSend, setCanSend] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const lastId = useRef(0);
  const listRef = useRef<HTMLOListElement>(null);
  const onActivityRef = useRef(onActivity);
  onActivityRef.current = onActivity;

  const merge = useCallback((incoming: ChatMessage[]) => {
    if (!incoming.length) return;
    setMessages((current) => {
      const known = new Set(current.map((m) => m.id));
      return [...current, ...incoming.filter((m) => !known.has(m.id))];
    });
    lastId.current = Math.max(lastId.current, ...incoming.map((m) => m.id));
  }, []);

  const poll = useCallback(async () => {
    try {
      const res = await triageApi.getMessages(caseId, lastId.current);
      setCanSend(res.can_send);
      setLoadError(null);
      if (res.messages.length) {
        merge(res.messages);
        onActivityRef.current?.();
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Messages could not be loaded.");
    } finally {
      setLoaded(true);
    }
  }, [caseId, merge]);

  useEffect(() => {
    setMessages([]);
    setLoaded(false);
    lastId.current = 0;
    poll().then(() => onActivityRef.current?.());
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") poll();
    }, POLL_MS);
    return () => window.clearInterval(interval);
  }, [poll]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  const send = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setSendError(null);
    try {
      merge([await triageApi.sendMessage(caseId, content)]);
      setDraft("");
      onActivityRef.current?.();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "The message could not be sent.");
      // The case may have been closed or reassigned meanwhile.
      poll();
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <section aria-label="Case messages" className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      {isPatient && (
        <p className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 rounded-t-xl">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
          Not for emergencies. If you feel much worse, go to the nearest health facility or call emergency services now.
        </p>
      )}

      <ol
        ref={listRef}
        aria-live="polite"
        className="max-h-[45vh] min-h-[10rem] space-y-3 overflow-y-auto p-3 sm:max-h-80"
      >
        {!loaded ? (
          <li className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading messages…
          </li>
        ) : messages.length === 0 ? (
          <li className="py-8 text-center text-xs text-muted-foreground">
            {isPatient
              ? "No messages yet. A clinician may contact you here about this assessment, and you can add information."
              : "No messages yet. Ask the patient for any information you need to assess the case."}
          </li>
        ) : (
          messages.map((message) => {
            const mine = message.sender_id === myId;
            return (
              <li key={message.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <span className="mb-0.5 text-[11px] text-muted-foreground">
                  {mine ? "You" : `${message.sender_name} · ${ROLE_LABELS[message.sender_role]}`}
                  {" · "}
                  {new Date(message.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                </span>
                <p
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
                    mine
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                  }`}
                >
                  {message.content}
                </p>
              </li>
            );
          })
        )}
      </ol>

      {loadError && (
        <p role="alert" className="border-t border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{loadError}</p>
      )}

      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        {canSend ? (
          <>
            <label htmlFor={`message-${caseId}`} className="sr-only">Message</label>
            <div className="flex items-end gap-2">
              <textarea
                id={`message-${caseId}`}
                rows={2}
                value={draft}
                maxLength={MAX_LENGTH}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={isPatient ? "Write to the clinician…" : "Write to the patient…"}
                className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button type="button" onClick={send} disabled={sending || !draft.trim()} className="h-11 w-11 flex-shrink-0 rounded-xl p-0" aria-label="Send message">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Enter to send · Shift+Enter for a new line</p>
            {sendError && <p role="alert" className="mt-2 text-xs text-red-700">{sendError}</p>}
          </>
        ) : (
          loaded && (
            <p className="text-xs text-muted-foreground">
              {isPatient
                ? "This case is closed, so new messages cannot be sent. Submit a new assessment if you need help."
                : "Messaging is read-only here. Take the case to message the patient; closed cases cannot receive messages."}
            </p>
          )
        )}
      </div>
    </section>
  );
}
