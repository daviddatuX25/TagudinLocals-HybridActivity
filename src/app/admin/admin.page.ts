import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton,
  IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton,
  IonIcon, IonList, IonItem, IonInput, IonTextarea,
  IonBadge, IonGrid, IonRow, IonCol, IonButtons, IonBackButton, IonAlert,
  IonModal, IonCheckbox, IonChip
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  addOutline, createOutline, trashOutline, saveOutline, closeOutline,
  cartOutline, cubeOutline, bicycleOutline, checkmarkCircle, timeOutline,
  checkmarkOutline, closeCircleOutline, logOutOutline
} from 'ionicons/icons';
import { ProductService } from '../services/product.service';
import { DeliveryService } from '../services/delivery.service';
import { OrderService } from '../services/order.service';
import { Product } from '../models/product.model';
import { DeliveryService as DeliveryServiceModel } from '../models/delivery-service.model';
import { Order } from '../models/order.model';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton,
    IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton,
    IonIcon, IonList, IonItem, IonInput, IonTextarea,
    IonBadge, IonGrid, IonRow, IonCol, IonButtons, IonBackButton, IonAlert,
    IonModal, IonCheckbox, IonChip
  ]
})
export class AdminPage implements OnInit {
  selectedSegment: string = 'products';
  
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
    private productService: ProductService,
    private deliveryService: DeliveryService,
    private orderService: OrderService
  ) {
    addIcons({
      addOutline, createOutline, trashOutline, saveOutline, closeOutline,
      cartOutline, cubeOutline, bicycleOutline, checkmarkCircle, timeOutline,
      checkmarkOutline, closeCircleOutline, logOutOutline
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.products = this.productService.getProducts();
    this.deliveryService.getAllServices().subscribe(services => {
      this.deliveryServices = services;
    });
    this.orders = this.orderService.getAllOrders();
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
    this.showProductModal = true;
  }

  openEditProductModal(product: Product) {
    this.isEditMode = true;
    this.newProduct = { ...product };
    this.showProductModal = true;
  }

  saveProduct() {
    if (this.isEditMode && this.newProduct.id) {
      this.productService.updateProduct(this.newProduct.id, this.newProduct as Product);
    } else {
      this.productService.addProduct(this.newProduct as Omit<Product, 'id'>);
    }
    this.loadData();
    this.closeProductModal();
  }

  confirmDeleteProduct(product: Product) {
    this.itemToDelete = { type: 'product', item: product };
    this.showDeleteAlert = true;
  }

  deleteProduct() {
    if (this.itemToDelete && this.itemToDelete.type === 'product') {
      this.productService.deleteProduct(this.itemToDelete.item.id);
      this.loadData();
    }
    this.showDeleteAlert = false;
    this.itemToDelete = null;
  }

  closeProductModal() {
    this.showProductModal = false;
    this.newProduct = {};
    this.isEditMode = false;
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
      );
      this.loadData();
      this.closeDeliveryModal();
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
    this.orderService.updateOrderStatus(orderId, status);
    this.loadData();
    if (this.selectedOrder && this.selectedOrder.id === orderId) {
      this.selectedOrder.status = status;
    }
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
}
