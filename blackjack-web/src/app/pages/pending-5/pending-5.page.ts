import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pending-5-page',
  imports: [RouterLink],
  template: `
    <main class="page-shell">
      <a class="back-link" routerLink="/">← Back</a>
      <article class="card">
        <p class="eyebrow">05 / 대기</p>
        <h1>후속 분석을 붙일 수 있는 빈 페이지</h1>
        <p>원하면 이 페이지를 정책 비교, 데이터 시각화, 학습 결과 리뷰 같은 내용으로 채울 수 있습니다.</p>
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
export class Pending5Page {}
