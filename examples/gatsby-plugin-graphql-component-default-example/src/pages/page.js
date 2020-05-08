import { graphql, Link } from "gatsby"
import React from "react"
export const pageQuery = graphql`
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
`

export default props => {
  const { Tester } = props.data

  console.log(props.data)

  return (
    <>
      <Link to="/test">Test Page</Link>
      Test<br></br>
      <Tester></Tester>
    </>
  )
}
