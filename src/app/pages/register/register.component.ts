import { Component } from '@angular/core';
import { RegisterService } from './register.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  user = {
    name: '',
    email: '',
    phone: '',
    password: ''
  };
  errorMessage = '';

  // Variables to control the modal
  showModal = false;
  modalTitle = '';
  modalMessage = '';

  constructor(
    private router: Router,
    private registerService: RegisterService) { }

  registerUser() {
    this.registerService.registerUser(this.user)
      .subscribe(
        (response) => {
          console.log('User registered:', response);
          // Clear fields after registration
          this.user.name = '';
          this.user.email = '';
          this.user.phone = '';
          this.user.password = '';

          this.showModal = true;
          this.modalTitle = 'Registration Successful';
          this.modalMessage = 'User registered successfully.';

        },
        (error) => {
          console.error('Error registering user:', error);
          if (error.status === 409) {
            this.errorMessage = 'The email or phone number is already registered.';
          } else {
            this.errorMessage = 'Error registering the user.';
          }
        }
      );
  }

  closeModal() {
    this.showModal = false;
    this.router.navigate(['/login']);
  }
}