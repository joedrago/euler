problem = new Problem """

Problem 5: Smallest multiple
----------------------------

2520 is the smallest number that can be divided by each of the numbers from 1 to 10 without any remainder.

What is the smallest positive number that is evenly divisible by all of the numbers from 1 to 20?

"""

problem.run ->

  n = 0
  loop
    n += 20 # Probably could be some clever sum of primes between 1-20 or something. I don't care.
    found = true
    for i in [1..20]
      if (n % i) != 0
        found = false
        break

    break if found

  return n
