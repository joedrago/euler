module.exports = problem = new Problem """

Problem 26: Reciprocal cycles
-----------------------------

A unit fraction contains 1 in the numerator. The decimal representation of the unit fractions with denominators 2 to 10 are given:

1/2   =   0.5
1/3   =   0.(3)
1/4   =   0.25
1/5   =   0.2
1/6   =   0.1(6)
1/7   =   0.(142857)
1/8   =   0.125
1/9   =   0.(1)
1/10  =   0.1

Where 0.1(6) means 0.166666..., and has a 1-digit recurring cycle. It can be seen that 1/7 has a 6-digit recurring cycle.

Find the value of d < 1000 for which 1/d contains the longest recurring cycle in its decimal fraction part.

"""

Decimal = require 'decimal.js'
Decimal.precision = 1500 # oof

loopsAt = (digits, front, len) ->
  endIndex = digits.length - 1 - front
  if endIndex <= len
    return false
  if endIndex > 3
    # trim rounding digit, hax
    endIndex -= 1
  for i in [0..endIndex]
    if digits.charAt(front + i) != digits.charAt(front + (i % len))
      return false
  return true

# Never leave a text-based tools programmer to solve a math problem
findRecurringCycleSlow = (denominator) ->
  digits = String(new Decimal(1).dividedBy(denominator))
  digits = digits.replace(/^0./, "")
  digitsLen = digits.length
  halfDigitsLen = digitsLen >> 1

  cycle =
    denominator: denominator
    front: -1
    length: -1
    pretty: "0.#{digits}"

  for cycleFront in [0..halfDigitsLen]
    if cycle.length != -1
      break
    for cycleLength in [1..halfDigitsLen+1]
      if loopsAt(digits, cycleFront, cycleLength)
        cycle.front = cycleFront
        cycle.length = cycleLength
        cycle.repeat = digits.substr(cycleFront, cycleLength)
        cycle.pretty = "0.#{digits.substr(0, cycleFront)}(#{cycle.repeat})"
        break

  return cycle

# This began life as someone else's fractionToDecimal() Python code; my homemade version is the slow garbage above
findRecurringCycleFast = (denominator) ->
  numerator = 1

  num = denominator
  num2Factors = 0
  while num % (2 ** (num2Factors + 1)) == 0
    num2Factors += 1

  num5Factors = 0
  while num % (5 ** (num5Factors + 1)) == 0
      num5Factors += 1
  nonRecurringCount = Math.max(num2Factors, num5Factors)

  nonRecurringPart = ''
  while (nonRecurringCount > 0) and (numerator > 0)
    numerator *= 10
    nonRecurringPart += String(Math.floor(numerator / denominator))
    numerator = numerator % denominator
    nonRecurringCount -= 1

  firstNum = numerator
  recurringPart = ''
  while numerator > 0
    numerator *= 10
    recurringPart += String(Math.floor(numerator / denominator))
    numerator %= denominator
    if numerator == firstNum
      break

  pretty = "0.#{nonRecurringPart}"
  if recurringPart.length > 0
    pretty += '(' + recurringPart + ')'

  cycle =
    denominator: denominator
    length: recurringPart.length
    pretty: pretty
  return cycle

findRecurringCycle = findRecurringCycleFast

problem.test = ->
  cequal(findRecurringCycle(2),  "!c.pretty!", "0.5", "Recurring cycle length 1/2 : !c.pretty!")
  cequal(findRecurringCycle(3),  "!c.pretty!", "0.(3)", "Recurring cycle length 1/3 : !c.pretty!")
  cequal(findRecurringCycle(4),  "!c.pretty!", "0.25", "Recurring cycle length 1/4 : !c.pretty!")
  cequal(findRecurringCycle(5),  "!c.pretty!", "0.2", "Recurring cycle length 1/5 : !c.pretty!")
  cequal(findRecurringCycle(6),  "!c.pretty!", "0.1(6)", "Recurring cycle length 1/6 : !c.pretty!")
  cequal(findRecurringCycle(7),  "!c.pretty!", "0.(142857)", "Recurring cycle length 1/7 : !c.pretty!")
  cequal(findRecurringCycle(8),  "!c.pretty!", "0.125", "Recurring cycle length 1/8 : !c.pretty!")
  cequal(findRecurringCycle(9),  "!c.pretty!", "0.(1)", "Recurring cycle length 1/9 : !c.pretty!")
  cequal(findRecurringCycle(10), "!c.pretty!", "0.1", "Recurring cycle length 1/10: !c.pretty!")

problem.answer = ->
  largestCycle = null
  largestLen = 0
  for v in [2...1000]
    cycle = findRecurringCycle(v)
    if largestLen < cycle.length
      largestLen = cycle.length
      largestCycle = cycle
  return largestCycle.denominator
