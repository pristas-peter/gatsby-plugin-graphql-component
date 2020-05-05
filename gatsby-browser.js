import { components } from "~gatsby-plugin-graphql-component/async-requires"
import { transform } from "./transform"

export const onClientEntry = async () => {
  if (process.env.NODE_ENV !== `production`) {
    const { default: socketIo } = require(`~gatsby-plugin-graphql-component-gatsby-cache/socketIo`)
    const syncRequires = require(`~gatsby-plugin-graphql-component/sync-requires`)
    const { transformSync } = require(`./transform`)

    const emitter = window.___emitter

    const onResult = ({ result }) => {
      if (result && result.data) {
        Object.assign(
          result.data,
          transformSync({
            json: result.data,
            load: ({ componentChunkName }) => syncRequires.components[componentChunkName],
          })
        )
      }
    }

    emitter.on(`staticQueryResult`, onResult)
    emitter.on(`pageQueryResult`, onResult)
    socketIo()
  }

  const loader = window.___loader

  const { loadPage } = loader

  loader.loadPage = async (...args) => {
    const result = await loadPage(...args)

    if (result && result.json && result.json.data) {
      Object.assign(
        result.json.data,
        await transform({
          json: result.json.data,
          load: ({ componentChunkName }) => components[componentChunkName](),
        })
      )
    }

    return result
  }

  return loader.loadPage(window.location.pathname)
}
