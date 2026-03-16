import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(process.cwd(), 'server');

const collectFiles = (dir) => {
    const entries = readdirSync(dir);
    return entries.flatMap((entry) => {
        const fullPath = path.join(dir, entry);
        const stats = statSync(fullPath);
        if (stats.isDirectory()) return collectFiles(fullPath);
        return fullPath.endsWith('.js') ? [fullPath] : [];
    });
};

const files = collectFiles(root);
let hasError = false;

files.forEach((file) => {
    const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
    if (result.status !== 0) {
        hasError = true;
    }
});

if (hasError) {
    process.exit(1);
}

console.log(`Checked ${files.length} server files.`);
