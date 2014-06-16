problem = new Problem """

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

test problem.title, ->
  equal(nthPrime(6), 13, "6th prime is 13")

  prime10001 = nthPrime(10001)
  equal(prime10001, 104743, "10,001st prime is 104743")
  ok(true, "Answer: #{prime10001}")
