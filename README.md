# Funz GUI - VSCode Extension

A powerful VSCode extension that provides a comprehensive graphical user interface for the Funz parametric simulation framework. This extension makes it easy to configure, run, and analyze parametric simulations without needing to use command-line tools.

## Features

### 🎛️ Funz Control Panel

The main interface for configuring and running simulations:

- **Model Selection**: Browse and select from available Funz models in your workspace
- **Template Management**: Select input template files containing variables and formulas
- **Variable Detection**: Automatically detect variables (`$var`) and formulas (`@{expr}`) in templates
- **Variable Configuration**:
  - Set single values or arrays for grid search
  - Support for numeric, string, and array values
  - Visual indication of parameter vs computed variables
- **Output Selection**: Choose which outputs to extract from simulation results
- **Execution Control**:
  - Compile templates without running simulations
  - Run full parametric studies with progress tracking
  - Configure calculators (local shell, remote SSH, etc.)

### 📊 Results Viewer

Interactive dataframe visualization for simulation results:

- **Table View**: Display results in a clean, sortable table
- **Statistics**: Overview of total runs, parameters, and outputs
- **Filtering**: Search and filter results in real-time
- **Export**: Export results to CSV format
- **Auto-detection**: Automatically distinguishes parameter columns from output columns

### 🔍 Sidebar Views

Three dedicated sidebar panels:

1. **Models View**: Browse available Funz models with configuration details
2. **Variables View**: See detected variables in the current template
3. **Results View**: Quick access to results directories in your workspace

### 🚀 Commands

- `Funz: Open Control Panel` - Open the main control panel
- `Funz: Open Results Viewer` - View simulation results
- `Funz: Detect Variables in Current File` - Detect variables in active file
- `Funz: Run Simulation` - Configure and run a simulation
- `Funz: Compile Template` - Compile template with variables
- `Funz: Parse Output` - Parse results from a directory
- `Funz: Refresh Model List` - Reload available models

### ⚙️ Features

- **Auto-detection**: Automatically detect template files and variables
- **File Watchers**: Real-time updates when models or results change
- **Progress Tracking**: Live output during simulation execution
- **Context Menus**: Right-click on files and folders for quick actions
- **Syntax Awareness**: Recognizes Funz variable (`$`) and formula (`@`) syntax

## Requirements

- **Python 3.7+** with the `fz` package installed
- **VSCode 1.85.0** or higher

### Installing Funz

```bash
pip install fz
```

Or for development:

```bash
git clone https://github.com/Funz/fz.git
cd fz
pip install -e .
```

## Extension Settings

This extension contributes the following settings:

- `funz.pythonPath`: Path to Python executable with fz package (default: `"python"`)
- `funz.modelsDirectory`: Directory containing Funz model configurations (default: `".fz/models"`)
- `funz.resultsDirectory`: Default directory for simulation results (default: `"results"`)
- `funz.maxWorkers`: Maximum number of parallel workers (default: `4`)
- `funz.autoDetectVariables`: Automatically detect variables when opening files (default: `true`)
- `funz.defaultCalculator`: Default calculator for simulations (default: `"sh://bash"`)

## Getting Started

### 1. Setup Your Workspace

Create a Funz workspace structure:

```
my-project/
├── .fz/
│   └── models/
│       └── mymodel.json
├── templates/
│   └── input.txt
└── results/
```

### 2. Create a Model Configuration

Create a model file in `.fz/models/mymodel.json`:

```json
{
  "varprefix": "$",
  "formulaprefix": "@",
  "delim": "{}",
  "commentline": "#",
  "interpreter": "python",
  "output": {
    "result_value": "grep 'Result:' output.txt | awk '{print $2}'"
  }
}
```

### 3. Create a Template File

Create `templates/input.txt` with variables:

```
# Simulation Input File
temperature=$temperature
pressure=$pressure
volume=@{$temperature * $pressure / 8.314}
```

### 4. Use the Control Panel

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run `Funz: Open Control Panel`
3. Select your template file
4. Select your model
5. Click "Detect Variables"
6. Set variable values (single or arrays)
7. Configure calculator and results directory
8. Click "Run Simulation"

### 5. View Results

1. Open Command Palette
2. Run `Funz: Open Results Viewer`
3. Select your results directory
4. Choose the model
5. Click "Load Results"

## Usage Examples

### Single Value Simulation

In the Control Panel:
- `temperature`: `25`
- `pressure`: `101325`

This runs a single simulation with these values.

### Grid Search (Parametric Study)

In the Control Panel:
- `temperature`: `[10, 20, 30]` (array)
- `pressure`: `[101325, 202650]` (array)

This runs 6 simulations (3 × 2 Cartesian product):
- (10, 101325), (10, 202650)
- (20, 101325), (20, 202650)
- (30, 101325), (30, 202650)

### Using Different Calculators

**Local Shell:**
```
sh://bash run_simulation.sh
```

**Remote SSH:**
```
ssh://user@server/path/to/run.sh
```

**Multiple Calculators (Parallel):**
Configure multiple calculator entries to run simulations in parallel across different compute resources.

## Architecture

### Project Structure

```
funz-vscode/
├── src/
│   ├── extension.ts              # Main extension entry point
│   ├── funz/
│   │   └── FunzService.ts        # Core Funz integration
│   ├── panels/
│   │   ├── FunzControlPanel.ts   # Main control panel
│   │   └── FunzResultsViewer.ts  # Results visualization
│   ├── providers/
│   │   ├── FunzModelsProvider.ts # Sidebar models view
│   │   ├── FunzVariablesProvider.ts # Sidebar variables view
│   │   └── FunzResultsProvider.ts # Sidebar results view
│   └── utils/
│       └── getNonce.ts           # Security utilities
├── package.json                  # Extension manifest
└── tsconfig.json                # TypeScript config
```

### Key Components

**FunzService**: Wraps Funz CLI commands (fzi, fzc, fzo, fzr) with a clean TypeScript API

**FunzControlPanel**: Webview-based UI for:
- Model and template selection
- Variable detection and configuration
- Simulation execution

**FunzResultsViewer**: Webview-based dataframe viewer for:
- Displaying results in table format
- Filtering and searching
- Exporting to CSV

**Tree Data Providers**: Sidebar navigation for models, variables, and results

## Development

### Building the Extension

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Package extension
npm run package
```

### Testing Locally

1. Open this project in VSCode
2. Press `F5` to launch Extension Development Host
3. Test the extension in the new window

### Publishing

```bash
# Package as VSIX
vsce package

# Publish to marketplace
vsce publish
```

## Funz Integration

This extension integrates with the Funz Python package (`fz`) and uses the following commands:

- **fzi**: Parse input files and detect variables
- **fzc**: Compile templates with variable substitution
- **fzo**: Parse output files and extract results
- **fzr**: Run complete parametric simulations

All commands are executed through Python subprocess calls, with progress tracking and error handling.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

### Areas for Contribution

- Additional visualization types (charts, plots)
- Model editor with syntax highlighting
- Advanced filtering and data analysis
- Integration with cloud compute resources
- Support for additional calculators
- Performance optimizations

## Troubleshooting

### "Command not found: fzi"

Ensure the `fz` package is installed in your Python environment:
```bash
pip install fz
# or check installation
python -m fz.fzi --help
```

### "No models found"

Create a `.fz/models/` directory in your workspace and add model JSON files.

### Variables not detected

Ensure your template uses the correct variable prefix (default: `$`) and that you've selected the appropriate model.

### Simulation fails to run

- Check that the calculator path is correct
- Verify your simulation script has execute permissions
- Review the output in the Funz Simulation output channel

## License

MIT License - see LICENSE file for details

## Credits

This extension is a GUI wrapper for the [Funz framework](https://github.com/Funz/fz), developed by the Funz organization.

## Links

- [Funz Website](https://funz.github.io/)
- [Funz Python Package](https://github.com/Funz/fz)
- [Funz Documentation](https://funz.github.io/docs/)
- [VSCode Extension API](https://code.visualstudio.com/api)

---

**Enjoy parametric simulations with Funz GUI!** 🚀
