
## How to build with seneca-doc

clone seneca-provider into the same parent folder and use the /doc directiory as your placeholder.


This is how you organize your sections in your plugin-doc.js file:

```js
// messages namespace
const messages = {
  load_product: { // where name is the entity name. For example: product
    desc: 'Load product data into an entity',
    examples: {},
    reply_desc: {}
  },
  // or inject custom content from your md
  save_product: {
    path: '../seneca-provider/doc/save_product.md'
  }
}

// custom sections namespace
const sections = {
  intro: {
    path: '../seneca-provider/doc/intro.md'
  },
  support: {
    path: '../seneca-provider/doc/support.md'
  }
}
```

In your README.md,

```
<!--START:SECTION:intro-->
// here is where your intro.md will be injected
<!--END:SECTION:intro-->

Syntax is:
<!--START:SECTION:section_name>
<!--END:SECTION:section_name>


```

