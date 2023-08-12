import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BookingDetail } from './dashboard.component';
import { InvoiceDetail } from './dashboard.component'

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  loadBookingDetails(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/bookings_details`);
  }

  // Method to fetch the status of the 'bookings' table based on the booking ID.
  getBookingStatus(bookingId: number): Observable<{ status_id: number | null }> {
    return this.http.get<{ status_id: number | null }>(`http://localhost:3000/api/bookings/${bookingId}/status`);
  }

  getMechanicForBooking(bookingId: number): Observable<{ mechanic: number | null }> {
    return this.http.get<{ mechanic: number | null }>(`http://localhost:3000/api/bookings/${bookingId}/mechanic`);
  }

  getVehicleForBooking(bookingId: number): Observable<{ vehicle: string }> {
    return this.http.get<{ vehicle: string }>(`http://localhost:3000/api/bookings/${bookingId}/vehicle`);
  }

  getStaffList(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/staffs`);
  }

  addInvoice(newInvoice: InvoiceDetail): Observable<any> {
    const url = `${this.apiUrl}/invoices/add`;
    return this.http.post(url, newInvoice);
  }

  getInvoiceDetailsByBookingId(bookingId: number): Observable<InvoiceDetail[]> {
    const url = `${this.apiUrl}/invoices/byBookingId/${bookingId}`;
    return this.http.get<InvoiceDetail[]>(url);
  }
}
