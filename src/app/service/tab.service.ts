import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Tab, TabRequest } from '../models/tab.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TabService {

  private readonly http     = inject(HttpClient);
  private readonly baseUrl  = `${environment.apiUrl}/api/v1/tabs`;
  private readonly ACTIVE_KEY = 'mc_active_tab';

  // ── State ──────────────────────────────────────────────────────────────────
  private readonly _tabs     = signal<Tab[]>([]);
  private readonly _activeId = signal<number | null>(
    JSON.parse(localStorage.getItem(this.ACTIVE_KEY) ?? 'null')
  );
  private readonly _loading  = signal(false);

  readonly tabs      = this._tabs.asReadonly();
  readonly activeId  = this._activeId.asReadonly();
  readonly loading   = this._loading.asReadonly();
  readonly activeTab = computed(() =>
    this._tabs().find(t => t.id === this._activeId()) ?? this._tabs()[0] ?? null
  );

  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Load ───────────────────────────────────────────────────────────────────
  loadTabs(): Observable<Tab[]> {
    this._loading.set(true);
    return this.http.get<Tab[]>(this.baseUrl).pipe(
      tap(tabs => {
        this._tabs.set(tabs);
        const savedId = this._activeId();
        const exists  = tabs.some(t => t.id === savedId);
        this.setActive(exists ? savedId! : (tabs[0]?.id ?? null));
        this._loading.set(false);
      }),
      catchError(err => {
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────
  createTab(name = 'untitled.ms', code = ''): Observable<Tab> {
    const position = this._tabs().length;
    const req: TabRequest = { name, code, position };
    return this.http.post<Tab>(this.baseUrl, req).pipe(
      tap(tab => {
        this._tabs.update(tabs => [...tabs, tab]);
        this.setActive(tab.id);
      })
    );
  }

  deleteTab(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        const remaining = this._tabs().filter(t => t.id !== id);
        this._tabs.set(remaining);
        if (this._activeId() === id) {
          this.setActive(remaining.at(-1)?.id ?? null);
        }
      })
    );
  }

  // ── Local update + debounced backend save ──────────────────────────────────
  updateCode(id: number, code: string): void {
    this._tabs.update(tabs => tabs.map(t => t.id === id ? { ...t, code } : t));
    this.debounceSave(id);
  }

  renameTab(id: number, name: string): void {
    this._tabs.update(tabs => tabs.map(t => t.id === id ? { ...t, name } : t));
    this.debounceSave(id);
  }

  setActive(id: number | null): void {
    this._activeId.set(id);
    localStorage.setItem(this.ACTIVE_KEY, JSON.stringify(id));
  }

  // ── Private ────────────────────────────────────────────────────────────────
  private debounceSave(id: number): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      const tab = this._tabs().find(t => t.id === id);
      if (!tab) return;
      const req: TabRequest = { name: tab.name, code: tab.code, position: tab.position };
      this.http.put<Tab>(`${this.baseUrl}/${id}`, req).subscribe();
    }, 1500);
  }
}
