import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  // Método para obter o status do booking do usuário logado
  getStatusForCurrentUser() {
    const userEmail = 'user@example.com';
    return this.http.get(`${this.apiUrl}/bookings/status?email=${userEmail}`);
  }
}
