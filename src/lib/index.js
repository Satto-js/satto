const express = require("express");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");

function hasContent(filePath) {
  try {
    return fs.statSync(filePath).size > 0;
  } catch {
    return false;
  }
}

function applyParams(template, params) {
  return template.replace(/{{\s*params\.(\w+)\s*}}/g, (_, key) => {
    return params[key] ?? "";
  });
}

async function renderPage(html, params) {
  try {
    const match = html.match(/<ssr\s+url="([^"]+)"\s+.*response="([^"]+)"[^>]*>/);

    if (match) {
      const url = applyParams(match?.[1], params);
      const resVar = match?.[2];
      let data = {};

      if (url) {
        const res = await fetch(url);
        data = await res.json();
      }

      html = html.replace(/<ssr[^>]*>([\s\S]*?)<\/ssr>/g, (_, content) => {
        return content.replace(
          /<ssr[^>]*>|<\/ssr>|\{\{(.*?)\}\}|<for\s+condition="let\s+(.+?)\s+in\s+(.+?)"\s*>|<\/for>|<if\s+condition="(.*?)"\s*>|<\/if>|\[(.+?)\]="(.+?)"/g,
          (match, expr, item, arr, cond, attr, val) => {
            if (match.startsWith("<ssr")) return "";
            if (match === "</ssr>") return "";
            if (expr) return `<%= ${expr.trim()} %>`;
            if (item && arr) return `<% ${arr}.forEach(${item} => { %>`;
            if (match === "</for>") return "<% }) %>";
            if (cond) return `<% if (${cond}) { %>`;
            if (match === "</if>") return "<% } %>";
            if (attr && val) return `${attr}="<%= ${val} %>"`;
            return match;
          }
        );
      });

      return ejs.render(html, { params, [resVar]: data });
    } else {
      return html;
    }
  } catch (err) {
    throw err;
  }
}

function createServer(__dirname, routes = [], port = 3000) {
  const versionApp = Date.now();
  const app = express();

  app.set("views", path.join(__dirname, "app"));
  app.engine("html", ejs.renderFile);
  app.set("view engine", "html");

  app.use(express.static(path.join(__dirname, "app")));
  app.use(express.static(path.join(__dirname, "static")));

  routes.forEach((route) => {
    app.get(route.path, (req, res, next) => {
      const page = route.page;
      const htmlPath = path.join(__dirname, "app", page, page + ".html");
      app.use(express.static(path.join(__dirname, "app", page)));

      fs.readFile(htmlPath, "utf8", async (err, html) => {
        try {
          if (err) {
            res.status(404).send();
          }

          const params = { ...req.params };
          const index = fs.readFileSync(__dirname + "/index.html", "utf8");

          const CssPath = path.join(__dirname, "app", page, page + ".css");
          const JsPath = path.join(__dirname, "app", page, page + ".js");

          if (hasContent(JsPath)) {
            html += `\n<script src="./${page}.js?v=${versionApp}"></script>`;
          }

          html = index.replace("<routes></routes>", html);
          html = html.replace(`<link rel="stylesheet" href="/styles.css">`, `<link rel="stylesheet" href="/styles.css?v=${versionApp}">`);

          if (hasContent(CssPath)) {
            html = html.replace(
              "</head>",
              `<link rel="stylesheet" href="./${page}.css?v=${versionApp}">
                </head>`
            );
          }

          res.send(await renderPage(html, params));
        } catch (err) {
          console.error(err);
          res.status(500).send();
        }
      });
    });
  });

  app.listen(port, () => {
    const banner = [
      "  ____        _   _        ",
      " / ___|  __ _| |_| |_ ___  ",
      " \\___ \\ / _` | __| __/ _ \\ ",
      "  ___) | (_| | |_| || (_) |",
      " |____/ \\__,_|\\__|\\__\\___/ ",
      "                           "
    ].join("\n");

    console.log(banner + "\n");
    console.log(`Server running on http://localhost:${port}`);
  });
}

module.exports = createServer;