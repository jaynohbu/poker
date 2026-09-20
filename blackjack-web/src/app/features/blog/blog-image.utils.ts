import { BlogBodyFormat } from './blog.models';

export type BlogImagePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export const blogImagePositions: BlogImagePosition[] = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
];

const INLINE_IMAGE_STYLE = 'max-width:min(15%,120px);width:min(15%,120px);height:auto;display:block;object-fit:contain;border-radius:14px;cursor:zoom-in;';
const INLINE_FIGURE_STYLE = 'box-sizing:border-box;width:15%;max-width:15%;min-width:96px;margin:0 0 1rem 0;overflow:hidden;';

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
    <figure class="blog-image blog-image--${position}" style="${INLINE_FIGURE_STYLE}">
      <img src="${escapeHtml(imageUrl)}" alt="blog image" style="${INLINE_IMAGE_STYLE}" />
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