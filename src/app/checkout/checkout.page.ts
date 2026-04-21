import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  personOutline,
  callOutline,
  mailOutline,
  locationOutline,
  checkmarkCircle,
  bicycleOutline,
  star,
  timeOutline
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
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonInput,
  IonTextarea,
  IonRadioGroup,
  IonRadio,
  IonBadge,
  IonLabel
} from '@ionic/angular/standalone';
import { CartService } from '../services/cart.service';
import { OrderService } from '../services/order.service';
import { DeliveryService as DeliveryServiceClass } from '../services/delivery.service';
import { DeliveryService } from '../models/delivery-service.model';
import { CartItem } from '../models/cart-item.model';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
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
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonInput,
    IonTextarea,
    IonRadioGroup,
    IonRadio,
    IonBadge,
    IonLabel
  ]
})
export class CheckoutPage implements OnInit {
  // Customer details
  customerName: string = '';
  contactNumber: string = '';
  email: string = '';
  deliveryAddress: string = '';
  location: string = '';

  // Cart & delivery
  cartItems: CartItem[] = [];
  deliveryServices: DeliveryService[] = [];
  selectedDeliveryService: DeliveryService | null = null;
  subtotal: number = 0;
  deliveryFee: number = 0;
  total: number = 0;
  isSubmitting = false;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private deliveryServiceClass: DeliveryServiceClass,
    private router: Router
  ) {
    addIcons({ arrowBack, personOutline, callOutline, mailOutline, locationOutline, checkmarkCircle, bicycleOutline, star, timeOutline });
  }

  ngOnInit() {
    this.loadCartItems();
    this.loadDeliveryServices();
  }

  loadCartItems() {
    this.cartService.getCart().subscribe(items => {
      this.cartItems = items;
      this.calculateTotals();
    });
  }

  loadDeliveryServices() {
    this.deliveryServiceClass.getAllServices().subscribe(services => {
      this.deliveryServices = services;
    });
  }

  selectDeliveryService(service: DeliveryService) {
    this.selectedDeliveryService = service;
    this.calculateTotals();
  }

  calculateTotals() {
    this.subtotal = this.cartService.getCartTotal();
    this.deliveryFee = this.selectedDeliveryService?.pricing || 0;
    this.total = this.subtotal + this.deliveryFee;
  }

  onSubmit(form: NgForm) {
    if (form.valid && this.selectedDeliveryService && !this.isSubmitting) {
      this.isSubmitting = true;
      this.orderService.createOrder(
        this.customerName,
        this.contactNumber,
        this.deliveryAddress,
        this.location,
        this.cartItems,
        this.selectedDeliveryService,
        this.email
      ).subscribe({
        next: (order) => {
          if (order) {
            this.cartService.clearCart();
            this.router.navigate(['/order-success', order.id]);
          }
        },
        error: () => {
          this.isSubmitting = false;
        }
      });
    }
  }

  getStarArray(): number[] {
    return [1, 2, 3, 4, 5];
  }
}