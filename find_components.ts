import * as fs from 'fs';
import * as path from 'path';

// Just a quick script to find all .ts files in the frontend
// We will use this to identify all components.

function findFiles(dir: string, extension: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(findFiles(file, extension));
        } else if (file.endsWith(extension)) {
            results.push(file);
        }
    });
    return results;
}

const files = findFiles('d:/Proyectos/Restaurante/fe/src/app', '.ts');
const components = files.filter(f => f.includes('.component.ts'));
console.log(components.join('\n'));
