# -------------------------------------------------------------------------------
# Modules

# Assumed to be in src/XXXXX.coffee, @is also the require() string
modules = [
  'loopscript'
  'riffwave'
  'freq'
  'examples'
]

pages = [
  'index'
  'play'
  'learn'
  'source'
]

pageTitles =
  index: "Home"
  play: "Play"
  learn: "Learn"
  source: "Source"

# -------------------------------------------------------------------------------
# Build scripts

browserify = require 'browserify'
fs         = require 'fs'
util       = require 'util'
watch      = require 'node-watch'
http       = require 'http'
{spawn}    = require 'child_process'

coffeeName = 'coffee'
if process.platform == 'win32'
  coffeeName += '.cmd'

generateJSBundle = (cb) ->
  name = "euler"
  outputDir = "js/"
  b = browserify {
    basedir: outputDir
    extensions: ['coffee']
  }
  b.transform 'coffeeify'
  b.transform 'brfs'
  rawFileList = fs.readdirSync("src")
  fileList = []
  for f in rawFileList
    f = String(f)
    matches = f.match(/(\S+)\.coffee$/)
    if matches
      fileList.push matches[1]
  for module in fileList
    b.require('../src/' + module + ".coffee", { expose: module })
  outputFilename = "#{outputDir}#{name}.js"
  bundlePipe = b.bundle({ debug: true })
    .on 'error', (err) ->
      util.log "Error #{err}"
    bundlePipe
      .pipe(require('mold-source-map').transformSourcesRelativeTo(outputDir))
      .pipe(fs.createWriteStream(outputFilename))
      .on 'finish', ->
        util.log "Generated #{outputFilename}"
        cb() if cb?

buildEverything = (cb) ->
  generateJSBundle ->
    cb() if cb

task 'build', 'build JS bundle', (options) ->
  buildEverything ->
    util.log "Build complete."

option '-p', '--port [PORT]', 'Dev server port'

task 'server', 'Run server and watch for changed source files to automatically rebuild', (options) ->
  buildEverything ->
    util.log "Watching for changes in src"

    options.port ?= 9000
    util.log "Starting server at http://localhost:#{options.port}/"

    nodeStatic = require 'node-static'
    file = new nodeStatic.Server '.'
    httpServer = http.createServer (request, response) ->
      request.addListener 'end', ->
        file.serve(request, response);
      .resume()
    httpServer.listen options.port

    watch ['src'], (filename) ->
      util.log "Source code #{filename} changed, regenerating bundle..."
      buildEverything()
