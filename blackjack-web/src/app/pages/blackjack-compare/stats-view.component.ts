import { Component, input } from '@angular/core';
import { createEmptyStats, SimulationStats } from './blackjack-simulation';

@Component({
  selector: 'stats-view',
  standalone: true,
  template: `
    <div class="stats">
      <span>누적 순수익 <strong>{{ stats().profit >= 0 ? '+' : '' }}{{ stats().profit.toFixed(1) }}</strong> 단위</span>
      <span>승 {{ stats().wins }} · 패 {{ stats().losses }} · 무 {{ stats().pushes }}</span>
    </div>
  `,
  styles: [`
    :host { display:block; }
    .stats { display:flex; justify-content:space-between; gap:.5rem; flex-wrap:wrap; margin-top:.65rem; color:#fff8e7bf; font-size:.82rem; }
    strong { color:#ffe09a; font-variant-numeric:tabular-nums; }
  `],
})
export class StatsView {
  readonly stats = input<SimulationStats>(createEmptyStats());
}
