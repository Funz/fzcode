# Funz VSCode Extension - Design Document

## Overview

This document describes the architecture and design decisions for the Funz VSCode GUI extension.

## Goals

1. **Simplify Funz usage**: Provide an intuitive GUI for users who prefer visual interfaces over CLI
2. **Maintain full functionality**: Support all major Funz features (fzi, fzc, fzo, fzr)
3. **Enhance productivity**: Auto-detection, validation, and real-time feedback
4. **Extensibility**: Design for future enhancements (plotting, advanced analysis, etc.)

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────┐
│           VSCode Extension Host                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Activity Bar │  │ Command      │            │
│  │ (Funz Icon)  │  │ Palette      │            │
│  └──────┬───────┘  └──────┬───────┘            │
│         │                 │                     │
│         v                 v                     │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Sidebar Views│  │ Webview      │            │
│  │ - Models     │  │ Panels       │            │
│  │ - Variables  │  │ - Control    │            │
│  │ - Results    │  │ - Results    │            │
│  └──────┬───────┘  └──────┬───────┘            │
│         │                 │                     │
│         └────────┬────────┘                     │
│                  │                              │
│           ┌──────v──────┐                       │
│           │ FunzService │                       │
│           │ (Core API)  │                       │
│           └──────┬──────┘                       │
│                  │                              │
└──────────────────┼──────────────────────────────┘
                   │
                   v
            ┌──────────────┐
            │ Python + fz  │
            │ (CLI Tools)  │
            └──────────────┘
```

### Layer Separation

1. **Presentation Layer** (Webviews, Tree Views)
   - User interface components
   - No direct business logic
   - Communicates via message passing

2. **Application Layer** (Extension, Providers)
   - VSCode integration
   - Command registration
   - Event handling
   - State management

3. **Service Layer** (FunzService)
   - Core business logic
   - Funz CLI integration
   - Data transformation
   - Error handling

4. **Infrastructure Layer** (Python/fz)
   - Actual computation
   - File system operations
   - External process execution

## Key Design Decisions

### 1. Webview vs Native UI

**Decision**: Use webviews for complex panels (Control Panel, Results Viewer)

**Rationale**:
- Rich, interactive UI capabilities (tables, forms, dynamic updates)
- Easier to implement complex layouts with HTML/CSS
- Better for data visualization

**Trade-offs**:
- Higher memory usage
- Requires message passing protocol
- More complex state management

**Alternative Considered**: Native VSCode UI (QuickPick, InputBox)
- Rejected: Too limited for complex forms and data tables

### 2. Process Execution Strategy

**Decision**: Execute Funz commands as child processes via Node.js `child_process`

**Rationale**:
- Simple integration with existing Python CLI
- No need to reimplement Funz logic
- Easy to upgrade when fz package updates
- Users can verify behavior matches CLI

**Trade-offs**:
- Requires Python installation
- Subprocess overhead
- Harder to debug

**Alternative Considered**: Native TypeScript implementation
- Rejected: Too much duplication, hard to maintain parity

### 3. Model Storage

**Decision**: Read models from `.fz/models/` directory (JSON/YAML files)

**Rationale**:
- Consistent with Funz conventions
- Easy to edit with text editors
- Version control friendly
- Workspace-specific configuration

**Trade-offs**:
- Users must manually create directory structure
- No GUI model editor (yet)

**Future Enhancement**: Visual model configuration editor

### 4. Results Format

**Decision**: Support multiple formats (JSON, CSV, table) with JSON as primary

**Rationale**:
- JSON preserves type information
- Easy to parse in TypeScript
- Flexible structure for different result shapes
- CSV available for export

**Trade-offs**:
- JSON can be large for many results
- Requires parsing overhead

### 5. State Management

**Decision**: Stateless webviews with on-demand data loading

**Rationale**:
- Simpler to implement
- Less memory usage when panels closed
- Always shows fresh data

**Trade-offs**:
- Reloading required after changes
- Can't preserve complex UI state

**Future Enhancement**: Implement state persistence for form values

## UI Design

### Control Panel Layout

```
┌─────────────────────────────────────┐
│ 📁 Template & Model                 │
│ ┌─────────────────────────────────┐ │
│ │ Template: [Browse] [input.txt]  │ │
│ │ Model:    [dropdown: perfectgas]│ │
│ │ [🔍 Detect Variables]           │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ⚙️ Variables                         │
│ ┌─────────────────────────────────┐ │
│ │ $temperature │ Single │ [25]    │ │
│ │ $pressure    │ Array  │ [1,2,3] │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 📊 Output Selection                 │
│ ┌─────────────────────────────────┐ │
│ │ ☑ result_1                      │ │
│ │ ☑ result_2                      │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 🚀 Execution                         │
│ ┌─────────────────────────────────┐ │
│ │ Calculator: [sh://bash]         │ │
│ │ Results:    [results/]          │ │
│ │ [📝 Compile] [▶️ Run Simulation] │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Results Viewer Layout

```
┌─────────────────────────────────────┐
│ Toolbar                             │
│ [results/] [model ▾] [Load] [CSV]  │
├─────────────────────────────────────┤
│ Statistics                          │
│ Total: 12 │ Params: 2 │ Outputs: 3 │
├─────────────────────────────────────┤
│ Filter: [search...]                 │
├─────────────────────────────────────┤
│ Table                               │
│ ┌───┬─────┬─────┬────┬────┬────┐  │
│ │ # │ T   │ P   │ R1 │ R2 │ R3 │  │
│ ├───┼─────┼─────┼────┼────┼────┤  │
│ │ 1 │ 10  │ 1.0 │ 42 │ 84 │ 21 │  │
│ │ 2 │ 20  │ 1.0 │ 43 │ 85 │ 22 │  │
│ │ 3 │ 30  │ 1.0 │ 44 │ 86 │ 23 │  │
│ └───┴─────┴─────┴────┴────┴────┘  │
└─────────────────────────────────────┘
```

## Data Flow

### Variable Detection Flow

```
User clicks "Detect Variables"
    ↓
Control Panel → FunzService.detectVariables()
    ↓
Execute: python -m fz.fzi template.txt --model X --format json
    ↓
Parse JSON response
    ↓
Update webview with variable list
    ↓
User sees variables in UI
```

### Simulation Execution Flow

```
User clicks "Run Simulation"
    ↓
Control Panel collects form data
    ↓
FunzService.runSimulation()
    ↓
Spawn: python -m fz.fzr template.txt --model X --variables {...}
    ↓
Stream output to Output Channel (real-time)
    ↓
On completion:
    - Show success notification
    - Refresh results sidebar
    ↓
User can view results
```

### Results Loading Flow

```
User selects results directory
    ↓
Results Viewer → FunzService.parseOutput()
    ↓
Execute: python -m fz.fzo results/ --model X --format json
    ↓
Parse JSON response
    ↓
Transform to table format:
    - Separate parameters from outputs
    - Format numbers
    - Build HTML table
    ↓
Update webview with data
    ↓
User sees interactive table
```

## Error Handling

### Strategy

1. **Validation at UI**: Prevent invalid inputs before submission
2. **Service-level checks**: Verify file existence, model availability
3. **Process error capture**: Catch stderr from Python processes
4. **User-friendly messages**: Convert technical errors to actionable messages
5. **Graceful degradation**: Show partial results when possible

### Error Categories

| Error Type | Handling Strategy | Example |
|------------|------------------|---------|
| Configuration | Show notification, don't execute | Python not found |
| Validation | Highlight field, show inline error | Empty template path |
| Execution | Show error dialog with details | Simulation crashed |
| Parsing | Log error, show empty state | Invalid JSON response |

## Performance Considerations

### Optimizations

1. **Lazy Loading**: Load models/results only when needed
2. **File Watchers**: Use VSCode's efficient file watching
3. **Debouncing**: Debounce filter inputs to reduce redraws
4. **Virtual Scrolling**: Consider for very large result tables (future)
5. **Caching**: Let Funz handle caching, don't duplicate

### Scalability

| Scenario | Current Limit | Future Enhancement |
|----------|--------------|-------------------|
| Variables | ~50 | Virtual list |
| Results rows | ~10,000 | Virtual scrolling |
| Result columns | ~20 | Horizontal scroll |
| Concurrent simulations | 4 (configurable) | Dynamic based on CPU |

## Security

### Considerations

1. **Content Security Policy**: Strict CSP for webviews
2. **Nonce validation**: Random nonces for inline scripts
3. **Path validation**: Verify all file paths before execution
4. **Command injection**: Use `execFile` not `exec`, never string interpolation
5. **User data**: Don't store sensitive information

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| Malicious template files | Sandboxed execution, user confirmation |
| Path traversal | Validate all paths, restrict to workspace |
| Code injection in variables | JSON parsing, no eval |
| XSS in webview | CSP, HTML escaping |

## Future Enhancements

### Short Term (v1.1)

- [ ] Syntax highlighting for Funz templates
- [ ] Model configuration editor
- [ ] Plot generation from results
- [ ] Better progress indication

### Medium Term (v1.5)

- [ ] Multi-workspace support
- [ ] Remote calculator management UI
- [ ] Result comparison tools
- [ ] Export to Excel

### Long Term (v2.0)

- [ ] Real-time collaboration
- [ ] Cloud execution integration
- [ ] Advanced statistical analysis
- [ ] Machine learning integration
- [ ] Custom visualization plugins

## Testing Strategy

### Unit Tests

- FunzService methods
- Data transformation functions
- Validation logic

### Integration Tests

- Full command execution
- Webview message passing
- File system operations

### Manual Testing Checklist

- [ ] Install extension in fresh VSCode
- [ ] Create new Funz project
- [ ] Detect variables in template
- [ ] Run single-value simulation
- [ ] Run grid search (multiple values)
- [ ] View results in Results Viewer
- [ ] Export to CSV
- [ ] Error handling (missing files, invalid values)

## Accessibility

- Keyboard navigation in all panels
- ARIA labels for controls
- High contrast theme support
- Screen reader friendly tables
- Descriptive error messages

## Internationalization

Currently English-only. Future i18n considerations:

- Extract all user-facing strings
- Use VSCode's l10n API
- Support for non-ASCII variable names
- Locale-aware number formatting

## References

- [VSCode Extension API](https://code.visualstudio.com/api)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [Tree View API](https://code.visualstudio.com/api/extension-guides/tree-view)
- [Funz Documentation](https://funz.github.io/docs/)
