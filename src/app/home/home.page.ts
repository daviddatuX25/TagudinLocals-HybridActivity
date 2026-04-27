import { Component, OnInit, OnDestroy } from '@angular/core';
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
  settingsOutline,
  refreshOutline,
  shirtOutline,
  hardwareChipOutline,
  homeOutline,
  schoolOutline,
  fastFoodOutline,
  fishOutline,
  cafeOutline,
  nutritionOutline,
  restaurantOutline,
  beerOutline,
  waterOutline,
  leafOutline,
  gridOutline,
  imageOutline,
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
  IonLabel,
  IonToast,
  IonSkeletonText,
  IonThumbnail
} from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
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
    IonLabel,
    IonToast,
    IonSkeletonText,
    IonThumbnail
  ]
})
export class HomePage implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = [];
  selectedCategory: string = 'All';
  searchQuery: string = '';
  cartCount: number = 0;
  isLoading = false;
  errorMessage: string | null = null;
  showErrorToast = false;

  categoryIcons: Record<string, string> = {
    'All': 'grid-outline',
    'Fashion': 'shirt-outline',
    'Gadgets': 'hardware-chip-outline',
    'Home': 'home-outline',
    'School': 'school-outline',
    'Fast Food': 'fast-food-outline',
    'Seafood': 'fish-outline',
    'Bakery': 'cake-outline',
    'Fruits': 'nutrition-outline',
    'Food': 'restaurant-outline',
    'Beverages': 'beer-outline',
    'Water': 'water-outline',
    'Groceries': 'leaf-outline',
  };

  private loadingSub: Subscription;
  private errorSub: Subscription;
  private productsSub: Subscription;
  private cartSub: Subscription;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private router: Router
  ) {
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
      settingsOutline,
      refreshOutline,
      shirtOutline,
      hardwareChipOutline,
      homeOutline,
      schoolOutline,
      fastFoodOutline,
      fishOutline,
      cafeOutline,
      nutritionOutline,
      restaurantOutline,
      beerOutline,
      waterOutline,
      leafOutline,
      gridOutline,
      imageOutline,
    });

    this.loadingSub = this.productService.loading$.subscribe(loading => {
      this.isLoading = loading;
    });

    this.errorSub = this.productService.error$.subscribe(error => {
      this.errorMessage = error;
      this.showErrorToast = !!error;
    });

    this.productsSub = this.productService.getAllProducts().subscribe(products => {
      this.products = products;
      this.categories = this.productService.getCategories();
      this.filterProducts();
    });

    this.cartSub = this.cartService.getCart().subscribe(() => {
      this.cartCount = this.cartService.getCartCount();
    });
  }

  ngOnInit() {
    this.cartCount = this.cartService.getCartCount();
  }

  ngOnDestroy() {
    this.loadingSub.unsubscribe();
    this.errorSub.unsubscribe();
    this.productsSub.unsubscribe();
    this.cartSub.unsubscribe();
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

    if (this.selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

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
  }

  viewCart() {
    this.router.navigate(['/cart']);
  }

  retryLoad() {
    this.showErrorToast = false;
    this.productService.fetchProducts();
  }

  getStarArray(rating: number): number[] {
    return [1, 2, 3, 4, 5];
  }

  getCategoryIcon(category: string): string {
    return this.categoryIcons[category] || 'pricetag-outline';
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const fallback = img.parentElement?.querySelector('.product-img-fallback') as HTMLElement;
    if (fallback) fallback.style.display = 'flex';
  }
}