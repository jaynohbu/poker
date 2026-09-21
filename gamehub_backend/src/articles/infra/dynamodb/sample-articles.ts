import { Article } from '../../domain/article';

export const SAMPLE_ARTICLES: Article[] = [
  {
    slug: 'how-to-learn-javascript-efficiently',
    language: 'en',
    title: 'How to Learn JavaScript Efficiently',
    description: 'A comprehensive guide to mastering JavaScript from beginner to advanced level',
    body: 'Learning JavaScript can be overwhelming with so many resources available.',
    bodyFormat: 'text',
    tagList: ['beginners', 'javascript', 'programming', 'webdev'],
    createdAt: '2026-09-19T00:00:00.000Z',
    author: { username: 'johndoe', image: '' },
    content: {
      en: {
        language: 'en',
        title: 'How to Learn JavaScript Efficiently',
        description: 'A comprehensive guide to mastering JavaScript from beginner to advanced level',
        body: 'Learning JavaScript can be overwhelming with so many resources available.',
        bodyFormat: 'text',
      },
    },
  },
  {
    slug: 'react-hooks-best-practices',
    language: 'en',
    title: 'React Hooks: Best Practices and Common Pitfalls',
    description: 'Essential patterns and anti-patterns when working with React Hooks',
    body: 'Hooks simplify component logic and state management when used with care.',
    bodyFormat: 'text',
    tagList: ['frontend', 'hooks', 'javascript', 'react'],
    createdAt: '2026-09-19T00:00:00.000Z',
    author: { username: 'janesmith', image: '' },
    content: {
      en: {
        language: 'en',
        title: 'React Hooks: Best Practices and Common Pitfalls',
        description: 'Essential patterns and anti-patterns when working with React Hooks',
        body: 'Hooks simplify component logic and state management when used with care.',
        bodyFormat: 'text',
      },
    },
  },
  {
    slug: 'building-scalable-apis-with-node-js',
    language: 'en',
    title: 'Building Scalable APIs with Node.js',
    description: 'Architectural patterns and best practices for creating robust backend services',
    body: 'Scalable APIs start with clean boundaries and reliable persistence.',
    bodyFormat: 'text',
    tagList: ['api', 'architecture', 'backend', 'nodejs'],
    createdAt: '2026-09-19T00:00:00.000Z',
    author: { username: 'mikewilson', image: '' },
    content: {
      en: {
        language: 'en',
        title: 'Building Scalable APIs with Node.js',
        description: 'Architectural patterns and best practices for creating robust backend services',
        body: 'Scalable APIs start with clean boundaries and reliable persistence.',
        bodyFormat: 'text',
      },
    },
  },
];
