import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DeliveryService as DeliveryServiceModel } from '../models/delivery-service.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private deliveryServices: DeliveryServiceModel[] = [];
  private servicesSubject = new BehaviorSubject<DeliveryServiceModel[]>([]);
  public services$ = this.servicesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.fetchServices();
  }

  private fetchServices(): void {
    this.http.get<DeliveryServiceModel[]>(`${environment.apiUrl}/delivery-services`).pipe(
      catchError(() => {
        // If API fails, keep current data
        return [];
      })
    ).subscribe((services: DeliveryServiceModel[]) => {
      if (services && services.length > 0) {
        this.deliveryServices = services;
        this.servicesSubject.next([...this.deliveryServices]);
      }
    });
  }

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
    return this.deliveryServices.filter(s => s.available);
  }
}