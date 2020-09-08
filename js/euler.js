require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
var bigInt = (function (undefined) {
    "use strict";

    var BASE = 1e7,
        LOG_BASE = 7,
        MAX_INT = 9007199254740992,
        MAX_INT_ARR = smallToArray(MAX_INT),
        DEFAULT_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

    var supportsNativeBigInt = typeof BigInt === "function";

    function Integer(v, radix, alphabet, caseSensitive) {
        if (typeof v === "undefined") return Integer[0];
        if (typeof radix !== "undefined") return +radix === 10 && !alphabet ? parseValue(v) : parseBase(v, radix, alphabet, caseSensitive);
        return parseValue(v);
    }

    function BigInteger(value, sign) {
        this.value = value;
        this.sign = sign;
        this.isSmall = false;
    }
    BigInteger.prototype = Object.create(Integer.prototype);

    function SmallInteger(value) {
        this.value = value;
        this.sign = value < 0;
        this.isSmall = true;
    }
    SmallInteger.prototype = Object.create(Integer.prototype);

    function NativeBigInt(value) {
        this.value = value;
    }
    NativeBigInt.prototype = Object.create(Integer.prototype);

    function isPrecise(n) {
        return -MAX_INT < n && n < MAX_INT;
    }

    function smallToArray(n) { // For performance reasons doesn't reference BASE, need to change this function if BASE changes
        if (n < 1e7)
            return [n];
        if (n < 1e14)
            return [n % 1e7, Math.floor(n / 1e7)];
        return [n % 1e7, Math.floor(n / 1e7) % 1e7, Math.floor(n / 1e14)];
    }

    function arrayToSmall(arr) { // If BASE changes this function may need to change
        trim(arr);
        var length = arr.length;
        if (length < 4 && compareAbs(arr, MAX_INT_ARR) < 0) {
            switch (length) {
                case 0: return 0;
                case 1: return arr[0];
                case 2: return arr[0] + arr[1] * BASE;
                default: return arr[0] + (arr[1] + arr[2] * BASE) * BASE;
            }
        }
        return arr;
    }

    function trim(v) {
        var i = v.length;
        while (v[--i] === 0);
        v.length = i + 1;
    }

    function createArray(length) { // function shamelessly stolen from Yaffle's library https://github.com/Yaffle/BigInteger
        var x = new Array(length);
        var i = -1;
        while (++i < length) {
            x[i] = 0;
        }
        return x;
    }

    function truncate(n) {
        if (n > 0) return Math.floor(n);
        return Math.ceil(n);
    }

    function add(a, b) { // assumes a and b are arrays with a.length >= b.length
        var l_a = a.length,
            l_b = b.length,
            r = new Array(l_a),
            carry = 0,
            base = BASE,
            sum, i;
        for (i = 0; i < l_b; i++) {
            sum = a[i] + b[i] + carry;
            carry = sum >= base ? 1 : 0;
            r[i] = sum - carry * base;
        }
        while (i < l_a) {
            sum = a[i] + carry;
            carry = sum === base ? 1 : 0;
            r[i++] = sum - carry * base;
        }
        if (carry > 0) r.push(carry);
        return r;
    }

    function addAny(a, b) {
        if (a.length >= b.length) return add(a, b);
        return add(b, a);
    }

    function addSmall(a, carry) { // assumes a is array, carry is number with 0 <= carry < MAX_INT
        var l = a.length,
            r = new Array(l),
            base = BASE,
            sum, i;
        for (i = 0; i < l; i++) {
            sum = a[i] - base + carry;
            carry = Math.floor(sum / base);
            r[i] = sum - carry * base;
            carry += 1;
        }
        while (carry > 0) {
            r[i++] = carry % base;
            carry = Math.floor(carry / base);
        }
        return r;
    }

    BigInteger.prototype.add = function (v) {
        var n = parseValue(v);
        if (this.sign !== n.sign) {
            return this.subtract(n.negate());
        }
        var a = this.value, b = n.value;
        if (n.isSmall) {
            return new BigInteger(addSmall(a, Math.abs(b)), this.sign);
        }
        return new BigInteger(addAny(a, b), this.sign);
    };
    BigInteger.prototype.plus = BigInteger.prototype.add;

    SmallInteger.prototype.add = function (v) {
        var n = parseValue(v);
        var a = this.value;
        if (a < 0 !== n.sign) {
            return this.subtract(n.negate());
        }
        var b = n.value;
        if (n.isSmall) {
            if (isPrecise(a + b)) return new SmallInteger(a + b);
            b = smallToArray(Math.abs(b));
        }
        return new BigInteger(addSmall(b, Math.abs(a)), a < 0);
    };
    SmallInteger.prototype.plus = SmallInteger.prototype.add;

    NativeBigInt.prototype.add = function (v) {
        return new NativeBigInt(this.value + parseValue(v).value);
    }
    NativeBigInt.prototype.plus = NativeBigInt.prototype.add;

    function subtract(a, b) { // assumes a and b are arrays with a >= b
        var a_l = a.length,
            b_l = b.length,
            r = new Array(a_l),
            borrow = 0,
            base = BASE,
            i, difference;
        for (i = 0; i < b_l; i++) {
            difference = a[i] - borrow - b[i];
            if (difference < 0) {
                difference += base;
                borrow = 1;
            } else borrow = 0;
            r[i] = difference;
        }
        for (i = b_l; i < a_l; i++) {
            difference = a[i] - borrow;
            if (difference < 0) difference += base;
            else {
                r[i++] = difference;
                break;
            }
            r[i] = difference;
        }
        for (; i < a_l; i++) {
            r[i] = a[i];
        }
        trim(r);
        return r;
    }

    function subtractAny(a, b, sign) {
        var value;
        if (compareAbs(a, b) >= 0) {
            value = subtract(a, b);
        } else {
            value = subtract(b, a);
            sign = !sign;
        }
        value = arrayToSmall(value);
        if (typeof value === "number") {
            if (sign) value = -value;
            return new SmallInteger(value);
        }
        return new BigInteger(value, sign);
    }

    function subtractSmall(a, b, sign) { // assumes a is array, b is number with 0 <= b < MAX_INT
        var l = a.length,
            r = new Array(l),
            carry = -b,
            base = BASE,
            i, difference;
        for (i = 0; i < l; i++) {
            difference = a[i] + carry;
            carry = Math.floor(difference / base);
            difference %= base;
            r[i] = difference < 0 ? difference + base : difference;
        }
        r = arrayToSmall(r);
        if (typeof r === "number") {
            if (sign) r = -r;
            return new SmallInteger(r);
        } return new BigInteger(r, sign);
    }

    BigInteger.prototype.subtract = function (v) {
        var n = parseValue(v);
        if (this.sign !== n.sign) {
            return this.add(n.negate());
        }
        var a = this.value, b = n.value;
        if (n.isSmall)
            return subtractSmall(a, Math.abs(b), this.sign);
        return subtractAny(a, b, this.sign);
    };
    BigInteger.prototype.minus = BigInteger.prototype.subtract;

    SmallInteger.prototype.subtract = function (v) {
        var n = parseValue(v);
        var a = this.value;
        if (a < 0 !== n.sign) {
            return this.add(n.negate());
        }
        var b = n.value;
        if (n.isSmall) {
            return new SmallInteger(a - b);
        }
        return subtractSmall(b, Math.abs(a), a >= 0);
    };
    SmallInteger.prototype.minus = SmallInteger.prototype.subtract;

    NativeBigInt.prototype.subtract = function (v) {
        return new NativeBigInt(this.value - parseValue(v).value);
    }
    NativeBigInt.prototype.minus = NativeBigInt.prototype.subtract;

    BigInteger.prototype.negate = function () {
        return new BigInteger(this.value, !this.sign);
    };
    SmallInteger.prototype.negate = function () {
        var sign = this.sign;
        var small = new SmallInteger(-this.value);
        small.sign = !sign;
        return small;
    };
    NativeBigInt.prototype.negate = function () {
        return new NativeBigInt(-this.value);
    }

    BigInteger.prototype.abs = function () {
        return new BigInteger(this.value, false);
    };
    SmallInteger.prototype.abs = function () {
        return new SmallInteger(Math.abs(this.value));
    };
    NativeBigInt.prototype.abs = function () {
        return new NativeBigInt(this.value >= 0 ? this.value : -this.value);
    }


    function multiplyLong(a, b) {
        var a_l = a.length,
            b_l = b.length,
            l = a_l + b_l,
            r = createArray(l),
            base = BASE,
            product, carry, i, a_i, b_j;
        for (i = 0; i < a_l; ++i) {
            a_i = a[i];
            for (var j = 0; j < b_l; ++j) {
                b_j = b[j];
                product = a_i * b_j + r[i + j];
                carry = Math.floor(product / base);
                r[i + j] = product - carry * base;
                r[i + j + 1] += carry;
            }
        }
        trim(r);
        return r;
    }

    function multiplySmall(a, b) { // assumes a is array, b is number with |b| < BASE
        var l = a.length,
            r = new Array(l),
            base = BASE,
            carry = 0,
            product, i;
        for (i = 0; i < l; i++) {
            product = a[i] * b + carry;
            carry = Math.floor(product / base);
            r[i] = product - carry * base;
        }
        while (carry > 0) {
            r[i++] = carry % base;
            carry = Math.floor(carry / base);
        }
        return r;
    }

    function shiftLeft(x, n) {
        var r = [];
        while (n-- > 0) r.push(0);
        return r.concat(x);
    }

    function multiplyKaratsuba(x, y) {
        var n = Math.max(x.length, y.length);

        if (n <= 30) return multiplyLong(x, y);
        n = Math.ceil(n / 2);

        var b = x.slice(n),
            a = x.slice(0, n),
            d = y.slice(n),
            c = y.slice(0, n);

        var ac = multiplyKaratsuba(a, c),
            bd = multiplyKaratsuba(b, d),
            abcd = multiplyKaratsuba(addAny(a, b), addAny(c, d));

        var product = addAny(addAny(ac, shiftLeft(subtract(subtract(abcd, ac), bd), n)), shiftLeft(bd, 2 * n));
        trim(product);
        return product;
    }

    // The following function is derived from a surface fit of a graph plotting the performance difference
    // between long multiplication and karatsuba multiplication versus the lengths of the two arrays.
    function useKaratsuba(l1, l2) {
        return -0.012 * l1 - 0.012 * l2 + 0.000015 * l1 * l2 > 0;
    }

    BigInteger.prototype.multiply = function (v) {
        var n = parseValue(v),
            a = this.value, b = n.value,
            sign = this.sign !== n.sign,
            abs;
        if (n.isSmall) {
            if (b === 0) return Integer[0];
            if (b === 1) return this;
            if (b === -1) return this.negate();
            abs = Math.abs(b);
            if (abs < BASE) {
                return new BigInteger(multiplySmall(a, abs), sign);
            }
            b = smallToArray(abs);
        }
        if (useKaratsuba(a.length, b.length)) // Karatsuba is only faster for certain array sizes
            return new BigInteger(multiplyKaratsuba(a, b), sign);
        return new BigInteger(multiplyLong(a, b), sign);
    };

    BigInteger.prototype.times = BigInteger.prototype.multiply;

    function multiplySmallAndArray(a, b, sign) { // a >= 0
        if (a < BASE) {
            return new BigInteger(multiplySmall(b, a), sign);
        }
        return new BigInteger(multiplyLong(b, smallToArray(a)), sign);
    }
    SmallInteger.prototype._multiplyBySmall = function (a) {
        if (isPrecise(a.value * this.value)) {
            return new SmallInteger(a.value * this.value);
        }
        return multiplySmallAndArray(Math.abs(a.value), smallToArray(Math.abs(this.value)), this.sign !== a.sign);
    };
    BigInteger.prototype._multiplyBySmall = function (a) {
        if (a.value === 0) return Integer[0];
        if (a.value === 1) return this;
        if (a.value === -1) return this.negate();
        return multiplySmallAndArray(Math.abs(a.value), this.value, this.sign !== a.sign);
    };
    SmallInteger.prototype.multiply = function (v) {
        return parseValue(v)._multiplyBySmall(this);
    };
    SmallInteger.prototype.times = SmallInteger.prototype.multiply;

    NativeBigInt.prototype.multiply = function (v) {
        return new NativeBigInt(this.value * parseValue(v).value);
    }
    NativeBigInt.prototype.times = NativeBigInt.prototype.multiply;

    function square(a) {
        //console.assert(2 * BASE * BASE < MAX_INT);
        var l = a.length,
            r = createArray(l + l),
            base = BASE,
            product, carry, i, a_i, a_j;
        for (i = 0; i < l; i++) {
            a_i = a[i];
            carry = 0 - a_i * a_i;
            for (var j = i; j < l; j++) {
                a_j = a[j];
                product = 2 * (a_i * a_j) + r[i + j] + carry;
                carry = Math.floor(product / base);
                r[i + j] = product - carry * base;
            }
            r[i + l] = carry;
        }
        trim(r);
        return r;
    }

    BigInteger.prototype.square = function () {
        return new BigInteger(square(this.value), false);
    };

    SmallInteger.prototype.square = function () {
        var value = this.value * this.value;
        if (isPrecise(value)) return new SmallInteger(value);
        return new BigInteger(square(smallToArray(Math.abs(this.value))), false);
    };

    NativeBigInt.prototype.square = function (v) {
        return new NativeBigInt(this.value * this.value);
    }

    function divMod1(a, b) { // Left over from previous version. Performs faster than divMod2 on smaller input sizes.
        var a_l = a.length,
            b_l = b.length,
            base = BASE,
            result = createArray(b.length),
            divisorMostSignificantDigit = b[b_l - 1],
            // normalization
            lambda = Math.ceil(base / (2 * divisorMostSignificantDigit)),
            remainder = multiplySmall(a, lambda),
            divisor = multiplySmall(b, lambda),
            quotientDigit, shift, carry, borrow, i, l, q;
        if (remainder.length <= a_l) remainder.push(0);
        divisor.push(0);
        divisorMostSignificantDigit = divisor[b_l - 1];
        for (shift = a_l - b_l; shift >= 0; shift--) {
            quotientDigit = base - 1;
            if (remainder[shift + b_l] !== divisorMostSignificantDigit) {
                quotientDigit = Math.floor((remainder[shift + b_l] * base + remainder[shift + b_l - 1]) / divisorMostSignificantDigit);
            }
            // quotientDigit <= base - 1
            carry = 0;
            borrow = 0;
            l = divisor.length;
            for (i = 0; i < l; i++) {
                carry += quotientDigit * divisor[i];
                q = Math.floor(carry / base);
                borrow += remainder[shift + i] - (carry - q * base);
                carry = q;
                if (borrow < 0) {
                    remainder[shift + i] = borrow + base;
                    borrow = -1;
                } else {
                    remainder[shift + i] = borrow;
                    borrow = 0;
                }
            }
            while (borrow !== 0) {
                quotientDigit -= 1;
                carry = 0;
                for (i = 0; i < l; i++) {
                    carry += remainder[shift + i] - base + divisor[i];
                    if (carry < 0) {
                        remainder[shift + i] = carry + base;
                        carry = 0;
                    } else {
                        remainder[shift + i] = carry;
                        carry = 1;
                    }
                }
                borrow += carry;
            }
            result[shift] = quotientDigit;
        }
        // denormalization
        remainder = divModSmall(remainder, lambda)[0];
        return [arrayToSmall(result), arrayToSmall(remainder)];
    }

    function divMod2(a, b) { // Implementation idea shamelessly stolen from Silent Matt's library http://silentmatt.com/biginteger/
        // Performs faster than divMod1 on larger input sizes.
        var a_l = a.length,
            b_l = b.length,
            result = [],
            part = [],
            base = BASE,
            guess, xlen, highx, highy, check;
        while (a_l) {
            part.unshift(a[--a_l]);
            trim(part);
            if (compareAbs(part, b) < 0) {
                result.push(0);
                continue;
            }
            xlen = part.length;
            highx = part[xlen - 1] * base + part[xlen - 2];
            highy = b[b_l - 1] * base + b[b_l - 2];
            if (xlen > b_l) {
                highx = (highx + 1) * base;
            }
            guess = Math.ceil(highx / highy);
            do {
                check = multiplySmall(b, guess);
                if (compareAbs(check, part) <= 0) break;
                guess--;
            } while (guess);
            result.push(guess);
            part = subtract(part, check);
        }
        result.reverse();
        return [arrayToSmall(result), arrayToSmall(part)];
    }

    function divModSmall(value, lambda) {
        var length = value.length,
            quotient = createArray(length),
            base = BASE,
            i, q, remainder, divisor;
        remainder = 0;
        for (i = length - 1; i >= 0; --i) {
            divisor = remainder * base + value[i];
            q = truncate(divisor / lambda);
            remainder = divisor - q * lambda;
            quotient[i] = q | 0;
        }
        return [quotient, remainder | 0];
    }

    function divModAny(self, v) {
        var value, n = parseValue(v);
        if (supportsNativeBigInt) {
            return [new NativeBigInt(self.value / n.value), new NativeBigInt(self.value % n.value)];
        }
        var a = self.value, b = n.value;
        var quotient;
        if (b === 0) throw new Error("Cannot divide by zero");
        if (self.isSmall) {
            if (n.isSmall) {
                return [new SmallInteger(truncate(a / b)), new SmallInteger(a % b)];
            }
            return [Integer[0], self];
        }
        if (n.isSmall) {
            if (b === 1) return [self, Integer[0]];
            if (b == -1) return [self.negate(), Integer[0]];
            var abs = Math.abs(b);
            if (abs < BASE) {
                value = divModSmall(a, abs);
                quotient = arrayToSmall(value[0]);
                var remainder = value[1];
                if (self.sign) remainder = -remainder;
                if (typeof quotient === "number") {
                    if (self.sign !== n.sign) quotient = -quotient;
                    return [new SmallInteger(quotient), new SmallInteger(remainder)];
                }
                return [new BigInteger(quotient, self.sign !== n.sign), new SmallInteger(remainder)];
            }
            b = smallToArray(abs);
        }
        var comparison = compareAbs(a, b);
        if (comparison === -1) return [Integer[0], self];
        if (comparison === 0) return [Integer[self.sign === n.sign ? 1 : -1], Integer[0]];

        // divMod1 is faster on smaller input sizes
        if (a.length + b.length <= 200)
            value = divMod1(a, b);
        else value = divMod2(a, b);

        quotient = value[0];
        var qSign = self.sign !== n.sign,
            mod = value[1],
            mSign = self.sign;
        if (typeof quotient === "number") {
            if (qSign) quotient = -quotient;
            quotient = new SmallInteger(quotient);
        } else quotient = new BigInteger(quotient, qSign);
        if (typeof mod === "number") {
            if (mSign) mod = -mod;
            mod = new SmallInteger(mod);
        } else mod = new BigInteger(mod, mSign);
        return [quotient, mod];
    }

    BigInteger.prototype.divmod = function (v) {
        var result = divModAny(this, v);
        return {
            quotient: result[0],
            remainder: result[1]
        };
    };
    NativeBigInt.prototype.divmod = SmallInteger.prototype.divmod = BigInteger.prototype.divmod;


    BigInteger.prototype.divide = function (v) {
        return divModAny(this, v)[0];
    };
    NativeBigInt.prototype.over = NativeBigInt.prototype.divide = function (v) {
        return new NativeBigInt(this.value / parseValue(v).value);
    };
    SmallInteger.prototype.over = SmallInteger.prototype.divide = BigInteger.prototype.over = BigInteger.prototype.divide;

    BigInteger.prototype.mod = function (v) {
        return divModAny(this, v)[1];
    };
    NativeBigInt.prototype.mod = NativeBigInt.prototype.remainder = function (v) {
        return new NativeBigInt(this.value % parseValue(v).value);
    };
    SmallInteger.prototype.remainder = SmallInteger.prototype.mod = BigInteger.prototype.remainder = BigInteger.prototype.mod;

    BigInteger.prototype.pow = function (v) {
        var n = parseValue(v),
            a = this.value,
            b = n.value,
            value, x, y;
        if (b === 0) return Integer[1];
        if (a === 0) return Integer[0];
        if (a === 1) return Integer[1];
        if (a === -1) return n.isEven() ? Integer[1] : Integer[-1];
        if (n.sign) {
            return Integer[0];
        }
        if (!n.isSmall) throw new Error("The exponent " + n.toString() + " is too large.");
        if (this.isSmall) {
            if (isPrecise(value = Math.pow(a, b)))
                return new SmallInteger(truncate(value));
        }
        x = this;
        y = Integer[1];
        while (true) {
            if (b & 1 === 1) {
                y = y.times(x);
                --b;
            }
            if (b === 0) break;
            b /= 2;
            x = x.square();
        }
        return y;
    };
    SmallInteger.prototype.pow = BigInteger.prototype.pow;

    NativeBigInt.prototype.pow = function (v) {
        var n = parseValue(v);
        var a = this.value, b = n.value;
        var _0 = BigInt(0), _1 = BigInt(1), _2 = BigInt(2);
        if (b === _0) return Integer[1];
        if (a === _0) return Integer[0];
        if (a === _1) return Integer[1];
        if (a === BigInt(-1)) return n.isEven() ? Integer[1] : Integer[-1];
        if (n.isNegative()) return new NativeBigInt(_0);
        var x = this;
        var y = Integer[1];
        while (true) {
            if ((b & _1) === _1) {
                y = y.times(x);
                --b;
            }
            if (b === _0) break;
            b /= _2;
            x = x.square();
        }
        return y;
    }

    BigInteger.prototype.modPow = function (exp, mod) {
        exp = parseValue(exp);
        mod = parseValue(mod);
        if (mod.isZero()) throw new Error("Cannot take modPow with modulus 0");
        var r = Integer[1],
            base = this.mod(mod);
        if (exp.isNegative()) {
            exp = exp.multiply(Integer[-1]);
            base = base.modInv(mod);
        }
        while (exp.isPositive()) {
            if (base.isZero()) return Integer[0];
            if (exp.isOdd()) r = r.multiply(base).mod(mod);
            exp = exp.divide(2);
            base = base.square().mod(mod);
        }
        return r;
    };
    NativeBigInt.prototype.modPow = SmallInteger.prototype.modPow = BigInteger.prototype.modPow;

    function compareAbs(a, b) {
        if (a.length !== b.length) {
            return a.length > b.length ? 1 : -1;
        }
        for (var i = a.length - 1; i >= 0; i--) {
            if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
        }
        return 0;
    }

    BigInteger.prototype.compareAbs = function (v) {
        var n = parseValue(v),
            a = this.value,
            b = n.value;
        if (n.isSmall) return 1;
        return compareAbs(a, b);
    };
    SmallInteger.prototype.compareAbs = function (v) {
        var n = parseValue(v),
            a = Math.abs(this.value),
            b = n.value;
        if (n.isSmall) {
            b = Math.abs(b);
            return a === b ? 0 : a > b ? 1 : -1;
        }
        return -1;
    };
    NativeBigInt.prototype.compareAbs = function (v) {
        var a = this.value;
        var b = parseValue(v).value;
        a = a >= 0 ? a : -a;
        b = b >= 0 ? b : -b;
        return a === b ? 0 : a > b ? 1 : -1;
    }

    BigInteger.prototype.compare = function (v) {
        // See discussion about comparison with Infinity:
        // https://github.com/peterolson/BigInteger.js/issues/61
        if (v === Infinity) {
            return -1;
        }
        if (v === -Infinity) {
            return 1;
        }

        var n = parseValue(v),
            a = this.value,
            b = n.value;
        if (this.sign !== n.sign) {
            return n.sign ? 1 : -1;
        }
        if (n.isSmall) {
            return this.sign ? -1 : 1;
        }
        return compareAbs(a, b) * (this.sign ? -1 : 1);
    };
    BigInteger.prototype.compareTo = BigInteger.prototype.compare;

    SmallInteger.prototype.compare = function (v) {
        if (v === Infinity) {
            return -1;
        }
        if (v === -Infinity) {
            return 1;
        }

        var n = parseValue(v),
            a = this.value,
            b = n.value;
        if (n.isSmall) {
            return a == b ? 0 : a > b ? 1 : -1;
        }
        if (a < 0 !== n.sign) {
            return a < 0 ? -1 : 1;
        }
        return a < 0 ? 1 : -1;
    };
    SmallInteger.prototype.compareTo = SmallInteger.prototype.compare;

    NativeBigInt.prototype.compare = function (v) {
        if (v === Infinity) {
            return -1;
        }
        if (v === -Infinity) {
            return 1;
        }
        var a = this.value;
        var b = parseValue(v).value;
        return a === b ? 0 : a > b ? 1 : -1;
    }
    NativeBigInt.prototype.compareTo = NativeBigInt.prototype.compare;

    BigInteger.prototype.equals = function (v) {
        return this.compare(v) === 0;
    };
    NativeBigInt.prototype.eq = NativeBigInt.prototype.equals = SmallInteger.prototype.eq = SmallInteger.prototype.equals = BigInteger.prototype.eq = BigInteger.prototype.equals;

    BigInteger.prototype.notEquals = function (v) {
        return this.compare(v) !== 0;
    };
    NativeBigInt.prototype.neq = NativeBigInt.prototype.notEquals = SmallInteger.prototype.neq = SmallInteger.prototype.notEquals = BigInteger.prototype.neq = BigInteger.prototype.notEquals;

    BigInteger.prototype.greater = function (v) {
        return this.compare(v) > 0;
    };
    NativeBigInt.prototype.gt = NativeBigInt.prototype.greater = SmallInteger.prototype.gt = SmallInteger.prototype.greater = BigInteger.prototype.gt = BigInteger.prototype.greater;

    BigInteger.prototype.lesser = function (v) {
        return this.compare(v) < 0;
    };
    NativeBigInt.prototype.lt = NativeBigInt.prototype.lesser = SmallInteger.prototype.lt = SmallInteger.prototype.lesser = BigInteger.prototype.lt = BigInteger.prototype.lesser;

    BigInteger.prototype.greaterOrEquals = function (v) {
        return this.compare(v) >= 0;
    };
    NativeBigInt.prototype.geq = NativeBigInt.prototype.greaterOrEquals = SmallInteger.prototype.geq = SmallInteger.prototype.greaterOrEquals = BigInteger.prototype.geq = BigInteger.prototype.greaterOrEquals;

    BigInteger.prototype.lesserOrEquals = function (v) {
        return this.compare(v) <= 0;
    };
    NativeBigInt.prototype.leq = NativeBigInt.prototype.lesserOrEquals = SmallInteger.prototype.leq = SmallInteger.prototype.lesserOrEquals = BigInteger.prototype.leq = BigInteger.prototype.lesserOrEquals;

    BigInteger.prototype.isEven = function () {
        return (this.value[0] & 1) === 0;
    };
    SmallInteger.prototype.isEven = function () {
        return (this.value & 1) === 0;
    };
    NativeBigInt.prototype.isEven = function () {
        return (this.value & BigInt(1)) === BigInt(0);
    }

    BigInteger.prototype.isOdd = function () {
        return (this.value[0] & 1) === 1;
    };
    SmallInteger.prototype.isOdd = function () {
        return (this.value & 1) === 1;
    };
    NativeBigInt.prototype.isOdd = function () {
        return (this.value & BigInt(1)) === BigInt(1);
    }

    BigInteger.prototype.isPositive = function () {
        return !this.sign;
    };
    SmallInteger.prototype.isPositive = function () {
        return this.value > 0;
    };
    NativeBigInt.prototype.isPositive = SmallInteger.prototype.isPositive;

    BigInteger.prototype.isNegative = function () {
        return this.sign;
    };
    SmallInteger.prototype.isNegative = function () {
        return this.value < 0;
    };
    NativeBigInt.prototype.isNegative = SmallInteger.prototype.isNegative;

    BigInteger.prototype.isUnit = function () {
        return false;
    };
    SmallInteger.prototype.isUnit = function () {
        return Math.abs(this.value) === 1;
    };
    NativeBigInt.prototype.isUnit = function () {
        return this.abs().value === BigInt(1);
    }

    BigInteger.prototype.isZero = function () {
        return false;
    };
    SmallInteger.prototype.isZero = function () {
        return this.value === 0;
    };
    NativeBigInt.prototype.isZero = function () {
        return this.value === BigInt(0);
    }

    BigInteger.prototype.isDivisibleBy = function (v) {
        var n = parseValue(v);
        if (n.isZero()) return false;
        if (n.isUnit()) return true;
        if (n.compareAbs(2) === 0) return this.isEven();
        return this.mod(n).isZero();
    };
    NativeBigInt.prototype.isDivisibleBy = SmallInteger.prototype.isDivisibleBy = BigInteger.prototype.isDivisibleBy;

    function isBasicPrime(v) {
        var n = v.abs();
        if (n.isUnit()) return false;
        if (n.equals(2) || n.equals(3) || n.equals(5)) return true;
        if (n.isEven() || n.isDivisibleBy(3) || n.isDivisibleBy(5)) return false;
        if (n.lesser(49)) return true;
        // we don't know if it's prime: let the other functions figure it out
    }

    function millerRabinTest(n, a) {
        var nPrev = n.prev(),
            b = nPrev,
            r = 0,
            d, t, i, x;
        while (b.isEven()) b = b.divide(2), r++;
        next: for (i = 0; i < a.length; i++) {
            if (n.lesser(a[i])) continue;
            x = bigInt(a[i]).modPow(b, n);
            if (x.isUnit() || x.equals(nPrev)) continue;
            for (d = r - 1; d != 0; d--) {
                x = x.square().mod(n);
                if (x.isUnit()) return false;
                if (x.equals(nPrev)) continue next;
            }
            return false;
        }
        return true;
    }

    // Set "strict" to true to force GRH-supported lower bound of 2*log(N)^2
    BigInteger.prototype.isPrime = function (strict) {
        var isPrime = isBasicPrime(this);
        if (isPrime !== undefined) return isPrime;
        var n = this.abs();
        var bits = n.bitLength();
        if (bits <= 64)
            return millerRabinTest(n, [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37]);
        var logN = Math.log(2) * bits.toJSNumber();
        var t = Math.ceil((strict === true) ? (2 * Math.pow(logN, 2)) : logN);
        for (var a = [], i = 0; i < t; i++) {
            a.push(bigInt(i + 2));
        }
        return millerRabinTest(n, a);
    };
    NativeBigInt.prototype.isPrime = SmallInteger.prototype.isPrime = BigInteger.prototype.isPrime;

    BigInteger.prototype.isProbablePrime = function (iterations, rng) {
        var isPrime = isBasicPrime(this);
        if (isPrime !== undefined) return isPrime;
        var n = this.abs();
        var t = iterations === undefined ? 5 : iterations;
        for (var a = [], i = 0; i < t; i++) {
            a.push(bigInt.randBetween(2, n.minus(2), rng));
        }
        return millerRabinTest(n, a);
    };
    NativeBigInt.prototype.isProbablePrime = SmallInteger.prototype.isProbablePrime = BigInteger.prototype.isProbablePrime;

    BigInteger.prototype.modInv = function (n) {
        var t = bigInt.zero, newT = bigInt.one, r = parseValue(n), newR = this.abs(), q, lastT, lastR;
        while (!newR.isZero()) {
            q = r.divide(newR);
            lastT = t;
            lastR = r;
            t = newT;
            r = newR;
            newT = lastT.subtract(q.multiply(newT));
            newR = lastR.subtract(q.multiply(newR));
        }
        if (!r.isUnit()) throw new Error(this.toString() + " and " + n.toString() + " are not co-prime");
        if (t.compare(0) === -1) {
            t = t.add(n);
        }
        if (this.isNegative()) {
            return t.negate();
        }
        return t;
    };

    NativeBigInt.prototype.modInv = SmallInteger.prototype.modInv = BigInteger.prototype.modInv;

    BigInteger.prototype.next = function () {
        var value = this.value;
        if (this.sign) {
            return subtractSmall(value, 1, this.sign);
        }
        return new BigInteger(addSmall(value, 1), this.sign);
    };
    SmallInteger.prototype.next = function () {
        var value = this.value;
        if (value + 1 < MAX_INT) return new SmallInteger(value + 1);
        return new BigInteger(MAX_INT_ARR, false);
    };
    NativeBigInt.prototype.next = function () {
        return new NativeBigInt(this.value + BigInt(1));
    }

    BigInteger.prototype.prev = function () {
        var value = this.value;
        if (this.sign) {
            return new BigInteger(addSmall(value, 1), true);
        }
        return subtractSmall(value, 1, this.sign);
    };
    SmallInteger.prototype.prev = function () {
        var value = this.value;
        if (value - 1 > -MAX_INT) return new SmallInteger(value - 1);
        return new BigInteger(MAX_INT_ARR, true);
    };
    NativeBigInt.prototype.prev = function () {
        return new NativeBigInt(this.value - BigInt(1));
    }

    var powersOfTwo = [1];
    while (2 * powersOfTwo[powersOfTwo.length - 1] <= BASE) powersOfTwo.push(2 * powersOfTwo[powersOfTwo.length - 1]);
    var powers2Length = powersOfTwo.length, highestPower2 = powersOfTwo[powers2Length - 1];

    function shift_isSmall(n) {
        return Math.abs(n) <= BASE;
    }

    BigInteger.prototype.shiftLeft = function (v) {
        var n = parseValue(v).toJSNumber();
        if (!shift_isSmall(n)) {
            throw new Error(String(n) + " is too large for shifting.");
        }
        if (n < 0) return this.shiftRight(-n);
        var result = this;
        if (result.isZero()) return result;
        while (n >= powers2Length) {
            result = result.multiply(highestPower2);
            n -= powers2Length - 1;
        }
        return result.multiply(powersOfTwo[n]);
    };
    NativeBigInt.prototype.shiftLeft = SmallInteger.prototype.shiftLeft = BigInteger.prototype.shiftLeft;

    BigInteger.prototype.shiftRight = function (v) {
        var remQuo;
        var n = parseValue(v).toJSNumber();
        if (!shift_isSmall(n)) {
            throw new Error(String(n) + " is too large for shifting.");
        }
        if (n < 0) return this.shiftLeft(-n);
        var result = this;
        while (n >= powers2Length) {
            if (result.isZero() || (result.isNegative() && result.isUnit())) return result;
            remQuo = divModAny(result, highestPower2);
            result = remQuo[1].isNegative() ? remQuo[0].prev() : remQuo[0];
            n -= powers2Length - 1;
        }
        remQuo = divModAny(result, powersOfTwo[n]);
        return remQuo[1].isNegative() ? remQuo[0].prev() : remQuo[0];
    };
    NativeBigInt.prototype.shiftRight = SmallInteger.prototype.shiftRight = BigInteger.prototype.shiftRight;

    function bitwise(x, y, fn) {
        y = parseValue(y);
        var xSign = x.isNegative(), ySign = y.isNegative();
        var xRem = xSign ? x.not() : x,
            yRem = ySign ? y.not() : y;
        var xDigit = 0, yDigit = 0;
        var xDivMod = null, yDivMod = null;
        var result = [];
        while (!xRem.isZero() || !yRem.isZero()) {
            xDivMod = divModAny(xRem, highestPower2);
            xDigit = xDivMod[1].toJSNumber();
            if (xSign) {
                xDigit = highestPower2 - 1 - xDigit; // two's complement for negative numbers
            }

            yDivMod = divModAny(yRem, highestPower2);
            yDigit = yDivMod[1].toJSNumber();
            if (ySign) {
                yDigit = highestPower2 - 1 - yDigit; // two's complement for negative numbers
            }

            xRem = xDivMod[0];
            yRem = yDivMod[0];
            result.push(fn(xDigit, yDigit));
        }
        var sum = fn(xSign ? 1 : 0, ySign ? 1 : 0) !== 0 ? bigInt(-1) : bigInt(0);
        for (var i = result.length - 1; i >= 0; i -= 1) {
            sum = sum.multiply(highestPower2).add(bigInt(result[i]));
        }
        return sum;
    }

    BigInteger.prototype.not = function () {
        return this.negate().prev();
    };
    NativeBigInt.prototype.not = SmallInteger.prototype.not = BigInteger.prototype.not;

    BigInteger.prototype.and = function (n) {
        return bitwise(this, n, function (a, b) { return a & b; });
    };
    NativeBigInt.prototype.and = SmallInteger.prototype.and = BigInteger.prototype.and;

    BigInteger.prototype.or = function (n) {
        return bitwise(this, n, function (a, b) { return a | b; });
    };
    NativeBigInt.prototype.or = SmallInteger.prototype.or = BigInteger.prototype.or;

    BigInteger.prototype.xor = function (n) {
        return bitwise(this, n, function (a, b) { return a ^ b; });
    };
    NativeBigInt.prototype.xor = SmallInteger.prototype.xor = BigInteger.prototype.xor;

    var LOBMASK_I = 1 << 30, LOBMASK_BI = (BASE & -BASE) * (BASE & -BASE) | LOBMASK_I;
    function roughLOB(n) { // get lowestOneBit (rough)
        // SmallInteger: return Min(lowestOneBit(n), 1 << 30)
        // BigInteger: return Min(lowestOneBit(n), 1 << 14) [BASE=1e7]
        var v = n.value,
            x = typeof v === "number" ? v | LOBMASK_I :
                typeof v === "bigint" ? v | BigInt(LOBMASK_I) :
                    v[0] + v[1] * BASE | LOBMASK_BI;
        return x & -x;
    }

    function integerLogarithm(value, base) {
        if (base.compareTo(value) <= 0) {
            var tmp = integerLogarithm(value, base.square(base));
            var p = tmp.p;
            var e = tmp.e;
            var t = p.multiply(base);
            return t.compareTo(value) <= 0 ? { p: t, e: e * 2 + 1 } : { p: p, e: e * 2 };
        }
        return { p: bigInt(1), e: 0 };
    }

    BigInteger.prototype.bitLength = function () {
        var n = this;
        if (n.compareTo(bigInt(0)) < 0) {
            n = n.negate().subtract(bigInt(1));
        }
        if (n.compareTo(bigInt(0)) === 0) {
            return bigInt(0);
        }
        return bigInt(integerLogarithm(n, bigInt(2)).e).add(bigInt(1));
    }
    NativeBigInt.prototype.bitLength = SmallInteger.prototype.bitLength = BigInteger.prototype.bitLength;

    function max(a, b) {
        a = parseValue(a);
        b = parseValue(b);
        return a.greater(b) ? a : b;
    }
    function min(a, b) {
        a = parseValue(a);
        b = parseValue(b);
        return a.lesser(b) ? a : b;
    }
    function gcd(a, b) {
        a = parseValue(a).abs();
        b = parseValue(b).abs();
        if (a.equals(b)) return a;
        if (a.isZero()) return b;
        if (b.isZero()) return a;
        var c = Integer[1], d, t;
        while (a.isEven() && b.isEven()) {
            d = min(roughLOB(a), roughLOB(b));
            a = a.divide(d);
            b = b.divide(d);
            c = c.multiply(d);
        }
        while (a.isEven()) {
            a = a.divide(roughLOB(a));
        }
        do {
            while (b.isEven()) {
                b = b.divide(roughLOB(b));
            }
            if (a.greater(b)) {
                t = b; b = a; a = t;
            }
            b = b.subtract(a);
        } while (!b.isZero());
        return c.isUnit() ? a : a.multiply(c);
    }
    function lcm(a, b) {
        a = parseValue(a).abs();
        b = parseValue(b).abs();
        return a.divide(gcd(a, b)).multiply(b);
    }
    function randBetween(a, b, rng) {
        a = parseValue(a);
        b = parseValue(b);
        var usedRNG = rng || Math.random;
        var low = min(a, b), high = max(a, b);
        var range = high.subtract(low).add(1);
        if (range.isSmall) return low.add(Math.floor(usedRNG() * range));
        var digits = toBase(range, BASE).value;
        var result = [], restricted = true;
        for (var i = 0; i < digits.length; i++) {
            var top = restricted ? digits[i] : BASE;
            var digit = truncate(usedRNG() * top);
            result.push(digit);
            if (digit < top) restricted = false;
        }
        return low.add(Integer.fromArray(result, BASE, false));
    }

    var parseBase = function (text, base, alphabet, caseSensitive) {
        alphabet = alphabet || DEFAULT_ALPHABET;
        text = String(text);
        if (!caseSensitive) {
            text = text.toLowerCase();
            alphabet = alphabet.toLowerCase();
        }
        var length = text.length;
        var i;
        var absBase = Math.abs(base);
        var alphabetValues = {};
        for (i = 0; i < alphabet.length; i++) {
            alphabetValues[alphabet[i]] = i;
        }
        for (i = 0; i < length; i++) {
            var c = text[i];
            if (c === "-") continue;
            if (c in alphabetValues) {
                if (alphabetValues[c] >= absBase) {
                    if (c === "1" && absBase === 1) continue;
                    throw new Error(c + " is not a valid digit in base " + base + ".");
                }
            }
        }
        base = parseValue(base);
        var digits = [];
        var isNegative = text[0] === "-";
        for (i = isNegative ? 1 : 0; i < text.length; i++) {
            var c = text[i];
            if (c in alphabetValues) digits.push(parseValue(alphabetValues[c]));
            else if (c === "<") {
                var start = i;
                do { i++; } while (text[i] !== ">" && i < text.length);
                digits.push(parseValue(text.slice(start + 1, i)));
            }
            else throw new Error(c + " is not a valid character");
        }
        return parseBaseFromArray(digits, base, isNegative);
    };

    function parseBaseFromArray(digits, base, isNegative) {
        var val = Integer[0], pow = Integer[1], i;
        for (i = digits.length - 1; i >= 0; i--) {
            val = val.add(digits[i].times(pow));
            pow = pow.times(base);
        }
        return isNegative ? val.negate() : val;
    }

    function stringify(digit, alphabet) {
        alphabet = alphabet || DEFAULT_ALPHABET;
        if (digit < alphabet.length) {
            return alphabet[digit];
        }
        return "<" + digit + ">";
    }

    function toBase(n, base) {
        base = bigInt(base);
        if (base.isZero()) {
            if (n.isZero()) return { value: [0], isNegative: false };
            throw new Error("Cannot convert nonzero numbers to base 0.");
        }
        if (base.equals(-1)) {
            if (n.isZero()) return { value: [0], isNegative: false };
            if (n.isNegative())
                return {
                    value: [].concat.apply([], Array.apply(null, Array(-n.toJSNumber()))
                        .map(Array.prototype.valueOf, [1, 0])
                    ),
                    isNegative: false
                };

            var arr = Array.apply(null, Array(n.toJSNumber() - 1))
                .map(Array.prototype.valueOf, [0, 1]);
            arr.unshift([1]);
            return {
                value: [].concat.apply([], arr),
                isNegative: false
            };
        }

        var neg = false;
        if (n.isNegative() && base.isPositive()) {
            neg = true;
            n = n.abs();
        }
        if (base.isUnit()) {
            if (n.isZero()) return { value: [0], isNegative: false };

            return {
                value: Array.apply(null, Array(n.toJSNumber()))
                    .map(Number.prototype.valueOf, 1),
                isNegative: neg
            };
        }
        var out = [];
        var left = n, divmod;
        while (left.isNegative() || left.compareAbs(base) >= 0) {
            divmod = left.divmod(base);
            left = divmod.quotient;
            var digit = divmod.remainder;
            if (digit.isNegative()) {
                digit = base.minus(digit).abs();
                left = left.next();
            }
            out.push(digit.toJSNumber());
        }
        out.push(left.toJSNumber());
        return { value: out.reverse(), isNegative: neg };
    }

    function toBaseString(n, base, alphabet) {
        var arr = toBase(n, base);
        return (arr.isNegative ? "-" : "") + arr.value.map(function (x) {
            return stringify(x, alphabet);
        }).join('');
    }

    BigInteger.prototype.toArray = function (radix) {
        return toBase(this, radix);
    };

    SmallInteger.prototype.toArray = function (radix) {
        return toBase(this, radix);
    };

    NativeBigInt.prototype.toArray = function (radix) {
        return toBase(this, radix);
    };

    BigInteger.prototype.toString = function (radix, alphabet) {
        if (radix === undefined) radix = 10;
        if (radix !== 10) return toBaseString(this, radix, alphabet);
        var v = this.value, l = v.length, str = String(v[--l]), zeros = "0000000", digit;
        while (--l >= 0) {
            digit = String(v[l]);
            str += zeros.slice(digit.length) + digit;
        }
        var sign = this.sign ? "-" : "";
        return sign + str;
    };

    SmallInteger.prototype.toString = function (radix, alphabet) {
        if (radix === undefined) radix = 10;
        if (radix != 10) return toBaseString(this, radix, alphabet);
        return String(this.value);
    };

    NativeBigInt.prototype.toString = SmallInteger.prototype.toString;

    NativeBigInt.prototype.toJSON = BigInteger.prototype.toJSON = SmallInteger.prototype.toJSON = function () { return this.toString(); }

    BigInteger.prototype.valueOf = function () {
        return parseInt(this.toString(), 10);
    };
    BigInteger.prototype.toJSNumber = BigInteger.prototype.valueOf;

    SmallInteger.prototype.valueOf = function () {
        return this.value;
    };
    SmallInteger.prototype.toJSNumber = SmallInteger.prototype.valueOf;
    NativeBigInt.prototype.valueOf = NativeBigInt.prototype.toJSNumber = function () {
        return parseInt(this.toString(), 10);
    }

    function parseStringValue(v) {
        if (isPrecise(+v)) {
            var x = +v;
            if (x === truncate(x))
                return supportsNativeBigInt ? new NativeBigInt(BigInt(x)) : new SmallInteger(x);
            throw new Error("Invalid integer: " + v);
        }
        var sign = v[0] === "-";
        if (sign) v = v.slice(1);
        var split = v.split(/e/i);
        if (split.length > 2) throw new Error("Invalid integer: " + split.join("e"));
        if (split.length === 2) {
            var exp = split[1];
            if (exp[0] === "+") exp = exp.slice(1);
            exp = +exp;
            if (exp !== truncate(exp) || !isPrecise(exp)) throw new Error("Invalid integer: " + exp + " is not a valid exponent.");
            var text = split[0];
            var decimalPlace = text.indexOf(".");
            if (decimalPlace >= 0) {
                exp -= text.length - decimalPlace - 1;
                text = text.slice(0, decimalPlace) + text.slice(decimalPlace + 1);
            }
            if (exp < 0) throw new Error("Cannot include negative exponent part for integers");
            text += (new Array(exp + 1)).join("0");
            v = text;
        }
        var isValid = /^([0-9][0-9]*)$/.test(v);
        if (!isValid) throw new Error("Invalid integer: " + v);
        if (supportsNativeBigInt) {
            return new NativeBigInt(BigInt(sign ? "-" + v : v));
        }
        var r = [], max = v.length, l = LOG_BASE, min = max - l;
        while (max > 0) {
            r.push(+v.slice(min, max));
            min -= l;
            if (min < 0) min = 0;
            max -= l;
        }
        trim(r);
        return new BigInteger(r, sign);
    }

    function parseNumberValue(v) {
        if (supportsNativeBigInt) {
            return new NativeBigInt(BigInt(v));
        }
        if (isPrecise(v)) {
            if (v !== truncate(v)) throw new Error(v + " is not an integer.");
            return new SmallInteger(v);
        }
        return parseStringValue(v.toString());
    }

    function parseValue(v) {
        if (typeof v === "number") {
            return parseNumberValue(v);
        }
        if (typeof v === "string") {
            return parseStringValue(v);
        }
        if (typeof v === "bigint") {
            return new NativeBigInt(v);
        }
        return v;
    }
    // Pre-define numbers in range [-999,999]
    for (var i = 0; i < 1000; i++) {
        Integer[i] = parseValue(i);
        if (i > 0) Integer[-i] = parseValue(-i);
    }
    // Backwards compatibility
    Integer.one = Integer[1];
    Integer.zero = Integer[0];
    Integer.minusOne = Integer[-1];
    Integer.max = max;
    Integer.min = min;
    Integer.gcd = gcd;
    Integer.lcm = lcm;
    Integer.isInstance = function (x) { return x instanceof BigInteger || x instanceof SmallInteger || x instanceof NativeBigInt; };
    Integer.randBetween = randBetween;

    Integer.fromArray = function (digits, base, isNegative) {
        return parseBaseFromArray(digits.map(parseValue), parseValue(base || 10), isNegative);
    };

    return Integer;
})();

// Node.js check
if (typeof module !== "undefined" && module.hasOwnProperty("exports")) {
    module.exports = bigInt;
}

//amd check
if (typeof define === "function" && define.amd) {
    define( function () {
        return bigInt;
    });
}

},{}],3:[function(require,module,exports){
(function (Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this,require("buffer").Buffer)

},{"base64-js":1,"buffer":3,"ieee754":4}],4:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],"e001":[function(require,module,exports){
var problem;

module.exports = problem = new Problem(`
Problem 1: Multiples of 3 and 5
-------------------------------

If we list all the natural numbers below 10 that are multiples of 3 or 5, we get 3, 5, 6 and 9.
The sum of these multiples is 23.

Find the sum of all the multiples of 3 or 5 below 1000.
`);

problem.test = function() {
  var i, j, sum;
  sum = 0;
  for (i = j = 1; j < 10; i = ++j) {
    if ((i % 3 === 0) || (i % 5 === 0)) {
      sum += i;
    }
  }
  return equal(sum, 23, `Sum of natural numbers < 10: ${sum}`);
};

problem.answer = function() {
  var i, j, sum;
  sum = 0;
  for (i = j = 1; j < 1000; i = ++j) {
    if ((i % 3 === 0) || (i % 5 === 0)) {
      sum += i;
    }
  }
  return sum;
};


},{}],"e002":[function(require,module,exports){
var problem;

module.exports = problem = new Problem(`
Problem 2: Even Fibonacci numbers
---------------------------------

Each new term in the Fibonacci sequence is generated by adding the previous two terms.
By starting with 1 and 2, the first 10 terms will be:

1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ...

By considering the terms in the Fibonacci sequence whose values do not exceed four million,
find the sum of the even-valued terms.
`);

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
var isPrime, largestPrimeFactor, leastFactor, primeFactors, problem;

module.exports = problem = new Problem(`
Problem 3: Largest prime factor
-------------------------------

The prime factors of 13195 are 5, 7, 13 and 29.

What is the largest prime factor of the number 600851475143 ?
`);

// -----------------------------------------------------------------------------------
// Shamelessly pilfered/adopted from http://www.javascripter.net/faq/numberisprime.htm
leastFactor = function(n) {
  var i, j, m, ref;
  if (isNaN(n) || !isFinite(n)) {
    return 0/0;
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
  for (i = j = 7, ref = m; j <= ref; i = j += 30) {
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

// -----------------------------------------------------------------------------------
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
var isPalindrome, problem;

module.exports = problem = new Problem(`
Problem 4: Largest palindrome product
-------------------------------------

A palindromic number reads the same both ways.

Find the largest palindrome made from the product of two 3-digit numbers.
`);

isPalindrome = function(n) {
  var i, k, ref, str;
  str = n.toString();
  for (i = k = 0, ref = str.length / 2; (0 <= ref ? k < ref : k > ref); i = 0 <= ref ? ++k : --k) {
    if (str[i] !== str[str.length - 1 - i]) {
      return false;
    }
  }
  return true;
};

problem.test = function() {
  var k, l, len, len1, ref, ref1, results, v;
  ref = [1, 11, 121, 1221, 12321, 1234321];
  // Make sure isPalindrome works properly first
  for (k = 0, len = ref.length; k < len; k++) {
    v = ref[k];
    equal(isPalindrome(v), true, `isPalindrome(${v}) returns true`);
  }
  ref1 = [12, 123, 1234, 12345, 123456, 12324];
  results = [];
  for (l = 0, len1 = ref1.length; l < len1; l++) {
    v = ref1[l];
    results.push(equal(isPalindrome(v), false, `isPalindrome(${v}) returns false`));
  }
  return results;
};

problem.answer = function() {
  var i, j, k, l, largesti, largestj, largestp, product;
  largesti = 0;
  largestj = 0;
  largestp = 0;
  for (i = k = 100; k <= 999; i = ++k) {
    for (j = l = 100; l <= 999; j = ++l) {
      product = i * j;
      if (isPalindrome(product) && (product > largestp)) {
        largesti = i;
        largestj = j;
        largestp = product;
      }
    }
  }
  return largestp;
};


},{}],"e005":[function(require,module,exports){
var problem;

module.exports = problem = new Problem(`
Problem 5: Smallest multiple
----------------------------

2520 is the smallest number that can be divided by each of the numbers from 1 to 10 without any remainder.

What is the smallest positive number that is evenly divisible by all of the numbers from 1 to 20?
`);

problem.answer = function() {
  var found, i, j, n;
  n = 0;
  while (true) {
    n += 20; // Probably could be some clever sum of primes between 1-20 or something. I don't care.
    found = true;
    for (i = j = 1; j <= 20; i = ++j) {
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


},{}],"e006":[function(require,module,exports){
var differenceSumSquares, problem, squareOfSum, sumOfSquares;

module.exports = problem = new Problem(`
Problem 6: Sum square difference
--------------------------------

The sum of the squares of the first ten natural numbers is,

             1^2 + 2^2 + ... + 10^2 = 385

The square of the sum of the first ten natural numbers is,

          (1 + 2 + ... + 10)^2 = 55^2 = 3025

Hence the difference between the sum of the squares of the first ten natural numbers and the square of the sum is 3025 − 385 = 2640.

Find the difference between the sum of the squares of the first one hundred natural numbers and the square of the sum.
`);

sumOfSquares = function(n) {
  var i, j, ref, sum;
  sum = 0;
  for (i = j = 1, ref = n; (1 <= ref ? j <= ref : j >= ref); i = 1 <= ref ? ++j : --j) {
    sum += i * i;
  }
  return sum;
};

squareOfSum = function(n) {
  var i, j, ref, sum;
  sum = 0;
  for (i = j = 1, ref = n; (1 <= ref ? j <= ref : j >= ref); i = 1 <= ref ? ++j : --j) {
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
var math, nthPrime, problem;

module.exports = problem = new Problem(`
Problem 7: 10001st prime
------------------------

By listing the first six prime numbers: 2, 3, 5, 7, 11, and 13, we can see that the 6th prime is 13.

What is the 10,001st prime number?
`);

math = require("math");

nthPrime = function(n) {
  var i, j, ref, sieve;
  sieve = new math.IncrementalSieve();
  for (i = j = 1, ref = n; (1 <= ref ? j < ref : j > ref); i = 1 <= ref ? ++j : --j) {
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


},{"math":"math"}],"e008":[function(require,module,exports){
var digit, digits, largestProduct, problem, str;

module.exports = problem = new Problem(`
Problem 8: Largest product in a series
--------------------------------------

The four adjacent digits in the 1000-digit number that have the greatest product are 9 x 9 x 8 x 9 = 5832.

  73167176531330624919225119674426574742355349194934
  96983520312774506326239578318016984801869478851843
  85861560789112949495459501737958331952853208805511
  12540698747158523863050715693290963295227443043557
  66896648950445244523161731856403098711121722383113
  62229893423380308135336276614282806444486645238749
  30358907296290491560440772390713810515859307960866
  70172427121883998797908792274921901699720888093776
  65727333001053367881220235421809751254540594752243
  52584907711670556013604839586446706324415722155397
  53697817977846174064955149290862569321978468622482
  83972241375657056057490261407972968652414535100474
  82166370484403199890008895243450658541227588666881
  16427171479924442928230863465674813919123162824586
  17866458359124566529476545682848912883142607690042
  24219022671055626321111109370544217506941658960408
  07198403850962455444362981230987879927244284909188
  84580156166097919133875499200524063689912560717606
  05886116467109405077541002256983155200055935729725
  71636269561882670428252483600823257530420752963450

Find the thirteen adjacent digits in the 1000-digit number that have the greatest product. What is the value of this product?
`);

str = `73167176531330624919225119674426574742355349194934
96983520312774506326239578318016984801869478851843
85861560789112949495459501737958331952853208805511
12540698747158523863050715693290963295227443043557
66896648950445244523161731856403098711121722383113
62229893423380308135336276614282806444486645238749
30358907296290491560440772390713810515859307960866
70172427121883998797908792274921901699720888093776
65727333001053367881220235421809751254540594752243
52584907711670556013604839586446706324415722155397
53697817977846174064955149290862569321978468622482
83972241375657056057490261407972968652414535100474
82166370484403199890008895243450658541227588666881
16427171479924442928230863465674813919123162824586
17866458359124566529476545682848912883142607690042
24219022671055626321111109370544217506941658960408
07198403850962455444362981230987879927244284909188
84580156166097919133875499200524063689912560717606
05886116467109405077541002256983155200055935729725
71636269561882670428252483600823257530420752963450`;

str = str.replace(/[^0-9]/gm, "");

digits = (function() {
  var j, len, results;
  results = [];
  for (j = 0, len = str.length; j < len; j++) {
    digit = str[j];
    results.push(parseInt(digit));
  }
  return results;
})();

largestProduct = function(digitCount) {
  var end, i, j, k, largest, product, ref, ref1, ref2, start;
  if (digitCount > digits.length) {
    return 0;
  }
  largest = 0;
  for (start = j = 0, ref = digits.length - digitCount; (0 <= ref ? j <= ref : j >= ref); start = 0 <= ref ? ++j : --j) {
    end = start + digitCount;
    product = 1;
    for (i = k = ref1 = start, ref2 = end; (ref1 <= ref2 ? k < ref2 : k > ref2); i = ref1 <= ref2 ? ++k : --k) {
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
var findFirstTriplet, isTriplet, problem;

module.exports = problem = new Problem(`
Problem 9: Special Pythagorean triplet
--------------------------------------

A Pythagorean triplet is a set of three natural numbers, a < b < c, for which,

    a^2 + b^2 = c^2

For example, 3^2 + 4^2 = 9 + 16 = 25 = 5^2.

There exists exactly one Pythagorean triplet for which a + b + c = 1000.

Find the product abc.
`);

isTriplet = function(a, b, c) {
  return ((a * a) + (b * b)) === (c * c);
};

findFirstTriplet = function(sum) {
  var a, b, c, i, j;
  for (a = i = 1; i < 1000; a = ++i) {
    for (b = j = 1; j < 1000; b = ++j) {
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


},{}],"e010":[function(require,module,exports){
var math, primeSum, problem;

module.exports = problem = new Problem(`
Problem 10: Summation of primes
-------------------------------

The sum of the primes below 10 is 2 + 3 + 5 + 7 = 17.

Find the sum of all the primes below two million.
`);

math = require("math");

primeSum = function(ceiling) {
  var n, sieve, sum;
  sieve = new math.IncrementalSieve();
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


},{"math":"math"}],"e011":[function(require,module,exports){
var getLine, getLineProduct, grid, prepareGrid, problem;

module.exports = problem = new Problem(`
Problem 11: Largest product in a grid
-------------------------------------

In the 20x20 grid below, four numbers along a diagonal line have been marked in red.

          08 02 22 97 38 15 00 40 00 75 04 05 07 78 52 12 50 77 91 08
          49 49 99 40 17 81 18 57 60 87 17 40 98 43 69 48 04 56 62 00
          81 49 31 73 55 79 14 29 93 71 40 67 53 88 30 03 49 13 36 65
          52 70 95 23 04 60 11 42 69 24 68 56 01 32 56 71 37 02 36 91
          22 31 16 71 51 67 63 89 41 92 36 54 22 40 40 28 66 33 13 80
          24 47 32 60 99 03 45 02 44 75 33 53 78 36 84 20 35 17 12 50
          32 98 81 28 64 23 67 10 26_38 40 67 59 54 70 66 18 38 64 70
          67 26 20 68 02 62 12 20 95 63_94 39 63 08 40 91 66 49 94 21
          24 55 58 05 66 73 99 26 97 17 78_78 96 83 14 88 34 89 63 72
          21 36 23 09 75 00 76 44 20 45 35 14 00 61 33 97 34 31 33 95
          78 17 53 28 22 75 31 67 15 94 03 80 04 62 16 14 09 53 56 92
          16 39 05 42 96 35 31 47 55 58 88 24 00 17 54 24 36 29 85 57
          86 56 00 48 35 71 89 07 05 44 44 37 44 60 21 58 51 54 17 58
          19 80 81 68 05 94 47 69 28 73 92 13 86 52 17 77 04 89 55 40
          04 52 08 83 97 35 99 16 07 97 57 32 16 26 26 79 33 27 98 66
          88 36 68 87 57 62 20 72 03 46 33 67 46 55 12 32 63 93 53 69
          04 42 16 73 38 25 39 11 24 94 72 18 08 46 29 32 40 62 76 36
          20 69 36 41 72 30 23 88 34 62 99 69 82 67 59 85 74 04 36 16
          20 73 35 29 78 31 90 01 74 31 49 71 48 86 81 16 23 57 05 54
          01 70 54 71 83 51 54 69 16 92 33 48 61 43 52 01 89 19 67 48

The product of these numbers is 26 x 63 x 78 x 14 = 1788696.

What is the greatest product of four adjacent numbers in the same direction (up, down, left, right, or diagonally) in the 20x20 grid?
`);

grid = null;

prepareGrid = function() {
  var digit, digits, i, index, j, k, l, rawDigits, results;
  rawDigits = `08 02 22 97 38 15 00 40 00 75 04 05 07 78 52 12 50 77 91 08
49 49 99 40 17 81 18 57 60 87 17 40 98 43 69 48 04 56 62 00
81 49 31 73 55 79 14 29 93 71 40 67 53 88 30 03 49 13 36 65
52 70 95 23 04 60 11 42 69 24 68 56 01 32 56 71 37 02 36 91
22 31 16 71 51 67 63 89 41 92 36 54 22 40 40 28 66 33 13 80
24 47 32 60 99 03 45 02 44 75 33 53 78 36 84 20 35 17 12 50
32 98 81 28 64 23 67 10 26 38 40 67 59 54 70 66 18 38 64 70
67 26 20 68 02 62 12 20 95 63 94 39 63 08 40 91 66 49 94 21
24 55 58 05 66 73 99 26 97 17 78 78 96 83 14 88 34 89 63 72
21 36 23 09 75 00 76 44 20 45 35 14 00 61 33 97 34 31 33 95
78 17 53 28 22 75 31 67 15 94 03 80 04 62 16 14 09 53 56 92
16 39 05 42 96 35 31 47 55 58 88 24 00 17 54 24 36 29 85 57
86 56 00 48 35 71 89 07 05 44 44 37 44 60 21 58 51 54 17 58
19 80 81 68 05 94 47 69 28 73 92 13 86 52 17 77 04 89 55 40
04 52 08 83 97 35 99 16 07 97 57 32 16 26 26 79 33 27 98 66
88 36 68 87 57 62 20 72 03 46 33 67 46 55 12 32 63 93 53 69
04 42 16 73 38 25 39 11 24 94 72 18 08 46 29 32 40 62 76 36
20 69 36 41 72 30 23 88 34 62 99 69 82 67 59 85 74 04 36 16
20 73 35 29 78 31 90 01 74 31 49 71 48 86 81 16 23 57 05 54
01 70 54 71 83 51 54 69 16 92 33 48 61 43 52 01 89 19 67 48`.replace(/[^0-9 ]/gm, " ");
  digits = (function() {
    var k, len, ref, results;
    ref = rawDigits.split(" ");
    results = [];
    for (k = 0, len = ref.length; k < len; k++) {
      digit = ref[k];
      results.push(parseInt(digit));
    }
    return results;
  })();
  grid = Array(20);
  for (i = k = 0; k < 20; i = ++k) {
    grid[i] = Array(20);
  }
  index = 0;
  results = [];
  for (j = l = 0; l < 20; j = ++l) {
    results.push((function() {
      var m, results1;
      results1 = [];
      for (i = m = 0; m < 20; i = ++m) {
        grid[i][j] = digits[index];
        results1.push(index++);
      }
      return results1;
    })());
  }
  return results;
};

prepareGrid();

// Gets a product of 4 values starting at (sx, sy), heading in the direction (dx, dy)
// Returns -1 if there is no room to make a stripe of 4.
getLineProduct = function(sx, sy, dx, dy) {
  var ex, ey, i, k, product, x, y;
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
  for (i = k = 0; k < 4; i = ++k) {
    product *= grid[x][y];
    x += dx;
    y += dy;
  }
  return product;
};

getLine = function(sx, sy, dx, dy) {
  var ex, ey, i, k, line, x, y;
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
  for (i = k = 0; k < 4; i = ++k) {
    line.push(grid[x][y]);
    x += dx;
    y += dy;
  }
  return line;
};

problem.test = function() {
  // Example is diagonal right/down from (8,6)
  return equal(getLineProduct(8, 6, 1, 1), 1788696, "Diagonal value shown in example equals 1,788,696");
};

problem.answer = function() {
  var i, j, k, l, max, p;
  max = {
    product: 1,
    i: 0,
    j: 0,
    dir: "right"
  };
  for (j = k = 0; k < 20; j = ++k) {
    for (i = l = 0; l < 20; i = ++l) {
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


},{}],"e012":[function(require,module,exports){
var divisorCount, math, problem;

module.exports = problem = new Problem(`
Problem 12: Highly divisible triangular number
----------------------------------------------

The sequence of triangle numbers is generated by adding the natural numbers. So the 7th triangle number would be

                      1 + 2 + 3 + 4 + 5 + 6 + 7 = 28.

The first ten terms would be:

                      1, 3, 6, 10, 15, 21, 28, 36, 45, 55, ...

Let us list the factors of the first seven triangle numbers:

 1: 1
 3: 1,3
 6: 1,2,3,6
10: 1,2,5,10
15: 1,3,5,15
21: 1,3,7,21
28: 1,2,4,7,14,28

We can see that 28 is the first triangle number to have over five divisors.

What is the value of the first triangle number to have over five hundred divisors?
`);

math = require("math");

// This function does its best to leverage Ramanujan's "Tau function",
// which is supposed to give the number of positive divisors.

// The idea is:
// * For primes, T(p^k) = k + 1
// * For any numbers whose GCD is 1, T(mn) = T(m) * T(n)

// I already have a method to prime factor a number, so I'll leverage
// every grouping of the same prime number as the first case, and
// multiply them together.

// Example: 28

// 28's prime factors are [2, 2, 7], or (2^2 + 7)

// I can assume that the GCD between any of the prime sets is going to be 1 because duh,
// which means that:

// T(28) == T(2^2) * T(7)

// T(2^2) == 2 + 1 == 3
// T(7^1) == 1 + 1 == 2
// 3 * 2 = 6
// 28 has 6 divisors.

// You're mad.
divisorCount = function(n) {
  var count, exponent, factor, factors, i, lastFactor, len;
  if (n === 1) {
    return 1;
  }
  factors = math.primeFactors(n);
  count = 1;
  lastFactor = 0;
  exponent = 1;
  for (i = 0, len = factors.length; i < len; i++) {
    factor = factors[i];
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
    // next triangular number
    n += step;
    step++;
  }
};


},{"math":"math"}],"e013":[function(require,module,exports){
var numbers, problem;

module.exports = problem = new Problem(`
Problem 13: Large sum
---------------------

Work out the first ten digits of the sum of the following one-hundred 50-digit numbers.

37107287533902102798797998220837590246510135740250
46376937677490009712648124896970078050417018260538
74324986199524741059474233309513058123726617309629
91942213363574161572522430563301811072406154908250
23067588207539346171171980310421047513778063246676
89261670696623633820136378418383684178734361726757
28112879812849979408065481931592621691275889832738
44274228917432520321923589422876796487670272189318
47451445736001306439091167216856844588711603153276
70386486105843025439939619828917593665686757934951
62176457141856560629502157223196586755079324193331
64906352462741904929101432445813822663347944758178
92575867718337217661963751590579239728245598838407
58203565325359399008402633568948830189458628227828
80181199384826282014278194139940567587151170094390
35398664372827112653829987240784473053190104293586
86515506006295864861532075273371959191420517255829
71693888707715466499115593487603532921714970056938
54370070576826684624621495650076471787294438377604
53282654108756828443191190634694037855217779295145
36123272525000296071075082563815656710885258350721
45876576172410976447339110607218265236877223636045
17423706905851860660448207621209813287860733969412
81142660418086830619328460811191061556940512689692
51934325451728388641918047049293215058642563049483
62467221648435076201727918039944693004732956340691
15732444386908125794514089057706229429197107928209
55037687525678773091862540744969844508330393682126
18336384825330154686196124348767681297534375946515
80386287592878490201521685554828717201219257766954
78182833757993103614740356856449095527097864797581
16726320100436897842553539920931837441497806860984
48403098129077791799088218795327364475675590848030
87086987551392711854517078544161852424320693150332
59959406895756536782107074926966537676326235447210
69793950679652694742597709739166693763042633987085
41052684708299085211399427365734116182760315001271
65378607361501080857009149939512557028198746004375
35829035317434717326932123578154982629742552737307
94953759765105305946966067683156574377167401875275
88902802571733229619176668713819931811048770190271
25267680276078003013678680992525463401061632866526
36270218540497705585629946580636237993140746255962
24074486908231174977792365466257246923322810917141
91430288197103288597806669760892938638285025333403
34413065578016127815921815005561868836468420090470
23053081172816430487623791969842487255036638784583
11487696932154902810424020138335124462181441773470
63783299490636259666498587618221225225512486764533
67720186971698544312419572409913959008952310058822
95548255300263520781532296796249481641953868218774
76085327132285723110424803456124867697064507995236
37774242535411291684276865538926205024910326572967
23701913275725675285653248258265463092207058596522
29798860272258331913126375147341994889534765745501
18495701454879288984856827726077713721403798879715
38298203783031473527721580348144513491373226651381
34829543829199918180278916522431027392251122869539
40957953066405232632538044100059654939159879593635
29746152185502371307642255121183693803580388584903
41698116222072977186158236678424689157993532961922
62467957194401269043877107275048102390895523597457
23189706772547915061505504953922979530901129967519
86188088225875314529584099251203829009407770775672
11306739708304724483816533873502340845647058077308
82959174767140363198008187129011875491310547126581
97623331044818386269515456334926366572897563400500
42846280183517070527831839425882145521227251250327
55121603546981200581762165212827652751691296897789
32238195734329339946437501907836945765883352399886
75506164965184775180738168837861091527357929701337
62177842752192623401942399639168044983993173312731
32924185707147349566916674687634660915035914677504
99518671430235219628894890102423325116913619626622
73267460800591547471830798392868535206946944540724
76841822524674417161514036427982273348055556214818
97142617910342598647204516893989422179826088076852
87783646182799346313767754307809363333018982642090
10848802521674670883215120185883543223812876952786
71329612474782464538636993009049310363619763878039
62184073572399794223406235393808339651327408011116
66627891981488087797941876876144230030984490851411
60661826293682836764744779239180335110989069790714
85786944089552990653640447425576083659976645795096
66024396409905389607120198219976047599490197230297
64913982680032973156037120041377903785566085089252
16730939319872750275468906903707539413042652315011
94809377245048795150954100921645863754710598436791
78639167021187492431995700641917969777599028300699
15368713711936614952811305876380278410754449733078
40789923115535562561142322423255033685442488917353
44889911501440648020369068063960672322193204149535
41503128880339536053299340368006977710650566631954
81234880673210146739058568557934581403627822703280
82616570773948327592232845941706525094512325230608
22918802058777319719839450180888072429661980811197
77158542502016545090413245809786882778948721859617
72107838435069186155435662884062257473692284509516
20849603980134001723930671666823555245252804609722
53503534226472524250874054075591789781264330331690
`);

numbers = [37107287533902102798797998220837590246510135740250, 46376937677490009712648124896970078050417018260538, 74324986199524741059474233309513058123726617309629, 91942213363574161572522430563301811072406154908250, 23067588207539346171171980310421047513778063246676, 89261670696623633820136378418383684178734361726757, 28112879812849979408065481931592621691275889832738, 44274228917432520321923589422876796487670272189318, 47451445736001306439091167216856844588711603153276, 70386486105843025439939619828917593665686757934951, 62176457141856560629502157223196586755079324193331, 64906352462741904929101432445813822663347944758178, 92575867718337217661963751590579239728245598838407, 58203565325359399008402633568948830189458628227828, 80181199384826282014278194139940567587151170094390, 35398664372827112653829987240784473053190104293586, 86515506006295864861532075273371959191420517255829, 71693888707715466499115593487603532921714970056938, 54370070576826684624621495650076471787294438377604, 53282654108756828443191190634694037855217779295145, 36123272525000296071075082563815656710885258350721, 45876576172410976447339110607218265236877223636045, 17423706905851860660448207621209813287860733969412, 81142660418086830619328460811191061556940512689692, 51934325451728388641918047049293215058642563049483, 62467221648435076201727918039944693004732956340691, 15732444386908125794514089057706229429197107928209, 55037687525678773091862540744969844508330393682126, 18336384825330154686196124348767681297534375946515, 80386287592878490201521685554828717201219257766954, 78182833757993103614740356856449095527097864797581, 16726320100436897842553539920931837441497806860984, 48403098129077791799088218795327364475675590848030, 87086987551392711854517078544161852424320693150332, 59959406895756536782107074926966537676326235447210, 69793950679652694742597709739166693763042633987085, 41052684708299085211399427365734116182760315001271, 65378607361501080857009149939512557028198746004375, 35829035317434717326932123578154982629742552737307, 94953759765105305946966067683156574377167401875275, 88902802571733229619176668713819931811048770190271, 25267680276078003013678680992525463401061632866526, 36270218540497705585629946580636237993140746255962, 24074486908231174977792365466257246923322810917141, 91430288197103288597806669760892938638285025333403, 34413065578016127815921815005561868836468420090470, 23053081172816430487623791969842487255036638784583, 11487696932154902810424020138335124462181441773470, 63783299490636259666498587618221225225512486764533, 67720186971698544312419572409913959008952310058822, 95548255300263520781532296796249481641953868218774, 76085327132285723110424803456124867697064507995236, 37774242535411291684276865538926205024910326572967, 23701913275725675285653248258265463092207058596522, 29798860272258331913126375147341994889534765745501, 18495701454879288984856827726077713721403798879715, 38298203783031473527721580348144513491373226651381, 34829543829199918180278916522431027392251122869539, 40957953066405232632538044100059654939159879593635, 29746152185502371307642255121183693803580388584903, 41698116222072977186158236678424689157993532961922, 62467957194401269043877107275048102390895523597457, 23189706772547915061505504953922979530901129967519, 86188088225875314529584099251203829009407770775672, 11306739708304724483816533873502340845647058077308, 82959174767140363198008187129011875491310547126581, 97623331044818386269515456334926366572897563400500, 42846280183517070527831839425882145521227251250327, 55121603546981200581762165212827652751691296897789, 32238195734329339946437501907836945765883352399886, 75506164965184775180738168837861091527357929701337, 62177842752192623401942399639168044983993173312731, 32924185707147349566916674687634660915035914677504, 99518671430235219628894890102423325116913619626622, 73267460800591547471830798392868535206946944540724, 76841822524674417161514036427982273348055556214818, 97142617910342598647204516893989422179826088076852, 87783646182799346313767754307809363333018982642090, 10848802521674670883215120185883543223812876952786, 71329612474782464538636993009049310363619763878039, 62184073572399794223406235393808339651327408011116, 66627891981488087797941876876144230030984490851411, 60661826293682836764744779239180335110989069790714, 85786944089552990653640447425576083659976645795096, 66024396409905389607120198219976047599490197230297, 64913982680032973156037120041377903785566085089252, 16730939319872750275468906903707539413042652315011, 94809377245048795150954100921645863754710598436791, 78639167021187492431995700641917969777599028300699, 15368713711936614952811305876380278410754449733078, 40789923115535562561142322423255033685442488917353, 44889911501440648020369068063960672322193204149535, 41503128880339536053299340368006977710650566631954, 81234880673210146739058568557934581403627822703280, 82616570773948327592232845941706525094512325230608, 22918802058777319719839450180888072429661980811197, 77158542502016545090413245809786882778948721859617, 72107838435069186155435662884062257473692284509516, 20849603980134001723930671666823555245252804609722, 53503534226472524250874054075591789781264330331690];

problem.answer = function() {
  var i, len, n, str, sum;
  sum = 0;
  for (i = 0, len = numbers.length; i < len; i++) {
    n = numbers[i];
    sum += n;
  }
  str = String(sum).replace(/\./g, "").substr(0, 10);
  return str;
};


},{}],"e014":[function(require,module,exports){
var collatzCache, collatzChainLength, problem;

module.exports = problem = new Problem(`
Problem 14: Longest Collatz sequence
------------------------------------

The following iterative sequence is defined for the set of positive integers:

    n -> n/2    (n is even)
    n -> 3n + 1 (n is odd)

Using the rule above and starting with 13, we generate the following sequence:

    13 -> 40 -> 20 -> 10 -> 5 -> 16 -> 8 -> 4 -> 2 -> 1

It can be seen that this sequence (starting at 13 and finishing at 1) contains 10 terms. Although it has not been proved yet (Collatz Problem), it is thought that all starting numbers finish at 1.

Which starting number, under one million, produces the longest chain?

NOTE: Once the chain starts the terms are allowed to go above one million.
`);

collatzCache = {};

collatzChainLength = function(startingValue) {
  var i, j, len, len1, n, toBeCached, v;
  n = startingValue;
  toBeCached = [];
  while (true) {
    if (collatzCache.hasOwnProperty(n)) {
      break;
    }
    // remember that we failed to cache this entry
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
  // Since we left breadcrumbs down the trail of things we haven't cached
  // walk back down the trail and cache all the entries found along the way
  len = toBeCached.length;
  for (i = j = 0, len1 = toBeCached.length; j < len1; i = ++j) {
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
  var chainLength, i, j, maxChain, maxChainLength;
  collatzCache = {
    "1": 1
  };
  maxChain = 0;
  maxChainLength = 0;
  for (i = j = 1; j < 1000000; i = ++j) {
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


},{}],"e015":[function(require,module,exports){
var lattice, math, problem;

module.exports = problem = new Problem(`
Problem 15: Lattice paths
-------------------------

Starting in the top left corner of a 2×2 grid, and only being able to move to the right and down, there are exactly 6 routes to the bottom right corner.

    (picture showing 6 paths: RRDD, RDRD, RDDR, DRRD, DRDR, DDRR)

How many such routes are there through a 20×20 grid?
`);

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


},{"math":"math"}],"e016":[function(require,module,exports){
var MAX_EXPONENT, bigInt, math, powerDigitSum, problem;

module.exports = problem = new Problem(`
Problem 16: Power digit sum
---------------------------

2^15 = 32768 and the sum of its digits is 3 + 2 + 7 + 6 + 8 = 26.

What is the sum of the digits of the number 2^1000?
`);

math = require("math");

bigInt = require("big-integer");

MAX_EXPONENT = 50;

powerDigitSum = function(x, y) {
  var d, digits, exponent, i, len, number, sum;
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
  for (i = 0, len = digits.length; i < len; i++) {
    d = digits[i];
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


},{"big-integer":2,"math":"math"}],"e017":[function(require,module,exports){
var names, numberLetterCount, numberLetterCountRange, problem;

module.exports = problem = new Problem(`
Problem 17: Number letter counts
--------------------------------

If the numbers 1 to 5 are written out in words: one, two, three, four, five, then there are 3 + 3 + 5 + 4 + 4 = 19 letters used in total.

If all the numbers from 1 to 1000 (one thousand) inclusive were written out in words, how many letters would be used?

NOTE: Do not count spaces or hyphens. For example, 342 (three hundred and forty-two) contains 23 letters and 115 (one hundred and fifteen) contains 20 letters. The use of "and" when writing out numbers is in compliance with British usage.
`);

names = {
  ones: "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(/\s+/),
  tens: "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split(/\s+/)
};

// supports 0-9999
numberLetterCount = function(num) {
  var hundreds, lettersOnly, n, name, tens, thousands;
  n = num;
  name = "";
  if (n >= 1000) {
    thousands = Math.floor(n / 1000);
    n = n % 1000;
    name += `${names.ones[thousands]} thousand `;
  }
  if (n >= 100) {
    hundreds = Math.floor(n / 100);
    n = n % 100;
    name += `${names.ones[hundreds]} hundred `;
  }
  if ((n > 0) && (name.length > 0)) {
    name += "and ";
  }
  if (n >= 20) {
    tens = Math.floor(n / 10);
    n = n % 10;
    name += `${names.tens[tens]} `;
  }
  if (n > 0) {
    name += `${names.ones[n]} `;
  }
  lettersOnly = name.replace(/[^a-z]/g, "");
  // console.log "num: #{num}, name: #{name}, lettersOnly: #{lettersOnly}"
  return lettersOnly.length;
};

numberLetterCountRange = function(a, b) {
  var i, j, ref, ref1, sum;
  sum = 0;
  for (i = j = ref = a, ref1 = b; (ref <= ref1 ? j <= ref1 : j >= ref1); i = ref <= ref1 ? ++j : --j) {
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


},{}],"e018":[function(require,module,exports){
var mainPyramid, math, maximumPathSum, problem, stringToPyramid, testPyramid;

module.exports = problem = new Problem(`
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
`);

math = require("math");

testPyramid = `   3
  7 4
 2 4 6
8 5 9 3`;

mainPyramid = `                            75
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
`;

stringToPyramid = function(str) {
  var a, d, digits, grid, i, j, len, ref, row;
  digits = (function() {
    var j, len1, ref, results;
    ref = String(str).replace(/\n/g, " ").split(/\s+/).filter(function(s) {
      return s.length > 0;
    });
    results = [];
    for (j = 0, len1 = ref.length; j < len1; j++) {
      d = ref[j];
      results.push(parseInt(d));
    }
    return results;
  })();
  grid = [];
  row = 0;
  while (digits.length) {
    len = row + 1;
    a = Array(len);
    for (i = j = 0, ref = len; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
      a[i] = digits.shift();
    }
    grid[row] = a;
    row++;
  }
  return grid;
};

// Crushes the pyramid from bottom up. When it is all done crushing, the top of the pyramid is the answer.
maximumPathSum = function(pyramidString) {
  var i, j, maxBelow, pyramid, ref, row, sum;
  pyramid = stringToPyramid(pyramidString);
  sum = 0;
  row = pyramid.length - 2;
  while (row >= 0) {
    for (i = j = 0, ref = row; (0 <= ref ? j <= ref : j >= ref); i = 0 <= ref ? ++j : --j) {
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


},{"math":"math"}],"e019":[function(require,module,exports){
var ONE_DAY_IN_MS, dateToTimestamp, dayAndDate, dayNames, problem;

module.exports = problem = new Problem(`
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
`);

ONE_DAY_IN_MS = 60 * 60 * 24 * 1000;

dayNames = "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(/\s+/);

dayAndDate = function(timestamp) {
  var d;
  d = new Date(timestamp);
  return [d.getDay(), d.getDate()];
};

dateToTimestamp = function(year, month, day) {
  return new Date(year, month, day).getTime();
};

problem.test = function() {
  var day, dd, i, results, ts;
  ts = dateToTimestamp(1900, 0, 1);
  equal(dayAndDate(ts)[0], 1, "1900/1/1 was a Monday");
  results = [];
  for (day = i = 2; i <= 6; day = ++i) {
    ts += ONE_DAY_IN_MS;
    dd = dayAndDate(ts);
    equal(dd[0], day, `the following day was a ${dayNames[day]}`);
    results.push(equal(dd[1], day, `... and the date was 1/${dd[1]}`));
  }
  return results;
};

problem.answer = function() {
  var dd, endts, sundayCount, ts;
  ts = dateToTimestamp(1901, 0, 1);
  endts = dateToTimestamp(2000, 11, 31);
  sundayCount = 0;
  while (ts < endts) {
    dd = dayAndDate(ts);
    if ((dd[0] === 0) && (dd[1] === 1)) {
      sundayCount++;
    }
    ts += ONE_DAY_IN_MS;
  }
  return sundayCount;
};


},{}],"e020":[function(require,module,exports){
var bigInt, hugeFactorial, problem, sumOfDigits;

module.exports = problem = new Problem(`
Problem 20: Factorial digit sum
-------------------------------

n! means n x (n − 1) x ... x 3 x 2 x 1

For example, 10! = 10 x 9 x ... x 3 x 2 x 1 = 3628800,
and the sum of the digits in the number 10! is 3 + 6 + 2 + 8 + 8 + 0 + 0 = 27.

Find the sum of the digits in the number 100!
`);

bigInt = require("big-integer");

hugeFactorial = function(n) {
  var i, j, number, ref;
  number = bigInt(1);
  for (i = j = 1, ref = n; (1 <= ref ? j <= ref : j >= ref); i = 1 <= ref ? ++j : --j) {
    number = number.multiply(i);
  }
  return number;
};

sumOfDigits = function(n) {
  var digit, digits, j, len, sum;
  digits = String(n);
  sum = 0;
  for (j = 0, len = digits.length; j < len; j++) {
    digit = digits[j];
    sum += parseInt(digit);
  }
  return sum;
};

problem.test = function() {
  return equal(sumOfDigits(hugeFactorial(10)), 27, "sum of factorial digits of 10! is 27");
};

problem.answer = function() {
  return sumOfDigits(hugeFactorial(100));
};


},{"big-integer":2}],"e021":[function(require,module,exports){
var amicableCache, amicableValue, math, problem;

module.exports = problem = new Problem(`
Problem 21: Amicable numbers
----------------------------

Let d(n) be defined as the sum of proper divisors of n (numbers less than n which divide evenly into n).
If d(a) = b and d(b) = a, where a ≠ b, then a and b are an amicable pair and each of a and b are called amicable numbers.

For example, the proper divisors of 220 are 1, 2, 4, 5, 10, 11, 20, 22, 44, 55 and 110; therefore d(220) = 284. The proper divisors of 284 are 1, 2, 4, 71 and 142; so d(284) = 220.

Evaluate the sum of all the amicable numbers under 10000.
`);

math = require("math");

amicableCache = null;

amicableValue = function(n) {
  var j, len, ref, sum, v;
  if (amicableCache.hasOwnProperty(n)) {
    return amicableCache[n];
  }
  sum = 0;
  ref = math.divisors(n);
  for (j = 0, len = ref.length; j < len; j++) {
    v = ref[j];
    sum += v;
  }
  amicableCache[n] = sum;
  return sum;
};

problem.test = function() {
  amicableCache = {};
  equal(amicableValue(220), 284, "amicable(220) == 284");
  return equal(amicableValue(284), 220, "amicable(284) == 220");
};

problem.answer = function() {
  var a, amicableNumbers, amicableSeen, b, i, j, k, len, sum, v;
  amicableCache = {};
  amicableSeen = {};
  for (i = j = 2; j < 10000; i = ++j) {
    a = amicableValue(i);
    b = amicableValue(a);
    if ((a !== b) && (b === i)) {
      amicableSeen[a] = true;
      amicableSeen[b] = true;
    }
  }
  amicableNumbers = (function() {
    var k, len, ref, results;
    ref = Object.keys(amicableSeen);
    results = [];
    for (k = 0, len = ref.length; k < len; k++) {
      v = ref[k];
      results.push(parseInt(v));
    }
    return results;
  })();
  sum = 0;
  for (k = 0, len = amicableNumbers.length; k < len; k++) {
    v = amicableNumbers[k];
    sum += v;
  }
  return sum;
};


},{"math":"math"}],"e022":[function(require,module,exports){
(function (Buffer){
var alphabeticalValue, fs, problem, readNames;

module.exports = problem = new Problem(`
Problem 22: Names scores
------------------------

Using names.txt (right click and 'Save Link/Target As...'), a 46K text file containing over five-thousand first names, begin by sorting it into alphabetical order. Then working out the alphabetical value for each name, multiply this value by its alphabetical position in the list to obtain a name score.

For example, when the list is sorted into alphabetical order, COLIN, which is worth 3 + 15 + 12 + 9 + 14 = 53, is the 938th name in the list. So, COLIN would obtain a score of 938 × 53 = 49714.

What is the total of all the name scores in the file?
`);



readNames = function() {
  var names, rawNames;
  rawNames = String(Buffer("Ik1BUlkiLCJQQVRSSUNJQSIsIkxJTkRBIiwiQkFSQkFSQSIsIkVMSVpBQkVUSCIsIkpFTk5JRkVSIiwiTUFSSUEiLCJTVVNBTiIsIk1BUkdBUkVUIiwiRE9ST1RIWSIsIkxJU0EiLCJOQU5DWSIsIktBUkVOIiwiQkVUVFkiLCJIRUxFTiIsIlNBTkRSQSIsIkRPTk5BIiwiQ0FST0wiLCJSVVRIIiwiU0hBUk9OIiwiTUlDSEVMTEUiLCJMQVVSQSIsIlNBUkFIIiwiS0lNQkVSTFkiLCJERUJPUkFIIiwiSkVTU0lDQSIsIlNISVJMRVkiLCJDWU5USElBIiwiQU5HRUxBIiwiTUVMSVNTQSIsIkJSRU5EQSIsIkFNWSIsIkFOTkEiLCJSRUJFQ0NBIiwiVklSR0lOSUEiLCJLQVRITEVFTiIsIlBBTUVMQSIsIk1BUlRIQSIsIkRFQlJBIiwiQU1BTkRBIiwiU1RFUEhBTklFIiwiQ0FST0xZTiIsIkNIUklTVElORSIsIk1BUklFIiwiSkFORVQiLCJDQVRIRVJJTkUiLCJGUkFOQ0VTIiwiQU5OIiwiSk9ZQ0UiLCJESUFORSIsIkFMSUNFIiwiSlVMSUUiLCJIRUFUSEVSIiwiVEVSRVNBIiwiRE9SSVMiLCJHTE9SSUEiLCJFVkVMWU4iLCJKRUFOIiwiQ0hFUllMIiwiTUlMRFJFRCIsIktBVEhFUklORSIsIkpPQU4iLCJBU0hMRVkiLCJKVURJVEgiLCJST1NFIiwiSkFOSUNFIiwiS0VMTFkiLCJOSUNPTEUiLCJKVURZIiwiQ0hSSVNUSU5BIiwiS0FUSFkiLCJUSEVSRVNBIiwiQkVWRVJMWSIsIkRFTklTRSIsIlRBTU1ZIiwiSVJFTkUiLCJKQU5FIiwiTE9SSSIsIlJBQ0hFTCIsIk1BUklMWU4iLCJBTkRSRUEiLCJLQVRIUllOIiwiTE9VSVNFIiwiU0FSQSIsIkFOTkUiLCJKQUNRVUVMSU5FIiwiV0FOREEiLCJCT05OSUUiLCJKVUxJQSIsIlJVQlkiLCJMT0lTIiwiVElOQSIsIlBIWUxMSVMiLCJOT1JNQSIsIlBBVUxBIiwiRElBTkEiLCJBTk5JRSIsIkxJTExJQU4iLCJFTUlMWSIsIlJPQklOIiwiUEVHR1kiLCJDUllTVEFMIiwiR0xBRFlTIiwiUklUQSIsIkRBV04iLCJDT05OSUUiLCJGTE9SRU5DRSIsIlRSQUNZIiwiRUROQSIsIlRJRkZBTlkiLCJDQVJNRU4iLCJST1NBIiwiQ0lORFkiLCJHUkFDRSIsIldFTkRZIiwiVklDVE9SSUEiLCJFRElUSCIsIktJTSIsIlNIRVJSWSIsIlNZTFZJQSIsIkpPU0VQSElORSIsIlRIRUxNQSIsIlNIQU5OT04iLCJTSEVJTEEiLCJFVEhFTCIsIkVMTEVOIiwiRUxBSU5FIiwiTUFSSk9SSUUiLCJDQVJSSUUiLCJDSEFSTE9UVEUiLCJNT05JQ0EiLCJFU1RIRVIiLCJQQVVMSU5FIiwiRU1NQSIsIkpVQU5JVEEiLCJBTklUQSIsIlJIT05EQSIsIkhBWkVMIiwiQU1CRVIiLCJFVkEiLCJERUJCSUUiLCJBUFJJTCIsIkxFU0xJRSIsIkNMQVJBIiwiTFVDSUxMRSIsIkpBTUlFIiwiSk9BTk5FIiwiRUxFQU5PUiIsIlZBTEVSSUUiLCJEQU5JRUxMRSIsIk1FR0FOIiwiQUxJQ0lBIiwiU1VaQU5ORSIsIk1JQ0hFTEUiLCJHQUlMIiwiQkVSVEhBIiwiREFSTEVORSIsIlZFUk9OSUNBIiwiSklMTCIsIkVSSU4iLCJHRVJBTERJTkUiLCJMQVVSRU4iLCJDQVRIWSIsIkpPQU5OIiwiTE9SUkFJTkUiLCJMWU5OIiwiU0FMTFkiLCJSRUdJTkEiLCJFUklDQSIsIkJFQVRSSUNFIiwiRE9MT1JFUyIsIkJFUk5JQ0UiLCJBVURSRVkiLCJZVk9OTkUiLCJBTk5FVFRFIiwiSlVORSIsIlNBTUFOVEhBIiwiTUFSSU9OIiwiREFOQSIsIlNUQUNZIiwiQU5BIiwiUkVORUUiLCJJREEiLCJWSVZJQU4iLCJST0JFUlRBIiwiSE9MTFkiLCJCUklUVEFOWSIsIk1FTEFOSUUiLCJMT1JFVFRBIiwiWU9MQU5EQSIsIkpFQU5FVFRFIiwiTEFVUklFIiwiS0FUSUUiLCJLUklTVEVOIiwiVkFORVNTQSIsIkFMTUEiLCJTVUUiLCJFTFNJRSIsIkJFVEgiLCJKRUFOTkUiLCJWSUNLSSIsIkNBUkxBIiwiVEFSQSIsIlJPU0VNQVJZIiwiRUlMRUVOIiwiVEVSUkkiLCJHRVJUUlVERSIsIkxVQ1kiLCJUT05ZQSIsIkVMTEEiLCJTVEFDRVkiLCJXSUxNQSIsIkdJTkEiLCJLUklTVElOIiwiSkVTU0lFIiwiTkFUQUxJRSIsIkFHTkVTIiwiVkVSQSIsIldJTExJRSIsIkNIQVJMRU5FIiwiQkVTU0lFIiwiREVMT1JFUyIsIk1FTElOREEiLCJQRUFSTCIsIkFSTEVORSIsIk1BVVJFRU4iLCJDT0xMRUVOIiwiQUxMSVNPTiIsIlRBTUFSQSIsIkpPWSIsIkdFT1JHSUEiLCJDT05TVEFOQ0UiLCJMSUxMSUUiLCJDTEFVRElBIiwiSkFDS0lFIiwiTUFSQ0lBIiwiVEFOWUEiLCJORUxMSUUiLCJNSU5OSUUiLCJNQVJMRU5FIiwiSEVJREkiLCJHTEVOREEiLCJMWURJQSIsIlZJT0xBIiwiQ09VUlRORVkiLCJNQVJJQU4iLCJTVEVMTEEiLCJDQVJPTElORSIsIkRPUkEiLCJKTyIsIlZJQ0tJRSIsIk1BVFRJRSIsIlRFUlJZIiwiTUFYSU5FIiwiSVJNQSIsIk1BQkVMIiwiTUFSU0hBIiwiTVlSVExFIiwiTEVOQSIsIkNIUklTVFkiLCJERUFOTkEiLCJQQVRTWSIsIkhJTERBIiwiR1dFTkRPTFlOIiwiSkVOTklFIiwiTk9SQSIsIk1BUkdJRSIsIk5JTkEiLCJDQVNTQU5EUkEiLCJMRUFIIiwiUEVOTlkiLCJLQVkiLCJQUklTQ0lMTEEiLCJOQU9NSSIsIkNBUk9MRSIsIkJSQU5EWSIsIk9MR0EiLCJCSUxMSUUiLCJESUFOTkUiLCJUUkFDRVkiLCJMRU9OQSIsIkpFTk5ZIiwiRkVMSUNJQSIsIlNPTklBIiwiTUlSSUFNIiwiVkVMTUEiLCJCRUNLWSIsIkJPQkJJRSIsIlZJT0xFVCIsIktSSVNUSU5BIiwiVE9OSSIsIk1JU1RZIiwiTUFFIiwiU0hFTExZIiwiREFJU1kiLCJSQU1PTkEiLCJTSEVSUkkiLCJFUklLQSIsIktBVFJJTkEiLCJDTEFJUkUiLCJMSU5EU0VZIiwiTElORFNBWSIsIkdFTkVWQSIsIkdVQURBTFVQRSIsIkJFTElOREEiLCJNQVJHQVJJVEEiLCJTSEVSWUwiLCJDT1JBIiwiRkFZRSIsIkFEQSIsIk5BVEFTSEEiLCJTQUJSSU5BIiwiSVNBQkVMIiwiTUFSR1VFUklURSIsIkhBVFRJRSIsIkhBUlJJRVQiLCJNT0xMWSIsIkNFQ0lMSUEiLCJLUklTVEkiLCJCUkFOREkiLCJCTEFOQ0hFIiwiU0FORFkiLCJST1NJRSIsIkpPQU5OQSIsIklSSVMiLCJFVU5JQ0UiLCJBTkdJRSIsIklORVoiLCJMWU5EQSIsIk1BREVMSU5FIiwiQU1FTElBIiwiQUxCRVJUQSIsIkdFTkVWSUVWRSIsIk1PTklRVUUiLCJKT0RJIiwiSkFOSUUiLCJNQUdHSUUiLCJLQVlMQSIsIlNPTllBIiwiSkFOIiwiTEVFIiwiS1JJU1RJTkUiLCJDQU5EQUNFIiwiRkFOTklFIiwiTUFSWUFOTiIsIk9QQUwiLCJBTElTT04iLCJZVkVUVEUiLCJNRUxPRFkiLCJMVVoiLCJTVVNJRSIsIk9MSVZJQSIsIkZMT1JBIiwiU0hFTExFWSIsIktSSVNUWSIsIk1BTUlFIiwiTFVMQSIsIkxPTEEiLCJWRVJOQSIsIkJFVUxBSCIsIkFOVE9JTkVUVEUiLCJDQU5ESUNFIiwiSlVBTkEiLCJKRUFOTkVUVEUiLCJQQU0iLCJLRUxMSSIsIkhBTk5BSCIsIldISVRORVkiLCJCUklER0VUIiwiS0FSTEEiLCJDRUxJQSIsIkxBVE9ZQSIsIlBBVFRZIiwiU0hFTElBIiwiR0FZTEUiLCJERUxMQSIsIlZJQ0tZIiwiTFlOTkUiLCJTSEVSSSIsIk1BUklBTk5FIiwiS0FSQSIsIkpBQ1FVRUxZTiIsIkVSTUEiLCJCTEFOQ0EiLCJNWVJBIiwiTEVUSUNJQSIsIlBBVCIsIktSSVNUQSIsIlJPWEFOTkUiLCJBTkdFTElDQSIsIkpPSE5OSUUiLCJST0JZTiIsIkZSQU5DSVMiLCJBRFJJRU5ORSIsIlJPU0FMSUUiLCJBTEVYQU5EUkEiLCJCUk9PS0UiLCJCRVRIQU5ZIiwiU0FESUUiLCJCRVJOQURFVFRFIiwiVFJBQ0kiLCJKT0RZIiwiS0VORFJBIiwiSkFTTUlORSIsIk5JQ0hPTEUiLCJSQUNIQUVMIiwiQ0hFTFNFQSIsIk1BQkxFIiwiRVJORVNUSU5FIiwiTVVSSUVMIiwiTUFSQ0VMTEEiLCJFTEVOQSIsIktSWVNUQUwiLCJBTkdFTElOQSIsIk5BRElORSIsIktBUkkiLCJFU1RFTExFIiwiRElBTk5BIiwiUEFVTEVUVEUiLCJMT1JBIiwiTU9OQSIsIkRPUkVFTiIsIlJPU0VNQVJJRSIsIkFOR0VMIiwiREVTSVJFRSIsIkFOVE9OSUEiLCJIT1BFIiwiR0lOR0VSIiwiSkFOSVMiLCJCRVRTWSIsIkNIUklTVElFIiwiRlJFREEiLCJNRVJDRURFUyIsIk1FUkVESVRIIiwiTFlORVRURSIsIlRFUkkiLCJDUklTVElOQSIsIkVVTEEiLCJMRUlHSCIsIk1FR0hBTiIsIlNPUEhJQSIsIkVMT0lTRSIsIlJPQ0hFTExFIiwiR1JFVENIRU4iLCJDRUNFTElBIiwiUkFRVUVMIiwiSEVOUklFVFRBIiwiQUxZU1NBIiwiSkFOQSIsIktFTExFWSIsIkdXRU4iLCJLRVJSWSIsIkpFTk5BIiwiVFJJQ0lBIiwiTEFWRVJORSIsIk9MSVZFIiwiQUxFWElTIiwiVEFTSEEiLCJTSUxWSUEiLCJFTFZJUkEiLCJDQVNFWSIsIkRFTElBIiwiU09QSElFIiwiS0FURSIsIlBBVFRJIiwiTE9SRU5BIiwiS0VMTElFIiwiU09OSkEiLCJMSUxBIiwiTEFOQSIsIkRBUkxBIiwiTUFZIiwiTUlORFkiLCJFU1NJRSIsIk1BTkRZIiwiTE9SRU5FIiwiRUxTQSIsIkpPU0VGSU5BIiwiSkVBTk5JRSIsIk1JUkFOREEiLCJESVhJRSIsIkxVQ0lBIiwiTUFSVEEiLCJGQUlUSCIsIkxFTEEiLCJKT0hBTk5BIiwiU0hBUkkiLCJDQU1JTExFIiwiVEFNSSIsIlNIQVdOQSIsIkVMSVNBIiwiRUJPTlkiLCJNRUxCQSIsIk9SQSIsIk5FVFRJRSIsIlRBQklUSEEiLCJPTExJRSIsIkpBSU1FIiwiV0lOSUZSRUQiLCJLUklTVElFIiwiTUFSSU5BIiwiQUxJU0hBIiwiQUlNRUUiLCJSRU5BIiwiTVlSTkEiLCJNQVJMQSIsIlRBTU1JRSIsIkxBVEFTSEEiLCJCT05JVEEiLCJQQVRSSUNFIiwiUk9OREEiLCJTSEVSUklFIiwiQURESUUiLCJGUkFOQ0lORSIsIkRFTE9SSVMiLCJTVEFDSUUiLCJBRFJJQU5BIiwiQ0hFUkkiLCJTSEVMQlkiLCJBQklHQUlMIiwiQ0VMRVNURSIsIkpFV0VMIiwiQ0FSQSIsIkFERUxFIiwiUkVCRUtBSCIsIkxVQ0lOREEiLCJET1JUSFkiLCJDSFJJUyIsIkVGRklFIiwiVFJJTkEiLCJSRUJBIiwiU0hBV04iLCJTQUxMSUUiLCJBVVJPUkEiLCJMRU5PUkEiLCJFVFRBIiwiTE9UVElFIiwiS0VSUkkiLCJUUklTSEEiLCJOSUtLSSIsIkVTVEVMTEEiLCJGUkFOQ0lTQ0EiLCJKT1NJRSIsIlRSQUNJRSIsIk1BUklTU0EiLCJLQVJJTiIsIkJSSVRUTkVZIiwiSkFORUxMRSIsIkxPVVJERVMiLCJMQVVSRUwiLCJIRUxFTkUiLCJGRVJOIiwiRUxWQSIsIkNPUklOTkUiLCJLRUxTRVkiLCJJTkEiLCJCRVRUSUUiLCJFTElTQUJFVEgiLCJBSURBIiwiQ0FJVExJTiIsIklOR1JJRCIsIklWQSIsIkVVR0VOSUEiLCJDSFJJU1RBIiwiR09MRElFIiwiQ0FTU0lFIiwiTUFVREUiLCJKRU5JRkVSIiwiVEhFUkVTRSIsIkZSQU5LSUUiLCJERU5BIiwiTE9STkEiLCJKQU5FVFRFIiwiTEFUT05ZQSIsIkNBTkRZIiwiTU9SR0FOIiwiQ09OU1VFTE8iLCJUQU1JS0EiLCJST1NFVFRBIiwiREVCT1JBIiwiQ0hFUklFIiwiUE9MTFkiLCJESU5BIiwiSkVXRUxMIiwiRkFZIiwiSklMTElBTiIsIkRPUk9USEVBIiwiTkVMTCIsIlRSVURZIiwiRVNQRVJBTlpBIiwiUEFUUklDQSIsIktJTUJFUkxFWSIsIlNIQU5OQSIsIkhFTEVOQSIsIkNBUk9MSU5BIiwiQ0xFTyIsIlNURUZBTklFIiwiUk9TQVJJTyIsIk9MQSIsIkpBTklORSIsIk1PTExJRSIsIkxVUEUiLCJBTElTQSIsIkxPVSIsIk1BUklCRUwiLCJTVVNBTk5FIiwiQkVUVEUiLCJTVVNBTkEiLCJFTElTRSIsIkNFQ0lMRSIsIklTQUJFTExFIiwiTEVTTEVZIiwiSk9DRUxZTiIsIlBBSUdFIiwiSk9OSSIsIlJBQ0hFTExFIiwiTEVPTEEiLCJEQVBITkUiLCJBTFRBIiwiRVNURVIiLCJQRVRSQSIsIkdSQUNJRUxBIiwiSU1PR0VORSIsIkpPTEVORSIsIktFSVNIQSIsIkxBQ0VZIiwiR0xFTk5BIiwiR0FCUklFTEEiLCJLRVJJIiwiVVJTVUxBIiwiTElaWklFIiwiS0lSU1RFTiIsIlNIQU5BIiwiQURFTElORSIsIk1BWVJBIiwiSkFZTkUiLCJKQUNMWU4iLCJHUkFDSUUiLCJTT05EUkEiLCJDQVJNRUxBIiwiTUFSSVNBIiwiUk9TQUxJTkQiLCJDSEFSSVRZIiwiVE9OSUEiLCJCRUFUUklaIiwiTUFSSVNPTCIsIkNMQVJJQ0UiLCJKRUFOSU5FIiwiU0hFRU5BIiwiQU5HRUxJTkUiLCJGUklFREEiLCJMSUxZIiwiUk9CQklFIiwiU0hBVU5BIiwiTUlMTElFIiwiQ0xBVURFVFRFIiwiQ0FUSExFRU4iLCJBTkdFTElBIiwiR0FCUklFTExFIiwiQVVUVU1OIiwiS0FUSEFSSU5FIiwiU1VNTUVSIiwiSk9ESUUiLCJTVEFDSSIsIkxFQSIsIkNIUklTVEkiLCJKSU1NSUUiLCJKVVNUSU5FIiwiRUxNQSIsIkxVRUxMQSIsIk1BUkdSRVQiLCJET01JTklRVUUiLCJTT0NPUlJPIiwiUkVORSIsIk1BUlRJTkEiLCJNQVJHTyIsIk1BVklTIiwiQ0FMTElFIiwiQk9CQkkiLCJNQVJJVFpBIiwiTFVDSUxFIiwiTEVBTk5FIiwiSkVBTk5JTkUiLCJERUFOQSIsIkFJTEVFTiIsIkxPUklFIiwiTEFET05OQSIsIldJTExBIiwiTUFOVUVMQSIsIkdBTEUiLCJTRUxNQSIsIkRPTExZIiwiU1lCSUwiLCJBQkJZIiwiTEFSQSIsIkRBTEUiLCJJVlkiLCJERUUiLCJXSU5OSUUiLCJNQVJDWSIsIkxVSVNBIiwiSkVSSSIsIk1BR0RBTEVOQSIsIk9GRUxJQSIsIk1FQUdBTiIsIkFVRFJBIiwiTUFUSUxEQSIsIkxFSUxBIiwiQ09STkVMSUEiLCJCSUFOQ0EiLCJTSU1PTkUiLCJCRVRUWUUiLCJSQU5ESSIsIlZJUkdJRSIsIkxBVElTSEEiLCJCQVJCUkEiLCJHRU9SR0lOQSIsIkVMSVpBIiwiTEVBTk4iLCJCUklER0VUVEUiLCJSSE9EQSIsIkhBTEVZIiwiQURFTEEiLCJOT0xBIiwiQkVSTkFESU5FIiwiRkxPU1NJRSIsIklMQSIsIkdSRVRBIiwiUlVUSElFIiwiTkVMREEiLCJNSU5FUlZBIiwiTElMTFkiLCJURVJSSUUiLCJMRVRIQSIsIkhJTEFSWSIsIkVTVEVMQSIsIlZBTEFSSUUiLCJCUklBTk5BIiwiUk9TQUxZTiIsIkVBUkxJTkUiLCJDQVRBTElOQSIsIkFWQSIsIk1JQSIsIkNMQVJJU1NBIiwiTElESUEiLCJDT1JSSU5FIiwiQUxFWEFORFJJQSIsIkNPTkNFUENJT04iLCJUSUEiLCJTSEFSUk9OIiwiUkFFIiwiRE9OQSIsIkVSSUNLQSIsIkpBTUkiLCJFTE5PUkEiLCJDSEFORFJBIiwiTEVOT1JFIiwiTkVWQSIsIk1BUllMT1UiLCJNRUxJU0EiLCJUQUJBVEhBIiwiU0VSRU5BIiwiQVZJUyIsIkFMTElFIiwiU09GSUEiLCJKRUFOSUUiLCJPREVTU0EiLCJOQU5OSUUiLCJIQVJSSUVUVCIsIkxPUkFJTkUiLCJQRU5FTE9QRSIsIk1JTEFHUk9TIiwiRU1JTElBIiwiQkVOSVRBIiwiQUxMWVNPTiIsIkFTSExFRSIsIlRBTklBIiwiVE9NTUlFIiwiRVNNRVJBTERBIiwiS0FSSU5BIiwiRVZFIiwiUEVBUkxJRSIsIlpFTE1BIiwiTUFMSU5EQSIsIk5PUkVFTiIsIlRBTUVLQSIsIlNBVU5EUkEiLCJISUxMQVJZIiwiQU1JRSIsIkFMVEhFQSIsIlJPU0FMSU5EQSIsIkpPUkRBTiIsIkxJTElBIiwiQUxBTkEiLCJHQVkiLCJDTEFSRSIsIkFMRUpBTkRSQSIsIkVMSU5PUiIsIk1JQ0hBRUwiLCJMT1JSSUUiLCJKRVJSSSIsIkRBUkNZIiwiRUFSTkVTVElORSIsIkNBUk1FTExBIiwiVEFZTE9SIiwiTk9FTUkiLCJNQVJDSUUiLCJMSVpBIiwiQU5OQUJFTExFIiwiTE9VSVNBIiwiRUFSTEVORSIsIk1BTExPUlkiLCJDQVJMRU5FIiwiTklUQSIsIlNFTEVOQSIsIlRBTklTSEEiLCJLQVRZIiwiSlVMSUFOTkUiLCJKT0hOIiwiTEFLSVNIQSIsIkVEV0lOQSIsIk1BUklDRUxBIiwiTUFSR0VSWSIsIktFTllBIiwiRE9MTElFIiwiUk9YSUUiLCJST1NMWU4iLCJLQVRIUklORSIsIk5BTkVUVEUiLCJDSEFSTUFJTkUiLCJMQVZPTk5FIiwiSUxFTkUiLCJLUklTIiwiVEFNTUkiLCJTVVpFVFRFIiwiQ09SSU5FIiwiS0FZRSIsIkpFUlJZIiwiTUVSTEUiLCJDSFJZU1RBTCIsIkxJTkEiLCJERUFOTkUiLCJMSUxJQU4iLCJKVUxJQU5BIiwiQUxJTkUiLCJMVUFOTiIsIktBU0VZIiwiTUFSWUFOTkUiLCJFVkFOR0VMSU5FIiwiQ09MRVRURSIsIk1FTFZBIiwiTEFXQU5EQSIsIllFU0VOSUEiLCJOQURJQSIsIk1BREdFIiwiS0FUSElFIiwiRURESUUiLCJPUEhFTElBIiwiVkFMRVJJQSIsIk5PTkEiLCJNSVRaSSIsIk1BUkkiLCJHRU9SR0VUVEUiLCJDTEFVRElORSIsIkZSQU4iLCJBTElTU0EiLCJST1NFQU5OIiwiTEFLRUlTSEEiLCJTVVNBTk5BIiwiUkVWQSIsIkRFSURSRSIsIkNIQVNJVFkiLCJTSEVSRUUiLCJDQVJMWSIsIkpBTUVTIiwiRUxWSUEiLCJBTFlDRSIsIkRFSVJEUkUiLCJHRU5BIiwiQlJJQU5BIiwiQVJBQ0VMSSIsIktBVEVMWU4iLCJST1NBTk5FIiwiV0VOREkiLCJURVNTQSIsIkJFUlRBIiwiTUFSVkEiLCJJTUVMREEiLCJNQVJJRVRUQSIsIk1BUkNJIiwiTEVPTk9SIiwiQVJMSU5FIiwiU0FTSEEiLCJNQURFTFlOIiwiSkFOTkEiLCJKVUxJRVRURSIsIkRFRU5BIiwiQVVSRUxJQSIsIkpPU0VGQSIsIkFVR1VTVEEiLCJMSUxJQU5BIiwiWU9VTkciLCJDSFJJU1RJQU4iLCJMRVNTSUUiLCJBTUFMSUEiLCJTQVZBTk5BSCIsIkFOQVNUQVNJQSIsIlZJTE1BIiwiTkFUQUxJQSIsIlJPU0VMTEEiLCJMWU5ORVRURSIsIkNPUklOQSIsIkFMRlJFREEiLCJMRUFOTkEiLCJDQVJFWSIsIkFNUEFSTyIsIkNPTEVFTiIsIlRBTVJBIiwiQUlTSEEiLCJXSUxEQSIsIktBUllOIiwiQ0hFUlJZIiwiUVVFRU4iLCJNQVVSQSIsIk1BSSIsIkVWQU5HRUxJTkEiLCJST1NBTk5BIiwiSEFMTElFIiwiRVJOQSIsIkVOSUQiLCJNQVJJQU5BIiwiTEFDWSIsIkpVTElFVCIsIkpBQ0tMWU4iLCJGUkVJREEiLCJNQURFTEVJTkUiLCJNQVJBIiwiSEVTVEVSIiwiQ0FUSFJZTiIsIkxFTElBIiwiQ0FTQU5EUkEiLCJCUklER0VUVCIsIkFOR0VMSVRBIiwiSkFOTklFIiwiRElPTk5FIiwiQU5OTUFSSUUiLCJLQVRJTkEiLCJCRVJZTCIsIlBIT0VCRSIsIk1JTExJQ0VOVCIsIktBVEhFUllOIiwiRElBTk4iLCJDQVJJU1NBIiwiTUFSWUVMTEVOIiwiTElaIiwiTEFVUkkiLCJIRUxHQSIsIkdJTERBIiwiQURSSUFOIiwiUkhFQSIsIk1BUlFVSVRBIiwiSE9MTElFIiwiVElTSEEiLCJUQU1FUkEiLCJBTkdFTElRVUUiLCJGUkFOQ0VTQ0EiLCJCUklUTkVZIiwiS0FJVExJTiIsIkxPTElUQSIsIkZMT1JJTkUiLCJST1dFTkEiLCJSRVlOQSIsIlRXSUxBIiwiRkFOTlkiLCJKQU5FTEwiLCJJTkVTIiwiQ09OQ0VUVEEiLCJCRVJUSUUiLCJBTEJBIiwiQlJJR0lUVEUiLCJBTFlTT04iLCJWT05EQSIsIlBBTlNZIiwiRUxCQSIsIk5PRUxMRSIsIkxFVElUSUEiLCJLSVRUWSIsIkRFQU5OIiwiQlJBTkRJRSIsIkxPVUVMTEEiLCJMRVRBIiwiRkVMRUNJQSIsIlNIQVJMRU5FIiwiTEVTQSIsIkJFVkVSTEVZIiwiUk9CRVJUIiwiSVNBQkVMTEEiLCJIRVJNSU5JQSIsIlRFUlJBIiwiQ0VMSU5BIiwiVE9SSSIsIk9DVEFWSUEiLCJKQURFIiwiREVOSUNFIiwiR0VSTUFJTkUiLCJTSUVSUkEiLCJNSUNIRUxMIiwiQ09SVE5FWSIsIk5FTExZIiwiRE9SRVRIQSIsIlNZRE5FWSIsIkRFSURSQSIsIk1PTklLQSIsIkxBU0hPTkRBIiwiSlVESSIsIkNIRUxTRVkiLCJBTlRJT05FVFRFIiwiTUFSR09UIiwiQk9CQlkiLCJBREVMQUlERSIsIk5BTiIsIkxFRUFOTiIsIkVMSVNIQSIsIkRFU1NJRSIsIkxJQkJZIiwiS0FUSEkiLCJHQVlMQSIsIkxBVEFOWUEiLCJNSU5BIiwiTUVMTElTQSIsIktJTUJFUkxFRSIsIkpBU01JTiIsIlJFTkFFIiwiWkVMREEiLCJFTERBIiwiTUEiLCJKVVNUSU5BIiwiR1VTU0lFIiwiRU1JTElFIiwiQ0FNSUxMQSIsIkFCQklFIiwiUk9DSU8iLCJLQUlUTFlOIiwiSkVTU0UiLCJFRFlUSEUiLCJBU0hMRUlHSCIsIlNFTElOQSIsIkxBS0VTSEEiLCJHRVJJIiwiQUxMRU5FIiwiUEFNQUxBIiwiTUlDSEFFTEEiLCJEQVlOQSIsIkNBUllOIiwiUk9TQUxJQSIsIlNVTiIsIkpBQ1FVTElORSIsIlJFQkVDQSIsIk1BUllCRVRIIiwiS1JZU1RMRSIsIklPTEEiLCJET1RUSUUiLCJCRU5OSUUiLCJCRUxMRSIsIkFVQlJFWSIsIkdSSVNFTERBIiwiRVJORVNUSU5BIiwiRUxJREEiLCJBRFJJQU5ORSIsIkRFTUVUUklBIiwiREVMTUEiLCJDSE9ORyIsIkpBUVVFTElORSIsIkRFU1RJTlkiLCJBUkxFRU4iLCJWSVJHSU5BIiwiUkVUSEEiLCJGQVRJTUEiLCJUSUxMSUUiLCJFTEVBTk9SRSIsIkNBUkkiLCJUUkVWQSIsIkJJUkRJRSIsIldJTEhFTE1JTkEiLCJST1NBTEVFIiwiTUFVUklORSIsIkxBVFJJQ0UiLCJZT05HIiwiSkVOQSIsIlRBUllOIiwiRUxJQSIsIkRFQkJZIiwiTUFVRElFIiwiSkVBTk5BIiwiREVMSUxBSCIsIkNBVFJJTkEiLCJTSE9OREEiLCJIT1JURU5DSUEiLCJUSEVPRE9SQSIsIlRFUkVTSVRBIiwiUk9CQklOIiwiREFORVRURSIsIk1BUllKQU5FIiwiRlJFRERJRSIsIkRFTFBISU5FIiwiQlJJQU5ORSIsIk5JTERBIiwiREFOTkEiLCJDSU5ESSIsIkJFU1MiLCJJT05BIiwiSEFOTkEiLCJBUklFTCIsIldJTk9OQSIsIlZJREEiLCJST1NJVEEiLCJNQVJJQU5OQSIsIldJTExJQU0iLCJSQUNIRUFMIiwiR1VJTExFUk1JTkEiLCJFTE9JU0EiLCJDRUxFU1RJTkUiLCJDQVJFTiIsIk1BTElTU0EiLCJMT05BIiwiQ0hBTlRFTCIsIlNIRUxMSUUiLCJNQVJJU0VMQSIsIkxFT1JBIiwiQUdBVEhBIiwiU09MRURBRCIsIk1JR0RBTElBIiwiSVZFVFRFIiwiQ0hSSVNURU4iLCJBVEhFTkEiLCJKQU5FTCIsIkNITE9FIiwiVkVEQSIsIlBBVFRJRSIsIlRFU1NJRSIsIlRFUkEiLCJNQVJJTFlOTiIsIkxVQ1JFVElBIiwiS0FSUklFIiwiRElOQUgiLCJEQU5JRUxBIiwiQUxFQ0lBIiwiQURFTElOQSIsIlZFUk5JQ0UiLCJTSElFTEEiLCJQT1JUSUEiLCJNRVJSWSIsIkxBU0hBV04iLCJERVZPTiIsIkRBUkEiLCJUQVdBTkEiLCJPTUEiLCJWRVJEQSIsIkNIUklTVElOIiwiQUxFTkUiLCJaRUxMQSIsIlNBTkRJIiwiUkFGQUVMQSIsIk1BWUEiLCJLSVJBIiwiQ0FORElEQSIsIkFMVklOQSIsIlNVWkFOIiwiU0hBWUxBIiwiTFlOIiwiTEVUVElFIiwiQUxWQSIsIlNBTUFUSEEiLCJPUkFMSUEiLCJNQVRJTERFIiwiTUFET05OQSIsIkxBUklTU0EiLCJWRVNUQSIsIlJFTklUQSIsIklORElBIiwiREVMT0lTIiwiU0hBTkRBIiwiUEhJTExJUyIsIkxPUlJJIiwiRVJMSU5EQSIsIkNSVVoiLCJDQVRIUklORSIsIkJBUkIiLCJaT0UiLCJJU0FCRUxMIiwiSU9ORSIsIkdJU0VMQSIsIkNIQVJMSUUiLCJWQUxFTkNJQSIsIlJPWEFOTkEiLCJNQVlNRSIsIktJU0hBIiwiRUxMSUUiLCJNRUxMSVNTQSIsIkRPUlJJUyIsIkRBTElBIiwiQkVMTEEiLCJBTk5FVFRBIiwiWk9JTEEiLCJSRVRBIiwiUkVJTkEiLCJMQVVSRVRUQSIsIktZTElFIiwiQ0hSSVNUQUwiLCJQSUxBUiIsIkNIQVJMQSIsIkVMSVNTQSIsIlRJRkZBTkkiLCJUQU5BIiwiUEFVTElOQSIsIkxFT1RBIiwiQlJFQU5OQSIsIkpBWU1FIiwiQ0FSTUVMIiwiVkVSTkVMTCIsIlRPTUFTQSIsIk1BTkRJIiwiRE9NSU5HQSIsIlNBTlRBIiwiTUVMT0RJRSIsIkxVUkEiLCJBTEVYQSIsIlRBTUVMQSIsIlJZQU4iLCJNSVJOQSIsIktFUlJJRSIsIlZFTlVTIiwiTk9FTCIsIkZFTElDSVRBIiwiQ1JJU1RZIiwiQ0FSTUVMSVRBIiwiQkVSTklFQ0UiLCJBTk5FTUFSSUUiLCJUSUFSQSIsIlJPU0VBTk5FIiwiTUlTU1kiLCJDT1JJIiwiUk9YQU5BIiwiUFJJQ0lMTEEiLCJLUklTVEFMIiwiSlVORyIsIkVMWVNFIiwiSEFZREVFIiwiQUxFVEhBIiwiQkVUVElOQSIsIk1BUkdFIiwiR0lMTElBTiIsIkZJTE9NRU5BIiwiQ0hBUkxFUyIsIlpFTkFJREEiLCJIQVJSSUVUVEUiLCJDQVJJREFEIiwiVkFEQSIsIlVOQSIsIkFSRVRIQSIsIlBFQVJMSU5FIiwiTUFSSk9SWSIsIk1BUkNFTEEiLCJGTE9SIiwiRVZFVFRFIiwiRUxPVUlTRSIsIkFMSU5BIiwiVFJJTklEQUQiLCJEQVZJRCIsIkRBTUFSSVMiLCJDQVRIQVJJTkUiLCJDQVJST0xMIiwiQkVMVkEiLCJOQUtJQSIsIk1BUkxFTkEiLCJMVUFOTkUiLCJMT1JJTkUiLCJLQVJPTiIsIkRPUkVORSIsIkRBTklUQSIsIkJSRU5OQSIsIlRBVElBTkEiLCJTQU1NSUUiLCJMT1VBTk4iLCJMT1JFTiIsIkpVTElBTk5BIiwiQU5EUklBIiwiUEhJTE9NRU5BIiwiTFVDSUxBIiwiTEVPTk9SQSIsIkRPVklFIiwiUk9NT05BIiwiTUlNSSIsIkpBQ1FVRUxJTiIsIkdBWUUiLCJUT05KQSIsIk1JU1RJIiwiSk9FIiwiR0VORSIsIkNIQVNUSVRZIiwiU1RBQ0lBIiwiUk9YQU5OIiwiTUlDQUVMQSIsIk5JS0lUQSIsIk1FSSIsIlZFTERBIiwiTUFSTFlTIiwiSk9ITk5BIiwiQVVSQSIsIkxBVkVSTiIsIklWT05ORSIsIkhBWUxFWSIsIk5JQ0tJIiwiTUFKT1JJRSIsIkhFUkxJTkRBIiwiR0VPUkdFIiwiQUxQSEEiLCJZQURJUkEiLCJQRVJMQSIsIkdSRUdPUklBIiwiREFOSUVMIiwiQU5UT05FVFRFIiwiU0hFTExJIiwiTU9aRUxMRSIsIk1BUklBSCIsIkpPRUxMRSIsIkNPUkRFTElBIiwiSk9TRVRURSIsIkNISVFVSVRBIiwiVFJJU1RBIiwiTE9VSVMiLCJMQVFVSVRBIiwiR0VPUkdJQU5BIiwiQ0FOREkiLCJTSEFOT04iLCJMT05OSUUiLCJISUxERUdBUkQiLCJDRUNJTCIsIlZBTEVOVElOQSIsIlNURVBIQU5ZIiwiTUFHREEiLCJLQVJPTCIsIkdFUlJZIiwiR0FCUklFTExBIiwiVElBTkEiLCJST01BIiwiUklDSEVMTEUiLCJSQVkiLCJQUklOQ0VTUyIsIk9MRVRBIiwiSkFDUVVFIiwiSURFTExBIiwiQUxBSU5BIiwiU1VaQU5OQSIsIkpPVklUQSIsIkJMQUlSIiwiVE9TSEEiLCJSQVZFTiIsIk5FUkVJREEiLCJNQVJMWU4iLCJLWUxBIiwiSk9TRVBIIiwiREVMRklOQSIsIlRFTkEiLCJTVEVQSEVOSUUiLCJTQUJJTkEiLCJOQVRIQUxJRSIsIk1BUkNFTExFIiwiR0VSVElFIiwiREFSTEVFTiIsIlRIRUEiLCJTSEFST05EQSIsIlNIQU5URUwiLCJCRUxFTiIsIlZFTkVTU0EiLCJST1NBTElOQSIsIk9OQSIsIkdFTk9WRVZBIiwiQ09SRVkiLCJDTEVNRU5USU5FIiwiUk9TQUxCQSIsIlJFTkFURSIsIlJFTkFUQSIsIk1JIiwiSVZPUlkiLCJHRU9SR0lBTk5BIiwiRkxPWSIsIkRPUkNBUyIsIkFSSUFOQSIsIlRZUkEiLCJUSEVEQSIsIk1BUklBTSIsIkpVTEkiLCJKRVNJQ0EiLCJET05OSUUiLCJWSUtLSSIsIlZFUkxBIiwiUk9TRUxZTiIsIk1FTFZJTkEiLCJKQU5ORVRURSIsIkdJTk5ZIiwiREVCUkFIIiwiQ09SUklFIiwiQVNJQSIsIlZJT0xFVEEiLCJNWVJUSVMiLCJMQVRSSUNJQSIsIkNPTExFVFRFIiwiQ0hBUkxFRU4iLCJBTklTU0EiLCJWSVZJQU5BIiwiVFdZTEEiLCJQUkVDSU9VUyIsIk5FRFJBIiwiTEFUT05JQSIsIkxBTiIsIkhFTExFTiIsIkZBQklPTEEiLCJBTk5BTUFSSUUiLCJBREVMTCIsIlNIQVJZTiIsIkNIQU5UQUwiLCJOSUtJIiwiTUFVRCIsIkxJWkVUVEUiLCJMSU5EWSIsIktJQSIsIktFU0hBIiwiSkVBTkEiLCJEQU5FTExFIiwiQ0hBUkxJTkUiLCJDSEFORUwiLCJDQVJST0wiLCJWQUxPUklFIiwiTElBIiwiRE9SVEhBIiwiQ1JJU1RBTCIsIlNVTk5ZIiwiTEVPTkUiLCJMRUlMQU5JIiwiR0VSUkkiLCJERUJJIiwiQU5EUkEiLCJLRVNISUEiLCJJTUEiLCJFVUxBTElBIiwiRUFTVEVSIiwiRFVMQ0UiLCJOQVRJVklEQUQiLCJMSU5OSUUiLCJLQU1JIiwiR0VPUkdJRSIsIkNBVElOQSIsIkJST09LIiwiQUxEQSIsIldJTk5JRlJFRCIsIlNIQVJMQSIsIlJVVEhBTk4iLCJNRUFHSEFOIiwiTUFHREFMRU5FIiwiTElTU0VUVEUiLCJBREVMQUlEQSIsIlZFTklUQSIsIlRSRU5BIiwiU0hJUkxFTkUiLCJTSEFNRUtBIiwiRUxJWkVCRVRIIiwiRElBTiIsIlNIQU5UQSIsIk1JQ0tFWSIsIkxBVE9TSEEiLCJDQVJMT1RUQSIsIldJTkRZIiwiU09PTiIsIlJPU0lOQSIsIk1BUklBTk4iLCJMRUlTQSIsIkpPTk5JRSIsIkRBV05BIiwiQ0FUSElFIiwiQklMTFkiLCJBU1RSSUQiLCJTSURORVkiLCJMQVVSRUVOIiwiSkFORUVOIiwiSE9MTEkiLCJGQVdOIiwiVklDS0VZIiwiVEVSRVNTQSIsIlNIQU5URSIsIlJVQllFIiwiTUFSQ0VMSU5BIiwiQ0hBTkRBIiwiQ0FSWSIsIlRFUkVTRSIsIlNDQVJMRVRUIiwiTUFSVFkiLCJNQVJOSUUiLCJMVUxVIiwiTElTRVRURSIsIkpFTklGRkVSIiwiRUxFTk9SIiwiRE9SSU5EQSIsIkRPTklUQSIsIkNBUk1BTiIsIkJFUk5JVEEiLCJBTFRBR1JBQ0lBIiwiQUxFVEEiLCJBRFJJQU5OQSIsIlpPUkFJREEiLCJST05OSUUiLCJOSUNPTEEiLCJMWU5EU0VZIiwiS0VOREFMTCIsIkpBTklOQSIsIkNIUklTU1kiLCJBTUkiLCJTVEFSTEEiLCJQSFlMSVMiLCJQSFVPTkciLCJLWVJBIiwiQ0hBUklTU0UiLCJCTEFOQ0giLCJTQU5KVUFOSVRBIiwiUk9OQSIsIk5BTkNJIiwiTUFSSUxFRSIsIk1BUkFOREEiLCJDT1JZIiwiQlJJR0VUVEUiLCJTQU5KVUFOQSIsIk1BUklUQSIsIktBU1NBTkRSQSIsIkpPWUNFTFlOIiwiSVJBIiwiRkVMSVBBIiwiQ0hFTFNJRSIsIkJPTk5ZIiwiTUlSRVlBIiwiTE9SRU5aQSIsIktZT05HIiwiSUxFQU5BIiwiQ0FOREVMQVJJQSIsIlRPTlkiLCJUT0JZIiwiU0hFUklFIiwiT0siLCJNQVJLIiwiTFVDSUUiLCJMRUFUUklDRSIsIkxBS0VTSElBIiwiR0VSREEiLCJFRElFIiwiQkFNQkkiLCJNQVJZTElOIiwiTEFWT04iLCJIT1JURU5TRSIsIkdBUk5FVCIsIkVWSUUiLCJUUkVTU0EiLCJTSEFZTkEiLCJMQVZJTkEiLCJLWVVORyIsIkpFQU5FVFRBIiwiU0hFUlJJTEwiLCJTSEFSQSIsIlBIWUxJU1MiLCJNSVRUSUUiLCJBTkFCRUwiLCJBTEVTSUEiLCJUSFVZIiwiVEFXQU5EQSIsIlJJQ0hBUkQiLCJKT0FOSUUiLCJUSUZGQU5JRSIsIkxBU0hBTkRBIiwiS0FSSVNTQSIsIkVOUklRVUVUQSIsIkRBUklBIiwiREFOSUVMTEEiLCJDT1JJTk5BIiwiQUxBTk5BIiwiQUJCRVkiLCJST1hBTkUiLCJST1NFQU5OQSIsIk1BR05PTElBIiwiTElEQSIsIktZTEUiLCJKT0VMTEVOIiwiRVJBIiwiQ09SQUwiLCJDQVJMRUVOIiwiVFJFU0EiLCJQRUdHSUUiLCJOT1ZFTExBIiwiTklMQSIsIk1BWUJFTExFIiwiSkVORUxMRSIsIkNBUklOQSIsIk5PVkEiLCJNRUxJTkEiLCJNQVJRVUVSSVRFIiwiTUFSR0FSRVRURSIsIkpPU0VQSElOQSIsIkVWT05ORSIsIkRFVklOIiwiQ0lOVEhJQSIsIkFMQklOQSIsIlRPWUEiLCJUQVdOWUEiLCJTSEVSSVRBIiwiU0FOVE9TIiwiTVlSSUFNIiwiTElaQUJFVEgiLCJMSVNFIiwiS0VFTFkiLCJKRU5OSSIsIkdJU0VMTEUiLCJDSEVSWUxFIiwiQVJESVRIIiwiQVJESVMiLCJBTEVTSEEiLCJBRFJJQU5FIiwiU0hBSU5BIiwiTElOTkVBIiwiS0FST0xZTiIsIkhPTkciLCJGTE9SSURBIiwiRkVMSVNIQSIsIkRPUkkiLCJEQVJDSSIsIkFSVElFIiwiQVJNSURBIiwiWk9MQSIsIlhJT01BUkEiLCJWRVJHSUUiLCJTSEFNSUtBIiwiTkVOQSIsIk5BTk5FVFRFIiwiTUFYSUUiLCJMT1ZJRSIsIkpFQU5FIiwiSkFJTUlFIiwiSU5HRSIsIkZBUlJBSCIsIkVMQUlOQSIsIkNBSVRMWU4iLCJTVEFSUiIsIkZFTElDSVRBUyIsIkNIRVJMWSIsIkNBUllMIiwiWU9MT05EQSIsIllBU01JTiIsIlRFRU5BIiwiUFJVREVOQ0UiLCJQRU5OSUUiLCJOWURJQSIsIk1BQ0tFTlpJRSIsIk9SUEhBIiwiTUFSVkVMIiwiTElaQkVUSCIsIkxBVVJFVFRFIiwiSkVSUklFIiwiSEVSTUVMSU5EQSIsIkNBUk9MRUUiLCJUSUVSUkEiLCJNSVJJQU4iLCJNRVRBIiwiTUVMT05ZIiwiS09SSSIsIkpFTk5FVFRFIiwiSkFNSUxBIiwiRU5BIiwiQU5IIiwiWU9TSElLTyIsIlNVU0FOTkFIIiwiU0FMSU5BIiwiUkhJQU5OT04iLCJKT0xFRU4iLCJDUklTVElORSIsIkFTSFRPTiIsIkFSQUNFTFkiLCJUT01FS0EiLCJTSEFMT05EQSIsIk1BUlRJIiwiTEFDSUUiLCJLQUxBIiwiSkFEQSIsIklMU0UiLCJIQUlMRVkiLCJCUklUVEFOSSIsIlpPTkEiLCJTWUJMRSIsIlNIRVJSWUwiLCJSQU5EWSIsIk5JRElBIiwiTUFSTE8iLCJLQU5ESUNFIiwiS0FOREkiLCJERUIiLCJERUFOIiwiQU1FUklDQSIsIkFMWUNJQSIsIlRPTU1ZIiwiUk9OTkEiLCJOT1JFTkUiLCJNRVJDWSIsIkpPU0UiLCJJTkdFQk9SRyIsIkdJT1ZBTk5BIiwiR0VNTUEiLCJDSFJJU1RFTCIsIkFVRFJZIiwiWk9SQSIsIlZJVEEiLCJWQU4iLCJUUklTSCIsIlNURVBIQUlORSIsIlNISVJMRUUiLCJTSEFOSUtBIiwiTUVMT05JRSIsIk1BWklFIiwiSkFaTUlOIiwiSU5HQSIsIkhPQSIsIkhFVFRJRSIsIkdFUkFMWU4iLCJGT05EQSIsIkVTVFJFTExBIiwiQURFTExBIiwiU1UiLCJTQVJJVEEiLCJSSU5BIiwiTUlMSVNTQSIsIk1BUklCRVRIIiwiR09MREEiLCJFVk9OIiwiRVRIRUxZTiIsIkVORURJTkEiLCJDSEVSSVNFIiwiQ0hBTkEiLCJWRUxWQSIsIlRBV0FOTkEiLCJTQURFIiwiTUlSVEEiLCJMSSIsIktBUklFIiwiSkFDSU5UQSIsIkVMTkEiLCJEQVZJTkEiLCJDSUVSUkEiLCJBU0hMSUUiLCJBTEJFUlRIQSIsIlRBTkVTSEEiLCJTVEVQSEFOSSIsIk5FTExFIiwiTUlOREkiLCJMVSIsIkxPUklOREEiLCJMQVJVRSIsIkZMT1JFTkUiLCJERU1FVFJBIiwiREVEUkEiLCJDSUFSQSIsIkNIQU5URUxMRSIsIkFTSExZIiwiU1VaWSIsIlJPU0FMVkEiLCJOT0VMSUEiLCJMWURBIiwiTEVBVEhBIiwiS1JZU1RZTkEiLCJLUklTVEFOIiwiS0FSUkkiLCJEQVJMSU5FIiwiREFSQ0lFIiwiQ0lOREEiLCJDSEVZRU5ORSIsIkNIRVJSSUUiLCJBV0lMREEiLCJBTE1FREEiLCJST0xBTkRBIiwiTEFORVRURSIsIkpFUklMWU4iLCJHSVNFTEUiLCJFVkFMWU4iLCJDWU5ESSIsIkNMRVRBIiwiQ0FSSU4iLCJaSU5BIiwiWkVOQSIsIlZFTElBIiwiVEFOSUtBIiwiUEFVTCIsIkNIQVJJU1NBIiwiVEhPTUFTIiwiVEFMSUEiLCJNQVJHQVJFVEUiLCJMQVZPTkRBIiwiS0FZTEVFIiwiS0FUSExFTkUiLCJKT05OQSIsIklSRU5BIiwiSUxPTkEiLCJJREFMSUEiLCJDQU5ESVMiLCJDQU5EQU5DRSIsIkJSQU5ERUUiLCJBTklUUkEiLCJBTElEQSIsIlNJR1JJRCIsIk5JQ09MRVRURSIsIk1BUllKTyIsIkxJTkVUVEUiLCJIRURXSUciLCJDSFJJU1RJQU5BIiwiQ0FTU0lEWSIsIkFMRVhJQSIsIlRSRVNTSUUiLCJNT0RFU1RBIiwiTFVQSVRBIiwiTElUQSIsIkdMQURJUyIsIkVWRUxJQSIsIkRBVklEQSIsIkNIRVJSSSIsIkNFQ0lMWSIsIkFTSEVMWSIsIkFOTkFCRUwiLCJBR1VTVElOQSIsIldBTklUQSIsIlNISVJMWSIsIlJPU0FVUkEiLCJIVUxEQSIsIkVVTiIsIkJBSUxFWSIsIllFVFRBIiwiVkVST05BIiwiVEhPTUFTSU5BIiwiU0lCWUwiLCJTSEFOTkFOIiwiTUVDSEVMTEUiLCJMVUUiLCJMRUFORFJBIiwiTEFOSSIsIktZTEVFIiwiS0FORFkiLCJKT0xZTk4iLCJGRVJORSIsIkVCT05JIiwiQ09SRU5FIiwiQUxZU0lBIiwiWlVMQSIsIk5BREEiLCJNT0lSQSIsIkxZTkRTQVkiLCJMT1JSRVRUQSIsIkpVQU4iLCJKQU1NSUUiLCJIT1JURU5TSUEiLCJHQVlORUxMIiwiQ0FNRVJPTiIsIkFEUklBIiwiVklOQSIsIlZJQ0VOVEEiLCJUQU5HRUxBIiwiU1RFUEhJTkUiLCJOT1JJTkUiLCJORUxMQSIsIkxJQU5BIiwiTEVTTEVFIiwiS0lNQkVSRUxZIiwiSUxJQU5BIiwiR0xPUlkiLCJGRUxJQ0EiLCJFTU9HRU5FIiwiRUxGUklFREUiLCJFREVOIiwiRUFSVEhBIiwiQ0FSTUEiLCJCRUEiLCJPQ0lFIiwiTUFSUlkiLCJMRU5OSUUiLCJLSUFSQSIsIkpBQ0FMWU4iLCJDQVJMT1RBIiwiQVJJRUxMRSIsIllVIiwiU1RBUiIsIk9USUxJQSIsIktJUlNUSU4iLCJLQUNFWSIsIkpPSE5FVFRBIiwiSk9FWSIsIkpPRVRUQSIsIkpFUkFMRElORSIsIkpBVU5JVEEiLCJFTEFOQSIsIkRPUlRIRUEiLCJDQU1JIiwiQU1BREEiLCJBREVMSUEiLCJWRVJOSVRBIiwiVEFNQVIiLCJTSU9CSEFOIiwiUkVORUEiLCJSQVNISURBIiwiT1VJREEiLCJPREVMTCIsIk5JTFNBIiwiTUVSWUwiLCJLUklTVFlOIiwiSlVMSUVUQSIsIkRBTklDQSIsIkJSRUFOTkUiLCJBVVJFQSIsIkFOR0xFQSIsIlNIRVJST04iLCJPREVUVEUiLCJNQUxJQSIsIkxPUkVMRUkiLCJMSU4iLCJMRUVTQSIsIktFTk5BIiwiS0FUSExZTiIsIkZJT05BIiwiQ0hBUkxFVFRFIiwiU1VaSUUiLCJTSEFOVEVMTCIsIlNBQlJBIiwiUkFDUVVFTCIsIk1ZT05HIiwiTUlSQSIsIk1BUlRJTkUiLCJMVUNJRU5ORSIsIkxBVkFEQSIsIkpVTElBTk4iLCJKT0hOSUUiLCJFTFZFUkEiLCJERUxQSElBIiwiQ0xBSVIiLCJDSFJJU1RJQU5FIiwiQ0hBUk9MRVRURSIsIkNBUlJJIiwiQVVHVVNUSU5FIiwiQVNIQSIsIkFOR0VMTEEiLCJQQU9MQSIsIk5JTkZBIiwiTEVEQSIsIkxBSSIsIkVEQSIsIlNVTlNISU5FIiwiU1RFRkFOSSIsIlNIQU5FTEwiLCJQQUxNQSIsIk1BQ0hFTExFIiwiTElTU0EiLCJLRUNJQSIsIktBVEhSWU5FIiwiS0FSTEVORSIsIkpVTElTU0EiLCJKRVRUSUUiLCJKRU5OSUZGRVIiLCJIVUkiLCJDT1JSSU5BIiwiQ0hSSVNUT1BIRVIiLCJDQVJPTEFOTiIsIkFMRU5BIiwiVEVTUyIsIlJPU0FSSUEiLCJNWVJUSUNFIiwiTUFSWUxFRSIsIkxJQU5FIiwiS0VOWUFUVEEiLCJKVURJRSIsIkpBTkVZIiwiSU4iLCJFTE1JUkEiLCJFTERPUkEiLCJERU5OQSIsIkNSSVNUSSIsIkNBVEhJIiwiWkFJREEiLCJWT05OSUUiLCJWSVZBIiwiVkVSTklFIiwiUk9TQUxJTkUiLCJNQVJJRUxBIiwiTFVDSUFOQSIsIkxFU0xJIiwiS0FSQU4iLCJGRUxJQ0UiLCJERU5FRU4iLCJBRElOQSIsIldZTk9OQSIsIlRBUlNIQSIsIlNIRVJPTiIsIlNIQVNUQSIsIlNIQU5JVEEiLCJTSEFOSSIsIlNIQU5EUkEiLCJSQU5EQSIsIlBJTktJRSIsIlBBUklTIiwiTkVMSURBIiwiTUFSSUxPVSIsIkxZTEEiLCJMQVVSRU5FIiwiTEFDSSIsIkpPSSIsIkpBTkVORSIsIkRPUk9USEEiLCJEQU5JRUxFIiwiREFOSSIsIkNBUk9MWU5OIiwiQ0FSTFlOIiwiQkVSRU5JQ0UiLCJBWUVTSEEiLCJBTk5FTElFU0UiLCJBTEVUSEVBIiwiVEhFUlNBIiwiVEFNSUtPIiwiUlVGSU5BIiwiT0xJVkEiLCJNT1pFTEwiLCJNQVJZTFlOIiwiTUFESVNPTiIsIktSSVNUSUFOIiwiS0FUSFlSTiIsIktBU0FORFJBIiwiS0FOREFDRSIsIkpBTkFFIiwiR0FCUklFTCIsIkRPTUVOSUNBIiwiREVCQlJBIiwiREFOTklFTExFIiwiQ0hVTiIsIkJVRkZZIiwiQkFSQklFIiwiQVJDRUxJQSIsIkFKQSIsIlpFTk9CSUEiLCJTSEFSRU4iLCJTSEFSRUUiLCJQQVRSSUNLIiwiUEFHRSIsIk1ZIiwiTEFWSU5JQSIsIktVTSIsIktBQ0lFIiwiSkFDS0VMSU5FIiwiSFVPTkciLCJGRUxJU0EiLCJFTUVMSUEiLCJFTEVBTk9SQSIsIkNZVEhJQSIsIkNSSVNUSU4iLCJDTFlERSIsIkNMQVJJQkVMIiwiQ0FST04iLCJBTkFTVEFDSUEiLCJaVUxNQSIsIlpBTkRSQSIsIllPS08iLCJURU5JU0hBIiwiU1VTQU5OIiwiU0hFUklMWU4iLCJTSEFZIiwiU0hBV0FOREEiLCJTQUJJTkUiLCJST01BTkEiLCJNQVRISUxEQSIsIkxJTlNFWSIsIktFSUtPIiwiSk9BTkEiLCJJU0VMQSIsIkdSRVRUQSIsIkdFT1JHRVRUQSIsIkVVR0VOSUUiLCJEVVNUWSIsIkRFU0lSQUUiLCJERUxPUkEiLCJDT1JBWk9OIiwiQU5UT05JTkEiLCJBTklLQSIsIldJTExFTkUiLCJUUkFDRUUiLCJUQU1BVEhBIiwiUkVHQU4iLCJOSUNIRUxMRSIsIk1JQ0tJRSIsIk1BRUdBTiIsIkxVQU5BIiwiTEFOSVRBIiwiS0VMU0lFIiwiRURFTE1JUkEiLCJCUkVFIiwiQUZUT04iLCJURU9ET1JBIiwiVEFNSUUiLCJTSEVOQSIsIk1FRyIsIkxJTkgiLCJLRUxJIiwiS0FDSSIsIkRBTllFTExFIiwiQlJJVFQiLCJBUkxFVFRFIiwiQUxCRVJUSU5FIiwiQURFTExFIiwiVElGRklOWSIsIlNUT1JNWSIsIlNJTU9OQSIsIk5VTUJFUlMiLCJOSUNPTEFTQSIsIk5JQ0hPTCIsIk5JQSIsIk5BS0lTSEEiLCJNRUUiLCJNQUlSQSIsIkxPUkVFTiIsIktJWlpZIiwiSk9ITk5ZIiwiSkFZIiwiRkFMTE9OIiwiQ0hSSVNURU5FIiwiQk9CQllFIiwiQU5USE9OWSIsIllJTkciLCJWSU5DRU5aQSIsIlRBTkpBIiwiUlVCSUUiLCJST05JIiwiUVVFRU5JRSIsIk1BUkdBUkVUVCIsIktJTUJFUkxJIiwiSVJNR0FSRCIsIklERUxMIiwiSElMTUEiLCJFVkVMSU5BIiwiRVNUQSIsIkVNSUxFRSIsIkRFTk5JU0UiLCJEQU5JQSIsIkNBUkwiLCJDQVJJRSIsIkFOVE9OSU8iLCJXQUkiLCJTQU5HIiwiUklTQSIsIlJJS0tJIiwiUEFSVElDSUEiLCJNVUkiLCJNQVNBS08iLCJNQVJJTyIsIkxVVkVOSUEiLCJMT1JFRSIsIkxPTkkiLCJMSUVOIiwiS0VWSU4iLCJHSUdJIiwiRkxPUkVOQ0lBIiwiRE9SSUFOIiwiREVOSVRBIiwiREFMTEFTIiwiQ0hJIiwiQklMTFlFIiwiQUxFWEFOREVSIiwiVE9NSUtBIiwiU0hBUklUQSIsIlJBTkEiLCJOSUtPTEUiLCJORU9NQSIsIk1BUkdBUklURSIsIk1BREFMWU4iLCJMVUNJTkEiLCJMQUlMQSIsIktBTEkiLCJKRU5FVFRFIiwiR0FCUklFTEUiLCJFVkVMWU5FIiwiRUxFTk9SQSIsIkNMRU1FTlRJTkEiLCJBTEVKQU5EUklOQSIsIlpVTEVNQSIsIlZJT0xFVFRFIiwiVkFOTkVTU0EiLCJUSFJFU0EiLCJSRVRUQSIsIlBJQSIsIlBBVElFTkNFIiwiTk9FTExBIiwiTklDS0lFIiwiSk9ORUxMIiwiREVMVEEiLCJDSFVORyIsIkNIQVlBIiwiQ0FNRUxJQSIsIkJFVEhFTCIsIkFOWUEiLCJBTkRSRVciLCJUSEFOSCIsIlNVWkFOTiIsIlNQUklORyIsIlNIVSIsIk1JTEEiLCJMSUxMQSIsIkxBVkVSTkEiLCJLRUVTSEEiLCJLQVRUSUUiLCJHSUEiLCJHRU9SR0VORSIsIkVWRUxJTkUiLCJFU1RFTEwiLCJFTElaQkVUSCIsIlZJVklFTk5FIiwiVkFMTElFIiwiVFJVRElFIiwiU1RFUEhBTkUiLCJNSUNIRUwiLCJNQUdBTFkiLCJNQURJRSIsIktFTllFVFRBIiwiS0FSUkVOIiwiSkFORVRUQSIsIkhFUk1JTkUiLCJIQVJNT05ZIiwiRFJVQ0lMTEEiLCJERUJCSSIsIkNFTEVTVElOQSIsIkNBTkRJRSIsIkJSSVROSSIsIkJFQ0tJRSIsIkFNSU5BIiwiWklUQSIsIllVTiIsIllPTEFOREUiLCJWSVZJRU4iLCJWRVJORVRUQSIsIlRSVURJIiwiU09NTUVSIiwiUEVBUkxFIiwiUEFUUklOQSIsIk9TU0lFIiwiTklDT0xMRSIsIkxPWUNFIiwiTEVUVFkiLCJMQVJJU0EiLCJLQVRIQVJJTkEiLCJKT1NFTFlOIiwiSk9ORUxMRSIsIkpFTkVMTCIsIklFU0hBIiwiSEVJREUiLCJGTE9SSU5EQSIsIkZMT1JFTlRJTkEiLCJGTE8iLCJFTE9ESUEiLCJET1JJTkUiLCJCUlVOSUxEQSIsIkJSSUdJRCIsIkFTSExJIiwiQVJERUxMQSIsIlRXQU5BIiwiVEhVIiwiVEFSQUgiLCJTVU5HIiwiU0hFQSIsIlNIQVZPTiIsIlNIQU5FIiwiU0VSSU5BIiwiUkFZTkEiLCJSQU1PTklUQSIsIk5HQSIsIk1BUkdVUklURSIsIkxVQ1JFQ0lBIiwiS09VUlRORVkiLCJLQVRJIiwiSkVTVVMiLCJKRVNFTklBIiwiRElBTU9ORCIsIkNSSVNUQSIsIkFZQU5BIiwiQUxJQ0EiLCJBTElBIiwiVklOTklFIiwiU1VFTExFTiIsIlJPTUVMSUEiLCJSQUNIRUxMIiwiUElQRVIiLCJPTFlNUElBIiwiTUlDSElLTyIsIktBVEhBTEVFTiIsIkpPTElFIiwiSkVTU0kiLCJKQU5FU1NBIiwiSEFOQSIsIkhBIiwiRUxFQVNFIiwiQ0FSTEVUVEEiLCJCUklUQU5ZIiwiU0hPTkEiLCJTQUxPTUUiLCJST1NBTU9ORCIsIlJFR0VOQSIsIlJBSU5BIiwiTkdPQyIsIk5FTElBIiwiTE9VVkVOSUEiLCJMRVNJQSIsIkxBVFJJTkEiLCJMQVRJQ0lBIiwiTEFSSE9OREEiLCJKSU5BIiwiSkFDS0kiLCJIT0xMSVMiLCJIT0xMRVkiLCJFTU1ZIiwiREVFQU5OIiwiQ09SRVRUQSIsIkFSTkVUVEEiLCJWRUxWRVQiLCJUSEFMSUEiLCJTSEFOSUNFIiwiTkVUQSIsIk1JS0tJIiwiTUlDS0kiLCJMT05OQSIsIkxFQU5BIiwiTEFTSFVOREEiLCJLSUxFWSIsIkpPWUUiLCJKQUNRVUxZTiIsIklHTkFDSUEiLCJIWVVOIiwiSElST0tPIiwiSEVOUlkiLCJIRU5SSUVUVEUiLCJFTEFZTkUiLCJERUxJTkRBIiwiREFSTkVMTCIsIkRBSExJQSIsIkNPUkVFTiIsIkNPTlNVRUxBIiwiQ09OQ0hJVEEiLCJDRUxJTkUiLCJCQUJFVFRFIiwiQVlBTk5BIiwiQU5FVFRFIiwiQUxCRVJUSU5BIiwiU0tZRSIsIlNIQVdORUUiLCJTSEFORUtBIiwiUVVJQU5BIiwiUEFNRUxJQSIsIk1JTiIsIk1FUlJJIiwiTUVSTEVORSIsIk1BUkdJVCIsIktJRVNIQSIsIktJRVJBIiwiS0FZTEVORSIsIkpPREVFIiwiSkVOSVNFIiwiRVJMRU5FIiwiRU1NSUUiLCJFTFNFIiwiREFSWUwiLCJEQUxJTEEiLCJEQUlTRVkiLCJDT0RZIiwiQ0FTSUUiLCJCRUxJQSIsIkJBQkFSQSIsIlZFUlNJRSIsIlZBTkVTQSIsIlNIRUxCQSIsIlNIQVdOREEiLCJTQU0iLCJOT1JNQU4iLCJOSUtJQSIsIk5BT01BIiwiTUFSTkEiLCJNQVJHRVJFVCIsIk1BREFMSU5FIiwiTEFXQU5BIiwiS0lORFJBIiwiSlVUVEEiLCJKQVpNSU5FIiwiSkFORVRUIiwiSEFOTkVMT1JFIiwiR0xFTkRPUkEiLCJHRVJUUlVEIiwiR0FSTkVUVCIsIkZSRUVEQSIsIkZSRURFUklDQSIsIkZMT1JBTkNFIiwiRkxBVklBIiwiREVOTklTIiwiQ0FSTElORSIsIkJFVkVSTEVFIiwiQU5KQU5FVFRFIiwiVkFMREEiLCJUUklOSVRZIiwiVEFNQUxBIiwiU1RFVklFIiwiU0hPTk5BIiwiU0hBIiwiU0FSSU5BIiwiT05FSURBIiwiTUlDQUgiLCJNRVJJTFlOIiwiTUFSTEVFTiIsIkxVUkxJTkUiLCJMRU5OQSIsIktBVEhFUklOIiwiSklOIiwiSkVOSSIsIkhBRSIsIkdSQUNJQSIsIkdMQURZIiwiRkFSQUgiLCJFUklDIiwiRU5PTEEiLCJFTUEiLCJET01JTlFVRSIsIkRFVk9OQSIsIkRFTEFOQSIsIkNFQ0lMQSIsIkNBUFJJQ0UiLCJBTFlTSEEiLCJBTEkiLCJBTEVUSElBIiwiVkVOQSIsIlRIRVJFU0lBIiwiVEFXTlkiLCJTT05HIiwiU0hBS0lSQSIsIlNBTUFSQSIsIlNBQ0hJS08iLCJSQUNIRUxFIiwiUEFNRUxMQSIsIk5JQ0tZIiwiTUFSTkkiLCJNQVJJRUwiLCJNQVJFTiIsIk1BTElTQSIsIkxJR0lBIiwiTEVSQSIsIkxBVE9SSUEiLCJMQVJBRSIsIktJTUJFUiIsIktBVEhFUk4iLCJLQVJFWSIsIkpFTk5FRkVSIiwiSkFORVRIIiwiSEFMSU5BIiwiRlJFRElBIiwiREVMSVNBIiwiREVCUk9BSCIsIkNJRVJBIiwiQ0hJTiIsIkFOR0VMSUtBIiwiQU5EUkVFIiwiQUxUSEEiLCJZRU4iLCJWSVZBTiIsIlRFUlJFU0EiLCJUQU5OQSIsIlNVSyIsIlNVRElFIiwiU09PIiwiU0lHTkUiLCJTQUxFTkEiLCJST05OSSIsIlJFQkJFQ0NBIiwiTVlSVElFIiwiTUNLRU5aSUUiLCJNQUxJS0EiLCJNQUlEQSIsIkxPQU4iLCJMRU9OQVJEQSIsIktBWUxFSUdIIiwiRlJBTkNFIiwiRVRIWUwiLCJFTExZTiIsIkRBWUxFIiwiQ0FNTUlFIiwiQlJJVFROSSIsIkJJUkdJVCIsIkFWRUxJTkEiLCJBU1VOQ0lPTiIsIkFSSUFOTkEiLCJBS0lLTyIsIlZFTklDRSIsIlRZRVNIQSIsIlRPTklFIiwiVElFU0hBIiwiVEFLSVNIQSIsIlNURUZGQU5JRSIsIlNJTkRZIiwiU0FOVEFOQSIsIk1FR0hBTk4iLCJNQU5EQSIsIk1BQ0lFIiwiTEFEWSIsIktFTExZRSIsIktFTExFRSIsIkpPU0xZTiIsIkpBU09OIiwiSU5HRVIiLCJJTkRJUkEiLCJHTElOREEiLCJHTEVOTklTIiwiRkVSTkFOREEiLCJGQVVTVElOQSIsIkVORUlEQSIsIkVMSUNJQSIsIkRPVCIsIkRJR05BIiwiREVMTCIsIkFSTEVUVEEiLCJBTkRSRSIsIldJTExJQSIsIlRBTU1BUkEiLCJUQUJFVEhBIiwiU0hFUlJFTEwiLCJTQVJJIiwiUkVGVUdJTyIsIlJFQkJFQ0EiLCJQQVVMRVRUQSIsIk5JRVZFUyIsIk5BVE9TSEEiLCJOQUtJVEEiLCJNQU1NSUUiLCJLRU5JU0hBIiwiS0FaVUtPIiwiS0FTU0lFIiwiR0FSWSIsIkVBUkxFQU4iLCJEQVBISU5FIiwiQ09STElTUyIsIkNMT1RJTERFIiwiQ0FST0xZTkUiLCJCRVJORVRUQSIsIkFVR1VTVElOQSIsIkFVRFJFQSIsIkFOTklTIiwiQU5OQUJFTEwiLCJZQU4iLCJURU5OSUxMRSIsIlRBTUlDQSIsIlNFTEVORSIsIlNFQU4iLCJST1NBTkEiLCJSRUdFTklBIiwiUUlBTkEiLCJNQVJLSVRBIiwiTUFDWSIsIkxFRUFOTkUiLCJMQVVSSU5FIiwiS1lNIiwiSkVTU0VOSUEiLCJKQU5JVEEiLCJHRU9SR0lORSIsIkdFTklFIiwiRU1JS08iLCJFTFZJRSIsIkRFQU5EUkEiLCJEQUdNQVIiLCJDT1JJRSIsIkNPTExFTiIsIkNIRVJJU0giLCJST01BSU5FIiwiUE9SU0hBIiwiUEVBUkxFTkUiLCJNSUNIRUxJTkUiLCJNRVJOQSIsIk1BUkdPUklFIiwiTUFSR0FSRVRUQSIsIkxPUkUiLCJLRU5ORVRIIiwiSkVOSU5FIiwiSEVSTUlOQSIsIkZSRURFUklDS0EiLCJFTEtFIiwiRFJVU0lMTEEiLCJET1JBVEhZIiwiRElPTkUiLCJERVNJUkUiLCJDRUxFTkEiLCJCUklHSURBIiwiQU5HRUxFUyIsIkFMTEVHUkEiLCJUSEVPIiwiVEFNRUtJQSIsIlNZTlRISUEiLCJTVEVQSEVOIiwiU09PSyIsIlNMWVZJQSIsIlJPU0FOTiIsIlJFQVRIQSIsIlJBWUUiLCJNQVJRVUVUVEEiLCJNQVJHQVJUIiwiTElORyIsIkxBWUxBIiwiS1lNQkVSTFkiLCJLSUFOQSIsIktBWUxFRU4iLCJLQVRMWU4iLCJLQVJNRU4iLCJKT0VMTEEiLCJJUklOQSIsIkVNRUxEQSIsIkVMRU5JIiwiREVUUkEiLCJDTEVNTUlFIiwiQ0hFUllMTCIsIkNIQU5URUxMIiwiQ0FUSEVZIiwiQVJOSVRBIiwiQVJMQSIsIkFOR0xFIiwiQU5HRUxJQyIsIkFMWVNFIiwiWk9GSUEiLCJUSE9NQVNJTkUiLCJURU5OSUUiLCJTT04iLCJTSEVSTFkiLCJTSEVSTEVZIiwiU0hBUllMIiwiUkVNRURJT1MiLCJQRVRSSU5BIiwiTklDS09MRSIsIk1ZVU5HIiwiTVlSTEUiLCJNT1pFTExBIiwiTE9VQU5ORSIsIkxJU0hBIiwiTEFUSUEiLCJMQU5FIiwiS1JZU1RBIiwiSlVMSUVOTkUiLCJKT0VMIiwiSkVBTkVORSIsIkpBQ1FVQUxJTkUiLCJJU0FVUkEiLCJHV0VOREEiLCJFQVJMRUVOIiwiRE9OQUxEIiwiQ0xFT1BBVFJBIiwiQ0FSTElFIiwiQVVESUUiLCJBTlRPTklFVFRBIiwiQUxJU0UiLCJBTEVYIiwiVkVSREVMTCIsIlZBTCIsIlRZTEVSIiwiVE9NT0tPIiwiVEhBTyIsIlRBTElTSEEiLCJTVEVWRU4iLCJTTyIsIlNIRU1JS0EiLCJTSEFVTiIsIlNDQVJMRVQiLCJTQVZBTk5BIiwiU0FOVElOQSIsIlJPU0lBIiwiUkFFQU5OIiwiT0RJTElBIiwiTkFOQSIsIk1JTk5BIiwiTUFHQU4iLCJMWU5FTExFIiwiTEUiLCJLQVJNQSIsIkpPRUFOTiIsIklWQU5BIiwiSU5FTEwiLCJJTEFOQSIsIkhZRSIsIkhPTkVZIiwiSEVFIiwiR1VEUlVOIiwiRlJBTksiLCJEUkVBTUEiLCJDUklTU1kiLCJDSEFOVEUiLCJDQVJNRUxJTkEiLCJBUlZJTExBIiwiQVJUSFVSIiwiQU5OQU1BRSIsIkFMVkVSQSIsIkFMRUlEQSIsIkFBUk9OIiwiWUVFIiwiWUFOSVJBIiwiVkFOREEiLCJUSUFOTkEiLCJUQU0iLCJTVEVGQU5JQSIsIlNISVJBIiwiUEVSUlkiLCJOSUNPTCIsIk5BTkNJRSIsIk1PTlNFUlJBVEUiLCJNSU5IIiwiTUVMWU5EQSIsIk1FTEFOWSIsIk1BVFRIRVciLCJMT1ZFTExBIiwiTEFVUkUiLCJLSVJCWSIsIktBQ1kiLCJKQUNRVUVMWU5OIiwiSFlPTiIsIkdFUlRIQSIsIkZSQU5DSVNDTyIsIkVMSUFOQSIsIkNIUklTVEVOQSIsIkNIUklTVEVFTiIsIkNIQVJJU0UiLCJDQVRFUklOQSIsIkNBUkxFWSIsIkNBTkRZQ0UiLCJBUkxFTkEiLCJBTU1JRSIsIllBTkciLCJXSUxMRVRURSIsIlZBTklUQSIsIlRVWUVUIiwiVElOWSIsIlNZUkVFVEEiLCJTSUxWQSIsIlNDT1RUIiwiUk9OQUxEIiwiUEVOTkVZIiwiTllMQSIsIk1JQ0hBTCIsIk1BVVJJQ0UiLCJNQVJZQU0iLCJNQVJZQSIsIk1BR0VOIiwiTFVESUUiLCJMT01BIiwiTElWSUEiLCJMQU5FTEwiLCJLSU1CRVJMSUUiLCJKVUxFRSIsIkRPTkVUVEEiLCJESUVEUkEiLCJERU5JU0hBIiwiREVBTkUiLCJEQVdORSIsIkNMQVJJTkUiLCJDSEVSUllMIiwiQlJPTldZTiIsIkJSQU5ET04iLCJBTExBIiwiVkFMRVJZIiwiVE9OREEiLCJTVUVBTk4iLCJTT1JBWUEiLCJTSE9TSEFOQSIsIlNIRUxBIiwiU0hBUkxFRU4iLCJTSEFORUxMRSIsIk5FUklTU0EiLCJNSUNIRUFMIiwiTUVSSURJVEgiLCJNRUxMSUUiLCJNQVlFIiwiTUFQTEUiLCJNQUdBUkVUIiwiTFVJUyIsIkxJTEkiLCJMRU9OSUxBIiwiTEVPTklFIiwiTEVFQU5OQSIsIkxBVk9OSUEiLCJMQVZFUkEiLCJLUklTVEVMIiwiS0FUSEVZIiwiS0FUSEUiLCJKVVNUSU4iLCJKVUxJQU4iLCJKSU1NWSIsIkpBTk4iLCJJTERBIiwiSElMRFJFRCIsIkhJTERFR0FSREUiLCJHRU5JQSIsIkZVTUlLTyIsIkVWRUxJTiIsIkVSTUVMSU5EQSIsIkVMTFkiLCJEVU5HIiwiRE9MT1JJUyIsIkRJT05OQSIsIkRBTkFFIiwiQkVSTkVJQ0UiLCJBTk5JQ0UiLCJBTElYIiwiVkVSRU5BIiwiVkVSRElFIiwiVFJJU1RBTiIsIlNIQVdOTkEiLCJTSEFXQU5BIiwiU0hBVU5OQSIsIlJPWkVMTEEiLCJSQU5ERUUiLCJSQU5BRSIsIk1JTEFHUk8iLCJMWU5FTEwiLCJMVUlTRSIsIkxPVUlFIiwiTE9JREEiLCJMSVNCRVRIIiwiS0FSTEVFTiIsIkpVTklUQSIsIkpPTkEiLCJJU0lTIiwiSFlBQ0lOVEgiLCJIRURZIiwiR1dFTk4iLCJFVEhFTEVORSIsIkVSTElORSIsIkVEV0FSRCIsIkRPTllBIiwiRE9NT05JUVVFIiwiREVMSUNJQSIsIkRBTk5FVFRFIiwiQ0lDRUxZIiwiQlJBTkRBIiwiQkxZVEhFIiwiQkVUSEFOTiIsIkFTSExZTiIsIkFOTkFMRUUiLCJBTExJTkUiLCJZVUtPIiwiVkVMTEEiLCJUUkFORyIsIlRPV0FOREEiLCJURVNIQSIsIlNIRVJMWU4iLCJOQVJDSVNBIiwiTUlHVUVMSU5BIiwiTUVSSSIsIk1BWUJFTEwiLCJNQVJMQU5BIiwiTUFSR1VFUklUQSIsIk1BRExZTiIsIkxVTkEiLCJMT1JZIiwiTE9SSUFOTiIsIkxJQkVSVFkiLCJMRU9OT1JFIiwiTEVJR0hBTk4iLCJMQVVSSUNFIiwiTEFURVNIQSIsIkxBUk9OREEiLCJLQVRSSUNFIiwiS0FTSUUiLCJLQVJMIiwiS0FMRVkiLCJKQURXSUdBIiwiR0xFTk5JRSIsIkdFQVJMRElORSIsIkZSQU5DSU5BIiwiRVBJRkFOSUEiLCJEWUFOIiwiRE9SSUUiLCJESUVEUkUiLCJERU5FU0UiLCJERU1FVFJJQ0UiLCJERUxFTkEiLCJEQVJCWSIsIkNSSVNUSUUiLCJDTEVPUkEiLCJDQVRBUklOQSIsIkNBUklTQSIsIkJFUk5JRSIsIkJBUkJFUkEiLCJBTE1FVEEiLCJUUlVMQSIsIlRFUkVBU0EiLCJTT0xBTkdFIiwiU0hFSUxBSCIsIlNIQVZPTk5FIiwiU0FOT1JBIiwiUk9DSEVMTCIsIk1BVEhJTERFIiwiTUFSR0FSRVRBIiwiTUFJQSIsIkxZTlNFWSIsIkxBV0FOTkEiLCJMQVVOQSIsIktFTkEiLCJLRUVOQSIsIktBVElBIiwiSkFNRVkiLCJHTFlOREEiLCJHQVlMRU5FIiwiRUxWSU5BIiwiRUxBTk9SIiwiREFOVVRBIiwiREFOSUtBIiwiQ1JJU1RFTiIsIkNPUkRJRSIsIkNPTEVUVEEiLCJDTEFSSVRBIiwiQ0FSTU9OIiwiQlJZTk4iLCJBWlVDRU5BIiwiQVVORFJFQSIsIkFOR0VMRSIsIllJIiwiV0FMVEVSIiwiVkVSTElFIiwiVkVSTEVORSIsIlRBTUVTSEEiLCJTSUxWQU5BIiwiU0VCUklOQSIsIlNBTUlSQSIsIlJFREEiLCJSQVlMRU5FIiwiUEVOTkkiLCJQQU5ET1JBIiwiTk9SQUgiLCJOT01BIiwiTUlSRUlMTEUiLCJNRUxJU1NJQSIsIk1BUllBTElDRSIsIkxBUkFJTkUiLCJLSU1CRVJZIiwiS0FSWUwiLCJLQVJJTkUiLCJLQU0iLCJKT0xBTkRBIiwiSk9IQU5BIiwiSkVTVVNBIiwiSkFMRUVTQSIsIkpBRSIsIkpBQ1FVRUxZTkUiLCJJUklTSCIsIklMVU1JTkFEQSIsIkhJTEFSSUEiLCJIQU5IIiwiR0VOTklFIiwiRlJBTkNJRSIsIkZMT1JFVFRBIiwiRVhJRSIsIkVEREEiLCJEUkVNQSIsIkRFTFBIQSIsIkJFViIsIkJBUkJBUiIsIkFTU1VOVEEiLCJBUkRFTEwiLCJBTk5BTElTQSIsIkFMSVNJQSIsIllVS0lLTyIsIllPTEFORE8iLCJXT05EQSIsIldFSSIsIldBTFRSQVVEIiwiVkVUQSIsIlRFUVVJTEEiLCJURU1FS0EiLCJUQU1FSUtBIiwiU0hJUkxFRU4iLCJTSEVOSVRBIiwiUElFREFEIiwiT1pFTExBIiwiTUlSVEhBIiwiTUFSSUxVIiwiS0lNSUtPIiwiSlVMSUFORSIsIkpFTklDRSIsIkpFTiIsIkpBTkFZIiwiSkFDUVVJTElORSIsIkhJTERFIiwiRkUiLCJGQUUiLCJFVkFOIiwiRVVHRU5FIiwiRUxPSVMiLCJFQ0hPIiwiREVWT1JBSCIsIkNIQVUiLCJCUklOREEiLCJCRVRTRVkiLCJBUk1JTkRBIiwiQVJBQ0VMSVMiLCJBUFJZTCIsIkFOTkVUVCIsIkFMSVNISUEiLCJWRU9MQSIsIlVTSEEiLCJUT1NISUtPIiwiVEhFT0xBIiwiVEFTSElBIiwiVEFMSVRIQSIsIlNIRVJZIiwiUlVEWSIsIlJFTkVUVEEiLCJSRUlLTyIsIlJBU0hFRURBIiwiT01FR0EiLCJPQkRVTElBIiwiTUlLQSIsIk1FTEFJTkUiLCJNRUdHQU4iLCJNQVJUSU4iLCJNQVJMRU4iLCJNQVJHRVQiLCJNQVJDRUxJTkUiLCJNQU5BIiwiTUFHREFMRU4iLCJMSUJSQURBIiwiTEVaTElFIiwiTEVYSUUiLCJMQVRBU0hJQSIsIkxBU0FORFJBIiwiS0VMTEUiLCJJU0lEUkEiLCJJU0EiLCJJTk9DRU5DSUEiLCJHV1lOIiwiRlJBTkNPSVNFIiwiRVJNSU5JQSIsIkVSSU5OIiwiRElNUExFIiwiREVWT1JBIiwiQ1JJU0VMREEiLCJBUk1BTkRBIiwiQVJJRSIsIkFSSUFORSIsIkFOR0VMTyIsIkFOR0VMRU5BIiwiQUxMRU4iLCJBTElaQSIsIkFEUklFTkUiLCJBREFMSU5FIiwiWE9DSElUTCIsIlRXQU5OQSIsIlRSQU4iLCJUT01JS08iLCJUQU1JU0hBIiwiVEFJU0hBIiwiU1VTWSIsIlNJVSIsIlJVVEhBIiwiUk9YWSIsIlJIT05BIiwiUkFZTU9ORCIsIk9USEEiLCJOT1JJS08iLCJOQVRBU0hJQSIsIk1FUlJJRSIsIk1FTFZJTiIsIk1BUklOREEiLCJNQVJJS08iLCJNQVJHRVJUIiwiTE9SSVMiLCJMSVpaRVRURSIsIkxFSVNIQSIsIktBSUxBIiwiS0EiLCJKT0FOTklFIiwiSkVSUklDQSIsIkpFTkUiLCJKQU5ORVQiLCJKQU5FRSIsIkpBQ0lOREEiLCJIRVJUQSIsIkVMRU5PUkUiLCJET1JFVFRBIiwiREVMQUlORSIsIkRBTklFTEwiLCJDTEFVRElFIiwiQ0hJTkEiLCJCUklUVEEiLCJBUE9MT05JQSIsIkFNQkVSTFkiLCJBTEVBU0UiLCJZVVJJIiwiWVVLIiwiV0VOIiwiV0FORVRBIiwiVVRFIiwiVE9NSSIsIlNIQVJSSSIsIlNBTkRJRSIsIlJPU0VMTEUiLCJSRVlOQUxEQSIsIlJBR1VFTCIsIlBIWUxJQ0lBIiwiUEFUUklBIiwiT0xJTVBJQSIsIk9ERUxJQSIsIk1JVFpJRSIsIk1JVENIRUxMIiwiTUlTUyIsIk1JTkRBIiwiTUlHTk9OIiwiTUlDQSIsIk1FTkRZIiwiTUFSSVZFTCIsIk1BSUxFIiwiTFlORVRUQSIsIkxBVkVUVEUiLCJMQVVSWU4iLCJMQVRSSVNIQSIsIkxBS0lFU0hBIiwiS0lFUlNURU4iLCJLQVJZIiwiSk9TUEhJTkUiLCJKT0xZTiIsIkpFVFRBIiwiSkFOSVNFIiwiSkFDUVVJRSIsIklWRUxJU1NFIiwiR0xZTklTIiwiR0lBTk5BIiwiR0FZTkVMTEUiLCJFTUVSQUxEIiwiREVNRVRSSVVTIiwiREFOWUVMTCIsIkRBTklMTEUiLCJEQUNJQSIsIkNPUkFMRUUiLCJDSEVSIiwiQ0VPTEEiLCJCUkVUVCIsIkJFTEwiLCJBUklBTk5FIiwiQUxFU0hJQSIsIllVTkciLCJXSUxMSUVNQUUiLCJUUk9ZIiwiVFJJTkgiLCJUSE9SQSIsIlRBSSIsIlNWRVRMQU5BIiwiU0hFUklLQSIsIlNIRU1FS0EiLCJTSEFVTkRBIiwiUk9TRUxJTkUiLCJSSUNLSSIsIk1FTERBIiwiTUFMTElFIiwiTEFWT05OQSIsIkxBVElOQSIsIkxBUlJZIiwiTEFRVUFOREEiLCJMQUxBIiwiTEFDSEVMTEUiLCJLTEFSQSIsIktBTkRJUyIsIkpPSE5BIiwiSkVBTk1BUklFIiwiSkFZRSIsIkhBTkciLCJHUkFZQ0UiLCJHRVJUVURFIiwiRU1FUklUQSIsIkVCT05JRSIsIkNMT1JJTkRBIiwiQ0hJTkciLCJDSEVSWSIsIkNBUk9MQSIsIkJSRUFOTiIsIkJMT1NTT00iLCJCRVJOQVJESU5FIiwiQkVDS0kiLCJBUkxFVEhBIiwiQVJHRUxJQSIsIkFSQSIsIkFMSVRBIiwiWVVMQU5EQSIsIllPTiIsIllFU1NFTklBIiwiVE9CSSIsIlRBU0lBIiwiU1lMVklFIiwiU0hJUkwiLCJTSElSRUxZIiwiU0hFUklEQU4iLCJTSEVMTEEiLCJTSEFOVEVMTEUiLCJTQUNIQSIsIlJPWUNFIiwiUkVCRUNLQSIsIlJFQUdBTiIsIlBST1ZJREVOQ0lBIiwiUEFVTEVORSIsIk1JU0hBIiwiTUlLSSIsIk1BUkxJTkUiLCJNQVJJQ0EiLCJMT1JJVEEiLCJMQVRPWUlBIiwiTEFTT05ZQSIsIktFUlNUSU4iLCJLRU5EQSIsIktFSVRIQSIsIktBVEhSSU4iLCJKQVlNSUUiLCJKQUNLIiwiR1JJQ0VMREEiLCJHSU5FVFRFIiwiRVJZTiIsIkVMSU5BIiwiRUxGUklFREEiLCJEQU5ZRUwiLCJDSEVSRUUiLCJDSEFORUxMRSIsIkJBUlJJRSIsIkFWRVJZIiwiQVVST1JFIiwiQU5OQU1BUklBIiwiQUxMRUVOIiwiQUlMRU5FIiwiQUlERSIsIllBU01JTkUiLCJWQVNIVEkiLCJWQUxFTlRJTkUiLCJUUkVBU0EiLCJUT1JZIiwiVElGRkFORVkiLCJTSEVSWUxMIiwiU0hBUklFIiwiU0hBTkFFIiwiU0FVIiwiUkFJU0EiLCJQQSIsIk5FREEiLCJNSVRTVUtPIiwiTUlSRUxMQSIsIk1JTERBIiwiTUFSWUFOTkEiLCJNQVJBR1JFVCIsIk1BQkVMTEUiLCJMVUVUVEEiLCJMT1JJTkEiLCJMRVRJU0hBIiwiTEFUQVJTSEEiLCJMQU5FTExFIiwiTEFKVUFOQSIsIktSSVNTWSIsIktBUkxZIiwiS0FSRU5BIiwiSk9OIiwiSkVTU0lLQSIsIkpFUklDQSIsIkpFQU5FTExFIiwiSkFOVUFSWSIsIkpBTElTQSIsIkpBQ0VMWU4iLCJJWk9MQSIsIklWRVkiLCJHUkVHT1JZIiwiRVVOQSIsIkVUSEEiLCJEUkVXIiwiRE9NSVRJTEEiLCJET01JTklDQSIsIkRBSU5BIiwiQ1JFT0xBIiwiQ0FSTEkiLCJDQU1JRSIsIkJVTk5ZIiwiQlJJVFROWSIsIkFTSEFOVEkiLCJBTklTSEEiLCJBTEVFTiIsIkFEQUgiLCJZQVNVS08iLCJXSU5URVIiLCJWSUtJIiwiVkFMUklFIiwiVE9OQSIsIlRJTklTSEEiLCJUSEkiLCJURVJJU0EiLCJUQVRVTSIsIlRBTkVLQSIsIlNJTU9OTkUiLCJTSEFMQU5EQSIsIlNFUklUQSIsIlJFU1NJRSIsIlJFRlVHSUEiLCJQQVoiLCJPTEVORSIsIk5BIiwiTUVSUklMTCIsIk1BUkdIRVJJVEEiLCJNQU5ESUUiLCJNQU4iLCJNQUlSRSIsIkxZTkRJQSIsIkxVQ0kiLCJMT1JSSUFORSIsIkxPUkVUQSIsIkxFT05JQSIsIkxBVk9OQSIsIkxBU0hBV05EQSIsIkxBS0lBIiwiS1lPS08iLCJLUllTVElOQSIsIktSWVNURU4iLCJLRU5JQSIsIktFTFNJIiwiSlVERSIsIkpFQU5JQ0UiLCJJU09CRUwiLCJHRU9SR0lBTk4iLCJHRU5OWSIsIkZFTElDSURBRCIsIkVJTEVORSIsIkRFT04iLCJERUxPSVNFIiwiREVFREVFIiwiREFOTklFIiwiQ09OQ0VQVElPTiIsIkNMT1JBIiwiQ0hFUklMWU4iLCJDSEFORyIsIkNBTEFORFJBIiwiQkVSUlkiLCJBUk1BTkRJTkEiLCJBTklTQSIsIlVMQSIsIlRJTU9USFkiLCJUSUVSQSIsIlRIRVJFU1NBIiwiU1RFUEhBTklBIiwiU0lNQSIsIlNIWUxBIiwiU0hPTlRBIiwiU0hFUkEiLCJTSEFRVUlUQSIsIlNIQUxBIiwiU0FNTVkiLCJST1NTQU5BIiwiTk9IRU1JIiwiTkVSWSIsIk1PUklBSCIsIk1FTElUQSIsIk1FTElEQSIsIk1FTEFOSSIsIk1BUllMWU5OIiwiTUFSSVNIQSIsIk1BUklFVFRFIiwiTUFMT1JJRSIsIk1BREVMRU5FIiwiTFVESVZJTkEiLCJMT1JJQSIsIkxPUkVUVEUiLCJMT1JBTEVFIiwiTElBTk5FIiwiTEVPTiIsIkxBVkVOSUEiLCJMQVVSSU5EQSIsIkxBU0hPTiIsIktJVCIsIktJTUkiLCJLRUlMQSIsIktBVEVMWU5OIiwiS0FJIiwiSk9ORSIsIkpPQU5FIiwiSkkiLCJKQVlOQSIsIkpBTkVMTEEiLCJKQSIsIkhVRSIsIkhFUlRIQSIsIkZSQU5DRU5FIiwiRUxJTk9SRSIsIkRFU1BJTkEiLCJERUxTSUUiLCJERUVEUkEiLCJDTEVNRU5DSUEiLCJDQVJSWSIsIkNBUk9MSU4iLCJDQVJMT1MiLCJCVUxBSCIsIkJSSVRUQU5JRSIsIkJPSyIsIkJMT05ERUxMIiwiQklCSSIsIkJFQVVMQUgiLCJCRUFUQSIsIkFOTklUQSIsIkFHUklQSU5BIiwiVklSR0VOIiwiVkFMRU5FIiwiVU4iLCJUV0FOREEiLCJUT01NWUUiLCJUT0kiLCJUQVJSQSIsIlRBUkkiLCJUQU1NRVJBIiwiU0hBS0lBIiwiU0FEWUUiLCJSVVRIQU5ORSIsIlJPQ0hFTCIsIlJJVktBIiwiUFVSQSIsIk5FTklUQSIsIk5BVElTSEEiLCJNSU5HIiwiTUVSUklMRUUiLCJNRUxPREVFIiwiTUFSVklTIiwiTFVDSUxMQSIsIkxFRU5BIiwiTEFWRVRBIiwiTEFSSVRBIiwiTEFOSUUiLCJLRVJFTiIsIklMRUVOIiwiR0VPUkdFQU5OIiwiR0VOTkEiLCJHRU5FU0lTIiwiRlJJREEiLCJFV0EiLCJFVUZFTUlBIiwiRU1FTFkiLCJFTEEiLCJFRFlUSCIsIkRFT05OQSIsIkRFQURSQSIsIkRBUkxFTkEiLCJDSEFORUxMIiwiQ0hBTiIsIkNBVEhFUk4iLCJDQVNTT05EUkEiLCJDQVNTQVVORFJBIiwiQkVSTkFSREEiLCJCRVJOQSIsIkFSTElOREEiLCJBTkFNQVJJQSIsIkFMQkVSVCIsIldFU0xFWSIsIlZFUlRJRSIsIlZBTEVSSSIsIlRPUlJJIiwiVEFUWUFOQSIsIlNUQVNJQSIsIlNIRVJJU0UiLCJTSEVSSUxMIiwiU0VBU09OIiwiU0NPVFRJRSIsIlNBTkRBIiwiUlVUSEUiLCJST1NZIiwiUk9CRVJUTyIsIlJPQkJJIiwiUkFORUUiLCJRVVlFTiIsIlBFQVJMWSIsIlBBTE1JUkEiLCJPTklUQSIsIk5JU0hBIiwiTklFU0hBIiwiTklEQSIsIk5FVkFEQSIsIk5BTSIsIk1FUkxZTiIsIk1BWU9MQSIsIk1BUllMT1VJU0UiLCJNQVJZTEFORCIsIk1BUlgiLCJNQVJUSCIsIk1BUkdFTkUiLCJNQURFTEFJTkUiLCJMT05EQSIsIkxFT05USU5FIiwiTEVPTUEiLCJMRUlBIiwiTEFXUkVOQ0UiLCJMQVVSQUxFRSIsIkxBTk9SQSIsIkxBS0lUQSIsIktJWU9LTyIsIktFVFVSQUgiLCJLQVRFTElOIiwiS0FSRUVOIiwiSk9OSUUiLCJKT0hORVRURSIsIkpFTkVFIiwiSkVBTkVUVCIsIklaRVRUQSIsIkhJRURJIiwiSEVJS0UiLCJIQVNTSUUiLCJIQVJPTEQiLCJHSVVTRVBQSU5BIiwiR0VPUkdBTk4iLCJGSURFTEEiLCJGRVJOQU5ERSIsIkVMV0FOREEiLCJFTExBTUFFIiwiRUxJWiIsIkRVU1RJIiwiRE9UVFkiLCJDWU5EWSIsIkNPUkFMSUUiLCJDRUxFU1RBIiwiQVJHRU5USU5BIiwiQUxWRVJUQSIsIlhFTklBIiwiV0FWQSIsIlZBTkVUVEEiLCJUT1JSSUUiLCJUQVNISU5BIiwiVEFORFkiLCJUQU1CUkEiLCJUQU1BIiwiU1RFUEFOSUUiLCJTSElMQSIsIlNIQVVOVEEiLCJTSEFSQU4iLCJTSEFOSVFVQSIsIlNIQUUiLCJTRVRTVUtPIiwiU0VSQUZJTkEiLCJTQU5ERUUiLCJST1NBTUFSSUEiLCJQUklTQ0lMQSIsIk9MSU5EQSIsIk5BREVORSIsIk1VT0kiLCJNSUNIRUxJTkEiLCJNRVJDRURFWiIsIk1BUllST1NFIiwiTUFSSU4iLCJNQVJDRU5FIiwiTUFPIiwiTUFHQUxJIiwiTUFGQUxEQSIsIkxPR0FOIiwiTElOTiIsIkxBTk5JRSIsIktBWUNFIiwiS0FST0xJTkUiLCJLQU1JTEFIIiwiS0FNQUxBIiwiSlVTVEEiLCJKT0xJTkUiLCJKRU5OSU5FIiwiSkFDUVVFVFRBIiwiSVJBSURBIiwiR0VSQUxEIiwiR0VPUkdFQU5OQSIsIkZSQU5DSEVTQ0EiLCJGQUlSWSIsIkVNRUxJTkUiLCJFTEFORSIsIkVIVEVMIiwiRUFSTElFIiwiRFVMQ0lFIiwiREFMRU5FIiwiQ1JJUyIsIkNMQVNTSUUiLCJDSEVSRSIsIkNIQVJJUyIsIkNBUk9ZTE4iLCJDQVJNSU5BIiwiQ0FSSVRBIiwiQlJJQU4iLCJCRVRIQU5JRSIsIkFZQUtPIiwiQVJJQ0EiLCJBTiIsIkFMWVNBIiwiQUxFU1NBTkRSQSIsIkFLSUxBSCIsIkFEUklFTiIsIlpFVFRBIiwiWU9VTEFOREEiLCJZRUxFTkEiLCJZQUhBSVJBIiwiWFVBTiIsIldFTkRPTFlOIiwiVklDVE9SIiwiVElKVUFOQSIsIlRFUlJFTEwiLCJURVJJTkEiLCJURVJFU0lBIiwiU1VaSSIsIlNVTkRBWSIsIlNIRVJFTEwiLCJTSEFWT05EQSIsIlNIQVVOVEUiLCJTSEFSREEiLCJTSEFLSVRBIiwiU0VOQSIsIlJZQU5OIiwiUlVCSSIsIlJJVkEiLCJSRUdJTklBIiwiUkVBIiwiUkFDSEFMIiwiUEFSVEhFTklBIiwiUEFNVUxBIiwiTU9OTklFIiwiTU9ORVQiLCJNSUNIQUVMRSIsIk1FTElBIiwiTUFSSU5FIiwiTUFMS0EiLCJNQUlTSEEiLCJMSVNBTkRSQSIsIkxFTyIsIkxFS0lTSEEiLCJMRUFOIiwiTEFVUkVOQ0UiLCJMQUtFTkRSQSIsIktSWVNUSU4iLCJLT1JUTkVZIiwiS0laWklFIiwiS0lUVElFIiwiS0VSQSIsIktFTkRBTCIsIktFTUJFUkxZIiwiS0FOSVNIQSIsIkpVTEVORSIsIkpVTEUiLCJKT1NIVUEiLCJKT0hBTk5FIiwiSkVGRlJFWSIsIkpBTUVFIiwiSEFOIiwiSEFMTEVZIiwiR0lER0VUIiwiR0FMSU5BIiwiRlJFRFJJQ0tBIiwiRkxFVEEiLCJGQVRJTUFIIiwiRVVTRUJJQSIsIkVMWkEiLCJFTEVPTk9SRSIsIkRPUlRIRVkiLCJET1JJQSIsIkRPTkVMTEEiLCJESU5PUkFIIiwiREVMT1JTRSIsIkNMQVJFVEhBIiwiQ0hSSVNUSU5JQSIsIkNIQVJMWU4iLCJCT05HIiwiQkVMS0lTIiwiQVpaSUUiLCJBTkRFUkEiLCJBSUtPIiwiQURFTkEiLCJZRVIiLCJZQUpBSVJBIiwiV0FOIiwiVkFOSUEiLCJVTFJJS0UiLCJUT1NISUEiLCJUSUZBTlkiLCJTVEVGQU5ZIiwiU0hJWlVFIiwiU0hFTklLQSIsIlNIQVdBTk5BIiwiU0hBUk9MWU4iLCJTSEFSSUxZTiIsIlNIQVFVQU5BIiwiU0hBTlRBWSIsIlNFRSIsIlJPWkFOTkUiLCJST1NFTEVFIiwiUklDS0lFIiwiUkVNT05BIiwiUkVBTk5BIiwiUkFFTEVORSIsIlFVSU5OIiwiUEhVTkciLCJQRVRST05JTEEiLCJOQVRBQ0hBIiwiTkFOQ0VZIiwiTVlSTCIsIk1JWU9LTyIsIk1JRVNIQSIsIk1FUklERVRIIiwiTUFSVkVMTEEiLCJNQVJRVUlUVEEiLCJNQVJIVEEiLCJNQVJDSEVMTEUiLCJMSVpFVEgiLCJMSUJCSUUiLCJMQUhPTUEiLCJMQURBV04iLCJLSU5BIiwiS0FUSEVMRUVOIiwiS0FUSEFSWU4iLCJLQVJJU0EiLCJLQUxFSUdIIiwiSlVOSUUiLCJKVUxJRUFOTiIsIkpPSE5TSUUiLCJKQU5FQU4iLCJKQUlNRUUiLCJKQUNLUVVFTElORSIsIkhJU0FLTyIsIkhFUk1BIiwiSEVMQUlORSIsIkdXWU5FVEgiLCJHTEVOTiIsIkdJVEEiLCJFVVNUT0xJQSIsIkVNRUxJTkEiLCJFTElOIiwiRURSSVMiLCJET05ORVRURSIsIkRPTk5FVFRBIiwiRElFUkRSRSIsIkRFTkFFIiwiREFSQ0VMIiwiQ0xBVURFIiwiQ0xBUklTQSIsIkNJTkRFUkVMTEEiLCJDSElBIiwiQ0hBUkxFU0VUVEEiLCJDSEFSSVRBIiwiQ0VMU0EiLCJDQVNTWSIsIkNBU1NJIiwiQ0FSTEVFIiwiQlJVTkEiLCJCUklUVEFORVkiLCJCUkFOREUiLCJCSUxMSSIsIkJBTyIsIkFOVE9ORVRUQSIsIkFOR0xBIiwiQU5HRUxZTiIsIkFOQUxJU0EiLCJBTEFORSIsIldFTk9OQSIsIldFTkRJRSIsIlZFUk9OSVFVRSIsIlZBTk5FU0EiLCJUT0JJRSIsIlRFTVBJRSIsIlNVTUlLTyIsIlNVTEVNQSIsIlNQQVJLTEUiLCJTT01FUiIsIlNIRUJBIiwiU0hBWU5FIiwiU0hBUklDRSIsIlNIQU5FTCIsIlNIQUxPTiIsIlNBR0UiLCJST1kiLCJST1NJTyIsIlJPU0VMSUEiLCJSRU5BWSIsIlJFTUEiLCJSRUVOQSIsIlBPUlNDSEUiLCJQSU5HIiwiUEVHIiwiT1pJRSIsIk9SRVRIQSIsIk9SQUxFRSIsIk9EQSIsIk5VIiwiTkdBTiIsIk5BS0VTSEEiLCJNSUxMWSIsIk1BUllCRUxMRSIsIk1BUkxJTiIsIk1BUklTIiwiTUFSR1JFVFQiLCJNQVJBR0FSRVQiLCJNQU5JRSIsIkxVUkxFTkUiLCJMSUxMSUEiLCJMSUVTRUxPVFRFIiwiTEFWRUxMRSIsIkxBU0hBVU5EQSIsIkxBS0VFU0hBIiwiS0VJVEgiLCJLQVlDRUUiLCJLQUxZTiIsIkpPWUEiLCJKT0VUVEUiLCJKRU5BRSIsIkpBTklFQ0UiLCJJTExBIiwiR1JJU0VMIiwiR0xBWURTIiwiR0VORVZJRSIsIkdBTEEiLCJGUkVEREEiLCJGUkVEIiwiRUxNRVIiLCJFTEVPTk9SIiwiREVCRVJBIiwiREVBTkRSRUEiLCJEQU4iLCJDT1JSSU5ORSIsIkNPUkRJQSIsIkNPTlRFU1NBIiwiQ09MRU5FIiwiQ0xFT1RJTERFIiwiQ0hBUkxPVFQiLCJDSEFOVEFZIiwiQ0VDSUxMRSIsIkJFQVRSSVMiLCJBWkFMRUUiLCJBUkxFQU4iLCJBUkRBVEgiLCJBTkpFTElDQSIsIkFOSkEiLCJBTEZSRURJQSIsIkFMRUlTSEEiLCJBREFNIiwiWkFEQSIsIllVT05ORSIsIlhJQU8iLCJXSUxMT0RFQU4iLCJXSElUTEVZIiwiVkVOTklFIiwiVkFOTkEiLCJUWUlTSEEiLCJUT1ZBIiwiVE9SSUUiLCJUT05JU0hBIiwiVElMREEiLCJUSUVOIiwiVEVNUExFIiwiU0lSRU5BIiwiU0hFUlJJTCIsIlNIQU5USSIsIlNIQU4iLCJTRU5BSURBIiwiU0FNRUxMQSIsIlJPQkJZTiIsIlJFTkRBIiwiUkVJVEEiLCJQSEVCRSIsIlBBVUxJVEEiLCJOT0JVS08iLCJOR1VZRVQiLCJORU9NSSIsIk1PT04iLCJNSUtBRUxBIiwiTUVMQU5JQSIsIk1BWElNSU5BIiwiTUFSRyIsIk1BSVNJRSIsIkxZTk5BIiwiTElMTEkiLCJMQVlORSIsIkxBU0hBVU4iLCJMQUtFTllBIiwiTEFFTCIsIktJUlNUSUUiLCJLQVRITElORSIsIktBU0hBIiwiS0FSTFlOIiwiS0FSSU1BIiwiSk9WQU4iLCJKT1NFRklORSIsIkpFTk5FTEwiLCJKQUNRVUkiLCJKQUNLRUxZTiIsIkhZTyIsIkhJRU4iLCJHUkFaWU5BIiwiRkxPUlJJRSIsIkZMT1JJQSIsIkVMRU9OT1JBIiwiRFdBTkEiLCJET1JMQSIsIkRPTkciLCJERUxNWSIsIkRFSkEiLCJERURFIiwiREFOTiIsIkNSWVNUQSIsIkNMRUxJQSIsIkNMQVJJUyIsIkNMQVJFTkNFIiwiQ0hJRUtPIiwiQ0hFUkxZTiIsIkNIRVJFTExFIiwiQ0hBUk1BSU4iLCJDSEFSQSIsIkNBTU1ZIiwiQkVFIiwiQVJORVRURSIsIkFSREVMTEUiLCJBTk5JS0EiLCJBTUlFRSIsIkFNRUUiLCJBTExFTkEiLCJZVk9ORSIsIllVS0kiLCJZT1NISUUiLCJZRVZFVFRFIiwiWUFFTCIsIldJTExFVFRBIiwiVk9OQ0lMRSIsIlZFTkVUVEEiLCJUVUxBIiwiVE9ORVRURSIsIlRJTUlLQSIsIlRFTUlLQSIsIlRFTE1BIiwiVEVJU0hBIiwiVEFSRU4iLCJUQSIsIlNUQUNFRSIsIlNISU4iLCJTSEFXTlRBIiwiU0FUVVJOSU5BIiwiUklDQVJEQSIsIlBPSyIsIlBBU1RZIiwiT05JRSIsIk5VQklBIiwiTU9SQSIsIk1JS0UiLCJNQVJJRUxMRSIsIk1BUklFTExBIiwiTUFSSUFORUxBIiwiTUFSREVMTCIsIk1BTlkiLCJMVUFOTkEiLCJMT0lTRSIsIkxJU0FCRVRIIiwiTElORFNZIiwiTElMTElBTkEiLCJMSUxMSUFNIiwiTEVMQUgiLCJMRUlHSEEiLCJMRUFOT1JBIiwiTEFORyIsIktSSVNURUVOIiwiS0hBTElMQUgiLCJLRUVMRVkiLCJLQU5EUkEiLCJKVU5LTyIsIkpPQVFVSU5BIiwiSkVSTEVORSIsIkpBTkkiLCJKQU1JS0EiLCJKQU1FIiwiSFNJVSIsIkhFUk1JTEEiLCJHT0xERU4iLCJHRU5FVklWRSIsIkVWSUEiLCJFVUdFTkEiLCJFTU1BTElORSIsIkVMRlJFREEiLCJFTEVORSIsIkRPTkVUVEUiLCJERUxDSUUiLCJERUVBTk5BIiwiREFSQ0VZIiwiQ1VDIiwiQ0xBUklOREEiLCJDSVJBIiwiQ0hBRSIsIkNFTElOREEiLCJDQVRIRVJZTiIsIkNBVEhFUklOIiwiQ0FTSU1JUkEiLCJDQVJNRUxJQSIsIkNBTUVMTElBIiwiQlJFQU5BIiwiQk9CRVRURSIsIkJFUk5BUkRJTkEiLCJCRUJFIiwiQkFTSUxJQSIsIkFSTFlORSIsIkFNQUwiLCJBTEFZTkEiLCJaT05JQSIsIlpFTklBIiwiWVVSSUtPIiwiWUFFS08iLCJXWU5FTEwiLCJXSUxMT1ciLCJXSUxMRU5BIiwiVkVSTklBIiwiVFUiLCJUUkFWSVMiLCJUT1JBIiwiVEVSUklMWU4iLCJURVJJQ0EiLCJURU5FU0hBIiwiVEFXTkEiLCJUQUpVQU5BIiwiVEFJTkEiLCJTVEVQSE5JRSIsIlNPTkEiLCJTT0wiLCJTSU5BIiwiU0hPTkRSQSIsIlNISVpVS08iLCJTSEVSTEVORSIsIlNIRVJJQ0UiLCJTSEFSSUtBIiwiUk9TU0lFIiwiUk9TRU5BIiwiUk9SWSIsIlJJTUEiLCJSSUEiLCJSSEVCQSIsIlJFTk5BIiwiUEVURVIiLCJOQVRBTFlBIiwiTkFOQ0VFIiwiTUVMT0RJIiwiTUVEQSIsIk1BWElNQSIsIk1BVEhBIiwiTUFSS0VUVEEiLCJNQVJJQ1JVWiIsIk1BUkNFTEVORSIsIk1BTFZJTkEiLCJMVUJBIiwiTE9VRVRUQSIsIkxFSURBIiwiTEVDSUEiLCJMQVVSQU4iLCJMQVNIQVdOQSIsIkxBSU5FIiwiS0hBRElKQUgiLCJLQVRFUklORSIsIktBU0kiLCJLQUxMSUUiLCJKVUxJRVRUQSIsIkpFU1VTSVRBIiwiSkVTVElORSIsIkpFU1NJQSIsIkpFUkVNWSIsIkpFRkZJRSIsIkpBTllDRSIsIklTQURPUkEiLCJHRU9SR0lBTk5FIiwiRklERUxJQSIsIkVWSVRBIiwiRVVSQSIsIkVVTEFIIiwiRVNURUZBTkEiLCJFTFNZIiwiRUxJWkFCRVQiLCJFTEFESUEiLCJET0RJRSIsIkRJT04iLCJESUEiLCJERU5JU1NFIiwiREVMT1JBUyIsIkRFTElMQSIsIkRBWVNJIiwiREFLT1RBIiwiQ1VSVElTIiwiQ1JZU1RMRSIsIkNPTkNIQSIsIkNPTEJZIiwiQ0xBUkVUVEEiLCJDSFUiLCJDSFJJU1RJQSIsIkNIQVJMU0lFIiwiQ0hBUkxFTkEiLCJDQVJZTE9OIiwiQkVUVFlBTk4iLCJBU0xFWSIsIkFTSExFQSIsIkFNSVJBIiwiQUkiLCJBR1VFREEiLCJBR05VUyIsIllVRVRURSIsIlZJTklUQSIsIlZJQ1RPUklOQSIsIlRZTklTSEEiLCJUUkVFTkEiLCJUT0NDQVJBIiwiVElTSCIsIlRIT01BU0VOQSIsIlRFR0FOIiwiU09JTEEiLCJTSElMT0giLCJTSEVOTkEiLCJTSEFSTUFJTkUiLCJTSEFOVEFFIiwiU0hBTkRJIiwiU0VQVEVNQkVSIiwiU0FSQU4iLCJTQVJBSSIsIlNBTkEiLCJTQU1VRUwiLCJTQUxMRVkiLCJST1NFVFRFIiwiUk9MQU5ERSIsIlJFR0lORSIsIk9URUxJQSIsIk9TQ0FSIiwiT0xFVklBIiwiTklDSE9MTEUiLCJORUNPTEUiLCJOQUlEQSIsIk1ZUlRBIiwiTVlFU0hBIiwiTUlUU1VFIiwiTUlOVEEiLCJNRVJUSUUiLCJNQVJHWSIsIk1BSEFMSUEiLCJNQURBTEVORSIsIkxPVkUiLCJMT1VSQSIsIkxPUkVBTiIsIkxFV0lTIiwiTEVTSEEiLCJMRU9OSURBIiwiTEVOSVRBIiwiTEFWT05FIiwiTEFTSEVMTCIsIkxBU0hBTkRSQSIsIkxBTU9OSUNBIiwiS0lNQlJBIiwiS0FUSEVSSU5BIiwiS0FSUlkiLCJLQU5FU0hBIiwiSlVMSU8iLCJKT05HIiwiSkVORVZBIiwiSkFRVUVMWU4iLCJIV0EiLCJHSUxNQSIsIkdISVNMQUlORSIsIkdFUlRSVURJUyIsIkZSQU5TSVNDQSIsIkZFUk1JTkEiLCJFVFRJRSIsIkVUU1VLTyIsIkVMTElTIiwiRUxMQU4iLCJFTElESUEiLCJFRFJBIiwiRE9SRVRIRUEiLCJET1JFQVRIQSIsIkRFTllTRSIsIkRFTk5ZIiwiREVFVFRBIiwiREFJTkUiLCJDWVJTVEFMIiwiQ09SUklOIiwiQ0FZTEEiLCJDQVJMSVRBIiwiQ0FNSUxBIiwiQlVSTUEiLCJCVUxBIiwiQlVFTkEiLCJCTEFLRSIsIkJBUkFCQVJBIiwiQVZSSUwiLCJBVVNUSU4iLCJBTEFJTkUiLCJaQU5BIiwiV0lMSEVNSU5BIiwiV0FORVRUQSIsIlZJUkdJTCIsIlZJIiwiVkVST05JS0EiLCJWRVJOT04iLCJWRVJMSU5FIiwiVkFTSUxJS0kiLCJUT05JVEEiLCJUSVNBIiwiVEVPRklMQSIsIlRBWU5BIiwiVEFVTllBIiwiVEFORFJBIiwiVEFLQUtPIiwiU1VOTkkiLCJTVUFOTkUiLCJTSVhUQSIsIlNIQVJFTEwiLCJTRUVNQSIsIlJVU1NFTEwiLCJST1NFTkRBIiwiUk9CRU5BIiwiUkFZTU9OREUiLCJQRUkiLCJQQU1JTEEiLCJPWkVMTCIsIk5FSURBIiwiTkVFTFkiLCJNSVNUSUUiLCJNSUNIQSIsIk1FUklTU0EiLCJNQVVSSVRBIiwiTUFSWUxOIiwiTUFSWUVUVEEiLCJNQVJTSEFMTCIsIk1BUkNFTEwiLCJNQUxFTkEiLCJNQUtFREEiLCJNQURESUUiLCJMT1ZFVFRBIiwiTE9VUklFIiwiTE9SUklORSIsIkxPUklMRUUiLCJMRVNURVIiLCJMQVVSRU5BIiwiTEFTSEFZIiwiTEFSUkFJTkUiLCJMQVJFRSIsIkxBQ1JFU0hBIiwiS1JJU1RMRSIsIktSSVNITkEiLCJLRVZBIiwiS0VJUkEiLCJLQVJPTEUiLCJKT0lFIiwiSklOTlkiLCJKRUFOTkVUVEEiLCJKQU1BIiwiSEVJRFkiLCJHSUxCRVJURSIsIkdFTUEiLCJGQVZJT0xBIiwiRVZFTFlOTiIsIkVOREEiLCJFTExJIiwiRUxMRU5BIiwiRElWSU5BIiwiREFHTlkiLCJDT0xMRU5FIiwiQ09ESSIsIkNJTkRJRSIsIkNIQVNTSURZIiwiQ0hBU0lEWSIsIkNBVFJJQ0UiLCJDQVRIRVJJTkEiLCJDQVNTRVkiLCJDQVJPTEwiLCJDQVJMRU5BIiwiQ0FORFJBIiwiQ0FMSVNUQSIsIkJSWUFOTkEiLCJCUklUVEVOWSIsIkJFVUxBIiwiQkFSSSIsIkFVRFJJRSIsIkFVRFJJQSIsIkFSREVMSUEiLCJBTk5FTExFIiwiQU5HSUxBIiwiQUxPTkEiLCJBTExZTiIsIkRPVUdMQVMiLCJST0dFUiIsIkpPTkFUSEFOIiwiUkFMUEgiLCJOSUNIT0xBUyIsIkJFTkpBTUlOIiwiQlJVQ0UiLCJIQVJSWSIsIldBWU5FIiwiU1RFVkUiLCJIT1dBUkQiLCJFUk5FU1QiLCJQSElMTElQIiwiVE9ERCIsIkNSQUlHIiwiQUxBTiIsIlBISUxJUCIsIkVBUkwiLCJEQU5OWSIsIkJSWUFOIiwiU1RBTkxFWSIsIkxFT05BUkQiLCJOQVRIQU4iLCJNQU5VRUwiLCJST0RORVkiLCJNQVJWSU4iLCJWSU5DRU5UIiwiSkVGRkVSWSIsIkpFRkYiLCJDSEFEIiwiSkFDT0IiLCJBTEZSRUQiLCJCUkFETEVZIiwiSEVSQkVSVCIsIkZSRURFUklDSyIsIkVEV0lOIiwiRE9OIiwiUklDS1kiLCJSQU5EQUxMIiwiQkFSUlkiLCJCRVJOQVJEIiwiTEVST1kiLCJNQVJDVVMiLCJUSEVPRE9SRSIsIkNMSUZGT1JEIiwiTUlHVUVMIiwiSklNIiwiVE9NIiwiQ0FMVklOIiwiQklMTCIsIkxMT1lEIiwiREVSRUsiLCJXQVJSRU4iLCJEQVJSRUxMIiwiSkVST01FIiwiRkxPWUQiLCJBTFZJTiIsIlRJTSIsIkdPUkRPTiIsIkdSRUciLCJKT1JHRSIsIkRVU1RJTiIsIlBFRFJPIiwiREVSUklDSyIsIlpBQ0hBUlkiLCJIRVJNQU4iLCJHTEVOIiwiSEVDVE9SIiwiUklDQVJETyIsIlJJQ0siLCJCUkVOVCIsIlJBTU9OIiwiR0lMQkVSVCIsIk1BUkMiLCJSRUdJTkFMRCIsIlJVQkVOIiwiTkFUSEFOSUVMIiwiUkFGQUVMIiwiRURHQVIiLCJNSUxUT04iLCJSQVVMIiwiQkVOIiwiQ0hFU1RFUiIsIkRVQU5FIiwiRlJBTktMSU4iLCJCUkFEIiwiUk9OIiwiUk9MQU5EIiwiQVJOT0xEIiwiSEFSVkVZIiwiSkFSRUQiLCJFUklLIiwiREFSUllMIiwiTkVJTCIsIkpBVklFUiIsIkZFUk5BTkRPIiwiQ0xJTlRPTiIsIlRFRCIsIk1BVEhFVyIsIlRZUk9ORSIsIkRBUlJFTiIsIkxBTkNFIiwiS1VSVCIsIkFMTEFOIiwiTkVMU09OIiwiR1VZIiwiQ0xBWVRPTiIsIkhVR0giLCJNQVgiLCJEV0FZTkUiLCJEV0lHSFQiLCJBUk1BTkRPIiwiRkVMSVgiLCJFVkVSRVRUIiwiSUFOIiwiV0FMTEFDRSIsIktFTiIsIkJPQiIsIkFMRlJFRE8iLCJBTEJFUlRPIiwiREFWRSIsIklWQU4iLCJCWVJPTiIsIklTQUFDIiwiTU9SUklTIiwiQ0xJRlRPTiIsIldJTExBUkQiLCJST1NTIiwiQU5EWSIsIlNBTFZBRE9SIiwiS0lSSyIsIlNFUkdJTyIsIlNFVEgiLCJLRU5UIiwiVEVSUkFOQ0UiLCJFRFVBUkRPIiwiVEVSUkVOQ0UiLCJFTlJJUVVFIiwiV0FERSIsIlNUVUFSVCIsIkZSRURSSUNLIiwiQVJUVVJPIiwiQUxFSkFORFJPIiwiTklDSyIsIkxVVEhFUiIsIldFTkRFTEwiLCJKRVJFTUlBSCIsIkpVTElVUyIsIk9USVMiLCJUUkVWT1IiLCJPTElWRVIiLCJMVUtFIiwiSE9NRVIiLCJHRVJBUkQiLCJET1VHIiwiS0VOTlkiLCJIVUJFUlQiLCJMWUxFIiwiTUFUVCIsIkFMRk9OU08iLCJPUkxBTkRPIiwiUkVYIiwiQ0FSTFRPTiIsIkVSTkVTVE8iLCJORUFMIiwiUEFCTE8iLCJMT1JFTlpPIiwiT01BUiIsIldJTEJVUiIsIkdSQU5UIiwiSE9SQUNFIiwiUk9ERVJJQ0siLCJBQlJBSEFNIiwiV0lMTElTIiwiUklDS0VZIiwiQU5EUkVTIiwiQ0VTQVIiLCJKT0hOQVRIQU4iLCJNQUxDT0xNIiwiUlVET0xQSCIsIkRBTU9OIiwiS0VMVklOIiwiUFJFU1RPTiIsIkFMVE9OIiwiQVJDSElFIiwiTUFSQ08iLCJXTSIsIlBFVEUiLCJSQU5ET0xQSCIsIkdBUlJZIiwiR0VPRkZSRVkiLCJKT05BVEhPTiIsIkZFTElQRSIsIkdFUkFSRE8iLCJFRCIsIkRPTUlOSUMiLCJERUxCRVJUIiwiQ09MSU4iLCJHVUlMTEVSTU8iLCJFQVJORVNUIiwiTFVDQVMiLCJCRU5OWSIsIlNQRU5DRVIiLCJST0RPTEZPIiwiTVlST04iLCJFRE1VTkQiLCJHQVJSRVRUIiwiU0FMVkFUT1JFIiwiQ0VEUklDIiwiTE9XRUxMIiwiR1JFR0ciLCJTSEVSTUFOIiwiV0lMU09OIiwiU1lMVkVTVEVSIiwiUk9PU0VWRUxUIiwiSVNSQUVMIiwiSkVSTUFJTkUiLCJGT1JSRVNUIiwiV0lMQkVSVCIsIkxFTEFORCIsIlNJTU9OIiwiQ0xBUksiLCJJUlZJTkciLCJCUllBTlQiLCJPV0VOIiwiUlVGVVMiLCJXT09EUk9XIiwiS1JJU1RPUEhFUiIsIk1BQ0siLCJMRVZJIiwiTUFSQ09TIiwiR1VTVEFWTyIsIkpBS0UiLCJMSU9ORUwiLCJHSUxCRVJUTyIsIkNMSU5UIiwiTklDT0xBUyIsIklTTUFFTCIsIk9SVklMTEUiLCJFUlZJTiIsIkRFV0VZIiwiQUwiLCJXSUxGUkVEIiwiSk9TSCIsIkhVR08iLCJJR05BQ0lPIiwiQ0FMRUIiLCJUT01BUyIsIlNIRUxET04iLCJFUklDSyIsIlNURVdBUlQiLCJET1lMRSIsIkRBUlJFTCIsIlJPR0VMSU8iLCJURVJFTkNFIiwiU0FOVElBR08iLCJBTE9OWk8iLCJFTElBUyIsIkJFUlQiLCJFTEJFUlQiLCJSQU1JUk8iLCJDT05SQUQiLCJOT0FIIiwiR1JBRFkiLCJQSElMIiwiQ09STkVMSVVTIiwiTEFNQVIiLCJST0xBTkRPIiwiQ0xBWSIsIlBFUkNZIiwiREVYVEVSIiwiQlJBREZPUkQiLCJEQVJJTiIsIkFNT1MiLCJNT1NFUyIsIklSVklOIiwiU0FVTCIsIlJPTUFOIiwiUkFOREFMIiwiVElNTVkiLCJEQVJSSU4iLCJXSU5TVE9OIiwiQlJFTkRBTiIsIkFCRUwiLCJET01JTklDSyIsIkJPWUQiLCJFTUlMSU8iLCJFTElKQUgiLCJET01JTkdPIiwiRU1NRVRUIiwiTUFSTE9OIiwiRU1BTlVFTCIsIkpFUkFMRCIsIkVETU9ORCIsIkVNSUwiLCJERVdBWU5FIiwiV0lMTCIsIk9UVE8iLCJURUREWSIsIlJFWU5BTERPIiwiQlJFVCIsIkpFU1MiLCJUUkVOVCIsIkhVTUJFUlRPIiwiRU1NQU5VRUwiLCJTVEVQSEFOIiwiVklDRU5URSIsIkxBTU9OVCIsIkdBUkxBTkQiLCJNSUxFUyIsIkVGUkFJTiIsIkhFQVRIIiwiUk9ER0VSIiwiSEFSTEVZIiwiRVRIQU4iLCJFTERPTiIsIlJPQ0tZIiwiUElFUlJFIiwiSlVOSU9SIiwiRlJFRERZIiwiRUxJIiwiQlJZQ0UiLCJBTlRPSU5FIiwiU1RFUkxJTkciLCJDSEFTRSIsIkdST1ZFUiIsIkVMVE9OIiwiQ0xFVkVMQU5EIiwiRFlMQU4iLCJDSFVDSyIsIkRBTUlBTiIsIlJFVUJFTiIsIlNUQU4iLCJBVUdVU1QiLCJMRU9OQVJETyIsIkpBU1BFUiIsIlJVU1NFTCIsIkVSV0lOIiwiQkVOSVRPIiwiSEFOUyIsIk1PTlRFIiwiQkxBSU5FIiwiRVJOSUUiLCJDVVJUIiwiUVVFTlRJTiIsIkFHVVNUSU4iLCJNVVJSQVkiLCJKQU1BTCIsIkFET0xGTyIsIkhBUlJJU09OIiwiVFlTT04iLCJCVVJUT04iLCJCUkFEWSIsIkVMTElPVFQiLCJXSUxGUkVETyIsIkJBUlQiLCJKQVJST0QiLCJWQU5DRSIsIkRFTklTIiwiREFNSUVOIiwiSk9BUVVJTiIsIkhBUkxBTiIsIkRFU01PTkQiLCJFTExJT1QiLCJEQVJXSU4iLCJHUkVHT1JJTyIsIkJVRERZIiwiWEFWSUVSIiwiS0VSTUlUIiwiUk9TQ09FIiwiRVNURUJBTiIsIkFOVE9OIiwiU09MT01PTiIsIlNDT1RUWSIsIk5PUkJFUlQiLCJFTFZJTiIsIldJTExJQU1TIiwiTk9MQU4iLCJST0QiLCJRVUlOVE9OIiwiSEFMIiwiQlJBSU4iLCJST0IiLCJFTFdPT0QiLCJLRU5EUklDSyIsIkRBUklVUyIsIk1PSVNFUyIsIkZJREVMIiwiVEhBRERFVVMiLCJDTElGRiIsIk1BUkNFTCIsIkpBQ0tTT04iLCJSQVBIQUVMIiwiQlJZT04iLCJBUk1BTkQiLCJBTFZBUk8iLCJKRUZGUlkiLCJEQU5FIiwiSk9FU1BIIiwiVEhVUk1BTiIsIk5FRCIsIlJVU1RZIiwiTU9OVFkiLCJGQUJJQU4iLCJSRUdHSUUiLCJNQVNPTiIsIkdSQUhBTSIsIklTQUlBSCIsIlZBVUdITiIsIkdVUyIsIkxPWUQiLCJESUVHTyIsIkFET0xQSCIsIk5PUlJJUyIsIk1JTExBUkQiLCJST0NDTyIsIkdPTlpBTE8iLCJERVJJQ0siLCJST0RSSUdPIiwiV0lMRVkiLCJSSUdPQkVSVE8iLCJBTFBIT05TTyIsIlRZIiwiTk9FIiwiVkVSTiIsIlJFRUQiLCJKRUZGRVJTT04iLCJFTFZJUyIsIkJFUk5BUkRPIiwiTUFVUklDSU8iLCJISVJBTSIsIkRPTk9WQU4iLCJCQVNJTCIsIlJJTEVZIiwiTklDS09MQVMiLCJNQVlOQVJEIiwiU0NPVCIsIlZJTkNFIiwiUVVJTkNZIiwiRUREWSIsIlNFQkFTVElBTiIsIkZFREVSSUNPIiwiVUxZU1NFUyIsIkhFUklCRVJUTyIsIkRPTk5FTEwiLCJDT0xFIiwiREFWSVMiLCJHQVZJTiIsIkVNRVJZIiwiV0FSRCIsIlJPTUVPIiwiSkFZU09OIiwiREFOVEUiLCJDTEVNRU5UIiwiQ09ZIiwiTUFYV0VMTCIsIkpBUlZJUyIsIkJSVU5PIiwiSVNTQUMiLCJEVURMRVkiLCJCUk9DSyIsIlNBTkZPUkQiLCJDQVJNRUxPIiwiQkFSTkVZIiwiTkVTVE9SIiwiU1RFRkFOIiwiRE9OTlkiLCJBUlQiLCJMSU5XT09EIiwiQkVBVSIsIldFTERPTiIsIkdBTEVOIiwiSVNJRFJPIiwiVFJVTUFOIiwiREVMTUFSIiwiSk9ITkFUSE9OIiwiU0lMQVMiLCJGUkVERVJJQyIsIkRJQ0siLCJJUldJTiIsIk1FUkxJTiIsIkNIQVJMRVkiLCJNQVJDRUxJTk8iLCJIQVJSSVMiLCJDQVJMTyIsIlRSRU5UT04iLCJLVVJUSVMiLCJIVU5URVIiLCJBVVJFTElPIiwiV0lORlJFRCIsIlZJVE8iLCJDT0xMSU4iLCJERU5WRVIiLCJDQVJURVIiLCJMRU9ORUwiLCJFTU9SWSIsIlBBU1FVQUxFIiwiTU9IQU1NQUQiLCJNQVJJQU5PIiwiREFOSUFMIiwiTEFORE9OIiwiRElSSyIsIkJSQU5ERU4iLCJBREFOIiwiQlVGT1JEIiwiR0VSTUFOIiwiV0lMTUVSIiwiRU1FUlNPTiIsIlpBQ0hFUlkiLCJGTEVUQ0hFUiIsIkpBQ1FVRVMiLCJFUlJPTCIsIkRBTFRPTiIsIk1PTlJPRSIsIkpPU1VFIiwiRURXQVJETyIsIkJPT0tFUiIsIldJTEZPUkQiLCJTT05OWSIsIlNIRUxUT04iLCJDQVJTT04iLCJUSEVST04iLCJSQVlNVU5ETyIsIkRBUkVOIiwiSE9VU1RPTiIsIlJPQkJZIiwiTElOQ09MTiIsIkdFTkFSTyIsIkJFTk5FVFQiLCJPQ1RBVklPIiwiQ09STkVMTCIsIkhVTkciLCJBUlJPTiIsIkFOVE9OWSIsIkhFUlNDSEVMIiwiR0lPVkFOTkkiLCJHQVJUSCIsIkNZUlVTIiwiQ1lSSUwiLCJST05OWSIsIkxPTiIsIkZSRUVNQU4iLCJEVU5DQU4iLCJLRU5OSVRIIiwiQ0FSTUlORSIsIkVSSUNIIiwiQ0hBRFdJQ0siLCJXSUxCVVJOIiwiUlVTUyIsIlJFSUQiLCJNWUxFUyIsIkFOREVSU09OIiwiTU9SVE9OIiwiSk9OQVMiLCJGT1JFU1QiLCJNSVRDSEVMIiwiTUVSVklOIiwiWkFORSIsIlJJQ0giLCJKQU1FTCIsIkxBWkFSTyIsIkFMUEhPTlNFIiwiUkFOREVMTCIsIk1BSk9SIiwiSkFSUkVUVCIsIkJST09LUyIsIkFCRFVMIiwiTFVDSUFOTyIsIlNFWU1PVVIiLCJFVUdFTklPIiwiTU9IQU1NRUQiLCJWQUxFTlRJTiIsIkNIQU5DRSIsIkFSTlVMRk8iLCJMVUNJRU4iLCJGRVJESU5BTkQiLCJUSEFEIiwiRVpSQSIsIkFMRE8iLCJSVUJJTiIsIlJPWUFMIiwiTUlUQ0giLCJFQVJMRSIsIkFCRSIsIldZQVRUIiwiTUFSUVVJUyIsIkxBTk5ZIiwiS0FSRUVNIiwiSkFNQVIiLCJCT1JJUyIsIklTSUFIIiwiRU1JTEUiLCJFTE1PIiwiQVJPTiIsIkxFT1BPTERPIiwiRVZFUkVUVEUiLCJKT1NFRiIsIkVMT1kiLCJST0RSSUNLIiwiUkVJTkFMRE8iLCJMVUNJTyIsIkpFUlJPRCIsIldFU1RPTiIsIkhFUlNIRUwiLCJCQVJUT04iLCJQQVJLRVIiLCJMRU1VRUwiLCJCVVJUIiwiSlVMRVMiLCJHSUwiLCJFTElTRU8iLCJBSE1BRCIsIk5JR0VMIiwiRUZSRU4iLCJBTlRXQU4iLCJBTERFTiIsIk1BUkdBUklUTyIsIkNPTEVNQU4iLCJESU5PIiwiT1NWQUxETyIsIkxFUyIsIkRFQU5EUkUiLCJOT1JNQU5EIiwiS0lFVEgiLCJUUkVZIiwiTk9SQkVSVE8iLCJOQVBPTEVPTiIsIkpFUk9MRCIsIkZSSVRaIiwiUk9TRU5ETyIsIk1JTEZPUkQiLCJDSFJJU1RPUEVSIiwiQUxGT05aTyIsIkxZTUFOIiwiSk9TSUFIIiwiQlJBTlQiLCJXSUxUT04iLCJSSUNPIiwiSkFNQUFMIiwiREVXSVRUIiwiQlJFTlRPTiIsIk9MSU4iLCJGT1NURVIiLCJGQVVTVElOTyIsIkNMQVVESU8iLCJKVURTT04iLCJHSU5PIiwiRURHQVJETyIsIkFMRUMiLCJUQU5ORVIiLCJKQVJSRUQiLCJET05OIiwiVEFEIiwiUFJJTkNFIiwiUE9SRklSSU8iLCJPRElTIiwiTEVOQVJEIiwiQ0hBVU5DRVkiLCJUT0QiLCJNRUwiLCJNQVJDRUxPIiwiS09SWSIsIkFVR1VTVFVTIiwiS0VWRU4iLCJISUxBUklPIiwiQlVEIiwiU0FMIiwiT1JWQUwiLCJNQVVSTyIsIlpBQ0hBUklBSCIsIk9MRU4iLCJBTklCQUwiLCJNSUxPIiwiSkVEIiwiRElMTE9OIiwiQU1BRE8iLCJORVdUT04iLCJMRU5OWSIsIlJJQ0hJRSIsIkhPUkFDSU8iLCJCUklDRSIsIk1PSEFNRUQiLCJERUxNRVIiLCJEQVJJTyIsIlJFWUVTIiwiTUFDIiwiSk9OQUgiLCJKRVJST0xEIiwiUk9CVCIsIkhBTksiLCJSVVBFUlQiLCJST0xMQU5EIiwiS0VOVE9OIiwiREFNSU9OIiwiQU5UT05FIiwiV0FMRE8iLCJGUkVEUklDIiwiQlJBRExZIiwiS0lQIiwiQlVSTCIsIldBTEtFUiIsIlRZUkVFIiwiSkVGRkVSRVkiLCJBSE1FRCIsIldJTExZIiwiU1RBTkZPUkQiLCJPUkVOIiwiTk9CTEUiLCJNT1NIRSIsIk1JS0VMIiwiRU5PQ0giLCJCUkVORE9OIiwiUVVJTlRJTiIsIkpBTUlTT04iLCJGTE9SRU5DSU8iLCJEQVJSSUNLIiwiVE9CSUFTIiwiSEFTU0FOIiwiR0lVU0VQUEUiLCJERU1BUkNVUyIsIkNMRVRVUyIsIlRZUkVMTCIsIkxZTkRPTiIsIktFRU5BTiIsIldFUk5FUiIsIkdFUkFMRE8iLCJDT0xVTUJVUyIsIkNIRVQiLCJCRVJUUkFNIiwiTUFSS1VTIiwiSFVFWSIsIkhJTFRPTiIsIkRXQUlOIiwiRE9OVEUiLCJUWVJPTiIsIk9NRVIiLCJJU0FJQVMiLCJISVBPTElUTyIsIkZFUk1JTiIsIkFEQUxCRVJUTyIsIkJPIiwiQkFSUkVUVCIsIlRFT0RPUk8iLCJNQ0tJTkxFWSIsIk1BWElNTyIsIkdBUkZJRUxEIiwiUkFMRUlHSCIsIkxBV0VSRU5DRSIsIkFCUkFNIiwiUkFTSEFEIiwiS0lORyIsIkVNTUlUVCIsIkRBUk9OIiwiU0FNVUFMIiwiTUlRVUVMIiwiRVVTRUJJTyIsIkRPTUVOSUMiLCJEQVJST04iLCJCVVNURVIiLCJXSUxCRVIiLCJSRU5BVE8iLCJKQyIsIkhPWVQiLCJIQVlXT09EIiwiRVpFS0lFTCIsIkNIQVMiLCJGTE9SRU5USU5PIiwiRUxST1kiLCJDTEVNRU5URSIsIkFSREVOIiwiTkVWSUxMRSIsIkVESVNPTiIsIkRFU0hBV04iLCJOQVRIQU5JQUwiLCJKT1JET04iLCJEQU5JTE8iLCJDTEFVRCIsIlNIRVJXT09EIiwiUkFZTU9OIiwiUkFZRk9SRCIsIkNSSVNUT0JBTCIsIkFNQlJPU0UiLCJUSVRVUyIsIkhZTUFOIiwiRkVMVE9OIiwiRVpFUVVJRUwiLCJFUkFTTU8iLCJTVEFOVE9OIiwiTE9OTlkiLCJMRU4iLCJJS0UiLCJNSUxBTiIsIkxJTk8iLCJKQVJPRCIsIkhFUkIiLCJBTkRSRUFTIiwiV0FMVE9OIiwiUkhFVFQiLCJQQUxNRVIiLCJET1VHTEFTUyIsIkNPUkRFTEwiLCJPU1dBTERPIiwiRUxMU1dPUlRIIiwiVklSR0lMSU8iLCJUT05FWSIsIk5BVEhBTkFFTCIsIkRFTCIsIkJFTkVESUNUIiwiTU9TRSIsIkpPSE5TT04iLCJJU1JFQUwiLCJHQVJSRVQiLCJGQVVTVE8iLCJBU0EiLCJBUkxFTiIsIlpBQ0siLCJXQVJORVIiLCJNT0RFU1RPIiwiRlJBTkNFU0NPIiwiTUFOVUFMIiwiR0FZTE9SRCIsIkdBU1RPTiIsIkZJTElCRVJUTyIsIkRFQU5HRUxPIiwiTUlDSEFMRSIsIkdSQU5WSUxMRSIsIldFUyIsIk1BTElLIiwiWkFDS0FSWSIsIlRVQU4iLCJFTERSSURHRSIsIkNSSVNUT1BIRVIiLCJDT1JURVoiLCJBTlRJT05FIiwiTUFMQ09NIiwiTE9ORyIsIktPUkVZIiwiSk9TUEVIIiwiQ09MVE9OIiwiV0FZTE9OIiwiVk9OIiwiSE9TRUEiLCJTSEFEIiwiU0FOVE8iLCJSVURPTEYiLCJST0xGIiwiUkVZIiwiUkVOQUxETyIsIk1BUkNFTExVUyIsIkxVQ0lVUyIsIktSSVNUT0ZFUiIsIkJPWUNFIiwiQkVOVE9OIiwiSEFZREVOIiwiSEFSTEFORCIsIkFSTk9MRE8iLCJSVUVCRU4iLCJMRUFORFJPIiwiS1JBSUciLCJKRVJSRUxMIiwiSkVST01ZIiwiSE9CRVJUIiwiQ0VEUklDSyIsIkFSTElFIiwiV0lORk9SRCIsIldBTExZIiwiTFVJR0kiLCJLRU5FVEgiLCJKQUNJTlRPIiwiR1JBSUciLCJGUkFOS0xZTiIsIkVETVVORE8iLCJTSUQiLCJQT1JURVIiLCJMRUlGIiwiSkVSQU1ZIiwiQlVDSyIsIldJTExJQU4iLCJWSU5DRU5aTyIsIlNIT04iLCJMWU5XT09EIiwiSkVSRSIsIkhBSSIsIkVMREVOIiwiRE9SU0VZIiwiREFSRUxMIiwiQlJPREVSSUNLIiwiQUxPTlNPIg==","base64"));
  names = rawNames.replace(/"/gm, "").split(",");
  return names;
};

alphabeticalValue = function(name) {
  var i, j, ref, sum, v;
  sum = 0;
  for (i = j = 0, ref = name.length; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
    v = name.charCodeAt(i) - 64; // A is 65 in ascii, so this makes the value of 'A' == 1
    sum += v;
  }
  return sum;
};

problem.test = function() {
  return equal(alphabeticalValue("COLIN"), 53, "alphabetical value for COLIN is 53");
};

problem.answer = function() {
  var i, j, len, name, names, sum, v;
  names = readNames();
  names.sort();
  sum = 0;
  for (i = j = 0, len = names.length; j < len; i = ++j) {
    name = names[i];
    v = alphabeticalValue(name) * (i + 1);
    sum += v;
  }
  return sum;
};


}).call(this,require("buffer").Buffer)

},{"buffer":3}],"e023":[function(require,module,exports){
var abundantList, divisorSum, isAbundant, isPerfect, math, problem;

module.exports = problem = new Problem(`
Problem 23: Non-abundant sums
-----------------------------

A perfect number is a number for which the sum of its proper divisors is exactly equal to the number. For example, the sum of the proper divisors of 28 would be 1 + 2 + 4 + 7 + 14 = 28, which means that 28 is a perfect number.

A number n is called deficient if the sum of its proper divisors is less than n and it is called abundant if this sum exceeds n.

As 12 is the smallest abundant number, 1 + 2 + 3 + 4 + 6 = 16, the smallest number that can be written as the sum of two abundant numbers is 24. By mathematical analysis, it can be shown that all integers greater than 28123 can be written as the sum of two abundant numbers. However, this upper limit cannot be reduced any further by analysis even though it is known that the greatest number that cannot be expressed as the sum of two abundant numbers is less than this limit.

Find the sum of all the positive integers which cannot be written as the sum of two abundant numbers.
`);

math = require("math");

divisorSum = function(n) {
  return math.sum(math.divisors(n));
};

isAbundant = function(n) {
  return divisorSum(n) > n;
};

isPerfect = function(n) {
  return divisorSum(n) === n;
};

abundantList = function() {
  var k, list, n;
  list = [];
  for (n = k = 1; k <= 28123; n = ++k) {
    if (isAbundant(n)) {
      list.push(n);
    }
  }
  return list;
};

problem.test = function() {
  return equal(isPerfect(28), true, "28 is a perfect number");
};

problem.answer = function() {
  var i, j, k, l, len, len1, list, m, sum, sumOfAbundantsSeen;
  list = abundantList();
  console.log(list);
  sumOfAbundantsSeen = {};
  for (k = 0, len = list.length; k < len; k++) {
    i = list[k];
    for (l = 0, len1 = list.length; l < len1; l++) {
      j = list[l];
      sumOfAbundantsSeen[i + j] = true;
    }
  }
  sum = 0;
  for (i = m = 1; m <= 28123; i = ++m) {
    if (!sumOfAbundantsSeen[i]) {
      sum += i;
    }
  }
  return sum;
};


},{"math":"math"}],"e024":[function(require,module,exports){
var dijkstraPermuteNext, lexPermuteFast, lexPermuteSlow, permute, problem, swap;

module.exports = problem = new Problem(`
Problem 24: Lexicographic permutations
--------------------------------------

A permutation is an ordered arrangement of objects. For example, 3124 is one possible permutation of the digits 1, 2, 3 and 4. If all of the permutations are listed numerically or alphabetically, we call it lexicographic order. The lexicographic permutations of 0, 1 and 2 are:

                            012   021   102   120   201   210

What is the millionth lexicographic permutation of the digits 0, 1, 2, 3, 4, 5, 6, 7, 8 and 9?
`);

// This function is -way- too slow
permute = function(current, src, dst) {
  var i, k, leftovers, len, newcurrent, results, v;
  results = [];
  for (i = k = 0, len = src.length; k < len; i = ++k) {
    v = src[i];
    newcurrent = current + v;
    if (src.length > 1) {
      leftovers = src.slice(0);
      leftovers.splice(i, 1);
      results.push(permute(newcurrent, leftovers, dst));
    } else {
      results.push(dst.push(newcurrent));
    }
  }
  return results;
};

lexPermuteSlow = function(chars) {
  var dst;
  dst = [];
  permute("", chars.split(""), dst);
  dst.sort();
  return dst;
};

swap = function(arr, a, b) {
  var t;
  t = arr[a];
  arr[a] = arr[b];
  return arr[b] = t;
};

// Don't ask me, ask Dijkstra's A Discipline of Programming, page 71
dijkstraPermuteNext = function(arr) {
  var i, j, results;
  i = arr.length - 1;
  while (arr[i - 1] >= arr[i]) {
    i--;
  }
  j = arr.length;
  while (arr[j - 1] <= arr[i - 1]) {
    j--;
  }
  swap(arr, i - 1, j - 1);
  i++;
  j = arr.length;
  results = [];
  while (i < j) {
    swap(arr, i - 1, j - 1);
    i++;
    results.push(j--);
  }
  return results;
};

lexPermuteFast = function(chars, which) {
  var arr, i, k, ref, v;
  arr = (function() {
    var k, len, results;
    results = [];
    for (k = 0, len = chars.length; k < len; k++) {
      v = chars[k];
      results.push(parseInt(v));
    }
    return results;
  })();
  for (i = k = 1, ref = which; (1 <= ref ? k < ref : k > ref); i = 1 <= ref ? ++k : --k) {
    dijkstraPermuteNext(arr);
  }
  return arr.join("");
};

problem.test = function() {
  equal(lexPermuteFast("012", 4), "120", "4th permutation of 012 is 120, fast version");
  return equal(lexPermuteSlow("012"), "012 021 102 120 201 210".split(" "), "permutation of 012 is 012 021 102 120 201 210, slow version");
};

problem.answer = function() {
  return lexPermuteFast("0123456789", 1000000);
};

// slow version, took ~13 seconds on a 2014 Macbook Pro
// dst = lexPermuteSlow("0123456789")
// return dst[999999] # [0] is first, therefore [999999] is 1,000,000th


},{}],"e025":[function(require,module,exports){
var bigInt, firstFiboWithDigitCount, problem;

module.exports = problem = new Problem(`
Problem 25: 1000-digit Fibonacci number
---------------------------------------

The Fibonacci sequence is defined by the recurrence relation:

F(n) = F(n−1) + F(n−2), where F(1) = 1 and F(2) = 1.
Hence the first 12 terms will be:

F(1)  = 1
F(2)  = 1
F(3)  = 2
F(4)  = 3
F(5)  = 5
F(6)  = 8
F(7)  = 13
F(8)  = 21
F(9)  = 34
F(10) = 55
F(11) = 89
F(12) = 144
The 12th term, F(12), is the first term to contain three digits.

What is the first term in the Fibonacci sequence to contain 1000 digits?
`);

bigInt = require("big-integer");

firstFiboWithDigitCount = function(n) {
  var curr, digitCount, index, next, prev, str;
  index = 1;
  prev = new bigInt(0);
  curr = new bigInt(1);
  while (true) {
    str = String(curr);
    digitCount = str.length;
    if (digitCount >= n) {
      return [index, str];
    }
    next = curr.plus(prev);
    prev = curr;
    curr = next;
    index++;
  }
};

problem.test = function() {
  return equal(firstFiboWithDigitCount(3), [12, "144"], "first fibonacci with 3 digits is F(12) = 144");
};

problem.answer = function() {
  return firstFiboWithDigitCount(1000);
};


},{"big-integer":2}],"math":[function(require,module,exports){
var IncrementalSieve, root;

root = typeof exports !== "undefined" && exports !== null ? exports : this;

// Sieve was blindly taken/adapted from RosettaCode. DONT EVEN CARE
IncrementalSieve = class IncrementalSieve {
  constructor() {
    this.n = 0;
  }

  next() {
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
  }

};

root.IncrementalSieve = IncrementalSieve;

// -----------------------------------------------------------------------------------
// Shamelessly pilfered/adopted from http://www.javascripter.net/faq/numberisprime.htm
root.leastFactor = function(n) {
  var i, j, m, ref;
  if (isNaN(n) || !isFinite(n)) {
    return 0/0;
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
  for (i = j = 7, ref = m; j <= ref; i = j += 30) {
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

// -----------------------------------------------------------------------------------
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

// This does a brute-force attempt at combining all of the prime factors (2^n attempts).
// I'm sure there is a cooler way.
root.divisors = function(n) {
  var attempt, combosToTry, divisorList, factor, factorsSeen, i, j, k, len, primes, ref, v;
  primes = root.primeFactors(n);
  combosToTry = Math.pow(2, primes.length);
  factorsSeen = {};
  for (attempt = j = 0, ref = combosToTry; (0 <= ref ? j < ref : j > ref); attempt = 0 <= ref ? ++j : --j) {
    factor = 1;
    for (i = k = 0, len = primes.length; k < len; i = ++k) {
      v = primes[i];
      if (attempt & (1 << i)) {
        factor *= v;
      }
    }
    if (factor < n) {
      factorsSeen[factor] = true;
    }
  }
  divisorList = (function() {
    var l, len1, ref1, results;
    ref1 = Object.keys(factorsSeen);
    results = [];
    for (l = 0, len1 = ref1.length; l < len1; l++) {
      v = ref1[l];
      results.push(parseInt(v));
    }
    return results;
  })();
  return divisorList;
};

root.sum = function(numberArray) {
  var j, len, n, sum;
  sum = 0;
  for (j = 0, len = numberArray.length; j < len; j++) {
    n = numberArray[j];
    sum += n;
  }
  return sum;
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
var LAST_PROBLEM, Problem, root;

LAST_PROBLEM = 25;

root = window; // exports ? this

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
  moduleName = `e${('000' + index).slice(-3)}`;
  window.index = index;
  problem = require(moduleName);
  problem.process();
  if (cb) {
    return window.setTimeout(cb, 0);
  }
};

Problem = class Problem {
  constructor(description) {
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

  now() {
    if (window.performance) {
      return window.performance.now();
    } else {
      return new Date().getTime();
    }
  }

  process() {
    var answer, answerFunc, end, formattedTitle, ms, sourceLine, start, testFunc, url;
    if (window.args.description) {
      window.terminal.echo("[[;#444444;]_______________________________________________________________________________________________]\n");
    }
    formattedTitle = $.terminal.format(`[[;#ffaa00;]${this.title}]`);
    url = `?c=${window.args.cmd}_${this.index}`;
    if (window.args.verbose) {
      url += "_v";
    }
    window.terminal.echo(`<a href=\"${url}\">${formattedTitle}</a>`, {
      raw: true
    });
    if (window.args.description) {
      window.terminal.echo(`[[;#444444;]${this.line}]`);
      window.terminal.echo(`[[;#ccccee;]${this.description}]\n`);
      sourceLine = $.terminal.format("[[;#444444;]Source:] ");
      sourceLine += ` <a href=\"src/e${('000' + this.index).slice(-3)}.coffee\">` + $.terminal.format("[[;#773300;]Local]") + "</a> ";
      sourceLine += $.terminal.format("[[;#444444;]/]");
      sourceLine += ` <a href=\"https://github.com/joedrago/euler/blob/master/src/e${('000' + this.index).slice(-3)}.coffee\">` + $.terminal.format("[[;#773300;]Github]") + "</a>";
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
      return window.terminal.echo(`[[;#ffffff;] -> ][[;#aaffaa;]Answer:] ([[;#aaffff;]${ms.toFixed(1)}ms]): [[;#ffffff;]${escapedStringify(answer)}]`);
    }
  }

};

root.Problem = Problem;

root.ok = function(v, msg) {
  return window.terminal.echo(`[[;#ffffff;] *  ]${v}: ${msg}`);
};

root.equal = function(a, b, msg) {
  var i, isEqual, j, ref;
  if ($.isArray(a) && $.isArray(b)) {
    isEqual = a.length === b.length;
    if (isEqual) {
      for (i = j = 0, ref = a.length; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
        if (a[i] !== b[i]) {
          isEqual = false;
          break;
        }
      }
    }
  } else {
    isEqual = a === b;
  }
  if (isEqual) {
    return window.terminal.echo(`[[;#ffffff;] *  ][[;#555555;]PASS: ${msg}]`);
  } else {
    return window.terminal.echo(`[[;#ffffff;] *  ][[;#ffaaaa;]FAIL: ${msg} (${a} != ${b})]`);
  }
};

root.onCommand = (command) => {
  var arg, args, cmd, j, len, process, ref, v;
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
  ref = cmd.args;
  for (j = 0, len = ref.length; j < len; j++) {
    arg = ref[j];
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
        window.terminal.echo(`[[;#ffaaaa;]No such test: ${v} (valid tests 1-${LAST_PROBLEM})]`);
      }
    }
  }
  if (args.list.length === 0) {
    args.startIndex = 1;
    args.endIndex = LAST_PROBLEM;
  }
  // Since all of our commands happen to have unique first letters, let people be super lazy/silly
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
  } else if (cmd.name[0] === 's') {
    args.cmd = "show";
    args.test = true;
    args.answer = true;
    args.description = true;
  } else if (cmd.name[0] === 'd') {
    args.cmd = "describe";
    args.description = true;
  } else if (cmd.name[0] === 'h') {
    args.cmd = "help";
    process = false;
    window.terminal.echo(`Commands:

    list [X]     - List problem titles
    describe [X] - Display full problem descriptions
    test [X]     - Run unit tests
    answer [X]   - Time and calculate answer
    run [X]      - test and answer combined
    show [X]     - describe, test, and answer combined
    help         - This help

    In all of these, [X] can be a list of one or more problem numbers. (a value from 1 to ${LAST_PROBLEM}). If absent, it implies all problems.
    Also, adding the word "verbose" to some of these commands will emit the description before performing the task.
`);
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


},{}]},{},[])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uXFwuLlxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiLi5cXC4uXFxub2RlX21vZHVsZXNcXGJhc2U2NC1qc1xcaW5kZXguanMiLCIuLlxcLi5cXG5vZGVfbW9kdWxlc1xcYmlnLWludGVnZXJcXEJpZ0ludGVnZXIuanMiLCIuLlxcLi5cXG5vZGVfbW9kdWxlc1xcYnVmZmVyXFxpbmRleC5qcyIsIi4uXFwuLlxcbm9kZV9tb2R1bGVzXFxpZWVlNzU0XFxpbmRleC5qcyIsIi4uXFwuLlxcc3JjXFxlMDAxLmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDAyLmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDAzLmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDA0LmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDA1LmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDA2LmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDA3LmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDA4LmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDA5LmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDEwLmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDExLmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDEyLmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDEzLmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDE0LmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDE1LmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDE2LmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDE3LmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDE4LmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDE5LmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDIwLmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDIxLmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDIyLmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDIzLmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDI0LmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxlMDI1LmNvZmZlZSIsIi4uXFwuLlxcc3JjXFxtYXRoLmNvZmZlZSIsIi4uXFwuLlxcc3JjXFx0ZXJtaW5hbC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzc2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2p2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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Z0IsSUFBaEIsRUFERjs7QUFsRmUiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIndXNlIHN0cmljdCdcblxuZXhwb3J0cy5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuZXhwb3J0cy50b0J5dGVBcnJheSA9IHRvQnl0ZUFycmF5XG5leHBvcnRzLmZyb21CeXRlQXJyYXkgPSBmcm9tQnl0ZUFycmF5XG5cbnZhciBsb29rdXAgPSBbXVxudmFyIHJldkxvb2t1cCA9IFtdXG52YXIgQXJyID0gdHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnID8gVWludDhBcnJheSA6IEFycmF5XG5cbnZhciBjb2RlID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nXG5mb3IgKHZhciBpID0gMCwgbGVuID0gY29kZS5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICBsb29rdXBbaV0gPSBjb2RlW2ldXG4gIHJldkxvb2t1cFtjb2RlLmNoYXJDb2RlQXQoaSldID0gaVxufVxuXG4vLyBTdXBwb3J0IGRlY29kaW5nIFVSTC1zYWZlIGJhc2U2NCBzdHJpbmdzLCBhcyBOb2RlLmpzIGRvZXMuXG4vLyBTZWU6IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Jhc2U2NCNVUkxfYXBwbGljYXRpb25zXG5yZXZMb29rdXBbJy0nLmNoYXJDb2RlQXQoMCldID0gNjJcbnJldkxvb2t1cFsnXycuY2hhckNvZGVBdCgwKV0gPSA2M1xuXG5mdW5jdGlvbiBnZXRMZW5zIChiNjQpIHtcbiAgdmFyIGxlbiA9IGI2NC5sZW5ndGhcblxuICBpZiAobGVuICUgNCA+IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuICB9XG5cbiAgLy8gVHJpbSBvZmYgZXh0cmEgYnl0ZXMgYWZ0ZXIgcGxhY2Vob2xkZXIgYnl0ZXMgYXJlIGZvdW5kXG4gIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2JlYXRnYW1taXQvYmFzZTY0LWpzL2lzc3Vlcy80MlxuICB2YXIgdmFsaWRMZW4gPSBiNjQuaW5kZXhPZignPScpXG4gIGlmICh2YWxpZExlbiA9PT0gLTEpIHZhbGlkTGVuID0gbGVuXG5cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IHZhbGlkTGVuID09PSBsZW5cbiAgICA/IDBcbiAgICA6IDQgLSAodmFsaWRMZW4gJSA0KVxuXG4gIHJldHVybiBbdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbl1cbn1cblxuLy8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChiNjQpIHtcbiAgdmFyIGxlbnMgPSBnZXRMZW5zKGI2NClcbiAgdmFyIHZhbGlkTGVuID0gbGVuc1swXVxuICB2YXIgcGxhY2VIb2xkZXJzTGVuID0gbGVuc1sxXVxuICByZXR1cm4gKCh2YWxpZExlbiArIHBsYWNlSG9sZGVyc0xlbikgKiAzIC8gNCkgLSBwbGFjZUhvbGRlcnNMZW5cbn1cblxuZnVuY3Rpb24gX2J5dGVMZW5ndGggKGI2NCwgdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbikge1xuICByZXR1cm4gKCh2YWxpZExlbiArIHBsYWNlSG9sZGVyc0xlbikgKiAzIC8gNCkgLSBwbGFjZUhvbGRlcnNMZW5cbn1cblxuZnVuY3Rpb24gdG9CeXRlQXJyYXkgKGI2NCkge1xuICB2YXIgdG1wXG4gIHZhciBsZW5zID0gZ2V0TGVucyhiNjQpXG4gIHZhciB2YWxpZExlbiA9IGxlbnNbMF1cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IGxlbnNbMV1cblxuICB2YXIgYXJyID0gbmV3IEFycihfYnl0ZUxlbmd0aChiNjQsIHZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW4pKVxuXG4gIHZhciBjdXJCeXRlID0gMFxuXG4gIC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcbiAgdmFyIGxlbiA9IHBsYWNlSG9sZGVyc0xlbiA+IDBcbiAgICA/IHZhbGlkTGVuIC0gNFxuICAgIDogdmFsaWRMZW5cblxuICB2YXIgaVxuICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpICs9IDQpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMTgpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA8PCAxMikgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMildIDw8IDYpIHxcbiAgICAgIHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMyldXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDE2KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gOCkgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICBpZiAocGxhY2VIb2xkZXJzTGVuID09PSAyKSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDIpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA+PiA0KVxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgaWYgKHBsYWNlSG9sZGVyc0xlbiA9PT0gMSkge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAxMCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldIDw8IDQpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDIpXSA+PiAyKVxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiA4KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBhcnJcbn1cblxuZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcbiAgcmV0dXJuIGxvb2t1cFtudW0gPj4gMTggJiAweDNGXSArXG4gICAgbG9va3VwW251bSA+PiAxMiAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtID4+IDYgJiAweDNGXSArXG4gICAgbG9va3VwW251bSAmIDB4M0ZdXG59XG5cbmZ1bmN0aW9uIGVuY29kZUNodW5rICh1aW50OCwgc3RhcnQsIGVuZCkge1xuICB2YXIgdG1wXG4gIHZhciBvdXRwdXQgPSBbXVxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkgKz0gMykge1xuICAgIHRtcCA9XG4gICAgICAoKHVpbnQ4W2ldIDw8IDE2KSAmIDB4RkYwMDAwKSArXG4gICAgICAoKHVpbnQ4W2kgKyAxXSA8PCA4KSAmIDB4RkYwMCkgK1xuICAgICAgKHVpbnQ4W2kgKyAyXSAmIDB4RkYpXG4gICAgb3V0cHV0LnB1c2godHJpcGxldFRvQmFzZTY0KHRtcCkpXG4gIH1cbiAgcmV0dXJuIG91dHB1dC5qb2luKCcnKVxufVxuXG5mdW5jdGlvbiBmcm9tQnl0ZUFycmF5ICh1aW50OCkge1xuICB2YXIgdG1wXG4gIHZhciBsZW4gPSB1aW50OC5sZW5ndGhcbiAgdmFyIGV4dHJhQnl0ZXMgPSBsZW4gJSAzIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG4gIHZhciBwYXJ0cyA9IFtdXG4gIHZhciBtYXhDaHVua0xlbmd0aCA9IDE2MzgzIC8vIG11c3QgYmUgbXVsdGlwbGUgb2YgM1xuXG4gIC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbjIgPSBsZW4gLSBleHRyYUJ5dGVzOyBpIDwgbGVuMjsgaSArPSBtYXhDaHVua0xlbmd0aCkge1xuICAgIHBhcnRzLnB1c2goZW5jb2RlQ2h1bmsoXG4gICAgICB1aW50OCwgaSwgKGkgKyBtYXhDaHVua0xlbmd0aCkgPiBsZW4yID8gbGVuMiA6IChpICsgbWF4Q2h1bmtMZW5ndGgpXG4gICAgKSlcbiAgfVxuXG4gIC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcbiAgaWYgKGV4dHJhQnl0ZXMgPT09IDEpIHtcbiAgICB0bXAgPSB1aW50OFtsZW4gLSAxXVxuICAgIHBhcnRzLnB1c2goXG4gICAgICBsb29rdXBbdG1wID4+IDJdICtcbiAgICAgIGxvb2t1cFsodG1wIDw8IDQpICYgMHgzRl0gK1xuICAgICAgJz09J1xuICAgIClcbiAgfSBlbHNlIGlmIChleHRyYUJ5dGVzID09PSAyKSB7XG4gICAgdG1wID0gKHVpbnQ4W2xlbiAtIDJdIDw8IDgpICsgdWludDhbbGVuIC0gMV1cbiAgICBwYXJ0cy5wdXNoKFxuICAgICAgbG9va3VwW3RtcCA+PiAxMF0gK1xuICAgICAgbG9va3VwWyh0bXAgPj4gNCkgJiAweDNGXSArXG4gICAgICBsb29rdXBbKHRtcCA8PCAyKSAmIDB4M0ZdICtcbiAgICAgICc9J1xuICAgIClcbiAgfVxuXG4gIHJldHVybiBwYXJ0cy5qb2luKCcnKVxufVxuIiwidmFyIGJpZ0ludCA9IChmdW5jdGlvbiAodW5kZWZpbmVkKSB7XHJcbiAgICBcInVzZSBzdHJpY3RcIjtcclxuXHJcbiAgICB2YXIgQkFTRSA9IDFlNyxcclxuICAgICAgICBMT0dfQkFTRSA9IDcsXHJcbiAgICAgICAgTUFYX0lOVCA9IDkwMDcxOTkyNTQ3NDA5OTIsXHJcbiAgICAgICAgTUFYX0lOVF9BUlIgPSBzbWFsbFRvQXJyYXkoTUFYX0lOVCksXHJcbiAgICAgICAgREVGQVVMVF9BTFBIQUJFVCA9IFwiMDEyMzQ1Njc4OWFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6XCI7XHJcblxyXG4gICAgdmFyIHN1cHBvcnRzTmF0aXZlQmlnSW50ID0gdHlwZW9mIEJpZ0ludCA9PT0gXCJmdW5jdGlvblwiO1xyXG5cclxuICAgIGZ1bmN0aW9uIEludGVnZXIodiwgcmFkaXgsIGFscGhhYmV0LCBjYXNlU2Vuc2l0aXZlKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2ID09PSBcInVuZGVmaW5lZFwiKSByZXR1cm4gSW50ZWdlclswXTtcclxuICAgICAgICBpZiAodHlwZW9mIHJhZGl4ICE9PSBcInVuZGVmaW5lZFwiKSByZXR1cm4gK3JhZGl4ID09PSAxMCAmJiAhYWxwaGFiZXQgPyBwYXJzZVZhbHVlKHYpIDogcGFyc2VCYXNlKHYsIHJhZGl4LCBhbHBoYWJldCwgY2FzZVNlbnNpdGl2ZSk7XHJcbiAgICAgICAgcmV0dXJuIHBhcnNlVmFsdWUodik7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gQmlnSW50ZWdlcih2YWx1ZSwgc2lnbikge1xyXG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcclxuICAgICAgICB0aGlzLnNpZ24gPSBzaWduO1xyXG4gICAgICAgIHRoaXMuaXNTbWFsbCA9IGZhbHNlO1xyXG4gICAgfVxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEludGVnZXIucHJvdG90eXBlKTtcclxuXHJcbiAgICBmdW5jdGlvbiBTbWFsbEludGVnZXIodmFsdWUpIHtcclxuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgdGhpcy5zaWduID0gdmFsdWUgPCAwO1xyXG4gICAgICAgIHRoaXMuaXNTbWFsbCA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBTbWFsbEludGVnZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShJbnRlZ2VyLnByb3RvdHlwZSk7XHJcblxyXG4gICAgZnVuY3Rpb24gTmF0aXZlQmlnSW50KHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSW50ZWdlci5wcm90b3R5cGUpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGlzUHJlY2lzZShuKSB7XHJcbiAgICAgICAgcmV0dXJuIC1NQVhfSU5UIDwgbiAmJiBuIDwgTUFYX0lOVDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzbWFsbFRvQXJyYXkobikgeyAvLyBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucyBkb2Vzbid0IHJlZmVyZW5jZSBCQVNFLCBuZWVkIHRvIGNoYW5nZSB0aGlzIGZ1bmN0aW9uIGlmIEJBU0UgY2hhbmdlc1xyXG4gICAgICAgIGlmIChuIDwgMWU3KVxyXG4gICAgICAgICAgICByZXR1cm4gW25dO1xyXG4gICAgICAgIGlmIChuIDwgMWUxNClcclxuICAgICAgICAgICAgcmV0dXJuIFtuICUgMWU3LCBNYXRoLmZsb29yKG4gLyAxZTcpXTtcclxuICAgICAgICByZXR1cm4gW24gJSAxZTcsIE1hdGguZmxvb3IobiAvIDFlNykgJSAxZTcsIE1hdGguZmxvb3IobiAvIDFlMTQpXTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhcnJheVRvU21hbGwoYXJyKSB7IC8vIElmIEJBU0UgY2hhbmdlcyB0aGlzIGZ1bmN0aW9uIG1heSBuZWVkIHRvIGNoYW5nZVxyXG4gICAgICAgIHRyaW0oYXJyKTtcclxuICAgICAgICB2YXIgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICBpZiAobGVuZ3RoIDwgNCAmJiBjb21wYXJlQWJzKGFyciwgTUFYX0lOVF9BUlIpIDwgMCkge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKGxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAwOiByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIGNhc2UgMTogcmV0dXJuIGFyclswXTtcclxuICAgICAgICAgICAgICAgIGNhc2UgMjogcmV0dXJuIGFyclswXSArIGFyclsxXSAqIEJBU0U7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiByZXR1cm4gYXJyWzBdICsgKGFyclsxXSArIGFyclsyXSAqIEJBU0UpICogQkFTRTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRyaW0odikge1xyXG4gICAgICAgIHZhciBpID0gdi5sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKHZbLS1pXSA9PT0gMCk7XHJcbiAgICAgICAgdi5sZW5ndGggPSBpICsgMTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjcmVhdGVBcnJheShsZW5ndGgpIHsgLy8gZnVuY3Rpb24gc2hhbWVsZXNzbHkgc3RvbGVuIGZyb20gWWFmZmxlJ3MgbGlicmFyeSBodHRwczovL2dpdGh1Yi5jb20vWWFmZmxlL0JpZ0ludGVnZXJcclxuICAgICAgICB2YXIgeCA9IG5ldyBBcnJheShsZW5ndGgpO1xyXG4gICAgICAgIHZhciBpID0gLTE7XHJcbiAgICAgICAgd2hpbGUgKCsraSA8IGxlbmd0aCkge1xyXG4gICAgICAgICAgICB4W2ldID0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHg7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdHJ1bmNhdGUobikge1xyXG4gICAgICAgIGlmIChuID4gMCkgcmV0dXJuIE1hdGguZmxvb3Iobik7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguY2VpbChuKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhZGQoYSwgYikgeyAvLyBhc3N1bWVzIGEgYW5kIGIgYXJlIGFycmF5cyB3aXRoIGEubGVuZ3RoID49IGIubGVuZ3RoXHJcbiAgICAgICAgdmFyIGxfYSA9IGEubGVuZ3RoLFxyXG4gICAgICAgICAgICBsX2IgPSBiLmxlbmd0aCxcclxuICAgICAgICAgICAgciA9IG5ldyBBcnJheShsX2EpLFxyXG4gICAgICAgICAgICBjYXJyeSA9IDAsXHJcbiAgICAgICAgICAgIGJhc2UgPSBCQVNFLFxyXG4gICAgICAgICAgICBzdW0sIGk7XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxfYjsgaSsrKSB7XHJcbiAgICAgICAgICAgIHN1bSA9IGFbaV0gKyBiW2ldICsgY2Fycnk7XHJcbiAgICAgICAgICAgIGNhcnJ5ID0gc3VtID49IGJhc2UgPyAxIDogMDtcclxuICAgICAgICAgICAgcltpXSA9IHN1bSAtIGNhcnJ5ICogYmFzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgd2hpbGUgKGkgPCBsX2EpIHtcclxuICAgICAgICAgICAgc3VtID0gYVtpXSArIGNhcnJ5O1xyXG4gICAgICAgICAgICBjYXJyeSA9IHN1bSA9PT0gYmFzZSA/IDEgOiAwO1xyXG4gICAgICAgICAgICByW2krK10gPSBzdW0gLSBjYXJyeSAqIGJhc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChjYXJyeSA+IDApIHIucHVzaChjYXJyeSk7XHJcbiAgICAgICAgcmV0dXJuIHI7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYWRkQW55KGEsIGIpIHtcclxuICAgICAgICBpZiAoYS5sZW5ndGggPj0gYi5sZW5ndGgpIHJldHVybiBhZGQoYSwgYik7XHJcbiAgICAgICAgcmV0dXJuIGFkZChiLCBhKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhZGRTbWFsbChhLCBjYXJyeSkgeyAvLyBhc3N1bWVzIGEgaXMgYXJyYXksIGNhcnJ5IGlzIG51bWJlciB3aXRoIDAgPD0gY2FycnkgPCBNQVhfSU5UXHJcbiAgICAgICAgdmFyIGwgPSBhLmxlbmd0aCxcclxuICAgICAgICAgICAgciA9IG5ldyBBcnJheShsKSxcclxuICAgICAgICAgICAgYmFzZSA9IEJBU0UsXHJcbiAgICAgICAgICAgIHN1bSwgaTtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHN1bSA9IGFbaV0gLSBiYXNlICsgY2Fycnk7XHJcbiAgICAgICAgICAgIGNhcnJ5ID0gTWF0aC5mbG9vcihzdW0gLyBiYXNlKTtcclxuICAgICAgICAgICAgcltpXSA9IHN1bSAtIGNhcnJ5ICogYmFzZTtcclxuICAgICAgICAgICAgY2FycnkgKz0gMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgd2hpbGUgKGNhcnJ5ID4gMCkge1xyXG4gICAgICAgICAgICByW2krK10gPSBjYXJyeSAlIGJhc2U7XHJcbiAgICAgICAgICAgIGNhcnJ5ID0gTWF0aC5mbG9vcihjYXJyeSAvIGJhc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcjtcclxuICAgIH1cclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHZhciBuID0gcGFyc2VWYWx1ZSh2KTtcclxuICAgICAgICBpZiAodGhpcy5zaWduICE9PSBuLnNpZ24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3VidHJhY3Qobi5uZWdhdGUoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBhID0gdGhpcy52YWx1ZSwgYiA9IG4udmFsdWU7XHJcbiAgICAgICAgaWYgKG4uaXNTbWFsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEJpZ0ludGVnZXIoYWRkU21hbGwoYSwgTWF0aC5hYnMoYikpLCB0aGlzLnNpZ24pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbmV3IEJpZ0ludGVnZXIoYWRkQW55KGEsIGIpLCB0aGlzLnNpZ24pO1xyXG4gICAgfTtcclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLnBsdXMgPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hZGQ7XHJcblxyXG4gICAgU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHZhciBuID0gcGFyc2VWYWx1ZSh2KTtcclxuICAgICAgICB2YXIgYSA9IHRoaXMudmFsdWU7XHJcbiAgICAgICAgaWYgKGEgPCAwICE9PSBuLnNpZ24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3VidHJhY3Qobi5uZWdhdGUoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBiID0gbi52YWx1ZTtcclxuICAgICAgICBpZiAobi5pc1NtYWxsKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1ByZWNpc2UoYSArIGIpKSByZXR1cm4gbmV3IFNtYWxsSW50ZWdlcihhICsgYik7XHJcbiAgICAgICAgICAgIGIgPSBzbWFsbFRvQXJyYXkoTWF0aC5hYnMoYikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbmV3IEJpZ0ludGVnZXIoYWRkU21hbGwoYiwgTWF0aC5hYnMoYSkpLCBhIDwgMCk7XHJcbiAgICB9O1xyXG4gICAgU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5wbHVzID0gU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5hZGQ7XHJcblxyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHJldHVybiBuZXcgTmF0aXZlQmlnSW50KHRoaXMudmFsdWUgKyBwYXJzZVZhbHVlKHYpLnZhbHVlKTtcclxuICAgIH1cclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUucGx1cyA9IE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuYWRkO1xyXG5cclxuICAgIGZ1bmN0aW9uIHN1YnRyYWN0KGEsIGIpIHsgLy8gYXNzdW1lcyBhIGFuZCBiIGFyZSBhcnJheXMgd2l0aCBhID49IGJcclxuICAgICAgICB2YXIgYV9sID0gYS5sZW5ndGgsXHJcbiAgICAgICAgICAgIGJfbCA9IGIubGVuZ3RoLFxyXG4gICAgICAgICAgICByID0gbmV3IEFycmF5KGFfbCksXHJcbiAgICAgICAgICAgIGJvcnJvdyA9IDAsXHJcbiAgICAgICAgICAgIGJhc2UgPSBCQVNFLFxyXG4gICAgICAgICAgICBpLCBkaWZmZXJlbmNlO1xyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBiX2w7IGkrKykge1xyXG4gICAgICAgICAgICBkaWZmZXJlbmNlID0gYVtpXSAtIGJvcnJvdyAtIGJbaV07XHJcbiAgICAgICAgICAgIGlmIChkaWZmZXJlbmNlIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgZGlmZmVyZW5jZSArPSBiYXNlO1xyXG4gICAgICAgICAgICAgICAgYm9ycm93ID0gMTtcclxuICAgICAgICAgICAgfSBlbHNlIGJvcnJvdyA9IDA7XHJcbiAgICAgICAgICAgIHJbaV0gPSBkaWZmZXJlbmNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGkgPSBiX2w7IGkgPCBhX2w7IGkrKykge1xyXG4gICAgICAgICAgICBkaWZmZXJlbmNlID0gYVtpXSAtIGJvcnJvdztcclxuICAgICAgICAgICAgaWYgKGRpZmZlcmVuY2UgPCAwKSBkaWZmZXJlbmNlICs9IGJhc2U7XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcltpKytdID0gZGlmZmVyZW5jZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJbaV0gPSBkaWZmZXJlbmNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKDsgaSA8IGFfbDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHJbaV0gPSBhW2ldO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0cmltKHIpO1xyXG4gICAgICAgIHJldHVybiByO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHN1YnRyYWN0QW55KGEsIGIsIHNpZ24pIHtcclxuICAgICAgICB2YXIgdmFsdWU7XHJcbiAgICAgICAgaWYgKGNvbXBhcmVBYnMoYSwgYikgPj0gMCkge1xyXG4gICAgICAgICAgICB2YWx1ZSA9IHN1YnRyYWN0KGEsIGIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0gc3VidHJhY3QoYiwgYSk7XHJcbiAgICAgICAgICAgIHNpZ24gPSAhc2lnbjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFsdWUgPSBhcnJheVRvU21hbGwodmFsdWUpO1xyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICAgICAgaWYgKHNpZ24pIHZhbHVlID0gLXZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFNtYWxsSW50ZWdlcih2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBuZXcgQmlnSW50ZWdlcih2YWx1ZSwgc2lnbik7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc3VidHJhY3RTbWFsbChhLCBiLCBzaWduKSB7IC8vIGFzc3VtZXMgYSBpcyBhcnJheSwgYiBpcyBudW1iZXIgd2l0aCAwIDw9IGIgPCBNQVhfSU5UXHJcbiAgICAgICAgdmFyIGwgPSBhLmxlbmd0aCxcclxuICAgICAgICAgICAgciA9IG5ldyBBcnJheShsKSxcclxuICAgICAgICAgICAgY2FycnkgPSAtYixcclxuICAgICAgICAgICAgYmFzZSA9IEJBU0UsXHJcbiAgICAgICAgICAgIGksIGRpZmZlcmVuY2U7XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgICAgICBkaWZmZXJlbmNlID0gYVtpXSArIGNhcnJ5O1xyXG4gICAgICAgICAgICBjYXJyeSA9IE1hdGguZmxvb3IoZGlmZmVyZW5jZSAvIGJhc2UpO1xyXG4gICAgICAgICAgICBkaWZmZXJlbmNlICU9IGJhc2U7XHJcbiAgICAgICAgICAgIHJbaV0gPSBkaWZmZXJlbmNlIDwgMCA/IGRpZmZlcmVuY2UgKyBiYXNlIDogZGlmZmVyZW5jZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgciA9IGFycmF5VG9TbWFsbChyKTtcclxuICAgICAgICBpZiAodHlwZW9mIHIgPT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICAgICAgaWYgKHNpZ24pIHIgPSAtcjtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBTbWFsbEludGVnZXIocik7XHJcbiAgICAgICAgfSByZXR1cm4gbmV3IEJpZ0ludGVnZXIociwgc2lnbik7XHJcbiAgICB9XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuc3VidHJhY3QgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHZhciBuID0gcGFyc2VWYWx1ZSh2KTtcclxuICAgICAgICBpZiAodGhpcy5zaWduICE9PSBuLnNpZ24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkKG4ubmVnYXRlKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgYSA9IHRoaXMudmFsdWUsIGIgPSBuLnZhbHVlO1xyXG4gICAgICAgIGlmIChuLmlzU21hbGwpXHJcbiAgICAgICAgICAgIHJldHVybiBzdWJ0cmFjdFNtYWxsKGEsIE1hdGguYWJzKGIpLCB0aGlzLnNpZ24pO1xyXG4gICAgICAgIHJldHVybiBzdWJ0cmFjdEFueShhLCBiLCB0aGlzLnNpZ24pO1xyXG4gICAgfTtcclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLm1pbnVzID0gQmlnSW50ZWdlci5wcm90b3R5cGUuc3VidHJhY3Q7XHJcblxyXG4gICAgU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5zdWJ0cmFjdCA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgdmFyIG4gPSBwYXJzZVZhbHVlKHYpO1xyXG4gICAgICAgIHZhciBhID0gdGhpcy52YWx1ZTtcclxuICAgICAgICBpZiAoYSA8IDAgIT09IG4uc2lnbikge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hZGQobi5uZWdhdGUoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBiID0gbi52YWx1ZTtcclxuICAgICAgICBpZiAobi5pc1NtYWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgU21hbGxJbnRlZ2VyKGEgLSBiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHN1YnRyYWN0U21hbGwoYiwgTWF0aC5hYnMoYSksIGEgPj0gMCk7XHJcbiAgICB9O1xyXG4gICAgU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5taW51cyA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUuc3VidHJhY3Q7XHJcblxyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5zdWJ0cmFjdCA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBOYXRpdmVCaWdJbnQodGhpcy52YWx1ZSAtIHBhcnNlVmFsdWUodikudmFsdWUpO1xyXG4gICAgfVxyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5taW51cyA9IE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuc3VidHJhY3Q7XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUubmVnYXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgQmlnSW50ZWdlcih0aGlzLnZhbHVlLCAhdGhpcy5zaWduKTtcclxuICAgIH07XHJcbiAgICBTbWFsbEludGVnZXIucHJvdG90eXBlLm5lZ2F0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgc2lnbiA9IHRoaXMuc2lnbjtcclxuICAgICAgICB2YXIgc21hbGwgPSBuZXcgU21hbGxJbnRlZ2VyKC10aGlzLnZhbHVlKTtcclxuICAgICAgICBzbWFsbC5zaWduID0gIXNpZ247XHJcbiAgICAgICAgcmV0dXJuIHNtYWxsO1xyXG4gICAgfTtcclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUubmVnYXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgTmF0aXZlQmlnSW50KC10aGlzLnZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hYnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCaWdJbnRlZ2VyKHRoaXMudmFsdWUsIGZhbHNlKTtcclxuICAgIH07XHJcbiAgICBTbWFsbEludGVnZXIucHJvdG90eXBlLmFicyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFNtYWxsSW50ZWdlcihNYXRoLmFicyh0aGlzLnZhbHVlKSk7XHJcbiAgICB9O1xyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5hYnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBOYXRpdmVCaWdJbnQodGhpcy52YWx1ZSA+PSAwID8gdGhpcy52YWx1ZSA6IC10aGlzLnZhbHVlKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgZnVuY3Rpb24gbXVsdGlwbHlMb25nKGEsIGIpIHtcclxuICAgICAgICB2YXIgYV9sID0gYS5sZW5ndGgsXHJcbiAgICAgICAgICAgIGJfbCA9IGIubGVuZ3RoLFxyXG4gICAgICAgICAgICBsID0gYV9sICsgYl9sLFxyXG4gICAgICAgICAgICByID0gY3JlYXRlQXJyYXkobCksXHJcbiAgICAgICAgICAgIGJhc2UgPSBCQVNFLFxyXG4gICAgICAgICAgICBwcm9kdWN0LCBjYXJyeSwgaSwgYV9pLCBiX2o7XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGFfbDsgKytpKSB7XHJcbiAgICAgICAgICAgIGFfaSA9IGFbaV07XHJcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYl9sOyArK2opIHtcclxuICAgICAgICAgICAgICAgIGJfaiA9IGJbal07XHJcbiAgICAgICAgICAgICAgICBwcm9kdWN0ID0gYV9pICogYl9qICsgcltpICsgal07XHJcbiAgICAgICAgICAgICAgICBjYXJyeSA9IE1hdGguZmxvb3IocHJvZHVjdCAvIGJhc2UpO1xyXG4gICAgICAgICAgICAgICAgcltpICsgal0gPSBwcm9kdWN0IC0gY2FycnkgKiBiYXNlO1xyXG4gICAgICAgICAgICAgICAgcltpICsgaiArIDFdICs9IGNhcnJ5O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRyaW0ocik7XHJcbiAgICAgICAgcmV0dXJuIHI7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbXVsdGlwbHlTbWFsbChhLCBiKSB7IC8vIGFzc3VtZXMgYSBpcyBhcnJheSwgYiBpcyBudW1iZXIgd2l0aCB8YnwgPCBCQVNFXHJcbiAgICAgICAgdmFyIGwgPSBhLmxlbmd0aCxcclxuICAgICAgICAgICAgciA9IG5ldyBBcnJheShsKSxcclxuICAgICAgICAgICAgYmFzZSA9IEJBU0UsXHJcbiAgICAgICAgICAgIGNhcnJ5ID0gMCxcclxuICAgICAgICAgICAgcHJvZHVjdCwgaTtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHByb2R1Y3QgPSBhW2ldICogYiArIGNhcnJ5O1xyXG4gICAgICAgICAgICBjYXJyeSA9IE1hdGguZmxvb3IocHJvZHVjdCAvIGJhc2UpO1xyXG4gICAgICAgICAgICByW2ldID0gcHJvZHVjdCAtIGNhcnJ5ICogYmFzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgd2hpbGUgKGNhcnJ5ID4gMCkge1xyXG4gICAgICAgICAgICByW2krK10gPSBjYXJyeSAlIGJhc2U7XHJcbiAgICAgICAgICAgIGNhcnJ5ID0gTWF0aC5mbG9vcihjYXJyeSAvIGJhc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzaGlmdExlZnQoeCwgbikge1xyXG4gICAgICAgIHZhciByID0gW107XHJcbiAgICAgICAgd2hpbGUgKG4tLSA+IDApIHIucHVzaCgwKTtcclxuICAgICAgICByZXR1cm4gci5jb25jYXQoeCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbXVsdGlwbHlLYXJhdHN1YmEoeCwgeSkge1xyXG4gICAgICAgIHZhciBuID0gTWF0aC5tYXgoeC5sZW5ndGgsIHkubGVuZ3RoKTtcclxuXHJcbiAgICAgICAgaWYgKG4gPD0gMzApIHJldHVybiBtdWx0aXBseUxvbmcoeCwgeSk7XHJcbiAgICAgICAgbiA9IE1hdGguY2VpbChuIC8gMik7XHJcblxyXG4gICAgICAgIHZhciBiID0geC5zbGljZShuKSxcclxuICAgICAgICAgICAgYSA9IHguc2xpY2UoMCwgbiksXHJcbiAgICAgICAgICAgIGQgPSB5LnNsaWNlKG4pLFxyXG4gICAgICAgICAgICBjID0geS5zbGljZSgwLCBuKTtcclxuXHJcbiAgICAgICAgdmFyIGFjID0gbXVsdGlwbHlLYXJhdHN1YmEoYSwgYyksXHJcbiAgICAgICAgICAgIGJkID0gbXVsdGlwbHlLYXJhdHN1YmEoYiwgZCksXHJcbiAgICAgICAgICAgIGFiY2QgPSBtdWx0aXBseUthcmF0c3ViYShhZGRBbnkoYSwgYiksIGFkZEFueShjLCBkKSk7XHJcblxyXG4gICAgICAgIHZhciBwcm9kdWN0ID0gYWRkQW55KGFkZEFueShhYywgc2hpZnRMZWZ0KHN1YnRyYWN0KHN1YnRyYWN0KGFiY2QsIGFjKSwgYmQpLCBuKSksIHNoaWZ0TGVmdChiZCwgMiAqIG4pKTtcclxuICAgICAgICB0cmltKHByb2R1Y3QpO1xyXG4gICAgICAgIHJldHVybiBwcm9kdWN0O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFRoZSBmb2xsb3dpbmcgZnVuY3Rpb24gaXMgZGVyaXZlZCBmcm9tIGEgc3VyZmFjZSBmaXQgb2YgYSBncmFwaCBwbG90dGluZyB0aGUgcGVyZm9ybWFuY2UgZGlmZmVyZW5jZVxyXG4gICAgLy8gYmV0d2VlbiBsb25nIG11bHRpcGxpY2F0aW9uIGFuZCBrYXJhdHN1YmEgbXVsdGlwbGljYXRpb24gdmVyc3VzIHRoZSBsZW5ndGhzIG9mIHRoZSB0d28gYXJyYXlzLlxyXG4gICAgZnVuY3Rpb24gdXNlS2FyYXRzdWJhKGwxLCBsMikge1xyXG4gICAgICAgIHJldHVybiAtMC4wMTIgKiBsMSAtIDAuMDEyICogbDIgKyAwLjAwMDAxNSAqIGwxICogbDIgPiAwO1xyXG4gICAgfVxyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLm11bHRpcGx5ID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICB2YXIgbiA9IHBhcnNlVmFsdWUodiksXHJcbiAgICAgICAgICAgIGEgPSB0aGlzLnZhbHVlLCBiID0gbi52YWx1ZSxcclxuICAgICAgICAgICAgc2lnbiA9IHRoaXMuc2lnbiAhPT0gbi5zaWduLFxyXG4gICAgICAgICAgICBhYnM7XHJcbiAgICAgICAgaWYgKG4uaXNTbWFsbCkge1xyXG4gICAgICAgICAgICBpZiAoYiA9PT0gMCkgcmV0dXJuIEludGVnZXJbMF07XHJcbiAgICAgICAgICAgIGlmIChiID09PSAxKSByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgaWYgKGIgPT09IC0xKSByZXR1cm4gdGhpcy5uZWdhdGUoKTtcclxuICAgICAgICAgICAgYWJzID0gTWF0aC5hYnMoYik7XHJcbiAgICAgICAgICAgIGlmIChhYnMgPCBCQVNFKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEJpZ0ludGVnZXIobXVsdGlwbHlTbWFsbChhLCBhYnMpLCBzaWduKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBiID0gc21hbGxUb0FycmF5KGFicyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh1c2VLYXJhdHN1YmEoYS5sZW5ndGgsIGIubGVuZ3RoKSkgLy8gS2FyYXRzdWJhIGlzIG9ubHkgZmFzdGVyIGZvciBjZXJ0YWluIGFycmF5IHNpemVzXHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQmlnSW50ZWdlcihtdWx0aXBseUthcmF0c3ViYShhLCBiKSwgc2lnbik7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCaWdJbnRlZ2VyKG11bHRpcGx5TG9uZyhhLCBiKSwgc2lnbik7XHJcbiAgICB9O1xyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLnRpbWVzID0gQmlnSW50ZWdlci5wcm90b3R5cGUubXVsdGlwbHk7XHJcblxyXG4gICAgZnVuY3Rpb24gbXVsdGlwbHlTbWFsbEFuZEFycmF5KGEsIGIsIHNpZ24pIHsgLy8gYSA+PSAwXHJcbiAgICAgICAgaWYgKGEgPCBCQVNFKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQmlnSW50ZWdlcihtdWx0aXBseVNtYWxsKGIsIGEpLCBzaWduKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCaWdJbnRlZ2VyKG11bHRpcGx5TG9uZyhiLCBzbWFsbFRvQXJyYXkoYSkpLCBzaWduKTtcclxuICAgIH1cclxuICAgIFNtYWxsSW50ZWdlci5wcm90b3R5cGUuX211bHRpcGx5QnlTbWFsbCA9IGZ1bmN0aW9uIChhKSB7XHJcbiAgICAgICAgaWYgKGlzUHJlY2lzZShhLnZhbHVlICogdGhpcy52YWx1ZSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBTbWFsbEludGVnZXIoYS52YWx1ZSAqIHRoaXMudmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbXVsdGlwbHlTbWFsbEFuZEFycmF5KE1hdGguYWJzKGEudmFsdWUpLCBzbWFsbFRvQXJyYXkoTWF0aC5hYnModGhpcy52YWx1ZSkpLCB0aGlzLnNpZ24gIT09IGEuc2lnbik7XHJcbiAgICB9O1xyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuX211bHRpcGx5QnlTbWFsbCA9IGZ1bmN0aW9uIChhKSB7XHJcbiAgICAgICAgaWYgKGEudmFsdWUgPT09IDApIHJldHVybiBJbnRlZ2VyWzBdO1xyXG4gICAgICAgIGlmIChhLnZhbHVlID09PSAxKSByZXR1cm4gdGhpcztcclxuICAgICAgICBpZiAoYS52YWx1ZSA9PT0gLTEpIHJldHVybiB0aGlzLm5lZ2F0ZSgpO1xyXG4gICAgICAgIHJldHVybiBtdWx0aXBseVNtYWxsQW5kQXJyYXkoTWF0aC5hYnMoYS52YWx1ZSksIHRoaXMudmFsdWUsIHRoaXMuc2lnbiAhPT0gYS5zaWduKTtcclxuICAgIH07XHJcbiAgICBTbWFsbEludGVnZXIucHJvdG90eXBlLm11bHRpcGx5ID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICByZXR1cm4gcGFyc2VWYWx1ZSh2KS5fbXVsdGlwbHlCeVNtYWxsKHRoaXMpO1xyXG4gICAgfTtcclxuICAgIFNtYWxsSW50ZWdlci5wcm90b3R5cGUudGltZXMgPSBTbWFsbEludGVnZXIucHJvdG90eXBlLm11bHRpcGx5O1xyXG5cclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUubXVsdGlwbHkgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHJldHVybiBuZXcgTmF0aXZlQmlnSW50KHRoaXMudmFsdWUgKiBwYXJzZVZhbHVlKHYpLnZhbHVlKTtcclxuICAgIH1cclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUudGltZXMgPSBOYXRpdmVCaWdJbnQucHJvdG90eXBlLm11bHRpcGx5O1xyXG5cclxuICAgIGZ1bmN0aW9uIHNxdWFyZShhKSB7XHJcbiAgICAgICAgLy9jb25zb2xlLmFzc2VydCgyICogQkFTRSAqIEJBU0UgPCBNQVhfSU5UKTtcclxuICAgICAgICB2YXIgbCA9IGEubGVuZ3RoLFxyXG4gICAgICAgICAgICByID0gY3JlYXRlQXJyYXkobCArIGwpLFxyXG4gICAgICAgICAgICBiYXNlID0gQkFTRSxcclxuICAgICAgICAgICAgcHJvZHVjdCwgY2FycnksIGksIGFfaSwgYV9qO1xyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgICAgYV9pID0gYVtpXTtcclxuICAgICAgICAgICAgY2FycnkgPSAwIC0gYV9pICogYV9pO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gaTsgaiA8IGw7IGorKykge1xyXG4gICAgICAgICAgICAgICAgYV9qID0gYVtqXTtcclxuICAgICAgICAgICAgICAgIHByb2R1Y3QgPSAyICogKGFfaSAqIGFfaikgKyByW2kgKyBqXSArIGNhcnJ5O1xyXG4gICAgICAgICAgICAgICAgY2FycnkgPSBNYXRoLmZsb29yKHByb2R1Y3QgLyBiYXNlKTtcclxuICAgICAgICAgICAgICAgIHJbaSArIGpdID0gcHJvZHVjdCAtIGNhcnJ5ICogYmFzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByW2kgKyBsXSA9IGNhcnJ5O1xyXG4gICAgICAgIH1cclxuICAgICAgICB0cmltKHIpO1xyXG4gICAgICAgIHJldHVybiByO1xyXG4gICAgfVxyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLnNxdWFyZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IEJpZ0ludGVnZXIoc3F1YXJlKHRoaXMudmFsdWUpLCBmYWxzZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIFNtYWxsSW50ZWdlci5wcm90b3R5cGUuc3F1YXJlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB2YWx1ZSA9IHRoaXMudmFsdWUgKiB0aGlzLnZhbHVlO1xyXG4gICAgICAgIGlmIChpc1ByZWNpc2UodmFsdWUpKSByZXR1cm4gbmV3IFNtYWxsSW50ZWdlcih2YWx1ZSk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCaWdJbnRlZ2VyKHNxdWFyZShzbWFsbFRvQXJyYXkoTWF0aC5hYnModGhpcy52YWx1ZSkpKSwgZmFsc2UpO1xyXG4gICAgfTtcclxuXHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLnNxdWFyZSA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBOYXRpdmVCaWdJbnQodGhpcy52YWx1ZSAqIHRoaXMudmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRpdk1vZDEoYSwgYikgeyAvLyBMZWZ0IG92ZXIgZnJvbSBwcmV2aW91cyB2ZXJzaW9uLiBQZXJmb3JtcyBmYXN0ZXIgdGhhbiBkaXZNb2QyIG9uIHNtYWxsZXIgaW5wdXQgc2l6ZXMuXHJcbiAgICAgICAgdmFyIGFfbCA9IGEubGVuZ3RoLFxyXG4gICAgICAgICAgICBiX2wgPSBiLmxlbmd0aCxcclxuICAgICAgICAgICAgYmFzZSA9IEJBU0UsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IGNyZWF0ZUFycmF5KGIubGVuZ3RoKSxcclxuICAgICAgICAgICAgZGl2aXNvck1vc3RTaWduaWZpY2FudERpZ2l0ID0gYltiX2wgLSAxXSxcclxuICAgICAgICAgICAgLy8gbm9ybWFsaXphdGlvblxyXG4gICAgICAgICAgICBsYW1iZGEgPSBNYXRoLmNlaWwoYmFzZSAvICgyICogZGl2aXNvck1vc3RTaWduaWZpY2FudERpZ2l0KSksXHJcbiAgICAgICAgICAgIHJlbWFpbmRlciA9IG11bHRpcGx5U21hbGwoYSwgbGFtYmRhKSxcclxuICAgICAgICAgICAgZGl2aXNvciA9IG11bHRpcGx5U21hbGwoYiwgbGFtYmRhKSxcclxuICAgICAgICAgICAgcXVvdGllbnREaWdpdCwgc2hpZnQsIGNhcnJ5LCBib3Jyb3csIGksIGwsIHE7XHJcbiAgICAgICAgaWYgKHJlbWFpbmRlci5sZW5ndGggPD0gYV9sKSByZW1haW5kZXIucHVzaCgwKTtcclxuICAgICAgICBkaXZpc29yLnB1c2goMCk7XHJcbiAgICAgICAgZGl2aXNvck1vc3RTaWduaWZpY2FudERpZ2l0ID0gZGl2aXNvcltiX2wgLSAxXTtcclxuICAgICAgICBmb3IgKHNoaWZ0ID0gYV9sIC0gYl9sOyBzaGlmdCA+PSAwOyBzaGlmdC0tKSB7XHJcbiAgICAgICAgICAgIHF1b3RpZW50RGlnaXQgPSBiYXNlIC0gMTtcclxuICAgICAgICAgICAgaWYgKHJlbWFpbmRlcltzaGlmdCArIGJfbF0gIT09IGRpdmlzb3JNb3N0U2lnbmlmaWNhbnREaWdpdCkge1xyXG4gICAgICAgICAgICAgICAgcXVvdGllbnREaWdpdCA9IE1hdGguZmxvb3IoKHJlbWFpbmRlcltzaGlmdCArIGJfbF0gKiBiYXNlICsgcmVtYWluZGVyW3NoaWZ0ICsgYl9sIC0gMV0pIC8gZGl2aXNvck1vc3RTaWduaWZpY2FudERpZ2l0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBxdW90aWVudERpZ2l0IDw9IGJhc2UgLSAxXHJcbiAgICAgICAgICAgIGNhcnJ5ID0gMDtcclxuICAgICAgICAgICAgYm9ycm93ID0gMDtcclxuICAgICAgICAgICAgbCA9IGRpdmlzb3IubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBjYXJyeSArPSBxdW90aWVudERpZ2l0ICogZGl2aXNvcltpXTtcclxuICAgICAgICAgICAgICAgIHEgPSBNYXRoLmZsb29yKGNhcnJ5IC8gYmFzZSk7XHJcbiAgICAgICAgICAgICAgICBib3Jyb3cgKz0gcmVtYWluZGVyW3NoaWZ0ICsgaV0gLSAoY2FycnkgLSBxICogYmFzZSk7XHJcbiAgICAgICAgICAgICAgICBjYXJyeSA9IHE7XHJcbiAgICAgICAgICAgICAgICBpZiAoYm9ycm93IDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbWFpbmRlcltzaGlmdCArIGldID0gYm9ycm93ICsgYmFzZTtcclxuICAgICAgICAgICAgICAgICAgICBib3Jyb3cgPSAtMTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVtYWluZGVyW3NoaWZ0ICsgaV0gPSBib3Jyb3c7XHJcbiAgICAgICAgICAgICAgICAgICAgYm9ycm93ID0gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB3aGlsZSAoYm9ycm93ICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBxdW90aWVudERpZ2l0IC09IDE7XHJcbiAgICAgICAgICAgICAgICBjYXJyeSA9IDA7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FycnkgKz0gcmVtYWluZGVyW3NoaWZ0ICsgaV0gLSBiYXNlICsgZGl2aXNvcltpXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY2FycnkgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbWFpbmRlcltzaGlmdCArIGldID0gY2FycnkgKyBiYXNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJyeSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVtYWluZGVyW3NoaWZ0ICsgaV0gPSBjYXJyeTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FycnkgPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJvcnJvdyArPSBjYXJyeTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXN1bHRbc2hpZnRdID0gcXVvdGllbnREaWdpdDtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gZGVub3JtYWxpemF0aW9uXHJcbiAgICAgICAgcmVtYWluZGVyID0gZGl2TW9kU21hbGwocmVtYWluZGVyLCBsYW1iZGEpWzBdO1xyXG4gICAgICAgIHJldHVybiBbYXJyYXlUb1NtYWxsKHJlc3VsdCksIGFycmF5VG9TbWFsbChyZW1haW5kZXIpXTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkaXZNb2QyKGEsIGIpIHsgLy8gSW1wbGVtZW50YXRpb24gaWRlYSBzaGFtZWxlc3NseSBzdG9sZW4gZnJvbSBTaWxlbnQgTWF0dCdzIGxpYnJhcnkgaHR0cDovL3NpbGVudG1hdHQuY29tL2JpZ2ludGVnZXIvXHJcbiAgICAgICAgLy8gUGVyZm9ybXMgZmFzdGVyIHRoYW4gZGl2TW9kMSBvbiBsYXJnZXIgaW5wdXQgc2l6ZXMuXHJcbiAgICAgICAgdmFyIGFfbCA9IGEubGVuZ3RoLFxyXG4gICAgICAgICAgICBiX2wgPSBiLmxlbmd0aCxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIHBhcnQgPSBbXSxcclxuICAgICAgICAgICAgYmFzZSA9IEJBU0UsXHJcbiAgICAgICAgICAgIGd1ZXNzLCB4bGVuLCBoaWdoeCwgaGlnaHksIGNoZWNrO1xyXG4gICAgICAgIHdoaWxlIChhX2wpIHtcclxuICAgICAgICAgICAgcGFydC51bnNoaWZ0KGFbLS1hX2xdKTtcclxuICAgICAgICAgICAgdHJpbShwYXJ0KTtcclxuICAgICAgICAgICAgaWYgKGNvbXBhcmVBYnMocGFydCwgYikgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCgwKTtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHhsZW4gPSBwYXJ0Lmxlbmd0aDtcclxuICAgICAgICAgICAgaGlnaHggPSBwYXJ0W3hsZW4gLSAxXSAqIGJhc2UgKyBwYXJ0W3hsZW4gLSAyXTtcclxuICAgICAgICAgICAgaGlnaHkgPSBiW2JfbCAtIDFdICogYmFzZSArIGJbYl9sIC0gMl07XHJcbiAgICAgICAgICAgIGlmICh4bGVuID4gYl9sKSB7XHJcbiAgICAgICAgICAgICAgICBoaWdoeCA9IChoaWdoeCArIDEpICogYmFzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBndWVzcyA9IE1hdGguY2VpbChoaWdoeCAvIGhpZ2h5KTtcclxuICAgICAgICAgICAgZG8ge1xyXG4gICAgICAgICAgICAgICAgY2hlY2sgPSBtdWx0aXBseVNtYWxsKGIsIGd1ZXNzKTtcclxuICAgICAgICAgICAgICAgIGlmIChjb21wYXJlQWJzKGNoZWNrLCBwYXJ0KSA8PSAwKSBicmVhaztcclxuICAgICAgICAgICAgICAgIGd1ZXNzLS07XHJcbiAgICAgICAgICAgIH0gd2hpbGUgKGd1ZXNzKTtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2goZ3Vlc3MpO1xyXG4gICAgICAgICAgICBwYXJ0ID0gc3VidHJhY3QocGFydCwgY2hlY2spO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXN1bHQucmV2ZXJzZSgpO1xyXG4gICAgICAgIHJldHVybiBbYXJyYXlUb1NtYWxsKHJlc3VsdCksIGFycmF5VG9TbWFsbChwYXJ0KV07XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGl2TW9kU21hbGwodmFsdWUsIGxhbWJkYSkge1xyXG4gICAgICAgIHZhciBsZW5ndGggPSB2YWx1ZS5sZW5ndGgsXHJcbiAgICAgICAgICAgIHF1b3RpZW50ID0gY3JlYXRlQXJyYXkobGVuZ3RoKSxcclxuICAgICAgICAgICAgYmFzZSA9IEJBU0UsXHJcbiAgICAgICAgICAgIGksIHEsIHJlbWFpbmRlciwgZGl2aXNvcjtcclxuICAgICAgICByZW1haW5kZXIgPSAwO1xyXG4gICAgICAgIGZvciAoaSA9IGxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XHJcbiAgICAgICAgICAgIGRpdmlzb3IgPSByZW1haW5kZXIgKiBiYXNlICsgdmFsdWVbaV07XHJcbiAgICAgICAgICAgIHEgPSB0cnVuY2F0ZShkaXZpc29yIC8gbGFtYmRhKTtcclxuICAgICAgICAgICAgcmVtYWluZGVyID0gZGl2aXNvciAtIHEgKiBsYW1iZGE7XHJcbiAgICAgICAgICAgIHF1b3RpZW50W2ldID0gcSB8IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBbcXVvdGllbnQsIHJlbWFpbmRlciB8IDBdO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRpdk1vZEFueShzZWxmLCB2KSB7XHJcbiAgICAgICAgdmFyIHZhbHVlLCBuID0gcGFyc2VWYWx1ZSh2KTtcclxuICAgICAgICBpZiAoc3VwcG9ydHNOYXRpdmVCaWdJbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtuZXcgTmF0aXZlQmlnSW50KHNlbGYudmFsdWUgLyBuLnZhbHVlKSwgbmV3IE5hdGl2ZUJpZ0ludChzZWxmLnZhbHVlICUgbi52YWx1ZSldO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgYSA9IHNlbGYudmFsdWUsIGIgPSBuLnZhbHVlO1xyXG4gICAgICAgIHZhciBxdW90aWVudDtcclxuICAgICAgICBpZiAoYiA9PT0gMCkgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGRpdmlkZSBieSB6ZXJvXCIpO1xyXG4gICAgICAgIGlmIChzZWxmLmlzU21hbGwpIHtcclxuICAgICAgICAgICAgaWYgKG4uaXNTbWFsbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtuZXcgU21hbGxJbnRlZ2VyKHRydW5jYXRlKGEgLyBiKSksIG5ldyBTbWFsbEludGVnZXIoYSAlIGIpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gW0ludGVnZXJbMF0sIHNlbGZdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobi5pc1NtYWxsKSB7XHJcbiAgICAgICAgICAgIGlmIChiID09PSAxKSByZXR1cm4gW3NlbGYsIEludGVnZXJbMF1dO1xyXG4gICAgICAgICAgICBpZiAoYiA9PSAtMSkgcmV0dXJuIFtzZWxmLm5lZ2F0ZSgpLCBJbnRlZ2VyWzBdXTtcclxuICAgICAgICAgICAgdmFyIGFicyA9IE1hdGguYWJzKGIpO1xyXG4gICAgICAgICAgICBpZiAoYWJzIDwgQkFTRSkge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBkaXZNb2RTbWFsbChhLCBhYnMpO1xyXG4gICAgICAgICAgICAgICAgcXVvdGllbnQgPSBhcnJheVRvU21hbGwodmFsdWVbMF0pO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlbWFpbmRlciA9IHZhbHVlWzFdO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuc2lnbikgcmVtYWluZGVyID0gLXJlbWFpbmRlcjtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcXVvdGllbnQgPT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5zaWduICE9PSBuLnNpZ24pIHF1b3RpZW50ID0gLXF1b3RpZW50O1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbbmV3IFNtYWxsSW50ZWdlcihxdW90aWVudCksIG5ldyBTbWFsbEludGVnZXIocmVtYWluZGVyKV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gW25ldyBCaWdJbnRlZ2VyKHF1b3RpZW50LCBzZWxmLnNpZ24gIT09IG4uc2lnbiksIG5ldyBTbWFsbEludGVnZXIocmVtYWluZGVyKV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYiA9IHNtYWxsVG9BcnJheShhYnMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgY29tcGFyaXNvbiA9IGNvbXBhcmVBYnMoYSwgYik7XHJcbiAgICAgICAgaWYgKGNvbXBhcmlzb24gPT09IC0xKSByZXR1cm4gW0ludGVnZXJbMF0sIHNlbGZdO1xyXG4gICAgICAgIGlmIChjb21wYXJpc29uID09PSAwKSByZXR1cm4gW0ludGVnZXJbc2VsZi5zaWduID09PSBuLnNpZ24gPyAxIDogLTFdLCBJbnRlZ2VyWzBdXTtcclxuXHJcbiAgICAgICAgLy8gZGl2TW9kMSBpcyBmYXN0ZXIgb24gc21hbGxlciBpbnB1dCBzaXplc1xyXG4gICAgICAgIGlmIChhLmxlbmd0aCArIGIubGVuZ3RoIDw9IDIwMClcclxuICAgICAgICAgICAgdmFsdWUgPSBkaXZNb2QxKGEsIGIpO1xyXG4gICAgICAgIGVsc2UgdmFsdWUgPSBkaXZNb2QyKGEsIGIpO1xyXG5cclxuICAgICAgICBxdW90aWVudCA9IHZhbHVlWzBdO1xyXG4gICAgICAgIHZhciBxU2lnbiA9IHNlbGYuc2lnbiAhPT0gbi5zaWduLFxyXG4gICAgICAgICAgICBtb2QgPSB2YWx1ZVsxXSxcclxuICAgICAgICAgICAgbVNpZ24gPSBzZWxmLnNpZ247XHJcbiAgICAgICAgaWYgKHR5cGVvZiBxdW90aWVudCA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICAgICAgICBpZiAocVNpZ24pIHF1b3RpZW50ID0gLXF1b3RpZW50O1xyXG4gICAgICAgICAgICBxdW90aWVudCA9IG5ldyBTbWFsbEludGVnZXIocXVvdGllbnQpO1xyXG4gICAgICAgIH0gZWxzZSBxdW90aWVudCA9IG5ldyBCaWdJbnRlZ2VyKHF1b3RpZW50LCBxU2lnbik7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBtb2QgPT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICAgICAgaWYgKG1TaWduKSBtb2QgPSAtbW9kO1xyXG4gICAgICAgICAgICBtb2QgPSBuZXcgU21hbGxJbnRlZ2VyKG1vZCk7XHJcbiAgICAgICAgfSBlbHNlIG1vZCA9IG5ldyBCaWdJbnRlZ2VyKG1vZCwgbVNpZ24pO1xyXG4gICAgICAgIHJldHVybiBbcXVvdGllbnQsIG1vZF07XHJcbiAgICB9XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuZGl2bW9kID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gZGl2TW9kQW55KHRoaXMsIHYpO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHF1b3RpZW50OiByZXN1bHRbMF0sXHJcbiAgICAgICAgICAgIHJlbWFpbmRlcjogcmVzdWx0WzFdXHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLmRpdm1vZCA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUuZGl2bW9kID0gQmlnSW50ZWdlci5wcm90b3R5cGUuZGl2bW9kO1xyXG5cclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5kaXZpZGUgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHJldHVybiBkaXZNb2RBbnkodGhpcywgdilbMF07XHJcbiAgICB9O1xyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5vdmVyID0gTmF0aXZlQmlnSW50LnByb3RvdHlwZS5kaXZpZGUgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHJldHVybiBuZXcgTmF0aXZlQmlnSW50KHRoaXMudmFsdWUgLyBwYXJzZVZhbHVlKHYpLnZhbHVlKTtcclxuICAgIH07XHJcbiAgICBTbWFsbEludGVnZXIucHJvdG90eXBlLm92ZXIgPSBTbWFsbEludGVnZXIucHJvdG90eXBlLmRpdmlkZSA9IEJpZ0ludGVnZXIucHJvdG90eXBlLm92ZXIgPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5kaXZpZGU7XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUubW9kID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICByZXR1cm4gZGl2TW9kQW55KHRoaXMsIHYpWzFdO1xyXG4gICAgfTtcclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUubW9kID0gTmF0aXZlQmlnSW50LnByb3RvdHlwZS5yZW1haW5kZXIgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHJldHVybiBuZXcgTmF0aXZlQmlnSW50KHRoaXMudmFsdWUgJSBwYXJzZVZhbHVlKHYpLnZhbHVlKTtcclxuICAgIH07XHJcbiAgICBTbWFsbEludGVnZXIucHJvdG90eXBlLnJlbWFpbmRlciA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUubW9kID0gQmlnSW50ZWdlci5wcm90b3R5cGUucmVtYWluZGVyID0gQmlnSW50ZWdlci5wcm90b3R5cGUubW9kO1xyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLnBvdyA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgdmFyIG4gPSBwYXJzZVZhbHVlKHYpLFxyXG4gICAgICAgICAgICBhID0gdGhpcy52YWx1ZSxcclxuICAgICAgICAgICAgYiA9IG4udmFsdWUsXHJcbiAgICAgICAgICAgIHZhbHVlLCB4LCB5O1xyXG4gICAgICAgIGlmIChiID09PSAwKSByZXR1cm4gSW50ZWdlclsxXTtcclxuICAgICAgICBpZiAoYSA9PT0gMCkgcmV0dXJuIEludGVnZXJbMF07XHJcbiAgICAgICAgaWYgKGEgPT09IDEpIHJldHVybiBJbnRlZ2VyWzFdO1xyXG4gICAgICAgIGlmIChhID09PSAtMSkgcmV0dXJuIG4uaXNFdmVuKCkgPyBJbnRlZ2VyWzFdIDogSW50ZWdlclstMV07XHJcbiAgICAgICAgaWYgKG4uc2lnbikge1xyXG4gICAgICAgICAgICByZXR1cm4gSW50ZWdlclswXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFuLmlzU21hbGwpIHRocm93IG5ldyBFcnJvcihcIlRoZSBleHBvbmVudCBcIiArIG4udG9TdHJpbmcoKSArIFwiIGlzIHRvbyBsYXJnZS5cIik7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNTbWFsbCkge1xyXG4gICAgICAgICAgICBpZiAoaXNQcmVjaXNlKHZhbHVlID0gTWF0aC5wb3coYSwgYikpKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTbWFsbEludGVnZXIodHJ1bmNhdGUodmFsdWUpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgeCA9IHRoaXM7XHJcbiAgICAgICAgeSA9IEludGVnZXJbMV07XHJcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcclxuICAgICAgICAgICAgaWYgKGIgJiAxID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICB5ID0geS50aW1lcyh4KTtcclxuICAgICAgICAgICAgICAgIC0tYjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoYiA9PT0gMCkgYnJlYWs7XHJcbiAgICAgICAgICAgIGIgLz0gMjtcclxuICAgICAgICAgICAgeCA9IHguc3F1YXJlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB5O1xyXG4gICAgfTtcclxuICAgIFNtYWxsSW50ZWdlci5wcm90b3R5cGUucG93ID0gQmlnSW50ZWdlci5wcm90b3R5cGUucG93O1xyXG5cclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUucG93ID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICB2YXIgbiA9IHBhcnNlVmFsdWUodik7XHJcbiAgICAgICAgdmFyIGEgPSB0aGlzLnZhbHVlLCBiID0gbi52YWx1ZTtcclxuICAgICAgICB2YXIgXzAgPSBCaWdJbnQoMCksIF8xID0gQmlnSW50KDEpLCBfMiA9IEJpZ0ludCgyKTtcclxuICAgICAgICBpZiAoYiA9PT0gXzApIHJldHVybiBJbnRlZ2VyWzFdO1xyXG4gICAgICAgIGlmIChhID09PSBfMCkgcmV0dXJuIEludGVnZXJbMF07XHJcbiAgICAgICAgaWYgKGEgPT09IF8xKSByZXR1cm4gSW50ZWdlclsxXTtcclxuICAgICAgICBpZiAoYSA9PT0gQmlnSW50KC0xKSkgcmV0dXJuIG4uaXNFdmVuKCkgPyBJbnRlZ2VyWzFdIDogSW50ZWdlclstMV07XHJcbiAgICAgICAgaWYgKG4uaXNOZWdhdGl2ZSgpKSByZXR1cm4gbmV3IE5hdGl2ZUJpZ0ludChfMCk7XHJcbiAgICAgICAgdmFyIHggPSB0aGlzO1xyXG4gICAgICAgIHZhciB5ID0gSW50ZWdlclsxXTtcclxuICAgICAgICB3aGlsZSAodHJ1ZSkge1xyXG4gICAgICAgICAgICBpZiAoKGIgJiBfMSkgPT09IF8xKSB7XHJcbiAgICAgICAgICAgICAgICB5ID0geS50aW1lcyh4KTtcclxuICAgICAgICAgICAgICAgIC0tYjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoYiA9PT0gXzApIGJyZWFrO1xyXG4gICAgICAgICAgICBiIC89IF8yO1xyXG4gICAgICAgICAgICB4ID0geC5zcXVhcmUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHk7XHJcbiAgICB9XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUubW9kUG93ID0gZnVuY3Rpb24gKGV4cCwgbW9kKSB7XHJcbiAgICAgICAgZXhwID0gcGFyc2VWYWx1ZShleHApO1xyXG4gICAgICAgIG1vZCA9IHBhcnNlVmFsdWUobW9kKTtcclxuICAgICAgICBpZiAobW9kLmlzWmVybygpKSB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgdGFrZSBtb2RQb3cgd2l0aCBtb2R1bHVzIDBcIik7XHJcbiAgICAgICAgdmFyIHIgPSBJbnRlZ2VyWzFdLFxyXG4gICAgICAgICAgICBiYXNlID0gdGhpcy5tb2QobW9kKTtcclxuICAgICAgICBpZiAoZXhwLmlzTmVnYXRpdmUoKSkge1xyXG4gICAgICAgICAgICBleHAgPSBleHAubXVsdGlwbHkoSW50ZWdlclstMV0pO1xyXG4gICAgICAgICAgICBiYXNlID0gYmFzZS5tb2RJbnYobW9kKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgd2hpbGUgKGV4cC5pc1Bvc2l0aXZlKCkpIHtcclxuICAgICAgICAgICAgaWYgKGJhc2UuaXNaZXJvKCkpIHJldHVybiBJbnRlZ2VyWzBdO1xyXG4gICAgICAgICAgICBpZiAoZXhwLmlzT2RkKCkpIHIgPSByLm11bHRpcGx5KGJhc2UpLm1vZChtb2QpO1xyXG4gICAgICAgICAgICBleHAgPSBleHAuZGl2aWRlKDIpO1xyXG4gICAgICAgICAgICBiYXNlID0gYmFzZS5zcXVhcmUoKS5tb2QobW9kKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHI7XHJcbiAgICB9O1xyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5tb2RQb3cgPSBTbWFsbEludGVnZXIucHJvdG90eXBlLm1vZFBvdyA9IEJpZ0ludGVnZXIucHJvdG90eXBlLm1vZFBvdztcclxuXHJcbiAgICBmdW5jdGlvbiBjb21wYXJlQWJzKGEsIGIpIHtcclxuICAgICAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhLmxlbmd0aCA+IGIubGVuZ3RoID8gMSA6IC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKHZhciBpID0gYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICBpZiAoYVtpXSAhPT0gYltpXSkgcmV0dXJuIGFbaV0gPiBiW2ldID8gMSA6IC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5jb21wYXJlQWJzID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICB2YXIgbiA9IHBhcnNlVmFsdWUodiksXHJcbiAgICAgICAgICAgIGEgPSB0aGlzLnZhbHVlLFxyXG4gICAgICAgICAgICBiID0gbi52YWx1ZTtcclxuICAgICAgICBpZiAobi5pc1NtYWxsKSByZXR1cm4gMTtcclxuICAgICAgICByZXR1cm4gY29tcGFyZUFicyhhLCBiKTtcclxuICAgIH07XHJcbiAgICBTbWFsbEludGVnZXIucHJvdG90eXBlLmNvbXBhcmVBYnMgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHZhciBuID0gcGFyc2VWYWx1ZSh2KSxcclxuICAgICAgICAgICAgYSA9IE1hdGguYWJzKHRoaXMudmFsdWUpLFxyXG4gICAgICAgICAgICBiID0gbi52YWx1ZTtcclxuICAgICAgICBpZiAobi5pc1NtYWxsKSB7XHJcbiAgICAgICAgICAgIGIgPSBNYXRoLmFicyhiKTtcclxuICAgICAgICAgICAgcmV0dXJuIGEgPT09IGIgPyAwIDogYSA+IGIgPyAxIDogLTE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAtMTtcclxuICAgIH07XHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLmNvbXBhcmVBYnMgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHZhciBhID0gdGhpcy52YWx1ZTtcclxuICAgICAgICB2YXIgYiA9IHBhcnNlVmFsdWUodikudmFsdWU7XHJcbiAgICAgICAgYSA9IGEgPj0gMCA/IGEgOiAtYTtcclxuICAgICAgICBiID0gYiA+PSAwID8gYiA6IC1iO1xyXG4gICAgICAgIHJldHVybiBhID09PSBiID8gMCA6IGEgPiBiID8gMSA6IC0xO1xyXG4gICAgfVxyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLmNvbXBhcmUgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIC8vIFNlZSBkaXNjdXNzaW9uIGFib3V0IGNvbXBhcmlzb24gd2l0aCBJbmZpbml0eTpcclxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcGV0ZXJvbHNvbi9CaWdJbnRlZ2VyLmpzL2lzc3Vlcy82MVxyXG4gICAgICAgIGlmICh2ID09PSBJbmZpbml0eSkge1xyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh2ID09PSAtSW5maW5pdHkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgbiA9IHBhcnNlVmFsdWUodiksXHJcbiAgICAgICAgICAgIGEgPSB0aGlzLnZhbHVlLFxyXG4gICAgICAgICAgICBiID0gbi52YWx1ZTtcclxuICAgICAgICBpZiAodGhpcy5zaWduICE9PSBuLnNpZ24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG4uc2lnbiA/IDEgOiAtMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG4uaXNTbWFsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zaWduID8gLTEgOiAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY29tcGFyZUFicyhhLCBiKSAqICh0aGlzLnNpZ24gPyAtMSA6IDEpO1xyXG4gICAgfTtcclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLmNvbXBhcmVUbyA9IEJpZ0ludGVnZXIucHJvdG90eXBlLmNvbXBhcmU7XHJcblxyXG4gICAgU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICBpZiAodiA9PT0gSW5maW5pdHkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodiA9PT0gLUluZmluaXR5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIG4gPSBwYXJzZVZhbHVlKHYpLFxyXG4gICAgICAgICAgICBhID0gdGhpcy52YWx1ZSxcclxuICAgICAgICAgICAgYiA9IG4udmFsdWU7XHJcbiAgICAgICAgaWYgKG4uaXNTbWFsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYSA9PSBiID8gMCA6IGEgPiBiID8gMSA6IC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoYSA8IDAgIT09IG4uc2lnbikge1xyXG4gICAgICAgICAgICByZXR1cm4gYSA8IDAgPyAtMSA6IDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhIDwgMCA/IDEgOiAtMTtcclxuICAgIH07XHJcbiAgICBTbWFsbEludGVnZXIucHJvdG90eXBlLmNvbXBhcmVUbyA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUuY29tcGFyZTtcclxuXHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLmNvbXBhcmUgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIGlmICh2ID09PSBJbmZpbml0eSkge1xyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh2ID09PSAtSW5maW5pdHkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBhID0gdGhpcy52YWx1ZTtcclxuICAgICAgICB2YXIgYiA9IHBhcnNlVmFsdWUodikudmFsdWU7XHJcbiAgICAgICAgcmV0dXJuIGEgPT09IGIgPyAwIDogYSA+IGIgPyAxIDogLTE7XHJcbiAgICB9XHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLmNvbXBhcmVUbyA9IE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuY29tcGFyZTtcclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBhcmUodikgPT09IDA7XHJcbiAgICB9O1xyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5lcSA9IE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuZXF1YWxzID0gU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5lcSA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUuZXF1YWxzID0gQmlnSW50ZWdlci5wcm90b3R5cGUuZXEgPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5lcXVhbHM7XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUubm90RXF1YWxzID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb21wYXJlKHYpICE9PSAwO1xyXG4gICAgfTtcclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUubmVxID0gTmF0aXZlQmlnSW50LnByb3RvdHlwZS5ub3RFcXVhbHMgPSBTbWFsbEludGVnZXIucHJvdG90eXBlLm5lcSA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUubm90RXF1YWxzID0gQmlnSW50ZWdlci5wcm90b3R5cGUubmVxID0gQmlnSW50ZWdlci5wcm90b3R5cGUubm90RXF1YWxzO1xyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLmdyZWF0ZXIgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBhcmUodikgPiAwO1xyXG4gICAgfTtcclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuZ3QgPSBOYXRpdmVCaWdJbnQucHJvdG90eXBlLmdyZWF0ZXIgPSBTbWFsbEludGVnZXIucHJvdG90eXBlLmd0ID0gU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5ncmVhdGVyID0gQmlnSW50ZWdlci5wcm90b3R5cGUuZ3QgPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5ncmVhdGVyO1xyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLmxlc3NlciA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcGFyZSh2KSA8IDA7XHJcbiAgICB9O1xyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5sdCA9IE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUubGVzc2VyID0gU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5sdCA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUubGVzc2VyID0gQmlnSW50ZWdlci5wcm90b3R5cGUubHQgPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5sZXNzZXI7XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuZ3JlYXRlck9yRXF1YWxzID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb21wYXJlKHYpID49IDA7XHJcbiAgICB9O1xyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5nZXEgPSBOYXRpdmVCaWdJbnQucHJvdG90eXBlLmdyZWF0ZXJPckVxdWFscyA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUuZ2VxID0gU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5ncmVhdGVyT3JFcXVhbHMgPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5nZXEgPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5ncmVhdGVyT3JFcXVhbHM7XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUubGVzc2VyT3JFcXVhbHMgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBhcmUodikgPD0gMDtcclxuICAgIH07XHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLmxlcSA9IE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUubGVzc2VyT3JFcXVhbHMgPSBTbWFsbEludGVnZXIucHJvdG90eXBlLmxlcSA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUubGVzc2VyT3JFcXVhbHMgPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5sZXEgPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5sZXNzZXJPckVxdWFscztcclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5pc0V2ZW4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnZhbHVlWzBdICYgMSkgPT09IDA7XHJcbiAgICB9O1xyXG4gICAgU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5pc0V2ZW4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnZhbHVlICYgMSkgPT09IDA7XHJcbiAgICB9O1xyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5pc0V2ZW4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnZhbHVlICYgQmlnSW50KDEpKSA9PT0gQmlnSW50KDApO1xyXG4gICAgfVxyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLmlzT2RkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy52YWx1ZVswXSAmIDEpID09PSAxO1xyXG4gICAgfTtcclxuICAgIFNtYWxsSW50ZWdlci5wcm90b3R5cGUuaXNPZGQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnZhbHVlICYgMSkgPT09IDE7XHJcbiAgICB9O1xyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5pc09kZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gKHRoaXMudmFsdWUgJiBCaWdJbnQoMSkpID09PSBCaWdJbnQoMSk7XHJcbiAgICB9XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuaXNQb3NpdGl2ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gIXRoaXMuc2lnbjtcclxuICAgIH07XHJcbiAgICBTbWFsbEludGVnZXIucHJvdG90eXBlLmlzUG9zaXRpdmUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUgPiAwO1xyXG4gICAgfTtcclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuaXNQb3NpdGl2ZSA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUuaXNQb3NpdGl2ZTtcclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5pc05lZ2F0aXZlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNpZ247XHJcbiAgICB9O1xyXG4gICAgU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5pc05lZ2F0aXZlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlIDwgMDtcclxuICAgIH07XHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLmlzTmVnYXRpdmUgPSBTbWFsbEludGVnZXIucHJvdG90eXBlLmlzTmVnYXRpdmU7XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuaXNVbml0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH07XHJcbiAgICBTbWFsbEludGVnZXIucHJvdG90eXBlLmlzVW5pdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5hYnModGhpcy52YWx1ZSkgPT09IDE7XHJcbiAgICB9O1xyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5pc1VuaXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYWJzKCkudmFsdWUgPT09IEJpZ0ludCgxKTtcclxuICAgIH1cclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5pc1plcm8gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfTtcclxuICAgIFNtYWxsSW50ZWdlci5wcm90b3R5cGUuaXNaZXJvID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlID09PSAwO1xyXG4gICAgfTtcclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuaXNaZXJvID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlID09PSBCaWdJbnQoMCk7XHJcbiAgICB9XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuaXNEaXZpc2libGVCeSA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgdmFyIG4gPSBwYXJzZVZhbHVlKHYpO1xyXG4gICAgICAgIGlmIChuLmlzWmVybygpKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgaWYgKG4uaXNVbml0KCkpIHJldHVybiB0cnVlO1xyXG4gICAgICAgIGlmIChuLmNvbXBhcmVBYnMoMikgPT09IDApIHJldHVybiB0aGlzLmlzRXZlbigpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1vZChuKS5pc1plcm8oKTtcclxuICAgIH07XHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLmlzRGl2aXNpYmxlQnkgPSBTbWFsbEludGVnZXIucHJvdG90eXBlLmlzRGl2aXNpYmxlQnkgPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5pc0RpdmlzaWJsZUJ5O1xyXG5cclxuICAgIGZ1bmN0aW9uIGlzQmFzaWNQcmltZSh2KSB7XHJcbiAgICAgICAgdmFyIG4gPSB2LmFicygpO1xyXG4gICAgICAgIGlmIChuLmlzVW5pdCgpKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgaWYgKG4uZXF1YWxzKDIpIHx8IG4uZXF1YWxzKDMpIHx8IG4uZXF1YWxzKDUpKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICBpZiAobi5pc0V2ZW4oKSB8fCBuLmlzRGl2aXNpYmxlQnkoMykgfHwgbi5pc0RpdmlzaWJsZUJ5KDUpKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgaWYgKG4ubGVzc2VyKDQ5KSkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgLy8gd2UgZG9uJ3Qga25vdyBpZiBpdCdzIHByaW1lOiBsZXQgdGhlIG90aGVyIGZ1bmN0aW9ucyBmaWd1cmUgaXQgb3V0XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbWlsbGVyUmFiaW5UZXN0KG4sIGEpIHtcclxuICAgICAgICB2YXIgblByZXYgPSBuLnByZXYoKSxcclxuICAgICAgICAgICAgYiA9IG5QcmV2LFxyXG4gICAgICAgICAgICByID0gMCxcclxuICAgICAgICAgICAgZCwgdCwgaSwgeDtcclxuICAgICAgICB3aGlsZSAoYi5pc0V2ZW4oKSkgYiA9IGIuZGl2aWRlKDIpLCByKys7XHJcbiAgICAgICAgbmV4dDogZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKG4ubGVzc2VyKGFbaV0pKSBjb250aW51ZTtcclxuICAgICAgICAgICAgeCA9IGJpZ0ludChhW2ldKS5tb2RQb3coYiwgbik7XHJcbiAgICAgICAgICAgIGlmICh4LmlzVW5pdCgpIHx8IHguZXF1YWxzKG5QcmV2KSkgY29udGludWU7XHJcbiAgICAgICAgICAgIGZvciAoZCA9IHIgLSAxOyBkICE9IDA7IGQtLSkge1xyXG4gICAgICAgICAgICAgICAgeCA9IHguc3F1YXJlKCkubW9kKG4pO1xyXG4gICAgICAgICAgICAgICAgaWYgKHguaXNVbml0KCkpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGlmICh4LmVxdWFscyhuUHJldikpIGNvbnRpbnVlIG5leHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTZXQgXCJzdHJpY3RcIiB0byB0cnVlIHRvIGZvcmNlIEdSSC1zdXBwb3J0ZWQgbG93ZXIgYm91bmQgb2YgMipsb2coTileMlxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuaXNQcmltZSA9IGZ1bmN0aW9uIChzdHJpY3QpIHtcclxuICAgICAgICB2YXIgaXNQcmltZSA9IGlzQmFzaWNQcmltZSh0aGlzKTtcclxuICAgICAgICBpZiAoaXNQcmltZSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gaXNQcmltZTtcclxuICAgICAgICB2YXIgbiA9IHRoaXMuYWJzKCk7XHJcbiAgICAgICAgdmFyIGJpdHMgPSBuLmJpdExlbmd0aCgpO1xyXG4gICAgICAgIGlmIChiaXRzIDw9IDY0KVxyXG4gICAgICAgICAgICByZXR1cm4gbWlsbGVyUmFiaW5UZXN0KG4sIFsyLCAzLCA1LCA3LCAxMSwgMTMsIDE3LCAxOSwgMjMsIDI5LCAzMSwgMzddKTtcclxuICAgICAgICB2YXIgbG9nTiA9IE1hdGgubG9nKDIpICogYml0cy50b0pTTnVtYmVyKCk7XHJcbiAgICAgICAgdmFyIHQgPSBNYXRoLmNlaWwoKHN0cmljdCA9PT0gdHJ1ZSkgPyAoMiAqIE1hdGgucG93KGxvZ04sIDIpKSA6IGxvZ04pO1xyXG4gICAgICAgIGZvciAodmFyIGEgPSBbXSwgaSA9IDA7IGkgPCB0OyBpKyspIHtcclxuICAgICAgICAgICAgYS5wdXNoKGJpZ0ludChpICsgMikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbWlsbGVyUmFiaW5UZXN0KG4sIGEpO1xyXG4gICAgfTtcclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuaXNQcmltZSA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUuaXNQcmltZSA9IEJpZ0ludGVnZXIucHJvdG90eXBlLmlzUHJpbWU7XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuaXNQcm9iYWJsZVByaW1lID0gZnVuY3Rpb24gKGl0ZXJhdGlvbnMsIHJuZykge1xyXG4gICAgICAgIHZhciBpc1ByaW1lID0gaXNCYXNpY1ByaW1lKHRoaXMpO1xyXG4gICAgICAgIGlmIChpc1ByaW1lICE9PSB1bmRlZmluZWQpIHJldHVybiBpc1ByaW1lO1xyXG4gICAgICAgIHZhciBuID0gdGhpcy5hYnMoKTtcclxuICAgICAgICB2YXIgdCA9IGl0ZXJhdGlvbnMgPT09IHVuZGVmaW5lZCA/IDUgOiBpdGVyYXRpb25zO1xyXG4gICAgICAgIGZvciAodmFyIGEgPSBbXSwgaSA9IDA7IGkgPCB0OyBpKyspIHtcclxuICAgICAgICAgICAgYS5wdXNoKGJpZ0ludC5yYW5kQmV0d2VlbigyLCBuLm1pbnVzKDIpLCBybmcpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG1pbGxlclJhYmluVGVzdChuLCBhKTtcclxuICAgIH07XHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLmlzUHJvYmFibGVQcmltZSA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUuaXNQcm9iYWJsZVByaW1lID0gQmlnSW50ZWdlci5wcm90b3R5cGUuaXNQcm9iYWJsZVByaW1lO1xyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLm1vZEludiA9IGZ1bmN0aW9uIChuKSB7XHJcbiAgICAgICAgdmFyIHQgPSBiaWdJbnQuemVybywgbmV3VCA9IGJpZ0ludC5vbmUsIHIgPSBwYXJzZVZhbHVlKG4pLCBuZXdSID0gdGhpcy5hYnMoKSwgcSwgbGFzdFQsIGxhc3RSO1xyXG4gICAgICAgIHdoaWxlICghbmV3Ui5pc1plcm8oKSkge1xyXG4gICAgICAgICAgICBxID0gci5kaXZpZGUobmV3Uik7XHJcbiAgICAgICAgICAgIGxhc3RUID0gdDtcclxuICAgICAgICAgICAgbGFzdFIgPSByO1xyXG4gICAgICAgICAgICB0ID0gbmV3VDtcclxuICAgICAgICAgICAgciA9IG5ld1I7XHJcbiAgICAgICAgICAgIG5ld1QgPSBsYXN0VC5zdWJ0cmFjdChxLm11bHRpcGx5KG5ld1QpKTtcclxuICAgICAgICAgICAgbmV3UiA9IGxhc3RSLnN1YnRyYWN0KHEubXVsdGlwbHkobmV3UikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXIuaXNVbml0KCkpIHRocm93IG5ldyBFcnJvcih0aGlzLnRvU3RyaW5nKCkgKyBcIiBhbmQgXCIgKyBuLnRvU3RyaW5nKCkgKyBcIiBhcmUgbm90IGNvLXByaW1lXCIpO1xyXG4gICAgICAgIGlmICh0LmNvbXBhcmUoMCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIHQgPSB0LmFkZChuKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuaXNOZWdhdGl2ZSgpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0Lm5lZ2F0ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdDtcclxuICAgIH07XHJcblxyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5tb2RJbnYgPSBTbWFsbEludGVnZXIucHJvdG90eXBlLm1vZEludiA9IEJpZ0ludGVnZXIucHJvdG90eXBlLm1vZEludjtcclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB2YWx1ZSA9IHRoaXMudmFsdWU7XHJcbiAgICAgICAgaWYgKHRoaXMuc2lnbikge1xyXG4gICAgICAgICAgICByZXR1cm4gc3VidHJhY3RTbWFsbCh2YWx1ZSwgMSwgdGhpcy5zaWduKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCaWdJbnRlZ2VyKGFkZFNtYWxsKHZhbHVlLCAxKSwgdGhpcy5zaWduKTtcclxuICAgIH07XHJcbiAgICBTbWFsbEludGVnZXIucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHZhbHVlID0gdGhpcy52YWx1ZTtcclxuICAgICAgICBpZiAodmFsdWUgKyAxIDwgTUFYX0lOVCkgcmV0dXJuIG5ldyBTbWFsbEludGVnZXIodmFsdWUgKyAxKTtcclxuICAgICAgICByZXR1cm4gbmV3IEJpZ0ludGVnZXIoTUFYX0lOVF9BUlIsIGZhbHNlKTtcclxuICAgIH07XHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBOYXRpdmVCaWdJbnQodGhpcy52YWx1ZSArIEJpZ0ludCgxKSk7XHJcbiAgICB9XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUucHJldiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLnZhbHVlO1xyXG4gICAgICAgIGlmICh0aGlzLnNpZ24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBCaWdJbnRlZ2VyKGFkZFNtYWxsKHZhbHVlLCAxKSwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzdWJ0cmFjdFNtYWxsKHZhbHVlLCAxLCB0aGlzLnNpZ24pO1xyXG4gICAgfTtcclxuICAgIFNtYWxsSW50ZWdlci5wcm90b3R5cGUucHJldiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLnZhbHVlO1xyXG4gICAgICAgIGlmICh2YWx1ZSAtIDEgPiAtTUFYX0lOVCkgcmV0dXJuIG5ldyBTbWFsbEludGVnZXIodmFsdWUgLSAxKTtcclxuICAgICAgICByZXR1cm4gbmV3IEJpZ0ludGVnZXIoTUFYX0lOVF9BUlIsIHRydWUpO1xyXG4gICAgfTtcclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUucHJldiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IE5hdGl2ZUJpZ0ludCh0aGlzLnZhbHVlIC0gQmlnSW50KDEpKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgcG93ZXJzT2ZUd28gPSBbMV07XHJcbiAgICB3aGlsZSAoMiAqIHBvd2Vyc09mVHdvW3Bvd2Vyc09mVHdvLmxlbmd0aCAtIDFdIDw9IEJBU0UpIHBvd2Vyc09mVHdvLnB1c2goMiAqIHBvd2Vyc09mVHdvW3Bvd2Vyc09mVHdvLmxlbmd0aCAtIDFdKTtcclxuICAgIHZhciBwb3dlcnMyTGVuZ3RoID0gcG93ZXJzT2ZUd28ubGVuZ3RoLCBoaWdoZXN0UG93ZXIyID0gcG93ZXJzT2ZUd29bcG93ZXJzMkxlbmd0aCAtIDFdO1xyXG5cclxuICAgIGZ1bmN0aW9uIHNoaWZ0X2lzU21hbGwobikge1xyXG4gICAgICAgIHJldHVybiBNYXRoLmFicyhuKSA8PSBCQVNFO1xyXG4gICAgfVxyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLnNoaWZ0TGVmdCA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgdmFyIG4gPSBwYXJzZVZhbHVlKHYpLnRvSlNOdW1iZXIoKTtcclxuICAgICAgICBpZiAoIXNoaWZ0X2lzU21hbGwobikpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFN0cmluZyhuKSArIFwiIGlzIHRvbyBsYXJnZSBmb3Igc2hpZnRpbmcuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobiA8IDApIHJldHVybiB0aGlzLnNoaWZ0UmlnaHQoLW4pO1xyXG4gICAgICAgIHZhciByZXN1bHQgPSB0aGlzO1xyXG4gICAgICAgIGlmIChyZXN1bHQuaXNaZXJvKCkpIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgd2hpbGUgKG4gPj0gcG93ZXJzMkxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQubXVsdGlwbHkoaGlnaGVzdFBvd2VyMik7XHJcbiAgICAgICAgICAgIG4gLT0gcG93ZXJzMkxlbmd0aCAtIDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQubXVsdGlwbHkocG93ZXJzT2ZUd29bbl0pO1xyXG4gICAgfTtcclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuc2hpZnRMZWZ0ID0gU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5zaGlmdExlZnQgPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5zaGlmdExlZnQ7XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuc2hpZnRSaWdodCA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgdmFyIHJlbVF1bztcclxuICAgICAgICB2YXIgbiA9IHBhcnNlVmFsdWUodikudG9KU051bWJlcigpO1xyXG4gICAgICAgIGlmICghc2hpZnRfaXNTbWFsbChuKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoU3RyaW5nKG4pICsgXCIgaXMgdG9vIGxhcmdlIGZvciBzaGlmdGluZy5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChuIDwgMCkgcmV0dXJuIHRoaXMuc2hpZnRMZWZ0KC1uKTtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcztcclxuICAgICAgICB3aGlsZSAobiA+PSBwb3dlcnMyTGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQuaXNaZXJvKCkgfHwgKHJlc3VsdC5pc05lZ2F0aXZlKCkgJiYgcmVzdWx0LmlzVW5pdCgpKSkgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgcmVtUXVvID0gZGl2TW9kQW55KHJlc3VsdCwgaGlnaGVzdFBvd2VyMik7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlbVF1b1sxXS5pc05lZ2F0aXZlKCkgPyByZW1RdW9bMF0ucHJldigpIDogcmVtUXVvWzBdO1xyXG4gICAgICAgICAgICBuIC09IHBvd2VyczJMZW5ndGggLSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZW1RdW8gPSBkaXZNb2RBbnkocmVzdWx0LCBwb3dlcnNPZlR3b1tuXSk7XHJcbiAgICAgICAgcmV0dXJuIHJlbVF1b1sxXS5pc05lZ2F0aXZlKCkgPyByZW1RdW9bMF0ucHJldigpIDogcmVtUXVvWzBdO1xyXG4gICAgfTtcclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuc2hpZnRSaWdodCA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUuc2hpZnRSaWdodCA9IEJpZ0ludGVnZXIucHJvdG90eXBlLnNoaWZ0UmlnaHQ7XHJcblxyXG4gICAgZnVuY3Rpb24gYml0d2lzZSh4LCB5LCBmbikge1xyXG4gICAgICAgIHkgPSBwYXJzZVZhbHVlKHkpO1xyXG4gICAgICAgIHZhciB4U2lnbiA9IHguaXNOZWdhdGl2ZSgpLCB5U2lnbiA9IHkuaXNOZWdhdGl2ZSgpO1xyXG4gICAgICAgIHZhciB4UmVtID0geFNpZ24gPyB4Lm5vdCgpIDogeCxcclxuICAgICAgICAgICAgeVJlbSA9IHlTaWduID8geS5ub3QoKSA6IHk7XHJcbiAgICAgICAgdmFyIHhEaWdpdCA9IDAsIHlEaWdpdCA9IDA7XHJcbiAgICAgICAgdmFyIHhEaXZNb2QgPSBudWxsLCB5RGl2TW9kID0gbnVsbDtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW107XHJcbiAgICAgICAgd2hpbGUgKCF4UmVtLmlzWmVybygpIHx8ICF5UmVtLmlzWmVybygpKSB7XHJcbiAgICAgICAgICAgIHhEaXZNb2QgPSBkaXZNb2RBbnkoeFJlbSwgaGlnaGVzdFBvd2VyMik7XHJcbiAgICAgICAgICAgIHhEaWdpdCA9IHhEaXZNb2RbMV0udG9KU051bWJlcigpO1xyXG4gICAgICAgICAgICBpZiAoeFNpZ24pIHtcclxuICAgICAgICAgICAgICAgIHhEaWdpdCA9IGhpZ2hlc3RQb3dlcjIgLSAxIC0geERpZ2l0OyAvLyB0d28ncyBjb21wbGVtZW50IGZvciBuZWdhdGl2ZSBudW1iZXJzXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHlEaXZNb2QgPSBkaXZNb2RBbnkoeVJlbSwgaGlnaGVzdFBvd2VyMik7XHJcbiAgICAgICAgICAgIHlEaWdpdCA9IHlEaXZNb2RbMV0udG9KU051bWJlcigpO1xyXG4gICAgICAgICAgICBpZiAoeVNpZ24pIHtcclxuICAgICAgICAgICAgICAgIHlEaWdpdCA9IGhpZ2hlc3RQb3dlcjIgLSAxIC0geURpZ2l0OyAvLyB0d28ncyBjb21wbGVtZW50IGZvciBuZWdhdGl2ZSBudW1iZXJzXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHhSZW0gPSB4RGl2TW9kWzBdO1xyXG4gICAgICAgICAgICB5UmVtID0geURpdk1vZFswXTtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2goZm4oeERpZ2l0LCB5RGlnaXQpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHN1bSA9IGZuKHhTaWduID8gMSA6IDAsIHlTaWduID8gMSA6IDApICE9PSAwID8gYmlnSW50KC0xKSA6IGJpZ0ludCgwKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gcmVzdWx0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaSAtPSAxKSB7XHJcbiAgICAgICAgICAgIHN1bSA9IHN1bS5tdWx0aXBseShoaWdoZXN0UG93ZXIyKS5hZGQoYmlnSW50KHJlc3VsdFtpXSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc3VtO1xyXG4gICAgfVxyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLm5vdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5uZWdhdGUoKS5wcmV2KCk7XHJcbiAgICB9O1xyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5ub3QgPSBTbWFsbEludGVnZXIucHJvdG90eXBlLm5vdCA9IEJpZ0ludGVnZXIucHJvdG90eXBlLm5vdDtcclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hbmQgPSBmdW5jdGlvbiAobikge1xyXG4gICAgICAgIHJldHVybiBiaXR3aXNlKHRoaXMsIG4sIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhICYgYjsgfSk7XHJcbiAgICB9O1xyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5hbmQgPSBTbWFsbEludGVnZXIucHJvdG90eXBlLmFuZCA9IEJpZ0ludGVnZXIucHJvdG90eXBlLmFuZDtcclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5vciA9IGZ1bmN0aW9uIChuKSB7XHJcbiAgICAgICAgcmV0dXJuIGJpdHdpc2UodGhpcywgbiwgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgfCBiOyB9KTtcclxuICAgIH07XHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLm9yID0gU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5vciA9IEJpZ0ludGVnZXIucHJvdG90eXBlLm9yO1xyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLnhvciA9IGZ1bmN0aW9uIChuKSB7XHJcbiAgICAgICAgcmV0dXJuIGJpdHdpc2UodGhpcywgbiwgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgXiBiOyB9KTtcclxuICAgIH07XHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLnhvciA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUueG9yID0gQmlnSW50ZWdlci5wcm90b3R5cGUueG9yO1xyXG5cclxuICAgIHZhciBMT0JNQVNLX0kgPSAxIDw8IDMwLCBMT0JNQVNLX0JJID0gKEJBU0UgJiAtQkFTRSkgKiAoQkFTRSAmIC1CQVNFKSB8IExPQk1BU0tfSTtcclxuICAgIGZ1bmN0aW9uIHJvdWdoTE9CKG4pIHsgLy8gZ2V0IGxvd2VzdE9uZUJpdCAocm91Z2gpXHJcbiAgICAgICAgLy8gU21hbGxJbnRlZ2VyOiByZXR1cm4gTWluKGxvd2VzdE9uZUJpdChuKSwgMSA8PCAzMClcclxuICAgICAgICAvLyBCaWdJbnRlZ2VyOiByZXR1cm4gTWluKGxvd2VzdE9uZUJpdChuKSwgMSA8PCAxNCkgW0JBU0U9MWU3XVxyXG4gICAgICAgIHZhciB2ID0gbi52YWx1ZSxcclxuICAgICAgICAgICAgeCA9IHR5cGVvZiB2ID09PSBcIm51bWJlclwiID8gdiB8IExPQk1BU0tfSSA6XHJcbiAgICAgICAgICAgICAgICB0eXBlb2YgdiA9PT0gXCJiaWdpbnRcIiA/IHYgfCBCaWdJbnQoTE9CTUFTS19JKSA6XHJcbiAgICAgICAgICAgICAgICAgICAgdlswXSArIHZbMV0gKiBCQVNFIHwgTE9CTUFTS19CSTtcclxuICAgICAgICByZXR1cm4geCAmIC14O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGludGVnZXJMb2dhcml0aG0odmFsdWUsIGJhc2UpIHtcclxuICAgICAgICBpZiAoYmFzZS5jb21wYXJlVG8odmFsdWUpIDw9IDApIHtcclxuICAgICAgICAgICAgdmFyIHRtcCA9IGludGVnZXJMb2dhcml0aG0odmFsdWUsIGJhc2Uuc3F1YXJlKGJhc2UpKTtcclxuICAgICAgICAgICAgdmFyIHAgPSB0bXAucDtcclxuICAgICAgICAgICAgdmFyIGUgPSB0bXAuZTtcclxuICAgICAgICAgICAgdmFyIHQgPSBwLm11bHRpcGx5KGJhc2UpO1xyXG4gICAgICAgICAgICByZXR1cm4gdC5jb21wYXJlVG8odmFsdWUpIDw9IDAgPyB7IHA6IHQsIGU6IGUgKiAyICsgMSB9IDogeyBwOiBwLCBlOiBlICogMiB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4geyBwOiBiaWdJbnQoMSksIGU6IDAgfTtcclxuICAgIH1cclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5iaXRMZW5ndGggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIG4gPSB0aGlzO1xyXG4gICAgICAgIGlmIChuLmNvbXBhcmVUbyhiaWdJbnQoMCkpIDwgMCkge1xyXG4gICAgICAgICAgICBuID0gbi5uZWdhdGUoKS5zdWJ0cmFjdChiaWdJbnQoMSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobi5jb21wYXJlVG8oYmlnSW50KDApKSA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYmlnSW50KDApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYmlnSW50KGludGVnZXJMb2dhcml0aG0obiwgYmlnSW50KDIpKS5lKS5hZGQoYmlnSW50KDEpKTtcclxuICAgIH1cclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuYml0TGVuZ3RoID0gU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5iaXRMZW5ndGggPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5iaXRMZW5ndGg7XHJcblxyXG4gICAgZnVuY3Rpb24gbWF4KGEsIGIpIHtcclxuICAgICAgICBhID0gcGFyc2VWYWx1ZShhKTtcclxuICAgICAgICBiID0gcGFyc2VWYWx1ZShiKTtcclxuICAgICAgICByZXR1cm4gYS5ncmVhdGVyKGIpID8gYSA6IGI7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBtaW4oYSwgYikge1xyXG4gICAgICAgIGEgPSBwYXJzZVZhbHVlKGEpO1xyXG4gICAgICAgIGIgPSBwYXJzZVZhbHVlKGIpO1xyXG4gICAgICAgIHJldHVybiBhLmxlc3NlcihiKSA/IGEgOiBiO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gZ2NkKGEsIGIpIHtcclxuICAgICAgICBhID0gcGFyc2VWYWx1ZShhKS5hYnMoKTtcclxuICAgICAgICBiID0gcGFyc2VWYWx1ZShiKS5hYnMoKTtcclxuICAgICAgICBpZiAoYS5lcXVhbHMoYikpIHJldHVybiBhO1xyXG4gICAgICAgIGlmIChhLmlzWmVybygpKSByZXR1cm4gYjtcclxuICAgICAgICBpZiAoYi5pc1plcm8oKSkgcmV0dXJuIGE7XHJcbiAgICAgICAgdmFyIGMgPSBJbnRlZ2VyWzFdLCBkLCB0O1xyXG4gICAgICAgIHdoaWxlIChhLmlzRXZlbigpICYmIGIuaXNFdmVuKCkpIHtcclxuICAgICAgICAgICAgZCA9IG1pbihyb3VnaExPQihhKSwgcm91Z2hMT0IoYikpO1xyXG4gICAgICAgICAgICBhID0gYS5kaXZpZGUoZCk7XHJcbiAgICAgICAgICAgIGIgPSBiLmRpdmlkZShkKTtcclxuICAgICAgICAgICAgYyA9IGMubXVsdGlwbHkoZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdoaWxlIChhLmlzRXZlbigpKSB7XHJcbiAgICAgICAgICAgIGEgPSBhLmRpdmlkZShyb3VnaExPQihhKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRvIHtcclxuICAgICAgICAgICAgd2hpbGUgKGIuaXNFdmVuKCkpIHtcclxuICAgICAgICAgICAgICAgIGIgPSBiLmRpdmlkZShyb3VnaExPQihiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGEuZ3JlYXRlcihiKSkge1xyXG4gICAgICAgICAgICAgICAgdCA9IGI7IGIgPSBhOyBhID0gdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBiID0gYi5zdWJ0cmFjdChhKTtcclxuICAgICAgICB9IHdoaWxlICghYi5pc1plcm8oKSk7XHJcbiAgICAgICAgcmV0dXJuIGMuaXNVbml0KCkgPyBhIDogYS5tdWx0aXBseShjKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGxjbShhLCBiKSB7XHJcbiAgICAgICAgYSA9IHBhcnNlVmFsdWUoYSkuYWJzKCk7XHJcbiAgICAgICAgYiA9IHBhcnNlVmFsdWUoYikuYWJzKCk7XHJcbiAgICAgICAgcmV0dXJuIGEuZGl2aWRlKGdjZChhLCBiKSkubXVsdGlwbHkoYik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiByYW5kQmV0d2VlbihhLCBiLCBybmcpIHtcclxuICAgICAgICBhID0gcGFyc2VWYWx1ZShhKTtcclxuICAgICAgICBiID0gcGFyc2VWYWx1ZShiKTtcclxuICAgICAgICB2YXIgdXNlZFJORyA9IHJuZyB8fCBNYXRoLnJhbmRvbTtcclxuICAgICAgICB2YXIgbG93ID0gbWluKGEsIGIpLCBoaWdoID0gbWF4KGEsIGIpO1xyXG4gICAgICAgIHZhciByYW5nZSA9IGhpZ2guc3VidHJhY3QobG93KS5hZGQoMSk7XHJcbiAgICAgICAgaWYgKHJhbmdlLmlzU21hbGwpIHJldHVybiBsb3cuYWRkKE1hdGguZmxvb3IodXNlZFJORygpICogcmFuZ2UpKTtcclxuICAgICAgICB2YXIgZGlnaXRzID0gdG9CYXNlKHJhbmdlLCBCQVNFKS52YWx1ZTtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sIHJlc3RyaWN0ZWQgPSB0cnVlO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGlnaXRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciB0b3AgPSByZXN0cmljdGVkID8gZGlnaXRzW2ldIDogQkFTRTtcclxuICAgICAgICAgICAgdmFyIGRpZ2l0ID0gdHJ1bmNhdGUodXNlZFJORygpICogdG9wKTtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2goZGlnaXQpO1xyXG4gICAgICAgICAgICBpZiAoZGlnaXQgPCB0b3ApIHJlc3RyaWN0ZWQgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGxvdy5hZGQoSW50ZWdlci5mcm9tQXJyYXkocmVzdWx0LCBCQVNFLCBmYWxzZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBwYXJzZUJhc2UgPSBmdW5jdGlvbiAodGV4dCwgYmFzZSwgYWxwaGFiZXQsIGNhc2VTZW5zaXRpdmUpIHtcclxuICAgICAgICBhbHBoYWJldCA9IGFscGhhYmV0IHx8IERFRkFVTFRfQUxQSEFCRVQ7XHJcbiAgICAgICAgdGV4dCA9IFN0cmluZyh0ZXh0KTtcclxuICAgICAgICBpZiAoIWNhc2VTZW5zaXRpdmUpIHtcclxuICAgICAgICAgICAgdGV4dCA9IHRleHQudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgYWxwaGFiZXQgPSBhbHBoYWJldC50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgbGVuZ3RoID0gdGV4dC5sZW5ndGg7XHJcbiAgICAgICAgdmFyIGk7XHJcbiAgICAgICAgdmFyIGFic0Jhc2UgPSBNYXRoLmFicyhiYXNlKTtcclxuICAgICAgICB2YXIgYWxwaGFiZXRWYWx1ZXMgPSB7fTtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYWxwaGFiZXQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgYWxwaGFiZXRWYWx1ZXNbYWxwaGFiZXRbaV1dID0gaTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBjID0gdGV4dFtpXTtcclxuICAgICAgICAgICAgaWYgKGMgPT09IFwiLVwiKSBjb250aW51ZTtcclxuICAgICAgICAgICAgaWYgKGMgaW4gYWxwaGFiZXRWYWx1ZXMpIHtcclxuICAgICAgICAgICAgICAgIGlmIChhbHBoYWJldFZhbHVlc1tjXSA+PSBhYnNCYXNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGMgPT09IFwiMVwiICYmIGFic0Jhc2UgPT09IDEpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihjICsgXCIgaXMgbm90IGEgdmFsaWQgZGlnaXQgaW4gYmFzZSBcIiArIGJhc2UgKyBcIi5cIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgYmFzZSA9IHBhcnNlVmFsdWUoYmFzZSk7XHJcbiAgICAgICAgdmFyIGRpZ2l0cyA9IFtdO1xyXG4gICAgICAgIHZhciBpc05lZ2F0aXZlID0gdGV4dFswXSA9PT0gXCItXCI7XHJcbiAgICAgICAgZm9yIChpID0gaXNOZWdhdGl2ZSA/IDEgOiAwOyBpIDwgdGV4dC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgYyA9IHRleHRbaV07XHJcbiAgICAgICAgICAgIGlmIChjIGluIGFscGhhYmV0VmFsdWVzKSBkaWdpdHMucHVzaChwYXJzZVZhbHVlKGFscGhhYmV0VmFsdWVzW2NdKSk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGMgPT09IFwiPFwiKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RhcnQgPSBpO1xyXG4gICAgICAgICAgICAgICAgZG8geyBpKys7IH0gd2hpbGUgKHRleHRbaV0gIT09IFwiPlwiICYmIGkgPCB0ZXh0Lmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICBkaWdpdHMucHVzaChwYXJzZVZhbHVlKHRleHQuc2xpY2Uoc3RhcnQgKyAxLCBpKSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKGMgKyBcIiBpcyBub3QgYSB2YWxpZCBjaGFyYWN0ZXJcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBwYXJzZUJhc2VGcm9tQXJyYXkoZGlnaXRzLCBiYXNlLCBpc05lZ2F0aXZlKTtcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gcGFyc2VCYXNlRnJvbUFycmF5KGRpZ2l0cywgYmFzZSwgaXNOZWdhdGl2ZSkge1xyXG4gICAgICAgIHZhciB2YWwgPSBJbnRlZ2VyWzBdLCBwb3cgPSBJbnRlZ2VyWzFdLCBpO1xyXG4gICAgICAgIGZvciAoaSA9IGRpZ2l0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICB2YWwgPSB2YWwuYWRkKGRpZ2l0c1tpXS50aW1lcyhwb3cpKTtcclxuICAgICAgICAgICAgcG93ID0gcG93LnRpbWVzKGJhc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaXNOZWdhdGl2ZSA/IHZhbC5uZWdhdGUoKSA6IHZhbDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzdHJpbmdpZnkoZGlnaXQsIGFscGhhYmV0KSB7XHJcbiAgICAgICAgYWxwaGFiZXQgPSBhbHBoYWJldCB8fCBERUZBVUxUX0FMUEhBQkVUO1xyXG4gICAgICAgIGlmIChkaWdpdCA8IGFscGhhYmV0Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYWxwaGFiZXRbZGlnaXRdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXCI8XCIgKyBkaWdpdCArIFwiPlwiO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRvQmFzZShuLCBiYXNlKSB7XHJcbiAgICAgICAgYmFzZSA9IGJpZ0ludChiYXNlKTtcclxuICAgICAgICBpZiAoYmFzZS5pc1plcm8oKSkge1xyXG4gICAgICAgICAgICBpZiAobi5pc1plcm8oKSkgcmV0dXJuIHsgdmFsdWU6IFswXSwgaXNOZWdhdGl2ZTogZmFsc2UgfTtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGNvbnZlcnQgbm9uemVybyBudW1iZXJzIHRvIGJhc2UgMC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChiYXNlLmVxdWFscygtMSkpIHtcclxuICAgICAgICAgICAgaWYgKG4uaXNaZXJvKCkpIHJldHVybiB7IHZhbHVlOiBbMF0sIGlzTmVnYXRpdmU6IGZhbHNlIH07XHJcbiAgICAgICAgICAgIGlmIChuLmlzTmVnYXRpdmUoKSlcclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IFtdLmNvbmNhdC5hcHBseShbXSwgQXJyYXkuYXBwbHkobnVsbCwgQXJyYXkoLW4udG9KU051bWJlcigpKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChBcnJheS5wcm90b3R5cGUudmFsdWVPZiwgWzEsIDBdKVxyXG4gICAgICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgICAgICAgICAgaXNOZWdhdGl2ZTogZmFsc2VcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB2YXIgYXJyID0gQXJyYXkuYXBwbHkobnVsbCwgQXJyYXkobi50b0pTTnVtYmVyKCkgLSAxKSlcclxuICAgICAgICAgICAgICAgIC5tYXAoQXJyYXkucHJvdG90eXBlLnZhbHVlT2YsIFswLCAxXSk7XHJcbiAgICAgICAgICAgIGFyci51bnNoaWZ0KFsxXSk7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogW10uY29uY2F0LmFwcGx5KFtdLCBhcnIpLFxyXG4gICAgICAgICAgICAgICAgaXNOZWdhdGl2ZTogZmFsc2VcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBuZWcgPSBmYWxzZTtcclxuICAgICAgICBpZiAobi5pc05lZ2F0aXZlKCkgJiYgYmFzZS5pc1Bvc2l0aXZlKCkpIHtcclxuICAgICAgICAgICAgbmVnID0gdHJ1ZTtcclxuICAgICAgICAgICAgbiA9IG4uYWJzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChiYXNlLmlzVW5pdCgpKSB7XHJcbiAgICAgICAgICAgIGlmIChuLmlzWmVybygpKSByZXR1cm4geyB2YWx1ZTogWzBdLCBpc05lZ2F0aXZlOiBmYWxzZSB9O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlOiBBcnJheS5hcHBseShudWxsLCBBcnJheShuLnRvSlNOdW1iZXIoKSkpXHJcbiAgICAgICAgICAgICAgICAgICAgLm1hcChOdW1iZXIucHJvdG90eXBlLnZhbHVlT2YsIDEpLFxyXG4gICAgICAgICAgICAgICAgaXNOZWdhdGl2ZTogbmVnXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBvdXQgPSBbXTtcclxuICAgICAgICB2YXIgbGVmdCA9IG4sIGRpdm1vZDtcclxuICAgICAgICB3aGlsZSAobGVmdC5pc05lZ2F0aXZlKCkgfHwgbGVmdC5jb21wYXJlQWJzKGJhc2UpID49IDApIHtcclxuICAgICAgICAgICAgZGl2bW9kID0gbGVmdC5kaXZtb2QoYmFzZSk7XHJcbiAgICAgICAgICAgIGxlZnQgPSBkaXZtb2QucXVvdGllbnQ7XHJcbiAgICAgICAgICAgIHZhciBkaWdpdCA9IGRpdm1vZC5yZW1haW5kZXI7XHJcbiAgICAgICAgICAgIGlmIChkaWdpdC5pc05lZ2F0aXZlKCkpIHtcclxuICAgICAgICAgICAgICAgIGRpZ2l0ID0gYmFzZS5taW51cyhkaWdpdCkuYWJzKCk7XHJcbiAgICAgICAgICAgICAgICBsZWZ0ID0gbGVmdC5uZXh0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb3V0LnB1c2goZGlnaXQudG9KU051bWJlcigpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgb3V0LnB1c2gobGVmdC50b0pTTnVtYmVyKCkpO1xyXG4gICAgICAgIHJldHVybiB7IHZhbHVlOiBvdXQucmV2ZXJzZSgpLCBpc05lZ2F0aXZlOiBuZWcgfTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB0b0Jhc2VTdHJpbmcobiwgYmFzZSwgYWxwaGFiZXQpIHtcclxuICAgICAgICB2YXIgYXJyID0gdG9CYXNlKG4sIGJhc2UpO1xyXG4gICAgICAgIHJldHVybiAoYXJyLmlzTmVnYXRpdmUgPyBcIi1cIiA6IFwiXCIpICsgYXJyLnZhbHVlLm1hcChmdW5jdGlvbiAoeCkge1xyXG4gICAgICAgICAgICByZXR1cm4gc3RyaW5naWZ5KHgsIGFscGhhYmV0KTtcclxuICAgICAgICB9KS5qb2luKCcnKTtcclxuICAgIH1cclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS50b0FycmF5ID0gZnVuY3Rpb24gKHJhZGl4KSB7XHJcbiAgICAgICAgcmV0dXJuIHRvQmFzZSh0aGlzLCByYWRpeCk7XHJcbiAgICB9O1xyXG5cclxuICAgIFNtYWxsSW50ZWdlci5wcm90b3R5cGUudG9BcnJheSA9IGZ1bmN0aW9uIChyYWRpeCkge1xyXG4gICAgICAgIHJldHVybiB0b0Jhc2UodGhpcywgcmFkaXgpO1xyXG4gICAgfTtcclxuXHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLnRvQXJyYXkgPSBmdW5jdGlvbiAocmFkaXgpIHtcclxuICAgICAgICByZXR1cm4gdG9CYXNlKHRoaXMsIHJhZGl4KTtcclxuICAgIH07XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAocmFkaXgsIGFscGhhYmV0KSB7XHJcbiAgICAgICAgaWYgKHJhZGl4ID09PSB1bmRlZmluZWQpIHJhZGl4ID0gMTA7XHJcbiAgICAgICAgaWYgKHJhZGl4ICE9PSAxMCkgcmV0dXJuIHRvQmFzZVN0cmluZyh0aGlzLCByYWRpeCwgYWxwaGFiZXQpO1xyXG4gICAgICAgIHZhciB2ID0gdGhpcy52YWx1ZSwgbCA9IHYubGVuZ3RoLCBzdHIgPSBTdHJpbmcodlstLWxdKSwgemVyb3MgPSBcIjAwMDAwMDBcIiwgZGlnaXQ7XHJcbiAgICAgICAgd2hpbGUgKC0tbCA+PSAwKSB7XHJcbiAgICAgICAgICAgIGRpZ2l0ID0gU3RyaW5nKHZbbF0pO1xyXG4gICAgICAgICAgICBzdHIgKz0gemVyb3Muc2xpY2UoZGlnaXQubGVuZ3RoKSArIGRpZ2l0O1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgc2lnbiA9IHRoaXMuc2lnbiA/IFwiLVwiIDogXCJcIjtcclxuICAgICAgICByZXR1cm4gc2lnbiArIHN0cjtcclxuICAgIH07XHJcblxyXG4gICAgU21hbGxJbnRlZ2VyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIChyYWRpeCwgYWxwaGFiZXQpIHtcclxuICAgICAgICBpZiAocmFkaXggPT09IHVuZGVmaW5lZCkgcmFkaXggPSAxMDtcclxuICAgICAgICBpZiAocmFkaXggIT0gMTApIHJldHVybiB0b0Jhc2VTdHJpbmcodGhpcywgcmFkaXgsIGFscGhhYmV0KTtcclxuICAgICAgICByZXR1cm4gU3RyaW5nKHRoaXMudmFsdWUpO1xyXG4gICAgfTtcclxuXHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLnRvU3RyaW5nID0gU21hbGxJbnRlZ2VyLnByb3RvdHlwZS50b1N0cmluZztcclxuXHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLnRvSlNPTiA9IEJpZ0ludGVnZXIucHJvdG90eXBlLnRvSlNPTiA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy50b1N0cmluZygpOyB9XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUudmFsdWVPZiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gcGFyc2VJbnQodGhpcy50b1N0cmluZygpLCAxMCk7XHJcbiAgICB9O1xyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUudG9KU051bWJlciA9IEJpZ0ludGVnZXIucHJvdG90eXBlLnZhbHVlT2Y7XHJcblxyXG4gICAgU21hbGxJbnRlZ2VyLnByb3RvdHlwZS52YWx1ZU9mID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xyXG4gICAgfTtcclxuICAgIFNtYWxsSW50ZWdlci5wcm90b3R5cGUudG9KU051bWJlciA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUudmFsdWVPZjtcclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUudmFsdWVPZiA9IE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUudG9KU051bWJlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gcGFyc2VJbnQodGhpcy50b1N0cmluZygpLCAxMCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcGFyc2VTdHJpbmdWYWx1ZSh2KSB7XHJcbiAgICAgICAgaWYgKGlzUHJlY2lzZSgrdikpIHtcclxuICAgICAgICAgICAgdmFyIHggPSArdjtcclxuICAgICAgICAgICAgaWYgKHggPT09IHRydW5jYXRlKHgpKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1cHBvcnRzTmF0aXZlQmlnSW50ID8gbmV3IE5hdGl2ZUJpZ0ludChCaWdJbnQoeCkpIDogbmV3IFNtYWxsSW50ZWdlcih4KTtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBpbnRlZ2VyOiBcIiArIHYpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgc2lnbiA9IHZbMF0gPT09IFwiLVwiO1xyXG4gICAgICAgIGlmIChzaWduKSB2ID0gdi5zbGljZSgxKTtcclxuICAgICAgICB2YXIgc3BsaXQgPSB2LnNwbGl0KC9lL2kpO1xyXG4gICAgICAgIGlmIChzcGxpdC5sZW5ndGggPiAyKSB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGludGVnZXI6IFwiICsgc3BsaXQuam9pbihcImVcIikpO1xyXG4gICAgICAgIGlmIChzcGxpdC5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgdmFyIGV4cCA9IHNwbGl0WzFdO1xyXG4gICAgICAgICAgICBpZiAoZXhwWzBdID09PSBcIitcIikgZXhwID0gZXhwLnNsaWNlKDEpO1xyXG4gICAgICAgICAgICBleHAgPSArZXhwO1xyXG4gICAgICAgICAgICBpZiAoZXhwICE9PSB0cnVuY2F0ZShleHApIHx8ICFpc1ByZWNpc2UoZXhwKSkgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBpbnRlZ2VyOiBcIiArIGV4cCArIFwiIGlzIG5vdCBhIHZhbGlkIGV4cG9uZW50LlwiKTtcclxuICAgICAgICAgICAgdmFyIHRleHQgPSBzcGxpdFswXTtcclxuICAgICAgICAgICAgdmFyIGRlY2ltYWxQbGFjZSA9IHRleHQuaW5kZXhPZihcIi5cIik7XHJcbiAgICAgICAgICAgIGlmIChkZWNpbWFsUGxhY2UgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgZXhwIC09IHRleHQubGVuZ3RoIC0gZGVjaW1hbFBsYWNlIC0gMTtcclxuICAgICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnNsaWNlKDAsIGRlY2ltYWxQbGFjZSkgKyB0ZXh0LnNsaWNlKGRlY2ltYWxQbGFjZSArIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChleHAgPCAwKSB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgaW5jbHVkZSBuZWdhdGl2ZSBleHBvbmVudCBwYXJ0IGZvciBpbnRlZ2Vyc1wiKTtcclxuICAgICAgICAgICAgdGV4dCArPSAobmV3IEFycmF5KGV4cCArIDEpKS5qb2luKFwiMFwiKTtcclxuICAgICAgICAgICAgdiA9IHRleHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBpc1ZhbGlkID0gL14oWzAtOV1bMC05XSopJC8udGVzdCh2KTtcclxuICAgICAgICBpZiAoIWlzVmFsaWQpIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgaW50ZWdlcjogXCIgKyB2KTtcclxuICAgICAgICBpZiAoc3VwcG9ydHNOYXRpdmVCaWdJbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBOYXRpdmVCaWdJbnQoQmlnSW50KHNpZ24gPyBcIi1cIiArIHYgOiB2KSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciByID0gW10sIG1heCA9IHYubGVuZ3RoLCBsID0gTE9HX0JBU0UsIG1pbiA9IG1heCAtIGw7XHJcbiAgICAgICAgd2hpbGUgKG1heCA+IDApIHtcclxuICAgICAgICAgICAgci5wdXNoKCt2LnNsaWNlKG1pbiwgbWF4KSk7XHJcbiAgICAgICAgICAgIG1pbiAtPSBsO1xyXG4gICAgICAgICAgICBpZiAobWluIDwgMCkgbWluID0gMDtcclxuICAgICAgICAgICAgbWF4IC09IGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRyaW0ocik7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCaWdJbnRlZ2VyKHIsIHNpZ24pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlTnVtYmVyVmFsdWUodikge1xyXG4gICAgICAgIGlmIChzdXBwb3J0c05hdGl2ZUJpZ0ludCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IE5hdGl2ZUJpZ0ludChCaWdJbnQodikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoaXNQcmVjaXNlKHYpKSB7XHJcbiAgICAgICAgICAgIGlmICh2ICE9PSB0cnVuY2F0ZSh2KSkgdGhyb3cgbmV3IEVycm9yKHYgKyBcIiBpcyBub3QgYW4gaW50ZWdlci5cIik7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgU21hbGxJbnRlZ2VyKHYpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcGFyc2VTdHJpbmdWYWx1ZSh2LnRvU3RyaW5nKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlVmFsdWUodikge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdiA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VOdW1iZXJWYWx1ZSh2KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2ID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVN0cmluZ1ZhbHVlKHYpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIHYgPT09IFwiYmlnaW50XCIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBOYXRpdmVCaWdJbnQodik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB2O1xyXG4gICAgfVxyXG4gICAgLy8gUHJlLWRlZmluZSBudW1iZXJzIGluIHJhbmdlIFstOTk5LDk5OV1cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTAwMDsgaSsrKSB7XHJcbiAgICAgICAgSW50ZWdlcltpXSA9IHBhcnNlVmFsdWUoaSk7XHJcbiAgICAgICAgaWYgKGkgPiAwKSBJbnRlZ2VyWy1pXSA9IHBhcnNlVmFsdWUoLWkpO1xyXG4gICAgfVxyXG4gICAgLy8gQmFja3dhcmRzIGNvbXBhdGliaWxpdHlcclxuICAgIEludGVnZXIub25lID0gSW50ZWdlclsxXTtcclxuICAgIEludGVnZXIuemVybyA9IEludGVnZXJbMF07XHJcbiAgICBJbnRlZ2VyLm1pbnVzT25lID0gSW50ZWdlclstMV07XHJcbiAgICBJbnRlZ2VyLm1heCA9IG1heDtcclxuICAgIEludGVnZXIubWluID0gbWluO1xyXG4gICAgSW50ZWdlci5nY2QgPSBnY2Q7XHJcbiAgICBJbnRlZ2VyLmxjbSA9IGxjbTtcclxuICAgIEludGVnZXIuaXNJbnN0YW5jZSA9IGZ1bmN0aW9uICh4KSB7IHJldHVybiB4IGluc3RhbmNlb2YgQmlnSW50ZWdlciB8fCB4IGluc3RhbmNlb2YgU21hbGxJbnRlZ2VyIHx8IHggaW5zdGFuY2VvZiBOYXRpdmVCaWdJbnQ7IH07XHJcbiAgICBJbnRlZ2VyLnJhbmRCZXR3ZWVuID0gcmFuZEJldHdlZW47XHJcblxyXG4gICAgSW50ZWdlci5mcm9tQXJyYXkgPSBmdW5jdGlvbiAoZGlnaXRzLCBiYXNlLCBpc05lZ2F0aXZlKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhcnNlQmFzZUZyb21BcnJheShkaWdpdHMubWFwKHBhcnNlVmFsdWUpLCBwYXJzZVZhbHVlKGJhc2UgfHwgMTApLCBpc05lZ2F0aXZlKTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIEludGVnZXI7XHJcbn0pKCk7XHJcblxyXG4vLyBOb2RlLmpzIGNoZWNrXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5oYXNPd25Qcm9wZXJ0eShcImV4cG9ydHNcIikpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gYmlnSW50O1xyXG59XHJcblxyXG4vL2FtZCBjaGVja1xyXG5pZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcclxuICAgIGRlZmluZSggZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBiaWdJbnQ7XHJcbiAgICB9KTtcclxufVxyXG4iLCIvKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxodHRwczovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLXByb3RvICovXG5cbid1c2Ugc3RyaWN0J1xuXG52YXIgYmFzZTY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJylcbnZhciBpZWVlNzU0ID0gcmVxdWlyZSgnaWVlZTc1NCcpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcblxudmFyIEtfTUFYX0xFTkdUSCA9IDB4N2ZmZmZmZmZcbmV4cG9ydHMua01heExlbmd0aCA9IEtfTUFYX0xFTkdUSFxuXG4vKipcbiAqIElmIGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGA6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBQcmludCB3YXJuaW5nIGFuZCByZWNvbW1lbmQgdXNpbmcgYGJ1ZmZlcmAgdjQueCB3aGljaCBoYXMgYW4gT2JqZWN0XG4gKiAgICAgICAgICAgICAgIGltcGxlbWVudGF0aW9uIChtb3N0IGNvbXBhdGlibGUsIGV2ZW4gSUU2KVxuICpcbiAqIEJyb3dzZXJzIHRoYXQgc3VwcG9ydCB0eXBlZCBhcnJheXMgYXJlIElFIDEwKywgRmlyZWZveCA0KywgQ2hyb21lIDcrLCBTYWZhcmkgNS4xKyxcbiAqIE9wZXJhIDExLjYrLCBpT1MgNC4yKy5cbiAqXG4gKiBXZSByZXBvcnQgdGhhdCB0aGUgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBpZiB0aGUgYXJlIG5vdCBzdWJjbGFzc2FibGVcbiAqIHVzaW5nIF9fcHJvdG9fXy4gRmlyZWZveCA0LTI5IGxhY2tzIHN1cHBvcnQgZm9yIGFkZGluZyBuZXcgcHJvcGVydGllcyB0byBgVWludDhBcnJheWBcbiAqIChTZWU6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NTQzOCkuIElFIDEwIGxhY2tzIHN1cHBvcnRcbiAqIGZvciBfX3Byb3RvX18gYW5kIGhhcyBhIGJ1Z2d5IHR5cGVkIGFycmF5IGltcGxlbWVudGF0aW9uLlxuICovXG5CdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCA9IHR5cGVkQXJyYXlTdXBwb3J0KClcblxuaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCAmJiB0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICB0eXBlb2YgY29uc29sZS5lcnJvciA9PT0gJ2Z1bmN0aW9uJykge1xuICBjb25zb2xlLmVycm9yKFxuICAgICdUaGlzIGJyb3dzZXIgbGFja3MgdHlwZWQgYXJyYXkgKFVpbnQ4QXJyYXkpIHN1cHBvcnQgd2hpY2ggaXMgcmVxdWlyZWQgYnkgJyArXG4gICAgJ2BidWZmZXJgIHY1LnguIFVzZSBgYnVmZmVyYCB2NC54IGlmIHlvdSByZXF1aXJlIG9sZCBicm93c2VyIHN1cHBvcnQuJ1xuICApXG59XG5cbmZ1bmN0aW9uIHR5cGVkQXJyYXlTdXBwb3J0ICgpIHtcbiAgLy8gQ2FuIHR5cGVkIGFycmF5IGluc3RhbmNlcyBjYW4gYmUgYXVnbWVudGVkP1xuICB0cnkge1xuICAgIHZhciBhcnIgPSBuZXcgVWludDhBcnJheSgxKVxuICAgIGFyci5fX3Byb3RvX18gPSB7IF9fcHJvdG9fXzogVWludDhBcnJheS5wcm90b3R5cGUsIGZvbzogZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfSB9XG4gICAgcmV0dXJuIGFyci5mb28oKSA9PT0gNDJcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIucHJvdG90eXBlLCAncGFyZW50Jywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0aGlzKSkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIHJldHVybiB0aGlzLmJ1ZmZlclxuICB9XG59KVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLnByb3RvdHlwZSwgJ29mZnNldCcsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGhpcykpIHJldHVybiB1bmRlZmluZWRcbiAgICByZXR1cm4gdGhpcy5ieXRlT2Zmc2V0XG4gIH1cbn0pXG5cbmZ1bmN0aW9uIGNyZWF0ZUJ1ZmZlciAobGVuZ3RoKSB7XG4gIGlmIChsZW5ndGggPiBLX01BWF9MRU5HVEgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIFwiJyArIGxlbmd0aCArICdcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJzaXplXCInKVxuICB9XG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIHZhciBidWYgPSBuZXcgVWludDhBcnJheShsZW5ndGgpXG4gIGJ1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBidWZcbn1cblxuLyoqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGhhdmUgdGhlaXJcbiAqIHByb3RvdHlwZSBjaGFuZ2VkIHRvIGBCdWZmZXIucHJvdG90eXBlYC4gRnVydGhlcm1vcmUsIGBCdWZmZXJgIGlzIGEgc3ViY2xhc3Mgb2ZcbiAqIGBVaW50OEFycmF5YCwgc28gdGhlIHJldHVybmVkIGluc3RhbmNlcyB3aWxsIGhhdmUgYWxsIHRoZSBub2RlIGBCdWZmZXJgIG1ldGhvZHNcbiAqIGFuZCB0aGUgYFVpbnQ4QXJyYXlgIG1ldGhvZHMuIFNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0XG4gKiByZXR1cm5zIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIFRoZSBgVWludDhBcnJheWAgcHJvdG90eXBlIHJlbWFpbnMgdW5tb2RpZmllZC5cbiAqL1xuXG5mdW5jdGlvbiBCdWZmZXIgKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIC8vIENvbW1vbiBjYXNlLlxuICBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIHtcbiAgICBpZiAodHlwZW9mIGVuY29kaW5nT3JPZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAnVGhlIFwic3RyaW5nXCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIHN0cmluZy4gUmVjZWl2ZWQgdHlwZSBudW1iZXInXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiBhbGxvY1Vuc2FmZShhcmcpXG4gIH1cbiAgcmV0dXJuIGZyb20oYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbi8vIEZpeCBzdWJhcnJheSgpIGluIEVTMjAxNi4gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzk3XG5pZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnNwZWNpZXMgIT0gbnVsbCAmJlxuICAgIEJ1ZmZlcltTeW1ib2wuc3BlY2llc10gPT09IEJ1ZmZlcikge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLCBTeW1ib2wuc3BlY2llcywge1xuICAgIHZhbHVlOiBudWxsLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogZmFsc2VcbiAgfSlcbn1cblxuQnVmZmVyLnBvb2xTaXplID0gODE5MiAvLyBub3QgdXNlZCBieSB0aGlzIGltcGxlbWVudGF0aW9uXG5cbmZ1bmN0aW9uIGZyb20gKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZnJvbVN0cmluZyh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldClcbiAgfVxuXG4gIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcodmFsdWUpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2UodmFsdWUpXG4gIH1cblxuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHRocm93IFR5cGVFcnJvcihcbiAgICAgICdUaGUgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCAnICtcbiAgICAgICdvciBBcnJheS1saWtlIE9iamVjdC4gUmVjZWl2ZWQgdHlwZSAnICsgKHR5cGVvZiB2YWx1ZSlcbiAgICApXG4gIH1cblxuICBpZiAoaXNJbnN0YW5jZSh2YWx1ZSwgQXJyYXlCdWZmZXIpIHx8XG4gICAgICAodmFsdWUgJiYgaXNJbnN0YW5jZSh2YWx1ZS5idWZmZXIsIEFycmF5QnVmZmVyKSkpIHtcbiAgICByZXR1cm4gZnJvbUFycmF5QnVmZmVyKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwidmFsdWVcIiBhcmd1bWVudCBtdXN0IG5vdCBiZSBvZiB0eXBlIG51bWJlci4gUmVjZWl2ZWQgdHlwZSBudW1iZXInXG4gICAgKVxuICB9XG5cbiAgdmFyIHZhbHVlT2YgPSB2YWx1ZS52YWx1ZU9mICYmIHZhbHVlLnZhbHVlT2YoKVxuICBpZiAodmFsdWVPZiAhPSBudWxsICYmIHZhbHVlT2YgIT09IHZhbHVlKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKHZhbHVlT2YsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIHZhciBiID0gZnJvbU9iamVjdCh2YWx1ZSlcbiAgaWYgKGIpIHJldHVybiBiXG5cbiAgaWYgKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1ByaW1pdGl2ZSAhPSBudWxsICYmXG4gICAgICB0eXBlb2YgdmFsdWVbU3ltYm9sLnRvUHJpbWl0aXZlXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBCdWZmZXIuZnJvbShcbiAgICAgIHZhbHVlW1N5bWJvbC50b1ByaW1pdGl2ZV0oJ3N0cmluZycpLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGhcbiAgICApXG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICdUaGUgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCAnICtcbiAgICAnb3IgQXJyYXktbGlrZSBPYmplY3QuIFJlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdmFsdWUpXG4gIClcbn1cblxuLyoqXG4gKiBGdW5jdGlvbmFsbHkgZXF1aXZhbGVudCB0byBCdWZmZXIoYXJnLCBlbmNvZGluZykgYnV0IHRocm93cyBhIFR5cGVFcnJvclxuICogaWYgdmFsdWUgaXMgYSBudW1iZXIuXG4gKiBCdWZmZXIuZnJvbShzdHJbLCBlbmNvZGluZ10pXG4gKiBCdWZmZXIuZnJvbShhcnJheSlcbiAqIEJ1ZmZlci5mcm9tKGJ1ZmZlcilcbiAqIEJ1ZmZlci5mcm9tKGFycmF5QnVmZmVyWywgYnl0ZU9mZnNldFssIGxlbmd0aF1dKVxuICoqL1xuQnVmZmVyLmZyb20gPSBmdW5jdGlvbiAodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gZnJvbSh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxufVxuXG4vLyBOb3RlOiBDaGFuZ2UgcHJvdG90eXBlICphZnRlciogQnVmZmVyLmZyb20gaXMgZGVmaW5lZCB0byB3b3JrYXJvdW5kIENocm9tZSBidWc6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzE0OFxuQnVmZmVyLnByb3RvdHlwZS5fX3Byb3RvX18gPSBVaW50OEFycmF5LnByb3RvdHlwZVxuQnVmZmVyLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXlcblxuZnVuY3Rpb24gYXNzZXJ0U2l6ZSAoc2l6ZSkge1xuICBpZiAodHlwZW9mIHNpemUgIT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJzaXplXCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIG51bWJlcicpXG4gIH0gZWxzZSBpZiAoc2l6ZSA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIFwiJyArIHNpemUgKyAnXCIgaXMgaW52YWxpZCBmb3Igb3B0aW9uIFwic2l6ZVwiJylcbiAgfVxufVxuXG5mdW5jdGlvbiBhbGxvYyAoc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgYXNzZXJ0U2l6ZShzaXplKVxuICBpZiAoc2l6ZSA8PSAwKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplKVxuICB9XG4gIGlmIChmaWxsICE9PSB1bmRlZmluZWQpIHtcbiAgICAvLyBPbmx5IHBheSBhdHRlbnRpb24gdG8gZW5jb2RpbmcgaWYgaXQncyBhIHN0cmluZy4gVGhpc1xuICAgIC8vIHByZXZlbnRzIGFjY2lkZW50YWxseSBzZW5kaW5nIGluIGEgbnVtYmVyIHRoYXQgd291bGRcbiAgICAvLyBiZSBpbnRlcnByZXR0ZWQgYXMgYSBzdGFydCBvZmZzZXQuXG4gICAgcmV0dXJuIHR5cGVvZiBlbmNvZGluZyA9PT0gJ3N0cmluZydcbiAgICAgID8gY3JlYXRlQnVmZmVyKHNpemUpLmZpbGwoZmlsbCwgZW5jb2RpbmcpXG4gICAgICA6IGNyZWF0ZUJ1ZmZlcihzaXplKS5maWxsKGZpbGwpXG4gIH1cbiAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplKVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqIGFsbG9jKHNpemVbLCBmaWxsWywgZW5jb2RpbmddXSlcbiAqKi9cbkJ1ZmZlci5hbGxvYyA9IGZ1bmN0aW9uIChzaXplLCBmaWxsLCBlbmNvZGluZykge1xuICByZXR1cm4gYWxsb2Moc2l6ZSwgZmlsbCwgZW5jb2RpbmcpXG59XG5cbmZ1bmN0aW9uIGFsbG9jVW5zYWZlIChzaXplKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplIDwgMCA/IDAgOiBjaGVja2VkKHNpemUpIHwgMClcbn1cblxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIEJ1ZmZlcihudW0pLCBieSBkZWZhdWx0IGNyZWF0ZXMgYSBub24temVyby1maWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICogKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZSA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShzaXplKVxufVxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIFNsb3dCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqL1xuQnVmZmVyLmFsbG9jVW5zYWZlU2xvdyA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShzaXplKVxufVxuXG5mdW5jdGlvbiBmcm9tU3RyaW5nIChzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnIHx8IGVuY29kaW5nID09PSAnJykge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gIH1cblxuICBpZiAoIUJ1ZmZlci5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgfVxuXG4gIHZhciBsZW5ndGggPSBieXRlTGVuZ3RoKHN0cmluZywgZW5jb2RpbmcpIHwgMFxuICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbmd0aClcblxuICB2YXIgYWN0dWFsID0gYnVmLndyaXRlKHN0cmluZywgZW5jb2RpbmcpXG5cbiAgaWYgKGFjdHVhbCAhPT0gbGVuZ3RoKSB7XG4gICAgLy8gV3JpdGluZyBhIGhleCBzdHJpbmcsIGZvciBleGFtcGxlLCB0aGF0IGNvbnRhaW5zIGludmFsaWQgY2hhcmFjdGVycyB3aWxsXG4gICAgLy8gY2F1c2UgZXZlcnl0aGluZyBhZnRlciB0aGUgZmlyc3QgaW52YWxpZCBjaGFyYWN0ZXIgdG8gYmUgaWdub3JlZC4gKGUuZy5cbiAgICAvLyAnYWJ4eGNkJyB3aWxsIGJlIHRyZWF0ZWQgYXMgJ2FiJylcbiAgICBidWYgPSBidWYuc2xpY2UoMCwgYWN0dWFsKVxuICB9XG5cbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlMaWtlIChhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoIDwgMCA/IDAgOiBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgYnVmW2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUJ1ZmZlciAoYXJyYXksIGJ5dGVPZmZzZXQsIGxlbmd0aCkge1xuICBpZiAoYnl0ZU9mZnNldCA8IDAgfHwgYXJyYXkuYnl0ZUxlbmd0aCA8IGJ5dGVPZmZzZXQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJvZmZzZXRcIiBpcyBvdXRzaWRlIG9mIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKGFycmF5LmJ5dGVMZW5ndGggPCBieXRlT2Zmc2V0ICsgKGxlbmd0aCB8fCAwKSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcImxlbmd0aFwiIGlzIG91dHNpZGUgb2YgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICB2YXIgYnVmXG4gIGlmIChieXRlT2Zmc2V0ID09PSB1bmRlZmluZWQgJiYgbGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSlcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5LCBieXRlT2Zmc2V0KVxuICB9IGVsc2Uge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5LCBieXRlT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZVxuICBidWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21PYmplY3QgKG9iaikge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKG9iaikpIHtcbiAgICB2YXIgbGVuID0gY2hlY2tlZChvYmoubGVuZ3RoKSB8IDBcbiAgICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbilcblxuICAgIGlmIChidWYubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gYnVmXG4gICAgfVxuXG4gICAgb2JqLmNvcHkoYnVmLCAwLCAwLCBsZW4pXG4gICAgcmV0dXJuIGJ1ZlxuICB9XG5cbiAgaWYgKG9iai5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0eXBlb2Ygb2JqLmxlbmd0aCAhPT0gJ251bWJlcicgfHwgbnVtYmVySXNOYU4ob2JqLmxlbmd0aCkpIHtcbiAgICAgIHJldHVybiBjcmVhdGVCdWZmZXIoMClcbiAgICB9XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2Uob2JqKVxuICB9XG5cbiAgaWYgKG9iai50eXBlID09PSAnQnVmZmVyJyAmJiBBcnJheS5pc0FycmF5KG9iai5kYXRhKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKG9iai5kYXRhKVxuICB9XG59XG5cbmZ1bmN0aW9uIGNoZWNrZWQgKGxlbmd0aCkge1xuICAvLyBOb3RlOiBjYW5ub3QgdXNlIGBsZW5ndGggPCBLX01BWF9MRU5HVEhgIGhlcmUgYmVjYXVzZSB0aGF0IGZhaWxzIHdoZW5cbiAgLy8gbGVuZ3RoIGlzIE5hTiAod2hpY2ggaXMgb3RoZXJ3aXNlIGNvZXJjZWQgdG8gemVyby4pXG4gIGlmIChsZW5ndGggPj0gS19NQVhfTEVOR1RIKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gYWxsb2NhdGUgQnVmZmVyIGxhcmdlciB0aGFuIG1heGltdW0gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ3NpemU6IDB4JyArIEtfTUFYX0xFTkdUSC50b1N0cmluZygxNikgKyAnIGJ5dGVzJylcbiAgfVxuICByZXR1cm4gbGVuZ3RoIHwgMFxufVxuXG5mdW5jdGlvbiBTbG93QnVmZmVyIChsZW5ndGgpIHtcbiAgaWYgKCtsZW5ndGggIT0gbGVuZ3RoKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXG4gICAgbGVuZ3RoID0gMFxuICB9XG4gIHJldHVybiBCdWZmZXIuYWxsb2MoK2xlbmd0aClcbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gaXNCdWZmZXIgKGIpIHtcbiAgcmV0dXJuIGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlciA9PT0gdHJ1ZSAmJlxuICAgIGIgIT09IEJ1ZmZlci5wcm90b3R5cGUgLy8gc28gQnVmZmVyLmlzQnVmZmVyKEJ1ZmZlci5wcm90b3R5cGUpIHdpbGwgYmUgZmFsc2Vcbn1cblxuQnVmZmVyLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlIChhLCBiKSB7XG4gIGlmIChpc0luc3RhbmNlKGEsIFVpbnQ4QXJyYXkpKSBhID0gQnVmZmVyLmZyb20oYSwgYS5vZmZzZXQsIGEuYnl0ZUxlbmd0aClcbiAgaWYgKGlzSW5zdGFuY2UoYiwgVWludDhBcnJheSkpIGIgPSBCdWZmZXIuZnJvbShiLCBiLm9mZnNldCwgYi5ieXRlTGVuZ3RoKVxuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihhKSB8fCAhQnVmZmVyLmlzQnVmZmVyKGIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJidWYxXCIsIFwiYnVmMlwiIGFyZ3VtZW50cyBtdXN0IGJlIG9uZSBvZiB0eXBlIEJ1ZmZlciBvciBVaW50OEFycmF5J1xuICAgIClcbiAgfVxuXG4gIGlmIChhID09PSBiKSByZXR1cm4gMFxuXG4gIHZhciB4ID0gYS5sZW5ndGhcbiAgdmFyIHkgPSBiLmxlbmd0aFxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBNYXRoLm1pbih4LCB5KTsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIHtcbiAgICAgIHggPSBhW2ldXG4gICAgICB5ID0gYltpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gaXNFbmNvZGluZyAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnbGF0aW4xJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQgKGxpc3QsIGxlbmd0aCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICB9XG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5hbGxvYygwKVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgICBsZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmZmVyID0gQnVmZmVyLmFsbG9jVW5zYWZlKGxlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgYnVmID0gbGlzdFtpXVxuICAgIGlmIChpc0luc3RhbmNlKGJ1ZiwgVWludDhBcnJheSkpIHtcbiAgICAgIGJ1ZiA9IEJ1ZmZlci5mcm9tKGJ1ZilcbiAgICB9XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJylcbiAgICB9XG4gICAgYnVmLmNvcHkoYnVmZmVyLCBwb3MpXG4gICAgcG9zICs9IGJ1Zi5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmZmVyXG59XG5cbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihzdHJpbmcpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5sZW5ndGhcbiAgfVxuICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHN0cmluZykgfHwgaXNJbnN0YW5jZShzdHJpbmcsIEFycmF5QnVmZmVyKSkge1xuICAgIHJldHVybiBzdHJpbmcuYnl0ZUxlbmd0aFxuICB9XG4gIGlmICh0eXBlb2Ygc3RyaW5nICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwic3RyaW5nXCIgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgb3IgQXJyYXlCdWZmZXIuICcgK1xuICAgICAgJ1JlY2VpdmVkIHR5cGUgJyArIHR5cGVvZiBzdHJpbmdcbiAgICApXG4gIH1cblxuICB2YXIgbGVuID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbXVzdE1hdGNoID0gKGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSA9PT0gdHJ1ZSlcbiAgaWYgKCFtdXN0TWF0Y2ggJiYgbGVuID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIFVzZSBhIGZvciBsb29wIHRvIGF2b2lkIHJlY3Vyc2lvblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsZW5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiBsZW4gKiAyXG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gbGVuID4+PiAxXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB7XG4gICAgICAgICAgcmV0dXJuIG11c3RNYXRjaCA/IC0xIDogdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGggLy8gYXNzdW1lIHV0ZjhcbiAgICAgICAgfVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuQnVmZmVyLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5cbmZ1bmN0aW9uIHNsb3dUb1N0cmluZyAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcblxuICAvLyBObyBuZWVkIHRvIHZlcmlmeSB0aGF0IFwidGhpcy5sZW5ndGggPD0gTUFYX1VJTlQzMlwiIHNpbmNlIGl0J3MgYSByZWFkLW9ubHlcbiAgLy8gcHJvcGVydHkgb2YgYSB0eXBlZCBhcnJheS5cblxuICAvLyBUaGlzIGJlaGF2ZXMgbmVpdGhlciBsaWtlIFN0cmluZyBub3IgVWludDhBcnJheSBpbiB0aGF0IHdlIHNldCBzdGFydC9lbmRcbiAgLy8gdG8gdGhlaXIgdXBwZXIvbG93ZXIgYm91bmRzIGlmIHRoZSB2YWx1ZSBwYXNzZWQgaXMgb3V0IG9mIHJhbmdlLlxuICAvLyB1bmRlZmluZWQgaXMgaGFuZGxlZCBzcGVjaWFsbHkgYXMgcGVyIEVDTUEtMjYyIDZ0aCBFZGl0aW9uLFxuICAvLyBTZWN0aW9uIDEzLjMuMy43IFJ1bnRpbWUgU2VtYW50aWNzOiBLZXllZEJpbmRpbmdJbml0aWFsaXphdGlvbi5cbiAgaWYgKHN0YXJ0ID09PSB1bmRlZmluZWQgfHwgc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgLy8gUmV0dXJuIGVhcmx5IGlmIHN0YXJ0ID4gdGhpcy5sZW5ndGguIERvbmUgaGVyZSB0byBwcmV2ZW50IHBvdGVudGlhbCB1aW50MzJcbiAgLy8gY29lcmNpb24gZmFpbCBiZWxvdy5cbiAgaWYgKHN0YXJ0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmIChlbmQgPT09IHVuZGVmaW5lZCB8fCBlbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gIH1cblxuICBpZiAoZW5kIDw9IDApIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIC8vIEZvcmNlIGNvZXJzaW9uIHRvIHVpbnQzMi4gVGhpcyB3aWxsIGFsc28gY29lcmNlIGZhbHNleS9OYU4gdmFsdWVzIHRvIDAuXG4gIGVuZCA+Pj49IDBcbiAgc3RhcnQgPj4+PSAwXG5cbiAgaWYgKGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGF0aW4xU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1dGYxNmxlU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKGVuY29kaW5nICsgJycpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbi8vIFRoaXMgcHJvcGVydHkgaXMgdXNlZCBieSBgQnVmZmVyLmlzQnVmZmVyYCAoYW5kIHRoZSBgaXMtYnVmZmVyYCBucG0gcGFja2FnZSlcbi8vIHRvIGRldGVjdCBhIEJ1ZmZlciBpbnN0YW5jZS4gSXQncyBub3QgcG9zc2libGUgdG8gdXNlIGBpbnN0YW5jZW9mIEJ1ZmZlcmBcbi8vIHJlbGlhYmx5IGluIGEgYnJvd3NlcmlmeSBjb250ZXh0IGJlY2F1c2UgdGhlcmUgY291bGQgYmUgbXVsdGlwbGUgZGlmZmVyZW50XG4vLyBjb3BpZXMgb2YgdGhlICdidWZmZXInIHBhY2thZ2UgaW4gdXNlLiBUaGlzIG1ldGhvZCB3b3JrcyBldmVuIGZvciBCdWZmZXJcbi8vIGluc3RhbmNlcyB0aGF0IHdlcmUgY3JlYXRlZCBmcm9tIGFub3RoZXIgY29weSBvZiB0aGUgYGJ1ZmZlcmAgcGFja2FnZS5cbi8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvaXNzdWVzLzE1NFxuQnVmZmVyLnByb3RvdHlwZS5faXNCdWZmZXIgPSB0cnVlXG5cbmZ1bmN0aW9uIHN3YXAgKGIsIG4sIG0pIHtcbiAgdmFyIGkgPSBiW25dXG4gIGJbbl0gPSBiW21dXG4gIGJbbV0gPSBpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDE2ID0gZnVuY3Rpb24gc3dhcDE2ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSAyICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAxNi1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgMSlcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAzMiA9IGZ1bmN0aW9uIHN3YXAzMiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgNCAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMzItYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDMpXG4gICAgc3dhcCh0aGlzLCBpICsgMSwgaSArIDIpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwNjQgPSBmdW5jdGlvbiBzd2FwNjQgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDggIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDY0LWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDgpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyA3KVxuICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyA2KVxuICAgIHN3YXAodGhpcywgaSArIDIsIGkgKyA1KVxuICAgIHN3YXAodGhpcywgaSArIDMsIGkgKyA0KVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuZ3RoID09PSAwKSByZXR1cm4gJydcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiB1dGY4U2xpY2UodGhpcywgMCwgbGVuZ3RoKVxuICByZXR1cm4gc2xvd1RvU3RyaW5nLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0xvY2FsZVN0cmluZyA9IEJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmdcblxuQnVmZmVyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiBlcXVhbHMgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIHRydWVcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpID09PSAwXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uIGluc3BlY3QgKCkge1xuICB2YXIgc3RyID0gJydcbiAgdmFyIG1heCA9IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVNcbiAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5yZXBsYWNlKC8oLnsyfSkvZywgJyQxICcpLnRyaW0oKVxuICBpZiAodGhpcy5sZW5ndGggPiBtYXgpIHN0ciArPSAnIC4uLiAnXG4gIHJldHVybiAnPEJ1ZmZlciAnICsgc3RyICsgJz4nXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKHRhcmdldCwgc3RhcnQsIGVuZCwgdGhpc1N0YXJ0LCB0aGlzRW5kKSB7XG4gIGlmIChpc0luc3RhbmNlKHRhcmdldCwgVWludDhBcnJheSkpIHtcbiAgICB0YXJnZXQgPSBCdWZmZXIuZnJvbSh0YXJnZXQsIHRhcmdldC5vZmZzZXQsIHRhcmdldC5ieXRlTGVuZ3RoKVxuICB9XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKHRhcmdldCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcInRhcmdldFwiIGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgQnVmZmVyIG9yIFVpbnQ4QXJyYXkuICcgK1xuICAgICAgJ1JlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdGFyZ2V0KVxuICAgIClcbiAgfVxuXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgaWYgKGVuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5kID0gdGFyZ2V0ID8gdGFyZ2V0Lmxlbmd0aCA6IDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzU3RhcnQgPSAwXG4gIH1cbiAgaWYgKHRoaXNFbmQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXNFbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKHN0YXJ0IDwgMCB8fCBlbmQgPiB0YXJnZXQubGVuZ3RoIHx8IHRoaXNTdGFydCA8IDAgfHwgdGhpc0VuZCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ291dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQgJiYgc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQpIHtcbiAgICByZXR1cm4gLTFcbiAgfVxuICBpZiAoc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDFcbiAgfVxuXG4gIHN0YXJ0ID4+Pj0gMFxuICBlbmQgPj4+PSAwXG4gIHRoaXNTdGFydCA+Pj49IDBcbiAgdGhpc0VuZCA+Pj49IDBcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0KSByZXR1cm4gMFxuXG4gIHZhciB4ID0gdGhpc0VuZCAtIHRoaXNTdGFydFxuICB2YXIgeSA9IGVuZCAtIHN0YXJ0XG4gIHZhciBsZW4gPSBNYXRoLm1pbih4LCB5KVxuXG4gIHZhciB0aGlzQ29weSA9IHRoaXMuc2xpY2UodGhpc1N0YXJ0LCB0aGlzRW5kKVxuICB2YXIgdGFyZ2V0Q29weSA9IHRhcmdldC5zbGljZShzdGFydCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAodGhpc0NvcHlbaV0gIT09IHRhcmdldENvcHlbaV0pIHtcbiAgICAgIHggPSB0aGlzQ29weVtpXVxuICAgICAgeSA9IHRhcmdldENvcHlbaV1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG4vLyBGaW5kcyBlaXRoZXIgdGhlIGZpcnN0IGluZGV4IG9mIGB2YWxgIGluIGBidWZmZXJgIGF0IG9mZnNldCA+PSBgYnl0ZU9mZnNldGAsXG4vLyBPUiB0aGUgbGFzdCBpbmRleCBvZiBgdmFsYCBpbiBgYnVmZmVyYCBhdCBvZmZzZXQgPD0gYGJ5dGVPZmZzZXRgLlxuLy9cbi8vIEFyZ3VtZW50czpcbi8vIC0gYnVmZmVyIC0gYSBCdWZmZXIgdG8gc2VhcmNoXG4vLyAtIHZhbCAtIGEgc3RyaW5nLCBCdWZmZXIsIG9yIG51bWJlclxuLy8gLSBieXRlT2Zmc2V0IC0gYW4gaW5kZXggaW50byBgYnVmZmVyYDsgd2lsbCBiZSBjbGFtcGVkIHRvIGFuIGludDMyXG4vLyAtIGVuY29kaW5nIC0gYW4gb3B0aW9uYWwgZW5jb2RpbmcsIHJlbGV2YW50IGlzIHZhbCBpcyBhIHN0cmluZ1xuLy8gLSBkaXIgLSB0cnVlIGZvciBpbmRleE9mLCBmYWxzZSBmb3IgbGFzdEluZGV4T2ZcbmZ1bmN0aW9uIGJpZGlyZWN0aW9uYWxJbmRleE9mIChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcikge1xuICAvLyBFbXB0eSBidWZmZXIgbWVhbnMgbm8gbWF0Y2hcbiAgaWYgKGJ1ZmZlci5sZW5ndGggPT09IDApIHJldHVybiAtMVxuXG4gIC8vIE5vcm1hbGl6ZSBieXRlT2Zmc2V0XG4gIGlmICh0eXBlb2YgYnl0ZU9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IGJ5dGVPZmZzZXRcbiAgICBieXRlT2Zmc2V0ID0gMFxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPiAweDdmZmZmZmZmKSB7XG4gICAgYnl0ZU9mZnNldCA9IDB4N2ZmZmZmZmZcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgLTB4ODAwMDAwMDApIHtcbiAgICBieXRlT2Zmc2V0ID0gLTB4ODAwMDAwMDBcbiAgfVxuICBieXRlT2Zmc2V0ID0gK2J5dGVPZmZzZXQgLy8gQ29lcmNlIHRvIE51bWJlci5cbiAgaWYgKG51bWJlcklzTmFOKGJ5dGVPZmZzZXQpKSB7XG4gICAgLy8gYnl0ZU9mZnNldDogaXQgaXQncyB1bmRlZmluZWQsIG51bGwsIE5hTiwgXCJmb29cIiwgZXRjLCBzZWFyY2ggd2hvbGUgYnVmZmVyXG4gICAgYnl0ZU9mZnNldCA9IGRpciA/IDAgOiAoYnVmZmVyLmxlbmd0aCAtIDEpXG4gIH1cblxuICAvLyBOb3JtYWxpemUgYnl0ZU9mZnNldDogbmVnYXRpdmUgb2Zmc2V0cyBzdGFydCBmcm9tIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlclxuICBpZiAoYnl0ZU9mZnNldCA8IDApIGJ5dGVPZmZzZXQgPSBidWZmZXIubGVuZ3RoICsgYnl0ZU9mZnNldFxuICBpZiAoYnl0ZU9mZnNldCA+PSBidWZmZXIubGVuZ3RoKSB7XG4gICAgaWYgKGRpcikgcmV0dXJuIC0xXG4gICAgZWxzZSBieXRlT2Zmc2V0ID0gYnVmZmVyLmxlbmd0aCAtIDFcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgMCkge1xuICAgIGlmIChkaXIpIGJ5dGVPZmZzZXQgPSAwXG4gICAgZWxzZSByZXR1cm4gLTFcbiAgfVxuXG4gIC8vIE5vcm1hbGl6ZSB2YWxcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsID0gQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgfVxuXG4gIC8vIEZpbmFsbHksIHNlYXJjaCBlaXRoZXIgaW5kZXhPZiAoaWYgZGlyIGlzIHRydWUpIG9yIGxhc3RJbmRleE9mXG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsKSkge1xuICAgIC8vIFNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nL2J1ZmZlciBhbHdheXMgZmFpbHNcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIC0xXG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpXG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAweEZGIC8vIFNlYXJjaCBmb3IgYSBieXRlIHZhbHVlIFswLTI1NV1cbiAgICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGlmIChkaXIpIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKGJ1ZmZlciwgWyB2YWwgXSwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcilcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbCBtdXN0IGJlIHN0cmluZywgbnVtYmVyIG9yIEJ1ZmZlcicpXG59XG5cbmZ1bmN0aW9uIGFycmF5SW5kZXhPZiAoYXJyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpIHtcbiAgdmFyIGluZGV4U2l6ZSA9IDFcbiAgdmFyIGFyckxlbmd0aCA9IGFyci5sZW5ndGhcbiAgdmFyIHZhbExlbmd0aCA9IHZhbC5sZW5ndGhcblxuICBpZiAoZW5jb2RpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgaWYgKGVuY29kaW5nID09PSAndWNzMicgfHwgZW5jb2RpbmcgPT09ICd1Y3MtMicgfHxcbiAgICAgICAgZW5jb2RpbmcgPT09ICd1dGYxNmxlJyB8fCBlbmNvZGluZyA9PT0gJ3V0Zi0xNmxlJykge1xuICAgICAgaWYgKGFyci5sZW5ndGggPCAyIHx8IHZhbC5sZW5ndGggPCAyKSB7XG4gICAgICAgIHJldHVybiAtMVxuICAgICAgfVxuICAgICAgaW5kZXhTaXplID0gMlxuICAgICAgYXJyTGVuZ3RoIC89IDJcbiAgICAgIHZhbExlbmd0aCAvPSAyXG4gICAgICBieXRlT2Zmc2V0IC89IDJcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWFkIChidWYsIGkpIHtcbiAgICBpZiAoaW5kZXhTaXplID09PSAxKSB7XG4gICAgICByZXR1cm4gYnVmW2ldXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBidWYucmVhZFVJbnQxNkJFKGkgKiBpbmRleFNpemUpXG4gICAgfVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGRpcikge1xuICAgIHZhciBmb3VuZEluZGV4ID0gLTFcbiAgICBmb3IgKGkgPSBieXRlT2Zmc2V0OyBpIDwgYXJyTGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChyZWFkKGFyciwgaSkgPT09IHJlYWQodmFsLCBmb3VuZEluZGV4ID09PSAtMSA/IDAgOiBpIC0gZm91bmRJbmRleCkpIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggPT09IC0xKSBmb3VuZEluZGV4ID0gaVxuICAgICAgICBpZiAoaSAtIGZvdW5kSW5kZXggKyAxID09PSB2YWxMZW5ndGgpIHJldHVybiBmb3VuZEluZGV4ICogaW5kZXhTaXplXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZm91bmRJbmRleCAhPT0gLTEpIGkgLT0gaSAtIGZvdW5kSW5kZXhcbiAgICAgICAgZm91bmRJbmRleCA9IC0xXG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChieXRlT2Zmc2V0ICsgdmFsTGVuZ3RoID4gYXJyTGVuZ3RoKSBieXRlT2Zmc2V0ID0gYXJyTGVuZ3RoIC0gdmFsTGVuZ3RoXG4gICAgZm9yIChpID0gYnl0ZU9mZnNldDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHZhciBmb3VuZCA9IHRydWVcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsTGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKHJlYWQoYXJyLCBpICsgaikgIT09IHJlYWQodmFsLCBqKSkge1xuICAgICAgICAgIGZvdW5kID0gZmFsc2VcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoZm91bmQpIHJldHVybiBpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5jbHVkZXMgPSBmdW5jdGlvbiBpbmNsdWRlcyAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gdGhpcy5pbmRleE9mKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpICE9PSAtMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiBpbmRleE9mICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiBiaWRpcmVjdGlvbmFsSW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCB0cnVlKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmxhc3RJbmRleE9mID0gZnVuY3Rpb24gbGFzdEluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGJpZGlyZWN0aW9uYWxJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGZhbHNlKVxufVxuXG5mdW5jdGlvbiBoZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIHZhciBwYXJzZWQgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgaWYgKG51bWJlcklzTmFOKHBhcnNlZCkpIHJldHVybiBpXG4gICAgYnVmW29mZnNldCArIGldID0gcGFyc2VkXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gdXRmOFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBsYXRpbjFXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBhc2NpaVdyaXRlKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIHVjczJXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjE2bGVUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiB3cml0ZSAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZylcbiAgaWYgKG9mZnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBvZmZzZXRbLCBsZW5ndGhdWywgZW5jb2RpbmddKVxuICB9IGVsc2UgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgICBpZiAoaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgbGVuZ3RoID0gbGVuZ3RoID4+PiAwXG4gICAgICBpZiAoZW5jb2RpbmcgPT09IHVuZGVmaW5lZCkgZW5jb2RpbmcgPSAndXRmOCdcbiAgICB9IGVsc2Uge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnQnVmZmVyLndyaXRlKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldFssIGxlbmd0aF0pIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQnXG4gICAgKVxuICB9XG5cbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPiByZW1haW5pbmcpIGxlbmd0aCA9IHJlbWFpbmluZ1xuXG4gIGlmICgoc3RyaW5nLmxlbmd0aCA+IDAgJiYgKGxlbmd0aCA8IDAgfHwgb2Zmc2V0IDwgMCkpIHx8IG9mZnNldCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gd3JpdGUgb3V0c2lkZSBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGF0aW4xV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgLy8gV2FybmluZzogbWF4TGVuZ3RoIG5vdCB0YWtlbiBpbnRvIGFjY291bnQgaW4gYmFzZTY0V3JpdGVcbiAgICAgICAgcmV0dXJuIGJhc2U2NFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1Y3MyV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gdG9KU09OICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG5mdW5jdGlvbiBiYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gdXRmOFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuICB2YXIgcmVzID0gW11cblxuICB2YXIgaSA9IHN0YXJ0XG4gIHdoaWxlIChpIDwgZW5kKSB7XG4gICAgdmFyIGZpcnN0Qnl0ZSA9IGJ1ZltpXVxuICAgIHZhciBjb2RlUG9pbnQgPSBudWxsXG4gICAgdmFyIGJ5dGVzUGVyU2VxdWVuY2UgPSAoZmlyc3RCeXRlID4gMHhFRikgPyA0XG4gICAgICA6IChmaXJzdEJ5dGUgPiAweERGKSA/IDNcbiAgICAgICAgOiAoZmlyc3RCeXRlID4gMHhCRikgPyAyXG4gICAgICAgICAgOiAxXG5cbiAgICBpZiAoaSArIGJ5dGVzUGVyU2VxdWVuY2UgPD0gZW5kKSB7XG4gICAgICB2YXIgc2Vjb25kQnl0ZSwgdGhpcmRCeXRlLCBmb3VydGhCeXRlLCB0ZW1wQ29kZVBvaW50XG5cbiAgICAgIHN3aXRjaCAoYnl0ZXNQZXJTZXF1ZW5jZSkge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgaWYgKGZpcnN0Qnl0ZSA8IDB4ODApIHtcbiAgICAgICAgICAgIGNvZGVQb2ludCA9IGZpcnN0Qnl0ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweDFGKSA8PCAweDYgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0YpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHhDIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAodGhpcmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3RkYgJiYgKHRlbXBDb2RlUG9pbnQgPCAweEQ4MDAgfHwgdGVtcENvZGVQb2ludCA+IDB4REZGRikpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgZm91cnRoQnl0ZSA9IGJ1ZltpICsgM11cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKGZvdXJ0aEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4MTIgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4QyB8ICh0aGlyZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAoZm91cnRoQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4RkZGRiAmJiB0ZW1wQ29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29kZVBvaW50ID09PSBudWxsKSB7XG4gICAgICAvLyB3ZSBkaWQgbm90IGdlbmVyYXRlIGEgdmFsaWQgY29kZVBvaW50IHNvIGluc2VydCBhXG4gICAgICAvLyByZXBsYWNlbWVudCBjaGFyIChVK0ZGRkQpIGFuZCBhZHZhbmNlIG9ubHkgMSBieXRlXG4gICAgICBjb2RlUG9pbnQgPSAweEZGRkRcbiAgICAgIGJ5dGVzUGVyU2VxdWVuY2UgPSAxXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPiAweEZGRkYpIHtcbiAgICAgIC8vIGVuY29kZSB0byB1dGYxNiAoc3Vycm9nYXRlIHBhaXIgZGFuY2UpXG4gICAgICBjb2RlUG9pbnQgLT0gMHgxMDAwMFxuICAgICAgcmVzLnB1c2goY29kZVBvaW50ID4+PiAxMCAmIDB4M0ZGIHwgMHhEODAwKVxuICAgICAgY29kZVBvaW50ID0gMHhEQzAwIHwgY29kZVBvaW50ICYgMHgzRkZcbiAgICB9XG5cbiAgICByZXMucHVzaChjb2RlUG9pbnQpXG4gICAgaSArPSBieXRlc1BlclNlcXVlbmNlXG4gIH1cblxuICByZXR1cm4gZGVjb2RlQ29kZVBvaW50c0FycmF5KHJlcylcbn1cblxuLy8gQmFzZWQgb24gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjI3NDcyNzIvNjgwNzQyLCB0aGUgYnJvd3NlciB3aXRoXG4vLyB0aGUgbG93ZXN0IGxpbWl0IGlzIENocm9tZSwgd2l0aCAweDEwMDAwIGFyZ3MuXG4vLyBXZSBnbyAxIG1hZ25pdHVkZSBsZXNzLCBmb3Igc2FmZXR5XG52YXIgTUFYX0FSR1VNRU5UU19MRU5HVEggPSAweDEwMDBcblxuZnVuY3Rpb24gZGVjb2RlQ29kZVBvaW50c0FycmF5IChjb2RlUG9pbnRzKSB7XG4gIHZhciBsZW4gPSBjb2RlUG9pbnRzLmxlbmd0aFxuICBpZiAobGVuIDw9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjb2RlUG9pbnRzKSAvLyBhdm9pZCBleHRyYSBzbGljZSgpXG4gIH1cblxuICAvLyBEZWNvZGUgaW4gY2h1bmtzIHRvIGF2b2lkIFwiY2FsbCBzdGFjayBzaXplIGV4Y2VlZGVkXCIuXG4gIHZhciByZXMgPSAnJ1xuICB2YXIgaSA9IDBcbiAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShcbiAgICAgIFN0cmluZyxcbiAgICAgIGNvZGVQb2ludHMuc2xpY2UoaSwgaSArPSBNQVhfQVJHVU1FTlRTX0xFTkdUSClcbiAgICApXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSAmIDB4N0YpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBsYXRpbjFTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBoZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBieXRlcyA9IGJ1Zi5zbGljZShzdGFydCwgZW5kKVxuICB2YXIgcmVzID0gJydcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgKGJ5dGVzW2kgKyAxXSAqIDI1NikpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZiA9IHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZClcbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgbmV3QnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIG5ld0J1ZlxufVxuXG4vKlxuICogTmVlZCB0byBtYWtlIHN1cmUgdGhhdCBidWZmZXIgaXNuJ3QgdHJ5aW5nIHRvIHdyaXRlIG91dCBvZiBib3VuZHMuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrT2Zmc2V0IChvZmZzZXQsIGV4dCwgbGVuZ3RoKSB7XG4gIGlmICgob2Zmc2V0ICUgMSkgIT09IDAgfHwgb2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ29mZnNldCBpcyBub3QgdWludCcpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBsZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdUcnlpbmcgdG8gYWNjZXNzIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludExFID0gZnVuY3Rpb24gcmVhZFVJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRCRSA9IGZ1bmN0aW9uIHJlYWRVSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuICB9XG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXVxuICB2YXIgbXVsID0gMVxuICB3aGlsZSAoYnl0ZUxlbmd0aCA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQ4ID0gZnVuY3Rpb24gcmVhZFVJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkxFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiByZWFkVUludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDgpIHwgdGhpc1tvZmZzZXQgKyAxXVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKCh0aGlzW29mZnNldF0pIHxcbiAgICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSkgK1xuICAgICAgKHRoaXNbb2Zmc2V0ICsgM10gKiAweDEwMDAwMDApXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkJFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdICogMHgxMDAwMDAwKSArXG4gICAgKCh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgIHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludExFID0gZnVuY3Rpb24gcmVhZEludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRCRSA9IGZ1bmN0aW9uIHJlYWRJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGhcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1pXVxuICB3aGlsZSAoaSA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIHJlYWRJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICBpZiAoISh0aGlzW29mZnNldF0gJiAweDgwKSkgcmV0dXJuICh0aGlzW29mZnNldF0pXG4gIHJldHVybiAoKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gcmVhZEludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiByZWFkSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgMV0gfCAodGhpc1tvZmZzZXRdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdKSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10gPDwgMjQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiByZWFkSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCAyNCkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gcmVhZEZsb2F0TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdEJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCA1MiwgOClcbn1cblxuZnVuY3Rpb24gY2hlY2tJbnQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImJ1ZmZlclwiIGFyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXIgaW5zdGFuY2UnKVxuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCdcInZhbHVlXCIgYXJndW1lbnQgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlVUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbWF4Qnl0ZXMgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCkgLSAxXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbWF4Qnl0ZXMsIDApXG4gIH1cblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiB3cml0ZVVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHhmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludExFID0gZnVuY3Rpb24gd3JpdGVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCAoOCAqIGJ5dGVMZW5ndGgpIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSAwXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSAtIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgKDggKiBieXRlTGVuZ3RoKSAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICBpZiAodmFsdWUgPCAwICYmIHN1YiA9PT0gMCAmJiB0aGlzW29mZnNldCArIGkgKyAxXSAhPT0gMCkge1xuICAgICAgc3ViID0gMVxuICAgIH1cbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uIHdyaXRlSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4N2YsIC0weDgwKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbmZ1bmN0aW9uIGNoZWNrSUVFRTc1NCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5mdW5jdGlvbiB3cml0ZUZsb2F0IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA0LCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgOCwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbiAgcmV0dXJuIG9mZnNldCArIDhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUxFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiBjb3B5ICh0YXJnZXQsIHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKHRhcmdldCkpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2FyZ3VtZW50IHNob3VsZCBiZSBhIEJ1ZmZlcicpXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXRTdGFydCA+PSB0YXJnZXQubGVuZ3RoKSB0YXJnZXRTdGFydCA9IHRhcmdldC5sZW5ndGhcbiAgaWYgKCF0YXJnZXRTdGFydCkgdGFyZ2V0U3RhcnQgPSAwXG4gIGlmIChlbmQgPiAwICYmIGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuIDBcbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiAwXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBpZiAodGFyZ2V0U3RhcnQgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3RhcmdldFN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICB9XG4gIGlmIChzdGFydCA8IDAgfHwgc3RhcnQgPj0gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAoZW5kIDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgPCBlbmQgLSBzdGFydCkge1xuICAgIGVuZCA9IHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCArIHN0YXJ0XG4gIH1cblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHR5cGVvZiBVaW50OEFycmF5LnByb3RvdHlwZS5jb3B5V2l0aGluID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gVXNlIGJ1aWx0LWluIHdoZW4gYXZhaWxhYmxlLCBtaXNzaW5nIGZyb20gSUUxMVxuICAgIHRoaXMuY29weVdpdGhpbih0YXJnZXRTdGFydCwgc3RhcnQsIGVuZClcbiAgfSBlbHNlIGlmICh0aGlzID09PSB0YXJnZXQgJiYgc3RhcnQgPCB0YXJnZXRTdGFydCAmJiB0YXJnZXRTdGFydCA8IGVuZCkge1xuICAgIC8vIGRlc2NlbmRpbmcgY29weSBmcm9tIGVuZFxuICAgIGZvciAodmFyIGkgPSBsZW4gLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgVWludDhBcnJheS5wcm90b3R5cGUuc2V0LmNhbGwoXG4gICAgICB0YXJnZXQsXG4gICAgICB0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpLFxuICAgICAgdGFyZ2V0U3RhcnRcbiAgICApXG4gIH1cblxuICByZXR1cm4gbGVuXG59XG5cbi8vIFVzYWdlOlxuLy8gICAgYnVmZmVyLmZpbGwobnVtYmVyWywgb2Zmc2V0WywgZW5kXV0pXG4vLyAgICBidWZmZXIuZmlsbChidWZmZXJbLCBvZmZzZXRbLCBlbmRdXSlcbi8vICAgIGJ1ZmZlci5maWxsKHN0cmluZ1ssIG9mZnNldFssIGVuZF1dWywgZW5jb2RpbmddKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gZmlsbCAodmFsLCBzdGFydCwgZW5kLCBlbmNvZGluZykge1xuICAvLyBIYW5kbGUgc3RyaW5nIGNhc2VzOlxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAodHlwZW9mIHN0YXJ0ID09PSAnc3RyaW5nJykge1xuICAgICAgZW5jb2RpbmcgPSBzdGFydFxuICAgICAgc3RhcnQgPSAwXG4gICAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGVuZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGVuY29kaW5nID0gZW5kXG4gICAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICAgIH1cbiAgICBpZiAoZW5jb2RpbmcgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdlbmNvZGluZyBtdXN0IGJlIGEgc3RyaW5nJylcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBlbmNvZGluZyA9PT0gJ3N0cmluZycgJiYgIUJ1ZmZlci5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgIH1cbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMSkge1xuICAgICAgdmFyIGNvZGUgPSB2YWwuY2hhckNvZGVBdCgwKVxuICAgICAgaWYgKChlbmNvZGluZyA9PT0gJ3V0ZjgnICYmIGNvZGUgPCAxMjgpIHx8XG4gICAgICAgICAgZW5jb2RpbmcgPT09ICdsYXRpbjEnKSB7XG4gICAgICAgIC8vIEZhc3QgcGF0aDogSWYgYHZhbGAgZml0cyBpbnRvIGEgc2luZ2xlIGJ5dGUsIHVzZSB0aGF0IG51bWVyaWMgdmFsdWUuXG4gICAgICAgIHZhbCA9IGNvZGVcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAyNTVcbiAgfVxuXG4gIC8vIEludmFsaWQgcmFuZ2VzIGFyZSBub3Qgc2V0IHRvIGEgZGVmYXVsdCwgc28gY2FuIHJhbmdlIGNoZWNrIGVhcmx5LlxuICBpZiAoc3RhcnQgPCAwIHx8IHRoaXMubGVuZ3RoIDwgc3RhcnQgfHwgdGhpcy5sZW5ndGggPCBlbmQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignT3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgc3RhcnQgPSBzdGFydCA+Pj4gMFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IHRoaXMubGVuZ3RoIDogZW5kID4+PiAwXG5cbiAgaWYgKCF2YWwpIHZhbCA9IDBcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgICB0aGlzW2ldID0gdmFsXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBieXRlcyA9IEJ1ZmZlci5pc0J1ZmZlcih2YWwpXG4gICAgICA/IHZhbFxuICAgICAgOiBCdWZmZXIuZnJvbSh2YWwsIGVuY29kaW5nKVxuICAgIHZhciBsZW4gPSBieXRlcy5sZW5ndGhcbiAgICBpZiAobGVuID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgdmFsdWUgXCInICsgdmFsICtcbiAgICAgICAgJ1wiIGlzIGludmFsaWQgZm9yIGFyZ3VtZW50IFwidmFsdWVcIicpXG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBlbmQgLSBzdGFydDsgKytpKSB7XG4gICAgICB0aGlzW2kgKyBzdGFydF0gPSBieXRlc1tpICUgbGVuXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbi8vIEhFTFBFUiBGVU5DVElPTlNcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIElOVkFMSURfQkFTRTY0X1JFID0gL1teKy8wLTlBLVphLXotX10vZ1xuXG5mdW5jdGlvbiBiYXNlNjRjbGVhbiAoc3RyKSB7XG4gIC8vIE5vZGUgdGFrZXMgZXF1YWwgc2lnbnMgYXMgZW5kIG9mIHRoZSBCYXNlNjQgZW5jb2RpbmdcbiAgc3RyID0gc3RyLnNwbGl0KCc9JylbMF1cbiAgLy8gTm9kZSBzdHJpcHMgb3V0IGludmFsaWQgY2hhcmFjdGVycyBsaWtlIFxcbiBhbmQgXFx0IGZyb20gdGhlIHN0cmluZywgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHN0ciA9IHN0ci50cmltKCkucmVwbGFjZShJTlZBTElEX0JBU0U2NF9SRSwgJycpXG4gIC8vIE5vZGUgY29udmVydHMgc3RyaW5ncyB3aXRoIGxlbmd0aCA8IDIgdG8gJydcbiAgaWYgKHN0ci5sZW5ndGggPCAyKSByZXR1cm4gJydcbiAgLy8gTm9kZSBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgYmFzZTY0IHN0cmluZ3MgKG1pc3NpbmcgdHJhaWxpbmcgPT09KSwgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHdoaWxlIChzdHIubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgIHN0ciA9IHN0ciArICc9J1xuICB9XG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyaW5nLCB1bml0cykge1xuICB1bml0cyA9IHVuaXRzIHx8IEluZmluaXR5XG4gIHZhciBjb2RlUG9pbnRcbiAgdmFyIGxlbmd0aCA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIGxlYWRTdXJyb2dhdGUgPSBudWxsXG4gIHZhciBieXRlcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIGNvZGVQb2ludCA9IHN0cmluZy5jaGFyQ29kZUF0KGkpXG5cbiAgICAvLyBpcyBzdXJyb2dhdGUgY29tcG9uZW50XG4gICAgaWYgKGNvZGVQb2ludCA+IDB4RDdGRiAmJiBjb2RlUG9pbnQgPCAweEUwMDApIHtcbiAgICAgIC8vIGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoIWxlYWRTdXJyb2dhdGUpIHtcbiAgICAgICAgLy8gbm8gbGVhZCB5ZXRcbiAgICAgICAgaWYgKGNvZGVQb2ludCA+IDB4REJGRikge1xuICAgICAgICAgIC8vIHVuZXhwZWN0ZWQgdHJhaWxcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKGkgKyAxID09PSBsZW5ndGgpIHtcbiAgICAgICAgICAvLyB1bnBhaXJlZCBsZWFkXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhbGlkIGxlYWRcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIDIgbGVhZHMgaW4gYSByb3dcbiAgICAgIGlmIChjb2RlUG9pbnQgPCAweERDMDApIHtcbiAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gdmFsaWQgc3Vycm9nYXRlIHBhaXJcbiAgICAgIGNvZGVQb2ludCA9IChsZWFkU3Vycm9nYXRlIC0gMHhEODAwIDw8IDEwIHwgY29kZVBvaW50IC0gMHhEQzAwKSArIDB4MTAwMDBcbiAgICB9IGVsc2UgaWYgKGxlYWRTdXJyb2dhdGUpIHtcbiAgICAgIC8vIHZhbGlkIGJtcCBjaGFyLCBidXQgbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgIH1cblxuICAgIGxlYWRTdXJyb2dhdGUgPSBudWxsXG5cbiAgICAvLyBlbmNvZGUgdXRmOFxuICAgIGlmIChjb2RlUG9pbnQgPCAweDgwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDEpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goY29kZVBvaW50KVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHg4MDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiB8IDB4QzAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDMpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgfCAweEUwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSA0KSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHgxMiB8IDB4RjAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29kZSBwb2ludCcpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7ICsraSkge1xuICAgIC8vIE5vZGUncyBjb2RlIHNlZW1zIHRvIGJlIGRvaW5nIHRoaXMgYW5kIG5vdCAmIDB4N0YuLlxuICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpICYgMHhGRilcbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVUb0J5dGVzIChzdHIsIHVuaXRzKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG5cbiAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBoaSA9IGMgPj4gOFxuICAgIGxvID0gYyAlIDI1NlxuICAgIGJ5dGVBcnJheS5wdXNoKGxvKVxuICAgIGJ5dGVBcnJheS5wdXNoKGhpKVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBiYXNlNjRUb0J5dGVzIChzdHIpIHtcbiAgcmV0dXJuIGJhc2U2NC50b0J5dGVBcnJheShiYXNlNjRjbGVhbihzdHIpKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSkgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG4vLyBBcnJheUJ1ZmZlciBvciBVaW50OEFycmF5IG9iamVjdHMgZnJvbSBvdGhlciBjb250ZXh0cyAoaS5lLiBpZnJhbWVzKSBkbyBub3QgcGFzc1xuLy8gdGhlIGBpbnN0YW5jZW9mYCBjaGVjayBidXQgdGhleSBzaG91bGQgYmUgdHJlYXRlZCBhcyBvZiB0aGF0IHR5cGUuXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2lzc3Vlcy8xNjZcbmZ1bmN0aW9uIGlzSW5zdGFuY2UgKG9iaiwgdHlwZSkge1xuICByZXR1cm4gb2JqIGluc3RhbmNlb2YgdHlwZSB8fFxuICAgIChvYmogIT0gbnVsbCAmJiBvYmouY29uc3RydWN0b3IgIT0gbnVsbCAmJiBvYmouY29uc3RydWN0b3IubmFtZSAhPSBudWxsICYmXG4gICAgICBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gdHlwZS5uYW1lKVxufVxuZnVuY3Rpb24gbnVtYmVySXNOYU4gKG9iaikge1xuICAvLyBGb3IgSUUxMSBzdXBwb3J0XG4gIHJldHVybiBvYmogIT09IG9iaiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNlbGYtY29tcGFyZVxufVxuIiwiZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24gKGJ1ZmZlciwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG1cbiAgdmFyIGVMZW4gPSAobkJ5dGVzICogOCkgLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIG5CaXRzID0gLTdcbiAgdmFyIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMFxuICB2YXIgZCA9IGlzTEUgPyAtMSA6IDFcbiAgdmFyIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV1cblxuICBpICs9IGRcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBzID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBlTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSAoZSAqIDI1NikgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBtID0gZSAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBlID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBtTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IG0gPSAobSAqIDI1NikgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBpZiAoZSA9PT0gMCkge1xuICAgIGUgPSAxIC0gZUJpYXNcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpXG4gIH0gZWxzZSB7XG4gICAgbSA9IG0gKyBNYXRoLnBvdygyLCBtTGVuKVxuICAgIGUgPSBlIC0gZUJpYXNcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKVxufVxuXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24gKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLCBjXG4gIHZhciBlTGVuID0gKG5CeXRlcyAqIDgpIC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMClcbiAgdmFyIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKVxuICB2YXIgZCA9IGlzTEUgPyAxIDogLTFcbiAgdmFyIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDBcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKVxuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwXG4gICAgZSA9IGVNYXhcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMilcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS1cbiAgICAgIGMgKj0gMlxuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gY1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcylcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKytcbiAgICAgIGMgLz0gMlxuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDBcbiAgICAgIGUgPSBlTWF4XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICgodmFsdWUgKiBjKSAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSBlICsgZUJpYXNcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHZhbHVlICogTWF0aC5wb3coMiwgZUJpYXMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gMFxuICAgIH1cbiAgfVxuXG4gIGZvciAoOyBtTGVuID49IDg7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IG0gJiAweGZmLCBpICs9IGQsIG0gLz0gMjU2LCBtTGVuIC09IDgpIHt9XG5cbiAgZSA9IChlIDw8IG1MZW4pIHwgbVxuICBlTGVuICs9IG1MZW5cbiAgZm9yICg7IGVMZW4gPiAwOyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBlICYgMHhmZiwgaSArPSBkLCBlIC89IDI1NiwgZUxlbiAtPSA4KSB7fVxuXG4gIGJ1ZmZlcltvZmZzZXQgKyBpIC0gZF0gfD0gcyAqIDEyOFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXHJcblxyXG5Qcm9ibGVtIDE6IE11bHRpcGxlcyBvZiAzIGFuZCA1XHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbklmIHdlIGxpc3QgYWxsIHRoZSBuYXR1cmFsIG51bWJlcnMgYmVsb3cgMTAgdGhhdCBhcmUgbXVsdGlwbGVzIG9mIDMgb3IgNSwgd2UgZ2V0IDMsIDUsIDYgYW5kIDkuXHJcblRoZSBzdW0gb2YgdGhlc2UgbXVsdGlwbGVzIGlzIDIzLlxyXG5cclxuRmluZCB0aGUgc3VtIG9mIGFsbCB0aGUgbXVsdGlwbGVzIG9mIDMgb3IgNSBiZWxvdyAxMDAwLlxyXG5cclxuXCJcIlwiXHJcblxyXG5wcm9ibGVtLnRlc3QgPSAtPlxyXG4gIHN1bSA9IDBcclxuICBmb3IgaSBpbiBbMS4uLjEwXVxyXG4gICAgaWYgKGkgJSAzID09IDApIG9yIChpICUgNSA9PSAwKVxyXG4gICAgICBzdW0gKz0gaVxyXG4gIGVxdWFsKHN1bSwgMjMsIFwiU3VtIG9mIG5hdHVyYWwgbnVtYmVycyA8IDEwOiAje3N1bX1cIilcclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICBzdW0gPSAwXHJcbiAgZm9yIGkgaW4gWzEuLi4xMDAwXVxyXG4gICAgaWYgKGkgJSAzID09IDApIG9yIChpICUgNSA9PSAwKVxyXG4gICAgICBzdW0gKz0gaVxyXG5cclxuICByZXR1cm4gc3VtXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxyXG5cclxuUHJvYmxlbSAyOiBFdmVuIEZpYm9uYWNjaSBudW1iZXJzXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuRWFjaCBuZXcgdGVybSBpbiB0aGUgRmlib25hY2NpIHNlcXVlbmNlIGlzIGdlbmVyYXRlZCBieSBhZGRpbmcgdGhlIHByZXZpb3VzIHR3byB0ZXJtcy5cclxuQnkgc3RhcnRpbmcgd2l0aCAxIGFuZCAyLCB0aGUgZmlyc3QgMTAgdGVybXMgd2lsbCBiZTpcclxuXHJcbjEsIDIsIDMsIDUsIDgsIDEzLCAyMSwgMzQsIDU1LCA4OSwgLi4uXHJcblxyXG5CeSBjb25zaWRlcmluZyB0aGUgdGVybXMgaW4gdGhlIEZpYm9uYWNjaSBzZXF1ZW5jZSB3aG9zZSB2YWx1ZXMgZG8gbm90IGV4Y2VlZCBmb3VyIG1pbGxpb24sXHJcbmZpbmQgdGhlIHN1bSBvZiB0aGUgZXZlbi12YWx1ZWQgdGVybXMuXHJcblxyXG5cIlwiXCJcclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICBwcmV2ID0gMVxyXG4gIGN1cnIgPSAxXHJcbiAgc3VtID0gMFxyXG5cclxuICB3aGlsZSBjdXJyIDwgNDAwMDAwMFxyXG4gICAgaWYgKGN1cnIgJSAyKSA9PSAwXHJcbiAgICAgIHN1bSArPSBjdXJyXHJcblxyXG4gICAgbmV4dCA9IGN1cnIgKyBwcmV2XHJcbiAgICBwcmV2ID0gY3VyclxyXG4gICAgY3VyciA9IG5leHRcclxuXHJcbiAgcmV0dXJuIHN1bVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcclxuXHJcblByb2JsZW0gMzogTGFyZ2VzdCBwcmltZSBmYWN0b3JcclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuVGhlIHByaW1lIGZhY3RvcnMgb2YgMTMxOTUgYXJlIDUsIDcsIDEzIGFuZCAyOS5cclxuXHJcbldoYXQgaXMgdGhlIGxhcmdlc3QgcHJpbWUgZmFjdG9yIG9mIHRoZSBudW1iZXIgNjAwODUxNDc1MTQzID9cclxuXHJcblwiXCJcIlxyXG5cclxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4jIFNoYW1lbGVzc2x5IHBpbGZlcmVkL2Fkb3B0ZWQgZnJvbSBodHRwOi8vd3d3LmphdmFzY3JpcHRlci5uZXQvZmFxL251bWJlcmlzcHJpbWUuaHRtXHJcblxyXG5sZWFzdEZhY3RvciA9IChuKSAtPlxyXG4gIHJldHVybiBOYU4gaWYgaXNOYU4obikgb3Igbm90IGlzRmluaXRlKG4pXHJcbiAgcmV0dXJuIDAgaWYgbiA9PSAwXHJcbiAgcmV0dXJuIDEgaWYgKG4gJSAxKSAhPSAwIG9yIChuICogbikgPCAyXHJcbiAgcmV0dXJuIDIgaWYgKG4gJSAyKSA9PSAwXHJcbiAgcmV0dXJuIDMgaWYgKG4gJSAzKSA9PSAwXHJcbiAgcmV0dXJuIDUgaWYgKG4gJSA1KSA9PSAwXHJcblxyXG4gIG0gPSBNYXRoLnNxcnQgblxyXG4gIGZvciBpIGluIFs3Li5tXSBieSAzMFxyXG4gICAgcmV0dXJuIGkgICAgaWYgKG4gJSBpKSAgICAgID09IDBcclxuICAgIHJldHVybiBpKzQgIGlmIChuICUgKGkrNCkpICA9PSAwXHJcbiAgICByZXR1cm4gaSs2ICBpZiAobiAlIChpKzYpKSAgPT0gMFxyXG4gICAgcmV0dXJuIGkrMTAgaWYgKG4gJSAoaSsxMCkpID09IDBcclxuICAgIHJldHVybiBpKzEyIGlmIChuICUgKGkrMTIpKSA9PSAwXHJcbiAgICByZXR1cm4gaSsxNiBpZiAobiAlIChpKzE2KSkgPT0gMFxyXG4gICAgcmV0dXJuIGkrMjIgaWYgKG4gJSAoaSsyMikpID09IDBcclxuICAgIHJldHVybiBpKzI0IGlmIChuICUgKGkrMjQpKSA9PSAwXHJcblxyXG4gIHJldHVybiBuXHJcblxyXG5pc1ByaW1lID0gKG4pIC0+XHJcbiAgaWYgaXNOYU4obikgb3Igbm90IGlzRmluaXRlKG4pIG9yIChuICUgMSkgIT0gMCBvciAobiA8IDIpXHJcbiAgICByZXR1cm4gZmFsc2VcclxuICBpZiBuID09IGxlYXN0RmFjdG9yKG4pXHJcbiAgICByZXR1cm4gdHJ1ZVxyXG5cclxuICByZXR1cm4gZmFsc2VcclxuXHJcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbnByaW1lRmFjdG9ycyA9IChuKSAtPlxyXG4gIHJldHVybiBbMV0gaWYgbiA9PSAxXHJcblxyXG4gIGZhY3RvcnMgPSBbXVxyXG4gIHdoaWxlIG5vdCBpc1ByaW1lKG4pXHJcbiAgICBmYWN0b3IgPSBsZWFzdEZhY3RvcihuKVxyXG4gICAgZmFjdG9ycy5wdXNoIGZhY3RvclxyXG4gICAgbiAvPSBmYWN0b3JcclxuICBmYWN0b3JzLnB1c2ggblxyXG4gIHJldHVybiBmYWN0b3JzXHJcblxyXG5sYXJnZXN0UHJpbWVGYWN0b3IgPSAobikgLT5cclxuICByZXR1cm4gMSBpZiBuID09IDFcclxuXHJcbiAgd2hpbGUgbm90IGlzUHJpbWUobilcclxuICAgIGZhY3RvciA9IGxlYXN0RmFjdG9yKG4pXHJcbiAgICBuIC89IGZhY3RvclxyXG4gIHJldHVybiBuXHJcblxyXG5wcm9ibGVtLmFuc3dlciA9IC0+XHJcbiAgcmV0dXJuIGxhcmdlc3RQcmltZUZhY3Rvcig2MDA4NTE0NzUxNDMpXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxyXG5cclxuUHJvYmxlbSA0OiBMYXJnZXN0IHBhbGluZHJvbWUgcHJvZHVjdFxyXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5BIHBhbGluZHJvbWljIG51bWJlciByZWFkcyB0aGUgc2FtZSBib3RoIHdheXMuXHJcblxyXG5GaW5kIHRoZSBsYXJnZXN0IHBhbGluZHJvbWUgbWFkZSBmcm9tIHRoZSBwcm9kdWN0IG9mIHR3byAzLWRpZ2l0IG51bWJlcnMuXHJcblxyXG5cIlwiXCJcclxuXHJcbmlzUGFsaW5kcm9tZSA9IChuKSAtPlxyXG4gIHN0ciA9IG4udG9TdHJpbmcoKVxyXG4gIGZvciBpIGluIFswLi4uKHN0ci5sZW5ndGggLyAyKV1cclxuICAgIGlmIHN0cltpXSAhPSBzdHJbc3RyLmxlbmd0aCAtIDEgLSBpXVxyXG4gICAgICByZXR1cm4gZmFsc2VcclxuICByZXR1cm4gdHJ1ZVxyXG5cclxucHJvYmxlbS50ZXN0ID0gLT5cclxuICAjIE1ha2Ugc3VyZSBpc1BhbGluZHJvbWUgd29ya3MgcHJvcGVybHkgZmlyc3RcclxuICBmb3IgdiBpbiBbMSwgMTEsIDEyMSwgMTIyMSwgMTIzMjEsIDEyMzQzMjFdXHJcbiAgICBlcXVhbChpc1BhbGluZHJvbWUodiksIHRydWUsIFwiaXNQYWxpbmRyb21lKCN7dn0pIHJldHVybnMgdHJ1ZVwiKVxyXG4gIGZvciB2IGluIFsxMiwgMTIzLCAxMjM0LCAxMjM0NSwgMTIzNDU2LCAxMjMyNF1cclxuICAgIGVxdWFsKGlzUGFsaW5kcm9tZSh2KSwgZmFsc2UsIFwiaXNQYWxpbmRyb21lKCN7dn0pIHJldHVybnMgZmFsc2VcIilcclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICBsYXJnZXN0aSA9IDBcclxuICBsYXJnZXN0aiA9IDBcclxuICBsYXJnZXN0cCA9IDBcclxuXHJcbiAgZm9yIGkgaW4gWzEwMC4uOTk5XVxyXG4gICAgZm9yIGogaW4gWzEwMC4uOTk5XVxyXG4gICAgICBwcm9kdWN0ID0gaSAqIGpcclxuICAgICAgaWYgaXNQYWxpbmRyb21lKHByb2R1Y3QpIGFuZCAocHJvZHVjdCA+IGxhcmdlc3RwKVxyXG4gICAgICAgIGxhcmdlc3RpID0gaVxyXG4gICAgICAgIGxhcmdlc3RqID0galxyXG4gICAgICAgIGxhcmdlc3RwID0gcHJvZHVjdFxyXG5cclxuICByZXR1cm4gbGFyZ2VzdHBcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXHJcblxyXG5Qcm9ibGVtIDU6IFNtYWxsZXN0IG11bHRpcGxlXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbjI1MjAgaXMgdGhlIHNtYWxsZXN0IG51bWJlciB0aGF0IGNhbiBiZSBkaXZpZGVkIGJ5IGVhY2ggb2YgdGhlIG51bWJlcnMgZnJvbSAxIHRvIDEwIHdpdGhvdXQgYW55IHJlbWFpbmRlci5cclxuXHJcbldoYXQgaXMgdGhlIHNtYWxsZXN0IHBvc2l0aXZlIG51bWJlciB0aGF0IGlzIGV2ZW5seSBkaXZpc2libGUgYnkgYWxsIG9mIHRoZSBudW1iZXJzIGZyb20gMSB0byAyMD9cclxuXHJcblwiXCJcIlxyXG5cclxucHJvYmxlbS5hbnN3ZXIgPSAtPlxyXG4gIG4gPSAwXHJcbiAgbG9vcFxyXG4gICAgbiArPSAyMCAjIFByb2JhYmx5IGNvdWxkIGJlIHNvbWUgY2xldmVyIHN1bSBvZiBwcmltZXMgYmV0d2VlbiAxLTIwIG9yIHNvbWV0aGluZy4gSSBkb24ndCBjYXJlLlxyXG4gICAgZm91bmQgPSB0cnVlXHJcbiAgICBmb3IgaSBpbiBbMS4uMjBdXHJcbiAgICAgIGlmIChuICUgaSkgIT0gMFxyXG4gICAgICAgIGZvdW5kID0gZmFsc2VcclxuICAgICAgICBicmVha1xyXG5cclxuICAgIGJyZWFrIGlmIGZvdW5kXHJcblxyXG4gIHJldHVybiBuXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxyXG5cclxuUHJvYmxlbSA2OiBTdW0gc3F1YXJlIGRpZmZlcmVuY2VcclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblRoZSBzdW0gb2YgdGhlIHNxdWFyZXMgb2YgdGhlIGZpcnN0IHRlbiBuYXR1cmFsIG51bWJlcnMgaXMsXHJcblxyXG4gICAgICAgICAgICAgMV4yICsgMl4yICsgLi4uICsgMTBeMiA9IDM4NVxyXG5cclxuVGhlIHNxdWFyZSBvZiB0aGUgc3VtIG9mIHRoZSBmaXJzdCB0ZW4gbmF0dXJhbCBudW1iZXJzIGlzLFxyXG5cclxuICAgICAgICAgICgxICsgMiArIC4uLiArIDEwKV4yID0gNTVeMiA9IDMwMjVcclxuXHJcbkhlbmNlIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIHN1bSBvZiB0aGUgc3F1YXJlcyBvZiB0aGUgZmlyc3QgdGVuIG5hdHVyYWwgbnVtYmVycyBhbmQgdGhlIHNxdWFyZSBvZiB0aGUgc3VtIGlzIDMwMjUg4oiSIDM4NSA9IDI2NDAuXHJcblxyXG5GaW5kIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIHN1bSBvZiB0aGUgc3F1YXJlcyBvZiB0aGUgZmlyc3Qgb25lIGh1bmRyZWQgbmF0dXJhbCBudW1iZXJzIGFuZCB0aGUgc3F1YXJlIG9mIHRoZSBzdW0uXHJcblxyXG5cIlwiXCJcclxuXHJcbnN1bU9mU3F1YXJlcyA9IChuKSAtPlxyXG4gIHN1bSA9IDBcclxuICBmb3IgaSBpbiBbMS4ubl1cclxuICAgIHN1bSArPSAoaSAqIGkpXHJcbiAgcmV0dXJuIHN1bVxyXG5cclxuc3F1YXJlT2ZTdW0gPSAobikgLT5cclxuICBzdW0gPSAwXHJcbiAgZm9yIGkgaW4gWzEuLm5dXHJcbiAgICBzdW0gKz0gaVxyXG4gIHJldHVybiAoc3VtICogc3VtKVxyXG5cclxuZGlmZmVyZW5jZVN1bVNxdWFyZXMgPSAobikgLT5cclxuICByZXR1cm4gc3F1YXJlT2ZTdW0obikgLSBzdW1PZlNxdWFyZXMobilcclxuXHJcbnByb2JsZW0udGVzdCA9IC0+XHJcbiAgZXF1YWwoc3VtT2ZTcXVhcmVzKDEwKSwgMzg1LCBcIlN1bSBvZiBzcXVhcmVzIG9mIGZpcnN0IHRlbiBuYXR1cmFsIG51bWJlcnMgaXMgMzg1XCIpXHJcbiAgZXF1YWwoc3F1YXJlT2ZTdW0oMTApLCAzMDI1LCBcIlNxdWFyZSBvZiBzdW0gb2YgZmlyc3QgdGVuIG5hdHVyYWwgbnVtYmVycyBpcyAzMDI1XCIpXHJcbiAgZXF1YWwoZGlmZmVyZW5jZVN1bVNxdWFyZXMoMTApLCAyNjQwLCBcIkRpZmZlcmVuY2UgaW4gdmFsdWVzIGZvciB0aGUgZmlyc3QgdGVuIG5hdHVyYWwgbnVtYmVycyBpcyAyNjQwXCIpXHJcblxyXG5wcm9ibGVtLmFuc3dlciA9IC0+XHJcbiAgcmV0dXJuIGRpZmZlcmVuY2VTdW1TcXVhcmVzKDEwMClcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXHJcblxyXG5Qcm9ibGVtIDc6IDEwMDAxc3QgcHJpbWVcclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5CeSBsaXN0aW5nIHRoZSBmaXJzdCBzaXggcHJpbWUgbnVtYmVyczogMiwgMywgNSwgNywgMTEsIGFuZCAxMywgd2UgY2FuIHNlZSB0aGF0IHRoZSA2dGggcHJpbWUgaXMgMTMuXHJcblxyXG5XaGF0IGlzIHRoZSAxMCwwMDFzdCBwcmltZSBudW1iZXI/XHJcblxyXG5cIlwiXCJcclxuXHJcbm1hdGggPSByZXF1aXJlIFwibWF0aFwiXHJcblxyXG5udGhQcmltZSA9IChuKSAtPlxyXG4gIHNpZXZlID0gbmV3IG1hdGguSW5jcmVtZW50YWxTaWV2ZVxyXG4gIGZvciBpIGluIFsxLi4ubl1cclxuICAgIHNpZXZlLm5leHQoKVxyXG4gIHJldHVybiBzaWV2ZS5uZXh0KClcclxuXHJcbnByb2JsZW0udGVzdCA9IC0+XHJcbiAgZXF1YWwobnRoUHJpbWUoNiksIDEzLCBcIjZ0aCBwcmltZSBpcyAxM1wiKVxyXG5cclxucHJvYmxlbS5hbnN3ZXIgPSAtPlxyXG4gIHJldHVybiBudGhQcmltZSgxMDAwMSlcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXHJcblxyXG5Qcm9ibGVtIDg6IExhcmdlc3QgcHJvZHVjdCBpbiBhIHNlcmllc1xyXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuVGhlIGZvdXIgYWRqYWNlbnQgZGlnaXRzIGluIHRoZSAxMDAwLWRpZ2l0IG51bWJlciB0aGF0IGhhdmUgdGhlIGdyZWF0ZXN0IHByb2R1Y3QgYXJlIDkgeCA5IHggOCB4IDkgPSA1ODMyLlxyXG5cclxuICA3MzE2NzE3NjUzMTMzMDYyNDkxOTIyNTExOTY3NDQyNjU3NDc0MjM1NTM0OTE5NDkzNFxyXG4gIDk2OTgzNTIwMzEyNzc0NTA2MzI2MjM5NTc4MzE4MDE2OTg0ODAxODY5NDc4ODUxODQzXHJcbiAgODU4NjE1NjA3ODkxMTI5NDk0OTU0NTk1MDE3Mzc5NTgzMzE5NTI4NTMyMDg4MDU1MTFcclxuICAxMjU0MDY5ODc0NzE1ODUyMzg2MzA1MDcxNTY5MzI5MDk2MzI5NTIyNzQ0MzA0MzU1N1xyXG4gIDY2ODk2NjQ4OTUwNDQ1MjQ0NTIzMTYxNzMxODU2NDAzMDk4NzExMTIxNzIyMzgzMTEzXHJcbiAgNjIyMjk4OTM0MjMzODAzMDgxMzUzMzYyNzY2MTQyODI4MDY0NDQ0ODY2NDUyMzg3NDlcclxuICAzMDM1ODkwNzI5NjI5MDQ5MTU2MDQ0MDc3MjM5MDcxMzgxMDUxNTg1OTMwNzk2MDg2NlxyXG4gIDcwMTcyNDI3MTIxODgzOTk4Nzk3OTA4NzkyMjc0OTIxOTAxNjk5NzIwODg4MDkzNzc2XHJcbiAgNjU3MjczMzMwMDEwNTMzNjc4ODEyMjAyMzU0MjE4MDk3NTEyNTQ1NDA1OTQ3NTIyNDNcclxuICA1MjU4NDkwNzcxMTY3MDU1NjAxMzYwNDgzOTU4NjQ0NjcwNjMyNDQxNTcyMjE1NTM5N1xyXG4gIDUzNjk3ODE3OTc3ODQ2MTc0MDY0OTU1MTQ5MjkwODYyNTY5MzIxOTc4NDY4NjIyNDgyXHJcbiAgODM5NzIyNDEzNzU2NTcwNTYwNTc0OTAyNjE0MDc5NzI5Njg2NTI0MTQ1MzUxMDA0NzRcclxuICA4MjE2NjM3MDQ4NDQwMzE5OTg5MDAwODg5NTI0MzQ1MDY1ODU0MTIyNzU4ODY2Njg4MVxyXG4gIDE2NDI3MTcxNDc5OTI0NDQyOTI4MjMwODYzNDY1Njc0ODEzOTE5MTIzMTYyODI0NTg2XHJcbiAgMTc4NjY0NTgzNTkxMjQ1NjY1Mjk0NzY1NDU2ODI4NDg5MTI4ODMxNDI2MDc2OTAwNDJcclxuICAyNDIxOTAyMjY3MTA1NTYyNjMyMTExMTEwOTM3MDU0NDIxNzUwNjk0MTY1ODk2MDQwOFxyXG4gIDA3MTk4NDAzODUwOTYyNDU1NDQ0MzYyOTgxMjMwOTg3ODc5OTI3MjQ0Mjg0OTA5MTg4XHJcbiAgODQ1ODAxNTYxNjYwOTc5MTkxMzM4NzU0OTkyMDA1MjQwNjM2ODk5MTI1NjA3MTc2MDZcclxuICAwNTg4NjExNjQ2NzEwOTQwNTA3NzU0MTAwMjI1Njk4MzE1NTIwMDA1NTkzNTcyOTcyNVxyXG4gIDcxNjM2MjY5NTYxODgyNjcwNDI4MjUyNDgzNjAwODIzMjU3NTMwNDIwNzUyOTYzNDUwXHJcblxyXG5GaW5kIHRoZSB0aGlydGVlbiBhZGphY2VudCBkaWdpdHMgaW4gdGhlIDEwMDAtZGlnaXQgbnVtYmVyIHRoYXQgaGF2ZSB0aGUgZ3JlYXRlc3QgcHJvZHVjdC4gV2hhdCBpcyB0aGUgdmFsdWUgb2YgdGhpcyBwcm9kdWN0P1xyXG5cclxuXCJcIlwiXHJcblxyXG5zdHIgPSBcIlwiXCJcclxuICAgICAgNzMxNjcxNzY1MzEzMzA2MjQ5MTkyMjUxMTk2NzQ0MjY1NzQ3NDIzNTUzNDkxOTQ5MzRcclxuICAgICAgOTY5ODM1MjAzMTI3NzQ1MDYzMjYyMzk1NzgzMTgwMTY5ODQ4MDE4Njk0Nzg4NTE4NDNcclxuICAgICAgODU4NjE1NjA3ODkxMTI5NDk0OTU0NTk1MDE3Mzc5NTgzMzE5NTI4NTMyMDg4MDU1MTFcclxuICAgICAgMTI1NDA2OTg3NDcxNTg1MjM4NjMwNTA3MTU2OTMyOTA5NjMyOTUyMjc0NDMwNDM1NTdcclxuICAgICAgNjY4OTY2NDg5NTA0NDUyNDQ1MjMxNjE3MzE4NTY0MDMwOTg3MTExMjE3MjIzODMxMTNcclxuICAgICAgNjIyMjk4OTM0MjMzODAzMDgxMzUzMzYyNzY2MTQyODI4MDY0NDQ0ODY2NDUyMzg3NDlcclxuICAgICAgMzAzNTg5MDcyOTYyOTA0OTE1NjA0NDA3NzIzOTA3MTM4MTA1MTU4NTkzMDc5NjA4NjZcclxuICAgICAgNzAxNzI0MjcxMjE4ODM5OTg3OTc5MDg3OTIyNzQ5MjE5MDE2OTk3MjA4ODgwOTM3NzZcclxuICAgICAgNjU3MjczMzMwMDEwNTMzNjc4ODEyMjAyMzU0MjE4MDk3NTEyNTQ1NDA1OTQ3NTIyNDNcclxuICAgICAgNTI1ODQ5MDc3MTE2NzA1NTYwMTM2MDQ4Mzk1ODY0NDY3MDYzMjQ0MTU3MjIxNTUzOTdcclxuICAgICAgNTM2OTc4MTc5Nzc4NDYxNzQwNjQ5NTUxNDkyOTA4NjI1NjkzMjE5Nzg0Njg2MjI0ODJcclxuICAgICAgODM5NzIyNDEzNzU2NTcwNTYwNTc0OTAyNjE0MDc5NzI5Njg2NTI0MTQ1MzUxMDA0NzRcclxuICAgICAgODIxNjYzNzA0ODQ0MDMxOTk4OTAwMDg4OTUyNDM0NTA2NTg1NDEyMjc1ODg2NjY4ODFcclxuICAgICAgMTY0MjcxNzE0Nzk5MjQ0NDI5MjgyMzA4NjM0NjU2NzQ4MTM5MTkxMjMxNjI4MjQ1ODZcclxuICAgICAgMTc4NjY0NTgzNTkxMjQ1NjY1Mjk0NzY1NDU2ODI4NDg5MTI4ODMxNDI2MDc2OTAwNDJcclxuICAgICAgMjQyMTkwMjI2NzEwNTU2MjYzMjExMTExMDkzNzA1NDQyMTc1MDY5NDE2NTg5NjA0MDhcclxuICAgICAgMDcxOTg0MDM4NTA5NjI0NTU0NDQzNjI5ODEyMzA5ODc4Nzk5MjcyNDQyODQ5MDkxODhcclxuICAgICAgODQ1ODAxNTYxNjYwOTc5MTkxMzM4NzU0OTkyMDA1MjQwNjM2ODk5MTI1NjA3MTc2MDZcclxuICAgICAgMDU4ODYxMTY0NjcxMDk0MDUwNzc1NDEwMDIyNTY5ODMxNTUyMDAwNTU5MzU3Mjk3MjVcclxuICAgICAgNzE2MzYyNjk1NjE4ODI2NzA0MjgyNTI0ODM2MDA4MjMyNTc1MzA0MjA3NTI5NjM0NTBcclxuICAgICAgXCJcIlwiXHJcbnN0ciA9IHN0ci5yZXBsYWNlKC9bXjAtOV0vZ20sIFwiXCIpXHJcbmRpZ2l0cyA9IChwYXJzZUludChkaWdpdCkgZm9yIGRpZ2l0IGluIHN0cilcclxuXHJcbmxhcmdlc3RQcm9kdWN0ID0gKGRpZ2l0Q291bnQpIC0+XHJcbiAgcmV0dXJuIDAgaWYgZGlnaXRDb3VudCA+IGRpZ2l0cy5sZW5ndGhcclxuXHJcbiAgbGFyZ2VzdCA9IDBcclxuICBmb3Igc3RhcnQgaW4gWzAuLihkaWdpdHMubGVuZ3RoIC0gZGlnaXRDb3VudCldXHJcbiAgICBlbmQgPSBzdGFydCArIGRpZ2l0Q291bnRcclxuICAgIHByb2R1Y3QgPSAxXHJcbiAgICBmb3IgaSBpbiBbc3RhcnQuLi5lbmRdXHJcbiAgICAgIHByb2R1Y3QgKj0gZGlnaXRzW2ldXHJcbiAgICBpZiBsYXJnZXN0IDwgcHJvZHVjdFxyXG4gICAgICBsYXJnZXN0ID0gcHJvZHVjdFxyXG5cclxuICByZXR1cm4gbGFyZ2VzdFxyXG5cclxucHJvYmxlbS50ZXN0ID0gLT5cclxuICBlcXVhbChsYXJnZXN0UHJvZHVjdCg0KSwgNTgzMiwgIFwiR3JlYXRlc3QgcHJvZHVjdCBvZiA0IGFkamFjZW50IGRpZ2l0cyBpcyA1ODMyXCIpXHJcbiAgZXF1YWwobGFyZ2VzdFByb2R1Y3QoNSksIDQwODI0LCBcIkdyZWF0ZXN0IHByb2R1Y3Qgb2YgNSBhZGphY2VudCBkaWdpdHMgaXMgNDA4MjRcIilcclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICByZXR1cm4gbGFyZ2VzdFByb2R1Y3QoMTMpXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxyXG5cclxuUHJvYmxlbSA5OiBTcGVjaWFsIFB5dGhhZ29yZWFuIHRyaXBsZXRcclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbkEgUHl0aGFnb3JlYW4gdHJpcGxldCBpcyBhIHNldCBvZiB0aHJlZSBuYXR1cmFsIG51bWJlcnMsIGEgPCBiIDwgYywgZm9yIHdoaWNoLFxyXG5cclxuICAgIGFeMiArIGJeMiA9IGNeMlxyXG5cclxuRm9yIGV4YW1wbGUsIDNeMiArIDReMiA9IDkgKyAxNiA9IDI1ID0gNV4yLlxyXG5cclxuVGhlcmUgZXhpc3RzIGV4YWN0bHkgb25lIFB5dGhhZ29yZWFuIHRyaXBsZXQgZm9yIHdoaWNoIGEgKyBiICsgYyA9IDEwMDAuXHJcblxyXG5GaW5kIHRoZSBwcm9kdWN0IGFiYy5cclxuXHJcblwiXCJcIlxyXG5cclxuaXNUcmlwbGV0ID0gKGEsIGIsIGMpIC0+XHJcbiAgcmV0dXJuICgoYSphKSArIChiKmIpKSA9PSAoYypjKVxyXG5cclxuZmluZEZpcnN0VHJpcGxldCA9IChzdW0pIC0+XHJcbiAgZm9yIGEgaW4gWzEuLi4xMDAwXVxyXG4gICAgZm9yIGIgaW4gWzEuLi4xMDAwXVxyXG4gICAgICBjID0gMTAwMCAtIGEgLSBiXHJcbiAgICAgIGlmIGlzVHJpcGxldChhLCBiLCBjKVxyXG4gICAgICAgIHJldHVybiBbYSwgYiwgY11cclxuXHJcbiAgcmV0dXJuIGZhbHNlXHJcblxyXG5cclxucHJvYmxlbS50ZXN0ID0gLT5cclxuICBlcXVhbChpc1RyaXBsZXQoMywgNCwgNSksIHRydWUsIFwiKDMsNCw1KSBpcyBhIFB5dGhhZ29yZWFuIHRyaXBsZXRcIilcclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICByZXR1cm4gZmluZEZpcnN0VHJpcGxldCgxMDAwKVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcclxuXHJcblByb2JsZW0gMTA6IFN1bW1hdGlvbiBvZiBwcmltZXNcclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuVGhlIHN1bSBvZiB0aGUgcHJpbWVzIGJlbG93IDEwIGlzIDIgKyAzICsgNSArIDcgPSAxNy5cclxuXHJcbkZpbmQgdGhlIHN1bSBvZiBhbGwgdGhlIHByaW1lcyBiZWxvdyB0d28gbWlsbGlvbi5cclxuXHJcblwiXCJcIlxyXG5cclxubWF0aCA9IHJlcXVpcmUgXCJtYXRoXCJcclxuXHJcbnByaW1lU3VtID0gKGNlaWxpbmcpIC0+XHJcbiAgc2lldmUgPSBuZXcgbWF0aC5JbmNyZW1lbnRhbFNpZXZlXHJcblxyXG4gIHN1bSA9IDBcclxuICBsb29wXHJcbiAgICBuID0gc2lldmUubmV4dCgpXHJcbiAgICBpZiBuID49IGNlaWxpbmdcclxuICAgICAgYnJlYWtcclxuICAgIHN1bSArPSBuXHJcblxyXG4gIHJldHVybiBzdW1cclxuXHJcbnByb2JsZW0udGVzdCA9IC0+XHJcbiAgZXF1YWwocHJpbWVTdW0oMTApLCAxNywgXCJTdW0gb2YgcHJpbWVzIGJlbG93IDEwIGlzIDE3XCIpXHJcblxyXG5wcm9ibGVtLmFuc3dlciA9IC0+XHJcbiAgcmV0dXJuIHByaW1lU3VtKDIwMDAwMDApXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxyXG5cclxuUHJvYmxlbSAxMTogTGFyZ2VzdCBwcm9kdWN0IGluIGEgZ3JpZFxyXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5JbiB0aGUgMjB4MjAgZ3JpZCBiZWxvdywgZm91ciBudW1iZXJzIGFsb25nIGEgZGlhZ29uYWwgbGluZSBoYXZlIGJlZW4gbWFya2VkIGluIHJlZC5cclxuXHJcbiAgICAgICAgICAwOCAwMiAyMiA5NyAzOCAxNSAwMCA0MCAwMCA3NSAwNCAwNSAwNyA3OCA1MiAxMiA1MCA3NyA5MSAwOFxyXG4gICAgICAgICAgNDkgNDkgOTkgNDAgMTcgODEgMTggNTcgNjAgODcgMTcgNDAgOTggNDMgNjkgNDggMDQgNTYgNjIgMDBcclxuICAgICAgICAgIDgxIDQ5IDMxIDczIDU1IDc5IDE0IDI5IDkzIDcxIDQwIDY3IDUzIDg4IDMwIDAzIDQ5IDEzIDM2IDY1XHJcbiAgICAgICAgICA1MiA3MCA5NSAyMyAwNCA2MCAxMSA0MiA2OSAyNCA2OCA1NiAwMSAzMiA1NiA3MSAzNyAwMiAzNiA5MVxyXG4gICAgICAgICAgMjIgMzEgMTYgNzEgNTEgNjcgNjMgODkgNDEgOTIgMzYgNTQgMjIgNDAgNDAgMjggNjYgMzMgMTMgODBcclxuICAgICAgICAgIDI0IDQ3IDMyIDYwIDk5IDAzIDQ1IDAyIDQ0IDc1IDMzIDUzIDc4IDM2IDg0IDIwIDM1IDE3IDEyIDUwXHJcbiAgICAgICAgICAzMiA5OCA4MSAyOCA2NCAyMyA2NyAxMCAyNl8zOCA0MCA2NyA1OSA1NCA3MCA2NiAxOCAzOCA2NCA3MFxyXG4gICAgICAgICAgNjcgMjYgMjAgNjggMDIgNjIgMTIgMjAgOTUgNjNfOTQgMzkgNjMgMDggNDAgOTEgNjYgNDkgOTQgMjFcclxuICAgICAgICAgIDI0IDU1IDU4IDA1IDY2IDczIDk5IDI2IDk3IDE3IDc4Xzc4IDk2IDgzIDE0IDg4IDM0IDg5IDYzIDcyXHJcbiAgICAgICAgICAyMSAzNiAyMyAwOSA3NSAwMCA3NiA0NCAyMCA0NSAzNSAxNCAwMCA2MSAzMyA5NyAzNCAzMSAzMyA5NVxyXG4gICAgICAgICAgNzggMTcgNTMgMjggMjIgNzUgMzEgNjcgMTUgOTQgMDMgODAgMDQgNjIgMTYgMTQgMDkgNTMgNTYgOTJcclxuICAgICAgICAgIDE2IDM5IDA1IDQyIDk2IDM1IDMxIDQ3IDU1IDU4IDg4IDI0IDAwIDE3IDU0IDI0IDM2IDI5IDg1IDU3XHJcbiAgICAgICAgICA4NiA1NiAwMCA0OCAzNSA3MSA4OSAwNyAwNSA0NCA0NCAzNyA0NCA2MCAyMSA1OCA1MSA1NCAxNyA1OFxyXG4gICAgICAgICAgMTkgODAgODEgNjggMDUgOTQgNDcgNjkgMjggNzMgOTIgMTMgODYgNTIgMTcgNzcgMDQgODkgNTUgNDBcclxuICAgICAgICAgIDA0IDUyIDA4IDgzIDk3IDM1IDk5IDE2IDA3IDk3IDU3IDMyIDE2IDI2IDI2IDc5IDMzIDI3IDk4IDY2XHJcbiAgICAgICAgICA4OCAzNiA2OCA4NyA1NyA2MiAyMCA3MiAwMyA0NiAzMyA2NyA0NiA1NSAxMiAzMiA2MyA5MyA1MyA2OVxyXG4gICAgICAgICAgMDQgNDIgMTYgNzMgMzggMjUgMzkgMTEgMjQgOTQgNzIgMTggMDggNDYgMjkgMzIgNDAgNjIgNzYgMzZcclxuICAgICAgICAgIDIwIDY5IDM2IDQxIDcyIDMwIDIzIDg4IDM0IDYyIDk5IDY5IDgyIDY3IDU5IDg1IDc0IDA0IDM2IDE2XHJcbiAgICAgICAgICAyMCA3MyAzNSAyOSA3OCAzMSA5MCAwMSA3NCAzMSA0OSA3MSA0OCA4NiA4MSAxNiAyMyA1NyAwNSA1NFxyXG4gICAgICAgICAgMDEgNzAgNTQgNzEgODMgNTEgNTQgNjkgMTYgOTIgMzMgNDggNjEgNDMgNTIgMDEgODkgMTkgNjcgNDhcclxuXHJcblRoZSBwcm9kdWN0IG9mIHRoZXNlIG51bWJlcnMgaXMgMjYgeCA2MyB4IDc4IHggMTQgPSAxNzg4Njk2LlxyXG5cclxuV2hhdCBpcyB0aGUgZ3JlYXRlc3QgcHJvZHVjdCBvZiBmb3VyIGFkamFjZW50IG51bWJlcnMgaW4gdGhlIHNhbWUgZGlyZWN0aW9uICh1cCwgZG93biwgbGVmdCwgcmlnaHQsIG9yIGRpYWdvbmFsbHkpIGluIHRoZSAyMHgyMCBncmlkP1xyXG5cclxuXCJcIlwiXHJcblxyXG5ncmlkID0gbnVsbFxyXG5cclxucHJlcGFyZUdyaWQgPSAtPlxyXG4gIHJhd0RpZ2l0cyA9IFwiXCJcIlxyXG4gICAgMDggMDIgMjIgOTcgMzggMTUgMDAgNDAgMDAgNzUgMDQgMDUgMDcgNzggNTIgMTIgNTAgNzcgOTEgMDhcclxuICAgIDQ5IDQ5IDk5IDQwIDE3IDgxIDE4IDU3IDYwIDg3IDE3IDQwIDk4IDQzIDY5IDQ4IDA0IDU2IDYyIDAwXHJcbiAgICA4MSA0OSAzMSA3MyA1NSA3OSAxNCAyOSA5MyA3MSA0MCA2NyA1MyA4OCAzMCAwMyA0OSAxMyAzNiA2NVxyXG4gICAgNTIgNzAgOTUgMjMgMDQgNjAgMTEgNDIgNjkgMjQgNjggNTYgMDEgMzIgNTYgNzEgMzcgMDIgMzYgOTFcclxuICAgIDIyIDMxIDE2IDcxIDUxIDY3IDYzIDg5IDQxIDkyIDM2IDU0IDIyIDQwIDQwIDI4IDY2IDMzIDEzIDgwXHJcbiAgICAyNCA0NyAzMiA2MCA5OSAwMyA0NSAwMiA0NCA3NSAzMyA1MyA3OCAzNiA4NCAyMCAzNSAxNyAxMiA1MFxyXG4gICAgMzIgOTggODEgMjggNjQgMjMgNjcgMTAgMjYgMzggNDAgNjcgNTkgNTQgNzAgNjYgMTggMzggNjQgNzBcclxuICAgIDY3IDI2IDIwIDY4IDAyIDYyIDEyIDIwIDk1IDYzIDk0IDM5IDYzIDA4IDQwIDkxIDY2IDQ5IDk0IDIxXHJcbiAgICAyNCA1NSA1OCAwNSA2NiA3MyA5OSAyNiA5NyAxNyA3OCA3OCA5NiA4MyAxNCA4OCAzNCA4OSA2MyA3MlxyXG4gICAgMjEgMzYgMjMgMDkgNzUgMDAgNzYgNDQgMjAgNDUgMzUgMTQgMDAgNjEgMzMgOTcgMzQgMzEgMzMgOTVcclxuICAgIDc4IDE3IDUzIDI4IDIyIDc1IDMxIDY3IDE1IDk0IDAzIDgwIDA0IDYyIDE2IDE0IDA5IDUzIDU2IDkyXHJcbiAgICAxNiAzOSAwNSA0MiA5NiAzNSAzMSA0NyA1NSA1OCA4OCAyNCAwMCAxNyA1NCAyNCAzNiAyOSA4NSA1N1xyXG4gICAgODYgNTYgMDAgNDggMzUgNzEgODkgMDcgMDUgNDQgNDQgMzcgNDQgNjAgMjEgNTggNTEgNTQgMTcgNThcclxuICAgIDE5IDgwIDgxIDY4IDA1IDk0IDQ3IDY5IDI4IDczIDkyIDEzIDg2IDUyIDE3IDc3IDA0IDg5IDU1IDQwXHJcbiAgICAwNCA1MiAwOCA4MyA5NyAzNSA5OSAxNiAwNyA5NyA1NyAzMiAxNiAyNiAyNiA3OSAzMyAyNyA5OCA2NlxyXG4gICAgODggMzYgNjggODcgNTcgNjIgMjAgNzIgMDMgNDYgMzMgNjcgNDYgNTUgMTIgMzIgNjMgOTMgNTMgNjlcclxuICAgIDA0IDQyIDE2IDczIDM4IDI1IDM5IDExIDI0IDk0IDcyIDE4IDA4IDQ2IDI5IDMyIDQwIDYyIDc2IDM2XHJcbiAgICAyMCA2OSAzNiA0MSA3MiAzMCAyMyA4OCAzNCA2MiA5OSA2OSA4MiA2NyA1OSA4NSA3NCAwNCAzNiAxNlxyXG4gICAgMjAgNzMgMzUgMjkgNzggMzEgOTAgMDEgNzQgMzEgNDkgNzEgNDggODYgODEgMTYgMjMgNTcgMDUgNTRcclxuICAgIDAxIDcwIDU0IDcxIDgzIDUxIDU0IDY5IDE2IDkyIDMzIDQ4IDYxIDQzIDUyIDAxIDg5IDE5IDY3IDQ4XHJcbiAgXCJcIlwiLnJlcGxhY2UoL1teMC05IF0vZ20sIFwiIFwiKVxyXG5cclxuICBkaWdpdHMgPSAocGFyc2VJbnQoZGlnaXQpIGZvciBkaWdpdCBpbiByYXdEaWdpdHMuc3BsaXQoXCIgXCIpKVxyXG4gIGdyaWQgPSBBcnJheSgyMClcclxuICBmb3IgaSBpbiBbMC4uLjIwXVxyXG4gICAgZ3JpZFtpXSA9IEFycmF5KDIwKVxyXG5cclxuICBpbmRleCA9IDBcclxuICBmb3IgaiBpbiBbMC4uLjIwXVxyXG4gICAgZm9yIGkgaW4gWzAuLi4yMF1cclxuICAgICAgZ3JpZFtpXVtqXSA9IGRpZ2l0c1tpbmRleF1cclxuICAgICAgaW5kZXgrK1xyXG5cclxucHJlcGFyZUdyaWQoKVxyXG5cclxuIyBHZXRzIGEgcHJvZHVjdCBvZiA0IHZhbHVlcyBzdGFydGluZyBhdCAoc3gsIHN5KSwgaGVhZGluZyBpbiB0aGUgZGlyZWN0aW9uIChkeCwgZHkpXHJcbiMgUmV0dXJucyAtMSBpZiB0aGVyZSBpcyBubyByb29tIHRvIG1ha2UgYSBzdHJpcGUgb2YgNC5cclxuZ2V0TGluZVByb2R1Y3QgPSAoc3gsIHN5LCBkeCwgZHkpIC0+XHJcbiAgZXggPSBzeCArICg0ICogZHgpXHJcbiAgcmV0dXJuIC0xIGlmIChleCA8IDApIG9yIChleCA+PSAyMClcclxuICBleSA9IHN5ICsgKDQgKiBkeSlcclxuICByZXR1cm4gLTEgaWYgKGV5IDwgMCkgb3IgKGV5ID49IDIwKVxyXG5cclxuICB4ID0gc3hcclxuICB5ID0gc3lcclxuICBwcm9kdWN0ID0gMVxyXG4gIGZvciBpIGluIFswLi4uNF1cclxuICAgIHByb2R1Y3QgKj0gZ3JpZFt4XVt5XVxyXG4gICAgeCArPSBkeFxyXG4gICAgeSArPSBkeVxyXG5cclxuICByZXR1cm4gcHJvZHVjdFxyXG5cclxuZ2V0TGluZSA9IChzeCwgc3ksIGR4LCBkeSkgLT5cclxuICBleCA9IHN4ICsgKDQgKiBkeClcclxuICByZXR1cm4gW10gaWYgKGV4IDwgMCkgb3IgKGV4ID49IDIwKVxyXG4gIGV5ID0gc3kgKyAoNCAqIGR5KVxyXG4gIHJldHVybiBbXSBpZiAoZXkgPCAwKSBvciAoZXkgPj0gMjApXHJcblxyXG4gIGxpbmUgPSBbXVxyXG5cclxuICB4ID0gc3hcclxuICB5ID0gc3lcclxuICBmb3IgaSBpbiBbMC4uLjRdXHJcbiAgICBsaW5lLnB1c2ggZ3JpZFt4XVt5XVxyXG4gICAgeCArPSBkeFxyXG4gICAgeSArPSBkeVxyXG5cclxuICByZXR1cm4gbGluZVxyXG5cclxucHJvYmxlbS50ZXN0ID0gLT5cclxuICAjIEV4YW1wbGUgaXMgZGlhZ29uYWwgcmlnaHQvZG93biBmcm9tICg4LDYpXHJcbiAgZXF1YWwoZ2V0TGluZVByb2R1Y3QoOCwgNiwgMSwgMSksIDE3ODg2OTYsIFwiRGlhZ29uYWwgdmFsdWUgc2hvd24gaW4gZXhhbXBsZSBlcXVhbHMgMSw3ODgsNjk2XCIpXHJcblxyXG5wcm9ibGVtLmFuc3dlciA9IC0+XHJcbiAgbWF4ID1cclxuICAgIHByb2R1Y3Q6IDFcclxuICAgIGk6IDBcclxuICAgIGo6IDBcclxuICAgIGRpcjogXCJyaWdodFwiXHJcblxyXG4gIGZvciBqIGluIFswLi4uMjBdXHJcbiAgICBmb3IgaSBpbiBbMC4uLjIwXVxyXG4gICAgICBwID0gZ2V0TGluZVByb2R1Y3QoaSwgaiwgMSwgMClcclxuICAgICAgaWYgbWF4LnByb2R1Y3QgPCBwXHJcbiAgICAgICAgbWF4LnByb2R1Y3QgPSBwXHJcbiAgICAgICAgbWF4LmkgPSBpXHJcbiAgICAgICAgbWF4LmogPSBqXHJcbiAgICAgICAgbWF4LmRpciA9IFwicmlnaHRcIlxyXG4gICAgICBwID0gZ2V0TGluZVByb2R1Y3QoaSwgaiwgMCwgMSlcclxuICAgICAgaWYgbWF4LnByb2R1Y3QgPCBwXHJcbiAgICAgICAgbWF4LnByb2R1Y3QgPSBwXHJcbiAgICAgICAgbWF4LmkgPSBpXHJcbiAgICAgICAgbWF4LmogPSBqXHJcbiAgICAgICAgbWF4LmRpciA9IFwiZG93blwiXHJcbiAgICAgIHAgPSBnZXRMaW5lUHJvZHVjdChpLCBqLCAxLCAxKVxyXG4gICAgICBpZiBtYXgucHJvZHVjdCA8IHBcclxuICAgICAgICBtYXgucHJvZHVjdCA9IHBcclxuICAgICAgICBtYXguaSA9IGlcclxuICAgICAgICBtYXguaiA9IGpcclxuICAgICAgICBtYXguZGlyID0gXCJkaWFnb25hbFJcIlxyXG4gICAgICBwID0gZ2V0TGluZVByb2R1Y3QoaSwgaiwgLTEsIDEpXHJcbiAgICAgIGlmIG1heC5wcm9kdWN0IDwgcFxyXG4gICAgICAgIG1heC5wcm9kdWN0ID0gcFxyXG4gICAgICAgIG1heC5pID0gaVxyXG4gICAgICAgIG1heC5qID0galxyXG4gICAgICAgIG1heC5kaXIgPSBcImRpYWdvbmFsTFwiXHJcblxyXG4gIHJldHVybiBtYXhcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXHJcblxyXG5Qcm9ibGVtIDEyOiBIaWdobHkgZGl2aXNpYmxlIHRyaWFuZ3VsYXIgbnVtYmVyXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblRoZSBzZXF1ZW5jZSBvZiB0cmlhbmdsZSBudW1iZXJzIGlzIGdlbmVyYXRlZCBieSBhZGRpbmcgdGhlIG5hdHVyYWwgbnVtYmVycy4gU28gdGhlIDd0aCB0cmlhbmdsZSBudW1iZXIgd291bGQgYmVcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAxICsgMiArIDMgKyA0ICsgNSArIDYgKyA3ID0gMjguXHJcblxyXG5UaGUgZmlyc3QgdGVuIHRlcm1zIHdvdWxkIGJlOlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgIDEsIDMsIDYsIDEwLCAxNSwgMjEsIDI4LCAzNiwgNDUsIDU1LCAuLi5cclxuXHJcbkxldCB1cyBsaXN0IHRoZSBmYWN0b3JzIG9mIHRoZSBmaXJzdCBzZXZlbiB0cmlhbmdsZSBudW1iZXJzOlxyXG5cclxuIDE6IDFcclxuIDM6IDEsM1xyXG4gNjogMSwyLDMsNlxyXG4xMDogMSwyLDUsMTBcclxuMTU6IDEsMyw1LDE1XHJcbjIxOiAxLDMsNywyMVxyXG4yODogMSwyLDQsNywxNCwyOFxyXG5cclxuV2UgY2FuIHNlZSB0aGF0IDI4IGlzIHRoZSBmaXJzdCB0cmlhbmdsZSBudW1iZXIgdG8gaGF2ZSBvdmVyIGZpdmUgZGl2aXNvcnMuXHJcblxyXG5XaGF0IGlzIHRoZSB2YWx1ZSBvZiB0aGUgZmlyc3QgdHJpYW5nbGUgbnVtYmVyIHRvIGhhdmUgb3ZlciBmaXZlIGh1bmRyZWQgZGl2aXNvcnM/XHJcblxyXG5cIlwiXCJcclxuXHJcbm1hdGggPSByZXF1aXJlIFwibWF0aFwiXHJcblxyXG4jIFRoaXMgZnVuY3Rpb24gZG9lcyBpdHMgYmVzdCB0byBsZXZlcmFnZSBSYW1hbnVqYW4ncyBcIlRhdSBmdW5jdGlvblwiLFxyXG4jIHdoaWNoIGlzIHN1cHBvc2VkIHRvIGdpdmUgdGhlIG51bWJlciBvZiBwb3NpdGl2ZSBkaXZpc29ycy5cclxuI1xyXG4jIFRoZSBpZGVhIGlzOlxyXG4jICogRm9yIHByaW1lcywgVChwXmspID0gayArIDFcclxuIyAqIEZvciBhbnkgbnVtYmVycyB3aG9zZSBHQ0QgaXMgMSwgVChtbikgPSBUKG0pICogVChuKVxyXG4jXHJcbiMgSSBhbHJlYWR5IGhhdmUgYSBtZXRob2QgdG8gcHJpbWUgZmFjdG9yIGEgbnVtYmVyLCBzbyBJJ2xsIGxldmVyYWdlXHJcbiMgZXZlcnkgZ3JvdXBpbmcgb2YgdGhlIHNhbWUgcHJpbWUgbnVtYmVyIGFzIHRoZSBmaXJzdCBjYXNlLCBhbmRcclxuIyBtdWx0aXBseSB0aGVtIHRvZ2V0aGVyLlxyXG4jXHJcbiMgRXhhbXBsZTogMjhcclxuI1xyXG4jIDI4J3MgcHJpbWUgZmFjdG9ycyBhcmUgWzIsIDIsIDddLCBvciAoMl4yICsgNylcclxuI1xyXG4jIEkgY2FuIGFzc3VtZSB0aGF0IHRoZSBHQ0QgYmV0d2VlbiBhbnkgb2YgdGhlIHByaW1lIHNldHMgaXMgZ29pbmcgdG8gYmUgMSBiZWNhdXNlIGR1aCxcclxuIyB3aGljaCBtZWFucyB0aGF0OlxyXG4jXHJcbiMgVCgyOCkgPT0gVCgyXjIpICogVCg3KVxyXG4jXHJcbiMgVCgyXjIpID09IDIgKyAxID09IDNcclxuIyBUKDdeMSkgPT0gMSArIDEgPT0gMlxyXG4jIDMgKiAyID0gNlxyXG4jIDI4IGhhcyA2IGRpdmlzb3JzLlxyXG4jXHJcbiMgWW91J3JlIG1hZC5cclxuXHJcbmRpdmlzb3JDb3VudCA9IChuKSAtPlxyXG4gIHJldHVybiAxIGlmIG4gPT0gMVxyXG5cclxuICBmYWN0b3JzID0gbWF0aC5wcmltZUZhY3RvcnMobilcclxuICBjb3VudCA9IDFcclxuICBsYXN0RmFjdG9yID0gMFxyXG4gIGV4cG9uZW50ID0gMVxyXG4gIGZvciBmYWN0b3IgaW4gZmFjdG9yc1xyXG4gICAgaWYgZmFjdG9yID09IGxhc3RGYWN0b3JcclxuICAgICAgZXhwb25lbnQrK1xyXG4gICAgZWxzZVxyXG4gICAgICBpZiBsYXN0RmFjdG9yICE9IDBcclxuICAgICAgICAgIGNvdW50ICo9IGV4cG9uZW50ICsgMVxyXG4gICAgICBsYXN0RmFjdG9yID0gZmFjdG9yXHJcbiAgICAgIGV4cG9uZW50ID0gMVxyXG5cclxuICBpZiBsYXN0RmFjdG9yICE9IDBcclxuICAgICAgY291bnQgKj0gZXhwb25lbnQgKyAxXHJcblxyXG4gIHJldHVybiBjb3VudFxyXG5cclxucHJvYmxlbS50ZXN0ID0gLT5cclxuICBlcXVhbChkaXZpc29yQ291bnQoIDEpLCAxLCBcIiAxIGhhcyAxIGRpdmlzb3JzXCIpXHJcbiAgZXF1YWwoZGl2aXNvckNvdW50KCAzKSwgMiwgXCIgMyBoYXMgMiBkaXZpc29yc1wiKVxyXG4gIGVxdWFsKGRpdmlzb3JDb3VudCggNiksIDQsIFwiIDYgaGFzIDQgZGl2aXNvcnNcIilcclxuICBlcXVhbChkaXZpc29yQ291bnQoMTApLCA0LCBcIjEwIGhhcyA0IGRpdmlzb3JzXCIpXHJcbiAgZXF1YWwoZGl2aXNvckNvdW50KDE1KSwgNCwgXCIxNSBoYXMgNCBkaXZpc29yc1wiKVxyXG4gIGVxdWFsKGRpdmlzb3JDb3VudCgyMSksIDQsIFwiMjEgaGFzIDQgZGl2aXNvcnNcIilcclxuICBlcXVhbChkaXZpc29yQ291bnQoMjgpLCA2LCBcIjI4IGhhcyA2IGRpdmlzb3JzXCIpXHJcblxyXG5wcm9ibGVtLmFuc3dlciA9IC0+XHJcbiAgbiA9IDFcclxuICBzdGVwID0gMlxyXG5cclxuICBsb29wXHJcbiAgICBjb3VudCA9IGRpdmlzb3JDb3VudChuKVxyXG4gICAgaWYgY291bnQgPiA1MDBcclxuICAgICAgcmV0dXJuIHsgbjogbiwgY291bnQ6IGNvdW50IH1cclxuXHJcbiAgICAjIG5leHQgdHJpYW5ndWxhciBudW1iZXJcclxuICAgIG4gKz0gc3RlcFxyXG4gICAgc3RlcCsrXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxyXG5cclxuUHJvYmxlbSAxMzogTGFyZ2Ugc3VtXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuV29yayBvdXQgdGhlIGZpcnN0IHRlbiBkaWdpdHMgb2YgdGhlIHN1bSBvZiB0aGUgZm9sbG93aW5nIG9uZS1odW5kcmVkIDUwLWRpZ2l0IG51bWJlcnMuXHJcblxyXG4zNzEwNzI4NzUzMzkwMjEwMjc5ODc5Nzk5ODIyMDgzNzU5MDI0NjUxMDEzNTc0MDI1MFxyXG40NjM3NjkzNzY3NzQ5MDAwOTcxMjY0ODEyNDg5Njk3MDA3ODA1MDQxNzAxODI2MDUzOFxyXG43NDMyNDk4NjE5OTUyNDc0MTA1OTQ3NDIzMzMwOTUxMzA1ODEyMzcyNjYxNzMwOTYyOVxyXG45MTk0MjIxMzM2MzU3NDE2MTU3MjUyMjQzMDU2MzMwMTgxMTA3MjQwNjE1NDkwODI1MFxyXG4yMzA2NzU4ODIwNzUzOTM0NjE3MTE3MTk4MDMxMDQyMTA0NzUxMzc3ODA2MzI0NjY3NlxyXG44OTI2MTY3MDY5NjYyMzYzMzgyMDEzNjM3ODQxODM4MzY4NDE3ODczNDM2MTcyNjc1N1xyXG4yODExMjg3OTgxMjg0OTk3OTQwODA2NTQ4MTkzMTU5MjYyMTY5MTI3NTg4OTgzMjczOFxyXG40NDI3NDIyODkxNzQzMjUyMDMyMTkyMzU4OTQyMjg3Njc5NjQ4NzY3MDI3MjE4OTMxOFxyXG40NzQ1MTQ0NTczNjAwMTMwNjQzOTA5MTE2NzIxNjg1Njg0NDU4ODcxMTYwMzE1MzI3NlxyXG43MDM4NjQ4NjEwNTg0MzAyNTQzOTkzOTYxOTgyODkxNzU5MzY2NTY4Njc1NzkzNDk1MVxyXG42MjE3NjQ1NzE0MTg1NjU2MDYyOTUwMjE1NzIyMzE5NjU4Njc1NTA3OTMyNDE5MzMzMVxyXG42NDkwNjM1MjQ2Mjc0MTkwNDkyOTEwMTQzMjQ0NTgxMzgyMjY2MzM0Nzk0NDc1ODE3OFxyXG45MjU3NTg2NzcxODMzNzIxNzY2MTk2Mzc1MTU5MDU3OTIzOTcyODI0NTU5ODgzODQwN1xyXG41ODIwMzU2NTMyNTM1OTM5OTAwODQwMjYzMzU2ODk0ODgzMDE4OTQ1ODYyODIyNzgyOFxyXG44MDE4MTE5OTM4NDgyNjI4MjAxNDI3ODE5NDEzOTk0MDU2NzU4NzE1MTE3MDA5NDM5MFxyXG4zNTM5ODY2NDM3MjgyNzExMjY1MzgyOTk4NzI0MDc4NDQ3MzA1MzE5MDEwNDI5MzU4NlxyXG44NjUxNTUwNjAwNjI5NTg2NDg2MTUzMjA3NTI3MzM3MTk1OTE5MTQyMDUxNzI1NTgyOVxyXG43MTY5Mzg4ODcwNzcxNTQ2NjQ5OTExNTU5MzQ4NzYwMzUzMjkyMTcxNDk3MDA1NjkzOFxyXG41NDM3MDA3MDU3NjgyNjY4NDYyNDYyMTQ5NTY1MDA3NjQ3MTc4NzI5NDQzODM3NzYwNFxyXG41MzI4MjY1NDEwODc1NjgyODQ0MzE5MTE5MDYzNDY5NDAzNzg1NTIxNzc3OTI5NTE0NVxyXG4zNjEyMzI3MjUyNTAwMDI5NjA3MTA3NTA4MjU2MzgxNTY1NjcxMDg4NTI1ODM1MDcyMVxyXG40NTg3NjU3NjE3MjQxMDk3NjQ0NzMzOTExMDYwNzIxODI2NTIzNjg3NzIyMzYzNjA0NVxyXG4xNzQyMzcwNjkwNTg1MTg2MDY2MDQ0ODIwNzYyMTIwOTgxMzI4Nzg2MDczMzk2OTQxMlxyXG44MTE0MjY2MDQxODA4NjgzMDYxOTMyODQ2MDgxMTE5MTA2MTU1Njk0MDUxMjY4OTY5MlxyXG41MTkzNDMyNTQ1MTcyODM4ODY0MTkxODA0NzA0OTI5MzIxNTA1ODY0MjU2MzA0OTQ4M1xyXG42MjQ2NzIyMTY0ODQzNTA3NjIwMTcyNzkxODAzOTk0NDY5MzAwNDczMjk1NjM0MDY5MVxyXG4xNTczMjQ0NDM4NjkwODEyNTc5NDUxNDA4OTA1NzcwNjIyOTQyOTE5NzEwNzkyODIwOVxyXG41NTAzNzY4NzUyNTY3ODc3MzA5MTg2MjU0MDc0NDk2OTg0NDUwODMzMDM5MzY4MjEyNlxyXG4xODMzNjM4NDgyNTMzMDE1NDY4NjE5NjEyNDM0ODc2NzY4MTI5NzUzNDM3NTk0NjUxNVxyXG44MDM4NjI4NzU5Mjg3ODQ5MDIwMTUyMTY4NTU1NDgyODcxNzIwMTIxOTI1Nzc2Njk1NFxyXG43ODE4MjgzMzc1Nzk5MzEwMzYxNDc0MDM1Njg1NjQ0OTA5NTUyNzA5Nzg2NDc5NzU4MVxyXG4xNjcyNjMyMDEwMDQzNjg5Nzg0MjU1MzUzOTkyMDkzMTgzNzQ0MTQ5NzgwNjg2MDk4NFxyXG40ODQwMzA5ODEyOTA3Nzc5MTc5OTA4ODIxODc5NTMyNzM2NDQ3NTY3NTU5MDg0ODAzMFxyXG44NzA4Njk4NzU1MTM5MjcxMTg1NDUxNzA3ODU0NDE2MTg1MjQyNDMyMDY5MzE1MDMzMlxyXG41OTk1OTQwNjg5NTc1NjUzNjc4MjEwNzA3NDkyNjk2NjUzNzY3NjMyNjIzNTQ0NzIxMFxyXG42OTc5Mzk1MDY3OTY1MjY5NDc0MjU5NzcwOTczOTE2NjY5Mzc2MzA0MjYzMzk4NzA4NVxyXG40MTA1MjY4NDcwODI5OTA4NTIxMTM5OTQyNzM2NTczNDExNjE4Mjc2MDMxNTAwMTI3MVxyXG42NTM3ODYwNzM2MTUwMTA4MDg1NzAwOTE0OTkzOTUxMjU1NzAyODE5ODc0NjAwNDM3NVxyXG4zNTgyOTAzNTMxNzQzNDcxNzMyNjkzMjEyMzU3ODE1NDk4MjYyOTc0MjU1MjczNzMwN1xyXG45NDk1Mzc1OTc2NTEwNTMwNTk0Njk2NjA2NzY4MzE1NjU3NDM3NzE2NzQwMTg3NTI3NVxyXG44ODkwMjgwMjU3MTczMzIyOTYxOTE3NjY2ODcxMzgxOTkzMTgxMTA0ODc3MDE5MDI3MVxyXG4yNTI2NzY4MDI3NjA3ODAwMzAxMzY3ODY4MDk5MjUyNTQ2MzQwMTA2MTYzMjg2NjUyNlxyXG4zNjI3MDIxODU0MDQ5NzcwNTU4NTYyOTk0NjU4MDYzNjIzNzk5MzE0MDc0NjI1NTk2MlxyXG4yNDA3NDQ4NjkwODIzMTE3NDk3Nzc5MjM2NTQ2NjI1NzI0NjkyMzMyMjgxMDkxNzE0MVxyXG45MTQzMDI4ODE5NzEwMzI4ODU5NzgwNjY2OTc2MDg5MjkzODYzODI4NTAyNTMzMzQwM1xyXG4zNDQxMzA2NTU3ODAxNjEyNzgxNTkyMTgxNTAwNTU2MTg2ODgzNjQ2ODQyMDA5MDQ3MFxyXG4yMzA1MzA4MTE3MjgxNjQzMDQ4NzYyMzc5MTk2OTg0MjQ4NzI1NTAzNjYzODc4NDU4M1xyXG4xMTQ4NzY5NjkzMjE1NDkwMjgxMDQyNDAyMDEzODMzNTEyNDQ2MjE4MTQ0MTc3MzQ3MFxyXG42Mzc4MzI5OTQ5MDYzNjI1OTY2NjQ5ODU4NzYxODIyMTIyNTIyNTUxMjQ4Njc2NDUzM1xyXG42NzcyMDE4Njk3MTY5ODU0NDMxMjQxOTU3MjQwOTkxMzk1OTAwODk1MjMxMDA1ODgyMlxyXG45NTU0ODI1NTMwMDI2MzUyMDc4MTUzMjI5Njc5NjI0OTQ4MTY0MTk1Mzg2ODIxODc3NFxyXG43NjA4NTMyNzEzMjI4NTcyMzExMDQyNDgwMzQ1NjEyNDg2NzY5NzA2NDUwNzk5NTIzNlxyXG4zNzc3NDI0MjUzNTQxMTI5MTY4NDI3Njg2NTUzODkyNjIwNTAyNDkxMDMyNjU3Mjk2N1xyXG4yMzcwMTkxMzI3NTcyNTY3NTI4NTY1MzI0ODI1ODI2NTQ2MzA5MjIwNzA1ODU5NjUyMlxyXG4yOTc5ODg2MDI3MjI1ODMzMTkxMzEyNjM3NTE0NzM0MTk5NDg4OTUzNDc2NTc0NTUwMVxyXG4xODQ5NTcwMTQ1NDg3OTI4ODk4NDg1NjgyNzcyNjA3NzcxMzcyMTQwMzc5ODg3OTcxNVxyXG4zODI5ODIwMzc4MzAzMTQ3MzUyNzcyMTU4MDM0ODE0NDUxMzQ5MTM3MzIyNjY1MTM4MVxyXG4zNDgyOTU0MzgyOTE5OTkxODE4MDI3ODkxNjUyMjQzMTAyNzM5MjI1MTEyMjg2OTUzOVxyXG40MDk1Nzk1MzA2NjQwNTIzMjYzMjUzODA0NDEwMDA1OTY1NDkzOTE1OTg3OTU5MzYzNVxyXG4yOTc0NjE1MjE4NTUwMjM3MTMwNzY0MjI1NTEyMTE4MzY5MzgwMzU4MDM4ODU4NDkwM1xyXG40MTY5ODExNjIyMjA3Mjk3NzE4NjE1ODIzNjY3ODQyNDY4OTE1Nzk5MzUzMjk2MTkyMlxyXG42MjQ2Nzk1NzE5NDQwMTI2OTA0Mzg3NzEwNzI3NTA0ODEwMjM5MDg5NTUyMzU5NzQ1N1xyXG4yMzE4OTcwNjc3MjU0NzkxNTA2MTUwNTUwNDk1MzkyMjk3OTUzMDkwMTEyOTk2NzUxOVxyXG44NjE4ODA4ODIyNTg3NTMxNDUyOTU4NDA5OTI1MTIwMzgyOTAwOTQwNzc3MDc3NTY3MlxyXG4xMTMwNjczOTcwODMwNDcyNDQ4MzgxNjUzMzg3MzUwMjM0MDg0NTY0NzA1ODA3NzMwOFxyXG44Mjk1OTE3NDc2NzE0MDM2MzE5ODAwODE4NzEyOTAxMTg3NTQ5MTMxMDU0NzEyNjU4MVxyXG45NzYyMzMzMTA0NDgxODM4NjI2OTUxNTQ1NjMzNDkyNjM2NjU3Mjg5NzU2MzQwMDUwMFxyXG40Mjg0NjI4MDE4MzUxNzA3MDUyNzgzMTgzOTQyNTg4MjE0NTUyMTIyNzI1MTI1MDMyN1xyXG41NTEyMTYwMzU0Njk4MTIwMDU4MTc2MjE2NTIxMjgyNzY1Mjc1MTY5MTI5Njg5Nzc4OVxyXG4zMjIzODE5NTczNDMyOTMzOTk0NjQzNzUwMTkwNzgzNjk0NTc2NTg4MzM1MjM5OTg4NlxyXG43NTUwNjE2NDk2NTE4NDc3NTE4MDczODE2ODgzNzg2MTA5MTUyNzM1NzkyOTcwMTMzN1xyXG42MjE3Nzg0Mjc1MjE5MjYyMzQwMTk0MjM5OTYzOTE2ODA0NDk4Mzk5MzE3MzMxMjczMVxyXG4zMjkyNDE4NTcwNzE0NzM0OTU2NjkxNjY3NDY4NzYzNDY2MDkxNTAzNTkxNDY3NzUwNFxyXG45OTUxODY3MTQzMDIzNTIxOTYyODg5NDg5MDEwMjQyMzMyNTExNjkxMzYxOTYyNjYyMlxyXG43MzI2NzQ2MDgwMDU5MTU0NzQ3MTgzMDc5ODM5Mjg2ODUzNTIwNjk0Njk0NDU0MDcyNFxyXG43Njg0MTgyMjUyNDY3NDQxNzE2MTUxNDAzNjQyNzk4MjI3MzM0ODA1NTU1NjIxNDgxOFxyXG45NzE0MjYxNzkxMDM0MjU5ODY0NzIwNDUxNjg5Mzk4OTQyMjE3OTgyNjA4ODA3Njg1MlxyXG44Nzc4MzY0NjE4Mjc5OTM0NjMxMzc2Nzc1NDMwNzgwOTM2MzMzMzAxODk4MjY0MjA5MFxyXG4xMDg0ODgwMjUyMTY3NDY3MDg4MzIxNTEyMDE4NTg4MzU0MzIyMzgxMjg3Njk1Mjc4NlxyXG43MTMyOTYxMjQ3NDc4MjQ2NDUzODYzNjk5MzAwOTA0OTMxMDM2MzYxOTc2Mzg3ODAzOVxyXG42MjE4NDA3MzU3MjM5OTc5NDIyMzQwNjIzNTM5MzgwODMzOTY1MTMyNzQwODAxMTExNlxyXG42NjYyNzg5MTk4MTQ4ODA4Nzc5Nzk0MTg3Njg3NjE0NDIzMDAzMDk4NDQ5MDg1MTQxMVxyXG42MDY2MTgyNjI5MzY4MjgzNjc2NDc0NDc3OTIzOTE4MDMzNTExMDk4OTA2OTc5MDcxNFxyXG44NTc4Njk0NDA4OTU1Mjk5MDY1MzY0MDQ0NzQyNTU3NjA4MzY1OTk3NjY0NTc5NTA5NlxyXG42NjAyNDM5NjQwOTkwNTM4OTYwNzEyMDE5ODIxOTk3NjA0NzU5OTQ5MDE5NzIzMDI5N1xyXG42NDkxMzk4MjY4MDAzMjk3MzE1NjAzNzEyMDA0MTM3NzkwMzc4NTU2NjA4NTA4OTI1MlxyXG4xNjczMDkzOTMxOTg3Mjc1MDI3NTQ2ODkwNjkwMzcwNzUzOTQxMzA0MjY1MjMxNTAxMVxyXG45NDgwOTM3NzI0NTA0ODc5NTE1MDk1NDEwMDkyMTY0NTg2Mzc1NDcxMDU5ODQzNjc5MVxyXG43ODYzOTE2NzAyMTE4NzQ5MjQzMTk5NTcwMDY0MTkxNzk2OTc3NzU5OTAyODMwMDY5OVxyXG4xNTM2ODcxMzcxMTkzNjYxNDk1MjgxMTMwNTg3NjM4MDI3ODQxMDc1NDQ0OTczMzA3OFxyXG40MDc4OTkyMzExNTUzNTU2MjU2MTE0MjMyMjQyMzI1NTAzMzY4NTQ0MjQ4ODkxNzM1M1xyXG40NDg4OTkxMTUwMTQ0MDY0ODAyMDM2OTA2ODA2Mzk2MDY3MjMyMjE5MzIwNDE0OTUzNVxyXG40MTUwMzEyODg4MDMzOTUzNjA1MzI5OTM0MDM2ODAwNjk3NzcxMDY1MDU2NjYzMTk1NFxyXG44MTIzNDg4MDY3MzIxMDE0NjczOTA1ODU2ODU1NzkzNDU4MTQwMzYyNzgyMjcwMzI4MFxyXG44MjYxNjU3MDc3Mzk0ODMyNzU5MjIzMjg0NTk0MTcwNjUyNTA5NDUxMjMyNTIzMDYwOFxyXG4yMjkxODgwMjA1ODc3NzMxOTcxOTgzOTQ1MDE4MDg4ODA3MjQyOTY2MTk4MDgxMTE5N1xyXG43NzE1ODU0MjUwMjAxNjU0NTA5MDQxMzI0NTgwOTc4Njg4Mjc3ODk0ODcyMTg1OTYxN1xyXG43MjEwNzgzODQzNTA2OTE4NjE1NTQzNTY2Mjg4NDA2MjI1NzQ3MzY5MjI4NDUwOTUxNlxyXG4yMDg0OTYwMzk4MDEzNDAwMTcyMzkzMDY3MTY2NjgyMzU1NTI0NTI1MjgwNDYwOTcyMlxyXG41MzUwMzUzNDIyNjQ3MjUyNDI1MDg3NDA1NDA3NTU5MTc4OTc4MTI2NDMzMDMzMTY5MFxyXG5cclxuXCJcIlwiXHJcblxyXG5udW1iZXJzID0gW1xyXG4gIDM3MTA3Mjg3NTMzOTAyMTAyNzk4Nzk3OTk4MjIwODM3NTkwMjQ2NTEwMTM1NzQwMjUwXHJcbiAgNDYzNzY5Mzc2Nzc0OTAwMDk3MTI2NDgxMjQ4OTY5NzAwNzgwNTA0MTcwMTgyNjA1MzhcclxuICA3NDMyNDk4NjE5OTUyNDc0MTA1OTQ3NDIzMzMwOTUxMzA1ODEyMzcyNjYxNzMwOTYyOVxyXG4gIDkxOTQyMjEzMzYzNTc0MTYxNTcyNTIyNDMwNTYzMzAxODExMDcyNDA2MTU0OTA4MjUwXHJcbiAgMjMwNjc1ODgyMDc1MzkzNDYxNzExNzE5ODAzMTA0MjEwNDc1MTM3NzgwNjMyNDY2NzZcclxuICA4OTI2MTY3MDY5NjYyMzYzMzgyMDEzNjM3ODQxODM4MzY4NDE3ODczNDM2MTcyNjc1N1xyXG4gIDI4MTEyODc5ODEyODQ5OTc5NDA4MDY1NDgxOTMxNTkyNjIxNjkxMjc1ODg5ODMyNzM4XHJcbiAgNDQyNzQyMjg5MTc0MzI1MjAzMjE5MjM1ODk0MjI4NzY3OTY0ODc2NzAyNzIxODkzMThcclxuICA0NzQ1MTQ0NTczNjAwMTMwNjQzOTA5MTE2NzIxNjg1Njg0NDU4ODcxMTYwMzE1MzI3NlxyXG4gIDcwMzg2NDg2MTA1ODQzMDI1NDM5OTM5NjE5ODI4OTE3NTkzNjY1Njg2NzU3OTM0OTUxXHJcbiAgNjIxNzY0NTcxNDE4NTY1NjA2Mjk1MDIxNTcyMjMxOTY1ODY3NTUwNzkzMjQxOTMzMzFcclxuICA2NDkwNjM1MjQ2Mjc0MTkwNDkyOTEwMTQzMjQ0NTgxMzgyMjY2MzM0Nzk0NDc1ODE3OFxyXG4gIDkyNTc1ODY3NzE4MzM3MjE3NjYxOTYzNzUxNTkwNTc5MjM5NzI4MjQ1NTk4ODM4NDA3XHJcbiAgNTgyMDM1NjUzMjUzNTkzOTkwMDg0MDI2MzM1Njg5NDg4MzAxODk0NTg2MjgyMjc4MjhcclxuICA4MDE4MTE5OTM4NDgyNjI4MjAxNDI3ODE5NDEzOTk0MDU2NzU4NzE1MTE3MDA5NDM5MFxyXG4gIDM1Mzk4NjY0MzcyODI3MTEyNjUzODI5OTg3MjQwNzg0NDczMDUzMTkwMTA0MjkzNTg2XHJcbiAgODY1MTU1MDYwMDYyOTU4NjQ4NjE1MzIwNzUyNzMzNzE5NTkxOTE0MjA1MTcyNTU4MjlcclxuICA3MTY5Mzg4ODcwNzcxNTQ2NjQ5OTExNTU5MzQ4NzYwMzUzMjkyMTcxNDk3MDA1NjkzOFxyXG4gIDU0MzcwMDcwNTc2ODI2Njg0NjI0NjIxNDk1NjUwMDc2NDcxNzg3Mjk0NDM4Mzc3NjA0XHJcbiAgNTMyODI2NTQxMDg3NTY4Mjg0NDMxOTExOTA2MzQ2OTQwMzc4NTUyMTc3NzkyOTUxNDVcclxuICAzNjEyMzI3MjUyNTAwMDI5NjA3MTA3NTA4MjU2MzgxNTY1NjcxMDg4NTI1ODM1MDcyMVxyXG4gIDQ1ODc2NTc2MTcyNDEwOTc2NDQ3MzM5MTEwNjA3MjE4MjY1MjM2ODc3MjIzNjM2MDQ1XHJcbiAgMTc0MjM3MDY5MDU4NTE4NjA2NjA0NDgyMDc2MjEyMDk4MTMyODc4NjA3MzM5Njk0MTJcclxuICA4MTE0MjY2MDQxODA4NjgzMDYxOTMyODQ2MDgxMTE5MTA2MTU1Njk0MDUxMjY4OTY5MlxyXG4gIDUxOTM0MzI1NDUxNzI4Mzg4NjQxOTE4MDQ3MDQ5MjkzMjE1MDU4NjQyNTYzMDQ5NDgzXHJcbiAgNjI0NjcyMjE2NDg0MzUwNzYyMDE3Mjc5MTgwMzk5NDQ2OTMwMDQ3MzI5NTYzNDA2OTFcclxuICAxNTczMjQ0NDM4NjkwODEyNTc5NDUxNDA4OTA1NzcwNjIyOTQyOTE5NzEwNzkyODIwOVxyXG4gIDU1MDM3Njg3NTI1Njc4NzczMDkxODYyNTQwNzQ0OTY5ODQ0NTA4MzMwMzkzNjgyMTI2XHJcbiAgMTgzMzYzODQ4MjUzMzAxNTQ2ODYxOTYxMjQzNDg3Njc2ODEyOTc1MzQzNzU5NDY1MTVcclxuICA4MDM4NjI4NzU5Mjg3ODQ5MDIwMTUyMTY4NTU1NDgyODcxNzIwMTIxOTI1Nzc2Njk1NFxyXG4gIDc4MTgyODMzNzU3OTkzMTAzNjE0NzQwMzU2ODU2NDQ5MDk1NTI3MDk3ODY0Nzk3NTgxXHJcbiAgMTY3MjYzMjAxMDA0MzY4OTc4NDI1NTM1Mzk5MjA5MzE4Mzc0NDE0OTc4MDY4NjA5ODRcclxuICA0ODQwMzA5ODEyOTA3Nzc5MTc5OTA4ODIxODc5NTMyNzM2NDQ3NTY3NTU5MDg0ODAzMFxyXG4gIDg3MDg2OTg3NTUxMzkyNzExODU0NTE3MDc4NTQ0MTYxODUyNDI0MzIwNjkzMTUwMzMyXHJcbiAgNTk5NTk0MDY4OTU3NTY1MzY3ODIxMDcwNzQ5MjY5NjY1Mzc2NzYzMjYyMzU0NDcyMTBcclxuICA2OTc5Mzk1MDY3OTY1MjY5NDc0MjU5NzcwOTczOTE2NjY5Mzc2MzA0MjYzMzk4NzA4NVxyXG4gIDQxMDUyNjg0NzA4Mjk5MDg1MjExMzk5NDI3MzY1NzM0MTE2MTgyNzYwMzE1MDAxMjcxXHJcbiAgNjUzNzg2MDczNjE1MDEwODA4NTcwMDkxNDk5Mzk1MTI1NTcwMjgxOTg3NDYwMDQzNzVcclxuICAzNTgyOTAzNTMxNzQzNDcxNzMyNjkzMjEyMzU3ODE1NDk4MjYyOTc0MjU1MjczNzMwN1xyXG4gIDk0OTUzNzU5NzY1MTA1MzA1OTQ2OTY2MDY3NjgzMTU2NTc0Mzc3MTY3NDAxODc1Mjc1XHJcbiAgODg5MDI4MDI1NzE3MzMyMjk2MTkxNzY2Njg3MTM4MTk5MzE4MTEwNDg3NzAxOTAyNzFcclxuICAyNTI2NzY4MDI3NjA3ODAwMzAxMzY3ODY4MDk5MjUyNTQ2MzQwMTA2MTYzMjg2NjUyNlxyXG4gIDM2MjcwMjE4NTQwNDk3NzA1NTg1NjI5OTQ2NTgwNjM2MjM3OTkzMTQwNzQ2MjU1OTYyXHJcbiAgMjQwNzQ0ODY5MDgyMzExNzQ5Nzc3OTIzNjU0NjYyNTcyNDY5MjMzMjI4MTA5MTcxNDFcclxuICA5MTQzMDI4ODE5NzEwMzI4ODU5NzgwNjY2OTc2MDg5MjkzODYzODI4NTAyNTMzMzQwM1xyXG4gIDM0NDEzMDY1NTc4MDE2MTI3ODE1OTIxODE1MDA1NTYxODY4ODM2NDY4NDIwMDkwNDcwXHJcbiAgMjMwNTMwODExNzI4MTY0MzA0ODc2MjM3OTE5Njk4NDI0ODcyNTUwMzY2Mzg3ODQ1ODNcclxuICAxMTQ4NzY5NjkzMjE1NDkwMjgxMDQyNDAyMDEzODMzNTEyNDQ2MjE4MTQ0MTc3MzQ3MFxyXG4gIDYzNzgzMjk5NDkwNjM2MjU5NjY2NDk4NTg3NjE4MjIxMjI1MjI1NTEyNDg2NzY0NTMzXHJcbiAgNjc3MjAxODY5NzE2OTg1NDQzMTI0MTk1NzI0MDk5MTM5NTkwMDg5NTIzMTAwNTg4MjJcclxuICA5NTU0ODI1NTMwMDI2MzUyMDc4MTUzMjI5Njc5NjI0OTQ4MTY0MTk1Mzg2ODIxODc3NFxyXG4gIDc2MDg1MzI3MTMyMjg1NzIzMTEwNDI0ODAzNDU2MTI0ODY3Njk3MDY0NTA3OTk1MjM2XHJcbiAgMzc3NzQyNDI1MzU0MTEyOTE2ODQyNzY4NjU1Mzg5MjYyMDUwMjQ5MTAzMjY1NzI5NjdcclxuICAyMzcwMTkxMzI3NTcyNTY3NTI4NTY1MzI0ODI1ODI2NTQ2MzA5MjIwNzA1ODU5NjUyMlxyXG4gIDI5Nzk4ODYwMjcyMjU4MzMxOTEzMTI2Mzc1MTQ3MzQxOTk0ODg5NTM0NzY1NzQ1NTAxXHJcbiAgMTg0OTU3MDE0NTQ4NzkyODg5ODQ4NTY4Mjc3MjYwNzc3MTM3MjE0MDM3OTg4Nzk3MTVcclxuICAzODI5ODIwMzc4MzAzMTQ3MzUyNzcyMTU4MDM0ODE0NDUxMzQ5MTM3MzIyNjY1MTM4MVxyXG4gIDM0ODI5NTQzODI5MTk5OTE4MTgwMjc4OTE2NTIyNDMxMDI3MzkyMjUxMTIyODY5NTM5XHJcbiAgNDA5NTc5NTMwNjY0MDUyMzI2MzI1MzgwNDQxMDAwNTk2NTQ5MzkxNTk4Nzk1OTM2MzVcclxuICAyOTc0NjE1MjE4NTUwMjM3MTMwNzY0MjI1NTEyMTE4MzY5MzgwMzU4MDM4ODU4NDkwM1xyXG4gIDQxNjk4MTE2MjIyMDcyOTc3MTg2MTU4MjM2Njc4NDI0Njg5MTU3OTkzNTMyOTYxOTIyXHJcbiAgNjI0Njc5NTcxOTQ0MDEyNjkwNDM4NzcxMDcyNzUwNDgxMDIzOTA4OTU1MjM1OTc0NTdcclxuICAyMzE4OTcwNjc3MjU0NzkxNTA2MTUwNTUwNDk1MzkyMjk3OTUzMDkwMTEyOTk2NzUxOVxyXG4gIDg2MTg4MDg4MjI1ODc1MzE0NTI5NTg0MDk5MjUxMjAzODI5MDA5NDA3NzcwNzc1NjcyXHJcbiAgMTEzMDY3Mzk3MDgzMDQ3MjQ0ODM4MTY1MzM4NzM1MDIzNDA4NDU2NDcwNTgwNzczMDhcclxuICA4Mjk1OTE3NDc2NzE0MDM2MzE5ODAwODE4NzEyOTAxMTg3NTQ5MTMxMDU0NzEyNjU4MVxyXG4gIDk3NjIzMzMxMDQ0ODE4Mzg2MjY5NTE1NDU2MzM0OTI2MzY2NTcyODk3NTYzNDAwNTAwXHJcbiAgNDI4NDYyODAxODM1MTcwNzA1Mjc4MzE4Mzk0MjU4ODIxNDU1MjEyMjcyNTEyNTAzMjdcclxuICA1NTEyMTYwMzU0Njk4MTIwMDU4MTc2MjE2NTIxMjgyNzY1Mjc1MTY5MTI5Njg5Nzc4OVxyXG4gIDMyMjM4MTk1NzM0MzI5MzM5OTQ2NDM3NTAxOTA3ODM2OTQ1NzY1ODgzMzUyMzk5ODg2XHJcbiAgNzU1MDYxNjQ5NjUxODQ3NzUxODA3MzgxNjg4Mzc4NjEwOTE1MjczNTc5Mjk3MDEzMzdcclxuICA2MjE3Nzg0Mjc1MjE5MjYyMzQwMTk0MjM5OTYzOTE2ODA0NDk4Mzk5MzE3MzMxMjczMVxyXG4gIDMyOTI0MTg1NzA3MTQ3MzQ5NTY2OTE2Njc0Njg3NjM0NjYwOTE1MDM1OTE0Njc3NTA0XHJcbiAgOTk1MTg2NzE0MzAyMzUyMTk2Mjg4OTQ4OTAxMDI0MjMzMjUxMTY5MTM2MTk2MjY2MjJcclxuICA3MzI2NzQ2MDgwMDU5MTU0NzQ3MTgzMDc5ODM5Mjg2ODUzNTIwNjk0Njk0NDU0MDcyNFxyXG4gIDc2ODQxODIyNTI0Njc0NDE3MTYxNTE0MDM2NDI3OTgyMjczMzQ4MDU1NTU2MjE0ODE4XHJcbiAgOTcxNDI2MTc5MTAzNDI1OTg2NDcyMDQ1MTY4OTM5ODk0MjIxNzk4MjYwODgwNzY4NTJcclxuICA4Nzc4MzY0NjE4Mjc5OTM0NjMxMzc2Nzc1NDMwNzgwOTM2MzMzMzAxODk4MjY0MjA5MFxyXG4gIDEwODQ4ODAyNTIxNjc0NjcwODgzMjE1MTIwMTg1ODgzNTQzMjIzODEyODc2OTUyNzg2XHJcbiAgNzEzMjk2MTI0NzQ3ODI0NjQ1Mzg2MzY5OTMwMDkwNDkzMTAzNjM2MTk3NjM4NzgwMzlcclxuICA2MjE4NDA3MzU3MjM5OTc5NDIyMzQwNjIzNTM5MzgwODMzOTY1MTMyNzQwODAxMTExNlxyXG4gIDY2NjI3ODkxOTgxNDg4MDg3Nzk3OTQxODc2ODc2MTQ0MjMwMDMwOTg0NDkwODUxNDExXHJcbiAgNjA2NjE4MjYyOTM2ODI4MzY3NjQ3NDQ3NzkyMzkxODAzMzUxMTA5ODkwNjk3OTA3MTRcclxuICA4NTc4Njk0NDA4OTU1Mjk5MDY1MzY0MDQ0NzQyNTU3NjA4MzY1OTk3NjY0NTc5NTA5NlxyXG4gIDY2MDI0Mzk2NDA5OTA1Mzg5NjA3MTIwMTk4MjE5OTc2MDQ3NTk5NDkwMTk3MjMwMjk3XHJcbiAgNjQ5MTM5ODI2ODAwMzI5NzMxNTYwMzcxMjAwNDEzNzc5MDM3ODU1NjYwODUwODkyNTJcclxuICAxNjczMDkzOTMxOTg3Mjc1MDI3NTQ2ODkwNjkwMzcwNzUzOTQxMzA0MjY1MjMxNTAxMVxyXG4gIDk0ODA5Mzc3MjQ1MDQ4Nzk1MTUwOTU0MTAwOTIxNjQ1ODYzNzU0NzEwNTk4NDM2NzkxXHJcbiAgNzg2MzkxNjcwMjExODc0OTI0MzE5OTU3MDA2NDE5MTc5Njk3Nzc1OTkwMjgzMDA2OTlcclxuICAxNTM2ODcxMzcxMTkzNjYxNDk1MjgxMTMwNTg3NjM4MDI3ODQxMDc1NDQ0OTczMzA3OFxyXG4gIDQwNzg5OTIzMTE1NTM1NTYyNTYxMTQyMzIyNDIzMjU1MDMzNjg1NDQyNDg4OTE3MzUzXHJcbiAgNDQ4ODk5MTE1MDE0NDA2NDgwMjAzNjkwNjgwNjM5NjA2NzIzMjIxOTMyMDQxNDk1MzVcclxuICA0MTUwMzEyODg4MDMzOTUzNjA1MzI5OTM0MDM2ODAwNjk3NzcxMDY1MDU2NjYzMTk1NFxyXG4gIDgxMjM0ODgwNjczMjEwMTQ2NzM5MDU4NTY4NTU3OTM0NTgxNDAzNjI3ODIyNzAzMjgwXHJcbiAgODI2MTY1NzA3NzM5NDgzMjc1OTIyMzI4NDU5NDE3MDY1MjUwOTQ1MTIzMjUyMzA2MDhcclxuICAyMjkxODgwMjA1ODc3NzMxOTcxOTgzOTQ1MDE4MDg4ODA3MjQyOTY2MTk4MDgxMTE5N1xyXG4gIDc3MTU4NTQyNTAyMDE2NTQ1MDkwNDEzMjQ1ODA5Nzg2ODgyNzc4OTQ4NzIxODU5NjE3XHJcbiAgNzIxMDc4Mzg0MzUwNjkxODYxNTU0MzU2NjI4ODQwNjIyNTc0NzM2OTIyODQ1MDk1MTZcclxuICAyMDg0OTYwMzk4MDEzNDAwMTcyMzkzMDY3MTY2NjgyMzU1NTI0NTI1MjgwNDYwOTcyMlxyXG4gIDUzNTAzNTM0MjI2NDcyNTI0MjUwODc0MDU0MDc1NTkxNzg5NzgxMjY0MzMwMzMxNjkwXHJcbl1cclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICBzdW0gPSAwXHJcbiAgZm9yIG4gaW4gbnVtYmVyc1xyXG4gICAgc3VtICs9IG5cclxuXHJcbiAgc3RyID0gU3RyaW5nKHN1bSkucmVwbGFjZSgvXFwuL2csIFwiXCIpLnN1YnN0cigwLCAxMClcclxuICByZXR1cm4gc3RyXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxyXG5cclxuUHJvYmxlbSAxNDogTG9uZ2VzdCBDb2xsYXR6IHNlcXVlbmNlXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuVGhlIGZvbGxvd2luZyBpdGVyYXRpdmUgc2VxdWVuY2UgaXMgZGVmaW5lZCBmb3IgdGhlIHNldCBvZiBwb3NpdGl2ZSBpbnRlZ2VyczpcclxuXHJcbiAgICBuIC0+IG4vMiAgICAobiBpcyBldmVuKVxyXG4gICAgbiAtPiAzbiArIDEgKG4gaXMgb2RkKVxyXG5cclxuVXNpbmcgdGhlIHJ1bGUgYWJvdmUgYW5kIHN0YXJ0aW5nIHdpdGggMTMsIHdlIGdlbmVyYXRlIHRoZSBmb2xsb3dpbmcgc2VxdWVuY2U6XHJcblxyXG4gICAgMTMgLT4gNDAgLT4gMjAgLT4gMTAgLT4gNSAtPiAxNiAtPiA4IC0+IDQgLT4gMiAtPiAxXHJcblxyXG5JdCBjYW4gYmUgc2VlbiB0aGF0IHRoaXMgc2VxdWVuY2UgKHN0YXJ0aW5nIGF0IDEzIGFuZCBmaW5pc2hpbmcgYXQgMSkgY29udGFpbnMgMTAgdGVybXMuIEFsdGhvdWdoIGl0IGhhcyBub3QgYmVlbiBwcm92ZWQgeWV0IChDb2xsYXR6IFByb2JsZW0pLCBpdCBpcyB0aG91Z2h0IHRoYXQgYWxsIHN0YXJ0aW5nIG51bWJlcnMgZmluaXNoIGF0IDEuXHJcblxyXG5XaGljaCBzdGFydGluZyBudW1iZXIsIHVuZGVyIG9uZSBtaWxsaW9uLCBwcm9kdWNlcyB0aGUgbG9uZ2VzdCBjaGFpbj9cclxuXHJcbk5PVEU6IE9uY2UgdGhlIGNoYWluIHN0YXJ0cyB0aGUgdGVybXMgYXJlIGFsbG93ZWQgdG8gZ28gYWJvdmUgb25lIG1pbGxpb24uXHJcblxyXG5cIlwiXCJcclxuXHJcbmNvbGxhdHpDYWNoZSA9IHt9XHJcblxyXG5jb2xsYXR6Q2hhaW5MZW5ndGggPSAoc3RhcnRpbmdWYWx1ZSkgLT5cclxuICBuID0gc3RhcnRpbmdWYWx1ZVxyXG4gIHRvQmVDYWNoZWQgPSBbXVxyXG5cclxuICBsb29wXHJcbiAgICBicmVhayBpZiBjb2xsYXR6Q2FjaGUuaGFzT3duUHJvcGVydHkobilcclxuXHJcbiAgICAjIHJlbWVtYmVyIHRoYXQgd2UgZmFpbGVkIHRvIGNhY2hlIHRoaXMgZW50cnlcclxuICAgIHRvQmVDYWNoZWQucHVzaChuKVxyXG5cclxuICAgIGlmIG4gPT0gMVxyXG4gICAgICBicmVha1xyXG5cclxuICAgIGlmIChuICUgMikgPT0gMFxyXG4gICAgICBuID0gTWF0aC5mbG9vcihuIC8gMilcclxuICAgIGVsc2VcclxuICAgICAgbiA9IChuICogMykgKyAxXHJcblxyXG4gICMgU2luY2Ugd2UgbGVmdCBicmVhZGNydW1icyBkb3duIHRoZSB0cmFpbCBvZiB0aGluZ3Mgd2UgaGF2ZW4ndCBjYWNoZWRcclxuICAjIHdhbGsgYmFjayBkb3duIHRoZSB0cmFpbCBhbmQgY2FjaGUgYWxsIHRoZSBlbnRyaWVzIGZvdW5kIGFsb25nIHRoZSB3YXlcclxuICBsZW4gPSB0b0JlQ2FjaGVkLmxlbmd0aFxyXG4gIGZvciB2LGkgaW4gdG9CZUNhY2hlZFxyXG4gICAgY29sbGF0ekNhY2hlW3ZdID0gY29sbGF0ekNhY2hlW25dICsgKGxlbiAtIGkpXHJcblxyXG4gIHJldHVybiBjb2xsYXR6Q2FjaGVbc3RhcnRpbmdWYWx1ZV1cclxuXHJcbnByb2JsZW0udGVzdCA9IC0+XHJcbiAgY29sbGF0ekNhY2hlID0geyBcIjFcIjogMSB9XHJcbiAgZXF1YWwoY29sbGF0ekNoYWluTGVuZ3RoKDEzKSwgMTAsIFwiMTMgaGFzIGEgY29sbGF0eiBjaGFpbiBvZiAxMFwiKVxyXG4gIGVxdWFsKGNvbGxhdHpDaGFpbkxlbmd0aCgyNiksIDExLCBcIjI2IGhhcyBhIGNvbGxhdHogY2hhaW4gb2YgMTFcIilcclxuICBlcXVhbChjb2xsYXR6Q2hhaW5MZW5ndGgoIDEpLCAgMSwgXCIxIGhhcyBhIGNvbGxhdHogY2hhaW4gb2YgMVwiKVxyXG5cclxucHJvYmxlbS5hbnN3ZXIgPSAtPlxyXG4gIGNvbGxhdHpDYWNoZSA9IHsgXCIxXCI6IDEgfVxyXG5cclxuICBtYXhDaGFpbiA9IDBcclxuICBtYXhDaGFpbkxlbmd0aCA9IDBcclxuICBmb3IgaSBpbiBbMS4uLjEwMDAwMDBdXHJcbiAgICBjaGFpbkxlbmd0aCA9IGNvbGxhdHpDaGFpbkxlbmd0aChpKVxyXG4gICAgaWYgbWF4Q2hhaW5MZW5ndGggPCBjaGFpbkxlbmd0aFxyXG4gICAgICBtYXhDaGFpbkxlbmd0aCA9IGNoYWluTGVuZ3RoXHJcbiAgICAgIG1heENoYWluID0gaVxyXG5cclxuICByZXR1cm4geyBhbnN3ZXI6IG1heENoYWluLCBjaGFpbkxlbmd0aDogbWF4Q2hhaW5MZW5ndGggfVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcclxuXHJcblByb2JsZW0gMTU6IExhdHRpY2UgcGF0aHNcclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuU3RhcnRpbmcgaW4gdGhlIHRvcCBsZWZ0IGNvcm5lciBvZiBhIDLDlzIgZ3JpZCwgYW5kIG9ubHkgYmVpbmcgYWJsZSB0byBtb3ZlIHRvIHRoZSByaWdodCBhbmQgZG93biwgdGhlcmUgYXJlIGV4YWN0bHkgNiByb3V0ZXMgdG8gdGhlIGJvdHRvbSByaWdodCBjb3JuZXIuXHJcblxyXG4gICAgKHBpY3R1cmUgc2hvd2luZyA2IHBhdGhzOiBSUkRELCBSRFJELCBSRERSLCBEUlJELCBEUkRSLCBERFJSKVxyXG5cclxuSG93IG1hbnkgc3VjaCByb3V0ZXMgYXJlIHRoZXJlIHRocm91Z2ggYSAyMMOXMjAgZ3JpZD9cclxuXHJcblwiXCJcIlxyXG5cclxubWF0aCA9IHJlcXVpcmUgXCJtYXRoXCJcclxuXHJcbmxhdHRpY2UgPSAobikgLT5cclxuICByZXR1cm4gbWF0aC5uQ3IobiAqIDIsIG4pXHJcblxyXG5wcm9ibGVtLnRlc3QgPSAtPlxyXG4gIGVxdWFsKGxhdHRpY2UoMSksIDIsIFwiMXgxIGxhdHRpY2UgaGFzIDIgcGF0aHNcIilcclxuICBlcXVhbChsYXR0aWNlKDIpLCA2LCBcIjJ4MiBsYXR0aWNlIGhhcyA2IHBhdGhzXCIpXHJcblxyXG5wcm9ibGVtLmFuc3dlciA9IC0+XHJcbiAgcmV0dXJuIGxhdHRpY2UoMjApXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxyXG5cclxuUHJvYmxlbSAxNjogUG93ZXIgZGlnaXQgc3VtXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuMl4xNSA9IDMyNzY4IGFuZCB0aGUgc3VtIG9mIGl0cyBkaWdpdHMgaXMgMyArIDIgKyA3ICsgNiArIDggPSAyNi5cclxuXHJcbldoYXQgaXMgdGhlIHN1bSBvZiB0aGUgZGlnaXRzIG9mIHRoZSBudW1iZXIgMl4xMDAwP1xyXG5cclxuXCJcIlwiXHJcblxyXG5tYXRoID0gcmVxdWlyZSBcIm1hdGhcIlxyXG5iaWdJbnQgPSByZXF1aXJlIFwiYmlnLWludGVnZXJcIlxyXG5cclxuTUFYX0VYUE9ORU5UID0gNTBcclxuXHJcbnBvd2VyRGlnaXRTdW0gPSAoeCwgeSkgLT5cclxuICBudW1iZXIgPSBiaWdJbnQoMSlcclxuICB3aGlsZSB5ICE9IDBcclxuICAgIGV4cG9uZW50ID0geVxyXG4gICAgaWYgZXhwb25lbnQgPiBNQVhfRVhQT05FTlRcclxuICAgICAgZXhwb25lbnQgPSBNQVhfRVhQT05FTlRcclxuICAgIHkgLT0gZXhwb25lbnRcclxuICAgIG51bWJlciA9IG51bWJlci5tdWx0aXBseSBNYXRoLmZsb29yKE1hdGgucG93KHgsIGV4cG9uZW50KSlcclxuICBkaWdpdHMgPSBTdHJpbmcobnVtYmVyKVxyXG5cclxuICBzdW0gPSAwXHJcbiAgZm9yIGQgaW4gZGlnaXRzXHJcbiAgICBzdW0gKz0gcGFyc2VJbnQoZClcclxuICByZXR1cm4gc3VtXHJcblxyXG5wcm9ibGVtLnRlc3QgPSAtPlxyXG4gIGVxdWFsKHBvd2VyRGlnaXRTdW0oMiwgMTUpLCAyNiwgXCJzdW0gb2YgZGlnaXRzIG9mIDJeMTUgaXMgMjZcIilcclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICByZXR1cm4gcG93ZXJEaWdpdFN1bSgyLCAxMDAwKVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcclxuXHJcblByb2JsZW0gMTc6IE51bWJlciBsZXR0ZXIgY291bnRzXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5JZiB0aGUgbnVtYmVycyAxIHRvIDUgYXJlIHdyaXR0ZW4gb3V0IGluIHdvcmRzOiBvbmUsIHR3bywgdGhyZWUsIGZvdXIsIGZpdmUsIHRoZW4gdGhlcmUgYXJlIDMgKyAzICsgNSArIDQgKyA0ID0gMTkgbGV0dGVycyB1c2VkIGluIHRvdGFsLlxyXG5cclxuSWYgYWxsIHRoZSBudW1iZXJzIGZyb20gMSB0byAxMDAwIChvbmUgdGhvdXNhbmQpIGluY2x1c2l2ZSB3ZXJlIHdyaXR0ZW4gb3V0IGluIHdvcmRzLCBob3cgbWFueSBsZXR0ZXJzIHdvdWxkIGJlIHVzZWQ/XHJcblxyXG5OT1RFOiBEbyBub3QgY291bnQgc3BhY2VzIG9yIGh5cGhlbnMuIEZvciBleGFtcGxlLCAzNDIgKHRocmVlIGh1bmRyZWQgYW5kIGZvcnR5LXR3bykgY29udGFpbnMgMjMgbGV0dGVycyBhbmQgMTE1IChvbmUgaHVuZHJlZCBhbmQgZmlmdGVlbikgY29udGFpbnMgMjAgbGV0dGVycy4gVGhlIHVzZSBvZiBcImFuZFwiIHdoZW4gd3JpdGluZyBvdXQgbnVtYmVycyBpcyBpbiBjb21wbGlhbmNlIHdpdGggQnJpdGlzaCB1c2FnZS5cclxuXHJcblwiXCJcIlxyXG5cclxubmFtZXMgPVxyXG4gIG9uZXM6IFwiemVybyBvbmUgdHdvIHRocmVlIGZvdXIgZml2ZSBzaXggc2V2ZW4gZWlnaHQgbmluZSB0ZW4gZWxldmVuIHR3ZWx2ZSB0aGlydGVlbiBmb3VydGVlbiBmaWZ0ZWVuIHNpeHRlZW4gc2V2ZW50ZWVuIGVpZ2h0ZWVuIG5pbmV0ZWVuXCIuc3BsaXQoL1xccysvKVxyXG4gIHRlbnM6IFwiXyBfIHR3ZW50eSB0aGlydHkgZm9ydHkgZmlmdHkgc2l4dHkgc2V2ZW50eSBlaWdodHkgbmluZXR5XCIuc3BsaXQoL1xccysvKVxyXG5cclxuIyBzdXBwb3J0cyAwLTk5OTlcclxubnVtYmVyTGV0dGVyQ291bnQgPSAobnVtKSAtPlxyXG4gIG4gPSBudW1cclxuICBuYW1lID0gXCJcIlxyXG5cclxuICBpZiBuID49IDEwMDBcclxuICAgIHRob3VzYW5kcyA9IE1hdGguZmxvb3IobiAvIDEwMDApXHJcbiAgICBuID0gbiAlIDEwMDBcclxuICAgIG5hbWUgKz0gXCIje25hbWVzLm9uZXNbdGhvdXNhbmRzXX0gdGhvdXNhbmQgXCJcclxuXHJcbiAgaWYgbiA+PSAxMDBcclxuICAgIGh1bmRyZWRzID0gTWF0aC5mbG9vcihuIC8gMTAwKVxyXG4gICAgbiA9IG4gJSAxMDBcclxuICAgIG5hbWUgKz0gXCIje25hbWVzLm9uZXNbaHVuZHJlZHNdfSBodW5kcmVkIFwiXHJcblxyXG4gIGlmIChuID4gMCkgYW5kIChuYW1lLmxlbmd0aCA+IDApXHJcbiAgICBuYW1lICs9IFwiYW5kIFwiXHJcblxyXG4gIGlmIG4gPj0gMjBcclxuICAgIHRlbnMgPSBNYXRoLmZsb29yKG4gLyAxMClcclxuICAgIG4gPSBuICUgMTBcclxuICAgIG5hbWUgKz0gXCIje25hbWVzLnRlbnNbdGVuc119IFwiXHJcblxyXG4gIGlmIG4gPiAwXHJcbiAgICBuYW1lICs9IFwiI3tuYW1lcy5vbmVzW25dfSBcIlxyXG5cclxuICBsZXR0ZXJzT25seSA9IG5hbWUucmVwbGFjZSgvW15hLXpdL2csIFwiXCIpXHJcbiAgIyBjb25zb2xlLmxvZyBcIm51bTogI3tudW19LCBuYW1lOiAje25hbWV9LCBsZXR0ZXJzT25seTogI3tsZXR0ZXJzT25seX1cIlxyXG4gIHJldHVybiBsZXR0ZXJzT25seS5sZW5ndGhcclxuXHJcbm51bWJlckxldHRlckNvdW50UmFuZ2UgPSAoYSwgYikgLT5cclxuICBzdW0gPSAwXHJcbiAgZm9yIGkgaW4gW2EuLmJdXHJcbiAgICBzdW0gKz0gbnVtYmVyTGV0dGVyQ291bnQoaSlcclxuICByZXR1cm4gc3VtXHJcblxyXG5wcm9ibGVtLnRlc3QgPSAtPlxyXG4gIGVxdWFsKG51bWJlckxldHRlckNvdW50UmFuZ2UoMSwgNSksIDE5LCBcInN1bSBvZiBsZW5ndGhzIG9mIG51bWJlcnMgMS01IGlzIDE5XCIpXHJcbiAgZXF1YWwobnVtYmVyTGV0dGVyQ291bnQoMzQyKSwgMjMsIFwibGVuZ3RoIG9mIG5hbWUgb2YgMzQyIGlzIDIzXCIpXHJcbiAgZXF1YWwobnVtYmVyTGV0dGVyQ291bnQoMTE1KSwgMjAsIFwibGVuZ3RoIG9mIG5hbWUgb2YgMTE1IGlzIDIwXCIpXHJcblxyXG5wcm9ibGVtLmFuc3dlciA9IC0+XHJcbiAgcmV0dXJuIG51bWJlckxldHRlckNvdW50UmFuZ2UoMSwgMTAwMClcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXHJcblxyXG5Qcm9ibGVtIDE4OiBNYXhpbXVtIHBhdGggc3VtIElcclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5CeSBzdGFydGluZyBhdCB0aGUgdG9wIG9mIHRoZSB0cmlhbmdsZSBiZWxvdyBhbmQgbW92aW5nIHRvIGFkamFjZW50IG51bWJlcnMgb24gdGhlIHJvdyBiZWxvdywgdGhlIG1heGltdW0gdG90YWwgZnJvbSB0b3AgdG8gYm90dG9tIGlzIDIzLlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgM1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIDcgNFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgMiA0IDZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgOCA1IDkgM1xyXG5cclxuVGhhdCBpcywgMyArIDcgKyA0ICsgOSA9IDIzLlxyXG5cclxuRmluZCB0aGUgbWF4aW11bSB0b3RhbCBmcm9tIHRvcCB0byBib3R0b20gb2YgdGhlIHRyaWFuZ2xlIGJlbG93OlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgNzVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDk1ICA2NFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDE3ICA0NyAgODJcclxuICAgICAgICAgICAgICAgICAgICAgICAgMTggIDM1ICA4NyAgMTBcclxuICAgICAgICAgICAgICAgICAgICAgIDIwICAwNCAgODIgIDQ3ICA2NVxyXG4gICAgICAgICAgICAgICAgICAgIDE5ICAwMSAgMjMgIDc1ICAwMyAgMzRcclxuICAgICAgICAgICAgICAgICAgODggIDAyICA3NyAgNzMgIDA3ICA2MyAgNjdcclxuICAgICAgICAgICAgICAgIDk5ICA2NSAgMDQgIDI4ICAwNiAgMTYgIDcwICA5MlxyXG4gICAgICAgICAgICAgIDQxICA0MSAgMjYgIDU2ICA4MyAgNDAgIDgwICA3MCAgMzNcclxuICAgICAgICAgICAgNDEgIDQ4ICA3MiAgMzMgIDQ3ICAzMiAgMzcgIDE2ICA5NCAgMjlcclxuICAgICAgICAgIDUzICA3MSAgNDQgIDY1ICAyNSAgNDMgIDkxICA1MiAgOTcgIDUxICAxNFxyXG4gICAgICAgIDcwICAxMSAgMzMgIDI4ICA3NyAgNzMgIDE3ICA3OCAgMzkgIDY4ICAxNyAgNTdcclxuICAgICAgOTEgIDcxICA1MiAgMzggIDE3ICAxNCAgOTEgIDQzICA1OCAgNTAgIDI3ICAyOSAgNDhcclxuICAgIDYzICA2NiAgMDQgIDY4ICA4OSAgNTMgIDY3ICAzMCAgNzMgIDE2ICA2OSAgODcgIDQwICAzMVxyXG4gIDA0ICA2MiAgOTggIDI3ICAyMyAgMDkgIDcwICA5OCAgNzMgIDkzICAzOCAgNTMgIDYwICAwNCAgMjNcclxuXHJcbk5PVEU6IEFzIHRoZXJlIGFyZSBvbmx5IDE2Mzg0IHJvdXRlcywgaXQgaXMgcG9zc2libGUgdG8gc29sdmUgdGhpcyBwcm9ibGVtIGJ5IHRyeWluZyBldmVyeSByb3V0ZS4gSG93ZXZlciwgUHJvYmxlbSA2NywgaXMgdGhlIHNhbWUgY2hhbGxlbmdlIHdpdGggYSB0cmlhbmdsZSBjb250YWluaW5nIG9uZS1odW5kcmVkIHJvd3M7IGl0IGNhbm5vdCBiZSBzb2x2ZWQgYnkgYnJ1dGUgZm9yY2UsIGFuZCByZXF1aXJlcyBhIGNsZXZlciBtZXRob2QhIDtvKVxyXG5cclxuXCJcIlwiXHJcblxyXG5tYXRoID0gcmVxdWlyZSBcIm1hdGhcIlxyXG5cclxudGVzdFB5cmFtaWQgPSBcIlwiXCJcclxuICAgICAgM1xyXG4gICAgIDcgNFxyXG4gICAgMiA0IDZcclxuICAgOCA1IDkgM1xyXG5cIlwiXCJcclxuXHJcbm1haW5QeXJhbWlkID0gXCJcIlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDc1XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA5NSAgNjRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAxNyAgNDcgIDgyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDE4ICAzNSAgODcgIDEwXHJcbiAgICAgICAgICAgICAgICAgICAgICAyMCAgMDQgIDgyICA0NyAgNjVcclxuICAgICAgICAgICAgICAgICAgICAxOSAgMDEgIDIzICA3NSAgMDMgIDM0XHJcbiAgICAgICAgICAgICAgICAgIDg4ICAwMiAgNzcgIDczICAwNyAgNjMgIDY3XHJcbiAgICAgICAgICAgICAgICA5OSAgNjUgIDA0ICAyOCAgMDYgIDE2ICA3MCAgOTJcclxuICAgICAgICAgICAgICA0MSAgNDEgIDI2ICA1NiAgODMgIDQwICA4MCAgNzAgIDMzXHJcbiAgICAgICAgICAgIDQxICA0OCAgNzIgIDMzICA0NyAgMzIgIDM3ICAxNiAgOTQgIDI5XHJcbiAgICAgICAgICA1MyAgNzEgIDQ0ICA2NSAgMjUgIDQzICA5MSAgNTIgIDk3ICA1MSAgMTRcclxuICAgICAgICA3MCAgMTEgIDMzICAyOCAgNzcgIDczICAxNyAgNzggIDM5ICA2OCAgMTcgIDU3XHJcbiAgICAgIDkxICA3MSAgNTIgIDM4ICAxNyAgMTQgIDkxICA0MyAgNTggIDUwICAyNyAgMjkgIDQ4XHJcbiAgICA2MyAgNjYgIDA0ICA2OCAgODkgIDUzICA2NyAgMzAgIDczICAxNiAgNjkgIDg3ICA0MCAgMzFcclxuICAwNCAgNjIgIDk4ICAyNyAgMjMgIDA5ICA3MCAgOTggIDczICA5MyAgMzggIDUzICA2MCAgMDQgIDIzXHJcblxyXG5cIlwiXCJcclxuXHJcbnN0cmluZ1RvUHlyYW1pZCA9IChzdHIpIC0+XHJcbiAgZGlnaXRzID0gKHBhcnNlSW50KGQpIGZvciBkIGluIFN0cmluZyhzdHIpLnJlcGxhY2UoL1xcbi9nLCBcIiBcIikuc3BsaXQoL1xccysvKS5maWx0ZXIgKHMpIC0+IHJldHVybiAocy5sZW5ndGggPiAwKSApXHJcbiAgZ3JpZCA9IFtdXHJcbiAgcm93ID0gMFxyXG4gIHdoaWxlIGRpZ2l0cy5sZW5ndGhcclxuICAgIGxlbiA9IHJvdyArIDFcclxuICAgIGEgPSBBcnJheShsZW4pXHJcbiAgICBmb3IgaSBpbiBbMC4uLmxlbl1cclxuICAgICAgYVtpXSA9IGRpZ2l0cy5zaGlmdCgpXHJcbiAgICBncmlkW3Jvd10gPSBhXHJcbiAgICByb3crK1xyXG4gIHJldHVybiBncmlkXHJcblxyXG4jIENydXNoZXMgdGhlIHB5cmFtaWQgZnJvbSBib3R0b20gdXAuIFdoZW4gaXQgaXMgYWxsIGRvbmUgY3J1c2hpbmcsIHRoZSB0b3Agb2YgdGhlIHB5cmFtaWQgaXMgdGhlIGFuc3dlci5cclxubWF4aW11bVBhdGhTdW0gPSAocHlyYW1pZFN0cmluZykgLT5cclxuICBweXJhbWlkID0gc3RyaW5nVG9QeXJhbWlkKHB5cmFtaWRTdHJpbmcpXHJcbiAgc3VtID0gMFxyXG4gIHJvdyA9IHB5cmFtaWQubGVuZ3RoIC0gMlxyXG4gIHdoaWxlIHJvdyA+PSAwXHJcbiAgICBmb3IgaSBpbiBbMC4ucm93XVxyXG4gICAgICBtYXhCZWxvdyA9IE1hdGgubWF4KHB5cmFtaWRbcm93KzFdW2ldLCBweXJhbWlkW3JvdysxXVtpKzFdKVxyXG4gICAgICBweXJhbWlkW3Jvd11baV0gKz0gbWF4QmVsb3dcclxuICAgIHJvdy0tXHJcbiAgcmV0dXJuIHB5cmFtaWRbMF1bMF1cclxuXHJcbnByb2JsZW0udGVzdCA9IC0+XHJcbiAgZXF1YWwobWF4aW11bVBhdGhTdW0odGVzdFB5cmFtaWQpLCAyMywgXCJtYXhpbXVtIHBhdGggc3VtIG9mIHRlc3QgdHJpYW5nbGUgaXMgMjNcIilcclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICBjb25zb2xlLmxvZyB3aW5kb3cuYXJnc1xyXG4gIHJldHVybiBtYXhpbXVtUGF0aFN1bShtYWluUHlyYW1pZClcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXHJcblxyXG5Qcm9ibGVtIDE5OiBDb3VudGluZyBTdW5kYXlzXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbllvdSBhcmUgZ2l2ZW4gdGhlIGZvbGxvd2luZyBpbmZvcm1hdGlvbiwgYnV0IHlvdSBtYXkgcHJlZmVyIHRvIGRvIHNvbWUgcmVzZWFyY2ggZm9yIHlvdXJzZWxmLlxyXG5cclxuKiAxIEphbiAxOTAwIHdhcyBhIE1vbmRheS5cclxuKiBUaGlydHkgZGF5cyBoYXMgU2VwdGVtYmVyLFxyXG4gIEFwcmlsLCBKdW5lIGFuZCBOb3ZlbWJlci5cclxuICBBbGwgdGhlIHJlc3QgaGF2ZSB0aGlydHktb25lLFxyXG4gIFNhdmluZyBGZWJydWFyeSBhbG9uZSxcclxuICBXaGljaCBoYXMgdHdlbnR5LWVpZ2h0LCByYWluIG9yIHNoaW5lLlxyXG4gIEFuZCBvbiBsZWFwIHllYXJzLCB0d2VudHktbmluZS5cclxuKiBBIGxlYXAgeWVhciBvY2N1cnMgb24gYW55IHllYXIgZXZlbmx5IGRpdmlzaWJsZSBieSA0LCBidXQgbm90IG9uIGEgY2VudHVyeSB1bmxlc3MgaXQgaXMgZGl2aXNpYmxlIGJ5IDQwMC5cclxuXHJcbkhvdyBtYW55IFN1bmRheXMgZmVsbCBvbiB0aGUgZmlyc3Qgb2YgdGhlIG1vbnRoIGR1cmluZyB0aGUgdHdlbnRpZXRoIGNlbnR1cnkgKDEgSmFuIDE5MDEgdG8gMzEgRGVjIDIwMDApP1xyXG5cclxuXCJcIlwiXHJcblxyXG5PTkVfREFZX0lOX01TID0gNjAgKiA2MCAqIDI0ICogMTAwMFxyXG5cclxuZGF5TmFtZXMgPSBcIlN1bmRheSBNb25kYXkgVHVlc2RheSBXZWRuZXNkYXkgVGh1cnNkYXkgRnJpZGF5IFNhdHVyZGF5XCIuc3BsaXQoL1xccysvKVxyXG5cclxuZGF5QW5kRGF0ZSA9ICh0aW1lc3RhbXApIC0+XHJcbiAgZCA9IG5ldyBEYXRlKHRpbWVzdGFtcClcclxuICByZXR1cm4gW2QuZ2V0RGF5KCksIGQuZ2V0RGF0ZSgpXVxyXG5cclxuZGF0ZVRvVGltZXN0YW1wID0gKHllYXIsIG1vbnRoLCBkYXkpIC0+XHJcbiAgcmV0dXJuIG5ldyBEYXRlKHllYXIsIG1vbnRoLCBkYXkpLmdldFRpbWUoKVxyXG5cclxucHJvYmxlbS50ZXN0ID0gLT5cclxuICB0cyA9IGRhdGVUb1RpbWVzdGFtcCgxOTAwLCAwLCAxKVxyXG4gIGVxdWFsKGRheUFuZERhdGUodHMpWzBdLCAxLCBcIjE5MDAvMS8xIHdhcyBhIE1vbmRheVwiKVxyXG5cclxuICBmb3IgZGF5IGluIFsyLi42XVxyXG4gICAgdHMgKz0gT05FX0RBWV9JTl9NU1xyXG4gICAgZGQgPSBkYXlBbmREYXRlKHRzKVxyXG4gICAgZXF1YWwoZGRbMF0sIGRheSwgXCJ0aGUgZm9sbG93aW5nIGRheSB3YXMgYSAje2RheU5hbWVzW2RheV19XCIpXHJcbiAgICBlcXVhbChkZFsxXSwgZGF5LCBcIi4uLiBhbmQgdGhlIGRhdGUgd2FzIDEvI3tkZFsxXX1cIilcclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICB0cyA9IGRhdGVUb1RpbWVzdGFtcCgxOTAxLCAwLCAxKVxyXG4gIGVuZHRzID0gZGF0ZVRvVGltZXN0YW1wKDIwMDAsIDExLCAzMSlcclxuXHJcbiAgc3VuZGF5Q291bnQgPSAwXHJcbiAgd2hpbGUgdHMgPCBlbmR0c1xyXG4gICAgZGQgPSBkYXlBbmREYXRlKHRzKVxyXG4gICAgaWYgKGRkWzBdID09IDApIGFuZCAoZGRbMV0gPT0gMSlcclxuICAgICAgc3VuZGF5Q291bnQrK1xyXG4gICAgdHMgKz0gT05FX0RBWV9JTl9NU1xyXG5cclxuICByZXR1cm4gc3VuZGF5Q291bnRcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXHJcblxyXG5Qcm9ibGVtIDIwOiBGYWN0b3JpYWwgZGlnaXQgc3VtXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbm4hIG1lYW5zIG4geCAobiDiiJIgMSkgeCAuLi4geCAzIHggMiB4IDFcclxuXHJcbkZvciBleGFtcGxlLCAxMCEgPSAxMCB4IDkgeCAuLi4geCAzIHggMiB4IDEgPSAzNjI4ODAwLFxyXG5hbmQgdGhlIHN1bSBvZiB0aGUgZGlnaXRzIGluIHRoZSBudW1iZXIgMTAhIGlzIDMgKyA2ICsgMiArIDggKyA4ICsgMCArIDAgPSAyNy5cclxuXHJcbkZpbmQgdGhlIHN1bSBvZiB0aGUgZGlnaXRzIGluIHRoZSBudW1iZXIgMTAwIVxyXG5cclxuXCJcIlwiXHJcblxyXG5iaWdJbnQgPSByZXF1aXJlIFwiYmlnLWludGVnZXJcIlxyXG5cclxuaHVnZUZhY3RvcmlhbCA9IChuKSAtPlxyXG4gIG51bWJlciA9IGJpZ0ludCgxKVxyXG4gIGZvciBpIGluIFsxLi5uXVxyXG4gICAgbnVtYmVyID0gbnVtYmVyLm11bHRpcGx5IGlcclxuICByZXR1cm4gbnVtYmVyXHJcblxyXG5zdW1PZkRpZ2l0cyA9IChuKSAtPlxyXG4gIGRpZ2l0cyA9IFN0cmluZyhuKVxyXG5cclxuICBzdW0gPSAwXHJcbiAgZm9yIGRpZ2l0IGluIGRpZ2l0c1xyXG4gICAgc3VtICs9IHBhcnNlSW50KGRpZ2l0KVxyXG5cclxuICByZXR1cm4gc3VtXHJcblxyXG5wcm9ibGVtLnRlc3QgPSAtPlxyXG4gIGVxdWFsKHN1bU9mRGlnaXRzKGh1Z2VGYWN0b3JpYWwoMTApKSwgMjcsIFwic3VtIG9mIGZhY3RvcmlhbCBkaWdpdHMgb2YgMTAhIGlzIDI3XCIpXHJcblxyXG5wcm9ibGVtLmFuc3dlciA9IC0+XHJcbiAgcmV0dXJuIHN1bU9mRGlnaXRzKGh1Z2VGYWN0b3JpYWwoMTAwKSlcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXHJcblxyXG5Qcm9ibGVtIDIxOiBBbWljYWJsZSBudW1iZXJzXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbkxldCBkKG4pIGJlIGRlZmluZWQgYXMgdGhlIHN1bSBvZiBwcm9wZXIgZGl2aXNvcnMgb2YgbiAobnVtYmVycyBsZXNzIHRoYW4gbiB3aGljaCBkaXZpZGUgZXZlbmx5IGludG8gbikuXHJcbklmIGQoYSkgPSBiIGFuZCBkKGIpID0gYSwgd2hlcmUgYSDiiaAgYiwgdGhlbiBhIGFuZCBiIGFyZSBhbiBhbWljYWJsZSBwYWlyIGFuZCBlYWNoIG9mIGEgYW5kIGIgYXJlIGNhbGxlZCBhbWljYWJsZSBudW1iZXJzLlxyXG5cclxuRm9yIGV4YW1wbGUsIHRoZSBwcm9wZXIgZGl2aXNvcnMgb2YgMjIwIGFyZSAxLCAyLCA0LCA1LCAxMCwgMTEsIDIwLCAyMiwgNDQsIDU1IGFuZCAxMTA7IHRoZXJlZm9yZSBkKDIyMCkgPSAyODQuIFRoZSBwcm9wZXIgZGl2aXNvcnMgb2YgMjg0IGFyZSAxLCAyLCA0LCA3MSBhbmQgMTQyOyBzbyBkKDI4NCkgPSAyMjAuXHJcblxyXG5FdmFsdWF0ZSB0aGUgc3VtIG9mIGFsbCB0aGUgYW1pY2FibGUgbnVtYmVycyB1bmRlciAxMDAwMC5cclxuXHJcblwiXCJcIlxyXG5cclxubWF0aCA9IHJlcXVpcmUgXCJtYXRoXCJcclxuYW1pY2FibGVDYWNoZSA9IG51bGxcclxuXHJcbmFtaWNhYmxlVmFsdWUgPSAobikgLT5cclxuICBpZiBhbWljYWJsZUNhY2hlLmhhc093blByb3BlcnR5KG4pXHJcbiAgICByZXR1cm4gYW1pY2FibGVDYWNoZVtuXVxyXG4gIHN1bSA9IDBcclxuICBmb3IgdiBpbiBtYXRoLmRpdmlzb3JzKG4pXHJcbiAgICBzdW0gKz0gdlxyXG4gIGFtaWNhYmxlQ2FjaGVbbl0gPSBzdW1cclxuICByZXR1cm4gc3VtXHJcblxyXG5wcm9ibGVtLnRlc3QgPSAtPlxyXG4gIGFtaWNhYmxlQ2FjaGUgPSB7fVxyXG4gIGVxdWFsKGFtaWNhYmxlVmFsdWUoMjIwKSwgMjg0LCBcImFtaWNhYmxlKDIyMCkgPT0gMjg0XCIpXHJcbiAgZXF1YWwoYW1pY2FibGVWYWx1ZSgyODQpLCAyMjAsIFwiYW1pY2FibGUoMjg0KSA9PSAyMjBcIilcclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICBhbWljYWJsZUNhY2hlID0ge31cclxuICBhbWljYWJsZVNlZW4gPSB7fVxyXG4gIGZvciBpIGluIFsyLi4uMTAwMDBdXHJcbiAgICBhID0gYW1pY2FibGVWYWx1ZShpKVxyXG4gICAgYiA9IGFtaWNhYmxlVmFsdWUoYSlcclxuICAgIGlmIChhICE9IGIpIGFuZCAoYiA9PSBpKVxyXG4gICAgICBhbWljYWJsZVNlZW5bYV0gPSB0cnVlXHJcbiAgICAgIGFtaWNhYmxlU2VlbltiXSA9IHRydWVcclxuXHJcbiAgYW1pY2FibGVOdW1iZXJzID0gKHBhcnNlSW50KHYpIGZvciB2IGluIE9iamVjdC5rZXlzKGFtaWNhYmxlU2VlbikpXHJcblxyXG4gIHN1bSA9IDBcclxuICBmb3IgdiBpbiBhbWljYWJsZU51bWJlcnNcclxuICAgIHN1bSArPSB2XHJcblxyXG4gIHJldHVybiBzdW1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXHJcblxyXG5Qcm9ibGVtIDIyOiBOYW1lcyBzY29yZXNcclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5Vc2luZyBuYW1lcy50eHQgKHJpZ2h0IGNsaWNrIGFuZCAnU2F2ZSBMaW5rL1RhcmdldCBBcy4uLicpLCBhIDQ2SyB0ZXh0IGZpbGUgY29udGFpbmluZyBvdmVyIGZpdmUtdGhvdXNhbmQgZmlyc3QgbmFtZXMsIGJlZ2luIGJ5IHNvcnRpbmcgaXQgaW50byBhbHBoYWJldGljYWwgb3JkZXIuIFRoZW4gd29ya2luZyBvdXQgdGhlIGFscGhhYmV0aWNhbCB2YWx1ZSBmb3IgZWFjaCBuYW1lLCBtdWx0aXBseSB0aGlzIHZhbHVlIGJ5IGl0cyBhbHBoYWJldGljYWwgcG9zaXRpb24gaW4gdGhlIGxpc3QgdG8gb2J0YWluIGEgbmFtZSBzY29yZS5cclxuXHJcbkZvciBleGFtcGxlLCB3aGVuIHRoZSBsaXN0IGlzIHNvcnRlZCBpbnRvIGFscGhhYmV0aWNhbCBvcmRlciwgQ09MSU4sIHdoaWNoIGlzIHdvcnRoIDMgKyAxNSArIDEyICsgOSArIDE0ID0gNTMsIGlzIHRoZSA5Mzh0aCBuYW1lIGluIHRoZSBsaXN0LiBTbywgQ09MSU4gd291bGQgb2J0YWluIGEgc2NvcmUgb2YgOTM4IMOXIDUzID0gNDk3MTQuXHJcblxyXG5XaGF0IGlzIHRoZSB0b3RhbCBvZiBhbGwgdGhlIG5hbWUgc2NvcmVzIGluIHRoZSBmaWxlP1xyXG5cclxuXCJcIlwiXHJcblxyXG5mcyA9IHJlcXVpcmUgXCJmc1wiXHJcblxyXG5yZWFkTmFtZXMgPSAtPlxyXG4gIHJhd05hbWVzID0gU3RyaW5nKGZzLnJlYWRGaWxlU3luYyhfX2Rpcm5hbWUgKyBcIi8uLi9kYXRhL25hbWVzLnR4dFwiKSlcclxuICBuYW1lcyA9IHJhd05hbWVzLnJlcGxhY2UoL1wiL2dtLCBcIlwiKS5zcGxpdChcIixcIilcclxuICByZXR1cm4gbmFtZXNcclxuXHJcbmFscGhhYmV0aWNhbFZhbHVlID0gKG5hbWUpIC0+XHJcbiAgc3VtID0gMFxyXG4gIGZvciBpIGluIFswLi4ubmFtZS5sZW5ndGhdXHJcbiAgICB2ID0gbmFtZS5jaGFyQ29kZUF0KGkpIC0gNjQgIyBBIGlzIDY1IGluIGFzY2lpLCBzbyB0aGlzIG1ha2VzIHRoZSB2YWx1ZSBvZiAnQScgPT0gMVxyXG4gICAgc3VtICs9IHZcclxuICByZXR1cm4gc3VtXHJcblxyXG5wcm9ibGVtLnRlc3QgPSAtPlxyXG4gIGVxdWFsKGFscGhhYmV0aWNhbFZhbHVlKFwiQ09MSU5cIiksIDUzLCBcImFscGhhYmV0aWNhbCB2YWx1ZSBmb3IgQ09MSU4gaXMgNTNcIilcclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICBuYW1lcyA9IHJlYWROYW1lcygpXHJcbiAgbmFtZXMuc29ydCgpXHJcblxyXG4gIHN1bSA9IDBcclxuICBmb3IgbmFtZSwgaSBpbiBuYW1lc1xyXG4gICAgdiA9IGFscGhhYmV0aWNhbFZhbHVlKG5hbWUpICogKGkgKyAxKVxyXG4gICAgc3VtICs9IHZcclxuICByZXR1cm4gc3VtXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxyXG5cclxuUHJvYmxlbSAyMzogTm9uLWFidW5kYW50IHN1bXNcclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbkEgcGVyZmVjdCBudW1iZXIgaXMgYSBudW1iZXIgZm9yIHdoaWNoIHRoZSBzdW0gb2YgaXRzIHByb3BlciBkaXZpc29ycyBpcyBleGFjdGx5IGVxdWFsIHRvIHRoZSBudW1iZXIuIEZvciBleGFtcGxlLCB0aGUgc3VtIG9mIHRoZSBwcm9wZXIgZGl2aXNvcnMgb2YgMjggd291bGQgYmUgMSArIDIgKyA0ICsgNyArIDE0ID0gMjgsIHdoaWNoIG1lYW5zIHRoYXQgMjggaXMgYSBwZXJmZWN0IG51bWJlci5cclxuXHJcbkEgbnVtYmVyIG4gaXMgY2FsbGVkIGRlZmljaWVudCBpZiB0aGUgc3VtIG9mIGl0cyBwcm9wZXIgZGl2aXNvcnMgaXMgbGVzcyB0aGFuIG4gYW5kIGl0IGlzIGNhbGxlZCBhYnVuZGFudCBpZiB0aGlzIHN1bSBleGNlZWRzIG4uXHJcblxyXG5BcyAxMiBpcyB0aGUgc21hbGxlc3QgYWJ1bmRhbnQgbnVtYmVyLCAxICsgMiArIDMgKyA0ICsgNiA9IDE2LCB0aGUgc21hbGxlc3QgbnVtYmVyIHRoYXQgY2FuIGJlIHdyaXR0ZW4gYXMgdGhlIHN1bSBvZiB0d28gYWJ1bmRhbnQgbnVtYmVycyBpcyAyNC4gQnkgbWF0aGVtYXRpY2FsIGFuYWx5c2lzLCBpdCBjYW4gYmUgc2hvd24gdGhhdCBhbGwgaW50ZWdlcnMgZ3JlYXRlciB0aGFuIDI4MTIzIGNhbiBiZSB3cml0dGVuIGFzIHRoZSBzdW0gb2YgdHdvIGFidW5kYW50IG51bWJlcnMuIEhvd2V2ZXIsIHRoaXMgdXBwZXIgbGltaXQgY2Fubm90IGJlIHJlZHVjZWQgYW55IGZ1cnRoZXIgYnkgYW5hbHlzaXMgZXZlbiB0aG91Z2ggaXQgaXMga25vd24gdGhhdCB0aGUgZ3JlYXRlc3QgbnVtYmVyIHRoYXQgY2Fubm90IGJlIGV4cHJlc3NlZCBhcyB0aGUgc3VtIG9mIHR3byBhYnVuZGFudCBudW1iZXJzIGlzIGxlc3MgdGhhbiB0aGlzIGxpbWl0LlxyXG5cclxuRmluZCB0aGUgc3VtIG9mIGFsbCB0aGUgcG9zaXRpdmUgaW50ZWdlcnMgd2hpY2ggY2Fubm90IGJlIHdyaXR0ZW4gYXMgdGhlIHN1bSBvZiB0d28gYWJ1bmRhbnQgbnVtYmVycy5cclxuXHJcblwiXCJcIlxyXG5cclxubWF0aCA9IHJlcXVpcmUgXCJtYXRoXCJcclxuXHJcbmRpdmlzb3JTdW0gPSAobikgLT5cclxuICByZXR1cm4gbWF0aC5zdW0obWF0aC5kaXZpc29ycyhuKSlcclxuXHJcbmlzQWJ1bmRhbnQgPSAobikgLT5cclxuICByZXR1cm4gKGRpdmlzb3JTdW0obikgPiBuKVxyXG5cclxuaXNQZXJmZWN0ID0gKG4pIC0+XHJcbiAgcmV0dXJuIChkaXZpc29yU3VtKG4pID09IG4pXHJcblxyXG5hYnVuZGFudExpc3QgPSAtPlxyXG4gIGxpc3QgPSBbXVxyXG4gIGZvciBuIGluIFsxLi4yODEyM11cclxuICAgIGlmIGlzQWJ1bmRhbnQobilcclxuICAgICAgbGlzdC5wdXNoIG5cclxuICByZXR1cm4gbGlzdFxyXG5cclxucHJvYmxlbS50ZXN0ID0gLT5cclxuICBlcXVhbChpc1BlcmZlY3QoMjgpLCB0cnVlLCBcIjI4IGlzIGEgcGVyZmVjdCBudW1iZXJcIilcclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICBsaXN0ID0gYWJ1bmRhbnRMaXN0KClcclxuICBjb25zb2xlLmxvZyBsaXN0XHJcbiAgc3VtT2ZBYnVuZGFudHNTZWVuID0ge31cclxuICBmb3IgaSBpbiBsaXN0XHJcbiAgICBmb3IgaiBpbiBsaXN0XHJcbiAgICAgIHN1bU9mQWJ1bmRhbnRzU2VlblsgaSArIGogXSA9IHRydWVcclxuXHJcbiAgc3VtID0gMFxyXG4gIGZvciBpIGluIFsxLi4yODEyM11cclxuICAgIGlmIG5vdCBzdW1PZkFidW5kYW50c1NlZW5baV1cclxuICAgICAgc3VtICs9IGlcclxuXHJcbiAgcmV0dXJuIHN1bVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcclxuXHJcblByb2JsZW0gMjQ6IExleGljb2dyYXBoaWMgcGVybXV0YXRpb25zXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5BIHBlcm11dGF0aW9uIGlzIGFuIG9yZGVyZWQgYXJyYW5nZW1lbnQgb2Ygb2JqZWN0cy4gRm9yIGV4YW1wbGUsIDMxMjQgaXMgb25lIHBvc3NpYmxlIHBlcm11dGF0aW9uIG9mIHRoZSBkaWdpdHMgMSwgMiwgMyBhbmQgNC4gSWYgYWxsIG9mIHRoZSBwZXJtdXRhdGlvbnMgYXJlIGxpc3RlZCBudW1lcmljYWxseSBvciBhbHBoYWJldGljYWxseSwgd2UgY2FsbCBpdCBsZXhpY29ncmFwaGljIG9yZGVyLiBUaGUgbGV4aWNvZ3JhcGhpYyBwZXJtdXRhdGlvbnMgb2YgMCwgMSBhbmQgMiBhcmU6XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgMDEyICAgMDIxICAgMTAyICAgMTIwICAgMjAxICAgMjEwXHJcblxyXG5XaGF0IGlzIHRoZSBtaWxsaW9udGggbGV4aWNvZ3JhcGhpYyBwZXJtdXRhdGlvbiBvZiB0aGUgZGlnaXRzIDAsIDEsIDIsIDMsIDQsIDUsIDYsIDcsIDggYW5kIDk/XHJcblxyXG5cIlwiXCJcclxuXHJcbiMgVGhpcyBmdW5jdGlvbiBpcyAtd2F5LSB0b28gc2xvd1xyXG5wZXJtdXRlID0gKGN1cnJlbnQsIHNyYywgZHN0KSAtPlxyXG4gIGZvciB2LGkgaW4gc3JjXHJcbiAgICBuZXdjdXJyZW50ID0gY3VycmVudCArIHZcclxuICAgIGlmIHNyYy5sZW5ndGggPiAxXHJcbiAgICAgIGxlZnRvdmVycyA9IHNyYy5zbGljZSgwKVxyXG4gICAgICBsZWZ0b3ZlcnMuc3BsaWNlKGksIDEpXHJcbiAgICAgIHBlcm11dGUgbmV3Y3VycmVudCwgbGVmdG92ZXJzLCBkc3RcclxuICAgIGVsc2VcclxuICAgICAgZHN0LnB1c2ggbmV3Y3VycmVudFxyXG5cclxubGV4UGVybXV0ZVNsb3cgPSAoY2hhcnMpIC0+XHJcbiAgZHN0ID0gW11cclxuICBwZXJtdXRlKFwiXCIsIGNoYXJzLnNwbGl0KFwiXCIpLCBkc3QpXHJcbiAgZHN0LnNvcnQoKVxyXG4gIHJldHVybiBkc3RcclxuXHJcbnN3YXAgPSAoYXJyLCBhLCBiKSAtPlxyXG4gIHQgPSBhcnJbYV1cclxuICBhcnJbYV0gPSBhcnJbYl1cclxuICBhcnJbYl0gPSB0XHJcblxyXG4jIERvbid0IGFzayBtZSwgYXNrIERpamtzdHJhJ3MgQSBEaXNjaXBsaW5lIG9mIFByb2dyYW1taW5nLCBwYWdlIDcxXHJcbmRpamtzdHJhUGVybXV0ZU5leHQgPSAoYXJyKSAtPlxyXG4gIGkgPSBhcnIubGVuZ3RoIC0gMVxyXG4gIHdoaWxlIGFycltpLTFdID49IGFycltpXVxyXG4gICAgaS0tXHJcblxyXG4gIGogPSBhcnIubGVuZ3RoXHJcbiAgd2hpbGUgYXJyW2otMV0gPD0gYXJyW2ktMV1cclxuICAgIGotLVxyXG5cclxuICBzd2FwIGFyciwgaS0xLCBqLTFcclxuXHJcbiAgaSsrXHJcbiAgaiA9IGFyci5sZW5ndGhcclxuICB3aGlsZSBpIDwgalxyXG4gICAgc3dhcCBhcnIsIGktMSwgai0xXHJcbiAgICBpKytcclxuICAgIGotLVxyXG5cclxubGV4UGVybXV0ZUZhc3QgPSAoY2hhcnMsIHdoaWNoKSAtPlxyXG4gIGFyciA9IChwYXJzZUludCh2KSBmb3IgdiBpbiBjaGFycylcclxuICBmb3IgaSBpbiBbMS4uLndoaWNoXVxyXG4gICAgZGlqa3N0cmFQZXJtdXRlTmV4dChhcnIpXHJcbiAgcmV0dXJuIGFyci5qb2luKFwiXCIpXHJcblxyXG5wcm9ibGVtLnRlc3QgPSAtPlxyXG4gIGVxdWFsKGxleFBlcm11dGVGYXN0KFwiMDEyXCIsIDQpLCBcIjEyMFwiLCBcIjR0aCBwZXJtdXRhdGlvbiBvZiAwMTIgaXMgMTIwLCBmYXN0IHZlcnNpb25cIilcclxuICBlcXVhbChsZXhQZXJtdXRlU2xvdyhcIjAxMlwiKSwgXCIwMTIgMDIxIDEwMiAxMjAgMjAxIDIxMFwiLnNwbGl0KFwiIFwiKSwgXCJwZXJtdXRhdGlvbiBvZiAwMTIgaXMgMDEyIDAyMSAxMDIgMTIwIDIwMSAyMTAsIHNsb3cgdmVyc2lvblwiKVxyXG5cclxucHJvYmxlbS5hbnN3ZXIgPSAtPlxyXG4gIHJldHVybiBsZXhQZXJtdXRlRmFzdChcIjAxMjM0NTY3ODlcIiwgMTAwMDAwMClcclxuXHJcbiAgIyBzbG93IHZlcnNpb24sIHRvb2sgfjEzIHNlY29uZHMgb24gYSAyMDE0IE1hY2Jvb2sgUHJvXHJcbiAgIyBkc3QgPSBsZXhQZXJtdXRlU2xvdyhcIjAxMjM0NTY3ODlcIilcclxuICAjIHJldHVybiBkc3RbOTk5OTk5XSAjIFswXSBpcyBmaXJzdCwgdGhlcmVmb3JlIFs5OTk5OTldIGlzIDEsMDAwLDAwMHRoXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxyXG5cclxuUHJvYmxlbSAyNTogMTAwMC1kaWdpdCBGaWJvbmFjY2kgbnVtYmVyXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuVGhlIEZpYm9uYWNjaSBzZXF1ZW5jZSBpcyBkZWZpbmVkIGJ5IHRoZSByZWN1cnJlbmNlIHJlbGF0aW9uOlxyXG5cclxuRihuKSA9IEYobuKIkjEpICsgRihu4oiSMiksIHdoZXJlIEYoMSkgPSAxIGFuZCBGKDIpID0gMS5cclxuSGVuY2UgdGhlIGZpcnN0IDEyIHRlcm1zIHdpbGwgYmU6XHJcblxyXG5GKDEpICA9IDFcclxuRigyKSAgPSAxXHJcbkYoMykgID0gMlxyXG5GKDQpICA9IDNcclxuRig1KSAgPSA1XHJcbkYoNikgID0gOFxyXG5GKDcpICA9IDEzXHJcbkYoOCkgID0gMjFcclxuRig5KSAgPSAzNFxyXG5GKDEwKSA9IDU1XHJcbkYoMTEpID0gODlcclxuRigxMikgPSAxNDRcclxuVGhlIDEydGggdGVybSwgRigxMiksIGlzIHRoZSBmaXJzdCB0ZXJtIHRvIGNvbnRhaW4gdGhyZWUgZGlnaXRzLlxyXG5cclxuV2hhdCBpcyB0aGUgZmlyc3QgdGVybSBpbiB0aGUgRmlib25hY2NpIHNlcXVlbmNlIHRvIGNvbnRhaW4gMTAwMCBkaWdpdHM/XHJcblxyXG5cIlwiXCJcclxuXHJcbmJpZ0ludCA9IHJlcXVpcmUgXCJiaWctaW50ZWdlclwiXHJcblxyXG5maXJzdEZpYm9XaXRoRGlnaXRDb3VudCA9IChuKSAtPlxyXG4gIGluZGV4ID0gMVxyXG4gIHByZXYgPSBuZXcgYmlnSW50KDApXHJcbiAgY3VyciA9IG5ldyBiaWdJbnQoMSlcclxuICBsb29wXHJcbiAgICBzdHIgPSBTdHJpbmcoY3VycilcclxuICAgIGRpZ2l0Q291bnQgPSBzdHIubGVuZ3RoXHJcbiAgICBpZiBkaWdpdENvdW50ID49IG5cclxuICAgICAgcmV0dXJuIFtpbmRleCwgc3RyXVxyXG4gICAgbmV4dCA9IGN1cnIucGx1cyhwcmV2KVxyXG4gICAgcHJldiA9IGN1cnJcclxuICAgIGN1cnIgPSBuZXh0XHJcbiAgICBpbmRleCsrXHJcblxyXG5wcm9ibGVtLnRlc3QgPSAtPlxyXG4gIGVxdWFsKGZpcnN0Rmlib1dpdGhEaWdpdENvdW50KDMpLCBbMTIsIFwiMTQ0XCJdLCBcImZpcnN0IGZpYm9uYWNjaSB3aXRoIDMgZGlnaXRzIGlzIEYoMTIpID0gMTQ0XCIpXHJcblxyXG5wcm9ibGVtLmFuc3dlciA9IC0+XHJcbiAgcmV0dXJuIGZpcnN0Rmlib1dpdGhEaWdpdENvdW50KDEwMDApXHJcbiIsInJvb3QgPSBleHBvcnRzID8gdGhpc1xyXG5cclxuIyBTaWV2ZSB3YXMgYmxpbmRseSB0YWtlbi9hZGFwdGVkIGZyb20gUm9zZXR0YUNvZGUuIERPTlQgRVZFTiBDQVJFXHJcbmNsYXNzIEluY3JlbWVudGFsU2lldmVcclxuICBjb25zdHJ1Y3RvcjogLT5cclxuICAgIEBuID0gMFxyXG5cclxuICBuZXh0OiAtPlxyXG4gICAgQG4gKz0gMlxyXG4gICAgaWYgQG4gPCA3XHJcbiAgICAgIGlmIEBuIDwgM1xyXG4gICAgICAgIEBuID0gMVxyXG4gICAgICAgIHJldHVybiAyXHJcbiAgICAgIGlmIEBuIDwgNVxyXG4gICAgICAgIHJldHVybiAzXHJcbiAgICAgIEBkaWN0ID0ge31cclxuICAgICAgQGJwcyA9IG5ldyBJbmNyZW1lbnRhbFNpZXZlKClcclxuICAgICAgQGJwcy5uZXh0KClcclxuICAgICAgQHAgPSBAYnBzLm5leHQoKVxyXG4gICAgICBAcSA9IEBwICogQHBcclxuICAgICAgcmV0dXJuIDVcclxuICAgIGVsc2VcclxuICAgICAgcyA9IEBkaWN0W0BuXVxyXG4gICAgICBpZiBub3Qgc1xyXG4gICAgICAgIGlmIEBuIDwgQHFcclxuICAgICAgICAgIHJldHVybiBAblxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIHAyID0gQHAgPDwgMVxyXG4gICAgICAgICAgQGRpY3RbQG4gKyBwMl0gPSBwMlxyXG4gICAgICAgICAgQHAgPSBAYnBzLm5leHQoKVxyXG4gICAgICAgICAgQHEgPSBAcCAqIEBwXHJcbiAgICAgICAgICByZXR1cm4gQG5leHQoKVxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgZGVsZXRlIEBkaWN0W0BuXVxyXG4gICAgICAgIG54dCA9IEBuICsgc1xyXG4gICAgICAgIHdoaWxlIChAZGljdFtueHRdKVxyXG4gICAgICAgICAgbnh0ICs9IHNcclxuICAgICAgICBAZGljdFtueHRdID0gc1xyXG4gICAgICAgIHJldHVybiBAbmV4dCgpXHJcblxyXG5yb290LkluY3JlbWVudGFsU2lldmUgPSBJbmNyZW1lbnRhbFNpZXZlXHJcblxyXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiMgU2hhbWVsZXNzbHkgcGlsZmVyZWQvYWRvcHRlZCBmcm9tIGh0dHA6Ly93d3cuamF2YXNjcmlwdGVyLm5ldC9mYXEvbnVtYmVyaXNwcmltZS5odG1cclxuXHJcbnJvb3QubGVhc3RGYWN0b3IgPSAobikgLT5cclxuICByZXR1cm4gTmFOIGlmIGlzTmFOKG4pIG9yIG5vdCBpc0Zpbml0ZShuKVxyXG4gIHJldHVybiAwIGlmIG4gPT0gMFxyXG4gIHJldHVybiAxIGlmIChuICUgMSkgIT0gMCBvciAobiAqIG4pIDwgMlxyXG4gIHJldHVybiAyIGlmIChuICUgMikgPT0gMFxyXG4gIHJldHVybiAzIGlmIChuICUgMykgPT0gMFxyXG4gIHJldHVybiA1IGlmIChuICUgNSkgPT0gMFxyXG5cclxuICBtID0gTWF0aC5zcXJ0IG5cclxuICBmb3IgaSBpbiBbNy4ubV0gYnkgMzBcclxuICAgIHJldHVybiBpICAgIGlmIChuICUgaSkgICAgICA9PSAwXHJcbiAgICByZXR1cm4gaSs0ICBpZiAobiAlIChpKzQpKSAgPT0gMFxyXG4gICAgcmV0dXJuIGkrNiAgaWYgKG4gJSAoaSs2KSkgID09IDBcclxuICAgIHJldHVybiBpKzEwIGlmIChuICUgKGkrMTApKSA9PSAwXHJcbiAgICByZXR1cm4gaSsxMiBpZiAobiAlIChpKzEyKSkgPT0gMFxyXG4gICAgcmV0dXJuIGkrMTYgaWYgKG4gJSAoaSsxNikpID09IDBcclxuICAgIHJldHVybiBpKzIyIGlmIChuICUgKGkrMjIpKSA9PSAwXHJcbiAgICByZXR1cm4gaSsyNCBpZiAobiAlIChpKzI0KSkgPT0gMFxyXG5cclxuICByZXR1cm4gblxyXG5cclxucm9vdC5pc1ByaW1lID0gKG4pIC0+XHJcbiAgaWYgaXNOYU4obikgb3Igbm90IGlzRmluaXRlKG4pIG9yIChuICUgMSkgIT0gMCBvciAobiA8IDIpXHJcbiAgICByZXR1cm4gZmFsc2VcclxuICBpZiBuID09IHJvb3QubGVhc3RGYWN0b3IobilcclxuICAgIHJldHVybiB0cnVlXHJcblxyXG4gIHJldHVybiBmYWxzZVxyXG5cclxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxucm9vdC5wcmltZUZhY3RvcnMgPSAobikgLT5cclxuICByZXR1cm4gWzFdIGlmIG4gPT0gMVxyXG5cclxuICBmYWN0b3JzID0gW11cclxuICB3aGlsZSBub3Qgcm9vdC5pc1ByaW1lKG4pXHJcbiAgICBmYWN0b3IgPSByb290LmxlYXN0RmFjdG9yKG4pXHJcbiAgICBmYWN0b3JzLnB1c2ggZmFjdG9yXHJcbiAgICBuIC89IGZhY3RvclxyXG4gIGZhY3RvcnMucHVzaCBuXHJcbiAgcmV0dXJuIGZhY3RvcnNcclxuXHJcbiMgVGhpcyBkb2VzIGEgYnJ1dGUtZm9yY2UgYXR0ZW1wdCBhdCBjb21iaW5pbmcgYWxsIG9mIHRoZSBwcmltZSBmYWN0b3JzICgyXm4gYXR0ZW1wdHMpLlxyXG4jIEknbSBzdXJlIHRoZXJlIGlzIGEgY29vbGVyIHdheS5cclxucm9vdC5kaXZpc29ycyA9IChuKSAtPlxyXG4gIHByaW1lcyA9IHJvb3QucHJpbWVGYWN0b3JzKG4pXHJcbiAgY29tYm9zVG9UcnkgPSBNYXRoLnBvdygyLCBwcmltZXMubGVuZ3RoKVxyXG4gIGZhY3RvcnNTZWVuID0ge31cclxuICBmb3IgYXR0ZW1wdCBpbiBbMC4uLmNvbWJvc1RvVHJ5XVxyXG4gICAgZmFjdG9yID0gMVxyXG4gICAgZm9yIHYsaSBpbiBwcmltZXNcclxuICAgICAgaWYgKGF0dGVtcHQgJiAoMSA8PCBpKSlcclxuICAgICAgICBmYWN0b3IgKj0gdlxyXG4gICAgaWYgZmFjdG9yIDwgblxyXG4gICAgICBmYWN0b3JzU2VlbltmYWN0b3JdID0gdHJ1ZVxyXG5cclxuICBkaXZpc29yTGlzdCA9IChwYXJzZUludCh2KSBmb3IgdiBpbiBPYmplY3Qua2V5cyhmYWN0b3JzU2VlbikpXHJcbiAgcmV0dXJuIGRpdmlzb3JMaXN0XHJcblxyXG5yb290LnN1bSA9IChudW1iZXJBcnJheSkgLT5cclxuICBzdW0gPSAwXHJcbiAgZm9yIG4gaW4gbnVtYmVyQXJyYXlcclxuICAgIHN1bSArPSBuXHJcbiAgcmV0dXJuIHN1bVxyXG5cclxucm9vdC5mYWN0b3JpYWwgPSAobikgLT5cclxuICBmID0gblxyXG4gIHdoaWxlIG4gPiAxXHJcbiAgICBuLS1cclxuICAgIGYgKj0gblxyXG4gIHJldHVybiBmXHJcblxyXG5yb290Lm5DciA9IChuLCByKSAtPlxyXG4gIHJldHVybiBNYXRoLmZsb29yKHJvb3QuZmFjdG9yaWFsKG4pIC8gKHJvb3QuZmFjdG9yaWFsKHIpICogcm9vdC5mYWN0b3JpYWwobiAtIHIpKSlcclxuIiwiTEFTVF9QUk9CTEVNID0gMjVcclxuXHJcbnJvb3QgPSB3aW5kb3cgIyBleHBvcnRzID8gdGhpc1xyXG5cclxucm9vdC5lc2NhcGVkU3RyaW5naWZ5ID0gKG8pIC0+XHJcbiAgc3RyID0gSlNPTi5zdHJpbmdpZnkobylcclxuICBzdHIgPSBzdHIucmVwbGFjZShcIl1cIiwgXCJcXFxcXVwiKVxyXG4gIHJldHVybiBzdHJcclxuXHJcbnJvb3QucnVuQWxsID0gLT5cclxuICBsYXN0UHV6emxlID0gTEFTVF9QUk9CTEVNXHJcbiAgbmV4dEluZGV4ID0gMFxyXG5cclxuICBsb2FkTmV4dFNjcmlwdCA9IC0+XHJcbiAgICBpZiBuZXh0SW5kZXggPCBsYXN0UHV6emxlXHJcbiAgICAgIG5leHRJbmRleCsrXHJcbiAgICAgIHJ1blRlc3QobmV4dEluZGV4LCBsb2FkTmV4dFNjcmlwdClcclxuICBsb2FkTmV4dFNjcmlwdCgpXHJcblxyXG5yb290Lml0ZXJhdGVQcm9ibGVtcyA9IChhcmdzKSAtPlxyXG5cclxuICBpbmRleFRvUHJvY2VzcyA9IG51bGxcclxuICBpZiBhcmdzLmVuZEluZGV4ID4gMFxyXG4gICAgaWYgYXJncy5zdGFydEluZGV4IDw9IGFyZ3MuZW5kSW5kZXhcclxuICAgICAgaW5kZXhUb1Byb2Nlc3MgPSBhcmdzLnN0YXJ0SW5kZXhcclxuICAgICAgYXJncy5zdGFydEluZGV4KytcclxuICBlbHNlXHJcbiAgICBpZiBhcmdzLmxpc3QubGVuZ3RoID4gMFxyXG4gICAgICBpbmRleFRvUHJvY2VzcyA9IGFyZ3MubGlzdC5zaGlmdCgpXHJcblxyXG4gIGlmIGluZGV4VG9Qcm9jZXNzICE9IG51bGxcclxuICAgIGl0ZXJhdGVOZXh0ID0gLT5cclxuICAgICAgd2luZG93LmFyZ3MgPSBhcmdzXHJcbiAgICAgIHJ1blRlc3QgaW5kZXhUb1Byb2Nlc3MsIC0+XHJcbiAgICAgICAgaXRlcmF0ZVByb2JsZW1zKGFyZ3MpXHJcbiAgICBpdGVyYXRlTmV4dCgpXHJcblxyXG5yb290LnJ1blRlc3QgPSAoaW5kZXgsIGNiKSAtPlxyXG4gIG1vZHVsZU5hbWUgPSBcImUjeygnMDAwJytpbmRleCkuc2xpY2UoLTMpfVwiXHJcbiAgd2luZG93LmluZGV4ID0gaW5kZXhcclxuICBwcm9ibGVtID0gcmVxdWlyZShtb2R1bGVOYW1lKVxyXG4gIHByb2JsZW0ucHJvY2VzcygpXHJcbiAgd2luZG93LnNldFRpbWVvdXQoY2IsIDApIGlmIGNiXHJcblxyXG5jbGFzcyBQcm9ibGVtXHJcbiAgY29uc3RydWN0b3I6IChAZGVzY3JpcHRpb24pIC0+XHJcbiAgICBAaW5kZXggPSB3aW5kb3cuaW5kZXhcclxuICAgIGxpbmVzID0gQGRlc2NyaXB0aW9uLnNwbGl0KC9cXG4vKVxyXG4gICAgbGluZXMuc2hpZnQoKSB3aGlsZSBsaW5lcy5sZW5ndGggPiAwIGFuZCBsaW5lc1swXS5sZW5ndGggPT0gMFxyXG4gICAgQHRpdGxlID0gbGluZXMuc2hpZnQoKVxyXG4gICAgQGxpbmUgPSBsaW5lcy5zaGlmdCgpXHJcbiAgICBAZGVzY3JpcHRpb24gPSBsaW5lcy5qb2luKFwiXFxuXCIpXHJcblxyXG4gIG5vdzogLT5cclxuICAgIHJldHVybiBpZiB3aW5kb3cucGVyZm9ybWFuY2UgdGhlbiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCkgZWxzZSBuZXcgRGF0ZSgpLmdldFRpbWUoKVxyXG5cclxuICBwcm9jZXNzOiAtPlxyXG4gICAgaWYgd2luZG93LmFyZ3MuZGVzY3JpcHRpb25cclxuICAgICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjNDQ0NDQ0O11fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX11cXG5cIlxyXG5cclxuICAgIGZvcm1hdHRlZFRpdGxlID0gJC50ZXJtaW5hbC5mb3JtYXQoXCJbWzsjZmZhYTAwO10je0B0aXRsZX1dXCIpXHJcbiAgICB1cmwgPSBcIj9jPSN7d2luZG93LmFyZ3MuY21kfV8je0BpbmRleH1cIlxyXG4gICAgaWYgd2luZG93LmFyZ3MudmVyYm9zZVxyXG4gICAgICB1cmwgKz0gXCJfdlwiXHJcbiAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIjxhIGhyZWY9XFxcIiN7dXJsfVxcXCI+I3tmb3JtYXR0ZWRUaXRsZX08L2E+XCIsIHsgcmF3OiB0cnVlIH1cclxuXHJcbiAgICBpZiB3aW5kb3cuYXJncy5kZXNjcmlwdGlvblxyXG4gICAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIltbOyM0NDQ0NDQ7XSN7QGxpbmV9XVwiXHJcbiAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2NjY2NlZTtdI3tAZGVzY3JpcHRpb259XVxcblwiXHJcbiAgICAgIHNvdXJjZUxpbmUgPSAkLnRlcm1pbmFsLmZvcm1hdChcIltbOyM0NDQ0NDQ7XVNvdXJjZTpdIFwiKVxyXG4gICAgICBzb3VyY2VMaW5lICs9IFwiIDxhIGhyZWY9XFxcInNyYy9lI3soJzAwMCcrQGluZGV4KS5zbGljZSgtMyl9LmNvZmZlZVxcXCI+XCIgKyAkLnRlcm1pbmFsLmZvcm1hdChcIltbOyM3NzMzMDA7XUxvY2FsXVwiKSArIFwiPC9hPiBcIlxyXG4gICAgICBzb3VyY2VMaW5lICs9ICQudGVybWluYWwuZm9ybWF0KFwiW1s7IzQ0NDQ0NDtdL11cIilcclxuICAgICAgc291cmNlTGluZSArPSBcIiA8YSBocmVmPVxcXCJodHRwczovL2dpdGh1Yi5jb20vam9lZHJhZ28vZXVsZXIvYmxvYi9tYXN0ZXIvc3JjL2UjeygnMDAwJytAaW5kZXgpLnNsaWNlKC0zKX0uY29mZmVlXFxcIj5cIiArICQudGVybWluYWwuZm9ybWF0KFwiW1s7Izc3MzMwMDtdR2l0aHViXVwiKSArIFwiPC9hPlwiXHJcbiAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIHNvdXJjZUxpbmUsIHsgcmF3OiB0cnVlIH1cclxuICAgICAgaWYgd2luZG93LmFyZ3MudGVzdCBvciB3aW5kb3cuYXJncy5hbnN3ZXJcclxuICAgICAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIlwiXHJcblxyXG4gICAgdGVzdEZ1bmMgPSBAdGVzdFxyXG4gICAgYW5zd2VyRnVuYyA9IEBhbnN3ZXJcclxuXHJcbiAgICBpZiB3aW5kb3cuYXJncy50ZXN0XHJcbiAgICAgIGlmIHRlc3RGdW5jID09IHVuZGVmaW5lZFxyXG4gICAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7IzQ0NDQ0NDtdIChubyB0ZXN0cyldXCJcclxuICAgICAgZWxzZVxyXG4gICAgICAgIHRlc3RGdW5jKClcclxuXHJcbiAgICBpZiB3aW5kb3cuYXJncy5hbnN3ZXJcclxuICAgICAgc3RhcnQgPSBAbm93KClcclxuICAgICAgYW5zd2VyID0gYW5zd2VyRnVuYygpXHJcbiAgICAgIGVuZCA9IEBub3coKVxyXG4gICAgICBtcyA9IGVuZCAtIHN0YXJ0XHJcbiAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2ZmZmZmZjtdIC0+IF1bWzsjYWFmZmFhO11BbnN3ZXI6XSAoW1s7I2FhZmZmZjtdI3ttcy50b0ZpeGVkKDEpfW1zXSk6IFtbOyNmZmZmZmY7XSN7ZXNjYXBlZFN0cmluZ2lmeShhbnN3ZXIpfV1cIlxyXG5cclxucm9vdC5Qcm9ibGVtID0gUHJvYmxlbVxyXG5cclxucm9vdC5vayA9ICh2LCBtc2cpIC0+XHJcbiAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjZmZmZmZmO10gKiAgXSN7dn06ICN7bXNnfVwiXHJcblxyXG5yb290LmVxdWFsID0gKGEsIGIsIG1zZykgLT5cclxuICBpZiAkLmlzQXJyYXkoYSkgYW5kICQuaXNBcnJheShiKVxyXG4gICAgaXNFcXVhbCA9IChhLmxlbmd0aCA9PSBiLmxlbmd0aClcclxuICAgIGlmIGlzRXF1YWxcclxuICAgICAgZm9yIGkgaW4gWzAuLi5hLmxlbmd0aF1cclxuICAgICAgICBpZiBhW2ldICE9IGJbaV1cclxuICAgICAgICAgIGlzRXF1YWwgPSBmYWxzZVxyXG4gICAgICAgICAgYnJlYWtcclxuICBlbHNlXHJcbiAgICBpc0VxdWFsID0gKGEgPT0gYilcclxuXHJcbiAgaWYgaXNFcXVhbFxyXG4gICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjZmZmZmZmO10gKiAgXVtbOyM1NTU1NTU7XVBBU1M6ICN7bXNnfV1cIlxyXG4gIGVsc2VcclxuICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2ZmZmZmZjtdICogIF1bWzsjZmZhYWFhO11GQUlMOiAje21zZ30gKCN7YX0gIT0gI3tifSldXCJcclxuXHJcbnJvb3Qub25Db21tYW5kID0gKGNvbW1hbmQpID0+XHJcbiAgcmV0dXJuIGlmIGNvbW1hbmQubGVuZ3RoID09IDBcclxuICBjbWQgPSAkLnRlcm1pbmFsLnBhcnNlQ29tbWFuZChjb21tYW5kKVxyXG4gIHJldHVybiBpZiBjbWQubmFtZS5sZW5ndGggPT0gMFxyXG5cclxuICBhcmdzID1cclxuICAgIHN0YXJ0SW5kZXg6IDBcclxuICAgIGVuZEluZGV4OiAwXHJcbiAgICBsaXN0OiBbXVxyXG4gICAgdmVyYm9zZTogZmFsc2VcclxuICAgIGRlc2NyaXB0aW9uOiBmYWxzZVxyXG4gICAgdGVzdDogZmFsc2VcclxuICAgIGFuc3dlcjogZmFsc2VcclxuXHJcbiAgcHJvY2VzcyA9IHRydWVcclxuXHJcbiAgZm9yIGFyZyBpbiBjbWQuYXJnc1xyXG4gICAgYXJnID0gU3RyaW5nKGFyZylcclxuICAgIGNvbnRpbnVlIGlmIGFyZy5sZW5ndGggPCAxXHJcbiAgICBpZiBhcmdbMF0gPT0gJ3YnXHJcbiAgICAgIGFyZ3MudmVyYm9zZSA9IHRydWVcclxuICAgIGVsc2UgaWYgYXJnLm1hdGNoKC9eXFxkKyQvKVxyXG4gICAgICB2ID0gcGFyc2VJbnQoYXJnKVxyXG4gICAgICBpZiAodiA+PSAxKSBhbmQgKHYgPD0gTEFTVF9QUk9CTEVNKVxyXG4gICAgICAgIGFyZ3MubGlzdC5wdXNoKHYpXHJcbiAgICAgIGVsc2VcclxuICAgICAgICBwcm9jZXNzID0gZmFsc2VcclxuICAgICAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIltbOyNmZmFhYWE7XU5vIHN1Y2ggdGVzdDogI3t2fSAodmFsaWQgdGVzdHMgMS0je0xBU1RfUFJPQkxFTX0pXVwiXHJcblxyXG4gIGlmIGFyZ3MubGlzdC5sZW5ndGggPT0gMFxyXG4gICAgYXJncy5zdGFydEluZGV4ID0gMVxyXG4gICAgYXJncy5lbmRJbmRleCA9IExBU1RfUFJPQkxFTVxyXG5cclxuICAjIFNpbmNlIGFsbCBvZiBvdXIgY29tbWFuZHMgaGFwcGVuIHRvIGhhdmUgdW5pcXVlIGZpcnN0IGxldHRlcnMsIGxldCBwZW9wbGUgYmUgc3VwZXIgbGF6eS9zaWxseVxyXG4gIGlmIGNtZC5uYW1lWzBdID09ICdsJ1xyXG4gICAgYXJncy5jbWQgPSBcImxpc3RcIlxyXG4gIGVsc2UgaWYgY21kLm5hbWVbMF0gPT0gJ2QnXHJcbiAgICBhcmdzLmNtZCA9IFwiZGVzY3JpYmVcIlxyXG4gICAgYXJncy5kZXNjcmlwdGlvbiA9IHRydWVcclxuICBlbHNlIGlmIGNtZC5uYW1lWzBdID09ICd0J1xyXG4gICAgYXJncy5jbWQgPSBcInRlc3RcIlxyXG4gICAgYXJncy50ZXN0ID0gdHJ1ZVxyXG4gIGVsc2UgaWYgY21kLm5hbWVbMF0gPT0gJ2EnXHJcbiAgICBhcmdzLmNtZCA9IFwiYW5zd2VyXCJcclxuICAgIGFyZ3MuYW5zd2VyID0gdHJ1ZVxyXG4gIGVsc2UgaWYgY21kLm5hbWVbMF0gPT0gJ3InXHJcbiAgICBhcmdzLmNtZCA9IFwicnVuXCJcclxuICAgIGFyZ3MudGVzdCA9IHRydWVcclxuICAgIGFyZ3MuYW5zd2VyID0gdHJ1ZVxyXG4gIGVsc2UgaWYgY21kLm5hbWVbMF0gPT0gJ3MnXHJcbiAgICBhcmdzLmNtZCA9IFwic2hvd1wiXHJcbiAgICBhcmdzLnRlc3QgPSB0cnVlXHJcbiAgICBhcmdzLmFuc3dlciA9IHRydWVcclxuICAgIGFyZ3MuZGVzY3JpcHRpb24gPSB0cnVlXHJcbiAgZWxzZSBpZiBjbWQubmFtZVswXSA9PSAnZCdcclxuICAgIGFyZ3MuY21kID0gXCJkZXNjcmliZVwiXHJcbiAgICBhcmdzLmRlc2NyaXB0aW9uID0gdHJ1ZVxyXG4gIGVsc2UgaWYgY21kLm5hbWVbMF0gPT0gJ2gnXHJcbiAgICBhcmdzLmNtZCA9IFwiaGVscFwiXHJcbiAgICBwcm9jZXNzID0gZmFsc2VcclxuICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiXCJcIlxyXG4gICAgQ29tbWFuZHM6XHJcblxyXG4gICAgICAgIGxpc3QgW1hdICAgICAtIExpc3QgcHJvYmxlbSB0aXRsZXNcclxuICAgICAgICBkZXNjcmliZSBbWF0gLSBEaXNwbGF5IGZ1bGwgcHJvYmxlbSBkZXNjcmlwdGlvbnNcclxuICAgICAgICB0ZXN0IFtYXSAgICAgLSBSdW4gdW5pdCB0ZXN0c1xyXG4gICAgICAgIGFuc3dlciBbWF0gICAtIFRpbWUgYW5kIGNhbGN1bGF0ZSBhbnN3ZXJcclxuICAgICAgICBydW4gW1hdICAgICAgLSB0ZXN0IGFuZCBhbnN3ZXIgY29tYmluZWRcclxuICAgICAgICBzaG93IFtYXSAgICAgLSBkZXNjcmliZSwgdGVzdCwgYW5kIGFuc3dlciBjb21iaW5lZFxyXG4gICAgICAgIGhlbHAgICAgICAgICAtIFRoaXMgaGVscFxyXG5cclxuICAgICAgICBJbiBhbGwgb2YgdGhlc2UsIFtYXSBjYW4gYmUgYSBsaXN0IG9mIG9uZSBvciBtb3JlIHByb2JsZW0gbnVtYmVycy4gKGEgdmFsdWUgZnJvbSAxIHRvICN7TEFTVF9QUk9CTEVNfSkuIElmIGFic2VudCwgaXQgaW1wbGllcyBhbGwgcHJvYmxlbXMuXHJcbiAgICAgICAgQWxzbywgYWRkaW5nIHRoZSB3b3JkIFwidmVyYm9zZVwiIHRvIHNvbWUgb2YgdGhlc2UgY29tbWFuZHMgd2lsbCBlbWl0IHRoZSBkZXNjcmlwdGlvbiBiZWZvcmUgcGVyZm9ybWluZyB0aGUgdGFzay5cclxuXHJcbiAgICBcIlwiXCJcclxuICBlbHNlXHJcbiAgICBwcm9jZXNzID0gZmFsc2VcclxuICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2ZmYWFhYTtdVW5rbm93biBjb21tYW5kLl1cIlxyXG5cclxuICBpZiBhcmdzLnZlcmJvc2VcclxuICAgIGFyZ3MuZGVzY3JpcHRpb24gPSB0cnVlXHJcblxyXG4gIGlmIHByb2Nlc3NcclxuICAgIGl0ZXJhdGVQcm9ibGVtcyhhcmdzKVxyXG4iXX0=
