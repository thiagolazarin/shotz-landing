// Gera o site estático em public/: compila src/shotz.ts, copia CSS e imagens
// e cria a versão "lata" em public/lata/.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const out = join(root, 'public');
const LATA_FONTS = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..100,500..900&family=JetBrains+Mono:wght@500;700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap';

export function build() {
  const t0 = Date.now();
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, 'lata'), { recursive: true });

  // TypeScript -> JavaScript (script clássico, isolado num IIFE)
  const tsCode = readFileSync(join(src, 'shotz.ts'), 'utf8');
  const { outputText } = ts.transpileModule(tsCode, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 },
  });
  const js = '/* SHOTZ · gerado de src/shotz.ts */\n(() => {\n"use strict";\n' + outputText.replace(/export \{\};\s*$/m, '') + '\n})();\n';
  writeFileSync(join(out, 'shotz.js'), js);
  cpSync(join(src, 'shotz.css'), join(out, 'shotz.css'));
  cpSync(join(src, 'img'), join(out, 'img'), { recursive: true });

  // Versão editorial em /
  const html = readFileSync(join(src, 'index.html'), 'utf8');
  writeFileSync(join(out, 'index.html'), html);

  // Versão "lata" em /lata/ (mesmo HTML, outra camada visual e outras fontes)
  const lata = html
    .replace('<html lang="pt-BR">', '<html lang="pt-BR" data-look="lata">')
    .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2[^"]+">/, `<link rel="stylesheet" href="${LATA_FONTS}">`)
    .replace('<title>SHOTZ Shot de Proteína</title>', '<title>SHOTZ Versão Lata</title>')
    .replace('href="shotz.css"', 'href="../shotz.css"')
    .replace('src="shotz.js"', 'src="../shotz.js"')
    .replaceAll('img/', '../img/');
  writeFileSync(join(out, 'lata', 'index.html'), lata);

  console.log(`✔ build pronto em public/ (${Date.now() - t0} ms)`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) build();
