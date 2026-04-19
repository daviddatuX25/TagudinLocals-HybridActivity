import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Order, OrderStatus } from '../models/order.model';
import { CartItem } from '../models/cart-item.model';
import { DeliveryService } from '../models/delivery-service.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private orders: Order[] = [];
  private ordersSubject = new BehaviorSubject<Order[]>(this.orders);
  public orders$ = this.ordersSubject.asObservable();

  constructor() {
    // Load orders from localStorage
    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) {
      this.orders = JSON.parse(savedOrders);
      this.ordersSubject.next(this.orders);
    }
  }

  createOrder(
    customerName: string,
    contactNumber: string,
    deliveryAddress: string,
    location: string,
    items: CartItem[],
    deliveryService: DeliveryService,
    email?: string
  ): Order {
    const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const deliveryFee = deliveryService.pricing;
    const totalAmount = subtotal + deliveryFee;
    
    const order: Order = {
      id: this.generateOrderId(),
      // Legacy fields for backward compatibility
      customerName,
      contactNumber,
      email,
      deliveryAddress,
      location,
      // New structured fields
      customerInfo: {
        fullName: customerName,
        phoneNumber: contactNumber,
        email: email,
        deliveryAddress: deliveryAddress
      },
      items,
      deliveryService,
      deliveryServiceId: deliveryService.id,
      subtotal,
      totalAmount,
      deliveryFee,
      status: OrderStatus.PENDING,
      createdAt: new Date(),
      orderDate: new Date()
    };

    this.orders.unshift(order);
    this.saveOrders();
    return order;
  }

  getOrders(): Observable<Order[]> {
    return this.orders$;
  }

  getOrderById(id: string): Order | undefined {
    return this.orders.find(o => o.id === id);
  }

  private generateOrderId(): string {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  private saveOrders(): void {
    localStorage.setItem('orders', JSON.stringify(this.orders));
    this.ordersSubject.next(this.orders);
  }

  // Admin methods
  getAllOrders(): Order[] {
    return this.orders;
  }

  updateOrderStatus(orderId: string, status: Order['status']): void {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      this.saveOrders();
    }
  }
}
