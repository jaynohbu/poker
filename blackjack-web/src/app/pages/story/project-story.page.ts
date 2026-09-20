import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-project-story-page',
  imports: [RouterLink],
  template: `
    <main class="page-shell">
      <a class="back-link" routerLink="/">← Back</a>
      <article class="card">
        <p class="eyebrow">01 / 왜 이 프로젝트를 하는가</p>
        <h1>몬테카를로 시뮬레이션과 강화학습이 같은 게임을 어떻게 다르게 읽는지 보여주는 프로젝트</h1>
        <p>
          이 프로젝트는 블랙잭을 하나의 실험실처럼 다룹니다. 먼저 몬테카를로 시뮬레이션으로 많은 게임을 반복해,
          특정 상황에서의 승률과 손익 분포를 통계적으로 살펴봅니다. 그다음에는 강화학습으로 배운 모델이 같은 상황을
          어떻게 해석하는지 비교합니다.
        </p>
        <p>
          핵심은 "어느 방법이 더 잘 맞는가"를 단순히 묻는 것이 아니라, 통계적 추정과 학습 기반 예측이 각기 어떤
          길이와 깊이의 판단을 만드는지 확인하는 데 있습니다. 몬테카를로는 넓은 분포를 보여주고, 강화학습은 경험을
          축적해 행동 정책을 만듭니다. 두 방식이 같은 게임을 두고 어떤 차이를 드러내는지 보는 것이 이 프로젝트의
          출발점입니다.
        </p>
        <p>
          또한 사각형 안에 무작위로 공을 던져 원 안에 들어가는 비율로 원주율을 근사하는 고전적인 몬테카를로 예제를
          블랙잭에 응용합니다. 카드 조합과 행동 결과를 무작위 표본으로 쌓아 올리면, 개별 판의 운보다 전체 분포가
          더 중요한 상황을 수치로 확인할 수 있습니다.
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
export class ProjectStoryPage {}
