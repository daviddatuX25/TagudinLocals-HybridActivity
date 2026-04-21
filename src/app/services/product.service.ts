import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products: Product[] = [];
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {
    this.fetchProducts();
  }

  fetchProducts(): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.http.get<Product[]>(`${environment.apiUrl}/products`).pipe(
      tap(products => {
        this.products = products;
        this.productsSubject.next([...this.products]);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        const message = error.status === 0
          ? 'Unable to connect to server'
          : `Failed to load products: ${error.statusText || 'Unknown error'}`;
        this.errorSubject.next(message);
        return of([]);
      })
    ).subscribe();
  }

  getAllProducts(): Observable<Product[]> {
    return this.products$;
  }

  getProductById(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  searchProducts(query: string): Product[] {
    const lowercaseQuery = query.toLowerCase();
    return this.products.filter(p =>
      p.name.toLowerCase().includes(lowercaseQuery) ||
      p.description.toLowerCase().includes(lowercaseQuery) ||
      p.category.toLowerCase().includes(lowercaseQuery)
    );
  }

  filterByCategory(category: string): Product[] {
    if (!category || category === 'All') {
      return this.products;
    }
    return this.products.filter(p => p.category === category);
  }

  getCategories(): string[] {
    const categories = this.products.map(p => p.category);
    return ['All', ...Array.from(new Set(categories))];
  }

  // Admin methods (localStorage-only, out of scope for API integration)
  getProducts(): Product[] {
    return this.products;
  }

  addProduct(product: Omit<Product, 'id'>): Product {
    const newProduct: Product = {
      ...product,
      id: this.generateProductId(),
      availableDeliveryServices: product.availableDeliveryServices || []
    };
    this.products = [...this.products, newProduct];
    this.productsSubject.next([...this.products]);
    this.saveProducts();
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): void {
    const index = this.products.findIndex(p => p.id === id);
    if (index !== -1) {
      this.products = this.products.map((p, i) =>
        i === index ? { ...p, ...updates } : p
      );
      this.productsSubject.next([...this.products]);
      this.saveProducts();
    }
  }

  deleteProduct(id: string): void {
    this.products = this.products.filter(p => p.id !== id);
    this.productsSubject.next([...this.products]);
    this.saveProducts();
  }

  private generateProductId(): string {
    const maxId = this.products.reduce((max, p) => {
      const id = parseInt(p.id, 10);
      return id > max ? id : max;
    }, 0);
    return (maxId + 1).toString();
  }

  private saveProducts(): void {
    localStorage.setItem('products', JSON.stringify(this.products));
  }
}
