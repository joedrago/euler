module.exports = problem = new Problem """

Problem 25: 1000-digit Fibonacci number
---------------------------------------

The Fibonacci sequence is defined by the recurrence relation:

F(n) = F(n−1) + F(n−2), where F(1) = 1 and F(2) = 1.
Hence the first 12 terms will be:

F(1)  = 1
F(2)  = 1
F(3)  = 2
F(4)  = 3
F(5)  = 5
F(6)  = 8
F(7)  = 13
F(8)  = 21
F(9)  = 34
F(10) = 55
F(11) = 89
F(12) = 144
The 12th term, F(12), is the first term to contain three digits.

What is the first term in the Fibonacci sequence to contain 1000 digits?

"""

bigInt = require "big-integer"

firstFiboWithDigitCount = (n) ->
  index = 1
  prev = new bigInt(0)
  curr = new bigInt(1)
  loop
    str = String(curr)
    digitCount = str.length
    if digitCount >= n
      return [index, str]
    next = curr.plus(prev)
    prev = curr
    curr = next
    index++

problem.test = ->
  equal(firstFiboWithDigitCount(3), [12, "144"], "first fibonacci with 3 digits is F(12) = 144")

problem.answer = ->
  return firstFiboWithDigitCount(1000)
