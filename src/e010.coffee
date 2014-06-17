problem = new Problem """

Problem 10: Summation of primes
-------------------------------

The sum of the primes below 10 is 2 + 3 + 5 + 7 = 17.

Find the sum of all the primes below two million.

"""

primeSum = (ceiling) ->
  sieve = new IncrementalSieve

  sum = 0
  loop
    n = sieve.next()
    if n >= ceiling
      break
    sum += n

  return sum

problem.run
  test: ->
    equal(primeSum(10), 17, "Sum of primes below 10 is 17")

  answer: ->
    return primeSum(2000000)
