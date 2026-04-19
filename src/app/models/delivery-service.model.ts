export interface DeliveryService {
  id: string;
  name: string;
  description: string;
  coverageAreas: string[]; // List of areas/barangays they serve
  pricing: number;
  estimatedTime: string; // e.g., "30-45 mins"
  rating: number;
  image: string;
  available: boolean;
}
