import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { FunzService } from '../funz/FunzService';

export class FunzModelsTreeProvider implements vscode.TreeDataProvider<ModelItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ModelItem | undefined | null | void> = new vscode.EventEmitter<ModelItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ModelItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private funzService: FunzService) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ModelItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ModelItem): Promise<ModelItem[]> {
        if (!element) {
            // Root level - show models
            const models = await this.funzService.getAvailableModels();
            return models.map(model => new ModelItem(
                model,
                vscode.TreeItemCollapsibleState.Collapsed
            ));
        } else {
            // Show model details
            const config = await this.funzService.getModelConfig(element.label as string);
            if (!config) {
                return [];
            }

            const items: ModelItem[] = [];

            // Add configuration properties
            if (config.varprefix) {
                items.push(new ModelItem(
                    `Variable Prefix: ${config.varprefix}`,
                    vscode.TreeItemCollapsibleState.None,
                    'property'
                ));
            }

            if (config.formulaprefix) {
                items.push(new ModelItem(
                    `Formula Prefix: ${config.formulaprefix}`,
                    vscode.TreeItemCollapsibleState.None,
                    'property'
                ));
            }

            if (config.interpreter) {
                items.push(new ModelItem(
                    `Interpreter: ${config.interpreter}`,
                    vscode.TreeItemCollapsibleState.None,
                    'property'
                ));
            }

            if (config.output) {
                const outputCount = Object.keys(config.output).length;
                items.push(new ModelItem(
                    `Outputs: ${outputCount}`,
                    vscode.TreeItemCollapsibleState.None,
                    'property'
                ));
            }

            return items;
        }
    }
}

class ModelItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly type: string = 'model'
    ) {
        super(label, collapsibleState);

        if (type === 'model') {
            this.iconPath = new vscode.ThemeIcon('file-code');
            this.contextValue = 'funzModel';
        } else {
            this.iconPath = new vscode.ThemeIcon('symbol-property');
            this.contextValue = 'funzModelProperty';
        }
    }
}
