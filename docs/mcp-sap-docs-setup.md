# MCP Servers Setup for Praman v1.0

## Overview

This project uses **two complementary MCP servers** for SAP UI5 development:

1. **`mcp-sap-docs`** - Comprehensive SAP documentation search (UI5, CAP, ABAP, Cloud SDK)
2. **`@ui5/mcp-server`** - Official SAP UI5 development tools (linting, scaffolding, API reference)

## Installation Status

### 1. MCP SAP Docs Server

✅ **Installed and Configured**

- **Location**: `/Users/maheshwar/Documents/projects/mcp-sap-docs`
- **Variant**: `sap-docs` (broad SAP documentation scope)
- **Build Status**: Successfully built and indexed
- **Source**: https://github.com/marianfoo/mcp-sap-docs

### 2. UI5 MCP Server

✅ **Installed and Configured**

- **Location**: `node_modules/@ui5/mcp-server` (dev dependency)
- **Version**: 0.2.5
- **Source**: https://github.com/UI5/mcp-server
- **Official SAP Package**: Yes

## Configuration

### VS Code (Copilot)

Configuration file: `.vscode/mcp.json`

```json
{
  "servers": {
    "playwright-test": {
      "type": "stdio",
      "command": "npx",
      "args": ["playwright", "run-test-mcp-server"]
    },
    "sap-docs": {
      "type": "stdio",
      "command": "node",
      "args": ["/Users/maheshwar/Documents/projects/mcp-sap-docs/dist/index.js"],
      "env": {
        "MCP_VARIANT": "sap-docs"
      }
    },
    "ui5-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["@ui5/mcp-server"],
      "env": {
        "UI5_MCP_WORKSPACE": "/Users/maheshwar/Documents/projects/mk1"
      }
    }
  }
}
```

### Claude Desktop

Configuration file: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "sap-docs": {
      "command": "node",
      "args": ["/Users/maheshwar/Documents/projects/mcp-sap-docs/dist/index.js"],
      "env": {
        "MCP_VARIANT": "sap-docs"
      }
    },
    "ui5-mcp": {
      "command": "npx",
      "args": ["@ui5/mcp-server"],
      "env": {
        "UI5_MCP_WORKSPACE": "/Users/maheshwar/Documents/projects/mk1"
      }
    }
  }
}
```

## Available Tools

### MCP SAP Docs Server (`sap-docs`)

Documentation search and reference tools:

1. **`search`** - Search SAP documentation
   - Query SAP Help, SAP Community, and Software Heroes
   - Supports offline FTS index and online sources
   - Parameters:
     - `query` (required): Search query string
     - `k`: Maximum results (default: 10)
     - `includeOnline`: Include online sources (default: true)
     - `includeSamples`: Include sample-heavy sources
     - `abapFlavor`: Filter ABAP docs (`standard`, `cloud`, `auto`)
     - `sources`: Restrict offline libraries

2. **`fetch`** - Fetch specific documentation
   - Retrieve documentation by URL or identifier

3. **`abap_feature_matrix`** - Get ABAP feature compatibility matrix
   - Compare features across ABAP flavors (Standard vs Cloud)

### UI5 MCP Server (`ui5-mcp`)

Official SAP UI5 development tools:

1. **`create_ui5_app`** - Scaffold new UI5 application
   - Template-based project creation
   - Supports multiple UI5 app types

2. **`get_api_reference`** - Fetch UI5 API documentation
   - Complete API docs for UI5 controls and classes
   - Formatted for AI consumption

3. **`get_guidelines`** - UI5 development best practices
   - Official SAP coding standards
   - Architecture patterns and guidelines

4. **`get_project_info`** - Extract UI5 project metadata
   - Parse ui5.yaml configuration
   - Analyze project structure

5. **`get_version_info`** - UI5 framework version information
   - Available UI5 versions
   - Version compatibility details

6. **`run_ui5_linter`** - Analyze UI5 code quality
   - Integrates with `@ui5/linter`
   - Detects UI5-specific issues and anti-patterns

7. **`get_typescript_conversion_guidelines`** - TypeScript migration guide
   - Guidelines for JS → TS conversion
   - UI5 TypeScript best practices

8. **`create_integration_card`** - Scaffold UI Integration Card
   - Create SAP UI Integration Cards
   - Template-based card creation

9. **`get_integration_cards_guidelines`** - Integration Cards best practices
   - Development guidelines for UI Integration Cards

10. **`run_manifest_validation`** - Validate manifest.json
    - Schema validation against UI5 Manifest spec
    - Detect configuration errors

## Usage Examples

### Documentation Search (sap-docs)

```typescript
// Search for UI5 Documentation
"Search for sap.m.Button API documentation"
→ Returns UI5 API reference links and descriptions

// Search for ABAP Keywords
"Find ABAP SELECT statement documentation"
→ Returns ABAP language reference for SELECT

// Search for CAP Guides
"Search for CAP service definition best practices"
→ Returns CAP framework documentation
```

### UI5 Development Tools (ui5-mcp)

```typescript
// Get API Reference
"Show me the API for sap.m.Table"
→ Returns complete API documentation for sap.m.Table

// Run Linter
"Analyze my UI5 code for issues"
→ Runs @ui5/linter and reports UI5-specific problems

// Get Guidelines
"What are the best practices for UI5 controller development?"
→ Returns official SAP UI5 guidelines

// Create New App
"Create a new UI5 freestyle application"
→ Scaffolds a new UI5 app using templates

// Validate Manifest
"Check if my manifest.json is valid"
→ Validates manifest against UI5 schema
```

## Maintenance

### Rebuilding MCP SAP Docs Index

If you need to update the documentation index:

```bash
cd /Users/maheshwar/Documents/projects/mcp-sap-docs

# Update submodules (requires bash 4+, install via Homebrew if needed)
# brew install bash
# /opt/homebrew/bin/bash setup.sh

# Or rebuild with existing content
npm run build
```

### Switching to ABAP Variant

To use the ABAP-focused variant with ABAP lint support:

```bash
cd /Users/maheshwar/Documents/projects/mcp-sap-docs
MCP_VARIANT=abap npm run build
```

Then update configurations to use `MCP_VARIANT=abap`.

### Updating UI5 MCP Server

To update to the latest version:

```bash
cd /Users/maheshwar/Documents/projects/mk1
npm update @ui5/mcp-server
```

## Troubleshooting

### Server Not Responding

**MCP SAP Docs:**

1. Check if Node.js is installed: `node --version`
2. Rebuild the server: `cd /Users/maheshwar/Documents/projects/mcp-sap-docs && npm run build`
3. Check server path in config matches: `/Users/maheshwar/Documents/projects/mcp-sap-docs/dist/index.js`

**UI5 MCP Server:**

1. Verify installation: `cd /Users/maheshwar/Documents/projects/mk1 && npm list @ui5/mcp-server`
2. Reinstall if needed: `npm install --save-dev @ui5/mcp-server`
3. Check Node.js version: Must be v20.17.0, v22.9.0 or higher

**Both Servers:**

- Restart VS Code or Claude Desktop after configuration changes
- Check MCP server logs in the respective client

### Empty Search Results (sap-docs)

- The offline index may be empty (0 documents indexed during build)
- Online search still works via SAP Help and SAP Community
- To populate offline index, initialize submodules (requires bash 4+)

### UI5 Linter Errors (ui5-mcp)

- Ensure you're in a valid UI5 project directory
- Check if `ui5.yaml` exists in your project root
- Verify UI5 project dependencies are installed

### Configuration Not Loaded

- **VS Code**: Reload window (Cmd+Shift+P → "Developer: Reload Window")
- **Claude Desktop**: Quit and restart the application completely
- Verify JSON syntax in configuration files is valid

## Benefits for Praman v1.0

Using both MCP servers significantly enhances Praman development:

### Documentation & Search (mcp-sap-docs)

1. **Comprehensive SAP Documentation** - Search across UI5, CAP, ABAP, Cloud SDK
2. **OData Protocol References** - V2/V4 specification and examples
3. **SAP Community Integration** - Real-world solutions and best practices
4. **ABAP Backend Knowledge** - Bridge between UI5 frontend and ABAP backend
5. **CAP Framework Docs** - For future SAP Cloud integration features

### Development Tools (@ui5/mcp-server)

1. **Official SAP Tooling** - Direct from the UI5 team, always up-to-date
2. **UI5 API Reference** - Instant access to 500+ control APIs with examples
3. **Code Quality Analysis** - `@ui5/linter` integration for UI5-specific issues
4. **Project Scaffolding** - Generate UI5 apps and Integration Cards
5. **TypeScript Migration** - Guidelines for converting to TypeScript
6. **Manifest Validation** - Catch configuration errors early
7. **Best Practices** - Official SAP coding standards and patterns

### Combined Benefits

- **AI-Optimized Workflows** - Both servers designed for AI agent consumption
- **Complete UI5 Coverage** - Documentation search + development tools
- **Quality Assurance** - Linting + validation + best practices
- **Time Savings** - Instant answers vs. manual documentation browsing
- **Consistency** - Official SAP guidance across all development phases

## Related Documentation

### MCP SAP Docs Server

- **Repository**: https://github.com/marianfoo/mcp-sap-docs
- **Configuration**: `config/variants/sap-docs.json`
- **Architecture**: `mcp-sap-docs/docs/ARCHITECTURE.md`

### UI5 MCP Server

- **Repository**: https://github.com/UI5/mcp-server
- **NPM Package**: https://www.npmjs.com/package/@ui5/mcp-server
- **Blog Post**: [SAP Community Announcement](https://community.sap.com/t5/technology-blog-post-by-sap/give-your-ai-agent-some-tools-introducing-the-ui5-mcp-server/ba-p/14200825)
- **OpenUI5 Slack**: `#tooling` channel

### Model Context Protocol

- **Specification**: https://modelcontextprotocol.io/
- **Documentation**: https://modelcontextprotocol.io/docs

## Quick Reference

### When to Use Which Server

| Task                     | Server     | Tool                                   |
| ------------------------ | ---------- | -------------------------------------- |
| Search SAP documentation | `sap-docs` | `search`                               |
| Get UI5 API reference    | `ui5-mcp`  | `get_api_reference`                    |
| Find UI5 best practices  | `ui5-mcp`  | `get_guidelines`                       |
| Search ABAP docs         | `sap-docs` | `search` with `abapFlavor`             |
| Lint UI5 code            | `ui5-mcp`  | `run_ui5_linter`                       |
| Create UI5 app           | `ui5-mcp`  | `create_ui5_app`                       |
| Validate manifest.json   | `ui5-mcp`  | `run_manifest_validation`              |
| Search CAP/Cloud SDK     | `sap-docs` | `search`                               |
| Get version info         | `ui5-mcp`  | `get_version_info`                     |
| TypeScript conversion    | `ui5-mcp`  | `get_typescript_conversion_guidelines` |
