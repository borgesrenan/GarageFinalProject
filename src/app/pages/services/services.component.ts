// services.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent {
  showDetails = {
    annual: false,
    major: false,
    repair: false,
    majorRepair: false
  };

  constructor(private router: Router) {}

  toggleDetails(service: 'annual' | 'major' | 'repair' | 'majorRepair') {
    // Alterna a exibição dos detalhes do serviço quando o botão "What's Included" é clicado
    this.showDetails[service] = !this.showDetails[service];
  }

  navigateToBookings(service: 'annual' | 'major' | 'repair' | 'majorRepair') {
    // Aqui, você pode realizar qualquer lógica necessária antes de navegar para a página "bookings" com o serviço selecionado.
    // Por exemplo, você pode armazenar o tipo de serviço selecionado em uma variável de serviço ou compartilhá-lo através de um serviço.

    // Navegação para a página "bookings" com o serviço selecionado
    this.router.navigate(['/bookings'], { queryParams: { service } });
  }
}
