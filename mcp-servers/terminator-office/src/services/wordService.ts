import { promises as fs } from 'fs';
import * as path from 'path';
import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType } from 'docx';
import * as mammoth from 'mammoth';

export interface WordReadOptions {
  includeImages?: boolean;
  extractTables?: boolean;
}

export interface WordCreateOptions {
  template?: string;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
  };
}

export class WordService {
  async readDocument(filePath: string, options: WordReadOptions = {}) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      
      // Use mammoth to extract content
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      const htmlResult = await mammoth.convertToHtml({ buffer: fileBuffer });
      
      const content = {
        text: result.value,
        html: htmlResult.value,
        images: [] as any[],
        tables: [] as any[],
        metadata: await this.extractMetadata(filePath)
      };

      if (options.includeImages) {
        // Extract images if needed
        // Note: extractImages is not available in current mammoth version
        // This is a placeholder implementation
        content.images = [];
      }

      return content;
    } catch (error) {
      throw new Error(`Failed to read Word document: ${error}`);
    }
  }

  async createDocument(outputPath: string, content: string, template?: string, metadata?: WordCreateOptions['metadata']) {
    try {
      // Parse markdown-style content
      const paragraphs = this.parseContent(content);
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs
        }]
      });

      const buffer = await Packer.toBuffer(doc);
      await fs.writeFile(outputPath, buffer);

      return {
        success: true,
        outputPath,
        wordCount: this.countWords(content),
        paragraphCount: paragraphs.length
      };
    } catch (error) {
      throw new Error(`Failed to create Word document: ${error}`);
    }
  }

  async addContent(filePath: string, content: string, position: string = 'end', reference?: string) {
    try {
      const existingContent = await this.readDocument(filePath);
      const newParagraphs = this.parseContent(content);
      
      let combinedContent = existingContent.text;
      
      switch (position) {
        case 'beginning':
          combinedContent = content + '\n\n' + existingContent.text;
          break;
        case 'end':
          combinedContent = existingContent.text + '\n\n' + content;
          break;
        case 'after':
          if (reference) {
            const refIndex = existingContent.text.indexOf(reference);
            if (refIndex !== -1) {
              const before = existingContent.text.substring(0, refIndex + reference.length);
              const after = existingContent.text.substring(refIndex + reference.length);
              combinedContent = before + '\n\n' + content + '\n\n' + after;
            } else {
              combinedContent = existingContent.text + '\n\n' + content;
            }
          } else {
            combinedContent = existingContent.text + '\n\n' + content;
          }
          break;
      }

      return await this.createDocument(filePath, combinedContent);
    } catch (error) {
      throw new Error(`Failed to add content to Word document: ${error}`);
    }
  }

  async addImage(filePath: string, imagePath: string, altText?: string, width?: number, height?: number) {
    try {
      const imageBuffer = await fs.readFile(imagePath);
      const imageExt = path.extname(imagePath).toLowerCase();
      
      // For now, add a placeholder - full image embedding requires more complex docx manipulation
      const imageContent = `[IMAGE: ${altText || path.basename(imagePath)}]`;
      
      return await this.addContent(filePath, imageContent, 'end');
    } catch (error) {
      throw new Error(`Failed to add image to Word document: ${error}`);
    }
  }

  async analyzeDocument(filePath: string, analysisType: string = 'full') {
    try {
      const content = await this.readDocument(filePath);
      const stats = await fs.stat(filePath);
      
      const analysis: any = {
        filePath,
        fileSize: stats.size,
        lastModified: stats.mtime,
        wordCount: this.countWords(content.text),
        characterCount: content.text.length,
        paragraphCount: content.text.split('\n\n').length
      };

      if (analysisType === 'structure' || analysisType === 'full') {
        analysis.structure = {
          headings: this.extractHeadings(content.text),
          paragraphs: content.text.split('\n\n').length,
          images: content.images.length,
          tables: content.tables.length
        };
      }

      if (analysisType === 'metadata' || analysisType === 'full') {
        analysis.metadata = content.metadata;
      }

      return analysis;
    } catch (error) {
      throw new Error(`Failed to analyze Word document: ${error}`);
    }
  }

  async extractContent(filePath: string, extractType: string, outputPath?: string) {
    try {
      const content = await this.readDocument(filePath);
      let extracted: any = {};

      switch (extractType) {
        case 'text':
          extracted = { text: content.text };
          break;
        case 'images':
          extracted = { images: content.images };
          break;
        case 'metadata':
          extracted = { metadata: content.metadata };
          break;
        case 'tables':
          extracted = { tables: content.tables };
          break;
        default:
          throw new Error(`Unsupported extract type: ${extractType}`);
      }

      if (outputPath) {
        await fs.writeFile(outputPath, JSON.stringify(extracted, null, 2));
      }

      return extracted;
    } catch (error) {
      throw new Error(`Failed to extract content from Word document: ${error}`);
    }
  }

  private parseContent(content: string): Paragraph[] {
    const lines = content.split('\n');
    const paragraphs: Paragraph[] = [];

    for (const line of lines) {
      if (line.trim() === '') continue;

      // Check for headings (# ## ###)
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text, bold: true })],
          heading: this.mapHeadingLevel(level),
          alignment: AlignmentType.LEFT
        }));
      } else {
        // Regular paragraph
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: line })],
          alignment: AlignmentType.LEFT
        }));
      }
    }

    return paragraphs;
  }

  private mapHeadingLevel(level: number): any {
    switch (level) {
      case 1: return HeadingLevel.HEADING_1;
      case 2: return HeadingLevel.HEADING_2;
      case 3: return HeadingLevel.HEADING_3;
      case 4: return HeadingLevel.HEADING_4;
      case 5: return HeadingLevel.HEADING_5;
      case 6: return HeadingLevel.HEADING_6;
      default: return HeadingLevel.HEADING_1;
    }
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private extractHeadings(text: string): string[] {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings: string[] = [];
    let match;

    while ((match = headingRegex.exec(text)) !== null) {
      headings.push(match[2]);
    }

    return headings;
  }

  private async extractMetadata(filePath: string): Promise<any> {
    try {
      const stats = await fs.stat(filePath);
      return {
        fileName: path.basename(filePath),
        filePath: filePath,
        fileSize: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime
      };
    } catch (error) {
      return {};
    }
  }
}
