#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const esbuild = require("esbuild");

const args = process.argv.slice(2);

const banner = [
  "  ____        _   _        ",
  " / ___|  __ _| |_| |_ ___  ",
  " \\___ \\ / _` | __| __/ _ \\ ",
  "  ___) | (_| | |_| || (_) |",
  " |____/ \\__,_|\\__|\\__\\___/ ",
  "                           "
].join("\n");

console.log(banner + "\n");

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

if (args[0] === "init") {
  const appName = args[1];

  if (!appName) {
    console.error("Error: You must provide an app name.");
    process.exit(1);
  }

  console.log(`Creating project '${appName}'...`);

  const root = path.join(process.cwd(), appName);

  const template = {
    [`${root}/src/app/home/home.html`]: `<h1>Home</h1>`,
    [`${root}/src/app/home/home.css`]: `h1 {color: green}`,
    [`${root}/src/app/home/home.js`]: `console.log("home loaded");`,
    [`${root}/src/static/styles.css`]: ``,
    [`${root}/src/index.html`]: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/styles.css">
  <title>${appName}</title>
</head>
<body>
  <routes></routes>
</body>
</html>`,
    [`${root}/src/server.js`]: `const createServer = require("satto");

const routes = [
  { path: "/", page: "home" },
];

createServer(__dirname, routes);
`,
    [`${root}/package.json`]: `{
  "name": "${appName}",
  "version": "1.0.0",
  "type": "commonjs",
  "scripts": {
    "dev": "satto run dev",
    "build": "satto run build"
  },
  "overrides": {
    "minimatch": "10.2.1"
  }
}`
  };

  for (const file in template) {
    write(file, template[file]);
  }

  execSync(
    `npm i satto`,
    {
      stdio: "inherit",
      cwd: root
    }
  );

  console.log("Project created successfully!");
  process.exit(0);
}

if (args[0] === "route") {
  const routeName = args[1];

  if (!routeName) {
    console.error("Error: You must provide a route name.");
    process.exit(1);
  }

  const root = process.cwd();

  console.log(`Creating route '${routeName}'...`);

  write(`${root}/src/app/${routeName}/${routeName}.html`, `<h1>${routeName}</h1>`);
  write(`${root}/src/app/${routeName}/${routeName}.css`, ``);
  write(`${root}/src/app/${routeName}/${routeName}.js`, ``);

  const serverPath = `${root}/src/server.js`;

  if (!fs.existsSync(serverPath)) {
    console.error("Error: server.js not found. Run this command inside a project created using 'satto init'.");
    process.exit(1);
  }

  let serverContent = fs.readFileSync(serverPath, "utf8");

  const routeEntry = `  { path: "/${routeName}", page: "${routeName}" },`;

  serverContent = serverContent.replace(
    /const routes\s*=\s*\[/,
    `const routes = [\n${routeEntry}`
  );

  fs.writeFileSync(serverPath, serverContent);

  console.log(`Route '${routeName}' created.`);
  process.exit(0);
}

if (args[0] === "run" && args[1] === "dev") {
  console.log("Development server is starting...");
  console.clear();

  execSync(
    "node --watch --watch-path=./src ./src/server.js",
    {
      stdio: "inherit",
      cwd: process.cwd()
    }
  );

  process.exit(0);
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;

  const stats = fs.lstatSync(src);

  if (stats.isFile()) {
    if(src.includes("css") || src.includes("js")) {
      esbuild.buildSync({
        entryPoints: [src],
        outfile: dest,  
        minify: true,                 
        bundle: false
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  } else if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }

    const entries = fs.readdirSync(src);

    for (const entry of entries) {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      copyRecursive(srcPath, destPath);
    }
  }
}

if (args[0] === "run" && args[1] === "build") {
  console.log("Build is starting...");

  const root = process.cwd();
  if (fs.existsSync(`${root}/dist`)) fs.rmSync(`${root}/dist`, { recursive: true, force: true });

  esbuild.buildSync({
    entryPoints: ["src/server.js"],
    bundle: true,
    platform: "node",
    outfile: "dist/server.js",
    format: "cjs",
    minify: true,
  });

  copyRecursive(`${root}/src/index.html`, `${root}/dist/index.html`);
  copyRecursive(`${root}/src/app`, `${root}/dist/app`);
  copyRecursive(`${root}/src/static`, `${root}/dist/static`);

  console.log("Build completed successfully!");
  process.exit(0);
}

console.log("Unknown command.");
console.log("Usage:");
console.log("  satto init <app_name>       # Initialize a new Satto application");
console.log("  satto route <route_name>    # Create a new route in the application");
console.log("  satto run dev               # Run the application in development mode");
console.log("  satto run build             # Build the application for production");
process.exit(1);
