import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  heart, 
  heartOutline, 
  star, 
  starHalf, 
  starOutline,
  storefront,
  searchOutline,
  cartOutline,
  addCircle,
  chevronDown,
  logOutOutline,
  settingsOutline
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
  IonIcon,
  IonSearchbar,
  IonBadge,
  IonChip,
  IonLabel
} from '@ionic/angular/standalone';
import { ProductService } from '../services/product.service';
import { CartService } from '../services/cart.service';
import { Product } from '../models/product.model';

@Component({
  selector: 'home-page',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
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
    IonIcon,
    IonSearchbar,
    IonBadge,
    IonChip,
    IonLabel
  ]
})
export class HomePage implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = [];
  selectedCategory: string = 'All';
  searchQuery: string = '';
  cartCount: number = 0;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private router: Router
  ) {
    // Register all icons
    addIcons({ 
      heart, 
      heartOutline, 
      star, 
      starHalf, 
      starOutline,
      storefront,
      searchOutline,
      cartOutline,
      addCircle,
      chevronDown,
      logOutOutline,
      settingsOutline
    });
  }

  ngOnInit() {
    this.loadProducts();
    this.categories = this.productService.getCategories();
    
    // Initialize cart count
    this.cartCount = this.cartService.getCartCount();
    
    // Subscribe to cart changes
    this.cartService.getCart().subscribe(() => {
      this.cartCount = this.cartService.getCartCount();
    });
  }

  loadProducts() {
    this.productService.getAllProducts().subscribe(products => {
      this.products = products;
      this.filterProducts();
    });
  }

  onSearchChange(event: any) {
    this.searchQuery = event.detail.value || '';
    this.filterProducts();
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.filterProducts();
  }

  filterProducts() {
    let filtered = this.products;

    // Filter by category
    if (this.selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    this.filteredProducts = filtered;
  }

  addToCart(product: Product, event: Event) {
    event.stopPropagation();
    this.cartService.addToCart(product, 1);
    // You could add a toast notification here
  }

  viewCart() {
    this.router.navigate(['/cart']);
  }

  getStarArray(rating: number): number[] {
    return [1, 2, 3, 4, 5];
  }
}