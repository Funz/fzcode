# Change Log

All notable changes to the "Funz GUI" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned Features
- Syntax highlighting for Funz templates
- Visual model configuration editor
- Plot generation from results
- Real-time simulation progress visualization
- Result comparison tools

## [0.1.0] - 2024-11-22

### Added
- **Funz Control Panel**: Main GUI for configuring and running simulations
  - Template file selection
  - Model selection from workspace
  - Automatic variable detection
  - Variable value configuration (single values and arrays)
  - Output selection interface
  - Calculator configuration
  - Compile and run commands

- **Results Viewer Panel**: Interactive dataframe visualization
  - Table view of simulation results
  - Statistics display (total runs, parameters, outputs)
  - Real-time filtering
  - CSV export functionality
  - Automatic parameter/output column detection

- **Sidebar Views**: Three tree views for navigation
  - Models view with configuration details
  - Variables view showing detected variables
  - Results view for quick access to results directories

- **Commands**: 7 commands for Funz operations
  - Open Control Panel
  - Open Results Viewer
  - Detect Variables
  - Run Simulation
  - Compile Template
  - Parse Output
  - Refresh Models

- **Core Features**:
  - Integration with Funz CLI tools (fzi, fzc, fzo, fzr)
  - Auto-detection of template files and variables
  - File system watchers for models and results
  - Context menu integration
  - Progress tracking and output streaming
  - Error handling and validation

- **Configuration Settings**:
  - Python path configuration
  - Models directory path
  - Results directory path
  - Max workers for parallel execution
  - Auto-detect variables toggle
  - Default calculator setting

- **Documentation**:
  - Comprehensive README
  - Design document
  - Example projects (simple-math, perfect-gas)
  - Usage examples and tutorials

### Technical Details
- TypeScript implementation
- VSCode extension API 1.85.0+
- Python 3.7+ with fz package required
- Webview-based panels for rich UI
- Message passing architecture for webview communication
- Subprocess execution for Funz commands

### Known Limitations
- No syntax highlighting for templates (planned for v0.2)
- No visual model editor (planned for v0.2)
- No plotting capabilities (planned for v0.2)
- Results table doesn't support virtual scrolling (planned for v0.3)
- Single workspace only (multi-workspace planned for v1.0)

## Development Notes

### Version 0.1.0 Development Cycle
- Initial architecture design
- Core service implementation
- UI component development
- Example project creation
- Documentation writing

### Breaking Changes
None (initial release)

### Migration Guide
None (initial release)

---

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Run tests: `npm test`
4. Build: `npm run compile`
5. Package: `vsce package`
6. Publish: `vsce publish`
7. Create GitHub release with VSIX attachment

## Support

For issues and feature requests, please visit:
- GitHub Issues: [funz-vscode/issues](https://github.com/Funz/funz-vscode/issues)
- Funz Documentation: [https://funz.github.io/docs/](https://funz.github.io/docs/)
