require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var bigInt = (function () {
    var base = 10000000, logBase = 7;
    var sign = {
        positive: false,
        negative: true
    };

    var normalize = function (first, second) {
        var a = first.value, b = second.value;
        var length = a.length > b.length ? a.length : b.length;
        for (var i = 0; i < length; i++) {
            a[i] = a[i] || 0;
            b[i] = b[i] || 0;
        }
        for (var i = length - 1; i >= 0; i--) {
            if (a[i] === 0 && b[i] === 0) {
                a.pop();
                b.pop();
            } else break;
        }
        if (!a.length) a = [0], b = [0];
        first.value = a;
        second.value = b;
    };

    var parse = function (text, first) {
        if (typeof text === "object") return text;
        text += "";
        var s = sign.positive, value = [];
        if (text[0] === "-") {
            s = sign.negative;
            text = text.slice(1);
        }
        var text = text.split("e");
        if (text.length > 2) throw new Error("Invalid integer");
        if (text[1]) {
            var exp = text[1];
            if (exp[0] === "+") exp = exp.slice(1);
            exp = parse(exp);
            if (exp.lesser(0)) throw new Error("Cannot include negative exponent part for integers");
            while (exp.notEquals(0)) {
                text[0] += "0";
                exp = exp.prev();
            }
        }
        text = text[0];
        if (text === "-0") text = "0";
        var isValid = /^([0-9][0-9]*)$/.test(text);
        if (!isValid) throw new Error("Invalid integer");
        while (text.length) {
            var divider = text.length > logBase ? text.length - logBase : 0;
            value.push(+text.slice(divider));
            text = text.slice(0, divider);
        }
        var val = bigInt(value, s);
        if (first) normalize(first, val);
        return val;
    };

    var goesInto = function (a, b) {
        var a = bigInt(a, sign.positive), b = bigInt(b, sign.positive);
        if (a.equals(0)) throw new Error("Cannot divide by 0");
        var n = 0;
        do {
            var inc = 1;
            var c = bigInt(a.value, sign.positive), t = c.times(10);
            while (t.lesser(b)) {
                c = t;
                inc *= 10;
                t = t.times(10);
            }
            while (c.lesserOrEquals(b)) {
                b = b.minus(c);
                n += inc;
            }
        } while (a.lesserOrEquals(b));

        return {
            remainder: b.value,
            result: n
        };
    };

    var bigInt = function (value, s) {
        var self = {
            value: value,
            sign: s
        };
        var o = {
            value: value,
            sign: s,
            negate: function (m) {
                var first = m || self;
                return bigInt(first.value, !first.sign);
            },
            abs: function (m) {
                var first = m || self;
                return bigInt(first.value, sign.positive);
            },
            add: function (n, m) {
                var s, first = self, second;
                if (m) (first = parse(n)) && (second = parse(m));
                else second = parse(n, first);
                s = first.sign;
                if (first.sign !== second.sign) {
                    first = bigInt(first.value, sign.positive);
                    second = bigInt(second.value, sign.positive);
                    return s === sign.positive ?
						o.subtract(first, second) :
						o.subtract(second, first);
                }
                normalize(first, second);
                var a = first.value, b = second.value;
                var result = [],
					carry = 0;
                for (var i = 0; i < a.length || carry > 0; i++) {
                    var sum = (a[i] || 0) + (b[i] || 0) + carry;
                    carry = sum >= base ? 1 : 0;
                    sum -= carry * base;
                    result.push(sum);
                }
                return bigInt(result, s);
            },
            plus: function (n, m) {
                return o.add(n, m);
            },
            subtract: function (n, m) {
                var first = self, second;
                if (m) (first = parse(n)) && (second = parse(m));
                else second = parse(n, first);
                if (first.sign !== second.sign) return o.add(first, o.negate(second));
                if (first.sign === sign.negative) return o.subtract(o.negate(second), o.negate(first));
                if (o.compare(first, second) === -1) return o.negate(o.subtract(second, first));
                var a = first.value, b = second.value;
                var result = [],
					borrow = 0;
                for (var i = 0; i < a.length; i++) {
                    var tmp = a[i] - borrow;
                    borrow = tmp < b[i] ? 1 : 0;
                    var minuend = (borrow * base) + tmp - b[i];
                    result.push(minuend);
                }
                return bigInt(result, sign.positive);
            },
            minus: function (n, m) {
                return o.subtract(n, m);
            },
            multiply: function (n, m) {
                var s, first = self, second;
                if (m) (first = parse(n)) && (second = parse(m));
                else second = parse(n, first);
                s = first.sign !== second.sign;
                var a = first.value, b = second.value;
                var resultSum = [];
                for (var i = 0; i < a.length; i++) {
                    resultSum[i] = [];
                    var j = i;
                    while (j--) {
                        resultSum[i].push(0);
                    }
                }
                var carry = 0;
                for (var i = 0; i < a.length; i++) {
                    var x = a[i];
                    for (var j = 0; j < b.length || carry > 0; j++) {
                        var y = b[j];
                        var product = y ? (x * y) + carry : carry;
                        carry = product > base ? Math.floor(product / base) : 0;
                        product -= carry * base;
                        resultSum[i].push(product);
                    }
                }
                var max = -1;
                for (var i = 0; i < resultSum.length; i++) {
                    var len = resultSum[i].length;
                    if (len > max) max = len;
                }
                var result = [], carry = 0;
                for (var i = 0; i < max || carry > 0; i++) {
                    var sum = carry;
                    for (var j = 0; j < resultSum.length; j++) {
                        sum += resultSum[j][i] || 0;
                    }
                    carry = sum > base ? Math.floor(sum / base) : 0;
                    sum -= carry * base;
                    result.push(sum);
                }
                return bigInt(result, s);
            },
            times: function (n, m) {
                return o.multiply(n, m);
            },
            divmod: function (n, m) {
                var s, first = self, second;
                if (m) (first = parse(n)) && (second = parse(m));
                else second = parse(n, first);
                s = first.sign !== second.sign;
                if (bigInt(first.value, first.sign).equals(0)) return {
                    quotient: bigInt([0], sign.positive),
                    remainder: bigInt([0], sign.positive)
                };
                if (second.equals(0)) throw new Error("Cannot divide by zero");
                var a = first.value, b = second.value;
                var result = [], remainder = [];
                for (var i = a.length - 1; i >= 0; i--) {
                    var n = [a[i]].concat(remainder);
                    var quotient = goesInto(b, n);
                    result.push(quotient.result);
                    remainder = quotient.remainder;
                }
                result.reverse();
                return {
                    quotient: bigInt(result, s),
                    remainder: bigInt(remainder, first.sign)
                };
            },
            divide: function (n, m) {
                return o.divmod(n, m).quotient;
            },
            over: function (n, m) {
                return o.divide(n, m);
            },
            mod: function (n, m) {
                return o.divmod(n, m).remainder;
            },
            remainder: function(n, m) {
                return o.mod(n, m);
            },
            pow: function (n, m) {
                var first = self, second;
                if (m) (first = parse(n)) && (second = parse(m));
                else second = parse(n, first);
                var a = first, b = second;
                if (bigInt(a.value, a.sign).equals(0)) return ZERO;
                if (b.lesser(0)) return ZERO;
                if (b.equals(0)) return ONE;
                var result = bigInt(a.value, a.sign);

                if (b.mod(2).equals(0)) {
                    var c = result.pow(b.over(2));
                    return c.times(c);
                } else {
                    return result.times(result.pow(b.minus(1)));
                }
            },
            next: function (m) {
                var first = m || self;
                return o.add(first, 1);
            },
            prev: function (m) {
                var first = m || self;
                return o.subtract(first, 1);
            },
            compare: function (n, m) {
                var first = self, second;
                if (m) (first = parse(n)) && (second = parse(m, first));
                else second = parse(n, first);
                normalize(first, second);
                if (first.value.length === 1 && second.value.length === 1 && first.value[0] === 0 && second.value[0] === 0) return 0;
                if (second.sign !== first.sign) return first.sign === sign.positive ? 1 : -1;
                var multiplier = first.sign === sign.positive ? 1 : -1;
                var a = first.value, b = second.value;
                for (var i = a.length - 1; i >= 0; i--) {
                    if (a[i] > b[i]) return 1 * multiplier;
                    if (b[i] > a[i]) return -1 * multiplier;
                }
                return 0;
            },
            compareTo: function(n, m) {
                return o.compare(n, m);
            },
            compareAbs: function (n, m) {
                var first = self, second;
                if (m) (first = parse(n)) && (second = parse(m, first));
                else second = parse(n, first);
                first.sign = second.sign = sign.positive;
                return o.compare(first, second);
            },
            equals: function (n, m) {
                return o.compare(n, m) === 0;
            },
            notEquals: function (n, m) {
                return !o.equals(n, m);
            },
            lesser: function (n, m) {
                return o.compare(n, m) < 0;
            },
            greater: function (n, m) {
                return o.compare(n, m) > 0;
            },
            greaterOrEquals: function (n, m) {
                return o.compare(n, m) >= 0;
            },
            lesserOrEquals: function (n, m) {
                return o.compare(n, m) <= 0;
            },
            isPositive: function (m) {
                var first = m || self;
                return first.sign === sign.positive;
            },
            isNegative: function (m) {
                var first = m || self;
                return first.sign === sign.negative;
            },
            isEven: function (m) {
                var first = m || self;
                return first.value[0] % 2 === 0;
            },
            isOdd: function (m) {
                var first = m || self;
                return first.value[0] % 2 === 1;
            },
            toString: function (m) {
                var first = m || self;
                var str = "", len = first.value.length;
                while (len--) {
                    if (first.value[len].toString().length === 8) str += first.value[len];
                    else str += (base.toString() + first.value[len]).slice(-logBase);
                }
                while (str[0] === "0") {
                    str = str.slice(1);
                }
                if (!str.length) str = "0";
                if (str === "0") return str;
                var s = first.sign === sign.positive ? "" : "-";
                return s + str;
            },
            toJSNumber: function (m) {
                return +o.toString(m);
            },
            valueOf: function (m) {
                return o.toJSNumber(m);
            }
        };
        return o;
    };

    var ZERO = bigInt([0], sign.positive);
    var ONE = bigInt([1], sign.positive);
    var MINUS_ONE = bigInt([1], sign.negative);

    var parseBase = function (text, base) {
        base = parse(base);
        var val = ZERO;
        var digits = [];
        var i;
        var isNegative = false;
        function parseToken(text) {
            var c = text[i].toLowerCase();
            if (i === 0 && text[i] === "-") {
                isNegative = true;
                return;
            }
            if (/[0-9]/.test(c)) digits.push(parse(c));
            else if (/[a-z]/.test(c)) digits.push(parse(c.charCodeAt(0) - 87));
            else if (c === "<") {
                var start = i;
                do i++; while (text[i] !== ">");
                digits.push(parse(text.slice(start + 1, i)));
            }
            else throw new Error(c + " is not a valid character");
        }
        for (i = 0; i < text.length; i++) {
            parseToken(text);
        }
        digits.reverse();
        for (i = 0; i < digits.length; i++) {
            val = val.add(digits[i].times(base.pow(i)));
        }
        return isNegative ? -val : val;
    }

    var fnReturn = function (a, b) {
        if (typeof a === "undefined") return ZERO;
        if (typeof b !== "undefined") return parseBase(a, b);
        return parse(a);
    };
    fnReturn.zero = ZERO;
    fnReturn.one = ONE;
    fnReturn.minusOne = MINUS_ONE;
    return fnReturn;
})();

if (typeof module !== "undefined") {
    module.exports = bigInt;
}
},{}],"6xS60W":[function(require,module,exports){
var problem;

module.exports = problem = new Problem("\nProblem 1: Multiples of 3 and 5\n-------------------------------\n\nIf we list all the natural numbers below 10 that are multiples of 3 or 5, we get 3, 5, 6 and 9.\nThe sum of these multiples is 23.\n\nFind the sum of all the multiples of 3 or 5 below 1000.\n");

problem.test = function() {
  var i, sum, _i;
  sum = 0;
  for (i = _i = 1; _i < 10; i = ++_i) {
    if ((i % 3 === 0) || (i % 5 === 0)) {
      sum += i;
    }
  }
  return equal(sum, 23, "Sum of natural numbers < 10: " + sum);
};

problem.answer = function() {
  var i, sum, _i;
  sum = 0;
  for (i = _i = 1; _i < 1000; i = ++_i) {
    if ((i % 3 === 0) || (i % 5 === 0)) {
      sum += i;
    }
  }
  return sum;
};


},{}],"e001":[function(require,module,exports){
module.exports=require('6xS60W');
},{}],"e002":[function(require,module,exports){
module.exports=require('45rRMW');
},{}],"45rRMW":[function(require,module,exports){
var problem;

module.exports = problem = new Problem("\nProblem 2: Even Fibonacci numbers\n---------------------------------\n\nEach new term in the Fibonacci sequence is generated by adding the previous two terms.\nBy starting with 1 and 2, the first 10 terms will be:\n\n1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ...\n\nBy considering the terms in the Fibonacci sequence whose values do not exceed four million,\nfind the sum of the even-valued terms.\n");

problem.answer = function() {
  var curr, next, prev, sum;
  prev = 1;
  curr = 1;
  sum = 0;
  while (curr < 4000000) {
    if ((curr % 2) === 0) {
      sum += curr;
    }
    next = curr + prev;
    prev = curr;
    curr = next;
  }
  return sum;
};


},{}],"e003":[function(require,module,exports){
module.exports=require('kxgPTQ');
},{}],"kxgPTQ":[function(require,module,exports){
var isPrime, largestPrimeFactor, leastFactor, primeFactors, problem;

module.exports = problem = new Problem("\nProblem 3: Largest prime factor\n-------------------------------\n\nThe prime factors of 13195 are 5, 7, 13 and 29.\n\nWhat is the largest prime factor of the number 600851475143 ?\n");

leastFactor = function(n) {
  var i, m, _i;
  if (isNaN(n) || !isFinite(n)) {
    return NaN;
  }
  if (n === 0) {
    return 0;
  }
  if ((n % 1) !== 0 || (n * n) < 2) {
    return 1;
  }
  if ((n % 2) === 0) {
    return 2;
  }
  if ((n % 3) === 0) {
    return 3;
  }
  if ((n % 5) === 0) {
    return 5;
  }
  m = Math.sqrt(n);
  for (i = _i = 7; _i <= m; i = _i += 30) {
    if ((n % i) === 0) {
      return i;
    }
    if ((n % (i + 4)) === 0) {
      return i + 4;
    }
    if ((n % (i + 6)) === 0) {
      return i + 6;
    }
    if ((n % (i + 10)) === 0) {
      return i + 10;
    }
    if ((n % (i + 12)) === 0) {
      return i + 12;
    }
    if ((n % (i + 16)) === 0) {
      return i + 16;
    }
    if ((n % (i + 22)) === 0) {
      return i + 22;
    }
    if ((n % (i + 24)) === 0) {
      return i + 24;
    }
  }
  return n;
};

isPrime = function(n) {
  if (isNaN(n) || !isFinite(n) || (n % 1) !== 0 || (n < 2)) {
    return false;
  }
  if (n === leastFactor(n)) {
    return true;
  }
  return false;
};

primeFactors = function(n) {
  var factor, factors;
  if (n === 1) {
    return [1];
  }
  factors = [];
  while (!isPrime(n)) {
    factor = leastFactor(n);
    factors.push(factor);
    n /= factor;
  }
  factors.push(n);
  return factors;
};

largestPrimeFactor = function(n) {
  var factor;
  if (n === 1) {
    return 1;
  }
  while (!isPrime(n)) {
    factor = leastFactor(n);
    n /= factor;
  }
  return n;
};

problem.answer = function() {
  return largestPrimeFactor(600851475143);
};


},{}],"e004":[function(require,module,exports){
module.exports=require('IqK6Ix');
},{}],"IqK6Ix":[function(require,module,exports){
var isPalindrome, problem;

module.exports = problem = new Problem("\nProblem 4: Largest palindrome product\n-------------------------------------\n\nA palindromic number reads the same both ways.\n\nFind the largest palindrome made from the product of two 3-digit numbers.\n");

isPalindrome = function(n) {
  var i, str, _i, _ref;
  str = n.toString();
  for (i = _i = 0, _ref = str.length / 2; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
    if (str[i] !== str[str.length - 1 - i]) {
      return false;
    }
  }
  return true;
};

problem.test = function() {
  var v, _i, _j, _len, _len1, _ref, _ref1, _results;
  _ref = [1, 11, 121, 1221, 12321, 1234321];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    v = _ref[_i];
    equal(isPalindrome(v), true, "isPalindrome(" + v + ") returns true");
  }
  _ref1 = [12, 123, 1234, 12345, 123456, 12324];
  _results = [];
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    v = _ref1[_j];
    _results.push(equal(isPalindrome(v), false, "isPalindrome(" + v + ") returns false"));
  }
  return _results;
};

problem.answer = function() {
  var i, j, largesti, largestj, largestp, product, _i, _j;
  largesti = 0;
  largestj = 0;
  largestp = 0;
  for (i = _i = 100; _i <= 999; i = ++_i) {
    for (j = _j = 100; _j <= 999; j = ++_j) {
      product = i * j;
      if (isPalindrome(product)) {
        largesti = i;
        largestj = j;
        largestp = product;
      }
    }
  }
  return largestp;
};


},{}],"xGIOJC":[function(require,module,exports){
var problem;

module.exports = problem = new Problem("\nProblem 5: Smallest multiple\n----------------------------\n\n2520 is the smallest number that can be divided by each of the numbers from 1 to 10 without any remainder.\n\nWhat is the smallest positive number that is evenly divisible by all of the numbers from 1 to 20?\n");

problem.answer = function() {
  var found, i, n, _i;
  n = 0;
  while (true) {
    n += 20;
    found = true;
    for (i = _i = 1; _i <= 20; i = ++_i) {
      if ((n % i) !== 0) {
        found = false;
        break;
      }
    }
    if (found) {
      break;
    }
  }
  return n;
};


},{}],"e005":[function(require,module,exports){
module.exports=require('xGIOJC');
},{}],"e006":[function(require,module,exports){
module.exports=require('SrRReL');
},{}],"SrRReL":[function(require,module,exports){
var differenceSumSquares, problem, squareOfSum, sumOfSquares;

module.exports = problem = new Problem("\nProblem 6: Sum square difference\n--------------------------------\n\nThe sum of the squares of the first ten natural numbers is,\n\n             1^2 + 2^2 + ... + 10^2 = 385\n\nThe square of the sum of the first ten natural numbers is,\n\n          (1 + 2 + ... + 10)^2 = 55^2 = 3025\n\nHence the difference between the sum of the squares of the first ten natural numbers and the square of the sum is 3025 − 385 = 2640.\n\nFind the difference between the sum of the squares of the first one hundred natural numbers and the square of the sum.\n");

sumOfSquares = function(n) {
  var i, sum, _i;
  sum = 0;
  for (i = _i = 1; 1 <= n ? _i <= n : _i >= n; i = 1 <= n ? ++_i : --_i) {
    sum += i * i;
  }
  return sum;
};

squareOfSum = function(n) {
  var i, sum, _i;
  sum = 0;
  for (i = _i = 1; 1 <= n ? _i <= n : _i >= n; i = 1 <= n ? ++_i : --_i) {
    sum += i;
  }
  return sum * sum;
};

differenceSumSquares = function(n) {
  return squareOfSum(n) - sumOfSquares(n);
};

problem.test = function() {
  equal(sumOfSquares(10), 385, "Sum of squares of first ten natural numbers is 385");
  equal(squareOfSum(10), 3025, "Square of sum of first ten natural numbers is 3025");
  return equal(differenceSumSquares(10), 2640, "Difference in values for the first ten natural numbers is 2640");
};

problem.answer = function() {
  return differenceSumSquares(100);
};


},{}],"e007":[function(require,module,exports){
module.exports=require('dV0xLp');
},{}],"dV0xLp":[function(require,module,exports){
var math, nthPrime, problem;

module.exports = problem = new Problem("\nProblem 7: 10001st prime\n------------------------\n\nBy listing the first six prime numbers: 2, 3, 5, 7, 11, and 13, we can see that the 6th prime is 13.\n\nWhat is the 10,001st prime number?\n");

math = require("math");

nthPrime = function(n) {
  var i, sieve, _i;
  sieve = new math.IncrementalSieve;
  for (i = _i = 1; 1 <= n ? _i < n : _i > n; i = 1 <= n ? ++_i : --_i) {
    sieve.next();
  }
  return sieve.next();
};

problem.test = function() {
  return equal(nthPrime(6), 13, "6th prime is 13");
};

problem.answer = function() {
  return nthPrime(10001);
};


},{"math":"Gm6Ven"}],"e008":[function(require,module,exports){
module.exports=require('TAaHWp');
},{}],"TAaHWp":[function(require,module,exports){
var digit, digits, largestProduct, problem, str;

module.exports = problem = new Problem("\nProblem 8: Largest product in a series\n--------------------------------------\n\nThe four adjacent digits in the 1000-digit number that have the greatest product are 9 x 9 x 8 x 9 = 5832.\n\n  73167176531330624919225119674426574742355349194934\n  96983520312774506326239578318016984801869478851843\n  85861560789112949495459501737958331952853208805511\n  12540698747158523863050715693290963295227443043557\n  66896648950445244523161731856403098711121722383113\n  62229893423380308135336276614282806444486645238749\n  30358907296290491560440772390713810515859307960866\n  70172427121883998797908792274921901699720888093776\n  65727333001053367881220235421809751254540594752243\n  52584907711670556013604839586446706324415722155397\n  53697817977846174064955149290862569321978468622482\n  83972241375657056057490261407972968652414535100474\n  82166370484403199890008895243450658541227588666881\n  16427171479924442928230863465674813919123162824586\n  17866458359124566529476545682848912883142607690042\n  24219022671055626321111109370544217506941658960408\n  07198403850962455444362981230987879927244284909188\n  84580156166097919133875499200524063689912560717606\n  05886116467109405077541002256983155200055935729725\n  71636269561882670428252483600823257530420752963450\n\nFind the thirteen adjacent digits in the 1000-digit number that have the greatest product. What is the value of this product?\n");

str = "73167176531330624919225119674426574742355349194934\n96983520312774506326239578318016984801869478851843\n85861560789112949495459501737958331952853208805511\n12540698747158523863050715693290963295227443043557\n66896648950445244523161731856403098711121722383113\n62229893423380308135336276614282806444486645238749\n30358907296290491560440772390713810515859307960866\n70172427121883998797908792274921901699720888093776\n65727333001053367881220235421809751254540594752243\n52584907711670556013604839586446706324415722155397\n53697817977846174064955149290862569321978468622482\n83972241375657056057490261407972968652414535100474\n82166370484403199890008895243450658541227588666881\n16427171479924442928230863465674813919123162824586\n17866458359124566529476545682848912883142607690042\n24219022671055626321111109370544217506941658960408\n07198403850962455444362981230987879927244284909188\n84580156166097919133875499200524063689912560717606\n05886116467109405077541002256983155200055935729725\n71636269561882670428252483600823257530420752963450";

str = str.replace(/[^0-9]/gm, "");

digits = (function() {
  var _i, _len, _results;
  _results = [];
  for (_i = 0, _len = str.length; _i < _len; _i++) {
    digit = str[_i];
    _results.push(parseInt(digit));
  }
  return _results;
})();

largestProduct = function(digitCount) {
  var end, i, largest, product, start, _i, _j, _ref;
  if (digitCount > digits.length) {
    return 0;
  }
  largest = 0;
  for (start = _i = 0, _ref = digits.length - digitCount; 0 <= _ref ? _i <= _ref : _i >= _ref; start = 0 <= _ref ? ++_i : --_i) {
    end = start + digitCount;
    product = 1;
    for (i = _j = start; start <= end ? _j < end : _j > end; i = start <= end ? ++_j : --_j) {
      product *= digits[i];
    }
    if (largest < product) {
      largest = product;
    }
  }
  return largest;
};

problem.test = function() {
  equal(largestProduct(4), 5832, "Greatest product of 4 adjacent digits is 5832");
  return equal(largestProduct(5), 40824, "Greatest product of 5 adjacent digits is 40824");
};

problem.answer = function() {
  return largestProduct(13);
};


},{}],"e009":[function(require,module,exports){
module.exports=require('9QexXm');
},{}],"9QexXm":[function(require,module,exports){
var findFirstTriplet, isTriplet, problem;

module.exports = problem = new Problem("\nProblem 9: Special Pythagorean triplet\n--------------------------------------\n\nA Pythagorean triplet is a set of three natural numbers, a < b < c, for which,\n\n    a^2 + b^2 = c^2\n\nFor example, 3^2 + 4^2 = 9 + 16 = 25 = 5^2.\n\nThere exists exactly one Pythagorean triplet for which a + b + c = 1000.\n\nFind the product abc.\n");

isTriplet = function(a, b, c) {
  return ((a * a) + (b * b)) === (c * c);
};

findFirstTriplet = function(sum) {
  var a, b, c, _i, _j;
  for (a = _i = 1; _i < 1000; a = ++_i) {
    for (b = _j = 1; _j < 1000; b = ++_j) {
      c = 1000 - a - b;
      if (isTriplet(a, b, c)) {
        return [a, b, c];
      }
    }
  }
  return false;
};

problem.test = function() {
  return equal(isTriplet(3, 4, 5), true, "(3,4,5) is a Pythagorean triplet");
};

problem.answer = function() {
  return findFirstTriplet(1000);
};


},{}],"0GIZG3":[function(require,module,exports){
var math, primeSum, problem;

module.exports = problem = new Problem("\nProblem 10: Summation of primes\n-------------------------------\n\nThe sum of the primes below 10 is 2 + 3 + 5 + 7 = 17.\n\nFind the sum of all the primes below two million.\n");

math = require("math");

primeSum = function(ceiling) {
  var n, sieve, sum;
  sieve = new math.IncrementalSieve;
  sum = 0;
  while (true) {
    n = sieve.next();
    if (n >= ceiling) {
      break;
    }
    sum += n;
  }
  return sum;
};

problem.test = function() {
  return equal(primeSum(10), 17, "Sum of primes below 10 is 17");
};

problem.answer = function() {
  return primeSum(2000000);
};


},{"math":"Gm6Ven"}],"e010":[function(require,module,exports){
module.exports=require('0GIZG3');
},{}],"e011":[function(require,module,exports){
module.exports=require('WITvtv');
},{}],"WITvtv":[function(require,module,exports){
var getLine, getLineProduct, grid, prepareGrid, problem;

module.exports = problem = new Problem("\nProblem 11: Largest product in a grid\n-------------------------------------\n\nIn the 20x20 grid below, four numbers along a diagonal line have been marked in red.\n\n          08 02 22 97 38 15 00 40 00 75 04 05 07 78 52 12 50 77 91 08\n          49 49 99 40 17 81 18 57 60 87 17 40 98 43 69 48 04 56 62 00\n          81 49 31 73 55 79 14 29 93 71 40 67 53 88 30 03 49 13 36 65\n          52 70 95 23 04 60 11 42 69 24 68 56 01 32 56 71 37 02 36 91\n          22 31 16 71 51 67 63 89 41 92 36 54 22 40 40 28 66 33 13 80\n          24 47 32 60 99 03 45 02 44 75 33 53 78 36 84 20 35 17 12 50\n          32 98 81 28 64 23 67 10 26_38 40 67 59 54 70 66 18 38 64 70\n          67 26 20 68 02 62 12 20 95 63_94 39 63 08 40 91 66 49 94 21\n          24 55 58 05 66 73 99 26 97 17 78_78 96 83 14 88 34 89 63 72\n          21 36 23 09 75 00 76 44 20 45 35 14 00 61 33 97 34 31 33 95\n          78 17 53 28 22 75 31 67 15 94 03 80 04 62 16 14 09 53 56 92\n          16 39 05 42 96 35 31 47 55 58 88 24 00 17 54 24 36 29 85 57\n          86 56 00 48 35 71 89 07 05 44 44 37 44 60 21 58 51 54 17 58\n          19 80 81 68 05 94 47 69 28 73 92 13 86 52 17 77 04 89 55 40\n          04 52 08 83 97 35 99 16 07 97 57 32 16 26 26 79 33 27 98 66\n          88 36 68 87 57 62 20 72 03 46 33 67 46 55 12 32 63 93 53 69\n          04 42 16 73 38 25 39 11 24 94 72 18 08 46 29 32 40 62 76 36\n          20 69 36 41 72 30 23 88 34 62 99 69 82 67 59 85 74 04 36 16\n          20 73 35 29 78 31 90 01 74 31 49 71 48 86 81 16 23 57 05 54\n          01 70 54 71 83 51 54 69 16 92 33 48 61 43 52 01 89 19 67 48\n\nThe product of these numbers is 26 x 63 x 78 x 14 = 1788696.\n\nWhat is the greatest product of four adjacent numbers in the same direction (up, down, left, right, or diagonally) in the 20x20 grid?\n");

grid = null;

prepareGrid = function() {
  var digit, digits, i, index, j, rawDigits, _i, _j, _results;
  rawDigits = "08 02 22 97 38 15 00 40 00 75 04 05 07 78 52 12 50 77 91 08\n49 49 99 40 17 81 18 57 60 87 17 40 98 43 69 48 04 56 62 00\n81 49 31 73 55 79 14 29 93 71 40 67 53 88 30 03 49 13 36 65\n52 70 95 23 04 60 11 42 69 24 68 56 01 32 56 71 37 02 36 91\n22 31 16 71 51 67 63 89 41 92 36 54 22 40 40 28 66 33 13 80\n24 47 32 60 99 03 45 02 44 75 33 53 78 36 84 20 35 17 12 50\n32 98 81 28 64 23 67 10 26 38 40 67 59 54 70 66 18 38 64 70\n67 26 20 68 02 62 12 20 95 63 94 39 63 08 40 91 66 49 94 21\n24 55 58 05 66 73 99 26 97 17 78 78 96 83 14 88 34 89 63 72\n21 36 23 09 75 00 76 44 20 45 35 14 00 61 33 97 34 31 33 95\n78 17 53 28 22 75 31 67 15 94 03 80 04 62 16 14 09 53 56 92\n16 39 05 42 96 35 31 47 55 58 88 24 00 17 54 24 36 29 85 57\n86 56 00 48 35 71 89 07 05 44 44 37 44 60 21 58 51 54 17 58\n19 80 81 68 05 94 47 69 28 73 92 13 86 52 17 77 04 89 55 40\n04 52 08 83 97 35 99 16 07 97 57 32 16 26 26 79 33 27 98 66\n88 36 68 87 57 62 20 72 03 46 33 67 46 55 12 32 63 93 53 69\n04 42 16 73 38 25 39 11 24 94 72 18 08 46 29 32 40 62 76 36\n20 69 36 41 72 30 23 88 34 62 99 69 82 67 59 85 74 04 36 16\n20 73 35 29 78 31 90 01 74 31 49 71 48 86 81 16 23 57 05 54\n01 70 54 71 83 51 54 69 16 92 33 48 61 43 52 01 89 19 67 48".replace(/[^0-9 ]/gm, " ");
  digits = (function() {
    var _i, _len, _ref, _results;
    _ref = rawDigits.split(" ");
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      digit = _ref[_i];
      _results.push(parseInt(digit));
    }
    return _results;
  })();
  grid = Array(20);
  for (i = _i = 0; _i < 20; i = ++_i) {
    grid[i] = Array(20);
  }
  index = 0;
  _results = [];
  for (j = _j = 0; _j < 20; j = ++_j) {
    _results.push((function() {
      var _k, _results1;
      _results1 = [];
      for (i = _k = 0; _k < 20; i = ++_k) {
        grid[i][j] = digits[index];
        _results1.push(index++);
      }
      return _results1;
    })());
  }
  return _results;
};

prepareGrid();

getLineProduct = function(sx, sy, dx, dy) {
  var ex, ey, i, product, x, y, _i;
  ex = sx + (4 * dx);
  if ((ex < 0) || (ex >= 20)) {
    return -1;
  }
  ey = sy + (4 * dy);
  if ((ey < 0) || (ey >= 20)) {
    return -1;
  }
  x = sx;
  y = sy;
  product = 1;
  for (i = _i = 0; _i < 4; i = ++_i) {
    product *= grid[x][y];
    x += dx;
    y += dy;
  }
  return product;
};

getLine = function(sx, sy, dx, dy) {
  var ex, ey, i, line, x, y, _i;
  ex = sx + (4 * dx);
  if ((ex < 0) || (ex >= 20)) {
    return [];
  }
  ey = sy + (4 * dy);
  if ((ey < 0) || (ey >= 20)) {
    return [];
  }
  line = [];
  x = sx;
  y = sy;
  for (i = _i = 0; _i < 4; i = ++_i) {
    line.push(grid[x][y]);
    x += dx;
    y += dy;
  }
  return line;
};

problem.test = function() {
  return equal(getLineProduct(8, 6, 1, 1), 1788696, "Diagonal value shown in example equals 1,788,696");
};

problem.answer = function() {
  var i, j, max, p, _i, _j;
  max = {
    product: 1,
    i: 0,
    j: 0,
    dir: "right"
  };
  for (j = _i = 0; _i < 20; j = ++_i) {
    for (i = _j = 0; _j < 20; i = ++_j) {
      p = getLineProduct(i, j, 1, 0);
      if (max.product < p) {
        max.product = p;
        max.i = i;
        max.j = j;
        max.dir = "right";
      }
      p = getLineProduct(i, j, 0, 1);
      if (max.product < p) {
        max.product = p;
        max.i = i;
        max.j = j;
        max.dir = "down";
      }
      p = getLineProduct(i, j, 1, 1);
      if (max.product < p) {
        max.product = p;
        max.i = i;
        max.j = j;
        max.dir = "diagonalR";
      }
      p = getLineProduct(i, j, -1, 1);
      if (max.product < p) {
        max.product = p;
        max.i = i;
        max.j = j;
        max.dir = "diagonalL";
      }
    }
  }
  return max;
};


},{}],"OaGJp8":[function(require,module,exports){
var divisorCount, math, problem;

module.exports = problem = new Problem("\nProblem 12: Highly divisible triangular number\n----------------------------------------------\n\nThe sequence of triangle numbers is generated by adding the natural numbers. So the 7th triangle number would be\n\n                      1 + 2 + 3 + 4 + 5 + 6 + 7 = 28.\n\nThe first ten terms would be:\n\n                      1, 3, 6, 10, 15, 21, 28, 36, 45, 55, ...\n\nLet us list the factors of the first seven triangle numbers:\n\n 1: 1\n 3: 1,3\n 6: 1,2,3,6\n10: 1,2,5,10\n15: 1,3,5,15\n21: 1,3,7,21\n28: 1,2,4,7,14,28\n\nWe can see that 28 is the first triangle number to have over five divisors.\n\nWhat is the value of the first triangle number to have over five hundred divisors?\n");

math = require("math");

divisorCount = function(n) {
  var count, exponent, factor, factors, lastFactor, _i, _len;
  if (n === 1) {
    return 1;
  }
  factors = math.primeFactors(n);
  count = 1;
  lastFactor = 0;
  exponent = 1;
  for (_i = 0, _len = factors.length; _i < _len; _i++) {
    factor = factors[_i];
    if (factor === lastFactor) {
      exponent++;
    } else {
      if (lastFactor !== 0) {
        count *= exponent + 1;
      }
      lastFactor = factor;
      exponent = 1;
    }
  }
  if (lastFactor !== 0) {
    count *= exponent + 1;
  }
  return count;
};

problem.test = function() {
  equal(divisorCount(1), 1, " 1 has 1 divisors");
  equal(divisorCount(3), 2, " 3 has 2 divisors");
  equal(divisorCount(6), 4, " 6 has 4 divisors");
  equal(divisorCount(10), 4, "10 has 4 divisors");
  equal(divisorCount(15), 4, "15 has 4 divisors");
  equal(divisorCount(21), 4, "21 has 4 divisors");
  return equal(divisorCount(28), 6, "28 has 6 divisors");
};

problem.answer = function() {
  var count, n, step;
  n = 1;
  step = 2;
  while (true) {
    count = divisorCount(n);
    if (count > 500) {
      return {
        n: n,
        count: count
      };
    }
    n += step;
    step++;
  }
};


},{"math":"Gm6Ven"}],"e012":[function(require,module,exports){
module.exports=require('OaGJp8');
},{}],"kXr2Ih":[function(require,module,exports){
var numbers, problem;

module.exports = problem = new Problem("\nProblem 13: Large sum\n---------------------\n\nWork out the first ten digits of the sum of the following one-hundred 50-digit numbers.\n\n37107287533902102798797998220837590246510135740250\n46376937677490009712648124896970078050417018260538\n74324986199524741059474233309513058123726617309629\n91942213363574161572522430563301811072406154908250\n23067588207539346171171980310421047513778063246676\n89261670696623633820136378418383684178734361726757\n28112879812849979408065481931592621691275889832738\n44274228917432520321923589422876796487670272189318\n47451445736001306439091167216856844588711603153276\n70386486105843025439939619828917593665686757934951\n62176457141856560629502157223196586755079324193331\n64906352462741904929101432445813822663347944758178\n92575867718337217661963751590579239728245598838407\n58203565325359399008402633568948830189458628227828\n80181199384826282014278194139940567587151170094390\n35398664372827112653829987240784473053190104293586\n86515506006295864861532075273371959191420517255829\n71693888707715466499115593487603532921714970056938\n54370070576826684624621495650076471787294438377604\n53282654108756828443191190634694037855217779295145\n36123272525000296071075082563815656710885258350721\n45876576172410976447339110607218265236877223636045\n17423706905851860660448207621209813287860733969412\n81142660418086830619328460811191061556940512689692\n51934325451728388641918047049293215058642563049483\n62467221648435076201727918039944693004732956340691\n15732444386908125794514089057706229429197107928209\n55037687525678773091862540744969844508330393682126\n18336384825330154686196124348767681297534375946515\n80386287592878490201521685554828717201219257766954\n78182833757993103614740356856449095527097864797581\n16726320100436897842553539920931837441497806860984\n48403098129077791799088218795327364475675590848030\n87086987551392711854517078544161852424320693150332\n59959406895756536782107074926966537676326235447210\n69793950679652694742597709739166693763042633987085\n41052684708299085211399427365734116182760315001271\n65378607361501080857009149939512557028198746004375\n35829035317434717326932123578154982629742552737307\n94953759765105305946966067683156574377167401875275\n88902802571733229619176668713819931811048770190271\n25267680276078003013678680992525463401061632866526\n36270218540497705585629946580636237993140746255962\n24074486908231174977792365466257246923322810917141\n91430288197103288597806669760892938638285025333403\n34413065578016127815921815005561868836468420090470\n23053081172816430487623791969842487255036638784583\n11487696932154902810424020138335124462181441773470\n63783299490636259666498587618221225225512486764533\n67720186971698544312419572409913959008952310058822\n95548255300263520781532296796249481641953868218774\n76085327132285723110424803456124867697064507995236\n37774242535411291684276865538926205024910326572967\n23701913275725675285653248258265463092207058596522\n29798860272258331913126375147341994889534765745501\n18495701454879288984856827726077713721403798879715\n38298203783031473527721580348144513491373226651381\n34829543829199918180278916522431027392251122869539\n40957953066405232632538044100059654939159879593635\n29746152185502371307642255121183693803580388584903\n41698116222072977186158236678424689157993532961922\n62467957194401269043877107275048102390895523597457\n23189706772547915061505504953922979530901129967519\n86188088225875314529584099251203829009407770775672\n11306739708304724483816533873502340845647058077308\n82959174767140363198008187129011875491310547126581\n97623331044818386269515456334926366572897563400500\n42846280183517070527831839425882145521227251250327\n55121603546981200581762165212827652751691296897789\n32238195734329339946437501907836945765883352399886\n75506164965184775180738168837861091527357929701337\n62177842752192623401942399639168044983993173312731\n32924185707147349566916674687634660915035914677504\n99518671430235219628894890102423325116913619626622\n73267460800591547471830798392868535206946944540724\n76841822524674417161514036427982273348055556214818\n97142617910342598647204516893989422179826088076852\n87783646182799346313767754307809363333018982642090\n10848802521674670883215120185883543223812876952786\n71329612474782464538636993009049310363619763878039\n62184073572399794223406235393808339651327408011116\n66627891981488087797941876876144230030984490851411\n60661826293682836764744779239180335110989069790714\n85786944089552990653640447425576083659976645795096\n66024396409905389607120198219976047599490197230297\n64913982680032973156037120041377903785566085089252\n16730939319872750275468906903707539413042652315011\n94809377245048795150954100921645863754710598436791\n78639167021187492431995700641917969777599028300699\n15368713711936614952811305876380278410754449733078\n40789923115535562561142322423255033685442488917353\n44889911501440648020369068063960672322193204149535\n41503128880339536053299340368006977710650566631954\n81234880673210146739058568557934581403627822703280\n82616570773948327592232845941706525094512325230608\n22918802058777319719839450180888072429661980811197\n77158542502016545090413245809786882778948721859617\n72107838435069186155435662884062257473692284509516\n20849603980134001723930671666823555245252804609722\n53503534226472524250874054075591789781264330331690\n");

numbers = [37107287533902102798797998220837590246510135740250, 46376937677490009712648124896970078050417018260538, 74324986199524741059474233309513058123726617309629, 91942213363574161572522430563301811072406154908250, 23067588207539346171171980310421047513778063246676, 89261670696623633820136378418383684178734361726757, 28112879812849979408065481931592621691275889832738, 44274228917432520321923589422876796487670272189318, 47451445736001306439091167216856844588711603153276, 70386486105843025439939619828917593665686757934951, 62176457141856560629502157223196586755079324193331, 64906352462741904929101432445813822663347944758178, 92575867718337217661963751590579239728245598838407, 58203565325359399008402633568948830189458628227828, 80181199384826282014278194139940567587151170094390, 35398664372827112653829987240784473053190104293586, 86515506006295864861532075273371959191420517255829, 71693888707715466499115593487603532921714970056938, 54370070576826684624621495650076471787294438377604, 53282654108756828443191190634694037855217779295145, 36123272525000296071075082563815656710885258350721, 45876576172410976447339110607218265236877223636045, 17423706905851860660448207621209813287860733969412, 81142660418086830619328460811191061556940512689692, 51934325451728388641918047049293215058642563049483, 62467221648435076201727918039944693004732956340691, 15732444386908125794514089057706229429197107928209, 55037687525678773091862540744969844508330393682126, 18336384825330154686196124348767681297534375946515, 80386287592878490201521685554828717201219257766954, 78182833757993103614740356856449095527097864797581, 16726320100436897842553539920931837441497806860984, 48403098129077791799088218795327364475675590848030, 87086987551392711854517078544161852424320693150332, 59959406895756536782107074926966537676326235447210, 69793950679652694742597709739166693763042633987085, 41052684708299085211399427365734116182760315001271, 65378607361501080857009149939512557028198746004375, 35829035317434717326932123578154982629742552737307, 94953759765105305946966067683156574377167401875275, 88902802571733229619176668713819931811048770190271, 25267680276078003013678680992525463401061632866526, 36270218540497705585629946580636237993140746255962, 24074486908231174977792365466257246923322810917141, 91430288197103288597806669760892938638285025333403, 34413065578016127815921815005561868836468420090470, 23053081172816430487623791969842487255036638784583, 11487696932154902810424020138335124462181441773470, 63783299490636259666498587618221225225512486764533, 67720186971698544312419572409913959008952310058822, 95548255300263520781532296796249481641953868218774, 76085327132285723110424803456124867697064507995236, 37774242535411291684276865538926205024910326572967, 23701913275725675285653248258265463092207058596522, 29798860272258331913126375147341994889534765745501, 18495701454879288984856827726077713721403798879715, 38298203783031473527721580348144513491373226651381, 34829543829199918180278916522431027392251122869539, 40957953066405232632538044100059654939159879593635, 29746152185502371307642255121183693803580388584903, 41698116222072977186158236678424689157993532961922, 62467957194401269043877107275048102390895523597457, 23189706772547915061505504953922979530901129967519, 86188088225875314529584099251203829009407770775672, 11306739708304724483816533873502340845647058077308, 82959174767140363198008187129011875491310547126581, 97623331044818386269515456334926366572897563400500, 42846280183517070527831839425882145521227251250327, 55121603546981200581762165212827652751691296897789, 32238195734329339946437501907836945765883352399886, 75506164965184775180738168837861091527357929701337, 62177842752192623401942399639168044983993173312731, 32924185707147349566916674687634660915035914677504, 99518671430235219628894890102423325116913619626622, 73267460800591547471830798392868535206946944540724, 76841822524674417161514036427982273348055556214818, 97142617910342598647204516893989422179826088076852, 87783646182799346313767754307809363333018982642090, 10848802521674670883215120185883543223812876952786, 71329612474782464538636993009049310363619763878039, 62184073572399794223406235393808339651327408011116, 66627891981488087797941876876144230030984490851411, 60661826293682836764744779239180335110989069790714, 85786944089552990653640447425576083659976645795096, 66024396409905389607120198219976047599490197230297, 64913982680032973156037120041377903785566085089252, 16730939319872750275468906903707539413042652315011, 94809377245048795150954100921645863754710598436791, 78639167021187492431995700641917969777599028300699, 15368713711936614952811305876380278410754449733078, 40789923115535562561142322423255033685442488917353, 44889911501440648020369068063960672322193204149535, 41503128880339536053299340368006977710650566631954, 81234880673210146739058568557934581403627822703280, 82616570773948327592232845941706525094512325230608, 22918802058777319719839450180888072429661980811197, 77158542502016545090413245809786882778948721859617, 72107838435069186155435662884062257473692284509516, 20849603980134001723930671666823555245252804609722, 53503534226472524250874054075591789781264330331690];

problem.answer = function() {
  var n, str, sum, _i, _len;
  sum = 0;
  for (_i = 0, _len = numbers.length; _i < _len; _i++) {
    n = numbers[_i];
    sum += n;
  }
  str = String(sum).replace(/\./g, "").substr(0, 10);
  return str;
};


},{}],"e013":[function(require,module,exports){
module.exports=require('kXr2Ih');
},{}],"e014":[function(require,module,exports){
module.exports=require('D5d49D');
},{}],"D5d49D":[function(require,module,exports){
var collatzCache, collatzChainLength, problem;

module.exports = problem = new Problem("\nProblem 14: Longest Collatz sequence\n------------------------------------\n\nThe following iterative sequence is defined for the set of positive integers:\n\n    n -> n/2    (n is even)\n    n -> 3n + 1 (n is odd)\n\nUsing the rule above and starting with 13, we generate the following sequence:\n\n    13 -> 40 -> 20 -> 10 -> 5 -> 16 -> 8 -> 4 -> 2 -> 1\n\nIt can be seen that this sequence (starting at 13 and finishing at 1) contains 10 terms. Although it has not been proved yet (Collatz Problem), it is thought that all starting numbers finish at 1.\n\nWhich starting number, under one million, produces the longest chain?\n\nNOTE: Once the chain starts the terms are allowed to go above one million.\n");

collatzCache = {};

collatzChainLength = function(startingValue) {
  var i, len, n, toBeCached, v, _i, _len;
  n = startingValue;
  toBeCached = [];
  while (true) {
    if (collatzCache.hasOwnProperty(n)) {
      break;
    }
    toBeCached.push(n);
    if (n === 1) {
      break;
    }
    if ((n % 2) === 0) {
      n = Math.floor(n / 2);
    } else {
      n = (n * 3) + 1;
    }
  }
  len = toBeCached.length;
  for (i = _i = 0, _len = toBeCached.length; _i < _len; i = ++_i) {
    v = toBeCached[i];
    collatzCache[v] = collatzCache[n] + (len - i);
  }
  return collatzCache[startingValue];
};

problem.test = function() {
  collatzCache = {
    "1": 1
  };
  equal(collatzChainLength(13), 10, "13 has a collatz chain of 10");
  equal(collatzChainLength(26), 11, "26 has a collatz chain of 11");
  return equal(collatzChainLength(1), 1, "1 has a collatz chain of 1");
};

problem.answer = function() {
  var chainLength, i, maxChain, maxChainLength, _i;
  collatzCache = {
    "1": 1
  };
  maxChain = 0;
  maxChainLength = 0;
  for (i = _i = 1; _i < 1000000; i = ++_i) {
    chainLength = collatzChainLength(i);
    if (maxChainLength < chainLength) {
      maxChainLength = chainLength;
      maxChain = i;
    }
  }
  return {
    answer: maxChain,
    chainLength: maxChainLength
  };
};


},{}],"I9XObj":[function(require,module,exports){
var lattice, math, problem;

module.exports = problem = new Problem("\nProblem 15: Lattice paths\n-------------------------\n\nStarting in the top left corner of a 2×2 grid, and only being able to move to the right and down, there are exactly 6 routes to the bottom right corner.\n\n    (picture showing 6 paths: RRDD, RDRD, RDDR, DRRD, DRDR, DDRR)\n\nHow many such routes are there through a 20×20 grid?\n");

math = require("math");

lattice = function(n) {
  return math.nCr(n * 2, n);
};

problem.test = function() {
  equal(lattice(1), 2, "1x1 lattice has 2 paths");
  return equal(lattice(2), 6, "2x2 lattice has 6 paths");
};

problem.answer = function() {
  return lattice(20);
};


},{"math":"Gm6Ven"}],"e015":[function(require,module,exports){
module.exports=require('I9XObj');
},{}],"fYrOMX":[function(require,module,exports){
var MAX_EXPONENT, bigInt, math, powerDigitSum, problem;

module.exports = problem = new Problem("\nProblem 16: Power digit sum\n---------------------------\n\n2^15 = 32768 and the sum of its digits is 3 + 2 + 7 + 6 + 8 = 26.\n\nWhat is the sum of the digits of the number 2^1000?\n");

math = require("math");

bigInt = require("big-integer");

MAX_EXPONENT = 50;

powerDigitSum = function(x, y) {
  var d, digits, exponent, number, sum, _i, _len;
  number = bigInt(1);
  while (y !== 0) {
    exponent = y;
    if (exponent > MAX_EXPONENT) {
      exponent = MAX_EXPONENT;
    }
    y -= exponent;
    number = number.multiply(Math.floor(Math.pow(x, exponent)));
  }
  digits = String(number);
  sum = 0;
  for (_i = 0, _len = digits.length; _i < _len; _i++) {
    d = digits[_i];
    sum += parseInt(d);
  }
  return sum;
};

problem.test = function() {
  return equal(powerDigitSum(2, 15), 26, "sum of digits of 2^15 is 26");
};

problem.answer = function() {
  return powerDigitSum(2, 1000);
};


},{"big-integer":1,"math":"Gm6Ven"}],"e016":[function(require,module,exports){
module.exports=require('fYrOMX');
},{}],"55/0iX":[function(require,module,exports){
var names, numberLetterCount, numberLetterCountRange, problem;

module.exports = problem = new Problem("\nProblem 17: Number letter counts\n--------------------------------\n\nIf the numbers 1 to 5 are written out in words: one, two, three, four, five, then there are 3 + 3 + 5 + 4 + 4 = 19 letters used in total.\n\nIf all the numbers from 1 to 1000 (one thousand) inclusive were written out in words, how many letters would be used?\n\nNOTE: Do not count spaces or hyphens. For example, 342 (three hundred and forty-two) contains 23 letters and 115 (one hundred and fifteen) contains 20 letters. The use of \"and\" when writing out numbers is in compliance with British usage.\n");

names = {
  ones: "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(/\s+/),
  tens: "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split(/\s+/)
};

numberLetterCount = function(num) {
  var hundreds, lettersOnly, n, name, tens, thousands;
  n = num;
  name = "";
  if (n >= 1000) {
    thousands = Math.floor(n / 1000);
    n = n % 1000;
    name += "" + names.ones[thousands] + " thousand ";
  }
  if (n >= 100) {
    hundreds = Math.floor(n / 100);
    n = n % 100;
    name += "" + names.ones[hundreds] + " hundred ";
  }
  if ((n > 0) && (name.length > 0)) {
    name += "and ";
  }
  if (n >= 20) {
    tens = Math.floor(n / 10);
    n = n % 10;
    name += "" + names.tens[tens] + " ";
  }
  if (n > 0) {
    name += "" + names.ones[n] + " ";
  }
  lettersOnly = name.replace(/[^a-z]/g, "");
  return lettersOnly.length;
};

numberLetterCountRange = function(a, b) {
  var i, sum, _i;
  sum = 0;
  for (i = _i = a; a <= b ? _i <= b : _i >= b; i = a <= b ? ++_i : --_i) {
    sum += numberLetterCount(i);
  }
  return sum;
};

problem.test = function() {
  equal(numberLetterCountRange(1, 5), 19, "sum of lengths of numbers 1-5 is 19");
  equal(numberLetterCount(342), 23, "length of name of 342 is 23");
  return equal(numberLetterCount(115), 20, "length of name of 115 is 20");
};

problem.answer = function() {
  return numberLetterCountRange(1, 1000);
};


},{}],"e017":[function(require,module,exports){
module.exports=require('55/0iX');
},{}],"math":[function(require,module,exports){
module.exports=require('Gm6Ven');
},{}],"Gm6Ven":[function(require,module,exports){
var IncrementalSieve, root;

root = typeof exports !== "undefined" && exports !== null ? exports : this;

IncrementalSieve = (function() {
  function IncrementalSieve() {
    this.n = 0;
  }

  IncrementalSieve.prototype.next = function() {
    var nxt, p2, s;
    this.n += 2;
    if (this.n < 7) {
      if (this.n < 3) {
        this.n = 1;
        return 2;
      }
      if (this.n < 5) {
        return 3;
      }
      this.dict = {};
      this.bps = new IncrementalSieve();
      this.bps.next();
      this.p = this.bps.next();
      this.q = this.p * this.p;
      return 5;
    } else {
      s = this.dict[this.n];
      if (!s) {
        if (this.n < this.q) {
          return this.n;
        } else {
          p2 = this.p << 1;
          this.dict[this.n + p2] = p2;
          this.p = this.bps.next();
          this.q = this.p * this.p;
          return this.next();
        }
      } else {
        delete this.dict[this.n];
        nxt = this.n + s;
        while (this.dict[nxt]) {
          nxt += s;
        }
        this.dict[nxt] = s;
        return this.next();
      }
    }
  };

  return IncrementalSieve;

})();

root.IncrementalSieve = IncrementalSieve;

root.leastFactor = function(n) {
  var i, m, _i;
  if (isNaN(n) || !isFinite(n)) {
    return NaN;
  }
  if (n === 0) {
    return 0;
  }
  if ((n % 1) !== 0 || (n * n) < 2) {
    return 1;
  }
  if ((n % 2) === 0) {
    return 2;
  }
  if ((n % 3) === 0) {
    return 3;
  }
  if ((n % 5) === 0) {
    return 5;
  }
  m = Math.sqrt(n);
  for (i = _i = 7; _i <= m; i = _i += 30) {
    if ((n % i) === 0) {
      return i;
    }
    if ((n % (i + 4)) === 0) {
      return i + 4;
    }
    if ((n % (i + 6)) === 0) {
      return i + 6;
    }
    if ((n % (i + 10)) === 0) {
      return i + 10;
    }
    if ((n % (i + 12)) === 0) {
      return i + 12;
    }
    if ((n % (i + 16)) === 0) {
      return i + 16;
    }
    if ((n % (i + 22)) === 0) {
      return i + 22;
    }
    if ((n % (i + 24)) === 0) {
      return i + 24;
    }
  }
  return n;
};

root.isPrime = function(n) {
  if (isNaN(n) || !isFinite(n) || (n % 1) !== 0 || (n < 2)) {
    return false;
  }
  if (n === root.leastFactor(n)) {
    return true;
  }
  return false;
};

root.primeFactors = function(n) {
  var factor, factors;
  if (n === 1) {
    return [1];
  }
  factors = [];
  while (!root.isPrime(n)) {
    factor = root.leastFactor(n);
    factors.push(factor);
    n /= factor;
  }
  factors.push(n);
  return factors;
};

root.factorial = function(n) {
  var f;
  f = n;
  while (n > 1) {
    n--;
    f *= n;
  }
  return f;
};

root.nCr = function(n, r) {
  return Math.floor(root.factorial(n) / (root.factorial(r) * root.factorial(n - r)));
};


},{}],"terminal":[function(require,module,exports){
module.exports=require('AUKApQ');
},{}],"AUKApQ":[function(require,module,exports){
var LAST_PROBLEM, Problem, root;

LAST_PROBLEM = 17;

root = window;

root.escapedStringify = function(o) {
  var str;
  str = JSON.stringify(o);
  str = str.replace("]", "\\]");
  return str;
};

root.runAll = function() {
  var lastPuzzle, loadNextScript, nextIndex;
  lastPuzzle = LAST_PROBLEM;
  nextIndex = 0;
  loadNextScript = function() {
    if (nextIndex < lastPuzzle) {
      nextIndex++;
      return runTest(nextIndex, loadNextScript);
    }
  };
  return loadNextScript();
};

root.iterateProblems = function(args) {
  var indexToProcess, iterateNext;
  indexToProcess = null;
  if (args.endIndex > 0) {
    if (args.startIndex <= args.endIndex) {
      indexToProcess = args.startIndex;
      args.startIndex++;
    }
  } else {
    if (args.list.length > 0) {
      indexToProcess = args.list.shift();
    }
  }
  if (indexToProcess !== null) {
    iterateNext = function() {
      window.args = args;
      return runTest(indexToProcess, function() {
        return iterateProblems(args);
      });
    };
    return iterateNext();
  }
};

root.runTest = function(index, cb) {
  var moduleName, problem;
  moduleName = "e" + (('000' + index).slice(-3));
  window.index = index;
  problem = require(moduleName);
  problem.process();
  if (cb) {
    return window.setTimeout(cb, 0);
  }
};

Problem = (function() {
  function Problem(description) {
    var lines;
    this.description = description;
    this.index = window.index;
    lines = this.description.split(/\n/);
    while (lines.length > 0 && lines[0].length === 0) {
      lines.shift();
    }
    this.title = lines.shift();
    this.line = lines.shift();
    this.description = lines.join("\n");
  }

  Problem.prototype.now = function() {
    if (window.performance) {
      return window.performance.now();
    } else {
      return new Date().getTime();
    }
  };

  Problem.prototype.process = function() {
    var answer, answerFunc, end, formattedTitle, ms, sourceLine, start, testFunc, url;
    if (window.args.description) {
      window.terminal.echo("[[;#444444;]_______________________________________________________________________________________________]\n");
    }
    formattedTitle = $.terminal.format("[[;#ffaa00;]" + this.title + "]");
    url = "?c=" + window.args.cmd + "_" + this.index;
    if (window.args.verbose) {
      url += "_v";
    }
    window.terminal.echo("<a href=\"" + url + "\">" + formattedTitle + "</a>", {
      raw: true
    });
    if (window.args.description) {
      window.terminal.echo("[[;#444444;]" + this.line + "]");
      window.terminal.echo("[[;#ccccee;]" + this.description + "]\n");
      sourceLine = $.terminal.format("[[;#444444;]Source:] ");
      sourceLine += (" <a href=\"src/e" + (('000' + this.index).slice(-3)) + ".coffee\">") + $.terminal.format("[[;#773300;]Local]") + "</a> ";
      sourceLine += $.terminal.format("[[;#444444;]/]");
      sourceLine += (" <a href=\"https://github.com/joedrago/euler/blob/master/src/e" + (('000' + this.index).slice(-3)) + ".coffee\">") + $.terminal.format("[[;#773300;]Github]") + "</a>";
      window.terminal.echo(sourceLine, {
        raw: true
      });
      if (window.args.test || window.args.answer) {
        window.terminal.echo("");
      }
    }
    testFunc = this.test;
    answerFunc = this.answer;
    if (window.args.test) {
      if (testFunc === void 0) {
        window.terminal.echo("[[;#444444;] (no tests)]");
      } else {
        testFunc();
      }
    }
    if (window.args.answer) {
      start = this.now();
      answer = answerFunc();
      end = this.now();
      ms = end - start;
      return window.terminal.echo("[[;#ffffff;] -> ][[;#aaffaa;]Answer:] ([[;#aaffff;]" + (ms.toFixed(1)) + "ms]): [[;#ffffff;]" + (escapedStringify(answer)) + "]");
    }
  };

  return Problem;

})();

root.Problem = Problem;

root.ok = function(v, msg) {
  return window.terminal.echo("[[;#ffffff;] *  ]" + v + ": " + msg);
};

root.equal = function(a, b, msg) {
  if (a === b) {
    return window.terminal.echo("[[;#ffffff;] *  ][[;#555555;]PASS: " + msg + "]");
  } else {
    return window.terminal.echo("[[;#ffffff;] *  ][[;#ffaaaa;]FAIL: " + msg + " (" + a + " != " + b + ")]");
  }
};

root.onCommand = (function(_this) {
  return function(command) {
    var arg, args, cmd, process, v, _i, _len, _ref;
    if (command.length === 0) {
      return;
    }
    cmd = $.terminal.parseCommand(command);
    if (cmd.name.length === 0) {
      return;
    }
    args = {
      startIndex: 0,
      endIndex: 0,
      list: [],
      verbose: false,
      description: false,
      test: false,
      answer: false
    };
    process = true;
    _ref = cmd.args;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      arg = _ref[_i];
      arg = String(arg);
      if (arg.length < 1) {
        continue;
      }
      if (arg[0] === 'v') {
        args.verbose = true;
      } else if (arg.match(/^\d+$/)) {
        v = parseInt(arg);
        if ((v >= 1) && (v <= LAST_PROBLEM)) {
          args.list.push(v);
        } else {
          process = false;
          window.terminal.echo("[[;#ffaaaa;]No such test: " + v + " (valid tests 1-" + LAST_PROBLEM + ")]");
        }
      }
    }
    if (args.list.length === 0) {
      args.startIndex = 1;
      args.endIndex = LAST_PROBLEM;
    }
    if (cmd.name[0] === 'l') {
      args.cmd = "list";
    } else if (cmd.name[0] === 'd') {
      args.cmd = "describe";
      args.description = true;
    } else if (cmd.name[0] === 't') {
      args.cmd = "test";
      args.test = true;
    } else if (cmd.name[0] === 'a') {
      args.cmd = "answer";
      args.answer = true;
    } else if (cmd.name[0] === 'r') {
      args.cmd = "run";
      args.test = true;
      args.answer = true;
    } else if (cmd.name[0] === 'd') {
      args.cmd = "describe";
      args.description = true;
    } else if (cmd.name[0] === 'h') {
      args.cmd = "help";
      process = false;
      window.terminal.echo("Commands:\n\n    list [X]     - List problem titles\n    describe [X] - Display full problem descriptions\n    test [X]     - Run unit tests\n    answer [X]   - Time and calculate answer\n    run [X]      - test and answer combined\n    help         - This help\n\n    In all of these, [X] can be a list of one or more problem numbers. (a value from 1 to " + LAST_PROBLEM + "). If absent, it implies all problems.\n    Also, adding the word \"verbose\" to some of these commands will emit the description before performing the task.\n");
    } else {
      process = false;
      window.terminal.echo("[[;#ffaaaa;]Unknown command.]");
    }
    if (args.verbose) {
      args.description = true;
    }
    if (process) {
      return iterateProblems(args);
    }
  };
})(this);


},{}]},{},[])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2JpZy1pbnRlZ2VyL0JpZ0ludGVnZXIuanMiLCIuLi9zcmMvZTAwMS5jb2ZmZWUiLCIuLi9zcmMvZTAwMi5jb2ZmZWUiLCIuLi9zcmMvZTAwMy5jb2ZmZWUiLCIuLi9zcmMvZTAwNC5jb2ZmZWUiLCIuLi9zcmMvZTAwNS5jb2ZmZWUiLCIuLi9zcmMvZTAwNi5jb2ZmZWUiLCIuLi9zcmMvZTAwNy5jb2ZmZWUiLCIuLi9zcmMvZTAwOC5jb2ZmZWUiLCIuLi9zcmMvZTAwOS5jb2ZmZWUiLCIuLi9zcmMvZTAxMC5jb2ZmZWUiLCIuLi9zcmMvZTAxMS5jb2ZmZWUiLCIuLi9zcmMvZTAxMi5jb2ZmZWUiLCIuLi9zcmMvZTAxMy5jb2ZmZWUiLCIuLi9zcmMvZTAxNC5jb2ZmZWUiLCIuLi9zcmMvZTAxNS5jb2ZmZWUiLCIuLi9zcmMvZTAxNi5jb2ZmZWUiLCIuLi9zcmMvZTAxNy5jb2ZmZWUiLCIuLi9zcmMvbWF0aC5jb2ZmZWUiLCIuLi9zcmMvdGVybWluYWwuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqWUEsSUFBQSxPQUFBOztBQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLE9BQUEsR0FBYyxJQUFBLE9BQUEsQ0FBUSx1UUFBUixDQUEvQixDQUFBOztBQUFBLE9BWU8sQ0FBQyxJQUFSLEdBQWUsU0FBQSxHQUFBO0FBQ2IsTUFBQSxVQUFBO0FBQUEsRUFBQSxHQUFBLEdBQU0sQ0FBTixDQUFBO0FBQ0EsT0FBUyw2QkFB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dGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGJpZ0ludCA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgYmFzZSA9IDEwMDAwMDAwLCBsb2dCYXNlID0gNztcclxuICAgIHZhciBzaWduID0ge1xyXG4gICAgICAgIHBvc2l0aXZlOiBmYWxzZSxcclxuICAgICAgICBuZWdhdGl2ZTogdHJ1ZVxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgbm9ybWFsaXplID0gZnVuY3Rpb24gKGZpcnN0LCBzZWNvbmQpIHtcclxuICAgICAgICB2YXIgYSA9IGZpcnN0LnZhbHVlLCBiID0gc2Vjb25kLnZhbHVlO1xyXG4gICAgICAgIHZhciBsZW5ndGggPSBhLmxlbmd0aCA+IGIubGVuZ3RoID8gYS5sZW5ndGggOiBiLmxlbmd0aDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGFbaV0gPSBhW2ldIHx8IDA7XHJcbiAgICAgICAgICAgIGJbaV0gPSBiW2ldIHx8IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAodmFyIGkgPSBsZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICBpZiAoYVtpXSA9PT0gMCAmJiBiW2ldID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBhLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgYi5wb3AoKTtcclxuICAgICAgICAgICAgfSBlbHNlIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWEubGVuZ3RoKSBhID0gWzBdLCBiID0gWzBdO1xyXG4gICAgICAgIGZpcnN0LnZhbHVlID0gYTtcclxuICAgICAgICBzZWNvbmQudmFsdWUgPSBiO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgcGFyc2UgPSBmdW5jdGlvbiAodGV4dCwgZmlyc3QpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHRleHQgPT09IFwib2JqZWN0XCIpIHJldHVybiB0ZXh0O1xyXG4gICAgICAgIHRleHQgKz0gXCJcIjtcclxuICAgICAgICB2YXIgcyA9IHNpZ24ucG9zaXRpdmUsIHZhbHVlID0gW107XHJcbiAgICAgICAgaWYgKHRleHRbMF0gPT09IFwiLVwiKSB7XHJcbiAgICAgICAgICAgIHMgPSBzaWduLm5lZ2F0aXZlO1xyXG4gICAgICAgICAgICB0ZXh0ID0gdGV4dC5zbGljZSgxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHRleHQgPSB0ZXh0LnNwbGl0KFwiZVwiKTtcclxuICAgICAgICBpZiAodGV4dC5sZW5ndGggPiAyKSB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGludGVnZXJcIik7XHJcbiAgICAgICAgaWYgKHRleHRbMV0pIHtcclxuICAgICAgICAgICAgdmFyIGV4cCA9IHRleHRbMV07XHJcbiAgICAgICAgICAgIGlmIChleHBbMF0gPT09IFwiK1wiKSBleHAgPSBleHAuc2xpY2UoMSk7XHJcbiAgICAgICAgICAgIGV4cCA9IHBhcnNlKGV4cCk7XHJcbiAgICAgICAgICAgIGlmIChleHAubGVzc2VyKDApKSB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgaW5jbHVkZSBuZWdhdGl2ZSBleHBvbmVudCBwYXJ0IGZvciBpbnRlZ2Vyc1wiKTtcclxuICAgICAgICAgICAgd2hpbGUgKGV4cC5ub3RFcXVhbHMoMCkpIHtcclxuICAgICAgICAgICAgICAgIHRleHRbMF0gKz0gXCIwXCI7XHJcbiAgICAgICAgICAgICAgICBleHAgPSBleHAucHJldigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRleHQgPSB0ZXh0WzBdO1xyXG4gICAgICAgIGlmICh0ZXh0ID09PSBcIi0wXCIpIHRleHQgPSBcIjBcIjtcclxuICAgICAgICB2YXIgaXNWYWxpZCA9IC9eKFswLTldWzAtOV0qKSQvLnRlc3QodGV4dCk7XHJcbiAgICAgICAgaWYgKCFpc1ZhbGlkKSB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGludGVnZXJcIik7XHJcbiAgICAgICAgd2hpbGUgKHRleHQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBkaXZpZGVyID0gdGV4dC5sZW5ndGggPiBsb2dCYXNlID8gdGV4dC5sZW5ndGggLSBsb2dCYXNlIDogMDtcclxuICAgICAgICAgICAgdmFsdWUucHVzaCgrdGV4dC5zbGljZShkaXZpZGVyKSk7XHJcbiAgICAgICAgICAgIHRleHQgPSB0ZXh0LnNsaWNlKDAsIGRpdmlkZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdmFsID0gYmlnSW50KHZhbHVlLCBzKTtcclxuICAgICAgICBpZiAoZmlyc3QpIG5vcm1hbGl6ZShmaXJzdCwgdmFsKTtcclxuICAgICAgICByZXR1cm4gdmFsO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgZ29lc0ludG8gPSBmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgICAgIHZhciBhID0gYmlnSW50KGEsIHNpZ24ucG9zaXRpdmUpLCBiID0gYmlnSW50KGIsIHNpZ24ucG9zaXRpdmUpO1xyXG4gICAgICAgIGlmIChhLmVxdWFscygwKSkgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGRpdmlkZSBieSAwXCIpO1xyXG4gICAgICAgIHZhciBuID0gMDtcclxuICAgICAgICBkbyB7XHJcbiAgICAgICAgICAgIHZhciBpbmMgPSAxO1xyXG4gICAgICAgICAgICB2YXIgYyA9IGJpZ0ludChhLnZhbHVlLCBzaWduLnBvc2l0aXZlKSwgdCA9IGMudGltZXMoMTApO1xyXG4gICAgICAgICAgICB3aGlsZSAodC5sZXNzZXIoYikpIHtcclxuICAgICAgICAgICAgICAgIGMgPSB0O1xyXG4gICAgICAgICAgICAgICAgaW5jICo9IDEwO1xyXG4gICAgICAgICAgICAgICAgdCA9IHQudGltZXMoMTApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHdoaWxlIChjLmxlc3Nlck9yRXF1YWxzKGIpKSB7XHJcbiAgICAgICAgICAgICAgICBiID0gYi5taW51cyhjKTtcclxuICAgICAgICAgICAgICAgIG4gKz0gaW5jO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSB3aGlsZSAoYS5sZXNzZXJPckVxdWFscyhiKSk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlbWFpbmRlcjogYi52YWx1ZSxcclxuICAgICAgICAgICAgcmVzdWx0OiBuXHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcblxyXG4gICAgdmFyIGJpZ0ludCA9IGZ1bmN0aW9uICh2YWx1ZSwgcykge1xyXG4gICAgICAgIHZhciBzZWxmID0ge1xyXG4gICAgICAgICAgICB2YWx1ZTogdmFsdWUsXHJcbiAgICAgICAgICAgIHNpZ246IHNcclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciBvID0ge1xyXG4gICAgICAgICAgICB2YWx1ZTogdmFsdWUsXHJcbiAgICAgICAgICAgIHNpZ246IHMsXHJcbiAgICAgICAgICAgIG5lZ2F0ZTogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IG0gfHwgc2VsZjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBiaWdJbnQoZmlyc3QudmFsdWUsICFmaXJzdC5zaWduKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYWJzOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gbSB8fCBzZWxmO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpZ0ludChmaXJzdC52YWx1ZSwgc2lnbi5wb3NpdGl2ZSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGFkZDogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBzLCBmaXJzdCA9IHNlbGYsIHNlY29uZDtcclxuICAgICAgICAgICAgICAgIGlmIChtKSAoZmlyc3QgPSBwYXJzZShuKSkgJiYgKHNlY29uZCA9IHBhcnNlKG0pKTtcclxuICAgICAgICAgICAgICAgIGVsc2Ugc2Vjb25kID0gcGFyc2UobiwgZmlyc3QpO1xyXG4gICAgICAgICAgICAgICAgcyA9IGZpcnN0LnNpZ247XHJcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3Quc2lnbiAhPT0gc2Vjb25kLnNpZ24pIHtcclxuICAgICAgICAgICAgICAgICAgICBmaXJzdCA9IGJpZ0ludChmaXJzdC52YWx1ZSwgc2lnbi5wb3NpdGl2ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2Vjb25kID0gYmlnSW50KHNlY29uZC52YWx1ZSwgc2lnbi5wb3NpdGl2ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHMgPT09IHNpZ24ucG9zaXRpdmUgP1xyXG5cdFx0XHRcdFx0XHRvLnN1YnRyYWN0KGZpcnN0LCBzZWNvbmQpIDpcclxuXHRcdFx0XHRcdFx0by5zdWJ0cmFjdChzZWNvbmQsIGZpcnN0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIG5vcm1hbGl6ZShmaXJzdCwgc2Vjb25kKTtcclxuICAgICAgICAgICAgICAgIHZhciBhID0gZmlyc3QudmFsdWUsIGIgPSBzZWNvbmQudmFsdWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcblx0XHRcdFx0XHRjYXJyeSA9IDA7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoIHx8IGNhcnJ5ID4gMDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN1bSA9IChhW2ldIHx8IDApICsgKGJbaV0gfHwgMCkgKyBjYXJyeTtcclxuICAgICAgICAgICAgICAgICAgICBjYXJyeSA9IHN1bSA+PSBiYXNlID8gMSA6IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VtIC09IGNhcnJ5ICogYmFzZTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChzdW0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpZ0ludChyZXN1bHQsIHMpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwbHVzOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uYWRkKG4sIG0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzdWJ0cmFjdDogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHNlbGYsIHNlY29uZDtcclxuICAgICAgICAgICAgICAgIGlmIChtKSAoZmlyc3QgPSBwYXJzZShuKSkgJiYgKHNlY29uZCA9IHBhcnNlKG0pKTtcclxuICAgICAgICAgICAgICAgIGVsc2Ugc2Vjb25kID0gcGFyc2UobiwgZmlyc3QpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0LnNpZ24gIT09IHNlY29uZC5zaWduKSByZXR1cm4gby5hZGQoZmlyc3QsIG8ubmVnYXRlKHNlY29uZCkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0LnNpZ24gPT09IHNpZ24ubmVnYXRpdmUpIHJldHVybiBvLnN1YnRyYWN0KG8ubmVnYXRlKHNlY29uZCksIG8ubmVnYXRlKGZpcnN0KSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoby5jb21wYXJlKGZpcnN0LCBzZWNvbmQpID09PSAtMSkgcmV0dXJuIG8ubmVnYXRlKG8uc3VidHJhY3Qoc2Vjb25kLCBmaXJzdCkpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSBmaXJzdC52YWx1ZSwgYiA9IHNlY29uZC52YWx1ZTtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuXHRcdFx0XHRcdGJvcnJvdyA9IDA7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdG1wID0gYVtpXSAtIGJvcnJvdztcclxuICAgICAgICAgICAgICAgICAgICBib3Jyb3cgPSB0bXAgPCBiW2ldID8gMSA6IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1pbnVlbmQgPSAoYm9ycm93ICogYmFzZSkgKyB0bXAgLSBiW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG1pbnVlbmQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpZ0ludChyZXN1bHQsIHNpZ24ucG9zaXRpdmUpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBtaW51czogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLnN1YnRyYWN0KG4sIG0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBtdWx0aXBseTogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBzLCBmaXJzdCA9IHNlbGYsIHNlY29uZDtcclxuICAgICAgICAgICAgICAgIGlmIChtKSAoZmlyc3QgPSBwYXJzZShuKSkgJiYgKHNlY29uZCA9IHBhcnNlKG0pKTtcclxuICAgICAgICAgICAgICAgIGVsc2Ugc2Vjb25kID0gcGFyc2UobiwgZmlyc3QpO1xyXG4gICAgICAgICAgICAgICAgcyA9IGZpcnN0LnNpZ24gIT09IHNlY29uZC5zaWduO1xyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSBmaXJzdC52YWx1ZSwgYiA9IHNlY29uZC52YWx1ZTtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHRTdW0gPSBbXTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFN1bVtpXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBqID0gaTtcclxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoai0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFN1bVtpXS5wdXNoKDApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBjYXJyeSA9IDA7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgeCA9IGFbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBiLmxlbmd0aCB8fCBjYXJyeSA+IDA7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgeSA9IGJbal07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcm9kdWN0ID0geSA/ICh4ICogeSkgKyBjYXJyeSA6IGNhcnJ5O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJyeSA9IHByb2R1Y3QgPiBiYXNlID8gTWF0aC5mbG9vcihwcm9kdWN0IC8gYmFzZSkgOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0IC09IGNhcnJ5ICogYmFzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0U3VtW2ldLnB1c2gocHJvZHVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIG1heCA9IC0xO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXN1bHRTdW0ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGVuID0gcmVzdWx0U3VtW2ldLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGVuID4gbWF4KSBtYXggPSBsZW47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gW10sIGNhcnJ5ID0gMDtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWF4IHx8IGNhcnJ5ID4gMDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN1bSA9IGNhcnJ5O1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcmVzdWx0U3VtLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1bSArPSByZXN1bHRTdW1bal1baV0gfHwgMDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2FycnkgPSBzdW0gPiBiYXNlID8gTWF0aC5mbG9vcihzdW0gLyBiYXNlKSA6IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VtIC09IGNhcnJ5ICogYmFzZTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChzdW0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpZ0ludChyZXN1bHQsIHMpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0aW1lczogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLm11bHRpcGx5KG4sIG0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBkaXZtb2Q6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcywgZmlyc3QgPSBzZWxmLCBzZWNvbmQ7XHJcbiAgICAgICAgICAgICAgICBpZiAobSkgKGZpcnN0ID0gcGFyc2UobikpICYmIChzZWNvbmQgPSBwYXJzZShtKSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHNlY29uZCA9IHBhcnNlKG4sIGZpcnN0KTtcclxuICAgICAgICAgICAgICAgIHMgPSBmaXJzdC5zaWduICE9PSBzZWNvbmQuc2lnbjtcclxuICAgICAgICAgICAgICAgIGlmIChiaWdJbnQoZmlyc3QudmFsdWUsIGZpcnN0LnNpZ24pLmVxdWFscygwKSkgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICBxdW90aWVudDogYmlnSW50KFswXSwgc2lnbi5wb3NpdGl2ZSksXHJcbiAgICAgICAgICAgICAgICAgICAgcmVtYWluZGVyOiBiaWdJbnQoWzBdLCBzaWduLnBvc2l0aXZlKVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGlmIChzZWNvbmQuZXF1YWxzKDApKSB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZGl2aWRlIGJ5IHplcm9cIik7XHJcbiAgICAgICAgICAgICAgICB2YXIgYSA9IGZpcnN0LnZhbHVlLCBiID0gc2Vjb25kLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdLCByZW1haW5kZXIgPSBbXTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBhLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG4gPSBbYVtpXV0uY29uY2F0KHJlbWFpbmRlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHF1b3RpZW50ID0gZ29lc0ludG8oYiwgbik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gocXVvdGllbnQucmVzdWx0KTtcclxuICAgICAgICAgICAgICAgICAgICByZW1haW5kZXIgPSBxdW90aWVudC5yZW1haW5kZXI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucmV2ZXJzZSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICBxdW90aWVudDogYmlnSW50KHJlc3VsdCwgcyksXHJcbiAgICAgICAgICAgICAgICAgICAgcmVtYWluZGVyOiBiaWdJbnQocmVtYWluZGVyLCBmaXJzdC5zaWduKVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZGl2aWRlOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uZGl2bW9kKG4sIG0pLnF1b3RpZW50O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvdmVyOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uZGl2aWRlKG4sIG0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBtb2Q6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5kaXZtb2QobiwgbSkucmVtYWluZGVyO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZW1haW5kZXI6IGZ1bmN0aW9uKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLm1vZChuLCBtKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcG93OiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gc2VsZiwgc2Vjb25kO1xyXG4gICAgICAgICAgICAgICAgaWYgKG0pIChmaXJzdCA9IHBhcnNlKG4pKSAmJiAoc2Vjb25kID0gcGFyc2UobSkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBzZWNvbmQgPSBwYXJzZShuLCBmaXJzdCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgYSA9IGZpcnN0LCBiID0gc2Vjb25kO1xyXG4gICAgICAgICAgICAgICAgaWYgKGJpZ0ludChhLnZhbHVlLCBhLnNpZ24pLmVxdWFscygwKSkgcmV0dXJuIFpFUk87XHJcbiAgICAgICAgICAgICAgICBpZiAoYi5sZXNzZXIoMCkpIHJldHVybiBaRVJPO1xyXG4gICAgICAgICAgICAgICAgaWYgKGIuZXF1YWxzKDApKSByZXR1cm4gT05FO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGJpZ0ludChhLnZhbHVlLCBhLnNpZ24pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChiLm1vZCgyKS5lcXVhbHMoMCkpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IHJlc3VsdC5wb3coYi5vdmVyKDIpKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYy50aW1lcyhjKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC50aW1lcyhyZXN1bHQucG93KGIubWludXMoMSkpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbmV4dDogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IG0gfHwgc2VsZjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmFkZChmaXJzdCwgMSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHByZXY6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBtIHx8IHNlbGY7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5zdWJ0cmFjdChmaXJzdCwgMSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNvbXBhcmU6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBzZWxmLCBzZWNvbmQ7XHJcbiAgICAgICAgICAgICAgICBpZiAobSkgKGZpcnN0ID0gcGFyc2UobikpICYmIChzZWNvbmQgPSBwYXJzZShtLCBmaXJzdCkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBzZWNvbmQgPSBwYXJzZShuLCBmaXJzdCk7XHJcbiAgICAgICAgICAgICAgICBub3JtYWxpemUoZmlyc3QsIHNlY29uZCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3QudmFsdWUubGVuZ3RoID09PSAxICYmIHNlY29uZC52YWx1ZS5sZW5ndGggPT09IDEgJiYgZmlyc3QudmFsdWVbMF0gPT09IDAgJiYgc2Vjb25kLnZhbHVlWzBdID09PSAwKSByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIGlmIChzZWNvbmQuc2lnbiAhPT0gZmlyc3Quc2lnbikgcmV0dXJuIGZpcnN0LnNpZ24gPT09IHNpZ24ucG9zaXRpdmUgPyAxIDogLTE7XHJcbiAgICAgICAgICAgICAgICB2YXIgbXVsdGlwbGllciA9IGZpcnN0LnNpZ24gPT09IHNpZ24ucG9zaXRpdmUgPyAxIDogLTE7XHJcbiAgICAgICAgICAgICAgICB2YXIgYSA9IGZpcnN0LnZhbHVlLCBiID0gc2Vjb25kLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IGEubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYVtpXSA+IGJbaV0pIHJldHVybiAxICogbXVsdGlwbGllcjtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYltpXSA+IGFbaV0pIHJldHVybiAtMSAqIG11bHRpcGxpZXI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY29tcGFyZVRvOiBmdW5jdGlvbihuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5jb21wYXJlKG4sIG0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjb21wYXJlQWJzOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gc2VsZiwgc2Vjb25kO1xyXG4gICAgICAgICAgICAgICAgaWYgKG0pIChmaXJzdCA9IHBhcnNlKG4pKSAmJiAoc2Vjb25kID0gcGFyc2UobSwgZmlyc3QpKTtcclxuICAgICAgICAgICAgICAgIGVsc2Ugc2Vjb25kID0gcGFyc2UobiwgZmlyc3QpO1xyXG4gICAgICAgICAgICAgICAgZmlyc3Quc2lnbiA9IHNlY29uZC5zaWduID0gc2lnbi5wb3NpdGl2ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmNvbXBhcmUoZmlyc3QsIHNlY29uZCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVxdWFsczogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmNvbXBhcmUobiwgbSkgPT09IDA7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG5vdEVxdWFsczogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAhby5lcXVhbHMobiwgbSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGxlc3NlcjogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmNvbXBhcmUobiwgbSkgPCAwO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBncmVhdGVyOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uY29tcGFyZShuLCBtKSA+IDA7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGdyZWF0ZXJPckVxdWFsczogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmNvbXBhcmUobiwgbSkgPj0gMDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbGVzc2VyT3JFcXVhbHM6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5jb21wYXJlKG4sIG0pIDw9IDA7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGlzUG9zaXRpdmU6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBtIHx8IHNlbGY7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlyc3Quc2lnbiA9PT0gc2lnbi5wb3NpdGl2ZTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgaXNOZWdhdGl2ZTogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IG0gfHwgc2VsZjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmaXJzdC5zaWduID09PSBzaWduLm5lZ2F0aXZlO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBpc0V2ZW46IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBtIHx8IHNlbGY7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlyc3QudmFsdWVbMF0gJSAyID09PSAwO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBpc09kZDogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IG0gfHwgc2VsZjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmaXJzdC52YWx1ZVswXSAlIDIgPT09IDE7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHRvU3RyaW5nOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gbSB8fCBzZWxmO1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0ciA9IFwiXCIsIGxlbiA9IGZpcnN0LnZhbHVlLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChsZW4tLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmaXJzdC52YWx1ZVtsZW5dLnRvU3RyaW5nKCkubGVuZ3RoID09PSA4KSBzdHIgKz0gZmlyc3QudmFsdWVbbGVuXTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHN0ciArPSAoYmFzZS50b1N0cmluZygpICsgZmlyc3QudmFsdWVbbGVuXSkuc2xpY2UoLWxvZ0Jhc2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKHN0clswXSA9PT0gXCIwXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHIgPSBzdHIuc2xpY2UoMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIXN0ci5sZW5ndGgpIHN0ciA9IFwiMFwiO1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0ciA9PT0gXCIwXCIpIHJldHVybiBzdHI7XHJcbiAgICAgICAgICAgICAgICB2YXIgcyA9IGZpcnN0LnNpZ24gPT09IHNpZ24ucG9zaXRpdmUgPyBcIlwiIDogXCItXCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcyArIHN0cjtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdG9KU051bWJlcjogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiArby50b1N0cmluZyhtKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdmFsdWVPZjogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLnRvSlNOdW1iZXIobSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBvO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgWkVSTyA9IGJpZ0ludChbMF0sIHNpZ24ucG9zaXRpdmUpO1xyXG4gICAgdmFyIE9ORSA9IGJpZ0ludChbMV0sIHNpZ24ucG9zaXRpdmUpO1xyXG4gICAgdmFyIE1JTlVTX09ORSA9IGJpZ0ludChbMV0sIHNpZ24ubmVnYXRpdmUpO1xyXG5cclxuICAgIHZhciBwYXJzZUJhc2UgPSBmdW5jdGlvbiAodGV4dCwgYmFzZSkge1xyXG4gICAgICAgIGJhc2UgPSBwYXJzZShiYXNlKTtcclxuICAgICAgICB2YXIgdmFsID0gWkVSTztcclxuICAgICAgICB2YXIgZGlnaXRzID0gW107XHJcbiAgICAgICAgdmFyIGk7XHJcbiAgICAgICAgdmFyIGlzTmVnYXRpdmUgPSBmYWxzZTtcclxuICAgICAgICBmdW5jdGlvbiBwYXJzZVRva2VuKHRleHQpIHtcclxuICAgICAgICAgICAgdmFyIGMgPSB0ZXh0W2ldLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIGlmIChpID09PSAwICYmIHRleHRbaV0gPT09IFwiLVwiKSB7XHJcbiAgICAgICAgICAgICAgICBpc05lZ2F0aXZlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoL1swLTldLy50ZXN0KGMpKSBkaWdpdHMucHVzaChwYXJzZShjKSk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKC9bYS16XS8udGVzdChjKSkgZGlnaXRzLnB1c2gocGFyc2UoYy5jaGFyQ29kZUF0KDApIC0gODcpKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAoYyA9PT0gXCI8XCIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBzdGFydCA9IGk7XHJcbiAgICAgICAgICAgICAgICBkbyBpKys7IHdoaWxlICh0ZXh0W2ldICE9PSBcIj5cIik7XHJcbiAgICAgICAgICAgICAgICBkaWdpdHMucHVzaChwYXJzZSh0ZXh0LnNsaWNlKHN0YXJ0ICsgMSwgaSkpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvcihjICsgXCIgaXMgbm90IGEgdmFsaWQgY2hhcmFjdGVyXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGV4dC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBwYXJzZVRva2VuKHRleHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBkaWdpdHMucmV2ZXJzZSgpO1xyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBkaWdpdHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFsID0gdmFsLmFkZChkaWdpdHNbaV0udGltZXMoYmFzZS5wb3coaSkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGlzTmVnYXRpdmUgPyAtdmFsIDogdmFsO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBmblJldHVybiA9IGZ1bmN0aW9uIChhLCBiKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBhID09PSBcInVuZGVmaW5lZFwiKSByZXR1cm4gWkVSTztcclxuICAgICAgICBpZiAodHlwZW9mIGIgIT09IFwidW5kZWZpbmVkXCIpIHJldHVybiBwYXJzZUJhc2UoYSwgYik7XHJcbiAgICAgICAgcmV0dXJuIHBhcnNlKGEpO1xyXG4gICAgfTtcclxuICAgIGZuUmV0dXJuLnplcm8gPSBaRVJPO1xyXG4gICAgZm5SZXR1cm4ub25lID0gT05FO1xyXG4gICAgZm5SZXR1cm4ubWludXNPbmUgPSBNSU5VU19PTkU7XHJcbiAgICByZXR1cm4gZm5SZXR1cm47XHJcbn0pKCk7XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBiaWdJbnQ7XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAxOiBNdWx0aXBsZXMgb2YgMyBhbmQgNVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5JZiB3ZSBsaXN0IGFsbCB0aGUgbmF0dXJhbCBudW1iZXJzIGJlbG93IDEwIHRoYXQgYXJlIG11bHRpcGxlcyBvZiAzIG9yIDUsIHdlIGdldCAzLCA1LCA2IGFuZCA5LlxuVGhlIHN1bSBvZiB0aGVzZSBtdWx0aXBsZXMgaXMgMjMuXG5cbkZpbmQgdGhlIHN1bSBvZiBhbGwgdGhlIG11bHRpcGxlcyBvZiAzIG9yIDUgYmVsb3cgMTAwMC5cblxuXCJcIlwiXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIHN1bSA9IDBcbiAgZm9yIGkgaW4gWzEuLi4xMF1cbiAgICBpZiAoaSAlIDMgPT0gMCkgb3IgKGkgJSA1ID09IDApXG4gICAgICBzdW0gKz0gaVxuICBlcXVhbChzdW0sIDIzLCBcIlN1bSBvZiBuYXR1cmFsIG51bWJlcnMgPCAxMDogI3tzdW19XCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgc3VtID0gMFxuICBmb3IgaSBpbiBbMS4uLjEwMDBdXG4gICAgaWYgKGkgJSAzID09IDApIG9yIChpICUgNSA9PSAwKVxuICAgICAgc3VtICs9IGlcblxuICByZXR1cm4gc3VtXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAyOiBFdmVuIEZpYm9uYWNjaSBudW1iZXJzXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuRWFjaCBuZXcgdGVybSBpbiB0aGUgRmlib25hY2NpIHNlcXVlbmNlIGlzIGdlbmVyYXRlZCBieSBhZGRpbmcgdGhlIHByZXZpb3VzIHR3byB0ZXJtcy5cbkJ5IHN0YXJ0aW5nIHdpdGggMSBhbmQgMiwgdGhlIGZpcnN0IDEwIHRlcm1zIHdpbGwgYmU6XG5cbjEsIDIsIDMsIDUsIDgsIDEzLCAyMSwgMzQsIDU1LCA4OSwgLi4uXG5cbkJ5IGNvbnNpZGVyaW5nIHRoZSB0ZXJtcyBpbiB0aGUgRmlib25hY2NpIHNlcXVlbmNlIHdob3NlIHZhbHVlcyBkbyBub3QgZXhjZWVkIGZvdXIgbWlsbGlvbixcbmZpbmQgdGhlIHN1bSBvZiB0aGUgZXZlbi12YWx1ZWQgdGVybXMuXG5cblwiXCJcIlxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHByZXYgPSAxXG4gIGN1cnIgPSAxXG4gIHN1bSA9IDBcblxuICB3aGlsZSBjdXJyIDwgNDAwMDAwMFxuICAgIGlmIChjdXJyICUgMikgPT0gMFxuICAgICAgc3VtICs9IGN1cnJcblxuICAgIG5leHQgPSBjdXJyICsgcHJldlxuICAgIHByZXYgPSBjdXJyXG4gICAgY3VyciA9IG5leHRcblxuICByZXR1cm4gc3VtXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAzOiBMYXJnZXN0IHByaW1lIGZhY3RvclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5UaGUgcHJpbWUgZmFjdG9ycyBvZiAxMzE5NSBhcmUgNSwgNywgMTMgYW5kIDI5LlxuXG5XaGF0IGlzIHRoZSBsYXJnZXN0IHByaW1lIGZhY3RvciBvZiB0aGUgbnVtYmVyIDYwMDg1MTQ3NTE0MyA/XG5cblwiXCJcIlxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIFNoYW1lbGVzc2x5IHBpbGZlcmVkL2Fkb3B0ZWQgZnJvbSBodHRwOi8vd3d3LmphdmFzY3JpcHRlci5uZXQvZmFxL251bWJlcmlzcHJpbWUuaHRtXG5cbmxlYXN0RmFjdG9yID0gKG4pIC0+XG4gIHJldHVybiBOYU4gaWYgaXNOYU4obikgb3Igbm90IGlzRmluaXRlKG4pXG4gIHJldHVybiAwIGlmIG4gPT0gMFxuICByZXR1cm4gMSBpZiAobiAlIDEpICE9IDAgb3IgKG4gKiBuKSA8IDJcbiAgcmV0dXJuIDIgaWYgKG4gJSAyKSA9PSAwXG4gIHJldHVybiAzIGlmIChuICUgMykgPT0gMFxuICByZXR1cm4gNSBpZiAobiAlIDUpID09IDBcblxuICBtID0gTWF0aC5zcXJ0IG5cbiAgZm9yIGkgaW4gWzcuLm1dIGJ5IDMwXG4gICAgcmV0dXJuIGkgICAgaWYgKG4gJSBpKSAgICAgID09IDBcbiAgICByZXR1cm4gaSs0ICBpZiAobiAlIChpKzQpKSAgPT0gMFxuICAgIHJldHVybiBpKzYgIGlmIChuICUgKGkrNikpICA9PSAwXG4gICAgcmV0dXJuIGkrMTAgaWYgKG4gJSAoaSsxMCkpID09IDBcbiAgICByZXR1cm4gaSsxMiBpZiAobiAlIChpKzEyKSkgPT0gMFxuICAgIHJldHVybiBpKzE2IGlmIChuICUgKGkrMTYpKSA9PSAwXG4gICAgcmV0dXJuIGkrMjIgaWYgKG4gJSAoaSsyMikpID09IDBcbiAgICByZXR1cm4gaSsyNCBpZiAobiAlIChpKzI0KSkgPT0gMFxuXG4gIHJldHVybiBuXG5cbmlzUHJpbWUgPSAobikgLT5cbiAgaWYgaXNOYU4obikgb3Igbm90IGlzRmluaXRlKG4pIG9yIChuICUgMSkgIT0gMCBvciAobiA8IDIpXG4gICAgcmV0dXJuIGZhbHNlXG4gIGlmIG4gPT0gbGVhc3RGYWN0b3IobilcbiAgICByZXR1cm4gdHJ1ZVxuXG4gIHJldHVybiBmYWxzZVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnByaW1lRmFjdG9ycyA9IChuKSAtPlxuICByZXR1cm4gWzFdIGlmIG4gPT0gMVxuXG4gIGZhY3RvcnMgPSBbXVxuICB3aGlsZSBub3QgaXNQcmltZShuKVxuICAgIGZhY3RvciA9IGxlYXN0RmFjdG9yKG4pXG4gICAgZmFjdG9ycy5wdXNoIGZhY3RvclxuICAgIG4gLz0gZmFjdG9yXG4gIGZhY3RvcnMucHVzaCBuXG4gIHJldHVybiBmYWN0b3JzXG5cbmxhcmdlc3RQcmltZUZhY3RvciA9IChuKSAtPlxuICByZXR1cm4gMSBpZiBuID09IDFcblxuICB3aGlsZSBub3QgaXNQcmltZShuKVxuICAgIGZhY3RvciA9IGxlYXN0RmFjdG9yKG4pXG4gICAgbiAvPSBmYWN0b3JcbiAgcmV0dXJuIG5cblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICByZXR1cm4gbGFyZ2VzdFByaW1lRmFjdG9yKDYwMDg1MTQ3NTE0MylcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDQ6IExhcmdlc3QgcGFsaW5kcm9tZSBwcm9kdWN0XG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbkEgcGFsaW5kcm9taWMgbnVtYmVyIHJlYWRzIHRoZSBzYW1lIGJvdGggd2F5cy5cblxuRmluZCB0aGUgbGFyZ2VzdCBwYWxpbmRyb21lIG1hZGUgZnJvbSB0aGUgcHJvZHVjdCBvZiB0d28gMy1kaWdpdCBudW1iZXJzLlxuXG5cIlwiXCJcblxuaXNQYWxpbmRyb21lID0gKG4pIC0+XG4gIHN0ciA9IG4udG9TdHJpbmcoKVxuICBmb3IgaSBpbiBbMC4uLihzdHIubGVuZ3RoIC8gMildXG4gICAgaWYgc3RyW2ldICE9IHN0cltzdHIubGVuZ3RoIC0gMSAtIGldXG4gICAgICByZXR1cm4gZmFsc2VcbiAgcmV0dXJuIHRydWVcblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgIyBNYWtlIHN1cmUgaXNQYWxpbmRyb21lIHdvcmtzIHByb3Blcmx5IGZpcnN0XG4gIGZvciB2IGluIFsxLCAxMSwgMTIxLCAxMjIxLCAxMjMyMSwgMTIzNDMyMV1cbiAgICBlcXVhbChpc1BhbGluZHJvbWUodiksIHRydWUsIFwiaXNQYWxpbmRyb21lKCN7dn0pIHJldHVybnMgdHJ1ZVwiKVxuICBmb3IgdiBpbiBbMTIsIDEyMywgMTIzNCwgMTIzNDUsIDEyMzQ1NiwgMTIzMjRdXG4gICAgZXF1YWwoaXNQYWxpbmRyb21lKHYpLCBmYWxzZSwgXCJpc1BhbGluZHJvbWUoI3t2fSkgcmV0dXJucyBmYWxzZVwiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIGxhcmdlc3RpID0gMFxuICBsYXJnZXN0aiA9IDBcbiAgbGFyZ2VzdHAgPSAwXG5cbiAgZm9yIGkgaW4gWzEwMC4uOTk5XVxuICAgIGZvciBqIGluIFsxMDAuLjk5OV1cbiAgICAgIHByb2R1Y3QgPSBpICogalxuICAgICAgaWYgaXNQYWxpbmRyb21lKHByb2R1Y3QpXG4gICAgICAgIGxhcmdlc3RpID0gaVxuICAgICAgICBsYXJnZXN0aiA9IGpcbiAgICAgICAgbGFyZ2VzdHAgPSBwcm9kdWN0XG5cbiAgcmV0dXJuIGxhcmdlc3RwXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSA1OiBTbWFsbGVzdCBtdWx0aXBsZVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4yNTIwIGlzIHRoZSBzbWFsbGVzdCBudW1iZXIgdGhhdCBjYW4gYmUgZGl2aWRlZCBieSBlYWNoIG9mIHRoZSBudW1iZXJzIGZyb20gMSB0byAxMCB3aXRob3V0IGFueSByZW1haW5kZXIuXG5cbldoYXQgaXMgdGhlIHNtYWxsZXN0IHBvc2l0aXZlIG51bWJlciB0aGF0IGlzIGV2ZW5seSBkaXZpc2libGUgYnkgYWxsIG9mIHRoZSBudW1iZXJzIGZyb20gMSB0byAyMD9cblxuXCJcIlwiXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgbiA9IDBcbiAgbG9vcFxuICAgIG4gKz0gMjAgIyBQcm9iYWJseSBjb3VsZCBiZSBzb21lIGNsZXZlciBzdW0gb2YgcHJpbWVzIGJldHdlZW4gMS0yMCBvciBzb21ldGhpbmcuIEkgZG9uJ3QgY2FyZS5cbiAgICBmb3VuZCA9IHRydWVcbiAgICBmb3IgaSBpbiBbMS4uMjBdXG4gICAgICBpZiAobiAlIGkpICE9IDBcbiAgICAgICAgZm91bmQgPSBmYWxzZVxuICAgICAgICBicmVha1xuXG4gICAgYnJlYWsgaWYgZm91bmRcblxuICByZXR1cm4gblxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gNjogU3VtIHNxdWFyZSBkaWZmZXJlbmNlXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5UaGUgc3VtIG9mIHRoZSBzcXVhcmVzIG9mIHRoZSBmaXJzdCB0ZW4gbmF0dXJhbCBudW1iZXJzIGlzLFxuXG4gICAgICAgICAgICAgMV4yICsgMl4yICsgLi4uICsgMTBeMiA9IDM4NVxuXG5UaGUgc3F1YXJlIG9mIHRoZSBzdW0gb2YgdGhlIGZpcnN0IHRlbiBuYXR1cmFsIG51bWJlcnMgaXMsXG5cbiAgICAgICAgICAoMSArIDIgKyAuLi4gKyAxMCleMiA9IDU1XjIgPSAzMDI1XG5cbkhlbmNlIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIHN1bSBvZiB0aGUgc3F1YXJlcyBvZiB0aGUgZmlyc3QgdGVuIG5hdHVyYWwgbnVtYmVycyBhbmQgdGhlIHNxdWFyZSBvZiB0aGUgc3VtIGlzIDMwMjUg4oiSIDM4NSA9IDI2NDAuXG5cbkZpbmQgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUgc3VtIG9mIHRoZSBzcXVhcmVzIG9mIHRoZSBmaXJzdCBvbmUgaHVuZHJlZCBuYXR1cmFsIG51bWJlcnMgYW5kIHRoZSBzcXVhcmUgb2YgdGhlIHN1bS5cblxuXCJcIlwiXG5cbnN1bU9mU3F1YXJlcyA9IChuKSAtPlxuICBzdW0gPSAwXG4gIGZvciBpIGluIFsxLi5uXVxuICAgIHN1bSArPSAoaSAqIGkpXG4gIHJldHVybiBzdW1cblxuc3F1YXJlT2ZTdW0gPSAobikgLT5cbiAgc3VtID0gMFxuICBmb3IgaSBpbiBbMS4ubl1cbiAgICBzdW0gKz0gaVxuICByZXR1cm4gKHN1bSAqIHN1bSlcblxuZGlmZmVyZW5jZVN1bVNxdWFyZXMgPSAobikgLT5cbiAgcmV0dXJuIHNxdWFyZU9mU3VtKG4pIC0gc3VtT2ZTcXVhcmVzKG4pXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGVxdWFsKHN1bU9mU3F1YXJlcygxMCksIDM4NSwgXCJTdW0gb2Ygc3F1YXJlcyBvZiBmaXJzdCB0ZW4gbmF0dXJhbCBudW1iZXJzIGlzIDM4NVwiKVxuICBlcXVhbChzcXVhcmVPZlN1bSgxMCksIDMwMjUsIFwiU3F1YXJlIG9mIHN1bSBvZiBmaXJzdCB0ZW4gbmF0dXJhbCBudW1iZXJzIGlzIDMwMjVcIilcbiAgZXF1YWwoZGlmZmVyZW5jZVN1bVNxdWFyZXMoMTApLCAyNjQwLCBcIkRpZmZlcmVuY2UgaW4gdmFsdWVzIGZvciB0aGUgZmlyc3QgdGVuIG5hdHVyYWwgbnVtYmVycyBpcyAyNjQwXCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgcmV0dXJuIGRpZmZlcmVuY2VTdW1TcXVhcmVzKDEwMClcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDc6IDEwMDAxc3QgcHJpbWVcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5CeSBsaXN0aW5nIHRoZSBmaXJzdCBzaXggcHJpbWUgbnVtYmVyczogMiwgMywgNSwgNywgMTEsIGFuZCAxMywgd2UgY2FuIHNlZSB0aGF0IHRoZSA2dGggcHJpbWUgaXMgMTMuXG5cbldoYXQgaXMgdGhlIDEwLDAwMXN0IHByaW1lIG51bWJlcj9cblxuXCJcIlwiXG5cbm1hdGggPSByZXF1aXJlIFwibWF0aFwiXG5cbm50aFByaW1lID0gKG4pIC0+XG4gIHNpZXZlID0gbmV3IG1hdGguSW5jcmVtZW50YWxTaWV2ZVxuICBmb3IgaSBpbiBbMS4uLm5dXG4gICAgc2lldmUubmV4dCgpXG4gIHJldHVybiBzaWV2ZS5uZXh0KClcblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgZXF1YWwobnRoUHJpbWUoNiksIDEzLCBcIjZ0aCBwcmltZSBpcyAxM1wiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHJldHVybiBudGhQcmltZSgxMDAwMSlcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDg6IExhcmdlc3QgcHJvZHVjdCBpbiBhIHNlcmllc1xuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuVGhlIGZvdXIgYWRqYWNlbnQgZGlnaXRzIGluIHRoZSAxMDAwLWRpZ2l0IG51bWJlciB0aGF0IGhhdmUgdGhlIGdyZWF0ZXN0IHByb2R1Y3QgYXJlIDkgeCA5IHggOCB4IDkgPSA1ODMyLlxuXG4gIDczMTY3MTc2NTMxMzMwNjI0OTE5MjI1MTE5Njc0NDI2NTc0NzQyMzU1MzQ5MTk0OTM0XG4gIDk2OTgzNTIwMzEyNzc0NTA2MzI2MjM5NTc4MzE4MDE2OTg0ODAxODY5NDc4ODUxODQzXG4gIDg1ODYxNTYwNzg5MTEyOTQ5NDk1NDU5NTAxNzM3OTU4MzMxOTUyODUzMjA4ODA1NTExXG4gIDEyNTQwNjk4NzQ3MTU4NTIzODYzMDUwNzE1NjkzMjkwOTYzMjk1MjI3NDQzMDQzNTU3XG4gIDY2ODk2NjQ4OTUwNDQ1MjQ0NTIzMTYxNzMxODU2NDAzMDk4NzExMTIxNzIyMzgzMTEzXG4gIDYyMjI5ODkzNDIzMzgwMzA4MTM1MzM2Mjc2NjE0MjgyODA2NDQ0NDg2NjQ1MjM4NzQ5XG4gIDMwMzU4OTA3Mjk2MjkwNDkxNTYwNDQwNzcyMzkwNzEzODEwNTE1ODU5MzA3OTYwODY2XG4gIDcwMTcyNDI3MTIxODgzOTk4Nzk3OTA4NzkyMjc0OTIxOTAxNjk5NzIwODg4MDkzNzc2XG4gIDY1NzI3MzMzMDAxMDUzMzY3ODgxMjIwMjM1NDIxODA5NzUxMjU0NTQwNTk0NzUyMjQzXG4gIDUyNTg0OTA3NzExNjcwNTU2MDEzNjA0ODM5NTg2NDQ2NzA2MzI0NDE1NzIyMTU1Mzk3XG4gIDUzNjk3ODE3OTc3ODQ2MTc0MDY0OTU1MTQ5MjkwODYyNTY5MzIxOTc4NDY4NjIyNDgyXG4gIDgzOTcyMjQxMzc1NjU3MDU2MDU3NDkwMjYxNDA3OTcyOTY4NjUyNDE0NTM1MTAwNDc0XG4gIDgyMTY2MzcwNDg0NDAzMTk5ODkwMDA4ODk1MjQzNDUwNjU4NTQxMjI3NTg4NjY2ODgxXG4gIDE2NDI3MTcxNDc5OTI0NDQyOTI4MjMwODYzNDY1Njc0ODEzOTE5MTIzMTYyODI0NTg2XG4gIDE3ODY2NDU4MzU5MTI0NTY2NTI5NDc2NTQ1NjgyODQ4OTEyODgzMTQyNjA3NjkwMDQyXG4gIDI0MjE5MDIyNjcxMDU1NjI2MzIxMTExMTA5MzcwNTQ0MjE3NTA2OTQxNjU4OTYwNDA4XG4gIDA3MTk4NDAzODUwOTYyNDU1NDQ0MzYyOTgxMjMwOTg3ODc5OTI3MjQ0Mjg0OTA5MTg4XG4gIDg0NTgwMTU2MTY2MDk3OTE5MTMzODc1NDk5MjAwNTI0MDYzNjg5OTEyNTYwNzE3NjA2XG4gIDA1ODg2MTE2NDY3MTA5NDA1MDc3NTQxMDAyMjU2OTgzMTU1MjAwMDU1OTM1NzI5NzI1XG4gIDcxNjM2MjY5NTYxODgyNjcwNDI4MjUyNDgzNjAwODIzMjU3NTMwNDIwNzUyOTYzNDUwXG5cbkZpbmQgdGhlIHRoaXJ0ZWVuIGFkamFjZW50IGRpZ2l0cyBpbiB0aGUgMTAwMC1kaWdpdCBudW1iZXIgdGhhdCBoYXZlIHRoZSBncmVhdGVzdCBwcm9kdWN0LiBXaGF0IGlzIHRoZSB2YWx1ZSBvZiB0aGlzIHByb2R1Y3Q/XG5cblwiXCJcIlxuXG5zdHIgPSBcIlwiXCJcbiAgICAgIDczMTY3MTc2NTMxMzMwNjI0OTE5MjI1MTE5Njc0NDI2NTc0NzQyMzU1MzQ5MTk0OTM0XG4gICAgICA5Njk4MzUyMDMxMjc3NDUwNjMyNjIzOTU3ODMxODAxNjk4NDgwMTg2OTQ3ODg1MTg0M1xuICAgICAgODU4NjE1NjA3ODkxMTI5NDk0OTU0NTk1MDE3Mzc5NTgzMzE5NTI4NTMyMDg4MDU1MTFcbiAgICAgIDEyNTQwNjk4NzQ3MTU4NTIzODYzMDUwNzE1NjkzMjkwOTYzMjk1MjI3NDQzMDQzNTU3XG4gICAgICA2Njg5NjY0ODk1MDQ0NTI0NDUyMzE2MTczMTg1NjQwMzA5ODcxMTEyMTcyMjM4MzExM1xuICAgICAgNjIyMjk4OTM0MjMzODAzMDgxMzUzMzYyNzY2MTQyODI4MDY0NDQ0ODY2NDUyMzg3NDlcbiAgICAgIDMwMzU4OTA3Mjk2MjkwNDkxNTYwNDQwNzcyMzkwNzEzODEwNTE1ODU5MzA3OTYwODY2XG4gICAgICA3MDE3MjQyNzEyMTg4Mzk5ODc5NzkwODc5MjI3NDkyMTkwMTY5OTcyMDg4ODA5Mzc3NlxuICAgICAgNjU3MjczMzMwMDEwNTMzNjc4ODEyMjAyMzU0MjE4MDk3NTEyNTQ1NDA1OTQ3NTIyNDNcbiAgICAgIDUyNTg0OTA3NzExNjcwNTU2MDEzNjA0ODM5NTg2NDQ2NzA2MzI0NDE1NzIyMTU1Mzk3XG4gICAgICA1MzY5NzgxNzk3Nzg0NjE3NDA2NDk1NTE0OTI5MDg2MjU2OTMyMTk3ODQ2ODYyMjQ4MlxuICAgICAgODM5NzIyNDEzNzU2NTcwNTYwNTc0OTAyNjE0MDc5NzI5Njg2NTI0MTQ1MzUxMDA0NzRcbiAgICAgIDgyMTY2MzcwNDg0NDAzMTk5ODkwMDA4ODk1MjQzNDUwNjU4NTQxMjI3NTg4NjY2ODgxXG4gICAgICAxNjQyNzE3MTQ3OTkyNDQ0MjkyODIzMDg2MzQ2NTY3NDgxMzkxOTEyMzE2MjgyNDU4NlxuICAgICAgMTc4NjY0NTgzNTkxMjQ1NjY1Mjk0NzY1NDU2ODI4NDg5MTI4ODMxNDI2MDc2OTAwNDJcbiAgICAgIDI0MjE5MDIyNjcxMDU1NjI2MzIxMTExMTA5MzcwNTQ0MjE3NTA2OTQxNjU4OTYwNDA4XG4gICAgICAwNzE5ODQwMzg1MDk2MjQ1NTQ0NDM2Mjk4MTIzMDk4Nzg3OTkyNzI0NDI4NDkwOTE4OFxuICAgICAgODQ1ODAxNTYxNjYwOTc5MTkxMzM4NzU0OTkyMDA1MjQwNjM2ODk5MTI1NjA3MTc2MDZcbiAgICAgIDA1ODg2MTE2NDY3MTA5NDA1MDc3NTQxMDAyMjU2OTgzMTU1MjAwMDU1OTM1NzI5NzI1XG4gICAgICA3MTYzNjI2OTU2MTg4MjY3MDQyODI1MjQ4MzYwMDgyMzI1NzUzMDQyMDc1Mjk2MzQ1MFxuICAgICAgXCJcIlwiXG5zdHIgPSBzdHIucmVwbGFjZSgvW14wLTldL2dtLCBcIlwiKVxuZGlnaXRzID0gKHBhcnNlSW50KGRpZ2l0KSBmb3IgZGlnaXQgaW4gc3RyKVxuXG5sYXJnZXN0UHJvZHVjdCA9IChkaWdpdENvdW50KSAtPlxuICByZXR1cm4gMCBpZiBkaWdpdENvdW50ID4gZGlnaXRzLmxlbmd0aFxuXG4gIGxhcmdlc3QgPSAwXG4gIGZvciBzdGFydCBpbiBbMC4uKGRpZ2l0cy5sZW5ndGggLSBkaWdpdENvdW50KV1cbiAgICBlbmQgPSBzdGFydCArIGRpZ2l0Q291bnRcbiAgICBwcm9kdWN0ID0gMVxuICAgIGZvciBpIGluIFtzdGFydC4uLmVuZF1cbiAgICAgIHByb2R1Y3QgKj0gZGlnaXRzW2ldXG4gICAgaWYgbGFyZ2VzdCA8IHByb2R1Y3RcbiAgICAgIGxhcmdlc3QgPSBwcm9kdWN0XG5cbiAgcmV0dXJuIGxhcmdlc3RcblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgZXF1YWwobGFyZ2VzdFByb2R1Y3QoNCksIDU4MzIsICBcIkdyZWF0ZXN0IHByb2R1Y3Qgb2YgNCBhZGphY2VudCBkaWdpdHMgaXMgNTgzMlwiKVxuICBlcXVhbChsYXJnZXN0UHJvZHVjdCg1KSwgNDA4MjQsIFwiR3JlYXRlc3QgcHJvZHVjdCBvZiA1IGFkamFjZW50IGRpZ2l0cyBpcyA0MDgyNFwiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHJldHVybiBsYXJnZXN0UHJvZHVjdCgxMylcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDk6IFNwZWNpYWwgUHl0aGFnb3JlYW4gdHJpcGxldFxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuQSBQeXRoYWdvcmVhbiB0cmlwbGV0IGlzIGEgc2V0IG9mIHRocmVlIG5hdHVyYWwgbnVtYmVycywgYSA8IGIgPCBjLCBmb3Igd2hpY2gsXG5cbiAgICBhXjIgKyBiXjIgPSBjXjJcblxuRm9yIGV4YW1wbGUsIDNeMiArIDReMiA9IDkgKyAxNiA9IDI1ID0gNV4yLlxuXG5UaGVyZSBleGlzdHMgZXhhY3RseSBvbmUgUHl0aGFnb3JlYW4gdHJpcGxldCBmb3Igd2hpY2ggYSArIGIgKyBjID0gMTAwMC5cblxuRmluZCB0aGUgcHJvZHVjdCBhYmMuXG5cblwiXCJcIlxuXG5pc1RyaXBsZXQgPSAoYSwgYiwgYykgLT5cbiAgcmV0dXJuICgoYSphKSArIChiKmIpKSA9PSAoYypjKVxuXG5maW5kRmlyc3RUcmlwbGV0ID0gKHN1bSkgLT5cbiAgZm9yIGEgaW4gWzEuLi4xMDAwXVxuICAgIGZvciBiIGluIFsxLi4uMTAwMF1cbiAgICAgIGMgPSAxMDAwIC0gYSAtIGJcbiAgICAgIGlmIGlzVHJpcGxldChhLCBiLCBjKVxuICAgICAgICByZXR1cm4gW2EsIGIsIGNdXG5cbiAgcmV0dXJuIGZhbHNlXG5cblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgZXF1YWwoaXNUcmlwbGV0KDMsIDQsIDUpLCB0cnVlLCBcIigzLDQsNSkgaXMgYSBQeXRoYWdvcmVhbiB0cmlwbGV0XCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgcmV0dXJuIGZpbmRGaXJzdFRyaXBsZXQoMTAwMClcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDEwOiBTdW1tYXRpb24gb2YgcHJpbWVzXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblRoZSBzdW0gb2YgdGhlIHByaW1lcyBiZWxvdyAxMCBpcyAyICsgMyArIDUgKyA3ID0gMTcuXG5cbkZpbmQgdGhlIHN1bSBvZiBhbGwgdGhlIHByaW1lcyBiZWxvdyB0d28gbWlsbGlvbi5cblxuXCJcIlwiXG5cbm1hdGggPSByZXF1aXJlIFwibWF0aFwiXG5cbnByaW1lU3VtID0gKGNlaWxpbmcpIC0+XG4gIHNpZXZlID0gbmV3IG1hdGguSW5jcmVtZW50YWxTaWV2ZVxuXG4gIHN1bSA9IDBcbiAgbG9vcFxuICAgIG4gPSBzaWV2ZS5uZXh0KClcbiAgICBpZiBuID49IGNlaWxpbmdcbiAgICAgIGJyZWFrXG4gICAgc3VtICs9IG5cblxuICByZXR1cm4gc3VtXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGVxdWFsKHByaW1lU3VtKDEwKSwgMTcsIFwiU3VtIG9mIHByaW1lcyBiZWxvdyAxMCBpcyAxN1wiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHJldHVybiBwcmltZVN1bSgyMDAwMDAwKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMTE6IExhcmdlc3QgcHJvZHVjdCBpbiBhIGdyaWRcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuSW4gdGhlIDIweDIwIGdyaWQgYmVsb3csIGZvdXIgbnVtYmVycyBhbG9uZyBhIGRpYWdvbmFsIGxpbmUgaGF2ZSBiZWVuIG1hcmtlZCBpbiByZWQuXG5cbiAgICAgICAgICAwOCAwMiAyMiA5NyAzOCAxNSAwMCA0MCAwMCA3NSAwNCAwNSAwNyA3OCA1MiAxMiA1MCA3NyA5MSAwOFxuICAgICAgICAgIDQ5IDQ5IDk5IDQwIDE3IDgxIDE4IDU3IDYwIDg3IDE3IDQwIDk4IDQzIDY5IDQ4IDA0IDU2IDYyIDAwXG4gICAgICAgICAgODEgNDkgMzEgNzMgNTUgNzkgMTQgMjkgOTMgNzEgNDAgNjcgNTMgODggMzAgMDMgNDkgMTMgMzYgNjVcbiAgICAgICAgICA1MiA3MCA5NSAyMyAwNCA2MCAxMSA0MiA2OSAyNCA2OCA1NiAwMSAzMiA1NiA3MSAzNyAwMiAzNiA5MVxuICAgICAgICAgIDIyIDMxIDE2IDcxIDUxIDY3IDYzIDg5IDQxIDkyIDM2IDU0IDIyIDQwIDQwIDI4IDY2IDMzIDEzIDgwXG4gICAgICAgICAgMjQgNDcgMzIgNjAgOTkgMDMgNDUgMDIgNDQgNzUgMzMgNTMgNzggMzYgODQgMjAgMzUgMTcgMTIgNTBcbiAgICAgICAgICAzMiA5OCA4MSAyOCA2NCAyMyA2NyAxMCAyNl8zOCA0MCA2NyA1OSA1NCA3MCA2NiAxOCAzOCA2NCA3MFxuICAgICAgICAgIDY3IDI2IDIwIDY4IDAyIDYyIDEyIDIwIDk1IDYzXzk0IDM5IDYzIDA4IDQwIDkxIDY2IDQ5IDk0IDIxXG4gICAgICAgICAgMjQgNTUgNTggMDUgNjYgNzMgOTkgMjYgOTcgMTcgNzhfNzggOTYgODMgMTQgODggMzQgODkgNjMgNzJcbiAgICAgICAgICAyMSAzNiAyMyAwOSA3NSAwMCA3NiA0NCAyMCA0NSAzNSAxNCAwMCA2MSAzMyA5NyAzNCAzMSAzMyA5NVxuICAgICAgICAgIDc4IDE3IDUzIDI4IDIyIDc1IDMxIDY3IDE1IDk0IDAzIDgwIDA0IDYyIDE2IDE0IDA5IDUzIDU2IDkyXG4gICAgICAgICAgMTYgMzkgMDUgNDIgOTYgMzUgMzEgNDcgNTUgNTggODggMjQgMDAgMTcgNTQgMjQgMzYgMjkgODUgNTdcbiAgICAgICAgICA4NiA1NiAwMCA0OCAzNSA3MSA4OSAwNyAwNSA0NCA0NCAzNyA0NCA2MCAyMSA1OCA1MSA1NCAxNyA1OFxuICAgICAgICAgIDE5IDgwIDgxIDY4IDA1IDk0IDQ3IDY5IDI4IDczIDkyIDEzIDg2IDUyIDE3IDc3IDA0IDg5IDU1IDQwXG4gICAgICAgICAgMDQgNTIgMDggODMgOTcgMzUgOTkgMTYgMDcgOTcgNTcgMzIgMTYgMjYgMjYgNzkgMzMgMjcgOTggNjZcbiAgICAgICAgICA4OCAzNiA2OCA4NyA1NyA2MiAyMCA3MiAwMyA0NiAzMyA2NyA0NiA1NSAxMiAzMiA2MyA5MyA1MyA2OVxuICAgICAgICAgIDA0IDQyIDE2IDczIDM4IDI1IDM5IDExIDI0IDk0IDcyIDE4IDA4IDQ2IDI5IDMyIDQwIDYyIDc2IDM2XG4gICAgICAgICAgMjAgNjkgMzYgNDEgNzIgMzAgMjMgODggMzQgNjIgOTkgNjkgODIgNjcgNTkgODUgNzQgMDQgMzYgMTZcbiAgICAgICAgICAyMCA3MyAzNSAyOSA3OCAzMSA5MCAwMSA3NCAzMSA0OSA3MSA0OCA4NiA4MSAxNiAyMyA1NyAwNSA1NFxuICAgICAgICAgIDAxIDcwIDU0IDcxIDgzIDUxIDU0IDY5IDE2IDkyIDMzIDQ4IDYxIDQzIDUyIDAxIDg5IDE5IDY3IDQ4XG5cblRoZSBwcm9kdWN0IG9mIHRoZXNlIG51bWJlcnMgaXMgMjYgeCA2MyB4IDc4IHggMTQgPSAxNzg4Njk2LlxuXG5XaGF0IGlzIHRoZSBncmVhdGVzdCBwcm9kdWN0IG9mIGZvdXIgYWRqYWNlbnQgbnVtYmVycyBpbiB0aGUgc2FtZSBkaXJlY3Rpb24gKHVwLCBkb3duLCBsZWZ0LCByaWdodCwgb3IgZGlhZ29uYWxseSkgaW4gdGhlIDIweDIwIGdyaWQ/XG5cblwiXCJcIlxuXG5ncmlkID0gbnVsbFxuXG5wcmVwYXJlR3JpZCA9IC0+XG4gIHJhd0RpZ2l0cyA9IFwiXCJcIlxuICAgIDA4IDAyIDIyIDk3IDM4IDE1IDAwIDQwIDAwIDc1IDA0IDA1IDA3IDc4IDUyIDEyIDUwIDc3IDkxIDA4XG4gICAgNDkgNDkgOTkgNDAgMTcgODEgMTggNTcgNjAgODcgMTcgNDAgOTggNDMgNjkgNDggMDQgNTYgNjIgMDBcbiAgICA4MSA0OSAzMSA3MyA1NSA3OSAxNCAyOSA5MyA3MSA0MCA2NyA1MyA4OCAzMCAwMyA0OSAxMyAzNiA2NVxuICAgIDUyIDcwIDk1IDIzIDA0IDYwIDExIDQyIDY5IDI0IDY4IDU2IDAxIDMyIDU2IDcxIDM3IDAyIDM2IDkxXG4gICAgMjIgMzEgMTYgNzEgNTEgNjcgNjMgODkgNDEgOTIgMzYgNTQgMjIgNDAgNDAgMjggNjYgMzMgMTMgODBcbiAgICAyNCA0NyAzMiA2MCA5OSAwMyA0NSAwMiA0NCA3NSAzMyA1MyA3OCAzNiA4NCAyMCAzNSAxNyAxMiA1MFxuICAgIDMyIDk4IDgxIDI4IDY0IDIzIDY3IDEwIDI2IDM4IDQwIDY3IDU5IDU0IDcwIDY2IDE4IDM4IDY0IDcwXG4gICAgNjcgMjYgMjAgNjggMDIgNjIgMTIgMjAgOTUgNjMgOTQgMzkgNjMgMDggNDAgOTEgNjYgNDkgOTQgMjFcbiAgICAyNCA1NSA1OCAwNSA2NiA3MyA5OSAyNiA5NyAxNyA3OCA3OCA5NiA4MyAxNCA4OCAzNCA4OSA2MyA3MlxuICAgIDIxIDM2IDIzIDA5IDc1IDAwIDc2IDQ0IDIwIDQ1IDM1IDE0IDAwIDYxIDMzIDk3IDM0IDMxIDMzIDk1XG4gICAgNzggMTcgNTMgMjggMjIgNzUgMzEgNjcgMTUgOTQgMDMgODAgMDQgNjIgMTYgMTQgMDkgNTMgNTYgOTJcbiAgICAxNiAzOSAwNSA0MiA5NiAzNSAzMSA0NyA1NSA1OCA4OCAyNCAwMCAxNyA1NCAyNCAzNiAyOSA4NSA1N1xuICAgIDg2IDU2IDAwIDQ4IDM1IDcxIDg5IDA3IDA1IDQ0IDQ0IDM3IDQ0IDYwIDIxIDU4IDUxIDU0IDE3IDU4XG4gICAgMTkgODAgODEgNjggMDUgOTQgNDcgNjkgMjggNzMgOTIgMTMgODYgNTIgMTcgNzcgMDQgODkgNTUgNDBcbiAgICAwNCA1MiAwOCA4MyA5NyAzNSA5OSAxNiAwNyA5NyA1NyAzMiAxNiAyNiAyNiA3OSAzMyAyNyA5OCA2NlxuICAgIDg4IDM2IDY4IDg3IDU3IDYyIDIwIDcyIDAzIDQ2IDMzIDY3IDQ2IDU1IDEyIDMyIDYzIDkzIDUzIDY5XG4gICAgMDQgNDIgMTYgNzMgMzggMjUgMzkgMTEgMjQgOTQgNzIgMTggMDggNDYgMjkgMzIgNDAgNjIgNzYgMzZcbiAgICAyMCA2OSAzNiA0MSA3MiAzMCAyMyA4OCAzNCA2MiA5OSA2OSA4MiA2NyA1OSA4NSA3NCAwNCAzNiAxNlxuICAgIDIwIDczIDM1IDI5IDc4IDMxIDkwIDAxIDc0IDMxIDQ5IDcxIDQ4IDg2IDgxIDE2IDIzIDU3IDA1IDU0XG4gICAgMDEgNzAgNTQgNzEgODMgNTEgNTQgNjkgMTYgOTIgMzMgNDggNjEgNDMgNTIgMDEgODkgMTkgNjcgNDhcbiAgXCJcIlwiLnJlcGxhY2UoL1teMC05IF0vZ20sIFwiIFwiKVxuXG4gIGRpZ2l0cyA9IChwYXJzZUludChkaWdpdCkgZm9yIGRpZ2l0IGluIHJhd0RpZ2l0cy5zcGxpdChcIiBcIikpXG4gIGdyaWQgPSBBcnJheSgyMClcbiAgZm9yIGkgaW4gWzAuLi4yMF1cbiAgICBncmlkW2ldID0gQXJyYXkoMjApXG5cbiAgaW5kZXggPSAwXG4gIGZvciBqIGluIFswLi4uMjBdXG4gICAgZm9yIGkgaW4gWzAuLi4yMF1cbiAgICAgIGdyaWRbaV1bal0gPSBkaWdpdHNbaW5kZXhdXG4gICAgICBpbmRleCsrXG5cbnByZXBhcmVHcmlkKClcblxuIyBHZXRzIGEgcHJvZHVjdCBvZiA0IHZhbHVlcyBzdGFydGluZyBhdCAoc3gsIHN5KSwgaGVhZGluZyBpbiB0aGUgZGlyZWN0aW9uIChkeCwgZHkpXG4jIFJldHVybnMgLTEgaWYgdGhlcmUgaXMgbm8gcm9vbSB0byBtYWtlIGEgc3RyaXBlIG9mIDQuXG5nZXRMaW5lUHJvZHVjdCA9IChzeCwgc3ksIGR4LCBkeSkgLT5cbiAgZXggPSBzeCArICg0ICogZHgpXG4gIHJldHVybiAtMSBpZiAoZXggPCAwKSBvciAoZXggPj0gMjApXG4gIGV5ID0gc3kgKyAoNCAqIGR5KVxuICByZXR1cm4gLTEgaWYgKGV5IDwgMCkgb3IgKGV5ID49IDIwKVxuXG4gIHggPSBzeFxuICB5ID0gc3lcbiAgcHJvZHVjdCA9IDFcbiAgZm9yIGkgaW4gWzAuLi40XVxuICAgIHByb2R1Y3QgKj0gZ3JpZFt4XVt5XVxuICAgIHggKz0gZHhcbiAgICB5ICs9IGR5XG5cbiAgcmV0dXJuIHByb2R1Y3RcblxuZ2V0TGluZSA9IChzeCwgc3ksIGR4LCBkeSkgLT5cbiAgZXggPSBzeCArICg0ICogZHgpXG4gIHJldHVybiBbXSBpZiAoZXggPCAwKSBvciAoZXggPj0gMjApXG4gIGV5ID0gc3kgKyAoNCAqIGR5KVxuICByZXR1cm4gW10gaWYgKGV5IDwgMCkgb3IgKGV5ID49IDIwKVxuXG4gIGxpbmUgPSBbXVxuXG4gIHggPSBzeFxuICB5ID0gc3lcbiAgZm9yIGkgaW4gWzAuLi40XVxuICAgIGxpbmUucHVzaCBncmlkW3hdW3ldXG4gICAgeCArPSBkeFxuICAgIHkgKz0gZHlcblxuICByZXR1cm4gbGluZVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICAjIEV4YW1wbGUgaXMgZGlhZ29uYWwgcmlnaHQvZG93biBmcm9tICg4LDYpXG4gIGVxdWFsKGdldExpbmVQcm9kdWN0KDgsIDYsIDEsIDEpLCAxNzg4Njk2LCBcIkRpYWdvbmFsIHZhbHVlIHNob3duIGluIGV4YW1wbGUgZXF1YWxzIDEsNzg4LDY5NlwiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIG1heCA9XG4gICAgcHJvZHVjdDogMVxuICAgIGk6IDBcbiAgICBqOiAwXG4gICAgZGlyOiBcInJpZ2h0XCJcblxuICBmb3IgaiBpbiBbMC4uLjIwXVxuICAgIGZvciBpIGluIFswLi4uMjBdXG4gICAgICBwID0gZ2V0TGluZVByb2R1Y3QoaSwgaiwgMSwgMClcbiAgICAgIGlmIG1heC5wcm9kdWN0IDwgcFxuICAgICAgICBtYXgucHJvZHVjdCA9IHBcbiAgICAgICAgbWF4LmkgPSBpXG4gICAgICAgIG1heC5qID0galxuICAgICAgICBtYXguZGlyID0gXCJyaWdodFwiXG4gICAgICBwID0gZ2V0TGluZVByb2R1Y3QoaSwgaiwgMCwgMSlcbiAgICAgIGlmIG1heC5wcm9kdWN0IDwgcFxuICAgICAgICBtYXgucHJvZHVjdCA9IHBcbiAgICAgICAgbWF4LmkgPSBpXG4gICAgICAgIG1heC5qID0galxuICAgICAgICBtYXguZGlyID0gXCJkb3duXCJcbiAgICAgIHAgPSBnZXRMaW5lUHJvZHVjdChpLCBqLCAxLCAxKVxuICAgICAgaWYgbWF4LnByb2R1Y3QgPCBwXG4gICAgICAgIG1heC5wcm9kdWN0ID0gcFxuICAgICAgICBtYXguaSA9IGlcbiAgICAgICAgbWF4LmogPSBqXG4gICAgICAgIG1heC5kaXIgPSBcImRpYWdvbmFsUlwiXG4gICAgICBwID0gZ2V0TGluZVByb2R1Y3QoaSwgaiwgLTEsIDEpXG4gICAgICBpZiBtYXgucHJvZHVjdCA8IHBcbiAgICAgICAgbWF4LnByb2R1Y3QgPSBwXG4gICAgICAgIG1heC5pID0gaVxuICAgICAgICBtYXguaiA9IGpcbiAgICAgICAgbWF4LmRpciA9IFwiZGlhZ29uYWxMXCJcblxuICByZXR1cm4gbWF4XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAxMjogSGlnaGx5IGRpdmlzaWJsZSB0cmlhbmd1bGFyIG51bWJlclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5UaGUgc2VxdWVuY2Ugb2YgdHJpYW5nbGUgbnVtYmVycyBpcyBnZW5lcmF0ZWQgYnkgYWRkaW5nIHRoZSBuYXR1cmFsIG51bWJlcnMuIFNvIHRoZSA3dGggdHJpYW5nbGUgbnVtYmVyIHdvdWxkIGJlXG5cbiAgICAgICAgICAgICAgICAgICAgICAxICsgMiArIDMgKyA0ICsgNSArIDYgKyA3ID0gMjguXG5cblRoZSBmaXJzdCB0ZW4gdGVybXMgd291bGQgYmU6XG5cbiAgICAgICAgICAgICAgICAgICAgICAxLCAzLCA2LCAxMCwgMTUsIDIxLCAyOCwgMzYsIDQ1LCA1NSwgLi4uXG5cbkxldCB1cyBsaXN0IHRoZSBmYWN0b3JzIG9mIHRoZSBmaXJzdCBzZXZlbiB0cmlhbmdsZSBudW1iZXJzOlxuXG4gMTogMVxuIDM6IDEsM1xuIDY6IDEsMiwzLDZcbjEwOiAxLDIsNSwxMFxuMTU6IDEsMyw1LDE1XG4yMTogMSwzLDcsMjFcbjI4OiAxLDIsNCw3LDE0LDI4XG5cbldlIGNhbiBzZWUgdGhhdCAyOCBpcyB0aGUgZmlyc3QgdHJpYW5nbGUgbnVtYmVyIHRvIGhhdmUgb3ZlciBmaXZlIGRpdmlzb3JzLlxuXG5XaGF0IGlzIHRoZSB2YWx1ZSBvZiB0aGUgZmlyc3QgdHJpYW5nbGUgbnVtYmVyIHRvIGhhdmUgb3ZlciBmaXZlIGh1bmRyZWQgZGl2aXNvcnM/XG5cblwiXCJcIlxuXG5tYXRoID0gcmVxdWlyZSBcIm1hdGhcIlxuXG4jIFRoaXMgZnVuY3Rpb24gZG9lcyBpdHMgYmVzdCB0byBsZXZlcmFnZSBSYW1hbnVqYW4ncyBcIlRhdSBmdW5jdGlvblwiLFxuIyB3aGljaCBpcyBzdXBwb3NlZCB0byBnaXZlIHRoZSBudW1iZXIgb2YgcG9zaXRpdmUgZGl2aXNvcnMuXG4jXG4jIFRoZSBpZGVhIGlzOlxuIyAqIEZvciBwcmltZXMsIFQocF5rKSA9IGsgKyAxXG4jICogRm9yIGFueSBudW1iZXJzIHdob3NlIEdDRCBpcyAxLCBUKG1uKSA9IFQobSkgKiBUKG4pXG4jXG4jIEkgYWxyZWFkeSBoYXZlIGEgbWV0aG9kIHRvIHByaW1lIGZhY3RvciBhIG51bWJlciwgc28gSSdsbCBsZXZlcmFnZVxuIyBldmVyeSBncm91cGluZyBvZiB0aGUgc2FtZSBwcmltZSBudW1iZXIgYXMgdGhlIGZpcnN0IGNhc2UsIGFuZFxuIyBtdWx0aXBseSB0aGVtIHRvZ2V0aGVyLlxuI1xuIyBFeGFtcGxlOiAyOFxuI1xuIyAyOCdzIHByaW1lIGZhY3RvcnMgYXJlIFsyLCAyLCA3XSwgb3IgKDJeMiArIDcpXG4jXG4jIEkgY2FuIGFzc3VtZSB0aGF0IHRoZSBHQ0QgYmV0d2VlbiBhbnkgb2YgdGhlIHByaW1lIHNldHMgaXMgZ29pbmcgdG8gYmUgMSBiZWNhdXNlIGR1aCxcbiMgd2hpY2ggbWVhbnMgdGhhdDpcbiNcbiMgVCgyOCkgPT0gVCgyXjIpICogVCg3KVxuI1xuIyBUKDJeMikgPT0gMiArIDEgPT0gM1xuIyBUKDdeMSkgPT0gMSArIDEgPT0gMlxuIyAzICogMiA9IDZcbiMgMjggaGFzIDYgZGl2aXNvcnMuXG4jXG4jIFlvdSdyZSBtYWQuXG5cbmRpdmlzb3JDb3VudCA9IChuKSAtPlxuICByZXR1cm4gMSBpZiBuID09IDFcblxuICBmYWN0b3JzID0gbWF0aC5wcmltZUZhY3RvcnMobilcbiAgY291bnQgPSAxXG4gIGxhc3RGYWN0b3IgPSAwXG4gIGV4cG9uZW50ID0gMVxuICBmb3IgZmFjdG9yIGluIGZhY3RvcnNcbiAgICBpZiBmYWN0b3IgPT0gbGFzdEZhY3RvclxuICAgICAgZXhwb25lbnQrK1xuICAgIGVsc2VcbiAgICAgIGlmIGxhc3RGYWN0b3IgIT0gMFxuICAgICAgICAgIGNvdW50ICo9IGV4cG9uZW50ICsgMVxuICAgICAgbGFzdEZhY3RvciA9IGZhY3RvclxuICAgICAgZXhwb25lbnQgPSAxXG5cbiAgaWYgbGFzdEZhY3RvciAhPSAwXG4gICAgICBjb3VudCAqPSBleHBvbmVudCArIDFcblxuICByZXR1cm4gY291bnRcblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgZXF1YWwoZGl2aXNvckNvdW50KCAxKSwgMSwgXCIgMSBoYXMgMSBkaXZpc29yc1wiKVxuICBlcXVhbChkaXZpc29yQ291bnQoIDMpLCAyLCBcIiAzIGhhcyAyIGRpdmlzb3JzXCIpXG4gIGVxdWFsKGRpdmlzb3JDb3VudCggNiksIDQsIFwiIDYgaGFzIDQgZGl2aXNvcnNcIilcbiAgZXF1YWwoZGl2aXNvckNvdW50KDEwKSwgNCwgXCIxMCBoYXMgNCBkaXZpc29yc1wiKVxuICBlcXVhbChkaXZpc29yQ291bnQoMTUpLCA0LCBcIjE1IGhhcyA0IGRpdmlzb3JzXCIpXG4gIGVxdWFsKGRpdmlzb3JDb3VudCgyMSksIDQsIFwiMjEgaGFzIDQgZGl2aXNvcnNcIilcbiAgZXF1YWwoZGl2aXNvckNvdW50KDI4KSwgNiwgXCIyOCBoYXMgNiBkaXZpc29yc1wiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIG4gPSAxXG4gIHN0ZXAgPSAyXG5cbiAgbG9vcFxuICAgIGNvdW50ID0gZGl2aXNvckNvdW50KG4pXG4gICAgaWYgY291bnQgPiA1MDBcbiAgICAgIHJldHVybiB7IG46IG4sIGNvdW50OiBjb3VudCB9XG5cbiAgICAjIG5leHQgdHJpYW5ndWxhciBudW1iZXJcbiAgICBuICs9IHN0ZXBcbiAgICBzdGVwKytcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDEzOiBMYXJnZSBzdW1cbi0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5Xb3JrIG91dCB0aGUgZmlyc3QgdGVuIGRpZ2l0cyBvZiB0aGUgc3VtIG9mIHRoZSBmb2xsb3dpbmcgb25lLWh1bmRyZWQgNTAtZGlnaXQgbnVtYmVycy5cblxuMzcxMDcyODc1MzM5MDIxMDI3OTg3OTc5OTgyMjA4Mzc1OTAyNDY1MTAxMzU3NDAyNTBcbjQ2Mzc2OTM3Njc3NDkwMDA5NzEyNjQ4MTI0ODk2OTcwMDc4MDUwNDE3MDE4MjYwNTM4XG43NDMyNDk4NjE5OTUyNDc0MTA1OTQ3NDIzMzMwOTUxMzA1ODEyMzcyNjYxNzMwOTYyOVxuOTE5NDIyMTMzNjM1NzQxNjE1NzI1MjI0MzA1NjMzMDE4MTEwNzI0MDYxNTQ5MDgyNTBcbjIzMDY3NTg4MjA3NTM5MzQ2MTcxMTcxOTgwMzEwNDIxMDQ3NTEzNzc4MDYzMjQ2Njc2XG44OTI2MTY3MDY5NjYyMzYzMzgyMDEzNjM3ODQxODM4MzY4NDE3ODczNDM2MTcyNjc1N1xuMjgxMTI4Nzk4MTI4NDk5Nzk0MDgwNjU0ODE5MzE1OTI2MjE2OTEyNzU4ODk4MzI3MzhcbjQ0Mjc0MjI4OTE3NDMyNTIwMzIxOTIzNTg5NDIyODc2Nzk2NDg3NjcwMjcyMTg5MzE4XG40NzQ1MTQ0NTczNjAwMTMwNjQzOTA5MTE2NzIxNjg1Njg0NDU4ODcxMTYwMzE1MzI3NlxuNzAzODY0ODYxMDU4NDMwMjU0Mzk5Mzk2MTk4Mjg5MTc1OTM2NjU2ODY3NTc5MzQ5NTFcbjYyMTc2NDU3MTQxODU2NTYwNjI5NTAyMTU3MjIzMTk2NTg2NzU1MDc5MzI0MTkzMzMxXG42NDkwNjM1MjQ2Mjc0MTkwNDkyOTEwMTQzMjQ0NTgxMzgyMjY2MzM0Nzk0NDc1ODE3OFxuOTI1NzU4Njc3MTgzMzcyMTc2NjE5NjM3NTE1OTA1NzkyMzk3MjgyNDU1OTg4Mzg0MDdcbjU4MjAzNTY1MzI1MzU5Mzk5MDA4NDAyNjMzNTY4OTQ4ODMwMTg5NDU4NjI4MjI3ODI4XG44MDE4MTE5OTM4NDgyNjI4MjAxNDI3ODE5NDEzOTk0MDU2NzU4NzE1MTE3MDA5NDM5MFxuMzUzOTg2NjQzNzI4MjcxMTI2NTM4Mjk5ODcyNDA3ODQ0NzMwNTMxOTAxMDQyOTM1ODZcbjg2NTE1NTA2MDA2Mjk1ODY0ODYxNTMyMDc1MjczMzcxOTU5MTkxNDIwNTE3MjU1ODI5XG43MTY5Mzg4ODcwNzcxNTQ2NjQ5OTExNTU5MzQ4NzYwMzUzMjkyMTcxNDk3MDA1NjkzOFxuNTQzNzAwNzA1NzY4MjY2ODQ2MjQ2MjE0OTU2NTAwNzY0NzE3ODcyOTQ0MzgzNzc2MDRcbjUzMjgyNjU0MTA4NzU2ODI4NDQzMTkxMTkwNjM0Njk0MDM3ODU1MjE3Nzc5Mjk1MTQ1XG4zNjEyMzI3MjUyNTAwMDI5NjA3MTA3NTA4MjU2MzgxNTY1NjcxMDg4NTI1ODM1MDcyMVxuNDU4NzY1NzYxNzI0MTA5NzY0NDczMzkxMTA2MDcyMTgyNjUyMzY4NzcyMjM2MzYwNDVcbjE3NDIzNzA2OTA1ODUxODYwNjYwNDQ4MjA3NjIxMjA5ODEzMjg3ODYwNzMzOTY5NDEyXG44MTE0MjY2MDQxODA4NjgzMDYxOTMyODQ2MDgxMTE5MTA2MTU1Njk0MDUxMjY4OTY5MlxuNTE5MzQzMjU0NTE3MjgzODg2NDE5MTgwNDcwNDkyOTMyMTUwNTg2NDI1NjMwNDk0ODNcbjYyNDY3MjIxNjQ4NDM1MDc2MjAxNzI3OTE4MDM5OTQ0NjkzMDA0NzMyOTU2MzQwNjkxXG4xNTczMjQ0NDM4NjkwODEyNTc5NDUxNDA4OTA1NzcwNjIyOTQyOTE5NzEwNzkyODIwOVxuNTUwMzc2ODc1MjU2Nzg3NzMwOTE4NjI1NDA3NDQ5Njk4NDQ1MDgzMzAzOTM2ODIxMjZcbjE4MzM2Mzg0ODI1MzMwMTU0Njg2MTk2MTI0MzQ4NzY3NjgxMjk3NTM0Mzc1OTQ2NTE1XG44MDM4NjI4NzU5Mjg3ODQ5MDIwMTUyMTY4NTU1NDgyODcxNzIwMTIxOTI1Nzc2Njk1NFxuNzgxODI4MzM3NTc5OTMxMDM2MTQ3NDAzNTY4NTY0NDkwOTU1MjcwOTc4NjQ3OTc1ODFcbjE2NzI2MzIwMTAwNDM2ODk3ODQyNTUzNTM5OTIwOTMxODM3NDQxNDk3ODA2ODYwOTg0XG40ODQwMzA5ODEyOTA3Nzc5MTc5OTA4ODIxODc5NTMyNzM2NDQ3NTY3NTU5MDg0ODAzMFxuODcwODY5ODc1NTEzOTI3MTE4NTQ1MTcwNzg1NDQxNjE4NTI0MjQzMjA2OTMxNTAzMzJcbjU5OTU5NDA2ODk1NzU2NTM2NzgyMTA3MDc0OTI2OTY2NTM3Njc2MzI2MjM1NDQ3MjEwXG42OTc5Mzk1MDY3OTY1MjY5NDc0MjU5NzcwOTczOTE2NjY5Mzc2MzA0MjYzMzk4NzA4NVxuNDEwNTI2ODQ3MDgyOTkwODUyMTEzOTk0MjczNjU3MzQxMTYxODI3NjAzMTUwMDEyNzFcbjY1Mzc4NjA3MzYxNTAxMDgwODU3MDA5MTQ5OTM5NTEyNTU3MDI4MTk4NzQ2MDA0Mzc1XG4zNTgyOTAzNTMxNzQzNDcxNzMyNjkzMjEyMzU3ODE1NDk4MjYyOTc0MjU1MjczNzMwN1xuOTQ5NTM3NTk3NjUxMDUzMDU5NDY5NjYwNjc2ODMxNTY1NzQzNzcxNjc0MDE4NzUyNzVcbjg4OTAyODAyNTcxNzMzMjI5NjE5MTc2NjY4NzEzODE5OTMxODExMDQ4NzcwMTkwMjcxXG4yNTI2NzY4MDI3NjA3ODAwMzAxMzY3ODY4MDk5MjUyNTQ2MzQwMTA2MTYzMjg2NjUyNlxuMzYyNzAyMTg1NDA0OTc3MDU1ODU2Mjk5NDY1ODA2MzYyMzc5OTMxNDA3NDYyNTU5NjJcbjI0MDc0NDg2OTA4MjMxMTc0OTc3NzkyMzY1NDY2MjU3MjQ2OTIzMzIyODEwOTE3MTQxXG45MTQzMDI4ODE5NzEwMzI4ODU5NzgwNjY2OTc2MDg5MjkzODYzODI4NTAyNTMzMzQwM1xuMzQ0MTMwNjU1NzgwMTYxMjc4MTU5MjE4MTUwMDU1NjE4Njg4MzY0Njg0MjAwOTA0NzBcbjIzMDUzMDgxMTcyODE2NDMwNDg3NjIzNzkxOTY5ODQyNDg3MjU1MDM2NjM4Nzg0NTgzXG4xMTQ4NzY5NjkzMjE1NDkwMjgxMDQyNDAyMDEzODMzNTEyNDQ2MjE4MTQ0MTc3MzQ3MFxuNjM3ODMyOTk0OTA2MzYyNTk2NjY0OTg1ODc2MTgyMjEyMjUyMjU1MTI0ODY3NjQ1MzNcbjY3NzIwMTg2OTcxNjk4NTQ0MzEyNDE5NTcyNDA5OTEzOTU5MDA4OTUyMzEwMDU4ODIyXG45NTU0ODI1NTMwMDI2MzUyMDc4MTUzMjI5Njc5NjI0OTQ4MTY0MTk1Mzg2ODIxODc3NFxuNzYwODUzMjcxMzIyODU3MjMxMTA0MjQ4MDM0NTYxMjQ4Njc2OTcwNjQ1MDc5OTUyMzZcbjM3Nzc0MjQyNTM1NDExMjkxNjg0Mjc2ODY1NTM4OTI2MjA1MDI0OTEwMzI2NTcyOTY3XG4yMzcwMTkxMzI3NTcyNTY3NTI4NTY1MzI0ODI1ODI2NTQ2MzA5MjIwNzA1ODU5NjUyMlxuMjk3OTg4NjAyNzIyNTgzMzE5MTMxMjYzNzUxNDczNDE5OTQ4ODk1MzQ3NjU3NDU1MDFcbjE4NDk1NzAxNDU0ODc5Mjg4OTg0ODU2ODI3NzI2MDc3NzEzNzIxNDAzNzk4ODc5NzE1XG4zODI5ODIwMzc4MzAzMTQ3MzUyNzcyMTU4MDM0ODE0NDUxMzQ5MTM3MzIyNjY1MTM4MVxuMzQ4Mjk1NDM4MjkxOTk5MTgxODAyNzg5MTY1MjI0MzEwMjczOTIyNTExMjI4Njk1MzlcbjQwOTU3OTUzMDY2NDA1MjMyNjMyNTM4MDQ0MTAwMDU5NjU0OTM5MTU5ODc5NTkzNjM1XG4yOTc0NjE1MjE4NTUwMjM3MTMwNzY0MjI1NTEyMTE4MzY5MzgwMzU4MDM4ODU4NDkwM1xuNDE2OTgxMTYyMjIwNzI5NzcxODYxNTgyMzY2Nzg0MjQ2ODkxNTc5OTM1MzI5NjE5MjJcbjYyNDY3OTU3MTk0NDAxMjY5MDQzODc3MTA3Mjc1MDQ4MTAyMzkwODk1NTIzNTk3NDU3XG4yMzE4OTcwNjc3MjU0NzkxNTA2MTUwNTUwNDk1MzkyMjk3OTUzMDkwMTEyOTk2NzUxOVxuODYxODgwODgyMjU4NzUzMTQ1Mjk1ODQwOTkyNTEyMDM4MjkwMDk0MDc3NzA3NzU2NzJcbjExMzA2NzM5NzA4MzA0NzI0NDgzODE2NTMzODczNTAyMzQwODQ1NjQ3MDU4MDc3MzA4XG44Mjk1OTE3NDc2NzE0MDM2MzE5ODAwODE4NzEyOTAxMTg3NTQ5MTMxMDU0NzEyNjU4MVxuOTc2MjMzMzEwNDQ4MTgzODYyNjk1MTU0NTYzMzQ5MjYzNjY1NzI4OTc1NjM0MDA1MDBcbjQyODQ2MjgwMTgzNTE3MDcwNTI3ODMxODM5NDI1ODgyMTQ1NTIxMjI3MjUxMjUwMzI3XG41NTEyMTYwMzU0Njk4MTIwMDU4MTc2MjE2NTIxMjgyNzY1Mjc1MTY5MTI5Njg5Nzc4OVxuMzIyMzgxOTU3MzQzMjkzMzk5NDY0Mzc1MDE5MDc4MzY5NDU3NjU4ODMzNTIzOTk4ODZcbjc1NTA2MTY0OTY1MTg0Nzc1MTgwNzM4MTY4ODM3ODYxMDkxNTI3MzU3OTI5NzAxMzM3XG42MjE3Nzg0Mjc1MjE5MjYyMzQwMTk0MjM5OTYzOTE2ODA0NDk4Mzk5MzE3MzMxMjczMVxuMzI5MjQxODU3MDcxNDczNDk1NjY5MTY2NzQ2ODc2MzQ2NjA5MTUwMzU5MTQ2Nzc1MDRcbjk5NTE4NjcxNDMwMjM1MjE5NjI4ODk0ODkwMTAyNDIzMzI1MTE2OTEzNjE5NjI2NjIyXG43MzI2NzQ2MDgwMDU5MTU0NzQ3MTgzMDc5ODM5Mjg2ODUzNTIwNjk0Njk0NDU0MDcyNFxuNzY4NDE4MjI1MjQ2NzQ0MTcxNjE1MTQwMzY0Mjc5ODIyNzMzNDgwNTU1NTYyMTQ4MThcbjk3MTQyNjE3OTEwMzQyNTk4NjQ3MjA0NTE2ODkzOTg5NDIyMTc5ODI2MDg4MDc2ODUyXG44Nzc4MzY0NjE4Mjc5OTM0NjMxMzc2Nzc1NDMwNzgwOTM2MzMzMzAxODk4MjY0MjA5MFxuMTA4NDg4MDI1MjE2NzQ2NzA4ODMyMTUxMjAxODU4ODM1NDMyMjM4MTI4NzY5NTI3ODZcbjcxMzI5NjEyNDc0NzgyNDY0NTM4NjM2OTkzMDA5MDQ5MzEwMzYzNjE5NzYzODc4MDM5XG42MjE4NDA3MzU3MjM5OTc5NDIyMzQwNjIzNTM5MzgwODMzOTY1MTMyNzQwODAxMTExNlxuNjY2Mjc4OTE5ODE0ODgwODc3OTc5NDE4NzY4NzYxNDQyMzAwMzA5ODQ0OTA4NTE0MTFcbjYwNjYxODI2MjkzNjgyODM2NzY0NzQ0Nzc5MjM5MTgwMzM1MTEwOTg5MDY5NzkwNzE0XG44NTc4Njk0NDA4OTU1Mjk5MDY1MzY0MDQ0NzQyNTU3NjA4MzY1OTk3NjY0NTc5NTA5NlxuNjYwMjQzOTY0MDk5MDUzODk2MDcxMjAxOTgyMTk5NzYwNDc1OTk0OTAxOTcyMzAyOTdcbjY0OTEzOTgyNjgwMDMyOTczMTU2MDM3MTIwMDQxMzc3OTAzNzg1NTY2MDg1MDg5MjUyXG4xNjczMDkzOTMxOTg3Mjc1MDI3NTQ2ODkwNjkwMzcwNzUzOTQxMzA0MjY1MjMxNTAxMVxuOTQ4MDkzNzcyNDUwNDg3OTUxNTA5NTQxMDA5MjE2NDU4NjM3NTQ3MTA1OTg0MzY3OTFcbjc4NjM5MTY3MDIxMTg3NDkyNDMxOTk1NzAwNjQxOTE3OTY5Nzc3NTk5MDI4MzAwNjk5XG4xNTM2ODcxMzcxMTkzNjYxNDk1MjgxMTMwNTg3NjM4MDI3ODQxMDc1NDQ0OTczMzA3OFxuNDA3ODk5MjMxMTU1MzU1NjI1NjExNDIzMjI0MjMyNTUwMzM2ODU0NDI0ODg5MTczNTNcbjQ0ODg5OTExNTAxNDQwNjQ4MDIwMzY5MDY4MDYzOTYwNjcyMzIyMTkzMjA0MTQ5NTM1XG40MTUwMzEyODg4MDMzOTUzNjA1MzI5OTM0MDM2ODAwNjk3NzcxMDY1MDU2NjYzMTk1NFxuODEyMzQ4ODA2NzMyMTAxNDY3MzkwNTg1Njg1NTc5MzQ1ODE0MDM2Mjc4MjI3MDMyODBcbjgyNjE2NTcwNzczOTQ4MzI3NTkyMjMyODQ1OTQxNzA2NTI1MDk0NTEyMzI1MjMwNjA4XG4yMjkxODgwMjA1ODc3NzMxOTcxOTgzOTQ1MDE4MDg4ODA3MjQyOTY2MTk4MDgxMTE5N1xuNzcxNTg1NDI1MDIwMTY1NDUwOTA0MTMyNDU4MDk3ODY4ODI3Nzg5NDg3MjE4NTk2MTdcbjcyMTA3ODM4NDM1MDY5MTg2MTU1NDM1NjYyODg0MDYyMjU3NDczNjkyMjg0NTA5NTE2XG4yMDg0OTYwMzk4MDEzNDAwMTcyMzkzMDY3MTY2NjgyMzU1NTI0NTI1MjgwNDYwOTcyMlxuNTM1MDM1MzQyMjY0NzI1MjQyNTA4NzQwNTQwNzU1OTE3ODk3ODEyNjQzMzAzMzE2OTBcblxuXCJcIlwiXG5cbm51bWJlcnMgPSBbXG4gIDM3MTA3Mjg3NTMzOTAyMTAyNzk4Nzk3OTk4MjIwODM3NTkwMjQ2NTEwMTM1NzQwMjUwXG4gIDQ2Mzc2OTM3Njc3NDkwMDA5NzEyNjQ4MTI0ODk2OTcwMDc4MDUwNDE3MDE4MjYwNTM4XG4gIDc0MzI0OTg2MTk5NTI0NzQxMDU5NDc0MjMzMzA5NTEzMDU4MTIzNzI2NjE3MzA5NjI5XG4gIDkxOTQyMjEzMzYzNTc0MTYxNTcyNTIyNDMwNTYzMzAxODExMDcyNDA2MTU0OTA4MjUwXG4gIDIzMDY3NTg4MjA3NTM5MzQ2MTcxMTcxOTgwMzEwNDIxMDQ3NTEzNzc4MDYzMjQ2Njc2XG4gIDg5MjYxNjcwNjk2NjIzNjMzODIwMTM2Mzc4NDE4MzgzNjg0MTc4NzM0MzYxNzI2NzU3XG4gIDI4MTEyODc5ODEyODQ5OTc5NDA4MDY1NDgxOTMxNTkyNjIxNjkxMjc1ODg5ODMyNzM4XG4gIDQ0Mjc0MjI4OTE3NDMyNTIwMzIxOTIzNTg5NDIyODc2Nzk2NDg3NjcwMjcyMTg5MzE4XG4gIDQ3NDUxNDQ1NzM2MDAxMzA2NDM5MDkxMTY3MjE2ODU2ODQ0NTg4NzExNjAzMTUzMjc2XG4gIDcwMzg2NDg2MTA1ODQzMDI1NDM5OTM5NjE5ODI4OTE3NTkzNjY1Njg2NzU3OTM0OTUxXG4gIDYyMTc2NDU3MTQxODU2NTYwNjI5NTAyMTU3MjIzMTk2NTg2NzU1MDc5MzI0MTkzMzMxXG4gIDY0OTA2MzUyNDYyNzQxOTA0OTI5MTAxNDMyNDQ1ODEzODIyNjYzMzQ3OTQ0NzU4MTc4XG4gIDkyNTc1ODY3NzE4MzM3MjE3NjYxOTYzNzUxNTkwNTc5MjM5NzI4MjQ1NTk4ODM4NDA3XG4gIDU4MjAzNTY1MzI1MzU5Mzk5MDA4NDAyNjMzNTY4OTQ4ODMwMTg5NDU4NjI4MjI3ODI4XG4gIDgwMTgxMTk5Mzg0ODI2MjgyMDE0Mjc4MTk0MTM5OTQwNTY3NTg3MTUxMTcwMDk0MzkwXG4gIDM1Mzk4NjY0MzcyODI3MTEyNjUzODI5OTg3MjQwNzg0NDczMDUzMTkwMTA0MjkzNTg2XG4gIDg2NTE1NTA2MDA2Mjk1ODY0ODYxNTMyMDc1MjczMzcxOTU5MTkxNDIwNTE3MjU1ODI5XG4gIDcxNjkzODg4NzA3NzE1NDY2NDk5MTE1NTkzNDg3NjAzNTMyOTIxNzE0OTcwMDU2OTM4XG4gIDU0MzcwMDcwNTc2ODI2Njg0NjI0NjIxNDk1NjUwMDc2NDcxNzg3Mjk0NDM4Mzc3NjA0XG4gIDUzMjgyNjU0MTA4NzU2ODI4NDQzMTkxMTkwNjM0Njk0MDM3ODU1MjE3Nzc5Mjk1MTQ1XG4gIDM2MTIzMjcyNTI1MDAwMjk2MDcxMDc1MDgyNTYzODE1NjU2NzEwODg1MjU4MzUwNzIxXG4gIDQ1ODc2NTc2MTcyNDEwOTc2NDQ3MzM5MTEwNjA3MjE4MjY1MjM2ODc3MjIzNjM2MDQ1XG4gIDE3NDIzNzA2OTA1ODUxODYwNjYwNDQ4MjA3NjIxMjA5ODEzMjg3ODYwNzMzOTY5NDEyXG4gIDgxMTQyNjYwNDE4MDg2ODMwNjE5MzI4NDYwODExMTkxMDYxNTU2OTQwNTEyNjg5NjkyXG4gIDUxOTM0MzI1NDUxNzI4Mzg4NjQxOTE4MDQ3MDQ5MjkzMjE1MDU4NjQyNTYzMDQ5NDgzXG4gIDYyNDY3MjIxNjQ4NDM1MDc2MjAxNzI3OTE4MDM5OTQ0NjkzMDA0NzMyOTU2MzQwNjkxXG4gIDE1NzMyNDQ0Mzg2OTA4MTI1Nzk0NTE0MDg5MDU3NzA2MjI5NDI5MTk3MTA3OTI4MjA5XG4gIDU1MDM3Njg3NTI1Njc4NzczMDkxODYyNTQwNzQ0OTY5ODQ0NTA4MzMwMzkzNjgyMTI2XG4gIDE4MzM2Mzg0ODI1MzMwMTU0Njg2MTk2MTI0MzQ4NzY3NjgxMjk3NTM0Mzc1OTQ2NTE1XG4gIDgwMzg2Mjg3NTkyODc4NDkwMjAxNTIxNjg1NTU0ODI4NzE3MjAxMjE5MjU3NzY2OTU0XG4gIDc4MTgyODMzNzU3OTkzMTAzNjE0NzQwMzU2ODU2NDQ5MDk1NTI3MDk3ODY0Nzk3NTgxXG4gIDE2NzI2MzIwMTAwNDM2ODk3ODQyNTUzNTM5OTIwOTMxODM3NDQxNDk3ODA2ODYwOTg0XG4gIDQ4NDAzMDk4MTI5MDc3NzkxNzk5MDg4MjE4Nzk1MzI3MzY0NDc1Njc1NTkwODQ4MDMwXG4gIDg3MDg2OTg3NTUxMzkyNzExODU0NTE3MDc4NTQ0MTYxODUyNDI0MzIwNjkzMTUwMzMyXG4gIDU5OTU5NDA2ODk1NzU2NTM2NzgyMTA3MDc0OTI2OTY2NTM3Njc2MzI2MjM1NDQ3MjEwXG4gIDY5NzkzOTUwNjc5NjUyNjk0NzQyNTk3NzA5NzM5MTY2NjkzNzYzMDQyNjMzOTg3MDg1XG4gIDQxMDUyNjg0NzA4Mjk5MDg1MjExMzk5NDI3MzY1NzM0MTE2MTgyNzYwMzE1MDAxMjcxXG4gIDY1Mzc4NjA3MzYxNTAxMDgwODU3MDA5MTQ5OTM5NTEyNTU3MDI4MTk4NzQ2MDA0Mzc1XG4gIDM1ODI5MDM1MzE3NDM0NzE3MzI2OTMyMTIzNTc4MTU0OTgyNjI5NzQyNTUyNzM3MzA3XG4gIDk0OTUzNzU5NzY1MTA1MzA1OTQ2OTY2MDY3NjgzMTU2NTc0Mzc3MTY3NDAxODc1Mjc1XG4gIDg4OTAyODAyNTcxNzMzMjI5NjE5MTc2NjY4NzEzODE5OTMxODExMDQ4NzcwMTkwMjcxXG4gIDI1MjY3NjgwMjc2MDc4MDAzMDEzNjc4NjgwOTkyNTI1NDYzNDAxMDYxNjMyODY2NTI2XG4gIDM2MjcwMjE4NTQwNDk3NzA1NTg1NjI5OTQ2NTgwNjM2MjM3OTkzMTQwNzQ2MjU1OTYyXG4gIDI0MDc0NDg2OTA4MjMxMTc0OTc3NzkyMzY1NDY2MjU3MjQ2OTIzMzIyODEwOTE3MTQxXG4gIDkxNDMwMjg4MTk3MTAzMjg4NTk3ODA2NjY5NzYwODkyOTM4NjM4Mjg1MDI1MzMzNDAzXG4gIDM0NDEzMDY1NTc4MDE2MTI3ODE1OTIxODE1MDA1NTYxODY4ODM2NDY4NDIwMDkwNDcwXG4gIDIzMDUzMDgxMTcyODE2NDMwNDg3NjIzNzkxOTY5ODQyNDg3MjU1MDM2NjM4Nzg0NTgzXG4gIDExNDg3Njk2OTMyMTU0OTAyODEwNDI0MDIwMTM4MzM1MTI0NDYyMTgxNDQxNzczNDcwXG4gIDYzNzgzMjk5NDkwNjM2MjU5NjY2NDk4NTg3NjE4MjIxMjI1MjI1NTEyNDg2NzY0NTMzXG4gIDY3NzIwMTg2OTcxNjk4NTQ0MzEyNDE5NTcyNDA5OTEzOTU5MDA4OTUyMzEwMDU4ODIyXG4gIDk1NTQ4MjU1MzAwMjYzNTIwNzgxNTMyMjk2Nzk2MjQ5NDgxNjQxOTUzODY4MjE4Nzc0XG4gIDc2MDg1MzI3MTMyMjg1NzIzMTEwNDI0ODAzNDU2MTI0ODY3Njk3MDY0NTA3OTk1MjM2XG4gIDM3Nzc0MjQyNTM1NDExMjkxNjg0Mjc2ODY1NTM4OTI2MjA1MDI0OTEwMzI2NTcyOTY3XG4gIDIzNzAxOTEzMjc1NzI1Njc1Mjg1NjUzMjQ4MjU4MjY1NDYzMDkyMjA3MDU4NTk2NTIyXG4gIDI5Nzk4ODYwMjcyMjU4MzMxOTEzMTI2Mzc1MTQ3MzQxOTk0ODg5NTM0NzY1NzQ1NTAxXG4gIDE4NDk1NzAxNDU0ODc5Mjg4OTg0ODU2ODI3NzI2MDc3NzEzNzIxNDAzNzk4ODc5NzE1XG4gIDM4Mjk4MjAzNzgzMDMxNDczNTI3NzIxNTgwMzQ4MTQ0NTEzNDkxMzczMjI2NjUxMzgxXG4gIDM0ODI5NTQzODI5MTk5OTE4MTgwMjc4OTE2NTIyNDMxMDI3MzkyMjUxMTIyODY5NTM5XG4gIDQwOTU3OTUzMDY2NDA1MjMyNjMyNTM4MDQ0MTAwMDU5NjU0OTM5MTU5ODc5NTkzNjM1XG4gIDI5NzQ2MTUyMTg1NTAyMzcxMzA3NjQyMjU1MTIxMTgzNjkzODAzNTgwMzg4NTg0OTAzXG4gIDQxNjk4MTE2MjIyMDcyOTc3MTg2MTU4MjM2Njc4NDI0Njg5MTU3OTkzNTMyOTYxOTIyXG4gIDYyNDY3OTU3MTk0NDAxMjY5MDQzODc3MTA3Mjc1MDQ4MTAyMzkwODk1NTIzNTk3NDU3XG4gIDIzMTg5NzA2NzcyNTQ3OTE1MDYxNTA1NTA0OTUzOTIyOTc5NTMwOTAxMTI5OTY3NTE5XG4gIDg2MTg4MDg4MjI1ODc1MzE0NTI5NTg0MDk5MjUxMjAzODI5MDA5NDA3NzcwNzc1NjcyXG4gIDExMzA2NzM5NzA4MzA0NzI0NDgzODE2NTMzODczNTAyMzQwODQ1NjQ3MDU4MDc3MzA4XG4gIDgyOTU5MTc0NzY3MTQwMzYzMTk4MDA4MTg3MTI5MDExODc1NDkxMzEwNTQ3MTI2NTgxXG4gIDk3NjIzMzMxMDQ0ODE4Mzg2MjY5NTE1NDU2MzM0OTI2MzY2NTcyODk3NTYzNDAwNTAwXG4gIDQyODQ2MjgwMTgzNTE3MDcwNTI3ODMxODM5NDI1ODgyMTQ1NTIxMjI3MjUxMjUwMzI3XG4gIDU1MTIxNjAzNTQ2OTgxMjAwNTgxNzYyMTY1MjEyODI3NjUyNzUxNjkxMjk2ODk3Nzg5XG4gIDMyMjM4MTk1NzM0MzI5MzM5OTQ2NDM3NTAxOTA3ODM2OTQ1NzY1ODgzMzUyMzk5ODg2XG4gIDc1NTA2MTY0OTY1MTg0Nzc1MTgwNzM4MTY4ODM3ODYxMDkxNTI3MzU3OTI5NzAxMzM3XG4gIDYyMTc3ODQyNzUyMTkyNjIzNDAxOTQyMzk5NjM5MTY4MDQ0OTgzOTkzMTczMzEyNzMxXG4gIDMyOTI0MTg1NzA3MTQ3MzQ5NTY2OTE2Njc0Njg3NjM0NjYwOTE1MDM1OTE0Njc3NTA0XG4gIDk5NTE4NjcxNDMwMjM1MjE5NjI4ODk0ODkwMTAyNDIzMzI1MTE2OTEzNjE5NjI2NjIyXG4gIDczMjY3NDYwODAwNTkxNTQ3NDcxODMwNzk4MzkyODY4NTM1MjA2OTQ2OTQ0NTQwNzI0XG4gIDc2ODQxODIyNTI0Njc0NDE3MTYxNTE0MDM2NDI3OTgyMjczMzQ4MDU1NTU2MjE0ODE4XG4gIDk3MTQyNjE3OTEwMzQyNTk4NjQ3MjA0NTE2ODkzOTg5NDIyMTc5ODI2MDg4MDc2ODUyXG4gIDg3NzgzNjQ2MTgyNzk5MzQ2MzEzNzY3NzU0MzA3ODA5MzYzMzMzMDE4OTgyNjQyMDkwXG4gIDEwODQ4ODAyNTIxNjc0NjcwODgzMjE1MTIwMTg1ODgzNTQzMjIzODEyODc2OTUyNzg2XG4gIDcxMzI5NjEyNDc0NzgyNDY0NTM4NjM2OTkzMDA5MDQ5MzEwMzYzNjE5NzYzODc4MDM5XG4gIDYyMTg0MDczNTcyMzk5Nzk0MjIzNDA2MjM1MzkzODA4MzM5NjUxMzI3NDA4MDExMTE2XG4gIDY2NjI3ODkxOTgxNDg4MDg3Nzk3OTQxODc2ODc2MTQ0MjMwMDMwOTg0NDkwODUxNDExXG4gIDYwNjYxODI2MjkzNjgyODM2NzY0NzQ0Nzc5MjM5MTgwMzM1MTEwOTg5MDY5NzkwNzE0XG4gIDg1Nzg2OTQ0MDg5NTUyOTkwNjUzNjQwNDQ3NDI1NTc2MDgzNjU5OTc2NjQ1Nzk1MDk2XG4gIDY2MDI0Mzk2NDA5OTA1Mzg5NjA3MTIwMTk4MjE5OTc2MDQ3NTk5NDkwMTk3MjMwMjk3XG4gIDY0OTEzOTgyNjgwMDMyOTczMTU2MDM3MTIwMDQxMzc3OTAzNzg1NTY2MDg1MDg5MjUyXG4gIDE2NzMwOTM5MzE5ODcyNzUwMjc1NDY4OTA2OTAzNzA3NTM5NDEzMDQyNjUyMzE1MDExXG4gIDk0ODA5Mzc3MjQ1MDQ4Nzk1MTUwOTU0MTAwOTIxNjQ1ODYzNzU0NzEwNTk4NDM2NzkxXG4gIDc4NjM5MTY3MDIxMTg3NDkyNDMxOTk1NzAwNjQxOTE3OTY5Nzc3NTk5MDI4MzAwNjk5XG4gIDE1MzY4NzEzNzExOTM2NjE0OTUyODExMzA1ODc2MzgwMjc4NDEwNzU0NDQ5NzMzMDc4XG4gIDQwNzg5OTIzMTE1NTM1NTYyNTYxMTQyMzIyNDIzMjU1MDMzNjg1NDQyNDg4OTE3MzUzXG4gIDQ0ODg5OTExNTAxNDQwNjQ4MDIwMzY5MDY4MDYzOTYwNjcyMzIyMTkzMjA0MTQ5NTM1XG4gIDQxNTAzMTI4ODgwMzM5NTM2MDUzMjk5MzQwMzY4MDA2OTc3NzEwNjUwNTY2NjMxOTU0XG4gIDgxMjM0ODgwNjczMjEwMTQ2NzM5MDU4NTY4NTU3OTM0NTgxNDAzNjI3ODIyNzAzMjgwXG4gIDgyNjE2NTcwNzczOTQ4MzI3NTkyMjMyODQ1OTQxNzA2NTI1MDk0NTEyMzI1MjMwNjA4XG4gIDIyOTE4ODAyMDU4Nzc3MzE5NzE5ODM5NDUwMTgwODg4MDcyNDI5NjYxOTgwODExMTk3XG4gIDc3MTU4NTQyNTAyMDE2NTQ1MDkwNDEzMjQ1ODA5Nzg2ODgyNzc4OTQ4NzIxODU5NjE3XG4gIDcyMTA3ODM4NDM1MDY5MTg2MTU1NDM1NjYyODg0MDYyMjU3NDczNjkyMjg0NTA5NTE2XG4gIDIwODQ5NjAzOTgwMTM0MDAxNzIzOTMwNjcxNjY2ODIzNTU1MjQ1MjUyODA0NjA5NzIyXG4gIDUzNTAzNTM0MjI2NDcyNTI0MjUwODc0MDU0MDc1NTkxNzg5NzgxMjY0MzMwMzMxNjkwXG5dXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgc3VtID0gMFxuICBmb3IgbiBpbiBudW1iZXJzXG4gICAgc3VtICs9IG5cblxuICBzdHIgPSBTdHJpbmcoc3VtKS5yZXBsYWNlKC9cXC4vZywgXCJcIikuc3Vic3RyKDAsIDEwKVxuICByZXR1cm4gc3RyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAxNDogTG9uZ2VzdCBDb2xsYXR6IHNlcXVlbmNlXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuVGhlIGZvbGxvd2luZyBpdGVyYXRpdmUgc2VxdWVuY2UgaXMgZGVmaW5lZCBmb3IgdGhlIHNldCBvZiBwb3NpdGl2ZSBpbnRlZ2VyczpcblxuICAgIG4gLT4gbi8yICAgIChuIGlzIGV2ZW4pXG4gICAgbiAtPiAzbiArIDEgKG4gaXMgb2RkKVxuXG5Vc2luZyB0aGUgcnVsZSBhYm92ZSBhbmQgc3RhcnRpbmcgd2l0aCAxMywgd2UgZ2VuZXJhdGUgdGhlIGZvbGxvd2luZyBzZXF1ZW5jZTpcblxuICAgIDEzIC0+IDQwIC0+IDIwIC0+IDEwIC0+IDUgLT4gMTYgLT4gOCAtPiA0IC0+IDIgLT4gMVxuXG5JdCBjYW4gYmUgc2VlbiB0aGF0IHRoaXMgc2VxdWVuY2UgKHN0YXJ0aW5nIGF0IDEzIGFuZCBmaW5pc2hpbmcgYXQgMSkgY29udGFpbnMgMTAgdGVybXMuIEFsdGhvdWdoIGl0IGhhcyBub3QgYmVlbiBwcm92ZWQgeWV0IChDb2xsYXR6IFByb2JsZW0pLCBpdCBpcyB0aG91Z2h0IHRoYXQgYWxsIHN0YXJ0aW5nIG51bWJlcnMgZmluaXNoIGF0IDEuXG5cbldoaWNoIHN0YXJ0aW5nIG51bWJlciwgdW5kZXIgb25lIG1pbGxpb24sIHByb2R1Y2VzIHRoZSBsb25nZXN0IGNoYWluP1xuXG5OT1RFOiBPbmNlIHRoZSBjaGFpbiBzdGFydHMgdGhlIHRlcm1zIGFyZSBhbGxvd2VkIHRvIGdvIGFib3ZlIG9uZSBtaWxsaW9uLlxuXG5cIlwiXCJcblxuY29sbGF0ekNhY2hlID0ge31cblxuY29sbGF0ekNoYWluTGVuZ3RoID0gKHN0YXJ0aW5nVmFsdWUpIC0+XG4gIG4gPSBzdGFydGluZ1ZhbHVlXG4gIHRvQmVDYWNoZWQgPSBbXVxuXG4gIGxvb3BcbiAgICBicmVhayBpZiBjb2xsYXR6Q2FjaGUuaGFzT3duUHJvcGVydHkobilcblxuICAgICMgcmVtZW1iZXIgdGhhdCB3ZSBmYWlsZWQgdG8gY2FjaGUgdGhpcyBlbnRyeVxuICAgIHRvQmVDYWNoZWQucHVzaChuKVxuXG4gICAgaWYgbiA9PSAxXG4gICAgICBicmVha1xuXG4gICAgaWYgKG4gJSAyKSA9PSAwXG4gICAgICBuID0gTWF0aC5mbG9vcihuIC8gMilcbiAgICBlbHNlXG4gICAgICBuID0gKG4gKiAzKSArIDFcblxuICAjIFNpbmNlIHdlIGxlZnQgYnJlYWRjcnVtYnMgZG93biB0aGUgdHJhaWwgb2YgdGhpbmdzIHdlIGhhdmVuJ3QgY2FjaGVkXG4gICMgd2FsayBiYWNrIGRvd24gdGhlIHRyYWlsIGFuZCBjYWNoZSBhbGwgdGhlIGVudHJpZXMgZm91bmQgYWxvbmcgdGhlIHdheVxuICBsZW4gPSB0b0JlQ2FjaGVkLmxlbmd0aFxuICBmb3IgdixpIGluIHRvQmVDYWNoZWRcbiAgICBjb2xsYXR6Q2FjaGVbdl0gPSBjb2xsYXR6Q2FjaGVbbl0gKyAobGVuIC0gaSlcblxuICByZXR1cm4gY29sbGF0ekNhY2hlW3N0YXJ0aW5nVmFsdWVdXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGNvbGxhdHpDYWNoZSA9IHsgXCIxXCI6IDEgfVxuICBlcXVhbChjb2xsYXR6Q2hhaW5MZW5ndGgoMTMpLCAxMCwgXCIxMyBoYXMgYSBjb2xsYXR6IGNoYWluIG9mIDEwXCIpXG4gIGVxdWFsKGNvbGxhdHpDaGFpbkxlbmd0aCgyNiksIDExLCBcIjI2IGhhcyBhIGNvbGxhdHogY2hhaW4gb2YgMTFcIilcbiAgZXF1YWwoY29sbGF0ekNoYWluTGVuZ3RoKCAxKSwgIDEsIFwiMSBoYXMgYSBjb2xsYXR6IGNoYWluIG9mIDFcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICBjb2xsYXR6Q2FjaGUgPSB7IFwiMVwiOiAxIH1cblxuICBtYXhDaGFpbiA9IDBcbiAgbWF4Q2hhaW5MZW5ndGggPSAwXG4gIGZvciBpIGluIFsxLi4uMTAwMDAwMF1cbiAgICBjaGFpbkxlbmd0aCA9IGNvbGxhdHpDaGFpbkxlbmd0aChpKVxuICAgIGlmIG1heENoYWluTGVuZ3RoIDwgY2hhaW5MZW5ndGhcbiAgICAgIG1heENoYWluTGVuZ3RoID0gY2hhaW5MZW5ndGhcbiAgICAgIG1heENoYWluID0gaVxuXG4gIHJldHVybiB7IGFuc3dlcjogbWF4Q2hhaW4sIGNoYWluTGVuZ3RoOiBtYXhDaGFpbkxlbmd0aCB9XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAxNTogTGF0dGljZSBwYXRoc1xuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5TdGFydGluZyBpbiB0aGUgdG9wIGxlZnQgY29ybmVyIG9mIGEgMsOXMiBncmlkLCBhbmQgb25seSBiZWluZyBhYmxlIHRvIG1vdmUgdG8gdGhlIHJpZ2h0IGFuZCBkb3duLCB0aGVyZSBhcmUgZXhhY3RseSA2IHJvdXRlcyB0byB0aGUgYm90dG9tIHJpZ2h0IGNvcm5lci5cblxuICAgIChwaWN0dXJlIHNob3dpbmcgNiBwYXRoczogUlJERCwgUkRSRCwgUkREUiwgRFJSRCwgRFJEUiwgRERSUilcblxuSG93IG1hbnkgc3VjaCByb3V0ZXMgYXJlIHRoZXJlIHRocm91Z2ggYSAyMMOXMjAgZ3JpZD9cblxuXCJcIlwiXG5cbm1hdGggPSByZXF1aXJlIFwibWF0aFwiXG5cbmxhdHRpY2UgPSAobikgLT5cbiAgcmV0dXJuIG1hdGgubkNyKG4gKiAyLCBuKVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChsYXR0aWNlKDEpLCAyLCBcIjF4MSBsYXR0aWNlIGhhcyAyIHBhdGhzXCIpXG4gIGVxdWFsKGxhdHRpY2UoMiksIDYsIFwiMngyIGxhdHRpY2UgaGFzIDYgcGF0aHNcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICByZXR1cm4gbGF0dGljZSgyMClcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDE2OiBQb3dlciBkaWdpdCBzdW1cbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4yXjE1ID0gMzI3NjggYW5kIHRoZSBzdW0gb2YgaXRzIGRpZ2l0cyBpcyAzICsgMiArIDcgKyA2ICsgOCA9IDI2LlxuXG5XaGF0IGlzIHRoZSBzdW0gb2YgdGhlIGRpZ2l0cyBvZiB0aGUgbnVtYmVyIDJeMTAwMD9cblxuXCJcIlwiXG5cbm1hdGggPSByZXF1aXJlIFwibWF0aFwiXG5iaWdJbnQgPSByZXF1aXJlIFwiYmlnLWludGVnZXJcIlxuXG5NQVhfRVhQT05FTlQgPSA1MFxuXG5wb3dlckRpZ2l0U3VtID0gKHgsIHkpIC0+XG4gIG51bWJlciA9IGJpZ0ludCgxKVxuICB3aGlsZSB5ICE9IDBcbiAgICBleHBvbmVudCA9IHlcbiAgICBpZiBleHBvbmVudCA+IE1BWF9FWFBPTkVOVFxuICAgICAgZXhwb25lbnQgPSBNQVhfRVhQT05FTlRcbiAgICB5IC09IGV4cG9uZW50XG4gICAgbnVtYmVyID0gbnVtYmVyLm11bHRpcGx5IE1hdGguZmxvb3IoTWF0aC5wb3coeCwgZXhwb25lbnQpKVxuICBkaWdpdHMgPSBTdHJpbmcobnVtYmVyKVxuXG4gIHN1bSA9IDBcbiAgZm9yIGQgaW4gZGlnaXRzXG4gICAgc3VtICs9IHBhcnNlSW50KGQpXG4gIHJldHVybiBzdW1cblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgZXF1YWwocG93ZXJEaWdpdFN1bSgyLCAxNSksIDI2LCBcInN1bSBvZiBkaWdpdHMgb2YgMl4xNSBpcyAyNlwiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHJldHVybiBwb3dlckRpZ2l0U3VtKDIsIDEwMDApXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAxNzogTnVtYmVyIGxldHRlciBjb3VudHNcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbklmIHRoZSBudW1iZXJzIDEgdG8gNSBhcmUgd3JpdHRlbiBvdXQgaW4gd29yZHM6IG9uZSwgdHdvLCB0aHJlZSwgZm91ciwgZml2ZSwgdGhlbiB0aGVyZSBhcmUgMyArIDMgKyA1ICsgNCArIDQgPSAxOSBsZXR0ZXJzIHVzZWQgaW4gdG90YWwuXG5cbklmIGFsbCB0aGUgbnVtYmVycyBmcm9tIDEgdG8gMTAwMCAob25lIHRob3VzYW5kKSBpbmNsdXNpdmUgd2VyZSB3cml0dGVuIG91dCBpbiB3b3JkcywgaG93IG1hbnkgbGV0dGVycyB3b3VsZCBiZSB1c2VkP1xuXG5OT1RFOiBEbyBub3QgY291bnQgc3BhY2VzIG9yIGh5cGhlbnMuIEZvciBleGFtcGxlLCAzNDIgKHRocmVlIGh1bmRyZWQgYW5kIGZvcnR5LXR3bykgY29udGFpbnMgMjMgbGV0dGVycyBhbmQgMTE1IChvbmUgaHVuZHJlZCBhbmQgZmlmdGVlbikgY29udGFpbnMgMjAgbGV0dGVycy4gVGhlIHVzZSBvZiBcImFuZFwiIHdoZW4gd3JpdGluZyBvdXQgbnVtYmVycyBpcyBpbiBjb21wbGlhbmNlIHdpdGggQnJpdGlzaCB1c2FnZS5cblxuXCJcIlwiXG5cbm5hbWVzID1cbiAgb25lczogXCJ6ZXJvIG9uZSB0d28gdGhyZWUgZm91ciBmaXZlIHNpeCBzZXZlbiBlaWdodCBuaW5lIHRlbiBlbGV2ZW4gdHdlbHZlIHRoaXJ0ZWVuIGZvdXJ0ZWVuIGZpZnRlZW4gc2l4dGVlbiBzZXZlbnRlZW4gZWlnaHRlZW4gbmluZXRlZW5cIi5zcGxpdCgvXFxzKy8pXG4gIHRlbnM6IFwiXyBfIHR3ZW50eSB0aGlydHkgZm9ydHkgZmlmdHkgc2l4dHkgc2V2ZW50eSBlaWdodHkgbmluZXR5XCIuc3BsaXQoL1xccysvKVxuXG4jIHN1cHBvcnRzIDAtOTk5OVxubnVtYmVyTGV0dGVyQ291bnQgPSAobnVtKSAtPlxuICBuID0gbnVtXG4gIG5hbWUgPSBcIlwiXG5cbiAgaWYgbiA+PSAxMDAwXG4gICAgdGhvdXNhbmRzID0gTWF0aC5mbG9vcihuIC8gMTAwMClcbiAgICBuID0gbiAlIDEwMDBcbiAgICBuYW1lICs9IFwiI3tuYW1lcy5vbmVzW3Rob3VzYW5kc119IHRob3VzYW5kIFwiXG5cbiAgaWYgbiA+PSAxMDBcbiAgICBodW5kcmVkcyA9IE1hdGguZmxvb3IobiAvIDEwMClcbiAgICBuID0gbiAlIDEwMFxuICAgIG5hbWUgKz0gXCIje25hbWVzLm9uZXNbaHVuZHJlZHNdfSBodW5kcmVkIFwiXG5cbiAgaWYgKG4gPiAwKSBhbmQgKG5hbWUubGVuZ3RoID4gMClcbiAgICBuYW1lICs9IFwiYW5kIFwiXG5cbiAgaWYgbiA+PSAyMFxuICAgIHRlbnMgPSBNYXRoLmZsb29yKG4gLyAxMClcbiAgICBuID0gbiAlIDEwXG4gICAgbmFtZSArPSBcIiN7bmFtZXMudGVuc1t0ZW5zXX0gXCJcblxuICBpZiBuID4gMFxuICAgIG5hbWUgKz0gXCIje25hbWVzLm9uZXNbbl19IFwiXG5cbiAgbGV0dGVyc09ubHkgPSBuYW1lLnJlcGxhY2UoL1teYS16XS9nLCBcIlwiKVxuICAjIGNvbnNvbGUubG9nIFwibnVtOiAje251bX0sIG5hbWU6ICN7bmFtZX0sIGxldHRlcnNPbmx5OiAje2xldHRlcnNPbmx5fVwiXG4gIHJldHVybiBsZXR0ZXJzT25seS5sZW5ndGhcblxubnVtYmVyTGV0dGVyQ291bnRSYW5nZSA9IChhLCBiKSAtPlxuICBzdW0gPSAwXG4gIGZvciBpIGluIFthLi5iXVxuICAgIHN1bSArPSBudW1iZXJMZXR0ZXJDb3VudChpKVxuICByZXR1cm4gc3VtXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGVxdWFsKG51bWJlckxldHRlckNvdW50UmFuZ2UoMSwgNSksIDE5LCBcInN1bSBvZiBsZW5ndGhzIG9mIG51bWJlcnMgMS01IGlzIDE5XCIpXG4gIGVxdWFsKG51bWJlckxldHRlckNvdW50KDM0MiksIDIzLCBcImxlbmd0aCBvZiBuYW1lIG9mIDM0MiBpcyAyM1wiKVxuICBlcXVhbChudW1iZXJMZXR0ZXJDb3VudCgxMTUpLCAyMCwgXCJsZW5ndGggb2YgbmFtZSBvZiAxMTUgaXMgMjBcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICByZXR1cm4gbnVtYmVyTGV0dGVyQ291bnRSYW5nZSgxLCAxMDAwKVxuIiwicm9vdCA9IGV4cG9ydHMgPyB0aGlzXG5cbiMgU2lldmUgd2FzIGJsaW5kbHkgdGFrZW4vYWRhcHRlZCBmcm9tIFJvc2V0dGFDb2RlLiBET05UIEVWRU4gQ0FSRVxuY2xhc3MgSW5jcmVtZW50YWxTaWV2ZVxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAbiA9IDBcblxuICBuZXh0OiAtPlxuICAgIEBuICs9IDJcbiAgICBpZiBAbiA8IDdcbiAgICAgIGlmIEBuIDwgM1xuICAgICAgICBAbiA9IDFcbiAgICAgICAgcmV0dXJuIDJcbiAgICAgIGlmIEBuIDwgNVxuICAgICAgICByZXR1cm4gM1xuICAgICAgQGRpY3QgPSB7fVxuICAgICAgQGJwcyA9IG5ldyBJbmNyZW1lbnRhbFNpZXZlKClcbiAgICAgIEBicHMubmV4dCgpXG4gICAgICBAcCA9IEBicHMubmV4dCgpXG4gICAgICBAcSA9IEBwICogQHBcbiAgICAgIHJldHVybiA1XG4gICAgZWxzZVxuICAgICAgcyA9IEBkaWN0W0BuXVxuICAgICAgaWYgbm90IHNcbiAgICAgICAgaWYgQG4gPCBAcVxuICAgICAgICAgIHJldHVybiBAblxuICAgICAgICBlbHNlXG4gICAgICAgICAgcDIgPSBAcCA8PCAxXG4gICAgICAgICAgQGRpY3RbQG4gKyBwMl0gPSBwMlxuICAgICAgICAgIEBwID0gQGJwcy5uZXh0KClcbiAgICAgICAgICBAcSA9IEBwICogQHBcbiAgICAgICAgICByZXR1cm4gQG5leHQoKVxuICAgICAgZWxzZVxuICAgICAgICBkZWxldGUgQGRpY3RbQG5dXG4gICAgICAgIG54dCA9IEBuICsgc1xuICAgICAgICB3aGlsZSAoQGRpY3Rbbnh0XSlcbiAgICAgICAgICBueHQgKz0gc1xuICAgICAgICBAZGljdFtueHRdID0gc1xuICAgICAgICByZXR1cm4gQG5leHQoKVxuXG5yb290LkluY3JlbWVudGFsU2lldmUgPSBJbmNyZW1lbnRhbFNpZXZlXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgU2hhbWVsZXNzbHkgcGlsZmVyZWQvYWRvcHRlZCBmcm9tIGh0dHA6Ly93d3cuamF2YXNjcmlwdGVyLm5ldC9mYXEvbnVtYmVyaXNwcmltZS5odG1cblxucm9vdC5sZWFzdEZhY3RvciA9IChuKSAtPlxuICByZXR1cm4gTmFOIGlmIGlzTmFOKG4pIG9yIG5vdCBpc0Zpbml0ZShuKVxuICByZXR1cm4gMCBpZiBuID09IDBcbiAgcmV0dXJuIDEgaWYgKG4gJSAxKSAhPSAwIG9yIChuICogbikgPCAyXG4gIHJldHVybiAyIGlmIChuICUgMikgPT0gMFxuICByZXR1cm4gMyBpZiAobiAlIDMpID09IDBcbiAgcmV0dXJuIDUgaWYgKG4gJSA1KSA9PSAwXG5cbiAgbSA9IE1hdGguc3FydCBuXG4gIGZvciBpIGluIFs3Li5tXSBieSAzMFxuICAgIHJldHVybiBpICAgIGlmIChuICUgaSkgICAgICA9PSAwXG4gICAgcmV0dXJuIGkrNCAgaWYgKG4gJSAoaSs0KSkgID09IDBcbiAgICByZXR1cm4gaSs2ICBpZiAobiAlIChpKzYpKSAgPT0gMFxuICAgIHJldHVybiBpKzEwIGlmIChuICUgKGkrMTApKSA9PSAwXG4gICAgcmV0dXJuIGkrMTIgaWYgKG4gJSAoaSsxMikpID09IDBcbiAgICByZXR1cm4gaSsxNiBpZiAobiAlIChpKzE2KSkgPT0gMFxuICAgIHJldHVybiBpKzIyIGlmIChuICUgKGkrMjIpKSA9PSAwXG4gICAgcmV0dXJuIGkrMjQgaWYgKG4gJSAoaSsyNCkpID09IDBcblxuICByZXR1cm4gblxuXG5yb290LmlzUHJpbWUgPSAobikgLT5cbiAgaWYgaXNOYU4obikgb3Igbm90IGlzRmluaXRlKG4pIG9yIChuICUgMSkgIT0gMCBvciAobiA8IDIpXG4gICAgcmV0dXJuIGZhbHNlXG4gIGlmIG4gPT0gcm9vdC5sZWFzdEZhY3RvcihuKVxuICAgIHJldHVybiB0cnVlXG5cbiAgcmV0dXJuIGZhbHNlXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxucm9vdC5wcmltZUZhY3RvcnMgPSAobikgLT5cbiAgcmV0dXJuIFsxXSBpZiBuID09IDFcblxuICBmYWN0b3JzID0gW11cbiAgd2hpbGUgbm90IHJvb3QuaXNQcmltZShuKVxuICAgIGZhY3RvciA9IHJvb3QubGVhc3RGYWN0b3IobilcbiAgICBmYWN0b3JzLnB1c2ggZmFjdG9yXG4gICAgbiAvPSBmYWN0b3JcbiAgZmFjdG9ycy5wdXNoIG5cbiAgcmV0dXJuIGZhY3RvcnNcblxucm9vdC5mYWN0b3JpYWwgPSAobikgLT5cbiAgZiA9IG5cbiAgd2hpbGUgbiA+IDFcbiAgICBuLS1cbiAgICBmICo9IG5cbiAgcmV0dXJuIGZcblxucm9vdC5uQ3IgPSAobiwgcikgLT5cbiAgcmV0dXJuIE1hdGguZmxvb3Iocm9vdC5mYWN0b3JpYWwobikgLyAocm9vdC5mYWN0b3JpYWwocikgKiByb290LmZhY3RvcmlhbChuIC0gcikpKVxuIiwiTEFTVF9QUk9CTEVNID0gMTdcclxuXHJcbnJvb3QgPSB3aW5kb3cgIyBleHBvcnRzID8gdGhpc1xyXG5cclxucm9vdC5lc2NhcGVkU3RyaW5naWZ5ID0gKG8pIC0+XHJcbiAgc3RyID0gSlNPTi5zdHJpbmdpZnkobylcclxuICBzdHIgPSBzdHIucmVwbGFjZShcIl1cIiwgXCJcXFxcXVwiKVxyXG4gIHJldHVybiBzdHJcclxuXHJcbnJvb3QucnVuQWxsID0gLT5cclxuICBsYXN0UHV6emxlID0gTEFTVF9QUk9CTEVNXHJcbiAgbmV4dEluZGV4ID0gMFxyXG5cclxuICBsb2FkTmV4dFNjcmlwdCA9IC0+XHJcbiAgICBpZiBuZXh0SW5kZXggPCBsYXN0UHV6emxlXHJcbiAgICAgIG5leHRJbmRleCsrXHJcbiAgICAgIHJ1blRlc3QobmV4dEluZGV4LCBsb2FkTmV4dFNjcmlwdClcclxuICBsb2FkTmV4dFNjcmlwdCgpXHJcblxyXG5yb290Lml0ZXJhdGVQcm9ibGVtcyA9IChhcmdzKSAtPlxyXG5cclxuICBpbmRleFRvUHJvY2VzcyA9IG51bGxcclxuICBpZiBhcmdzLmVuZEluZGV4ID4gMFxyXG4gICAgaWYgYXJncy5zdGFydEluZGV4IDw9IGFyZ3MuZW5kSW5kZXhcclxuICAgICAgaW5kZXhUb1Byb2Nlc3MgPSBhcmdzLnN0YXJ0SW5kZXhcclxuICAgICAgYXJncy5zdGFydEluZGV4KytcclxuICBlbHNlXHJcbiAgICBpZiBhcmdzLmxpc3QubGVuZ3RoID4gMFxyXG4gICAgICBpbmRleFRvUHJvY2VzcyA9IGFyZ3MubGlzdC5zaGlmdCgpXHJcblxyXG4gIGlmIGluZGV4VG9Qcm9jZXNzICE9IG51bGxcclxuICAgIGl0ZXJhdGVOZXh0ID0gLT5cclxuICAgICAgd2luZG93LmFyZ3MgPSBhcmdzXHJcbiAgICAgIHJ1blRlc3QgaW5kZXhUb1Byb2Nlc3MsIC0+XHJcbiAgICAgICAgaXRlcmF0ZVByb2JsZW1zKGFyZ3MpXHJcbiAgICBpdGVyYXRlTmV4dCgpXHJcblxyXG5yb290LnJ1blRlc3QgPSAoaW5kZXgsIGNiKSAtPlxyXG4gIG1vZHVsZU5hbWUgPSBcImUjeygnMDAwJytpbmRleCkuc2xpY2UoLTMpfVwiXHJcbiAgd2luZG93LmluZGV4ID0gaW5kZXhcclxuICBwcm9ibGVtID0gcmVxdWlyZShtb2R1bGVOYW1lKVxyXG4gIHByb2JsZW0ucHJvY2VzcygpXHJcbiAgd2luZG93LnNldFRpbWVvdXQoY2IsIDApIGlmIGNiXHJcblxyXG5jbGFzcyBQcm9ibGVtXHJcbiAgY29uc3RydWN0b3I6IChAZGVzY3JpcHRpb24pIC0+XHJcbiAgICBAaW5kZXggPSB3aW5kb3cuaW5kZXhcclxuICAgIGxpbmVzID0gQGRlc2NyaXB0aW9uLnNwbGl0KC9cXG4vKVxyXG4gICAgbGluZXMuc2hpZnQoKSB3aGlsZSBsaW5lcy5sZW5ndGggPiAwIGFuZCBsaW5lc1swXS5sZW5ndGggPT0gMFxyXG4gICAgQHRpdGxlID0gbGluZXMuc2hpZnQoKVxyXG4gICAgQGxpbmUgPSBsaW5lcy5zaGlmdCgpXHJcbiAgICBAZGVzY3JpcHRpb24gPSBsaW5lcy5qb2luKFwiXFxuXCIpXHJcblxyXG4gIG5vdzogLT5cclxuICAgIHJldHVybiBpZiB3aW5kb3cucGVyZm9ybWFuY2UgdGhlbiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCkgZWxzZSBuZXcgRGF0ZSgpLmdldFRpbWUoKVxyXG5cclxuICBwcm9jZXNzOiAtPlxyXG4gICAgaWYgd2luZG93LmFyZ3MuZGVzY3JpcHRpb25cclxuICAgICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjNDQ0NDQ0O11fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX11cXG5cIlxyXG5cclxuICAgIGZvcm1hdHRlZFRpdGxlID0gJC50ZXJtaW5hbC5mb3JtYXQoXCJbWzsjZmZhYTAwO10je0B0aXRsZX1dXCIpXHJcbiAgICB1cmwgPSBcIj9jPSN7d2luZG93LmFyZ3MuY21kfV8je0BpbmRleH1cIlxyXG4gICAgaWYgd2luZG93LmFyZ3MudmVyYm9zZVxyXG4gICAgICB1cmwgKz0gXCJfdlwiXHJcbiAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIjxhIGhyZWY9XFxcIiN7dXJsfVxcXCI+I3tmb3JtYXR0ZWRUaXRsZX08L2E+XCIsIHsgcmF3OiB0cnVlIH1cclxuXHJcbiAgICBpZiB3aW5kb3cuYXJncy5kZXNjcmlwdGlvblxyXG4gICAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIltbOyM0NDQ0NDQ7XSN7QGxpbmV9XVwiXHJcbiAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2NjY2NlZTtdI3tAZGVzY3JpcHRpb259XVxcblwiXHJcbiAgICAgIHNvdXJjZUxpbmUgPSAkLnRlcm1pbmFsLmZvcm1hdChcIltbOyM0NDQ0NDQ7XVNvdXJjZTpdIFwiKVxyXG4gICAgICBzb3VyY2VMaW5lICs9IFwiIDxhIGhyZWY9XFxcInNyYy9lI3soJzAwMCcrQGluZGV4KS5zbGljZSgtMyl9LmNvZmZlZVxcXCI+XCIgKyAkLnRlcm1pbmFsLmZvcm1hdChcIltbOyM3NzMzMDA7XUxvY2FsXVwiKSArIFwiPC9hPiBcIlxyXG4gICAgICBzb3VyY2VMaW5lICs9ICQudGVybWluYWwuZm9ybWF0KFwiW1s7IzQ0NDQ0NDtdL11cIilcclxuICAgICAgc291cmNlTGluZSArPSBcIiA8YSBocmVmPVxcXCJodHRwczovL2dpdGh1Yi5jb20vam9lZHJhZ28vZXVsZXIvYmxvYi9tYXN0ZXIvc3JjL2UjeygnMDAwJytAaW5kZXgpLnNsaWNlKC0zKX0uY29mZmVlXFxcIj5cIiArICQudGVybWluYWwuZm9ybWF0KFwiW1s7Izc3MzMwMDtdR2l0aHViXVwiKSArIFwiPC9hPlwiXHJcbiAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIHNvdXJjZUxpbmUsIHsgcmF3OiB0cnVlIH1cclxuICAgICAgaWYgd2luZG93LmFyZ3MudGVzdCBvciB3aW5kb3cuYXJncy5hbnN3ZXJcclxuICAgICAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIlwiXHJcblxyXG4gICAgdGVzdEZ1bmMgPSBAdGVzdFxyXG4gICAgYW5zd2VyRnVuYyA9IEBhbnN3ZXJcclxuXHJcbiAgICBpZiB3aW5kb3cuYXJncy50ZXN0XHJcbiAgICAgIGlmIHRlc3RGdW5jID09IHVuZGVmaW5lZFxyXG4gICAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7IzQ0NDQ0NDtdIChubyB0ZXN0cyldXCJcclxuICAgICAgZWxzZVxyXG4gICAgICAgIHRlc3RGdW5jKClcclxuXHJcbiAgICBpZiB3aW5kb3cuYXJncy5hbnN3ZXJcclxuICAgICAgc3RhcnQgPSBAbm93KClcclxuICAgICAgYW5zd2VyID0gYW5zd2VyRnVuYygpXHJcbiAgICAgIGVuZCA9IEBub3coKVxyXG4gICAgICBtcyA9IGVuZCAtIHN0YXJ0XHJcbiAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2ZmZmZmZjtdIC0+IF1bWzsjYWFmZmFhO11BbnN3ZXI6XSAoW1s7I2FhZmZmZjtdI3ttcy50b0ZpeGVkKDEpfW1zXSk6IFtbOyNmZmZmZmY7XSN7ZXNjYXBlZFN0cmluZ2lmeShhbnN3ZXIpfV1cIlxyXG5cclxucm9vdC5Qcm9ibGVtID0gUHJvYmxlbVxyXG5cclxucm9vdC5vayA9ICh2LCBtc2cpIC0+XHJcbiAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjZmZmZmZmO10gKiAgXSN7dn06ICN7bXNnfVwiXHJcblxyXG5yb290LmVxdWFsID0gKGEsIGIsIG1zZykgLT5cclxuICBpZiBhID09IGJcclxuICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2ZmZmZmZjtdICogIF1bWzsjNTU1NTU1O11QQVNTOiAje21zZ31dXCJcclxuICBlbHNlXHJcbiAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIltbOyNmZmZmZmY7XSAqICBdW1s7I2ZmYWFhYTtdRkFJTDogI3ttc2d9ICgje2F9ICE9ICN7Yn0pXVwiXHJcblxyXG5yb290Lm9uQ29tbWFuZCA9IChjb21tYW5kKSA9PlxyXG4gIHJldHVybiBpZiBjb21tYW5kLmxlbmd0aCA9PSAwXHJcbiAgY21kID0gJC50ZXJtaW5hbC5wYXJzZUNvbW1hbmQoY29tbWFuZClcclxuICByZXR1cm4gaWYgY21kLm5hbWUubGVuZ3RoID09IDBcclxuXHJcbiAgYXJncyA9XHJcbiAgICBzdGFydEluZGV4OiAwXHJcbiAgICBlbmRJbmRleDogMFxyXG4gICAgbGlzdDogW11cclxuICAgIHZlcmJvc2U6IGZhbHNlXHJcbiAgICBkZXNjcmlwdGlvbjogZmFsc2VcclxuICAgIHRlc3Q6IGZhbHNlXHJcbiAgICBhbnN3ZXI6IGZhbHNlXHJcblxyXG4gIHByb2Nlc3MgPSB0cnVlXHJcblxyXG4gIGZvciBhcmcgaW4gY21kLmFyZ3NcclxuICAgIGFyZyA9IFN0cmluZyhhcmcpXHJcbiAgICBjb250aW51ZSBpZiBhcmcubGVuZ3RoIDwgMVxyXG4gICAgaWYgYXJnWzBdID09ICd2J1xyXG4gICAgICBhcmdzLnZlcmJvc2UgPSB0cnVlXHJcbiAgICBlbHNlIGlmIGFyZy5tYXRjaCgvXlxcZCskLylcclxuICAgICAgdiA9IHBhcnNlSW50KGFyZylcclxuICAgICAgaWYgKHYgPj0gMSkgYW5kICh2IDw9IExBU1RfUFJPQkxFTSlcclxuICAgICAgICBhcmdzLmxpc3QucHVzaCh2KVxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgcHJvY2VzcyA9IGZhbHNlXHJcbiAgICAgICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjZmZhYWFhO11ObyBzdWNoIHRlc3Q6ICN7dn0gKHZhbGlkIHRlc3RzIDEtI3tMQVNUX1BST0JMRU19KV1cIlxyXG5cclxuICBpZiBhcmdzLmxpc3QubGVuZ3RoID09IDBcclxuICAgIGFyZ3Muc3RhcnRJbmRleCA9IDFcclxuICAgIGFyZ3MuZW5kSW5kZXggPSBMQVNUX1BST0JMRU1cclxuXHJcbiAgIyBTaW5jZSBhbGwgb2Ygb3VyIGNvbW1hbmRzIGhhcHBlbiB0byBoYXZlIHVuaXF1ZSBmaXJzdCBsZXR0ZXJzLCBsZXQgcGVvcGxlIGJlIHN1cGVyIGxhenkvc2lsbHlcclxuICBpZiBjbWQubmFtZVswXSA9PSAnbCdcclxuICAgIGFyZ3MuY21kID0gXCJsaXN0XCJcclxuICBlbHNlIGlmIGNtZC5uYW1lWzBdID09ICdkJ1xyXG4gICAgYXJncy5jbWQgPSBcImRlc2NyaWJlXCJcclxuICAgIGFyZ3MuZGVzY3JpcHRpb24gPSB0cnVlXHJcbiAgZWxzZSBpZiBjbWQubmFtZVswXSA9PSAndCdcclxuICAgIGFyZ3MuY21kID0gXCJ0ZXN0XCJcclxuICAgIGFyZ3MudGVzdCA9IHRydWVcclxuICBlbHNlIGlmIGNtZC5uYW1lWzBdID09ICdhJ1xyXG4gICAgYXJncy5jbWQgPSBcImFuc3dlclwiXHJcbiAgICBhcmdzLmFuc3dlciA9IHRydWVcclxuICBlbHNlIGlmIGNtZC5uYW1lWzBdID09ICdyJ1xyXG4gICAgYXJncy5jbWQgPSBcInJ1blwiXHJcbiAgICBhcmdzLnRlc3QgPSB0cnVlXHJcbiAgICBhcmdzLmFuc3dlciA9IHRydWVcclxuICBlbHNlIGlmIGNtZC5uYW1lWzBdID09ICdkJ1xyXG4gICAgYXJncy5jbWQgPSBcImRlc2NyaWJlXCJcclxuICAgIGFyZ3MuZGVzY3JpcHRpb24gPSB0cnVlXHJcbiAgZWxzZSBpZiBjbWQubmFtZVswXSA9PSAnaCdcclxuICAgIGFyZ3MuY21kID0gXCJoZWxwXCJcclxuICAgIHByb2Nlc3MgPSBmYWxzZVxyXG4gICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJcIlwiXHJcbiAgICBDb21tYW5kczpcclxuXHJcbiAgICAgICAgbGlzdCBbWF0gICAgIC0gTGlzdCBwcm9ibGVtIHRpdGxlc1xyXG4gICAgICAgIGRlc2NyaWJlIFtYXSAtIERpc3BsYXkgZnVsbCBwcm9ibGVtIGRlc2NyaXB0aW9uc1xyXG4gICAgICAgIHRlc3QgW1hdICAgICAtIFJ1biB1bml0IHRlc3RzXHJcbiAgICAgICAgYW5zd2VyIFtYXSAgIC0gVGltZSBhbmQgY2FsY3VsYXRlIGFuc3dlclxyXG4gICAgICAgIHJ1biBbWF0gICAgICAtIHRlc3QgYW5kIGFuc3dlciBjb21iaW5lZFxyXG4gICAgICAgIGhlbHAgICAgICAgICAtIFRoaXMgaGVscFxyXG5cclxuICAgICAgICBJbiBhbGwgb2YgdGhlc2UsIFtYXSBjYW4gYmUgYSBsaXN0IG9mIG9uZSBvciBtb3JlIHByb2JsZW0gbnVtYmVycy4gKGEgdmFsdWUgZnJvbSAxIHRvICN7TEFTVF9QUk9CTEVNfSkuIElmIGFic2VudCwgaXQgaW1wbGllcyBhbGwgcHJvYmxlbXMuXHJcbiAgICAgICAgQWxzbywgYWRkaW5nIHRoZSB3b3JkIFwidmVyYm9zZVwiIHRvIHNvbWUgb2YgdGhlc2UgY29tbWFuZHMgd2lsbCBlbWl0IHRoZSBkZXNjcmlwdGlvbiBiZWZvcmUgcGVyZm9ybWluZyB0aGUgdGFzay5cclxuXHJcbiAgICBcIlwiXCJcclxuICBlbHNlXHJcbiAgICBwcm9jZXNzID0gZmFsc2VcclxuICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2ZmYWFhYTtdVW5rbm93biBjb21tYW5kLl1cIlxyXG5cclxuICBpZiBhcmdzLnZlcmJvc2VcclxuICAgIGFyZ3MuZGVzY3JpcHRpb24gPSB0cnVlXHJcblxyXG4gIGlmIHByb2Nlc3NcclxuICAgIGl0ZXJhdGVQcm9ibGVtcyhhcmdzKVxyXG4iXX0=
