import { Component, HostListener, inject, signal, computed, OnInit } from '@angular/core';
import { CompilerService }    from '../../../service/compiler.service';
import { TabService }         from '../../../service/tab.service';
import { CompileResponse, CompileError, EditorOptions, CODE_EXAMPLES }
  from '../../../models/compiler.models';
import { EditorComponentTs }    from '../../../components/editor/editor.component.ts/editor.component.ts';
import { ToolbarComponent }     from '../../../components/toolbar/toolbar.component/toolbar.component';
import { OutputPanelComponent } from '../../../components/output-panel/output-panel.component/output-panel.component';
import { StatusBarComponent }   from '../../../components/status-bar/status-bar.component/status-bar.component';
import { AiPanel }              from '../../../components/ai-panel/ai-panel';
import { TabBarComponent }      from '../../../components/tab-bar/tab-bar';

@Component({
  selector: 'app-compiler-page',
  standalone: true,
  imports: [ToolbarComponent, EditorComponentTs, OutputPanelComponent,
            StatusBarComponent, AiPanel, TabBarComponent],
  templateUrl: './compiler-page.html',
})
export class CompilerPageComponent implements OnInit {

  private readonly compilerService = inject(CompilerService);
  readonly tabService              = inject(TabService);

  // Señal computada — se actualiza automáticamente al cambiar de pestaña
  readonly activeCode = computed(() => this.tabService.activeTab()?.code ?? '');

  loading      = signal(false);
  response     = signal<CompileResponse | null>(null);
  compileError = signal<CompileError | null>(null);
  cursorLine   = signal(1);
  cursorCol    = signal(1);
  aiOpen       = signal(false);
  editorWidth  = 50;

  options = signal<EditorOptions>({
    optimize:     true,
    showTokens:   false,
    showAst:      false,
    showBytecode: false,
  });

  private resizing = false;
  private startX   = 0;
  private startW   = 50;

  ngOnInit(): void {
    this.tabService.loadTabs().subscribe({
      next: tabs => {
        if (tabs.length === 0) {
          // Primera vez — crea una pestaña con el ejemplo de fibonacci
          this.tabService
            .createTab('main.ms', CODE_EXAMPLES['fibonacci'].code)
            .subscribe();
        }
      },
      error: () => {}
    });
  }

  lineCount(): number {
    return this.activeCode().split('\n').length;
  }

  onCodeChange(code: string): void {
    const id = this.tabService.activeId();
    if (id == null) return;
    this.tabService.updateCode(id, code);
    const lines = code.split('\n');
    this.cursorLine.set(lines.length);
    this.cursorCol.set(lines[lines.length - 1].length + 1);
  }

  onLoadExample(key: string): void {
    const ex = CODE_EXAMPLES[key];
    if (!ex) return;
    const id = this.tabService.activeId();
    if (id == null) return;
    this.tabService.updateCode(id, ex.code);
    this.response.set(null);
    this.compileError.set(null);
  }

  onToggle(key: keyof EditorOptions): void {
    this.options.update(opts => ({ ...opts, [key]: !opts[key] }));
  }

  onRun(): void {
    if (this.loading()) return;
    const code = this.activeCode().trim();
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
      showBytecode: opts.showBytecode || opts.optimize,
    }).subscribe({
      next:  res => { this.response.set(res);     this.loading.set(false); },
      error: err => { this.compileError.set(err); this.loading.set(false); },
    });
  }

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

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      this.onRun();
    }
  }
}
