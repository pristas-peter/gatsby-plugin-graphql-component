import { components } from "~gatsby-plugin-graphql-component/sync-requires"
import { cloneElement } from "react"

import { transformSync } from "./transform"
export const wrapPageElement = ({ element, props }) =>
  cloneElement(element, {
    ...props,
    data: transformSync({
      json: props.data,
      load: ({ componentChunkName }) => components[componentChunkName],
    }),
  })
