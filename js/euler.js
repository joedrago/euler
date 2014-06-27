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
},{"buffer":2}],"math":[function(require,module,exports){
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

LAST_PROBLEM = 22;

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2JpZy1pbnRlZ2VyL0JpZ0ludGVnZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCIuLi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwiLi4vc3JjL2UwMDEuY29mZmVlIiwiLi4vc3JjL2UwMDIuY29mZmVlIiwiLi4vc3JjL2UwMDMuY29mZmVlIiwiLi4vc3JjL2UwMDQuY29mZmVlIiwiLi4vc3JjL2UwMDUuY29mZmVlIiwiLi4vc3JjL2UwMDYuY29mZmVlIiwiLi4vc3JjL2UwMDcuY29mZmVlIiwiLi4vc3JjL2UwMDguY29mZmVlIiwiLi4vc3JjL2UwMDkuY29mZmVlIiwiLi4vc3JjL2UwMTAuY29mZmVlIiwiLi4vc3JjL2UwMTEuY29mZmVlIiwiLi4vc3JjL2UwMTIuY29mZmVlIiwiLi4vc3JjL2UwMTMuY29mZmVlIiwiLi4vc3JjL2UwMTQuY29mZmVlIiwiLi4vc3JjL2UwMTUuY29mZmVlIiwiLi4vc3JjL2UwMTYuY29mZmVlIiwiLi4vc3JjL2UwMTcuY29mZmVlIiwiLi4vc3JjL2UwMTguY29mZmVlIiwiLi4vc3JjL2UwMTkuY29mZmVlIiwiLi4vc3JjL2UwMjAuY29mZmVlIiwiLi4vc3JjL2UwMjEuY29mZmVlIiwiLi4vc3JjL2UwMjIuY29mZmVlIiwiLi4vc3JjL21hdGguY29mZmVlIiwiLi4vc3JjL3Rlcm1pbmFsLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDallBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzduQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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LElBQUcsR0FBRyxDQUFDLElBQUssQ0FBQSxDQUFBLENBQVQsS0FBZSxHQUFsQjtBQUNILE1BQUEsSUFBSSxDQUFDLEdBQUwsR0FBVyxVQUFYLENBQUE7QUFBQSxNQUNBLElBQUksQ0FBQyxXQUFMLEdBQW1CLElBRG5CLENBREc7S0FBQSxNQUdBLElBQUcsR0FBRyxDQUFDLElBQUssQ0FBQSxDQUFBLENBQVQsS0FBZSxHQUFsQjtBQUNILE1BQUEsSUFBSSxDQUFDLEdBQUwsR0FBVyxNQUFYLENBQUE7QUFBQSxNQUNBLE9BQUEsR0FBVSxLQURWLENBQUE7QUFBQSxNQUVBLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBaEIsQ0FBd0IscVdBQUEsR0FVa0MsWUFWbEMsR0FVZ0QsaUtBVnhFLENBRkEsQ0FERztLQUFBLE1BQUE7QUFrQkgsTUFBQSxPQUFBLEdBQVUsS0FBVixDQUFBO0FBQUEsTUFDQSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQWhCLENBQXFCLCtCQUFyQixDQURBLENBbEJHO0tBbkRMO0FBd0VBLElBQUEsSUFBRyxJQUFJLENBQUMsT0FBUjtBQUNFLE1BQUEsSUFBSSxDQUFDLFdBQUwsR0FBbUIsSUFBbkIsQ0FERjtLQXhFQTtBQTJFQSxJQUFBLElBQUcsT0FBSDthQUNFLGVBQUEsQ0FBZ0IsSUFBaEIsRUFERjtLQTVFZTtFQUFBLEVBQUE7QUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBeEdqQixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgYmlnSW50ID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBiYXNlID0gMTAwMDAwMDAsIGxvZ0Jhc2UgPSA3O1xyXG4gICAgdmFyIHNpZ24gPSB7XHJcbiAgICAgICAgcG9zaXRpdmU6IGZhbHNlLFxyXG4gICAgICAgIG5lZ2F0aXZlOiB0cnVlXHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBub3JtYWxpemUgPSBmdW5jdGlvbiAoZmlyc3QsIHNlY29uZCkge1xyXG4gICAgICAgIHZhciBhID0gZmlyc3QudmFsdWUsIGIgPSBzZWNvbmQudmFsdWU7XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IGEubGVuZ3RoID4gYi5sZW5ndGggPyBhLmxlbmd0aCA6IGIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgYVtpXSA9IGFbaV0gfHwgMDtcclxuICAgICAgICAgICAgYltpXSA9IGJbaV0gfHwgMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IGxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIGlmIChhW2ldID09PSAwICYmIGJbaV0gPT09IDApIHtcclxuICAgICAgICAgICAgICAgIGEucG9wKCk7XHJcbiAgICAgICAgICAgICAgICBiLnBvcCgpO1xyXG4gICAgICAgICAgICB9IGVsc2UgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghYS5sZW5ndGgpIGEgPSBbMF0sIGIgPSBbMF07XHJcbiAgICAgICAgZmlyc3QudmFsdWUgPSBhO1xyXG4gICAgICAgIHNlY29uZC52YWx1ZSA9IGI7XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBwYXJzZSA9IGZ1bmN0aW9uICh0ZXh0LCBmaXJzdCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGV4dCA9PT0gXCJvYmplY3RcIikgcmV0dXJuIHRleHQ7XHJcbiAgICAgICAgdGV4dCArPSBcIlwiO1xyXG4gICAgICAgIHZhciBzID0gc2lnbi5wb3NpdGl2ZSwgdmFsdWUgPSBbXTtcclxuICAgICAgICBpZiAodGV4dFswXSA9PT0gXCItXCIpIHtcclxuICAgICAgICAgICAgcyA9IHNpZ24ubmVnYXRpdmU7XHJcbiAgICAgICAgICAgIHRleHQgPSB0ZXh0LnNsaWNlKDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdGV4dCA9IHRleHQuc3BsaXQoXCJlXCIpO1xyXG4gICAgICAgIGlmICh0ZXh0Lmxlbmd0aCA+IDIpIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgaW50ZWdlclwiKTtcclxuICAgICAgICBpZiAodGV4dFsxXSkge1xyXG4gICAgICAgICAgICB2YXIgZXhwID0gdGV4dFsxXTtcclxuICAgICAgICAgICAgaWYgKGV4cFswXSA9PT0gXCIrXCIpIGV4cCA9IGV4cC5zbGljZSgxKTtcclxuICAgICAgICAgICAgZXhwID0gcGFyc2UoZXhwKTtcclxuICAgICAgICAgICAgaWYgKGV4cC5sZXNzZXIoMCkpIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBpbmNsdWRlIG5lZ2F0aXZlIGV4cG9uZW50IHBhcnQgZm9yIGludGVnZXJzXCIpO1xyXG4gICAgICAgICAgICB3aGlsZSAoZXhwLm5vdEVxdWFscygwKSkge1xyXG4gICAgICAgICAgICAgICAgdGV4dFswXSArPSBcIjBcIjtcclxuICAgICAgICAgICAgICAgIGV4cCA9IGV4cC5wcmV2KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGV4dCA9IHRleHRbMF07XHJcbiAgICAgICAgaWYgKHRleHQgPT09IFwiLTBcIikgdGV4dCA9IFwiMFwiO1xyXG4gICAgICAgIHZhciBpc1ZhbGlkID0gL14oWzAtOV1bMC05XSopJC8udGVzdCh0ZXh0KTtcclxuICAgICAgICBpZiAoIWlzVmFsaWQpIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgaW50ZWdlclwiKTtcclxuICAgICAgICB3aGlsZSAodGV4dC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGRpdmlkZXIgPSB0ZXh0Lmxlbmd0aCA+IGxvZ0Jhc2UgPyB0ZXh0Lmxlbmd0aCAtIGxvZ0Jhc2UgOiAwO1xyXG4gICAgICAgICAgICB2YWx1ZS5wdXNoKCt0ZXh0LnNsaWNlKGRpdmlkZXIpKTtcclxuICAgICAgICAgICAgdGV4dCA9IHRleHQuc2xpY2UoMCwgZGl2aWRlcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB2YWwgPSBiaWdJbnQodmFsdWUsIHMpO1xyXG4gICAgICAgIGlmIChmaXJzdCkgbm9ybWFsaXplKGZpcnN0LCB2YWwpO1xyXG4gICAgICAgIHJldHVybiB2YWw7XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBnb2VzSW50byA9IGZ1bmN0aW9uIChhLCBiKSB7XHJcbiAgICAgICAgdmFyIGEgPSBiaWdJbnQoYSwgc2lnbi5wb3NpdGl2ZSksIGIgPSBiaWdJbnQoYiwgc2lnbi5wb3NpdGl2ZSk7XHJcbiAgICAgICAgaWYgKGEuZXF1YWxzKDApKSB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZGl2aWRlIGJ5IDBcIik7XHJcbiAgICAgICAgdmFyIG4gPSAwO1xyXG4gICAgICAgIGRvIHtcclxuICAgICAgICAgICAgdmFyIGluYyA9IDE7XHJcbiAgICAgICAgICAgIHZhciBjID0gYmlnSW50KGEudmFsdWUsIHNpZ24ucG9zaXRpdmUpLCB0ID0gYy50aW1lcygxMCk7XHJcbiAgICAgICAgICAgIHdoaWxlICh0Lmxlc3NlcihiKSkge1xyXG4gICAgICAgICAgICAgICAgYyA9IHQ7XHJcbiAgICAgICAgICAgICAgICBpbmMgKj0gMTA7XHJcbiAgICAgICAgICAgICAgICB0ID0gdC50aW1lcygxMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgd2hpbGUgKGMubGVzc2VyT3JFcXVhbHMoYikpIHtcclxuICAgICAgICAgICAgICAgIGIgPSBiLm1pbnVzKGMpO1xyXG4gICAgICAgICAgICAgICAgbiArPSBpbmM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IHdoaWxlIChhLmxlc3Nlck9yRXF1YWxzKGIpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVtYWluZGVyOiBiLnZhbHVlLFxyXG4gICAgICAgICAgICByZXN1bHQ6IG5cclxuICAgICAgICB9O1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgYmlnSW50ID0gZnVuY3Rpb24gKHZhbHVlLCBzKSB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB7XHJcbiAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcclxuICAgICAgICAgICAgc2lnbjogc1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFyIG8gPSB7XHJcbiAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcclxuICAgICAgICAgICAgc2lnbjogcyxcclxuICAgICAgICAgICAgbmVnYXRlOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gbSB8fCBzZWxmO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpZ0ludChmaXJzdC52YWx1ZSwgIWZpcnN0LnNpZ24pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBhYnM6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBtIHx8IHNlbGY7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYmlnSW50KGZpcnN0LnZhbHVlLCBzaWduLnBvc2l0aXZlKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYWRkOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHMsIGZpcnN0ID0gc2VsZiwgc2Vjb25kO1xyXG4gICAgICAgICAgICAgICAgaWYgKG0pIChmaXJzdCA9IHBhcnNlKG4pKSAmJiAoc2Vjb25kID0gcGFyc2UobSkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBzZWNvbmQgPSBwYXJzZShuLCBmaXJzdCk7XHJcbiAgICAgICAgICAgICAgICBzID0gZmlyc3Quc2lnbjtcclxuICAgICAgICAgICAgICAgIGlmIChmaXJzdC5zaWduICE9PSBzZWNvbmQuc2lnbikge1xyXG4gICAgICAgICAgICAgICAgICAgIGZpcnN0ID0gYmlnSW50KGZpcnN0LnZhbHVlLCBzaWduLnBvc2l0aXZlKTtcclxuICAgICAgICAgICAgICAgICAgICBzZWNvbmQgPSBiaWdJbnQoc2Vjb25kLnZhbHVlLCBzaWduLnBvc2l0aXZlKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcyA9PT0gc2lnbi5wb3NpdGl2ZSA/XHJcblx0XHRcdFx0XHRcdG8uc3VidHJhY3QoZmlyc3QsIHNlY29uZCkgOlxyXG5cdFx0XHRcdFx0XHRvLnN1YnRyYWN0KHNlY29uZCwgZmlyc3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbm9ybWFsaXplKGZpcnN0LCBzZWNvbmQpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSBmaXJzdC52YWx1ZSwgYiA9IHNlY29uZC52YWx1ZTtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuXHRcdFx0XHRcdGNhcnJ5ID0gMDtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGggfHwgY2FycnkgPiAwOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc3VtID0gKGFbaV0gfHwgMCkgKyAoYltpXSB8fCAwKSArIGNhcnJ5O1xyXG4gICAgICAgICAgICAgICAgICAgIGNhcnJ5ID0gc3VtID49IGJhc2UgPyAxIDogMDtcclxuICAgICAgICAgICAgICAgICAgICBzdW0gLT0gY2FycnkgKiBiYXNlO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHN1bSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYmlnSW50KHJlc3VsdCwgcyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHBsdXM6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5hZGQobiwgbSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN1YnRyYWN0OiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gc2VsZiwgc2Vjb25kO1xyXG4gICAgICAgICAgICAgICAgaWYgKG0pIChmaXJzdCA9IHBhcnNlKG4pKSAmJiAoc2Vjb25kID0gcGFyc2UobSkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBzZWNvbmQgPSBwYXJzZShuLCBmaXJzdCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3Quc2lnbiAhPT0gc2Vjb25kLnNpZ24pIHJldHVybiBvLmFkZChmaXJzdCwgby5uZWdhdGUoc2Vjb25kKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3Quc2lnbiA9PT0gc2lnbi5uZWdhdGl2ZSkgcmV0dXJuIG8uc3VidHJhY3Qoby5uZWdhdGUoc2Vjb25kKSwgby5uZWdhdGUoZmlyc3QpKTtcclxuICAgICAgICAgICAgICAgIGlmIChvLmNvbXBhcmUoZmlyc3QsIHNlY29uZCkgPT09IC0xKSByZXR1cm4gby5uZWdhdGUoby5zdWJ0cmFjdChzZWNvbmQsIGZpcnN0KSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgYSA9IGZpcnN0LnZhbHVlLCBiID0gc2Vjb25kLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG5cdFx0XHRcdFx0Ym9ycm93ID0gMDtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0bXAgPSBhW2ldIC0gYm9ycm93O1xyXG4gICAgICAgICAgICAgICAgICAgIGJvcnJvdyA9IHRtcCA8IGJbaV0gPyAxIDogMDtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbWludWVuZCA9IChib3Jyb3cgKiBiYXNlKSArIHRtcCAtIGJbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobWludWVuZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYmlnSW50KHJlc3VsdCwgc2lnbi5wb3NpdGl2ZSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG1pbnVzOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uc3VidHJhY3QobiwgbSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG11bHRpcGx5OiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHMsIGZpcnN0ID0gc2VsZiwgc2Vjb25kO1xyXG4gICAgICAgICAgICAgICAgaWYgKG0pIChmaXJzdCA9IHBhcnNlKG4pKSAmJiAoc2Vjb25kID0gcGFyc2UobSkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBzZWNvbmQgPSBwYXJzZShuLCBmaXJzdCk7XHJcbiAgICAgICAgICAgICAgICBzID0gZmlyc3Quc2lnbiAhPT0gc2Vjb25kLnNpZ247XHJcbiAgICAgICAgICAgICAgICB2YXIgYSA9IGZpcnN0LnZhbHVlLCBiID0gc2Vjb25kLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdFN1bSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0U3VtW2ldID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGogPSBpO1xyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChqLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0U3VtW2ldLnB1c2goMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGNhcnJ5ID0gMDtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB4ID0gYVtpXTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGIubGVuZ3RoIHx8IGNhcnJ5ID4gMDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB5ID0gYltqXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByb2R1Y3QgPSB5ID8gKHggKiB5KSArIGNhcnJ5IDogY2Fycnk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcnJ5ID0gcHJvZHVjdCA+IGJhc2UgPyBNYXRoLmZsb29yKHByb2R1Y3QgLyBiYXNlKSA6IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3QgLT0gY2FycnkgKiBiYXNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRTdW1baV0ucHVzaChwcm9kdWN0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgbWF4ID0gLTE7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3VsdFN1bS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsZW4gPSByZXN1bHRTdW1baV0ubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsZW4gPiBtYXgpIG1heCA9IGxlbjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXSwgY2FycnkgPSAwO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtYXggfHwgY2FycnkgPiAwOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc3VtID0gY2Fycnk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCByZXN1bHRTdW0ubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VtICs9IHJlc3VsdFN1bVtqXVtpXSB8fCAwO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjYXJyeSA9IHN1bSA+IGJhc2UgPyBNYXRoLmZsb29yKHN1bSAvIGJhc2UpIDogMDtcclxuICAgICAgICAgICAgICAgICAgICBzdW0gLT0gY2FycnkgKiBiYXNlO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHN1bSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYmlnSW50KHJlc3VsdCwgcyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHRpbWVzOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8ubXVsdGlwbHkobiwgbSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGRpdm1vZDogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBzLCBmaXJzdCA9IHNlbGYsIHNlY29uZDtcclxuICAgICAgICAgICAgICAgIGlmIChtKSAoZmlyc3QgPSBwYXJzZShuKSkgJiYgKHNlY29uZCA9IHBhcnNlKG0pKTtcclxuICAgICAgICAgICAgICAgIGVsc2Ugc2Vjb25kID0gcGFyc2UobiwgZmlyc3QpO1xyXG4gICAgICAgICAgICAgICAgcyA9IGZpcnN0LnNpZ24gIT09IHNlY29uZC5zaWduO1xyXG4gICAgICAgICAgICAgICAgaWYgKGJpZ0ludChmaXJzdC52YWx1ZSwgZmlyc3Quc2lnbikuZXF1YWxzKDApKSByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHF1b3RpZW50OiBiaWdJbnQoWzBdLCBzaWduLnBvc2l0aXZlKSxcclxuICAgICAgICAgICAgICAgICAgICByZW1haW5kZXI6IGJpZ0ludChbMF0sIHNpZ24ucG9zaXRpdmUpXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlY29uZC5lcXVhbHMoMCkpIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBkaXZpZGUgYnkgemVyb1wiKTtcclxuICAgICAgICAgICAgICAgIHZhciBhID0gZmlyc3QudmFsdWUsIGIgPSBzZWNvbmQudmFsdWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gW10sIHJlbWFpbmRlciA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IGEubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbiA9IFthW2ldXS5jb25jYXQocmVtYWluZGVyKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcXVvdGllbnQgPSBnb2VzSW50byhiLCBuKTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChxdW90aWVudC5yZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbWFpbmRlciA9IHF1b3RpZW50LnJlbWFpbmRlcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlc3VsdC5yZXZlcnNlKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHF1b3RpZW50OiBiaWdJbnQocmVzdWx0LCBzKSxcclxuICAgICAgICAgICAgICAgICAgICByZW1haW5kZXI6IGJpZ0ludChyZW1haW5kZXIsIGZpcnN0LnNpZ24pXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBkaXZpZGU6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5kaXZtb2QobiwgbSkucXVvdGllbnQ7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG92ZXI6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5kaXZpZGUobiwgbSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG1vZDogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmRpdm1vZChuLCBtKS5yZW1haW5kZXI7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHJlbWFpbmRlcjogZnVuY3Rpb24obiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8ubW9kKG4sIG0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwb3c6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBzZWxmLCBzZWNvbmQ7XHJcbiAgICAgICAgICAgICAgICBpZiAobSkgKGZpcnN0ID0gcGFyc2UobikpICYmIChzZWNvbmQgPSBwYXJzZShtKSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHNlY29uZCA9IHBhcnNlKG4sIGZpcnN0KTtcclxuICAgICAgICAgICAgICAgIHZhciBhID0gZmlyc3QsIGIgPSBzZWNvbmQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoYmlnSW50KGEudmFsdWUsIGEuc2lnbikuZXF1YWxzKDApKSByZXR1cm4gWkVSTztcclxuICAgICAgICAgICAgICAgIGlmIChiLmxlc3NlcigwKSkgcmV0dXJuIFpFUk87XHJcbiAgICAgICAgICAgICAgICBpZiAoYi5lcXVhbHMoMCkpIHJldHVybiBPTkU7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gYmlnSW50KGEudmFsdWUsIGEuc2lnbik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGIubW9kKDIpLmVxdWFscygwKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjID0gcmVzdWx0LnBvdyhiLm92ZXIoMikpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjLnRpbWVzKGMpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LnRpbWVzKHJlc3VsdC5wb3coYi5taW51cygxKSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBuZXh0OiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gbSB8fCBzZWxmO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uYWRkKGZpcnN0LCAxKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcHJldjogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IG0gfHwgc2VsZjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLnN1YnRyYWN0KGZpcnN0LCAxKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY29tcGFyZTogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHNlbGYsIHNlY29uZDtcclxuICAgICAgICAgICAgICAgIGlmIChtKSAoZmlyc3QgPSBwYXJzZShuKSkgJiYgKHNlY29uZCA9IHBhcnNlKG0sIGZpcnN0KSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHNlY29uZCA9IHBhcnNlKG4sIGZpcnN0KTtcclxuICAgICAgICAgICAgICAgIG5vcm1hbGl6ZShmaXJzdCwgc2Vjb25kKTtcclxuICAgICAgICAgICAgICAgIGlmIChmaXJzdC52YWx1ZS5sZW5ndGggPT09IDEgJiYgc2Vjb25kLnZhbHVlLmxlbmd0aCA9PT0gMSAmJiBmaXJzdC52YWx1ZVswXSA9PT0gMCAmJiBzZWNvbmQudmFsdWVbMF0gPT09IDApIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlY29uZC5zaWduICE9PSBmaXJzdC5zaWduKSByZXR1cm4gZmlyc3Quc2lnbiA9PT0gc2lnbi5wb3NpdGl2ZSA/IDEgOiAtMTtcclxuICAgICAgICAgICAgICAgIHZhciBtdWx0aXBsaWVyID0gZmlyc3Quc2lnbiA9PT0gc2lnbi5wb3NpdGl2ZSA/IDEgOiAtMTtcclxuICAgICAgICAgICAgICAgIHZhciBhID0gZmlyc3QudmFsdWUsIGIgPSBzZWNvbmQudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhW2ldID4gYltpXSkgcmV0dXJuIDEgKiBtdWx0aXBsaWVyO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChiW2ldID4gYVtpXSkgcmV0dXJuIC0xICogbXVsdGlwbGllcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjb21wYXJlVG86IGZ1bmN0aW9uKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmNvbXBhcmUobiwgbSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNvbXBhcmVBYnM6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBzZWxmLCBzZWNvbmQ7XHJcbiAgICAgICAgICAgICAgICBpZiAobSkgKGZpcnN0ID0gcGFyc2UobikpICYmIChzZWNvbmQgPSBwYXJzZShtLCBmaXJzdCkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBzZWNvbmQgPSBwYXJzZShuLCBmaXJzdCk7XHJcbiAgICAgICAgICAgICAgICBmaXJzdC5zaWduID0gc2Vjb25kLnNpZ24gPSBzaWduLnBvc2l0aXZlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uY29tcGFyZShmaXJzdCwgc2Vjb25kKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXF1YWxzOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uY29tcGFyZShuLCBtKSA9PT0gMDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbm90RXF1YWxzOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICFvLmVxdWFscyhuLCBtKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbGVzc2VyOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uY29tcGFyZShuLCBtKSA8IDA7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGdyZWF0ZXI6IGZ1bmN0aW9uIChuLCBtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gby5jb21wYXJlKG4sIG0pID4gMDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZ3JlYXRlck9yRXF1YWxzOiBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8uY29tcGFyZShuLCBtKSA+PSAwO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBsZXNzZXJPckVxdWFsczogZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvLmNvbXBhcmUobiwgbSkgPD0gMDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgaXNQb3NpdGl2ZTogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IG0gfHwgc2VsZjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmaXJzdC5zaWduID09PSBzaWduLnBvc2l0aXZlO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBpc05lZ2F0aXZlOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gbSB8fCBzZWxmO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpcnN0LnNpZ24gPT09IHNpZ24ubmVnYXRpdmU7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGlzRXZlbjogZnVuY3Rpb24gKG0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IG0gfHwgc2VsZjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmaXJzdC52YWx1ZVswXSAlIDIgPT09IDA7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGlzT2RkOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gbSB8fCBzZWxmO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpcnN0LnZhbHVlWzBdICUgMiA9PT0gMTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdG9TdHJpbmc6IGZ1bmN0aW9uIChtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSBtIHx8IHNlbGY7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RyID0gXCJcIiwgbGVuID0gZmlyc3QudmFsdWUubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGxlbi0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpcnN0LnZhbHVlW2xlbl0udG9TdHJpbmcoKS5sZW5ndGggPT09IDgpIHN0ciArPSBmaXJzdC52YWx1ZVtsZW5dO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Ugc3RyICs9IChiYXNlLnRvU3RyaW5nKCkgKyBmaXJzdC52YWx1ZVtsZW5dKS5zbGljZSgtbG9nQmFzZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoc3RyWzBdID09PSBcIjBcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0ciA9IHN0ci5zbGljZSgxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICghc3RyLmxlbmd0aCkgc3RyID0gXCIwXCI7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RyID09PSBcIjBcIikgcmV0dXJuIHN0cjtcclxuICAgICAgICAgICAgICAgIHZhciBzID0gZmlyc3Quc2lnbiA9PT0gc2lnbi5wb3NpdGl2ZSA/IFwiXCIgOiBcIi1cIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzICsgc3RyO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0b0pTTnVtYmVyOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICtvLnRvU3RyaW5nKG0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB2YWx1ZU9mOiBmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG8udG9KU051bWJlcihtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIG87XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBaRVJPID0gYmlnSW50KFswXSwgc2lnbi5wb3NpdGl2ZSk7XHJcbiAgICB2YXIgT05FID0gYmlnSW50KFsxXSwgc2lnbi5wb3NpdGl2ZSk7XHJcbiAgICB2YXIgTUlOVVNfT05FID0gYmlnSW50KFsxXSwgc2lnbi5uZWdhdGl2ZSk7XHJcblxyXG4gICAgdmFyIHBhcnNlQmFzZSA9IGZ1bmN0aW9uICh0ZXh0LCBiYXNlKSB7XHJcbiAgICAgICAgYmFzZSA9IHBhcnNlKGJhc2UpO1xyXG4gICAgICAgIHZhciB2YWwgPSBaRVJPO1xyXG4gICAgICAgIHZhciBkaWdpdHMgPSBbXTtcclxuICAgICAgICB2YXIgaTtcclxuICAgICAgICB2YXIgaXNOZWdhdGl2ZSA9IGZhbHNlO1xyXG4gICAgICAgIGZ1bmN0aW9uIHBhcnNlVG9rZW4odGV4dCkge1xyXG4gICAgICAgICAgICB2YXIgYyA9IHRleHRbaV0udG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgaWYgKGkgPT09IDAgJiYgdGV4dFtpXSA9PT0gXCItXCIpIHtcclxuICAgICAgICAgICAgICAgIGlzTmVnYXRpdmUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICgvWzAtOV0vLnRlc3QoYykpIGRpZ2l0cy5wdXNoKHBhcnNlKGMpKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAoL1thLXpdLy50ZXN0KGMpKSBkaWdpdHMucHVzaChwYXJzZShjLmNoYXJDb2RlQXQoMCkgLSA4NykpO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChjID09PSBcIjxcIikge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0ID0gaTtcclxuICAgICAgICAgICAgICAgIGRvIGkrKzsgd2hpbGUgKHRleHRbaV0gIT09IFwiPlwiKTtcclxuICAgICAgICAgICAgICAgIGRpZ2l0cy5wdXNoKHBhcnNlKHRleHQuc2xpY2Uoc3RhcnQgKyAxLCBpKSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKGMgKyBcIiBpcyBub3QgYSB2YWxpZCBjaGFyYWN0ZXJcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0ZXh0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHBhcnNlVG9rZW4odGV4dCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRpZ2l0cy5yZXZlcnNlKCk7XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGRpZ2l0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YWwgPSB2YWwuYWRkKGRpZ2l0c1tpXS50aW1lcyhiYXNlLnBvdyhpKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaXNOZWdhdGl2ZSA/IC12YWwgOiB2YWw7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGZuUmV0dXJuID0gZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGEgPT09IFwidW5kZWZpbmVkXCIpIHJldHVybiBaRVJPO1xyXG4gICAgICAgIGlmICh0eXBlb2YgYiAhPT0gXCJ1bmRlZmluZWRcIikgcmV0dXJuIHBhcnNlQmFzZShhLCBiKTtcclxuICAgICAgICByZXR1cm4gcGFyc2UoYSk7XHJcbiAgICB9O1xyXG4gICAgZm5SZXR1cm4uemVybyA9IFpFUk87XHJcbiAgICBmblJldHVybi5vbmUgPSBPTkU7XHJcbiAgICBmblJldHVybi5taW51c09uZSA9IE1JTlVTX09ORTtcclxuICAgIHJldHVybiBmblJldHVybjtcclxufSkoKTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGJpZ0ludDtcclxufSIsIi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxuXG5leHBvcnRzLkJ1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5TbG93QnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTJcblxuLyoqXG4gKiBJZiBgQnVmZmVyLl91c2VUeXBlZEFycmF5c2A6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBVc2UgT2JqZWN0IGltcGxlbWVudGF0aW9uIChjb21wYXRpYmxlIGRvd24gdG8gSUU2KVxuICovXG5CdWZmZXIuX3VzZVR5cGVkQXJyYXlzID0gKGZ1bmN0aW9uICgpIHtcbiAgLy8gRGV0ZWN0IGlmIGJyb3dzZXIgc3VwcG9ydHMgVHlwZWQgQXJyYXlzLiBTdXBwb3J0ZWQgYnJvd3NlcnMgYXJlIElFIDEwKywgRmlyZWZveCA0KyxcbiAgLy8gQ2hyb21lIDcrLCBTYWZhcmkgNS4xKywgT3BlcmEgMTEuNissIGlPUyA0LjIrLiBJZiB0aGUgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IGFkZGluZ1xuICAvLyBwcm9wZXJ0aWVzIHRvIGBVaW50OEFycmF5YCBpbnN0YW5jZXMsIHRoZW4gdGhhdCdzIHRoZSBzYW1lIGFzIG5vIGBVaW50OEFycmF5YCBzdXBwb3J0XG4gIC8vIGJlY2F1c2Ugd2UgbmVlZCB0byBiZSBhYmxlIHRvIGFkZCBhbGwgdGhlIG5vZGUgQnVmZmVyIEFQSSBtZXRob2RzLiBUaGlzIGlzIGFuIGlzc3VlXG4gIC8vIGluIEZpcmVmb3ggNC0yOS4gTm93IGZpeGVkOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTU0MzhcbiAgdHJ5IHtcbiAgICB2YXIgYnVmID0gbmV3IEFycmF5QnVmZmVyKDApXG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KGJ1ZilcbiAgICBhcnIuZm9vID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfVxuICAgIHJldHVybiA0MiA9PT0gYXJyLmZvbygpICYmXG4gICAgICAgIHR5cGVvZiBhcnIuc3ViYXJyYXkgPT09ICdmdW5jdGlvbicgLy8gQ2hyb21lIDktMTAgbGFjayBgc3ViYXJyYXlgXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufSkoKVxuXG4vKipcbiAqIENsYXNzOiBCdWZmZXJcbiAqID09PT09PT09PT09PT1cbiAqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGFyZSBhdWdtZW50ZWRcbiAqIHdpdGggZnVuY3Rpb24gcHJvcGVydGllcyBmb3IgYWxsIHRoZSBub2RlIGBCdWZmZXJgIEFQSSBmdW5jdGlvbnMuIFdlIHVzZVxuICogYFVpbnQ4QXJyYXlgIHNvIHRoYXQgc3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXQgcmV0dXJuc1xuICogYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogQnkgYXVnbWVudGluZyB0aGUgaW5zdGFuY2VzLCB3ZSBjYW4gYXZvaWQgbW9kaWZ5aW5nIHRoZSBgVWludDhBcnJheWBcbiAqIHByb3RvdHlwZS5cbiAqL1xuZnVuY3Rpb24gQnVmZmVyIChzdWJqZWN0LCBlbmNvZGluZywgbm9aZXJvKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBCdWZmZXIpKVxuICAgIHJldHVybiBuZXcgQnVmZmVyKHN1YmplY3QsIGVuY29kaW5nLCBub1plcm8pXG5cbiAgdmFyIHR5cGUgPSB0eXBlb2Ygc3ViamVjdFxuXG4gIC8vIFdvcmthcm91bmQ6IG5vZGUncyBiYXNlNjQgaW1wbGVtZW50YXRpb24gYWxsb3dzIGZvciBub24tcGFkZGVkIHN0cmluZ3NcbiAgLy8gd2hpbGUgYmFzZTY0LWpzIGRvZXMgbm90LlxuICBpZiAoZW5jb2RpbmcgPT09ICdiYXNlNjQnICYmIHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgc3ViamVjdCA9IHN0cmluZ3RyaW0oc3ViamVjdClcbiAgICB3aGlsZSAoc3ViamVjdC5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgICBzdWJqZWN0ID0gc3ViamVjdCArICc9J1xuICAgIH1cbiAgfVxuXG4gIC8vIEZpbmQgdGhlIGxlbmd0aFxuICB2YXIgbGVuZ3RoXG4gIGlmICh0eXBlID09PSAnbnVtYmVyJylcbiAgICBsZW5ndGggPSBjb2VyY2Uoc3ViamVjdClcbiAgZWxzZSBpZiAodHlwZSA9PT0gJ3N0cmluZycpXG4gICAgbGVuZ3RoID0gQnVmZmVyLmJ5dGVMZW5ndGgoc3ViamVjdCwgZW5jb2RpbmcpXG4gIGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKVxuICAgIGxlbmd0aCA9IGNvZXJjZShzdWJqZWN0Lmxlbmd0aCkgLy8gYXNzdW1lIHRoYXQgb2JqZWN0IGlzIGFycmF5LWxpa2VcbiAgZWxzZVxuICAgIHRocm93IG5ldyBFcnJvcignRmlyc3QgYXJndW1lbnQgbmVlZHMgdG8gYmUgYSBudW1iZXIsIGFycmF5IG9yIHN0cmluZy4nKVxuXG4gIHZhciBidWZcbiAgaWYgKEJ1ZmZlci5fdXNlVHlwZWRBcnJheXMpIHtcbiAgICAvLyBQcmVmZXJyZWQ6IFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgYnVmID0gQnVmZmVyLl9hdWdtZW50KG5ldyBVaW50OEFycmF5KGxlbmd0aCkpXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBUSElTIGluc3RhbmNlIG9mIEJ1ZmZlciAoY3JlYXRlZCBieSBgbmV3YClcbiAgICBidWYgPSB0aGlzXG4gICAgYnVmLmxlbmd0aCA9IGxlbmd0aFxuICAgIGJ1Zi5faXNCdWZmZXIgPSB0cnVlXG4gIH1cblxuICB2YXIgaVxuICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cyAmJiB0eXBlb2Ygc3ViamVjdC5ieXRlTGVuZ3RoID09PSAnbnVtYmVyJykge1xuICAgIC8vIFNwZWVkIG9wdGltaXphdGlvbiAtLSB1c2Ugc2V0IGlmIHdlJ3JlIGNvcHlpbmcgZnJvbSBhIHR5cGVkIGFycmF5XG4gICAgYnVmLl9zZXQoc3ViamVjdClcbiAgfSBlbHNlIGlmIChpc0FycmF5aXNoKHN1YmplY3QpKSB7XG4gICAgLy8gVHJlYXQgYXJyYXktaXNoIG9iamVjdHMgYXMgYSBieXRlIGFycmF5XG4gICAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihzdWJqZWN0KSkge1xuICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKVxuICAgICAgICBidWZbaV0gPSBzdWJqZWN0LnJlYWRVSW50OChpKVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspXG4gICAgICAgIGJ1ZltpXSA9ICgoc3ViamVjdFtpXSAlIDI1NikgKyAyNTYpICUgMjU2XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgYnVmLndyaXRlKHN1YmplY3QsIDAsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmICFCdWZmZXIuX3VzZVR5cGVkQXJyYXlzICYmICFub1plcm8pIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGJ1ZltpXSA9IDBcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnVmXG59XG5cbi8vIFNUQVRJQyBNRVRIT0RTXG4vLyA9PT09PT09PT09PT09PVxuXG5CdWZmZXIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIChlbmNvZGluZykge1xuICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAncmF3JzpcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gKGIpIHtcbiAgcmV0dXJuICEhKGIgIT09IG51bGwgJiYgYiAhPT0gdW5kZWZpbmVkICYmIGIuX2lzQnVmZmVyKVxufVxuXG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGZ1bmN0aW9uIChzdHIsIGVuY29kaW5nKSB7XG4gIHZhciByZXRcbiAgc3RyID0gc3RyLnRvU3RyaW5nKClcbiAgc3dpdGNoIChlbmNvZGluZyB8fCAndXRmOCcpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgICAgcmV0ID0gc3RyLmxlbmd0aCAvIDJcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgICAgcmV0ID0gdXRmOFRvQnl0ZXMoc3RyKS5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAncmF3JzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IGJhc2U2NFRvQnl0ZXMoc3RyKS5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGggKiAyXG4gICAgICBicmVha1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gZW5jb2RpbmcnKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIChsaXN0LCB0b3RhbExlbmd0aCkge1xuICBhc3NlcnQoaXNBcnJheShsaXN0KSwgJ1VzYWdlOiBCdWZmZXIuY29uY2F0KGxpc3RbLCBsZW5ndGhdKScpXG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoMClcbiAgfSBlbHNlIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiBsaXN0WzBdXG4gIH1cblxuICB2YXIgaVxuICBpZiAodG90YWxMZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIHRvdGFsTGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB0b3RhbExlbmd0aCArPSBsaXN0W2ldLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIHZhciBidWYgPSBuZXcgQnVmZmVyKHRvdGFsTGVuZ3RoKVxuICB2YXIgcG9zID0gMFxuICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBpdGVtID0gbGlzdFtpXVxuICAgIGl0ZW0uY29weShidWYsIHBvcylcbiAgICBwb3MgKz0gaXRlbS5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbkJ1ZmZlci5jb21wYXJlID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgYXNzZXJ0KEJ1ZmZlci5pc0J1ZmZlcihhKSAmJiBCdWZmZXIuaXNCdWZmZXIoYiksICdBcmd1bWVudHMgbXVzdCBiZSBCdWZmZXJzJylcbiAgdmFyIHggPSBhLmxlbmd0aFxuICB2YXIgeSA9IGIubGVuZ3RoXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBNYXRoLm1pbih4LCB5KTsgaSA8IGxlbiAmJiBhW2ldID09PSBiW2ldOyBpKyspIHt9XG4gIGlmIChpICE9PSBsZW4pIHtcbiAgICB4ID0gYVtpXVxuICAgIHkgPSBiW2ldXG4gIH1cbiAgaWYgKHggPCB5KSB7XG4gICAgcmV0dXJuIC0xXG4gIH1cbiAgaWYgKHkgPCB4KSB7XG4gICAgcmV0dXJuIDFcbiAgfVxuICByZXR1cm4gMFxufVxuXG4vLyBCVUZGRVIgSU5TVEFOQ0UgTUVUSE9EU1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT1cblxuZnVuY3Rpb24gaGV4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSBidWYubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cblxuICAvLyBtdXN0IGJlIGFuIGV2ZW4gbnVtYmVyIG9mIGRpZ2l0c1xuICB2YXIgc3RyTGVuID0gc3RyaW5nLmxlbmd0aFxuICBhc3NlcnQoc3RyTGVuICUgMiA9PT0gMCwgJ0ludmFsaWQgaGV4IHN0cmluZycpXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHZhciBieXRlID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGFzc2VydCghaXNOYU4oYnl0ZSksICdJbnZhbGlkIGhleCBzdHJpbmcnKVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IGJ5dGVcbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiB1dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIGFzY2lpV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5mdW5jdGlvbiBiaW5hcnlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBhc2NpaVdyaXRlKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG4gIHJldHVybiBjaGFyc1dyaXR0ZW5cbn1cblxuZnVuY3Rpb24gdXRmMTZsZVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIGNoYXJzV3JpdHRlbiA9IGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKSB7XG4gIC8vIFN1cHBvcnQgYm90aCAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpXG4gIC8vIGFuZCB0aGUgbGVnYWN5IChzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBpZiAoIWlzRmluaXRlKGxlbmd0aCkpIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIH0gZWxzZSB7ICAvLyBsZWdhY3lcbiAgICB2YXIgc3dhcCA9IGVuY29kaW5nXG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBvZmZzZXQgPSBsZW5ndGhcbiAgICBsZW5ndGggPSBzd2FwXG4gIH1cblxuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG4gIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nIHx8ICd1dGY4JykudG9Mb3dlckNhc2UoKVxuXG4gIHZhciByZXRcbiAgc3dpdGNoIChlbmNvZGluZykge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgICByZXQgPSBoZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgICByZXQgPSB1dGY4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYXNjaWknOlxuICAgICAgcmV0ID0gYXNjaWlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiaW5hcnknOlxuICAgICAgcmV0ID0gYmluYXJ5V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IGJhc2U2NFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXQgPSB1dGYxNmxlV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBlbmNvZGluZycpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuXG4gIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nIHx8ICd1dGY4JykudG9Mb3dlckNhc2UoKVxuICBzdGFydCA9IE51bWJlcihzdGFydCkgfHwgMFxuICBlbmQgPSAoZW5kID09PSB1bmRlZmluZWQpID8gc2VsZi5sZW5ndGggOiBOdW1iZXIoZW5kKVxuXG4gIC8vIEZhc3RwYXRoIGVtcHR5IHN0cmluZ3NcbiAgaWYgKGVuZCA9PT0gc3RhcnQpXG4gICAgcmV0dXJuICcnXG5cbiAgdmFyIHJldFxuICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IGhleFNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIHJldCA9IHV0ZjhTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgICByZXQgPSBhc2NpaVNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICByZXQgPSBiaW5hcnlTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgcmV0ID0gYmFzZTY0U2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IHV0ZjE2bGVTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nJylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gKGIpIHtcbiAgYXNzZXJ0KEJ1ZmZlci5pc0J1ZmZlcihiKSwgJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYikgPT09IDBcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gKGIpIHtcbiAgYXNzZXJ0KEJ1ZmZlci5pc0J1ZmZlcihiKSwgJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYilcbn1cblxuLy8gY29weSh0YXJnZXRCdWZmZXIsIHRhcmdldFN0YXJ0PTAsIHNvdXJjZVN0YXJ0PTAsIHNvdXJjZUVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gKHRhcmdldCwgdGFyZ2V0X3N0YXJ0LCBzdGFydCwgZW5kKSB7XG4gIHZhciBzb3VyY2UgPSB0aGlzXG5cbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kICYmIGVuZCAhPT0gMCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKCF0YXJnZXRfc3RhcnQpIHRhcmdldF9zdGFydCA9IDBcblxuICAvLyBDb3B5IDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVyblxuICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCBzb3VyY2UubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICAvLyBGYXRhbCBlcnJvciBjb25kaXRpb25zXG4gIGFzc2VydChlbmQgPj0gc3RhcnQsICdzb3VyY2VFbmQgPCBzb3VyY2VTdGFydCcpXG4gIGFzc2VydCh0YXJnZXRfc3RhcnQgPj0gMCAmJiB0YXJnZXRfc3RhcnQgPCB0YXJnZXQubGVuZ3RoLFxuICAgICAgJ3RhcmdldFN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBhc3NlcnQoc3RhcnQgPj0gMCAmJiBzdGFydCA8IHNvdXJjZS5sZW5ndGgsICdzb3VyY2VTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgYXNzZXJ0KGVuZCA+PSAwICYmIGVuZCA8PSBzb3VyY2UubGVuZ3RoLCAnc291cmNlRW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIC8vIEFyZSB3ZSBvb2I/XG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aClcbiAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0Lmxlbmd0aCAtIHRhcmdldF9zdGFydCA8IGVuZCAtIHN0YXJ0KVxuICAgIGVuZCA9IHRhcmdldC5sZW5ndGggLSB0YXJnZXRfc3RhcnQgKyBzdGFydFxuXG4gIHZhciBsZW4gPSBlbmQgLSBzdGFydFxuXG4gIGlmIChsZW4gPCAxMDAgfHwgIUJ1ZmZlci5fdXNlVHlwZWRBcnJheXMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldF9zdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGFyZ2V0Ll9zZXQodGhpcy5zdWJhcnJheShzdGFydCwgc3RhcnQgKyBsZW4pLCB0YXJnZXRfc3RhcnQpXG4gIH1cbn1cblxuZnVuY3Rpb24gYmFzZTY0U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBidWYubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1ZilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG59XG5cbmZ1bmN0aW9uIHV0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXMgPSAnJ1xuICB2YXIgdG1wID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgaWYgKGJ1ZltpXSA8PSAweDdGKSB7XG4gICAgICByZXMgKz0gZGVjb2RlVXRmOENoYXIodG1wKSArIFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICAgICAgdG1wID0gJydcbiAgICB9IGVsc2Uge1xuICAgICAgdG1wICs9ICclJyArIGJ1ZltpXS50b1N0cmluZygxNilcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzICsgZGVjb2RlVXRmOENoYXIodG1wKVxufVxuXG5mdW5jdGlvbiBhc2NpaVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGJpbmFyeVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgcmV0dXJuIGFzY2lpU2xpY2UoYnVmLCBzdGFydCwgZW5kKVxufVxuXG5mdW5jdGlvbiBoZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBieXRlcyA9IGJ1Zi5zbGljZShzdGFydCwgZW5kKVxuICB2YXIgcmVzID0gJydcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgYnl0ZXNbaSArIDFdICogMjU2KVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uIChzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBzdGFydCA9IGNsYW1wKHN0YXJ0LCBsZW4sIDApXG4gIGVuZCA9IGNsYW1wKGVuZCwgbGVuLCBsZW4pXG5cbiAgaWYgKEJ1ZmZlci5fdXNlVHlwZWRBcnJheXMpIHtcbiAgICByZXR1cm4gQnVmZmVyLl9hdWdtZW50KHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZCkpXG4gIH0gZWxzZSB7XG4gICAgdmFyIHNsaWNlTGVuID0gZW5kIC0gc3RhcnRcbiAgICB2YXIgbmV3QnVmID0gbmV3IEJ1ZmZlcihzbGljZUxlbiwgdW5kZWZpbmVkLCB0cnVlKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2xpY2VMZW47IGkrKykge1xuICAgICAgbmV3QnVmW2ldID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICAgIHJldHVybiBuZXdCdWZcbiAgfVxufVxuXG4vLyBgZ2V0YCB3aWxsIGJlIHJlbW92ZWQgaW4gTm9kZSAwLjEzK1xuQnVmZmVyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAob2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuZ2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy5yZWFkVUludDgob2Zmc2V0KVxufVxuXG4vLyBgc2V0YCB3aWxsIGJlIHJlbW92ZWQgaW4gTm9kZSAwLjEzK1xuQnVmZmVyLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAodiwgb2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuc2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy53cml0ZVVJbnQ4KHYsIG9mZnNldClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKVxuICAgIHJldHVyblxuXG4gIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuZnVuY3Rpb24gcmVhZFVJbnQxNiAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAxIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIHZhciB2YWxcbiAgaWYgKGxpdHRsZUVuZGlhbikge1xuICAgIHZhbCA9IGJ1ZltvZmZzZXRdXG4gICAgaWYgKG9mZnNldCArIDEgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDFdIDw8IDhcbiAgfSBlbHNlIHtcbiAgICB2YWwgPSBidWZbb2Zmc2V0XSA8PCA4XG4gICAgaWYgKG9mZnNldCArIDEgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDFdXG4gIH1cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiByZWFkVUludDE2KHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHJlYWRVSW50MTYodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHJlYWRVSW50MzIgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICB2YXIgdmFsXG4gIGlmIChsaXR0bGVFbmRpYW4pIHtcbiAgICBpZiAob2Zmc2V0ICsgMiA8IGxlbilcbiAgICAgIHZhbCA9IGJ1ZltvZmZzZXQgKyAyXSA8PCAxNlxuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAxXSA8PCA4XG4gICAgdmFsIHw9IGJ1ZltvZmZzZXRdXG4gICAgaWYgKG9mZnNldCArIDMgPCBsZW4pXG4gICAgICB2YWwgPSB2YWwgKyAoYnVmW29mZnNldCArIDNdIDw8IDI0ID4+PiAwKVxuICB9IGVsc2Uge1xuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsID0gYnVmW29mZnNldCArIDFdIDw8IDE2XG4gICAgaWYgKG9mZnNldCArIDIgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDJdIDw8IDhcbiAgICBpZiAob2Zmc2V0ICsgMyA8IGxlbilcbiAgICAgIHZhbCB8PSBidWZbb2Zmc2V0ICsgM11cbiAgICB2YWwgPSB2YWwgKyAoYnVmW29mZnNldF0gPDwgMjQgPj4+IDApXG4gIH1cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiByZWFkVUludDMyKHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHJlYWRVSW50MzIodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCxcbiAgICAgICAgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKVxuICAgIHJldHVyblxuXG4gIHZhciBuZWcgPSB0aGlzW29mZnNldF0gJiAweDgwXG4gIGlmIChuZWcpXG4gICAgcmV0dXJuICgweGZmIC0gdGhpc1tvZmZzZXRdICsgMSkgKiAtMVxuICBlbHNlXG4gICAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5mdW5jdGlvbiByZWFkSW50MTYgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMSA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICB2YXIgdmFsID0gcmVhZFVJbnQxNihidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCB0cnVlKVxuICB2YXIgbmVnID0gdmFsICYgMHg4MDAwXG4gIGlmIChuZWcpXG4gICAgcmV0dXJuICgweGZmZmYgLSB2YWwgKyAxKSAqIC0xXG4gIGVsc2VcbiAgICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2TEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gcmVhZEludDE2KHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gcmVhZEludDE2KHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiByZWFkSW50MzIgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICB2YXIgdmFsID0gcmVhZFVJbnQzMihidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCB0cnVlKVxuICB2YXIgbmVnID0gdmFsICYgMHg4MDAwMDAwMFxuICBpZiAobmVnKVxuICAgIHJldHVybiAoMHhmZmZmZmZmZiAtIHZhbCArIDEpICogLTFcbiAgZWxzZVxuICAgIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiByZWFkSW50MzIodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiByZWFkSW50MzIodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHJlYWRGbG9hdCAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICByZXR1cm4gaWVlZTc1NC5yZWFkKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHJlYWRGbG9hdCh0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHJlYWRGbG9hdCh0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gcmVhZERvdWJsZSAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICsgNyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICByZXR1cm4gaWVlZTc1NC5yZWFkKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiByZWFkRG91YmxlKHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHJlYWREb3VibGUodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50OCA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgPCB0aGlzLmxlbmd0aCwgJ3RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZ1aW50KHZhbHVlLCAweGZmKVxuICB9XG5cbiAgaWYgKG9mZnNldCA+PSB0aGlzLmxlbmd0aCkgcmV0dXJuXG5cbiAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuZnVuY3Rpb24gd3JpdGVVSW50MTYgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMSA8IGJ1Zi5sZW5ndGgsICd0cnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmdWludCh2YWx1ZSwgMHhmZmZmKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihsZW4gLSBvZmZzZXQsIDIpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID1cbiAgICAgICAgKHZhbHVlICYgKDB4ZmYgPDwgKDggKiAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSkpKSA+Pj5cbiAgICAgICAgICAgIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpICogOFxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZVVJbnQzMiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ3RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZ1aW50KHZhbHVlLCAweGZmZmZmZmZmKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihsZW4gLSBvZmZzZXQsIDQpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID1cbiAgICAgICAgKHZhbHVlID4+PiAobGl0dGxlRW5kaWFuID8gaSA6IDMgLSBpKSAqIDgpICYgMHhmZlxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgPCB0aGlzLmxlbmd0aCwgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZzaW50KHZhbHVlLCAweDdmLCAtMHg4MClcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpXG4gICAgcmV0dXJuXG5cbiAgaWYgKHZhbHVlID49IDApXG4gICAgdGhpcy53cml0ZVVJbnQ4KHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KVxuICBlbHNlXG4gICAgdGhpcy53cml0ZVVJbnQ4KDB4ZmYgKyB2YWx1ZSArIDEsIG9mZnNldCwgbm9Bc3NlcnQpXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbmZ1bmN0aW9uIHdyaXRlSW50MTYgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMSA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmc2ludCh2YWx1ZSwgMHg3ZmZmLCAtMHg4MDAwKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgaWYgKHZhbHVlID49IDApXG4gICAgd3JpdGVVSW50MTYoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KVxuICBlbHNlXG4gICAgd3JpdGVVSW50MTYoYnVmLCAweGZmZmYgKyB2YWx1ZSArIDEsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydClcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gd3JpdGVJbnQzMiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZzaW50KHZhbHVlLCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGlmICh2YWx1ZSA+PSAwKVxuICAgIHdyaXRlVUludDMyKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydClcbiAgZWxzZVxuICAgIHdyaXRlVUludDMyKGJ1ZiwgMHhmZmZmZmZmZiArIHZhbHVlICsgMSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZUZsb2F0IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZklFRUU3NTQodmFsdWUsIDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgsIC0zLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgMjMsIDQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdExFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDcgPCBidWYubGVuZ3RoLFxuICAgICAgICAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZklFRUU3NTQodmFsdWUsIDEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4LCAtMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbiAgcmV0dXJuIG9mZnNldCArIDhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGZpbGwodmFsdWUsIHN0YXJ0PTAsIGVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gKHZhbHVlLCBzdGFydCwgZW5kKSB7XG4gIGlmICghdmFsdWUpIHZhbHVlID0gMFxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQpIGVuZCA9IHRoaXMubGVuZ3RoXG5cbiAgYXNzZXJ0KGVuZCA+PSBzdGFydCwgJ2VuZCA8IHN0YXJ0JylcblxuICAvLyBGaWxsIDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVyblxuICBpZiAodGhpcy5sZW5ndGggPT09IDApIHJldHVyblxuXG4gIGFzc2VydChzdGFydCA+PSAwICYmIHN0YXJ0IDwgdGhpcy5sZW5ndGgsICdzdGFydCBvdXQgb2YgYm91bmRzJylcbiAgYXNzZXJ0KGVuZCA+PSAwICYmIGVuZCA8PSB0aGlzLmxlbmd0aCwgJ2VuZCBvdXQgb2YgYm91bmRzJylcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIHRoaXNbaV0gPSB2YWx1ZVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgYnl0ZXMgPSB1dGY4VG9CeXRlcyh2YWx1ZS50b1N0cmluZygpKVxuICAgIHZhciBsZW4gPSBieXRlcy5sZW5ndGhcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gYnl0ZXNbaSAlIGxlbl1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBvdXQgPSBbXVxuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIG91dFtpXSA9IHRvSGV4KHRoaXNbaV0pXG4gICAgaWYgKGkgPT09IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMpIHtcbiAgICAgIG91dFtpICsgMV0gPSAnLi4uJ1xuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbiAgcmV0dXJuICc8QnVmZmVyICcgKyBvdXQuam9pbignICcpICsgJz4nXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBgQXJyYXlCdWZmZXJgIHdpdGggdGhlICpjb3BpZWQqIG1lbW9yeSBvZiB0aGUgYnVmZmVyIGluc3RhbmNlLlxuICogQWRkZWQgaW4gTm9kZSAwLjEyLiBPbmx5IGF2YWlsYWJsZSBpbiBicm93c2VycyB0aGF0IHN1cHBvcnQgQXJyYXlCdWZmZXIuXG4gKi9cbkJ1ZmZlci5wcm90b3R5cGUudG9BcnJheUJ1ZmZlciA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmIChCdWZmZXIuX3VzZVR5cGVkQXJyYXlzKSB7XG4gICAgICByZXR1cm4gKG5ldyBCdWZmZXIodGhpcykpLmJ1ZmZlclxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5sZW5ndGgpXG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYnVmLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgIGJ1ZltpXSA9IHRoaXNbaV1cbiAgICAgIH1cbiAgICAgIHJldHVybiBidWYuYnVmZmVyXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcignQnVmZmVyLnRvQXJyYXlCdWZmZXIgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGJyb3dzZXInKVxuICB9XG59XG5cbi8vIEhFTFBFUiBGVU5DVElPTlNcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIEJQID0gQnVmZmVyLnByb3RvdHlwZVxuXG4vKipcbiAqIEF1Z21lbnQgYSBVaW50OEFycmF5ICppbnN0YW5jZSogKG5vdCB0aGUgVWludDhBcnJheSBjbGFzcyEpIHdpdGggQnVmZmVyIG1ldGhvZHNcbiAqL1xuQnVmZmVyLl9hdWdtZW50ID0gZnVuY3Rpb24gKGFycikge1xuICBhcnIuX2lzQnVmZmVyID0gdHJ1ZVxuXG4gIC8vIHNhdmUgcmVmZXJlbmNlIHRvIG9yaWdpbmFsIFVpbnQ4QXJyYXkgZ2V0L3NldCBtZXRob2RzIGJlZm9yZSBvdmVyd3JpdGluZ1xuICBhcnIuX2dldCA9IGFyci5nZXRcbiAgYXJyLl9zZXQgPSBhcnIuc2V0XG5cbiAgLy8gZGVwcmVjYXRlZCwgd2lsbCBiZSByZW1vdmVkIGluIG5vZGUgMC4xMytcbiAgYXJyLmdldCA9IEJQLmdldFxuICBhcnIuc2V0ID0gQlAuc2V0XG5cbiAgYXJyLndyaXRlID0gQlAud3JpdGVcbiAgYXJyLnRvU3RyaW5nID0gQlAudG9TdHJpbmdcbiAgYXJyLnRvTG9jYWxlU3RyaW5nID0gQlAudG9TdHJpbmdcbiAgYXJyLnRvSlNPTiA9IEJQLnRvSlNPTlxuICBhcnIuZXF1YWxzID0gQlAuZXF1YWxzXG4gIGFyci5jb21wYXJlID0gQlAuY29tcGFyZVxuICBhcnIuY29weSA9IEJQLmNvcHlcbiAgYXJyLnNsaWNlID0gQlAuc2xpY2VcbiAgYXJyLnJlYWRVSW50OCA9IEJQLnJlYWRVSW50OFxuICBhcnIucmVhZFVJbnQxNkxFID0gQlAucmVhZFVJbnQxNkxFXG4gIGFyci5yZWFkVUludDE2QkUgPSBCUC5yZWFkVUludDE2QkVcbiAgYXJyLnJlYWRVSW50MzJMRSA9IEJQLnJlYWRVSW50MzJMRVxuICBhcnIucmVhZFVJbnQzMkJFID0gQlAucmVhZFVJbnQzMkJFXG4gIGFyci5yZWFkSW50OCA9IEJQLnJlYWRJbnQ4XG4gIGFyci5yZWFkSW50MTZMRSA9IEJQLnJlYWRJbnQxNkxFXG4gIGFyci5yZWFkSW50MTZCRSA9IEJQLnJlYWRJbnQxNkJFXG4gIGFyci5yZWFkSW50MzJMRSA9IEJQLnJlYWRJbnQzMkxFXG4gIGFyci5yZWFkSW50MzJCRSA9IEJQLnJlYWRJbnQzMkJFXG4gIGFyci5yZWFkRmxvYXRMRSA9IEJQLnJlYWRGbG9hdExFXG4gIGFyci5yZWFkRmxvYXRCRSA9IEJQLnJlYWRGbG9hdEJFXG4gIGFyci5yZWFkRG91YmxlTEUgPSBCUC5yZWFkRG91YmxlTEVcbiAgYXJyLnJlYWREb3VibGVCRSA9IEJQLnJlYWREb3VibGVCRVxuICBhcnIud3JpdGVVSW50OCA9IEJQLndyaXRlVUludDhcbiAgYXJyLndyaXRlVUludDE2TEUgPSBCUC53cml0ZVVJbnQxNkxFXG4gIGFyci53cml0ZVVJbnQxNkJFID0gQlAud3JpdGVVSW50MTZCRVxuICBhcnIud3JpdGVVSW50MzJMRSA9IEJQLndyaXRlVUludDMyTEVcbiAgYXJyLndyaXRlVUludDMyQkUgPSBCUC53cml0ZVVJbnQzMkJFXG4gIGFyci53cml0ZUludDggPSBCUC53cml0ZUludDhcbiAgYXJyLndyaXRlSW50MTZMRSA9IEJQLndyaXRlSW50MTZMRVxuICBhcnIud3JpdGVJbnQxNkJFID0gQlAud3JpdGVJbnQxNkJFXG4gIGFyci53cml0ZUludDMyTEUgPSBCUC53cml0ZUludDMyTEVcbiAgYXJyLndyaXRlSW50MzJCRSA9IEJQLndyaXRlSW50MzJCRVxuICBhcnIud3JpdGVGbG9hdExFID0gQlAud3JpdGVGbG9hdExFXG4gIGFyci53cml0ZUZsb2F0QkUgPSBCUC53cml0ZUZsb2F0QkVcbiAgYXJyLndyaXRlRG91YmxlTEUgPSBCUC53cml0ZURvdWJsZUxFXG4gIGFyci53cml0ZURvdWJsZUJFID0gQlAud3JpdGVEb3VibGVCRVxuICBhcnIuZmlsbCA9IEJQLmZpbGxcbiAgYXJyLmluc3BlY3QgPSBCUC5pbnNwZWN0XG4gIGFyci50b0FycmF5QnVmZmVyID0gQlAudG9BcnJheUJ1ZmZlclxuXG4gIHJldHVybiBhcnJcbn1cblxuZnVuY3Rpb24gc3RyaW5ndHJpbSAoc3RyKSB7XG4gIGlmIChzdHIudHJpbSkgcmV0dXJuIHN0ci50cmltKClcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJylcbn1cblxuLy8gc2xpY2Uoc3RhcnQsIGVuZClcbmZ1bmN0aW9uIGNsYW1wIChpbmRleCwgbGVuLCBkZWZhdWx0VmFsdWUpIHtcbiAgaWYgKHR5cGVvZiBpbmRleCAhPT0gJ251bWJlcicpIHJldHVybiBkZWZhdWx0VmFsdWVcbiAgaW5kZXggPSB+fmluZGV4OyAgLy8gQ29lcmNlIHRvIGludGVnZXIuXG4gIGlmIChpbmRleCA+PSBsZW4pIHJldHVybiBsZW5cbiAgaWYgKGluZGV4ID49IDApIHJldHVybiBpbmRleFxuICBpbmRleCArPSBsZW5cbiAgaWYgKGluZGV4ID49IDApIHJldHVybiBpbmRleFxuICByZXR1cm4gMFxufVxuXG5mdW5jdGlvbiBjb2VyY2UgKGxlbmd0aCkge1xuICAvLyBDb2VyY2UgbGVuZ3RoIHRvIGEgbnVtYmVyIChwb3NzaWJseSBOYU4pLCByb3VuZCB1cFxuICAvLyBpbiBjYXNlIGl0J3MgZnJhY3Rpb25hbCAoZS5nLiAxMjMuNDU2KSB0aGVuIGRvIGFcbiAgLy8gZG91YmxlIG5lZ2F0ZSB0byBjb2VyY2UgYSBOYU4gdG8gMC4gRWFzeSwgcmlnaHQ/XG4gIGxlbmd0aCA9IH5+TWF0aC5jZWlsKCtsZW5ndGgpXG4gIHJldHVybiBsZW5ndGggPCAwID8gMCA6IGxlbmd0aFxufVxuXG5mdW5jdGlvbiBpc0FycmF5IChzdWJqZWN0KSB7XG4gIHJldHVybiAoQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoc3ViamVjdCkge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoc3ViamVjdCkgPT09ICdbb2JqZWN0IEFycmF5XSdcbiAgfSkoc3ViamVjdClcbn1cblxuZnVuY3Rpb24gaXNBcnJheWlzaCAoc3ViamVjdCkge1xuICByZXR1cm4gaXNBcnJheShzdWJqZWN0KSB8fCBCdWZmZXIuaXNCdWZmZXIoc3ViamVjdCkgfHxcbiAgICAgIHN1YmplY3QgJiYgdHlwZW9mIHN1YmplY3QgPT09ICdvYmplY3QnICYmXG4gICAgICB0eXBlb2Ygc3ViamVjdC5sZW5ndGggPT09ICdudW1iZXInXG59XG5cbmZ1bmN0aW9uIHRvSGV4IChuKSB7XG4gIGlmIChuIDwgMTYpIHJldHVybiAnMCcgKyBuLnRvU3RyaW5nKDE2KVxuICByZXR1cm4gbi50b1N0cmluZygxNilcbn1cblxuZnVuY3Rpb24gdXRmOFRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgYiA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaWYgKGIgPD0gMHg3Rikge1xuICAgICAgYnl0ZUFycmF5LnB1c2goYilcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHN0YXJ0ID0gaVxuICAgICAgaWYgKGIgPj0gMHhEODAwICYmIGIgPD0gMHhERkZGKSBpKytcbiAgICAgIHZhciBoID0gZW5jb2RlVVJJQ29tcG9uZW50KHN0ci5zbGljZShzdGFydCwgaSsxKSkuc3Vic3RyKDEpLnNwbGl0KCclJylcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgaC5sZW5ndGg7IGorKykge1xuICAgICAgICBieXRlQXJyYXkucHVzaChwYXJzZUludChoW2pdLCAxNikpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYywgaGksIGxvXG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KHN0cilcbn1cblxuZnVuY3Rpb24gYmxpdEJ1ZmZlciAoc3JjLCBkc3QsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoKGkgKyBvZmZzZXQgPj0gZHN0Lmxlbmd0aCkgfHwgKGkgPj0gc3JjLmxlbmd0aCkpXG4gICAgICBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIGRlY29kZVV0ZjhDaGFyIChzdHIpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHN0cilcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoMHhGRkZEKSAvLyBVVEYgOCBpbnZhbGlkIGNoYXJcbiAgfVxufVxuXG4vKlxuICogV2UgaGF2ZSB0byBtYWtlIHN1cmUgdGhhdCB0aGUgdmFsdWUgaXMgYSB2YWxpZCBpbnRlZ2VyLiBUaGlzIG1lYW5zIHRoYXQgaXRcbiAqIGlzIG5vbi1uZWdhdGl2ZS4gSXQgaGFzIG5vIGZyYWN0aW9uYWwgY29tcG9uZW50IGFuZCB0aGF0IGl0IGRvZXMgbm90XG4gKiBleGNlZWQgdGhlIG1heGltdW0gYWxsb3dlZCB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gdmVyaWZ1aW50ICh2YWx1ZSwgbWF4KSB7XG4gIGFzc2VydCh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInLCAnY2Fubm90IHdyaXRlIGEgbm9uLW51bWJlciBhcyBhIG51bWJlcicpXG4gIGFzc2VydCh2YWx1ZSA+PSAwLCAnc3BlY2lmaWVkIGEgbmVnYXRpdmUgdmFsdWUgZm9yIHdyaXRpbmcgYW4gdW5zaWduZWQgdmFsdWUnKVxuICBhc3NlcnQodmFsdWUgPD0gbWF4LCAndmFsdWUgaXMgbGFyZ2VyIHRoYW4gbWF4aW11bSB2YWx1ZSBmb3IgdHlwZScpXG4gIGFzc2VydChNYXRoLmZsb29yKHZhbHVlKSA9PT0gdmFsdWUsICd2YWx1ZSBoYXMgYSBmcmFjdGlvbmFsIGNvbXBvbmVudCcpXG59XG5cbmZ1bmN0aW9uIHZlcmlmc2ludCAodmFsdWUsIG1heCwgbWluKSB7XG4gIGFzc2VydCh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInLCAnY2Fubm90IHdyaXRlIGEgbm9uLW51bWJlciBhcyBhIG51bWJlcicpXG4gIGFzc2VydCh2YWx1ZSA8PSBtYXgsICd2YWx1ZSBsYXJnZXIgdGhhbiBtYXhpbXVtIGFsbG93ZWQgdmFsdWUnKVxuICBhc3NlcnQodmFsdWUgPj0gbWluLCAndmFsdWUgc21hbGxlciB0aGFuIG1pbmltdW0gYWxsb3dlZCB2YWx1ZScpXG4gIGFzc2VydChNYXRoLmZsb29yKHZhbHVlKSA9PT0gdmFsdWUsICd2YWx1ZSBoYXMgYSBmcmFjdGlvbmFsIGNvbXBvbmVudCcpXG59XG5cbmZ1bmN0aW9uIHZlcmlmSUVFRTc1NCAodmFsdWUsIG1heCwgbWluKSB7XG4gIGFzc2VydCh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInLCAnY2Fubm90IHdyaXRlIGEgbm9uLW51bWJlciBhcyBhIG51bWJlcicpXG4gIGFzc2VydCh2YWx1ZSA8PSBtYXgsICd2YWx1ZSBsYXJnZXIgdGhhbiBtYXhpbXVtIGFsbG93ZWQgdmFsdWUnKVxuICBhc3NlcnQodmFsdWUgPj0gbWluLCAndmFsdWUgc21hbGxlciB0aGFuIG1pbmltdW0gYWxsb3dlZCB2YWx1ZScpXG59XG5cbmZ1bmN0aW9uIGFzc2VydCAodGVzdCwgbWVzc2FnZSkge1xuICBpZiAoIXRlc3QpIHRocm93IG5ldyBFcnJvcihtZXNzYWdlIHx8ICdGYWlsZWQgYXNzZXJ0aW9uJylcbn1cbiIsInZhciBsb29rdXAgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLyc7XG5cbjsoZnVuY3Rpb24gKGV4cG9ydHMpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG4gIHZhciBBcnIgPSAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnKVxuICAgID8gVWludDhBcnJheVxuICAgIDogQXJyYXlcblxuXHR2YXIgUExVUyAgID0gJysnLmNoYXJDb2RlQXQoMClcblx0dmFyIFNMQVNIICA9ICcvJy5jaGFyQ29kZUF0KDApXG5cdHZhciBOVU1CRVIgPSAnMCcuY2hhckNvZGVBdCgwKVxuXHR2YXIgTE9XRVIgID0gJ2EnLmNoYXJDb2RlQXQoMClcblx0dmFyIFVQUEVSICA9ICdBJy5jaGFyQ29kZUF0KDApXG5cblx0ZnVuY3Rpb24gZGVjb2RlIChlbHQpIHtcblx0XHR2YXIgY29kZSA9IGVsdC5jaGFyQ29kZUF0KDApXG5cdFx0aWYgKGNvZGUgPT09IFBMVVMpXG5cdFx0XHRyZXR1cm4gNjIgLy8gJysnXG5cdFx0aWYgKGNvZGUgPT09IFNMQVNIKVxuXHRcdFx0cmV0dXJuIDYzIC8vICcvJ1xuXHRcdGlmIChjb2RlIDwgTlVNQkVSKVxuXHRcdFx0cmV0dXJuIC0xIC8vbm8gbWF0Y2hcblx0XHRpZiAoY29kZSA8IE5VTUJFUiArIDEwKVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBOVU1CRVIgKyAyNiArIDI2XG5cdFx0aWYgKGNvZGUgPCBVUFBFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBVUFBFUlxuXHRcdGlmIChjb2RlIDwgTE9XRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gTE9XRVIgKyAyNlxuXHR9XG5cblx0ZnVuY3Rpb24gYjY0VG9CeXRlQXJyYXkgKGI2NCkge1xuXHRcdHZhciBpLCBqLCBsLCB0bXAsIHBsYWNlSG9sZGVycywgYXJyXG5cblx0XHRpZiAoYjY0Lmxlbmd0aCAlIDQgPiAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuXHRcdH1cblxuXHRcdC8vIHRoZSBudW1iZXIgb2YgZXF1YWwgc2lnbnMgKHBsYWNlIGhvbGRlcnMpXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHR3byBwbGFjZWhvbGRlcnMsIHRoYW4gdGhlIHR3byBjaGFyYWN0ZXJzIGJlZm9yZSBpdFxuXHRcdC8vIHJlcHJlc2VudCBvbmUgYnl0ZVxuXHRcdC8vIGlmIHRoZXJlIGlzIG9ubHkgb25lLCB0aGVuIHRoZSB0aHJlZSBjaGFyYWN0ZXJzIGJlZm9yZSBpdCByZXByZXNlbnQgMiBieXRlc1xuXHRcdC8vIHRoaXMgaXMganVzdCBhIGNoZWFwIGhhY2sgdG8gbm90IGRvIGluZGV4T2YgdHdpY2Vcblx0XHR2YXIgbGVuID0gYjY0Lmxlbmd0aFxuXHRcdHBsYWNlSG9sZGVycyA9ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAyKSA/IDIgOiAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMSkgPyAxIDogMFxuXG5cdFx0Ly8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5cdFx0YXJyID0gbmV3IEFycihiNjQubGVuZ3RoICogMyAvIDQgLSBwbGFjZUhvbGRlcnMpXG5cblx0XHQvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG5cdFx0bCA9IHBsYWNlSG9sZGVycyA+IDAgPyBiNjQubGVuZ3RoIC0gNCA6IGI2NC5sZW5ndGhcblxuXHRcdHZhciBMID0gMFxuXG5cdFx0ZnVuY3Rpb24gcHVzaCAodikge1xuXHRcdFx0YXJyW0wrK10gPSB2XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gMCwgaiA9IDA7IGkgPCBsOyBpICs9IDQsIGogKz0gMykge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxOCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCAxMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA8PCA2KSB8IGRlY29kZShiNjQuY2hhckF0KGkgKyAzKSlcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMDAwKSA+PiAxNilcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMCkgPj4gOClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRpZiAocGxhY2VIb2xkZXJzID09PSAyKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPj4gNClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9IGVsc2UgaWYgKHBsYWNlSG9sZGVycyA9PT0gMSkge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxMCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCA0KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpID4+IDIpXG5cdFx0XHRwdXNoKCh0bXAgPj4gOCkgJiAweEZGKVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdHJldHVybiBhcnJcblx0fVxuXG5cdGZ1bmN0aW9uIHVpbnQ4VG9CYXNlNjQgKHVpbnQ4KSB7XG5cdFx0dmFyIGksXG5cdFx0XHRleHRyYUJ5dGVzID0gdWludDgubGVuZ3RoICUgMywgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcblx0XHRcdG91dHB1dCA9IFwiXCIsXG5cdFx0XHR0ZW1wLCBsZW5ndGhcblxuXHRcdGZ1bmN0aW9uIGVuY29kZSAobnVtKSB7XG5cdFx0XHRyZXR1cm4gbG9va3VwLmNoYXJBdChudW0pXG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcblx0XHRcdHJldHVybiBlbmNvZGUobnVtID4+IDE4ICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDEyICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDYgJiAweDNGKSArIGVuY29kZShudW0gJiAweDNGKVxuXHRcdH1cblxuXHRcdC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcblx0XHRmb3IgKGkgPSAwLCBsZW5ndGggPSB1aW50OC5sZW5ndGggLSBleHRyYUJ5dGVzOyBpIDwgbGVuZ3RoOyBpICs9IDMpIHtcblx0XHRcdHRlbXAgPSAodWludDhbaV0gPDwgMTYpICsgKHVpbnQ4W2kgKyAxXSA8PCA4KSArICh1aW50OFtpICsgMl0pXG5cdFx0XHRvdXRwdXQgKz0gdHJpcGxldFRvQmFzZTY0KHRlbXApXG5cdFx0fVxuXG5cdFx0Ly8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuXHRcdHN3aXRjaCAoZXh0cmFCeXRlcykge1xuXHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHR0ZW1wID0gdWludDhbdWludDgubGVuZ3RoIC0gMV1cblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDIpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz09J1xuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSAyOlxuXHRcdFx0XHR0ZW1wID0gKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDJdIDw8IDgpICsgKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMTApXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPj4gNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDIpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9J1xuXHRcdFx0XHRicmVha1xuXHRcdH1cblxuXHRcdHJldHVybiBvdXRwdXRcblx0fVxuXG5cdGV4cG9ydHMudG9CeXRlQXJyYXkgPSBiNjRUb0J5dGVBcnJheVxuXHRleHBvcnRzLmZyb21CeXRlQXJyYXkgPSB1aW50OFRvQmFzZTY0XG59KHR5cGVvZiBleHBvcnRzID09PSAndW5kZWZpbmVkJyA/ICh0aGlzLmJhc2U2NGpzID0ge30pIDogZXhwb3J0cykpXG4iLCJleHBvcnRzLnJlYWQgPSBmdW5jdGlvbihidWZmZXIsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLFxuICAgICAgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMSxcbiAgICAgIGVNYXggPSAoMSA8PCBlTGVuKSAtIDEsXG4gICAgICBlQmlhcyA9IGVNYXggPj4gMSxcbiAgICAgIG5CaXRzID0gLTcsXG4gICAgICBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDAsXG4gICAgICBkID0gaXNMRSA/IC0xIDogMSxcbiAgICAgIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV07XG5cbiAgaSArPSBkO1xuXG4gIGUgPSBzICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpO1xuICBzID4+PSAoLW5CaXRzKTtcbiAgbkJpdHMgKz0gZUxlbjtcbiAgZm9yICg7IG5CaXRzID4gMDsgZSA9IGUgKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCk7XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSk7XG4gIGUgPj49ICgtbkJpdHMpO1xuICBuQml0cyArPSBtTGVuO1xuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gbSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KTtcblxuICBpZiAoZSA9PT0gMCkge1xuICAgIGUgPSAxIC0gZUJpYXM7XG4gIH0gZWxzZSBpZiAoZSA9PT0gZU1heCkge1xuICAgIHJldHVybiBtID8gTmFOIDogKChzID8gLTEgOiAxKSAqIEluZmluaXR5KTtcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pO1xuICAgIGUgPSBlIC0gZUJpYXM7XG4gIH1cbiAgcmV0dXJuIChzID8gLTEgOiAxKSAqIG0gKiBNYXRoLnBvdygyLCBlIC0gbUxlbik7XG59O1xuXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24oYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGMsXG4gICAgICBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxLFxuICAgICAgZU1heCA9ICgxIDw8IGVMZW4pIC0gMSxcbiAgICAgIGVCaWFzID0gZU1heCA+PiAxLFxuICAgICAgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApLFxuICAgICAgaSA9IGlzTEUgPyAwIDogKG5CeXRlcyAtIDEpLFxuICAgICAgZCA9IGlzTEUgPyAxIDogLTEsXG4gICAgICBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwO1xuXG4gIHZhbHVlID0gTWF0aC5hYnModmFsdWUpO1xuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwO1xuICAgIGUgPSBlTWF4O1xuICB9IGVsc2Uge1xuICAgIGUgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4yKTtcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS07XG4gICAgICBjICo9IDI7XG4gICAgfVxuICAgIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgdmFsdWUgKz0gcnQgLyBjO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcyk7XG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrO1xuICAgICAgYyAvPSAyO1xuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDA7XG4gICAgICBlID0gZU1heDtcbiAgICB9IGVsc2UgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICBtID0gKHZhbHVlICogYyAtIDEpICogTWF0aC5wb3coMiwgbUxlbik7XG4gICAgICBlID0gZSArIGVCaWFzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbik7XG4gICAgICBlID0gMDtcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KTtcblxuICBlID0gKGUgPDwgbUxlbikgfCBtO1xuICBlTGVuICs9IG1MZW47XG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCk7XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4O1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDE6IE11bHRpcGxlcyBvZiAzIGFuZCA1XG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbklmIHdlIGxpc3QgYWxsIHRoZSBuYXR1cmFsIG51bWJlcnMgYmVsb3cgMTAgdGhhdCBhcmUgbXVsdGlwbGVzIG9mIDMgb3IgNSwgd2UgZ2V0IDMsIDUsIDYgYW5kIDkuXG5UaGUgc3VtIG9mIHRoZXNlIG11bHRpcGxlcyBpcyAyMy5cblxuRmluZCB0aGUgc3VtIG9mIGFsbCB0aGUgbXVsdGlwbGVzIG9mIDMgb3IgNSBiZWxvdyAxMDAwLlxuXG5cIlwiXCJcblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgc3VtID0gMFxuICBmb3IgaSBpbiBbMS4uLjEwXVxuICAgIGlmIChpICUgMyA9PSAwKSBvciAoaSAlIDUgPT0gMClcbiAgICAgIHN1bSArPSBpXG4gIGVxdWFsKHN1bSwgMjMsIFwiU3VtIG9mIG5hdHVyYWwgbnVtYmVycyA8IDEwOiAje3N1bX1cIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICBzdW0gPSAwXG4gIGZvciBpIGluIFsxLi4uMTAwMF1cbiAgICBpZiAoaSAlIDMgPT0gMCkgb3IgKGkgJSA1ID09IDApXG4gICAgICBzdW0gKz0gaVxuXG4gIHJldHVybiBzdW1cbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDI6IEV2ZW4gRmlib25hY2NpIG51bWJlcnNcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5FYWNoIG5ldyB0ZXJtIGluIHRoZSBGaWJvbmFjY2kgc2VxdWVuY2UgaXMgZ2VuZXJhdGVkIGJ5IGFkZGluZyB0aGUgcHJldmlvdXMgdHdvIHRlcm1zLlxuQnkgc3RhcnRpbmcgd2l0aCAxIGFuZCAyLCB0aGUgZmlyc3QgMTAgdGVybXMgd2lsbCBiZTpcblxuMSwgMiwgMywgNSwgOCwgMTMsIDIxLCAzNCwgNTUsIDg5LCAuLi5cblxuQnkgY29uc2lkZXJpbmcgdGhlIHRlcm1zIGluIHRoZSBGaWJvbmFjY2kgc2VxdWVuY2Ugd2hvc2UgdmFsdWVzIGRvIG5vdCBleGNlZWQgZm91ciBtaWxsaW9uLFxuZmluZCB0aGUgc3VtIG9mIHRoZSBldmVuLXZhbHVlZCB0ZXJtcy5cblxuXCJcIlwiXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgcHJldiA9IDFcbiAgY3VyciA9IDFcbiAgc3VtID0gMFxuXG4gIHdoaWxlIGN1cnIgPCA0MDAwMDAwXG4gICAgaWYgKGN1cnIgJSAyKSA9PSAwXG4gICAgICBzdW0gKz0gY3VyclxuXG4gICAgbmV4dCA9IGN1cnIgKyBwcmV2XG4gICAgcHJldiA9IGN1cnJcbiAgICBjdXJyID0gbmV4dFxuXG4gIHJldHVybiBzdW1cbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDM6IExhcmdlc3QgcHJpbWUgZmFjdG9yXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblRoZSBwcmltZSBmYWN0b3JzIG9mIDEzMTk1IGFyZSA1LCA3LCAxMyBhbmQgMjkuXG5cbldoYXQgaXMgdGhlIGxhcmdlc3QgcHJpbWUgZmFjdG9yIG9mIHRoZSBudW1iZXIgNjAwODUxNDc1MTQzID9cblxuXCJcIlwiXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgU2hhbWVsZXNzbHkgcGlsZmVyZWQvYWRvcHRlZCBmcm9tIGh0dHA6Ly93d3cuamF2YXNjcmlwdGVyLm5ldC9mYXEvbnVtYmVyaXNwcmltZS5odG1cblxubGVhc3RGYWN0b3IgPSAobikgLT5cbiAgcmV0dXJuIE5hTiBpZiBpc05hTihuKSBvciBub3QgaXNGaW5pdGUobilcbiAgcmV0dXJuIDAgaWYgbiA9PSAwXG4gIHJldHVybiAxIGlmIChuICUgMSkgIT0gMCBvciAobiAqIG4pIDwgMlxuICByZXR1cm4gMiBpZiAobiAlIDIpID09IDBcbiAgcmV0dXJuIDMgaWYgKG4gJSAzKSA9PSAwXG4gIHJldHVybiA1IGlmIChuICUgNSkgPT0gMFxuXG4gIG0gPSBNYXRoLnNxcnQgblxuICBmb3IgaSBpbiBbNy4ubV0gYnkgMzBcbiAgICByZXR1cm4gaSAgICBpZiAobiAlIGkpICAgICAgPT0gMFxuICAgIHJldHVybiBpKzQgIGlmIChuICUgKGkrNCkpICA9PSAwXG4gICAgcmV0dXJuIGkrNiAgaWYgKG4gJSAoaSs2KSkgID09IDBcbiAgICByZXR1cm4gaSsxMCBpZiAobiAlIChpKzEwKSkgPT0gMFxuICAgIHJldHVybiBpKzEyIGlmIChuICUgKGkrMTIpKSA9PSAwXG4gICAgcmV0dXJuIGkrMTYgaWYgKG4gJSAoaSsxNikpID09IDBcbiAgICByZXR1cm4gaSsyMiBpZiAobiAlIChpKzIyKSkgPT0gMFxuICAgIHJldHVybiBpKzI0IGlmIChuICUgKGkrMjQpKSA9PSAwXG5cbiAgcmV0dXJuIG5cblxuaXNQcmltZSA9IChuKSAtPlxuICBpZiBpc05hTihuKSBvciBub3QgaXNGaW5pdGUobikgb3IgKG4gJSAxKSAhPSAwIG9yIChuIDwgMilcbiAgICByZXR1cm4gZmFsc2VcbiAgaWYgbiA9PSBsZWFzdEZhY3RvcihuKVxuICAgIHJldHVybiB0cnVlXG5cbiAgcmV0dXJuIGZhbHNlXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxucHJpbWVGYWN0b3JzID0gKG4pIC0+XG4gIHJldHVybiBbMV0gaWYgbiA9PSAxXG5cbiAgZmFjdG9ycyA9IFtdXG4gIHdoaWxlIG5vdCBpc1ByaW1lKG4pXG4gICAgZmFjdG9yID0gbGVhc3RGYWN0b3IobilcbiAgICBmYWN0b3JzLnB1c2ggZmFjdG9yXG4gICAgbiAvPSBmYWN0b3JcbiAgZmFjdG9ycy5wdXNoIG5cbiAgcmV0dXJuIGZhY3RvcnNcblxubGFyZ2VzdFByaW1lRmFjdG9yID0gKG4pIC0+XG4gIHJldHVybiAxIGlmIG4gPT0gMVxuXG4gIHdoaWxlIG5vdCBpc1ByaW1lKG4pXG4gICAgZmFjdG9yID0gbGVhc3RGYWN0b3IobilcbiAgICBuIC89IGZhY3RvclxuICByZXR1cm4gblxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHJldHVybiBsYXJnZXN0UHJpbWVGYWN0b3IoNjAwODUxNDc1MTQzKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gNDogTGFyZ2VzdCBwYWxpbmRyb21lIHByb2R1Y3Rcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuQSBwYWxpbmRyb21pYyBudW1iZXIgcmVhZHMgdGhlIHNhbWUgYm90aCB3YXlzLlxuXG5GaW5kIHRoZSBsYXJnZXN0IHBhbGluZHJvbWUgbWFkZSBmcm9tIHRoZSBwcm9kdWN0IG9mIHR3byAzLWRpZ2l0IG51bWJlcnMuXG5cblwiXCJcIlxuXG5pc1BhbGluZHJvbWUgPSAobikgLT5cbiAgc3RyID0gbi50b1N0cmluZygpXG4gIGZvciBpIGluIFswLi4uKHN0ci5sZW5ndGggLyAyKV1cbiAgICBpZiBzdHJbaV0gIT0gc3RyW3N0ci5sZW5ndGggLSAxIC0gaV1cbiAgICAgIHJldHVybiBmYWxzZVxuICByZXR1cm4gdHJ1ZVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICAjIE1ha2Ugc3VyZSBpc1BhbGluZHJvbWUgd29ya3MgcHJvcGVybHkgZmlyc3RcbiAgZm9yIHYgaW4gWzEsIDExLCAxMjEsIDEyMjEsIDEyMzIxLCAxMjM0MzIxXVxuICAgIGVxdWFsKGlzUGFsaW5kcm9tZSh2KSwgdHJ1ZSwgXCJpc1BhbGluZHJvbWUoI3t2fSkgcmV0dXJucyB0cnVlXCIpXG4gIGZvciB2IGluIFsxMiwgMTIzLCAxMjM0LCAxMjM0NSwgMTIzNDU2LCAxMjMyNF1cbiAgICBlcXVhbChpc1BhbGluZHJvbWUodiksIGZhbHNlLCBcImlzUGFsaW5kcm9tZSgje3Z9KSByZXR1cm5zIGZhbHNlXCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgbGFyZ2VzdGkgPSAwXG4gIGxhcmdlc3RqID0gMFxuICBsYXJnZXN0cCA9IDBcblxuICBmb3IgaSBpbiBbMTAwLi45OTldXG4gICAgZm9yIGogaW4gWzEwMC4uOTk5XVxuICAgICAgcHJvZHVjdCA9IGkgKiBqXG4gICAgICBpZiBpc1BhbGluZHJvbWUocHJvZHVjdClcbiAgICAgICAgbGFyZ2VzdGkgPSBpXG4gICAgICAgIGxhcmdlc3RqID0galxuICAgICAgICBsYXJnZXN0cCA9IHByb2R1Y3RcblxuICByZXR1cm4gbGFyZ2VzdHBcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDU6IFNtYWxsZXN0IG11bHRpcGxlXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbjI1MjAgaXMgdGhlIHNtYWxsZXN0IG51bWJlciB0aGF0IGNhbiBiZSBkaXZpZGVkIGJ5IGVhY2ggb2YgdGhlIG51bWJlcnMgZnJvbSAxIHRvIDEwIHdpdGhvdXQgYW55IHJlbWFpbmRlci5cblxuV2hhdCBpcyB0aGUgc21hbGxlc3QgcG9zaXRpdmUgbnVtYmVyIHRoYXQgaXMgZXZlbmx5IGRpdmlzaWJsZSBieSBhbGwgb2YgdGhlIG51bWJlcnMgZnJvbSAxIHRvIDIwP1xuXG5cIlwiXCJcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICBuID0gMFxuICBsb29wXG4gICAgbiArPSAyMCAjIFByb2JhYmx5IGNvdWxkIGJlIHNvbWUgY2xldmVyIHN1bSBvZiBwcmltZXMgYmV0d2VlbiAxLTIwIG9yIHNvbWV0aGluZy4gSSBkb24ndCBjYXJlLlxuICAgIGZvdW5kID0gdHJ1ZVxuICAgIGZvciBpIGluIFsxLi4yMF1cbiAgICAgIGlmIChuICUgaSkgIT0gMFxuICAgICAgICBmb3VuZCA9IGZhbHNlXG4gICAgICAgIGJyZWFrXG5cbiAgICBicmVhayBpZiBmb3VuZFxuXG4gIHJldHVybiBuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSA2OiBTdW0gc3F1YXJlIGRpZmZlcmVuY2Vcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblRoZSBzdW0gb2YgdGhlIHNxdWFyZXMgb2YgdGhlIGZpcnN0IHRlbiBuYXR1cmFsIG51bWJlcnMgaXMsXG5cbiAgICAgICAgICAgICAxXjIgKyAyXjIgKyAuLi4gKyAxMF4yID0gMzg1XG5cblRoZSBzcXVhcmUgb2YgdGhlIHN1bSBvZiB0aGUgZmlyc3QgdGVuIG5hdHVyYWwgbnVtYmVycyBpcyxcblxuICAgICAgICAgICgxICsgMiArIC4uLiArIDEwKV4yID0gNTVeMiA9IDMwMjVcblxuSGVuY2UgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUgc3VtIG9mIHRoZSBzcXVhcmVzIG9mIHRoZSBmaXJzdCB0ZW4gbmF0dXJhbCBudW1iZXJzIGFuZCB0aGUgc3F1YXJlIG9mIHRoZSBzdW0gaXMgMzAyNSDiiJIgMzg1ID0gMjY0MC5cblxuRmluZCB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBzdW0gb2YgdGhlIHNxdWFyZXMgb2YgdGhlIGZpcnN0IG9uZSBodW5kcmVkIG5hdHVyYWwgbnVtYmVycyBhbmQgdGhlIHNxdWFyZSBvZiB0aGUgc3VtLlxuXG5cIlwiXCJcblxuc3VtT2ZTcXVhcmVzID0gKG4pIC0+XG4gIHN1bSA9IDBcbiAgZm9yIGkgaW4gWzEuLm5dXG4gICAgc3VtICs9IChpICogaSlcbiAgcmV0dXJuIHN1bVxuXG5zcXVhcmVPZlN1bSA9IChuKSAtPlxuICBzdW0gPSAwXG4gIGZvciBpIGluIFsxLi5uXVxuICAgIHN1bSArPSBpXG4gIHJldHVybiAoc3VtICogc3VtKVxuXG5kaWZmZXJlbmNlU3VtU3F1YXJlcyA9IChuKSAtPlxuICByZXR1cm4gc3F1YXJlT2ZTdW0obikgLSBzdW1PZlNxdWFyZXMobilcblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgZXF1YWwoc3VtT2ZTcXVhcmVzKDEwKSwgMzg1LCBcIlN1bSBvZiBzcXVhcmVzIG9mIGZpcnN0IHRlbiBuYXR1cmFsIG51bWJlcnMgaXMgMzg1XCIpXG4gIGVxdWFsKHNxdWFyZU9mU3VtKDEwKSwgMzAyNSwgXCJTcXVhcmUgb2Ygc3VtIG9mIGZpcnN0IHRlbiBuYXR1cmFsIG51bWJlcnMgaXMgMzAyNVwiKVxuICBlcXVhbChkaWZmZXJlbmNlU3VtU3F1YXJlcygxMCksIDI2NDAsIFwiRGlmZmVyZW5jZSBpbiB2YWx1ZXMgZm9yIHRoZSBmaXJzdCB0ZW4gbmF0dXJhbCBudW1iZXJzIGlzIDI2NDBcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICByZXR1cm4gZGlmZmVyZW5jZVN1bVNxdWFyZXMoMTAwKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gNzogMTAwMDFzdCBwcmltZVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbkJ5IGxpc3RpbmcgdGhlIGZpcnN0IHNpeCBwcmltZSBudW1iZXJzOiAyLCAzLCA1LCA3LCAxMSwgYW5kIDEzLCB3ZSBjYW4gc2VlIHRoYXQgdGhlIDZ0aCBwcmltZSBpcyAxMy5cblxuV2hhdCBpcyB0aGUgMTAsMDAxc3QgcHJpbWUgbnVtYmVyP1xuXG5cIlwiXCJcblxubWF0aCA9IHJlcXVpcmUgXCJtYXRoXCJcblxubnRoUHJpbWUgPSAobikgLT5cbiAgc2lldmUgPSBuZXcgbWF0aC5JbmNyZW1lbnRhbFNpZXZlXG4gIGZvciBpIGluIFsxLi4ubl1cbiAgICBzaWV2ZS5uZXh0KClcbiAgcmV0dXJuIHNpZXZlLm5leHQoKVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChudGhQcmltZSg2KSwgMTMsIFwiNnRoIHByaW1lIGlzIDEzXCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgcmV0dXJuIG50aFByaW1lKDEwMDAxKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gODogTGFyZ2VzdCBwcm9kdWN0IGluIGEgc2VyaWVzXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5UaGUgZm91ciBhZGphY2VudCBkaWdpdHMgaW4gdGhlIDEwMDAtZGlnaXQgbnVtYmVyIHRoYXQgaGF2ZSB0aGUgZ3JlYXRlc3QgcHJvZHVjdCBhcmUgOSB4IDkgeCA4IHggOSA9IDU4MzIuXG5cbiAgNzMxNjcxNzY1MzEzMzA2MjQ5MTkyMjUxMTk2NzQ0MjY1NzQ3NDIzNTUzNDkxOTQ5MzRcbiAgOTY5ODM1MjAzMTI3NzQ1MDYzMjYyMzk1NzgzMTgwMTY5ODQ4MDE4Njk0Nzg4NTE4NDNcbiAgODU4NjE1NjA3ODkxMTI5NDk0OTU0NTk1MDE3Mzc5NTgzMzE5NTI4NTMyMDg4MDU1MTFcbiAgMTI1NDA2OTg3NDcxNTg1MjM4NjMwNTA3MTU2OTMyOTA5NjMyOTUyMjc0NDMwNDM1NTdcbiAgNjY4OTY2NDg5NTA0NDUyNDQ1MjMxNjE3MzE4NTY0MDMwOTg3MTExMjE3MjIzODMxMTNcbiAgNjIyMjk4OTM0MjMzODAzMDgxMzUzMzYyNzY2MTQyODI4MDY0NDQ0ODY2NDUyMzg3NDlcbiAgMzAzNTg5MDcyOTYyOTA0OTE1NjA0NDA3NzIzOTA3MTM4MTA1MTU4NTkzMDc5NjA4NjZcbiAgNzAxNzI0MjcxMjE4ODM5OTg3OTc5MDg3OTIyNzQ5MjE5MDE2OTk3MjA4ODgwOTM3NzZcbiAgNjU3MjczMzMwMDEwNTMzNjc4ODEyMjAyMzU0MjE4MDk3NTEyNTQ1NDA1OTQ3NTIyNDNcbiAgNTI1ODQ5MDc3MTE2NzA1NTYwMTM2MDQ4Mzk1ODY0NDY3MDYzMjQ0MTU3MjIxNTUzOTdcbiAgNTM2OTc4MTc5Nzc4NDYxNzQwNjQ5NTUxNDkyOTA4NjI1NjkzMjE5Nzg0Njg2MjI0ODJcbiAgODM5NzIyNDEzNzU2NTcwNTYwNTc0OTAyNjE0MDc5NzI5Njg2NTI0MTQ1MzUxMDA0NzRcbiAgODIxNjYzNzA0ODQ0MDMxOTk4OTAwMDg4OTUyNDM0NTA2NTg1NDEyMjc1ODg2NjY4ODFcbiAgMTY0MjcxNzE0Nzk5MjQ0NDI5MjgyMzA4NjM0NjU2NzQ4MTM5MTkxMjMxNjI4MjQ1ODZcbiAgMTc4NjY0NTgzNTkxMjQ1NjY1Mjk0NzY1NDU2ODI4NDg5MTI4ODMxNDI2MDc2OTAwNDJcbiAgMjQyMTkwMjI2NzEwNTU2MjYzMjExMTExMDkzNzA1NDQyMTc1MDY5NDE2NTg5NjA0MDhcbiAgMDcxOTg0MDM4NTA5NjI0NTU0NDQzNjI5ODEyMzA5ODc4Nzk5MjcyNDQyODQ5MDkxODhcbiAgODQ1ODAxNTYxNjYwOTc5MTkxMzM4NzU0OTkyMDA1MjQwNjM2ODk5MTI1NjA3MTc2MDZcbiAgMDU4ODYxMTY0NjcxMDk0MDUwNzc1NDEwMDIyNTY5ODMxNTUyMDAwNTU5MzU3Mjk3MjVcbiAgNzE2MzYyNjk1NjE4ODI2NzA0MjgyNTI0ODM2MDA4MjMyNTc1MzA0MjA3NTI5NjM0NTBcblxuRmluZCB0aGUgdGhpcnRlZW4gYWRqYWNlbnQgZGlnaXRzIGluIHRoZSAxMDAwLWRpZ2l0IG51bWJlciB0aGF0IGhhdmUgdGhlIGdyZWF0ZXN0IHByb2R1Y3QuIFdoYXQgaXMgdGhlIHZhbHVlIG9mIHRoaXMgcHJvZHVjdD9cblxuXCJcIlwiXG5cbnN0ciA9IFwiXCJcIlxuICAgICAgNzMxNjcxNzY1MzEzMzA2MjQ5MTkyMjUxMTk2NzQ0MjY1NzQ3NDIzNTUzNDkxOTQ5MzRcbiAgICAgIDk2OTgzNTIwMzEyNzc0NTA2MzI2MjM5NTc4MzE4MDE2OTg0ODAxODY5NDc4ODUxODQzXG4gICAgICA4NTg2MTU2MDc4OTExMjk0OTQ5NTQ1OTUwMTczNzk1ODMzMTk1Mjg1MzIwODgwNTUxMVxuICAgICAgMTI1NDA2OTg3NDcxNTg1MjM4NjMwNTA3MTU2OTMyOTA5NjMyOTUyMjc0NDMwNDM1NTdcbiAgICAgIDY2ODk2NjQ4OTUwNDQ1MjQ0NTIzMTYxNzMxODU2NDAzMDk4NzExMTIxNzIyMzgzMTEzXG4gICAgICA2MjIyOTg5MzQyMzM4MDMwODEzNTMzNjI3NjYxNDI4MjgwNjQ0NDQ4NjY0NTIzODc0OVxuICAgICAgMzAzNTg5MDcyOTYyOTA0OTE1NjA0NDA3NzIzOTA3MTM4MTA1MTU4NTkzMDc5NjA4NjZcbiAgICAgIDcwMTcyNDI3MTIxODgzOTk4Nzk3OTA4NzkyMjc0OTIxOTAxNjk5NzIwODg4MDkzNzc2XG4gICAgICA2NTcyNzMzMzAwMTA1MzM2Nzg4MTIyMDIzNTQyMTgwOTc1MTI1NDU0MDU5NDc1MjI0M1xuICAgICAgNTI1ODQ5MDc3MTE2NzA1NTYwMTM2MDQ4Mzk1ODY0NDY3MDYzMjQ0MTU3MjIxNTUzOTdcbiAgICAgIDUzNjk3ODE3OTc3ODQ2MTc0MDY0OTU1MTQ5MjkwODYyNTY5MzIxOTc4NDY4NjIyNDgyXG4gICAgICA4Mzk3MjI0MTM3NTY1NzA1NjA1NzQ5MDI2MTQwNzk3Mjk2ODY1MjQxNDUzNTEwMDQ3NFxuICAgICAgODIxNjYzNzA0ODQ0MDMxOTk4OTAwMDg4OTUyNDM0NTA2NTg1NDEyMjc1ODg2NjY4ODFcbiAgICAgIDE2NDI3MTcxNDc5OTI0NDQyOTI4MjMwODYzNDY1Njc0ODEzOTE5MTIzMTYyODI0NTg2XG4gICAgICAxNzg2NjQ1ODM1OTEyNDU2NjUyOTQ3NjU0NTY4Mjg0ODkxMjg4MzE0MjYwNzY5MDA0MlxuICAgICAgMjQyMTkwMjI2NzEwNTU2MjYzMjExMTExMDkzNzA1NDQyMTc1MDY5NDE2NTg5NjA0MDhcbiAgICAgIDA3MTk4NDAzODUwOTYyNDU1NDQ0MzYyOTgxMjMwOTg3ODc5OTI3MjQ0Mjg0OTA5MTg4XG4gICAgICA4NDU4MDE1NjE2NjA5NzkxOTEzMzg3NTQ5OTIwMDUyNDA2MzY4OTkxMjU2MDcxNzYwNlxuICAgICAgMDU4ODYxMTY0NjcxMDk0MDUwNzc1NDEwMDIyNTY5ODMxNTUyMDAwNTU5MzU3Mjk3MjVcbiAgICAgIDcxNjM2MjY5NTYxODgyNjcwNDI4MjUyNDgzNjAwODIzMjU3NTMwNDIwNzUyOTYzNDUwXG4gICAgICBcIlwiXCJcbnN0ciA9IHN0ci5yZXBsYWNlKC9bXjAtOV0vZ20sIFwiXCIpXG5kaWdpdHMgPSAocGFyc2VJbnQoZGlnaXQpIGZvciBkaWdpdCBpbiBzdHIpXG5cbmxhcmdlc3RQcm9kdWN0ID0gKGRpZ2l0Q291bnQpIC0+XG4gIHJldHVybiAwIGlmIGRpZ2l0Q291bnQgPiBkaWdpdHMubGVuZ3RoXG5cbiAgbGFyZ2VzdCA9IDBcbiAgZm9yIHN0YXJ0IGluIFswLi4oZGlnaXRzLmxlbmd0aCAtIGRpZ2l0Q291bnQpXVxuICAgIGVuZCA9IHN0YXJ0ICsgZGlnaXRDb3VudFxuICAgIHByb2R1Y3QgPSAxXG4gICAgZm9yIGkgaW4gW3N0YXJ0Li4uZW5kXVxuICAgICAgcHJvZHVjdCAqPSBkaWdpdHNbaV1cbiAgICBpZiBsYXJnZXN0IDwgcHJvZHVjdFxuICAgICAgbGFyZ2VzdCA9IHByb2R1Y3RcblxuICByZXR1cm4gbGFyZ2VzdFxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChsYXJnZXN0UHJvZHVjdCg0KSwgNTgzMiwgIFwiR3JlYXRlc3QgcHJvZHVjdCBvZiA0IGFkamFjZW50IGRpZ2l0cyBpcyA1ODMyXCIpXG4gIGVxdWFsKGxhcmdlc3RQcm9kdWN0KDUpLCA0MDgyNCwgXCJHcmVhdGVzdCBwcm9kdWN0IG9mIDUgYWRqYWNlbnQgZGlnaXRzIGlzIDQwODI0XCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgcmV0dXJuIGxhcmdlc3RQcm9kdWN0KDEzKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gOTogU3BlY2lhbCBQeXRoYWdvcmVhbiB0cmlwbGV0XG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5BIFB5dGhhZ29yZWFuIHRyaXBsZXQgaXMgYSBzZXQgb2YgdGhyZWUgbmF0dXJhbCBudW1iZXJzLCBhIDwgYiA8IGMsIGZvciB3aGljaCxcblxuICAgIGFeMiArIGJeMiA9IGNeMlxuXG5Gb3IgZXhhbXBsZSwgM14yICsgNF4yID0gOSArIDE2ID0gMjUgPSA1XjIuXG5cblRoZXJlIGV4aXN0cyBleGFjdGx5IG9uZSBQeXRoYWdvcmVhbiB0cmlwbGV0IGZvciB3aGljaCBhICsgYiArIGMgPSAxMDAwLlxuXG5GaW5kIHRoZSBwcm9kdWN0IGFiYy5cblxuXCJcIlwiXG5cbmlzVHJpcGxldCA9IChhLCBiLCBjKSAtPlxuICByZXR1cm4gKChhKmEpICsgKGIqYikpID09IChjKmMpXG5cbmZpbmRGaXJzdFRyaXBsZXQgPSAoc3VtKSAtPlxuICBmb3IgYSBpbiBbMS4uLjEwMDBdXG4gICAgZm9yIGIgaW4gWzEuLi4xMDAwXVxuICAgICAgYyA9IDEwMDAgLSBhIC0gYlxuICAgICAgaWYgaXNUcmlwbGV0KGEsIGIsIGMpXG4gICAgICAgIHJldHVybiBbYSwgYiwgY11cblxuICByZXR1cm4gZmFsc2VcblxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChpc1RyaXBsZXQoMywgNCwgNSksIHRydWUsIFwiKDMsNCw1KSBpcyBhIFB5dGhhZ29yZWFuIHRyaXBsZXRcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICByZXR1cm4gZmluZEZpcnN0VHJpcGxldCgxMDAwKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMTA6IFN1bW1hdGlvbiBvZiBwcmltZXNcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuVGhlIHN1bSBvZiB0aGUgcHJpbWVzIGJlbG93IDEwIGlzIDIgKyAzICsgNSArIDcgPSAxNy5cblxuRmluZCB0aGUgc3VtIG9mIGFsbCB0aGUgcHJpbWVzIGJlbG93IHR3byBtaWxsaW9uLlxuXG5cIlwiXCJcblxubWF0aCA9IHJlcXVpcmUgXCJtYXRoXCJcblxucHJpbWVTdW0gPSAoY2VpbGluZykgLT5cbiAgc2lldmUgPSBuZXcgbWF0aC5JbmNyZW1lbnRhbFNpZXZlXG5cbiAgc3VtID0gMFxuICBsb29wXG4gICAgbiA9IHNpZXZlLm5leHQoKVxuICAgIGlmIG4gPj0gY2VpbGluZ1xuICAgICAgYnJlYWtcbiAgICBzdW0gKz0gblxuXG4gIHJldHVybiBzdW1cblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgZXF1YWwocHJpbWVTdW0oMTApLCAxNywgXCJTdW0gb2YgcHJpbWVzIGJlbG93IDEwIGlzIDE3XCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgcmV0dXJuIHByaW1lU3VtKDIwMDAwMDApXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAxMTogTGFyZ2VzdCBwcm9kdWN0IGluIGEgZ3JpZFxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5JbiB0aGUgMjB4MjAgZ3JpZCBiZWxvdywgZm91ciBudW1iZXJzIGFsb25nIGEgZGlhZ29uYWwgbGluZSBoYXZlIGJlZW4gbWFya2VkIGluIHJlZC5cblxuICAgICAgICAgIDA4IDAyIDIyIDk3IDM4IDE1IDAwIDQwIDAwIDc1IDA0IDA1IDA3IDc4IDUyIDEyIDUwIDc3IDkxIDA4XG4gICAgICAgICAgNDkgNDkgOTkgNDAgMTcgODEgMTggNTcgNjAgODcgMTcgNDAgOTggNDMgNjkgNDggMDQgNTYgNjIgMDBcbiAgICAgICAgICA4MSA0OSAzMSA3MyA1NSA3OSAxNCAyOSA5MyA3MSA0MCA2NyA1MyA4OCAzMCAwMyA0OSAxMyAzNiA2NVxuICAgICAgICAgIDUyIDcwIDk1IDIzIDA0IDYwIDExIDQyIDY5IDI0IDY4IDU2IDAxIDMyIDU2IDcxIDM3IDAyIDM2IDkxXG4gICAgICAgICAgMjIgMzEgMTYgNzEgNTEgNjcgNjMgODkgNDEgOTIgMzYgNTQgMjIgNDAgNDAgMjggNjYgMzMgMTMgODBcbiAgICAgICAgICAyNCA0NyAzMiA2MCA5OSAwMyA0NSAwMiA0NCA3NSAzMyA1MyA3OCAzNiA4NCAyMCAzNSAxNyAxMiA1MFxuICAgICAgICAgIDMyIDk4IDgxIDI4IDY0IDIzIDY3IDEwIDI2XzM4IDQwIDY3IDU5IDU0IDcwIDY2IDE4IDM4IDY0IDcwXG4gICAgICAgICAgNjcgMjYgMjAgNjggMDIgNjIgMTIgMjAgOTUgNjNfOTQgMzkgNjMgMDggNDAgOTEgNjYgNDkgOTQgMjFcbiAgICAgICAgICAyNCA1NSA1OCAwNSA2NiA3MyA5OSAyNiA5NyAxNyA3OF83OCA5NiA4MyAxNCA4OCAzNCA4OSA2MyA3MlxuICAgICAgICAgIDIxIDM2IDIzIDA5IDc1IDAwIDc2IDQ0IDIwIDQ1IDM1IDE0IDAwIDYxIDMzIDk3IDM0IDMxIDMzIDk1XG4gICAgICAgICAgNzggMTcgNTMgMjggMjIgNzUgMzEgNjcgMTUgOTQgMDMgODAgMDQgNjIgMTYgMTQgMDkgNTMgNTYgOTJcbiAgICAgICAgICAxNiAzOSAwNSA0MiA5NiAzNSAzMSA0NyA1NSA1OCA4OCAyNCAwMCAxNyA1NCAyNCAzNiAyOSA4NSA1N1xuICAgICAgICAgIDg2IDU2IDAwIDQ4IDM1IDcxIDg5IDA3IDA1IDQ0IDQ0IDM3IDQ0IDYwIDIxIDU4IDUxIDU0IDE3IDU4XG4gICAgICAgICAgMTkgODAgODEgNjggMDUgOTQgNDcgNjkgMjggNzMgOTIgMTMgODYgNTIgMTcgNzcgMDQgODkgNTUgNDBcbiAgICAgICAgICAwNCA1MiAwOCA4MyA5NyAzNSA5OSAxNiAwNyA5NyA1NyAzMiAxNiAyNiAyNiA3OSAzMyAyNyA5OCA2NlxuICAgICAgICAgIDg4IDM2IDY4IDg3IDU3IDYyIDIwIDcyIDAzIDQ2IDMzIDY3IDQ2IDU1IDEyIDMyIDYzIDkzIDUzIDY5XG4gICAgICAgICAgMDQgNDIgMTYgNzMgMzggMjUgMzkgMTEgMjQgOTQgNzIgMTggMDggNDYgMjkgMzIgNDAgNjIgNzYgMzZcbiAgICAgICAgICAyMCA2OSAzNiA0MSA3MiAzMCAyMyA4OCAzNCA2MiA5OSA2OSA4MiA2NyA1OSA4NSA3NCAwNCAzNiAxNlxuICAgICAgICAgIDIwIDczIDM1IDI5IDc4IDMxIDkwIDAxIDc0IDMxIDQ5IDcxIDQ4IDg2IDgxIDE2IDIzIDU3IDA1IDU0XG4gICAgICAgICAgMDEgNzAgNTQgNzEgODMgNTEgNTQgNjkgMTYgOTIgMzMgNDggNjEgNDMgNTIgMDEgODkgMTkgNjcgNDhcblxuVGhlIHByb2R1Y3Qgb2YgdGhlc2UgbnVtYmVycyBpcyAyNiB4IDYzIHggNzggeCAxNCA9IDE3ODg2OTYuXG5cbldoYXQgaXMgdGhlIGdyZWF0ZXN0IHByb2R1Y3Qgb2YgZm91ciBhZGphY2VudCBudW1iZXJzIGluIHRoZSBzYW1lIGRpcmVjdGlvbiAodXAsIGRvd24sIGxlZnQsIHJpZ2h0LCBvciBkaWFnb25hbGx5KSBpbiB0aGUgMjB4MjAgZ3JpZD9cblxuXCJcIlwiXG5cbmdyaWQgPSBudWxsXG5cbnByZXBhcmVHcmlkID0gLT5cbiAgcmF3RGlnaXRzID0gXCJcIlwiXG4gICAgMDggMDIgMjIgOTcgMzggMTUgMDAgNDAgMDAgNzUgMDQgMDUgMDcgNzggNTIgMTIgNTAgNzcgOTEgMDhcbiAgICA0OSA0OSA5OSA0MCAxNyA4MSAxOCA1NyA2MCA4NyAxNyA0MCA5OCA0MyA2OSA0OCAwNCA1NiA2MiAwMFxuICAgIDgxIDQ5IDMxIDczIDU1IDc5IDE0IDI5IDkzIDcxIDQwIDY3IDUzIDg4IDMwIDAzIDQ5IDEzIDM2IDY1XG4gICAgNTIgNzAgOTUgMjMgMDQgNjAgMTEgNDIgNjkgMjQgNjggNTYgMDEgMzIgNTYgNzEgMzcgMDIgMzYgOTFcbiAgICAyMiAzMSAxNiA3MSA1MSA2NyA2MyA4OSA0MSA5MiAzNiA1NCAyMiA0MCA0MCAyOCA2NiAzMyAxMyA4MFxuICAgIDI0IDQ3IDMyIDYwIDk5IDAzIDQ1IDAyIDQ0IDc1IDMzIDUzIDc4IDM2IDg0IDIwIDM1IDE3IDEyIDUwXG4gICAgMzIgOTggODEgMjggNjQgMjMgNjcgMTAgMjYgMzggNDAgNjcgNTkgNTQgNzAgNjYgMTggMzggNjQgNzBcbiAgICA2NyAyNiAyMCA2OCAwMiA2MiAxMiAyMCA5NSA2MyA5NCAzOSA2MyAwOCA0MCA5MSA2NiA0OSA5NCAyMVxuICAgIDI0IDU1IDU4IDA1IDY2IDczIDk5IDI2IDk3IDE3IDc4IDc4IDk2IDgzIDE0IDg4IDM0IDg5IDYzIDcyXG4gICAgMjEgMzYgMjMgMDkgNzUgMDAgNzYgNDQgMjAgNDUgMzUgMTQgMDAgNjEgMzMgOTcgMzQgMzEgMzMgOTVcbiAgICA3OCAxNyA1MyAyOCAyMiA3NSAzMSA2NyAxNSA5NCAwMyA4MCAwNCA2MiAxNiAxNCAwOSA1MyA1NiA5MlxuICAgIDE2IDM5IDA1IDQyIDk2IDM1IDMxIDQ3IDU1IDU4IDg4IDI0IDAwIDE3IDU0IDI0IDM2IDI5IDg1IDU3XG4gICAgODYgNTYgMDAgNDggMzUgNzEgODkgMDcgMDUgNDQgNDQgMzcgNDQgNjAgMjEgNTggNTEgNTQgMTcgNThcbiAgICAxOSA4MCA4MSA2OCAwNSA5NCA0NyA2OSAyOCA3MyA5MiAxMyA4NiA1MiAxNyA3NyAwNCA4OSA1NSA0MFxuICAgIDA0IDUyIDA4IDgzIDk3IDM1IDk5IDE2IDA3IDk3IDU3IDMyIDE2IDI2IDI2IDc5IDMzIDI3IDk4IDY2XG4gICAgODggMzYgNjggODcgNTcgNjIgMjAgNzIgMDMgNDYgMzMgNjcgNDYgNTUgMTIgMzIgNjMgOTMgNTMgNjlcbiAgICAwNCA0MiAxNiA3MyAzOCAyNSAzOSAxMSAyNCA5NCA3MiAxOCAwOCA0NiAyOSAzMiA0MCA2MiA3NiAzNlxuICAgIDIwIDY5IDM2IDQxIDcyIDMwIDIzIDg4IDM0IDYyIDk5IDY5IDgyIDY3IDU5IDg1IDc0IDA0IDM2IDE2XG4gICAgMjAgNzMgMzUgMjkgNzggMzEgOTAgMDEgNzQgMzEgNDkgNzEgNDggODYgODEgMTYgMjMgNTcgMDUgNTRcbiAgICAwMSA3MCA1NCA3MSA4MyA1MSA1NCA2OSAxNiA5MiAzMyA0OCA2MSA0MyA1MiAwMSA4OSAxOSA2NyA0OFxuICBcIlwiXCIucmVwbGFjZSgvW14wLTkgXS9nbSwgXCIgXCIpXG5cbiAgZGlnaXRzID0gKHBhcnNlSW50KGRpZ2l0KSBmb3IgZGlnaXQgaW4gcmF3RGlnaXRzLnNwbGl0KFwiIFwiKSlcbiAgZ3JpZCA9IEFycmF5KDIwKVxuICBmb3IgaSBpbiBbMC4uLjIwXVxuICAgIGdyaWRbaV0gPSBBcnJheSgyMClcblxuICBpbmRleCA9IDBcbiAgZm9yIGogaW4gWzAuLi4yMF1cbiAgICBmb3IgaSBpbiBbMC4uLjIwXVxuICAgICAgZ3JpZFtpXVtqXSA9IGRpZ2l0c1tpbmRleF1cbiAgICAgIGluZGV4KytcblxucHJlcGFyZUdyaWQoKVxuXG4jIEdldHMgYSBwcm9kdWN0IG9mIDQgdmFsdWVzIHN0YXJ0aW5nIGF0IChzeCwgc3kpLCBoZWFkaW5nIGluIHRoZSBkaXJlY3Rpb24gKGR4LCBkeSlcbiMgUmV0dXJucyAtMSBpZiB0aGVyZSBpcyBubyByb29tIHRvIG1ha2UgYSBzdHJpcGUgb2YgNC5cbmdldExpbmVQcm9kdWN0ID0gKHN4LCBzeSwgZHgsIGR5KSAtPlxuICBleCA9IHN4ICsgKDQgKiBkeClcbiAgcmV0dXJuIC0xIGlmIChleCA8IDApIG9yIChleCA+PSAyMClcbiAgZXkgPSBzeSArICg0ICogZHkpXG4gIHJldHVybiAtMSBpZiAoZXkgPCAwKSBvciAoZXkgPj0gMjApXG5cbiAgeCA9IHN4XG4gIHkgPSBzeVxuICBwcm9kdWN0ID0gMVxuICBmb3IgaSBpbiBbMC4uLjRdXG4gICAgcHJvZHVjdCAqPSBncmlkW3hdW3ldXG4gICAgeCArPSBkeFxuICAgIHkgKz0gZHlcblxuICByZXR1cm4gcHJvZHVjdFxuXG5nZXRMaW5lID0gKHN4LCBzeSwgZHgsIGR5KSAtPlxuICBleCA9IHN4ICsgKDQgKiBkeClcbiAgcmV0dXJuIFtdIGlmIChleCA8IDApIG9yIChleCA+PSAyMClcbiAgZXkgPSBzeSArICg0ICogZHkpXG4gIHJldHVybiBbXSBpZiAoZXkgPCAwKSBvciAoZXkgPj0gMjApXG5cbiAgbGluZSA9IFtdXG5cbiAgeCA9IHN4XG4gIHkgPSBzeVxuICBmb3IgaSBpbiBbMC4uLjRdXG4gICAgbGluZS5wdXNoIGdyaWRbeF1beV1cbiAgICB4ICs9IGR4XG4gICAgeSArPSBkeVxuXG4gIHJldHVybiBsaW5lXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gICMgRXhhbXBsZSBpcyBkaWFnb25hbCByaWdodC9kb3duIGZyb20gKDgsNilcbiAgZXF1YWwoZ2V0TGluZVByb2R1Y3QoOCwgNiwgMSwgMSksIDE3ODg2OTYsIFwiRGlhZ29uYWwgdmFsdWUgc2hvd24gaW4gZXhhbXBsZSBlcXVhbHMgMSw3ODgsNjk2XCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgbWF4ID1cbiAgICBwcm9kdWN0OiAxXG4gICAgaTogMFxuICAgIGo6IDBcbiAgICBkaXI6IFwicmlnaHRcIlxuXG4gIGZvciBqIGluIFswLi4uMjBdXG4gICAgZm9yIGkgaW4gWzAuLi4yMF1cbiAgICAgIHAgPSBnZXRMaW5lUHJvZHVjdChpLCBqLCAxLCAwKVxuICAgICAgaWYgbWF4LnByb2R1Y3QgPCBwXG4gICAgICAgIG1heC5wcm9kdWN0ID0gcFxuICAgICAgICBtYXguaSA9IGlcbiAgICAgICAgbWF4LmogPSBqXG4gICAgICAgIG1heC5kaXIgPSBcInJpZ2h0XCJcbiAgICAgIHAgPSBnZXRMaW5lUHJvZHVjdChpLCBqLCAwLCAxKVxuICAgICAgaWYgbWF4LnByb2R1Y3QgPCBwXG4gICAgICAgIG1heC5wcm9kdWN0ID0gcFxuICAgICAgICBtYXguaSA9IGlcbiAgICAgICAgbWF4LmogPSBqXG4gICAgICAgIG1heC5kaXIgPSBcImRvd25cIlxuICAgICAgcCA9IGdldExpbmVQcm9kdWN0KGksIGosIDEsIDEpXG4gICAgICBpZiBtYXgucHJvZHVjdCA8IHBcbiAgICAgICAgbWF4LnByb2R1Y3QgPSBwXG4gICAgICAgIG1heC5pID0gaVxuICAgICAgICBtYXguaiA9IGpcbiAgICAgICAgbWF4LmRpciA9IFwiZGlhZ29uYWxSXCJcbiAgICAgIHAgPSBnZXRMaW5lUHJvZHVjdChpLCBqLCAtMSwgMSlcbiAgICAgIGlmIG1heC5wcm9kdWN0IDwgcFxuICAgICAgICBtYXgucHJvZHVjdCA9IHBcbiAgICAgICAgbWF4LmkgPSBpXG4gICAgICAgIG1heC5qID0galxuICAgICAgICBtYXguZGlyID0gXCJkaWFnb25hbExcIlxuXG4gIHJldHVybiBtYXhcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDEyOiBIaWdobHkgZGl2aXNpYmxlIHRyaWFuZ3VsYXIgbnVtYmVyXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblRoZSBzZXF1ZW5jZSBvZiB0cmlhbmdsZSBudW1iZXJzIGlzIGdlbmVyYXRlZCBieSBhZGRpbmcgdGhlIG5hdHVyYWwgbnVtYmVycy4gU28gdGhlIDd0aCB0cmlhbmdsZSBudW1iZXIgd291bGQgYmVcblxuICAgICAgICAgICAgICAgICAgICAgIDEgKyAyICsgMyArIDQgKyA1ICsgNiArIDcgPSAyOC5cblxuVGhlIGZpcnN0IHRlbiB0ZXJtcyB3b3VsZCBiZTpcblxuICAgICAgICAgICAgICAgICAgICAgIDEsIDMsIDYsIDEwLCAxNSwgMjEsIDI4LCAzNiwgNDUsIDU1LCAuLi5cblxuTGV0IHVzIGxpc3QgdGhlIGZhY3RvcnMgb2YgdGhlIGZpcnN0IHNldmVuIHRyaWFuZ2xlIG51bWJlcnM6XG5cbiAxOiAxXG4gMzogMSwzXG4gNjogMSwyLDMsNlxuMTA6IDEsMiw1LDEwXG4xNTogMSwzLDUsMTVcbjIxOiAxLDMsNywyMVxuMjg6IDEsMiw0LDcsMTQsMjhcblxuV2UgY2FuIHNlZSB0aGF0IDI4IGlzIHRoZSBmaXJzdCB0cmlhbmdsZSBudW1iZXIgdG8gaGF2ZSBvdmVyIGZpdmUgZGl2aXNvcnMuXG5cbldoYXQgaXMgdGhlIHZhbHVlIG9mIHRoZSBmaXJzdCB0cmlhbmdsZSBudW1iZXIgdG8gaGF2ZSBvdmVyIGZpdmUgaHVuZHJlZCBkaXZpc29ycz9cblxuXCJcIlwiXG5cbm1hdGggPSByZXF1aXJlIFwibWF0aFwiXG5cbiMgVGhpcyBmdW5jdGlvbiBkb2VzIGl0cyBiZXN0IHRvIGxldmVyYWdlIFJhbWFudWphbidzIFwiVGF1IGZ1bmN0aW9uXCIsXG4jIHdoaWNoIGlzIHN1cHBvc2VkIHRvIGdpdmUgdGhlIG51bWJlciBvZiBwb3NpdGl2ZSBkaXZpc29ycy5cbiNcbiMgVGhlIGlkZWEgaXM6XG4jICogRm9yIHByaW1lcywgVChwXmspID0gayArIDFcbiMgKiBGb3IgYW55IG51bWJlcnMgd2hvc2UgR0NEIGlzIDEsIFQobW4pID0gVChtKSAqIFQobilcbiNcbiMgSSBhbHJlYWR5IGhhdmUgYSBtZXRob2QgdG8gcHJpbWUgZmFjdG9yIGEgbnVtYmVyLCBzbyBJJ2xsIGxldmVyYWdlXG4jIGV2ZXJ5IGdyb3VwaW5nIG9mIHRoZSBzYW1lIHByaW1lIG51bWJlciBhcyB0aGUgZmlyc3QgY2FzZSwgYW5kXG4jIG11bHRpcGx5IHRoZW0gdG9nZXRoZXIuXG4jXG4jIEV4YW1wbGU6IDI4XG4jXG4jIDI4J3MgcHJpbWUgZmFjdG9ycyBhcmUgWzIsIDIsIDddLCBvciAoMl4yICsgNylcbiNcbiMgSSBjYW4gYXNzdW1lIHRoYXQgdGhlIEdDRCBiZXR3ZWVuIGFueSBvZiB0aGUgcHJpbWUgc2V0cyBpcyBnb2luZyB0byBiZSAxIGJlY2F1c2UgZHVoLFxuIyB3aGljaCBtZWFucyB0aGF0OlxuI1xuIyBUKDI4KSA9PSBUKDJeMikgKiBUKDcpXG4jXG4jIFQoMl4yKSA9PSAyICsgMSA9PSAzXG4jIFQoN14xKSA9PSAxICsgMSA9PSAyXG4jIDMgKiAyID0gNlxuIyAyOCBoYXMgNiBkaXZpc29ycy5cbiNcbiMgWW91J3JlIG1hZC5cblxuZGl2aXNvckNvdW50ID0gKG4pIC0+XG4gIHJldHVybiAxIGlmIG4gPT0gMVxuXG4gIGZhY3RvcnMgPSBtYXRoLnByaW1lRmFjdG9ycyhuKVxuICBjb3VudCA9IDFcbiAgbGFzdEZhY3RvciA9IDBcbiAgZXhwb25lbnQgPSAxXG4gIGZvciBmYWN0b3IgaW4gZmFjdG9yc1xuICAgIGlmIGZhY3RvciA9PSBsYXN0RmFjdG9yXG4gICAgICBleHBvbmVudCsrXG4gICAgZWxzZVxuICAgICAgaWYgbGFzdEZhY3RvciAhPSAwXG4gICAgICAgICAgY291bnQgKj0gZXhwb25lbnQgKyAxXG4gICAgICBsYXN0RmFjdG9yID0gZmFjdG9yXG4gICAgICBleHBvbmVudCA9IDFcblxuICBpZiBsYXN0RmFjdG9yICE9IDBcbiAgICAgIGNvdW50ICo9IGV4cG9uZW50ICsgMVxuXG4gIHJldHVybiBjb3VudFxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChkaXZpc29yQ291bnQoIDEpLCAxLCBcIiAxIGhhcyAxIGRpdmlzb3JzXCIpXG4gIGVxdWFsKGRpdmlzb3JDb3VudCggMyksIDIsIFwiIDMgaGFzIDIgZGl2aXNvcnNcIilcbiAgZXF1YWwoZGl2aXNvckNvdW50KCA2KSwgNCwgXCIgNiBoYXMgNCBkaXZpc29yc1wiKVxuICBlcXVhbChkaXZpc29yQ291bnQoMTApLCA0LCBcIjEwIGhhcyA0IGRpdmlzb3JzXCIpXG4gIGVxdWFsKGRpdmlzb3JDb3VudCgxNSksIDQsIFwiMTUgaGFzIDQgZGl2aXNvcnNcIilcbiAgZXF1YWwoZGl2aXNvckNvdW50KDIxKSwgNCwgXCIyMSBoYXMgNCBkaXZpc29yc1wiKVxuICBlcXVhbChkaXZpc29yQ291bnQoMjgpLCA2LCBcIjI4IGhhcyA2IGRpdmlzb3JzXCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgbiA9IDFcbiAgc3RlcCA9IDJcblxuICBsb29wXG4gICAgY291bnQgPSBkaXZpc29yQ291bnQobilcbiAgICBpZiBjb3VudCA+IDUwMFxuICAgICAgcmV0dXJuIHsgbjogbiwgY291bnQ6IGNvdW50IH1cblxuICAgICMgbmV4dCB0cmlhbmd1bGFyIG51bWJlclxuICAgIG4gKz0gc3RlcFxuICAgIHN0ZXArK1xuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMTM6IExhcmdlIHN1bVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbldvcmsgb3V0IHRoZSBmaXJzdCB0ZW4gZGlnaXRzIG9mIHRoZSBzdW0gb2YgdGhlIGZvbGxvd2luZyBvbmUtaHVuZHJlZCA1MC1kaWdpdCBudW1iZXJzLlxuXG4zNzEwNzI4NzUzMzkwMjEwMjc5ODc5Nzk5ODIyMDgzNzU5MDI0NjUxMDEzNTc0MDI1MFxuNDYzNzY5Mzc2Nzc0OTAwMDk3MTI2NDgxMjQ4OTY5NzAwNzgwNTA0MTcwMTgyNjA1Mzhcbjc0MzI0OTg2MTk5NTI0NzQxMDU5NDc0MjMzMzA5NTEzMDU4MTIzNzI2NjE3MzA5NjI5XG45MTk0MjIxMzM2MzU3NDE2MTU3MjUyMjQzMDU2MzMwMTgxMTA3MjQwNjE1NDkwODI1MFxuMjMwNjc1ODgyMDc1MzkzNDYxNzExNzE5ODAzMTA0MjEwNDc1MTM3NzgwNjMyNDY2NzZcbjg5MjYxNjcwNjk2NjIzNjMzODIwMTM2Mzc4NDE4MzgzNjg0MTc4NzM0MzYxNzI2NzU3XG4yODExMjg3OTgxMjg0OTk3OTQwODA2NTQ4MTkzMTU5MjYyMTY5MTI3NTg4OTgzMjczOFxuNDQyNzQyMjg5MTc0MzI1MjAzMjE5MjM1ODk0MjI4NzY3OTY0ODc2NzAyNzIxODkzMThcbjQ3NDUxNDQ1NzM2MDAxMzA2NDM5MDkxMTY3MjE2ODU2ODQ0NTg4NzExNjAzMTUzMjc2XG43MDM4NjQ4NjEwNTg0MzAyNTQzOTkzOTYxOTgyODkxNzU5MzY2NTY4Njc1NzkzNDk1MVxuNjIxNzY0NTcxNDE4NTY1NjA2Mjk1MDIxNTcyMjMxOTY1ODY3NTUwNzkzMjQxOTMzMzFcbjY0OTA2MzUyNDYyNzQxOTA0OTI5MTAxNDMyNDQ1ODEzODIyNjYzMzQ3OTQ0NzU4MTc4XG45MjU3NTg2NzcxODMzNzIxNzY2MTk2Mzc1MTU5MDU3OTIzOTcyODI0NTU5ODgzODQwN1xuNTgyMDM1NjUzMjUzNTkzOTkwMDg0MDI2MzM1Njg5NDg4MzAxODk0NTg2MjgyMjc4MjhcbjgwMTgxMTk5Mzg0ODI2MjgyMDE0Mjc4MTk0MTM5OTQwNTY3NTg3MTUxMTcwMDk0MzkwXG4zNTM5ODY2NDM3MjgyNzExMjY1MzgyOTk4NzI0MDc4NDQ3MzA1MzE5MDEwNDI5MzU4NlxuODY1MTU1MDYwMDYyOTU4NjQ4NjE1MzIwNzUyNzMzNzE5NTkxOTE0MjA1MTcyNTU4MjlcbjcxNjkzODg4NzA3NzE1NDY2NDk5MTE1NTkzNDg3NjAzNTMyOTIxNzE0OTcwMDU2OTM4XG41NDM3MDA3MDU3NjgyNjY4NDYyNDYyMTQ5NTY1MDA3NjQ3MTc4NzI5NDQzODM3NzYwNFxuNTMyODI2NTQxMDg3NTY4Mjg0NDMxOTExOTA2MzQ2OTQwMzc4NTUyMTc3NzkyOTUxNDVcbjM2MTIzMjcyNTI1MDAwMjk2MDcxMDc1MDgyNTYzODE1NjU2NzEwODg1MjU4MzUwNzIxXG40NTg3NjU3NjE3MjQxMDk3NjQ0NzMzOTExMDYwNzIxODI2NTIzNjg3NzIyMzYzNjA0NVxuMTc0MjM3MDY5MDU4NTE4NjA2NjA0NDgyMDc2MjEyMDk4MTMyODc4NjA3MzM5Njk0MTJcbjgxMTQyNjYwNDE4MDg2ODMwNjE5MzI4NDYwODExMTkxMDYxNTU2OTQwNTEyNjg5NjkyXG41MTkzNDMyNTQ1MTcyODM4ODY0MTkxODA0NzA0OTI5MzIxNTA1ODY0MjU2MzA0OTQ4M1xuNjI0NjcyMjE2NDg0MzUwNzYyMDE3Mjc5MTgwMzk5NDQ2OTMwMDQ3MzI5NTYzNDA2OTFcbjE1NzMyNDQ0Mzg2OTA4MTI1Nzk0NTE0MDg5MDU3NzA2MjI5NDI5MTk3MTA3OTI4MjA5XG41NTAzNzY4NzUyNTY3ODc3MzA5MTg2MjU0MDc0NDk2OTg0NDUwODMzMDM5MzY4MjEyNlxuMTgzMzYzODQ4MjUzMzAxNTQ2ODYxOTYxMjQzNDg3Njc2ODEyOTc1MzQzNzU5NDY1MTVcbjgwMzg2Mjg3NTkyODc4NDkwMjAxNTIxNjg1NTU0ODI4NzE3MjAxMjE5MjU3NzY2OTU0XG43ODE4MjgzMzc1Nzk5MzEwMzYxNDc0MDM1Njg1NjQ0OTA5NTUyNzA5Nzg2NDc5NzU4MVxuMTY3MjYzMjAxMDA0MzY4OTc4NDI1NTM1Mzk5MjA5MzE4Mzc0NDE0OTc4MDY4NjA5ODRcbjQ4NDAzMDk4MTI5MDc3NzkxNzk5MDg4MjE4Nzk1MzI3MzY0NDc1Njc1NTkwODQ4MDMwXG44NzA4Njk4NzU1MTM5MjcxMTg1NDUxNzA3ODU0NDE2MTg1MjQyNDMyMDY5MzE1MDMzMlxuNTk5NTk0MDY4OTU3NTY1MzY3ODIxMDcwNzQ5MjY5NjY1Mzc2NzYzMjYyMzU0NDcyMTBcbjY5NzkzOTUwNjc5NjUyNjk0NzQyNTk3NzA5NzM5MTY2NjkzNzYzMDQyNjMzOTg3MDg1XG40MTA1MjY4NDcwODI5OTA4NTIxMTM5OTQyNzM2NTczNDExNjE4Mjc2MDMxNTAwMTI3MVxuNjUzNzg2MDczNjE1MDEwODA4NTcwMDkxNDk5Mzk1MTI1NTcwMjgxOTg3NDYwMDQzNzVcbjM1ODI5MDM1MzE3NDM0NzE3MzI2OTMyMTIzNTc4MTU0OTgyNjI5NzQyNTUyNzM3MzA3XG45NDk1Mzc1OTc2NTEwNTMwNTk0Njk2NjA2NzY4MzE1NjU3NDM3NzE2NzQwMTg3NTI3NVxuODg5MDI4MDI1NzE3MzMyMjk2MTkxNzY2Njg3MTM4MTk5MzE4MTEwNDg3NzAxOTAyNzFcbjI1MjY3NjgwMjc2MDc4MDAzMDEzNjc4NjgwOTkyNTI1NDYzNDAxMDYxNjMyODY2NTI2XG4zNjI3MDIxODU0MDQ5NzcwNTU4NTYyOTk0NjU4MDYzNjIzNzk5MzE0MDc0NjI1NTk2MlxuMjQwNzQ0ODY5MDgyMzExNzQ5Nzc3OTIzNjU0NjYyNTcyNDY5MjMzMjI4MTA5MTcxNDFcbjkxNDMwMjg4MTk3MTAzMjg4NTk3ODA2NjY5NzYwODkyOTM4NjM4Mjg1MDI1MzMzNDAzXG4zNDQxMzA2NTU3ODAxNjEyNzgxNTkyMTgxNTAwNTU2MTg2ODgzNjQ2ODQyMDA5MDQ3MFxuMjMwNTMwODExNzI4MTY0MzA0ODc2MjM3OTE5Njk4NDI0ODcyNTUwMzY2Mzg3ODQ1ODNcbjExNDg3Njk2OTMyMTU0OTAyODEwNDI0MDIwMTM4MzM1MTI0NDYyMTgxNDQxNzczNDcwXG42Mzc4MzI5OTQ5MDYzNjI1OTY2NjQ5ODU4NzYxODIyMTIyNTIyNTUxMjQ4Njc2NDUzM1xuNjc3MjAxODY5NzE2OTg1NDQzMTI0MTk1NzI0MDk5MTM5NTkwMDg5NTIzMTAwNTg4MjJcbjk1NTQ4MjU1MzAwMjYzNTIwNzgxNTMyMjk2Nzk2MjQ5NDgxNjQxOTUzODY4MjE4Nzc0XG43NjA4NTMyNzEzMjI4NTcyMzExMDQyNDgwMzQ1NjEyNDg2NzY5NzA2NDUwNzk5NTIzNlxuMzc3NzQyNDI1MzU0MTEyOTE2ODQyNzY4NjU1Mzg5MjYyMDUwMjQ5MTAzMjY1NzI5NjdcbjIzNzAxOTEzMjc1NzI1Njc1Mjg1NjUzMjQ4MjU4MjY1NDYzMDkyMjA3MDU4NTk2NTIyXG4yOTc5ODg2MDI3MjI1ODMzMTkxMzEyNjM3NTE0NzM0MTk5NDg4OTUzNDc2NTc0NTUwMVxuMTg0OTU3MDE0NTQ4NzkyODg5ODQ4NTY4Mjc3MjYwNzc3MTM3MjE0MDM3OTg4Nzk3MTVcbjM4Mjk4MjAzNzgzMDMxNDczNTI3NzIxNTgwMzQ4MTQ0NTEzNDkxMzczMjI2NjUxMzgxXG4zNDgyOTU0MzgyOTE5OTkxODE4MDI3ODkxNjUyMjQzMTAyNzM5MjI1MTEyMjg2OTUzOVxuNDA5NTc5NTMwNjY0MDUyMzI2MzI1MzgwNDQxMDAwNTk2NTQ5MzkxNTk4Nzk1OTM2MzVcbjI5NzQ2MTUyMTg1NTAyMzcxMzA3NjQyMjU1MTIxMTgzNjkzODAzNTgwMzg4NTg0OTAzXG40MTY5ODExNjIyMjA3Mjk3NzE4NjE1ODIzNjY3ODQyNDY4OTE1Nzk5MzUzMjk2MTkyMlxuNjI0Njc5NTcxOTQ0MDEyNjkwNDM4NzcxMDcyNzUwNDgxMDIzOTA4OTU1MjM1OTc0NTdcbjIzMTg5NzA2NzcyNTQ3OTE1MDYxNTA1NTA0OTUzOTIyOTc5NTMwOTAxMTI5OTY3NTE5XG44NjE4ODA4ODIyNTg3NTMxNDUyOTU4NDA5OTI1MTIwMzgyOTAwOTQwNzc3MDc3NTY3MlxuMTEzMDY3Mzk3MDgzMDQ3MjQ0ODM4MTY1MzM4NzM1MDIzNDA4NDU2NDcwNTgwNzczMDhcbjgyOTU5MTc0NzY3MTQwMzYzMTk4MDA4MTg3MTI5MDExODc1NDkxMzEwNTQ3MTI2NTgxXG45NzYyMzMzMTA0NDgxODM4NjI2OTUxNTQ1NjMzNDkyNjM2NjU3Mjg5NzU2MzQwMDUwMFxuNDI4NDYyODAxODM1MTcwNzA1Mjc4MzE4Mzk0MjU4ODIxNDU1MjEyMjcyNTEyNTAzMjdcbjU1MTIxNjAzNTQ2OTgxMjAwNTgxNzYyMTY1MjEyODI3NjUyNzUxNjkxMjk2ODk3Nzg5XG4zMjIzODE5NTczNDMyOTMzOTk0NjQzNzUwMTkwNzgzNjk0NTc2NTg4MzM1MjM5OTg4NlxuNzU1MDYxNjQ5NjUxODQ3NzUxODA3MzgxNjg4Mzc4NjEwOTE1MjczNTc5Mjk3MDEzMzdcbjYyMTc3ODQyNzUyMTkyNjIzNDAxOTQyMzk5NjM5MTY4MDQ0OTgzOTkzMTczMzEyNzMxXG4zMjkyNDE4NTcwNzE0NzM0OTU2NjkxNjY3NDY4NzYzNDY2MDkxNTAzNTkxNDY3NzUwNFxuOTk1MTg2NzE0MzAyMzUyMTk2Mjg4OTQ4OTAxMDI0MjMzMjUxMTY5MTM2MTk2MjY2MjJcbjczMjY3NDYwODAwNTkxNTQ3NDcxODMwNzk4MzkyODY4NTM1MjA2OTQ2OTQ0NTQwNzI0XG43Njg0MTgyMjUyNDY3NDQxNzE2MTUxNDAzNjQyNzk4MjI3MzM0ODA1NTU1NjIxNDgxOFxuOTcxNDI2MTc5MTAzNDI1OTg2NDcyMDQ1MTY4OTM5ODk0MjIxNzk4MjYwODgwNzY4NTJcbjg3NzgzNjQ2MTgyNzk5MzQ2MzEzNzY3NzU0MzA3ODA5MzYzMzMzMDE4OTgyNjQyMDkwXG4xMDg0ODgwMjUyMTY3NDY3MDg4MzIxNTEyMDE4NTg4MzU0MzIyMzgxMjg3Njk1Mjc4NlxuNzEzMjk2MTI0NzQ3ODI0NjQ1Mzg2MzY5OTMwMDkwNDkzMTAzNjM2MTk3NjM4NzgwMzlcbjYyMTg0MDczNTcyMzk5Nzk0MjIzNDA2MjM1MzkzODA4MzM5NjUxMzI3NDA4MDExMTE2XG42NjYyNzg5MTk4MTQ4ODA4Nzc5Nzk0MTg3Njg3NjE0NDIzMDAzMDk4NDQ5MDg1MTQxMVxuNjA2NjE4MjYyOTM2ODI4MzY3NjQ3NDQ3NzkyMzkxODAzMzUxMTA5ODkwNjk3OTA3MTRcbjg1Nzg2OTQ0MDg5NTUyOTkwNjUzNjQwNDQ3NDI1NTc2MDgzNjU5OTc2NjQ1Nzk1MDk2XG42NjAyNDM5NjQwOTkwNTM4OTYwNzEyMDE5ODIxOTk3NjA0NzU5OTQ5MDE5NzIzMDI5N1xuNjQ5MTM5ODI2ODAwMzI5NzMxNTYwMzcxMjAwNDEzNzc5MDM3ODU1NjYwODUwODkyNTJcbjE2NzMwOTM5MzE5ODcyNzUwMjc1NDY4OTA2OTAzNzA3NTM5NDEzMDQyNjUyMzE1MDExXG45NDgwOTM3NzI0NTA0ODc5NTE1MDk1NDEwMDkyMTY0NTg2Mzc1NDcxMDU5ODQzNjc5MVxuNzg2MzkxNjcwMjExODc0OTI0MzE5OTU3MDA2NDE5MTc5Njk3Nzc1OTkwMjgzMDA2OTlcbjE1MzY4NzEzNzExOTM2NjE0OTUyODExMzA1ODc2MzgwMjc4NDEwNzU0NDQ5NzMzMDc4XG40MDc4OTkyMzExNTUzNTU2MjU2MTE0MjMyMjQyMzI1NTAzMzY4NTQ0MjQ4ODkxNzM1M1xuNDQ4ODk5MTE1MDE0NDA2NDgwMjAzNjkwNjgwNjM5NjA2NzIzMjIxOTMyMDQxNDk1MzVcbjQxNTAzMTI4ODgwMzM5NTM2MDUzMjk5MzQwMzY4MDA2OTc3NzEwNjUwNTY2NjMxOTU0XG44MTIzNDg4MDY3MzIxMDE0NjczOTA1ODU2ODU1NzkzNDU4MTQwMzYyNzgyMjcwMzI4MFxuODI2MTY1NzA3NzM5NDgzMjc1OTIyMzI4NDU5NDE3MDY1MjUwOTQ1MTIzMjUyMzA2MDhcbjIyOTE4ODAyMDU4Nzc3MzE5NzE5ODM5NDUwMTgwODg4MDcyNDI5NjYxOTgwODExMTk3XG43NzE1ODU0MjUwMjAxNjU0NTA5MDQxMzI0NTgwOTc4Njg4Mjc3ODk0ODcyMTg1OTYxN1xuNzIxMDc4Mzg0MzUwNjkxODYxNTU0MzU2NjI4ODQwNjIyNTc0NzM2OTIyODQ1MDk1MTZcbjIwODQ5NjAzOTgwMTM0MDAxNzIzOTMwNjcxNjY2ODIzNTU1MjQ1MjUyODA0NjA5NzIyXG41MzUwMzUzNDIyNjQ3MjUyNDI1MDg3NDA1NDA3NTU5MTc4OTc4MTI2NDMzMDMzMTY5MFxuXG5cIlwiXCJcblxubnVtYmVycyA9IFtcbiAgMzcxMDcyODc1MzM5MDIxMDI3OTg3OTc5OTgyMjA4Mzc1OTAyNDY1MTAxMzU3NDAyNTBcbiAgNDYzNzY5Mzc2Nzc0OTAwMDk3MTI2NDgxMjQ4OTY5NzAwNzgwNTA0MTcwMTgyNjA1MzhcbiAgNzQzMjQ5ODYxOTk1MjQ3NDEwNTk0NzQyMzMzMDk1MTMwNTgxMjM3MjY2MTczMDk2MjlcbiAgOTE5NDIyMTMzNjM1NzQxNjE1NzI1MjI0MzA1NjMzMDE4MTEwNzI0MDYxNTQ5MDgyNTBcbiAgMjMwNjc1ODgyMDc1MzkzNDYxNzExNzE5ODAzMTA0MjEwNDc1MTM3NzgwNjMyNDY2NzZcbiAgODkyNjE2NzA2OTY2MjM2MzM4MjAxMzYzNzg0MTgzODM2ODQxNzg3MzQzNjE3MjY3NTdcbiAgMjgxMTI4Nzk4MTI4NDk5Nzk0MDgwNjU0ODE5MzE1OTI2MjE2OTEyNzU4ODk4MzI3MzhcbiAgNDQyNzQyMjg5MTc0MzI1MjAzMjE5MjM1ODk0MjI4NzY3OTY0ODc2NzAyNzIxODkzMThcbiAgNDc0NTE0NDU3MzYwMDEzMDY0MzkwOTExNjcyMTY4NTY4NDQ1ODg3MTE2MDMxNTMyNzZcbiAgNzAzODY0ODYxMDU4NDMwMjU0Mzk5Mzk2MTk4Mjg5MTc1OTM2NjU2ODY3NTc5MzQ5NTFcbiAgNjIxNzY0NTcxNDE4NTY1NjA2Mjk1MDIxNTcyMjMxOTY1ODY3NTUwNzkzMjQxOTMzMzFcbiAgNjQ5MDYzNTI0NjI3NDE5MDQ5MjkxMDE0MzI0NDU4MTM4MjI2NjMzNDc5NDQ3NTgxNzhcbiAgOTI1NzU4Njc3MTgzMzcyMTc2NjE5NjM3NTE1OTA1NzkyMzk3MjgyNDU1OTg4Mzg0MDdcbiAgNTgyMDM1NjUzMjUzNTkzOTkwMDg0MDI2MzM1Njg5NDg4MzAxODk0NTg2MjgyMjc4MjhcbiAgODAxODExOTkzODQ4MjYyODIwMTQyNzgxOTQxMzk5NDA1Njc1ODcxNTExNzAwOTQzOTBcbiAgMzUzOTg2NjQzNzI4MjcxMTI2NTM4Mjk5ODcyNDA3ODQ0NzMwNTMxOTAxMDQyOTM1ODZcbiAgODY1MTU1MDYwMDYyOTU4NjQ4NjE1MzIwNzUyNzMzNzE5NTkxOTE0MjA1MTcyNTU4MjlcbiAgNzE2OTM4ODg3MDc3MTU0NjY0OTkxMTU1OTM0ODc2MDM1MzI5MjE3MTQ5NzAwNTY5MzhcbiAgNTQzNzAwNzA1NzY4MjY2ODQ2MjQ2MjE0OTU2NTAwNzY0NzE3ODcyOTQ0MzgzNzc2MDRcbiAgNTMyODI2NTQxMDg3NTY4Mjg0NDMxOTExOTA2MzQ2OTQwMzc4NTUyMTc3NzkyOTUxNDVcbiAgMzYxMjMyNzI1MjUwMDAyOTYwNzEwNzUwODI1NjM4MTU2NTY3MTA4ODUyNTgzNTA3MjFcbiAgNDU4NzY1NzYxNzI0MTA5NzY0NDczMzkxMTA2MDcyMTgyNjUyMzY4NzcyMjM2MzYwNDVcbiAgMTc0MjM3MDY5MDU4NTE4NjA2NjA0NDgyMDc2MjEyMDk4MTMyODc4NjA3MzM5Njk0MTJcbiAgODExNDI2NjA0MTgwODY4MzA2MTkzMjg0NjA4MTExOTEwNjE1NTY5NDA1MTI2ODk2OTJcbiAgNTE5MzQzMjU0NTE3MjgzODg2NDE5MTgwNDcwNDkyOTMyMTUwNTg2NDI1NjMwNDk0ODNcbiAgNjI0NjcyMjE2NDg0MzUwNzYyMDE3Mjc5MTgwMzk5NDQ2OTMwMDQ3MzI5NTYzNDA2OTFcbiAgMTU3MzI0NDQzODY5MDgxMjU3OTQ1MTQwODkwNTc3MDYyMjk0MjkxOTcxMDc5MjgyMDlcbiAgNTUwMzc2ODc1MjU2Nzg3NzMwOTE4NjI1NDA3NDQ5Njk4NDQ1MDgzMzAzOTM2ODIxMjZcbiAgMTgzMzYzODQ4MjUzMzAxNTQ2ODYxOTYxMjQzNDg3Njc2ODEyOTc1MzQzNzU5NDY1MTVcbiAgODAzODYyODc1OTI4Nzg0OTAyMDE1MjE2ODU1NTQ4Mjg3MTcyMDEyMTkyNTc3NjY5NTRcbiAgNzgxODI4MzM3NTc5OTMxMDM2MTQ3NDAzNTY4NTY0NDkwOTU1MjcwOTc4NjQ3OTc1ODFcbiAgMTY3MjYzMjAxMDA0MzY4OTc4NDI1NTM1Mzk5MjA5MzE4Mzc0NDE0OTc4MDY4NjA5ODRcbiAgNDg0MDMwOTgxMjkwNzc3OTE3OTkwODgyMTg3OTUzMjczNjQ0NzU2NzU1OTA4NDgwMzBcbiAgODcwODY5ODc1NTEzOTI3MTE4NTQ1MTcwNzg1NDQxNjE4NTI0MjQzMjA2OTMxNTAzMzJcbiAgNTk5NTk0MDY4OTU3NTY1MzY3ODIxMDcwNzQ5MjY5NjY1Mzc2NzYzMjYyMzU0NDcyMTBcbiAgNjk3OTM5NTA2Nzk2NTI2OTQ3NDI1OTc3MDk3MzkxNjY2OTM3NjMwNDI2MzM5ODcwODVcbiAgNDEwNTI2ODQ3MDgyOTkwODUyMTEzOTk0MjczNjU3MzQxMTYxODI3NjAzMTUwMDEyNzFcbiAgNjUzNzg2MDczNjE1MDEwODA4NTcwMDkxNDk5Mzk1MTI1NTcwMjgxOTg3NDYwMDQzNzVcbiAgMzU4MjkwMzUzMTc0MzQ3MTczMjY5MzIxMjM1NzgxNTQ5ODI2Mjk3NDI1NTI3MzczMDdcbiAgOTQ5NTM3NTk3NjUxMDUzMDU5NDY5NjYwNjc2ODMxNTY1NzQzNzcxNjc0MDE4NzUyNzVcbiAgODg5MDI4MDI1NzE3MzMyMjk2MTkxNzY2Njg3MTM4MTk5MzE4MTEwNDg3NzAxOTAyNzFcbiAgMjUyNjc2ODAyNzYwNzgwMDMwMTM2Nzg2ODA5OTI1MjU0NjM0MDEwNjE2MzI4NjY1MjZcbiAgMzYyNzAyMTg1NDA0OTc3MDU1ODU2Mjk5NDY1ODA2MzYyMzc5OTMxNDA3NDYyNTU5NjJcbiAgMjQwNzQ0ODY5MDgyMzExNzQ5Nzc3OTIzNjU0NjYyNTcyNDY5MjMzMjI4MTA5MTcxNDFcbiAgOTE0MzAyODgxOTcxMDMyODg1OTc4MDY2Njk3NjA4OTI5Mzg2MzgyODUwMjUzMzM0MDNcbiAgMzQ0MTMwNjU1NzgwMTYxMjc4MTU5MjE4MTUwMDU1NjE4Njg4MzY0Njg0MjAwOTA0NzBcbiAgMjMwNTMwODExNzI4MTY0MzA0ODc2MjM3OTE5Njk4NDI0ODcyNTUwMzY2Mzg3ODQ1ODNcbiAgMTE0ODc2OTY5MzIxNTQ5MDI4MTA0MjQwMjAxMzgzMzUxMjQ0NjIxODE0NDE3NzM0NzBcbiAgNjM3ODMyOTk0OTA2MzYyNTk2NjY0OTg1ODc2MTgyMjEyMjUyMjU1MTI0ODY3NjQ1MzNcbiAgNjc3MjAxODY5NzE2OTg1NDQzMTI0MTk1NzI0MDk5MTM5NTkwMDg5NTIzMTAwNTg4MjJcbiAgOTU1NDgyNTUzMDAyNjM1MjA3ODE1MzIyOTY3OTYyNDk0ODE2NDE5NTM4NjgyMTg3NzRcbiAgNzYwODUzMjcxMzIyODU3MjMxMTA0MjQ4MDM0NTYxMjQ4Njc2OTcwNjQ1MDc5OTUyMzZcbiAgMzc3NzQyNDI1MzU0MTEyOTE2ODQyNzY4NjU1Mzg5MjYyMDUwMjQ5MTAzMjY1NzI5NjdcbiAgMjM3MDE5MTMyNzU3MjU2NzUyODU2NTMyNDgyNTgyNjU0NjMwOTIyMDcwNTg1OTY1MjJcbiAgMjk3OTg4NjAyNzIyNTgzMzE5MTMxMjYzNzUxNDczNDE5OTQ4ODk1MzQ3NjU3NDU1MDFcbiAgMTg0OTU3MDE0NTQ4NzkyODg5ODQ4NTY4Mjc3MjYwNzc3MTM3MjE0MDM3OTg4Nzk3MTVcbiAgMzgyOTgyMDM3ODMwMzE0NzM1Mjc3MjE1ODAzNDgxNDQ1MTM0OTEzNzMyMjY2NTEzODFcbiAgMzQ4Mjk1NDM4MjkxOTk5MTgxODAyNzg5MTY1MjI0MzEwMjczOTIyNTExMjI4Njk1MzlcbiAgNDA5NTc5NTMwNjY0MDUyMzI2MzI1MzgwNDQxMDAwNTk2NTQ5MzkxNTk4Nzk1OTM2MzVcbiAgMjk3NDYxNTIxODU1MDIzNzEzMDc2NDIyNTUxMjExODM2OTM4MDM1ODAzODg1ODQ5MDNcbiAgNDE2OTgxMTYyMjIwNzI5NzcxODYxNTgyMzY2Nzg0MjQ2ODkxNTc5OTM1MzI5NjE5MjJcbiAgNjI0Njc5NTcxOTQ0MDEyNjkwNDM4NzcxMDcyNzUwNDgxMDIzOTA4OTU1MjM1OTc0NTdcbiAgMjMxODk3MDY3NzI1NDc5MTUwNjE1MDU1MDQ5NTM5MjI5Nzk1MzA5MDExMjk5Njc1MTlcbiAgODYxODgwODgyMjU4NzUzMTQ1Mjk1ODQwOTkyNTEyMDM4MjkwMDk0MDc3NzA3NzU2NzJcbiAgMTEzMDY3Mzk3MDgzMDQ3MjQ0ODM4MTY1MzM4NzM1MDIzNDA4NDU2NDcwNTgwNzczMDhcbiAgODI5NTkxNzQ3NjcxNDAzNjMxOTgwMDgxODcxMjkwMTE4NzU0OTEzMTA1NDcxMjY1ODFcbiAgOTc2MjMzMzEwNDQ4MTgzODYyNjk1MTU0NTYzMzQ5MjYzNjY1NzI4OTc1NjM0MDA1MDBcbiAgNDI4NDYyODAxODM1MTcwNzA1Mjc4MzE4Mzk0MjU4ODIxNDU1MjEyMjcyNTEyNTAzMjdcbiAgNTUxMjE2MDM1NDY5ODEyMDA1ODE3NjIxNjUyMTI4Mjc2NTI3NTE2OTEyOTY4OTc3ODlcbiAgMzIyMzgxOTU3MzQzMjkzMzk5NDY0Mzc1MDE5MDc4MzY5NDU3NjU4ODMzNTIzOTk4ODZcbiAgNzU1MDYxNjQ5NjUxODQ3NzUxODA3MzgxNjg4Mzc4NjEwOTE1MjczNTc5Mjk3MDEzMzdcbiAgNjIxNzc4NDI3NTIxOTI2MjM0MDE5NDIzOTk2MzkxNjgwNDQ5ODM5OTMxNzMzMTI3MzFcbiAgMzI5MjQxODU3MDcxNDczNDk1NjY5MTY2NzQ2ODc2MzQ2NjA5MTUwMzU5MTQ2Nzc1MDRcbiAgOTk1MTg2NzE0MzAyMzUyMTk2Mjg4OTQ4OTAxMDI0MjMzMjUxMTY5MTM2MTk2MjY2MjJcbiAgNzMyNjc0NjA4MDA1OTE1NDc0NzE4MzA3OTgzOTI4Njg1MzUyMDY5NDY5NDQ1NDA3MjRcbiAgNzY4NDE4MjI1MjQ2NzQ0MTcxNjE1MTQwMzY0Mjc5ODIyNzMzNDgwNTU1NTYyMTQ4MThcbiAgOTcxNDI2MTc5MTAzNDI1OTg2NDcyMDQ1MTY4OTM5ODk0MjIxNzk4MjYwODgwNzY4NTJcbiAgODc3ODM2NDYxODI3OTkzNDYzMTM3Njc3NTQzMDc4MDkzNjMzMzMwMTg5ODI2NDIwOTBcbiAgMTA4NDg4MDI1MjE2NzQ2NzA4ODMyMTUxMjAxODU4ODM1NDMyMjM4MTI4NzY5NTI3ODZcbiAgNzEzMjk2MTI0NzQ3ODI0NjQ1Mzg2MzY5OTMwMDkwNDkzMTAzNjM2MTk3NjM4NzgwMzlcbiAgNjIxODQwNzM1NzIzOTk3OTQyMjM0MDYyMzUzOTM4MDgzMzk2NTEzMjc0MDgwMTExMTZcbiAgNjY2Mjc4OTE5ODE0ODgwODc3OTc5NDE4NzY4NzYxNDQyMzAwMzA5ODQ0OTA4NTE0MTFcbiAgNjA2NjE4MjYyOTM2ODI4MzY3NjQ3NDQ3NzkyMzkxODAzMzUxMTA5ODkwNjk3OTA3MTRcbiAgODU3ODY5NDQwODk1NTI5OTA2NTM2NDA0NDc0MjU1NzYwODM2NTk5NzY2NDU3OTUwOTZcbiAgNjYwMjQzOTY0MDk5MDUzODk2MDcxMjAxOTgyMTk5NzYwNDc1OTk0OTAxOTcyMzAyOTdcbiAgNjQ5MTM5ODI2ODAwMzI5NzMxNTYwMzcxMjAwNDEzNzc5MDM3ODU1NjYwODUwODkyNTJcbiAgMTY3MzA5MzkzMTk4NzI3NTAyNzU0Njg5MDY5MDM3MDc1Mzk0MTMwNDI2NTIzMTUwMTFcbiAgOTQ4MDkzNzcyNDUwNDg3OTUxNTA5NTQxMDA5MjE2NDU4NjM3NTQ3MTA1OTg0MzY3OTFcbiAgNzg2MzkxNjcwMjExODc0OTI0MzE5OTU3MDA2NDE5MTc5Njk3Nzc1OTkwMjgzMDA2OTlcbiAgMTUzNjg3MTM3MTE5MzY2MTQ5NTI4MTEzMDU4NzYzODAyNzg0MTA3NTQ0NDk3MzMwNzhcbiAgNDA3ODk5MjMxMTU1MzU1NjI1NjExNDIzMjI0MjMyNTUwMzM2ODU0NDI0ODg5MTczNTNcbiAgNDQ4ODk5MTE1MDE0NDA2NDgwMjAzNjkwNjgwNjM5NjA2NzIzMjIxOTMyMDQxNDk1MzVcbiAgNDE1MDMxMjg4ODAzMzk1MzYwNTMyOTkzNDAzNjgwMDY5Nzc3MTA2NTA1NjY2MzE5NTRcbiAgODEyMzQ4ODA2NzMyMTAxNDY3MzkwNTg1Njg1NTc5MzQ1ODE0MDM2Mjc4MjI3MDMyODBcbiAgODI2MTY1NzA3NzM5NDgzMjc1OTIyMzI4NDU5NDE3MDY1MjUwOTQ1MTIzMjUyMzA2MDhcbiAgMjI5MTg4MDIwNTg3NzczMTk3MTk4Mzk0NTAxODA4ODgwNzI0Mjk2NjE5ODA4MTExOTdcbiAgNzcxNTg1NDI1MDIwMTY1NDUwOTA0MTMyNDU4MDk3ODY4ODI3Nzg5NDg3MjE4NTk2MTdcbiAgNzIxMDc4Mzg0MzUwNjkxODYxNTU0MzU2NjI4ODQwNjIyNTc0NzM2OTIyODQ1MDk1MTZcbiAgMjA4NDk2MDM5ODAxMzQwMDE3MjM5MzA2NzE2NjY4MjM1NTUyNDUyNTI4MDQ2MDk3MjJcbiAgNTM1MDM1MzQyMjY0NzI1MjQyNTA4NzQwNTQwNzU1OTE3ODk3ODEyNjQzMzAzMzE2OTBcbl1cblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICBzdW0gPSAwXG4gIGZvciBuIGluIG51bWJlcnNcbiAgICBzdW0gKz0gblxuXG4gIHN0ciA9IFN0cmluZyhzdW0pLnJlcGxhY2UoL1xcLi9nLCBcIlwiKS5zdWJzdHIoMCwgMTApXG4gIHJldHVybiBzdHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDE0OiBMb25nZXN0IENvbGxhdHogc2VxdWVuY2Vcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5UaGUgZm9sbG93aW5nIGl0ZXJhdGl2ZSBzZXF1ZW5jZSBpcyBkZWZpbmVkIGZvciB0aGUgc2V0IG9mIHBvc2l0aXZlIGludGVnZXJzOlxuXG4gICAgbiAtPiBuLzIgICAgKG4gaXMgZXZlbilcbiAgICBuIC0+IDNuICsgMSAobiBpcyBvZGQpXG5cblVzaW5nIHRoZSBydWxlIGFib3ZlIGFuZCBzdGFydGluZyB3aXRoIDEzLCB3ZSBnZW5lcmF0ZSB0aGUgZm9sbG93aW5nIHNlcXVlbmNlOlxuXG4gICAgMTMgLT4gNDAgLT4gMjAgLT4gMTAgLT4gNSAtPiAxNiAtPiA4IC0+IDQgLT4gMiAtPiAxXG5cbkl0IGNhbiBiZSBzZWVuIHRoYXQgdGhpcyBzZXF1ZW5jZSAoc3RhcnRpbmcgYXQgMTMgYW5kIGZpbmlzaGluZyBhdCAxKSBjb250YWlucyAxMCB0ZXJtcy4gQWx0aG91Z2ggaXQgaGFzIG5vdCBiZWVuIHByb3ZlZCB5ZXQgKENvbGxhdHogUHJvYmxlbSksIGl0IGlzIHRob3VnaHQgdGhhdCBhbGwgc3RhcnRpbmcgbnVtYmVycyBmaW5pc2ggYXQgMS5cblxuV2hpY2ggc3RhcnRpbmcgbnVtYmVyLCB1bmRlciBvbmUgbWlsbGlvbiwgcHJvZHVjZXMgdGhlIGxvbmdlc3QgY2hhaW4/XG5cbk5PVEU6IE9uY2UgdGhlIGNoYWluIHN0YXJ0cyB0aGUgdGVybXMgYXJlIGFsbG93ZWQgdG8gZ28gYWJvdmUgb25lIG1pbGxpb24uXG5cblwiXCJcIlxuXG5jb2xsYXR6Q2FjaGUgPSB7fVxuXG5jb2xsYXR6Q2hhaW5MZW5ndGggPSAoc3RhcnRpbmdWYWx1ZSkgLT5cbiAgbiA9IHN0YXJ0aW5nVmFsdWVcbiAgdG9CZUNhY2hlZCA9IFtdXG5cbiAgbG9vcFxuICAgIGJyZWFrIGlmIGNvbGxhdHpDYWNoZS5oYXNPd25Qcm9wZXJ0eShuKVxuXG4gICAgIyByZW1lbWJlciB0aGF0IHdlIGZhaWxlZCB0byBjYWNoZSB0aGlzIGVudHJ5XG4gICAgdG9CZUNhY2hlZC5wdXNoKG4pXG5cbiAgICBpZiBuID09IDFcbiAgICAgIGJyZWFrXG5cbiAgICBpZiAobiAlIDIpID09IDBcbiAgICAgIG4gPSBNYXRoLmZsb29yKG4gLyAyKVxuICAgIGVsc2VcbiAgICAgIG4gPSAobiAqIDMpICsgMVxuXG4gICMgU2luY2Ugd2UgbGVmdCBicmVhZGNydW1icyBkb3duIHRoZSB0cmFpbCBvZiB0aGluZ3Mgd2UgaGF2ZW4ndCBjYWNoZWRcbiAgIyB3YWxrIGJhY2sgZG93biB0aGUgdHJhaWwgYW5kIGNhY2hlIGFsbCB0aGUgZW50cmllcyBmb3VuZCBhbG9uZyB0aGUgd2F5XG4gIGxlbiA9IHRvQmVDYWNoZWQubGVuZ3RoXG4gIGZvciB2LGkgaW4gdG9CZUNhY2hlZFxuICAgIGNvbGxhdHpDYWNoZVt2XSA9IGNvbGxhdHpDYWNoZVtuXSArIChsZW4gLSBpKVxuXG4gIHJldHVybiBjb2xsYXR6Q2FjaGVbc3RhcnRpbmdWYWx1ZV1cblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgY29sbGF0ekNhY2hlID0geyBcIjFcIjogMSB9XG4gIGVxdWFsKGNvbGxhdHpDaGFpbkxlbmd0aCgxMyksIDEwLCBcIjEzIGhhcyBhIGNvbGxhdHogY2hhaW4gb2YgMTBcIilcbiAgZXF1YWwoY29sbGF0ekNoYWluTGVuZ3RoKDI2KSwgMTEsIFwiMjYgaGFzIGEgY29sbGF0eiBjaGFpbiBvZiAxMVwiKVxuICBlcXVhbChjb2xsYXR6Q2hhaW5MZW5ndGgoIDEpLCAgMSwgXCIxIGhhcyBhIGNvbGxhdHogY2hhaW4gb2YgMVwiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIGNvbGxhdHpDYWNoZSA9IHsgXCIxXCI6IDEgfVxuXG4gIG1heENoYWluID0gMFxuICBtYXhDaGFpbkxlbmd0aCA9IDBcbiAgZm9yIGkgaW4gWzEuLi4xMDAwMDAwXVxuICAgIGNoYWluTGVuZ3RoID0gY29sbGF0ekNoYWluTGVuZ3RoKGkpXG4gICAgaWYgbWF4Q2hhaW5MZW5ndGggPCBjaGFpbkxlbmd0aFxuICAgICAgbWF4Q2hhaW5MZW5ndGggPSBjaGFpbkxlbmd0aFxuICAgICAgbWF4Q2hhaW4gPSBpXG5cbiAgcmV0dXJuIHsgYW5zd2VyOiBtYXhDaGFpbiwgY2hhaW5MZW5ndGg6IG1heENoYWluTGVuZ3RoIH1cbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDE1OiBMYXR0aWNlIHBhdGhzXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblN0YXJ0aW5nIGluIHRoZSB0b3AgbGVmdCBjb3JuZXIgb2YgYSAyw5cyIGdyaWQsIGFuZCBvbmx5IGJlaW5nIGFibGUgdG8gbW92ZSB0byB0aGUgcmlnaHQgYW5kIGRvd24sIHRoZXJlIGFyZSBleGFjdGx5IDYgcm91dGVzIHRvIHRoZSBib3R0b20gcmlnaHQgY29ybmVyLlxuXG4gICAgKHBpY3R1cmUgc2hvd2luZyA2IHBhdGhzOiBSUkRELCBSRFJELCBSRERSLCBEUlJELCBEUkRSLCBERFJSKVxuXG5Ib3cgbWFueSBzdWNoIHJvdXRlcyBhcmUgdGhlcmUgdGhyb3VnaCBhIDIww5cyMCBncmlkP1xuXG5cIlwiXCJcblxubWF0aCA9IHJlcXVpcmUgXCJtYXRoXCJcblxubGF0dGljZSA9IChuKSAtPlxuICByZXR1cm4gbWF0aC5uQ3IobiAqIDIsIG4pXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGVxdWFsKGxhdHRpY2UoMSksIDIsIFwiMXgxIGxhdHRpY2UgaGFzIDIgcGF0aHNcIilcbiAgZXF1YWwobGF0dGljZSgyKSwgNiwgXCIyeDIgbGF0dGljZSBoYXMgNiBwYXRoc1wiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHJldHVybiBsYXR0aWNlKDIwKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMTY6IFBvd2VyIGRpZ2l0IHN1bVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbjJeMTUgPSAzMjc2OCBhbmQgdGhlIHN1bSBvZiBpdHMgZGlnaXRzIGlzIDMgKyAyICsgNyArIDYgKyA4ID0gMjYuXG5cbldoYXQgaXMgdGhlIHN1bSBvZiB0aGUgZGlnaXRzIG9mIHRoZSBudW1iZXIgMl4xMDAwP1xuXG5cIlwiXCJcblxubWF0aCA9IHJlcXVpcmUgXCJtYXRoXCJcbmJpZ0ludCA9IHJlcXVpcmUgXCJiaWctaW50ZWdlclwiXG5cbk1BWF9FWFBPTkVOVCA9IDUwXG5cbnBvd2VyRGlnaXRTdW0gPSAoeCwgeSkgLT5cbiAgbnVtYmVyID0gYmlnSW50KDEpXG4gIHdoaWxlIHkgIT0gMFxuICAgIGV4cG9uZW50ID0geVxuICAgIGlmIGV4cG9uZW50ID4gTUFYX0VYUE9ORU5UXG4gICAgICBleHBvbmVudCA9IE1BWF9FWFBPTkVOVFxuICAgIHkgLT0gZXhwb25lbnRcbiAgICBudW1iZXIgPSBudW1iZXIubXVsdGlwbHkgTWF0aC5mbG9vcihNYXRoLnBvdyh4LCBleHBvbmVudCkpXG4gIGRpZ2l0cyA9IFN0cmluZyhudW1iZXIpXG5cbiAgc3VtID0gMFxuICBmb3IgZCBpbiBkaWdpdHNcbiAgICBzdW0gKz0gcGFyc2VJbnQoZClcbiAgcmV0dXJuIHN1bVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChwb3dlckRpZ2l0U3VtKDIsIDE1KSwgMjYsIFwic3VtIG9mIGRpZ2l0cyBvZiAyXjE1IGlzIDI2XCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgcmV0dXJuIHBvd2VyRGlnaXRTdW0oMiwgMTAwMClcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDE3OiBOdW1iZXIgbGV0dGVyIGNvdW50c1xuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuSWYgdGhlIG51bWJlcnMgMSB0byA1IGFyZSB3cml0dGVuIG91dCBpbiB3b3Jkczogb25lLCB0d28sIHRocmVlLCBmb3VyLCBmaXZlLCB0aGVuIHRoZXJlIGFyZSAzICsgMyArIDUgKyA0ICsgNCA9IDE5IGxldHRlcnMgdXNlZCBpbiB0b3RhbC5cblxuSWYgYWxsIHRoZSBudW1iZXJzIGZyb20gMSB0byAxMDAwIChvbmUgdGhvdXNhbmQpIGluY2x1c2l2ZSB3ZXJlIHdyaXR0ZW4gb3V0IGluIHdvcmRzLCBob3cgbWFueSBsZXR0ZXJzIHdvdWxkIGJlIHVzZWQ/XG5cbk5PVEU6IERvIG5vdCBjb3VudCBzcGFjZXMgb3IgaHlwaGVucy4gRm9yIGV4YW1wbGUsIDM0MiAodGhyZWUgaHVuZHJlZCBhbmQgZm9ydHktdHdvKSBjb250YWlucyAyMyBsZXR0ZXJzIGFuZCAxMTUgKG9uZSBodW5kcmVkIGFuZCBmaWZ0ZWVuKSBjb250YWlucyAyMCBsZXR0ZXJzLiBUaGUgdXNlIG9mIFwiYW5kXCIgd2hlbiB3cml0aW5nIG91dCBudW1iZXJzIGlzIGluIGNvbXBsaWFuY2Ugd2l0aCBCcml0aXNoIHVzYWdlLlxuXG5cIlwiXCJcblxubmFtZXMgPVxuICBvbmVzOiBcInplcm8gb25lIHR3byB0aHJlZSBmb3VyIGZpdmUgc2l4IHNldmVuIGVpZ2h0IG5pbmUgdGVuIGVsZXZlbiB0d2VsdmUgdGhpcnRlZW4gZm91cnRlZW4gZmlmdGVlbiBzaXh0ZWVuIHNldmVudGVlbiBlaWdodGVlbiBuaW5ldGVlblwiLnNwbGl0KC9cXHMrLylcbiAgdGVuczogXCJfIF8gdHdlbnR5IHRoaXJ0eSBmb3J0eSBmaWZ0eSBzaXh0eSBzZXZlbnR5IGVpZ2h0eSBuaW5ldHlcIi5zcGxpdCgvXFxzKy8pXG5cbiMgc3VwcG9ydHMgMC05OTk5XG5udW1iZXJMZXR0ZXJDb3VudCA9IChudW0pIC0+XG4gIG4gPSBudW1cbiAgbmFtZSA9IFwiXCJcblxuICBpZiBuID49IDEwMDBcbiAgICB0aG91c2FuZHMgPSBNYXRoLmZsb29yKG4gLyAxMDAwKVxuICAgIG4gPSBuICUgMTAwMFxuICAgIG5hbWUgKz0gXCIje25hbWVzLm9uZXNbdGhvdXNhbmRzXX0gdGhvdXNhbmQgXCJcblxuICBpZiBuID49IDEwMFxuICAgIGh1bmRyZWRzID0gTWF0aC5mbG9vcihuIC8gMTAwKVxuICAgIG4gPSBuICUgMTAwXG4gICAgbmFtZSArPSBcIiN7bmFtZXMub25lc1todW5kcmVkc119IGh1bmRyZWQgXCJcblxuICBpZiAobiA+IDApIGFuZCAobmFtZS5sZW5ndGggPiAwKVxuICAgIG5hbWUgKz0gXCJhbmQgXCJcblxuICBpZiBuID49IDIwXG4gICAgdGVucyA9IE1hdGguZmxvb3IobiAvIDEwKVxuICAgIG4gPSBuICUgMTBcbiAgICBuYW1lICs9IFwiI3tuYW1lcy50ZW5zW3RlbnNdfSBcIlxuXG4gIGlmIG4gPiAwXG4gICAgbmFtZSArPSBcIiN7bmFtZXMub25lc1tuXX0gXCJcblxuICBsZXR0ZXJzT25seSA9IG5hbWUucmVwbGFjZSgvW15hLXpdL2csIFwiXCIpXG4gICMgY29uc29sZS5sb2cgXCJudW06ICN7bnVtfSwgbmFtZTogI3tuYW1lfSwgbGV0dGVyc09ubHk6ICN7bGV0dGVyc09ubHl9XCJcbiAgcmV0dXJuIGxldHRlcnNPbmx5Lmxlbmd0aFxuXG5udW1iZXJMZXR0ZXJDb3VudFJhbmdlID0gKGEsIGIpIC0+XG4gIHN1bSA9IDBcbiAgZm9yIGkgaW4gW2EuLmJdXG4gICAgc3VtICs9IG51bWJlckxldHRlckNvdW50KGkpXG4gIHJldHVybiBzdW1cblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgZXF1YWwobnVtYmVyTGV0dGVyQ291bnRSYW5nZSgxLCA1KSwgMTksIFwic3VtIG9mIGxlbmd0aHMgb2YgbnVtYmVycyAxLTUgaXMgMTlcIilcbiAgZXF1YWwobnVtYmVyTGV0dGVyQ291bnQoMzQyKSwgMjMsIFwibGVuZ3RoIG9mIG5hbWUgb2YgMzQyIGlzIDIzXCIpXG4gIGVxdWFsKG51bWJlckxldHRlckNvdW50KDExNSksIDIwLCBcImxlbmd0aCBvZiBuYW1lIG9mIDExNSBpcyAyMFwiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIHJldHVybiBudW1iZXJMZXR0ZXJDb3VudFJhbmdlKDEsIDEwMDApXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHByb2JsZW0gPSBuZXcgUHJvYmxlbSBcIlwiXCJcblxuUHJvYmxlbSAxODogTWF4aW11bSBwYXRoIHN1bSBJXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuQnkgc3RhcnRpbmcgYXQgdGhlIHRvcCBvZiB0aGUgdHJpYW5nbGUgYmVsb3cgYW5kIG1vdmluZyB0byBhZGphY2VudCBudW1iZXJzIG9uIHRoZSByb3cgYmVsb3csIHRoZSBtYXhpbXVtIHRvdGFsIGZyb20gdG9wIHRvIGJvdHRvbSBpcyAyMy5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICA3IDRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAyIDQgNlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgOCA1IDkgM1xuXG5UaGF0IGlzLCAzICsgNyArIDQgKyA5ID0gMjMuXG5cbkZpbmQgdGhlIG1heGltdW0gdG90YWwgZnJvbSB0b3AgdG8gYm90dG9tIG9mIHRoZSB0cmlhbmdsZSBiZWxvdzpcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgNzVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA5NSAgNjRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgMTcgIDQ3ICA4MlxuICAgICAgICAgICAgICAgICAgICAgICAgMTggIDM1ICA4NyAgMTBcbiAgICAgICAgICAgICAgICAgICAgICAyMCAgMDQgIDgyICA0NyAgNjVcbiAgICAgICAgICAgICAgICAgICAgMTkgIDAxICAyMyAgNzUgIDAzICAzNFxuICAgICAgICAgICAgICAgICAgODggIDAyICA3NyAgNzMgIDA3ICA2MyAgNjdcbiAgICAgICAgICAgICAgICA5OSAgNjUgIDA0ICAyOCAgMDYgIDE2ICA3MCAgOTJcbiAgICAgICAgICAgICAgNDEgIDQxICAyNiAgNTYgIDgzICA0MCAgODAgIDcwICAzM1xuICAgICAgICAgICAgNDEgIDQ4ICA3MiAgMzMgIDQ3ICAzMiAgMzcgIDE2ICA5NCAgMjlcbiAgICAgICAgICA1MyAgNzEgIDQ0ICA2NSAgMjUgIDQzICA5MSAgNTIgIDk3ICA1MSAgMTRcbiAgICAgICAgNzAgIDExICAzMyAgMjggIDc3ICA3MyAgMTcgIDc4ICAzOSAgNjggIDE3ICA1N1xuICAgICAgOTEgIDcxICA1MiAgMzggIDE3ICAxNCAgOTEgIDQzICA1OCAgNTAgIDI3ICAyOSAgNDhcbiAgICA2MyAgNjYgIDA0ICA2OCAgODkgIDUzICA2NyAgMzAgIDczICAxNiAgNjkgIDg3ICA0MCAgMzFcbiAgMDQgIDYyICA5OCAgMjcgIDIzICAwOSAgNzAgIDk4ICA3MyAgOTMgIDM4ICA1MyAgNjAgIDA0ICAyM1xuXG5OT1RFOiBBcyB0aGVyZSBhcmUgb25seSAxNjM4NCByb3V0ZXMsIGl0IGlzIHBvc3NpYmxlIHRvIHNvbHZlIHRoaXMgcHJvYmxlbSBieSB0cnlpbmcgZXZlcnkgcm91dGUuIEhvd2V2ZXIsIFByb2JsZW0gNjcsIGlzIHRoZSBzYW1lIGNoYWxsZW5nZSB3aXRoIGEgdHJpYW5nbGUgY29udGFpbmluZyBvbmUtaHVuZHJlZCByb3dzOyBpdCBjYW5ub3QgYmUgc29sdmVkIGJ5IGJydXRlIGZvcmNlLCBhbmQgcmVxdWlyZXMgYSBjbGV2ZXIgbWV0aG9kISA7bylcblxuXCJcIlwiXG5cbm1hdGggPSByZXF1aXJlIFwibWF0aFwiXG5cbnRlc3RQeXJhbWlkID0gXCJcIlwiXG4gICAgICAzXG4gICAgIDcgNFxuICAgIDIgNCA2XG4gICA4IDUgOSAzXG5cIlwiXCJcblxubWFpblB5cmFtaWQgPSBcIlwiXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDc1XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOTUgIDY0XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDE3ICA0NyAgODJcbiAgICAgICAgICAgICAgICAgICAgICAgIDE4ICAzNSAgODcgIDEwXG4gICAgICAgICAgICAgICAgICAgICAgMjAgIDA0ICA4MiAgNDcgIDY1XG4gICAgICAgICAgICAgICAgICAgIDE5ICAwMSAgMjMgIDc1ICAwMyAgMzRcbiAgICAgICAgICAgICAgICAgIDg4ICAwMiAgNzcgIDczICAwNyAgNjMgIDY3XG4gICAgICAgICAgICAgICAgOTkgIDY1ICAwNCAgMjggIDA2ICAxNiAgNzAgIDkyXG4gICAgICAgICAgICAgIDQxICA0MSAgMjYgIDU2ICA4MyAgNDAgIDgwICA3MCAgMzNcbiAgICAgICAgICAgIDQxICA0OCAgNzIgIDMzICA0NyAgMzIgIDM3ICAxNiAgOTQgIDI5XG4gICAgICAgICAgNTMgIDcxICA0NCAgNjUgIDI1ICA0MyAgOTEgIDUyICA5NyAgNTEgIDE0XG4gICAgICAgIDcwICAxMSAgMzMgIDI4ICA3NyAgNzMgIDE3ICA3OCAgMzkgIDY4ICAxNyAgNTdcbiAgICAgIDkxICA3MSAgNTIgIDM4ICAxNyAgMTQgIDkxICA0MyAgNTggIDUwICAyNyAgMjkgIDQ4XG4gICAgNjMgIDY2ICAwNCAgNjggIDg5ICA1MyAgNjcgIDMwICA3MyAgMTYgIDY5ICA4NyAgNDAgIDMxXG4gIDA0ICA2MiAgOTggIDI3ICAyMyAgMDkgIDcwICA5OCAgNzMgIDkzICAzOCAgNTMgIDYwICAwNCAgMjNcblxuXCJcIlwiXG5cbnN0cmluZ1RvUHlyYW1pZCA9IChzdHIpIC0+XG4gIGRpZ2l0cyA9IChwYXJzZUludChkKSBmb3IgZCBpbiBTdHJpbmcoc3RyKS5yZXBsYWNlKC9cXG4vZywgXCIgXCIpLnNwbGl0KC9cXHMrLykuZmlsdGVyIChzKSAtPiByZXR1cm4gKHMubGVuZ3RoID4gMCkgKVxuICBncmlkID0gW11cbiAgcm93ID0gMFxuICB3aGlsZSBkaWdpdHMubGVuZ3RoXG4gICAgbGVuID0gcm93ICsgMVxuICAgIGEgPSBBcnJheShsZW4pXG4gICAgZm9yIGkgaW4gWzAuLi5sZW5dXG4gICAgICBhW2ldID0gZGlnaXRzLnNoaWZ0KClcbiAgICBncmlkW3Jvd10gPSBhXG4gICAgcm93KytcbiAgcmV0dXJuIGdyaWRcblxuIyBDcnVzaGVzIHRoZSBweXJhbWlkIGZyb20gYm90dG9tIHVwLiBXaGVuIGl0IGlzIGFsbCBkb25lIGNydXNoaW5nLCB0aGUgdG9wIG9mIHRoZSBweXJhbWlkIGlzIHRoZSBhbnN3ZXIuXG5tYXhpbXVtUGF0aFN1bSA9IChweXJhbWlkU3RyaW5nKSAtPlxuICBweXJhbWlkID0gc3RyaW5nVG9QeXJhbWlkKHB5cmFtaWRTdHJpbmcpXG4gIHN1bSA9IDBcbiAgcm93ID0gcHlyYW1pZC5sZW5ndGggLSAyXG4gIHdoaWxlIHJvdyA+PSAwXG4gICAgZm9yIGkgaW4gWzAuLnJvd11cbiAgICAgIG1heEJlbG93ID0gTWF0aC5tYXgocHlyYW1pZFtyb3crMV1baV0sIHB5cmFtaWRbcm93KzFdW2krMV0pXG4gICAgICBweXJhbWlkW3Jvd11baV0gKz0gbWF4QmVsb3dcbiAgICByb3ctLVxuICByZXR1cm4gcHlyYW1pZFswXVswXVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChtYXhpbXVtUGF0aFN1bSh0ZXN0UHlyYW1pZCksIDIzLCBcIm1heGltdW0gcGF0aCBzdW0gb2YgdGVzdCB0cmlhbmdsZSBpcyAyM1wiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIGNvbnNvbGUubG9nIHdpbmRvdy5hcmdzXG4gIHJldHVybiBtYXhpbXVtUGF0aFN1bShtYWluUHlyYW1pZClcbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvYmxlbSA9IG5ldyBQcm9ibGVtIFwiXCJcIlxuXG5Qcm9ibGVtIDE5OiBDb3VudGluZyBTdW5kYXlzXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbllvdSBhcmUgZ2l2ZW4gdGhlIGZvbGxvd2luZyBpbmZvcm1hdGlvbiwgYnV0IHlvdSBtYXkgcHJlZmVyIHRvIGRvIHNvbWUgcmVzZWFyY2ggZm9yIHlvdXJzZWxmLlxuXG4qIDEgSmFuIDE5MDAgd2FzIGEgTW9uZGF5LlxuKiBUaGlydHkgZGF5cyBoYXMgU2VwdGVtYmVyLFxuICBBcHJpbCwgSnVuZSBhbmQgTm92ZW1iZXIuXG4gIEFsbCB0aGUgcmVzdCBoYXZlIHRoaXJ0eS1vbmUsXG4gIFNhdmluZyBGZWJydWFyeSBhbG9uZSxcbiAgV2hpY2ggaGFzIHR3ZW50eS1laWdodCwgcmFpbiBvciBzaGluZS5cbiAgQW5kIG9uIGxlYXAgeWVhcnMsIHR3ZW50eS1uaW5lLlxuKiBBIGxlYXAgeWVhciBvY2N1cnMgb24gYW55IHllYXIgZXZlbmx5IGRpdmlzaWJsZSBieSA0LCBidXQgbm90IG9uIGEgY2VudHVyeSB1bmxlc3MgaXQgaXMgZGl2aXNpYmxlIGJ5IDQwMC5cblxuSG93IG1hbnkgU3VuZGF5cyBmZWxsIG9uIHRoZSBmaXJzdCBvZiB0aGUgbW9udGggZHVyaW5nIHRoZSB0d2VudGlldGggY2VudHVyeSAoMSBKYW4gMTkwMSB0byAzMSBEZWMgMjAwMCk/XG5cblwiXCJcIlxuXG5PTkVfREFZX0lOX01TID0gNjAgKiA2MCAqIDI0ICogMTAwMFxuXG5kYXlOYW1lcyA9IFwiU3VuZGF5IE1vbmRheSBUdWVzZGF5IFdlZG5lc2RheSBUaHVyc2RheSBGcmlkYXkgU2F0dXJkYXlcIi5zcGxpdCgvXFxzKy8pXG5cbmRheUFuZERhdGUgPSAodGltZXN0YW1wKSAtPlxuICBkID0gbmV3IERhdGUodGltZXN0YW1wKVxuICByZXR1cm4gW2QuZ2V0RGF5KCksIGQuZ2V0RGF0ZSgpXVxuXG5kYXRlVG9UaW1lc3RhbXAgPSAoeWVhciwgbW9udGgsIGRheSkgLT5cbiAgcmV0dXJuIG5ldyBEYXRlKHllYXIsIG1vbnRoLCBkYXkpLmdldFRpbWUoKVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICB0cyA9IGRhdGVUb1RpbWVzdGFtcCgxOTAwLCAwLCAxKVxuICBlcXVhbChkYXlBbmREYXRlKHRzKVswXSwgMSwgXCIxOTAwLzEvMSB3YXMgYSBNb25kYXlcIilcblxuICBmb3IgZGF5IGluIFsyLi42XVxuICAgIHRzICs9IE9ORV9EQVlfSU5fTVNcbiAgICBkZCA9IGRheUFuZERhdGUodHMpXG4gICAgZXF1YWwoZGRbMF0sIGRheSwgXCJ0aGUgZm9sbG93aW5nIGRheSB3YXMgYSAje2RheU5hbWVzW2RheV19XCIpXG4gICAgZXF1YWwoZGRbMV0sIGRheSwgXCIuLi4gYW5kIHRoZSBkYXRlIHdhcyAxLyN7ZGRbMV19XCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgdHMgPSBkYXRlVG9UaW1lc3RhbXAoMTkwMSwgMCwgMSlcbiAgZW5kdHMgPSBkYXRlVG9UaW1lc3RhbXAoMjAwMCwgMTEsIDMxKVxuXG4gIHN1bmRheUNvdW50ID0gMFxuICB3aGlsZSB0cyA8IGVuZHRzXG4gICAgZGQgPSBkYXlBbmREYXRlKHRzKVxuICAgIGlmIChkZFswXSA9PSAwKSBhbmQgKGRkWzFdID09IDEpXG4gICAgICBzdW5kYXlDb3VudCsrXG4gICAgdHMgKz0gT05FX0RBWV9JTl9NU1xuXG4gIHJldHVybiBzdW5kYXlDb3VudFxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMjA6IEZhY3RvcmlhbCBkaWdpdCBzdW1cbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxubiEgbWVhbnMgbiB4IChuIOKIkiAxKSB4IC4uLiB4IDMgeCAyIHggMVxuXG5Gb3IgZXhhbXBsZSwgMTAhID0gMTAgeCA5IHggLi4uIHggMyB4IDIgeCAxID0gMzYyODgwMCxcbmFuZCB0aGUgc3VtIG9mIHRoZSBkaWdpdHMgaW4gdGhlIG51bWJlciAxMCEgaXMgMyArIDYgKyAyICsgOCArIDggKyAwICsgMCA9IDI3LlxuXG5GaW5kIHRoZSBzdW0gb2YgdGhlIGRpZ2l0cyBpbiB0aGUgbnVtYmVyIDEwMCFcblxuXCJcIlwiXG5cbmJpZ0ludCA9IHJlcXVpcmUgXCJiaWctaW50ZWdlclwiXG5cbmh1Z2VGYWN0b3JpYWwgPSAobikgLT5cbiAgbnVtYmVyID0gYmlnSW50KDEpXG4gIGZvciBpIGluIFsxLi5uXVxuICAgIG51bWJlciA9IG51bWJlci5tdWx0aXBseSBpXG4gIHJldHVybiBudW1iZXJcblxuc3VtT2ZEaWdpdHMgPSAobikgLT5cbiAgZGlnaXRzID0gU3RyaW5nKG4pXG5cbiAgc3VtID0gMFxuICBmb3IgZGlnaXQgaW4gZGlnaXRzXG4gICAgc3VtICs9IHBhcnNlSW50KGRpZ2l0KVxuXG4gIHJldHVybiBzdW1cblxucHJvYmxlbS50ZXN0ID0gLT5cbiAgZXF1YWwoc3VtT2ZEaWdpdHMoaHVnZUZhY3RvcmlhbCgxMCkpLCAyNywgXCJzdW0gb2YgZmFjdG9yaWFsIGRpZ2l0cyBvZiAxMCEgaXMgMjdcIilcblxucHJvYmxlbS5hbnN3ZXIgPSAtPlxuICByZXR1cm4gc3VtT2ZEaWdpdHMoaHVnZUZhY3RvcmlhbCgxMDApKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMjE6IEFtaWNhYmxlIG51bWJlcnNcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuTGV0IGQobikgYmUgZGVmaW5lZCBhcyB0aGUgc3VtIG9mIHByb3BlciBkaXZpc29ycyBvZiBuIChudW1iZXJzIGxlc3MgdGhhbiBuIHdoaWNoIGRpdmlkZSBldmVubHkgaW50byBuKS5cbklmIGQoYSkgPSBiIGFuZCBkKGIpID0gYSwgd2hlcmUgYSDiiaAgYiwgdGhlbiBhIGFuZCBiIGFyZSBhbiBhbWljYWJsZSBwYWlyIGFuZCBlYWNoIG9mIGEgYW5kIGIgYXJlIGNhbGxlZCBhbWljYWJsZSBudW1iZXJzLlxuXG5Gb3IgZXhhbXBsZSwgdGhlIHByb3BlciBkaXZpc29ycyBvZiAyMjAgYXJlIDEsIDIsIDQsIDUsIDEwLCAxMSwgMjAsIDIyLCA0NCwgNTUgYW5kIDExMDsgdGhlcmVmb3JlIGQoMjIwKSA9IDI4NC4gVGhlIHByb3BlciBkaXZpc29ycyBvZiAyODQgYXJlIDEsIDIsIDQsIDcxIGFuZCAxNDI7IHNvIGQoMjg0KSA9IDIyMC5cblxuRXZhbHVhdGUgdGhlIHN1bSBvZiBhbGwgdGhlIGFtaWNhYmxlIG51bWJlcnMgdW5kZXIgMTAwMDAuXG5cblwiXCJcIlxuXG5tYXRoID0gcmVxdWlyZSBcIm1hdGhcIlxuYW1pY2FibGVDYWNoZSA9IG51bGxcblxuYW1pY2FibGVWYWx1ZSA9IChuKSAtPlxuICBpZiBhbWljYWJsZUNhY2hlLmhhc093blByb3BlcnR5KG4pXG4gICAgcmV0dXJuIGFtaWNhYmxlQ2FjaGVbbl1cbiAgc3VtID0gMFxuICBmb3IgdiBpbiBtYXRoLmRpdmlzb3JzKG4pXG4gICAgc3VtICs9IHZcbiAgYW1pY2FibGVDYWNoZVtuXSA9IHN1bVxuICByZXR1cm4gc3VtXG5cbnByb2JsZW0udGVzdCA9IC0+XG4gIGFtaWNhYmxlQ2FjaGUgPSB7fVxuICBlcXVhbChhbWljYWJsZVZhbHVlKDIyMCksIDI4NCwgXCJhbWljYWJsZSgyMjApID09IDI4NFwiKVxuICBlcXVhbChhbWljYWJsZVZhbHVlKDI4NCksIDIyMCwgXCJhbWljYWJsZSgyODQpID09IDIyMFwiKVxuXG5wcm9ibGVtLmFuc3dlciA9IC0+XG4gIGFtaWNhYmxlQ2FjaGUgPSB7fVxuICBhbWljYWJsZVNlZW4gPSB7fVxuICBmb3IgaSBpbiBbMi4uLjEwMDAwXVxuICAgIGEgPSBhbWljYWJsZVZhbHVlKGkpXG4gICAgYiA9IGFtaWNhYmxlVmFsdWUoYSlcbiAgICBpZiAoYSAhPSBiKSBhbmQgKGIgPT0gaSlcbiAgICAgIGFtaWNhYmxlU2VlblthXSA9IHRydWVcbiAgICAgIGFtaWNhYmxlU2VlbltiXSA9IHRydWVcblxuICBhbWljYWJsZU51bWJlcnMgPSAocGFyc2VJbnQodikgZm9yIHYgaW4gT2JqZWN0LmtleXMoYW1pY2FibGVTZWVuKSlcblxuICBzdW0gPSAwXG4gIGZvciB2IGluIGFtaWNhYmxlTnVtYmVyc1xuICAgIHN1bSArPSB2XG5cbiAgcmV0dXJuIHN1bVxuIiwibW9kdWxlLmV4cG9ydHMgPSBwcm9ibGVtID0gbmV3IFByb2JsZW0gXCJcIlwiXG5cblByb2JsZW0gMjI6IE5hbWVzIHNjb3Jlc1xuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblVzaW5nIG5hbWVzLnR4dCAocmlnaHQgY2xpY2sgYW5kICdTYXZlIExpbmsvVGFyZ2V0IEFzLi4uJyksIGEgNDZLIHRleHQgZmlsZSBjb250YWluaW5nIG92ZXIgZml2ZS10aG91c2FuZCBmaXJzdCBuYW1lcywgYmVnaW4gYnkgc29ydGluZyBpdCBpbnRvIGFscGhhYmV0aWNhbCBvcmRlci4gVGhlbiB3b3JraW5nIG91dCB0aGUgYWxwaGFiZXRpY2FsIHZhbHVlIGZvciBlYWNoIG5hbWUsIG11bHRpcGx5IHRoaXMgdmFsdWUgYnkgaXRzIGFscGhhYmV0aWNhbCBwb3NpdGlvbiBpbiB0aGUgbGlzdCB0byBvYnRhaW4gYSBuYW1lIHNjb3JlLlxuXG5Gb3IgZXhhbXBsZSwgd2hlbiB0aGUgbGlzdCBpcyBzb3J0ZWQgaW50byBhbHBoYWJldGljYWwgb3JkZXIsIENPTElOLCB3aGljaCBpcyB3b3J0aCAzICsgMTUgKyAxMiArIDkgKyAxNCA9IDUzLCBpcyB0aGUgOTM4dGggbmFtZSBpbiB0aGUgbGlzdC4gU28sIENPTElOIHdvdWxkIG9idGFpbiBhIHNjb3JlIG9mIDkzOCDDlyA1MyA9IDQ5NzE0LlxuXG5XaGF0IGlzIHRoZSB0b3RhbCBvZiBhbGwgdGhlIG5hbWUgc2NvcmVzIGluIHRoZSBmaWxlP1xuXG5cIlwiXCJcblxuZnMgPSByZXF1aXJlIFwiZnNcIlxuXG5yZWFkTmFtZXMgPSAtPlxuICByYXdOYW1lcyA9IFN0cmluZyhmcy5yZWFkRmlsZVN5bmMoX19kaXJuYW1lICsgXCIvLi4vZGF0YS9uYW1lcy50eHRcIikpXG4gIG5hbWVzID0gcmF3TmFtZXMucmVwbGFjZSgvXCIvZ20sIFwiXCIpLnNwbGl0KFwiLFwiKVxuICByZXR1cm4gbmFtZXNcblxuYWxwaGFiZXRpY2FsVmFsdWUgPSAobmFtZSkgLT5cbiAgc3VtID0gMFxuICBmb3IgaSBpbiBbMC4uLm5hbWUubGVuZ3RoXVxuICAgIHYgPSBuYW1lLmNoYXJDb2RlQXQoaSkgLSA2NCAjIEEgaXMgNjUgaW4gYXNjaWksIHNvIHRoaXMgbWFrZXMgdGhlIHZhbHVlIG9mICdBJyA9PSAxXG4gICAgc3VtICs9IHZcbiAgcmV0dXJuIHN1bVxuXG5wcm9ibGVtLnRlc3QgPSAtPlxuICBlcXVhbChhbHBoYWJldGljYWxWYWx1ZShcIkNPTElOXCIpLCA1MywgXCJhbHBoYWJldGljYWwgdmFsdWUgZm9yIENPTElOIGlzIDUzXCIpXG5cbnByb2JsZW0uYW5zd2VyID0gLT5cbiAgbmFtZXMgPSByZWFkTmFtZXMoKVxuICBuYW1lcy5zb3J0KClcblxuICBzdW0gPSAwXG4gIGZvciBuYW1lLCBpIGluIG5hbWVzXG4gICAgdiA9IGFscGhhYmV0aWNhbFZhbHVlKG5hbWUpICogKGkgKyAxKVxuICAgIHN1bSArPSB2XG4gIHJldHVybiBzdW1cbiIsInJvb3QgPSBleHBvcnRzID8gdGhpc1xuXG4jIFNpZXZlIHdhcyBibGluZGx5IHRha2VuL2FkYXB0ZWQgZnJvbSBSb3NldHRhQ29kZS4gRE9OVCBFVkVOIENBUkVcbmNsYXNzIEluY3JlbWVudGFsU2lldmVcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQG4gPSAwXG5cbiAgbmV4dDogLT5cbiAgICBAbiArPSAyXG4gICAgaWYgQG4gPCA3XG4gICAgICBpZiBAbiA8IDNcbiAgICAgICAgQG4gPSAxXG4gICAgICAgIHJldHVybiAyXG4gICAgICBpZiBAbiA8IDVcbiAgICAgICAgcmV0dXJuIDNcbiAgICAgIEBkaWN0ID0ge31cbiAgICAgIEBicHMgPSBuZXcgSW5jcmVtZW50YWxTaWV2ZSgpXG4gICAgICBAYnBzLm5leHQoKVxuICAgICAgQHAgPSBAYnBzLm5leHQoKVxuICAgICAgQHEgPSBAcCAqIEBwXG4gICAgICByZXR1cm4gNVxuICAgIGVsc2VcbiAgICAgIHMgPSBAZGljdFtAbl1cbiAgICAgIGlmIG5vdCBzXG4gICAgICAgIGlmIEBuIDwgQHFcbiAgICAgICAgICByZXR1cm4gQG5cbiAgICAgICAgZWxzZVxuICAgICAgICAgIHAyID0gQHAgPDwgMVxuICAgICAgICAgIEBkaWN0W0BuICsgcDJdID0gcDJcbiAgICAgICAgICBAcCA9IEBicHMubmV4dCgpXG4gICAgICAgICAgQHEgPSBAcCAqIEBwXG4gICAgICAgICAgcmV0dXJuIEBuZXh0KClcbiAgICAgIGVsc2VcbiAgICAgICAgZGVsZXRlIEBkaWN0W0BuXVxuICAgICAgICBueHQgPSBAbiArIHNcbiAgICAgICAgd2hpbGUgKEBkaWN0W254dF0pXG4gICAgICAgICAgbnh0ICs9IHNcbiAgICAgICAgQGRpY3Rbbnh0XSA9IHNcbiAgICAgICAgcmV0dXJuIEBuZXh0KClcblxucm9vdC5JbmNyZW1lbnRhbFNpZXZlID0gSW5jcmVtZW50YWxTaWV2ZVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIFNoYW1lbGVzc2x5IHBpbGZlcmVkL2Fkb3B0ZWQgZnJvbSBodHRwOi8vd3d3LmphdmFzY3JpcHRlci5uZXQvZmFxL251bWJlcmlzcHJpbWUuaHRtXG5cbnJvb3QubGVhc3RGYWN0b3IgPSAobikgLT5cbiAgcmV0dXJuIE5hTiBpZiBpc05hTihuKSBvciBub3QgaXNGaW5pdGUobilcbiAgcmV0dXJuIDAgaWYgbiA9PSAwXG4gIHJldHVybiAxIGlmIChuICUgMSkgIT0gMCBvciAobiAqIG4pIDwgMlxuICByZXR1cm4gMiBpZiAobiAlIDIpID09IDBcbiAgcmV0dXJuIDMgaWYgKG4gJSAzKSA9PSAwXG4gIHJldHVybiA1IGlmIChuICUgNSkgPT0gMFxuXG4gIG0gPSBNYXRoLnNxcnQgblxuICBmb3IgaSBpbiBbNy4ubV0gYnkgMzBcbiAgICByZXR1cm4gaSAgICBpZiAobiAlIGkpICAgICAgPT0gMFxuICAgIHJldHVybiBpKzQgIGlmIChuICUgKGkrNCkpICA9PSAwXG4gICAgcmV0dXJuIGkrNiAgaWYgKG4gJSAoaSs2KSkgID09IDBcbiAgICByZXR1cm4gaSsxMCBpZiAobiAlIChpKzEwKSkgPT0gMFxuICAgIHJldHVybiBpKzEyIGlmIChuICUgKGkrMTIpKSA9PSAwXG4gICAgcmV0dXJuIGkrMTYgaWYgKG4gJSAoaSsxNikpID09IDBcbiAgICByZXR1cm4gaSsyMiBpZiAobiAlIChpKzIyKSkgPT0gMFxuICAgIHJldHVybiBpKzI0IGlmIChuICUgKGkrMjQpKSA9PSAwXG5cbiAgcmV0dXJuIG5cblxucm9vdC5pc1ByaW1lID0gKG4pIC0+XG4gIGlmIGlzTmFOKG4pIG9yIG5vdCBpc0Zpbml0ZShuKSBvciAobiAlIDEpICE9IDAgb3IgKG4gPCAyKVxuICAgIHJldHVybiBmYWxzZVxuICBpZiBuID09IHJvb3QubGVhc3RGYWN0b3IobilcbiAgICByZXR1cm4gdHJ1ZVxuXG4gIHJldHVybiBmYWxzZVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnJvb3QucHJpbWVGYWN0b3JzID0gKG4pIC0+XG4gIHJldHVybiBbMV0gaWYgbiA9PSAxXG5cbiAgZmFjdG9ycyA9IFtdXG4gIHdoaWxlIG5vdCByb290LmlzUHJpbWUobilcbiAgICBmYWN0b3IgPSByb290LmxlYXN0RmFjdG9yKG4pXG4gICAgZmFjdG9ycy5wdXNoIGZhY3RvclxuICAgIG4gLz0gZmFjdG9yXG4gIGZhY3RvcnMucHVzaCBuXG4gIHJldHVybiBmYWN0b3JzXG5cbiMgVGhpcyBkb2VzIGEgYnJ1dGUtZm9yY2UgYXR0ZW1wdCBhdCBjb21iaW5pbmcgYWxsIG9mIHRoZSBwcmltZSBmYWN0b3JzICgyXm4gYXR0ZW1wdHMpLlxuIyBJJ20gc3VyZSB0aGVyZSBpcyBhIGNvb2xlciB3YXkuXG5yb290LmRpdmlzb3JzID0gKG4pIC0+XG4gIHByaW1lcyA9IHJvb3QucHJpbWVGYWN0b3JzKG4pXG4gIGNvbWJvc1RvVHJ5ID0gTWF0aC5wb3coMiwgcHJpbWVzLmxlbmd0aClcbiAgZmFjdG9yc1NlZW4gPSB7fVxuICBmb3IgYXR0ZW1wdCBpbiBbMC4uLmNvbWJvc1RvVHJ5XVxuICAgIGZhY3RvciA9IDFcbiAgICBmb3IgdixpIGluIHByaW1lc1xuICAgICAgaWYgKGF0dGVtcHQgJiAoMSA8PCBpKSlcbiAgICAgICAgZmFjdG9yICo9IHZcbiAgICBpZiBmYWN0b3IgPCBuXG4gICAgICBmYWN0b3JzU2VlbltmYWN0b3JdID0gdHJ1ZVxuXG4gIGRpdmlzb3JMaXN0ID0gKHBhcnNlSW50KHYpIGZvciB2IGluIE9iamVjdC5rZXlzKGZhY3RvcnNTZWVuKSlcbiAgcmV0dXJuIGRpdmlzb3JMaXN0XG5cbnJvb3QuZmFjdG9yaWFsID0gKG4pIC0+XG4gIGYgPSBuXG4gIHdoaWxlIG4gPiAxXG4gICAgbi0tXG4gICAgZiAqPSBuXG4gIHJldHVybiBmXG5cbnJvb3QubkNyID0gKG4sIHIpIC0+XG4gIHJldHVybiBNYXRoLmZsb29yKHJvb3QuZmFjdG9yaWFsKG4pIC8gKHJvb3QuZmFjdG9yaWFsKHIpICogcm9vdC5mYWN0b3JpYWwobiAtIHIpKSlcbiIsIkxBU1RfUFJPQkxFTSA9IDIyXHJcblxyXG5yb290ID0gd2luZG93ICMgZXhwb3J0cyA/IHRoaXNcclxuXHJcbnJvb3QuZXNjYXBlZFN0cmluZ2lmeSA9IChvKSAtPlxyXG4gIHN0ciA9IEpTT04uc3RyaW5naWZ5KG8pXHJcbiAgc3RyID0gc3RyLnJlcGxhY2UoXCJdXCIsIFwiXFxcXF1cIilcclxuICByZXR1cm4gc3RyXHJcblxyXG5yb290LnJ1bkFsbCA9IC0+XHJcbiAgbGFzdFB1enpsZSA9IExBU1RfUFJPQkxFTVxyXG4gIG5leHRJbmRleCA9IDBcclxuXHJcbiAgbG9hZE5leHRTY3JpcHQgPSAtPlxyXG4gICAgaWYgbmV4dEluZGV4IDwgbGFzdFB1enpsZVxyXG4gICAgICBuZXh0SW5kZXgrK1xyXG4gICAgICBydW5UZXN0KG5leHRJbmRleCwgbG9hZE5leHRTY3JpcHQpXHJcbiAgbG9hZE5leHRTY3JpcHQoKVxyXG5cclxucm9vdC5pdGVyYXRlUHJvYmxlbXMgPSAoYXJncykgLT5cclxuXHJcbiAgaW5kZXhUb1Byb2Nlc3MgPSBudWxsXHJcbiAgaWYgYXJncy5lbmRJbmRleCA+IDBcclxuICAgIGlmIGFyZ3Muc3RhcnRJbmRleCA8PSBhcmdzLmVuZEluZGV4XHJcbiAgICAgIGluZGV4VG9Qcm9jZXNzID0gYXJncy5zdGFydEluZGV4XHJcbiAgICAgIGFyZ3Muc3RhcnRJbmRleCsrXHJcbiAgZWxzZVxyXG4gICAgaWYgYXJncy5saXN0Lmxlbmd0aCA+IDBcclxuICAgICAgaW5kZXhUb1Byb2Nlc3MgPSBhcmdzLmxpc3Quc2hpZnQoKVxyXG5cclxuICBpZiBpbmRleFRvUHJvY2VzcyAhPSBudWxsXHJcbiAgICBpdGVyYXRlTmV4dCA9IC0+XHJcbiAgICAgIHdpbmRvdy5hcmdzID0gYXJnc1xyXG4gICAgICBydW5UZXN0IGluZGV4VG9Qcm9jZXNzLCAtPlxyXG4gICAgICAgIGl0ZXJhdGVQcm9ibGVtcyhhcmdzKVxyXG4gICAgaXRlcmF0ZU5leHQoKVxyXG5cclxucm9vdC5ydW5UZXN0ID0gKGluZGV4LCBjYikgLT5cclxuICBtb2R1bGVOYW1lID0gXCJlI3soJzAwMCcraW5kZXgpLnNsaWNlKC0zKX1cIlxyXG4gIHdpbmRvdy5pbmRleCA9IGluZGV4XHJcbiAgcHJvYmxlbSA9IHJlcXVpcmUobW9kdWxlTmFtZSlcclxuICBwcm9ibGVtLnByb2Nlc3MoKVxyXG4gIHdpbmRvdy5zZXRUaW1lb3V0KGNiLCAwKSBpZiBjYlxyXG5cclxuY2xhc3MgUHJvYmxlbVxyXG4gIGNvbnN0cnVjdG9yOiAoQGRlc2NyaXB0aW9uKSAtPlxyXG4gICAgQGluZGV4ID0gd2luZG93LmluZGV4XHJcbiAgICBsaW5lcyA9IEBkZXNjcmlwdGlvbi5zcGxpdCgvXFxuLylcclxuICAgIGxpbmVzLnNoaWZ0KCkgd2hpbGUgbGluZXMubGVuZ3RoID4gMCBhbmQgbGluZXNbMF0ubGVuZ3RoID09IDBcclxuICAgIEB0aXRsZSA9IGxpbmVzLnNoaWZ0KClcclxuICAgIEBsaW5lID0gbGluZXMuc2hpZnQoKVxyXG4gICAgQGRlc2NyaXB0aW9uID0gbGluZXMuam9pbihcIlxcblwiKVxyXG5cclxuICBub3c6IC0+XHJcbiAgICByZXR1cm4gaWYgd2luZG93LnBlcmZvcm1hbmNlIHRoZW4gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpIGVsc2UgbmV3IERhdGUoKS5nZXRUaW1lKClcclxuXHJcbiAgcHJvY2VzczogLT5cclxuICAgIGlmIHdpbmRvdy5hcmdzLmRlc2NyaXB0aW9uXHJcbiAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7IzQ0NDQ0NDtdX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19dXFxuXCJcclxuXHJcbiAgICBmb3JtYXR0ZWRUaXRsZSA9ICQudGVybWluYWwuZm9ybWF0KFwiW1s7I2ZmYWEwMDtdI3tAdGl0bGV9XVwiKVxyXG4gICAgdXJsID0gXCI/Yz0je3dpbmRvdy5hcmdzLmNtZH1fI3tAaW5kZXh9XCJcclxuICAgIGlmIHdpbmRvdy5hcmdzLnZlcmJvc2VcclxuICAgICAgdXJsICs9IFwiX3ZcIlxyXG4gICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCI8YSBocmVmPVxcXCIje3VybH1cXFwiPiN7Zm9ybWF0dGVkVGl0bGV9PC9hPlwiLCB7IHJhdzogdHJ1ZSB9XHJcblxyXG4gICAgaWYgd2luZG93LmFyZ3MuZGVzY3JpcHRpb25cclxuICAgICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjNDQ0NDQ0O10je0BsaW5lfV1cIlxyXG4gICAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIltbOyNjY2NjZWU7XSN7QGRlc2NyaXB0aW9ufV1cXG5cIlxyXG4gICAgICBzb3VyY2VMaW5lID0gJC50ZXJtaW5hbC5mb3JtYXQoXCJbWzsjNDQ0NDQ0O11Tb3VyY2U6XSBcIilcclxuICAgICAgc291cmNlTGluZSArPSBcIiA8YSBocmVmPVxcXCJzcmMvZSN7KCcwMDAnK0BpbmRleCkuc2xpY2UoLTMpfS5jb2ZmZWVcXFwiPlwiICsgJC50ZXJtaW5hbC5mb3JtYXQoXCJbWzsjNzczMzAwO11Mb2NhbF1cIikgKyBcIjwvYT4gXCJcclxuICAgICAgc291cmNlTGluZSArPSAkLnRlcm1pbmFsLmZvcm1hdChcIltbOyM0NDQ0NDQ7XS9dXCIpXHJcbiAgICAgIHNvdXJjZUxpbmUgKz0gXCIgPGEgaHJlZj1cXFwiaHR0cHM6Ly9naXRodWIuY29tL2pvZWRyYWdvL2V1bGVyL2Jsb2IvbWFzdGVyL3NyYy9lI3soJzAwMCcrQGluZGV4KS5zbGljZSgtMyl9LmNvZmZlZVxcXCI+XCIgKyAkLnRlcm1pbmFsLmZvcm1hdChcIltbOyM3NzMzMDA7XUdpdGh1Yl1cIikgKyBcIjwvYT5cIlxyXG4gICAgICB3aW5kb3cudGVybWluYWwuZWNobyBzb3VyY2VMaW5lLCB7IHJhdzogdHJ1ZSB9XHJcbiAgICAgIGlmIHdpbmRvdy5hcmdzLnRlc3Qgb3Igd2luZG93LmFyZ3MuYW5zd2VyXHJcbiAgICAgICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJcIlxyXG5cclxuICAgIHRlc3RGdW5jID0gQHRlc3RcclxuICAgIGFuc3dlckZ1bmMgPSBAYW5zd2VyXHJcblxyXG4gICAgaWYgd2luZG93LmFyZ3MudGVzdFxyXG4gICAgICBpZiB0ZXN0RnVuYyA9PSB1bmRlZmluZWRcclxuICAgICAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIltbOyM0NDQ0NDQ7XSAobm8gdGVzdHMpXVwiXHJcbiAgICAgIGVsc2VcclxuICAgICAgICB0ZXN0RnVuYygpXHJcblxyXG4gICAgaWYgd2luZG93LmFyZ3MuYW5zd2VyXHJcbiAgICAgIHN0YXJ0ID0gQG5vdygpXHJcbiAgICAgIGFuc3dlciA9IGFuc3dlckZ1bmMoKVxyXG4gICAgICBlbmQgPSBAbm93KClcclxuICAgICAgbXMgPSBlbmQgLSBzdGFydFxyXG4gICAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIltbOyNmZmZmZmY7XSAtPiBdW1s7I2FhZmZhYTtdQW5zd2VyOl0gKFtbOyNhYWZmZmY7XSN7bXMudG9GaXhlZCgxKX1tc10pOiBbWzsjZmZmZmZmO10je2VzY2FwZWRTdHJpbmdpZnkoYW5zd2VyKX1dXCJcclxuXHJcbnJvb3QuUHJvYmxlbSA9IFByb2JsZW1cclxuXHJcbnJvb3Qub2sgPSAodiwgbXNnKSAtPlxyXG4gIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2ZmZmZmZjtdICogIF0je3Z9OiAje21zZ31cIlxyXG5cclxucm9vdC5lcXVhbCA9IChhLCBiLCBtc2cpIC0+XHJcbiAgaWYgYSA9PSBiXHJcbiAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIltbOyNmZmZmZmY7XSAqICBdW1s7IzU1NTU1NTtdUEFTUzogI3ttc2d9XVwiXHJcbiAgZWxzZVxyXG4gICAgd2luZG93LnRlcm1pbmFsLmVjaG8gXCJbWzsjZmZmZmZmO10gKiAgXVtbOyNmZmFhYWE7XUZBSUw6ICN7bXNnfSAoI3thfSAhPSAje2J9KV1cIlxyXG5cclxucm9vdC5vbkNvbW1hbmQgPSAoY29tbWFuZCkgPT5cclxuICByZXR1cm4gaWYgY29tbWFuZC5sZW5ndGggPT0gMFxyXG4gIGNtZCA9ICQudGVybWluYWwucGFyc2VDb21tYW5kKGNvbW1hbmQpXHJcbiAgcmV0dXJuIGlmIGNtZC5uYW1lLmxlbmd0aCA9PSAwXHJcblxyXG4gIGFyZ3MgPVxyXG4gICAgc3RhcnRJbmRleDogMFxyXG4gICAgZW5kSW5kZXg6IDBcclxuICAgIGxpc3Q6IFtdXHJcbiAgICB2ZXJib3NlOiBmYWxzZVxyXG4gICAgZGVzY3JpcHRpb246IGZhbHNlXHJcbiAgICB0ZXN0OiBmYWxzZVxyXG4gICAgYW5zd2VyOiBmYWxzZVxyXG5cclxuICBwcm9jZXNzID0gdHJ1ZVxyXG5cclxuICBmb3IgYXJnIGluIGNtZC5hcmdzXHJcbiAgICBhcmcgPSBTdHJpbmcoYXJnKVxyXG4gICAgY29udGludWUgaWYgYXJnLmxlbmd0aCA8IDFcclxuICAgIGlmIGFyZ1swXSA9PSAndidcclxuICAgICAgYXJncy52ZXJib3NlID0gdHJ1ZVxyXG4gICAgZWxzZSBpZiBhcmcubWF0Y2goL15cXGQrJC8pXHJcbiAgICAgIHYgPSBwYXJzZUludChhcmcpXHJcbiAgICAgIGlmICh2ID49IDEpIGFuZCAodiA8PSBMQVNUX1BST0JMRU0pXHJcbiAgICAgICAgYXJncy5saXN0LnB1c2godilcclxuICAgICAgZWxzZVxyXG4gICAgICAgIHByb2Nlc3MgPSBmYWxzZVxyXG4gICAgICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiW1s7I2ZmYWFhYTtdTm8gc3VjaCB0ZXN0OiAje3Z9ICh2YWxpZCB0ZXN0cyAxLSN7TEFTVF9QUk9CTEVNfSldXCJcclxuXHJcbiAgaWYgYXJncy5saXN0Lmxlbmd0aCA9PSAwXHJcbiAgICBhcmdzLnN0YXJ0SW5kZXggPSAxXHJcbiAgICBhcmdzLmVuZEluZGV4ID0gTEFTVF9QUk9CTEVNXHJcblxyXG4gICMgU2luY2UgYWxsIG9mIG91ciBjb21tYW5kcyBoYXBwZW4gdG8gaGF2ZSB1bmlxdWUgZmlyc3QgbGV0dGVycywgbGV0IHBlb3BsZSBiZSBzdXBlciBsYXp5L3NpbGx5XHJcbiAgaWYgY21kLm5hbWVbMF0gPT0gJ2wnXHJcbiAgICBhcmdzLmNtZCA9IFwibGlzdFwiXHJcbiAgZWxzZSBpZiBjbWQubmFtZVswXSA9PSAnZCdcclxuICAgIGFyZ3MuY21kID0gXCJkZXNjcmliZVwiXHJcbiAgICBhcmdzLmRlc2NyaXB0aW9uID0gdHJ1ZVxyXG4gIGVsc2UgaWYgY21kLm5hbWVbMF0gPT0gJ3QnXHJcbiAgICBhcmdzLmNtZCA9IFwidGVzdFwiXHJcbiAgICBhcmdzLnRlc3QgPSB0cnVlXHJcbiAgZWxzZSBpZiBjbWQubmFtZVswXSA9PSAnYSdcclxuICAgIGFyZ3MuY21kID0gXCJhbnN3ZXJcIlxyXG4gICAgYXJncy5hbnN3ZXIgPSB0cnVlXHJcbiAgZWxzZSBpZiBjbWQubmFtZVswXSA9PSAncidcclxuICAgIGFyZ3MuY21kID0gXCJydW5cIlxyXG4gICAgYXJncy50ZXN0ID0gdHJ1ZVxyXG4gICAgYXJncy5hbnN3ZXIgPSB0cnVlXHJcbiAgZWxzZSBpZiBjbWQubmFtZVswXSA9PSAnZCdcclxuICAgIGFyZ3MuY21kID0gXCJkZXNjcmliZVwiXHJcbiAgICBhcmdzLmRlc2NyaXB0aW9uID0gdHJ1ZVxyXG4gIGVsc2UgaWYgY21kLm5hbWVbMF0gPT0gJ2gnXHJcbiAgICBhcmdzLmNtZCA9IFwiaGVscFwiXHJcbiAgICBwcm9jZXNzID0gZmFsc2VcclxuICAgIHdpbmRvdy50ZXJtaW5hbC5lY2hvIFwiXCJcIlxyXG4gICAgQ29tbWFuZHM6XHJcblxyXG4gICAgICAgIGxpc3QgW1hdICAgICAtIExpc3QgcHJvYmxlbSB0aXRsZXNcclxuICAgICAgICBkZXNjcmliZSBbWF0gLSBEaXNwbGF5IGZ1bGwgcHJvYmxlbSBkZXNjcmlwdGlvbnNcclxuICAgICAgICB0ZXN0IFtYXSAgICAgLSBSdW4gdW5pdCB0ZXN0c1xyXG4gICAgICAgIGFuc3dlciBbWF0gICAtIFRpbWUgYW5kIGNhbGN1bGF0ZSBhbnN3ZXJcclxuICAgICAgICBydW4gW1hdICAgICAgLSB0ZXN0IGFuZCBhbnN3ZXIgY29tYmluZWRcclxuICAgICAgICBoZWxwICAgICAgICAgLSBUaGlzIGhlbHBcclxuXHJcbiAgICAgICAgSW4gYWxsIG9mIHRoZXNlLCBbWF0gY2FuIGJlIGEgbGlzdCBvZiBvbmUgb3IgbW9yZSBwcm9ibGVtIG51bWJlcnMuIChhIHZhbHVlIGZyb20gMSB0byAje0xBU1RfUFJPQkxFTX0pLiBJZiBhYnNlbnQsIGl0IGltcGxpZXMgYWxsIHByb2JsZW1zLlxyXG4gICAgICAgIEFsc28sIGFkZGluZyB0aGUgd29yZCBcInZlcmJvc2VcIiB0byBzb21lIG9mIHRoZXNlIGNvbW1hbmRzIHdpbGwgZW1pdCB0aGUgZGVzY3JpcHRpb24gYmVmb3JlIHBlcmZvcm1pbmcgdGhlIHRhc2suXHJcblxyXG4gICAgXCJcIlwiXHJcbiAgZWxzZVxyXG4gICAgcHJvY2VzcyA9IGZhbHNlXHJcbiAgICB3aW5kb3cudGVybWluYWwuZWNobyBcIltbOyNmZmFhYWE7XVVua25vd24gY29tbWFuZC5dXCJcclxuXHJcbiAgaWYgYXJncy52ZXJib3NlXHJcbiAgICBhcmdzLmRlc2NyaXB0aW9uID0gdHJ1ZVxyXG5cclxuICBpZiBwcm9jZXNzXHJcbiAgICBpdGVyYXRlUHJvYmxlbXMoYXJncylcclxuIl19
