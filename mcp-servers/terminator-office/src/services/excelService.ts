import { promises as fs } from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

export interface ExcelReadOptions {
  extractTables?: boolean;
  includeFormatting?: boolean;
}

export interface ExcelCreateOptions {
  template?: string;
}

export class ExcelService {
  async readWorkbook(filePath: string, options: ExcelReadOptions = {}) {
    try {
      const workbook = XLSX.readFile(filePath);
      const result: any = {
        worksheets: [],
        metadata: await this.extractMetadata(filePath)
      };

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const sheetInfo: any = {
          name: sheetName,
          data: data,
          rowCount: data.length,
          columnCount: data.length > 0 ? (data[0] as any[]).length : 0
        };

        if (options.includeFormatting) {
          sheetInfo.formatting = this.extractFormatting(worksheet);
        }

        result.worksheets.push(sheetInfo);
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to read Excel workbook: ${error}`);
    }
  }

  async createWorkbook(outputPath: string, content: string, template?: string) {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Parse content as table data
      const data = this.parseTableContent(content);
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, outputPath);

      return {
        success: true,
        outputPath,
        sheetCount: 1,
        rowCount: data.length,
        columnCount: data.length > 0 ? data[0].length : 0
      };
    } catch (error) {
      throw new Error(`Failed to create Excel workbook: ${error}`);
    }
  }

  async setCells(filePath: string, worksheetName?: string, cells: any = {}, formatting?: any) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = worksheetName || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        throw new Error(`Worksheet '${sheetName}' not found`);
      }

      // Set cell values
      for (const [cellRef, value] of Object.entries(cells)) {
        worksheet[cellRef] = { v: value };
      }

      XLSX.writeFile(workbook, filePath);

      return {
        success: true,
        cellsUpdated: Object.keys(cells).length,
        worksheet: sheetName
      };
    } catch (error) {
      throw new Error(`Failed to set Excel cells: ${error}`);
    }
  }

  async getData(filePath: string, worksheetName?: string, range?: string, includeFormatting: boolean = false) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = worksheetName || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        throw new Error(`Worksheet '${sheetName}' not found`);
      }

      let data;
      if (range) {
        data = XLSX.utils.sheet_to_json(worksheet, { range: range });
      } else {
        data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      }

      const result: any = {
        worksheet: sheetName,
        data: data,
        range: range || 'all'
      };

      if (includeFormatting) {
        result.formatting = this.extractFormatting(worksheet);
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to get Excel data: ${error}`);
    }
  }

  async addFormula(filePath: string, cell: string, formula: string, worksheetName?: string) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = worksheetName || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        throw new Error(`Worksheet '${sheetName}' not found`);
      }

      // Add formula (must start with =)
      const formulaValue = formula.startsWith('=') ? formula : `=${formula}`;
      worksheet[cell] = { f: formulaValue };

      XLSX.writeFile(workbook, filePath);

      return {
        success: true,
        worksheet: sheetName,
        cell: cell,
        formula: formulaValue
      };
    } catch (error) {
      throw new Error(`Failed to add Excel formula: ${error}`);
    }
  }

  async analyzeWorkbook(filePath: string, analysisType: string = 'full') {
    try {
      const content = await this.readWorkbook(filePath);
      const stats = await fs.stat(filePath);
      
      const analysis: any = {
        filePath,
        fileSize: stats.size,
        lastModified: stats.mtime,
        sheetCount: content.worksheets.length,
        totalRows: 0,
        totalColumns: 0
      };

      for (const sheet of content.worksheets) {
        analysis.totalRows += sheet.rowCount;
        if (sheet.columnCount > analysis.totalColumns) {
          analysis.totalColumns = sheet.columnCount;
        }
      }

      if (analysisType === 'structure' || analysisType === 'full') {
        analysis.structure = {
          worksheets: content.worksheets.map((sheet: any) => ({
            name: sheet.name,
            rowCount: sheet.rowCount,
            columnCount: sheet.columnCount
          }))
        };
      }

      if (analysisType === 'metadata' || analysisType === 'full') {
        analysis.metadata = content.metadata;
      }

      return analysis;
    } catch (error) {
      throw new Error(`Failed to analyze Excel workbook: ${error}`);
    }
  }

  async extractContent(filePath: string, extractType: string, outputPath?: string) {
    try {
      const content = await this.readWorkbook(filePath);
      let extracted: any = {};

      switch (extractType) {
        case 'text':
          extracted = { 
            text: content.worksheets.map((sheet: any) => 
              `Sheet: ${sheet.name}\n${sheet.data.map((row: any) => row.join('\t')).join('\n')}`
            ).join('\n\n')
          };
          break;
        case 'tables':
          extracted = { 
            tables: content.worksheets.map((sheet: any) => ({
              sheetName: sheet.name,
              data: sheet.data
            }))
          };
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
      throw new Error(`Failed to extract content from Excel workbook: ${error}`);
    }
  }

  private parseTableContent(content: string): any[][] {
    const lines = content.trim().split('\n');
    const data: any[][] = [];

    for (const line of lines) {
      if (line.trim()) {
        // Split by tabs or commas
        const row = line.includes('\t') ? 
          line.split('\t') : 
          line.split(',').map((cell: string) => cell.trim());
        data.push(row);
      }
    }

    return data;
  }

  private extractFormatting(worksheet: XLSX.WorkSheet): any {
    const formatting: any = {};
    
    for (const cellRef in worksheet) {
      if (cellRef[0] === '!') continue; // Skip special keys
      
      const cell = worksheet[cellRef];
      if (cell && cell.s) {
        formatting[cellRef] = cell.s;
      }
    }

    return formatting;
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
