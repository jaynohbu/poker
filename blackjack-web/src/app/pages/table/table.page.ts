import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-table-page',
  imports: [RouterLink],
  template: `
    <main class="table-wrap">
      <h1>Blackjack Table</h1>
      <p>Authenticated table placeholder. Wire game UI here.</p>
      <a routerLink="/profile">Go to profile</a>
    </main>
  `,
  styles: [
    '.table-wrap{min-height:100vh;color:#fff8e7;padding:2rem}'
  ]
})
export class TablePage {}
