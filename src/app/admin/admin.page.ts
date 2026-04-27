import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton,
  IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton,
  IonIcon, IonList, IonItem, IonInput, IonTextarea,
  IonBadge, IonGrid, IonRow, IonCol, IonButtons, IonBackButton, IonAlert,
  IonModal, IonCheckbox, IonChip, IonToast
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, createOutline, trashOutline, saveOutline, closeOutline,
  cartOutline, cubeOutline, bicycleOutline, checkmarkCircle, timeOutline,
  checkmarkOutline, closeCircleOutline, logOutOutline,
  cameraOutline, imageOutline, lockClosedOutline, linkOutline, arrowBackOutline
} from 'ionicons/icons';
import { Camera } from '@capacitor/camera';
import { AuthService } from '../services/auth.service';
import { ProductService } from '../services/product.service';
import { DeliveryService } from '../services/delivery.service';
import { OrderService } from '../services/order.service';
import { Product } from '../models/product.model';
import { DeliveryService as DeliveryServiceModel } from '../models/delivery-service.model';
import { Order } from '../models/order.model';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton,
    IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton,
    IonIcon, IonList, IonItem, IonInput, IonTextarea,
    IonBadge, IonGrid, IonRow, IonCol, IonButtons, IonBackButton, IonAlert,
    IonModal, IonCheckbox, IonChip, IonToast
  ]
})
export class AdminPage implements OnInit, OnDestroy {
  selectedSegment: string = 'products';

  // PIN Authentication
  showPinModal = true;
  pinMode: 'setup' | 'verify' = 'setup';
  pinInput = '';
  pinError: string | null = null;
  isPinLoading = false;

  // Products Management
  products: Product[] = [];
  editingProduct: Product | null = null;
  newProduct: Partial<Product> = {};
  showProductModal = false;
  isEditMode = false;
  
  // Delivery Services Management
  deliveryServices: DeliveryServiceModel[] = [];
  selectedProductForDelivery: Product | null = null;
  showDeliveryModal = false;
  
  // Orders Management
  orders: Order[] = [];
  selectedOrder: Order | null = null;
  showOrderModal = false;
  
  // Alert
  showDeleteAlert = false;
  itemToDelete: any = null;

  // Camera and upload
  imagePreview: string | null = null;
  isUploading = false;
  showErrorToast = false;
  errorMessage: string | null = null;
  showUrlInput = false;
  
  alertButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        this.showDeleteAlert = false;
        this.itemToDelete = null;
      }
    },
    {
      text: 'Delete',
      role: 'confirm',
      handler: () => this.deleteProduct()
    }
  ];

  constructor(
    private authService: AuthService,
    private productService: ProductService,
    private deliveryService: DeliveryService,
    private orderService: OrderService,
    private http: HttpClient,
    private router: Router
  ) {
    addIcons({
      addOutline, createOutline, trashOutline, saveOutline, closeOutline,
      cartOutline, cubeOutline, bicycleOutline, checkmarkCircle, timeOutline,
      checkmarkOutline, closeCircleOutline, logOutOutline,
      cameraOutline, imageOutline, lockClosedOutline, linkOutline, arrowBackOutline
    });
  }

  ngOnInit() {
    this.productService.products$.subscribe(products => {
      this.products = products;
    });

    if (this.authService.isAdminVerified()) {
      this.showPinModal = false;
      this.loadData();
    } else {
      this.authService.hasPinSet().subscribe(hasPin => {
        this.pinMode = hasPin ? 'verify' : 'setup';
        this.showPinModal = true;
      });
    }
  }

  ngOnDestroy() {
    this.orderService.stopAdminPolling();
  }

  submitPin() {
    if (!this.pinInput || this.pinInput.length < 4) {
      this.pinError = 'PIN must be at least 4 digits';
      return;
    }
    this.isPinLoading = true;
    this.pinError = null;

    const pinObs = this.pinMode === 'setup'
      ? this.authService.setupPin(this.pinInput)
      : this.authService.verifyPin(this.pinInput);

    pinObs.subscribe({
      next: (success) => {
        this.isPinLoading = false;
        if (success) {
          this.showPinModal = false;
          this.pinInput = '';
          this.loadData();
        } else {
          this.pinError = this.pinMode === 'setup' ? 'Failed to set PIN' : 'Incorrect PIN';
        }
      },
      error: () => {
        this.isPinLoading = false;
        this.pinError = 'Connection error. Please try again.';
      }
    });
  }

  logoutAdmin() {
    this.authService.logout();
    this.pinMode = 'verify';
    this.pinInput = '';
    this.pinError = null;
    this.showPinModal = true;
  }

  cancelAuth() {
    this.router.navigate(['/products']);
  }

  private handleSessionExpired() {
    this.authService.logout();
    this.pinMode = 'verify';
    this.pinError = 'Session expired. Please enter your PIN again.';
    this.showPinModal = true;
  }

  loadData() {
    this.productService.fetchProducts();
    this.deliveryService.getAllServices().subscribe(services => {
      this.deliveryServices = services;
    });
    this.orderService.getOrders().subscribe(orders => {
      this.orders = orders;
    });
    this.orderService.startAdminPolling();
  }

  // ==================== PRODUCTS MANAGEMENT ====================
  
  openAddProductModal() {
    this.isEditMode = false;
    this.newProduct = {
      name: '',
      description: '',
      price: 0,
      image: '',
      category: '',
      available: true,
      stock: 0,
      availableDeliveryServices: []
    };
    this.imagePreview = null;
    this.showProductModal = true;
  }

  openEditProductModal(product: Product) {
    this.isEditMode = true;
    this.newProduct = { ...product };
    this.imagePreview = product.image || null;
    this.showProductModal = true;
  }

  saveProduct() {
    const obs = this.isEditMode && this.newProduct.id
      ? this.productService.updateProduct(this.newProduct.id, this.newProduct as Product)
      : this.productService.addProduct(this.newProduct as Omit<Product, 'id'>);

    obs.subscribe({
      next: () => {
        this.loadData();
        this.closeProductModal();
      },
      error: (err) => {
        if (err?.status === 401) {
          this.handleSessionExpired();
          this.closeProductModal();
        } else {
          this.errorMessage = 'Failed to save product';
          this.showErrorToast = true;
        }
      }
    });
  }

  confirmDeleteProduct(product: Product) {
    this.itemToDelete = { type: 'product', item: product };
    this.showDeleteAlert = true;
  }

  deleteProduct() {
    if (this.itemToDelete && this.itemToDelete.type === 'product') {
      this.productService.deleteProduct(this.itemToDelete.item.id).subscribe({
        next: () => {
          this.loadData();
        },
        error: (err) => {
          if (err?.status === 401) {
            this.handleSessionExpired();
          } else {
            this.errorMessage = 'Failed to delete product';
            this.showErrorToast = true;
          }
        }
      });
    }
    this.showDeleteAlert = false;
    this.itemToDelete = null;
  }

  closeProductModal() {
    this.showProductModal = false;
    this.newProduct = {};
    this.isEditMode = false;
    this.imagePreview = null;
  }

  // ==================== DELIVERY SERVICES MANAGEMENT ====================
  
  openDeliveryServicesModal(product: Product) {
    this.selectedProductForDelivery = { ...product };
    this.showDeliveryModal = true;
  }

  toggleDeliveryService(serviceId: string) {
    if (!this.selectedProductForDelivery) return;
    
    const services = this.selectedProductForDelivery.availableDeliveryServices || [];
    const index = services.indexOf(serviceId);
    
    if (index > -1) {
      services.splice(index, 1);
    } else {
      services.push(serviceId);
    }
    
    this.selectedProductForDelivery.availableDeliveryServices = services;
  }

  isDeliveryServiceSelected(serviceId: string): boolean {
    if (!this.selectedProductForDelivery) return false;
    return (this.selectedProductForDelivery.availableDeliveryServices || []).includes(serviceId);
  }

  saveDeliveryServices() {
    if (this.selectedProductForDelivery && this.selectedProductForDelivery.id) {
      this.productService.updateProduct(
        this.selectedProductForDelivery.id,
        this.selectedProductForDelivery
      ).subscribe({
        next: () => {
          this.loadData();
          this.closeDeliveryModal();
        },
        error: (err) => {
          if (err?.status === 401) {
            this.handleSessionExpired();
          } else {
            this.errorMessage = 'Failed to save delivery services';
            this.showErrorToast = true;
          }
        }
      });
    }
  }

  closeDeliveryModal() {
    this.showDeliveryModal = false;
    this.selectedProductForDelivery = null;
  }

  // ==================== ORDERS MANAGEMENT ====================
  
  openOrderDetailsModal(order: Order) {
    this.selectedOrder = order;
    this.showOrderModal = true;
  }

  updateOrderStatus(orderId: string, status: Order['status']) {
    this.orderService.updateOrderStatus(orderId, status).subscribe({
      next: () => {
        this.loadData();
        if (this.selectedOrder && this.selectedOrder.id === orderId) {
          this.selectedOrder.status = status;
        }
      },
      error: (err) => {
        if (err?.status === 401) {
          this.handleSessionExpired();
        } else {
          this.errorMessage = 'Failed to update order status';
          this.showErrorToast = true;
        }
      }
    });
  }

  closeOrderModal() {
    this.showOrderModal = false;
    this.selectedOrder = null;
  }

  getOrderStatusColor(status: Order['status']): string {
    const colors: { [key: string]: string } = {
      'pending': 'warning',
      'confirmed': 'primary',
      'preparing': 'secondary',
      'out-for-delivery': 'tertiary',
      'delivered': 'success',
      'cancelled': 'danger'
    };
    return colors[status] || 'medium';
  }

  getOrderCount(status?: Order['status']): number {
    if (!status) return this.orders.length;
    return this.orders.filter(o => o.status === status).length;
  }

  getTotalRevenue(): number {
    return this.orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, order) => sum + order.totalAmount, 0);
  }

  getDeliveryServiceName(serviceId: string): string {
    const service = this.deliveryServices.find(s => s.id === serviceId);
    return service ? service.name : 'Unknown';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ==================== CAMERA & UPLOAD ====================

  removeImage(): void {
    this.imagePreview = null;
    this.newProduct.image = '';
  }

  onImageUrlChange(): void {
    if (this.newProduct.image) {
      this.imagePreview = this.newProduct.image;
    } else {
      this.imagePreview = null;
    }
  }

  async takePhoto(): Promise<void> {
    try {
      const result = await Camera.takePhoto({
        quality: 80,
        webUseInput: true,
        correctOrientation: true
      });
      if (result.webPath) {
        await this.processAndUpload(result.webPath);
      }
    } catch (error: unknown) {
      this.handleCameraError(error);
    }
  }

  async pickFromGallery(): Promise<void> {
    try {
      const { results } = await Camera.chooseFromGallery({
        limit: 1,
        webUseInput: true
      });
      if (results.length > 0 && results[0].webPath) {
        await this.processAndUpload(results[0].webPath);
      }
    } catch (error: unknown) {
      this.handleCameraError(error);
    }
  }

  private async processAndUpload(imagePath: string): Promise<void> {
    this.imagePreview = imagePath;
    this.isUploading = true;

    try {
      const blob = await this.resizeImage(imagePath, 800);
      const formData = new FormData();
      formData.append('image', blob, 'product.jpg');

      const headers = this.authService.getAuthHeaders();
      this.http.post<{ url: string }>(
        `${environment.apiUrl}/upload`,
        formData,
        { headers }
      ).subscribe({
        next: (response) => {
          // Cloudinary returns absolute URLs, local uploads return relative paths
          this.newProduct.image = response.url.startsWith('http')
            ? response.url
            : `${environment.apiUrl}${response.url}`;
          this.imagePreview = this.newProduct.image!;
          this.isUploading = false;
        },
        error: (err) => {
          if (err.status === 401) {
            this.handleSessionExpired();
          } else {
            this.errorMessage = 'Failed to upload image';
            this.showErrorToast = true;
          }
          this.isUploading = false;
        }
      });
    } catch (error: unknown) {
      this.errorMessage = 'Failed to process image';
      this.showErrorToast = true;
      this.isUploading = false;
    }
  }

  private async resizeImage(imagePath: string, maxSize: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('toBlob failed')),
          'image/jpeg',
          0.8
        );
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = imagePath;
    });
  }

  handleCameraError(error: unknown): void {
    const err = error as any;
    let message = 'Camera error occurred';

    if (err?.code === 'OS-PLUG-CAMR-0003') {
      message = 'Camera permission denied. Please enable camera access in settings.';
    } else if (err?.code === 'OS-PLUG-CAMR-0006') {
      return;
    } else if (err?.code === 'OS-PLUG-CAMR-0007') {
      message = 'No camera available on this device';
    } else if (err?.message) {
      message = err.message;
    }

    this.errorMessage = message;
    this.showErrorToast = true;
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const fallback = img.parentElement?.querySelector('.product-image-fallback') as HTMLElement;
    if (fallback) fallback.classList.add('show');
  }
}
