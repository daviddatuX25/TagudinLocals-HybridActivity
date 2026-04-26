import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private verified = new BehaviorSubject<boolean>(false);
  public isAdminVerified$ = this.verified.asObservable();

  // CR-03: Use session token instead of raw PIN
  private sessionToken: string | null = null;

  constructor(private http: HttpClient) {
    // Restore session from sessionStorage
    const saved = sessionStorage.getItem('adminSessionToken');
    if (saved) {
      this.sessionToken = saved;
      this.verified.next(true);
    }
  }

  isAdminVerified(): boolean {
    return this.verified.getValue();
  }

  hasPinSet(): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.http.get<{ hasPin: boolean }>(`${environment.apiUrl}/api/admin/has-pin`).subscribe({
        next: (res) => {
          observer.next(res.hasPin);
          observer.complete();
        },
        error: () => {
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  verifyPin(pin: string): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.http.post<{ success: boolean; token?: string }>(`${environment.apiUrl}/api/admin/verify-pin`, { pin }).subscribe({
        next: (res) => {
          if (res.success && res.token) {
            this.sessionToken = res.token;
            sessionStorage.setItem('adminSessionToken', res.token);
            this.verified.next(true);
          }
          observer.next(res.success);
          observer.complete();
        },
        error: () => {
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  setupPin(pin: string): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.http.post<{ success: boolean; token?: string }>(`${environment.apiUrl}/api/admin/setup-pin`, { pin }).subscribe({
        next: (res) => {
          if (res.success && res.token) {
            this.sessionToken = res.token;
            sessionStorage.setItem('adminSessionToken', res.token);
            this.verified.next(true);
          }
          observer.next(res.success);
          observer.complete();
        },
        error: () => {
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  logout(): void {
    this.sessionToken = null;
    sessionStorage.removeItem('adminSessionToken');
    this.verified.next(false);
  }

  // Returns session token header (preferred), falls back to empty
  getAuthHeaders(): { [header: string]: string } {
    if (this.sessionToken) {
      return { 'x-admin-token': this.sessionToken };
    }
    return {};
  }

  // Backwards-compatible alias
  getPinHeader(): { [header: string]: string } {
    return this.getAuthHeaders();
  }
}