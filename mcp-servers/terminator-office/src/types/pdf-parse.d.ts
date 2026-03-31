declare module 'pdf-parse' {
  export interface PDFOptions {
    // Add any options if needed
  }

  export interface PDFData {
    text: string;
    info: any;
    metadata: any;
    numpages: number;
    numrender: number;
    version: string;
  }

  function pdfParse(dataBuffer: Buffer, options?: PDFOptions): Promise<PDFData>;
  export = pdfParse;
}
