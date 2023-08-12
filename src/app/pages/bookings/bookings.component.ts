import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BrandService } from '../bookings/brand.services';
import { DatePipe } from '@angular/common';


interface Booking {
  name: string;
  email: string;
  phone: string;
  address: string;
  vehicleType: string;
  vehicleModel: string
  brand: number;
  fuelType: string;
  bookingType: string;
  bookingDate: string;
  comments: string;
  booking_time: string;
  cost: number;
}

interface Brand {
  id: number;
  brandName: string;
}

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.css'],
})
export class BookingsComponent {
  booking: Booking = {
    name: '',
    email: '',
    phone: '',
    address: '',
    vehicleType: '',
    vehicleModel: '',
    brand: 0,
    fuelType: '',
    bookingType: '',
    bookingDate: '',
    comments: '',
    booking_time: '',
    cost: 0,
  };

  bookingTime: string = '';

  brandsList: any[] = [];
  selectedBrand: number = 0;
  availableTimes: string[] = [];


  constructor(
    private http: HttpClient,
    private brandService: BrandService,
    private datePipe: DatePipe) { }

  ngOnInit(): void {
    // Load the list of brands when the component starts
    this.loadBrands();

    // Load the list of available times when the component starts
    this.loadAvailableTimes();
  }

  loadBrands() {
    this.brandService.getBrands().subscribe(
      (data: any[]) => {
        this.brandsList = data.map(brand => {
          return { id: brand.brand_id, name: brand.brand_name };
        });
      },
      (error) => {
        console.error('Error loading brands:', error);
      }
    );
  }

  loadAvailableTimes() {
    this.http.get<any[]>('http://localhost:3000/api/available-times').subscribe(
      (times) => {
        this.availableTimes = times;
      },
      (error) => {
        console.error('Error getting available times:', error);
      }
    );
  }

  isAvailable(time: string): boolean {
    return this.availableTimes.includes(time);
  }

  async isTimeBooked(time: string): Promise<boolean> {
    try {
      const isBooked = await this.http.get<boolean>(`http://localhost:3000/api/bookings/is-booked/${time}`).toPromise();
      return isBooked !== undefined ? isBooked : false;
    } catch (error) {
      console.error('Error checking if time is booked:', error);
      return false;
    }
  }


  bookTime(time: string) {
  }

  async onSubmit() {

    // Format the time to HH:mm:ss format
    const formattedTime = this.bookingTime;

    // Map the form fields to the columns of the table in the database
    const bookingData = {
      name: this.booking.name,
      address: this.booking.address,
      email: this.booking.email,
      phone: this.booking.phone,
      vehicle: this.booking.vehicleModel,
      vehicle_type: this.booking.vehicleType,
      brand: this.selectedBrand,
      date: this.booking.bookingDate,
      fuel_type: this.booking.fuelType,
      comments: this.booking.comments,
      booking_time: formattedTime,
      booking_type: this.booking.bookingType,
      cost: this.booking.cost,

    };

    // Check if the number of bookings for the selected time slot has reached the maximum limit (4)
    const bookingCount = await this.countBookingsForTime(formattedTime);
    if (bookingCount >= 4) {
      alert(`The selected time slot (${formattedTime}) is fully booked.`);
      return;
    }

    // Calculate the cost based on the booking type
    bookingData.cost = this.calculateCost(this.booking.bookingType);

    // Send the form data to the backend using a POST request
    this.http.post<any>('http://localhost:3000/api/bookings', bookingData).subscribe(
      (data) => {
        console.log('Booking added:', data);
      },
      (error) => {
        console.error('Error adding booking:', error);
      }
    );
  }

  async countBookingsForTime(time: string): Promise<number> {
    try {
      // Make an HTTP call to fetch bookings from the backend
      const bookings = await this.http.get<Booking[]>('http://localhost:3000/api/bookings').toPromise();

      if (bookings) {
        // Filter bookings to find those that match the provided time
        const matchingBookings = bookings.filter(booking => booking.booking_time === time);

        // Return the count of bookings for the provided time
        return matchingBookings.length;
      } else {
        console.error('Booking information was not retrieved correctly.');
        return 0;
      }
    } catch (error) {
      console.error('Error fetching booking information:', error);
      return 0;
    }
  }

  calculateCost(bookingType: string): number {
    switch (bookingType) {
      case 'Annual Service':
        return 100.00;
      case 'Major Service':
        return 150.00;
      case 'Repair / Fault':
        return 200.00;
      case 'Major Repair':
        return 300.00;
      default:
        return 0.00;
    }
  }
}

