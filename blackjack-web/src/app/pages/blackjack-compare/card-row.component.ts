import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card-row',
  template: `
    <div class="card-row">
      @for (card of cards(); track $index) {
        <div class="card-view" [class.card-back]="card === '?'"
          [class.red]="card.endsWith('♥') || card.endsWith('♦')"
          role="img" [attr.aria-label]="card === '?' ? '히든 카드' : card">
          @if (card === '?') {
            <span class="back-mark" aria-hidden="true">◆</span>
          } @else {
            <span class="card-rank">{{ card.slice(0, -1) }}</span>
            <span class="card-suit">{{ card.slice(-1) }}</span>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .card-row { display:flex; flex-wrap:wrap; gap:.45rem; min-height:80px; align-items:flex-start; }
    .card-view { width:56px; height:78px; box-sizing:border-box; flex-shrink:0; border-radius:8px;
      border:1px solid #0000002a; background:linear-gradient(180deg,#ffffff,#f4f4f4);
      box-shadow:0 3px 10px #00000033; display:flex; flex-direction:column; align-items:center;
      justify-content:center; color:#10171f; animation:deal-in .3s ease-out; }
    .card-rank { font-weight:800; line-height:1; font-size:1.2rem; }
    .card-suit { font-size:1.35rem; line-height:1; margin-top:.35rem; }
    .red { color:#ba2f2f; }
    .card-back { border:3px solid #fff; color:#fff8e7; background:repeating-linear-gradient(45deg,#214d70,#214d70 5px,#18364f 5px,#18364f 10px); }
    .back-mark { font-size:1.6rem; }
    @keyframes deal-in { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
    @media (prefers-reduced-motion:reduce) { .card-view { animation:none; } }
  `],
})
export class CardRow {
  readonly cards = input<string[]>([]);
}
