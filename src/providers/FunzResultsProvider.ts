import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { FunzService } from '../funz/FunzService';

export class FunzResultsTreeProvider implements vscode.TreeDataProvider<ResultItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ResultItem | undefined | null | void> = new vscode.EventEmitter<ResultItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ResultItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private funzService: FunzService) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ResultItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ResultItem): Promise<ResultItem[]> {
        if (!element) {
            // Root level - find results directories
            const workspaceRoot = this.funzService.getWorkspaceRoot();
            const resultsDir = path.join(workspaceRoot, 'results');

            if (!fs.existsSync(resultsDir)) {
                return [new ResultItem('No results found', vscode.TreeItemCollapsibleState.None, '', 'empty')];
            }

            const dirs = fs.readdirSync(resultsDir, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => new ResultItem(
                    dirent.name,
                    vscode.TreeItemCollapsibleState.None,
                    path.join(resultsDir, dirent.name),
                    'result'
                ));

            if (dirs.length === 0) {
                return [new ResultItem('No results found', vscode.TreeItemCollapsibleState.None, '', 'empty')];
            }

            return dirs;
        }

        return [];
    }
}

class ResultItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly resultPath: string,
        public readonly type: string = 'result'
    ) {
        super(label, collapsibleState);

        if (type === 'result') {
            this.iconPath = new vscode.ThemeIcon('folder');
            this.contextValue = 'funzResult';
            this.tooltip = resultPath;
            this.command = {
                command: 'funz.parseOutput',
                title: 'View Results',
                arguments: [vscode.Uri.file(resultPath)]
            };
        } else {
            this.iconPath = new vscode.ThemeIcon('info');
            this.contextValue = 'empty';
        }
    }
}
