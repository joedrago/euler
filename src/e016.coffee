module.exports = problem = new Problem """

Problem 16: Power digit sum
---------------------------

2^15 = 32768 and the sum of its digits is 3 + 2 + 7 + 6 + 8 = 26.

What is the sum of the digits of the number 2^1000?

"""

math = require "math"
bigInt = require "big-integer"

MAX_EXPONENT = 50

powerDigitSum = (x, y) ->
  number = bigInt(1)
  while y != 0
    exponent = y
    if exponent > MAX_EXPONENT
      exponent = MAX_EXPONENT
    y -= exponent
    number = number.multiply Math.floor(Math.pow(x, exponent))
  digits = String(number)

  sum = 0
  for d in digits
    sum += parseInt(d)
  return sum

problem.test = ->
  equal(powerDigitSum(2, 15), 26, "sum of digits of 2^15 is 26")

problem.answer = ->
  return powerDigitSum(2, 1000)
