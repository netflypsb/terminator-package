declare module 'pdfkit' {
  class PDFDocument {
    constructor(options?: any);
    info: any;
    
    fontSize(size: number): PDFDocument;
    font(font: string): PDFDocument;
    text(text: string, options?: any): PDFDocument;
    moveDown(lines?: number): PDFDocument;
    addPage(): PDFDocument;
    end(): void;
    bufferedPageRange(): { count: number };
    
    on(event: string, callback: Function): void;
  }
  
  export default PDFDocument;
}
