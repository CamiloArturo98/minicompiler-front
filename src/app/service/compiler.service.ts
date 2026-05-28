import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CompileRequest, CompileResponse } from '../models/compiler.models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CompilerService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/compiler`;

  compile(request: CompileRequest): Observable<CompileResponse> {
    const encoded: CompileRequest = {
      ...request,
      sourceCode: this.encodeSource(request.sourceCode),
    };

    return this.http
      .post<CompileResponse>(`${this.baseUrl}/compile`, encoded)
      .pipe(catchError(this.handleError));
  }

  /**
   * Encodes the source code to Base64 (UTF-8 safe).
   * encodeURIComponent handles non-ASCII chars before btoa.
   */
  private encodeSource(code: string): string {
    return btoa(
      encodeURIComponent(code).replace(
        /%([0-9A-F]{2})/g,
        (_, hex) => String.fromCharCode(parseInt(hex, 16)),
      ),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    return throwError(() => error.error ?? { message: 'Unknown error', status: error.status });
  }
}
