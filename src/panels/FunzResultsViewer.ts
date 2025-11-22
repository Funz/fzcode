import * as vscode from 'vscode';
import { FunzService, FunzResult } from '../funz/FunzService';
import { getNonce } from '../utils/getNonce';

export class FunzResultsViewerProvider {
    public static currentPanel: vscode.WebviewPanel | undefined;

    public static createOrShow(
        extensionUri: vscode.Uri,
        funzService: FunzService,
        resultsPath: string
    ) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (FunzResultsViewerProvider.currentPanel) {
            FunzResultsViewerProvider.currentPanel.reveal(column);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            'funzResultsViewer',
            'Funz Results Viewer',
            column || vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        FunzResultsViewerProvider.currentPanel = panel;

        // Reset when the current panel is closed
        panel.onDidDispose(() => {
            FunzResultsViewerProvider.currentPanel = undefined;
        }, null);

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.type) {
                    case 'loadResults':
                        await loadResults(panel, funzService, message.resultsPath, message.model);
                        break;
                    case 'exportCsv':
                        await exportToCsv(funzService, message.resultsPath, message.model);
                        break;
                    case 'selectResultsDir':
                        const result = await vscode.window.showOpenDialog({
                            canSelectFiles: false,
                            canSelectFolders: true,
                            canSelectMany: false,
                            openLabel: 'Select Results Directory'
                        });
                        if (result && result[0]) {
                            panel.webview.postMessage({
                                type: 'resultsDirSelected',
                                path: result[0].fsPath
                            });
                        }
                        break;
                }
            },
            undefined
        );

        updateWebviewContent(panel, resultsPath);
    }

    private static getHtmlForWebview(webview: vscode.Webview, resultsPath: string): string {
        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>Funz Results Viewer</title>
    <style>
        body {
            padding: 0;
            margin: 0;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
        }
        .toolbar {
            padding: 12px;
            background: var(--vscode-editor-background);
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
        }
        .toolbar input, .toolbar select {
            padding: 6px 8px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
            font-size: 13px;
        }
        .toolbar input {
            flex: 1;
            min-width: 200px;
        }
        .toolbar button {
            padding: 6px 14px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
            font-size: 13px;
        }
        .toolbar button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .toolbar button.secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .content {
            padding: 12px;
            overflow: auto;
            height: calc(100vh - 60px);
        }
        .stats {
            padding: 12px;
            margin-bottom: 16px;
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            display: flex;
            gap: 24px;
            flex-wrap: wrap;
        }
        .stat-item {
            display: flex;
            flex-direction: column;
        }
        .stat-label {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .stat-value {
            font-size: 18px;
            font-weight: 600;
        }
        .table-container {
            overflow: auto;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        thead {
            background: var(--vscode-editor-background);
            position: sticky;
            top: 0;
            z-index: 10;
        }
        th {
            padding: 10px 12px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid var(--vscode-panel-border);
            white-space: nowrap;
        }
        td {
            padding: 8px 12px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        tbody tr:hover {
            background: var(--vscode-list-hoverBackground);
        }
        .number-cell {
            text-align: right;
            font-family: monospace;
        }
        .param-column {
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
        }
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--vscode-descriptionForeground);
        }
        .empty-state h3 {
            margin-bottom: 12px;
        }
        .filter-container {
            margin-bottom: 16px;
            display: flex;
            gap: 8px;
        }
        .filter-container input {
            flex: 1;
            padding: 6px 8px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
        }
        .loading {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <input type="text" id="resultsPath" placeholder="Results directory path..." value="${resultsPath}" readonly>
        <button onclick="selectResultsDir()">Browse</button>
        <select id="modelSelect">
            <option value="">Select model...</option>
        </select>
        <button onclick="loadResults()">Load Results</button>
        <button class="secondary" onclick="exportCsv()">Export CSV</button>
    </div>

    <div class="content">
        <div id="loading" class="loading" style="display: none;">
            Loading results...
        </div>

        <div id="emptyState" class="empty-state">
            <h3>📊 No Results Loaded</h3>
            <p>Select a results directory and model, then click "Load Results"</p>
        </div>

        <div id="resultsContainer" style="display: none;">
            <div class="stats" id="stats"></div>

            <div class="filter-container">
                <input type="text" id="filterInput" placeholder="Filter results..." oninput="filterTable()">
            </div>

            <div class="table-container">
                <table id="resultsTable">
                    <thead id="tableHead"></thead>
                    <tbody id="tableBody"></tbody>
                </table>
            </div>
        </div>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        let allResults = [];
        let filteredResults = [];

        // Request models list
        window.addEventListener('load', () => {
            // Load available models
            vscode.postMessage({ type: 'getModels' });
        });

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'modelsList':
                    updateModelsList(message.models);
                    break;
                case 'resultsData':
                    displayResults(message.results);
                    break;
                case 'resultsDirSelected':
                    document.getElementById('resultsPath').value = message.path;
                    break;
            }
        });

        function updateModelsList(models) {
            const select = document.getElementById('modelSelect');
            select.innerHTML = '<option value="">Select model...</option>';
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                select.appendChild(option);
            });
        }

        function selectResultsDir() {
            vscode.postMessage({ type: 'selectResultsDir' });
        }

        function loadResults() {
            const resultsPath = document.getElementById('resultsPath').value;
            const model = document.getElementById('modelSelect').value;

            if (!resultsPath || !model) {
                alert('Please select both results directory and model');
                return;
            }

            document.getElementById('loading').style.display = 'block';
            document.getElementById('emptyState').style.display = 'none';
            document.getElementById('resultsContainer').style.display = 'none';

            vscode.postMessage({
                type: 'loadResults',
                resultsPath: resultsPath,
                model: model
            });
        }

        function displayResults(results) {
            document.getElementById('loading').style.display = 'none';

            if (!results || results.length === 0) {
                document.getElementById('emptyState').style.display = 'block';
                return;
            }

            allResults = results;
            filteredResults = results;

            // Show results container
            document.getElementById('resultsContainer').style.display = 'block';

            // Update statistics
            updateStats(results);

            // Build table
            buildTable(results);
        }

        function updateStats(results) {
            const statsContainer = document.getElementById('stats');

            const totalRuns = results.length;
            const paramNames = new Set();
            const outputNames = new Set();

            results.forEach(r => {
                Object.keys(r.parameters || {}).forEach(k => paramNames.add(k));
                Object.keys(r.outputs || {}).forEach(k => outputNames.add(k));
            });

            statsContainer.innerHTML = \`
                <div class="stat-item">
                    <div class="stat-label">Total Runs</div>
                    <div class="stat-value">\${totalRuns}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Parameters</div>
                    <div class="stat-value">\${paramNames.size}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Outputs</div>
                    <div class="stat-value">\${outputNames.size}</div>
                </div>
            \`;
        }

        function buildTable(results) {
            if (results.length === 0) return;

            // Collect all column names
            const paramColumns = new Set();
            const outputColumns = new Set();

            results.forEach(r => {
                Object.keys(r.parameters || {}).forEach(k => paramColumns.add(k));
                Object.keys(r.outputs || {}).forEach(k => outputColumns.add(k));
            });

            const allColumns = [...paramColumns, ...outputColumns];

            // Build header
            const thead = document.getElementById('tableHead');
            thead.innerHTML = \`
                <tr>
                    <th>#</th>
                    \${Array.from(paramColumns).map(col =>
                        \`<th class="param-column">\${col}</th>\`
                    ).join('')}
                    \${Array.from(outputColumns).map(col =>
                        \`<th>\${col}</th>\`
                    ).join('')}
                </tr>
            \`;

            // Build rows
            const tbody = document.getElementById('tableBody');
            tbody.innerHTML = results.map((result, index) => {
                const paramCells = Array.from(paramColumns).map(col => {
                    const value = result.parameters[col];
                    const className = typeof value === 'number' ? 'number-cell' : '';
                    return \`<td class="\${className}">\${formatValue(value)}</td>\`;
                }).join('');

                const outputCells = Array.from(outputColumns).map(col => {
                    const value = result.outputs[col];
                    const className = typeof value === 'number' ? 'number-cell' : '';
                    return \`<td class="\${className}">\${formatValue(value)}</td>\`;
                }).join('');

                return \`
                    <tr>
                        <td>\${index + 1}</td>
                        \${paramCells}
                        \${outputCells}
                    </tr>
                \`;
            }).join('');
        }

        function formatValue(value) {
            if (value === null || value === undefined) {
                return '<em>-</em>';
            }
            if (typeof value === 'number') {
                return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
            }
            return String(value);
        }

        function filterTable() {
            const filterText = document.getElementById('filterInput').value.toLowerCase();

            if (!filterText) {
                filteredResults = allResults;
            } else {
                filteredResults = allResults.filter(result => {
                    const allValues = [
                        ...Object.values(result.parameters || {}),
                        ...Object.values(result.outputs || {})
                    ].map(v => String(v).toLowerCase());

                    return allValues.some(v => v.includes(filterText));
                });
            }

            buildTable(filteredResults);
        }

        function exportCsv() {
            const resultsPath = document.getElementById('resultsPath').value;
            const model = document.getElementById('modelSelect').value;

            if (!resultsPath || !model) {
                alert('Please load results first');
                return;
            }

            vscode.postMessage({
                type: 'exportCsv',
                resultsPath: resultsPath,
                model: model
            });
        }
    </script>
</body>
</html>`;
    }
}

async function updateWebviewContent(
    panel: vscode.WebviewPanel,
    resultsPath: string
) {
    panel.webview.html = FunzResultsViewerProvider.getHtmlForWebview(
        panel.webview,
        resultsPath
    );
}

async function loadResults(
    panel: vscode.WebviewPanel,
    funzService: FunzService,
    resultsPath: string,
    model: string
) {
    try {
        const results = await funzService.parseOutput(resultsPath, model, 'json');
        panel.webview.postMessage({
            type: 'resultsData',
            results: results
        });
    } catch (error) {
        vscode.window.showErrorMessage(`Error loading results: ${error}`);
    }
}

async function exportToCsv(
    funzService: FunzService,
    resultsPath: string,
    model: string
) {
    try {
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('results.csv'),
            filters: {
                'CSV Files': ['csv']
            }
        });

        if (!saveUri) {
            return;
        }

        // Get results as CSV
        const results = await funzService.parseOutput(resultsPath, model, 'csv');

        // For CSV format, the parseOutput returns the raw CSV string
        // We need to handle this differently
        const { execFile } = require('child_process');
        const { promisify } = require('util');
        const execFileAsync = promisify(execFile);

        const config = vscode.workspace.getConfiguration('funz');
        const python = config.get('pythonPath', 'python');

        const { stdout } = await execFileAsync(
            python,
            ['-m', 'fz.fzo', resultsPath, '--model', model, '--format', 'csv'],
            { maxBuffer: 10 * 1024 * 1024 }
        );

        const fs = require('fs');
        fs.writeFileSync(saveUri.fsPath, stdout, 'utf-8');

        vscode.window.showInformationMessage(`Results exported to ${saveUri.fsPath}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Error exporting CSV: ${error}`);
    }
}
