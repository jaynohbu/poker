import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { from, map, Observable, switchMap } from 'rxjs';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Language } from '../../core/models/language.model';
import { normalizePublicUrl } from '../../core/utils/public-url';
import {
  BlogArticle,
  BlogArticleResponse,
  BlogArticlesResponse,
  BlogImageUploadResponse,
  CreateBlogArticleInput,
  UpdateBlogArticlePayload,
} from './blog.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BlogApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getLatestArticles(limit = 10, offset = 0, tag?: string, language: Language = 'ko'): Observable<BlogArticlesResponse> {
    const tagQuery = tag ? `&tag=${encodeURIComponent(tag)}` : '';
    return this.http.get<BlogArticlesResponse>(
      `${this.baseUrl}/articles?limit=${limit}&offset=${offset}${tagQuery}&language=${language}`,
    ).pipe(
      map((response) => ({
        ...response,
        articles: response.articles.map((article) => normalizeArticleUrls(article)),
      })),
    );
  }

  getArticleBySlug(slug: string, language: Language = 'ko'): Observable<BlogArticleResponse> {
    return this.http.get<BlogArticleResponse>(`${this.baseUrl}/articles/${slug}?language=${language}`).pipe(
      map((response) => ({ article: normalizeArticleUrls(response.article) })),
    );
  }

  createArticle(input: CreateBlogArticleInput, language: Language = 'ko'): Observable<BlogArticleResponse> {
    return this.withAuthHeaders((headers) =>
      this.http.post<BlogArticleResponse>(`${this.baseUrl}/articles`, { article: { ...input, language } }, { headers }),
    ).pipe(map((response) => ({ article: normalizeArticleUrls(response.article) })));
  }

  updateArticle(slug: string, input: UpdateBlogArticlePayload, language: Language = 'ko'): Observable<BlogArticleResponse> {
    return this.withAuthHeaders((headers) =>
      this.http.patch<BlogArticleResponse>(`${this.baseUrl}/articles/${slug}`, { article: { ...input, language } }, { headers }),
    ).pipe(map((response) => ({ article: normalizeArticleUrls(response.article) })));
  }

  deleteArticle(slug: string): Observable<{ deleted: true }> {
    return this.withAuthHeaders((headers) =>
      this.http.delete<{ deleted: true }>(`${this.baseUrl}/articles/${slug}`, { headers }),
    );
  }

  uploadArticleImage(email: string, file: File): Observable<BlogImageUploadResponse> {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('file', file);
    return this.withAuthHeaders((headers) =>
      this.http.post<BlogImageUploadResponse>(`${this.baseUrl}/articles/images`, formData, { headers }),
    ).pipe(map((response) => ({ ...response, url: normalizePublicUrl(response.url) })));
  }

  deleteArticleImage(key: string): Observable<{ deleted: true }> {
    const encodedKey = encodeURIComponent(key);
    return this.withAuthHeaders((headers) =>
      this.http.delete<{ deleted: true }>(`${this.baseUrl}/articles/images?key=${encodedKey}`, { headers }),
    );
  }

  private withAuthHeaders<T>(request: (headers: HttpHeaders) => Observable<T>): Observable<T> {
    return from(this.createAuthHeaders()).pipe(switchMap((headers) => request(headers)));
  }

  private async createAuthHeaders(): Promise<HttpHeaders> {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString() ?? session.tokens?.accessToken?.toString() ?? '';
      return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
    } catch {
      return new HttpHeaders();
    }
  }
}

function normalizeArticleUrls(article: BlogArticle): BlogArticle {
  return {
    ...article,
    body: normalizePublicUrlInHtml(article.body),
    author: {
      ...article.author,
      image: normalizePublicUrl(article.author.image),
    },
  };
}

function normalizePublicUrlInHtml(html: string): string {
  if (!html) return html;
  return html.replace(/https?:\/\/[^\s"'<>]+/gi, (url) => normalizePublicUrl(url));
}
