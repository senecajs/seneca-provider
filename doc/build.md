
## How to build

clone seneca-provider into the same parent folder and use the /doc directiory as your placeholder.


This is how you specify your sections in your plugin-doc.js file:

```js
const messages = { ... }

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
// here is where your intro.md will get injected
<!--END:SECTION:intro-->

Syntax is:
<!--START:SECTION:section_name>
<!--END:SECTION:section_name>


```

