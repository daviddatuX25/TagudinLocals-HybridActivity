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

  private pin: string | null = null;

  constructor(private http: HttpClient) {}

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
      this.http.post<{ success: boolean }>(`${environment.apiUrl}/api/admin/verify-pin`, { pin }).subscribe({
        next: (res) => {
          if (res.success) {
            this.pin = pin;
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
      this.http.post<{ success: boolean }>(`${environment.apiUrl}/api/admin/setup-pin`, { pin }).subscribe({
        next: (res) => {
          if (res.success) {
            this.pin = pin;
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
    this.pin = null;
    this.verified.next(false);
  }

  getPinHeader(): { [header: string]: string } {
    if (this.pin) {
      return { 'x-admin-pin': this.pin };
    }
    return {};
  }
}