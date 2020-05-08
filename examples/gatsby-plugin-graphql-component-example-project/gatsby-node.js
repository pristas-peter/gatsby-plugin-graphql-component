/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

const {
  createComponentNode,
  createResolverField,
} = require(`gatsby-plugin-graphql-component`)

exports.sourceNodes = ({ actions }) => {
  actions.createNode(
    createComponentNode({
      component: require.resolve(`./src/components/tester`),
    })
  )
}

exports.createResolvers = ({ createResolvers }) => {
  const resolvers = {
    Query: {
      Tester: createResolverField({
        component: require.resolve(`./src/components/tester`),
      }),
    },
  }
  createResolvers(resolvers)
}
