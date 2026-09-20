import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { blogWriterGuard } from './guards/blog-writer.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./pages/landing/landing.page').then((m) => m.LandingPage)
	},
	{
		path: 'blog',
		loadComponent: () => import('./features/blog/blog-home.page').then((m) => m.BlogHomePage)
	},
	{
		path: 'blog/article/:slug',
		loadComponent: () => import('./features/blog/blog-article.page').then((m) => m.BlogArticlePage)
	},
	{
		path: 'blog/write',
		canActivate: [authGuard, blogWriterGuard],
		loadComponent: () => import('./features/blog/blog-write.page').then((m) => m.BlogWritePage)
	},
	{
		path: 'blog/edit/:slug',
		canActivate: [authGuard, blogWriterGuard],
		loadComponent: () => import('./features/blog/blog-edit.page').then((m) => m.BlogEditPage)
	},
	{
		path: 'community',
		redirectTo: 'blog',
		pathMatch: 'full'
	},
	{
		path: 'community/article/:slug',
		redirectTo: 'blog/article/:slug'
	},
	{
		path: 'story',
		loadComponent: () => import('./pages/story/project-story.page').then((m) => m.ProjectStoryPage)
	},
	{
		path: 'oop',
		loadComponent: () => import('./pages/oop/oop.page').then((m) => m.OopPage)
	},
	{
		path: 'sequence',
		loadComponent: () => import('./pages/sequence/sequence.page').then((m) => m.SequencePage)
	},
	{
		path: 'pending-4',
		loadComponent: () => import('./pages/pending-4/pending-4.page').then((m) => m.Pending4Page)
	},
	{
		path: 'pending-5',
		loadComponent: () => import('./pages/pending-5/pending-5.page').then((m) => m.Pending5Page)
	},
	{
		path: 'auth/login',
		canActivate: [guestGuard],
		loadComponent: () => import('./pages/auth/login.page').then((m) => m.LoginPage)
	},
	{
		path: 'auth/register',
		canActivate: [guestGuard],
		loadComponent: () => import('./pages/auth/register.page').then((m) => m.RegisterPage)
	},
	{
		path: 'auth/confirm',
		canActivate: [guestGuard],
		loadComponent: () => import('./pages/auth/confirm.page').then((m) => m.ConfirmPage)
	},
	{
		path: 'auth/forgot-password',
		canActivate: [guestGuard],
		loadComponent: () => import('./pages/auth/forgot-password.page').then((m) => m.ForgotPasswordPage)
	},
	{
		path: 'profile',
		canActivate: [authGuard],
		loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage)
	},
	{
		path: 'table',
		canActivate: [authGuard],
		loadComponent: () => import('./pages/table/table.page').then((m) => m.TablePage)
	},
	{ path: '**', redirectTo: '' }
];
