const path = require(`path`)
const fs = require(`fs-extra`)

const { name } = require(`./package.json`)

exports.ensureWriteDirectory = async ({ baseDirectory, paths = [] }) => {
  const writeDirectory = path.join(baseDirectory, `.cache`, name, ...paths)
  await fs.mkdirp(writeDirectory)

  return writeDirectory
}

// writes file to disk only on change/new file (avoids unnecessary rebuilds)
exports.writeFile = async ({ filePath, data }) => {
  const oldData = await fs.readFile(filePath, `utf-8`).catch(() => null)

  if (oldData !== data) {
    await fs.outputFile(filePath, data)
  }
}
