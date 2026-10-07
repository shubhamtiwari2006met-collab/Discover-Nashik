import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const catalogPath = path.join(root, "lib", "i18n.tsx");
const baselinePath = path.join(root, "i18n-hardcoded-baseline.json");
const writeBaseline = process.argv.includes("--write-baseline");

function visitFiles(directory, files = []) {
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next") {
        visitFiles(absolutePath, files);
      }
    } else if (/\.(tsx|jsx)$/.test(entry.name)) {
      files.push(absolutePath);
    }
  }
  return files;
}

function readCatalogs() {
  const source = ts.createSourceFile(
    catalogPath,
    fs.readFileSync(catalogPath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const diagnostics = source.parseDiagnostics;
  if (diagnostics.length) {
    throw new Error("Could not parse lib/i18n.tsx");
  }

  let catalogNode;
  function findCatalog(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "translations"
    ) {
      catalogNode = node.initializer;
    }
    ts.forEachChild(node, findCatalog);
  }
  findCatalog(source);

  if (!catalogNode || !ts.isObjectLiteralExpression(catalogNode)) {
    throw new Error("Could not locate the translations catalog in lib/i18n.tsx");
  }

  const catalogs = new Map();
  const duplicates = [];
  const empty = [];
  for (const languageProperty of catalogNode.properties) {
    if (!ts.isPropertyAssignment(languageProperty) || !ts.isObjectLiteralExpression(languageProperty.initializer)) {
      continue;
    }
    const language = languageProperty.name.text;
    const entries = new Map();
    for (const entry of languageProperty.initializer.properties) {
      if (!ts.isPropertyAssignment(entry)) continue;
      const key = entry.name.text;
      if (entries.has(key)) {
        duplicates.push(`${language}: ${key}`);
      }
      const value = ts.isStringLiteral(entry.initializer) ? entry.initializer.text : "";
      if (!value.trim()) empty.push(`${language}: ${key}`);
      entries.set(key, value);
    }
    catalogs.set(language, entries);
  }

  return { catalogs, duplicates, empty };
}

function collectTranslationCalls(files) {
  const keys = new Set();
  for (const file of files) {
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.JSX
    );
    function visit(node) {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "t" &&
        node.arguments.length === 1 &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        keys.add(node.arguments[0].text);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  return keys;
}

function collectHardcodedUiText() {
  const findings = new Set();
  const files = [
    ...visitFiles(path.join(root, "app")),
    ...visitFiles(path.join(root, "components")),
  ];

  for (const file of files) {
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.JSX
    );
    const relativePath = path.relative(root, file).replace(/\\/g, "/");

    function addFinding(kind, value) {
      const normalized = value.replace(/\s+/g, " ").trim();
      if (!/[A-Za-z]{2}/.test(normalized) || normalized.length > 400) return;
      findings.add(`${relativePath}|${kind}|${normalized}`);
    }

    function visit(node) {
      if (ts.isJsxText(node)) {
        addFinding("jsx-text", node.text);
      } else if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
        const attribute = node.name.text;
        if (["aria-label", "placeholder", "title", "alt"].includes(attribute)) {
          addFinding(attribute, node.initializer.text);
        }
      } else if (ts.isJsxExpression(node) && node.expression && ts.isStringLiteral(node.expression)) {
        const parent = node.parent;
        if (ts.isJsxAttribute(parent) && ["aria-label", "placeholder", "title", "alt"].includes(parent.name.text)) {
          addFinding(parent.name.text, node.expression.text);
        } else {
          addFinding("jsx-expression", node.expression.text);
        }
      } else if (ts.isCallExpression(node) && node.arguments.length > 0) {
        const expression = node.expression.getText(source);
        if (
          /^(window\.)?(alert|confirm|prompt)$/.test(expression) ||
          /^set[A-Za-z]*(Error|Message|Msg|Success|Notice|Toast)$/.test(expression) ||
          /^toast(?:\.[A-Za-z]+)?$/.test(expression)
        ) {
          const argument = node.arguments[0];
          if (ts.isStringLiteral(argument)) addFinding("message", argument.text);
          if (ts.isTemplateExpression(argument)) addFinding("message", argument.head.text);
        }
      } else if (ts.isNewExpression(node) && node.expression.getText(source) === "Error" && node.arguments?.[0]) {
        const argument = node.arguments[0];
        if (ts.isStringLiteral(argument)) addFinding("error", argument.text);
        if (ts.isTemplateExpression(argument)) addFinding("error", argument.head.text);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  return [...findings].sort();
}

function main() {
  const { catalogs, duplicates, empty } = readCatalogs();
  const hindi = catalogs.get("hi") || new Map();
  const marathi = catalogs.get("mr") || new Map();
  const sourceFiles = [
    catalogPath,
    ...visitFiles(path.join(root, "app")),
    ...visitFiles(path.join(root, "components")),
  ];
  const enKeys = new Set([...hindi.keys(), ...marathi.keys(), ...collectTranslationCalls(sourceFiles)]);
  const missingHindi = [...enKeys].filter((key) => !hindi.has(key));
  const missingMarathi = [...enKeys].filter((key) => !marathi.has(key));
  const extraHindi = [...hindi.keys()].filter((key) => !enKeys.has(key));
  const extraMarathi = [...marathi.keys()].filter((key) => !enKeys.has(key));
  const hardcoded = collectHardcodedUiText();

  if (writeBaseline) {
    fs.writeFileSync(baselinePath, `${JSON.stringify(hardcoded, null, 2)}\n`);
    console.log(`Recorded ${hardcoded.length} existing literal UI strings in ${path.relative(root, baselinePath)}.`);
    return;
  }

  const baseline = fs.existsSync(baselinePath)
    ? new Set(JSON.parse(fs.readFileSync(baselinePath, "utf8")))
    : new Set();
  const newHardcoded = hardcoded.filter((finding) => !baseline.has(finding));
  const problems = [];
  if (duplicates.length) problems.push(`Duplicate keys: ${duplicates.join(", ")}`);
  if (empty.length) problems.push(`Empty translations: ${empty.join(", ")}`);
  if (missingHindi.length) problems.push(`Missing Hindi keys: ${missingHindi.join(", ")}`);
  if (missingMarathi.length) problems.push(`Missing Marathi keys: ${missingMarathi.join(", ")}`);
  if (extraHindi.length) problems.push(`Extra Hindi keys: ${extraHindi.join(", ")}`);
  if (extraMarathi.length) problems.push(`Extra Marathi keys: ${extraMarathi.join(", ")}`);
  if (!fs.existsSync(baselinePath)) {
    problems.push("Hardcoded UI baseline is missing; run npm run check:i18n -- --write-baseline to initialize it.");
  } else if (newHardcoded.length) {
    problems.push(`New hardcoded user-facing strings (${newHardcoded.length}):\n  ${newHardcoded.join("\n  ")}`);
  }

  console.log(`Catalog coverage: ${enKeys.size} keys; EN uses source keys, HI ${hindi.size}, MR ${marathi.size}.`);
  console.log(`Known hardcoded UI strings: ${hardcoded.length}; newly introduced: ${newHardcoded.length}.`);
  if (problems.length) {
    console.error(`i18n check failed:\n${problems.map((problem) => `- ${problem}`).join("\n")}`);
    process.exitCode = 1;
  } else {
    console.log("i18n catalog and hardcoded-string checks passed.");
  }
}

main();
