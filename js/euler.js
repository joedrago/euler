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
},{}],2:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192

/**
 * If `Buffer._useTypedArrays`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (compatible down to IE6)
 */
Buffer._useTypedArrays = (function () {
  // Detect if browser supports Typed Arrays. Supported browsers are IE 10+, Firefox 4+,
  // Chrome 7+, Safari 5.1+, Opera 11.6+, iOS 4.2+. If the browser does not support adding
  // properties to `Uint8Array` instances, then that's the same as no `Uint8Array` support
  // because we need to be able to add all the node Buffer API methods. This is an issue
  // in Firefox 4-29. Now fixed: https://bugzilla.mozilla.org/show_bug.cgi?id=695438
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() &&
        typeof arr.subarray === 'function' // Chrome 9-10 lack `subarray`
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

  // Workaround: node's base64 implementation allows for non-padded strings
  // while base64-js does not.
  if (encoding === 'base64' && type === 'string') {
    subject = stringtrim(subject)
    while (subject.length % 4 !== 0) {
      subject = subject + '='
    }
  }

  // Find the length
  var length
  if (type === 'number')
    length = coerce(subject)
  else if (type === 'string')
    length = Buffer.byteLength(subject, encoding)
  else if (type === 'object')
    length = coerce(subject.length) // assume that object is array-like
  else
    throw new Error('First argument needs to be a number, array or string.')

  var buf
  if (Buffer._useTypedArrays) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer._useTypedArrays && typeof subject.byteLength === 'number') {
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
  } else if (type === 'number' && !Buffer._useTypedArrays && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

// STATIC METHODS
// ==============

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

Buffer.isBuffer = function (b) {
  return !!(b !== null && b !== undefined && b._isBuffer)
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str.toString()
  switch (encoding || 'utf8') {
    case 'hex':
      ret = str.length / 2
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.concat = function (list, totalLength) {
  assert(isArray(list), 'Usage: Buffer.concat(list[, length])')

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

Buffer.compare = function (a, b) {
  assert(Buffer.isBuffer(a) && Buffer.isBuffer(b), 'Arguments must be Buffers')
  var x = a.length
  var y = b.length
  for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
  if (i !== len) {
    x = a[i]
    y = b[i]
  }
  if (x < y) {
    return -1
  }
  if (y < x) {
    return 1
  }
  return 0
}

// BUFFER INSTANCE METHODS
// =======================

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
  assert(strLen % 2 === 0, 'Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    assert(!isNaN(byte), 'Invalid hex string')
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
  var charsWritten = blitBuffer(utf16leToBytes(string), buf, offset, length)
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
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toString = function (encoding, start, end) {
  var self = this

  encoding = String(encoding || 'utf8').toLowerCase()
  start = Number(start) || 0
  end = (end === undefined) ? self.length : Number(end)

  // Fastpath empty strings
  if (end === start)
    return ''

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexSlice(self, start, end)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Slice(self, start, end)
      break
    case 'ascii':
      ret = asciiSlice(self, start, end)
      break
    case 'binary':
      ret = binarySlice(self, start, end)
      break
    case 'base64':
      ret = base64Slice(self, start, end)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leSlice(self, start, end)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

Buffer.prototype.equals = function (b) {
  assert(Buffer.isBuffer(b), 'Argument must be a Buffer')
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.compare = function (b) {
  assert(Buffer.isBuffer(b), 'Argument must be a Buffer')
  return Buffer.compare(this, b)
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
  assert(end >= start, 'sourceEnd < sourceStart')
  assert(target_start >= 0 && target_start < target.length,
      'targetStart out of bounds')
  assert(start >= 0 && start < source.length, 'sourceStart out of bounds')
  assert(end >= 0 && end <= source.length, 'sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 100 || !Buffer._useTypedArrays) {
    for (var i = 0; i < len; i++) {
      target[i + target_start] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), target_start)
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
  start = clamp(start, len, 0)
  end = clamp(end, len, len)

  if (Buffer._useTypedArrays) {
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

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  return this[offset]
}

function readUInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    val = buf[offset]
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
  } else {
    val = buf[offset] << 8
    if (offset + 1 < len)
      val |= buf[offset + 1]
  }
  return val
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  return readUInt16(this, offset, true, noAssert)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  return readUInt16(this, offset, false, noAssert)
}

function readUInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    if (offset + 2 < len)
      val = buf[offset + 2] << 16
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
    val |= buf[offset]
    if (offset + 3 < len)
      val = val + (buf[offset + 3] << 24 >>> 0)
  } else {
    if (offset + 1 < len)
      val = buf[offset + 1] << 16
    if (offset + 2 < len)
      val |= buf[offset + 2] << 8
    if (offset + 3 < len)
      val |= buf[offset + 3]
    val = val + (buf[offset] << 24 >>> 0)
  }
  return val
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  return readUInt32(this, offset, true, noAssert)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  return readUInt32(this, offset, false, noAssert)
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  var neg = this[offset] & 0x80
  if (neg)
    return (0xff - this[offset] + 1) * -1
  else
    return this[offset]
}

function readInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = readUInt16(buf, offset, littleEndian, true)
  var neg = val & 0x8000
  if (neg)
    return (0xffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  return readInt16(this, offset, true, noAssert)
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  return readInt16(this, offset, false, noAssert)
}

function readInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = readUInt32(buf, offset, littleEndian, true)
  var neg = val & 0x80000000
  if (neg)
    return (0xffffffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  return readInt32(this, offset, true, noAssert)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  return readInt32(this, offset, false, noAssert)
}

function readFloat (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 23, 4)
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  return readFloat(this, offset, true, noAssert)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  return readFloat(this, offset, false, noAssert)
}

function readDouble (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 52, 8)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  return readDouble(this, offset, true, noAssert)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  return readDouble(this, offset, false, noAssert)
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'trying to write beyond buffer length')
    verifuint(value, 0xff)
  }

  if (offset >= this.length) return

  this[offset] = value
  return offset + 1
}

function writeUInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 2); i < j; i++) {
    buf[offset + i] =
        (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
            (littleEndian ? i : 1 - i) * 8
  }
  return offset + 2
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  return writeUInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  return writeUInt16(this, value, offset, false, noAssert)
}

function writeUInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffffffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 4); i < j; i++) {
    buf[offset + i] =
        (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
  return offset + 4
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  return writeUInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  return writeUInt32(this, value, offset, false, noAssert)
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7f, -0x80)
  }

  if (offset >= this.length)
    return

  if (value >= 0)
    this.writeUInt8(value, offset, noAssert)
  else
    this.writeUInt8(0xff + value + 1, offset, noAssert)
  return offset + 1
}

function writeInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fff, -0x8000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    writeUInt16(buf, value, offset, littleEndian, noAssert)
  else
    writeUInt16(buf, 0xffff + value + 1, offset, littleEndian, noAssert)
  return offset + 2
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  return writeInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  return writeInt16(this, value, offset, false, noAssert)
}

function writeInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fffffff, -0x80000000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    writeUInt32(buf, value, offset, littleEndian, noAssert)
  else
    writeUInt32(buf, 0xffffffff + value + 1, offset, littleEndian, noAssert)
  return offset + 4
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  return writeInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  return writeInt32(this, value, offset, false, noAssert)
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }

  var len = buf.length
  if (offset >= len)
    return

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
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 7 < buf.length,
        'Trying to write beyond buffer length')
    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  assert(end >= start, 'end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  assert(start >= 0 && start < this.length, 'start out of bounds')
  assert(end >= 0 && end <= this.length, 'end out of bounds')

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

Buffer.prototype.inspect = function () {
  var out = []
  var len = this.length
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i])
    if (i === exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...'
      break
    }
  }
  return '<Buffer ' + out.join(' ') + '>'
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer._useTypedArrays) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new Error('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
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

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

// slice(start, end)
function clamp (index, len, defaultValue) {
  if (typeof index !== 'number') return defaultValue
  index = ~~index;  // Coerce to integer.
  if (index >= len) return len
  if (index >= 0) return index
  index += len
  if (index >= 0) return index
  return 0
}

function coerce (length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length)
  return length < 0 ? 0 : length
}

function isArray (subject) {
  return (Array.isArray || function (subject) {
    return Object.prototype.toString.call(subject) === '[object Array]'
  })(subject)
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

function blitBuffer (src, dst, offset, length) {
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

/*
 * We have to make sure that the value is a valid integer. This means that it
 * is non-negative. It has no fractional component and that it does not
 * exceed the maximum allowed value.
 */
function verifuint (value, max) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value >= 0, 'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifsint (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifIEEE754 (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
}

function assert (test, message) {
  if (!test) throw new Error(message || 'Failed assertion')
}

},{"base64-js":3,"ieee754":4}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
exports.read = function(buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

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


},{"math":"Gm6Ven"}],"8SbMqD":[function(require,module,exports){
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


},{}],"e019":[function(require,module,exports){
module.exports=require('8SbMqD');
},{}],"X6kQ1k":[function(require,module,exports){
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


},{"big-integer":1}],"e020":[function(require,module,exports){
module.exports=require('X6kQ1k');
},{}],"kNgleA":[function(require,module,exports){
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


},{"math":"Gm6Ven"}],"e021":[function(require,module,exports){
module.exports=require('kNgleA');
},{}],"e022":[function(require,module,exports){
module.exports=require('NmeQG8');
},{}],"NmeQG8":[function(require,module,exports){
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
},{"buffer":2}],"O9B+sp":[function(require,module,exports){
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


},{"math":"Gm6Ven"}],"e023":[function(require,module,exports){
module.exports=require('O9B+sp');
},{}],"Cbo2Ua":[function(require,module,exports){
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


},{}],"e024":[function(require,module,exports){
module.exports=require('Cbo2Ua');
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


},{}],"terminal":[function(require,module,exports){
module.exports=require('AUKApQ');
},{}],"AUKApQ":[function(require,module,exports){
var LAST_PROBLEM, Problem, root;

LAST_PROBLEM = 24;

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2JpZy1pbnRlZ2VyL0JpZ0ludGVnZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCIuLi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwiLi4vc3JjL2UwMDEuY29mZmVlIiwiLi4vc3JjL2UwMDIuY29mZmVlIiwiLi4vc3JjL2UwMDMuY29mZmVlIiwiLi4vc3JjL2UwMDQuY29mZmVlIiwiLi4vc3JjL2UwMDUuY29mZmVlIiwiLi4vc3JjL2UwMDYuY29mZmVlIiwiLi4vc3JjL2UwMDcuY29mZmVlIiwiLi4vc3JjL2UwMDguY29mZmVlIiwiLi4vc3JjL2UwMDkuY29mZmVlIiwiLi4vc3JjL2UwMTAuY29mZmVlIiwiLi4vc3JjL2UwMTEuY29mZmVlIiwiLi4vc3JjL2UwMTIuY29mZmVlIiwiLi4vc3JjL2UwMTMuY29mZmVlIiwiLi4vc3JjL2UwMTQuY29mZmVlIiwiLi4vc3JjL2UwMTUuY29mZmVlIiwiLi4vc3JjL2UwMTYuY29mZmVlIiwiLi4vc3JjL2UwMTcuY29mZmVlIiwiLi4vc3JjL2UwMTguY29mZmVlIiwiLi4vc3JjL2UwMTkuY29mZmVlIiwiLi4vc3JjL2UwMjAuY29mZmVlIiwiLi4vc3JjL2UwMjEuY29mZmVlIiwiLi4vc3JjL2UwMjIuY29mZmVlIiwiLi4vc3JjL2UwMjMuY29mZmVlIiwiLi4vc3JjL2UwMjQuY29mZmVlIiwiLi4vc3JjL21hdGguY29mZmVlIiwiLi4vc3JjL3Rlcm1pbmFsLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDallBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzduQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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LEtBQVYsQ0FBQTtBQUFBLE1BQ0EsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFoQixDQUFxQiwrQkFBckIsQ0FEQSxDQWxCRztLQW5ETDtBQXdFQSxJQUFBLElBQUcsSUFBSSxDQUFDLE9BQVI7QUFDRSxNQUFBLElBQUksQ0FBQyxXQUFMLEdBQW1CLElBQW5CLENBREY7S0F4RUE7QUEyRUEsSUFBQSxJQUFHLE9BQUg7YUFDRSxlQUFBLENBQWdCLElBQWhCLEVBREY7S0E1RWU7RUFBQSxFQUFBO0FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQWxIakIsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGJpZ0ludCA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgYmFzZSA9IDEwMDAwMDAwLCBsb2dCYXNlID0gNztcclxuICAgIHZhciBzaWduID0ge1xyXG4gICAgICAgIHBvc2l0aXZlOiBmYWxzZSxcclxuICAgICAgICBuZWdhdGl2ZTogdHJ1ZVxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgbm9ybWFsaXplID0gZnVuY3Rpb24gKGZpcnN0LCBzZWNvbmQpIHtcclxuICAgICAgICB2YXIgYSA9IGZpcnN0LnZhbHVlLCBiID0gc2Vjb25kLnZhbHVlO1xyXG4gICAgICAgIHZhciBsZW5ndGggPSBhLmxlbmd0aCA+IGIubGVuZ3RoID8gYS5sZW5ndGggOiBiLmxlbmd0aDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGFbaV0gPSBhW2ldIHx8IDA7XHJcbiAgICAgICAgICAgIGJbaV0gPSBiW2ldIHx8IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAodmFyIGkgPSBsZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICBpZiAoYVtpXSA9PT0gMCAmJiBiW2ldID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBhLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgYi5wb3AoKTtcclxuICAgICAgICAgICAgfSBlbHNlIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWEubGVuZ3RoKSBhID0gWzBdLCBiID0gWzBdO1xyXG4gICAgICAgIGZpcnN0LnZhbHVlID0gYTtcclxuICAgICAgICBzZWNvbmQudmFsdWUgPSBiO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgcGFyc2UgPSBmdW5jdGlvbiAodGV4dCwgZmlyc3QpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHRleHQgPT09IFwib2JqZWN0XCIpIHJldHVybiB0ZXh0O1xyXG4gICAgICAgIHRleHQgKz0gXCJcIjtcclxuICAgICAgICB2YXIgcyA9IHNpZ24ucG9zaXRpdmUsIHZhbHVlID0gW107XHJcbiAgICAgICAgaWYgKHRleHRbMF0gPT09IFwiLVwiKSB7XHJcbiAgICAgICAgICAgIHMgPSBzaWduLm5lZ2F0aXZlO1xyXG4gICAgICAgICAgICB0ZXh0ID0gdGV4dC5zbGljZSgxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHRleHQgPSB0ZXh0LnNwbGl0KFwiZVwiKTtcclxuICAgICAgICBpZiAodGV4dC5sZW5ndGggPiAyKSB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGludGVnZXJcIik7XHJcbiAgICAgICAgaWYgKHRleHRbMV0pIHtcclxuICAgICAgICAgICAgdmFyIGV4cCA9IHRleHRbMV07XHJcbiAgICAgICAgICAgIGlmIChleHBbMF0gPT09IFwiK1wiKSBleHAgPSBleHAuc2xpY2UoMSk7XHJcbiAgICAgICAgICAgIGV4cCA9IHBhcnNlKGV4cCk7XHJcbiAgICAgICAgICAgIGlmIChleHAubGVzc2VyKDApKSB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgaW5jbHVkZSBuZWdhdGl2ZSBleHBvbmVudCBwYXJ0IGZvciBpbnRlZ2Vyc1wiKTtcclxuICAgICAgICAgICAgd2hpbGUgKGV4cC5ub3RFcXVhbHMoMCkpIHtcclxuICAgICAgICAgICAgICAgIHRleHRbMF0gKz0gXCIwXCI7XHJcbiAgICAgICAgICAgICAgICBleHAgPSBleHAucHJldigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRleHQgPSB0ZXh0WzBdO1xyXG4gICAgICAgIGlmICh0ZXh0ID09PSBcIi0wXCIpIHRleHQgPSBcIjBcIjtcclxuICAgICAgICB2YXIgaXNWYWxpZCA9IC9eKFswLTldWzAtOV0qKSQvLnRlc3QodGV4dCk7XHJcbiAgICAgICAgaWYgKCFpc1ZhbGlkKSB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGludGVnZXJcIik7XHJcbiAgICAgICAgd2hpbGUgKHRleHQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBkaXZpZGVyID0gdGV4dC5sZW5ndGggPiBsb2dCYXNlID8gdGV4dC5sZW5ndGggLSBsb2dCYXNlIDogMDtcclxuICAgICAgICAgICAgdmFsdWUucHVzaCgrdGV4dC5zbGljZShkaXZpZGVyKSk7XHJcbiAgICAgICAgICAgIHRleHQgPSB0ZXh0LnNsaWNlKDAsIGRpdmlkZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdmFsID0gYmlnSW50KHZhbHVlLCBzKTtcclxuICAgICAgICBpZiAoZmlyc3QpIG5vcm1hbGl6ZShmaXJzdCwgdmFsKTtcclxuICAgICAgICByZXR1cm4gdmFsO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgZ29lc0ludG8gPSBmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgICAgIHZhciBhID0gYmlnSW50KGEsIHNpZ24ucG9zaXRpdmUpLCBiID0gYmlnSW50KGIsIHNpZ24ucG9zaXRpdmUpO1xyXG4gICAgICAgIGlmIChhLmVxdWFscygwKSkgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGRpdmlkZSBieSAwXCIpO1xyXG4gICAgICAgIHZhciBuID0gMDtcclxuICAgICAgICBkbyB7XHJcbiAgICAgICAgICAgIHZhciBpbmMgPSAxO1xyXG4gICAgICAgICAgICB2YXIgYyA9IGJpZ0ludChhLnZhbHVlLCBzaWduLnBvc2l0aXZlKSwgdCA9IGMudGltZXMoMTApO1xyXG4gICAgICAgICAgICB3aGlsZSAodC5sZXNzZXIoYikpIHtcclxuICAgICAgICAgICAgICAgIGMgPSB0O1xyXG4gICAgICAgICAgICAgICAgaW5jICo9IDEwO1xyXG4gICAgICAgICAgICAgICAgdCA9IHQudGltZXMoMTApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHdoaWxlIChjLmxlc3Nlck9yRXF1YWxzKGIpKSB7XHJcbiAgICAgICAgICAgICAgICBiID0gYi5taW51cyhjKTtcclxuICAgICAgICAgICAgICAgIG4gKz0gaW5jO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSB3aGlsZSAoYS5sZXNzZXJPckVxdWFscyhiKSk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlbWFpbmRlcjogYi52YWx1ZSxcclxuICAgICAgICAgICAgcmVzdWx0OiBuXHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcblxyXG4gICAgdmFyIGJpZ0ludCA9IGZ1bmN0aW9uICh2YWx1ZSwgcykge1xyXG4gICAgICAgIHZhciBzZWxmID0ge1xyXG4gICAgICAgICAgICB2YWx1ZTogdmFsdWUsXHJcbiAgICAgICAgICAgIHNpZ246IHNcclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciBvID0ge1xyXG4gICAgICAgICAgICB2YWx1ZTogdmFsdWUsXHJcbiAgICAgICAgICAgIHNpZ246IHMsXHJcbiAgICAgICAgICAgIG5lZ2F0ZTogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IG0gfHwgc2VsZjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBiaWdJbnQoZmlyc3QudmFsdWUsICFmaXJzdC5zaWduKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYWJzOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gbSB8fCBzZWxmO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpZ0ludChmaXJzdC52YWx1ZSwgc2lnbi5wb3NpdGl2ZSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGFkZDogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBzLCBmaXJzdCA9IHNlbGYsIHNlY29uZDtcclxuICAgICAgICAgICAgICAgIGlmIChtKSAoZmlyc3QgPSBwYXJzZShuKSkgJiYgKHNlY29uZCA9IHBhcnNlKG0pKTtcclxuICAgICAgICAgICAgICAgIGVsc2Ugc2Vjb25kID0gcGFyc2UobiwgZmlyc3QpO1xyXG4gICAgICAgICAgICAgICAgcyA9IGZpcnN0LnNpZ247XHJcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3Quc2lnbiAhPT0gc2Vjb25kLnNpZ24pIHtcclxuICAgICAgICAgICAgICAgICAgICBmaXJzdCA9IGJpZ0ludChmaXJzdC52YWx1ZSwgc2lnbi5wb3NpdGl2ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2Vjb25kID0gYmlnSW50KHNlY29uZC52YWx1ZSwgc2lnbi5wb3NpdGl2ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHMgPT09IHNpZ24ucG9zaXRpdmUgP1xyXG5cdFx0XHRcdFx0XHRvLnN1YnRyYWN0KGZpcnN0LCBzZWNvbmQpIDpcclxuXHRcdFx0XHRcdFx0by5zdWJ0cmFjdChzZWNvbmQsIGZpcnN0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIG5vcm1hbGl6ZShmaXJzdCwgc2Vjb25kKTtcclxuICAgICAgICAgICAgICAgIHZhciBhID0gZmlyc3QudmFsdWUsIGIgPSBzZWNvbmQudmFsdWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcblx0XHRcdFx0XHRjYXJyeSA9IDA7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoIHx8IGNhcnJ5ID4gMDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN1bSA9IChhW2ldIHx8IDApICsgKGJbaV0gfHwgMCkgKyBjYXJyeTtcclxuICAgICAgICAgICAgICAgICAgICBjYXJyeSA9IHN1bSA+PSBiYXNlID8gMSA6IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VtIC09IGNhcnJ5ICogYmFzZTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChzdW0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpZ0ludChyZXN1bHQsIHMpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwbHVzOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uYWRkKG4sIG0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzdWJ0cmFjdDogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHNlbGYsIHNlY29uZDtcclxuICAgICAgICAgICAgICAgIGlmIChtKSAoZmlyc3QgPSBwYXJzZShuKSkgJiYgKHNlY29uZCA9IHBhcnNlKG0pKTtcclxuICAgICAgICAgICAgICAgIGVsc2Ugc2Vjb25kID0gcGFyc2UobiwgZmlyc3QpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0LnNpZ24gIT09IHNlY29uZC5zaWduKSByZXR1cm4gby5hZGQoZmlyc3QsIG8ubmVnYXRlKHNlY29uZCkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0LnNpZ24gPT09IHNpZ24ubmVnYXRpdmUpIHJldHVybiBvLnN1YnRyYWN0KG8ubmVnYXRlKHNlY29uZCksIG8ubmVnYXRlKGZpcnN0KSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoby5jb21wYXJlKGZpcnN0LCBzZWNvbmQpID09PSAtMSkgcmV0dXJuIG8ubmVnYXRlKG8uc3VidHJhY3Qoc2Vjb25kLCBmaXJzdCkpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSBmaXJzdC52YWx1ZSwgYiA9IHNlY29uZC52YWx1ZTtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuXHRcdFx0XHRcdGJvcnJvdyA9IDA7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdG1wID0gYVtpXSAtIGJvcnJvdztcclxuICAgICAgICAgICAgICAgICAgICBib3Jyb3cgPSB0bXAgPCBiW2ldID8gMSA6IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1pbnVlbmQgPSAoYm9ycm93ICogYmFzZSkgKyB0bXAgLSBiW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG1pbnVlbmQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpZ0ludChyZXN1bHQsIHNpZ24ucG9zaXRpdmUpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBtaW51czogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLnN1YnRyYWN0KG4sIG0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBtdWx0aXBseTogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBzLCBmaXJzdCA9IHNlbGYsIHNlY29uZDtcclxuICAgICAgICAgICAgICAgIGlmIChtKSAoZmlyc3QgPSBwYXJzZShuKSkgJiYgKHNlY29uZCA9IHBhcnNlKG0pKTtcclxuICAgICAgICAgICAgICAgIGVsc2Ugc2Vjb25kID0gcGFyc2UobiwgZmlyc3QpO1xyXG4gICAgICAgICAgICAgICAgcyA9IGZpcnN0LnNpZ24gIT09IHNlY29uZC5zaWduO1xyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSBmaXJzdC52YWx1ZSwgYiA9IHNlY29uZC52YWx1ZTtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHRTdW0gPSBbXTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFN1bVtpXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBqID0gaTtcclxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoai0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFN1bVtpXS5wdXNoKDApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBjYXJyeSA9IDA7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgeCA9IGFbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBiLmxlbmd0aCB8fCBjYXJyeSA+IDA7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgeSA9IGJbal07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcm9kdWN0ID0geSA/ICh4ICogeSkgKyBjYXJyeSA6IGNhcnJ5O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJyeSA9IHByb2R1Y3QgPiBiYXNlID8gTWF0aC5mbG9vcihwcm9kdWN0IC8gYmFzZSkgOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0IC09IGNhcnJ5ICogYmFzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0U3VtW2ldLnB1c2gocHJvZHVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIG1heCA9IC0xO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXN1bHRTdW0ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGVuID0gcmVzdWx0U3VtW2ldLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGVuID4gbWF4KSBtYXggPSBsZW47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gW10sIGNhcnJ5ID0gMDtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWF4IHx8IGNhcnJ5ID4gMDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN1bSA9IGNhcnJ5O1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcmVzdWx0U3VtLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1bSArPSByZXN1bHRTdW1bal1baV0gfHwgMDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2FycnkgPSBzdW0gPiBiYXNlID8gTWF0aC5mbG9vcihzdW0gLyBiYXNlKSA6IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VtIC09IGNhcnJ5ICogYmFzZTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChzdW0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpZ0ludChyZXN1bHQsIHMpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0aW1lczogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLm11bHRpcGx5KG4sIG0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBkaXZtb2Q6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcywgZmlyc3QgPSBzZWxmLCBzZWNvbmQ7XHJcbiAgICAgICAgICAgICAgICBpZiAobSkgKGZpcnN0ID0gcGFyc2UobikpICYmIChzZWNvbmQgPSBwYXJzZShtKSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHNlY29uZCA9IHBhcnNlKG4sIGZpcnN0KTtcclxuICAgICAgICAgICAgICAgIHMgPSBmaXJzdC5zaWduICE9PSBzZWNvbmQuc2lnbjtcclxuICAgICAgICAgICAgICAgIGlmIChiaWdJbnQoZmlyc3QudmFsdWUsIGZpcnN0LnNpZ24pLmVxdWFscygwKSkgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICBxdW90aWVudDogYmlnSW50KFswXSwgc2lnbi5wb3NpdGl2ZSksXHJcbiAgICAgICAgICAgICAgICAgICAgcmVtYWluZGVyOiBiaWdJbnQoWzBdLCBzaWduLnBvc2l0aXZlKVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGlmIChzZWNvbmQuZXF1YWxzKDApKSB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZGl2aWRlIGJ5IHplcm9cIik7XHJcbiAgICAgICAgICAgICAgICB2YXIgYSA9IGZpcnN0LnZhbHVlLCBiID0gc2Vjb25kLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdLCByZW1haW5kZXIgPSBbXTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBhLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG4gPSBbYVtpXV0uY29uY2F0KHJlbWFpbmRlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHF1b3RpZW50ID0gZ29lc0ludG8oYiwgbik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gocXVvdGllbnQucmVzdWx0KTtcclxuICAgICAgICAgICAgICAgICAgICByZW1haW5kZXIgPSBxdW90aWVudC5yZW1haW5kZXI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucmV2ZXJzZSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICBxdW90aWVudDogYmlnSW50KHJlc3VsdCwgcyksXHJcbiAgICAgICAgICAgICAgICAgICAgcmVtYWluZGVyOiBiaWdJbnQocmVtYWluZGVyLCBmaXJzdC5zaWduKVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZGl2aWRlOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uZGl2bW9kKG4sIG0pLnF1b3RpZW50O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvdmVyOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uZGl2aWRlKG4sIG0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBtb2Q6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5kaXZtb2QobiwgbSkucmVtYWluZGVyO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZW1haW5kZXI6IGZ1bmN0aW9uKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLm1vZChuLCBtKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcG93OiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gc2VsZiwgc2Vjb25kO1xyXG4gICAgICAgICAgICAgICAgaWYgKG0pIChmaXJzdCA9IHBhcnNlKG4pKSAmJiAoc2Vjb25kID0gcGFyc2UobSkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBzZWNvbmQgPSBwYXJzZShuLCBmaXJzdCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgYSA9IGZpcnN0LCBiID0gc2Vjb25kO1xyXG4gICAgICAgICAgICAgICAgaWYgKGJpZ0ludChhLnZhbHVlLCBhLnNpZ24pLmVxdWFscygwKSkgcmV0dXJuIFpFUk87XHJcbiAgICAgICAgICAgICAgICBpZiAoYi5sZXNzZXIoMCkpIHJldHVybiBaRVJPO1xyXG4gICAgICAgICAgICAgICAgaWYgKGIuZXF1YWxzKDApKSByZXR1cm4gT05FO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGJpZ0ludChhLnZhbHVlLCBhLnNpZ24pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChiLm1vZCgyKS5lcXVhbHMoMCkpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IHJlc3VsdC5wb3coYi5vdmVyKDIpKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYy50aW1lcyhjKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC50aW1lcyhyZXN1bHQucG93KGIubWludXMoMSkpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbmV4dDogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IG0gfHwgc2VsZjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmFkZChmaXJzdCwgMSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHByZXY6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBtIHx8IHNlbGY7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5zdWJ0cmFjdChmaXJzdCwgMSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNvbXBhcmU6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBzZWxmLCBzZWNvbmQ7XHJcbiAgICAgICAgICAgICAgICBpZiAobSkgKGZpcnN0ID0gcGFyc2UobikpICYmIChzZWNvbmQgPSBwYXJzZShtLCBmaXJzdCkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBzZWNvbmQgPSBwYXJzZShuLCBmaXJzdCk7XHJcbiAgICAgICAgICAgICAgICBub3JtYWxpemUoZmlyc3QsIHNlY29uZCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3QudmFsdWUubGVuZ3RoID09PSAxICYmIHNlY29uZC52YWx1ZS5sZW5ndGggPT09IDEgJiYgZmlyc3QudmFsdWVbMF0gPT09IDAgJiYgc2Vjb25kLnZhbHVlWzBdID09PSAwKSByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIGlmIChzZWNvbmQuc2lnbiAhPT0gZmlyc3Quc2lnbikgcmV0dXJuIGZpcnN0LnNpZ24gPT09IHNpZ24ucG9zaXRpdmUgPyAxIDogLTE7XHJcbiAgICAgICAgICAgICAgICB2YXIgbXVsdGlwbGllciA9IGZpcnN0LnNpZ24gPT09IHNpZ24ucG9zaXRpdmUgPyAxIDogLTE7XHJcbiAgICAgICAgICAgICAgICB2YXIgYSA9IGZpcnN0LnZhbHVlLCBiID0gc2Vjb25kLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IGEubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYVtpXSA+IGJbaV0pIHJldHVybiAxICogbXVsdGlwbGllcjtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYltpXSA+IGFbaV0pIHJldHVybiAtMSAqIG11bHRpcGxpZXI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY29tcGFyZVRvOiBmdW5jdGlvbihuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5jb21wYXJlKG4sIG0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjb21wYXJlQWJzOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gc2VsZiwgc2Vjb25kO1xyXG4gICAgICAgICAgICAgICAgaWYgKG0pIChmaXJzdCA9IHBhcnNlKG4pKSAmJiAoc2Vjb25kID0gcGFyc2UobSwgZmlyc3QpKTtcclxuICAgICAgICAgICAgICAgIGVsc2Ugc2Vjb25kID0gcGFyc2UobiwgZmlyc3QpO1xyXG4gICAgICAgICAgICAgICAgZmlyc3Quc2lnbiA9IHNlY29uZC5zaWduID0gc2lnbi5wb3NpdGl2ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmNvbXBhcmUoZmlyc3QsIHNlY29uZCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVxdWFsczogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmNvbXBhcmUobiwgbSkgPT09IDA7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG5vdEVxdWFsczogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAhby5lcXVhbHMobiwgbSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGxlc3NlcjogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmNvbXBhcmUobiwgbSkgPCAwO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBncmVhdGVyOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uY29tcGFyZShuLCBtKSA+IDA7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGdyZWF0ZXJPckVxdWFsczogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmNvbXBhcmUobiwgbSkgPj0gMDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbGVzc2VyT3JFcXVhbHM6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5jb21wYXJlKG4sIG0pIDw9IDA7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGlzUG9zaXRpdmU6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBtIHx8IHNlbGY7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlyc3Quc2lnbiA9PT0gc2lnbi5wb3NpdGl2ZTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgaXNOZWdhdGl2ZTogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IG0gfHwgc2VsZjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmaXJzdC5zaWduID09PSBzaWduLm5lZ2F0aXZlO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBpc0V2ZW46IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBtIHx8IHNlbGY7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlyc3QudmFsdWVbMF0gJSAyID09PSAwO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBpc09kZDogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IG0gfHwgc2VsZjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmaXJzdC52YWx1ZVswXSAlIDIgPT09IDE7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHRvU3RyaW5nOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gbSB8fCBzZWxmO1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0ciA9IFwiXCIsIGxlbiA9IGZpcnN0LnZhbHVlLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChsZW4tLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmaXJzdC52YWx1ZVtsZW5dLnRvU3RyaW5nKCkubGVuZ3RoID09PSA4KSBzdHIgKz0gZmlyc3QudmFsdWVbbGVuXTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHN0ciArPSAoYmFzZS50b1N0cmluZygpICsgZmlyc3QudmFsdWVbbGVuXSkuc2xpY2UoLWxvZ0Jhc2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKHN0clswXSA9PT0gXCIwXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHIgPSBzdHIuc2xpY2UoMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIXN0ci5sZW5ndGgpIHN0ciA9IFwiMFwiO1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0ciA9PT0gXCIwXCIpIHJldHVybiBzdHI7XHJcbiAgICAgICAgICAgICAgICB2YXIgcyA9IGZpcnN0LnNpZ24gPT09IHNpZ24ucG9zaXRpdmUgPyBcIlwiIDogXCItXCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcyArIHN0cjtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdG9KU051bWJlcjogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiArby50b1N0cmluZyhtKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdmFsdWVPZjogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLnRvSlNOdW1iZXIobSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBvO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgWkVSTyA9IGJpZ0ludChbMF0sIHNpZ24ucG9zaXRpdmUpO1xyXG4gICAgdmFyIE9ORSA9IGJpZ0ludChbMV0sIHNpZ24ucG9zaXRpdmUpO1xyXG4gICAgdmFyIE1JTlVTX09ORSA9IGJpZ0ludChbMV0sIHNpZ24ubmVnYXRpdmUpO1xyXG5cclxuICAgIHZhciBwYXJzZUJhc2UgPSBmdW5jdGlvbiAodGV4dCwgYmFzZSkge1xyXG4gICAgICAgIGJhc2UgPSBwYXJzZShiYXNlKTtcclxuICAgICAgICB2YXIgdmFsID0gWkVSTztcclxuICAgICAgICB2YXIgZGlnaXRzID0gW107XHJcbiAgICAgICAgdmFyIGk7XHJcbiAgICAgICAgdmFyIGlzTmVnYXRpdmUgPSBmYWxzZTtcclxuICAgICAgICBmdW5jdGlvbiBwYXJzZVRva2VuKHRleHQpIHtcclxuICAgICAgICAgICAgdmFyIGMgPSB0ZXh0W2ldLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIGlmIChpID09PSAwICYmIHRleHRbaV0gPT09IFwiLVwiKSB7XHJcbiAgICAgICAgICAgICAgICBpc05lZ2F0aXZlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoL1swLTldLy50ZXN0KGMpKSBkaWdpdHMucHVzaChwYXJzZShjKSk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKC9bYS16XS8udGVzdChjKSkgZGlnaXRzLnB1c2gocGFyc2UoYy5jaGFyQ29kZUF0KDApIC0gODcpKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAoYyA9PT0gXCI8XCIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBzdGFydCA9IGk7XHJcbiAgICAgICAgICAgICAgICBkbyBpKys7IHdoaWxlICh0ZXh0W2ldICE9PSBcIj5cIik7XHJcbiAgICAgICAgICAgICAgICBkaWdpdHMucHVzaChwYXJzZSh0ZXh0LnNsaWNlKHN0YXJ0ICsgMSwgaSkpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvcihjICsgXCIgaXMgbm90IGEgdmFsaWQgY2hhcmFjdGVyXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGV4dC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBwYXJzZVRva2VuKHRleHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBkaWdpdHMucmV2ZXJzZSgpO1xyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBkaWdpdHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFsID0gdmFsLmFkZChkaWdpdHNbaV0udGltZXMoYmFzZS5wb3coaSkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGlzTmVnYXRpdmUgPyAtdmFsIDogdmFsO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBmblJldHVybiA9IGZ1bmN0aW9uIChhLCBiKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBhID09PSBcInVuZGVmaW5lZFwiKSByZXR1cm4gWkVSTztcclxuICAgICAgICBpZiAodHlwZW9mIGIgIT09IFwidW5kZWZpbmVkXCIpIHJldHVybiBwYXJzZUJhc2UoYSwgYik7XHJcbiAgICAgICAgcmV0dXJuIHBhcnNlKGEpO1xyXG4gICAgfTtcclxuICAgIGZuUmV0dXJuLnplcm8gPSBaRVJPO1xyXG4gICAgZm5SZXR1cm4ub25lID0gT05FO1xyXG4gICAgZm5SZXR1cm4ubWludXNPbmUgPSBNSU5VU19PTkU7XHJcbiAgICByZXR1cm4gZm5SZXR1cm47XHJcbn0pKCk7XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBiaWdJbnQ7XHJcbn0iLCIvKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxmZXJvc3NAZmVyb3NzLm9yZz4gPGh0dHA6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG5cbnZhciBiYXNlNjQgPSByZXF1aXJlKCdiYXNlNjQtanMnKVxudmFyIGllZWU3NTQgPSByZXF1aXJlKCdpZWVlNzU0JylcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFUyA9IDUwXG5CdWZmZXIucG9vbFNpemUgPSA4MTkyXG5cbi8qKlxuICogSWYgYEJ1ZmZlci5fdXNlVHlwZWRBcnJheXNgOlxuICogICA9PT0gdHJ1ZSAgICBVc2UgVWludDhBcnJheSBpbXBsZW1lbnRhdGlvbiAoZmFzdGVzdClcbiAqICAgPT09IGZhbHNlICAgVXNlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiAoY29tcGF0aWJsZSBkb3duIHRvIElFNilcbiAqL1xuQnVmZmVyLl91c2VUeXBlZEFycmF5cyA9IChmdW5jdGlvbiAoKSB7XG4gIC8vIERldGVjdCBpZiBicm93c2VyIHN1cHBvcnRzIFR5cGVkIEFycmF5cy4gU3VwcG9ydGVkIGJyb3dzZXJzIGFyZSBJRSAxMCssIEZpcmVmb3ggNCssXG4gIC8vIENocm9tZSA3KywgU2FmYXJpIDUuMSssIE9wZXJhIDExLjYrLCBpT1MgNC4yKy4gSWYgdGhlIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBhZGRpbmdcbiAgLy8gcHJvcGVydGllcyB0byBgVWludDhBcnJheWAgaW5zdGFuY2VzLCB0aGVuIHRoYXQncyB0aGUgc2FtZSBhcyBubyBgVWludDhBcnJheWAgc3VwcG9ydFxuICAvLyBiZWNhdXNlIHdlIG5lZWQgdG8gYmUgYWJsZSB0byBhZGQgYWxsIHRoZSBub2RlIEJ1ZmZlciBBUEkgbWV0aG9kcy4gVGhpcyBpcyBhbiBpc3N1ZVxuICAvLyBpbiBGaXJlZm94IDQtMjkuIE5vdyBmaXhlZDogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4XG4gIHRyeSB7XG4gICAgdmFyIGJ1ZiA9IG5ldyBBcnJheUJ1ZmZlcigwKVxuICAgIHZhciBhcnIgPSBuZXcgVWludDhBcnJheShidWYpXG4gICAgYXJyLmZvbyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH1cbiAgICByZXR1cm4gNDIgPT09IGFyci5mb28oKSAmJlxuICAgICAgICB0eXBlb2YgYXJyLnN1YmFycmF5ID09PSAnZnVuY3Rpb24nIC8vIENocm9tZSA5LTEwIGxhY2sgYHN1YmFycmF5YFxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn0pKClcblxuLyoqXG4gKiBDbGFzczogQnVmZmVyXG4gKiA9PT09PT09PT09PT09XG4gKlxuICogVGhlIEJ1ZmZlciBjb25zdHJ1Y3RvciByZXR1cm5zIGluc3RhbmNlcyBvZiBgVWludDhBcnJheWAgdGhhdCBhcmUgYXVnbWVudGVkXG4gKiB3aXRoIGZ1bmN0aW9uIHByb3BlcnRpZXMgZm9yIGFsbCB0aGUgbm9kZSBgQnVmZmVyYCBBUEkgZnVuY3Rpb25zLiBXZSB1c2VcbiAqIGBVaW50OEFycmF5YCBzbyB0aGF0IHNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0IHJldHVybnNcbiAqIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIEJ5IGF1Z21lbnRpbmcgdGhlIGluc3RhbmNlcywgd2UgY2FuIGF2b2lkIG1vZGlmeWluZyB0aGUgYFVpbnQ4QXJyYXlgXG4gKiBwcm90b3R5cGUuXG4gKi9cbmZ1bmN0aW9uIEJ1ZmZlciAoc3ViamVjdCwgZW5jb2RpbmcsIG5vWmVybykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQnVmZmVyKSlcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcihzdWJqZWN0LCBlbmNvZGluZywgbm9aZXJvKVxuXG4gIHZhciB0eXBlID0gdHlwZW9mIHN1YmplY3RcblxuICAvLyBXb3JrYXJvdW5kOiBub2RlJ3MgYmFzZTY0IGltcGxlbWVudGF0aW9uIGFsbG93cyBmb3Igbm9uLXBhZGRlZCBzdHJpbmdzXG4gIC8vIHdoaWxlIGJhc2U2NC1qcyBkb2VzIG5vdC5cbiAgaWYgKGVuY29kaW5nID09PSAnYmFzZTY0JyAmJiB0eXBlID09PSAnc3RyaW5nJykge1xuICAgIHN1YmplY3QgPSBzdHJpbmd0cmltKHN1YmplY3QpXG4gICAgd2hpbGUgKHN1YmplY3QubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgICAgc3ViamVjdCA9IHN1YmplY3QgKyAnPSdcbiAgICB9XG4gIH1cblxuICAvLyBGaW5kIHRoZSBsZW5ndGhcbiAgdmFyIGxlbmd0aFxuICBpZiAodHlwZSA9PT0gJ251bWJlcicpXG4gICAgbGVuZ3RoID0gY29lcmNlKHN1YmplY3QpXG4gIGVsc2UgaWYgKHR5cGUgPT09ICdzdHJpbmcnKVxuICAgIGxlbmd0aCA9IEJ1ZmZlci5ieXRlTGVuZ3RoKHN1YmplY3QsIGVuY29kaW5nKVxuICBlbHNlIGlmICh0eXBlID09PSAnb2JqZWN0JylcbiAgICBsZW5ndGggPSBjb2VyY2Uoc3ViamVjdC5sZW5ndGgpIC8vIGFzc3VtZSB0aGF0IG9iamVjdCBpcyBhcnJheS1saWtlXG4gIGVsc2VcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZpcnN0IGFyZ3VtZW50IG5lZWRzIHRvIGJlIGEgbnVtYmVyLCBhcnJheSBvciBzdHJpbmcuJylcblxuICB2YXIgYnVmXG4gIGlmIChCdWZmZXIuX3VzZVR5cGVkQXJyYXlzKSB7XG4gICAgLy8gUHJlZmVycmVkOiBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSBmb3IgYmVzdCBwZXJmb3JtYW5jZVxuICAgIGJ1ZiA9IEJ1ZmZlci5fYXVnbWVudChuZXcgVWludDhBcnJheShsZW5ndGgpKVxuICB9IGVsc2Uge1xuICAgIC8vIEZhbGxiYWNrOiBSZXR1cm4gVEhJUyBpbnN0YW5jZSBvZiBCdWZmZXIgKGNyZWF0ZWQgYnkgYG5ld2ApXG4gICAgYnVmID0gdGhpc1xuICAgIGJ1Zi5sZW5ndGggPSBsZW5ndGhcbiAgICBidWYuX2lzQnVmZmVyID0gdHJ1ZVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKEJ1ZmZlci5fdXNlVHlwZWRBcnJheXMgJiYgdHlwZW9mIHN1YmplY3QuYnl0ZUxlbmd0aCA9PT0gJ251bWJlcicpIHtcbiAgICAvLyBTcGVlZCBvcHRpbWl6YXRpb24gLS0gdXNlIHNldCBpZiB3ZSdyZSBjb3B5aW5nIGZyb20gYSB0eXBlZCBhcnJheVxuICAgIGJ1Zi5fc2V0KHN1YmplY3QpXG4gIH0gZWxzZSBpZiAoaXNBcnJheWlzaChzdWJqZWN0KSkge1xuICAgIC8vIFRyZWF0IGFycmF5LWlzaCBvYmplY3RzIGFzIGEgYnl0ZSBhcnJheVxuICAgIGlmIChCdWZmZXIuaXNCdWZmZXIoc3ViamVjdCkpIHtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKylcbiAgICAgICAgYnVmW2ldID0gc3ViamVjdC5yZWFkVUludDgoaSlcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKVxuICAgICAgICBidWZbaV0gPSAoKHN1YmplY3RbaV0gJSAyNTYpICsgMjU2KSAlIDI1NlxuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlID09PSAnc3RyaW5nJykge1xuICAgIGJ1Zi53cml0ZShzdWJqZWN0LCAwLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnbnVtYmVyJyAmJiAhQnVmZmVyLl91c2VUeXBlZEFycmF5cyAmJiAhbm9aZXJvKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBidWZbaV0gPSAwXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ1ZlxufVxuXG4vLyBTVEFUSUMgTUVUSE9EU1xuLy8gPT09PT09PT09PT09PT1cblxuQnVmZmVyLmlzRW5jb2RpbmcgPSBmdW5jdGlvbiAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgIGNhc2UgJ3Jhdyc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uIChiKSB7XG4gIHJldHVybiAhIShiICE9PSBudWxsICYmIGIgIT09IHVuZGVmaW5lZCAmJiBiLl9pc0J1ZmZlcilcbn1cblxuQnVmZmVyLmJ5dGVMZW5ndGggPSBmdW5jdGlvbiAoc3RyLCBlbmNvZGluZykge1xuICB2YXIgcmV0XG4gIHN0ciA9IHN0ci50b1N0cmluZygpXG4gIHN3aXRjaCAoZW5jb2RpbmcgfHwgJ3V0ZjgnKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGggLyAyXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIHJldCA9IHV0ZjhUb0J5dGVzKHN0cikubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ3Jhdyc6XG4gICAgICByZXQgPSBzdHIubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICByZXQgPSBiYXNlNjRUb0J5dGVzKHN0cikubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXQgPSBzdHIubGVuZ3RoICogMlxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nJylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiAobGlzdCwgdG90YWxMZW5ndGgpIHtcbiAgYXNzZXJ0KGlzQXJyYXkobGlzdCksICdVc2FnZTogQnVmZmVyLmNvbmNhdChsaXN0WywgbGVuZ3RoXSknKVxuXG4gIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBuZXcgQnVmZmVyKDApXG4gIH0gZWxzZSBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICByZXR1cm4gbGlzdFswXVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKHRvdGFsTGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICB0b3RhbExlbmd0aCA9IDBcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgdG90YWxMZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmID0gbmV3IEJ1ZmZlcih0b3RhbExlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaXRlbSA9IGxpc3RbaV1cbiAgICBpdGVtLmNvcHkoYnVmLCBwb3MpXG4gICAgcG9zICs9IGl0ZW0ubGVuZ3RoXG4gIH1cbiAgcmV0dXJuIGJ1ZlxufVxuXG5CdWZmZXIuY29tcGFyZSA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gIGFzc2VydChCdWZmZXIuaXNCdWZmZXIoYSkgJiYgQnVmZmVyLmlzQnVmZmVyKGIpLCAnQXJndW1lbnRzIG11c3QgYmUgQnVmZmVycycpXG4gIHZhciB4ID0gYS5sZW5ndGhcbiAgdmFyIHkgPSBiLmxlbmd0aFxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gTWF0aC5taW4oeCwgeSk7IGkgPCBsZW4gJiYgYVtpXSA9PT0gYltpXTsgaSsrKSB7fVxuICBpZiAoaSAhPT0gbGVuKSB7XG4gICAgeCA9IGFbaV1cbiAgICB5ID0gYltpXVxuICB9XG4gIGlmICh4IDwgeSkge1xuICAgIHJldHVybiAtMVxuICB9XG4gIGlmICh5IDwgeCkge1xuICAgIHJldHVybiAxXG4gIH1cbiAgcmV0dXJuIDBcbn1cblxuLy8gQlVGRkVSIElOU1RBTkNFIE1FVEhPRFNcbi8vID09PT09PT09PT09PT09PT09PT09PT09XG5cbmZ1bmN0aW9uIGhleFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgb2Zmc2V0ID0gTnVtYmVyKG9mZnNldCkgfHwgMFxuICB2YXIgcmVtYWluaW5nID0gYnVmLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG5cbiAgLy8gbXVzdCBiZSBhbiBldmVuIG51bWJlciBvZiBkaWdpdHNcbiAgdmFyIHN0ckxlbiA9IHN0cmluZy5sZW5ndGhcbiAgYXNzZXJ0KHN0ckxlbiAlIDIgPT09IDAsICdJbnZhbGlkIGhleCBzdHJpbmcnKVxuXG4gIGlmIChsZW5ndGggPiBzdHJMZW4gLyAyKSB7XG4gICAgbGVuZ3RoID0gc3RyTGVuIC8gMlxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgYnl0ZSA9IHBhcnNlSW50KHN0cmluZy5zdWJzdHIoaSAqIDIsIDIpLCAxNilcbiAgICBhc3NlcnQoIWlzTmFOKGJ5dGUpLCAnSW52YWxpZCBoZXggc3RyaW5nJylcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSBieXRlXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gdXRmOFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIGNoYXJzV3JpdHRlbiA9IGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5mdW5jdGlvbiBhc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIGNoYXJzV3JpdHRlbiA9IGJsaXRCdWZmZXIoYXNjaWlUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG4gIHJldHVybiBjaGFyc1dyaXR0ZW5cbn1cblxuZnVuY3Rpb24gYmluYXJ5V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJhc2U2NFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIGNoYXJzV3JpdHRlbiA9IGJsaXRCdWZmZXIoYmFzZTY0VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBibGl0QnVmZmVyKHV0ZjE2bGVUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG4gIHJldHVybiBjaGFyc1dyaXR0ZW5cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZykge1xuICAvLyBTdXBwb3J0IGJvdGggKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKVxuICAvLyBhbmQgdGhlIGxlZ2FjeSAoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0LCBsZW5ndGgpXG4gIGlmIChpc0Zpbml0ZShvZmZzZXQpKSB7XG4gICAgaWYgKCFpc0Zpbml0ZShsZW5ndGgpKSB7XG4gICAgICBlbmNvZGluZyA9IGxlbmd0aFxuICAgICAgbGVuZ3RoID0gdW5kZWZpbmVkXG4gICAgfVxuICB9IGVsc2UgeyAgLy8gbGVnYWN5XG4gICAgdmFyIHN3YXAgPSBlbmNvZGluZ1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgb2Zmc2V0ID0gbGVuZ3RoXG4gICAgbGVuZ3RoID0gc3dhcFxuICB9XG5cbiAgb2Zmc2V0ID0gTnVtYmVyKG9mZnNldCkgfHwgMFxuICB2YXIgcmVtYWluaW5nID0gdGhpcy5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuICBlbmNvZGluZyA9IFN0cmluZyhlbmNvZGluZyB8fCAndXRmOCcpLnRvTG93ZXJDYXNlKClcblxuICB2YXIgcmV0XG4gIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgICAgcmV0ID0gaGV4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgICAgcmV0ID0gdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIHJldCA9IGFzY2lpV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgIHJldCA9IGJpbmFyeVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICByZXQgPSBiYXNlNjRXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0ID0gdXRmMTZsZVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gZW5jb2RpbmcnKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIChlbmNvZGluZywgc3RhcnQsIGVuZCkge1xuICB2YXIgc2VsZiA9IHRoaXNcblxuICBlbmNvZGluZyA9IFN0cmluZyhlbmNvZGluZyB8fCAndXRmOCcpLnRvTG93ZXJDYXNlKClcbiAgc3RhcnQgPSBOdW1iZXIoc3RhcnQpIHx8IDBcbiAgZW5kID0gKGVuZCA9PT0gdW5kZWZpbmVkKSA/IHNlbGYubGVuZ3RoIDogTnVtYmVyKGVuZClcblxuICAvLyBGYXN0cGF0aCBlbXB0eSBzdHJpbmdzXG4gIGlmIChlbmQgPT09IHN0YXJ0KVxuICAgIHJldHVybiAnJ1xuXG4gIHZhciByZXRcbiAgc3dpdGNoIChlbmNvZGluZykge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgICByZXQgPSBoZXhTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgICByZXQgPSB1dGY4U2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYXNjaWknOlxuICAgICAgcmV0ID0gYXNjaWlTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiaW5hcnknOlxuICAgICAgcmV0ID0gYmluYXJ5U2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IGJhc2U2NFNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXQgPSB1dGYxNmxlU2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBlbmNvZGluZycpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIChiKSB7XG4gIGFzc2VydChCdWZmZXIuaXNCdWZmZXIoYiksICdBcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyJylcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpID09PSAwXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuY29tcGFyZSA9IGZ1bmN0aW9uIChiKSB7XG4gIGFzc2VydChCdWZmZXIuaXNCdWZmZXIoYiksICdBcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyJylcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpXG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uICh0YXJnZXQsIHRhcmdldF9zdGFydCwgc3RhcnQsIGVuZCkge1xuICB2YXIgc291cmNlID0gdGhpc1xuXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICghdGFyZ2V0X3N0YXJ0KSB0YXJnZXRfc3RhcnQgPSAwXG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm5cbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgc291cmNlLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBhc3NlcnQoZW5kID49IHN0YXJ0LCAnc291cmNlRW5kIDwgc291cmNlU3RhcnQnKVxuICBhc3NlcnQodGFyZ2V0X3N0YXJ0ID49IDAgJiYgdGFyZ2V0X3N0YXJ0IDwgdGFyZ2V0Lmxlbmd0aCxcbiAgICAgICd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgYXNzZXJ0KHN0YXJ0ID49IDAgJiYgc3RhcnQgPCBzb3VyY2UubGVuZ3RoLCAnc291cmNlU3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGFzc2VydChlbmQgPj0gMCAmJiBlbmQgPD0gc291cmNlLmxlbmd0aCwgJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpXG4gICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRfc3RhcnQgPCBlbmQgLSBzdGFydClcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0ICsgc3RhcnRcblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcblxuICBpZiAobGVuIDwgMTAwIHx8ICFCdWZmZXIuX3VzZVR5cGVkQXJyYXlzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRfc3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRhcmdldC5fc2V0KHRoaXMuc3ViYXJyYXkoc3RhcnQsIHN0YXJ0ICsgbGVuKSwgdGFyZ2V0X3N0YXJ0KVxuICB9XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gYnVmLmxlbmd0aCkge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1Zi5zbGljZShzdGFydCwgZW5kKSlcbiAgfVxufVxuXG5mdW5jdGlvbiB1dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmVzID0gJydcbiAgdmFyIHRtcCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIGlmIChidWZbaV0gPD0gMHg3Rikge1xuICAgICAgcmVzICs9IGRlY29kZVV0ZjhDaGFyKHRtcCkgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgICAgIHRtcCA9ICcnXG4gICAgfSBlbHNlIHtcbiAgICAgIHRtcCArPSAnJScgKyBidWZbaV0udG9TdHJpbmcoMTYpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcyArIGRlY29kZVV0ZjhDaGFyKHRtcClcbn1cblxuZnVuY3Rpb24gYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBiaW5hcnlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHJldHVybiBhc2NpaVNsaWNlKGJ1Ziwgc3RhcnQsIGVuZClcbn1cblxuZnVuY3Rpb24gaGV4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuXG4gIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlblxuXG4gIHZhciBvdXQgPSAnJ1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIG91dCArPSB0b0hleChidWZbaV0pXG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiB1dGYxNmxlU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgYnl0ZXMgPSBidWYuc2xpY2Uoc3RhcnQsIGVuZClcbiAgdmFyIHJlcyA9ICcnXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSArIGJ5dGVzW2kgKyAxXSAqIDI1NilcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbiAoc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgc3RhcnQgPSBjbGFtcChzdGFydCwgbGVuLCAwKVxuICBlbmQgPSBjbGFtcChlbmQsIGxlbiwgbGVuKVxuXG4gIGlmIChCdWZmZXIuX3VzZVR5cGVkQXJyYXlzKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5fYXVnbWVudCh0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpKVxuICB9IGVsc2Uge1xuICAgIHZhciBzbGljZUxlbiA9IGVuZCAtIHN0YXJ0XG4gICAgdmFyIG5ld0J1ZiA9IG5ldyBCdWZmZXIoc2xpY2VMZW4sIHVuZGVmaW5lZCwgdHJ1ZSlcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWNlTGVuOyBpKyspIHtcbiAgICAgIG5ld0J1ZltpXSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgICByZXR1cm4gbmV3QnVmXG4gIH1cbn1cblxuLy8gYGdldGAgd2lsbCBiZSByZW1vdmVkIGluIE5vZGUgMC4xMytcbkJ1ZmZlci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKG9mZnNldCkge1xuICBjb25zb2xlLmxvZygnLmdldCgpIGlzIGRlcHJlY2F0ZWQuIEFjY2VzcyB1c2luZyBhcnJheSBpbmRleGVzIGluc3RlYWQuJylcbiAgcmV0dXJuIHRoaXMucmVhZFVJbnQ4KG9mZnNldClcbn1cblxuLy8gYHNldGAgd2lsbCBiZSByZW1vdmVkIGluIE5vZGUgMC4xMytcbkJ1ZmZlci5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKHYsIG9mZnNldCkge1xuICBjb25zb2xlLmxvZygnLnNldCgpIGlzIGRlcHJlY2F0ZWQuIEFjY2VzcyB1c2luZyBhcnJheSBpbmRleGVzIGluc3RlYWQuJylcbiAgcmV0dXJuIHRoaXMud3JpdGVVSW50OCh2LCBvZmZzZXQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQ4ID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCA8IHRoaXMubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgaWYgKG9mZnNldCA+PSB0aGlzLmxlbmd0aClcbiAgICByZXR1cm5cblxuICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbmZ1bmN0aW9uIHJlYWRVSW50MTYgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMSA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICB2YXIgdmFsXG4gIGlmIChsaXR0bGVFbmRpYW4pIHtcbiAgICB2YWwgPSBidWZbb2Zmc2V0XVxuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAxXSA8PCA4XG4gIH0gZWxzZSB7XG4gICAgdmFsID0gYnVmW29mZnNldF0gPDwgOFxuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAxXVxuICB9XG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gcmVhZFVJbnQxNih0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiByZWFkVUludDE2KHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiByZWFkVUludDMyIChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgdmFyIHZhbFxuICBpZiAobGl0dGxlRW5kaWFuKSB7XG4gICAgaWYgKG9mZnNldCArIDIgPCBsZW4pXG4gICAgICB2YWwgPSBidWZbb2Zmc2V0ICsgMl0gPDwgMTZcbiAgICBpZiAob2Zmc2V0ICsgMSA8IGxlbilcbiAgICAgIHZhbCB8PSBidWZbb2Zmc2V0ICsgMV0gPDwgOFxuICAgIHZhbCB8PSBidWZbb2Zmc2V0XVxuICAgIGlmIChvZmZzZXQgKyAzIDwgbGVuKVxuICAgICAgdmFsID0gdmFsICsgKGJ1ZltvZmZzZXQgKyAzXSA8PCAyNCA+Pj4gMClcbiAgfSBlbHNlIHtcbiAgICBpZiAob2Zmc2V0ICsgMSA8IGxlbilcbiAgICAgIHZhbCA9IGJ1ZltvZmZzZXQgKyAxXSA8PCAxNlxuICAgIGlmIChvZmZzZXQgKyAyIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAyXSA8PCA4XG4gICAgaWYgKG9mZnNldCArIDMgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDNdXG4gICAgdmFsID0gdmFsICsgKGJ1ZltvZmZzZXRdIDw8IDI0ID4+PiAwKVxuICB9XG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyTEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gcmVhZFVJbnQzMih0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiByZWFkVUludDMyKHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQ4ID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsXG4gICAgICAgICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCA8IHRoaXMubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgaWYgKG9mZnNldCA+PSB0aGlzLmxlbmd0aClcbiAgICByZXR1cm5cblxuICB2YXIgbmVnID0gdGhpc1tvZmZzZXRdICYgMHg4MFxuICBpZiAobmVnKVxuICAgIHJldHVybiAoMHhmZiAtIHRoaXNbb2Zmc2V0XSArIDEpICogLTFcbiAgZWxzZVxuICAgIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuZnVuY3Rpb24gcmVhZEludDE2IChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDEgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgdmFyIHZhbCA9IHJlYWRVSW50MTYoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgdHJ1ZSlcbiAgdmFyIG5lZyA9IHZhbCAmIDB4ODAwMFxuICBpZiAobmVnKVxuICAgIHJldHVybiAoMHhmZmZmIC0gdmFsICsgMSkgKiAtMVxuICBlbHNlXG4gICAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHJlYWRJbnQxNih0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHJlYWRJbnQxNih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gcmVhZEludDMyIChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgdmFyIHZhbCA9IHJlYWRVSW50MzIoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgdHJ1ZSlcbiAgdmFyIG5lZyA9IHZhbCAmIDB4ODAwMDAwMDBcbiAgaWYgKG5lZylcbiAgICByZXR1cm4gKDB4ZmZmZmZmZmYgLSB2YWwgKyAxKSAqIC0xXG4gIGVsc2VcbiAgICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gcmVhZEludDMyKHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gcmVhZEludDMyKHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiByZWFkRmxvYXQgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgcmV0dXJuIGllZWU3NTQucmVhZChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiByZWFkRmxvYXQodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiByZWFkRmxvYXQodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHJlYWREb3VibGUgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCArIDcgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgcmV0dXJuIGllZWU3NTQucmVhZChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlTEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gcmVhZERvdWJsZSh0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiByZWFkRG91YmxlKHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICd0cnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmdWludCh2YWx1ZSwgMHhmZilcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpIHJldHVyblxuXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbmZ1bmN0aW9uIHdyaXRlVUludDE2IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDEgPCBidWYubGVuZ3RoLCAndHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnVpbnQodmFsdWUsIDB4ZmZmZilcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4obGVuIC0gb2Zmc2V0LCAyKTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9XG4gICAgICAgICh2YWx1ZSAmICgweGZmIDw8ICg4ICogKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkpKSkgPj4+XG4gICAgICAgICAgICAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSAqIDhcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gd3JpdGVVSW50MzIgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICd0cnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmdWludCh2YWx1ZSwgMHhmZmZmZmZmZilcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4obGVuIC0gb2Zmc2V0LCA0KTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9XG4gICAgICAgICh2YWx1ZSA+Pj4gKGxpdHRsZUVuZGlhbiA/IGkgOiAzIC0gaSkgKiA4KSAmIDB4ZmZcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDggPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmc2ludCh2YWx1ZSwgMHg3ZiwgLTB4ODApXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKVxuICAgIHJldHVyblxuXG4gIGlmICh2YWx1ZSA+PSAwKVxuICAgIHRoaXMud3JpdGVVSW50OCh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydClcbiAgZWxzZVxuICAgIHRoaXMud3JpdGVVSW50OCgweGZmICsgdmFsdWUgKyAxLCBvZmZzZXQsIG5vQXNzZXJ0KVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5mdW5jdGlvbiB3cml0ZUludDE2IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDEgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnNpbnQodmFsdWUsIDB4N2ZmZiwgLTB4ODAwMClcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGlmICh2YWx1ZSA+PSAwKVxuICAgIHdyaXRlVUludDE2KGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydClcbiAgZWxzZVxuICAgIHdyaXRlVUludDE2KGJ1ZiwgMHhmZmZmICsgdmFsdWUgKyAxLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHdyaXRlSW50MzIgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmc2ludCh2YWx1ZSwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZiAodmFsdWUgPj0gMClcbiAgICB3cml0ZVVJbnQzMihidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpXG4gIGVsc2VcbiAgICB3cml0ZVVJbnQzMihidWYsIDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDEsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyTEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gd3JpdGVGbG9hdCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZJRUVFNzU0KHZhbHVlLCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0QkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyA3IDwgYnVmLmxlbmd0aCxcbiAgICAgICAgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZJRUVFNzU0KHZhbHVlLCAxLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCwgLTEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4KVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG4gIHJldHVybiBvZmZzZXQgKyA4XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG4vLyBmaWxsKHZhbHVlLCBzdGFydD0wLCBlbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uICh2YWx1ZSwgc3RhcnQsIGVuZCkge1xuICBpZiAoIXZhbHVlKSB2YWx1ZSA9IDBcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kKSBlbmQgPSB0aGlzLmxlbmd0aFxuXG4gIGFzc2VydChlbmQgPj0gc3RhcnQsICdlbmQgPCBzdGFydCcpXG5cbiAgLy8gRmlsbCAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm5cbiAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICBhc3NlcnQoc3RhcnQgPj0gMCAmJiBzdGFydCA8IHRoaXMubGVuZ3RoLCAnc3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGFzc2VydChlbmQgPj0gMCAmJiBlbmQgPD0gdGhpcy5sZW5ndGgsICdlbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgdmFyIGlcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gdmFsdWVcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGJ5dGVzID0gdXRmOFRvQnl0ZXModmFsdWUudG9TdHJpbmcoKSlcbiAgICB2YXIgbGVuID0gYnl0ZXMubGVuZ3RoXG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgdGhpc1tpXSA9IGJ5dGVzW2kgJSBsZW5dXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgb3V0ID0gW11cbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBvdXRbaV0gPSB0b0hleCh0aGlzW2ldKVxuICAgIGlmIChpID09PSBleHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTKSB7XG4gICAgICBvdXRbaSArIDFdID0gJy4uLidcbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG4gIHJldHVybiAnPEJ1ZmZlciAnICsgb3V0LmpvaW4oJyAnKSArICc+J1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgYEFycmF5QnVmZmVyYCB3aXRoIHRoZSAqY29waWVkKiBtZW1vcnkgb2YgdGhlIGJ1ZmZlciBpbnN0YW5jZS5cbiAqIEFkZGVkIGluIE5vZGUgMC4xMi4gT25seSBhdmFpbGFibGUgaW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0IEFycmF5QnVmZmVyLlxuICovXG5CdWZmZXIucHJvdG90eXBlLnRvQXJyYXlCdWZmZXIgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cykge1xuICAgICAgcmV0dXJuIChuZXcgQnVmZmVyKHRoaXMpKS5idWZmZXJcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGJ1ZiA9IG5ldyBVaW50OEFycmF5KHRoaXMubGVuZ3RoKVxuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGJ1Zi5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgICBidWZbaV0gPSB0aGlzW2ldXG4gICAgICB9XG4gICAgICByZXR1cm4gYnVmLmJ1ZmZlclxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0J1ZmZlci50b0FycmF5QnVmZmVyIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyJylcbiAgfVxufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbnZhciBCUCA9IEJ1ZmZlci5wcm90b3R5cGVcblxuLyoqXG4gKiBBdWdtZW50IGEgVWludDhBcnJheSAqaW5zdGFuY2UqIChub3QgdGhlIFVpbnQ4QXJyYXkgY2xhc3MhKSB3aXRoIEJ1ZmZlciBtZXRob2RzXG4gKi9cbkJ1ZmZlci5fYXVnbWVudCA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgYXJyLl9pc0J1ZmZlciA9IHRydWVcblxuICAvLyBzYXZlIHJlZmVyZW5jZSB0byBvcmlnaW5hbCBVaW50OEFycmF5IGdldC9zZXQgbWV0aG9kcyBiZWZvcmUgb3ZlcndyaXRpbmdcbiAgYXJyLl9nZXQgPSBhcnIuZ2V0XG4gIGFyci5fc2V0ID0gYXJyLnNldFxuXG4gIC8vIGRlcHJlY2F0ZWQsIHdpbGwgYmUgcmVtb3ZlZCBpbiBub2RlIDAuMTMrXG4gIGFyci5nZXQgPSBCUC5nZXRcbiAgYXJyLnNldCA9IEJQLnNldFxuXG4gIGFyci53cml0ZSA9IEJQLndyaXRlXG4gIGFyci50b1N0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0xvY2FsZVN0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0pTT04gPSBCUC50b0pTT05cbiAgYXJyLmVxdWFscyA9IEJQLmVxdWFsc1xuICBhcnIuY29tcGFyZSA9IEJQLmNvbXBhcmVcbiAgYXJyLmNvcHkgPSBCUC5jb3B5XG4gIGFyci5zbGljZSA9IEJQLnNsaWNlXG4gIGFyci5yZWFkVUludDggPSBCUC5yZWFkVUludDhcbiAgYXJyLnJlYWRVSW50MTZMRSA9IEJQLnJlYWRVSW50MTZMRVxuICBhcnIucmVhZFVJbnQxNkJFID0gQlAucmVhZFVJbnQxNkJFXG4gIGFyci5yZWFkVUludDMyTEUgPSBCUC5yZWFkVUludDMyTEVcbiAgYXJyLnJlYWRVSW50MzJCRSA9IEJQLnJlYWRVSW50MzJCRVxuICBhcnIucmVhZEludDggPSBCUC5yZWFkSW50OFxuICBhcnIucmVhZEludDE2TEUgPSBCUC5yZWFkSW50MTZMRVxuICBhcnIucmVhZEludDE2QkUgPSBCUC5yZWFkSW50MTZCRVxuICBhcnIucmVhZEludDMyTEUgPSBCUC5yZWFkSW50MzJMRVxuICBhcnIucmVhZEludDMyQkUgPSBCUC5yZWFkSW50MzJCRVxuICBhcnIucmVhZEZsb2F0TEUgPSBCUC5yZWFkRmxvYXRMRVxuICBhcnIucmVhZEZsb2F0QkUgPSBCUC5yZWFkRmxvYXRCRVxuICBhcnIucmVhZERvdWJsZUxFID0gQlAucmVhZERvdWJsZUxFXG4gIGFyci5yZWFkRG91YmxlQkUgPSBCUC5yZWFkRG91YmxlQkVcbiAgYXJyLndyaXRlVUludDggPSBCUC53cml0ZVVJbnQ4XG4gIGFyci53cml0ZVVJbnQxNkxFID0gQlAud3JpdGVVSW50MTZMRVxuICBhcnIud3JpdGVVSW50MTZCRSA9IEJQLndyaXRlVUludDE2QkVcbiAgYXJyLndyaXRlVUludDMyTEUgPSBCUC53cml0ZVVJbnQzMkxFXG4gIGFyci53cml0ZVVJbnQzMkJFID0gQlAud3JpdGVVSW50MzJCRVxuICBhcnIud3JpdGVJbnQ4ID0gQlAud3JpdGVJbnQ4XG4gIGFyci53cml0ZUludDE2TEUgPSBCUC53cml0ZUludDE2TEVcbiAgYXJyLndyaXRlSW50MTZCRSA9IEJQLndyaXRlSW50MTZCRVxuICBhcnIud3JpdGVJbnQzMkxFID0gQlAud3JpdGVJbnQzMkxFXG4gIGFyci53cml0ZUludDMyQkUgPSBCUC53cml0ZUludDMyQkVcbiAgYXJyLndyaXRlRmxvYXRMRSA9IEJQLndyaXRlRmxvYXRMRVxuICBhcnIud3JpdGVGbG9hdEJFID0gQlAud3JpdGVGbG9hdEJFXG4gIGFyci53cml0ZURvdWJsZUxFID0gQlAud3JpdGVEb3VibGVMRVxuICBhcnIud3JpdGVEb3VibGVCRSA9IEJQLndyaXRlRG91YmxlQkVcbiAgYXJyLmZpbGwgPSBCUC5maWxsXG4gIGFyci5pbnNwZWN0ID0gQlAuaW5zcGVjdFxuICBhcnIudG9BcnJheUJ1ZmZlciA9IEJQLnRvQXJyYXlCdWZmZXJcblxuICByZXR1cm4gYXJyXG59XG5cbmZ1bmN0aW9uIHN0cmluZ3RyaW0gKHN0cikge1xuICBpZiAoc3RyLnRyaW0pIHJldHVybiBzdHIudHJpbSgpXG4gIHJldHVybiBzdHIucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpXG59XG5cbi8vIHNsaWNlKHN0YXJ0LCBlbmQpXG5mdW5jdGlvbiBjbGFtcCAoaW5kZXgsIGxlbiwgZGVmYXVsdFZhbHVlKSB7XG4gIGlmICh0eXBlb2YgaW5kZXggIT09ICdudW1iZXInKSByZXR1cm4gZGVmYXVsdFZhbHVlXG4gIGluZGV4ID0gfn5pbmRleDsgIC8vIENvZXJjZSB0byBpbnRlZ2VyLlxuICBpZiAoaW5kZXggPj0gbGVuKSByZXR1cm4gbGVuXG4gIGlmIChpbmRleCA+PSAwKSByZXR1cm4gaW5kZXhcbiAgaW5kZXggKz0gbGVuXG4gIGlmIChpbmRleCA+PSAwKSByZXR1cm4gaW5kZXhcbiAgcmV0dXJuIDBcbn1cblxuZnVuY3Rpb24gY29lcmNlIChsZW5ndGgpIHtcbiAgLy8gQ29lcmNlIGxlbmd0aCB0byBhIG51bWJlciAocG9zc2libHkgTmFOKSwgcm91bmQgdXBcbiAgLy8gaW4gY2FzZSBpdCdzIGZyYWN0aW9uYWwgKGUuZy4gMTIzLjQ1NikgdGhlbiBkbyBhXG4gIC8vIGRvdWJsZSBuZWdhdGUgdG8gY29lcmNlIGEgTmFOIHRvIDAuIEVhc3ksIHJpZ2h0P1xuICBsZW5ndGggPSB+fk1hdGguY2VpbCgrbGVuZ3RoKVxuICByZXR1cm4gbGVuZ3RoIDwgMCA/IDAgOiBsZW5ndGhcbn1cblxuZnVuY3Rpb24gaXNBcnJheSAoc3ViamVjdCkge1xuICByZXR1cm4gKEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHN1YmplY3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHN1YmplY3QpID09PSAnW29iamVjdCBBcnJheV0nXG4gIH0pKHN1YmplY3QpXG59XG5cbmZ1bmN0aW9uIGlzQXJyYXlpc2ggKHN1YmplY3QpIHtcbiAgcmV0dXJuIGlzQXJyYXkoc3ViamVjdCkgfHwgQnVmZmVyLmlzQnVmZmVyKHN1YmplY3QpIHx8XG4gICAgICBzdWJqZWN0ICYmIHR5cGVvZiBzdWJqZWN0ID09PSAnb2JqZWN0JyAmJlxuICAgICAgdHlwZW9mIHN1YmplY3QubGVuZ3RoID09PSAnbnVtYmVyJ1xufVxuXG5mdW5jdGlvbiB0b0hleCAobikge1xuICBpZiAobiA8IDE2KSByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNilcbiAgcmV0dXJuIG4udG9TdHJpbmcoMTYpXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGIgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGlmIChiIDw9IDB4N0YpIHtcbiAgICAgIGJ5dGVBcnJheS5wdXNoKGIpXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBzdGFydCA9IGlcbiAgICAgIGlmIChiID49IDB4RDgwMCAmJiBiIDw9IDB4REZGRikgaSsrXG4gICAgICB2YXIgaCA9IGVuY29kZVVSSUNvbXBvbmVudChzdHIuc2xpY2Uoc3RhcnQsIGkrMSkpLnN1YnN0cigxKS5zcGxpdCgnJScpXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGgubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgYnl0ZUFycmF5LnB1c2gocGFyc2VJbnQoaFtqXSwgMTYpKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGFzY2lpVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIC8vIE5vZGUncyBjb2RlIHNlZW1zIHRvIGJlIGRvaW5nIHRoaXMgYW5kIG5vdCAmIDB4N0YuLlxuICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpICYgMHhGRilcbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGMsIGhpLCBsb1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBoaSA9IGMgPj4gOFxuICAgIGxvID0gYyAlIDI1NlxuICAgIGJ5dGVBcnJheS5wdXNoKGxvKVxuICAgIGJ5dGVBcnJheS5wdXNoKGhpKVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBiYXNlNjRUb0J5dGVzIChzdHIpIHtcbiAgcmV0dXJuIGJhc2U2NC50b0J5dGVBcnJheShzdHIpXG59XG5cbmZ1bmN0aW9uIGJsaXRCdWZmZXIgKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKVxuICAgICAgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiBkZWNvZGVVdGY4Q2hhciAoc3RyKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChzdHIpXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4RkZGRCkgLy8gVVRGIDggaW52YWxpZCBjaGFyXG4gIH1cbn1cblxuLypcbiAqIFdlIGhhdmUgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIHZhbHVlIGlzIGEgdmFsaWQgaW50ZWdlci4gVGhpcyBtZWFucyB0aGF0IGl0XG4gKiBpcyBub24tbmVnYXRpdmUuIEl0IGhhcyBubyBmcmFjdGlvbmFsIGNvbXBvbmVudCBhbmQgdGhhdCBpdCBkb2VzIG5vdFxuICogZXhjZWVkIHRoZSBtYXhpbXVtIGFsbG93ZWQgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIHZlcmlmdWludCAodmFsdWUsIG1heCkge1xuICBhc3NlcnQodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJywgJ2Nhbm5vdCB3cml0ZSBhIG5vbi1udW1iZXIgYXMgYSBudW1iZXInKVxuICBhc3NlcnQodmFsdWUgPj0gMCwgJ3NwZWNpZmllZCBhIG5lZ2F0aXZlIHZhbHVlIGZvciB3cml0aW5nIGFuIHVuc2lnbmVkIHZhbHVlJylcbiAgYXNzZXJ0KHZhbHVlIDw9IG1heCwgJ3ZhbHVlIGlzIGxhcmdlciB0aGFuIG1heGltdW0gdmFsdWUgZm9yIHR5cGUnKVxuICBhc3NlcnQoTWF0aC5mbG9vcih2YWx1ZSkgPT09IHZhbHVlLCAndmFsdWUgaGFzIGEgZnJhY3Rpb25hbCBjb21wb25lbnQnKVxufVxuXG5mdW5jdGlvbiB2ZXJpZnNpbnQgKHZhbHVlLCBtYXgsIG1pbikge1xuICBhc3NlcnQodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJywgJ2Nhbm5vdCB3cml0ZSBhIG5vbi1udW1iZXIgYXMgYSBudW1iZXInKVxuICBhc3NlcnQodmFsdWUgPD0gbWF4LCAndmFsdWUgbGFyZ2VyIHRoYW4gbWF4aW11bSBhbGxvd2VkIHZhbHVlJylcbiAgYXNzZXJ0KHZhbHVlID49IG1pbiwgJ3ZhbHVlIHNtYWxsZXIgdGhhbiBtaW5pbXVtIGFsbG93ZWQgdmFsdWUnKVxuICBhc3NlcnQoTWF0aC5mbG9vcih2YWx1ZSkgPT09IHZhbHVlLCAndmFsdWUgaGFzIGEgZnJhY3Rpb25hbCBjb21wb25lbnQnKVxufVxuXG5mdW5jdGlvbiB2ZXJpZklFRUU3NTQgKHZhbHVlLCBtYXgsIG1pbikge1xuICBhc3NlcnQodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJywgJ2Nhbm5vdCB3cml0ZSBhIG5vbi1udW1iZXIgYXMgYSBudW1iZXInKVxuICBhc3NlcnQodmFsdWUgPD0gbWF4LCAndmFsdWUgbGFyZ2VyIHRoYW4gbWF4aW11bSBhbGxvd2VkIHZhbHVlJylcbiAgYXNzZXJ0KHZhbHVlID49IG1pbiwgJ3ZhbHVlIHNtYWxsZXIgdGhhbiBtaW5pbXVtIGFsbG93ZWQgdmFsdWUnKVxufVxuXG5mdW5jdGlvbiBhc3NlcnQgKHRlc3QsIG1lc3NhZ2UpIHtcbiAgaWYgKCF0ZXN0KSB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSB8fCAnRmFpbGVkIGFzc2VydGlvbicpXG59XG4iLCJ2YXIgbG9va3VwID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nO1xuXG47KGZ1bmN0aW9uIChleHBvcnRzKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuICB2YXIgQXJyID0gKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJylcbiAgICA/IFVpbnQ4QXJyYXlcbiAgICA6IEFycmF5XG5cblx0dmFyIFBMVVMgICA9ICcrJy5jaGFyQ29kZUF0KDApXG5cdHZhciBTTEFTSCAgPSAnLycuY2hhckNvZGVBdCgwKVxuXHR2YXIgTlVNQkVSID0gJzAnLmNoYXJDb2RlQXQoMClcblx0dmFyIExPV0VSICA9ICdhJy5jaGFyQ29kZUF0KDApXG5cdHZhciBVUFBFUiAgPSAnQScuY2hhckNvZGVBdCgwKVxuXG5cdGZ1bmN0aW9uIGRlY29kZSAoZWx0KSB7XG5cdFx0dmFyIGNvZGUgPSBlbHQuY2hhckNvZGVBdCgwKVxuXHRcdGlmIChjb2RlID09PSBQTFVTKVxuXHRcdFx0cmV0dXJuIDYyIC8vICcrJ1xuXHRcdGlmIChjb2RlID09PSBTTEFTSClcblx0XHRcdHJldHVybiA2MyAvLyAnLydcblx0XHRpZiAoY29kZSA8IE5VTUJFUilcblx0XHRcdHJldHVybiAtMSAvL25vIG1hdGNoXG5cdFx0aWYgKGNvZGUgPCBOVU1CRVIgKyAxMClcblx0XHRcdHJldHVybiBjb2RlIC0gTlVNQkVSICsgMjYgKyAyNlxuXHRcdGlmIChjb2RlIDwgVVBQRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gVVBQRVJcblx0XHRpZiAoY29kZSA8IExPV0VSICsgMjYpXG5cdFx0XHRyZXR1cm4gY29kZSAtIExPV0VSICsgMjZcblx0fVxuXG5cdGZ1bmN0aW9uIGI2NFRvQnl0ZUFycmF5IChiNjQpIHtcblx0XHR2YXIgaSwgaiwgbCwgdG1wLCBwbGFjZUhvbGRlcnMsIGFyclxuXG5cdFx0aWYgKGI2NC5sZW5ndGggJSA0ID4gMCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0Jylcblx0XHR9XG5cblx0XHQvLyB0aGUgbnVtYmVyIG9mIGVxdWFsIHNpZ25zIChwbGFjZSBob2xkZXJzKVxuXHRcdC8vIGlmIHRoZXJlIGFyZSB0d28gcGxhY2Vob2xkZXJzLCB0aGFuIHRoZSB0d28gY2hhcmFjdGVycyBiZWZvcmUgaXRcblx0XHQvLyByZXByZXNlbnQgb25lIGJ5dGVcblx0XHQvLyBpZiB0aGVyZSBpcyBvbmx5IG9uZSwgdGhlbiB0aGUgdGhyZWUgY2hhcmFjdGVycyBiZWZvcmUgaXQgcmVwcmVzZW50IDIgYnl0ZXNcblx0XHQvLyB0aGlzIGlzIGp1c3QgYSBjaGVhcCBoYWNrIHRvIG5vdCBkbyBpbmRleE9mIHR3aWNlXG5cdFx0dmFyIGxlbiA9IGI2NC5sZW5ndGhcblx0XHRwbGFjZUhvbGRlcnMgPSAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMikgPyAyIDogJz0nID09PSBiNjQuY2hhckF0KGxlbiAtIDEpID8gMSA6IDBcblxuXHRcdC8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuXHRcdGFyciA9IG5ldyBBcnIoYjY0Lmxlbmd0aCAqIDMgLyA0IC0gcGxhY2VIb2xkZXJzKVxuXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuXHRcdGwgPSBwbGFjZUhvbGRlcnMgPiAwID8gYjY0Lmxlbmd0aCAtIDQgOiBiNjQubGVuZ3RoXG5cblx0XHR2YXIgTCA9IDBcblxuXHRcdGZ1bmN0aW9uIHB1c2ggKHYpIHtcblx0XHRcdGFycltMKytdID0gdlxuXHRcdH1cblxuXHRcdGZvciAoaSA9IDAsIGogPSAwOyBpIDwgbDsgaSArPSA0LCBqICs9IDMpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTgpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgMTIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPDwgNikgfCBkZWNvZGUoYjY0LmNoYXJBdChpICsgMykpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDAwMCkgPj4gMTYpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDApID4+IDgpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fVxuXG5cdFx0aWYgKHBsYWNlSG9sZGVycyA9PT0gMikge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAyKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpID4+IDQpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fSBlbHNlIGlmIChwbGFjZUhvbGRlcnMgPT09IDEpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTApIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgNCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA+PiAyKVxuXHRcdFx0cHVzaCgodG1wID4+IDgpICYgMHhGRilcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRyZXR1cm4gYXJyXG5cdH1cblxuXHRmdW5jdGlvbiB1aW50OFRvQmFzZTY0ICh1aW50OCkge1xuXHRcdHZhciBpLFxuXHRcdFx0ZXh0cmFCeXRlcyA9IHVpbnQ4Lmxlbmd0aCAlIDMsIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG5cdFx0XHRvdXRwdXQgPSBcIlwiLFxuXHRcdFx0dGVtcCwgbGVuZ3RoXG5cblx0XHRmdW5jdGlvbiBlbmNvZGUgKG51bSkge1xuXHRcdFx0cmV0dXJuIGxvb2t1cC5jaGFyQXQobnVtKVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG5cdFx0XHRyZXR1cm4gZW5jb2RlKG51bSA+PiAxOCAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiAxMiAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiA2ICYgMHgzRikgKyBlbmNvZGUobnVtICYgMHgzRilcblx0XHR9XG5cblx0XHQvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG5cdFx0Zm9yIChpID0gMCwgbGVuZ3RoID0gdWludDgubGVuZ3RoIC0gZXh0cmFCeXRlczsgaSA8IGxlbmd0aDsgaSArPSAzKSB7XG5cdFx0XHR0ZW1wID0gKHVpbnQ4W2ldIDw8IDE2KSArICh1aW50OFtpICsgMV0gPDwgOCkgKyAodWludDhbaSArIDJdKVxuXHRcdFx0b3V0cHV0ICs9IHRyaXBsZXRUb0Jhc2U2NCh0ZW1wKVxuXHRcdH1cblxuXHRcdC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcblx0XHRzd2l0Y2ggKGV4dHJhQnl0ZXMpIHtcblx0XHRcdGNhc2UgMTpcblx0XHRcdFx0dGVtcCA9IHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUodGVtcCA+PiAyKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9PSdcblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgMjpcblx0XHRcdFx0dGVtcCA9ICh1aW50OFt1aW50OC5sZW5ndGggLSAyXSA8PCA4KSArICh1aW50OFt1aW50OC5sZW5ndGggLSAxXSlcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDEwKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wID4+IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA8PCAyKSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSAnPSdcblx0XHRcdFx0YnJlYWtcblx0XHR9XG5cblx0XHRyZXR1cm4gb3V0cHV0XG5cdH1cblxuXHRleHBvcnRzLnRvQnl0ZUFycmF5ID0gYjY0VG9CeXRlQXJyYXlcblx0ZXhwb3J0cy5mcm9tQnl0ZUFycmF5ID0gdWludDhUb0Jhc2U2NFxufSh0eXBlb2YgZXhwb3J0cyA9PT0gJ3VuZGVmaW5lZCcgPyAodGhpcy5iYXNlNjRqcyA9IHt9KSA6IGV4cG9ydHMpKVxuIiwiZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24oYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSxcbiAgICAgIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDEsXG4gICAgICBlTWF4ID0gKDEgPDwgZUxlbikgLSAxLFxuICAgICAgZUJpYXMgPSBlTWF4ID4+IDEsXG4gICAgICBuQml0cyA9IC03LFxuICAgICAgaSA9IGlzTEUgPyAobkJ5dGVzIC0gMSkgOiAwLFxuICAgICAgZCA9IGlzTEUgPyAtMSA6IDEsXG4gICAgICBzID0gYnVmZmVyW29mZnNldCArIGldO1xuXG4gIGkgKz0gZDtcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKTtcbiAgcyA+Pj0gKC1uQml0cyk7XG4gIG5CaXRzICs9IGVMZW47XG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSBlICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpO1xuXG4gIG0gPSBlICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpO1xuICBlID4+PSAoLW5CaXRzKTtcbiAgbkJpdHMgKz0gbUxlbjtcbiAgZm9yICg7IG5CaXRzID4gMDsgbSA9IG0gKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCk7XG5cbiAgaWYgKGUgPT09IDApIHtcbiAgICBlID0gMSAtIGVCaWFzO1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSk7XG4gIH0gZWxzZSB7XG4gICAgbSA9IG0gKyBNYXRoLnBvdygyLCBtTGVuKTtcbiAgICBlID0gZSAtIGVCaWFzO1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pO1xufTtcblxuZXhwb3J0cy53cml0ZSA9IGZ1bmN0aW9uKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLCBjLFxuICAgICAgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMSxcbiAgICAgIGVNYXggPSAoMSA8PCBlTGVuKSAtIDEsXG4gICAgICBlQmlhcyA9IGVNYXggPj4gMSxcbiAgICAgIHJ0ID0gKG1MZW4gPT09IDIzID8gTWF0aC5wb3coMiwgLTI0KSAtIE1hdGgucG93KDIsIC03NykgOiAwKSxcbiAgICAgIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKSxcbiAgICAgIGQgPSBpc0xFID8gMSA6IC0xLFxuICAgICAgcyA9IHZhbHVlIDwgMCB8fCAodmFsdWUgPT09IDAgJiYgMSAvIHZhbHVlIDwgMCkgPyAxIDogMDtcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKTtcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMDtcbiAgICBlID0gZU1heDtcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMik7XG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tO1xuICAgICAgYyAqPSAyO1xuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gYztcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpO1xuICAgIH1cbiAgICBpZiAodmFsdWUgKiBjID49IDIpIHtcbiAgICAgIGUrKztcbiAgICAgIGMgLz0gMjtcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwO1xuICAgICAgZSA9IGVNYXg7XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICh2YWx1ZSAqIGMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pO1xuICAgICAgZSA9IGUgKyBlQmlhcztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHZhbHVlICogTWF0aC5wb3coMiwgZUJpYXMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pO1xuICAgICAgZSA9IDA7XG4gICAgfVxuICB9XG5cbiAgZm9yICg7IG1MZW4gPj0gODsgYnVmZmVyW29mZnNldCArIGldID0gbSAmIDB4ZmYsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCk7XG5cbiAgZSA9IChlIDw8IG1MZW4pIHwgbTtcbiAgZUxlbiArPSBtTGVuO1xuICBmb3IgKDsgZUxlbiA+IDA7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGUgJiAweGZmLCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpO1xuXG4gIGJ1ZmZlcltvZmZzZXQgKyBpIC0gZF0gfD0gcyAqIDEyODtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAxOiBNdWx0aXBsZXMgb2YgMyBhbmQgNVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5JZiB3ZSBsaXN0IGFsbCB0aGUgbmF0dXJhbCBudW1iZXJzIGJlbG93IDEwIHRoYXQgYXJlIG11bHRpcGxlcyBvZiAzIG9yIDUsIHdlIGdldCAzLCA1LCA2IGFuZCA5LlxuVGhlIHN1bSBvZiB0aGVzZSBtdWx0aXBsZXMgaXMgMjMuXG5cbkZpbmQgdGhlIHN1bSBvZiBhbGwgdGhlIG11bHRpcGxlcyBvZiAzIG9yIDUgYmVsb3cgMTAwMC5cblxuXCJcIlwiXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIHN1bSA9IDBcbiAgZm9yIGkgaW4gWzEuLi4xMF1cbiAgICBpZiAoaSAlIDMgPT0gMCkgb3IgKGkgJSA1ID09IDApXG4gICAgICBzdW0gKz0gaVxuICBlcXVhbChzdW0sIDIzLCBcIlN1bSBvZiBuYXR1cmFsIG51bWJlcnMgPCAxMDogI3tzdW19XCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgc3VtID0gMFxuICBmb3IgaSBpbiBbMS4uLjEwMDBdXG4gICAgaWYgKGkgJSAzID09IDApIG9yIChpICUgNSA9PSAwKVxuICAgICAgc3VtICs9IGlcblxuICByZXR1cm4gc3VtXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAyOiBFdmVuIEZpYm9uYWNjaSBudW1iZXJzXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuRWFjaCBuZXcgdGVybSBpbiB0aGUgRmlib25hY2NpIHNlcXVlbmNlIGlzIGdlbmVyYXRlZCBieSBhZGRpbmcgdGhlIHByZXZpb3VzIHR3byB0ZXJtcy5cbkJ5IHN0YXJ0aW5nIHdpdGggMSBhbmQgMiwgdGhlIGZpcnN0IDEwIHRlcm1zIHdpbGwgYmU6XG5cbjEsIDIsIDMsIDUsIDgsIDEzLCAyMSwgMzQsIDU1LCA4OSwgLi4uXG5cbkJ5IGNvbnNpZGVyaW5nIHRoZSB0ZXJtcyBpbiB0aGUgRmlib25hY2NpIHNlcXVlbmNlIHdob3NlIHZhbHVlcyBkbyBub3QgZXhjZWVkIGZvdXIgbWlsbGlvbixcbmZpbmQgdGhlIHN1bSBvZiB0aGUgZXZlbi12YWx1ZWQgdGVybXMuXG5cblwiXCJcIlxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHByZXYgPSAxXG4gIGN1cnIgPSAxXG4gIHN1bSA9IDBcblxuICB3aGlsZSBjdXJyIDwgNDAwMDAwMFxuICAgIGlmIChjdXJyICUgMikgPT0gMFxuICAgICAgc3VtICs9IGN1cnJcblxuICAgIG5leHQgPSBjdXJyICsgcHJldlxuICAgIHByZXYgPSBjdXJyXG4gICAgY3VyciA9IG5leHRcblxuICByZXR1cm4gc3VtXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAzOiBMYXJnZXN0IHByaW1lIGZhY3RvclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5UaGUgcHJpbWUgZmFjdG9ycyBvZiAxMzE5NSBhcmUgNSwgNywgMTMgYW5kIDI5LlxuXG5XaGF0IGlzIHRoZSBsYXJnZXN0IHByaW1lIGZhY3RvciBvZiB0aGUgbnVtYmVyIDYwMDg1MTQ3NTE0MyA/XG5cblwiXCJcIlxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIFNoYW1lbGVzc2x5IHBpbGZlcmVkL2Fkb3B0ZWQgZnJvbSBodHRwOi8vd3d3LmphdmFzY3JpcHRlci5uZXQvZmFxL251bWJlcmlzcHJpbWUuaHRtXG5cbmxlYXN0RmFjdG9yID0gKG4pIC0+XG4gIHJldHVybiBOYU4gaWYgaXNOYU4obikgb3Igbm90IGlzRmluaXRlKG4pXG4gIHJldHVybiAwIGlmIG4gPT0gMFxuICByZXR1cm4gMSBpZiAobiAlIDEpICE9IDAgb3IgKG4gKiBuKSA8IDJcbiAgcmV0dXJuIDIgaWYgKG4gJSAyKSA9PSAwXG4gIHJldHVybiAzIGlmIChuICUgMykgPT0gMFxuICByZXR1cm4gNSBpZiAobiAlIDUpID09IDBcblxuICBtID0gTWF0aC5zcXJ0IG5cbiAgZm9yIGkgaW4gWzcuLm1dIGJ5IDMwXG4gICAgcmV0dXJuIGkgICAgaWYgKG4gJSBpKSAgICAgID09IDBcbiAgICByZXR1cm4gaSs0ICBpZiAobiAlIChpKzQpKSAgPT0gMFxuICAgIHJldHVybiBpKzYgIGlmIChuICUgKGkrNikpICA9PSAwXG4gICAgcmV0dXJuIGkrMTAgaWYgKG4gJSAoaSsxMCkpID09IDBcbiAgICByZXR1cm4gaSsxMiBpZiAobiAlIChpKzEyKSkgPT0gMFxuICAgIHJldHVybiBpKzE2IGlmIChuICUgKGkrMTYpKSA9PSAwXG4gICAgcmV0dXJuIGkrMjIgaWYgKG4gJSAoaSsyMikpID09IDBcbiAgICByZXR1cm4gaSsyNCBpZiAobiAlIChpKzI0KSkgPT0gMFxuXG4gIHJldHVybiBuXG5cbmlzUHJpbWUgPSAobikgLT5cbiAgaWYgaXNOYU4obikgb3Igbm90IGlzRmluaXRlKG4pIG9yIChuICUgMSkgIT0gMCBvciAobiA8IDIpXG4gICAgcmV0dXJuIGZhbHNlXG4gIGlmIG4gPT0gbGVhc3RGYWN0b3IobilcbiAgICByZXR1cm4gdHJ1ZVxuXG4gIHJldHVybiBmYWxzZVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnByaW1lRmFjdG9ycyA9IChuKSAtPlxuICByZXR1cm4gWzFdIGlmIG4gPT0gMVxuXG4gIGZhY3RvcnMgPSBbXVxuICB3aGlsZSBub3QgaXNQcmltZShuKVxuICAgIGZhY3RvciA9IGxlYXN0RmFjdG9yKG4pXG4gICAgZmFjdG9ycy5wdXNoIGZhY3RvclxuICAgIG4gLz0gZmFjdG9yXG4gIGZhY3RvcnMucHVzaCBuXG4gIHJldHVybiBmYWN0b3JzXG5cbmxhcmdlc3RQcmltZUZhY3RvciA9IChuKSAtPlxuICByZXR1cm4gMSBpZiBuID09IDFcblxuICB3aGlsZSBub3QgaXNQcmltZShuKVxuICAgIGZhY3RvciA9IGxlYXN0RmFjdG9yKG4pXG4gICAgbiAvPSBmYWN0b3JcbiAgcmV0dXJuIG5cblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICByZXR1cm4gbGFyZ2VzdFByaW1lRmFjdG9yKDYwMDg1MTQ3NTE0MylcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDQ6IExhcmdlc3QgcGFsaW5kcm9tZSBwcm9kdWN0XG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbkEgcGFsaW5kcm9taWMgbnVtYmVyIHJlYWRzIHRoZSBzYW1lIGJvdGggd2F5cy5cblxuRmluZCB0aGUgbGFyZ2VzdCBwYWxpbmRyb21lIG1hZGUgZnJvbSB0aGUgcHJvZHVjdCBvZiB0d28gMy1kaWdpdCBudW1iZXJzLlxuXG5cIlwiXCJcblxuaXNQYWxpbmRyb21lID0gKG4pIC0+XG4gIHN0ciA9IG4udG9TdHJpbmcoKVxuICBmb3IgaSBpbiBbMC4uLihzdHIubGVuZ3RoIC8gMildXG4gICAgaWYgc3RyW2ldICE9IHN0cltzdHIubGVuZ3RoIC0gMSAtIGldXG4gICAgICByZXR1cm4gZmFsc2VcbiAgcmV0dXJuIHRydWVcblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgIyBNYWtlIHN1cmUgaXNQYWxpbmRyb21lIHdvcmtzIHByb3Blcmx5IGZpcnN0XG4gIGZvciB2IGluIFsxLCAxMSwgMTIxLCAxMjIxLCAxMjMyMSwgMTIzNDMyMV1cbiAgICBlcXVhbChpc1BhbGluZHJvbWUodiksIHRydWUsIFwiaXNQYWxpbmRyb21lKCN7dn0pIHJldHVybnMgdHJ1ZVwiKVxuICBmb3IgdiBpbiBbMTIsIDEyMywgMTIzNCwgMTIzNDUsIDEyMzQ1NiwgMTIzMjRdXG4gICAgZXF1YWwoaXNQYWxpbmRyb21lKHYpLCBmYWxzZSwgXCJpc1BhbGluZHJvbWUoI3t2fSkgcmV0dXJucyBmYWxzZVwiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIGxhcmdlc3RpID0gMFxuICBsYXJnZXN0aiA9IDBcbiAgbGFyZ2VzdHAgPSAwXG5cbiAgZm9yIGkgaW4gWzEwMC4uOTk5XVxuICAgIGZvciBqIGluIFsxMDAuLjk5OV1cbiAgICAgIHByb2R1Y3QgPSBpICogalxuICAgICAgaWYgaXNQYWxpbmRyb21lKHByb2R1Y3QpXG4gICAgICAgIGxhcmdlc3RpID0gaVxuICAgICAgICBsYXJnZXN0aiA9IGpcbiAgICAgICAgbGFyZ2VzdHAgPSBwcm9kdWN0XG5cbiAgcmV0dXJuIGxhcmdlc3RwXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSA1OiBTbWFsbGVzdCBtdWx0aXBsZVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4yNTIwIGlzIHRoZSBzbWFsbGVzdCBudW1iZXIgdGhhdCBjYW4gYmUgZGl2aWRlZCBieSBlYWNoIG9mIHRoZSBudW1iZXJzIGZyb20gMSB0byAxMCB3aXRob3V0IGFueSByZW1haW5kZXIuXG5cbldoYXQgaXMgdGhlIHNtYWxsZXN0IHBvc2l0aXZlIG51bWJlciB0aGF0IGlzIGV2ZW5seSBkaXZpc2libGUgYnkgYWxsIG9mIHRoZSBudW1iZXJzIGZyb20gMSB0byAyMD9cblxuXCJcIlwiXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgbiA9IDBcbiAgbG9vcFxuICAgIG4gKz0gMjAgIyBQcm9iYWJseSBjb3VsZCBiZSBzb21lIGNsZXZlciBzdW0gb2YgcHJpbWVzIGJldHdlZW4gMS0yMCBvciBzb21ldGhpbmcuIEkgZG9uJ3QgY2FyZS5cbiAgICBmb3VuZCA9IHRydWVcbiAgICBmb3IgaSBpbiBbMS4uMjBdXG4gICAgICBpZiAobiAlIGkpICE9IDBcbiAgICAgICAgZm91bmQgPSBmYWxzZVxuICAgICAgICBicmVha1xuXG4gICAgYnJlYWsgaWYgZm91bmRcblxuICByZXR1cm4gblxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gNjogU3VtIHNxdWFyZSBkaWZmZXJlbmNlXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5UaGUgc3VtIG9mIHRoZSBzcXVhcmVzIG9mIHRoZSBmaXJzdCB0ZW4gbmF0dXJhbCBudW1iZXJzIGlzLFxuXG4gICAgICAgICAgICAgMV4yICsgMl4yICsgLi4uICsgMTBeMiA9IDM4NVxuXG5UaGUgc3F1YXJlIG9mIHRoZSBzdW0gb2YgdGhlIGZpcnN0IHRlbiBuYXR1cmFsIG51bWJlcnMgaXMsXG5cbiAgICAgICAgICAoMSArIDIgKyAuLi4gKyAxMCleMiA9IDU1XjIgPSAzMDI1XG5cbkhlbmNlIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIHN1bSBvZiB0aGUgc3F1YXJlcyBvZiB0aGUgZmlyc3QgdGVuIG5hdHVyYWwgbnVtYmVycyBhbmQgdGhlIHNxdWFyZSBvZiB0aGUgc3VtIGlzIDMwMjUg4oiSIDM4NSA9IDI2NDAuXG5cbkZpbmQgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUgc3VtIG9mIHRoZSBzcXVhcmVzIG9mIHRoZSBmaXJzdCBvbmUgaHVuZHJlZCBuYXR1cmFsIG51bWJlcnMgYW5kIHRoZSBzcXVhcmUgb2YgdGhlIHN1bS5cblxuXCJcIlwiXG5cbnN1bU9mU3F1YXJlcyA9IChuKSAtPlxuICBzdW0gPSAwXG4gIGZvciBpIGluIFsxLi5uXVxuICAgIHN1bSArPSAoaSAqIGkpXG4gIHJldHVybiBzdW1cblxuc3F1YXJlT2ZTdW0gPSAobikgLT5cbiAgc3VtID0gMFxuICBmb3IgaSBpbiBbMS4ubl1cbiAgICBzdW0gKz0gaVxuICByZXR1cm4gKHN1bSAqIHN1bSlcblxuZGlmZmVyZW5jZVN1bVNxdWFyZXMgPSAobikgLT5cbiAgcmV0dXJuIHNxdWFyZU9mU3VtKG4pIC0gc3VtT2ZTcXVhcmVzKG4pXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGVxdWFsKHN1bU9mU3F1YXJlcygxMCksIDM4NSwgXCJTdW0gb2Ygc3F1YXJlcyBvZiBmaXJzdCB0ZW4gbmF0dXJhbCBudW1iZXJzIGlzIDM4NVwiKVxuICBlcXVhbChzcXVhcmVPZlN1bSgxMCksIDMwMjUsIFwiU3F1YXJlIG9mIHN1bSBvZiBmaXJzdCB0ZW4gbmF0dXJhbCBudW1iZXJzIGlzIDMwMjVcIilcbiAgZXF1YWwoZGlmZmVyZW5jZVN1bVNxdWFyZXMoMTApLCAyNjQwLCBcIkRpZmZlcmVuY2UgaW4gdmFsdWVzIGZvciB0aGUgZmlyc3QgdGVuIG5hdHVyYWwgbnVtYmVycyBpcyAyNjQwXCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgcmV0dXJuIGRpZmZlcmVuY2VTdW1TcXVhcmVzKDEwMClcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDc6IDEwMDAxc3QgcHJpbWVcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5CeSBsaXN0aW5nIHRoZSBmaXJzdCBzaXggcHJpbWUgbnVtYmVyczogMiwgMywgNSwgNywgMTEsIGFuZCAxMywgd2UgY2FuIHNlZSB0aGF0IHRoZSA2dGggcHJpbWUgaXMgMTMuXG5cbldoYXQgaXMgdGhlIDEwLDAwMXN0IHByaW1lIG51bWJlcj9cblxuXCJcIlwiXG5cbm1hdGggPSByZXF1aXJlIFwibWF0aFwiXG5cbm50aFByaW1lID0gKG4pIC0+XG4gIHNpZXZlID0gbmV3IG1hdGguSW5jcmVtZW50YWxTaWV2ZVxuICBmb3IgaSBpbiBbMS4uLm5dXG4gICAgc2lldmUubmV4dCgpXG4gIHJldHVybiBzaWV2ZS5uZXh0KClcblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgZXF1YWwobnRoUHJpbWUoNiksIDEzLCBcIjZ0aCBwcmltZSBpcyAxM1wiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHJldHVybiBudGhQcmltZSgxMDAwMSlcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDg6IExhcmdlc3QgcHJvZHVjdCBpbiBhIHNlcmllc1xuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuVGhlIGZvdXIgYWRqYWNlbnQgZGlnaXRzIGluIHRoZSAxMDAwLWRpZ2l0IG51bWJlciB0aGF0IGhhdmUgdGhlIGdyZWF0ZXN0IHByb2R1Y3QgYXJlIDkgeCA5IHggOCB4IDkgPSA1ODMyLlxuXG4gIDczMTY3MTc2NTMxMzMwNjI0OTE5MjI1MTE5Njc0NDI2NTc0NzQyMzU1MzQ5MTk0OTM0XG4gIDk2OTgzNTIwMzEyNzc0NTA2MzI2MjM5NTc4MzE4MDE2OTg0ODAxODY5NDc4ODUxODQzXG4gIDg1ODYxNTYwNzg5MTEyOTQ5NDk1NDU5NTAxNzM3OTU4MzMxOTUyODUzMjA4ODA1NTExXG4gIDEyNTQwNjk4NzQ3MTU4NTIzODYzMDUwNzE1NjkzMjkwOTYzMjk1MjI3NDQzMDQzNTU3XG4gIDY2ODk2NjQ4OTUwNDQ1MjQ0NTIzMTYxNzMxODU2NDAzMDk4NzExMTIxNzIyMzgzMTEzXG4gIDYyMjI5ODkzNDIzMzgwMzA4MTM1MzM2Mjc2NjE0MjgyODA2NDQ0NDg2NjQ1MjM4NzQ5XG4gIDMwMzU4OTA3Mjk2MjkwNDkxNTYwNDQwNzcyMzkwNzEzODEwNTE1ODU5MzA3OTYwODY2XG4gIDcwMTcyNDI3MTIxODgzOTk4Nzk3OTA4NzkyMjc0OTIxOTAxNjk5NzIwODg4MDkzNzc2XG4gIDY1NzI3MzMzMDAxMDUzMzY3ODgxMjIwMjM1NDIxODA5NzUxMjU0NTQwNTk0NzUyMjQzXG4gIDUyNTg0OTA3NzExNjcwNTU2MDEzNjA0ODM5NTg2NDQ2NzA2MzI0NDE1NzIyMTU1Mzk3XG4gIDUzNjk3ODE3OTc3ODQ2MTc0MDY0OTU1MTQ5MjkwODYyNTY5MzIxOTc4NDY4NjIyNDgyXG4gIDgzOTcyMjQxMzc1NjU3MDU2MDU3NDkwMjYxNDA3OTcyOTY4NjUyNDE0NTM1MTAwNDc0XG4gIDgyMTY2MzcwNDg0NDAzMTk5ODkwMDA4ODk1MjQzNDUwNjU4NTQxMjI3NTg4NjY2ODgxXG4gIDE2NDI3MTcxNDc5OTI0NDQyOTI4MjMwODYzNDY1Njc0ODEzOTE5MTIzMTYyODI0NTg2XG4gIDE3ODY2NDU4MzU5MTI0NTY2NTI5NDc2NTQ1NjgyODQ4OTEyODgzMTQyNjA3NjkwMDQyXG4gIDI0MjE5MDIyNjcxMDU1NjI2MzIxMTExMTA5MzcwNTQ0MjE3NTA2OTQxNjU4OTYwNDA4XG4gIDA3MTk4NDAzODUwOTYyNDU1NDQ0MzYyOTgxMjMwOTg3ODc5OTI3MjQ0Mjg0OTA5MTg4XG4gIDg0NTgwMTU2MTY2MDk3OTE5MTMzODc1NDk5MjAwNTI0MDYzNjg5OTEyNTYwNzE3NjA2XG4gIDA1ODg2MTE2NDY3MTA5NDA1MDc3NTQxMDAyMjU2OTgzMTU1MjAwMDU1OTM1NzI5NzI1XG4gIDcxNjM2MjY5NTYxODgyNjcwNDI4MjUyNDgzNjAwODIzMjU3NTMwNDIwNzUyOTYzNDUwXG5cbkZpbmQgdGhlIHRoaXJ0ZWVuIGFkamFjZW50IGRpZ2l0cyBpbiB0aGUgMTAwMC1kaWdpdCBudW1iZXIgdGhhdCBoYXZlIHRoZSBncmVhdGVzdCBwcm9kdWN0LiBXaGF0IGlzIHRoZSB2YWx1ZSBvZiB0aGlzIHByb2R1Y3Q/XG5cblwiXCJcIlxuXG5zdHIgPSBcIlwiXCJcbiAgICAgIDczMTY3MTc2NTMxMzMwNjI0OTE5MjI1MTE5Njc0NDI2NTc0NzQyMzU1MzQ5MTk0OTM0XG4gICAgICA5Njk4MzUyMDMxMjc3NDUwNjMyNjIzOTU3ODMxODAxNjk4NDgwMTg2OTQ3ODg1MTg0M1xuICAgICAgODU4NjE1NjA3ODkxMTI5NDk0OTU0NTk1MDE3Mzc5NTgzMzE5NTI4NTMyMDg4MDU1MTFcbiAgICAgIDEyNTQwNjk4NzQ3MTU4NTIzODYzMDUwNzE1NjkzMjkwOTYzMjk1MjI3NDQzMDQzNTU3XG4gICAgICA2Njg5NjY0ODk1MDQ0NTI0NDUyMzE2MTczMTg1NjQwMzA5ODcxMTEyMTcyMjM4MzExM1xuICAgICAgNjIyMjk4OTM0MjMzODAzMDgxMzUzMzYyNzY2MTQyODI4MDY0NDQ0ODY2NDUyMzg3NDlcbiAgICAgIDMwMzU4OTA3Mjk2MjkwNDkxNTYwNDQwNzcyMzkwNzEzODEwNTE1ODU5MzA3OTYwODY2XG4gICAgICA3MDE3MjQyNzEyMTg4Mzk5ODc5NzkwODc5MjI3NDkyMTkwMTY5OTcyMDg4ODA5Mzc3NlxuICAgICAgNjU3MjczMzMwMDEwNTMzNjc4ODEyMjAyMzU0MjE4MDk3NTEyNTQ1NDA1OTQ3NTIyNDNcbiAgICAgIDUyNTg0OTA3NzExNjcwNTU2MDEzNjA0ODM5NTg2NDQ2NzA2MzI0NDE1NzIyMTU1Mzk3XG4gICAgICA1MzY5NzgxNzk3Nzg0NjE3NDA2NDk1NTE0OTI5MDg2MjU2OTMyMTk3ODQ2ODYyMjQ4MlxuICAgICAgODM5NzIyNDEzNzU2NTcwNTYwNTc0OTAyNjE0MDc5NzI5Njg2NTI0MTQ1MzUxMDA0NzRcbiAgICAgIDgyMTY2MzcwNDg0NDAzMTk5ODkwMDA4ODk1MjQzNDUwNjU4NTQxMjI3NTg4NjY2ODgxXG4gICAgICAxNjQyNzE3MTQ3OTkyNDQ0MjkyODIzMDg2MzQ2NTY3NDgxMzkxOTEyMzE2MjgyNDU4NlxuICAgICAgMTc4NjY0NTgzNTkxMjQ1NjY1Mjk0NzY1NDU2ODI4NDg5MTI4ODMxNDI2MDc2OTAwNDJcbiAgICAgIDI0MjE5MDIyNjcxMDU1NjI2MzIxMTExMTA5MzcwNTQ0MjE3NTA2OTQxNjU4OTYwNDA4XG4gICAgICAwNzE5ODQwMzg1MDk2MjQ1NTQ0NDM2Mjk4MTIzMDk4Nzg3OTkyNzI0NDI4NDkwOTE4OFxuICAgICAgODQ1ODAxNTYxNjYwOTc5MTkxMzM4NzU0OTkyMDA1MjQwNjM2ODk5MTI1NjA3MTc2MDZcbiAgICAgIDA1ODg2MTE2NDY3MTA5NDA1MDc3NTQxMDAyMjU2OTgzMTU1MjAwMDU1OTM1NzI5NzI1XG4gICAgICA3MTYzNjI2OTU2MTg4MjY3MDQyODI1MjQ4MzYwMDgyMzI1NzUzMDQyMDc1Mjk2MzQ1MFxuICAgICAgXCJcIlwiXG5zdHIgPSBzdHIucmVwbGFjZSgvW14wLTldL2dtLCBcIlwiKVxuZGlnaXRzID0gKHBhcnNlSW50KGRpZ2l0KSBmb3IgZGlnaXQgaW4gc3RyKVxuXG5sYXJnZXN0UHJvZHVjdCA9IChkaWdpdENvdW50KSAtPlxuICByZXR1cm4gMCBpZiBkaWdpdENvdW50ID4gZGlnaXRzLmxlbmd0aFxuXG4gIGxhcmdlc3QgPSAwXG4gIGZvciBzdGFydCBpbiBbMC4uKGRpZ2l0cy5sZW5ndGggLSBkaWdpdENvdW50KV1cbiAgICBlbmQgPSBzdGFydCArIGRpZ2l0Q291bnRcbiAgICBwcm9kdWN0ID0gMVxuICAgIGZvciBpIGluIFtzdGFydC4uLmVuZF1cbiAgICAgIHByb2R1Y3QgKj0gZGlnaXRzW2ldXG4gICAgaWYgbGFyZ2VzdCA8IHByb2R1Y3RcbiAgICAgIGxhcmdlc3QgPSBwcm9kdWN0XG5cbiAgcmV0dXJuIGxhcmdlc3RcblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgZXF1YWwobGFyZ2VzdFByb2R1Y3QoNCksIDU4MzIsICBcIkdyZWF0ZXN0IHByb2R1Y3Qgb2YgNCBhZGphY2VudCBkaWdpdHMgaXMgNTgzMlwiKVxuICBlcXVhbChsYXJnZXN0UHJvZHVjdCg1KSwgNDA4MjQsIFwiR3JlYXRlc3QgcHJvZHVjdCBvZiA1IGFkamFjZW50IGRpZ2l0cyBpcyA0MDgyNFwiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHJldHVybiBsYXJnZXN0UHJvZHVjdCgxMylcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDk6IFNwZWNpYWwgUHl0aGFnb3JlYW4gdHJpcGxldFxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuQSBQeXRoYWdvcmVhbiB0cmlwbGV0IGlzIGEgc2V0IG9mIHRocmVlIG5hdHVyYWwgbnVtYmVycywgYSA8IGIgPCBjLCBmb3Igd2hpY2gsXG5cbiAgICBhXjIgKyBiXjIgPSBjXjJcblxuRm9yIGV4YW1wbGUsIDNeMiArIDReMiA9IDkgKyAxNiA9IDI1ID0gNV4yLlxuXG5UaGVyZSBleGlzdHMgZXhhY3RseSBvbmUgUHl0aGFnb3JlYW4gdHJpcGxldCBmb3Igd2hpY2ggYSArIGIgKyBjID0gMTAwMC5cblxuRmluZCB0aGUgcHJvZHVjdCBhYmMuXG5cblwiXCJcIlxuXG5pc1RyaXBsZXQgPSAoYSwgYiwgYykgLT5cbiAgcmV0dXJuICgoYSphKSArIChiKmIpKSA9PSAoYypjKVxuXG5maW5kRmlyc3RUcmlwbGV0ID0gKHN1bSkgLT5cbiAgZm9yIGEgaW4gWzEuLi4xMDAwXVxuICAgIGZvciBiIGluIFsxLi4uMTAwMF1cbiAgICAgIGMgPSAxMDAwIC0gYSAtIGJcbiAgICAgIGlmIGlzVHJpcGxldChhLCBiLCBjKVxuICAgICAgICByZXR1cm4gW2EsIGIsIGNdXG5cbiAgcmV0dXJuIGZhbHNlXG5cblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgZXF1YWwoaXNUcmlwbGV0KDMsIDQsIDUpLCB0cnVlLCBcIigzLDQsNSkgaXMgYSBQeXRoYWdvcmVhbiB0cmlwbGV0XCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgcmV0dXJuIGZpbmRGaXJzdFRyaXBsZXQoMTAwMClcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDEwOiBTdW1tYXRpb24gb2YgcHJpbWVzXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblRoZSBzdW0gb2YgdGhlIHByaW1lcyBiZWxvdyAxMCBpcyAyICsgMyArIDUgKyA3ID0gMTcuXG5cbkZpbmQgdGhlIHN1bSBvZiBhbGwgdGhlIHByaW1lcyBiZWxvdyB0d28gbWlsbGlvbi5cblxuXCJcIlwiXG5cbm1hdGggPSByZXF1aXJlIFwibWF0aFwiXG5cbnByaW1lU3VtID0gKGNlaWxpbmcpIC0+XG4gIHNpZXZlID0gbmV3IG1hdGguSW5jcmVtZW50YWxTaWV2ZVxuXG4gIHN1bSA9IDBcbiAgbG9vcFxuICAgIG4gPSBzaWV2ZS5uZXh0KClcbiAgICBpZiBuID49IGNlaWxpbmdcbiAgICAgIGJyZWFrXG4gICAgc3VtICs9IG5cblxuICByZXR1cm4gc3VtXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGVxdWFsKHByaW1lU3VtKDEwKSwgMTcsIFwiU3VtIG9mIHByaW1lcyBiZWxvdyAxMCBpcyAxN1wiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHJldHVybiBwcmltZVN1bSgyMDAwMDAwKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMTE6IExhcmdlc3QgcHJvZHVjdCBpbiBhIGdyaWRcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuSW4gdGhlIDIweDIwIGdyaWQgYmVsb3csIGZvdXIgbnVtYmVycyBhbG9uZyBhIGRpYWdvbmFsIGxpbmUgaGF2ZSBiZWVuIG1hcmtlZCBpbiByZWQuXG5cbiAgICAgICAgICAwOCAwMiAyMiA5NyAzOCAxNSAwMCA0MCAwMCA3NSAwNCAwNSAwNyA3OCA1MiAxMiA1MCA3NyA5MSAwOFxuICAgICAgICAgIDQ5IDQ5IDk5IDQwIDE3IDgxIDE4IDU3IDYwIDg3IDE3IDQwIDk4IDQzIDY5IDQ4IDA0IDU2IDYyIDAwXG4gICAgICAgICAgODEgNDkgMzEgNzMgNTUgNzkgMTQgMjkgOTMgNzEgNDAgNjcgNTMgODggMzAgMDMgNDkgMTMgMzYgNjVcbiAgICAgICAgICA1MiA3MCA5NSAyMyAwNCA2MCAxMSA0MiA2OSAyNCA2OCA1NiAwMSAzMiA1NiA3MSAzNyAwMiAzNiA5MVxuICAgICAgICAgIDIyIDMxIDE2IDcxIDUxIDY3IDYzIDg5IDQxIDkyIDM2IDU0IDIyIDQwIDQwIDI4IDY2IDMzIDEzIDgwXG4gICAgICAgICAgMjQgNDcgMzIgNjAgOTkgMDMgNDUgMDIgNDQgNzUgMzMgNTMgNzggMzYgODQgMjAgMzUgMTcgMTIgNTBcbiAgICAgICAgICAzMiA5OCA4MSAyOCA2NCAyMyA2NyAxMCAyNl8zOCA0MCA2NyA1OSA1NCA3MCA2NiAxOCAzOCA2NCA3MFxuICAgICAgICAgIDY3IDI2IDIwIDY4IDAyIDYyIDEyIDIwIDk1IDYzXzk0IDM5IDYzIDA4IDQwIDkxIDY2IDQ5IDk0IDIxXG4gICAgICAgICAgMjQgNTUgNTggMDUgNjYgNzMgOTkgMjYgOTcgMTcgNzhfNzggOTYgODMgMTQgODggMzQgODkgNjMgNzJcbiAgICAgICAgICAyMSAzNiAyMyAwOSA3NSAwMCA3NiA0NCAyMCA0NSAzNSAxNCAwMCA2MSAzMyA5NyAzNCAzMSAzMyA5NVxuICAgICAgICAgIDc4IDE3IDUzIDI4IDIyIDc1IDMxIDY3IDE1IDk0IDAzIDgwIDA0IDYyIDE2IDE0IDA5IDUzIDU2IDkyXG4gICAgICAgICAgMTYgMzkgMDUgNDIgOTYgMzUgMzEgNDcgNTUgNTggODggMjQgMDAgMTcgNTQgMjQgMzYgMjkgODUgNTdcbiAgICAgICAgICA4NiA1NiAwMCA0OCAzNSA3MSA4OSAwNyAwNSA0NCA0NCAzNyA0NCA2MCAyMSA1OCA1MSA1NCAxNyA1OFxuICAgICAgICAgIDE5IDgwIDgxIDY4IDA1IDk0IDQ3IDY5IDI4IDczIDkyIDEzIDg2IDUyIDE3IDc3IDA0IDg5IDU1IDQwXG4gICAgICAgICAgMDQgNTIgMDggODMgOTcgMzUgOTkgMTYgMDcgOTcgNTcgMzIgMTYgMjYgMjYgNzkgMzMgMjcgOTggNjZcbiAgICAgICAgICA4OCAzNiA2OCA4NyA1NyA2MiAyMCA3MiAwMyA0NiAzMyA2NyA0NiA1NSAxMiAzMiA2MyA5MyA1MyA2OVxuICAgICAgICAgIDA0IDQyIDE2IDczIDM4IDI1IDM5IDExIDI0IDk0IDcyIDE4IDA4IDQ2IDI5IDMyIDQwIDYyIDc2IDM2XG4gICAgICAgICAgMjAgNjkgMzYgNDEgNzIgMzAgMjMgODggMzQgNjIgOTkgNjkgODIgNjcgNTkgODUgNzQgMDQgMzYgMTZcbiAgICAgICAgICAyMCA3MyAzNSAyOSA3OCAzMSA5MCAwMSA3NCAzMSA0OSA3MSA0OCA4NiA4MSAxNiAyMyA1NyAwNSA1NFxuICAgICAgICAgIDAxIDcwIDU0IDcxIDgzIDUxIDU0IDY5IDE2IDkyIDMzIDQ4IDYxIDQzIDUyIDAxIDg5IDE5IDY3IDQ4XG5cblRoZSBwcm9kdWN0IG9mIHRoZXNlIG51bWJlcnMgaXMgMjYgeCA2MyB4IDc4IHggMTQgPSAxNzg4Njk2LlxuXG5XaGF0IGlzIHRoZSBncmVhdGVzdCBwcm9kdWN0IG9mIGZvdXIgYWRqYWNlbnQgbnVtYmVycyBpbiB0aGUgc2FtZSBkaXJlY3Rpb24gKHVwLCBkb3duLCBsZWZ0LCByaWdodCwgb3IgZGlhZ29uYWxseSkgaW4gdGhlIDIweDIwIGdyaWQ/XG5cblwiXCJcIlxuXG5ncmlkID0gbnVsbFxuXG5wcmVwYXJlR3JpZCA9IC0+XG4gIHJhd0RpZ2l0cyA9IFwiXCJcIlxuICAgIDA4IDAyIDIyIDk3IDM4IDE1IDAwIDQwIDAwIDc1IDA0IDA1IDA3IDc4IDUyIDEyIDUwIDc3IDkxIDA4XG4gICAgNDkgNDkgOTkgNDAgMTcgODEgMTggNTcgNjAgODcgMTcgNDAgOTggNDMgNjkgNDggMDQgNTYgNjIgMDBcbiAgICA4MSA0OSAzMSA3MyA1NSA3OSAxNCAyOSA5MyA3MSA0MCA2NyA1MyA4OCAzMCAwMyA0OSAxMyAzNiA2NVxuICAgIDUyIDcwIDk1IDIzIDA0IDYwIDExIDQyIDY5IDI0IDY4IDU2IDAxIDMyIDU2IDcxIDM3IDAyIDM2IDkxXG4gICAgMjIgMzEgMTYgNzEgNTEgNjcgNjMgODkgNDEgOTIgMzYgNTQgMjIgNDAgNDAgMjggNjYgMzMgMTMgODBcbiAgICAyNCA0NyAzMiA2MCA5OSAwMyA0NSAwMiA0NCA3NSAzMyA1MyA3OCAzNiA4NCAyMCAzNSAxNyAxMiA1MFxuICAgIDMyIDk4IDgxIDI4IDY0IDIzIDY3IDEwIDI2IDM4IDQwIDY3IDU5IDU0IDcwIDY2IDE4IDM4IDY0IDcwXG4gICAgNjcgMjYgMjAgNjggMDIgNjIgMTIgMjAgOTUgNjMgOTQgMzkgNjMgMDggNDAgOTEgNjYgNDkgOTQgMjFcbiAgICAyNCA1NSA1OCAwNSA2NiA3MyA5OSAyNiA5NyAxNyA3OCA3OCA5NiA4MyAxNCA4OCAzNCA4OSA2MyA3MlxuICAgIDIxIDM2IDIzIDA5IDc1IDAwIDc2IDQ0IDIwIDQ1IDM1IDE0IDAwIDYxIDMzIDk3IDM0IDMxIDMzIDk1XG4gICAgNzggMTcgNTMgMjggMjIgNzUgMzEgNjcgMTUgOTQgMDMgODAgMDQgNjIgMTYgMTQgMDkgNTMgNTYgOTJcbiAgICAxNiAzOSAwNSA0MiA5NiAzNSAzMSA0NyA1NSA1OCA4OCAyNCAwMCAxNyA1NCAyNCAzNiAyOSA4NSA1N1xuICAgIDg2IDU2IDAwIDQ4IDM1IDcxIDg5IDA3IDA1IDQ0IDQ0IDM3IDQ0IDYwIDIxIDU4IDUxIDU0IDE3IDU4XG4gICAgMTkgODAgODEgNjggMDUgOTQgNDcgNjkgMjggNzMgOTIgMTMgODYgNTIgMTcgNzcgMDQgODkgNTUgNDBcbiAgICAwNCA1MiAwOCA4MyA5NyAzNSA5OSAxNiAwNyA5NyA1NyAzMiAxNiAyNiAyNiA3OSAzMyAyNyA5OCA2NlxuICAgIDg4IDM2IDY4IDg3IDU3IDYyIDIwIDcyIDAzIDQ2IDMzIDY3IDQ2IDU1IDEyIDMyIDYzIDkzIDUzIDY5XG4gICAgMDQgNDIgMTYgNzMgMzggMjUgMzkgMTEgMjQgOTQgNzIgMTggMDggNDYgMjkgMzIgNDAgNjIgNzYgMzZcbiAgICAyMCA2OSAzNiA0MSA3MiAzMCAyMyA4OCAzNCA2MiA5OSA2OSA4MiA2NyA1OSA4NSA3NCAwNCAzNiAxNlxuICAgIDIwIDczIDM1IDI5IDc4IDMxIDkwIDAxIDc0IDMxIDQ5IDcxIDQ4IDg2IDgxIDE2IDIzIDU3IDA1IDU0XG4gICAgMDEgNzAgNTQgNzEgODMgNTEgNTQgNjkgMTYgOTIgMzMgNDggNjEgNDMgNTIgMDEgODkgMTkgNjcgNDhcbiAgXCJcIlwiLnJlcGxhY2UoL1teMC05IF0vZ20sIFwiIFwiKVxuXG4gIGRpZ2l0cyA9IChwYXJzZUludChkaWdpdCkgZm9yIGRpZ2l0IGluIHJhd0RpZ2l0cy5zcGxpdChcIiBcIikpXG4gIGdyaWQgPSBBcnJheSgyMClcbiAgZm9yIGkgaW4gWzAuLi4yMF1cbiAgICBncmlkW2ldID0gQXJyYXkoMjApXG5cbiAgaW5kZXggPSAwXG4gIGZvciBqIGluIFswLi4uMjBdXG4gICAgZm9yIGkgaW4gWzAuLi4yMF1cbiAgICAgIGdyaWRbaV1bal0gPSBkaWdpdHNbaW5kZXhdXG4gICAgICBpbmRleCsrXG5cbnByZXBhcmVHcmlkKClcblxuIyBHZXRzIGEgcHJvZHVjdCBvZiA0IHZhbHVlcyBzdGFydGluZyBhdCAoc3gsIHN5KSwgaGVhZGluZyBpbiB0aGUgZGlyZWN0aW9uIChkeCwgZHkpXG4jIFJldHVybnMgLTEgaWYgdGhlcmUgaXMgbm8gcm9vbSB0byBtYWtlIGEgc3RyaXBlIG9mIDQuXG5nZXRMaW5lUHJvZHVjdCA9IChzeCwgc3ksIGR4LCBkeSkgLT5cbiAgZXggPSBzeCArICg0ICogZHgpXG4gIHJldHVybiAtMSBpZiAoZXggPCAwKSBvciAoZXggPj0gMjApXG4gIGV5ID0gc3kgKyAoNCAqIGR5KVxuICByZXR1cm4gLTEgaWYgKGV5IDwgMCkgb3IgKGV5ID49IDIwKVxuXG4gIHggPSBzeFxuICB5ID0gc3lcbiAgcHJvZHVjdCA9IDFcbiAgZm9yIGkgaW4gWzAuLi40XVxuICAgIHByb2R1Y3QgKj0gZ3JpZFt4XVt5XVxuICAgIHggKz0gZHhcbiAgICB5ICs9IGR5XG5cbiAgcmV0dXJuIHByb2R1Y3RcblxuZ2V0TGluZSA9IChzeCwgc3ksIGR4LCBkeSkgLT5cbiAgZXggPSBzeCArICg0ICogZHgpXG4gIHJldHVybiBbXSBpZiAoZXggPCAwKSBvciAoZXggPj0gMjApXG4gIGV5ID0gc3kgKyAoNCAqIGR5KVxuICByZXR1cm4gW10gaWYgKGV5IDwgMCkgb3IgKGV5ID49IDIwKVxuXG4gIGxpbmUgPSBbXVxuXG4gIHggPSBzeFxuICB5ID0gc3lcbiAgZm9yIGkgaW4gWzAuLi40XVxuICAgIGxpbmUucHVzaCBncmlkW3hdW3ldXG4gICAgeCArPSBkeFxuICAgIHkgKz0gZHlcblxuICByZXR1cm4gbGluZVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICAjIEV4YW1wbGUgaXMgZGlhZ29uYWwgcmlnaHQvZG93biBmcm9tICg4LDYpXG4gIGVxdWFsKGdldExpbmVQcm9kdWN0KDgsIDYsIDEsIDEpLCAxNzg4Njk2LCBcIkRpYWdvbmFsIHZhbHVlIHNob3duIGluIGV4YW1wbGUgZXF1YWxzIDEsNzg4LDY5NlwiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIG1heCA9XG4gICAgcHJvZHVjdDogMVxuICAgIGk6IDBcbiAgICBqOiAwXG4gICAgZGlyOiBcInJpZ2h0XCJcblxuICBmb3IgaiBpbiBbMC4uLjIwXVxuICAgIGZvciBpIGluIFswLi4uMjBdXG4gICAgICBwID0gZ2V0TGluZVByb2R1Y3QoaSwgaiwgMSwgMClcbiAgICAgIGlmIG1heC5wcm9kdWN0IDwgcFxuICAgICAgICBtYXgucHJvZHVjdCA9IHBcbiAgICAgICAgbWF4LmkgPSBpXG4gICAgICAgIG1heC5qID0galxuICAgICAgICBtYXguZGlyID0gXCJyaWdodFwiXG4gICAgICBwID0gZ2V0TGluZVByb2R1Y3QoaSwgaiwgMCwgMSlcbiAgICAgIGlmIG1heC5wcm9kdWN0IDwgcFxuICAgICAgICBtYXgucHJvZHVjdCA9IHBcbiAgICAgICAgbWF4LmkgPSBpXG4gICAgICAgIG1heC5qID0galxuICAgICAgICBtYXguZGlyID0gXCJkb3duXCJcbiAgICAgIHAgPSBnZXRMaW5lUHJvZHVjdChpLCBqLCAxLCAxKVxuICAgICAgaWYgbWF4LnByb2R1Y3QgPCBwXG4gICAgICAgIG1heC5wcm9kdWN0ID0gcFxuICAgICAgICBtYXguaSA9IGlcbiAgICAgICAgbWF4LmogPSBqXG4gICAgICAgIG1heC5kaXIgPSBcImRpYWdvbmFsUlwiXG4gICAgICBwID0gZ2V0TGluZVByb2R1Y3QoaSwgaiwgLTEsIDEpXG4gICAgICBpZiBtYXgucHJvZHVjdCA8IHBcbiAgICAgICAgbWF4LnByb2R1Y3QgPSBwXG4gICAgICAgIG1heC5pID0gaVxuICAgICAgICBtYXguaiA9IGpcbiAgICAgICAgbWF4LmRpciA9IFwiZGlhZ29uYWxMXCJcblxuICByZXR1cm4gbWF4XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAxMjogSGlnaGx5IGRpdmlzaWJsZSB0cmlhbmd1bGFyIG51bWJlclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5UaGUgc2VxdWVuY2Ugb2YgdHJpYW5nbGUgbnVtYmVycyBpcyBnZW5lcmF0ZWQgYnkgYWRkaW5nIHRoZSBuYXR1cmFsIG51bWJlcnMuIFNvIHRoZSA3dGggdHJpYW5nbGUgbnVtYmVyIHdvdWxkIGJlXG5cbiAgICAgICAgICAgICAgICAgICAgICAxICsgMiArIDMgKyA0ICsgNSArIDYgKyA3ID0gMjguXG5cblRoZSBmaXJzdCB0ZW4gdGVybXMgd291bGQgYmU6XG5cbiAgICAgICAgICAgICAgICAgICAgICAxLCAzLCA2LCAxMCwgMTUsIDIxLCAyOCwgMzYsIDQ1LCA1NSwgLi4uXG5cbkxldCB1cyBsaXN0IHRoZSBmYWN0b3JzIG9mIHRoZSBmaXJzdCBzZXZlbiB0cmlhbmdsZSBudW1iZXJzOlxuXG4gMTogMVxuIDM6IDEsM1xuIDY6IDEsMiwzLDZcbjEwOiAxLDIsNSwxMFxuMTU6IDEsMyw1LDE1XG4yMTogMSwzLDcsMjFcbjI4OiAxLDIsNCw3LDE0LDI4XG5cbldlIGNhbiBzZWUgdGhhdCAyOCBpcyB0aGUgZmlyc3QgdHJpYW5nbGUgbnVtYmVyIHRvIGhhdmUgb3ZlciBmaXZlIGRpdmlzb3JzLlxuXG5XaGF0IGlzIHRoZSB2YWx1ZSBvZiB0aGUgZmlyc3QgdHJpYW5nbGUgbnVtYmVyIHRvIGhhdmUgb3ZlciBmaXZlIGh1bmRyZWQgZGl2aXNvcnM/XG5cblwiXCJcIlxuXG5tYXRoID0gcmVxdWlyZSBcIm1hdGhcIlxuXG4jIFRoaXMgZnVuY3Rpb24gZG9lcyBpdHMgYmVzdCB0byBsZXZlcmFnZSBSYW1hbnVqYW4ncyBcIlRhdSBmdW5jdGlvblwiLFxuIyB3aGljaCBpcyBzdXBwb3NlZCB0byBnaXZlIHRoZSBudW1iZXIgb2YgcG9zaXRpdmUgZGl2aXNvcnMuXG4jXG4jIFRoZSBpZGVhIGlzOlxuIyAqIEZvciBwcmltZXMsIFQocF5rKSA9IGsgKyAxXG4jICogRm9yIGFueSBudW1iZXJzIHdob3NlIEdDRCBpcyAxLCBUKG1uKSA9IFQobSkgKiBUKG4pXG4jXG4jIEkgYWxyZWFkeSBoYXZlIGEgbWV0aG9kIHRvIHByaW1lIGZhY3RvciBhIG51bWJlciwgc28gSSdsbCBsZXZlcmFnZVxuIyBldmVyeSBncm91cGluZyBvZiB0aGUgc2FtZSBwcmltZSBudW1iZXIgYXMgdGhlIGZpcnN0IGNhc2UsIGFuZFxuIyBtdWx0aXBseSB0aGVtIHRvZ2V0aGVyLlxuI1xuIyBFeGFtcGxlOiAyOFxuI1xuIyAyOCdzIHByaW1lIGZhY3RvcnMgYXJlIFsyLCAyLCA3XSwgb3IgKDJeMiArIDcpXG4jXG4jIEkgY2FuIGFzc3VtZSB0aGF0IHRoZSBHQ0QgYmV0d2VlbiBhbnkgb2YgdGhlIHByaW1lIHNldHMgaXMgZ29pbmcgdG8gYmUgMSBiZWNhdXNlIGR1aCxcbiMgd2hpY2ggbWVhbnMgdGhhdDpcbiNcbiMgVCgyOCkgPT0gVCgyXjIpICogVCg3KVxuI1xuIyBUKDJeMikgPT0gMiArIDEgPT0gM1xuIyBUKDdeMSkgPT0gMSArIDEgPT0gMlxuIyAzICogMiA9IDZcbiMgMjggaGFzIDYgZGl2aXNvcnMuXG4jXG4jIFlvdSdyZSBtYWQuXG5cbmRpdmlzb3JDb3VudCA9IChuKSAtPlxuICByZXR1cm4gMSBpZiBuID09IDFcblxuICBmYWN0b3JzID0gbWF0aC5wcmltZUZhY3RvcnMobilcbiAgY291bnQgPSAxXG4gIGxhc3RGYWN0b3IgPSAwXG4gIGV4cG9uZW50ID0gMVxuICBmb3IgZmFjdG9yIGluIGZhY3RvcnNcbiAgICBpZiBmYWN0b3IgPT0gbGFzdEZhY3RvclxuICAgICAgZXhwb25lbnQrK1xuICAgIGVsc2VcbiAgICAgIGlmIGxhc3RGYWN0b3IgIT0gMFxuICAgICAgICAgIGNvdW50ICo9IGV4cG9uZW50ICsgMVxuICAgICAgbGFzdEZhY3RvciA9IGZhY3RvclxuICAgICAgZXhwb25lbnQgPSAxXG5cbiAgaWYgbGFzdEZhY3RvciAhPSAwXG4gICAgICBjb3VudCAqPSBleHBvbmVudCArIDFcblxuICByZXR1cm4gY291bnRcblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgZXF1YWwoZGl2aXNvckNvdW50KCAxKSwgMSwgXCIgMSBoYXMgMSBkaXZpc29yc1wiKVxuICBlcXVhbChkaXZpc29yQ291bnQoIDMpLCAyLCBcIiAzIGhhcyAyIGRpdmlzb3JzXCIpXG4gIGVxdWFsKGRpdmlzb3JDb3VudCggNiksIDQsIFwiIDYgaGFzIDQgZGl2aXNvcnNcIilcbiAgZXF1YWwoZGl2aXNvckNvdW50KDEwKSwgNCwgXCIxMCBoYXMgNCBkaXZpc29yc1wiKVxuICBlcXVhbChkaXZpc29yQ291bnQoMTUpLCA0LCBcIjE1IGhhcyA0IGRpdmlzb3JzXCIpXG4gIGVxdWFsKGRpdmlzb3JDb3VudCgyMSksIDQsIFwiMjEgaGFzIDQgZGl2aXNvcnNcIilcbiAgZXF1YWwoZGl2aXNvckNvdW50KDI4KSwgNiwgXCIyOCBoYXMgNiBkaXZpc29yc1wiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIG4gPSAxXG4gIHN0ZXAgPSAyXG5cbiAgbG9vcFxuICAgIGNvdW50ID0gZGl2aXNvckNvdW50KG4pXG4gICAgaWYgY291bnQgPiA1MDBcbiAgICAgIHJldHVybiB7IG46IG4sIGNvdW50OiBjb3VudCB9XG5cbiAgICAjIG5leHQgdHJpYW5ndWxhciBudW1iZXJcbiAgICBuICs9IHN0ZXBcbiAgICBzdGVwKytcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDEzOiBMYXJnZSBzdW1cbi0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5Xb3JrIG91dCB0aGUgZmlyc3QgdGVuIGRpZ2l0cyBvZiB0aGUgc3VtIG9mIHRoZSBmb2xsb3dpbmcgb25lLWh1bmRyZWQgNTAtZGlnaXQgbnVtYmVycy5cblxuMzcxMDcyODc1MzM5MDIxMDI3OTg3OTc5OTgyMjA4Mzc1OTAyNDY1MTAxMzU3NDAyNTBcbjQ2Mzc2OTM3Njc3NDkwMDA5NzEyNjQ4MTI0ODk2OTcwMDc4MDUwNDE3MDE4MjYwNTM4XG43NDMyNDk4NjE5OTUyNDc0MTA1OTQ3NDIzMzMwOTUxMzA1ODEyMzcyNjYxNzMwOTYyOVxuOTE5NDIyMTMzNjM1NzQxNjE1NzI1MjI0MzA1NjMzMDE4MTEwNzI0MDYxNTQ5MDgyNTBcbjIzMDY3NTg4MjA3NTM5MzQ2MTcxMTcxOTgwMzEwNDIxMDQ3NTEzNzc4MDYzMjQ2Njc2XG44OTI2MTY3MDY5NjYyMzYzMzgyMDEzNjM3ODQxODM4MzY4NDE3ODczNDM2MTcyNjc1N1xuMjgxMTI4Nzk4MTI4NDk5Nzk0MDgwNjU0ODE5MzE1OTI2MjE2OTEyNzU4ODk4MzI3MzhcbjQ0Mjc0MjI4OTE3NDMyNTIwMzIxOTIzNTg5NDIyODc2Nzk2NDg3NjcwMjcyMTg5MzE4XG40NzQ1MTQ0NTczNjAwMTMwNjQzOTA5MTE2NzIxNjg1Njg0NDU4ODcxMTYwMzE1MzI3NlxuNzAzODY0ODYxMDU4NDMwMjU0Mzk5Mzk2MTk4Mjg5MTc1OTM2NjU2ODY3NTc5MzQ5NTFcbjYyMTc2NDU3MTQxODU2NTYwNjI5NTAyMTU3MjIzMTk2NTg2NzU1MDc5MzI0MTkzMzMxXG42NDkwNjM1MjQ2Mjc0MTkwNDkyOTEwMTQzMjQ0NTgxMzgyMjY2MzM0Nzk0NDc1ODE3OFxuOTI1NzU4Njc3MTgzMzcyMTc2NjE5NjM3NTE1OTA1NzkyMzk3MjgyNDU1OTg4Mzg0MDdcbjU4MjAzNTY1MzI1MzU5Mzk5MDA4NDAyNjMzNTY4OTQ4ODMwMTg5NDU4NjI4MjI3ODI4XG44MDE4MTE5OTM4NDgyNjI4MjAxNDI3ODE5NDEzOTk0MDU2NzU4NzE1MTE3MDA5NDM5MFxuMzUzOTg2NjQzNzI4MjcxMTI2NTM4Mjk5ODcyNDA3ODQ0NzMwNTMxOTAxMDQyOTM1ODZcbjg2NTE1NTA2MDA2Mjk1ODY0ODYxNTMyMDc1MjczMzcxOTU5MTkxNDIwNTE3MjU1ODI5XG43MTY5Mzg4ODcwNzcxNTQ2NjQ5OTExNTU5MzQ4NzYwMzUzMjkyMTcxNDk3MDA1NjkzOFxuNTQzNzAwNzA1NzY4MjY2ODQ2MjQ2MjE0OTU2NTAwNzY0NzE3ODcyOTQ0MzgzNzc2MDRcbjUzMjgyNjU0MTA4NzU2ODI4NDQzMTkxMTkwNjM0Njk0MDM3ODU1MjE3Nzc5Mjk1MTQ1XG4zNjEyMzI3MjUyNTAwMDI5NjA3MTA3NTA4MjU2MzgxNTY1NjcxMDg4NTI1ODM1MDcyMVxuNDU4NzY1NzYxNzI0MTA5NzY0NDczMzkxMTA2MDcyMTgyNjUyMzY4NzcyMjM2MzYwNDVcbjE3NDIzNzA2OTA1ODUxODYwNjYwNDQ4MjA3NjIxMjA5ODEzMjg3ODYwNzMzOTY5NDEyXG44MTE0MjY2MDQxODA4NjgzMDYxOTMyODQ2MDgxMTE5MTA2MTU1Njk0MDUxMjY4OTY5MlxuNTE5MzQzMjU0NTE3MjgzODg2NDE5MTgwNDcwNDkyOTMyMTUwNTg2NDI1NjMwNDk0ODNcbjYyNDY3MjIxNjQ4NDM1MDc2MjAxNzI3OTE4MDM5OTQ0NjkzMDA0NzMyOTU2MzQwNjkxXG4xNTczMjQ0NDM4NjkwODEyNTc5NDUxNDA4OTA1NzcwNjIyOTQyOTE5NzEwNzkyODIwOVxuNTUwMzc2ODc1MjU2Nzg3NzMwOTE4NjI1NDA3NDQ5Njk4NDQ1MDgzMzAzOTM2ODIxMjZcbjE4MzM2Mzg0ODI1MzMwMTU0Njg2MTk2MTI0MzQ4NzY3NjgxMjk3NTM0Mzc1OTQ2NTE1XG44MDM4NjI4NzU5Mjg3ODQ5MDIwMTUyMTY4NTU1NDgyODcxNzIwMTIxOTI1Nzc2Njk1NFxuNzgxODI4MzM3NTc5OTMxMDM2MTQ3NDAzNTY4NTY0NDkwOTU1MjcwOTc4NjQ3OTc1ODFcbjE2NzI2MzIwMTAwNDM2ODk3ODQyNTUzNTM5OTIwOTMxODM3NDQxNDk3ODA2ODYwOTg0XG40ODQwMzA5ODEyOTA3Nzc5MTc5OTA4ODIxODc5NTMyNzM2NDQ3NTY3NTU5MDg0ODAzMFxuODcwODY5ODc1NTEzOTI3MTE4NTQ1MTcwNzg1NDQxNjE4NTI0MjQzMjA2OTMxNTAzMzJcbjU5OTU5NDA2ODk1NzU2NTM2NzgyMTA3MDc0OTI2OTY2NTM3Njc2MzI2MjM1NDQ3MjEwXG42OTc5Mzk1MDY3OTY1MjY5NDc0MjU5NzcwOTczOTE2NjY5Mzc2MzA0MjYzMzk4NzA4NVxuNDEwNTI2ODQ3MDgyOTkwODUyMTEzOTk0MjczNjU3MzQxMTYxODI3NjAzMTUwMDEyNzFcbjY1Mzc4NjA3MzYxNTAxMDgwODU3MDA5MTQ5OTM5NTEyNTU3MDI4MTk4NzQ2MDA0Mzc1XG4zNTgyOTAzNTMxNzQzNDcxNzMyNjkzMjEyMzU3ODE1NDk4MjYyOTc0MjU1MjczNzMwN1xuOTQ5NTM3NTk3NjUxMDUzMDU5NDY5NjYwNjc2ODMxNTY1NzQzNzcxNjc0MDE4NzUyNzVcbjg4OTAyODAyNTcxNzMzMjI5NjE5MTc2NjY4NzEzODE5OTMxODExMDQ4NzcwMTkwMjcxXG4yNTI2NzY4MDI3NjA3ODAwMzAxMzY3ODY4MDk5MjUyNTQ2MzQwMTA2MTYzMjg2NjUyNlxuMzYyNzAyMTg1NDA0OTc3MDU1ODU2Mjk5NDY1ODA2MzYyMzc5OTMxNDA3NDYyNTU5NjJcbjI0MDc0NDg2OTA4MjMxMTc0OTc3NzkyMzY1NDY2MjU3MjQ2OTIzMzIyODEwOTE3MTQxXG45MTQzMDI4ODE5NzEwMzI4ODU5NzgwNjY2OTc2MDg5MjkzODYzODI4NTAyNTMzMzQwM1xuMzQ0MTMwNjU1NzgwMTYxMjc4MTU5MjE4MTUwMDU1NjE4Njg4MzY0Njg0MjAwOTA0NzBcbjIzMDUzMDgxMTcyODE2NDMwNDg3NjIzNzkxOTY5ODQyNDg3MjU1MDM2NjM4Nzg0NTgzXG4xMTQ4NzY5NjkzMjE1NDkwMjgxMDQyNDAyMDEzODMzNTEyNDQ2MjE4MTQ0MTc3MzQ3MFxuNjM3ODMyOTk0OTA2MzYyNTk2NjY0OTg1ODc2MTgyMjEyMjUyMjU1MTI0ODY3NjQ1MzNcbjY3NzIwMTg2OTcxNjk4NTQ0MzEyNDE5NTcyNDA5OTEzOTU5MDA4OTUyMzEwMDU4ODIyXG45NTU0ODI1NTMwMDI2MzUyMDc4MTUzMjI5Njc5NjI0OTQ4MTY0MTk1Mzg2ODIxODc3NFxuNzYwODUzMjcxMzIyODU3MjMxMTA0MjQ4MDM0NTYxMjQ4Njc2OTcwNjQ1MDc5OTUyMzZcbjM3Nzc0MjQyNTM1NDExMjkxNjg0Mjc2ODY1NTM4OTI2MjA1MDI0OTEwMzI2NTcyOTY3XG4yMzcwMTkxMzI3NTcyNTY3NTI4NTY1MzI0ODI1ODI2NTQ2MzA5MjIwNzA1ODU5NjUyMlxuMjk3OTg4NjAyNzIyNTgzMzE5MTMxMjYzNzUxNDczNDE5OTQ4ODk1MzQ3NjU3NDU1MDFcbjE4NDk1NzAxNDU0ODc5Mjg4OTg0ODU2ODI3NzI2MDc3NzEzNzIxNDAzNzk4ODc5NzE1XG4zODI5ODIwMzc4MzAzMTQ3MzUyNzcyMTU4MDM0ODE0NDUxMzQ5MTM3MzIyNjY1MTM4MVxuMzQ4Mjk1NDM4MjkxOTk5MTgxODAyNzg5MTY1MjI0MzEwMjczOTIyNTExMjI4Njk1MzlcbjQwOTU3OTUzMDY2NDA1MjMyNjMyNTM4MDQ0MTAwMDU5NjU0OTM5MTU5ODc5NTkzNjM1XG4yOTc0NjE1MjE4NTUwMjM3MTMwNzY0MjI1NTEyMTE4MzY5MzgwMzU4MDM4ODU4NDkwM1xuNDE2OTgxMTYyMjIwNzI5NzcxODYxNTgyMzY2Nzg0MjQ2ODkxNTc5OTM1MzI5NjE5MjJcbjYyNDY3OTU3MTk0NDAxMjY5MDQzODc3MTA3Mjc1MDQ4MTAyMzkwODk1NTIzNTk3NDU3XG4yMzE4OTcwNjc3MjU0NzkxNTA2MTUwNTUwNDk1MzkyMjk3OTUzMDkwMTEyOTk2NzUxOVxuODYxODgwODgyMjU4NzUzMTQ1Mjk1ODQwOTkyNTEyMDM4MjkwMDk0MDc3NzA3NzU2NzJcbjExMzA2NzM5NzA4MzA0NzI0NDgzODE2NTMzODczNTAyMzQwODQ1NjQ3MDU4MDc3MzA4XG44Mjk1OTE3NDc2NzE0MDM2MzE5ODAwODE4NzEyOTAxMTg3NTQ5MTMxMDU0NzEyNjU4MVxuOTc2MjMzMzEwNDQ4MTgzODYyNjk1MTU0NTYzMzQ5MjYzNjY1NzI4OTc1NjM0MDA1MDBcbjQyODQ2MjgwMTgzNTE3MDcwNTI3ODMxODM5NDI1ODgyMTQ1NTIxMjI3MjUxMjUwMzI3XG41NTEyMTYwMzU0Njk4MTIwMDU4MTc2MjE2NTIxMjgyNzY1Mjc1MTY5MTI5Njg5Nzc4OVxuMzIyMzgxOTU3MzQzMjkzMzk5NDY0Mzc1MDE5MDc4MzY5NDU3NjU4ODMzNTIzOTk4ODZcbjc1NTA2MTY0OTY1MTg0Nzc1MTgwNzM4MTY4ODM3ODYxMDkxNTI3MzU3OTI5NzAxMzM3XG42MjE3Nzg0Mjc1MjE5MjYyMzQwMTk0MjM5OTYzOTE2ODA0NDk4Mzk5MzE3MzMxMjczMVxuMzI5MjQxODU3MDcxNDczNDk1NjY5MTY2NzQ2ODc2MzQ2NjA5MTUwMzU5MTQ2Nzc1MDRcbjk5NTE4NjcxNDMwMjM1MjE5NjI4ODk0ODkwMTAyNDIzMzI1MTE2OTEzNjE5NjI2NjIyXG43MzI2NzQ2MDgwMDU5MTU0NzQ3MTgzMDc5ODM5Mjg2ODUzNTIwNjk0Njk0NDU0MDcyNFxuNzY4NDE4MjI1MjQ2NzQ0MTcxNjE1MTQwMzY0Mjc5ODIyNzMzNDgwNTU1NTYyMTQ4MThcbjk3MTQyNjE3OTEwMzQyNTk4NjQ3MjA0NTE2ODkzOTg5NDIyMTc5ODI2MDg4MDc2ODUyXG44Nzc4MzY0NjE4Mjc5OTM0NjMxMzc2Nzc1NDMwNzgwOTM2MzMzMzAxODk4MjY0MjA5MFxuMTA4NDg4MDI1MjE2NzQ2NzA4ODMyMTUxMjAxODU4ODM1NDMyMjM4MTI4NzY5NTI3ODZcbjcxMzI5NjEyNDc0NzgyNDY0NTM4NjM2OTkzMDA5MDQ5MzEwMzYzNjE5NzYzODc4MDM5XG42MjE4NDA3MzU3MjM5OTc5NDIyMzQwNjIzNTM5MzgwODMzOTY1MTMyNzQwODAxMTExNlxuNjY2Mjc4OTE5ODE0ODgwODc3OTc5NDE4NzY4NzYxNDQyMzAwMzA5ODQ0OTA4NTE0MTFcbjYwNjYxODI2MjkzNjgyODM2NzY0NzQ0Nzc5MjM5MTgwMzM1MTEwOTg5MDY5NzkwNzE0XG44NTc4Njk0NDA4OTU1Mjk5MDY1MzY0MDQ0NzQyNTU3NjA4MzY1OTk3NjY0NTc5NTA5NlxuNjYwMjQzOTY0MDk5MDUzODk2MDcxMjAxOTgyMTk5NzYwNDc1OTk0OTAxOTcyMzAyOTdcbjY0OTEzOTgyNjgwMDMyOTczMTU2MDM3MTIwMDQxMzc3OTAzNzg1NTY2MDg1MDg5MjUyXG4xNjczMDkzOTMxOTg3Mjc1MDI3NTQ2ODkwNjkwMzcwNzUzOTQxMzA0MjY1MjMxNTAxMVxuOTQ4MDkzNzcyNDUwNDg3OTUxNTA5NTQxMDA5MjE2NDU4NjM3NTQ3MTA1OTg0MzY3OTFcbjc4NjM5MTY3MDIxMTg3NDkyNDMxOTk1NzAwNjQxOTE3OTY5Nzc3NTk5MDI4MzAwNjk5XG4xNTM2ODcxMzcxMTkzNjYxNDk1MjgxMTMwNTg3NjM4MDI3ODQxMDc1NDQ0OTczMzA3OFxuNDA3ODk5MjMxMTU1MzU1NjI1NjExNDIzMjI0MjMyNTUwMzM2ODU0NDI0ODg5MTczNTNcbjQ0ODg5OTExNTAxNDQwNjQ4MDIwMzY5MDY4MDYzOTYwNjcyMzIyMTkzMjA0MTQ5NTM1XG40MTUwMzEyODg4MDMzOTUzNjA1MzI5OTM0MDM2ODAwNjk3NzcxMDY1MDU2NjYzMTk1NFxuODEyMzQ4ODA2NzMyMTAxNDY3MzkwNTg1Njg1NTc5MzQ1ODE0MDM2Mjc4MjI3MDMyODBcbjgyNjE2NTcwNzczOTQ4MzI3NTkyMjMyODQ1OTQxNzA2NTI1MDk0NTEyMzI1MjMwNjA4XG4yMjkxODgwMjA1ODc3NzMxOTcxOTgzOTQ1MDE4MDg4ODA3MjQyOTY2MTk4MDgxMTE5N1xuNzcxNTg1NDI1MDIwMTY1NDUwOTA0MTMyNDU4MDk3ODY4ODI3Nzg5NDg3MjE4NTk2MTdcbjcyMTA3ODM4NDM1MDY5MTg2MTU1NDM1NjYyODg0MDYyMjU3NDczNjkyMjg0NTA5NTE2XG4yMDg0OTYwMzk4MDEzNDAwMTcyMzkzMDY3MTY2NjgyMzU1NTI0NTI1MjgwNDYwOTcyMlxuNTM1MDM1MzQyMjY0NzI1MjQyNTA4NzQwNTQwNzU1OTE3ODk3ODEyNjQzMzAzMzE2OTBcblxuXCJcIlwiXG5cbm51bWJlcnMgPSBbXG4gIDM3MTA3Mjg3NTMzOTAyMTAyNzk4Nzk3OTk4MjIwODM3NTkwMjQ2NTEwMTM1NzQwMjUwXG4gIDQ2Mzc2OTM3Njc3NDkwMDA5NzEyNjQ4MTI0ODk2OTcwMDc4MDUwNDE3MDE4MjYwNTM4XG4gIDc0MzI0OTg2MTk5NTI0NzQxMDU5NDc0MjMzMzA5NTEzMDU4MTIzNzI2NjE3MzA5NjI5XG4gIDkxOTQyMjEzMzYzNTc0MTYxNTcyNTIyNDMwNTYzMzAxODExMDcyNDA2MTU0OTA4MjUwXG4gIDIzMDY3NTg4MjA3NTM5MzQ2MTcxMTcxOTgwMzEwNDIxMDQ3NTEzNzc4MDYzMjQ2Njc2XG4gIDg5MjYxNjcwNjk2NjIzNjMzODIwMTM2Mzc4NDE4MzgzNjg0MTc4NzM0MzYxNzI2NzU3XG4gIDI4MTEyODc5ODEyODQ5OTc5NDA4MDY1NDgxOTMxNTkyNjIxNjkxMjc1ODg5ODMyNzM4XG4gIDQ0Mjc0MjI4OTE3NDMyNTIwMzIxOTIzNTg5NDIyODc2Nzk2NDg3NjcwMjcyMTg5MzE4XG4gIDQ3NDUxNDQ1NzM2MDAxMzA2NDM5MDkxMTY3MjE2ODU2ODQ0NTg4NzExNjAzMTUzMjc2XG4gIDcwMzg2NDg2MTA1ODQzMDI1NDM5OTM5NjE5ODI4OTE3NTkzNjY1Njg2NzU3OTM0OTUxXG4gIDYyMTc2NDU3MTQxODU2NTYwNjI5NTAyMTU3MjIzMTk2NTg2NzU1MDc5MzI0MTkzMzMxXG4gIDY0OTA2MzUyNDYyNzQxOTA0OTI5MTAxNDMyNDQ1ODEzODIyNjYzMzQ3OTQ0NzU4MTc4XG4gIDkyNTc1ODY3NzE4MzM3MjE3NjYxOTYzNzUxNTkwNTc5MjM5NzI4MjQ1NTk4ODM4NDA3XG4gIDU4MjAzNTY1MzI1MzU5Mzk5MDA4NDAyNjMzNTY4OTQ4ODMwMTg5NDU4NjI4MjI3ODI4XG4gIDgwMTgxMTk5Mzg0ODI2MjgyMDE0Mjc4MTk0MTM5OTQwNTY3NTg3MTUxMTcwMDk0MzkwXG4gIDM1Mzk4NjY0MzcyODI3MTEyNjUzODI5OTg3MjQwNzg0NDczMDUzMTkwMTA0MjkzNTg2XG4gIDg2NTE1NTA2MDA2Mjk1ODY0ODYxNTMyMDc1MjczMzcxOTU5MTkxNDIwNTE3MjU1ODI5XG4gIDcxNjkzODg4NzA3NzE1NDY2NDk5MTE1NTkzNDg3NjAzNTMyOTIxNzE0OTcwMDU2OTM4XG4gIDU0MzcwMDcwNTc2ODI2Njg0NjI0NjIxNDk1NjUwMDc2NDcxNzg3Mjk0NDM4Mzc3NjA0XG4gIDUzMjgyNjU0MTA4NzU2ODI4NDQzMTkxMTkwNjM0Njk0MDM3ODU1MjE3Nzc5Mjk1MTQ1XG4gIDM2MTIzMjcyNTI1MDAwMjk2MDcxMDc1MDgyNTYzODE1NjU2NzEwODg1MjU4MzUwNzIxXG4gIDQ1ODc2NTc2MTcyNDEwOTc2NDQ3MzM5MTEwNjA3MjE4MjY1MjM2ODc3MjIzNjM2MDQ1XG4gIDE3NDIzNzA2OTA1ODUxODYwNjYwNDQ4MjA3NjIxMjA5ODEzMjg3ODYwNzMzOTY5NDEyXG4gIDgxMTQyNjYwNDE4MDg2ODMwNjE5MzI4NDYwODExMTkxMDYxNTU2OTQwNTEyNjg5NjkyXG4gIDUxOTM0MzI1NDUxNzI4Mzg4NjQxOTE4MDQ3MDQ5MjkzMjE1MDU4NjQyNTYzMDQ5NDgzXG4gIDYyNDY3MjIxNjQ4NDM1MDc2MjAxNzI3OTE4MDM5OTQ0NjkzMDA0NzMyOTU2MzQwNjkxXG4gIDE1NzMyNDQ0Mzg2OTA4MTI1Nzk0NTE0MDg5MDU3NzA2MjI5NDI5MTk3MTA3OTI4MjA5XG4gIDU1MDM3Njg3NTI1Njc4NzczMDkxODYyNTQwNzQ0OTY5ODQ0NTA4MzMwMzkzNjgyMTI2XG4gIDE4MzM2Mzg0ODI1MzMwMTU0Njg2MTk2MTI0MzQ4NzY3NjgxMjk3NTM0Mzc1OTQ2NTE1XG4gIDgwMzg2Mjg3NTkyODc4NDkwMjAxNTIxNjg1NTU0ODI4NzE3MjAxMjE5MjU3NzY2OTU0XG4gIDc4MTgyODMzNzU3OTkzMTAzNjE0NzQwMzU2ODU2NDQ5MDk1NTI3MDk3ODY0Nzk3NTgxXG4gIDE2NzI2MzIwMTAwNDM2ODk3ODQyNTUzNTM5OTIwOTMxODM3NDQxNDk3ODA2ODYwOTg0XG4gIDQ4NDAzMDk4MTI5MDc3NzkxNzk5MDg4MjE4Nzk1MzI3MzY0NDc1Njc1NTkwODQ4MDMwXG4gIDg3MDg2OTg3NTUxMzkyNzExODU0NTE3MDc4NTQ0MTYxODUyNDI0MzIwNjkzMTUwMzMyXG4gIDU5OTU5NDA2ODk1NzU2NTM2NzgyMTA3MDc0OTI2OTY2NTM3Njc2MzI2MjM1NDQ3MjEwXG4gIDY5NzkzOTUwNjc5NjUyNjk0NzQyNTk3NzA5NzM5MTY2NjkzNzYzMDQyNjMzOTg3MDg1XG4gIDQxMDUyNjg0NzA4Mjk5MDg1MjExMzk5NDI3MzY1NzM0MTE2MTgyNzYwMzE1MDAxMjcxXG4gIDY1Mzc4NjA3MzYxNTAxMDgwODU3MDA5MTQ5OTM5NTEyNTU3MDI4MTk4NzQ2MDA0Mzc1XG4gIDM1ODI5MDM1MzE3NDM0NzE3MzI2OTMyMTIzNTc4MTU0OTgyNjI5NzQyNTUyNzM3MzA3XG4gIDk0OTUzNzU5NzY1MTA1MzA1OTQ2OTY2MDY3NjgzMTU2NTc0Mzc3MTY3NDAxODc1Mjc1XG4gIDg4OTAyODAyNTcxNzMzMjI5NjE5MTc2NjY4NzEzODE5OTMxODExMDQ4NzcwMTkwMjcxXG4gIDI1MjY3NjgwMjc2MDc4MDAzMDEzNjc4NjgwOTkyNTI1NDYzNDAxMDYxNjMyODY2NTI2XG4gIDM2MjcwMjE4NTQwNDk3NzA1NTg1NjI5OTQ2NTgwNjM2MjM3OTkzMTQwNzQ2MjU1OTYyXG4gIDI0MDc0NDg2OTA4MjMxMTc0OTc3NzkyMzY1NDY2MjU3MjQ2OTIzMzIyODEwOTE3MTQxXG4gIDkxNDMwMjg4MTk3MTAzMjg4NTk3ODA2NjY5NzYwODkyOTM4NjM4Mjg1MDI1MzMzNDAzXG4gIDM0NDEzMDY1NTc4MDE2MTI3ODE1OTIxODE1MDA1NTYxODY4ODM2NDY4NDIwMDkwNDcwXG4gIDIzMDUzMDgxMTcyODE2NDMwNDg3NjIzNzkxOTY5ODQyNDg3MjU1MDM2NjM4Nzg0NTgzXG4gIDExNDg3Njk2OTMyMTU0OTAyODEwNDI0MDIwMTM4MzM1MTI0NDYyMTgxNDQxNzczNDcwXG4gIDYzNzgzMjk5NDkwNjM2MjU5NjY2NDk4NTg3NjE4MjIxMjI1MjI1NTEyNDg2NzY0NTMzXG4gIDY3NzIwMTg2OTcxNjk4NTQ0MzEyNDE5NTcyNDA5OTEzOTU5MDA4OTUyMzEwMDU4ODIyXG4gIDk1NTQ4MjU1MzAwMjYzNTIwNzgxNTMyMjk2Nzk2MjQ5NDgxNjQxOTUzODY4MjE4Nzc0XG4gIDc2MDg1MzI3MTMyMjg1NzIzMTEwNDI0ODAzNDU2MTI0ODY3Njk3MDY0NTA3OTk1MjM2XG4gIDM3Nzc0MjQyNTM1NDExMjkxNjg0Mjc2ODY1NTM4OTI2MjA1MDI0OTEwMzI2NTcyOTY3XG4gIDIzNzAxOTEzMjc1NzI1Njc1Mjg1NjUzMjQ4MjU4MjY1NDYzMDkyMjA3MDU4NTk2NTIyXG4gIDI5Nzk4ODYwMjcyMjU4MzMxOTEzMTI2Mzc1MTQ3MzQxOTk0ODg5NTM0NzY1NzQ1NTAxXG4gIDE4NDk1NzAxNDU0ODc5Mjg4OTg0ODU2ODI3NzI2MDc3NzEzNzIxNDAzNzk4ODc5NzE1XG4gIDM4Mjk4MjAzNzgzMDMxNDczNTI3NzIxNTgwMzQ4MTQ0NTEzNDkxMzczMjI2NjUxMzgxXG4gIDM0ODI5NTQzODI5MTk5OTE4MTgwMjc4OTE2NTIyNDMxMDI3MzkyMjUxMTIyODY5NTM5XG4gIDQwOTU3OTUzMDY2NDA1MjMyNjMyNTM4MDQ0MTAwMDU5NjU0OTM5MTU5ODc5NTkzNjM1XG4gIDI5NzQ2MTUyMTg1NTAyMzcxMzA3NjQyMjU1MTIxMTgzNjkzODAzNTgwMzg4NTg0OTAzXG4gIDQxNjk4MTE2MjIyMDcyOTc3MTg2MTU4MjM2Njc4NDI0Njg5MTU3OTkzNTMyOTYxOTIyXG4gIDYyNDY3OTU3MTk0NDAxMjY5MDQzODc3MTA3Mjc1MDQ4MTAyMzkwODk1NTIzNTk3NDU3XG4gIDIzMTg5NzA2NzcyNTQ3OTE1MDYxNTA1NTA0OTUzOTIyOTc5NTMwOTAxMTI5OTY3NTE5XG4gIDg2MTg4MDg4MjI1ODc1MzE0NTI5NTg0MDk5MjUxMjAzODI5MDA5NDA3NzcwNzc1NjcyXG4gIDExMzA2NzM5NzA4MzA0NzI0NDgzODE2NTMzODczNTAyMzQwODQ1NjQ3MDU4MDc3MzA4XG4gIDgyOTU5MTc0NzY3MTQwMzYzMTk4MDA4MTg3MTI5MDExODc1NDkxMzEwNTQ3MTI2NTgxXG4gIDk3NjIzMzMxMDQ0ODE4Mzg2MjY5NTE1NDU2MzM0OTI2MzY2NTcyODk3NTYzNDAwNTAwXG4gIDQyODQ2MjgwMTgzNTE3MDcwNTI3ODMxODM5NDI1ODgyMTQ1NTIxMjI3MjUxMjUwMzI3XG4gIDU1MTIxNjAzNTQ2OTgxMjAwNTgxNzYyMTY1MjEyODI3NjUyNzUxNjkxMjk2ODk3Nzg5XG4gIDMyMjM4MTk1NzM0MzI5MzM5OTQ2NDM3NTAxOTA3ODM2OTQ1NzY1ODgzMzUyMzk5ODg2XG4gIDc1NTA2MTY0OTY1MTg0Nzc1MTgwNzM4MTY4ODM3ODYxMDkxNTI3MzU3OTI5NzAxMzM3XG4gIDYyMTc3ODQyNzUyMTkyNjIzNDAxOTQyMzk5NjM5MTY4MDQ0OTgzOTkzMTczMzEyNzMxXG4gIDMyOTI0MTg1NzA3MTQ3MzQ5NTY2OTE2Njc0Njg3NjM0NjYwOTE1MDM1OTE0Njc3NTA0XG4gIDk5NTE4NjcxNDMwMjM1MjE5NjI4ODk0ODkwMTAyNDIzMzI1MTE2OTEzNjE5NjI2NjIyXG4gIDczMjY3NDYwODAwNTkxNTQ3NDcxODMwNzk4MzkyODY4NTM1MjA2OTQ2OTQ0NTQwNzI0XG4gIDc2ODQxODIyNTI0Njc0NDE3MTYxNTE0MDM2NDI3OTgyMjczMzQ4MDU1NTU2MjE0ODE4XG4gIDk3MTQyNjE3OTEwMzQyNTk4NjQ3MjA0NTE2ODkzOTg5NDIyMTc5ODI2MDg4MDc2ODUyXG4gIDg3NzgzNjQ2MTgyNzk5MzQ2MzEzNzY3NzU0MzA3ODA5MzYzMzMzMDE4OTgyNjQyMDkwXG4gIDEwODQ4ODAyNTIxNjc0NjcwODgzMjE1MTIwMTg1ODgzNTQzMjIzODEyODc2OTUyNzg2XG4gIDcxMzI5NjEyNDc0NzgyNDY0NTM4NjM2OTkzMDA5MDQ5MzEwMzYzNjE5NzYzODc4MDM5XG4gIDYyMTg0MDczNTcyMzk5Nzk0MjIzNDA2MjM1MzkzODA4MzM5NjUxMzI3NDA4MDExMTE2XG4gIDY2NjI3ODkxOTgxNDg4MDg3Nzk3OTQxODc2ODc2MTQ0MjMwMDMwOTg0NDkwODUxNDExXG4gIDYwNjYxODI2MjkzNjgyODM2NzY0NzQ0Nzc5MjM5MTgwMzM1MTEwOTg5MDY5NzkwNzE0XG4gIDg1Nzg2OTQ0MDg5NTUyOTkwNjUzNjQwNDQ3NDI1NTc2MDgzNjU5OTc2NjQ1Nzk1MDk2XG4gIDY2MDI0Mzk2NDA5OTA1Mzg5NjA3MTIwMTk4MjE5OTc2MDQ3NTk5NDkwMTk3MjMwMjk3XG4gIDY0OTEzOTgyNjgwMDMyOTczMTU2MDM3MTIwMDQxMzc3OTAzNzg1NTY2MDg1MDg5MjUyXG4gIDE2NzMwOTM5MzE5ODcyNzUwMjc1NDY4OTA2OTAzNzA3NTM5NDEzMDQyNjUyMzE1MDExXG4gIDk0ODA5Mzc3MjQ1MDQ4Nzk1MTUwOTU0MTAwOTIxNjQ1ODYzNzU0NzEwNTk4NDM2NzkxXG4gIDc4NjM5MTY3MDIxMTg3NDkyNDMxOTk1NzAwNjQxOTE3OTY5Nzc3NTk5MDI4MzAwNjk5XG4gIDE1MzY4NzEzNzExOTM2NjE0OTUyODExMzA1ODc2MzgwMjc4NDEwNzU0NDQ5NzMzMDc4XG4gIDQwNzg5OTIzMTE1NTM1NTYyNTYxMTQyMzIyNDIzMjU1MDMzNjg1NDQyNDg4OTE3MzUzXG4gIDQ0ODg5OTExNTAxNDQwNjQ4MDIwMzY5MDY4MDYzOTYwNjcyMzIyMTkzMjA0MTQ5NTM1XG4gIDQxNTAzMTI4ODgwMzM5NTM2MDUzMjk5MzQwMzY4MDA2OTc3NzEwNjUwNTY2NjMxOTU0XG4gIDgxMjM0ODgwNjczMjEwMTQ2NzM5MDU4NTY4NTU3OTM0NTgxNDAzNjI3ODIyNzAzMjgwXG4gIDgyNjE2NTcwNzczOTQ4MzI3NTkyMjMyODQ1OTQxNzA2NTI1MDk0NTEyMzI1MjMwNjA4XG4gIDIyOTE4ODAyMDU4Nzc3MzE5NzE5ODM5NDUwMTgwODg4MDcyNDI5NjYxOTgwODExMTk3XG4gIDc3MTU4NTQyNTAyMDE2NTQ1MDkwNDEzMjQ1ODA5Nzg2ODgyNzc4OTQ4NzIxODU5NjE3XG4gIDcyMTA3ODM4NDM1MDY5MTg2MTU1NDM1NjYyODg0MDYyMjU3NDczNjkyMjg0NTA5NTE2XG4gIDIwODQ5NjAzOTgwMTM0MDAxNzIzOTMwNjcxNjY2ODIzNTU1MjQ1MjUyODA0NjA5NzIyXG4gIDUzNTAzNTM0MjI2NDcyNTI0MjUwODc0MDU0MDc1NTkxNzg5NzgxMjY0MzMwMzMxNjkwXG5dXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgc3VtID0gMFxuICBmb3IgbiBpbiBudW1iZXJzXG4gICAgc3VtICs9IG5cblxuICBzdHIgPSBTdHJpbmcoc3VtKS5yZXBsYWNlKC9cXC4vZywgXCJcIikuc3Vic3RyKDAsIDEwKVxuICByZXR1cm4gc3RyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAxNDogTG9uZ2VzdCBDb2xsYXR6IHNlcXVlbmNlXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuVGhlIGZvbGxvd2luZyBpdGVyYXRpdmUgc2VxdWVuY2UgaXMgZGVmaW5lZCBmb3IgdGhlIHNldCBvZiBwb3NpdGl2ZSBpbnRlZ2VyczpcblxuICAgIG4gLT4gbi8yICAgIChuIGlzIGV2ZW4pXG4gICAgbiAtPiAzbiArIDEgKG4gaXMgb2RkKVxuXG5Vc2luZyB0aGUgcnVsZSBhYm92ZSBhbmQgc3RhcnRpbmcgd2l0aCAxMywgd2UgZ2VuZXJhdGUgdGhlIGZvbGxvd2luZyBzZXF1ZW5jZTpcblxuICAgIDEzIC0+IDQwIC0+IDIwIC0+IDEwIC0+IDUgLT4gMTYgLT4gOCAtPiA0IC0+IDIgLT4gMVxuXG5JdCBjYW4gYmUgc2VlbiB0aGF0IHRoaXMgc2VxdWVuY2UgKHN0YXJ0aW5nIGF0IDEzIGFuZCBmaW5pc2hpbmcgYXQgMSkgY29udGFpbnMgMTAgdGVybXMuIEFsdGhvdWdoIGl0IGhhcyBub3QgYmVlbiBwcm92ZWQgeWV0IChDb2xsYXR6IFByb2JsZW0pLCBpdCBpcyB0aG91Z2h0IHRoYXQgYWxsIHN0YXJ0aW5nIG51bWJlcnMgZmluaXNoIGF0IDEuXG5cbldoaWNoIHN0YXJ0aW5nIG51bWJlciwgdW5kZXIgb25lIG1pbGxpb24sIHByb2R1Y2VzIHRoZSBsb25nZXN0IGNoYWluP1xuXG5OT1RFOiBPbmNlIHRoZSBjaGFpbiBzdGFydHMgdGhlIHRlcm1zIGFyZSBhbGxvd2VkIHRvIGdvIGFib3ZlIG9uZSBtaWxsaW9uLlxuXG5cIlwiXCJcblxuY29sbGF0ekNhY2hlID0ge31cblxuY29sbGF0ekNoYWluTGVuZ3RoID0gKHN0YXJ0aW5nVmFsdWUpIC0+XG4gIG4gPSBzdGFydGluZ1ZhbHVlXG4gIHRvQmVDYWNoZWQgPSBbXVxuXG4gIGxvb3BcbiAgICBicmVhayBpZiBjb2xsYXR6Q2FjaGUuaGFzT3duUHJvcGVydHkobilcblxuICAgICMgcmVtZW1iZXIgdGhhdCB3ZSBmYWlsZWQgdG8gY2FjaGUgdGhpcyBlbnRyeVxuICAgIHRvQmVDYWNoZWQucHVzaChuKVxuXG4gICAgaWYgbiA9PSAxXG4gICAgICBicmVha1xuXG4gICAgaWYgKG4gJSAyKSA9PSAwXG4gICAgICBuID0gTWF0aC5mbG9vcihuIC8gMilcbiAgICBlbHNlXG4gICAgICBuID0gKG4gKiAzKSArIDFcblxuICAjIFNpbmNlIHdlIGxlZnQgYnJlYWRjcnVtYnMgZG93biB0aGUgdHJhaWwgb2YgdGhpbmdzIHdlIGhhdmVuJ3QgY2FjaGVkXG4gICMgd2FsayBiYWNrIGRvd24gdGhlIHRyYWlsIGFuZCBjYWNoZSBhbGwgdGhlIGVudHJpZXMgZm91bmQgYWxvbmcgdGhlIHdheVxuICBsZW4gPSB0b0JlQ2FjaGVkLmxlbmd0aFxuICBmb3IgdixpIGluIHRvQmVDYWNoZWRcbiAgICBjb2xsYXR6Q2FjaGVbdl0gPSBjb2xsYXR6Q2FjaGVbbl0gKyAobGVuIC0gaSlcblxuICByZXR1cm4gY29sbGF0ekNhY2hlW3N0YXJ0aW5nVmFsdWVdXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGNvbGxhdHpDYWNoZSA9IHsgXCIxXCI6IDEgfVxuICBlcXVhbChjb2xsYXR6Q2hhaW5MZW5ndGgoMTMpLCAxMCwgXCIxMyBoYXMgYSBjb2xsYXR6IGNoYWluIG9mIDEwXCIpXG4gIGVxdWFsKGNvbGxhdHpDaGFpbkxlbmd0aCgyNiksIDExLCBcIjI2IGhhcyBhIGNvbGxhdHogY2hhaW4gb2YgMTFcIilcbiAgZXF1YWwoY29sbGF0ekNoYWluTGVuZ3RoKCAxKSwgIDEsIFwiMSBoYXMgYSBjb2xsYXR6IGNoYWluIG9mIDFcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICBjb2xsYXR6Q2FjaGUgPSB7IFwiMVwiOiAxIH1cblxuICBtYXhDaGFpbiA9IDBcbiAgbWF4Q2hhaW5MZW5ndGggPSAwXG4gIGZvciBpIGluIFsxLi4uMTAwMDAwMF1cbiAgICBjaGFpbkxlbmd0aCA9IGNvbGxhdHpDaGFpbkxlbmd0aChpKVxuICAgIGlmIG1heENoYWluTGVuZ3RoIDwgY2hhaW5MZW5ndGhcbiAgICAgIG1heENoYWluTGVuZ3RoID0gY2hhaW5MZW5ndGhcbiAgICAgIG1heENoYWluID0gaVxuXG4gIHJldHVybiB7IGFuc3dlcjogbWF4Q2hhaW4sIGNoYWluTGVuZ3RoOiBtYXhDaGFpbkxlbmd0aCB9XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAxNTogTGF0dGljZSBwYXRoc1xuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5TdGFydGluZyBpbiB0aGUgdG9wIGxlZnQgY29ybmVyIG9mIGEgMsOXMiBncmlkLCBhbmQgb25seSBiZWluZyBhYmxlIHRvIG1vdmUgdG8gdGhlIHJpZ2h0IGFuZCBkb3duLCB0aGVyZSBhcmUgZXhhY3RseSA2IHJvdXRlcyB0byB0aGUgYm90dG9tIHJpZ2h0IGNvcm5lci5cblxuICAgIChwaWN0dXJlIHNob3dpbmcgNiBwYXRoczogUlJERCwgUkRSRCwgUkREUiwgRFJSRCwgRFJEUiwgRERSUilcblxuSG93IG1hbnkgc3VjaCByb3V0ZXMgYXJlIHRoZXJlIHRocm91Z2ggYSAyMMOXMjAgZ3JpZD9cblxuXCJcIlwiXG5cbm1hdGggPSByZXF1aXJlIFwibWF0aFwiXG5cbmxhdHRpY2UgPSAobikgLT5cbiAgcmV0dXJuIG1hdGgubkNyKG4gKiAyLCBuKVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChsYXR0aWNlKDEpLCAyLCBcIjF4MSBsYXR0aWNlIGhhcyAyIHBhdGhzXCIpXG4gIGVxdWFsKGxhdHRpY2UoMiksIDYsIFwiMngyIGxhdHRpY2UgaGFzIDYgcGF0aHNcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICByZXR1cm4gbGF0dGljZSgyMClcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDE2OiBQb3dlciBkaWdpdCBzdW1cbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4yXjE1ID0gMzI3NjggYW5kIHRoZSBzdW0gb2YgaXRzIGRpZ2l0cyBpcyAzICsgMiArIDcgKyA2ICsgOCA9IDI2LlxuXG5XaGF0IGlzIHRoZSBzdW0gb2YgdGhlIGRpZ2l0cyBvZiB0aGUgbnVtYmVyIDJeMTAwMD9cblxuXCJcIlwiXG5cbm1hdGggPSByZXF1aXJlIFwibWF0aFwiXG5iaWdJbnQgPSByZXF1aXJlIFwiYmlnLWludGVnZXJcIlxuXG5NQVhfRVhQT05FTlQgPSA1MFxuXG5wb3dlckRpZ2l0U3VtID0gKHgsIHkpIC0+XG4gIG51bWJlciA9IGJpZ0ludCgxKVxuICB3aGlsZSB5ICE9IDBcbiAgICBleHBvbmVudCA9IHlcbiAgICBpZiBleHBvbmVudCA+IE1BWF9FWFBPTkVOVFxuICAgICAgZXhwb25lbnQgPSBNQVhfRVhQT05FTlRcbiAgICB5IC09IGV4cG9uZW50XG4gICAgbnVtYmVyID0gbnVtYmVyLm11bHRpcGx5IE1hdGguZmxvb3IoTWF0aC5wb3coeCwgZXhwb25lbnQpKVxuICBkaWdpdHMgPSBTdHJpbmcobnVtYmVyKVxuXG4gIHN1bSA9IDBcbiAgZm9yIGQgaW4gZGlnaXRzXG4gICAgc3VtICs9IHBhcnNlSW50KGQpXG4gIHJldHVybiBzdW1cblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgZXF1YWwocG93ZXJEaWdpdFN1bSgyLCAxNSksIDI2LCBcInN1bSBvZiBkaWdpdHMgb2YgMl4xNSBpcyAyNlwiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHJldHVybiBwb3dlckRpZ2l0U3VtKDIsIDEwMDApXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAxNzogTnVtYmVyIGxldHRlciBjb3VudHNcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbklmIHRoZSBudW1iZXJzIDEgdG8gNSBhcmUgd3JpdHRlbiBvdXQgaW4gd29yZHM6IG9uZSwgdHdvLCB0aHJlZSwgZm91ciwgZml2ZSwgdGhlbiB0aGVyZSBhcmUgMyArIDMgKyA1ICsgNCArIDQgPSAxOSBsZXR0ZXJzIHVzZWQgaW4gdG90YWwuXG5cbklmIGFsbCB0aGUgbnVtYmVycyBmcm9tIDEgdG8gMTAwMCAob25lIHRob3VzYW5kKSBpbmNsdXNpdmUgd2VyZSB3cml0dGVuIG91dCBpbiB3b3JkcywgaG93IG1hbnkgbGV0dGVycyB3b3VsZCBiZSB1c2VkP1xuXG5OT1RFOiBEbyBub3QgY291bnQgc3BhY2VzIG9yIGh5cGhlbnMuIEZvciBleGFtcGxlLCAzNDIgKHRocmVlIGh1bmRyZWQgYW5kIGZvcnR5LXR3bykgY29udGFpbnMgMjMgbGV0dGVycyBhbmQgMTE1IChvbmUgaHVuZHJlZCBhbmQgZmlmdGVlbikgY29udGFpbnMgMjAgbGV0dGVycy4gVGhlIHVzZSBvZiBcImFuZFwiIHdoZW4gd3JpdGluZyBvdXQgbnVtYmVycyBpcyBpbiBjb21wbGlhbmNlIHdpdGggQnJpdGlzaCB1c2FnZS5cblxuXCJcIlwiXG5cbm5hbWVzID1cbiAgb25lczogXCJ6ZXJvIG9uZSB0d28gdGhyZWUgZm91ciBmaXZlIHNpeCBzZXZlbiBlaWdodCBuaW5lIHRlbiBlbGV2ZW4gdHdlbHZlIHRoaXJ0ZWVuIGZvdXJ0ZWVuIGZpZnRlZW4gc2l4dGVlbiBzZXZlbnRlZW4gZWlnaHRlZW4gbmluZXRlZW5cIi5zcGxpdCgvXFxzKy8pXG4gIHRlbnM6IFwiXyBfIHR3ZW50eSB0aGlydHkgZm9ydHkgZmlmdHkgc2l4dHkgc2V2ZW50eSBlaWdodHkgbmluZXR5XCIuc3BsaXQoL1xccysvKVxuXG4jIHN1cHBvcnRzIDAtOTk5OVxubnVtYmVyTGV0dGVyQ291bnQgPSAobnVtKSAtPlxuICBuID0gbnVtXG4gIG5hbWUgPSBcIlwiXG5cbiAgaWYgbiA+PSAxMDAwXG4gICAgdGhvdXNhbmRzID0gTWF0aC5mbG9vcihuIC8gMTAwMClcbiAgICBuID0gbiAlIDEwMDBcbiAgICBuYW1lICs9IFwiI3tuYW1lcy5vbmVzW3Rob3VzYW5kc119IHRob3VzYW5kIFwiXG5cbiAgaWYgbiA+PSAxMDBcbiAgICBodW5kcmVkcyA9IE1hdGguZmxvb3IobiAvIDEwMClcbiAgICBuID0gbiAlIDEwMFxuICAgIG5hbWUgKz0gXCIje25hbWVzLm9uZXNbaHVuZHJlZHNdfSBodW5kcmVkIFwiXG5cbiAgaWYgKG4gPiAwKSBhbmQgKG5hbWUubGVuZ3RoID4gMClcbiAgICBuYW1lICs9IFwiYW5kIFwiXG5cbiAgaWYgbiA+PSAyMFxuICAgIHRlbnMgPSBNYXRoLmZsb29yKG4gLyAxMClcbiAgICBuID0gbiAlIDEwXG4gICAgbmFtZSArPSBcIiN7bmFtZXMudGVuc1t0ZW5zXX0gXCJcblxuICBpZiBuID4gMFxuICAgIG5hbWUgKz0gXCIje25hbWVzLm9uZXNbbl19IFwiXG5cbiAgbGV0dGVyc09ubHkgPSBuYW1lLnJlcGxhY2UoL1teYS16XS9nLCBcIlwiKVxuICAjIGNvbnNvbGUubG9nIFwibnVtOiAje251bX0sIG5hbWU6ICN7bmFtZX0sIGxldHRlcnNPbmx5OiAje2xldHRlcnNPbmx5fVwiXG4gIHJldHVybiBsZXR0ZXJzT25seS5sZW5ndGhcblxubnVtYmVyTGV0dGVyQ291bnRSYW5nZSA9IChhLCBiKSAtPlxuICBzdW0gPSAwXG4gIGZvciBpIGluIFthLi5iXVxuICAgIHN1bSArPSBudW1iZXJMZXR0ZXJDb3VudChpKVxuICByZXR1cm4gc3VtXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGVxdWFsKG51bWJlckxldHRlckNvdW50UmFuZ2UoMSwgNSksIDE5LCBcInN1bSBvZiBsZW5ndGhzIG9mIG51bWJlcnMgMS01IGlzIDE5XCIpXG4gIGVxdWFsKG51bWJlckxldHRlckNvdW50KDM0MiksIDIzLCBcImxlbmd0aCBvZiBuYW1lIG9mIDM0MiBpcyAyM1wiKVxuICBlcXVhbChudW1iZXJMZXR0ZXJDb3VudCgxMTUpLCAyMCwgXCJsZW5ndGggb2YgbmFtZSBvZiAxMTUgaXMgMjBcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICByZXR1cm4gbnVtYmVyTGV0dGVyQ291bnRSYW5nZSgxLCAxMDAwKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMTg6IE1heGltdW0gcGF0aCBzdW0gSVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbkJ5IHN0YXJ0aW5nIGF0IHRoZSB0b3Agb2YgdGhlIHRyaWFuZ2xlIGJlbG93IGFuZCBtb3ZpbmcgdG8gYWRqYWNlbnQgbnVtYmVycyBvbiB0aGUgcm93IGJlbG93LCB0aGUgbWF4aW11bSB0b3RhbCBmcm9tIHRvcCB0byBib3R0b20gaXMgMjMuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgNyA0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgMiA0IDZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIDggNSA5IDNcblxuVGhhdCBpcywgMyArIDcgKyA0ICsgOSA9IDIzLlxuXG5GaW5kIHRoZSBtYXhpbXVtIHRvdGFsIGZyb20gdG9wIHRvIGJvdHRvbSBvZiB0aGUgdHJpYW5nbGUgYmVsb3c6XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDc1XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOTUgIDY0XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDE3ICA0NyAgODJcbiAgICAgICAgICAgICAgICAgICAgICAgIDE4ICAzNSAgODcgIDEwXG4gICAgICAgICAgICAgICAgICAgICAgMjAgIDA0ICA4MiAgNDcgIDY1XG4gICAgICAgICAgICAgICAgICAgIDE5ICAwMSAgMjMgIDc1ICAwMyAgMzRcbiAgICAgICAgICAgICAgICAgIDg4ICAwMiAgNzcgIDczICAwNyAgNjMgIDY3XG4gICAgICAgICAgICAgICAgOTkgIDY1ICAwNCAgMjggIDA2ICAxNiAgNzAgIDkyXG4gICAgICAgICAgICAgIDQxICA0MSAgMjYgIDU2ICA4MyAgNDAgIDgwICA3MCAgMzNcbiAgICAgICAgICAgIDQxICA0OCAgNzIgIDMzICA0NyAgMzIgIDM3ICAxNiAgOTQgIDI5XG4gICAgICAgICAgNTMgIDcxICA0NCAgNjUgIDI1ICA0MyAgOTEgIDUyICA5NyAgNTEgIDE0XG4gICAgICAgIDcwICAxMSAgMzMgIDI4ICA3NyAgNzMgIDE3ICA3OCAgMzkgIDY4ICAxNyAgNTdcbiAgICAgIDkxICA3MSAgNTIgIDM4ICAxNyAgMTQgIDkxICA0MyAgNTggIDUwICAyNyAgMjkgIDQ4XG4gICAgNjMgIDY2ICAwNCAgNjggIDg5ICA1MyAgNjcgIDMwICA3MyAgMTYgIDY5ICA4NyAgNDAgIDMxXG4gIDA0ICA2MiAgOTggIDI3ICAyMyAgMDkgIDcwICA5OCAgNzMgIDkzICAzOCAgNTMgIDYwICAwNCAgMjNcblxuTk9URTogQXMgdGhlcmUgYXJlIG9ubHkgMTYzODQgcm91dGVzLCBpdCBpcyBwb3NzaWJsZSB0byBzb2x2ZSB0aGlzIHByb2JsZW0gYnkgdHJ5aW5nIGV2ZXJ5IHJvdXRlLiBIb3dldmVyLCBQcm9ibGVtIDY3LCBpcyB0aGUgc2FtZSBjaGFsbGVuZ2Ugd2l0aCBhIHRyaWFuZ2xlIGNvbnRhaW5pbmcgb25lLWh1bmRyZWQgcm93czsgaXQgY2Fubm90IGJlIHNvbHZlZCBieSBicnV0ZSBmb3JjZSwgYW5kIHJlcXVpcmVzIGEgY2xldmVyIG1ldGhvZCEgO28pXG5cblwiXCJcIlxuXG5tYXRoID0gcmVxdWlyZSBcIm1hdGhcIlxuXG50ZXN0UHlyYW1pZCA9IFwiXCJcIlxuICAgICAgM1xuICAgICA3IDRcbiAgICAyIDQgNlxuICAgOCA1IDkgM1xuXCJcIlwiXG5cbm1haW5QeXJhbWlkID0gXCJcIlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA3NVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDk1ICA2NFxuICAgICAgICAgICAgICAgICAgICAgICAgICAxNyAgNDcgIDgyXG4gICAgICAgICAgICAgICAgICAgICAgICAxOCAgMzUgIDg3ICAxMFxuICAgICAgICAgICAgICAgICAgICAgIDIwICAwNCAgODIgIDQ3ICA2NVxuICAgICAgICAgICAgICAgICAgICAxOSAgMDEgIDIzICA3NSAgMDMgIDM0XG4gICAgICAgICAgICAgICAgICA4OCAgMDIgIDc3ICA3MyAgMDcgIDYzICA2N1xuICAgICAgICAgICAgICAgIDk5ICA2NSAgMDQgIDI4ICAwNiAgMTYgIDcwICA5MlxuICAgICAgICAgICAgICA0MSAgNDEgIDI2ICA1NiAgODMgIDQwICA4MCAgNzAgIDMzXG4gICAgICAgICAgICA0MSAgNDggIDcyICAzMyAgNDcgIDMyICAzNyAgMTYgIDk0ICAyOVxuICAgICAgICAgIDUzICA3MSAgNDQgIDY1ICAyNSAgNDMgIDkxICA1MiAgOTcgIDUxICAxNFxuICAgICAgICA3MCAgMTEgIDMzICAyOCAgNzcgIDczICAxNyAgNzggIDM5ICA2OCAgMTcgIDU3XG4gICAgICA5MSAgNzEgIDUyICAzOCAgMTcgIDE0ICA5MSAgNDMgIDU4ICA1MCAgMjcgIDI5ICA0OFxuICAgIDYzICA2NiAgMDQgIDY4ICA4OSAgNTMgIDY3ICAzMCAgNzMgIDE2ICA2OSAgODcgIDQwICAzMVxuICAwNCAgNjIgIDk4ICAyNyAgMjMgIDA5ICA3MCAgOTggIDczICA5MyAgMzggIDUzICA2MCAgMDQgIDIzXG5cblwiXCJcIlxuXG5zdHJpbmdUb1B5cmFtaWQgPSAoc3RyKSAtPlxuICBkaWdpdHMgPSAocGFyc2VJbnQoZCkgZm9yIGQgaW4gU3RyaW5nKHN0cikucmVwbGFjZSgvXFxuL2csIFwiIFwiKS5zcGxpdCgvXFxzKy8pLmZpbHRlciAocykgLT4gcmV0dXJuIChzLmxlbmd0aCA+IDApIClcbiAgZ3JpZCA9IFtdXG4gIHJvdyA9IDBcbiAgd2hpbGUgZGlnaXRzLmxlbmd0aFxuICAgIGxlbiA9IHJvdyArIDFcbiAgICBhID0gQXJyYXkobGVuKVxuICAgIGZvciBpIGluIFswLi4ubGVuXVxuICAgICAgYVtpXSA9IGRpZ2l0cy5zaGlmdCgpXG4gICAgZ3JpZFtyb3ddID0gYVxuICAgIHJvdysrXG4gIHJldHVybiBncmlkXG5cbiMgQ3J1c2hlcyB0aGUgcHlyYW1pZCBmcm9tIGJvdHRvbSB1cC4gV2hlbiBpdCBpcyBhbGwgZG9uZSBjcnVzaGluZywgdGhlIHRvcCBvZiB0aGUgcHlyYW1pZCBpcyB0aGUgYW5zd2VyLlxubWF4aW11bVBhdGhTdW0gPSAocHlyYW1pZFN0cmluZykgLT5cbiAgcHlyYW1pZCA9IHN0cmluZ1RvUHlyYW1pZChweXJhbWlkU3RyaW5nKVxuICBzdW0gPSAwXG4gIHJvdyA9IHB5cmFtaWQubGVuZ3RoIC0gMlxuICB3aGlsZSByb3cgPj0gMFxuICAgIGZvciBpIGluIFswLi5yb3ddXG4gICAgICBtYXhCZWxvdyA9IE1hdGgubWF4KHB5cmFtaWRbcm93KzFdW2ldLCBweXJhbWlkW3JvdysxXVtpKzFdKVxuICAgICAgcHlyYW1pZFtyb3ddW2ldICs9IG1heEJlbG93XG4gICAgcm93LS1cbiAgcmV0dXJuIHB5cmFtaWRbMF1bMF1cblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgZXF1YWwobWF4aW11bVBhdGhTdW0odGVzdFB5cmFtaWQpLCAyMywgXCJtYXhpbXVtIHBhdGggc3VtIG9mIHRlc3QgdHJpYW5nbGUgaXMgMjNcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICBjb25zb2xlLmxvZyB3aW5kb3cuYXJnc1xuICByZXR1cm4gbWF4aW11bVBhdGhTdW0obWFpblB5cmFtaWQpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAxOTogQ291bnRpbmcgU3VuZGF5c1xuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5Zb3UgYXJlIGdpdmVuIHRoZSBmb2xsb3dpbmcgaW5mb3JtYXRpb24sIGJ1dCB5b3UgbWF5IHByZWZlciB0byBkbyBzb21lIHJlc2VhcmNoIGZvciB5b3Vyc2VsZi5cblxuKiAxIEphbiAxOTAwIHdhcyBhIE1vbmRheS5cbiogVGhpcnR5IGRheXMgaGFzIFNlcHRlbWJlcixcbiAgQXByaWwsIEp1bmUgYW5kIE5vdmVtYmVyLlxuICBBbGwgdGhlIHJlc3QgaGF2ZSB0aGlydHktb25lLFxuICBTYXZpbmcgRmVicnVhcnkgYWxvbmUsXG4gIFdoaWNoIGhhcyB0d2VudHktZWlnaHQsIHJhaW4gb3Igc2hpbmUuXG4gIEFuZCBvbiBsZWFwIHllYXJzLCB0d2VudHktbmluZS5cbiogQSBsZWFwIHllYXIgb2NjdXJzIG9uIGFueSB5ZWFyIGV2ZW5seSBkaXZpc2libGUgYnkgNCwgYnV0IG5vdCBvbiBhIGNlbnR1cnkgdW5sZXNzIGl0IGlzIGRpdmlzaWJsZSBieSA0MDAuXG5cbkhvdyBtYW55IFN1bmRheXMgZmVsbCBvbiB0aGUgZmlyc3Qgb2YgdGhlIG1vbnRoIGR1cmluZyB0aGUgdHdlbnRpZXRoIGNlbnR1cnkgKDEgSmFuIDE5MDEgdG8gMzEgRGVjIDIwMDApP1xuXG5cIlwiXCJcblxuT05FX0RBWV9JTl9NUyA9IDYwICogNjAgKiAyNCAqIDEwMDBcblxuZGF5TmFtZXMgPSBcIlN1bmRheSBNb25kYXkgVHVlc2RheSBXZWRuZXNkYXkgVGh1cnNkYXkgRnJpZGF5IFNhdHVyZGF5XCIuc3BsaXQoL1xccysvKVxuXG5kYXlBbmREYXRlID0gKHRpbWVzdGFtcCkgLT5cbiAgZCA9IG5ldyBEYXRlKHRpbWVzdGFtcClcbiAgcmV0dXJuIFtkLmdldERheSgpLCBkLmdldERhdGUoKV1cblxuZGF0ZVRvVGltZXN0YW1wID0gKHllYXIsIG1vbnRoLCBkYXkpIC0+XG4gIHJldHVybiBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgZGF5KS5nZXRUaW1lKClcblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgdHMgPSBkYXRlVG9UaW1lc3RhbXAoMTkwMCwgMCwgMSlcbiAgZXF1YWwoZGF5QW5kRGF0ZSh0cylbMF0sIDEsIFwiMTkwMC8xLzEgd2FzIGEgTW9uZGF5XCIpXG5cbiAgZm9yIGRheSBpbiBbMi4uNl1cbiAgICB0cyArPSBPTkVfREFZX0lOX01TXG4gICAgZGQgPSBkYXlBbmREYXRlKHRzKVxuICAgIGVxdWFsKGRkWzBdLCBkYXksIFwidGhlIGZvbGxvd2luZyBkYXkgd2FzIGEgI3tkYXlOYW1lc1tkYXldfVwiKVxuICAgIGVxdWFsKGRkWzFdLCBkYXksIFwiLi4uIGFuZCB0aGUgZGF0ZSB3YXMgMS8je2RkWzFdfVwiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHRzID0gZGF0ZVRvVGltZXN0YW1wKDE5MDEsIDAsIDEpXG4gIGVuZHRzID0gZGF0ZVRvVGltZXN0YW1wKDIwMDAsIDExLCAzMSlcblxuICBzdW5kYXlDb3VudCA9IDBcbiAgd2hpbGUgdHMgPCBlbmR0c1xuICAgIGRkID0gZGF5QW5kRGF0ZSh0cylcbiAgICBpZiAoZGRbMF0gPT0gMCkgYW5kIChkZFsxXSA9PSAxKVxuICAgICAgc3VuZGF5Q291bnQrK1xuICAgIHRzICs9IE9ORV9EQVlfSU5fTVNcblxuICByZXR1cm4gc3VuZGF5Q291bnRcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDIwOiBGYWN0b3JpYWwgZGlnaXQgc3VtXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbm4hIG1lYW5zIG4geCAobiDiiJIgMSkgeCAuLi4geCAzIHggMiB4IDFcblxuRm9yIGV4YW1wbGUsIDEwISA9IDEwIHggOSB4IC4uLiB4IDMgeCAyIHggMSA9IDM2Mjg4MDAsXG5hbmQgdGhlIHN1bSBvZiB0aGUgZGlnaXRzIGluIHRoZSBudW1iZXIgMTAhIGlzIDMgKyA2ICsgMiArIDggKyA4ICsgMCArIDAgPSAyNy5cblxuRmluZCB0aGUgc3VtIG9mIHRoZSBkaWdpdHMgaW4gdGhlIG51bWJlciAxMDAhXG5cblwiXCJcIlxuXG5iaWdJbnQgPSByZXF1aXJlIFwiYmlnLWludGVnZXJcIlxuXG5odWdlRmFjdG9yaWFsID0gKG4pIC0+XG4gIG51bWJlciA9IGJpZ0ludCgxKVxuICBmb3IgaSBpbiBbMS4ubl1cbiAgICBudW1iZXIgPSBudW1iZXIubXVsdGlwbHkgaVxuICByZXR1cm4gbnVtYmVyXG5cbnN1bU9mRGlnaXRzID0gKG4pIC0+XG4gIGRpZ2l0cyA9IFN0cmluZyhuKVxuXG4gIHN1bSA9IDBcbiAgZm9yIGRpZ2l0IGluIGRpZ2l0c1xuICAgIHN1bSArPSBwYXJzZUludChkaWdpdClcblxuICByZXR1cm4gc3VtXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGVxdWFsKHN1bU9mRGlnaXRzKGh1Z2VGYWN0b3JpYWwoMTApKSwgMjcsIFwic3VtIG9mIGZhY3RvcmlhbCBkaWdpdHMgb2YgMTAhIGlzIDI3XCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgcmV0dXJuIHN1bU9mRGlnaXRzKGh1Z2VGYWN0b3JpYWwoMTAwKSlcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDIxOiBBbWljYWJsZSBudW1iZXJzXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbkxldCBkKG4pIGJlIGRlZmluZWQgYXMgdGhlIHN1bSBvZiBwcm9wZXIgZGl2aXNvcnMgb2YgbiAobnVtYmVycyBsZXNzIHRoYW4gbiB3aGljaCBkaXZpZGUgZXZlbmx5IGludG8gbikuXG5JZiBkKGEpID0gYiBhbmQgZChiKSA9IGEsIHdoZXJlIGEg4omgIGIsIHRoZW4gYSBhbmQgYiBhcmUgYW4gYW1pY2FibGUgcGFpciBhbmQgZWFjaCBvZiBhIGFuZCBiIGFyZSBjYWxsZWQgYW1pY2FibGUgbnVtYmVycy5cblxuRm9yIGV4YW1wbGUsIHRoZSBwcm9wZXIgZGl2aXNvcnMgb2YgMjIwIGFyZSAxLCAyLCA0LCA1LCAxMCwgMTEsIDIwLCAyMiwgNDQsIDU1IGFuZCAxMTA7IHRoZXJlZm9yZSBkKDIyMCkgPSAyODQuIFRoZSBwcm9wZXIgZGl2aXNvcnMgb2YgMjg0IGFyZSAxLCAyLCA0LCA3MSBhbmQgMTQyOyBzbyBkKDI4NCkgPSAyMjAuXG5cbkV2YWx1YXRlIHRoZSBzdW0gb2YgYWxsIHRoZSBhbWljYWJsZSBudW1iZXJzIHVuZGVyIDEwMDAwLlxuXG5cIlwiXCJcblxubWF0aCA9IHJlcXVpcmUgXCJtYXRoXCJcbmFtaWNhYmxlQ2FjaGUgPSBudWxsXG5cbmFtaWNhYmxlVmFsdWUgPSAobikgLT5cbiAgaWYgYW1pY2FibGVDYWNoZS5oYXNPd25Qcm9wZXJ0eShuKVxuICAgIHJldHVybiBhbWljYWJsZUNhY2hlW25dXG4gIHN1bSA9IDBcbiAgZm9yIHYgaW4gbWF0aC5kaXZpc29ycyhuKVxuICAgIHN1bSArPSB2XG4gIGFtaWNhYmxlQ2FjaGVbbl0gPSBzdW1cbiAgcmV0dXJuIHN1bVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBhbWljYWJsZUNhY2hlID0ge31cbiAgZXF1YWwoYW1pY2FibGVWYWx1ZSgyMjApLCAyODQsIFwiYW1pY2FibGUoMjIwKSA9PSAyODRcIilcbiAgZXF1YWwoYW1pY2FibGVWYWx1ZSgyODQpLCAyMjAsIFwiYW1pY2FibGUoMjg0KSA9PSAyMjBcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICBhbWljYWJsZUNhY2hlID0ge31cbiAgYW1pY2FibGVTZWVuID0ge31cbiAgZm9yIGkgaW4gWzIuLi4xMDAwMF1cbiAgICBhID0gYW1pY2FibGVWYWx1ZShpKVxuICAgIGIgPSBhbWljYWJsZVZhbHVlKGEpXG4gICAgaWYgKGEgIT0gYikgYW5kIChiID09IGkpXG4gICAgICBhbWljYWJsZVNlZW5bYV0gPSB0cnVlXG4gICAgICBhbWljYWJsZVNlZW5bYl0gPSB0cnVlXG5cbiAgYW1pY2FibGVOdW1iZXJzID0gKHBhcnNlSW50KHYpIGZvciB2IGluIE9iamVjdC5rZXlzKGFtaWNhYmxlU2VlbikpXG5cbiAgc3VtID0gMFxuICBmb3IgdiBpbiBhbWljYWJsZU51bWJlcnNcbiAgICBzdW0gKz0gdlxuXG4gIHJldHVybiBzdW1cbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDIyOiBOYW1lcyBzY29yZXNcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5Vc2luZyBuYW1lcy50eHQgKHJpZ2h0IGNsaWNrIGFuZCAnU2F2ZSBMaW5rL1RhcmdldCBBcy4uLicpLCBhIDQ2SyB0ZXh0IGZpbGUgY29udGFpbmluZyBvdmVyIGZpdmUtdGhvdXNhbmQgZmlyc3QgbmFtZXMsIGJlZ2luIGJ5IHNvcnRpbmcgaXQgaW50byBhbHBoYWJldGljYWwgb3JkZXIuIFRoZW4gd29ya2luZyBvdXQgdGhlIGFscGhhYmV0aWNhbCB2YWx1ZSBmb3IgZWFjaCBuYW1lLCBtdWx0aXBseSB0aGlzIHZhbHVlIGJ5IGl0cyBhbHBoYWJldGljYWwgcG9zaXRpb24gaW4gdGhlIGxpc3QgdG8gb2J0YWluIGEgbmFtZSBzY29yZS5cblxuRm9yIGV4YW1wbGUsIHdoZW4gdGhlIGxpc3QgaXMgc29ydGVkIGludG8gYWxwaGFiZXRpY2FsIG9yZGVyLCBDT0xJTiwgd2hpY2ggaXMgd29ydGggMyArIDE1ICsgMTIgKyA5ICsgMTQgPSA1MywgaXMgdGhlIDkzOHRoIG5hbWUgaW4gdGhlIGxpc3QuIFNvLCBDT0xJTiB3b3VsZCBvYnRhaW4gYSBzY29yZSBvZiA5Mzggw5cgNTMgPSA0OTcxNC5cblxuV2hhdCBpcyB0aGUgdG90YWwgb2YgYWxsIHRoZSBuYW1lIHNjb3JlcyBpbiB0aGUgZmlsZT9cblxuXCJcIlwiXG5cbmZzID0gcmVxdWlyZSBcImZzXCJcblxucmVhZE5hbWVzID0gLT5cbiAgcmF3TmFtZXMgPSBTdHJpbmcoZnMucmVhZEZpbGVTeW5jKF9fZGlybmFtZSArIFwiLy4uL2RhdGEvbmFtZXMudHh0XCIpKVxuICBuYW1lcyA9IHJhd05hbWVzLnJlcGxhY2UoL1wiL2dtLCBcIlwiKS5zcGxpdChcIixcIilcbiAgcmV0dXJuIG5hbWVzXG5cbmFscGhhYmV0aWNhbFZhbHVlID0gKG5hbWUpIC0+XG4gIHN1bSA9IDBcbiAgZm9yIGkgaW4gWzAuLi5uYW1lLmxlbmd0aF1cbiAgICB2ID0gbmFtZS5jaGFyQ29kZUF0KGkpIC0gNjQgIyBBIGlzIDY1IGluIGFzY2lpLCBzbyB0aGlzIG1ha2VzIHRoZSB2YWx1ZSBvZiAnQScgPT0gMVxuICAgIHN1bSArPSB2XG4gIHJldHVybiBzdW1cblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgZXF1YWwoYWxwaGFiZXRpY2FsVmFsdWUoXCJDT0xJTlwiKSwgNTMsIFwiYWxwaGFiZXRpY2FsIHZhbHVlIGZvciBDT0xJTiBpcyA1M1wiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIG5hbWVzID0gcmVhZE5hbWVzKClcbiAgbmFtZXMuc29ydCgpXG5cbiAgc3VtID0gMFxuICBmb3IgbmFtZSwgaSBpbiBuYW1lc1xuICAgIHYgPSBhbHBoYWJldGljYWxWYWx1ZShuYW1lKSAqIChpICsgMSlcbiAgICBzdW0gKz0gdlxuICByZXR1cm4gc3VtXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAyMzogTm9uLWFidW5kYW50IHN1bXNcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbkEgcGVyZmVjdCBudW1iZXIgaXMgYSBudW1iZXIgZm9yIHdoaWNoIHRoZSBzdW0gb2YgaXRzIHByb3BlciBkaXZpc29ycyBpcyBleGFjdGx5IGVxdWFsIHRvIHRoZSBudW1iZXIuIEZvciBleGFtcGxlLCB0aGUgc3VtIG9mIHRoZSBwcm9wZXIgZGl2aXNvcnMgb2YgMjggd291bGQgYmUgMSArIDIgKyA0ICsgNyArIDE0ID0gMjgsIHdoaWNoIG1lYW5zIHRoYXQgMjggaXMgYSBwZXJmZWN0IG51bWJlci5cblxuQSBudW1iZXIgbiBpcyBjYWxsZWQgZGVmaWNpZW50IGlmIHRoZSBzdW0gb2YgaXRzIHByb3BlciBkaXZpc29ycyBpcyBsZXNzIHRoYW4gbiBhbmQgaXQgaXMgY2FsbGVkIGFidW5kYW50IGlmIHRoaXMgc3VtIGV4Y2VlZHMgbi5cblxuQXMgMTIgaXMgdGhlIHNtYWxsZXN0IGFidW5kYW50IG51bWJlciwgMSArIDIgKyAzICsgNCArIDYgPSAxNiwgdGhlIHNtYWxsZXN0IG51bWJlciB0aGF0IGNhbiBiZSB3cml0dGVuIGFzIHRoZSBzdW0gb2YgdHdvIGFidW5kYW50IG51bWJlcnMgaXMgMjQuIEJ5IG1hdGhlbWF0aWNhbCBhbmFseXNpcywgaXQgY2FuIGJlIHNob3duIHRoYXQgYWxsIGludGVnZXJzIGdyZWF0ZXIgdGhhbiAyODEyMyBjYW4gYmUgd3JpdHRlbiBhcyB0aGUgc3VtIG9mIHR3byBhYnVuZGFudCBudW1iZXJzLiBIb3dldmVyLCB0aGlzIHVwcGVyIGxpbWl0IGNhbm5vdCBiZSByZWR1Y2VkIGFueSBmdXJ0aGVyIGJ5IGFuYWx5c2lzIGV2ZW4gdGhvdWdoIGl0IGlzIGtub3duIHRoYXQgdGhlIGdyZWF0ZXN0IG51bWJlciB0aGF0IGNhbm5vdCBiZSBleHByZXNzZWQgYXMgdGhlIHN1bSBvZiB0d28gYWJ1bmRhbnQgbnVtYmVycyBpcyBsZXNzIHRoYW4gdGhpcyBsaW1pdC5cblxuRmluZCB0aGUgc3VtIG9mIGFsbCB0aGUgcG9zaXRpdmUgaW50ZWdlcnMgd2hpY2ggY2Fubm90IGJlIHdyaXR0ZW4gYXMgdGhlIHN1bSBvZiB0d28gYWJ1bmRhbnQgbnVtYmVycy5cblxuXCJcIlwiXG5cbm1hdGggPSByZXF1aXJlIFwibWF0aFwiXG5cbmRpdmlzb3JTdW0gPSAobikgLT5cbiAgcmV0dXJuIG1hdGguc3VtKG1hdGguZGl2aXNvcnMobikpXG5cbmlzQWJ1bmRhbnQgPSAobikgLT5cbiAgcmV0dXJuIChkaXZpc29yU3VtKG4pID4gbilcblxuaXNQZXJmZWN0ID0gKG4pIC0+XG4gIHJldHVybiAoZGl2aXNvclN1bShuKSA9PSBuKVxuXG5hYnVuZGFudExpc3QgPSAtPlxuICBsaXN0ID0gW11cbiAgZm9yIG4gaW4gWzEuLjI4MTIzXVxuICAgIGlmIGlzQWJ1bmRhbnQobilcbiAgICAgIGxpc3QucHVzaCBuXG4gIHJldHVybiBsaXN0XG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGVxdWFsKGlzUGVyZmVjdCgyOCksIHRydWUsIFwiMjggaXMgYSBwZXJmZWN0IG51bWJlclwiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIGxpc3QgPSBhYnVuZGFudExpc3QoKVxuICBjb25zb2xlLmxvZyBsaXN0XG4gIHN1bU9mQWJ1bmRhbnRzU2VlbiA9IHt9XG4gIGZvciBpIGluIGxpc3RcbiAgICBmb3IgaiBpbiBsaXN0XG4gICAgICBzdW1PZkFidW5kYW50c1NlZW5bIGkgKyBqIF0gPSB0cnVlXG5cbiAgc3VtID0gMFxuICBmb3IgaSBpbiBbMS4uMjgxMjNdXG4gICAgaWYgbm90IHN1bU9mQWJ1bmRhbnRzU2VlbltpXVxuICAgICAgc3VtICs9IGlcblxuICByZXR1cm4gc3VtXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAyNDogTGV4aWNvZ3JhcGhpYyBwZXJtdXRhdGlvbnNcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbkEgcGVybXV0YXRpb24gaXMgYW4gb3JkZXJlZCBhcnJhbmdlbWVudCBvZiBvYmplY3RzLiBGb3IgZXhhbXBsZSwgMzEyNCBpcyBvbmUgcG9zc2libGUgcGVybXV0YXRpb24gb2YgdGhlIGRpZ2l0cyAxLCAyLCAzIGFuZCA0LiBJZiBhbGwgb2YgdGhlIHBlcm11dGF0aW9ucyBhcmUgbGlzdGVkIG51bWVyaWNhbGx5IG9yIGFscGhhYmV0aWNhbGx5LCB3ZSBjYWxsIGl0IGxleGljb2dyYXBoaWMgb3JkZXIuIFRoZSBsZXhpY29ncmFwaGljIHBlcm11dGF0aW9ucyBvZiAwLCAxIGFuZCAyIGFyZTpcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDAxMiAgIDAyMSAgIDEwMiAgIDEyMCAgIDIwMSAgIDIxMFxuXG5XaGF0IGlzIHRoZSBtaWxsaW9udGggbGV4aWNvZ3JhcGhpYyBwZXJtdXRhdGlvbiBvZiB0aGUgZGlnaXRzIDAsIDEsIDIsIDMsIDQsIDUsIDYsIDcsIDggYW5kIDk/XG5cblwiXCJcIlxuXG4jIFRoaXMgZnVuY3Rpb24gaXMgLXdheS0gdG9vIHNsb3dcbnBlcm11dGUgPSAoY3VycmVudCwgc3JjLCBkc3QpIC0+XG4gIGZvciB2LGkgaW4gc3JjXG4gICAgbmV3Y3VycmVudCA9IGN1cnJlbnQgKyB2XG4gICAgaWYgc3JjLmxlbmd0aCA+IDFcbiAgICAgIGxlZnRvdmVycyA9IHNyYy5zbGljZSgwKVxuICAgICAgbGVmdG92ZXJzLnNwbGljZShpLCAxKVxuICAgICAgcGVybXV0ZSBuZXdjdXJyZW50LCBsZWZ0b3ZlcnMsIGRzdFxuICAgIGVsc2VcbiAgICAgIGRzdC5wdXNoIG5ld2N1cnJlbnRcblxubGV4UGVybXV0ZVNsb3cgPSAoY2hhcnMpIC0+XG4gIGRzdCA9IFtdXG4gIHBlcm11dGUoXCJcIiwgY2hhcnMuc3BsaXQoXCJcIiksIGRzdClcbiAgZHN0LnNvcnQoKVxuICByZXR1cm4gZHN0XG5cbnN3YXAgPSAoYXJyLCBhLCBiKSAtPlxuICB0ID0gYXJyW2FdXG4gIGFyclthXSA9IGFycltiXVxuICBhcnJbYl0gPSB0XG5cbiMgRG9uJ3QgYXNrIG1lLCBhc2sgRGlqa3N0cmEncyBBIERpc2NpcGxpbmUgb2YgUHJvZ3JhbW1pbmcsIHBhZ2UgNzFcbmRpamtzdHJhUGVybXV0ZU5leHQgPSAoYXJyKSAtPlxuICBpID0gYXJyLmxlbmd0aCAtIDFcbiAgd2hpbGUgYXJyW2ktMV0gPj0gYXJyW2ldXG4gICAgaS0tXG5cbiAgaiA9IGFyci5sZW5ndGhcbiAgd2hpbGUgYXJyW2otMV0gPD0gYXJyW2ktMV1cbiAgICBqLS1cblxuICBzd2FwIGFyciwgaS0xLCBqLTFcblxuICBpKytcbiAgaiA9IGFyci5sZW5ndGhcbiAgd2hpbGUgaSA8IGpcbiAgICBzd2FwIGFyciwgaS0xLCBqLTFcbiAgICBpKytcbiAgICBqLS1cblxubGV4UGVybXV0ZUZhc3QgPSAoY2hhcnMsIHdoaWNoKSAtPlxuICBhcnIgPSAocGFyc2VJbnQodikgZm9yIHYgaW4gY2hhcnMpXG4gIGZvciBpIGluIFsxLi4ud2hpY2hdXG4gICAgZGlqa3N0cmFQZXJtdXRlTmV4dChhcnIpXG4gIHJldHVybiBhcnIuam9pbihcIlwiKVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChsZXhQZXJtdXRlRmFzdChcIjAxMlwiLCA0KSwgXCIxMjBcIiwgXCI0dGggcGVybXV0YXRpb24gb2YgMDEyIGlzIDEyMCwgZmFzdCB2ZXJzaW9uXCIpXG4gIGVxdWFsKGxleFBlcm11dGVTbG93KFwiMDEyXCIpLCBcIjAxMiAwMjEgMTAyIDEyMCAyMDEgMjEwXCIuc3BsaXQoXCIgXCIpLCBcInBlcm11dGF0aW9uIG9mIDAxMiBpcyAwMTIgMDIxIDEwMiAxMjAgMjAxIDIxMCwgc2xvdyB2ZXJzaW9uXCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgcmV0dXJuIGxleFBlcm11dGVGYXN0KFwiMDEyMzQ1Njc4OVwiLCAxMDAwMDAwKVxuXG4gICMgc2xvdyB2ZXJzaW9uLCB0b29rIH4xMyBzZWNvbmRzIG9uIGEgMjAxNCBNYWNib29rIFByb1xuICAjIGRzdCA9IGxleFBlcm11dGVTbG93KFwiMDEyMzQ1Njc4OVwiKVxuICAjIHJldHVybiBkc3RbOTk5OTk5XSAjIFswXSBpcyBmaXJzdCwgdGhlcmVmb3JlIFs5OTk5OTldIGlzIDEsMDAwLDAwMHRoXG4iLCJyb290ID0gZXhwb3J0cyA/IHRoaXNcblxuIyBTaWV2ZSB3YXMgYmxpbmRseSB0YWtlbi9hZGFwdGVkIGZyb20gUm9zZXR0YUNvZGUuIERPTlQgRVZFTiBDQVJFXG5jbGFzcyBJbmNyZW1lbnRhbFNpZXZlXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBuID0gMFxuXG4gIG5leHQ6IC0+XG4gICAgQG4gKz0gMlxuICAgIGlmIEBuIDwgN1xuICAgICAgaWYgQG4gPCAzXG4gICAgICAgIEBuID0gMVxuICAgICAgICByZXR1cm4gMlxuICAgICAgaWYgQG4gPCA1XG4gICAgICAgIHJldHVybiAzXG4gICAgICBAZGljdCA9IHt9XG4gICAgICBAYnBzID0gbmV3IEluY3JlbWVudGFsU2lldmUoKVxuICAgICAgQGJwcy5uZXh0KClcbiAgICAgIEBwID0gQGJwcy5uZXh0KClcbiAgICAgIEBxID0gQHAgKiBAcFxuICAgICAgcmV0dXJuIDVcbiAgICBlbHNlXG4gICAgICBzID0gQGRpY3RbQG5dXG4gICAgICBpZiBub3Qgc1xuICAgICAgICBpZiBAbiA8IEBxXG4gICAgICAgICAgcmV0dXJuIEBuXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBwMiA9IEBwIDw8IDFcbiAgICAgICAgICBAZGljdFtAbiArIHAyXSA9IHAyXG4gICAgICAgICAgQHAgPSBAYnBzLm5leHQoKVxuICAgICAgICAgIEBxID0gQHAgKiBAcFxuICAgICAgICAgIHJldHVybiBAbmV4dCgpXG4gICAgICBlbHNlXG4gICAgICAgIGRlbGV0ZSBAZGljdFtAbl1cbiAgICAgICAgbnh0ID0gQG4gKyBzXG4gICAgICAgIHdoaWxlIChAZGljdFtueHRdKVxuICAgICAgICAgIG54dCArPSBzXG4gICAgICAgIEBkaWN0W254dF0gPSBzXG4gICAgICAgIHJldHVybiBAbmV4dCgpXG5cbnJvb3QuSW5jcmVtZW50YWxTaWV2ZSA9IEluY3JlbWVudGFsU2lldmVcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBTaGFtZWxlc3NseSBwaWxmZXJlZC9hZG9wdGVkIGZyb20gaHR0cDovL3d3dy5qYXZhc2NyaXB0ZXIubmV0L2ZhcS9udW1iZXJpc3ByaW1lLmh0bVxuXG5yb290LmxlYXN0RmFjdG9yID0gKG4pIC0+XG4gIHJldHVybiBOYU4gaWYgaXNOYU4obikgb3Igbm90IGlzRmluaXRlKG4pXG4gIHJldHVybiAwIGlmIG4gPT0gMFxuICByZXR1cm4gMSBpZiAobiAlIDEpICE9IDAgb3IgKG4gKiBuKSA8IDJcbiAgcmV0dXJuIDIgaWYgKG4gJSAyKSA9PSAwXG4gIHJldHVybiAzIGlmIChuICUgMykgPT0gMFxuICByZXR1cm4gNSBpZiAobiAlIDUpID09IDBcblxuICBtID0gTWF0aC5zcXJ0IG5cbiAgZm9yIGkgaW4gWzcuLm1dIGJ5IDMwXG4gICAgcmV0dXJuIGkgICAgaWYgKG4gJSBpKSAgICAgID09IDBcbiAgICByZXR1cm4gaSs0ICBpZiAobiAlIChpKzQpKSAgPT0gMFxuICAgIHJldHVybiBpKzYgIGlmIChuICUgKGkrNikpICA9PSAwXG4gICAgcmV0dXJuIGkrMTAgaWYgKG4gJSAoaSsxMCkpID09IDBcbiAgICByZXR1cm4gaSsxMiBpZiAobiAlIChpKzEyKSkgPT0gMFxuICAgIHJldHVybiBpKzE2IGlmIChuICUgKGkrMTYpKSA9PSAwXG4gICAgcmV0dXJuIGkrMjIgaWYgKG4gJSAoaSsyMikpID09IDBcbiAgICByZXR1cm4gaSsyNCBpZiAobiAlIChpKzI0KSkgPT0gMFxuXG4gIHJldHVybiBuXG5cbnJvb3QuaXNQcmltZSA9IChuKSAtPlxuICBpZiBpc05hTihuKSBvciBub3QgaXNGaW5pdGUobikgb3IgKG4gJSAxKSAhPSAwIG9yIChuIDwgMilcbiAgICByZXR1cm4gZmFsc2VcbiAgaWYgbiA9PSByb290LmxlYXN0RmFjdG9yKG4pXG4gICAgcmV0dXJuIHRydWVcblxuICByZXR1cm4gZmFsc2VcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5yb290LnByaW1lRmFjdG9ycyA9IChuKSAtPlxuICByZXR1cm4gWzFdIGlmIG4gPT0gMVxuXG4gIGZhY3RvcnMgPSBbXVxuICB3aGlsZSBub3Qgcm9vdC5pc1ByaW1lKG4pXG4gICAgZmFjdG9yID0gcm9vdC5sZWFzdEZhY3RvcihuKVxuICAgIGZhY3RvcnMucHVzaCBmYWN0b3JcbiAgICBuIC89IGZhY3RvclxuICBmYWN0b3JzLnB1c2ggblxuICByZXR1cm4gZmFjdG9yc1xuXG4jIFRoaXMgZG9lcyBhIGJydXRlLWZvcmNlIGF0dGVtcHQgYXQgY29tYmluaW5nIGFsbCBvZiB0aGUgcHJpbWUgZmFjdG9ycyAoMl5uIGF0dGVtcHRzKS5cbiMgSSdtIHN1cmUgdGhlcmUgaXMgYSBjb29sZXIgd2F5Llxucm9vdC5kaXZpc29ycyA9IChuKSAtPlxuICBwcmltZXMgPSByb290LnByaW1lRmFjdG9ycyhuKVxuICBjb21ib3NUb1RyeSA9IE1hdGgucG93KDIsIHByaW1lcy5sZW5ndGgpXG4gIGZhY3RvcnNTZWVuID0ge31cbiAgZm9yIGF0dGVtcHQgaW4gWzAuLi5jb21ib3NUb1RyeV1cbiAgICBmYWN0b3IgPSAxXG4gICAgZm9yIHYsaSBpbiBwcmltZXNcbiAgICAgIGlmIChhdHRlbXB0ICYgKDEgPDwgaSkpXG4gICAgICAgIGZhY3RvciAqPSB2XG4gICAgaWYgZmFjdG9yIDwgblxuICAgICAgZmFjdG9yc1NlZW5bZmFjdG9yXSA9IHRydWVcblxuICBkaXZpc29yTGlzdCA9IChwYXJzZUludCh2KSBmb3IgdiBpbiBPYmplY3Qua2V5cyhmYWN0b3JzU2VlbikpXG4gIHJldHVybiBkaXZpc29yTGlzdFxuXG5yb290LnN1bSA9IChudW1iZXJBcnJheSkgLT5cbiAgc3VtID0gMFxuICBmb3IgbiBpbiBudW1iZXJBcnJheVxuICAgIHN1bSArPSBuXG4gIHJldHVybiBzdW1cblxucm9vdC5mYWN0b3JpYWwgPSAobikgLT5cbiAgZiA9IG5cbiAgd2hpbGUgbiA+IDFcbiAgICBuLS1cbiAgICBmICo9IG5cbiAgcmV0dXJuIGZcblxucm9vdC5uQ3IgPSAobiwgcikgLT5cbiAgcmV0dXJuIE1hdGguZmxvb3Iocm9vdC5mYWN0b3JpYWwobikgLyAocm9vdC5mYWN0b3JpYWwocikgKiByb290LmZhY3RvcmlhbChuIC0gcikpKVxuIiwiTEFTVF9QUk9CTEVNID0gMjRcclxuXHJcbnJvb3QgPSB3aW5kb3cgIyBleHBvcnRzID8gdGhpc1xyXG5cclxucm9vdC5lc2NhcGVkU3RyaW5naWZ5ID0gKG8pIC0+XHJcbiAgc3RyID0gSlNPTi5zdHJpbmdpZnkobylcclxuICBzdHIgPSBzdHIucmVwbGFjZShcIl1cIiwgXCJcXFxcXVwiKVxyXG4gIHJldHVybiBzdHJcclxuXHJcbnJvb3QucnVuQWxsID0gLT5cclxuICBsYXN0UHV6emxlID0gTEFTVF9QUk9CTEVNXHJcbiAgbmV4dEluZGV4ID0gMFxyXG5cclxuICBsb2FkTmV4dFNjcmlwdCA9IC0+XHJcbiAgICBpZiBuZXh0SW5kZXggPCBsYXN0UHV6emxlXHJcbiAgICAgIG5leHRJbmRleCsrXHJcbiAgICAgIHJ1blRlc3QobmV4dEluZGV4LCBsb2FkTmV4dFNjcmlwdClcclxuICBsb2FkTmV4dFNjcmlwdCgpXHJcblxyXG5yb290Lml0ZXJhdGVQcm9ibGVtcyA9IChhcmdzKSAtPlxyXG5cclxuICBpbmRleFRvUHJvY2VzcyA9IG51bGxcclxuICBpZiBhcmdzLmVuZEluZGV4ID4gMFxyXG4gICAgaWYgYXJncy5zdGFydEluZGV4IDw9IGFyZ3MuZW5kSW5kZXhcclxuICAgICAgaW5kZXhUb1Byb2Nlc3MgPSBhcmdzLnN0YXJ0SW5kZXhcclxuICAgICAgYXJncy5zdGFydEluZGV4KytcclxuICBlbHNlXHJcbiAgICBpZiBhcmdzLmxpc3QubGVuZ3RoID4gMFxyXG4gICAgICBpbmRleFRvUHJvY2VzcyA9IGFyZ3MubGlzdC5zaGlmdCgpXHJcblxyXG4gIGlmIGluZGV4VG9Qcm9jZXNzICE9IG51bGxcclxuICAgIGl0ZXJhdGVOZXh0ID0gLT5cclxuICAgICAgd2luZG93LmFyZ3MgPSBhcmdzXHJcbiAgICAgIHJ1blRlc3QgaW5kZXhUb1Byb2Nlc3MsIC0+XHJcbiAgICAgICAgaXRlcmF0ZVByb2JsZW1zKGFyZ3MpXHJcbiAgICBpdGVyYXRlTmV4dCgpXHJcblxyXG5yb290LnJ1blRlc3QgPSAoaW5kZXgsIGNiKSAtPlxyXG4gIG1vZHVsZU5hbWUgPSBcImUjeygnMDAwJytpbmRleCkuc2xpY2UoLTMpfVwiXHJcbiAgd2luZG93LmluZGV4ID0gaW5kZXhcclxuICBwcm9ibGVtID0gcmVxdWlyZShtb2R1bGVOYW1lKVxyXG4gIHByb2JsZW0ucHJvY2VzcygpXHJcbiAgd2luZG93LnNldFRpbWVvdXQoY2IsIDApIGlmIGNiXHJcblxyXG5jbGFzcyBQcm9ibGVtXHJcbiAgY29uc3RydWN0b3I6IChAZGVzY3JpcHRpb24pIC0+XHJcbiAgICBAaW5kZXggPSB3aW5kb3cuaW5kZXhcclxuICAgIGxpbmVzID0gQGRlc2NyaXB0aW9uLnNwbGl0KC9cXG4vKVxyXG4gICAgbGluZXMuc2hpZnQoKSB3aGlsZSBsaW5lcy5sZW5ndGggPiAwIGFuZCBsaW5lc1swXS5sZW5ndGggPT0gMFxyXG4gICAgQHRpdGxlID0gbGluZXMuc2hpZnQoKVxyXG4gICAgQGxpbmUgPSBsaW5lcy5zaGlmdCgpXHJcbiAgICBAZGVzY3JpcHRpb24gPSBsaW5lcy5qb2luKFwiXFxuXCIpXHJcblxyXG4gIG5vdzogLT5cclxuICAgIHJldHVybiBpZiB3aW5kb3cucGVyZm9ybWFuY2UgdGhlbiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCkgZWxzZSBuZXcgRGF0ZSgpLmdldFRpbWUoKVxyXG5cclxuICBwcm9jZXNzOiAtPlxyXG4gICAgaWYgd2luZG93LmFyZ3MuZGVzY3JpcHRpb25cclxuICAgICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjNDQ0NDQ0O11fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX11cXG5cIlxyXG5cclxuICAgIGZvcm1hdHRlZFRpdGxlID0gJC50ZXJtaW5hbC5mb3JtYXQoXCJbWzsjZmZhYTAwO10je0B0aXRsZX1dXCIpXHJcbiAgICB1cmwgPSBcIj9jPSN7d2luZG93LmFyZ3MuY21kfV8je0BpbmRleH1cIlxyXG4gICAgaWYgd2luZG93LmFyZ3MudmVyYm9zZVxyXG4gICAgICB1cmwgKz0gXCJfdlwiXHJcbiAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIjxhIGhyZWY9XFxcIiN7dXJsfVxcXCI+I3tmb3JtYXR0ZWRUaXRsZX08L2E+XCIsIHsgcmF3OiB0cnVlIH1cclxuXHJcbiAgICBpZiB3aW5kb3cuYXJncy5kZXNjcmlwdGlvblxyXG4gICAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIltbOyM0NDQ0NDQ7XSN7QGxpbmV9XVwiXHJcbiAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2NjY2NlZTtdI3tAZGVzY3JpcHRpb259XVxcblwiXHJcbiAgICAgIHNvdXJjZUxpbmUgPSAkLnRlcm1pbmFsLmZvcm1hdChcIltbOyM0NDQ0NDQ7XVNvdXJjZTpdIFwiKVxyXG4gICAgICBzb3VyY2VMaW5lICs9IFwiIDxhIGhyZWY9XFxcInNyYy9lI3soJzAwMCcrQGluZGV4KS5zbGljZSgtMyl9LmNvZmZlZVxcXCI+XCIgKyAkLnRlcm1pbmFsLmZvcm1hdChcIltbOyM3NzMzMDA7XUxvY2FsXVwiKSArIFwiPC9hPiBcIlxyXG4gICAgICBzb3VyY2VMaW5lICs9ICQudGVybWluYWwuZm9ybWF0KFwiW1s7IzQ0NDQ0NDtdL11cIilcclxuICAgICAgc291cmNlTGluZSArPSBcIiA8YSBocmVmPVxcXCJodHRwczovL2dpdGh1Yi5jb20vam9lZHJhZ28vZXVsZXIvYmxvYi9tYXN0ZXIvc3JjL2UjeygnMDAwJytAaW5kZXgpLnNsaWNlKC0zKX0uY29mZmVlXFxcIj5cIiArICQudGVybWluYWwuZm9ybWF0KFwiW1s7Izc3MzMwMDtdR2l0aHViXVwiKSArIFwiPC9hPlwiXHJcbiAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIHNvdXJjZUxpbmUsIHsgcmF3OiB0cnVlIH1cclxuICAgICAgaWYgd2luZG93LmFyZ3MudGVzdCBvciB3aW5kb3cuYXJncy5hbnN3ZXJcclxuICAgICAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIlwiXHJcblxyXG4gICAgdGVzdEZ1bmMgPSBAdGVzdFxyXG4gICAgYW5zd2VyRnVuYyA9IEBhbnN3ZXJcclxuXHJcbiAgICBpZiB3aW5kb3cuYXJncy50ZXN0XHJcbiAgICAgIGlmIHRlc3RGdW5jID09IHVuZGVmaW5lZFxyXG4gICAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7IzQ0NDQ0NDtdIChubyB0ZXN0cyldXCJcclxuICAgICAgZWxzZVxyXG4gICAgICAgIHRlc3RGdW5jKClcclxuXHJcbiAgICBpZiB3aW5kb3cuYXJncy5hbnN3ZXJcclxuICAgICAgc3RhcnQgPSBAbm93KClcclxuICAgICAgYW5zd2VyID0gYW5zd2VyRnVuYygpXHJcbiAgICAgIGVuZCA9IEBub3coKVxyXG4gICAgICBtcyA9IGVuZCAtIHN0YXJ0XHJcbiAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2ZmZmZmZjtdIC0+IF1bWzsjYWFmZmFhO11BbnN3ZXI6XSAoW1s7I2FhZmZmZjtdI3ttcy50b0ZpeGVkKDEpfW1zXSk6IFtbOyNmZmZmZmY7XSN7ZXNjYXBlZFN0cmluZ2lmeShhbnN3ZXIpfV1cIlxyXG5cclxucm9vdC5Qcm9ibGVtID0gUHJvYmxlbVxyXG5cclxucm9vdC5vayA9ICh2LCBtc2cpIC0+XHJcbiAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjZmZmZmZmO10gKiAgXSN7dn06ICN7bXNnfVwiXHJcblxyXG5yb290LmVxdWFsID0gKGEsIGIsIG1zZykgLT5cclxuICBpZiAkLmlzQXJyYXkoYSkgYW5kICQuaXNBcnJheShiKVxyXG4gICAgaXNFcXVhbCA9IChhLmxlbmd0aCA9PSBiLmxlbmd0aClcclxuICAgIGlmIGlzRXF1YWxcclxuICAgICAgZm9yIGkgaW4gWzAuLi5hLmxlbmd0aF1cclxuICAgICAgICBpZiBhW2ldICE9IGJbaV1cclxuICAgICAgICAgIGlzRXF1YWwgPSBmYWxzZVxyXG4gICAgICAgICAgYnJlYWtcclxuICBlbHNlXHJcbiAgICBpc0VxdWFsID0gKGEgPT0gYilcclxuXHJcbiAgaWYgaXNFcXVhbFxyXG4gICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjZmZmZmZmO10gKiAgXVtbOyM1NTU1NTU7XVBBU1M6ICN7bXNnfV1cIlxyXG4gIGVsc2VcclxuICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2ZmZmZmZjtdICogIF1bWzsjZmZhYWFhO11GQUlMOiAje21zZ30gKCN7YX0gIT0gI3tifSldXCJcclxuXHJcbnJvb3Qub25Db21tYW5kID0gKGNvbW1hbmQpID0+XHJcbiAgcmV0dXJuIGlmIGNvbW1hbmQubGVuZ3RoID09IDBcclxuICBjbWQgPSAkLnRlcm1pbmFsLnBhcnNlQ29tbWFuZChjb21tYW5kKVxyXG4gIHJldHVybiBpZiBjbWQubmFtZS5sZW5ndGggPT0gMFxyXG5cclxuICBhcmdzID1cclxuICAgIHN0YXJ0SW5kZXg6IDBcclxuICAgIGVuZEluZGV4OiAwXHJcbiAgICBsaXN0OiBbXVxyXG4gICAgdmVyYm9zZTogZmFsc2VcclxuICAgIGRlc2NyaXB0aW9uOiBmYWxzZVxyXG4gICAgdGVzdDogZmFsc2VcclxuICAgIGFuc3dlcjogZmFsc2VcclxuXHJcbiAgcHJvY2VzcyA9IHRydWVcclxuXHJcbiAgZm9yIGFyZyBpbiBjbWQuYXJnc1xyXG4gICAgYXJnID0gU3RyaW5nKGFyZylcclxuICAgIGNvbnRpbnVlIGlmIGFyZy5sZW5ndGggPCAxXHJcbiAgICBpZiBhcmdbMF0gPT0gJ3YnXHJcbiAgICAgIGFyZ3MudmVyYm9zZSA9IHRydWVcclxuICAgIGVsc2UgaWYgYXJnLm1hdGNoKC9eXFxkKyQvKVxyXG4gICAgICB2ID0gcGFyc2VJbnQoYXJnKVxyXG4gICAgICBpZiAodiA+PSAxKSBhbmQgKHYgPD0gTEFTVF9QUk9CTEVNKVxyXG4gICAgICAgIGFyZ3MubGlzdC5wdXNoKHYpXHJcbiAgICAgIGVsc2VcclxuICAgICAgICBwcm9jZXNzID0gZmFsc2VcclxuICAgICAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIltbOyNmZmFhYWE7XU5vIHN1Y2ggdGVzdDogI3t2fSAodmFsaWQgdGVzdHMgMS0je0xBU1RfUFJPQkxFTX0pXVwiXHJcblxyXG4gIGlmIGFyZ3MubGlzdC5sZW5ndGggPT0gMFxyXG4gICAgYXJncy5zdGFydEluZGV4ID0gMVxyXG4gICAgYXJncy5lbmRJbmRleCA9IExBU1RfUFJPQkxFTVxyXG5cclxuICAjIFNpbmNlIGFsbCBvZiBvdXIgY29tbWFuZHMgaGFwcGVuIHRvIGhhdmUgdW5pcXVlIGZpcnN0IGxldHRlcnMsIGxldCBwZW9wbGUgYmUgc3VwZXIgbGF6eS9zaWxseVxyXG4gIGlmIGNtZC5uYW1lWzBdID09ICdsJ1xyXG4gICAgYXJncy5jbWQgPSBcImxpc3RcIlxyXG4gIGVsc2UgaWYgY21kLm5hbWVbMF0gPT0gJ2QnXHJcbiAgICBhcmdzLmNtZCA9IFwiZGVzY3JpYmVcIlxyXG4gICAgYXJncy5kZXNjcmlwdGlvbiA9IHRydWVcclxuICBlbHNlIGlmIGNtZC5uYW1lWzBdID09ICd0J1xyXG4gICAgYXJncy5jbWQgPSBcInRlc3RcIlxyXG4gICAgYXJncy50ZXN0ID0gdHJ1ZVxyXG4gIGVsc2UgaWYgY21kLm5hbWVbMF0gPT0gJ2EnXHJcbiAgICBhcmdzLmNtZCA9IFwiYW5zd2VyXCJcclxuICAgIGFyZ3MuYW5zd2VyID0gdHJ1ZVxyXG4gIGVsc2UgaWYgY21kLm5hbWVbMF0gPT0gJ3InXHJcbiAgICBhcmdzLmNtZCA9IFwicnVuXCJcclxuICAgIGFyZ3MudGVzdCA9IHRydWVcclxuICAgIGFyZ3MuYW5zd2VyID0gdHJ1ZVxyXG4gIGVsc2UgaWYgY21kLm5hbWVbMF0gPT0gJ2QnXHJcbiAgICBhcmdzLmNtZCA9IFwiZGVzY3JpYmVcIlxyXG4gICAgYXJncy5kZXNjcmlwdGlvbiA9IHRydWVcclxuICBlbHNlIGlmIGNtZC5uYW1lWzBdID09ICdoJ1xyXG4gICAgYXJncy5jbWQgPSBcImhlbHBcIlxyXG4gICAgcHJvY2VzcyA9IGZhbHNlXHJcbiAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIlwiXCJcclxuICAgIENvbW1hbmRzOlxyXG5cclxuICAgICAgICBsaXN0IFtYXSAgICAgLSBMaXN0IHByb2JsZW0gdGl0bGVzXHJcbiAgICAgICAgZGVzY3JpYmUgW1hdIC0gRGlzcGxheSBmdWxsIHByb2JsZW0gZGVzY3JpcHRpb25zXHJcbiAgICAgICAgdGVzdCBbWF0gICAgIC0gUnVuIHVuaXQgdGVzdHNcclxuICAgICAgICBhbnN3ZXIgW1hdICAgLSBUaW1lIGFuZCBjYWxjdWxhdGUgYW5zd2VyXHJcbiAgICAgICAgcnVuIFtYXSAgICAgIC0gdGVzdCBhbmQgYW5zd2VyIGNvbWJpbmVkXHJcbiAgICAgICAgaGVscCAgICAgICAgIC0gVGhpcyBoZWxwXHJcblxyXG4gICAgICAgIEluIGFsbCBvZiB0aGVzZSwgW1hdIGNhbiBiZSBhIGxpc3Qgb2Ygb25lIG9yIG1vcmUgcHJvYmxlbSBudW1iZXJzLiAoYSB2YWx1ZSBmcm9tIDEgdG8gI3tMQVNUX1BST0JMRU19KS4gSWYgYWJzZW50LCBpdCBpbXBsaWVzIGFsbCBwcm9ibGVtcy5cclxuICAgICAgICBBbHNvLCBhZGRpbmcgdGhlIHdvcmQgXCJ2ZXJib3NlXCIgdG8gc29tZSBvZiB0aGVzZSBjb21tYW5kcyB3aWxsIGVtaXQgdGhlIGRlc2NyaXB0aW9uIGJlZm9yZSBwZXJmb3JtaW5nIHRoZSB0YXNrLlxyXG5cclxuICAgIFwiXCJcIlxyXG4gIGVsc2VcclxuICAgIHByb2Nlc3MgPSBmYWxzZVxyXG4gICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjZmZhYWFhO11Vbmtub3duIGNvbW1hbmQuXVwiXHJcblxyXG4gIGlmIGFyZ3MudmVyYm9zZVxyXG4gICAgYXJncy5kZXNjcmlwdGlvbiA9IHRydWVcclxuXHJcbiAgaWYgcHJvY2Vzc1xyXG4gICAgaXRlcmF0ZVByb2JsZW1zKGFyZ3MpXHJcbiJdfQ==
