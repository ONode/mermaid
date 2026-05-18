function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function sanitizeExportBaseName(name: string): string {
  const trimmed = name.trim().replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '');
  return trimmed || 'diagram';
}

export function findRenderedSvg(container: HTMLElement): SVGSVGElement | null {
  return container.querySelector('svg');
}

type SvgExportBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function parseSvgLength(value: string | null): number | null {
  if (!value || value.trim().endsWith('%')) {
    return null;
  }
  const n = Number.parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Intrinsic diagram bounds — not the on-screen viewport size. */
function getSvgExportBox(svg: SVGSVGElement): SvgExportBox {
  const viewBox = svg.viewBox?.baseVal;
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    return {
      x: viewBox.x,
      y: viewBox.y,
      width: viewBox.width,
      height: viewBox.height,
    };
  }

  const attrW = parseSvgLength(svg.getAttribute('width'));
  const attrH = parseSvgLength(svg.getAttribute('height'));
  if (attrW && attrH) {
    return { x: 0, y: 0, width: attrW, height: attrH };
  }

  try {
    const bbox = svg.getBBox();
    if (bbox.width > 0 && bbox.height > 0) {
      return { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
    }
  } catch {
    /* getBBox can fail on detached nodes */
  }

  const rect = svg.getBoundingClientRect();
  return {
    x: 0,
    y: 0,
    width: Math.max(1, rect.width),
    height: Math.max(1, rect.height),
  };
}

function prepareSvgCloneForExport(svg: SVGSVGElement): SVGSVGElement {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const box = getSvgExportBox(svg);
  const w = Math.max(1, Math.ceil(box.width));
  const h = Math.max(1, Math.ceil(box.height));

  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }
  if (!clone.getAttribute('xmlns:xlink')) {
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  }

  clone.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`);
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  clone.style.width = '';
  clone.style.height = '';
  clone.style.maxWidth = '';
  clone.style.maxHeight = '';

  return clone;
}

function serializeSvgElement(svg: SVGSVGElement): string {
  return new XMLSerializer().serializeToString(prepareSvgCloneForExport(svg));
}

export async function svgElementToCanvas(
  svg: SVGSVGElement,
  backgroundColor: string
): Promise<HTMLCanvasElement> {
  const box = getSvgExportBox(svg);
  const w = Math.max(1, Math.ceil(box.width));
  const h = Math.max(1, Math.ceil(box.height));
  const svgString = serializeSvgElement(svg);
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to rasterize diagram'));
    img.src = svgUrl;
  });

  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas is not supported');
  }

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

export function exportSvgFile(svg: SVGSVGElement, filename: string): void {
  const markup = `<?xml version="1.0" encoding="UTF-8"?>\n${serializeSvgElement(svg)}`;
  downloadBlob(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }), filename);
}

export async function exportPngFile(
  svg: SVGSVGElement,
  filename: string,
  backgroundColor: string
): Promise<void> {
  const canvas = await svgElementToCanvas(svg, backgroundColor);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png');
  });
  if (!blob) {
    throw new Error('Failed to encode PNG');
  }
  downloadBlob(blob, filename);
}

/** Minimal single-page PDF with one embedded JPEG image (no external deps). */
async function canvasToPdfBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const jpegBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
  });
  if (!jpegBlob) {
    throw new Error('Failed to encode image for PDF');
  }
  const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());

  const imgW = canvas.width;
  const imgH = canvas.height;
  const pageW = 595.28;
  const pageH = (imgH / imgW) * pageW;
  const drawW = pageW;
  const drawH = pageH;

  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let pos = 0;

  const pushStr = (s: string) => {
    const b = enc.encode(s);
    chunks.push(b);
    pos += b.length;
  };

  const pushBytes = (b: Uint8Array) => {
    chunks.push(b);
    pos += b.length;
  };

  pushStr('%PDF-1.4\n');

  offsets.push(pos);
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  offsets.push(pos);
  pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  offsets.push(pos);
  pushStr(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  offsets.push(pos);
  pushStr(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  pushBytes(jpegBytes);
  pushStr('\nendstream\nendobj\n');

  const content = `q\n${drawW} 0 0 ${drawH} 0 0 cm\n/Im0 Do\nQ\n`;
  offsets.push(pos);
  pushStr(`5 0 obj\n<< /Length ${enc.encode(content).length} >>\nstream\n${content}endstream\nendobj\n`);

  const xrefStart = pos;
  pushStr('xref\n');
  pushStr(`0 ${offsets.length + 1}\n`);
  pushStr('0000000000 65535 f \n');
  for (const off of offsets) {
    pushStr(`${String(off).padStart(10, '0')} 00000 n \n`);
  }

  pushStr('trailer\n');
  pushStr(`<< /Size ${offsets.length + 1} /Root 1 0 R >>\n`);
  pushStr('startxref\n');
  pushStr(`${xrefStart}\n`);
  pushStr('%%EOF\n');

  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return new Blob([out], { type: 'application/pdf' });
}

export async function exportPdfFile(
  svg: SVGSVGElement,
  filename: string,
  backgroundColor: string
): Promise<void> {
  const canvas = await svgElementToCanvas(svg, backgroundColor);
  const blob = await canvasToPdfBlob(canvas);
  downloadBlob(blob, filename);
}

export function exportMmdFile(source: string, filename: string): void {
  downloadBlob(new Blob([source], { type: 'text/plain;charset=utf-8' }), filename);
}

export async function copyMermaidSource(source: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(source);
  } catch {
    window.prompt('Copy Mermaid source:', source);
  }
}

export function previewExportBackground(): string {
  const style = getComputedStyle(document.documentElement);
  return style.getPropertyValue('--color-bg-primary').trim() || '#ffffff';
}
