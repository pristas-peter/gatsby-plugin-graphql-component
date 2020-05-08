import { graphql, useStaticQuery } from "gatsby"
import React from "react"

export default props => {
  const data = useStaticQuery(graphql`
    query {
      Tester
      allSitePage {
        edges {
          node {
            id
          }
        }
      }
    }
  `)

  console.log({ data })

  return <data.Tester></data.Tester>
}
