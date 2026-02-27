import { PDFDocument, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { NOTO_SANS_SC_BASE64 } from './fontBase64';

class FontManager {
  private static instance: FontManager;
  private fontBytes: Uint8Array | null = null;

  private constructor() {}

  public static getInstance(): FontManager {
    if (!FontManager.instance) {
      FontManager.instance = new FontManager();
    }
    return FontManager.instance;
  }

  public async getFontBytes(): Promise<Uint8Array | null> {
    if (this.fontBytes) {
      return this.fontBytes;
    }

    try {
      // Convert Base64 to Uint8Array
      const binaryString = atob(NOTO_SANS_SC_BASE64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      this.fontBytes = bytes;
      return bytes;
    } catch (err) {
      console.error('Error decoding Base64 font:', err);
      return null;
    }
  }

  public async embedFont(pdfDoc: PDFDocument) {
    pdfDoc.registerFontkit(fontkit);
    const bytes = await this.getFontBytes();
    
    if (bytes) {
      try {
        return await pdfDoc.embedFont(bytes);
      } catch (err) {
        console.error('Failed to embed custom font, falling back to Helvetica', err);
      }
    }
    
    // Fallback
    console.warn('Using fallback font (Helvetica). Chinese characters will not display correctly.');
    return await pdfDoc.embedFont(StandardFonts.Helvetica);
  }
}

export default FontManager.getInstance();
