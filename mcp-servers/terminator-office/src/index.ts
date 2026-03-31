#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { WordService } from './services/wordService.js';
import { ExcelService } from './services/excelService.js';
import { PowerPointService } from './services/powerpointService.js';
import { PdfService } from './services/pdfService.js';
import { ConversionService } from './services/conversionService.js';

class OfficeMCPServer {
  private server: Server;
  private wordService: WordService;
  private excelService: ExcelService;
  private powerpointService: PowerPointService;
  private pdfService: PdfService;
  private conversionService: ConversionService;

  constructor() {
    this.server = new Server(
      {
        name: 'terminator-office',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.wordService = new WordService();
    this.excelService = new ExcelService();
    this.powerpointService = new PowerPointService();
    this.pdfService = new PdfService();
    this.conversionService = new ConversionService();

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Core Office Tools (format-agnostic)
          {
            name: 'office_read',
            description: 'Read content from any office document (Word, Excel, PowerPoint, PDF)',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Absolute path to the document file'
                },
                includeImages: {
                  type: 'boolean',
                  description: 'Include images in the output (default: true)',
                  default: true
                },
                extractTables: {
                  type: 'boolean',
                  description: 'Extract table data separately (default: true)',
                  default: true
                }
              },
              required: ['filePath']
            }
          },
          {
            name: 'office_create',
            description: 'Create a new document in any supported format',
            inputSchema: {
              type: 'object',
              properties: {
                format: {
                  type: 'string',
                  enum: ['docx', 'xlsx', 'pptx', 'pdf'],
                  description: 'Document format to create'
                },
                outputPath: {
                  type: 'string',
                  description: 'Absolute path where to save the document'
                },
                content: {
                  type: 'string',
                  description: 'Content for the document (Markdown format supported)'
                },
                template: {
                  type: 'string',
                  description: 'Template to use (optional)'
                },
                metadata: {
                  type: 'object',
                  description: 'Document metadata (title, author, etc.)'
                }
              },
              required: ['format', 'outputPath']
            }
          },
          {
            name: 'office_convert',
            description: 'Convert between document formats',
            inputSchema: {
              type: 'object',
              properties: {
                inputPath: {
                  type: 'string',
                  description: 'Absolute path to source document'
                },
                outputPath: {
                  type: 'string',
                  description: 'Absolute path for converted document'
                },
                targetFormat: {
                  type: 'string',
                  enum: ['docx', 'xlsx', 'pptx', 'pdf', 'md'],
                  description: 'Target format'
                }
              },
              required: ['inputPath', 'outputPath', 'targetFormat']
            }
          },
          {
            name: 'office_analyze',
            description: 'Analyze document structure, metadata, and statistics',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Absolute path to the document file'
                },
                analysisType: {
                  type: 'string',
                  enum: ['structure', 'metadata', 'statistics', 'full'],
                  description: 'Type of analysis to perform',
                  default: 'full'
                }
              },
              required: ['filePath']
            }
          },
          {
            name: 'office_extract',
            description: 'Extract specific content from documents',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Absolute path to the document file'
                },
                extractType: {
                  type: 'string',
                  enum: ['text', 'tables', 'images', 'metadata'],
                  description: 'Type of content to extract'
                },
                outputPath: {
                  type: 'string',
                  description: 'Optional path to save extracted content'
                }
              },
              required: ['filePath', 'extractType']
            }
          },
          {
            name: 'office_batch',
            description: 'Execute multiple operations on documents in one call',
            inputSchema: {
              type: 'object',
              properties: {
                operations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                        enum: ['read', 'create', 'convert', 'analyze', 'extract']
                      },
                      parameters: {
                        type: 'object',
                        description: 'Parameters for the operation'
                      }
                    },
                    required: ['type', 'parameters']
                  },
                  description: 'Array of operations to execute'
                }
              },
              required: ['operations']
            }
          },
          // Word-specific tools
          {
            name: 'word_add_content',
            description: 'Add content to a Word document',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Absolute path to the Word document'
                },
                content: {
                  type: 'string',
                  description: 'Content to add (Markdown format supported)'
                },
                position: {
                  type: 'string',
                  enum: ['beginning', 'end', 'after'],
                  description: 'Where to add the content',
                  default: 'end'
                },
                reference: {
                  type: 'string',
                  description: 'Reference point for position="after"'
                }
              },
              required: ['filePath', 'content']
            }
          },
          {
            name: 'word_add_image',
            description: 'Embed an image in a Word document',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Absolute path to the Word document'
                },
                imagePath: {
                  type: 'string',
                  description: 'Absolute path to the image file'
                },
                altText: {
                  type: 'string',
                  description: 'Alternative text for the image'
                },
                width: {
                  type: 'number',
                  description: 'Image width in pixels (optional)'
                },
                height: {
                  type: 'number',
                  description: 'Image height in pixels (optional)'
                }
              },
              required: ['filePath', 'imagePath']
            }
          },
          // Excel-specific tools
          {
            name: 'excel_set_cells',
            description: 'Set cell values in an Excel worksheet',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Absolute path to the Excel file'
                },
                worksheet: {
                  type: 'string',
                  description: 'Worksheet name (default: first worksheet)'
                },
                cells: {
                  type: 'object',
                  description: 'Cell values in format {A1: "value", B2: 123, ...}'
                },
                formatting: {
                  type: 'object',
                  description: 'Optional formatting options'
                }
              },
              required: ['filePath', 'cells']
            }
          },
          {
            name: 'excel_get_data',
            description: 'Get data from Excel worksheet',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Absolute path to the Excel file'
                },
                worksheet: {
                  type: 'string',
                  description: 'Worksheet name (default: first worksheet)'
                },
                range: {
                  type: 'string',
                  description: 'Cell range (e.g., "A1:C10", default: all data)'
                },
                includeFormatting: {
                  type: 'boolean',
                  description: 'Include cell formatting information',
                  default: false
                }
              },
              required: ['filePath']
            }
          },
          {
            name: 'excel_add_formula',
            description: 'Add a formula to an Excel cell',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Absolute path to the Excel file'
                },
                worksheet: {
                  type: 'string',
                  description: 'Worksheet name (default: first worksheet)'
                },
                cell: {
                  type: 'string',
                  description: 'Cell reference (e.g., "A1", "B2")'
                },
                formula: {
                  type: 'string',
                  description: 'Excel formula (e.g., "=SUM(A1:A10)")'
                }
              },
              required: ['filePath', 'cell', 'formula']
            }
          },
          // PowerPoint-specific tools
          {
            name: 'pptx_add_slide',
            description: 'Add a new slide to a PowerPoint presentation',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Absolute path to the PowerPoint file'
                },
                layout: {
                  type: 'string',
                  enum: ['title', 'title_and_content', 'section_header', 'two_content', 'comparison', 'blank'],
                  description: 'Slide layout',
                  default: 'title_and_content'
                },
                title: {
                  type: 'string',
                  description: 'Slide title'
                },
                content: {
                  type: 'string',
                  description: 'Slide content (supports bullet points with *)'
                },
                position: {
                  type: 'number',
                  description: 'Position to insert slide (default: end)'
                }
              },
              required: ['filePath']
            }
          },
          {
            name: 'pptx_add_image',
            description: 'Add an image to a PowerPoint slide',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Absolute path to the PowerPoint file'
                },
                slideNumber: {
                  type: 'number',
                  description: 'Slide number (1-based, default: last slide)'
                },
                imagePath: {
                  type: 'string',
                  description: 'Absolute path to the image file'
                },
                x: {
                  type: 'number',
                  description: 'X position in inches (optional)'
                },
                y: {
                  type: 'number',
                  description: 'Y position in inches (optional)'
                },
                width: {
                  type: 'number',
                  description: 'Width in inches (optional)'
                },
                height: {
                  type: 'number',
                  description: 'Height in inches (optional)'
                }
              },
              required: ['filePath', 'imagePath']
            }
          },
          // PDF-specific tools
          {
            name: 'pdf_create',
            description: 'Create a PDF document',
            inputSchema: {
              type: 'object',
              properties: {
                outputPath: {
                  type: 'string',
                  description: 'Absolute path where to save the PDF'
                },
                content: {
                  type: 'string',
                  description: 'Content for the PDF (Markdown format supported)'
                },
                metadata: {
                  type: 'object',
                  description: 'PDF metadata (title, author, subject)'
                },
                options: {
                  type: 'object',
                  description: 'PDF creation options (page size, margins, etc.)'
                }
              },
              required: ['outputPath', 'content']
            }
          },
          {
            name: 'pdf_extract_text',
            description: 'Extract text content from PDF pages',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Absolute path to the PDF file'
                },
                pages: {
                  type: 'array',
                  items: {
                    type: 'number'
                  },
                  description: 'Specific pages to extract (default: all pages)'
                },
                preserveFormatting: {
                  type: 'boolean',
                  description: 'Preserve original formatting',
                  default: true
                }
              },
              required: ['filePath']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Core Office Tools
          case 'office_read':
            return await this.handleOfficeRead(args);
          case 'office_create':
            return await this.handleOfficeCreate(args);
          case 'office_convert':
            return await this.handleOfficeConvert(args);
          case 'office_analyze':
            return await this.handleOfficeAnalyze(args);
          case 'office_extract':
            return await this.handleOfficeExtract(args);
          case 'office_batch':
            return await this.handleOfficeBatch(args);

          // Word-specific tools
          case 'word_add_content':
            return await this.handleWordAddContent(args);
          case 'word_add_image':
            return await this.handleWordAddImage(args);

          // Excel-specific tools
          case 'excel_set_cells':
            return await this.handleExcelSetCells(args);
          case 'excel_get_data':
            return await this.handleExcelGetData(args);
          case 'excel_add_formula':
            return await this.handleExcelAddFormula(args);

          // PowerPoint-specific tools
          case 'pptx_add_slide':
            return await this.handlePptxAddSlide(args);
          case 'pptx_add_image':
            return await this.handlePptxAddImage(args);

          // PDF-specific tools
          case 'pdf_create':
            return await this.handlePdfCreate(args);
          case 'pdf_extract_text':
            return await this.handlePdfExtractText(args);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  // Core Office Tool Handlers
  private async handleOfficeRead(args: any) {
    const { filePath, includeImages = true, extractTables = true } = args;
    
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (!ext) {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid file extension');
    }

    let result;
    switch (ext) {
      case 'docx':
        result = await this.wordService.readDocument(filePath, { includeImages, extractTables });
        break;
      case 'xlsx':
        result = await this.excelService.readWorkbook(filePath, { extractTables });
        break;
      case 'pptx':
        result = await this.powerpointService.readPresentation(filePath, { includeImages });
        break;
      case 'pdf':
        result = await this.pdfService.readPdf(filePath, { preserveFormatting: true });
        break;
      default:
        throw new McpError(ErrorCode.InvalidParams, `Unsupported file format: ${ext}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleOfficeCreate(args: any) {
    const { format, outputPath, content, template, metadata } = args;
    
    let result;
    switch (format) {
      case 'docx':
        result = await this.wordService.createDocument(outputPath, content, template, metadata);
        break;
      case 'xlsx':
        result = await this.excelService.createWorkbook(outputPath, content, template);
        break;
      case 'pptx':
        result = await this.powerpointService.createPresentation(outputPath, content, template);
        break;
      case 'pdf':
        result = await this.pdfService.createPdf(outputPath, content, metadata);
        break;
      default:
        throw new McpError(ErrorCode.InvalidParams, `Unsupported format: ${format}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true, outputPath, result }, null, 2)
        }
      ]
    };
  }

  private async handleOfficeConvert(args: any) {
    const { inputPath, outputPath, targetFormat } = args;
    
    const result = await this.conversionService.convertDocument(inputPath, outputPath, targetFormat);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleOfficeAnalyze(args: any) {
    const { filePath, analysisType = 'full' } = args;
    
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (!ext) {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid file extension');
    }

    let result;
    switch (ext) {
      case 'docx':
        result = await this.wordService.analyzeDocument(filePath, analysisType);
        break;
      case 'xlsx':
        result = await this.excelService.analyzeWorkbook(filePath, analysisType);
        break;
      case 'pptx':
        result = await this.powerpointService.analyzePresentation(filePath, analysisType);
        break;
      case 'pdf':
        result = await this.pdfService.analyzePdf(filePath, analysisType);
        break;
      default:
        throw new McpError(ErrorCode.InvalidParams, `Unsupported file format: ${ext}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleOfficeExtract(args: any) {
    const { filePath, extractType, outputPath } = args;
    
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (!ext) {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid file extension');
    }

    let result;
    switch (ext) {
      case 'docx':
        result = await this.wordService.extractContent(filePath, extractType, outputPath);
        break;
      case 'xlsx':
        result = await this.excelService.extractContent(filePath, extractType, outputPath);
        break;
      case 'pptx':
        result = await this.powerpointService.extractContent(filePath, extractType, outputPath);
        break;
      case 'pdf':
        result = await this.pdfService.extractContent(filePath, extractType, outputPath);
        break;
      default:
        throw new McpError(ErrorCode.InvalidParams, `Unsupported file format: ${ext}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleOfficeBatch(args: any) {
    const { operations } = args;
    const results = [];

    for (const operation of operations) {
      try {
        const result = await this.executeOperation(operation);
        results.push({ success: true, result });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ results }, null, 2)
        }
      ]
    };
  }

  private async executeOperation(operation: any) {
    const { type, parameters } = operation;
    
    switch (type) {
      case 'read':
        return await this.handleOfficeRead(parameters);
      case 'create':
        return await this.handleOfficeCreate(parameters);
      case 'convert':
        return await this.handleOfficeConvert(parameters);
      case 'analyze':
        return await this.handleOfficeAnalyze(parameters);
      case 'extract':
        return await this.handleOfficeExtract(parameters);
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  // Word-specific handlers
  private async handleWordAddContent(args: any) {
    const result = await this.wordService.addContent(args.filePath, args.content, args.position, args.reference);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleWordAddImage(args: any) {
    const result = await this.wordService.addImage(
      args.filePath, 
      args.imagePath, 
      args.altText, 
      args.width, 
      args.height
    );
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // Excel-specific handlers
  private async handleExcelSetCells(args: any) {
    const result = await this.excelService.setCells(
      args.filePath, 
      args.worksheet, 
      args.cells, 
      args.formatting
    );
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleExcelGetData(args: any) {
    const result = await this.excelService.getData(
      args.filePath, 
      args.worksheet, 
      args.range, 
      args.includeFormatting
    );
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleExcelAddFormula(args: any) {
    const result = await this.excelService.addFormula(
      args.filePath, 
      args.worksheet, 
      args.cell, 
      args.formula
    );
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // PowerPoint-specific handlers
  private async handlePptxAddSlide(args: any) {
    const result = await this.powerpointService.addSlide(
      args.filePath, 
      args.layout, 
      args.title, 
      args.content, 
      args.position
    );
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handlePptxAddImage(args: any) {
    const result = await this.powerpointService.addImage(
      args.filePath, 
      args.slideNumber, 
      args.imagePath, 
      args.x, 
      args.y, 
      args.width, 
      args.height
    );
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // PDF-specific handlers
  private async handlePdfCreate(args: any) {
    const result = await this.pdfService.createPdf(
      args.outputPath, 
      args.content, 
      args.metadata, 
      args.options
    );
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handlePdfExtractText(args: any) {
    const result = await this.pdfService.extractText(
      args.filePath, 
      args.pages, 
      args.preserveFormatting
    );
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Terminator Office MCP server running on stdio');
  }
}

const server = new OfficeMCPServer();
server.run().catch(console.error);
