import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Tab, TabRequest } from '../models/tab.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TabService {

  private readonly http           = inject(HttpClient);
  private readonly baseUrl        = `${environment.apiUrl}/api/v1/tabs`;
  private readonly ACTIVE_KEY     = 'mc_active_tab';
  private readonly LOCAL_TABS_KEY = 'mc_local_tabs';

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

  /** true cuando el backend no está disponible — usa localStorage */
  private useLocal = false;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Load ───────────────────────────────────────────────────────────────────
  loadTabs(): Observable<Tab[]> {
    this._loading.set(true);
    return this.http.get<Tab[]>(this.baseUrl).pipe(
      tap(tabs => {
        this.useLocal = false;
        this._tabs.set(tabs);
        const savedId = this._activeId();
        const exists  = tabs.some(t => t.id === savedId);
        this.setActive(exists ? savedId! : (tabs[0]?.id ?? null));
        this._loading.set(false);
      }),
      catchError(() => {
        // Backend no disponible — carga desde localStorage
        this.useLocal = true;
        const local   = this.readLocalStorage();
        this._tabs.set(local);
        const savedId = this._activeId();
        const exists  = local.some(t => t.id === savedId);
        this.setActive(exists ? savedId! : (local[0]?.id ?? null));
        this._loading.set(false);
        return of(local);
      })
    );
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────
  createTab(name = 'untitled.ms', code = ''): Observable<Tab> {
    const position = this._tabs().length;

    if (this.useLocal) {
      return this.createLocalTab(name, code, position);
    }

    return this.http.post<Tab>(this.baseUrl, { name, code, position } as TabRequest).pipe(
      tap(tab => {
        this._tabs.update(tabs => [...tabs, tab]);
        this.setActive(tab.id);
      }),
      catchError(() => this.createLocalTab(name, code, position))
    );
  }

  deleteTab(id: number): Observable<void> {
    const removeFromList = () => {
      const remaining = this._tabs().filter(t => t.id !== id);
      this._tabs.set(remaining);
      if (this._activeId() === id) {
        this.setActive(remaining.at(-1)?.id ?? null);
      }
    };

    if (id < 0 || this.useLocal) {
      removeFromList();
      this.writeLocalStorage();
      return of(void 0);
    }

    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => removeFromList()),
      catchError(() => { removeFromList(); return of(void 0); })
    );
  }

  // ── Local update + debounced backend save ──────────────────────────────────
  updateCode(id: number, code: string): void {
    this._tabs.update(tabs => tabs.map(t => t.id === id ? { ...t, code } : t));
    id < 0 || this.useLocal ? this.writeLocalStorage() : this.debounceSave(id);
  }

  renameTab(id: number, name: string): void {
    this._tabs.update(tabs => tabs.map(t => t.id === id ? { ...t, name } : t));
    id < 0 || this.useLocal ? this.writeLocalStorage() : this.debounceSave(id);
  }

  setActive(id: number | null): void {
    this._activeId.set(id);
    localStorage.setItem(this.ACTIVE_KEY, JSON.stringify(id));
  }

  // ── Private ────────────────────────────────────────────────────────────────
  private createLocalTab(name: string, code: string, position: number): Observable<Tab> {
    const tab: Tab = { id: -(Date.now()), name, code, position };
    this._tabs.update(tabs => [...tabs, tab]);
    this.setActive(tab.id);
    this.writeLocalStorage();
    return of(tab);
  }

  private debounceSave(id: number): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      const tab = this._tabs().find(t => t.id === id);
      if (!tab) return;
      const req: TabRequest = { name: tab.name, code: tab.code, position: tab.position };
      this.http.put<Tab>(`${this.baseUrl}/${id}`, req).subscribe({
        error: () => {}
      });
    }, 1500);
  }

  private writeLocalStorage(): void {
    localStorage.setItem(this.LOCAL_TABS_KEY, JSON.stringify(this._tabs()));
  }

  private readLocalStorage(): Tab[] {
    try {
      return JSON.parse(localStorage.getItem(this.LOCAL_TABS_KEY) ?? '[]');
    } catch {
      return [];
    }
  }
}
