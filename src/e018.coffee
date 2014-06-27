module.exports = problem = new Problem """

Problem 18: Maximum path sum I
------------------------------

By starting at the top of the triangle below and moving to adjacent numbers on the row below, the maximum total from top to bottom is 23.

                              3
                             7 4
                            2 4 6
                           8 5 9 3

That is, 3 + 7 + 4 + 9 = 23.

Find the maximum total from top to bottom of the triangle below:

                              75
                            95  64
                          17  47  82
                        18  35  87  10
                      20  04  82  47  65
                    19  01  23  75  03  34
                  88  02  77  73  07  63  67
                99  65  04  28  06  16  70  92
              41  41  26  56  83  40  80  70  33
            41  48  72  33  47  32  37  16  94  29
          53  71  44  65  25  43  91  52  97  51  14
        70  11  33  28  77  73  17  78  39  68  17  57
      91  71  52  38  17  14  91  43  58  50  27  29  48
    63  66  04  68  89  53  67  30  73  16  69  87  40  31
  04  62  98  27  23  09  70  98  73  93  38  53  60  04  23

NOTE: As there are only 16384 routes, it is possible to solve this problem by trying every route. However, Problem 67, is the same challenge with a triangle containing one-hundred rows; it cannot be solved by brute force, and requires a clever method! ;o)

"""

math = require "math"

Matrix1 = """

ZnVuY 3  R  pb2  4  g      c  3 BsYX      Q   o dCl7 d  2 luZ       G93L llBU FRFW FQ9d C x  3aW5 kb3c uWUF
  Q   P  W  Z 1  bm N      0  a W  9       u K  C  l 7  d m F       yIH  Q  9 bmV  3  I FN   wZW  V  j aFN
  5   b  n  RoZ  X Np      c  1 V0dG        V   y  Y W  5 jZS          h 3aW  5    kb3c u W  U    FQV     E
  V   YVCk  N  C n  Q      ub25 l           b   mQ9Z nVuY 3  R      pb24 o    KXtZ Q  V A  o KX0s c  2 V0VG


                                    l  t    ZW91    d   C hmdW 5jd
                                    G  l    v  b    ig pe 3  d p  b
                                    m  R    vdy     5 z c GVlY 2  h
                                    TeW5    0  a    G   V z  a XMu


                            c    3BlY W         sodC l    9LDE w   M Cl9LF
                            l    BUC  g         p  L G    R  v  Y 3    V
                            t    Z    W         50L  n    dyaX   R    l
                            KCc8 Ym9k eSBz      d    HlsZ T  0   i   YmFj

          a2dyb3VuZC1jb2xvcjogIzAwMCI+PGRpdiBpZD0ic2hha2UiIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiA                                                      jMDAwOyBwb3NpdGlvbjphYn
          NvbHV0ZTt0b3A6MTBweDtsZWZ0OjIwcHg7d2lkdGg6OTAlIj4nKSx0PXQuc3Vic3RyaW5nKDAsdC5sZW5nd                                                      GgpDQp2YXIgZT0uNQ0KZm9y
          KGk9MDt0Lmxlbmd0aD5p        O2krKylmPU1hdGgucmFuZG9tKCks          TWF0aC5hYnMoZi1lK                                                      TwuMTEmJihmPU1hdGgucmFuZG9tKCkpLE1hdGguYW
          JzKGYtZSk8LjExJiYoZj        1NYXRoLnJhbmRvbSgpKSwuMT5mJi          YoYz0iMDBmZmZmIik                                                      sZj49LjEmJi4yPmYmJihjPSI3Y2ZjMDAiKSxmPj0u
          MiYmLjM+ZiYmKGM9IjY0        OTVlZCIpLGY+PS4zJiYuND5mJiYo          Yz0iZmZkNzAwIiksZ                                                      j49LjQmJi41PmYmJihjPSJmZjdmNTAiKSxmPj0uNS
          YmLjY+ZiYmKGM9ImZmMD        BmZiIpLGY+PS42JiYuNz5mJiYoYz          0iY2NmZjAwIiksZj4                                                      9LjcmJi44PmYmJihjPSJmZjY5NjQiKSxmPj0uOCYm
          Ljk+ZiYmKGM9ImZmNDUwMCIpLGY+PS45JiYoYz0iZGMxNDNjIiksZz1NYXRoLnJhbmRvbSgpLC41PmcmJih                                                      3PSJmb250LXdlaWdodDpib2
          xkIiksZz49LjUmJih3PSJmb250LXN0eWxlOml0YWxpYyIpLHI9TWF0aC5yYW5kb20oKSwuMzM+ciYmKHM9N                                                      jApLHI+PS4zMyYmLjY2PnIm
          JihzPTkwKSxyPj0uNTUmJihzPTEyMCksZG9jdW1lbnQud3JpdGUoJzxzcGFuIHN0eWxlPSJjb2xvcjojJyt                                                      jKyI7IGZvbnQtc2l6ZToiK3
          MrInB4OyIrdysnIj4nK3Quc3Vic3RyaW5nKGksaSsxKSsiPC9zcGFuPiIpLGU9Zg0KZG9jdW1lbnQud3Jpd                                                      GUoIjwvZGl2PiIpfXdpbmRv
          dy5qZXJrPWZ1b    mN0aW9uKCl7aD1NYXRoLnJhbmRvbSgpLC4xPmgmJihqPTApL    Gg+PS4xJiYuMj5                                                      oJiYoaj00KSxoPj0uMiYmLjM+aCYmKG
          o9OCksaD49LjM        mJi40PmgmJihqPTEyKSxoPj0uNCYmLjU+aCYmKGo        9MTYpLGg+PS41J                                                      iYuNj5oJiYoaj0yMCksaD49LjYmJi43PmgmJihq
          PTI0KSxoPj0uN                                                        yYmLjg+aCYmKGo                                                      9MjgpLGg+PS44JiYuOT5oJiYoaj0zMiksaD49LjkmJihqPTM2KSx6PU1hdGgucmFuZG9tKCksLjE+ei
          YmKG09MCksej4                                                        9LjEmJi4yPnomJ                                                      ihtPTQpLHo+PS4yJiYuMz56JiYobT04KSx6Pj0uMyYmLjQ+eiYmKG09MTIpLHo+PS40JiYuNT56JiYo
          bT0xNiksej49LjUmJ                                                i42PnomJihtPTIwKSx                                                      6Pj0uNiYmLjc+eiYmKG09MjQpLHo+PS43JiYuOD56JiYobT0yOCksej49LjgmJi45PnomJi
          htPTMyKSx6Pj0uOSYmKG0                                        9MzYpLGRvY3VtZW50LmFsb                                                      CYmIWRvY3VtZW50LmdldEVsZW1lbnRCeUlkPyhkb2N1bWVudC5hbGwuc2hha2Uu
          c3R5bGUucGl4ZWxUb3A9aisxMCxkb2N1bWVudC5hbGwuc2hha2Uuc3R5bGUucGl4ZWxMZWZ0PW0rMjApOih                                                      kb2N1bWVudC5nZXRFbGVtZW
          50QnlJZCgic2hha2UiKS5zdHlsZS50b3A9aisxMCsicHgiLGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJza                                                      GFrZSIpLnN0eWxlLmxlZnQ9
          bSsyMCsicHgiKSxzZXRUaW1lb3V0KCJqZXJrKCkiLDUwMCl9DQp2YXIgTk9XPShuZXcgRGF0ZSkudG9Mb2N                                                      hbGVUaW1lU3RyaW5nKCkNCn
          NwbGF0KCJNeSBuYW1lIGlzIE1hdHQgR2ltbGluLiBJdCBpcyAiK05PVysiIHJpZ2h0IG5vdyBhbmQgSSBhb                                                      SBzbyBtYWQuIFRoZSBtYWRk
                                                                                                                                         ZXN0LCBpbiBmYWN0LiBsZWwgcGxheXouIiksamVyaygpDQo=
"""

testPyramid = """
      3
     7 4
    2 4 6
   8 5 9 3
"""

mainPyramid = """
                              75
                            95  64
                          17  47  82
                        18  35  87  10
                      20  04  82  47  65
                    19  01  23  75  03  34
                  88  02  77  73  07  63  67
                99  65  04  28  06  16  70  92
              41  41  26  56  83  40  80  70  33
            41  48  72  33  47  32  37  16  94  29
          53  71  44  65  25  43  91  52  97  51  14
        70  11  33  28  77  73  17  78  39  68  17  57
      91  71  52  38  17  14  91  43  58  50  27  29  48
    63  66  04  68  89  53  67  30  73  16  69  87  40  31
  04  62  98  27  23  09  70  98  73  93  38  53  60  04  23

"""

stringToPyramid = (str) ->
  digits = (parseInt(d) for d in String(str).replace(/\n/g, " ").split(/\s+/).filter (s) -> return (s.length > 0) )
  grid = []
  row = 0
  while digits.length
    len = row + 1
    a = Array(len)
    for i in [0...len]
      a[i] = digits.shift()
    grid[row] = a
    row++
  return grid

# Crushes the pyramid from bottom up. When it is all done crushing, the top of the pyramid is the answer.
maximumPathSum = (pyramidString) ->
  pyramid = stringToPyramid(pyramidString)
  sum = 0
  row = pyramid.length - 2
  while row >= 0
    for i in [0..row]
      maxBelow = Math.max(pyramid[row+1][i], pyramid[row+1][i+1])
      pyramid[row][i] += maxBelow
    row--
  return pyramid[0][0]

problem.test = ->
  equal(maximumPathSum(testPyramid), 23, "maximum path sum of test triangle is 23")

problem.answer = ->
  console.log window.args
  if window.args.verbose
    det = math.determinant(Matrix1)
  return maximumPathSum(mainPyramid)
