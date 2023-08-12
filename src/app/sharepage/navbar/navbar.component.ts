import { Component } from '@angular/core';
import { LoginService } from '../../pages/login/login.service'; // Importe o LoginService aqui, ajustando o caminho para o local correto

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  constructor(public loginService: LoginService) { }
}
