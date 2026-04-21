import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CartItem } from '../models/cart-item.model';
import { Product } from '../models/product.model';

interface ApiCartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>(this.cartItems);
  public cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      this.cartItems = JSON.parse(savedCart);
      this.cartSubject.next([...this.cartItems]);
    }
  }

  getCart(): Observable<CartItem[]> {
    return this.cart$;
  }

  addToCart(product: Product, quantity: number = 1): void {
    const payload: ApiCartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity
    };

    this.http.post(`${environment.apiUrl}/cart`, payload).pipe(
      tap(() => {
        // API success: update in-memory + localStorage (dual-write)
        this.applyAddToCart(product, quantity);
      }),
      catchError(() => {
        // API failure: still update localStorage (graceful degradation)
        this.applyAddToCart(product, quantity);
        return [];
      })
    ).subscribe();
  }

  syncCartFromApi(products: Product[]): void {
    this.http.get<ApiCartItem[]>(`${environment.apiUrl}/cart`).pipe(
      tap(apiItems => {
        const apiCartItems: CartItem[] = apiItems.map(apiItem => {
          const product = products.find(p => p.id === String(apiItem.productId));
          const enrichedProduct: Product = product
            ? { ...product }
            : {
                id: String(apiItem.productId),
                name: apiItem.name,
                price: apiItem.price,
                description: '',
                image: '',
                category: '',
                available: true
              };
          return { product: enrichedProduct, quantity: apiItem.quantity };
        });

        // Merge: localStorage items take precedence; add API items not in localStorage
        const localIds = new Set(this.cartItems.map(i => i.product.id));
        const merged = [
          ...this.cartItems,
          ...apiCartItems.filter(apiItem => !localIds.has(apiItem.product.id))
        ];

        this.cartItems = merged;
        this.cartSubject.next([...this.cartItems]);
        localStorage.setItem('cart', JSON.stringify(this.cartItems));
      }),
      catchError(() => {
        // If API fails, just keep localStorage cart
        return [];
      })
    ).subscribe();
  }

  removeFromCart(productId: string): void {
    this.cartItems = this.cartItems.filter(item => item.product.id !== productId);
    this.updateCart();
  }

  updateQuantity(productId: string, quantity: number): void {
    const item = this.cartItems.find(i => i.product.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        this.cartItems = this.cartItems.map(i =>
          i.product.id === productId ? { ...i, quantity } : i
        );
        this.updateCart();
      }
    }
  }

  clearCart(): void {
    this.cartItems = [];
    this.updateCart();
  }

  getCartCount(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  getCartTotal(): number {
    return this.cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }

  private applyAddToCart(product: Product, quantity: number): void {
    const existingItem = this.cartItems.find(item => item.product.id === product.id);

    if (existingItem) {
      this.cartItems = this.cartItems.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      this.cartItems = [...this.cartItems, { product, quantity }];
    }

    this.updateCart();
  }

  private updateCart(): void {
    this.cartSubject.next([...this.cartItems]);
    localStorage.setItem('cart', JSON.stringify(this.cartItems));
  }
}
