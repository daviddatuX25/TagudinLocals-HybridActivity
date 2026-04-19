import { CartItem } from './cart-item.model';
import { DeliveryService } from './delivery-service.model';

export interface CustomerInfo {
  fullName: string;
  phoneNumber: string;
  email?: string;
  deliveryAddress: string;
}

export interface Order {
  id: string;
  customerName?: string; // Legacy field
  contactNumber?: string; // Legacy field
  email?: string; // Legacy field
  deliveryAddress?: string; // Legacy field
  location?: string; // City/Barangay - Legacy field
  customerInfo?: CustomerInfo; // New structured field
  items: CartItem[];
  deliveryService?: DeliveryService; // Legacy field
  deliveryServiceId?: string; // New field - ID of delivery service
  totalAmount: number;
  deliveryFee?: number;
  subtotal?: number;
  status: OrderStatus | string;
  createdAt?: Date;
  orderDate?: Date;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  OUT_FOR_DELIVERY = 'out-for-delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}
