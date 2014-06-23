module.exports = problem = new Problem """

Problem 15: Lattice paths
-------------------------

Starting in the top left corner of a 2×2 grid, and only being able to move to the right and down, there are exactly 6 routes to the bottom right corner.

    (picture showing 6 paths: RRDD, RDRD, RDDR, DRRD, DRDR, DDRR)

How many such routes are there through a 20×20 grid?

"""

class LatticePath
  constructor: (@dim) ->

  walkPath: (x, y) ->
    count = 0

    if (x == @dim) and (y == @dim)
      count++
    else
      if x != @dim
        count += @walkPath(x + 1, y)
      if y != @dim
        count += @walkPath(x, y + 1)

    return count

  countPaths: ->
    return @walkPath(0, 0)

lattice = (n) ->
  return new LatticePath(n).countPaths()

problem.test = ->
  equal(lattice(1), 2, "1x1 lattice has 2 paths")
  equal(lattice(2), 6, "2x2 lattice has 6 paths")

problem.answer = ->
  return 0 # lattice(20)
