module.exports = problem = new Problem """

Problem 17: Number letter counts
--------------------------------

If the numbers 1 to 5 are written out in words: one, two, three, four, five, then there are 3 + 3 + 5 + 4 + 4 = 19 letters used in total.

If all the numbers from 1 to 1000 (one thousand) inclusive were written out in words, how many letters would be used?

NOTE: Do not count spaces or hyphens. For example, 342 (three hundred and forty-two) contains 23 letters and 115 (one hundred and fifteen) contains 20 letters. The use of "and" when writing out numbers is in compliance with British usage.

"""

names =
  ones: "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(/\s+/)
  tens: "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split(/\s+/)

# supports 0-9999
numberLetterCount = (num) ->
  n = num
  name = ""

  if n >= 1000
    thousands = Math.floor(n / 1000)
    n = n % 1000
    name += "#{names.ones[thousands]} thousand "

  if n >= 100
    hundreds = Math.floor(n / 100)
    n = n % 100
    name += "#{names.ones[hundreds]} hundred "

  if (n > 0) and (name.length > 0)
    name += "and "

  if n >= 20
    tens = Math.floor(n / 10)
    n = n % 10
    name += "#{names.tens[tens]} "

  if n > 0
    name += "#{names.ones[n]} "

  lettersOnly = name.replace(/[^a-z]/g, "")
  # console.log "num: #{num}, name: #{name}, lettersOnly: #{lettersOnly}"
  return lettersOnly.length

numberLetterCountRange = (a, b) ->
  sum = 0
  for i in [a..b]
    sum += numberLetterCount(i)
  return sum

problem.test = ->
  equal(numberLetterCountRange(1, 5), 19, "sum of lengths of numbers 1-5 is 19")
  equal(numberLetterCount(342), 23, "length of name of 342 is 23")
  equal(numberLetterCount(115), 20, "length of name of 115 is 20")

problem.answer = ->
  return numberLetterCountRange(1, 1000)
