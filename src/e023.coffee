module.exports = problem = new Problem """

Problem 23: Non-abundant sums
-----------------------------

A perfect number is a number for which the sum of its proper divisors is exactly equal to the number. For example, the sum of the proper divisors of 28 would be 1 + 2 + 4 + 7 + 14 = 28, which means that 28 is a perfect number.

A number n is called deficient if the sum of its proper divisors is less than n and it is called abundant if this sum exceeds n.

As 12 is the smallest abundant number, 1 + 2 + 3 + 4 + 6 = 16, the smallest number that can be written as the sum of two abundant numbers is 24. By mathematical analysis, it can be shown that all integers greater than 28123 can be written as the sum of two abundant numbers. However, this upper limit cannot be reduced any further by analysis even though it is known that the greatest number that cannot be expressed as the sum of two abundant numbers is less than this limit.

Find the sum of all the positive integers which cannot be written as the sum of two abundant numbers.

"""

math = require "math"

divisorSum = (n) ->
  return math.sum(math.divisors(n))

isAbundant = (n) ->
  return (divisorSum(n) > n)

isPerfect = (n) ->
  return (divisorSum(n) == n)

abundantList = ->
  list = []
  for n in [1..28123]
    if isAbundant(n)
      list.push n
  return list

problem.test = ->
  equal(isPerfect(28), true, "28 is a perfect number")

problem.answer = ->
  list = abundantList()
  console.log list
  sumOfAbundantsSeen = {}
  for i in list
    for j in list
      sumOfAbundantsSeen[ i + j ] = true

  sum = 0
  for i in [1..28123]
    if not sumOfAbundantsSeen[i]
      sum += i

  return sum
