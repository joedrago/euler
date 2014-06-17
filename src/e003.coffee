module.exports = problem = new Problem """

Problem 3: Largest prime factor
-------------------------------

The prime factors of 13195 are 5, 7, 13 and 29.

What is the largest prime factor of the number 600851475143 ?

"""

# -----------------------------------------------------------------------------------
# Shamelessly pilfered/adopted from http://www.javascripter.net/faq/numberisprime.htm

leastFactor = (n) ->
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

isPrime = (n) ->
  if isNaN(n) or not isFinite(n) or (n % 1) != 0 or (n < 2)
    return false
  if n == leastFactor(n)
    return true

  return false

# -----------------------------------------------------------------------------------

primeFactors = (n) ->
  return [1] if n == 1

  factors = []
  while not isPrime(n)
    factor = leastFactor(n)
    factors.push factor
    n /= factor
  factors.push n
  return factors

largestPrimeFactor = (n) ->
  return 1 if n == 1

  while not isPrime(n)
    factor = leastFactor(n)
    n /= factor
  return n

problem.run = ->
  return largestPrimeFactor(600851475143)
