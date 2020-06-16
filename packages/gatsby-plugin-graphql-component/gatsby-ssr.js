import { components } from "~gatsby-plugin-graphql-component/sync-requires"
import { cloneElement } from "react"
import React from "react"
import { transformSync } from "./transform"

const componentChunkNamesByPage = {}

// this is a suitable lifecycle method during ssr when we can patch raw query data
export const wrapPageElement = ({ element, props }) => {
  const componentChunkNames = new Set()

  const data = transformSync({
    json: props.data,
    load: ({ componentChunkName }) => {
      componentChunkNames.add(componentChunkName)
      return components[componentChunkName]
    }
  })

  componentChunkNamesByPage[props.location.pathname] = componentChunkNames

  return cloneElement(element, {
    ...props,
    data
  })
}

export const onRenderBody = ({ pathname, pathPrefix, setHeadComponents }) => {
  if (process.env.NODE_ENV === `production`) {
    const path = __non_webpack_require__(`path`)
    const { cwd } = __non_webpack_require__(`process`)

    const chunkMap = __non_webpack_require__(path.join(cwd(), `public`, `chunk-map.json`))

    componentChunkNamesByPage[pathname].forEach(componentChunkName => {
      chunkMap[componentChunkName]
        .filter(asset => asset.endsWith(`.js`))
        .forEach(asset => {
          setHeadComponents([<link as="script" rel="preload" key={asset} href={`${pathPrefix}${asset}`} />])
        })
    })
  }
}
