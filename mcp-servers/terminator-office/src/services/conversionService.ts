import { promises as fs } from 'fs';
import * as path from 'path';
import { WordService } from './wordService.js';
import { ExcelService } from './excelService.js';
import { PowerPointService } from './powerpointService.js';
import { PdfService } from './pdfService.js';

export class ConversionService {
  private wordService: WordService;
  private excelService: ExcelService;
  private powerpointService: PowerPointService;
  private pdfService: PdfService;

  constructor() {
    this.wordService = new WordService();
    this.excelService = new ExcelService();
    this.powerpointService = new PowerPointService();
    this.pdfService = new PdfService();
  }

  async convertDocument(inputPath: string, outputPath: string, targetFormat: string) {
    try {
      const ext = path.extname(inputPath).toLowerCase();
      const targetExt = targetFormat.startsWith('.') ? targetFormat : `.${targetFormat}`;
      
      // Validate input file exists
      await fs.access(inputPath);
      
      let result;
      
      // Convert based on input format
      switch (ext) {
        case '.docx':
          result = await this.convertFromWord(inputPath, outputPath, targetExt);
          break;
        case '.xlsx':
          result = await this.convertFromExcel(inputPath, outputPath, targetExt);
          break;
        case '.pptx':
          result = await this.convertFromPowerPoint(inputPath, outputPath, targetExt);
          break;
        case '.pdf':
          result = await this.convertFromPdf(inputPath, outputPath, targetExt);
          break;
        case '.md':
          result = await this.convertFromMarkdown(inputPath, outputPath, targetExt);
          break;
        default:
          throw new Error(`Unsupported input format: ${ext}`);
      }
      
      return {
        success: true,
        inputPath,
        outputPath,
        inputFormat: ext,
        outputFormat: targetExt,
        result
      };
    } catch (error) {
      throw new Error(`Failed to convert document: ${error}`);
    }
  }

  private async convertFromWord(inputPath: string, outputPath: string, targetFormat: string) {
    const wordContent = await this.wordService.readDocument(inputPath);
    
    switch (targetFormat) {
      case '.pdf':
        return await this.pdfService.createPdf(outputPath, wordContent.text);
      case '.md':
        await fs.writeFile(outputPath, wordContent.text);
        return { wordCount: wordContent.text.split(/\s+/).length };
      case '.txt':
        await fs.writeFile(outputPath, wordContent.text);
        return { wordCount: wordContent.text.split(/\s+/).length };
      default:
        throw new Error(`Cannot convert Word to ${targetFormat}`);
    }
  }

  private async convertFromExcel(inputPath: string, outputPath: string, targetFormat: string) {
    const excelContent = await this.excelService.readWorkbook(inputPath);
    
    switch (targetFormat) {
      case '.csv':
        if (excelContent.worksheets.length > 0) {
          const firstSheet = excelContent.worksheets[0];
          const csvContent = firstSheet.data.map((row: any) => 
            Array.isArray(row) ? row.join(',') : String(row)
          ).join('\n');
          await fs.writeFile(outputPath, csvContent);
          return { rows: firstSheet.data.length };
        }
        break;
      case '.md':
        const mdContent = excelContent.worksheets.map((sheet: any) => 
          `## ${sheet.name}\n\n${sheet.data.map((row: any) => 
            Array.isArray(row) ? row.join('\t') : String(row)
          ).join('\n')}`
        ).join('\n\n');
        await fs.writeFile(outputPath, mdContent);
        return { sheets: excelContent.worksheets.length };
      case '.txt':
        const txtContent = excelContent.worksheets.map((sheet: any) => 
          sheet.data.map((row: any) => 
            Array.isArray(row) ? row.join('\t') : String(row)
          ).join('\n')
        ).join('\n\n---\n\n');
        await fs.writeFile(outputPath, txtContent);
        return { sheets: excelContent.worksheets.length };
      default:
        throw new Error(`Cannot convert Excel to ${targetFormat}`);
    }
    
    throw new Error('No worksheets found in Excel file');
  }

  private async convertFromPowerPoint(inputPath: string, outputPath: string, targetFormat: string) {
    const pptContent = await this.powerpointService.readPresentation(inputPath);
    
    switch (targetFormat) {
      case '.md':
        const mdContent = pptContent.slides.map((slide: any, index: number) => 
          `## Slide ${index + 1}\n\n${slide.title || ''}\n\n${slide.content || ''}`
        ).join('\n\n---\n\n');
        await fs.writeFile(outputPath, mdContent);
        return { slides: pptContent.slides.length };
      case '.txt':
        const txtContent = pptContent.slides.map((slide: any, index: number) => 
          `Slide ${index + 1}:\n${slide.title || ''}\n${slide.content || ''}`
        ).join('\n\n---\n\n');
        await fs.writeFile(outputPath, txtContent);
        return { slides: pptContent.slides.length };
      default:
        throw new Error(`Cannot convert PowerPoint to ${targetFormat}`);
    }
  }

  private async convertFromPdf(inputPath: string, outputPath: string, targetFormat: string) {
    const pdfContent = await this.pdfService.readPdf(inputPath);
    
    switch (targetFormat) {
      case '.md':
        await fs.writeFile(outputPath, pdfContent.text);
        return { pages: pdfContent.pages, wordCount: pdfContent.text.split(/\s+/).length };
      case '.txt':
        await fs.writeFile(outputPath, pdfContent.text);
        return { pages: pdfContent.pages, wordCount: pdfContent.text.split(/\s+/).length };
      case '.docx':
        return await this.wordService.createDocument(outputPath, pdfContent.text);
      default:
        throw new Error(`Cannot convert PDF to ${targetFormat}`);
    }
  }

  private async convertFromMarkdown(inputPath: string, outputPath: string, targetFormat: string) {
    const mdContent = await fs.readFile(inputPath, 'utf8');
    
    switch (targetFormat) {
      case '.docx':
        return await this.wordService.createDocument(outputPath, mdContent);
      case '.pdf':
        return await this.pdfService.createPdf(outputPath, mdContent);
      case '.pptx':
        return await this.powerpointService.createPresentation(outputPath, mdContent);
      case '.xlsx':
        return await this.excelService.createWorkbook(outputPath, mdContent);
      case '.html':
        const htmlContent = this.markdownToHtml(mdContent);
        await fs.writeFile(outputPath, htmlContent);
        return { wordCount: mdContent.split(/\s+/).length };
      default:
        throw new Error(`Cannot convert Markdown to ${targetFormat}`);
    }
  }

  private markdownToHtml(markdown: string): string {
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/!\[([^\]]*)\]\(([^)]*)\)/gim, '<img alt="$1" src="$2" />')
      .replace(/\[([^\]]*)\]\(([^)]*)\)/gim, '<a href="$2">$1</a>')
      .replace(/\n$/gim, '<br />')
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/^(.*)$/gim, '<p>$1</p>');
  }

  async batchConvert(conversions: Array<{inputPath: string, outputPath: string, targetFormat: string}>) {
    const results = [];
    
    for (const conversion of conversions) {
      try {
        const result = await this.convertDocument(
          conversion.inputPath, 
          conversion.outputPath, 
          conversion.targetFormat
        );
        results.push({ success: true, conversionResult: result });
      } catch (error) {
        results.push({ 
          success: false, 
          inputPath: conversion.inputPath,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return {
      total: conversions.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }
}
