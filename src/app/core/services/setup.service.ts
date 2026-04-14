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
  
  // Cache for setup status
  private setupComplete: boolean | null = null;

  checkStatus(): Observable<boolean> {
    if (this.setupComplete !== null) {
      return of(this.setupComplete);
    }

    return this.http.get<SetupStatusResponse>(`${this.apiUrl}/status`).pipe(
      tap(res => this.setupComplete = res.setupComplete),
      map(res => res.setupComplete),
      catchError(() => {
        return of(false);
      })
    );
  }

  runWizard(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/wizard`, payload, { responseType: 'text' }).pipe(
      tap(() => {
        this.setupComplete = true; // Essential to allow guard passage
      })
    );
  }

  resetCache(): void {
    this.setupComplete = null;
  }
}
