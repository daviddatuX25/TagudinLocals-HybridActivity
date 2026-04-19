import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  arrowBack,
  locationOutline,
  timeOutline,
  star,
  checkmarkCircle
} from 'ionicons/icons';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButton, 
  IonIcon,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonSearchbar,
  IonRadioGroup,
  IonRadio
} from '@ionic/angular/standalone';
import { DeliveryService as DeliveryServiceClass } from '../services/delivery.service';
import { DeliveryService } from '../models/delivery-service.model';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-delivery',
  templateUrl: './delivery.page.html',
  styleUrls: ['./delivery.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardContent,
    IonSearchbar,
    IonRadioGroup,
    IonRadio
  ]
})
export class DeliveryPage implements OnInit {
  deliveryServices: DeliveryService[] = [];
  filteredServices: DeliveryService[] = [];
  selectedService: DeliveryService | null = null;
  locationQuery: string = '';
  cartTotal: number = 0;

  constructor(
    private deliveryServiceClass: DeliveryServiceClass,
    private cartService: CartService,
    private router: Router
  ) {
    addIcons({ arrowBack, locationOutline, timeOutline, star, checkmarkCircle });
  }

  ngOnInit() {
    this.loadDeliveryServices();
    this.cartTotal = this.cartService.getCartTotal();
  }

  loadDeliveryServices() {
    this.deliveryServiceClass.getAllServices().subscribe(services => {
      this.deliveryServices = services;
      this.filteredServices = services;
    });
  }

  onLocationSearch(event: any) {
    this.locationQuery = event.detail.value || '';
    if (this.locationQuery.trim()) {
      this.filteredServices = this.deliveryServiceClass.searchServicesByLocation(this.locationQuery);
    } else {
      this.filteredServices = this.deliveryServices;
    }
  }

  selectService(service: DeliveryService) {
    this.selectedService = service;
  }

  proceedToCheckout() {
    if (this.selectedService) {
      // Store selected service in session storage
      sessionStorage.setItem('selectedDeliveryService', JSON.stringify(this.selectedService));
      this.router.navigate(['/checkout']);
    }
  }

  getTotalWithDelivery(): number {
    if (this.selectedService) {
      return this.cartTotal + this.selectedService.pricing;
    }
    return this.cartTotal;
  }

  getStarArray(): number[] {
    return [1, 2, 3, 4, 5];
  }
}
