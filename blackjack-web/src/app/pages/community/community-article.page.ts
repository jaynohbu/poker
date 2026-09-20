import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RealworldApiService, RealworldArticle } from '../../infra/realworld/realworld-api.service';

@Component({
  selector: 'app-community-article-page',
  imports: [RouterLink, DatePipe],
  template: `
    <main class="shell">
      <a class="back" routerLink="/community">← Back to Community Feed</a>

      @if (loading()) {
        <section class="panel"><p>Loading article...</p></section>
      }

      @if (error()) {
        <section class="panel error"><p>{{ error() }}</p></section>
      }

      @if (!loading() && article()) {
        <article class="panel">
          <p class="meta">
            <strong>{{ article()!.author.username }}</strong>
            <span>{{ article()!.createdAt | date:'mediumDate' }}</span>
          </p>
          <h1>{{ article()!.title }}</h1>
          <p class="desc">{{ article()!.description }}</p>
          <div class="body">{{ article()!.body }}</div>
          <ul class="tags">
            @for (tag of article()!.tagList; track tag) {
              <li>{{ tag }}</li>
            }
          </ul>
        </article>
      }
    </main>
  `,
  styles: [
    ':host { display: block; min-height: 100vh; color: #fff8e7; }',
    '.shell { width: min(900px, 94vw); margin: 0 auto; padding: 1.4rem 0 2rem; }',
    '.back { color: #fff8e7; text-decoration: none; display: inline-block; margin-bottom: 0.9rem; }',
    '.panel { border: 1px solid #ffffff3a; border-radius: 18px; background: #0000001f; padding: 1.1rem; }',
    '.error { border-color: #ffb6b6aa; }',
    '.meta { margin: 0 0 0.4rem; display: flex; justify-content: space-between; gap: 0.8rem; font-size: 0.86rem; color: #f8dca3; }',
    'h1 { margin: 0 0 0.55rem; font-size: clamp(1.6rem, 3.2vw, 2.4rem); line-height: 1.14; }',
    '.desc { margin: 0 0 1rem; color: #fffbf1d9; line-height: 1.5; }',
    '.body { white-space: pre-wrap; line-height: 1.7; }',
    '.tags { margin: 1rem 0 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 0.4rem; }',
    '.tags li { border: 1px solid #ffffff36; border-radius: 999px; padding: 0.2rem 0.55rem; font-size: 0.76rem; color: #f8dca3; }'
  ]
})
export class CommunityArticlePage implements OnInit {
  private readonly api = inject(RealworldApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly article = signal<RealworldArticle | null>(null);

  async ngOnInit(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.error.set('Missing article slug.');
      this.loading.set(false);
      return;
    }

    try {
      const response = await firstValueFrom(this.api.getArticle(slug));
      this.article.set(response.article);
    } catch {
      this.error.set('Failed to load article.');
    } finally {
      this.loading.set(false);
    }
  }
}
