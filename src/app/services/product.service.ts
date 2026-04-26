import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';
import { AuthService } from './auth.service';

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

  constructor(private http: HttpClient, private authService: AuthService) {
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

  // Admin methods (API-first)
  getProducts(): Product[] {
    return this.products;
  }

  addProduct(product: Omit<Product, 'id'>): Observable<Product | null> {
    const headers = this.authService.getPinHeader();
    return this.http.post<Product>(`${environment.apiUrl}/api/admin/products`, product, { headers }).pipe(
      tap(() => {
        this.fetchProducts();
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) return throwError(() => err);
        this.errorSubject.next('Failed to add product');
        return of(null);
      })
    );
  }

  updateProduct(id: string, updates: Partial<Product>): Observable<Product | null> {
    const headers = this.authService.getPinHeader();
    return this.http.put<Product>(`${environment.apiUrl}/api/admin/products/${id}`, updates, { headers }).pipe(
      tap(() => {
        this.fetchProducts();
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) return throwError(() => err);
        this.errorSubject.next('Failed to update product');
        return of(null);
      })
    );
  }

  deleteProduct(id: string): Observable<any> {
    const headers = this.authService.getPinHeader();
    return this.http.delete(`${environment.apiUrl}/api/admin/products/${id}`, { headers }).pipe(
      tap(() => {
        this.fetchProducts();
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) return throwError(() => err);
        this.errorSubject.next('Failed to delete product');
        return of(null);
      })
    );
  }
}
