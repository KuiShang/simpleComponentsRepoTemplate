const spawn = require('child_process').spawn

const fs = require('fs')

const componentNameList = getSubDirNameList('src/components')

componentNameList.forEach(componentName => {
  const entry = `src/components/${componentName}/index.js`
  const dest = `lib/${componentName}`
  const spawnProcess = spawn('vue-cli-service', ['build', '--target', 'lib', '--formats', 'commonjs', '--name', componentName, '--filename', 'index', '--dest', dest, entry], {
    stdio: 'inherit',
    shell: true
  })
  spawnProcess.on('close', function () {
    renameFile(dest)
    ensureCssFileExisted(dest)
  })
})

function getSubDirNameList (path) {
  return fs.readdirSync(path, { withFileTypes: true })
    .filter(file => file.isDirectory())
    .map(file => file.name)
}

function renameFile (path) {
  fs.renameSync(`${path}/index.common.js`, `${path}/index.js`)
}
function ensureCssFileExisted (path) {
  const indexCss = `${path}/index.css`
  if (!fs.existsSync(indexCss)) {
    fs.writeFileSync(`${path}/index.css`, '')
  }
}
