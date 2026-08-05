const fs = require('fs');
const path = require('path');

const remoteDir = path.join(__dirname, 'src/lib/remote');
const routesDir = path.join(__dirname, 'src/routes');

// 1. Find all exported forms
const formNames = [];
for (const file of fs.readdirSync(remoteDir)) {
    if (!file.endsWith('.remote.ts')) continue;
    const content = fs.readFileSync(path.join(remoteDir, file), 'utf8');
    const regex = /export\s+const\s+(\w+)\s*=\s*form\(/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        formNames.push(match[1]);
    }
}
console.log("Forms found:", formNames.join(", "));

// 2. Search for direct invocation of these forms
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.svelte') || file.endsWith('.svelte.ts') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const allFiles = walk(routesDir);
allFiles.push(path.join(__dirname, 'src/lib/state/auth.svelte.ts'));
for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    for (const formName of formNames) {
        const regex = new RegExp(`await\\s+${formName}\\(`, 'g');
        if (regex.test(content)) {
            console.log(`Found programmatic usage of ${formName} in ${file}`);
        }
    }
}
