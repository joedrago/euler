module.exports = problem = new Problem """

Problem 6: Sum square difference
--------------------------------

The sum of the squares of the first ten natural numbers is,

             1^2 + 2^2 + ... + 10^2 = 385

The square of the sum of the first ten natural numbers is,

          (1 + 2 + ... + 10)^2 = 55^2 = 3025

Hence the difference between the sum of the squares of the first ten natural numbers and the square of the sum is 3025 − 385 = 2640.

Find the difference between the sum of the squares of the first one hundred natural numbers and the square of the sum.

"""

sumOfSquares = (n) ->
  sum = 0
  for i in [1..n]
    sum += (i * i)
  return sum

squareOfSum = (n) ->
  sum = 0
  for i in [1..n]
    sum += i
  return (sum * sum)

differenceSumSquares = (n) ->
  return squareOfSum(n) - sumOfSquares(n)

problem.run =
  test: ->
    equal(sumOfSquares(10), 385, "Sum of squares of first ten natural numbers is 385")
    equal(squareOfSum(10), 3025, "Square of sum of first ten natural numbers is 3025")
    equal(differenceSumSquares(10), 2640, "Difference in values for the first ten natural numbers is 2640")

  answer: ->
    return differenceSumSquares(100)
