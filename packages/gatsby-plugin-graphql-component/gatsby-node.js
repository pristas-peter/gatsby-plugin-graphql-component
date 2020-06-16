const path = require(`path`)
const fs = require(`fs-extra`)

const { GraphQLJSONObject } = require(`graphql-type-json`)
const { visitor } = require(`./visitor`)

const { setActions, setStore } = require(`./index`)
const { ensureWriteDirectory, writeFile } = require(`./output`)

exports.onPreBootstrap = async ({ actions, store }) => {
  setActions({ actions })
  setStore({ store })
}

exports.createSchemaCustomization = ({ actions, schema }) => {
  const { createTypes } = actions

  createTypes([
    schema.buildScalarType({
      name: `GraphQLComponent`,
      description: `React component available through GraphQL`,
      serialize: GraphQLJSONObject.serialize,
      parseValue: GraphQLJSONObject.parseValue,
      parseLiteral: GraphQLJSONObject.parseLiteral
    }),
    schema.buildObjectType({
      name: `GraphQLComponentSource`,
      description: `React component node`,
      fields: {
        componentPath: `String!`,
        componentChunkName: `String!`,
        componentName: `String!`
      },
      interfaces: [`Node`]
    })
  ])
}

exports.createPages = async ({ getNodesByType, store }) => {
  const { directory } = store.getState().program
  const writeDirectory = await ensureWriteDirectory({ baseDirectory: directory })

  const nodes = getNodesByType(`GraphQLComponentSource`)

  // Create file with sync requires of components/json files.
  let syncRequires = `
// prefer default export if available
const preferDefault = m => m && m.default || m
\n\n`
  syncRequires += `exports.components = {\n${nodes
    .map(node => `  "${node.componentChunkName}": preferDefault(require("${node.componentPath}"))`)
    .join(`,\n`)}
}\n\n`

  const asyncRequires = `// prefer default export if available

const preferDefault = m => m && m.default || m
exports.components = {\n${nodes
    .map(node => {
      return `  "${node.componentChunkName}": () => import("${node.componentPath}" /* webpackChunkName: "${node.componentChunkName}" */).then(preferDefault)`
    })
    .join(`,\n`)}
}\n\n`

  await Promise.all([
    writeFile({
      filePath: path.join(writeDirectory, `sync-requires.js`),
      data: syncRequires
    }),
    writeFile({
      filePath: path.join(writeDirectory, `async-requires.js`),
      data: asyncRequires
    })
  ])
}

exports.onPreBuild = async ({ store }) => {
  if (process.env.NODE_ENV === `production`) {
    const staticQueries = {}

    const promises = []

    const { directory } = store.getState().program
    const writeDirectory = await ensureWriteDirectory({ baseDirectory: directory })

    store.getState().staticQueryComponents.forEach(value => {
      promises.push(
        new Promise((resolve, reject) => {
          fs.readFile(path.join(directory, `public`, `static`, `d`, `${value.hash}.json`), `utf-8`)
            .then(data => {
              const result = JSON.parse(data)

              const definitions = []

              visitor({
                json: result,
                onDefinition: ({ definition }) => {
                  definitions.push(definition)
                }
              })

              if (definitions.length) {
                const source = `
${definitions.map(({ componentName, componentPath }) => `import ${componentName} from "${componentPath}"`).join(`\n`)}
import { transformSync } from "gatsby-plugin-graphql-component/transform"

const map = {
    ${definitions.map(({ componentName }) => `${componentName}`).join(`,`)}
}

const cache = new WeakMap()

export default (data) => {
  const cached = cache.get(data)

  if (cached) {
    return cached
  }

  const transformed = transformSync({json: data, load: ({componentName}) => {
    return map[componentName]
  }})

  cache.set(data, transformed)

  return transformed
}`
                const filename = `static-query-${value.hash}.js`

                return fs.writeFile(path.join(writeDirectory, filename), source).then(() => {
                  staticQueries[value.componentPath] = {
                    ...value,
                    result,
                    importPath: `~gatsby-plugin-graphql-component/${filename}`
                  }
                })
              }

              return null
            })
            .then(resolve)
            .catch(reject)
        })
      )
    })

    await Promise.all(promises)
    await fs.writeFile(path.join(writeDirectory, `static-queries.json`), JSON.stringify(staticQueries, null, 2))
  }
}

exports.onCreateBabelConfig = async ({ actions, store }) => {
  const { directory } = store.getState().program
  const writeDirectory = await ensureWriteDirectory({ baseDirectory: directory })

  actions.setBabelPlugin({
    name: require.resolve(`./static-query-babel-plugin`),
    options: {
      staticQueriesPath: path.join(writeDirectory, `static-queries.json`)
    }
  })
}

exports.onCreateWebpackConfig = async ({ store, actions }) => {
  const { directory } = store.getState().program
  const writeDirectory = await ensureWriteDirectory({ baseDirectory: directory })

  actions.setWebpackConfig({
    resolve: {
      alias: {
        "~gatsby-plugin-graphql-component-gatsby-cache": path.join(directory, `.cache`),
        "~gatsby-plugin-graphql-component": writeDirectory
      }
    }
  })
}
