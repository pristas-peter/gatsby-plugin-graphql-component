exports.visitor = ({ json, onDefinition }) =>
  JSON.parse(JSON.stringify(json), (_, value) => {
    if (value instanceof Object) {
      Object.keys(value).forEach(key => {
        if (value[key] instanceof Object && value[key].___graphQLComponent) {
          const definition = value[key].___graphQLComponent

          if (definition) {
            onDefinition({ definition, value, key })
          }
        }
      })
    }

    return value
  })
