# Satto

**Satto** is a lightweight web framework for building server-rendered applications with a **file-based structure**, **simple routing**, and **fast builds** powered by **Node.js**, **Express**, and **esbuild**.

It is designed to be **minimal**, **opinionated**, and **easy to reason about**, focusing on productivity without unnecessary abstraction.

## Key Features

* File-based page structure
* Simple and explicit routing
* Server-Side Rendering (SSR)
* Page-scoped CSS and JavaScript
* Fast production builds with esbuild
* Development mode with file watching
* Minimal templating syntax for SSR
* Zero configuration by default

## Installation

Install globally to use the CLI:

```bash
npm install -g satto
```

Or install locally in a project:

```bash
npm install satto
```

## Creating a New Project

```bash
satto init my-app
```

This command creates a new project with the following structure:

```txt
my-app/
├── src/
│   ├── app/
│   │   └── home/
│   │       ├── home.html
│   │       ├── home.css
│   │       └── home.js
│   ├── static/
│   │   └── styles.css
│   ├── index.html
│   └── server.js
└── package.json
```

## Development Server

Start the development server with file watching enabled:

```bash
npm run dev
```

or

```bash
satto run dev
```

The application will be available at:

```
http://localhost:3000
```

## Production Build

Create an optimized production build:

```bash
npm run build
```

or

```bash
satto run build
```

This generates the following output:

```txt
dist/
├── app/
├── static/
├── index.html
└── server.js
```

All assets are minified and ready for deployment.

## Creating Routes

Generate a new route using the CLI:

```bash
satto route blog
```

This creates:

```txt
src/app/blog/
├── blog.html
├── blog.css
└── blog.js
```

And automatically updates `src/server.js`:

```js
const routes = [
  { path: "/", page: "home" },
  { path: "/blog", page: "blog" },
];
```

## Page Structure

Each route corresponds to a folder inside `src/app/` and may contain:

* `page.html` – Page markup
* `page.css` – Page-specific styles
* `page.js` – Page-specific scripts

The page content is automatically injected into `<routes></routes>` inside `index.html`.

## Server-Side Rendering (SSR)

Satto provides a minimal SSR syntax for rendering data on the server.

### Example

```html
<ssr url="https://jsonplaceholder.typicode.com/posts" response="posts">
    <section>
        <for condition="let post in posts">
            <div>
                <h1>{{ post.title }}</h1>
            </div>
        </for>
    </section>
</ssr>
```

### Supported Directives

* `{{ variable }}`
* `<for condition="let item in array">`
* `<if condition="expression">`
* Attribute binding: `[src]="image.url"`

## Cache Busting

Satto automatically appends a version query string to assets:

```txt
styles.css?v=timestamp
page.js?v=timestamp
```

This ensures browsers always load the latest version.

## API Reference

### `createServer`

```js
const createServer = require("satto");

const routes = [
  { path: "/", page: "home" },
  { path: "/blog", page: "blog" },
];

createServer(__dirname, routes, 3000);
```

**Parameters:**

* `root` – Project root directory
* `routes` – Array of route definitions
* `port` – Server port (default: 3000)

## Requirements

* Node.js 18 or later
* npm