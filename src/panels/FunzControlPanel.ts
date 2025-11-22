import * as vscode from 'vscode';
import * as path from 'path';
import { FunzService, FunzVariable, FunzOutput } from '../funz/FunzService';
import { getNonce } from '../utils/getNonce';

export class FunzControlPanelProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'funzControlPanel';
    private static currentPanel: FunzControlPanelProvider | undefined;

    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _funzService: FunzService
    ) {}

    public static createOrShow(extensionUri: vscode.Uri, funzService: FunzService) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // Create new panel
        const panel = vscode.window.createWebviewPanel(
            FunzControlPanelProvider.viewType,
            'Funz Control Panel',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        const provider = new FunzControlPanelProvider(extensionUri, funzService);
        provider.updateWebview(panel.webview);

        panel.webview.onDidReceiveMessage(
            message => provider.handleMessage(message),
            undefined,
            []
        );
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        this.updateWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(
            message => this.handleMessage(message)
        );
    }

    private async handleMessage(message: any) {
        switch (message.type) {
            case 'getModels':
                const models = await this._funzService.getAvailableModels();
                this.postMessage({ type: 'modelsList', models });
                break;

            case 'selectModel':
                await this.handleModelSelection(message.model);
                break;

            case 'detectVariables':
                await this.handleDetectVariables(message.filePath, message.model);
                break;

            case 'getOutputs':
                await this.handleGetOutputs(message.model);
                break;

            case 'compile':
                await this.handleCompile(message.data);
                break;

            case 'runSimulation':
                await this.handleRunSimulation(message.data);
                break;

            case 'selectFile':
                await this.handleSelectFile();
                break;

            case 'selectResultsDir':
                await this.handleSelectResultsDir();
                break;
        }
    }

    private async handleModelSelection(modelName: string) {
        try {
            const config = await this._funzService.getModelConfig(modelName);
            this.postMessage({ type: 'modelConfig', config });
        } catch (error) {
            vscode.window.showErrorMessage(`Error loading model: ${error}`);
        }
    }

    private async handleDetectVariables(filePath: string, model: string) {
        try {
            const variables = await this._funzService.detectVariables(filePath, model);
            this.postMessage({
                type: 'variablesDetected',
                variables: variables.map(name => ({ name, value: '', type: 'single' }))
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Error detecting variables: ${error}`);
        }
    }

    private async handleGetOutputs(model: string) {
        try {
            const outputs = await this._funzService.getModelOutputs(model);
            this.postMessage({ type: 'outputsList', outputs });
        } catch (error) {
            vscode.window.showErrorMessage(`Error getting outputs: ${error}`);
        }
    }

    private async handleCompile(data: any) {
        const { templatePath, model, variables, outputDir } = data;

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Compiling template...',
                cancellable: false
            }, async () => {
                await this._funzService.compileTemplate(
                    templatePath,
                    model,
                    variables,
                    outputDir
                );
            });

            vscode.window.showInformationMessage(`Template compiled successfully to ${outputDir}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Compilation failed: ${error}`);
        }
    }

    private async handleRunSimulation(data: any) {
        const { templatePath, model, variables, calculator, resultsDir } = data;

        const outputChannel = vscode.window.createOutputChannel('Funz Simulation');
        outputChannel.show();

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Running simulation...',
                cancellable: false
            }, async () => {
                await this._funzService.runSimulation(
                    templatePath,
                    model,
                    variables,
                    calculator,
                    resultsDir,
                    (message) => {
                        outputChannel.appendLine(message);
                    }
                );
            });

            vscode.window.showInformationMessage('Simulation completed successfully!');
            outputChannel.appendLine('\n=== Simulation completed ===');
        } catch (error) {
            vscode.window.showErrorMessage(`Simulation failed: ${error}`);
            outputChannel.appendLine(`\nError: ${error}`);
        }
    }

    private async handleSelectFile() {
        const result = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            openLabel: 'Select Template File',
            filters: {
                'All Files': ['*'],
                'Text Files': ['txt', 'dat', 'inp', 'template']
            }
        });

        if (result && result[0]) {
            this.postMessage({
                type: 'fileSelected',
                filePath: result[0].fsPath
            });
        }
    }

    private async handleSelectResultsDir() {
        const result = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Results Directory'
        });

        if (result && result[0]) {
            this.postMessage({
                type: 'resultsDirSelected',
                dirPath: result[0].fsPath
            });
        }
    }

    private postMessage(message: any) {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
    }

    private updateWebview(webview: vscode.Webview) {
        webview.html = this.getHtmlForWebview(webview);
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>Funz Control Panel</title>
    <style>
        body {
            padding: 10px;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
        }
        .section {
            margin-bottom: 20px;
            padding: 15px;
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
        }
        .section-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 10px;
            color: var(--vscode-foreground);
        }
        .form-group {
            margin-bottom: 12px;
        }
        label {
            display: block;
            margin-bottom: 4px;
            font-size: 13px;
        }
        input, select, textarea {
            width: 100%;
            padding: 6px 8px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
            font-family: var(--vscode-font-family);
            font-size: 13px;
        }
        button {
            padding: 6px 14px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
            font-size: 13px;
            margin-right: 8px;
            margin-top: 8px;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        button.secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        button.secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        .variable-item {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
            align-items: flex-start;
        }
        .variable-item input {
            flex: 1;
        }
        .variable-name {
            min-width: 120px;
            padding: 6px 8px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 2px;
            font-family: monospace;
            font-size: 12px;
            display: flex;
            align-items: center;
        }
        .variable-type {
            min-width: 80px;
        }
        .output-item {
            padding: 8px;
            margin-bottom: 6px;
            background: var(--vscode-list-inactiveSelectionBackground);
            border-radius: 2px;
        }
        .output-item label {
            display: flex;
            align-items: center;
            cursor: pointer;
        }
        .output-item input[type="checkbox"] {
            width: auto;
            margin-right: 8px;
        }
        .help-text {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }
        .inline-buttons {
            display: flex;
            gap: 8px;
        }
        .status {
            padding: 8px;
            margin-top: 10px;
            border-radius: 2px;
            font-size: 12px;
        }
        .status.info {
            background: var(--vscode-inputValidation-infoBackground);
            border: 1px solid var(--vscode-inputValidation-infoBorder);
        }
        .status.error {
            background: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
        }
    </style>
</head>
<body>
    <div class="section">
        <div class="section-title">📁 Template & Model</div>
        <div class="form-group">
            <label>Template File</label>
            <div class="inline-buttons">
                <input type="text" id="templatePath" placeholder="Select template file..." readonly>
                <button onclick="selectFile()">Browse</button>
            </div>
        </div>
        <div class="form-group">
            <label>Model</label>
            <select id="modelSelect" onchange="onModelChange()">
                <option value="">Select a model...</option>
            </select>
        </div>
        <button onclick="detectVariables()">🔍 Detect Variables</button>
    </div>

    <div class="section">
        <div class="section-title">⚙️ Variables</div>
        <div id="variablesList"></div>
        <div class="help-text">
            Use single values or arrays for grid search.<br>
            Examples: 25, [10, 20, 30], or "text value"
        </div>
    </div>

    <div class="section">
        <div class="section-title">📊 Output Selection</div>
        <div id="outputsList"></div>
    </div>

    <div class="section">
        <div class="section-title">🚀 Execution</div>
        <div class="form-group">
            <label>Calculator</label>
            <input type="text" id="calculator" value="sh://bash" placeholder="sh://bash">
            <div class="help-text">Examples: sh://bash, ssh://user@host/command</div>
        </div>
        <div class="form-group">
            <label>Results Directory</label>
            <div class="inline-buttons">
                <input type="text" id="resultsDir" value="results" placeholder="results">
                <button onclick="selectResultsDir()">Browse</button>
            </div>
        </div>
        <div>
            <button onclick="compileTemplate()">📝 Compile Only</button>
            <button onclick="runSimulation()">▶️ Run Simulation</button>
        </div>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        let currentVariables = [];
        let currentOutputs = [];

        // Request initial data
        vscode.postMessage({ type: 'getModels' });

        // Message handler
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'modelsList':
                    updateModelsList(message.models);
                    break;
                case 'variablesDetected':
                    updateVariablesList(message.variables);
                    break;
                case 'outputsList':
                    updateOutputsList(message.outputs);
                    break;
                case 'fileSelected':
                    document.getElementById('templatePath').value = message.filePath;
                    break;
                case 'resultsDirSelected':
                    document.getElementById('resultsDir').value = message.dirPath;
                    break;
            }
        });

        function updateModelsList(models) {
            const select = document.getElementById('modelSelect');
            select.innerHTML = '<option value="">Select a model...</option>';
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                select.appendChild(option);
            });
        }

        function updateVariablesList(variables) {
            currentVariables = variables;
            const container = document.getElementById('variablesList');
            if (variables.length === 0) {
                container.innerHTML = '<div class="help-text">No variables detected. Select a template and model, then click "Detect Variables".</div>';
                return;
            }

            container.innerHTML = variables.map((v, i) => \`
                <div class="variable-item">
                    <div class="variable-name">\${v.name}</div>
                    <select class="variable-type" id="varType_\${i}" onchange="onVariableTypeChange(\${i})">
                        <option value="single">Single</option>
                        <option value="array">Array</option>
                    </select>
                    <input type="text" id="varValue_\${i}" placeholder="Enter value..." value="\${v.value || ''}">
                </div>
            \`).join('');
        }

        function updateOutputsList(outputs) {
            currentOutputs = outputs;
            const container = document.getElementById('outputsList');
            if (outputs.length === 0) {
                container.innerHTML = '<div class="help-text">No outputs defined in the selected model.</div>';
                return;
            }

            container.innerHTML = outputs.map((o, i) => \`
                <div class="output-item">
                    <label>
                        <input type="checkbox" id="output_\${i}" checked>
                        <strong>\${o.name}</strong>
                    </label>
                    <div class="help-text">\${o.command}</div>
                </div>
            \`).join('');
        }

        function onModelChange() {
            const model = document.getElementById('modelSelect').value;
            if (model) {
                vscode.postMessage({ type: 'selectModel', model });
                vscode.postMessage({ type: 'getOutputs', model });
            }
        }

        function onVariableTypeChange(index) {
            const typeSelect = document.getElementById(\`varType_\${index}\`);
            const valueInput = document.getElementById(\`varValue_\${index}\`);

            if (typeSelect.value === 'array') {
                valueInput.placeholder = 'e.g., [10, 20, 30]';
            } else {
                valueInput.placeholder = 'Enter value...';
            }
        }

        function selectFile() {
            vscode.postMessage({ type: 'selectFile' });
        }

        function selectResultsDir() {
            vscode.postMessage({ type: 'selectResultsDir' });
        }

        function detectVariables() {
            const templatePath = document.getElementById('templatePath').value;
            const model = document.getElementById('modelSelect').value;

            if (!templatePath) {
                alert('Please select a template file first');
                return;
            }
            if (!model) {
                alert('Please select a model first');
                return;
            }

            vscode.postMessage({
                type: 'detectVariables',
                filePath: templatePath,
                model: model
            });
        }

        function getVariablesObject() {
            const variables = {};
            currentVariables.forEach((v, i) => {
                const value = document.getElementById(\`varValue_\${i}\`).value;
                const type = document.getElementById(\`varType_\${i}\`).value;

                if (value) {
                    if (type === 'array') {
                        try {
                            variables[v.name] = JSON.parse(value);
                        } catch (e) {
                            // Try parsing as comma-separated values
                            variables[v.name] = value.split(',').map(x => x.trim());
                        }
                    } else {
                        // Try to parse as number
                        const num = Number(value);
                        variables[v.name] = isNaN(num) ? value : num;
                    }
                }
            });
            return variables;
        }

        function compileTemplate() {
            const templatePath = document.getElementById('templatePath').value;
            const model = document.getElementById('modelSelect').value;
            const outputDir = document.getElementById('resultsDir').value + '_compiled';
            const variables = getVariablesObject();

            if (!templatePath || !model) {
                alert('Please select template and model');
                return;
            }

            vscode.postMessage({
                type: 'compile',
                data: { templatePath, model, variables, outputDir }
            });
        }

        function runSimulation() {
            const templatePath = document.getElementById('templatePath').value;
            const model = document.getElementById('modelSelect').value;
            const calculator = document.getElementById('calculator').value;
            const resultsDir = document.getElementById('resultsDir').value;
            const variables = getVariablesObject();

            if (!templatePath || !model) {
                alert('Please select template and model');
                return;
            }

            if (Object.keys(variables).length === 0) {
                alert('Please set at least one variable value');
                return;
            }

            vscode.postMessage({
                type: 'runSimulation',
                data: { templatePath, model, variables, calculator, resultsDir }
            });
        }
    </script>
</body>
</html>`;
    }
}
