import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { 
  heart, 
  heartOutline, 
  star, 
  starHalf, 
  starOutline,
  storefront,
  searchOutline,
  notificationsOutline,
  cartOutline
} from 'ionicons/icons';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonGrid, 
  IonRow, 
  IonCol, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonButton, 
  IonIcon 
} from '@ionic/angular/standalone';

@Component({
  selector: 'home-page',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon
  ]
})
export class HomePage {
  
  constructor() {
    // Register all icons
    addIcons({ 
      heart, 
      heartOutline, 
      star, 
      starHalf, 
      starOutline,
      storefront,
      searchOutline,
      notificationsOutline,
      cartOutline
    });
  }
  
  items = [
    {
      name: 'Wireless Headphones',
      price: '2,499',
      img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      tag: 'NEW',
      category: 'Gadgets',
      rating: 4.5,
      description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
      isFavorite: false
    },
    {
      name: 'Laptop Stand',
      price: '1,299',
      img: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
      tag: 'SALE',
      category: 'Home',
      rating: 4,
      description: 'Ergonomic aluminum laptop stand with adjustable height for better posture.',
      isFavorite: true
    },
    {
      name: 'Backpack Pro',
      price: '1,899',
      img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
      tag: 'HOT',
      category: 'School',
      rating: 5,
      description: 'Durable waterproof backpack with laptop compartment and USB charging port.',
      isFavorite: false
    },
    {
      name: 'Smart Watch',
      price: '3,999',
      img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
      tag: 'NEW',
      category: 'Gadgets',
      rating: 4.5,
      description: 'Feature-packed smartwatch with fitness tracking and heart rate monitor.',
      isFavorite: false
    },
    {
      name: 'Denim Jacket',
      price: '2,199',
      img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
      tag: 'SALE',
      category: 'Fashion',
      rating: 4,
      description: 'Classic denim jacket with modern fit, perfect for any casual outfit.',
      isFavorite: false
    },
    {
      name: 'Coffee Maker',
      price: '4,599',
      img: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400',
      tag: 'HOT',
      category: 'Home',
      rating: 4.5,
      description: 'Programmable coffee maker with built-in grinder and thermal carafe.',
      isFavorite: true
    },
    {
      name: 'Study Desk Lamp',
      price: '899',
      img: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
      tag: 'NEW',
      category: 'School',
      rating: 3.5,
      description: 'LED desk lamp with adjustable brightness and color temperature settings.',
      isFavorite: false
    },
    {
      name: 'Running Shoes',
      price: '3,299',
      img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
      tag: 'SALE',
      category: 'Fashion',
      rating: 5,
      description: 'Lightweight running shoes with cushioned sole and breathable mesh upper.',
      isFavorite: false
    }
  ];

  toggleFavorite(item: any) {
    item.isFavorite = !item.isFavorite;
  }
}