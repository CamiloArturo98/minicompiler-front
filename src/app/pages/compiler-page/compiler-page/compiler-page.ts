import { Component, HostListener, inject, signal } from '@angular/core';
import { CompilerService } from '../../../service/compiler.service';
import {
  CompileResponse, CompileError, EditorOptions, CODE_EXAMPLES
} from '../../../models/compiler.models';
import { EditorComponentTs }      from '../../../components/editor/editor.component.ts/editor.component.ts';
import { ToolbarComponent }     from '../../../components/toolbar/toolbar.component/toolbar.component';
import { OutputPanelComponent } from '../../../components/output-panel/output-panel.component/output-panel.component';
import { StatusBarComponent }   from '../../../components/status-bar/status-bar.component/status-bar.component';


@Component({
  selector: 'app-compiler-page',
  standalone: true,
  imports: [ToolbarComponent, EditorComponentTs, OutputPanelComponent, StatusBarComponent],
  templateUrl: './compiler-page.html',
})
export class CompilerPageComponent {
  private readonly compilerService = inject(CompilerService);

  sourceCode   = signal<string>(CODE_EXAMPLES['fibonacci'].code);
  loading      = signal<boolean>(false);
  response     = signal<CompileResponse | null>(null);
  compileError = signal<CompileError | null>(null);
  cursorLine   = signal<number>(1);
  cursorCol    = signal<number>(1);
  editorWidth  = 50;

  options = signal<EditorOptions>({
    optimize:    true,
    showTokens:  false,
    showAst:     false,
    showBytecode: false
  });

  // ─── Resize ─────────────────────────────────────────────────────────────────
  private resizing = false;
  private startX   = 0;
  private startW   = 50;

  startResize(e: MouseEvent): void {
    this.resizing = true;
    this.startX   = e.clientX;
    this.startW   = this.editorWidth;
    e.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (!this.resizing) return;
    const delta = ((e.clientX - this.startX) / window.innerWidth) * 100;
    this.editorWidth = Math.min(75, Math.max(25, this.startW + delta));
  }

  @HostListener('document:mouseup')
  onMouseUp(): void { this.resizing = false; }

  // ─── Keyboard shortcut ───────────────────────────────────────────────────────
  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      this.onRun();
    }
  }

  // ─── Handlers ────────────────────────────────────────────────────────────────
  onCodeChange(code: string): void {
    this.sourceCode.set(code);
    const lines = code.split('\n');
    this.cursorLine.set(lines.length);
    this.cursorCol.set(lines[lines.length - 1].length + 1);
  }

  onLoadExample(key: string): void {
    const ex = CODE_EXAMPLES[key];
    if (ex) {
      this.sourceCode.set(ex.code);
      this.response.set(null);
      this.compileError.set(null);
    }
  }

  onToggle(key: keyof EditorOptions): void {
    this.options.update(opts => ({ ...opts, [key]: !opts[key] }));
  }

  onRun(): void {
    if (this.loading()) return;

    const code = this.sourceCode().trim();
    if (!code) return;

    this.loading.set(true);
    this.response.set(null);
    this.compileError.set(null);

    const opts = this.options();
    this.compilerService.compile({
      sourceCode:   code,
      optimize:     opts.optimize,
      showTokens:   opts.showTokens,
      showAst:      opts.showAst,
      showBytecode: opts.showBytecode || opts.optimize
    }).subscribe({
      next: (res) => {
        this.response.set(res);
        this.loading.set(false);
      },
      error: (err: CompileError) => {
        this.compileError.set(err);
        this.loading.set(false);
      }
    });
  }

  lineCount(): number {
    return this.sourceCode().split('\n').length;
  }
}
