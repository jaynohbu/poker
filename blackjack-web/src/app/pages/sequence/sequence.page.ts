import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sequence-page',
  imports: [RouterLink],
  template: `
    <main class="page-shell">
      <a class="back-link" routerLink="/">← Back</a>
      <article class="card">
        <p class="eyebrow">03 / 시퀀스 다이어그램</p>
        <h1>사용자 입력, 판단, 카드 처리, 결과 출력의 흐름을 한 장으로 정리한다</h1>
        <p>
          시퀀스 다이어그램은 누가 어떤 순서로 무엇을 주고받는지를 보여주는 설계 도구입니다. 블랙잭에서는 사용자,
          UI, 게임 컨트롤러, 룰 엔진, 몬테카를로 시뮬레이터, 강화학습 에이전트, 그리고 저장소가 순차적으로
          협력합니다.
        </p>
        <p>
          예를 들어 사용자가 Hit을 누르면 UI가 GameController에 이벤트를 넘기고, Controller는 현재 상태를 기준으로
          RuleEngine이나 AI 모델에 판단을 요청합니다. 그 결과를 다시 화면에 반영하고, 다음 상태로 진행합니다.
        </p>
        <p>
          이 페이지는 그런 흐름을 먼저 말로 정리한 뒤, 이후 실제 Mermaid 다이어그램이나 시각적 시퀀스 차트로 확장할
          수 있는 출발점 역할을 합니다.
        </p>
        <pre class="diagram">User -> UI -> GameController -> RuleEngine / AI Model -> UI</pre>
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
    'p { margin:0 0 1rem; line-height:1.7; font-size:1rem; }',
    '.diagram { margin-top:1rem; padding:0.9rem 1rem; border-radius:14px; background:#00000025; border:1px solid #ffffff2a; font-family: monospace; white-space: pre-wrap; }'
  ]
})
export class SequencePage {}
