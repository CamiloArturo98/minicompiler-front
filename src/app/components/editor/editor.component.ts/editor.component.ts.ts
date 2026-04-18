import {
  Component, ElementRef, ViewChild, AfterViewInit,
  OnDestroy, input, output, OnChanges, SimpleChanges
} from '@angular/core';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, historyKeymap, history } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { HighlightStyle, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const amberTheme = EditorView.theme({
  '&': { backgroundColor: 'transparent', height: '100%' },
  '.cm-content': { caretColor: '#f59e0b', padding: '12px 0' },
  '.cm-line': { padding: '0 16px' },
}, { dark: true });

const amberHighlight = HighlightStyle.define([
  { tag: tags.keyword,        color: '#f59e0b', fontWeight: '600' },
  { tag: tags.comment,        color: '#555566', fontStyle: 'italic' },
  { tag: tags.string,         color: '#86efac' },
  { tag: tags.number,         color: '#93c5fd' },
  { tag: tags.bool,           color: '#f472b6' },
  { tag: tags.null,           color: '#f472b6' },
  { tag: tags.variableName,   color: '#e2e8f0' },
  { tag: tags.function(tags.variableName), color: '#fde68a' },
  { tag: tags.definition(tags.variableName), color: '#a5f3fc' },
  { tag: tags.operator,       color: '#cd7c3a' },
  { tag: tags.punctuation,    color: '#888898' },
  { tag: tags.typeName,       color: '#a78bfa' },
]);
@Component({
  selector: 'app-editor',
  imports: [],
  templateUrl: './editor.component.ts.html',
})
export class EditorComponentTs implements AfterViewInit, OnDestroy, OnChanges {
    @ViewChild('editorHost') editorHost!: ElementRef<HTMLDivElement>;

  value    = input<string>('');
  readonly = input<boolean>(false);
  changed  = output<string>();

  private view?: EditorView;

  ngAfterViewInit(): void {
    this.initEditor();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && this.view) {
      const current = this.view.state.doc.toString();
      const next = changes['value'].currentValue as string;
      if (current !== next) {
        this.view.dispatch({
          changes: { from: 0, to: current.length, insert: next }
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.view?.destroy();
  }

  private initEditor(): void {
    const state = EditorState.create({
      doc: this.value(),
      extensions: [
        history(),
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        javascript(),
        amberTheme,
        syntaxHighlighting(amberHighlight),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            this.changed.emit(update.state.doc.toString());
          }
        }),
        EditorState.readOnly.of(this.readonly()),
        EditorView.lineWrapping,
      ]
    });

    this.view = new EditorView({
      state,
      parent: this.editorHost.nativeElement
    });
  }
}
