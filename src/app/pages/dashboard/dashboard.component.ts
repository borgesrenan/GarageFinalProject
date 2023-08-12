import { Component, OnInit } from '@angular/core';
import { DashboardService } from './dashboard.service';
import { LoginService } from '../login/login.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';



export interface BookingDetail {
  idbookings: number;
  idproducts: number;
  quantity: number;
  cost: number;
  price: number;
  status_id: number | null;
  statusLabel?: string;
  statusColorClass?: string;
  mechanic: string | number | null;
  vehicle: string;
  name: string;

}

export interface InvoiceDetail {
  idproducts: number;
  vehicle: string;
  idbookings: number;
  // name: string;
  quantity: number;
  //service: string;
  date: string;
  amount: number;
}

@Pipe({
  name: 'getMechanicName'
})
export class GetMechanicNamePipe implements PipeTransform {
  transform(mechanicId: number | null, staffList: any[]): string {

    if (mechanicId === null) {
      return 'No Mechanic Assigned';
    }
    const mechanic = staffList.find(staff => staff.idstaffs === mechanicId);
    return mechanic ? mechanic.name : 'Unknown Mechanic';
  }
}


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  errorMessage = '';
  successMessage = '';

  viewErrorMessage = '';

  bookingsDetails: BookingDetail[] = [];

  invoiceDetails: InvoiceDetail[] = [];

  bookingsSummary: BookingDetail[] = [];

  staffList: any[] = [];

  invoiceBookingId: number | undefined;

  invoiceCreated: boolean = false;

  searchBookingId: number | undefined;
  searchInvoiceDetails: InvoiceDetail[] = [];


  constructor(
    private router: Router,
    private dashboardService: DashboardService,
    private loginService: LoginService,
    private http: HttpClient,
    sanitizer: DomSanitizer) { }

  ngOnInit(): void {

    // Check if the user is logged in before displaying the page
    if (!this.loginService.isLoggedIn) {
      this.router.navigate(['/login']);
    } else {

      this.loadBookingDetails();

      this.getStaffList();

      //     // Make sure this.invoiceBookingId is defined before using it
      //     if (this.invoiceBookingId !== undefined) {
      //       console.log('Invoice Booking ID is defined:', this.invoiceBookingId);

      //       // call the method to fetch invoice details related to the booking ID using the service
      //       this.dashboardService.getInvoiceDetailsByBookingId(this.invoiceBookingId).subscribe(
      //         (invoiceDetails: InvoiceDetail[]) => {
      //           console.log('Invoice details fetched successfully:', invoiceDetails);
      //           this.invoiceDetails = invoiceDetails; // Populate the array with invoice details
      //           this.viewAllInvoices(); // Call the method to display the invoices
      //         },
      //         (error: any) => {
      //           console.error('Error getting invoice details:', error);
      //         }
      //       );
      //     } else {
      //       console.error('Invoice Booking ID is not provided.');
      //     }
    }
  }

  loadBookingDetails() {
    this.dashboardService.loadBookingDetails().subscribe(
      (data) => {
        const requests = data.map((detail: BookingDetail) => {
          const mechanicRequest = this.dashboardService.getMechanicForBooking(detail.idbookings).toPromise();
          const vehicleRequest = this.dashboardService.getVehicleForBooking(detail.idbookings).toPromise();
          const statusRequest = this.dashboardService.getBookingStatus(detail.idbookings).toPromise();

          return Promise.all([mechanicRequest, vehicleRequest, statusRequest])
            .then(([mechanicResponse, vehicleResponse, statusResponse]) => {
              const mechanic = mechanicResponse?.mechanic;
              const vehicle = vehicleResponse?.vehicle;
              const statusId = statusResponse?.status_id ?? null;

              // Treat status_id as null when it's not available
              const updatedDetail: BookingDetail = {
                ...detail,
                mechanic: mechanic !== undefined ? mechanic : 'Mechanic data not available',
                vehicle: vehicle || 'Vehicle data not available',
                status_id: statusId,
              };

              return updatedDetail;
            })
            .catch(error => {
              console.error('Error fetching mechanic, vehicle, or status:', error);
              const errorDetail: BookingDetail = {
                ...detail,
                mechanic: 'Error fetching mechanic data',
                vehicle: 'Error fetching vehicle data',
                status_id: null,
              };
              return errorDetail;
            });
        });

        Promise.all(requests)
          .then(updatedDetails => {
            this.bookingsDetails = updatedDetails;
            this.bookingsSummary = this.groupAndSumPrices(this.bookingsDetails);
            this.updateStatusColors();
          })
          .catch(error => {
            console.error('Error fetching mechanic, vehicle, or status:', error);
          });
      },
      (error) => {
        console.error('Error loading booking details:', error);
      }
    );
  }


  // Function to group and sum prices by booking ID
  groupAndSumPrices(details: any[]): any[] {
    const groupedDetails: any[] = [];

    details.forEach(detail => {
      const existingGroup = groupedDetails.find(group => group.idbookings === detail.idbookings);

      if (existingGroup) {
        // If the group already exists, add the price to the existing value
        existingGroup.cost += detail.cost;
      } else {
        // If the group doesn't exist, create a new group
        groupedDetails.push({
          idbookings: detail.idbookings,
          cost: detail.cost,
          status_id: detail.status_id
        });
      }
    });

    return groupedDetails;
  }

  updateStatusColors() {
    this.bookingsSummary.forEach(summary => {
      const statusId = summary.status_id ?? null;
      const statusLabelAndColor = this.getStatusLabelAndColor(statusId);
      summary.statusLabel = statusLabelAndColor.label;
      summary.statusColorClass = statusLabelAndColor.colorClass;
    });
  }

  getStatusLabelAndColor(statusId: number | null): { label: string; colorClass: string } {
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
      case null:
        label = 'No Status';
        colorClass = 'gray-label';
        break;
      default:
        label = 'Unknown';
        colorClass = '';
        break;
    }

    return { label, colorClass };
  }

  getStaffList() {
    this.dashboardService.getStaffList().subscribe(
      (response) => {
        // Store the list of staff returned by the service in the "staffList" variable
        this.staffList = response;
      },
      (error) => {
        console.error('Error fetching staff list:', error);
      }
    );
  }

  getMechanicName(mechanicId: number): string {
    const mechanic = this.staffList.find(staff => staff.idstaffs === mechanicId);
    return mechanic ? mechanic.name : 'No Mechanic Assigned';
  }

  getMechanicIdForBooking(idbookings: number): number | null {
    const detail = this.getBookingDetail(idbookings);
    return detail?.mechanic as number | null;
  }

  getStatusLabel(statusId: number): { label: string; color: string } {
    switch (statusId) {
      case 1:
        return { label: 'BOOKED', color: 'blue' };
      case 2:
        return { label: 'IN SERVICE', color: 'yellow' };
      case 3:
        return { label: 'FIXED', color: 'green' };
      case 4:
        return { label: 'COLLECTED', color: 'purple' };
      case 5:
        return { label: 'UNREPAIRABLE', color: 'red' };
      default:
        return { label: 'UNKNOWN', color: 'gray' };
    }
  }

  getBookingDetail(idbookings: number): BookingDetail | undefined {
    return this.bookingsDetails.find(detail => detail.idbookings === idbookings);
  }

  generateInvoice(bookingDetail: BookingDetail) {
    // Check if the booking status is valid for creating an invoice
    if (bookingDetail.status_id === 3 || bookingDetail.status_id === 4 || bookingDetail.status_id === 5) {
      const formattedDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

      const newInvoiceData = {
        idproducts: bookingDetail.idproducts,
        vehicle: bookingDetail.vehicle,
        idbookings: bookingDetail.idbookings,
        quantity: bookingDetail.quantity,
        date: formattedDate,
        amount: bookingDetail.cost
      };

      console.log('Adding invoice data:', newInvoiceData);

      this.dashboardService.addInvoice(newInvoiceData).subscribe(
        (response) => {
          console.log('Invoice added to backend:', response);
          this.loadBookingDetails();
        },
        (error) => {
          console.error('Error adding invoice to backend:', error);
        }
      );
    } else {
      console.log('Cannot create invoice for this status.');
    }
  }

  printInvoice() {
    if (!this.invoiceBookingId) {
      this.errorMessage = "Booking ID is not provided";
      return;
    }

    const bookingDetail = this.bookingsDetails.find(detail => detail.idbookings === this.invoiceBookingId);

    if (!bookingDetail) {
      this.errorMessage = "Booking ID not found!";
      return;
    }

    // checking booking status
    if (bookingDetail.status_id === 3 || bookingDetail.status_id === 4 || bookingDetail.status_id === 5) {
      // only creates if status is 3, 4 or 5
      const formattedDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format date

      const newInvoiceData = {
        idproducts: bookingDetail.idproducts,
        vehicle: bookingDetail.vehicle,
        idbookings: bookingDetail.idbookings,
        quantity: bookingDetail.quantity,
        date: formattedDate,
        amount: bookingDetail.cost
      };

      this.dashboardService.addInvoice(newInvoiceData).subscribe(
        (response) => {

          this.errorMessage = '';
          this.successMessage = 'Invoice created!';

          // Upate status invoice after adding it 
          this.loadBookingDetails();
        },
        (error) => {
          console.error('Error adding invoice to backend:', error);
        }
      );
    } else {
      this.errorMessage = "Cannot create invoice for this status";
      this.invoiceBookingId = undefined;
    }
  }

  viewInvoicesByBookingId() {
    if (this.searchBookingId === undefined) {
      console.error('Booking ID not found!');
      this.viewErrorMessage = "Booking ID not found!";
      return;
    }

    // Call the method to fetch invoice details related to the search booking ID using the service
    this.dashboardService.getInvoiceDetailsByBookingId(this.searchBookingId).subscribe(
      (invoiceDetails: InvoiceDetail[]) => {
        console.log('Search Invoice Details:', invoiceDetails);

        // Group invoice details by idbookings
        const groupedInvoices: { [idbookings: number]: InvoiceDetail[] } = {};
        invoiceDetails.forEach(detail => {
          if (!groupedInvoices[detail.idbookings]) {
            groupedInvoices[detail.idbookings] = [];
          }
          groupedInvoices[detail.idbookings].push(detail);
        });

        // Create an HTML table with the grouped search results
        const invoiceTable = this.createInvoiceTable(groupedInvoices);

        // Create a blob with the HTML content
        const blob = new Blob([invoiceTable], { type: 'text/html' });

        // Create a blob URL
        const blobUrl = URL.createObjectURL(blob);

        // Open a new window with the blob URL
        window.open(blobUrl, '_blank');
      },
      (error: any) => {
        console.error('Error getting search invoice details:', error);
      }
    );
  }

  createInvoiceTable(groupedInvoices: { [idbookings: number]: InvoiceDetail[] }): string {
    let tableContent = `
      <html>
      <head>
        <title>Invoices</title>
        <style>
          /* Define print styles here */
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <h2>Invoices</h2>
    `;

    // Loop through groupedInvoices and generate rows
    Object.keys(groupedInvoices).forEach(idbookings => {
      const idbookingsNumber = parseInt(idbookings, 10);
      const invoicesForBooking = groupedInvoices[idbookingsNumber];


      // Get the vehicle name from the first invoice detail
      const vehicleName = invoicesForBooking[0]?.vehicle || 'N/A';

      tableContent += `
      <h3>Booking ID: ${idbookingsNumber} - Vehicle: ${vehicleName}</h3>
        <table>
          <tr>
            <th>Products</th>
            <th>Quantity</th>
            <th>Amount</th>
          </tr>
      `;

      invoicesForBooking.forEach((detail: InvoiceDetail) => {
        tableContent += `
          <tr>
            <td>${detail.idproducts}</td>
            <td>${detail.quantity}</td>
            <td>${detail.amount}</td>
          </tr>
        `;
      });

      tableContent += `</table>`;
    });

    tableContent += `
      </body>
      </html>
    `;

    return tableContent;
  }

  // viewAllInvoices() {

  //   if (this.invoiceBookingId === undefined) {
  //     console.error('Invoice Booking ID is not provided.');
  //     return;
  //   }

  //   console.log('Invoice Booking ID:', this.invoiceBookingId);

  //   // Group the filtered invoices by idbookings
  //   const groupedInvoices: { [idbookings: number]: InvoiceDetail[] } = {};
  //   if (this.invoiceDetails.length > 0) {
  //     this.invoiceDetails.forEach(detail => {
  //       if (detail.idbookings === this.invoiceBookingId) {
  //         const idbookingsNumber = detail.idbookings as number;
  //         if (!groupedInvoices[idbookingsNumber]) {
  //           groupedInvoices[idbookingsNumber] = [];
  //         }
  //         groupedInvoices[idbookingsNumber].push(detail);
  //       }
  //     });

  //     console.log('Grouped Invoices:', groupedInvoices);
  //   } else {
  //     console.error('No invoice details available.');
  //   }

  //   const popupWin = window.open('', '_blank', 'width=800,height=600');
  //   if (popupWin) {
  //     popupWin.document.open();
  //     popupWin.document.write(`
  //           <html>
  //           <head>
  //               <title>All Invoices</title>
  //               <style>
  //               /* Define print styles here */
  //               table {
  //                   width: 100%;
  //                   border-collapse: collapse;
  //               }
  //               th, td {
  //                   border: 1px solid #000;
  //                   padding: 8px;
  //                   text-align: left;
  //               }
  //               </style>
  //           </head>
  //           <body>
  //               <h2>All Invoices</h2>
  //               <table>
  //               <tr>
  //                   <th>Date</th>
  //                   <th>Booking ID</th>
  //                   <th>Vehicle</th>
  //                   <th>Products</th>
  //                   <th>Quantity</th>
  //                   <th>Amount</th>
  //               </tr>
  //       `);

  //     // Loop through groupedInvoices and generate rows
  //     Object.keys(groupedInvoices).forEach(idbookings => {
  //       const idbookingsNumber = parseInt(idbookings, 10);
  //       groupedInvoices[idbookingsNumber].forEach((detail: InvoiceDetail) => {

  //         popupWin.document.write(`
  //               <tr>
  //                   <td>${detail.date}</td>
  //                   <td>${detail.idbookings}</td>
  //                   <td>${detail.vehicle}</td>
  //                   <td>${detail.idproducts}</td>
  //                   <td>${detail.quantity}</td>
  //                   <td>${detail.amount}</td>
  //               </tr>
  //               `);
  //       });
  //       console.log('Details for ID Bookings:', groupedInvoices[idbookingsNumber]);
  //     });

  //     popupWin.document.write(`
  //               </table>
  //           </body>
  //           </html>
  //       `);
  //     popupWin.document.close();
  //     popupWin.print();
  //   } else {
  //     console.error('Error: Unable to open the print window. Please check your pop-up blocker settings.');
  //   }
  // }

  logout() {
    this.loginService.logoutUser();

    this.router.navigate(['/login']);
  }
}