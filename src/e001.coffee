test 'Problem 1: Multiples of 3 and 5', ->
  sum = 0
  for i in [1...10]
    if (i % 3 == 0) or (i % 5 == 0)
      sum += i

  equal(sum, 23, "Sum of natural numbers < 10: #{sum}")

  sum = 0
  for i in [1...1000]
    if (i % 3 == 0) or (i % 5 == 0)
      sum += i

  equal(sum, 233168, "Sum of natural numbers < 1000: #{sum}")
