# gatsby-plugin-graphql-component

This plugin alows you to register any React component file with the build system and query them via Gatsby's GraphQL queries.

## Example usage

- using pageQuery

```js
// src/pages/test.js
import { graphql, Link } from "gatsby";
import React from "react";
export const pageQuery = graphql`
  query {
    Tester
    allSitePage {
      edges {
        node {
          id
        }
      }
    }
  }
`;
export default (props) => {
  const { Tester } = props.data;

  return <Tester></Tester>;
};
```

- using `useStaticQuery` hook

```js
// src/components/test.js
import { graphql, useStaticQuery } from "gatsby";
import React from "react";
export default (props) => {
  const { Tester } = useStaticQuery(graphql`
    query {
      Tester
      allSitePage {
        edges {
          node {
            id
          }
        }
      }
    }
  `);
  return <Tester></Tester>;
};
```

- using `<StaticQuery/>` component

```js
// src/components/test.js
import React from "react";
import { StaticQuery, graphql } from "gatsby";
export default (props) => (
  <StaticQuery
    query={graphql`
      query {
        Tester
      }
    `}
  >
    {(data) => {
      return <data.Tester></data.Tester>;
    }}
  </StaticQuery>
);
```

## Installation

```shell
npm i gatsby-plugin-graphql-component
```

After installing `gatsby-plugin-graphql-component` you can add it to your plugins list in your
`gatsby-config.js`.

```js
module.exports = {
  plugins: [
    // ...
    `gatsby-plugin-graphql-component`,
  ],
};
```

## Usage for plugin creators

The component file needs to be registered with the plugin by creating a `Component` node. The plugin exports a `createComponentNode` function which you should call during the `sourceNodes` build phase. As a side effect, the component is added to the webpack's build. Then you can extend the schema with `createResolverField` function during the `createResolvers` which will enable the component in the queries.

```js
const { createComponent, createResolverField } = require(`gatsby-plugin-graphql-component`)

exports.sourceNodes = ({actions: {createNode}) => {

  createNode(createComponentNode({ component: require.resolve(`./src/components/tester`) }))
}

exports.createResolvers = ({ createResolvers }) => {
  const resolvers = {
    Query: {
      // make sure you use the same path as in sourceNodes phase as it is treated as component id
      Tester: createResolverField({ component: require.resolve(`./src/components/tester`) }),
    },
  }
  createResolvers(resolvers)
}


```

## Supported features

- server side rendering
- hot reloading
- query refreshing during development

## How is bundle size affected

Each individual component is treated in its own webpack chunk, similar as pages are, so only the components which are included in the queries, are loaded on initial page bootstrap alongside with the page data.

## License

MIT
