module.exports = problem = new Problem """

Problem 14: Longest Collatz sequence
------------------------------------

The following iterative sequence is defined for the set of positive integers:

    n -> n/2    (n is even)
    n -> 3n + 1 (n is odd)

Using the rule above and starting with 13, we generate the following sequence:

    13 -> 40 -> 20 -> 10 -> 5 -> 16 -> 8 -> 4 -> 2 -> 1

It can be seen that this sequence (starting at 13 and finishing at 1) contains 10 terms. Although it has not been proved yet (Collatz Problem), it is thought that all starting numbers finish at 1.

Which starting number, under one million, produces the longest chain?

NOTE: Once the chain starts the terms are allowed to go above one million.

"""

collatzCache = {}

collatzChainLength = (startingValue) ->
  n = startingValue
  toBeCached = []

  loop
    break if collatzCache.hasOwnProperty(n)

    # remember that we failed to cache this entry
    toBeCached.push(n)

    if n == 1
      break

    if (n % 2) == 0
      n = Math.floor(n / 2)
    else
      n = (n * 3) + 1

  # Since we left breadcrumbs down the trail of things we haven't cached
  # walk back down the trail and cache all the entries found along the way
  len = toBeCached.length
  for v,i in toBeCached
    collatzCache[v] = collatzCache[n] + (len - i)

  return collatzCache[startingValue]

problem.test = ->
  collatzCache = { "1": 1 }
  equal(collatzChainLength(13), 10, "13 has a collatz chain of 10")
  equal(collatzChainLength(26), 11, "26 has a collatz chain of 11")
  equal(collatzChainLength( 1),  1, "1 has a collatz chain of 1")

problem.answer = ->
  collatzCache = { "1": 1 }

  maxChain = 0
  maxChainLength = 0
  for i in [1...1000000]
    chainLength = collatzChainLength(i)
    if maxChainLength < chainLength
      maxChainLength = chainLength
      maxChain = i

  return { answer: maxChain, chainLength: maxChainLength }
