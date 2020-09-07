require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS)
			return 62 // '+'
		if (code === SLASH)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

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
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var kMaxLength = 0x3fffffff

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Note:
 *
 * - Implementation must support adding new properties to `Uint8Array` instances.
 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *    incorrect length in some situations.
 *
 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they will
 * get the Object implementation, which is slower but will work correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = (function () {
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Find the length
  var length
  if (type === 'number')
    length = subject > 0 ? subject >>> 0 : 0
  else if (type === 'string') {
    if (encoding === 'base64')
      subject = base64clean(subject)
    length = Buffer.byteLength(subject, encoding)
  } else if (type === 'object' && subject !== null) { // assume object is array-like
    if (subject.type === 'Buffer' && isArray(subject.data))
      subject = subject.data
    length = +subject.length > 0 ? Math.floor(+subject.length) : 0
  } else
    throw new TypeError('must start with number, buffer, array or string')

  if (this.length > kMaxLength)
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
      'size: 0x' + kMaxLength.toString(16) + ' bytes')

  var buf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer.TYPED_ARRAY_SUPPORT && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    if (Buffer.isBuffer(subject)) {
      for (i = 0; i < length; i++)
        buf[i] = subject.readUInt8(i)
    } else {
      for (i = 0; i < length; i++)
        buf[i] = ((subject[i] % 256) + 256) % 256
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer.TYPED_ARRAY_SUPPORT && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

Buffer.isBuffer = function (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b))
    throw new TypeError('Arguments must be Buffers')

  var x = a.length
  var y = b.length
  for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
  if (i !== len) {
    x = a[i]
    y = b[i]
  }
  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function (list, totalLength) {
  if (!isArray(list)) throw new TypeError('Usage: Buffer.concat(list[, length])')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (totalLength === undefined) {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    case 'hex':
      ret = str.length >>> 1
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    default:
      ret = str.length
  }
  return ret
}

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function (encoding, start, end) {
  var loweredCase = false

  start = start >>> 0
  end = end === undefined || end === Infinity ? this.length : end >>> 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase)
          throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.equals = function (b) {
  if(!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max)
      str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  return Buffer.compare(this, b)
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
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

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(byte)) throw new Error('Invalid hex string')
    buf[offset + i] = byte
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function asciiWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function utf16leWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf16leToBytes(string), buf, offset, length, 2)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leWrite(this, string, offset, length)
      break
    default:
      throw new TypeError('Unknown encoding: ' + encoding)
  }
  return ret
}

Buffer.prototype.toJSON = function () {
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
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function binarySlice (buf, start, end) {
  return asciiSlice(buf, start, end)
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len;
    if (start < 0)
      start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0)
      end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start)
    end = start

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0)
    throw new RangeError('offset is not uint')
  if (offset + ext > length)
    throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
      ((this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      this[offset + 3])
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80))
    return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16) |
      (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
      (this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      (this[offset + 3])
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new TypeError('value is out of bounds')
  if (offset + ext > buf.length) throw new TypeError('index out of range')
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = value
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else objectWriteUInt16(this, value, offset, true)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else objectWriteUInt16(this, value, offset, false)
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = value
  } else objectWriteUInt32(this, value, offset, true)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else objectWriteUInt32(this, value, offset, false)
  return offset + 4
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = value
  return offset + 1
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else objectWriteUInt16(this, value, offset, true)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else objectWriteUInt16(this, value, offset, false)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else objectWriteUInt32(this, value, offset, true)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else objectWriteUInt32(this, value, offset, false)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new TypeError('value is out of bounds')
  if (offset + ext > buf.length) throw new TypeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert)
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert)
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  if (end < start) throw new TypeError('sourceEnd < sourceStart')
  if (target_start < 0 || target_start >= target.length)
    throw new TypeError('targetStart out of bounds')
  if (start < 0 || start >= source.length) throw new TypeError('sourceStart out of bounds')
  if (end < 0 || end > source.length) throw new TypeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < len; i++) {
      target[i + target_start] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new TypeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new TypeError('start out of bounds')
  if (end < 0 || end > this.length) throw new TypeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-z]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F) {
      byteArray.push(b)
    } else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++) {
        byteArray.push(parseInt(h[j], 16))
      }
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length, unitSize) {
  if (unitSize) length -= length % unitSize;
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

},{"base64-js":1,"ieee754":4,"is-array":5}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],"r1PLSq":[function(require,module,exports){
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
module.exports=require('r1PLSq');
},{}],"e002":[function(require,module,exports){
module.exports=require('78QEJ9');
},{}],"78QEJ9":[function(require,module,exports){
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


},{}],"HokIVh":[function(require,module,exports){
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


},{}],"e003":[function(require,module,exports){
module.exports=require('HokIVh');
},{}],"e004":[function(require,module,exports){
module.exports=require('ys3VZW');
},{}],"ys3VZW":[function(require,module,exports){
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
module.exports=require('8Y1Hkt');
},{}],"8Y1Hkt":[function(require,module,exports){
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


},{}],"e006":[function(require,module,exports){
module.exports=require('a5iprt');
},{}],"a5iprt":[function(require,module,exports){
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
module.exports=require('v+s2Qb');
},{}],"v+s2Qb":[function(require,module,exports){
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


},{"math":"LOkceL"}],"e008":[function(require,module,exports){
module.exports=require('4902rv');
},{}],"4902rv":[function(require,module,exports){
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
module.exports=require('w1omiu');
},{}],"w1omiu":[function(require,module,exports){
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


},{}],"VGQJ6S":[function(require,module,exports){
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


},{"math":"LOkceL"}],"e010":[function(require,module,exports){
module.exports=require('VGQJ6S');
},{}],"vx/pw5":[function(require,module,exports){
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


},{}],"e011":[function(require,module,exports){
module.exports=require('vx/pw5');
},{}],"rQq+26":[function(require,module,exports){
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


},{"math":"LOkceL"}],"e012":[function(require,module,exports){
module.exports=require('rQq+26');
},{}],"e013":[function(require,module,exports){
module.exports=require('rXvPaX');
},{}],"rXvPaX":[function(require,module,exports){
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


},{}],"e014":[function(require,module,exports){
module.exports=require('IzCSxj');
},{}],"IzCSxj":[function(require,module,exports){
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


},{}],"e015":[function(require,module,exports){
module.exports=require('tw5tjL');
},{}],"tw5tjL":[function(require,module,exports){
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


},{"math":"LOkceL"}],"e016":[function(require,module,exports){
module.exports=require('sw0MYO');
},{}],"sw0MYO":[function(require,module,exports){
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


},{"big-integer":2,"math":"LOkceL"}],"vMt2/H":[function(require,module,exports){
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
module.exports=require('vMt2/H');
},{}],"CrvzXL":[function(require,module,exports){
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


},{"math":"LOkceL"}],"e018":[function(require,module,exports){
module.exports=require('CrvzXL');
},{}],"e019":[function(require,module,exports){
module.exports=require('6zwIde');
},{}],"6zwIde":[function(require,module,exports){
var ONE_DAY_IN_MS, dateToTimestamp, dayAndDate, dayNames, problem;

module.exports = problem = new Problem("\nProblem 19: Counting Sundays\n----------------------------\n\nYou are given the following information, but you may prefer to do some research for yourself.\n\n* 1 Jan 1900 was a Monday.\n* Thirty days has September,\n  April, June and November.\n  All the rest have thirty-one,\n  Saving February alone,\n  Which has twenty-eight, rain or shine.\n  And on leap years, twenty-nine.\n* A leap year occurs on any year evenly divisible by 4, but not on a century unless it is divisible by 400.\n\nHow many Sundays fell on the first of the month during the twentieth century (1 Jan 1901 to 31 Dec 2000)?\n");

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
  var day, dd, ts, _i, _results;
  ts = dateToTimestamp(1900, 0, 1);
  equal(dayAndDate(ts)[0], 1, "1900/1/1 was a Monday");
  _results = [];
  for (day = _i = 2; _i <= 6; day = ++_i) {
    ts += ONE_DAY_IN_MS;
    dd = dayAndDate(ts);
    equal(dd[0], day, "the following day was a " + dayNames[day]);
    _results.push(equal(dd[1], day, "... and the date was 1/" + dd[1]));
  }
  return _results;
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
module.exports=require('/qCSFx');
},{}],"/qCSFx":[function(require,module,exports){
var bigInt, hugeFactorial, problem, sumOfDigits;

module.exports = problem = new Problem("\nProblem 20: Factorial digit sum\n-------------------------------\n\nn! means n x (n − 1) x ... x 3 x 2 x 1\n\nFor example, 10! = 10 x 9 x ... x 3 x 2 x 1 = 3628800,\nand the sum of the digits in the number 10! is 3 + 6 + 2 + 8 + 8 + 0 + 0 = 27.\n\nFind the sum of the digits in the number 100!\n");

bigInt = require("big-integer");

hugeFactorial = function(n) {
  var i, number, _i;
  number = bigInt(1);
  for (i = _i = 1; 1 <= n ? _i <= n : _i >= n; i = 1 <= n ? ++_i : --_i) {
    number = number.multiply(i);
  }
  return number;
};

sumOfDigits = function(n) {
  var digit, digits, sum, _i, _len;
  digits = String(n);
  sum = 0;
  for (_i = 0, _len = digits.length; _i < _len; _i++) {
    digit = digits[_i];
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


},{"big-integer":2}],"gFzaD8":[function(require,module,exports){
var amicableCache, amicableValue, math, problem;

module.exports = problem = new Problem("\nProblem 21: Amicable numbers\n----------------------------\n\nLet d(n) be defined as the sum of proper divisors of n (numbers less than n which divide evenly into n).\nIf d(a) = b and d(b) = a, where a ≠ b, then a and b are an amicable pair and each of a and b are called amicable numbers.\n\nFor example, the proper divisors of 220 are 1, 2, 4, 5, 10, 11, 20, 22, 44, 55 and 110; therefore d(220) = 284. The proper divisors of 284 are 1, 2, 4, 71 and 142; so d(284) = 220.\n\nEvaluate the sum of all the amicable numbers under 10000.\n");

math = require("math");

amicableCache = null;

amicableValue = function(n) {
  var sum, v, _i, _len, _ref;
  if (amicableCache.hasOwnProperty(n)) {
    return amicableCache[n];
  }
  sum = 0;
  _ref = math.divisors(n);
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    v = _ref[_i];
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
  var a, amicableNumbers, amicableSeen, b, i, sum, v, _i, _j, _len;
  amicableCache = {};
  amicableSeen = {};
  for (i = _i = 2; _i < 10000; i = ++_i) {
    a = amicableValue(i);
    b = amicableValue(a);
    if ((a !== b) && (b === i)) {
      amicableSeen[a] = true;
      amicableSeen[b] = true;
    }
  }
  amicableNumbers = (function() {
    var _j, _len, _ref, _results;
    _ref = Object.keys(amicableSeen);
    _results = [];
    for (_j = 0, _len = _ref.length; _j < _len; _j++) {
      v = _ref[_j];
      _results.push(parseInt(v));
    }
    return _results;
  })();
  sum = 0;
  for (_j = 0, _len = amicableNumbers.length; _j < _len; _j++) {
    v = amicableNumbers[_j];
    sum += v;
  }
  return sum;
};


},{"math":"LOkceL"}],"e021":[function(require,module,exports){
module.exports=require('gFzaD8');
},{}],"hIDUTM":[function(require,module,exports){
(function (Buffer){
var alphabeticalValue, fs, problem, readNames;

module.exports = problem = new Problem("\nProblem 22: Names scores\n------------------------\n\nUsing names.txt (right click and 'Save Link/Target As...'), a 46K text file containing over five-thousand first names, begin by sorting it into alphabetical order. Then working out the alphabetical value for each name, multiply this value by its alphabetical position in the list to obtain a name score.\n\nFor example, when the list is sorted into alphabetical order, COLIN, which is worth 3 + 15 + 12 + 9 + 14 = 53, is the 938th name in the list. So, COLIN would obtain a score of 938 × 53 = 49714.\n\nWhat is the total of all the name scores in the file?\n");



readNames = function() {
  var names, rawNames;
  rawNames = String(Buffer("Ik1BUlkiLCJQQVRSSUNJQSIsIkxJTkRBIiwiQkFSQkFSQSIsIkVMSVpBQkVUSCIsIkpFTk5JRkVSIiwiTUFSSUEiLCJTVVNBTiIsIk1BUkdBUkVUIiwiRE9ST1RIWSIsIkxJU0EiLCJOQU5DWSIsIktBUkVOIiwiQkVUVFkiLCJIRUxFTiIsIlNBTkRSQSIsIkRPTk5BIiwiQ0FST0wiLCJSVVRIIiwiU0hBUk9OIiwiTUlDSEVMTEUiLCJMQVVSQSIsIlNBUkFIIiwiS0lNQkVSTFkiLCJERUJPUkFIIiwiSkVTU0lDQSIsIlNISVJMRVkiLCJDWU5USElBIiwiQU5HRUxBIiwiTUVMSVNTQSIsIkJSRU5EQSIsIkFNWSIsIkFOTkEiLCJSRUJFQ0NBIiwiVklSR0lOSUEiLCJLQVRITEVFTiIsIlBBTUVMQSIsIk1BUlRIQSIsIkRFQlJBIiwiQU1BTkRBIiwiU1RFUEhBTklFIiwiQ0FST0xZTiIsIkNIUklTVElORSIsIk1BUklFIiwiSkFORVQiLCJDQVRIRVJJTkUiLCJGUkFOQ0VTIiwiQU5OIiwiSk9ZQ0UiLCJESUFORSIsIkFMSUNFIiwiSlVMSUUiLCJIRUFUSEVSIiwiVEVSRVNBIiwiRE9SSVMiLCJHTE9SSUEiLCJFVkVMWU4iLCJKRUFOIiwiQ0hFUllMIiwiTUlMRFJFRCIsIktBVEhFUklORSIsIkpPQU4iLCJBU0hMRVkiLCJKVURJVEgiLCJST1NFIiwiSkFOSUNFIiwiS0VMTFkiLCJOSUNPTEUiLCJKVURZIiwiQ0hSSVNUSU5BIiwiS0FUSFkiLCJUSEVSRVNBIiwiQkVWRVJMWSIsIkRFTklTRSIsIlRBTU1ZIiwiSVJFTkUiLCJKQU5FIiwiTE9SSSIsIlJBQ0hFTCIsIk1BUklMWU4iLCJBTkRSRUEiLCJLQVRIUllOIiwiTE9VSVNFIiwiU0FSQSIsIkFOTkUiLCJKQUNRVUVMSU5FIiwiV0FOREEiLCJCT05OSUUiLCJKVUxJQSIsIlJVQlkiLCJMT0lTIiwiVElOQSIsIlBIWUxMSVMiLCJOT1JNQSIsIlBBVUxBIiwiRElBTkEiLCJBTk5JRSIsIkxJTExJQU4iLCJFTUlMWSIsIlJPQklOIiwiUEVHR1kiLCJDUllTVEFMIiwiR0xBRFlTIiwiUklUQSIsIkRBV04iLCJDT05OSUUiLCJGTE9SRU5DRSIsIlRSQUNZIiwiRUROQSIsIlRJRkZBTlkiLCJDQVJNRU4iLCJST1NBIiwiQ0lORFkiLCJHUkFDRSIsIldFTkRZIiwiVklDVE9SSUEiLCJFRElUSCIsIktJTSIsIlNIRVJSWSIsIlNZTFZJQSIsIkpPU0VQSElORSIsIlRIRUxNQSIsIlNIQU5OT04iLCJTSEVJTEEiLCJFVEhFTCIsIkVMTEVOIiwiRUxBSU5FIiwiTUFSSk9SSUUiLCJDQVJSSUUiLCJDSEFSTE9UVEUiLCJNT05JQ0EiLCJFU1RIRVIiLCJQQVVMSU5FIiwiRU1NQSIsIkpVQU5JVEEiLCJBTklUQSIsIlJIT05EQSIsIkhBWkVMIiwiQU1CRVIiLCJFVkEiLCJERUJCSUUiLCJBUFJJTCIsIkxFU0xJRSIsIkNMQVJBIiwiTFVDSUxMRSIsIkpBTUlFIiwiSk9BTk5FIiwiRUxFQU5PUiIsIlZBTEVSSUUiLCJEQU5JRUxMRSIsIk1FR0FOIiwiQUxJQ0lBIiwiU1VaQU5ORSIsIk1JQ0hFTEUiLCJHQUlMIiwiQkVSVEhBIiwiREFSTEVORSIsIlZFUk9OSUNBIiwiSklMTCIsIkVSSU4iLCJHRVJBTERJTkUiLCJMQVVSRU4iLCJDQVRIWSIsIkpPQU5OIiwiTE9SUkFJTkUiLCJMWU5OIiwiU0FMTFkiLCJSRUdJTkEiLCJFUklDQSIsIkJFQVRSSUNFIiwiRE9MT1JFUyIsIkJFUk5JQ0UiLCJBVURSRVkiLCJZVk9OTkUiLCJBTk5FVFRFIiwiSlVORSIsIlNBTUFOVEhBIiwiTUFSSU9OIiwiREFOQSIsIlNUQUNZIiwiQU5BIiwiUkVORUUiLCJJREEiLCJWSVZJQU4iLCJST0JFUlRBIiwiSE9MTFkiLCJCUklUVEFOWSIsIk1FTEFOSUUiLCJMT1JFVFRBIiwiWU9MQU5EQSIsIkpFQU5FVFRFIiwiTEFVUklFIiwiS0FUSUUiLCJLUklTVEVOIiwiVkFORVNTQSIsIkFMTUEiLCJTVUUiLCJFTFNJRSIsIkJFVEgiLCJKRUFOTkUiLCJWSUNLSSIsIkNBUkxBIiwiVEFSQSIsIlJPU0VNQVJZIiwiRUlMRUVOIiwiVEVSUkkiLCJHRVJUUlVERSIsIkxVQ1kiLCJUT05ZQSIsIkVMTEEiLCJTVEFDRVkiLCJXSUxNQSIsIkdJTkEiLCJLUklTVElOIiwiSkVTU0lFIiwiTkFUQUxJRSIsIkFHTkVTIiwiVkVSQSIsIldJTExJRSIsIkNIQVJMRU5FIiwiQkVTU0lFIiwiREVMT1JFUyIsIk1FTElOREEiLCJQRUFSTCIsIkFSTEVORSIsIk1BVVJFRU4iLCJDT0xMRUVOIiwiQUxMSVNPTiIsIlRBTUFSQSIsIkpPWSIsIkdFT1JHSUEiLCJDT05TVEFOQ0UiLCJMSUxMSUUiLCJDTEFVRElBIiwiSkFDS0lFIiwiTUFSQ0lBIiwiVEFOWUEiLCJORUxMSUUiLCJNSU5OSUUiLCJNQVJMRU5FIiwiSEVJREkiLCJHTEVOREEiLCJMWURJQSIsIlZJT0xBIiwiQ09VUlRORVkiLCJNQVJJQU4iLCJTVEVMTEEiLCJDQVJPTElORSIsIkRPUkEiLCJKTyIsIlZJQ0tJRSIsIk1BVFRJRSIsIlRFUlJZIiwiTUFYSU5FIiwiSVJNQSIsIk1BQkVMIiwiTUFSU0hBIiwiTVlSVExFIiwiTEVOQSIsIkNIUklTVFkiLCJERUFOTkEiLCJQQVRTWSIsIkhJTERBIiwiR1dFTkRPTFlOIiwiSkVOTklFIiwiTk9SQSIsIk1BUkdJRSIsIk5JTkEiLCJDQVNTQU5EUkEiLCJMRUFIIiwiUEVOTlkiLCJLQVkiLCJQUklTQ0lMTEEiLCJOQU9NSSIsIkNBUk9MRSIsIkJSQU5EWSIsIk9MR0EiLCJCSUxMSUUiLCJESUFOTkUiLCJUUkFDRVkiLCJMRU9OQSIsIkpFTk5ZIiwiRkVMSUNJQSIsIlNPTklBIiwiTUlSSUFNIiwiVkVMTUEiLCJCRUNLWSIsIkJPQkJJRSIsIlZJT0xFVCIsIktSSVNUSU5BIiwiVE9OSSIsIk1JU1RZIiwiTUFFIiwiU0hFTExZIiwiREFJU1kiLCJSQU1PTkEiLCJTSEVSUkkiLCJFUklLQSIsIktBVFJJTkEiLCJDTEFJUkUiLCJMSU5EU0VZIiwiTElORFNBWSIsIkdFTkVWQSIsIkdVQURBTFVQRSIsIkJFTElOREEiLCJNQVJHQVJJVEEiLCJTSEVSWUwiLCJDT1JBIiwiRkFZRSIsIkFEQSIsIk5BVEFTSEEiLCJTQUJSSU5BIiwiSVNBQkVMIiwiTUFSR1VFUklURSIsIkhBVFRJRSIsIkhBUlJJRVQiLCJNT0xMWSIsIkNFQ0lMSUEiLCJLUklTVEkiLCJCUkFOREkiLCJCTEFOQ0hFIiwiU0FORFkiLCJST1NJRSIsIkpPQU5OQSIsIklSSVMiLCJFVU5JQ0UiLCJBTkdJRSIsIklORVoiLCJMWU5EQSIsIk1BREVMSU5FIiwiQU1FTElBIiwiQUxCRVJUQSIsIkdFTkVWSUVWRSIsIk1PTklRVUUiLCJKT0RJIiwiSkFOSUUiLCJNQUdHSUUiLCJLQVlMQSIsIlNPTllBIiwiSkFOIiwiTEVFIiwiS1JJU1RJTkUiLCJDQU5EQUNFIiwiRkFOTklFIiwiTUFSWUFOTiIsIk9QQUwiLCJBTElTT04iLCJZVkVUVEUiLCJNRUxPRFkiLCJMVVoiLCJTVVNJRSIsIk9MSVZJQSIsIkZMT1JBIiwiU0hFTExFWSIsIktSSVNUWSIsIk1BTUlFIiwiTFVMQSIsIkxPTEEiLCJWRVJOQSIsIkJFVUxBSCIsIkFOVE9JTkVUVEUiLCJDQU5ESUNFIiwiSlVBTkEiLCJKRUFOTkVUVEUiLCJQQU0iLCJLRUxMSSIsIkhBTk5BSCIsIldISVRORVkiLCJCUklER0VUIiwiS0FSTEEiLCJDRUxJQSIsIkxBVE9ZQSIsIlBBVFRZIiwiU0hFTElBIiwiR0FZTEUiLCJERUxMQSIsIlZJQ0tZIiwiTFlOTkUiLCJTSEVSSSIsIk1BUklBTk5FIiwiS0FSQSIsIkpBQ1FVRUxZTiIsIkVSTUEiLCJCTEFOQ0EiLCJNWVJBIiwiTEVUSUNJQSIsIlBBVCIsIktSSVNUQSIsIlJPWEFOTkUiLCJBTkdFTElDQSIsIkpPSE5OSUUiLCJST0JZTiIsIkZSQU5DSVMiLCJBRFJJRU5ORSIsIlJPU0FMSUUiLCJBTEVYQU5EUkEiLCJCUk9PS0UiLCJCRVRIQU5ZIiwiU0FESUUiLCJCRVJOQURFVFRFIiwiVFJBQ0kiLCJKT0RZIiwiS0VORFJBIiwiSkFTTUlORSIsIk5JQ0hPTEUiLCJSQUNIQUVMIiwiQ0hFTFNFQSIsIk1BQkxFIiwiRVJORVNUSU5FIiwiTVVSSUVMIiwiTUFSQ0VMTEEiLCJFTEVOQSIsIktSWVNUQUwiLCJBTkdFTElOQSIsIk5BRElORSIsIktBUkkiLCJFU1RFTExFIiwiRElBTk5BIiwiUEFVTEVUVEUiLCJMT1JBIiwiTU9OQSIsIkRPUkVFTiIsIlJPU0VNQVJJRSIsIkFOR0VMIiwiREVTSVJFRSIsIkFOVE9OSUEiLCJIT1BFIiwiR0lOR0VSIiwiSkFOSVMiLCJCRVRTWSIsIkNIUklTVElFIiwiRlJFREEiLCJNRVJDRURFUyIsIk1FUkVESVRIIiwiTFlORVRURSIsIlRFUkkiLCJDUklTVElOQSIsIkVVTEEiLCJMRUlHSCIsIk1FR0hBTiIsIlNPUEhJQSIsIkVMT0lTRSIsIlJPQ0hFTExFIiwiR1JFVENIRU4iLCJDRUNFTElBIiwiUkFRVUVMIiwiSEVOUklFVFRBIiwiQUxZU1NBIiwiSkFOQSIsIktFTExFWSIsIkdXRU4iLCJLRVJSWSIsIkpFTk5BIiwiVFJJQ0lBIiwiTEFWRVJORSIsIk9MSVZFIiwiQUxFWElTIiwiVEFTSEEiLCJTSUxWSUEiLCJFTFZJUkEiLCJDQVNFWSIsIkRFTElBIiwiU09QSElFIiwiS0FURSIsIlBBVFRJIiwiTE9SRU5BIiwiS0VMTElFIiwiU09OSkEiLCJMSUxBIiwiTEFOQSIsIkRBUkxBIiwiTUFZIiwiTUlORFkiLCJFU1NJRSIsIk1BTkRZIiwiTE9SRU5FIiwiRUxTQSIsIkpPU0VGSU5BIiwiSkVBTk5JRSIsIk1JUkFOREEiLCJESVhJRSIsIkxVQ0lBIiwiTUFSVEEiLCJGQUlUSCIsIkxFTEEiLCJKT0hBTk5BIiwiU0hBUkkiLCJDQU1JTExFIiwiVEFNSSIsIlNIQVdOQSIsIkVMSVNBIiwiRUJPTlkiLCJNRUxCQSIsIk9SQSIsIk5FVFRJRSIsIlRBQklUSEEiLCJPTExJRSIsIkpBSU1FIiwiV0lOSUZSRUQiLCJLUklTVElFIiwiTUFSSU5BIiwiQUxJU0hBIiwiQUlNRUUiLCJSRU5BIiwiTVlSTkEiLCJNQVJMQSIsIlRBTU1JRSIsIkxBVEFTSEEiLCJCT05JVEEiLCJQQVRSSUNFIiwiUk9OREEiLCJTSEVSUklFIiwiQURESUUiLCJGUkFOQ0lORSIsIkRFTE9SSVMiLCJTVEFDSUUiLCJBRFJJQU5BIiwiQ0hFUkkiLCJTSEVMQlkiLCJBQklHQUlMIiwiQ0VMRVNURSIsIkpFV0VMIiwiQ0FSQSIsIkFERUxFIiwiUkVCRUtBSCIsIkxVQ0lOREEiLCJET1JUSFkiLCJDSFJJUyIsIkVGRklFIiwiVFJJTkEiLCJSRUJBIiwiU0hBV04iLCJTQUxMSUUiLCJBVVJPUkEiLCJMRU5PUkEiLCJFVFRBIiwiTE9UVElFIiwiS0VSUkkiLCJUUklTSEEiLCJOSUtLSSIsIkVTVEVMTEEiLCJGUkFOQ0lTQ0EiLCJKT1NJRSIsIlRSQUNJRSIsIk1BUklTU0EiLCJLQVJJTiIsIkJSSVRUTkVZIiwiSkFORUxMRSIsIkxPVVJERVMiLCJMQVVSRUwiLCJIRUxFTkUiLCJGRVJOIiwiRUxWQSIsIkNPUklOTkUiLCJLRUxTRVkiLCJJTkEiLCJCRVRUSUUiLCJFTElTQUJFVEgiLCJBSURBIiwiQ0FJVExJTiIsIklOR1JJRCIsIklWQSIsIkVVR0VOSUEiLCJDSFJJU1RBIiwiR09MRElFIiwiQ0FTU0lFIiwiTUFVREUiLCJKRU5JRkVSIiwiVEhFUkVTRSIsIkZSQU5LSUUiLCJERU5BIiwiTE9STkEiLCJKQU5FVFRFIiwiTEFUT05ZQSIsIkNBTkRZIiwiTU9SR0FOIiwiQ09OU1VFTE8iLCJUQU1JS0EiLCJST1NFVFRBIiwiREVCT1JBIiwiQ0hFUklFIiwiUE9MTFkiLCJESU5BIiwiSkVXRUxMIiwiRkFZIiwiSklMTElBTiIsIkRPUk9USEVBIiwiTkVMTCIsIlRSVURZIiwiRVNQRVJBTlpBIiwiUEFUUklDQSIsIktJTUJFUkxFWSIsIlNIQU5OQSIsIkhFTEVOQSIsIkNBUk9MSU5BIiwiQ0xFTyIsIlNURUZBTklFIiwiUk9TQVJJTyIsIk9MQSIsIkpBTklORSIsIk1PTExJRSIsIkxVUEUiLCJBTElTQSIsIkxPVSIsIk1BUklCRUwiLCJTVVNBTk5FIiwiQkVUVEUiLCJTVVNBTkEiLCJFTElTRSIsIkNFQ0lMRSIsIklTQUJFTExFIiwiTEVTTEVZIiwiSk9DRUxZTiIsIlBBSUdFIiwiSk9OSSIsIlJBQ0hFTExFIiwiTEVPTEEiLCJEQVBITkUiLCJBTFRBIiwiRVNURVIiLCJQRVRSQSIsIkdSQUNJRUxBIiwiSU1PR0VORSIsIkpPTEVORSIsIktFSVNIQSIsIkxBQ0VZIiwiR0xFTk5BIiwiR0FCUklFTEEiLCJLRVJJIiwiVVJTVUxBIiwiTElaWklFIiwiS0lSU1RFTiIsIlNIQU5BIiwiQURFTElORSIsIk1BWVJBIiwiSkFZTkUiLCJKQUNMWU4iLCJHUkFDSUUiLCJTT05EUkEiLCJDQVJNRUxBIiwiTUFSSVNBIiwiUk9TQUxJTkQiLCJDSEFSSVRZIiwiVE9OSUEiLCJCRUFUUklaIiwiTUFSSVNPTCIsIkNMQVJJQ0UiLCJKRUFOSU5FIiwiU0hFRU5BIiwiQU5HRUxJTkUiLCJGUklFREEiLCJMSUxZIiwiUk9CQklFIiwiU0hBVU5BIiwiTUlMTElFIiwiQ0xBVURFVFRFIiwiQ0FUSExFRU4iLCJBTkdFTElBIiwiR0FCUklFTExFIiwiQVVUVU1OIiwiS0FUSEFSSU5FIiwiU1VNTUVSIiwiSk9ESUUiLCJTVEFDSSIsIkxFQSIsIkNIUklTVEkiLCJKSU1NSUUiLCJKVVNUSU5FIiwiRUxNQSIsIkxVRUxMQSIsIk1BUkdSRVQiLCJET01JTklRVUUiLCJTT0NPUlJPIiwiUkVORSIsIk1BUlRJTkEiLCJNQVJHTyIsIk1BVklTIiwiQ0FMTElFIiwiQk9CQkkiLCJNQVJJVFpBIiwiTFVDSUxFIiwiTEVBTk5FIiwiSkVBTk5JTkUiLCJERUFOQSIsIkFJTEVFTiIsIkxPUklFIiwiTEFET05OQSIsIldJTExBIiwiTUFOVUVMQSIsIkdBTEUiLCJTRUxNQSIsIkRPTExZIiwiU1lCSUwiLCJBQkJZIiwiTEFSQSIsIkRBTEUiLCJJVlkiLCJERUUiLCJXSU5OSUUiLCJNQVJDWSIsIkxVSVNBIiwiSkVSSSIsIk1BR0RBTEVOQSIsIk9GRUxJQSIsIk1FQUdBTiIsIkFVRFJBIiwiTUFUSUxEQSIsIkxFSUxBIiwiQ09STkVMSUEiLCJCSUFOQ0EiLCJTSU1PTkUiLCJCRVRUWUUiLCJSQU5ESSIsIlZJUkdJRSIsIkxBVElTSEEiLCJCQVJCUkEiLCJHRU9SR0lOQSIsIkVMSVpBIiwiTEVBTk4iLCJCUklER0VUVEUiLCJSSE9EQSIsIkhBTEVZIiwiQURFTEEiLCJOT0xBIiwiQkVSTkFESU5FIiwiRkxPU1NJRSIsIklMQSIsIkdSRVRBIiwiUlVUSElFIiwiTkVMREEiLCJNSU5FUlZBIiwiTElMTFkiLCJURVJSSUUiLCJMRVRIQSIsIkhJTEFSWSIsIkVTVEVMQSIsIlZBTEFSSUUiLCJCUklBTk5BIiwiUk9TQUxZTiIsIkVBUkxJTkUiLCJDQVRBTElOQSIsIkFWQSIsIk1JQSIsIkNMQVJJU1NBIiwiTElESUEiLCJDT1JSSU5FIiwiQUxFWEFORFJJQSIsIkNPTkNFUENJT04iLCJUSUEiLCJTSEFSUk9OIiwiUkFFIiwiRE9OQSIsIkVSSUNLQSIsIkpBTUkiLCJFTE5PUkEiLCJDSEFORFJBIiwiTEVOT1JFIiwiTkVWQSIsIk1BUllMT1UiLCJNRUxJU0EiLCJUQUJBVEhBIiwiU0VSRU5BIiwiQVZJUyIsIkFMTElFIiwiU09GSUEiLCJKRUFOSUUiLCJPREVTU0EiLCJOQU5OSUUiLCJIQVJSSUVUVCIsIkxPUkFJTkUiLCJQRU5FTE9QRSIsIk1JTEFHUk9TIiwiRU1JTElBIiwiQkVOSVRBIiwiQUxMWVNPTiIsIkFTSExFRSIsIlRBTklBIiwiVE9NTUlFIiwiRVNNRVJBTERBIiwiS0FSSU5BIiwiRVZFIiwiUEVBUkxJRSIsIlpFTE1BIiwiTUFMSU5EQSIsIk5PUkVFTiIsIlRBTUVLQSIsIlNBVU5EUkEiLCJISUxMQVJZIiwiQU1JRSIsIkFMVEhFQSIsIlJPU0FMSU5EQSIsIkpPUkRBTiIsIkxJTElBIiwiQUxBTkEiLCJHQVkiLCJDTEFSRSIsIkFMRUpBTkRSQSIsIkVMSU5PUiIsIk1JQ0hBRUwiLCJMT1JSSUUiLCJKRVJSSSIsIkRBUkNZIiwiRUFSTkVTVElORSIsIkNBUk1FTExBIiwiVEFZTE9SIiwiTk9FTUkiLCJNQVJDSUUiLCJMSVpBIiwiQU5OQUJFTExFIiwiTE9VSVNBIiwiRUFSTEVORSIsIk1BTExPUlkiLCJDQVJMRU5FIiwiTklUQSIsIlNFTEVOQSIsIlRBTklTSEEiLCJLQVRZIiwiSlVMSUFOTkUiLCJKT0hOIiwiTEFLSVNIQSIsIkVEV0lOQSIsIk1BUklDRUxBIiwiTUFSR0VSWSIsIktFTllBIiwiRE9MTElFIiwiUk9YSUUiLCJST1NMWU4iLCJLQVRIUklORSIsIk5BTkVUVEUiLCJDSEFSTUFJTkUiLCJMQVZPTk5FIiwiSUxFTkUiLCJLUklTIiwiVEFNTUkiLCJTVVpFVFRFIiwiQ09SSU5FIiwiS0FZRSIsIkpFUlJZIiwiTUVSTEUiLCJDSFJZU1RBTCIsIkxJTkEiLCJERUFOTkUiLCJMSUxJQU4iLCJKVUxJQU5BIiwiQUxJTkUiLCJMVUFOTiIsIktBU0VZIiwiTUFSWUFOTkUiLCJFVkFOR0VMSU5FIiwiQ09MRVRURSIsIk1FTFZBIiwiTEFXQU5EQSIsIllFU0VOSUEiLCJOQURJQSIsIk1BREdFIiwiS0FUSElFIiwiRURESUUiLCJPUEhFTElBIiwiVkFMRVJJQSIsIk5PTkEiLCJNSVRaSSIsIk1BUkkiLCJHRU9SR0VUVEUiLCJDTEFVRElORSIsIkZSQU4iLCJBTElTU0EiLCJST1NFQU5OIiwiTEFLRUlTSEEiLCJTVVNBTk5BIiwiUkVWQSIsIkRFSURSRSIsIkNIQVNJVFkiLCJTSEVSRUUiLCJDQVJMWSIsIkpBTUVTIiwiRUxWSUEiLCJBTFlDRSIsIkRFSVJEUkUiLCJHRU5BIiwiQlJJQU5BIiwiQVJBQ0VMSSIsIktBVEVMWU4iLCJST1NBTk5FIiwiV0VOREkiLCJURVNTQSIsIkJFUlRBIiwiTUFSVkEiLCJJTUVMREEiLCJNQVJJRVRUQSIsIk1BUkNJIiwiTEVPTk9SIiwiQVJMSU5FIiwiU0FTSEEiLCJNQURFTFlOIiwiSkFOTkEiLCJKVUxJRVRURSIsIkRFRU5BIiwiQVVSRUxJQSIsIkpPU0VGQSIsIkFVR1VTVEEiLCJMSUxJQU5BIiwiWU9VTkciLCJDSFJJU1RJQU4iLCJMRVNTSUUiLCJBTUFMSUEiLCJTQVZBTk5BSCIsIkFOQVNUQVNJQSIsIlZJTE1BIiwiTkFUQUxJQSIsIlJPU0VMTEEiLCJMWU5ORVRURSIsIkNPUklOQSIsIkFMRlJFREEiLCJMRUFOTkEiLCJDQVJFWSIsIkFNUEFSTyIsIkNPTEVFTiIsIlRBTVJBIiwiQUlTSEEiLCJXSUxEQSIsIktBUllOIiwiQ0hFUlJZIiwiUVVFRU4iLCJNQVVSQSIsIk1BSSIsIkVWQU5HRUxJTkEiLCJST1NBTk5BIiwiSEFMTElFIiwiRVJOQSIsIkVOSUQiLCJNQVJJQU5BIiwiTEFDWSIsIkpVTElFVCIsIkpBQ0tMWU4iLCJGUkVJREEiLCJNQURFTEVJTkUiLCJNQVJBIiwiSEVTVEVSIiwiQ0FUSFJZTiIsIkxFTElBIiwiQ0FTQU5EUkEiLCJCUklER0VUVCIsIkFOR0VMSVRBIiwiSkFOTklFIiwiRElPTk5FIiwiQU5OTUFSSUUiLCJLQVRJTkEiLCJCRVJZTCIsIlBIT0VCRSIsIk1JTExJQ0VOVCIsIktBVEhFUllOIiwiRElBTk4iLCJDQVJJU1NBIiwiTUFSWUVMTEVOIiwiTElaIiwiTEFVUkkiLCJIRUxHQSIsIkdJTERBIiwiQURSSUFOIiwiUkhFQSIsIk1BUlFVSVRBIiwiSE9MTElFIiwiVElTSEEiLCJUQU1FUkEiLCJBTkdFTElRVUUiLCJGUkFOQ0VTQ0EiLCJCUklUTkVZIiwiS0FJVExJTiIsIkxPTElUQSIsIkZMT1JJTkUiLCJST1dFTkEiLCJSRVlOQSIsIlRXSUxBIiwiRkFOTlkiLCJKQU5FTEwiLCJJTkVTIiwiQ09OQ0VUVEEiLCJCRVJUSUUiLCJBTEJBIiwiQlJJR0lUVEUiLCJBTFlTT04iLCJWT05EQSIsIlBBTlNZIiwiRUxCQSIsIk5PRUxMRSIsIkxFVElUSUEiLCJLSVRUWSIsIkRFQU5OIiwiQlJBTkRJRSIsIkxPVUVMTEEiLCJMRVRBIiwiRkVMRUNJQSIsIlNIQVJMRU5FIiwiTEVTQSIsIkJFVkVSTEVZIiwiUk9CRVJUIiwiSVNBQkVMTEEiLCJIRVJNSU5JQSIsIlRFUlJBIiwiQ0VMSU5BIiwiVE9SSSIsIk9DVEFWSUEiLCJKQURFIiwiREVOSUNFIiwiR0VSTUFJTkUiLCJTSUVSUkEiLCJNSUNIRUxMIiwiQ09SVE5FWSIsIk5FTExZIiwiRE9SRVRIQSIsIlNZRE5FWSIsIkRFSURSQSIsIk1PTklLQSIsIkxBU0hPTkRBIiwiSlVESSIsIkNIRUxTRVkiLCJBTlRJT05FVFRFIiwiTUFSR09UIiwiQk9CQlkiLCJBREVMQUlERSIsIk5BTiIsIkxFRUFOTiIsIkVMSVNIQSIsIkRFU1NJRSIsIkxJQkJZIiwiS0FUSEkiLCJHQVlMQSIsIkxBVEFOWUEiLCJNSU5BIiwiTUVMTElTQSIsIktJTUJFUkxFRSIsIkpBU01JTiIsIlJFTkFFIiwiWkVMREEiLCJFTERBIiwiTUEiLCJKVVNUSU5BIiwiR1VTU0lFIiwiRU1JTElFIiwiQ0FNSUxMQSIsIkFCQklFIiwiUk9DSU8iLCJLQUlUTFlOIiwiSkVTU0UiLCJFRFlUSEUiLCJBU0hMRUlHSCIsIlNFTElOQSIsIkxBS0VTSEEiLCJHRVJJIiwiQUxMRU5FIiwiUEFNQUxBIiwiTUlDSEFFTEEiLCJEQVlOQSIsIkNBUllOIiwiUk9TQUxJQSIsIlNVTiIsIkpBQ1FVTElORSIsIlJFQkVDQSIsIk1BUllCRVRIIiwiS1JZU1RMRSIsIklPTEEiLCJET1RUSUUiLCJCRU5OSUUiLCJCRUxMRSIsIkFVQlJFWSIsIkdSSVNFTERBIiwiRVJORVNUSU5BIiwiRUxJREEiLCJBRFJJQU5ORSIsIkRFTUVUUklBIiwiREVMTUEiLCJDSE9ORyIsIkpBUVVFTElORSIsIkRFU1RJTlkiLCJBUkxFRU4iLCJWSVJHSU5BIiwiUkVUSEEiLCJGQVRJTUEiLCJUSUxMSUUiLCJFTEVBTk9SRSIsIkNBUkkiLCJUUkVWQSIsIkJJUkRJRSIsIldJTEhFTE1JTkEiLCJST1NBTEVFIiwiTUFVUklORSIsIkxBVFJJQ0UiLCJZT05HIiwiSkVOQSIsIlRBUllOIiwiRUxJQSIsIkRFQkJZIiwiTUFVRElFIiwiSkVBTk5BIiwiREVMSUxBSCIsIkNBVFJJTkEiLCJTSE9OREEiLCJIT1JURU5DSUEiLCJUSEVPRE9SQSIsIlRFUkVTSVRBIiwiUk9CQklOIiwiREFORVRURSIsIk1BUllKQU5FIiwiRlJFRERJRSIsIkRFTFBISU5FIiwiQlJJQU5ORSIsIk5JTERBIiwiREFOTkEiLCJDSU5ESSIsIkJFU1MiLCJJT05BIiwiSEFOTkEiLCJBUklFTCIsIldJTk9OQSIsIlZJREEiLCJST1NJVEEiLCJNQVJJQU5OQSIsIldJTExJQU0iLCJSQUNIRUFMIiwiR1VJTExFUk1JTkEiLCJFTE9JU0EiLCJDRUxFU1RJTkUiLCJDQVJFTiIsIk1BTElTU0EiLCJMT05BIiwiQ0hBTlRFTCIsIlNIRUxMSUUiLCJNQVJJU0VMQSIsIkxFT1JBIiwiQUdBVEhBIiwiU09MRURBRCIsIk1JR0RBTElBIiwiSVZFVFRFIiwiQ0hSSVNURU4iLCJBVEhFTkEiLCJKQU5FTCIsIkNITE9FIiwiVkVEQSIsIlBBVFRJRSIsIlRFU1NJRSIsIlRFUkEiLCJNQVJJTFlOTiIsIkxVQ1JFVElBIiwiS0FSUklFIiwiRElOQUgiLCJEQU5JRUxBIiwiQUxFQ0lBIiwiQURFTElOQSIsIlZFUk5JQ0UiLCJTSElFTEEiLCJQT1JUSUEiLCJNRVJSWSIsIkxBU0hBV04iLCJERVZPTiIsIkRBUkEiLCJUQVdBTkEiLCJPTUEiLCJWRVJEQSIsIkNIUklTVElOIiwiQUxFTkUiLCJaRUxMQSIsIlNBTkRJIiwiUkFGQUVMQSIsIk1BWUEiLCJLSVJBIiwiQ0FORElEQSIsIkFMVklOQSIsIlNVWkFOIiwiU0hBWUxBIiwiTFlOIiwiTEVUVElFIiwiQUxWQSIsIlNBTUFUSEEiLCJPUkFMSUEiLCJNQVRJTERFIiwiTUFET05OQSIsIkxBUklTU0EiLCJWRVNUQSIsIlJFTklUQSIsIklORElBIiwiREVMT0lTIiwiU0hBTkRBIiwiUEhJTExJUyIsIkxPUlJJIiwiRVJMSU5EQSIsIkNSVVoiLCJDQVRIUklORSIsIkJBUkIiLCJaT0UiLCJJU0FCRUxMIiwiSU9ORSIsIkdJU0VMQSIsIkNIQVJMSUUiLCJWQUxFTkNJQSIsIlJPWEFOTkEiLCJNQVlNRSIsIktJU0hBIiwiRUxMSUUiLCJNRUxMSVNTQSIsIkRPUlJJUyIsIkRBTElBIiwiQkVMTEEiLCJBTk5FVFRBIiwiWk9JTEEiLCJSRVRBIiwiUkVJTkEiLCJMQVVSRVRUQSIsIktZTElFIiwiQ0hSSVNUQUwiLCJQSUxBUiIsIkNIQVJMQSIsIkVMSVNTQSIsIlRJRkZBTkkiLCJUQU5BIiwiUEFVTElOQSIsIkxFT1RBIiwiQlJFQU5OQSIsIkpBWU1FIiwiQ0FSTUVMIiwiVkVSTkVMTCIsIlRPTUFTQSIsIk1BTkRJIiwiRE9NSU5HQSIsIlNBTlRBIiwiTUVMT0RJRSIsIkxVUkEiLCJBTEVYQSIsIlRBTUVMQSIsIlJZQU4iLCJNSVJOQSIsIktFUlJJRSIsIlZFTlVTIiwiTk9FTCIsIkZFTElDSVRBIiwiQ1JJU1RZIiwiQ0FSTUVMSVRBIiwiQkVSTklFQ0UiLCJBTk5FTUFSSUUiLCJUSUFSQSIsIlJPU0VBTk5FIiwiTUlTU1kiLCJDT1JJIiwiUk9YQU5BIiwiUFJJQ0lMTEEiLCJLUklTVEFMIiwiSlVORyIsIkVMWVNFIiwiSEFZREVFIiwiQUxFVEhBIiwiQkVUVElOQSIsIk1BUkdFIiwiR0lMTElBTiIsIkZJTE9NRU5BIiwiQ0hBUkxFUyIsIlpFTkFJREEiLCJIQVJSSUVUVEUiLCJDQVJJREFEIiwiVkFEQSIsIlVOQSIsIkFSRVRIQSIsIlBFQVJMSU5FIiwiTUFSSk9SWSIsIk1BUkNFTEEiLCJGTE9SIiwiRVZFVFRFIiwiRUxPVUlTRSIsIkFMSU5BIiwiVFJJTklEQUQiLCJEQVZJRCIsIkRBTUFSSVMiLCJDQVRIQVJJTkUiLCJDQVJST0xMIiwiQkVMVkEiLCJOQUtJQSIsIk1BUkxFTkEiLCJMVUFOTkUiLCJMT1JJTkUiLCJLQVJPTiIsIkRPUkVORSIsIkRBTklUQSIsIkJSRU5OQSIsIlRBVElBTkEiLCJTQU1NSUUiLCJMT1VBTk4iLCJMT1JFTiIsIkpVTElBTk5BIiwiQU5EUklBIiwiUEhJTE9NRU5BIiwiTFVDSUxBIiwiTEVPTk9SQSIsIkRPVklFIiwiUk9NT05BIiwiTUlNSSIsIkpBQ1FVRUxJTiIsIkdBWUUiLCJUT05KQSIsIk1JU1RJIiwiSk9FIiwiR0VORSIsIkNIQVNUSVRZIiwiU1RBQ0lBIiwiUk9YQU5OIiwiTUlDQUVMQSIsIk5JS0lUQSIsIk1FSSIsIlZFTERBIiwiTUFSTFlTIiwiSk9ITk5BIiwiQVVSQSIsIkxBVkVSTiIsIklWT05ORSIsIkhBWUxFWSIsIk5JQ0tJIiwiTUFKT1JJRSIsIkhFUkxJTkRBIiwiR0VPUkdFIiwiQUxQSEEiLCJZQURJUkEiLCJQRVJMQSIsIkdSRUdPUklBIiwiREFOSUVMIiwiQU5UT05FVFRFIiwiU0hFTExJIiwiTU9aRUxMRSIsIk1BUklBSCIsIkpPRUxMRSIsIkNPUkRFTElBIiwiSk9TRVRURSIsIkNISVFVSVRBIiwiVFJJU1RBIiwiTE9VSVMiLCJMQVFVSVRBIiwiR0VPUkdJQU5BIiwiQ0FOREkiLCJTSEFOT04iLCJMT05OSUUiLCJISUxERUdBUkQiLCJDRUNJTCIsIlZBTEVOVElOQSIsIlNURVBIQU5ZIiwiTUFHREEiLCJLQVJPTCIsIkdFUlJZIiwiR0FCUklFTExBIiwiVElBTkEiLCJST01BIiwiUklDSEVMTEUiLCJSQVkiLCJQUklOQ0VTUyIsIk9MRVRBIiwiSkFDUVVFIiwiSURFTExBIiwiQUxBSU5BIiwiU1VaQU5OQSIsIkpPVklUQSIsIkJMQUlSIiwiVE9TSEEiLCJSQVZFTiIsIk5FUkVJREEiLCJNQVJMWU4iLCJLWUxBIiwiSk9TRVBIIiwiREVMRklOQSIsIlRFTkEiLCJTVEVQSEVOSUUiLCJTQUJJTkEiLCJOQVRIQUxJRSIsIk1BUkNFTExFIiwiR0VSVElFIiwiREFSTEVFTiIsIlRIRUEiLCJTSEFST05EQSIsIlNIQU5URUwiLCJCRUxFTiIsIlZFTkVTU0EiLCJST1NBTElOQSIsIk9OQSIsIkdFTk9WRVZBIiwiQ09SRVkiLCJDTEVNRU5USU5FIiwiUk9TQUxCQSIsIlJFTkFURSIsIlJFTkFUQSIsIk1JIiwiSVZPUlkiLCJHRU9SR0lBTk5BIiwiRkxPWSIsIkRPUkNBUyIsIkFSSUFOQSIsIlRZUkEiLCJUSEVEQSIsIk1BUklBTSIsIkpVTEkiLCJKRVNJQ0EiLCJET05OSUUiLCJWSUtLSSIsIlZFUkxBIiwiUk9TRUxZTiIsIk1FTFZJTkEiLCJKQU5ORVRURSIsIkdJTk5ZIiwiREVCUkFIIiwiQ09SUklFIiwiQVNJQSIsIlZJT0xFVEEiLCJNWVJUSVMiLCJMQVRSSUNJQSIsIkNPTExFVFRFIiwiQ0hBUkxFRU4iLCJBTklTU0EiLCJWSVZJQU5BIiwiVFdZTEEiLCJQUkVDSU9VUyIsIk5FRFJBIiwiTEFUT05JQSIsIkxBTiIsIkhFTExFTiIsIkZBQklPTEEiLCJBTk5BTUFSSUUiLCJBREVMTCIsIlNIQVJZTiIsIkNIQU5UQUwiLCJOSUtJIiwiTUFVRCIsIkxJWkVUVEUiLCJMSU5EWSIsIktJQSIsIktFU0hBIiwiSkVBTkEiLCJEQU5FTExFIiwiQ0hBUkxJTkUiLCJDSEFORUwiLCJDQVJST0wiLCJWQUxPUklFIiwiTElBIiwiRE9SVEhBIiwiQ1JJU1RBTCIsIlNVTk5ZIiwiTEVPTkUiLCJMRUlMQU5JIiwiR0VSUkkiLCJERUJJIiwiQU5EUkEiLCJLRVNISUEiLCJJTUEiLCJFVUxBTElBIiwiRUFTVEVSIiwiRFVMQ0UiLCJOQVRJVklEQUQiLCJMSU5OSUUiLCJLQU1JIiwiR0VPUkdJRSIsIkNBVElOQSIsIkJST09LIiwiQUxEQSIsIldJTk5JRlJFRCIsIlNIQVJMQSIsIlJVVEhBTk4iLCJNRUFHSEFOIiwiTUFHREFMRU5FIiwiTElTU0VUVEUiLCJBREVMQUlEQSIsIlZFTklUQSIsIlRSRU5BIiwiU0hJUkxFTkUiLCJTSEFNRUtBIiwiRUxJWkVCRVRIIiwiRElBTiIsIlNIQU5UQSIsIk1JQ0tFWSIsIkxBVE9TSEEiLCJDQVJMT1RUQSIsIldJTkRZIiwiU09PTiIsIlJPU0lOQSIsIk1BUklBTk4iLCJMRUlTQSIsIkpPTk5JRSIsIkRBV05BIiwiQ0FUSElFIiwiQklMTFkiLCJBU1RSSUQiLCJTSURORVkiLCJMQVVSRUVOIiwiSkFORUVOIiwiSE9MTEkiLCJGQVdOIiwiVklDS0VZIiwiVEVSRVNTQSIsIlNIQU5URSIsIlJVQllFIiwiTUFSQ0VMSU5BIiwiQ0hBTkRBIiwiQ0FSWSIsIlRFUkVTRSIsIlNDQVJMRVRUIiwiTUFSVFkiLCJNQVJOSUUiLCJMVUxVIiwiTElTRVRURSIsIkpFTklGRkVSIiwiRUxFTk9SIiwiRE9SSU5EQSIsIkRPTklUQSIsIkNBUk1BTiIsIkJFUk5JVEEiLCJBTFRBR1JBQ0lBIiwiQUxFVEEiLCJBRFJJQU5OQSIsIlpPUkFJREEiLCJST05OSUUiLCJOSUNPTEEiLCJMWU5EU0VZIiwiS0VOREFMTCIsIkpBTklOQSIsIkNIUklTU1kiLCJBTUkiLCJTVEFSTEEiLCJQSFlMSVMiLCJQSFVPTkciLCJLWVJBIiwiQ0hBUklTU0UiLCJCTEFOQ0giLCJTQU5KVUFOSVRBIiwiUk9OQSIsIk5BTkNJIiwiTUFSSUxFRSIsIk1BUkFOREEiLCJDT1JZIiwiQlJJR0VUVEUiLCJTQU5KVUFOQSIsIk1BUklUQSIsIktBU1NBTkRSQSIsIkpPWUNFTFlOIiwiSVJBIiwiRkVMSVBBIiwiQ0hFTFNJRSIsIkJPTk5ZIiwiTUlSRVlBIiwiTE9SRU5aQSIsIktZT05HIiwiSUxFQU5BIiwiQ0FOREVMQVJJQSIsIlRPTlkiLCJUT0JZIiwiU0hFUklFIiwiT0siLCJNQVJLIiwiTFVDSUUiLCJMRUFUUklDRSIsIkxBS0VTSElBIiwiR0VSREEiLCJFRElFIiwiQkFNQkkiLCJNQVJZTElOIiwiTEFWT04iLCJIT1JURU5TRSIsIkdBUk5FVCIsIkVWSUUiLCJUUkVTU0EiLCJTSEFZTkEiLCJMQVZJTkEiLCJLWVVORyIsIkpFQU5FVFRBIiwiU0hFUlJJTEwiLCJTSEFSQSIsIlBIWUxJU1MiLCJNSVRUSUUiLCJBTkFCRUwiLCJBTEVTSUEiLCJUSFVZIiwiVEFXQU5EQSIsIlJJQ0hBUkQiLCJKT0FOSUUiLCJUSUZGQU5JRSIsIkxBU0hBTkRBIiwiS0FSSVNTQSIsIkVOUklRVUVUQSIsIkRBUklBIiwiREFOSUVMTEEiLCJDT1JJTk5BIiwiQUxBTk5BIiwiQUJCRVkiLCJST1hBTkUiLCJST1NFQU5OQSIsIk1BR05PTElBIiwiTElEQSIsIktZTEUiLCJKT0VMTEVOIiwiRVJBIiwiQ09SQUwiLCJDQVJMRUVOIiwiVFJFU0EiLCJQRUdHSUUiLCJOT1ZFTExBIiwiTklMQSIsIk1BWUJFTExFIiwiSkVORUxMRSIsIkNBUklOQSIsIk5PVkEiLCJNRUxJTkEiLCJNQVJRVUVSSVRFIiwiTUFSR0FSRVRURSIsIkpPU0VQSElOQSIsIkVWT05ORSIsIkRFVklOIiwiQ0lOVEhJQSIsIkFMQklOQSIsIlRPWUEiLCJUQVdOWUEiLCJTSEVSSVRBIiwiU0FOVE9TIiwiTVlSSUFNIiwiTElaQUJFVEgiLCJMSVNFIiwiS0VFTFkiLCJKRU5OSSIsIkdJU0VMTEUiLCJDSEVSWUxFIiwiQVJESVRIIiwiQVJESVMiLCJBTEVTSEEiLCJBRFJJQU5FIiwiU0hBSU5BIiwiTElOTkVBIiwiS0FST0xZTiIsIkhPTkciLCJGTE9SSURBIiwiRkVMSVNIQSIsIkRPUkkiLCJEQVJDSSIsIkFSVElFIiwiQVJNSURBIiwiWk9MQSIsIlhJT01BUkEiLCJWRVJHSUUiLCJTSEFNSUtBIiwiTkVOQSIsIk5BTk5FVFRFIiwiTUFYSUUiLCJMT1ZJRSIsIkpFQU5FIiwiSkFJTUlFIiwiSU5HRSIsIkZBUlJBSCIsIkVMQUlOQSIsIkNBSVRMWU4iLCJTVEFSUiIsIkZFTElDSVRBUyIsIkNIRVJMWSIsIkNBUllMIiwiWU9MT05EQSIsIllBU01JTiIsIlRFRU5BIiwiUFJVREVOQ0UiLCJQRU5OSUUiLCJOWURJQSIsIk1BQ0tFTlpJRSIsIk9SUEhBIiwiTUFSVkVMIiwiTElaQkVUSCIsIkxBVVJFVFRFIiwiSkVSUklFIiwiSEVSTUVMSU5EQSIsIkNBUk9MRUUiLCJUSUVSUkEiLCJNSVJJQU4iLCJNRVRBIiwiTUVMT05ZIiwiS09SSSIsIkpFTk5FVFRFIiwiSkFNSUxBIiwiRU5BIiwiQU5IIiwiWU9TSElLTyIsIlNVU0FOTkFIIiwiU0FMSU5BIiwiUkhJQU5OT04iLCJKT0xFRU4iLCJDUklTVElORSIsIkFTSFRPTiIsIkFSQUNFTFkiLCJUT01FS0EiLCJTSEFMT05EQSIsIk1BUlRJIiwiTEFDSUUiLCJLQUxBIiwiSkFEQSIsIklMU0UiLCJIQUlMRVkiLCJCUklUVEFOSSIsIlpPTkEiLCJTWUJMRSIsIlNIRVJSWUwiLCJSQU5EWSIsIk5JRElBIiwiTUFSTE8iLCJLQU5ESUNFIiwiS0FOREkiLCJERUIiLCJERUFOIiwiQU1FUklDQSIsIkFMWUNJQSIsIlRPTU1ZIiwiUk9OTkEiLCJOT1JFTkUiLCJNRVJDWSIsIkpPU0UiLCJJTkdFQk9SRyIsIkdJT1ZBTk5BIiwiR0VNTUEiLCJDSFJJU1RFTCIsIkFVRFJZIiwiWk9SQSIsIlZJVEEiLCJWQU4iLCJUUklTSCIsIlNURVBIQUlORSIsIlNISVJMRUUiLCJTSEFOSUtBIiwiTUVMT05JRSIsIk1BWklFIiwiSkFaTUlOIiwiSU5HQSIsIkhPQSIsIkhFVFRJRSIsIkdFUkFMWU4iLCJGT05EQSIsIkVTVFJFTExBIiwiQURFTExBIiwiU1UiLCJTQVJJVEEiLCJSSU5BIiwiTUlMSVNTQSIsIk1BUklCRVRIIiwiR09MREEiLCJFVk9OIiwiRVRIRUxZTiIsIkVORURJTkEiLCJDSEVSSVNFIiwiQ0hBTkEiLCJWRUxWQSIsIlRBV0FOTkEiLCJTQURFIiwiTUlSVEEiLCJMSSIsIktBUklFIiwiSkFDSU5UQSIsIkVMTkEiLCJEQVZJTkEiLCJDSUVSUkEiLCJBU0hMSUUiLCJBTEJFUlRIQSIsIlRBTkVTSEEiLCJTVEVQSEFOSSIsIk5FTExFIiwiTUlOREkiLCJMVSIsIkxPUklOREEiLCJMQVJVRSIsIkZMT1JFTkUiLCJERU1FVFJBIiwiREVEUkEiLCJDSUFSQSIsIkNIQU5URUxMRSIsIkFTSExZIiwiU1VaWSIsIlJPU0FMVkEiLCJOT0VMSUEiLCJMWURBIiwiTEVBVEhBIiwiS1JZU1RZTkEiLCJLUklTVEFOIiwiS0FSUkkiLCJEQVJMSU5FIiwiREFSQ0lFIiwiQ0lOREEiLCJDSEVZRU5ORSIsIkNIRVJSSUUiLCJBV0lMREEiLCJBTE1FREEiLCJST0xBTkRBIiwiTEFORVRURSIsIkpFUklMWU4iLCJHSVNFTEUiLCJFVkFMWU4iLCJDWU5ESSIsIkNMRVRBIiwiQ0FSSU4iLCJaSU5BIiwiWkVOQSIsIlZFTElBIiwiVEFOSUtBIiwiUEFVTCIsIkNIQVJJU1NBIiwiVEhPTUFTIiwiVEFMSUEiLCJNQVJHQVJFVEUiLCJMQVZPTkRBIiwiS0FZTEVFIiwiS0FUSExFTkUiLCJKT05OQSIsIklSRU5BIiwiSUxPTkEiLCJJREFMSUEiLCJDQU5ESVMiLCJDQU5EQU5DRSIsIkJSQU5ERUUiLCJBTklUUkEiLCJBTElEQSIsIlNJR1JJRCIsIk5JQ09MRVRURSIsIk1BUllKTyIsIkxJTkVUVEUiLCJIRURXSUciLCJDSFJJU1RJQU5BIiwiQ0FTU0lEWSIsIkFMRVhJQSIsIlRSRVNTSUUiLCJNT0RFU1RBIiwiTFVQSVRBIiwiTElUQSIsIkdMQURJUyIsIkVWRUxJQSIsIkRBVklEQSIsIkNIRVJSSSIsIkNFQ0lMWSIsIkFTSEVMWSIsIkFOTkFCRUwiLCJBR1VTVElOQSIsIldBTklUQSIsIlNISVJMWSIsIlJPU0FVUkEiLCJIVUxEQSIsIkVVTiIsIkJBSUxFWSIsIllFVFRBIiwiVkVST05BIiwiVEhPTUFTSU5BIiwiU0lCWUwiLCJTSEFOTkFOIiwiTUVDSEVMTEUiLCJMVUUiLCJMRUFORFJBIiwiTEFOSSIsIktZTEVFIiwiS0FORFkiLCJKT0xZTk4iLCJGRVJORSIsIkVCT05JIiwiQ09SRU5FIiwiQUxZU0lBIiwiWlVMQSIsIk5BREEiLCJNT0lSQSIsIkxZTkRTQVkiLCJMT1JSRVRUQSIsIkpVQU4iLCJKQU1NSUUiLCJIT1JURU5TSUEiLCJHQVlORUxMIiwiQ0FNRVJPTiIsIkFEUklBIiwiVklOQSIsIlZJQ0VOVEEiLCJUQU5HRUxBIiwiU1RFUEhJTkUiLCJOT1JJTkUiLCJORUxMQSIsIkxJQU5BIiwiTEVTTEVFIiwiS0lNQkVSRUxZIiwiSUxJQU5BIiwiR0xPUlkiLCJGRUxJQ0EiLCJFTU9HRU5FIiwiRUxGUklFREUiLCJFREVOIiwiRUFSVEhBIiwiQ0FSTUEiLCJCRUEiLCJPQ0lFIiwiTUFSUlkiLCJMRU5OSUUiLCJLSUFSQSIsIkpBQ0FMWU4iLCJDQVJMT1RBIiwiQVJJRUxMRSIsIllVIiwiU1RBUiIsIk9USUxJQSIsIktJUlNUSU4iLCJLQUNFWSIsIkpPSE5FVFRBIiwiSk9FWSIsIkpPRVRUQSIsIkpFUkFMRElORSIsIkpBVU5JVEEiLCJFTEFOQSIsIkRPUlRIRUEiLCJDQU1JIiwiQU1BREEiLCJBREVMSUEiLCJWRVJOSVRBIiwiVEFNQVIiLCJTSU9CSEFOIiwiUkVORUEiLCJSQVNISURBIiwiT1VJREEiLCJPREVMTCIsIk5JTFNBIiwiTUVSWUwiLCJLUklTVFlOIiwiSlVMSUVUQSIsIkRBTklDQSIsIkJSRUFOTkUiLCJBVVJFQSIsIkFOR0xFQSIsIlNIRVJST04iLCJPREVUVEUiLCJNQUxJQSIsIkxPUkVMRUkiLCJMSU4iLCJMRUVTQSIsIktFTk5BIiwiS0FUSExZTiIsIkZJT05BIiwiQ0hBUkxFVFRFIiwiU1VaSUUiLCJTSEFOVEVMTCIsIlNBQlJBIiwiUkFDUVVFTCIsIk1ZT05HIiwiTUlSQSIsIk1BUlRJTkUiLCJMVUNJRU5ORSIsIkxBVkFEQSIsIkpVTElBTk4iLCJKT0hOSUUiLCJFTFZFUkEiLCJERUxQSElBIiwiQ0xBSVIiLCJDSFJJU1RJQU5FIiwiQ0hBUk9MRVRURSIsIkNBUlJJIiwiQVVHVVNUSU5FIiwiQVNIQSIsIkFOR0VMTEEiLCJQQU9MQSIsIk5JTkZBIiwiTEVEQSIsIkxBSSIsIkVEQSIsIlNVTlNISU5FIiwiU1RFRkFOSSIsIlNIQU5FTEwiLCJQQUxNQSIsIk1BQ0hFTExFIiwiTElTU0EiLCJLRUNJQSIsIktBVEhSWU5FIiwiS0FSTEVORSIsIkpVTElTU0EiLCJKRVRUSUUiLCJKRU5OSUZGRVIiLCJIVUkiLCJDT1JSSU5BIiwiQ0hSSVNUT1BIRVIiLCJDQVJPTEFOTiIsIkFMRU5BIiwiVEVTUyIsIlJPU0FSSUEiLCJNWVJUSUNFIiwiTUFSWUxFRSIsIkxJQU5FIiwiS0VOWUFUVEEiLCJKVURJRSIsIkpBTkVZIiwiSU4iLCJFTE1JUkEiLCJFTERPUkEiLCJERU5OQSIsIkNSSVNUSSIsIkNBVEhJIiwiWkFJREEiLCJWT05OSUUiLCJWSVZBIiwiVkVSTklFIiwiUk9TQUxJTkUiLCJNQVJJRUxBIiwiTFVDSUFOQSIsIkxFU0xJIiwiS0FSQU4iLCJGRUxJQ0UiLCJERU5FRU4iLCJBRElOQSIsIldZTk9OQSIsIlRBUlNIQSIsIlNIRVJPTiIsIlNIQVNUQSIsIlNIQU5JVEEiLCJTSEFOSSIsIlNIQU5EUkEiLCJSQU5EQSIsIlBJTktJRSIsIlBBUklTIiwiTkVMSURBIiwiTUFSSUxPVSIsIkxZTEEiLCJMQVVSRU5FIiwiTEFDSSIsIkpPSSIsIkpBTkVORSIsIkRPUk9USEEiLCJEQU5JRUxFIiwiREFOSSIsIkNBUk9MWU5OIiwiQ0FSTFlOIiwiQkVSRU5JQ0UiLCJBWUVTSEEiLCJBTk5FTElFU0UiLCJBTEVUSEVBIiwiVEhFUlNBIiwiVEFNSUtPIiwiUlVGSU5BIiwiT0xJVkEiLCJNT1pFTEwiLCJNQVJZTFlOIiwiTUFESVNPTiIsIktSSVNUSUFOIiwiS0FUSFlSTiIsIktBU0FORFJBIiwiS0FOREFDRSIsIkpBTkFFIiwiR0FCUklFTCIsIkRPTUVOSUNBIiwiREVCQlJBIiwiREFOTklFTExFIiwiQ0hVTiIsIkJVRkZZIiwiQkFSQklFIiwiQVJDRUxJQSIsIkFKQSIsIlpFTk9CSUEiLCJTSEFSRU4iLCJTSEFSRUUiLCJQQVRSSUNLIiwiUEFHRSIsIk1ZIiwiTEFWSU5JQSIsIktVTSIsIktBQ0lFIiwiSkFDS0VMSU5FIiwiSFVPTkciLCJGRUxJU0EiLCJFTUVMSUEiLCJFTEVBTk9SQSIsIkNZVEhJQSIsIkNSSVNUSU4iLCJDTFlERSIsIkNMQVJJQkVMIiwiQ0FST04iLCJBTkFTVEFDSUEiLCJaVUxNQSIsIlpBTkRSQSIsIllPS08iLCJURU5JU0hBIiwiU1VTQU5OIiwiU0hFUklMWU4iLCJTSEFZIiwiU0hBV0FOREEiLCJTQUJJTkUiLCJST01BTkEiLCJNQVRISUxEQSIsIkxJTlNFWSIsIktFSUtPIiwiSk9BTkEiLCJJU0VMQSIsIkdSRVRUQSIsIkdFT1JHRVRUQSIsIkVVR0VOSUUiLCJEVVNUWSIsIkRFU0lSQUUiLCJERUxPUkEiLCJDT1JBWk9OIiwiQU5UT05JTkEiLCJBTklLQSIsIldJTExFTkUiLCJUUkFDRUUiLCJUQU1BVEhBIiwiUkVHQU4iLCJOSUNIRUxMRSIsIk1JQ0tJRSIsIk1BRUdBTiIsIkxVQU5BIiwiTEFOSVRBIiwiS0VMU0lFIiwiRURFTE1JUkEiLCJCUkVFIiwiQUZUT04iLCJURU9ET1JBIiwiVEFNSUUiLCJTSEVOQSIsIk1FRyIsIkxJTkgiLCJLRUxJIiwiS0FDSSIsIkRBTllFTExFIiwiQlJJVFQiLCJBUkxFVFRFIiwiQUxCRVJUSU5FIiwiQURFTExFIiwiVElGRklOWSIsIlNUT1JNWSIsIlNJTU9OQSIsIk5VTUJFUlMiLCJOSUNPTEFTQSIsIk5JQ0hPTCIsIk5JQSIsIk5BS0lTSEEiLCJNRUUiLCJNQUlSQSIsIkxPUkVFTiIsIktJWlpZIiwiSk9ITk5ZIiwiSkFZIiwiRkFMTE9OIiwiQ0hSSVNURU5FIiwiQk9CQllFIiwiQU5USE9OWSIsIllJTkciLCJWSU5DRU5aQSIsIlRBTkpBIiwiUlVCSUUiLCJST05JIiwiUVVFRU5JRSIsIk1BUkdBUkVUVCIsIktJTUJFUkxJIiwiSVJNR0FSRCIsIklERUxMIiwiSElMTUEiLCJFVkVMSU5BIiwiRVNUQSIsIkVNSUxFRSIsIkRFTk5JU0UiLCJEQU5JQSIsIkNBUkwiLCJDQVJJRSIsIkFOVE9OSU8iLCJXQUkiLCJTQU5HIiwiUklTQSIsIlJJS0tJIiwiUEFSVElDSUEiLCJNVUkiLCJNQVNBS08iLCJNQVJJTyIsIkxVVkVOSUEiLCJMT1JFRSIsIkxPTkkiLCJMSUVOIiwiS0VWSU4iLCJHSUdJIiwiRkxPUkVOQ0lBIiwiRE9SSUFOIiwiREVOSVRBIiwiREFMTEFTIiwiQ0hJIiwiQklMTFlFIiwiQUxFWEFOREVSIiwiVE9NSUtBIiwiU0hBUklUQSIsIlJBTkEiLCJOSUtPTEUiLCJORU9NQSIsIk1BUkdBUklURSIsIk1BREFMWU4iLCJMVUNJTkEiLCJMQUlMQSIsIktBTEkiLCJKRU5FVFRFIiwiR0FCUklFTEUiLCJFVkVMWU5FIiwiRUxFTk9SQSIsIkNMRU1FTlRJTkEiLCJBTEVKQU5EUklOQSIsIlpVTEVNQSIsIlZJT0xFVFRFIiwiVkFOTkVTU0EiLCJUSFJFU0EiLCJSRVRUQSIsIlBJQSIsIlBBVElFTkNFIiwiTk9FTExBIiwiTklDS0lFIiwiSk9ORUxMIiwiREVMVEEiLCJDSFVORyIsIkNIQVlBIiwiQ0FNRUxJQSIsIkJFVEhFTCIsIkFOWUEiLCJBTkRSRVciLCJUSEFOSCIsIlNVWkFOTiIsIlNQUklORyIsIlNIVSIsIk1JTEEiLCJMSUxMQSIsIkxBVkVSTkEiLCJLRUVTSEEiLCJLQVRUSUUiLCJHSUEiLCJHRU9SR0VORSIsIkVWRUxJTkUiLCJFU1RFTEwiLCJFTElaQkVUSCIsIlZJVklFTk5FIiwiVkFMTElFIiwiVFJVRElFIiwiU1RFUEhBTkUiLCJNSUNIRUwiLCJNQUdBTFkiLCJNQURJRSIsIktFTllFVFRBIiwiS0FSUkVOIiwiSkFORVRUQSIsIkhFUk1JTkUiLCJIQVJNT05ZIiwiRFJVQ0lMTEEiLCJERUJCSSIsIkNFTEVTVElOQSIsIkNBTkRJRSIsIkJSSVROSSIsIkJFQ0tJRSIsIkFNSU5BIiwiWklUQSIsIllVTiIsIllPTEFOREUiLCJWSVZJRU4iLCJWRVJORVRUQSIsIlRSVURJIiwiU09NTUVSIiwiUEVBUkxFIiwiUEFUUklOQSIsIk9TU0lFIiwiTklDT0xMRSIsIkxPWUNFIiwiTEVUVFkiLCJMQVJJU0EiLCJLQVRIQVJJTkEiLCJKT1NFTFlOIiwiSk9ORUxMRSIsIkpFTkVMTCIsIklFU0hBIiwiSEVJREUiLCJGTE9SSU5EQSIsIkZMT1JFTlRJTkEiLCJGTE8iLCJFTE9ESUEiLCJET1JJTkUiLCJCUlVOSUxEQSIsIkJSSUdJRCIsIkFTSExJIiwiQVJERUxMQSIsIlRXQU5BIiwiVEhVIiwiVEFSQUgiLCJTVU5HIiwiU0hFQSIsIlNIQVZPTiIsIlNIQU5FIiwiU0VSSU5BIiwiUkFZTkEiLCJSQU1PTklUQSIsIk5HQSIsIk1BUkdVUklURSIsIkxVQ1JFQ0lBIiwiS09VUlRORVkiLCJLQVRJIiwiSkVTVVMiLCJKRVNFTklBIiwiRElBTU9ORCIsIkNSSVNUQSIsIkFZQU5BIiwiQUxJQ0EiLCJBTElBIiwiVklOTklFIiwiU1VFTExFTiIsIlJPTUVMSUEiLCJSQUNIRUxMIiwiUElQRVIiLCJPTFlNUElBIiwiTUlDSElLTyIsIktBVEhBTEVFTiIsIkpPTElFIiwiSkVTU0kiLCJKQU5FU1NBIiwiSEFOQSIsIkhBIiwiRUxFQVNFIiwiQ0FSTEVUVEEiLCJCUklUQU5ZIiwiU0hPTkEiLCJTQUxPTUUiLCJST1NBTU9ORCIsIlJFR0VOQSIsIlJBSU5BIiwiTkdPQyIsIk5FTElBIiwiTE9VVkVOSUEiLCJMRVNJQSIsIkxBVFJJTkEiLCJMQVRJQ0lBIiwiTEFSSE9OREEiLCJKSU5BIiwiSkFDS0kiLCJIT0xMSVMiLCJIT0xMRVkiLCJFTU1ZIiwiREVFQU5OIiwiQ09SRVRUQSIsIkFSTkVUVEEiLCJWRUxWRVQiLCJUSEFMSUEiLCJTSEFOSUNFIiwiTkVUQSIsIk1JS0tJIiwiTUlDS0kiLCJMT05OQSIsIkxFQU5BIiwiTEFTSFVOREEiLCJLSUxFWSIsIkpPWUUiLCJKQUNRVUxZTiIsIklHTkFDSUEiLCJIWVVOIiwiSElST0tPIiwiSEVOUlkiLCJIRU5SSUVUVEUiLCJFTEFZTkUiLCJERUxJTkRBIiwiREFSTkVMTCIsIkRBSExJQSIsIkNPUkVFTiIsIkNPTlNVRUxBIiwiQ09OQ0hJVEEiLCJDRUxJTkUiLCJCQUJFVFRFIiwiQVlBTk5BIiwiQU5FVFRFIiwiQUxCRVJUSU5BIiwiU0tZRSIsIlNIQVdORUUiLCJTSEFORUtBIiwiUVVJQU5BIiwiUEFNRUxJQSIsIk1JTiIsIk1FUlJJIiwiTUVSTEVORSIsIk1BUkdJVCIsIktJRVNIQSIsIktJRVJBIiwiS0FZTEVORSIsIkpPREVFIiwiSkVOSVNFIiwiRVJMRU5FIiwiRU1NSUUiLCJFTFNFIiwiREFSWUwiLCJEQUxJTEEiLCJEQUlTRVkiLCJDT0RZIiwiQ0FTSUUiLCJCRUxJQSIsIkJBQkFSQSIsIlZFUlNJRSIsIlZBTkVTQSIsIlNIRUxCQSIsIlNIQVdOREEiLCJTQU0iLCJOT1JNQU4iLCJOSUtJQSIsIk5BT01BIiwiTUFSTkEiLCJNQVJHRVJFVCIsIk1BREFMSU5FIiwiTEFXQU5BIiwiS0lORFJBIiwiSlVUVEEiLCJKQVpNSU5FIiwiSkFORVRUIiwiSEFOTkVMT1JFIiwiR0xFTkRPUkEiLCJHRVJUUlVEIiwiR0FSTkVUVCIsIkZSRUVEQSIsIkZSRURFUklDQSIsIkZMT1JBTkNFIiwiRkxBVklBIiwiREVOTklTIiwiQ0FSTElORSIsIkJFVkVSTEVFIiwiQU5KQU5FVFRFIiwiVkFMREEiLCJUUklOSVRZIiwiVEFNQUxBIiwiU1RFVklFIiwiU0hPTk5BIiwiU0hBIiwiU0FSSU5BIiwiT05FSURBIiwiTUlDQUgiLCJNRVJJTFlOIiwiTUFSTEVFTiIsIkxVUkxJTkUiLCJMRU5OQSIsIktBVEhFUklOIiwiSklOIiwiSkVOSSIsIkhBRSIsIkdSQUNJQSIsIkdMQURZIiwiRkFSQUgiLCJFUklDIiwiRU5PTEEiLCJFTUEiLCJET01JTlFVRSIsIkRFVk9OQSIsIkRFTEFOQSIsIkNFQ0lMQSIsIkNBUFJJQ0UiLCJBTFlTSEEiLCJBTEkiLCJBTEVUSElBIiwiVkVOQSIsIlRIRVJFU0lBIiwiVEFXTlkiLCJTT05HIiwiU0hBS0lSQSIsIlNBTUFSQSIsIlNBQ0hJS08iLCJSQUNIRUxFIiwiUEFNRUxMQSIsIk5JQ0tZIiwiTUFSTkkiLCJNQVJJRUwiLCJNQVJFTiIsIk1BTElTQSIsIkxJR0lBIiwiTEVSQSIsIkxBVE9SSUEiLCJMQVJBRSIsIktJTUJFUiIsIktBVEhFUk4iLCJLQVJFWSIsIkpFTk5FRkVSIiwiSkFORVRIIiwiSEFMSU5BIiwiRlJFRElBIiwiREVMSVNBIiwiREVCUk9BSCIsIkNJRVJBIiwiQ0hJTiIsIkFOR0VMSUtBIiwiQU5EUkVFIiwiQUxUSEEiLCJZRU4iLCJWSVZBTiIsIlRFUlJFU0EiLCJUQU5OQSIsIlNVSyIsIlNVRElFIiwiU09PIiwiU0lHTkUiLCJTQUxFTkEiLCJST05OSSIsIlJFQkJFQ0NBIiwiTVlSVElFIiwiTUNLRU5aSUUiLCJNQUxJS0EiLCJNQUlEQSIsIkxPQU4iLCJMRU9OQVJEQSIsIktBWUxFSUdIIiwiRlJBTkNFIiwiRVRIWUwiLCJFTExZTiIsIkRBWUxFIiwiQ0FNTUlFIiwiQlJJVFROSSIsIkJJUkdJVCIsIkFWRUxJTkEiLCJBU1VOQ0lPTiIsIkFSSUFOTkEiLCJBS0lLTyIsIlZFTklDRSIsIlRZRVNIQSIsIlRPTklFIiwiVElFU0hBIiwiVEFLSVNIQSIsIlNURUZGQU5JRSIsIlNJTkRZIiwiU0FOVEFOQSIsIk1FR0hBTk4iLCJNQU5EQSIsIk1BQ0lFIiwiTEFEWSIsIktFTExZRSIsIktFTExFRSIsIkpPU0xZTiIsIkpBU09OIiwiSU5HRVIiLCJJTkRJUkEiLCJHTElOREEiLCJHTEVOTklTIiwiRkVSTkFOREEiLCJGQVVTVElOQSIsIkVORUlEQSIsIkVMSUNJQSIsIkRPVCIsIkRJR05BIiwiREVMTCIsIkFSTEVUVEEiLCJBTkRSRSIsIldJTExJQSIsIlRBTU1BUkEiLCJUQUJFVEhBIiwiU0hFUlJFTEwiLCJTQVJJIiwiUkVGVUdJTyIsIlJFQkJFQ0EiLCJQQVVMRVRUQSIsIk5JRVZFUyIsIk5BVE9TSEEiLCJOQUtJVEEiLCJNQU1NSUUiLCJLRU5JU0hBIiwiS0FaVUtPIiwiS0FTU0lFIiwiR0FSWSIsIkVBUkxFQU4iLCJEQVBISU5FIiwiQ09STElTUyIsIkNMT1RJTERFIiwiQ0FST0xZTkUiLCJCRVJORVRUQSIsIkFVR1VTVElOQSIsIkFVRFJFQSIsIkFOTklTIiwiQU5OQUJFTEwiLCJZQU4iLCJURU5OSUxMRSIsIlRBTUlDQSIsIlNFTEVORSIsIlNFQU4iLCJST1NBTkEiLCJSRUdFTklBIiwiUUlBTkEiLCJNQVJLSVRBIiwiTUFDWSIsIkxFRUFOTkUiLCJMQVVSSU5FIiwiS1lNIiwiSkVTU0VOSUEiLCJKQU5JVEEiLCJHRU9SR0lORSIsIkdFTklFIiwiRU1JS08iLCJFTFZJRSIsIkRFQU5EUkEiLCJEQUdNQVIiLCJDT1JJRSIsIkNPTExFTiIsIkNIRVJJU0giLCJST01BSU5FIiwiUE9SU0hBIiwiUEVBUkxFTkUiLCJNSUNIRUxJTkUiLCJNRVJOQSIsIk1BUkdPUklFIiwiTUFSR0FSRVRUQSIsIkxPUkUiLCJLRU5ORVRIIiwiSkVOSU5FIiwiSEVSTUlOQSIsIkZSRURFUklDS0EiLCJFTEtFIiwiRFJVU0lMTEEiLCJET1JBVEhZIiwiRElPTkUiLCJERVNJUkUiLCJDRUxFTkEiLCJCUklHSURBIiwiQU5HRUxFUyIsIkFMTEVHUkEiLCJUSEVPIiwiVEFNRUtJQSIsIlNZTlRISUEiLCJTVEVQSEVOIiwiU09PSyIsIlNMWVZJQSIsIlJPU0FOTiIsIlJFQVRIQSIsIlJBWUUiLCJNQVJRVUVUVEEiLCJNQVJHQVJUIiwiTElORyIsIkxBWUxBIiwiS1lNQkVSTFkiLCJLSUFOQSIsIktBWUxFRU4iLCJLQVRMWU4iLCJLQVJNRU4iLCJKT0VMTEEiLCJJUklOQSIsIkVNRUxEQSIsIkVMRU5JIiwiREVUUkEiLCJDTEVNTUlFIiwiQ0hFUllMTCIsIkNIQU5URUxMIiwiQ0FUSEVZIiwiQVJOSVRBIiwiQVJMQSIsIkFOR0xFIiwiQU5HRUxJQyIsIkFMWVNFIiwiWk9GSUEiLCJUSE9NQVNJTkUiLCJURU5OSUUiLCJTT04iLCJTSEVSTFkiLCJTSEVSTEVZIiwiU0hBUllMIiwiUkVNRURJT1MiLCJQRVRSSU5BIiwiTklDS09MRSIsIk1ZVU5HIiwiTVlSTEUiLCJNT1pFTExBIiwiTE9VQU5ORSIsIkxJU0hBIiwiTEFUSUEiLCJMQU5FIiwiS1JZU1RBIiwiSlVMSUVOTkUiLCJKT0VMIiwiSkVBTkVORSIsIkpBQ1FVQUxJTkUiLCJJU0FVUkEiLCJHV0VOREEiLCJFQVJMRUVOIiwiRE9OQUxEIiwiQ0xFT1BBVFJBIiwiQ0FSTElFIiwiQVVESUUiLCJBTlRPTklFVFRBIiwiQUxJU0UiLCJBTEVYIiwiVkVSREVMTCIsIlZBTCIsIlRZTEVSIiwiVE9NT0tPIiwiVEhBTyIsIlRBTElTSEEiLCJTVEVWRU4iLCJTTyIsIlNIRU1JS0EiLCJTSEFVTiIsIlNDQVJMRVQiLCJTQVZBTk5BIiwiU0FOVElOQSIsIlJPU0lBIiwiUkFFQU5OIiwiT0RJTElBIiwiTkFOQSIsIk1JTk5BIiwiTUFHQU4iLCJMWU5FTExFIiwiTEUiLCJLQVJNQSIsIkpPRUFOTiIsIklWQU5BIiwiSU5FTEwiLCJJTEFOQSIsIkhZRSIsIkhPTkVZIiwiSEVFIiwiR1VEUlVOIiwiRlJBTksiLCJEUkVBTUEiLCJDUklTU1kiLCJDSEFOVEUiLCJDQVJNRUxJTkEiLCJBUlZJTExBIiwiQVJUSFVSIiwiQU5OQU1BRSIsIkFMVkVSQSIsIkFMRUlEQSIsIkFBUk9OIiwiWUVFIiwiWUFOSVJBIiwiVkFOREEiLCJUSUFOTkEiLCJUQU0iLCJTVEVGQU5JQSIsIlNISVJBIiwiUEVSUlkiLCJOSUNPTCIsIk5BTkNJRSIsIk1PTlNFUlJBVEUiLCJNSU5IIiwiTUVMWU5EQSIsIk1FTEFOWSIsIk1BVFRIRVciLCJMT1ZFTExBIiwiTEFVUkUiLCJLSVJCWSIsIktBQ1kiLCJKQUNRVUVMWU5OIiwiSFlPTiIsIkdFUlRIQSIsIkZSQU5DSVNDTyIsIkVMSUFOQSIsIkNIUklTVEVOQSIsIkNIUklTVEVFTiIsIkNIQVJJU0UiLCJDQVRFUklOQSIsIkNBUkxFWSIsIkNBTkRZQ0UiLCJBUkxFTkEiLCJBTU1JRSIsIllBTkciLCJXSUxMRVRURSIsIlZBTklUQSIsIlRVWUVUIiwiVElOWSIsIlNZUkVFVEEiLCJTSUxWQSIsIlNDT1RUIiwiUk9OQUxEIiwiUEVOTkVZIiwiTllMQSIsIk1JQ0hBTCIsIk1BVVJJQ0UiLCJNQVJZQU0iLCJNQVJZQSIsIk1BR0VOIiwiTFVESUUiLCJMT01BIiwiTElWSUEiLCJMQU5FTEwiLCJLSU1CRVJMSUUiLCJKVUxFRSIsIkRPTkVUVEEiLCJESUVEUkEiLCJERU5JU0hBIiwiREVBTkUiLCJEQVdORSIsIkNMQVJJTkUiLCJDSEVSUllMIiwiQlJPTldZTiIsIkJSQU5ET04iLCJBTExBIiwiVkFMRVJZIiwiVE9OREEiLCJTVUVBTk4iLCJTT1JBWUEiLCJTSE9TSEFOQSIsIlNIRUxBIiwiU0hBUkxFRU4iLCJTSEFORUxMRSIsIk5FUklTU0EiLCJNSUNIRUFMIiwiTUVSSURJVEgiLCJNRUxMSUUiLCJNQVlFIiwiTUFQTEUiLCJNQUdBUkVUIiwiTFVJUyIsIkxJTEkiLCJMRU9OSUxBIiwiTEVPTklFIiwiTEVFQU5OQSIsIkxBVk9OSUEiLCJMQVZFUkEiLCJLUklTVEVMIiwiS0FUSEVZIiwiS0FUSEUiLCJKVVNUSU4iLCJKVUxJQU4iLCJKSU1NWSIsIkpBTk4iLCJJTERBIiwiSElMRFJFRCIsIkhJTERFR0FSREUiLCJHRU5JQSIsIkZVTUlLTyIsIkVWRUxJTiIsIkVSTUVMSU5EQSIsIkVMTFkiLCJEVU5HIiwiRE9MT1JJUyIsIkRJT05OQSIsIkRBTkFFIiwiQkVSTkVJQ0UiLCJBTk5JQ0UiLCJBTElYIiwiVkVSRU5BIiwiVkVSRElFIiwiVFJJU1RBTiIsIlNIQVdOTkEiLCJTSEFXQU5BIiwiU0hBVU5OQSIsIlJPWkVMTEEiLCJSQU5ERUUiLCJSQU5BRSIsIk1JTEFHUk8iLCJMWU5FTEwiLCJMVUlTRSIsIkxPVUlFIiwiTE9JREEiLCJMSVNCRVRIIiwiS0FSTEVFTiIsIkpVTklUQSIsIkpPTkEiLCJJU0lTIiwiSFlBQ0lOVEgiLCJIRURZIiwiR1dFTk4iLCJFVEhFTEVORSIsIkVSTElORSIsIkVEV0FSRCIsIkRPTllBIiwiRE9NT05JUVVFIiwiREVMSUNJQSIsIkRBTk5FVFRFIiwiQ0lDRUxZIiwiQlJBTkRBIiwiQkxZVEhFIiwiQkVUSEFOTiIsIkFTSExZTiIsIkFOTkFMRUUiLCJBTExJTkUiLCJZVUtPIiwiVkVMTEEiLCJUUkFORyIsIlRPV0FOREEiLCJURVNIQSIsIlNIRVJMWU4iLCJOQVJDSVNBIiwiTUlHVUVMSU5BIiwiTUVSSSIsIk1BWUJFTEwiLCJNQVJMQU5BIiwiTUFSR1VFUklUQSIsIk1BRExZTiIsIkxVTkEiLCJMT1JZIiwiTE9SSUFOTiIsIkxJQkVSVFkiLCJMRU9OT1JFIiwiTEVJR0hBTk4iLCJMQVVSSUNFIiwiTEFURVNIQSIsIkxBUk9OREEiLCJLQVRSSUNFIiwiS0FTSUUiLCJLQVJMIiwiS0FMRVkiLCJKQURXSUdBIiwiR0xFTk5JRSIsIkdFQVJMRElORSIsIkZSQU5DSU5BIiwiRVBJRkFOSUEiLCJEWUFOIiwiRE9SSUUiLCJESUVEUkUiLCJERU5FU0UiLCJERU1FVFJJQ0UiLCJERUxFTkEiLCJEQVJCWSIsIkNSSVNUSUUiLCJDTEVPUkEiLCJDQVRBUklOQSIsIkNBUklTQSIsIkJFUk5JRSIsIkJBUkJFUkEiLCJBTE1FVEEiLCJUUlVMQSIsIlRFUkVBU0EiLCJTT0xBTkdFIiwiU0hFSUxBSCIsIlNIQVZPTk5FIiwiU0FOT1JBIiwiUk9DSEVMTCIsIk1BVEhJTERFIiwiTUFSR0FSRVRBIiwiTUFJQSIsIkxZTlNFWSIsIkxBV0FOTkEiLCJMQVVOQSIsIktFTkEiLCJLRUVOQSIsIktBVElBIiwiSkFNRVkiLCJHTFlOREEiLCJHQVlMRU5FIiwiRUxWSU5BIiwiRUxBTk9SIiwiREFOVVRBIiwiREFOSUtBIiwiQ1JJU1RFTiIsIkNPUkRJRSIsIkNPTEVUVEEiLCJDTEFSSVRBIiwiQ0FSTU9OIiwiQlJZTk4iLCJBWlVDRU5BIiwiQVVORFJFQSIsIkFOR0VMRSIsIllJIiwiV0FMVEVSIiwiVkVSTElFIiwiVkVSTEVORSIsIlRBTUVTSEEiLCJTSUxWQU5BIiwiU0VCUklOQSIsIlNBTUlSQSIsIlJFREEiLCJSQVlMRU5FIiwiUEVOTkkiLCJQQU5ET1JBIiwiTk9SQUgiLCJOT01BIiwiTUlSRUlMTEUiLCJNRUxJU1NJQSIsIk1BUllBTElDRSIsIkxBUkFJTkUiLCJLSU1CRVJZIiwiS0FSWUwiLCJLQVJJTkUiLCJLQU0iLCJKT0xBTkRBIiwiSk9IQU5BIiwiSkVTVVNBIiwiSkFMRUVTQSIsIkpBRSIsIkpBQ1FVRUxZTkUiLCJJUklTSCIsIklMVU1JTkFEQSIsIkhJTEFSSUEiLCJIQU5IIiwiR0VOTklFIiwiRlJBTkNJRSIsIkZMT1JFVFRBIiwiRVhJRSIsIkVEREEiLCJEUkVNQSIsIkRFTFBIQSIsIkJFViIsIkJBUkJBUiIsIkFTU1VOVEEiLCJBUkRFTEwiLCJBTk5BTElTQSIsIkFMSVNJQSIsIllVS0lLTyIsIllPTEFORE8iLCJXT05EQSIsIldFSSIsIldBTFRSQVVEIiwiVkVUQSIsIlRFUVVJTEEiLCJURU1FS0EiLCJUQU1FSUtBIiwiU0hJUkxFRU4iLCJTSEVOSVRBIiwiUElFREFEIiwiT1pFTExBIiwiTUlSVEhBIiwiTUFSSUxVIiwiS0lNSUtPIiwiSlVMSUFORSIsIkpFTklDRSIsIkpFTiIsIkpBTkFZIiwiSkFDUVVJTElORSIsIkhJTERFIiwiRkUiLCJGQUUiLCJFVkFOIiwiRVVHRU5FIiwiRUxPSVMiLCJFQ0hPIiwiREVWT1JBSCIsIkNIQVUiLCJCUklOREEiLCJCRVRTRVkiLCJBUk1JTkRBIiwiQVJBQ0VMSVMiLCJBUFJZTCIsIkFOTkVUVCIsIkFMSVNISUEiLCJWRU9MQSIsIlVTSEEiLCJUT1NISUtPIiwiVEhFT0xBIiwiVEFTSElBIiwiVEFMSVRIQSIsIlNIRVJZIiwiUlVEWSIsIlJFTkVUVEEiLCJSRUlLTyIsIlJBU0hFRURBIiwiT01FR0EiLCJPQkRVTElBIiwiTUlLQSIsIk1FTEFJTkUiLCJNRUdHQU4iLCJNQVJUSU4iLCJNQVJMRU4iLCJNQVJHRVQiLCJNQVJDRUxJTkUiLCJNQU5BIiwiTUFHREFMRU4iLCJMSUJSQURBIiwiTEVaTElFIiwiTEVYSUUiLCJMQVRBU0hJQSIsIkxBU0FORFJBIiwiS0VMTEUiLCJJU0lEUkEiLCJJU0EiLCJJTk9DRU5DSUEiLCJHV1lOIiwiRlJBTkNPSVNFIiwiRVJNSU5JQSIsIkVSSU5OIiwiRElNUExFIiwiREVWT1JBIiwiQ1JJU0VMREEiLCJBUk1BTkRBIiwiQVJJRSIsIkFSSUFORSIsIkFOR0VMTyIsIkFOR0VMRU5BIiwiQUxMRU4iLCJBTElaQSIsIkFEUklFTkUiLCJBREFMSU5FIiwiWE9DSElUTCIsIlRXQU5OQSIsIlRSQU4iLCJUT01JS08iLCJUQU1JU0hBIiwiVEFJU0hBIiwiU1VTWSIsIlNJVSIsIlJVVEhBIiwiUk9YWSIsIlJIT05BIiwiUkFZTU9ORCIsIk9USEEiLCJOT1JJS08iLCJOQVRBU0hJQSIsIk1FUlJJRSIsIk1FTFZJTiIsIk1BUklOREEiLCJNQVJJS08iLCJNQVJHRVJUIiwiTE9SSVMiLCJMSVpaRVRURSIsIkxFSVNIQSIsIktBSUxBIiwiS0EiLCJKT0FOTklFIiwiSkVSUklDQSIsIkpFTkUiLCJKQU5ORVQiLCJKQU5FRSIsIkpBQ0lOREEiLCJIRVJUQSIsIkVMRU5PUkUiLCJET1JFVFRBIiwiREVMQUlORSIsIkRBTklFTEwiLCJDTEFVRElFIiwiQ0hJTkEiLCJCUklUVEEiLCJBUE9MT05JQSIsIkFNQkVSTFkiLCJBTEVBU0UiLCJZVVJJIiwiWVVLIiwiV0VOIiwiV0FORVRBIiwiVVRFIiwiVE9NSSIsIlNIQVJSSSIsIlNBTkRJRSIsIlJPU0VMTEUiLCJSRVlOQUxEQSIsIlJBR1VFTCIsIlBIWUxJQ0lBIiwiUEFUUklBIiwiT0xJTVBJQSIsIk9ERUxJQSIsIk1JVFpJRSIsIk1JVENIRUxMIiwiTUlTUyIsIk1JTkRBIiwiTUlHTk9OIiwiTUlDQSIsIk1FTkRZIiwiTUFSSVZFTCIsIk1BSUxFIiwiTFlORVRUQSIsIkxBVkVUVEUiLCJMQVVSWU4iLCJMQVRSSVNIQSIsIkxBS0lFU0hBIiwiS0lFUlNURU4iLCJLQVJZIiwiSk9TUEhJTkUiLCJKT0xZTiIsIkpFVFRBIiwiSkFOSVNFIiwiSkFDUVVJRSIsIklWRUxJU1NFIiwiR0xZTklTIiwiR0lBTk5BIiwiR0FZTkVMTEUiLCJFTUVSQUxEIiwiREVNRVRSSVVTIiwiREFOWUVMTCIsIkRBTklMTEUiLCJEQUNJQSIsIkNPUkFMRUUiLCJDSEVSIiwiQ0VPTEEiLCJCUkVUVCIsIkJFTEwiLCJBUklBTk5FIiwiQUxFU0hJQSIsIllVTkciLCJXSUxMSUVNQUUiLCJUUk9ZIiwiVFJJTkgiLCJUSE9SQSIsIlRBSSIsIlNWRVRMQU5BIiwiU0hFUklLQSIsIlNIRU1FS0EiLCJTSEFVTkRBIiwiUk9TRUxJTkUiLCJSSUNLSSIsIk1FTERBIiwiTUFMTElFIiwiTEFWT05OQSIsIkxBVElOQSIsIkxBUlJZIiwiTEFRVUFOREEiLCJMQUxBIiwiTEFDSEVMTEUiLCJLTEFSQSIsIktBTkRJUyIsIkpPSE5BIiwiSkVBTk1BUklFIiwiSkFZRSIsIkhBTkciLCJHUkFZQ0UiLCJHRVJUVURFIiwiRU1FUklUQSIsIkVCT05JRSIsIkNMT1JJTkRBIiwiQ0hJTkciLCJDSEVSWSIsIkNBUk9MQSIsIkJSRUFOTiIsIkJMT1NTT00iLCJCRVJOQVJESU5FIiwiQkVDS0kiLCJBUkxFVEhBIiwiQVJHRUxJQSIsIkFSQSIsIkFMSVRBIiwiWVVMQU5EQSIsIllPTiIsIllFU1NFTklBIiwiVE9CSSIsIlRBU0lBIiwiU1lMVklFIiwiU0hJUkwiLCJTSElSRUxZIiwiU0hFUklEQU4iLCJTSEVMTEEiLCJTSEFOVEVMTEUiLCJTQUNIQSIsIlJPWUNFIiwiUkVCRUNLQSIsIlJFQUdBTiIsIlBST1ZJREVOQ0lBIiwiUEFVTEVORSIsIk1JU0hBIiwiTUlLSSIsIk1BUkxJTkUiLCJNQVJJQ0EiLCJMT1JJVEEiLCJMQVRPWUlBIiwiTEFTT05ZQSIsIktFUlNUSU4iLCJLRU5EQSIsIktFSVRIQSIsIktBVEhSSU4iLCJKQVlNSUUiLCJKQUNLIiwiR1JJQ0VMREEiLCJHSU5FVFRFIiwiRVJZTiIsIkVMSU5BIiwiRUxGUklFREEiLCJEQU5ZRUwiLCJDSEVSRUUiLCJDSEFORUxMRSIsIkJBUlJJRSIsIkFWRVJZIiwiQVVST1JFIiwiQU5OQU1BUklBIiwiQUxMRUVOIiwiQUlMRU5FIiwiQUlERSIsIllBU01JTkUiLCJWQVNIVEkiLCJWQUxFTlRJTkUiLCJUUkVBU0EiLCJUT1JZIiwiVElGRkFORVkiLCJTSEVSWUxMIiwiU0hBUklFIiwiU0hBTkFFIiwiU0FVIiwiUkFJU0EiLCJQQSIsIk5FREEiLCJNSVRTVUtPIiwiTUlSRUxMQSIsIk1JTERBIiwiTUFSWUFOTkEiLCJNQVJBR1JFVCIsIk1BQkVMTEUiLCJMVUVUVEEiLCJMT1JJTkEiLCJMRVRJU0hBIiwiTEFUQVJTSEEiLCJMQU5FTExFIiwiTEFKVUFOQSIsIktSSVNTWSIsIktBUkxZIiwiS0FSRU5BIiwiSk9OIiwiSkVTU0lLQSIsIkpFUklDQSIsIkpFQU5FTExFIiwiSkFOVUFSWSIsIkpBTElTQSIsIkpBQ0VMWU4iLCJJWk9MQSIsIklWRVkiLCJHUkVHT1JZIiwiRVVOQSIsIkVUSEEiLCJEUkVXIiwiRE9NSVRJTEEiLCJET01JTklDQSIsIkRBSU5BIiwiQ1JFT0xBIiwiQ0FSTEkiLCJDQU1JRSIsIkJVTk5ZIiwiQlJJVFROWSIsIkFTSEFOVEkiLCJBTklTSEEiLCJBTEVFTiIsIkFEQUgiLCJZQVNVS08iLCJXSU5URVIiLCJWSUtJIiwiVkFMUklFIiwiVE9OQSIsIlRJTklTSEEiLCJUSEkiLCJURVJJU0EiLCJUQVRVTSIsIlRBTkVLQSIsIlNJTU9OTkUiLCJTSEFMQU5EQSIsIlNFUklUQSIsIlJFU1NJRSIsIlJFRlVHSUEiLCJQQVoiLCJPTEVORSIsIk5BIiwiTUVSUklMTCIsIk1BUkdIRVJJVEEiLCJNQU5ESUUiLCJNQU4iLCJNQUlSRSIsIkxZTkRJQSIsIkxVQ0kiLCJMT1JSSUFORSIsIkxPUkVUQSIsIkxFT05JQSIsIkxBVk9OQSIsIkxBU0hBV05EQSIsIkxBS0lBIiwiS1lPS08iLCJLUllTVElOQSIsIktSWVNURU4iLCJLRU5JQSIsIktFTFNJIiwiSlVERSIsIkpFQU5JQ0UiLCJJU09CRUwiLCJHRU9SR0lBTk4iLCJHRU5OWSIsIkZFTElDSURBRCIsIkVJTEVORSIsIkRFT04iLCJERUxPSVNFIiwiREVFREVFIiwiREFOTklFIiwiQ09OQ0VQVElPTiIsIkNMT1JBIiwiQ0hFUklMWU4iLCJDSEFORyIsIkNBTEFORFJBIiwiQkVSUlkiLCJBUk1BTkRJTkEiLCJBTklTQSIsIlVMQSIsIlRJTU9USFkiLCJUSUVSQSIsIlRIRVJFU1NBIiwiU1RFUEhBTklBIiwiU0lNQSIsIlNIWUxBIiwiU0hPTlRBIiwiU0hFUkEiLCJTSEFRVUlUQSIsIlNIQUxBIiwiU0FNTVkiLCJST1NTQU5BIiwiTk9IRU1JIiwiTkVSWSIsIk1PUklBSCIsIk1FTElUQSIsIk1FTElEQSIsIk1FTEFOSSIsIk1BUllMWU5OIiwiTUFSSVNIQSIsIk1BUklFVFRFIiwiTUFMT1JJRSIsIk1BREVMRU5FIiwiTFVESVZJTkEiLCJMT1JJQSIsIkxPUkVUVEUiLCJMT1JBTEVFIiwiTElBTk5FIiwiTEVPTiIsIkxBVkVOSUEiLCJMQVVSSU5EQSIsIkxBU0hPTiIsIktJVCIsIktJTUkiLCJLRUlMQSIsIktBVEVMWU5OIiwiS0FJIiwiSk9ORSIsIkpPQU5FIiwiSkkiLCJKQVlOQSIsIkpBTkVMTEEiLCJKQSIsIkhVRSIsIkhFUlRIQSIsIkZSQU5DRU5FIiwiRUxJTk9SRSIsIkRFU1BJTkEiLCJERUxTSUUiLCJERUVEUkEiLCJDTEVNRU5DSUEiLCJDQVJSWSIsIkNBUk9MSU4iLCJDQVJMT1MiLCJCVUxBSCIsIkJSSVRUQU5JRSIsIkJPSyIsIkJMT05ERUxMIiwiQklCSSIsIkJFQVVMQUgiLCJCRUFUQSIsIkFOTklUQSIsIkFHUklQSU5BIiwiVklSR0VOIiwiVkFMRU5FIiwiVU4iLCJUV0FOREEiLCJUT01NWUUiLCJUT0kiLCJUQVJSQSIsIlRBUkkiLCJUQU1NRVJBIiwiU0hBS0lBIiwiU0FEWUUiLCJSVVRIQU5ORSIsIlJPQ0hFTCIsIlJJVktBIiwiUFVSQSIsIk5FTklUQSIsIk5BVElTSEEiLCJNSU5HIiwiTUVSUklMRUUiLCJNRUxPREVFIiwiTUFSVklTIiwiTFVDSUxMQSIsIkxFRU5BIiwiTEFWRVRBIiwiTEFSSVRBIiwiTEFOSUUiLCJLRVJFTiIsIklMRUVOIiwiR0VPUkdFQU5OIiwiR0VOTkEiLCJHRU5FU0lTIiwiRlJJREEiLCJFV0EiLCJFVUZFTUlBIiwiRU1FTFkiLCJFTEEiLCJFRFlUSCIsIkRFT05OQSIsIkRFQURSQSIsIkRBUkxFTkEiLCJDSEFORUxMIiwiQ0hBTiIsIkNBVEhFUk4iLCJDQVNTT05EUkEiLCJDQVNTQVVORFJBIiwiQkVSTkFSREEiLCJCRVJOQSIsIkFSTElOREEiLCJBTkFNQVJJQSIsIkFMQkVSVCIsIldFU0xFWSIsIlZFUlRJRSIsIlZBTEVSSSIsIlRPUlJJIiwiVEFUWUFOQSIsIlNUQVNJQSIsIlNIRVJJU0UiLCJTSEVSSUxMIiwiU0VBU09OIiwiU0NPVFRJRSIsIlNBTkRBIiwiUlVUSEUiLCJST1NZIiwiUk9CRVJUTyIsIlJPQkJJIiwiUkFORUUiLCJRVVlFTiIsIlBFQVJMWSIsIlBBTE1JUkEiLCJPTklUQSIsIk5JU0hBIiwiTklFU0hBIiwiTklEQSIsIk5FVkFEQSIsIk5BTSIsIk1FUkxZTiIsIk1BWU9MQSIsIk1BUllMT1VJU0UiLCJNQVJZTEFORCIsIk1BUlgiLCJNQVJUSCIsIk1BUkdFTkUiLCJNQURFTEFJTkUiLCJMT05EQSIsIkxFT05USU5FIiwiTEVPTUEiLCJMRUlBIiwiTEFXUkVOQ0UiLCJMQVVSQUxFRSIsIkxBTk9SQSIsIkxBS0lUQSIsIktJWU9LTyIsIktFVFVSQUgiLCJLQVRFTElOIiwiS0FSRUVOIiwiSk9OSUUiLCJKT0hORVRURSIsIkpFTkVFIiwiSkVBTkVUVCIsIklaRVRUQSIsIkhJRURJIiwiSEVJS0UiLCJIQVNTSUUiLCJIQVJPTEQiLCJHSVVTRVBQSU5BIiwiR0VPUkdBTk4iLCJGSURFTEEiLCJGRVJOQU5ERSIsIkVMV0FOREEiLCJFTExBTUFFIiwiRUxJWiIsIkRVU1RJIiwiRE9UVFkiLCJDWU5EWSIsIkNPUkFMSUUiLCJDRUxFU1RBIiwiQVJHRU5USU5BIiwiQUxWRVJUQSIsIlhFTklBIiwiV0FWQSIsIlZBTkVUVEEiLCJUT1JSSUUiLCJUQVNISU5BIiwiVEFORFkiLCJUQU1CUkEiLCJUQU1BIiwiU1RFUEFOSUUiLCJTSElMQSIsIlNIQVVOVEEiLCJTSEFSQU4iLCJTSEFOSVFVQSIsIlNIQUUiLCJTRVRTVUtPIiwiU0VSQUZJTkEiLCJTQU5ERUUiLCJST1NBTUFSSUEiLCJQUklTQ0lMQSIsIk9MSU5EQSIsIk5BREVORSIsIk1VT0kiLCJNSUNIRUxJTkEiLCJNRVJDRURFWiIsIk1BUllST1NFIiwiTUFSSU4iLCJNQVJDRU5FIiwiTUFPIiwiTUFHQUxJIiwiTUFGQUxEQSIsIkxPR0FOIiwiTElOTiIsIkxBTk5JRSIsIktBWUNFIiwiS0FST0xJTkUiLCJLQU1JTEFIIiwiS0FNQUxBIiwiSlVTVEEiLCJKT0xJTkUiLCJKRU5OSU5FIiwiSkFDUVVFVFRBIiwiSVJBSURBIiwiR0VSQUxEIiwiR0VPUkdFQU5OQSIsIkZSQU5DSEVTQ0EiLCJGQUlSWSIsIkVNRUxJTkUiLCJFTEFORSIsIkVIVEVMIiwiRUFSTElFIiwiRFVMQ0lFIiwiREFMRU5FIiwiQ1JJUyIsIkNMQVNTSUUiLCJDSEVSRSIsIkNIQVJJUyIsIkNBUk9ZTE4iLCJDQVJNSU5BIiwiQ0FSSVRBIiwiQlJJQU4iLCJCRVRIQU5JRSIsIkFZQUtPIiwiQVJJQ0EiLCJBTiIsIkFMWVNBIiwiQUxFU1NBTkRSQSIsIkFLSUxBSCIsIkFEUklFTiIsIlpFVFRBIiwiWU9VTEFOREEiLCJZRUxFTkEiLCJZQUhBSVJBIiwiWFVBTiIsIldFTkRPTFlOIiwiVklDVE9SIiwiVElKVUFOQSIsIlRFUlJFTEwiLCJURVJJTkEiLCJURVJFU0lBIiwiU1VaSSIsIlNVTkRBWSIsIlNIRVJFTEwiLCJTSEFWT05EQSIsIlNIQVVOVEUiLCJTSEFSREEiLCJTSEFLSVRBIiwiU0VOQSIsIlJZQU5OIiwiUlVCSSIsIlJJVkEiLCJSRUdJTklBIiwiUkVBIiwiUkFDSEFMIiwiUEFSVEhFTklBIiwiUEFNVUxBIiwiTU9OTklFIiwiTU9ORVQiLCJNSUNIQUVMRSIsIk1FTElBIiwiTUFSSU5FIiwiTUFMS0EiLCJNQUlTSEEiLCJMSVNBTkRSQSIsIkxFTyIsIkxFS0lTSEEiLCJMRUFOIiwiTEFVUkVOQ0UiLCJMQUtFTkRSQSIsIktSWVNUSU4iLCJLT1JUTkVZIiwiS0laWklFIiwiS0lUVElFIiwiS0VSQSIsIktFTkRBTCIsIktFTUJFUkxZIiwiS0FOSVNIQSIsIkpVTEVORSIsIkpVTEUiLCJKT1NIVUEiLCJKT0hBTk5FIiwiSkVGRlJFWSIsIkpBTUVFIiwiSEFOIiwiSEFMTEVZIiwiR0lER0VUIiwiR0FMSU5BIiwiRlJFRFJJQ0tBIiwiRkxFVEEiLCJGQVRJTUFIIiwiRVVTRUJJQSIsIkVMWkEiLCJFTEVPTk9SRSIsIkRPUlRIRVkiLCJET1JJQSIsIkRPTkVMTEEiLCJESU5PUkFIIiwiREVMT1JTRSIsIkNMQVJFVEhBIiwiQ0hSSVNUSU5JQSIsIkNIQVJMWU4iLCJCT05HIiwiQkVMS0lTIiwiQVpaSUUiLCJBTkRFUkEiLCJBSUtPIiwiQURFTkEiLCJZRVIiLCJZQUpBSVJBIiwiV0FOIiwiVkFOSUEiLCJVTFJJS0UiLCJUT1NISUEiLCJUSUZBTlkiLCJTVEVGQU5ZIiwiU0hJWlVFIiwiU0hFTklLQSIsIlNIQVdBTk5BIiwiU0hBUk9MWU4iLCJTSEFSSUxZTiIsIlNIQVFVQU5BIiwiU0hBTlRBWSIsIlNFRSIsIlJPWkFOTkUiLCJST1NFTEVFIiwiUklDS0lFIiwiUkVNT05BIiwiUkVBTk5BIiwiUkFFTEVORSIsIlFVSU5OIiwiUEhVTkciLCJQRVRST05JTEEiLCJOQVRBQ0hBIiwiTkFOQ0VZIiwiTVlSTCIsIk1JWU9LTyIsIk1JRVNIQSIsIk1FUklERVRIIiwiTUFSVkVMTEEiLCJNQVJRVUlUVEEiLCJNQVJIVEEiLCJNQVJDSEVMTEUiLCJMSVpFVEgiLCJMSUJCSUUiLCJMQUhPTUEiLCJMQURBV04iLCJLSU5BIiwiS0FUSEVMRUVOIiwiS0FUSEFSWU4iLCJLQVJJU0EiLCJLQUxFSUdIIiwiSlVOSUUiLCJKVUxJRUFOTiIsIkpPSE5TSUUiLCJKQU5FQU4iLCJKQUlNRUUiLCJKQUNLUVVFTElORSIsIkhJU0FLTyIsIkhFUk1BIiwiSEVMQUlORSIsIkdXWU5FVEgiLCJHTEVOTiIsIkdJVEEiLCJFVVNUT0xJQSIsIkVNRUxJTkEiLCJFTElOIiwiRURSSVMiLCJET05ORVRURSIsIkRPTk5FVFRBIiwiRElFUkRSRSIsIkRFTkFFIiwiREFSQ0VMIiwiQ0xBVURFIiwiQ0xBUklTQSIsIkNJTkRFUkVMTEEiLCJDSElBIiwiQ0hBUkxFU0VUVEEiLCJDSEFSSVRBIiwiQ0VMU0EiLCJDQVNTWSIsIkNBU1NJIiwiQ0FSTEVFIiwiQlJVTkEiLCJCUklUVEFORVkiLCJCUkFOREUiLCJCSUxMSSIsIkJBTyIsIkFOVE9ORVRUQSIsIkFOR0xBIiwiQU5HRUxZTiIsIkFOQUxJU0EiLCJBTEFORSIsIldFTk9OQSIsIldFTkRJRSIsIlZFUk9OSVFVRSIsIlZBTk5FU0EiLCJUT0JJRSIsIlRFTVBJRSIsIlNVTUlLTyIsIlNVTEVNQSIsIlNQQVJLTEUiLCJTT01FUiIsIlNIRUJBIiwiU0hBWU5FIiwiU0hBUklDRSIsIlNIQU5FTCIsIlNIQUxPTiIsIlNBR0UiLCJST1kiLCJST1NJTyIsIlJPU0VMSUEiLCJSRU5BWSIsIlJFTUEiLCJSRUVOQSIsIlBPUlNDSEUiLCJQSU5HIiwiUEVHIiwiT1pJRSIsIk9SRVRIQSIsIk9SQUxFRSIsIk9EQSIsIk5VIiwiTkdBTiIsIk5BS0VTSEEiLCJNSUxMWSIsIk1BUllCRUxMRSIsIk1BUkxJTiIsIk1BUklTIiwiTUFSR1JFVFQiLCJNQVJBR0FSRVQiLCJNQU5JRSIsIkxVUkxFTkUiLCJMSUxMSUEiLCJMSUVTRUxPVFRFIiwiTEFWRUxMRSIsIkxBU0hBVU5EQSIsIkxBS0VFU0hBIiwiS0VJVEgiLCJLQVlDRUUiLCJLQUxZTiIsIkpPWUEiLCJKT0VUVEUiLCJKRU5BRSIsIkpBTklFQ0UiLCJJTExBIiwiR1JJU0VMIiwiR0xBWURTIiwiR0VORVZJRSIsIkdBTEEiLCJGUkVEREEiLCJGUkVEIiwiRUxNRVIiLCJFTEVPTk9SIiwiREVCRVJBIiwiREVBTkRSRUEiLCJEQU4iLCJDT1JSSU5ORSIsIkNPUkRJQSIsIkNPTlRFU1NBIiwiQ09MRU5FIiwiQ0xFT1RJTERFIiwiQ0hBUkxPVFQiLCJDSEFOVEFZIiwiQ0VDSUxMRSIsIkJFQVRSSVMiLCJBWkFMRUUiLCJBUkxFQU4iLCJBUkRBVEgiLCJBTkpFTElDQSIsIkFOSkEiLCJBTEZSRURJQSIsIkFMRUlTSEEiLCJBREFNIiwiWkFEQSIsIllVT05ORSIsIlhJQU8iLCJXSUxMT0RFQU4iLCJXSElUTEVZIiwiVkVOTklFIiwiVkFOTkEiLCJUWUlTSEEiLCJUT1ZBIiwiVE9SSUUiLCJUT05JU0hBIiwiVElMREEiLCJUSUVOIiwiVEVNUExFIiwiU0lSRU5BIiwiU0hFUlJJTCIsIlNIQU5USSIsIlNIQU4iLCJTRU5BSURBIiwiU0FNRUxMQSIsIlJPQkJZTiIsIlJFTkRBIiwiUkVJVEEiLCJQSEVCRSIsIlBBVUxJVEEiLCJOT0JVS08iLCJOR1VZRVQiLCJORU9NSSIsIk1PT04iLCJNSUtBRUxBIiwiTUVMQU5JQSIsIk1BWElNSU5BIiwiTUFSRyIsIk1BSVNJRSIsIkxZTk5BIiwiTElMTEkiLCJMQVlORSIsIkxBU0hBVU4iLCJMQUtFTllBIiwiTEFFTCIsIktJUlNUSUUiLCJLQVRITElORSIsIktBU0hBIiwiS0FSTFlOIiwiS0FSSU1BIiwiSk9WQU4iLCJKT1NFRklORSIsIkpFTk5FTEwiLCJKQUNRVUkiLCJKQUNLRUxZTiIsIkhZTyIsIkhJRU4iLCJHUkFaWU5BIiwiRkxPUlJJRSIsIkZMT1JJQSIsIkVMRU9OT1JBIiwiRFdBTkEiLCJET1JMQSIsIkRPTkciLCJERUxNWSIsIkRFSkEiLCJERURFIiwiREFOTiIsIkNSWVNUQSIsIkNMRUxJQSIsIkNMQVJJUyIsIkNMQVJFTkNFIiwiQ0hJRUtPIiwiQ0hFUkxZTiIsIkNIRVJFTExFIiwiQ0hBUk1BSU4iLCJDSEFSQSIsIkNBTU1ZIiwiQkVFIiwiQVJORVRURSIsIkFSREVMTEUiLCJBTk5JS0EiLCJBTUlFRSIsIkFNRUUiLCJBTExFTkEiLCJZVk9ORSIsIllVS0kiLCJZT1NISUUiLCJZRVZFVFRFIiwiWUFFTCIsIldJTExFVFRBIiwiVk9OQ0lMRSIsIlZFTkVUVEEiLCJUVUxBIiwiVE9ORVRURSIsIlRJTUlLQSIsIlRFTUlLQSIsIlRFTE1BIiwiVEVJU0hBIiwiVEFSRU4iLCJUQSIsIlNUQUNFRSIsIlNISU4iLCJTSEFXTlRBIiwiU0FUVVJOSU5BIiwiUklDQVJEQSIsIlBPSyIsIlBBU1RZIiwiT05JRSIsIk5VQklBIiwiTU9SQSIsIk1JS0UiLCJNQVJJRUxMRSIsIk1BUklFTExBIiwiTUFSSUFORUxBIiwiTUFSREVMTCIsIk1BTlkiLCJMVUFOTkEiLCJMT0lTRSIsIkxJU0FCRVRIIiwiTElORFNZIiwiTElMTElBTkEiLCJMSUxMSUFNIiwiTEVMQUgiLCJMRUlHSEEiLCJMRUFOT1JBIiwiTEFORyIsIktSSVNURUVOIiwiS0hBTElMQUgiLCJLRUVMRVkiLCJLQU5EUkEiLCJKVU5LTyIsIkpPQVFVSU5BIiwiSkVSTEVORSIsIkpBTkkiLCJKQU1JS0EiLCJKQU1FIiwiSFNJVSIsIkhFUk1JTEEiLCJHT0xERU4iLCJHRU5FVklWRSIsIkVWSUEiLCJFVUdFTkEiLCJFTU1BTElORSIsIkVMRlJFREEiLCJFTEVORSIsIkRPTkVUVEUiLCJERUxDSUUiLCJERUVBTk5BIiwiREFSQ0VZIiwiQ1VDIiwiQ0xBUklOREEiLCJDSVJBIiwiQ0hBRSIsIkNFTElOREEiLCJDQVRIRVJZTiIsIkNBVEhFUklOIiwiQ0FTSU1JUkEiLCJDQVJNRUxJQSIsIkNBTUVMTElBIiwiQlJFQU5BIiwiQk9CRVRURSIsIkJFUk5BUkRJTkEiLCJCRUJFIiwiQkFTSUxJQSIsIkFSTFlORSIsIkFNQUwiLCJBTEFZTkEiLCJaT05JQSIsIlpFTklBIiwiWVVSSUtPIiwiWUFFS08iLCJXWU5FTEwiLCJXSUxMT1ciLCJXSUxMRU5BIiwiVkVSTklBIiwiVFUiLCJUUkFWSVMiLCJUT1JBIiwiVEVSUklMWU4iLCJURVJJQ0EiLCJURU5FU0hBIiwiVEFXTkEiLCJUQUpVQU5BIiwiVEFJTkEiLCJTVEVQSE5JRSIsIlNPTkEiLCJTT0wiLCJTSU5BIiwiU0hPTkRSQSIsIlNISVpVS08iLCJTSEVSTEVORSIsIlNIRVJJQ0UiLCJTSEFSSUtBIiwiUk9TU0lFIiwiUk9TRU5BIiwiUk9SWSIsIlJJTUEiLCJSSUEiLCJSSEVCQSIsIlJFTk5BIiwiUEVURVIiLCJOQVRBTFlBIiwiTkFOQ0VFIiwiTUVMT0RJIiwiTUVEQSIsIk1BWElNQSIsIk1BVEhBIiwiTUFSS0VUVEEiLCJNQVJJQ1JVWiIsIk1BUkNFTEVORSIsIk1BTFZJTkEiLCJMVUJBIiwiTE9VRVRUQSIsIkxFSURBIiwiTEVDSUEiLCJMQVVSQU4iLCJMQVNIQVdOQSIsIkxBSU5FIiwiS0hBRElKQUgiLCJLQVRFUklORSIsIktBU0kiLCJLQUxMSUUiLCJKVUxJRVRUQSIsIkpFU1VTSVRBIiwiSkVTVElORSIsIkpFU1NJQSIsIkpFUkVNWSIsIkpFRkZJRSIsIkpBTllDRSIsIklTQURPUkEiLCJHRU9SR0lBTk5FIiwiRklERUxJQSIsIkVWSVRBIiwiRVVSQSIsIkVVTEFIIiwiRVNURUZBTkEiLCJFTFNZIiwiRUxJWkFCRVQiLCJFTEFESUEiLCJET0RJRSIsIkRJT04iLCJESUEiLCJERU5JU1NFIiwiREVMT1JBUyIsIkRFTElMQSIsIkRBWVNJIiwiREFLT1RBIiwiQ1VSVElTIiwiQ1JZU1RMRSIsIkNPTkNIQSIsIkNPTEJZIiwiQ0xBUkVUVEEiLCJDSFUiLCJDSFJJU1RJQSIsIkNIQVJMU0lFIiwiQ0hBUkxFTkEiLCJDQVJZTE9OIiwiQkVUVFlBTk4iLCJBU0xFWSIsIkFTSExFQSIsIkFNSVJBIiwiQUkiLCJBR1VFREEiLCJBR05VUyIsIllVRVRURSIsIlZJTklUQSIsIlZJQ1RPUklOQSIsIlRZTklTSEEiLCJUUkVFTkEiLCJUT0NDQVJBIiwiVElTSCIsIlRIT01BU0VOQSIsIlRFR0FOIiwiU09JTEEiLCJTSElMT0giLCJTSEVOTkEiLCJTSEFSTUFJTkUiLCJTSEFOVEFFIiwiU0hBTkRJIiwiU0VQVEVNQkVSIiwiU0FSQU4iLCJTQVJBSSIsIlNBTkEiLCJTQU1VRUwiLCJTQUxMRVkiLCJST1NFVFRFIiwiUk9MQU5ERSIsIlJFR0lORSIsIk9URUxJQSIsIk9TQ0FSIiwiT0xFVklBIiwiTklDSE9MTEUiLCJORUNPTEUiLCJOQUlEQSIsIk1ZUlRBIiwiTVlFU0hBIiwiTUlUU1VFIiwiTUlOVEEiLCJNRVJUSUUiLCJNQVJHWSIsIk1BSEFMSUEiLCJNQURBTEVORSIsIkxPVkUiLCJMT1VSQSIsIkxPUkVBTiIsIkxFV0lTIiwiTEVTSEEiLCJMRU9OSURBIiwiTEVOSVRBIiwiTEFWT05FIiwiTEFTSEVMTCIsIkxBU0hBTkRSQSIsIkxBTU9OSUNBIiwiS0lNQlJBIiwiS0FUSEVSSU5BIiwiS0FSUlkiLCJLQU5FU0hBIiwiSlVMSU8iLCJKT05HIiwiSkVORVZBIiwiSkFRVUVMWU4iLCJIV0EiLCJHSUxNQSIsIkdISVNMQUlORSIsIkdFUlRSVURJUyIsIkZSQU5TSVNDQSIsIkZFUk1JTkEiLCJFVFRJRSIsIkVUU1VLTyIsIkVMTElTIiwiRUxMQU4iLCJFTElESUEiLCJFRFJBIiwiRE9SRVRIRUEiLCJET1JFQVRIQSIsIkRFTllTRSIsIkRFTk5ZIiwiREVFVFRBIiwiREFJTkUiLCJDWVJTVEFMIiwiQ09SUklOIiwiQ0FZTEEiLCJDQVJMSVRBIiwiQ0FNSUxBIiwiQlVSTUEiLCJCVUxBIiwiQlVFTkEiLCJCTEFLRSIsIkJBUkFCQVJBIiwiQVZSSUwiLCJBVVNUSU4iLCJBTEFJTkUiLCJaQU5BIiwiV0lMSEVNSU5BIiwiV0FORVRUQSIsIlZJUkdJTCIsIlZJIiwiVkVST05JS0EiLCJWRVJOT04iLCJWRVJMSU5FIiwiVkFTSUxJS0kiLCJUT05JVEEiLCJUSVNBIiwiVEVPRklMQSIsIlRBWU5BIiwiVEFVTllBIiwiVEFORFJBIiwiVEFLQUtPIiwiU1VOTkkiLCJTVUFOTkUiLCJTSVhUQSIsIlNIQVJFTEwiLCJTRUVNQSIsIlJVU1NFTEwiLCJST1NFTkRBIiwiUk9CRU5BIiwiUkFZTU9OREUiLCJQRUkiLCJQQU1JTEEiLCJPWkVMTCIsIk5FSURBIiwiTkVFTFkiLCJNSVNUSUUiLCJNSUNIQSIsIk1FUklTU0EiLCJNQVVSSVRBIiwiTUFSWUxOIiwiTUFSWUVUVEEiLCJNQVJTSEFMTCIsIk1BUkNFTEwiLCJNQUxFTkEiLCJNQUtFREEiLCJNQURESUUiLCJMT1ZFVFRBIiwiTE9VUklFIiwiTE9SUklORSIsIkxPUklMRUUiLCJMRVNURVIiLCJMQVVSRU5BIiwiTEFTSEFZIiwiTEFSUkFJTkUiLCJMQVJFRSIsIkxBQ1JFU0hBIiwiS1JJU1RMRSIsIktSSVNITkEiLCJLRVZBIiwiS0VJUkEiLCJLQVJPTEUiLCJKT0lFIiwiSklOTlkiLCJKRUFOTkVUVEEiLCJKQU1BIiwiSEVJRFkiLCJHSUxCRVJURSIsIkdFTUEiLCJGQVZJT0xBIiwiRVZFTFlOTiIsIkVOREEiLCJFTExJIiwiRUxMRU5BIiwiRElWSU5BIiwiREFHTlkiLCJDT0xMRU5FIiwiQ09ESSIsIkNJTkRJRSIsIkNIQVNTSURZIiwiQ0hBU0lEWSIsIkNBVFJJQ0UiLCJDQVRIRVJJTkEiLCJDQVNTRVkiLCJDQVJPTEwiLCJDQVJMRU5BIiwiQ0FORFJBIiwiQ0FMSVNUQSIsIkJSWUFOTkEiLCJCUklUVEVOWSIsIkJFVUxBIiwiQkFSSSIsIkFVRFJJRSIsIkFVRFJJQSIsIkFSREVMSUEiLCJBTk5FTExFIiwiQU5HSUxBIiwiQUxPTkEiLCJBTExZTiIsIkRPVUdMQVMiLCJST0dFUiIsIkpPTkFUSEFOIiwiUkFMUEgiLCJOSUNIT0xBUyIsIkJFTkpBTUlOIiwiQlJVQ0UiLCJIQVJSWSIsIldBWU5FIiwiU1RFVkUiLCJIT1dBUkQiLCJFUk5FU1QiLCJQSElMTElQIiwiVE9ERCIsIkNSQUlHIiwiQUxBTiIsIlBISUxJUCIsIkVBUkwiLCJEQU5OWSIsIkJSWUFOIiwiU1RBTkxFWSIsIkxFT05BUkQiLCJOQVRIQU4iLCJNQU5VRUwiLCJST0RORVkiLCJNQVJWSU4iLCJWSU5DRU5UIiwiSkVGRkVSWSIsIkpFRkYiLCJDSEFEIiwiSkFDT0IiLCJBTEZSRUQiLCJCUkFETEVZIiwiSEVSQkVSVCIsIkZSRURFUklDSyIsIkVEV0lOIiwiRE9OIiwiUklDS1kiLCJSQU5EQUxMIiwiQkFSUlkiLCJCRVJOQVJEIiwiTEVST1kiLCJNQVJDVVMiLCJUSEVPRE9SRSIsIkNMSUZGT1JEIiwiTUlHVUVMIiwiSklNIiwiVE9NIiwiQ0FMVklOIiwiQklMTCIsIkxMT1lEIiwiREVSRUsiLCJXQVJSRU4iLCJEQVJSRUxMIiwiSkVST01FIiwiRkxPWUQiLCJBTFZJTiIsIlRJTSIsIkdPUkRPTiIsIkdSRUciLCJKT1JHRSIsIkRVU1RJTiIsIlBFRFJPIiwiREVSUklDSyIsIlpBQ0hBUlkiLCJIRVJNQU4iLCJHTEVOIiwiSEVDVE9SIiwiUklDQVJETyIsIlJJQ0siLCJCUkVOVCIsIlJBTU9OIiwiR0lMQkVSVCIsIk1BUkMiLCJSRUdJTkFMRCIsIlJVQkVOIiwiTkFUSEFOSUVMIiwiUkFGQUVMIiwiRURHQVIiLCJNSUxUT04iLCJSQVVMIiwiQkVOIiwiQ0hFU1RFUiIsIkRVQU5FIiwiRlJBTktMSU4iLCJCUkFEIiwiUk9OIiwiUk9MQU5EIiwiQVJOT0xEIiwiSEFSVkVZIiwiSkFSRUQiLCJFUklLIiwiREFSUllMIiwiTkVJTCIsIkpBVklFUiIsIkZFUk5BTkRPIiwiQ0xJTlRPTiIsIlRFRCIsIk1BVEhFVyIsIlRZUk9ORSIsIkRBUlJFTiIsIkxBTkNFIiwiS1VSVCIsIkFMTEFOIiwiTkVMU09OIiwiR1VZIiwiQ0xBWVRPTiIsIkhVR0giLCJNQVgiLCJEV0FZTkUiLCJEV0lHSFQiLCJBUk1BTkRPIiwiRkVMSVgiLCJFVkVSRVRUIiwiSUFOIiwiV0FMTEFDRSIsIktFTiIsIkJPQiIsIkFMRlJFRE8iLCJBTEJFUlRPIiwiREFWRSIsIklWQU4iLCJCWVJPTiIsIklTQUFDIiwiTU9SUklTIiwiQ0xJRlRPTiIsIldJTExBUkQiLCJST1NTIiwiQU5EWSIsIlNBTFZBRE9SIiwiS0lSSyIsIlNFUkdJTyIsIlNFVEgiLCJLRU5UIiwiVEVSUkFOQ0UiLCJFRFVBUkRPIiwiVEVSUkVOQ0UiLCJFTlJJUVVFIiwiV0FERSIsIlNUVUFSVCIsIkZSRURSSUNLIiwiQVJUVVJPIiwiQUxFSkFORFJPIiwiTklDSyIsIkxVVEhFUiIsIldFTkRFTEwiLCJKRVJFTUlBSCIsIkpVTElVUyIsIk9USVMiLCJUUkVWT1IiLCJPTElWRVIiLCJMVUtFIiwiSE9NRVIiLCJHRVJBUkQiLCJET1VHIiwiS0VOTlkiLCJIVUJFUlQiLCJMWUxFIiwiTUFUVCIsIkFMRk9OU08iLCJPUkxBTkRPIiwiUkVYIiwiQ0FSTFRPTiIsIkVSTkVTVE8iLCJORUFMIiwiUEFCTE8iLCJMT1JFTlpPIiwiT01BUiIsIldJTEJVUiIsIkdSQU5UIiwiSE9SQUNFIiwiUk9ERVJJQ0siLCJBQlJBSEFNIiwiV0lMTElTIiwiUklDS0VZIiwiQU5EUkVTIiwiQ0VTQVIiLCJKT0hOQVRIQU4iLCJNQUxDT0xNIiwiUlVET0xQSCIsIkRBTU9OIiwiS0VMVklOIiwiUFJFU1RPTiIsIkFMVE9OIiwiQVJDSElFIiwiTUFSQ08iLCJXTSIsIlBFVEUiLCJSQU5ET0xQSCIsIkdBUlJZIiwiR0VPRkZSRVkiLCJKT05BVEhPTiIsIkZFTElQRSIsIkdFUkFSRE8iLCJFRCIsIkRPTUlOSUMiLCJERUxCRVJUIiwiQ09MSU4iLCJHVUlMTEVSTU8iLCJFQVJORVNUIiwiTFVDQVMiLCJCRU5OWSIsIlNQRU5DRVIiLCJST0RPTEZPIiwiTVlST04iLCJFRE1VTkQiLCJHQVJSRVRUIiwiU0FMVkFUT1JFIiwiQ0VEUklDIiwiTE9XRUxMIiwiR1JFR0ciLCJTSEVSTUFOIiwiV0lMU09OIiwiU1lMVkVTVEVSIiwiUk9PU0VWRUxUIiwiSVNSQUVMIiwiSkVSTUFJTkUiLCJGT1JSRVNUIiwiV0lMQkVSVCIsIkxFTEFORCIsIlNJTU9OIiwiQ0xBUksiLCJJUlZJTkciLCJCUllBTlQiLCJPV0VOIiwiUlVGVVMiLCJXT09EUk9XIiwiS1JJU1RPUEhFUiIsIk1BQ0siLCJMRVZJIiwiTUFSQ09TIiwiR1VTVEFWTyIsIkpBS0UiLCJMSU9ORUwiLCJHSUxCRVJUTyIsIkNMSU5UIiwiTklDT0xBUyIsIklTTUFFTCIsIk9SVklMTEUiLCJFUlZJTiIsIkRFV0VZIiwiQUwiLCJXSUxGUkVEIiwiSk9TSCIsIkhVR08iLCJJR05BQ0lPIiwiQ0FMRUIiLCJUT01BUyIsIlNIRUxET04iLCJFUklDSyIsIlNURVdBUlQiLCJET1lMRSIsIkRBUlJFTCIsIlJPR0VMSU8iLCJURVJFTkNFIiwiU0FOVElBR08iLCJBTE9OWk8iLCJFTElBUyIsIkJFUlQiLCJFTEJFUlQiLCJSQU1JUk8iLCJDT05SQUQiLCJOT0FIIiwiR1JBRFkiLCJQSElMIiwiQ09STkVMSVVTIiwiTEFNQVIiLCJST0xBTkRPIiwiQ0xBWSIsIlBFUkNZIiwiREVYVEVSIiwiQlJBREZPUkQiLCJEQVJJTiIsIkFNT1MiLCJNT1NFUyIsIklSVklOIiwiU0FVTCIsIlJPTUFOIiwiUkFOREFMIiwiVElNTVkiLCJEQVJSSU4iLCJXSU5TVE9OIiwiQlJFTkRBTiIsIkFCRUwiLCJET01JTklDSyIsIkJPWUQiLCJFTUlMSU8iLCJFTElKQUgiLCJET01JTkdPIiwiRU1NRVRUIiwiTUFSTE9OIiwiRU1BTlVFTCIsIkpFUkFMRCIsIkVETU9ORCIsIkVNSUwiLCJERVdBWU5FIiwiV0lMTCIsIk9UVE8iLCJURUREWSIsIlJFWU5BTERPIiwiQlJFVCIsIkpFU1MiLCJUUkVOVCIsIkhVTUJFUlRPIiwiRU1NQU5VRUwiLCJTVEVQSEFOIiwiVklDRU5URSIsIkxBTU9OVCIsIkdBUkxBTkQiLCJNSUxFUyIsIkVGUkFJTiIsIkhFQVRIIiwiUk9ER0VSIiwiSEFSTEVZIiwiRVRIQU4iLCJFTERPTiIsIlJPQ0tZIiwiUElFUlJFIiwiSlVOSU9SIiwiRlJFRERZIiwiRUxJIiwiQlJZQ0UiLCJBTlRPSU5FIiwiU1RFUkxJTkciLCJDSEFTRSIsIkdST1ZFUiIsIkVMVE9OIiwiQ0xFVkVMQU5EIiwiRFlMQU4iLCJDSFVDSyIsIkRBTUlBTiIsIlJFVUJFTiIsIlNUQU4iLCJBVUdVU1QiLCJMRU9OQVJETyIsIkpBU1BFUiIsIlJVU1NFTCIsIkVSV0lOIiwiQkVOSVRPIiwiSEFOUyIsIk1PTlRFIiwiQkxBSU5FIiwiRVJOSUUiLCJDVVJUIiwiUVVFTlRJTiIsIkFHVVNUSU4iLCJNVVJSQVkiLCJKQU1BTCIsIkFET0xGTyIsIkhBUlJJU09OIiwiVFlTT04iLCJCVVJUT04iLCJCUkFEWSIsIkVMTElPVFQiLCJXSUxGUkVETyIsIkJBUlQiLCJKQVJST0QiLCJWQU5DRSIsIkRFTklTIiwiREFNSUVOIiwiSk9BUVVJTiIsIkhBUkxBTiIsIkRFU01PTkQiLCJFTExJT1QiLCJEQVJXSU4iLCJHUkVHT1JJTyIsIkJVRERZIiwiWEFWSUVSIiwiS0VSTUlUIiwiUk9TQ09FIiwiRVNURUJBTiIsIkFOVE9OIiwiU09MT01PTiIsIlNDT1RUWSIsIk5PUkJFUlQiLCJFTFZJTiIsIldJTExJQU1TIiwiTk9MQU4iLCJST0QiLCJRVUlOVE9OIiwiSEFMIiwiQlJBSU4iLCJST0IiLCJFTFdPT0QiLCJLRU5EUklDSyIsIkRBUklVUyIsIk1PSVNFUyIsIkZJREVMIiwiVEhBRERFVVMiLCJDTElGRiIsIk1BUkNFTCIsIkpBQ0tTT04iLCJSQVBIQUVMIiwiQlJZT04iLCJBUk1BTkQiLCJBTFZBUk8iLCJKRUZGUlkiLCJEQU5FIiwiSk9FU1BIIiwiVEhVUk1BTiIsIk5FRCIsIlJVU1RZIiwiTU9OVFkiLCJGQUJJQU4iLCJSRUdHSUUiLCJNQVNPTiIsIkdSQUhBTSIsIklTQUlBSCIsIlZBVUdITiIsIkdVUyIsIkxPWUQiLCJESUVHTyIsIkFET0xQSCIsIk5PUlJJUyIsIk1JTExBUkQiLCJST0NDTyIsIkdPTlpBTE8iLCJERVJJQ0siLCJST0RSSUdPIiwiV0lMRVkiLCJSSUdPQkVSVE8iLCJBTFBIT05TTyIsIlRZIiwiTk9FIiwiVkVSTiIsIlJFRUQiLCJKRUZGRVJTT04iLCJFTFZJUyIsIkJFUk5BUkRPIiwiTUFVUklDSU8iLCJISVJBTSIsIkRPTk9WQU4iLCJCQVNJTCIsIlJJTEVZIiwiTklDS09MQVMiLCJNQVlOQVJEIiwiU0NPVCIsIlZJTkNFIiwiUVVJTkNZIiwiRUREWSIsIlNFQkFTVElBTiIsIkZFREVSSUNPIiwiVUxZU1NFUyIsIkhFUklCRVJUTyIsIkRPTk5FTEwiLCJDT0xFIiwiREFWSVMiLCJHQVZJTiIsIkVNRVJZIiwiV0FSRCIsIlJPTUVPIiwiSkFZU09OIiwiREFOVEUiLCJDTEVNRU5UIiwiQ09ZIiwiTUFYV0VMTCIsIkpBUlZJUyIsIkJSVU5PIiwiSVNTQUMiLCJEVURMRVkiLCJCUk9DSyIsIlNBTkZPUkQiLCJDQVJNRUxPIiwiQkFSTkVZIiwiTkVTVE9SIiwiU1RFRkFOIiwiRE9OTlkiLCJBUlQiLCJMSU5XT09EIiwiQkVBVSIsIldFTERPTiIsIkdBTEVOIiwiSVNJRFJPIiwiVFJVTUFOIiwiREVMTUFSIiwiSk9ITkFUSE9OIiwiU0lMQVMiLCJGUkVERVJJQyIsIkRJQ0siLCJJUldJTiIsIk1FUkxJTiIsIkNIQVJMRVkiLCJNQVJDRUxJTk8iLCJIQVJSSVMiLCJDQVJMTyIsIlRSRU5UT04iLCJLVVJUSVMiLCJIVU5URVIiLCJBVVJFTElPIiwiV0lORlJFRCIsIlZJVE8iLCJDT0xMSU4iLCJERU5WRVIiLCJDQVJURVIiLCJMRU9ORUwiLCJFTU9SWSIsIlBBU1FVQUxFIiwiTU9IQU1NQUQiLCJNQVJJQU5PIiwiREFOSUFMIiwiTEFORE9OIiwiRElSSyIsIkJSQU5ERU4iLCJBREFOIiwiQlVGT1JEIiwiR0VSTUFOIiwiV0lMTUVSIiwiRU1FUlNPTiIsIlpBQ0hFUlkiLCJGTEVUQ0hFUiIsIkpBQ1FVRVMiLCJFUlJPTCIsIkRBTFRPTiIsIk1PTlJPRSIsIkpPU1VFIiwiRURXQVJETyIsIkJPT0tFUiIsIldJTEZPUkQiLCJTT05OWSIsIlNIRUxUT04iLCJDQVJTT04iLCJUSEVST04iLCJSQVlNVU5ETyIsIkRBUkVOIiwiSE9VU1RPTiIsIlJPQkJZIiwiTElOQ09MTiIsIkdFTkFSTyIsIkJFTk5FVFQiLCJPQ1RBVklPIiwiQ09STkVMTCIsIkhVTkciLCJBUlJPTiIsIkFOVE9OWSIsIkhFUlNDSEVMIiwiR0lPVkFOTkkiLCJHQVJUSCIsIkNZUlVTIiwiQ1lSSUwiLCJST05OWSIsIkxPTiIsIkZSRUVNQU4iLCJEVU5DQU4iLCJLRU5OSVRIIiwiQ0FSTUlORSIsIkVSSUNIIiwiQ0hBRFdJQ0siLCJXSUxCVVJOIiwiUlVTUyIsIlJFSUQiLCJNWUxFUyIsIkFOREVSU09OIiwiTU9SVE9OIiwiSk9OQVMiLCJGT1JFU1QiLCJNSVRDSEVMIiwiTUVSVklOIiwiWkFORSIsIlJJQ0giLCJKQU1FTCIsIkxBWkFSTyIsIkFMUEhPTlNFIiwiUkFOREVMTCIsIk1BSk9SIiwiSkFSUkVUVCIsIkJST09LUyIsIkFCRFVMIiwiTFVDSUFOTyIsIlNFWU1PVVIiLCJFVUdFTklPIiwiTU9IQU1NRUQiLCJWQUxFTlRJTiIsIkNIQU5DRSIsIkFSTlVMRk8iLCJMVUNJRU4iLCJGRVJESU5BTkQiLCJUSEFEIiwiRVpSQSIsIkFMRE8iLCJSVUJJTiIsIlJPWUFMIiwiTUlUQ0giLCJFQVJMRSIsIkFCRSIsIldZQVRUIiwiTUFSUVVJUyIsIkxBTk5ZIiwiS0FSRUVNIiwiSkFNQVIiLCJCT1JJUyIsIklTSUFIIiwiRU1JTEUiLCJFTE1PIiwiQVJPTiIsIkxFT1BPTERPIiwiRVZFUkVUVEUiLCJKT1NFRiIsIkVMT1kiLCJST0RSSUNLIiwiUkVJTkFMRE8iLCJMVUNJTyIsIkpFUlJPRCIsIldFU1RPTiIsIkhFUlNIRUwiLCJCQVJUT04iLCJQQVJLRVIiLCJMRU1VRUwiLCJCVVJUIiwiSlVMRVMiLCJHSUwiLCJFTElTRU8iLCJBSE1BRCIsIk5JR0VMIiwiRUZSRU4iLCJBTlRXQU4iLCJBTERFTiIsIk1BUkdBUklUTyIsIkNPTEVNQU4iLCJESU5PIiwiT1NWQUxETyIsIkxFUyIsIkRFQU5EUkUiLCJOT1JNQU5EIiwiS0lFVEgiLCJUUkVZIiwiTk9SQkVSVE8iLCJOQVBPTEVPTiIsIkpFUk9MRCIsIkZSSVRaIiwiUk9TRU5ETyIsIk1JTEZPUkQiLCJDSFJJU1RPUEVSIiwiQUxGT05aTyIsIkxZTUFOIiwiSk9TSUFIIiwiQlJBTlQiLCJXSUxUT04iLCJSSUNPIiwiSkFNQUFMIiwiREVXSVRUIiwiQlJFTlRPTiIsIk9MSU4iLCJGT1NURVIiLCJGQVVTVElOTyIsIkNMQVVESU8iLCJKVURTT04iLCJHSU5PIiwiRURHQVJETyIsIkFMRUMiLCJUQU5ORVIiLCJKQVJSRUQiLCJET05OIiwiVEFEIiwiUFJJTkNFIiwiUE9SRklSSU8iLCJPRElTIiwiTEVOQVJEIiwiQ0hBVU5DRVkiLCJUT0QiLCJNRUwiLCJNQVJDRUxPIiwiS09SWSIsIkFVR1VTVFVTIiwiS0VWRU4iLCJISUxBUklPIiwiQlVEIiwiU0FMIiwiT1JWQUwiLCJNQVVSTyIsIlpBQ0hBUklBSCIsIk9MRU4iLCJBTklCQUwiLCJNSUxPIiwiSkVEIiwiRElMTE9OIiwiQU1BRE8iLCJORVdUT04iLCJMRU5OWSIsIlJJQ0hJRSIsIkhPUkFDSU8iLCJCUklDRSIsIk1PSEFNRUQiLCJERUxNRVIiLCJEQVJJTyIsIlJFWUVTIiwiTUFDIiwiSk9OQUgiLCJKRVJST0xEIiwiUk9CVCIsIkhBTksiLCJSVVBFUlQiLCJST0xMQU5EIiwiS0VOVE9OIiwiREFNSU9OIiwiQU5UT05FIiwiV0FMRE8iLCJGUkVEUklDIiwiQlJBRExZIiwiS0lQIiwiQlVSTCIsIldBTEtFUiIsIlRZUkVFIiwiSkVGRkVSRVkiLCJBSE1FRCIsIldJTExZIiwiU1RBTkZPUkQiLCJPUkVOIiwiTk9CTEUiLCJNT1NIRSIsIk1JS0VMIiwiRU5PQ0giLCJCUkVORE9OIiwiUVVJTlRJTiIsIkpBTUlTT04iLCJGTE9SRU5DSU8iLCJEQVJSSUNLIiwiVE9CSUFTIiwiSEFTU0FOIiwiR0lVU0VQUEUiLCJERU1BUkNVUyIsIkNMRVRVUyIsIlRZUkVMTCIsIkxZTkRPTiIsIktFRU5BTiIsIldFUk5FUiIsIkdFUkFMRE8iLCJDT0xVTUJVUyIsIkNIRVQiLCJCRVJUUkFNIiwiTUFSS1VTIiwiSFVFWSIsIkhJTFRPTiIsIkRXQUlOIiwiRE9OVEUiLCJUWVJPTiIsIk9NRVIiLCJJU0FJQVMiLCJISVBPTElUTyIsIkZFUk1JTiIsIkFEQUxCRVJUTyIsIkJPIiwiQkFSUkVUVCIsIlRFT0RPUk8iLCJNQ0tJTkxFWSIsIk1BWElNTyIsIkdBUkZJRUxEIiwiUkFMRUlHSCIsIkxBV0VSRU5DRSIsIkFCUkFNIiwiUkFTSEFEIiwiS0lORyIsIkVNTUlUVCIsIkRBUk9OIiwiU0FNVUFMIiwiTUlRVUVMIiwiRVVTRUJJTyIsIkRPTUVOSUMiLCJEQVJST04iLCJCVVNURVIiLCJXSUxCRVIiLCJSRU5BVE8iLCJKQyIsIkhPWVQiLCJIQVlXT09EIiwiRVpFS0lFTCIsIkNIQVMiLCJGTE9SRU5USU5PIiwiRUxST1kiLCJDTEVNRU5URSIsIkFSREVOIiwiTkVWSUxMRSIsIkVESVNPTiIsIkRFU0hBV04iLCJOQVRIQU5JQUwiLCJKT1JET04iLCJEQU5JTE8iLCJDTEFVRCIsIlNIRVJXT09EIiwiUkFZTU9OIiwiUkFZRk9SRCIsIkNSSVNUT0JBTCIsIkFNQlJPU0UiLCJUSVRVUyIsIkhZTUFOIiwiRkVMVE9OIiwiRVpFUVVJRUwiLCJFUkFTTU8iLCJTVEFOVE9OIiwiTE9OTlkiLCJMRU4iLCJJS0UiLCJNSUxBTiIsIkxJTk8iLCJKQVJPRCIsIkhFUkIiLCJBTkRSRUFTIiwiV0FMVE9OIiwiUkhFVFQiLCJQQUxNRVIiLCJET1VHTEFTUyIsIkNPUkRFTEwiLCJPU1dBTERPIiwiRUxMU1dPUlRIIiwiVklSR0lMSU8iLCJUT05FWSIsIk5BVEhBTkFFTCIsIkRFTCIsIkJFTkVESUNUIiwiTU9TRSIsIkpPSE5TT04iLCJJU1JFQUwiLCJHQVJSRVQiLCJGQVVTVE8iLCJBU0EiLCJBUkxFTiIsIlpBQ0siLCJXQVJORVIiLCJNT0RFU1RPIiwiRlJBTkNFU0NPIiwiTUFOVUFMIiwiR0FZTE9SRCIsIkdBU1RPTiIsIkZJTElCRVJUTyIsIkRFQU5HRUxPIiwiTUlDSEFMRSIsIkdSQU5WSUxMRSIsIldFUyIsIk1BTElLIiwiWkFDS0FSWSIsIlRVQU4iLCJFTERSSURHRSIsIkNSSVNUT1BIRVIiLCJDT1JURVoiLCJBTlRJT05FIiwiTUFMQ09NIiwiTE9ORyIsIktPUkVZIiwiSk9TUEVIIiwiQ09MVE9OIiwiV0FZTE9OIiwiVk9OIiwiSE9TRUEiLCJTSEFEIiwiU0FOVE8iLCJSVURPTEYiLCJST0xGIiwiUkVZIiwiUkVOQUxETyIsIk1BUkNFTExVUyIsIkxVQ0lVUyIsIktSSVNUT0ZFUiIsIkJPWUNFIiwiQkVOVE9OIiwiSEFZREVOIiwiSEFSTEFORCIsIkFSTk9MRE8iLCJSVUVCRU4iLCJMRUFORFJPIiwiS1JBSUciLCJKRVJSRUxMIiwiSkVST01ZIiwiSE9CRVJUIiwiQ0VEUklDSyIsIkFSTElFIiwiV0lORk9SRCIsIldBTExZIiwiTFVJR0kiLCJLRU5FVEgiLCJKQUNJTlRPIiwiR1JBSUciLCJGUkFOS0xZTiIsIkVETVVORE8iLCJTSUQiLCJQT1JURVIiLCJMRUlGIiwiSkVSQU1ZIiwiQlVDSyIsIldJTExJQU4iLCJWSU5DRU5aTyIsIlNIT04iLCJMWU5XT09EIiwiSkVSRSIsIkhBSSIsIkVMREVOIiwiRE9SU0VZIiwiREFSRUxMIiwiQlJPREVSSUNLIiwiQUxPTlNPIg==","base64"));
  names = rawNames.replace(/"/gm, "").split(",");
  return names;
};

alphabeticalValue = function(name) {
  var i, sum, v, _i, _ref;
  sum = 0;
  for (i = _i = 0, _ref = name.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
    v = name.charCodeAt(i) - 64;
    sum += v;
  }
  return sum;
};

problem.test = function() {
  return equal(alphabeticalValue("COLIN"), 53, "alphabetical value for COLIN is 53");
};

problem.answer = function() {
  var i, name, names, sum, v, _i, _len;
  names = readNames();
  names.sort();
  sum = 0;
  for (i = _i = 0, _len = names.length; _i < _len; i = ++_i) {
    name = names[i];
    v = alphabeticalValue(name) * (i + 1);
    sum += v;
  }
  return sum;
};


}).call(this,require("buffer").Buffer)
},{"buffer":3}],"e022":[function(require,module,exports){
module.exports=require('hIDUTM');
},{}],"e023":[function(require,module,exports){
module.exports=require('AQ06CM');
},{}],"AQ06CM":[function(require,module,exports){
var abundantList, divisorSum, isAbundant, isPerfect, math, problem;

module.exports = problem = new Problem("\nProblem 23: Non-abundant sums\n-----------------------------\n\nA perfect number is a number for which the sum of its proper divisors is exactly equal to the number. For example, the sum of the proper divisors of 28 would be 1 + 2 + 4 + 7 + 14 = 28, which means that 28 is a perfect number.\n\nA number n is called deficient if the sum of its proper divisors is less than n and it is called abundant if this sum exceeds n.\n\nAs 12 is the smallest abundant number, 1 + 2 + 3 + 4 + 6 = 16, the smallest number that can be written as the sum of two abundant numbers is 24. By mathematical analysis, it can be shown that all integers greater than 28123 can be written as the sum of two abundant numbers. However, this upper limit cannot be reduced any further by analysis even though it is known that the greatest number that cannot be expressed as the sum of two abundant numbers is less than this limit.\n\nFind the sum of all the positive integers which cannot be written as the sum of two abundant numbers.\n");

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
  var list, n, _i;
  list = [];
  for (n = _i = 1; _i <= 28123; n = ++_i) {
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
  var i, j, list, sum, sumOfAbundantsSeen, _i, _j, _k, _len, _len1;
  list = abundantList();
  console.log(list);
  sumOfAbundantsSeen = {};
  for (_i = 0, _len = list.length; _i < _len; _i++) {
    i = list[_i];
    for (_j = 0, _len1 = list.length; _j < _len1; _j++) {
      j = list[_j];
      sumOfAbundantsSeen[i + j] = true;
    }
  }
  sum = 0;
  for (i = _k = 1; _k <= 28123; i = ++_k) {
    if (!sumOfAbundantsSeen[i]) {
      sum += i;
    }
  }
  return sum;
};


},{"math":"LOkceL"}],"e024":[function(require,module,exports){
module.exports=require('F4IQQd');
},{}],"F4IQQd":[function(require,module,exports){
var dijkstraPermuteNext, lexPermuteFast, lexPermuteSlow, permute, problem, swap;

module.exports = problem = new Problem("\nProblem 24: Lexicographic permutations\n--------------------------------------\n\nA permutation is an ordered arrangement of objects. For example, 3124 is one possible permutation of the digits 1, 2, 3 and 4. If all of the permutations are listed numerically or alphabetically, we call it lexicographic order. The lexicographic permutations of 0, 1 and 2 are:\n\n                            012   021   102   120   201   210\n\nWhat is the millionth lexicographic permutation of the digits 0, 1, 2, 3, 4, 5, 6, 7, 8 and 9?\n");

permute = function(current, src, dst) {
  var i, leftovers, newcurrent, v, _i, _len, _results;
  _results = [];
  for (i = _i = 0, _len = src.length; _i < _len; i = ++_i) {
    v = src[i];
    newcurrent = current + v;
    if (src.length > 1) {
      leftovers = src.slice(0);
      leftovers.splice(i, 1);
      _results.push(permute(newcurrent, leftovers, dst));
    } else {
      _results.push(dst.push(newcurrent));
    }
  }
  return _results;
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

dijkstraPermuteNext = function(arr) {
  var i, j, _results;
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
  _results = [];
  while (i < j) {
    swap(arr, i - 1, j - 1);
    i++;
    _results.push(j--);
  }
  return _results;
};

lexPermuteFast = function(chars, which) {
  var arr, i, v, _i;
  arr = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = chars.length; _i < _len; _i++) {
      v = chars[_i];
      _results.push(parseInt(v));
    }
    return _results;
  })();
  for (i = _i = 1; 1 <= which ? _i < which : _i > which; i = 1 <= which ? ++_i : --_i) {
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


},{}],"e025":[function(require,module,exports){
module.exports=require('K16GeL');
},{}],"K16GeL":[function(require,module,exports){
var bigInt, firstFiboWithDigitCount, problem;

module.exports = problem = new Problem("\nProblem 25: 1000-digit Fibonacci number\n---------------------------------------\n\nThe Fibonacci sequence is defined by the recurrence relation:\n\nF(n) = F(n−1) + F(n−2), where F(1) = 1 and F(2) = 1.\nHence the first 12 terms will be:\n\nF(1)  = 1\nF(2)  = 1\nF(3)  = 2\nF(4)  = 3\nF(5)  = 5\nF(6)  = 8\nF(7)  = 13\nF(8)  = 21\nF(9)  = 34\nF(10) = 55\nF(11) = 89\nF(12) = 144\nThe 12th term, F(12), is the first term to contain three digits.\n\nWhat is the first term in the Fibonacci sequence to contain 1000 digits?\n");

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


},{"big-integer":2}],"LOkceL":[function(require,module,exports){
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

root.divisors = function(n) {
  var attempt, combosToTry, divisorList, factor, factorsSeen, i, primes, v, _i, _j, _len;
  primes = root.primeFactors(n);
  combosToTry = Math.pow(2, primes.length);
  factorsSeen = {};
  for (attempt = _i = 0; 0 <= combosToTry ? _i < combosToTry : _i > combosToTry; attempt = 0 <= combosToTry ? ++_i : --_i) {
    factor = 1;
    for (i = _j = 0, _len = primes.length; _j < _len; i = ++_j) {
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
    var _k, _len1, _ref, _results;
    _ref = Object.keys(factorsSeen);
    _results = [];
    for (_k = 0, _len1 = _ref.length; _k < _len1; _k++) {
      v = _ref[_k];
      _results.push(parseInt(v));
    }
    return _results;
  })();
  return divisorList;
};

root.sum = function(numberArray) {
  var n, sum, _i, _len;
  sum = 0;
  for (_i = 0, _len = numberArray.length; _i < _len; _i++) {
    n = numberArray[_i];
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


},{}],"math":[function(require,module,exports){
module.exports=require('LOkceL');
},{}],"terminal":[function(require,module,exports){
module.exports=require('Vazq8s');
},{}],"Vazq8s":[function(require,module,exports){
var LAST_PROBLEM, Problem, root;

LAST_PROBLEM = 25;

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
  var i, isEqual, _i, _ref;
  if ($.isArray(a) && $.isArray(b)) {
    isEqual = a.length === b.length;
    if (isEqual) {
      for (i = _i = 0, _ref = a.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uXFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxiYXNlNjQtanNcXGxpYlxcYjY0LmpzIiwiLi5cXG5vZGVfbW9kdWxlc1xcYmlnLWludGVnZXJcXEJpZ0ludGVnZXIuanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxidWZmZXJcXGluZGV4LmpzIiwiLi5cXG5vZGVfbW9kdWxlc1xcaWVlZTc1NFxcaW5kZXguanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxpcy1hcnJheVxcaW5kZXguanMiLCIuLlxcc3JjXFxlMDAxLmNvZmZlZSIsIi4uXFxzcmNcXGUwMDIuY29mZmVlIiwiLi5cXHNyY1xcZTAwMy5jb2ZmZWUiLCIuLlxcc3JjXFxlMDA0LmNvZmZlZSIsIi4uXFxzcmNcXGUwMDUuY29mZmVlIiwiLi5cXHNyY1xcZTAwNi5jb2ZmZWUiLCIuLlxcc3JjXFxlMDA3LmNvZmZlZSIsIi4uXFxzcmNcXGUwMDguY29mZmVlIiwiLi5cXHNyY1xcZTAwOS5jb2ZmZWUiLCIuLlxcc3JjXFxlMDEwLmNvZmZlZSIsIi4uXFxzcmNcXGUwMTEuY29mZmVlIiwiLi5cXHNyY1xcZTAxMi5jb2ZmZWUiLCIuLlxcc3JjXFxlMDEzLmNvZmZlZSIsIi4uXFxzcmNcXGUwMTQuY29mZmVlIiwiLi5cXHNyY1xcZTAxNS5jb2ZmZWUiLCIuLlxcc3JjXFxlMDE2LmNvZmZlZSIsIi4uXFxzcmNcXGUwMTcuY29mZmVlIiwiLi5cXHNyY1xcZTAxOC5jb2ZmZWUiLCIuLlxcc3JjXFxlMDE5LmNvZmZlZSIsIi4uXFxzcmNcXGUwMjAuY29mZmVlIiwiLi5cXHNyY1xcZTAyMS5jb2ZmZWUiLCIuLlxcc3JjXFxlMDIyLmNvZmZlZSIsIi4uXFxzcmNcXGUwMjMuY29mZmVlIiwiLi5cXHNyY1xcZTAyNC5jb2ZmZWUiLCIuLlxcc3JjXFxlMDI1LmNvZmZlZSIsIi4uXFxzcmNcXG1hdGguY29mZmVlIiwiLi5cXHNyY1xcdGVybWluYWwuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNzZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNWhDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QUMsSUFBSyxDQUFBLENBQUEsQ0FBVCxLQUFlLEdBQWxCO0FBQ0gsTUFBQSxJQUFJLENBQUMsR0FBTCxHQUFXLEtBQVgsQ0FBQTtBQUFBLE1BQ0EsSUFBSSxDQUFDLElBQUwsR0FBWSxJQURaLENBQUE7QUFBQSxNQUVBLElBQUksQ0FBQyxNQUFMLEdBQWMsSUFGZCxDQURHO0tBQUEsTUFJQSxJQUFHLEdBQUcsQ0FBQyxJQUFLLENBQUEsQ0FBQSxDQUFULEtBQWUsR0FBbEI7QUFDSCxNQUFBLElBQUksQ0FBQyxHQUFMLEdBQVcsVUFBWCxDQUFBO0FBQUEsTUFDQSxJQUFJLENBQUMsV0FBTCxHQUFtQixJQURuQixDQURHO0tBQUEsTUFHQSxJQUFHLEdBQUcsQ0FBQyxJQUFLLENBQUEsQ0FBQSxDQUFULEtBQWUsR0FBbEI7QUFDSCxNQUFBLElBQUksQ0FBQyxHQUFMLEdBQVcsTUFBWCxDQUFBO0FBQUEsTUFDQSxPQUFBLEdBQVUsS0FEVixDQUFBO0FBQUEsTUFFQSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQWhCLENBQXdCLHFXQUFBLEdBVWtDLFlBVmxDLEdBVWdELGlLQVZ4RSxDQUZBLENBREc7S0FBQSxNQUFBO0FBa0JILE1BQUEsT0FBQSxHQUFVLEtBQVYsQ0FBQTtBQUFBLE1BQ0EsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFoQixDQUFxQiwrQkFBckIsQ0FEQSxDQWxCRztLQW5ETDtBQXdFQSxJQUFBLElBQUcsSUFBSSxDQUFDLE9BQVI7QUFDRSxNQUFBLElBQUksQ0FBQyxXQUFMLEdBQW1CLElBQW5CLENBREY7S0F4RUE7QUEyRUEsSUFBQSxJQUFHLE9BQUg7YUFDRSxlQUFBLENBQWdCLElBQWhCLEVBREY7S0E1RWU7RUFBQSxFQUFBO0FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQWxIakIsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgbG9va3VwID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nO1xuXG47KGZ1bmN0aW9uIChleHBvcnRzKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuICB2YXIgQXJyID0gKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJylcbiAgICA/IFVpbnQ4QXJyYXlcbiAgICA6IEFycmF5XG5cblx0dmFyIFBMVVMgICA9ICcrJy5jaGFyQ29kZUF0KDApXG5cdHZhciBTTEFTSCAgPSAnLycuY2hhckNvZGVBdCgwKVxuXHR2YXIgTlVNQkVSID0gJzAnLmNoYXJDb2RlQXQoMClcblx0dmFyIExPV0VSICA9ICdhJy5jaGFyQ29kZUF0KDApXG5cdHZhciBVUFBFUiAgPSAnQScuY2hhckNvZGVBdCgwKVxuXG5cdGZ1bmN0aW9uIGRlY29kZSAoZWx0KSB7XG5cdFx0dmFyIGNvZGUgPSBlbHQuY2hhckNvZGVBdCgwKVxuXHRcdGlmIChjb2RlID09PSBQTFVTKVxuXHRcdFx0cmV0dXJuIDYyIC8vICcrJ1xuXHRcdGlmIChjb2RlID09PSBTTEFTSClcblx0XHRcdHJldHVybiA2MyAvLyAnLydcblx0XHRpZiAoY29kZSA8IE5VTUJFUilcblx0XHRcdHJldHVybiAtMSAvL25vIG1hdGNoXG5cdFx0aWYgKGNvZGUgPCBOVU1CRVIgKyAxMClcblx0XHRcdHJldHVybiBjb2RlIC0gTlVNQkVSICsgMjYgKyAyNlxuXHRcdGlmIChjb2RlIDwgVVBQRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gVVBQRVJcblx0XHRpZiAoY29kZSA8IExPV0VSICsgMjYpXG5cdFx0XHRyZXR1cm4gY29kZSAtIExPV0VSICsgMjZcblx0fVxuXG5cdGZ1bmN0aW9uIGI2NFRvQnl0ZUFycmF5IChiNjQpIHtcblx0XHR2YXIgaSwgaiwgbCwgdG1wLCBwbGFjZUhvbGRlcnMsIGFyclxuXG5cdFx0aWYgKGI2NC5sZW5ndGggJSA0ID4gMCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0Jylcblx0XHR9XG5cblx0XHQvLyB0aGUgbnVtYmVyIG9mIGVxdWFsIHNpZ25zIChwbGFjZSBob2xkZXJzKVxuXHRcdC8vIGlmIHRoZXJlIGFyZSB0d28gcGxhY2Vob2xkZXJzLCB0aGFuIHRoZSB0d28gY2hhcmFjdGVycyBiZWZvcmUgaXRcblx0XHQvLyByZXByZXNlbnQgb25lIGJ5dGVcblx0XHQvLyBpZiB0aGVyZSBpcyBvbmx5IG9uZSwgdGhlbiB0aGUgdGhyZWUgY2hhcmFjdGVycyBiZWZvcmUgaXQgcmVwcmVzZW50IDIgYnl0ZXNcblx0XHQvLyB0aGlzIGlzIGp1c3QgYSBjaGVhcCBoYWNrIHRvIG5vdCBkbyBpbmRleE9mIHR3aWNlXG5cdFx0dmFyIGxlbiA9IGI2NC5sZW5ndGhcblx0XHRwbGFjZUhvbGRlcnMgPSAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMikgPyAyIDogJz0nID09PSBiNjQuY2hhckF0KGxlbiAtIDEpID8gMSA6IDBcblxuXHRcdC8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuXHRcdGFyciA9IG5ldyBBcnIoYjY0Lmxlbmd0aCAqIDMgLyA0IC0gcGxhY2VIb2xkZXJzKVxuXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuXHRcdGwgPSBwbGFjZUhvbGRlcnMgPiAwID8gYjY0Lmxlbmd0aCAtIDQgOiBiNjQubGVuZ3RoXG5cblx0XHR2YXIgTCA9IDBcblxuXHRcdGZ1bmN0aW9uIHB1c2ggKHYpIHtcblx0XHRcdGFycltMKytdID0gdlxuXHRcdH1cblxuXHRcdGZvciAoaSA9IDAsIGogPSAwOyBpIDwgbDsgaSArPSA0LCBqICs9IDMpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTgpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgMTIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPDwgNikgfCBkZWNvZGUoYjY0LmNoYXJBdChpICsgMykpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDAwMCkgPj4gMTYpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDApID4+IDgpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fVxuXG5cdFx0aWYgKHBsYWNlSG9sZGVycyA9PT0gMikge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAyKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpID4+IDQpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fSBlbHNlIGlmIChwbGFjZUhvbGRlcnMgPT09IDEpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTApIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgNCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA+PiAyKVxuXHRcdFx0cHVzaCgodG1wID4+IDgpICYgMHhGRilcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRyZXR1cm4gYXJyXG5cdH1cblxuXHRmdW5jdGlvbiB1aW50OFRvQmFzZTY0ICh1aW50OCkge1xuXHRcdHZhciBpLFxuXHRcdFx0ZXh0cmFCeXRlcyA9IHVpbnQ4Lmxlbmd0aCAlIDMsIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG5cdFx0XHRvdXRwdXQgPSBcIlwiLFxuXHRcdFx0dGVtcCwgbGVuZ3RoXG5cblx0XHRmdW5jdGlvbiBlbmNvZGUgKG51bSkge1xuXHRcdFx0cmV0dXJuIGxvb2t1cC5jaGFyQXQobnVtKVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG5cdFx0XHRyZXR1cm4gZW5jb2RlKG51bSA+PiAxOCAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiAxMiAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiA2ICYgMHgzRikgKyBlbmNvZGUobnVtICYgMHgzRilcblx0XHR9XG5cblx0XHQvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG5cdFx0Zm9yIChpID0gMCwgbGVuZ3RoID0gdWludDgubGVuZ3RoIC0gZXh0cmFCeXRlczsgaSA8IGxlbmd0aDsgaSArPSAzKSB7XG5cdFx0XHR0ZW1wID0gKHVpbnQ4W2ldIDw8IDE2KSArICh1aW50OFtpICsgMV0gPDwgOCkgKyAodWludDhbaSArIDJdKVxuXHRcdFx0b3V0cHV0ICs9IHRyaXBsZXRUb0Jhc2U2NCh0ZW1wKVxuXHRcdH1cblxuXHRcdC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcblx0XHRzd2l0Y2ggKGV4dHJhQnl0ZXMpIHtcblx0XHRcdGNhc2UgMTpcblx0XHRcdFx0dGVtcCA9IHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUodGVtcCA+PiAyKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9PSdcblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgMjpcblx0XHRcdFx0dGVtcCA9ICh1aW50OFt1aW50OC5sZW5ndGggLSAyXSA8PCA4KSArICh1aW50OFt1aW50OC5sZW5ndGggLSAxXSlcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDEwKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wID4+IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA8PCAyKSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSAnPSdcblx0XHRcdFx0YnJlYWtcblx0XHR9XG5cblx0XHRyZXR1cm4gb3V0cHV0XG5cdH1cblxuXHRleHBvcnRzLnRvQnl0ZUFycmF5ID0gYjY0VG9CeXRlQXJyYXlcblx0ZXhwb3J0cy5mcm9tQnl0ZUFycmF5ID0gdWludDhUb0Jhc2U2NFxufSh0eXBlb2YgZXhwb3J0cyA9PT0gJ3VuZGVmaW5lZCcgPyAodGhpcy5iYXNlNjRqcyA9IHt9KSA6IGV4cG9ydHMpKVxuIiwidmFyIGJpZ0ludCA9IChmdW5jdGlvbiAodW5kZWZpbmVkKSB7XHJcbiAgICBcInVzZSBzdHJpY3RcIjtcclxuXHJcbiAgICB2YXIgQkFTRSA9IDFlNyxcclxuICAgICAgICBMT0dfQkFTRSA9IDcsXHJcbiAgICAgICAgTUFYX0lOVCA9IDkwMDcxOTkyNTQ3NDA5OTIsXHJcbiAgICAgICAgTUFYX0lOVF9BUlIgPSBzbWFsbFRvQXJyYXkoTUFYX0lOVCksXHJcbiAgICAgICAgREVGQVVMVF9BTFBIQUJFVCA9IFwiMDEyMzQ1Njc4OWFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6XCI7XHJcblxyXG4gICAgdmFyIHN1cHBvcnRzTmF0aXZlQmlnSW50ID0gdHlwZW9mIEJpZ0ludCA9PT0gXCJmdW5jdGlvblwiO1xyXG5cclxuICAgIGZ1bmN0aW9uIEludGVnZXIodiwgcmFkaXgsIGFscGhhYmV0LCBjYXNlU2Vuc2l0aXZlKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2ID09PSBcInVuZGVmaW5lZFwiKSByZXR1cm4gSW50ZWdlclswXTtcclxuICAgICAgICBpZiAodHlwZW9mIHJhZGl4ICE9PSBcInVuZGVmaW5lZFwiKSByZXR1cm4gK3JhZGl4ID09PSAxMCAmJiAhYWxwaGFiZXQgPyBwYXJzZVZhbHVlKHYpIDogcGFyc2VCYXNlKHYsIHJhZGl4LCBhbHBoYWJldCwgY2FzZVNlbnNpdGl2ZSk7XHJcbiAgICAgICAgcmV0dXJuIHBhcnNlVmFsdWUodik7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gQmlnSW50ZWdlcih2YWx1ZSwgc2lnbikge1xyXG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcclxuICAgICAgICB0aGlzLnNpZ24gPSBzaWduO1xyXG4gICAgICAgIHRoaXMuaXNTbWFsbCA9IGZhbHNlO1xyXG4gICAgfVxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEludGVnZXIucHJvdG90eXBlKTtcclxuXHJcbiAgICBmdW5jdGlvbiBTbWFsbEludGVnZXIodmFsdWUpIHtcclxuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgdGhpcy5zaWduID0gdmFsdWUgPCAwO1xyXG4gICAgICAgIHRoaXMuaXNTbWFsbCA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBTbWFsbEludGVnZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShJbnRlZ2VyLnByb3RvdHlwZSk7XHJcblxyXG4gICAgZnVuY3Rpb24gTmF0aXZlQmlnSW50KHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSW50ZWdlci5wcm90b3R5cGUpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGlzUHJlY2lzZShuKSB7XHJcbiAgICAgICAgcmV0dXJuIC1NQVhfSU5UIDwgbiAmJiBuIDwgTUFYX0lOVDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzbWFsbFRvQXJyYXkobikgeyAvLyBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucyBkb2Vzbid0IHJlZmVyZW5jZSBCQVNFLCBuZWVkIHRvIGNoYW5nZSB0aGlzIGZ1bmN0aW9uIGlmIEJBU0UgY2hhbmdlc1xyXG4gICAgICAgIGlmIChuIDwgMWU3KVxyXG4gICAgICAgICAgICByZXR1cm4gW25dO1xyXG4gICAgICAgIGlmIChuIDwgMWUxNClcclxuICAgICAgICAgICAgcmV0dXJuIFtuICUgMWU3LCBNYXRoLmZsb29yKG4gLyAxZTcpXTtcclxuICAgICAgICByZXR1cm4gW24gJSAxZTcsIE1hdGguZmxvb3IobiAvIDFlNykgJSAxZTcsIE1hdGguZmxvb3IobiAvIDFlMTQpXTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhcnJheVRvU21hbGwoYXJyKSB7IC8vIElmIEJBU0UgY2hhbmdlcyB0aGlzIGZ1bmN0aW9uIG1heSBuZWVkIHRvIGNoYW5nZVxyXG4gICAgICAgIHRyaW0oYXJyKTtcclxuICAgICAgICB2YXIgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICBpZiAobGVuZ3RoIDwgNCAmJiBjb21wYXJlQWJzKGFyciwgTUFYX0lOVF9BUlIpIDwgMCkge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKGxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAwOiByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIGNhc2UgMTogcmV0dXJuIGFyclswXTtcclxuICAgICAgICAgICAgICAgIGNhc2UgMjogcmV0dXJuIGFyclswXSArIGFyclsxXSAqIEJBU0U7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiByZXR1cm4gYXJyWzBdICsgKGFyclsxXSArIGFyclsyXSAqIEJBU0UpICogQkFTRTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRyaW0odikge1xyXG4gICAgICAgIHZhciBpID0gdi5sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKHZbLS1pXSA9PT0gMCk7XHJcbiAgICAgICAgdi5sZW5ndGggPSBpICsgMTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjcmVhdGVBcnJheShsZW5ndGgpIHsgLy8gZnVuY3Rpb24gc2hhbWVsZXNzbHkgc3RvbGVuIGZyb20gWWFmZmxlJ3MgbGlicmFyeSBodHRwczovL2dpdGh1Yi5jb20vWWFmZmxlL0JpZ0ludGVnZXJcclxuICAgICAgICB2YXIgeCA9IG5ldyBBcnJheShsZW5ndGgpO1xyXG4gICAgICAgIHZhciBpID0gLTE7XHJcbiAgICAgICAgd2hpbGUgKCsraSA8IGxlbmd0aCkge1xyXG4gICAgICAgICAgICB4W2ldID0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHg7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdHJ1bmNhdGUobikge1xyXG4gICAgICAgIGlmIChuID4gMCkgcmV0dXJuIE1hdGguZmxvb3Iobik7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguY2VpbChuKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhZGQoYSwgYikgeyAvLyBhc3N1bWVzIGEgYW5kIGIgYXJlIGFycmF5cyB3aXRoIGEubGVuZ3RoID49IGIubGVuZ3RoXHJcbiAgICAgICAgdmFyIGxfYSA9IGEubGVuZ3RoLFxyXG4gICAgICAgICAgICBsX2IgPSBiLmxlbmd0aCxcclxuICAgICAgICAgICAgciA9IG5ldyBBcnJheShsX2EpLFxyXG4gICAgICAgICAgICBjYXJyeSA9IDAsXHJcbiAgICAgICAgICAgIGJhc2UgPSBCQVNFLFxyXG4gICAgICAgICAgICBzdW0sIGk7XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxfYjsgaSsrKSB7XHJcbiAgICAgICAgICAgIHN1bSA9IGFbaV0gKyBiW2ldICsgY2Fycnk7XHJcbiAgICAgICAgICAgIGNhcnJ5ID0gc3VtID49IGJhc2UgPyAxIDogMDtcclxuICAgICAgICAgICAgcltpXSA9IHN1bSAtIGNhcnJ5ICogYmFzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgd2hpbGUgKGkgPCBsX2EpIHtcclxuICAgICAgICAgICAgc3VtID0gYVtpXSArIGNhcnJ5O1xyXG4gICAgICAgICAgICBjYXJyeSA9IHN1bSA9PT0gYmFzZSA/IDEgOiAwO1xyXG4gICAgICAgICAgICByW2krK10gPSBzdW0gLSBjYXJyeSAqIGJhc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChjYXJyeSA+IDApIHIucHVzaChjYXJyeSk7XHJcbiAgICAgICAgcmV0dXJuIHI7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYWRkQW55KGEsIGIpIHtcclxuICAgICAgICBpZiAoYS5sZW5ndGggPj0gYi5sZW5ndGgpIHJldHVybiBhZGQoYSwgYik7XHJcbiAgICAgICAgcmV0dXJuIGFkZChiLCBhKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhZGRTbWFsbChhLCBjYXJyeSkgeyAvLyBhc3N1bWVzIGEgaXMgYXJyYXksIGNhcnJ5IGlzIG51bWJlciB3aXRoIDAgPD0gY2FycnkgPCBNQVhfSU5UXHJcbiAgICAgICAgdmFyIGwgPSBhLmxlbmd0aCxcclxuICAgICAgICAgICAgciA9IG5ldyBBcnJheShsKSxcclxuICAgICAgICAgICAgYmFzZSA9IEJBU0UsXHJcbiAgICAgICAgICAgIHN1bSwgaTtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHN1bSA9IGFbaV0gLSBiYXNlICsgY2Fycnk7XHJcbiAgICAgICAgICAgIGNhcnJ5ID0gTWF0aC5mbG9vcihzdW0gLyBiYXNlKTtcclxuICAgICAgICAgICAgcltpXSA9IHN1bSAtIGNhcnJ5ICogYmFzZTtcclxuICAgICAgICAgICAgY2FycnkgKz0gMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgd2hpbGUgKGNhcnJ5ID4gMCkge1xyXG4gICAgICAgICAgICByW2krK10gPSBjYXJyeSAlIGJhc2U7XHJcbiAgICAgICAgICAgIGNhcnJ5ID0gTWF0aC5mbG9vcihjYXJyeSAvIGJhc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcjtcclxuICAgIH1cclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHZhciBuID0gcGFyc2VWYWx1ZSh2KTtcclxuICAgICAgICBpZiAodGhpcy5zaWduICE9PSBuLnNpZ24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3VidHJhY3Qobi5uZWdhdGUoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBhID0gdGhpcy52YWx1ZSwgYiA9IG4udmFsdWU7XHJcbiAgICAgICAgaWYgKG4uaXNTbWFsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEJpZ0ludGVnZXIoYWRkU21hbGwoYSwgTWF0aC5hYnMoYikpLCB0aGlzLnNpZ24pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbmV3IEJpZ0ludGVnZXIoYWRkQW55KGEsIGIpLCB0aGlzLnNpZ24pO1xyXG4gICAgfTtcclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLnBsdXMgPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hZGQ7XHJcblxyXG4gICAgU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHZhciBuID0gcGFyc2VWYWx1ZSh2KTtcclxuICAgICAgICB2YXIgYSA9IHRoaXMudmFsdWU7XHJcbiAgICAgICAgaWYgKGEgPCAwICE9PSBuLnNpZ24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3VidHJhY3Qobi5uZWdhdGUoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBiID0gbi52YWx1ZTtcclxuICAgICAgICBpZiAobi5pc1NtYWxsKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1ByZWNpc2UoYSArIGIpKSByZXR1cm4gbmV3IFNtYWxsSW50ZWdlcihhICsgYik7XHJcbiAgICAgICAgICAgIGIgPSBzbWFsbFRvQXJyYXkoTWF0aC5hYnMoYikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbmV3IEJpZ0ludGVnZXIoYWRkU21hbGwoYiwgTWF0aC5hYnMoYSkpLCBhIDwgMCk7XHJcbiAgICB9O1xyXG4gICAgU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5wbHVzID0gU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5hZGQ7XHJcblxyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHJldHVybiBuZXcgTmF0aXZlQmlnSW50KHRoaXMudmFsdWUgKyBwYXJzZVZhbHVlKHYpLnZhbHVlKTtcclxuICAgIH1cclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUucGx1cyA9IE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuYWRkO1xyXG5cclxuICAgIGZ1bmN0aW9uIHN1YnRyYWN0KGEsIGIpIHsgLy8gYXNzdW1lcyBhIGFuZCBiIGFyZSBhcnJheXMgd2l0aCBhID49IGJcclxuICAgICAgICB2YXIgYV9sID0gYS5sZW5ndGgsXHJcbiAgICAgICAgICAgIGJfbCA9IGIubGVuZ3RoLFxyXG4gICAgICAgICAgICByID0gbmV3IEFycmF5KGFfbCksXHJcbiAgICAgICAgICAgIGJvcnJvdyA9IDAsXHJcbiAgICAgICAgICAgIGJhc2UgPSBCQVNFLFxyXG4gICAgICAgICAgICBpLCBkaWZmZXJlbmNlO1xyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBiX2w7IGkrKykge1xyXG4gICAgICAgICAgICBkaWZmZXJlbmNlID0gYVtpXSAtIGJvcnJvdyAtIGJbaV07XHJcbiAgICAgICAgICAgIGlmIChkaWZmZXJlbmNlIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgZGlmZmVyZW5jZSArPSBiYXNlO1xyXG4gICAgICAgICAgICAgICAgYm9ycm93ID0gMTtcclxuICAgICAgICAgICAgfSBlbHNlIGJvcnJvdyA9IDA7XHJcbiAgICAgICAgICAgIHJbaV0gPSBkaWZmZXJlbmNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGkgPSBiX2w7IGkgPCBhX2w7IGkrKykge1xyXG4gICAgICAgICAgICBkaWZmZXJlbmNlID0gYVtpXSAtIGJvcnJvdztcclxuICAgICAgICAgICAgaWYgKGRpZmZlcmVuY2UgPCAwKSBkaWZmZXJlbmNlICs9IGJhc2U7XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcltpKytdID0gZGlmZmVyZW5jZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJbaV0gPSBkaWZmZXJlbmNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKDsgaSA8IGFfbDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHJbaV0gPSBhW2ldO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0cmltKHIpO1xyXG4gICAgICAgIHJldHVybiByO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHN1YnRyYWN0QW55KGEsIGIsIHNpZ24pIHtcclxuICAgICAgICB2YXIgdmFsdWU7XHJcbiAgICAgICAgaWYgKGNvbXBhcmVBYnMoYSwgYikgPj0gMCkge1xyXG4gICAgICAgICAgICB2YWx1ZSA9IHN1YnRyYWN0KGEsIGIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0gc3VidHJhY3QoYiwgYSk7XHJcbiAgICAgICAgICAgIHNpZ24gPSAhc2lnbjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFsdWUgPSBhcnJheVRvU21hbGwodmFsdWUpO1xyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICAgICAgaWYgKHNpZ24pIHZhbHVlID0gLXZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFNtYWxsSW50ZWdlcih2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBuZXcgQmlnSW50ZWdlcih2YWx1ZSwgc2lnbik7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc3VidHJhY3RTbWFsbChhLCBiLCBzaWduKSB7IC8vIGFzc3VtZXMgYSBpcyBhcnJheSwgYiBpcyBudW1iZXIgd2l0aCAwIDw9IGIgPCBNQVhfSU5UXHJcbiAgICAgICAgdmFyIGwgPSBhLmxlbmd0aCxcclxuICAgICAgICAgICAgciA9IG5ldyBBcnJheShsKSxcclxuICAgICAgICAgICAgY2FycnkgPSAtYixcclxuICAgICAgICAgICAgYmFzZSA9IEJBU0UsXHJcbiAgICAgICAgICAgIGksIGRpZmZlcmVuY2U7XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgICAgICBkaWZmZXJlbmNlID0gYVtpXSArIGNhcnJ5O1xyXG4gICAgICAgICAgICBjYXJyeSA9IE1hdGguZmxvb3IoZGlmZmVyZW5jZSAvIGJhc2UpO1xyXG4gICAgICAgICAgICBkaWZmZXJlbmNlICU9IGJhc2U7XHJcbiAgICAgICAgICAgIHJbaV0gPSBkaWZmZXJlbmNlIDwgMCA/IGRpZmZlcmVuY2UgKyBiYXNlIDogZGlmZmVyZW5jZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgciA9IGFycmF5VG9TbWFsbChyKTtcclxuICAgICAgICBpZiAodHlwZW9mIHIgPT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICAgICAgaWYgKHNpZ24pIHIgPSAtcjtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBTbWFsbEludGVnZXIocik7XHJcbiAgICAgICAgfSByZXR1cm4gbmV3IEJpZ0ludGVnZXIociwgc2lnbik7XHJcbiAgICB9XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuc3VidHJhY3QgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHZhciBuID0gcGFyc2VWYWx1ZSh2KTtcclxuICAgICAgICBpZiAodGhpcy5zaWduICE9PSBuLnNpZ24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkKG4ubmVnYXRlKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgYSA9IHRoaXMudmFsdWUsIGIgPSBuLnZhbHVlO1xyXG4gICAgICAgIGlmIChuLmlzU21hbGwpXHJcbiAgICAgICAgICAgIHJldHVybiBzdWJ0cmFjdFNtYWxsKGEsIE1hdGguYWJzKGIpLCB0aGlzLnNpZ24pO1xyXG4gICAgICAgIHJldHVybiBzdWJ0cmFjdEFueShhLCBiLCB0aGlzLnNpZ24pO1xyXG4gICAgfTtcclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLm1pbnVzID0gQmlnSW50ZWdlci5wcm90b3R5cGUuc3VidHJhY3Q7XHJcblxyXG4gICAgU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5zdWJ0cmFjdCA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgdmFyIG4gPSBwYXJzZVZhbHVlKHYpO1xyXG4gICAgICAgIHZhciBhID0gdGhpcy52YWx1ZTtcclxuICAgICAgICBpZiAoYSA8IDAgIT09IG4uc2lnbikge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hZGQobi5uZWdhdGUoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBiID0gbi52YWx1ZTtcclxuICAgICAgICBpZiAobi5pc1NtYWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgU21hbGxJbnRlZ2VyKGEgLSBiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHN1YnRyYWN0U21hbGwoYiwgTWF0aC5hYnMoYSksIGEgPj0gMCk7XHJcbiAgICB9O1xyXG4gICAgU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5taW51cyA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUuc3VidHJhY3Q7XHJcblxyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5zdWJ0cmFjdCA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBOYXRpdmVCaWdJbnQodGhpcy52YWx1ZSAtIHBhcnNlVmFsdWUodikudmFsdWUpO1xyXG4gICAgfVxyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5taW51cyA9IE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuc3VidHJhY3Q7XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUubmVnYXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgQmlnSW50ZWdlcih0aGlzLnZhbHVlLCAhdGhpcy5zaWduKTtcclxuICAgIH07XHJcbiAgICBTbWFsbEludGVnZXIucHJvdG90eXBlLm5lZ2F0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgc2lnbiA9IHRoaXMuc2lnbjtcclxuICAgICAgICB2YXIgc21hbGwgPSBuZXcgU21hbGxJbnRlZ2VyKC10aGlzLnZhbHVlKTtcclxuICAgICAgICBzbWFsbC5zaWduID0gIXNpZ247XHJcbiAgICAgICAgcmV0dXJuIHNtYWxsO1xyXG4gICAgfTtcclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUubmVnYXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgTmF0aXZlQmlnSW50KC10aGlzLnZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hYnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCaWdJbnRlZ2VyKHRoaXMudmFsdWUsIGZhbHNlKTtcclxuICAgIH07XHJcbiAgICBTbWFsbEludGVnZXIucHJvdG90eXBlLmFicyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFNtYWxsSW50ZWdlcihNYXRoLmFicyh0aGlzLnZhbHVlKSk7XHJcbiAgICB9O1xyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5hYnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBOYXRpdmVCaWdJbnQodGhpcy52YWx1ZSA+PSAwID8gdGhpcy52YWx1ZSA6IC10aGlzLnZhbHVlKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgZnVuY3Rpb24gbXVsdGlwbHlMb25nKGEsIGIpIHtcclxuICAgICAgICB2YXIgYV9sID0gYS5sZW5ndGgsXHJcbiAgICAgICAgICAgIGJfbCA9IGIubGVuZ3RoLFxyXG4gICAgICAgICAgICBsID0gYV9sICsgYl9sLFxyXG4gICAgICAgICAgICByID0gY3JlYXRlQXJyYXkobCksXHJcbiAgICAgICAgICAgIGJhc2UgPSBCQVNFLFxyXG4gICAgICAgICAgICBwcm9kdWN0LCBjYXJyeSwgaSwgYV9pLCBiX2o7XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGFfbDsgKytpKSB7XHJcbiAgICAgICAgICAgIGFfaSA9IGFbaV07XHJcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYl9sOyArK2opIHtcclxuICAgICAgICAgICAgICAgIGJfaiA9IGJbal07XHJcbiAgICAgICAgICAgICAgICBwcm9kdWN0ID0gYV9pICogYl9qICsgcltpICsgal07XHJcbiAgICAgICAgICAgICAgICBjYXJyeSA9IE1hdGguZmxvb3IocHJvZHVjdCAvIGJhc2UpO1xyXG4gICAgICAgICAgICAgICAgcltpICsgal0gPSBwcm9kdWN0IC0gY2FycnkgKiBiYXNlO1xyXG4gICAgICAgICAgICAgICAgcltpICsgaiArIDFdICs9IGNhcnJ5O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRyaW0ocik7XHJcbiAgICAgICAgcmV0dXJuIHI7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbXVsdGlwbHlTbWFsbChhLCBiKSB7IC8vIGFzc3VtZXMgYSBpcyBhcnJheSwgYiBpcyBudW1iZXIgd2l0aCB8YnwgPCBCQVNFXHJcbiAgICAgICAgdmFyIGwgPSBhLmxlbmd0aCxcclxuICAgICAgICAgICAgciA9IG5ldyBBcnJheShsKSxcclxuICAgICAgICAgICAgYmFzZSA9IEJBU0UsXHJcbiAgICAgICAgICAgIGNhcnJ5ID0gMCxcclxuICAgICAgICAgICAgcHJvZHVjdCwgaTtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHByb2R1Y3QgPSBhW2ldICogYiArIGNhcnJ5O1xyXG4gICAgICAgICAgICBjYXJyeSA9IE1hdGguZmxvb3IocHJvZHVjdCAvIGJhc2UpO1xyXG4gICAgICAgICAgICByW2ldID0gcHJvZHVjdCAtIGNhcnJ5ICogYmFzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgd2hpbGUgKGNhcnJ5ID4gMCkge1xyXG4gICAgICAgICAgICByW2krK10gPSBjYXJyeSAlIGJhc2U7XHJcbiAgICAgICAgICAgIGNhcnJ5ID0gTWF0aC5mbG9vcihjYXJyeSAvIGJhc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzaGlmdExlZnQoeCwgbikge1xyXG4gICAgICAgIHZhciByID0gW107XHJcbiAgICAgICAgd2hpbGUgKG4tLSA+IDApIHIucHVzaCgwKTtcclxuICAgICAgICByZXR1cm4gci5jb25jYXQoeCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbXVsdGlwbHlLYXJhdHN1YmEoeCwgeSkge1xyXG4gICAgICAgIHZhciBuID0gTWF0aC5tYXgoeC5sZW5ndGgsIHkubGVuZ3RoKTtcclxuXHJcbiAgICAgICAgaWYgKG4gPD0gMzApIHJldHVybiBtdWx0aXBseUxvbmcoeCwgeSk7XHJcbiAgICAgICAgbiA9IE1hdGguY2VpbChuIC8gMik7XHJcblxyXG4gICAgICAgIHZhciBiID0geC5zbGljZShuKSxcclxuICAgICAgICAgICAgYSA9IHguc2xpY2UoMCwgbiksXHJcbiAgICAgICAgICAgIGQgPSB5LnNsaWNlKG4pLFxyXG4gICAgICAgICAgICBjID0geS5zbGljZSgwLCBuKTtcclxuXHJcbiAgICAgICAgdmFyIGFjID0gbXVsdGlwbHlLYXJhdHN1YmEoYSwgYyksXHJcbiAgICAgICAgICAgIGJkID0gbXVsdGlwbHlLYXJhdHN1YmEoYiwgZCksXHJcbiAgICAgICAgICAgIGFiY2QgPSBtdWx0aXBseUthcmF0c3ViYShhZGRBbnkoYSwgYiksIGFkZEFueShjLCBkKSk7XHJcblxyXG4gICAgICAgIHZhciBwcm9kdWN0ID0gYWRkQW55KGFkZEFueShhYywgc2hpZnRMZWZ0KHN1YnRyYWN0KHN1YnRyYWN0KGFiY2QsIGFjKSwgYmQpLCBuKSksIHNoaWZ0TGVmdChiZCwgMiAqIG4pKTtcclxuICAgICAgICB0cmltKHByb2R1Y3QpO1xyXG4gICAgICAgIHJldHVybiBwcm9kdWN0O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFRoZSBmb2xsb3dpbmcgZnVuY3Rpb24gaXMgZGVyaXZlZCBmcm9tIGEgc3VyZmFjZSBmaXQgb2YgYSBncmFwaCBwbG90dGluZyB0aGUgcGVyZm9ybWFuY2UgZGlmZmVyZW5jZVxyXG4gICAgLy8gYmV0d2VlbiBsb25nIG11bHRpcGxpY2F0aW9uIGFuZCBrYXJhdHN1YmEgbXVsdGlwbGljYXRpb24gdmVyc3VzIHRoZSBsZW5ndGhzIG9mIHRoZSB0d28gYXJyYXlzLlxyXG4gICAgZnVuY3Rpb24gdXNlS2FyYXRzdWJhKGwxLCBsMikge1xyXG4gICAgICAgIHJldHVybiAtMC4wMTIgKiBsMSAtIDAuMDEyICogbDIgKyAwLjAwMDAxNSAqIGwxICogbDIgPiAwO1xyXG4gICAgfVxyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLm11bHRpcGx5ID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICB2YXIgbiA9IHBhcnNlVmFsdWUodiksXHJcbiAgICAgICAgICAgIGEgPSB0aGlzLnZhbHVlLCBiID0gbi52YWx1ZSxcclxuICAgICAgICAgICAgc2lnbiA9IHRoaXMuc2lnbiAhPT0gbi5zaWduLFxyXG4gICAgICAgICAgICBhYnM7XHJcbiAgICAgICAgaWYgKG4uaXNTbWFsbCkge1xyXG4gICAgICAgICAgICBpZiAoYiA9PT0gMCkgcmV0dXJuIEludGVnZXJbMF07XHJcbiAgICAgICAgICAgIGlmIChiID09PSAxKSByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgaWYgKGIgPT09IC0xKSByZXR1cm4gdGhpcy5uZWdhdGUoKTtcclxuICAgICAgICAgICAgYWJzID0gTWF0aC5hYnMoYik7XHJcbiAgICAgICAgICAgIGlmIChhYnMgPCBCQVNFKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEJpZ0ludGVnZXIobXVsdGlwbHlTbWFsbChhLCBhYnMpLCBzaWduKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBiID0gc21hbGxUb0FycmF5KGFicyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh1c2VLYXJhdHN1YmEoYS5sZW5ndGgsIGIubGVuZ3RoKSkgLy8gS2FyYXRzdWJhIGlzIG9ubHkgZmFzdGVyIGZvciBjZXJ0YWluIGFycmF5IHNpemVzXHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQmlnSW50ZWdlcihtdWx0aXBseUthcmF0c3ViYShhLCBiKSwgc2lnbik7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCaWdJbnRlZ2VyKG11bHRpcGx5TG9uZyhhLCBiKSwgc2lnbik7XHJcbiAgICB9O1xyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLnRpbWVzID0gQmlnSW50ZWdlci5wcm90b3R5cGUubXVsdGlwbHk7XHJcblxyXG4gICAgZnVuY3Rpb24gbXVsdGlwbHlTbWFsbEFuZEFycmF5KGEsIGIsIHNpZ24pIHsgLy8gYSA+PSAwXHJcbiAgICAgICAgaWYgKGEgPCBCQVNFKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQmlnSW50ZWdlcihtdWx0aXBseVNtYWxsKGIsIGEpLCBzaWduKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCaWdJbnRlZ2VyKG11bHRpcGx5TG9uZyhiLCBzbWFsbFRvQXJyYXkoYSkpLCBzaWduKTtcclxuICAgIH1cclxuICAgIFNtYWxsSW50ZWdlci5wcm90b3R5cGUuX211bHRpcGx5QnlTbWFsbCA9IGZ1bmN0aW9uIChhKSB7XHJcbiAgICAgICAgaWYgKGlzUHJlY2lzZShhLnZhbHVlICogdGhpcy52YWx1ZSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBTbWFsbEludGVnZXIoYS52YWx1ZSAqIHRoaXMudmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbXVsdGlwbHlTbWFsbEFuZEFycmF5KE1hdGguYWJzKGEudmFsdWUpLCBzbWFsbFRvQXJyYXkoTWF0aC5hYnModGhpcy52YWx1ZSkpLCB0aGlzLnNpZ24gIT09IGEuc2lnbik7XHJcbiAgICB9O1xyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuX211bHRpcGx5QnlTbWFsbCA9IGZ1bmN0aW9uIChhKSB7XHJcbiAgICAgICAgaWYgKGEudmFsdWUgPT09IDApIHJldHVybiBJbnRlZ2VyWzBdO1xyXG4gICAgICAgIGlmIChhLnZhbHVlID09PSAxKSByZXR1cm4gdGhpcztcclxuICAgICAgICBpZiAoYS52YWx1ZSA9PT0gLTEpIHJldHVybiB0aGlzLm5lZ2F0ZSgpO1xyXG4gICAgICAgIHJldHVybiBtdWx0aXBseVNtYWxsQW5kQXJyYXkoTWF0aC5hYnMoYS52YWx1ZSksIHRoaXMudmFsdWUsIHRoaXMuc2lnbiAhPT0gYS5zaWduKTtcclxuICAgIH07XHJcbiAgICBTbWFsbEludGVnZXIucHJvdG90eXBlLm11bHRpcGx5ID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICByZXR1cm4gcGFyc2VWYWx1ZSh2KS5fbXVsdGlwbHlCeVNtYWxsKHRoaXMpO1xyXG4gICAgfTtcclxuICAgIFNtYWxsSW50ZWdlci5wcm90b3R5cGUudGltZXMgPSBTbWFsbEludGVnZXIucHJvdG90eXBlLm11bHRpcGx5O1xyXG5cclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUubXVsdGlwbHkgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHJldHVybiBuZXcgTmF0aXZlQmlnSW50KHRoaXMudmFsdWUgKiBwYXJzZVZhbHVlKHYpLnZhbHVlKTtcclxuICAgIH1cclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUudGltZXMgPSBOYXRpdmVCaWdJbnQucHJvdG90eXBlLm11bHRpcGx5O1xyXG5cclxuICAgIGZ1bmN0aW9uIHNxdWFyZShhKSB7XHJcbiAgICAgICAgLy9jb25zb2xlLmFzc2VydCgyICogQkFTRSAqIEJBU0UgPCBNQVhfSU5UKTtcclxuICAgICAgICB2YXIgbCA9IGEubGVuZ3RoLFxyXG4gICAgICAgICAgICByID0gY3JlYXRlQXJyYXkobCArIGwpLFxyXG4gICAgICAgICAgICBiYXNlID0gQkFTRSxcclxuICAgICAgICAgICAgcHJvZHVjdCwgY2FycnksIGksIGFfaSwgYV9qO1xyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgICAgYV9pID0gYVtpXTtcclxuICAgICAgICAgICAgY2FycnkgPSAwIC0gYV9pICogYV9pO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gaTsgaiA8IGw7IGorKykge1xyXG4gICAgICAgICAgICAgICAgYV9qID0gYVtqXTtcclxuICAgICAgICAgICAgICAgIHByb2R1Y3QgPSAyICogKGFfaSAqIGFfaikgKyByW2kgKyBqXSArIGNhcnJ5O1xyXG4gICAgICAgICAgICAgICAgY2FycnkgPSBNYXRoLmZsb29yKHByb2R1Y3QgLyBiYXNlKTtcclxuICAgICAgICAgICAgICAgIHJbaSArIGpdID0gcHJvZHVjdCAtIGNhcnJ5ICogYmFzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByW2kgKyBsXSA9IGNhcnJ5O1xyXG4gICAgICAgIH1cclxuICAgICAgICB0cmltKHIpO1xyXG4gICAgICAgIHJldHVybiByO1xyXG4gICAgfVxyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLnNxdWFyZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IEJpZ0ludGVnZXIoc3F1YXJlKHRoaXMudmFsdWUpLCBmYWxzZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIFNtYWxsSW50ZWdlci5wcm90b3R5cGUuc3F1YXJlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB2YWx1ZSA9IHRoaXMudmFsdWUgKiB0aGlzLnZhbHVlO1xyXG4gICAgICAgIGlmIChpc1ByZWNpc2UodmFsdWUpKSByZXR1cm4gbmV3IFNtYWxsSW50ZWdlcih2YWx1ZSk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCaWdJbnRlZ2VyKHNxdWFyZShzbWFsbFRvQXJyYXkoTWF0aC5hYnModGhpcy52YWx1ZSkpKSwgZmFsc2UpO1xyXG4gICAgfTtcclxuXHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLnNxdWFyZSA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBOYXRpdmVCaWdJbnQodGhpcy52YWx1ZSAqIHRoaXMudmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRpdk1vZDEoYSwgYikgeyAvLyBMZWZ0IG92ZXIgZnJvbSBwcmV2aW91cyB2ZXJzaW9uLiBQZXJmb3JtcyBmYXN0ZXIgdGhhbiBkaXZNb2QyIG9uIHNtYWxsZXIgaW5wdXQgc2l6ZXMuXHJcbiAgICAgICAgdmFyIGFfbCA9IGEubGVuZ3RoLFxyXG4gICAgICAgICAgICBiX2wgPSBiLmxlbmd0aCxcclxuICAgICAgICAgICAgYmFzZSA9IEJBU0UsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IGNyZWF0ZUFycmF5KGIubGVuZ3RoKSxcclxuICAgICAgICAgICAgZGl2aXNvck1vc3RTaWduaWZpY2FudERpZ2l0ID0gYltiX2wgLSAxXSxcclxuICAgICAgICAgICAgLy8gbm9ybWFsaXphdGlvblxyXG4gICAgICAgICAgICBsYW1iZGEgPSBNYXRoLmNlaWwoYmFzZSAvICgyICogZGl2aXNvck1vc3RTaWduaWZpY2FudERpZ2l0KSksXHJcbiAgICAgICAgICAgIHJlbWFpbmRlciA9IG11bHRpcGx5U21hbGwoYSwgbGFtYmRhKSxcclxuICAgICAgICAgICAgZGl2aXNvciA9IG11bHRpcGx5U21hbGwoYiwgbGFtYmRhKSxcclxuICAgICAgICAgICAgcXVvdGllbnREaWdpdCwgc2hpZnQsIGNhcnJ5LCBib3Jyb3csIGksIGwsIHE7XHJcbiAgICAgICAgaWYgKHJlbWFpbmRlci5sZW5ndGggPD0gYV9sKSByZW1haW5kZXIucHVzaCgwKTtcclxuICAgICAgICBkaXZpc29yLnB1c2goMCk7XHJcbiAgICAgICAgZGl2aXNvck1vc3RTaWduaWZpY2FudERpZ2l0ID0gZGl2aXNvcltiX2wgLSAxXTtcclxuICAgICAgICBmb3IgKHNoaWZ0ID0gYV9sIC0gYl9sOyBzaGlmdCA+PSAwOyBzaGlmdC0tKSB7XHJcbiAgICAgICAgICAgIHF1b3RpZW50RGlnaXQgPSBiYXNlIC0gMTtcclxuICAgICAgICAgICAgaWYgKHJlbWFpbmRlcltzaGlmdCArIGJfbF0gIT09IGRpdmlzb3JNb3N0U2lnbmlmaWNhbnREaWdpdCkge1xyXG4gICAgICAgICAgICAgICAgcXVvdGllbnREaWdpdCA9IE1hdGguZmxvb3IoKHJlbWFpbmRlcltzaGlmdCArIGJfbF0gKiBiYXNlICsgcmVtYWluZGVyW3NoaWZ0ICsgYl9sIC0gMV0pIC8gZGl2aXNvck1vc3RTaWduaWZpY2FudERpZ2l0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBxdW90aWVudERpZ2l0IDw9IGJhc2UgLSAxXHJcbiAgICAgICAgICAgIGNhcnJ5ID0gMDtcclxuICAgICAgICAgICAgYm9ycm93ID0gMDtcclxuICAgICAgICAgICAgbCA9IGRpdmlzb3IubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBjYXJyeSArPSBxdW90aWVudERpZ2l0ICogZGl2aXNvcltpXTtcclxuICAgICAgICAgICAgICAgIHEgPSBNYXRoLmZsb29yKGNhcnJ5IC8gYmFzZSk7XHJcbiAgICAgICAgICAgICAgICBib3Jyb3cgKz0gcmVtYWluZGVyW3NoaWZ0ICsgaV0gLSAoY2FycnkgLSBxICogYmFzZSk7XHJcbiAgICAgICAgICAgICAgICBjYXJyeSA9IHE7XHJcbiAgICAgICAgICAgICAgICBpZiAoYm9ycm93IDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbWFpbmRlcltzaGlmdCArIGldID0gYm9ycm93ICsgYmFzZTtcclxuICAgICAgICAgICAgICAgICAgICBib3Jyb3cgPSAtMTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVtYWluZGVyW3NoaWZ0ICsgaV0gPSBib3Jyb3c7XHJcbiAgICAgICAgICAgICAgICAgICAgYm9ycm93ID0gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB3aGlsZSAoYm9ycm93ICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBxdW90aWVudERpZ2l0IC09IDE7XHJcbiAgICAgICAgICAgICAgICBjYXJyeSA9IDA7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FycnkgKz0gcmVtYWluZGVyW3NoaWZ0ICsgaV0gLSBiYXNlICsgZGl2aXNvcltpXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY2FycnkgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbWFpbmRlcltzaGlmdCArIGldID0gY2FycnkgKyBiYXNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJyeSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVtYWluZGVyW3NoaWZ0ICsgaV0gPSBjYXJyeTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FycnkgPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJvcnJvdyArPSBjYXJyeTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXN1bHRbc2hpZnRdID0gcXVvdGllbnREaWdpdDtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gZGVub3JtYWxpemF0aW9uXHJcbiAgICAgICAgcmVtYWluZGVyID0gZGl2TW9kU21hbGwocmVtYWluZGVyLCBsYW1iZGEpWzBdO1xyXG4gICAgICAgIHJldHVybiBbYXJyYXlUb1NtYWxsKHJlc3VsdCksIGFycmF5VG9TbWFsbChyZW1haW5kZXIpXTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkaXZNb2QyKGEsIGIpIHsgLy8gSW1wbGVtZW50YXRpb24gaWRlYSBzaGFtZWxlc3NseSBzdG9sZW4gZnJvbSBTaWxlbnQgTWF0dCdzIGxpYnJhcnkgaHR0cDovL3NpbGVudG1hdHQuY29tL2JpZ2ludGVnZXIvXHJcbiAgICAgICAgLy8gUGVyZm9ybXMgZmFzdGVyIHRoYW4gZGl2TW9kMSBvbiBsYXJnZXIgaW5wdXQgc2l6ZXMuXHJcbiAgICAgICAgdmFyIGFfbCA9IGEubGVuZ3RoLFxyXG4gICAgICAgICAgICBiX2wgPSBiLmxlbmd0aCxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIHBhcnQgPSBbXSxcclxuICAgICAgICAgICAgYmFzZSA9IEJBU0UsXHJcbiAgICAgICAgICAgIGd1ZXNzLCB4bGVuLCBoaWdoeCwgaGlnaHksIGNoZWNrO1xyXG4gICAgICAgIHdoaWxlIChhX2wpIHtcclxuICAgICAgICAgICAgcGFydC51bnNoaWZ0KGFbLS1hX2xdKTtcclxuICAgICAgICAgICAgdHJpbShwYXJ0KTtcclxuICAgICAgICAgICAgaWYgKGNvbXBhcmVBYnMocGFydCwgYikgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCgwKTtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHhsZW4gPSBwYXJ0Lmxlbmd0aDtcclxuICAgICAgICAgICAgaGlnaHggPSBwYXJ0W3hsZW4gLSAxXSAqIGJhc2UgKyBwYXJ0W3hsZW4gLSAyXTtcclxuICAgICAgICAgICAgaGlnaHkgPSBiW2JfbCAtIDFdICogYmFzZSArIGJbYl9sIC0gMl07XHJcbiAgICAgICAgICAgIGlmICh4bGVuID4gYl9sKSB7XHJcbiAgICAgICAgICAgICAgICBoaWdoeCA9IChoaWdoeCArIDEpICogYmFzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBndWVzcyA9IE1hdGguY2VpbChoaWdoeCAvIGhpZ2h5KTtcclxuICAgICAgICAgICAgZG8ge1xyXG4gICAgICAgICAgICAgICAgY2hlY2sgPSBtdWx0aXBseVNtYWxsKGIsIGd1ZXNzKTtcclxuICAgICAgICAgICAgICAgIGlmIChjb21wYXJlQWJzKGNoZWNrLCBwYXJ0KSA8PSAwKSBicmVhaztcclxuICAgICAgICAgICAgICAgIGd1ZXNzLS07XHJcbiAgICAgICAgICAgIH0gd2hpbGUgKGd1ZXNzKTtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2goZ3Vlc3MpO1xyXG4gICAgICAgICAgICBwYXJ0ID0gc3VidHJhY3QocGFydCwgY2hlY2spO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXN1bHQucmV2ZXJzZSgpO1xyXG4gICAgICAgIHJldHVybiBbYXJyYXlUb1NtYWxsKHJlc3VsdCksIGFycmF5VG9TbWFsbChwYXJ0KV07XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGl2TW9kU21hbGwodmFsdWUsIGxhbWJkYSkge1xyXG4gICAgICAgIHZhciBsZW5ndGggPSB2YWx1ZS5sZW5ndGgsXHJcbiAgICAgICAgICAgIHF1b3RpZW50ID0gY3JlYXRlQXJyYXkobGVuZ3RoKSxcclxuICAgICAgICAgICAgYmFzZSA9IEJBU0UsXHJcbiAgICAgICAgICAgIGksIHEsIHJlbWFpbmRlciwgZGl2aXNvcjtcclxuICAgICAgICByZW1haW5kZXIgPSAwO1xyXG4gICAgICAgIGZvciAoaSA9IGxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XHJcbiAgICAgICAgICAgIGRpdmlzb3IgPSByZW1haW5kZXIgKiBiYXNlICsgdmFsdWVbaV07XHJcbiAgICAgICAgICAgIHEgPSB0cnVuY2F0ZShkaXZpc29yIC8gbGFtYmRhKTtcclxuICAgICAgICAgICAgcmVtYWluZGVyID0gZGl2aXNvciAtIHEgKiBsYW1iZGE7XHJcbiAgICAgICAgICAgIHF1b3RpZW50W2ldID0gcSB8IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBbcXVvdGllbnQsIHJlbWFpbmRlciB8IDBdO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRpdk1vZEFueShzZWxmLCB2KSB7XHJcbiAgICAgICAgdmFyIHZhbHVlLCBuID0gcGFyc2VWYWx1ZSh2KTtcclxuICAgICAgICBpZiAoc3VwcG9ydHNOYXRpdmVCaWdJbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtuZXcgTmF0aXZlQmlnSW50KHNlbGYudmFsdWUgLyBuLnZhbHVlKSwgbmV3IE5hdGl2ZUJpZ0ludChzZWxmLnZhbHVlICUgbi52YWx1ZSldO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgYSA9IHNlbGYudmFsdWUsIGIgPSBuLnZhbHVlO1xyXG4gICAgICAgIHZhciBxdW90aWVudDtcclxuICAgICAgICBpZiAoYiA9PT0gMCkgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGRpdmlkZSBieSB6ZXJvXCIpO1xyXG4gICAgICAgIGlmIChzZWxmLmlzU21hbGwpIHtcclxuICAgICAgICAgICAgaWYgKG4uaXNTbWFsbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtuZXcgU21hbGxJbnRlZ2VyKHRydW5jYXRlKGEgLyBiKSksIG5ldyBTbWFsbEludGVnZXIoYSAlIGIpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gW0ludGVnZXJbMF0sIHNlbGZdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobi5pc1NtYWxsKSB7XHJcbiAgICAgICAgICAgIGlmIChiID09PSAxKSByZXR1cm4gW3NlbGYsIEludGVnZXJbMF1dO1xyXG4gICAgICAgICAgICBpZiAoYiA9PSAtMSkgcmV0dXJuIFtzZWxmLm5lZ2F0ZSgpLCBJbnRlZ2VyWzBdXTtcclxuICAgICAgICAgICAgdmFyIGFicyA9IE1hdGguYWJzKGIpO1xyXG4gICAgICAgICAgICBpZiAoYWJzIDwgQkFTRSkge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBkaXZNb2RTbWFsbChhLCBhYnMpO1xyXG4gICAgICAgICAgICAgICAgcXVvdGllbnQgPSBhcnJheVRvU21hbGwodmFsdWVbMF0pO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlbWFpbmRlciA9IHZhbHVlWzFdO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuc2lnbikgcmVtYWluZGVyID0gLXJlbWFpbmRlcjtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcXVvdGllbnQgPT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5zaWduICE9PSBuLnNpZ24pIHF1b3RpZW50ID0gLXF1b3RpZW50O1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbbmV3IFNtYWxsSW50ZWdlcihxdW90aWVudCksIG5ldyBTbWFsbEludGVnZXIocmVtYWluZGVyKV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gW25ldyBCaWdJbnRlZ2VyKHF1b3RpZW50LCBzZWxmLnNpZ24gIT09IG4uc2lnbiksIG5ldyBTbWFsbEludGVnZXIocmVtYWluZGVyKV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYiA9IHNtYWxsVG9BcnJheShhYnMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgY29tcGFyaXNvbiA9IGNvbXBhcmVBYnMoYSwgYik7XHJcbiAgICAgICAgaWYgKGNvbXBhcmlzb24gPT09IC0xKSByZXR1cm4gW0ludGVnZXJbMF0sIHNlbGZdO1xyXG4gICAgICAgIGlmIChjb21wYXJpc29uID09PSAwKSByZXR1cm4gW0ludGVnZXJbc2VsZi5zaWduID09PSBuLnNpZ24gPyAxIDogLTFdLCBJbnRlZ2VyWzBdXTtcclxuXHJcbiAgICAgICAgLy8gZGl2TW9kMSBpcyBmYXN0ZXIgb24gc21hbGxlciBpbnB1dCBzaXplc1xyXG4gICAgICAgIGlmIChhLmxlbmd0aCArIGIubGVuZ3RoIDw9IDIwMClcclxuICAgICAgICAgICAgdmFsdWUgPSBkaXZNb2QxKGEsIGIpO1xyXG4gICAgICAgIGVsc2UgdmFsdWUgPSBkaXZNb2QyKGEsIGIpO1xyXG5cclxuICAgICAgICBxdW90aWVudCA9IHZhbHVlWzBdO1xyXG4gICAgICAgIHZhciBxU2lnbiA9IHNlbGYuc2lnbiAhPT0gbi5zaWduLFxyXG4gICAgICAgICAgICBtb2QgPSB2YWx1ZVsxXSxcclxuICAgICAgICAgICAgbVNpZ24gPSBzZWxmLnNpZ247XHJcbiAgICAgICAgaWYgKHR5cGVvZiBxdW90aWVudCA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICAgICAgICBpZiAocVNpZ24pIHF1b3RpZW50ID0gLXF1b3RpZW50O1xyXG4gICAgICAgICAgICBxdW90aWVudCA9IG5ldyBTbWFsbEludGVnZXIocXVvdGllbnQpO1xyXG4gICAgICAgIH0gZWxzZSBxdW90aWVudCA9IG5ldyBCaWdJbnRlZ2VyKHF1b3RpZW50LCBxU2lnbik7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBtb2QgPT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICAgICAgaWYgKG1TaWduKSBtb2QgPSAtbW9kO1xyXG4gICAgICAgICAgICBtb2QgPSBuZXcgU21hbGxJbnRlZ2VyKG1vZCk7XHJcbiAgICAgICAgfSBlbHNlIG1vZCA9IG5ldyBCaWdJbnRlZ2VyKG1vZCwgbVNpZ24pO1xyXG4gICAgICAgIHJldHVybiBbcXVvdGllbnQsIG1vZF07XHJcbiAgICB9XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuZGl2bW9kID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gZGl2TW9kQW55KHRoaXMsIHYpO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHF1b3RpZW50OiByZXN1bHRbMF0sXHJcbiAgICAgICAgICAgIHJlbWFpbmRlcjogcmVzdWx0WzFdXHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLmRpdm1vZCA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUuZGl2bW9kID0gQmlnSW50ZWdlci5wcm90b3R5cGUuZGl2bW9kO1xyXG5cclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5kaXZpZGUgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHJldHVybiBkaXZNb2RBbnkodGhpcywgdilbMF07XHJcbiAgICB9O1xyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5vdmVyID0gTmF0aXZlQmlnSW50LnByb3RvdHlwZS5kaXZpZGUgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHJldHVybiBuZXcgTmF0aXZlQmlnSW50KHRoaXMudmFsdWUgLyBwYXJzZVZhbHVlKHYpLnZhbHVlKTtcclxuICAgIH07XHJcbiAgICBTbWFsbEludGVnZXIucHJvdG90eXBlLm92ZXIgPSBTbWFsbEludGVnZXIucHJvdG90eXBlLmRpdmlkZSA9IEJpZ0ludGVnZXIucHJvdG90eXBlLm92ZXIgPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5kaXZpZGU7XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUubW9kID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICByZXR1cm4gZGl2TW9kQW55KHRoaXMsIHYpWzFdO1xyXG4gICAgfTtcclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUubW9kID0gTmF0aXZlQmlnSW50LnByb3RvdHlwZS5yZW1haW5kZXIgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHJldHVybiBuZXcgTmF0aXZlQmlnSW50KHRoaXMudmFsdWUgJSBwYXJzZVZhbHVlKHYpLnZhbHVlKTtcclxuICAgIH07XHJcbiAgICBTbWFsbEludGVnZXIucHJvdG90eXBlLnJlbWFpbmRlciA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUubW9kID0gQmlnSW50ZWdlci5wcm90b3R5cGUucmVtYWluZGVyID0gQmlnSW50ZWdlci5wcm90b3R5cGUubW9kO1xyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLnBvdyA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgdmFyIG4gPSBwYXJzZVZhbHVlKHYpLFxyXG4gICAgICAgICAgICBhID0gdGhpcy52YWx1ZSxcclxuICAgICAgICAgICAgYiA9IG4udmFsdWUsXHJcbiAgICAgICAgICAgIHZhbHVlLCB4LCB5O1xyXG4gICAgICAgIGlmIChiID09PSAwKSByZXR1cm4gSW50ZWdlclsxXTtcclxuICAgICAgICBpZiAoYSA9PT0gMCkgcmV0dXJuIEludGVnZXJbMF07XHJcbiAgICAgICAgaWYgKGEgPT09IDEpIHJldHVybiBJbnRlZ2VyWzFdO1xyXG4gICAgICAgIGlmIChhID09PSAtMSkgcmV0dXJuIG4uaXNFdmVuKCkgPyBJbnRlZ2VyWzFdIDogSW50ZWdlclstMV07XHJcbiAgICAgICAgaWYgKG4uc2lnbikge1xyXG4gICAgICAgICAgICByZXR1cm4gSW50ZWdlclswXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFuLmlzU21hbGwpIHRocm93IG5ldyBFcnJvcihcIlRoZSBleHBvbmVudCBcIiArIG4udG9TdHJpbmcoKSArIFwiIGlzIHRvbyBsYXJnZS5cIik7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNTbWFsbCkge1xyXG4gICAgICAgICAgICBpZiAoaXNQcmVjaXNlKHZhbHVlID0gTWF0aC5wb3coYSwgYikpKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTbWFsbEludGVnZXIodHJ1bmNhdGUodmFsdWUpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgeCA9IHRoaXM7XHJcbiAgICAgICAgeSA9IEludGVnZXJbMV07XHJcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcclxuICAgICAgICAgICAgaWYgKGIgJiAxID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICB5ID0geS50aW1lcyh4KTtcclxuICAgICAgICAgICAgICAgIC0tYjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoYiA9PT0gMCkgYnJlYWs7XHJcbiAgICAgICAgICAgIGIgLz0gMjtcclxuICAgICAgICAgICAgeCA9IHguc3F1YXJlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB5O1xyXG4gICAgfTtcclxuICAgIFNtYWxsSW50ZWdlci5wcm90b3R5cGUucG93ID0gQmlnSW50ZWdlci5wcm90b3R5cGUucG93O1xyXG5cclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUucG93ID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICB2YXIgbiA9IHBhcnNlVmFsdWUodik7XHJcbiAgICAgICAgdmFyIGEgPSB0aGlzLnZhbHVlLCBiID0gbi52YWx1ZTtcclxuICAgICAgICB2YXIgXzAgPSBCaWdJbnQoMCksIF8xID0gQmlnSW50KDEpLCBfMiA9IEJpZ0ludCgyKTtcclxuICAgICAgICBpZiAoYiA9PT0gXzApIHJldHVybiBJbnRlZ2VyWzFdO1xyXG4gICAgICAgIGlmIChhID09PSBfMCkgcmV0dXJuIEludGVnZXJbMF07XHJcbiAgICAgICAgaWYgKGEgPT09IF8xKSByZXR1cm4gSW50ZWdlclsxXTtcclxuICAgICAgICBpZiAoYSA9PT0gQmlnSW50KC0xKSkgcmV0dXJuIG4uaXNFdmVuKCkgPyBJbnRlZ2VyWzFdIDogSW50ZWdlclstMV07XHJcbiAgICAgICAgaWYgKG4uaXNOZWdhdGl2ZSgpKSByZXR1cm4gbmV3IE5hdGl2ZUJpZ0ludChfMCk7XHJcbiAgICAgICAgdmFyIHggPSB0aGlzO1xyXG4gICAgICAgIHZhciB5ID0gSW50ZWdlclsxXTtcclxuICAgICAgICB3aGlsZSAodHJ1ZSkge1xyXG4gICAgICAgICAgICBpZiAoKGIgJiBfMSkgPT09IF8xKSB7XHJcbiAgICAgICAgICAgICAgICB5ID0geS50aW1lcyh4KTtcclxuICAgICAgICAgICAgICAgIC0tYjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoYiA9PT0gXzApIGJyZWFrO1xyXG4gICAgICAgICAgICBiIC89IF8yO1xyXG4gICAgICAgICAgICB4ID0geC5zcXVhcmUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHk7XHJcbiAgICB9XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUubW9kUG93ID0gZnVuY3Rpb24gKGV4cCwgbW9kKSB7XHJcbiAgICAgICAgZXhwID0gcGFyc2VWYWx1ZShleHApO1xyXG4gICAgICAgIG1vZCA9IHBhcnNlVmFsdWUobW9kKTtcclxuICAgICAgICBpZiAobW9kLmlzWmVybygpKSB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgdGFrZSBtb2RQb3cgd2l0aCBtb2R1bHVzIDBcIik7XHJcbiAgICAgICAgdmFyIHIgPSBJbnRlZ2VyWzFdLFxyXG4gICAgICAgICAgICBiYXNlID0gdGhpcy5tb2QobW9kKTtcclxuICAgICAgICBpZiAoZXhwLmlzTmVnYXRpdmUoKSkge1xyXG4gICAgICAgICAgICBleHAgPSBleHAubXVsdGlwbHkoSW50ZWdlclstMV0pO1xyXG4gICAgICAgICAgICBiYXNlID0gYmFzZS5tb2RJbnYobW9kKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgd2hpbGUgKGV4cC5pc1Bvc2l0aXZlKCkpIHtcclxuICAgICAgICAgICAgaWYgKGJhc2UuaXNaZXJvKCkpIHJldHVybiBJbnRlZ2VyWzBdO1xyXG4gICAgICAgICAgICBpZiAoZXhwLmlzT2RkKCkpIHIgPSByLm11bHRpcGx5KGJhc2UpLm1vZChtb2QpO1xyXG4gICAgICAgICAgICBleHAgPSBleHAuZGl2aWRlKDIpO1xyXG4gICAgICAgICAgICBiYXNlID0gYmFzZS5zcXVhcmUoKS5tb2QobW9kKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHI7XHJcbiAgICB9O1xyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5tb2RQb3cgPSBTbWFsbEludGVnZXIucHJvdG90eXBlLm1vZFBvdyA9IEJpZ0ludGVnZXIucHJvdG90eXBlLm1vZFBvdztcclxuXHJcbiAgICBmdW5jdGlvbiBjb21wYXJlQWJzKGEsIGIpIHtcclxuICAgICAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhLmxlbmd0aCA+IGIubGVuZ3RoID8gMSA6IC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKHZhciBpID0gYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICBpZiAoYVtpXSAhPT0gYltpXSkgcmV0dXJuIGFbaV0gPiBiW2ldID8gMSA6IC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5jb21wYXJlQWJzID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICB2YXIgbiA9IHBhcnNlVmFsdWUodiksXHJcbiAgICAgICAgICAgIGEgPSB0aGlzLnZhbHVlLFxyXG4gICAgICAgICAgICBiID0gbi52YWx1ZTtcclxuICAgICAgICBpZiAobi5pc1NtYWxsKSByZXR1cm4gMTtcclxuICAgICAgICByZXR1cm4gY29tcGFyZUFicyhhLCBiKTtcclxuICAgIH07XHJcbiAgICBTbWFsbEludGVnZXIucHJvdG90eXBlLmNvbXBhcmVBYnMgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHZhciBuID0gcGFyc2VWYWx1ZSh2KSxcclxuICAgICAgICAgICAgYSA9IE1hdGguYWJzKHRoaXMudmFsdWUpLFxyXG4gICAgICAgICAgICBiID0gbi52YWx1ZTtcclxuICAgICAgICBpZiAobi5pc1NtYWxsKSB7XHJcbiAgICAgICAgICAgIGIgPSBNYXRoLmFicyhiKTtcclxuICAgICAgICAgICAgcmV0dXJuIGEgPT09IGIgPyAwIDogYSA+IGIgPyAxIDogLTE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAtMTtcclxuICAgIH07XHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLmNvbXBhcmVBYnMgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHZhciBhID0gdGhpcy52YWx1ZTtcclxuICAgICAgICB2YXIgYiA9IHBhcnNlVmFsdWUodikudmFsdWU7XHJcbiAgICAgICAgYSA9IGEgPj0gMCA/IGEgOiAtYTtcclxuICAgICAgICBiID0gYiA+PSAwID8gYiA6IC1iO1xyXG4gICAgICAgIHJldHVybiBhID09PSBiID8gMCA6IGEgPiBiID8gMSA6IC0xO1xyXG4gICAgfVxyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLmNvbXBhcmUgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIC8vIFNlZSBkaXNjdXNzaW9uIGFib3V0IGNvbXBhcmlzb24gd2l0aCBJbmZpbml0eTpcclxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcGV0ZXJvbHNvbi9CaWdJbnRlZ2VyLmpzL2lzc3Vlcy82MVxyXG4gICAgICAgIGlmICh2ID09PSBJbmZpbml0eSkge1xyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh2ID09PSAtSW5maW5pdHkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgbiA9IHBhcnNlVmFsdWUodiksXHJcbiAgICAgICAgICAgIGEgPSB0aGlzLnZhbHVlLFxyXG4gICAgICAgICAgICBiID0gbi52YWx1ZTtcclxuICAgICAgICBpZiAodGhpcy5zaWduICE9PSBuLnNpZ24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG4uc2lnbiA/IDEgOiAtMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG4uaXNTbWFsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zaWduID8gLTEgOiAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY29tcGFyZUFicyhhLCBiKSAqICh0aGlzLnNpZ24gPyAtMSA6IDEpO1xyXG4gICAgfTtcclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLmNvbXBhcmVUbyA9IEJpZ0ludGVnZXIucHJvdG90eXBlLmNvbXBhcmU7XHJcblxyXG4gICAgU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICBpZiAodiA9PT0gSW5maW5pdHkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodiA9PT0gLUluZmluaXR5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIG4gPSBwYXJzZVZhbHVlKHYpLFxyXG4gICAgICAgICAgICBhID0gdGhpcy52YWx1ZSxcclxuICAgICAgICAgICAgYiA9IG4udmFsdWU7XHJcbiAgICAgICAgaWYgKG4uaXNTbWFsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYSA9PSBiID8gMCA6IGEgPiBiID8gMSA6IC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoYSA8IDAgIT09IG4uc2lnbikge1xyXG4gICAgICAgICAgICByZXR1cm4gYSA8IDAgPyAtMSA6IDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhIDwgMCA/IDEgOiAtMTtcclxuICAgIH07XHJcbiAgICBTbWFsbEludGVnZXIucHJvdG90eXBlLmNvbXBhcmVUbyA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUuY29tcGFyZTtcclxuXHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLmNvbXBhcmUgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIGlmICh2ID09PSBJbmZpbml0eSkge1xyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh2ID09PSAtSW5maW5pdHkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBhID0gdGhpcy52YWx1ZTtcclxuICAgICAgICB2YXIgYiA9IHBhcnNlVmFsdWUodikudmFsdWU7XHJcbiAgICAgICAgcmV0dXJuIGEgPT09IGIgPyAwIDogYSA+IGIgPyAxIDogLTE7XHJcbiAgICB9XHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLmNvbXBhcmVUbyA9IE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuY29tcGFyZTtcclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBhcmUodikgPT09IDA7XHJcbiAgICB9O1xyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5lcSA9IE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuZXF1YWxzID0gU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5lcSA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUuZXF1YWxzID0gQmlnSW50ZWdlci5wcm90b3R5cGUuZXEgPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5lcXVhbHM7XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUubm90RXF1YWxzID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb21wYXJlKHYpICE9PSAwO1xyXG4gICAgfTtcclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUubmVxID0gTmF0aXZlQmlnSW50LnByb3RvdHlwZS5ub3RFcXVhbHMgPSBTbWFsbEludGVnZXIucHJvdG90eXBlLm5lcSA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUubm90RXF1YWxzID0gQmlnSW50ZWdlci5wcm90b3R5cGUubmVxID0gQmlnSW50ZWdlci5wcm90b3R5cGUubm90RXF1YWxzO1xyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLmdyZWF0ZXIgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBhcmUodikgPiAwO1xyXG4gICAgfTtcclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuZ3QgPSBOYXRpdmVCaWdJbnQucHJvdG90eXBlLmdyZWF0ZXIgPSBTbWFsbEludGVnZXIucHJvdG90eXBlLmd0ID0gU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5ncmVhdGVyID0gQmlnSW50ZWdlci5wcm90b3R5cGUuZ3QgPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5ncmVhdGVyO1xyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLmxlc3NlciA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcGFyZSh2KSA8IDA7XHJcbiAgICB9O1xyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5sdCA9IE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUubGVzc2VyID0gU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5sdCA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUubGVzc2VyID0gQmlnSW50ZWdlci5wcm90b3R5cGUubHQgPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5sZXNzZXI7XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuZ3JlYXRlck9yRXF1YWxzID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb21wYXJlKHYpID49IDA7XHJcbiAgICB9O1xyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5nZXEgPSBOYXRpdmVCaWdJbnQucHJvdG90eXBlLmdyZWF0ZXJPckVxdWFscyA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUuZ2VxID0gU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5ncmVhdGVyT3JFcXVhbHMgPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5nZXEgPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5ncmVhdGVyT3JFcXVhbHM7XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUubGVzc2VyT3JFcXVhbHMgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBhcmUodikgPD0gMDtcclxuICAgIH07XHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLmxlcSA9IE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUubGVzc2VyT3JFcXVhbHMgPSBTbWFsbEludGVnZXIucHJvdG90eXBlLmxlcSA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUubGVzc2VyT3JFcXVhbHMgPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5sZXEgPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5sZXNzZXJPckVxdWFscztcclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5pc0V2ZW4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnZhbHVlWzBdICYgMSkgPT09IDA7XHJcbiAgICB9O1xyXG4gICAgU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5pc0V2ZW4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnZhbHVlICYgMSkgPT09IDA7XHJcbiAgICB9O1xyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5pc0V2ZW4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnZhbHVlICYgQmlnSW50KDEpKSA9PT0gQmlnSW50KDApO1xyXG4gICAgfVxyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLmlzT2RkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy52YWx1ZVswXSAmIDEpID09PSAxO1xyXG4gICAgfTtcclxuICAgIFNtYWxsSW50ZWdlci5wcm90b3R5cGUuaXNPZGQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnZhbHVlICYgMSkgPT09IDE7XHJcbiAgICB9O1xyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5pc09kZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gKHRoaXMudmFsdWUgJiBCaWdJbnQoMSkpID09PSBCaWdJbnQoMSk7XHJcbiAgICB9XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuaXNQb3NpdGl2ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gIXRoaXMuc2lnbjtcclxuICAgIH07XHJcbiAgICBTbWFsbEludGVnZXIucHJvdG90eXBlLmlzUG9zaXRpdmUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUgPiAwO1xyXG4gICAgfTtcclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuaXNQb3NpdGl2ZSA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUuaXNQb3NpdGl2ZTtcclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5pc05lZ2F0aXZlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNpZ247XHJcbiAgICB9O1xyXG4gICAgU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5pc05lZ2F0aXZlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlIDwgMDtcclxuICAgIH07XHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLmlzTmVnYXRpdmUgPSBTbWFsbEludGVnZXIucHJvdG90eXBlLmlzTmVnYXRpdmU7XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuaXNVbml0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH07XHJcbiAgICBTbWFsbEludGVnZXIucHJvdG90eXBlLmlzVW5pdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5hYnModGhpcy52YWx1ZSkgPT09IDE7XHJcbiAgICB9O1xyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5pc1VuaXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYWJzKCkudmFsdWUgPT09IEJpZ0ludCgxKTtcclxuICAgIH1cclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5pc1plcm8gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfTtcclxuICAgIFNtYWxsSW50ZWdlci5wcm90b3R5cGUuaXNaZXJvID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlID09PSAwO1xyXG4gICAgfTtcclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuaXNaZXJvID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlID09PSBCaWdJbnQoMCk7XHJcbiAgICB9XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuaXNEaXZpc2libGVCeSA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgdmFyIG4gPSBwYXJzZVZhbHVlKHYpO1xyXG4gICAgICAgIGlmIChuLmlzWmVybygpKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgaWYgKG4uaXNVbml0KCkpIHJldHVybiB0cnVlO1xyXG4gICAgICAgIGlmIChuLmNvbXBhcmVBYnMoMikgPT09IDApIHJldHVybiB0aGlzLmlzRXZlbigpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1vZChuKS5pc1plcm8oKTtcclxuICAgIH07XHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLmlzRGl2aXNpYmxlQnkgPSBTbWFsbEludGVnZXIucHJvdG90eXBlLmlzRGl2aXNpYmxlQnkgPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5pc0RpdmlzaWJsZUJ5O1xyXG5cclxuICAgIGZ1bmN0aW9uIGlzQmFzaWNQcmltZSh2KSB7XHJcbiAgICAgICAgdmFyIG4gPSB2LmFicygpO1xyXG4gICAgICAgIGlmIChuLmlzVW5pdCgpKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgaWYgKG4uZXF1YWxzKDIpIHx8IG4uZXF1YWxzKDMpIHx8IG4uZXF1YWxzKDUpKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICBpZiAobi5pc0V2ZW4oKSB8fCBuLmlzRGl2aXNpYmxlQnkoMykgfHwgbi5pc0RpdmlzaWJsZUJ5KDUpKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgaWYgKG4ubGVzc2VyKDQ5KSkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgLy8gd2UgZG9uJ3Qga25vdyBpZiBpdCdzIHByaW1lOiBsZXQgdGhlIG90aGVyIGZ1bmN0aW9ucyBmaWd1cmUgaXQgb3V0XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbWlsbGVyUmFiaW5UZXN0KG4sIGEpIHtcclxuICAgICAgICB2YXIgblByZXYgPSBuLnByZXYoKSxcclxuICAgICAgICAgICAgYiA9IG5QcmV2LFxyXG4gICAgICAgICAgICByID0gMCxcclxuICAgICAgICAgICAgZCwgdCwgaSwgeDtcclxuICAgICAgICB3aGlsZSAoYi5pc0V2ZW4oKSkgYiA9IGIuZGl2aWRlKDIpLCByKys7XHJcbiAgICAgICAgbmV4dDogZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKG4ubGVzc2VyKGFbaV0pKSBjb250aW51ZTtcclxuICAgICAgICAgICAgeCA9IGJpZ0ludChhW2ldKS5tb2RQb3coYiwgbik7XHJcbiAgICAgICAgICAgIGlmICh4LmlzVW5pdCgpIHx8IHguZXF1YWxzKG5QcmV2KSkgY29udGludWU7XHJcbiAgICAgICAgICAgIGZvciAoZCA9IHIgLSAxOyBkICE9IDA7IGQtLSkge1xyXG4gICAgICAgICAgICAgICAgeCA9IHguc3F1YXJlKCkubW9kKG4pO1xyXG4gICAgICAgICAgICAgICAgaWYgKHguaXNVbml0KCkpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGlmICh4LmVxdWFscyhuUHJldikpIGNvbnRpbnVlIG5leHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTZXQgXCJzdHJpY3RcIiB0byB0cnVlIHRvIGZvcmNlIEdSSC1zdXBwb3J0ZWQgbG93ZXIgYm91bmQgb2YgMipsb2coTileMlxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuaXNQcmltZSA9IGZ1bmN0aW9uIChzdHJpY3QpIHtcclxuICAgICAgICB2YXIgaXNQcmltZSA9IGlzQmFzaWNQcmltZSh0aGlzKTtcclxuICAgICAgICBpZiAoaXNQcmltZSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gaXNQcmltZTtcclxuICAgICAgICB2YXIgbiA9IHRoaXMuYWJzKCk7XHJcbiAgICAgICAgdmFyIGJpdHMgPSBuLmJpdExlbmd0aCgpO1xyXG4gICAgICAgIGlmIChiaXRzIDw9IDY0KVxyXG4gICAgICAgICAgICByZXR1cm4gbWlsbGVyUmFiaW5UZXN0KG4sIFsyLCAzLCA1LCA3LCAxMSwgMTMsIDE3LCAxOSwgMjMsIDI5LCAzMSwgMzddKTtcclxuICAgICAgICB2YXIgbG9nTiA9IE1hdGgubG9nKDIpICogYml0cy50b0pTTnVtYmVyKCk7XHJcbiAgICAgICAgdmFyIHQgPSBNYXRoLmNlaWwoKHN0cmljdCA9PT0gdHJ1ZSkgPyAoMiAqIE1hdGgucG93KGxvZ04sIDIpKSA6IGxvZ04pO1xyXG4gICAgICAgIGZvciAodmFyIGEgPSBbXSwgaSA9IDA7IGkgPCB0OyBpKyspIHtcclxuICAgICAgICAgICAgYS5wdXNoKGJpZ0ludChpICsgMikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbWlsbGVyUmFiaW5UZXN0KG4sIGEpO1xyXG4gICAgfTtcclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuaXNQcmltZSA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUuaXNQcmltZSA9IEJpZ0ludGVnZXIucHJvdG90eXBlLmlzUHJpbWU7XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuaXNQcm9iYWJsZVByaW1lID0gZnVuY3Rpb24gKGl0ZXJhdGlvbnMsIHJuZykge1xyXG4gICAgICAgIHZhciBpc1ByaW1lID0gaXNCYXNpY1ByaW1lKHRoaXMpO1xyXG4gICAgICAgIGlmIChpc1ByaW1lICE9PSB1bmRlZmluZWQpIHJldHVybiBpc1ByaW1lO1xyXG4gICAgICAgIHZhciBuID0gdGhpcy5hYnMoKTtcclxuICAgICAgICB2YXIgdCA9IGl0ZXJhdGlvbnMgPT09IHVuZGVmaW5lZCA/IDUgOiBpdGVyYXRpb25zO1xyXG4gICAgICAgIGZvciAodmFyIGEgPSBbXSwgaSA9IDA7IGkgPCB0OyBpKyspIHtcclxuICAgICAgICAgICAgYS5wdXNoKGJpZ0ludC5yYW5kQmV0d2VlbigyLCBuLm1pbnVzKDIpLCBybmcpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG1pbGxlclJhYmluVGVzdChuLCBhKTtcclxuICAgIH07XHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLmlzUHJvYmFibGVQcmltZSA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUuaXNQcm9iYWJsZVByaW1lID0gQmlnSW50ZWdlci5wcm90b3R5cGUuaXNQcm9iYWJsZVByaW1lO1xyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLm1vZEludiA9IGZ1bmN0aW9uIChuKSB7XHJcbiAgICAgICAgdmFyIHQgPSBiaWdJbnQuemVybywgbmV3VCA9IGJpZ0ludC5vbmUsIHIgPSBwYXJzZVZhbHVlKG4pLCBuZXdSID0gdGhpcy5hYnMoKSwgcSwgbGFzdFQsIGxhc3RSO1xyXG4gICAgICAgIHdoaWxlICghbmV3Ui5pc1plcm8oKSkge1xyXG4gICAgICAgICAgICBxID0gci5kaXZpZGUobmV3Uik7XHJcbiAgICAgICAgICAgIGxhc3RUID0gdDtcclxuICAgICAgICAgICAgbGFzdFIgPSByO1xyXG4gICAgICAgICAgICB0ID0gbmV3VDtcclxuICAgICAgICAgICAgciA9IG5ld1I7XHJcbiAgICAgICAgICAgIG5ld1QgPSBsYXN0VC5zdWJ0cmFjdChxLm11bHRpcGx5KG5ld1QpKTtcclxuICAgICAgICAgICAgbmV3UiA9IGxhc3RSLnN1YnRyYWN0KHEubXVsdGlwbHkobmV3UikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXIuaXNVbml0KCkpIHRocm93IG5ldyBFcnJvcih0aGlzLnRvU3RyaW5nKCkgKyBcIiBhbmQgXCIgKyBuLnRvU3RyaW5nKCkgKyBcIiBhcmUgbm90IGNvLXByaW1lXCIpO1xyXG4gICAgICAgIGlmICh0LmNvbXBhcmUoMCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIHQgPSB0LmFkZChuKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuaXNOZWdhdGl2ZSgpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0Lm5lZ2F0ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdDtcclxuICAgIH07XHJcblxyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5tb2RJbnYgPSBTbWFsbEludGVnZXIucHJvdG90eXBlLm1vZEludiA9IEJpZ0ludGVnZXIucHJvdG90eXBlLm1vZEludjtcclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB2YWx1ZSA9IHRoaXMudmFsdWU7XHJcbiAgICAgICAgaWYgKHRoaXMuc2lnbikge1xyXG4gICAgICAgICAgICByZXR1cm4gc3VidHJhY3RTbWFsbCh2YWx1ZSwgMSwgdGhpcy5zaWduKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCaWdJbnRlZ2VyKGFkZFNtYWxsKHZhbHVlLCAxKSwgdGhpcy5zaWduKTtcclxuICAgIH07XHJcbiAgICBTbWFsbEludGVnZXIucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHZhbHVlID0gdGhpcy52YWx1ZTtcclxuICAgICAgICBpZiAodmFsdWUgKyAxIDwgTUFYX0lOVCkgcmV0dXJuIG5ldyBTbWFsbEludGVnZXIodmFsdWUgKyAxKTtcclxuICAgICAgICByZXR1cm4gbmV3IEJpZ0ludGVnZXIoTUFYX0lOVF9BUlIsIGZhbHNlKTtcclxuICAgIH07XHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBOYXRpdmVCaWdJbnQodGhpcy52YWx1ZSArIEJpZ0ludCgxKSk7XHJcbiAgICB9XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUucHJldiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLnZhbHVlO1xyXG4gICAgICAgIGlmICh0aGlzLnNpZ24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBCaWdJbnRlZ2VyKGFkZFNtYWxsKHZhbHVlLCAxKSwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzdWJ0cmFjdFNtYWxsKHZhbHVlLCAxLCB0aGlzLnNpZ24pO1xyXG4gICAgfTtcclxuICAgIFNtYWxsSW50ZWdlci5wcm90b3R5cGUucHJldiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLnZhbHVlO1xyXG4gICAgICAgIGlmICh2YWx1ZSAtIDEgPiAtTUFYX0lOVCkgcmV0dXJuIG5ldyBTbWFsbEludGVnZXIodmFsdWUgLSAxKTtcclxuICAgICAgICByZXR1cm4gbmV3IEJpZ0ludGVnZXIoTUFYX0lOVF9BUlIsIHRydWUpO1xyXG4gICAgfTtcclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUucHJldiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IE5hdGl2ZUJpZ0ludCh0aGlzLnZhbHVlIC0gQmlnSW50KDEpKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgcG93ZXJzT2ZUd28gPSBbMV07XHJcbiAgICB3aGlsZSAoMiAqIHBvd2Vyc09mVHdvW3Bvd2Vyc09mVHdvLmxlbmd0aCAtIDFdIDw9IEJBU0UpIHBvd2Vyc09mVHdvLnB1c2goMiAqIHBvd2Vyc09mVHdvW3Bvd2Vyc09mVHdvLmxlbmd0aCAtIDFdKTtcclxuICAgIHZhciBwb3dlcnMyTGVuZ3RoID0gcG93ZXJzT2ZUd28ubGVuZ3RoLCBoaWdoZXN0UG93ZXIyID0gcG93ZXJzT2ZUd29bcG93ZXJzMkxlbmd0aCAtIDFdO1xyXG5cclxuICAgIGZ1bmN0aW9uIHNoaWZ0X2lzU21hbGwobikge1xyXG4gICAgICAgIHJldHVybiBNYXRoLmFicyhuKSA8PSBCQVNFO1xyXG4gICAgfVxyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLnNoaWZ0TGVmdCA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgdmFyIG4gPSBwYXJzZVZhbHVlKHYpLnRvSlNOdW1iZXIoKTtcclxuICAgICAgICBpZiAoIXNoaWZ0X2lzU21hbGwobikpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFN0cmluZyhuKSArIFwiIGlzIHRvbyBsYXJnZSBmb3Igc2hpZnRpbmcuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobiA8IDApIHJldHVybiB0aGlzLnNoaWZ0UmlnaHQoLW4pO1xyXG4gICAgICAgIHZhciByZXN1bHQgPSB0aGlzO1xyXG4gICAgICAgIGlmIChyZXN1bHQuaXNaZXJvKCkpIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgd2hpbGUgKG4gPj0gcG93ZXJzMkxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQubXVsdGlwbHkoaGlnaGVzdFBvd2VyMik7XHJcbiAgICAgICAgICAgIG4gLT0gcG93ZXJzMkxlbmd0aCAtIDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQubXVsdGlwbHkocG93ZXJzT2ZUd29bbl0pO1xyXG4gICAgfTtcclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuc2hpZnRMZWZ0ID0gU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5zaGlmdExlZnQgPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5zaGlmdExlZnQ7XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuc2hpZnRSaWdodCA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgdmFyIHJlbVF1bztcclxuICAgICAgICB2YXIgbiA9IHBhcnNlVmFsdWUodikudG9KU051bWJlcigpO1xyXG4gICAgICAgIGlmICghc2hpZnRfaXNTbWFsbChuKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoU3RyaW5nKG4pICsgXCIgaXMgdG9vIGxhcmdlIGZvciBzaGlmdGluZy5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChuIDwgMCkgcmV0dXJuIHRoaXMuc2hpZnRMZWZ0KC1uKTtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcztcclxuICAgICAgICB3aGlsZSAobiA+PSBwb3dlcnMyTGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQuaXNaZXJvKCkgfHwgKHJlc3VsdC5pc05lZ2F0aXZlKCkgJiYgcmVzdWx0LmlzVW5pdCgpKSkgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgcmVtUXVvID0gZGl2TW9kQW55KHJlc3VsdCwgaGlnaGVzdFBvd2VyMik7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlbVF1b1sxXS5pc05lZ2F0aXZlKCkgPyByZW1RdW9bMF0ucHJldigpIDogcmVtUXVvWzBdO1xyXG4gICAgICAgICAgICBuIC09IHBvd2VyczJMZW5ndGggLSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZW1RdW8gPSBkaXZNb2RBbnkocmVzdWx0LCBwb3dlcnNPZlR3b1tuXSk7XHJcbiAgICAgICAgcmV0dXJuIHJlbVF1b1sxXS5pc05lZ2F0aXZlKCkgPyByZW1RdW9bMF0ucHJldigpIDogcmVtUXVvWzBdO1xyXG4gICAgfTtcclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuc2hpZnRSaWdodCA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUuc2hpZnRSaWdodCA9IEJpZ0ludGVnZXIucHJvdG90eXBlLnNoaWZ0UmlnaHQ7XHJcblxyXG4gICAgZnVuY3Rpb24gYml0d2lzZSh4LCB5LCBmbikge1xyXG4gICAgICAgIHkgPSBwYXJzZVZhbHVlKHkpO1xyXG4gICAgICAgIHZhciB4U2lnbiA9IHguaXNOZWdhdGl2ZSgpLCB5U2lnbiA9IHkuaXNOZWdhdGl2ZSgpO1xyXG4gICAgICAgIHZhciB4UmVtID0geFNpZ24gPyB4Lm5vdCgpIDogeCxcclxuICAgICAgICAgICAgeVJlbSA9IHlTaWduID8geS5ub3QoKSA6IHk7XHJcbiAgICAgICAgdmFyIHhEaWdpdCA9IDAsIHlEaWdpdCA9IDA7XHJcbiAgICAgICAgdmFyIHhEaXZNb2QgPSBudWxsLCB5RGl2TW9kID0gbnVsbDtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW107XHJcbiAgICAgICAgd2hpbGUgKCF4UmVtLmlzWmVybygpIHx8ICF5UmVtLmlzWmVybygpKSB7XHJcbiAgICAgICAgICAgIHhEaXZNb2QgPSBkaXZNb2RBbnkoeFJlbSwgaGlnaGVzdFBvd2VyMik7XHJcbiAgICAgICAgICAgIHhEaWdpdCA9IHhEaXZNb2RbMV0udG9KU051bWJlcigpO1xyXG4gICAgICAgICAgICBpZiAoeFNpZ24pIHtcclxuICAgICAgICAgICAgICAgIHhEaWdpdCA9IGhpZ2hlc3RQb3dlcjIgLSAxIC0geERpZ2l0OyAvLyB0d28ncyBjb21wbGVtZW50IGZvciBuZWdhdGl2ZSBudW1iZXJzXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHlEaXZNb2QgPSBkaXZNb2RBbnkoeVJlbSwgaGlnaGVzdFBvd2VyMik7XHJcbiAgICAgICAgICAgIHlEaWdpdCA9IHlEaXZNb2RbMV0udG9KU051bWJlcigpO1xyXG4gICAgICAgICAgICBpZiAoeVNpZ24pIHtcclxuICAgICAgICAgICAgICAgIHlEaWdpdCA9IGhpZ2hlc3RQb3dlcjIgLSAxIC0geURpZ2l0OyAvLyB0d28ncyBjb21wbGVtZW50IGZvciBuZWdhdGl2ZSBudW1iZXJzXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHhSZW0gPSB4RGl2TW9kWzBdO1xyXG4gICAgICAgICAgICB5UmVtID0geURpdk1vZFswXTtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2goZm4oeERpZ2l0LCB5RGlnaXQpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHN1bSA9IGZuKHhTaWduID8gMSA6IDAsIHlTaWduID8gMSA6IDApICE9PSAwID8gYmlnSW50KC0xKSA6IGJpZ0ludCgwKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gcmVzdWx0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaSAtPSAxKSB7XHJcbiAgICAgICAgICAgIHN1bSA9IHN1bS5tdWx0aXBseShoaWdoZXN0UG93ZXIyKS5hZGQoYmlnSW50KHJlc3VsdFtpXSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc3VtO1xyXG4gICAgfVxyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLm5vdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5uZWdhdGUoKS5wcmV2KCk7XHJcbiAgICB9O1xyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5ub3QgPSBTbWFsbEludGVnZXIucHJvdG90eXBlLm5vdCA9IEJpZ0ludGVnZXIucHJvdG90eXBlLm5vdDtcclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hbmQgPSBmdW5jdGlvbiAobikge1xyXG4gICAgICAgIHJldHVybiBiaXR3aXNlKHRoaXMsIG4sIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhICYgYjsgfSk7XHJcbiAgICB9O1xyXG4gICAgTmF0aXZlQmlnSW50LnByb3RvdHlwZS5hbmQgPSBTbWFsbEludGVnZXIucHJvdG90eXBlLmFuZCA9IEJpZ0ludGVnZXIucHJvdG90eXBlLmFuZDtcclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5vciA9IGZ1bmN0aW9uIChuKSB7XHJcbiAgICAgICAgcmV0dXJuIGJpdHdpc2UodGhpcywgbiwgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgfCBiOyB9KTtcclxuICAgIH07XHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLm9yID0gU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5vciA9IEJpZ0ludGVnZXIucHJvdG90eXBlLm9yO1xyXG5cclxuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLnhvciA9IGZ1bmN0aW9uIChuKSB7XHJcbiAgICAgICAgcmV0dXJuIGJpdHdpc2UodGhpcywgbiwgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgXiBiOyB9KTtcclxuICAgIH07XHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLnhvciA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUueG9yID0gQmlnSW50ZWdlci5wcm90b3R5cGUueG9yO1xyXG5cclxuICAgIHZhciBMT0JNQVNLX0kgPSAxIDw8IDMwLCBMT0JNQVNLX0JJID0gKEJBU0UgJiAtQkFTRSkgKiAoQkFTRSAmIC1CQVNFKSB8IExPQk1BU0tfSTtcclxuICAgIGZ1bmN0aW9uIHJvdWdoTE9CKG4pIHsgLy8gZ2V0IGxvd2VzdE9uZUJpdCAocm91Z2gpXHJcbiAgICAgICAgLy8gU21hbGxJbnRlZ2VyOiByZXR1cm4gTWluKGxvd2VzdE9uZUJpdChuKSwgMSA8PCAzMClcclxuICAgICAgICAvLyBCaWdJbnRlZ2VyOiByZXR1cm4gTWluKGxvd2VzdE9uZUJpdChuKSwgMSA8PCAxNCkgW0JBU0U9MWU3XVxyXG4gICAgICAgIHZhciB2ID0gbi52YWx1ZSxcclxuICAgICAgICAgICAgeCA9IHR5cGVvZiB2ID09PSBcIm51bWJlclwiID8gdiB8IExPQk1BU0tfSSA6XHJcbiAgICAgICAgICAgICAgICB0eXBlb2YgdiA9PT0gXCJiaWdpbnRcIiA/IHYgfCBCaWdJbnQoTE9CTUFTS19JKSA6XHJcbiAgICAgICAgICAgICAgICAgICAgdlswXSArIHZbMV0gKiBCQVNFIHwgTE9CTUFTS19CSTtcclxuICAgICAgICByZXR1cm4geCAmIC14O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGludGVnZXJMb2dhcml0aG0odmFsdWUsIGJhc2UpIHtcclxuICAgICAgICBpZiAoYmFzZS5jb21wYXJlVG8odmFsdWUpIDw9IDApIHtcclxuICAgICAgICAgICAgdmFyIHRtcCA9IGludGVnZXJMb2dhcml0aG0odmFsdWUsIGJhc2Uuc3F1YXJlKGJhc2UpKTtcclxuICAgICAgICAgICAgdmFyIHAgPSB0bXAucDtcclxuICAgICAgICAgICAgdmFyIGUgPSB0bXAuZTtcclxuICAgICAgICAgICAgdmFyIHQgPSBwLm11bHRpcGx5KGJhc2UpO1xyXG4gICAgICAgICAgICByZXR1cm4gdC5jb21wYXJlVG8odmFsdWUpIDw9IDAgPyB7IHA6IHQsIGU6IGUgKiAyICsgMSB9IDogeyBwOiBwLCBlOiBlICogMiB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4geyBwOiBiaWdJbnQoMSksIGU6IDAgfTtcclxuICAgIH1cclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5iaXRMZW5ndGggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIG4gPSB0aGlzO1xyXG4gICAgICAgIGlmIChuLmNvbXBhcmVUbyhiaWdJbnQoMCkpIDwgMCkge1xyXG4gICAgICAgICAgICBuID0gbi5uZWdhdGUoKS5zdWJ0cmFjdChiaWdJbnQoMSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobi5jb21wYXJlVG8oYmlnSW50KDApKSA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYmlnSW50KDApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYmlnSW50KGludGVnZXJMb2dhcml0aG0obiwgYmlnSW50KDIpKS5lKS5hZGQoYmlnSW50KDEpKTtcclxuICAgIH1cclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuYml0TGVuZ3RoID0gU21hbGxJbnRlZ2VyLnByb3RvdHlwZS5iaXRMZW5ndGggPSBCaWdJbnRlZ2VyLnByb3RvdHlwZS5iaXRMZW5ndGg7XHJcblxyXG4gICAgZnVuY3Rpb24gbWF4KGEsIGIpIHtcclxuICAgICAgICBhID0gcGFyc2VWYWx1ZShhKTtcclxuICAgICAgICBiID0gcGFyc2VWYWx1ZShiKTtcclxuICAgICAgICByZXR1cm4gYS5ncmVhdGVyKGIpID8gYSA6IGI7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBtaW4oYSwgYikge1xyXG4gICAgICAgIGEgPSBwYXJzZVZhbHVlKGEpO1xyXG4gICAgICAgIGIgPSBwYXJzZVZhbHVlKGIpO1xyXG4gICAgICAgIHJldHVybiBhLmxlc3NlcihiKSA/IGEgOiBiO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gZ2NkKGEsIGIpIHtcclxuICAgICAgICBhID0gcGFyc2VWYWx1ZShhKS5hYnMoKTtcclxuICAgICAgICBiID0gcGFyc2VWYWx1ZShiKS5hYnMoKTtcclxuICAgICAgICBpZiAoYS5lcXVhbHMoYikpIHJldHVybiBhO1xyXG4gICAgICAgIGlmIChhLmlzWmVybygpKSByZXR1cm4gYjtcclxuICAgICAgICBpZiAoYi5pc1plcm8oKSkgcmV0dXJuIGE7XHJcbiAgICAgICAgdmFyIGMgPSBJbnRlZ2VyWzFdLCBkLCB0O1xyXG4gICAgICAgIHdoaWxlIChhLmlzRXZlbigpICYmIGIuaXNFdmVuKCkpIHtcclxuICAgICAgICAgICAgZCA9IG1pbihyb3VnaExPQihhKSwgcm91Z2hMT0IoYikpO1xyXG4gICAgICAgICAgICBhID0gYS5kaXZpZGUoZCk7XHJcbiAgICAgICAgICAgIGIgPSBiLmRpdmlkZShkKTtcclxuICAgICAgICAgICAgYyA9IGMubXVsdGlwbHkoZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdoaWxlIChhLmlzRXZlbigpKSB7XHJcbiAgICAgICAgICAgIGEgPSBhLmRpdmlkZShyb3VnaExPQihhKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRvIHtcclxuICAgICAgICAgICAgd2hpbGUgKGIuaXNFdmVuKCkpIHtcclxuICAgICAgICAgICAgICAgIGIgPSBiLmRpdmlkZShyb3VnaExPQihiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGEuZ3JlYXRlcihiKSkge1xyXG4gICAgICAgICAgICAgICAgdCA9IGI7IGIgPSBhOyBhID0gdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBiID0gYi5zdWJ0cmFjdChhKTtcclxuICAgICAgICB9IHdoaWxlICghYi5pc1plcm8oKSk7XHJcbiAgICAgICAgcmV0dXJuIGMuaXNVbml0KCkgPyBhIDogYS5tdWx0aXBseShjKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGxjbShhLCBiKSB7XHJcbiAgICAgICAgYSA9IHBhcnNlVmFsdWUoYSkuYWJzKCk7XHJcbiAgICAgICAgYiA9IHBhcnNlVmFsdWUoYikuYWJzKCk7XHJcbiAgICAgICAgcmV0dXJuIGEuZGl2aWRlKGdjZChhLCBiKSkubXVsdGlwbHkoYik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiByYW5kQmV0d2VlbihhLCBiLCBybmcpIHtcclxuICAgICAgICBhID0gcGFyc2VWYWx1ZShhKTtcclxuICAgICAgICBiID0gcGFyc2VWYWx1ZShiKTtcclxuICAgICAgICB2YXIgdXNlZFJORyA9IHJuZyB8fCBNYXRoLnJhbmRvbTtcclxuICAgICAgICB2YXIgbG93ID0gbWluKGEsIGIpLCBoaWdoID0gbWF4KGEsIGIpO1xyXG4gICAgICAgIHZhciByYW5nZSA9IGhpZ2guc3VidHJhY3QobG93KS5hZGQoMSk7XHJcbiAgICAgICAgaWYgKHJhbmdlLmlzU21hbGwpIHJldHVybiBsb3cuYWRkKE1hdGguZmxvb3IodXNlZFJORygpICogcmFuZ2UpKTtcclxuICAgICAgICB2YXIgZGlnaXRzID0gdG9CYXNlKHJhbmdlLCBCQVNFKS52YWx1ZTtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sIHJlc3RyaWN0ZWQgPSB0cnVlO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGlnaXRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciB0b3AgPSByZXN0cmljdGVkID8gZGlnaXRzW2ldIDogQkFTRTtcclxuICAgICAgICAgICAgdmFyIGRpZ2l0ID0gdHJ1bmNhdGUodXNlZFJORygpICogdG9wKTtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2goZGlnaXQpO1xyXG4gICAgICAgICAgICBpZiAoZGlnaXQgPCB0b3ApIHJlc3RyaWN0ZWQgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGxvdy5hZGQoSW50ZWdlci5mcm9tQXJyYXkocmVzdWx0LCBCQVNFLCBmYWxzZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBwYXJzZUJhc2UgPSBmdW5jdGlvbiAodGV4dCwgYmFzZSwgYWxwaGFiZXQsIGNhc2VTZW5zaXRpdmUpIHtcclxuICAgICAgICBhbHBoYWJldCA9IGFscGhhYmV0IHx8IERFRkFVTFRfQUxQSEFCRVQ7XHJcbiAgICAgICAgdGV4dCA9IFN0cmluZyh0ZXh0KTtcclxuICAgICAgICBpZiAoIWNhc2VTZW5zaXRpdmUpIHtcclxuICAgICAgICAgICAgdGV4dCA9IHRleHQudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgYWxwaGFiZXQgPSBhbHBoYWJldC50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgbGVuZ3RoID0gdGV4dC5sZW5ndGg7XHJcbiAgICAgICAgdmFyIGk7XHJcbiAgICAgICAgdmFyIGFic0Jhc2UgPSBNYXRoLmFicyhiYXNlKTtcclxuICAgICAgICB2YXIgYWxwaGFiZXRWYWx1ZXMgPSB7fTtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYWxwaGFiZXQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgYWxwaGFiZXRWYWx1ZXNbYWxwaGFiZXRbaV1dID0gaTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBjID0gdGV4dFtpXTtcclxuICAgICAgICAgICAgaWYgKGMgPT09IFwiLVwiKSBjb250aW51ZTtcclxuICAgICAgICAgICAgaWYgKGMgaW4gYWxwaGFiZXRWYWx1ZXMpIHtcclxuICAgICAgICAgICAgICAgIGlmIChhbHBoYWJldFZhbHVlc1tjXSA+PSBhYnNCYXNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGMgPT09IFwiMVwiICYmIGFic0Jhc2UgPT09IDEpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihjICsgXCIgaXMgbm90IGEgdmFsaWQgZGlnaXQgaW4gYmFzZSBcIiArIGJhc2UgKyBcIi5cIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgYmFzZSA9IHBhcnNlVmFsdWUoYmFzZSk7XHJcbiAgICAgICAgdmFyIGRpZ2l0cyA9IFtdO1xyXG4gICAgICAgIHZhciBpc05lZ2F0aXZlID0gdGV4dFswXSA9PT0gXCItXCI7XHJcbiAgICAgICAgZm9yIChpID0gaXNOZWdhdGl2ZSA/IDEgOiAwOyBpIDwgdGV4dC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgYyA9IHRleHRbaV07XHJcbiAgICAgICAgICAgIGlmIChjIGluIGFscGhhYmV0VmFsdWVzKSBkaWdpdHMucHVzaChwYXJzZVZhbHVlKGFscGhhYmV0VmFsdWVzW2NdKSk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGMgPT09IFwiPFwiKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RhcnQgPSBpO1xyXG4gICAgICAgICAgICAgICAgZG8geyBpKys7IH0gd2hpbGUgKHRleHRbaV0gIT09IFwiPlwiICYmIGkgPCB0ZXh0Lmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICBkaWdpdHMucHVzaChwYXJzZVZhbHVlKHRleHQuc2xpY2Uoc3RhcnQgKyAxLCBpKSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKGMgKyBcIiBpcyBub3QgYSB2YWxpZCBjaGFyYWN0ZXJcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBwYXJzZUJhc2VGcm9tQXJyYXkoZGlnaXRzLCBiYXNlLCBpc05lZ2F0aXZlKTtcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gcGFyc2VCYXNlRnJvbUFycmF5KGRpZ2l0cywgYmFzZSwgaXNOZWdhdGl2ZSkge1xyXG4gICAgICAgIHZhciB2YWwgPSBJbnRlZ2VyWzBdLCBwb3cgPSBJbnRlZ2VyWzFdLCBpO1xyXG4gICAgICAgIGZvciAoaSA9IGRpZ2l0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICB2YWwgPSB2YWwuYWRkKGRpZ2l0c1tpXS50aW1lcyhwb3cpKTtcclxuICAgICAgICAgICAgcG93ID0gcG93LnRpbWVzKGJhc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaXNOZWdhdGl2ZSA/IHZhbC5uZWdhdGUoKSA6IHZhbDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzdHJpbmdpZnkoZGlnaXQsIGFscGhhYmV0KSB7XHJcbiAgICAgICAgYWxwaGFiZXQgPSBhbHBoYWJldCB8fCBERUZBVUxUX0FMUEhBQkVUO1xyXG4gICAgICAgIGlmIChkaWdpdCA8IGFscGhhYmV0Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYWxwaGFiZXRbZGlnaXRdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXCI8XCIgKyBkaWdpdCArIFwiPlwiO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRvQmFzZShuLCBiYXNlKSB7XHJcbiAgICAgICAgYmFzZSA9IGJpZ0ludChiYXNlKTtcclxuICAgICAgICBpZiAoYmFzZS5pc1plcm8oKSkge1xyXG4gICAgICAgICAgICBpZiAobi5pc1plcm8oKSkgcmV0dXJuIHsgdmFsdWU6IFswXSwgaXNOZWdhdGl2ZTogZmFsc2UgfTtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGNvbnZlcnQgbm9uemVybyBudW1iZXJzIHRvIGJhc2UgMC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChiYXNlLmVxdWFscygtMSkpIHtcclxuICAgICAgICAgICAgaWYgKG4uaXNaZXJvKCkpIHJldHVybiB7IHZhbHVlOiBbMF0sIGlzTmVnYXRpdmU6IGZhbHNlIH07XHJcbiAgICAgICAgICAgIGlmIChuLmlzTmVnYXRpdmUoKSlcclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IFtdLmNvbmNhdC5hcHBseShbXSwgQXJyYXkuYXBwbHkobnVsbCwgQXJyYXkoLW4udG9KU051bWJlcigpKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChBcnJheS5wcm90b3R5cGUudmFsdWVPZiwgWzEsIDBdKVxyXG4gICAgICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgICAgICAgICAgaXNOZWdhdGl2ZTogZmFsc2VcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB2YXIgYXJyID0gQXJyYXkuYXBwbHkobnVsbCwgQXJyYXkobi50b0pTTnVtYmVyKCkgLSAxKSlcclxuICAgICAgICAgICAgICAgIC5tYXAoQXJyYXkucHJvdG90eXBlLnZhbHVlT2YsIFswLCAxXSk7XHJcbiAgICAgICAgICAgIGFyci51bnNoaWZ0KFsxXSk7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogW10uY29uY2F0LmFwcGx5KFtdLCBhcnIpLFxyXG4gICAgICAgICAgICAgICAgaXNOZWdhdGl2ZTogZmFsc2VcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBuZWcgPSBmYWxzZTtcclxuICAgICAgICBpZiAobi5pc05lZ2F0aXZlKCkgJiYgYmFzZS5pc1Bvc2l0aXZlKCkpIHtcclxuICAgICAgICAgICAgbmVnID0gdHJ1ZTtcclxuICAgICAgICAgICAgbiA9IG4uYWJzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChiYXNlLmlzVW5pdCgpKSB7XHJcbiAgICAgICAgICAgIGlmIChuLmlzWmVybygpKSByZXR1cm4geyB2YWx1ZTogWzBdLCBpc05lZ2F0aXZlOiBmYWxzZSB9O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlOiBBcnJheS5hcHBseShudWxsLCBBcnJheShuLnRvSlNOdW1iZXIoKSkpXHJcbiAgICAgICAgICAgICAgICAgICAgLm1hcChOdW1iZXIucHJvdG90eXBlLnZhbHVlT2YsIDEpLFxyXG4gICAgICAgICAgICAgICAgaXNOZWdhdGl2ZTogbmVnXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBvdXQgPSBbXTtcclxuICAgICAgICB2YXIgbGVmdCA9IG4sIGRpdm1vZDtcclxuICAgICAgICB3aGlsZSAobGVmdC5pc05lZ2F0aXZlKCkgfHwgbGVmdC5jb21wYXJlQWJzKGJhc2UpID49IDApIHtcclxuICAgICAgICAgICAgZGl2bW9kID0gbGVmdC5kaXZtb2QoYmFzZSk7XHJcbiAgICAgICAgICAgIGxlZnQgPSBkaXZtb2QucXVvdGllbnQ7XHJcbiAgICAgICAgICAgIHZhciBkaWdpdCA9IGRpdm1vZC5yZW1haW5kZXI7XHJcbiAgICAgICAgICAgIGlmIChkaWdpdC5pc05lZ2F0aXZlKCkpIHtcclxuICAgICAgICAgICAgICAgIGRpZ2l0ID0gYmFzZS5taW51cyhkaWdpdCkuYWJzKCk7XHJcbiAgICAgICAgICAgICAgICBsZWZ0ID0gbGVmdC5uZXh0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb3V0LnB1c2goZGlnaXQudG9KU051bWJlcigpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgb3V0LnB1c2gobGVmdC50b0pTTnVtYmVyKCkpO1xyXG4gICAgICAgIHJldHVybiB7IHZhbHVlOiBvdXQucmV2ZXJzZSgpLCBpc05lZ2F0aXZlOiBuZWcgfTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB0b0Jhc2VTdHJpbmcobiwgYmFzZSwgYWxwaGFiZXQpIHtcclxuICAgICAgICB2YXIgYXJyID0gdG9CYXNlKG4sIGJhc2UpO1xyXG4gICAgICAgIHJldHVybiAoYXJyLmlzTmVnYXRpdmUgPyBcIi1cIiA6IFwiXCIpICsgYXJyLnZhbHVlLm1hcChmdW5jdGlvbiAoeCkge1xyXG4gICAgICAgICAgICByZXR1cm4gc3RyaW5naWZ5KHgsIGFscGhhYmV0KTtcclxuICAgICAgICB9KS5qb2luKCcnKTtcclxuICAgIH1cclxuXHJcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS50b0FycmF5ID0gZnVuY3Rpb24gKHJhZGl4KSB7XHJcbiAgICAgICAgcmV0dXJuIHRvQmFzZSh0aGlzLCByYWRpeCk7XHJcbiAgICB9O1xyXG5cclxuICAgIFNtYWxsSW50ZWdlci5wcm90b3R5cGUudG9BcnJheSA9IGZ1bmN0aW9uIChyYWRpeCkge1xyXG4gICAgICAgIHJldHVybiB0b0Jhc2UodGhpcywgcmFkaXgpO1xyXG4gICAgfTtcclxuXHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLnRvQXJyYXkgPSBmdW5jdGlvbiAocmFkaXgpIHtcclxuICAgICAgICByZXR1cm4gdG9CYXNlKHRoaXMsIHJhZGl4KTtcclxuICAgIH07XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAocmFkaXgsIGFscGhhYmV0KSB7XHJcbiAgICAgICAgaWYgKHJhZGl4ID09PSB1bmRlZmluZWQpIHJhZGl4ID0gMTA7XHJcbiAgICAgICAgaWYgKHJhZGl4ICE9PSAxMCkgcmV0dXJuIHRvQmFzZVN0cmluZyh0aGlzLCByYWRpeCwgYWxwaGFiZXQpO1xyXG4gICAgICAgIHZhciB2ID0gdGhpcy52YWx1ZSwgbCA9IHYubGVuZ3RoLCBzdHIgPSBTdHJpbmcodlstLWxdKSwgemVyb3MgPSBcIjAwMDAwMDBcIiwgZGlnaXQ7XHJcbiAgICAgICAgd2hpbGUgKC0tbCA+PSAwKSB7XHJcbiAgICAgICAgICAgIGRpZ2l0ID0gU3RyaW5nKHZbbF0pO1xyXG4gICAgICAgICAgICBzdHIgKz0gemVyb3Muc2xpY2UoZGlnaXQubGVuZ3RoKSArIGRpZ2l0O1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgc2lnbiA9IHRoaXMuc2lnbiA/IFwiLVwiIDogXCJcIjtcclxuICAgICAgICByZXR1cm4gc2lnbiArIHN0cjtcclxuICAgIH07XHJcblxyXG4gICAgU21hbGxJbnRlZ2VyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIChyYWRpeCwgYWxwaGFiZXQpIHtcclxuICAgICAgICBpZiAocmFkaXggPT09IHVuZGVmaW5lZCkgcmFkaXggPSAxMDtcclxuICAgICAgICBpZiAocmFkaXggIT0gMTApIHJldHVybiB0b0Jhc2VTdHJpbmcodGhpcywgcmFkaXgsIGFscGhhYmV0KTtcclxuICAgICAgICByZXR1cm4gU3RyaW5nKHRoaXMudmFsdWUpO1xyXG4gICAgfTtcclxuXHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLnRvU3RyaW5nID0gU21hbGxJbnRlZ2VyLnByb3RvdHlwZS50b1N0cmluZztcclxuXHJcbiAgICBOYXRpdmVCaWdJbnQucHJvdG90eXBlLnRvSlNPTiA9IEJpZ0ludGVnZXIucHJvdG90eXBlLnRvSlNPTiA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy50b1N0cmluZygpOyB9XHJcblxyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUudmFsdWVPZiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gcGFyc2VJbnQodGhpcy50b1N0cmluZygpLCAxMCk7XHJcbiAgICB9O1xyXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUudG9KU051bWJlciA9IEJpZ0ludGVnZXIucHJvdG90eXBlLnZhbHVlT2Y7XHJcblxyXG4gICAgU21hbGxJbnRlZ2VyLnByb3RvdHlwZS52YWx1ZU9mID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xyXG4gICAgfTtcclxuICAgIFNtYWxsSW50ZWdlci5wcm90b3R5cGUudG9KU051bWJlciA9IFNtYWxsSW50ZWdlci5wcm90b3R5cGUudmFsdWVPZjtcclxuICAgIE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUudmFsdWVPZiA9IE5hdGl2ZUJpZ0ludC5wcm90b3R5cGUudG9KU051bWJlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gcGFyc2VJbnQodGhpcy50b1N0cmluZygpLCAxMCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcGFyc2VTdHJpbmdWYWx1ZSh2KSB7XHJcbiAgICAgICAgaWYgKGlzUHJlY2lzZSgrdikpIHtcclxuICAgICAgICAgICAgdmFyIHggPSArdjtcclxuICAgICAgICAgICAgaWYgKHggPT09IHRydW5jYXRlKHgpKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1cHBvcnRzTmF0aXZlQmlnSW50ID8gbmV3IE5hdGl2ZUJpZ0ludChCaWdJbnQoeCkpIDogbmV3IFNtYWxsSW50ZWdlcih4KTtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBpbnRlZ2VyOiBcIiArIHYpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgc2lnbiA9IHZbMF0gPT09IFwiLVwiO1xyXG4gICAgICAgIGlmIChzaWduKSB2ID0gdi5zbGljZSgxKTtcclxuICAgICAgICB2YXIgc3BsaXQgPSB2LnNwbGl0KC9lL2kpO1xyXG4gICAgICAgIGlmIChzcGxpdC5sZW5ndGggPiAyKSB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGludGVnZXI6IFwiICsgc3BsaXQuam9pbihcImVcIikpO1xyXG4gICAgICAgIGlmIChzcGxpdC5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgdmFyIGV4cCA9IHNwbGl0WzFdO1xyXG4gICAgICAgICAgICBpZiAoZXhwWzBdID09PSBcIitcIikgZXhwID0gZXhwLnNsaWNlKDEpO1xyXG4gICAgICAgICAgICBleHAgPSArZXhwO1xyXG4gICAgICAgICAgICBpZiAoZXhwICE9PSB0cnVuY2F0ZShleHApIHx8ICFpc1ByZWNpc2UoZXhwKSkgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBpbnRlZ2VyOiBcIiArIGV4cCArIFwiIGlzIG5vdCBhIHZhbGlkIGV4cG9uZW50LlwiKTtcclxuICAgICAgICAgICAgdmFyIHRleHQgPSBzcGxpdFswXTtcclxuICAgICAgICAgICAgdmFyIGRlY2ltYWxQbGFjZSA9IHRleHQuaW5kZXhPZihcIi5cIik7XHJcbiAgICAgICAgICAgIGlmIChkZWNpbWFsUGxhY2UgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgZXhwIC09IHRleHQubGVuZ3RoIC0gZGVjaW1hbFBsYWNlIC0gMTtcclxuICAgICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnNsaWNlKDAsIGRlY2ltYWxQbGFjZSkgKyB0ZXh0LnNsaWNlKGRlY2ltYWxQbGFjZSArIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChleHAgPCAwKSB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgaW5jbHVkZSBuZWdhdGl2ZSBleHBvbmVudCBwYXJ0IGZvciBpbnRlZ2Vyc1wiKTtcclxuICAgICAgICAgICAgdGV4dCArPSAobmV3IEFycmF5KGV4cCArIDEpKS5qb2luKFwiMFwiKTtcclxuICAgICAgICAgICAgdiA9IHRleHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBpc1ZhbGlkID0gL14oWzAtOV1bMC05XSopJC8udGVzdCh2KTtcclxuICAgICAgICBpZiAoIWlzVmFsaWQpIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgaW50ZWdlcjogXCIgKyB2KTtcclxuICAgICAgICBpZiAoc3VwcG9ydHNOYXRpdmVCaWdJbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBOYXRpdmVCaWdJbnQoQmlnSW50KHNpZ24gPyBcIi1cIiArIHYgOiB2KSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciByID0gW10sIG1heCA9IHYubGVuZ3RoLCBsID0gTE9HX0JBU0UsIG1pbiA9IG1heCAtIGw7XHJcbiAgICAgICAgd2hpbGUgKG1heCA+IDApIHtcclxuICAgICAgICAgICAgci5wdXNoKCt2LnNsaWNlKG1pbiwgbWF4KSk7XHJcbiAgICAgICAgICAgIG1pbiAtPSBsO1xyXG4gICAgICAgICAgICBpZiAobWluIDwgMCkgbWluID0gMDtcclxuICAgICAgICAgICAgbWF4IC09IGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRyaW0ocik7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCaWdJbnRlZ2VyKHIsIHNpZ24pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlTnVtYmVyVmFsdWUodikge1xyXG4gICAgICAgIGlmIChzdXBwb3J0c05hdGl2ZUJpZ0ludCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IE5hdGl2ZUJpZ0ludChCaWdJbnQodikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoaXNQcmVjaXNlKHYpKSB7XHJcbiAgICAgICAgICAgIGlmICh2ICE9PSB0cnVuY2F0ZSh2KSkgdGhyb3cgbmV3IEVycm9yKHYgKyBcIiBpcyBub3QgYW4gaW50ZWdlci5cIik7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgU21hbGxJbnRlZ2VyKHYpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcGFyc2VTdHJpbmdWYWx1ZSh2LnRvU3RyaW5nKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlVmFsdWUodikge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdiA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VOdW1iZXJWYWx1ZSh2KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2ID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVN0cmluZ1ZhbHVlKHYpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIHYgPT09IFwiYmlnaW50XCIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBOYXRpdmVCaWdJbnQodik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB2O1xyXG4gICAgfVxyXG4gICAgLy8gUHJlLWRlZmluZSBudW1iZXJzIGluIHJhbmdlIFstOTk5LDk5OV1cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTAwMDsgaSsrKSB7XHJcbiAgICAgICAgSW50ZWdlcltpXSA9IHBhcnNlVmFsdWUoaSk7XHJcbiAgICAgICAgaWYgKGkgPiAwKSBJbnRlZ2VyWy1pXSA9IHBhcnNlVmFsdWUoLWkpO1xyXG4gICAgfVxyXG4gICAgLy8gQmFja3dhcmRzIGNvbXBhdGliaWxpdHlcclxuICAgIEludGVnZXIub25lID0gSW50ZWdlclsxXTtcclxuICAgIEludGVnZXIuemVybyA9IEludGVnZXJbMF07XHJcbiAgICBJbnRlZ2VyLm1pbnVzT25lID0gSW50ZWdlclstMV07XHJcbiAgICBJbnRlZ2VyLm1heCA9IG1heDtcclxuICAgIEludGVnZXIubWluID0gbWluO1xyXG4gICAgSW50ZWdlci5nY2QgPSBnY2Q7XHJcbiAgICBJbnRlZ2VyLmxjbSA9IGxjbTtcclxuICAgIEludGVnZXIuaXNJbnN0YW5jZSA9IGZ1bmN0aW9uICh4KSB7IHJldHVybiB4IGluc3RhbmNlb2YgQmlnSW50ZWdlciB8fCB4IGluc3RhbmNlb2YgU21hbGxJbnRlZ2VyIHx8IHggaW5zdGFuY2VvZiBOYXRpdmVCaWdJbnQ7IH07XHJcbiAgICBJbnRlZ2VyLnJhbmRCZXR3ZWVuID0gcmFuZEJldHdlZW47XHJcblxyXG4gICAgSW50ZWdlci5mcm9tQXJyYXkgPSBmdW5jdGlvbiAoZGlnaXRzLCBiYXNlLCBpc05lZ2F0aXZlKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhcnNlQmFzZUZyb21BcnJheShkaWdpdHMubWFwKHBhcnNlVmFsdWUpLCBwYXJzZVZhbHVlKGJhc2UgfHwgMTApLCBpc05lZ2F0aXZlKTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIEludGVnZXI7XHJcbn0pKCk7XHJcblxyXG4vLyBOb2RlLmpzIGNoZWNrXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5oYXNPd25Qcm9wZXJ0eShcImV4cG9ydHNcIikpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gYmlnSW50O1xyXG59XHJcblxyXG4vL2FtZCBjaGVja1xyXG5pZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcclxuICAgIGRlZmluZSggZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBiaWdJbnQ7XHJcbiAgICB9KTtcclxufVxyXG4iLCIvKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxodHRwOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuXG52YXIgYmFzZTY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJylcbnZhciBpZWVlNzU0ID0gcmVxdWlyZSgnaWVlZTc1NCcpXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoJ2lzLWFycmF5JylcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFUyA9IDUwXG5CdWZmZXIucG9vbFNpemUgPSA4MTkyIC8vIG5vdCB1c2VkIGJ5IHRoaXMgaW1wbGVtZW50YXRpb25cblxudmFyIGtNYXhMZW5ndGggPSAweDNmZmZmZmZmXG5cbi8qKlxuICogSWYgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYDpcbiAqICAgPT09IHRydWUgICAgVXNlIFVpbnQ4QXJyYXkgaW1wbGVtZW50YXRpb24gKGZhc3Rlc3QpXG4gKiAgID09PSBmYWxzZSAgIFVzZSBPYmplY3QgaW1wbGVtZW50YXRpb24gKG1vc3QgY29tcGF0aWJsZSwgZXZlbiBJRTYpXG4gKlxuICogQnJvd3NlcnMgdGhhdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBhcmUgSUUgMTArLCBGaXJlZm94IDQrLCBDaHJvbWUgNyssIFNhZmFyaSA1LjErLFxuICogT3BlcmEgMTEuNissIGlPUyA0LjIrLlxuICpcbiAqIE5vdGU6XG4gKlxuICogLSBJbXBsZW1lbnRhdGlvbiBtdXN0IHN1cHBvcnQgYWRkaW5nIG5ldyBwcm9wZXJ0aWVzIHRvIGBVaW50OEFycmF5YCBpbnN0YW5jZXMuXG4gKiAgIEZpcmVmb3ggNC0yOSBsYWNrZWQgc3VwcG9ydCwgZml4ZWQgaW4gRmlyZWZveCAzMCsuXG4gKiAgIFNlZTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4LlxuICpcbiAqICAtIENocm9tZSA5LTEwIGlzIG1pc3NpbmcgdGhlIGBUeXBlZEFycmF5LnByb3RvdHlwZS5zdWJhcnJheWAgZnVuY3Rpb24uXG4gKlxuICogIC0gSUUxMCBoYXMgYSBicm9rZW4gYFR5cGVkQXJyYXkucHJvdG90eXBlLnN1YmFycmF5YCBmdW5jdGlvbiB3aGljaCByZXR1cm5zIGFycmF5cyBvZlxuICogICAgaW5jb3JyZWN0IGxlbmd0aCBpbiBzb21lIHNpdHVhdGlvbnMuXG4gKlxuICogV2UgZGV0ZWN0IHRoZXNlIGJ1Z2d5IGJyb3dzZXJzIGFuZCBzZXQgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYCB0byBgZmFsc2VgIHNvIHRoZXkgd2lsbFxuICogZ2V0IHRoZSBPYmplY3QgaW1wbGVtZW50YXRpb24sIHdoaWNoIGlzIHNsb3dlciBidXQgd2lsbCB3b3JrIGNvcnJlY3RseS5cbiAqL1xuQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgPSAoZnVuY3Rpb24gKCkge1xuICB0cnkge1xuICAgIHZhciBidWYgPSBuZXcgQXJyYXlCdWZmZXIoMClcbiAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkoYnVmKVxuICAgIGFyci5mb28gPSBmdW5jdGlvbiAoKSB7IHJldHVybiA0MiB9XG4gICAgcmV0dXJuIDQyID09PSBhcnIuZm9vKCkgJiYgLy8gdHlwZWQgYXJyYXkgaW5zdGFuY2VzIGNhbiBiZSBhdWdtZW50ZWRcbiAgICAgICAgdHlwZW9mIGFyci5zdWJhcnJheSA9PT0gJ2Z1bmN0aW9uJyAmJiAvLyBjaHJvbWUgOS0xMCBsYWNrIGBzdWJhcnJheWBcbiAgICAgICAgbmV3IFVpbnQ4QXJyYXkoMSkuc3ViYXJyYXkoMSwgMSkuYnl0ZUxlbmd0aCA9PT0gMCAvLyBpZTEwIGhhcyBicm9rZW4gYHN1YmFycmF5YFxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn0pKClcblxuLyoqXG4gKiBDbGFzczogQnVmZmVyXG4gKiA9PT09PT09PT09PT09XG4gKlxuICogVGhlIEJ1ZmZlciBjb25zdHJ1Y3RvciByZXR1cm5zIGluc3RhbmNlcyBvZiBgVWludDhBcnJheWAgdGhhdCBhcmUgYXVnbWVudGVkXG4gKiB3aXRoIGZ1bmN0aW9uIHByb3BlcnRpZXMgZm9yIGFsbCB0aGUgbm9kZSBgQnVmZmVyYCBBUEkgZnVuY3Rpb25zLiBXZSB1c2VcbiAqIGBVaW50OEFycmF5YCBzbyB0aGF0IHNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0IHJldHVybnNcbiAqIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIEJ5IGF1Z21lbnRpbmcgdGhlIGluc3RhbmNlcywgd2UgY2FuIGF2b2lkIG1vZGlmeWluZyB0aGUgYFVpbnQ4QXJyYXlgXG4gKiBwcm90b3R5cGUuXG4gKi9cbmZ1bmN0aW9uIEJ1ZmZlciAoc3ViamVjdCwgZW5jb2RpbmcsIG5vWmVybykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQnVmZmVyKSlcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcihzdWJqZWN0LCBlbmNvZGluZywgbm9aZXJvKVxuXG4gIHZhciB0eXBlID0gdHlwZW9mIHN1YmplY3RcblxuICAvLyBGaW5kIHRoZSBsZW5ndGhcbiAgdmFyIGxlbmd0aFxuICBpZiAodHlwZSA9PT0gJ251bWJlcicpXG4gICAgbGVuZ3RoID0gc3ViamVjdCA+IDAgPyBzdWJqZWN0ID4+PiAwIDogMFxuICBlbHNlIGlmICh0eXBlID09PSAnc3RyaW5nJykge1xuICAgIGlmIChlbmNvZGluZyA9PT0gJ2Jhc2U2NCcpXG4gICAgICBzdWJqZWN0ID0gYmFzZTY0Y2xlYW4oc3ViamVjdClcbiAgICBsZW5ndGggPSBCdWZmZXIuYnl0ZUxlbmd0aChzdWJqZWN0LCBlbmNvZGluZylcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnb2JqZWN0JyAmJiBzdWJqZWN0ICE9PSBudWxsKSB7IC8vIGFzc3VtZSBvYmplY3QgaXMgYXJyYXktbGlrZVxuICAgIGlmIChzdWJqZWN0LnR5cGUgPT09ICdCdWZmZXInICYmIGlzQXJyYXkoc3ViamVjdC5kYXRhKSlcbiAgICAgIHN1YmplY3QgPSBzdWJqZWN0LmRhdGFcbiAgICBsZW5ndGggPSArc3ViamVjdC5sZW5ndGggPiAwID8gTWF0aC5mbG9vcigrc3ViamVjdC5sZW5ndGgpIDogMFxuICB9IGVsc2VcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdtdXN0IHN0YXJ0IHdpdGggbnVtYmVyLCBidWZmZXIsIGFycmF5IG9yIHN0cmluZycpXG5cbiAgaWYgKHRoaXMubGVuZ3RoID4ga01heExlbmd0aClcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byBhbGxvY2F0ZSBCdWZmZXIgbGFyZ2VyIHRoYW4gbWF4aW11bSAnICtcbiAgICAgICdzaXplOiAweCcgKyBrTWF4TGVuZ3RoLnRvU3RyaW5nKDE2KSArICcgYnl0ZXMnKVxuXG4gIHZhciBidWZcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gUHJlZmVycmVkOiBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSBmb3IgYmVzdCBwZXJmb3JtYW5jZVxuICAgIGJ1ZiA9IEJ1ZmZlci5fYXVnbWVudChuZXcgVWludDhBcnJheShsZW5ndGgpKVxuICB9IGVsc2Uge1xuICAgIC8vIEZhbGxiYWNrOiBSZXR1cm4gVEhJUyBpbnN0YW5jZSBvZiBCdWZmZXIgKGNyZWF0ZWQgYnkgYG5ld2ApXG4gICAgYnVmID0gdGhpc1xuICAgIGJ1Zi5sZW5ndGggPSBsZW5ndGhcbiAgICBidWYuX2lzQnVmZmVyID0gdHJ1ZVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmIHR5cGVvZiBzdWJqZWN0LmJ5dGVMZW5ndGggPT09ICdudW1iZXInKSB7XG4gICAgLy8gU3BlZWQgb3B0aW1pemF0aW9uIC0tIHVzZSBzZXQgaWYgd2UncmUgY29weWluZyBmcm9tIGEgdHlwZWQgYXJyYXlcbiAgICBidWYuX3NldChzdWJqZWN0KVxuICB9IGVsc2UgaWYgKGlzQXJyYXlpc2goc3ViamVjdCkpIHtcbiAgICAvLyBUcmVhdCBhcnJheS1pc2ggb2JqZWN0cyBhcyBhIGJ5dGUgYXJyYXlcbiAgICBpZiAoQnVmZmVyLmlzQnVmZmVyKHN1YmplY3QpKSB7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspXG4gICAgICAgIGJ1ZltpXSA9IHN1YmplY3QucmVhZFVJbnQ4KGkpXG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKylcbiAgICAgICAgYnVmW2ldID0gKChzdWJqZWN0W2ldICUgMjU2KSArIDI1NikgJSAyNTZcbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICBidWYud3JpdGUoc3ViamVjdCwgMCwgZW5jb2RpbmcpXG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ251bWJlcicgJiYgIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmICFub1plcm8pIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGJ1ZltpXSA9IDBcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnVmXG59XG5cbkJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uIChiKSB7XG4gIHJldHVybiAhIShiICE9IG51bGwgJiYgYi5faXNCdWZmZXIpXG59XG5cbkJ1ZmZlci5jb21wYXJlID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYSkgfHwgIUJ1ZmZlci5pc0J1ZmZlcihiKSlcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgbXVzdCBiZSBCdWZmZXJzJylcblxuICB2YXIgeCA9IGEubGVuZ3RoXG4gIHZhciB5ID0gYi5sZW5ndGhcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IE1hdGgubWluKHgsIHkpOyBpIDwgbGVuICYmIGFbaV0gPT09IGJbaV07IGkrKykge31cbiAgaWYgKGkgIT09IGxlbikge1xuICAgIHggPSBhW2ldXG4gICAgeSA9IGJbaV1cbiAgfVxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gKGVuY29kaW5nKSB7XG4gIHN3aXRjaCAoU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICBjYXNlICdyYXcnOlxuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5CdWZmZXIuY29uY2F0ID0gZnVuY3Rpb24gKGxpc3QsIHRvdGFsTGVuZ3RoKSB7XG4gIGlmICghaXNBcnJheShsaXN0KSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVXNhZ2U6IEJ1ZmZlci5jb25jYXQobGlzdFssIGxlbmd0aF0pJylcblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcigwKVxuICB9IGVsc2UgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIGxpc3RbMF1cbiAgfVxuXG4gIHZhciBpXG4gIGlmICh0b3RhbExlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdG90YWxMZW5ndGggPSAwXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRvdGFsTGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1ZiA9IG5ldyBCdWZmZXIodG90YWxMZW5ndGgpXG4gIHZhciBwb3MgPSAwXG4gIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBsaXN0W2ldXG4gICAgaXRlbS5jb3B5KGJ1ZiwgcG9zKVxuICAgIHBvcyArPSBpdGVtLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZcbn1cblxuQnVmZmVyLmJ5dGVMZW5ndGggPSBmdW5jdGlvbiAoc3RyLCBlbmNvZGluZykge1xuICB2YXIgcmV0XG4gIHN0ciA9IHN0ciArICcnXG4gIHN3aXRjaCAoZW5jb2RpbmcgfHwgJ3V0ZjgnKSB7XG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAncmF3JzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGggKiAyXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2hleCc6XG4gICAgICByZXQgPSBzdHIubGVuZ3RoID4+PiAxXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIHJldCA9IHV0ZjhUb0J5dGVzKHN0cikubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICByZXQgPSBiYXNlNjRUb0J5dGVzKHN0cikubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXQgPSBzdHIubGVuZ3RoXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG4vLyBwcmUtc2V0IGZvciB2YWx1ZXMgdGhhdCBtYXkgZXhpc3QgaW4gdGhlIGZ1dHVyZVxuQnVmZmVyLnByb3RvdHlwZS5sZW5ndGggPSB1bmRlZmluZWRcbkJ1ZmZlci5wcm90b3R5cGUucGFyZW50ID0gdW5kZWZpbmVkXG5cbi8vIHRvU3RyaW5nKGVuY29kaW5nLCBzdGFydD0wLCBlbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcblxuICBzdGFydCA9IHN0YXJ0ID4+PiAwXG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkIHx8IGVuZCA9PT0gSW5maW5pdHkgPyB0aGlzLmxlbmd0aCA6IGVuZCA+Pj4gMFxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG4gIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmIChlbmQgPD0gc3RhcnQpIHJldHVybiAnJ1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGJpbmFyeVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdXRmMTZsZVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSlcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKGVuY29kaW5nICsgJycpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gKGIpIHtcbiAgaWYoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIHJldHVybiBCdWZmZXIuY29tcGFyZSh0aGlzLCBiKSA9PT0gMFxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBzdHIgPSAnJ1xuICB2YXIgbWF4ID0gZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFU1xuICBpZiAodGhpcy5sZW5ndGggPiAwKSB7XG4gICAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5tYXRjaCgvLnsyfS9nKS5qb2luKCcgJylcbiAgICBpZiAodGhpcy5sZW5ndGggPiBtYXgpXG4gICAgICBzdHIgKz0gJyAuLi4gJ1xuICB9XG4gIHJldHVybiAnPEJ1ZmZlciAnICsgc3RyICsgJz4nXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuY29tcGFyZSA9IGZ1bmN0aW9uIChiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyJylcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpXG59XG5cbi8vIGBnZXRgIHdpbGwgYmUgcmVtb3ZlZCBpbiBOb2RlIDAuMTMrXG5CdWZmZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5nZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLnJlYWRVSW50OChvZmZzZXQpXG59XG5cbi8vIGBzZXRgIHdpbGwgYmUgcmVtb3ZlZCBpbiBOb2RlIDAuMTMrXG5CdWZmZXIucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uICh2LCBvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5zZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLndyaXRlVUludDgodiwgb2Zmc2V0KVxufVxuXG5mdW5jdGlvbiBoZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIC8vIG11c3QgYmUgYW4gZXZlbiBudW1iZXIgb2YgZGlnaXRzXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGlmIChzdHJMZW4gJSAyICE9PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaGV4IHN0cmluZycpXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHZhciBieXRlID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGlmIChpc05hTihieXRlKSkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGhleCBzdHJpbmcnKVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IGJ5dGVcbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiB1dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIGFzY2lpV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5mdW5jdGlvbiBiaW5hcnlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBhc2NpaVdyaXRlKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG4gIHJldHVybiBjaGFyc1dyaXR0ZW5cbn1cblxuZnVuY3Rpb24gdXRmMTZsZVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIGNoYXJzV3JpdHRlbiA9IGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aCwgMilcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKSB7XG4gIC8vIFN1cHBvcnQgYm90aCAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpXG4gIC8vIGFuZCB0aGUgbGVnYWN5IChzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBpZiAoIWlzRmluaXRlKGxlbmd0aCkpIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIH0gZWxzZSB7ICAvLyBsZWdhY3lcbiAgICB2YXIgc3dhcCA9IGVuY29kaW5nXG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBvZmZzZXQgPSBsZW5ndGhcbiAgICBsZW5ndGggPSBzd2FwXG4gIH1cblxuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG4gIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nIHx8ICd1dGY4JykudG9Mb3dlckNhc2UoKVxuXG4gIHZhciByZXRcbiAgc3dpdGNoIChlbmNvZGluZykge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgICByZXQgPSBoZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgICByZXQgPSB1dGY4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYXNjaWknOlxuICAgICAgcmV0ID0gYXNjaWlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiaW5hcnknOlxuICAgICAgcmV0ID0gYmluYXJ5V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IGJhc2U2NFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXQgPSB1dGYxNmxlV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gYnVmLmxlbmd0aCkge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1Zi5zbGljZShzdGFydCwgZW5kKSlcbiAgfVxufVxuXG5mdW5jdGlvbiB1dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmVzID0gJydcbiAgdmFyIHRtcCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIGlmIChidWZbaV0gPD0gMHg3Rikge1xuICAgICAgcmVzICs9IGRlY29kZVV0ZjhDaGFyKHRtcCkgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgICAgIHRtcCA9ICcnXG4gICAgfSBlbHNlIHtcbiAgICAgIHRtcCArPSAnJScgKyBidWZbaV0udG9TdHJpbmcoMTYpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcyArIGRlY29kZVV0ZjhDaGFyKHRtcClcbn1cblxuZnVuY3Rpb24gYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBiaW5hcnlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHJldHVybiBhc2NpaVNsaWNlKGJ1Ziwgc3RhcnQsIGVuZClcbn1cblxuZnVuY3Rpb24gaGV4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuXG4gIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlblxuXG4gIHZhciBvdXQgPSAnJ1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIG91dCArPSB0b0hleChidWZbaV0pXG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiB1dGYxNmxlU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgYnl0ZXMgPSBidWYuc2xpY2Uoc3RhcnQsIGVuZClcbiAgdmFyIHJlcyA9ICcnXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSArIGJ5dGVzW2kgKyAxXSAqIDI1NilcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbiAoc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgc3RhcnQgPSB+fnN0YXJ0XG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkID8gbGVuIDogfn5lbmRcblxuICBpZiAoc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgKz0gbGVuO1xuICAgIGlmIChzdGFydCA8IDApXG4gICAgICBzdGFydCA9IDBcbiAgfSBlbHNlIGlmIChzdGFydCA+IGxlbikge1xuICAgIHN0YXJ0ID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgMCkge1xuICAgIGVuZCArPSBsZW5cbiAgICBpZiAoZW5kIDwgMClcbiAgICAgIGVuZCA9IDBcbiAgfSBlbHNlIGlmIChlbmQgPiBsZW4pIHtcbiAgICBlbmQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCBzdGFydClcbiAgICBlbmQgPSBzdGFydFxuXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHJldHVybiBCdWZmZXIuX2F1Z21lbnQodGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSlcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2xpY2VMZW4gPSBlbmQgLSBzdGFydFxuICAgIHZhciBuZXdCdWYgPSBuZXcgQnVmZmVyKHNsaWNlTGVuLCB1bmRlZmluZWQsIHRydWUpXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzbGljZUxlbjsgaSsrKSB7XG4gICAgICBuZXdCdWZbaV0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gICAgcmV0dXJuIG5ld0J1ZlxuICB9XG59XG5cbi8qXG4gKiBOZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IGJ1ZmZlciBpc24ndCB0cnlpbmcgdG8gd3JpdGUgb3V0IG9mIGJvdW5kcy5cbiAqL1xuZnVuY3Rpb24gY2hlY2tPZmZzZXQgKG9mZnNldCwgZXh0LCBsZW5ndGgpIHtcbiAgaWYgKChvZmZzZXQgJSAxKSAhPT0gMCB8fCBvZmZzZXQgPCAwKVxuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdvZmZzZXQgaXMgbm90IHVpbnQnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gbGVuZ3RoKVxuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUcnlpbmcgdG8gYWNjZXNzIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgOCkgfCB0aGlzW29mZnNldCArIDFdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAoKHRoaXNbb2Zmc2V0XSkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpKSArXG4gICAgICAodGhpc1tvZmZzZXQgKyAzXSAqIDB4MTAwMDAwMClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyQkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gKiAweDEwMDAwMDApICtcbiAgICAgICgodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgICAgdGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgaWYgKCEodGhpc1tvZmZzZXRdICYgMHg4MCkpXG4gICAgcmV0dXJuICh0aGlzW29mZnNldF0pXG4gIHJldHVybiAoKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAxXSB8ICh0aGlzW29mZnNldF0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdKSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgM10gPDwgMjQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgMjQpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCA1MiwgOClcbn1cblxuZnVuY3Rpb24gY2hlY2tJbnQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdidWZmZXIgbXVzdCBiZSBhIEJ1ZmZlciBpbnN0YW5jZScpXG4gIGlmICh2YWx1ZSA+IG1heCB8fCB2YWx1ZSA8IG1pbikgdGhyb3cgbmV3IFR5cGVFcnJvcigndmFsdWUgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdpbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHhmZiwgMClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkgdmFsdWUgPSBNYXRoLmZsb29yKHZhbHVlKVxuICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5mdW5jdGlvbiBvYmplY3RXcml0ZVVJbnQxNiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4pIHtcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmYgKyB2YWx1ZSArIDFcbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihidWYubGVuZ3RoIC0gb2Zmc2V0LCAyKTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9ICh2YWx1ZSAmICgweGZmIDw8ICg4ICogKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkpKSkgPj4+XG4gICAgICAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSAqIDhcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIH0gZWxzZSBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9IHZhbHVlXG4gIH0gZWxzZSBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuZnVuY3Rpb24gb2JqZWN0V3JpdGVVSW50MzIgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuKSB7XG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGJ1Zi5sZW5ndGggLSBvZmZzZXQsIDQpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID0gKHZhbHVlID4+PiAobGl0dGxlRW5kaWFuID8gaSA6IDMgLSBpKSAqIDgpICYgMHhmZlxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gIH0gZWxzZSBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSB2YWx1ZVxuICB9IGVsc2Ugb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4N2YsIC0weDgwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB2YWx1ZSA9IE1hdGguZmxvb3IodmFsdWUpXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgfSBlbHNlIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSB2YWx1ZVxuICB9IGVsc2Ugb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIH0gZWxzZSBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDNdID0gdmFsdWVcbiAgfSBlbHNlIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5mdW5jdGlvbiBjaGVja0lFRUU3NTQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbHVlIGlzIG91dCBvZiBib3VuZHMnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFR5cGVFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuZnVuY3Rpb24gd3JpdGVGbG9hdCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgNCwgMy40MDI4MjM0NjYzODUyODg2ZSszOCwgLTMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgpXG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0QkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgOCwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG4gIHJldHVybiBvZmZzZXQgKyA4XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiAodGFyZ2V0LCB0YXJnZXRfc3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHNvdXJjZSA9IHRoaXNcblxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAoIXRhcmdldF9zdGFydCkgdGFyZ2V0X3N0YXJ0ID0gMFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuXG4gIGlmICh0YXJnZXQubGVuZ3RoID09PSAwIHx8IHNvdXJjZS5sZW5ndGggPT09IDApIHJldHVyblxuXG4gIC8vIEZhdGFsIGVycm9yIGNvbmRpdGlvbnNcbiAgaWYgKGVuZCA8IHN0YXJ0KSB0aHJvdyBuZXcgVHlwZUVycm9yKCdzb3VyY2VFbmQgPCBzb3VyY2VTdGFydCcpXG4gIGlmICh0YXJnZXRfc3RhcnQgPCAwIHx8IHRhcmdldF9zdGFydCA+PSB0YXJnZXQubGVuZ3RoKVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3RhcmdldFN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHNvdXJjZS5sZW5ndGgpIHRocm93IG5ldyBUeXBlRXJyb3IoJ3NvdXJjZVN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBpZiAoZW5kIDwgMCB8fCBlbmQgPiBzb3VyY2UubGVuZ3RoKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdzb3VyY2VFbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgLy8gQXJlIHdlIG9vYj9cbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKVxuICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0IDwgZW5kIC0gc3RhcnQpXG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldF9zdGFydCArIHN0YXJ0XG5cbiAgdmFyIGxlbiA9IGVuZCAtIHN0YXJ0XG5cbiAgaWYgKGxlbiA8IDEwMDAgfHwgIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRfc3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRhcmdldC5fc2V0KHRoaXMuc3ViYXJyYXkoc3RhcnQsIHN0YXJ0ICsgbGVuKSwgdGFyZ2V0X3N0YXJ0KVxuICB9XG59XG5cbi8vIGZpbGwodmFsdWUsIHN0YXJ0PTAsIGVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gKHZhbHVlLCBzdGFydCwgZW5kKSB7XG4gIGlmICghdmFsdWUpIHZhbHVlID0gMFxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQpIGVuZCA9IHRoaXMubGVuZ3RoXG5cbiAgaWYgKGVuZCA8IHN0YXJ0KSB0aHJvdyBuZXcgVHlwZUVycm9yKCdlbmQgPCBzdGFydCcpXG5cbiAgLy8gRmlsbCAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm5cbiAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdzdGFydCBvdXQgb2YgYm91bmRzJylcbiAgaWYgKGVuZCA8IDAgfHwgZW5kID4gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2VuZCBvdXQgb2YgYm91bmRzJylcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIHRoaXNbaV0gPSB2YWx1ZVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgYnl0ZXMgPSB1dGY4VG9CeXRlcyh2YWx1ZS50b1N0cmluZygpKVxuICAgIHZhciBsZW4gPSBieXRlcy5sZW5ndGhcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gYnl0ZXNbaSAlIGxlbl1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgYEFycmF5QnVmZmVyYCB3aXRoIHRoZSAqY29waWVkKiBtZW1vcnkgb2YgdGhlIGJ1ZmZlciBpbnN0YW5jZS5cbiAqIEFkZGVkIGluIE5vZGUgMC4xMi4gT25seSBhdmFpbGFibGUgaW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0IEFycmF5QnVmZmVyLlxuICovXG5CdWZmZXIucHJvdG90eXBlLnRvQXJyYXlCdWZmZXIgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAgIHJldHVybiAobmV3IEJ1ZmZlcih0aGlzKSkuYnVmZmVyXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBidWYgPSBuZXcgVWludDhBcnJheSh0aGlzLmxlbmd0aClcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBidWYubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgYnVmW2ldID0gdGhpc1tpXVxuICAgICAgfVxuICAgICAgcmV0dXJuIGJ1Zi5idWZmZXJcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQnVmZmVyLnRvQXJyYXlCdWZmZXIgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGJyb3dzZXInKVxuICB9XG59XG5cbi8vIEhFTFBFUiBGVU5DVElPTlNcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIEJQID0gQnVmZmVyLnByb3RvdHlwZVxuXG4vKipcbiAqIEF1Z21lbnQgYSBVaW50OEFycmF5ICppbnN0YW5jZSogKG5vdCB0aGUgVWludDhBcnJheSBjbGFzcyEpIHdpdGggQnVmZmVyIG1ldGhvZHNcbiAqL1xuQnVmZmVyLl9hdWdtZW50ID0gZnVuY3Rpb24gKGFycikge1xuICBhcnIuY29uc3RydWN0b3IgPSBCdWZmZXJcbiAgYXJyLl9pc0J1ZmZlciA9IHRydWVcblxuICAvLyBzYXZlIHJlZmVyZW5jZSB0byBvcmlnaW5hbCBVaW50OEFycmF5IGdldC9zZXQgbWV0aG9kcyBiZWZvcmUgb3ZlcndyaXRpbmdcbiAgYXJyLl9nZXQgPSBhcnIuZ2V0XG4gIGFyci5fc2V0ID0gYXJyLnNldFxuXG4gIC8vIGRlcHJlY2F0ZWQsIHdpbGwgYmUgcmVtb3ZlZCBpbiBub2RlIDAuMTMrXG4gIGFyci5nZXQgPSBCUC5nZXRcbiAgYXJyLnNldCA9IEJQLnNldFxuXG4gIGFyci53cml0ZSA9IEJQLndyaXRlXG4gIGFyci50b1N0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0xvY2FsZVN0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0pTT04gPSBCUC50b0pTT05cbiAgYXJyLmVxdWFscyA9IEJQLmVxdWFsc1xuICBhcnIuY29tcGFyZSA9IEJQLmNvbXBhcmVcbiAgYXJyLmNvcHkgPSBCUC5jb3B5XG4gIGFyci5zbGljZSA9IEJQLnNsaWNlXG4gIGFyci5yZWFkVUludDggPSBCUC5yZWFkVUludDhcbiAgYXJyLnJlYWRVSW50MTZMRSA9IEJQLnJlYWRVSW50MTZMRVxuICBhcnIucmVhZFVJbnQxNkJFID0gQlAucmVhZFVJbnQxNkJFXG4gIGFyci5yZWFkVUludDMyTEUgPSBCUC5yZWFkVUludDMyTEVcbiAgYXJyLnJlYWRVSW50MzJCRSA9IEJQLnJlYWRVSW50MzJCRVxuICBhcnIucmVhZEludDggPSBCUC5yZWFkSW50OFxuICBhcnIucmVhZEludDE2TEUgPSBCUC5yZWFkSW50MTZMRVxuICBhcnIucmVhZEludDE2QkUgPSBCUC5yZWFkSW50MTZCRVxuICBhcnIucmVhZEludDMyTEUgPSBCUC5yZWFkSW50MzJMRVxuICBhcnIucmVhZEludDMyQkUgPSBCUC5yZWFkSW50MzJCRVxuICBhcnIucmVhZEZsb2F0TEUgPSBCUC5yZWFkRmxvYXRMRVxuICBhcnIucmVhZEZsb2F0QkUgPSBCUC5yZWFkRmxvYXRCRVxuICBhcnIucmVhZERvdWJsZUxFID0gQlAucmVhZERvdWJsZUxFXG4gIGFyci5yZWFkRG91YmxlQkUgPSBCUC5yZWFkRG91YmxlQkVcbiAgYXJyLndyaXRlVUludDggPSBCUC53cml0ZVVJbnQ4XG4gIGFyci53cml0ZVVJbnQxNkxFID0gQlAud3JpdGVVSW50MTZMRVxuICBhcnIud3JpdGVVSW50MTZCRSA9IEJQLndyaXRlVUludDE2QkVcbiAgYXJyLndyaXRlVUludDMyTEUgPSBCUC53cml0ZVVJbnQzMkxFXG4gIGFyci53cml0ZVVJbnQzMkJFID0gQlAud3JpdGVVSW50MzJCRVxuICBhcnIud3JpdGVJbnQ4ID0gQlAud3JpdGVJbnQ4XG4gIGFyci53cml0ZUludDE2TEUgPSBCUC53cml0ZUludDE2TEVcbiAgYXJyLndyaXRlSW50MTZCRSA9IEJQLndyaXRlSW50MTZCRVxuICBhcnIud3JpdGVJbnQzMkxFID0gQlAud3JpdGVJbnQzMkxFXG4gIGFyci53cml0ZUludDMyQkUgPSBCUC53cml0ZUludDMyQkVcbiAgYXJyLndyaXRlRmxvYXRMRSA9IEJQLndyaXRlRmxvYXRMRVxuICBhcnIud3JpdGVGbG9hdEJFID0gQlAud3JpdGVGbG9hdEJFXG4gIGFyci53cml0ZURvdWJsZUxFID0gQlAud3JpdGVEb3VibGVMRVxuICBhcnIud3JpdGVEb3VibGVCRSA9IEJQLndyaXRlRG91YmxlQkVcbiAgYXJyLmZpbGwgPSBCUC5maWxsXG4gIGFyci5pbnNwZWN0ID0gQlAuaW5zcGVjdFxuICBhcnIudG9BcnJheUJ1ZmZlciA9IEJQLnRvQXJyYXlCdWZmZXJcblxuICByZXR1cm4gYXJyXG59XG5cbnZhciBJTlZBTElEX0JBU0U2NF9SRSA9IC9bXitcXC8wLTlBLXpdL2dcblxuZnVuY3Rpb24gYmFzZTY0Y2xlYW4gKHN0cikge1xuICAvLyBOb2RlIHN0cmlwcyBvdXQgaW52YWxpZCBjaGFyYWN0ZXJzIGxpa2UgXFxuIGFuZCBcXHQgZnJvbSB0aGUgc3RyaW5nLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgc3RyID0gc3RyaW5ndHJpbShzdHIpLnJlcGxhY2UoSU5WQUxJRF9CQVNFNjRfUkUsICcnKVxuICAvLyBOb2RlIGFsbG93cyBmb3Igbm9uLXBhZGRlZCBiYXNlNjQgc3RyaW5ncyAobWlzc2luZyB0cmFpbGluZyA9PT0pLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgd2hpbGUgKHN0ci5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgc3RyID0gc3RyICsgJz0nXG4gIH1cbiAgcmV0dXJuIHN0clxufVxuXG5mdW5jdGlvbiBzdHJpbmd0cmltIChzdHIpIHtcbiAgaWYgKHN0ci50cmltKSByZXR1cm4gc3RyLnRyaW0oKVxuICByZXR1cm4gc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKVxufVxuXG5mdW5jdGlvbiBpc0FycmF5aXNoIChzdWJqZWN0KSB7XG4gIHJldHVybiBpc0FycmF5KHN1YmplY3QpIHx8IEJ1ZmZlci5pc0J1ZmZlcihzdWJqZWN0KSB8fFxuICAgICAgc3ViamVjdCAmJiB0eXBlb2Ygc3ViamVjdCA9PT0gJ29iamVjdCcgJiZcbiAgICAgIHR5cGVvZiBzdWJqZWN0Lmxlbmd0aCA9PT0gJ251bWJlcidcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIHZhciBiID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBpZiAoYiA8PSAweDdGKSB7XG4gICAgICBieXRlQXJyYXkucHVzaChiKVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgc3RhcnQgPSBpXG4gICAgICBpZiAoYiA+PSAweEQ4MDAgJiYgYiA8PSAweERGRkYpIGkrK1xuICAgICAgdmFyIGggPSBlbmNvZGVVUklDb21wb25lbnQoc3RyLnNsaWNlKHN0YXJ0LCBpKzEpKS5zdWJzdHIoMSkuc3BsaXQoJyUnKVxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBoLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGJ5dGVBcnJheS5wdXNoKHBhcnNlSW50KGhbal0sIDE2KSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIHJldHVybiBiYXNlNjQudG9CeXRlQXJyYXkoc3RyKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgsIHVuaXRTaXplKSB7XG4gIGlmICh1bml0U2l6ZSkgbGVuZ3RoIC09IGxlbmd0aCAlIHVuaXRTaXplO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKVxuICAgICAgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiBkZWNvZGVVdGY4Q2hhciAoc3RyKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChzdHIpXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4RkZGRCkgLy8gVVRGIDggaW52YWxpZCBjaGFyXG4gIH1cbn1cbiIsImV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uIChidWZmZXIsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtXG4gIHZhciBlTGVuID0gKG5CeXRlcyAqIDgpIC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBuQml0cyA9IC03XG4gIHZhciBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDBcbiAgdmFyIGQgPSBpc0xFID8gLTEgOiAxXG4gIHZhciBzID0gYnVmZmVyW29mZnNldCArIGldXG5cbiAgaSArPSBkXG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgcyA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gZUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gKGUgKiAyNTYpICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgZSA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gbUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gKG0gKiAyNTYpICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgaWYgKGUgPT09IDApIHtcbiAgICBlID0gMSAtIGVCaWFzXG4gIH0gZWxzZSBpZiAoZSA9PT0gZU1heCkge1xuICAgIHJldHVybiBtID8gTmFOIDogKChzID8gLTEgOiAxKSAqIEluZmluaXR5KVxuICB9IGVsc2Uge1xuICAgIG0gPSBtICsgTWF0aC5wb3coMiwgbUxlbilcbiAgICBlID0gZSAtIGVCaWFzXG4gIH1cbiAgcmV0dXJuIChzID8gLTEgOiAxKSAqIG0gKiBNYXRoLnBvdygyLCBlIC0gbUxlbilcbn1cblxuZXhwb3J0cy53cml0ZSA9IGZ1bmN0aW9uIChidWZmZXIsIHZhbHVlLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSwgY1xuICB2YXIgZUxlbiA9IChuQnl0ZXMgKiA4KSAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApXG4gIHZhciBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSlcbiAgdmFyIGQgPSBpc0xFID8gMSA6IC0xXG4gIHZhciBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwXG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSlcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMFxuICAgIGUgPSBlTWF4XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpXG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tXG4gICAgICBjICo9IDJcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGNcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpXG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrXG4gICAgICBjIC89IDJcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwXG4gICAgICBlID0gZU1heFxuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAoKHZhbHVlICogYykgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gZSArIGVCaWFzXG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IDBcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KSB7fVxuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG1cbiAgZUxlbiArPSBtTGVuXG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCkge31cblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjhcbn1cbiIsIlxuLyoqXG4gKiBpc0FycmF5XG4gKi9cblxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuXG4vKipcbiAqIHRvU3RyaW5nXG4gKi9cblxudmFyIHN0ciA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbi8qKlxuICogV2hldGhlciBvciBub3QgdGhlIGdpdmVuIGB2YWxgXG4gKiBpcyBhbiBhcnJheS5cbiAqXG4gKiBleGFtcGxlOlxuICpcbiAqICAgICAgICBpc0FycmF5KFtdKTtcbiAqICAgICAgICAvLyA+IHRydWVcbiAqICAgICAgICBpc0FycmF5KGFyZ3VtZW50cyk7XG4gKiAgICAgICAgLy8gPiBmYWxzZVxuICogICAgICAgIGlzQXJyYXkoJycpO1xuICogICAgICAgIC8vID4gZmFsc2VcbiAqXG4gKiBAcGFyYW0ge21peGVkfSB2YWxcbiAqIEByZXR1cm4ge2Jvb2x9XG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBpc0FycmF5IHx8IGZ1bmN0aW9uICh2YWwpIHtcbiAgcmV0dXJuICEhIHZhbCAmJiAnW29iamVjdCBBcnJheV0nID09IHN0ci5jYWxsKHZhbCk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXHJcblxyXG5Qcm9ibGVtIDE6IE11bHRpcGxlcyBvZiAzIGFuZCA1XHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbklmIHdlIGxpc3QgYWxsIHRoZSBuYXR1cmFsIG51bWJlcnMgYmVsb3cgMTAgdGhhdCBhcmUgbXVsdGlwbGVzIG9mIDMgb3IgNSwgd2UgZ2V0IDMsIDUsIDYgYW5kIDkuXHJcblRoZSBzdW0gb2YgdGhlc2UgbXVsdGlwbGVzIGlzIDIzLlxyXG5cclxuRmluZCB0aGUgc3VtIG9mIGFsbCB0aGUgbXVsdGlwbGVzIG9mIDMgb3IgNSBiZWxvdyAxMDAwLlxyXG5cclxuXCJcIlwiXHJcblxyXG5wcm9ibGVtLnRlc3QgPSAtPlxyXG4gIHN1bSA9IDBcclxuICBmb3IgaSBpbiBbMS4uLjEwXVxyXG4gICAgaWYgKGkgJSAzID09IDApIG9yIChpICUgNSA9PSAwKVxyXG4gICAgICBzdW0gKz0gaVxyXG4gIGVxdWFsKHN1bSwgMjMsIFwiU3VtIG9mIG5hdHVyYWwgbnVtYmVycyA8IDEwOiAje3N1bX1cIilcclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICBzdW0gPSAwXHJcbiAgZm9yIGkgaW4gWzEuLi4xMDAwXVxyXG4gICAgaWYgKGkgJSAzID09IDApIG9yIChpICUgNSA9PSAwKVxyXG4gICAgICBzdW0gKz0gaVxyXG5cclxuICByZXR1cm4gc3VtXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxyXG5cclxuUHJvYmxlbSAyOiBFdmVuIEZpYm9uYWNjaSBudW1iZXJzXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuRWFjaCBuZXcgdGVybSBpbiB0aGUgRmlib25hY2NpIHNlcXVlbmNlIGlzIGdlbmVyYXRlZCBieSBhZGRpbmcgdGhlIHByZXZpb3VzIHR3byB0ZXJtcy5cclxuQnkgc3RhcnRpbmcgd2l0aCAxIGFuZCAyLCB0aGUgZmlyc3QgMTAgdGVybXMgd2lsbCBiZTpcclxuXHJcbjEsIDIsIDMsIDUsIDgsIDEzLCAyMSwgMzQsIDU1LCA4OSwgLi4uXHJcblxyXG5CeSBjb25zaWRlcmluZyB0aGUgdGVybXMgaW4gdGhlIEZpYm9uYWNjaSBzZXF1ZW5jZSB3aG9zZSB2YWx1ZXMgZG8gbm90IGV4Y2VlZCBmb3VyIG1pbGxpb24sXHJcbmZpbmQgdGhlIHN1bSBvZiB0aGUgZXZlbi12YWx1ZWQgdGVybXMuXHJcblxyXG5cIlwiXCJcclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICBwcmV2ID0gMVxyXG4gIGN1cnIgPSAxXHJcbiAgc3VtID0gMFxyXG5cclxuICB3aGlsZSBjdXJyIDwgNDAwMDAwMFxyXG4gICAgaWYgKGN1cnIgJSAyKSA9PSAwXHJcbiAgICAgIHN1bSArPSBjdXJyXHJcblxyXG4gICAgbmV4dCA9IGN1cnIgKyBwcmV2XHJcbiAgICBwcmV2ID0gY3VyclxyXG4gICAgY3VyciA9IG5leHRcclxuXHJcbiAgcmV0dXJuIHN1bVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcclxuXHJcblByb2JsZW0gMzogTGFyZ2VzdCBwcmltZSBmYWN0b3JcclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuVGhlIHByaW1lIGZhY3RvcnMgb2YgMTMxOTUgYXJlIDUsIDcsIDEzIGFuZCAyOS5cclxuXHJcbldoYXQgaXMgdGhlIGxhcmdlc3QgcHJpbWUgZmFjdG9yIG9mIHRoZSBudW1iZXIgNjAwODUxNDc1MTQzID9cclxuXHJcblwiXCJcIlxyXG5cclxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4jIFNoYW1lbGVzc2x5IHBpbGZlcmVkL2Fkb3B0ZWQgZnJvbSBodHRwOi8vd3d3LmphdmFzY3JpcHRlci5uZXQvZmFxL251bWJlcmlzcHJpbWUuaHRtXHJcblxyXG5sZWFzdEZhY3RvciA9IChuKSAtPlxyXG4gIHJldHVybiBOYU4gaWYgaXNOYU4obikgb3Igbm90IGlzRmluaXRlKG4pXHJcbiAgcmV0dXJuIDAgaWYgbiA9PSAwXHJcbiAgcmV0dXJuIDEgaWYgKG4gJSAxKSAhPSAwIG9yIChuICogbikgPCAyXHJcbiAgcmV0dXJuIDIgaWYgKG4gJSAyKSA9PSAwXHJcbiAgcmV0dXJuIDMgaWYgKG4gJSAzKSA9PSAwXHJcbiAgcmV0dXJuIDUgaWYgKG4gJSA1KSA9PSAwXHJcblxyXG4gIG0gPSBNYXRoLnNxcnQgblxyXG4gIGZvciBpIGluIFs3Li5tXSBieSAzMFxyXG4gICAgcmV0dXJuIGkgICAgaWYgKG4gJSBpKSAgICAgID09IDBcclxuICAgIHJldHVybiBpKzQgIGlmIChuICUgKGkrNCkpICA9PSAwXHJcbiAgICByZXR1cm4gaSs2ICBpZiAobiAlIChpKzYpKSAgPT0gMFxyXG4gICAgcmV0dXJuIGkrMTAgaWYgKG4gJSAoaSsxMCkpID09IDBcclxuICAgIHJldHVybiBpKzEyIGlmIChuICUgKGkrMTIpKSA9PSAwXHJcbiAgICByZXR1cm4gaSsxNiBpZiAobiAlIChpKzE2KSkgPT0gMFxyXG4gICAgcmV0dXJuIGkrMjIgaWYgKG4gJSAoaSsyMikpID09IDBcclxuICAgIHJldHVybiBpKzI0IGlmIChuICUgKGkrMjQpKSA9PSAwXHJcblxyXG4gIHJldHVybiBuXHJcblxyXG5pc1ByaW1lID0gKG4pIC0+XHJcbiAgaWYgaXNOYU4obikgb3Igbm90IGlzRmluaXRlKG4pIG9yIChuICUgMSkgIT0gMCBvciAobiA8IDIpXHJcbiAgICByZXR1cm4gZmFsc2VcclxuICBpZiBuID09IGxlYXN0RmFjdG9yKG4pXHJcbiAgICByZXR1cm4gdHJ1ZVxyXG5cclxuICByZXR1cm4gZmFsc2VcclxuXHJcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbnByaW1lRmFjdG9ycyA9IChuKSAtPlxyXG4gIHJldHVybiBbMV0gaWYgbiA9PSAxXHJcblxyXG4gIGZhY3RvcnMgPSBbXVxyXG4gIHdoaWxlIG5vdCBpc1ByaW1lKG4pXHJcbiAgICBmYWN0b3IgPSBsZWFzdEZhY3RvcihuKVxyXG4gICAgZmFjdG9ycy5wdXNoIGZhY3RvclxyXG4gICAgbiAvPSBmYWN0b3JcclxuICBmYWN0b3JzLnB1c2ggblxyXG4gIHJldHVybiBmYWN0b3JzXHJcblxyXG5sYXJnZXN0UHJpbWVGYWN0b3IgPSAobikgLT5cclxuICByZXR1cm4gMSBpZiBuID09IDFcclxuXHJcbiAgd2hpbGUgbm90IGlzUHJpbWUobilcclxuICAgIGZhY3RvciA9IGxlYXN0RmFjdG9yKG4pXHJcbiAgICBuIC89IGZhY3RvclxyXG4gIHJldHVybiBuXHJcblxyXG5wcm9ibGVtLmFuc3dlciA9IC0+XHJcbiAgcmV0dXJuIGxhcmdlc3RQcmltZUZhY3Rvcig2MDA4NTE0NzUxNDMpXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxyXG5cclxuUHJvYmxlbSA0OiBMYXJnZXN0IHBhbGluZHJvbWUgcHJvZHVjdFxyXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5BIHBhbGluZHJvbWljIG51bWJlciByZWFkcyB0aGUgc2FtZSBib3RoIHdheXMuXHJcblxyXG5GaW5kIHRoZSBsYXJnZXN0IHBhbGluZHJvbWUgbWFkZSBmcm9tIHRoZSBwcm9kdWN0IG9mIHR3byAzLWRpZ2l0IG51bWJlcnMuXHJcblxyXG5cIlwiXCJcclxuXHJcbmlzUGFsaW5kcm9tZSA9IChuKSAtPlxyXG4gIHN0ciA9IG4udG9TdHJpbmcoKVxyXG4gIGZvciBpIGluIFswLi4uKHN0ci5sZW5ndGggLyAyKV1cclxuICAgIGlmIHN0cltpXSAhPSBzdHJbc3RyLmxlbmd0aCAtIDEgLSBpXVxyXG4gICAgICByZXR1cm4gZmFsc2VcclxuICByZXR1cm4gdHJ1ZVxyXG5cclxucHJvYmxlbS50ZXN0ID0gLT5cclxuICAjIE1ha2Ugc3VyZSBpc1BhbGluZHJvbWUgd29ya3MgcHJvcGVybHkgZmlyc3RcclxuICBmb3IgdiBpbiBbMSwgMTEsIDEyMSwgMTIyMSwgMTIzMjEsIDEyMzQzMjFdXHJcbiAgICBlcXVhbChpc1BhbGluZHJvbWUodiksIHRydWUsIFwiaXNQYWxpbmRyb21lKCN7dn0pIHJldHVybnMgdHJ1ZVwiKVxyXG4gIGZvciB2IGluIFsxMiwgMTIzLCAxMjM0LCAxMjM0NSwgMTIzNDU2LCAxMjMyNF1cclxuICAgIGVxdWFsKGlzUGFsaW5kcm9tZSh2KSwgZmFsc2UsIFwiaXNQYWxpbmRyb21lKCN7dn0pIHJldHVybnMgZmFsc2VcIilcclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICBsYXJnZXN0aSA9IDBcclxuICBsYXJnZXN0aiA9IDBcclxuICBsYXJnZXN0cCA9IDBcclxuXHJcbiAgZm9yIGkgaW4gWzEwMC4uOTk5XVxyXG4gICAgZm9yIGogaW4gWzEwMC4uOTk5XVxyXG4gICAgICBwcm9kdWN0ID0gaSAqIGpcclxuICAgICAgaWYgaXNQYWxpbmRyb21lKHByb2R1Y3QpIGFuZCAocHJvZHVjdCA+IGxhcmdlc3RwKVxyXG4gICAgICAgIGxhcmdlc3RpID0gaVxyXG4gICAgICAgIGxhcmdlc3RqID0galxyXG4gICAgICAgIGxhcmdlc3RwID0gcHJvZHVjdFxyXG5cclxuICByZXR1cm4gbGFyZ2VzdHBcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXHJcblxyXG5Qcm9ibGVtIDU6IFNtYWxsZXN0IG11bHRpcGxlXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbjI1MjAgaXMgdGhlIHNtYWxsZXN0IG51bWJlciB0aGF0IGNhbiBiZSBkaXZpZGVkIGJ5IGVhY2ggb2YgdGhlIG51bWJlcnMgZnJvbSAxIHRvIDEwIHdpdGhvdXQgYW55IHJlbWFpbmRlci5cclxuXHJcbldoYXQgaXMgdGhlIHNtYWxsZXN0IHBvc2l0aXZlIG51bWJlciB0aGF0IGlzIGV2ZW5seSBkaXZpc2libGUgYnkgYWxsIG9mIHRoZSBudW1iZXJzIGZyb20gMSB0byAyMD9cclxuXHJcblwiXCJcIlxyXG5cclxucHJvYmxlbS5hbnN3ZXIgPSAtPlxyXG4gIG4gPSAwXHJcbiAgbG9vcFxyXG4gICAgbiArPSAyMCAjIFByb2JhYmx5IGNvdWxkIGJlIHNvbWUgY2xldmVyIHN1bSBvZiBwcmltZXMgYmV0d2VlbiAxLTIwIG9yIHNvbWV0aGluZy4gSSBkb24ndCBjYXJlLlxyXG4gICAgZm91bmQgPSB0cnVlXHJcbiAgICBmb3IgaSBpbiBbMS4uMjBdXHJcbiAgICAgIGlmIChuICUgaSkgIT0gMFxyXG4gICAgICAgIGZvdW5kID0gZmFsc2VcclxuICAgICAgICBicmVha1xyXG5cclxuICAgIGJyZWFrIGlmIGZvdW5kXHJcblxyXG4gIHJldHVybiBuXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxyXG5cclxuUHJvYmxlbSA2OiBTdW0gc3F1YXJlIGRpZmZlcmVuY2VcclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblRoZSBzdW0gb2YgdGhlIHNxdWFyZXMgb2YgdGhlIGZpcnN0IHRlbiBuYXR1cmFsIG51bWJlcnMgaXMsXHJcblxyXG4gICAgICAgICAgICAgMV4yICsgMl4yICsgLi4uICsgMTBeMiA9IDM4NVxyXG5cclxuVGhlIHNxdWFyZSBvZiB0aGUgc3VtIG9mIHRoZSBmaXJzdCB0ZW4gbmF0dXJhbCBudW1iZXJzIGlzLFxyXG5cclxuICAgICAgICAgICgxICsgMiArIC4uLiArIDEwKV4yID0gNTVeMiA9IDMwMjVcclxuXHJcbkhlbmNlIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIHN1bSBvZiB0aGUgc3F1YXJlcyBvZiB0aGUgZmlyc3QgdGVuIG5hdHVyYWwgbnVtYmVycyBhbmQgdGhlIHNxdWFyZSBvZiB0aGUgc3VtIGlzIDMwMjUg4oiSIDM4NSA9IDI2NDAuXHJcblxyXG5GaW5kIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIHN1bSBvZiB0aGUgc3F1YXJlcyBvZiB0aGUgZmlyc3Qgb25lIGh1bmRyZWQgbmF0dXJhbCBudW1iZXJzIGFuZCB0aGUgc3F1YXJlIG9mIHRoZSBzdW0uXHJcblxyXG5cIlwiXCJcclxuXHJcbnN1bU9mU3F1YXJlcyA9IChuKSAtPlxyXG4gIHN1bSA9IDBcclxuICBmb3IgaSBpbiBbMS4ubl1cclxuICAgIHN1bSArPSAoaSAqIGkpXHJcbiAgcmV0dXJuIHN1bVxyXG5cclxuc3F1YXJlT2ZTdW0gPSAobikgLT5cclxuICBzdW0gPSAwXHJcbiAgZm9yIGkgaW4gWzEuLm5dXHJcbiAgICBzdW0gKz0gaVxyXG4gIHJldHVybiAoc3VtICogc3VtKVxyXG5cclxuZGlmZmVyZW5jZVN1bVNxdWFyZXMgPSAobikgLT5cclxuICByZXR1cm4gc3F1YXJlT2ZTdW0obikgLSBzdW1PZlNxdWFyZXMobilcclxuXHJcbnByb2JsZW0udGVzdCA9IC0+XHJcbiAgZXF1YWwoc3VtT2ZTcXVhcmVzKDEwKSwgMzg1LCBcIlN1bSBvZiBzcXVhcmVzIG9mIGZpcnN0IHRlbiBuYXR1cmFsIG51bWJlcnMgaXMgMzg1XCIpXHJcbiAgZXF1YWwoc3F1YXJlT2ZTdW0oMTApLCAzMDI1LCBcIlNxdWFyZSBvZiBzdW0gb2YgZmlyc3QgdGVuIG5hdHVyYWwgbnVtYmVycyBpcyAzMDI1XCIpXHJcbiAgZXF1YWwoZGlmZmVyZW5jZVN1bVNxdWFyZXMoMTApLCAyNjQwLCBcIkRpZmZlcmVuY2UgaW4gdmFsdWVzIGZvciB0aGUgZmlyc3QgdGVuIG5hdHVyYWwgbnVtYmVycyBpcyAyNjQwXCIpXHJcblxyXG5wcm9ibGVtLmFuc3dlciA9IC0+XHJcbiAgcmV0dXJuIGRpZmZlcmVuY2VTdW1TcXVhcmVzKDEwMClcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXHJcblxyXG5Qcm9ibGVtIDc6IDEwMDAxc3QgcHJpbWVcclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5CeSBsaXN0aW5nIHRoZSBmaXJzdCBzaXggcHJpbWUgbnVtYmVyczogMiwgMywgNSwgNywgMTEsIGFuZCAxMywgd2UgY2FuIHNlZSB0aGF0IHRoZSA2dGggcHJpbWUgaXMgMTMuXHJcblxyXG5XaGF0IGlzIHRoZSAxMCwwMDFzdCBwcmltZSBudW1iZXI/XHJcblxyXG5cIlwiXCJcclxuXHJcbm1hdGggPSByZXF1aXJlIFwibWF0aFwiXHJcblxyXG5udGhQcmltZSA9IChuKSAtPlxyXG4gIHNpZXZlID0gbmV3IG1hdGguSW5jcmVtZW50YWxTaWV2ZVxyXG4gIGZvciBpIGluIFsxLi4ubl1cclxuICAgIHNpZXZlLm5leHQoKVxyXG4gIHJldHVybiBzaWV2ZS5uZXh0KClcclxuXHJcbnByb2JsZW0udGVzdCA9IC0+XHJcbiAgZXF1YWwobnRoUHJpbWUoNiksIDEzLCBcIjZ0aCBwcmltZSBpcyAxM1wiKVxyXG5cclxucHJvYmxlbS5hbnN3ZXIgPSAtPlxyXG4gIHJldHVybiBudGhQcmltZSgxMDAwMSlcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXHJcblxyXG5Qcm9ibGVtIDg6IExhcmdlc3QgcHJvZHVjdCBpbiBhIHNlcmllc1xyXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuVGhlIGZvdXIgYWRqYWNlbnQgZGlnaXRzIGluIHRoZSAxMDAwLWRpZ2l0IG51bWJlciB0aGF0IGhhdmUgdGhlIGdyZWF0ZXN0IHByb2R1Y3QgYXJlIDkgeCA5IHggOCB4IDkgPSA1ODMyLlxyXG5cclxuICA3MzE2NzE3NjUzMTMzMDYyNDkxOTIyNTExOTY3NDQyNjU3NDc0MjM1NTM0OTE5NDkzNFxyXG4gIDk2OTgzNTIwMzEyNzc0NTA2MzI2MjM5NTc4MzE4MDE2OTg0ODAxODY5NDc4ODUxODQzXHJcbiAgODU4NjE1NjA3ODkxMTI5NDk0OTU0NTk1MDE3Mzc5NTgzMzE5NTI4NTMyMDg4MDU1MTFcclxuICAxMjU0MDY5ODc0NzE1ODUyMzg2MzA1MDcxNTY5MzI5MDk2MzI5NTIyNzQ0MzA0MzU1N1xyXG4gIDY2ODk2NjQ4OTUwNDQ1MjQ0NTIzMTYxNzMxODU2NDAzMDk4NzExMTIxNzIyMzgzMTEzXHJcbiAgNjIyMjk4OTM0MjMzODAzMDgxMzUzMzYyNzY2MTQyODI4MDY0NDQ0ODY2NDUyMzg3NDlcclxuICAzMDM1ODkwNzI5NjI5MDQ5MTU2MDQ0MDc3MjM5MDcxMzgxMDUxNTg1OTMwNzk2MDg2NlxyXG4gIDcwMTcyNDI3MTIxODgzOTk4Nzk3OTA4NzkyMjc0OTIxOTAxNjk5NzIwODg4MDkzNzc2XHJcbiAgNjU3MjczMzMwMDEwNTMzNjc4ODEyMjAyMzU0MjE4MDk3NTEyNTQ1NDA1OTQ3NTIyNDNcclxuICA1MjU4NDkwNzcxMTY3MDU1NjAxMzYwNDgzOTU4NjQ0NjcwNjMyNDQxNTcyMjE1NTM5N1xyXG4gIDUzNjk3ODE3OTc3ODQ2MTc0MDY0OTU1MTQ5MjkwODYyNTY5MzIxOTc4NDY4NjIyNDgyXHJcbiAgODM5NzIyNDEzNzU2NTcwNTYwNTc0OTAyNjE0MDc5NzI5Njg2NTI0MTQ1MzUxMDA0NzRcclxuICA4MjE2NjM3MDQ4NDQwMzE5OTg5MDAwODg5NTI0MzQ1MDY1ODU0MTIyNzU4ODY2Njg4MVxyXG4gIDE2NDI3MTcxNDc5OTI0NDQyOTI4MjMwODYzNDY1Njc0ODEzOTE5MTIzMTYyODI0NTg2XHJcbiAgMTc4NjY0NTgzNTkxMjQ1NjY1Mjk0NzY1NDU2ODI4NDg5MTI4ODMxNDI2MDc2OTAwNDJcclxuICAyNDIxOTAyMjY3MTA1NTYyNjMyMTExMTEwOTM3MDU0NDIxNzUwNjk0MTY1ODk2MDQwOFxyXG4gIDA3MTk4NDAzODUwOTYyNDU1NDQ0MzYyOTgxMjMwOTg3ODc5OTI3MjQ0Mjg0OTA5MTg4XHJcbiAgODQ1ODAxNTYxNjYwOTc5MTkxMzM4NzU0OTkyMDA1MjQwNjM2ODk5MTI1NjA3MTc2MDZcclxuICAwNTg4NjExNjQ2NzEwOTQwNTA3NzU0MTAwMjI1Njk4MzE1NTIwMDA1NTkzNTcyOTcyNVxyXG4gIDcxNjM2MjY5NTYxODgyNjcwNDI4MjUyNDgzNjAwODIzMjU3NTMwNDIwNzUyOTYzNDUwXHJcblxyXG5GaW5kIHRoZSB0aGlydGVlbiBhZGphY2VudCBkaWdpdHMgaW4gdGhlIDEwMDAtZGlnaXQgbnVtYmVyIHRoYXQgaGF2ZSB0aGUgZ3JlYXRlc3QgcHJvZHVjdC4gV2hhdCBpcyB0aGUgdmFsdWUgb2YgdGhpcyBwcm9kdWN0P1xyXG5cclxuXCJcIlwiXHJcblxyXG5zdHIgPSBcIlwiXCJcclxuICAgICAgNzMxNjcxNzY1MzEzMzA2MjQ5MTkyMjUxMTk2NzQ0MjY1NzQ3NDIzNTUzNDkxOTQ5MzRcclxuICAgICAgOTY5ODM1MjAzMTI3NzQ1MDYzMjYyMzk1NzgzMTgwMTY5ODQ4MDE4Njk0Nzg4NTE4NDNcclxuICAgICAgODU4NjE1NjA3ODkxMTI5NDk0OTU0NTk1MDE3Mzc5NTgzMzE5NTI4NTMyMDg4MDU1MTFcclxuICAgICAgMTI1NDA2OTg3NDcxNTg1MjM4NjMwNTA3MTU2OTMyOTA5NjMyOTUyMjc0NDMwNDM1NTdcclxuICAgICAgNjY4OTY2NDg5NTA0NDUyNDQ1MjMxNjE3MzE4NTY0MDMwOTg3MTExMjE3MjIzODMxMTNcclxuICAgICAgNjIyMjk4OTM0MjMzODAzMDgxMzUzMzYyNzY2MTQyODI4MDY0NDQ0ODY2NDUyMzg3NDlcclxuICAgICAgMzAzNTg5MDcyOTYyOTA0OTE1NjA0NDA3NzIzOTA3MTM4MTA1MTU4NTkzMDc5NjA4NjZcclxuICAgICAgNzAxNzI0MjcxMjE4ODM5OTg3OTc5MDg3OTIyNzQ5MjE5MDE2OTk3MjA4ODgwOTM3NzZcclxuICAgICAgNjU3MjczMzMwMDEwNTMzNjc4ODEyMjAyMzU0MjE4MDk3NTEyNTQ1NDA1OTQ3NTIyNDNcclxuICAgICAgNTI1ODQ5MDc3MTE2NzA1NTYwMTM2MDQ4Mzk1ODY0NDY3MDYzMjQ0MTU3MjIxNTUzOTdcclxuICAgICAgNTM2OTc4MTc5Nzc4NDYxNzQwNjQ5NTUxNDkyOTA4NjI1NjkzMjE5Nzg0Njg2MjI0ODJcclxuICAgICAgODM5NzIyNDEzNzU2NTcwNTYwNTc0OTAyNjE0MDc5NzI5Njg2NTI0MTQ1MzUxMDA0NzRcclxuICAgICAgODIxNjYzNzA0ODQ0MDMxOTk4OTAwMDg4OTUyNDM0NTA2NTg1NDEyMjc1ODg2NjY4ODFcclxuICAgICAgMTY0MjcxNzE0Nzk5MjQ0NDI5MjgyMzA4NjM0NjU2NzQ4MTM5MTkxMjMxNjI4MjQ1ODZcclxuICAgICAgMTc4NjY0NTgzNTkxMjQ1NjY1Mjk0NzY1NDU2ODI4NDg5MTI4ODMxNDI2MDc2OTAwNDJcclxuICAgICAgMjQyMTkwMjI2NzEwNTU2MjYzMjExMTExMDkzNzA1NDQyMTc1MDY5NDE2NTg5NjA0MDhcclxuICAgICAgMDcxOTg0MDM4NTA5NjI0NTU0NDQzNjI5ODEyMzA5ODc4Nzk5MjcyNDQyODQ5MDkxODhcclxuICAgICAgODQ1ODAxNTYxNjYwOTc5MTkxMzM4NzU0OTkyMDA1MjQwNjM2ODk5MTI1NjA3MTc2MDZcclxuICAgICAgMDU4ODYxMTY0NjcxMDk0MDUwNzc1NDEwMDIyNTY5ODMxNTUyMDAwNTU5MzU3Mjk3MjVcclxuICAgICAgNzE2MzYyNjk1NjE4ODI2NzA0MjgyNTI0ODM2MDA4MjMyNTc1MzA0MjA3NTI5NjM0NTBcclxuICAgICAgXCJcIlwiXHJcbnN0ciA9IHN0ci5yZXBsYWNlKC9bXjAtOV0vZ20sIFwiXCIpXHJcbmRpZ2l0cyA9IChwYXJzZUludChkaWdpdCkgZm9yIGRpZ2l0IGluIHN0cilcclxuXHJcbmxhcmdlc3RQcm9kdWN0ID0gKGRpZ2l0Q291bnQpIC0+XHJcbiAgcmV0dXJuIDAgaWYgZGlnaXRDb3VudCA+IGRpZ2l0cy5sZW5ndGhcclxuXHJcbiAgbGFyZ2VzdCA9IDBcclxuICBmb3Igc3RhcnQgaW4gWzAuLihkaWdpdHMubGVuZ3RoIC0gZGlnaXRDb3VudCldXHJcbiAgICBlbmQgPSBzdGFydCArIGRpZ2l0Q291bnRcclxuICAgIHByb2R1Y3QgPSAxXHJcbiAgICBmb3IgaSBpbiBbc3RhcnQuLi5lbmRdXHJcbiAgICAgIHByb2R1Y3QgKj0gZGlnaXRzW2ldXHJcbiAgICBpZiBsYXJnZXN0IDwgcHJvZHVjdFxyXG4gICAgICBsYXJnZXN0ID0gcHJvZHVjdFxyXG5cclxuICByZXR1cm4gbGFyZ2VzdFxyXG5cclxucHJvYmxlbS50ZXN0ID0gLT5cclxuICBlcXVhbChsYXJnZXN0UHJvZHVjdCg0KSwgNTgzMiwgIFwiR3JlYXRlc3QgcHJvZHVjdCBvZiA0IGFkamFjZW50IGRpZ2l0cyBpcyA1ODMyXCIpXHJcbiAgZXF1YWwobGFyZ2VzdFByb2R1Y3QoNSksIDQwODI0LCBcIkdyZWF0ZXN0IHByb2R1Y3Qgb2YgNSBhZGphY2VudCBkaWdpdHMgaXMgNDA4MjRcIilcclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICByZXR1cm4gbGFyZ2VzdFByb2R1Y3QoMTMpXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxyXG5cclxuUHJvYmxlbSA5OiBTcGVjaWFsIFB5dGhhZ29yZWFuIHRyaXBsZXRcclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbkEgUHl0aGFnb3JlYW4gdHJpcGxldCBpcyBhIHNldCBvZiB0aHJlZSBuYXR1cmFsIG51bWJlcnMsIGEgPCBiIDwgYywgZm9yIHdoaWNoLFxyXG5cclxuICAgIGFeMiArIGJeMiA9IGNeMlxyXG5cclxuRm9yIGV4YW1wbGUsIDNeMiArIDReMiA9IDkgKyAxNiA9IDI1ID0gNV4yLlxyXG5cclxuVGhlcmUgZXhpc3RzIGV4YWN0bHkgb25lIFB5dGhhZ29yZWFuIHRyaXBsZXQgZm9yIHdoaWNoIGEgKyBiICsgYyA9IDEwMDAuXHJcblxyXG5GaW5kIHRoZSBwcm9kdWN0IGFiYy5cclxuXHJcblwiXCJcIlxyXG5cclxuaXNUcmlwbGV0ID0gKGEsIGIsIGMpIC0+XHJcbiAgcmV0dXJuICgoYSphKSArIChiKmIpKSA9PSAoYypjKVxyXG5cclxuZmluZEZpcnN0VHJpcGxldCA9IChzdW0pIC0+XHJcbiAgZm9yIGEgaW4gWzEuLi4xMDAwXVxyXG4gICAgZm9yIGIgaW4gWzEuLi4xMDAwXVxyXG4gICAgICBjID0gMTAwMCAtIGEgLSBiXHJcbiAgICAgIGlmIGlzVHJpcGxldChhLCBiLCBjKVxyXG4gICAgICAgIHJldHVybiBbYSwgYiwgY11cclxuXHJcbiAgcmV0dXJuIGZhbHNlXHJcblxyXG5cclxucHJvYmxlbS50ZXN0ID0gLT5cclxuICBlcXVhbChpc1RyaXBsZXQoMywgNCwgNSksIHRydWUsIFwiKDMsNCw1KSBpcyBhIFB5dGhhZ29yZWFuIHRyaXBsZXRcIilcclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICByZXR1cm4gZmluZEZpcnN0VHJpcGxldCgxMDAwKVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcclxuXHJcblByb2JsZW0gMTA6IFN1bW1hdGlvbiBvZiBwcmltZXNcclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuVGhlIHN1bSBvZiB0aGUgcHJpbWVzIGJlbG93IDEwIGlzIDIgKyAzICsgNSArIDcgPSAxNy5cclxuXHJcbkZpbmQgdGhlIHN1bSBvZiBhbGwgdGhlIHByaW1lcyBiZWxvdyB0d28gbWlsbGlvbi5cclxuXHJcblwiXCJcIlxyXG5cclxubWF0aCA9IHJlcXVpcmUgXCJtYXRoXCJcclxuXHJcbnByaW1lU3VtID0gKGNlaWxpbmcpIC0+XHJcbiAgc2lldmUgPSBuZXcgbWF0aC5JbmNyZW1lbnRhbFNpZXZlXHJcblxyXG4gIHN1bSA9IDBcclxuICBsb29wXHJcbiAgICBuID0gc2lldmUubmV4dCgpXHJcbiAgICBpZiBuID49IGNlaWxpbmdcclxuICAgICAgYnJlYWtcclxuICAgIHN1bSArPSBuXHJcblxyXG4gIHJldHVybiBzdW1cclxuXHJcbnByb2JsZW0udGVzdCA9IC0+XHJcbiAgZXF1YWwocHJpbWVTdW0oMTApLCAxNywgXCJTdW0gb2YgcHJpbWVzIGJlbG93IDEwIGlzIDE3XCIpXHJcblxyXG5wcm9ibGVtLmFuc3dlciA9IC0+XHJcbiAgcmV0dXJuIHByaW1lU3VtKDIwMDAwMDApXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxyXG5cclxuUHJvYmxlbSAxMTogTGFyZ2VzdCBwcm9kdWN0IGluIGEgZ3JpZFxyXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5JbiB0aGUgMjB4MjAgZ3JpZCBiZWxvdywgZm91ciBudW1iZXJzIGFsb25nIGEgZGlhZ29uYWwgbGluZSBoYXZlIGJlZW4gbWFya2VkIGluIHJlZC5cclxuXHJcbiAgICAgICAgICAwOCAwMiAyMiA5NyAzOCAxNSAwMCA0MCAwMCA3NSAwNCAwNSAwNyA3OCA1MiAxMiA1MCA3NyA5MSAwOFxyXG4gICAgICAgICAgNDkgNDkgOTkgNDAgMTcgODEgMTggNTcgNjAgODcgMTcgNDAgOTggNDMgNjkgNDggMDQgNTYgNjIgMDBcclxuICAgICAgICAgIDgxIDQ5IDMxIDczIDU1IDc5IDE0IDI5IDkzIDcxIDQwIDY3IDUzIDg4IDMwIDAzIDQ5IDEzIDM2IDY1XHJcbiAgICAgICAgICA1MiA3MCA5NSAyMyAwNCA2MCAxMSA0MiA2OSAyNCA2OCA1NiAwMSAzMiA1NiA3MSAzNyAwMiAzNiA5MVxyXG4gICAgICAgICAgMjIgMzEgMTYgNzEgNTEgNjcgNjMgODkgNDEgOTIgMzYgNTQgMjIgNDAgNDAgMjggNjYgMzMgMTMgODBcclxuICAgICAgICAgIDI0IDQ3IDMyIDYwIDk5IDAzIDQ1IDAyIDQ0IDc1IDMzIDUzIDc4IDM2IDg0IDIwIDM1IDE3IDEyIDUwXHJcbiAgICAgICAgICAzMiA5OCA4MSAyOCA2NCAyMyA2NyAxMCAyNl8zOCA0MCA2NyA1OSA1NCA3MCA2NiAxOCAzOCA2NCA3MFxyXG4gICAgICAgICAgNjcgMjYgMjAgNjggMDIgNjIgMTIgMjAgOTUgNjNfOTQgMzkgNjMgMDggNDAgOTEgNjYgNDkgOTQgMjFcclxuICAgICAgICAgIDI0IDU1IDU4IDA1IDY2IDczIDk5IDI2IDk3IDE3IDc4Xzc4IDk2IDgzIDE0IDg4IDM0IDg5IDYzIDcyXHJcbiAgICAgICAgICAyMSAzNiAyMyAwOSA3NSAwMCA3NiA0NCAyMCA0NSAzNSAxNCAwMCA2MSAzMyA5NyAzNCAzMSAzMyA5NVxyXG4gICAgICAgICAgNzggMTcgNTMgMjggMjIgNzUgMzEgNjcgMTUgOTQgMDMgODAgMDQgNjIgMTYgMTQgMDkgNTMgNTYgOTJcclxuICAgICAgICAgIDE2IDM5IDA1IDQyIDk2IDM1IDMxIDQ3IDU1IDU4IDg4IDI0IDAwIDE3IDU0IDI0IDM2IDI5IDg1IDU3XHJcbiAgICAgICAgICA4NiA1NiAwMCA0OCAzNSA3MSA4OSAwNyAwNSA0NCA0NCAzNyA0NCA2MCAyMSA1OCA1MSA1NCAxNyA1OFxyXG4gICAgICAgICAgMTkgODAgODEgNjggMDUgOTQgNDcgNjkgMjggNzMgOTIgMTMgODYgNTIgMTcgNzcgMDQgODkgNTUgNDBcclxuICAgICAgICAgIDA0IDUyIDA4IDgzIDk3IDM1IDk5IDE2IDA3IDk3IDU3IDMyIDE2IDI2IDI2IDc5IDMzIDI3IDk4IDY2XHJcbiAgICAgICAgICA4OCAzNiA2OCA4NyA1NyA2MiAyMCA3MiAwMyA0NiAzMyA2NyA0NiA1NSAxMiAzMiA2MyA5MyA1MyA2OVxyXG4gICAgICAgICAgMDQgNDIgMTYgNzMgMzggMjUgMzkgMTEgMjQgOTQgNzIgMTggMDggNDYgMjkgMzIgNDAgNjIgNzYgMzZcclxuICAgICAgICAgIDIwIDY5IDM2IDQxIDcyIDMwIDIzIDg4IDM0IDYyIDk5IDY5IDgyIDY3IDU5IDg1IDc0IDA0IDM2IDE2XHJcbiAgICAgICAgICAyMCA3MyAzNSAyOSA3OCAzMSA5MCAwMSA3NCAzMSA0OSA3MSA0OCA4NiA4MSAxNiAyMyA1NyAwNSA1NFxyXG4gICAgICAgICAgMDEgNzAgNTQgNzEgODMgNTEgNTQgNjkgMTYgOTIgMzMgNDggNjEgNDMgNTIgMDEgODkgMTkgNjcgNDhcclxuXHJcblRoZSBwcm9kdWN0IG9mIHRoZXNlIG51bWJlcnMgaXMgMjYgeCA2MyB4IDc4IHggMTQgPSAxNzg4Njk2LlxyXG5cclxuV2hhdCBpcyB0aGUgZ3JlYXRlc3QgcHJvZHVjdCBvZiBmb3VyIGFkamFjZW50IG51bWJlcnMgaW4gdGhlIHNhbWUgZGlyZWN0aW9uICh1cCwgZG93biwgbGVmdCwgcmlnaHQsIG9yIGRpYWdvbmFsbHkpIGluIHRoZSAyMHgyMCBncmlkP1xyXG5cclxuXCJcIlwiXHJcblxyXG5ncmlkID0gbnVsbFxyXG5cclxucHJlcGFyZUdyaWQgPSAtPlxyXG4gIHJhd0RpZ2l0cyA9IFwiXCJcIlxyXG4gICAgMDggMDIgMjIgOTcgMzggMTUgMDAgNDAgMDAgNzUgMDQgMDUgMDcgNzggNTIgMTIgNTAgNzcgOTEgMDhcclxuICAgIDQ5IDQ5IDk5IDQwIDE3IDgxIDE4IDU3IDYwIDg3IDE3IDQwIDk4IDQzIDY5IDQ4IDA0IDU2IDYyIDAwXHJcbiAgICA4MSA0OSAzMSA3MyA1NSA3OSAxNCAyOSA5MyA3MSA0MCA2NyA1MyA4OCAzMCAwMyA0OSAxMyAzNiA2NVxyXG4gICAgNTIgNzAgOTUgMjMgMDQgNjAgMTEgNDIgNjkgMjQgNjggNTYgMDEgMzIgNTYgNzEgMzcgMDIgMzYgOTFcclxuICAgIDIyIDMxIDE2IDcxIDUxIDY3IDYzIDg5IDQxIDkyIDM2IDU0IDIyIDQwIDQwIDI4IDY2IDMzIDEzIDgwXHJcbiAgICAyNCA0NyAzMiA2MCA5OSAwMyA0NSAwMiA0NCA3NSAzMyA1MyA3OCAzNiA4NCAyMCAzNSAxNyAxMiA1MFxyXG4gICAgMzIgOTggODEgMjggNjQgMjMgNjcgMTAgMjYgMzggNDAgNjcgNTkgNTQgNzAgNjYgMTggMzggNjQgNzBcclxuICAgIDY3IDI2IDIwIDY4IDAyIDYyIDEyIDIwIDk1IDYzIDk0IDM5IDYzIDA4IDQwIDkxIDY2IDQ5IDk0IDIxXHJcbiAgICAyNCA1NSA1OCAwNSA2NiA3MyA5OSAyNiA5NyAxNyA3OCA3OCA5NiA4MyAxNCA4OCAzNCA4OSA2MyA3MlxyXG4gICAgMjEgMzYgMjMgMDkgNzUgMDAgNzYgNDQgMjAgNDUgMzUgMTQgMDAgNjEgMzMgOTcgMzQgMzEgMzMgOTVcclxuICAgIDc4IDE3IDUzIDI4IDIyIDc1IDMxIDY3IDE1IDk0IDAzIDgwIDA0IDYyIDE2IDE0IDA5IDUzIDU2IDkyXHJcbiAgICAxNiAzOSAwNSA0MiA5NiAzNSAzMSA0NyA1NSA1OCA4OCAyNCAwMCAxNyA1NCAyNCAzNiAyOSA4NSA1N1xyXG4gICAgODYgNTYgMDAgNDggMzUgNzEgODkgMDcgMDUgNDQgNDQgMzcgNDQgNjAgMjEgNTggNTEgNTQgMTcgNThcclxuICAgIDE5IDgwIDgxIDY4IDA1IDk0IDQ3IDY5IDI4IDczIDkyIDEzIDg2IDUyIDE3IDc3IDA0IDg5IDU1IDQwXHJcbiAgICAwNCA1MiAwOCA4MyA5NyAzNSA5OSAxNiAwNyA5NyA1NyAzMiAxNiAyNiAyNiA3OSAzMyAyNyA5OCA2NlxyXG4gICAgODggMzYgNjggODcgNTcgNjIgMjAgNzIgMDMgNDYgMzMgNjcgNDYgNTUgMTIgMzIgNjMgOTMgNTMgNjlcclxuICAgIDA0IDQyIDE2IDczIDM4IDI1IDM5IDExIDI0IDk0IDcyIDE4IDA4IDQ2IDI5IDMyIDQwIDYyIDc2IDM2XHJcbiAgICAyMCA2OSAzNiA0MSA3MiAzMCAyMyA4OCAzNCA2MiA5OSA2OSA4MiA2NyA1OSA4NSA3NCAwNCAzNiAxNlxyXG4gICAgMjAgNzMgMzUgMjkgNzggMzEgOTAgMDEgNzQgMzEgNDkgNzEgNDggODYgODEgMTYgMjMgNTcgMDUgNTRcclxuICAgIDAxIDcwIDU0IDcxIDgzIDUxIDU0IDY5IDE2IDkyIDMzIDQ4IDYxIDQzIDUyIDAxIDg5IDE5IDY3IDQ4XHJcbiAgXCJcIlwiLnJlcGxhY2UoL1teMC05IF0vZ20sIFwiIFwiKVxyXG5cclxuICBkaWdpdHMgPSAocGFyc2VJbnQoZGlnaXQpIGZvciBkaWdpdCBpbiByYXdEaWdpdHMuc3BsaXQoXCIgXCIpKVxyXG4gIGdyaWQgPSBBcnJheSgyMClcclxuICBmb3IgaSBpbiBbMC4uLjIwXVxyXG4gICAgZ3JpZFtpXSA9IEFycmF5KDIwKVxyXG5cclxuICBpbmRleCA9IDBcclxuICBmb3IgaiBpbiBbMC4uLjIwXVxyXG4gICAgZm9yIGkgaW4gWzAuLi4yMF1cclxuICAgICAgZ3JpZFtpXVtqXSA9IGRpZ2l0c1tpbmRleF1cclxuICAgICAgaW5kZXgrK1xyXG5cclxucHJlcGFyZUdyaWQoKVxyXG5cclxuIyBHZXRzIGEgcHJvZHVjdCBvZiA0IHZhbHVlcyBzdGFydGluZyBhdCAoc3gsIHN5KSwgaGVhZGluZyBpbiB0aGUgZGlyZWN0aW9uIChkeCwgZHkpXHJcbiMgUmV0dXJucyAtMSBpZiB0aGVyZSBpcyBubyByb29tIHRvIG1ha2UgYSBzdHJpcGUgb2YgNC5cclxuZ2V0TGluZVByb2R1Y3QgPSAoc3gsIHN5LCBkeCwgZHkpIC0+XHJcbiAgZXggPSBzeCArICg0ICogZHgpXHJcbiAgcmV0dXJuIC0xIGlmIChleCA8IDApIG9yIChleCA+PSAyMClcclxuICBleSA9IHN5ICsgKDQgKiBkeSlcclxuICByZXR1cm4gLTEgaWYgKGV5IDwgMCkgb3IgKGV5ID49IDIwKVxyXG5cclxuICB4ID0gc3hcclxuICB5ID0gc3lcclxuICBwcm9kdWN0ID0gMVxyXG4gIGZvciBpIGluIFswLi4uNF1cclxuICAgIHByb2R1Y3QgKj0gZ3JpZFt4XVt5XVxyXG4gICAgeCArPSBkeFxyXG4gICAgeSArPSBkeVxyXG5cclxuICByZXR1cm4gcHJvZHVjdFxyXG5cclxuZ2V0TGluZSA9IChzeCwgc3ksIGR4LCBkeSkgLT5cclxuICBleCA9IHN4ICsgKDQgKiBkeClcclxuICByZXR1cm4gW10gaWYgKGV4IDwgMCkgb3IgKGV4ID49IDIwKVxyXG4gIGV5ID0gc3kgKyAoNCAqIGR5KVxyXG4gIHJldHVybiBbXSBpZiAoZXkgPCAwKSBvciAoZXkgPj0gMjApXHJcblxyXG4gIGxpbmUgPSBbXVxyXG5cclxuICB4ID0gc3hcclxuICB5ID0gc3lcclxuICBmb3IgaSBpbiBbMC4uLjRdXHJcbiAgICBsaW5lLnB1c2ggZ3JpZFt4XVt5XVxyXG4gICAgeCArPSBkeFxyXG4gICAgeSArPSBkeVxyXG5cclxuICByZXR1cm4gbGluZVxyXG5cclxucHJvYmxlbS50ZXN0ID0gLT5cclxuICAjIEV4YW1wbGUgaXMgZGlhZ29uYWwgcmlnaHQvZG93biBmcm9tICg4LDYpXHJcbiAgZXF1YWwoZ2V0TGluZVByb2R1Y3QoOCwgNiwgMSwgMSksIDE3ODg2OTYsIFwiRGlhZ29uYWwgdmFsdWUgc2hvd24gaW4gZXhhbXBsZSBlcXVhbHMgMSw3ODgsNjk2XCIpXHJcblxyXG5wcm9ibGVtLmFuc3dlciA9IC0+XHJcbiAgbWF4ID1cclxuICAgIHByb2R1Y3Q6IDFcclxuICAgIGk6IDBcclxuICAgIGo6IDBcclxuICAgIGRpcjogXCJyaWdodFwiXHJcblxyXG4gIGZvciBqIGluIFswLi4uMjBdXHJcbiAgICBmb3IgaSBpbiBbMC4uLjIwXVxyXG4gICAgICBwID0gZ2V0TGluZVByb2R1Y3QoaSwgaiwgMSwgMClcclxuICAgICAgaWYgbWF4LnByb2R1Y3QgPCBwXHJcbiAgICAgICAgbWF4LnByb2R1Y3QgPSBwXHJcbiAgICAgICAgbWF4LmkgPSBpXHJcbiAgICAgICAgbWF4LmogPSBqXHJcbiAgICAgICAgbWF4LmRpciA9IFwicmlnaHRcIlxyXG4gICAgICBwID0gZ2V0TGluZVByb2R1Y3QoaSwgaiwgMCwgMSlcclxuICAgICAgaWYgbWF4LnByb2R1Y3QgPCBwXHJcbiAgICAgICAgbWF4LnByb2R1Y3QgPSBwXHJcbiAgICAgICAgbWF4LmkgPSBpXHJcbiAgICAgICAgbWF4LmogPSBqXHJcbiAgICAgICAgbWF4LmRpciA9IFwiZG93blwiXHJcbiAgICAgIHAgPSBnZXRMaW5lUHJvZHVjdChpLCBqLCAxLCAxKVxyXG4gICAgICBpZiBtYXgucHJvZHVjdCA8IHBcclxuICAgICAgICBtYXgucHJvZHVjdCA9IHBcclxuICAgICAgICBtYXguaSA9IGlcclxuICAgICAgICBtYXguaiA9IGpcclxuICAgICAgICBtYXguZGlyID0gXCJkaWFnb25hbFJcIlxyXG4gICAgICBwID0gZ2V0TGluZVByb2R1Y3QoaSwgaiwgLTEsIDEpXHJcbiAgICAgIGlmIG1heC5wcm9kdWN0IDwgcFxyXG4gICAgICAgIG1heC5wcm9kdWN0ID0gcFxyXG4gICAgICAgIG1heC5pID0gaVxyXG4gICAgICAgIG1heC5qID0galxyXG4gICAgICAgIG1heC5kaXIgPSBcImRpYWdvbmFsTFwiXHJcblxyXG4gIHJldHVybiBtYXhcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXHJcblxyXG5Qcm9ibGVtIDEyOiBIaWdobHkgZGl2aXNpYmxlIHRyaWFuZ3VsYXIgbnVtYmVyXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblRoZSBzZXF1ZW5jZSBvZiB0cmlhbmdsZSBudW1iZXJzIGlzIGdlbmVyYXRlZCBieSBhZGRpbmcgdGhlIG5hdHVyYWwgbnVtYmVycy4gU28gdGhlIDd0aCB0cmlhbmdsZSBudW1iZXIgd291bGQgYmVcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAxICsgMiArIDMgKyA0ICsgNSArIDYgKyA3ID0gMjguXHJcblxyXG5UaGUgZmlyc3QgdGVuIHRlcm1zIHdvdWxkIGJlOlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgIDEsIDMsIDYsIDEwLCAxNSwgMjEsIDI4LCAzNiwgNDUsIDU1LCAuLi5cclxuXHJcbkxldCB1cyBsaXN0IHRoZSBmYWN0b3JzIG9mIHRoZSBmaXJzdCBzZXZlbiB0cmlhbmdsZSBudW1iZXJzOlxyXG5cclxuIDE6IDFcclxuIDM6IDEsM1xyXG4gNjogMSwyLDMsNlxyXG4xMDogMSwyLDUsMTBcclxuMTU6IDEsMyw1LDE1XHJcbjIxOiAxLDMsNywyMVxyXG4yODogMSwyLDQsNywxNCwyOFxyXG5cclxuV2UgY2FuIHNlZSB0aGF0IDI4IGlzIHRoZSBmaXJzdCB0cmlhbmdsZSBudW1iZXIgdG8gaGF2ZSBvdmVyIGZpdmUgZGl2aXNvcnMuXHJcblxyXG5XaGF0IGlzIHRoZSB2YWx1ZSBvZiB0aGUgZmlyc3QgdHJpYW5nbGUgbnVtYmVyIHRvIGhhdmUgb3ZlciBmaXZlIGh1bmRyZWQgZGl2aXNvcnM/XHJcblxyXG5cIlwiXCJcclxuXHJcbm1hdGggPSByZXF1aXJlIFwibWF0aFwiXHJcblxyXG4jIFRoaXMgZnVuY3Rpb24gZG9lcyBpdHMgYmVzdCB0byBsZXZlcmFnZSBSYW1hbnVqYW4ncyBcIlRhdSBmdW5jdGlvblwiLFxyXG4jIHdoaWNoIGlzIHN1cHBvc2VkIHRvIGdpdmUgdGhlIG51bWJlciBvZiBwb3NpdGl2ZSBkaXZpc29ycy5cclxuI1xyXG4jIFRoZSBpZGVhIGlzOlxyXG4jICogRm9yIHByaW1lcywgVChwXmspID0gayArIDFcclxuIyAqIEZvciBhbnkgbnVtYmVycyB3aG9zZSBHQ0QgaXMgMSwgVChtbikgPSBUKG0pICogVChuKVxyXG4jXHJcbiMgSSBhbHJlYWR5IGhhdmUgYSBtZXRob2QgdG8gcHJpbWUgZmFjdG9yIGEgbnVtYmVyLCBzbyBJJ2xsIGxldmVyYWdlXHJcbiMgZXZlcnkgZ3JvdXBpbmcgb2YgdGhlIHNhbWUgcHJpbWUgbnVtYmVyIGFzIHRoZSBmaXJzdCBjYXNlLCBhbmRcclxuIyBtdWx0aXBseSB0aGVtIHRvZ2V0aGVyLlxyXG4jXHJcbiMgRXhhbXBsZTogMjhcclxuI1xyXG4jIDI4J3MgcHJpbWUgZmFjdG9ycyBhcmUgWzIsIDIsIDddLCBvciAoMl4yICsgNylcclxuI1xyXG4jIEkgY2FuIGFzc3VtZSB0aGF0IHRoZSBHQ0QgYmV0d2VlbiBhbnkgb2YgdGhlIHByaW1lIHNldHMgaXMgZ29pbmcgdG8gYmUgMSBiZWNhdXNlIGR1aCxcclxuIyB3aGljaCBtZWFucyB0aGF0OlxyXG4jXHJcbiMgVCgyOCkgPT0gVCgyXjIpICogVCg3KVxyXG4jXHJcbiMgVCgyXjIpID09IDIgKyAxID09IDNcclxuIyBUKDdeMSkgPT0gMSArIDEgPT0gMlxyXG4jIDMgKiAyID0gNlxyXG4jIDI4IGhhcyA2IGRpdmlzb3JzLlxyXG4jXHJcbiMgWW91J3JlIG1hZC5cclxuXHJcbmRpdmlzb3JDb3VudCA9IChuKSAtPlxyXG4gIHJldHVybiAxIGlmIG4gPT0gMVxyXG5cclxuICBmYWN0b3JzID0gbWF0aC5wcmltZUZhY3RvcnMobilcclxuICBjb3VudCA9IDFcclxuICBsYXN0RmFjdG9yID0gMFxyXG4gIGV4cG9uZW50ID0gMVxyXG4gIGZvciBmYWN0b3IgaW4gZmFjdG9yc1xyXG4gICAgaWYgZmFjdG9yID09IGxhc3RGYWN0b3JcclxuICAgICAgZXhwb25lbnQrK1xyXG4gICAgZWxzZVxyXG4gICAgICBpZiBsYXN0RmFjdG9yICE9IDBcclxuICAgICAgICAgIGNvdW50ICo9IGV4cG9uZW50ICsgMVxyXG4gICAgICBsYXN0RmFjdG9yID0gZmFjdG9yXHJcbiAgICAgIGV4cG9uZW50ID0gMVxyXG5cclxuICBpZiBsYXN0RmFjdG9yICE9IDBcclxuICAgICAgY291bnQgKj0gZXhwb25lbnQgKyAxXHJcblxyXG4gIHJldHVybiBjb3VudFxyXG5cclxucHJvYmxlbS50ZXN0ID0gLT5cclxuICBlcXVhbChkaXZpc29yQ291bnQoIDEpLCAxLCBcIiAxIGhhcyAxIGRpdmlzb3JzXCIpXHJcbiAgZXF1YWwoZGl2aXNvckNvdW50KCAzKSwgMiwgXCIgMyBoYXMgMiBkaXZpc29yc1wiKVxyXG4gIGVxdWFsKGRpdmlzb3JDb3VudCggNiksIDQsIFwiIDYgaGFzIDQgZGl2aXNvcnNcIilcclxuICBlcXVhbChkaXZpc29yQ291bnQoMTApLCA0LCBcIjEwIGhhcyA0IGRpdmlzb3JzXCIpXHJcbiAgZXF1YWwoZGl2aXNvckNvdW50KDE1KSwgNCwgXCIxNSBoYXMgNCBkaXZpc29yc1wiKVxyXG4gIGVxdWFsKGRpdmlzb3JDb3VudCgyMSksIDQsIFwiMjEgaGFzIDQgZGl2aXNvcnNcIilcclxuICBlcXVhbChkaXZpc29yQ291bnQoMjgpLCA2LCBcIjI4IGhhcyA2IGRpdmlzb3JzXCIpXHJcblxyXG5wcm9ibGVtLmFuc3dlciA9IC0+XHJcbiAgbiA9IDFcclxuICBzdGVwID0gMlxyXG5cclxuICBsb29wXHJcbiAgICBjb3VudCA9IGRpdmlzb3JDb3VudChuKVxyXG4gICAgaWYgY291bnQgPiA1MDBcclxuICAgICAgcmV0dXJuIHsgbjogbiwgY291bnQ6IGNvdW50IH1cclxuXHJcbiAgICAjIG5leHQgdHJpYW5ndWxhciBudW1iZXJcclxuICAgIG4gKz0gc3RlcFxyXG4gICAgc3RlcCsrXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxyXG5cclxuUHJvYmxlbSAxMzogTGFyZ2Ugc3VtXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuV29yayBvdXQgdGhlIGZpcnN0IHRlbiBkaWdpdHMgb2YgdGhlIHN1bSBvZiB0aGUgZm9sbG93aW5nIG9uZS1odW5kcmVkIDUwLWRpZ2l0IG51bWJlcnMuXHJcblxyXG4zNzEwNzI4NzUzMzkwMjEwMjc5ODc5Nzk5ODIyMDgzNzU5MDI0NjUxMDEzNTc0MDI1MFxyXG40NjM3NjkzNzY3NzQ5MDAwOTcxMjY0ODEyNDg5Njk3MDA3ODA1MDQxNzAxODI2MDUzOFxyXG43NDMyNDk4NjE5OTUyNDc0MTA1OTQ3NDIzMzMwOTUxMzA1ODEyMzcyNjYxNzMwOTYyOVxyXG45MTk0MjIxMzM2MzU3NDE2MTU3MjUyMjQzMDU2MzMwMTgxMTA3MjQwNjE1NDkwODI1MFxyXG4yMzA2NzU4ODIwNzUzOTM0NjE3MTE3MTk4MDMxMDQyMTA0NzUxMzc3ODA2MzI0NjY3NlxyXG44OTI2MTY3MDY5NjYyMzYzMzgyMDEzNjM3ODQxODM4MzY4NDE3ODczNDM2MTcyNjc1N1xyXG4yODExMjg3OTgxMjg0OTk3OTQwODA2NTQ4MTkzMTU5MjYyMTY5MTI3NTg4OTgzMjczOFxyXG40NDI3NDIyODkxNzQzMjUyMDMyMTkyMzU4OTQyMjg3Njc5NjQ4NzY3MDI3MjE4OTMxOFxyXG40NzQ1MTQ0NTczNjAwMTMwNjQzOTA5MTE2NzIxNjg1Njg0NDU4ODcxMTYwMzE1MzI3NlxyXG43MDM4NjQ4NjEwNTg0MzAyNTQzOTkzOTYxOTgyODkxNzU5MzY2NTY4Njc1NzkzNDk1MVxyXG42MjE3NjQ1NzE0MTg1NjU2MDYyOTUwMjE1NzIyMzE5NjU4Njc1NTA3OTMyNDE5MzMzMVxyXG42NDkwNjM1MjQ2Mjc0MTkwNDkyOTEwMTQzMjQ0NTgxMzgyMjY2MzM0Nzk0NDc1ODE3OFxyXG45MjU3NTg2NzcxODMzNzIxNzY2MTk2Mzc1MTU5MDU3OTIzOTcyODI0NTU5ODgzODQwN1xyXG41ODIwMzU2NTMyNTM1OTM5OTAwODQwMjYzMzU2ODk0ODgzMDE4OTQ1ODYyODIyNzgyOFxyXG44MDE4MTE5OTM4NDgyNjI4MjAxNDI3ODE5NDEzOTk0MDU2NzU4NzE1MTE3MDA5NDM5MFxyXG4zNTM5ODY2NDM3MjgyNzExMjY1MzgyOTk4NzI0MDc4NDQ3MzA1MzE5MDEwNDI5MzU4NlxyXG44NjUxNTUwNjAwNjI5NTg2NDg2MTUzMjA3NTI3MzM3MTk1OTE5MTQyMDUxNzI1NTgyOVxyXG43MTY5Mzg4ODcwNzcxNTQ2NjQ5OTExNTU5MzQ4NzYwMzUzMjkyMTcxNDk3MDA1NjkzOFxyXG41NDM3MDA3MDU3NjgyNjY4NDYyNDYyMTQ5NTY1MDA3NjQ3MTc4NzI5NDQzODM3NzYwNFxyXG41MzI4MjY1NDEwODc1NjgyODQ0MzE5MTE5MDYzNDY5NDAzNzg1NTIxNzc3OTI5NTE0NVxyXG4zNjEyMzI3MjUyNTAwMDI5NjA3MTA3NTA4MjU2MzgxNTY1NjcxMDg4NTI1ODM1MDcyMVxyXG40NTg3NjU3NjE3MjQxMDk3NjQ0NzMzOTExMDYwNzIxODI2NTIzNjg3NzIyMzYzNjA0NVxyXG4xNzQyMzcwNjkwNTg1MTg2MDY2MDQ0ODIwNzYyMTIwOTgxMzI4Nzg2MDczMzk2OTQxMlxyXG44MTE0MjY2MDQxODA4NjgzMDYxOTMyODQ2MDgxMTE5MTA2MTU1Njk0MDUxMjY4OTY5MlxyXG41MTkzNDMyNTQ1MTcyODM4ODY0MTkxODA0NzA0OTI5MzIxNTA1ODY0MjU2MzA0OTQ4M1xyXG42MjQ2NzIyMTY0ODQzNTA3NjIwMTcyNzkxODAzOTk0NDY5MzAwNDczMjk1NjM0MDY5MVxyXG4xNTczMjQ0NDM4NjkwODEyNTc5NDUxNDA4OTA1NzcwNjIyOTQyOTE5NzEwNzkyODIwOVxyXG41NTAzNzY4NzUyNTY3ODc3MzA5MTg2MjU0MDc0NDk2OTg0NDUwODMzMDM5MzY4MjEyNlxyXG4xODMzNjM4NDgyNTMzMDE1NDY4NjE5NjEyNDM0ODc2NzY4MTI5NzUzNDM3NTk0NjUxNVxyXG44MDM4NjI4NzU5Mjg3ODQ5MDIwMTUyMTY4NTU1NDgyODcxNzIwMTIxOTI1Nzc2Njk1NFxyXG43ODE4MjgzMzc1Nzk5MzEwMzYxNDc0MDM1Njg1NjQ0OTA5NTUyNzA5Nzg2NDc5NzU4MVxyXG4xNjcyNjMyMDEwMDQzNjg5Nzg0MjU1MzUzOTkyMDkzMTgzNzQ0MTQ5NzgwNjg2MDk4NFxyXG40ODQwMzA5ODEyOTA3Nzc5MTc5OTA4ODIxODc5NTMyNzM2NDQ3NTY3NTU5MDg0ODAzMFxyXG44NzA4Njk4NzU1MTM5MjcxMTg1NDUxNzA3ODU0NDE2MTg1MjQyNDMyMDY5MzE1MDMzMlxyXG41OTk1OTQwNjg5NTc1NjUzNjc4MjEwNzA3NDkyNjk2NjUzNzY3NjMyNjIzNTQ0NzIxMFxyXG42OTc5Mzk1MDY3OTY1MjY5NDc0MjU5NzcwOTczOTE2NjY5Mzc2MzA0MjYzMzk4NzA4NVxyXG40MTA1MjY4NDcwODI5OTA4NTIxMTM5OTQyNzM2NTczNDExNjE4Mjc2MDMxNTAwMTI3MVxyXG42NTM3ODYwNzM2MTUwMTA4MDg1NzAwOTE0OTkzOTUxMjU1NzAyODE5ODc0NjAwNDM3NVxyXG4zNTgyOTAzNTMxNzQzNDcxNzMyNjkzMjEyMzU3ODE1NDk4MjYyOTc0MjU1MjczNzMwN1xyXG45NDk1Mzc1OTc2NTEwNTMwNTk0Njk2NjA2NzY4MzE1NjU3NDM3NzE2NzQwMTg3NTI3NVxyXG44ODkwMjgwMjU3MTczMzIyOTYxOTE3NjY2ODcxMzgxOTkzMTgxMTA0ODc3MDE5MDI3MVxyXG4yNTI2NzY4MDI3NjA3ODAwMzAxMzY3ODY4MDk5MjUyNTQ2MzQwMTA2MTYzMjg2NjUyNlxyXG4zNjI3MDIxODU0MDQ5NzcwNTU4NTYyOTk0NjU4MDYzNjIzNzk5MzE0MDc0NjI1NTk2MlxyXG4yNDA3NDQ4NjkwODIzMTE3NDk3Nzc5MjM2NTQ2NjI1NzI0NjkyMzMyMjgxMDkxNzE0MVxyXG45MTQzMDI4ODE5NzEwMzI4ODU5NzgwNjY2OTc2MDg5MjkzODYzODI4NTAyNTMzMzQwM1xyXG4zNDQxMzA2NTU3ODAxNjEyNzgxNTkyMTgxNTAwNTU2MTg2ODgzNjQ2ODQyMDA5MDQ3MFxyXG4yMzA1MzA4MTE3MjgxNjQzMDQ4NzYyMzc5MTk2OTg0MjQ4NzI1NTAzNjYzODc4NDU4M1xyXG4xMTQ4NzY5NjkzMjE1NDkwMjgxMDQyNDAyMDEzODMzNTEyNDQ2MjE4MTQ0MTc3MzQ3MFxyXG42Mzc4MzI5OTQ5MDYzNjI1OTY2NjQ5ODU4NzYxODIyMTIyNTIyNTUxMjQ4Njc2NDUzM1xyXG42NzcyMDE4Njk3MTY5ODU0NDMxMjQxOTU3MjQwOTkxMzk1OTAwODk1MjMxMDA1ODgyMlxyXG45NTU0ODI1NTMwMDI2MzUyMDc4MTUzMjI5Njc5NjI0OTQ4MTY0MTk1Mzg2ODIxODc3NFxyXG43NjA4NTMyNzEzMjI4NTcyMzExMDQyNDgwMzQ1NjEyNDg2NzY5NzA2NDUwNzk5NTIzNlxyXG4zNzc3NDI0MjUzNTQxMTI5MTY4NDI3Njg2NTUzODkyNjIwNTAyNDkxMDMyNjU3Mjk2N1xyXG4yMzcwMTkxMzI3NTcyNTY3NTI4NTY1MzI0ODI1ODI2NTQ2MzA5MjIwNzA1ODU5NjUyMlxyXG4yOTc5ODg2MDI3MjI1ODMzMTkxMzEyNjM3NTE0NzM0MTk5NDg4OTUzNDc2NTc0NTUwMVxyXG4xODQ5NTcwMTQ1NDg3OTI4ODk4NDg1NjgyNzcyNjA3NzcxMzcyMTQwMzc5ODg3OTcxNVxyXG4zODI5ODIwMzc4MzAzMTQ3MzUyNzcyMTU4MDM0ODE0NDUxMzQ5MTM3MzIyNjY1MTM4MVxyXG4zNDgyOTU0MzgyOTE5OTkxODE4MDI3ODkxNjUyMjQzMTAyNzM5MjI1MTEyMjg2OTUzOVxyXG40MDk1Nzk1MzA2NjQwNTIzMjYzMjUzODA0NDEwMDA1OTY1NDkzOTE1OTg3OTU5MzYzNVxyXG4yOTc0NjE1MjE4NTUwMjM3MTMwNzY0MjI1NTEyMTE4MzY5MzgwMzU4MDM4ODU4NDkwM1xyXG40MTY5ODExNjIyMjA3Mjk3NzE4NjE1ODIzNjY3ODQyNDY4OTE1Nzk5MzUzMjk2MTkyMlxyXG42MjQ2Nzk1NzE5NDQwMTI2OTA0Mzg3NzEwNzI3NTA0ODEwMjM5MDg5NTUyMzU5NzQ1N1xyXG4yMzE4OTcwNjc3MjU0NzkxNTA2MTUwNTUwNDk1MzkyMjk3OTUzMDkwMTEyOTk2NzUxOVxyXG44NjE4ODA4ODIyNTg3NTMxNDUyOTU4NDA5OTI1MTIwMzgyOTAwOTQwNzc3MDc3NTY3MlxyXG4xMTMwNjczOTcwODMwNDcyNDQ4MzgxNjUzMzg3MzUwMjM0MDg0NTY0NzA1ODA3NzMwOFxyXG44Mjk1OTE3NDc2NzE0MDM2MzE5ODAwODE4NzEyOTAxMTg3NTQ5MTMxMDU0NzEyNjU4MVxyXG45NzYyMzMzMTA0NDgxODM4NjI2OTUxNTQ1NjMzNDkyNjM2NjU3Mjg5NzU2MzQwMDUwMFxyXG40Mjg0NjI4MDE4MzUxNzA3MDUyNzgzMTgzOTQyNTg4MjE0NTUyMTIyNzI1MTI1MDMyN1xyXG41NTEyMTYwMzU0Njk4MTIwMDU4MTc2MjE2NTIxMjgyNzY1Mjc1MTY5MTI5Njg5Nzc4OVxyXG4zMjIzODE5NTczNDMyOTMzOTk0NjQzNzUwMTkwNzgzNjk0NTc2NTg4MzM1MjM5OTg4NlxyXG43NTUwNjE2NDk2NTE4NDc3NTE4MDczODE2ODgzNzg2MTA5MTUyNzM1NzkyOTcwMTMzN1xyXG42MjE3Nzg0Mjc1MjE5MjYyMzQwMTk0MjM5OTYzOTE2ODA0NDk4Mzk5MzE3MzMxMjczMVxyXG4zMjkyNDE4NTcwNzE0NzM0OTU2NjkxNjY3NDY4NzYzNDY2MDkxNTAzNTkxNDY3NzUwNFxyXG45OTUxODY3MTQzMDIzNTIxOTYyODg5NDg5MDEwMjQyMzMyNTExNjkxMzYxOTYyNjYyMlxyXG43MzI2NzQ2MDgwMDU5MTU0NzQ3MTgzMDc5ODM5Mjg2ODUzNTIwNjk0Njk0NDU0MDcyNFxyXG43Njg0MTgyMjUyNDY3NDQxNzE2MTUxNDAzNjQyNzk4MjI3MzM0ODA1NTU1NjIxNDgxOFxyXG45NzE0MjYxNzkxMDM0MjU5ODY0NzIwNDUxNjg5Mzk4OTQyMjE3OTgyNjA4ODA3Njg1MlxyXG44Nzc4MzY0NjE4Mjc5OTM0NjMxMzc2Nzc1NDMwNzgwOTM2MzMzMzAxODk4MjY0MjA5MFxyXG4xMDg0ODgwMjUyMTY3NDY3MDg4MzIxNTEyMDE4NTg4MzU0MzIyMzgxMjg3Njk1Mjc4NlxyXG43MTMyOTYxMjQ3NDc4MjQ2NDUzODYzNjk5MzAwOTA0OTMxMDM2MzYxOTc2Mzg3ODAzOVxyXG42MjE4NDA3MzU3MjM5OTc5NDIyMzQwNjIzNTM5MzgwODMzOTY1MTMyNzQwODAxMTExNlxyXG42NjYyNzg5MTk4MTQ4ODA4Nzc5Nzk0MTg3Njg3NjE0NDIzMDAzMDk4NDQ5MDg1MTQxMVxyXG42MDY2MTgyNjI5MzY4MjgzNjc2NDc0NDc3OTIzOTE4MDMzNTExMDk4OTA2OTc5MDcxNFxyXG44NTc4Njk0NDA4OTU1Mjk5MDY1MzY0MDQ0NzQyNTU3NjA4MzY1OTk3NjY0NTc5NTA5NlxyXG42NjAyNDM5NjQwOTkwNTM4OTYwNzEyMDE5ODIxOTk3NjA0NzU5OTQ5MDE5NzIzMDI5N1xyXG42NDkxMzk4MjY4MDAzMjk3MzE1NjAzNzEyMDA0MTM3NzkwMzc4NTU2NjA4NTA4OTI1MlxyXG4xNjczMDkzOTMxOTg3Mjc1MDI3NTQ2ODkwNjkwMzcwNzUzOTQxMzA0MjY1MjMxNTAxMVxyXG45NDgwOTM3NzI0NTA0ODc5NTE1MDk1NDEwMDkyMTY0NTg2Mzc1NDcxMDU5ODQzNjc5MVxyXG43ODYzOTE2NzAyMTE4NzQ5MjQzMTk5NTcwMDY0MTkxNzk2OTc3NzU5OTAyODMwMDY5OVxyXG4xNTM2ODcxMzcxMTkzNjYxNDk1MjgxMTMwNTg3NjM4MDI3ODQxMDc1NDQ0OTczMzA3OFxyXG40MDc4OTkyMzExNTUzNTU2MjU2MTE0MjMyMjQyMzI1NTAzMzY4NTQ0MjQ4ODkxNzM1M1xyXG40NDg4OTkxMTUwMTQ0MDY0ODAyMDM2OTA2ODA2Mzk2MDY3MjMyMjE5MzIwNDE0OTUzNVxyXG40MTUwMzEyODg4MDMzOTUzNjA1MzI5OTM0MDM2ODAwNjk3NzcxMDY1MDU2NjYzMTk1NFxyXG44MTIzNDg4MDY3MzIxMDE0NjczOTA1ODU2ODU1NzkzNDU4MTQwMzYyNzgyMjcwMzI4MFxyXG44MjYxNjU3MDc3Mzk0ODMyNzU5MjIzMjg0NTk0MTcwNjUyNTA5NDUxMjMyNTIzMDYwOFxyXG4yMjkxODgwMjA1ODc3NzMxOTcxOTgzOTQ1MDE4MDg4ODA3MjQyOTY2MTk4MDgxMTE5N1xyXG43NzE1ODU0MjUwMjAxNjU0NTA5MDQxMzI0NTgwOTc4Njg4Mjc3ODk0ODcyMTg1OTYxN1xyXG43MjEwNzgzODQzNTA2OTE4NjE1NTQzNTY2Mjg4NDA2MjI1NzQ3MzY5MjI4NDUwOTUxNlxyXG4yMDg0OTYwMzk4MDEzNDAwMTcyMzkzMDY3MTY2NjgyMzU1NTI0NTI1MjgwNDYwOTcyMlxyXG41MzUwMzUzNDIyNjQ3MjUyNDI1MDg3NDA1NDA3NTU5MTc4OTc4MTI2NDMzMDMzMTY5MFxyXG5cclxuXCJcIlwiXHJcblxyXG5udW1iZXJzID0gW1xyXG4gIDM3MTA3Mjg3NTMzOTAyMTAyNzk4Nzk3OTk4MjIwODM3NTkwMjQ2NTEwMTM1NzQwMjUwXHJcbiAgNDYzNzY5Mzc2Nzc0OTAwMDk3MTI2NDgxMjQ4OTY5NzAwNzgwNTA0MTcwMTgyNjA1MzhcclxuICA3NDMyNDk4NjE5OTUyNDc0MTA1OTQ3NDIzMzMwOTUxMzA1ODEyMzcyNjYxNzMwOTYyOVxyXG4gIDkxOTQyMjEzMzYzNTc0MTYxNTcyNTIyNDMwNTYzMzAxODExMDcyNDA2MTU0OTA4MjUwXHJcbiAgMjMwNjc1ODgyMDc1MzkzNDYxNzExNzE5ODAzMTA0MjEwNDc1MTM3NzgwNjMyNDY2NzZcclxuICA4OTI2MTY3MDY5NjYyMzYzMzgyMDEzNjM3ODQxODM4MzY4NDE3ODczNDM2MTcyNjc1N1xyXG4gIDI4MTEyODc5ODEyODQ5OTc5NDA4MDY1NDgxOTMxNTkyNjIxNjkxMjc1ODg5ODMyNzM4XHJcbiAgNDQyNzQyMjg5MTc0MzI1MjAzMjE5MjM1ODk0MjI4NzY3OTY0ODc2NzAyNzIxODkzMThcclxuICA0NzQ1MTQ0NTczNjAwMTMwNjQzOTA5MTE2NzIxNjg1Njg0NDU4ODcxMTYwMzE1MzI3NlxyXG4gIDcwMzg2NDg2MTA1ODQzMDI1NDM5OTM5NjE5ODI4OTE3NTkzNjY1Njg2NzU3OTM0OTUxXHJcbiAgNjIxNzY0NTcxNDE4NTY1NjA2Mjk1MDIxNTcyMjMxOTY1ODY3NTUwNzkzMjQxOTMzMzFcclxuICA2NDkwNjM1MjQ2Mjc0MTkwNDkyOTEwMTQzMjQ0NTgxMzgyMjY2MzM0Nzk0NDc1ODE3OFxyXG4gIDkyNTc1ODY3NzE4MzM3MjE3NjYxOTYzNzUxNTkwNTc5MjM5NzI4MjQ1NTk4ODM4NDA3XHJcbiAgNTgyMDM1NjUzMjUzNTkzOTkwMDg0MDI2MzM1Njg5NDg4MzAxODk0NTg2MjgyMjc4MjhcclxuICA4MDE4MTE5OTM4NDgyNjI4MjAxNDI3ODE5NDEzOTk0MDU2NzU4NzE1MTE3MDA5NDM5MFxyXG4gIDM1Mzk4NjY0MzcyODI3MTEyNjUzODI5OTg3MjQwNzg0NDczMDUzMTkwMTA0MjkzNTg2XHJcbiAgODY1MTU1MDYwMDYyOTU4NjQ4NjE1MzIwNzUyNzMzNzE5NTkxOTE0MjA1MTcyNTU4MjlcclxuICA3MTY5Mzg4ODcwNzcxNTQ2NjQ5OTExNTU5MzQ4NzYwMzUzMjkyMTcxNDk3MDA1NjkzOFxyXG4gIDU0MzcwMDcwNTc2ODI2Njg0NjI0NjIxNDk1NjUwMDc2NDcxNzg3Mjk0NDM4Mzc3NjA0XHJcbiAgNTMyODI2NTQxMDg3NTY4Mjg0NDMxOTExOTA2MzQ2OTQwMzc4NTUyMTc3NzkyOTUxNDVcclxuICAzNjEyMzI3MjUyNTAwMDI5NjA3MTA3NTA4MjU2MzgxNTY1NjcxMDg4NTI1ODM1MDcyMVxyXG4gIDQ1ODc2NTc2MTcyNDEwOTc2NDQ3MzM5MTEwNjA3MjE4MjY1MjM2ODc3MjIzNjM2MDQ1XHJcbiAgMTc0MjM3MDY5MDU4NTE4NjA2NjA0NDgyMDc2MjEyMDk4MTMyODc4NjA3MzM5Njk0MTJcclxuICA4MTE0MjY2MDQxODA4NjgzMDYxOTMyODQ2MDgxMTE5MTA2MTU1Njk0MDUxMjY4OTY5MlxyXG4gIDUxOTM0MzI1NDUxNzI4Mzg4NjQxOTE4MDQ3MDQ5MjkzMjE1MDU4NjQyNTYzMDQ5NDgzXHJcbiAgNjI0NjcyMjE2NDg0MzUwNzYyMDE3Mjc5MTgwMzk5NDQ2OTMwMDQ3MzI5NTYzNDA2OTFcclxuICAxNTczMjQ0NDM4NjkwODEyNTc5NDUxNDA4OTA1NzcwNjIyOTQyOTE5NzEwNzkyODIwOVxyXG4gIDU1MDM3Njg3NTI1Njc4NzczMDkxODYyNTQwNzQ0OTY5ODQ0NTA4MzMwMzkzNjgyMTI2XHJcbiAgMTgzMzYzODQ4MjUzMzAxNTQ2ODYxOTYxMjQzNDg3Njc2ODEyOTc1MzQzNzU5NDY1MTVcclxuICA4MDM4NjI4NzU5Mjg3ODQ5MDIwMTUyMTY4NTU1NDgyODcxNzIwMTIxOTI1Nzc2Njk1NFxyXG4gIDc4MTgyODMzNzU3OTkzMTAzNjE0NzQwMzU2ODU2NDQ5MDk1NTI3MDk3ODY0Nzk3NTgxXHJcbiAgMTY3MjYzMjAxMDA0MzY4OTc4NDI1NTM1Mzk5MjA5MzE4Mzc0NDE0OTc4MDY4NjA5ODRcclxuICA0ODQwMzA5ODEyOTA3Nzc5MTc5OTA4ODIxODc5NTMyNzM2NDQ3NTY3NTU5MDg0ODAzMFxyXG4gIDg3MDg2OTg3NTUxMzkyNzExODU0NTE3MDc4NTQ0MTYxODUyNDI0MzIwNjkzMTUwMzMyXHJcbiAgNTk5NTk0MDY4OTU3NTY1MzY3ODIxMDcwNzQ5MjY5NjY1Mzc2NzYzMjYyMzU0NDcyMTBcclxuICA2OTc5Mzk1MDY3OTY1MjY5NDc0MjU5NzcwOTczOTE2NjY5Mzc2MzA0MjYzMzk4NzA4NVxyXG4gIDQxMDUyNjg0NzA4Mjk5MDg1MjExMzk5NDI3MzY1NzM0MTE2MTgyNzYwMzE1MDAxMjcxXHJcbiAgNjUzNzg2MDczNjE1MDEwODA4NTcwMDkxNDk5Mzk1MTI1NTcwMjgxOTg3NDYwMDQzNzVcclxuICAzNTgyOTAzNTMxNzQzNDcxNzMyNjkzMjEyMzU3ODE1NDk4MjYyOTc0MjU1MjczNzMwN1xyXG4gIDk0OTUzNzU5NzY1MTA1MzA1OTQ2OTY2MDY3NjgzMTU2NTc0Mzc3MTY3NDAxODc1Mjc1XHJcbiAgODg5MDI4MDI1NzE3MzMyMjk2MTkxNzY2Njg3MTM4MTk5MzE4MTEwNDg3NzAxOTAyNzFcclxuICAyNTI2NzY4MDI3NjA3ODAwMzAxMzY3ODY4MDk5MjUyNTQ2MzQwMTA2MTYzMjg2NjUyNlxyXG4gIDM2MjcwMjE4NTQwNDk3NzA1NTg1NjI5OTQ2NTgwNjM2MjM3OTkzMTQwNzQ2MjU1OTYyXHJcbiAgMjQwNzQ0ODY5MDgyMzExNzQ5Nzc3OTIzNjU0NjYyNTcyNDY5MjMzMjI4MTA5MTcxNDFcclxuICA5MTQzMDI4ODE5NzEwMzI4ODU5NzgwNjY2OTc2MDg5MjkzODYzODI4NTAyNTMzMzQwM1xyXG4gIDM0NDEzMDY1NTc4MDE2MTI3ODE1OTIxODE1MDA1NTYxODY4ODM2NDY4NDIwMDkwNDcwXHJcbiAgMjMwNTMwODExNzI4MTY0MzA0ODc2MjM3OTE5Njk4NDI0ODcyNTUwMzY2Mzg3ODQ1ODNcclxuICAxMTQ4NzY5NjkzMjE1NDkwMjgxMDQyNDAyMDEzODMzNTEyNDQ2MjE4MTQ0MTc3MzQ3MFxyXG4gIDYzNzgzMjk5NDkwNjM2MjU5NjY2NDk4NTg3NjE4MjIxMjI1MjI1NTEyNDg2NzY0NTMzXHJcbiAgNjc3MjAxODY5NzE2OTg1NDQzMTI0MTk1NzI0MDk5MTM5NTkwMDg5NTIzMTAwNTg4MjJcclxuICA5NTU0ODI1NTMwMDI2MzUyMDc4MTUzMjI5Njc5NjI0OTQ4MTY0MTk1Mzg2ODIxODc3NFxyXG4gIDc2MDg1MzI3MTMyMjg1NzIzMTEwNDI0ODAzNDU2MTI0ODY3Njk3MDY0NTA3OTk1MjM2XHJcbiAgMzc3NzQyNDI1MzU0MTEyOTE2ODQyNzY4NjU1Mzg5MjYyMDUwMjQ5MTAzMjY1NzI5NjdcclxuICAyMzcwMTkxMzI3NTcyNTY3NTI4NTY1MzI0ODI1ODI2NTQ2MzA5MjIwNzA1ODU5NjUyMlxyXG4gIDI5Nzk4ODYwMjcyMjU4MzMxOTEzMTI2Mzc1MTQ3MzQxOTk0ODg5NTM0NzY1NzQ1NTAxXHJcbiAgMTg0OTU3MDE0NTQ4NzkyODg5ODQ4NTY4Mjc3MjYwNzc3MTM3MjE0MDM3OTg4Nzk3MTVcclxuICAzODI5ODIwMzc4MzAzMTQ3MzUyNzcyMTU4MDM0ODE0NDUxMzQ5MTM3MzIyNjY1MTM4MVxyXG4gIDM0ODI5NTQzODI5MTk5OTE4MTgwMjc4OTE2NTIyNDMxMDI3MzkyMjUxMTIyODY5NTM5XHJcbiAgNDA5NTc5NTMwNjY0MDUyMzI2MzI1MzgwNDQxMDAwNTk2NTQ5MzkxNTk4Nzk1OTM2MzVcclxuICAyOTc0NjE1MjE4NTUwMjM3MTMwNzY0MjI1NTEyMTE4MzY5MzgwMzU4MDM4ODU4NDkwM1xyXG4gIDQxNjk4MTE2MjIyMDcyOTc3MTg2MTU4MjM2Njc4NDI0Njg5MTU3OTkzNTMyOTYxOTIyXHJcbiAgNjI0Njc5NTcxOTQ0MDEyNjkwNDM4NzcxMDcyNzUwNDgxMDIzOTA4OTU1MjM1OTc0NTdcclxuICAyMzE4OTcwNjc3MjU0NzkxNTA2MTUwNTUwNDk1MzkyMjk3OTUzMDkwMTEyOTk2NzUxOVxyXG4gIDg2MTg4MDg4MjI1ODc1MzE0NTI5NTg0MDk5MjUxMjAzODI5MDA5NDA3NzcwNzc1NjcyXHJcbiAgMTEzMDY3Mzk3MDgzMDQ3MjQ0ODM4MTY1MzM4NzM1MDIzNDA4NDU2NDcwNTgwNzczMDhcclxuICA4Mjk1OTE3NDc2NzE0MDM2MzE5ODAwODE4NzEyOTAxMTg3NTQ5MTMxMDU0NzEyNjU4MVxyXG4gIDk3NjIzMzMxMDQ0ODE4Mzg2MjY5NTE1NDU2MzM0OTI2MzY2NTcyODk3NTYzNDAwNTAwXHJcbiAgNDI4NDYyODAxODM1MTcwNzA1Mjc4MzE4Mzk0MjU4ODIxNDU1MjEyMjcyNTEyNTAzMjdcclxuICA1NTEyMTYwMzU0Njk4MTIwMDU4MTc2MjE2NTIxMjgyNzY1Mjc1MTY5MTI5Njg5Nzc4OVxyXG4gIDMyMjM4MTk1NzM0MzI5MzM5OTQ2NDM3NTAxOTA3ODM2OTQ1NzY1ODgzMzUyMzk5ODg2XHJcbiAgNzU1MDYxNjQ5NjUxODQ3NzUxODA3MzgxNjg4Mzc4NjEwOTE1MjczNTc5Mjk3MDEzMzdcclxuICA2MjE3Nzg0Mjc1MjE5MjYyMzQwMTk0MjM5OTYzOTE2ODA0NDk4Mzk5MzE3MzMxMjczMVxyXG4gIDMyOTI0MTg1NzA3MTQ3MzQ5NTY2OTE2Njc0Njg3NjM0NjYwOTE1MDM1OTE0Njc3NTA0XHJcbiAgOTk1MTg2NzE0MzAyMzUyMTk2Mjg4OTQ4OTAxMDI0MjMzMjUxMTY5MTM2MTk2MjY2MjJcclxuICA3MzI2NzQ2MDgwMDU5MTU0NzQ3MTgzMDc5ODM5Mjg2ODUzNTIwNjk0Njk0NDU0MDcyNFxyXG4gIDc2ODQxODIyNTI0Njc0NDE3MTYxNTE0MDM2NDI3OTgyMjczMzQ4MDU1NTU2MjE0ODE4XHJcbiAgOTcxNDI2MTc5MTAzNDI1OTg2NDcyMDQ1MTY4OTM5ODk0MjIxNzk4MjYwODgwNzY4NTJcclxuICA4Nzc4MzY0NjE4Mjc5OTM0NjMxMzc2Nzc1NDMwNzgwOTM2MzMzMzAxODk4MjY0MjA5MFxyXG4gIDEwODQ4ODAyNTIxNjc0NjcwODgzMjE1MTIwMTg1ODgzNTQzMjIzODEyODc2OTUyNzg2XHJcbiAgNzEzMjk2MTI0NzQ3ODI0NjQ1Mzg2MzY5OTMwMDkwNDkzMTAzNjM2MTk3NjM4NzgwMzlcclxuICA2MjE4NDA3MzU3MjM5OTc5NDIyMzQwNjIzNTM5MzgwODMzOTY1MTMyNzQwODAxMTExNlxyXG4gIDY2NjI3ODkxOTgxNDg4MDg3Nzk3OTQxODc2ODc2MTQ0MjMwMDMwOTg0NDkwODUxNDExXHJcbiAgNjA2NjE4MjYyOTM2ODI4MzY3NjQ3NDQ3NzkyMzkxODAzMzUxMTA5ODkwNjk3OTA3MTRcclxuICA4NTc4Njk0NDA4OTU1Mjk5MDY1MzY0MDQ0NzQyNTU3NjA4MzY1OTk3NjY0NTc5NTA5NlxyXG4gIDY2MDI0Mzk2NDA5OTA1Mzg5NjA3MTIwMTk4MjE5OTc2MDQ3NTk5NDkwMTk3MjMwMjk3XHJcbiAgNjQ5MTM5ODI2ODAwMzI5NzMxNTYwMzcxMjAwNDEzNzc5MDM3ODU1NjYwODUwODkyNTJcclxuICAxNjczMDkzOTMxOTg3Mjc1MDI3NTQ2ODkwNjkwMzcwNzUzOTQxMzA0MjY1MjMxNTAxMVxyXG4gIDk0ODA5Mzc3MjQ1MDQ4Nzk1MTUwOTU0MTAwOTIxNjQ1ODYzNzU0NzEwNTk4NDM2NzkxXHJcbiAgNzg2MzkxNjcwMjExODc0OTI0MzE5OTU3MDA2NDE5MTc5Njk3Nzc1OTkwMjgzMDA2OTlcclxuICAxNTM2ODcxMzcxMTkzNjYxNDk1MjgxMTMwNTg3NjM4MDI3ODQxMDc1NDQ0OTczMzA3OFxyXG4gIDQwNzg5OTIzMTE1NTM1NTYyNTYxMTQyMzIyNDIzMjU1MDMzNjg1NDQyNDg4OTE3MzUzXHJcbiAgNDQ4ODk5MTE1MDE0NDA2NDgwMjAzNjkwNjgwNjM5NjA2NzIzMjIxOTMyMDQxNDk1MzVcclxuICA0MTUwMzEyODg4MDMzOTUzNjA1MzI5OTM0MDM2ODAwNjk3NzcxMDY1MDU2NjYzMTk1NFxyXG4gIDgxMjM0ODgwNjczMjEwMTQ2NzM5MDU4NTY4NTU3OTM0NTgxNDAzNjI3ODIyNzAzMjgwXHJcbiAgODI2MTY1NzA3NzM5NDgzMjc1OTIyMzI4NDU5NDE3MDY1MjUwOTQ1MTIzMjUyMzA2MDhcclxuICAyMjkxODgwMjA1ODc3NzMxOTcxOTgzOTQ1MDE4MDg4ODA3MjQyOTY2MTk4MDgxMTE5N1xyXG4gIDc3MTU4NTQyNTAyMDE2NTQ1MDkwNDEzMjQ1ODA5Nzg2ODgyNzc4OTQ4NzIxODU5NjE3XHJcbiAgNzIxMDc4Mzg0MzUwNjkxODYxNTU0MzU2NjI4ODQwNjIyNTc0NzM2OTIyODQ1MDk1MTZcclxuICAyMDg0OTYwMzk4MDEzNDAwMTcyMzkzMDY3MTY2NjgyMzU1NTI0NTI1MjgwNDYwOTcyMlxyXG4gIDUzNTAzNTM0MjI2NDcyNTI0MjUwODc0MDU0MDc1NTkxNzg5NzgxMjY0MzMwMzMxNjkwXHJcbl1cclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICBzdW0gPSAwXHJcbiAgZm9yIG4gaW4gbnVtYmVyc1xyXG4gICAgc3VtICs9IG5cclxuXHJcbiAgc3RyID0gU3RyaW5nKHN1bSkucmVwbGFjZSgvXFwuL2csIFwiXCIpLnN1YnN0cigwLCAxMClcclxuICByZXR1cm4gc3RyXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxyXG5cclxuUHJvYmxlbSAxNDogTG9uZ2VzdCBDb2xsYXR6IHNlcXVlbmNlXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuVGhlIGZvbGxvd2luZyBpdGVyYXRpdmUgc2VxdWVuY2UgaXMgZGVmaW5lZCBmb3IgdGhlIHNldCBvZiBwb3NpdGl2ZSBpbnRlZ2VyczpcclxuXHJcbiAgICBuIC0+IG4vMiAgICAobiBpcyBldmVuKVxyXG4gICAgbiAtPiAzbiArIDEgKG4gaXMgb2RkKVxyXG5cclxuVXNpbmcgdGhlIHJ1bGUgYWJvdmUgYW5kIHN0YXJ0aW5nIHdpdGggMTMsIHdlIGdlbmVyYXRlIHRoZSBmb2xsb3dpbmcgc2VxdWVuY2U6XHJcblxyXG4gICAgMTMgLT4gNDAgLT4gMjAgLT4gMTAgLT4gNSAtPiAxNiAtPiA4IC0+IDQgLT4gMiAtPiAxXHJcblxyXG5JdCBjYW4gYmUgc2VlbiB0aGF0IHRoaXMgc2VxdWVuY2UgKHN0YXJ0aW5nIGF0IDEzIGFuZCBmaW5pc2hpbmcgYXQgMSkgY29udGFpbnMgMTAgdGVybXMuIEFsdGhvdWdoIGl0IGhhcyBub3QgYmVlbiBwcm92ZWQgeWV0IChDb2xsYXR6IFByb2JsZW0pLCBpdCBpcyB0aG91Z2h0IHRoYXQgYWxsIHN0YXJ0aW5nIG51bWJlcnMgZmluaXNoIGF0IDEuXHJcblxyXG5XaGljaCBzdGFydGluZyBudW1iZXIsIHVuZGVyIG9uZSBtaWxsaW9uLCBwcm9kdWNlcyB0aGUgbG9uZ2VzdCBjaGFpbj9cclxuXHJcbk5PVEU6IE9uY2UgdGhlIGNoYWluIHN0YXJ0cyB0aGUgdGVybXMgYXJlIGFsbG93ZWQgdG8gZ28gYWJvdmUgb25lIG1pbGxpb24uXHJcblxyXG5cIlwiXCJcclxuXHJcbmNvbGxhdHpDYWNoZSA9IHt9XHJcblxyXG5jb2xsYXR6Q2hhaW5MZW5ndGggPSAoc3RhcnRpbmdWYWx1ZSkgLT5cclxuICBuID0gc3RhcnRpbmdWYWx1ZVxyXG4gIHRvQmVDYWNoZWQgPSBbXVxyXG5cclxuICBsb29wXHJcbiAgICBicmVhayBpZiBjb2xsYXR6Q2FjaGUuaGFzT3duUHJvcGVydHkobilcclxuXHJcbiAgICAjIHJlbWVtYmVyIHRoYXQgd2UgZmFpbGVkIHRvIGNhY2hlIHRoaXMgZW50cnlcclxuICAgIHRvQmVDYWNoZWQucHVzaChuKVxyXG5cclxuICAgIGlmIG4gPT0gMVxyXG4gICAgICBicmVha1xyXG5cclxuICAgIGlmIChuICUgMikgPT0gMFxyXG4gICAgICBuID0gTWF0aC5mbG9vcihuIC8gMilcclxuICAgIGVsc2VcclxuICAgICAgbiA9IChuICogMykgKyAxXHJcblxyXG4gICMgU2luY2Ugd2UgbGVmdCBicmVhZGNydW1icyBkb3duIHRoZSB0cmFpbCBvZiB0aGluZ3Mgd2UgaGF2ZW4ndCBjYWNoZWRcclxuICAjIHdhbGsgYmFjayBkb3duIHRoZSB0cmFpbCBhbmQgY2FjaGUgYWxsIHRoZSBlbnRyaWVzIGZvdW5kIGFsb25nIHRoZSB3YXlcclxuICBsZW4gPSB0b0JlQ2FjaGVkLmxlbmd0aFxyXG4gIGZvciB2LGkgaW4gdG9CZUNhY2hlZFxyXG4gICAgY29sbGF0ekNhY2hlW3ZdID0gY29sbGF0ekNhY2hlW25dICsgKGxlbiAtIGkpXHJcblxyXG4gIHJldHVybiBjb2xsYXR6Q2FjaGVbc3RhcnRpbmdWYWx1ZV1cclxuXHJcbnByb2JsZW0udGVzdCA9IC0+XHJcbiAgY29sbGF0ekNhY2hlID0geyBcIjFcIjogMSB9XHJcbiAgZXF1YWwoY29sbGF0ekNoYWluTGVuZ3RoKDEzKSwgMTAsIFwiMTMgaGFzIGEgY29sbGF0eiBjaGFpbiBvZiAxMFwiKVxyXG4gIGVxdWFsKGNvbGxhdHpDaGFpbkxlbmd0aCgyNiksIDExLCBcIjI2IGhhcyBhIGNvbGxhdHogY2hhaW4gb2YgMTFcIilcclxuICBlcXVhbChjb2xsYXR6Q2hhaW5MZW5ndGgoIDEpLCAgMSwgXCIxIGhhcyBhIGNvbGxhdHogY2hhaW4gb2YgMVwiKVxyXG5cclxucHJvYmxlbS5hbnN3ZXIgPSAtPlxyXG4gIGNvbGxhdHpDYWNoZSA9IHsgXCIxXCI6IDEgfVxyXG5cclxuICBtYXhDaGFpbiA9IDBcclxuICBtYXhDaGFpbkxlbmd0aCA9IDBcclxuICBmb3IgaSBpbiBbMS4uLjEwMDAwMDBdXHJcbiAgICBjaGFpbkxlbmd0aCA9IGNvbGxhdHpDaGFpbkxlbmd0aChpKVxyXG4gICAgaWYgbWF4Q2hhaW5MZW5ndGggPCBjaGFpbkxlbmd0aFxyXG4gICAgICBtYXhDaGFpbkxlbmd0aCA9IGNoYWluTGVuZ3RoXHJcbiAgICAgIG1heENoYWluID0gaVxyXG5cclxuICByZXR1cm4geyBhbnN3ZXI6IG1heENoYWluLCBjaGFpbkxlbmd0aDogbWF4Q2hhaW5MZW5ndGggfVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcclxuXHJcblByb2JsZW0gMTU6IExhdHRpY2UgcGF0aHNcclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuU3RhcnRpbmcgaW4gdGhlIHRvcCBsZWZ0IGNvcm5lciBvZiBhIDLDlzIgZ3JpZCwgYW5kIG9ubHkgYmVpbmcgYWJsZSB0byBtb3ZlIHRvIHRoZSByaWdodCBhbmQgZG93biwgdGhlcmUgYXJlIGV4YWN0bHkgNiByb3V0ZXMgdG8gdGhlIGJvdHRvbSByaWdodCBjb3JuZXIuXHJcblxyXG4gICAgKHBpY3R1cmUgc2hvd2luZyA2IHBhdGhzOiBSUkRELCBSRFJELCBSRERSLCBEUlJELCBEUkRSLCBERFJSKVxyXG5cclxuSG93IG1hbnkgc3VjaCByb3V0ZXMgYXJlIHRoZXJlIHRocm91Z2ggYSAyMMOXMjAgZ3JpZD9cclxuXHJcblwiXCJcIlxyXG5cclxubWF0aCA9IHJlcXVpcmUgXCJtYXRoXCJcclxuXHJcbmxhdHRpY2UgPSAobikgLT5cclxuICByZXR1cm4gbWF0aC5uQ3IobiAqIDIsIG4pXHJcblxyXG5wcm9ibGVtLnRlc3QgPSAtPlxyXG4gIGVxdWFsKGxhdHRpY2UoMSksIDIsIFwiMXgxIGxhdHRpY2UgaGFzIDIgcGF0aHNcIilcclxuICBlcXVhbChsYXR0aWNlKDIpLCA2LCBcIjJ4MiBsYXR0aWNlIGhhcyA2IHBhdGhzXCIpXHJcblxyXG5wcm9ibGVtLmFuc3dlciA9IC0+XHJcbiAgcmV0dXJuIGxhdHRpY2UoMjApXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxyXG5cclxuUHJvYmxlbSAxNjogUG93ZXIgZGlnaXQgc3VtXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuMl4xNSA9IDMyNzY4IGFuZCB0aGUgc3VtIG9mIGl0cyBkaWdpdHMgaXMgMyArIDIgKyA3ICsgNiArIDggPSAyNi5cclxuXHJcbldoYXQgaXMgdGhlIHN1bSBvZiB0aGUgZGlnaXRzIG9mIHRoZSBudW1iZXIgMl4xMDAwP1xyXG5cclxuXCJcIlwiXHJcblxyXG5tYXRoID0gcmVxdWlyZSBcIm1hdGhcIlxyXG5iaWdJbnQgPSByZXF1aXJlIFwiYmlnLWludGVnZXJcIlxyXG5cclxuTUFYX0VYUE9ORU5UID0gNTBcclxuXHJcbnBvd2VyRGlnaXRTdW0gPSAoeCwgeSkgLT5cclxuICBudW1iZXIgPSBiaWdJbnQoMSlcclxuICB3aGlsZSB5ICE9IDBcclxuICAgIGV4cG9uZW50ID0geVxyXG4gICAgaWYgZXhwb25lbnQgPiBNQVhfRVhQT05FTlRcclxuICAgICAgZXhwb25lbnQgPSBNQVhfRVhQT05FTlRcclxuICAgIHkgLT0gZXhwb25lbnRcclxuICAgIG51bWJlciA9IG51bWJlci5tdWx0aXBseSBNYXRoLmZsb29yKE1hdGgucG93KHgsIGV4cG9uZW50KSlcclxuICBkaWdpdHMgPSBTdHJpbmcobnVtYmVyKVxyXG5cclxuICBzdW0gPSAwXHJcbiAgZm9yIGQgaW4gZGlnaXRzXHJcbiAgICBzdW0gKz0gcGFyc2VJbnQoZClcclxuICByZXR1cm4gc3VtXHJcblxyXG5wcm9ibGVtLnRlc3QgPSAtPlxyXG4gIGVxdWFsKHBvd2VyRGlnaXRTdW0oMiwgMTUpLCAyNiwgXCJzdW0gb2YgZGlnaXRzIG9mIDJeMTUgaXMgMjZcIilcclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICByZXR1cm4gcG93ZXJEaWdpdFN1bSgyLCAxMDAwKVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcclxuXHJcblByb2JsZW0gMTc6IE51bWJlciBsZXR0ZXIgY291bnRzXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5JZiB0aGUgbnVtYmVycyAxIHRvIDUgYXJlIHdyaXR0ZW4gb3V0IGluIHdvcmRzOiBvbmUsIHR3bywgdGhyZWUsIGZvdXIsIGZpdmUsIHRoZW4gdGhlcmUgYXJlIDMgKyAzICsgNSArIDQgKyA0ID0gMTkgbGV0dGVycyB1c2VkIGluIHRvdGFsLlxyXG5cclxuSWYgYWxsIHRoZSBudW1iZXJzIGZyb20gMSB0byAxMDAwIChvbmUgdGhvdXNhbmQpIGluY2x1c2l2ZSB3ZXJlIHdyaXR0ZW4gb3V0IGluIHdvcmRzLCBob3cgbWFueSBsZXR0ZXJzIHdvdWxkIGJlIHVzZWQ/XHJcblxyXG5OT1RFOiBEbyBub3QgY291bnQgc3BhY2VzIG9yIGh5cGhlbnMuIEZvciBleGFtcGxlLCAzNDIgKHRocmVlIGh1bmRyZWQgYW5kIGZvcnR5LXR3bykgY29udGFpbnMgMjMgbGV0dGVycyBhbmQgMTE1IChvbmUgaHVuZHJlZCBhbmQgZmlmdGVlbikgY29udGFpbnMgMjAgbGV0dGVycy4gVGhlIHVzZSBvZiBcImFuZFwiIHdoZW4gd3JpdGluZyBvdXQgbnVtYmVycyBpcyBpbiBjb21wbGlhbmNlIHdpdGggQnJpdGlzaCB1c2FnZS5cclxuXHJcblwiXCJcIlxyXG5cclxubmFtZXMgPVxyXG4gIG9uZXM6IFwiemVybyBvbmUgdHdvIHRocmVlIGZvdXIgZml2ZSBzaXggc2V2ZW4gZWlnaHQgbmluZSB0ZW4gZWxldmVuIHR3ZWx2ZSB0aGlydGVlbiBmb3VydGVlbiBmaWZ0ZWVuIHNpeHRlZW4gc2V2ZW50ZWVuIGVpZ2h0ZWVuIG5pbmV0ZWVuXCIuc3BsaXQoL1xccysvKVxyXG4gIHRlbnM6IFwiXyBfIHR3ZW50eSB0aGlydHkgZm9ydHkgZmlmdHkgc2l4dHkgc2V2ZW50eSBlaWdodHkgbmluZXR5XCIuc3BsaXQoL1xccysvKVxyXG5cclxuIyBzdXBwb3J0cyAwLTk5OTlcclxubnVtYmVyTGV0dGVyQ291bnQgPSAobnVtKSAtPlxyXG4gIG4gPSBudW1cclxuICBuYW1lID0gXCJcIlxyXG5cclxuICBpZiBuID49IDEwMDBcclxuICAgIHRob3VzYW5kcyA9IE1hdGguZmxvb3IobiAvIDEwMDApXHJcbiAgICBuID0gbiAlIDEwMDBcclxuICAgIG5hbWUgKz0gXCIje25hbWVzLm9uZXNbdGhvdXNhbmRzXX0gdGhvdXNhbmQgXCJcclxuXHJcbiAgaWYgbiA+PSAxMDBcclxuICAgIGh1bmRyZWRzID0gTWF0aC5mbG9vcihuIC8gMTAwKVxyXG4gICAgbiA9IG4gJSAxMDBcclxuICAgIG5hbWUgKz0gXCIje25hbWVzLm9uZXNbaHVuZHJlZHNdfSBodW5kcmVkIFwiXHJcblxyXG4gIGlmIChuID4gMCkgYW5kIChuYW1lLmxlbmd0aCA+IDApXHJcbiAgICBuYW1lICs9IFwiYW5kIFwiXHJcblxyXG4gIGlmIG4gPj0gMjBcclxuICAgIHRlbnMgPSBNYXRoLmZsb29yKG4gLyAxMClcclxuICAgIG4gPSBuICUgMTBcclxuICAgIG5hbWUgKz0gXCIje25hbWVzLnRlbnNbdGVuc119IFwiXHJcblxyXG4gIGlmIG4gPiAwXHJcbiAgICBuYW1lICs9IFwiI3tuYW1lcy5vbmVzW25dfSBcIlxyXG5cclxuICBsZXR0ZXJzT25seSA9IG5hbWUucmVwbGFjZSgvW15hLXpdL2csIFwiXCIpXHJcbiAgIyBjb25zb2xlLmxvZyBcIm51bTogI3tudW19LCBuYW1lOiAje25hbWV9LCBsZXR0ZXJzT25seTogI3tsZXR0ZXJzT25seX1cIlxyXG4gIHJldHVybiBsZXR0ZXJzT25seS5sZW5ndGhcclxuXHJcbm51bWJlckxldHRlckNvdW50UmFuZ2UgPSAoYSwgYikgLT5cclxuICBzdW0gPSAwXHJcbiAgZm9yIGkgaW4gW2EuLmJdXHJcbiAgICBzdW0gKz0gbnVtYmVyTGV0dGVyQ291bnQoaSlcclxuICByZXR1cm4gc3VtXHJcblxyXG5wcm9ibGVtLnRlc3QgPSAtPlxyXG4gIGVxdWFsKG51bWJlckxldHRlckNvdW50UmFuZ2UoMSwgNSksIDE5LCBcInN1bSBvZiBsZW5ndGhzIG9mIG51bWJlcnMgMS01IGlzIDE5XCIpXHJcbiAgZXF1YWwobnVtYmVyTGV0dGVyQ291bnQoMzQyKSwgMjMsIFwibGVuZ3RoIG9mIG5hbWUgb2YgMzQyIGlzIDIzXCIpXHJcbiAgZXF1YWwobnVtYmVyTGV0dGVyQ291bnQoMTE1KSwgMjAsIFwibGVuZ3RoIG9mIG5hbWUgb2YgMTE1IGlzIDIwXCIpXHJcblxyXG5wcm9ibGVtLmFuc3dlciA9IC0+XHJcbiAgcmV0dXJuIG51bWJlckxldHRlckNvdW50UmFuZ2UoMSwgMTAwMClcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXHJcblxyXG5Qcm9ibGVtIDE4OiBNYXhpbXVtIHBhdGggc3VtIElcclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5CeSBzdGFydGluZyBhdCB0aGUgdG9wIG9mIHRoZSB0cmlhbmdsZSBiZWxvdyBhbmQgbW92aW5nIHRvIGFkamFjZW50IG51bWJlcnMgb24gdGhlIHJvdyBiZWxvdywgdGhlIG1heGltdW0gdG90YWwgZnJvbSB0b3AgdG8gYm90dG9tIGlzIDIzLlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgM1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIDcgNFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgMiA0IDZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgOCA1IDkgM1xyXG5cclxuVGhhdCBpcywgMyArIDcgKyA0ICsgOSA9IDIzLlxyXG5cclxuRmluZCB0aGUgbWF4aW11bSB0b3RhbCBmcm9tIHRvcCB0byBib3R0b20gb2YgdGhlIHRyaWFuZ2xlIGJlbG93OlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgNzVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDk1ICA2NFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDE3ICA0NyAgODJcclxuICAgICAgICAgICAgICAgICAgICAgICAgMTggIDM1ICA4NyAgMTBcclxuICAgICAgICAgICAgICAgICAgICAgIDIwICAwNCAgODIgIDQ3ICA2NVxyXG4gICAgICAgICAgICAgICAgICAgIDE5ICAwMSAgMjMgIDc1ICAwMyAgMzRcclxuICAgICAgICAgICAgICAgICAgODggIDAyICA3NyAgNzMgIDA3ICA2MyAgNjdcclxuICAgICAgICAgICAgICAgIDk5ICA2NSAgMDQgIDI4ICAwNiAgMTYgIDcwICA5MlxyXG4gICAgICAgICAgICAgIDQxICA0MSAgMjYgIDU2ICA4MyAgNDAgIDgwICA3MCAgMzNcclxuICAgICAgICAgICAgNDEgIDQ4ICA3MiAgMzMgIDQ3ICAzMiAgMzcgIDE2ICA5NCAgMjlcclxuICAgICAgICAgIDUzICA3MSAgNDQgIDY1ICAyNSAgNDMgIDkxICA1MiAgOTcgIDUxICAxNFxyXG4gICAgICAgIDcwICAxMSAgMzMgIDI4ICA3NyAgNzMgIDE3ICA3OCAgMzkgIDY4ICAxNyAgNTdcclxuICAgICAgOTEgIDcxICA1MiAgMzggIDE3ICAxNCAgOTEgIDQzICA1OCAgNTAgIDI3ICAyOSAgNDhcclxuICAgIDYzICA2NiAgMDQgIDY4ICA4OSAgNTMgIDY3ICAzMCAgNzMgIDE2ICA2OSAgODcgIDQwICAzMVxyXG4gIDA0ICA2MiAgOTggIDI3ICAyMyAgMDkgIDcwICA5OCAgNzMgIDkzICAzOCAgNTMgIDYwICAwNCAgMjNcclxuXHJcbk5PVEU6IEFzIHRoZXJlIGFyZSBvbmx5IDE2Mzg0IHJvdXRlcywgaXQgaXMgcG9zc2libGUgdG8gc29sdmUgdGhpcyBwcm9ibGVtIGJ5IHRyeWluZyBldmVyeSByb3V0ZS4gSG93ZXZlciwgUHJvYmxlbSA2NywgaXMgdGhlIHNhbWUgY2hhbGxlbmdlIHdpdGggYSB0cmlhbmdsZSBjb250YWluaW5nIG9uZS1odW5kcmVkIHJvd3M7IGl0IGNhbm5vdCBiZSBzb2x2ZWQgYnkgYnJ1dGUgZm9yY2UsIGFuZCByZXF1aXJlcyBhIGNsZXZlciBtZXRob2QhIDtvKVxyXG5cclxuXCJcIlwiXHJcblxyXG5tYXRoID0gcmVxdWlyZSBcIm1hdGhcIlxyXG5cclxudGVzdFB5cmFtaWQgPSBcIlwiXCJcclxuICAgICAgM1xyXG4gICAgIDcgNFxyXG4gICAgMiA0IDZcclxuICAgOCA1IDkgM1xyXG5cIlwiXCJcclxuXHJcbm1haW5QeXJhbWlkID0gXCJcIlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDc1XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA5NSAgNjRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAxNyAgNDcgIDgyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDE4ICAzNSAgODcgIDEwXHJcbiAgICAgICAgICAgICAgICAgICAgICAyMCAgMDQgIDgyICA0NyAgNjVcclxuICAgICAgICAgICAgICAgICAgICAxOSAgMDEgIDIzICA3NSAgMDMgIDM0XHJcbiAgICAgICAgICAgICAgICAgIDg4ICAwMiAgNzcgIDczICAwNyAgNjMgIDY3XHJcbiAgICAgICAgICAgICAgICA5OSAgNjUgIDA0ICAyOCAgMDYgIDE2ICA3MCAgOTJcclxuICAgICAgICAgICAgICA0MSAgNDEgIDI2ICA1NiAgODMgIDQwICA4MCAgNzAgIDMzXHJcbiAgICAgICAgICAgIDQxICA0OCAgNzIgIDMzICA0NyAgMzIgIDM3ICAxNiAgOTQgIDI5XHJcbiAgICAgICAgICA1MyAgNzEgIDQ0ICA2NSAgMjUgIDQzICA5MSAgNTIgIDk3ICA1MSAgMTRcclxuICAgICAgICA3MCAgMTEgIDMzICAyOCAgNzcgIDczICAxNyAgNzggIDM5ICA2OCAgMTcgIDU3XHJcbiAgICAgIDkxICA3MSAgNTIgIDM4ICAxNyAgMTQgIDkxICA0MyAgNTggIDUwICAyNyAgMjkgIDQ4XHJcbiAgICA2MyAgNjYgIDA0ICA2OCAgODkgIDUzICA2NyAgMzAgIDczICAxNiAgNjkgIDg3ICA0MCAgMzFcclxuICAwNCAgNjIgIDk4ICAyNyAgMjMgIDA5ICA3MCAgOTggIDczICA5MyAgMzggIDUzICA2MCAgMDQgIDIzXHJcblxyXG5cIlwiXCJcclxuXHJcbnN0cmluZ1RvUHlyYW1pZCA9IChzdHIpIC0+XHJcbiAgZGlnaXRzID0gKHBhcnNlSW50KGQpIGZvciBkIGluIFN0cmluZyhzdHIpLnJlcGxhY2UoL1xcbi9nLCBcIiBcIikuc3BsaXQoL1xccysvKS5maWx0ZXIgKHMpIC0+IHJldHVybiAocy5sZW5ndGggPiAwKSApXHJcbiAgZ3JpZCA9IFtdXHJcbiAgcm93ID0gMFxyXG4gIHdoaWxlIGRpZ2l0cy5sZW5ndGhcclxuICAgIGxlbiA9IHJvdyArIDFcclxuICAgIGEgPSBBcnJheShsZW4pXHJcbiAgICBmb3IgaSBpbiBbMC4uLmxlbl1cclxuICAgICAgYVtpXSA9IGRpZ2l0cy5zaGlmdCgpXHJcbiAgICBncmlkW3Jvd10gPSBhXHJcbiAgICByb3crK1xyXG4gIHJldHVybiBncmlkXHJcblxyXG4jIENydXNoZXMgdGhlIHB5cmFtaWQgZnJvbSBib3R0b20gdXAuIFdoZW4gaXQgaXMgYWxsIGRvbmUgY3J1c2hpbmcsIHRoZSB0b3Agb2YgdGhlIHB5cmFtaWQgaXMgdGhlIGFuc3dlci5cclxubWF4aW11bVBhdGhTdW0gPSAocHlyYW1pZFN0cmluZykgLT5cclxuICBweXJhbWlkID0gc3RyaW5nVG9QeXJhbWlkKHB5cmFtaWRTdHJpbmcpXHJcbiAgc3VtID0gMFxyXG4gIHJvdyA9IHB5cmFtaWQubGVuZ3RoIC0gMlxyXG4gIHdoaWxlIHJvdyA+PSAwXHJcbiAgICBmb3IgaSBpbiBbMC4ucm93XVxyXG4gICAgICBtYXhCZWxvdyA9IE1hdGgubWF4KHB5cmFtaWRbcm93KzFdW2ldLCBweXJhbWlkW3JvdysxXVtpKzFdKVxyXG4gICAgICBweXJhbWlkW3Jvd11baV0gKz0gbWF4QmVsb3dcclxuICAgIHJvdy0tXHJcbiAgcmV0dXJuIHB5cmFtaWRbMF1bMF1cclxuXHJcbnByb2JsZW0udGVzdCA9IC0+XHJcbiAgZXF1YWwobWF4aW11bVBhdGhTdW0odGVzdFB5cmFtaWQpLCAyMywgXCJtYXhpbXVtIHBhdGggc3VtIG9mIHRlc3QgdHJpYW5nbGUgaXMgMjNcIilcclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICBjb25zb2xlLmxvZyB3aW5kb3cuYXJnc1xyXG4gIHJldHVybiBtYXhpbXVtUGF0aFN1bShtYWluUHlyYW1pZClcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXHJcblxyXG5Qcm9ibGVtIDE5OiBDb3VudGluZyBTdW5kYXlzXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbllvdSBhcmUgZ2l2ZW4gdGhlIGZvbGxvd2luZyBpbmZvcm1hdGlvbiwgYnV0IHlvdSBtYXkgcHJlZmVyIHRvIGRvIHNvbWUgcmVzZWFyY2ggZm9yIHlvdXJzZWxmLlxyXG5cclxuKiAxIEphbiAxOTAwIHdhcyBhIE1vbmRheS5cclxuKiBUaGlydHkgZGF5cyBoYXMgU2VwdGVtYmVyLFxyXG4gIEFwcmlsLCBKdW5lIGFuZCBOb3ZlbWJlci5cclxuICBBbGwgdGhlIHJlc3QgaGF2ZSB0aGlydHktb25lLFxyXG4gIFNhdmluZyBGZWJydWFyeSBhbG9uZSxcclxuICBXaGljaCBoYXMgdHdlbnR5LWVpZ2h0LCByYWluIG9yIHNoaW5lLlxyXG4gIEFuZCBvbiBsZWFwIHllYXJzLCB0d2VudHktbmluZS5cclxuKiBBIGxlYXAgeWVhciBvY2N1cnMgb24gYW55IHllYXIgZXZlbmx5IGRpdmlzaWJsZSBieSA0LCBidXQgbm90IG9uIGEgY2VudHVyeSB1bmxlc3MgaXQgaXMgZGl2aXNpYmxlIGJ5IDQwMC5cclxuXHJcbkhvdyBtYW55IFN1bmRheXMgZmVsbCBvbiB0aGUgZmlyc3Qgb2YgdGhlIG1vbnRoIGR1cmluZyB0aGUgdHdlbnRpZXRoIGNlbnR1cnkgKDEgSmFuIDE5MDEgdG8gMzEgRGVjIDIwMDApP1xyXG5cclxuXCJcIlwiXHJcblxyXG5PTkVfREFZX0lOX01TID0gNjAgKiA2MCAqIDI0ICogMTAwMFxyXG5cclxuZGF5TmFtZXMgPSBcIlN1bmRheSBNb25kYXkgVHVlc2RheSBXZWRuZXNkYXkgVGh1cnNkYXkgRnJpZGF5IFNhdHVyZGF5XCIuc3BsaXQoL1xccysvKVxyXG5cclxuZGF5QW5kRGF0ZSA9ICh0aW1lc3RhbXApIC0+XHJcbiAgZCA9IG5ldyBEYXRlKHRpbWVzdGFtcClcclxuICByZXR1cm4gW2QuZ2V0RGF5KCksIGQuZ2V0RGF0ZSgpXVxyXG5cclxuZGF0ZVRvVGltZXN0YW1wID0gKHllYXIsIG1vbnRoLCBkYXkpIC0+XHJcbiAgcmV0dXJuIG5ldyBEYXRlKHllYXIsIG1vbnRoLCBkYXkpLmdldFRpbWUoKVxyXG5cclxucHJvYmxlbS50ZXN0ID0gLT5cclxuICB0cyA9IGRhdGVUb1RpbWVzdGFtcCgxOTAwLCAwLCAxKVxyXG4gIGVxdWFsKGRheUFuZERhdGUodHMpWzBdLCAxLCBcIjE5MDAvMS8xIHdhcyBhIE1vbmRheVwiKVxyXG5cclxuICBmb3IgZGF5IGluIFsyLi42XVxyXG4gICAgdHMgKz0gT05FX0RBWV9JTl9NU1xyXG4gICAgZGQgPSBkYXlBbmREYXRlKHRzKVxyXG4gICAgZXF1YWwoZGRbMF0sIGRheSwgXCJ0aGUgZm9sbG93aW5nIGRheSB3YXMgYSAje2RheU5hbWVzW2RheV19XCIpXHJcbiAgICBlcXVhbChkZFsxXSwgZGF5LCBcIi4uLiBhbmQgdGhlIGRhdGUgd2FzIDEvI3tkZFsxXX1cIilcclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICB0cyA9IGRhdGVUb1RpbWVzdGFtcCgxOTAxLCAwLCAxKVxyXG4gIGVuZHRzID0gZGF0ZVRvVGltZXN0YW1wKDIwMDAsIDExLCAzMSlcclxuXHJcbiAgc3VuZGF5Q291bnQgPSAwXHJcbiAgd2hpbGUgdHMgPCBlbmR0c1xyXG4gICAgZGQgPSBkYXlBbmREYXRlKHRzKVxyXG4gICAgaWYgKGRkWzBdID09IDApIGFuZCAoZGRbMV0gPT0gMSlcclxuICAgICAgc3VuZGF5Q291bnQrK1xyXG4gICAgdHMgKz0gT05FX0RBWV9JTl9NU1xyXG5cclxuICByZXR1cm4gc3VuZGF5Q291bnRcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXHJcblxyXG5Qcm9ibGVtIDIwOiBGYWN0b3JpYWwgZGlnaXQgc3VtXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbm4hIG1lYW5zIG4geCAobiDiiJIgMSkgeCAuLi4geCAzIHggMiB4IDFcclxuXHJcbkZvciBleGFtcGxlLCAxMCEgPSAxMCB4IDkgeCAuLi4geCAzIHggMiB4IDEgPSAzNjI4ODAwLFxyXG5hbmQgdGhlIHN1bSBvZiB0aGUgZGlnaXRzIGluIHRoZSBudW1iZXIgMTAhIGlzIDMgKyA2ICsgMiArIDggKyA4ICsgMCArIDAgPSAyNy5cclxuXHJcbkZpbmQgdGhlIHN1bSBvZiB0aGUgZGlnaXRzIGluIHRoZSBudW1iZXIgMTAwIVxyXG5cclxuXCJcIlwiXHJcblxyXG5iaWdJbnQgPSByZXF1aXJlIFwiYmlnLWludGVnZXJcIlxyXG5cclxuaHVnZUZhY3RvcmlhbCA9IChuKSAtPlxyXG4gIG51bWJlciA9IGJpZ0ludCgxKVxyXG4gIGZvciBpIGluIFsxLi5uXVxyXG4gICAgbnVtYmVyID0gbnVtYmVyLm11bHRpcGx5IGlcclxuICByZXR1cm4gbnVtYmVyXHJcblxyXG5zdW1PZkRpZ2l0cyA9IChuKSAtPlxyXG4gIGRpZ2l0cyA9IFN0cmluZyhuKVxyXG5cclxuICBzdW0gPSAwXHJcbiAgZm9yIGRpZ2l0IGluIGRpZ2l0c1xyXG4gICAgc3VtICs9IHBhcnNlSW50KGRpZ2l0KVxyXG5cclxuICByZXR1cm4gc3VtXHJcblxyXG5wcm9ibGVtLnRlc3QgPSAtPlxyXG4gIGVxdWFsKHN1bU9mRGlnaXRzKGh1Z2VGYWN0b3JpYWwoMTApKSwgMjcsIFwic3VtIG9mIGZhY3RvcmlhbCBkaWdpdHMgb2YgMTAhIGlzIDI3XCIpXHJcblxyXG5wcm9ibGVtLmFuc3dlciA9IC0+XHJcbiAgcmV0dXJuIHN1bU9mRGlnaXRzKGh1Z2VGYWN0b3JpYWwoMTAwKSlcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXHJcblxyXG5Qcm9ibGVtIDIxOiBBbWljYWJsZSBudW1iZXJzXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbkxldCBkKG4pIGJlIGRlZmluZWQgYXMgdGhlIHN1bSBvZiBwcm9wZXIgZGl2aXNvcnMgb2YgbiAobnVtYmVycyBsZXNzIHRoYW4gbiB3aGljaCBkaXZpZGUgZXZlbmx5IGludG8gbikuXHJcbklmIGQoYSkgPSBiIGFuZCBkKGIpID0gYSwgd2hlcmUgYSDiiaAgYiwgdGhlbiBhIGFuZCBiIGFyZSBhbiBhbWljYWJsZSBwYWlyIGFuZCBlYWNoIG9mIGEgYW5kIGIgYXJlIGNhbGxlZCBhbWljYWJsZSBudW1iZXJzLlxyXG5cclxuRm9yIGV4YW1wbGUsIHRoZSBwcm9wZXIgZGl2aXNvcnMgb2YgMjIwIGFyZSAxLCAyLCA0LCA1LCAxMCwgMTEsIDIwLCAyMiwgNDQsIDU1IGFuZCAxMTA7IHRoZXJlZm9yZSBkKDIyMCkgPSAyODQuIFRoZSBwcm9wZXIgZGl2aXNvcnMgb2YgMjg0IGFyZSAxLCAyLCA0LCA3MSBhbmQgMTQyOyBzbyBkKDI4NCkgPSAyMjAuXHJcblxyXG5FdmFsdWF0ZSB0aGUgc3VtIG9mIGFsbCB0aGUgYW1pY2FibGUgbnVtYmVycyB1bmRlciAxMDAwMC5cclxuXHJcblwiXCJcIlxyXG5cclxubWF0aCA9IHJlcXVpcmUgXCJtYXRoXCJcclxuYW1pY2FibGVDYWNoZSA9IG51bGxcclxuXHJcbmFtaWNhYmxlVmFsdWUgPSAobikgLT5cclxuICBpZiBhbWljYWJsZUNhY2hlLmhhc093blByb3BlcnR5KG4pXHJcbiAgICByZXR1cm4gYW1pY2FibGVDYWNoZVtuXVxyXG4gIHN1bSA9IDBcclxuICBmb3IgdiBpbiBtYXRoLmRpdmlzb3JzKG4pXHJcbiAgICBzdW0gKz0gdlxyXG4gIGFtaWNhYmxlQ2FjaGVbbl0gPSBzdW1cclxuICByZXR1cm4gc3VtXHJcblxyXG5wcm9ibGVtLnRlc3QgPSAtPlxyXG4gIGFtaWNhYmxlQ2FjaGUgPSB7fVxyXG4gIGVxdWFsKGFtaWNhYmxlVmFsdWUoMjIwKSwgMjg0LCBcImFtaWNhYmxlKDIyMCkgPT0gMjg0XCIpXHJcbiAgZXF1YWwoYW1pY2FibGVWYWx1ZSgyODQpLCAyMjAsIFwiYW1pY2FibGUoMjg0KSA9PSAyMjBcIilcclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICBhbWljYWJsZUNhY2hlID0ge31cclxuICBhbWljYWJsZVNlZW4gPSB7fVxyXG4gIGZvciBpIGluIFsyLi4uMTAwMDBdXHJcbiAgICBhID0gYW1pY2FibGVWYWx1ZShpKVxyXG4gICAgYiA9IGFtaWNhYmxlVmFsdWUoYSlcclxuICAgIGlmIChhICE9IGIpIGFuZCAoYiA9PSBpKVxyXG4gICAgICBhbWljYWJsZVNlZW5bYV0gPSB0cnVlXHJcbiAgICAgIGFtaWNhYmxlU2VlbltiXSA9IHRydWVcclxuXHJcbiAgYW1pY2FibGVOdW1iZXJzID0gKHBhcnNlSW50KHYpIGZvciB2IGluIE9iamVjdC5rZXlzKGFtaWNhYmxlU2VlbikpXHJcblxyXG4gIHN1bSA9IDBcclxuICBmb3IgdiBpbiBhbWljYWJsZU51bWJlcnNcclxuICAgIHN1bSArPSB2XHJcblxyXG4gIHJldHVybiBzdW1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXHJcblxyXG5Qcm9ibGVtIDIyOiBOYW1lcyBzY29yZXNcclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5Vc2luZyBuYW1lcy50eHQgKHJpZ2h0IGNsaWNrIGFuZCAnU2F2ZSBMaW5rL1RhcmdldCBBcy4uLicpLCBhIDQ2SyB0ZXh0IGZpbGUgY29udGFpbmluZyBvdmVyIGZpdmUtdGhvdXNhbmQgZmlyc3QgbmFtZXMsIGJlZ2luIGJ5IHNvcnRpbmcgaXQgaW50byBhbHBoYWJldGljYWwgb3JkZXIuIFRoZW4gd29ya2luZyBvdXQgdGhlIGFscGhhYmV0aWNhbCB2YWx1ZSBmb3IgZWFjaCBuYW1lLCBtdWx0aXBseSB0aGlzIHZhbHVlIGJ5IGl0cyBhbHBoYWJldGljYWwgcG9zaXRpb24gaW4gdGhlIGxpc3QgdG8gb2J0YWluIGEgbmFtZSBzY29yZS5cclxuXHJcbkZvciBleGFtcGxlLCB3aGVuIHRoZSBsaXN0IGlzIHNvcnRlZCBpbnRvIGFscGhhYmV0aWNhbCBvcmRlciwgQ09MSU4sIHdoaWNoIGlzIHdvcnRoIDMgKyAxNSArIDEyICsgOSArIDE0ID0gNTMsIGlzIHRoZSA5Mzh0aCBuYW1lIGluIHRoZSBsaXN0LiBTbywgQ09MSU4gd291bGQgb2J0YWluIGEgc2NvcmUgb2YgOTM4IMOXIDUzID0gNDk3MTQuXHJcblxyXG5XaGF0IGlzIHRoZSB0b3RhbCBvZiBhbGwgdGhlIG5hbWUgc2NvcmVzIGluIHRoZSBmaWxlP1xyXG5cclxuXCJcIlwiXHJcblxyXG5mcyA9IHJlcXVpcmUgXCJmc1wiXHJcblxyXG5yZWFkTmFtZXMgPSAtPlxyXG4gIHJhd05hbWVzID0gU3RyaW5nKGZzLnJlYWRGaWxlU3luYyhfX2Rpcm5hbWUgKyBcIi8uLi9kYXRhL25hbWVzLnR4dFwiKSlcclxuICBuYW1lcyA9IHJhd05hbWVzLnJlcGxhY2UoL1wiL2dtLCBcIlwiKS5zcGxpdChcIixcIilcclxuICByZXR1cm4gbmFtZXNcclxuXHJcbmFscGhhYmV0aWNhbFZhbHVlID0gKG5hbWUpIC0+XHJcbiAgc3VtID0gMFxyXG4gIGZvciBpIGluIFswLi4ubmFtZS5sZW5ndGhdXHJcbiAgICB2ID0gbmFtZS5jaGFyQ29kZUF0KGkpIC0gNjQgIyBBIGlzIDY1IGluIGFzY2lpLCBzbyB0aGlzIG1ha2VzIHRoZSB2YWx1ZSBvZiAnQScgPT0gMVxyXG4gICAgc3VtICs9IHZcclxuICByZXR1cm4gc3VtXHJcblxyXG5wcm9ibGVtLnRlc3QgPSAtPlxyXG4gIGVxdWFsKGFscGhhYmV0aWNhbFZhbHVlKFwiQ09MSU5cIiksIDUzLCBcImFscGhhYmV0aWNhbCB2YWx1ZSBmb3IgQ09MSU4gaXMgNTNcIilcclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICBuYW1lcyA9IHJlYWROYW1lcygpXHJcbiAgbmFtZXMuc29ydCgpXHJcblxyXG4gIHN1bSA9IDBcclxuICBmb3IgbmFtZSwgaSBpbiBuYW1lc1xyXG4gICAgdiA9IGFscGhhYmV0aWNhbFZhbHVlKG5hbWUpICogKGkgKyAxKVxyXG4gICAgc3VtICs9IHZcclxuICByZXR1cm4gc3VtXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxyXG5cclxuUHJvYmxlbSAyMzogTm9uLWFidW5kYW50IHN1bXNcclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbkEgcGVyZmVjdCBudW1iZXIgaXMgYSBudW1iZXIgZm9yIHdoaWNoIHRoZSBzdW0gb2YgaXRzIHByb3BlciBkaXZpc29ycyBpcyBleGFjdGx5IGVxdWFsIHRvIHRoZSBudW1iZXIuIEZvciBleGFtcGxlLCB0aGUgc3VtIG9mIHRoZSBwcm9wZXIgZGl2aXNvcnMgb2YgMjggd291bGQgYmUgMSArIDIgKyA0ICsgNyArIDE0ID0gMjgsIHdoaWNoIG1lYW5zIHRoYXQgMjggaXMgYSBwZXJmZWN0IG51bWJlci5cclxuXHJcbkEgbnVtYmVyIG4gaXMgY2FsbGVkIGRlZmljaWVudCBpZiB0aGUgc3VtIG9mIGl0cyBwcm9wZXIgZGl2aXNvcnMgaXMgbGVzcyB0aGFuIG4gYW5kIGl0IGlzIGNhbGxlZCBhYnVuZGFudCBpZiB0aGlzIHN1bSBleGNlZWRzIG4uXHJcblxyXG5BcyAxMiBpcyB0aGUgc21hbGxlc3QgYWJ1bmRhbnQgbnVtYmVyLCAxICsgMiArIDMgKyA0ICsgNiA9IDE2LCB0aGUgc21hbGxlc3QgbnVtYmVyIHRoYXQgY2FuIGJlIHdyaXR0ZW4gYXMgdGhlIHN1bSBvZiB0d28gYWJ1bmRhbnQgbnVtYmVycyBpcyAyNC4gQnkgbWF0aGVtYXRpY2FsIGFuYWx5c2lzLCBpdCBjYW4gYmUgc2hvd24gdGhhdCBhbGwgaW50ZWdlcnMgZ3JlYXRlciB0aGFuIDI4MTIzIGNhbiBiZSB3cml0dGVuIGFzIHRoZSBzdW0gb2YgdHdvIGFidW5kYW50IG51bWJlcnMuIEhvd2V2ZXIsIHRoaXMgdXBwZXIgbGltaXQgY2Fubm90IGJlIHJlZHVjZWQgYW55IGZ1cnRoZXIgYnkgYW5hbHlzaXMgZXZlbiB0aG91Z2ggaXQgaXMga25vd24gdGhhdCB0aGUgZ3JlYXRlc3QgbnVtYmVyIHRoYXQgY2Fubm90IGJlIGV4cHJlc3NlZCBhcyB0aGUgc3VtIG9mIHR3byBhYnVuZGFudCBudW1iZXJzIGlzIGxlc3MgdGhhbiB0aGlzIGxpbWl0LlxyXG5cclxuRmluZCB0aGUgc3VtIG9mIGFsbCB0aGUgcG9zaXRpdmUgaW50ZWdlcnMgd2hpY2ggY2Fubm90IGJlIHdyaXR0ZW4gYXMgdGhlIHN1bSBvZiB0d28gYWJ1bmRhbnQgbnVtYmVycy5cclxuXHJcblwiXCJcIlxyXG5cclxubWF0aCA9IHJlcXVpcmUgXCJtYXRoXCJcclxuXHJcbmRpdmlzb3JTdW0gPSAobikgLT5cclxuICByZXR1cm4gbWF0aC5zdW0obWF0aC5kaXZpc29ycyhuKSlcclxuXHJcbmlzQWJ1bmRhbnQgPSAobikgLT5cclxuICByZXR1cm4gKGRpdmlzb3JTdW0obikgPiBuKVxyXG5cclxuaXNQZXJmZWN0ID0gKG4pIC0+XHJcbiAgcmV0dXJuIChkaXZpc29yU3VtKG4pID09IG4pXHJcblxyXG5hYnVuZGFudExpc3QgPSAtPlxyXG4gIGxpc3QgPSBbXVxyXG4gIGZvciBuIGluIFsxLi4yODEyM11cclxuICAgIGlmIGlzQWJ1bmRhbnQobilcclxuICAgICAgbGlzdC5wdXNoIG5cclxuICByZXR1cm4gbGlzdFxyXG5cclxucHJvYmxlbS50ZXN0ID0gLT5cclxuICBlcXVhbChpc1BlcmZlY3QoMjgpLCB0cnVlLCBcIjI4IGlzIGEgcGVyZmVjdCBudW1iZXJcIilcclxuXHJcbnByb2JsZW0uYW5zd2VyID0gLT5cclxuICBsaXN0ID0gYWJ1bmRhbnRMaXN0KClcclxuICBjb25zb2xlLmxvZyBsaXN0XHJcbiAgc3VtT2ZBYnVuZGFudHNTZWVuID0ge31cclxuICBmb3IgaSBpbiBsaXN0XHJcbiAgICBmb3IgaiBpbiBsaXN0XHJcbiAgICAgIHN1bU9mQWJ1bmRhbnRzU2VlblsgaSArIGogXSA9IHRydWVcclxuXHJcbiAgc3VtID0gMFxyXG4gIGZvciBpIGluIFsxLi4yODEyM11cclxuICAgIGlmIG5vdCBzdW1PZkFidW5kYW50c1NlZW5baV1cclxuICAgICAgc3VtICs9IGlcclxuXHJcbiAgcmV0dXJuIHN1bVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcclxuXHJcblByb2JsZW0gMjQ6IExleGljb2dyYXBoaWMgcGVybXV0YXRpb25zXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5BIHBlcm11dGF0aW9uIGlzIGFuIG9yZGVyZWQgYXJyYW5nZW1lbnQgb2Ygb2JqZWN0cy4gRm9yIGV4YW1wbGUsIDMxMjQgaXMgb25lIHBvc3NpYmxlIHBlcm11dGF0aW9uIG9mIHRoZSBkaWdpdHMgMSwgMiwgMyBhbmQgNC4gSWYgYWxsIG9mIHRoZSBwZXJtdXRhdGlvbnMgYXJlIGxpc3RlZCBudW1lcmljYWxseSBvciBhbHBoYWJldGljYWxseSwgd2UgY2FsbCBpdCBsZXhpY29ncmFwaGljIG9yZGVyLiBUaGUgbGV4aWNvZ3JhcGhpYyBwZXJtdXRhdGlvbnMgb2YgMCwgMSBhbmQgMiBhcmU6XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgMDEyICAgMDIxICAgMTAyICAgMTIwICAgMjAxICAgMjEwXHJcblxyXG5XaGF0IGlzIHRoZSBtaWxsaW9udGggbGV4aWNvZ3JhcGhpYyBwZXJtdXRhdGlvbiBvZiB0aGUgZGlnaXRzIDAsIDEsIDIsIDMsIDQsIDUsIDYsIDcsIDggYW5kIDk/XHJcblxyXG5cIlwiXCJcclxuXHJcbiMgVGhpcyBmdW5jdGlvbiBpcyAtd2F5LSB0b28gc2xvd1xyXG5wZXJtdXRlID0gKGN1cnJlbnQsIHNyYywgZHN0KSAtPlxyXG4gIGZvciB2LGkgaW4gc3JjXHJcbiAgICBuZXdjdXJyZW50ID0gY3VycmVudCArIHZcclxuICAgIGlmIHNyYy5sZW5ndGggPiAxXHJcbiAgICAgIGxlZnRvdmVycyA9IHNyYy5zbGljZSgwKVxyXG4gICAgICBsZWZ0b3ZlcnMuc3BsaWNlKGksIDEpXHJcbiAgICAgIHBlcm11dGUgbmV3Y3VycmVudCwgbGVmdG92ZXJzLCBkc3RcclxuICAgIGVsc2VcclxuICAgICAgZHN0LnB1c2ggbmV3Y3VycmVudFxyXG5cclxubGV4UGVybXV0ZVNsb3cgPSAoY2hhcnMpIC0+XHJcbiAgZHN0ID0gW11cclxuICBwZXJtdXRlKFwiXCIsIGNoYXJzLnNwbGl0KFwiXCIpLCBkc3QpXHJcbiAgZHN0LnNvcnQoKVxyXG4gIHJldHVybiBkc3RcclxuXHJcbnN3YXAgPSAoYXJyLCBhLCBiKSAtPlxyXG4gIHQgPSBhcnJbYV1cclxuICBhcnJbYV0gPSBhcnJbYl1cclxuICBhcnJbYl0gPSB0XHJcblxyXG4jIERvbid0IGFzayBtZSwgYXNrIERpamtzdHJhJ3MgQSBEaXNjaXBsaW5lIG9mIFByb2dyYW1taW5nLCBwYWdlIDcxXHJcbmRpamtzdHJhUGVybXV0ZU5leHQgPSAoYXJyKSAtPlxyXG4gIGkgPSBhcnIubGVuZ3RoIC0gMVxyXG4gIHdoaWxlIGFycltpLTFdID49IGFycltpXVxyXG4gICAgaS0tXHJcblxyXG4gIGogPSBhcnIubGVuZ3RoXHJcbiAgd2hpbGUgYXJyW2otMV0gPD0gYXJyW2ktMV1cclxuICAgIGotLVxyXG5cclxuICBzd2FwIGFyciwgaS0xLCBqLTFcclxuXHJcbiAgaSsrXHJcbiAgaiA9IGFyci5sZW5ndGhcclxuICB3aGlsZSBpIDwgalxyXG4gICAgc3dhcCBhcnIsIGktMSwgai0xXHJcbiAgICBpKytcclxuICAgIGotLVxyXG5cclxubGV4UGVybXV0ZUZhc3QgPSAoY2hhcnMsIHdoaWNoKSAtPlxyXG4gIGFyciA9IChwYXJzZUludCh2KSBmb3IgdiBpbiBjaGFycylcclxuICBmb3IgaSBpbiBbMS4uLndoaWNoXVxyXG4gICAgZGlqa3N0cmFQZXJtdXRlTmV4dChhcnIpXHJcbiAgcmV0dXJuIGFyci5qb2luKFwiXCIpXHJcblxyXG5wcm9ibGVtLnRlc3QgPSAtPlxyXG4gIGVxdWFsKGxleFBlcm11dGVGYXN0KFwiMDEyXCIsIDQpLCBcIjEyMFwiLCBcIjR0aCBwZXJtdXRhdGlvbiBvZiAwMTIgaXMgMTIwLCBmYXN0IHZlcnNpb25cIilcclxuICBlcXVhbChsZXhQZXJtdXRlU2xvdyhcIjAxMlwiKSwgXCIwMTIgMDIxIDEwMiAxMjAgMjAxIDIxMFwiLnNwbGl0KFwiIFwiKSwgXCJwZXJtdXRhdGlvbiBvZiAwMTIgaXMgMDEyIDAyMSAxMDIgMTIwIDIwMSAyMTAsIHNsb3cgdmVyc2lvblwiKVxyXG5cclxucHJvYmxlbS5hbnN3ZXIgPSAtPlxyXG4gIHJldHVybiBsZXhQZXJtdXRlRmFzdChcIjAxMjM0NTY3ODlcIiwgMTAwMDAwMClcclxuXHJcbiAgIyBzbG93IHZlcnNpb24sIHRvb2sgfjEzIHNlY29uZHMgb24gYSAyMDE0IE1hY2Jvb2sgUHJvXHJcbiAgIyBkc3QgPSBsZXhQZXJtdXRlU2xvdyhcIjAxMjM0NTY3ODlcIilcclxuICAjIHJldHVybiBkc3RbOTk5OTk5XSAjIFswXSBpcyBmaXJzdCwgdGhlcmVmb3JlIFs5OTk5OTldIGlzIDEsMDAwLDAwMHRoXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxyXG5cclxuUHJvYmxlbSAyNTogMTAwMC1kaWdpdCBGaWJvbmFjY2kgbnVtYmVyXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuVGhlIEZpYm9uYWNjaSBzZXF1ZW5jZSBpcyBkZWZpbmVkIGJ5IHRoZSByZWN1cnJlbmNlIHJlbGF0aW9uOlxyXG5cclxuRihuKSA9IEYobuKIkjEpICsgRihu4oiSMiksIHdoZXJlIEYoMSkgPSAxIGFuZCBGKDIpID0gMS5cclxuSGVuY2UgdGhlIGZpcnN0IDEyIHRlcm1zIHdpbGwgYmU6XHJcblxyXG5GKDEpICA9IDFcclxuRigyKSAgPSAxXHJcbkYoMykgID0gMlxyXG5GKDQpICA9IDNcclxuRig1KSAgPSA1XHJcbkYoNikgID0gOFxyXG5GKDcpICA9IDEzXHJcbkYoOCkgID0gMjFcclxuRig5KSAgPSAzNFxyXG5GKDEwKSA9IDU1XHJcbkYoMTEpID0gODlcclxuRigxMikgPSAxNDRcclxuVGhlIDEydGggdGVybSwgRigxMiksIGlzIHRoZSBmaXJzdCB0ZXJtIHRvIGNvbnRhaW4gdGhyZWUgZGlnaXRzLlxyXG5cclxuV2hhdCBpcyB0aGUgZmlyc3QgdGVybSBpbiB0aGUgRmlib25hY2NpIHNlcXVlbmNlIHRvIGNvbnRhaW4gMTAwMCBkaWdpdHM/XHJcblxyXG5cIlwiXCJcclxuXHJcbmJpZ0ludCA9IHJlcXVpcmUgXCJiaWctaW50ZWdlclwiXHJcblxyXG5maXJzdEZpYm9XaXRoRGlnaXRDb3VudCA9IChuKSAtPlxyXG4gIGluZGV4ID0gMVxyXG4gIHByZXYgPSBuZXcgYmlnSW50KDApXHJcbiAgY3VyciA9IG5ldyBiaWdJbnQoMSlcclxuICBsb29wXHJcbiAgICBzdHIgPSBTdHJpbmcoY3VycilcclxuICAgIGRpZ2l0Q291bnQgPSBzdHIubGVuZ3RoXHJcbiAgICBpZiBkaWdpdENvdW50ID49IG5cclxuICAgICAgcmV0dXJuIFtpbmRleCwgc3RyXVxyXG4gICAgbmV4dCA9IGN1cnIucGx1cyhwcmV2KVxyXG4gICAgcHJldiA9IGN1cnJcclxuICAgIGN1cnIgPSBuZXh0XHJcbiAgICBpbmRleCsrXHJcblxyXG5wcm9ibGVtLnRlc3QgPSAtPlxyXG4gIGVxdWFsKGZpcnN0Rmlib1dpdGhEaWdpdENvdW50KDMpLCBbMTIsIFwiMTQ0XCJdLCBcImZpcnN0IGZpYm9uYWNjaSB3aXRoIDMgZGlnaXRzIGlzIEYoMTIpID0gMTQ0XCIpXHJcblxyXG5wcm9ibGVtLmFuc3dlciA9IC0+XHJcbiAgcmV0dXJuIGZpcnN0Rmlib1dpdGhEaWdpdENvdW50KDEwMDApXHJcbiIsInJvb3QgPSBleHBvcnRzID8gdGhpc1xyXG5cclxuIyBTaWV2ZSB3YXMgYmxpbmRseSB0YWtlbi9hZGFwdGVkIGZyb20gUm9zZXR0YUNvZGUuIERPTlQgRVZFTiBDQVJFXHJcbmNsYXNzIEluY3JlbWVudGFsU2lldmVcclxuICBjb25zdHJ1Y3RvcjogLT5cclxuICAgIEBuID0gMFxyXG5cclxuICBuZXh0OiAtPlxyXG4gICAgQG4gKz0gMlxyXG4gICAgaWYgQG4gPCA3XHJcbiAgICAgIGlmIEBuIDwgM1xyXG4gICAgICAgIEBuID0gMVxyXG4gICAgICAgIHJldHVybiAyXHJcbiAgICAgIGlmIEBuIDwgNVxyXG4gICAgICAgIHJldHVybiAzXHJcbiAgICAgIEBkaWN0ID0ge31cclxuICAgICAgQGJwcyA9IG5ldyBJbmNyZW1lbnRhbFNpZXZlKClcclxuICAgICAgQGJwcy5uZXh0KClcclxuICAgICAgQHAgPSBAYnBzLm5leHQoKVxyXG4gICAgICBAcSA9IEBwICogQHBcclxuICAgICAgcmV0dXJuIDVcclxuICAgIGVsc2VcclxuICAgICAgcyA9IEBkaWN0W0BuXVxyXG4gICAgICBpZiBub3Qgc1xyXG4gICAgICAgIGlmIEBuIDwgQHFcclxuICAgICAgICAgIHJldHVybiBAblxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIHAyID0gQHAgPDwgMVxyXG4gICAgICAgICAgQGRpY3RbQG4gKyBwMl0gPSBwMlxyXG4gICAgICAgICAgQHAgPSBAYnBzLm5leHQoKVxyXG4gICAgICAgICAgQHEgPSBAcCAqIEBwXHJcbiAgICAgICAgICByZXR1cm4gQG5leHQoKVxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgZGVsZXRlIEBkaWN0W0BuXVxyXG4gICAgICAgIG54dCA9IEBuICsgc1xyXG4gICAgICAgIHdoaWxlIChAZGljdFtueHRdKVxyXG4gICAgICAgICAgbnh0ICs9IHNcclxuICAgICAgICBAZGljdFtueHRdID0gc1xyXG4gICAgICAgIHJldHVybiBAbmV4dCgpXHJcblxyXG5yb290LkluY3JlbWVudGFsU2lldmUgPSBJbmNyZW1lbnRhbFNpZXZlXHJcblxyXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiMgU2hhbWVsZXNzbHkgcGlsZmVyZWQvYWRvcHRlZCBmcm9tIGh0dHA6Ly93d3cuamF2YXNjcmlwdGVyLm5ldC9mYXEvbnVtYmVyaXNwcmltZS5odG1cclxuXHJcbnJvb3QubGVhc3RGYWN0b3IgPSAobikgLT5cclxuICByZXR1cm4gTmFOIGlmIGlzTmFOKG4pIG9yIG5vdCBpc0Zpbml0ZShuKVxyXG4gIHJldHVybiAwIGlmIG4gPT0gMFxyXG4gIHJldHVybiAxIGlmIChuICUgMSkgIT0gMCBvciAobiAqIG4pIDwgMlxyXG4gIHJldHVybiAyIGlmIChuICUgMikgPT0gMFxyXG4gIHJldHVybiAzIGlmIChuICUgMykgPT0gMFxyXG4gIHJldHVybiA1IGlmIChuICUgNSkgPT0gMFxyXG5cclxuICBtID0gTWF0aC5zcXJ0IG5cclxuICBmb3IgaSBpbiBbNy4ubV0gYnkgMzBcclxuICAgIHJldHVybiBpICAgIGlmIChuICUgaSkgICAgICA9PSAwXHJcbiAgICByZXR1cm4gaSs0ICBpZiAobiAlIChpKzQpKSAgPT0gMFxyXG4gICAgcmV0dXJuIGkrNiAgaWYgKG4gJSAoaSs2KSkgID09IDBcclxuICAgIHJldHVybiBpKzEwIGlmIChuICUgKGkrMTApKSA9PSAwXHJcbiAgICByZXR1cm4gaSsxMiBpZiAobiAlIChpKzEyKSkgPT0gMFxyXG4gICAgcmV0dXJuIGkrMTYgaWYgKG4gJSAoaSsxNikpID09IDBcclxuICAgIHJldHVybiBpKzIyIGlmIChuICUgKGkrMjIpKSA9PSAwXHJcbiAgICByZXR1cm4gaSsyNCBpZiAobiAlIChpKzI0KSkgPT0gMFxyXG5cclxuICByZXR1cm4gblxyXG5cclxucm9vdC5pc1ByaW1lID0gKG4pIC0+XHJcbiAgaWYgaXNOYU4obikgb3Igbm90IGlzRmluaXRlKG4pIG9yIChuICUgMSkgIT0gMCBvciAobiA8IDIpXHJcbiAgICByZXR1cm4gZmFsc2VcclxuICBpZiBuID09IHJvb3QubGVhc3RGYWN0b3IobilcclxuICAgIHJldHVybiB0cnVlXHJcblxyXG4gIHJldHVybiBmYWxzZVxyXG5cclxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxucm9vdC5wcmltZUZhY3RvcnMgPSAobikgLT5cclxuICByZXR1cm4gWzFdIGlmIG4gPT0gMVxyXG5cclxuICBmYWN0b3JzID0gW11cclxuICB3aGlsZSBub3Qgcm9vdC5pc1ByaW1lKG4pXHJcbiAgICBmYWN0b3IgPSByb290LmxlYXN0RmFjdG9yKG4pXHJcbiAgICBmYWN0b3JzLnB1c2ggZmFjdG9yXHJcbiAgICBuIC89IGZhY3RvclxyXG4gIGZhY3RvcnMucHVzaCBuXHJcbiAgcmV0dXJuIGZhY3RvcnNcclxuXHJcbiMgVGhpcyBkb2VzIGEgYnJ1dGUtZm9yY2UgYXR0ZW1wdCBhdCBjb21iaW5pbmcgYWxsIG9mIHRoZSBwcmltZSBmYWN0b3JzICgyXm4gYXR0ZW1wdHMpLlxyXG4jIEknbSBzdXJlIHRoZXJlIGlzIGEgY29vbGVyIHdheS5cclxucm9vdC5kaXZpc29ycyA9IChuKSAtPlxyXG4gIHByaW1lcyA9IHJvb3QucHJpbWVGYWN0b3JzKG4pXHJcbiAgY29tYm9zVG9UcnkgPSBNYXRoLnBvdygyLCBwcmltZXMubGVuZ3RoKVxyXG4gIGZhY3RvcnNTZWVuID0ge31cclxuICBmb3IgYXR0ZW1wdCBpbiBbMC4uLmNvbWJvc1RvVHJ5XVxyXG4gICAgZmFjdG9yID0gMVxyXG4gICAgZm9yIHYsaSBpbiBwcmltZXNcclxuICAgICAgaWYgKGF0dGVtcHQgJiAoMSA8PCBpKSlcclxuICAgICAgICBmYWN0b3IgKj0gdlxyXG4gICAgaWYgZmFjdG9yIDwgblxyXG4gICAgICBmYWN0b3JzU2VlbltmYWN0b3JdID0gdHJ1ZVxyXG5cclxuICBkaXZpc29yTGlzdCA9IChwYXJzZUludCh2KSBmb3IgdiBpbiBPYmplY3Qua2V5cyhmYWN0b3JzU2VlbikpXHJcbiAgcmV0dXJuIGRpdmlzb3JMaXN0XHJcblxyXG5yb290LnN1bSA9IChudW1iZXJBcnJheSkgLT5cclxuICBzdW0gPSAwXHJcbiAgZm9yIG4gaW4gbnVtYmVyQXJyYXlcclxuICAgIHN1bSArPSBuXHJcbiAgcmV0dXJuIHN1bVxyXG5cclxucm9vdC5mYWN0b3JpYWwgPSAobikgLT5cclxuICBmID0gblxyXG4gIHdoaWxlIG4gPiAxXHJcbiAgICBuLS1cclxuICAgIGYgKj0gblxyXG4gIHJldHVybiBmXHJcblxyXG5yb290Lm5DciA9IChuLCByKSAtPlxyXG4gIHJldHVybiBNYXRoLmZsb29yKHJvb3QuZmFjdG9yaWFsKG4pIC8gKHJvb3QuZmFjdG9yaWFsKHIpICogcm9vdC5mYWN0b3JpYWwobiAtIHIpKSlcclxuIiwiTEFTVF9QUk9CTEVNID0gMjVcclxuXHJcbnJvb3QgPSB3aW5kb3cgIyBleHBvcnRzID8gdGhpc1xyXG5cclxucm9vdC5lc2NhcGVkU3RyaW5naWZ5ID0gKG8pIC0+XHJcbiAgc3RyID0gSlNPTi5zdHJpbmdpZnkobylcclxuICBzdHIgPSBzdHIucmVwbGFjZShcIl1cIiwgXCJcXFxcXVwiKVxyXG4gIHJldHVybiBzdHJcclxuXHJcbnJvb3QucnVuQWxsID0gLT5cclxuICBsYXN0UHV6emxlID0gTEFTVF9QUk9CTEVNXHJcbiAgbmV4dEluZGV4ID0gMFxyXG5cclxuICBsb2FkTmV4dFNjcmlwdCA9IC0+XHJcbiAgICBpZiBuZXh0SW5kZXggPCBsYXN0UHV6emxlXHJcbiAgICAgIG5leHRJbmRleCsrXHJcbiAgICAgIHJ1blRlc3QobmV4dEluZGV4LCBsb2FkTmV4dFNjcmlwdClcclxuICBsb2FkTmV4dFNjcmlwdCgpXHJcblxyXG5yb290Lml0ZXJhdGVQcm9ibGVtcyA9IChhcmdzKSAtPlxyXG5cclxuICBpbmRleFRvUHJvY2VzcyA9IG51bGxcclxuICBpZiBhcmdzLmVuZEluZGV4ID4gMFxyXG4gICAgaWYgYXJncy5zdGFydEluZGV4IDw9IGFyZ3MuZW5kSW5kZXhcclxuICAgICAgaW5kZXhUb1Byb2Nlc3MgPSBhcmdzLnN0YXJ0SW5kZXhcclxuICAgICAgYXJncy5zdGFydEluZGV4KytcclxuICBlbHNlXHJcbiAgICBpZiBhcmdzLmxpc3QubGVuZ3RoID4gMFxyXG4gICAgICBpbmRleFRvUHJvY2VzcyA9IGFyZ3MubGlzdC5zaGlmdCgpXHJcblxyXG4gIGlmIGluZGV4VG9Qcm9jZXNzICE9IG51bGxcclxuICAgIGl0ZXJhdGVOZXh0ID0gLT5cclxuICAgICAgd2luZG93LmFyZ3MgPSBhcmdzXHJcbiAgICAgIHJ1blRlc3QgaW5kZXhUb1Byb2Nlc3MsIC0+XHJcbiAgICAgICAgaXRlcmF0ZVByb2JsZW1zKGFyZ3MpXHJcbiAgICBpdGVyYXRlTmV4dCgpXHJcblxyXG5yb290LnJ1blRlc3QgPSAoaW5kZXgsIGNiKSAtPlxyXG4gIG1vZHVsZU5hbWUgPSBcImUjeygnMDAwJytpbmRleCkuc2xpY2UoLTMpfVwiXHJcbiAgd2luZG93LmluZGV4ID0gaW5kZXhcclxuICBwcm9ibGVtID0gcmVxdWlyZShtb2R1bGVOYW1lKVxyXG4gIHByb2JsZW0ucHJvY2VzcygpXHJcbiAgd2luZG93LnNldFRpbWVvdXQoY2IsIDApIGlmIGNiXHJcblxyXG5jbGFzcyBQcm9ibGVtXHJcbiAgY29uc3RydWN0b3I6IChAZGVzY3JpcHRpb24pIC0+XHJcbiAgICBAaW5kZXggPSB3aW5kb3cuaW5kZXhcclxuICAgIGxpbmVzID0gQGRlc2NyaXB0aW9uLnNwbGl0KC9cXG4vKVxyXG4gICAgbGluZXMuc2hpZnQoKSB3aGlsZSBsaW5lcy5sZW5ndGggPiAwIGFuZCBsaW5lc1swXS5sZW5ndGggPT0gMFxyXG4gICAgQHRpdGxlID0gbGluZXMuc2hpZnQoKVxyXG4gICAgQGxpbmUgPSBsaW5lcy5zaGlmdCgpXHJcbiAgICBAZGVzY3JpcHRpb24gPSBsaW5lcy5qb2luKFwiXFxuXCIpXHJcblxyXG4gIG5vdzogLT5cclxuICAgIHJldHVybiBpZiB3aW5kb3cucGVyZm9ybWFuY2UgdGhlbiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCkgZWxzZSBuZXcgRGF0ZSgpLmdldFRpbWUoKVxyXG5cclxuICBwcm9jZXNzOiAtPlxyXG4gICAgaWYgd2luZG93LmFyZ3MuZGVzY3JpcHRpb25cclxuICAgICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjNDQ0NDQ0O11fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX11cXG5cIlxyXG5cclxuICAgIGZvcm1hdHRlZFRpdGxlID0gJC50ZXJtaW5hbC5mb3JtYXQoXCJbWzsjZmZhYTAwO10je0B0aXRsZX1dXCIpXHJcbiAgICB1cmwgPSBcIj9jPSN7d2luZG93LmFyZ3MuY21kfV8je0BpbmRleH1cIlxyXG4gICAgaWYgd2luZG93LmFyZ3MudmVyYm9zZVxyXG4gICAgICB1cmwgKz0gXCJfdlwiXHJcbiAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIjxhIGhyZWY9XFxcIiN7dXJsfVxcXCI+I3tmb3JtYXR0ZWRUaXRsZX08L2E+XCIsIHsgcmF3OiB0cnVlIH1cclxuXHJcbiAgICBpZiB3aW5kb3cuYXJncy5kZXNjcmlwdGlvblxyXG4gICAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIltbOyM0NDQ0NDQ7XSN7QGxpbmV9XVwiXHJcbiAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2NjY2NlZTtdI3tAZGVzY3JpcHRpb259XVxcblwiXHJcbiAgICAgIHNvdXJjZUxpbmUgPSAkLnRlcm1pbmFsLmZvcm1hdChcIltbOyM0NDQ0NDQ7XVNvdXJjZTpdIFwiKVxyXG4gICAgICBzb3VyY2VMaW5lICs9IFwiIDxhIGhyZWY9XFxcInNyYy9lI3soJzAwMCcrQGluZGV4KS5zbGljZSgtMyl9LmNvZmZlZVxcXCI+XCIgKyAkLnRlcm1pbmFsLmZvcm1hdChcIltbOyM3NzMzMDA7XUxvY2FsXVwiKSArIFwiPC9hPiBcIlxyXG4gICAgICBzb3VyY2VMaW5lICs9ICQudGVybWluYWwuZm9ybWF0KFwiW1s7IzQ0NDQ0NDtdL11cIilcclxuICAgICAgc291cmNlTGluZSArPSBcIiA8YSBocmVmPVxcXCJodHRwczovL2dpdGh1Yi5jb20vam9lZHJhZ28vZXVsZXIvYmxvYi9tYXN0ZXIvc3JjL2UjeygnMDAwJytAaW5kZXgpLnNsaWNlKC0zKX0uY29mZmVlXFxcIj5cIiArICQudGVybWluYWwuZm9ybWF0KFwiW1s7Izc3MzMwMDtdR2l0aHViXVwiKSArIFwiPC9hPlwiXHJcbiAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIHNvdXJjZUxpbmUsIHsgcmF3OiB0cnVlIH1cclxuICAgICAgaWYgd2luZG93LmFyZ3MudGVzdCBvciB3aW5kb3cuYXJncy5hbnN3ZXJcclxuICAgICAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIlwiXHJcblxyXG4gICAgdGVzdEZ1bmMgPSBAdGVzdFxyXG4gICAgYW5zd2VyRnVuYyA9IEBhbnN3ZXJcclxuXHJcbiAgICBpZiB3aW5kb3cuYXJncy50ZXN0XHJcbiAgICAgIGlmIHRlc3RGdW5jID09IHVuZGVmaW5lZFxyXG4gICAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7IzQ0NDQ0NDtdIChubyB0ZXN0cyldXCJcclxuICAgICAgZWxzZVxyXG4gICAgICAgIHRlc3RGdW5jKClcclxuXHJcbiAgICBpZiB3aW5kb3cuYXJncy5hbnN3ZXJcclxuICAgICAgc3RhcnQgPSBAbm93KClcclxuICAgICAgYW5zd2VyID0gYW5zd2VyRnVuYygpXHJcbiAgICAgIGVuZCA9IEBub3coKVxyXG4gICAgICBtcyA9IGVuZCAtIHN0YXJ0XHJcbiAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2ZmZmZmZjtdIC0+IF1bWzsjYWFmZmFhO11BbnN3ZXI6XSAoW1s7I2FhZmZmZjtdI3ttcy50b0ZpeGVkKDEpfW1zXSk6IFtbOyNmZmZmZmY7XSN7ZXNjYXBlZFN0cmluZ2lmeShhbnN3ZXIpfV1cIlxyXG5cclxucm9vdC5Qcm9ibGVtID0gUHJvYmxlbVxyXG5cclxucm9vdC5vayA9ICh2LCBtc2cpIC0+XHJcbiAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjZmZmZmZmO10gKiAgXSN7dn06ICN7bXNnfVwiXHJcblxyXG5yb290LmVxdWFsID0gKGEsIGIsIG1zZykgLT5cclxuICBpZiAkLmlzQXJyYXkoYSkgYW5kICQuaXNBcnJheShiKVxyXG4gICAgaXNFcXVhbCA9IChhLmxlbmd0aCA9PSBiLmxlbmd0aClcclxuICAgIGlmIGlzRXF1YWxcclxuICAgICAgZm9yIGkgaW4gWzAuLi5hLmxlbmd0aF1cclxuICAgICAgICBpZiBhW2ldICE9IGJbaV1cclxuICAgICAgICAgIGlzRXF1YWwgPSBmYWxzZVxyXG4gICAgICAgICAgYnJlYWtcclxuICBlbHNlXHJcbiAgICBpc0VxdWFsID0gKGEgPT0gYilcclxuXHJcbiAgaWYgaXNFcXVhbFxyXG4gICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjZmZmZmZmO10gKiAgXVtbOyM1NTU1NTU7XVBBU1M6ICN7bXNnfV1cIlxyXG4gIGVsc2VcclxuICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2ZmZmZmZjtdICogIF1bWzsjZmZhYWFhO11GQUlMOiAje21zZ30gKCN7YX0gIT0gI3tifSldXCJcclxuXHJcbnJvb3Qub25Db21tYW5kID0gKGNvbW1hbmQpID0+XHJcbiAgcmV0dXJuIGlmIGNvbW1hbmQubGVuZ3RoID09IDBcclxuICBjbWQgPSAkLnRlcm1pbmFsLnBhcnNlQ29tbWFuZChjb21tYW5kKVxyXG4gIHJldHVybiBpZiBjbWQubmFtZS5sZW5ndGggPT0gMFxyXG5cclxuICBhcmdzID1cclxuICAgIHN0YXJ0SW5kZXg6IDBcclxuICAgIGVuZEluZGV4OiAwXHJcbiAgICBsaXN0OiBbXVxyXG4gICAgdmVyYm9zZTogZmFsc2VcclxuICAgIGRlc2NyaXB0aW9uOiBmYWxzZVxyXG4gICAgdGVzdDogZmFsc2VcclxuICAgIGFuc3dlcjogZmFsc2VcclxuXHJcbiAgcHJvY2VzcyA9IHRydWVcclxuXHJcbiAgZm9yIGFyZyBpbiBjbWQuYXJnc1xyXG4gICAgYXJnID0gU3RyaW5nKGFyZylcclxuICAgIGNvbnRpbnVlIGlmIGFyZy5sZW5ndGggPCAxXHJcbiAgICBpZiBhcmdbMF0gPT0gJ3YnXHJcbiAgICAgIGFyZ3MudmVyYm9zZSA9IHRydWVcclxuICAgIGVsc2UgaWYgYXJnLm1hdGNoKC9eXFxkKyQvKVxyXG4gICAgICB2ID0gcGFyc2VJbnQoYXJnKVxyXG4gICAgICBpZiAodiA+PSAxKSBhbmQgKHYgPD0gTEFTVF9QUk9CTEVNKVxyXG4gICAgICAgIGFyZ3MubGlzdC5wdXNoKHYpXHJcbiAgICAgIGVsc2VcclxuICAgICAgICBwcm9jZXNzID0gZmFsc2VcclxuICAgICAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIltbOyNmZmFhYWE7XU5vIHN1Y2ggdGVzdDogI3t2fSAodmFsaWQgdGVzdHMgMS0je0xBU1RfUFJPQkxFTX0pXVwiXHJcblxyXG4gIGlmIGFyZ3MubGlzdC5sZW5ndGggPT0gMFxyXG4gICAgYXJncy5zdGFydEluZGV4ID0gMVxyXG4gICAgYXJncy5lbmRJbmRleCA9IExBU1RfUFJPQkxFTVxyXG5cclxuICAjIFNpbmNlIGFsbCBvZiBvdXIgY29tbWFuZHMgaGFwcGVuIHRvIGhhdmUgdW5pcXVlIGZpcnN0IGxldHRlcnMsIGxldCBwZW9wbGUgYmUgc3VwZXIgbGF6eS9zaWxseVxyXG4gIGlmIGNtZC5uYW1lWzBdID09ICdsJ1xyXG4gICAgYXJncy5jbWQgPSBcImxpc3RcIlxyXG4gIGVsc2UgaWYgY21kLm5hbWVbMF0gPT0gJ2QnXHJcbiAgICBhcmdzLmNtZCA9IFwiZGVzY3JpYmVcIlxyXG4gICAgYXJncy5kZXNjcmlwdGlvbiA9IHRydWVcclxuICBlbHNlIGlmIGNtZC5uYW1lWzBdID09ICd0J1xyXG4gICAgYXJncy5jbWQgPSBcInRlc3RcIlxyXG4gICAgYXJncy50ZXN0ID0gdHJ1ZVxyXG4gIGVsc2UgaWYgY21kLm5hbWVbMF0gPT0gJ2EnXHJcbiAgICBhcmdzLmNtZCA9IFwiYW5zd2VyXCJcclxuICAgIGFyZ3MuYW5zd2VyID0gdHJ1ZVxyXG4gIGVsc2UgaWYgY21kLm5hbWVbMF0gPT0gJ3InXHJcbiAgICBhcmdzLmNtZCA9IFwicnVuXCJcclxuICAgIGFyZ3MudGVzdCA9IHRydWVcclxuICAgIGFyZ3MuYW5zd2VyID0gdHJ1ZVxyXG4gIGVsc2UgaWYgY21kLm5hbWVbMF0gPT0gJ2QnXHJcbiAgICBhcmdzLmNtZCA9IFwiZGVzY3JpYmVcIlxyXG4gICAgYXJncy5kZXNjcmlwdGlvbiA9IHRydWVcclxuICBlbHNlIGlmIGNtZC5uYW1lWzBdID09ICdoJ1xyXG4gICAgYXJncy5jbWQgPSBcImhlbHBcIlxyXG4gICAgcHJvY2VzcyA9IGZhbHNlXHJcbiAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIlwiXCJcclxuICAgIENvbW1hbmRzOlxyXG5cclxuICAgICAgICBsaXN0IFtYXSAgICAgLSBMaXN0IHByb2JsZW0gdGl0bGVzXHJcbiAgICAgICAgZGVzY3JpYmUgW1hdIC0gRGlzcGxheSBmdWxsIHByb2JsZW0gZGVzY3JpcHRpb25zXHJcbiAgICAgICAgdGVzdCBbWF0gICAgIC0gUnVuIHVuaXQgdGVzdHNcclxuICAgICAgICBhbnN3ZXIgW1hdICAgLSBUaW1lIGFuZCBjYWxjdWxhdGUgYW5zd2VyXHJcbiAgICAgICAgcnVuIFtYXSAgICAgIC0gdGVzdCBhbmQgYW5zd2VyIGNvbWJpbmVkXHJcbiAgICAgICAgaGVscCAgICAgICAgIC0gVGhpcyBoZWxwXHJcblxyXG4gICAgICAgIEluIGFsbCBvZiB0aGVzZSwgW1hdIGNhbiBiZSBhIGxpc3Qgb2Ygb25lIG9yIG1vcmUgcHJvYmxlbSBudW1iZXJzLiAoYSB2YWx1ZSBmcm9tIDEgdG8gI3tMQVNUX1BST0JMRU19KS4gSWYgYWJzZW50LCBpdCBpbXBsaWVzIGFsbCBwcm9ibGVtcy5cclxuICAgICAgICBBbHNvLCBhZGRpbmcgdGhlIHdvcmQgXCJ2ZXJib3NlXCIgdG8gc29tZSBvZiB0aGVzZSBjb21tYW5kcyB3aWxsIGVtaXQgdGhlIGRlc2NyaXB0aW9uIGJlZm9yZSBwZXJmb3JtaW5nIHRoZSB0YXNrLlxyXG5cclxuICAgIFwiXCJcIlxyXG4gIGVsc2VcclxuICAgIHByb2Nlc3MgPSBmYWxzZVxyXG4gICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjZmZhYWFhO11Vbmtub3duIGNvbW1hbmQuXVwiXHJcblxyXG4gIGlmIGFyZ3MudmVyYm9zZVxyXG4gICAgYXJncy5kZXNjcmlwdGlvbiA9IHRydWVcclxuXHJcbiAgaWYgcHJvY2Vzc1xyXG4gICAgaXRlcmF0ZVByb2JsZW1zKGFyZ3MpXHJcbiJdfQ==
