import { promises as fs } from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import pdfParse from 'pdf-parse';

export interface PdfReadOptions {
  preserveFormatting?: boolean;
}

export interface PdfCreateOptions {
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
  };
  options?: {
    pageSize?: string;
    margins?: any;
    layout?: string;
  };
}

export class PdfService {
  async readPdf(filePath: string, options: PdfReadOptions = {}) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const data = await pdfParse(fileBuffer);
      
      return {
        text: data.text,
        pages: data.numpages,
        metadata: data.info,
        content: options.preserveFormatting ? data.text : this.stripFormatting(data.text)
      };
    } catch (error) {
      throw new Error(`Failed to read PDF: ${error}`);
    }
  }

  async createPdf(outputPath: string, content: string, metadata?: PdfCreateOptions['metadata'], options?: PdfCreateOptions['options']) {
    try {
      const doc = new PDFDocument(options || {});
      
      // Set metadata
      if (metadata) {
        if (metadata.title) doc.info.Title = metadata.title;
        if (metadata.author) doc.info.Author = metadata.author;
        if (metadata.subject) doc.info.Subject = metadata.subject;
        if (metadata.keywords) doc.info.Keywords = metadata.keywords;
      }

      // Add content
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          // Check for headings
          if (line.startsWith('#')) {
            const level = line.match(/^#+/)?.[0].length || 1;
            const text = line.replace(/^#+\s*/, '');
            const fontSize = Math.max(8, 24 - (level - 1) * 4);
            
            doc.fontSize(fontSize).font('Helvetica-Bold').text(text, { align: 'left' });
          } else {
            doc.fontSize(12).font('Helvetica').text(line, { align: 'left' });
          }
        }
        doc.moveDown(0.5);
      }

      doc.end();

      // Write to file
      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      
      return new Promise((resolve, reject) => {
        doc.on('end', async () => {
          try {
            const pdfBuffer = Buffer.concat(buffers);
            await fs.writeFile(outputPath, pdfBuffer);
            resolve({
              success: true,
              outputPath,
              pageCount: doc.bufferedPageRange().count,
              wordCount: this.countWords(content)
            });
          } catch (error) {
            reject(error);
          }
        });
        
        doc.on('error', reject);
      });
    } catch (error) {
      throw new Error(`Failed to create PDF: ${error}`);
    }
  }

  async extractText(filePath: string, pages?: number[], preserveFormatting?: boolean) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const data = await pdfParse(fileBuffer);
      
      let text = data.text;
      
      if (pages && pages.length > 0) {
        // Extract specific pages (simplified - actual implementation would be more complex)
        const pageTexts = text.split('\f'); // Form feed character separates pages
        text = pages
          .filter(pageNum => pageNum <= pageTexts.length)
          .map(pageNum => pageTexts[pageNum - 1])
          .join('\n\n--- Page ' + pages.join(', ') + ' ---\n\n');
      }
      
      return {
        text: preserveFormatting ? text : this.stripFormatting(text),
        totalPages: data.numpages,
        extractedPages: pages || Array.from({ length: data.numpages }, (_, i) => i + 1)
      };
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error}`);
    }
  }

  async analyzePdf(filePath: string, analysisType: string = 'full') {
    try {
      const content = await this.readPdf(filePath);
      const stats = await fs.stat(filePath);
      
      const analysis: any = {
        filePath,
        fileSize: stats.size,
        lastModified: stats.mtime,
        pageCount: content.pages,
        wordCount: this.countWords(content.text),
        characterCount: content.text.length
      };

      if (analysisType === 'structure' || analysisType === 'full') {
        analysis.structure = {
          pageCount: content.pages,
          hasHeadings: /#+\s+/.test(content.text),
          hasTables: /\|.*\|/.test(content.text),
          lineCount: content.text.split('\n').length
        };
      }

      if (analysisType === 'metadata' || analysisType === 'full') {
        analysis.metadata = content.metadata;
      }

      return analysis;
    } catch (error) {
      throw new Error(`Failed to analyze PDF: ${error}`);
    }
  }

  async extractContent(filePath: string, extractType: string, outputPath?: string) {
    try {
      const content = await this.readPdf(filePath);
      let extracted: any = {};

      switch (extractType) {
        case 'text':
          extracted = { text: content.text };
          break;
        case 'metadata':
          extracted = { metadata: content.metadata };
          break;
        default:
          throw new Error(`Unsupported extract type: ${extractType}`);
      }

      if (outputPath) {
        await fs.writeFile(outputPath, JSON.stringify(extracted, null, 2));
      }

      return extracted;
    } catch (error) {
      throw new Error(`Failed to extract content from PDF: ${error}`);
    }
  }

  private stripFormatting(text: string): string {
    return text
      .replace(/#+\s+/g, '') // Remove markdown headings
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .trim();
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
}
