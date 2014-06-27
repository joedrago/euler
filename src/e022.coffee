module.exports = problem = new Problem """

Problem 22: Names scores
------------------------

Using names.txt (right click and 'Save Link/Target As...'), a 46K text file containing over five-thousand first names, begin by sorting it into alphabetical order. Then working out the alphabetical value for each name, multiply this value by its alphabetical position in the list to obtain a name score.

For example, when the list is sorted into alphabetical order, COLIN, which is worth 3 + 15 + 12 + 9 + 14 = 53, is the 938th name in the list. So, COLIN would obtain a score of 938 × 53 = 49714.

What is the total of all the name scores in the file?

"""

fs = require "fs"

readNames = ->
  rawNames = String(fs.readFileSync(__dirname + "/../data/names.txt"))
  names = rawNames.replace(/"/gm, "").split(",")
  return names

alphabeticalValue = (name) ->
  sum = 0
  for i in [0...name.length]
    v = name.charCodeAt(i) - 64 # A is 65 in ascii, so this makes the value of 'A' == 1
    sum += v
  return sum

problem.test = ->
  equal(alphabeticalValue("COLIN"), 53, "alphabetical value for COLIN is 53")

problem.answer = ->
  names = readNames()
  names.sort()

  sum = 0
  for name, i in names
    v = alphabeticalValue(name) * (i + 1)
    sum += v
  return sum
