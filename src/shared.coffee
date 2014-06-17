root = exports ? this

root.escapedStringify = (o) ->
  str = JSON.stringify(o)
  str = str.replace("]", "\\]")
  return str

root.runAll = ->
  lastPuzzle = 10
  nextIndex = 0

  loadNextScript = ->
    if nextIndex < lastPuzzle
      nextIndex++
      runTest(nextIndex, loadNextScript)
  loadNextScript()

root.runTest = (index, cb) ->
  filePath = "src/e#{('000'+index).slice(-3)}.coffee"
  CoffeeScript.load(filePath, cb)

class Problem
  constructor: (@description) ->
    lines = @description.split(/\n/)
    lines.shift() while lines.length > 0 and lines[0].length == 0
    @title = lines[0]

  now: ->
    return if window.performance then window.performance.now() else new Date().getTime()

  run: (funcs) ->
    test @title, =>
      if funcs.hasOwnProperty 'test'
        mainFunc = funcs.main
        testFunc = funcs.test
      else
        mainFunc = funcs
        testFunc = undefined

      if testFunc != undefined
        testFunc()

      start = @now()
      answer = mainFunc()
      end = @now()
      ms = end - start

      window.terminal.echo "[[;#ffffff;] -> ][[;#aaffaa;]Answer:] ([[;#aaffff;]#{ms.toFixed(1)}ms]): [[;#ffffff;]#{escapedStringify(answer)}]"

root.Problem = Problem

# Sieve was blindly taken/adapted from RosettaCode. DONT EVEN CARE
class IncrementalSieve
  constructor: ->
    @n = 0

  next: ->
    @n += 2
    if @n < 7
      if @n < 3
        @n = 1
        return 2
      if @n < 5
        return 3
      @dict = {}
      @bps = new IncrementalSieve()
      @bps.next()
      @p = @bps.next()
      @q = @p * @p
      return 5
    else
      s = @dict[@n]
      if not s
        if @n < @q
          return @n
        else
          p2 = @p << 1
          @dict[@n + p2] = p2
          @p = @bps.next()
          @q = @p * @p
          return @next()
      else
        delete @dict[@n]
        nxt = @n + s
        while (@dict[nxt])
          nxt += s
        @dict[nxt] = s
        return @next()

root.IncrementalSieve = IncrementalSieve

root.ok = (v, msg) ->
  window.terminal.echo "[[;#ffffff;] *  ]#{v}: #{msg}"

root.equal = (a, b, msg) ->
  if a == b
    window.terminal.echo "[[;#ffffff;] *  ][[;#555555;]#{msg}]"
  else
    window.terminal.echo "[[;#ffffff;] *  ][[;#ffaaaa;]#{msg}]"

root.test = (title, func) ->
  window.terminal.echo "[[;#ffaa00;]#{title}]"
  func()

root.onCommand = (command) =>
  return if command.length == 0
  matches = command.match(/^run(?:\s+(\d+))?/)
  if matches
    if matches[1] != undefined
      runTest parseInt(matches[1])
    else
      runAll()
  else
    window.terminal.echo "[[;#ffaaaa;]Unknown command.]"
