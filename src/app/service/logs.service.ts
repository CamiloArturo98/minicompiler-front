import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LogRecord, PageResponse } from '../models/logs.models';

@Injectable({ providedIn: 'root' })
export class LogService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/logs`;

  findAll(page = 0, size = 20): Observable<PageResponse<LogRecord>> {
    return this.http.get<PageResponse<LogRecord>>(this.baseUrl, {
      params: { page: page.toString(), size: size.toString() },
    });
  }

  findById(id: number): Observable<LogRecord> {
    return this.http.get<LogRecord>(`${this.baseUrl}/${id}`);
  }
}
