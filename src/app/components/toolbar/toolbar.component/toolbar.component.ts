import { Component, input, output, inject } from '@angular/core';
import { EditorOptions, CODE_EXAMPLES } from '../../../models/compiler.models';
import { AuthService } from '../../../service/auth.service';

@Component({
  selector: 'app-toolbar',
  imports: [],
  templateUrl: './toolbar.component.html',
})
export class ToolbarComponent {
  readonly auth = inject(AuthService);

  options      = input.required<EditorOptions>();
  loading      = input<boolean>(false);
  run          = output<void>();
  loadExample  = output<string>();
  toggleOption = output<keyof EditorOptions>();

  readonly examples    = CODE_EXAMPLES;
  readonly exampleKeys = Object.keys(CODE_EXAMPLES);
  readonly optionList: { key: keyof EditorOptions; label: string }[] = [
    { key: 'optimize',    label: 'Optimize'  },
    { key: 'showTokens',  label: 'Tokens'    },
    { key: 'showAst',     label: 'AST'       },
    { key: 'showBytecode', label: 'Bytecode' },
  ];
}
