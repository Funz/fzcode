import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface FunzVariable {
    name: string;
    value?: string | number | number[];
    type?: 'single' | 'array' | 'range';
}

export interface FunzModel {
    name: string;
    path: string;
    config?: any;
}

export interface FunzOutput {
    name: string;
    command: string;
}

export interface FunzResult {
    parameters: Record<string, any>;
    outputs: Record<string, any>;
    path: string;
}

export class FunzService {
    private pythonPath: string;
    private workspaceRoot: string;

    constructor() {
        const config = vscode.workspace.getConfiguration('funz');
        this.pythonPath = config.get('pythonPath', 'python');
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
    }

    /**
     * Get Python path from configuration
     */
    private getPythonPath(): string {
        const config = vscode.workspace.getConfiguration('funz');
        return config.get('pythonPath', this.pythonPath);
    }

    /**
     * Execute a Funz command (fzi, fzc, fzo, fzr)
     */
    private async executeFunzCommand(
        command: string,
        args: string[],
        cwd?: string
    ): Promise<{ stdout: string; stderr: string }> {
        const python = this.getPythonPath();
        const fullArgs = ['-m', `fz.${command}`, ...args];

        try {
            const result = await execFileAsync(python, fullArgs, {
                cwd: cwd || this.workspaceRoot,
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large outputs
            });
            return result;
        } catch (error: any) {
            throw new Error(`Funz command failed: ${error.message}\nStderr: ${error.stderr}`);
        }
    }

    /**
     * Get available models from .fz/models directory
     */
    async getAvailableModels(): Promise<string[]> {
        const modelsDir = path.join(this.workspaceRoot, '.fz', 'models');

        if (!fs.existsSync(modelsDir)) {
            return [];
        }

        const files = fs.readdirSync(modelsDir);
        return files
            .filter(f => f.endsWith('.json') || f.endsWith('.yaml') || f.endsWith('.yml'))
            .map(f => path.basename(f, path.extname(f)));
    }

    /**
     * Get model configuration
     */
    async getModelConfig(modelName: string): Promise<any> {
        const modelsDir = path.join(this.workspaceRoot, '.fz', 'models');
        const possibleExtensions = ['.json', '.yaml', '.yml'];

        for (const ext of possibleExtensions) {
            const modelPath = path.join(modelsDir, `${modelName}${ext}`);
            if (fs.existsSync(modelPath)) {
                const content = fs.readFileSync(modelPath, 'utf-8');
                return ext === '.json' ? JSON.parse(content) : content;
            }
        }

        return null;
    }

    /**
     * Detect variables in a template file using fzi
     */
    async detectVariables(filePath: string, model: string): Promise<string[]> {
        const args = [filePath, '--model', model, '--format', 'json'];

        try {
            const { stdout } = await this.executeFunzCommand('fzi', args);
            const result = JSON.parse(stdout);

            if (Array.isArray(result)) {
                return result;
            } else if (typeof result === 'object') {
                return Object.keys(result);
            }

            return [];
        } catch (error) {
            console.error('Error detecting variables:', error);
            throw error;
        }
    }

    /**
     * Get output definitions from model
     */
    async getModelOutputs(model: string): Promise<FunzOutput[]> {
        const config = await this.getModelConfig(model);

        if (!config || !config.output) {
            return [];
        }

        return Object.entries(config.output).map(([name, command]) => ({
            name,
            command: command as string
        }));
    }

    /**
     * Compile template with variables using fzc
     */
    async compileTemplate(
        templatePath: string,
        model: string,
        variables: Record<string, any>,
        outputDir: string
    ): Promise<void> {
        const variablesJson = JSON.stringify(variables);
        const args = [
            templatePath,
            '--model', model,
            '--variables', variablesJson,
            '--output', outputDir
        ];

        await this.executeFunzCommand('fzc', args);
    }

    /**
     * Run full simulation using fzr
     */
    async runSimulation(
        templatePath: string,
        model: string,
        variables: Record<string, any>,
        calculator: string,
        resultsDir: string,
        onProgress?: (message: string) => void
    ): Promise<void> {
        const variablesJson = JSON.stringify(variables);
        const args = [
            templatePath,
            '--model', model,
            '--variables', variablesJson,
            '--calculator', calculator,
            '--results', resultsDir
        ];

        // For long-running commands, we might want to use spawn instead
        const python = this.getPythonPath();
        const fullArgs = ['-m', 'fz.fzr', ...args];

        return new Promise((resolve, reject) => {
            const { spawn } = require('child_process');
            const process = spawn(python, fullArgs, {
                cwd: this.workspaceRoot
            });

            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data: Buffer) => {
                const message = data.toString();
                stdout += message;
                if (onProgress) {
                    onProgress(message);
                }
            });

            process.stderr.on('data', (data: Buffer) => {
                stderr += data.toString();
            });

            process.on('close', (code: number) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Simulation failed with code ${code}\n${stderr}`));
                }
            });

            process.on('error', (error: Error) => {
                reject(error);
            });
        });
    }

    /**
     * Parse output directory using fzo
     */
    async parseOutput(
        resultsDir: string,
        model: string,
        format: 'json' | 'csv' | 'table' = 'json'
    ): Promise<FunzResult[]> {
        const args = [resultsDir, '--model', model, '--format', format];

        try {
            const { stdout } = await this.executeFunzCommand('fzo', args);

            if (format === 'json') {
                const data = JSON.parse(stdout);
                return this.parseJsonResults(data, resultsDir);
            } else if (format === 'csv') {
                return this.parseCsvResults(stdout, resultsDir);
            }

            return [];
        } catch (error) {
            console.error('Error parsing output:', error);
            throw error;
        }
    }

    /**
     * Parse JSON results from fzo
     */
    private parseJsonResults(data: any, resultsDir: string): FunzResult[] {
        if (Array.isArray(data)) {
            return data.map((row, index) => ({
                parameters: this.extractParameters(row),
                outputs: this.extractOutputs(row),
                path: path.join(resultsDir, `run_${index}`)
            }));
        } else if (typeof data === 'object') {
            return Object.entries(data).map(([key, value]) => ({
                parameters: this.extractParameters(value),
                outputs: this.extractOutputs(value),
                path: path.join(resultsDir, key)
            }));
        }

        return [];
    }

    /**
     * Parse CSV results from fzo
     */
    private parseCsvResults(csv: string, resultsDir: string): FunzResult[] {
        const lines = csv.trim().split('\n');
        if (lines.length < 2) {
            return [];
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const results: FunzResult[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row: Record<string, any> = {};

            headers.forEach((header, index) => {
                row[header] = this.parseValue(values[index]);
            });

            results.push({
                parameters: this.extractParameters(row),
                outputs: this.extractOutputs(row),
                path: path.join(resultsDir, `run_${i - 1}`)
            });
        }

        return results;
    }

    /**
     * Extract parameter columns from result row
     */
    private extractParameters(row: any): Record<string, any> {
        const params: Record<string, any> = {};

        for (const [key, value] of Object.entries(row)) {
            // Heuristic: parameters typically don't have dots or special chars in output names
            if (!key.includes('.') && !key.startsWith('_')) {
                params[key] = value;
            }
        }

        return params;
    }

    /**
     * Extract output columns from result row
     */
    private extractOutputs(row: any): Record<string, any> {
        const outputs: Record<string, any> = {};

        for (const [key, value] of Object.entries(row)) {
            // Heuristic: outputs might have dots or come after params
            outputs[key] = value;
        }

        return outputs;
    }

    /**
     * Parse string value to appropriate type
     */
    private parseValue(value: string): any {
        if (value === '') {
            return null;
        }

        const num = Number(value);
        if (!isNaN(num)) {
            return num;
        }

        if (value.toLowerCase() === 'true') {
            return true;
        }
        if (value.toLowerCase() === 'false') {
            return false;
        }

        return value;
    }

    /**
     * Check if fz package is installed
     */
    async checkFunzInstallation(): Promise<boolean> {
        try {
            const python = this.getPythonPath();
            await execFileAsync(python, ['-m', 'fz', '--version']);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get workspace root directory
     */
    getWorkspaceRoot(): string {
        return this.workspaceRoot;
    }
}
