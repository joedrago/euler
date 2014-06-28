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
  var N, i, j, _results;
  N = arr.length;
  i = N - 1;
  while (arr[i - 1] >= arr[i]) {
    i = i - 1;
  }
  j = N;
  while (arr[j - 1] <= arr[i - 1]) {
    j = j - 1;
  }
  swap(arr, i - 1, j - 1);
  i++;
  j = N;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2JpZy1pbnRlZ2VyL0JpZ0ludGVnZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCIuLi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwiLi4vc3JjL2UwMDEuY29mZmVlIiwiLi4vc3JjL2UwMDIuY29mZmVlIiwiLi4vc3JjL2UwMDMuY29mZmVlIiwiLi4vc3JjL2UwMDQuY29mZmVlIiwiLi4vc3JjL2UwMDUuY29mZmVlIiwiLi4vc3JjL2UwMDYuY29mZmVlIiwiLi4vc3JjL2UwMDcuY29mZmVlIiwiLi4vc3JjL2UwMDguY29mZmVlIiwiLi4vc3JjL2UwMDkuY29mZmVlIiwiLi4vc3JjL2UwMTAuY29mZmVlIiwiLi4vc3JjL2UwMTEuY29mZmVlIiwiLi4vc3JjL2UwMTIuY29mZmVlIiwiLi4vc3JjL2UwMTMuY29mZmVlIiwiLi4vc3JjL2UwMTQuY29mZmVlIiwiLi4vc3JjL2UwMTUuY29mZmVlIiwiLi4vc3JjL2UwMTYuY29mZmVlIiwiLi4vc3JjL2UwMTcuY29mZmVlIiwiLi4vc3JjL2UwMTguY29mZmVlIiwiLi4vc3JjL2UwMTkuY29mZmVlIiwiLi4vc3JjL2UwMjAuY29mZmVlIiwiLi4vc3JjL2UwMjEuY29mZmVlIiwiLi4vc3JjL2UwMjIuY29mZmVlIiwiLi4vc3JjL2UwMjMuY29mZmVlIiwiLi4vc3JjL2UwMjQuY29mZmVlIiwiLi4vc3JjL21hdGguY29mZmVlIiwiLi4vc3JjL3Rlcm1pbmFsLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDallBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzduQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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Q0FGQSxDQURHO0tBQUEsTUFBQTtBQWtCSCxNQUFBLE9BQUEsR0FBVSxLQUFWLENBQUE7QUFBQSxNQUNBLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBaEIsQ0FBcUIsK0JBQXJCLENBREEsQ0FsQkc7S0FuREw7QUF3RUEsSUFBQSxJQUFHLElBQUksQ0FBQyxPQUFSO0FBQ0UsTUFBQSxJQUFJLENBQUMsV0FBTCxHQUFtQixJQUFuQixDQURGO0tBeEVBO0FBMkVBLElBQUEsSUFBRyxPQUFIO2FBQ0UsZUFBQSxDQUFnQixJQUFoQixFQURGO0tBNUVlO0VBQUEsRUFBQTtBQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FsSGpCLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBiaWdJbnQgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGJhc2UgPSAxMDAwMDAwMCwgbG9nQmFzZSA9IDc7XHJcbiAgICB2YXIgc2lnbiA9IHtcclxuICAgICAgICBwb3NpdGl2ZTogZmFsc2UsXHJcbiAgICAgICAgbmVnYXRpdmU6IHRydWVcclxuICAgIH07XHJcblxyXG4gICAgdmFyIG5vcm1hbGl6ZSA9IGZ1bmN0aW9uIChmaXJzdCwgc2Vjb25kKSB7XHJcbiAgICAgICAgdmFyIGEgPSBmaXJzdC52YWx1ZSwgYiA9IHNlY29uZC52YWx1ZTtcclxuICAgICAgICB2YXIgbGVuZ3RoID0gYS5sZW5ndGggPiBiLmxlbmd0aCA/IGEubGVuZ3RoIDogYi5sZW5ndGg7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBhW2ldID0gYVtpXSB8fCAwO1xyXG4gICAgICAgICAgICBiW2ldID0gYltpXSB8fCAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKHZhciBpID0gbGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgaWYgKGFbaV0gPT09IDAgJiYgYltpXSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgYS5wb3AoKTtcclxuICAgICAgICAgICAgICAgIGIucG9wKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFhLmxlbmd0aCkgYSA9IFswXSwgYiA9IFswXTtcclxuICAgICAgICBmaXJzdC52YWx1ZSA9IGE7XHJcbiAgICAgICAgc2Vjb25kLnZhbHVlID0gYjtcclxuICAgIH07XHJcblxyXG4gICAgdmFyIHBhcnNlID0gZnVuY3Rpb24gKHRleHQsIGZpcnN0KSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB0ZXh0ID09PSBcIm9iamVjdFwiKSByZXR1cm4gdGV4dDtcclxuICAgICAgICB0ZXh0ICs9IFwiXCI7XHJcbiAgICAgICAgdmFyIHMgPSBzaWduLnBvc2l0aXZlLCB2YWx1ZSA9IFtdO1xyXG4gICAgICAgIGlmICh0ZXh0WzBdID09PSBcIi1cIikge1xyXG4gICAgICAgICAgICBzID0gc2lnbi5uZWdhdGl2ZTtcclxuICAgICAgICAgICAgdGV4dCA9IHRleHQuc2xpY2UoMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB0ZXh0ID0gdGV4dC5zcGxpdChcImVcIik7XHJcbiAgICAgICAgaWYgKHRleHQubGVuZ3RoID4gMikgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBpbnRlZ2VyXCIpO1xyXG4gICAgICAgIGlmICh0ZXh0WzFdKSB7XHJcbiAgICAgICAgICAgIHZhciBleHAgPSB0ZXh0WzFdO1xyXG4gICAgICAgICAgICBpZiAoZXhwWzBdID09PSBcIitcIikgZXhwID0gZXhwLnNsaWNlKDEpO1xyXG4gICAgICAgICAgICBleHAgPSBwYXJzZShleHApO1xyXG4gICAgICAgICAgICBpZiAoZXhwLmxlc3NlcigwKSkgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGluY2x1ZGUgbmVnYXRpdmUgZXhwb25lbnQgcGFydCBmb3IgaW50ZWdlcnNcIik7XHJcbiAgICAgICAgICAgIHdoaWxlIChleHAubm90RXF1YWxzKDApKSB7XHJcbiAgICAgICAgICAgICAgICB0ZXh0WzBdICs9IFwiMFwiO1xyXG4gICAgICAgICAgICAgICAgZXhwID0gZXhwLnByZXYoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0ZXh0ID0gdGV4dFswXTtcclxuICAgICAgICBpZiAodGV4dCA9PT0gXCItMFwiKSB0ZXh0ID0gXCIwXCI7XHJcbiAgICAgICAgdmFyIGlzVmFsaWQgPSAvXihbMC05XVswLTldKikkLy50ZXN0KHRleHQpO1xyXG4gICAgICAgIGlmICghaXNWYWxpZCkgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBpbnRlZ2VyXCIpO1xyXG4gICAgICAgIHdoaWxlICh0ZXh0Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgZGl2aWRlciA9IHRleHQubGVuZ3RoID4gbG9nQmFzZSA/IHRleHQubGVuZ3RoIC0gbG9nQmFzZSA6IDA7XHJcbiAgICAgICAgICAgIHZhbHVlLnB1c2goK3RleHQuc2xpY2UoZGl2aWRlcikpO1xyXG4gICAgICAgICAgICB0ZXh0ID0gdGV4dC5zbGljZSgwLCBkaXZpZGVyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHZhbCA9IGJpZ0ludCh2YWx1ZSwgcyk7XHJcbiAgICAgICAgaWYgKGZpcnN0KSBub3JtYWxpemUoZmlyc3QsIHZhbCk7XHJcbiAgICAgICAgcmV0dXJuIHZhbDtcclxuICAgIH07XHJcblxyXG4gICAgdmFyIGdvZXNJbnRvID0gZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgICAgICB2YXIgYSA9IGJpZ0ludChhLCBzaWduLnBvc2l0aXZlKSwgYiA9IGJpZ0ludChiLCBzaWduLnBvc2l0aXZlKTtcclxuICAgICAgICBpZiAoYS5lcXVhbHMoMCkpIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBkaXZpZGUgYnkgMFwiKTtcclxuICAgICAgICB2YXIgbiA9IDA7XHJcbiAgICAgICAgZG8ge1xyXG4gICAgICAgICAgICB2YXIgaW5jID0gMTtcclxuICAgICAgICAgICAgdmFyIGMgPSBiaWdJbnQoYS52YWx1ZSwgc2lnbi5wb3NpdGl2ZSksIHQgPSBjLnRpbWVzKDEwKTtcclxuICAgICAgICAgICAgd2hpbGUgKHQubGVzc2VyKGIpKSB7XHJcbiAgICAgICAgICAgICAgICBjID0gdDtcclxuICAgICAgICAgICAgICAgIGluYyAqPSAxMDtcclxuICAgICAgICAgICAgICAgIHQgPSB0LnRpbWVzKDEwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB3aGlsZSAoYy5sZXNzZXJPckVxdWFscyhiKSkge1xyXG4gICAgICAgICAgICAgICAgYiA9IGIubWludXMoYyk7XHJcbiAgICAgICAgICAgICAgICBuICs9IGluYztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gd2hpbGUgKGEubGVzc2VyT3JFcXVhbHMoYikpO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZW1haW5kZXI6IGIudmFsdWUsXHJcbiAgICAgICAgICAgIHJlc3VsdDogblxyXG4gICAgICAgIH07XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBiaWdJbnQgPSBmdW5jdGlvbiAodmFsdWUsIHMpIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHtcclxuICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxyXG4gICAgICAgICAgICBzaWduOiBzXHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgbyA9IHtcclxuICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxyXG4gICAgICAgICAgICBzaWduOiBzLFxyXG4gICAgICAgICAgICBuZWdhdGU6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBtIHx8IHNlbGY7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYmlnSW50KGZpcnN0LnZhbHVlLCAhZmlyc3Quc2lnbik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGFiczogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IG0gfHwgc2VsZjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBiaWdJbnQoZmlyc3QudmFsdWUsIHNpZ24ucG9zaXRpdmUpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBhZGQ6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcywgZmlyc3QgPSBzZWxmLCBzZWNvbmQ7XHJcbiAgICAgICAgICAgICAgICBpZiAobSkgKGZpcnN0ID0gcGFyc2UobikpICYmIChzZWNvbmQgPSBwYXJzZShtKSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHNlY29uZCA9IHBhcnNlKG4sIGZpcnN0KTtcclxuICAgICAgICAgICAgICAgIHMgPSBmaXJzdC5zaWduO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0LnNpZ24gIT09IHNlY29uZC5zaWduKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlyc3QgPSBiaWdJbnQoZmlyc3QudmFsdWUsIHNpZ24ucG9zaXRpdmUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlY29uZCA9IGJpZ0ludChzZWNvbmQudmFsdWUsIHNpZ24ucG9zaXRpdmUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzID09PSBzaWduLnBvc2l0aXZlID9cclxuXHRcdFx0XHRcdFx0by5zdWJ0cmFjdChmaXJzdCwgc2Vjb25kKSA6XHJcblx0XHRcdFx0XHRcdG8uc3VidHJhY3Qoc2Vjb25kLCBmaXJzdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBub3JtYWxpemUoZmlyc3QsIHNlY29uZCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgYSA9IGZpcnN0LnZhbHVlLCBiID0gc2Vjb25kLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG5cdFx0XHRcdFx0Y2FycnkgPSAwO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aCB8fCBjYXJyeSA+IDA7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzdW0gPSAoYVtpXSB8fCAwKSArIChiW2ldIHx8IDApICsgY2Fycnk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FycnkgPSBzdW0gPj0gYmFzZSA/IDEgOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHN1bSAtPSBjYXJyeSAqIGJhc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goc3VtKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBiaWdJbnQocmVzdWx0LCBzKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcGx1czogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmFkZChuLCBtKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3VidHJhY3Q6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBzZWxmLCBzZWNvbmQ7XHJcbiAgICAgICAgICAgICAgICBpZiAobSkgKGZpcnN0ID0gcGFyc2UobikpICYmIChzZWNvbmQgPSBwYXJzZShtKSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHNlY29uZCA9IHBhcnNlKG4sIGZpcnN0KTtcclxuICAgICAgICAgICAgICAgIGlmIChmaXJzdC5zaWduICE9PSBzZWNvbmQuc2lnbikgcmV0dXJuIG8uYWRkKGZpcnN0LCBvLm5lZ2F0ZShzZWNvbmQpKTtcclxuICAgICAgICAgICAgICAgIGlmIChmaXJzdC5zaWduID09PSBzaWduLm5lZ2F0aXZlKSByZXR1cm4gby5zdWJ0cmFjdChvLm5lZ2F0ZShzZWNvbmQpLCBvLm5lZ2F0ZShmaXJzdCkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG8uY29tcGFyZShmaXJzdCwgc2Vjb25kKSA9PT0gLTEpIHJldHVybiBvLm5lZ2F0ZShvLnN1YnRyYWN0KHNlY29uZCwgZmlyc3QpKTtcclxuICAgICAgICAgICAgICAgIHZhciBhID0gZmlyc3QudmFsdWUsIGIgPSBzZWNvbmQudmFsdWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcblx0XHRcdFx0XHRib3Jyb3cgPSAwO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRtcCA9IGFbaV0gLSBib3Jyb3c7XHJcbiAgICAgICAgICAgICAgICAgICAgYm9ycm93ID0gdG1wIDwgYltpXSA/IDEgOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBtaW51ZW5kID0gKGJvcnJvdyAqIGJhc2UpICsgdG1wIC0gYltpXTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChtaW51ZW5kKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBiaWdJbnQocmVzdWx0LCBzaWduLnBvc2l0aXZlKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbWludXM6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5zdWJ0cmFjdChuLCBtKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbXVsdGlwbHk6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcywgZmlyc3QgPSBzZWxmLCBzZWNvbmQ7XHJcbiAgICAgICAgICAgICAgICBpZiAobSkgKGZpcnN0ID0gcGFyc2UobikpICYmIChzZWNvbmQgPSBwYXJzZShtKSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHNlY29uZCA9IHBhcnNlKG4sIGZpcnN0KTtcclxuICAgICAgICAgICAgICAgIHMgPSBmaXJzdC5zaWduICE9PSBzZWNvbmQuc2lnbjtcclxuICAgICAgICAgICAgICAgIHZhciBhID0gZmlyc3QudmFsdWUsIGIgPSBzZWNvbmQudmFsdWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0U3VtID0gW107XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRTdW1baV0gPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaiA9IGk7XHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGotLSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRTdW1baV0ucHVzaCgwKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgY2FycnkgPSAwO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHggPSBhW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYi5sZW5ndGggfHwgY2FycnkgPiAwOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHkgPSBiW2pdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJvZHVjdCA9IHkgPyAoeCAqIHkpICsgY2FycnkgOiBjYXJyeTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FycnkgPSBwcm9kdWN0ID4gYmFzZSA/IE1hdGguZmxvb3IocHJvZHVjdCAvIGJhc2UpIDogMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdCAtPSBjYXJyeSAqIGJhc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFN1bVtpXS5wdXNoKHByb2R1Y3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBtYXggPSAtMTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzdWx0U3VtLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxlbiA9IHJlc3VsdFN1bVtpXS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxlbiA+IG1heCkgbWF4ID0gbGVuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdLCBjYXJyeSA9IDA7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1heCB8fCBjYXJyeSA+IDA7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzdW0gPSBjYXJyeTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHJlc3VsdFN1bS5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdW0gKz0gcmVzdWx0U3VtW2pdW2ldIHx8IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhcnJ5ID0gc3VtID4gYmFzZSA/IE1hdGguZmxvb3Ioc3VtIC8gYmFzZSkgOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHN1bSAtPSBjYXJyeSAqIGJhc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goc3VtKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBiaWdJbnQocmVzdWx0LCBzKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdGltZXM6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5tdWx0aXBseShuLCBtKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZGl2bW9kOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHMsIGZpcnN0ID0gc2VsZiwgc2Vjb25kO1xyXG4gICAgICAgICAgICAgICAgaWYgKG0pIChmaXJzdCA9IHBhcnNlKG4pKSAmJiAoc2Vjb25kID0gcGFyc2UobSkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBzZWNvbmQgPSBwYXJzZShuLCBmaXJzdCk7XHJcbiAgICAgICAgICAgICAgICBzID0gZmlyc3Quc2lnbiAhPT0gc2Vjb25kLnNpZ247XHJcbiAgICAgICAgICAgICAgICBpZiAoYmlnSW50KGZpcnN0LnZhbHVlLCBmaXJzdC5zaWduKS5lcXVhbHMoMCkpIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcXVvdGllbnQ6IGJpZ0ludChbMF0sIHNpZ24ucG9zaXRpdmUpLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlbWFpbmRlcjogYmlnSW50KFswXSwgc2lnbi5wb3NpdGl2ZSlcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBpZiAoc2Vjb25kLmVxdWFscygwKSkgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGRpdmlkZSBieSB6ZXJvXCIpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSBmaXJzdC52YWx1ZSwgYiA9IHNlY29uZC52YWx1ZTtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXSwgcmVtYWluZGVyID0gW107XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuID0gW2FbaV1dLmNvbmNhdChyZW1haW5kZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBxdW90aWVudCA9IGdvZXNJbnRvKGIsIG4pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHF1b3RpZW50LnJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVtYWluZGVyID0gcXVvdGllbnQucmVtYWluZGVyO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnJldmVyc2UoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcXVvdGllbnQ6IGJpZ0ludChyZXN1bHQsIHMpLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlbWFpbmRlcjogYmlnSW50KHJlbWFpbmRlciwgZmlyc3Quc2lnbilcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGRpdmlkZTogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmRpdm1vZChuLCBtKS5xdW90aWVudDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgb3ZlcjogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmRpdmlkZShuLCBtKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbW9kOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uZGl2bW9kKG4sIG0pLnJlbWFpbmRlcjtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVtYWluZGVyOiBmdW5jdGlvbihuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5tb2QobiwgbSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHBvdzogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHNlbGYsIHNlY29uZDtcclxuICAgICAgICAgICAgICAgIGlmIChtKSAoZmlyc3QgPSBwYXJzZShuKSkgJiYgKHNlY29uZCA9IHBhcnNlKG0pKTtcclxuICAgICAgICAgICAgICAgIGVsc2Ugc2Vjb25kID0gcGFyc2UobiwgZmlyc3QpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSBmaXJzdCwgYiA9IHNlY29uZDtcclxuICAgICAgICAgICAgICAgIGlmIChiaWdJbnQoYS52YWx1ZSwgYS5zaWduKS5lcXVhbHMoMCkpIHJldHVybiBaRVJPO1xyXG4gICAgICAgICAgICAgICAgaWYgKGIubGVzc2VyKDApKSByZXR1cm4gWkVSTztcclxuICAgICAgICAgICAgICAgIGlmIChiLmVxdWFscygwKSkgcmV0dXJuIE9ORTtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBiaWdJbnQoYS52YWx1ZSwgYS5zaWduKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoYi5tb2QoMikuZXF1YWxzKDApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSByZXN1bHQucG93KGIub3ZlcigyKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMudGltZXMoYyk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQudGltZXMocmVzdWx0LnBvdyhiLm1pbnVzKDEpKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBtIHx8IHNlbGY7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5hZGQoZmlyc3QsIDEpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwcmV2OiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gbSB8fCBzZWxmO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uc3VidHJhY3QoZmlyc3QsIDEpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjb21wYXJlOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gc2VsZiwgc2Vjb25kO1xyXG4gICAgICAgICAgICAgICAgaWYgKG0pIChmaXJzdCA9IHBhcnNlKG4pKSAmJiAoc2Vjb25kID0gcGFyc2UobSwgZmlyc3QpKTtcclxuICAgICAgICAgICAgICAgIGVsc2Ugc2Vjb25kID0gcGFyc2UobiwgZmlyc3QpO1xyXG4gICAgICAgICAgICAgICAgbm9ybWFsaXplKGZpcnN0LCBzZWNvbmQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0LnZhbHVlLmxlbmd0aCA9PT0gMSAmJiBzZWNvbmQudmFsdWUubGVuZ3RoID09PSAxICYmIGZpcnN0LnZhbHVlWzBdID09PSAwICYmIHNlY29uZC52YWx1ZVswXSA9PT0gMCkgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2Vjb25kLnNpZ24gIT09IGZpcnN0LnNpZ24pIHJldHVybiBmaXJzdC5zaWduID09PSBzaWduLnBvc2l0aXZlID8gMSA6IC0xO1xyXG4gICAgICAgICAgICAgICAgdmFyIG11bHRpcGxpZXIgPSBmaXJzdC5zaWduID09PSBzaWduLnBvc2l0aXZlID8gMSA6IC0xO1xyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSBmaXJzdC52YWx1ZSwgYiA9IHNlY29uZC52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBhLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFbaV0gPiBiW2ldKSByZXR1cm4gMSAqIG11bHRpcGxpZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJbaV0gPiBhW2ldKSByZXR1cm4gLTEgKiBtdWx0aXBsaWVyO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNvbXBhcmVUbzogZnVuY3Rpb24obiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uY29tcGFyZShuLCBtKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY29tcGFyZUFiczogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHNlbGYsIHNlY29uZDtcclxuICAgICAgICAgICAgICAgIGlmIChtKSAoZmlyc3QgPSBwYXJzZShuKSkgJiYgKHNlY29uZCA9IHBhcnNlKG0sIGZpcnN0KSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHNlY29uZCA9IHBhcnNlKG4sIGZpcnN0KTtcclxuICAgICAgICAgICAgICAgIGZpcnN0LnNpZ24gPSBzZWNvbmQuc2lnbiA9IHNpZ24ucG9zaXRpdmU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5jb21wYXJlKGZpcnN0LCBzZWNvbmQpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcXVhbHM6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5jb21wYXJlKG4sIG0pID09PSAwO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBub3RFcXVhbHM6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gIW8uZXF1YWxzKG4sIG0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBsZXNzZXI6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5jb21wYXJlKG4sIG0pIDwgMDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZ3JlYXRlcjogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmNvbXBhcmUobiwgbSkgPiAwO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBncmVhdGVyT3JFcXVhbHM6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5jb21wYXJlKG4sIG0pID49IDA7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGxlc3Nlck9yRXF1YWxzOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uY29tcGFyZShuLCBtKSA8PSAwO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBpc1Bvc2l0aXZlOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gbSB8fCBzZWxmO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpcnN0LnNpZ24gPT09IHNpZ24ucG9zaXRpdmU7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGlzTmVnYXRpdmU6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBtIHx8IHNlbGY7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlyc3Quc2lnbiA9PT0gc2lnbi5uZWdhdGl2ZTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgaXNFdmVuOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gbSB8fCBzZWxmO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpcnN0LnZhbHVlWzBdICUgMiA9PT0gMDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgaXNPZGQ6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBtIHx8IHNlbGY7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlyc3QudmFsdWVbMF0gJSAyID09PSAxO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0b1N0cmluZzogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IG0gfHwgc2VsZjtcclxuICAgICAgICAgICAgICAgIHZhciBzdHIgPSBcIlwiLCBsZW4gPSBmaXJzdC52YWx1ZS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAobGVuLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZmlyc3QudmFsdWVbbGVuXS50b1N0cmluZygpLmxlbmd0aCA9PT0gOCkgc3RyICs9IGZpcnN0LnZhbHVlW2xlbl07XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBzdHIgKz0gKGJhc2UudG9TdHJpbmcoKSArIGZpcnN0LnZhbHVlW2xlbl0pLnNsaWNlKC1sb2dCYXNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHdoaWxlIChzdHJbMF0gPT09IFwiMFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyID0gc3RyLnNsaWNlKDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCFzdHIubGVuZ3RoKSBzdHIgPSBcIjBcIjtcclxuICAgICAgICAgICAgICAgIGlmIChzdHIgPT09IFwiMFwiKSByZXR1cm4gc3RyO1xyXG4gICAgICAgICAgICAgICAgdmFyIHMgPSBmaXJzdC5zaWduID09PSBzaWduLnBvc2l0aXZlID8gXCJcIiA6IFwiLVwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHMgKyBzdHI7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHRvSlNOdW1iZXI6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gK28udG9TdHJpbmcobSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHZhbHVlT2Y6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby50b0pTTnVtYmVyKG0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gbztcclxuICAgIH07XHJcblxyXG4gICAgdmFyIFpFUk8gPSBiaWdJbnQoWzBdLCBzaWduLnBvc2l0aXZlKTtcclxuICAgIHZhciBPTkUgPSBiaWdJbnQoWzFdLCBzaWduLnBvc2l0aXZlKTtcclxuICAgIHZhciBNSU5VU19PTkUgPSBiaWdJbnQoWzFdLCBzaWduLm5lZ2F0aXZlKTtcclxuXHJcbiAgICB2YXIgcGFyc2VCYXNlID0gZnVuY3Rpb24gKHRleHQsIGJhc2UpIHtcclxuICAgICAgICBiYXNlID0gcGFyc2UoYmFzZSk7XHJcbiAgICAgICAgdmFyIHZhbCA9IFpFUk87XHJcbiAgICAgICAgdmFyIGRpZ2l0cyA9IFtdO1xyXG4gICAgICAgIHZhciBpO1xyXG4gICAgICAgIHZhciBpc05lZ2F0aXZlID0gZmFsc2U7XHJcbiAgICAgICAgZnVuY3Rpb24gcGFyc2VUb2tlbih0ZXh0KSB7XHJcbiAgICAgICAgICAgIHZhciBjID0gdGV4dFtpXS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICBpZiAoaSA9PT0gMCAmJiB0ZXh0W2ldID09PSBcIi1cIikge1xyXG4gICAgICAgICAgICAgICAgaXNOZWdhdGl2ZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKC9bMC05XS8udGVzdChjKSkgZGlnaXRzLnB1c2gocGFyc2UoYykpO1xyXG4gICAgICAgICAgICBlbHNlIGlmICgvW2Etel0vLnRlc3QoYykpIGRpZ2l0cy5wdXNoKHBhcnNlKGMuY2hhckNvZGVBdCgwKSAtIDg3KSk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGMgPT09IFwiPFwiKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RhcnQgPSBpO1xyXG4gICAgICAgICAgICAgICAgZG8gaSsrOyB3aGlsZSAodGV4dFtpXSAhPT0gXCI+XCIpO1xyXG4gICAgICAgICAgICAgICAgZGlnaXRzLnB1c2gocGFyc2UodGV4dC5zbGljZShzdGFydCArIDEsIGkpKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IoYyArIFwiIGlzIG5vdCBhIHZhbGlkIGNoYXJhY3RlclwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRleHQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgcGFyc2VUb2tlbih0ZXh0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZGlnaXRzLnJldmVyc2UoKTtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZGlnaXRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhbCA9IHZhbC5hZGQoZGlnaXRzW2ldLnRpbWVzKGJhc2UucG93KGkpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBpc05lZ2F0aXZlID8gLXZhbCA6IHZhbDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgZm5SZXR1cm4gPSBmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgICAgIGlmICh0eXBlb2YgYSA9PT0gXCJ1bmRlZmluZWRcIikgcmV0dXJuIFpFUk87XHJcbiAgICAgICAgaWYgKHR5cGVvZiBiICE9PSBcInVuZGVmaW5lZFwiKSByZXR1cm4gcGFyc2VCYXNlKGEsIGIpO1xyXG4gICAgICAgIHJldHVybiBwYXJzZShhKTtcclxuICAgIH07XHJcbiAgICBmblJldHVybi56ZXJvID0gWkVSTztcclxuICAgIGZuUmV0dXJuLm9uZSA9IE9ORTtcclxuICAgIGZuUmV0dXJuLm1pbnVzT25lID0gTUlOVVNfT05FO1xyXG4gICAgcmV0dXJuIGZuUmV0dXJuO1xyXG59KSgpO1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gYmlnSW50O1xyXG59IiwiLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8ZmVyb3NzQGZlcm9zcy5vcmc+IDxodHRwOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuXG52YXIgYmFzZTY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJylcbnZhciBpZWVlNzU0ID0gcmVxdWlyZSgnaWVlZTc1NCcpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMgPSA1MFxuQnVmZmVyLnBvb2xTaXplID0gODE5MlxuXG4vKipcbiAqIElmIGBCdWZmZXIuX3VzZVR5cGVkQXJyYXlzYDpcbiAqICAgPT09IHRydWUgICAgVXNlIFVpbnQ4QXJyYXkgaW1wbGVtZW50YXRpb24gKGZhc3Rlc3QpXG4gKiAgID09PSBmYWxzZSAgIFVzZSBPYmplY3QgaW1wbGVtZW50YXRpb24gKGNvbXBhdGlibGUgZG93biB0byBJRTYpXG4gKi9cbkJ1ZmZlci5fdXNlVHlwZWRBcnJheXMgPSAoZnVuY3Rpb24gKCkge1xuICAvLyBEZXRlY3QgaWYgYnJvd3NlciBzdXBwb3J0cyBUeXBlZCBBcnJheXMuIFN1cHBvcnRlZCBicm93c2VycyBhcmUgSUUgMTArLCBGaXJlZm94IDQrLFxuICAvLyBDaHJvbWUgNyssIFNhZmFyaSA1LjErLCBPcGVyYSAxMS42KywgaU9TIDQuMisuIElmIHRoZSBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgYWRkaW5nXG4gIC8vIHByb3BlcnRpZXMgdG8gYFVpbnQ4QXJyYXlgIGluc3RhbmNlcywgdGhlbiB0aGF0J3MgdGhlIHNhbWUgYXMgbm8gYFVpbnQ4QXJyYXlgIHN1cHBvcnRcbiAgLy8gYmVjYXVzZSB3ZSBuZWVkIHRvIGJlIGFibGUgdG8gYWRkIGFsbCB0aGUgbm9kZSBCdWZmZXIgQVBJIG1ldGhvZHMuIFRoaXMgaXMgYW4gaXNzdWVcbiAgLy8gaW4gRmlyZWZveCA0LTI5LiBOb3cgZml4ZWQ6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NTQzOFxuICB0cnkge1xuICAgIHZhciBidWYgPSBuZXcgQXJyYXlCdWZmZXIoMClcbiAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkoYnVmKVxuICAgIGFyci5mb28gPSBmdW5jdGlvbiAoKSB7IHJldHVybiA0MiB9XG4gICAgcmV0dXJuIDQyID09PSBhcnIuZm9vKCkgJiZcbiAgICAgICAgdHlwZW9mIGFyci5zdWJhcnJheSA9PT0gJ2Z1bmN0aW9uJyAvLyBDaHJvbWUgOS0xMCBsYWNrIGBzdWJhcnJheWBcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59KSgpXG5cbi8qKlxuICogQ2xhc3M6IEJ1ZmZlclxuICogPT09PT09PT09PT09PVxuICpcbiAqIFRoZSBCdWZmZXIgY29uc3RydWN0b3IgcmV0dXJucyBpbnN0YW5jZXMgb2YgYFVpbnQ4QXJyYXlgIHRoYXQgYXJlIGF1Z21lbnRlZFxuICogd2l0aCBmdW5jdGlvbiBwcm9wZXJ0aWVzIGZvciBhbGwgdGhlIG5vZGUgYEJ1ZmZlcmAgQVBJIGZ1bmN0aW9ucy4gV2UgdXNlXG4gKiBgVWludDhBcnJheWAgc28gdGhhdCBzcXVhcmUgYnJhY2tldCBub3RhdGlvbiB3b3JrcyBhcyBleHBlY3RlZCAtLSBpdCByZXR1cm5zXG4gKiBhIHNpbmdsZSBvY3RldC5cbiAqXG4gKiBCeSBhdWdtZW50aW5nIHRoZSBpbnN0YW5jZXMsIHdlIGNhbiBhdm9pZCBtb2RpZnlpbmcgdGhlIGBVaW50OEFycmF5YFxuICogcHJvdG90eXBlLlxuICovXG5mdW5jdGlvbiBCdWZmZXIgKHN1YmplY3QsIGVuY29kaW5nLCBub1plcm8pIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEJ1ZmZlcikpXG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoc3ViamVjdCwgZW5jb2RpbmcsIG5vWmVybylcblxuICB2YXIgdHlwZSA9IHR5cGVvZiBzdWJqZWN0XG5cbiAgLy8gV29ya2Fyb3VuZDogbm9kZSdzIGJhc2U2NCBpbXBsZW1lbnRhdGlvbiBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgc3RyaW5nc1xuICAvLyB3aGlsZSBiYXNlNjQtanMgZG9lcyBub3QuXG4gIGlmIChlbmNvZGluZyA9PT0gJ2Jhc2U2NCcgJiYgdHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICBzdWJqZWN0ID0gc3RyaW5ndHJpbShzdWJqZWN0KVxuICAgIHdoaWxlIChzdWJqZWN0Lmxlbmd0aCAlIDQgIT09IDApIHtcbiAgICAgIHN1YmplY3QgPSBzdWJqZWN0ICsgJz0nXG4gICAgfVxuICB9XG5cbiAgLy8gRmluZCB0aGUgbGVuZ3RoXG4gIHZhciBsZW5ndGhcbiAgaWYgKHR5cGUgPT09ICdudW1iZXInKVxuICAgIGxlbmd0aCA9IGNvZXJjZShzdWJqZWN0KVxuICBlbHNlIGlmICh0eXBlID09PSAnc3RyaW5nJylcbiAgICBsZW5ndGggPSBCdWZmZXIuYnl0ZUxlbmd0aChzdWJqZWN0LCBlbmNvZGluZylcbiAgZWxzZSBpZiAodHlwZSA9PT0gJ29iamVjdCcpXG4gICAgbGVuZ3RoID0gY29lcmNlKHN1YmplY3QubGVuZ3RoKSAvLyBhc3N1bWUgdGhhdCBvYmplY3QgaXMgYXJyYXktbGlrZVxuICBlbHNlXG4gICAgdGhyb3cgbmV3IEVycm9yKCdGaXJzdCBhcmd1bWVudCBuZWVkcyB0byBiZSBhIG51bWJlciwgYXJyYXkgb3Igc3RyaW5nLicpXG5cbiAgdmFyIGJ1ZlxuICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cykge1xuICAgIC8vIFByZWZlcnJlZDogUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2UgZm9yIGJlc3QgcGVyZm9ybWFuY2VcbiAgICBidWYgPSBCdWZmZXIuX2F1Z21lbnQobmV3IFVpbnQ4QXJyYXkobGVuZ3RoKSlcbiAgfSBlbHNlIHtcbiAgICAvLyBGYWxsYmFjazogUmV0dXJuIFRISVMgaW5zdGFuY2Ugb2YgQnVmZmVyIChjcmVhdGVkIGJ5IGBuZXdgKVxuICAgIGJ1ZiA9IHRoaXNcbiAgICBidWYubGVuZ3RoID0gbGVuZ3RoXG4gICAgYnVmLl9pc0J1ZmZlciA9IHRydWVcbiAgfVxuXG4gIHZhciBpXG4gIGlmIChCdWZmZXIuX3VzZVR5cGVkQXJyYXlzICYmIHR5cGVvZiBzdWJqZWN0LmJ5dGVMZW5ndGggPT09ICdudW1iZXInKSB7XG4gICAgLy8gU3BlZWQgb3B0aW1pemF0aW9uIC0tIHVzZSBzZXQgaWYgd2UncmUgY29weWluZyBmcm9tIGEgdHlwZWQgYXJyYXlcbiAgICBidWYuX3NldChzdWJqZWN0KVxuICB9IGVsc2UgaWYgKGlzQXJyYXlpc2goc3ViamVjdCkpIHtcbiAgICAvLyBUcmVhdCBhcnJheS1pc2ggb2JqZWN0cyBhcyBhIGJ5dGUgYXJyYXlcbiAgICBpZiAoQnVmZmVyLmlzQnVmZmVyKHN1YmplY3QpKSB7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspXG4gICAgICAgIGJ1ZltpXSA9IHN1YmplY3QucmVhZFVJbnQ4KGkpXG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKylcbiAgICAgICAgYnVmW2ldID0gKChzdWJqZWN0W2ldICUgMjU2KSArIDI1NikgJSAyNTZcbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICBidWYud3JpdGUoc3ViamVjdCwgMCwgZW5jb2RpbmcpXG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ251bWJlcicgJiYgIUJ1ZmZlci5fdXNlVHlwZWRBcnJheXMgJiYgIW5vWmVybykge1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgYnVmW2ldID0gMFxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBidWZcbn1cblxuLy8gU1RBVElDIE1FVEhPRFNcbi8vID09PT09PT09PT09PT09XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gKGVuY29kaW5nKSB7XG4gIHN3aXRjaCAoU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICBjYXNlICdyYXcnOlxuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5CdWZmZXIuaXNCdWZmZXIgPSBmdW5jdGlvbiAoYikge1xuICByZXR1cm4gISEoYiAhPT0gbnVsbCAmJiBiICE9PSB1bmRlZmluZWQgJiYgYi5faXNCdWZmZXIpXG59XG5cbkJ1ZmZlci5ieXRlTGVuZ3RoID0gZnVuY3Rpb24gKHN0ciwgZW5jb2RpbmcpIHtcbiAgdmFyIHJldFxuICBzdHIgPSBzdHIudG9TdHJpbmcoKVxuICBzd2l0Y2ggKGVuY29kaW5nIHx8ICd1dGY4Jykge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgICByZXQgPSBzdHIubGVuZ3RoIC8gMlxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgICByZXQgPSB1dGY4VG9CeXRlcyhzdHIpLmxlbmd0aFxuICAgICAgYnJlYWtcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdyYXcnOlxuICAgICAgcmV0ID0gc3RyLmxlbmd0aFxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgcmV0ID0gYmFzZTY0VG9CeXRlcyhzdHIpLmxlbmd0aFxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0ID0gc3RyLmxlbmd0aCAqIDJcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBlbmNvZGluZycpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5CdWZmZXIuY29uY2F0ID0gZnVuY3Rpb24gKGxpc3QsIHRvdGFsTGVuZ3RoKSB7XG4gIGFzc2VydChpc0FycmF5KGxpc3QpLCAnVXNhZ2U6IEJ1ZmZlci5jb25jYXQobGlzdFssIGxlbmd0aF0pJylcblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcigwKVxuICB9IGVsc2UgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIGxpc3RbMF1cbiAgfVxuXG4gIHZhciBpXG4gIGlmICh0b3RhbExlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdG90YWxMZW5ndGggPSAwXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRvdGFsTGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1ZiA9IG5ldyBCdWZmZXIodG90YWxMZW5ndGgpXG4gIHZhciBwb3MgPSAwXG4gIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBsaXN0W2ldXG4gICAgaXRlbS5jb3B5KGJ1ZiwgcG9zKVxuICAgIHBvcyArPSBpdGVtLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZcbn1cblxuQnVmZmVyLmNvbXBhcmUgPSBmdW5jdGlvbiAoYSwgYikge1xuICBhc3NlcnQoQnVmZmVyLmlzQnVmZmVyKGEpICYmIEJ1ZmZlci5pc0J1ZmZlcihiKSwgJ0FyZ3VtZW50cyBtdXN0IGJlIEJ1ZmZlcnMnKVxuICB2YXIgeCA9IGEubGVuZ3RoXG4gIHZhciB5ID0gYi5sZW5ndGhcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IE1hdGgubWluKHgsIHkpOyBpIDwgbGVuICYmIGFbaV0gPT09IGJbaV07IGkrKykge31cbiAgaWYgKGkgIT09IGxlbikge1xuICAgIHggPSBhW2ldXG4gICAgeSA9IGJbaV1cbiAgfVxuICBpZiAoeCA8IHkpIHtcbiAgICByZXR1cm4gLTFcbiAgfVxuICBpZiAoeSA8IHgpIHtcbiAgICByZXR1cm4gMVxuICB9XG4gIHJldHVybiAwXG59XG5cbi8vIEJVRkZFUiBJTlNUQU5DRSBNRVRIT0RTXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PVxuXG5mdW5jdGlvbiBoZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIC8vIG11c3QgYmUgYW4gZXZlbiBudW1iZXIgb2YgZGlnaXRzXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGFzc2VydChzdHJMZW4gJSAyID09PSAwLCAnSW52YWxpZCBoZXggc3RyaW5nJylcblxuICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgIGxlbmd0aCA9IHN0ckxlbiAvIDJcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGJ5dGUgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgYXNzZXJ0KCFpc05hTihieXRlKSwgJ0ludmFsaWQgaGV4IHN0cmluZycpXG4gICAgYnVmW29mZnNldCArIGldID0gYnl0ZVxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIHV0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBibGl0QnVmZmVyKHV0ZjhUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG4gIHJldHVybiBjaGFyc1dyaXR0ZW5cbn1cblxuZnVuY3Rpb24gYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIGJpbmFyeVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGFzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBibGl0QnVmZmVyKGJhc2U2NFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5mdW5jdGlvbiB1dGYxNmxlV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gU3VwcG9ydCBib3RoIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZylcbiAgLy8gYW5kIHRoZSBsZWdhY3kgKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIGlmICghaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfSBlbHNlIHsgIC8vIGxlZ2FjeVxuICAgIHZhciBzd2FwID0gZW5jb2RpbmdcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIG9mZnNldCA9IGxlbmd0aFxuICAgIGxlbmd0aCA9IHN3YXBcbiAgfVxuXG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cbiAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcgfHwgJ3V0ZjgnKS50b0xvd2VyQ2FzZSgpXG5cbiAgdmFyIHJldFxuICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IGhleFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIHJldCA9IHV0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgICByZXQgPSBhc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICByZXQgPSBiaW5hcnlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgcmV0ID0gYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IHV0ZjE2bGVXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nJylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG5cbiAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcgfHwgJ3V0ZjgnKS50b0xvd2VyQ2FzZSgpXG4gIHN0YXJ0ID0gTnVtYmVyKHN0YXJ0KSB8fCAwXG4gIGVuZCA9IChlbmQgPT09IHVuZGVmaW5lZCkgPyBzZWxmLmxlbmd0aCA6IE51bWJlcihlbmQpXG5cbiAgLy8gRmFzdHBhdGggZW1wdHkgc3RyaW5nc1xuICBpZiAoZW5kID09PSBzdGFydClcbiAgICByZXR1cm4gJydcblxuICB2YXIgcmV0XG4gIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgICAgcmV0ID0gaGV4U2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgICAgcmV0ID0gdXRmOFNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIHJldCA9IGFzY2lpU2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgIHJldCA9IGJpbmFyeVNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICByZXQgPSBiYXNlNjRTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0ID0gdXRmMTZsZVNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gZW5jb2RpbmcnKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ0J1ZmZlcicsXG4gICAgZGF0YTogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodGhpcy5fYXJyIHx8IHRoaXMsIDApXG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiAoYikge1xuICBhc3NlcnQoQnVmZmVyLmlzQnVmZmVyKGIpLCAnQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIHJldHVybiBCdWZmZXIuY29tcGFyZSh0aGlzLCBiKSA9PT0gMFxufVxuXG5CdWZmZXIucHJvdG90eXBlLmNvbXBhcmUgPSBmdW5jdGlvbiAoYikge1xuICBhc3NlcnQoQnVmZmVyLmlzQnVmZmVyKGIpLCAnQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIHJldHVybiBCdWZmZXIuY29tcGFyZSh0aGlzLCBiKVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiAodGFyZ2V0LCB0YXJnZXRfc3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHNvdXJjZSA9IHRoaXNcblxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAoIXRhcmdldF9zdGFydCkgdGFyZ2V0X3N0YXJ0ID0gMFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuXG4gIGlmICh0YXJnZXQubGVuZ3RoID09PSAwIHx8IHNvdXJjZS5sZW5ndGggPT09IDApIHJldHVyblxuXG4gIC8vIEZhdGFsIGVycm9yIGNvbmRpdGlvbnNcbiAgYXNzZXJ0KGVuZCA+PSBzdGFydCwgJ3NvdXJjZUVuZCA8IHNvdXJjZVN0YXJ0JylcbiAgYXNzZXJ0KHRhcmdldF9zdGFydCA+PSAwICYmIHRhcmdldF9zdGFydCA8IHRhcmdldC5sZW5ndGgsXG4gICAgICAndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGFzc2VydChzdGFydCA+PSAwICYmIHN0YXJ0IDwgc291cmNlLmxlbmd0aCwgJ3NvdXJjZVN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBhc3NlcnQoZW5kID49IDAgJiYgZW5kIDw9IHNvdXJjZS5sZW5ndGgsICdzb3VyY2VFbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgLy8gQXJlIHdlIG9vYj9cbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKVxuICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0IDwgZW5kIC0gc3RhcnQpXG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldF9zdGFydCArIHN0YXJ0XG5cbiAgdmFyIGxlbiA9IGVuZCAtIHN0YXJ0XG5cbiAgaWYgKGxlbiA8IDEwMCB8fCAhQnVmZmVyLl91c2VUeXBlZEFycmF5cykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0X3N0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0YXJnZXQuX3NldCh0aGlzLnN1YmFycmF5KHN0YXJ0LCBzdGFydCArIGxlbiksIHRhcmdldF9zdGFydClcbiAgfVxufVxuXG5mdW5jdGlvbiBiYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gdXRmOFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJlcyA9ICcnXG4gIHZhciB0bXAgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBpZiAoYnVmW2ldIDw9IDB4N0YpIHtcbiAgICAgIHJlcyArPSBkZWNvZGVVdGY4Q2hhcih0bXApICsgU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gICAgICB0bXAgPSAnJ1xuICAgIH0gZWxzZSB7XG4gICAgICB0bXAgKz0gJyUnICsgYnVmW2ldLnRvU3RyaW5nKDE2KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXMgKyBkZWNvZGVVdGY4Q2hhcih0bXApXG59XG5cbmZ1bmN0aW9uIGFzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gYmluYXJ5U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICByZXR1cm4gYXNjaWlTbGljZShidWYsIHN0YXJ0LCBlbmQpXG59XG5cbmZ1bmN0aW9uIGhleFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcblxuICBpZiAoIXN0YXJ0IHx8IHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmICghZW5kIHx8IGVuZCA8IDAgfHwgZW5kID4gbGVuKSBlbmQgPSBsZW5cblxuICB2YXIgb3V0ID0gJydcbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBvdXQgKz0gdG9IZXgoYnVmW2ldKVxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyBieXRlc1tpICsgMV0gKiAyNTYpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gY2xhbXAoc3RhcnQsIGxlbiwgMClcbiAgZW5kID0gY2xhbXAoZW5kLCBsZW4sIGxlbilcblxuICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cykge1xuICAgIHJldHVybiBCdWZmZXIuX2F1Z21lbnQodGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSlcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2xpY2VMZW4gPSBlbmQgLSBzdGFydFxuICAgIHZhciBuZXdCdWYgPSBuZXcgQnVmZmVyKHNsaWNlTGVuLCB1bmRlZmluZWQsIHRydWUpXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzbGljZUxlbjsgaSsrKSB7XG4gICAgICBuZXdCdWZbaV0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gICAgcmV0dXJuIG5ld0J1ZlxuICB9XG59XG5cbi8vIGBnZXRgIHdpbGwgYmUgcmVtb3ZlZCBpbiBOb2RlIDAuMTMrXG5CdWZmZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5nZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLnJlYWRVSW50OChvZmZzZXQpXG59XG5cbi8vIGBzZXRgIHdpbGwgYmUgcmVtb3ZlZCBpbiBOb2RlIDAuMTMrXG5CdWZmZXIucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uICh2LCBvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5zZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLndyaXRlVUludDgodiwgb2Zmc2V0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgPCB0aGlzLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpXG4gICAgcmV0dXJuXG5cbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5mdW5jdGlvbiByZWFkVUludDE2IChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDEgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgdmFyIHZhbFxuICBpZiAobGl0dGxlRW5kaWFuKSB7XG4gICAgdmFsID0gYnVmW29mZnNldF1cbiAgICBpZiAob2Zmc2V0ICsgMSA8IGxlbilcbiAgICAgIHZhbCB8PSBidWZbb2Zmc2V0ICsgMV0gPDwgOFxuICB9IGVsc2Uge1xuICAgIHZhbCA9IGJ1ZltvZmZzZXRdIDw8IDhcbiAgICBpZiAob2Zmc2V0ICsgMSA8IGxlbilcbiAgICAgIHZhbCB8PSBidWZbb2Zmc2V0ICsgMV1cbiAgfVxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHJlYWRVSW50MTYodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gcmVhZFVJbnQxNih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gcmVhZFVJbnQzMiAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIHZhciB2YWxcbiAgaWYgKGxpdHRsZUVuZGlhbikge1xuICAgIGlmIChvZmZzZXQgKyAyIDwgbGVuKVxuICAgICAgdmFsID0gYnVmW29mZnNldCArIDJdIDw8IDE2XG4gICAgaWYgKG9mZnNldCArIDEgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDFdIDw8IDhcbiAgICB2YWwgfD0gYnVmW29mZnNldF1cbiAgICBpZiAob2Zmc2V0ICsgMyA8IGxlbilcbiAgICAgIHZhbCA9IHZhbCArIChidWZbb2Zmc2V0ICsgM10gPDwgMjQgPj4+IDApXG4gIH0gZWxzZSB7XG4gICAgaWYgKG9mZnNldCArIDEgPCBsZW4pXG4gICAgICB2YWwgPSBidWZbb2Zmc2V0ICsgMV0gPDwgMTZcbiAgICBpZiAob2Zmc2V0ICsgMiA8IGxlbilcbiAgICAgIHZhbCB8PSBidWZbb2Zmc2V0ICsgMl0gPDwgOFxuICAgIGlmIChvZmZzZXQgKyAzIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAzXVxuICAgIHZhbCA9IHZhbCArIChidWZbb2Zmc2V0XSA8PCAyNCA+Pj4gMClcbiAgfVxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHJlYWRVSW50MzIodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyQkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gcmVhZFVJbnQzMih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLFxuICAgICAgICAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgPCB0aGlzLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpXG4gICAgcmV0dXJuXG5cbiAgdmFyIG5lZyA9IHRoaXNbb2Zmc2V0XSAmIDB4ODBcbiAgaWYgKG5lZylcbiAgICByZXR1cm4gKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xXG4gIGVsc2VcbiAgICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbmZ1bmN0aW9uIHJlYWRJbnQxNiAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAxIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIHZhciB2YWwgPSByZWFkVUludDE2KGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIHRydWUpXG4gIHZhciBuZWcgPSB2YWwgJiAweDgwMDBcbiAgaWYgKG5lZylcbiAgICByZXR1cm4gKDB4ZmZmZiAtIHZhbCArIDEpICogLTFcbiAgZWxzZVxuICAgIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiByZWFkSW50MTYodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiByZWFkSW50MTYodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHJlYWRJbnQzMiAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIHZhciB2YWwgPSByZWFkVUludDMyKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIHRydWUpXG4gIHZhciBuZWcgPSB2YWwgJiAweDgwMDAwMDAwXG4gIGlmIChuZWcpXG4gICAgcmV0dXJuICgweGZmZmZmZmZmIC0gdmFsICsgMSkgKiAtMVxuICBlbHNlXG4gICAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHJlYWRJbnQzMih0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHJlYWRJbnQzMih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gcmVhZEZsb2F0IChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHJldHVybiBpZWVlNzU0LnJlYWQoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gcmVhZEZsb2F0KHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0QkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gcmVhZEZsb2F0KHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiByZWFkRG91YmxlIChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgKyA3IDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHJldHVybiBpZWVlNzU0LnJlYWQoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHJlYWREb3VibGUodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlQkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gcmVhZERvdWJsZSh0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQ4ID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCA8IHRoaXMubGVuZ3RoLCAndHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnVpbnQodmFsdWUsIDB4ZmYpXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKSByZXR1cm5cblxuICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5mdW5jdGlvbiB3cml0ZVVJbnQxNiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAxIDwgYnVmLmxlbmd0aCwgJ3RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZ1aW50KHZhbHVlLCAweGZmZmYpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGxlbiAtIG9mZnNldCwgMik7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPVxuICAgICAgICAodmFsdWUgJiAoMHhmZiA8PCAoOCAqIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpKSkpID4+PlxuICAgICAgICAgICAgKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkgKiA4XG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHdyaXRlVUludDMyIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAndHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnVpbnQodmFsdWUsIDB4ZmZmZmZmZmYpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGxlbiAtIG9mZnNldCwgNCk7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPVxuICAgICAgICAodmFsdWUgPj4+IChsaXR0bGVFbmRpYW4gPyBpIDogMyAtIGkpICogOCkgJiAweGZmXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCA8IHRoaXMubGVuZ3RoLCAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnNpbnQodmFsdWUsIDB4N2YsIC0weDgwKVxuICB9XG5cbiAgaWYgKG9mZnNldCA+PSB0aGlzLmxlbmd0aClcbiAgICByZXR1cm5cblxuICBpZiAodmFsdWUgPj0gMClcbiAgICB0aGlzLndyaXRlVUludDgodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpXG4gIGVsc2VcbiAgICB0aGlzLndyaXRlVUludDgoMHhmZiArIHZhbHVlICsgMSwgb2Zmc2V0LCBub0Fzc2VydClcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuZnVuY3Rpb24gd3JpdGVJbnQxNiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAxIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZzaW50KHZhbHVlLCAweDdmZmYsIC0weDgwMDApXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZiAodmFsdWUgPj0gMClcbiAgICB3cml0ZVVJbnQxNihidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpXG4gIGVsc2VcbiAgICB3cml0ZVVJbnQxNihidWYsIDB4ZmZmZiArIHZhbHVlICsgMSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2QkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZUludDMyIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnNpbnQodmFsdWUsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgaWYgKHZhbHVlID49IDApXG4gICAgd3JpdGVVSW50MzIoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KVxuICBlbHNlXG4gICAgd3JpdGVVSW50MzIoYnVmLCAweGZmZmZmZmZmICsgdmFsdWUgKyAxLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmSUVFRTc1NCh2YWx1ZSwgMy40MDI4MjM0NjYzODUyODg2ZSszOCwgLTMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gd3JpdGVEb3VibGUgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgNyA8IGJ1Zi5sZW5ndGgsXG4gICAgICAgICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmSUVFRTc1NCh2YWx1ZSwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxuICByZXR1cm4gb2Zmc2V0ICsgOFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuLy8gZmlsbCh2YWx1ZSwgc3RhcnQ9MCwgZW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiAodmFsdWUsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCF2YWx1ZSkgdmFsdWUgPSAwXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCkgZW5kID0gdGhpcy5sZW5ndGhcblxuICBhc3NlcnQoZW5kID49IHN0YXJ0LCAnZW5kIDwgc3RhcnQnKVxuXG4gIC8vIEZpbGwgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuXG4gIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgYXNzZXJ0KHN0YXJ0ID49IDAgJiYgc3RhcnQgPCB0aGlzLmxlbmd0aCwgJ3N0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBhc3NlcnQoZW5kID49IDAgJiYgZW5kIDw9IHRoaXMubGVuZ3RoLCAnZW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIHZhciBpXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgdGhpc1tpXSA9IHZhbHVlXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBieXRlcyA9IHV0ZjhUb0J5dGVzKHZhbHVlLnRvU3RyaW5nKCkpXG4gICAgdmFyIGxlbiA9IGJ5dGVzLmxlbmd0aFxuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIHRoaXNbaV0gPSBieXRlc1tpICUgbGVuXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG91dCA9IFtdXG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgb3V0W2ldID0gdG9IZXgodGhpc1tpXSlcbiAgICBpZiAoaSA9PT0gZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFUykge1xuICAgICAgb3V0W2kgKyAxXSA9ICcuLi4nXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuICByZXR1cm4gJzxCdWZmZXIgJyArIG91dC5qb2luKCcgJykgKyAnPidcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGBBcnJheUJ1ZmZlcmAgd2l0aCB0aGUgKmNvcGllZCogbWVtb3J5IG9mIHRoZSBidWZmZXIgaW5zdGFuY2UuXG4gKiBBZGRlZCBpbiBOb2RlIDAuMTIuIE9ubHkgYXZhaWxhYmxlIGluIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBBcnJheUJ1ZmZlci5cbiAqL1xuQnVmZmVyLnByb3RvdHlwZS50b0FycmF5QnVmZmVyID0gZnVuY3Rpb24gKCkge1xuICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKEJ1ZmZlci5fdXNlVHlwZWRBcnJheXMpIHtcbiAgICAgIHJldHVybiAobmV3IEJ1ZmZlcih0aGlzKSkuYnVmZmVyXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBidWYgPSBuZXcgVWludDhBcnJheSh0aGlzLmxlbmd0aClcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBidWYubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgYnVmW2ldID0gdGhpc1tpXVxuICAgICAgfVxuICAgICAgcmV0dXJuIGJ1Zi5idWZmZXJcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdCdWZmZXIudG9BcnJheUJ1ZmZlciBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlcicpXG4gIH1cbn1cblxuLy8gSEVMUEVSIEZVTkNUSU9OU1xuLy8gPT09PT09PT09PT09PT09PVxuXG52YXIgQlAgPSBCdWZmZXIucHJvdG90eXBlXG5cbi8qKlxuICogQXVnbWVudCBhIFVpbnQ4QXJyYXkgKmluc3RhbmNlKiAobm90IHRoZSBVaW50OEFycmF5IGNsYXNzISkgd2l0aCBCdWZmZXIgbWV0aG9kc1xuICovXG5CdWZmZXIuX2F1Z21lbnQgPSBmdW5jdGlvbiAoYXJyKSB7XG4gIGFyci5faXNCdWZmZXIgPSB0cnVlXG5cbiAgLy8gc2F2ZSByZWZlcmVuY2UgdG8gb3JpZ2luYWwgVWludDhBcnJheSBnZXQvc2V0IG1ldGhvZHMgYmVmb3JlIG92ZXJ3cml0aW5nXG4gIGFyci5fZ2V0ID0gYXJyLmdldFxuICBhcnIuX3NldCA9IGFyci5zZXRcblxuICAvLyBkZXByZWNhdGVkLCB3aWxsIGJlIHJlbW92ZWQgaW4gbm9kZSAwLjEzK1xuICBhcnIuZ2V0ID0gQlAuZ2V0XG4gIGFyci5zZXQgPSBCUC5zZXRcblxuICBhcnIud3JpdGUgPSBCUC53cml0ZVxuICBhcnIudG9TdHJpbmcgPSBCUC50b1N0cmluZ1xuICBhcnIudG9Mb2NhbGVTdHJpbmcgPSBCUC50b1N0cmluZ1xuICBhcnIudG9KU09OID0gQlAudG9KU09OXG4gIGFyci5lcXVhbHMgPSBCUC5lcXVhbHNcbiAgYXJyLmNvbXBhcmUgPSBCUC5jb21wYXJlXG4gIGFyci5jb3B5ID0gQlAuY29weVxuICBhcnIuc2xpY2UgPSBCUC5zbGljZVxuICBhcnIucmVhZFVJbnQ4ID0gQlAucmVhZFVJbnQ4XG4gIGFyci5yZWFkVUludDE2TEUgPSBCUC5yZWFkVUludDE2TEVcbiAgYXJyLnJlYWRVSW50MTZCRSA9IEJQLnJlYWRVSW50MTZCRVxuICBhcnIucmVhZFVJbnQzMkxFID0gQlAucmVhZFVJbnQzMkxFXG4gIGFyci5yZWFkVUludDMyQkUgPSBCUC5yZWFkVUludDMyQkVcbiAgYXJyLnJlYWRJbnQ4ID0gQlAucmVhZEludDhcbiAgYXJyLnJlYWRJbnQxNkxFID0gQlAucmVhZEludDE2TEVcbiAgYXJyLnJlYWRJbnQxNkJFID0gQlAucmVhZEludDE2QkVcbiAgYXJyLnJlYWRJbnQzMkxFID0gQlAucmVhZEludDMyTEVcbiAgYXJyLnJlYWRJbnQzMkJFID0gQlAucmVhZEludDMyQkVcbiAgYXJyLnJlYWRGbG9hdExFID0gQlAucmVhZEZsb2F0TEVcbiAgYXJyLnJlYWRGbG9hdEJFID0gQlAucmVhZEZsb2F0QkVcbiAgYXJyLnJlYWREb3VibGVMRSA9IEJQLnJlYWREb3VibGVMRVxuICBhcnIucmVhZERvdWJsZUJFID0gQlAucmVhZERvdWJsZUJFXG4gIGFyci53cml0ZVVJbnQ4ID0gQlAud3JpdGVVSW50OFxuICBhcnIud3JpdGVVSW50MTZMRSA9IEJQLndyaXRlVUludDE2TEVcbiAgYXJyLndyaXRlVUludDE2QkUgPSBCUC53cml0ZVVJbnQxNkJFXG4gIGFyci53cml0ZVVJbnQzMkxFID0gQlAud3JpdGVVSW50MzJMRVxuICBhcnIud3JpdGVVSW50MzJCRSA9IEJQLndyaXRlVUludDMyQkVcbiAgYXJyLndyaXRlSW50OCA9IEJQLndyaXRlSW50OFxuICBhcnIud3JpdGVJbnQxNkxFID0gQlAud3JpdGVJbnQxNkxFXG4gIGFyci53cml0ZUludDE2QkUgPSBCUC53cml0ZUludDE2QkVcbiAgYXJyLndyaXRlSW50MzJMRSA9IEJQLndyaXRlSW50MzJMRVxuICBhcnIud3JpdGVJbnQzMkJFID0gQlAud3JpdGVJbnQzMkJFXG4gIGFyci53cml0ZUZsb2F0TEUgPSBCUC53cml0ZUZsb2F0TEVcbiAgYXJyLndyaXRlRmxvYXRCRSA9IEJQLndyaXRlRmxvYXRCRVxuICBhcnIud3JpdGVEb3VibGVMRSA9IEJQLndyaXRlRG91YmxlTEVcbiAgYXJyLndyaXRlRG91YmxlQkUgPSBCUC53cml0ZURvdWJsZUJFXG4gIGFyci5maWxsID0gQlAuZmlsbFxuICBhcnIuaW5zcGVjdCA9IEJQLmluc3BlY3RcbiAgYXJyLnRvQXJyYXlCdWZmZXIgPSBCUC50b0FycmF5QnVmZmVyXG5cbiAgcmV0dXJuIGFyclxufVxuXG5mdW5jdGlvbiBzdHJpbmd0cmltIChzdHIpIHtcbiAgaWYgKHN0ci50cmltKSByZXR1cm4gc3RyLnRyaW0oKVxuICByZXR1cm4gc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKVxufVxuXG4vLyBzbGljZShzdGFydCwgZW5kKVxuZnVuY3Rpb24gY2xhbXAgKGluZGV4LCBsZW4sIGRlZmF1bHRWYWx1ZSkge1xuICBpZiAodHlwZW9mIGluZGV4ICE9PSAnbnVtYmVyJykgcmV0dXJuIGRlZmF1bHRWYWx1ZVxuICBpbmRleCA9IH5+aW5kZXg7ICAvLyBDb2VyY2UgdG8gaW50ZWdlci5cbiAgaWYgKGluZGV4ID49IGxlbikgcmV0dXJuIGxlblxuICBpZiAoaW5kZXggPj0gMCkgcmV0dXJuIGluZGV4XG4gIGluZGV4ICs9IGxlblxuICBpZiAoaW5kZXggPj0gMCkgcmV0dXJuIGluZGV4XG4gIHJldHVybiAwXG59XG5cbmZ1bmN0aW9uIGNvZXJjZSAobGVuZ3RoKSB7XG4gIC8vIENvZXJjZSBsZW5ndGggdG8gYSBudW1iZXIgKHBvc3NpYmx5IE5hTiksIHJvdW5kIHVwXG4gIC8vIGluIGNhc2UgaXQncyBmcmFjdGlvbmFsIChlLmcuIDEyMy40NTYpIHRoZW4gZG8gYVxuICAvLyBkb3VibGUgbmVnYXRlIHRvIGNvZXJjZSBhIE5hTiB0byAwLiBFYXN5LCByaWdodD9cbiAgbGVuZ3RoID0gfn5NYXRoLmNlaWwoK2xlbmd0aClcbiAgcmV0dXJuIGxlbmd0aCA8IDAgPyAwIDogbGVuZ3RoXG59XG5cbmZ1bmN0aW9uIGlzQXJyYXkgKHN1YmplY3QpIHtcbiAgcmV0dXJuIChBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChzdWJqZWN0KSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChzdWJqZWN0KSA9PT0gJ1tvYmplY3QgQXJyYXldJ1xuICB9KShzdWJqZWN0KVxufVxuXG5mdW5jdGlvbiBpc0FycmF5aXNoIChzdWJqZWN0KSB7XG4gIHJldHVybiBpc0FycmF5KHN1YmplY3QpIHx8IEJ1ZmZlci5pc0J1ZmZlcihzdWJqZWN0KSB8fFxuICAgICAgc3ViamVjdCAmJiB0eXBlb2Ygc3ViamVjdCA9PT0gJ29iamVjdCcgJiZcbiAgICAgIHR5cGVvZiBzdWJqZWN0Lmxlbmd0aCA9PT0gJ251bWJlcidcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIHZhciBiID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBpZiAoYiA8PSAweDdGKSB7XG4gICAgICBieXRlQXJyYXkucHVzaChiKVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgc3RhcnQgPSBpXG4gICAgICBpZiAoYiA+PSAweEQ4MDAgJiYgYiA8PSAweERGRkYpIGkrK1xuICAgICAgdmFyIGggPSBlbmNvZGVVUklDb21wb25lbnQoc3RyLnNsaWNlKHN0YXJ0LCBpKzEpKS5zdWJzdHIoMSkuc3BsaXQoJyUnKVxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBoLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGJ5dGVBcnJheS5wdXNoKHBhcnNlSW50KGhbal0sIDE2KSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIHJldHVybiBiYXNlNjQudG9CeXRlQXJyYXkoc3RyKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSlcbiAgICAgIGJyZWFrXG4gICAgZHN0W2kgKyBvZmZzZXRdID0gc3JjW2ldXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gZGVjb2RlVXRmOENoYXIgKHN0cikge1xuICB0cnkge1xuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoc3RyKVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZSgweEZGRkQpIC8vIFVURiA4IGludmFsaWQgY2hhclxuICB9XG59XG5cbi8qXG4gKiBXZSBoYXZlIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSB2YWx1ZSBpcyBhIHZhbGlkIGludGVnZXIuIFRoaXMgbWVhbnMgdGhhdCBpdFxuICogaXMgbm9uLW5lZ2F0aXZlLiBJdCBoYXMgbm8gZnJhY3Rpb25hbCBjb21wb25lbnQgYW5kIHRoYXQgaXQgZG9lcyBub3RcbiAqIGV4Y2VlZCB0aGUgbWF4aW11bSBhbGxvd2VkIHZhbHVlLlxuICovXG5mdW5jdGlvbiB2ZXJpZnVpbnQgKHZhbHVlLCBtYXgpIHtcbiAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicsICdjYW5ub3Qgd3JpdGUgYSBub24tbnVtYmVyIGFzIGEgbnVtYmVyJylcbiAgYXNzZXJ0KHZhbHVlID49IDAsICdzcGVjaWZpZWQgYSBuZWdhdGl2ZSB2YWx1ZSBmb3Igd3JpdGluZyBhbiB1bnNpZ25lZCB2YWx1ZScpXG4gIGFzc2VydCh2YWx1ZSA8PSBtYXgsICd2YWx1ZSBpcyBsYXJnZXIgdGhhbiBtYXhpbXVtIHZhbHVlIGZvciB0eXBlJylcbiAgYXNzZXJ0KE1hdGguZmxvb3IodmFsdWUpID09PSB2YWx1ZSwgJ3ZhbHVlIGhhcyBhIGZyYWN0aW9uYWwgY29tcG9uZW50Jylcbn1cblxuZnVuY3Rpb24gdmVyaWZzaW50ICh2YWx1ZSwgbWF4LCBtaW4pIHtcbiAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicsICdjYW5ub3Qgd3JpdGUgYSBub24tbnVtYmVyIGFzIGEgbnVtYmVyJylcbiAgYXNzZXJ0KHZhbHVlIDw9IG1heCwgJ3ZhbHVlIGxhcmdlciB0aGFuIG1heGltdW0gYWxsb3dlZCB2YWx1ZScpXG4gIGFzc2VydCh2YWx1ZSA+PSBtaW4sICd2YWx1ZSBzbWFsbGVyIHRoYW4gbWluaW11bSBhbGxvd2VkIHZhbHVlJylcbiAgYXNzZXJ0KE1hdGguZmxvb3IodmFsdWUpID09PSB2YWx1ZSwgJ3ZhbHVlIGhhcyBhIGZyYWN0aW9uYWwgY29tcG9uZW50Jylcbn1cblxuZnVuY3Rpb24gdmVyaWZJRUVFNzU0ICh2YWx1ZSwgbWF4LCBtaW4pIHtcbiAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicsICdjYW5ub3Qgd3JpdGUgYSBub24tbnVtYmVyIGFzIGEgbnVtYmVyJylcbiAgYXNzZXJ0KHZhbHVlIDw9IG1heCwgJ3ZhbHVlIGxhcmdlciB0aGFuIG1heGltdW0gYWxsb3dlZCB2YWx1ZScpXG4gIGFzc2VydCh2YWx1ZSA+PSBtaW4sICd2YWx1ZSBzbWFsbGVyIHRoYW4gbWluaW11bSBhbGxvd2VkIHZhbHVlJylcbn1cblxuZnVuY3Rpb24gYXNzZXJ0ICh0ZXN0LCBtZXNzYWdlKSB7XG4gIGlmICghdGVzdCkgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UgfHwgJ0ZhaWxlZCBhc3NlcnRpb24nKVxufVxuIiwidmFyIGxvb2t1cCA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJztcblxuOyhmdW5jdGlvbiAoZXhwb3J0cykge1xuXHQndXNlIHN0cmljdCc7XG5cbiAgdmFyIEFyciA9ICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgPyBVaW50OEFycmF5XG4gICAgOiBBcnJheVxuXG5cdHZhciBQTFVTICAgPSAnKycuY2hhckNvZGVBdCgwKVxuXHR2YXIgU0xBU0ggID0gJy8nLmNoYXJDb2RlQXQoMClcblx0dmFyIE5VTUJFUiA9ICcwJy5jaGFyQ29kZUF0KDApXG5cdHZhciBMT1dFUiAgPSAnYScuY2hhckNvZGVBdCgwKVxuXHR2YXIgVVBQRVIgID0gJ0EnLmNoYXJDb2RlQXQoMClcblxuXHRmdW5jdGlvbiBkZWNvZGUgKGVsdCkge1xuXHRcdHZhciBjb2RlID0gZWx0LmNoYXJDb2RlQXQoMClcblx0XHRpZiAoY29kZSA9PT0gUExVUylcblx0XHRcdHJldHVybiA2MiAvLyAnKydcblx0XHRpZiAoY29kZSA9PT0gU0xBU0gpXG5cdFx0XHRyZXR1cm4gNjMgLy8gJy8nXG5cdFx0aWYgKGNvZGUgPCBOVU1CRVIpXG5cdFx0XHRyZXR1cm4gLTEgLy9ubyBtYXRjaFxuXHRcdGlmIChjb2RlIDwgTlVNQkVSICsgMTApXG5cdFx0XHRyZXR1cm4gY29kZSAtIE5VTUJFUiArIDI2ICsgMjZcblx0XHRpZiAoY29kZSA8IFVQUEVSICsgMjYpXG5cdFx0XHRyZXR1cm4gY29kZSAtIFVQUEVSXG5cdFx0aWYgKGNvZGUgPCBMT1dFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBMT1dFUiArIDI2XG5cdH1cblxuXHRmdW5jdGlvbiBiNjRUb0J5dGVBcnJheSAoYjY0KSB7XG5cdFx0dmFyIGksIGosIGwsIHRtcCwgcGxhY2VIb2xkZXJzLCBhcnJcblxuXHRcdGlmIChiNjQubGVuZ3RoICUgNCA+IDApIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdHJpbmcuIExlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNCcpXG5cdFx0fVxuXG5cdFx0Ly8gdGhlIG51bWJlciBvZiBlcXVhbCBzaWducyAocGxhY2UgaG9sZGVycylcblx0XHQvLyBpZiB0aGVyZSBhcmUgdHdvIHBsYWNlaG9sZGVycywgdGhhbiB0aGUgdHdvIGNoYXJhY3RlcnMgYmVmb3JlIGl0XG5cdFx0Ly8gcmVwcmVzZW50IG9uZSBieXRlXG5cdFx0Ly8gaWYgdGhlcmUgaXMgb25seSBvbmUsIHRoZW4gdGhlIHRocmVlIGNoYXJhY3RlcnMgYmVmb3JlIGl0IHJlcHJlc2VudCAyIGJ5dGVzXG5cdFx0Ly8gdGhpcyBpcyBqdXN0IGEgY2hlYXAgaGFjayB0byBub3QgZG8gaW5kZXhPZiB0d2ljZVxuXHRcdHZhciBsZW4gPSBiNjQubGVuZ3RoXG5cdFx0cGxhY2VIb2xkZXJzID0gJz0nID09PSBiNjQuY2hhckF0KGxlbiAtIDIpID8gMiA6ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAxKSA/IDEgOiAwXG5cblx0XHQvLyBiYXNlNjQgaXMgNC8zICsgdXAgdG8gdHdvIGNoYXJhY3RlcnMgb2YgdGhlIG9yaWdpbmFsIGRhdGFcblx0XHRhcnIgPSBuZXcgQXJyKGI2NC5sZW5ndGggKiAzIC8gNCAtIHBsYWNlSG9sZGVycylcblxuXHRcdC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcblx0XHRsID0gcGxhY2VIb2xkZXJzID4gMCA/IGI2NC5sZW5ndGggLSA0IDogYjY0Lmxlbmd0aFxuXG5cdFx0dmFyIEwgPSAwXG5cblx0XHRmdW5jdGlvbiBwdXNoICh2KSB7XG5cdFx0XHRhcnJbTCsrXSA9IHZcblx0XHR9XG5cblx0XHRmb3IgKGkgPSAwLCBqID0gMDsgaSA8IGw7IGkgKz0gNCwgaiArPSAzKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDE4KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpIDw8IDEyKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpIDw8IDYpIHwgZGVjb2RlKGI2NC5jaGFyQXQoaSArIDMpKVxuXHRcdFx0cHVzaCgodG1wICYgMHhGRjAwMDApID4+IDE2KVxuXHRcdFx0cHVzaCgodG1wICYgMHhGRjAwKSA+PiA4KVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdGlmIChwbGFjZUhvbGRlcnMgPT09IDIpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA+PiA0KVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH0gZWxzZSBpZiAocGxhY2VIb2xkZXJzID09PSAxKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDEwKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpIDw8IDQpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPj4gMilcblx0XHRcdHB1c2goKHRtcCA+PiA4KSAmIDB4RkYpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGFyclxuXHR9XG5cblx0ZnVuY3Rpb24gdWludDhUb0Jhc2U2NCAodWludDgpIHtcblx0XHR2YXIgaSxcblx0XHRcdGV4dHJhQnl0ZXMgPSB1aW50OC5sZW5ndGggJSAzLCAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuXHRcdFx0b3V0cHV0ID0gXCJcIixcblx0XHRcdHRlbXAsIGxlbmd0aFxuXG5cdFx0ZnVuY3Rpb24gZW5jb2RlIChudW0pIHtcblx0XHRcdHJldHVybiBsb29rdXAuY2hhckF0KG51bSlcblx0XHR9XG5cblx0XHRmdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQgKG51bSkge1xuXHRcdFx0cmV0dXJuIGVuY29kZShudW0gPj4gMTggJiAweDNGKSArIGVuY29kZShudW0gPj4gMTIgJiAweDNGKSArIGVuY29kZShudW0gPj4gNiAmIDB4M0YpICsgZW5jb2RlKG51bSAmIDB4M0YpXG5cdFx0fVxuXG5cdFx0Ly8gZ28gdGhyb3VnaCB0aGUgYXJyYXkgZXZlcnkgdGhyZWUgYnl0ZXMsIHdlJ2xsIGRlYWwgd2l0aCB0cmFpbGluZyBzdHVmZiBsYXRlclxuXHRcdGZvciAoaSA9IDAsIGxlbmd0aCA9IHVpbnQ4Lmxlbmd0aCAtIGV4dHJhQnl0ZXM7IGkgPCBsZW5ndGg7IGkgKz0gMykge1xuXHRcdFx0dGVtcCA9ICh1aW50OFtpXSA8PCAxNikgKyAodWludDhbaSArIDFdIDw8IDgpICsgKHVpbnQ4W2kgKyAyXSlcblx0XHRcdG91dHB1dCArPSB0cmlwbGV0VG9CYXNlNjQodGVtcClcblx0XHR9XG5cblx0XHQvLyBwYWQgdGhlIGVuZCB3aXRoIHplcm9zLCBidXQgbWFrZSBzdXJlIHRvIG5vdCBmb3JnZXQgdGhlIGV4dHJhIGJ5dGVzXG5cdFx0c3dpdGNoIChleHRyYUJ5dGVzKSB7XG5cdFx0XHRjYXNlIDE6XG5cdFx0XHRcdHRlbXAgPSB1aW50OFt1aW50OC5sZW5ndGggLSAxXVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMilcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA8PCA0KSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSAnPT0nXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHRjYXNlIDI6XG5cdFx0XHRcdHRlbXAgPSAodWludDhbdWludDgubGVuZ3RoIC0gMl0gPDwgOCkgKyAodWludDhbdWludDgubGVuZ3RoIC0gMV0pXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUodGVtcCA+PiAxMClcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA+PiA0KSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgMikgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz0nXG5cdFx0XHRcdGJyZWFrXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG91dHB1dFxuXHR9XG5cblx0ZXhwb3J0cy50b0J5dGVBcnJheSA9IGI2NFRvQnl0ZUFycmF5XG5cdGV4cG9ydHMuZnJvbUJ5dGVBcnJheSA9IHVpbnQ4VG9CYXNlNjRcbn0odHlwZW9mIGV4cG9ydHMgPT09ICd1bmRlZmluZWQnID8gKHRoaXMuYmFzZTY0anMgPSB7fSkgOiBleHBvcnRzKSlcbiIsImV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uKGJ1ZmZlciwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sXG4gICAgICBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxLFxuICAgICAgZU1heCA9ICgxIDw8IGVMZW4pIC0gMSxcbiAgICAgIGVCaWFzID0gZU1heCA+PiAxLFxuICAgICAgbkJpdHMgPSAtNyxcbiAgICAgIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMCxcbiAgICAgIGQgPSBpc0xFID8gLTEgOiAxLFxuICAgICAgcyA9IGJ1ZmZlcltvZmZzZXQgKyBpXTtcblxuICBpICs9IGQ7XG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSk7XG4gIHMgPj49ICgtbkJpdHMpO1xuICBuQml0cyArPSBlTGVuO1xuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gZSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KTtcblxuICBtID0gZSAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKTtcbiAgZSA+Pj0gKC1uQml0cyk7XG4gIG5CaXRzICs9IG1MZW47XG4gIGZvciAoOyBuQml0cyA+IDA7IG0gPSBtICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpO1xuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhcztcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpO1xuICB9IGVsc2Uge1xuICAgIG0gPSBtICsgTWF0aC5wb3coMiwgbUxlbik7XG4gICAgZSA9IGUgLSBlQmlhcztcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKTtcbn07XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbihidWZmZXIsIHZhbHVlLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSwgYyxcbiAgICAgIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDEsXG4gICAgICBlTWF4ID0gKDEgPDwgZUxlbikgLSAxLFxuICAgICAgZUJpYXMgPSBlTWF4ID4+IDEsXG4gICAgICBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMCksXG4gICAgICBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSksXG4gICAgICBkID0gaXNMRSA/IDEgOiAtMSxcbiAgICAgIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDA7XG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSk7XG5cbiAgaWYgKGlzTmFOKHZhbHVlKSB8fCB2YWx1ZSA9PT0gSW5maW5pdHkpIHtcbiAgICBtID0gaXNOYU4odmFsdWUpID8gMSA6IDA7XG4gICAgZSA9IGVNYXg7XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpO1xuICAgIGlmICh2YWx1ZSAqIChjID0gTWF0aC5wb3coMiwgLWUpKSA8IDEpIHtcbiAgICAgIGUtLTtcbiAgICAgIGMgKj0gMjtcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlICs9IHJ0ICogTWF0aC5wb3coMiwgMSAtIGVCaWFzKTtcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKys7XG4gICAgICBjIC89IDI7XG4gICAgfVxuXG4gICAgaWYgKGUgKyBlQmlhcyA+PSBlTWF4KSB7XG4gICAgICBtID0gMDtcbiAgICAgIGUgPSBlTWF4O1xuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAodmFsdWUgKiBjIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKTtcbiAgICAgIGUgPSBlICsgZUJpYXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKTtcbiAgICAgIGUgPSAwO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoOyBtTGVuID49IDg7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IG0gJiAweGZmLCBpICs9IGQsIG0gLz0gMjU2LCBtTGVuIC09IDgpO1xuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG07XG4gIGVMZW4gKz0gbUxlbjtcbiAgZm9yICg7IGVMZW4gPiAwOyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBlICYgMHhmZiwgaSArPSBkLCBlIC89IDI1NiwgZUxlbiAtPSA4KTtcblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjg7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMTogTXVsdGlwbGVzIG9mIDMgYW5kIDVcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuSWYgd2UgbGlzdCBhbGwgdGhlIG5hdHVyYWwgbnVtYmVycyBiZWxvdyAxMCB0aGF0IGFyZSBtdWx0aXBsZXMgb2YgMyBvciA1LCB3ZSBnZXQgMywgNSwgNiBhbmQgOS5cblRoZSBzdW0gb2YgdGhlc2UgbXVsdGlwbGVzIGlzIDIzLlxuXG5GaW5kIHRoZSBzdW0gb2YgYWxsIHRoZSBtdWx0aXBsZXMgb2YgMyBvciA1IGJlbG93IDEwMDAuXG5cblwiXCJcIlxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBzdW0gPSAwXG4gIGZvciBpIGluIFsxLi4uMTBdXG4gICAgaWYgKGkgJSAzID09IDApIG9yIChpICUgNSA9PSAwKVxuICAgICAgc3VtICs9IGlcbiAgZXF1YWwoc3VtLCAyMywgXCJTdW0gb2YgbmF0dXJhbCBudW1iZXJzIDwgMTA6ICN7c3VtfVwiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHN1bSA9IDBcbiAgZm9yIGkgaW4gWzEuLi4xMDAwXVxuICAgIGlmIChpICUgMyA9PSAwKSBvciAoaSAlIDUgPT0gMClcbiAgICAgIHN1bSArPSBpXG5cbiAgcmV0dXJuIHN1bVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMjogRXZlbiBGaWJvbmFjY2kgbnVtYmVyc1xuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbkVhY2ggbmV3IHRlcm0gaW4gdGhlIEZpYm9uYWNjaSBzZXF1ZW5jZSBpcyBnZW5lcmF0ZWQgYnkgYWRkaW5nIHRoZSBwcmV2aW91cyB0d28gdGVybXMuXG5CeSBzdGFydGluZyB3aXRoIDEgYW5kIDIsIHRoZSBmaXJzdCAxMCB0ZXJtcyB3aWxsIGJlOlxuXG4xLCAyLCAzLCA1LCA4LCAxMywgMjEsIDM0LCA1NSwgODksIC4uLlxuXG5CeSBjb25zaWRlcmluZyB0aGUgdGVybXMgaW4gdGhlIEZpYm9uYWNjaSBzZXF1ZW5jZSB3aG9zZSB2YWx1ZXMgZG8gbm90IGV4Y2VlZCBmb3VyIG1pbGxpb24sXG5maW5kIHRoZSBzdW0gb2YgdGhlIGV2ZW4tdmFsdWVkIHRlcm1zLlxuXG5cIlwiXCJcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICBwcmV2ID0gMVxuICBjdXJyID0gMVxuICBzdW0gPSAwXG5cbiAgd2hpbGUgY3VyciA8IDQwMDAwMDBcbiAgICBpZiAoY3VyciAlIDIpID09IDBcbiAgICAgIHN1bSArPSBjdXJyXG5cbiAgICBuZXh0ID0gY3VyciArIHByZXZcbiAgICBwcmV2ID0gY3VyclxuICAgIGN1cnIgPSBuZXh0XG5cbiAgcmV0dXJuIHN1bVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMzogTGFyZ2VzdCBwcmltZSBmYWN0b3Jcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuVGhlIHByaW1lIGZhY3RvcnMgb2YgMTMxOTUgYXJlIDUsIDcsIDEzIGFuZCAyOS5cblxuV2hhdCBpcyB0aGUgbGFyZ2VzdCBwcmltZSBmYWN0b3Igb2YgdGhlIG51bWJlciA2MDA4NTE0NzUxNDMgP1xuXG5cIlwiXCJcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBTaGFtZWxlc3NseSBwaWxmZXJlZC9hZG9wdGVkIGZyb20gaHR0cDovL3d3dy5qYXZhc2NyaXB0ZXIubmV0L2ZhcS9udW1iZXJpc3ByaW1lLmh0bVxuXG5sZWFzdEZhY3RvciA9IChuKSAtPlxuICByZXR1cm4gTmFOIGlmIGlzTmFOKG4pIG9yIG5vdCBpc0Zpbml0ZShuKVxuICByZXR1cm4gMCBpZiBuID09IDBcbiAgcmV0dXJuIDEgaWYgKG4gJSAxKSAhPSAwIG9yIChuICogbikgPCAyXG4gIHJldHVybiAyIGlmIChuICUgMikgPT0gMFxuICByZXR1cm4gMyBpZiAobiAlIDMpID09IDBcbiAgcmV0dXJuIDUgaWYgKG4gJSA1KSA9PSAwXG5cbiAgbSA9IE1hdGguc3FydCBuXG4gIGZvciBpIGluIFs3Li5tXSBieSAzMFxuICAgIHJldHVybiBpICAgIGlmIChuICUgaSkgICAgICA9PSAwXG4gICAgcmV0dXJuIGkrNCAgaWYgKG4gJSAoaSs0KSkgID09IDBcbiAgICByZXR1cm4gaSs2ICBpZiAobiAlIChpKzYpKSAgPT0gMFxuICAgIHJldHVybiBpKzEwIGlmIChuICUgKGkrMTApKSA9PSAwXG4gICAgcmV0dXJuIGkrMTIgaWYgKG4gJSAoaSsxMikpID09IDBcbiAgICByZXR1cm4gaSsxNiBpZiAobiAlIChpKzE2KSkgPT0gMFxuICAgIHJldHVybiBpKzIyIGlmIChuICUgKGkrMjIpKSA9PSAwXG4gICAgcmV0dXJuIGkrMjQgaWYgKG4gJSAoaSsyNCkpID09IDBcblxuICByZXR1cm4gblxuXG5pc1ByaW1lID0gKG4pIC0+XG4gIGlmIGlzTmFOKG4pIG9yIG5vdCBpc0Zpbml0ZShuKSBvciAobiAlIDEpICE9IDAgb3IgKG4gPCAyKVxuICAgIHJldHVybiBmYWxzZVxuICBpZiBuID09IGxlYXN0RmFjdG9yKG4pXG4gICAgcmV0dXJuIHRydWVcblxuICByZXR1cm4gZmFsc2VcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5wcmltZUZhY3RvcnMgPSAobikgLT5cbiAgcmV0dXJuIFsxXSBpZiBuID09IDFcblxuICBmYWN0b3JzID0gW11cbiAgd2hpbGUgbm90IGlzUHJpbWUobilcbiAgICBmYWN0b3IgPSBsZWFzdEZhY3RvcihuKVxuICAgIGZhY3RvcnMucHVzaCBmYWN0b3JcbiAgICBuIC89IGZhY3RvclxuICBmYWN0b3JzLnB1c2ggblxuICByZXR1cm4gZmFjdG9yc1xuXG5sYXJnZXN0UHJpbWVGYWN0b3IgPSAobikgLT5cbiAgcmV0dXJuIDEgaWYgbiA9PSAxXG5cbiAgd2hpbGUgbm90IGlzUHJpbWUobilcbiAgICBmYWN0b3IgPSBsZWFzdEZhY3RvcihuKVxuICAgIG4gLz0gZmFjdG9yXG4gIHJldHVybiBuXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgcmV0dXJuIGxhcmdlc3RQcmltZUZhY3Rvcig2MDA4NTE0NzUxNDMpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSA0OiBMYXJnZXN0IHBhbGluZHJvbWUgcHJvZHVjdFxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5BIHBhbGluZHJvbWljIG51bWJlciByZWFkcyB0aGUgc2FtZSBib3RoIHdheXMuXG5cbkZpbmQgdGhlIGxhcmdlc3QgcGFsaW5kcm9tZSBtYWRlIGZyb20gdGhlIHByb2R1Y3Qgb2YgdHdvIDMtZGlnaXQgbnVtYmVycy5cblxuXCJcIlwiXG5cbmlzUGFsaW5kcm9tZSA9IChuKSAtPlxuICBzdHIgPSBuLnRvU3RyaW5nKClcbiAgZm9yIGkgaW4gWzAuLi4oc3RyLmxlbmd0aCAvIDIpXVxuICAgIGlmIHN0cltpXSAhPSBzdHJbc3RyLmxlbmd0aCAtIDEgLSBpXVxuICAgICAgcmV0dXJuIGZhbHNlXG4gIHJldHVybiB0cnVlXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gICMgTWFrZSBzdXJlIGlzUGFsaW5kcm9tZSB3b3JrcyBwcm9wZXJseSBmaXJzdFxuICBmb3IgdiBpbiBbMSwgMTEsIDEyMSwgMTIyMSwgMTIzMjEsIDEyMzQzMjFdXG4gICAgZXF1YWwoaXNQYWxpbmRyb21lKHYpLCB0cnVlLCBcImlzUGFsaW5kcm9tZSgje3Z9KSByZXR1cm5zIHRydWVcIilcbiAgZm9yIHYgaW4gWzEyLCAxMjMsIDEyMzQsIDEyMzQ1LCAxMjM0NTYsIDEyMzI0XVxuICAgIGVxdWFsKGlzUGFsaW5kcm9tZSh2KSwgZmFsc2UsIFwiaXNQYWxpbmRyb21lKCN7dn0pIHJldHVybnMgZmFsc2VcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICBsYXJnZXN0aSA9IDBcbiAgbGFyZ2VzdGogPSAwXG4gIGxhcmdlc3RwID0gMFxuXG4gIGZvciBpIGluIFsxMDAuLjk5OV1cbiAgICBmb3IgaiBpbiBbMTAwLi45OTldXG4gICAgICBwcm9kdWN0ID0gaSAqIGpcbiAgICAgIGlmIGlzUGFsaW5kcm9tZShwcm9kdWN0KVxuICAgICAgICBsYXJnZXN0aSA9IGlcbiAgICAgICAgbGFyZ2VzdGogPSBqXG4gICAgICAgIGxhcmdlc3RwID0gcHJvZHVjdFxuXG4gIHJldHVybiBsYXJnZXN0cFxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gNTogU21hbGxlc3QgbXVsdGlwbGVcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuMjUyMCBpcyB0aGUgc21hbGxlc3QgbnVtYmVyIHRoYXQgY2FuIGJlIGRpdmlkZWQgYnkgZWFjaCBvZiB0aGUgbnVtYmVycyBmcm9tIDEgdG8gMTAgd2l0aG91dCBhbnkgcmVtYWluZGVyLlxuXG5XaGF0IGlzIHRoZSBzbWFsbGVzdCBwb3NpdGl2ZSBudW1iZXIgdGhhdCBpcyBldmVubHkgZGl2aXNpYmxlIGJ5IGFsbCBvZiB0aGUgbnVtYmVycyBmcm9tIDEgdG8gMjA/XG5cblwiXCJcIlxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIG4gPSAwXG4gIGxvb3BcbiAgICBuICs9IDIwICMgUHJvYmFibHkgY291bGQgYmUgc29tZSBjbGV2ZXIgc3VtIG9mIHByaW1lcyBiZXR3ZWVuIDEtMjAgb3Igc29tZXRoaW5nLiBJIGRvbid0IGNhcmUuXG4gICAgZm91bmQgPSB0cnVlXG4gICAgZm9yIGkgaW4gWzEuLjIwXVxuICAgICAgaWYgKG4gJSBpKSAhPSAwXG4gICAgICAgIGZvdW5kID0gZmFsc2VcbiAgICAgICAgYnJlYWtcblxuICAgIGJyZWFrIGlmIGZvdW5kXG5cbiAgcmV0dXJuIG5cbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDY6IFN1bSBzcXVhcmUgZGlmZmVyZW5jZVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuVGhlIHN1bSBvZiB0aGUgc3F1YXJlcyBvZiB0aGUgZmlyc3QgdGVuIG5hdHVyYWwgbnVtYmVycyBpcyxcblxuICAgICAgICAgICAgIDFeMiArIDJeMiArIC4uLiArIDEwXjIgPSAzODVcblxuVGhlIHNxdWFyZSBvZiB0aGUgc3VtIG9mIHRoZSBmaXJzdCB0ZW4gbmF0dXJhbCBudW1iZXJzIGlzLFxuXG4gICAgICAgICAgKDEgKyAyICsgLi4uICsgMTApXjIgPSA1NV4yID0gMzAyNVxuXG5IZW5jZSB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBzdW0gb2YgdGhlIHNxdWFyZXMgb2YgdGhlIGZpcnN0IHRlbiBuYXR1cmFsIG51bWJlcnMgYW5kIHRoZSBzcXVhcmUgb2YgdGhlIHN1bSBpcyAzMDI1IOKIkiAzODUgPSAyNjQwLlxuXG5GaW5kIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIHN1bSBvZiB0aGUgc3F1YXJlcyBvZiB0aGUgZmlyc3Qgb25lIGh1bmRyZWQgbmF0dXJhbCBudW1iZXJzIGFuZCB0aGUgc3F1YXJlIG9mIHRoZSBzdW0uXG5cblwiXCJcIlxuXG5zdW1PZlNxdWFyZXMgPSAobikgLT5cbiAgc3VtID0gMFxuICBmb3IgaSBpbiBbMS4ubl1cbiAgICBzdW0gKz0gKGkgKiBpKVxuICByZXR1cm4gc3VtXG5cbnNxdWFyZU9mU3VtID0gKG4pIC0+XG4gIHN1bSA9IDBcbiAgZm9yIGkgaW4gWzEuLm5dXG4gICAgc3VtICs9IGlcbiAgcmV0dXJuIChzdW0gKiBzdW0pXG5cbmRpZmZlcmVuY2VTdW1TcXVhcmVzID0gKG4pIC0+XG4gIHJldHVybiBzcXVhcmVPZlN1bShuKSAtIHN1bU9mU3F1YXJlcyhuKVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChzdW1PZlNxdWFyZXMoMTApLCAzODUsIFwiU3VtIG9mIHNxdWFyZXMgb2YgZmlyc3QgdGVuIG5hdHVyYWwgbnVtYmVycyBpcyAzODVcIilcbiAgZXF1YWwoc3F1YXJlT2ZTdW0oMTApLCAzMDI1LCBcIlNxdWFyZSBvZiBzdW0gb2YgZmlyc3QgdGVuIG5hdHVyYWwgbnVtYmVycyBpcyAzMDI1XCIpXG4gIGVxdWFsKGRpZmZlcmVuY2VTdW1TcXVhcmVzKDEwKSwgMjY0MCwgXCJEaWZmZXJlbmNlIGluIHZhbHVlcyBmb3IgdGhlIGZpcnN0IHRlbiBuYXR1cmFsIG51bWJlcnMgaXMgMjY0MFwiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHJldHVybiBkaWZmZXJlbmNlU3VtU3F1YXJlcygxMDApXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSA3OiAxMDAwMXN0IHByaW1lXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuQnkgbGlzdGluZyB0aGUgZmlyc3Qgc2l4IHByaW1lIG51bWJlcnM6IDIsIDMsIDUsIDcsIDExLCBhbmQgMTMsIHdlIGNhbiBzZWUgdGhhdCB0aGUgNnRoIHByaW1lIGlzIDEzLlxuXG5XaGF0IGlzIHRoZSAxMCwwMDFzdCBwcmltZSBudW1iZXI/XG5cblwiXCJcIlxuXG5tYXRoID0gcmVxdWlyZSBcIm1hdGhcIlxuXG5udGhQcmltZSA9IChuKSAtPlxuICBzaWV2ZSA9IG5ldyBtYXRoLkluY3JlbWVudGFsU2lldmVcbiAgZm9yIGkgaW4gWzEuLi5uXVxuICAgIHNpZXZlLm5leHQoKVxuICByZXR1cm4gc2lldmUubmV4dCgpXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGVxdWFsKG50aFByaW1lKDYpLCAxMywgXCI2dGggcHJpbWUgaXMgMTNcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICByZXR1cm4gbnRoUHJpbWUoMTAwMDEpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSA4OiBMYXJnZXN0IHByb2R1Y3QgaW4gYSBzZXJpZXNcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblRoZSBmb3VyIGFkamFjZW50IGRpZ2l0cyBpbiB0aGUgMTAwMC1kaWdpdCBudW1iZXIgdGhhdCBoYXZlIHRoZSBncmVhdGVzdCBwcm9kdWN0IGFyZSA5IHggOSB4IDggeCA5ID0gNTgzMi5cblxuICA3MzE2NzE3NjUzMTMzMDYyNDkxOTIyNTExOTY3NDQyNjU3NDc0MjM1NTM0OTE5NDkzNFxuICA5Njk4MzUyMDMxMjc3NDUwNjMyNjIzOTU3ODMxODAxNjk4NDgwMTg2OTQ3ODg1MTg0M1xuICA4NTg2MTU2MDc4OTExMjk0OTQ5NTQ1OTUwMTczNzk1ODMzMTk1Mjg1MzIwODgwNTUxMVxuICAxMjU0MDY5ODc0NzE1ODUyMzg2MzA1MDcxNTY5MzI5MDk2MzI5NTIyNzQ0MzA0MzU1N1xuICA2Njg5NjY0ODk1MDQ0NTI0NDUyMzE2MTczMTg1NjQwMzA5ODcxMTEyMTcyMjM4MzExM1xuICA2MjIyOTg5MzQyMzM4MDMwODEzNTMzNjI3NjYxNDI4MjgwNjQ0NDQ4NjY0NTIzODc0OVxuICAzMDM1ODkwNzI5NjI5MDQ5MTU2MDQ0MDc3MjM5MDcxMzgxMDUxNTg1OTMwNzk2MDg2NlxuICA3MDE3MjQyNzEyMTg4Mzk5ODc5NzkwODc5MjI3NDkyMTkwMTY5OTcyMDg4ODA5Mzc3NlxuICA2NTcyNzMzMzAwMTA1MzM2Nzg4MTIyMDIzNTQyMTgwOTc1MTI1NDU0MDU5NDc1MjI0M1xuICA1MjU4NDkwNzcxMTY3MDU1NjAxMzYwNDgzOTU4NjQ0NjcwNjMyNDQxNTcyMjE1NTM5N1xuICA1MzY5NzgxNzk3Nzg0NjE3NDA2NDk1NTE0OTI5MDg2MjU2OTMyMTk3ODQ2ODYyMjQ4MlxuICA4Mzk3MjI0MTM3NTY1NzA1NjA1NzQ5MDI2MTQwNzk3Mjk2ODY1MjQxNDUzNTEwMDQ3NFxuICA4MjE2NjM3MDQ4NDQwMzE5OTg5MDAwODg5NTI0MzQ1MDY1ODU0MTIyNzU4ODY2Njg4MVxuICAxNjQyNzE3MTQ3OTkyNDQ0MjkyODIzMDg2MzQ2NTY3NDgxMzkxOTEyMzE2MjgyNDU4NlxuICAxNzg2NjQ1ODM1OTEyNDU2NjUyOTQ3NjU0NTY4Mjg0ODkxMjg4MzE0MjYwNzY5MDA0MlxuICAyNDIxOTAyMjY3MTA1NTYyNjMyMTExMTEwOTM3MDU0NDIxNzUwNjk0MTY1ODk2MDQwOFxuICAwNzE5ODQwMzg1MDk2MjQ1NTQ0NDM2Mjk4MTIzMDk4Nzg3OTkyNzI0NDI4NDkwOTE4OFxuICA4NDU4MDE1NjE2NjA5NzkxOTEzMzg3NTQ5OTIwMDUyNDA2MzY4OTkxMjU2MDcxNzYwNlxuICAwNTg4NjExNjQ2NzEwOTQwNTA3NzU0MTAwMjI1Njk4MzE1NTIwMDA1NTkzNTcyOTcyNVxuICA3MTYzNjI2OTU2MTg4MjY3MDQyODI1MjQ4MzYwMDgyMzI1NzUzMDQyMDc1Mjk2MzQ1MFxuXG5GaW5kIHRoZSB0aGlydGVlbiBhZGphY2VudCBkaWdpdHMgaW4gdGhlIDEwMDAtZGlnaXQgbnVtYmVyIHRoYXQgaGF2ZSB0aGUgZ3JlYXRlc3QgcHJvZHVjdC4gV2hhdCBpcyB0aGUgdmFsdWUgb2YgdGhpcyBwcm9kdWN0P1xuXG5cIlwiXCJcblxuc3RyID0gXCJcIlwiXG4gICAgICA3MzE2NzE3NjUzMTMzMDYyNDkxOTIyNTExOTY3NDQyNjU3NDc0MjM1NTM0OTE5NDkzNFxuICAgICAgOTY5ODM1MjAzMTI3NzQ1MDYzMjYyMzk1NzgzMTgwMTY5ODQ4MDE4Njk0Nzg4NTE4NDNcbiAgICAgIDg1ODYxNTYwNzg5MTEyOTQ5NDk1NDU5NTAxNzM3OTU4MzMxOTUyODUzMjA4ODA1NTExXG4gICAgICAxMjU0MDY5ODc0NzE1ODUyMzg2MzA1MDcxNTY5MzI5MDk2MzI5NTIyNzQ0MzA0MzU1N1xuICAgICAgNjY4OTY2NDg5NTA0NDUyNDQ1MjMxNjE3MzE4NTY0MDMwOTg3MTExMjE3MjIzODMxMTNcbiAgICAgIDYyMjI5ODkzNDIzMzgwMzA4MTM1MzM2Mjc2NjE0MjgyODA2NDQ0NDg2NjQ1MjM4NzQ5XG4gICAgICAzMDM1ODkwNzI5NjI5MDQ5MTU2MDQ0MDc3MjM5MDcxMzgxMDUxNTg1OTMwNzk2MDg2NlxuICAgICAgNzAxNzI0MjcxMjE4ODM5OTg3OTc5MDg3OTIyNzQ5MjE5MDE2OTk3MjA4ODgwOTM3NzZcbiAgICAgIDY1NzI3MzMzMDAxMDUzMzY3ODgxMjIwMjM1NDIxODA5NzUxMjU0NTQwNTk0NzUyMjQzXG4gICAgICA1MjU4NDkwNzcxMTY3MDU1NjAxMzYwNDgzOTU4NjQ0NjcwNjMyNDQxNTcyMjE1NTM5N1xuICAgICAgNTM2OTc4MTc5Nzc4NDYxNzQwNjQ5NTUxNDkyOTA4NjI1NjkzMjE5Nzg0Njg2MjI0ODJcbiAgICAgIDgzOTcyMjQxMzc1NjU3MDU2MDU3NDkwMjYxNDA3OTcyOTY4NjUyNDE0NTM1MTAwNDc0XG4gICAgICA4MjE2NjM3MDQ4NDQwMzE5OTg5MDAwODg5NTI0MzQ1MDY1ODU0MTIyNzU4ODY2Njg4MVxuICAgICAgMTY0MjcxNzE0Nzk5MjQ0NDI5MjgyMzA4NjM0NjU2NzQ4MTM5MTkxMjMxNjI4MjQ1ODZcbiAgICAgIDE3ODY2NDU4MzU5MTI0NTY2NTI5NDc2NTQ1NjgyODQ4OTEyODgzMTQyNjA3NjkwMDQyXG4gICAgICAyNDIxOTAyMjY3MTA1NTYyNjMyMTExMTEwOTM3MDU0NDIxNzUwNjk0MTY1ODk2MDQwOFxuICAgICAgMDcxOTg0MDM4NTA5NjI0NTU0NDQzNjI5ODEyMzA5ODc4Nzk5MjcyNDQyODQ5MDkxODhcbiAgICAgIDg0NTgwMTU2MTY2MDk3OTE5MTMzODc1NDk5MjAwNTI0MDYzNjg5OTEyNTYwNzE3NjA2XG4gICAgICAwNTg4NjExNjQ2NzEwOTQwNTA3NzU0MTAwMjI1Njk4MzE1NTIwMDA1NTkzNTcyOTcyNVxuICAgICAgNzE2MzYyNjk1NjE4ODI2NzA0MjgyNTI0ODM2MDA4MjMyNTc1MzA0MjA3NTI5NjM0NTBcbiAgICAgIFwiXCJcIlxuc3RyID0gc3RyLnJlcGxhY2UoL1teMC05XS9nbSwgXCJcIilcbmRpZ2l0cyA9IChwYXJzZUludChkaWdpdCkgZm9yIGRpZ2l0IGluIHN0cilcblxubGFyZ2VzdFByb2R1Y3QgPSAoZGlnaXRDb3VudCkgLT5cbiAgcmV0dXJuIDAgaWYgZGlnaXRDb3VudCA+IGRpZ2l0cy5sZW5ndGhcblxuICBsYXJnZXN0ID0gMFxuICBmb3Igc3RhcnQgaW4gWzAuLihkaWdpdHMubGVuZ3RoIC0gZGlnaXRDb3VudCldXG4gICAgZW5kID0gc3RhcnQgKyBkaWdpdENvdW50XG4gICAgcHJvZHVjdCA9IDFcbiAgICBmb3IgaSBpbiBbc3RhcnQuLi5lbmRdXG4gICAgICBwcm9kdWN0ICo9IGRpZ2l0c1tpXVxuICAgIGlmIGxhcmdlc3QgPCBwcm9kdWN0XG4gICAgICBsYXJnZXN0ID0gcHJvZHVjdFxuXG4gIHJldHVybiBsYXJnZXN0XG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGVxdWFsKGxhcmdlc3RQcm9kdWN0KDQpLCA1ODMyLCAgXCJHcmVhdGVzdCBwcm9kdWN0IG9mIDQgYWRqYWNlbnQgZGlnaXRzIGlzIDU4MzJcIilcbiAgZXF1YWwobGFyZ2VzdFByb2R1Y3QoNSksIDQwODI0LCBcIkdyZWF0ZXN0IHByb2R1Y3Qgb2YgNSBhZGphY2VudCBkaWdpdHMgaXMgNDA4MjRcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICByZXR1cm4gbGFyZ2VzdFByb2R1Y3QoMTMpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSA5OiBTcGVjaWFsIFB5dGhhZ29yZWFuIHRyaXBsZXRcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbkEgUHl0aGFnb3JlYW4gdHJpcGxldCBpcyBhIHNldCBvZiB0aHJlZSBuYXR1cmFsIG51bWJlcnMsIGEgPCBiIDwgYywgZm9yIHdoaWNoLFxuXG4gICAgYV4yICsgYl4yID0gY14yXG5cbkZvciBleGFtcGxlLCAzXjIgKyA0XjIgPSA5ICsgMTYgPSAyNSA9IDVeMi5cblxuVGhlcmUgZXhpc3RzIGV4YWN0bHkgb25lIFB5dGhhZ29yZWFuIHRyaXBsZXQgZm9yIHdoaWNoIGEgKyBiICsgYyA9IDEwMDAuXG5cbkZpbmQgdGhlIHByb2R1Y3QgYWJjLlxuXG5cIlwiXCJcblxuaXNUcmlwbGV0ID0gKGEsIGIsIGMpIC0+XG4gIHJldHVybiAoKGEqYSkgKyAoYipiKSkgPT0gKGMqYylcblxuZmluZEZpcnN0VHJpcGxldCA9IChzdW0pIC0+XG4gIGZvciBhIGluIFsxLi4uMTAwMF1cbiAgICBmb3IgYiBpbiBbMS4uLjEwMDBdXG4gICAgICBjID0gMTAwMCAtIGEgLSBiXG4gICAgICBpZiBpc1RyaXBsZXQoYSwgYiwgYylcbiAgICAgICAgcmV0dXJuIFthLCBiLCBjXVxuXG4gIHJldHVybiBmYWxzZVxuXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGVxdWFsKGlzVHJpcGxldCgzLCA0LCA1KSwgdHJ1ZSwgXCIoMyw0LDUpIGlzIGEgUHl0aGFnb3JlYW4gdHJpcGxldFwiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHJldHVybiBmaW5kRmlyc3RUcmlwbGV0KDEwMDApXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAxMDogU3VtbWF0aW9uIG9mIHByaW1lc1xuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5UaGUgc3VtIG9mIHRoZSBwcmltZXMgYmVsb3cgMTAgaXMgMiArIDMgKyA1ICsgNyA9IDE3LlxuXG5GaW5kIHRoZSBzdW0gb2YgYWxsIHRoZSBwcmltZXMgYmVsb3cgdHdvIG1pbGxpb24uXG5cblwiXCJcIlxuXG5tYXRoID0gcmVxdWlyZSBcIm1hdGhcIlxuXG5wcmltZVN1bSA9IChjZWlsaW5nKSAtPlxuICBzaWV2ZSA9IG5ldyBtYXRoLkluY3JlbWVudGFsU2lldmVcblxuICBzdW0gPSAwXG4gIGxvb3BcbiAgICBuID0gc2lldmUubmV4dCgpXG4gICAgaWYgbiA+PSBjZWlsaW5nXG4gICAgICBicmVha1xuICAgIHN1bSArPSBuXG5cbiAgcmV0dXJuIHN1bVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChwcmltZVN1bSgxMCksIDE3LCBcIlN1bSBvZiBwcmltZXMgYmVsb3cgMTAgaXMgMTdcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICByZXR1cm4gcHJpbWVTdW0oMjAwMDAwMClcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDExOiBMYXJnZXN0IHByb2R1Y3QgaW4gYSBncmlkXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbkluIHRoZSAyMHgyMCBncmlkIGJlbG93LCBmb3VyIG51bWJlcnMgYWxvbmcgYSBkaWFnb25hbCBsaW5lIGhhdmUgYmVlbiBtYXJrZWQgaW4gcmVkLlxuXG4gICAgICAgICAgMDggMDIgMjIgOTcgMzggMTUgMDAgNDAgMDAgNzUgMDQgMDUgMDcgNzggNTIgMTIgNTAgNzcgOTEgMDhcbiAgICAgICAgICA0OSA0OSA5OSA0MCAxNyA4MSAxOCA1NyA2MCA4NyAxNyA0MCA5OCA0MyA2OSA0OCAwNCA1NiA2MiAwMFxuICAgICAgICAgIDgxIDQ5IDMxIDczIDU1IDc5IDE0IDI5IDkzIDcxIDQwIDY3IDUzIDg4IDMwIDAzIDQ5IDEzIDM2IDY1XG4gICAgICAgICAgNTIgNzAgOTUgMjMgMDQgNjAgMTEgNDIgNjkgMjQgNjggNTYgMDEgMzIgNTYgNzEgMzcgMDIgMzYgOTFcbiAgICAgICAgICAyMiAzMSAxNiA3MSA1MSA2NyA2MyA4OSA0MSA5MiAzNiA1NCAyMiA0MCA0MCAyOCA2NiAzMyAxMyA4MFxuICAgICAgICAgIDI0IDQ3IDMyIDYwIDk5IDAzIDQ1IDAyIDQ0IDc1IDMzIDUzIDc4IDM2IDg0IDIwIDM1IDE3IDEyIDUwXG4gICAgICAgICAgMzIgOTggODEgMjggNjQgMjMgNjcgMTAgMjZfMzggNDAgNjcgNTkgNTQgNzAgNjYgMTggMzggNjQgNzBcbiAgICAgICAgICA2NyAyNiAyMCA2OCAwMiA2MiAxMiAyMCA5NSA2M185NCAzOSA2MyAwOCA0MCA5MSA2NiA0OSA5NCAyMVxuICAgICAgICAgIDI0IDU1IDU4IDA1IDY2IDczIDk5IDI2IDk3IDE3IDc4Xzc4IDk2IDgzIDE0IDg4IDM0IDg5IDYzIDcyXG4gICAgICAgICAgMjEgMzYgMjMgMDkgNzUgMDAgNzYgNDQgMjAgNDUgMzUgMTQgMDAgNjEgMzMgOTcgMzQgMzEgMzMgOTVcbiAgICAgICAgICA3OCAxNyA1MyAyOCAyMiA3NSAzMSA2NyAxNSA5NCAwMyA4MCAwNCA2MiAxNiAxNCAwOSA1MyA1NiA5MlxuICAgICAgICAgIDE2IDM5IDA1IDQyIDk2IDM1IDMxIDQ3IDU1IDU4IDg4IDI0IDAwIDE3IDU0IDI0IDM2IDI5IDg1IDU3XG4gICAgICAgICAgODYgNTYgMDAgNDggMzUgNzEgODkgMDcgMDUgNDQgNDQgMzcgNDQgNjAgMjEgNTggNTEgNTQgMTcgNThcbiAgICAgICAgICAxOSA4MCA4MSA2OCAwNSA5NCA0NyA2OSAyOCA3MyA5MiAxMyA4NiA1MiAxNyA3NyAwNCA4OSA1NSA0MFxuICAgICAgICAgIDA0IDUyIDA4IDgzIDk3IDM1IDk5IDE2IDA3IDk3IDU3IDMyIDE2IDI2IDI2IDc5IDMzIDI3IDk4IDY2XG4gICAgICAgICAgODggMzYgNjggODcgNTcgNjIgMjAgNzIgMDMgNDYgMzMgNjcgNDYgNTUgMTIgMzIgNjMgOTMgNTMgNjlcbiAgICAgICAgICAwNCA0MiAxNiA3MyAzOCAyNSAzOSAxMSAyNCA5NCA3MiAxOCAwOCA0NiAyOSAzMiA0MCA2MiA3NiAzNlxuICAgICAgICAgIDIwIDY5IDM2IDQxIDcyIDMwIDIzIDg4IDM0IDYyIDk5IDY5IDgyIDY3IDU5IDg1IDc0IDA0IDM2IDE2XG4gICAgICAgICAgMjAgNzMgMzUgMjkgNzggMzEgOTAgMDEgNzQgMzEgNDkgNzEgNDggODYgODEgMTYgMjMgNTcgMDUgNTRcbiAgICAgICAgICAwMSA3MCA1NCA3MSA4MyA1MSA1NCA2OSAxNiA5MiAzMyA0OCA2MSA0MyA1MiAwMSA4OSAxOSA2NyA0OFxuXG5UaGUgcHJvZHVjdCBvZiB0aGVzZSBudW1iZXJzIGlzIDI2IHggNjMgeCA3OCB4IDE0ID0gMTc4ODY5Ni5cblxuV2hhdCBpcyB0aGUgZ3JlYXRlc3QgcHJvZHVjdCBvZiBmb3VyIGFkamFjZW50IG51bWJlcnMgaW4gdGhlIHNhbWUgZGlyZWN0aW9uICh1cCwgZG93biwgbGVmdCwgcmlnaHQsIG9yIGRpYWdvbmFsbHkpIGluIHRoZSAyMHgyMCBncmlkP1xuXG5cIlwiXCJcblxuZ3JpZCA9IG51bGxcblxucHJlcGFyZUdyaWQgPSAtPlxuICByYXdEaWdpdHMgPSBcIlwiXCJcbiAgICAwOCAwMiAyMiA5NyAzOCAxNSAwMCA0MCAwMCA3NSAwNCAwNSAwNyA3OCA1MiAxMiA1MCA3NyA5MSAwOFxuICAgIDQ5IDQ5IDk5IDQwIDE3IDgxIDE4IDU3IDYwIDg3IDE3IDQwIDk4IDQzIDY5IDQ4IDA0IDU2IDYyIDAwXG4gICAgODEgNDkgMzEgNzMgNTUgNzkgMTQgMjkgOTMgNzEgNDAgNjcgNTMgODggMzAgMDMgNDkgMTMgMzYgNjVcbiAgICA1MiA3MCA5NSAyMyAwNCA2MCAxMSA0MiA2OSAyNCA2OCA1NiAwMSAzMiA1NiA3MSAzNyAwMiAzNiA5MVxuICAgIDIyIDMxIDE2IDcxIDUxIDY3IDYzIDg5IDQxIDkyIDM2IDU0IDIyIDQwIDQwIDI4IDY2IDMzIDEzIDgwXG4gICAgMjQgNDcgMzIgNjAgOTkgMDMgNDUgMDIgNDQgNzUgMzMgNTMgNzggMzYgODQgMjAgMzUgMTcgMTIgNTBcbiAgICAzMiA5OCA4MSAyOCA2NCAyMyA2NyAxMCAyNiAzOCA0MCA2NyA1OSA1NCA3MCA2NiAxOCAzOCA2NCA3MFxuICAgIDY3IDI2IDIwIDY4IDAyIDYyIDEyIDIwIDk1IDYzIDk0IDM5IDYzIDA4IDQwIDkxIDY2IDQ5IDk0IDIxXG4gICAgMjQgNTUgNTggMDUgNjYgNzMgOTkgMjYgOTcgMTcgNzggNzggOTYgODMgMTQgODggMzQgODkgNjMgNzJcbiAgICAyMSAzNiAyMyAwOSA3NSAwMCA3NiA0NCAyMCA0NSAzNSAxNCAwMCA2MSAzMyA5NyAzNCAzMSAzMyA5NVxuICAgIDc4IDE3IDUzIDI4IDIyIDc1IDMxIDY3IDE1IDk0IDAzIDgwIDA0IDYyIDE2IDE0IDA5IDUzIDU2IDkyXG4gICAgMTYgMzkgMDUgNDIgOTYgMzUgMzEgNDcgNTUgNTggODggMjQgMDAgMTcgNTQgMjQgMzYgMjkgODUgNTdcbiAgICA4NiA1NiAwMCA0OCAzNSA3MSA4OSAwNyAwNSA0NCA0NCAzNyA0NCA2MCAyMSA1OCA1MSA1NCAxNyA1OFxuICAgIDE5IDgwIDgxIDY4IDA1IDk0IDQ3IDY5IDI4IDczIDkyIDEzIDg2IDUyIDE3IDc3IDA0IDg5IDU1IDQwXG4gICAgMDQgNTIgMDggODMgOTcgMzUgOTkgMTYgMDcgOTcgNTcgMzIgMTYgMjYgMjYgNzkgMzMgMjcgOTggNjZcbiAgICA4OCAzNiA2OCA4NyA1NyA2MiAyMCA3MiAwMyA0NiAzMyA2NyA0NiA1NSAxMiAzMiA2MyA5MyA1MyA2OVxuICAgIDA0IDQyIDE2IDczIDM4IDI1IDM5IDExIDI0IDk0IDcyIDE4IDA4IDQ2IDI5IDMyIDQwIDYyIDc2IDM2XG4gICAgMjAgNjkgMzYgNDEgNzIgMzAgMjMgODggMzQgNjIgOTkgNjkgODIgNjcgNTkgODUgNzQgMDQgMzYgMTZcbiAgICAyMCA3MyAzNSAyOSA3OCAzMSA5MCAwMSA3NCAzMSA0OSA3MSA0OCA4NiA4MSAxNiAyMyA1NyAwNSA1NFxuICAgIDAxIDcwIDU0IDcxIDgzIDUxIDU0IDY5IDE2IDkyIDMzIDQ4IDYxIDQzIDUyIDAxIDg5IDE5IDY3IDQ4XG4gIFwiXCJcIi5yZXBsYWNlKC9bXjAtOSBdL2dtLCBcIiBcIilcblxuICBkaWdpdHMgPSAocGFyc2VJbnQoZGlnaXQpIGZvciBkaWdpdCBpbiByYXdEaWdpdHMuc3BsaXQoXCIgXCIpKVxuICBncmlkID0gQXJyYXkoMjApXG4gIGZvciBpIGluIFswLi4uMjBdXG4gICAgZ3JpZFtpXSA9IEFycmF5KDIwKVxuXG4gIGluZGV4ID0gMFxuICBmb3IgaiBpbiBbMC4uLjIwXVxuICAgIGZvciBpIGluIFswLi4uMjBdXG4gICAgICBncmlkW2ldW2pdID0gZGlnaXRzW2luZGV4XVxuICAgICAgaW5kZXgrK1xuXG5wcmVwYXJlR3JpZCgpXG5cbiMgR2V0cyBhIHByb2R1Y3Qgb2YgNCB2YWx1ZXMgc3RhcnRpbmcgYXQgKHN4LCBzeSksIGhlYWRpbmcgaW4gdGhlIGRpcmVjdGlvbiAoZHgsIGR5KVxuIyBSZXR1cm5zIC0xIGlmIHRoZXJlIGlzIG5vIHJvb20gdG8gbWFrZSBhIHN0cmlwZSBvZiA0LlxuZ2V0TGluZVByb2R1Y3QgPSAoc3gsIHN5LCBkeCwgZHkpIC0+XG4gIGV4ID0gc3ggKyAoNCAqIGR4KVxuICByZXR1cm4gLTEgaWYgKGV4IDwgMCkgb3IgKGV4ID49IDIwKVxuICBleSA9IHN5ICsgKDQgKiBkeSlcbiAgcmV0dXJuIC0xIGlmIChleSA8IDApIG9yIChleSA+PSAyMClcblxuICB4ID0gc3hcbiAgeSA9IHN5XG4gIHByb2R1Y3QgPSAxXG4gIGZvciBpIGluIFswLi4uNF1cbiAgICBwcm9kdWN0ICo9IGdyaWRbeF1beV1cbiAgICB4ICs9IGR4XG4gICAgeSArPSBkeVxuXG4gIHJldHVybiBwcm9kdWN0XG5cbmdldExpbmUgPSAoc3gsIHN5LCBkeCwgZHkpIC0+XG4gIGV4ID0gc3ggKyAoNCAqIGR4KVxuICByZXR1cm4gW10gaWYgKGV4IDwgMCkgb3IgKGV4ID49IDIwKVxuICBleSA9IHN5ICsgKDQgKiBkeSlcbiAgcmV0dXJuIFtdIGlmIChleSA8IDApIG9yIChleSA+PSAyMClcblxuICBsaW5lID0gW11cblxuICB4ID0gc3hcbiAgeSA9IHN5XG4gIGZvciBpIGluIFswLi4uNF1cbiAgICBsaW5lLnB1c2ggZ3JpZFt4XVt5XVxuICAgIHggKz0gZHhcbiAgICB5ICs9IGR5XG5cbiAgcmV0dXJuIGxpbmVcblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgIyBFeGFtcGxlIGlzIGRpYWdvbmFsIHJpZ2h0L2Rvd24gZnJvbSAoOCw2KVxuICBlcXVhbChnZXRMaW5lUHJvZHVjdCg4LCA2LCAxLCAxKSwgMTc4ODY5NiwgXCJEaWFnb25hbCB2YWx1ZSBzaG93biBpbiBleGFtcGxlIGVxdWFscyAxLDc4OCw2OTZcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICBtYXggPVxuICAgIHByb2R1Y3Q6IDFcbiAgICBpOiAwXG4gICAgajogMFxuICAgIGRpcjogXCJyaWdodFwiXG5cbiAgZm9yIGogaW4gWzAuLi4yMF1cbiAgICBmb3IgaSBpbiBbMC4uLjIwXVxuICAgICAgcCA9IGdldExpbmVQcm9kdWN0KGksIGosIDEsIDApXG4gICAgICBpZiBtYXgucHJvZHVjdCA8IHBcbiAgICAgICAgbWF4LnByb2R1Y3QgPSBwXG4gICAgICAgIG1heC5pID0gaVxuICAgICAgICBtYXguaiA9IGpcbiAgICAgICAgbWF4LmRpciA9IFwicmlnaHRcIlxuICAgICAgcCA9IGdldExpbmVQcm9kdWN0KGksIGosIDAsIDEpXG4gICAgICBpZiBtYXgucHJvZHVjdCA8IHBcbiAgICAgICAgbWF4LnByb2R1Y3QgPSBwXG4gICAgICAgIG1heC5pID0gaVxuICAgICAgICBtYXguaiA9IGpcbiAgICAgICAgbWF4LmRpciA9IFwiZG93blwiXG4gICAgICBwID0gZ2V0TGluZVByb2R1Y3QoaSwgaiwgMSwgMSlcbiAgICAgIGlmIG1heC5wcm9kdWN0IDwgcFxuICAgICAgICBtYXgucHJvZHVjdCA9IHBcbiAgICAgICAgbWF4LmkgPSBpXG4gICAgICAgIG1heC5qID0galxuICAgICAgICBtYXguZGlyID0gXCJkaWFnb25hbFJcIlxuICAgICAgcCA9IGdldExpbmVQcm9kdWN0KGksIGosIC0xLCAxKVxuICAgICAgaWYgbWF4LnByb2R1Y3QgPCBwXG4gICAgICAgIG1heC5wcm9kdWN0ID0gcFxuICAgICAgICBtYXguaSA9IGlcbiAgICAgICAgbWF4LmogPSBqXG4gICAgICAgIG1heC5kaXIgPSBcImRpYWdvbmFsTFwiXG5cbiAgcmV0dXJuIG1heFxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMTI6IEhpZ2hseSBkaXZpc2libGUgdHJpYW5ndWxhciBudW1iZXJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuVGhlIHNlcXVlbmNlIG9mIHRyaWFuZ2xlIG51bWJlcnMgaXMgZ2VuZXJhdGVkIGJ5IGFkZGluZyB0aGUgbmF0dXJhbCBudW1iZXJzLiBTbyB0aGUgN3RoIHRyaWFuZ2xlIG51bWJlciB3b3VsZCBiZVxuXG4gICAgICAgICAgICAgICAgICAgICAgMSArIDIgKyAzICsgNCArIDUgKyA2ICsgNyA9IDI4LlxuXG5UaGUgZmlyc3QgdGVuIHRlcm1zIHdvdWxkIGJlOlxuXG4gICAgICAgICAgICAgICAgICAgICAgMSwgMywgNiwgMTAsIDE1LCAyMSwgMjgsIDM2LCA0NSwgNTUsIC4uLlxuXG5MZXQgdXMgbGlzdCB0aGUgZmFjdG9ycyBvZiB0aGUgZmlyc3Qgc2V2ZW4gdHJpYW5nbGUgbnVtYmVyczpcblxuIDE6IDFcbiAzOiAxLDNcbiA2OiAxLDIsMyw2XG4xMDogMSwyLDUsMTBcbjE1OiAxLDMsNSwxNVxuMjE6IDEsMyw3LDIxXG4yODogMSwyLDQsNywxNCwyOFxuXG5XZSBjYW4gc2VlIHRoYXQgMjggaXMgdGhlIGZpcnN0IHRyaWFuZ2xlIG51bWJlciB0byBoYXZlIG92ZXIgZml2ZSBkaXZpc29ycy5cblxuV2hhdCBpcyB0aGUgdmFsdWUgb2YgdGhlIGZpcnN0IHRyaWFuZ2xlIG51bWJlciB0byBoYXZlIG92ZXIgZml2ZSBodW5kcmVkIGRpdmlzb3JzP1xuXG5cIlwiXCJcblxubWF0aCA9IHJlcXVpcmUgXCJtYXRoXCJcblxuIyBUaGlzIGZ1bmN0aW9uIGRvZXMgaXRzIGJlc3QgdG8gbGV2ZXJhZ2UgUmFtYW51amFuJ3MgXCJUYXUgZnVuY3Rpb25cIixcbiMgd2hpY2ggaXMgc3VwcG9zZWQgdG8gZ2l2ZSB0aGUgbnVtYmVyIG9mIHBvc2l0aXZlIGRpdmlzb3JzLlxuI1xuIyBUaGUgaWRlYSBpczpcbiMgKiBGb3IgcHJpbWVzLCBUKHBeaykgPSBrICsgMVxuIyAqIEZvciBhbnkgbnVtYmVycyB3aG9zZSBHQ0QgaXMgMSwgVChtbikgPSBUKG0pICogVChuKVxuI1xuIyBJIGFscmVhZHkgaGF2ZSBhIG1ldGhvZCB0byBwcmltZSBmYWN0b3IgYSBudW1iZXIsIHNvIEknbGwgbGV2ZXJhZ2VcbiMgZXZlcnkgZ3JvdXBpbmcgb2YgdGhlIHNhbWUgcHJpbWUgbnVtYmVyIGFzIHRoZSBmaXJzdCBjYXNlLCBhbmRcbiMgbXVsdGlwbHkgdGhlbSB0b2dldGhlci5cbiNcbiMgRXhhbXBsZTogMjhcbiNcbiMgMjgncyBwcmltZSBmYWN0b3JzIGFyZSBbMiwgMiwgN10sIG9yICgyXjIgKyA3KVxuI1xuIyBJIGNhbiBhc3N1bWUgdGhhdCB0aGUgR0NEIGJldHdlZW4gYW55IG9mIHRoZSBwcmltZSBzZXRzIGlzIGdvaW5nIHRvIGJlIDEgYmVjYXVzZSBkdWgsXG4jIHdoaWNoIG1lYW5zIHRoYXQ6XG4jXG4jIFQoMjgpID09IFQoMl4yKSAqIFQoNylcbiNcbiMgVCgyXjIpID09IDIgKyAxID09IDNcbiMgVCg3XjEpID09IDEgKyAxID09IDJcbiMgMyAqIDIgPSA2XG4jIDI4IGhhcyA2IGRpdmlzb3JzLlxuI1xuIyBZb3UncmUgbWFkLlxuXG5kaXZpc29yQ291bnQgPSAobikgLT5cbiAgcmV0dXJuIDEgaWYgbiA9PSAxXG5cbiAgZmFjdG9ycyA9IG1hdGgucHJpbWVGYWN0b3JzKG4pXG4gIGNvdW50ID0gMVxuICBsYXN0RmFjdG9yID0gMFxuICBleHBvbmVudCA9IDFcbiAgZm9yIGZhY3RvciBpbiBmYWN0b3JzXG4gICAgaWYgZmFjdG9yID09IGxhc3RGYWN0b3JcbiAgICAgIGV4cG9uZW50KytcbiAgICBlbHNlXG4gICAgICBpZiBsYXN0RmFjdG9yICE9IDBcbiAgICAgICAgICBjb3VudCAqPSBleHBvbmVudCArIDFcbiAgICAgIGxhc3RGYWN0b3IgPSBmYWN0b3JcbiAgICAgIGV4cG9uZW50ID0gMVxuXG4gIGlmIGxhc3RGYWN0b3IgIT0gMFxuICAgICAgY291bnQgKj0gZXhwb25lbnQgKyAxXG5cbiAgcmV0dXJuIGNvdW50XG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGVxdWFsKGRpdmlzb3JDb3VudCggMSksIDEsIFwiIDEgaGFzIDEgZGl2aXNvcnNcIilcbiAgZXF1YWwoZGl2aXNvckNvdW50KCAzKSwgMiwgXCIgMyBoYXMgMiBkaXZpc29yc1wiKVxuICBlcXVhbChkaXZpc29yQ291bnQoIDYpLCA0LCBcIiA2IGhhcyA0IGRpdmlzb3JzXCIpXG4gIGVxdWFsKGRpdmlzb3JDb3VudCgxMCksIDQsIFwiMTAgaGFzIDQgZGl2aXNvcnNcIilcbiAgZXF1YWwoZGl2aXNvckNvdW50KDE1KSwgNCwgXCIxNSBoYXMgNCBkaXZpc29yc1wiKVxuICBlcXVhbChkaXZpc29yQ291bnQoMjEpLCA0LCBcIjIxIGhhcyA0IGRpdmlzb3JzXCIpXG4gIGVxdWFsKGRpdmlzb3JDb3VudCgyOCksIDYsIFwiMjggaGFzIDYgZGl2aXNvcnNcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICBuID0gMVxuICBzdGVwID0gMlxuXG4gIGxvb3BcbiAgICBjb3VudCA9IGRpdmlzb3JDb3VudChuKVxuICAgIGlmIGNvdW50ID4gNTAwXG4gICAgICByZXR1cm4geyBuOiBuLCBjb3VudDogY291bnQgfVxuXG4gICAgIyBuZXh0IHRyaWFuZ3VsYXIgbnVtYmVyXG4gICAgbiArPSBzdGVwXG4gICAgc3RlcCsrXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAxMzogTGFyZ2Ugc3VtXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuV29yayBvdXQgdGhlIGZpcnN0IHRlbiBkaWdpdHMgb2YgdGhlIHN1bSBvZiB0aGUgZm9sbG93aW5nIG9uZS1odW5kcmVkIDUwLWRpZ2l0IG51bWJlcnMuXG5cbjM3MTA3Mjg3NTMzOTAyMTAyNzk4Nzk3OTk4MjIwODM3NTkwMjQ2NTEwMTM1NzQwMjUwXG40NjM3NjkzNzY3NzQ5MDAwOTcxMjY0ODEyNDg5Njk3MDA3ODA1MDQxNzAxODI2MDUzOFxuNzQzMjQ5ODYxOTk1MjQ3NDEwNTk0NzQyMzMzMDk1MTMwNTgxMjM3MjY2MTczMDk2MjlcbjkxOTQyMjEzMzYzNTc0MTYxNTcyNTIyNDMwNTYzMzAxODExMDcyNDA2MTU0OTA4MjUwXG4yMzA2NzU4ODIwNzUzOTM0NjE3MTE3MTk4MDMxMDQyMTA0NzUxMzc3ODA2MzI0NjY3NlxuODkyNjE2NzA2OTY2MjM2MzM4MjAxMzYzNzg0MTgzODM2ODQxNzg3MzQzNjE3MjY3NTdcbjI4MTEyODc5ODEyODQ5OTc5NDA4MDY1NDgxOTMxNTkyNjIxNjkxMjc1ODg5ODMyNzM4XG40NDI3NDIyODkxNzQzMjUyMDMyMTkyMzU4OTQyMjg3Njc5NjQ4NzY3MDI3MjE4OTMxOFxuNDc0NTE0NDU3MzYwMDEzMDY0MzkwOTExNjcyMTY4NTY4NDQ1ODg3MTE2MDMxNTMyNzZcbjcwMzg2NDg2MTA1ODQzMDI1NDM5OTM5NjE5ODI4OTE3NTkzNjY1Njg2NzU3OTM0OTUxXG42MjE3NjQ1NzE0MTg1NjU2MDYyOTUwMjE1NzIyMzE5NjU4Njc1NTA3OTMyNDE5MzMzMVxuNjQ5MDYzNTI0NjI3NDE5MDQ5MjkxMDE0MzI0NDU4MTM4MjI2NjMzNDc5NDQ3NTgxNzhcbjkyNTc1ODY3NzE4MzM3MjE3NjYxOTYzNzUxNTkwNTc5MjM5NzI4MjQ1NTk4ODM4NDA3XG41ODIwMzU2NTMyNTM1OTM5OTAwODQwMjYzMzU2ODk0ODgzMDE4OTQ1ODYyODIyNzgyOFxuODAxODExOTkzODQ4MjYyODIwMTQyNzgxOTQxMzk5NDA1Njc1ODcxNTExNzAwOTQzOTBcbjM1Mzk4NjY0MzcyODI3MTEyNjUzODI5OTg3MjQwNzg0NDczMDUzMTkwMTA0MjkzNTg2XG44NjUxNTUwNjAwNjI5NTg2NDg2MTUzMjA3NTI3MzM3MTk1OTE5MTQyMDUxNzI1NTgyOVxuNzE2OTM4ODg3MDc3MTU0NjY0OTkxMTU1OTM0ODc2MDM1MzI5MjE3MTQ5NzAwNTY5MzhcbjU0MzcwMDcwNTc2ODI2Njg0NjI0NjIxNDk1NjUwMDc2NDcxNzg3Mjk0NDM4Mzc3NjA0XG41MzI4MjY1NDEwODc1NjgyODQ0MzE5MTE5MDYzNDY5NDAzNzg1NTIxNzc3OTI5NTE0NVxuMzYxMjMyNzI1MjUwMDAyOTYwNzEwNzUwODI1NjM4MTU2NTY3MTA4ODUyNTgzNTA3MjFcbjQ1ODc2NTc2MTcyNDEwOTc2NDQ3MzM5MTEwNjA3MjE4MjY1MjM2ODc3MjIzNjM2MDQ1XG4xNzQyMzcwNjkwNTg1MTg2MDY2MDQ0ODIwNzYyMTIwOTgxMzI4Nzg2MDczMzk2OTQxMlxuODExNDI2NjA0MTgwODY4MzA2MTkzMjg0NjA4MTExOTEwNjE1NTY5NDA1MTI2ODk2OTJcbjUxOTM0MzI1NDUxNzI4Mzg4NjQxOTE4MDQ3MDQ5MjkzMjE1MDU4NjQyNTYzMDQ5NDgzXG42MjQ2NzIyMTY0ODQzNTA3NjIwMTcyNzkxODAzOTk0NDY5MzAwNDczMjk1NjM0MDY5MVxuMTU3MzI0NDQzODY5MDgxMjU3OTQ1MTQwODkwNTc3MDYyMjk0MjkxOTcxMDc5MjgyMDlcbjU1MDM3Njg3NTI1Njc4NzczMDkxODYyNTQwNzQ0OTY5ODQ0NTA4MzMwMzkzNjgyMTI2XG4xODMzNjM4NDgyNTMzMDE1NDY4NjE5NjEyNDM0ODc2NzY4MTI5NzUzNDM3NTk0NjUxNVxuODAzODYyODc1OTI4Nzg0OTAyMDE1MjE2ODU1NTQ4Mjg3MTcyMDEyMTkyNTc3NjY5NTRcbjc4MTgyODMzNzU3OTkzMTAzNjE0NzQwMzU2ODU2NDQ5MDk1NTI3MDk3ODY0Nzk3NTgxXG4xNjcyNjMyMDEwMDQzNjg5Nzg0MjU1MzUzOTkyMDkzMTgzNzQ0MTQ5NzgwNjg2MDk4NFxuNDg0MDMwOTgxMjkwNzc3OTE3OTkwODgyMTg3OTUzMjczNjQ0NzU2NzU1OTA4NDgwMzBcbjg3MDg2OTg3NTUxMzkyNzExODU0NTE3MDc4NTQ0MTYxODUyNDI0MzIwNjkzMTUwMzMyXG41OTk1OTQwNjg5NTc1NjUzNjc4MjEwNzA3NDkyNjk2NjUzNzY3NjMyNjIzNTQ0NzIxMFxuNjk3OTM5NTA2Nzk2NTI2OTQ3NDI1OTc3MDk3MzkxNjY2OTM3NjMwNDI2MzM5ODcwODVcbjQxMDUyNjg0NzA4Mjk5MDg1MjExMzk5NDI3MzY1NzM0MTE2MTgyNzYwMzE1MDAxMjcxXG42NTM3ODYwNzM2MTUwMTA4MDg1NzAwOTE0OTkzOTUxMjU1NzAyODE5ODc0NjAwNDM3NVxuMzU4MjkwMzUzMTc0MzQ3MTczMjY5MzIxMjM1NzgxNTQ5ODI2Mjk3NDI1NTI3MzczMDdcbjk0OTUzNzU5NzY1MTA1MzA1OTQ2OTY2MDY3NjgzMTU2NTc0Mzc3MTY3NDAxODc1Mjc1XG44ODkwMjgwMjU3MTczMzIyOTYxOTE3NjY2ODcxMzgxOTkzMTgxMTA0ODc3MDE5MDI3MVxuMjUyNjc2ODAyNzYwNzgwMDMwMTM2Nzg2ODA5OTI1MjU0NjM0MDEwNjE2MzI4NjY1MjZcbjM2MjcwMjE4NTQwNDk3NzA1NTg1NjI5OTQ2NTgwNjM2MjM3OTkzMTQwNzQ2MjU1OTYyXG4yNDA3NDQ4NjkwODIzMTE3NDk3Nzc5MjM2NTQ2NjI1NzI0NjkyMzMyMjgxMDkxNzE0MVxuOTE0MzAyODgxOTcxMDMyODg1OTc4MDY2Njk3NjA4OTI5Mzg2MzgyODUwMjUzMzM0MDNcbjM0NDEzMDY1NTc4MDE2MTI3ODE1OTIxODE1MDA1NTYxODY4ODM2NDY4NDIwMDkwNDcwXG4yMzA1MzA4MTE3MjgxNjQzMDQ4NzYyMzc5MTk2OTg0MjQ4NzI1NTAzNjYzODc4NDU4M1xuMTE0ODc2OTY5MzIxNTQ5MDI4MTA0MjQwMjAxMzgzMzUxMjQ0NjIxODE0NDE3NzM0NzBcbjYzNzgzMjk5NDkwNjM2MjU5NjY2NDk4NTg3NjE4MjIxMjI1MjI1NTEyNDg2NzY0NTMzXG42NzcyMDE4Njk3MTY5ODU0NDMxMjQxOTU3MjQwOTkxMzk1OTAwODk1MjMxMDA1ODgyMlxuOTU1NDgyNTUzMDAyNjM1MjA3ODE1MzIyOTY3OTYyNDk0ODE2NDE5NTM4NjgyMTg3NzRcbjc2MDg1MzI3MTMyMjg1NzIzMTEwNDI0ODAzNDU2MTI0ODY3Njk3MDY0NTA3OTk1MjM2XG4zNzc3NDI0MjUzNTQxMTI5MTY4NDI3Njg2NTUzODkyNjIwNTAyNDkxMDMyNjU3Mjk2N1xuMjM3MDE5MTMyNzU3MjU2NzUyODU2NTMyNDgyNTgyNjU0NjMwOTIyMDcwNTg1OTY1MjJcbjI5Nzk4ODYwMjcyMjU4MzMxOTEzMTI2Mzc1MTQ3MzQxOTk0ODg5NTM0NzY1NzQ1NTAxXG4xODQ5NTcwMTQ1NDg3OTI4ODk4NDg1NjgyNzcyNjA3NzcxMzcyMTQwMzc5ODg3OTcxNVxuMzgyOTgyMDM3ODMwMzE0NzM1Mjc3MjE1ODAzNDgxNDQ1MTM0OTEzNzMyMjY2NTEzODFcbjM0ODI5NTQzODI5MTk5OTE4MTgwMjc4OTE2NTIyNDMxMDI3MzkyMjUxMTIyODY5NTM5XG40MDk1Nzk1MzA2NjQwNTIzMjYzMjUzODA0NDEwMDA1OTY1NDkzOTE1OTg3OTU5MzYzNVxuMjk3NDYxNTIxODU1MDIzNzEzMDc2NDIyNTUxMjExODM2OTM4MDM1ODAzODg1ODQ5MDNcbjQxNjk4MTE2MjIyMDcyOTc3MTg2MTU4MjM2Njc4NDI0Njg5MTU3OTkzNTMyOTYxOTIyXG42MjQ2Nzk1NzE5NDQwMTI2OTA0Mzg3NzEwNzI3NTA0ODEwMjM5MDg5NTUyMzU5NzQ1N1xuMjMxODk3MDY3NzI1NDc5MTUwNjE1MDU1MDQ5NTM5MjI5Nzk1MzA5MDExMjk5Njc1MTlcbjg2MTg4MDg4MjI1ODc1MzE0NTI5NTg0MDk5MjUxMjAzODI5MDA5NDA3NzcwNzc1NjcyXG4xMTMwNjczOTcwODMwNDcyNDQ4MzgxNjUzMzg3MzUwMjM0MDg0NTY0NzA1ODA3NzMwOFxuODI5NTkxNzQ3NjcxNDAzNjMxOTgwMDgxODcxMjkwMTE4NzU0OTEzMTA1NDcxMjY1ODFcbjk3NjIzMzMxMDQ0ODE4Mzg2MjY5NTE1NDU2MzM0OTI2MzY2NTcyODk3NTYzNDAwNTAwXG40Mjg0NjI4MDE4MzUxNzA3MDUyNzgzMTgzOTQyNTg4MjE0NTUyMTIyNzI1MTI1MDMyN1xuNTUxMjE2MDM1NDY5ODEyMDA1ODE3NjIxNjUyMTI4Mjc2NTI3NTE2OTEyOTY4OTc3ODlcbjMyMjM4MTk1NzM0MzI5MzM5OTQ2NDM3NTAxOTA3ODM2OTQ1NzY1ODgzMzUyMzk5ODg2XG43NTUwNjE2NDk2NTE4NDc3NTE4MDczODE2ODgzNzg2MTA5MTUyNzM1NzkyOTcwMTMzN1xuNjIxNzc4NDI3NTIxOTI2MjM0MDE5NDIzOTk2MzkxNjgwNDQ5ODM5OTMxNzMzMTI3MzFcbjMyOTI0MTg1NzA3MTQ3MzQ5NTY2OTE2Njc0Njg3NjM0NjYwOTE1MDM1OTE0Njc3NTA0XG45OTUxODY3MTQzMDIzNTIxOTYyODg5NDg5MDEwMjQyMzMyNTExNjkxMzYxOTYyNjYyMlxuNzMyNjc0NjA4MDA1OTE1NDc0NzE4MzA3OTgzOTI4Njg1MzUyMDY5NDY5NDQ1NDA3MjRcbjc2ODQxODIyNTI0Njc0NDE3MTYxNTE0MDM2NDI3OTgyMjczMzQ4MDU1NTU2MjE0ODE4XG45NzE0MjYxNzkxMDM0MjU5ODY0NzIwNDUxNjg5Mzk4OTQyMjE3OTgyNjA4ODA3Njg1MlxuODc3ODM2NDYxODI3OTkzNDYzMTM3Njc3NTQzMDc4MDkzNjMzMzMwMTg5ODI2NDIwOTBcbjEwODQ4ODAyNTIxNjc0NjcwODgzMjE1MTIwMTg1ODgzNTQzMjIzODEyODc2OTUyNzg2XG43MTMyOTYxMjQ3NDc4MjQ2NDUzODYzNjk5MzAwOTA0OTMxMDM2MzYxOTc2Mzg3ODAzOVxuNjIxODQwNzM1NzIzOTk3OTQyMjM0MDYyMzUzOTM4MDgzMzk2NTEzMjc0MDgwMTExMTZcbjY2NjI3ODkxOTgxNDg4MDg3Nzk3OTQxODc2ODc2MTQ0MjMwMDMwOTg0NDkwODUxNDExXG42MDY2MTgyNjI5MzY4MjgzNjc2NDc0NDc3OTIzOTE4MDMzNTExMDk4OTA2OTc5MDcxNFxuODU3ODY5NDQwODk1NTI5OTA2NTM2NDA0NDc0MjU1NzYwODM2NTk5NzY2NDU3OTUwOTZcbjY2MDI0Mzk2NDA5OTA1Mzg5NjA3MTIwMTk4MjE5OTc2MDQ3NTk5NDkwMTk3MjMwMjk3XG42NDkxMzk4MjY4MDAzMjk3MzE1NjAzNzEyMDA0MTM3NzkwMzc4NTU2NjA4NTA4OTI1MlxuMTY3MzA5MzkzMTk4NzI3NTAyNzU0Njg5MDY5MDM3MDc1Mzk0MTMwNDI2NTIzMTUwMTFcbjk0ODA5Mzc3MjQ1MDQ4Nzk1MTUwOTU0MTAwOTIxNjQ1ODYzNzU0NzEwNTk4NDM2NzkxXG43ODYzOTE2NzAyMTE4NzQ5MjQzMTk5NTcwMDY0MTkxNzk2OTc3NzU5OTAyODMwMDY5OVxuMTUzNjg3MTM3MTE5MzY2MTQ5NTI4MTEzMDU4NzYzODAyNzg0MTA3NTQ0NDk3MzMwNzhcbjQwNzg5OTIzMTE1NTM1NTYyNTYxMTQyMzIyNDIzMjU1MDMzNjg1NDQyNDg4OTE3MzUzXG40NDg4OTkxMTUwMTQ0MDY0ODAyMDM2OTA2ODA2Mzk2MDY3MjMyMjE5MzIwNDE0OTUzNVxuNDE1MDMxMjg4ODAzMzk1MzYwNTMyOTkzNDAzNjgwMDY5Nzc3MTA2NTA1NjY2MzE5NTRcbjgxMjM0ODgwNjczMjEwMTQ2NzM5MDU4NTY4NTU3OTM0NTgxNDAzNjI3ODIyNzAzMjgwXG44MjYxNjU3MDc3Mzk0ODMyNzU5MjIzMjg0NTk0MTcwNjUyNTA5NDUxMjMyNTIzMDYwOFxuMjI5MTg4MDIwNTg3NzczMTk3MTk4Mzk0NTAxODA4ODgwNzI0Mjk2NjE5ODA4MTExOTdcbjc3MTU4NTQyNTAyMDE2NTQ1MDkwNDEzMjQ1ODA5Nzg2ODgyNzc4OTQ4NzIxODU5NjE3XG43MjEwNzgzODQzNTA2OTE4NjE1NTQzNTY2Mjg4NDA2MjI1NzQ3MzY5MjI4NDUwOTUxNlxuMjA4NDk2MDM5ODAxMzQwMDE3MjM5MzA2NzE2NjY4MjM1NTUyNDUyNTI4MDQ2MDk3MjJcbjUzNTAzNTM0MjI2NDcyNTI0MjUwODc0MDU0MDc1NTkxNzg5NzgxMjY0MzMwMzMxNjkwXG5cblwiXCJcIlxuXG5udW1iZXJzID0gW1xuICAzNzEwNzI4NzUzMzkwMjEwMjc5ODc5Nzk5ODIyMDgzNzU5MDI0NjUxMDEzNTc0MDI1MFxuICA0NjM3NjkzNzY3NzQ5MDAwOTcxMjY0ODEyNDg5Njk3MDA3ODA1MDQxNzAxODI2MDUzOFxuICA3NDMyNDk4NjE5OTUyNDc0MTA1OTQ3NDIzMzMwOTUxMzA1ODEyMzcyNjYxNzMwOTYyOVxuICA5MTk0MjIxMzM2MzU3NDE2MTU3MjUyMjQzMDU2MzMwMTgxMTA3MjQwNjE1NDkwODI1MFxuICAyMzA2NzU4ODIwNzUzOTM0NjE3MTE3MTk4MDMxMDQyMTA0NzUxMzc3ODA2MzI0NjY3NlxuICA4OTI2MTY3MDY5NjYyMzYzMzgyMDEzNjM3ODQxODM4MzY4NDE3ODczNDM2MTcyNjc1N1xuICAyODExMjg3OTgxMjg0OTk3OTQwODA2NTQ4MTkzMTU5MjYyMTY5MTI3NTg4OTgzMjczOFxuICA0NDI3NDIyODkxNzQzMjUyMDMyMTkyMzU4OTQyMjg3Njc5NjQ4NzY3MDI3MjE4OTMxOFxuICA0NzQ1MTQ0NTczNjAwMTMwNjQzOTA5MTE2NzIxNjg1Njg0NDU4ODcxMTYwMzE1MzI3NlxuICA3MDM4NjQ4NjEwNTg0MzAyNTQzOTkzOTYxOTgyODkxNzU5MzY2NTY4Njc1NzkzNDk1MVxuICA2MjE3NjQ1NzE0MTg1NjU2MDYyOTUwMjE1NzIyMzE5NjU4Njc1NTA3OTMyNDE5MzMzMVxuICA2NDkwNjM1MjQ2Mjc0MTkwNDkyOTEwMTQzMjQ0NTgxMzgyMjY2MzM0Nzk0NDc1ODE3OFxuICA5MjU3NTg2NzcxODMzNzIxNzY2MTk2Mzc1MTU5MDU3OTIzOTcyODI0NTU5ODgzODQwN1xuICA1ODIwMzU2NTMyNTM1OTM5OTAwODQwMjYzMzU2ODk0ODgzMDE4OTQ1ODYyODIyNzgyOFxuICA4MDE4MTE5OTM4NDgyNjI4MjAxNDI3ODE5NDEzOTk0MDU2NzU4NzE1MTE3MDA5NDM5MFxuICAzNTM5ODY2NDM3MjgyNzExMjY1MzgyOTk4NzI0MDc4NDQ3MzA1MzE5MDEwNDI5MzU4NlxuICA4NjUxNTUwNjAwNjI5NTg2NDg2MTUzMjA3NTI3MzM3MTk1OTE5MTQyMDUxNzI1NTgyOVxuICA3MTY5Mzg4ODcwNzcxNTQ2NjQ5OTExNTU5MzQ4NzYwMzUzMjkyMTcxNDk3MDA1NjkzOFxuICA1NDM3MDA3MDU3NjgyNjY4NDYyNDYyMTQ5NTY1MDA3NjQ3MTc4NzI5NDQzODM3NzYwNFxuICA1MzI4MjY1NDEwODc1NjgyODQ0MzE5MTE5MDYzNDY5NDAzNzg1NTIxNzc3OTI5NTE0NVxuICAzNjEyMzI3MjUyNTAwMDI5NjA3MTA3NTA4MjU2MzgxNTY1NjcxMDg4NTI1ODM1MDcyMVxuICA0NTg3NjU3NjE3MjQxMDk3NjQ0NzMzOTExMDYwNzIxODI2NTIzNjg3NzIyMzYzNjA0NVxuICAxNzQyMzcwNjkwNTg1MTg2MDY2MDQ0ODIwNzYyMTIwOTgxMzI4Nzg2MDczMzk2OTQxMlxuICA4MTE0MjY2MDQxODA4NjgzMDYxOTMyODQ2MDgxMTE5MTA2MTU1Njk0MDUxMjY4OTY5MlxuICA1MTkzNDMyNTQ1MTcyODM4ODY0MTkxODA0NzA0OTI5MzIxNTA1ODY0MjU2MzA0OTQ4M1xuICA2MjQ2NzIyMTY0ODQzNTA3NjIwMTcyNzkxODAzOTk0NDY5MzAwNDczMjk1NjM0MDY5MVxuICAxNTczMjQ0NDM4NjkwODEyNTc5NDUxNDA4OTA1NzcwNjIyOTQyOTE5NzEwNzkyODIwOVxuICA1NTAzNzY4NzUyNTY3ODc3MzA5MTg2MjU0MDc0NDk2OTg0NDUwODMzMDM5MzY4MjEyNlxuICAxODMzNjM4NDgyNTMzMDE1NDY4NjE5NjEyNDM0ODc2NzY4MTI5NzUzNDM3NTk0NjUxNVxuICA4MDM4NjI4NzU5Mjg3ODQ5MDIwMTUyMTY4NTU1NDgyODcxNzIwMTIxOTI1Nzc2Njk1NFxuICA3ODE4MjgzMzc1Nzk5MzEwMzYxNDc0MDM1Njg1NjQ0OTA5NTUyNzA5Nzg2NDc5NzU4MVxuICAxNjcyNjMyMDEwMDQzNjg5Nzg0MjU1MzUzOTkyMDkzMTgzNzQ0MTQ5NzgwNjg2MDk4NFxuICA0ODQwMzA5ODEyOTA3Nzc5MTc5OTA4ODIxODc5NTMyNzM2NDQ3NTY3NTU5MDg0ODAzMFxuICA4NzA4Njk4NzU1MTM5MjcxMTg1NDUxNzA3ODU0NDE2MTg1MjQyNDMyMDY5MzE1MDMzMlxuICA1OTk1OTQwNjg5NTc1NjUzNjc4MjEwNzA3NDkyNjk2NjUzNzY3NjMyNjIzNTQ0NzIxMFxuICA2OTc5Mzk1MDY3OTY1MjY5NDc0MjU5NzcwOTczOTE2NjY5Mzc2MzA0MjYzMzk4NzA4NVxuICA0MTA1MjY4NDcwODI5OTA4NTIxMTM5OTQyNzM2NTczNDExNjE4Mjc2MDMxNTAwMTI3MVxuICA2NTM3ODYwNzM2MTUwMTA4MDg1NzAwOTE0OTkzOTUxMjU1NzAyODE5ODc0NjAwNDM3NVxuICAzNTgyOTAzNTMxNzQzNDcxNzMyNjkzMjEyMzU3ODE1NDk4MjYyOTc0MjU1MjczNzMwN1xuICA5NDk1Mzc1OTc2NTEwNTMwNTk0Njk2NjA2NzY4MzE1NjU3NDM3NzE2NzQwMTg3NTI3NVxuICA4ODkwMjgwMjU3MTczMzIyOTYxOTE3NjY2ODcxMzgxOTkzMTgxMTA0ODc3MDE5MDI3MVxuICAyNTI2NzY4MDI3NjA3ODAwMzAxMzY3ODY4MDk5MjUyNTQ2MzQwMTA2MTYzMjg2NjUyNlxuICAzNjI3MDIxODU0MDQ5NzcwNTU4NTYyOTk0NjU4MDYzNjIzNzk5MzE0MDc0NjI1NTk2MlxuICAyNDA3NDQ4NjkwODIzMTE3NDk3Nzc5MjM2NTQ2NjI1NzI0NjkyMzMyMjgxMDkxNzE0MVxuICA5MTQzMDI4ODE5NzEwMzI4ODU5NzgwNjY2OTc2MDg5MjkzODYzODI4NTAyNTMzMzQwM1xuICAzNDQxMzA2NTU3ODAxNjEyNzgxNTkyMTgxNTAwNTU2MTg2ODgzNjQ2ODQyMDA5MDQ3MFxuICAyMzA1MzA4MTE3MjgxNjQzMDQ4NzYyMzc5MTk2OTg0MjQ4NzI1NTAzNjYzODc4NDU4M1xuICAxMTQ4NzY5NjkzMjE1NDkwMjgxMDQyNDAyMDEzODMzNTEyNDQ2MjE4MTQ0MTc3MzQ3MFxuICA2Mzc4MzI5OTQ5MDYzNjI1OTY2NjQ5ODU4NzYxODIyMTIyNTIyNTUxMjQ4Njc2NDUzM1xuICA2NzcyMDE4Njk3MTY5ODU0NDMxMjQxOTU3MjQwOTkxMzk1OTAwODk1MjMxMDA1ODgyMlxuICA5NTU0ODI1NTMwMDI2MzUyMDc4MTUzMjI5Njc5NjI0OTQ4MTY0MTk1Mzg2ODIxODc3NFxuICA3NjA4NTMyNzEzMjI4NTcyMzExMDQyNDgwMzQ1NjEyNDg2NzY5NzA2NDUwNzk5NTIzNlxuICAzNzc3NDI0MjUzNTQxMTI5MTY4NDI3Njg2NTUzODkyNjIwNTAyNDkxMDMyNjU3Mjk2N1xuICAyMzcwMTkxMzI3NTcyNTY3NTI4NTY1MzI0ODI1ODI2NTQ2MzA5MjIwNzA1ODU5NjUyMlxuICAyOTc5ODg2MDI3MjI1ODMzMTkxMzEyNjM3NTE0NzM0MTk5NDg4OTUzNDc2NTc0NTUwMVxuICAxODQ5NTcwMTQ1NDg3OTI4ODk4NDg1NjgyNzcyNjA3NzcxMzcyMTQwMzc5ODg3OTcxNVxuICAzODI5ODIwMzc4MzAzMTQ3MzUyNzcyMTU4MDM0ODE0NDUxMzQ5MTM3MzIyNjY1MTM4MVxuICAzNDgyOTU0MzgyOTE5OTkxODE4MDI3ODkxNjUyMjQzMTAyNzM5MjI1MTEyMjg2OTUzOVxuICA0MDk1Nzk1MzA2NjQwNTIzMjYzMjUzODA0NDEwMDA1OTY1NDkzOTE1OTg3OTU5MzYzNVxuICAyOTc0NjE1MjE4NTUwMjM3MTMwNzY0MjI1NTEyMTE4MzY5MzgwMzU4MDM4ODU4NDkwM1xuICA0MTY5ODExNjIyMjA3Mjk3NzE4NjE1ODIzNjY3ODQyNDY4OTE1Nzk5MzUzMjk2MTkyMlxuICA2MjQ2Nzk1NzE5NDQwMTI2OTA0Mzg3NzEwNzI3NTA0ODEwMjM5MDg5NTUyMzU5NzQ1N1xuICAyMzE4OTcwNjc3MjU0NzkxNTA2MTUwNTUwNDk1MzkyMjk3OTUzMDkwMTEyOTk2NzUxOVxuICA4NjE4ODA4ODIyNTg3NTMxNDUyOTU4NDA5OTI1MTIwMzgyOTAwOTQwNzc3MDc3NTY3MlxuICAxMTMwNjczOTcwODMwNDcyNDQ4MzgxNjUzMzg3MzUwMjM0MDg0NTY0NzA1ODA3NzMwOFxuICA4Mjk1OTE3NDc2NzE0MDM2MzE5ODAwODE4NzEyOTAxMTg3NTQ5MTMxMDU0NzEyNjU4MVxuICA5NzYyMzMzMTA0NDgxODM4NjI2OTUxNTQ1NjMzNDkyNjM2NjU3Mjg5NzU2MzQwMDUwMFxuICA0Mjg0NjI4MDE4MzUxNzA3MDUyNzgzMTgzOTQyNTg4MjE0NTUyMTIyNzI1MTI1MDMyN1xuICA1NTEyMTYwMzU0Njk4MTIwMDU4MTc2MjE2NTIxMjgyNzY1Mjc1MTY5MTI5Njg5Nzc4OVxuICAzMjIzODE5NTczNDMyOTMzOTk0NjQzNzUwMTkwNzgzNjk0NTc2NTg4MzM1MjM5OTg4NlxuICA3NTUwNjE2NDk2NTE4NDc3NTE4MDczODE2ODgzNzg2MTA5MTUyNzM1NzkyOTcwMTMzN1xuICA2MjE3Nzg0Mjc1MjE5MjYyMzQwMTk0MjM5OTYzOTE2ODA0NDk4Mzk5MzE3MzMxMjczMVxuICAzMjkyNDE4NTcwNzE0NzM0OTU2NjkxNjY3NDY4NzYzNDY2MDkxNTAzNTkxNDY3NzUwNFxuICA5OTUxODY3MTQzMDIzNTIxOTYyODg5NDg5MDEwMjQyMzMyNTExNjkxMzYxOTYyNjYyMlxuICA3MzI2NzQ2MDgwMDU5MTU0NzQ3MTgzMDc5ODM5Mjg2ODUzNTIwNjk0Njk0NDU0MDcyNFxuICA3Njg0MTgyMjUyNDY3NDQxNzE2MTUxNDAzNjQyNzk4MjI3MzM0ODA1NTU1NjIxNDgxOFxuICA5NzE0MjYxNzkxMDM0MjU5ODY0NzIwNDUxNjg5Mzk4OTQyMjE3OTgyNjA4ODA3Njg1MlxuICA4Nzc4MzY0NjE4Mjc5OTM0NjMxMzc2Nzc1NDMwNzgwOTM2MzMzMzAxODk4MjY0MjA5MFxuICAxMDg0ODgwMjUyMTY3NDY3MDg4MzIxNTEyMDE4NTg4MzU0MzIyMzgxMjg3Njk1Mjc4NlxuICA3MTMyOTYxMjQ3NDc4MjQ2NDUzODYzNjk5MzAwOTA0OTMxMDM2MzYxOTc2Mzg3ODAzOVxuICA2MjE4NDA3MzU3MjM5OTc5NDIyMzQwNjIzNTM5MzgwODMzOTY1MTMyNzQwODAxMTExNlxuICA2NjYyNzg5MTk4MTQ4ODA4Nzc5Nzk0MTg3Njg3NjE0NDIzMDAzMDk4NDQ5MDg1MTQxMVxuICA2MDY2MTgyNjI5MzY4MjgzNjc2NDc0NDc3OTIzOTE4MDMzNTExMDk4OTA2OTc5MDcxNFxuICA4NTc4Njk0NDA4OTU1Mjk5MDY1MzY0MDQ0NzQyNTU3NjA4MzY1OTk3NjY0NTc5NTA5NlxuICA2NjAyNDM5NjQwOTkwNTM4OTYwNzEyMDE5ODIxOTk3NjA0NzU5OTQ5MDE5NzIzMDI5N1xuICA2NDkxMzk4MjY4MDAzMjk3MzE1NjAzNzEyMDA0MTM3NzkwMzc4NTU2NjA4NTA4OTI1MlxuICAxNjczMDkzOTMxOTg3Mjc1MDI3NTQ2ODkwNjkwMzcwNzUzOTQxMzA0MjY1MjMxNTAxMVxuICA5NDgwOTM3NzI0NTA0ODc5NTE1MDk1NDEwMDkyMTY0NTg2Mzc1NDcxMDU5ODQzNjc5MVxuICA3ODYzOTE2NzAyMTE4NzQ5MjQzMTk5NTcwMDY0MTkxNzk2OTc3NzU5OTAyODMwMDY5OVxuICAxNTM2ODcxMzcxMTkzNjYxNDk1MjgxMTMwNTg3NjM4MDI3ODQxMDc1NDQ0OTczMzA3OFxuICA0MDc4OTkyMzExNTUzNTU2MjU2MTE0MjMyMjQyMzI1NTAzMzY4NTQ0MjQ4ODkxNzM1M1xuICA0NDg4OTkxMTUwMTQ0MDY0ODAyMDM2OTA2ODA2Mzk2MDY3MjMyMjE5MzIwNDE0OTUzNVxuICA0MTUwMzEyODg4MDMzOTUzNjA1MzI5OTM0MDM2ODAwNjk3NzcxMDY1MDU2NjYzMTk1NFxuICA4MTIzNDg4MDY3MzIxMDE0NjczOTA1ODU2ODU1NzkzNDU4MTQwMzYyNzgyMjcwMzI4MFxuICA4MjYxNjU3MDc3Mzk0ODMyNzU5MjIzMjg0NTk0MTcwNjUyNTA5NDUxMjMyNTIzMDYwOFxuICAyMjkxODgwMjA1ODc3NzMxOTcxOTgzOTQ1MDE4MDg4ODA3MjQyOTY2MTk4MDgxMTE5N1xuICA3NzE1ODU0MjUwMjAxNjU0NTA5MDQxMzI0NTgwOTc4Njg4Mjc3ODk0ODcyMTg1OTYxN1xuICA3MjEwNzgzODQzNTA2OTE4NjE1NTQzNTY2Mjg4NDA2MjI1NzQ3MzY5MjI4NDUwOTUxNlxuICAyMDg0OTYwMzk4MDEzNDAwMTcyMzkzMDY3MTY2NjgyMzU1NTI0NTI1MjgwNDYwOTcyMlxuICA1MzUwMzUzNDIyNjQ3MjUyNDI1MDg3NDA1NDA3NTU5MTc4OTc4MTI2NDMzMDMzMTY5MFxuXVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHN1bSA9IDBcbiAgZm9yIG4gaW4gbnVtYmVyc1xuICAgIHN1bSArPSBuXG5cbiAgc3RyID0gU3RyaW5nKHN1bSkucmVwbGFjZSgvXFwuL2csIFwiXCIpLnN1YnN0cigwLCAxMClcbiAgcmV0dXJuIHN0clxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMTQ6IExvbmdlc3QgQ29sbGF0eiBzZXF1ZW5jZVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblRoZSBmb2xsb3dpbmcgaXRlcmF0aXZlIHNlcXVlbmNlIGlzIGRlZmluZWQgZm9yIHRoZSBzZXQgb2YgcG9zaXRpdmUgaW50ZWdlcnM6XG5cbiAgICBuIC0+IG4vMiAgICAobiBpcyBldmVuKVxuICAgIG4gLT4gM24gKyAxIChuIGlzIG9kZClcblxuVXNpbmcgdGhlIHJ1bGUgYWJvdmUgYW5kIHN0YXJ0aW5nIHdpdGggMTMsIHdlIGdlbmVyYXRlIHRoZSBmb2xsb3dpbmcgc2VxdWVuY2U6XG5cbiAgICAxMyAtPiA0MCAtPiAyMCAtPiAxMCAtPiA1IC0+IDE2IC0+IDggLT4gNCAtPiAyIC0+IDFcblxuSXQgY2FuIGJlIHNlZW4gdGhhdCB0aGlzIHNlcXVlbmNlIChzdGFydGluZyBhdCAxMyBhbmQgZmluaXNoaW5nIGF0IDEpIGNvbnRhaW5zIDEwIHRlcm1zLiBBbHRob3VnaCBpdCBoYXMgbm90IGJlZW4gcHJvdmVkIHlldCAoQ29sbGF0eiBQcm9ibGVtKSwgaXQgaXMgdGhvdWdodCB0aGF0IGFsbCBzdGFydGluZyBudW1iZXJzIGZpbmlzaCBhdCAxLlxuXG5XaGljaCBzdGFydGluZyBudW1iZXIsIHVuZGVyIG9uZSBtaWxsaW9uLCBwcm9kdWNlcyB0aGUgbG9uZ2VzdCBjaGFpbj9cblxuTk9URTogT25jZSB0aGUgY2hhaW4gc3RhcnRzIHRoZSB0ZXJtcyBhcmUgYWxsb3dlZCB0byBnbyBhYm92ZSBvbmUgbWlsbGlvbi5cblxuXCJcIlwiXG5cbmNvbGxhdHpDYWNoZSA9IHt9XG5cbmNvbGxhdHpDaGFpbkxlbmd0aCA9IChzdGFydGluZ1ZhbHVlKSAtPlxuICBuID0gc3RhcnRpbmdWYWx1ZVxuICB0b0JlQ2FjaGVkID0gW11cblxuICBsb29wXG4gICAgYnJlYWsgaWYgY29sbGF0ekNhY2hlLmhhc093blByb3BlcnR5KG4pXG5cbiAgICAjIHJlbWVtYmVyIHRoYXQgd2UgZmFpbGVkIHRvIGNhY2hlIHRoaXMgZW50cnlcbiAgICB0b0JlQ2FjaGVkLnB1c2gobilcblxuICAgIGlmIG4gPT0gMVxuICAgICAgYnJlYWtcblxuICAgIGlmIChuICUgMikgPT0gMFxuICAgICAgbiA9IE1hdGguZmxvb3IobiAvIDIpXG4gICAgZWxzZVxuICAgICAgbiA9IChuICogMykgKyAxXG5cbiAgIyBTaW5jZSB3ZSBsZWZ0IGJyZWFkY3J1bWJzIGRvd24gdGhlIHRyYWlsIG9mIHRoaW5ncyB3ZSBoYXZlbid0IGNhY2hlZFxuICAjIHdhbGsgYmFjayBkb3duIHRoZSB0cmFpbCBhbmQgY2FjaGUgYWxsIHRoZSBlbnRyaWVzIGZvdW5kIGFsb25nIHRoZSB3YXlcbiAgbGVuID0gdG9CZUNhY2hlZC5sZW5ndGhcbiAgZm9yIHYsaSBpbiB0b0JlQ2FjaGVkXG4gICAgY29sbGF0ekNhY2hlW3ZdID0gY29sbGF0ekNhY2hlW25dICsgKGxlbiAtIGkpXG5cbiAgcmV0dXJuIGNvbGxhdHpDYWNoZVtzdGFydGluZ1ZhbHVlXVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBjb2xsYXR6Q2FjaGUgPSB7IFwiMVwiOiAxIH1cbiAgZXF1YWwoY29sbGF0ekNoYWluTGVuZ3RoKDEzKSwgMTAsIFwiMTMgaGFzIGEgY29sbGF0eiBjaGFpbiBvZiAxMFwiKVxuICBlcXVhbChjb2xsYXR6Q2hhaW5MZW5ndGgoMjYpLCAxMSwgXCIyNiBoYXMgYSBjb2xsYXR6IGNoYWluIG9mIDExXCIpXG4gIGVxdWFsKGNvbGxhdHpDaGFpbkxlbmd0aCggMSksICAxLCBcIjEgaGFzIGEgY29sbGF0eiBjaGFpbiBvZiAxXCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgY29sbGF0ekNhY2hlID0geyBcIjFcIjogMSB9XG5cbiAgbWF4Q2hhaW4gPSAwXG4gIG1heENoYWluTGVuZ3RoID0gMFxuICBmb3IgaSBpbiBbMS4uLjEwMDAwMDBdXG4gICAgY2hhaW5MZW5ndGggPSBjb2xsYXR6Q2hhaW5MZW5ndGgoaSlcbiAgICBpZiBtYXhDaGFpbkxlbmd0aCA8IGNoYWluTGVuZ3RoXG4gICAgICBtYXhDaGFpbkxlbmd0aCA9IGNoYWluTGVuZ3RoXG4gICAgICBtYXhDaGFpbiA9IGlcblxuICByZXR1cm4geyBhbnN3ZXI6IG1heENoYWluLCBjaGFpbkxlbmd0aDogbWF4Q2hhaW5MZW5ndGggfVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMTU6IExhdHRpY2UgcGF0aHNcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuU3RhcnRpbmcgaW4gdGhlIHRvcCBsZWZ0IGNvcm5lciBvZiBhIDLDlzIgZ3JpZCwgYW5kIG9ubHkgYmVpbmcgYWJsZSB0byBtb3ZlIHRvIHRoZSByaWdodCBhbmQgZG93biwgdGhlcmUgYXJlIGV4YWN0bHkgNiByb3V0ZXMgdG8gdGhlIGJvdHRvbSByaWdodCBjb3JuZXIuXG5cbiAgICAocGljdHVyZSBzaG93aW5nIDYgcGF0aHM6IFJSREQsIFJEUkQsIFJERFIsIERSUkQsIERSRFIsIEREUlIpXG5cbkhvdyBtYW55IHN1Y2ggcm91dGVzIGFyZSB0aGVyZSB0aHJvdWdoIGEgMjDDlzIwIGdyaWQ/XG5cblwiXCJcIlxuXG5tYXRoID0gcmVxdWlyZSBcIm1hdGhcIlxuXG5sYXR0aWNlID0gKG4pIC0+XG4gIHJldHVybiBtYXRoLm5DcihuICogMiwgbilcblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgZXF1YWwobGF0dGljZSgxKSwgMiwgXCIxeDEgbGF0dGljZSBoYXMgMiBwYXRoc1wiKVxuICBlcXVhbChsYXR0aWNlKDIpLCA2LCBcIjJ4MiBsYXR0aWNlIGhhcyA2IHBhdGhzXCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgcmV0dXJuIGxhdHRpY2UoMjApXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAxNjogUG93ZXIgZGlnaXQgc3VtXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuMl4xNSA9IDMyNzY4IGFuZCB0aGUgc3VtIG9mIGl0cyBkaWdpdHMgaXMgMyArIDIgKyA3ICsgNiArIDggPSAyNi5cblxuV2hhdCBpcyB0aGUgc3VtIG9mIHRoZSBkaWdpdHMgb2YgdGhlIG51bWJlciAyXjEwMDA/XG5cblwiXCJcIlxuXG5tYXRoID0gcmVxdWlyZSBcIm1hdGhcIlxuYmlnSW50ID0gcmVxdWlyZSBcImJpZy1pbnRlZ2VyXCJcblxuTUFYX0VYUE9ORU5UID0gNTBcblxucG93ZXJEaWdpdFN1bSA9ICh4LCB5KSAtPlxuICBudW1iZXIgPSBiaWdJbnQoMSlcbiAgd2hpbGUgeSAhPSAwXG4gICAgZXhwb25lbnQgPSB5XG4gICAgaWYgZXhwb25lbnQgPiBNQVhfRVhQT05FTlRcbiAgICAgIGV4cG9uZW50ID0gTUFYX0VYUE9ORU5UXG4gICAgeSAtPSBleHBvbmVudFxuICAgIG51bWJlciA9IG51bWJlci5tdWx0aXBseSBNYXRoLmZsb29yKE1hdGgucG93KHgsIGV4cG9uZW50KSlcbiAgZGlnaXRzID0gU3RyaW5nKG51bWJlcilcblxuICBzdW0gPSAwXG4gIGZvciBkIGluIGRpZ2l0c1xuICAgIHN1bSArPSBwYXJzZUludChkKVxuICByZXR1cm4gc3VtXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGVxdWFsKHBvd2VyRGlnaXRTdW0oMiwgMTUpLCAyNiwgXCJzdW0gb2YgZGlnaXRzIG9mIDJeMTUgaXMgMjZcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICByZXR1cm4gcG93ZXJEaWdpdFN1bSgyLCAxMDAwKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMTc6IE51bWJlciBsZXR0ZXIgY291bnRzXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5JZiB0aGUgbnVtYmVycyAxIHRvIDUgYXJlIHdyaXR0ZW4gb3V0IGluIHdvcmRzOiBvbmUsIHR3bywgdGhyZWUsIGZvdXIsIGZpdmUsIHRoZW4gdGhlcmUgYXJlIDMgKyAzICsgNSArIDQgKyA0ID0gMTkgbGV0dGVycyB1c2VkIGluIHRvdGFsLlxuXG5JZiBhbGwgdGhlIG51bWJlcnMgZnJvbSAxIHRvIDEwMDAgKG9uZSB0aG91c2FuZCkgaW5jbHVzaXZlIHdlcmUgd3JpdHRlbiBvdXQgaW4gd29yZHMsIGhvdyBtYW55IGxldHRlcnMgd291bGQgYmUgdXNlZD9cblxuTk9URTogRG8gbm90IGNvdW50IHNwYWNlcyBvciBoeXBoZW5zLiBGb3IgZXhhbXBsZSwgMzQyICh0aHJlZSBodW5kcmVkIGFuZCBmb3J0eS10d28pIGNvbnRhaW5zIDIzIGxldHRlcnMgYW5kIDExNSAob25lIGh1bmRyZWQgYW5kIGZpZnRlZW4pIGNvbnRhaW5zIDIwIGxldHRlcnMuIFRoZSB1c2Ugb2YgXCJhbmRcIiB3aGVuIHdyaXRpbmcgb3V0IG51bWJlcnMgaXMgaW4gY29tcGxpYW5jZSB3aXRoIEJyaXRpc2ggdXNhZ2UuXG5cblwiXCJcIlxuXG5uYW1lcyA9XG4gIG9uZXM6IFwiemVybyBvbmUgdHdvIHRocmVlIGZvdXIgZml2ZSBzaXggc2V2ZW4gZWlnaHQgbmluZSB0ZW4gZWxldmVuIHR3ZWx2ZSB0aGlydGVlbiBmb3VydGVlbiBmaWZ0ZWVuIHNpeHRlZW4gc2V2ZW50ZWVuIGVpZ2h0ZWVuIG5pbmV0ZWVuXCIuc3BsaXQoL1xccysvKVxuICB0ZW5zOiBcIl8gXyB0d2VudHkgdGhpcnR5IGZvcnR5IGZpZnR5IHNpeHR5IHNldmVudHkgZWlnaHR5IG5pbmV0eVwiLnNwbGl0KC9cXHMrLylcblxuIyBzdXBwb3J0cyAwLTk5OTlcbm51bWJlckxldHRlckNvdW50ID0gKG51bSkgLT5cbiAgbiA9IG51bVxuICBuYW1lID0gXCJcIlxuXG4gIGlmIG4gPj0gMTAwMFxuICAgIHRob3VzYW5kcyA9IE1hdGguZmxvb3IobiAvIDEwMDApXG4gICAgbiA9IG4gJSAxMDAwXG4gICAgbmFtZSArPSBcIiN7bmFtZXMub25lc1t0aG91c2FuZHNdfSB0aG91c2FuZCBcIlxuXG4gIGlmIG4gPj0gMTAwXG4gICAgaHVuZHJlZHMgPSBNYXRoLmZsb29yKG4gLyAxMDApXG4gICAgbiA9IG4gJSAxMDBcbiAgICBuYW1lICs9IFwiI3tuYW1lcy5vbmVzW2h1bmRyZWRzXX0gaHVuZHJlZCBcIlxuXG4gIGlmIChuID4gMCkgYW5kIChuYW1lLmxlbmd0aCA+IDApXG4gICAgbmFtZSArPSBcImFuZCBcIlxuXG4gIGlmIG4gPj0gMjBcbiAgICB0ZW5zID0gTWF0aC5mbG9vcihuIC8gMTApXG4gICAgbiA9IG4gJSAxMFxuICAgIG5hbWUgKz0gXCIje25hbWVzLnRlbnNbdGVuc119IFwiXG5cbiAgaWYgbiA+IDBcbiAgICBuYW1lICs9IFwiI3tuYW1lcy5vbmVzW25dfSBcIlxuXG4gIGxldHRlcnNPbmx5ID0gbmFtZS5yZXBsYWNlKC9bXmEtel0vZywgXCJcIilcbiAgIyBjb25zb2xlLmxvZyBcIm51bTogI3tudW19LCBuYW1lOiAje25hbWV9LCBsZXR0ZXJzT25seTogI3tsZXR0ZXJzT25seX1cIlxuICByZXR1cm4gbGV0dGVyc09ubHkubGVuZ3RoXG5cbm51bWJlckxldHRlckNvdW50UmFuZ2UgPSAoYSwgYikgLT5cbiAgc3VtID0gMFxuICBmb3IgaSBpbiBbYS4uYl1cbiAgICBzdW0gKz0gbnVtYmVyTGV0dGVyQ291bnQoaSlcbiAgcmV0dXJuIHN1bVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChudW1iZXJMZXR0ZXJDb3VudFJhbmdlKDEsIDUpLCAxOSwgXCJzdW0gb2YgbGVuZ3RocyBvZiBudW1iZXJzIDEtNSBpcyAxOVwiKVxuICBlcXVhbChudW1iZXJMZXR0ZXJDb3VudCgzNDIpLCAyMywgXCJsZW5ndGggb2YgbmFtZSBvZiAzNDIgaXMgMjNcIilcbiAgZXF1YWwobnVtYmVyTGV0dGVyQ291bnQoMTE1KSwgMjAsIFwibGVuZ3RoIG9mIG5hbWUgb2YgMTE1IGlzIDIwXCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgcmV0dXJuIG51bWJlckxldHRlckNvdW50UmFuZ2UoMSwgMTAwMClcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDE4OiBNYXhpbXVtIHBhdGggc3VtIElcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5CeSBzdGFydGluZyBhdCB0aGUgdG9wIG9mIHRoZSB0cmlhbmdsZSBiZWxvdyBhbmQgbW92aW5nIHRvIGFkamFjZW50IG51bWJlcnMgb24gdGhlIHJvdyBiZWxvdywgdGhlIG1heGltdW0gdG90YWwgZnJvbSB0b3AgdG8gYm90dG9tIGlzIDIzLlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIDcgNFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDIgNCA2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICA4IDUgOSAzXG5cblRoYXQgaXMsIDMgKyA3ICsgNCArIDkgPSAyMy5cblxuRmluZCB0aGUgbWF4aW11bSB0b3RhbCBmcm9tIHRvcCB0byBib3R0b20gb2YgdGhlIHRyaWFuZ2xlIGJlbG93OlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA3NVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDk1ICA2NFxuICAgICAgICAgICAgICAgICAgICAgICAgICAxNyAgNDcgIDgyXG4gICAgICAgICAgICAgICAgICAgICAgICAxOCAgMzUgIDg3ICAxMFxuICAgICAgICAgICAgICAgICAgICAgIDIwICAwNCAgODIgIDQ3ICA2NVxuICAgICAgICAgICAgICAgICAgICAxOSAgMDEgIDIzICA3NSAgMDMgIDM0XG4gICAgICAgICAgICAgICAgICA4OCAgMDIgIDc3ICA3MyAgMDcgIDYzICA2N1xuICAgICAgICAgICAgICAgIDk5ICA2NSAgMDQgIDI4ICAwNiAgMTYgIDcwICA5MlxuICAgICAgICAgICAgICA0MSAgNDEgIDI2ICA1NiAgODMgIDQwICA4MCAgNzAgIDMzXG4gICAgICAgICAgICA0MSAgNDggIDcyICAzMyAgNDcgIDMyICAzNyAgMTYgIDk0ICAyOVxuICAgICAgICAgIDUzICA3MSAgNDQgIDY1ICAyNSAgNDMgIDkxICA1MiAgOTcgIDUxICAxNFxuICAgICAgICA3MCAgMTEgIDMzICAyOCAgNzcgIDczICAxNyAgNzggIDM5ICA2OCAgMTcgIDU3XG4gICAgICA5MSAgNzEgIDUyICAzOCAgMTcgIDE0ICA5MSAgNDMgIDU4ICA1MCAgMjcgIDI5ICA0OFxuICAgIDYzICA2NiAgMDQgIDY4ICA4OSAgNTMgIDY3ICAzMCAgNzMgIDE2ICA2OSAgODcgIDQwICAzMVxuICAwNCAgNjIgIDk4ICAyNyAgMjMgIDA5ICA3MCAgOTggIDczICA5MyAgMzggIDUzICA2MCAgMDQgIDIzXG5cbk5PVEU6IEFzIHRoZXJlIGFyZSBvbmx5IDE2Mzg0IHJvdXRlcywgaXQgaXMgcG9zc2libGUgdG8gc29sdmUgdGhpcyBwcm9ibGVtIGJ5IHRyeWluZyBldmVyeSByb3V0ZS4gSG93ZXZlciwgUHJvYmxlbSA2NywgaXMgdGhlIHNhbWUgY2hhbGxlbmdlIHdpdGggYSB0cmlhbmdsZSBjb250YWluaW5nIG9uZS1odW5kcmVkIHJvd3M7IGl0IGNhbm5vdCBiZSBzb2x2ZWQgYnkgYnJ1dGUgZm9yY2UsIGFuZCByZXF1aXJlcyBhIGNsZXZlciBtZXRob2QhIDtvKVxuXG5cIlwiXCJcblxubWF0aCA9IHJlcXVpcmUgXCJtYXRoXCJcblxudGVzdFB5cmFtaWQgPSBcIlwiXCJcbiAgICAgIDNcbiAgICAgNyA0XG4gICAgMiA0IDZcbiAgIDggNSA5IDNcblwiXCJcIlxuXG5tYWluUHlyYW1pZCA9IFwiXCJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgNzVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA5NSAgNjRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgMTcgIDQ3ICA4MlxuICAgICAgICAgICAgICAgICAgICAgICAgMTggIDM1ICA4NyAgMTBcbiAgICAgICAgICAgICAgICAgICAgICAyMCAgMDQgIDgyICA0NyAgNjVcbiAgICAgICAgICAgICAgICAgICAgMTkgIDAxICAyMyAgNzUgIDAzICAzNFxuICAgICAgICAgICAgICAgICAgODggIDAyICA3NyAgNzMgIDA3ICA2MyAgNjdcbiAgICAgICAgICAgICAgICA5OSAgNjUgIDA0ICAyOCAgMDYgIDE2ICA3MCAgOTJcbiAgICAgICAgICAgICAgNDEgIDQxICAyNiAgNTYgIDgzICA0MCAgODAgIDcwICAzM1xuICAgICAgICAgICAgNDEgIDQ4ICA3MiAgMzMgIDQ3ICAzMiAgMzcgIDE2ICA5NCAgMjlcbiAgICAgICAgICA1MyAgNzEgIDQ0ICA2NSAgMjUgIDQzICA5MSAgNTIgIDk3ICA1MSAgMTRcbiAgICAgICAgNzAgIDExICAzMyAgMjggIDc3ICA3MyAgMTcgIDc4ICAzOSAgNjggIDE3ICA1N1xuICAgICAgOTEgIDcxICA1MiAgMzggIDE3ICAxNCAgOTEgIDQzICA1OCAgNTAgIDI3ICAyOSAgNDhcbiAgICA2MyAgNjYgIDA0ICA2OCAgODkgIDUzICA2NyAgMzAgIDczICAxNiAgNjkgIDg3ICA0MCAgMzFcbiAgMDQgIDYyICA5OCAgMjcgIDIzICAwOSAgNzAgIDk4ICA3MyAgOTMgIDM4ICA1MyAgNjAgIDA0ICAyM1xuXG5cIlwiXCJcblxuc3RyaW5nVG9QeXJhbWlkID0gKHN0cikgLT5cbiAgZGlnaXRzID0gKHBhcnNlSW50KGQpIGZvciBkIGluIFN0cmluZyhzdHIpLnJlcGxhY2UoL1xcbi9nLCBcIiBcIikuc3BsaXQoL1xccysvKS5maWx0ZXIgKHMpIC0+IHJldHVybiAocy5sZW5ndGggPiAwKSApXG4gIGdyaWQgPSBbXVxuICByb3cgPSAwXG4gIHdoaWxlIGRpZ2l0cy5sZW5ndGhcbiAgICBsZW4gPSByb3cgKyAxXG4gICAgYSA9IEFycmF5KGxlbilcbiAgICBmb3IgaSBpbiBbMC4uLmxlbl1cbiAgICAgIGFbaV0gPSBkaWdpdHMuc2hpZnQoKVxuICAgIGdyaWRbcm93XSA9IGFcbiAgICByb3crK1xuICByZXR1cm4gZ3JpZFxuXG4jIENydXNoZXMgdGhlIHB5cmFtaWQgZnJvbSBib3R0b20gdXAuIFdoZW4gaXQgaXMgYWxsIGRvbmUgY3J1c2hpbmcsIHRoZSB0b3Agb2YgdGhlIHB5cmFtaWQgaXMgdGhlIGFuc3dlci5cbm1heGltdW1QYXRoU3VtID0gKHB5cmFtaWRTdHJpbmcpIC0+XG4gIHB5cmFtaWQgPSBzdHJpbmdUb1B5cmFtaWQocHlyYW1pZFN0cmluZylcbiAgc3VtID0gMFxuICByb3cgPSBweXJhbWlkLmxlbmd0aCAtIDJcbiAgd2hpbGUgcm93ID49IDBcbiAgICBmb3IgaSBpbiBbMC4ucm93XVxuICAgICAgbWF4QmVsb3cgPSBNYXRoLm1heChweXJhbWlkW3JvdysxXVtpXSwgcHlyYW1pZFtyb3crMV1baSsxXSlcbiAgICAgIHB5cmFtaWRbcm93XVtpXSArPSBtYXhCZWxvd1xuICAgIHJvdy0tXG4gIHJldHVybiBweXJhbWlkWzBdWzBdXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGVxdWFsKG1heGltdW1QYXRoU3VtKHRlc3RQeXJhbWlkKSwgMjMsIFwibWF4aW11bSBwYXRoIHN1bSBvZiB0ZXN0IHRyaWFuZ2xlIGlzIDIzXCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgY29uc29sZS5sb2cgd2luZG93LmFyZ3NcbiAgcmV0dXJuIG1heGltdW1QYXRoU3VtKG1haW5QeXJhbWlkKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMTk6IENvdW50aW5nIFN1bmRheXNcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuWW91IGFyZSBnaXZlbiB0aGUgZm9sbG93aW5nIGluZm9ybWF0aW9uLCBidXQgeW91IG1heSBwcmVmZXIgdG8gZG8gc29tZSByZXNlYXJjaCBmb3IgeW91cnNlbGYuXG5cbiogMSBKYW4gMTkwMCB3YXMgYSBNb25kYXkuXG4qIFRoaXJ0eSBkYXlzIGhhcyBTZXB0ZW1iZXIsXG4gIEFwcmlsLCBKdW5lIGFuZCBOb3ZlbWJlci5cbiAgQWxsIHRoZSByZXN0IGhhdmUgdGhpcnR5LW9uZSxcbiAgU2F2aW5nIEZlYnJ1YXJ5IGFsb25lLFxuICBXaGljaCBoYXMgdHdlbnR5LWVpZ2h0LCByYWluIG9yIHNoaW5lLlxuICBBbmQgb24gbGVhcCB5ZWFycywgdHdlbnR5LW5pbmUuXG4qIEEgbGVhcCB5ZWFyIG9jY3VycyBvbiBhbnkgeWVhciBldmVubHkgZGl2aXNpYmxlIGJ5IDQsIGJ1dCBub3Qgb24gYSBjZW50dXJ5IHVubGVzcyBpdCBpcyBkaXZpc2libGUgYnkgNDAwLlxuXG5Ib3cgbWFueSBTdW5kYXlzIGZlbGwgb24gdGhlIGZpcnN0IG9mIHRoZSBtb250aCBkdXJpbmcgdGhlIHR3ZW50aWV0aCBjZW50dXJ5ICgxIEphbiAxOTAxIHRvIDMxIERlYyAyMDAwKT9cblxuXCJcIlwiXG5cbk9ORV9EQVlfSU5fTVMgPSA2MCAqIDYwICogMjQgKiAxMDAwXG5cbmRheU5hbWVzID0gXCJTdW5kYXkgTW9uZGF5IFR1ZXNkYXkgV2VkbmVzZGF5IFRodXJzZGF5IEZyaWRheSBTYXR1cmRheVwiLnNwbGl0KC9cXHMrLylcblxuZGF5QW5kRGF0ZSA9ICh0aW1lc3RhbXApIC0+XG4gIGQgPSBuZXcgRGF0ZSh0aW1lc3RhbXApXG4gIHJldHVybiBbZC5nZXREYXkoKSwgZC5nZXREYXRlKCldXG5cbmRhdGVUb1RpbWVzdGFtcCA9ICh5ZWFyLCBtb250aCwgZGF5KSAtPlxuICByZXR1cm4gbmV3IERhdGUoeWVhciwgbW9udGgsIGRheSkuZ2V0VGltZSgpXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIHRzID0gZGF0ZVRvVGltZXN0YW1wKDE5MDAsIDAsIDEpXG4gIGVxdWFsKGRheUFuZERhdGUodHMpWzBdLCAxLCBcIjE5MDAvMS8xIHdhcyBhIE1vbmRheVwiKVxuXG4gIGZvciBkYXkgaW4gWzIuLjZdXG4gICAgdHMgKz0gT05FX0RBWV9JTl9NU1xuICAgIGRkID0gZGF5QW5kRGF0ZSh0cylcbiAgICBlcXVhbChkZFswXSwgZGF5LCBcInRoZSBmb2xsb3dpbmcgZGF5IHdhcyBhICN7ZGF5TmFtZXNbZGF5XX1cIilcbiAgICBlcXVhbChkZFsxXSwgZGF5LCBcIi4uLiBhbmQgdGhlIGRhdGUgd2FzIDEvI3tkZFsxXX1cIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICB0cyA9IGRhdGVUb1RpbWVzdGFtcCgxOTAxLCAwLCAxKVxuICBlbmR0cyA9IGRhdGVUb1RpbWVzdGFtcCgyMDAwLCAxMSwgMzEpXG5cbiAgc3VuZGF5Q291bnQgPSAwXG4gIHdoaWxlIHRzIDwgZW5kdHNcbiAgICBkZCA9IGRheUFuZERhdGUodHMpXG4gICAgaWYgKGRkWzBdID09IDApIGFuZCAoZGRbMV0gPT0gMSlcbiAgICAgIHN1bmRheUNvdW50KytcbiAgICB0cyArPSBPTkVfREFZX0lOX01TXG5cbiAgcmV0dXJuIHN1bmRheUNvdW50XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAyMDogRmFjdG9yaWFsIGRpZ2l0IHN1bVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5uISBtZWFucyBuIHggKG4g4oiSIDEpIHggLi4uIHggMyB4IDIgeCAxXG5cbkZvciBleGFtcGxlLCAxMCEgPSAxMCB4IDkgeCAuLi4geCAzIHggMiB4IDEgPSAzNjI4ODAwLFxuYW5kIHRoZSBzdW0gb2YgdGhlIGRpZ2l0cyBpbiB0aGUgbnVtYmVyIDEwISBpcyAzICsgNiArIDIgKyA4ICsgOCArIDAgKyAwID0gMjcuXG5cbkZpbmQgdGhlIHN1bSBvZiB0aGUgZGlnaXRzIGluIHRoZSBudW1iZXIgMTAwIVxuXG5cIlwiXCJcblxuYmlnSW50ID0gcmVxdWlyZSBcImJpZy1pbnRlZ2VyXCJcblxuaHVnZUZhY3RvcmlhbCA9IChuKSAtPlxuICBudW1iZXIgPSBiaWdJbnQoMSlcbiAgZm9yIGkgaW4gWzEuLm5dXG4gICAgbnVtYmVyID0gbnVtYmVyLm11bHRpcGx5IGlcbiAgcmV0dXJuIG51bWJlclxuXG5zdW1PZkRpZ2l0cyA9IChuKSAtPlxuICBkaWdpdHMgPSBTdHJpbmcobilcblxuICBzdW0gPSAwXG4gIGZvciBkaWdpdCBpbiBkaWdpdHNcbiAgICBzdW0gKz0gcGFyc2VJbnQoZGlnaXQpXG5cbiAgcmV0dXJuIHN1bVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChzdW1PZkRpZ2l0cyhodWdlRmFjdG9yaWFsKDEwKSksIDI3LCBcInN1bSBvZiBmYWN0b3JpYWwgZGlnaXRzIG9mIDEwISBpcyAyN1wiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHJldHVybiBzdW1PZkRpZ2l0cyhodWdlRmFjdG9yaWFsKDEwMCkpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAyMTogQW1pY2FibGUgbnVtYmVyc1xuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5MZXQgZChuKSBiZSBkZWZpbmVkIGFzIHRoZSBzdW0gb2YgcHJvcGVyIGRpdmlzb3JzIG9mIG4gKG51bWJlcnMgbGVzcyB0aGFuIG4gd2hpY2ggZGl2aWRlIGV2ZW5seSBpbnRvIG4pLlxuSWYgZChhKSA9IGIgYW5kIGQoYikgPSBhLCB3aGVyZSBhIOKJoCBiLCB0aGVuIGEgYW5kIGIgYXJlIGFuIGFtaWNhYmxlIHBhaXIgYW5kIGVhY2ggb2YgYSBhbmQgYiBhcmUgY2FsbGVkIGFtaWNhYmxlIG51bWJlcnMuXG5cbkZvciBleGFtcGxlLCB0aGUgcHJvcGVyIGRpdmlzb3JzIG9mIDIyMCBhcmUgMSwgMiwgNCwgNSwgMTAsIDExLCAyMCwgMjIsIDQ0LCA1NSBhbmQgMTEwOyB0aGVyZWZvcmUgZCgyMjApID0gMjg0LiBUaGUgcHJvcGVyIGRpdmlzb3JzIG9mIDI4NCBhcmUgMSwgMiwgNCwgNzEgYW5kIDE0Mjsgc28gZCgyODQpID0gMjIwLlxuXG5FdmFsdWF0ZSB0aGUgc3VtIG9mIGFsbCB0aGUgYW1pY2FibGUgbnVtYmVycyB1bmRlciAxMDAwMC5cblxuXCJcIlwiXG5cbm1hdGggPSByZXF1aXJlIFwibWF0aFwiXG5hbWljYWJsZUNhY2hlID0gbnVsbFxuXG5hbWljYWJsZVZhbHVlID0gKG4pIC0+XG4gIGlmIGFtaWNhYmxlQ2FjaGUuaGFzT3duUHJvcGVydHkobilcbiAgICByZXR1cm4gYW1pY2FibGVDYWNoZVtuXVxuICBzdW0gPSAwXG4gIGZvciB2IGluIG1hdGguZGl2aXNvcnMobilcbiAgICBzdW0gKz0gdlxuICBhbWljYWJsZUNhY2hlW25dID0gc3VtXG4gIHJldHVybiBzdW1cblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgYW1pY2FibGVDYWNoZSA9IHt9XG4gIGVxdWFsKGFtaWNhYmxlVmFsdWUoMjIwKSwgMjg0LCBcImFtaWNhYmxlKDIyMCkgPT0gMjg0XCIpXG4gIGVxdWFsKGFtaWNhYmxlVmFsdWUoMjg0KSwgMjIwLCBcImFtaWNhYmxlKDI4NCkgPT0gMjIwXCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgYW1pY2FibGVDYWNoZSA9IHt9XG4gIGFtaWNhYmxlU2VlbiA9IHt9XG4gIGZvciBpIGluIFsyLi4uMTAwMDBdXG4gICAgYSA9IGFtaWNhYmxlVmFsdWUoaSlcbiAgICBiID0gYW1pY2FibGVWYWx1ZShhKVxuICAgIGlmIChhICE9IGIpIGFuZCAoYiA9PSBpKVxuICAgICAgYW1pY2FibGVTZWVuW2FdID0gdHJ1ZVxuICAgICAgYW1pY2FibGVTZWVuW2JdID0gdHJ1ZVxuXG4gIGFtaWNhYmxlTnVtYmVycyA9IChwYXJzZUludCh2KSBmb3IgdiBpbiBPYmplY3Qua2V5cyhhbWljYWJsZVNlZW4pKVxuXG4gIHN1bSA9IDBcbiAgZm9yIHYgaW4gYW1pY2FibGVOdW1iZXJzXG4gICAgc3VtICs9IHZcblxuICByZXR1cm4gc3VtXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAyMjogTmFtZXMgc2NvcmVzXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuVXNpbmcgbmFtZXMudHh0IChyaWdodCBjbGljayBhbmQgJ1NhdmUgTGluay9UYXJnZXQgQXMuLi4nKSwgYSA0NksgdGV4dCBmaWxlIGNvbnRhaW5pbmcgb3ZlciBmaXZlLXRob3VzYW5kIGZpcnN0IG5hbWVzLCBiZWdpbiBieSBzb3J0aW5nIGl0IGludG8gYWxwaGFiZXRpY2FsIG9yZGVyLiBUaGVuIHdvcmtpbmcgb3V0IHRoZSBhbHBoYWJldGljYWwgdmFsdWUgZm9yIGVhY2ggbmFtZSwgbXVsdGlwbHkgdGhpcyB2YWx1ZSBieSBpdHMgYWxwaGFiZXRpY2FsIHBvc2l0aW9uIGluIHRoZSBsaXN0IHRvIG9idGFpbiBhIG5hbWUgc2NvcmUuXG5cbkZvciBleGFtcGxlLCB3aGVuIHRoZSBsaXN0IGlzIHNvcnRlZCBpbnRvIGFscGhhYmV0aWNhbCBvcmRlciwgQ09MSU4sIHdoaWNoIGlzIHdvcnRoIDMgKyAxNSArIDEyICsgOSArIDE0ID0gNTMsIGlzIHRoZSA5Mzh0aCBuYW1lIGluIHRoZSBsaXN0LiBTbywgQ09MSU4gd291bGQgb2J0YWluIGEgc2NvcmUgb2YgOTM4IMOXIDUzID0gNDk3MTQuXG5cbldoYXQgaXMgdGhlIHRvdGFsIG9mIGFsbCB0aGUgbmFtZSBzY29yZXMgaW4gdGhlIGZpbGU/XG5cblwiXCJcIlxuXG5mcyA9IHJlcXVpcmUgXCJmc1wiXG5cbnJlYWROYW1lcyA9IC0+XG4gIHJhd05hbWVzID0gU3RyaW5nKGZzLnJlYWRGaWxlU3luYyhfX2Rpcm5hbWUgKyBcIi8uLi9kYXRhL25hbWVzLnR4dFwiKSlcbiAgbmFtZXMgPSByYXdOYW1lcy5yZXBsYWNlKC9cIi9nbSwgXCJcIikuc3BsaXQoXCIsXCIpXG4gIHJldHVybiBuYW1lc1xuXG5hbHBoYWJldGljYWxWYWx1ZSA9IChuYW1lKSAtPlxuICBzdW0gPSAwXG4gIGZvciBpIGluIFswLi4ubmFtZS5sZW5ndGhdXG4gICAgdiA9IG5hbWUuY2hhckNvZGVBdChpKSAtIDY0ICMgQSBpcyA2NSBpbiBhc2NpaSwgc28gdGhpcyBtYWtlcyB0aGUgdmFsdWUgb2YgJ0EnID09IDFcbiAgICBzdW0gKz0gdlxuICByZXR1cm4gc3VtXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGVxdWFsKGFscGhhYmV0aWNhbFZhbHVlKFwiQ09MSU5cIiksIDUzLCBcImFscGhhYmV0aWNhbCB2YWx1ZSBmb3IgQ09MSU4gaXMgNTNcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICBuYW1lcyA9IHJlYWROYW1lcygpXG4gIG5hbWVzLnNvcnQoKVxuXG4gIHN1bSA9IDBcbiAgZm9yIG5hbWUsIGkgaW4gbmFtZXNcbiAgICB2ID0gYWxwaGFiZXRpY2FsVmFsdWUobmFtZSkgKiAoaSArIDEpXG4gICAgc3VtICs9IHZcbiAgcmV0dXJuIHN1bVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMjM6IE5vbi1hYnVuZGFudCBzdW1zXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5BIHBlcmZlY3QgbnVtYmVyIGlzIGEgbnVtYmVyIGZvciB3aGljaCB0aGUgc3VtIG9mIGl0cyBwcm9wZXIgZGl2aXNvcnMgaXMgZXhhY3RseSBlcXVhbCB0byB0aGUgbnVtYmVyLiBGb3IgZXhhbXBsZSwgdGhlIHN1bSBvZiB0aGUgcHJvcGVyIGRpdmlzb3JzIG9mIDI4IHdvdWxkIGJlIDEgKyAyICsgNCArIDcgKyAxNCA9IDI4LCB3aGljaCBtZWFucyB0aGF0IDI4IGlzIGEgcGVyZmVjdCBudW1iZXIuXG5cbkEgbnVtYmVyIG4gaXMgY2FsbGVkIGRlZmljaWVudCBpZiB0aGUgc3VtIG9mIGl0cyBwcm9wZXIgZGl2aXNvcnMgaXMgbGVzcyB0aGFuIG4gYW5kIGl0IGlzIGNhbGxlZCBhYnVuZGFudCBpZiB0aGlzIHN1bSBleGNlZWRzIG4uXG5cbkFzIDEyIGlzIHRoZSBzbWFsbGVzdCBhYnVuZGFudCBudW1iZXIsIDEgKyAyICsgMyArIDQgKyA2ID0gMTYsIHRoZSBzbWFsbGVzdCBudW1iZXIgdGhhdCBjYW4gYmUgd3JpdHRlbiBhcyB0aGUgc3VtIG9mIHR3byBhYnVuZGFudCBudW1iZXJzIGlzIDI0LiBCeSBtYXRoZW1hdGljYWwgYW5hbHlzaXMsIGl0IGNhbiBiZSBzaG93biB0aGF0IGFsbCBpbnRlZ2VycyBncmVhdGVyIHRoYW4gMjgxMjMgY2FuIGJlIHdyaXR0ZW4gYXMgdGhlIHN1bSBvZiB0d28gYWJ1bmRhbnQgbnVtYmVycy4gSG93ZXZlciwgdGhpcyB1cHBlciBsaW1pdCBjYW5ub3QgYmUgcmVkdWNlZCBhbnkgZnVydGhlciBieSBhbmFseXNpcyBldmVuIHRob3VnaCBpdCBpcyBrbm93biB0aGF0IHRoZSBncmVhdGVzdCBudW1iZXIgdGhhdCBjYW5ub3QgYmUgZXhwcmVzc2VkIGFzIHRoZSBzdW0gb2YgdHdvIGFidW5kYW50IG51bWJlcnMgaXMgbGVzcyB0aGFuIHRoaXMgbGltaXQuXG5cbkZpbmQgdGhlIHN1bSBvZiBhbGwgdGhlIHBvc2l0aXZlIGludGVnZXJzIHdoaWNoIGNhbm5vdCBiZSB3cml0dGVuIGFzIHRoZSBzdW0gb2YgdHdvIGFidW5kYW50IG51bWJlcnMuXG5cblwiXCJcIlxuXG5tYXRoID0gcmVxdWlyZSBcIm1hdGhcIlxuXG5kaXZpc29yU3VtID0gKG4pIC0+XG4gIHJldHVybiBtYXRoLnN1bShtYXRoLmRpdmlzb3JzKG4pKVxuXG5pc0FidW5kYW50ID0gKG4pIC0+XG4gIHJldHVybiAoZGl2aXNvclN1bShuKSA+IG4pXG5cbmlzUGVyZmVjdCA9IChuKSAtPlxuICByZXR1cm4gKGRpdmlzb3JTdW0obikgPT0gbilcblxuYWJ1bmRhbnRMaXN0ID0gLT5cbiAgbGlzdCA9IFtdXG4gIGZvciBuIGluIFsxLi4yODEyM11cbiAgICBpZiBpc0FidW5kYW50KG4pXG4gICAgICBsaXN0LnB1c2ggblxuICByZXR1cm4gbGlzdFxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChpc1BlcmZlY3QoMjgpLCB0cnVlLCBcIjI4IGlzIGEgcGVyZmVjdCBudW1iZXJcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICBsaXN0ID0gYWJ1bmRhbnRMaXN0KClcbiAgY29uc29sZS5sb2cgbGlzdFxuICBzdW1PZkFidW5kYW50c1NlZW4gPSB7fVxuICBmb3IgaSBpbiBsaXN0XG4gICAgZm9yIGogaW4gbGlzdFxuICAgICAgc3VtT2ZBYnVuZGFudHNTZWVuWyBpICsgaiBdID0gdHJ1ZVxuXG4gIHN1bSA9IDBcbiAgZm9yIGkgaW4gWzEuLjI4MTIzXVxuICAgIGlmIG5vdCBzdW1PZkFidW5kYW50c1NlZW5baV1cbiAgICAgIHN1bSArPSBpXG5cbiAgcmV0dXJuIHN1bVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMjQ6IExleGljb2dyYXBoaWMgcGVybXV0YXRpb25zXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5BIHBlcm11dGF0aW9uIGlzIGFuIG9yZGVyZWQgYXJyYW5nZW1lbnQgb2Ygb2JqZWN0cy4gRm9yIGV4YW1wbGUsIDMxMjQgaXMgb25lIHBvc3NpYmxlIHBlcm11dGF0aW9uIG9mIHRoZSBkaWdpdHMgMSwgMiwgMyBhbmQgNC4gSWYgYWxsIG9mIHRoZSBwZXJtdXRhdGlvbnMgYXJlIGxpc3RlZCBudW1lcmljYWxseSBvciBhbHBoYWJldGljYWxseSwgd2UgY2FsbCBpdCBsZXhpY29ncmFwaGljIG9yZGVyLiBUaGUgbGV4aWNvZ3JhcGhpYyBwZXJtdXRhdGlvbnMgb2YgMCwgMSBhbmQgMiBhcmU6XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAwMTIgICAwMjEgICAxMDIgICAxMjAgICAyMDEgICAyMTBcblxuV2hhdCBpcyB0aGUgbWlsbGlvbnRoIGxleGljb2dyYXBoaWMgcGVybXV0YXRpb24gb2YgdGhlIGRpZ2l0cyAwLCAxLCAyLCAzLCA0LCA1LCA2LCA3LCA4IGFuZCA5P1xuXG5cIlwiXCJcblxuIyBUaGlzIGZ1bmN0aW9uIGlzIC13YXktIHRvbyBzbG93XG5wZXJtdXRlID0gKGN1cnJlbnQsIHNyYywgZHN0KSAtPlxuICBmb3IgdixpIGluIHNyY1xuICAgIG5ld2N1cnJlbnQgPSBjdXJyZW50ICsgdlxuICAgIGlmIHNyYy5sZW5ndGggPiAxXG4gICAgICBsZWZ0b3ZlcnMgPSBzcmMuc2xpY2UoMClcbiAgICAgIGxlZnRvdmVycy5zcGxpY2UoaSwgMSlcbiAgICAgIHBlcm11dGUgbmV3Y3VycmVudCwgbGVmdG92ZXJzLCBkc3RcbiAgICBlbHNlXG4gICAgICBkc3QucHVzaCBuZXdjdXJyZW50XG5cbmxleFBlcm11dGVTbG93ID0gKGNoYXJzKSAtPlxuICBkc3QgPSBbXVxuICBwZXJtdXRlKFwiXCIsIGNoYXJzLnNwbGl0KFwiXCIpLCBkc3QpXG4gIGRzdC5zb3J0KClcbiAgcmV0dXJuIGRzdFxuXG5zd2FwID0gKGFyciwgYSwgYikgLT5cbiAgdCA9IGFyclthXVxuICBhcnJbYV0gPSBhcnJbYl1cbiAgYXJyW2JdID0gdFxuXG5kaWprc3RyYVBlcm11dGVOZXh0ID0gKGFycikgLT5cbiAgTiA9IGFyci5sZW5ndGhcbiAgaSA9IE4gLSAxXG4gIHdoaWxlIGFycltpLTFdID49IGFycltpXVxuICAgIGkgPSBpLTFcblxuICBqID0gTlxuICB3aGlsZSAoYXJyW2otMV0gPD0gYXJyW2ktMV0pXG4gICAgaiA9IGotMVxuXG4gIHN3YXAoYXJyLCBpLTEsIGotMSkgICAgIyBzd2FwIHZhbHVlcyBhdCBwb3NpdGlvbnMgKGktMSkgYW5kIChqLTEpXG5cbiAgaSsrXG4gIGogPSBOXG4gIHdoaWxlIChpIDwgailcbiAgICBzd2FwKGFyciwgaS0xLCBqLTEpXG4gICAgaSsrXG4gICAgai0tXG5cbmxleFBlcm11dGVGYXN0ID0gKGNoYXJzLCB3aGljaCkgLT5cbiAgYXJyID0gKHBhcnNlSW50KHYpIGZvciB2IGluIGNoYXJzKVxuICBmb3IgaSBpbiBbMS4uLndoaWNoXVxuICAgIGRpamtzdHJhUGVybXV0ZU5leHQoYXJyKVxuICByZXR1cm4gYXJyLmpvaW4oXCJcIilcblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgZXF1YWwobGV4UGVybXV0ZUZhc3QoXCIwMTJcIiwgNCksIFwiMTIwXCIsIFwiNHRoIHBlcm11dGF0aW9uIG9mIDAxMiBpcyAxMjAsIGZhc3QgdmVyc2lvblwiKVxuICBlcXVhbChsZXhQZXJtdXRlU2xvdyhcIjAxMlwiKSwgXCIwMTIgMDIxIDEwMiAxMjAgMjAxIDIxMFwiLnNwbGl0KFwiIFwiKSwgXCJwZXJtdXRhdGlvbiBvZiAwMTIgaXMgMDEyIDAyMSAxMDIgMTIwIDIwMSAyMTAsIHNsb3cgdmVyc2lvblwiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHJldHVybiBsZXhQZXJtdXRlRmFzdChcIjAxMjM0NTY3ODlcIiwgMTAwMDAwMClcblxuICAjIHNsb3cgdmVyc2lvbiwgdG9vayB+MTMgc2Vjb25kcyBvbiBhIDIwMTQgTWFjYm9vayBQcm9cbiAgIyBkc3QgPSBsZXhQZXJtdXRlU2xvdyhcIjAxMjM0NTY3ODlcIilcbiAgIyByZXR1cm4gZHN0Wzk5OTk5OV0gIyBbMF0gaXMgZmlyc3QsIHRoZXJlZm9yZSBbOTk5OTk5XSBpcyAxLDAwMCwwMDB0aFxuIiwicm9vdCA9IGV4cG9ydHMgPyB0aGlzXG5cbiMgU2lldmUgd2FzIGJsaW5kbHkgdGFrZW4vYWRhcHRlZCBmcm9tIFJvc2V0dGFDb2RlLiBET05UIEVWRU4gQ0FSRVxuY2xhc3MgSW5jcmVtZW50YWxTaWV2ZVxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAbiA9IDBcblxuICBuZXh0OiAtPlxuICAgIEBuICs9IDJcbiAgICBpZiBAbiA8IDdcbiAgICAgIGlmIEBuIDwgM1xuICAgICAgICBAbiA9IDFcbiAgICAgICAgcmV0dXJuIDJcbiAgICAgIGlmIEBuIDwgNVxuICAgICAgICByZXR1cm4gM1xuICAgICAgQGRpY3QgPSB7fVxuICAgICAgQGJwcyA9IG5ldyBJbmNyZW1lbnRhbFNpZXZlKClcbiAgICAgIEBicHMubmV4dCgpXG4gICAgICBAcCA9IEBicHMubmV4dCgpXG4gICAgICBAcSA9IEBwICogQHBcbiAgICAgIHJldHVybiA1XG4gICAgZWxzZVxuICAgICAgcyA9IEBkaWN0W0BuXVxuICAgICAgaWYgbm90IHNcbiAgICAgICAgaWYgQG4gPCBAcVxuICAgICAgICAgIHJldHVybiBAblxuICAgICAgICBlbHNlXG4gICAgICAgICAgcDIgPSBAcCA8PCAxXG4gICAgICAgICAgQGRpY3RbQG4gKyBwMl0gPSBwMlxuICAgICAgICAgIEBwID0gQGJwcy5uZXh0KClcbiAgICAgICAgICBAcSA9IEBwICogQHBcbiAgICAgICAgICByZXR1cm4gQG5leHQoKVxuICAgICAgZWxzZVxuICAgICAgICBkZWxldGUgQGRpY3RbQG5dXG4gICAgICAgIG54dCA9IEBuICsgc1xuICAgICAgICB3aGlsZSAoQGRpY3Rbbnh0XSlcbiAgICAgICAgICBueHQgKz0gc1xuICAgICAgICBAZGljdFtueHRdID0gc1xuICAgICAgICByZXR1cm4gQG5leHQoKVxuXG5yb290LkluY3JlbWVudGFsU2lldmUgPSBJbmNyZW1lbnRhbFNpZXZlXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgU2hhbWVsZXNzbHkgcGlsZmVyZWQvYWRvcHRlZCBmcm9tIGh0dHA6Ly93d3cuamF2YXNjcmlwdGVyLm5ldC9mYXEvbnVtYmVyaXNwcmltZS5odG1cblxucm9vdC5sZWFzdEZhY3RvciA9IChuKSAtPlxuICByZXR1cm4gTmFOIGlmIGlzTmFOKG4pIG9yIG5vdCBpc0Zpbml0ZShuKVxuICByZXR1cm4gMCBpZiBuID09IDBcbiAgcmV0dXJuIDEgaWYgKG4gJSAxKSAhPSAwIG9yIChuICogbikgPCAyXG4gIHJldHVybiAyIGlmIChuICUgMikgPT0gMFxuICByZXR1cm4gMyBpZiAobiAlIDMpID09IDBcbiAgcmV0dXJuIDUgaWYgKG4gJSA1KSA9PSAwXG5cbiAgbSA9IE1hdGguc3FydCBuXG4gIGZvciBpIGluIFs3Li5tXSBieSAzMFxuICAgIHJldHVybiBpICAgIGlmIChuICUgaSkgICAgICA9PSAwXG4gICAgcmV0dXJuIGkrNCAgaWYgKG4gJSAoaSs0KSkgID09IDBcbiAgICByZXR1cm4gaSs2ICBpZiAobiAlIChpKzYpKSAgPT0gMFxuICAgIHJldHVybiBpKzEwIGlmIChuICUgKGkrMTApKSA9PSAwXG4gICAgcmV0dXJuIGkrMTIgaWYgKG4gJSAoaSsxMikpID09IDBcbiAgICByZXR1cm4gaSsxNiBpZiAobiAlIChpKzE2KSkgPT0gMFxuICAgIHJldHVybiBpKzIyIGlmIChuICUgKGkrMjIpKSA9PSAwXG4gICAgcmV0dXJuIGkrMjQgaWYgKG4gJSAoaSsyNCkpID09IDBcblxuICByZXR1cm4gblxuXG5yb290LmlzUHJpbWUgPSAobikgLT5cbiAgaWYgaXNOYU4obikgb3Igbm90IGlzRmluaXRlKG4pIG9yIChuICUgMSkgIT0gMCBvciAobiA8IDIpXG4gICAgcmV0dXJuIGZhbHNlXG4gIGlmIG4gPT0gcm9vdC5sZWFzdEZhY3RvcihuKVxuICAgIHJldHVybiB0cnVlXG5cbiAgcmV0dXJuIGZhbHNlXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxucm9vdC5wcmltZUZhY3RvcnMgPSAobikgLT5cbiAgcmV0dXJuIFsxXSBpZiBuID09IDFcblxuICBmYWN0b3JzID0gW11cbiAgd2hpbGUgbm90IHJvb3QuaXNQcmltZShuKVxuICAgIGZhY3RvciA9IHJvb3QubGVhc3RGYWN0b3IobilcbiAgICBmYWN0b3JzLnB1c2ggZmFjdG9yXG4gICAgbiAvPSBmYWN0b3JcbiAgZmFjdG9ycy5wdXNoIG5cbiAgcmV0dXJuIGZhY3RvcnNcblxuIyBUaGlzIGRvZXMgYSBicnV0ZS1mb3JjZSBhdHRlbXB0IGF0IGNvbWJpbmluZyBhbGwgb2YgdGhlIHByaW1lIGZhY3RvcnMgKDJebiBhdHRlbXB0cykuXG4jIEknbSBzdXJlIHRoZXJlIGlzIGEgY29vbGVyIHdheS5cbnJvb3QuZGl2aXNvcnMgPSAobikgLT5cbiAgcHJpbWVzID0gcm9vdC5wcmltZUZhY3RvcnMobilcbiAgY29tYm9zVG9UcnkgPSBNYXRoLnBvdygyLCBwcmltZXMubGVuZ3RoKVxuICBmYWN0b3JzU2VlbiA9IHt9XG4gIGZvciBhdHRlbXB0IGluIFswLi4uY29tYm9zVG9UcnldXG4gICAgZmFjdG9yID0gMVxuICAgIGZvciB2LGkgaW4gcHJpbWVzXG4gICAgICBpZiAoYXR0ZW1wdCAmICgxIDw8IGkpKVxuICAgICAgICBmYWN0b3IgKj0gdlxuICAgIGlmIGZhY3RvciA8IG5cbiAgICAgIGZhY3RvcnNTZWVuW2ZhY3Rvcl0gPSB0cnVlXG5cbiAgZGl2aXNvckxpc3QgPSAocGFyc2VJbnQodikgZm9yIHYgaW4gT2JqZWN0LmtleXMoZmFjdG9yc1NlZW4pKVxuICByZXR1cm4gZGl2aXNvckxpc3Rcblxucm9vdC5zdW0gPSAobnVtYmVyQXJyYXkpIC0+XG4gIHN1bSA9IDBcbiAgZm9yIG4gaW4gbnVtYmVyQXJyYXlcbiAgICBzdW0gKz0gblxuICByZXR1cm4gc3VtXG5cbnJvb3QuZmFjdG9yaWFsID0gKG4pIC0+XG4gIGYgPSBuXG4gIHdoaWxlIG4gPiAxXG4gICAgbi0tXG4gICAgZiAqPSBuXG4gIHJldHVybiBmXG5cbnJvb3QubkNyID0gKG4sIHIpIC0+XG4gIHJldHVybiBNYXRoLmZsb29yKHJvb3QuZmFjdG9yaWFsKG4pIC8gKHJvb3QuZmFjdG9yaWFsKHIpICogcm9vdC5mYWN0b3JpYWwobiAtIHIpKSlcbiIsIkxBU1RfUFJPQkxFTSA9IDI0XHJcblxyXG5yb290ID0gd2luZG93ICMgZXhwb3J0cyA/IHRoaXNcclxuXHJcbnJvb3QuZXNjYXBlZFN0cmluZ2lmeSA9IChvKSAtPlxyXG4gIHN0ciA9IEpTT04uc3RyaW5naWZ5KG8pXHJcbiAgc3RyID0gc3RyLnJlcGxhY2UoXCJdXCIsIFwiXFxcXF1cIilcclxuICByZXR1cm4gc3RyXHJcblxyXG5yb290LnJ1bkFsbCA9IC0+XHJcbiAgbGFzdFB1enpsZSA9IExBU1RfUFJPQkxFTVxyXG4gIG5leHRJbmRleCA9IDBcclxuXHJcbiAgbG9hZE5leHRTY3JpcHQgPSAtPlxyXG4gICAgaWYgbmV4dEluZGV4IDwgbGFzdFB1enpsZVxyXG4gICAgICBuZXh0SW5kZXgrK1xyXG4gICAgICBydW5UZXN0KG5leHRJbmRleCwgbG9hZE5leHRTY3JpcHQpXHJcbiAgbG9hZE5leHRTY3JpcHQoKVxyXG5cclxucm9vdC5pdGVyYXRlUHJvYmxlbXMgPSAoYXJncykgLT5cclxuXHJcbiAgaW5kZXhUb1Byb2Nlc3MgPSBudWxsXHJcbiAgaWYgYXJncy5lbmRJbmRleCA+IDBcclxuICAgIGlmIGFyZ3Muc3RhcnRJbmRleCA8PSBhcmdzLmVuZEluZGV4XHJcbiAgICAgIGluZGV4VG9Qcm9jZXNzID0gYXJncy5zdGFydEluZGV4XHJcbiAgICAgIGFyZ3Muc3RhcnRJbmRleCsrXHJcbiAgZWxzZVxyXG4gICAgaWYgYXJncy5saXN0Lmxlbmd0aCA+IDBcclxuICAgICAgaW5kZXhUb1Byb2Nlc3MgPSBhcmdzLmxpc3Quc2hpZnQoKVxyXG5cclxuICBpZiBpbmRleFRvUHJvY2VzcyAhPSBudWxsXHJcbiAgICBpdGVyYXRlTmV4dCA9IC0+XHJcbiAgICAgIHdpbmRvdy5hcmdzID0gYXJnc1xyXG4gICAgICBydW5UZXN0IGluZGV4VG9Qcm9jZXNzLCAtPlxyXG4gICAgICAgIGl0ZXJhdGVQcm9ibGVtcyhhcmdzKVxyXG4gICAgaXRlcmF0ZU5leHQoKVxyXG5cclxucm9vdC5ydW5UZXN0ID0gKGluZGV4LCBjYikgLT5cclxuICBtb2R1bGVOYW1lID0gXCJlI3soJzAwMCcraW5kZXgpLnNsaWNlKC0zKX1cIlxyXG4gIHdpbmRvdy5pbmRleCA9IGluZGV4XHJcbiAgcHJvYmxlbSA9IHJlcXVpcmUobW9kdWxlTmFtZSlcclxuICBwcm9ibGVtLnByb2Nlc3MoKVxyXG4gIHdpbmRvdy5zZXRUaW1lb3V0KGNiLCAwKSBpZiBjYlxyXG5cclxuY2xhc3MgUHJvYmxlbVxyXG4gIGNvbnN0cnVjdG9yOiAoQGRlc2NyaXB0aW9uKSAtPlxyXG4gICAgQGluZGV4ID0gd2luZG93LmluZGV4XHJcbiAgICBsaW5lcyA9IEBkZXNjcmlwdGlvbi5zcGxpdCgvXFxuLylcclxuICAgIGxpbmVzLnNoaWZ0KCkgd2hpbGUgbGluZXMubGVuZ3RoID4gMCBhbmQgbGluZXNbMF0ubGVuZ3RoID09IDBcclxuICAgIEB0aXRsZSA9IGxpbmVzLnNoaWZ0KClcclxuICAgIEBsaW5lID0gbGluZXMuc2hpZnQoKVxyXG4gICAgQGRlc2NyaXB0aW9uID0gbGluZXMuam9pbihcIlxcblwiKVxyXG5cclxuICBub3c6IC0+XHJcbiAgICByZXR1cm4gaWYgd2luZG93LnBlcmZvcm1hbmNlIHRoZW4gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpIGVsc2UgbmV3IERhdGUoKS5nZXRUaW1lKClcclxuXHJcbiAgcHJvY2VzczogLT5cclxuICAgIGlmIHdpbmRvdy5hcmdzLmRlc2NyaXB0aW9uXHJcbiAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7IzQ0NDQ0NDtdX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19dXFxuXCJcclxuXHJcbiAgICBmb3JtYXR0ZWRUaXRsZSA9ICQudGVybWluYWwuZm9ybWF0KFwiW1s7I2ZmYWEwMDtdI3tAdGl0bGV9XVwiKVxyXG4gICAgdXJsID0gXCI/Yz0je3dpbmRvdy5hcmdzLmNtZH1fI3tAaW5kZXh9XCJcclxuICAgIGlmIHdpbmRvdy5hcmdzLnZlcmJvc2VcclxuICAgICAgdXJsICs9IFwiX3ZcIlxyXG4gICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCI8YSBocmVmPVxcXCIje3VybH1cXFwiPiN7Zm9ybWF0dGVkVGl0bGV9PC9hPlwiLCB7IHJhdzogdHJ1ZSB9XHJcblxyXG4gICAgaWYgd2luZG93LmFyZ3MuZGVzY3JpcHRpb25cclxuICAgICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjNDQ0NDQ0O10je0BsaW5lfV1cIlxyXG4gICAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIltbOyNjY2NjZWU7XSN7QGRlc2NyaXB0aW9ufV1cXG5cIlxyXG4gICAgICBzb3VyY2VMaW5lID0gJC50ZXJtaW5hbC5mb3JtYXQoXCJbWzsjNDQ0NDQ0O11Tb3VyY2U6XSBcIilcclxuICAgICAgc291cmNlTGluZSArPSBcIiA8YSBocmVmPVxcXCJzcmMvZSN7KCcwMDAnK0BpbmRleCkuc2xpY2UoLTMpfS5jb2ZmZWVcXFwiPlwiICsgJC50ZXJtaW5hbC5mb3JtYXQoXCJbWzsjNzczMzAwO11Mb2NhbF1cIikgKyBcIjwvYT4gXCJcclxuICAgICAgc291cmNlTGluZSArPSAkLnRlcm1pbmFsLmZvcm1hdChcIltbOyM0NDQ0NDQ7XS9dXCIpXHJcbiAgICAgIHNvdXJjZUxpbmUgKz0gXCIgPGEgaHJlZj1cXFwiaHR0cHM6Ly9naXRodWIuY29tL2pvZWRyYWdvL2V1bGVyL2Jsb2IvbWFzdGVyL3NyYy9lI3soJzAwMCcrQGluZGV4KS5zbGljZSgtMyl9LmNvZmZlZVxcXCI+XCIgKyAkLnRlcm1pbmFsLmZvcm1hdChcIltbOyM3NzMzMDA7XUdpdGh1Yl1cIikgKyBcIjwvYT5cIlxyXG4gICAgICB3aW5kb3cudGVybWluYWwuZWNobyBzb3VyY2VMaW5lLCB7IHJhdzogdHJ1ZSB9XHJcbiAgICAgIGlmIHdpbmRvdy5hcmdzLnRlc3Qgb3Igd2luZG93LmFyZ3MuYW5zd2VyXHJcbiAgICAgICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJcIlxyXG5cclxuICAgIHRlc3RGdW5jID0gQHRlc3RcclxuICAgIGFuc3dlckZ1bmMgPSBAYW5zd2VyXHJcblxyXG4gICAgaWYgd2luZG93LmFyZ3MudGVzdFxyXG4gICAgICBpZiB0ZXN0RnVuYyA9PSB1bmRlZmluZWRcclxuICAgICAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIltbOyM0NDQ0NDQ7XSAobm8gdGVzdHMpXVwiXHJcbiAgICAgIGVsc2VcclxuICAgICAgICB0ZXN0RnVuYygpXHJcblxyXG4gICAgaWYgd2luZG93LmFyZ3MuYW5zd2VyXHJcbiAgICAgIHN0YXJ0ID0gQG5vdygpXHJcbiAgICAgIGFuc3dlciA9IGFuc3dlckZ1bmMoKVxyXG4gICAgICBlbmQgPSBAbm93KClcclxuICAgICAgbXMgPSBlbmQgLSBzdGFydFxyXG4gICAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIltbOyNmZmZmZmY7XSAtPiBdW1s7I2FhZmZhYTtdQW5zd2VyOl0gKFtbOyNhYWZmZmY7XSN7bXMudG9GaXhlZCgxKX1tc10pOiBbWzsjZmZmZmZmO10je2VzY2FwZWRTdHJpbmdpZnkoYW5zd2VyKX1dXCJcclxuXHJcbnJvb3QuUHJvYmxlbSA9IFByb2JsZW1cclxuXHJcbnJvb3Qub2sgPSAodiwgbXNnKSAtPlxyXG4gIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2ZmZmZmZjtdICogIF0je3Z9OiAje21zZ31cIlxyXG5cclxucm9vdC5lcXVhbCA9IChhLCBiLCBtc2cpIC0+XHJcbiAgaWYgJC5pc0FycmF5KGEpIGFuZCAkLmlzQXJyYXkoYilcclxuICAgIGlzRXF1YWwgPSAoYS5sZW5ndGggPT0gYi5sZW5ndGgpXHJcbiAgICBpZiBpc0VxdWFsXHJcbiAgICAgIGZvciBpIGluIFswLi4uYS5sZW5ndGhdXHJcbiAgICAgICAgaWYgYVtpXSAhPSBiW2ldXHJcbiAgICAgICAgICBpc0VxdWFsID0gZmFsc2VcclxuICAgICAgICAgIGJyZWFrXHJcbiAgZWxzZVxyXG4gICAgaXNFcXVhbCA9IChhID09IGIpXHJcblxyXG4gIGlmIGlzRXF1YWxcclxuICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2ZmZmZmZjtdICogIF1bWzsjNTU1NTU1O11QQVNTOiAje21zZ31dXCJcclxuICBlbHNlXHJcbiAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIltbOyNmZmZmZmY7XSAqICBdW1s7I2ZmYWFhYTtdRkFJTDogI3ttc2d9ICgje2F9ICE9ICN7Yn0pXVwiXHJcblxyXG5yb290Lm9uQ29tbWFuZCA9IChjb21tYW5kKSA9PlxyXG4gIHJldHVybiBpZiBjb21tYW5kLmxlbmd0aCA9PSAwXHJcbiAgY21kID0gJC50ZXJtaW5hbC5wYXJzZUNvbW1hbmQoY29tbWFuZClcclxuICByZXR1cm4gaWYgY21kLm5hbWUubGVuZ3RoID09IDBcclxuXHJcbiAgYXJncyA9XHJcbiAgICBzdGFydEluZGV4OiAwXHJcbiAgICBlbmRJbmRleDogMFxyXG4gICAgbGlzdDogW11cclxuICAgIHZlcmJvc2U6IGZhbHNlXHJcbiAgICBkZXNjcmlwdGlvbjogZmFsc2VcclxuICAgIHRlc3Q6IGZhbHNlXHJcbiAgICBhbnN3ZXI6IGZhbHNlXHJcblxyXG4gIHByb2Nlc3MgPSB0cnVlXHJcblxyXG4gIGZvciBhcmcgaW4gY21kLmFyZ3NcclxuICAgIGFyZyA9IFN0cmluZyhhcmcpXHJcbiAgICBjb250aW51ZSBpZiBhcmcubGVuZ3RoIDwgMVxyXG4gICAgaWYgYXJnWzBdID09ICd2J1xyXG4gICAgICBhcmdzLnZlcmJvc2UgPSB0cnVlXHJcbiAgICBlbHNlIGlmIGFyZy5tYXRjaCgvXlxcZCskLylcclxuICAgICAgdiA9IHBhcnNlSW50KGFyZylcclxuICAgICAgaWYgKHYgPj0gMSkgYW5kICh2IDw9IExBU1RfUFJPQkxFTSlcclxuICAgICAgICBhcmdzLmxpc3QucHVzaCh2KVxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgcHJvY2VzcyA9IGZhbHNlXHJcbiAgICAgICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjZmZhYWFhO11ObyBzdWNoIHRlc3Q6ICN7dn0gKHZhbGlkIHRlc3RzIDEtI3tMQVNUX1BST0JMRU19KV1cIlxyXG5cclxuICBpZiBhcmdzLmxpc3QubGVuZ3RoID09IDBcclxuICAgIGFyZ3Muc3RhcnRJbmRleCA9IDFcclxuICAgIGFyZ3MuZW5kSW5kZXggPSBMQVNUX1BST0JMRU1cclxuXHJcbiAgIyBTaW5jZSBhbGwgb2Ygb3VyIGNvbW1hbmRzIGhhcHBlbiB0byBoYXZlIHVuaXF1ZSBmaXJzdCBsZXR0ZXJzLCBsZXQgcGVvcGxlIGJlIHN1cGVyIGxhenkvc2lsbHlcclxuICBpZiBjbWQubmFtZVswXSA9PSAnbCdcclxuICAgIGFyZ3MuY21kID0gXCJsaXN0XCJcclxuICBlbHNlIGlmIGNtZC5uYW1lWzBdID09ICdkJ1xyXG4gICAgYXJncy5jbWQgPSBcImRlc2NyaWJlXCJcclxuICAgIGFyZ3MuZGVzY3JpcHRpb24gPSB0cnVlXHJcbiAgZWxzZSBpZiBjbWQubmFtZVswXSA9PSAndCdcclxuICAgIGFyZ3MuY21kID0gXCJ0ZXN0XCJcclxuICAgIGFyZ3MudGVzdCA9IHRydWVcclxuICBlbHNlIGlmIGNtZC5uYW1lWzBdID09ICdhJ1xyXG4gICAgYXJncy5jbWQgPSBcImFuc3dlclwiXHJcbiAgICBhcmdzLmFuc3dlciA9IHRydWVcclxuICBlbHNlIGlmIGNtZC5uYW1lWzBdID09ICdyJ1xyXG4gICAgYXJncy5jbWQgPSBcInJ1blwiXHJcbiAgICBhcmdzLnRlc3QgPSB0cnVlXHJcbiAgICBhcmdzLmFuc3dlciA9IHRydWVcclxuICBlbHNlIGlmIGNtZC5uYW1lWzBdID09ICdkJ1xyXG4gICAgYXJncy5jbWQgPSBcImRlc2NyaWJlXCJcclxuICAgIGFyZ3MuZGVzY3JpcHRpb24gPSB0cnVlXHJcbiAgZWxzZSBpZiBjbWQubmFtZVswXSA9PSAnaCdcclxuICAgIGFyZ3MuY21kID0gXCJoZWxwXCJcclxuICAgIHByb2Nlc3MgPSBmYWxzZVxyXG4gICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJcIlwiXHJcbiAgICBDb21tYW5kczpcclxuXHJcbiAgICAgICAgbGlzdCBbWF0gICAgIC0gTGlzdCBwcm9ibGVtIHRpdGxlc1xyXG4gICAgICAgIGRlc2NyaWJlIFtYXSAtIERpc3BsYXkgZnVsbCBwcm9ibGVtIGRlc2NyaXB0aW9uc1xyXG4gICAgICAgIHRlc3QgW1hdICAgICAtIFJ1biB1bml0IHRlc3RzXHJcbiAgICAgICAgYW5zd2VyIFtYXSAgIC0gVGltZSBhbmQgY2FsY3VsYXRlIGFuc3dlclxyXG4gICAgICAgIHJ1biBbWF0gICAgICAtIHRlc3QgYW5kIGFuc3dlciBjb21iaW5lZFxyXG4gICAgICAgIGhlbHAgICAgICAgICAtIFRoaXMgaGVscFxyXG5cclxuICAgICAgICBJbiBhbGwgb2YgdGhlc2UsIFtYXSBjYW4gYmUgYSBsaXN0IG9mIG9uZSBvciBtb3JlIHByb2JsZW0gbnVtYmVycy4gKGEgdmFsdWUgZnJvbSAxIHRvICN7TEFTVF9QUk9CTEVNfSkuIElmIGFic2VudCwgaXQgaW1wbGllcyBhbGwgcHJvYmxlbXMuXHJcbiAgICAgICAgQWxzbywgYWRkaW5nIHRoZSB3b3JkIFwidmVyYm9zZVwiIHRvIHNvbWUgb2YgdGhlc2UgY29tbWFuZHMgd2lsbCBlbWl0IHRoZSBkZXNjcmlwdGlvbiBiZWZvcmUgcGVyZm9ybWluZyB0aGUgdGFzay5cclxuXHJcbiAgICBcIlwiXCJcclxuICBlbHNlXHJcbiAgICBwcm9jZXNzID0gZmFsc2VcclxuICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2ZmYWFhYTtdVW5rbm93biBjb21tYW5kLl1cIlxyXG5cclxuICBpZiBhcmdzLnZlcmJvc2VcclxuICAgIGFyZ3MuZGVzY3JpcHRpb24gPSB0cnVlXHJcblxyXG4gIGlmIHByb2Nlc3NcclxuICAgIGl0ZXJhdGVQcm9ibGVtcyhhcmdzKVxyXG4iXX0=
