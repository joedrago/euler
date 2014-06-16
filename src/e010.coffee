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

test problem.title, ->

  equal(primeSum(10), 17, "Sum of primes below 10 is 17")

  twomil = primeSum(2000000)
  equal(twomil, 142913828922, "Sum of primes below 2,000,000 is 142,913,828,922")

  ok(true, "Answer: #{twomil}")
