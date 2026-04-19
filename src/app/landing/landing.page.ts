import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  personCircleOutline,
  shieldCheckmarkOutline,
  cartOutline,
  settingsOutline,
  arrowForwardOutline,
  storefront
} from 'ionicons/icons';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent
  ]
})
export class LandingPage {
  constructor(private router: Router) {
    addIcons({
      personCircleOutline,
      shieldCheckmarkOutline,
      cartOutline,
      settingsOutline,
      arrowForwardOutline,
      storefront
    });
  }

  enterAsBuyer() {
    this.router.navigate(['/home']);
  }

  enterAsAdmin() {
    this.router.navigate(['/admin']);
  }
}
