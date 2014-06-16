problem = new Problem """

Problem 7: 10001st prime
------------------------

By listing the first six prime numbers: 2, 3, 5, 7, 11, and 13, we can see that the 6th prime is 13.

What is the 10,001st prime number?

"""

# Sieve was blindly taken/adapted from RosettaCode. DONT EVEN CARE
class IncrementalSieve
  constructor: ->
    @n = 0

  next: ->
    @n += 2
    if @n < 7
      if @n < 3
        @n = 1
        return 2
      if @n < 5
        return 3
      @dict = {}
      @bps = new IncrementalSieve()
      @bps.next()
      @p = @bps.next()
      @q = @p * @p
      return 5
    else
      s = @dict[@n]
      if not s
        if @n < @q
          return @n
        else
          p2 = @p << 1
          @dict[@n + p2] = p2
          @p = @bps.next()
          @q = @p * @p
          return @next()
      else
        delete @dict[@n]
        nxt = @n + s
        while (@dict[nxt])
          nxt += s
        @dict[nxt] = s
        return @next()

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
