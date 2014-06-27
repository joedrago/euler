module.exports = problem = new Problem """

Problem 20: Factorial digit sum
-------------------------------

n! means n x (n − 1) x ... x 3 x 2 x 1

For example, 10! = 10 x 9 x ... x 3 x 2 x 1 = 3628800,
and the sum of the digits in the number 10! is 3 + 6 + 2 + 8 + 8 + 0 + 0 = 27.

Find the sum of the digits in the number 100!

"""

bigInt = require "big-integer"

hugeFactorial = (n) ->
  number = bigInt(1)
  for i in [1..n]
    number = number.multiply i
  return number

sumOfDigits = (n) ->
  digits = String(n)

  sum = 0
  for digit in digits
    sum += parseInt(digit)

  return sum

problem.test = ->
  equal(sumOfDigits(hugeFactorial(10)), 27, "sum of factorial digits of 10! is 27")

problem.answer = ->
  return sumOfDigits(hugeFactorial(100))
