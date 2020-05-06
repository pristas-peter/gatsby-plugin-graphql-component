import { components } from "~gatsby-plugin-graphql-component/sync-requires";
import { cloneElement } from "react";

import { transformSync } from "./transform";

// this is a suitable lifecycle method during ssr when we can patch raw query data
export const wrapPageElement = ({ element, props }) =>
  cloneElement(element, {
    ...props,
    data: transformSync({
      json: props.data,
      load: ({ componentChunkName }) => components[componentChunkName],
    }),
  });
