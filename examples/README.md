# Funz VSCode Extension - Examples

This directory contains example projects to help you get started with the Funz VSCode extension.

## Examples Included

### 1. Simple Mathematical Model (`simple-math/`)

A basic example demonstrating variable substitution and formula evaluation.

**What it demonstrates:**
- Basic variable syntax (`$variable`)
- Formula evaluation (`@{expression}`)
- Simple output parsing

**Use case:** Learning Funz basics

### 2. Perfect Gas Simulation (`perfect-gas/`)

A more realistic example simulating ideal gas behavior.

**What it demonstrates:**
- Multiple input variables
- Physical constants and formulas
- Parametric studies (grid search)
- Multiple output extraction

**Use case:** Scientific simulation workflow

### 3. Data Processing Pipeline (`data-pipeline/`)

Example of using Funz for data processing workflows.

**What it demonstrates:**
- String variables
- File path handling
- Custom output parsing
- Shell script integration

**Use case:** Data engineering tasks

## Getting Started

### Quick Start

1. Copy one of the example directories to your workspace
2. Open it in VSCode
3. Open the Funz Control Panel (`Ctrl+Shift+P` → "Funz: Open Control Panel")
4. Select the template file
5. Select the model
6. Click "Detect Variables"
7. Set variable values
8. Click "Run Simulation"

### Example 1: Simple Math

```bash
cd examples/simple-math
```

**Files:**
- `template.txt`: Input template with variables
- `.fz/models/calculator.json`: Model configuration
- `run.sh`: Execution script

**Try it:**
1. Variables: `x = [1, 2, 3]`, `y = [10, 20]`
2. This creates 6 simulations (Cartesian product)
3. Results show `x`, `y`, and computed `result = x * y`

### Example 2: Perfect Gas

```bash
cd examples/perfect-gas
```

**Files:**
- `input.txt`: Gas simulation input template
- `.fz/models/perfectgas.json`: Model configuration
- `simulate.py`: Python simulation script

**Try it:**
1. Variables:
   - `temperature = [273.15, 298.15, 373.15]` (K)
   - `pressure = [101325, 202650]` (Pa)
   - `n_mol = 1`
2. Results show pressure, volume, temperature relationships

### Example 3: Data Pipeline

```bash
cd examples/data-pipeline
```

**Files:**
- `config.txt`: Pipeline configuration template
- `.fz/models/pipeline.json`: Model configuration
- `process.sh`: Data processing script

**Try it:**
1. Variables:
   - `input_file = ["data1.csv", "data2.csv"]`
   - `filter_threshold = [0.5, 0.7, 0.9]`
2. Demonstrates string variables and file handling

## Creating Your Own Example

### Step 1: Create Directory Structure

```bash
mkdir my-example
cd my-example
mkdir -p .fz/models
mkdir templates
mkdir scripts
```

### Step 2: Create Model Configuration

`.fz/models/mymodel.json`:

```json
{
  "varprefix": "$",
  "formulaprefix": "@",
  "delim": "{}",
  "commentline": "#",
  "interpreter": "python",
  "output": {
    "my_output": "grep 'RESULT:' output.txt | awk '{print $2}'"
  }
}
```

### Step 3: Create Template

`templates/input.txt`:

```
# My Template
parameter1=$param1
parameter2=$param2
computed=@{$param1 + $param2}
```

### Step 4: Create Execution Script

`scripts/run.sh`:

```bash
#!/bin/bash
# Read input
source input.txt

# Do computation
echo "RESULT: $((parameter1 + parameter2))" > output.txt
```

### Step 5: Test in VSCode

1. Open the directory in VSCode
2. Use Funz Control Panel to:
   - Select `templates/input.txt`
   - Select model `mymodel`
   - Detect variables
   - Set values and run

## Tips and Best Practices

### Variable Naming

✅ **Good:**
```
$temperature_celsius
$pressure_pa
$velocity_ms
```

❌ **Avoid:**
```
$temp  # Unclear units
$x     # Not descriptive
$p1    # Meaningless name
```

### Formula Usage

**Simple formulas:**
```
result=@{$x * $y}
```

**Complex formulas with functions:**
```
#@ def celsius_to_kelvin(c): return c + 273.15
temp_k=@{celsius_to_kelvin($temp_c)}
```

**Multi-line formulas:**
```
#@ def complex_calc(x, y):
#@     intermediate = x * y
#@     return intermediate ** 2
result=@{complex_calc($x, $y)}
```

### Output Parsing

**Simple grep:**
```json
{
  "output": {
    "value": "grep 'Value:' output.txt | awk '{print $2}'"
  }
}
```

**Multiple outputs:**
```json
{
  "output": {
    "min": "grep 'Min:' output.txt | cut -d: -f2",
    "max": "grep 'Max:' output.txt | cut -d: -f2",
    "avg": "grep 'Avg:' output.txt | cut -d: -f2"
  }
}
```

**Python parsing:**
```json
{
  "output": {
    "json_value": "python -c \"import json; print(json.load(open('output.json'))['result'])\""
  }
}
```

### Grid Search Strategies

**Full factorial:**
```javascript
{
  "x": [1, 2, 3],
  "y": [10, 20, 30]
}
// Creates 9 combinations: (1,10), (1,20), (1,30), (2,10), ...
```

**Paired values:**
Use separate runs for paired values, as Funz creates Cartesian products.

**Range exploration:**
```javascript
{
  "temperature": [250, 275, 300, 325, 350],
  "pressure": [1e5, 2e5, 3e5, 4e5, 5e5]
}
// Creates 25 combinations for response surface
```

## Troubleshooting Examples

### "Variables not detected"

**Check:**
- Variable prefix matches model (`$` by default)
- Template file is plain text
- No Unicode or special characters in variable names

### "Simulation fails immediately"

**Check:**
- Execution script has execute permissions (`chmod +x script.sh`)
- Script path is correct in calculator setting
- Script can run independently: `bash script.sh`

### "No outputs in results"

**Check:**
- Output commands in model are correct
- Output files are generated by script
- Grep patterns match actual output format

### "Grid search creates too many runs"

**Remember:** Funz creates Cartesian product!
- 3 values × 3 values × 3 values = 27 runs
- Use fewer values for initial exploration
- Add more values after verifying it works

## Advanced Examples

### Using Remote Calculators

```javascript
// In Control Panel:
Calculator: "ssh://user@server/home/user/run.sh"
```

### Chaining Calculators

Configure multiple calculators for parallel execution across resources.

### Using Cache

```javascript
// In Control Panel:
Calculator: "cache://previous_results"
```

This reuses results from previous runs with matching parameters.

### Custom Interpreters

In model JSON:

```json
{
  "interpreter": "R",
  "formulaprefix": "@",
  "delim": "()"
}
```

Template:
```
result=@(x * y + sqrt(z))
```

## Contributing Examples

Have a great example? Please contribute!

1. Create a new directory under `examples/`
2. Include all necessary files
3. Add a README.md explaining the example
4. Submit a pull request

## Resources

- [Funz Documentation](https://funz.github.io/docs/)
- [Funz Python Package](https://github.com/Funz/fz)
- [VSCode Extension Documentation](../README.md)
