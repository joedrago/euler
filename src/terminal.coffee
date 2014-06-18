LAST_PROBLEM = 11

root = window # exports ? this

root.escapedStringify = (o) ->
  str = JSON.stringify(o)
  str = str.replace("]", "\\]")
  return str

root.runAll = ->
  lastPuzzle = LAST_PROBLEM
  nextIndex = 0

  loadNextScript = ->
    if nextIndex < lastPuzzle
      nextIndex++
      runTest(nextIndex, loadNextScript)
  loadNextScript()

root.iterateProblems = (args) ->

  indexToProcess = null
  if args.endIndex > 0
    if args.startIndex <= args.endIndex
      indexToProcess = args.startIndex
      args.startIndex++
  else
    if args.list.length > 0
      indexToProcess = args.list.shift()

  if indexToProcess != null
    iterateNext = ->
      window.args = args
      runTest indexToProcess, ->
        iterateProblems(args)
    iterateNext()

root.runTest = (index, cb) ->
  moduleName = "e#{('000'+index).slice(-3)}"
  window.index = index
  problem = require(moduleName)
  problem.process()
  window.setTimeout(cb, 0) if cb

class Problem
  constructor: (@description) ->
    @index = window.index
    lines = @description.split(/\n/)
    lines.shift() while lines.length > 0 and lines[0].length == 0
    @title = lines.shift()
    @line = lines.shift()
    @description = lines.join("\n")

  now: ->
    return if window.performance then window.performance.now() else new Date().getTime()

  process: ->
    if window.args.description
      window.terminal.echo "[[;#444444;]_______________________________________________________________________________________________]\n"

    formattedTitle = $.terminal.format("[[;#ffaa00;]#{@title}]")
    window.terminal.echo "<a href=\"?c=#{window.args.cmd}%20#{@index}\">#{formattedTitle}</a>", { raw: true }

    if window.args.description
      window.terminal.echo "[[;#444444;]#{@line}]"
      window.terminal.echo "[[;#ccccee;]#{@description}]\n"

    if @run.hasOwnProperty 'test'
      answerFunc = @run.answer
      testFunc = @run.test
    else
      answerFunc = @run
      testFunc = undefined

    if window.args.test
      if testFunc == undefined
        window.terminal.echo "[[;#444444;] (no tests)]"
      else
        testFunc()

    if window.args.answer
      start = @now()
      answer = answerFunc()
      end = @now()
      ms = end - start
      window.terminal.echo "[[;#ffffff;] -> ][[;#aaffaa;]Answer:] ([[;#aaffff;]#{ms.toFixed(1)}ms]): [[;#ffffff;]#{escapedStringify(answer)}]"

root.Problem = Problem

root.ok = (v, msg) ->
  window.terminal.echo "[[;#ffffff;] *  ]#{v}: #{msg}"

root.equal = (a, b, msg) ->
  if a == b
    window.terminal.echo "[[;#ffffff;] *  ][[;#555555;]PASS: #{msg}]"
  else
    window.terminal.echo "[[;#ffffff;] *  ][[;#ffaaaa;]FAIL: #{msg} (#{a} != #{b})]"

root.onCommand = (command) =>
  return if command.length == 0
  cmd = $.terminal.parseCommand(command)
  return if cmd.name.length == 0

  console.log cmd

  verbose = false

  args =
    startIndex: 0
    endIndex: 0
    list: []
    description: false
    test: false
    answer: false

  process = true

  for arg in cmd.args
    arg = String(arg)
    continue if arg.length < 1
    if arg[0] == 'v'
      verbose = true
    else if arg.match(/^\d+$/)
      v = parseInt(arg)
      if (v >= 1) and (v <= LAST_PROBLEM)
        args.list.push(v)
      else
        process = false
        window.terminal.echo "[[;#ffaaaa;]No such test: #{v} (valid tests 1-#{LAST_PROBLEM})]"

  if args.list.length == 0
    args.startIndex = 1
    args.endIndex = LAST_PROBLEM

  # Since all of our commands happen to have unique first letters, let people be super lazy/silly
  if cmd.name[0] == 'l'
    args.cmd = "list"
  else if cmd.name[0] == 'd'
    args.cmd = "describe"
    args.description = true
  else if cmd.name[0] == 't'
    args.cmd = "test"
    args.test = true
  else if cmd.name[0] == 'a'
    args.cmd = "answer"
    args.answer = true
  else if cmd.name[0] == 'r'
    args.cmd = "run"
    args.test = true
    args.answer = true
  else if cmd.name[0] == 'd'
    args.cmd = "describe"
    args.description = true
  else if cmd.name[0] == 'h'
    args.cmd = "help"
    process = false
    window.terminal.echo """
    Commands:

        list [X]     - List problem titles
        describe [X] - Display full problem descriptions
        test [X]     - Run unit tests
        answer [X]   - Time and calculate answer
        run [X]      - test and answer combined
        help         - This help

        In all of these, [X] can be a list of one or more problem numbers. (a value from 1 to #{LAST_PROBLEM}). If absent, it implies all problems.
        Also, adding the word "verbose" to some of these commands will emit the description before performing the task.

    """
  else
    process = false
    window.terminal.echo "[[;#ffaaaa;]Unknown command.]"

  if verbose
    args.description = true

  if process
    iterateProblems(args)
