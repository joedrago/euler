problem = new Problem """

Problem 1: Multiples of 3 and 5
-------------------------------

If we list all the natural numbers below 10 that are multiples of 3 or 5, we get 3, 5, 6 and 9.
The sum of these multiples is 23.

Find the sum of all the multiples of 3 or 5 below 1000.

"""

problem.run
  test: ->
    sum = 0
    for i in [1...10]
      if (i % 3 == 0) or (i % 5 == 0)
        sum += i
    equal(sum, 23, "Sum of natural numbers < 10: #{sum}")

  main: ->
    sum = 0
    for i in [1...1000]
      if (i % 3 == 0) or (i % 5 == 0)
        sum += i

    return sum
