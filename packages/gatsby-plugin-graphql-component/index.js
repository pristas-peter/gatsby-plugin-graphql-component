const _ = require(`lodash`);
const {
  generateComponentChunkName,
} = require(`gatsby/dist/utils/js-chunk-names`);
const { createContentDigest } = require(`gatsby-core-utils`);
const { createNodeId } = require("gatsby/dist/utils/create-node-id");

const { name } = require("./package.json");

const pascalCase = _.flow(_.camelCase, _.upperFirst);

/**
 * Creates Component Node and which as a side effect registers the component into webpack's build
 */
exports.createComponentNode = ({ component }) => {
  const node = {
    id: createNodeId(`component-${component}`, name),
    componentPath: component,
    componentName: `Component${pascalCase(component)}`,
    componentChunkName: generateComponentChunkName(component),
    internal: {
      type: `Component`,
    },
  };

  node.internal.contentDigest = createContentDigest(JSON.stringify(node));

  return node;
};

/**
 * Helper function to create resolver field which returns the previously registered component
 */
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
      });

      return {
        ___graphQLComponent: node
          ? {
              componentChunkName: node.componentChunkName,
              componentPath: node.componentPath,
              componentName: node.componentName,
            }
          : null,
      };
    },
  };
};
