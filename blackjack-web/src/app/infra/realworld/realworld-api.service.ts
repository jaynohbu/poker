import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type RealworldAuthor = {
  username: string;
  image: string;
};

export type RealworldArticle = {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  author: RealworldAuthor;
};

type ArticlesResponse = {
  articles: RealworldArticle[];
  articlesCount: number;
};

type ArticleResponse = {
  article: RealworldArticle;
};

@Injectable({ providedIn: 'root' })
export class RealworldApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://api.realworld.show/api';

  getGlobalFeed(limit = 10, offset = 0): Observable<ArticlesResponse> {
    return this.http.get<ArticlesResponse>(`${this.baseUrl}/articles?limit=${limit}&offset=${offset}`);
  }

  getArticle(slug: string): Observable<ArticleResponse> {
    return this.http.get<ArticleResponse>(`${this.baseUrl}/articles/${slug}`);
  }
}
