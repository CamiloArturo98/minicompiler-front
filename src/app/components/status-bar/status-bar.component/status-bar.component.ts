import { Component, input } from '@angular/core';
import { CompileResponse } from '../../../models/compiler.models';

@Component({
  selector: 'app-status-bar',
  imports: [],
  templateUrl: './status-bar.component.html',
})
export class StatusBarComponent {
  response   = input<CompileResponse | null>(null);
  cursorLine = input<number>(1);
  cursorCol  = input<number>(1);
}
