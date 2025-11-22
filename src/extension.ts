import * as vscode from 'vscode';
import { FunzControlPanelProvider } from './panels/FunzControlPanel';
import { FunzResultsViewerProvider } from './panels/FunzResultsViewer';
import { FunzModelsTreeProvider } from './providers/FunzModelsProvider';
import { FunzVariablesTreeProvider } from './providers/FunzVariablesProvider';
import { FunzResultsTreeProvider } from './providers/FunzResultsProvider';
import { FunzService } from './funz/FunzService';

export function activate(context: vscode.ExtensionContext) {
    console.log('Funz VSCode extension is now active');

    // Initialize Funz service
    const funzService = new FunzService();

    // Register tree view providers
    const modelsProvider = new FunzModelsTreeProvider(funzService);
    const variablesProvider = new FunzVariablesTreeProvider(funzService);
    const resultsProvider = new FunzResultsTreeProvider(funzService);

    vscode.window.registerTreeDataProvider('funzModelsView', modelsProvider);
    vscode.window.registerTreeDataProvider('funzVariablesView', variablesProvider);
    vscode.window.registerTreeDataProvider('funzResultsView', resultsProvider);

    // Register Control Panel
    const controlPanelProvider = new FunzControlPanelProvider(context.extensionUri, funzService);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            FunzControlPanelProvider.viewType,
            controlPanelProvider
        )
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('funz.openControlPanel', () => {
            FunzControlPanelProvider.createOrShow(context.extensionUri, funzService);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('funz.openResultsViewer', async () => {
            const resultsDir = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Select Results Directory'
            });

            if (resultsDir && resultsDir[0]) {
                FunzResultsViewerProvider.createOrShow(
                    context.extensionUri,
                    funzService,
                    resultsDir[0].fsPath
                );
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('funz.detectVariables', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active text editor');
                return;
            }

            const model = await vscode.window.showQuickPick(
                funzService.getAvailableModels(),
                { placeHolder: 'Select a Funz model' }
            );

            if (!model) {
                return;
            }

            try {
                const variables = await funzService.detectVariables(
                    editor.document.fileName,
                    model
                );
                variablesProvider.updateVariables(variables);
                vscode.window.showInformationMessage(
                    `Detected ${variables.length} variable(s): ${variables.join(', ')}`
                );
            } catch (error) {
                vscode.window.showErrorMessage(`Error detecting variables: ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('funz.compileTemplate', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active text editor');
                return;
            }

            // Open control panel for configuration
            FunzControlPanelProvider.createOrShow(context.extensionUri, funzService);
            vscode.window.showInformationMessage('Configure variables in the Funz Control Panel');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('funz.runSimulation', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active text editor');
                return;
            }

            FunzControlPanelProvider.createOrShow(context.extensionUri, funzService);
            vscode.window.showInformationMessage('Configure and run simulation in the Funz Control Panel');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('funz.parseOutput', async (uri: vscode.Uri) => {
            const resultsPath = uri?.fsPath || await vscode.window.showInputBox({
                prompt: 'Enter results directory path',
                placeHolder: './results'
            });

            if (!resultsPath) {
                return;
            }

            FunzResultsViewerProvider.createOrShow(context.extensionUri, funzService, resultsPath);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('funz.refreshModels', () => {
            modelsProvider.refresh();
            vscode.window.showInformationMessage('Model list refreshed');
        })
    );

    // Auto-detect variables when opening template files
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(async (document) => {
            const config = vscode.workspace.getConfiguration('funz');
            if (!config.get('autoDetectVariables')) {
                return;
            }

            const text = document.getText();
            // Check if file contains Funz variables (starts with $ or @)
            if (text.match(/\$\w+|\@\{.*?\}/)) {
                // Auto-detect variables in the background
                try {
                    const models = await funzService.getAvailableModels();
                    if (models.length > 0) {
                        const variables = await funzService.detectVariables(
                            document.fileName,
                            models[0]
                        );
                        variablesProvider.updateVariables(variables);
                    }
                } catch (error) {
                    // Silent fail for auto-detection
                    console.error('Auto-detection failed:', error);
                }
            }
        })
    );

    // Watch for model changes
    const modelsWatcher = vscode.workspace.createFileSystemWatcher('**/.fz/models/**');
    modelsWatcher.onDidChange(() => modelsProvider.refresh());
    modelsWatcher.onDidCreate(() => modelsProvider.refresh());
    modelsWatcher.onDidDelete(() => modelsProvider.refresh());
    context.subscriptions.push(modelsWatcher);

    // Watch for results changes
    const resultsWatcher = vscode.workspace.createFileSystemWatcher('**/results/**');
    resultsWatcher.onDidChange(() => resultsProvider.refresh());
    resultsWatcher.onDidCreate(() => resultsProvider.refresh());
    resultsWatcher.onDidDelete(() => resultsProvider.refresh());
    context.subscriptions.push(resultsWatcher);
}

export function deactivate() {
    console.log('Funz VSCode extension is now deactivated');
}
