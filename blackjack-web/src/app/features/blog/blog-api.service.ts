import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BlogArticleResponse, BlogArticlesResponse, CreateBlogArticleInput } from './blog.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BlogApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getLatestArticles(limit = 10, offset = 0, tag?: string): Observable<BlogArticlesResponse> {
    const tagQuery = tag ? `&tag=${encodeURIComponent(tag)}` : '';
    return this.http.get<BlogArticlesResponse>(
      `${this.baseUrl}/articles?limit=${limit}&offset=${offset}${tagQuery}`,
    );
  }

  getArticleBySlug(slug: string): Observable<BlogArticleResponse> {
    return this.http.get<BlogArticleResponse>(`${this.baseUrl}/articles/${slug}`);
  }

  createArticle(input: CreateBlogArticleInput): Observable<BlogArticleResponse> {
    return this.http.post<BlogArticleResponse>(`${this.baseUrl}/articles`, { article: input });
  }
}
