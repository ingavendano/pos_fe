import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';
export interface SetupStatusResponse {
  setupComplete: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class SetupService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/public/setup`;

  // local cache
  private isSetupCompleteCached: boolean | null = null;

  checkStatus(): Observable<boolean> {
    if (this.isSetupCompleteCached !== null) {
      return of(this.isSetupCompleteCached);
    }

    return this.http.get<SetupStatusResponse>(`${this.apiUrl}/status`).pipe(
      tap(res => this.isSetupCompleteCached = res.setupComplete),
      map(res => res.setupComplete),
      catchError(() => {
        // default to requires setup if error (maybe server is down, but safer to try setup)
        // or default to false to prevent accessing without setup
        return of(false);
      })
    );
  }

  runWizard(payload: any): Observable<any> {
    // using text response because backend returns String message
    return this.http.post(`${this.apiUrl}/wizard`, payload, { responseType: 'text' }).pipe(
      tap(() => this.isSetupCompleteCached = true)
    );
  }
}
