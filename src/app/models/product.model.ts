export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  available: boolean;
  rating?: number;
  stock?: number;
  deliveryServices?: string[]; // IDs of available delivery services (legacy)
  availableDeliveryServices?: string[]; // IDs of available delivery services
}
