// Arma la versión para publicar como Artifact en claude.ai:
// una página con el CSS adentro y el JS como archivo aparte (app.js).
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';

const dist = 'dist-artifact/build';
rmSync('dist-artifact', { recursive: true, force: true });
execSync(`npx vite build --mode artifact --outDir ${dist} --emptyOutDir`, { stdio: 'inherit' });

const assets = readdirSync(`${dist}/assets`);
const js = assets.find((f) => f.endsWith('.js'));
const css = assets.find((f) => f.endsWith('.css'));
if (!js || !css) throw new Error('No se encontró el JS o el CSS del build');

mkdirSync('dist-artifact/publicar', { recursive: true });
writeFileSync('dist-artifact/publicar/app.js', readFileSync(`${dist}/assets/${js}`));
const estilos = readFileSync(`${dist}/assets/${css}`, 'utf8');
writeFileSync(
  'dist-artifact/publicar/juntada.html',
  `<title>Juntada</title>
<meta name="theme-color" content="#17503a">
<style>${estilos}</style>
<div id="root"></div>
<script type="module" src="app.js"></script>
`,
);
console.log('Listo: dist-artifact/publicar/juntada.html + app.js');
