import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RealworldApiService, RealworldArticle } from '../../infra/realworld/realworld-api.service';

@Component({
  selector: 'app-community-home-page',
  imports: [RouterLink, DatePipe],
  template: `
    <main class="shell">
      <header class="header">
        <a class="back" routerLink="/">← Back to RLDojo</a>
        <h1>Community Feed (RealWorld Read-only)</h1>
        <p>blackjack-web 기반을 유지하면서, 외부 RealWorld 공개 피드를 읽기 전용으로 연결한 1차 통합 페이지입니다.</p>
      </header>

      @if (loading()) {
        <section class="panel"><p>Loading articles...</p></section>
      }

      @if (error()) {
        <section class="panel error"><p>{{ error() }}</p></section>
      }

      @if (!loading() && !error()) {
        <section class="list">
          @for (article of articles(); track article.slug) {
            <article class="item">
              <p class="meta">
                <strong>{{ article.author.username }}</strong>
                <span>{{ article.createdAt | date:'mediumDate' }}</span>
              </p>
              <a class="title" [routerLink]="['/community/article', article.slug]">{{ article.title }}</a>
              <p class="desc">{{ article.description }}</p>
              <ul class="tags">
                @for (tag of article.tagList; track tag) {
                  <li>{{ tag }}</li>
                }
              </ul>
            </article>
          }
        </section>
      }
    </main>
  `,
  styles: [
    ':host { display: block; min-height: 100vh; color: #fff8e7; }',
    '.shell { width: min(980px, 94vw); margin: 0 auto; padding: 1.4rem 0 2rem; }',
    '.header h1 { margin: 0.4rem 0 0.5rem; font-size: clamp(1.8rem, 3.4vw, 2.8rem); }',
    '.header p { margin: 0 0 1rem; max-width: 70ch; line-height: 1.55; }',
    '.back { color: #fff8e7; text-decoration: none; }',
    '.panel { border: 1px solid #ffffff3a; border-radius: 18px; background: #0000001f; padding: 1rem; }',
    '.error { border-color: #ffb6b6aa; }',
    '.list { display: grid; gap: 0.8rem; }',
    '.item { border: 1px solid #ffffff3a; border-radius: 18px; background: #0000001f; padding: 1rem; }',
    '.meta { margin: 0 0 0.4rem; display: flex; justify-content: space-between; gap: 0.8rem; font-size: 0.86rem; color: #f8dca3; }',
    '.title { color: #fff; text-decoration: none; font-size: 1.18rem; font-weight: 700; }',
    '.desc { margin: 0.45rem 0 0; line-height: 1.45; color: #fffbf1d9; }',
    '.tags { margin: 0.65rem 0 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 0.4rem; }',
    '.tags li { border: 1px solid #ffffff36; border-radius: 999px; padding: 0.2rem 0.55rem; font-size: 0.76rem; color: #f8dca3; }'
  ]
})
export class CommunityHomePage implements OnInit {
  private readonly api = inject(RealworldApiService);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly articles = signal<RealworldArticle[]>([]);

  async ngOnInit(): Promise<void> {
    try {
      const response = await firstValueFrom(this.api.getGlobalFeed(15, 0));
      this.articles.set(response.articles);
    } catch {
      this.error.set('Failed to load community feed.');
    } finally {
      this.loading.set(false);
    }
  }
}
