import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Configure PDF.js worker
// Using a CDN is a reliable way to ensure the worker is loaded correctly without complex build config
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export const renderPdfPage = async (file: File, pageNumber: number = 1): Promise<{ image: string; width: number; height: number }> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(pageNumber);

  const viewport = page.getViewport({ scale: 1.5 }); // Render at higher scale for better quality
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not get canvas context');
  }

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  await page.render({
    canvasContext: context,
    viewport: viewport,
  } as any).promise;

  return {
    image: canvas.toDataURL('image/png'),
    width: viewport.width,
    height: viewport.height,
  };
};

export const embedSignature = async (
  pdfFile: File,
  signatureBase64: string,
  pageNumber: number,
  x: number,
  y: number,
  width: number,
  height: number,
  pdfWidth: number,
  pdfHeight: number
): Promise<Uint8Array> => {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  
  const pngImage = await pdfDoc.embedPng(signatureBase64);
  const pages = pdfDoc.getPages();
  const page = pages[pageNumber - 1];
  
  const { width: actualPdfWidth, height: actualPdfHeight } = page.getSize();

  // Coordinate conversion
  // Web: Origin top-left, Y down
  // PDF: Origin bottom-left, Y up
  
  // Calculate scale factors between the rendered image (UI) and the actual PDF page
  const scaleX = actualPdfWidth / pdfWidth;
  const scaleY = actualPdfHeight / pdfHeight;

  // Calculate final coordinates
  const finalX = x * scaleX;
  // In PDF, Y starts from bottom. So we take total height - (y position from top + height of element)
  // We also need to account for the height of the signature itself
  const finalY = actualPdfHeight - (y * scaleY) - (height * scaleY);
  
  const finalWidth = width * scaleX;
  const finalHeight = height * scaleY;

  page.drawImage(pngImage, {
    x: finalX,
    y: finalY,
    width: finalWidth,
    height: finalHeight,
  });

  return await pdfDoc.save();
};
