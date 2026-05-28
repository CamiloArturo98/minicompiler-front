import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogRecord } from '../../models/logs.models';
import { LogService } from '../../service/logs.service';

@Component({
  selector: 'app-logs-page',
  imports: [RouterLink],
  templateUrl: './logs-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogsPageComponent implements OnInit {
  private readonly logService = inject(LogService);

  readonly logs          = signal<LogRecord[]>([]);
  readonly loading       = signal(false);
  readonly error         = signal<string | null>(null);
  readonly currentPage   = signal(0);
  readonly totalPages    = signal(0);
  readonly totalElements = signal(0);
  readonly selectedLog   = signal<LogRecord | null>(null);

  readonly pageSize = 20;

  readonly hasNext = computed(() => this.currentPage() < this.totalPages() - 1);
  readonly hasPrev = computed(() => this.currentPage() > 0);
  readonly pageLabel = computed(
    () => `Page ${this.currentPage() + 1} of ${this.totalPages() || 1}`,
  );

  ngOnInit(): void {
    this.loadPage(0);
  }

  loadPage(page: number): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.selectedLog.set(null);

    this.logService.findAll(page, this.pageSize).subscribe({
      next: (res) => {
        this.logs.set(res.content);
        this.currentPage.set(res.page);
        this.totalPages.set(res.totalPages);
        this.totalElements.set(Number(res.totalElements));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load compilation logs. Please try again.');
        this.loading.set(false);
      },
    });
  }

  toggleDetail(log: LogRecord): void {
    this.selectedLog.update((cur) => (cur?.id === log.id ? null : log));
  }

  nextPage(): void {
    if (this.hasNext()) this.loadPage(this.currentPage() + 1);
  }

  prevPage(): void {
    if (this.hasPrev()) this.loadPage(this.currentPage() - 1);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString();
  }

  truncate(str: string, max = 72): string {
    const firstLine = str.split('\n')[0];
    return firstLine.length > max ? firstLine.slice(0, max) + '…' : firstLine;
  }
  decodeBase64(value: string): string {
  try {
    return decodeURIComponent(
      atob(value)
        .split('')
        .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
  } catch {
    return value;
  }
}
}
