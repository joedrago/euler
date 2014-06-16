problem = new Problem """

Problem 9: Special Pythagorean triplet
--------------------------------------

A Pythagorean triplet is a set of three natural numbers, a < b < c, for which,

    a^2 + b^2 = c^2

For example, 3^2 + 4^2 = 9 + 16 = 25 = 5^2.

There exists exactly one Pythagorean triplet for which a + b + c = 1000.

Find the product abc.

"""

isTriplet = (a, b, c) ->
  return ((a*a) + (b*b)) == (c*c)

findFirstTriplet = (sum) ->
  for a in [1...1000]
    for b in [1...1000]
      c = 1000 - a - b
      if isTriplet(a, b, c)
        return [a, b, c]

  return false


test problem.title, ->

  ok(isTriplet(3, 4, 5), "(3,4,5) is a Pythagorean triplet")

  triplet = findFirstTriplet(1000)

  deepEqual(triplet, [200, 375, 425], "Pythagorean triplet whose sum is 1000: " + JSON.stringify(triplet))

  ok(true, "Answer: " + JSON.stringify(triplet))
