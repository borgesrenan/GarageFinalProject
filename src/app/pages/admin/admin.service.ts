import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  getBookings() {
    return this.http.get<any[]>(`${this.apiUrl}/bookings`);
  }

  getStatusList(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/status`);
  }

  updateBookingStatus(bookingId: number, statusId: number): Observable<any> {
    const data = { bookingId, statusId };
    return this.http.post<any>(`${this.apiUrl}/bookings/update-status`, data);
  }

  // Add booking data to booking_details after updating the status
  addBookingDetail(bookingId: number, status: number): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/bookings_details/add`, { bookingId, status });
  }

  // Update the status field of the booking_details table
  updateBookingDetailStatus(bookingId: number, newStatusId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/bookings_details/update-status`, { bookingId, newStatusId });
  }

  getStaffList(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/staffs`);
  }

  getBrandList(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/marcas`);
  }

  deleteBooking(bookingId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/bookings/${bookingId}`);
  }

  deleteBookingDetails(bookingId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/booking_details/${bookingId}`);
  }

  deleteInvoiceDetails(bookingId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/invoice-details/${bookingId}`);
  }

  assignMechanicToBooking(bookingId: number, mechanicId: number): Observable<any> {
    const url = `${this.apiUrl}/bookings/update-mechanic`;
    const body = { bookingId, mechanicId };
    return this.http.post(url, body);
  }

  // Method to add a product to a booking
  addProductToBooking(bookingDetail: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/booking-details/add-product`, bookingDetail, { headers });
  }

  getProductList(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products`);
  }

  // Method to update the service cost in the booking_details table
  updateServiceCost(bookingId: number, newServiceCost: number): Observable<any> {
    const updateData = { bookingId: bookingId, newServiceCost: newServiceCost }; // Data to send in the request
    return this.http.post<any>(`${this.apiUrl}/booking-details/update-service-cost`, updateData);
  }

  // Function to fetch the current service cost
  getServiceCost(bookingId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/booking-details/service-cost/${bookingId}`);
  }

  checkIfBookingExists(bookingId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/booking-details/exists/${bookingId}`);
  }

  checkIfInvoiceExists(bookingId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoice-details/exists/${bookingId}`);
  }

  // Method to add mechanic to the booking_details table
  addMechanicToBookingDetails(bookingId: number, mechanicId: number): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = {
      idbookings: bookingId,
      mechanic: mechanicId
    };
    return this.http.post(`${this.apiUrl}/booking-details/add-mechanic`, body, { headers });
  }
}
