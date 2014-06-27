module.exports = problem = new Problem """

Problem 21: Amicable numbers
----------------------------

Let d(n) be defined as the sum of proper divisors of n (numbers less than n which divide evenly into n).
If d(a) = b and d(b) = a, where a ≠ b, then a and b are an amicable pair and each of a and b are called amicable numbers.

For example, the proper divisors of 220 are 1, 2, 4, 5, 10, 11, 20, 22, 44, 55 and 110; therefore d(220) = 284. The proper divisors of 284 are 1, 2, 4, 71 and 142; so d(284) = 220.

Evaluate the sum of all the amicable numbers under 10000.

"""

math = require "math"
amicableCache = null

amicableValue = (n) ->
  if amicableCache.hasOwnProperty(n)
    return amicableCache[n]
  sum = 0
  for v in math.divisors(n)
    sum += v
  amicableCache[n] = sum
  return sum

problem.test = ->
  amicableCache = {}
  equal(amicableValue(220), 284, "amicable(220) == 284")
  equal(amicableValue(284), 220, "amicable(284) == 220")

problem.answer = ->
  amicableCache = {}
  amicableSeen = {}
  for i in [2...10000]
    a = amicableValue(i)
    b = amicableValue(a)
    if (a != b) and (b == i)
      amicableSeen[a] = true
      amicableSeen[b] = true

  amicableNumbers = (parseInt(v) for v in Object.keys(amicableSeen))

  sum = 0
  for v in amicableNumbers
    sum += v

  return sum
