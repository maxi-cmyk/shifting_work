const fs = require('node:fs')
const path = require('node:path')

const output = path.resolve(__dirname, '..', '..', 'dist')

if (path.basename(output) !== 'dist') {
  throw new Error(`Refusing to clean unexpected output path: ${output}`)
}

fs.rmSync(output, { recursive: true, force: true })
