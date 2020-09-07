module.exports = problem = new Problem """

Problem 4: Largest palindrome product
-------------------------------------

A palindromic number reads the same both ways.

Find the largest palindrome made from the product of two 3-digit numbers.

"""

isPalindrome = (n) ->
  str = n.toString()
  for i in [0...(str.length / 2)]
    if str[i] != str[str.length - 1 - i]
      return false
  return true

problem.test = ->
  # Make sure isPalindrome works properly first
  for v in [1, 11, 121, 1221, 12321, 1234321]
    equal(isPalindrome(v), true, "isPalindrome(#{v}) returns true")
  for v in [12, 123, 1234, 12345, 123456, 12324]
    equal(isPalindrome(v), false, "isPalindrome(#{v}) returns false")

problem.answer = ->
  largesti = 0
  largestj = 0
  largestp = 0

  for i in [100..999]
    for j in [100..999]
      product = i * j
      if isPalindrome(product) and (product > largestp)
        largesti = i
        largestj = j
        largestp = product

  return largestp
