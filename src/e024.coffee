module.exports = problem = new Problem """

Problem 24: Lexicographic permutations
--------------------------------------

A permutation is an ordered arrangement of objects. For example, 3124 is one possible permutation of the digits 1, 2, 3 and 4. If all of the permutations are listed numerically or alphabetically, we call it lexicographic order. The lexicographic permutations of 0, 1 and 2 are:

                            012   021   102   120   201   210

What is the millionth lexicographic permutation of the digits 0, 1, 2, 3, 4, 5, 6, 7, 8 and 9?

"""

# This function is -way- too slow
permute = (current, src, dst) ->
  for v,i in src
    newcurrent = current + v
    if src.length > 1
      leftovers = src.slice(0)
      leftovers.splice(i, 1)
      permute newcurrent, leftovers, dst
    else
      dst.push newcurrent

lexPermute = (chars) ->
  dst = []
  permute("", chars.split(""), dst)
  dst.sort()
  return dst

problem.test = ->
  dst = lexPermute("012")
  console.log dst
  equal(lexPermute("012"), "012 021 102 120 201 210".split(" "), "permutation of 012 is [012 021 102 120 201 210]")

problem.answer = ->
  dst = lexPermute("0123456789")
  return dst[999999] # [0] is first, therefore [999999] is 1,000,000th
