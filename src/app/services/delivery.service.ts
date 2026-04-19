import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DeliveryService as DeliveryServiceModel } from '../models/delivery-service.model';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private deliveryServices: DeliveryServiceModel[] = [
    {
      id: '1',
      name: 'QuickDeliver Express',
      description: 'Fast and reliable delivery service covering major areas in Ilocos Sur',
      coverageAreas: ['Sta. Cruz', 'Candon,', 'Sta. Lucia', 'Tagudin', 'Sudipen', 'Bangar'],
      pricing: 50,
      estimatedTime: '30-45 mins',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400',
      available: true
    },
    {
      id: '2',
      name: 'Ilocos Local Riders',
      description: 'Supporting local communities with affordable delivery',
      coverageAreas: ['Sta. Cruz', 'Candon,', 'Sta. Lucia', 'Tagudin','Suyo', 'Alilem'],
      pricing: 35,
      estimatedTime: '45-60 mins',
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=400',
      available: true
    },
    {
      id: '3',
      name: 'Same Day Delivery Co.',
      description: 'Premium delivery service with same-day guarantee',
      coverageAreas: ['Sta. Cruz', 'Candon,', 'Sta. Lucia', 'Tagudin', 'Sudipen', 'Bangar'],
      pricing: 75,
      estimatedTime: '20-30 mins',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1605902711834-8b11c3e3ef2f?w=400',
      available: true
    },
  ];

  private servicesSubject = new BehaviorSubject<DeliveryServiceModel[]>(this.deliveryServices);
  public services$ = this.servicesSubject.asObservable();

  constructor() { }

  getAllServices(): Observable<DeliveryServiceModel[]> {
    return this.services$;
  }

  getServiceById(id: string): DeliveryServiceModel | undefined {
    return this.deliveryServices.find(s => s.id === id);
  }

  searchServicesByLocation(location: string): DeliveryServiceModel[] {
    if (!location) {
      return this.deliveryServices;
    }
    
    const lowercaseLocation = location.toLowerCase();
    return this.deliveryServices.filter(service => 
      service.available && service.coverageAreas.some(area => 
        area.toLowerCase().includes(lowercaseLocation)
      )
    );
  }

  getServicesByProductIds(productIds: string[]): DeliveryServiceModel[] {
    // Return services that can deliver all products
    // For simplicity, returning all available services
    return this.deliveryServices.filter(s => s.available);
  }
}
