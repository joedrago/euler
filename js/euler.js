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
        max.dir = "diagonal";
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

LAST_PROBLEM = 16;

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2JpZy1pbnRlZ2VyL0JpZ0ludGVnZXIuanMiLCIuLi9zcmMvZTAwMS5jb2ZmZWUiLCIuLi9zcmMvZTAwMi5jb2ZmZWUiLCIuLi9zcmMvZTAwMy5jb2ZmZWUiLCIuLi9zcmMvZTAwNC5jb2ZmZWUiLCIuLi9zcmMvZTAwNS5jb2ZmZWUiLCIuLi9zcmMvZTAwNi5jb2ZmZWUiLCIuLi9zcmMvZTAwNy5jb2ZmZWUiLCIuLi9zcmMvZTAwOC5jb2ZmZWUiLCIuLi9zcmMvZTAwOS5jb2ZmZWUiLCIuLi9zcmMvZTAxMC5jb2ZmZWUiLCIuLi9zcmMvZTAxMS5jb2ZmZWUiLCIuLi9zcmMvZTAxMi5jb2ZmZWUiLCIuLi9zcmMvZTAxMy5jb2ZmZWUiLCIuLi9zcmMvZTAxNC5jb2ZmZWUiLCIuLi9zcmMvZTAxNS5jb2ZmZWUiLCIuLi9zcmMvZTAxNi5jb2ZmZWUiLCIuLi9zcmMvbWF0aC5jb2ZmZWUiLCIuLi9zcmMvdGVybWluYWwuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqWUEsSUFBQSxPQUFBOztBQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLE9BQUEsR0FBYyxJQUFBLE9BQUEsQ0FBUSx1UUFBUixDQUEvQixDQUFBOztBQUFBLE9BWU8sQ0FBQyxJQUFSLEdBQWUsU0FBQSxHQUFBO0FBQ2IsTUFBQSxVQUFBO0FBQUEsRUFBQSxHQUFBLEdBQU0sQ0FBTixDQUFBO0FBQ0EsT0FBUyw2QkFBVCxHQUFBO0FBQ0UsSUFBQSxJQUFH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TCxHQUFXLE1BQVgsQ0FBQTtBQUFBLE1BQ0EsT0FBQSxHQUFVLEtBRFYsQ0FBQTtBQUFBLE1BRUEsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFoQixDQUF3QixxV0FBQSxHQVVrQyxZQVZsQyxHQVVnRCxpS0FWeEUsQ0FGQSxDQURHO0tBQUEsTUFBQTtBQWtCSCxNQUFBLE9BQUEsR0FBVSxLQUFWLENBQUE7QUFBQSxNQUNBLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBaEIsQ0FBcUIsK0JBQXJCLENBREEsQ0FsQkc7S0FuREw7QUF3RUEsSUFBQSxJQUFHLElBQUksQ0FBQyxPQUFSO0FBQ0UsTUFBQSxJQUFJLENBQUMsV0FBTCxHQUFtQixJQUFuQixDQURGO0tBeEVBO0FBMkVBLElBQUEsSUFBRyxPQUFIO2FBQ0UsZUFBQSxDQUFnQixJQUFoQixFQURGO0tBNUVlO0VBQUEsRUFBQTtBQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0F4R2pCLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBiaWdJbnQgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGJhc2UgPSAxMDAwMDAwMCwgbG9nQmFzZSA9IDc7XHJcbiAgICB2YXIgc2lnbiA9IHtcclxuICAgICAgICBwb3NpdGl2ZTogZmFsc2UsXHJcbiAgICAgICAgbmVnYXRpdmU6IHRydWVcclxuICAgIH07XHJcblxyXG4gICAgdmFyIG5vcm1hbGl6ZSA9IGZ1bmN0aW9uIChmaXJzdCwgc2Vjb25kKSB7XHJcbiAgICAgICAgdmFyIGEgPSBmaXJzdC52YWx1ZSwgYiA9IHNlY29uZC52YWx1ZTtcclxuICAgICAgICB2YXIgbGVuZ3RoID0gYS5sZW5ndGggPiBiLmxlbmd0aCA/IGEubGVuZ3RoIDogYi5sZW5ndGg7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBhW2ldID0gYVtpXSB8fCAwO1xyXG4gICAgICAgICAgICBiW2ldID0gYltpXSB8fCAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKHZhciBpID0gbGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgaWYgKGFbaV0gPT09IDAgJiYgYltpXSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgYS5wb3AoKTtcclxuICAgICAgICAgICAgICAgIGIucG9wKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFhLmxlbmd0aCkgYSA9IFswXSwgYiA9IFswXTtcclxuICAgICAgICBmaXJzdC52YWx1ZSA9IGE7XHJcbiAgICAgICAgc2Vjb25kLnZhbHVlID0gYjtcclxuICAgIH07XHJcblxyXG4gICAgdmFyIHBhcnNlID0gZnVuY3Rpb24gKHRleHQsIGZpcnN0KSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB0ZXh0ID09PSBcIm9iamVjdFwiKSByZXR1cm4gdGV4dDtcclxuICAgICAgICB0ZXh0ICs9IFwiXCI7XHJcbiAgICAgICAgdmFyIHMgPSBzaWduLnBvc2l0aXZlLCB2YWx1ZSA9IFtdO1xyXG4gICAgICAgIGlmICh0ZXh0WzBdID09PSBcIi1cIikge1xyXG4gICAgICAgICAgICBzID0gc2lnbi5uZWdhdGl2ZTtcclxuICAgICAgICAgICAgdGV4dCA9IHRleHQuc2xpY2UoMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB0ZXh0ID0gdGV4dC5zcGxpdChcImVcIik7XHJcbiAgICAgICAgaWYgKHRleHQubGVuZ3RoID4gMikgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBpbnRlZ2VyXCIpO1xyXG4gICAgICAgIGlmICh0ZXh0WzFdKSB7XHJcbiAgICAgICAgICAgIHZhciBleHAgPSB0ZXh0WzFdO1xyXG4gICAgICAgICAgICBpZiAoZXhwWzBdID09PSBcIitcIikgZXhwID0gZXhwLnNsaWNlKDEpO1xyXG4gICAgICAgICAgICBleHAgPSBwYXJzZShleHApO1xyXG4gICAgICAgICAgICBpZiAoZXhwLmxlc3NlcigwKSkgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGluY2x1ZGUgbmVnYXRpdmUgZXhwb25lbnQgcGFydCBmb3IgaW50ZWdlcnNcIik7XHJcbiAgICAgICAgICAgIHdoaWxlIChleHAubm90RXF1YWxzKDApKSB7XHJcbiAgICAgICAgICAgICAgICB0ZXh0WzBdICs9IFwiMFwiO1xyXG4gICAgICAgICAgICAgICAgZXhwID0gZXhwLnByZXYoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0ZXh0ID0gdGV4dFswXTtcclxuICAgICAgICBpZiAodGV4dCA9PT0gXCItMFwiKSB0ZXh0ID0gXCIwXCI7XHJcbiAgICAgICAgdmFyIGlzVmFsaWQgPSAvXihbMC05XVswLTldKikkLy50ZXN0KHRleHQpO1xyXG4gICAgICAgIGlmICghaXNWYWxpZCkgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBpbnRlZ2VyXCIpO1xyXG4gICAgICAgIHdoaWxlICh0ZXh0Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgZGl2aWRlciA9IHRleHQubGVuZ3RoID4gbG9nQmFzZSA/IHRleHQubGVuZ3RoIC0gbG9nQmFzZSA6IDA7XHJcbiAgICAgICAgICAgIHZhbHVlLnB1c2goK3RleHQuc2xpY2UoZGl2aWRlcikpO1xyXG4gICAgICAgICAgICB0ZXh0ID0gdGV4dC5zbGljZSgwLCBkaXZpZGVyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHZhbCA9IGJpZ0ludCh2YWx1ZSwgcyk7XHJcbiAgICAgICAgaWYgKGZpcnN0KSBub3JtYWxpemUoZmlyc3QsIHZhbCk7XHJcbiAgICAgICAgcmV0dXJuIHZhbDtcclxuICAgIH07XHJcblxyXG4gICAgdmFyIGdvZXNJbnRvID0gZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgICAgICB2YXIgYSA9IGJpZ0ludChhLCBzaWduLnBvc2l0aXZlKSwgYiA9IGJpZ0ludChiLCBzaWduLnBvc2l0aXZlKTtcclxuICAgICAgICBpZiAoYS5lcXVhbHMoMCkpIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBkaXZpZGUgYnkgMFwiKTtcclxuICAgICAgICB2YXIgbiA9IDA7XHJcbiAgICAgICAgZG8ge1xyXG4gICAgICAgICAgICB2YXIgaW5jID0gMTtcclxuICAgICAgICAgICAgdmFyIGMgPSBiaWdJbnQoYS52YWx1ZSwgc2lnbi5wb3NpdGl2ZSksIHQgPSBjLnRpbWVzKDEwKTtcclxuICAgICAgICAgICAgd2hpbGUgKHQubGVzc2VyKGIpKSB7XHJcbiAgICAgICAgICAgICAgICBjID0gdDtcclxuICAgICAgICAgICAgICAgIGluYyAqPSAxMDtcclxuICAgICAgICAgICAgICAgIHQgPSB0LnRpbWVzKDEwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB3aGlsZSAoYy5sZXNzZXJPckVxdWFscyhiKSkge1xyXG4gICAgICAgICAgICAgICAgYiA9IGIubWludXMoYyk7XHJcbiAgICAgICAgICAgICAgICBuICs9IGluYztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gd2hpbGUgKGEubGVzc2VyT3JFcXVhbHMoYikpO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZW1haW5kZXI6IGIudmFsdWUsXHJcbiAgICAgICAgICAgIHJlc3VsdDogblxyXG4gICAgICAgIH07XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBiaWdJbnQgPSBmdW5jdGlvbiAodmFsdWUsIHMpIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHtcclxuICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxyXG4gICAgICAgICAgICBzaWduOiBzXHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgbyA9IHtcclxuICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxyXG4gICAgICAgICAgICBzaWduOiBzLFxyXG4gICAgICAgICAgICBuZWdhdGU6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBtIHx8IHNlbGY7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYmlnSW50KGZpcnN0LnZhbHVlLCAhZmlyc3Quc2lnbik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGFiczogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IG0gfHwgc2VsZjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBiaWdJbnQoZmlyc3QudmFsdWUsIHNpZ24ucG9zaXRpdmUpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBhZGQ6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcywgZmlyc3QgPSBzZWxmLCBzZWNvbmQ7XHJcbiAgICAgICAgICAgICAgICBpZiAobSkgKGZpcnN0ID0gcGFyc2UobikpICYmIChzZWNvbmQgPSBwYXJzZShtKSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHNlY29uZCA9IHBhcnNlKG4sIGZpcnN0KTtcclxuICAgICAgICAgICAgICAgIHMgPSBmaXJzdC5zaWduO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0LnNpZ24gIT09IHNlY29uZC5zaWduKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlyc3QgPSBiaWdJbnQoZmlyc3QudmFsdWUsIHNpZ24ucG9zaXRpdmUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlY29uZCA9IGJpZ0ludChzZWNvbmQudmFsdWUsIHNpZ24ucG9zaXRpdmUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzID09PSBzaWduLnBvc2l0aXZlID9cclxuXHRcdFx0XHRcdFx0by5zdWJ0cmFjdChmaXJzdCwgc2Vjb25kKSA6XHJcblx0XHRcdFx0XHRcdG8uc3VidHJhY3Qoc2Vjb25kLCBmaXJzdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBub3JtYWxpemUoZmlyc3QsIHNlY29uZCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgYSA9IGZpcnN0LnZhbHVlLCBiID0gc2Vjb25kLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG5cdFx0XHRcdFx0Y2FycnkgPSAwO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aCB8fCBjYXJyeSA+IDA7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzdW0gPSAoYVtpXSB8fCAwKSArIChiW2ldIHx8IDApICsgY2Fycnk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FycnkgPSBzdW0gPj0gYmFzZSA/IDEgOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHN1bSAtPSBjYXJyeSAqIGJhc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goc3VtKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBiaWdJbnQocmVzdWx0LCBzKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcGx1czogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmFkZChuLCBtKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3VidHJhY3Q6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBzZWxmLCBzZWNvbmQ7XHJcbiAgICAgICAgICAgICAgICBpZiAobSkgKGZpcnN0ID0gcGFyc2UobikpICYmIChzZWNvbmQgPSBwYXJzZShtKSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHNlY29uZCA9IHBhcnNlKG4sIGZpcnN0KTtcclxuICAgICAgICAgICAgICAgIGlmIChmaXJzdC5zaWduICE9PSBzZWNvbmQuc2lnbikgcmV0dXJuIG8uYWRkKGZpcnN0LCBvLm5lZ2F0ZShzZWNvbmQpKTtcclxuICAgICAgICAgICAgICAgIGlmIChmaXJzdC5zaWduID09PSBzaWduLm5lZ2F0aXZlKSByZXR1cm4gby5zdWJ0cmFjdChvLm5lZ2F0ZShzZWNvbmQpLCBvLm5lZ2F0ZShmaXJzdCkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG8uY29tcGFyZShmaXJzdCwgc2Vjb25kKSA9PT0gLTEpIHJldHVybiBvLm5lZ2F0ZShvLnN1YnRyYWN0KHNlY29uZCwgZmlyc3QpKTtcclxuICAgICAgICAgICAgICAgIHZhciBhID0gZmlyc3QudmFsdWUsIGIgPSBzZWNvbmQudmFsdWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcblx0XHRcdFx0XHRib3Jyb3cgPSAwO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRtcCA9IGFbaV0gLSBib3Jyb3c7XHJcbiAgICAgICAgICAgICAgICAgICAgYm9ycm93ID0gdG1wIDwgYltpXSA/IDEgOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBtaW51ZW5kID0gKGJvcnJvdyAqIGJhc2UpICsgdG1wIC0gYltpXTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChtaW51ZW5kKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBiaWdJbnQocmVzdWx0LCBzaWduLnBvc2l0aXZlKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbWludXM6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5zdWJ0cmFjdChuLCBtKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbXVsdGlwbHk6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcywgZmlyc3QgPSBzZWxmLCBzZWNvbmQ7XHJcbiAgICAgICAgICAgICAgICBpZiAobSkgKGZpcnN0ID0gcGFyc2UobikpICYmIChzZWNvbmQgPSBwYXJzZShtKSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHNlY29uZCA9IHBhcnNlKG4sIGZpcnN0KTtcclxuICAgICAgICAgICAgICAgIHMgPSBmaXJzdC5zaWduICE9PSBzZWNvbmQuc2lnbjtcclxuICAgICAgICAgICAgICAgIHZhciBhID0gZmlyc3QudmFsdWUsIGIgPSBzZWNvbmQudmFsdWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0U3VtID0gW107XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRTdW1baV0gPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaiA9IGk7XHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGotLSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRTdW1baV0ucHVzaCgwKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgY2FycnkgPSAwO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHggPSBhW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYi5sZW5ndGggfHwgY2FycnkgPiAwOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHkgPSBiW2pdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJvZHVjdCA9IHkgPyAoeCAqIHkpICsgY2FycnkgOiBjYXJyeTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FycnkgPSBwcm9kdWN0ID4gYmFzZSA/IE1hdGguZmxvb3IocHJvZHVjdCAvIGJhc2UpIDogMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdCAtPSBjYXJyeSAqIGJhc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFN1bVtpXS5wdXNoKHByb2R1Y3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBtYXggPSAtMTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzdWx0U3VtLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxlbiA9IHJlc3VsdFN1bVtpXS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxlbiA+IG1heCkgbWF4ID0gbGVuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdLCBjYXJyeSA9IDA7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1heCB8fCBjYXJyeSA+IDA7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzdW0gPSBjYXJyeTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHJlc3VsdFN1bS5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdW0gKz0gcmVzdWx0U3VtW2pdW2ldIHx8IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhcnJ5ID0gc3VtID4gYmFzZSA/IE1hdGguZmxvb3Ioc3VtIC8gYmFzZSkgOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHN1bSAtPSBjYXJyeSAqIGJhc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goc3VtKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBiaWdJbnQocmVzdWx0LCBzKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdGltZXM6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5tdWx0aXBseShuLCBtKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZGl2bW9kOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHMsIGZpcnN0ID0gc2VsZiwgc2Vjb25kO1xyXG4gICAgICAgICAgICAgICAgaWYgKG0pIChmaXJzdCA9IHBhcnNlKG4pKSAmJiAoc2Vjb25kID0gcGFyc2UobSkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBzZWNvbmQgPSBwYXJzZShuLCBmaXJzdCk7XHJcbiAgICAgICAgICAgICAgICBzID0gZmlyc3Quc2lnbiAhPT0gc2Vjb25kLnNpZ247XHJcbiAgICAgICAgICAgICAgICBpZiAoYmlnSW50KGZpcnN0LnZhbHVlLCBmaXJzdC5zaWduKS5lcXVhbHMoMCkpIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcXVvdGllbnQ6IGJpZ0ludChbMF0sIHNpZ24ucG9zaXRpdmUpLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlbWFpbmRlcjogYmlnSW50KFswXSwgc2lnbi5wb3NpdGl2ZSlcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBpZiAoc2Vjb25kLmVxdWFscygwKSkgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGRpdmlkZSBieSB6ZXJvXCIpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSBmaXJzdC52YWx1ZSwgYiA9IHNlY29uZC52YWx1ZTtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXSwgcmVtYWluZGVyID0gW107XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuID0gW2FbaV1dLmNvbmNhdChyZW1haW5kZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBxdW90aWVudCA9IGdvZXNJbnRvKGIsIG4pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHF1b3RpZW50LnJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVtYWluZGVyID0gcXVvdGllbnQucmVtYWluZGVyO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnJldmVyc2UoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcXVvdGllbnQ6IGJpZ0ludChyZXN1bHQsIHMpLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlbWFpbmRlcjogYmlnSW50KHJlbWFpbmRlciwgZmlyc3Quc2lnbilcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGRpdmlkZTogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmRpdm1vZChuLCBtKS5xdW90aWVudDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgb3ZlcjogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmRpdmlkZShuLCBtKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbW9kOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uZGl2bW9kKG4sIG0pLnJlbWFpbmRlcjtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVtYWluZGVyOiBmdW5jdGlvbihuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5tb2QobiwgbSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHBvdzogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHNlbGYsIHNlY29uZDtcclxuICAgICAgICAgICAgICAgIGlmIChtKSAoZmlyc3QgPSBwYXJzZShuKSkgJiYgKHNlY29uZCA9IHBhcnNlKG0pKTtcclxuICAgICAgICAgICAgICAgIGVsc2Ugc2Vjb25kID0gcGFyc2UobiwgZmlyc3QpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSBmaXJzdCwgYiA9IHNlY29uZDtcclxuICAgICAgICAgICAgICAgIGlmIChiaWdJbnQoYS52YWx1ZSwgYS5zaWduKS5lcXVhbHMoMCkpIHJldHVybiBaRVJPO1xyXG4gICAgICAgICAgICAgICAgaWYgKGIubGVzc2VyKDApKSByZXR1cm4gWkVSTztcclxuICAgICAgICAgICAgICAgIGlmIChiLmVxdWFscygwKSkgcmV0dXJuIE9ORTtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBiaWdJbnQoYS52YWx1ZSwgYS5zaWduKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoYi5tb2QoMikuZXF1YWxzKDApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSByZXN1bHQucG93KGIub3ZlcigyKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMudGltZXMoYyk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQudGltZXMocmVzdWx0LnBvdyhiLm1pbnVzKDEpKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBtIHx8IHNlbGY7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5hZGQoZmlyc3QsIDEpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwcmV2OiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gbSB8fCBzZWxmO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uc3VidHJhY3QoZmlyc3QsIDEpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjb21wYXJlOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gc2VsZiwgc2Vjb25kO1xyXG4gICAgICAgICAgICAgICAgaWYgKG0pIChmaXJzdCA9IHBhcnNlKG4pKSAmJiAoc2Vjb25kID0gcGFyc2UobSwgZmlyc3QpKTtcclxuICAgICAgICAgICAgICAgIGVsc2Ugc2Vjb25kID0gcGFyc2UobiwgZmlyc3QpO1xyXG4gICAgICAgICAgICAgICAgbm9ybWFsaXplKGZpcnN0LCBzZWNvbmQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0LnZhbHVlLmxlbmd0aCA9PT0gMSAmJiBzZWNvbmQudmFsdWUubGVuZ3RoID09PSAxICYmIGZpcnN0LnZhbHVlWzBdID09PSAwICYmIHNlY29uZC52YWx1ZVswXSA9PT0gMCkgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2Vjb25kLnNpZ24gIT09IGZpcnN0LnNpZ24pIHJldHVybiBmaXJzdC5zaWduID09PSBzaWduLnBvc2l0aXZlID8gMSA6IC0xO1xyXG4gICAgICAgICAgICAgICAgdmFyIG11bHRpcGxpZXIgPSBmaXJzdC5zaWduID09PSBzaWduLnBvc2l0aXZlID8gMSA6IC0xO1xyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSBmaXJzdC52YWx1ZSwgYiA9IHNlY29uZC52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBhLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFbaV0gPiBiW2ldKSByZXR1cm4gMSAqIG11bHRpcGxpZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJbaV0gPiBhW2ldKSByZXR1cm4gLTEgKiBtdWx0aXBsaWVyO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNvbXBhcmVUbzogZnVuY3Rpb24obiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uY29tcGFyZShuLCBtKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY29tcGFyZUFiczogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHNlbGYsIHNlY29uZDtcclxuICAgICAgICAgICAgICAgIGlmIChtKSAoZmlyc3QgPSBwYXJzZShuKSkgJiYgKHNlY29uZCA9IHBhcnNlKG0sIGZpcnN0KSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHNlY29uZCA9IHBhcnNlKG4sIGZpcnN0KTtcclxuICAgICAgICAgICAgICAgIGZpcnN0LnNpZ24gPSBzZWNvbmQuc2lnbiA9IHNpZ24ucG9zaXRpdmU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5jb21wYXJlKGZpcnN0LCBzZWNvbmQpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcXVhbHM6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5jb21wYXJlKG4sIG0pID09PSAwO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBub3RFcXVhbHM6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gIW8uZXF1YWxzKG4sIG0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBsZXNzZXI6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5jb21wYXJlKG4sIG0pIDwgMDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZ3JlYXRlcjogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmNvbXBhcmUobiwgbSkgPiAwO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBncmVhdGVyT3JFcXVhbHM6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5jb21wYXJlKG4sIG0pID49IDA7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGxlc3Nlck9yRXF1YWxzOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uY29tcGFyZShuLCBtKSA8PSAwO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBpc1Bvc2l0aXZlOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gbSB8fCBzZWxmO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpcnN0LnNpZ24gPT09IHNpZ24ucG9zaXRpdmU7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGlzTmVnYXRpdmU6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBtIHx8IHNlbGY7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlyc3Quc2lnbiA9PT0gc2lnbi5uZWdhdGl2ZTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgaXNFdmVuOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gbSB8fCBzZWxmO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpcnN0LnZhbHVlWzBdICUgMiA9PT0gMDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgaXNPZGQ6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBtIHx8IHNlbGY7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlyc3QudmFsdWVbMF0gJSAyID09PSAxO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0b1N0cmluZzogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IG0gfHwgc2VsZjtcclxuICAgICAgICAgICAgICAgIHZhciBzdHIgPSBcIlwiLCBsZW4gPSBmaXJzdC52YWx1ZS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAobGVuLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZmlyc3QudmFsdWVbbGVuXS50b1N0cmluZygpLmxlbmd0aCA9PT0gOCkgc3RyICs9IGZpcnN0LnZhbHVlW2xlbl07XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBzdHIgKz0gKGJhc2UudG9TdHJpbmcoKSArIGZpcnN0LnZhbHVlW2xlbl0pLnNsaWNlKC1sb2dCYXNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHdoaWxlIChzdHJbMF0gPT09IFwiMFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyID0gc3RyLnNsaWNlKDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCFzdHIubGVuZ3RoKSBzdHIgPSBcIjBcIjtcclxuICAgICAgICAgICAgICAgIGlmIChzdHIgPT09IFwiMFwiKSByZXR1cm4gc3RyO1xyXG4gICAgICAgICAgICAgICAgdmFyIHMgPSBmaXJzdC5zaWduID09PSBzaWduLnBvc2l0aXZlID8gXCJcIiA6IFwiLVwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHMgKyBzdHI7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHRvSlNOdW1iZXI6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gK28udG9TdHJpbmcobSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHZhbHVlT2Y6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby50b0pTTnVtYmVyKG0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gbztcclxuICAgIH07XHJcblxyXG4gICAgdmFyIFpFUk8gPSBiaWdJbnQoWzBdLCBzaWduLnBvc2l0aXZlKTtcclxuICAgIHZhciBPTkUgPSBiaWdJbnQoWzFdLCBzaWduLnBvc2l0aXZlKTtcclxuICAgIHZhciBNSU5VU19PTkUgPSBiaWdJbnQoWzFdLCBzaWduLm5lZ2F0aXZlKTtcclxuXHJcbiAgICB2YXIgcGFyc2VCYXNlID0gZnVuY3Rpb24gKHRleHQsIGJhc2UpIHtcclxuICAgICAgICBiYXNlID0gcGFyc2UoYmFzZSk7XHJcbiAgICAgICAgdmFyIHZhbCA9IFpFUk87XHJcbiAgICAgICAgdmFyIGRpZ2l0cyA9IFtdO1xyXG4gICAgICAgIHZhciBpO1xyXG4gICAgICAgIHZhciBpc05lZ2F0aXZlID0gZmFsc2U7XHJcbiAgICAgICAgZnVuY3Rpb24gcGFyc2VUb2tlbih0ZXh0KSB7XHJcbiAgICAgICAgICAgIHZhciBjID0gdGV4dFtpXS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICBpZiAoaSA9PT0gMCAmJiB0ZXh0W2ldID09PSBcIi1cIikge1xyXG4gICAgICAgICAgICAgICAgaXNOZWdhdGl2ZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKC9bMC05XS8udGVzdChjKSkgZGlnaXRzLnB1c2gocGFyc2UoYykpO1xyXG4gICAgICAgICAgICBlbHNlIGlmICgvW2Etel0vLnRlc3QoYykpIGRpZ2l0cy5wdXNoKHBhcnNlKGMuY2hhckNvZGVBdCgwKSAtIDg3KSk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGMgPT09IFwiPFwiKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RhcnQgPSBpO1xyXG4gICAgICAgICAgICAgICAgZG8gaSsrOyB3aGlsZSAodGV4dFtpXSAhPT0gXCI+XCIpO1xyXG4gICAgICAgICAgICAgICAgZGlnaXRzLnB1c2gocGFyc2UodGV4dC5zbGljZShzdGFydCArIDEsIGkpKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IoYyArIFwiIGlzIG5vdCBhIHZhbGlkIGNoYXJhY3RlclwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRleHQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgcGFyc2VUb2tlbih0ZXh0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZGlnaXRzLnJldmVyc2UoKTtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZGlnaXRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhbCA9IHZhbC5hZGQoZGlnaXRzW2ldLnRpbWVzKGJhc2UucG93KGkpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBpc05lZ2F0aXZlID8gLXZhbCA6IHZhbDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgZm5SZXR1cm4gPSBmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgICAgIGlmICh0eXBlb2YgYSA9PT0gXCJ1bmRlZmluZWRcIikgcmV0dXJuIFpFUk87XHJcbiAgICAgICAgaWYgKHR5cGVvZiBiICE9PSBcInVuZGVmaW5lZFwiKSByZXR1cm4gcGFyc2VCYXNlKGEsIGIpO1xyXG4gICAgICAgIHJldHVybiBwYXJzZShhKTtcclxuICAgIH07XHJcbiAgICBmblJldHVybi56ZXJvID0gWkVSTztcclxuICAgIGZuUmV0dXJuLm9uZSA9IE9ORTtcclxuICAgIGZuUmV0dXJuLm1pbnVzT25lID0gTUlOVVNfT05FO1xyXG4gICAgcmV0dXJuIGZuUmV0dXJuO1xyXG59KSgpO1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gYmlnSW50O1xyXG59IiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMTogTXVsdGlwbGVzIG9mIDMgYW5kIDVcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuSWYgd2UgbGlzdCBhbGwgdGhlIG5hdHVyYWwgbnVtYmVycyBiZWxvdyAxMCB0aGF0IGFyZSBtdWx0aXBsZXMgb2YgMyBvciA1LCB3ZSBnZXQgMywgNSwgNiBhbmQgOS5cblRoZSBzdW0gb2YgdGhlc2UgbXVsdGlwbGVzIGlzIDIzLlxuXG5GaW5kIHRoZSBzdW0gb2YgYWxsIHRoZSBtdWx0aXBsZXMgb2YgMyBvciA1IGJlbG93IDEwMDAuXG5cblwiXCJcIlxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBzdW0gPSAwXG4gIGZvciBpIGluIFsxLi4uMTBdXG4gICAgaWYgKGkgJSAzID09IDApIG9yIChpICUgNSA9PSAwKVxuICAgICAgc3VtICs9IGlcbiAgZXF1YWwoc3VtLCAyMywgXCJTdW0gb2YgbmF0dXJhbCBudW1iZXJzIDwgMTA6ICN7c3VtfVwiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHN1bSA9IDBcbiAgZm9yIGkgaW4gWzEuLi4xMDAwXVxuICAgIGlmIChpICUgMyA9PSAwKSBvciAoaSAlIDUgPT0gMClcbiAgICAgIHN1bSArPSBpXG5cbiAgcmV0dXJuIHN1bVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMjogRXZlbiBGaWJvbmFjY2kgbnVtYmVyc1xuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbkVhY2ggbmV3IHRlcm0gaW4gdGhlIEZpYm9uYWNjaSBzZXF1ZW5jZSBpcyBnZW5lcmF0ZWQgYnkgYWRkaW5nIHRoZSBwcmV2aW91cyB0d28gdGVybXMuXG5CeSBzdGFydGluZyB3aXRoIDEgYW5kIDIsIHRoZSBmaXJzdCAxMCB0ZXJtcyB3aWxsIGJlOlxuXG4xLCAyLCAzLCA1LCA4LCAxMywgMjEsIDM0LCA1NSwgODksIC4uLlxuXG5CeSBjb25zaWRlcmluZyB0aGUgdGVybXMgaW4gdGhlIEZpYm9uYWNjaSBzZXF1ZW5jZSB3aG9zZSB2YWx1ZXMgZG8gbm90IGV4Y2VlZCBmb3VyIG1pbGxpb24sXG5maW5kIHRoZSBzdW0gb2YgdGhlIGV2ZW4tdmFsdWVkIHRlcm1zLlxuXG5cIlwiXCJcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICBwcmV2ID0gMVxuICBjdXJyID0gMVxuICBzdW0gPSAwXG5cbiAgd2hpbGUgY3VyciA8IDQwMDAwMDBcbiAgICBpZiAoY3VyciAlIDIpID09IDBcbiAgICAgIHN1bSArPSBjdXJyXG5cbiAgICBuZXh0ID0gY3VyciArIHByZXZcbiAgICBwcmV2ID0gY3VyclxuICAgIGN1cnIgPSBuZXh0XG5cbiAgcmV0dXJuIHN1bVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMzogTGFyZ2VzdCBwcmltZSBmYWN0b3Jcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuVGhlIHByaW1lIGZhY3RvcnMgb2YgMTMxOTUgYXJlIDUsIDcsIDEzIGFuZCAyOS5cblxuV2hhdCBpcyB0aGUgbGFyZ2VzdCBwcmltZSBmYWN0b3Igb2YgdGhlIG51bWJlciA2MDA4NTE0NzUxNDMgP1xuXG5cIlwiXCJcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBTaGFtZWxlc3NseSBwaWxmZXJlZC9hZG9wdGVkIGZyb20gaHR0cDovL3d3dy5qYXZhc2NyaXB0ZXIubmV0L2ZhcS9udW1iZXJpc3ByaW1lLmh0bVxuXG5sZWFzdEZhY3RvciA9IChuKSAtPlxuICByZXR1cm4gTmFOIGlmIGlzTmFOKG4pIG9yIG5vdCBpc0Zpbml0ZShuKVxuICByZXR1cm4gMCBpZiBuID09IDBcbiAgcmV0dXJuIDEgaWYgKG4gJSAxKSAhPSAwIG9yIChuICogbikgPCAyXG4gIHJldHVybiAyIGlmIChuICUgMikgPT0gMFxuICByZXR1cm4gMyBpZiAobiAlIDMpID09IDBcbiAgcmV0dXJuIDUgaWYgKG4gJSA1KSA9PSAwXG5cbiAgbSA9IE1hdGguc3FydCBuXG4gIGZvciBpIGluIFs3Li5tXSBieSAzMFxuICAgIHJldHVybiBpICAgIGlmIChuICUgaSkgICAgICA9PSAwXG4gICAgcmV0dXJuIGkrNCAgaWYgKG4gJSAoaSs0KSkgID09IDBcbiAgICByZXR1cm4gaSs2ICBpZiAobiAlIChpKzYpKSAgPT0gMFxuICAgIHJldHVybiBpKzEwIGlmIChuICUgKGkrMTApKSA9PSAwXG4gICAgcmV0dXJuIGkrMTIgaWYgKG4gJSAoaSsxMikpID09IDBcbiAgICByZXR1cm4gaSsxNiBpZiAobiAlIChpKzE2KSkgPT0gMFxuICAgIHJldHVybiBpKzIyIGlmIChuICUgKGkrMjIpKSA9PSAwXG4gICAgcmV0dXJuIGkrMjQgaWYgKG4gJSAoaSsyNCkpID09IDBcblxuICByZXR1cm4gblxuXG5pc1ByaW1lID0gKG4pIC0+XG4gIGlmIGlzTmFOKG4pIG9yIG5vdCBpc0Zpbml0ZShuKSBvciAobiAlIDEpICE9IDAgb3IgKG4gPCAyKVxuICAgIHJldHVybiBmYWxzZVxuICBpZiBuID09IGxlYXN0RmFjdG9yKG4pXG4gICAgcmV0dXJuIHRydWVcblxuICByZXR1cm4gZmFsc2VcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5wcmltZUZhY3RvcnMgPSAobikgLT5cbiAgcmV0dXJuIFsxXSBpZiBuID09IDFcblxuICBmYWN0b3JzID0gW11cbiAgd2hpbGUgbm90IGlzUHJpbWUobilcbiAgICBmYWN0b3IgPSBsZWFzdEZhY3RvcihuKVxuICAgIGZhY3RvcnMucHVzaCBmYWN0b3JcbiAgICBuIC89IGZhY3RvclxuICBmYWN0b3JzLnB1c2ggblxuICByZXR1cm4gZmFjdG9yc1xuXG5sYXJnZXN0UHJpbWVGYWN0b3IgPSAobikgLT5cbiAgcmV0dXJuIDEgaWYgbiA9PSAxXG5cbiAgd2hpbGUgbm90IGlzUHJpbWUobilcbiAgICBmYWN0b3IgPSBsZWFzdEZhY3RvcihuKVxuICAgIG4gLz0gZmFjdG9yXG4gIHJldHVybiBuXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgcmV0dXJuIGxhcmdlc3RQcmltZUZhY3Rvcig2MDA4NTE0NzUxNDMpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSA0OiBMYXJnZXN0IHBhbGluZHJvbWUgcHJvZHVjdFxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5BIHBhbGluZHJvbWljIG51bWJlciByZWFkcyB0aGUgc2FtZSBib3RoIHdheXMuXG5cbkZpbmQgdGhlIGxhcmdlc3QgcGFsaW5kcm9tZSBtYWRlIGZyb20gdGhlIHByb2R1Y3Qgb2YgdHdvIDMtZGlnaXQgbnVtYmVycy5cblxuXCJcIlwiXG5cbmlzUGFsaW5kcm9tZSA9IChuKSAtPlxuICBzdHIgPSBuLnRvU3RyaW5nKClcbiAgZm9yIGkgaW4gWzAuLi4oc3RyLmxlbmd0aCAvIDIpXVxuICAgIGlmIHN0cltpXSAhPSBzdHJbc3RyLmxlbmd0aCAtIDEgLSBpXVxuICAgICAgcmV0dXJuIGZhbHNlXG4gIHJldHVybiB0cnVlXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gICMgTWFrZSBzdXJlIGlzUGFsaW5kcm9tZSB3b3JrcyBwcm9wZXJseSBmaXJzdFxuICBmb3IgdiBpbiBbMSwgMTEsIDEyMSwgMTIyMSwgMTIzMjEsIDEyMzQzMjFdXG4gICAgZXF1YWwoaXNQYWxpbmRyb21lKHYpLCB0cnVlLCBcImlzUGFsaW5kcm9tZSgje3Z9KSByZXR1cm5zIHRydWVcIilcbiAgZm9yIHYgaW4gWzEyLCAxMjMsIDEyMzQsIDEyMzQ1LCAxMjM0NTYsIDEyMzI0XVxuICAgIGVxdWFsKGlzUGFsaW5kcm9tZSh2KSwgZmFsc2UsIFwiaXNQYWxpbmRyb21lKCN7dn0pIHJldHVybnMgZmFsc2VcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICBsYXJnZXN0aSA9IDBcbiAgbGFyZ2VzdGogPSAwXG4gIGxhcmdlc3RwID0gMFxuXG4gIGZvciBpIGluIFsxMDAuLjk5OV1cbiAgICBmb3IgaiBpbiBbMTAwLi45OTldXG4gICAgICBwcm9kdWN0ID0gaSAqIGpcbiAgICAgIGlmIGlzUGFsaW5kcm9tZShwcm9kdWN0KVxuICAgICAgICBsYXJnZXN0aSA9IGlcbiAgICAgICAgbGFyZ2VzdGogPSBqXG4gICAgICAgIGxhcmdlc3RwID0gcHJvZHVjdFxuXG4gIHJldHVybiBsYXJnZXN0cFxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gNTogU21hbGxlc3QgbXVsdGlwbGVcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuMjUyMCBpcyB0aGUgc21hbGxlc3QgbnVtYmVyIHRoYXQgY2FuIGJlIGRpdmlkZWQgYnkgZWFjaCBvZiB0aGUgbnVtYmVycyBmcm9tIDEgdG8gMTAgd2l0aG91dCBhbnkgcmVtYWluZGVyLlxuXG5XaGF0IGlzIHRoZSBzbWFsbGVzdCBwb3NpdGl2ZSBudW1iZXIgdGhhdCBpcyBldmVubHkgZGl2aXNpYmxlIGJ5IGFsbCBvZiB0aGUgbnVtYmVycyBmcm9tIDEgdG8gMjA/XG5cblwiXCJcIlxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIG4gPSAwXG4gIGxvb3BcbiAgICBuICs9IDIwICMgUHJvYmFibHkgY291bGQgYmUgc29tZSBjbGV2ZXIgc3VtIG9mIHByaW1lcyBiZXR3ZWVuIDEtMjAgb3Igc29tZXRoaW5nLiBJIGRvbid0IGNhcmUuXG4gICAgZm91bmQgPSB0cnVlXG4gICAgZm9yIGkgaW4gWzEuLjIwXVxuICAgICAgaWYgKG4gJSBpKSAhPSAwXG4gICAgICAgIGZvdW5kID0gZmFsc2VcbiAgICAgICAgYnJlYWtcblxuICAgIGJyZWFrIGlmIGZvdW5kXG5cbiAgcmV0dXJuIG5cbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDY6IFN1bSBzcXVhcmUgZGlmZmVyZW5jZVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuVGhlIHN1bSBvZiB0aGUgc3F1YXJlcyBvZiB0aGUgZmlyc3QgdGVuIG5hdHVyYWwgbnVtYmVycyBpcyxcblxuICAgICAgICAgICAgIDFeMiArIDJeMiArIC4uLiArIDEwXjIgPSAzODVcblxuVGhlIHNxdWFyZSBvZiB0aGUgc3VtIG9mIHRoZSBmaXJzdCB0ZW4gbmF0dXJhbCBudW1iZXJzIGlzLFxuXG4gICAgICAgICAgKDEgKyAyICsgLi4uICsgMTApXjIgPSA1NV4yID0gMzAyNVxuXG5IZW5jZSB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBzdW0gb2YgdGhlIHNxdWFyZXMgb2YgdGhlIGZpcnN0IHRlbiBuYXR1cmFsIG51bWJlcnMgYW5kIHRoZSBzcXVhcmUgb2YgdGhlIHN1bSBpcyAzMDI1IOKIkiAzODUgPSAyNjQwLlxuXG5GaW5kIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIHN1bSBvZiB0aGUgc3F1YXJlcyBvZiB0aGUgZmlyc3Qgb25lIGh1bmRyZWQgbmF0dXJhbCBudW1iZXJzIGFuZCB0aGUgc3F1YXJlIG9mIHRoZSBzdW0uXG5cblwiXCJcIlxuXG5zdW1PZlNxdWFyZXMgPSAobikgLT5cbiAgc3VtID0gMFxuICBmb3IgaSBpbiBbMS4ubl1cbiAgICBzdW0gKz0gKGkgKiBpKVxuICByZXR1cm4gc3VtXG5cbnNxdWFyZU9mU3VtID0gKG4pIC0+XG4gIHN1bSA9IDBcbiAgZm9yIGkgaW4gWzEuLm5dXG4gICAgc3VtICs9IGlcbiAgcmV0dXJuIChzdW0gKiBzdW0pXG5cbmRpZmZlcmVuY2VTdW1TcXVhcmVzID0gKG4pIC0+XG4gIHJldHVybiBzcXVhcmVPZlN1bShuKSAtIHN1bU9mU3F1YXJlcyhuKVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChzdW1PZlNxdWFyZXMoMTApLCAzODUsIFwiU3VtIG9mIHNxdWFyZXMgb2YgZmlyc3QgdGVuIG5hdHVyYWwgbnVtYmVycyBpcyAzODVcIilcbiAgZXF1YWwoc3F1YXJlT2ZTdW0oMTApLCAzMDI1LCBcIlNxdWFyZSBvZiBzdW0gb2YgZmlyc3QgdGVuIG5hdHVyYWwgbnVtYmVycyBpcyAzMDI1XCIpXG4gIGVxdWFsKGRpZmZlcmVuY2VTdW1TcXVhcmVzKDEwKSwgMjY0MCwgXCJEaWZmZXJlbmNlIGluIHZhbHVlcyBmb3IgdGhlIGZpcnN0IHRlbiBuYXR1cmFsIG51bWJlcnMgaXMgMjY0MFwiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHJldHVybiBkaWZmZXJlbmNlU3VtU3F1YXJlcygxMDApXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSA3OiAxMDAwMXN0IHByaW1lXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuQnkgbGlzdGluZyB0aGUgZmlyc3Qgc2l4IHByaW1lIG51bWJlcnM6IDIsIDMsIDUsIDcsIDExLCBhbmQgMTMsIHdlIGNhbiBzZWUgdGhhdCB0aGUgNnRoIHByaW1lIGlzIDEzLlxuXG5XaGF0IGlzIHRoZSAxMCwwMDFzdCBwcmltZSBudW1iZXI/XG5cblwiXCJcIlxuXG5tYXRoID0gcmVxdWlyZSBcIm1hdGhcIlxuXG5udGhQcmltZSA9IChuKSAtPlxuICBzaWV2ZSA9IG5ldyBtYXRoLkluY3JlbWVudGFsU2lldmVcbiAgZm9yIGkgaW4gWzEuLi5uXVxuICAgIHNpZXZlLm5leHQoKVxuICByZXR1cm4gc2lldmUubmV4dCgpXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGVxdWFsKG50aFByaW1lKDYpLCAxMywgXCI2dGggcHJpbWUgaXMgMTNcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICByZXR1cm4gbnRoUHJpbWUoMTAwMDEpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSA4OiBMYXJnZXN0IHByb2R1Y3QgaW4gYSBzZXJpZXNcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblRoZSBmb3VyIGFkamFjZW50IGRpZ2l0cyBpbiB0aGUgMTAwMC1kaWdpdCBudW1iZXIgdGhhdCBoYXZlIHRoZSBncmVhdGVzdCBwcm9kdWN0IGFyZSA5IHggOSB4IDggeCA5ID0gNTgzMi5cblxuICA3MzE2NzE3NjUzMTMzMDYyNDkxOTIyNTExOTY3NDQyNjU3NDc0MjM1NTM0OTE5NDkzNFxuICA5Njk4MzUyMDMxMjc3NDUwNjMyNjIzOTU3ODMxODAxNjk4NDgwMTg2OTQ3ODg1MTg0M1xuICA4NTg2MTU2MDc4OTExMjk0OTQ5NTQ1OTUwMTczNzk1ODMzMTk1Mjg1MzIwODgwNTUxMVxuICAxMjU0MDY5ODc0NzE1ODUyMzg2MzA1MDcxNTY5MzI5MDk2MzI5NTIyNzQ0MzA0MzU1N1xuICA2Njg5NjY0ODk1MDQ0NTI0NDUyMzE2MTczMTg1NjQwMzA5ODcxMTEyMTcyMjM4MzExM1xuICA2MjIyOTg5MzQyMzM4MDMwODEzNTMzNjI3NjYxNDI4MjgwNjQ0NDQ4NjY0NTIzODc0OVxuICAzMDM1ODkwNzI5NjI5MDQ5MTU2MDQ0MDc3MjM5MDcxMzgxMDUxNTg1OTMwNzk2MDg2NlxuICA3MDE3MjQyNzEyMTg4Mzk5ODc5NzkwODc5MjI3NDkyMTkwMTY5OTcyMDg4ODA5Mzc3NlxuICA2NTcyNzMzMzAwMTA1MzM2Nzg4MTIyMDIzNTQyMTgwOTc1MTI1NDU0MDU5NDc1MjI0M1xuICA1MjU4NDkwNzcxMTY3MDU1NjAxMzYwNDgzOTU4NjQ0NjcwNjMyNDQxNTcyMjE1NTM5N1xuICA1MzY5NzgxNzk3Nzg0NjE3NDA2NDk1NTE0OTI5MDg2MjU2OTMyMTk3ODQ2ODYyMjQ4MlxuICA4Mzk3MjI0MTM3NTY1NzA1NjA1NzQ5MDI2MTQwNzk3Mjk2ODY1MjQxNDUzNTEwMDQ3NFxuICA4MjE2NjM3MDQ4NDQwMzE5OTg5MDAwODg5NTI0MzQ1MDY1ODU0MTIyNzU4ODY2Njg4MVxuICAxNjQyNzE3MTQ3OTkyNDQ0MjkyODIzMDg2MzQ2NTY3NDgxMzkxOTEyMzE2MjgyNDU4NlxuICAxNzg2NjQ1ODM1OTEyNDU2NjUyOTQ3NjU0NTY4Mjg0ODkxMjg4MzE0MjYwNzY5MDA0MlxuICAyNDIxOTAyMjY3MTA1NTYyNjMyMTExMTEwOTM3MDU0NDIxNzUwNjk0MTY1ODk2MDQwOFxuICAwNzE5ODQwMzg1MDk2MjQ1NTQ0NDM2Mjk4MTIzMDk4Nzg3OTkyNzI0NDI4NDkwOTE4OFxuICA4NDU4MDE1NjE2NjA5NzkxOTEzMzg3NTQ5OTIwMDUyNDA2MzY4OTkxMjU2MDcxNzYwNlxuICAwNTg4NjExNjQ2NzEwOTQwNTA3NzU0MTAwMjI1Njk4MzE1NTIwMDA1NTkzNTcyOTcyNVxuICA3MTYzNjI2OTU2MTg4MjY3MDQyODI1MjQ4MzYwMDgyMzI1NzUzMDQyMDc1Mjk2MzQ1MFxuXG5GaW5kIHRoZSB0aGlydGVlbiBhZGphY2VudCBkaWdpdHMgaW4gdGhlIDEwMDAtZGlnaXQgbnVtYmVyIHRoYXQgaGF2ZSB0aGUgZ3JlYXRlc3QgcHJvZHVjdC4gV2hhdCBpcyB0aGUgdmFsdWUgb2YgdGhpcyBwcm9kdWN0P1xuXG5cIlwiXCJcblxuc3RyID0gXCJcIlwiXG4gICAgICA3MzE2NzE3NjUzMTMzMDYyNDkxOTIyNTExOTY3NDQyNjU3NDc0MjM1NTM0OTE5NDkzNFxuICAgICAgOTY5ODM1MjAzMTI3NzQ1MDYzMjYyMzk1NzgzMTgwMTY5ODQ4MDE4Njk0Nzg4NTE4NDNcbiAgICAgIDg1ODYxNTYwNzg5MTEyOTQ5NDk1NDU5NTAxNzM3OTU4MzMxOTUyODUzMjA4ODA1NTExXG4gICAgICAxMjU0MDY5ODc0NzE1ODUyMzg2MzA1MDcxNTY5MzI5MDk2MzI5NTIyNzQ0MzA0MzU1N1xuICAgICAgNjY4OTY2NDg5NTA0NDUyNDQ1MjMxNjE3MzE4NTY0MDMwOTg3MTExMjE3MjIzODMxMTNcbiAgICAgIDYyMjI5ODkzNDIzMzgwMzA4MTM1MzM2Mjc2NjE0MjgyODA2NDQ0NDg2NjQ1MjM4NzQ5XG4gICAgICAzMDM1ODkwNzI5NjI5MDQ5MTU2MDQ0MDc3MjM5MDcxMzgxMDUxNTg1OTMwNzk2MDg2NlxuICAgICAgNzAxNzI0MjcxMjE4ODM5OTg3OTc5MDg3OTIyNzQ5MjE5MDE2OTk3MjA4ODgwOTM3NzZcbiAgICAgIDY1NzI3MzMzMDAxMDUzMzY3ODgxMjIwMjM1NDIxODA5NzUxMjU0NTQwNTk0NzUyMjQzXG4gICAgICA1MjU4NDkwNzcxMTY3MDU1NjAxMzYwNDgzOTU4NjQ0NjcwNjMyNDQxNTcyMjE1NTM5N1xuICAgICAgNTM2OTc4MTc5Nzc4NDYxNzQwNjQ5NTUxNDkyOTA4NjI1NjkzMjE5Nzg0Njg2MjI0ODJcbiAgICAgIDgzOTcyMjQxMzc1NjU3MDU2MDU3NDkwMjYxNDA3OTcyOTY4NjUyNDE0NTM1MTAwNDc0XG4gICAgICA4MjE2NjM3MDQ4NDQwMzE5OTg5MDAwODg5NTI0MzQ1MDY1ODU0MTIyNzU4ODY2Njg4MVxuICAgICAgMTY0MjcxNzE0Nzk5MjQ0NDI5MjgyMzA4NjM0NjU2NzQ4MTM5MTkxMjMxNjI4MjQ1ODZcbiAgICAgIDE3ODY2NDU4MzU5MTI0NTY2NTI5NDc2NTQ1NjgyODQ4OTEyODgzMTQyNjA3NjkwMDQyXG4gICAgICAyNDIxOTAyMjY3MTA1NTYyNjMyMTExMTEwOTM3MDU0NDIxNzUwNjk0MTY1ODk2MDQwOFxuICAgICAgMDcxOTg0MDM4NTA5NjI0NTU0NDQzNjI5ODEyMzA5ODc4Nzk5MjcyNDQyODQ5MDkxODhcbiAgICAgIDg0NTgwMTU2MTY2MDk3OTE5MTMzODc1NDk5MjAwNTI0MDYzNjg5OTEyNTYwNzE3NjA2XG4gICAgICAwNTg4NjExNjQ2NzEwOTQwNTA3NzU0MTAwMjI1Njk4MzE1NTIwMDA1NTkzNTcyOTcyNVxuICAgICAgNzE2MzYyNjk1NjE4ODI2NzA0MjgyNTI0ODM2MDA4MjMyNTc1MzA0MjA3NTI5NjM0NTBcbiAgICAgIFwiXCJcIlxuc3RyID0gc3RyLnJlcGxhY2UoL1teMC05XS9nbSwgXCJcIilcbmRpZ2l0cyA9IChwYXJzZUludChkaWdpdCkgZm9yIGRpZ2l0IGluIHN0cilcblxubGFyZ2VzdFByb2R1Y3QgPSAoZGlnaXRDb3VudCkgLT5cbiAgcmV0dXJuIDAgaWYgZGlnaXRDb3VudCA+IGRpZ2l0cy5sZW5ndGhcblxuICBsYXJnZXN0ID0gMFxuICBmb3Igc3RhcnQgaW4gWzAuLihkaWdpdHMubGVuZ3RoIC0gZGlnaXRDb3VudCldXG4gICAgZW5kID0gc3RhcnQgKyBkaWdpdENvdW50XG4gICAgcHJvZHVjdCA9IDFcbiAgICBmb3IgaSBpbiBbc3RhcnQuLi5lbmRdXG4gICAgICBwcm9kdWN0ICo9IGRpZ2l0c1tpXVxuICAgIGlmIGxhcmdlc3QgPCBwcm9kdWN0XG4gICAgICBsYXJnZXN0ID0gcHJvZHVjdFxuXG4gIHJldHVybiBsYXJnZXN0XG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGVxdWFsKGxhcmdlc3RQcm9kdWN0KDQpLCA1ODMyLCAgXCJHcmVhdGVzdCBwcm9kdWN0IG9mIDQgYWRqYWNlbnQgZGlnaXRzIGlzIDU4MzJcIilcbiAgZXF1YWwobGFyZ2VzdFByb2R1Y3QoNSksIDQwODI0LCBcIkdyZWF0ZXN0IHByb2R1Y3Qgb2YgNSBhZGphY2VudCBkaWdpdHMgaXMgNDA4MjRcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICByZXR1cm4gbGFyZ2VzdFByb2R1Y3QoMTMpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSA5OiBTcGVjaWFsIFB5dGhhZ29yZWFuIHRyaXBsZXRcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbkEgUHl0aGFnb3JlYW4gdHJpcGxldCBpcyBhIHNldCBvZiB0aHJlZSBuYXR1cmFsIG51bWJlcnMsIGEgPCBiIDwgYywgZm9yIHdoaWNoLFxuXG4gICAgYV4yICsgYl4yID0gY14yXG5cbkZvciBleGFtcGxlLCAzXjIgKyA0XjIgPSA5ICsgMTYgPSAyNSA9IDVeMi5cblxuVGhlcmUgZXhpc3RzIGV4YWN0bHkgb25lIFB5dGhhZ29yZWFuIHRyaXBsZXQgZm9yIHdoaWNoIGEgKyBiICsgYyA9IDEwMDAuXG5cbkZpbmQgdGhlIHByb2R1Y3QgYWJjLlxuXG5cIlwiXCJcblxuaXNUcmlwbGV0ID0gKGEsIGIsIGMpIC0+XG4gIHJldHVybiAoKGEqYSkgKyAoYipiKSkgPT0gKGMqYylcblxuZmluZEZpcnN0VHJpcGxldCA9IChzdW0pIC0+XG4gIGZvciBhIGluIFsxLi4uMTAwMF1cbiAgICBmb3IgYiBpbiBbMS4uLjEwMDBdXG4gICAgICBjID0gMTAwMCAtIGEgLSBiXG4gICAgICBpZiBpc1RyaXBsZXQoYSwgYiwgYylcbiAgICAgICAgcmV0dXJuIFthLCBiLCBjXVxuXG4gIHJldHVybiBmYWxzZVxuXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGVxdWFsKGlzVHJpcGxldCgzLCA0LCA1KSwgdHJ1ZSwgXCIoMyw0LDUpIGlzIGEgUHl0aGFnb3JlYW4gdHJpcGxldFwiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHJldHVybiBmaW5kRmlyc3RUcmlwbGV0KDEwMDApXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAxMDogU3VtbWF0aW9uIG9mIHByaW1lc1xuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5UaGUgc3VtIG9mIHRoZSBwcmltZXMgYmVsb3cgMTAgaXMgMiArIDMgKyA1ICsgNyA9IDE3LlxuXG5GaW5kIHRoZSBzdW0gb2YgYWxsIHRoZSBwcmltZXMgYmVsb3cgdHdvIG1pbGxpb24uXG5cblwiXCJcIlxuXG5tYXRoID0gcmVxdWlyZSBcIm1hdGhcIlxuXG5wcmltZVN1bSA9IChjZWlsaW5nKSAtPlxuICBzaWV2ZSA9IG5ldyBtYXRoLkluY3JlbWVudGFsU2lldmVcblxuICBzdW0gPSAwXG4gIGxvb3BcbiAgICBuID0gc2lldmUubmV4dCgpXG4gICAgaWYgbiA+PSBjZWlsaW5nXG4gICAgICBicmVha1xuICAgIHN1bSArPSBuXG5cbiAgcmV0dXJuIHN1bVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChwcmltZVN1bSgxMCksIDE3LCBcIlN1bSBvZiBwcmltZXMgYmVsb3cgMTAgaXMgMTdcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICByZXR1cm4gcHJpbWVTdW0oMjAwMDAwMClcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDExOiBMYXJnZXN0IHByb2R1Y3QgaW4gYSBncmlkXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbkluIHRoZSAyMHgyMCBncmlkIGJlbG93LCBmb3VyIG51bWJlcnMgYWxvbmcgYSBkaWFnb25hbCBsaW5lIGhhdmUgYmVlbiBtYXJrZWQgaW4gcmVkLlxuXG4gICAgICAgICAgMDggMDIgMjIgOTcgMzggMTUgMDAgNDAgMDAgNzUgMDQgMDUgMDcgNzggNTIgMTIgNTAgNzcgOTEgMDhcbiAgICAgICAgICA0OSA0OSA5OSA0MCAxNyA4MSAxOCA1NyA2MCA4NyAxNyA0MCA5OCA0MyA2OSA0OCAwNCA1NiA2MiAwMFxuICAgICAgICAgIDgxIDQ5IDMxIDczIDU1IDc5IDE0IDI5IDkzIDcxIDQwIDY3IDUzIDg4IDMwIDAzIDQ5IDEzIDM2IDY1XG4gICAgICAgICAgNTIgNzAgOTUgMjMgMDQgNjAgMTEgNDIgNjkgMjQgNjggNTYgMDEgMzIgNTYgNzEgMzcgMDIgMzYgOTFcbiAgICAgICAgICAyMiAzMSAxNiA3MSA1MSA2NyA2MyA4OSA0MSA5MiAzNiA1NCAyMiA0MCA0MCAyOCA2NiAzMyAxMyA4MFxuICAgICAgICAgIDI0IDQ3IDMyIDYwIDk5IDAzIDQ1IDAyIDQ0IDc1IDMzIDUzIDc4IDM2IDg0IDIwIDM1IDE3IDEyIDUwXG4gICAgICAgICAgMzIgOTggODEgMjggNjQgMjMgNjcgMTAgMjZfMzggNDAgNjcgNTkgNTQgNzAgNjYgMTggMzggNjQgNzBcbiAgICAgICAgICA2NyAyNiAyMCA2OCAwMiA2MiAxMiAyMCA5NSA2M185NCAzOSA2MyAwOCA0MCA5MSA2NiA0OSA5NCAyMVxuICAgICAgICAgIDI0IDU1IDU4IDA1IDY2IDczIDk5IDI2IDk3IDE3IDc4Xzc4IDk2IDgzIDE0IDg4IDM0IDg5IDYzIDcyXG4gICAgICAgICAgMjEgMzYgMjMgMDkgNzUgMDAgNzYgNDQgMjAgNDUgMzUgMTQgMDAgNjEgMzMgOTcgMzQgMzEgMzMgOTVcbiAgICAgICAgICA3OCAxNyA1MyAyOCAyMiA3NSAzMSA2NyAxNSA5NCAwMyA4MCAwNCA2MiAxNiAxNCAwOSA1MyA1NiA5MlxuICAgICAgICAgIDE2IDM5IDA1IDQyIDk2IDM1IDMxIDQ3IDU1IDU4IDg4IDI0IDAwIDE3IDU0IDI0IDM2IDI5IDg1IDU3XG4gICAgICAgICAgODYgNTYgMDAgNDggMzUgNzEgODkgMDcgMDUgNDQgNDQgMzcgNDQgNjAgMjEgNTggNTEgNTQgMTcgNThcbiAgICAgICAgICAxOSA4MCA4MSA2OCAwNSA5NCA0NyA2OSAyOCA3MyA5MiAxMyA4NiA1MiAxNyA3NyAwNCA4OSA1NSA0MFxuICAgICAgICAgIDA0IDUyIDA4IDgzIDk3IDM1IDk5IDE2IDA3IDk3IDU3IDMyIDE2IDI2IDI2IDc5IDMzIDI3IDk4IDY2XG4gICAgICAgICAgODggMzYgNjggODcgNTcgNjIgMjAgNzIgMDMgNDYgMzMgNjcgNDYgNTUgMTIgMzIgNjMgOTMgNTMgNjlcbiAgICAgICAgICAwNCA0MiAxNiA3MyAzOCAyNSAzOSAxMSAyNCA5NCA3MiAxOCAwOCA0NiAyOSAzMiA0MCA2MiA3NiAzNlxuICAgICAgICAgIDIwIDY5IDM2IDQxIDcyIDMwIDIzIDg4IDM0IDYyIDk5IDY5IDgyIDY3IDU5IDg1IDc0IDA0IDM2IDE2XG4gICAgICAgICAgMjAgNzMgMzUgMjkgNzggMzEgOTAgMDEgNzQgMzEgNDkgNzEgNDggODYgODEgMTYgMjMgNTcgMDUgNTRcbiAgICAgICAgICAwMSA3MCA1NCA3MSA4MyA1MSA1NCA2OSAxNiA5MiAzMyA0OCA2MSA0MyA1MiAwMSA4OSAxOSA2NyA0OFxuXG5UaGUgcHJvZHVjdCBvZiB0aGVzZSBudW1iZXJzIGlzIDI2IHggNjMgeCA3OCB4IDE0ID0gMTc4ODY5Ni5cblxuV2hhdCBpcyB0aGUgZ3JlYXRlc3QgcHJvZHVjdCBvZiBmb3VyIGFkamFjZW50IG51bWJlcnMgaW4gdGhlIHNhbWUgZGlyZWN0aW9uICh1cCwgZG93biwgbGVmdCwgcmlnaHQsIG9yIGRpYWdvbmFsbHkpIGluIHRoZSAyMHgyMCBncmlkP1xuXG5cIlwiXCJcblxuZ3JpZCA9IG51bGxcblxucHJlcGFyZUdyaWQgPSAtPlxuICByYXdEaWdpdHMgPSBcIlwiXCJcbiAgICAwOCAwMiAyMiA5NyAzOCAxNSAwMCA0MCAwMCA3NSAwNCAwNSAwNyA3OCA1MiAxMiA1MCA3NyA5MSAwOFxuICAgIDQ5IDQ5IDk5IDQwIDE3IDgxIDE4IDU3IDYwIDg3IDE3IDQwIDk4IDQzIDY5IDQ4IDA0IDU2IDYyIDAwXG4gICAgODEgNDkgMzEgNzMgNTUgNzkgMTQgMjkgOTMgNzEgNDAgNjcgNTMgODggMzAgMDMgNDkgMTMgMzYgNjVcbiAgICA1MiA3MCA5NSAyMyAwNCA2MCAxMSA0MiA2OSAyNCA2OCA1NiAwMSAzMiA1NiA3MSAzNyAwMiAzNiA5MVxuICAgIDIyIDMxIDE2IDcxIDUxIDY3IDYzIDg5IDQxIDkyIDM2IDU0IDIyIDQwIDQwIDI4IDY2IDMzIDEzIDgwXG4gICAgMjQgNDcgMzIgNjAgOTkgMDMgNDUgMDIgNDQgNzUgMzMgNTMgNzggMzYgODQgMjAgMzUgMTcgMTIgNTBcbiAgICAzMiA5OCA4MSAyOCA2NCAyMyA2NyAxMCAyNiAzOCA0MCA2NyA1OSA1NCA3MCA2NiAxOCAzOCA2NCA3MFxuICAgIDY3IDI2IDIwIDY4IDAyIDYyIDEyIDIwIDk1IDYzIDk0IDM5IDYzIDA4IDQwIDkxIDY2IDQ5IDk0IDIxXG4gICAgMjQgNTUgNTggMDUgNjYgNzMgOTkgMjYgOTcgMTcgNzggNzggOTYgODMgMTQgODggMzQgODkgNjMgNzJcbiAgICAyMSAzNiAyMyAwOSA3NSAwMCA3NiA0NCAyMCA0NSAzNSAxNCAwMCA2MSAzMyA5NyAzNCAzMSAzMyA5NVxuICAgIDc4IDE3IDUzIDI4IDIyIDc1IDMxIDY3IDE1IDk0IDAzIDgwIDA0IDYyIDE2IDE0IDA5IDUzIDU2IDkyXG4gICAgMTYgMzkgMDUgNDIgOTYgMzUgMzEgNDcgNTUgNTggODggMjQgMDAgMTcgNTQgMjQgMzYgMjkgODUgNTdcbiAgICA4NiA1NiAwMCA0OCAzNSA3MSA4OSAwNyAwNSA0NCA0NCAzNyA0NCA2MCAyMSA1OCA1MSA1NCAxNyA1OFxuICAgIDE5IDgwIDgxIDY4IDA1IDk0IDQ3IDY5IDI4IDczIDkyIDEzIDg2IDUyIDE3IDc3IDA0IDg5IDU1IDQwXG4gICAgMDQgNTIgMDggODMgOTcgMzUgOTkgMTYgMDcgOTcgNTcgMzIgMTYgMjYgMjYgNzkgMzMgMjcgOTggNjZcbiAgICA4OCAzNiA2OCA4NyA1NyA2MiAyMCA3MiAwMyA0NiAzMyA2NyA0NiA1NSAxMiAzMiA2MyA5MyA1MyA2OVxuICAgIDA0IDQyIDE2IDczIDM4IDI1IDM5IDExIDI0IDk0IDcyIDE4IDA4IDQ2IDI5IDMyIDQwIDYyIDc2IDM2XG4gICAgMjAgNjkgMzYgNDEgNzIgMzAgMjMgODggMzQgNjIgOTkgNjkgODIgNjcgNTkgODUgNzQgMDQgMzYgMTZcbiAgICAyMCA3MyAzNSAyOSA3OCAzMSA5MCAwMSA3NCAzMSA0OSA3MSA0OCA4NiA4MSAxNiAyMyA1NyAwNSA1NFxuICAgIDAxIDcwIDU0IDcxIDgzIDUxIDU0IDY5IDE2IDkyIDMzIDQ4IDYxIDQzIDUyIDAxIDg5IDE5IDY3IDQ4XG4gIFwiXCJcIi5yZXBsYWNlKC9bXjAtOSBdL2dtLCBcIiBcIilcblxuICBkaWdpdHMgPSAocGFyc2VJbnQoZGlnaXQpIGZvciBkaWdpdCBpbiByYXdEaWdpdHMuc3BsaXQoXCIgXCIpKVxuICBncmlkID0gQXJyYXkoMjApXG4gIGZvciBpIGluIFswLi4uMjBdXG4gICAgZ3JpZFtpXSA9IEFycmF5KDIwKVxuXG4gIGluZGV4ID0gMFxuICBmb3IgaiBpbiBbMC4uLjIwXVxuICAgIGZvciBpIGluIFswLi4uMjBdXG4gICAgICBncmlkW2ldW2pdID0gZGlnaXRzW2luZGV4XVxuICAgICAgaW5kZXgrK1xuXG5wcmVwYXJlR3JpZCgpXG5cbiMgR2V0cyBhIHByb2R1Y3Qgb2YgNCB2YWx1ZXMgc3RhcnRpbmcgYXQgKHN4LCBzeSksIGhlYWRpbmcgaW4gdGhlIGRpcmVjdGlvbiAoZHgsIGR5KVxuIyBSZXR1cm5zIC0xIGlmIHRoZXJlIGlzIG5vIHJvb20gdG8gbWFrZSBhIHN0cmlwZSBvZiA0LlxuZ2V0TGluZVByb2R1Y3QgPSAoc3gsIHN5LCBkeCwgZHkpIC0+XG4gIGV4ID0gc3ggKyAoNCAqIGR4KVxuICByZXR1cm4gLTEgaWYgKGV4IDwgMCkgb3IgKGV4ID49IDIwKVxuICBleSA9IHN5ICsgKDQgKiBkeSlcbiAgcmV0dXJuIC0xIGlmIChleSA8IDApIG9yIChleSA+PSAyMClcblxuICB4ID0gc3hcbiAgeSA9IHN5XG4gIHByb2R1Y3QgPSAxXG4gIGZvciBpIGluIFswLi4uNF1cbiAgICBwcm9kdWN0ICo9IGdyaWRbeF1beV1cbiAgICB4ICs9IGR4XG4gICAgeSArPSBkeVxuXG4gIHJldHVybiBwcm9kdWN0XG5cbmdldExpbmUgPSAoc3gsIHN5LCBkeCwgZHkpIC0+XG4gIGV4ID0gc3ggKyAoNCAqIGR4KVxuICByZXR1cm4gW10gaWYgKGV4IDwgMCkgb3IgKGV4ID49IDIwKVxuICBleSA9IHN5ICsgKDQgKiBkeSlcbiAgcmV0dXJuIFtdIGlmIChleSA8IDApIG9yIChleSA+PSAyMClcblxuICBsaW5lID0gW11cblxuICB4ID0gc3hcbiAgeSA9IHN5XG4gIGZvciBpIGluIFswLi4uNF1cbiAgICBsaW5lLnB1c2ggZ3JpZFt4XVt5XVxuICAgIHggKz0gZHhcbiAgICB5ICs9IGR5XG5cbiAgcmV0dXJuIGxpbmVcblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgIyBFeGFtcGxlIGlzIGRpYWdvbmFsIHJpZ2h0L2Rvd24gZnJvbSAoOCw2KVxuICBlcXVhbChnZXRMaW5lUHJvZHVjdCg4LCA2LCAxLCAxKSwgMTc4ODY5NiwgXCJEaWFnb25hbCB2YWx1ZSBzaG93biBpbiBleGFtcGxlIGVxdWFscyAxLDc4OCw2OTZcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICBtYXggPVxuICAgIHByb2R1Y3Q6IDFcbiAgICBpOiAwXG4gICAgajogMFxuICAgIGRpcjogXCJyaWdodFwiXG5cbiAgZm9yIGogaW4gWzAuLi4yMF1cbiAgICBmb3IgaSBpbiBbMC4uLjIwXVxuICAgICAgcCA9IGdldExpbmVQcm9kdWN0KGksIGosIDEsIDApXG4gICAgICBpZiBtYXgucHJvZHVjdCA8IHBcbiAgICAgICAgbWF4LnByb2R1Y3QgPSBwXG4gICAgICAgIG1heC5pID0gaVxuICAgICAgICBtYXguaiA9IGpcbiAgICAgICAgbWF4LmRpciA9IFwicmlnaHRcIlxuICAgICAgcCA9IGdldExpbmVQcm9kdWN0KGksIGosIDAsIDEpXG4gICAgICBpZiBtYXgucHJvZHVjdCA8IHBcbiAgICAgICAgbWF4LnByb2R1Y3QgPSBwXG4gICAgICAgIG1heC5pID0gaVxuICAgICAgICBtYXguaiA9IGpcbiAgICAgICAgbWF4LmRpciA9IFwiZG93blwiXG4gICAgICBwID0gZ2V0TGluZVByb2R1Y3QoaSwgaiwgMSwgMSlcbiAgICAgIGlmIG1heC5wcm9kdWN0IDwgcFxuICAgICAgICBtYXgucHJvZHVjdCA9IHBcbiAgICAgICAgbWF4LmkgPSBpXG4gICAgICAgIG1heC5qID0galxuICAgICAgICBtYXguZGlyID0gXCJkaWFnb25hbFwiXG5cbiAgcmV0dXJuIG1heFxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMTI6IEhpZ2hseSBkaXZpc2libGUgdHJpYW5ndWxhciBudW1iZXJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuVGhlIHNlcXVlbmNlIG9mIHRyaWFuZ2xlIG51bWJlcnMgaXMgZ2VuZXJhdGVkIGJ5IGFkZGluZyB0aGUgbmF0dXJhbCBudW1iZXJzLiBTbyB0aGUgN3RoIHRyaWFuZ2xlIG51bWJlciB3b3VsZCBiZVxuXG4gICAgICAgICAgICAgICAgICAgICAgMSArIDIgKyAzICsgNCArIDUgKyA2ICsgNyA9IDI4LlxuXG5UaGUgZmlyc3QgdGVuIHRlcm1zIHdvdWxkIGJlOlxuXG4gICAgICAgICAgICAgICAgICAgICAgMSwgMywgNiwgMTAsIDE1LCAyMSwgMjgsIDM2LCA0NSwgNTUsIC4uLlxuXG5MZXQgdXMgbGlzdCB0aGUgZmFjdG9ycyBvZiB0aGUgZmlyc3Qgc2V2ZW4gdHJpYW5nbGUgbnVtYmVyczpcblxuIDE6IDFcbiAzOiAxLDNcbiA2OiAxLDIsMyw2XG4xMDogMSwyLDUsMTBcbjE1OiAxLDMsNSwxNVxuMjE6IDEsMyw3LDIxXG4yODogMSwyLDQsNywxNCwyOFxuXG5XZSBjYW4gc2VlIHRoYXQgMjggaXMgdGhlIGZpcnN0IHRyaWFuZ2xlIG51bWJlciB0byBoYXZlIG92ZXIgZml2ZSBkaXZpc29ycy5cblxuV2hhdCBpcyB0aGUgdmFsdWUgb2YgdGhlIGZpcnN0IHRyaWFuZ2xlIG51bWJlciB0byBoYXZlIG92ZXIgZml2ZSBodW5kcmVkIGRpdmlzb3JzP1xuXG5cIlwiXCJcblxubWF0aCA9IHJlcXVpcmUgXCJtYXRoXCJcblxuIyBUaGlzIGZ1bmN0aW9uIGRvZXMgaXRzIGJlc3QgdG8gbGV2ZXJhZ2UgUmFtYW51amFuJ3MgXCJUYXUgZnVuY3Rpb25cIixcbiMgd2hpY2ggaXMgc3VwcG9zZWQgdG8gZ2l2ZSB0aGUgbnVtYmVyIG9mIHBvc2l0aXZlIGRpdmlzb3JzLlxuI1xuIyBUaGUgaWRlYSBpczpcbiMgKiBGb3IgcHJpbWVzLCBUKHBeaykgPSBrICsgMVxuIyAqIEZvciBhbnkgbnVtYmVycyB3aG9zZSBHQ0QgaXMgMSwgVChtbikgPSBUKG0pICogVChuKVxuI1xuIyBJIGFscmVhZHkgaGF2ZSBhIG1ldGhvZCB0byBwcmltZSBmYWN0b3IgYSBudW1iZXIsIHNvIEknbGwgbGV2ZXJhZ2VcbiMgZXZlcnkgZ3JvdXBpbmcgb2YgdGhlIHNhbWUgcHJpbWUgbnVtYmVyIGFzIHRoZSBmaXJzdCBjYXNlLCBhbmRcbiMgbXVsdGlwbHkgdGhlbSB0b2dldGhlci5cbiNcbiMgRXhhbXBsZTogMjhcbiNcbiMgMjgncyBwcmltZSBmYWN0b3JzIGFyZSBbMiwgMiwgN10sIG9yICgyXjIgKyA3KVxuI1xuIyBJIGNhbiBhc3N1bWUgdGhhdCB0aGUgR0NEIGJldHdlZW4gYW55IG9mIHRoZSBwcmltZSBzZXRzIGlzIGdvaW5nIHRvIGJlIDEgYmVjYXVzZSBkdWgsXG4jIHdoaWNoIG1lYW5zIHRoYXQ6XG4jXG4jIFQoMjgpID09IFQoMl4yKSAqIFQoNylcbiNcbiMgVCgyXjIpID09IDIgKyAxID09IDNcbiMgVCg3XjEpID09IDEgKyAxID09IDJcbiMgMyAqIDIgPSA2XG4jIDI4IGhhcyA2IGRpdmlzb3JzLlxuI1xuIyBZb3UncmUgbWFkLlxuXG5kaXZpc29yQ291bnQgPSAobikgLT5cbiAgcmV0dXJuIDEgaWYgbiA9PSAxXG5cbiAgZmFjdG9ycyA9IG1hdGgucHJpbWVGYWN0b3JzKG4pXG4gIGNvdW50ID0gMVxuICBsYXN0RmFjdG9yID0gMFxuICBleHBvbmVudCA9IDFcbiAgZm9yIGZhY3RvciBpbiBmYWN0b3JzXG4gICAgaWYgZmFjdG9yID09IGxhc3RGYWN0b3JcbiAgICAgIGV4cG9uZW50KytcbiAgICBlbHNlXG4gICAgICBpZiBsYXN0RmFjdG9yICE9IDBcbiAgICAgICAgICBjb3VudCAqPSBleHBvbmVudCArIDFcbiAgICAgIGxhc3RGYWN0b3IgPSBmYWN0b3JcbiAgICAgIGV4cG9uZW50ID0gMVxuXG4gIGlmIGxhc3RGYWN0b3IgIT0gMFxuICAgICAgY291bnQgKj0gZXhwb25lbnQgKyAxXG5cbiAgcmV0dXJuIGNvdW50XG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGVxdWFsKGRpdmlzb3JDb3VudCggMSksIDEsIFwiIDEgaGFzIDEgZGl2aXNvcnNcIilcbiAgZXF1YWwoZGl2aXNvckNvdW50KCAzKSwgMiwgXCIgMyBoYXMgMiBkaXZpc29yc1wiKVxuICBlcXVhbChkaXZpc29yQ291bnQoIDYpLCA0LCBcIiA2IGhhcyA0IGRpdmlzb3JzXCIpXG4gIGVxdWFsKGRpdmlzb3JDb3VudCgxMCksIDQsIFwiMTAgaGFzIDQgZGl2aXNvcnNcIilcbiAgZXF1YWwoZGl2aXNvckNvdW50KDE1KSwgNCwgXCIxNSBoYXMgNCBkaXZpc29yc1wiKVxuICBlcXVhbChkaXZpc29yQ291bnQoMjEpLCA0LCBcIjIxIGhhcyA0IGRpdmlzb3JzXCIpXG4gIGVxdWFsKGRpdmlzb3JDb3VudCgyOCksIDYsIFwiMjggaGFzIDYgZGl2aXNvcnNcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICBuID0gMVxuICBzdGVwID0gMlxuXG4gIGxvb3BcbiAgICBjb3VudCA9IGRpdmlzb3JDb3VudChuKVxuICAgIGlmIGNvdW50ID4gNTAwXG4gICAgICByZXR1cm4geyBuOiBuLCBjb3VudDogY291bnQgfVxuXG4gICAgIyBuZXh0IHRyaWFuZ3VsYXIgbnVtYmVyXG4gICAgbiArPSBzdGVwXG4gICAgc3RlcCsrXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAxMzogTGFyZ2Ugc3VtXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuV29yayBvdXQgdGhlIGZpcnN0IHRlbiBkaWdpdHMgb2YgdGhlIHN1bSBvZiB0aGUgZm9sbG93aW5nIG9uZS1odW5kcmVkIDUwLWRpZ2l0IG51bWJlcnMuXG5cbjM3MTA3Mjg3NTMzOTAyMTAyNzk4Nzk3OTk4MjIwODM3NTkwMjQ2NTEwMTM1NzQwMjUwXG40NjM3NjkzNzY3NzQ5MDAwOTcxMjY0ODEyNDg5Njk3MDA3ODA1MDQxNzAxODI2MDUzOFxuNzQzMjQ5ODYxOTk1MjQ3NDEwNTk0NzQyMzMzMDk1MTMwNTgxMjM3MjY2MTczMDk2MjlcbjkxOTQyMjEzMzYzNTc0MTYxNTcyNTIyNDMwNTYzMzAxODExMDcyNDA2MTU0OTA4MjUwXG4yMzA2NzU4ODIwNzUzOTM0NjE3MTE3MTk4MDMxMDQyMTA0NzUxMzc3ODA2MzI0NjY3NlxuODkyNjE2NzA2OTY2MjM2MzM4MjAxMzYzNzg0MTgzODM2ODQxNzg3MzQzNjE3MjY3NTdcbjI4MTEyODc5ODEyODQ5OTc5NDA4MDY1NDgxOTMxNTkyNjIxNjkxMjc1ODg5ODMyNzM4XG40NDI3NDIyODkxNzQzMjUyMDMyMTkyMzU4OTQyMjg3Njc5NjQ4NzY3MDI3MjE4OTMxOFxuNDc0NTE0NDU3MzYwMDEzMDY0MzkwOTExNjcyMTY4NTY4NDQ1ODg3MTE2MDMxNTMyNzZcbjcwMzg2NDg2MTA1ODQzMDI1NDM5OTM5NjE5ODI4OTE3NTkzNjY1Njg2NzU3OTM0OTUxXG42MjE3NjQ1NzE0MTg1NjU2MDYyOTUwMjE1NzIyMzE5NjU4Njc1NTA3OTMyNDE5MzMzMVxuNjQ5MDYzNTI0NjI3NDE5MDQ5MjkxMDE0MzI0NDU4MTM4MjI2NjMzNDc5NDQ3NTgxNzhcbjkyNTc1ODY3NzE4MzM3MjE3NjYxOTYzNzUxNTkwNTc5MjM5NzI4MjQ1NTk4ODM4NDA3XG41ODIwMzU2NTMyNTM1OTM5OTAwODQwMjYzMzU2ODk0ODgzMDE4OTQ1ODYyODIyNzgyOFxuODAxODExOTkzODQ4MjYyODIwMTQyNzgxOTQxMzk5NDA1Njc1ODcxNTExNzAwOTQzOTBcbjM1Mzk4NjY0MzcyODI3MTEyNjUzODI5OTg3MjQwNzg0NDczMDUzMTkwMTA0MjkzNTg2XG44NjUxNTUwNjAwNjI5NTg2NDg2MTUzMjA3NTI3MzM3MTk1OTE5MTQyMDUxNzI1NTgyOVxuNzE2OTM4ODg3MDc3MTU0NjY0OTkxMTU1OTM0ODc2MDM1MzI5MjE3MTQ5NzAwNTY5MzhcbjU0MzcwMDcwNTc2ODI2Njg0NjI0NjIxNDk1NjUwMDc2NDcxNzg3Mjk0NDM4Mzc3NjA0XG41MzI4MjY1NDEwODc1NjgyODQ0MzE5MTE5MDYzNDY5NDAzNzg1NTIxNzc3OTI5NTE0NVxuMzYxMjMyNzI1MjUwMDAyOTYwNzEwNzUwODI1NjM4MTU2NTY3MTA4ODUyNTgzNTA3MjFcbjQ1ODc2NTc2MTcyNDEwOTc2NDQ3MzM5MTEwNjA3MjE4MjY1MjM2ODc3MjIzNjM2MDQ1XG4xNzQyMzcwNjkwNTg1MTg2MDY2MDQ0ODIwNzYyMTIwOTgxMzI4Nzg2MDczMzk2OTQxMlxuODExNDI2NjA0MTgwODY4MzA2MTkzMjg0NjA4MTExOTEwNjE1NTY5NDA1MTI2ODk2OTJcbjUxOTM0MzI1NDUxNzI4Mzg4NjQxOTE4MDQ3MDQ5MjkzMjE1MDU4NjQyNTYzMDQ5NDgzXG42MjQ2NzIyMTY0ODQzNTA3NjIwMTcyNzkxODAzOTk0NDY5MzAwNDczMjk1NjM0MDY5MVxuMTU3MzI0NDQzODY5MDgxMjU3OTQ1MTQwODkwNTc3MDYyMjk0MjkxOTcxMDc5MjgyMDlcbjU1MDM3Njg3NTI1Njc4NzczMDkxODYyNTQwNzQ0OTY5ODQ0NTA4MzMwMzkzNjgyMTI2XG4xODMzNjM4NDgyNTMzMDE1NDY4NjE5NjEyNDM0ODc2NzY4MTI5NzUzNDM3NTk0NjUxNVxuODAzODYyODc1OTI4Nzg0OTAyMDE1MjE2ODU1NTQ4Mjg3MTcyMDEyMTkyNTc3NjY5NTRcbjc4MTgyODMzNzU3OTkzMTAzNjE0NzQwMzU2ODU2NDQ5MDk1NTI3MDk3ODY0Nzk3NTgxXG4xNjcyNjMyMDEwMDQzNjg5Nzg0MjU1MzUzOTkyMDkzMTgzNzQ0MTQ5NzgwNjg2MDk4NFxuNDg0MDMwOTgxMjkwNzc3OTE3OTkwODgyMTg3OTUzMjczNjQ0NzU2NzU1OTA4NDgwMzBcbjg3MDg2OTg3NTUxMzkyNzExODU0NTE3MDc4NTQ0MTYxODUyNDI0MzIwNjkzMTUwMzMyXG41OTk1OTQwNjg5NTc1NjUzNjc4MjEwNzA3NDkyNjk2NjUzNzY3NjMyNjIzNTQ0NzIxMFxuNjk3OTM5NTA2Nzk2NTI2OTQ3NDI1OTc3MDk3MzkxNjY2OTM3NjMwNDI2MzM5ODcwODVcbjQxMDUyNjg0NzA4Mjk5MDg1MjExMzk5NDI3MzY1NzM0MTE2MTgyNzYwMzE1MDAxMjcxXG42NTM3ODYwNzM2MTUwMTA4MDg1NzAwOTE0OTkzOTUxMjU1NzAyODE5ODc0NjAwNDM3NVxuMzU4MjkwMzUzMTc0MzQ3MTczMjY5MzIxMjM1NzgxNTQ5ODI2Mjk3NDI1NTI3MzczMDdcbjk0OTUzNzU5NzY1MTA1MzA1OTQ2OTY2MDY3NjgzMTU2NTc0Mzc3MTY3NDAxODc1Mjc1XG44ODkwMjgwMjU3MTczMzIyOTYxOTE3NjY2ODcxMzgxOTkzMTgxMTA0ODc3MDE5MDI3MVxuMjUyNjc2ODAyNzYwNzgwMDMwMTM2Nzg2ODA5OTI1MjU0NjM0MDEwNjE2MzI4NjY1MjZcbjM2MjcwMjE4NTQwNDk3NzA1NTg1NjI5OTQ2NTgwNjM2MjM3OTkzMTQwNzQ2MjU1OTYyXG4yNDA3NDQ4NjkwODIzMTE3NDk3Nzc5MjM2NTQ2NjI1NzI0NjkyMzMyMjgxMDkxNzE0MVxuOTE0MzAyODgxOTcxMDMyODg1OTc4MDY2Njk3NjA4OTI5Mzg2MzgyODUwMjUzMzM0MDNcbjM0NDEzMDY1NTc4MDE2MTI3ODE1OTIxODE1MDA1NTYxODY4ODM2NDY4NDIwMDkwNDcwXG4yMzA1MzA4MTE3MjgxNjQzMDQ4NzYyMzc5MTk2OTg0MjQ4NzI1NTAzNjYzODc4NDU4M1xuMTE0ODc2OTY5MzIxNTQ5MDI4MTA0MjQwMjAxMzgzMzUxMjQ0NjIxODE0NDE3NzM0NzBcbjYzNzgzMjk5NDkwNjM2MjU5NjY2NDk4NTg3NjE4MjIxMjI1MjI1NTEyNDg2NzY0NTMzXG42NzcyMDE4Njk3MTY5ODU0NDMxMjQxOTU3MjQwOTkxMzk1OTAwODk1MjMxMDA1ODgyMlxuOTU1NDgyNTUzMDAyNjM1MjA3ODE1MzIyOTY3OTYyNDk0ODE2NDE5NTM4NjgyMTg3NzRcbjc2MDg1MzI3MTMyMjg1NzIzMTEwNDI0ODAzNDU2MTI0ODY3Njk3MDY0NTA3OTk1MjM2XG4zNzc3NDI0MjUzNTQxMTI5MTY4NDI3Njg2NTUzODkyNjIwNTAyNDkxMDMyNjU3Mjk2N1xuMjM3MDE5MTMyNzU3MjU2NzUyODU2NTMyNDgyNTgyNjU0NjMwOTIyMDcwNTg1OTY1MjJcbjI5Nzk4ODYwMjcyMjU4MzMxOTEzMTI2Mzc1MTQ3MzQxOTk0ODg5NTM0NzY1NzQ1NTAxXG4xODQ5NTcwMTQ1NDg3OTI4ODk4NDg1NjgyNzcyNjA3NzcxMzcyMTQwMzc5ODg3OTcxNVxuMzgyOTgyMDM3ODMwMzE0NzM1Mjc3MjE1ODAzNDgxNDQ1MTM0OTEzNzMyMjY2NTEzODFcbjM0ODI5NTQzODI5MTk5OTE4MTgwMjc4OTE2NTIyNDMxMDI3MzkyMjUxMTIyODY5NTM5XG40MDk1Nzk1MzA2NjQwNTIzMjYzMjUzODA0NDEwMDA1OTY1NDkzOTE1OTg3OTU5MzYzNVxuMjk3NDYxNTIxODU1MDIzNzEzMDc2NDIyNTUxMjExODM2OTM4MDM1ODAzODg1ODQ5MDNcbjQxNjk4MTE2MjIyMDcyOTc3MTg2MTU4MjM2Njc4NDI0Njg5MTU3OTkzNTMyOTYxOTIyXG42MjQ2Nzk1NzE5NDQwMTI2OTA0Mzg3NzEwNzI3NTA0ODEwMjM5MDg5NTUyMzU5NzQ1N1xuMjMxODk3MDY3NzI1NDc5MTUwNjE1MDU1MDQ5NTM5MjI5Nzk1MzA5MDExMjk5Njc1MTlcbjg2MTg4MDg4MjI1ODc1MzE0NTI5NTg0MDk5MjUxMjAzODI5MDA5NDA3NzcwNzc1NjcyXG4xMTMwNjczOTcwODMwNDcyNDQ4MzgxNjUzMzg3MzUwMjM0MDg0NTY0NzA1ODA3NzMwOFxuODI5NTkxNzQ3NjcxNDAzNjMxOTgwMDgxODcxMjkwMTE4NzU0OTEzMTA1NDcxMjY1ODFcbjk3NjIzMzMxMDQ0ODE4Mzg2MjY5NTE1NDU2MzM0OTI2MzY2NTcyODk3NTYzNDAwNTAwXG40Mjg0NjI4MDE4MzUxNzA3MDUyNzgzMTgzOTQyNTg4MjE0NTUyMTIyNzI1MTI1MDMyN1xuNTUxMjE2MDM1NDY5ODEyMDA1ODE3NjIxNjUyMTI4Mjc2NTI3NTE2OTEyOTY4OTc3ODlcbjMyMjM4MTk1NzM0MzI5MzM5OTQ2NDM3NTAxOTA3ODM2OTQ1NzY1ODgzMzUyMzk5ODg2XG43NTUwNjE2NDk2NTE4NDc3NTE4MDczODE2ODgzNzg2MTA5MTUyNzM1NzkyOTcwMTMzN1xuNjIxNzc4NDI3NTIxOTI2MjM0MDE5NDIzOTk2MzkxNjgwNDQ5ODM5OTMxNzMzMTI3MzFcbjMyOTI0MTg1NzA3MTQ3MzQ5NTY2OTE2Njc0Njg3NjM0NjYwOTE1MDM1OTE0Njc3NTA0XG45OTUxODY3MTQzMDIzNTIxOTYyODg5NDg5MDEwMjQyMzMyNTExNjkxMzYxOTYyNjYyMlxuNzMyNjc0NjA4MDA1OTE1NDc0NzE4MzA3OTgzOTI4Njg1MzUyMDY5NDY5NDQ1NDA3MjRcbjc2ODQxODIyNTI0Njc0NDE3MTYxNTE0MDM2NDI3OTgyMjczMzQ4MDU1NTU2MjE0ODE4XG45NzE0MjYxNzkxMDM0MjU5ODY0NzIwNDUxNjg5Mzk4OTQyMjE3OTgyNjA4ODA3Njg1MlxuODc3ODM2NDYxODI3OTkzNDYzMTM3Njc3NTQzMDc4MDkzNjMzMzMwMTg5ODI2NDIwOTBcbjEwODQ4ODAyNTIxNjc0NjcwODgzMjE1MTIwMTg1ODgzNTQzMjIzODEyODc2OTUyNzg2XG43MTMyOTYxMjQ3NDc4MjQ2NDUzODYzNjk5MzAwOTA0OTMxMDM2MzYxOTc2Mzg3ODAzOVxuNjIxODQwNzM1NzIzOTk3OTQyMjM0MDYyMzUzOTM4MDgzMzk2NTEzMjc0MDgwMTExMTZcbjY2NjI3ODkxOTgxNDg4MDg3Nzk3OTQxODc2ODc2MTQ0MjMwMDMwOTg0NDkwODUxNDExXG42MDY2MTgyNjI5MzY4MjgzNjc2NDc0NDc3OTIzOTE4MDMzNTExMDk4OTA2OTc5MDcxNFxuODU3ODY5NDQwODk1NTI5OTA2NTM2NDA0NDc0MjU1NzYwODM2NTk5NzY2NDU3OTUwOTZcbjY2MDI0Mzk2NDA5OTA1Mzg5NjA3MTIwMTk4MjE5OTc2MDQ3NTk5NDkwMTk3MjMwMjk3XG42NDkxMzk4MjY4MDAzMjk3MzE1NjAzNzEyMDA0MTM3NzkwMzc4NTU2NjA4NTA4OTI1MlxuMTY3MzA5MzkzMTk4NzI3NTAyNzU0Njg5MDY5MDM3MDc1Mzk0MTMwNDI2NTIzMTUwMTFcbjk0ODA5Mzc3MjQ1MDQ4Nzk1MTUwOTU0MTAwOTIxNjQ1ODYzNzU0NzEwNTk4NDM2NzkxXG43ODYzOTE2NzAyMTE4NzQ5MjQzMTk5NTcwMDY0MTkxNzk2OTc3NzU5OTAyODMwMDY5OVxuMTUzNjg3MTM3MTE5MzY2MTQ5NTI4MTEzMDU4NzYzODAyNzg0MTA3NTQ0NDk3MzMwNzhcbjQwNzg5OTIzMTE1NTM1NTYyNTYxMTQyMzIyNDIzMjU1MDMzNjg1NDQyNDg4OTE3MzUzXG40NDg4OTkxMTUwMTQ0MDY0ODAyMDM2OTA2ODA2Mzk2MDY3MjMyMjE5MzIwNDE0OTUzNVxuNDE1MDMxMjg4ODAzMzk1MzYwNTMyOTkzNDAzNjgwMDY5Nzc3MTA2NTA1NjY2MzE5NTRcbjgxMjM0ODgwNjczMjEwMTQ2NzM5MDU4NTY4NTU3OTM0NTgxNDAzNjI3ODIyNzAzMjgwXG44MjYxNjU3MDc3Mzk0ODMyNzU5MjIzMjg0NTk0MTcwNjUyNTA5NDUxMjMyNTIzMDYwOFxuMjI5MTg4MDIwNTg3NzczMTk3MTk4Mzk0NTAxODA4ODgwNzI0Mjk2NjE5ODA4MTExOTdcbjc3MTU4NTQyNTAyMDE2NTQ1MDkwNDEzMjQ1ODA5Nzg2ODgyNzc4OTQ4NzIxODU5NjE3XG43MjEwNzgzODQzNTA2OTE4NjE1NTQzNTY2Mjg4NDA2MjI1NzQ3MzY5MjI4NDUwOTUxNlxuMjA4NDk2MDM5ODAxMzQwMDE3MjM5MzA2NzE2NjY4MjM1NTUyNDUyNTI4MDQ2MDk3MjJcbjUzNTAzNTM0MjI2NDcyNTI0MjUwODc0MDU0MDc1NTkxNzg5NzgxMjY0MzMwMzMxNjkwXG5cblwiXCJcIlxuXG5udW1iZXJzID0gW1xuICAzNzEwNzI4NzUzMzkwMjEwMjc5ODc5Nzk5ODIyMDgzNzU5MDI0NjUxMDEzNTc0MDI1MFxuICA0NjM3NjkzNzY3NzQ5MDAwOTcxMjY0ODEyNDg5Njk3MDA3ODA1MDQxNzAxODI2MDUzOFxuICA3NDMyNDk4NjE5OTUyNDc0MTA1OTQ3NDIzMzMwOTUxMzA1ODEyMzcyNjYxNzMwOTYyOVxuICA5MTk0MjIxMzM2MzU3NDE2MTU3MjUyMjQzMDU2MzMwMTgxMTA3MjQwNjE1NDkwODI1MFxuICAyMzA2NzU4ODIwNzUzOTM0NjE3MTE3MTk4MDMxMDQyMTA0NzUxMzc3ODA2MzI0NjY3NlxuICA4OTI2MTY3MDY5NjYyMzYzMzgyMDEzNjM3ODQxODM4MzY4NDE3ODczNDM2MTcyNjc1N1xuICAyODExMjg3OTgxMjg0OTk3OTQwODA2NTQ4MTkzMTU5MjYyMTY5MTI3NTg4OTgzMjczOFxuICA0NDI3NDIyODkxNzQzMjUyMDMyMTkyMzU4OTQyMjg3Njc5NjQ4NzY3MDI3MjE4OTMxOFxuICA0NzQ1MTQ0NTczNjAwMTMwNjQzOTA5MTE2NzIxNjg1Njg0NDU4ODcxMTYwMzE1MzI3NlxuICA3MDM4NjQ4NjEwNTg0MzAyNTQzOTkzOTYxOTgyODkxNzU5MzY2NTY4Njc1NzkzNDk1MVxuICA2MjE3NjQ1NzE0MTg1NjU2MDYyOTUwMjE1NzIyMzE5NjU4Njc1NTA3OTMyNDE5MzMzMVxuICA2NDkwNjM1MjQ2Mjc0MTkwNDkyOTEwMTQzMjQ0NTgxMzgyMjY2MzM0Nzk0NDc1ODE3OFxuICA5MjU3NTg2NzcxODMzNzIxNzY2MTk2Mzc1MTU5MDU3OTIzOTcyODI0NTU5ODgzODQwN1xuICA1ODIwMzU2NTMyNTM1OTM5OTAwODQwMjYzMzU2ODk0ODgzMDE4OTQ1ODYyODIyNzgyOFxuICA4MDE4MTE5OTM4NDgyNjI4MjAxNDI3ODE5NDEzOTk0MDU2NzU4NzE1MTE3MDA5NDM5MFxuICAzNTM5ODY2NDM3MjgyNzExMjY1MzgyOTk4NzI0MDc4NDQ3MzA1MzE5MDEwNDI5MzU4NlxuICA4NjUxNTUwNjAwNjI5NTg2NDg2MTUzMjA3NTI3MzM3MTk1OTE5MTQyMDUxNzI1NTgyOVxuICA3MTY5Mzg4ODcwNzcxNTQ2NjQ5OTExNTU5MzQ4NzYwMzUzMjkyMTcxNDk3MDA1NjkzOFxuICA1NDM3MDA3MDU3NjgyNjY4NDYyNDYyMTQ5NTY1MDA3NjQ3MTc4NzI5NDQzODM3NzYwNFxuICA1MzI4MjY1NDEwODc1NjgyODQ0MzE5MTE5MDYzNDY5NDAzNzg1NTIxNzc3OTI5NTE0NVxuICAzNjEyMzI3MjUyNTAwMDI5NjA3MTA3NTA4MjU2MzgxNTY1NjcxMDg4NTI1ODM1MDcyMVxuICA0NTg3NjU3NjE3MjQxMDk3NjQ0NzMzOTExMDYwNzIxODI2NTIzNjg3NzIyMzYzNjA0NVxuICAxNzQyMzcwNjkwNTg1MTg2MDY2MDQ0ODIwNzYyMTIwOTgxMzI4Nzg2MDczMzk2OTQxMlxuICA4MTE0MjY2MDQxODA4NjgzMDYxOTMyODQ2MDgxMTE5MTA2MTU1Njk0MDUxMjY4OTY5MlxuICA1MTkzNDMyNTQ1MTcyODM4ODY0MTkxODA0NzA0OTI5MzIxNTA1ODY0MjU2MzA0OTQ4M1xuICA2MjQ2NzIyMTY0ODQzNTA3NjIwMTcyNzkxODAzOTk0NDY5MzAwNDczMjk1NjM0MDY5MVxuICAxNTczMjQ0NDM4NjkwODEyNTc5NDUxNDA4OTA1NzcwNjIyOTQyOTE5NzEwNzkyODIwOVxuICA1NTAzNzY4NzUyNTY3ODc3MzA5MTg2MjU0MDc0NDk2OTg0NDUwODMzMDM5MzY4MjEyNlxuICAxODMzNjM4NDgyNTMzMDE1NDY4NjE5NjEyNDM0ODc2NzY4MTI5NzUzNDM3NTk0NjUxNVxuICA4MDM4NjI4NzU5Mjg3ODQ5MDIwMTUyMTY4NTU1NDgyODcxNzIwMTIxOTI1Nzc2Njk1NFxuICA3ODE4MjgzMzc1Nzk5MzEwMzYxNDc0MDM1Njg1NjQ0OTA5NTUyNzA5Nzg2NDc5NzU4MVxuICAxNjcyNjMyMDEwMDQzNjg5Nzg0MjU1MzUzOTkyMDkzMTgzNzQ0MTQ5NzgwNjg2MDk4NFxuICA0ODQwMzA5ODEyOTA3Nzc5MTc5OTA4ODIxODc5NTMyNzM2NDQ3NTY3NTU5MDg0ODAzMFxuICA4NzA4Njk4NzU1MTM5MjcxMTg1NDUxNzA3ODU0NDE2MTg1MjQyNDMyMDY5MzE1MDMzMlxuICA1OTk1OTQwNjg5NTc1NjUzNjc4MjEwNzA3NDkyNjk2NjUzNzY3NjMyNjIzNTQ0NzIxMFxuICA2OTc5Mzk1MDY3OTY1MjY5NDc0MjU5NzcwOTczOTE2NjY5Mzc2MzA0MjYzMzk4NzA4NVxuICA0MTA1MjY4NDcwODI5OTA4NTIxMTM5OTQyNzM2NTczNDExNjE4Mjc2MDMxNTAwMTI3MVxuICA2NTM3ODYwNzM2MTUwMTA4MDg1NzAwOTE0OTkzOTUxMjU1NzAyODE5ODc0NjAwNDM3NVxuICAzNTgyOTAzNTMxNzQzNDcxNzMyNjkzMjEyMzU3ODE1NDk4MjYyOTc0MjU1MjczNzMwN1xuICA5NDk1Mzc1OTc2NTEwNTMwNTk0Njk2NjA2NzY4MzE1NjU3NDM3NzE2NzQwMTg3NTI3NVxuICA4ODkwMjgwMjU3MTczMzIyOTYxOTE3NjY2ODcxMzgxOTkzMTgxMTA0ODc3MDE5MDI3MVxuICAyNTI2NzY4MDI3NjA3ODAwMzAxMzY3ODY4MDk5MjUyNTQ2MzQwMTA2MTYzMjg2NjUyNlxuICAzNjI3MDIxODU0MDQ5NzcwNTU4NTYyOTk0NjU4MDYzNjIzNzk5MzE0MDc0NjI1NTk2MlxuICAyNDA3NDQ4NjkwODIzMTE3NDk3Nzc5MjM2NTQ2NjI1NzI0NjkyMzMyMjgxMDkxNzE0MVxuICA5MTQzMDI4ODE5NzEwMzI4ODU5NzgwNjY2OTc2MDg5MjkzODYzODI4NTAyNTMzMzQwM1xuICAzNDQxMzA2NTU3ODAxNjEyNzgxNTkyMTgxNTAwNTU2MTg2ODgzNjQ2ODQyMDA5MDQ3MFxuICAyMzA1MzA4MTE3MjgxNjQzMDQ4NzYyMzc5MTk2OTg0MjQ4NzI1NTAzNjYzODc4NDU4M1xuICAxMTQ4NzY5NjkzMjE1NDkwMjgxMDQyNDAyMDEzODMzNTEyNDQ2MjE4MTQ0MTc3MzQ3MFxuICA2Mzc4MzI5OTQ5MDYzNjI1OTY2NjQ5ODU4NzYxODIyMTIyNTIyNTUxMjQ4Njc2NDUzM1xuICA2NzcyMDE4Njk3MTY5ODU0NDMxMjQxOTU3MjQwOTkxMzk1OTAwODk1MjMxMDA1ODgyMlxuICA5NTU0ODI1NTMwMDI2MzUyMDc4MTUzMjI5Njc5NjI0OTQ4MTY0MTk1Mzg2ODIxODc3NFxuICA3NjA4NTMyNzEzMjI4NTcyMzExMDQyNDgwMzQ1NjEyNDg2NzY5NzA2NDUwNzk5NTIzNlxuICAzNzc3NDI0MjUzNTQxMTI5MTY4NDI3Njg2NTUzODkyNjIwNTAyNDkxMDMyNjU3Mjk2N1xuICAyMzcwMTkxMzI3NTcyNTY3NTI4NTY1MzI0ODI1ODI2NTQ2MzA5MjIwNzA1ODU5NjUyMlxuICAyOTc5ODg2MDI3MjI1ODMzMTkxMzEyNjM3NTE0NzM0MTk5NDg4OTUzNDc2NTc0NTUwMVxuICAxODQ5NTcwMTQ1NDg3OTI4ODk4NDg1NjgyNzcyNjA3NzcxMzcyMTQwMzc5ODg3OTcxNVxuICAzODI5ODIwMzc4MzAzMTQ3MzUyNzcyMTU4MDM0ODE0NDUxMzQ5MTM3MzIyNjY1MTM4MVxuICAzNDgyOTU0MzgyOTE5OTkxODE4MDI3ODkxNjUyMjQzMTAyNzM5MjI1MTEyMjg2OTUzOVxuICA0MDk1Nzk1MzA2NjQwNTIzMjYzMjUzODA0NDEwMDA1OTY1NDkzOTE1OTg3OTU5MzYzNVxuICAyOTc0NjE1MjE4NTUwMjM3MTMwNzY0MjI1NTEyMTE4MzY5MzgwMzU4MDM4ODU4NDkwM1xuICA0MTY5ODExNjIyMjA3Mjk3NzE4NjE1ODIzNjY3ODQyNDY4OTE1Nzk5MzUzMjk2MTkyMlxuICA2MjQ2Nzk1NzE5NDQwMTI2OTA0Mzg3NzEwNzI3NTA0ODEwMjM5MDg5NTUyMzU5NzQ1N1xuICAyMzE4OTcwNjc3MjU0NzkxNTA2MTUwNTUwNDk1MzkyMjk3OTUzMDkwMTEyOTk2NzUxOVxuICA4NjE4ODA4ODIyNTg3NTMxNDUyOTU4NDA5OTI1MTIwMzgyOTAwOTQwNzc3MDc3NTY3MlxuICAxMTMwNjczOTcwODMwNDcyNDQ4MzgxNjUzMzg3MzUwMjM0MDg0NTY0NzA1ODA3NzMwOFxuICA4Mjk1OTE3NDc2NzE0MDM2MzE5ODAwODE4NzEyOTAxMTg3NTQ5MTMxMDU0NzEyNjU4MVxuICA5NzYyMzMzMTA0NDgxODM4NjI2OTUxNTQ1NjMzNDkyNjM2NjU3Mjg5NzU2MzQwMDUwMFxuICA0Mjg0NjI4MDE4MzUxNzA3MDUyNzgzMTgzOTQyNTg4MjE0NTUyMTIyNzI1MTI1MDMyN1xuICA1NTEyMTYwMzU0Njk4MTIwMDU4MTc2MjE2NTIxMjgyNzY1Mjc1MTY5MTI5Njg5Nzc4OVxuICAzMjIzODE5NTczNDMyOTMzOTk0NjQzNzUwMTkwNzgzNjk0NTc2NTg4MzM1MjM5OTg4NlxuICA3NTUwNjE2NDk2NTE4NDc3NTE4MDczODE2ODgzNzg2MTA5MTUyNzM1NzkyOTcwMTMzN1xuICA2MjE3Nzg0Mjc1MjE5MjYyMzQwMTk0MjM5OTYzOTE2ODA0NDk4Mzk5MzE3MzMxMjczMVxuICAzMjkyNDE4NTcwNzE0NzM0OTU2NjkxNjY3NDY4NzYzNDY2MDkxNTAzNTkxNDY3NzUwNFxuICA5OTUxODY3MTQzMDIzNTIxOTYyODg5NDg5MDEwMjQyMzMyNTExNjkxMzYxOTYyNjYyMlxuICA3MzI2NzQ2MDgwMDU5MTU0NzQ3MTgzMDc5ODM5Mjg2ODUzNTIwNjk0Njk0NDU0MDcyNFxuICA3Njg0MTgyMjUyNDY3NDQxNzE2MTUxNDAzNjQyNzk4MjI3MzM0ODA1NTU1NjIxNDgxOFxuICA5NzE0MjYxNzkxMDM0MjU5ODY0NzIwNDUxNjg5Mzk4OTQyMjE3OTgyNjA4ODA3Njg1MlxuICA4Nzc4MzY0NjE4Mjc5OTM0NjMxMzc2Nzc1NDMwNzgwOTM2MzMzMzAxODk4MjY0MjA5MFxuICAxMDg0ODgwMjUyMTY3NDY3MDg4MzIxNTEyMDE4NTg4MzU0MzIyMzgxMjg3Njk1Mjc4NlxuICA3MTMyOTYxMjQ3NDc4MjQ2NDUzODYzNjk5MzAwOTA0OTMxMDM2MzYxOTc2Mzg3ODAzOVxuICA2MjE4NDA3MzU3MjM5OTc5NDIyMzQwNjIzNTM5MzgwODMzOTY1MTMyNzQwODAxMTExNlxuICA2NjYyNzg5MTk4MTQ4ODA4Nzc5Nzk0MTg3Njg3NjE0NDIzMDAzMDk4NDQ5MDg1MTQxMVxuICA2MDY2MTgyNjI5MzY4MjgzNjc2NDc0NDc3OTIzOTE4MDMzNTExMDk4OTA2OTc5MDcxNFxuICA4NTc4Njk0NDA4OTU1Mjk5MDY1MzY0MDQ0NzQyNTU3NjA4MzY1OTk3NjY0NTc5NTA5NlxuICA2NjAyNDM5NjQwOTkwNTM4OTYwNzEyMDE5ODIxOTk3NjA0NzU5OTQ5MDE5NzIzMDI5N1xuICA2NDkxMzk4MjY4MDAzMjk3MzE1NjAzNzEyMDA0MTM3NzkwMzc4NTU2NjA4NTA4OTI1MlxuICAxNjczMDkzOTMxOTg3Mjc1MDI3NTQ2ODkwNjkwMzcwNzUzOTQxMzA0MjY1MjMxNTAxMVxuICA5NDgwOTM3NzI0NTA0ODc5NTE1MDk1NDEwMDkyMTY0NTg2Mzc1NDcxMDU5ODQzNjc5MVxuICA3ODYzOTE2NzAyMTE4NzQ5MjQzMTk5NTcwMDY0MTkxNzk2OTc3NzU5OTAyODMwMDY5OVxuICAxNTM2ODcxMzcxMTkzNjYxNDk1MjgxMTMwNTg3NjM4MDI3ODQxMDc1NDQ0OTczMzA3OFxuICA0MDc4OTkyMzExNTUzNTU2MjU2MTE0MjMyMjQyMzI1NTAzMzY4NTQ0MjQ4ODkxNzM1M1xuICA0NDg4OTkxMTUwMTQ0MDY0ODAyMDM2OTA2ODA2Mzk2MDY3MjMyMjE5MzIwNDE0OTUzNVxuICA0MTUwMzEyODg4MDMzOTUzNjA1MzI5OTM0MDM2ODAwNjk3NzcxMDY1MDU2NjYzMTk1NFxuICA4MTIzNDg4MDY3MzIxMDE0NjczOTA1ODU2ODU1NzkzNDU4MTQwMzYyNzgyMjcwMzI4MFxuICA4MjYxNjU3MDc3Mzk0ODMyNzU5MjIzMjg0NTk0MTcwNjUyNTA5NDUxMjMyNTIzMDYwOFxuICAyMjkxODgwMjA1ODc3NzMxOTcxOTgzOTQ1MDE4MDg4ODA3MjQyOTY2MTk4MDgxMTE5N1xuICA3NzE1ODU0MjUwMjAxNjU0NTA5MDQxMzI0NTgwOTc4Njg4Mjc3ODk0ODcyMTg1OTYxN1xuICA3MjEwNzgzODQzNTA2OTE4NjE1NTQzNTY2Mjg4NDA2MjI1NzQ3MzY5MjI4NDUwOTUxNlxuICAyMDg0OTYwMzk4MDEzNDAwMTcyMzkzMDY3MTY2NjgyMzU1NTI0NTI1MjgwNDYwOTcyMlxuICA1MzUwMzUzNDIyNjQ3MjUyNDI1MDg3NDA1NDA3NTU5MTc4OTc4MTI2NDMzMDMzMTY5MFxuXVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHN1bSA9IDBcbiAgZm9yIG4gaW4gbnVtYmVyc1xuICAgIHN1bSArPSBuXG5cbiAgc3RyID0gU3RyaW5nKHN1bSkucmVwbGFjZSgvXFwuL2csIFwiXCIpLnN1YnN0cigwLCAxMClcbiAgcmV0dXJuIHN0clxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMTQ6IExvbmdlc3QgQ29sbGF0eiBzZXF1ZW5jZVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblRoZSBmb2xsb3dpbmcgaXRlcmF0aXZlIHNlcXVlbmNlIGlzIGRlZmluZWQgZm9yIHRoZSBzZXQgb2YgcG9zaXRpdmUgaW50ZWdlcnM6XG5cbiAgICBuIC0+IG4vMiAgICAobiBpcyBldmVuKVxuICAgIG4gLT4gM24gKyAxIChuIGlzIG9kZClcblxuVXNpbmcgdGhlIHJ1bGUgYWJvdmUgYW5kIHN0YXJ0aW5nIHdpdGggMTMsIHdlIGdlbmVyYXRlIHRoZSBmb2xsb3dpbmcgc2VxdWVuY2U6XG5cbiAgICAxMyAtPiA0MCAtPiAyMCAtPiAxMCAtPiA1IC0+IDE2IC0+IDggLT4gNCAtPiAyIC0+IDFcblxuSXQgY2FuIGJlIHNlZW4gdGhhdCB0aGlzIHNlcXVlbmNlIChzdGFydGluZyBhdCAxMyBhbmQgZmluaXNoaW5nIGF0IDEpIGNvbnRhaW5zIDEwIHRlcm1zLiBBbHRob3VnaCBpdCBoYXMgbm90IGJlZW4gcHJvdmVkIHlldCAoQ29sbGF0eiBQcm9ibGVtKSwgaXQgaXMgdGhvdWdodCB0aGF0IGFsbCBzdGFydGluZyBudW1iZXJzIGZpbmlzaCBhdCAxLlxuXG5XaGljaCBzdGFydGluZyBudW1iZXIsIHVuZGVyIG9uZSBtaWxsaW9uLCBwcm9kdWNlcyB0aGUgbG9uZ2VzdCBjaGFpbj9cblxuTk9URTogT25jZSB0aGUgY2hhaW4gc3RhcnRzIHRoZSB0ZXJtcyBhcmUgYWxsb3dlZCB0byBnbyBhYm92ZSBvbmUgbWlsbGlvbi5cblxuXCJcIlwiXG5cbmNvbGxhdHpDYWNoZSA9IHt9XG5cbmNvbGxhdHpDaGFpbkxlbmd0aCA9IChzdGFydGluZ1ZhbHVlKSAtPlxuICBuID0gc3RhcnRpbmdWYWx1ZVxuICB0b0JlQ2FjaGVkID0gW11cblxuICBsb29wXG4gICAgYnJlYWsgaWYgY29sbGF0ekNhY2hlLmhhc093blByb3BlcnR5KG4pXG5cbiAgICAjIHJlbWVtYmVyIHRoYXQgd2UgZmFpbGVkIHRvIGNhY2hlIHRoaXMgZW50cnlcbiAgICB0b0JlQ2FjaGVkLnB1c2gobilcblxuICAgIGlmIG4gPT0gMVxuICAgICAgYnJlYWtcblxuICAgIGlmIChuICUgMikgPT0gMFxuICAgICAgbiA9IE1hdGguZmxvb3IobiAvIDIpXG4gICAgZWxzZVxuICAgICAgbiA9IChuICogMykgKyAxXG5cbiAgIyBTaW5jZSB3ZSBsZWZ0IGJyZWFkY3J1bWJzIGRvd24gdGhlIHRyYWlsIG9mIHRoaW5ncyB3ZSBoYXZlbid0IGNhY2hlZFxuICAjIHdhbGsgYmFjayBkb3duIHRoZSB0cmFpbCBhbmQgY2FjaGUgYWxsIHRoZSBlbnRyaWVzIGZvdW5kIGFsb25nIHRoZSB3YXlcbiAgbGVuID0gdG9CZUNhY2hlZC5sZW5ndGhcbiAgZm9yIHYsaSBpbiB0b0JlQ2FjaGVkXG4gICAgY29sbGF0ekNhY2hlW3ZdID0gY29sbGF0ekNhY2hlW25dICsgKGxlbiAtIGkpXG5cbiAgcmV0dXJuIGNvbGxhdHpDYWNoZVtzdGFydGluZ1ZhbHVlXVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBjb2xsYXR6Q2FjaGUgPSB7IFwiMVwiOiAxIH1cbiAgZXF1YWwoY29sbGF0ekNoYWluTGVuZ3RoKDEzKSwgMTAsIFwiMTMgaGFzIGEgY29sbGF0eiBjaGFpbiBvZiAxMFwiKVxuICBlcXVhbChjb2xsYXR6Q2hhaW5MZW5ndGgoMjYpLCAxMSwgXCIyNiBoYXMgYSBjb2xsYXR6IGNoYWluIG9mIDExXCIpXG4gIGVxdWFsKGNvbGxhdHpDaGFpbkxlbmd0aCggMSksICAxLCBcIjEgaGFzIGEgY29sbGF0eiBjaGFpbiBvZiAxXCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgY29sbGF0ekNhY2hlID0geyBcIjFcIjogMSB9XG5cbiAgbWF4Q2hhaW4gPSAwXG4gIG1heENoYWluTGVuZ3RoID0gMFxuICBmb3IgaSBpbiBbMS4uLjEwMDAwMDBdXG4gICAgY2hhaW5MZW5ndGggPSBjb2xsYXR6Q2hhaW5MZW5ndGgoaSlcbiAgICBpZiBtYXhDaGFpbkxlbmd0aCA8IGNoYWluTGVuZ3RoXG4gICAgICBtYXhDaGFpbkxlbmd0aCA9IGNoYWluTGVuZ3RoXG4gICAgICBtYXhDaGFpbiA9IGlcblxuICByZXR1cm4geyBhbnN3ZXI6IG1heENoYWluLCBjaGFpbkxlbmd0aDogbWF4Q2hhaW5MZW5ndGggfVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMTU6IExhdHRpY2UgcGF0aHNcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuU3RhcnRpbmcgaW4gdGhlIHRvcCBsZWZ0IGNvcm5lciBvZiBhIDLDlzIgZ3JpZCwgYW5kIG9ubHkgYmVpbmcgYWJsZSB0byBtb3ZlIHRvIHRoZSByaWdodCBhbmQgZG93biwgdGhlcmUgYXJlIGV4YWN0bHkgNiByb3V0ZXMgdG8gdGhlIGJvdHRvbSByaWdodCBjb3JuZXIuXG5cbiAgICAocGljdHVyZSBzaG93aW5nIDYgcGF0aHM6IFJSREQsIFJEUkQsIFJERFIsIERSUkQsIERSRFIsIEREUlIpXG5cbkhvdyBtYW55IHN1Y2ggcm91dGVzIGFyZSB0aGVyZSB0aHJvdWdoIGEgMjDDlzIwIGdyaWQ/XG5cblwiXCJcIlxuXG5tYXRoID0gcmVxdWlyZSBcIm1hdGhcIlxuXG5sYXR0aWNlID0gKG4pIC0+XG4gIHJldHVybiBtYXRoLm5DcihuICogMiwgbilcblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgZXF1YWwobGF0dGljZSgxKSwgMiwgXCIxeDEgbGF0dGljZSBoYXMgMiBwYXRoc1wiKVxuICBlcXVhbChsYXR0aWNlKDIpLCA2LCBcIjJ4MiBsYXR0aWNlIGhhcyA2IHBhdGhzXCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgcmV0dXJuIGxhdHRpY2UoMjApXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAxNjogUG93ZXIgZGlnaXQgc3VtXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuMl4xNSA9IDMyNzY4IGFuZCB0aGUgc3VtIG9mIGl0cyBkaWdpdHMgaXMgMyArIDIgKyA3ICsgNiArIDggPSAyNi5cblxuV2hhdCBpcyB0aGUgc3VtIG9mIHRoZSBkaWdpdHMgb2YgdGhlIG51bWJlciAyXjEwMDA/XG5cblwiXCJcIlxuXG5tYXRoID0gcmVxdWlyZSBcIm1hdGhcIlxuYmlnSW50ID0gcmVxdWlyZSBcImJpZy1pbnRlZ2VyXCJcblxuTUFYX0VYUE9ORU5UID0gNTBcblxucG93ZXJEaWdpdFN1bSA9ICh4LCB5KSAtPlxuICBudW1iZXIgPSBiaWdJbnQoMSlcbiAgd2hpbGUgeSAhPSAwXG4gICAgZXhwb25lbnQgPSB5XG4gICAgaWYgZXhwb25lbnQgPiBNQVhfRVhQT05FTlRcbiAgICAgIGV4cG9uZW50ID0gTUFYX0VYUE9ORU5UXG4gICAgeSAtPSBleHBvbmVudFxuICAgIG51bWJlciA9IG51bWJlci5tdWx0aXBseSBNYXRoLmZsb29yKE1hdGgucG93KHgsIGV4cG9uZW50KSlcbiAgZGlnaXRzID0gU3RyaW5nKG51bWJlcilcblxuICBzdW0gPSAwXG4gIGZvciBkIGluIGRpZ2l0c1xuICAgIHN1bSArPSBwYXJzZUludChkKVxuICByZXR1cm4gc3VtXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGVxdWFsKHBvd2VyRGlnaXRTdW0oMiwgMTUpLCAyNiwgXCJzdW0gb2YgZGlnaXRzIG9mIDJeMTUgaXMgMjZcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICByZXR1cm4gcG93ZXJEaWdpdFN1bSgyLCAxMDAwKVxuIiwicm9vdCA9IGV4cG9ydHMgPyB0aGlzXG5cbiMgU2lldmUgd2FzIGJsaW5kbHkgdGFrZW4vYWRhcHRlZCBmcm9tIFJvc2V0dGFDb2RlLiBET05UIEVWRU4gQ0FSRVxuY2xhc3MgSW5jcmVtZW50YWxTaWV2ZVxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAbiA9IDBcblxuICBuZXh0OiAtPlxuICAgIEBuICs9IDJcbiAgICBpZiBAbiA8IDdcbiAgICAgIGlmIEBuIDwgM1xuICAgICAgICBAbiA9IDFcbiAgICAgICAgcmV0dXJuIDJcbiAgICAgIGlmIEBuIDwgNVxuICAgICAgICByZXR1cm4gM1xuICAgICAgQGRpY3QgPSB7fVxuICAgICAgQGJwcyA9IG5ldyBJbmNyZW1lbnRhbFNpZXZlKClcbiAgICAgIEBicHMubmV4dCgpXG4gICAgICBAcCA9IEBicHMubmV4dCgpXG4gICAgICBAcSA9IEBwICogQHBcbiAgICAgIHJldHVybiA1XG4gICAgZWxzZVxuICAgICAgcyA9IEBkaWN0W0BuXVxuICAgICAgaWYgbm90IHNcbiAgICAgICAgaWYgQG4gPCBAcVxuICAgICAgICAgIHJldHVybiBAblxuICAgICAgICBlbHNlXG4gICAgICAgICAgcDIgPSBAcCA8PCAxXG4gICAgICAgICAgQGRpY3RbQG4gKyBwMl0gPSBwMlxuICAgICAgICAgIEBwID0gQGJwcy5uZXh0KClcbiAgICAgICAgICBAcSA9IEBwICogQHBcbiAgICAgICAgICByZXR1cm4gQG5leHQoKVxuICAgICAgZWxzZVxuICAgICAgICBkZWxldGUgQGRpY3RbQG5dXG4gICAgICAgIG54dCA9IEBuICsgc1xuICAgICAgICB3aGlsZSAoQGRpY3Rbbnh0XSlcbiAgICAgICAgICBueHQgKz0gc1xuICAgICAgICBAZGljdFtueHRdID0gc1xuICAgICAgICByZXR1cm4gQG5leHQoKVxuXG5yb290LkluY3JlbWVudGFsU2lldmUgPSBJbmNyZW1lbnRhbFNpZXZlXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgU2hhbWVsZXNzbHkgcGlsZmVyZWQvYWRvcHRlZCBmcm9tIGh0dHA6Ly93d3cuamF2YXNjcmlwdGVyLm5ldC9mYXEvbnVtYmVyaXNwcmltZS5odG1cblxucm9vdC5sZWFzdEZhY3RvciA9IChuKSAtPlxuICByZXR1cm4gTmFOIGlmIGlzTmFOKG4pIG9yIG5vdCBpc0Zpbml0ZShuKVxuICByZXR1cm4gMCBpZiBuID09IDBcbiAgcmV0dXJuIDEgaWYgKG4gJSAxKSAhPSAwIG9yIChuICogbikgPCAyXG4gIHJldHVybiAyIGlmIChuICUgMikgPT0gMFxuICByZXR1cm4gMyBpZiAobiAlIDMpID09IDBcbiAgcmV0dXJuIDUgaWYgKG4gJSA1KSA9PSAwXG5cbiAgbSA9IE1hdGguc3FydCBuXG4gIGZvciBpIGluIFs3Li5tXSBieSAzMFxuICAgIHJldHVybiBpICAgIGlmIChuICUgaSkgICAgICA9PSAwXG4gICAgcmV0dXJuIGkrNCAgaWYgKG4gJSAoaSs0KSkgID09IDBcbiAgICByZXR1cm4gaSs2ICBpZiAobiAlIChpKzYpKSAgPT0gMFxuICAgIHJldHVybiBpKzEwIGlmIChuICUgKGkrMTApKSA9PSAwXG4gICAgcmV0dXJuIGkrMTIgaWYgKG4gJSAoaSsxMikpID09IDBcbiAgICByZXR1cm4gaSsxNiBpZiAobiAlIChpKzE2KSkgPT0gMFxuICAgIHJldHVybiBpKzIyIGlmIChuICUgKGkrMjIpKSA9PSAwXG4gICAgcmV0dXJuIGkrMjQgaWYgKG4gJSAoaSsyNCkpID09IDBcblxuICByZXR1cm4gblxuXG5yb290LmlzUHJpbWUgPSAobikgLT5cbiAgaWYgaXNOYU4obikgb3Igbm90IGlzRmluaXRlKG4pIG9yIChuICUgMSkgIT0gMCBvciAobiA8IDIpXG4gICAgcmV0dXJuIGZhbHNlXG4gIGlmIG4gPT0gcm9vdC5sZWFzdEZhY3RvcihuKVxuICAgIHJldHVybiB0cnVlXG5cbiAgcmV0dXJuIGZhbHNlXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxucm9vdC5wcmltZUZhY3RvcnMgPSAobikgLT5cbiAgcmV0dXJuIFsxXSBpZiBuID09IDFcblxuICBmYWN0b3JzID0gW11cbiAgd2hpbGUgbm90IHJvb3QuaXNQcmltZShuKVxuICAgIGZhY3RvciA9IHJvb3QubGVhc3RGYWN0b3IobilcbiAgICBmYWN0b3JzLnB1c2ggZmFjdG9yXG4gICAgbiAvPSBmYWN0b3JcbiAgZmFjdG9ycy5wdXNoIG5cbiAgcmV0dXJuIGZhY3RvcnNcblxucm9vdC5mYWN0b3JpYWwgPSAobikgLT5cbiAgZiA9IG5cbiAgd2hpbGUgbiA+IDFcbiAgICBuLS1cbiAgICBmICo9IG5cbiAgcmV0dXJuIGZcblxucm9vdC5uQ3IgPSAobiwgcikgLT5cbiAgcmV0dXJuIE1hdGguZmxvb3Iocm9vdC5mYWN0b3JpYWwobikgLyAocm9vdC5mYWN0b3JpYWwocikgKiByb290LmZhY3RvcmlhbChuIC0gcikpKVxuIiwiTEFTVF9QUk9CTEVNID0gMTZcclxuXHJcbnJvb3QgPSB3aW5kb3cgIyBleHBvcnRzID8gdGhpc1xyXG5cclxucm9vdC5lc2NhcGVkU3RyaW5naWZ5ID0gKG8pIC0+XHJcbiAgc3RyID0gSlNPTi5zdHJpbmdpZnkobylcclxuICBzdHIgPSBzdHIucmVwbGFjZShcIl1cIiwgXCJcXFxcXVwiKVxyXG4gIHJldHVybiBzdHJcclxuXHJcbnJvb3QucnVuQWxsID0gLT5cclxuICBsYXN0UHV6emxlID0gTEFTVF9QUk9CTEVNXHJcbiAgbmV4dEluZGV4ID0gMFxyXG5cclxuICBsb2FkTmV4dFNjcmlwdCA9IC0+XHJcbiAgICBpZiBuZXh0SW5kZXggPCBsYXN0UHV6emxlXHJcbiAgICAgIG5leHRJbmRleCsrXHJcbiAgICAgIHJ1blRlc3QobmV4dEluZGV4LCBsb2FkTmV4dFNjcmlwdClcclxuICBsb2FkTmV4dFNjcmlwdCgpXHJcblxyXG5yb290Lml0ZXJhdGVQcm9ibGVtcyA9IChhcmdzKSAtPlxyXG5cclxuICBpbmRleFRvUHJvY2VzcyA9IG51bGxcclxuICBpZiBhcmdzLmVuZEluZGV4ID4gMFxyXG4gICAgaWYgYXJncy5zdGFydEluZGV4IDw9IGFyZ3MuZW5kSW5kZXhcclxuICAgICAgaW5kZXhUb1Byb2Nlc3MgPSBhcmdzLnN0YXJ0SW5kZXhcclxuICAgICAgYXJncy5zdGFydEluZGV4KytcclxuICBlbHNlXHJcbiAgICBpZiBhcmdzLmxpc3QubGVuZ3RoID4gMFxyXG4gICAgICBpbmRleFRvUHJvY2VzcyA9IGFyZ3MubGlzdC5zaGlmdCgpXHJcblxyXG4gIGlmIGluZGV4VG9Qcm9jZXNzICE9IG51bGxcclxuICAgIGl0ZXJhdGVOZXh0ID0gLT5cclxuICAgICAgd2luZG93LmFyZ3MgPSBhcmdzXHJcbiAgICAgIHJ1blRlc3QgaW5kZXhUb1Byb2Nlc3MsIC0+XHJcbiAgICAgICAgaXRlcmF0ZVByb2JsZW1zKGFyZ3MpXHJcbiAgICBpdGVyYXRlTmV4dCgpXHJcblxyXG5yb290LnJ1blRlc3QgPSAoaW5kZXgsIGNiKSAtPlxyXG4gIG1vZHVsZU5hbWUgPSBcImUjeygnMDAwJytpbmRleCkuc2xpY2UoLTMpfVwiXHJcbiAgd2luZG93LmluZGV4ID0gaW5kZXhcclxuICBwcm9ibGVtID0gcmVxdWlyZShtb2R1bGVOYW1lKVxyXG4gIHByb2JsZW0ucHJvY2VzcygpXHJcbiAgd2luZG93LnNldFRpbWVvdXQoY2IsIDApIGlmIGNiXHJcblxyXG5jbGFzcyBQcm9ibGVtXHJcbiAgY29uc3RydWN0b3I6IChAZGVzY3JpcHRpb24pIC0+XHJcbiAgICBAaW5kZXggPSB3aW5kb3cuaW5kZXhcclxuICAgIGxpbmVzID0gQGRlc2NyaXB0aW9uLnNwbGl0KC9cXG4vKVxyXG4gICAgbGluZXMuc2hpZnQoKSB3aGlsZSBsaW5lcy5sZW5ndGggPiAwIGFuZCBsaW5lc1swXS5sZW5ndGggPT0gMFxyXG4gICAgQHRpdGxlID0gbGluZXMuc2hpZnQoKVxyXG4gICAgQGxpbmUgPSBsaW5lcy5zaGlmdCgpXHJcbiAgICBAZGVzY3JpcHRpb24gPSBsaW5lcy5qb2luKFwiXFxuXCIpXHJcblxyXG4gIG5vdzogLT5cclxuICAgIHJldHVybiBpZiB3aW5kb3cucGVyZm9ybWFuY2UgdGhlbiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCkgZWxzZSBuZXcgRGF0ZSgpLmdldFRpbWUoKVxyXG5cclxuICBwcm9jZXNzOiAtPlxyXG4gICAgaWYgd2luZG93LmFyZ3MuZGVzY3JpcHRpb25cclxuICAgICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjNDQ0NDQ0O11fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX11cXG5cIlxyXG5cclxuICAgIGZvcm1hdHRlZFRpdGxlID0gJC50ZXJtaW5hbC5mb3JtYXQoXCJbWzsjZmZhYTAwO10je0B0aXRsZX1dXCIpXHJcbiAgICB1cmwgPSBcIj9jPSN7d2luZG93LmFyZ3MuY21kfV8je0BpbmRleH1cIlxyXG4gICAgaWYgd2luZG93LmFyZ3MudmVyYm9zZVxyXG4gICAgICB1cmwgKz0gXCJfdlwiXHJcbiAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIjxhIGhyZWY9XFxcIiN7dXJsfVxcXCI+I3tmb3JtYXR0ZWRUaXRsZX08L2E+XCIsIHsgcmF3OiB0cnVlIH1cclxuXHJcbiAgICBpZiB3aW5kb3cuYXJncy5kZXNjcmlwdGlvblxyXG4gICAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIltbOyM0NDQ0NDQ7XSN7QGxpbmV9XVwiXHJcbiAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2NjY2NlZTtdI3tAZGVzY3JpcHRpb259XVxcblwiXHJcbiAgICAgIHNvdXJjZUxpbmUgPSAkLnRlcm1pbmFsLmZvcm1hdChcIltbOyM0NDQ0NDQ7XVNvdXJjZTpdIFwiKVxyXG4gICAgICBzb3VyY2VMaW5lICs9IFwiIDxhIGhyZWY9XFxcInNyYy9lI3soJzAwMCcrQGluZGV4KS5zbGljZSgtMyl9LmNvZmZlZVxcXCI+XCIgKyAkLnRlcm1pbmFsLmZvcm1hdChcIltbOyM3NzMzMDA7XUxvY2FsXVwiKSArIFwiPC9hPiBcIlxyXG4gICAgICBzb3VyY2VMaW5lICs9ICQudGVybWluYWwuZm9ybWF0KFwiW1s7IzQ0NDQ0NDtdL11cIilcclxuICAgICAgc291cmNlTGluZSArPSBcIiA8YSBocmVmPVxcXCJodHRwczovL2dpdGh1Yi5jb20vam9lZHJhZ28vZXVsZXIvYmxvYi9tYXN0ZXIvc3JjL2UjeygnMDAwJytAaW5kZXgpLnNsaWNlKC0zKX0uY29mZmVlXFxcIj5cIiArICQudGVybWluYWwuZm9ybWF0KFwiW1s7Izc3MzMwMDtdR2l0aHViXVwiKSArIFwiPC9hPlwiXHJcbiAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIHNvdXJjZUxpbmUsIHsgcmF3OiB0cnVlIH1cclxuICAgICAgaWYgd2luZG93LmFyZ3MudGVzdCBvciB3aW5kb3cuYXJncy5hbnN3ZXJcclxuICAgICAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIlwiXHJcblxyXG4gICAgdGVzdEZ1bmMgPSBAdGVzdFxyXG4gICAgYW5zd2VyRnVuYyA9IEBhbnN3ZXJcclxuXHJcbiAgICBpZiB3aW5kb3cuYXJncy50ZXN0XHJcbiAgICAgIGlmIHRlc3RGdW5jID09IHVuZGVmaW5lZFxyXG4gICAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7IzQ0NDQ0NDtdIChubyB0ZXN0cyldXCJcclxuICAgICAgZWxzZVxyXG4gICAgICAgIHRlc3RGdW5jKClcclxuXHJcbiAgICBpZiB3aW5kb3cuYXJncy5hbnN3ZXJcclxuICAgICAgc3RhcnQgPSBAbm93KClcclxuICAgICAgYW5zd2VyID0gYW5zd2VyRnVuYygpXHJcbiAgICAgIGVuZCA9IEBub3coKVxyXG4gICAgICBtcyA9IGVuZCAtIHN0YXJ0XHJcbiAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2ZmZmZmZjtdIC0+IF1bWzsjYWFmZmFhO11BbnN3ZXI6XSAoW1s7I2FhZmZmZjtdI3ttcy50b0ZpeGVkKDEpfW1zXSk6IFtbOyNmZmZmZmY7XSN7ZXNjYXBlZFN0cmluZ2lmeShhbnN3ZXIpfV1cIlxyXG5cclxucm9vdC5Qcm9ibGVtID0gUHJvYmxlbVxyXG5cclxucm9vdC5vayA9ICh2LCBtc2cpIC0+XHJcbiAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjZmZmZmZmO10gKiAgXSN7dn06ICN7bXNnfVwiXHJcblxyXG5yb290LmVxdWFsID0gKGEsIGIsIG1zZykgLT5cclxuICBpZiBhID09IGJcclxuICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2ZmZmZmZjtdICogIF1bWzsjNTU1NTU1O11QQVNTOiAje21zZ31dXCJcclxuICBlbHNlXHJcbiAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIltbOyNmZmZmZmY7XSAqICBdW1s7I2ZmYWFhYTtdRkFJTDogI3ttc2d9ICgje2F9ICE9ICN7Yn0pXVwiXHJcblxyXG5yb290Lm9uQ29tbWFuZCA9IChjb21tYW5kKSA9PlxyXG4gIHJldHVybiBpZiBjb21tYW5kLmxlbmd0aCA9PSAwXHJcbiAgY21kID0gJC50ZXJtaW5hbC5wYXJzZUNvbW1hbmQoY29tbWFuZClcclxuICByZXR1cm4gaWYgY21kLm5hbWUubGVuZ3RoID09IDBcclxuXHJcbiAgYXJncyA9XHJcbiAgICBzdGFydEluZGV4OiAwXHJcbiAgICBlbmRJbmRleDogMFxyXG4gICAgbGlzdDogW11cclxuICAgIHZlcmJvc2U6IGZhbHNlXHJcbiAgICBkZXNjcmlwdGlvbjogZmFsc2VcclxuICAgIHRlc3Q6IGZhbHNlXHJcbiAgICBhbnN3ZXI6IGZhbHNlXHJcblxyXG4gIHByb2Nlc3MgPSB0cnVlXHJcblxyXG4gIGZvciBhcmcgaW4gY21kLmFyZ3NcclxuICAgIGFyZyA9IFN0cmluZyhhcmcpXHJcbiAgICBjb250aW51ZSBpZiBhcmcubGVuZ3RoIDwgMVxyXG4gICAgaWYgYXJnWzBdID09ICd2J1xyXG4gICAgICBhcmdzLnZlcmJvc2UgPSB0cnVlXHJcbiAgICBlbHNlIGlmIGFyZy5tYXRjaCgvXlxcZCskLylcclxuICAgICAgdiA9IHBhcnNlSW50KGFyZylcclxuICAgICAgaWYgKHYgPj0gMSkgYW5kICh2IDw9IExBU1RfUFJPQkxFTSlcclxuICAgICAgICBhcmdzLmxpc3QucHVzaCh2KVxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgcHJvY2VzcyA9IGZhbHNlXHJcbiAgICAgICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjZmZhYWFhO11ObyBzdWNoIHRlc3Q6ICN7dn0gKHZhbGlkIHRlc3RzIDEtI3tMQVNUX1BST0JMRU19KV1cIlxyXG5cclxuICBpZiBhcmdzLmxpc3QubGVuZ3RoID09IDBcclxuICAgIGFyZ3Muc3RhcnRJbmRleCA9IDFcclxuICAgIGFyZ3MuZW5kSW5kZXggPSBMQVNUX1BST0JMRU1cclxuXHJcbiAgIyBTaW5jZSBhbGwgb2Ygb3VyIGNvbW1hbmRzIGhhcHBlbiB0byBoYXZlIHVuaXF1ZSBmaXJzdCBsZXR0ZXJzLCBsZXQgcGVvcGxlIGJlIHN1cGVyIGxhenkvc2lsbHlcclxuICBpZiBjbWQubmFtZVswXSA9PSAnbCdcclxuICAgIGFyZ3MuY21kID0gXCJsaXN0XCJcclxuICBlbHNlIGlmIGNtZC5uYW1lWzBdID09ICdkJ1xyXG4gICAgYXJncy5jbWQgPSBcImRlc2NyaWJlXCJcclxuICAgIGFyZ3MuZGVzY3JpcHRpb24gPSB0cnVlXHJcbiAgZWxzZSBpZiBjbWQubmFtZVswXSA9PSAndCdcclxuICAgIGFyZ3MuY21kID0gXCJ0ZXN0XCJcclxuICAgIGFyZ3MudGVzdCA9IHRydWVcclxuICBlbHNlIGlmIGNtZC5uYW1lWzBdID09ICdhJ1xyXG4gICAgYXJncy5jbWQgPSBcImFuc3dlclwiXHJcbiAgICBhcmdzLmFuc3dlciA9IHRydWVcclxuICBlbHNlIGlmIGNtZC5uYW1lWzBdID09ICdyJ1xyXG4gICAgYXJncy5jbWQgPSBcInJ1blwiXHJcbiAgICBhcmdzLnRlc3QgPSB0cnVlXHJcbiAgICBhcmdzLmFuc3dlciA9IHRydWVcclxuICBlbHNlIGlmIGNtZC5uYW1lWzBdID09ICdkJ1xyXG4gICAgYXJncy5jbWQgPSBcImRlc2NyaWJlXCJcclxuICAgIGFyZ3MuZGVzY3JpcHRpb24gPSB0cnVlXHJcbiAgZWxzZSBpZiBjbWQubmFtZVswXSA9PSAnaCdcclxuICAgIGFyZ3MuY21kID0gXCJoZWxwXCJcclxuICAgIHByb2Nlc3MgPSBmYWxzZVxyXG4gICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJcIlwiXHJcbiAgICBDb21tYW5kczpcclxuXHJcbiAgICAgICAgbGlzdCBbWF0gICAgIC0gTGlzdCBwcm9ibGVtIHRpdGxlc1xyXG4gICAgICAgIGRlc2NyaWJlIFtYXSAtIERpc3BsYXkgZnVsbCBwcm9ibGVtIGRlc2NyaXB0aW9uc1xyXG4gICAgICAgIHRlc3QgW1hdICAgICAtIFJ1biB1bml0IHRlc3RzXHJcbiAgICAgICAgYW5zd2VyIFtYXSAgIC0gVGltZSBhbmQgY2FsY3VsYXRlIGFuc3dlclxyXG4gICAgICAgIHJ1biBbWF0gICAgICAtIHRlc3QgYW5kIGFuc3dlciBjb21iaW5lZFxyXG4gICAgICAgIGhlbHAgICAgICAgICAtIFRoaXMgaGVscFxyXG5cclxuICAgICAgICBJbiBhbGwgb2YgdGhlc2UsIFtYXSBjYW4gYmUgYSBsaXN0IG9mIG9uZSBvciBtb3JlIHByb2JsZW0gbnVtYmVycy4gKGEgdmFsdWUgZnJvbSAxIHRvICN7TEFTVF9QUk9CTEVNfSkuIElmIGFic2VudCwgaXQgaW1wbGllcyBhbGwgcHJvYmxlbXMuXHJcbiAgICAgICAgQWxzbywgYWRkaW5nIHRoZSB3b3JkIFwidmVyYm9zZVwiIHRvIHNvbWUgb2YgdGhlc2UgY29tbWFuZHMgd2lsbCBlbWl0IHRoZSBkZXNjcmlwdGlvbiBiZWZvcmUgcGVyZm9ybWluZyB0aGUgdGFzay5cclxuXHJcbiAgICBcIlwiXCJcclxuICBlbHNlXHJcbiAgICBwcm9jZXNzID0gZmFsc2VcclxuICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2ZmYWFhYTtdVW5rbm93biBjb21tYW5kLl1cIlxyXG5cclxuICBpZiBhcmdzLnZlcmJvc2VcclxuICAgIGFyZ3MuZGVzY3JpcHRpb24gPSB0cnVlXHJcblxyXG4gIGlmIHByb2Nlc3NcclxuICAgIGl0ZXJhdGVQcm9ibGVtcyhhcmdzKVxyXG4iXX0=
