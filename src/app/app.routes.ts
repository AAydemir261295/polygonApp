import { importProvidersFrom } from '@angular/core';
import { Routes } from '@angular/router';
import { PolyComponent } from './components/poly.component';

export const routes: Routes = [
  {
    path: 'polygon',
    component: PolyComponent,
  },
];
