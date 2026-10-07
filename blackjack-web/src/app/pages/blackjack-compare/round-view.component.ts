import { Component, input } from '@angular/core';
import { PlayedRound, RoundFrame } from './blackjack-simulation';
import { CardRow } from './card-row.component';

@Component({
  selector: 'round-view',
  standalone: true,
  imports: [CardRow],
  template: `
    @if (frame(); as current) {
      <div class="round">
        <div class="hand">
          <div class="hand-title"><span>딜러</span><strong>{{ handTotal(current.dealerHand) }}</strong></div>
          <app-card-row [cards]="current.dealerHand" />
        </div>
        @for (hand of current.playerHands; track $index; let idx = $index) {
          <div class="hand">
            <div class="hand-title">
              <span>플레이어{{ current.playerHands.length > 1 ? ' ' + (idx + 1) : '' }}</span>
              <strong>{{ handTotal(hand) }}</strong>
            </div>
            <app-card-row [cards]="hand" />
          </div>
        }
        <p class="action" aria-live="polite">{{ current.message }}</p>
        @if (round(); as finished) {
          <p class="outcome" [class.win]="finished.result === 'win'" [class.loss]="finished.result === 'loss'">
            {{ actionLabel(finished.openingAction) }} · {{ resultLabel(finished.result) }}
            · 순수익 {{ finished.profit > 0 ? '+' : '' }}{{ finished.profit }} 단위
          </p>
        }
      </div>
    } @else {
      <div class="round empty">첫 라운드 결과를 기다리는 중...</div>
    }
  `,
  styles: [`
    :host { display:block; }
    .round { display:grid; align-content:start; gap:.7rem; min-height:280px; padding:.7rem; border-radius:10px; background:#0000002a; }
    .empty { align-content:center; color:#fff8e7a8; }
    .hand-title { display:flex; justify-content:space-between; align-items:center; gap:.5rem; margin-bottom:.4rem; }
    .hand-title strong { color:#ffd477; }
    .action { margin:0; color:#fff8e7d4; font-size:.9rem; }
    .outcome { margin:.25rem 0 0; color:#ffe09a; font-size:.88rem; }
    .outcome.win { color:#89e4b5; }
    .outcome.loss { color:#ffaaa0; }
  `],
})
export class RoundView {
  readonly round = input<PlayedRound | null>(null);
  readonly frame = input<RoundFrame | null>(null);

  protected handTotal(cards: string[]): string {
    if (!cards.length || cards.includes('?')) return '—';
    const values = cards.map((card) => {
      const rank = card.slice(0, -1);
      return rank === 'A' ? 1 : ['J', 'Q', 'K'].includes(rank) ? 10 : Number(rank);
    });
    let total = values.reduce((sum, value) => sum + (value === 1 ? 11 : value), 0);
    let aces = values.filter((value) => value === 1).length;
    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }
    return `${total}${aces > 0 ? ' (soft)' : ''}`;
  }

  protected actionLabel(action: string): string {
    const labels: Record<string, string> = {
      'Random hit/stand': '무작위 행동',
      hit: 'hit',
      stand: 'stand',
      double: 'double',
      split: 'split',
    };
    return `첫 행동: ${labels[action] ?? action}`;
  }

  protected resultLabel(result: string): string {
    return result === 'win' ? '승리' : result === 'loss' ? '패배' : '무승부';
  }
}
