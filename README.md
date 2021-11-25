# Code generation tool for tsbean-orm

This tool is made to generate [tsbean-orm](https://github.com/AgustinSRG/tsbean-orm) classes from your tables definitions in SQL.

Simply paste your SQL in the left side and you'll get the typescript code in the right side.

Try it out here: [https://agustinsrg.github.io/tsbean-codegen/](https://agustinsrg.github.io/tsbean-codegen/)

## Building

To minify build the project (minify the css and javascript files):

First, install the developing dependencies:

```
npm install
```

Then, run the build script:

```
npm run build
```

This is a static page. It can run in local or any static web server.

For development, use `index-dev.html`.

For production, use `index.html`
