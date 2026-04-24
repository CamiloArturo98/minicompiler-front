import {
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  ViewChild,
  ChangeDetectionStrategy,
  AfterViewChecked,
} from '@angular/core';
import { DatePipe } from '@angular/common';

import {
  AiAction,
  AiMessage,
  CompileError,
  CompileResponse,
} from '../../models/compiler.models';

import { AiService } from '../../service/ai.service';

@Component({
  selector: 'app-ai-panel',
  imports: [DatePipe],
  templateUrl: './ai-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiPanel implements AfterViewChecked {

  @ViewChild('messagesContainer')
  private messagesContainer?: ElementRef<HTMLDivElement>;

  readonly response   = input<CompileResponse | null>(null);
  readonly error      = input<CompileError | null>(null);
  readonly sourceCode = input<string>('');
  readonly close      = output<void>();

  private readonly aiService = inject(AiService);

  readonly messages  = signal<AiMessage[]>([]);
  readonly loading   = signal<boolean>(false);
  readonly userInput = signal<string>('');

  private shouldScroll = false;

  readonly quickActions: ReadonlyArray<{
    id: AiAction;
    icon: string;
    label: string;
  }> = [
    { id: 'EXPLAIN_ERROR', icon: '🔍', label: 'Explicar error' },
    { id: 'SUGGEST_FIX',   icon: '🔧', label: 'Sugerir fix' },
    { id: 'GENERATE_CODE', icon: '✨', label: 'Generar código' },
    { id: 'ANALYZE_CODE',  icon: '📊', label: 'Analizar código' },
  ];

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  triggerAction(action: AiAction): void {
    const err = this.error();
    const code = this.sourceCode();

    if ((action === 'EXPLAIN_ERROR' || action === 'SUGGEST_FIX') && !err) {
      this.addAssistantMessage('⚠️ Primero ejecuta tu código para que haya un error que analizar.');
      return;
    }

    if (action === 'ANALYZE_CODE' && !code.trim()) {
      this.addAssistantMessage('⚠️ El editor está vacío. Escribe código primero.');
      return;
    }

    if (action === 'GENERATE_CODE') {
      this.addUserMessage('Genera código de ejemplo interesante para MiniScript');
      this.callAi({
        action,
        userPrompt: 'un algoritmo interesante que demuestre las capacidades del lenguaje'
      });
      return;
    }

    const labels: Record<AiAction, string> = {
      EXPLAIN_ERROR: 'Explica el error que obtuve',
      SUGGEST_FIX:   'Sugiere cómo arreglar el código',
      GENERATE_CODE: 'Genera código de ejemplo',
      ANALYZE_CODE:  'Analiza mi código'
    };

    this.addUserMessage(labels[action]);

    this.callAi({
      action,
      sourceCode: code,
      errorMessage: err?.message ?? ''
    });
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

    this.callAi({
      action: 'GENERATE_CODE',
      sourceCode: this.sourceCode(),
      userPrompt: text
    });
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
      },
      error: () => {
        this.replaceLoadingMessage(
          loadingMsg,
          '❌ Error al conectar con la IA. Verifica tu API key en el backend.',
          request.action
        );
        this.loading.set(false);
      }
    });
  }

  private addUserMessage(content: string): void {
    this.messages.update(msgs => [
      ...msgs,
      { role: 'user', content, timestamp: new Date() }
    ]);
    this.shouldScroll = true;
  }

  private addAssistantMessage(content: string): void {
    this.messages.update(msgs => [
      ...msgs,
      { role: 'assistant', content, timestamp: new Date() }
    ]);
    this.shouldScroll = true;
  }

  private addLoadingMessage(): AiMessage {
    const msg: AiMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true
    };

    this.messages.update(msgs => [...msgs, msg]);
    this.shouldScroll = true;

    return msg;
  }

  private replaceLoadingMessage(
    ref: AiMessage,
    content: string,
    action: AiAction
  ): void {
    this.messages.update(msgs =>
      msgs.map(m =>
        m === ref ? { ...m, content, loading: false, action } : m
      )
    );

    this.shouldScroll = true;
  }

  private scrollToBottom(): void {
    const el = this.messagesContainer?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }

  getActionLabel(action: AiAction): string {
    const labels: Record<AiAction, string> = {
      EXPLAIN_ERROR: 'Explicar error',
      SUGGEST_FIX:   'Sugerir fix',
      GENERATE_CODE: 'Generar código',
      ANALYZE_CODE:  'Analizar'
    };

    return labels[action] ?? action;
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
      .replace(/^(?!<[h|p|l|u|o|c])(.*)/gm, (_, p) =>
        p ? `<p>${p}</p>` : ''
      );
  }
}
