import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Language } from '../../core/models/language.model';
import {
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
    );
  }

  getArticleBySlug(slug: string, language: Language = 'ko'): Observable<BlogArticleResponse> {
    return this.http.get<BlogArticleResponse>(`${this.baseUrl}/articles/${slug}?language=${language}`);
  }

  createArticle(input: CreateBlogArticleInput, language: Language = 'ko'): Observable<BlogArticleResponse> {
    return this.http.post<BlogArticleResponse>(`${this.baseUrl}/articles`, { article: { ...input, language } });
  }

  updateArticle(slug: string, input: UpdateBlogArticlePayload, language: Language = 'ko'): Observable<BlogArticleResponse> {
    return this.http.patch<BlogArticleResponse>(`${this.baseUrl}/articles/${slug}`, { article: { ...input, language } });
  }

  deleteArticle(slug: string): Observable<{ deleted: true }> {
    return this.http.delete<{ deleted: true }>(`${this.baseUrl}/articles/${slug}`);
  }

  uploadArticleImage(email: string, file: File): Observable<BlogImageUploadResponse> {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('file', file);
    return this.http.post<BlogImageUploadResponse>(`${this.baseUrl}/articles/images`, formData);
  }
}
