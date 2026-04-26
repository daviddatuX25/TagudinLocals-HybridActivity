import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Order, OrderStatus } from '../models/order.model';
import { CartItem } from '../models/cart-item.model';
import { DeliveryService as DeliveryServiceModel } from '../models/delivery-service.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private orders: Order[] = [];
  private ordersSubject = new BehaviorSubject<Order[]>(this.orders);
  public orders$ = this.ordersSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {}

  createOrder(
    customerName: string,
    contactNumber: string,
    deliveryAddress: string,
    location: string,
    items: CartItem[],
    deliveryService: DeliveryServiceModel,
    email?: string
  ): Observable<Order | null> {
    const deliveryServiceId = deliveryService.id;
    const orderItems = items.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity
    }));

    const payload = {
      items: orderItems,
      customerInfo: {
        fullName: customerName,
        phoneNumber: contactNumber,
        email: email || null,
        deliveryAddress: deliveryAddress
      },
      deliveryServiceId
    };

    return this.http.post<Order>(`${environment.apiUrl}/orders`, payload).pipe(
      tap(order => {
        this.orders = [order, ...this.orders];
        this.ordersSubject.next([...this.orders]);
      }),
      catchError(() => {
        return of(null);
      })
    );
  }

  getOrders(phoneNumber?: string): Observable<Order[]> {
    const params = phoneNumber ? `?customer=${phoneNumber}` : '';
    this.http.get<Order[]>(`${environment.apiUrl}/orders${params}`).pipe(
      tap(orders => {
        this.orders = orders;
        this.ordersSubject.next([...this.orders]);
      }),
      catchError(() => {
        return of([]);
      })
    ).subscribe();
    return this.orders$;
  }

  getOrderById(id: string): Observable<Order | null> {
    return this.http.get<Order>(`${environment.apiUrl}/orders/${id}`).pipe(
      catchError(() => {
        return of(null);
      })
    );
  }

  // Admin methods
  getAllOrders(): Order[] {
    return this.orders;
  }

  updateOrderStatus(orderId: string, status: Order['status']): Observable<Order | null> {
    const headers = this.authService.getPinHeader();
    return this.http.patch<Order>(`${environment.apiUrl}/api/admin/orders/${orderId}`, { status }, { headers }).pipe(
      tap(updatedOrder => {
        this.orders = this.orders.map(o =>
          o.id === orderId ? { ...o, status } : o
        );
        this.ordersSubject.next([...this.orders]);
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) return throwError(() => err);
        return of(null);
      })
    );
  }
}