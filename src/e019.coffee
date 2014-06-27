module.exports = problem = new Problem """

Problem 19: Counting Sundays
----------------------------

You are given the following information, but you may prefer to do some research for yourself.

* 1 Jan 1900 was a Monday.
* Thirty days has September,
  April, June and November.
  All the rest have thirty-one,
  Saving February alone,
  Which has twenty-eight, rain or shine.
  And on leap years, twenty-nine.
* A leap year occurs on any year evenly divisible by 4, but not on a century unless it is divisible by 400.

How many Sundays fell on the first of the month during the twentieth century (1 Jan 1901 to 31 Dec 2000)?

"""

ONE_DAY_IN_MS = 60 * 60 * 24 * 1000

dayNames = "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(/\s+/)

dayAndDate = (timestamp) ->
  d = new Date(timestamp)
  return [d.getDay(), d.getDate()]

dateToTimestamp = (year, month, day) ->
  return new Date(year, month, day).getTime()

problem.test = ->
  ts = dateToTimestamp(1900, 0, 1)
  equal(dayAndDate(ts)[0], 1, "1900/1/1 was a Monday")

  for day in [2..6]
    ts += ONE_DAY_IN_MS
    dd = dayAndDate(ts)
    equal(dd[0], day, "the following day was a #{dayNames[day]}")
    equal(dd[1], day, "... and the date was 1/#{dd[1]}")

problem.answer = ->
  ts = dateToTimestamp(1901, 0, 1)
  endts = dateToTimestamp(2000, 11, 31)

  sundayCount = 0
  while ts < endts
    dd = dayAndDate(ts)
    if (dd[0] == 0) and (dd[1] == 1)
      sundayCount++
    ts += ONE_DAY_IN_MS

  return sundayCount
