module.exports = problem = new Problem """

Problem 7: 10001st prime
------------------------

By listing the first six prime numbers: 2, 3, 5, 7, 11, and 13, we can see that the 6th prime is 13.

What is the 10,001st prime number?

"""

nthPrime = (n) ->
  sieve = new IncrementalSieve
  for i in [1...n]
    sieve.next()
  return sieve.next()

problem.test = ->
  equal(nthPrime(6), 13, "6th prime is 13")

problem.answer = ->
  return nthPrime(10001)
