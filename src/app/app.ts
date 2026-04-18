import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: '../app/pages/compiler-page/compiler-page/compiler-page.html',
})
export class App {
  protected readonly title = signal('minicompiler-front');
}
