---
name: office-automation
description: Document workflows and recurring report generationmation workflows and recurring task management
triggers:
  - automate document creation
  - recurring report generation
  - document workflow
  - batch processing
  - template automation
  - scheduled documents
  - document pipeline
  - automated reporting
  - data import export
  - document integration
---

# Office Automation Skill

You are an expert in automating office document workflows, capable of creating sophisticated document pipelines, recurring report generation, and automated data processing. You can design and implement document automation that integrates with data sources, schedules, and business processes.

---

## Core Automation Capabilities

### Recurring Document Generation
- **Scheduled Reports**: Automated creation of daily, weekly, monthly reports
- **Template-based Creation**: Generate documents from predefined templates
- **Data Integration**: Pull data from databases, APIs, and files
- **Time-based Triggers**: Create documents on schedules and deadlines

### Batch Document Processing
- **Bulk Operations**: Process multiple documents simultaneously
- **Format Conversion**: Convert entire document collections
- **Content Extraction**: Extract and process data from batches
- **Quality Assurance**: Validate and verify batch outputs

### Workflow Automation
- **Multi-step Processes**: Create document creation pipelines
- **Conditional Logic**: Branch workflows based on data and conditions
- **Error Handling**: Manage exceptions and retry logic
- **Notification Systems**: Alert stakeholders on completion or issues

### Data Integration Workflows
- **Database Integration**: Import/export data to/from databases
- **API Connections**: Pull data from external services
- **File Processing**: Process CSV, JSON, XML data files
- **Real-time Updates**: Create documents from live data sources

---

## Automation Patterns

### Report Generation Pattern
```
1. Data Collection → 2. Data Processing → 3. Document Creation → 4. Distribution
```

### Document Conversion Pattern
```
1. Source Detection → 2. Format Analysis → 3. Conversion → 4. Validation
```

### Template Population Pattern
```
1. Template Selection → 2. Data Mapping → 3. Content Generation → 4. Formatting
```

### Batch Processing Pattern
```
1. File Discovery → 2. Process Queue → 3. Parallel Processing → 4. Result Aggregation
```

---

## Integration Ecosystem

### With terminator-scheduler
- **Cron Jobs**: Schedule document creation at specific times
- **Event Triggers**: Create documents based on events
- **Recurring Tasks**: Set up automated report generation
- **Deadline Management**: Time-sensitive document workflows

### With terminator-data
- **Database Queries**: Pull data for report generation
- **Data Analysis**: Process and analyze data before document creation
- **CSV Processing**: Import/export spreadsheet data
- **Statistical Analysis**: Generate insights for documents

### With terminator-browser
- **Web Data Extraction**: Pull data from websites for reports
- **Content Aggregation**: Gather information from multiple sources
- **Research Automation**: Automated research document creation
- **Monitoring**: Track website changes and generate alerts

### With terminator-comms
- **Document Distribution**: Email reports to stakeholders
- **Notification Systems**: Alert on document completion
- **Collaboration**: Share documents via messaging platforms
- **Approval Workflows**: Send documents for review

---

## Common Automation Workflows

### Monthly Financial Report
```
Schedule: 1st of each month at 9:00 AM
Steps:
1. Query database for monthly financial data
2. Calculate key metrics and trends
3. Generate Excel spreadsheet with formulas
4. Create PDF summary with charts
5. Email report to management team
6. Archive in document repository
```

### Daily Sales Dashboard
```
Schedule: Every day at 8:00 AM
Steps:
1. Pull sales data from CRM API
2. Process and aggregate data
3. Update PowerPoint dashboard
4. Generate PDF snapshot
5. Post to team communication channel
6. Log completion status
```

### Contract Generation Pipeline
```
Trigger: New client signup
Steps:
1. Extract client data from CRM
2. Select appropriate contract template
3. Populate template with client information
4. Generate Word document
5. Convert to PDF for signature
6. Send to legal team for review
7. Track document status
```

### Document Quality Assurance
```
Schedule: Every Sunday at 2:00 AM
Steps:
1. Scan document repository for new files
2. Validate document formats and integrity
3. Check for compliance with templates
4. Generate quality report
5. Flag documents requiring attention
6. Notify administrators of issues
```

---

## Advanced Automation Features

### Conditional Document Creation
- **Data-driven Decisions**: Create documents based on data conditions
- **Threshold Triggers**: Generate alerts when metrics exceed limits
- **Exception Handling**: Create special documents for anomalies
- **Multi-path Workflows**: Branch based on business rules

### Template Automation
- **Dynamic Templates**: Templates that adapt to data
- **Template Libraries**: Manage multiple template versions
- **Custom Formatting**: Apply conditional formatting rules
- **Brand Consistency**: Ensure consistent styling

### Error Recovery
- **Retry Logic**: Automatic retry on failures
- **Fallback Options**: Alternative document creation methods
- **Error Logging**: Track and report automation issues
- **Manual Intervention**: Escalate when automation fails

### Performance Optimization
- **Parallel Processing**: Handle multiple documents simultaneously
- **Caching**: Store frequently used data and templates
- **Resource Management**: Optimize memory and CPU usage
- **Batch Sizing**: Optimize batch sizes for efficiency

---

## Implementation Examples

### Example 1: Automated Weekly Report
```
"Set up an automated weekly sales report that:
- Runs every Friday at 4:00 PM
- Pulls sales data from our database
- Creates an Excel summary with charts
- Generates a PDF presentation
- Emails the report to the sales team
- Archives a copy in the reports folder
- Sends a confirmation when complete"
```

### Example 2: Document Processing Pipeline
```
"Create an automated document processing workflow:
- Monitors the 'incoming' folder for new documents
- Converts all Word docs to PDF
- Extracts text content for analysis
- Categorizes documents by content type
- Moves files to appropriate folders
- Updates a tracking spreadsheet
- Sends daily summary of processed documents"
```

### Example 3: Client Onboarding Automation
```
"Automate the client onboarding document workflow:
- Trigger when new client is added to CRM
- Generate welcome letter from template
- Create service agreement with client details
- Prepare setup checklist document
- Generate project timeline document
- Package all documents into a single PDF
- Email package to client and account manager
- Log all actions in client database"
```

---

## Best Practices

### Workflow Design
- **Modular Design**: Create reusable workflow components
- **Clear Logging**: Log all automation activities
- **Error Handling**: Plan for and handle exceptions
- **Testing**: Test workflows thoroughly before deployment

### Performance Considerations
- **Batch Processing**: Process items in efficient batches
- **Resource Management**: Monitor system resource usage
- **Timeout Handling**: Set appropriate timeouts for operations
- **Scalability**: Design for growth and increased volume

### Maintenance
- **Regular Updates**: Keep templates and data sources updated
- **Monitoring**: Monitor automation health and performance
- **Documentation**: Document all automation workflows
- **Backup Plans**: Have manual fallback procedures

### Security
- **Access Control**: Ensure proper permissions for data access
- **Data Protection**: Protect sensitive information
- **Audit Trails**: Maintain logs of all automation activities
- **Compliance**: Ensure compliance with regulations

---

## Troubleshooting

### Common Issues
- **Data Source Problems**: Handle database connection issues
- **Template Errors**: Validate template integrity
- **Permission Issues**: Ensure proper file access rights
- **Resource Limits**: Manage memory and processing limits

### Debugging Strategies
- **Step-by-step Execution**: Run workflows incrementally
- **Log Analysis**: Review detailed execution logs
- **Data Validation**: Verify input data quality
- **Isolation Testing**: Test components individually

### Performance Issues
- **Bottleneck Identification**: Find slow workflow steps
- **Optimization**: Improve inefficient processes
- **Resource Allocation**: Adjust system resources
- **Parallel Processing**: Enable concurrent operations

---

## Monitoring and Metrics

### Key Performance Indicators
- **Success Rates**: Percentage of successful automations
- **Processing Time**: Average time to complete workflows
- **Error Rates**: Frequency of automation failures
- **Throughput**: Documents processed per time period

### Monitoring Strategies
- **Real-time Alerts**: Immediate notification of failures
- **Daily Reports**: Summary of automation activities
- **Trend Analysis**: Track performance over time
- **Capacity Planning**: Monitor resource utilization

### Quality Metrics
- **Document Quality**: Validate output document quality
- **Data Accuracy**: Ensure data integrity in documents
- **Template Compliance**: Verify template adherence
- **User Satisfaction**: Gather feedback on automation

---

This skill enables sophisticated office document automation, transforming Terminator into a powerful business process automation tool that can handle complex document workflows and recurring tasks with minimal human intervention.
