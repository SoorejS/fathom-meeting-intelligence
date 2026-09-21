const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const Module = require('node:module');
const cache = new Map();
module.exports = function load(file) {
  const full = path.resolve(file);
  if (cache.has(full)) return cache.get(full).exports;
  const mod = new Module(full);
  cache.set(full, mod);
  mod.filename = full;
  mod.paths = Module._nodeModulePaths(path.dirname(full));
  const nativeRequire = mod.require.bind(mod);
  mod.require = specifier => specifier.startsWith('.') ? module.exports(path.resolve(path.dirname(full), specifier + (path.extname(specifier) ? '' : '.ts'))) : nativeRequire(specifier);
  mod._compile(ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, full);
  return mod.exports;
};
