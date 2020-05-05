module.exports = function({ types: t }) {
  return {
    visitor: {
      Program(path, state) {
        if (process.env.NODE_ENV === `production`) {
          const staticQueries = require(state.opts.staticQueriesPath)

          const definition = staticQueries[state.filename]

          if (definition) {
            const identifier = t.identifier(`transformStaticQueryData`)

            const importDefaultSpecifier = t.importDefaultSpecifier(identifier)
            const importDeclaration = t.importDeclaration(
              [importDefaultSpecifier],
              t.stringLiteral(definition.importPath)
            )
            path.unshiftContainer(`body`, importDeclaration)

            path.traverse({
              Identifier(identifierPath) {
                if (identifierPath.node.name === `staticQueryData`) {
                  if (identifierPath.parent.type === `MemberExpression`) {
                    identifierPath.parentPath.replaceWith(
                      t.callExpression(identifier, [t.identifier(identifierPath.parentPath.toString())])
                    )
                  } else if (identifierPath.parent.type === `JSXExpressionContainer`) {
                    identifierPath.replaceWith(t.callExpression(identifier, [t.identifier(identifierPath.toString())]))
                  }
                }
              },
            })
          }
        }
      },
    },
  }
}
