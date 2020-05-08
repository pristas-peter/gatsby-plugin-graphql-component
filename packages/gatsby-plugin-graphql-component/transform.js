import { visitor } from "./visitor"

export const transform = ({ json = {}, load }) => {
  const promises = []

  const newJson = visitor({
    json,
    onDefinition: ({ definition, value, key }) => {
      promises.push(
        load(definition).then(component => {
          value[key] = component
        })
      )
    },
  })

  return Promise.all(promises).then(() => newJson)
}

export const transformSync = ({ json = {}, load }) =>
  visitor({
    json,
    onDefinition: ({ definition, value, key }) => {
      value[key] = load(definition)
    },
  })
