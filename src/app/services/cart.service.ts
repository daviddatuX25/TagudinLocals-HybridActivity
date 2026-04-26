import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CartItem } from '../models/cart-item.model';
import { Product } from '../models/product.model';

interface ApiCartItem {
  id: string;
  sessionId: string;
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

  private sessionId: string;
  private apiItemIdMap = new Map<string, string>();

  constructor(private http: HttpClient) {
    this.sessionId = localStorage.getItem('cartSessionId') || '';
    if (!this.sessionId) {
      this.sessionId = crypto.randomUUID();
      localStorage.setItem('cartSessionId', this.sessionId);
    }

    // Load cart from API on init
    this.syncCartFromApi();
  }

  private getSessionId(): string {
    return this.sessionId;
  }

  getCart(): Observable<CartItem[]> {
    return this.cart$;
  }

  addToCart(product: Product, quantity: number = 1): void {
    if (!product.available || product.stock === 0) {
      return;
    }

    const sessionId = this.getSessionId();
    const payload = {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity
    };

    this.http.post<ApiCartItem>(`${environment.apiUrl}/cart/${sessionId}`, payload).pipe(
      tap(apiItem => {
        this.apiItemIdMap.set(String(apiItem.productId), apiItem.id);
        this.cartItems = this.cartItems.some(i => i.product.id === String(apiItem.productId))
          ? this.cartItems.map(i => i.product.id === String(apiItem.productId) ? { ...i, quantity: apiItem.quantity } : i)
          : [...this.cartItems, { product: { ...product, id: String(apiItem.productId) }, quantity: apiItem.quantity }];
        this.updateCart(true);
      }),
      catchError(() => {
        this.applyAddToCart(product, quantity);
        return [];
      })
    ).subscribe();
  }

  removeFromCart(productId: string): void {
    const sessionId = this.getSessionId();
    const item = this.cartItems.find(i => i.product.id === productId);

    if (item) {
      const apiItemId = this.findApiItemId(productId);

      this.http.delete(`${environment.apiUrl}/cart/${sessionId}/${apiItemId}`).pipe(
        tap(() => {
          this.apiItemIdMap.delete(productId);
          this.cartItems = this.cartItems.filter(i => i.product.id !== productId);
          this.updateCart(true);
        }),
        catchError(() => {
          this.cartItems = this.cartItems.filter(i => i.product.id !== productId);
          this.updateCart();
          return [];
        })
      ).subscribe();
    }
  }

  updateQuantity(productId: string, quantity: number): void {
    const sessionId = this.getSessionId();

    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const apiItemId = this.findApiItemId(productId);

    this.http.patch<ApiCartItem>(`${environment.apiUrl}/cart/${sessionId}/${apiItemId}`, { quantity }).pipe(
      tap(apiItem => {
        this.cartItems = this.cartItems.map(i =>
          i.product.id === productId ? { ...i, quantity: apiItem.quantity } : i
        );
        this.updateCart(true);
      }),
      catchError(() => {
        this.cartItems = this.cartItems.map(i =>
          i.product.id === productId ? { ...i, quantity } : i
        );
        this.updateCart();
        return [];
      })
    ).subscribe();
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

  syncCartFromApi(): void {
    const sessionId = this.getSessionId();
    this.http.get<ApiCartItem[]>(`${environment.apiUrl}/cart/${sessionId}`).pipe(
      tap(apiItems => {
        // Build mapping from productId to API item ID for PATCH/DELETE operations
        this.apiItemIdMap.clear();
        this.cartItems = apiItems.map(apiItem => {
          this.apiItemIdMap.set(String(apiItem.productId), apiItem.id);
          return {
            product: {
              id: String(apiItem.productId),
              name: apiItem.name,
              price: apiItem.price,
              description: '',
              image: '',
              category: '',
              available: true,
              stock: 0
            } as Product,
            quantity: apiItem.quantity
          };
        });
        this.updateCart(true);
      }),
      catchError(() => {
        // If API fails, keep current cart
        return [];
      })
    ).subscribe();
  }

  private findApiItemId(productId: string): string {
    // The API cart item id is stored in the cart items from the last sync.
    // For items synced from API, we need to track the API item ID.
    // Since the API returns items with their own id, we need a mapping.
    // We store the mapping in a private field.
    const apiId = this.apiItemIdMap.get(productId);
    return apiId || productId;
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

  private updateCart(fromApi = false): void {
    this.cartSubject.next([...this.cartItems]);
    // WR-06: Only persist to localStorage after successful API sync
    if (fromApi) {
      localStorage.setItem('cart', JSON.stringify(this.cartItems));
    }
  }
}