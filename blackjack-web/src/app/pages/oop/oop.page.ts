import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-oop-page',
  imports: [RouterLink],
  template: `
    <main class="page-shell">
      <a class="back-link" routerLink="/">← Back</a>
      <article class="card">
        <p class="eyebrow">02 / 객체지향형 코딩</p>
        <h1>게임의 규칙을 객체로 나누고, 책임과 협력을 분리해서 설계한다</h1>
        <p>
          객체지향형 코딩은 데이터를 함수에 붙여두는 방식이 아니라, 서로 다른 책임을 가진 객체들로 문제를 분해하는
          방식입니다. 블랙잭에서는 카드, 덱, 핸드, 플레이어, 딜러, 룰 엔진, 승률 계산기 같은 객체들이 서로 다른
          역할을 맡습니다.
        </p>
        <p>
          예를 들어 Deck는 카드를 섞고 뽑는 책임을 갖고, Hand는 현재 점수를 계산하며, RuleEngine은 히트/스탠드/버스트
          같은 판정을 담당합니다. MonteCarloSimulator는 많은 게임을 반복하는 실험 책임을, ReinforcementAgent는 경험을
          통해 더 나은 행동 정책을 학습하는 책임을 가질 수 있습니다.
        </p>
        <p>
          이런 구조로 설계하면 각 객체가 자신의 일을 명확히 하고, 나중에 통계 모델이나 강화학습 모델을 교체해도 전체
          시스템을 크게 흔들지 않고 실험할 수 있습니다.
        </p>
      </article>
    </main>
  `,
  styles: [
    ':host { display:block; min-height:100vh; color:#fff8e7; }',
    '.page-shell { width:min(960px, 94vw); margin:0 auto; padding:1.4rem 0 3rem; }',
    '.back-link { display:inline-block; margin-bottom:1rem; color:#fff8e7; text-decoration:none; }',
    '.card { border:1px solid #ffffff3a; border-radius:24px; background:#0000001f; backdrop-filter: blur(4px); padding:1.4rem; }',
    '.eyebrow { margin:0 0 0.7rem; color:#f8b84c; text-transform:uppercase; letter-spacing:0.08em; font-size:0.82rem; }',
    'h1 { margin:0 0 1rem; font-size:clamp(2rem, 4vw, 3.1rem); line-height:1.08; }',
    'p { margin:0 0 1rem; line-height:1.7; font-size:1rem; }'
  ]
})
export class OopPage {}
