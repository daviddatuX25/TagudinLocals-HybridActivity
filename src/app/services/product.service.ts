import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products: Product[] = [
    {
      id: '1',
      name: 'Calamansi',
      price: 120,
      description: 'Freshly harvested from Tagudin. Perfect for cooking, drinks, and marinades.',
      image: 'https://www.recipesbynora.com/wp-content/uploads/2024/04/Calamansi-in-basket.jpg',
      category: 'Fruits',
      available: true,
      rating: 4.8,
      deliveryServices: ['1', '2', '3']
    },
    {
      id: '2',
      name: 'Ilocos Empanada',
      price: 80,
      description: 'Freshly cooked Ilocos empanada. Crispy orange shell filled with savory goodness.',
      image: 'https://i.pinimg.com/originals/9c/8e/3e/9c8e3efc123f95db09e5f8bb40be973b.jpg',
      category: 'Food',
      available: true,
      rating: 4.5,
      deliveryServices: ['1', '3']
    },
    {
      id: '3',
      name: 'Dalem',
      price: 50,
      description: 'Kain ka neto pag mahal mo atay mo. Traditional Ilocano liver dish, 80g per serving.',
      image: 'https://i.ytimg.com/vi/By4mAEYxr4s/maxresdefault.jpg',
      category: 'Food',
      available: true,
      rating: 5.0,
      deliveryServices: ['2', '4']
    },
    {
      id: '4',
      name: 'Shrimp/Udang',
      price: 400,
      description: 'Freshly caught from the seas of Tagudin. Half kilo of fresh, quality shrimp.',
      image: 'https://thumbs.dreamstime.com/b/fresh-caught-shrimp-farm-freshly-water-61944525.jpg',
      category: 'Seafood',
      available: true,
      rating: 4.7,
      deliveryServices: ['1', '2', '3', '4']
    },
    {
      id: '5',
      name: 'Pork Meat',
      price: 300,
      description: 'Kaururaga tattay agsapa. Fresh pork meat, 1 kilo of quality cuts.',
      image: 'https://newsline.ph/wp-content/uploads/2021/02/pork-meat-1-scaled.jpg',
      category: 'Meat',
      available: true,
      rating: 4.6,
      deliveryServices: ['1', '3']
    },
    {
      id: '6',
      name: 'Chicken Meat',
      price: 300,
      description: 'Fresh whole chicken from local poultry farm. 1 kilo of quality chicken.',
      image: 'https://cebudailynews.inquirer.net/files/2024/07/IMG_9378-scaled.jpg',
      category: 'Meat',
      available: true,
      rating: 4.3,
      deliveryServices: ['1', '2', '3', '4']
    },
    {
      id: '7',
      name: 'Tupig',
      price: 50,
      description: 'Kalutluto tattay agsapa diay Bio. Traditional sweet rice cake, 1 bundle.',
      image: 'https://i.pinimg.com/736x/7b/45/60/7b4560be2b6bc6009b603a7c9f137414.jpg',
      category: 'Food',
      available: true,
      rating: 4.4,
      deliveryServices: ['1', '2']
    },
    {
      id: '8',
      name: 'Tinubong',
      price: 100,
      description: 'Traditional Ilocano sticky rice delicacy cooked in bamboo tubes. 1 piece.',
      image: 'https://img00.deviantart.net/d081/i/2015/115/6/4/tinubong_by_photonemic-d4yy68e.jpg',
      category: 'Food',
      available: true,
      rating: 4.8,
      deliveryServices: ['1', '2', '3']
    },
    {
      id: '9',
      name: 'Tapuey (Rice Wine)',
      price: 500,
      description: 'Product is produced in Alilem, Ilocos Sur. Traditional Ilocano rice wine, 1 bottle.',
      image: 'https://www.funinthephilippines.com/wp-content/uploads/2024/05/cover-photo-baya-1140x760.jpg',
      category: 'Beverages',
      available: true,
      rating: 4.9,
      deliveryServices: ['1', '2', '3', '4']
    },
    {
      id: '10',
      name: 'Longboy',
      price: 120,
      description: 'Fresh Longboy vegetables, 1 kilo. Perfect for healthy Filipino dishes.',
      image: 'https://i.pinimg.com/474x/ae/26/a9/ae26a9e6a3f165959d341086eddd83ef--healthy-foods-healthy-eating.jpg',
      category: 'Fruits',
      available: true,
      rating: 4.6,
      deliveryServices: ['1', '2', '3']
    },
    {
      id: '11',
      name: 'Saba',
      price: 150,
      description: 'Fresh Saba bananas, 1 sapad (bunch). Perfect for cooking or snacking.',
      image: 'https://i.pinimg.com/originals/d4/00/aa/d400aa8cb08550c10e5e9df712919f36.jpg',
      category: 'Fruits',
      available: true,
      rating: 4.7,
      deliveryServices: ['1', '2', '3', '4']
    }
  ];

  private productsSubject = new BehaviorSubject<Product[]>(this.products);
  public products$ = this.productsSubject.asObservable();

  constructor() {
    this.loadProducts();
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

  // Admin methods
  getProducts(): Product[] {
    return this.products;
  }

  addProduct(product: Omit<Product, 'id'>): Product {
    const newProduct: Product = {
      ...product,
      id: this.generateProductId(),
      availableDeliveryServices: product.availableDeliveryServices || []
    };
    this.products.push(newProduct);
    this.productsSubject.next(this.products);
    this.saveProducts();
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): void {
    const index = this.products.findIndex(p => p.id === id);
    if (index !== -1) {
      this.products[index] = { ...this.products[index], ...updates };
      this.productsSubject.next(this.products);
      this.saveProducts();
    }
  }

  deleteProduct(id: string): void {
    const index = this.products.findIndex(p => p.id === id);
    if (index !== -1) {
      this.products.splice(index, 1);
      this.productsSubject.next(this.products);
      this.saveProducts();
    }
  }

  private generateProductId(): string {
    const maxId = this.products.reduce((max, p) => {
      const id = parseInt(p.id);
      return id > max ? id : max;
    }, 0);
    return (maxId + 1).toString();
  }

  private saveProducts(): void {
    localStorage.setItem('products', JSON.stringify(this.products));
  }

  private loadProducts(): void {
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      this.products = JSON.parse(savedProducts);
      this.productsSubject.next(this.products);
    }
  }
}
