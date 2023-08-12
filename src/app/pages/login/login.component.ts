// login.component.ts
import { Component } from '@angular/core';
import { LoginService } from './login.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  errorMessage = '';

  constructor(
    private router: Router,
    public loginService: LoginService) { }

  // Check here if the email and password are being passed correctly
  login(email: string, password: string) {

    // Call the loginUser function in the LoginService
    this.loginService.loginUser(email, password).subscribe(
      (response) => {

        //Login success! 
        this.loginService.isLoggedIn = true; // set variable isLoggedIn true
        this.router.navigate(['/home']);
      },
      (error) => {
        this.errorMessage = "E-mail or password doesn't exist!";
      }
    );
  }

  logout() {
    this.loginService.logoutUser();
    this.router.navigate(['/home']);
  }
}
