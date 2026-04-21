import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  trash,
  add,
  remove,
  cartOutline
} from 'ionicons/icons';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonThumbnail,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent
} from '@ionic/angular/standalone';
import { CartService } from '../services/cart.service';
import { CartItem } from '../models/cart-item.model';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonThumbnail,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardContent
  ]
})
export class CartPage implements OnInit {
  cartItems: CartItem[] = [];
  subtotal: number = 0;

  constructor(
    private cartService: CartService,
    private router: Router
  ) {
    addIcons({ arrowBack, trash, add, remove, cartOutline });
  }

  ngOnInit() {
    this.loadCart();
  }

  loadCart() {
    this.cartService.getCart().subscribe(items => {
      this.cartItems = items;
      this.calculateSubtotal();
    });
  }

  calculateSubtotal() {
    this.subtotal = this.cartService.getCartTotal();
  }

  increaseQuantity(productId: string) {
    const item = this.cartItems.find(i => i.product.id === productId);
    if (item) {
      this.cartService.updateQuantity(productId, item.quantity + 1);
    }
  }

  decreaseQuantity(productId: string) {
    const item = this.cartItems.find(i => i.product.id === productId);
    if (item && item.quantity > 1) {
      this.cartService.updateQuantity(productId, item.quantity - 1);
    }
  }

  removeItem(productId: string) {
    this.cartService.removeFromCart(productId);
  }

  continueShopping() {
    this.router.navigate(['/home']);
  }

  proceedToDelivery() {
    if (this.cartItems.length > 0) {
      this.router.navigate(['/delivery']);
    }
  }

  getItemTotal(item: CartItem): number {
    return item.product.price * item.quantity;
  }
}
