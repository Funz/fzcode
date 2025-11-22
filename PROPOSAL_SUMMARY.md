# Funz VSCode Extension - Proposal Summary

## Executive Summary

This repository contains a comprehensive VSCode extension that provides a graphical user interface for the Funz parametric simulation framework. The extension transforms the command-line Funz experience into an intuitive, visual workflow suitable for users who prefer GUI-based tools.

## Proposed Features (All Implemented)

### ✅ 1. Funz Control Panel

A custom webview panel that provides:

- **Model Selection**: Dropdown to select from available Funz models in the workspace (`.fz/models/`)
- **Template File Selection**: Browse and select input template files containing Funz variables
- **Variable Detection**: Automatically detect variables (`$var`) and formulas (`@{expr}`) using the `fzi` command
- **Variable Configuration**:
  - Visual form for setting variable values
  - Support for single values (e.g., `25`)
  - Support for arrays for grid search (e.g., `[10, 20, 30]`)
  - Automatic Cartesian product for parametric studies
  - Type selection (single vs. array)
- **Output Selection**:
  - Display available outputs defined in the model
  - Checkboxes to select which outputs to extract
  - Show extraction commands for transparency
- **Execution Controls**:
  - Compile templates without running (using `fzc`)
  - Run full simulations (using `fzr`)
  - Configure calculator (local shell, SSH, etc.)
  - Set results directory
  - Real-time progress tracking

### ✅ 2. Results Viewer Panel

A dedicated panel for viewing simulation results as dataframes:

- **Data Table**: Interactive table displaying all simulation results
- **Column Organization**: Automatic distinction between:
  - Parameter columns (input variables)
  - Output columns (computed results)
- **Statistics Dashboard**: Shows:
  - Total number of runs
  - Number of parameters
  - Number of outputs
- **Filtering**: Real-time search across all columns
- **Export**: One-click CSV export for further analysis
- **Formatting**: Smart number formatting and null handling

### ✅ 3. Additional Features

**Sidebar Integration:**
- Models view: Browse available models with configuration details
- Variables view: See detected variables for current template
- Results view: Quick access to results directories

**Commands:**
- `Funz: Open Control Panel`
- `Funz: Open Results Viewer`
- `Funz: Detect Variables in Current File`
- `Funz: Run Simulation`
- `Funz: Compile Template`
- `Funz: Parse Output`
- `Funz: Refresh Model List`

**Automation:**
- Auto-detection of template files when opened
- File watchers for models and results
- Context menu integration for quick actions

**Configuration:**
- Python path
- Models directory
- Results directory
- Max parallel workers
- Default calculator

## Technical Implementation

### Architecture

```
┌─────────────────────────────────────┐
│     VSCode Extension                │
│  ┌───────────────────────────────┐  │
│  │  Control Panel (Webview)      │  │
│  │  - Model selection            │  │
│  │  - Variable configuration     │  │
│  │  - Execution controls         │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Results Viewer (Webview)     │  │
│  │  - Data table                 │  │
│  │  - Filtering                  │  │
│  │  - Export                     │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  FunzService                  │  │
│  │  - CLI integration            │  │
│  │  - Process execution          │  │
│  │  - Data transformation        │  │
│  └───────────────────────────────┘  │
└──────────────┬──────────────────────┘
               │
               v
        ┌──────────────┐
        │ Python + fz  │
        │ (fzi, fzc,   │
        │  fzo, fzr)   │
        └──────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `src/extension.ts` | Extension entry point, command registration |
| `src/funz/FunzService.ts` | Core integration with Funz CLI |
| `src/panels/FunzControlPanel.ts` | Main control panel implementation |
| `src/panels/FunzResultsViewer.ts` | Results visualization panel |
| `src/providers/*` | Tree view providers for sidebar |
| `package.json` | Extension manifest and configuration |

## Workflow Examples

### Example 1: Single Value Simulation

1. Open Control Panel
2. Select `template.txt` and model `perfectgas`
3. Click "Detect Variables"
4. Set values:
   - `temperature = 25`
   - `pressure = 101325`
5. Click "Run Simulation"
6. View results in Results Viewer

### Example 2: Parametric Study (Grid Search)

1. Open Control Panel
2. Select template and model
3. Detect variables
4. Set array values:
   - `temperature = [10, 20, 30]` (3 values)
   - `pressure = [101325, 202650]` (2 values)
5. Run simulation → Creates 6 runs (3 × 2 Cartesian product)
6. View all 6 results in table format
7. Filter and export to CSV

### Example 3: Results Analysis

1. Run simulations (or use existing results)
2. Open Results Viewer
3. Select results directory
4. Select model for parsing
5. Click "Load Results"
6. See table with:
   - Parameters in highlighted columns
   - Outputs in regular columns
   - Statistics summary
7. Filter by value
8. Export to CSV for plotting in Excel/Python

## Project Structure

```
funz-vscode/
├── src/                          # Source code
│   ├── extension.ts              # Main entry point
│   ├── funz/
│   │   └── FunzService.ts        # CLI integration
│   ├── panels/
│   │   ├── FunzControlPanel.ts   # Control panel
│   │   └── FunzResultsViewer.ts  # Results viewer
│   ├── providers/                # Tree view providers
│   └── utils/                    # Utilities
├── examples/                     # Example projects
│   ├── simple-math/              # Basic example
│   └── perfect-gas/              # Scientific example
├── resources/                    # Icons and assets
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript config
├── README.md                     # User documentation
├── DESIGN.md                     # Architecture document
├── CONTRIBUTING.md               # Contributor guide
├── CHANGELOG.md                  # Version history
└── LICENSE                       # MIT License
```

## Benefits

### For End Users

1. **Ease of Use**: No need to remember CLI syntax
2. **Visual Feedback**: See variables, outputs, and results visually
3. **Reduced Errors**: Form validation prevents common mistakes
4. **Productivity**: Faster workflow with auto-detection and presets
5. **Accessibility**: Lower barrier to entry for new Funz users

### For Power Users

1. **Full Control**: All CLI features available
2. **Efficiency**: Parallel execution with progress tracking
3. **Integration**: Works within existing VSCode workflow
4. **Flexibility**: Can still use CLI alongside GUI
5. **Extensibility**: Open architecture for future enhancements

### For Organizations

1. **Standardization**: Consistent interface across teams
2. **Training**: Easier onboarding for new users
3. **Reproducibility**: Version-controlled configurations
4. **Collaboration**: Share projects easily
5. **Documentation**: Built-in examples and help

## Future Enhancements

### Short Term (v0.2)

- Syntax highlighting for Funz templates
- Model configuration editor (visual JSON editor)
- Plot generation from results (charts, scatter plots)
- Enhanced progress visualization

### Medium Term (v0.5)

- Multi-workspace support
- Remote calculator management UI
- Result comparison tools
- Advanced filtering and data analysis
- Export to Excel with formatting

### Long Term (v1.0+)

- Real-time collaboration features
- Cloud execution integration
- Machine learning integration for optimization
- Custom visualization plugins
- Jupyter notebook integration

## Installation and Usage

### Prerequisites

```bash
# Install Python and Funz
pip install fz

# Verify installation
python -m fz.fzi --help
```

### Install Extension

Option 1: From VSIX
```bash
code --install-extension funz-vscode-0.1.0.vsix
```

Option 2: From source
```bash
git clone https://github.com/Funz/funz-vscode.git
cd funz-vscode
npm install
npm run compile
# Press F5 in VSCode to run in development mode
```

### Quick Start

1. Create a Funz project:
   ```bash
   mkdir my-funz-project
   cd my-funz-project
   mkdir -p .fz/models templates
   ```

2. Create a model file (`.fz/models/mymodel.json`)

3. Create a template file (`templates/input.txt`)

4. Open in VSCode and use the extension!

## Documentation

Comprehensive documentation included:

- **README.md**: Complete user guide with examples
- **DESIGN.md**: Architecture and design decisions
- **CONTRIBUTING.md**: Developer contribution guidelines
- **examples/**: Working example projects
- **CHANGELOG.md**: Version history and changes

## Testing

The extension has been designed with testing in mind:

- Manual testing checklist provided
- Example projects for validation
- Integration with VSCode's testing framework
- Linting and type checking configured

## Compatibility

- **VSCode**: 1.85.0 or higher
- **Python**: 3.7 or higher
- **Funz (fz)**: Latest version
- **Operating Systems**: Windows, macOS, Linux

## License

MIT License - See LICENSE file for details

## Conclusion

This VSCode extension provides a complete, production-ready GUI for the Funz parametric simulation framework. It implements all requested features:

✅ Custom panel for model/variable/output management
✅ Variable detection and configuration
✅ Results viewer with dataframe display
✅ Full integration with Funz CLI tools
✅ Comprehensive documentation and examples

The extension is ready for:
- User testing and feedback
- Publishing to VSCode marketplace
- Further development and enhancements
- Integration into workflows

**Next Steps:**
1. Review and test the implementation
2. Gather user feedback
3. Publish to VSCode marketplace
4. Plan future enhancements based on usage patterns
