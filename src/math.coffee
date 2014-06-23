root = exports ? this

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

root.IncrementalSieve = IncrementalSieve

# -----------------------------------------------------------------------------------
# Shamelessly pilfered/adopted from http://www.javascripter.net/faq/numberisprime.htm

root.leastFactor = (n) ->
  return NaN if isNaN(n) or not isFinite(n)
  return 0 if n == 0
  return 1 if (n % 1) != 0 or (n * n) < 2
  return 2 if (n % 2) == 0
  return 3 if (n % 3) == 0
  return 5 if (n % 5) == 0

  m = Math.sqrt n
  for i in [7..m] by 30
    return i    if (n % i)      == 0
    return i+4  if (n % (i+4))  == 0
    return i+6  if (n % (i+6))  == 0
    return i+10 if (n % (i+10)) == 0
    return i+12 if (n % (i+12)) == 0
    return i+16 if (n % (i+16)) == 0
    return i+22 if (n % (i+22)) == 0
    return i+24 if (n % (i+24)) == 0

  return n

root.isPrime = (n) ->
  if isNaN(n) or not isFinite(n) or (n % 1) != 0 or (n < 2)
    return false
  if n == root.leastFactor(n)
    return true

  return false

# -----------------------------------------------------------------------------------

root.primeFactors = (n) ->
  return [1] if n == 1

  factors = []
  while not root.isPrime(n)
    factor = root.leastFactor(n)
    factors.push factor
    n /= factor
  factors.push n
  return factors

root.factorial = (n) ->
  f = n
  while n > 1
    n--
    f *= n
  return f

root.nCr = (n, r) ->
  return Math.floor(root.factorial(n) / (root.factorial(r) * root.factorial(n - r)))
