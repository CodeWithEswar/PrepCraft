import ts from "typescript"
import path from "node:path"

const featureOf = file => /^src\/features\/([^/]+)\//.exec(file)?.[1]
const serverPath = file => /\/server\/|\/(server|session)\.tsx?$|\.server\.tsx?$/.test(file)

/** Source map makes the exact production rules testable without filesystem mocks. */
export function checkDependencies(files) {
  const errors = []
  const graph = new Map(), runtime = new Map(), clients = new Set(), servers = new Set()
  for (const [file, source] of files) {
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
    const imports = []
    let markedServer = false
    for (const statement of ast.statements) {
      if (ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression) && statement.expression.text === "use client") clients.add(file)
    }
    const visit = node => {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const typeOnly = ts.isImportDeclaration(node) ? Boolean(node.importClause?.isTypeOnly) || Boolean(node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings) && !node.importClause.name && node.importClause.namedBindings.elements.length && node.importClause.namedBindings.elements.every(e => e.isTypeOnly)) : node.isTypeOnly
        imports.push({ specifier: node.moduleSpecifier.text, typeOnly })
      }
      if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "require")) && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) imports.push({ specifier: node.arguments[0].text, typeOnly:false })
      if (!file.startsWith("src/lib/env/") && ts.isPropertyAccessExpression(node) && node.getText(ast) === "process.env") {
        const parent = node.parent
        if (!(ts.isPropertyAccessExpression(parent) && parent.name.text === "NODE_ENV")) errors.push(`${file}: centralize environment access in src/lib/env`)
      }
      ts.forEachChild(node, visit)
    }
    visit(ast)
    graph.set(file, []); runtime.set(file, [])
    for (const { specifier, typeOnly } of imports) {
      if (specifier === "server-only") { markedServer = true; servers.add(file); continue }
      if (file.startsWith("cloudflare/") && (specifier.startsWith("node:") || specifier === "next" || specifier.startsWith("next/"))) errors.push(`${file}: worker contracts must be runtime portable`)
      if (specifier === "next/headers" || specifier === "next/server") servers.add(file)
      if (!specifier.startsWith(".") && !specifier.startsWith("@/")) continue
      const base = specifier.startsWith("@/") ? `src/${specifier.slice(2)}` : path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier))
      const target = [base,`${base}.ts`,`${base}.tsx`,`${base}/index.ts`,`${base}/index.tsx`].find(candidate => files.has(candidate))
      if (!target) {
        if (!/\.(css|json|svg|png|webp)$/.test(base)) errors.push(`${file}: unresolved internal import ${specifier}`)
        continue
      }
      graph.get(file).push(target)
      if (!typeOnly) runtime.get(file).push(target)
      if (/^src\/(lib|components|providers|hooks|types)\//.test(file) && (target.startsWith("src/features/") || target.startsWith("src/app/"))) errors.push(`${file}: shared code cannot depend on ${target}`)
      if (featureOf(file) && target.startsWith("src/app/")) errors.push(`${file}: features cannot depend on routes`)
      const owner = featureOf(target)
      if (owner && owner !== featureOf(file) && target !== `src/features/${owner}/index.ts` && target !== `src/features/${owner}/server/index.ts`) errors.push(`${file}: use the public ${owner} feature entry, not ${target}`)
      if (file.startsWith("cloudflare/") && target.startsWith("src/")) errors.push(`${file}: worker code cannot import the Next application`)
    }
    if (serverPath(file) && !markedServer) errors.push(`${file}: server modules require import "server-only"`)
  }
  const visiting = new Set(), visited = new Set()
  const walk = (file, chain=[]) => {
    if (visiting.has(file)) { errors.push(`Circular dependency: ${[...chain,file].join(" → ")}`); return }
    if (visited.has(file)) return
    visiting.add(file)
    for (const target of graph.get(file) ?? []) walk(target,[...chain,file])
    visiting.delete(file); visited.add(file)
  }
  for (const file of files.keys()) walk(file)
  for (const client of clients) {
    const seen = new Set()
    const check = file => {
      if (seen.has(file)) return
      seen.add(file)
      if (servers.has(file) || serverPath(file)) errors.push(`${client}: client dependency reaches server module ${file}`)
      for (const target of runtime.get(file) ?? []) check(target)
    }
    check(client)
  }
  return [...new Set(errors)]
}
