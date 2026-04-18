import { Component, input, output } from '@angular/core';
import { EditorOptions, CODE_EXAMPLES } from '../../../models/compiler.models';

@Component({
  selector: 'app-toolbar',
  imports: [],
  templateUrl: './toolbar.component.html',
})
export class ToolbarComponent {
  options    = input.required<EditorOptions>();
  loading    = input<boolean>(false);
  run        = output<void>();
  loadExample = output<string>();
  toggleOption = output<keyof EditorOptions>();

  readonly examples = CODE_EXAMPLES;
  readonly exampleKeys = Object.keys(CODE_EXAMPLES);
  readonly optionList: { key: keyof EditorOptions; label: string }[] = [
    { key: 'optimize',    label: 'Optimize' },
    { key: 'showTokens',  label: 'Tokens'   },
    { key: 'showAst',     label: 'AST'      },
    { key: 'showBytecode', label: 'Bytecode' },
  ];
}
