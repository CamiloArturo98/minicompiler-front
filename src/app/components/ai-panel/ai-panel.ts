import {
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  computed,
  ViewChild,
  ChangeDetectionStrategy,
  AfterViewChecked,
  OnInit,
} from '@angular/core';
import { DatePipe } from '@angular/common';

import {
  AiAction,
  AiHistoryEntry,
  AiMessage,
  CompileError,
  CompileResponse,
} from '../../models/compiler.models';

import { AiService } from '../../service/ai.service';

type PanelTab = 'chat' | 'history';

@Component({
  selector: 'app-ai-panel',
  imports: [DatePipe],
  templateUrl: './ai-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiPanel implements AfterViewChecked, OnInit {

  @ViewChild('messagesContainer')
  private messagesContainer?: ElementRef<HTMLDivElement>;

  readonly response   = input<CompileResponse | null>(null);
  readonly error      = input<CompileError | null>(null);
  readonly sourceCode = input<string>('');
  readonly close      = output<void>();

  private readonly aiService = inject(AiService);

  readonly messages       = signal<AiMessage[]>([]);
  readonly loading        = signal(false);
  readonly userInput      = signal('');
  readonly activeTab      = signal<PanelTab>('chat');
  readonly history        = signal<AiHistoryEntry[]>([]);
  readonly historyLoading = signal(false);
  readonly expandedId     = signal<number | null>(null);

  readonly historyEmpty = computed(() => this.history().length === 0);

  private shouldScroll = false;

  readonly quickActions: ReadonlyArray<{ id: AiAction; icon: string; label: string }> = [
    { id: 'EXPLAIN_ERROR', icon: '🔍', label: 'Explain error'  },
    { id: 'SUGGEST_FIX',   icon: '🔧', label: 'Suggest fix'   },
    { id: 'GENERATE_CODE', icon: '✨', label: 'Generate code'  },
    { id: 'ANALYZE_CODE',  icon: '📊', label: 'Analyze code'  },
  ];

  ngOnInit(): void {
    this.loadHistory();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  setTab(tab: PanelTab): void {
    this.activeTab.set(tab);
    if (tab === 'history') this.loadHistory();
  }

  loadHistory(): void {
    this.historyLoading.set(true);
    this.aiService.getHistory(50).subscribe({
      next: (data) => {
        this.history.set(data);
        this.historyLoading.set(false);
      },
      error: () => this.historyLoading.set(false),
    });
  }

  toggleExpand(id: number): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  deleteHistoryItem(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.aiService.deleteHistoryItem(id).subscribe({
      next: () => this.history.update(h => h.filter(e => e.id !== id)),
    });
  }

  clearHistory(): void {
    this.aiService.clearHistory().subscribe({
      next: () => this.history.set([]),
    });
  }

  triggerAction(action: AiAction): void {
    const err      = this.error();
    const res      = this.response();
    const code     = this.sourceCode();
    const hasRun   = err !== null || res !== null;
    const hasError = err !== null;

    if (action === 'EXPLAIN_ERROR' || action === 'SUGGEST_FIX') {
      if (!hasRun) {
        this.addAssistantMessage('⚠️ Run your code first so there is an error to analyze.');
        return;
      }
      if (!hasError) {
        this.addAssistantMessage('✅ Your code runs correctly and has no errors — no fix needed!');
        return;
      }
    }

    if (action === 'ANALYZE_CODE' && !code.trim()) {
      this.addAssistantMessage('⚠️ The editor is empty. Write some code first.');
      return;
    }

    const labels: Record<AiAction, string> = {
      EXPLAIN_ERROR: 'Explain the error I got',
      SUGGEST_FIX:   'Suggest how to fix the code',
      GENERATE_CODE: 'Generate example code',
      ANALYZE_CODE:  'Analyze my code',
    };

    if (action === 'GENERATE_CODE') {
      this.addUserMessage('Generate interesting example code for MiniScript');
      this.callAi({ action, userPrompt: 'an interesting algorithm that showcases the language capabilities' });
      return;
    }

    this.addUserMessage(labels[action]);
    this.callAi({ action, sourceCode: code, errorMessage: err?.message ?? '' });
  }

  onEnter(event: KeyboardEvent): void {
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(): void {
    const text = this.userInput().trim();
    if (!text || this.loading()) return;
    this.addUserMessage(text);
    this.userInput.set('');
    this.callAi({ action: 'GENERATE_CODE', sourceCode: this.sourceCode(), userPrompt: text });
  }

  private callAi(request: {
    action: AiAction;
    sourceCode?: string;
    errorMessage?: string;
    userPrompt?: string;
  }): void {
    this.loading.set(true);
    const loadingMsg = this.addLoadingMessage();

    this.aiService.chat(request).subscribe({
      next: (res) => {
        this.replaceLoadingMessage(loadingMsg, res.content, request.action);
        this.loading.set(false);
        this.aiService.getHistory(50).subscribe(data => this.history.set(data));
      },
      error: () => {
        this.replaceLoadingMessage(loadingMsg, '❌ Failed to connect to AI.', request.action);
        this.loading.set(false);
      },
    });
  }

  private addUserMessage(content: string): void {
    this.messages.update(msgs => [...msgs, { role: 'user', content, timestamp: new Date() }]);
    this.shouldScroll = true;
  }

  private addAssistantMessage(content: string): void {
    this.messages.update(msgs => [...msgs, { role: 'assistant', content, timestamp: new Date() }]);
    this.shouldScroll = true;
  }

  private addLoadingMessage(): AiMessage {
    const msg: AiMessage = { role: 'assistant', content: '', timestamp: new Date(), loading: true };
    this.messages.update(msgs => [...msgs, msg]);
    this.shouldScroll = true;
    return msg;
  }

  private replaceLoadingMessage(ref: AiMessage, content: string, action: AiAction): void {
    this.messages.update(msgs =>
      msgs.map(m => m === ref ? { ...m, content, loading: false, action } : m)
    );
    this.shouldScroll = true;
  }

  private scrollToBottom(): void {
    const el = this.messagesContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  getActionLabel(action: AiAction): string {
    const labels: Record<AiAction, string> = {
      EXPLAIN_ERROR: 'Explain error',
      SUGGEST_FIX:   'Suggest fix',
      GENERATE_CODE: 'Generate code',
      ANALYZE_CODE:  'Analyze',
    };
    return labels[action] ?? action;
  }

  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      EXPLAIN_ERROR: '🔍',
      SUGGEST_FIX:   '🔧',
      GENERATE_CODE: '✨',
      ANALYZE_CODE:  '📊',
    };
    return icons[action] ?? '💬';
  }

  renderMarkdown(text: string): string {
    return text
      .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[hpluo c])(.*)/gm, (_, p) => p ? `<p>${p}</p>` : '');
  }
}
