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

lexPermuteSlow = (chars) ->
  dst = []
  permute("", chars.split(""), dst)
  dst.sort()
  return dst

swap = (arr, a, b) ->
  t = arr[a]
  arr[a] = arr[b]
  arr[b] = t

dijkstraPermuteNext = (arr) ->
  N = arr.length
  i = N - 1
  while arr[i-1] >= arr[i]
    i = i-1

  j = N
  while (arr[j-1] <= arr[i-1])
    j = j-1

  swap(arr, i-1, j-1)    # swap values at positions (i-1) and (j-1)

  i++
  j = N
  while (i < j)
    swap(arr, i-1, j-1)
    i++
    j--

lexPermuteFast = (chars, which) ->
  arr = (parseInt(v) for v in chars)
  for i in [1...which]
    dijkstraPermuteNext(arr)
  return arr.join("")

problem.test = ->
  equal(lexPermuteFast("012", 4), "120", "4th permutation of 012 is 120, fast version")
  equal(lexPermuteSlow("012"), "012 021 102 120 201 210".split(" "), "permutation of 012 is 012 021 102 120 201 210, slow version")

problem.answer = ->
  return lexPermuteFast("0123456789", 1000000)

  # slow version, took ~13 seconds on a 2014 Macbook Pro
  # dst = lexPermuteSlow("0123456789")
  # return dst[999999] # [0] is first, therefore [999999] is 1,000,000th
