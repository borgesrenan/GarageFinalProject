import { Component, OnInit } from '@angular/core';
import { AdminService } from './admin.service';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { DatePipe } from '@angular/common';


@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  providers: [DatePipe]
})
export class AdminComponent implements OnInit {

  errorMessage = '';
  successMessage = '';

  bookings: any[] = [];
  statusList: any[] = [];
  staffList: any[] = [];
  brandList: any[] = [];

  updateStatusBookingId!: number;
  updateStatusId!: number;

  assignMechanicBookingId: string = '';
  assignMechanicId: number = 0;

  assignMechanicErrorMessage: string = '';
  assignMechanicSuccessMessage: string = '';

  productList: any[] = []; // List of products

  selectedProduct: number | undefined;

  selectedBookingId: number | undefined;

  selectedProductQuantity: number = 1; // Initialize quantity to 1

  addProductErrorMessage = '';
  addProductSuccessMessage = '';

  constructor(
    private adminService: AdminService,
    private location: Location,
    private http: HttpClient) { }


  ngOnInit() {
    // call function to retrieve bookings from the "booking" table
    this.getBookings();

    // call function to retrieve status from the "status" table
    this.getStatusList();

    // call function to retrieve staffs from staffs table
    this.getStaffList();

    this.getProductList();

    this.getBrandList();

  }

  // Function to retrieve bookings from the "booking" table
  getBookings() {
    this.adminService.getBookings().subscribe(
      (response) => {
        this.bookings = response.map(booking => {
          return {
            ...booking,
            bookingId: booking.id // Defining the bookingId property with the value of the "id"
          };
        });
      },
      (error) => {
        console.error('Error fetching bookings:', error);
      }
    );
  }

  getStatusList() {
    this.adminService.getStatusList().subscribe(
      (response) => {
        // Store the list of status returned by the service in the "statusList" variable
        this.statusList = response;
      },
      (error) => {
        console.error('Error fetching status list:', error);
      }
    );
  }

  getBrandList() {
    this.adminService.getBrandList().subscribe(
      (response) => {
        this.brandList = response;
      },
      (error) => {
        console.error('Error fetching status list:', error);
      }
    );
  }

  // Function to update the status of a booking
  updateStatus(detail: any) {

    const bookingId = detail.bookingId;
    const statusId = detail.status_id;

    this.adminService.updateBookingStatus(bookingId, statusId).subscribe(
      () => {
        console.log('Status updated successfully!');
      },
      (error) => {
        console.error('Error updating status:', error);
      }
    );
  }

  // Function to retrieve the list of staff members
  getStaffList() {
    this.adminService.getStaffList().subscribe(
      (response) => {
        // Store the list of staff members returned by the service in the "staffList" variable
        this.staffList = response;
      },
      (error) => {
        console.error('Error fetching staff list:', error);
      }
    );
  }

  // Function to delete a booking
  deleteBooking(bookingId: number) {
    if (confirm('Are you sure you want to delete?')) {
      // Check if an invoice is associated with this booking
      this.adminService.checkIfInvoiceExists(bookingId).subscribe(
        (response) => {
          if (response.exists) {
            // Records are associated in the "invoices" table, so delete them first           
            this.adminService.deleteInvoiceDetails(bookingId).subscribe(
              () => {
                console.log('Invoice associated with booking deleted successfully!');
                // After deleting the associated invoice, proceed with checks in the "booking_details" table
                this.checkAndDeleteBookingDetails(bookingId);
              },
              (error) => {
                console.error('Error deleting invoice associated with booking:', error);
              }
            );
          } else {
            // No records associated in the "invoices" table, continue checks in the "booking_details" table
            this.checkAndDeleteBookingDetails(bookingId);
          }
        },
        (error) => {
          console.error('Error checking existence of invoice associated with booking:', error);
        }
      );
    }
  }

  // Function to check and delete booking details
  private checkAndDeleteBookingDetails(bookingId: number) {
    // Check if records are associated in the "booking_details" table
    this.adminService.checkIfBookingExists(bookingId).subscribe(
      (response) => {
        if (response.exists) {
          // Records are associated in the "booking_details" table, so delete them first
          this.adminService.deleteBookingDetails(bookingId).subscribe(
            () => {
              console.log('Records in booking_details deleted successfully!');
              // After deleting the records in "booking_details", delete the record in the "bookings" table
              this.deleteBookingFromBookings(bookingId);
            },
            (error) => {
              console.error('Error deleting records in booking_details:', error);
            }
          );
        } else {
          // No records associated in the "booking_details" table, delete directly from the "bookings" table
          this.deleteBookingFromBookings(bookingId);
        }
      },
      (error) => {
        console.error('Error checking existence of records in booking_details:', error);
      }
    );
  }

  // Function to delete a booking from the "bookings" table
  private deleteBookingFromBookings(bookingId: number) {
    // Delete the record from the "bookings" table
    this.adminService.deleteBooking(bookingId).subscribe(
      () => {
        console.log('Booking deleted successfully!');
      },
      (error) => {
        console.error('Error deleting booking:', error);
      }
    );
  }

  // Function to update the booking status
  updateBookingStatus() {
    // Check if the booking ID and new status are provided
    if (!this.updateStatusBookingId || !this.updateStatusId) {
      this.errorMessage = 'All fields are mandatory'
      return;
    }

    // Create the update object with form values
    const updateData = {
      bookingId: this.updateStatusBookingId,
      newStatusId: this.updateStatusId
    };

    // Make an HTTP call to update the booking status
    this.adminService.updateBookingStatus(this.updateStatusBookingId, this.updateStatusId).subscribe(
      (response) => {
        console.log('Booking status updated successfully:', response);
        this.successMessage = 'Status updated successfully!';
        this.getBookings();

        // Now, add "idbookings" and "status" fields to the "booking_details" table
        const details = {
          idbookings: this.updateStatusBookingId,
          status: this.updateStatusId
        };

        this.adminService.addBookingDetail(this.updateStatusBookingId, this.updateStatusId).subscribe(
          (addResponse) => {
            console.log('Booking details added successfully:', addResponse);
          },
          (addError) => {
            console.error('Error adding booking details to "booking_details" table:', addError);
          }
        );
      },
      (error) => {
        console.error('Error updating booking status:', error);
        this.errorMessage = 'Booking ID not found!';
        this.getBookings();
      }
    );
  }

  // Function to change the label's color everytime its changed status
  getStatusLabelAndColor(statusId: number): { label: string; colorClass: string } {
    let label = '';
    let colorClass = '';

    switch (statusId) {
      case 1:
        label = 'BOOKED';
        colorClass = 'blue-label';
        break;
      case 2:
        label = 'IN SERVICE';
        colorClass = 'yellow-label';
        break;
      case 3:
        label = 'FIXED';
        colorClass = 'green-label';
        break;
      case 4:
        label = 'COLLECTED';
        colorClass = 'purple-label';
        break;
      case 5:
        label = 'UNREPAIRABLE';
        colorClass = 'red-label';
        break;
      default:
        label = 'Unknown';
        colorClass = '';
        break;
    }

    return { label, colorClass };
  }

  assignMechanic() {
    // Convert the string to a number
    const bookingIdNumber = parseInt(this.assignMechanicBookingId, 10);
    const mechanicIdNumber = parseInt(this.assignMechanicId.toString(), 10);

    if (!this.assignMechanicBookingId || isNaN(bookingIdNumber) || isNaN(mechanicIdNumber)) {
      console.log('Invalid input values.');
      this.assignMechanicErrorMessage = 'Please provide both Booking ID and select a valid Mechanic.';
      this.assignMechanicSuccessMessage = '';
      return;
    }
    // Send the request to assign the mechanic to the booking
    this.adminService.assignMechanicToBooking(bookingIdNumber, mechanicIdNumber)
      .subscribe(
        (response) => {
          if (response.message === 'Mechanic assigned successfully to the booking.') {
            this.assignMechanicErrorMessage = '';
            this.assignMechanicSuccessMessage = 'Mechanic assigned successfully.';
            // Update the bookings to reflect the changes
            this.getBookings();

            // Call the method to add mechanic to the "booking_details" table
            const bookingDetail = {
              idbookings: bookingIdNumber,
              mechanic: mechanicIdNumber
            };
            this.adminService.addMechanicToBookingDetails(bookingIdNumber, mechanicIdNumber).subscribe(
              () => {
              },
              (error) => {
                console.error('Error adding mechanic to booking_details:', error);
              }
            );
          } else {
            this.assignMechanicErrorMessage = 'Failed to assign mechanic.';
            this.assignMechanicSuccessMessage = '';
          }
        },
        (error) => {
          console.error('Error occurred while assigning mechanic:', error);
          this.assignMechanicErrorMessage = 'An error occurred while assigning mechanic.';
          this.assignMechanicSuccessMessage = '';
        }
      );
  }


  addMechanicToBookingDetails(bookingId: number, mechanicId: number) {
    // Create the object with mechanic values to be inserted into the "booking_details" table
    const bookingDetail = {
      idbookings: bookingId,
      mechanic: mechanicId // Put the correct field name that represents the mechanic in the "booking_details" table
    };

    // Call the service to insert the mechanic into the "booking_details" table
    this.adminService.addBookingDetail(bookingId, mechanicId).subscribe(
      (response) => {
        console.log('Mechanic added to booking_details successfully:', response);
        // Update the booking details to reflect the changes
      },
      (error) => {
        console.error('Error adding mechanic to booking_details:', error);
      }
    );
  }

  getMechanicName(mechanicId: number): string {
    const mechanic = this.staffList.find(staff => staff.idstaffs === mechanicId);
    return mechanic ? mechanic.name : 'No Mechanic Assigned';
  }

  getBrandName(brandID: number): string {
    const brand = this.brandList.find(brand => brand.brand_id === brandID);
    return brand ? brand.brand_name : 'No Brand find';
  }

  getProductList() {
    this.adminService.getProductList().subscribe(
      (response) => {
        this.productList = response;
      },
      (error) => {
        console.error('Error fetching product list:', error);
      }
    )
  };

  addSelectedProduct() {
    if (this.selectedBookingId === undefined || this.selectedProduct === undefined) {
      console.error('No booking selected or no product selected.');
      this.addProductErrorMessage = 'All fields are mandatory!'
      return;
    }

    // Retrieve the price value from the "products" table
    this.http.get<any>(`http://localhost:3000/api/products/${this.selectedProduct}`)
      .subscribe(
        (productData) => {
          const selectedProductPrice = productData.price;
          console.log('Selected Product Price:', selectedProductPrice);

          const newBookingDetail = {
            bookingId: this.selectedBookingId,
            productId: this.selectedProduct,
            quantity: this.selectedProductQuantity,
            cost: selectedProductPrice * this.selectedProductQuantity, // Calculate the cost based on the product price
            price: selectedProductPrice
          };

          this.adminService.addProductToBooking(newBookingDetail).subscribe(
            () => {
              console.log('Product added to booking successfully.');
              this.addProductSuccessMessage = 'Product added to booking successfully.'
              this.getBookings();
            },
            (error) => {
              this.addProductErrorMessage = "Booking ID doesn't exist";
            }
          );
        },
        (error) => {
          console.error('Error fetching product data:', error);
        }
      );
  }

  incrementQuantity() {
    this.selectedProductQuantity++;
  }

  decrementQuantity() {
    this.selectedProductQuantity--;
  }
}  