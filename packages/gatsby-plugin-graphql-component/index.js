const _ = require(`lodash`)
const path = require(`path`)
const { generateComponentChunkName } = require(`gatsby/dist/utils/js-chunk-names`)
const { createContentDigest } = require(`gatsby-core-utils`)
const { createNodeId } = require(`gatsby/dist/utils/create-node-id`)
const { name } = require(`./package.json`)
const { ensureWriteDirectory, writeFile } = require(`./output`)
const fs = require(`fs-extra`)
const pascalCase = _.flow(_.camelCase, _.upperFirst)

let actions
let store

exports.setActions = options => {
  actions = options.actions
}

exports.setStore = options => {
  store = options.store
}

/**
 * Creates Component Node and which as a side effect registers the component into webpack's build
 */
exports.registerComponent = async ({ component }) => {
  const writeDirectory = await ensureWriteDirectory({
    baseDirectory: store.getState().program.directory,
    paths: [`components`]
  })

  const id = createNodeId(`graphql-component-source-${component}`, name)
  const componentPath = path.join(writeDirectory, `${id}.js`)

  // TODO: Remove all "hot" references in this `syncRequires` variable when fast-refresh is the default
  const hotImport =
    process.env.GATSBY_HOT_LOADER !== `fast-refresh` ? `const { hot } = require("react-hot-loader/root")` : ``
  const hotMethod = process.env.GATSBY_HOT_LOADER !== `fast-refresh` ? `hot` : ``

  await writeFile({
    filePath: componentPath,
    data: `
  ${hotImport}
  import Component from "${component}"

  export default ${hotMethod}(Component)
  `
  })

  const node = {
    id,
    component,
    componentPath,
    componentName: `Component${pascalCase(component)}`,
    componentChunkName: generateComponentChunkName(component),
    internal: {
      type: `GraphQLComponentSource`
    }
  }

  node.internal.contentDigest = createContentDigest(JSON.stringify(node))

  actions.createNode(node)

  return id
}

/**
 * Helper function to create resolver field which returns the previously registered component
 */
exports.createResolverField = ({ resolve }) => {
  return {
    type: `GraphQLComponent`,
    async resolve(source, args, context, info) {
      const node = await context.nodeModel.runQuery({
        query: {
          filter: {
            id: {
              eq: await resolve(source, args, context, info)
            }
          }
        },
        type: `GraphQLComponentSource`,
        firstOnly: true
      })

      if (process.env.NODE_ENV !== `production`) {
        const date = new Date()
        await fs.utimes(__filename, date, date)
      }

      return node
        ? {
            ___graphQLComponent: {
              componentChunkName: node.componentChunkName,
              componentPath: node.componentPath,
              componentName: node.componentName
            }
          }
        : null
    }
  }
}
