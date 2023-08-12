// login.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { tap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiUrl = 'http://localhost:3000/api/login';

  // Use LocalStorage to store login state
  isLoggedIn: boolean = localStorage.getItem('isLoggedIn') === 'true';

  constructor(private http: HttpClient) { }

  loginUser(email: string, password: string): Observable<any> {
    const body = { email, password };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post(`${this.apiUrl}/verify`, body, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(error);
      }),
      tap(() => {
        // Update LocalStorage and isLoggedIn variable after successful login
        localStorage.setItem('isLoggedIn', 'true');
        this.isLoggedIn = true;
      })
    );
  }

  logoutUser(): void {
    // Clear LocalStorage and set isLoggedIn variable to false
    localStorage.removeItem('isLoggedIn');
    this.isLoggedIn = false;
  }
}