import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CompileRequest, CompileResponse } from '../models/compiler.models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CompilerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/compiler`;

  compile(request: CompileRequest): Observable<CompileResponse> {
    return this.http
      .post<CompileResponse>(`${this.baseUrl}/compile`, request)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    return throwError(() => error.error ?? { message: 'Unknown error', status: error.status });
  }
}
