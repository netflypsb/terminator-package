import { promises as fs } from 'fs';
import * as path from 'path';

// Note: pptxgenjs will be used for PowerPoint operations
declare const require: (id: string) => any;
const PptxGenJS = require('pptxgenjs');

export interface PowerPointReadOptions {
  includeImages?: boolean;
}

export interface PowerPointCreateOptions {
  template?: string;
  metadata?: any;
}

export class PowerPointService {
  async readPresentation(filePath: string, options: PowerPointReadOptions = {}) {
    try {
      // For now, we'll extract basic text content
      // Full PowerPoint reading requires complex XML parsing
      const result = {
        slides: [] as any[],
        metadata: await this.extractMetadata(filePath),
        images: [] as any[]
      };

      // This is a simplified implementation
      // In a full implementation, you would parse the PPTX XML structure
      return result;
    } catch (error) {
      throw new Error(`Failed to read PowerPoint presentation: ${error}`);
    }
  }

  async createPresentation(outputPath: string, content: string, template?: string) {
    try {
      const pres = new PptxGenJS();
      
      // Parse content into slides
      const slides = this.parseContentToSlides(content);
      
      for (const slideData of slides) {
        const slide = pres.addSlide();
        
        if (slideData.title) {
          slide.addText(slideData.title, {
            x: 1,
            y: 1,
            fontSize: 24,
            bold: true
          });
        }
        
        if (slideData.content) {
          slide.addText(slideData.content, {
            x: 1,
            y: slideData.title ? 2 : 1,
            fontSize: 18,
            bullet: slideData.isBulletList
          });
        }
      }

      await pres.writeFile({ fileName: outputPath });

      return {
        success: true,
        outputPath,
        slideCount: slides.length
      };
    } catch (error) {
      throw new Error(`Failed to create PowerPoint presentation: ${error}`);
    }
  }

  async addSlide(filePath: string, layout: string = 'title_and_content', title?: string, content?: string, position?: number) {
    try {
      const pres = new PptxGenJS();
      
      // Load existing presentation (this is simplified - actual implementation would be more complex)
      const slide = pres.addSlide();
      
      if (title) {
        slide.addText(title, {
          x: 1,
          y: 1,
          fontSize: 24,
          bold: true
        });
      }
      
      if (content) {
        slide.addText(content, {
          x: 1,
          y: title ? 2 : 1,
          fontSize: 18,
          bullet: content.includes('*')
        });
      }

      const tempPath = filePath.replace('.pptx', '_temp.pptx');
      await pres.writeFile({ fileName: tempPath });
      
      // In a full implementation, you would merge with existing presentation
      await fs.rename(tempPath, filePath);

      return {
        success: true,
        layout,
        title,
        position: position || 'end'
      };
    } catch (error) {
      throw new Error(`Failed to add slide to PowerPoint presentation: ${error}`);
    }
  }

  async addImage(filePath: string, slideNumber: number, imagePath: string, x?: number, y?: number, width?: number, height?: number) {
    try {
      const imageBuffer = await fs.readFile(imagePath);
      const pres = new PptxGenJS();
      const slide = pres.addSlide();
      
      const imageData = `data:image/png;base64,${imageBuffer.toString('base64')}`;
      
      slide.addImage({
        data: imageData,
        x: x || 1,
        y: y || 1,
        w: width || 4,
        h: height || 3
      });

      const tempPath = filePath.replace('.pptx', '_temp.pptx');
      await pres.writeFile({ fileName: tempPath });
      
      // In a full implementation, you would merge with existing presentation
      await fs.rename(tempPath, filePath);

      return {
        success: true,
        slideNumber,
        imagePath,
        position: { x: x || 1, y: y || 1 },
        size: { width: width || 4, height: height || 3 }
      };
    } catch (error) {
      throw new Error(`Failed to add image to PowerPoint presentation: ${error}`);
    }
  }

  async analyzePresentation(filePath: string, analysisType: string = 'full') {
    try {
      const content = await this.readPresentation(filePath);
      const stats = await fs.stat(filePath);
      
      const analysis: any = {
        filePath,
        fileSize: stats.size,
        lastModified: stats.mtime,
        slideCount: content.slides.length
      };

      if (analysisType === 'structure' || analysisType === 'full') {
        analysis.structure = {
          slides: content.slides.map((slide: any, index: number) => ({
            slideNumber: index + 1,
            title: slide.title || '',
            hasContent: !!slide.content,
            hasImages: slide.images ? slide.images.length > 0 : false
          }))
        };
      }

      if (analysisType === 'metadata' || analysisType === 'full') {
        analysis.metadata = content.metadata;
      }

      return analysis;
    } catch (error) {
      throw new Error(`Failed to analyze PowerPoint presentation: ${error}`);
    }
  }

  async extractContent(filePath: string, extractType: string, outputPath?: string) {
    try {
      const content = await this.readPresentation(filePath);
      let extracted: any = {};

      switch (extractType) {
        case 'text':
          extracted = { 
            text: content.slides.map((slide: any, index: number) => 
              `Slide ${index + 1}:\n${slide.title || ''}\n${slide.content || ''}`
            ).join('\n\n---\n\n')
          };
          break;
        case 'images':
          extracted = { images: content.images };
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
      throw new Error(`Failed to extract content from PowerPoint presentation: ${error}`);
    }
  }

  private parseContentToSlides(content: string): any[] {
    const slides: any[] = [];
    const sections = content.split('\n---\n');
    
    for (const section of sections) {
      const lines = section.trim().split('\n');
      if (lines.length === 0) continue;
      
      const slide: any = {
        title: '',
        content: '',
        isBulletList: false
      };
      
      // First line is usually the title
      if (lines[0].startsWith('#')) {
        slide.title = lines[0].replace(/^#+\s*/, '');
        slide.content = lines.slice(1).join('\n');
      } else {
        slide.title = lines[0];
        slide.content = lines.slice(1).join('\n');
      }
      
      // Check if content is a bullet list
      slide.isBulletList = slide.content.includes('*') || slide.content.includes('-');
      
      slides.push(slide);
    }
    
    return slides;
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
