import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface DemoItem {
  title: string;
  description: string;
  route: string;
}

@Component({
  selector: 'app-demos-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="shell">
      <a class="back" routerLink="/">← Back</a>
      <header class="header">
        <h1>Demos</h1>
        <p>Choose a demo from the list below. More demos will be added here.</p>
      </header>

      <section class="demo-list">
        @for (demo of demos; track demo.route) {
          <a class="demo-card" [routerLink]="demo.route">
            <h2>{{ demo.title }}</h2>
            <p>{{ demo.description }}</p>
          </a>
        }
      </section>
    </main>
  `,
  styles: [
    ':host { display:block; min-height:100vh; color:#fff8e7; }',
    '.shell { width:min(920px,94vw); margin:0 auto; padding:1.2rem 0 2rem; }',
    '.back { color:#fff8e7; text-decoration:none; }',
    '.header { margin:0.9rem 0 1rem; }',
    '.header h1 { margin:0 0 0.35rem; }',
    '.header p { margin:0; color:#f7f0dfd4; }',
    '.demo-list { display:grid; gap:0.8rem; }',
    '.demo-card { display:block; text-decoration:none; color:inherit; border:1px solid #ffffff2f; border-radius:12px; background:#00000024; padding:0.9rem; transition:transform 0.15s ease, border-color 0.15s ease; }',
    '.demo-card h2 { margin:0 0 0.25rem; font-size:1.05rem; color:#ffd477; }',
    '.demo-card p { margin:0; color:#f7f0df; line-height:1.45; }',
    '.demo-card:hover { transform:translateY(-2px); border-color:#ffd4777a; }'
  ]
})
export class DemosPage {
  protected readonly demos: DemoItem[] = [
    {
      title: 'Blackjack OOP Demo Random actions',
      description: 'Runs one blackjack round with random actions and replay timeline.',
      route: '/blackjack-demo'
    },
    {
      title: 'Blackjack Strategy Comparison',
      description: 'Automatically compare random play with Monte Carlo choices using the completed 23,520-state results.',
      route: '/blackjack-compare'
    }
  ];
}
