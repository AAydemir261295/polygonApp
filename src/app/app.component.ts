import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PolyComponent } from './components/poly.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PolyComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'polygonApp';
}
