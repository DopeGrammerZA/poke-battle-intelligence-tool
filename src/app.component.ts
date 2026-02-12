import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule, Sword, Shield, BookType, Github } from 'lucide-angular';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
})
export class AppComponent {
  title = 'Poké Battle Intelligence Tool';

  navLinks = [
    { path: '/pokedex', label: 'Pokédex', icon: BookType },
    { path: '/compare', label: 'Compare', icon: Sword },
    { path: '/types', label: 'Type Explorer', icon: Shield },
  ];
}
