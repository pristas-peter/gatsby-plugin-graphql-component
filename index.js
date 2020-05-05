const { generateComponentChunkName } = require(`gatsby/dist/utils/js-chunk-names`)
const _ = require(`lodash`)

const pascalCase = _.flow(_.camelCase, _.upperFirst)

exports.createComponent = ({ component, actions, createContentDigest, createNodeId }) => {
  const { createNode } = actions

  const node = {
    id: createNodeId(`component-${component}`),
    componentPath: component,
    componentName: `Component${pascalCase(component)}`,
    componentChunkName: generateComponentChunkName(component),
    internal: {
      type: `Component`,
    },
  }

  node.internal.contentDigest = createContentDigest(JSON.stringify(node))
  createNode(node)
}

exports.createResolverField = ({ component }) => {
  return {
    type: `GraphQLComponent`,
    async resolve(source, args, context, info) {
      const node = await context.nodeModel.runQuery({
        query: {
          filter: {
            componentPath: {
              eq: component,
            },
          },
        },
        type: `Component`,
        firstOnly: true,
      })

      return {
        ___graphQLComponent: node
          ? {
              componentChunkName: node.componentChunkName,
              componentPath: node.componentPath,
              componentName: node.componentName,
            }
          : null,
      }
    },
  }
}
