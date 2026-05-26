import { Component, signal, inject, DestroyRef } from '@angular/core';
import {
  RouterOutlet, Router,
  NavigationStart, NavigationEnd,
  NavigationCancel, NavigationError
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {

  readonly loading  = signal(false);
  readonly complete = signal(false);

  constructor() {
    const router     = inject(Router);
    const destroyRef = inject(DestroyRef);

    router.events.pipe(takeUntilDestroyed(destroyRef)).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.complete.set(false);
        this.loading.set(true);
      } else if (
        event instanceof NavigationEnd   ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.complete.set(true);
        setTimeout(() => this.loading.set(false), 350);
      }
    });
  }
}
