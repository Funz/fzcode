import * as vscode from 'vscode';

export class FunzVariablesTreeProvider implements vscode.TreeDataProvider<VariableItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<VariableItem | undefined | null | void> = new vscode.EventEmitter<VariableItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<VariableItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private variables: string[] = [];

    constructor(private funzService: any) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    updateVariables(variables: string[]): void {
        this.variables = variables;
        this.refresh();
    }

    getTreeItem(element: VariableItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: VariableItem): Promise<VariableItem[]> {
        if (!element) {
            if (this.variables.length === 0) {
                return [new VariableItem('No variables detected', vscode.TreeItemCollapsibleState.None, 'empty')];
            }

            return this.variables.map(v => new VariableItem(
                v,
                vscode.TreeItemCollapsibleState.None,
                'variable'
            ));
        }

        return [];
    }
}

class VariableItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly type: string = 'variable'
    ) {
        super(label, collapsibleState);

        if (type === 'variable') {
            this.iconPath = new vscode.ThemeIcon('symbol-variable');
            this.contextValue = 'funzVariable';
            this.tooltip = `Variable: ${label}`;
        } else {
            this.iconPath = new vscode.ThemeIcon('info');
            this.contextValue = 'empty';
        }
    }
}
