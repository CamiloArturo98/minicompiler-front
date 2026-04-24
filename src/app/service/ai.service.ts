import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AiRequest, AiResponse } from '../models/compiler.models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/ai`;

  chat(request: AiRequest): Observable<AiResponse> {
    return this.http.post<AiResponse>(`${this.baseUrl}/chat`, request);
  }
}
