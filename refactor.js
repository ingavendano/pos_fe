const fs = require('fs');
const path = require('path');

function findFiles(dir, extension) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(findFiles(fullPath, extension));
        } else if (fullPath.endsWith(extension)) {
            results.push(fullPath);
        }
    });
    return results;
}

function processComponent(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Check if it already uses templateUrl to avoid reprocessing
    if (content.includes('templateUrl:')) {
        console.log(`Skipping (already extracted): ${filePath}`);
        return;
    }

    const dirName = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const componentBaseName = fileName.replace('.component.ts', '');

    // Determine new directory
    const currentFolder = path.basename(dirName);
    let targetDir = dirName;
    let isMoving = false;

    if (currentFolder !== componentBaseName) {
        targetDir = path.join(dirName, componentBaseName);
        isMoving = true;
    }

    if (isMoving && !fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    // Extract template
    let htmlContent = '';
    const templateRegex = /template:\s*`([\s\S]*?)`/g;
    const templateMatch = templateRegex.exec(content);

    if (templateMatch && templateMatch[1]) {
        htmlContent = templateMatch[1].trim();
        // Replace `template: \`...\`` with `templateUrl: './xyz.component.html'`
        content = content.replace(templateMatch[0], `templateUrl: './${componentBaseName}.component.html'`);
    }

    // Extract styles
    let cssContent = '';
    const stylesRegex = /styles:\s*\[\s*`([\s\S]*?)`\s*\]/g;
    const stylesMatch = stylesRegex.exec(content);

    if (stylesMatch && stylesMatch[1]) {
        cssContent = stylesMatch[1].trim();
        content = content.replace(stylesMatch[0], `styleUrl: './${componentBaseName}.component.css'`);
    } else {
        // Look for styles: [`...`] without the [ ] ? Some might use styles: `...`
        const styleRegexSingle = /styles:\s*`([\s\S]*?)`/g;
        const styleMatchSingle = styleRegexSingle.exec(content);
        if (styleMatchSingle && styleMatchSingle[1]) {
            cssContent = styleMatchSingle[1].trim();
            content = content.replace(styleMatchSingle[0], `styleUrl: './${componentBaseName}.component.css'`);
        }
    }

    // Fix relative imports if moving
    if (isMoving) {
        // Regex to find imports like from './something' or '../something'
        content = content.replace(/(from\s+['"])([\.\/]+)([^'"]+)(['"])/g, (match, p1, p2, p3, p4) => {
            // p2 is the relative path start, e.g., './' or '../'
            // We are moving one level deeper, so we prepend '../'
            let newRelativeStart = '';
            if (p2 === './') {
                newRelativeStart = '../';
            } else if (p2.startsWith('../')) {
                newRelativeStart = '../' + p2;
            } else {
                newRelativeStart = p2; // Fallback
            }
            return p1 + newRelativeStart + p3 + p4;
        });
    }

    // Write new files
    const newHtmlPath = path.join(targetDir, `${componentBaseName}.component.html`);
    const newCssPath = path.join(targetDir, `${componentBaseName}.component.css`);
    const newTsPath = path.join(targetDir, fileName);

    if (htmlContent) {
        fs.writeFileSync(newHtmlPath, htmlContent, 'utf-8');
    }
    // Only create css file if there was CSS content or we enforced it. We will always create it so component references it.
    // Wait, if there were no original styles, did we add styleUrl? No. So only write if cssContent exists.
    if (cssContent) {
        fs.writeFileSync(newCssPath, cssContent, 'utf-8');
    } else if (content.includes(`styleUrl: './${componentBaseName}.component.css'`)) {
        fs.writeFileSync(newCssPath, '', 'utf-8');
    }

    fs.writeFileSync(newTsPath, content, 'utf-8');

    // Delete original TS file only if we moved it
    if (isMoving && filePath !== newTsPath) {
        fs.unlinkSync(filePath);
        console.log(`Moved and extracted: ${fileName} -> ${componentBaseName}/`);
    } else {
        console.log(`Extracted local: ${fileName}`);
    }
}

function run() {
    const srcDir = path.join('d:', 'Proyectos', 'Restaurante', 'fe', 'src', 'app');
    const files = findFiles(srcDir, '.ts');
    const components = files.filter(f => f.includes('.component.ts'));

    console.log(`Found ${components.length} components. Processing...`);
    components.forEach(file => processComponent(file));
    console.log('Done.');
}

run();
