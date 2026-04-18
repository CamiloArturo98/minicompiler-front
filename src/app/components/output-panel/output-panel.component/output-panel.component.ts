import { Component, input, computed, signal } from '@angular/core';
import { CompileResponse, CompileError, CompileTab, Token } from '../../../models/compiler.models';

@Component({
  selector: 'app-output-panel',
  imports: [],
  templateUrl: './output-panel.component.html',
})
export class OutputPanelComponent {
  response = input<CompileResponse | null>(null);
  error    = input<CompileError | null>(null);

  activeTab = signal<CompileTab>('output');

  availableTabs = computed(() => {
    const r = this.response();
    return [
      { id: 'output'   as CompileTab, label: 'Output',   count: r?.executionResult?.output?.length ?? null },
      { id: 'tokens'   as CompileTab, label: 'Tokens',   count: r?.tokens?.length ?? null },
      { id: 'ast'      as CompileTab, label: 'AST',      count: null },
      { id: 'bytecode' as CompileTab, label: 'Bytecode', count: r?.optimizedBytecode?.length ?? r?.bytecode?.length ?? null },
      { id: 'memory'   as CompileTab, label: 'Memory',   count: r ? Object.keys(r.executionResult.finalMemory ?? {}).length : null },
    ];
  });

  memoryEntries = computed(() => {
    const mem = this.response()?.executionResult?.finalMemory ?? {};
    return Object.entries(mem).map(([key, value]) => ({
      key,
      value,
      type: value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value,
      display: JSON.stringify(value)
    }));
  });
}
