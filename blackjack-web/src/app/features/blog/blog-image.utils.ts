import { BlogBodyFormat } from './blog.models';

export type BlogImagePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export const blogImagePositions: BlogImagePosition[] = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
];

export function insertBlogImage(
  body: string,
  bodyFormat: BlogBodyFormat,
  imageUrl: string,
  position: BlogImagePosition,
): { body: string; bodyFormat: 'html' } {
  const html = bodyFormat === 'html' ? body : textToHtml(body);
  const figure = buildFigure(imageUrl, position);
  const content = `<div class="blog-content">${html}</div>`;
  const layout = isTopPosition(position) ? `${figure}${content}` : `${content}${figure}`;
  return { body: wrapLayout(layout, position), bodyFormat: 'html' };
}

function wrapLayout(content: string, position: BlogImagePosition): string {
  return `<div class="blog-layout blog-layout--${position}">${content}</div>`;
}

function buildFigure(imageUrl: string, position: BlogImagePosition): string {
  return `
    <figure class="blog-image blog-image--${position}">
      <img src="${escapeHtml(imageUrl)}" alt="blog image" />
    </figure>
  `.trim();
}

function textToHtml(text: string): string {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`);
  return paragraphs.length ? paragraphs.join('') : '<p></p>';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isTopPosition(position: BlogImagePosition): boolean {
  return position === 'top-left' || position === 'top-right';
}