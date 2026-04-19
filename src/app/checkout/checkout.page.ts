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
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonInput,
  IonTextarea
} from '@ionic/angular/standalone';
import { CartService } from '../services/cart.service';
import { OrderService } from '../services/order.service';
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
    IonTextarea
  ]
})
export class CheckoutPage implements OnInit {
  customerName: string = '';
  contactNumber: string = '';
  email: string = '';
  deliveryAddress: string = '';
  location: string = '';
  
  cartItems: CartItem[] = [];
  deliveryService: DeliveryService | null = null;
  subtotal: number = 0;
  deliveryFee: number = 0;
  total: number = 0;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router
  ) {
    addIcons({ arrowBack, personOutline, callOutline, mailOutline, locationOutline, checkmarkCircle });
  }

  ngOnInit() {
    this.loadCartItems();
    this.loadDeliveryService();
    this.calculateTotals();
  }

  loadCartItems() {
    this.cartService.getCart().subscribe(items => {
      this.cartItems = items;
      this.calculateTotals();
    });
  }

  loadDeliveryService() {
    const savedService = sessionStorage.getItem('selectedDeliveryService');
    if (savedService) {
      this.deliveryService = JSON.parse(savedService);
      this.calculateTotals();
    } else {
      // Redirect back if no delivery service selected
      this.router.navigate(['/delivery']);
    }
  }

  calculateTotals() {
    this.subtotal = this.cartService.getCartTotal();
    this.deliveryFee = this.deliveryService?.pricing || 0;
    this.total = this.subtotal + this.deliveryFee;
  }

  onSubmit(form: NgForm) {
    if (form.valid && this.deliveryService) {
      // Create order
      const order = this.orderService.createOrder(
        this.customerName,
        this.contactNumber,
        this.deliveryAddress,
        this.location,
        this.cartItems,
        this.deliveryService,
        this.email
      );

      // Clear cart
      this.cartService.clearCart();
      
      // Clear session storage
      sessionStorage.removeItem('selectedDeliveryService');

      // Navigate to success page
      this.router.navigate(['/order-success', order.id]);
    }
  }
}
