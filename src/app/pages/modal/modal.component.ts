// modal.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent {
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() showModal: boolean = false;

  closeModal() {
    this.showModal = false;
  }
}
