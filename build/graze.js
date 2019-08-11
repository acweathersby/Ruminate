var graze_objects = (function (exports, worker_threads, fs, path) {
    'use strict';

    fs = fs && fs.hasOwnProperty('default') ? fs['default'] : fs;
    path = path && path.hasOwnProperty('default') ? path['default'] : path;

    /* TODO - Make sure UID algorithm generates effectivly unique IDs */
    class UID extends ArrayBuffer {

        static stringIsUID(string) {
            const match = string.match(/[a-f\d]{12}\-[a-f\d]{4}\-[a-f\d]{8}\-[a-f\d]{8}/);
            return match && match[0] == string;
        }

        constructor(string_val) {

            super(16);

            const dv = new DataView(this);

            if (string_val instanceof UID) {
                const dv2 = new DataView(string_val);
                dv.setBigUint64(0, dv2.getBigUint64(0));
                dv.setBigUint64(8, dv2.getBigUint64(8));
            } else if (string_val && typeof string_val == "string") {
                string_val
                    .replace(/\-/g, "")
                    .split("")
                    .reduce((r,v,i)=> (i%2 ? r[i>>1] += v:r.push(v),r),[])
                    .map((v, i) => dv.setUint8(i, parseInt(v, 16)));
            } else {
                dv.setBigUint64(0, BigInt((new Date).valueOf()));

                //Shift over by 2 bytes [16 bits] for a 48bit date string;
                for (var i = 0; i < 3; i++)
                    dv.setUint16(i << 1, dv.getUint16((i << 1) + 2));

                dv.setUint16(6, Math.random() * 0xFFFFFFFF);
                dv.setUint32(8, Math.random() * 0xFFFFFFFF);
                dv.setUint32(12, Math.random() * 0xFFFFFFFF);
            }
        }

        frozenClone() { return (new UID(this)).freeze(uid); }

        toString() { return this.string; }

        set string(e) { /*empty*/ }

        /** Returns a string representation of the UID */
        get string() {
            const dv = new DataView(this);
            return (
                "" + ("0000" + dv.getUint16(0).toString(16)).slice(-4) +
                "" + ("0000" + dv.getUint16(2).toString(16)).slice(-4) +
                "" + ("0000" + dv.getUint16(4).toString(16)).slice(-4) +
                "-" + ("0000" + dv.getUint16(6).toString(16)).slice(-4) +
                "-" + ("00000000" + dv.getUint32(8).toString(16)).slice(-8) +
                "-" + ("00000000" + dv.getUint32(12).toString(16)).slice(-8)
            )
        }

        set length(e) { /*empty*/ }

        get length() { return 16; }

        set date_created(e) { /*empty*/ }

        get date_created() {
            return new Date(
                Number(
                    BigInt.asUintN(
                        64,
                        (new DataView(this)).getBigUint64(0)
                    ) >> 16n
                )
            );
        }
    }

    function Diff() {}
    Diff.prototype = {
      diff: function diff(oldString, newString) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        var callback = options.callback;

        if (typeof options === 'function') {
          callback = options;
          options = {};
        }

        this.options = options;
        var self = this;

        function done(value) {
          if (callback) {
            setTimeout(function () {
              callback(undefined, value);
            }, 0);
            return true;
          } else {
            return value;
          }
        } // Allow subclasses to massage the input prior to running


        oldString = this.castInput(oldString);
        newString = this.castInput(newString);
        oldString = this.removeEmpty(this.tokenize(oldString));
        newString = this.removeEmpty(this.tokenize(newString));
        var newLen = newString.length,
            oldLen = oldString.length;
        var editLength = 1;
        var maxEditLength = newLen + oldLen;
        var bestPath = [{
          newPos: -1,
          components: []
        }]; // Seed editLength = 0, i.e. the content starts with the same values

        var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);

        if (bestPath[0].newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
          // Identity per the equality and tokenizer
          return done([{
            value: this.join(newString),
            count: newString.length
          }]);
        } // Main worker method. checks all permutations of a given edit length for acceptance.


        function execEditLength() {
          for (var diagonalPath = -1 * editLength; diagonalPath <= editLength; diagonalPath += 2) {
            var basePath = void 0;

            var addPath = bestPath[diagonalPath - 1],
                removePath = bestPath[diagonalPath + 1],
                _oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;

            if (addPath) {
              // No one else is going to attempt to use this value, clear it
              bestPath[diagonalPath - 1] = undefined;
            }

            var canAdd = addPath && addPath.newPos + 1 < newLen,
                canRemove = removePath && 0 <= _oldPos && _oldPos < oldLen;

            if (!canAdd && !canRemove) {
              // If this path is a terminal then prune
              bestPath[diagonalPath] = undefined;
              continue;
            } // Select the diagonal that we want to branch from. We select the prior
            // path whose position in the new string is the farthest from the origin
            // and does not pass the bounds of the diff graph


            if (!canAdd || canRemove && addPath.newPos < removePath.newPos) {
              basePath = clonePath(removePath);
              self.pushComponent(basePath.components, undefined, true);
            } else {
              basePath = addPath; // No need to clone, we've pulled it from the list

              basePath.newPos++;
              self.pushComponent(basePath.components, true, undefined);
            }

            _oldPos = self.extractCommon(basePath, newString, oldString, diagonalPath); // If we have hit the end of both strings, then we are done

            if (basePath.newPos + 1 >= newLen && _oldPos + 1 >= oldLen) {
              return done(buildValues(self, basePath.components, newString, oldString, self.useLongestToken));
            } else {
              // Otherwise track this path as a potential candidate and continue.
              bestPath[diagonalPath] = basePath;
            }
          }

          editLength++;
        } // Performs the length of edit iteration. Is a bit fugly as this has to support the
        // sync and async mode which is never fun. Loops over execEditLength until a value
        // is produced.


        if (callback) {
          (function exec() {
            setTimeout(function () {
              // This should not happen, but we want to be safe.

              /* istanbul ignore next */
              if (editLength > maxEditLength) {
                return callback();
              }

              if (!execEditLength()) {
                exec();
              }
            }, 0);
          })();
        } else {
          while (editLength <= maxEditLength) {
            var ret = execEditLength();

            if (ret) {
              return ret;
            }
          }
        }
      },
      pushComponent: function pushComponent(components, added, removed) {
        var last = components[components.length - 1];

        if (last && last.added === added && last.removed === removed) {
          // We need to clone here as the component clone operation is just
          // as shallow array clone
          components[components.length - 1] = {
            count: last.count + 1,
            added: added,
            removed: removed
          };
        } else {
          components.push({
            count: 1,
            added: added,
            removed: removed
          });
        }
      },
      extractCommon: function extractCommon(basePath, newString, oldString, diagonalPath) {
        var newLen = newString.length,
            oldLen = oldString.length,
            newPos = basePath.newPos,
            oldPos = newPos - diagonalPath,
            commonCount = 0;

        while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(newString[newPos + 1], oldString[oldPos + 1])) {
          newPos++;
          oldPos++;
          commonCount++;
        }

        if (commonCount) {
          basePath.components.push({
            count: commonCount
          });
        }

        basePath.newPos = newPos;
        return oldPos;
      },
      equals: function equals(left, right) {
        if (this.options.comparator) {
          return this.options.comparator(left, right);
        } else {
          return left === right || this.options.ignoreCase && left.toLowerCase() === right.toLowerCase();
        }
      },
      removeEmpty: function removeEmpty(array) {
        var ret = [];

        for (var i = 0; i < array.length; i++) {
          if (array[i]) {
            ret.push(array[i]);
          }
        }

        return ret;
      },
      castInput: function castInput(value) {
        return value;
      },
      tokenize: function tokenize(value) {
        return value.split('');
      },
      join: function join(chars) {
        return chars.join('');
      }
    };

    function buildValues(diff, components, newString, oldString, useLongestToken) {
      var componentPos = 0,
          componentLen = components.length,
          newPos = 0,
          oldPos = 0;

      for (; componentPos < componentLen; componentPos++) {
        var component = components[componentPos];

        if (!component.removed) {
          if (!component.added && useLongestToken) {
            var value = newString.slice(newPos, newPos + component.count);
            value = value.map(function (value, i) {
              var oldValue = oldString[oldPos + i];
              return oldValue.length > value.length ? oldValue : value;
            });
            component.value = diff.join(value);
          } else {
            component.value = diff.join(newString.slice(newPos, newPos + component.count));
          }

          newPos += component.count; // Common case

          if (!component.added) {
            oldPos += component.count;
          }
        } else {
          component.value = diff.join(oldString.slice(oldPos, oldPos + component.count));
          oldPos += component.count; // Reverse add and remove so removes are output first to match common convention
          // The diffing algorithm is tied to add then remove output and this is the simplest
          // route to get the desired output with minimal overhead.

          if (componentPos && components[componentPos - 1].added) {
            var tmp = components[componentPos - 1];
            components[componentPos - 1] = components[componentPos];
            components[componentPos] = tmp;
          }
        }
      } // Special case handle for when one terminal is ignored (i.e. whitespace).
      // For this case we merge the terminal into the prior string and drop the change.
      // This is only available for string mode.


      var lastComponent = components[componentLen - 1];

      if (componentLen > 1 && typeof lastComponent.value === 'string' && (lastComponent.added || lastComponent.removed) && diff.equals('', lastComponent.value)) {
        components[componentLen - 2].value += lastComponent.value;
        components.pop();
      }

      return components;
    }

    function clonePath(path) {
      return {
        newPos: path.newPos,
        components: path.components.slice(0)
      };
    }

    var characterDiff = new Diff();
    function diffChars(oldStr, newStr, options) {
      return characterDiff.diff(oldStr, newStr, options);
    }

    function generateOptions(options, defaults) {
      if (typeof options === 'function') {
        defaults.callback = options;
      } else if (options) {
        for (var name in options) {
          /* istanbul ignore else */
          if (options.hasOwnProperty(name)) {
            defaults[name] = options[name];
          }
        }
      }

      return defaults;
    }

    //
    // Ranges and exceptions:
    // Latin-1 Supplement, 0080–00FF
    //  - U+00D7  × Multiplication sign
    //  - U+00F7  ÷ Division sign
    // Latin Extended-A, 0100–017F
    // Latin Extended-B, 0180–024F
    // IPA Extensions, 0250–02AF
    // Spacing Modifier Letters, 02B0–02FF
    //  - U+02C7  ˇ &#711;  Caron
    //  - U+02D8  ˘ &#728;  Breve
    //  - U+02D9  ˙ &#729;  Dot Above
    //  - U+02DA  ˚ &#730;  Ring Above
    //  - U+02DB  ˛ &#731;  Ogonek
    //  - U+02DC  ˜ &#732;  Small Tilde
    //  - U+02DD  ˝ &#733;  Double Acute Accent
    // Latin Extended Additional, 1E00–1EFF

    var extendedWordChars = /^[A-Za-z\xC0-\u02C6\u02C8-\u02D7\u02DE-\u02FF\u1E00-\u1EFF]+$/;
    var reWhitespace = /\S/;
    var wordDiff = new Diff();

    wordDiff.equals = function (left, right) {
      if (this.options.ignoreCase) {
        left = left.toLowerCase();
        right = right.toLowerCase();
      }

      return left === right || this.options.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right);
    };

    wordDiff.tokenize = function (value) {
      var tokens = value.split(/(\s+|[()[\]{}'"]|\b)/); // Join the boundary splits that we do not consider to be boundaries. This is primarily the extended Latin character set.

      for (var i = 0; i < tokens.length - 1; i++) {
        // If we have an empty string in the next field and we have only word chars before and after, merge
        if (!tokens[i + 1] && tokens[i + 2] && extendedWordChars.test(tokens[i]) && extendedWordChars.test(tokens[i + 2])) {
          tokens[i] += tokens[i + 2];
          tokens.splice(i + 1, 2);
          i--;
        }
      }

      return tokens;
    };

    function diffWords(oldStr, newStr, options) {
      options = generateOptions(options, {
        ignoreWhitespace: true
      });
      return wordDiff.diff(oldStr, newStr, options);
    }
    function diffWordsWithSpace(oldStr, newStr, options) {
      return wordDiff.diff(oldStr, newStr, options);
    }

    var lineDiff = new Diff();

    lineDiff.tokenize = function (value) {
      var retLines = [],
          linesAndNewlines = value.split(/(\n|\r\n)/); // Ignore the final empty token that occurs if the string ends with a new line

      if (!linesAndNewlines[linesAndNewlines.length - 1]) {
        linesAndNewlines.pop();
      } // Merge the content and line separators into single tokens


      for (var i = 0; i < linesAndNewlines.length; i++) {
        var line = linesAndNewlines[i];

        if (i % 2 && !this.options.newlineIsToken) {
          retLines[retLines.length - 1] += line;
        } else {
          if (this.options.ignoreWhitespace) {
            line = line.trim();
          }

          retLines.push(line);
        }
      }

      return retLines;
    };

    function diffLines(oldStr, newStr, callback) {
      return lineDiff.diff(oldStr, newStr, callback);
    }
    function diffTrimmedLines(oldStr, newStr, callback) {
      var options = generateOptions(callback, {
        ignoreWhitespace: true
      });
      return lineDiff.diff(oldStr, newStr, options);
    }

    var sentenceDiff = new Diff();

    sentenceDiff.tokenize = function (value) {
      return value.split(/(\S.+?[.!?])(?=\s+|$)/);
    };

    function diffSentences(oldStr, newStr, callback) {
      return sentenceDiff.diff(oldStr, newStr, callback);
    }

    var cssDiff = new Diff();

    cssDiff.tokenize = function (value) {
      return value.split(/([{}:;,]|\s+)/);
    };

    function diffCss(oldStr, newStr, callback) {
      return cssDiff.diff(oldStr, newStr, callback);
    }

    function _typeof(obj) {
      if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
        _typeof = function (obj) {
          return typeof obj;
        };
      } else {
        _typeof = function (obj) {
          return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
        };
      }

      return _typeof(obj);
    }

    function _toConsumableArray(arr) {
      return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
    }

    function _arrayWithoutHoles(arr) {
      if (Array.isArray(arr)) {
        for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

        return arr2;
      }
    }

    function _iterableToArray(iter) {
      if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
    }

    function _nonIterableSpread() {
      throw new TypeError("Invalid attempt to spread non-iterable instance");
    }

    var objectPrototypeToString = Object.prototype.toString;
    var jsonDiff = new Diff(); // Discriminate between two lines of pretty-printed, serialized JSON where one of them has a
    // dangling comma and the other doesn't. Turns out including the dangling comma yields the nicest output:

    jsonDiff.useLongestToken = true;
    jsonDiff.tokenize = lineDiff.tokenize;

    jsonDiff.castInput = function (value) {
      var _this$options = this.options,
          undefinedReplacement = _this$options.undefinedReplacement,
          _this$options$stringi = _this$options.stringifyReplacer,
          stringifyReplacer = _this$options$stringi === void 0 ? function (k, v) {
        return typeof v === 'undefined' ? undefinedReplacement : v;
      } : _this$options$stringi;
      return typeof value === 'string' ? value : JSON.stringify(canonicalize(value, null, null, stringifyReplacer), stringifyReplacer, '  ');
    };

    jsonDiff.equals = function (left, right) {
      return Diff.prototype.equals.call(jsonDiff, left.replace(/,([\r\n])/g, '$1'), right.replace(/,([\r\n])/g, '$1'));
    };

    function diffJson(oldObj, newObj, options) {
      return jsonDiff.diff(oldObj, newObj, options);
    } // This function handles the presence of circular references by bailing out when encountering an
    // object that is already on the "stack" of items being processed. Accepts an optional replacer

    function canonicalize(obj, stack, replacementStack, replacer, key) {
      stack = stack || [];
      replacementStack = replacementStack || [];

      if (replacer) {
        obj = replacer(key, obj);
      }

      var i;

      for (i = 0; i < stack.length; i += 1) {
        if (stack[i] === obj) {
          return replacementStack[i];
        }
      }

      var canonicalizedObj;

      if ('[object Array]' === objectPrototypeToString.call(obj)) {
        stack.push(obj);
        canonicalizedObj = new Array(obj.length);
        replacementStack.push(canonicalizedObj);

        for (i = 0; i < obj.length; i += 1) {
          canonicalizedObj[i] = canonicalize(obj[i], stack, replacementStack, replacer, key);
        }

        stack.pop();
        replacementStack.pop();
        return canonicalizedObj;
      }

      if (obj && obj.toJSON) {
        obj = obj.toJSON();
      }

      if (_typeof(obj) === 'object' && obj !== null) {
        stack.push(obj);
        canonicalizedObj = {};
        replacementStack.push(canonicalizedObj);

        var sortedKeys = [],
            _key;

        for (_key in obj) {
          /* istanbul ignore else */
          if (obj.hasOwnProperty(_key)) {
            sortedKeys.push(_key);
          }
        }

        sortedKeys.sort();

        for (i = 0; i < sortedKeys.length; i += 1) {
          _key = sortedKeys[i];
          canonicalizedObj[_key] = canonicalize(obj[_key], stack, replacementStack, replacer, _key);
        }

        stack.pop();
        replacementStack.pop();
      } else {
        canonicalizedObj = obj;
      }

      return canonicalizedObj;
    }

    var arrayDiff = new Diff();

    arrayDiff.tokenize = function (value) {
      return value.slice();
    };

    arrayDiff.join = arrayDiff.removeEmpty = function (value) {
      return value;
    };

    function diffArrays(oldArr, newArr, callback) {
      return arrayDiff.diff(oldArr, newArr, callback);
    }

    function parsePatch(uniDiff) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var diffstr = uniDiff.split(/\r\n|[\n\v\f\r\x85]/),
          delimiters = uniDiff.match(/\r\n|[\n\v\f\r\x85]/g) || [],
          list = [],
          i = 0;

      function parseIndex() {
        var index = {};
        list.push(index); // Parse diff metadata

        while (i < diffstr.length) {
          var line = diffstr[i]; // File header found, end parsing diff metadata

          if (/^(\-\-\-|\+\+\+|@@)\s/.test(line)) {
            break;
          } // Diff index


          var header = /^(?:Index:|diff(?: -r \w+)+)\s+(.+?)\s*$/.exec(line);

          if (header) {
            index.index = header[1];
          }

          i++;
        } // Parse file headers if they are defined. Unified diff requires them, but
        // there's no technical issues to have an isolated hunk without file header


        parseFileHeader(index);
        parseFileHeader(index); // Parse hunks

        index.hunks = [];

        while (i < diffstr.length) {
          var _line = diffstr[i];

          if (/^(Index:|diff|\-\-\-|\+\+\+)\s/.test(_line)) {
            break;
          } else if (/^@@/.test(_line)) {
            index.hunks.push(parseHunk());
          } else if (_line && options.strict) {
            // Ignore unexpected content unless in strict mode
            throw new Error('Unknown line ' + (i + 1) + ' ' + JSON.stringify(_line));
          } else {
            i++;
          }
        }
      } // Parses the --- and +++ headers, if none are found, no lines
      // are consumed.


      function parseFileHeader(index) {
        var fileHeader = /^(---|\+\+\+)\s+(.*)$/.exec(diffstr[i]);

        if (fileHeader) {
          var keyPrefix = fileHeader[1] === '---' ? 'old' : 'new';
          var data = fileHeader[2].split('\t', 2);
          var fileName = data[0].replace(/\\\\/g, '\\');

          if (/^".*"$/.test(fileName)) {
            fileName = fileName.substr(1, fileName.length - 2);
          }

          index[keyPrefix + 'FileName'] = fileName;
          index[keyPrefix + 'Header'] = (data[1] || '').trim();
          i++;
        }
      } // Parses a hunk
      // This assumes that we are at the start of a hunk.


      function parseHunk() {
        var chunkHeaderIndex = i,
            chunkHeaderLine = diffstr[i++],
            chunkHeader = chunkHeaderLine.split(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
        var hunk = {
          oldStart: +chunkHeader[1],
          oldLines: +chunkHeader[2] || 1,
          newStart: +chunkHeader[3],
          newLines: +chunkHeader[4] || 1,
          lines: [],
          linedelimiters: []
        };
        var addCount = 0,
            removeCount = 0;

        for (; i < diffstr.length; i++) {
          // Lines starting with '---' could be mistaken for the "remove line" operation
          // But they could be the header for the next file. Therefore prune such cases out.
          if (diffstr[i].indexOf('--- ') === 0 && i + 2 < diffstr.length && diffstr[i + 1].indexOf('+++ ') === 0 && diffstr[i + 2].indexOf('@@') === 0) {
            break;
          }

          var operation = diffstr[i].length == 0 && i != diffstr.length - 1 ? ' ' : diffstr[i][0];

          if (operation === '+' || operation === '-' || operation === ' ' || operation === '\\') {
            hunk.lines.push(diffstr[i]);
            hunk.linedelimiters.push(delimiters[i] || '\n');

            if (operation === '+') {
              addCount++;
            } else if (operation === '-') {
              removeCount++;
            } else if (operation === ' ') {
              addCount++;
              removeCount++;
            }
          } else {
            break;
          }
        } // Handle the empty block count case


        if (!addCount && hunk.newLines === 1) {
          hunk.newLines = 0;
        }

        if (!removeCount && hunk.oldLines === 1) {
          hunk.oldLines = 0;
        } // Perform optional sanity checking


        if (options.strict) {
          if (addCount !== hunk.newLines) {
            throw new Error('Added line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
          }

          if (removeCount !== hunk.oldLines) {
            throw new Error('Removed line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
          }
        }

        return hunk;
      }

      while (i < diffstr.length) {
        parseIndex();
      }

      return list;
    }

    // Iterator that traverses in the range of [min, max], stepping
    // by distance from a given start position. I.e. for [0, 4], with
    // start of 2, this will iterate 2, 3, 1, 4, 0.
    function distanceIterator (start, minLine, maxLine) {
      var wantForward = true,
          backwardExhausted = false,
          forwardExhausted = false,
          localOffset = 1;
      return function iterator() {
        if (wantForward && !forwardExhausted) {
          if (backwardExhausted) {
            localOffset++;
          } else {
            wantForward = false;
          } // Check if trying to fit beyond text length, and if not, check it fits
          // after offset location (or desired location on first iteration)


          if (start + localOffset <= maxLine) {
            return localOffset;
          }

          forwardExhausted = true;
        }

        if (!backwardExhausted) {
          if (!forwardExhausted) {
            wantForward = true;
          } // Check if trying to fit before text beginning, and if not, check it fits
          // before offset location


          if (minLine <= start - localOffset) {
            return -localOffset++;
          }

          backwardExhausted = true;
          return iterator();
        } // We tried to fit hunk before text beginning and beyond text length, then
        // hunk can't fit on the text. Return undefined

      };
    }

    function applyPatch(source, uniDiff) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      if (typeof uniDiff === 'string') {
        uniDiff = parsePatch(uniDiff);
      }

      if (Array.isArray(uniDiff)) {
        if (uniDiff.length > 1) {
          throw new Error('applyPatch only works with a single input.');
        }

        uniDiff = uniDiff[0];
      } // Apply the diff to the input


      var lines = source.split(/\r\n|[\n\v\f\r\x85]/),
          delimiters = source.match(/\r\n|[\n\v\f\r\x85]/g) || [],
          hunks = uniDiff.hunks,
          compareLine = options.compareLine || function (lineNumber, line, operation, patchContent) {
        return line === patchContent;
      },
          errorCount = 0,
          fuzzFactor = options.fuzzFactor || 0,
          minLine = 0,
          offset = 0,
          removeEOFNL,
          addEOFNL;
      /**
       * Checks if the hunk exactly fits on the provided location
       */


      function hunkFits(hunk, toPos) {
        for (var j = 0; j < hunk.lines.length; j++) {
          var line = hunk.lines[j],
              operation = line.length > 0 ? line[0] : ' ',
              content = line.length > 0 ? line.substr(1) : line;

          if (operation === ' ' || operation === '-') {
            // Context sanity check
            if (!compareLine(toPos + 1, lines[toPos], operation, content)) {
              errorCount++;

              if (errorCount > fuzzFactor) {
                return false;
              }
            }

            toPos++;
          }
        }

        return true;
      } // Search best fit offsets for each hunk based on the previous ones


      for (var i = 0; i < hunks.length; i++) {
        var hunk = hunks[i],
            maxLine = lines.length - hunk.oldLines,
            localOffset = 0,
            toPos = offset + hunk.oldStart - 1;
        var iterator = distanceIterator(toPos, minLine, maxLine);

        for (; localOffset !== undefined; localOffset = iterator()) {
          if (hunkFits(hunk, toPos + localOffset)) {
            hunk.offset = offset += localOffset;
            break;
          }
        }

        if (localOffset === undefined) {
          return false;
        } // Set lower text limit to end of the current hunk, so next ones don't try
        // to fit over already patched text


        minLine = hunk.offset + hunk.oldStart + hunk.oldLines;
      } // Apply patch hunks


      var diffOffset = 0;

      for (var _i = 0; _i < hunks.length; _i++) {
        var _hunk = hunks[_i],
            _toPos = _hunk.oldStart + _hunk.offset + diffOffset - 1;

        diffOffset += _hunk.newLines - _hunk.oldLines;

        if (_toPos < 0) {
          // Creating a new file
          _toPos = 0;
        }

        for (var j = 0; j < _hunk.lines.length; j++) {
          var line = _hunk.lines[j],
              operation = line.length > 0 ? line[0] : ' ',
              content = line.length > 0 ? line.substr(1) : line,
              delimiter = _hunk.linedelimiters[j];

          if (operation === ' ') {
            _toPos++;
          } else if (operation === '-') {
            lines.splice(_toPos, 1);
            delimiters.splice(_toPos, 1);
            /* istanbul ignore else */
          } else if (operation === '+') {
            lines.splice(_toPos, 0, content);
            delimiters.splice(_toPos, 0, delimiter);
            _toPos++;
          } else if (operation === '\\') {
            var previousOperation = _hunk.lines[j - 1] ? _hunk.lines[j - 1][0] : null;

            if (previousOperation === '+') {
              removeEOFNL = true;
            } else if (previousOperation === '-') {
              addEOFNL = true;
            }
          }
        }
      } // Handle EOFNL insertion/removal


      if (removeEOFNL) {
        while (!lines[lines.length - 1]) {
          lines.pop();
          delimiters.pop();
        }
      } else if (addEOFNL) {
        lines.push('');
        delimiters.push('\n');
      }

      for (var _k = 0; _k < lines.length - 1; _k++) {
        lines[_k] = lines[_k] + delimiters[_k];
      }

      return lines.join('');
    } // Wrapper that supports multiple file patches via callbacks.

    function applyPatches(uniDiff, options) {
      if (typeof uniDiff === 'string') {
        uniDiff = parsePatch(uniDiff);
      }

      var currentIndex = 0;

      function processIndex() {
        var index = uniDiff[currentIndex++];

        if (!index) {
          return options.complete();
        }

        options.loadFile(index, function (err, data) {
          if (err) {
            return options.complete(err);
          }

          var updatedContent = applyPatch(data, index, options);
          options.patched(index, updatedContent, function (err) {
            if (err) {
              return options.complete(err);
            }

            processIndex();
          });
        });
      }

      processIndex();
    }

    function structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
      if (!options) {
        options = {};
      }

      if (typeof options.context === 'undefined') {
        options.context = 4;
      }

      var diff = diffLines(oldStr, newStr, options);
      diff.push({
        value: '',
        lines: []
      }); // Append an empty value to make cleanup easier

      function contextLines(lines) {
        return lines.map(function (entry) {
          return ' ' + entry;
        });
      }

      var hunks = [];
      var oldRangeStart = 0,
          newRangeStart = 0,
          curRange = [],
          oldLine = 1,
          newLine = 1;

      var _loop = function _loop(i) {
        var current = diff[i],
            lines = current.lines || current.value.replace(/\n$/, '').split('\n');
        current.lines = lines;

        if (current.added || current.removed) {
          var _curRange;

          // If we have previous context, start with that
          if (!oldRangeStart) {
            var prev = diff[i - 1];
            oldRangeStart = oldLine;
            newRangeStart = newLine;

            if (prev) {
              curRange = options.context > 0 ? contextLines(prev.lines.slice(-options.context)) : [];
              oldRangeStart -= curRange.length;
              newRangeStart -= curRange.length;
            }
          } // Output our changes


          (_curRange = curRange).push.apply(_curRange, _toConsumableArray(lines.map(function (entry) {
            return (current.added ? '+' : '-') + entry;
          }))); // Track the updated file position


          if (current.added) {
            newLine += lines.length;
          } else {
            oldLine += lines.length;
          }
        } else {
          // Identical context lines. Track line changes
          if (oldRangeStart) {
            // Close out any changes that have been output (or join overlapping)
            if (lines.length <= options.context * 2 && i < diff.length - 2) {
              var _curRange2;

              // Overlapping
              (_curRange2 = curRange).push.apply(_curRange2, _toConsumableArray(contextLines(lines)));
            } else {
              var _curRange3;

              // end the range and output
              var contextSize = Math.min(lines.length, options.context);

              (_curRange3 = curRange).push.apply(_curRange3, _toConsumableArray(contextLines(lines.slice(0, contextSize))));

              var hunk = {
                oldStart: oldRangeStart,
                oldLines: oldLine - oldRangeStart + contextSize,
                newStart: newRangeStart,
                newLines: newLine - newRangeStart + contextSize,
                lines: curRange
              };

              if (i >= diff.length - 2 && lines.length <= options.context) {
                // EOF is inside this hunk
                var oldEOFNewline = /\n$/.test(oldStr);
                var newEOFNewline = /\n$/.test(newStr);
                var noNlBeforeAdds = lines.length == 0 && curRange.length > hunk.oldLines;

                if (!oldEOFNewline && noNlBeforeAdds) {
                  // special case: old has no eol and no trailing context; no-nl can end up before adds
                  curRange.splice(hunk.oldLines, 0, '\\ No newline at end of file');
                }

                if (!oldEOFNewline && !noNlBeforeAdds || !newEOFNewline) {
                  curRange.push('\\ No newline at end of file');
                }
              }

              hunks.push(hunk);
              oldRangeStart = 0;
              newRangeStart = 0;
              curRange = [];
            }
          }

          oldLine += lines.length;
          newLine += lines.length;
        }
      };

      for (var i = 0; i < diff.length; i++) {
        _loop(i);
      }

      return {
        oldFileName: oldFileName,
        newFileName: newFileName,
        oldHeader: oldHeader,
        newHeader: newHeader,
        hunks: hunks
      };
    }
    function createTwoFilesPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
      var diff = structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options);
      var ret = [];

      if (oldFileName == newFileName) {
        ret.push('Index: ' + oldFileName);
      }

      ret.push('===================================================================');
      ret.push('--- ' + diff.oldFileName + (typeof diff.oldHeader === 'undefined' ? '' : '\t' + diff.oldHeader));
      ret.push('+++ ' + diff.newFileName + (typeof diff.newHeader === 'undefined' ? '' : '\t' + diff.newHeader));

      for (var i = 0; i < diff.hunks.length; i++) {
        var hunk = diff.hunks[i];
        ret.push('@@ -' + hunk.oldStart + ',' + hunk.oldLines + ' +' + hunk.newStart + ',' + hunk.newLines + ' @@');
        ret.push.apply(ret, hunk.lines);
      }

      return ret.join('\n') + '\n';
    }
    function createPatch(fileName, oldStr, newStr, oldHeader, newHeader, options) {
      return createTwoFilesPatch(fileName, fileName, oldStr, newStr, oldHeader, newHeader, options);
    }

    function arrayEqual(a, b) {
      if (a.length !== b.length) {
        return false;
      }

      return arrayStartsWith(a, b);
    }
    function arrayStartsWith(array, start) {
      if (start.length > array.length) {
        return false;
      }

      for (var i = 0; i < start.length; i++) {
        if (start[i] !== array[i]) {
          return false;
        }
      }

      return true;
    }

    function calcLineCount(hunk) {
      var _calcOldNewLineCount = calcOldNewLineCount(hunk.lines),
          oldLines = _calcOldNewLineCount.oldLines,
          newLines = _calcOldNewLineCount.newLines;

      if (oldLines !== undefined) {
        hunk.oldLines = oldLines;
      } else {
        delete hunk.oldLines;
      }

      if (newLines !== undefined) {
        hunk.newLines = newLines;
      } else {
        delete hunk.newLines;
      }
    }
    function merge(mine, theirs, base) {
      mine = loadPatch(mine, base);
      theirs = loadPatch(theirs, base);
      var ret = {}; // For index we just let it pass through as it doesn't have any necessary meaning.
      // Leaving sanity checks on this to the API consumer that may know more about the
      // meaning in their own context.

      if (mine.index || theirs.index) {
        ret.index = mine.index || theirs.index;
      }

      if (mine.newFileName || theirs.newFileName) {
        if (!fileNameChanged(mine)) {
          // No header or no change in ours, use theirs (and ours if theirs does not exist)
          ret.oldFileName = theirs.oldFileName || mine.oldFileName;
          ret.newFileName = theirs.newFileName || mine.newFileName;
          ret.oldHeader = theirs.oldHeader || mine.oldHeader;
          ret.newHeader = theirs.newHeader || mine.newHeader;
        } else if (!fileNameChanged(theirs)) {
          // No header or no change in theirs, use ours
          ret.oldFileName = mine.oldFileName;
          ret.newFileName = mine.newFileName;
          ret.oldHeader = mine.oldHeader;
          ret.newHeader = mine.newHeader;
        } else {
          // Both changed... figure it out
          ret.oldFileName = selectField(ret, mine.oldFileName, theirs.oldFileName);
          ret.newFileName = selectField(ret, mine.newFileName, theirs.newFileName);
          ret.oldHeader = selectField(ret, mine.oldHeader, theirs.oldHeader);
          ret.newHeader = selectField(ret, mine.newHeader, theirs.newHeader);
        }
      }

      ret.hunks = [];
      var mineIndex = 0,
          theirsIndex = 0,
          mineOffset = 0,
          theirsOffset = 0;

      while (mineIndex < mine.hunks.length || theirsIndex < theirs.hunks.length) {
        var mineCurrent = mine.hunks[mineIndex] || {
          oldStart: Infinity
        },
            theirsCurrent = theirs.hunks[theirsIndex] || {
          oldStart: Infinity
        };

        if (hunkBefore(mineCurrent, theirsCurrent)) {
          // This patch does not overlap with any of the others, yay.
          ret.hunks.push(cloneHunk(mineCurrent, mineOffset));
          mineIndex++;
          theirsOffset += mineCurrent.newLines - mineCurrent.oldLines;
        } else if (hunkBefore(theirsCurrent, mineCurrent)) {
          // This patch does not overlap with any of the others, yay.
          ret.hunks.push(cloneHunk(theirsCurrent, theirsOffset));
          theirsIndex++;
          mineOffset += theirsCurrent.newLines - theirsCurrent.oldLines;
        } else {
          // Overlap, merge as best we can
          var mergedHunk = {
            oldStart: Math.min(mineCurrent.oldStart, theirsCurrent.oldStart),
            oldLines: 0,
            newStart: Math.min(mineCurrent.newStart + mineOffset, theirsCurrent.oldStart + theirsOffset),
            newLines: 0,
            lines: []
          };
          mergeLines(mergedHunk, mineCurrent.oldStart, mineCurrent.lines, theirsCurrent.oldStart, theirsCurrent.lines);
          theirsIndex++;
          mineIndex++;
          ret.hunks.push(mergedHunk);
        }
      }

      return ret;
    }

    function loadPatch(param, base) {
      if (typeof param === 'string') {
        if (/^@@/m.test(param) || /^Index:/m.test(param)) {
          return parsePatch(param)[0];
        }

        if (!base) {
          throw new Error('Must provide a base reference or pass in a patch');
        }

        return structuredPatch(undefined, undefined, base, param);
      }

      return param;
    }

    function fileNameChanged(patch) {
      return patch.newFileName && patch.newFileName !== patch.oldFileName;
    }

    function selectField(index, mine, theirs) {
      if (mine === theirs) {
        return mine;
      } else {
        index.conflict = true;
        return {
          mine: mine,
          theirs: theirs
        };
      }
    }

    function hunkBefore(test, check) {
      return test.oldStart < check.oldStart && test.oldStart + test.oldLines < check.oldStart;
    }

    function cloneHunk(hunk, offset) {
      return {
        oldStart: hunk.oldStart,
        oldLines: hunk.oldLines,
        newStart: hunk.newStart + offset,
        newLines: hunk.newLines,
        lines: hunk.lines
      };
    }

    function mergeLines(hunk, mineOffset, mineLines, theirOffset, theirLines) {
      // This will generally result in a conflicted hunk, but there are cases where the context
      // is the only overlap where we can successfully merge the content here.
      var mine = {
        offset: mineOffset,
        lines: mineLines,
        index: 0
      },
          their = {
        offset: theirOffset,
        lines: theirLines,
        index: 0
      }; // Handle any leading content

      insertLeading(hunk, mine, their);
      insertLeading(hunk, their, mine); // Now in the overlap content. Scan through and select the best changes from each.

      while (mine.index < mine.lines.length && their.index < their.lines.length) {
        var mineCurrent = mine.lines[mine.index],
            theirCurrent = their.lines[their.index];

        if ((mineCurrent[0] === '-' || mineCurrent[0] === '+') && (theirCurrent[0] === '-' || theirCurrent[0] === '+')) {
          // Both modified ...
          mutualChange(hunk, mine, their);
        } else if (mineCurrent[0] === '+' && theirCurrent[0] === ' ') {
          var _hunk$lines;

          // Mine inserted
          (_hunk$lines = hunk.lines).push.apply(_hunk$lines, _toConsumableArray(collectChange(mine)));
        } else if (theirCurrent[0] === '+' && mineCurrent[0] === ' ') {
          var _hunk$lines2;

          // Theirs inserted
          (_hunk$lines2 = hunk.lines).push.apply(_hunk$lines2, _toConsumableArray(collectChange(their)));
        } else if (mineCurrent[0] === '-' && theirCurrent[0] === ' ') {
          // Mine removed or edited
          removal(hunk, mine, their);
        } else if (theirCurrent[0] === '-' && mineCurrent[0] === ' ') {
          // Their removed or edited
          removal(hunk, their, mine, true);
        } else if (mineCurrent === theirCurrent) {
          // Context identity
          hunk.lines.push(mineCurrent);
          mine.index++;
          their.index++;
        } else {
          // Context mismatch
          conflict(hunk, collectChange(mine), collectChange(their));
        }
      } // Now push anything that may be remaining


      insertTrailing(hunk, mine);
      insertTrailing(hunk, their);
      calcLineCount(hunk);
    }

    function mutualChange(hunk, mine, their) {
      var myChanges = collectChange(mine),
          theirChanges = collectChange(their);

      if (allRemoves(myChanges) && allRemoves(theirChanges)) {
        // Special case for remove changes that are supersets of one another
        if (arrayStartsWith(myChanges, theirChanges) && skipRemoveSuperset(their, myChanges, myChanges.length - theirChanges.length)) {
          var _hunk$lines3;

          (_hunk$lines3 = hunk.lines).push.apply(_hunk$lines3, _toConsumableArray(myChanges));

          return;
        } else if (arrayStartsWith(theirChanges, myChanges) && skipRemoveSuperset(mine, theirChanges, theirChanges.length - myChanges.length)) {
          var _hunk$lines4;

          (_hunk$lines4 = hunk.lines).push.apply(_hunk$lines4, _toConsumableArray(theirChanges));

          return;
        }
      } else if (arrayEqual(myChanges, theirChanges)) {
        var _hunk$lines5;

        (_hunk$lines5 = hunk.lines).push.apply(_hunk$lines5, _toConsumableArray(myChanges));

        return;
      }

      conflict(hunk, myChanges, theirChanges);
    }

    function removal(hunk, mine, their, swap) {
      var myChanges = collectChange(mine),
          theirChanges = collectContext(their, myChanges);

      if (theirChanges.merged) {
        var _hunk$lines6;

        (_hunk$lines6 = hunk.lines).push.apply(_hunk$lines6, _toConsumableArray(theirChanges.merged));
      } else {
        conflict(hunk, swap ? theirChanges : myChanges, swap ? myChanges : theirChanges);
      }
    }

    function conflict(hunk, mine, their) {
      hunk.conflict = true;
      hunk.lines.push({
        conflict: true,
        mine: mine,
        theirs: their
      });
    }

    function insertLeading(hunk, insert, their) {
      while (insert.offset < their.offset && insert.index < insert.lines.length) {
        var line = insert.lines[insert.index++];
        hunk.lines.push(line);
        insert.offset++;
      }
    }

    function insertTrailing(hunk, insert) {
      while (insert.index < insert.lines.length) {
        var line = insert.lines[insert.index++];
        hunk.lines.push(line);
      }
    }

    function collectChange(state) {
      var ret = [],
          operation = state.lines[state.index][0];

      while (state.index < state.lines.length) {
        var line = state.lines[state.index]; // Group additions that are immediately after subtractions and treat them as one "atomic" modify change.

        if (operation === '-' && line[0] === '+') {
          operation = '+';
        }

        if (operation === line[0]) {
          ret.push(line);
          state.index++;
        } else {
          break;
        }
      }

      return ret;
    }

    function collectContext(state, matchChanges) {
      var changes = [],
          merged = [],
          matchIndex = 0,
          contextChanges = false,
          conflicted = false;

      while (matchIndex < matchChanges.length && state.index < state.lines.length) {
        var change = state.lines[state.index],
            match = matchChanges[matchIndex]; // Once we've hit our add, then we are done

        if (match[0] === '+') {
          break;
        }

        contextChanges = contextChanges || change[0] !== ' ';
        merged.push(match);
        matchIndex++; // Consume any additions in the other block as a conflict to attempt
        // to pull in the remaining context after this

        if (change[0] === '+') {
          conflicted = true;

          while (change[0] === '+') {
            changes.push(change);
            change = state.lines[++state.index];
          }
        }

        if (match.substr(1) === change.substr(1)) {
          changes.push(change);
          state.index++;
        } else {
          conflicted = true;
        }
      }

      if ((matchChanges[matchIndex] || '')[0] === '+' && contextChanges) {
        conflicted = true;
      }

      if (conflicted) {
        return changes;
      }

      while (matchIndex < matchChanges.length) {
        merged.push(matchChanges[matchIndex++]);
      }

      return {
        merged: merged,
        changes: changes
      };
    }

    function allRemoves(changes) {
      return changes.reduce(function (prev, change) {
        return prev && change[0] === '-';
      }, true);
    }

    function skipRemoveSuperset(state, removeChanges, delta) {
      for (var i = 0; i < delta; i++) {
        var changeContent = removeChanges[removeChanges.length - delta + i].substr(1);

        if (state.lines[state.index + i] !== ' ' + changeContent) {
          return false;
        }
      }

      state.index += delta;
      return true;
    }

    function calcOldNewLineCount(lines) {
      var oldLines = 0;
      var newLines = 0;
      lines.forEach(function (line) {
        if (typeof line !== 'string') {
          var myCount = calcOldNewLineCount(line.mine);
          var theirCount = calcOldNewLineCount(line.theirs);

          if (oldLines !== undefined) {
            if (myCount.oldLines === theirCount.oldLines) {
              oldLines += myCount.oldLines;
            } else {
              oldLines = undefined;
            }
          }

          if (newLines !== undefined) {
            if (myCount.newLines === theirCount.newLines) {
              newLines += myCount.newLines;
            } else {
              newLines = undefined;
            }
          }
        } else {
          if (newLines !== undefined && (line[0] === '+' || line[0] === ' ')) {
            newLines++;
          }

          if (oldLines !== undefined && (line[0] === '-' || line[0] === ' ')) {
            oldLines++;
          }
        }
      });
      return {
        oldLines: oldLines,
        newLines: newLines
      };
    }

    // See: http://code.google.com/p/google-diff-match-patch/wiki/API
    function convertChangesToDMP(changes) {
      var ret = [],
          change,
          operation;

      for (var i = 0; i < changes.length; i++) {
        change = changes[i];

        if (change.added) {
          operation = 1;
        } else if (change.removed) {
          operation = -1;
        } else {
          operation = 0;
        }

        ret.push([operation, change.value]);
      }

      return ret;
    }

    function convertChangesToXML(changes) {
      var ret = [];

      for (var i = 0; i < changes.length; i++) {
        var change = changes[i];

        if (change.added) {
          ret.push('<ins>');
        } else if (change.removed) {
          ret.push('<del>');
        }

        ret.push(escapeHTML(change.value));

        if (change.added) {
          ret.push('</ins>');
        } else if (change.removed) {
          ret.push('</del>');
        }
      }

      return ret.join('');
    }

    function escapeHTML(s) {
      var n = s;
      n = n.replace(/&/g, '&amp;');
      n = n.replace(/</g, '&lt;');
      n = n.replace(/>/g, '&gt;');
      n = n.replace(/"/g, '&quot;');
      return n;
    }

    const observer_mixin_symbol = Symbol("observer_mixin_symbol");

    const observer_mixin = function(calling_name, prototype) {

        const observer_identifier = Symbol("observer_array_reference");

        prototype[observer_mixin_symbol] = observer_identifier;

        //Adds an observer to the object instance. Applies a property to the observer that references the object instance.
        //Creates new observers array if one does not already exist.
        prototype.addObserver = function(...observer_list) {
            let observers = this[observer_identifier];

            if (!observers)
                observers = this[observer_identifier] = [];

            for (const observer of observer_list) {

                if (observer[observer_identifier] == this)
                    return

                if (observer[observer_identifier])
                    observer[observer_identifier].removeObserver(observer);

                observers.push(observer);

                observer[observer_identifier] = this;
            }
        };

        //Removes an observer from the object instance. 
        prototype.removeObserver = function(...observer_list) {

            const observers = this[observer_identifier];

            for (const observer of observer_list)
                for (let i = 0, l = observers.length; i < l; i++)
                    if (observers[i] == observer) return (observer[observer_identifier] = null, observers.splice(i, 1));

        };


        prototype.updateObservers = function() {
            const observers = this[observer_identifier];

            if (observers)
                observers.forEach(obj => obj[calling_name](this));
        };
    };

    //Properly destructs this observers object on the object instance.
    observer_mixin.destroy = function(observer_mixin_instance) {

        const symbol = observer_mixin_instance.constructor.prototype[observer_mixin_symbol];

        if (symbol) {
            if (observer_mixin_instance[symbol])
                observer_mixin_instance[symbol].forEach(observer=>observer[symbol] = null);

            observer_mixin_instance[symbol].length = 0;
            
            observer_mixin_instance[symbol] = null;
        }
    };

    observer_mixin.mixin_symbol = observer_mixin_symbol;

    Object.freeze(observer_mixin);

    const A = 65;
    const a = 97;
    const ACKNOWLEDGE = 6;
    const AMPERSAND = 38;
    const ASTERISK = 42;
    const AT = 64;
    const B = 66;
    const b = 98;
    const BACKSLASH = 92;
    const BACKSPACE = 8;
    const BELL = 7;
    const C = 67;
    const c = 99;
    const CANCEL = 24;
    const CARET = 94;
    const CARRIAGE_RETURN = 13;
    const CLOSE_CURLY = 125;
    const CLOSE_PARENTH = 41;
    const CLOSE_SQUARE = 93;
    const COLON = 58;
    const COMMA = 44;
    const d = 100;
    const D = 68;
    const DATA_LINK_ESCAPE = 16;
    const DELETE = 127;
    const DEVICE_CTRL_1 = 17;
    const DEVICE_CTRL_2 = 18;
    const DEVICE_CTRL_3 = 19;
    const DEVICE_CTRL_4 = 20;
    const DOLLAR = 36;
    const DOUBLE_QUOTE = 34;
    const e = 101;
    const E = 69;
    const EIGHT = 56;
    const END_OF_MEDIUM = 25;
    const END_OF_TRANSMISSION = 4;
    const END_OF_TRANSMISSION_BLOCK = 23;
    const END_OF_TXT = 3;
    const ENQUIRY = 5;
    const EQUAL = 61;
    const ESCAPE = 27;
    const EXCLAMATION = 33;
    const f = 102;
    const F = 70;
    const FILE_SEPERATOR = 28;
    const FIVE = 53;
    const FORM_FEED = 12;
    const FORWARD_SLASH = 47;
    const FOUR = 52;
    const g = 103;
    const G = 71;
    const GRAVE = 96;
    const GREATER_THAN = 62;
    const GROUP_SEPERATOR = 29;
    const h = 104;
    const H = 72;
    const HASH = 35;
    const HORIZONTAL_TAB = 9;
    const HYPHEN = 45;
    const i = 105;
    const I = 73;
    const j = 106;
    const J = 74;
    const k = 107;
    const K = 75;
    const l = 108;
    const L = 76;
    const LESS_THAN = 60;
    const LINE_FEED = 10;
    const m = 109;
    const M = 77;
    const n = 110;
    const N = 78;
    const NEGATIVE_ACKNOWLEDGE = 21;
    const NINE = 57;
    const NULL = 0;
    const o = 111;
    const O = 79;
    const ONE = 49;
    const OPEN_CURLY = 123;
    const OPEN_PARENTH = 40;
    const OPEN_SQUARE = 91;
    const p = 112;
    const P = 80;
    const PERCENT = 37;
    const PERIOD = 46;
    const PLUS = 43;
    const q = 113;
    const Q = 81;
    const QMARK = 63;
    const QUOTE = 39;
    const r = 114;
    const R = 82;
    const RECORD_SEPERATOR = 30;
    const s = 115;
    const S = 83;
    const SEMICOLON = 59;
    const SEVEN = 55;
    const SHIFT_IN = 15;
    const SHIFT_OUT = 14;
    const SIX = 54;
    const SPACE = 32;
    const START_OF_HEADER = 1;
    const START_OF_TEXT = 2;
    const SUBSTITUTE = 26;
    const SYNCH_IDLE = 22;
    const t = 116;
    const T = 84;
    const THREE = 51;
    const TILDE = 126;
    const TWO = 50;
    const u = 117;
    const U = 85;
    const UNDER_SCORE = 95;
    const UNIT_SEPERATOR = 31;
    const v = 118;
    const V = 86;
    const VERTICAL_BAR = 124;
    const VERTICAL_TAB = 11;
    const w = 119;
    const W = 87;
    const x = 120;
    const X = 88;
    const y = 121;
    const Y = 89;
    const z = 122;
    const Z = 90;
    const ZERO = 48;

    /**
     * Lexer Jump table reference 
     * 0. NUMBER
     * 1. IDENTIFIER
     * 2. QUOTE STRING
     * 3. SPACE SET
     * 4. TAB SET
     * 5. CARIAGE RETURN
     * 6. LINEFEED
     * 7. SYMBOL
     * 8. OPERATOR
     * 9. OPEN BRACKET
     * 10. CLOSE BRACKET 
     * 11. DATA_LINK
     */ 
    const jump_table = [
    7, 	 	/* NULL */
    7, 	 	/* START_OF_HEADER */
    7, 	 	/* START_OF_TEXT */
    7, 	 	/* END_OF_TXT */
    7, 	 	/* END_OF_TRANSMISSION */
    7, 	 	/* ENQUIRY */
    7, 	 	/* ACKNOWLEDGE */
    7, 	 	/* BELL */
    7, 	 	/* BACKSPACE */
    4, 	 	/* HORIZONTAL_TAB */
    6, 	 	/* LINEFEED */
    7, 	 	/* VERTICAL_TAB */
    7, 	 	/* FORM_FEED */
    5, 	 	/* CARRIAGE_RETURN */
    7, 	 	/* SHIFT_OUT */
    7, 		/* SHIFT_IN */
    11,	 	/* DATA_LINK_ESCAPE */
    7, 	 	/* DEVICE_CTRL_1 */
    7, 	 	/* DEVICE_CTRL_2 */
    7, 	 	/* DEVICE_CTRL_3 */
    7, 	 	/* DEVICE_CTRL_4 */
    7, 	 	/* NEGATIVE_ACKNOWLEDGE */
    7, 	 	/* SYNCH_IDLE */
    7, 	 	/* END_OF_TRANSMISSION_BLOCK */
    7, 	 	/* CANCEL */
    7, 	 	/* END_OF_MEDIUM */
    7, 	 	/* SUBSTITUTE */
    7, 	 	/* ESCAPE */
    7, 	 	/* FILE_SEPERATOR */
    7, 	 	/* GROUP_SEPERATOR */
    7, 	 	/* RECORD_SEPERATOR */
    7, 	 	/* UNIT_SEPERATOR */
    3, 	 	/* SPACE */
    8, 	 	/* EXCLAMATION */
    2, 	 	/* DOUBLE_QUOTE */
    7, 	 	/* HASH */
    7, 	 	/* DOLLAR */
    8, 	 	/* PERCENT */
    8, 	 	/* AMPERSAND */
    2, 	 	/* QUOTE */
    9, 	 	/* OPEN_PARENTH */
    10, 	 /* CLOSE_PARENTH */
    8, 	 	/* ASTERISK */
    8, 	 	/* PLUS */
    7, 	 	/* COMMA */
    7, 	 	/* HYPHEN */
    7, 	 	/* PERIOD */
    7, 	 	/* FORWARD_SLASH */
    0, 	 	/* ZERO */
    0, 	 	/* ONE */
    0, 	 	/* TWO */
    0, 	 	/* THREE */
    0, 	 	/* FOUR */
    0, 	 	/* FIVE */
    0, 	 	/* SIX */
    0, 	 	/* SEVEN */
    0, 	 	/* EIGHT */
    0, 	 	/* NINE */
    8, 	 	/* COLON */
    7, 	 	/* SEMICOLON */
    8, 	 	/* LESS_THAN */
    8, 	 	/* EQUAL */
    8, 	 	/* GREATER_THAN */
    7, 	 	/* QMARK */
    7, 	 	/* AT */
    1, 	 	/* A*/
    1, 	 	/* B */
    1, 	 	/* C */
    1, 	 	/* D */
    1, 	 	/* E */
    1, 	 	/* F */
    1, 	 	/* G */
    1, 	 	/* H */
    1, 	 	/* I */
    1, 	 	/* J */
    1, 	 	/* K */
    1, 	 	/* L */
    1, 	 	/* M */
    1, 	 	/* N */
    1, 	 	/* O */
    1, 	 	/* P */
    1, 	 	/* Q */
    1, 	 	/* R */
    1, 	 	/* S */
    1, 	 	/* T */
    1, 	 	/* U */
    1, 	 	/* V */
    1, 	 	/* W */
    1, 	 	/* X */
    1, 	 	/* Y */
    1, 	 	/* Z */
    9, 	 	/* OPEN_SQUARE */
    7, 	 	/* TILDE */
    10, 	/* CLOSE_SQUARE */
    7, 	 	/* CARET */
    7, 	 	/* UNDER_SCORE */
    2, 	 	/* GRAVE */
    1, 	 	/* a */
    1, 	 	/* b */
    1, 	 	/* c */
    1, 	 	/* d */
    1, 	 	/* e */
    1, 	 	/* f */
    1, 	 	/* g */
    1, 	 	/* h */
    1, 	 	/* i */
    1, 	 	/* j */
    1, 	 	/* k */
    1, 	 	/* l */
    1, 	 	/* m */
    1, 	 	/* n */
    1, 	 	/* o */
    1, 	 	/* p */
    1, 	 	/* q */
    1, 	 	/* r */
    1, 	 	/* s */
    1, 	 	/* t */
    1, 	 	/* u */
    1, 	 	/* v */
    1, 	 	/* w */
    1, 	 	/* x */
    1, 	 	/* y */
    1, 	 	/* z */
    9, 	 	/* OPEN_CURLY */
    7, 	 	/* VERTICAL_BAR */
    10,  	/* CLOSE_CURLY */
    7,  	/* TILDE */
    7 		/* DELETE */
    ];	

    /**
     * LExer Number and Identifier jump table reference
     * Number are masked by 12(4|8) and Identifiers are masked by 10(2|8)
     * entries marked as `0` are not evaluated as either being in the number set or the identifier set.
     * entries marked as `2` are in the identifier set but not the number set
     * entries marked as `4` are in the number set but not the identifier set
     * entries marked as `8` are in both number and identifier sets
     */
    const number_and_identifier_table = [
    0, 		/* NULL */
    0, 		/* START_OF_HEADER */
    0, 		/* START_OF_TEXT */
    0, 		/* END_OF_TXT */
    0, 		/* END_OF_TRANSMISSION */
    0, 		/* ENQUIRY */
    0,		/* ACKNOWLEDGE */
    0,		/* BELL */
    0,		/* BACKSPACE */
    0,		/* HORIZONTAL_TAB */
    0,		/* LINEFEED */
    0,		/* VERTICAL_TAB */
    0,		/* FORM_FEED */
    0,		/* CARRIAGE_RETURN */
    0,		/* SHIFT_OUT */
    0,		/* SHIFT_IN */
    0,		/* DATA_LINK_ESCAPE */
    0,		/* DEVICE_CTRL_1 */
    0,		/* DEVICE_CTRL_2 */
    0,		/* DEVICE_CTRL_3 */
    0,		/* DEVICE_CTRL_4 */
    0,		/* NEGATIVE_ACKNOWLEDGE */
    0,		/* SYNCH_IDLE */
    0,		/* END_OF_TRANSMISSION_BLOCK */
    0,		/* CANCEL */
    0,		/* END_OF_MEDIUM */
    0,		/* SUBSTITUTE */
    0,		/* ESCAPE */
    0,		/* FILE_SEPERATOR */
    0,		/* GROUP_SEPERATOR */
    0,		/* RECORD_SEPERATOR */
    0,		/* UNIT_SEPERATOR */
    0,		/* SPACE */
    0,		/* EXCLAMATION */
    0,		/* DOUBLE_QUOTE */
    0,		/* HASH */
    0,		/* DOLLAR */
    0,		/* PERCENT */
    0,		/* AMPERSAND */
    0,		/* QUOTE */
    0,		/* OPEN_PARENTH */
    0,		 /* CLOSE_PARENTH */
    0,		/* ASTERISK */
    0,		/* PLUS */
    0,		/* COMMA */
    0,		/* HYPHEN */
    4,		/* PERIOD */
    0,		/* FORWARD_SLASH */
    8,		/* ZERO */
    8,		/* ONE */
    8,		/* TWO */
    8,		/* THREE */
    8,		/* FOUR */
    8,		/* FIVE */
    8,		/* SIX */
    8,		/* SEVEN */
    8,		/* EIGHT */
    8,		/* NINE */
    0,		/* COLON */
    0,		/* SEMICOLON */
    0,		/* LESS_THAN */
    0,		/* EQUAL */
    0,		/* GREATER_THAN */
    0,		/* QMARK */
    0,		/* AT */
    2,		/* A*/
    8,		/* B */
    2,		/* C */
    2,		/* D */
    8,		/* E */
    2,		/* F */
    2,		/* G */
    2,		/* H */
    2,		/* I */
    2,		/* J */
    2,		/* K */
    2,		/* L */
    2,		/* M */
    2,		/* N */
    8,		/* O */
    2,		/* P */
    2,		/* Q */
    2,		/* R */
    2,		/* S */
    2,		/* T */
    2,		/* U */
    2,		/* V */
    2,		/* W */
    8,		/* X */
    2,		/* Y */
    2,		/* Z */
    0,		/* OPEN_SQUARE */
    0,		/* TILDE */
    0,		/* CLOSE_SQUARE */
    0,		/* CARET */
    0,		/* UNDER_SCORE */
    0,		/* GRAVE */
    2,		/* a */
    8,		/* b */
    2,		/* c */
    2,		/* d */
    2,		/* e */
    2,		/* f */
    2,		/* g */
    2,		/* h */
    2,		/* i */
    2,		/* j */
    2,		/* k */
    2,		/* l */
    2,		/* m */
    2,		/* n */
    8,		/* o */
    2,		/* p */
    2,		/* q */
    2,		/* r */
    2,		/* s */
    2,		/* t */
    2,		/* u */
    2,		/* v */
    2,		/* w */
    8,		/* x */
    2,		/* y */
    2,		/* z */
    0,		/* OPEN_CURLY */
    0,		/* VERTICAL_BAR */
    0,		/* CLOSE_CURLY */
    0,		/* TILDE */
    0		/* DELETE */
    ];

    const extended_number_and_identifier_table = number_and_identifier_table.slice();
    extended_number_and_identifier_table[45] = 2;
    extended_number_and_identifier_table[95] = 2;

    const
        number = 1,
        identifier = 2,
        string = 4,
        white_space = 8,
        open_bracket = 16,
        close_bracket = 32,
        operator = 64,
        symbol = 128,
        new_line = 256,
        data_link = 512,
        alpha_numeric = (identifier | number),
        white_space_new_line = (white_space | new_line),
        Types = {
            num: number,
            number,
            id: identifier,
            identifier,
            str: string,
            string,
            ws: white_space,
            white_space,
            ob: open_bracket,
            open_bracket,
            cb: close_bracket,
            close_bracket,
            op: operator,
            operator,
            sym: symbol,
            symbol,
            nl: new_line,
            new_line,
            dl: data_link,
            data_link,
            alpha_numeric,
            white_space_new_line,
        },

        /*** MASKS ***/

        TYPE_MASK = 0xF,
        PARSE_STRING_MASK = 0x10,
        IGNORE_WHITESPACE_MASK = 0x20,
        CHARACTERS_ONLY_MASK = 0x40,
        TOKEN_LENGTH_MASK = 0xFFFFFF80,

        //De Bruijn Sequence for finding index of right most bit set.
        //http://supertech.csail.mit.edu/papers/debruijn.pdf
        debruijnLUT = [
            0, 1, 28, 2, 29, 14, 24, 3, 30, 22, 20, 15, 25, 17, 4, 8,
            31, 27, 13, 23, 21, 19, 16, 7, 26, 12, 18, 6, 11, 5, 10, 9
        ];

    const getNumbrOfTrailingZeroBitsFromPowerOf2 = (value) => debruijnLUT[(value * 0x077CB531) >>> 27];

    class Lexer {

        constructor(string = "", INCLUDE_WHITE_SPACE_TOKENS = false, PEEKING = false) {

            if (typeof(string) !== "string") throw new Error(`String value must be passed to Lexer. A ${typeof(string)} was passed as the \`string\` argument.`);

            /**
             * The string that the Lexer tokenizes.
             */
            this.str = string;

            /**
             * Reference to the peeking Lexer.
             */
            this.p = null;

            /**
             * The type id of the current token.
             */
            this.type = 32768; //Default "non-value" for types is 1<<15;

            /**
             * The offset in the string of the start of the current token.
             */
            this.off = 0;

            this.masked_values = 0;

            /**
             * The character offset of the current token within a line.
             */
            this.char = 0;
            /**
             * The line position of the current token.
             */
            this.line = 0;
            /**
             * The length of the string being parsed
             */
            this.sl = string.length;
            /**
             * The length of the current token.
             */
            this.tl = 0;

            /**
             * Flag to ignore white spaced.
             */
            this.IWS = !INCLUDE_WHITE_SPACE_TOKENS;

            this.USE_EXTENDED_ID = false;

            /**
             * Flag to force the lexer to parse string contents
             */
            this.PARSE_STRING = false;

            this.id_lu = number_and_identifier_table;

            if (!PEEKING) this.next();
        }

        useExtendedId(){
            this.id_lu = extended_number_and_identifier_table;
            this.tl = 0;
            this.next();
            return this;
        }

        /**
         * Restricts max parse distance to the other Lexer's current position.
         * @param      {Lexer}  Lexer   The Lexer to limit parse distance by.
         */
        fence(marker = this) {
            if (marker.str !== this.str)
                return;
            this.sl = marker.off;
            return this;
        }

        /**
         * Copies the Lexer.
         * @return     {Lexer}  Returns a new Lexer instance with the same property values.
         */
        copy(destination = new Lexer(this.str, false, true)) {
            destination.off = this.off;
            destination.char = this.char;
            destination.line = this.line;
            destination.sl = this.sl;
            destination.masked_values = this.masked_values;
            destination.id_lu = this.id_lu;
            return destination;
        }

        /**
         * Given another Lexer with the same `str` property value, it will copy the state of that Lexer.
         * @param      {Lexer}  [marker=this.peek]  The Lexer to clone the state from. 
         * @throws     {Error} Throws an error if the Lexers reference different strings.
         * @public
         */
        sync(marker = this.p) {

            if (marker instanceof Lexer) {
                if (marker.str !== this.str) throw new Error("Cannot sync Lexers with different strings!");
                this.off = marker.off;
                this.char = marker.char;
                this.line = marker.line;
                this.masked_values = marker.masked_values;
            }

            return this;
        }

        /**
        Creates an error message with a diagram illustrating the location of the error. 
        */
        errorMessage(message = "") {
            const pk = this.copy();

            pk.IWS = false;

            while (!pk.END && pk.ty !== Types.nl) { pk.next(); }

            const end = (pk.END) ? this.str.length : pk.off,

                nls = (this.line > 0) ? 1 : 0,
                number_of_tabs = this.str
                    .slice(this.off - this.char + nls + nls, this.off + nls)
                    .split("")
                    .reduce((r, v) => (r + ((v.charCodeAt(0) == HORIZONTAL_TAB) | 0)), 0),

                arrow = String.fromCharCode(0x2b89),

                line = String.fromCharCode(0x2500),

                thick_line = String.fromCharCode(0x2501),

                line_number = `    ${this.line+1}: `,

                line_fill = line_number.length + number_of_tabs,

                line_text = this.str.slice(this.off - this.char + nls + (nls), end).replace(/\t/g, "  "),

                error_border = thick_line.repeat(line_text.length + line_number.length + 2),

                is_iws = (!this.IWS) ? "\n The Lexer produced whitespace tokens" : "",

                msg =[ `${message} at ${this.line+1}:${this.char - nls}` ,
                `${error_border}` ,
                `${line_number+line_text}` ,
                `${line.repeat(this.char-nls+line_fill-(nls))+arrow}` ,
                `${error_border}` ,
                `${is_iws}`].join("\n");

            return msg;
        }

        /**
         * Will throw a new Error, appending the parsed string line and position information to the the error message passed into the function.
         * @instance
         * @public
         * @param {String} message - The error message.
         * @param {Bool} DEFER - if true, returns an Error object instead of throwing.
         */
        throw (message, DEFER = false) {
            const error = new Error(this.errorMessage(message));
            if (DEFER)
                return error;
            throw error;
        }

        /**
         * Proxy for Lexer.prototype.reset
         * @public
         */
        r() { return this.reset() }

        /**
         * Restore the Lexer back to it's initial state.
         * @public
         */
        reset() {
            this.p = null;
            this.type = 32768;
            this.off = 0;
            this.tl = 0;
            this.char = 0;
            this.line = 0;
            this.n;
            return this;
        }

        resetHead() {
            this.off = 0;
            this.tl = 0;
            this.char = 0;
            this.line = 0;
            this.p = null;
            this.type = 32768;
        }

        /**
         * Sets the internal state to point to the next token. Sets Lexer.prototype.END to `true` if the end of the string is hit.
         * @public
         * @param {Lexer} [marker=this] - If another Lexer is passed into this method, it will advance the token state of that Lexer.
         */
        next(marker = this, USE_CUSTOM_SYMBOLS = !!this.symbol_map) {

            if (marker.sl < 1) {
                marker.off = 0;
                marker.type = 32768;
                marker.tl = 0;
                marker.line = 0;
                marker.char = 0;
                return marker;
            }

            //Token builder
            const l = marker.sl,
                str = marker.str,
                number_and_identifier_table = this.id_lu,
                IWS = marker.IWS;

            let length = marker.tl,
                off = marker.off + length,
                type = symbol,
                line = marker.line,
                base = off,
                char = marker.char,
                root = marker.off;

            if (off >= l) {
                length = 0;
                base = l;
                //char -= base - off;
                marker.char = char + (base - marker.off);
                marker.type = type;
                marker.off = base;
                marker.tl = 0;
                marker.line = line;
                return marker;
            }

            let NORMAL_PARSE = true;

            if (USE_CUSTOM_SYMBOLS) {

                let code = str.charCodeAt(off);
                let off2 = off;
                let map = this.symbol_map,
                    m;
                let i = 0;

                while (code == 32 && IWS)
                    (code = str.charCodeAt(++off2), off++);

                while ((m = map.get(code))) {
                    map = m;
                    off2 += 1;
                    code = str.charCodeAt(off2);
                }

                if (map.IS_SYM) {
                    NORMAL_PARSE = false;
                    base = off;
                    length = off2 - off;
                    //char += length;
                }
            }

            if (NORMAL_PARSE) {

                for (;;) {

                    base = off;

                    length = 1;

                    const code = str.charCodeAt(off);

                    if (code < 128) {

                        switch (jump_table[code]) {
                            case 0: //NUMBER
                                while (++off < l && (12 & number_and_identifier_table[str.charCodeAt(off)]));

                                if ((str[off] == "e" || str[off] == "E") && (12 & number_and_identifier_table[str.charCodeAt(off + 1)])) {
                                    off++;
                                    if (str[off] == "-") off++;
                                    marker.off = off;
                                    marker.tl = 0;
                                    marker.next();
                                    off = marker.off + marker.tl;
                                    //Add e to the number string
                                }

                                type = number;
                                length = off - base;

                                break;
                            case 1: //IDENTIFIER
                                while (++off < l && ((10 & number_and_identifier_table[str.charCodeAt(off)])));
                                type = identifier;
                                length = off - base;
                                break;
                            case 2: //QUOTED STRING
                                if (this.PARSE_STRING) {
                                    type = symbol;
                                } else {
                                    while (++off < l && str.charCodeAt(off) !== code);
                                    type = string;
                                    length = off - base + 1;
                                }
                                break;
                            case 3: //SPACE SET
                                while (++off < l && str.charCodeAt(off) === SPACE);
                                type = white_space;
                                length = off - base;
                                break;
                            case 4: //TAB SET
                                while (++off < l && str[off] === HORIZONTAL_TAB);
                                type = white_space;
                                length = off - base;
                                break;
                            case 5: //CARIAGE RETURN
                                length = 2;
                                //intentional
                            case 6: //LINEFEED
                                type = new_line;
                                line++;
                                base = off;
                                root = off;
                                off += length;
                                char = 0;
                                break;
                            case 7: //SYMBOL
                                type = symbol;
                                break;
                            case 8: //OPERATOR
                                type = operator;
                                break;
                            case 9: //OPEN BRACKET
                                type = open_bracket;
                                break;
                            case 10: //CLOSE BRACKET
                                type = close_bracket;
                                break;
                            case 11: //Data Link Escape
                                type = data_link;
                                length = 4; //Stores two UTF16 values and a data link sentinel
                                break;
                        }
                    } else {
                        break;
                    }

                    if (IWS && (type & white_space_new_line)) {
                        if (off < l) {
                            type = symbol;
                            //off += length;
                            continue;
                        } else {
                            //Trim white space from end of string
                            //base = l - off;
                            //marker.sl -= off;
                            //length = 0;
                        }
                    }
                    break;
                }
            }

            marker.type = type;
            marker.off = base;
            marker.tl = (this.masked_values & CHARACTERS_ONLY_MASK) ? Math.min(1, length) : length;
            marker.char = char + base - root;
            marker.line = line;

            return marker;
        }


        /**
         * Proxy for Lexer.prototype.assert
         * @public
         */
        a(text) {
            return this.assert(text);
        }

        /**
         * Compares the string value of the current token to the value passed in. Advances to next token if the two are equal.
         * @public
         * @throws {Error} - `Expecting "${text}" got "${this.text}"`
         * @param {String} text - The string to compare.
         */
        assert(text) {

            if (this.off < 0) this.throw(`Expecting ${text} got null`);

            if (this.text == text)
                this.next();
            else
                this.throw(`Expecting "${text}" got "${this.text}"`);

            return this;
        }

        /**
         * Proxy for Lexer.prototype.assertCharacter
         * @public
         */
        aC(char) { return this.assertCharacter(char) }
        /**
         * Compares the character value of the current token to the value passed in. Advances to next token if the two are equal.
         * @public
         * @throws {Error} - `Expecting "${text}" got "${this.text}"`
         * @param {String} text - The string to compare.
         */
        assertCharacter(char) {

            if (this.off < 0) this.throw(`Expecting ${char[0]} got null`);

            if (this.ch == char[0])
                this.next();
            else
                this.throw(`Expecting "${char[0]}" got "${this.tx[this.off]}"`);

            return this;
        }

        /**
         * Returns the Lexer bound to Lexer.prototype.p, or creates and binds a new Lexer to Lexer.prototype.p. Advences the other Lexer to the token ahead of the calling Lexer.
         * @public
         * @type {Lexer}
         * @param {Lexer} [marker=this] - The marker to originate the peek from. 
         * @param {Lexer} [peek_marker=this.p] - The Lexer to set to the next token state.
         * @return {Lexer} - The Lexer that contains the peeked at token.
         */
        peek(marker = this, peek_marker = this.p) {

            if (!peek_marker) {
                if (!marker) return null;
                if (!this.p) {
                    this.p = new Lexer(this.str, false, true);
                    peek_marker = this.p;
                }
            }
            peek_marker.masked_values = marker.masked_values;
            peek_marker.type = marker.type;
            peek_marker.off = marker.off;
            peek_marker.tl = marker.tl;
            peek_marker.char = marker.char;
            peek_marker.line = marker.line;
            this.next(peek_marker);
            return peek_marker;
        }


        /**
         * Proxy for Lexer.prototype.slice
         * @public
         */
        s(start) { return this.slice(start) }

        /**
         * Returns a slice of the parsed string beginning at `start` and ending at the current token.
         * @param {Number | LexerBeta} start - The offset in this.str to begin the slice. If this value is a LexerBeta, sets the start point to the value of start.off.
         * @return {String} A substring of the parsed string.
         * @public
         */
        slice(start = this.off) {

            if (start instanceof Lexer) start = start.off;

            return this.str.slice(start, (this.off <= start) ? this.sl : this.off);
        }

        /**
         * Skips to the end of a comment section.
         * @param {boolean} ASSERT - If set to true, will through an error if there is not a comment line or block to skip.
         * @param {Lexer} [marker=this] - If another Lexer is passed into this method, it will advance the token state of that Lexer.
         */
        comment(ASSERT = false, marker = this) {

            if (!(marker instanceof Lexer)) return marker;

            if (marker.ch == "/") {
                if (marker.pk.ch == "*") {
                    marker.sync();
                    while (!marker.END && (marker.next().ch != "*" || marker.pk.ch != "/")) { /* NO OP */ }
                    marker.sync().assert("/");
                } else if (marker.pk.ch == "/") {
                    const IWS = marker.IWS;
                    while (marker.next().ty != Types.new_line && !marker.END) { /* NO OP */ }
                    marker.IWS = IWS;
                    marker.next();
                } else
                if (ASSERT) marker.throw("Expecting the start of a comment");
            }

            return marker;
        }

        setString(string, RESET = true) {
            this.str = string;
            this.sl = string.length;
            if (RESET) this.resetHead();
        }

        toString() {
            return this.slice();
        }

        /**
         * Returns new Whind Lexer that has leading and trailing whitespace characters removed from input. 
         * leave_leading_amount - Maximum amount of leading space caracters to leave behind. Default is zero
         * leave_trailing_amount - Maximum amount of trailing space caracters to leave behind. Default is zero
         */
        trim(leave_leading_amount = 0, leave_trailing_amount = leave_leading_amount) {
            const lex = this.copy();

            let space_count = 0,
                off = lex.off;

            for (; lex.off < lex.sl; lex.off++) {
                const c = jump_table[lex.string.charCodeAt(lex.off)];

                if (c > 2 && c < 7) {

                    if (space_count >= leave_leading_amount) {
                        off++;
                    } else {
                        space_count++;
                    }
                    continue;
                }

                break;
            }

            lex.off = off;
            space_count = 0;
            off = lex.sl;

            for (; lex.sl > lex.off; lex.sl--) {
                const c = jump_table[lex.string.charCodeAt(lex.sl - 1)];

                if (c > 2 && c < 7) {
                    if (space_count >= leave_trailing_amount) {
                        off--;
                    } else {
                        space_count++;
                    }
                    continue;
                }

                break;
            }

            lex.sl = off;

            if (leave_leading_amount > 0)
                lex.IWS = false;

            lex.token_length = 0;

            lex.next();

            return lex;
        }

        /** Adds symbol to symbol_map. This allows custom symbols to be defined and tokenized by parser. **/
        addSymbol(sym) {
            if (!this.symbol_map)
                this.symbol_map = new Map;


            let map = this.symbol_map;

            for (let i = 0; i < sym.length; i++) {
                let code = sym.charCodeAt(i);
                let m = map.get(code);
                if (!m) {
                    m = map.set(code, new Map).get(code);
                }
                map = m;
            }
            map.IS_SYM = true;
        }

        /*** Getters and Setters ***/
        get string() {
            return this.str;
        }

        get string_length() {
            return this.sl - this.off;
        }

        set string_length(s) {}

        /**
         * The current token in the form of a new Lexer with the current state.
         * Proxy property for Lexer.prototype.copy
         * @type {Lexer}
         * @public
         * @readonly
         */
        get token() {
            return this.copy();
        }


        get ch() {
            return this.str[this.off];
        }

        /**
         * Proxy for Lexer.prototype.text
         * @public
         * @type {String}
         * @readonly
         */
        get tx() { return this.text }

        /**
         * The string value of the current token.
         * @type {String}
         * @public
         * @readonly
         */
        get text() {
            return (this.off < 0) ? "" : this.str.slice(this.off, this.off + this.tl);
        }

        /**
         * The type id of the current token.
         * @type {Number}
         * @public
         * @readonly
         */
        get ty() { return this.type }

        /**
         * The current token's offset position from the start of the string.
         * @type {Number}
         * @public
         * @readonly
         */
        get pos() {
            return this.off;
        }

        /**
         * Proxy for Lexer.prototype.peek
         * @public
         * @readonly
         * @type {Lexer}
         */
        get pk() { return this.peek() }

        /**
         * Proxy for Lexer.prototype.next
         * @public
         */
        get n() { return this.next() }

        get END() { return this.off >= this.sl }
        set END(v) {}

        get type() {
            return 1 << (this.masked_values & TYPE_MASK);
        }

        set type(value) {
            //assuming power of 2 value.
            this.masked_values = (this.masked_values & ~TYPE_MASK) | ((getNumbrOfTrailingZeroBitsFromPowerOf2(value)) & TYPE_MASK);
        }

        get tl() {
            return this.token_length;
        }

        set tl(value) {
            this.token_length = value;
        }

        get token_length() {
            return ((this.masked_values & TOKEN_LENGTH_MASK) >> 7);
        }

        set token_length(value) {
            this.masked_values = (this.masked_values & ~TOKEN_LENGTH_MASK) | (((value << 7) | 0) & TOKEN_LENGTH_MASK);
        }

        get IGNORE_WHITE_SPACE() {
            return this.IWS;
        }

        set IGNORE_WHITE_SPACE(bool) {
            this.iws = !!bool;
        }

        get CHARACTERS_ONLY() {
            return !!(this.masked_values & CHARACTERS_ONLY_MASK);
        }

        set CHARACTERS_ONLY(boolean) {
            this.masked_values = (this.masked_values & ~CHARACTERS_ONLY_MASK) | ((boolean | 0) << 6);
        }

        get IWS() {
            return !!(this.masked_values & IGNORE_WHITESPACE_MASK);
        }

        set IWS(boolean) {
            this.masked_values = (this.masked_values & ~IGNORE_WHITESPACE_MASK) | ((boolean | 0) << 5);
        }

        get PARSE_STRING() {
            return !!(this.masked_values & PARSE_STRING_MASK);
        }

        set PARSE_STRING(boolean) {
            this.masked_values = (this.masked_values & ~PARSE_STRING_MASK) | ((boolean | 0) << 4);
        }

        /**
         * Reference to token id types.
         */
        get types() {
            return Types;
        }
    }

    Lexer.prototype.addCharacter = Lexer.prototype.addSymbol;

    function whind(string, INCLUDE_WHITE_SPACE_TOKENS = false) { return new Lexer(string, INCLUDE_WHITE_SPACE_TOKENS) }

    whind.constructor = Lexer;

    Lexer.types = Types;
    whind.types = Types;

    let fn = {}; const 
    /************** Maps **************/

        /* Symbols To Inject into the Lexer */
        symbols = ["((","))"],

        /* Goto lookup maps */
        gt0 = [0,-1,2,1,4,3,-1,5,-3,6,7,9,8],
    gt1 = [0,-3,4,20,-1,5,-3,6,7,9,8],
    gt2 = [0,-10,21,7,9,8],
    gt3 = [0,-13,22],
    gt4 = [0,-7,25,24,23,-1,26,9,8],
    gt5 = [0,-11,28,9,8],
    gt6 = [0,-5,29],
    gt7 = [0,-7,25,24,31,-1,26,9,8],

        // State action lookup maps
        sm0=[0,1,-1,2,-1,3,4,5,6,7,8,-3,9,-3,10,-3,11],
    sm1=[0,12,-3,0,-4,0],
    sm2=[0,13,-1,2,-1,3,4,5,6,7,8,-3,9,-3,10,-3,11],
    sm3=[0,14,-1,14,-1,14,14,14,14,14,14,-3,14,-3,14,-3,14],
    sm4=[0,15,-1,2,-1,3,4,5,6,7,8,-3,9,-3,15,-3,11],
    sm5=[0,15,-1,15,-1,15,15,15,15,15,15,-3,15,-3,15,-3,15],
    sm6=[0,16,-1,16,-1,16,16,16,16,16,16,-3,16,-3,16,-3,16],
    sm7=[0,17,-1,17,-1,17,17,17,17,17,17,-3,17,-3,17,-3,17],
    sm8=[0,18,-1,18,-1,18,18,18,18,18,18,-3,18,-2,18,18,18,-2,18],
    sm9=[0,19,-1,19,-1,19,19,19,19,19,19,-3,19,-2,19,19,19,-2,19],
    sm10=[0,-2,2,-1,0,4,5,6,7,0,-3,9],
    sm11=[0,20,-1,2,-1,3,4,5,6,7,8,-3,9,-3,20,20,-2,11],
    sm12=[0,21,-1,21,-1,21,21,21,21,21,21,-3,21,-3,21,-3,21],
    sm13=[0,22,-1,22,-1,22,22,22,22,22,22,-3,22,-3,22,-3,22],
    sm14=[0,23,-1,23,-1,23,23,23,23,23,23,-3,23,-2,23,23,23,-2,23],
    sm15=[0,24,-1,24,-1,24,24,24,24,24,24,-3,24,-3,24,25,-2,24],
    sm16=[0,26,-1,26,-1,26,26,26,26,26,26,-3,26,-2,26,26,26,-2,26],
    sm17=[0,27,-1,2,-1,3,4,5,6,7,8,-3,9,-2,27,27,27,-2,11],
    sm18=[0,28,-1,28,-1,28,28,28,28,28,28,-3,28,-2,28,28,28,-2,28],
    sm19=[0,29,-1,29,-1,29,29,29,29,29,29,-3,29,-1,30,-1,29,-3,29],
    sm20=[0,31,-1,31,-1,31,31,31,31,31,31,-3,31,-2,31,31,31,-2,31],
    sm21=[0,32,-1,32,-1,32,32,32,32,32,32,-3,32,-3,32,-3,32],
    sm22=[0,-2,2,-1,3,4,5,6,7,8,-3,9,-2,33,-4,11],
    sm23=[0,-4,0,-4,0,-6,34],
    sm24=[0,35,-1,35,-1,35,35,35,35,35,35,-3,35,-3,35,-3,35],
    sm25=[0,36,-1,36,-1,36,36,36,36,36,36,-3,36,-3,36,-3,36],

        // Symbol Lookup map
        lu = new Map([[1,1],[2,2],[4,3],[8,4],[16,5],[32,6],[64,7],[128,8],[256,9],[512,10],[3,11],[264,12],[200,13],[201,14],["[",15],["]",16],["((",17],["))",18],[null,5],["\\",21]]),

        //Reverse Symbol Lookup map
        rlu = new Map([[1,1],[2,2],[3,4],[4,8],[5,16],[6,32],[7,64],[8,128],[9,256],[10,512],[11,3],[12,264],[13,200],[14,201],[15,"["],[16,"]"],[17,"(("],[18,"))"],[5,null],[21,"\\"]]),

        // States 
        state = [sm0,
    sm1,
    sm2,
    sm3,
    sm4,
    sm5,
    sm6,
    sm7,
    sm8,
    sm8,
    sm8,
    sm8,
    sm9,
    sm9,
    sm9,
    sm9,
    sm9,
    sm9,
    sm10,
    sm11,
    sm12,
    sm13,
    sm14,
    sm15,
    sm16,
    sm17,
    sm18,
    sm19,
    sm20,
    sm21,
    sm22,
    sm23,
    sm24,
    sm25],

    /************ Functions *************/

        max = Math.max, min = Math.min,

        //Error Functions
        e$1 = (tk,r,o,l,p)=>{if(l.END)l.throw("Unexpected end of input");else if(l.ty & (264)) l.throw(`Unexpected space character within input "${p.slice(l)}" `) ; else l.throw(`Unexpected token [${l.tx}]`);}, 
        eh = [e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1],

        //Empty Function
        nf = ()=>-1, 

        //Environment Functions
        
    redv = (ret, fn, plen, ln, t, e, o, l, s) => {        ln = max(o.length - plen, 0);        const slice = o.slice(-plen);        o.length = ln + 1;        o[ln] = fn(slice, e, l, s, o, plen);        return ret;    },
    rednv = (ret, Fn, plen, ln, t, e, o, l, s) => {        ln = max(o.length - plen, 0);        const slice = o.slice(-plen);        o.length = ln + 1;        o[ln] = new Fn(slice, e, l, s, o, plen);        return ret;    },
    redn = (ret, plen, t, e, o) => {        if (plen > 0) {            let ln = max(o.length - plen, 0);            o[ln] = o[o.length - 1];            o.length = ln + 1;        }        return ret;    },
    shftf = (ret, fn, t, e, o, l, s) => (fn(o, e, l, s), ret),
    R10_item_list=sym=>(((sym[1] !== null) ? sym[0].push(sym[1]) : null,sym[0])),
    R11_item_list=sym=>(sym[0] !== null) ? [sym[0]] : [],
    R30_string_data_list=sym=>sym[0] + sym[1],
    R31_string_data_list=sym=>sym[0] + "",
    R50_undefined521_group=sym=>sym[1],
    R51_undefined521_group=()=>$sym2,
    C60_data_insert_point=function (sym){this.type = "REDUCE";this.value = sym[1];this.meta = sym[3];},
    C61_data_insert_point=function (sym){this.type = "REDUCE";this.value = sym[1];this.meta = null;},

        //Sparse Map Lookup
        lsm = (index, map) => {    if (map[0] == 0xFFFFFFFF) return map[index + 1];    for (let i = 1, ind = 0, l = map.length, n = 0; i < l && ind <= index; i++) {        if (ind !== index) {            if ((n = map[i]) > -1) ind++;            else ind += -n;        } else return map[i];    }    return -1;},

        //State Action Functions
        state_funct = [(...v)=>(redn(2051,0,...v)),
    e=>50,
    e=>42,
    e=>70,
    e=>66,
    e=>62,
    e=>58,
    e=>46,
    e=>54,
    e=>78,
    e=>74,
    (...v)=>redn(5,1,...v),
    (...v)=>redn(2055,1,...v),
    (...v)=>redv(1031,R11_item_list,1,0,...v),
    (...v)=>redn(4103,1,...v),
    (...v)=>redv(3079,R31_string_data_list,1,0,...v),
    (...v)=>redn(10247,1,...v),
    (...v)=>redn(11271,1,...v),
    (...v)=>redn(13319,1,...v),
    (...v)=>(redn(8195,0,...v)),
    (...v)=>redv(1035,R10_item_list,2,0,...v),
    (...v)=>redv(3083,R30_string_data_list,2,0,...v),
    (...v)=>redv(12299,R50_undefined521_group,2,0,...v),
    (...v)=>redv(6155,R30_string_data_list,2,0,...v),
    e=>110,
    (...v)=>redn(9223,1,...v),
    (...v)=>redn(8199,1,...v),
    (...v)=>redv(7175,R31_string_data_list,1,0,...v),
    (...v)=>rednv(6159,C61_data_insert_point,3,0,...v),
    e=>122,
    (...v)=>redv(7179,R30_string_data_list,2,0,...v),
    (...v)=>rednv(6163,C60_data_insert_point,4,0,...v),
    e=>130,
    e=>134,
    (...v)=>redv(5131,R51_undefined521_group,2,0,...v),
    (...v)=>redv(5135,R50_undefined521_group,3,0,...v)],

        //Goto Lookup Functions
        goto = [v=>lsm(v,gt0),
    nf,
    v=>lsm(v,gt1),
    nf,
    v=>lsm(v,gt2),
    nf,
    nf,
    nf,
    nf,
    nf,
    nf,
    nf,
    nf,
    nf,
    nf,
    nf,
    nf,
    nf,
    v=>lsm(v,gt3),
    v=>lsm(v,gt4),
    nf,
    nf,
    nf,
    nf,
    nf,
    v=>lsm(v,gt5),
    nf,
    v=>lsm(v,gt6),
    nf,
    nf,
    v=>lsm(v,gt7),
    nf,
    nf,
    nf];

    function getToken(l, SYM_LU) {
        if (l.END) return 0; /*$eof*/

        switch (l.ty) {
            case 2:
                //*
                if (SYM_LU.has(l.tx)) return 14;
                /*/
                    console.log(l.tx, SYM_LU.has(l.tx), SYM_LU.get(l.tx))
                    if (SYM_LU.has(l.tx)) return SYM_LU.get(l.tx);
                //*/
                return 2;
            case 1:
                return 1;
            case 4:
                return 3;
            case 256:
                return 9;
            case 8:
                return 4;
            case 512:
                return 10;
            default:
                return SYM_LU.get(l.tx) || SYM_LU.get(l.ty);
        }
    }

    /************ Parser *************/

    function parser(l, e = {}) {

        fn = e.functions;

        l.IWS = false;
        l.PARSE_STRING = true;

        if (symbols.length > 0) {
            symbols.forEach(s => { l.addSymbol(s); });
            l.tl = 0;
            l.next();
        }

        const o = [],
            ss = [0, 0];

        let time = 1000000,
            RECOVERING = 100,
            RESTARTED = true,
            tk = getToken(l, lu),
            p = l.copy(),
            sp = 1,
            len = 0,
            reduceStack = (e.reduceStack = []),
            ROOT = 10000,
            off = 0;

        outer:

            while (time-- > 0) {

                const fn = lsm(tk, state[ss[sp]]) || 0;

                let r,
                    gt = -1;

                if (fn == 0) {
                    /*Ignore the token*/
                    tk = getToken(l.next(), lu);
                    continue;
                }

                if (fn > 0) {
                    r = state_funct[fn - 1](tk, e, o, l, ss[sp - 1]);
                } else {

                    if (tk == 14) {
                        tk = lu.get(l.tx);
                        continue;
                    }

                    if (l.ty == 8 && l.tl > 1) {
                        // Make sure that special tokens are not getting in the way
                        l.tl = 0;
                        // This will skip the generation of a custom symbol
                        l.next(l, false);

                        if (l.tl == 1)
                            continue;
                    }

                    if (RECOVERING > 1 && !l.END) {

                        if (tk !== lu.get(l.ty)) {
                            tk = lu.get(l.ty);
                            continue;
                        }

                        if (tk !== 13) {
                            tk = 13;
                            RECOVERING = 1;
                            continue;
                        }
                    }

                    tk = getToken(l, lu);

                    const recovery_token = eh[ss[sp]](tk, e, o, l, p, ss[sp], (lex) => getToken(lex, lu));

                    if (RECOVERING > 0 && recovery_token >= 0) {
                        RECOVERING = -1; /* To prevent infinite recursion */
                        tk = recovery_token;
                        l.tl = 0; /*reset current token */
                        continue;
                    }
                }

                switch (r & 3) {
                    case 0:
                        /* ERROR */

                        if (tk == "$eof")
                            l.throw("Unexpected end of input");

                        l.throw(`Unexpected token [${RECOVERING ? l.next().tx : l.tx}]`);
                        return [null];

                    case 1:
                        /* ACCEPT */
                        break outer;

                    case 2:

                        /*SHIFT */
                        o.push(l.tx);
                        ss.push(off, r >> 2);
                        sp += 2;
                        l.next();
                        off = l.off;
                        tk = getToken(l, lu);
                        RECOVERING++;
                        break;

                    case 3:
                        /* REDUCE */
                        RESTARTED = true;

                        len = (r & 0x3FC) >> 1;

                        ss.length -= len;
                        sp -= len;
                        gt = goto[ss[sp]](r >> 10);

                        if (gt < 0)
                            l.throw("Invalid state reached!");

                        if (reduceStack.length > 0) {
                            let i = reduceStack.length - 1;
                            while (i > -1) {
                                const item = reduceStack[i--];

                                if (item.index == sp) {
                                    item.action(output);
                                } else if (item.index > sp) {
                                    reduceStack.length--;
                                } else {
                                    break;
                                }
                            }
                        }

                        ss.push(off, gt);
                        sp += 2;
                        break;
                }
            }
        return o[0];
    };

    var Module = (function() {
      var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
      return (
    function(Module) {
      Module = Module || {};

    // Copyright 2010 The Emscripten Authors.  All rights reserved.
    // Emscripten is available under two separate licenses, the MIT license and the
    // University of Illinois/NCSA Open Source License.  Both these licenses can be
    // found in the LICENSE file.

    // The Module object: Our interface to the outside world. We import
    // and export values on it. There are various ways Module can be used:
    // 1. Not defined. We create it here
    // 2. A function parameter, function(Module) { ..generated code.. }
    // 3. pre-run appended it, var Module = {}; ..generated code..
    // 4. External script tag defines var Module.
    // We need to check if Module already exists (e.g. case 3 above).
    // Substitution will be replaced with actual code on later stage of the build,
    // this way Closure Compiler will not mangle it (e.g. case 4. above).
    // Note that if you want to run closure, and also to use Module
    // after the generated code, you will need to define   var Module = {};
    // before the code. Then that object will be used in the code, and you
    // can continue to use Module afterwards as well.
    var Module = typeof Module !== 'undefined' ? Module : {};

    // --pre-jses are emitted after the Module integration code, so that they can
    // refer to Module (if they choose; they can also define Module)
    // {{PRE_JSES}}

    // Sometimes an existing Module object exists with properties
    // meant to overwrite the default module functionality. Here
    // we collect those properties and reapply _after_ we configure
    // the current environment's defaults to avoid having to be so
    // defensive during initialization.
    var moduleOverrides = {};
    var key;
    for (key in Module) {
      if (Module.hasOwnProperty(key)) {
        moduleOverrides[key] = Module[key];
      }
    }

    Module['arguments'] = [];
    Module['thisProgram'] = './this.program';
    Module['quit'] = function(status, toThrow) {
      throw toThrow;
    };
    Module['preRun'] = [];
    Module['postRun'] = [];

    // Determine the runtime environment we are in. You can customize this by
    // setting the ENVIRONMENT setting at compile time (see settings.js).

    var ENVIRONMENT_IS_WEB = false;
    var ENVIRONMENT_IS_WORKER = false;
    var ENVIRONMENT_IS_NODE = false;
    var ENVIRONMENT_HAS_NODE = false;
    var ENVIRONMENT_IS_SHELL = false;
    ENVIRONMENT_IS_WEB = typeof window === 'object';
    ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
    // A web environment like Electron.js can have Node enabled, so we must
    // distinguish between Node-enabled environments and Node environments per se.
    // This will allow the former to do things like mount NODEFS.
    // Extended check using process.versions fixes issue #8816.
    // (Also makes redundant the original check that 'require' is a function.)
    ENVIRONMENT_HAS_NODE = typeof process === 'object' && typeof process.versions === 'object' && typeof process.versions.node === 'string';
    ENVIRONMENT_IS_NODE = ENVIRONMENT_HAS_NODE && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
    ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

    if (Module['ENVIRONMENT']) {
      throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -s ENVIRONMENT=web or -s ENVIRONMENT=node)');
    }


    // Three configurations we can be running in:
    // 1) We could be the application main() thread running in the main JS UI thread. (ENVIRONMENT_IS_WORKER == false and ENVIRONMENT_IS_PTHREAD == false)
    // 2) We could be the application main() thread proxied to worker. (with Emscripten -s PROXY_TO_WORKER=1) (ENVIRONMENT_IS_WORKER == true, ENVIRONMENT_IS_PTHREAD == false)
    // 3) We could be an application pthread running in a worker. (ENVIRONMENT_IS_WORKER == true and ENVIRONMENT_IS_PTHREAD == true)




    // `/` should be present at the end if `scriptDirectory` is not empty
    var scriptDirectory = '';
    function locateFile(path) {
      if (Module['locateFile']) {
        return Module['locateFile'](path, scriptDirectory);
      } else {
        return scriptDirectory + path;
      }
    }

    // Hooks that are implemented differently in different runtime environments.
    var read_,
        readAsync,
        readBinary,
        setWindowTitle;

    if (ENVIRONMENT_IS_NODE) {
      scriptDirectory = __dirname + '/';

      // Expose functionality in the same simple way that the shells work
      // Note that we pollute the global namespace here, otherwise we break in node
      var nodeFS;
      var nodePath;

      read_ = function shell_read(filename, binary) {
        var ret;
          if (!nodeFS) nodeFS = require('fs');
          if (!nodePath) nodePath = require('path');
          filename = nodePath['normalize'](filename);
          ret = nodeFS['readFileSync'](filename);
        return binary ? ret : ret.toString();
      };

      readBinary = function readBinary(filename) {
        var ret = read_(filename, true);
        if (!ret.buffer) {
          ret = new Uint8Array(ret);
        }
        assert(ret.buffer);
        return ret;
      };

      if (process['argv'].length > 1) {
        Module['thisProgram'] = process['argv'][1].replace(/\\/g, '/');
      }

      Module['arguments'] = process['argv'].slice(2);

      // MODULARIZE will export the module in the proper place outside, we don't need to export here

      process['on']('uncaughtException', function(ex) {
        // suppress ExitStatus exceptions from showing an error
        if (!(ex instanceof ExitStatus)) {
          throw ex;
        }
      });
      // Currently node will swallow unhandled rejections, but this behavior is
      // deprecated, and in the future it will exit with error status.
      process['on']('unhandledRejection', abort);

      Module['quit'] = function(status) {
        process['exit'](status);
      };

      Module['inspect'] = function () { return '[Emscripten Module object]'; };
    } else
    if (ENVIRONMENT_IS_SHELL) {


      if (typeof read != 'undefined') {
        read_ = function shell_read(f) {
          return read(f);
        };
      }

      readBinary = function readBinary(f) {
        var data;
        if (typeof readbuffer === 'function') {
          return new Uint8Array(readbuffer(f));
        }
        data = read(f, 'binary');
        assert(typeof data === 'object');
        return data;
      };

      if (typeof scriptArgs != 'undefined') {
        Module['arguments'] = scriptArgs;
      } else if (typeof arguments != 'undefined') {
        Module['arguments'] = arguments;
      }

      if (typeof quit === 'function') {
        Module['quit'] = function(status) {
          quit(status);
        };
      }
    } else
    if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
      if (ENVIRONMENT_IS_WORKER) { // Check worker, not web, since window could be polyfilled
        scriptDirectory = self.location.href;
      } else if (document.currentScript) { // web
        scriptDirectory = document.currentScript.src;
      }
      // When MODULARIZE (and not _INSTANCE), this JS may be executed later, after document.currentScript
      // is gone, so we saved it, and we use it here instead of any other info.
      if (_scriptDir) {
        scriptDirectory = _scriptDir;
      }
      // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
      // otherwise, slice off the final part of the url to find the script directory.
      // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
      // and scriptDirectory will correctly be replaced with an empty string.
      if (scriptDirectory.indexOf('blob:') !== 0) {
        scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf('/')+1);
      } else {
        scriptDirectory = '';
      }


      read_ = function shell_read(url) {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, false);
          xhr.send(null);
          return xhr.responseText;
      };

      if (ENVIRONMENT_IS_WORKER) {
        readBinary = function readBinary(url) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            xhr.responseType = 'arraybuffer';
            xhr.send(null);
            return new Uint8Array(xhr.response);
        };
      }

      readAsync = function readAsync(url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
            return;
          }
          onerror();
        };
        xhr.onerror = onerror;
        xhr.send(null);
      };

      setWindowTitle = function(title) { document.title = title; };
    } else
    {
      throw new Error('environment detection error');
    }

    // Set up the out() and err() hooks, which are how we can print to stdout or
    // stderr, respectively.
    // If the user provided Module.print or printErr, use that. Otherwise,
    // console.log is checked first, as 'print' on the web will open a print dialogue
    // printErr is preferable to console.warn (works better in shells)
    // bind(console) is necessary to fix IE/Edge closed dev tools panel behavior.
    var out = Module['print'] || (typeof console !== 'undefined' ? console.log.bind(console) : (typeof print !== 'undefined' ? print : null));
    var err = Module['printErr'] || (typeof printErr !== 'undefined' ? printErr : ((typeof console !== 'undefined' && console.warn.bind(console)) || out));

    // Merge back in the overrides
    for (key in moduleOverrides) {
      if (moduleOverrides.hasOwnProperty(key)) {
        Module[key] = moduleOverrides[key];
      }
    }
    // Free the object hierarchy contained in the overrides, this lets the GC
    // reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
    moduleOverrides = undefined;

    // perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
    // Assertions on removed incoming Module JS APIs.
    assert(typeof Module['memoryInitializerPrefixURL'] === 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
    assert(typeof Module['pthreadMainPrefixURL'] === 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
    assert(typeof Module['cdInitializerPrefixURL'] === 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
    assert(typeof Module['filePackagePrefixURL'] === 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
    assert(typeof Module['read'] === 'undefined', 'Module.read option was removed (modify read_ in JS)');
    assert(typeof Module['readAsync'] === 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
    assert(typeof Module['readBinary'] === 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
    assert(typeof Module['setWindowTitle'] === 'undefined', 'Module.setWindowTitle option was removed (modify setWindowTitle in JS)');
    // Assertions on removed outgoing Module JS APIs.
    Object.defineProperty(Module, 'read', { get: function() { abort('Module.read has been replaced with plain read'); } });
    Object.defineProperty(Module, 'readAsync', { get: function() { abort('Module.readAsync has been replaced with plain readAsync'); } });
    Object.defineProperty(Module, 'readBinary', { get: function() { abort('Module.readBinary has been replaced with plain readBinary'); } });
    // TODO enable when SDL2 is fixed Object.defineProperty(Module, 'setWindowTitle', { get: function() { abort('Module.setWindowTitle has been replaced with plain setWindowTitle') } });


    // TODO remove when SDL2 is fixed; also add the above assertion



    // Copyright 2017 The Emscripten Authors.  All rights reserved.
    // Emscripten is available under two separate licenses, the MIT license and the
    // University of Illinois/NCSA Open Source License.  Both these licenses can be
    // found in the LICENSE file.

    // {{PREAMBLE_ADDITIONS}}

    var STACK_ALIGN = 16;

    // stack management, and other functionality that is provided by the compiled code,
    // should not be used before it is ready
    stackSave = stackRestore = stackAlloc = function() {
      abort('cannot use the stack before compiled code is ready to run, and has provided stack access');
    };

    function staticAlloc(size) {
      abort('staticAlloc is no longer available at runtime; instead, perform static allocations at compile time (using makeStaticAlloc)');
    }

    function dynamicAlloc(size) {
      assert(DYNAMICTOP_PTR);
      var ret = HEAP32[DYNAMICTOP_PTR>>2];
      var end = (ret + size + 15) & -16;
      if (end > _emscripten_get_heap_size()) {
        abort('failure to dynamicAlloc - memory growth etc. is not supported there, call malloc/sbrk directly');
      }
      HEAP32[DYNAMICTOP_PTR>>2] = end;
      return ret;
    }

    function alignMemory(size, factor) {
      if (!factor) factor = STACK_ALIGN; // stack alignment (16-byte) by default
      return Math.ceil(size / factor) * factor;
    }

    function getNativeTypeSize(type) {
      switch (type) {
        case 'i1': case 'i8': return 1;
        case 'i16': return 2;
        case 'i32': return 4;
        case 'i64': return 8;
        case 'float': return 4;
        case 'double': return 8;
        default: {
          if (type[type.length-1] === '*') {
            return 4; // A pointer
          } else if (type[0] === 'i') {
            var bits = parseInt(type.substr(1));
            assert(bits % 8 === 0, 'getNativeTypeSize invalid bits ' + bits + ', type ' + type);
            return bits / 8;
          } else {
            return 0;
          }
        }
      }
    }

    function warnOnce(text) {
      if (!warnOnce.shown) warnOnce.shown = {};
      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text);
      }
    }

    var asm2wasmImports = { // special asm2wasm imports
        "f64-rem": function(x, y) {
            return x % y;
        },
        "debugger": function() {
            debugger;
        }
    };



    var jsCallStartIndex = 1;
    var functionPointers = new Array(0);

    // Wraps a JS function as a wasm function with a given signature.
    // In the future, we may get a WebAssembly.Function constructor. Until then,
    // we create a wasm module that takes the JS function as an import with a given
    // signature, and re-exports that as a wasm function.
    function convertJsFunctionToWasm(func, sig) {

      // The module is static, with the exception of the type section, which is
      // generated based on the signature passed in.
      var typeSection = [
        0x01, // id: section,
        0x00, // length: 0 (placeholder)
        0x01, // count: 1
        0x60, // form: func
      ];
      var sigRet = sig.slice(0, 1);
      var sigParam = sig.slice(1);
      var typeCodes = {
        'i': 0x7f, // i32
        'j': 0x7e, // i64
        'f': 0x7d, // f32
        'd': 0x7c, // f64
      };

      // Parameters, length + signatures
      typeSection.push(sigParam.length);
      for (var i = 0; i < sigParam.length; ++i) {
        typeSection.push(typeCodes[sigParam[i]]);
      }

      // Return values, length + signatures
      // With no multi-return in MVP, either 0 (void) or 1 (anything else)
      if (sigRet == 'v') {
        typeSection.push(0x00);
      } else {
        typeSection = typeSection.concat([0x01, typeCodes[sigRet]]);
      }

      // Write the overall length of the type section back into the section header
      // (excepting the 2 bytes for the section id and length)
      typeSection[1] = typeSection.length - 2;

      // Rest of the module is static
      var bytes = new Uint8Array([
        0x00, 0x61, 0x73, 0x6d, // magic ("\0asm")
        0x01, 0x00, 0x00, 0x00, // version: 1
      ].concat(typeSection, [
        0x02, 0x07, // import section
          // (import "e" "f" (func 0 (type 0)))
          0x01, 0x01, 0x65, 0x01, 0x66, 0x00, 0x00,
        0x07, 0x05, // export section
          // (export "f" (func 0 (type 0)))
          0x01, 0x01, 0x66, 0x00, 0x00,
      ]));

       // We can compile this wasm module synchronously because it is very small.
      // This accepts an import (at "e.f"), that it reroutes to an export (at "f")
      var module = new WebAssembly.Module(bytes);
      var instance = new WebAssembly.Instance(module, {
        e: {
          f: func
        }
      });
      var wrappedFunc = instance.exports.f;
      return wrappedFunc;
    }

    // Add a wasm function to the table.
    function addFunctionWasm(func, sig) {
      var table = wasmTable;
      var ret = table.length;

      // Grow the table
      try {
        table.grow(1);
      } catch (err) {
        if (!err instanceof RangeError) {
          throw err;
        }
        throw 'Unable to grow wasm table. Use a higher value for RESERVED_FUNCTION_POINTERS or set ALLOW_TABLE_GROWTH.';
      }

      // Insert new element
      try {
        // Attempting to call this with JS function will cause of table.set() to fail
        table.set(ret, func);
      } catch (err) {
        if (!err instanceof TypeError) {
          throw err;
        }
        assert(typeof sig !== 'undefined', 'Missing signature argument to addFunction');
        var wrapped = convertJsFunctionToWasm(func, sig);
        table.set(ret, wrapped);
      }

      return ret;
    }

    function removeFunctionWasm(index) {
      // TODO(sbc): Look into implementing this to allow re-using of table slots
    }

    // 'sig' parameter is required for the llvm backend but only when func is not
    // already a WebAssembly function.
    function addFunction(func, sig) {


      var base = 0;
      for (var i = base; i < base + 0; i++) {
        if (!functionPointers[i]) {
          functionPointers[i] = func;
          return jsCallStartIndex + i;
        }
      }
      throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';

    }

    function removeFunction(index) {

      functionPointers[index-jsCallStartIndex] = null;
    }

    var funcWrappers = {};

    function getFuncWrapper(func, sig) {
      if (!func) return; // on null pointer, return undefined
      assert(sig);
      if (!funcWrappers[sig]) {
        funcWrappers[sig] = {};
      }
      var sigCache = funcWrappers[sig];
      if (!sigCache[func]) {
        // optimize away arguments usage in common cases
        if (sig.length === 1) {
          sigCache[func] = function dynCall_wrapper() {
            return dynCall(sig, func);
          };
        } else if (sig.length === 2) {
          sigCache[func] = function dynCall_wrapper(arg) {
            return dynCall(sig, func, [arg]);
          };
        } else {
          // general case
          sigCache[func] = function dynCall_wrapper() {
            return dynCall(sig, func, Array.prototype.slice.call(arguments));
          };
        }
      }
      return sigCache[func];
    }


    function makeBigInt(low, high, unsigned) {
      return unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0));
    }

    function dynCall(sig, ptr, args) {
      if (args && args.length) {
        assert(args.length == sig.length-1);
        assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
        return Module['dynCall_' + sig].apply(null, [ptr].concat(args));
      } else {
        assert(sig.length == 1);
        assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
        return Module['dynCall_' + sig].call(null, ptr);
      }
    }

    var tempRet0 = 0;

    var setTempRet0 = function(value) {
      tempRet0 = value;
    };

    var getTempRet0 = function() {
      return tempRet0;
    };

    function getCompilerSetting(name) {
      throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for getCompilerSetting or emscripten_get_compiler_setting to work';
    }

    var Runtime = {
      // helpful errors
      getTempRet0: function() { abort('getTempRet0() is now a top-level function, after removing the Runtime object. Remove "Runtime."'); },
      staticAlloc: function() { abort('staticAlloc() is now a top-level function, after removing the Runtime object. Remove "Runtime."'); },
      stackAlloc: function() { abort('stackAlloc() is now a top-level function, after removing the Runtime object. Remove "Runtime."'); },
    };

    // The address globals begin at. Very low in memory, for code size and optimization opportunities.
    // Above 0 is static memory, starting with globals.
    // Then the stack.
    // Then 'dynamic' memory for sbrk.
    var GLOBAL_BASE = 1024;




    // === Preamble library stuff ===

    // Documentation for the public APIs defined in this file must be updated in:
    //    site/source/docs/api_reference/preamble.js.rst
    // A prebuilt local version of the documentation is available at:
    //    site/build/text/docs/api_reference/preamble.js.txt
    // You can also build docs locally as HTML or other formats in site/
    // An online HTML version (which may be of a different version of Emscripten)
    //    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html



    if (typeof WebAssembly !== 'object') {
      abort('No WebAssembly support found. Build with -s WASM=0 to target JavaScript instead.');
    }


    // In MINIMAL_RUNTIME, setValue() and getValue() are only available when building with safe heap enabled, for heap safety checking.
    // In traditional runtime, setValue() and getValue() are always available (although their use is highly discouraged due to perf penalties)

    /** @type {function(number, number, string, boolean=)} */
    function setValue(ptr, value, type, noSafe) {
      type = type || 'i8';
      if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
        switch(type) {
          case 'i1': HEAP8[((ptr)>>0)]=value; break;
          case 'i8': HEAP8[((ptr)>>0)]=value; break;
          case 'i16': HEAP16[((ptr)>>1)]=value; break;
          case 'i32': HEAP32[((ptr)>>2)]=value; break;
          case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
          case 'float': HEAPF32[((ptr)>>2)]=value; break;
          case 'double': HEAPF64[((ptr)>>3)]=value; break;
          default: abort('invalid type for setValue: ' + type);
        }
    }

    /** @type {function(number, string, boolean=)} */
    function getValue(ptr, type, noSafe) {
      type = type || 'i8';
      if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
        switch(type) {
          case 'i1': return HEAP8[((ptr)>>0)];
          case 'i8': return HEAP8[((ptr)>>0)];
          case 'i16': return HEAP16[((ptr)>>1)];
          case 'i32': return HEAP32[((ptr)>>2)];
          case 'i64': return HEAP32[((ptr)>>2)];
          case 'float': return HEAPF32[((ptr)>>2)];
          case 'double': return HEAPF64[((ptr)>>3)];
          default: abort('invalid type for getValue: ' + type);
        }
      return null;
    }





    // Wasm globals

    var wasmMemory;

    // Potentially used for direct table calls.
    var wasmTable;


    //========================================
    // Runtime essentials
    //========================================

    // whether we are quitting the application. no code should run after this.
    // set in exit() and abort()
    var ABORT = false;

    // set by exit() and abort().  Passed to 'onExit' handler.
    // NOTE: This is also used as the process return code code in shell environments
    // but only when noExitRuntime is false.
    var EXITSTATUS = 0;

    /** @type {function(*, string=)} */
    function assert(condition, text) {
      if (!condition) {
        abort('Assertion failed: ' + text);
      }
    }

    // Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
    function getCFunc(ident) {
      var func = Module['_' + ident]; // closure exported function
      assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
      return func;
    }

    // C calling interface.
    function ccall(ident, returnType, argTypes, args, opts) {
      // For fast lookup of conversion functions
      var toC = {
        'string': function(str) {
          var ret = 0;
          if (str !== null && str !== undefined && str !== 0) { // null string
            // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
            var len = (str.length << 2) + 1;
            ret = stackAlloc(len);
            stringToUTF8(str, ret, len);
          }
          return ret;
        },
        'array': function(arr) {
          var ret = stackAlloc(arr.length);
          writeArrayToMemory(arr, ret);
          return ret;
        }
      };

      function convertReturnValue(ret) {
        if (returnType === 'string') return UTF8ToString(ret);
        if (returnType === 'boolean') return Boolean(ret);
        return ret;
      }

      var func = getCFunc(ident);
      var cArgs = [];
      var stack = 0;
      assert(returnType !== 'array', 'Return type should not be "array".');
      if (args) {
        for (var i = 0; i < args.length; i++) {
          var converter = toC[argTypes[i]];
          if (converter) {
            if (stack === 0) stack = stackSave();
            cArgs[i] = converter(args[i]);
          } else {
            cArgs[i] = args[i];
          }
        }
      }
      var ret = func.apply(null, cArgs);
      ret = convertReturnValue(ret);
      if (stack !== 0) stackRestore(stack);
      return ret;
    }

    function cwrap(ident, returnType, argTypes, opts) {
      return function() {
        return ccall(ident, returnType, argTypes, arguments, opts);
      }
    }

    var ALLOC_NORMAL = 0; // Tries to use _malloc()
    var ALLOC_STACK = 1; // Lives for the duration of the current function call
    var ALLOC_DYNAMIC = 2; // Cannot be freed except through sbrk
    var ALLOC_NONE = 3; // Do not allocate

    // allocate(): This is for internal use. You can use it yourself as well, but the interface
    //             is a little tricky (see docs right below). The reason is that it is optimized
    //             for multiple syntaxes to save space in generated code. So you should
    //             normally not use allocate(), and instead allocate memory using _malloc(),
    //             initialize it with setValue(), and so forth.
    // @slab: An array of data, or a number. If a number, then the size of the block to allocate,
    //        in *bytes* (note that this is sometimes confusing: the next parameter does not
    //        affect this!)
    // @types: Either an array of types, one for each byte (or 0 if no type at that position),
    //         or a single type which is used for the entire block. This only matters if there
    //         is initial data - if @slab is a number, then this does not matter at all and is
    //         ignored.
    // @allocator: How to allocate memory, see ALLOC_*
    /** @type {function((TypedArray|Array<number>|number), string, number, number=)} */
    function allocate(slab, types, allocator, ptr) {
      var zeroinit, size;
      if (typeof slab === 'number') {
        zeroinit = true;
        size = slab;
      } else {
        zeroinit = false;
        size = slab.length;
      }

      var singleType = typeof types === 'string' ? types : null;

      var ret;
      if (allocator == ALLOC_NONE) {
        ret = ptr;
      } else {
        ret = [_malloc,
        stackAlloc,
        dynamicAlloc][allocator](Math.max(size, singleType ? 1 : types.length));
      }

      if (zeroinit) {
        var stop;
        ptr = ret;
        assert((ret & 3) == 0);
        stop = ret + (size & ~3);
        for (; ptr < stop; ptr += 4) {
          HEAP32[((ptr)>>2)]=0;
        }
        stop = ret + size;
        while (ptr < stop) {
          HEAP8[((ptr++)>>0)]=0;
        }
        return ret;
      }

      if (singleType === 'i8') {
        if (slab.subarray || slab.slice) {
          HEAPU8.set(/** @type {!Uint8Array} */ (slab), ret);
        } else {
          HEAPU8.set(new Uint8Array(slab), ret);
        }
        return ret;
      }

      var i = 0, type, typeSize, previousType;
      while (i < size) {
        var curr = slab[i];

        type = singleType || types[i];
        if (type === 0) {
          i++;
          continue;
        }
        assert(type, 'Must know what type to store in allocate!');

        if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

        setValue(ret+i, curr, type);

        // no need to look up size unless type changes, so cache it
        if (previousType !== type) {
          typeSize = getNativeTypeSize(type);
          previousType = type;
        }
        i += typeSize;
      }

      return ret;
    }

    // Allocate memory during any stage of startup - static memory early on, dynamic memory later, malloc when ready
    function getMemory(size) {
      if (!runtimeInitialized) return dynamicAlloc(size);
      return _malloc(size);
    }




    /** @type {function(number, number=)} */
    function Pointer_stringify(ptr, length) {
      abort("this function has been removed - you should use UTF8ToString(ptr, maxBytesToRead) instead!");
    }

    // Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
    // a copy of that string as a Javascript String object.

    function AsciiToString(ptr) {
      var str = '';
      while (1) {
        var ch = HEAPU8[((ptr++)>>0)];
        if (!ch) return str;
        str += String.fromCharCode(ch);
      }
    }

    // Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
    // null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

    function stringToAscii(str, outPtr) {
      return writeAsciiToMemory(str, outPtr, false);
    }


    // Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
    // a copy of that string as a Javascript String object.

    var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;

    /**
     * @param {number} idx
     * @param {number=} maxBytesToRead
     * @return {string}
     */
    function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
      var endIdx = idx + maxBytesToRead;
      var endPtr = idx;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
      // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
      // (As a tiny code save trick, compare endPtr against endIdx using a negation, so that undefined means Infinity)
      while (u8Array[endPtr] && !(endPtr >= endIdx)) ++endPtr;

      if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
        return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
      } else {
        var str = '';
        // If building with TextDecoder, we have already computed the string length above, so test loop end condition against that
        while (idx < endPtr) {
          // For UTF8 byte structure, see:
          // http://en.wikipedia.org/wiki/UTF-8#Description
          // https://www.ietf.org/rfc/rfc2279.txt
          // https://tools.ietf.org/html/rfc3629
          var u0 = u8Array[idx++];
          if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
          var u1 = u8Array[idx++] & 63;
          if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
          var u2 = u8Array[idx++] & 63;
          if ((u0 & 0xF0) == 0xE0) {
            u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
          } else {
            if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte 0x' + u0.toString(16) + ' encountered when deserializing a UTF-8 string on the asm.js/wasm heap to a JS string!');
            u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (u8Array[idx++] & 63);
          }

          if (u0 < 0x10000) {
            str += String.fromCharCode(u0);
          } else {
            var ch = u0 - 0x10000;
            str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
          }
        }
      }
      return str;
    }

    // Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns a
    // copy of that string as a Javascript String object.
    // maxBytesToRead: an optional length that specifies the maximum number of bytes to read. You can omit
    //                 this parameter to scan the string until the first \0 byte. If maxBytesToRead is
    //                 passed, and the string at [ptr, ptr+maxBytesToReadr[ contains a null byte in the
    //                 middle, then the string will cut short at that byte index (i.e. maxBytesToRead will
    //                 not produce a string of exact length [ptr, ptr+maxBytesToRead[)
    //                 N.B. mixing frequent uses of UTF8ToString() with and without maxBytesToRead may
    //                 throw JS JIT optimizations off, so it is worth to consider consistently using one
    //                 style or the other.
    /**
     * @param {number} ptr
     * @param {number=} maxBytesToRead
     * @return {string}
     */
    function UTF8ToString(ptr, maxBytesToRead) {
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
    }

    // Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
    // encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
    // Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
    // Parameters:
    //   str: the Javascript string to copy.
    //   outU8Array: the array to copy to. Each index in this array is assumed to be one 8-byte element.
    //   outIdx: The starting offset in the array to begin the copying.
    //   maxBytesToWrite: The maximum number of bytes this function can write to the array.
    //                    This count should include the null terminator,
    //                    i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
    //                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
    // Returns the number of bytes written, EXCLUDING the null terminator.

    function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
      if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
        return 0;

      var startIdx = outIdx;
      var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
        var u = str.charCodeAt(i); // possibly a lead surrogate
        if (u >= 0xD800 && u <= 0xDFFF) {
          var u1 = str.charCodeAt(++i);
          u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
        }
        if (u <= 0x7F) {
          if (outIdx >= endIdx) break;
          outU8Array[outIdx++] = u;
        } else if (u <= 0x7FF) {
          if (outIdx + 1 >= endIdx) break;
          outU8Array[outIdx++] = 0xC0 | (u >> 6);
          outU8Array[outIdx++] = 0x80 | (u & 63);
        } else if (u <= 0xFFFF) {
          if (outIdx + 2 >= endIdx) break;
          outU8Array[outIdx++] = 0xE0 | (u >> 12);
          outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
          outU8Array[outIdx++] = 0x80 | (u & 63);
        } else {
          if (outIdx + 3 >= endIdx) break;
          if (u >= 0x200000) warnOnce('Invalid Unicode code point 0x' + u.toString(16) + ' encountered when serializing a JS string to an UTF-8 string on the asm.js/wasm heap! (Valid unicode code points should be in range 0-0x1FFFFF).');
          outU8Array[outIdx++] = 0xF0 | (u >> 18);
          outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
          outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
          outU8Array[outIdx++] = 0x80 | (u & 63);
        }
      }
      // Null-terminate the pointer to the buffer.
      outU8Array[outIdx] = 0;
      return outIdx - startIdx;
    }

    // Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
    // null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
    // Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
    // Returns the number of bytes written, EXCLUDING the null terminator.

    function stringToUTF8(str, outPtr, maxBytesToWrite) {
      assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
      return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
    }

    // Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.
    function lengthBytesUTF8(str) {
      var len = 0;
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var u = str.charCodeAt(i); // possibly a lead surrogate
        if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
        if (u <= 0x7F) ++len;
        else if (u <= 0x7FF) len += 2;
        else if (u <= 0xFFFF) len += 3;
        else len += 4;
      }
      return len;
    }


    // Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
    // a copy of that string as a Javascript String object.

    var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;
    function UTF16ToString(ptr) {
      assert(ptr % 2 == 0, 'Pointer passed to UTF16ToString must be aligned to two bytes!');
      var endPtr = ptr;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
      // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
      var idx = endPtr >> 1;
      while (HEAP16[idx]) ++idx;
      endPtr = idx << 1;

      if (endPtr - ptr > 32 && UTF16Decoder) {
        return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
      } else {
        var i = 0;

        var str = '';
        while (1) {
          var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
          if (codeUnit == 0) return str;
          ++i;
          // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
          str += String.fromCharCode(codeUnit);
        }
      }
    }

    // Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
    // null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
    // Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
    // Parameters:
    //   str: the Javascript string to copy.
    //   outPtr: Byte address in Emscripten HEAP where to write the string to.
    //   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
    //                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
    //                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
    // Returns the number of bytes written, EXCLUDING the null terminator.

    function stringToUTF16(str, outPtr, maxBytesToWrite) {
      assert(outPtr % 2 == 0, 'Pointer passed to stringToUTF16 must be aligned to two bytes!');
      assert(typeof maxBytesToWrite == 'number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
      // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
      if (maxBytesToWrite === undefined) {
        maxBytesToWrite = 0x7FFFFFFF;
      }
      if (maxBytesToWrite < 2) return 0;
      maxBytesToWrite -= 2; // Null terminator.
      var startPtr = outPtr;
      var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
      for (var i = 0; i < numCharsToWrite; ++i) {
        // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
        var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
        HEAP16[((outPtr)>>1)]=codeUnit;
        outPtr += 2;
      }
      // Null-terminate the pointer to the HEAP.
      HEAP16[((outPtr)>>1)]=0;
      return outPtr - startPtr;
    }

    // Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

    function lengthBytesUTF16(str) {
      return str.length*2;
    }

    function UTF32ToString(ptr) {
      assert(ptr % 4 == 0, 'Pointer passed to UTF32ToString must be aligned to four bytes!');
      var i = 0;

      var str = '';
      while (1) {
        var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
        if (utf32 == 0)
          return str;
        ++i;
        // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        if (utf32 >= 0x10000) {
          var ch = utf32 - 0x10000;
          str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
        } else {
          str += String.fromCharCode(utf32);
        }
      }
    }

    // Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
    // null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
    // Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
    // Parameters:
    //   str: the Javascript string to copy.
    //   outPtr: Byte address in Emscripten HEAP where to write the string to.
    //   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
    //                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
    //                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
    // Returns the number of bytes written, EXCLUDING the null terminator.

    function stringToUTF32(str, outPtr, maxBytesToWrite) {
      assert(outPtr % 4 == 0, 'Pointer passed to stringToUTF32 must be aligned to four bytes!');
      assert(typeof maxBytesToWrite == 'number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
      // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
      if (maxBytesToWrite === undefined) {
        maxBytesToWrite = 0x7FFFFFFF;
      }
      if (maxBytesToWrite < 4) return 0;
      var startPtr = outPtr;
      var endPtr = startPtr + maxBytesToWrite - 4;
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
        if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
          var trailSurrogate = str.charCodeAt(++i);
          codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
        }
        HEAP32[((outPtr)>>2)]=codeUnit;
        outPtr += 4;
        if (outPtr + 4 > endPtr) break;
      }
      // Null-terminate the pointer to the HEAP.
      HEAP32[((outPtr)>>2)]=0;
      return outPtr - startPtr;
    }

    // Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

    function lengthBytesUTF32(str) {
      var len = 0;
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var codeUnit = str.charCodeAt(i);
        if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
        len += 4;
      }

      return len;
    }

    // Allocate heap space for a JS string, and write it there.
    // It is the responsibility of the caller to free() that memory.
    function allocateUTF8(str) {
      var size = lengthBytesUTF8(str) + 1;
      var ret = _malloc(size);
      if (ret) stringToUTF8Array(str, HEAP8, ret, size);
      return ret;
    }

    // Allocate stack space for a JS string, and write it there.
    function allocateUTF8OnStack(str) {
      var size = lengthBytesUTF8(str) + 1;
      var ret = stackAlloc(size);
      stringToUTF8Array(str, HEAP8, ret, size);
      return ret;
    }

    // Deprecated: This function should not be called because it is unsafe and does not provide
    // a maximum length limit of how many bytes it is allowed to write. Prefer calling the
    // function stringToUTF8Array() instead, which takes in a maximum length that can be used
    // to be secure from out of bounds writes.
    /** @deprecated */
    function writeStringToMemory(string, buffer, dontAddNull) {
      warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');

      var /** @type {number} */ lastChar, /** @type {number} */ end;
      if (dontAddNull) {
        // stringToUTF8Array always appends null. If we don't want to do that, remember the
        // character that existed at the location where the null will be placed, and restore
        // that after the write (below).
        end = buffer + lengthBytesUTF8(string);
        lastChar = HEAP8[end];
      }
      stringToUTF8(string, buffer, Infinity);
      if (dontAddNull) HEAP8[end] = lastChar; // Restore the value under the null character.
    }

    function writeArrayToMemory(array, buffer) {
      assert(array.length >= 0, 'writeArrayToMemory array must have a length (should be an array or typed array)');
      HEAP8.set(array, buffer);
    }

    function writeAsciiToMemory(str, buffer, dontAddNull) {
      for (var i = 0; i < str.length; ++i) {
        assert(str.charCodeAt(i) === str.charCodeAt(i)&0xff);
        HEAP8[((buffer++)>>0)]=str.charCodeAt(i);
      }
      // Null-terminate the pointer to the HEAP.
      if (!dontAddNull) HEAP8[((buffer)>>0)]=0;
    }





    function demangle(func) {
      return func;
    }

    function demangleAll(text) {
      var regex =
        /__Z[\w\d_]+/g;
      return text.replace(regex,
        function(x) {
          var y = demangle(x);
          return x === y ? x : (y + ' [' + x + ']');
        });
    }

    function jsStackTrace() {
      var err = new Error();
      if (!err.stack) {
        // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
        // so try that as a special-case.
        try {
          throw new Error(0);
        } catch(e) {
          err = e;
        }
        if (!err.stack) {
          return '(no stack trace available)';
        }
      }
      return err.stack.toString();
    }

    function stackTrace() {
      var js = jsStackTrace();
      if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
      return demangleAll(js);
    }



    // Memory management

    var PAGE_SIZE = 16384;
    var WASM_PAGE_SIZE = 65536;
    var ASMJS_PAGE_SIZE = 16777216;

    function alignUp(x, multiple) {
      if (x % multiple > 0) {
        x += multiple - (x % multiple);
      }
      return x;
    }

    var HEAP,
    /** @type {ArrayBuffer} */
      buffer,
    /** @type {Int8Array} */
      HEAP8,
    /** @type {Uint8Array} */
      HEAPU8,
    /** @type {Int16Array} */
      HEAP16,
    /** @type {Uint16Array} */
      HEAPU16,
    /** @type {Int32Array} */
      HEAP32,
    /** @type {Uint32Array} */
      HEAPU32,
    /** @type {Float32Array} */
      HEAPF32,
    /** @type {Float64Array} */
      HEAPF64;

    function updateGlobalBufferViews() {
      Module['HEAP8'] = HEAP8 = new Int8Array(buffer);
      Module['HEAP16'] = HEAP16 = new Int16Array(buffer);
      Module['HEAP32'] = HEAP32 = new Int32Array(buffer);
      Module['HEAPU8'] = HEAPU8 = new Uint8Array(buffer);
      Module['HEAPU16'] = HEAPU16 = new Uint16Array(buffer);
      Module['HEAPU32'] = HEAPU32 = new Uint32Array(buffer);
      Module['HEAPF32'] = HEAPF32 = new Float32Array(buffer);
      Module['HEAPF64'] = HEAPF64 = new Float64Array(buffer);
    }


    var STATIC_BASE = 1024,
        STACK_BASE = 425024,
        STACKTOP = STACK_BASE,
        STACK_MAX = 5667904,
        DYNAMIC_BASE = 5667904,
        DYNAMICTOP_PTR = 424992;

    assert(STACK_BASE % 16 === 0, 'stack must start aligned');
    assert(DYNAMIC_BASE % 16 === 0, 'heap must start aligned');



    var TOTAL_STACK = 5242880;
    if (Module['TOTAL_STACK']) assert(TOTAL_STACK === Module['TOTAL_STACK'], 'the stack size can no longer be determined at runtime');

    var INITIAL_TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
    if (INITIAL_TOTAL_MEMORY < TOTAL_STACK) err('TOTAL_MEMORY should be larger than TOTAL_STACK, was ' + INITIAL_TOTAL_MEMORY + '! (TOTAL_STACK=' + TOTAL_STACK + ')');

    // Initialize the runtime's memory
    // check for full engine support (use string 'subarray' to avoid closure compiler confusion)
    assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray !== undefined && Int32Array.prototype.set !== undefined,
           'JS engine does not provide full typed array support');






      if (Module['wasmMemory']) {
        wasmMemory = Module['wasmMemory'];
      } else {
        wasmMemory = new WebAssembly.Memory({
          'initial': INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE
        });
      }


    if (wasmMemory) {
      buffer = wasmMemory.buffer;
    }

    // If the user provides an incorrect length, just use that length instead rather than providing the user to
    // specifically provide the memory length with Module['TOTAL_MEMORY'].
    INITIAL_TOTAL_MEMORY = buffer.byteLength;
    assert(INITIAL_TOTAL_MEMORY % WASM_PAGE_SIZE === 0);
    updateGlobalBufferViews();

    HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;


    // Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
    function writeStackCookie() {
      assert((STACK_MAX & 3) == 0);
      HEAPU32[(STACK_MAX >> 2)-1] = 0x02135467;
      HEAPU32[(STACK_MAX >> 2)-2] = 0x89BACDFE;
    }

    function checkStackCookie() {
      var cookie1 = HEAPU32[(STACK_MAX >> 2)-1];
      var cookie2 = HEAPU32[(STACK_MAX >> 2)-2];
      if (cookie1 != 0x02135467 || cookie2 != 0x89BACDFE) {
        abort('Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x02135467, but received 0x' + cookie2.toString(16) + ' ' + cookie1.toString(16));
      }
      // Also test the global address 0 for integrity.
      // We don't do this with ASan because ASan does its own checks for this.
      if (HEAP32[0] !== 0x63736d65 /* 'emsc' */) abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
    }

    function abortStackOverflow(allocSize) {
      abort('Stack overflow! Attempted to allocate ' + allocSize + ' bytes on the stack, but stack has only ' + (STACK_MAX - stackSave() + allocSize) + ' bytes available!');
    }


      HEAP32[0] = 0x63736d65; /* 'emsc' */



    // Endianness check (note: assumes compiler arch was little-endian)
    HEAP16[1] = 0x6373;
    if (HEAPU8[2] !== 0x73 || HEAPU8[3] !== 0x63) throw 'Runtime error: expected the system to be little-endian!';

    function callRuntimeCallbacks(callbacks) {
      while(callbacks.length > 0) {
        var callback = callbacks.shift();
        if (typeof callback == 'function') {
          callback();
          continue;
        }
        var func = callback.func;
        if (typeof func === 'number') {
          if (callback.arg === undefined) {
            Module['dynCall_v'](func);
          } else {
            Module['dynCall_vi'](func, callback.arg);
          }
        } else {
          func(callback.arg === undefined ? null : callback.arg);
        }
      }
    }

    var __ATPRERUN__  = []; // functions called before the runtime is initialized
    var __ATINIT__    = []; // functions called during startup
    var __ATMAIN__    = []; // functions called when main() is to be run
    var __ATEXIT__    = []; // functions called during shutdown
    var __ATPOSTRUN__ = []; // functions called after the main() is called

    var runtimeInitialized = false;
    var runtimeExited = false;


    function preRun() {
      // compatibility - merge in anything from Module['preRun'] at this time
      if (Module['preRun']) {
        if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
        while (Module['preRun'].length) {
          addOnPreRun(Module['preRun'].shift());
        }
      }
      callRuntimeCallbacks(__ATPRERUN__);
    }

    function initRuntime() {
      checkStackCookie();
      assert(!runtimeInitialized);
      runtimeInitialized = true;
      if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
    TTY.init();
      callRuntimeCallbacks(__ATINIT__);
    }

    function preMain() {
      checkStackCookie();
      FS.ignorePermissions = false;
      callRuntimeCallbacks(__ATMAIN__);
    }

    function exitRuntime() {
      checkStackCookie();
      runtimeExited = true;
    }

    function postRun() {
      checkStackCookie();
      // compatibility - merge in anything from Module['postRun'] at this time
      if (Module['postRun']) {
        if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
        while (Module['postRun'].length) {
          addOnPostRun(Module['postRun'].shift());
        }
      }
      callRuntimeCallbacks(__ATPOSTRUN__);
    }

    function addOnPreRun(cb) {
      __ATPRERUN__.unshift(cb);
    }

    function addOnInit(cb) {
      __ATINIT__.unshift(cb);
    }

    function addOnPreMain(cb) {
      __ATMAIN__.unshift(cb);
    }

    function addOnExit(cb) {
    }

    function addOnPostRun(cb) {
      __ATPOSTRUN__.unshift(cb);
    }

    function unSign(value, bits, ignore) {
      if (value >= 0) {
        return value;
      }
      return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                        : Math.pow(2, bits)         + value;
    }
    function reSign(value, bits, ignore) {
      if (value <= 0) {
        return value;
      }
      var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                            : Math.pow(2, bits-1);
      if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                           // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                           // TODO: In i64 mode 1, resign the two parts separately and safely
        value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
      }
      return value;
    }


    assert(Math.imul, 'This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
    assert(Math.fround, 'This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
    assert(Math.clz32, 'This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
    assert(Math.trunc, 'This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');

    var Math_abs = Math.abs;
    var Math_cos = Math.cos;
    var Math_sin = Math.sin;
    var Math_tan = Math.tan;
    var Math_acos = Math.acos;
    var Math_asin = Math.asin;
    var Math_atan = Math.atan;
    var Math_atan2 = Math.atan2;
    var Math_exp = Math.exp;
    var Math_log = Math.log;
    var Math_sqrt = Math.sqrt;
    var Math_ceil = Math.ceil;
    var Math_floor = Math.floor;
    var Math_pow = Math.pow;
    var Math_imul = Math.imul;
    var Math_fround = Math.fround;
    var Math_round = Math.round;
    var Math_min = Math.min;
    var Math_max = Math.max;
    var Math_clz32 = Math.clz32;
    var Math_trunc = Math.trunc;



    // A counter of dependencies for calling run(). If we need to
    // do asynchronous work before running, increment this and
    // decrement it. Incrementing must happen in a place like
    // Module.preRun (used by emcc to add file preloading).
    // Note that you can add dependencies in preRun, even though
    // it happens right before run - run will be postponed until
    // the dependencies are met.
    var runDependencies = 0;
    var runDependencyWatcher = null;
    var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
    var runDependencyTracking = {};

    function getUniqueRunDependency(id) {
      var orig = id;
      while (1) {
        if (!runDependencyTracking[id]) return id;
        id = orig + Math.random();
      }
      return id;
    }

    function addRunDependency(id) {
      runDependencies++;
      if (Module['monitorRunDependencies']) {
        Module['monitorRunDependencies'](runDependencies);
      }
      if (id) {
        assert(!runDependencyTracking[id]);
        runDependencyTracking[id] = 1;
        if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
          // Check for missing dependencies every few seconds
          runDependencyWatcher = setInterval(function() {
            if (ABORT) {
              clearInterval(runDependencyWatcher);
              runDependencyWatcher = null;
              return;
            }
            var shown = false;
            for (var dep in runDependencyTracking) {
              if (!shown) {
                shown = true;
                err('still waiting on run dependencies:');
              }
              err('dependency: ' + dep);
            }
            if (shown) {
              err('(end of list)');
            }
          }, 10000);
        }
      } else {
        err('warning: run dependency added without ID');
      }
    }

    function removeRunDependency(id) {
      runDependencies--;
      if (Module['monitorRunDependencies']) {
        Module['monitorRunDependencies'](runDependencies);
      }
      if (id) {
        assert(runDependencyTracking[id]);
        delete runDependencyTracking[id];
      } else {
        err('warning: run dependency removed without ID');
      }
      if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
        }
        if (dependenciesFulfilled) {
          var callback = dependenciesFulfilled;
          dependenciesFulfilled = null;
          callback(); // can add another dependenciesFulfilled
        }
      }
    }

    Module["preloadedImages"] = {}; // maps url to image data
    Module["preloadedAudios"] = {}; // maps url to audio data


    var memoryInitializer = null;






    // Copyright 2017 The Emscripten Authors.  All rights reserved.
    // Emscripten is available under two separate licenses, the MIT license and the
    // University of Illinois/NCSA Open Source License.  Both these licenses can be
    // found in the LICENSE file.

    // Prefix of data URIs emitted by SINGLE_FILE and related options.
    var dataURIPrefix = 'data:application/octet-stream;base64,';

    // Indicates whether filename is a base64 data URI.
    function isDataURI(filename) {
      return String.prototype.startsWith ?
          filename.startsWith(dataURIPrefix) :
          filename.indexOf(dataURIPrefix) === 0;
    }




    var wasmBinaryFile = 'crdt.asm.wasm';
    if (!isDataURI(wasmBinaryFile)) {
      wasmBinaryFile = locateFile(wasmBinaryFile);
    }

    function getBinary() {
      try {
        if (Module['wasmBinary']) {
          return new Uint8Array(Module['wasmBinary']);
        }
        if (readBinary) {
          return readBinary(wasmBinaryFile);
        } else {
          throw "both async and sync fetching of the wasm failed";
        }
      }
      catch (err) {
        abort(err);
      }
    }

    function getBinaryPromise() {
      // if we don't have the binary yet, and have the Fetch api, use that
      // in some environments, like Electron's render process, Fetch api may be present, but have a different context than expected, let's only use it on the Web
      if (!Module['wasmBinary'] && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === 'function') {
        return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function(response) {
          if (!response['ok']) {
            throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
          }
          return response['arrayBuffer']();
        }).catch(function () {
          return getBinary();
        });
      }
      // Otherwise, getBinary should be able to get it synchronously
      return new Promise(function(resolve, reject) {
        resolve(getBinary());
      });
    }



    // Create the wasm instance.
    // Receives the wasm imports, returns the exports.
    function createWasm(env) {

      // prepare imports
      var info = {
        'env': env
        ,
        'global': {
          'NaN': NaN,
          'Infinity': Infinity
        },
        'global.Math': Math,
        'asm2wasm': asm2wasmImports
      };
      // Load the wasm module and create an instance of using native support in the JS engine.
      // handle a generated wasm instance, receiving its exports and
      // performing other necessary setup
      function receiveInstance(instance, module) {
        var exports = instance.exports;
        Module['asm'] = exports;
        removeRunDependency('wasm-instantiate');
      }
      addRunDependency('wasm-instantiate');


      // Async compilation can be confusing when an error on the page overwrites Module
      // (for example, if the order of elements is wrong, and the one defining Module is
      // later), so we save Module and check it later.
      var trueModule = Module;
      function receiveInstantiatedSource(output) {
        // 'output' is a WebAssemblyInstantiatedSource object which has both the module and instance.
        // receiveInstance() will swap in the exports (to Module.asm) so they can be called
        assert(Module === trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
        trueModule = null;
          // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
          // When the regression is fixed, can restore the above USE_PTHREADS-enabled path.
        receiveInstance(output['instance']);
      }


      function instantiateArrayBuffer(receiver) {
        return getBinaryPromise().then(function(binary) {
          return WebAssembly.instantiate(binary, info);
        }).then(receiver, function(reason) {
          err('failed to asynchronously prepare wasm: ' + reason);
          abort(reason);
        });
      }

      // Prefer streaming instantiation if available.
      function instantiateAsync() {
        if (!Module['wasmBinary'] &&
            typeof WebAssembly.instantiateStreaming === 'function' &&
            !isDataURI(wasmBinaryFile) &&
            typeof fetch === 'function') {
          fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function (response) {
            return WebAssembly.instantiateStreaming(response, info)
              .then(receiveInstantiatedSource, function(reason) {
                // We expect the most common failure cause to be a bad MIME type for the binary,
                // in which case falling back to ArrayBuffer instantiation should work.
                err('wasm streaming compile failed: ' + reason);
                err('falling back to ArrayBuffer instantiation');
                instantiateArrayBuffer(receiveInstantiatedSource);
              });
          });
        } else {
          return instantiateArrayBuffer(receiveInstantiatedSource);
        }
      }
      // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
      // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
      // to any other async startup actions they are performing.
      if (Module['instantiateWasm']) {
        try {
          var exports = Module['instantiateWasm'](info, receiveInstance);
          return exports;
        } catch(e) {
          err('Module.instantiateWasm callback failed with error: ' + e);
          return false;
        }
      }

      instantiateAsync();
      return {}; // no exports yet; we'll fill them in later
    }

    // Provide an "asm.js function" for the application, called to "link" the asm.js module. We instantiate
    // the wasm module at that time, and it receives imports and provides exports and so forth, the app
    // doesn't need to care that it is wasm or asm.js.

    Module['asm'] = function(global, env, providedBuffer) {
      // memory was already allocated (so js could use the buffer)
      env['memory'] = wasmMemory
      ;
      // import table
      env['table'] = wasmTable = new WebAssembly.Table({
        'initial': 8033,
        'maximum': 8033,
        'element': 'anyfunc'
      });
      // With the wasm backend __memory_base and __table_base and only needed for
      // relocatable output.
      env['__memory_base'] = 1024; // tell the memory segments where to place themselves
      // table starts at 0 by default (even in dynamic linking, for the main module)
      env['__table_base'] = 0;

      var exports = createWasm(env);
      assert(exports, 'binaryen setup failed (no wasm support?)');
      return exports;
    };

    // Globals used by JS i64 conversions
    var tempDouble;
    var tempI64;

    // === Body ===

    var ASM_CONSTS = [];





    // STATICTOP = STATIC_BASE + 424000;
    /* global initializers */  __ATINIT__.push({ func: function() { globalCtors(); } });








    /* no memory initializer */
    var tempDoublePtr = 425008;
    assert(tempDoublePtr % 8 == 0);

    function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
      HEAP8[tempDoublePtr] = HEAP8[ptr];
      HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
      HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
      HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
    }

    function copyTempDouble(ptr) {
      HEAP8[tempDoublePtr] = HEAP8[ptr];
      HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
      HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
      HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
      HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
      HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
      HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
      HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
    }

    // {{PRE_LIBRARY}}


      function ___cxa_uncaught_exceptions() {
          return __ZSt18uncaught_exceptionv.uncaught_exceptions;
        }

      function ___gxx_personality_v0() {
        }

      function ___lock() {}

      
      function ___setErrNo(value) {
          if (Module['___errno_location']) HEAP32[((Module['___errno_location']())>>2)]=value;
          else err('failed to set errno from JS');
          return value;
        }function ___map_file(pathname, size) {
          ___setErrNo(1);
          return -1;
        }

      
      
      var PATH={splitPath:function(filename) {
            var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
            return splitPathRe.exec(filename).slice(1);
          },normalizeArray:function(parts, allowAboveRoot) {
            // if the path tries to go above the root, `up` ends up > 0
            var up = 0;
            for (var i = parts.length - 1; i >= 0; i--) {
              var last = parts[i];
              if (last === '.') {
                parts.splice(i, 1);
              } else if (last === '..') {
                parts.splice(i, 1);
                up++;
              } else if (up) {
                parts.splice(i, 1);
                up--;
              }
            }
            // if the path is allowed to go above the root, restore leading ..s
            if (allowAboveRoot) {
              for (; up; up--) {
                parts.unshift('..');
              }
            }
            return parts;
          },normalize:function(path) {
            var isAbsolute = path.charAt(0) === '/',
                trailingSlash = path.substr(-1) === '/';
            // Normalize the path
            path = PATH.normalizeArray(path.split('/').filter(function(p) {
              return !!p;
            }), !isAbsolute).join('/');
            if (!path && !isAbsolute) {
              path = '.';
            }
            if (path && trailingSlash) {
              path += '/';
            }
            return (isAbsolute ? '/' : '') + path;
          },dirname:function(path) {
            var result = PATH.splitPath(path),
                root = result[0],
                dir = result[1];
            if (!root && !dir) {
              // No dirname whatsoever
              return '.';
            }
            if (dir) {
              // It has a dirname, strip trailing slash
              dir = dir.substr(0, dir.length - 1);
            }
            return root + dir;
          },basename:function(path) {
            // EMSCRIPTEN return '/'' for '/', not an empty string
            if (path === '/') return '/';
            var lastSlash = path.lastIndexOf('/');
            if (lastSlash === -1) return path;
            return path.substr(lastSlash+1);
          },extname:function(path) {
            return PATH.splitPath(path)[3];
          },join:function() {
            var paths = Array.prototype.slice.call(arguments, 0);
            return PATH.normalize(paths.join('/'));
          },join2:function(l, r) {
            return PATH.normalize(l + '/' + r);
          }};
      
      
      var PATH_FS={resolve:function() {
            var resolvedPath = '',
              resolvedAbsolute = false;
            for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
              var path = (i >= 0) ? arguments[i] : FS.cwd();
              // Skip empty and invalid entries
              if (typeof path !== 'string') {
                throw new TypeError('Arguments to path.resolve must be strings');
              } else if (!path) {
                return ''; // an invalid portion invalidates the whole thing
              }
              resolvedPath = path + '/' + resolvedPath;
              resolvedAbsolute = path.charAt(0) === '/';
            }
            // At this point the path should be resolved to a full absolute path, but
            // handle relative paths to be safe (might happen when process.cwd() fails)
            resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
              return !!p;
            }), !resolvedAbsolute).join('/');
            return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
          },relative:function(from, to) {
            from = PATH_FS.resolve(from).substr(1);
            to = PATH_FS.resolve(to).substr(1);
            function trim(arr) {
              var start = 0;
              for (; start < arr.length; start++) {
                if (arr[start] !== '') break;
              }
              var end = arr.length - 1;
              for (; end >= 0; end--) {
                if (arr[end] !== '') break;
              }
              if (start > end) return [];
              return arr.slice(start, end - start + 1);
            }
            var fromParts = trim(from.split('/'));
            var toParts = trim(to.split('/'));
            var length = Math.min(fromParts.length, toParts.length);
            var samePartsLength = length;
            for (var i = 0; i < length; i++) {
              if (fromParts[i] !== toParts[i]) {
                samePartsLength = i;
                break;
              }
            }
            var outputParts = [];
            for (var i = samePartsLength; i < fromParts.length; i++) {
              outputParts.push('..');
            }
            outputParts = outputParts.concat(toParts.slice(samePartsLength));
            return outputParts.join('/');
          }};
      
      var TTY={ttys:[],init:function () {
            // https://github.com/emscripten-core/emscripten/pull/1555
            // if (ENVIRONMENT_IS_NODE) {
            //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
            //   // device, it always assumes it's a TTY device. because of this, we're forcing
            //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
            //   // with text files until FS.init can be refactored.
            //   process['stdin']['setEncoding']('utf8');
            // }
          },shutdown:function() {
            // https://github.com/emscripten-core/emscripten/pull/1555
            // if (ENVIRONMENT_IS_NODE) {
            //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
            //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
            //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
            //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
            //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
            //   process['stdin']['pause']();
            // }
          },register:function(dev, ops) {
            TTY.ttys[dev] = { input: [], output: [], ops: ops };
            FS.registerDevice(dev, TTY.stream_ops);
          },stream_ops:{open:function(stream) {
              var tty = TTY.ttys[stream.node.rdev];
              if (!tty) {
                throw new FS.ErrnoError(19);
              }
              stream.tty = tty;
              stream.seekable = false;
            },close:function(stream) {
              // flush any pending line data
              stream.tty.ops.flush(stream.tty);
            },flush:function(stream) {
              stream.tty.ops.flush(stream.tty);
            },read:function(stream, buffer, offset, length, pos /* ignored */) {
              if (!stream.tty || !stream.tty.ops.get_char) {
                throw new FS.ErrnoError(6);
              }
              var bytesRead = 0;
              for (var i = 0; i < length; i++) {
                var result;
                try {
                  result = stream.tty.ops.get_char(stream.tty);
                } catch (e) {
                  throw new FS.ErrnoError(5);
                }
                if (result === undefined && bytesRead === 0) {
                  throw new FS.ErrnoError(11);
                }
                if (result === null || result === undefined) break;
                bytesRead++;
                buffer[offset+i] = result;
              }
              if (bytesRead) {
                stream.node.timestamp = Date.now();
              }
              return bytesRead;
            },write:function(stream, buffer, offset, length, pos) {
              if (!stream.tty || !stream.tty.ops.put_char) {
                throw new FS.ErrnoError(6);
              }
              try {
                for (var i = 0; i < length; i++) {
                  stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
                }
              } catch (e) {
                throw new FS.ErrnoError(5);
              }
              if (length) {
                stream.node.timestamp = Date.now();
              }
              return i;
            }},default_tty_ops:{get_char:function(tty) {
              if (!tty.input.length) {
                var result = null;
                if (ENVIRONMENT_IS_NODE) {
                  // we will read data by chunks of BUFSIZE
                  var BUFSIZE = 256;
                  var buf = Buffer.alloc ? Buffer.alloc(BUFSIZE) : new Buffer(BUFSIZE);
                  var bytesRead = 0;
      
                  var isPosixPlatform = (process.platform != 'win32'); // Node doesn't offer a direct check, so test by exclusion
      
                  var fd = process.stdin.fd;
                  if (isPosixPlatform) {
                    // Linux and Mac cannot use process.stdin.fd (which isn't set up as sync)
                    var usingDevice = false;
                    try {
                      fd = fs.openSync('/dev/stdin', 'r');
                      usingDevice = true;
                    } catch (e) {}
                  }
      
                  try {
                    bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null);
                  } catch(e) {
                    // Cross-platform differences: on Windows, reading EOF throws an exception, but on other OSes,
                    // reading EOF returns 0. Uniformize behavior by treating the EOF exception to return 0.
                    if (e.toString().indexOf('EOF') != -1) bytesRead = 0;
                    else throw e;
                  }
      
                  if (usingDevice) { fs.closeSync(fd); }
                  if (bytesRead > 0) {
                    result = buf.slice(0, bytesRead).toString('utf-8');
                  } else {
                    result = null;
                  }
                } else
                if (typeof window != 'undefined' &&
                  typeof window.prompt == 'function') {
                  // Browser.
                  result = window.prompt('Input: ');  // returns null on cancel
                  if (result !== null) {
                    result += '\n';
                  }
                } else if (typeof readline == 'function') {
                  // Command line.
                  result = readline();
                  if (result !== null) {
                    result += '\n';
                  }
                }
                if (!result) {
                  return null;
                }
                tty.input = intArrayFromString(result, true);
              }
              return tty.input.shift();
            },put_char:function(tty, val) {
              if (val === null || val === 10) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = [];
              } else {
                if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
              }
            },flush:function(tty) {
              if (tty.output && tty.output.length > 0) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = [];
              }
            }},default_tty1_ops:{put_char:function(tty, val) {
              if (val === null || val === 10) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = [];
              } else {
                if (val != 0) tty.output.push(val);
              }
            },flush:function(tty) {
              if (tty.output && tty.output.length > 0) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = [];
              }
            }}};
      
      var MEMFS={ops_table:null,mount:function(mount) {
            return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
          },createNode:function(parent, name, mode, dev) {
            if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
              // no supported
              throw new FS.ErrnoError(1);
            }
            if (!MEMFS.ops_table) {
              MEMFS.ops_table = {
                dir: {
                  node: {
                    getattr: MEMFS.node_ops.getattr,
                    setattr: MEMFS.node_ops.setattr,
                    lookup: MEMFS.node_ops.lookup,
                    mknod: MEMFS.node_ops.mknod,
                    rename: MEMFS.node_ops.rename,
                    unlink: MEMFS.node_ops.unlink,
                    rmdir: MEMFS.node_ops.rmdir,
                    readdir: MEMFS.node_ops.readdir,
                    symlink: MEMFS.node_ops.symlink
                  },
                  stream: {
                    llseek: MEMFS.stream_ops.llseek
                  }
                },
                file: {
                  node: {
                    getattr: MEMFS.node_ops.getattr,
                    setattr: MEMFS.node_ops.setattr
                  },
                  stream: {
                    llseek: MEMFS.stream_ops.llseek,
                    read: MEMFS.stream_ops.read,
                    write: MEMFS.stream_ops.write,
                    allocate: MEMFS.stream_ops.allocate,
                    mmap: MEMFS.stream_ops.mmap,
                    msync: MEMFS.stream_ops.msync
                  }
                },
                link: {
                  node: {
                    getattr: MEMFS.node_ops.getattr,
                    setattr: MEMFS.node_ops.setattr,
                    readlink: MEMFS.node_ops.readlink
                  },
                  stream: {}
                },
                chrdev: {
                  node: {
                    getattr: MEMFS.node_ops.getattr,
                    setattr: MEMFS.node_ops.setattr
                  },
                  stream: FS.chrdev_stream_ops
                }
              };
            }
            var node = FS.createNode(parent, name, mode, dev);
            if (FS.isDir(node.mode)) {
              node.node_ops = MEMFS.ops_table.dir.node;
              node.stream_ops = MEMFS.ops_table.dir.stream;
              node.contents = {};
            } else if (FS.isFile(node.mode)) {
              node.node_ops = MEMFS.ops_table.file.node;
              node.stream_ops = MEMFS.ops_table.file.stream;
              node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.length which gives the whole capacity.
              // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
              // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
              // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
              node.contents = null; 
            } else if (FS.isLink(node.mode)) {
              node.node_ops = MEMFS.ops_table.link.node;
              node.stream_ops = MEMFS.ops_table.link.stream;
            } else if (FS.isChrdev(node.mode)) {
              node.node_ops = MEMFS.ops_table.chrdev.node;
              node.stream_ops = MEMFS.ops_table.chrdev.stream;
            }
            node.timestamp = Date.now();
            // add the new node to the parent
            if (parent) {
              parent.contents[name] = node;
            }
            return node;
          },getFileDataAsRegularArray:function(node) {
            if (node.contents && node.contents.subarray) {
              var arr = [];
              for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
              return arr; // Returns a copy of the original data.
            }
            return node.contents; // No-op, the file contents are already in a JS array. Return as-is.
          },getFileDataAsTypedArray:function(node) {
            if (!node.contents) return new Uint8Array;
            if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
            return new Uint8Array(node.contents);
          },expandFileStorage:function(node, newCapacity) {
            var prevCapacity = node.contents ? node.contents.length : 0;
            if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
            // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
            // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
            // avoid overshooting the allocation cap by a very large margin.
            var CAPACITY_DOUBLING_MAX = 1024 * 1024;
            newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) | 0);
            if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
            var oldContents = node.contents;
            node.contents = new Uint8Array(newCapacity); // Allocate new storage.
            if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
            return;
          },resizeFileStorage:function(node, newSize) {
            if (node.usedBytes == newSize) return;
            if (newSize == 0) {
              node.contents = null; // Fully decommit when requesting a resize to zero.
              node.usedBytes = 0;
              return;
            }
            if (!node.contents || node.contents.subarray) { // Resize a typed array if that is being used as the backing store.
              var oldContents = node.contents;
              node.contents = new Uint8Array(new ArrayBuffer(newSize)); // Allocate new storage.
              if (oldContents) {
                node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
              }
              node.usedBytes = newSize;
              return;
            }
            // Backing with a JS array.
            if (!node.contents) node.contents = [];
            if (node.contents.length > newSize) node.contents.length = newSize;
            else while (node.contents.length < newSize) node.contents.push(0);
            node.usedBytes = newSize;
          },node_ops:{getattr:function(node) {
              var attr = {};
              // device numbers reuse inode numbers.
              attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
              attr.ino = node.id;
              attr.mode = node.mode;
              attr.nlink = 1;
              attr.uid = 0;
              attr.gid = 0;
              attr.rdev = node.rdev;
              if (FS.isDir(node.mode)) {
                attr.size = 4096;
              } else if (FS.isFile(node.mode)) {
                attr.size = node.usedBytes;
              } else if (FS.isLink(node.mode)) {
                attr.size = node.link.length;
              } else {
                attr.size = 0;
              }
              attr.atime = new Date(node.timestamp);
              attr.mtime = new Date(node.timestamp);
              attr.ctime = new Date(node.timestamp);
              // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
              //       but this is not required by the standard.
              attr.blksize = 4096;
              attr.blocks = Math.ceil(attr.size / attr.blksize);
              return attr;
            },setattr:function(node, attr) {
              if (attr.mode !== undefined) {
                node.mode = attr.mode;
              }
              if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp;
              }
              if (attr.size !== undefined) {
                MEMFS.resizeFileStorage(node, attr.size);
              }
            },lookup:function(parent, name) {
              throw FS.genericErrors[2];
            },mknod:function(parent, name, mode, dev) {
              return MEMFS.createNode(parent, name, mode, dev);
            },rename:function(old_node, new_dir, new_name) {
              // if we're overwriting a directory at new_name, make sure it's empty.
              if (FS.isDir(old_node.mode)) {
                var new_node;
                try {
                  new_node = FS.lookupNode(new_dir, new_name);
                } catch (e) {
                }
                if (new_node) {
                  for (var i in new_node.contents) {
                    throw new FS.ErrnoError(39);
                  }
                }
              }
              // do the internal rewiring
              delete old_node.parent.contents[old_node.name];
              old_node.name = new_name;
              new_dir.contents[new_name] = old_node;
              old_node.parent = new_dir;
            },unlink:function(parent, name) {
              delete parent.contents[name];
            },rmdir:function(parent, name) {
              var node = FS.lookupNode(parent, name);
              for (var i in node.contents) {
                throw new FS.ErrnoError(39);
              }
              delete parent.contents[name];
            },readdir:function(node) {
              var entries = ['.', '..'];
              for (var key in node.contents) {
                if (!node.contents.hasOwnProperty(key)) {
                  continue;
                }
                entries.push(key);
              }
              return entries;
            },symlink:function(parent, newname, oldpath) {
              var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
              node.link = oldpath;
              return node;
            },readlink:function(node) {
              if (!FS.isLink(node.mode)) {
                throw new FS.ErrnoError(22);
              }
              return node.link;
            }},stream_ops:{read:function(stream, buffer, offset, length, position) {
              var contents = stream.node.contents;
              if (position >= stream.node.usedBytes) return 0;
              var size = Math.min(stream.node.usedBytes - position, length);
              assert(size >= 0);
              if (size > 8 && contents.subarray) { // non-trivial, and typed array
                buffer.set(contents.subarray(position, position + size), offset);
              } else {
                for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
              }
              return size;
            },write:function(stream, buffer, offset, length, position, canOwn) {
              // If memory can grow, we don't want to hold on to references of
              // the memory Buffer, as they may get invalidated. That means
              // we need to do a copy here.
              // FIXME: this is inefficient as the file packager may have
              //        copied the data into memory already - we may want to
              //        integrate more there and let the file packager loading
              //        code be able to query if memory growth is on or off.
              if (canOwn) {
                warnOnce('file packager has copied file data into memory, but in memory growth we are forced to copy it again (see --no-heap-copy)');
              }
              canOwn = false;
      
              if (!length) return 0;
              var node = stream.node;
              node.timestamp = Date.now();
      
              if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
                if (canOwn) {
                  assert(position === 0, 'canOwn must imply no weird position inside the file');
                  node.contents = buffer.subarray(offset, offset + length);
                  node.usedBytes = length;
                  return length;
                } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
                  node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
                  node.usedBytes = length;
                  return length;
                } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
                  node.contents.set(buffer.subarray(offset, offset + length), position);
                  return length;
                }
              }
      
              // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
              MEMFS.expandFileStorage(node, position+length);
              if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position); // Use typed array write if available.
              else {
                for (var i = 0; i < length; i++) {
                 node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
                }
              }
              node.usedBytes = Math.max(node.usedBytes, position+length);
              return length;
            },llseek:function(stream, offset, whence) {
              var position = offset;
              if (whence === 1) {  // SEEK_CUR.
                position += stream.position;
              } else if (whence === 2) {  // SEEK_END.
                if (FS.isFile(stream.node.mode)) {
                  position += stream.node.usedBytes;
                }
              }
              if (position < 0) {
                throw new FS.ErrnoError(22);
              }
              return position;
            },allocate:function(stream, offset, length) {
              MEMFS.expandFileStorage(stream.node, offset + length);
              stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
            },mmap:function(stream, buffer, offset, length, position, prot, flags) {
              if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(19);
              }
              var ptr;
              var allocated;
              var contents = stream.node.contents;
              // Only make a new copy when MAP_PRIVATE is specified.
              if ( !(flags & 2) &&
                    (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
                // We can't emulate MAP_SHARED when the file is not backed by the buffer
                // we're mapping to (e.g. the HEAP buffer).
                allocated = false;
                ptr = contents.byteOffset;
              } else {
                // Try to avoid unnecessary slices.
                if (position > 0 || position + length < stream.node.usedBytes) {
                  if (contents.subarray) {
                    contents = contents.subarray(position, position + length);
                  } else {
                    contents = Array.prototype.slice.call(contents, position, position + length);
                  }
                }
                allocated = true;
                ptr = _malloc(length);
                if (!ptr) {
                  throw new FS.ErrnoError(12);
                }
                buffer.set(contents, ptr);
              }
              return { ptr: ptr, allocated: allocated };
            },msync:function(stream, buffer, offset, length, mmapFlags) {
              if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(19);
              }
              if (mmapFlags & 2) {
                // MAP_PRIVATE calls need not to be synced back to underlying fs
                return 0;
              }
      
              var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
              // should we check if bytesWritten and length are the same?
              return 0;
            }}};
      
      var IDBFS={dbs:{},indexedDB:function() {
            if (typeof indexedDB !== 'undefined') return indexedDB;
            var ret = null;
            if (typeof window === 'object') ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
            assert(ret, 'IDBFS used, but indexedDB not supported');
            return ret;
          },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function(mount) {
            // reuse all of the core MEMFS functionality
            return MEMFS.mount.apply(null, arguments);
          },syncfs:function(mount, populate, callback) {
            IDBFS.getLocalSet(mount, function(err, local) {
              if (err) return callback(err);
      
              IDBFS.getRemoteSet(mount, function(err, remote) {
                if (err) return callback(err);
      
                var src = populate ? remote : local;
                var dst = populate ? local : remote;
      
                IDBFS.reconcile(src, dst, callback);
              });
            });
          },getDB:function(name, callback) {
            // check the cache first
            var db = IDBFS.dbs[name];
            if (db) {
              return callback(null, db);
            }
      
            var req;
            try {
              req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
            } catch (e) {
              return callback(e);
            }
            if (!req) {
              return callback("Unable to connect to IndexedDB");
            }
            req.onupgradeneeded = function(e) {
              var db = e.target.result;
              var transaction = e.target.transaction;
      
              var fileStore;
      
              if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
                fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
              } else {
                fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
              }
      
              if (!fileStore.indexNames.contains('timestamp')) {
                fileStore.createIndex('timestamp', 'timestamp', { unique: false });
              }
            };
            req.onsuccess = function() {
              db = req.result;
      
              // add to the cache
              IDBFS.dbs[name] = db;
              callback(null, db);
            };
            req.onerror = function(e) {
              callback(this.error);
              e.preventDefault();
            };
          },getLocalSet:function(mount, callback) {
            var entries = {};
      
            function isRealDir(p) {
              return p !== '.' && p !== '..';
            };
            function toAbsolute(root) {
              return function(p) {
                return PATH.join2(root, p);
              }
            };
      
            var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
      
            while (check.length) {
              var path = check.pop();
              var stat;
      
              try {
                stat = FS.stat(path);
              } catch (e) {
                return callback(e);
              }
      
              if (FS.isDir(stat.mode)) {
                check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
              }
      
              entries[path] = { timestamp: stat.mtime };
            }
      
            return callback(null, { type: 'local', entries: entries });
          },getRemoteSet:function(mount, callback) {
            var entries = {};
      
            IDBFS.getDB(mount.mountpoint, function(err, db) {
              if (err) return callback(err);
      
              try {
                var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
                transaction.onerror = function(e) {
                  callback(this.error);
                  e.preventDefault();
                };
      
                var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
                var index = store.index('timestamp');
      
                index.openKeyCursor().onsuccess = function(event) {
                  var cursor = event.target.result;
      
                  if (!cursor) {
                    return callback(null, { type: 'remote', db: db, entries: entries });
                  }
      
                  entries[cursor.primaryKey] = { timestamp: cursor.key };
      
                  cursor.continue();
                };
              } catch (e) {
                return callback(e);
              }
            });
          },loadLocalEntry:function(path, callback) {
            var stat, node;
      
            try {
              var lookup = FS.lookupPath(path);
              node = lookup.node;
              stat = FS.stat(path);
            } catch (e) {
              return callback(e);
            }
      
            if (FS.isDir(stat.mode)) {
              return callback(null, { timestamp: stat.mtime, mode: stat.mode });
            } else if (FS.isFile(stat.mode)) {
              // Performance consideration: storing a normal JavaScript array to a IndexedDB is much slower than storing a typed array.
              // Therefore always convert the file contents to a typed array first before writing the data to IndexedDB.
              node.contents = MEMFS.getFileDataAsTypedArray(node);
              return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
            } else {
              return callback(new Error('node type not supported'));
            }
          },storeLocalEntry:function(path, entry, callback) {
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                FS.writeFile(path, entry.contents, { canOwn: true });
              } else {
                return callback(new Error('node type not supported'));
              }
      
              FS.chmod(path, entry.mode);
              FS.utime(path, entry.timestamp, entry.timestamp);
            } catch (e) {
              return callback(e);
            }
      
            callback(null);
          },removeLocalEntry:function(path, callback) {
            try {
              var lookup = FS.lookupPath(path);
              var stat = FS.stat(path);
      
              if (FS.isDir(stat.mode)) {
                FS.rmdir(path);
              } else if (FS.isFile(stat.mode)) {
                FS.unlink(path);
              }
            } catch (e) {
              return callback(e);
            }
      
            callback(null);
          },loadRemoteEntry:function(store, path, callback) {
            var req = store.get(path);
            req.onsuccess = function(event) { callback(null, event.target.result); };
            req.onerror = function(e) {
              callback(this.error);
              e.preventDefault();
            };
          },storeRemoteEntry:function(store, path, entry, callback) {
            var req = store.put(entry, path);
            req.onsuccess = function() { callback(null); };
            req.onerror = function(e) {
              callback(this.error);
              e.preventDefault();
            };
          },removeRemoteEntry:function(store, path, callback) {
            var req = store.delete(path);
            req.onsuccess = function() { callback(null); };
            req.onerror = function(e) {
              callback(this.error);
              e.preventDefault();
            };
          },reconcile:function(src, dst, callback) {
            var total = 0;
      
            var create = [];
            Object.keys(src.entries).forEach(function (key) {
              var e = src.entries[key];
              var e2 = dst.entries[key];
              if (!e2 || e.timestamp > e2.timestamp) {
                create.push(key);
                total++;
              }
            });
      
            var remove = [];
            Object.keys(dst.entries).forEach(function (key) {
              var e = dst.entries[key];
              var e2 = src.entries[key];
              if (!e2) {
                remove.push(key);
                total++;
              }
            });
      
            if (!total) {
              return callback(null);
            }
      
            var errored = false;
            var db = src.type === 'remote' ? src.db : dst.db;
            var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
            var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
      
            function done(err) {
              if (err && !errored) {
                errored = true;
                return callback(err);
              }
            };
      
            transaction.onerror = function(e) {
              done(this.error);
              e.preventDefault();
            };
      
            transaction.oncomplete = function(e) {
              if (!errored) {
                callback(null);
              }
            };
      
            // sort paths in ascending order so directory entries are created
            // before the files inside them
            create.sort().forEach(function (path) {
              if (dst.type === 'local') {
                IDBFS.loadRemoteEntry(store, path, function (err, entry) {
                  if (err) return done(err);
                  IDBFS.storeLocalEntry(path, entry, done);
                });
              } else {
                IDBFS.loadLocalEntry(path, function (err, entry) {
                  if (err) return done(err);
                  IDBFS.storeRemoteEntry(store, path, entry, done);
                });
              }
            });
      
            // sort paths in descending order so files are deleted before their
            // parent directories
            remove.sort().reverse().forEach(function(path) {
              if (dst.type === 'local') {
                IDBFS.removeLocalEntry(path, done);
              } else {
                IDBFS.removeRemoteEntry(store, path, done);
              }
            });
          }};
      
      var NODEFS={isWindows:false,staticInit:function() {
            NODEFS.isWindows = !!process.platform.match(/^win/);
            var flags = process["binding"]("constants");
            // Node.js 4 compatibility: it has no namespaces for constants
            if (flags["fs"]) {
              flags = flags["fs"];
            }
            NODEFS.flagsForNodeMap = {
              "1024": flags["O_APPEND"],
              "64": flags["O_CREAT"],
              "128": flags["O_EXCL"],
              "0": flags["O_RDONLY"],
              "2": flags["O_RDWR"],
              "4096": flags["O_SYNC"],
              "512": flags["O_TRUNC"],
              "1": flags["O_WRONLY"]
            };
          },bufferFrom:function (arrayBuffer) {
            // Node.js < 4.5 compatibility: Buffer.from does not support ArrayBuffer
            // Buffer.from before 4.5 was just a method inherited from Uint8Array
            // Buffer.alloc has been added with Buffer.from together, so check it instead
            return Buffer.alloc ? Buffer.from(arrayBuffer) : new Buffer(arrayBuffer);
          },mount:function (mount) {
            assert(ENVIRONMENT_HAS_NODE);
            return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
          },createNode:function (parent, name, mode, dev) {
            if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
              throw new FS.ErrnoError(22);
            }
            var node = FS.createNode(parent, name, mode);
            node.node_ops = NODEFS.node_ops;
            node.stream_ops = NODEFS.stream_ops;
            return node;
          },getMode:function (path) {
            var stat;
            try {
              stat = fs.lstatSync(path);
              if (NODEFS.isWindows) {
                // Node.js on Windows never represents permission bit 'x', so
                // propagate read bits to execute bits
                stat.mode = stat.mode | ((stat.mode & 292) >> 2);
              }
            } catch (e) {
              if (!e.code) throw e;
              throw new FS.ErrnoError(-e.errno); // syscall errnos are negated, node's are not
            }
            return stat.mode;
          },realPath:function (node) {
            var parts = [];
            while (node.parent !== node) {
              parts.push(node.name);
              node = node.parent;
            }
            parts.push(node.mount.opts.root);
            parts.reverse();
            return PATH.join.apply(null, parts);
          },flagsForNode:function(flags) {
            flags &= ~0x200000 /*O_PATH*/; // Ignore this flag from musl, otherwise node.js fails to open the file.
            flags &= ~0x800 /*O_NONBLOCK*/; // Ignore this flag from musl, otherwise node.js fails to open the file.
            flags &= ~0x8000 /*O_LARGEFILE*/; // Ignore this flag from musl, otherwise node.js fails to open the file.
            flags &= ~0x80000 /*O_CLOEXEC*/; // Some applications may pass it; it makes no sense for a single process.
            var newFlags = 0;
            for (var k in NODEFS.flagsForNodeMap) {
              if (flags & k) {
                newFlags |= NODEFS.flagsForNodeMap[k];
                flags ^= k;
              }
            }
      
            if (!flags) {
              return newFlags;
            } else {
              throw new FS.ErrnoError(22);
            }
          },node_ops:{getattr:function(node) {
              var path = NODEFS.realPath(node);
              var stat;
              try {
                stat = fs.lstatSync(path);
              } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(-e.errno);
              }
              // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
              // See http://support.microsoft.com/kb/140365
              if (NODEFS.isWindows && !stat.blksize) {
                stat.blksize = 4096;
              }
              if (NODEFS.isWindows && !stat.blocks) {
                stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
              }
              return {
                dev: stat.dev,
                ino: stat.ino,
                mode: stat.mode,
                nlink: stat.nlink,
                uid: stat.uid,
                gid: stat.gid,
                rdev: stat.rdev,
                size: stat.size,
                atime: stat.atime,
                mtime: stat.mtime,
                ctime: stat.ctime,
                blksize: stat.blksize,
                blocks: stat.blocks
              };
            },setattr:function(node, attr) {
              var path = NODEFS.realPath(node);
              try {
                if (attr.mode !== undefined) {
                  fs.chmodSync(path, attr.mode);
                  // update the common node structure mode as well
                  node.mode = attr.mode;
                }
                if (attr.timestamp !== undefined) {
                  var date = new Date(attr.timestamp);
                  fs.utimesSync(path, date, date);
                }
                if (attr.size !== undefined) {
                  fs.truncateSync(path, attr.size);
                }
              } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(-e.errno);
              }
            },lookup:function (parent, name) {
              var path = PATH.join2(NODEFS.realPath(parent), name);
              var mode = NODEFS.getMode(path);
              return NODEFS.createNode(parent, name, mode);
            },mknod:function (parent, name, mode, dev) {
              var node = NODEFS.createNode(parent, name, mode, dev);
              // create the backing node for this in the fs root as well
              var path = NODEFS.realPath(node);
              try {
                if (FS.isDir(node.mode)) {
                  fs.mkdirSync(path, node.mode);
                } else {
                  fs.writeFileSync(path, '', { mode: node.mode });
                }
              } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(-e.errno);
              }
              return node;
            },rename:function (oldNode, newDir, newName) {
              var oldPath = NODEFS.realPath(oldNode);
              var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
              try {
                fs.renameSync(oldPath, newPath);
              } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(-e.errno);
              }
            },unlink:function(parent, name) {
              var path = PATH.join2(NODEFS.realPath(parent), name);
              try {
                fs.unlinkSync(path);
              } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(-e.errno);
              }
            },rmdir:function(parent, name) {
              var path = PATH.join2(NODEFS.realPath(parent), name);
              try {
                fs.rmdirSync(path);
              } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(-e.errno);
              }
            },readdir:function(node) {
              var path = NODEFS.realPath(node);
              try {
                return fs.readdirSync(path);
              } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(-e.errno);
              }
            },symlink:function(parent, newName, oldPath) {
              var newPath = PATH.join2(NODEFS.realPath(parent), newName);
              try {
                fs.symlinkSync(oldPath, newPath);
              } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(-e.errno);
              }
            },readlink:function(node) {
              var path = NODEFS.realPath(node);
              try {
                path = fs.readlinkSync(path);
                path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
                return path;
              } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(-e.errno);
              }
            }},stream_ops:{open:function (stream) {
              var path = NODEFS.realPath(stream.node);
              try {
                if (FS.isFile(stream.node.mode)) {
                  stream.nfd = fs.openSync(path, NODEFS.flagsForNode(stream.flags));
                }
              } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(-e.errno);
              }
            },close:function (stream) {
              try {
                if (FS.isFile(stream.node.mode) && stream.nfd) {
                  fs.closeSync(stream.nfd);
                }
              } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(-e.errno);
              }
            },read:function (stream, buffer, offset, length, position) {
              // Node.js < 6 compatibility: node errors on 0 length reads
              if (length === 0) return 0;
              try {
                return fs.readSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position);
              } catch (e) {
                throw new FS.ErrnoError(-e.errno);
              }
            },write:function (stream, buffer, offset, length, position) {
              try {
                return fs.writeSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position);
              } catch (e) {
                throw new FS.ErrnoError(-e.errno);
              }
            },llseek:function (stream, offset, whence) {
              var position = offset;
              if (whence === 1) {  // SEEK_CUR.
                position += stream.position;
              } else if (whence === 2) {  // SEEK_END.
                if (FS.isFile(stream.node.mode)) {
                  try {
                    var stat = fs.fstatSync(stream.nfd);
                    position += stat.size;
                  } catch (e) {
                    throw new FS.ErrnoError(-e.errno);
                  }
                }
              }
      
              if (position < 0) {
                throw new FS.ErrnoError(22);
              }
      
              return position;
            }}};
      
      var WORKERFS={DIR_MODE:16895,FILE_MODE:33279,reader:null,mount:function (mount) {
            assert(ENVIRONMENT_IS_WORKER);
            if (!WORKERFS.reader) WORKERFS.reader = new FileReaderSync();
            var root = WORKERFS.createNode(null, '/', WORKERFS.DIR_MODE, 0);
            var createdParents = {};
            function ensureParent(path) {
              // return the parent node, creating subdirs as necessary
              var parts = path.split('/');
              var parent = root;
              for (var i = 0; i < parts.length-1; i++) {
                var curr = parts.slice(0, i+1).join('/');
                // Issue 4254: Using curr as a node name will prevent the node
                // from being found in FS.nameTable when FS.open is called on
                // a path which holds a child of this node,
                // given that all FS functions assume node names
                // are just their corresponding parts within their given path,
                // rather than incremental aggregates which include their parent's
                // directories.
                if (!createdParents[curr]) {
                  createdParents[curr] = WORKERFS.createNode(parent, parts[i], WORKERFS.DIR_MODE, 0);
                }
                parent = createdParents[curr];
              }
              return parent;
            }
            function base(path) {
              var parts = path.split('/');
              return parts[parts.length-1];
            }
            // We also accept FileList here, by using Array.prototype
            Array.prototype.forEach.call(mount.opts["files"] || [], function(file) {
              WORKERFS.createNode(ensureParent(file.name), base(file.name), WORKERFS.FILE_MODE, 0, file, file.lastModifiedDate);
            });
            (mount.opts["blobs"] || []).forEach(function(obj) {
              WORKERFS.createNode(ensureParent(obj["name"]), base(obj["name"]), WORKERFS.FILE_MODE, 0, obj["data"]);
            });
            (mount.opts["packages"] || []).forEach(function(pack) {
              pack['metadata'].files.forEach(function(file) {
                var name = file.filename.substr(1); // remove initial slash
                WORKERFS.createNode(ensureParent(name), base(name), WORKERFS.FILE_MODE, 0, pack['blob'].slice(file.start, file.end));
              });
            });
            return root;
          },createNode:function (parent, name, mode, dev, contents, mtime) {
            var node = FS.createNode(parent, name, mode);
            node.mode = mode;
            node.node_ops = WORKERFS.node_ops;
            node.stream_ops = WORKERFS.stream_ops;
            node.timestamp = (mtime || new Date).getTime();
            assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
            if (mode === WORKERFS.FILE_MODE) {
              node.size = contents.size;
              node.contents = contents;
            } else {
              node.size = 4096;
              node.contents = {};
            }
            if (parent) {
              parent.contents[name] = node;
            }
            return node;
          },node_ops:{getattr:function(node) {
              return {
                dev: 1,
                ino: undefined,
                mode: node.mode,
                nlink: 1,
                uid: 0,
                gid: 0,
                rdev: undefined,
                size: node.size,
                atime: new Date(node.timestamp),
                mtime: new Date(node.timestamp),
                ctime: new Date(node.timestamp),
                blksize: 4096,
                blocks: Math.ceil(node.size / 4096),
              };
            },setattr:function(node, attr) {
              if (attr.mode !== undefined) {
                node.mode = attr.mode;
              }
              if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp;
              }
            },lookup:function(parent, name) {
              throw new FS.ErrnoError(2);
            },mknod:function (parent, name, mode, dev) {
              throw new FS.ErrnoError(1);
            },rename:function (oldNode, newDir, newName) {
              throw new FS.ErrnoError(1);
            },unlink:function(parent, name) {
              throw new FS.ErrnoError(1);
            },rmdir:function(parent, name) {
              throw new FS.ErrnoError(1);
            },readdir:function(node) {
              var entries = ['.', '..'];
              for (var key in node.contents) {
                if (!node.contents.hasOwnProperty(key)) {
                  continue;
                }
                entries.push(key);
              }
              return entries;
            },symlink:function(parent, newName, oldPath) {
              throw new FS.ErrnoError(1);
            },readlink:function(node) {
              throw new FS.ErrnoError(1);
            }},stream_ops:{read:function (stream, buffer, offset, length, position) {
              if (position >= stream.node.size) return 0;
              var chunk = stream.node.contents.slice(position, position + length);
              var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
              buffer.set(new Uint8Array(ab), offset);
              return chunk.size;
            },write:function (stream, buffer, offset, length, position) {
              throw new FS.ErrnoError(5);
            },llseek:function (stream, offset, whence) {
              var position = offset;
              if (whence === 1) {  // SEEK_CUR.
                position += stream.position;
              } else if (whence === 2) {  // SEEK_END.
                if (FS.isFile(stream.node.mode)) {
                  position += stream.node.size;
                }
              }
              if (position < 0) {
                throw new FS.ErrnoError(22);
              }
              return position;
            }}};
      
      var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
      
      var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};var FS={root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},filesystems:null,syncFSRequests:0,handleFSError:function(e) {
            if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
            return ___setErrNo(e.errno);
          },lookupPath:function(path, opts) {
            path = PATH_FS.resolve(FS.cwd(), path);
            opts = opts || {};
      
            if (!path) return { path: '', node: null };
      
            var defaults = {
              follow_mount: true,
              recurse_count: 0
            };
            for (var key in defaults) {
              if (opts[key] === undefined) {
                opts[key] = defaults[key];
              }
            }
      
            if (opts.recurse_count > 8) {  // max recursive lookup of 8
              throw new FS.ErrnoError(40);
            }
      
            // split the path
            var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
              return !!p;
            }), false);
      
            // start at the root
            var current = FS.root;
            var current_path = '/';
      
            for (var i = 0; i < parts.length; i++) {
              var islast = (i === parts.length-1);
              if (islast && opts.parent) {
                // stop resolving
                break;
              }
      
              current = FS.lookupNode(current, parts[i]);
              current_path = PATH.join2(current_path, parts[i]);
      
              // jump to the mount's root node if this is a mountpoint
              if (FS.isMountpoint(current)) {
                if (!islast || (islast && opts.follow_mount)) {
                  current = current.mounted.root;
                }
              }
      
              // by default, lookupPath will not follow a symlink if it is the final path component.
              // setting opts.follow = true will override this behavior.
              if (!islast || opts.follow) {
                var count = 0;
                while (FS.isLink(current.mode)) {
                  var link = FS.readlink(current_path);
                  current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
      
                  var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
                  current = lookup.node;
      
                  if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                    throw new FS.ErrnoError(40);
                  }
                }
              }
            }
      
            return { path: current_path, node: current };
          },getPath:function(node) {
            var path;
            while (true) {
              if (FS.isRoot(node)) {
                var mount = node.mount.mountpoint;
                if (!path) return mount;
                return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
              }
              path = path ? node.name + '/' + path : node.name;
              node = node.parent;
            }
          },hashName:function(parentid, name) {
            var hash = 0;
      
      
            for (var i = 0; i < name.length; i++) {
              hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
            }
            return ((parentid + hash) >>> 0) % FS.nameTable.length;
          },hashAddNode:function(node) {
            var hash = FS.hashName(node.parent.id, node.name);
            node.name_next = FS.nameTable[hash];
            FS.nameTable[hash] = node;
          },hashRemoveNode:function(node) {
            var hash = FS.hashName(node.parent.id, node.name);
            if (FS.nameTable[hash] === node) {
              FS.nameTable[hash] = node.name_next;
            } else {
              var current = FS.nameTable[hash];
              while (current) {
                if (current.name_next === node) {
                  current.name_next = node.name_next;
                  break;
                }
                current = current.name_next;
              }
            }
          },lookupNode:function(parent, name) {
            var err = FS.mayLookup(parent);
            if (err) {
              throw new FS.ErrnoError(err, parent);
            }
            var hash = FS.hashName(parent.id, name);
            for (var node = FS.nameTable[hash]; node; node = node.name_next) {
              var nodeName = node.name;
              if (node.parent.id === parent.id && nodeName === name) {
                return node;
              }
            }
            // if we failed to find it in the cache, call into the VFS
            return FS.lookup(parent, name);
          },createNode:function(parent, name, mode, rdev) {
            if (!FS.FSNode) {
              FS.FSNode = function(parent, name, mode, rdev) {
                if (!parent) {
                  parent = this;  // root node sets parent to itself
                }
                this.parent = parent;
                this.mount = parent.mount;
                this.mounted = null;
                this.id = FS.nextInode++;
                this.name = name;
                this.mode = mode;
                this.node_ops = {};
                this.stream_ops = {};
                this.rdev = rdev;
              };
      
              FS.FSNode.prototype = {};
      
              // compatibility
              var readMode = 292 | 73;
              var writeMode = 146;
      
              // NOTE we must use Object.defineProperties instead of individual calls to
              // Object.defineProperty in order to make closure compiler happy
              Object.defineProperties(FS.FSNode.prototype, {
                read: {
                  get: function() { return (this.mode & readMode) === readMode; },
                  set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
                },
                write: {
                  get: function() { return (this.mode & writeMode) === writeMode; },
                  set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
                },
                isFolder: {
                  get: function() { return FS.isDir(this.mode); }
                },
                isDevice: {
                  get: function() { return FS.isChrdev(this.mode); }
                }
              });
            }
      
            var node = new FS.FSNode(parent, name, mode, rdev);
      
            FS.hashAddNode(node);
      
            return node;
          },destroyNode:function(node) {
            FS.hashRemoveNode(node);
          },isRoot:function(node) {
            return node === node.parent;
          },isMountpoint:function(node) {
            return !!node.mounted;
          },isFile:function(mode) {
            return (mode & 61440) === 32768;
          },isDir:function(mode) {
            return (mode & 61440) === 16384;
          },isLink:function(mode) {
            return (mode & 61440) === 40960;
          },isChrdev:function(mode) {
            return (mode & 61440) === 8192;
          },isBlkdev:function(mode) {
            return (mode & 61440) === 24576;
          },isFIFO:function(mode) {
            return (mode & 61440) === 4096;
          },isSocket:function(mode) {
            return (mode & 49152) === 49152;
          },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function(str) {
            var flags = FS.flagModes[str];
            if (typeof flags === 'undefined') {
              throw new Error('Unknown file open mode: ' + str);
            }
            return flags;
          },flagsToPermissionString:function(flag) {
            var perms = ['r', 'w', 'rw'][flag & 3];
            if ((flag & 512)) {
              perms += 'w';
            }
            return perms;
          },nodePermissions:function(node, perms) {
            if (FS.ignorePermissions) {
              return 0;
            }
            // return 0 if any user, group or owner bits are set.
            if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
              return 13;
            } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
              return 13;
            } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
              return 13;
            }
            return 0;
          },mayLookup:function(dir) {
            var err = FS.nodePermissions(dir, 'x');
            if (err) return err;
            if (!dir.node_ops.lookup) return 13;
            return 0;
          },mayCreate:function(dir, name) {
            try {
              var node = FS.lookupNode(dir, name);
              return 17;
            } catch (e) {
            }
            return FS.nodePermissions(dir, 'wx');
          },mayDelete:function(dir, name, isdir) {
            var node;
            try {
              node = FS.lookupNode(dir, name);
            } catch (e) {
              return e.errno;
            }
            var err = FS.nodePermissions(dir, 'wx');
            if (err) {
              return err;
            }
            if (isdir) {
              if (!FS.isDir(node.mode)) {
                return 20;
              }
              if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                return 16;
              }
            } else {
              if (FS.isDir(node.mode)) {
                return 21;
              }
            }
            return 0;
          },mayOpen:function(node, flags) {
            if (!node) {
              return 2;
            }
            if (FS.isLink(node.mode)) {
              return 40;
            } else if (FS.isDir(node.mode)) {
              if (FS.flagsToPermissionString(flags) !== 'r' || // opening for write
                  (flags & 512)) { // TODO: check for O_SEARCH? (== search for dir only)
                return 21;
              }
            }
            return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
          },MAX_OPEN_FDS:4096,nextfd:function(fd_start, fd_end) {
            fd_start = fd_start || 0;
            fd_end = fd_end || FS.MAX_OPEN_FDS;
            for (var fd = fd_start; fd <= fd_end; fd++) {
              if (!FS.streams[fd]) {
                return fd;
              }
            }
            throw new FS.ErrnoError(24);
          },getStream:function(fd) {
            return FS.streams[fd];
          },createStream:function(stream, fd_start, fd_end) {
            if (!FS.FSStream) {
              FS.FSStream = function(){};
              FS.FSStream.prototype = {};
              // compatibility
              Object.defineProperties(FS.FSStream.prototype, {
                object: {
                  get: function() { return this.node; },
                  set: function(val) { this.node = val; }
                },
                isRead: {
                  get: function() { return (this.flags & 2097155) !== 1; }
                },
                isWrite: {
                  get: function() { return (this.flags & 2097155) !== 0; }
                },
                isAppend: {
                  get: function() { return (this.flags & 1024); }
                }
              });
            }
            // clone it, so we can return an instance of FSStream
            var newStream = new FS.FSStream();
            for (var p in stream) {
              newStream[p] = stream[p];
            }
            stream = newStream;
            var fd = FS.nextfd(fd_start, fd_end);
            stream.fd = fd;
            FS.streams[fd] = stream;
            return stream;
          },closeStream:function(fd) {
            FS.streams[fd] = null;
          },chrdev_stream_ops:{open:function(stream) {
              var device = FS.getDevice(stream.node.rdev);
              // override node's stream ops with the device's
              stream.stream_ops = device.stream_ops;
              // forward the open call
              if (stream.stream_ops.open) {
                stream.stream_ops.open(stream);
              }
            },llseek:function() {
              throw new FS.ErrnoError(29);
            }},major:function(dev) {
            return ((dev) >> 8);
          },minor:function(dev) {
            return ((dev) & 0xff);
          },makedev:function(ma, mi) {
            return ((ma) << 8 | (mi));
          },registerDevice:function(dev, ops) {
            FS.devices[dev] = { stream_ops: ops };
          },getDevice:function(dev) {
            return FS.devices[dev];
          },getMounts:function(mount) {
            var mounts = [];
            var check = [mount];
      
            while (check.length) {
              var m = check.pop();
      
              mounts.push(m);
      
              check.push.apply(check, m.mounts);
            }
      
            return mounts;
          },syncfs:function(populate, callback) {
            if (typeof(populate) === 'function') {
              callback = populate;
              populate = false;
            }
      
            FS.syncFSRequests++;
      
            if (FS.syncFSRequests > 1) {
              console.log('warning: ' + FS.syncFSRequests + ' FS.syncfs operations in flight at once, probably just doing extra work');
            }
      
            var mounts = FS.getMounts(FS.root.mount);
            var completed = 0;
      
            function doCallback(err) {
              assert(FS.syncFSRequests > 0);
              FS.syncFSRequests--;
              return callback(err);
            }
      
            function done(err) {
              if (err) {
                if (!done.errored) {
                  done.errored = true;
                  return doCallback(err);
                }
                return;
              }
              if (++completed >= mounts.length) {
                doCallback(null);
              }
            };
      
            // sync all mounts
            mounts.forEach(function (mount) {
              if (!mount.type.syncfs) {
                return done(null);
              }
              mount.type.syncfs(mount, populate, done);
            });
          },mount:function(type, opts, mountpoint) {
            var root = mountpoint === '/';
            var pseudo = !mountpoint;
            var node;
      
            if (root && FS.root) {
              throw new FS.ErrnoError(16);
            } else if (!root && !pseudo) {
              var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
      
              mountpoint = lookup.path;  // use the absolute path
              node = lookup.node;
      
              if (FS.isMountpoint(node)) {
                throw new FS.ErrnoError(16);
              }
      
              if (!FS.isDir(node.mode)) {
                throw new FS.ErrnoError(20);
              }
            }
      
            var mount = {
              type: type,
              opts: opts,
              mountpoint: mountpoint,
              mounts: []
            };
      
            // create a root node for the fs
            var mountRoot = type.mount(mount);
            mountRoot.mount = mount;
            mount.root = mountRoot;
      
            if (root) {
              FS.root = mountRoot;
            } else if (node) {
              // set as a mountpoint
              node.mounted = mount;
      
              // add the new mount to the current mount's children
              if (node.mount) {
                node.mount.mounts.push(mount);
              }
            }
      
            return mountRoot;
          },unmount:function (mountpoint) {
            var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
      
            if (!FS.isMountpoint(lookup.node)) {
              throw new FS.ErrnoError(22);
            }
      
            // destroy the nodes for this mount, and all its child mounts
            var node = lookup.node;
            var mount = node.mounted;
            var mounts = FS.getMounts(mount);
      
            Object.keys(FS.nameTable).forEach(function (hash) {
              var current = FS.nameTable[hash];
      
              while (current) {
                var next = current.name_next;
      
                if (mounts.indexOf(current.mount) !== -1) {
                  FS.destroyNode(current);
                }
      
                current = next;
              }
            });
      
            // no longer a mountpoint
            node.mounted = null;
      
            // remove this mount from the child mounts
            var idx = node.mount.mounts.indexOf(mount);
            assert(idx !== -1);
            node.mount.mounts.splice(idx, 1);
          },lookup:function(parent, name) {
            return parent.node_ops.lookup(parent, name);
          },mknod:function(path, mode, dev) {
            var lookup = FS.lookupPath(path, { parent: true });
            var parent = lookup.node;
            var name = PATH.basename(path);
            if (!name || name === '.' || name === '..') {
              throw new FS.ErrnoError(22);
            }
            var err = FS.mayCreate(parent, name);
            if (err) {
              throw new FS.ErrnoError(err);
            }
            if (!parent.node_ops.mknod) {
              throw new FS.ErrnoError(1);
            }
            return parent.node_ops.mknod(parent, name, mode, dev);
          },create:function(path, mode) {
            mode = mode !== undefined ? mode : 438 /* 0666 */;
            mode &= 4095;
            mode |= 32768;
            return FS.mknod(path, mode, 0);
          },mkdir:function(path, mode) {
            mode = mode !== undefined ? mode : 511 /* 0777 */;
            mode &= 511 | 512;
            mode |= 16384;
            return FS.mknod(path, mode, 0);
          },mkdirTree:function(path, mode) {
            var dirs = path.split('/');
            var d = '';
            for (var i = 0; i < dirs.length; ++i) {
              if (!dirs[i]) continue;
              d += '/' + dirs[i];
              try {
                FS.mkdir(d, mode);
              } catch(e) {
                if (e.errno != 17) throw e;
              }
            }
          },mkdev:function(path, mode, dev) {
            if (typeof(dev) === 'undefined') {
              dev = mode;
              mode = 438 /* 0666 */;
            }
            mode |= 8192;
            return FS.mknod(path, mode, dev);
          },symlink:function(oldpath, newpath) {
            if (!PATH_FS.resolve(oldpath)) {
              throw new FS.ErrnoError(2);
            }
            var lookup = FS.lookupPath(newpath, { parent: true });
            var parent = lookup.node;
            if (!parent) {
              throw new FS.ErrnoError(2);
            }
            var newname = PATH.basename(newpath);
            var err = FS.mayCreate(parent, newname);
            if (err) {
              throw new FS.ErrnoError(err);
            }
            if (!parent.node_ops.symlink) {
              throw new FS.ErrnoError(1);
            }
            return parent.node_ops.symlink(parent, newname, oldpath);
          },rename:function(old_path, new_path) {
            var old_dirname = PATH.dirname(old_path);
            var new_dirname = PATH.dirname(new_path);
            var old_name = PATH.basename(old_path);
            var new_name = PATH.basename(new_path);
            // parents must exist
            var lookup, old_dir, new_dir;
            try {
              lookup = FS.lookupPath(old_path, { parent: true });
              old_dir = lookup.node;
              lookup = FS.lookupPath(new_path, { parent: true });
              new_dir = lookup.node;
            } catch (e) {
              throw new FS.ErrnoError(16);
            }
            if (!old_dir || !new_dir) throw new FS.ErrnoError(2);
            // need to be part of the same mount
            if (old_dir.mount !== new_dir.mount) {
              throw new FS.ErrnoError(18);
            }
            // source must exist
            var old_node = FS.lookupNode(old_dir, old_name);
            // old path should not be an ancestor of the new path
            var relative = PATH_FS.relative(old_path, new_dirname);
            if (relative.charAt(0) !== '.') {
              throw new FS.ErrnoError(22);
            }
            // new path should not be an ancestor of the old path
            relative = PATH_FS.relative(new_path, old_dirname);
            if (relative.charAt(0) !== '.') {
              throw new FS.ErrnoError(39);
            }
            // see if the new path already exists
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
              // not fatal
            }
            // early out if nothing needs to change
            if (old_node === new_node) {
              return;
            }
            // we'll need to delete the old entry
            var isdir = FS.isDir(old_node.mode);
            var err = FS.mayDelete(old_dir, old_name, isdir);
            if (err) {
              throw new FS.ErrnoError(err);
            }
            // need delete permissions if we'll be overwriting.
            // need create permissions if new doesn't already exist.
            err = new_node ?
              FS.mayDelete(new_dir, new_name, isdir) :
              FS.mayCreate(new_dir, new_name);
            if (err) {
              throw new FS.ErrnoError(err);
            }
            if (!old_dir.node_ops.rename) {
              throw new FS.ErrnoError(1);
            }
            if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
              throw new FS.ErrnoError(16);
            }
            // if we are going to change the parent, check write permissions
            if (new_dir !== old_dir) {
              err = FS.nodePermissions(old_dir, 'w');
              if (err) {
                throw new FS.ErrnoError(err);
              }
            }
            try {
              if (FS.trackingDelegate['willMovePath']) {
                FS.trackingDelegate['willMovePath'](old_path, new_path);
              }
            } catch(e) {
              console.log("FS.trackingDelegate['willMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
            }
            // remove the node from the lookup hash
            FS.hashRemoveNode(old_node);
            // do the underlying fs rename
            try {
              old_dir.node_ops.rename(old_node, new_dir, new_name);
            } catch (e) {
              throw e;
            } finally {
              // add the node back to the hash (in case node_ops.rename
              // changed its name)
              FS.hashAddNode(old_node);
            }
            try {
              if (FS.trackingDelegate['onMovePath']) FS.trackingDelegate['onMovePath'](old_path, new_path);
            } catch(e) {
              console.log("FS.trackingDelegate['onMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
            }
          },rmdir:function(path) {
            var lookup = FS.lookupPath(path, { parent: true });
            var parent = lookup.node;
            var name = PATH.basename(path);
            var node = FS.lookupNode(parent, name);
            var err = FS.mayDelete(parent, name, true);
            if (err) {
              throw new FS.ErrnoError(err);
            }
            if (!parent.node_ops.rmdir) {
              throw new FS.ErrnoError(1);
            }
            if (FS.isMountpoint(node)) {
              throw new FS.ErrnoError(16);
            }
            try {
              if (FS.trackingDelegate['willDeletePath']) {
                FS.trackingDelegate['willDeletePath'](path);
              }
            } catch(e) {
              console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
            }
            parent.node_ops.rmdir(parent, name);
            FS.destroyNode(node);
            try {
              if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
            } catch(e) {
              console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
            }
          },readdir:function(path) {
            var lookup = FS.lookupPath(path, { follow: true });
            var node = lookup.node;
            if (!node.node_ops.readdir) {
              throw new FS.ErrnoError(20);
            }
            return node.node_ops.readdir(node);
          },unlink:function(path) {
            var lookup = FS.lookupPath(path, { parent: true });
            var parent = lookup.node;
            var name = PATH.basename(path);
            var node = FS.lookupNode(parent, name);
            var err = FS.mayDelete(parent, name, false);
            if (err) {
              // According to POSIX, we should map EISDIR to EPERM, but
              // we instead do what Linux does (and we must, as we use
              // the musl linux libc).
              throw new FS.ErrnoError(err);
            }
            if (!parent.node_ops.unlink) {
              throw new FS.ErrnoError(1);
            }
            if (FS.isMountpoint(node)) {
              throw new FS.ErrnoError(16);
            }
            try {
              if (FS.trackingDelegate['willDeletePath']) {
                FS.trackingDelegate['willDeletePath'](path);
              }
            } catch(e) {
              console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
            }
            parent.node_ops.unlink(parent, name);
            FS.destroyNode(node);
            try {
              if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
            } catch(e) {
              console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
            }
          },readlink:function(path) {
            var lookup = FS.lookupPath(path);
            var link = lookup.node;
            if (!link) {
              throw new FS.ErrnoError(2);
            }
            if (!link.node_ops.readlink) {
              throw new FS.ErrnoError(22);
            }
            return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
          },stat:function(path, dontFollow) {
            var lookup = FS.lookupPath(path, { follow: !dontFollow });
            var node = lookup.node;
            if (!node) {
              throw new FS.ErrnoError(2);
            }
            if (!node.node_ops.getattr) {
              throw new FS.ErrnoError(1);
            }
            return node.node_ops.getattr(node);
          },lstat:function(path) {
            return FS.stat(path, true);
          },chmod:function(path, mode, dontFollow) {
            var node;
            if (typeof path === 'string') {
              var lookup = FS.lookupPath(path, { follow: !dontFollow });
              node = lookup.node;
            } else {
              node = path;
            }
            if (!node.node_ops.setattr) {
              throw new FS.ErrnoError(1);
            }
            node.node_ops.setattr(node, {
              mode: (mode & 4095) | (node.mode & ~4095),
              timestamp: Date.now()
            });
          },lchmod:function(path, mode) {
            FS.chmod(path, mode, true);
          },fchmod:function(fd, mode) {
            var stream = FS.getStream(fd);
            if (!stream) {
              throw new FS.ErrnoError(9);
            }
            FS.chmod(stream.node, mode);
          },chown:function(path, uid, gid, dontFollow) {
            var node;
            if (typeof path === 'string') {
              var lookup = FS.lookupPath(path, { follow: !dontFollow });
              node = lookup.node;
            } else {
              node = path;
            }
            if (!node.node_ops.setattr) {
              throw new FS.ErrnoError(1);
            }
            node.node_ops.setattr(node, {
              timestamp: Date.now()
              // we ignore the uid / gid for now
            });
          },lchown:function(path, uid, gid) {
            FS.chown(path, uid, gid, true);
          },fchown:function(fd, uid, gid) {
            var stream = FS.getStream(fd);
            if (!stream) {
              throw new FS.ErrnoError(9);
            }
            FS.chown(stream.node, uid, gid);
          },truncate:function(path, len) {
            if (len < 0) {
              throw new FS.ErrnoError(22);
            }
            var node;
            if (typeof path === 'string') {
              var lookup = FS.lookupPath(path, { follow: true });
              node = lookup.node;
            } else {
              node = path;
            }
            if (!node.node_ops.setattr) {
              throw new FS.ErrnoError(1);
            }
            if (FS.isDir(node.mode)) {
              throw new FS.ErrnoError(21);
            }
            if (!FS.isFile(node.mode)) {
              throw new FS.ErrnoError(22);
            }
            var err = FS.nodePermissions(node, 'w');
            if (err) {
              throw new FS.ErrnoError(err);
            }
            node.node_ops.setattr(node, {
              size: len,
              timestamp: Date.now()
            });
          },ftruncate:function(fd, len) {
            var stream = FS.getStream(fd);
            if (!stream) {
              throw new FS.ErrnoError(9);
            }
            if ((stream.flags & 2097155) === 0) {
              throw new FS.ErrnoError(22);
            }
            FS.truncate(stream.node, len);
          },utime:function(path, atime, mtime) {
            var lookup = FS.lookupPath(path, { follow: true });
            var node = lookup.node;
            node.node_ops.setattr(node, {
              timestamp: Math.max(atime, mtime)
            });
          },open:function(path, flags, mode, fd_start, fd_end) {
            if (path === "") {
              throw new FS.ErrnoError(2);
            }
            flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
            mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
            if ((flags & 64)) {
              mode = (mode & 4095) | 32768;
            } else {
              mode = 0;
            }
            var node;
            if (typeof path === 'object') {
              node = path;
            } else {
              path = PATH.normalize(path);
              try {
                var lookup = FS.lookupPath(path, {
                  follow: !(flags & 131072)
                });
                node = lookup.node;
              } catch (e) {
                // ignore
              }
            }
            // perhaps we need to create the node
            var created = false;
            if ((flags & 64)) {
              if (node) {
                // if O_CREAT and O_EXCL are set, error out if the node already exists
                if ((flags & 128)) {
                  throw new FS.ErrnoError(17);
                }
              } else {
                // node doesn't exist, try to create it
                node = FS.mknod(path, mode, 0);
                created = true;
              }
            }
            if (!node) {
              throw new FS.ErrnoError(2);
            }
            // can't truncate a device
            if (FS.isChrdev(node.mode)) {
              flags &= ~512;
            }
            // if asked only for a directory, then this must be one
            if ((flags & 65536) && !FS.isDir(node.mode)) {
              throw new FS.ErrnoError(20);
            }
            // check permissions, if this is not a file we just created now (it is ok to
            // create and write to a file with read-only permissions; it is read-only
            // for later use)
            if (!created) {
              var err = FS.mayOpen(node, flags);
              if (err) {
                throw new FS.ErrnoError(err);
              }
            }
            // do truncation if necessary
            if ((flags & 512)) {
              FS.truncate(node, 0);
            }
            // we've already handled these, don't pass down to the underlying vfs
            flags &= ~(128 | 512);
      
            // register the stream with the filesystem
            var stream = FS.createStream({
              node: node,
              path: FS.getPath(node),  // we want the absolute path to the node
              flags: flags,
              seekable: true,
              position: 0,
              stream_ops: node.stream_ops,
              // used by the file family libc calls (fopen, fwrite, ferror, etc.)
              ungotten: [],
              error: false
            }, fd_start, fd_end);
            // call the new stream's open function
            if (stream.stream_ops.open) {
              stream.stream_ops.open(stream);
            }
            if (Module['logReadFiles'] && !(flags & 1)) {
              if (!FS.readFiles) FS.readFiles = {};
              if (!(path in FS.readFiles)) {
                FS.readFiles[path] = 1;
                console.log("FS.trackingDelegate error on read file: " + path);
              }
            }
            try {
              if (FS.trackingDelegate['onOpenFile']) {
                var trackingFlags = 0;
                if ((flags & 2097155) !== 1) {
                  trackingFlags |= FS.tracking.openFlags.READ;
                }
                if ((flags & 2097155) !== 0) {
                  trackingFlags |= FS.tracking.openFlags.WRITE;
                }
                FS.trackingDelegate['onOpenFile'](path, trackingFlags);
              }
            } catch(e) {
              console.log("FS.trackingDelegate['onOpenFile']('"+path+"', flags) threw an exception: " + e.message);
            }
            return stream;
          },close:function(stream) {
            if (FS.isClosed(stream)) {
              throw new FS.ErrnoError(9);
            }
            if (stream.getdents) stream.getdents = null; // free readdir state
            try {
              if (stream.stream_ops.close) {
                stream.stream_ops.close(stream);
              }
            } catch (e) {
              throw e;
            } finally {
              FS.closeStream(stream.fd);
            }
            stream.fd = null;
          },isClosed:function(stream) {
            return stream.fd === null;
          },llseek:function(stream, offset, whence) {
            if (FS.isClosed(stream)) {
              throw new FS.ErrnoError(9);
            }
            if (!stream.seekable || !stream.stream_ops.llseek) {
              throw new FS.ErrnoError(29);
            }
            if (whence != 0 /* SEEK_SET */ && whence != 1 /* SEEK_CUR */ && whence != 2 /* SEEK_END */) {
              throw new FS.ErrnoError(22);
            }
            stream.position = stream.stream_ops.llseek(stream, offset, whence);
            stream.ungotten = [];
            return stream.position;
          },read:function(stream, buffer, offset, length, position) {
            if (length < 0 || position < 0) {
              throw new FS.ErrnoError(22);
            }
            if (FS.isClosed(stream)) {
              throw new FS.ErrnoError(9);
            }
            if ((stream.flags & 2097155) === 1) {
              throw new FS.ErrnoError(9);
            }
            if (FS.isDir(stream.node.mode)) {
              throw new FS.ErrnoError(21);
            }
            if (!stream.stream_ops.read) {
              throw new FS.ErrnoError(22);
            }
            var seeking = typeof position !== 'undefined';
            if (!seeking) {
              position = stream.position;
            } else if (!stream.seekable) {
              throw new FS.ErrnoError(29);
            }
            var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
            if (!seeking) stream.position += bytesRead;
            return bytesRead;
          },write:function(stream, buffer, offset, length, position, canOwn) {
            if (length < 0 || position < 0) {
              throw new FS.ErrnoError(22);
            }
            if (FS.isClosed(stream)) {
              throw new FS.ErrnoError(9);
            }
            if ((stream.flags & 2097155) === 0) {
              throw new FS.ErrnoError(9);
            }
            if (FS.isDir(stream.node.mode)) {
              throw new FS.ErrnoError(21);
            }
            if (!stream.stream_ops.write) {
              throw new FS.ErrnoError(22);
            }
            if (stream.flags & 1024) {
              // seek to the end before writing in append mode
              FS.llseek(stream, 0, 2);
            }
            var seeking = typeof position !== 'undefined';
            if (!seeking) {
              position = stream.position;
            } else if (!stream.seekable) {
              throw new FS.ErrnoError(29);
            }
            var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
            if (!seeking) stream.position += bytesWritten;
            try {
              if (stream.path && FS.trackingDelegate['onWriteToFile']) FS.trackingDelegate['onWriteToFile'](stream.path);
            } catch(e) {
              console.log("FS.trackingDelegate['onWriteToFile']('"+stream.path+"') threw an exception: " + e.message);
            }
            return bytesWritten;
          },allocate:function(stream, offset, length) {
            if (FS.isClosed(stream)) {
              throw new FS.ErrnoError(9);
            }
            if (offset < 0 || length <= 0) {
              throw new FS.ErrnoError(22);
            }
            if ((stream.flags & 2097155) === 0) {
              throw new FS.ErrnoError(9);
            }
            if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
              throw new FS.ErrnoError(19);
            }
            if (!stream.stream_ops.allocate) {
              throw new FS.ErrnoError(95);
            }
            stream.stream_ops.allocate(stream, offset, length);
          },mmap:function(stream, buffer, offset, length, position, prot, flags) {
            // User requests writing to file (prot & PROT_WRITE != 0).
            // Checking if we have permissions to write to the file unless
            // MAP_PRIVATE flag is set. According to POSIX spec it is possible
            // to write to file opened in read-only mode with MAP_PRIVATE flag,
            // as all modifications will be visible only in the memory of
            // the current process.
            if ((prot & 2) !== 0
                && (flags & 2) === 0
                && (stream.flags & 2097155) !== 2) {
              throw new FS.ErrnoError(13);
            }
            if ((stream.flags & 2097155) === 1) {
              throw new FS.ErrnoError(13);
            }
            if (!stream.stream_ops.mmap) {
              throw new FS.ErrnoError(19);
            }
            return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
          },msync:function(stream, buffer, offset, length, mmapFlags) {
            if (!stream || !stream.stream_ops.msync) {
              return 0;
            }
            return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
          },munmap:function(stream) {
            return 0;
          },ioctl:function(stream, cmd, arg) {
            if (!stream.stream_ops.ioctl) {
              throw new FS.ErrnoError(25);
            }
            return stream.stream_ops.ioctl(stream, cmd, arg);
          },readFile:function(path, opts) {
            opts = opts || {};
            opts.flags = opts.flags || 'r';
            opts.encoding = opts.encoding || 'binary';
            if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
              throw new Error('Invalid encoding type "' + opts.encoding + '"');
            }
            var ret;
            var stream = FS.open(path, opts.flags);
            var stat = FS.stat(path);
            var length = stat.size;
            var buf = new Uint8Array(length);
            FS.read(stream, buf, 0, length, 0);
            if (opts.encoding === 'utf8') {
              ret = UTF8ArrayToString(buf, 0);
            } else if (opts.encoding === 'binary') {
              ret = buf;
            }
            FS.close(stream);
            return ret;
          },writeFile:function(path, data, opts) {
            opts = opts || {};
            opts.flags = opts.flags || 'w';
            var stream = FS.open(path, opts.flags, opts.mode);
            if (typeof data === 'string') {
              var buf = new Uint8Array(lengthBytesUTF8(data)+1);
              var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
              FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
            } else if (ArrayBuffer.isView(data)) {
              FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
            } else {
              throw new Error('Unsupported data type');
            }
            FS.close(stream);
          },cwd:function() {
            return FS.currentPath;
          },chdir:function(path) {
            var lookup = FS.lookupPath(path, { follow: true });
            if (lookup.node === null) {
              throw new FS.ErrnoError(2);
            }
            if (!FS.isDir(lookup.node.mode)) {
              throw new FS.ErrnoError(20);
            }
            var err = FS.nodePermissions(lookup.node, 'x');
            if (err) {
              throw new FS.ErrnoError(err);
            }
            FS.currentPath = lookup.path;
          },createDefaultDirectories:function() {
            FS.mkdir('/tmp');
            FS.mkdir('/home');
            FS.mkdir('/home/web_user');
          },createDefaultDevices:function() {
            // create /dev
            FS.mkdir('/dev');
            // setup /dev/null
            FS.registerDevice(FS.makedev(1, 3), {
              read: function() { return 0; },
              write: function(stream, buffer, offset, length, pos) { return length; }
            });
            FS.mkdev('/dev/null', FS.makedev(1, 3));
            // setup /dev/tty and /dev/tty1
            // stderr needs to print output using Module['printErr']
            // so we register a second tty just for it.
            TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
            TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
            FS.mkdev('/dev/tty', FS.makedev(5, 0));
            FS.mkdev('/dev/tty1', FS.makedev(6, 0));
            // setup /dev/[u]random
            var random_device;
            if (typeof crypto === 'object' && typeof crypto['getRandomValues'] === 'function') {
              // for modern web browsers
              var randomBuffer = new Uint8Array(1);
              random_device = function() { crypto.getRandomValues(randomBuffer); return randomBuffer[0]; };
            } else
            if (ENVIRONMENT_IS_NODE) {
              // for nodejs with or without crypto support included
              try {
                var crypto_module = require('crypto');
                // nodejs has crypto support
                random_device = function() { return crypto_module['randomBytes'](1)[0]; };
              } catch (e) {
                // nodejs doesn't have crypto support
              }
            } else
            {}
            if (!random_device) {
              // we couldn't find a proper implementation, as Math.random() is not suitable for /dev/random, see emscripten-core/emscripten/pull/7096
              random_device = function() { abort("no cryptographic support found for random_device. consider polyfilling it if you want to use something insecure like Math.random(), e.g. put this in a --pre-js: var crypto = { getRandomValues: function(array) { for (var i = 0; i < array.length; i++) array[i] = (Math.random()*256)|0 } };"); };
            }
            FS.createDevice('/dev', 'random', random_device);
            FS.createDevice('/dev', 'urandom', random_device);
            // we're not going to emulate the actual shm device,
            // just create the tmp dirs that reside in it commonly
            FS.mkdir('/dev/shm');
            FS.mkdir('/dev/shm/tmp');
          },createSpecialDirectories:function() {
            // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the name of the stream for fd 6 (see test_unistd_ttyname)
            FS.mkdir('/proc');
            FS.mkdir('/proc/self');
            FS.mkdir('/proc/self/fd');
            FS.mount({
              mount: function() {
                var node = FS.createNode('/proc/self', 'fd', 16384 | 511 /* 0777 */, 73);
                node.node_ops = {
                  lookup: function(parent, name) {
                    var fd = +name;
                    var stream = FS.getStream(fd);
                    if (!stream) throw new FS.ErrnoError(9);
                    var ret = {
                      parent: null,
                      mount: { mountpoint: 'fake' },
                      node_ops: { readlink: function() { return stream.path } }
                    };
                    ret.parent = ret; // make it look like a simple root node
                    return ret;
                  }
                };
                return node;
              }
            }, {}, '/proc/self/fd');
          },createStandardStreams:function() {
            // TODO deprecate the old functionality of a single
            // input / output callback and that utilizes FS.createDevice
            // and instead require a unique set of stream ops
      
            // by default, we symlink the standard streams to the
            // default tty devices. however, if the standard streams
            // have been overwritten we create a unique device for
            // them instead.
            if (Module['stdin']) {
              FS.createDevice('/dev', 'stdin', Module['stdin']);
            } else {
              FS.symlink('/dev/tty', '/dev/stdin');
            }
            if (Module['stdout']) {
              FS.createDevice('/dev', 'stdout', null, Module['stdout']);
            } else {
              FS.symlink('/dev/tty', '/dev/stdout');
            }
            if (Module['stderr']) {
              FS.createDevice('/dev', 'stderr', null, Module['stderr']);
            } else {
              FS.symlink('/dev/tty1', '/dev/stderr');
            }
      
            // open default streams for the stdin, stdout and stderr devices
            var stdin = FS.open('/dev/stdin', 'r');
            var stdout = FS.open('/dev/stdout', 'w');
            var stderr = FS.open('/dev/stderr', 'w');
            assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
            assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
            assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
          },ensureErrnoError:function() {
            if (FS.ErrnoError) return;
            FS.ErrnoError = function ErrnoError(errno, node) {
              this.node = node;
              this.setErrno = function(errno) {
                this.errno = errno;
                for (var key in ERRNO_CODES) {
                  if (ERRNO_CODES[key] === errno) {
                    this.code = key;
                    break;
                  }
                }
              };
              this.setErrno(errno);
              this.message = ERRNO_MESSAGES[errno];
              // Node.js compatibility: assigning on this.stack fails on Node 4 (but fixed on Node 8)
              if (this.stack) Object.defineProperty(this, "stack", { value: (new Error).stack, writable: true });
              if (this.stack) this.stack = demangleAll(this.stack);
            };
            FS.ErrnoError.prototype = new Error();
            FS.ErrnoError.prototype.constructor = FS.ErrnoError;
            // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
            [2].forEach(function(code) {
              FS.genericErrors[code] = new FS.ErrnoError(code);
              FS.genericErrors[code].stack = '<generic error, no stack>';
            });
          },staticInit:function() {
            FS.ensureErrnoError();
      
            FS.nameTable = new Array(4096);
      
            FS.mount(MEMFS, {}, '/');
      
            FS.createDefaultDirectories();
            FS.createDefaultDevices();
            FS.createSpecialDirectories();
      
            FS.filesystems = {
              'MEMFS': MEMFS,
              'IDBFS': IDBFS,
              'NODEFS': NODEFS,
              'WORKERFS': WORKERFS,
            };
          },init:function(input, output, error) {
            assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
            FS.init.initialized = true;
      
            FS.ensureErrnoError();
      
            // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
            Module['stdin'] = input || Module['stdin'];
            Module['stdout'] = output || Module['stdout'];
            Module['stderr'] = error || Module['stderr'];
      
            FS.createStandardStreams();
          },quit:function() {
            FS.init.initialized = false;
            // force-flush all streams, so we get musl std streams printed out
            var fflush = Module['_fflush'];
            if (fflush) fflush(0);
            // close all of our streams
            for (var i = 0; i < FS.streams.length; i++) {
              var stream = FS.streams[i];
              if (!stream) {
                continue;
              }
              FS.close(stream);
            }
          },getMode:function(canRead, canWrite) {
            var mode = 0;
            if (canRead) mode |= 292 | 73;
            if (canWrite) mode |= 146;
            return mode;
          },joinPath:function(parts, forceRelative) {
            var path = PATH.join.apply(null, parts);
            if (forceRelative && path[0] == '/') path = path.substr(1);
            return path;
          },absolutePath:function(relative, base) {
            return PATH_FS.resolve(base, relative);
          },standardizePath:function(path) {
            return PATH.normalize(path);
          },findObject:function(path, dontResolveLastLink) {
            var ret = FS.analyzePath(path, dontResolveLastLink);
            if (ret.exists) {
              return ret.object;
            } else {
              ___setErrNo(ret.error);
              return null;
            }
          },analyzePath:function(path, dontResolveLastLink) {
            // operate from within the context of the symlink's target
            try {
              var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
              path = lookup.path;
            } catch (e) {
            }
            var ret = {
              isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
              parentExists: false, parentPath: null, parentObject: null
            };
            try {
              var lookup = FS.lookupPath(path, { parent: true });
              ret.parentExists = true;
              ret.parentPath = lookup.path;
              ret.parentObject = lookup.node;
              ret.name = PATH.basename(path);
              lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
              ret.exists = true;
              ret.path = lookup.path;
              ret.object = lookup.node;
              ret.name = lookup.node.name;
              ret.isRoot = lookup.path === '/';
            } catch (e) {
              ret.error = e.errno;
            };
            return ret;
          },createFolder:function(parent, name, canRead, canWrite) {
            var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
            var mode = FS.getMode(canRead, canWrite);
            return FS.mkdir(path, mode);
          },createPath:function(parent, path, canRead, canWrite) {
            parent = typeof parent === 'string' ? parent : FS.getPath(parent);
            var parts = path.split('/').reverse();
            while (parts.length) {
              var part = parts.pop();
              if (!part) continue;
              var current = PATH.join2(parent, part);
              try {
                FS.mkdir(current);
              } catch (e) {
                // ignore EEXIST
              }
              parent = current;
            }
            return current;
          },createFile:function(parent, name, properties, canRead, canWrite) {
            var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
            var mode = FS.getMode(canRead, canWrite);
            return FS.create(path, mode);
          },createDataFile:function(parent, name, data, canRead, canWrite, canOwn) {
            var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
            var mode = FS.getMode(canRead, canWrite);
            var node = FS.create(path, mode);
            if (data) {
              if (typeof data === 'string') {
                var arr = new Array(data.length);
                for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
                data = arr;
              }
              // make sure we can write to the file
              FS.chmod(node, mode | 146);
              var stream = FS.open(node, 'w');
              FS.write(stream, data, 0, data.length, 0, canOwn);
              FS.close(stream);
              FS.chmod(node, mode);
            }
            return node;
          },createDevice:function(parent, name, input, output) {
            var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
            var mode = FS.getMode(!!input, !!output);
            if (!FS.createDevice.major) FS.createDevice.major = 64;
            var dev = FS.makedev(FS.createDevice.major++, 0);
            // Create a fake device that a set of stream ops to emulate
            // the old behavior.
            FS.registerDevice(dev, {
              open: function(stream) {
                stream.seekable = false;
              },
              close: function(stream) {
                // flush any pending line data
                if (output && output.buffer && output.buffer.length) {
                  output(10);
                }
              },
              read: function(stream, buffer, offset, length, pos /* ignored */) {
                var bytesRead = 0;
                for (var i = 0; i < length; i++) {
                  var result;
                  try {
                    result = input();
                  } catch (e) {
                    throw new FS.ErrnoError(5);
                  }
                  if (result === undefined && bytesRead === 0) {
                    throw new FS.ErrnoError(11);
                  }
                  if (result === null || result === undefined) break;
                  bytesRead++;
                  buffer[offset+i] = result;
                }
                if (bytesRead) {
                  stream.node.timestamp = Date.now();
                }
                return bytesRead;
              },
              write: function(stream, buffer, offset, length, pos) {
                for (var i = 0; i < length; i++) {
                  try {
                    output(buffer[offset+i]);
                  } catch (e) {
                    throw new FS.ErrnoError(5);
                  }
                }
                if (length) {
                  stream.node.timestamp = Date.now();
                }
                return i;
              }
            });
            return FS.mkdev(path, mode, dev);
          },createLink:function(parent, name, target, canRead, canWrite) {
            var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
            return FS.symlink(target, path);
          },forceLoadFile:function(obj) {
            if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
            var success = true;
            if (typeof XMLHttpRequest !== 'undefined') {
              throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
            } else if (read_) {
              // Command-line.
              try {
                // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
                //          read() will try to parse UTF8.
                obj.contents = intArrayFromString(read_(obj.url), true);
                obj.usedBytes = obj.contents.length;
              } catch (e) {
                success = false;
              }
            } else {
              throw new Error('Cannot load without read() or XMLHttpRequest.');
            }
            if (!success) ___setErrNo(5);
            return success;
          },createLazyFile:function(parent, name, url, canRead, canWrite) {
            // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
            function LazyUint8Array() {
              this.lengthKnown = false;
              this.chunks = []; // Loaded chunks. Index is the chunk number
            }
            LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
              if (idx > this.length-1 || idx < 0) {
                return undefined;
              }
              var chunkOffset = idx % this.chunkSize;
              var chunkNum = (idx / this.chunkSize)|0;
              return this.getter(chunkNum)[chunkOffset];
            };
            LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
              this.getter = getter;
            };
            LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
      
              var chunkSize = 1024*1024; // Chunk size in bytes
      
              if (!hasByteServing) chunkSize = datalength;
      
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
      
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
      
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
      
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
      
              if (usesGzip || !datalength) {
                // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
                chunkSize = datalength = 1; // this will force getter(0)/doXHR do download the whole file
                datalength = this.getter(0).length;
                chunkSize = datalength;
                console.log("LazyFiles on gzip forces download of the whole file when length is accessed");
              }
      
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
            };
            if (typeof XMLHttpRequest !== 'undefined') {
              if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
              var lazyArray = new LazyUint8Array();
              Object.defineProperties(lazyArray, {
                length: {
                  get: function() {
                    if(!this.lengthKnown) {
                      this.cacheLength();
                    }
                    return this._length;
                  }
                },
                chunkSize: {
                  get: function() {
                    if(!this.lengthKnown) {
                      this.cacheLength();
                    }
                    return this._chunkSize;
                  }
                }
              });
      
              var properties = { isDevice: false, contents: lazyArray };
            } else {
              var properties = { isDevice: false, url: url };
            }
      
            var node = FS.createFile(parent, name, properties, canRead, canWrite);
            // This is a total hack, but I want to get this lazy file code out of the
            // core of MEMFS. If we want to keep this lazy file concept I feel it should
            // be its own thin LAZYFS proxying calls to MEMFS.
            if (properties.contents) {
              node.contents = properties.contents;
            } else if (properties.url) {
              node.contents = null;
              node.url = properties.url;
            }
            // Add a function that defers querying the file size until it is asked the first time.
            Object.defineProperties(node, {
              usedBytes: {
                get: function() { return this.contents.length; }
              }
            });
            // override each stream op with one that tries to force load the lazy file first
            var stream_ops = {};
            var keys = Object.keys(node.stream_ops);
            keys.forEach(function(key) {
              var fn = node.stream_ops[key];
              stream_ops[key] = function forceLoadLazyFile() {
                if (!FS.forceLoadFile(node)) {
                  throw new FS.ErrnoError(5);
                }
                return fn.apply(null, arguments);
              };
            });
            // use a custom read function
            stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
              if (!FS.forceLoadFile(node)) {
                throw new FS.ErrnoError(5);
              }
              var contents = stream.node.contents;
              if (position >= contents.length)
                return 0;
              var size = Math.min(contents.length - position, length);
              assert(size >= 0);
              if (contents.slice) { // normal array
                for (var i = 0; i < size; i++) {
                  buffer[offset + i] = contents[position + i];
                }
              } else {
                for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
                  buffer[offset + i] = contents.get(position + i);
                }
              }
              return size;
            };
            node.stream_ops = stream_ops;
            return node;
          },createPreloadedFile:function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
            Browser.init(); // XXX perhaps this method should move onto Browser?
            // TODO we should allow people to just pass in a complete filename instead
            // of parent and name being that we just join them anyways
            var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
            var dep = getUniqueRunDependency('cp ' + fullname); // might have several active requests for the same fullname
            function processData(byteArray) {
              function finish(byteArray) {
                if (preFinish) preFinish();
                if (!dontCreateFile) {
                  FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
                }
                if (onload) onload();
                removeRunDependency(dep);
              }
              var handled = false;
              Module['preloadPlugins'].forEach(function(plugin) {
                if (handled) return;
                if (plugin['canHandle'](fullname)) {
                  plugin['handle'](byteArray, fullname, finish, function() {
                    if (onerror) onerror();
                    removeRunDependency(dep);
                  });
                  handled = true;
                }
              });
              if (!handled) finish(byteArray);
            }
            addRunDependency(dep);
            if (typeof url == 'string') {
              Browser.asyncLoad(url, function(byteArray) {
                processData(byteArray);
              }, onerror);
            } else {
              processData(url);
            }
          },indexedDB:function() {
            return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
          },DB_NAME:function() {
            return 'EM_FS_' + window.location.pathname;
          },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function(paths, onload, onerror) {
            onload = onload || function(){};
            onerror = onerror || function(){};
            var indexedDB = FS.indexedDB();
            try {
              var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
            } catch (e) {
              return onerror(e);
            }
            openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
              console.log('creating db');
              var db = openRequest.result;
              db.createObjectStore(FS.DB_STORE_NAME);
            };
            openRequest.onsuccess = function openRequest_onsuccess() {
              var db = openRequest.result;
              var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
              var files = transaction.objectStore(FS.DB_STORE_NAME);
              var ok = 0, fail = 0, total = paths.length;
              function finish() {
                if (fail == 0) onload(); else onerror();
              }
              paths.forEach(function(path) {
                var putRequest = files.put(FS.analyzePath(path).object.contents, path);
                putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish(); };
                putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish(); };
              });
              transaction.onerror = onerror;
            };
            openRequest.onerror = onerror;
          },loadFilesFromDB:function(paths, onload, onerror) {
            onload = onload || function(){};
            onerror = onerror || function(){};
            var indexedDB = FS.indexedDB();
            try {
              var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
            } catch (e) {
              return onerror(e);
            }
            openRequest.onupgradeneeded = onerror; // no database to load from
            openRequest.onsuccess = function openRequest_onsuccess() {
              var db = openRequest.result;
              try {
                var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
              } catch(e) {
                onerror(e);
                return;
              }
              var files = transaction.objectStore(FS.DB_STORE_NAME);
              var ok = 0, fail = 0, total = paths.length;
              function finish() {
                if (fail == 0) onload(); else onerror();
              }
              paths.forEach(function(path) {
                var getRequest = files.get(path);
                getRequest.onsuccess = function getRequest_onsuccess() {
                  if (FS.analyzePath(path).exists) {
                    FS.unlink(path);
                  }
                  FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
                  ok++;
                  if (ok + fail == total) finish();
                };
                getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish(); };
              });
              transaction.onerror = onerror;
            };
            openRequest.onerror = onerror;
          }};var SYSCALLS={DEFAULT_POLLMASK:5,mappings:{},umask:511,calculateAt:function(dirfd, path) {
            if (path[0] !== '/') {
              // relative path
              var dir;
              if (dirfd === -100) {
                dir = FS.cwd();
              } else {
                var dirstream = FS.getStream(dirfd);
                if (!dirstream) throw new FS.ErrnoError(9);
                dir = dirstream.path;
              }
              path = PATH.join2(dir, path);
            }
            return path;
          },doStat:function(func, path, buf) {
            try {
              var stat = func(path);
            } catch (e) {
              if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                // an error occurred while trying to look up the path; we should just report ENOTDIR
                return -20;
              }
              throw e;
            }
            HEAP32[((buf)>>2)]=stat.dev;
            HEAP32[(((buf)+(4))>>2)]=0;
            HEAP32[(((buf)+(8))>>2)]=stat.ino;
            HEAP32[(((buf)+(12))>>2)]=stat.mode;
            HEAP32[(((buf)+(16))>>2)]=stat.nlink;
            HEAP32[(((buf)+(20))>>2)]=stat.uid;
            HEAP32[(((buf)+(24))>>2)]=stat.gid;
            HEAP32[(((buf)+(28))>>2)]=stat.rdev;
            HEAP32[(((buf)+(32))>>2)]=0;
            (tempI64 = [stat.size>>>0,(tempDouble=stat.size,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((buf)+(40))>>2)]=tempI64[0],HEAP32[(((buf)+(44))>>2)]=tempI64[1]);
            HEAP32[(((buf)+(48))>>2)]=4096;
            HEAP32[(((buf)+(52))>>2)]=stat.blocks;
            HEAP32[(((buf)+(56))>>2)]=(stat.atime.getTime() / 1000)|0;
            HEAP32[(((buf)+(60))>>2)]=0;
            HEAP32[(((buf)+(64))>>2)]=(stat.mtime.getTime() / 1000)|0;
            HEAP32[(((buf)+(68))>>2)]=0;
            HEAP32[(((buf)+(72))>>2)]=(stat.ctime.getTime() / 1000)|0;
            HEAP32[(((buf)+(76))>>2)]=0;
            (tempI64 = [stat.ino>>>0,(tempDouble=stat.ino,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((buf)+(80))>>2)]=tempI64[0],HEAP32[(((buf)+(84))>>2)]=tempI64[1]);
            return 0;
          },doMsync:function(addr, stream, len, flags) {
            var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
            FS.msync(stream, buffer, 0, len, flags);
          },doMkdir:function(path, mode) {
            // remove a trailing slash, if one - /a/b/ has basename of '', but
            // we want to create b in the context of this function
            path = PATH.normalize(path);
            if (path[path.length-1] === '/') path = path.substr(0, path.length-1);
            FS.mkdir(path, mode, 0);
            return 0;
          },doMknod:function(path, mode, dev) {
            // we don't want this in the JS API as it uses mknod to create all nodes.
            switch (mode & 61440) {
              case 32768:
              case 8192:
              case 24576:
              case 4096:
              case 49152:
                break;
              default: return -22;
            }
            FS.mknod(path, mode, dev);
            return 0;
          },doReadlink:function(path, buf, bufsize) {
            if (bufsize <= 0) return -22;
            var ret = FS.readlink(path);
      
            var len = Math.min(bufsize, lengthBytesUTF8(ret));
            var endChar = HEAP8[buf+len];
            stringToUTF8(ret, buf, bufsize+1);
            // readlink is one of the rare functions that write out a C string, but does never append a null to the output buffer(!)
            // stringToUTF8() always appends a null byte, so restore the character under the null byte after the write.
            HEAP8[buf+len] = endChar;
      
            return len;
          },doAccess:function(path, amode) {
            if (amode & ~7) {
              // need a valid mode
              return -22;
            }
            var node;
            var lookup = FS.lookupPath(path, { follow: true });
            node = lookup.node;
            var perms = '';
            if (amode & 4) perms += 'r';
            if (amode & 2) perms += 'w';
            if (amode & 1) perms += 'x';
            if (perms /* otherwise, they've just passed F_OK */ && FS.nodePermissions(node, perms)) {
              return -13;
            }
            return 0;
          },doDup:function(path, flags, suggestFD) {
            var suggest = FS.getStream(suggestFD);
            if (suggest) FS.close(suggest);
            return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
          },doReadv:function(stream, iov, iovcnt, offset) {
            var ret = 0;
            for (var i = 0; i < iovcnt; i++) {
              var ptr = HEAP32[(((iov)+(i*8))>>2)];
              var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
              var curr = FS.read(stream, HEAP8,ptr, len, offset);
              if (curr < 0) return -1;
              ret += curr;
              if (curr < len) break; // nothing more to read
            }
            return ret;
          },doWritev:function(stream, iov, iovcnt, offset) {
            var ret = 0;
            for (var i = 0; i < iovcnt; i++) {
              var ptr = HEAP32[(((iov)+(i*8))>>2)];
              var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
              var curr = FS.write(stream, HEAP8,ptr, len, offset);
              if (curr < 0) return -1;
              ret += curr;
            }
            return ret;
          },varargs:0,get:function(varargs) {
            SYSCALLS.varargs += 4;
            var ret = HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
            return ret;
          },getStr:function() {
            var ret = UTF8ToString(SYSCALLS.get());
            return ret;
          },getStreamFromFD:function() {
            var stream = FS.getStream(SYSCALLS.get());
            if (!stream) throw new FS.ErrnoError(9);
            return stream;
          },get64:function() {
            var low = SYSCALLS.get(), high = SYSCALLS.get();
            if (low >= 0) assert(high === 0);
            else assert(high === -1);
            return low;
          },getZero:function() {
            assert(SYSCALLS.get() === 0);
          }};function ___syscall140(which, varargs) {SYSCALLS.varargs = varargs;
      try {
       // llseek
          var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
          var HIGH_OFFSET = 0x100000000; // 2^32
          // use an unsigned operator on low and shift high by 32-bits
          var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
      
          var DOUBLE_LIMIT = 0x20000000000000; // 2^53
          // we also check for equality since DOUBLE_LIMIT + 1 == DOUBLE_LIMIT
          if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
            return -75;
          }
      
          FS.llseek(stream, offset, whence);
          (tempI64 = [stream.position>>>0,(tempDouble=stream.position,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((result)>>2)]=tempI64[0],HEAP32[(((result)+(4))>>2)]=tempI64[1]);
          if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
          return 0;
        } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
      }

      function ___syscall145(which, varargs) {SYSCALLS.varargs = varargs;
      try {
       // readv
          var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
          return SYSCALLS.doReadv(stream, iov, iovcnt);
        } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
      }

      function ___syscall146(which, varargs) {SYSCALLS.varargs = varargs;
      try {
       // writev
          var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
          return SYSCALLS.doWritev(stream, iov, iovcnt);
        } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
      }

      function ___syscall54(which, varargs) {SYSCALLS.varargs = varargs;
      try {
       // ioctl
          var stream = SYSCALLS.getStreamFromFD(), op = SYSCALLS.get();
          switch (op) {
            case 21509:
            case 21505: {
              if (!stream.tty) return -25;
              return 0;
            }
            case 21510:
            case 21511:
            case 21512:
            case 21506:
            case 21507:
            case 21508: {
              if (!stream.tty) return -25;
              return 0; // no-op, not actually adjusting terminal settings
            }
            case 21519: {
              if (!stream.tty) return -25;
              var argp = SYSCALLS.get();
              HEAP32[((argp)>>2)]=0;
              return 0;
            }
            case 21520: {
              if (!stream.tty) return -25;
              return -22; // not supported
            }
            case 21531: {
              var argp = SYSCALLS.get();
              return FS.ioctl(stream, op, argp);
            }
            case 21523: {
              // TODO: in theory we should write to the winsize struct that gets
              // passed in, but for now musl doesn't read anything on it
              if (!stream.tty) return -25;
              return 0;
            }
            case 21524: {
              // TODO: technically, this ioctl call should change the window size.
              // but, since emscripten doesn't have any concept of a terminal window
              // yet, we'll just silently throw it away as we do TIOCGWINSZ
              if (!stream.tty) return -25;
              return 0;
            }
            default: abort('bad ioctl syscall ' + op);
          }
        } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
      }

      function ___syscall6(which, varargs) {SYSCALLS.varargs = varargs;
      try {
       // close
          var stream = SYSCALLS.getStreamFromFD();
          FS.close(stream);
          return 0;
        } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
      }

      
      function __emscripten_syscall_munmap(addr, len) {
          if (addr === -1 || len === 0) {
            return -22;
          }
          // TODO: support unmmap'ing parts of allocations
          var info = SYSCALLS.mappings[addr];
          if (!info) return 0;
          if (len === info.len) {
            var stream = FS.getStream(info.fd);
            SYSCALLS.doMsync(addr, stream, len, info.flags);
            FS.munmap(stream);
            SYSCALLS.mappings[addr] = null;
            if (info.allocated) {
              _free(info.malloc);
            }
          }
          return 0;
        }function ___syscall91(which, varargs) {SYSCALLS.varargs = varargs;
      try {
       // munmap
          var addr = SYSCALLS.get(), len = SYSCALLS.get();
          return __emscripten_syscall_munmap(addr, len);
        } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
      }

      function ___unlock() {}

      
      function getShiftFromSize(size) {
          switch (size) {
              case 1: return 0;
              case 2: return 1;
              case 4: return 2;
              case 8: return 3;
              default:
                  throw new TypeError('Unknown type size: ' + size);
          }
        }
      
      
      
      function embind_init_charCodes() {
          var codes = new Array(256);
          for (var i = 0; i < 256; ++i) {
              codes[i] = String.fromCharCode(i);
          }
          embind_charCodes = codes;
        }var embind_charCodes=undefined;function readLatin1String(ptr) {
          var ret = "";
          var c = ptr;
          while (HEAPU8[c]) {
              ret += embind_charCodes[HEAPU8[c++]];
          }
          return ret;
        }
      
      
      var awaitingDependencies={};
      
      var registeredTypes={};
      
      var typeDependencies={};
      
      
      
      
      
      
      var char_0=48;
      
      var char_9=57;function makeLegalFunctionName(name) {
          if (undefined === name) {
              return '_unknown';
          }
          name = name.replace(/[^a-zA-Z0-9_]/g, '$');
          var f = name.charCodeAt(0);
          if (f >= char_0 && f <= char_9) {
              return '_' + name;
          } else {
              return name;
          }
        }function createNamedFunction(name, body) {
          name = makeLegalFunctionName(name);
          /*jshint evil:true*/
          return new Function(
              "body",
              "return function " + name + "() {\n" +
              "    \"use strict\";" +
              "    return body.apply(this, arguments);\n" +
              "};\n"
          )(body);
        }function extendError(baseErrorType, errorName) {
          var errorClass = createNamedFunction(errorName, function(message) {
              this.name = errorName;
              this.message = message;
      
              var stack = (new Error(message)).stack;
              if (stack !== undefined) {
                  this.stack = this.toString() + '\n' +
                      stack.replace(/^Error(:[^\n]*)?\n/, '');
              }
          });
          errorClass.prototype = Object.create(baseErrorType.prototype);
          errorClass.prototype.constructor = errorClass;
          errorClass.prototype.toString = function() {
              if (this.message === undefined) {
                  return this.name;
              } else {
                  return this.name + ': ' + this.message;
              }
          };
      
          return errorClass;
        }var BindingError=undefined;function throwBindingError(message) {
          throw new BindingError(message);
        }
      
      
      
      var InternalError=undefined;function throwInternalError(message) {
          throw new InternalError(message);
        }function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
          myTypes.forEach(function(type) {
              typeDependencies[type] = dependentTypes;
          });
      
          function onComplete(typeConverters) {
              var myTypeConverters = getTypeConverters(typeConverters);
              if (myTypeConverters.length !== myTypes.length) {
                  throwInternalError('Mismatched type converter count');
              }
              for (var i = 0; i < myTypes.length; ++i) {
                  registerType(myTypes[i], myTypeConverters[i]);
              }
          }
      
          var typeConverters = new Array(dependentTypes.length);
          var unregisteredTypes = [];
          var registered = 0;
          dependentTypes.forEach(function(dt, i) {
              if (registeredTypes.hasOwnProperty(dt)) {
                  typeConverters[i] = registeredTypes[dt];
              } else {
                  unregisteredTypes.push(dt);
                  if (!awaitingDependencies.hasOwnProperty(dt)) {
                      awaitingDependencies[dt] = [];
                  }
                  awaitingDependencies[dt].push(function() {
                      typeConverters[i] = registeredTypes[dt];
                      ++registered;
                      if (registered === unregisteredTypes.length) {
                          onComplete(typeConverters);
                      }
                  });
              }
          });
          if (0 === unregisteredTypes.length) {
              onComplete(typeConverters);
          }
        }function registerType(rawType, registeredInstance, options) {
          options = options || {};
      
          if (!('argPackAdvance' in registeredInstance)) {
              throw new TypeError('registerType registeredInstance requires argPackAdvance');
          }
      
          var name = registeredInstance.name;
          if (!rawType) {
              throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
          }
          if (registeredTypes.hasOwnProperty(rawType)) {
              if (options.ignoreDuplicateRegistrations) {
                  return;
              } else {
                  throwBindingError("Cannot register type '" + name + "' twice");
              }
          }
      
          registeredTypes[rawType] = registeredInstance;
          delete typeDependencies[rawType];
      
          if (awaitingDependencies.hasOwnProperty(rawType)) {
              var callbacks = awaitingDependencies[rawType];
              delete awaitingDependencies[rawType];
              callbacks.forEach(function(cb) {
                  cb();
              });
          }
        }function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
          var shift = getShiftFromSize(size);
      
          name = readLatin1String(name);
          registerType(rawType, {
              name: name,
              'fromWireType': function(wt) {
                  // ambiguous emscripten ABI: sometimes return values are
                  // true or false, and sometimes integers (0 or 1)
                  return !!wt;
              },
              'toWireType': function(destructors, o) {
                  return o ? trueValue : falseValue;
              },
              'argPackAdvance': 8,
              'readValueFromPointer': function(pointer) {
                  // TODO: if heap is fixed (like in asm.js) this could be executed outside
                  var heap;
                  if (size === 1) {
                      heap = HEAP8;
                  } else if (size === 2) {
                      heap = HEAP16;
                  } else if (size === 4) {
                      heap = HEAP32;
                  } else {
                      throw new TypeError("Unknown boolean type size: " + name);
                  }
                  return this['fromWireType'](heap[pointer >> shift]);
              },
              destructorFunction: null, // This type does not need a destructor
          });
        }

      
      
      
      function ClassHandle_isAliasOf(other) {
          if (!(this instanceof ClassHandle)) {
              return false;
          }
          if (!(other instanceof ClassHandle)) {
              return false;
          }
      
          var leftClass = this.$$.ptrType.registeredClass;
          var left = this.$$.ptr;
          var rightClass = other.$$.ptrType.registeredClass;
          var right = other.$$.ptr;
      
          while (leftClass.baseClass) {
              left = leftClass.upcast(left);
              leftClass = leftClass.baseClass;
          }
      
          while (rightClass.baseClass) {
              right = rightClass.upcast(right);
              rightClass = rightClass.baseClass;
          }
      
          return leftClass === rightClass && left === right;
        }
      
      
      function shallowCopyInternalPointer(o) {
          return {
              count: o.count,
              deleteScheduled: o.deleteScheduled,
              preservePointerOnDelete: o.preservePointerOnDelete,
              ptr: o.ptr,
              ptrType: o.ptrType,
              smartPtr: o.smartPtr,
              smartPtrType: o.smartPtrType,
          };
        }
      
      function throwInstanceAlreadyDeleted(obj) {
          function getInstanceTypeName(handle) {
            return handle.$$.ptrType.registeredClass.name;
          }
          throwBindingError(getInstanceTypeName(obj) + ' instance already deleted');
        }
      
      
      var finalizationGroup=false;
      
      function detachFinalizer(handle) {}
      
      
      function runDestructor($$) {
          if ($$.smartPtr) {
              $$.smartPtrType.rawDestructor($$.smartPtr);
          } else {
              $$.ptrType.registeredClass.rawDestructor($$.ptr);
          }
        }function releaseClassHandle($$) {
          $$.count.value -= 1;
          var toDelete = 0 === $$.count.value;
          if (toDelete) {
              runDestructor($$);
          }
        }function attachFinalizer(handle) {
          if ('undefined' === typeof FinalizationGroup) {
              attachFinalizer = function (handle) { return handle; };
              return handle;
          }
          // If the running environment has a FinalizationGroup (see
          // https://github.com/tc39/proposal-weakrefs), then attach finalizers
          // for class handles.  We check for the presence of FinalizationGroup
          // at run-time, not build-time.
          finalizationGroup = new FinalizationGroup(function (iter) {
              for (var result = iter.next(); !result.done; result = iter.next()) {
                  var $$ = result.value;
                  if (!$$.ptr) {
                      console.warn('object already deleted: ' + $$.ptr);
                  } else {
                      releaseClassHandle($$);
                  }
              }
          });
          attachFinalizer = function(handle) {
              finalizationGroup.register(handle, handle.$$, handle.$$);
              return handle;
          };
          detachFinalizer = function(handle) {
              finalizationGroup.unregister(handle.$$);
          };
          return attachFinalizer(handle);
        }function ClassHandle_clone() {
          if (!this.$$.ptr) {
              throwInstanceAlreadyDeleted(this);
          }
      
          if (this.$$.preservePointerOnDelete) {
              this.$$.count.value += 1;
              return this;
          } else {
              var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), {
                  $$: {
                      value: shallowCopyInternalPointer(this.$$),
                  }
              }));
      
              clone.$$.count.value += 1;
              clone.$$.deleteScheduled = false;
              return clone;
          }
        }
      
      function ClassHandle_delete() {
          if (!this.$$.ptr) {
              throwInstanceAlreadyDeleted(this);
          }
      
          if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
              throwBindingError('Object already scheduled for deletion');
          }
      
          detachFinalizer(this);
          releaseClassHandle(this.$$);
      
          if (!this.$$.preservePointerOnDelete) {
              this.$$.smartPtr = undefined;
              this.$$.ptr = undefined;
          }
        }
      
      function ClassHandle_isDeleted() {
          return !this.$$.ptr;
        }
      
      
      var delayFunction=undefined;
      
      var deletionQueue=[];
      
      function flushPendingDeletes() {
          while (deletionQueue.length) {
              var obj = deletionQueue.pop();
              obj.$$.deleteScheduled = false;
              obj['delete']();
          }
        }function ClassHandle_deleteLater() {
          if (!this.$$.ptr) {
              throwInstanceAlreadyDeleted(this);
          }
          if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
              throwBindingError('Object already scheduled for deletion');
          }
          deletionQueue.push(this);
          if (deletionQueue.length === 1 && delayFunction) {
              delayFunction(flushPendingDeletes);
          }
          this.$$.deleteScheduled = true;
          return this;
        }function init_ClassHandle() {
          ClassHandle.prototype['isAliasOf'] = ClassHandle_isAliasOf;
          ClassHandle.prototype['clone'] = ClassHandle_clone;
          ClassHandle.prototype['delete'] = ClassHandle_delete;
          ClassHandle.prototype['isDeleted'] = ClassHandle_isDeleted;
          ClassHandle.prototype['deleteLater'] = ClassHandle_deleteLater;
        }function ClassHandle() {
        }
      
      var registeredPointers={};
      
      
      function ensureOverloadTable(proto, methodName, humanName) {
          if (undefined === proto[methodName].overloadTable) {
              var prevFunc = proto[methodName];
              // Inject an overload resolver function that routes to the appropriate overload based on the number of arguments.
              proto[methodName] = function() {
                  // TODO This check can be removed in -O3 level "unsafe" optimizations.
                  if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
                      throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!");
                  }
                  return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
              };
              // Move the previous function into the overload table.
              proto[methodName].overloadTable = [];
              proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
          }
        }function exposePublicSymbol(name, value, numArguments) {
          if (Module.hasOwnProperty(name)) {
              if (undefined === numArguments || (undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments])) {
                  throwBindingError("Cannot register public name '" + name + "' twice");
              }
      
              // We are exposing a function with the same name as an existing function. Create an overload table and a function selector
              // that routes between the two.
              ensureOverloadTable(Module, name, name);
              if (Module.hasOwnProperty(numArguments)) {
                  throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!");
              }
              // Add the new function into the overload table.
              Module[name].overloadTable[numArguments] = value;
          }
          else {
              Module[name] = value;
              if (undefined !== numArguments) {
                  Module[name].numArguments = numArguments;
              }
          }
        }
      
      function RegisteredClass(
          name,
          constructor,
          instancePrototype,
          rawDestructor,
          baseClass,
          getActualType,
          upcast,
          downcast
        ) {
          this.name = name;
          this.constructor = constructor;
          this.instancePrototype = instancePrototype;
          this.rawDestructor = rawDestructor;
          this.baseClass = baseClass;
          this.getActualType = getActualType;
          this.upcast = upcast;
          this.downcast = downcast;
          this.pureVirtualFunctions = [];
        }
      
      
      
      function upcastPointer(ptr, ptrClass, desiredClass) {
          while (ptrClass !== desiredClass) {
              if (!ptrClass.upcast) {
                  throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name);
              }
              ptr = ptrClass.upcast(ptr);
              ptrClass = ptrClass.baseClass;
          }
          return ptr;
        }function constNoSmartPtrRawPointerToWireType(destructors, handle) {
          if (handle === null) {
              if (this.isReference) {
                  throwBindingError('null is not a valid ' + this.name);
              }
              return 0;
          }
      
          if (!handle.$$) {
              throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
          }
          if (!handle.$$.ptr) {
              throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
          }
          var handleClass = handle.$$.ptrType.registeredClass;
          var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
          return ptr;
        }
      
      function genericPointerToWireType(destructors, handle) {
          var ptr;
          if (handle === null) {
              if (this.isReference) {
                  throwBindingError('null is not a valid ' + this.name);
              }
      
              if (this.isSmartPointer) {
                  ptr = this.rawConstructor();
                  if (destructors !== null) {
                      destructors.push(this.rawDestructor, ptr);
                  }
                  return ptr;
              } else {
                  return 0;
              }
          }
      
          if (!handle.$$) {
              throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
          }
          if (!handle.$$.ptr) {
              throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
          }
          if (!this.isConst && handle.$$.ptrType.isConst) {
              throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
          }
          var handleClass = handle.$$.ptrType.registeredClass;
          ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      
          if (this.isSmartPointer) {
              // TODO: this is not strictly true
              // We could support BY_EMVAL conversions from raw pointers to smart pointers
              // because the smart pointer can hold a reference to the handle
              if (undefined === handle.$$.smartPtr) {
                  throwBindingError('Passing raw pointer to smart pointer is illegal');
              }
      
              switch (this.sharingPolicy) {
                  case 0: // NONE
                      // no upcasting
                      if (handle.$$.smartPtrType === this) {
                          ptr = handle.$$.smartPtr;
                      } else {
                          throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
                      }
                      break;
      
                  case 1: // INTRUSIVE
                      ptr = handle.$$.smartPtr;
                      break;
      
                  case 2: // BY_EMVAL
                      if (handle.$$.smartPtrType === this) {
                          ptr = handle.$$.smartPtr;
                      } else {
                          var clonedHandle = handle['clone']();
                          ptr = this.rawShare(
                              ptr,
                              __emval_register(function() {
                                  clonedHandle['delete']();
                              })
                          );
                          if (destructors !== null) {
                              destructors.push(this.rawDestructor, ptr);
                          }
                      }
                      break;
      
                  default:
                      throwBindingError('Unsupporting sharing policy');
              }
          }
          return ptr;
        }
      
      function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
          if (handle === null) {
              if (this.isReference) {
                  throwBindingError('null is not a valid ' + this.name);
              }
              return 0;
          }
      
          if (!handle.$$) {
              throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
          }
          if (!handle.$$.ptr) {
              throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
          }
          if (handle.$$.ptrType.isConst) {
              throwBindingError('Cannot convert argument of type ' + handle.$$.ptrType.name + ' to parameter type ' + this.name);
          }
          var handleClass = handle.$$.ptrType.registeredClass;
          var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
          return ptr;
        }
      
      
      function simpleReadValueFromPointer(pointer) {
          return this['fromWireType'](HEAPU32[pointer >> 2]);
        }
      
      function RegisteredPointer_getPointee(ptr) {
          if (this.rawGetPointee) {
              ptr = this.rawGetPointee(ptr);
          }
          return ptr;
        }
      
      function RegisteredPointer_destructor(ptr) {
          if (this.rawDestructor) {
              this.rawDestructor(ptr);
          }
        }
      
      function RegisteredPointer_deleteObject(handle) {
          if (handle !== null) {
              handle['delete']();
          }
        }
      
      
      function downcastPointer(ptr, ptrClass, desiredClass) {
          if (ptrClass === desiredClass) {
              return ptr;
          }
          if (undefined === desiredClass.baseClass) {
              return null; // no conversion
          }
      
          var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
          if (rv === null) {
              return null;
          }
          return desiredClass.downcast(rv);
        }
      
      
      
      
      function getInheritedInstanceCount() {
          return Object.keys(registeredInstances).length;
        }
      
      function getLiveInheritedInstances() {
          var rv = [];
          for (var k in registeredInstances) {
              if (registeredInstances.hasOwnProperty(k)) {
                  rv.push(registeredInstances[k]);
              }
          }
          return rv;
        }
      
      function setDelayFunction(fn) {
          delayFunction = fn;
          if (deletionQueue.length && delayFunction) {
              delayFunction(flushPendingDeletes);
          }
        }function init_embind() {
          Module['getInheritedInstanceCount'] = getInheritedInstanceCount;
          Module['getLiveInheritedInstances'] = getLiveInheritedInstances;
          Module['flushPendingDeletes'] = flushPendingDeletes;
          Module['setDelayFunction'] = setDelayFunction;
        }var registeredInstances={};
      
      function getBasestPointer(class_, ptr) {
          if (ptr === undefined) {
              throwBindingError('ptr should not be undefined');
          }
          while (class_.baseClass) {
              ptr = class_.upcast(ptr);
              class_ = class_.baseClass;
          }
          return ptr;
        }function getInheritedInstance(class_, ptr) {
          ptr = getBasestPointer(class_, ptr);
          return registeredInstances[ptr];
        }
      
      function makeClassHandle(prototype, record) {
          if (!record.ptrType || !record.ptr) {
              throwInternalError('makeClassHandle requires ptr and ptrType');
          }
          var hasSmartPtrType = !!record.smartPtrType;
          var hasSmartPtr = !!record.smartPtr;
          if (hasSmartPtrType !== hasSmartPtr) {
              throwInternalError('Both smartPtrType and smartPtr must be specified');
          }
          record.count = { value: 1 };
          return attachFinalizer(Object.create(prototype, {
              $$: {
                  value: record,
              },
          }));
        }function RegisteredPointer_fromWireType(ptr) {
          // ptr is a raw pointer (or a raw smartpointer)
      
          // rawPointer is a maybe-null raw pointer
          var rawPointer = this.getPointee(ptr);
          if (!rawPointer) {
              this.destructor(ptr);
              return null;
          }
      
          var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
          if (undefined !== registeredInstance) {
              // JS object has been neutered, time to repopulate it
              if (0 === registeredInstance.$$.count.value) {
                  registeredInstance.$$.ptr = rawPointer;
                  registeredInstance.$$.smartPtr = ptr;
                  return registeredInstance['clone']();
              } else {
                  // else, just increment reference count on existing object
                  // it already has a reference to the smart pointer
                  var rv = registeredInstance['clone']();
                  this.destructor(ptr);
                  return rv;
              }
          }
      
          function makeDefaultHandle() {
              if (this.isSmartPointer) {
                  return makeClassHandle(this.registeredClass.instancePrototype, {
                      ptrType: this.pointeeType,
                      ptr: rawPointer,
                      smartPtrType: this,
                      smartPtr: ptr,
                  });
              } else {
                  return makeClassHandle(this.registeredClass.instancePrototype, {
                      ptrType: this,
                      ptr: ptr,
                  });
              }
          }
      
          var actualType = this.registeredClass.getActualType(rawPointer);
          var registeredPointerRecord = registeredPointers[actualType];
          if (!registeredPointerRecord) {
              return makeDefaultHandle.call(this);
          }
      
          var toType;
          if (this.isConst) {
              toType = registeredPointerRecord.constPointerType;
          } else {
              toType = registeredPointerRecord.pointerType;
          }
          var dp = downcastPointer(
              rawPointer,
              this.registeredClass,
              toType.registeredClass);
          if (dp === null) {
              return makeDefaultHandle.call(this);
          }
          if (this.isSmartPointer) {
              return makeClassHandle(toType.registeredClass.instancePrototype, {
                  ptrType: toType,
                  ptr: dp,
                  smartPtrType: this,
                  smartPtr: ptr,
              });
          } else {
              return makeClassHandle(toType.registeredClass.instancePrototype, {
                  ptrType: toType,
                  ptr: dp,
              });
          }
        }function init_RegisteredPointer() {
          RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
          RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
          RegisteredPointer.prototype['argPackAdvance'] = 8;
          RegisteredPointer.prototype['readValueFromPointer'] = simpleReadValueFromPointer;
          RegisteredPointer.prototype['deleteObject'] = RegisteredPointer_deleteObject;
          RegisteredPointer.prototype['fromWireType'] = RegisteredPointer_fromWireType;
        }function RegisteredPointer(
          name,
          registeredClass,
          isReference,
          isConst,
      
          // smart pointer properties
          isSmartPointer,
          pointeeType,
          sharingPolicy,
          rawGetPointee,
          rawConstructor,
          rawShare,
          rawDestructor
        ) {
          this.name = name;
          this.registeredClass = registeredClass;
          this.isReference = isReference;
          this.isConst = isConst;
      
          // smart pointer properties
          this.isSmartPointer = isSmartPointer;
          this.pointeeType = pointeeType;
          this.sharingPolicy = sharingPolicy;
          this.rawGetPointee = rawGetPointee;
          this.rawConstructor = rawConstructor;
          this.rawShare = rawShare;
          this.rawDestructor = rawDestructor;
      
          if (!isSmartPointer && registeredClass.baseClass === undefined) {
              if (isConst) {
                  this['toWireType'] = constNoSmartPtrRawPointerToWireType;
                  this.destructorFunction = null;
              } else {
                  this['toWireType'] = nonConstNoSmartPtrRawPointerToWireType;
                  this.destructorFunction = null;
              }
          } else {
              this['toWireType'] = genericPointerToWireType;
              // Here we must leave this.destructorFunction undefined, since whether genericPointerToWireType returns
              // a pointer that needs to be freed up is runtime-dependent, and cannot be evaluated at registration time.
              // TODO: Create an alternative mechanism that allows removing the use of var destructors = []; array in
              //       craftInvokerFunction altogether.
          }
        }
      
      function replacePublicSymbol(name, value, numArguments) {
          if (!Module.hasOwnProperty(name)) {
              throwInternalError('Replacing nonexistant public symbol');
          }
          // If there's an overload table for this symbol, replace the symbol in the overload table instead.
          if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
              Module[name].overloadTable[numArguments] = value;
          }
          else {
              Module[name] = value;
              Module[name].argCount = numArguments;
          }
        }
      
      function embind__requireFunction(signature, rawFunction) {
          signature = readLatin1String(signature);
      
          function makeDynCaller(dynCall) {
              var args = [];
              for (var i = 1; i < signature.length; ++i) {
                  args.push('a' + i);
              }
      
              var name = 'dynCall_' + signature + '_' + rawFunction;
              var body = 'return function ' + name + '(' + args.join(', ') + ') {\n';
              body    += '    return dynCall(rawFunction' + (args.length ? ', ' : '') + args.join(', ') + ');\n';
              body    += '};\n';
      
              return (new Function('dynCall', 'rawFunction', body))(dynCall, rawFunction);
          }
      
          var fp;
          if (Module['FUNCTION_TABLE_' + signature] !== undefined) {
              fp = Module['FUNCTION_TABLE_' + signature][rawFunction];
          } else if (typeof FUNCTION_TABLE !== "undefined") {
              fp = FUNCTION_TABLE[rawFunction];
          } else {
              // asm.js does not give direct access to the function tables,
              // and thus we must go through the dynCall interface which allows
              // calling into a signature's function table by pointer value.
              //
              // https://github.com/dherman/asm.js/issues/83
              //
              // This has three main penalties:
              // - dynCall is another function call in the path from JavaScript to C++.
              // - JITs may not predict through the function table indirection at runtime.
              var dc = Module['dynCall_' + signature];
              if (dc === undefined) {
                  // We will always enter this branch if the signature
                  // contains 'f' and PRECISE_F32 is not enabled.
                  //
                  // Try again, replacing 'f' with 'd'.
                  dc = Module['dynCall_' + signature.replace(/f/g, 'd')];
                  if (dc === undefined) {
                      throwBindingError("No dynCall invoker for signature: " + signature);
                  }
              }
              fp = makeDynCaller(dc);
          }
      
          if (typeof fp !== "function") {
              throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction);
          }
          return fp;
        }
      
      
      var UnboundTypeError=undefined;
      
      function getTypeName(type) {
          var ptr = ___getTypeName(type);
          var rv = readLatin1String(ptr);
          _free(ptr);
          return rv;
        }function throwUnboundTypeError(message, types) {
          var unboundTypes = [];
          var seen = {};
          function visit(type) {
              if (seen[type]) {
                  return;
              }
              if (registeredTypes[type]) {
                  return;
              }
              if (typeDependencies[type]) {
                  typeDependencies[type].forEach(visit);
                  return;
              }
              unboundTypes.push(type);
              seen[type] = true;
          }
          types.forEach(visit);
      
          throw new UnboundTypeError(message + ': ' + unboundTypes.map(getTypeName).join([', ']));
        }function __embind_register_class(
          rawType,
          rawPointerType,
          rawConstPointerType,
          baseClassRawType,
          getActualTypeSignature,
          getActualType,
          upcastSignature,
          upcast,
          downcastSignature,
          downcast,
          name,
          destructorSignature,
          rawDestructor
        ) {
          name = readLatin1String(name);
          getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
          if (upcast) {
              upcast = embind__requireFunction(upcastSignature, upcast);
          }
          if (downcast) {
              downcast = embind__requireFunction(downcastSignature, downcast);
          }
          rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
          var legalFunctionName = makeLegalFunctionName(name);
      
          exposePublicSymbol(legalFunctionName, function() {
              // this code cannot run if baseClassRawType is zero
              throwUnboundTypeError('Cannot construct ' + name + ' due to unbound types', [baseClassRawType]);
          });
      
          whenDependentTypesAreResolved(
              [rawType, rawPointerType, rawConstPointerType],
              baseClassRawType ? [baseClassRawType] : [],
              function(base) {
                  base = base[0];
      
                  var baseClass;
                  var basePrototype;
                  if (baseClassRawType) {
                      baseClass = base.registeredClass;
                      basePrototype = baseClass.instancePrototype;
                  } else {
                      basePrototype = ClassHandle.prototype;
                  }
      
                  var constructor = createNamedFunction(legalFunctionName, function() {
                      if (Object.getPrototypeOf(this) !== instancePrototype) {
                          throw new BindingError("Use 'new' to construct " + name);
                      }
                      if (undefined === registeredClass.constructor_body) {
                          throw new BindingError(name + " has no accessible constructor");
                      }
                      var body = registeredClass.constructor_body[arguments.length];
                      if (undefined === body) {
                          throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!");
                      }
                      return body.apply(this, arguments);
                  });
      
                  var instancePrototype = Object.create(basePrototype, {
                      constructor: { value: constructor },
                  });
      
                  constructor.prototype = instancePrototype;
      
                  var registeredClass = new RegisteredClass(
                      name,
                      constructor,
                      instancePrototype,
                      rawDestructor,
                      baseClass,
                      getActualType,
                      upcast,
                      downcast);
      
                  var referenceConverter = new RegisteredPointer(
                      name,
                      registeredClass,
                      true,
                      false,
                      false);
      
                  var pointerConverter = new RegisteredPointer(
                      name + '*',
                      registeredClass,
                      false,
                      false,
                      false);
      
                  var constPointerConverter = new RegisteredPointer(
                      name + ' const*',
                      registeredClass,
                      false,
                      true,
                      false);
      
                  registeredPointers[rawType] = {
                      pointerType: pointerConverter,
                      constPointerType: constPointerConverter
                  };
      
                  replacePublicSymbol(legalFunctionName, constructor);
      
                  return [referenceConverter, pointerConverter, constPointerConverter];
              }
          );
        }

      
      function heap32VectorToArray(count, firstElement) {
          var array = [];
          for (var i = 0; i < count; i++) {
              array.push(HEAP32[(firstElement >> 2) + i]);
          }
          return array;
        }
      
      function runDestructors(destructors) {
          while (destructors.length) {
              var ptr = destructors.pop();
              var del = destructors.pop();
              del(ptr);
          }
        }function __embind_register_class_constructor(
          rawClassType,
          argCount,
          rawArgTypesAddr,
          invokerSignature,
          invoker,
          rawConstructor
        ) {
          var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
          invoker = embind__requireFunction(invokerSignature, invoker);
      
          whenDependentTypesAreResolved([], [rawClassType], function(classType) {
              classType = classType[0];
              var humanName = 'constructor ' + classType.name;
      
              if (undefined === classType.registeredClass.constructor_body) {
                  classType.registeredClass.constructor_body = [];
              }
              if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
                  throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount-1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");
              }
              classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
                  throwUnboundTypeError('Cannot construct ' + classType.name + ' due to unbound types', rawArgTypes);
              };
      
              whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
                  classType.registeredClass.constructor_body[argCount - 1] = function constructor_body() {
                      if (arguments.length !== argCount - 1) {
                          throwBindingError(humanName + ' called with ' + arguments.length + ' arguments, expected ' + (argCount-1));
                      }
                      var destructors = [];
                      var args = new Array(argCount);
                      args[0] = rawConstructor;
                      for (var i = 1; i < argCount; ++i) {
                          args[i] = argTypes[i]['toWireType'](destructors, arguments[i - 1]);
                      }
      
                      var ptr = invoker.apply(null, args);
                      runDestructors(destructors);
      
                      return argTypes[0]['fromWireType'](ptr);
                  };
                  return [];
              });
              return [];
          });
        }

      
      
      function new_(constructor, argumentList) {
          if (!(constructor instanceof Function)) {
              throw new TypeError('new_ called with constructor type ' + typeof(constructor) + " which is not a function");
          }
      
          /*
           * Previously, the following line was just:
      
           function dummy() {};
      
           * Unfortunately, Chrome was preserving 'dummy' as the object's name, even though at creation, the 'dummy' has the
           * correct constructor name.  Thus, objects created with IMVU.new would show up in the debugger as 'dummy', which
           * isn't very helpful.  Using IMVU.createNamedFunction addresses the issue.  Doublely-unfortunately, there's no way
           * to write a test for this behavior.  -NRD 2013.02.22
           */
          var dummy = createNamedFunction(constructor.name || 'unknownFunctionName', function(){});
          dummy.prototype = constructor.prototype;
          var obj = new dummy;
      
          var r = constructor.apply(obj, argumentList);
          return (r instanceof Object) ? r : obj;
        }function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
          // humanName: a human-readable string name for the function to be generated.
          // argTypes: An array that contains the embind type objects for all types in the function signature.
          //    argTypes[0] is the type object for the function return value.
          //    argTypes[1] is the type object for function this object/class type, or null if not crafting an invoker for a class method.
          //    argTypes[2...] are the actual function parameters.
          // classType: The embind type object for the class to be bound, or null if this is not a method of a class.
          // cppInvokerFunc: JS Function object to the C++-side function that interops into C++ code.
          // cppTargetFunc: Function pointer (an integer to FUNCTION_TABLE) to the target C++ function the cppInvokerFunc will end up calling.
          var argCount = argTypes.length;
      
          if (argCount < 2) {
              throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
          }
      
          var isClassMethodFunc = (argTypes[1] !== null && classType !== null);
      
          // Free functions with signature "void function()" do not need an invoker that marshalls between wire types.
      // TODO: This omits argument count check - enable only at -O3 or similar.
      //    if (ENABLE_UNSAFE_OPTS && argCount == 2 && argTypes[0].name == "void" && !isClassMethodFunc) {
      //       return FUNCTION_TABLE[fn];
      //    }
      
      
          // Determine if we need to use a dynamic stack to store the destructors for the function parameters.
          // TODO: Remove this completely once all function invokers are being dynamically generated.
          var needsDestructorStack = false;
      
          for(var i = 1; i < argTypes.length; ++i) { // Skip return value at index 0 - it's not deleted here.
              if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) { // The type does not define a destructor function - must use dynamic stack
                  needsDestructorStack = true;
                  break;
              }
          }
      
          var returns = (argTypes[0].name !== "void");
      
          var argsList = "";
          var argsListWired = "";
          for(var i = 0; i < argCount - 2; ++i) {
              argsList += (i!==0?", ":"")+"arg"+i;
              argsListWired += (i!==0?", ":"")+"arg"+i+"Wired";
          }
      
          var invokerFnBody =
              "return function "+makeLegalFunctionName(humanName)+"("+argsList+") {\n" +
              "if (arguments.length !== "+(argCount - 2)+") {\n" +
                  "throwBindingError('function "+humanName+" called with ' + arguments.length + ' arguments, expected "+(argCount - 2)+" args!');\n" +
              "}\n";
      
      
          if (needsDestructorStack) {
              invokerFnBody +=
                  "var destructors = [];\n";
          }
      
          var dtorStack = needsDestructorStack ? "destructors" : "null";
          var args1 = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
          var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
      
      
          if (isClassMethodFunc) {
              invokerFnBody += "var thisWired = classParam.toWireType("+dtorStack+", this);\n";
          }
      
          for(var i = 0; i < argCount - 2; ++i) {
              invokerFnBody += "var arg"+i+"Wired = argType"+i+".toWireType("+dtorStack+", arg"+i+"); // "+argTypes[i+2].name+"\n";
              args1.push("argType"+i);
              args2.push(argTypes[i+2]);
          }
      
          if (isClassMethodFunc) {
              argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
          }
      
          invokerFnBody +=
              (returns?"var rv = ":"") + "invoker(fn"+(argsListWired.length>0?", ":"")+argsListWired+");\n";
      
          if (needsDestructorStack) {
              invokerFnBody += "runDestructors(destructors);\n";
          } else {
              for(var i = isClassMethodFunc?1:2; i < argTypes.length; ++i) { // Skip return value at index 0 - it's not deleted here. Also skip class type if not a method.
                  var paramName = (i === 1 ? "thisWired" : ("arg"+(i - 2)+"Wired"));
                  if (argTypes[i].destructorFunction !== null) {
                      invokerFnBody += paramName+"_dtor("+paramName+"); // "+argTypes[i].name+"\n";
                      args1.push(paramName+"_dtor");
                      args2.push(argTypes[i].destructorFunction);
                  }
              }
          }
      
          if (returns) {
              invokerFnBody += "var ret = retType.fromWireType(rv);\n" +
                               "return ret;\n";
          } else {
          }
          invokerFnBody += "}\n";
      
          args1.push(invokerFnBody);
      
          var invokerFunction = new_(Function, args1).apply(null, args2);
          return invokerFunction;
        }function __embind_register_class_function(
          rawClassType,
          methodName,
          argCount,
          rawArgTypesAddr, // [ReturnType, ThisType, Args...]
          invokerSignature,
          rawInvoker,
          context,
          isPureVirtual
        ) {
          var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
          methodName = readLatin1String(methodName);
          rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
      
          whenDependentTypesAreResolved([], [rawClassType], function(classType) {
              classType = classType[0];
              var humanName = classType.name + '.' + methodName;
      
              if (isPureVirtual) {
                  classType.registeredClass.pureVirtualFunctions.push(methodName);
              }
      
              function unboundTypesHandler() {
                  throwUnboundTypeError('Cannot call ' + humanName + ' due to unbound types', rawArgTypes);
              }
      
              var proto = classType.registeredClass.instancePrototype;
              var method = proto[methodName];
              if (undefined === method || (undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2)) {
                  // This is the first overload to be registered, OR we are replacing a function in the base class with a function in the derived class.
                  unboundTypesHandler.argCount = argCount - 2;
                  unboundTypesHandler.className = classType.name;
                  proto[methodName] = unboundTypesHandler;
              } else {
                  // There was an existing function with the same name registered. Set up a function overload routing table.
                  ensureOverloadTable(proto, methodName, humanName);
                  proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
              }
      
              whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
      
                  var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);
      
                  // Replace the initial unbound-handler-stub function with the appropriate member function, now that all types
                  // are resolved. If multiple overloads are registered for this function, the function goes into an overload table.
                  if (undefined === proto[methodName].overloadTable) {
                      // Set argCount in case an overload is registered later
                      memberFunction.argCount = argCount - 2;
                      proto[methodName] = memberFunction;
                  } else {
                      proto[methodName].overloadTable[argCount - 2] = memberFunction;
                  }
      
                  return [];
              });
              return [];
          });
        }

      
      function validateThis(this_, classType, humanName) {
          if (!(this_ instanceof Object)) {
              throwBindingError(humanName + ' with invalid "this": ' + this_);
          }
          if (!(this_ instanceof classType.registeredClass.constructor)) {
              throwBindingError(humanName + ' incompatible with "this" of type ' + this_.constructor.name);
          }
          if (!this_.$$.ptr) {
              throwBindingError('cannot call emscripten binding method ' + humanName + ' on deleted object');
          }
      
          // todo: kill this
          return upcastPointer(
              this_.$$.ptr,
              this_.$$.ptrType.registeredClass,
              classType.registeredClass);
        }function __embind_register_class_property(
          classType,
          fieldName,
          getterReturnType,
          getterSignature,
          getter,
          getterContext,
          setterArgumentType,
          setterSignature,
          setter,
          setterContext
        ) {
          fieldName = readLatin1String(fieldName);
          getter = embind__requireFunction(getterSignature, getter);
      
          whenDependentTypesAreResolved([], [classType], function(classType) {
              classType = classType[0];
              var humanName = classType.name + '.' + fieldName;
              var desc = {
                  get: function() {
                      throwUnboundTypeError('Cannot access ' + humanName + ' due to unbound types', [getterReturnType, setterArgumentType]);
                  },
                  enumerable: true,
                  configurable: true
              };
              if (setter) {
                  desc.set = function() {
                      throwUnboundTypeError('Cannot access ' + humanName + ' due to unbound types', [getterReturnType, setterArgumentType]);
                  };
              } else {
                  desc.set = function(v) {
                      throwBindingError(humanName + ' is a read-only property');
                  };
              }
      
              Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
      
              whenDependentTypesAreResolved(
                  [],
                  (setter ? [getterReturnType, setterArgumentType] : [getterReturnType]),
              function(types) {
                  var getterReturnType = types[0];
                  var desc = {
                      get: function() {
                          var ptr = validateThis(this, classType, humanName + ' getter');
                          return getterReturnType['fromWireType'](getter(getterContext, ptr));
                      },
                      enumerable: true
                  };
      
                  if (setter) {
                      setter = embind__requireFunction(setterSignature, setter);
                      var setterArgumentType = types[1];
                      desc.set = function(v) {
                          var ptr = validateThis(this, classType, humanName + ' setter');
                          var destructors = [];
                          setter(setterContext, ptr, setterArgumentType['toWireType'](destructors, v));
                          runDestructors(destructors);
                      };
                  }
      
                  Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
                  return [];
              });
      
              return [];
          });
        }

      
      
      var emval_free_list=[];
      
      var emval_handle_array=[{},{value:undefined},{value:null},{value:true},{value:false}];function __emval_decref(handle) {
          if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
              emval_handle_array[handle] = undefined;
              emval_free_list.push(handle);
          }
        }
      
      
      
      function count_emval_handles() {
          var count = 0;
          for (var i = 5; i < emval_handle_array.length; ++i) {
              if (emval_handle_array[i] !== undefined) {
                  ++count;
              }
          }
          return count;
        }
      
      function get_first_emval() {
          for (var i = 5; i < emval_handle_array.length; ++i) {
              if (emval_handle_array[i] !== undefined) {
                  return emval_handle_array[i];
              }
          }
          return null;
        }function init_emval() {
          Module['count_emval_handles'] = count_emval_handles;
          Module['get_first_emval'] = get_first_emval;
        }function __emval_register(value) {
      
          switch(value){
            case undefined :{ return 1; }
            case null :{ return 2; }
            case true :{ return 3; }
            case false :{ return 4; }
            default:{
              var handle = emval_free_list.length ?
                  emval_free_list.pop() :
                  emval_handle_array.length;
      
              emval_handle_array[handle] = {refcount: 1, value: value};
              return handle;
              }
            }
        }function __embind_register_emval(rawType, name) {
          name = readLatin1String(name);
          registerType(rawType, {
              name: name,
              'fromWireType': function(handle) {
                  var rv = emval_handle_array[handle].value;
                  __emval_decref(handle);
                  return rv;
              },
              'toWireType': function(destructors, value) {
                  return __emval_register(value);
              },
              'argPackAdvance': 8,
              'readValueFromPointer': simpleReadValueFromPointer,
              destructorFunction: null, // This type does not need a destructor
      
              // TODO: do we need a deleteObject here?  write a test where
              // emval is passed into JS via an interface
          });
        }

      
      function _embind_repr(v) {
          if (v === null) {
              return 'null';
          }
          var t = typeof v;
          if (t === 'object' || t === 'array' || t === 'function') {
              return v.toString();
          } else {
              return '' + v;
          }
        }
      
      function floatReadValueFromPointer(name, shift) {
          switch (shift) {
              case 2: return function(pointer) {
                  return this['fromWireType'](HEAPF32[pointer >> 2]);
              };
              case 3: return function(pointer) {
                  return this['fromWireType'](HEAPF64[pointer >> 3]);
              };
              default:
                  throw new TypeError("Unknown float type: " + name);
          }
        }function __embind_register_float(rawType, name, size) {
          var shift = getShiftFromSize(size);
          name = readLatin1String(name);
          registerType(rawType, {
              name: name,
              'fromWireType': function(value) {
                  return value;
              },
              'toWireType': function(destructors, value) {
                  // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
                  // avoid the following if() and assume value is of proper type.
                  if (typeof value !== "number" && typeof value !== "boolean") {
                      throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
                  }
                  return value;
              },
              'argPackAdvance': 8,
              'readValueFromPointer': floatReadValueFromPointer(name, shift),
              destructorFunction: null, // This type does not need a destructor
          });
        }

      
      function integerReadValueFromPointer(name, shift, signed) {
          // integers are quite common, so generate very specialized functions
          switch (shift) {
              case 0: return signed ?
                  function readS8FromPointer(pointer) { return HEAP8[pointer]; } :
                  function readU8FromPointer(pointer) { return HEAPU8[pointer]; };
              case 1: return signed ?
                  function readS16FromPointer(pointer) { return HEAP16[pointer >> 1]; } :
                  function readU16FromPointer(pointer) { return HEAPU16[pointer >> 1]; };
              case 2: return signed ?
                  function readS32FromPointer(pointer) { return HEAP32[pointer >> 2]; } :
                  function readU32FromPointer(pointer) { return HEAPU32[pointer >> 2]; };
              default:
                  throw new TypeError("Unknown integer type: " + name);
          }
        }function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
          name = readLatin1String(name);
          if (maxRange === -1) { // LLVM doesn't have signed and unsigned 32-bit types, so u32 literals come out as 'i32 -1'. Always treat those as max u32.
              maxRange = 4294967295;
          }
      
          var shift = getShiftFromSize(size);
      
          var fromWireType = function(value) {
              return value;
          };
      
          if (minRange === 0) {
              var bitshift = 32 - 8*size;
              fromWireType = function(value) {
                  return (value << bitshift) >>> bitshift;
              };
          }
      
          var isUnsignedType = (name.indexOf('unsigned') != -1);
      
          registerType(primitiveType, {
              name: name,
              'fromWireType': fromWireType,
              'toWireType': function(destructors, value) {
                  // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
                  // avoid the following two if()s and assume value is of proper type.
                  if (typeof value !== "number" && typeof value !== "boolean") {
                      throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
                  }
                  if (value < minRange || value > maxRange) {
                      throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ', ' + maxRange + ']!');
                  }
                  return isUnsignedType ? (value >>> 0) : (value | 0);
              },
              'argPackAdvance': 8,
              'readValueFromPointer': integerReadValueFromPointer(name, shift, minRange !== 0),
              destructorFunction: null, // This type does not need a destructor
          });
        }

      function __embind_register_memory_view(rawType, dataTypeIndex, name) {
          var typeMapping = [
              Int8Array,
              Uint8Array,
              Int16Array,
              Uint16Array,
              Int32Array,
              Uint32Array,
              Float32Array,
              Float64Array,
          ];
      
          var TA = typeMapping[dataTypeIndex];
      
          function decodeMemoryView(handle) {
              handle = handle >> 2;
              var heap = HEAPU32;
              var size = heap[handle]; // in elements
              var data = heap[handle + 1]; // byte offset into emscripten heap
              return new TA(heap['buffer'], data, size);
          }
      
          name = readLatin1String(name);
          registerType(rawType, {
              name: name,
              'fromWireType': decodeMemoryView,
              'argPackAdvance': 8,
              'readValueFromPointer': decodeMemoryView,
          }, {
              ignoreDuplicateRegistrations: true,
          });
        }

      function __embind_register_std_string(rawType, name) {
          name = readLatin1String(name);
          var stdStringIsUTF8
          //process only std::string bindings with UTF8 support, in contrast to e.g. std::basic_string<unsigned char>
          = (name === "std::string");
      
          registerType(rawType, {
              name: name,
              'fromWireType': function(value) {
                  var length = HEAPU32[value >> 2];
      
                  var str;
                  if(stdStringIsUTF8) {
                      //ensure null termination at one-past-end byte if not present yet
                      var endChar = HEAPU8[value + 4 + length];
                      var endCharSwap = 0;
                      if(endChar != 0)
                      {
                        endCharSwap = endChar;
                        HEAPU8[value + 4 + length] = 0;
                      }
      
                      var decodeStartPtr = value + 4;
                      //looping here to support possible embedded '0' bytes
                      for (var i = 0; i <= length; ++i) {
                        var currentBytePtr = value + 4 + i;
                        if(HEAPU8[currentBytePtr] == 0)
                        {
                          var stringSegment = UTF8ToString(decodeStartPtr);
                          if(str === undefined)
                            str = stringSegment;
                          else
                          {
                            str += String.fromCharCode(0);
                            str += stringSegment;
                          }
                          decodeStartPtr = currentBytePtr + 1;
                        }
                      }
      
                      if(endCharSwap != 0)
                        HEAPU8[value + 4 + length] = endCharSwap;
                  } else {
                      var a = new Array(length);
                      for (var i = 0; i < length; ++i) {
                          a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
                      }
                      str = a.join('');
                  }
      
                  _free(value);
                  
                  return str;
              },
              'toWireType': function(destructors, value) {
                  if (value instanceof ArrayBuffer) {
                      value = new Uint8Array(value);
                  }
                  
                  var getLength;
                  var valueIsOfTypeString = (typeof value === 'string');
      
                  if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
                      throwBindingError('Cannot pass non-string to std::string');
                  }
                  if (stdStringIsUTF8 && valueIsOfTypeString) {
                      getLength = function() {return lengthBytesUTF8(value);};
                  } else {
                      getLength = function() {return value.length;};
                  }
                  
                  // assumes 4-byte alignment
                  var length = getLength();
                  var ptr = _malloc(4 + length + 1);
                  HEAPU32[ptr >> 2] = length;
      
                  if (stdStringIsUTF8 && valueIsOfTypeString) {
                      stringToUTF8(value, ptr + 4, length + 1);
                  } else {
                      if(valueIsOfTypeString) {
                          for (var i = 0; i < length; ++i) {
                              var charCode = value.charCodeAt(i);
                              if (charCode > 255) {
                                  _free(ptr);
                                  throwBindingError('String has UTF-16 code units that do not fit in 8 bits');
                              }
                              HEAPU8[ptr + 4 + i] = charCode;
                          }
                      } else {
                          for (var i = 0; i < length; ++i) {
                              HEAPU8[ptr + 4 + i] = value[i];
                          }
                      }
                  }
      
                  if (destructors !== null) {
                      destructors.push(_free, ptr);
                  }
                  return ptr;
              },
              'argPackAdvance': 8,
              'readValueFromPointer': simpleReadValueFromPointer,
              destructorFunction: function(ptr) { _free(ptr); },
          });
        }

      function __embind_register_std_wstring(rawType, charSize, name) {
          // nb. do not cache HEAPU16 and HEAPU32, they may be destroyed by emscripten_resize_heap().
          name = readLatin1String(name);
          var getHeap, shift;
          if (charSize === 2) {
              getHeap = function() { return HEAPU16; };
              shift = 1;
          } else if (charSize === 4) {
              getHeap = function() { return HEAPU32; };
              shift = 2;
          }
          registerType(rawType, {
              name: name,
              'fromWireType': function(value) {
                  var HEAP = getHeap();
                  var length = HEAPU32[value >> 2];
                  var a = new Array(length);
                  var start = (value + 4) >> shift;
                  for (var i = 0; i < length; ++i) {
                      a[i] = String.fromCharCode(HEAP[start + i]);
                  }
                  _free(value);
                  return a.join('');
              },
              'toWireType': function(destructors, value) {
                  // assumes 4-byte alignment
                  var HEAP = getHeap();
                  var length = value.length;
                  var ptr = _malloc(4 + length * charSize);
                  HEAPU32[ptr >> 2] = length;
                  var start = (ptr + 4) >> shift;
                  for (var i = 0; i < length; ++i) {
                      HEAP[start + i] = value.charCodeAt(i);
                  }
                  if (destructors !== null) {
                      destructors.push(_free, ptr);
                  }
                  return ptr;
              },
              'argPackAdvance': 8,
              'readValueFromPointer': simpleReadValueFromPointer,
              destructorFunction: function(ptr) { _free(ptr); },
          });
        }

      function __embind_register_void(rawType, name) {
          name = readLatin1String(name);
          registerType(rawType, {
              isVoid: true, // void return values can be optimized out sometimes
              name: name,
              'argPackAdvance': 0,
              'fromWireType': function() {
                  return undefined;
              },
              'toWireType': function(destructors, o) {
                  // TODO: assert if anything else is given?
                  return undefined;
              },
          });
        }

      function _abort() {
          Module['abort']();
        }

      function _emscripten_get_heap_size() {
          return HEAP8.length;
        }

      
      var ENV={};function _getenv(name) {
          // char *getenv(const char *name);
          // http://pubs.opengroup.org/onlinepubs/009695399/functions/getenv.html
          if (name === 0) return 0;
          name = UTF8ToString(name);
          if (!ENV.hasOwnProperty(name)) return 0;
      
          if (_getenv.ret) _free(_getenv.ret);
          _getenv.ret = allocateUTF8(ENV[name]);
          return _getenv.ret;
        }

      function _llvm_stackrestore(p) {
          var self = _llvm_stacksave;
          var ret = self.LLVM_SAVEDSTACKS[p];
          self.LLVM_SAVEDSTACKS.splice(p, 1);
          stackRestore(ret);
        }

      function _llvm_stacksave() {
          var self = _llvm_stacksave;
          if (!self.LLVM_SAVEDSTACKS) {
            self.LLVM_SAVEDSTACKS = [];
          }
          self.LLVM_SAVEDSTACKS.push(stackSave());
          return self.LLVM_SAVEDSTACKS.length-1;
        }

      
      function _emscripten_memcpy_big(dest, src, num) {
          HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
        }
      
       

       

       

       

      function _pthread_cond_wait() { return 0; }

      
      
      function abortOnCannotGrowMemory(requestedSize) {
          abort('Cannot enlarge memory arrays to size ' + requestedSize + ' bytes (OOM). Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value ' + HEAP8.length + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
        }
      
      function emscripten_realloc_buffer(size) {
          var PAGE_MULTIPLE = 65536;
          size = alignUp(size, PAGE_MULTIPLE); // round up to wasm page size
          var oldSize = buffer.byteLength;
          // native wasm support
          // note that this is *not* threadsafe. multiple threads can call .grow(), and each
          // presents a delta, so in theory we may over-allocate here (e.g. if two threads
          // ask to grow from 256MB to 512MB, we get 2 requests to add +256MB, and may end
          // up growing to 768MB (even though we may have been able to make do with 512MB).
          // TODO: consider decreasing the step sizes in emscripten_resize_heap
          try {
            var result = wasmMemory.grow((size - oldSize) / 65536); // .grow() takes a delta compared to the previous size
            if (result !== (-1 | 0)) {
              // success in native wasm memory growth, get the buffer from the memory
              buffer = wasmMemory.buffer;
              return true;
            } else {
              return false;
            }
          } catch(e) {
            console.error('emscripten_realloc_buffer: Attempted to grow from ' + oldSize  + ' bytes to ' + size + ' bytes, but got error: ' + e);
            return false;
          }
        }function _emscripten_resize_heap(requestedSize) {
          var oldSize = _emscripten_get_heap_size();
          // With pthreads, races can happen (another thread might increase the size in between), so return a failure, and let the caller retry.
          assert(requestedSize > oldSize);
      
      
          var PAGE_MULTIPLE = 65536;
          var LIMIT = 2147483648 - PAGE_MULTIPLE; // We can do one page short of 2GB as theoretical maximum.
      
          if (requestedSize > LIMIT) {
            err('Cannot enlarge memory, asked to go up to ' + requestedSize + ' bytes, but the limit is ' + LIMIT + ' bytes!');
            return false;
          }
      
          var MIN_TOTAL_MEMORY = 16777216;
          var newSize = Math.max(oldSize, MIN_TOTAL_MEMORY); // So the loop below will not be infinite, and minimum asm.js memory size is 16MB.
      
          // TODO: see realloc_buffer - for PTHREADS we may want to decrease these jumps
          while (newSize < requestedSize) { // Keep incrementing the heap size as long as it's less than what is requested.
            if (newSize <= 536870912) {
              newSize = alignUp(2 * newSize, PAGE_MULTIPLE); // Simple heuristic: double until 1GB...
            } else {
              // ..., but after that, add smaller increments towards 2GB, which we cannot reach
              newSize = Math.min(alignUp((3 * newSize + 2147483648) / 4, PAGE_MULTIPLE), LIMIT);
            }
      
            if (newSize === oldSize) {
              warnOnce('Cannot ask for more memory since we reached the practical limit in browsers (which is just below 2GB), so the request would have failed. Requesting only ' + HEAP8.length);
            }
          }
      
      
      
          var start = Date.now();
      
          if (!emscripten_realloc_buffer(newSize)) {
            err('Failed to grow the heap from ' + oldSize + ' bytes to ' + newSize + ' bytes, not enough memory!');
            return false;
          }
      
          updateGlobalBufferViews();
      
      
      
          return true;
        } 

      
      
      function __isLeapYear(year) {
            return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
        }
      
      function __arraySum(array, index) {
          var sum = 0;
          for (var i = 0; i <= index; sum += array[i++]);
          return sum;
        }
      
      
      var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];
      
      var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date, days) {
          var newDate = new Date(date.getTime());
          while(days > 0) {
            var leap = __isLeapYear(newDate.getFullYear());
            var currentMonth = newDate.getMonth();
            var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
      
            if (days > daysInCurrentMonth-newDate.getDate()) {
              // we spill over to next month
              days -= (daysInCurrentMonth-newDate.getDate()+1);
              newDate.setDate(1);
              if (currentMonth < 11) {
                newDate.setMonth(currentMonth+1);
              } else {
                newDate.setMonth(0);
                newDate.setFullYear(newDate.getFullYear()+1);
              }
            } else {
              // we stay in current month
              newDate.setDate(newDate.getDate()+days);
              return newDate;
            }
          }
      
          return newDate;
        }function _strftime(s, maxsize, format, tm) {
          // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
          // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
      
          var tm_zone = HEAP32[(((tm)+(40))>>2)];
      
          var date = {
            tm_sec: HEAP32[((tm)>>2)],
            tm_min: HEAP32[(((tm)+(4))>>2)],
            tm_hour: HEAP32[(((tm)+(8))>>2)],
            tm_mday: HEAP32[(((tm)+(12))>>2)],
            tm_mon: HEAP32[(((tm)+(16))>>2)],
            tm_year: HEAP32[(((tm)+(20))>>2)],
            tm_wday: HEAP32[(((tm)+(24))>>2)],
            tm_yday: HEAP32[(((tm)+(28))>>2)],
            tm_isdst: HEAP32[(((tm)+(32))>>2)],
            tm_gmtoff: HEAP32[(((tm)+(36))>>2)],
            tm_zone: tm_zone ? UTF8ToString(tm_zone) : ''
          };
      
          var pattern = UTF8ToString(format);
      
          // expand format
          var EXPANSION_RULES_1 = {
            '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
            '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
            '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
            '%h': '%b',                       // Equivalent to %b
            '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
            '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
            '%T': '%H:%M:%S',                 // Replaced by the time
            '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
            '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate time representation
            // Modified Conversion Specifiers
            '%Ec': '%c',                      // Replaced by the locale's alternative appropriate date and time representation.
            '%EC': '%C',                      // Replaced by the name of the base year (period) in the locale's alternative representation.
            '%Ex': '%m/%d/%y',                // Replaced by the locale's alternative date representation.
            '%EX': '%H:%M:%S',                // Replaced by the locale's alternative time representation.
            '%Ey': '%y',                      // Replaced by the offset from %EC (year only) in the locale's alternative representation.
            '%EY': '%Y',                      // Replaced by the full alternative year representation.
            '%Od': '%d',                      // Replaced by the day of the month, using the locale's alternative numeric symbols, filled as needed with leading zeros if there is any alternative symbol for zero; otherwise, with leading <space> characters.
            '%Oe': '%e',                      // Replaced by the day of the month, using the locale's alternative numeric symbols, filled as needed with leading <space> characters.
            '%OH': '%H',                      // Replaced by the hour (24-hour clock) using the locale's alternative numeric symbols.
            '%OI': '%I',                      // Replaced by the hour (12-hour clock) using the locale's alternative numeric symbols.
            '%Om': '%m',                      // Replaced by the month using the locale's alternative numeric symbols.
            '%OM': '%M',                      // Replaced by the minutes using the locale's alternative numeric symbols.
            '%OS': '%S',                      // Replaced by the seconds using the locale's alternative numeric symbols.
            '%Ou': '%u',                      // Replaced by the weekday as a number in the locale's alternative representation (Monday=1).
            '%OU': '%U',                      // Replaced by the week number of the year (Sunday as the first day of the week, rules corresponding to %U ) using the locale's alternative numeric symbols.
            '%OV': '%V',                      // Replaced by the week number of the year (Monday as the first day of the week, rules corresponding to %V ) using the locale's alternative numeric symbols.
            '%Ow': '%w',                      // Replaced by the number of the weekday (Sunday=0) using the locale's alternative numeric symbols.
            '%OW': '%W',                      // Replaced by the week number of the year (Monday as the first day of the week) using the locale's alternative numeric symbols.
            '%Oy': '%y',                      // Replaced by the year (offset from %C ) using the locale's alternative numeric symbols.
          };
          for (var rule in EXPANSION_RULES_1) {
            pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
          }
      
          var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      
          function leadingSomething(value, digits, character) {
            var str = typeof value === 'number' ? value.toString() : (value || '');
            while (str.length < digits) {
              str = character[0]+str;
            }
            return str;
          }
      
          function leadingNulls(value, digits) {
            return leadingSomething(value, digits, '0');
          }
      
          function compareByDay(date1, date2) {
            function sgn(value) {
              return value < 0 ? -1 : (value > 0 ? 1 : 0);
            }
      
            var compare;
            if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
              if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
                compare = sgn(date1.getDate()-date2.getDate());
              }
            }
            return compare;
          }
      
          function getFirstWeekStartDate(janFourth) {
              switch (janFourth.getDay()) {
                case 0: // Sunday
                  return new Date(janFourth.getFullYear()-1, 11, 29);
                case 1: // Monday
                  return janFourth;
                case 2: // Tuesday
                  return new Date(janFourth.getFullYear(), 0, 3);
                case 3: // Wednesday
                  return new Date(janFourth.getFullYear(), 0, 2);
                case 4: // Thursday
                  return new Date(janFourth.getFullYear(), 0, 1);
                case 5: // Friday
                  return new Date(janFourth.getFullYear()-1, 11, 31);
                case 6: // Saturday
                  return new Date(janFourth.getFullYear()-1, 11, 30);
              }
          }
      
          function getWeekBasedYear(date) {
              var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
      
              var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
              var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
      
              var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
              var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
      
              if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
                // this date is after the start of the first week of this year
                if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
                  return thisDate.getFullYear()+1;
                } else {
                  return thisDate.getFullYear();
                }
              } else {
                return thisDate.getFullYear()-1;
              }
          }
      
          var EXPANSION_RULES_2 = {
            '%a': function(date) {
              return WEEKDAYS[date.tm_wday].substring(0,3);
            },
            '%A': function(date) {
              return WEEKDAYS[date.tm_wday];
            },
            '%b': function(date) {
              return MONTHS[date.tm_mon].substring(0,3);
            },
            '%B': function(date) {
              return MONTHS[date.tm_mon];
            },
            '%C': function(date) {
              var year = date.tm_year+1900;
              return leadingNulls((year/100)|0,2);
            },
            '%d': function(date) {
              return leadingNulls(date.tm_mday, 2);
            },
            '%e': function(date) {
              return leadingSomething(date.tm_mday, 2, ' ');
            },
            '%g': function(date) {
              // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year.
              // In this system, weeks begin on a Monday and week 1 of the year is the week that includes
              // January 4th, which is also the week that includes the first Thursday of the year, and
              // is also the first week that contains at least four days in the year.
              // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of
              // the last week of the preceding year; thus, for Saturday 2nd January 1999,
              // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th,
              // or 31st is a Monday, it and any following days are part of week 1 of the following year.
              // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
      
              return getWeekBasedYear(date).toString().substring(2);
            },
            '%G': function(date) {
              return getWeekBasedYear(date);
            },
            '%H': function(date) {
              return leadingNulls(date.tm_hour, 2);
            },
            '%I': function(date) {
              var twelveHour = date.tm_hour;
              if (twelveHour == 0) twelveHour = 12;
              else if (twelveHour > 12) twelveHour -= 12;
              return leadingNulls(twelveHour, 2);
            },
            '%j': function(date) {
              // Day of the year (001-366)
              return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
            },
            '%m': function(date) {
              return leadingNulls(date.tm_mon+1, 2);
            },
            '%M': function(date) {
              return leadingNulls(date.tm_min, 2);
            },
            '%n': function() {
              return '\n';
            },
            '%p': function(date) {
              if (date.tm_hour >= 0 && date.tm_hour < 12) {
                return 'AM';
              } else {
                return 'PM';
              }
            },
            '%S': function(date) {
              return leadingNulls(date.tm_sec, 2);
            },
            '%t': function() {
              return '\t';
            },
            '%u': function(date) {
              return date.tm_wday || 7;
            },
            '%U': function(date) {
              // Replaced by the week number of the year as a decimal number [00,53].
              // The first Sunday of January is the first day of week 1;
              // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
              var janFirst = new Date(date.tm_year+1900, 0, 1);
              var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
              var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
      
              // is target date after the first Sunday?
              if (compareByDay(firstSunday, endDate) < 0) {
                // calculate difference in days between first Sunday and endDate
                var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
                var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
                var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
                return leadingNulls(Math.ceil(days/7), 2);
              }
      
              return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
            },
            '%V': function(date) {
              // Replaced by the week number of the year (Monday as the first day of the week)
              // as a decimal number [01,53]. If the week containing 1 January has four
              // or more days in the new year, then it is considered week 1.
              // Otherwise, it is the last week of the previous year, and the next week is week 1.
              // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
              var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
              var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
      
              var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
              var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
      
              var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
      
              if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
                // if given date is before this years first week, then it belongs to the 53rd week of last year
                return '53';
              }
      
              if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
                // if given date is after next years first week, then it belongs to the 01th week of next year
                return '01';
              }
      
              // given date is in between CW 01..53 of this calendar year
              var daysDifference;
              if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
                // first CW of this year starts last year
                daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate();
              } else {
                // first CW of this year starts this year
                daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
              }
              return leadingNulls(Math.ceil(daysDifference/7), 2);
            },
            '%w': function(date) {
              return date.tm_wday;
            },
            '%W': function(date) {
              // Replaced by the week number of the year as a decimal number [00,53].
              // The first Monday of January is the first day of week 1;
              // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
              var janFirst = new Date(date.tm_year, 0, 1);
              var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
              var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
      
              // is target date after the first Monday?
              if (compareByDay(firstMonday, endDate) < 0) {
                var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
                var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
                var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
                return leadingNulls(Math.ceil(days/7), 2);
              }
              return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
            },
            '%y': function(date) {
              // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
              return (date.tm_year+1900).toString().substring(2);
            },
            '%Y': function(date) {
              // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
              return date.tm_year+1900;
            },
            '%z': function(date) {
              // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ).
              // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich).
              var off = date.tm_gmtoff;
              var ahead = off >= 0;
              off = Math.abs(off) / 60;
              // convert from minutes into hhmm format (which means 60 minutes = 100 units)
              off = (off / 60)*100 + (off % 60);
              return (ahead ? '+' : '-') + String("0000" + off).slice(-4);
            },
            '%Z': function(date) {
              return date.tm_zone;
            },
            '%%': function() {
              return '%';
            }
          };
          for (var rule in EXPANSION_RULES_2) {
            if (pattern.indexOf(rule) >= 0) {
              pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
            }
          }
      
          var bytes = intArrayFromString(pattern, false);
          if (bytes.length > maxsize) {
            return 0;
          }
      
          writeArrayToMemory(bytes, s);
          return bytes.length-1;
        }function _strftime_l(s, maxsize, format, tm) {
          return _strftime(s, maxsize, format, tm); // no locale support yet
        }
    FS.staticInit();;
    if (ENVIRONMENT_HAS_NODE) { var fs = require("fs"); var NODEJS_PATH = require("path"); NODEFS.staticInit(); };
    embind_init_charCodes();
    BindingError = Module['BindingError'] = extendError(Error, 'BindingError');;
    InternalError = Module['InternalError'] = extendError(Error, 'InternalError');;
    init_ClassHandle();
    init_RegisteredPointer();
    init_embind();;
    UnboundTypeError = Module['UnboundTypeError'] = extendError(Error, 'UnboundTypeError');;
    init_emval();;
    var ASSERTIONS = true;

    // Copyright 2017 The Emscripten Authors.  All rights reserved.
    // Emscripten is available under two separate licenses, the MIT license and the
    // University of Illinois/NCSA Open Source License.  Both these licenses can be
    // found in the LICENSE file.

    /** @type {function(string, boolean=, number=)} */
    function intArrayFromString(stringy, dontAddNull, length) {
      var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
      var u8array = new Array(len);
      var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
      if (dontAddNull) u8array.length = numBytesWritten;
      return u8array;
    }

    function intArrayToString(array) {
      var ret = [];
      for (var i = 0; i < array.length; i++) {
        var chr = array[i];
        if (chr > 0xFF) {
          if (ASSERTIONS) {
            assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
          }
          chr &= 0xFF;
        }
        ret.push(String.fromCharCode(chr));
      }
      return ret.join('');
    }


    // ASM_LIBRARY EXTERN PRIMITIVES: Int8Array,Int32Array


    function nullFunc_ii(x) { err("Invalid function pointer called with signature 'ii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x); }

    function nullFunc_iidiiii(x) { err("Invalid function pointer called with signature 'iidiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x); }

    function nullFunc_iii(x) { err("Invalid function pointer called with signature 'iii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x); }

    function nullFunc_iiii(x) { err("Invalid function pointer called with signature 'iiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x); }

    function nullFunc_iiiii(x) { err("Invalid function pointer called with signature 'iiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x); }

    function nullFunc_iiiiid(x) { err("Invalid function pointer called with signature 'iiiiid'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x); }

    function nullFunc_iiiiii(x) { err("Invalid function pointer called with signature 'iiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x); }

    function nullFunc_iiiiiid(x) { err("Invalid function pointer called with signature 'iiiiiid'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x); }

    function nullFunc_iiiiiii(x) { err("Invalid function pointer called with signature 'iiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x); }

    function nullFunc_iiiiiiii(x) { err("Invalid function pointer called with signature 'iiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x); }

    function nullFunc_iiiiiiiii(x) { err("Invalid function pointer called with signature 'iiiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x); }

    function nullFunc_iiiiij(x) { err("Invalid function pointer called with signature 'iiiiij'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x); }

    function nullFunc_jiji(x) { err("Invalid function pointer called with signature 'jiji'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x); }

    function nullFunc_v(x) { err("Invalid function pointer called with signature 'v'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x); }

    function nullFunc_vi(x) { err("Invalid function pointer called with signature 'vi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x); }

    function nullFunc_vii(x) { err("Invalid function pointer called with signature 'vii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x); }

    function nullFunc_viii(x) { err("Invalid function pointer called with signature 'viii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x); }

    function nullFunc_viiii(x) { err("Invalid function pointer called with signature 'viiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x); }

    function nullFunc_viiiii(x) { err("Invalid function pointer called with signature 'viiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x); }

    function nullFunc_viiiiii(x) { err("Invalid function pointer called with signature 'viiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x); }

    function nullFunc_viijii(x) { err("Invalid function pointer called with signature 'viijii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x); }

    var asmGlobalArg = {};

    var asmLibraryArg = {
      "abort": abort,
      "setTempRet0": setTempRet0,
      "getTempRet0": getTempRet0,
      "abortStackOverflow": abortStackOverflow,
      "nullFunc_ii": nullFunc_ii,
      "nullFunc_iidiiii": nullFunc_iidiiii,
      "nullFunc_iii": nullFunc_iii,
      "nullFunc_iiii": nullFunc_iiii,
      "nullFunc_iiiii": nullFunc_iiiii,
      "nullFunc_iiiiid": nullFunc_iiiiid,
      "nullFunc_iiiiii": nullFunc_iiiiii,
      "nullFunc_iiiiiid": nullFunc_iiiiiid,
      "nullFunc_iiiiiii": nullFunc_iiiiiii,
      "nullFunc_iiiiiiii": nullFunc_iiiiiiii,
      "nullFunc_iiiiiiiii": nullFunc_iiiiiiiii,
      "nullFunc_iiiiij": nullFunc_iiiiij,
      "nullFunc_jiji": nullFunc_jiji,
      "nullFunc_v": nullFunc_v,
      "nullFunc_vi": nullFunc_vi,
      "nullFunc_vii": nullFunc_vii,
      "nullFunc_viii": nullFunc_viii,
      "nullFunc_viiii": nullFunc_viiii,
      "nullFunc_viiiii": nullFunc_viiiii,
      "nullFunc_viiiiii": nullFunc_viiiiii,
      "nullFunc_viijii": nullFunc_viijii,
      "ClassHandle": ClassHandle,
      "ClassHandle_clone": ClassHandle_clone,
      "ClassHandle_delete": ClassHandle_delete,
      "ClassHandle_deleteLater": ClassHandle_deleteLater,
      "ClassHandle_isAliasOf": ClassHandle_isAliasOf,
      "ClassHandle_isDeleted": ClassHandle_isDeleted,
      "RegisteredClass": RegisteredClass,
      "RegisteredPointer": RegisteredPointer,
      "RegisteredPointer_deleteObject": RegisteredPointer_deleteObject,
      "RegisteredPointer_destructor": RegisteredPointer_destructor,
      "RegisteredPointer_fromWireType": RegisteredPointer_fromWireType,
      "RegisteredPointer_getPointee": RegisteredPointer_getPointee,
      "___cxa_uncaught_exceptions": ___cxa_uncaught_exceptions,
      "___gxx_personality_v0": ___gxx_personality_v0,
      "___lock": ___lock,
      "___map_file": ___map_file,
      "___setErrNo": ___setErrNo,
      "___syscall140": ___syscall140,
      "___syscall145": ___syscall145,
      "___syscall146": ___syscall146,
      "___syscall54": ___syscall54,
      "___syscall6": ___syscall6,
      "___syscall91": ___syscall91,
      "___unlock": ___unlock,
      "__addDays": __addDays,
      "__arraySum": __arraySum,
      "__embind_register_bool": __embind_register_bool,
      "__embind_register_class": __embind_register_class,
      "__embind_register_class_constructor": __embind_register_class_constructor,
      "__embind_register_class_function": __embind_register_class_function,
      "__embind_register_class_property": __embind_register_class_property,
      "__embind_register_emval": __embind_register_emval,
      "__embind_register_float": __embind_register_float,
      "__embind_register_integer": __embind_register_integer,
      "__embind_register_memory_view": __embind_register_memory_view,
      "__embind_register_std_string": __embind_register_std_string,
      "__embind_register_std_wstring": __embind_register_std_wstring,
      "__embind_register_void": __embind_register_void,
      "__emscripten_syscall_munmap": __emscripten_syscall_munmap,
      "__emval_decref": __emval_decref,
      "__emval_register": __emval_register,
      "__isLeapYear": __isLeapYear,
      "_abort": _abort,
      "_embind_repr": _embind_repr,
      "_emscripten_get_heap_size": _emscripten_get_heap_size,
      "_emscripten_memcpy_big": _emscripten_memcpy_big,
      "_emscripten_resize_heap": _emscripten_resize_heap,
      "_getenv": _getenv,
      "_llvm_stackrestore": _llvm_stackrestore,
      "_llvm_stacksave": _llvm_stacksave,
      "_pthread_cond_wait": _pthread_cond_wait,
      "_strftime": _strftime,
      "_strftime_l": _strftime_l,
      "abortOnCannotGrowMemory": abortOnCannotGrowMemory,
      "attachFinalizer": attachFinalizer,
      "constNoSmartPtrRawPointerToWireType": constNoSmartPtrRawPointerToWireType,
      "count_emval_handles": count_emval_handles,
      "craftInvokerFunction": craftInvokerFunction,
      "createNamedFunction": createNamedFunction,
      "detachFinalizer": detachFinalizer,
      "downcastPointer": downcastPointer,
      "embind__requireFunction": embind__requireFunction,
      "embind_init_charCodes": embind_init_charCodes,
      "emscripten_realloc_buffer": emscripten_realloc_buffer,
      "ensureOverloadTable": ensureOverloadTable,
      "exposePublicSymbol": exposePublicSymbol,
      "extendError": extendError,
      "floatReadValueFromPointer": floatReadValueFromPointer,
      "flushPendingDeletes": flushPendingDeletes,
      "genericPointerToWireType": genericPointerToWireType,
      "getBasestPointer": getBasestPointer,
      "getInheritedInstance": getInheritedInstance,
      "getInheritedInstanceCount": getInheritedInstanceCount,
      "getLiveInheritedInstances": getLiveInheritedInstances,
      "getShiftFromSize": getShiftFromSize,
      "getTypeName": getTypeName,
      "get_first_emval": get_first_emval,
      "heap32VectorToArray": heap32VectorToArray,
      "init_ClassHandle": init_ClassHandle,
      "init_RegisteredPointer": init_RegisteredPointer,
      "init_embind": init_embind,
      "init_emval": init_emval,
      "integerReadValueFromPointer": integerReadValueFromPointer,
      "makeClassHandle": makeClassHandle,
      "makeLegalFunctionName": makeLegalFunctionName,
      "new_": new_,
      "nonConstNoSmartPtrRawPointerToWireType": nonConstNoSmartPtrRawPointerToWireType,
      "readLatin1String": readLatin1String,
      "registerType": registerType,
      "releaseClassHandle": releaseClassHandle,
      "replacePublicSymbol": replacePublicSymbol,
      "runDestructor": runDestructor,
      "runDestructors": runDestructors,
      "setDelayFunction": setDelayFunction,
      "shallowCopyInternalPointer": shallowCopyInternalPointer,
      "simpleReadValueFromPointer": simpleReadValueFromPointer,
      "throwBindingError": throwBindingError,
      "throwInstanceAlreadyDeleted": throwInstanceAlreadyDeleted,
      "throwInternalError": throwInternalError,
      "throwUnboundTypeError": throwUnboundTypeError,
      "upcastPointer": upcastPointer,
      "validateThis": validateThis,
      "whenDependentTypesAreResolved": whenDependentTypesAreResolved,
      "tempDoublePtr": tempDoublePtr,
      "DYNAMICTOP_PTR": DYNAMICTOP_PTR
    };
    // EMSCRIPTEN_START_ASM
    var asm =Module["asm"]// EMSCRIPTEN_END_ASM
    (asmGlobalArg, asmLibraryArg, buffer);

    var real___ZSt18uncaught_exceptionv = asm["__ZSt18uncaught_exceptionv"];
    asm["__ZSt18uncaught_exceptionv"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return real___ZSt18uncaught_exceptionv.apply(null, arguments);
    };

    var real____cxa_can_catch = asm["___cxa_can_catch"];
    asm["___cxa_can_catch"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return real____cxa_can_catch.apply(null, arguments);
    };

    var real____cxa_is_pointer_type = asm["___cxa_is_pointer_type"];
    asm["___cxa_is_pointer_type"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return real____cxa_is_pointer_type.apply(null, arguments);
    };

    var real____embind_register_native_and_builtin_types = asm["___embind_register_native_and_builtin_types"];
    asm["___embind_register_native_and_builtin_types"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return real____embind_register_native_and_builtin_types.apply(null, arguments);
    };

    var real____errno_location = asm["___errno_location"];
    asm["___errno_location"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return real____errno_location.apply(null, arguments);
    };

    var real____getTypeName = asm["___getTypeName"];
    asm["___getTypeName"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return real____getTypeName.apply(null, arguments);
    };

    var real__fflush = asm["_fflush"];
    asm["_fflush"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return real__fflush.apply(null, arguments);
    };

    var real__free = asm["_free"];
    asm["_free"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return real__free.apply(null, arguments);
    };

    var real__malloc = asm["_malloc"];
    asm["_malloc"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return real__malloc.apply(null, arguments);
    };

    var real__memmove = asm["_memmove"];
    asm["_memmove"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return real__memmove.apply(null, arguments);
    };

    var real__pthread_cond_broadcast = asm["_pthread_cond_broadcast"];
    asm["_pthread_cond_broadcast"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return real__pthread_cond_broadcast.apply(null, arguments);
    };

    var real__sbrk = asm["_sbrk"];
    asm["_sbrk"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return real__sbrk.apply(null, arguments);
    };

    var real_establishStackSpace = asm["establishStackSpace"];
    asm["establishStackSpace"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return real_establishStackSpace.apply(null, arguments);
    };

    var real_globalCtors = asm["globalCtors"];
    asm["globalCtors"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return real_globalCtors.apply(null, arguments);
    };

    var real_stackAlloc = asm["stackAlloc"];
    asm["stackAlloc"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return real_stackAlloc.apply(null, arguments);
    };

    var real_stackRestore = asm["stackRestore"];
    asm["stackRestore"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return real_stackRestore.apply(null, arguments);
    };

    var real_stackSave = asm["stackSave"];
    asm["stackSave"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return real_stackSave.apply(null, arguments);
    };
    Module["asm"] = asm;
    var __ZSt18uncaught_exceptionv = Module["__ZSt18uncaught_exceptionv"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["__ZSt18uncaught_exceptionv"].apply(null, arguments)
    };

    var ___cxa_can_catch = Module["___cxa_can_catch"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["___cxa_can_catch"].apply(null, arguments)
    };

    var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["___cxa_is_pointer_type"].apply(null, arguments)
    };

    var ___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["___embind_register_native_and_builtin_types"].apply(null, arguments)
    };

    var ___errno_location = Module["___errno_location"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["___errno_location"].apply(null, arguments)
    };

    var ___getTypeName = Module["___getTypeName"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["___getTypeName"].apply(null, arguments)
    };

    var _emscripten_replace_memory = Module["_emscripten_replace_memory"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["_emscripten_replace_memory"].apply(null, arguments)
    };

    var _fflush = Module["_fflush"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["_fflush"].apply(null, arguments)
    };

    var _free = Module["_free"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["_free"].apply(null, arguments)
    };

    var _malloc = Module["_malloc"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["_malloc"].apply(null, arguments)
    };

    var _memcpy = Module["_memcpy"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["_memcpy"].apply(null, arguments)
    };

    var _memmove = Module["_memmove"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["_memmove"].apply(null, arguments)
    };

    var _memset = Module["_memset"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["_memset"].apply(null, arguments)
    };

    var _pthread_cond_broadcast = Module["_pthread_cond_broadcast"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["_pthread_cond_broadcast"].apply(null, arguments)
    };

    var _sbrk = Module["_sbrk"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["_sbrk"].apply(null, arguments)
    };

    var establishStackSpace = Module["establishStackSpace"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["establishStackSpace"].apply(null, arguments)
    };

    var globalCtors = Module["globalCtors"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["globalCtors"].apply(null, arguments)
    };

    var stackAlloc = Module["stackAlloc"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["stackAlloc"].apply(null, arguments)
    };

    var stackRestore = Module["stackRestore"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["stackRestore"].apply(null, arguments)
    };

    var stackSave = Module["stackSave"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["stackSave"].apply(null, arguments)
    };

    var dynCall_ii = Module["dynCall_ii"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["dynCall_ii"].apply(null, arguments)
    };

    var dynCall_iidiiii = Module["dynCall_iidiiii"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["dynCall_iidiiii"].apply(null, arguments)
    };

    var dynCall_iii = Module["dynCall_iii"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["dynCall_iii"].apply(null, arguments)
    };

    var dynCall_iiii = Module["dynCall_iiii"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["dynCall_iiii"].apply(null, arguments)
    };

    var dynCall_iiiii = Module["dynCall_iiiii"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["dynCall_iiiii"].apply(null, arguments)
    };

    var dynCall_iiiiid = Module["dynCall_iiiiid"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["dynCall_iiiiid"].apply(null, arguments)
    };

    var dynCall_iiiiii = Module["dynCall_iiiiii"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["dynCall_iiiiii"].apply(null, arguments)
    };

    var dynCall_iiiiiid = Module["dynCall_iiiiiid"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["dynCall_iiiiiid"].apply(null, arguments)
    };

    var dynCall_iiiiiii = Module["dynCall_iiiiiii"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["dynCall_iiiiiii"].apply(null, arguments)
    };

    var dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["dynCall_iiiiiiii"].apply(null, arguments)
    };

    var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["dynCall_iiiiiiiii"].apply(null, arguments)
    };

    var dynCall_iiiiij = Module["dynCall_iiiiij"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["dynCall_iiiiij"].apply(null, arguments)
    };

    var dynCall_jiji = Module["dynCall_jiji"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["dynCall_jiji"].apply(null, arguments)
    };

    var dynCall_v = Module["dynCall_v"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["dynCall_v"].apply(null, arguments)
    };

    var dynCall_vi = Module["dynCall_vi"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["dynCall_vi"].apply(null, arguments)
    };

    var dynCall_vii = Module["dynCall_vii"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["dynCall_vii"].apply(null, arguments)
    };

    var dynCall_viii = Module["dynCall_viii"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["dynCall_viii"].apply(null, arguments)
    };

    var dynCall_viiii = Module["dynCall_viiii"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["dynCall_viiii"].apply(null, arguments)
    };

    var dynCall_viiiii = Module["dynCall_viiiii"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["dynCall_viiiii"].apply(null, arguments)
    };

    var dynCall_viiiiii = Module["dynCall_viiiiii"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["dynCall_viiiiii"].apply(null, arguments)
    };

    var dynCall_viijii = Module["dynCall_viijii"] = function() {
      assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
      assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
      return Module["asm"]["dynCall_viijii"].apply(null, arguments)
    };
    ;



    // === Auto-generated postamble setup entry stuff ===

    Module['asm'] = asm;

    if (!Module["intArrayFromString"]) Module["intArrayFromString"] = function() { abort("'intArrayFromString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["intArrayToString"]) Module["intArrayToString"] = function() { abort("'intArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["ccall"]) Module["ccall"] = function() { abort("'ccall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["cwrap"]) Module["cwrap"] = function() { abort("'cwrap' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["setValue"]) Module["setValue"] = function() { abort("'setValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["getValue"]) Module["getValue"] = function() { abort("'getValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["allocate"]) Module["allocate"] = function() { abort("'allocate' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["getMemory"]) Module["getMemory"] = function() { abort("'getMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
    if (!Module["AsciiToString"]) Module["AsciiToString"] = function() { abort("'AsciiToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["stringToAscii"]) Module["stringToAscii"] = function() { abort("'stringToAscii' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["UTF8ArrayToString"]) Module["UTF8ArrayToString"] = function() { abort("'UTF8ArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["UTF8ToString"]) Module["UTF8ToString"] = function() { abort("'UTF8ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["stringToUTF8Array"]) Module["stringToUTF8Array"] = function() { abort("'stringToUTF8Array' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["stringToUTF8"]) Module["stringToUTF8"] = function() { abort("'stringToUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["lengthBytesUTF8"]) Module["lengthBytesUTF8"] = function() { abort("'lengthBytesUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["UTF16ToString"]) Module["UTF16ToString"] = function() { abort("'UTF16ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["stringToUTF16"]) Module["stringToUTF16"] = function() { abort("'stringToUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["lengthBytesUTF16"]) Module["lengthBytesUTF16"] = function() { abort("'lengthBytesUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["UTF32ToString"]) Module["UTF32ToString"] = function() { abort("'UTF32ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["stringToUTF32"]) Module["stringToUTF32"] = function() { abort("'stringToUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["lengthBytesUTF32"]) Module["lengthBytesUTF32"] = function() { abort("'lengthBytesUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["allocateUTF8"]) Module["allocateUTF8"] = function() { abort("'allocateUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["stackTrace"]) Module["stackTrace"] = function() { abort("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["addOnPreRun"]) Module["addOnPreRun"] = function() { abort("'addOnPreRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["addOnInit"]) Module["addOnInit"] = function() { abort("'addOnInit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["addOnPreMain"]) Module["addOnPreMain"] = function() { abort("'addOnPreMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["addOnExit"]) Module["addOnExit"] = function() { abort("'addOnExit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["addOnPostRun"]) Module["addOnPostRun"] = function() { abort("'addOnPostRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["writeStringToMemory"]) Module["writeStringToMemory"] = function() { abort("'writeStringToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["writeArrayToMemory"]) Module["writeArrayToMemory"] = function() { abort("'writeArrayToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["writeAsciiToMemory"]) Module["writeAsciiToMemory"] = function() { abort("'writeAsciiToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["addRunDependency"]) Module["addRunDependency"] = function() { abort("'addRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
    if (!Module["removeRunDependency"]) Module["removeRunDependency"] = function() { abort("'removeRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
    if (!Module["ENV"]) Module["ENV"] = function() { abort("'ENV' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["FS"]) Module["FS"] = function() { abort("'FS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["FS_createFolder"]) Module["FS_createFolder"] = function() { abort("'FS_createFolder' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
    if (!Module["FS_createPath"]) Module["FS_createPath"] = function() { abort("'FS_createPath' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
    if (!Module["FS_createDataFile"]) Module["FS_createDataFile"] = function() { abort("'FS_createDataFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
    if (!Module["FS_createPreloadedFile"]) Module["FS_createPreloadedFile"] = function() { abort("'FS_createPreloadedFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
    if (!Module["FS_createLazyFile"]) Module["FS_createLazyFile"] = function() { abort("'FS_createLazyFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
    if (!Module["FS_createLink"]) Module["FS_createLink"] = function() { abort("'FS_createLink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
    if (!Module["FS_createDevice"]) Module["FS_createDevice"] = function() { abort("'FS_createDevice' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
    if (!Module["FS_unlink"]) Module["FS_unlink"] = function() { abort("'FS_unlink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
    if (!Module["GL"]) Module["GL"] = function() { abort("'GL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["dynamicAlloc"]) Module["dynamicAlloc"] = function() { abort("'dynamicAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["warnOnce"]) Module["warnOnce"] = function() { abort("'warnOnce' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["loadDynamicLibrary"]) Module["loadDynamicLibrary"] = function() { abort("'loadDynamicLibrary' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["loadWebAssemblyModule"]) Module["loadWebAssemblyModule"] = function() { abort("'loadWebAssemblyModule' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["getLEB"]) Module["getLEB"] = function() { abort("'getLEB' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["getFunctionTables"]) Module["getFunctionTables"] = function() { abort("'getFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["alignFunctionTables"]) Module["alignFunctionTables"] = function() { abort("'alignFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["registerFunctions"]) Module["registerFunctions"] = function() { abort("'registerFunctions' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["addFunction"]) Module["addFunction"] = function() { abort("'addFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["removeFunction"]) Module["removeFunction"] = function() { abort("'removeFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["getFuncWrapper"]) Module["getFuncWrapper"] = function() { abort("'getFuncWrapper' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["prettyPrint"]) Module["prettyPrint"] = function() { abort("'prettyPrint' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["makeBigInt"]) Module["makeBigInt"] = function() { abort("'makeBigInt' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["dynCall"]) Module["dynCall"] = function() { abort("'dynCall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["getCompilerSetting"]) Module["getCompilerSetting"] = function() { abort("'getCompilerSetting' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["stackSave"]) Module["stackSave"] = function() { abort("'stackSave' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["stackRestore"]) Module["stackRestore"] = function() { abort("'stackRestore' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["stackAlloc"]) Module["stackAlloc"] = function() { abort("'stackAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["establishStackSpace"]) Module["establishStackSpace"] = function() { abort("'establishStackSpace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["print"]) Module["print"] = function() { abort("'print' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["printErr"]) Module["printErr"] = function() { abort("'printErr' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["getTempRet0"]) Module["getTempRet0"] = function() { abort("'getTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["setTempRet0"]) Module["setTempRet0"] = function() { abort("'setTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["Pointer_stringify"]) Module["Pointer_stringify"] = function() { abort("'Pointer_stringify' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["writeStackCookie"]) Module["writeStackCookie"] = function() { abort("'writeStackCookie' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["checkStackCookie"]) Module["checkStackCookie"] = function() { abort("'checkStackCookie' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Module["abortStackOverflow"]) Module["abortStackOverflow"] = function() { abort("'abortStackOverflow' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };if (!Module["ALLOC_NORMAL"]) Object.defineProperty(Module, "ALLOC_NORMAL", { get: function() { abort("'ALLOC_NORMAL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); } });
    if (!Module["ALLOC_STACK"]) Object.defineProperty(Module, "ALLOC_STACK", { get: function() { abort("'ALLOC_STACK' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); } });
    if (!Module["ALLOC_DYNAMIC"]) Object.defineProperty(Module, "ALLOC_DYNAMIC", { get: function() { abort("'ALLOC_DYNAMIC' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); } });
    if (!Module["ALLOC_NONE"]) Object.defineProperty(Module, "ALLOC_NONE", { get: function() { abort("'ALLOC_NONE' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); } });



    // Modularize mode returns a function, which can be called to
    // create instances. The instances provide a then() method,
    // must like a Promise, that receives a callback. The callback
    // is called when the module is ready to run, with the module
    // as a parameter. (Like a Promise, it also returns the module
    // so you can use the output of .then(..)).
    Module['then'] = function(func) {
      // We may already be ready to run code at this time. if
      // so, just queue a call to the callback.
      if (Module['calledRun']) {
        func(Module);
      } else {
        // we are not ready to call then() yet. we must call it
        // at the same time we would call onRuntimeInitialized.
        var old = Module['onRuntimeInitialized'];
        Module['onRuntimeInitialized'] = function() {
          if (old) old();
          func(Module);
        };
      }
      return Module;
    };

    /**
     * @constructor
     * @extends {Error}
     * @this {ExitStatus}
     */
    function ExitStatus(status) {
      this.name = "ExitStatus";
      this.message = "Program terminated with exit(" + status + ")";
      this.status = status;
    }
    ExitStatus.prototype = new Error();
    ExitStatus.prototype.constructor = ExitStatus;

    var calledMain = false;

    dependenciesFulfilled = function runCaller() {
      // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
      if (!Module['calledRun']) run();
      if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
    };





    /** @type {function(Array=)} */
    function run(args) {
      args = args || Module['arguments'];

      if (runDependencies > 0) {
        return;
      }

      writeStackCookie();

      preRun();

      if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
      if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

      function doRun() {
        if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
        Module['calledRun'] = true;

        if (ABORT) return;

        initRuntime();

        preMain();

        if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

        assert(!Module['_main'], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');

        postRun();
      }

      if (Module['setStatus']) {
        Module['setStatus']('Running...');
        setTimeout(function() {
          setTimeout(function() {
            Module['setStatus']('');
          }, 1);
          doRun();
        }, 1);
      } else {
        doRun();
      }
      checkStackCookie();
    }
    Module['run'] = run;

    function checkUnflushedContent() {
      // Compiler settings do not allow exiting the runtime, so flushing
      // the streams is not possible. but in ASSERTIONS mode we check
      // if there was something to flush, and if so tell the user they
      // should request that the runtime be exitable.
      // Normally we would not even include flush() at all, but in ASSERTIONS
      // builds we do so just for this check, and here we see if there is any
      // content to flush, that is, we check if there would have been
      // something a non-ASSERTIONS build would have not seen.
      // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
      // mode (which has its own special function for this; otherwise, all
      // the code is inside libc)
      var print = out;
      var printErr = err;
      var has = false;
      out = err = function(x) {
        has = true;
      };
      try { // it doesn't matter if it fails
        var flush = Module['_fflush'];
        if (flush) flush(0);
        // also flush in the JS FS layer
        ['stdout', 'stderr'].forEach(function(name) {
          var info = FS.analyzePath('/dev/' + name);
          if (!info) return;
          var stream = info.object;
          var rdev = stream.rdev;
          var tty = TTY.ttys[rdev];
          if (tty && tty.output && tty.output.length) {
            has = true;
          }
        });
      } catch(e) {}
      out = print;
      err = printErr;
      if (has) {
        warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.');
      }
    }

    function exit(status, implicit) {
      checkUnflushedContent();

      // if this is just main exit-ing implicitly, and the status is 0, then we
      // don't need to do anything here and can just leave. if the status is
      // non-zero, though, then we need to report it.
      // (we may have warned about this earlier, if a situation justifies doing so)
      if (implicit && Module['noExitRuntime'] && status === 0) {
        return;
      }

      if (Module['noExitRuntime']) {
        // if exit() was called, we may warn the user if the runtime isn't actually being shut down
        if (!implicit) {
          err('exit(' + status + ') called, but EXIT_RUNTIME is not set, so halting execution but not exiting the runtime or preventing further async execution (build with EXIT_RUNTIME=1, if you want a true shutdown)');
        }
      } else {

        ABORT = true;
        EXITSTATUS = status;

        exitRuntime();

        if (Module['onExit']) Module['onExit'](status);
      }

      Module['quit'](status, new ExitStatus(status));
    }

    var abortDecorators = [];

    function abort(what) {
      if (Module['onAbort']) {
        Module['onAbort'](what);
      }

      what += '';
      out(what);
      err(what);

      ABORT = true;
      EXITSTATUS = 1;

      var extra = '';
      var output = 'abort(' + what + ') at ' + stackTrace() + extra;
      if (abortDecorators) {
        abortDecorators.forEach(function(decorator) {
          output = decorator(output, what);
        });
      }
      throw output;
    }
    Module['abort'] = abort;

    if (Module['preInit']) {
      if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
      while (Module['preInit'].length > 0) {
        Module['preInit'].pop()();
      }
    }


      Module["noExitRuntime"] = true;

    run();





    // {{MODULE_ADDITIONS}}





      return Module
    }
    );
    })();

    const GRAZE_NOTE = Symbol("GRAZE NOTE");
    const GRAZE_NOTE_BODY = Symbol("GRAZE NOTE BODY");
    const GRAZE_NOTES = Symbol("GRAZE NOTES");
    const GRAZE_SYNC_RATE = Symbol("GRAZE SYNC RATE");
    const GRAZE_SYNC_INTERVAL_REF = Symbol("GRAZE SYNC INTERVAL REF");
    const GRAZE_SERVER = Symbol("GRAZE SERVER");
    const GRAZE_UPDATE_QUEUE = Symbol("GRAZE UPDATE");
    const GRAZE_UPDATE_QUEUE_ALERT = Symbol("GRAZE UPDATE QUEUE ALERT");
    const GRAZE_NOTE_UPDATE = Symbol("GRAZE NOTE UPDATE FUNCTION");
    const GRAZE_REFERENCE = Symbol("GRAZE REFERENCE");
    const GRAZE_NOTE_SYNC = Symbol("GRAZE NOTE SYNC");
    const GRAZE_NOTE_PREPARE_FOR_SERVER = Symbol("GRAZE NOTE PREPARE FOR SERVER");
    const GRAZE_NOTE_SYNC_LIST = Symbol("GRAZE NOTE SYNC LIST");
    const GRAZE_NOTE_TAGS = Symbol("GRAZE NOTE TAGS");
    const GRAZE_NOTE_NEED_UPDATE = Symbol("GRAZE NOTE NEED UPDATE");

    function CHANGED(note) {
    	if (!note[GRAZE_NOTE_NEED_UPDATE]) {
    		note[GRAZE_NOTE_NEED_UPDATE] = true;
    		note[GRAZE_REFERENCE][GRAZE_UPDATE_QUEUE_ALERT](note);
    	}
    }

    function ProcessTags(tag_string_list) {
    	if (!tag_string_list)
    		return new Map;

    	if (typeof tag_string_list == "string")
    		tag_string_list = tag_string_list.split(",");

    	return new Map(tag_string_list.map((t, p, tag) => (
    		p = typeof t == "string" ? t.split(":") : [t + ""],
    		tag = { v: undefined, d: false },
    		tag.v = (p.length > 1)
    		? isNaN(p[1])
    		? p[1].trim()
    		: parseFloat(p[1].trim())
    		: undefined,
            [p[0].trim().toLowerCase(), tag]
    	)));
    }

    class Note {
    	constructor(graze, uid, id, tags, body, refs, modified, NEED_SYNC = false) {
    		this[GRAZE_REFERENCE] = graze;
    		this[GRAZE_NOTE_SYNC_LIST] = [];
    		this[GRAZE_NOTE_NEED_UPDATE] = false;
    		this[GRAZE_NOTE_TAGS] = ProcessTags(tags);
    		this[GRAZE_NOTE_BODY] = {
    			uid,
    			id,
    			modified,
    			tags,
    			body,
    			refs
    		};
    		if (NEED_SYNC)
    			CHANGED(this);
    	}

    	/****************** Basic Properties *************************/

    	get created() { return this[GRAZE_NOTE_BODY].uid.date_created.valueOf() }
    	get createdDateObj() { return this[GRAZE_NOTE_BODY].uid.date_created }
    	get modified() { return this[GRAZE_NOTE_BODY].modified }
    	get uid() { return this[GRAZE_NOTE_BODY].uid }
    	get id() { return this[GRAZE_NOTE_BODY].id }
    	async delete(index, length) {}

    	/****************** Synchronizing *************************/

    	/*  
    	    Returns a promise that is fulfilled the next time 
    	    Graze syncs the note with the server
    	*/
    	sync() {
    		return new Promise(res => this[GRAZE_NOTE_NEED_UPDATE] ? this[GRAZE_NOTE_SYNC_LIST].push(res) : res());
    	}

    	[GRAZE_NOTE_UPDATE](note_data) {
    		const note = this[GRAZE_NOTE_BODY];

    		if (note_data.modified < note.modified
    			|| note_data.uid.toString() !== note.uid.toString())
    			return;

    		this[GRAZE_NOTE_TAGS] = ProcessTags(note_data.tags);
    		note.id = note_data.id;
    		note.modified = note_data.modified;
    		note.tags = note_data.tags;
    		note.body = note_data.body;
    	}

    	// Called by graze after data has been sent to server and response has been received. 
    	[GRAZE_NOTE_SYNC](RESULT) {
    		if (!RESULT) {
    			CHANGED(this); // Prime for next update interval
    		} else {
    			this[GRAZE_NOTE_SYNC_LIST].map(s => s(public_note));
    			this[GRAZE_NOTE_SYNC_LIST].length = 0;
    		}
    	}

    	// Called by graze to process local data cache to send to server
    	[GRAZE_NOTE_PREPARE_FOR_SERVER]() {

    		if (this[GRAZE_NOTE_NEED_UPDATE]) {
    			const list = [];

    			for (const t of this[GRAZE_NOTE_TAGS].entries())
    				list.push(`${t[1].d?"!":""}${t[0]}${t[1].v?":"+t[1].v:""}`);

    			this[GRAZE_NOTE_BODY].tags = list;
    			this[GRAZE_NOTE_NEED_UPDATE] = false;
    		}

    		return this[GRAZE_NOTE_BODY];
    	}

    	/****************** BODY *************************/

    	get body() {
    		return this[GRAZE_NOTE_BODY].body;
    	}

    	set body(str) {
    		const note = this[GRAZE_NOTE_BODY];

    		let modstr = note.body,
    			NEED_SYNC_UPDATE_LOCAL = false,
    			offset = 0;

    		//Get Minimum changes to note
    		for (const diff of diffChars(note.body, str)) {
    			if (diff.added) {
    				modstr = modstr.slice(0, offset) + diff.value + modstr.slice(offset);
    				NEED_SYNC_UPDATE_LOCAL = true;
    			} else if (diff.removed) {
    				modstr = modstr.slice(0, offset) + modstr.slice(offset + diff.count);
    				NEED_SYNC_UPDATE_LOCAL = true;
    				offset -= diff.count;
    			}
    			offset += diff.count;
    			//insert into string
    		}

    		//update store with new note changes. 
    		if (NEED_SYNC_UPDATE_LOCAL) {
    			note.body = modstr;
    			CHANGED(this);
    		}
    	}

    	/****************** TAGS *************************/

    	removeTag(name) {

    		CHANGED(this);

    		name = name.toString().toLowerCase();

    		if (this[GRAZE_NOTE_TAGS].has(name))
    			this[GRAZE_NOTE_TAGS].get(name).d = true;

    		return true;
    	}

    	setTag(name, value) {
    		if (!name && !value)
    			return;

    		if (typeof(name) == "object") {
    			value = name.value;
    			name = name.name + "";
    		} else if (value === null)
    			value = undefined;

    		name = name.toString().toLowerCase();

    		this[GRAZE_NOTE_TAGS].set(name, { v: value, d: false });

    		CHANGED(this);

    		return true;
    	}

    	setTags(...v) {
    		// Remove existing tags to make sure the expected result
    		// of all tags now comprising of values defined in 
    		// the set v.

    		this.tags.map(t => this.delete(t.name));

    		if (v) {
    			if (Array.isArray(v))
    				for (const tag_set of v) {
    					if (Array.isArray(tag_set)) {
    						for (const tag of v)
    							setTag(name, value);
    						this.setTag(tag.name, tag.value);
    					} else if (typeof tag_set == "object")
    						this.setTag(tag_set.name, tag_set.value);
    				}
    			else
    				this.setTag(v.name, v.value);
    		}

    		return true;
    	}

    	getTag(name) {
    		name = name.toString().toLowerCase();
    		const tag = this[GRAZE_NOTE_TAGS].get(name);
    		return (tag && !tag.d) ? tag.v ? tag.v : name : null;
    	}

    	getTags() {
    		return [...this[GRAZE_NOTE_TAGS].keys()]
    			.map((name, v) => (v = this.getTag(name), v ? v == name ? { name } : { name, value: v } : null))
    			.filter(e => e !== null);
    	}

    	get tag() {
    		return new Proxy(this, {
    			get: (obj, prop) => this.getTag(prop),
    			set: (obj, prop, value) => {
    				if (value === null)
    					this.removeTag(prop);
    				return this.setTag(prop, value)
    			}
    		})
    	}

    	set tag(e) {}

    	get tags() {
    		return this.getTags();
    	}

    	set tags(v) {
    		this.setTags(v);
    	}


    	/********************* Rendering ****************************/

    	// render the note's message data into a string output
    	async render(handler, set = new Set) {
    		const 
    			note = this[GRAZE_NOTE_BODY],
    			graze = this[GRAZE_REFERENCE];

    		if (handler) {
    			for (const value of parser(whind(note.body))) {
    				if (typeof value == "string")
    					await handler("string", value);
    				else {
    					const notes = await graze.retrieve(value.value);
    					await handler("notes", notes, value);
    				}
    			}
    			handler("complete");
    		} else {

    			if (!set.has(this.uid.string))
    				set.add(this.uid.string);

    			var strings = [];

    			for (const value of parser(whind(note.body))) {
    				if (typeof value == "string")
    					strings.push(value);
    				else {
    					for (const note of await graze.retrieve(value.value)) {

    						if (set.has(note.uid.string))
    							continue;

    						if (note)
    							strings.push(await note.render(handler, new Set(set)));
    					}
    				}
    			}
    			return strings.join("");
    		}
    	}
    }

    observer_mixin("updated", Note.prototype);

    // ((graze pull: use js_comments : graze/docs/functions/common/options.js : options, common ))
    // Parses options from an object and updates the target according to parameters in option_params
    // options is an object
    // target is an object
    // target_name is a string used for warning messages. 
    //
    // options_params is a Map that contains [key, value] pairs of the type [string_name, object_pro]:
    //
    //      The [string_name] is the name of the option. It is matched to the option key names and should be a lower case phrase or word.
    //
    //      The [object]'s [keys] and associated [values] are 
    //
    //          value : [Function | String | Symbol ] -
    // 
    //                  This selects the type of action that is performed when a matching option
    //                  is encountered. values with typeof Function will be called with thie target as the this object
    //                  and the [option_value] of the option matching [option_key] as its only argument. 
    //                                                          
    //                  Values of type String or Symbol will be will be used to lookup the associated property in target
    //                  which is then assigned the [option_value] of the option property [option_key].
    //
    //          parse *optional* : Array of [Function | Any] - 
    //
    //                  Used to convert and or validate the [option_value] before it is applied as an argument or a property value.
    //                  If the parse function returns value of [undefined | NaN | null] then the next parse object in the array is
    //                  used to process the value. 
    //
    //                  The last option may be of any type and will be assigned to the value if the preceding parse
    //                  entries failed to yield an acceptable value.
    //      
    //                  If after using all parse entries to render a value the value is still [undefined | null] the
    //                  option will not be considered at all.
    //    

    function NumberIsNaN(value) {
        return typeof value === "number" && isNaN(value);
    }

    function OptionHandler(options = null, target = null, target_name = "", option_params = null) {
        if (!(option_params instanceof Map))
            throw new Error("Option paramaters for [" + target_name + "] need to be placed within a Map")

        // Parser for handling options
        if (options && typeof options == "object" && !Array.isArray(options))
            for (let name in options) {

                name = name.toLowerCase();

                const option_param = option_params.get(name);

                if (option_param) {
                    let parse = option_param.parse;

                    if (!option_param.parse) parse = [e => e];

                    if (!Array.isArray(parse))
                        parse = [parse];

                    const original_value = options[name];
                    let value = null,
                        index = 0;

                    while ((value === null || value === undefined || NumberIsNaN(value))
                        && index < parse.length) {

                        if (typeof parse[index] == "function")
                            value = parse[index++](original_value);
                        else if (parse[index] === original_value) {
                            value = parse[index++];
                            break;
                        }else{
                            value = parse[index++];
                        }
                    }

                    if (value === undefined || NumberIsNaN(value)) {
                        console.warn(`${target_name} option [${name}] does not accept value [${value}] of type ${typeof value}.`);
                        break;
                    }

                    switch (typeof option_param.value) {
                        case "function":
                            option_param.value.call(target, value);
                            break;
                        case "symbol":
                        case "string":
                            target[option_param.value] = value;
                            break;
                    }
                } else {
                    const closest = []; //fuzzy.closest([...acceptable_options.keys()], 3, 4);
                    console.warn(`${target_name} does not have option [${name}]. ${closes.length > 0 ? `Did you mean ${closest.join(" , ")}?` : ""}`);
                }
            }
    }

    class NoteContainer extends Array {
        push() {}
        shift() {}
        unshift() {}
        pop() {}
        sort(sorter) {
            
            if (typeof sorter == "function") 
                return new NoteContainer(...([...this]).sort(sorter));
            
            throw new TypeError("The comparison function must be either a function or a sort_index")
        }
    }

    NoteContainer.sort_indexes = Object.freeze({
        create_time: (m1,m2)=>{ m1.created < m2.created ? -1 : 1; },
        modify_time: (m1,m2)=>{ m1.modified < m2.modified ? -1 : 1; },
        id: (m1,m2)=>{ m1.id < m2.id ? -1 : 1; },
        tags: (m1,m2)=>{ m1.tags < m2.tags ? -1 : 1; },
        body: (m1,m2)=>{ m1.body < m2.body ? -1 : 1; }
    });

    function loopRL(search_string, match_string, search_window, base){
    	
    	const check = search_string[search_string.length-1];

    	if(base == 0)
    		base = search_string.length-1;

    	const s_len = search_string.length,
    		m_len = match_string.length;

    	while(base < m_len){

    		while(match_string[++base] !== check){
    			if(base >= m_len)
    				return {score:-1}
    		}

    		let mi = base,
    			floor = Math.max(base-search_window, -1),
    			si = s_len-2,
    			score = 0,
    			char = search_string[si],
    			matches = [],
    			match = 1;

    		while(si > -1 && --mi > floor){

    			if(char == match_string[mi]){
    				match++;
    				char = search_string[--si];
    			}else{
    				if(match > 0)
    					matches.unshift(mi+1, match);

    				match = 0;
    				
    				score++;
    			}
    		}

    		if(si == -1){
    			matches.unshift(mi, match);
    			return {score, matches, skip : mi + s_len + 2}
    		} else{
    			base += s_len - si - 1;
    		}
    	}

    	return  {score:-1}
    }

    function loopLR(search_string, match_string, search_window, base){
    	const check = search_string[0];

    	if(base == 0)
    		base--;

    	if(base >= match_string.length)
    		return {score:-1}

    	const s_len = search_string.length,
    		m_len = match_string.length;

    	while(base < m_len){

    		while(match_string[++base] !== check){
    			if(base >= m_len)
    				return {score:-1}
    		}

    		let mi = base,
    			ceil = Math.min(base+search_window, m_len),
    			si = 1,
    			score = 0,
    			char = search_string[si],
    			matches = [],
    			match = 1;

    		while(si < s_len && ++mi < ceil){

    			if(char == match_string[mi]){
    				match++;
    				char = search_string[++si];
    			}else{
    				if(match > 0)
    					matches.push(mi-match, match);

    				match = 0;
    				
    				score++;
    			}
    		}

    		if(si == s_len){
    			matches.push(mi-match+1, match);
    			return {score, matches, skip:base + si - 1}
    		} else{
    			base += si - 1;
    		}
    	}

    	return  {score:-1}
    }



    function fuzzy(search_string, match_string, BEST = false, search_window = search_string.length << 1){

    	if(search_string.length > match_string.length)
    		return {score:-1};

    	if(search_string.length == match_string.length)
    		if(search_string == match_string)
    			return {score:0, matches : [{index:0, str: search_string}]}
    		else 
    			return {score:-1};

    	search_window = Math.min(Math.max(search_window, search_string.length + 2), match_string.length);


    	var base = 0;

    	if(BEST){
    		var result = null, results = [];

    		while((result = loopLR(search_string, match_string, search_window, base)).score > -1)
    			results.push(result), base = result.skip;

    		return results.length > 0 ? results.sort((a,b)=> a.score < b.score ? -1 : 1).shift() : {score:-1}
    	}
    	/* First */
    	else return loopLR(search_string, match_string, search_window, base);
    }

    fuzzy.closest = function(search_strings, match_string){

    };

    class Graze {

        constructor(options) {
            //Private

            //Queue of notes that need to be synced with the server. 
            this[GRAZE_UPDATE_QUEUE] = [];

            //The server that stores the data and provides query functionality.
            this[GRAZE_SERVER] = null;

            //Store of notes that have been pulled from server. Indexed by uid.
            this[GRAZE_NOTES] = new Map();

            // The rate at which to synchronize the active notes with the server. 
            // Value is in milliseconds. Default is 5 seconds.        
            this[GRAZE_SYNC_RATE] = 5000;

            // Reference to the synchronization interval index 
            this[GRAZE_SYNC_INTERVAL_REF] = -1;

            this.lastCheck = Date.now();

            // List of options that are accepted by graze
            const acceptable_options = new Map([
                ["server", { value: this.connect }],
                ["sync_rate", { value: "sync_rate", parse: [parseInt, null, undefined] }]
            ]);

            OptionHandler(options, this, "Graze", acceptable_options);
        }

        //******************************** SERVER ********************************//

        /* Connects the Graze instance to a server */
        connect(server) {

            //Check for appropiate server methods
            const storeNote = (typeof server.storeNote == "function") | 0;
            const removeNote = (typeof server.removeNote == "function") | 0;
            const implode = (typeof server.implode == "function") | 0;
            const getUpdatedUIDs = (typeof server.getUpdatedUIDs == "function") | 0;
            const query = (typeof server.query == "function") | 0;

            const ACCEPTABLE = !!((storeNote & removeNote & implode & getUpdatedUIDs & query) | 0);

            if (!ACCEPTABLE) {
                const error_message = ["Server object is not suitable. " + server.type + ":"];

                if (!storeNote)
                    storeNote.push(`\tThe method "storeNote" ([note]) is not present`);
                if (!getUpdatedUIDs)
                    error_message.push(`\tThe method "getUpdatedUIDs" ([Date]) is not present`);
                if (!removeNote)
                    error_message.push(`\tThe method "removeNote" ([note | uid]) is not present`);
                if (!query)
                    error_message.push(`\tThe method "query" ([string | UID, UID, ...]) is not present`);
                if (!implode)
                    error_message.push(`\tThe method "implode" () is not present`);

                throw new Error(error_message.join("\n"))
            }

            this[GRAZE_SERVER] = server;
        }

        /* Disconnects from the connected server */
        disconnect() {

            if (!this[GRAZE_SERVER])
                return false;

            this[GRAZE_SERVER] = null;

            return true;
        }

        //************************** SYNCHRONIZATION ******************************//

        [GRAZE_UPDATE_QUEUE_ALERT](note_ref) {
            this[GRAZE_UPDATE_QUEUE].push(note_ref);
        }

        // Accepts a numerical value with the type milliseconds
        // sets the rate at which graze synchonizes with the server.
        // minimum value is 1000    (one second);
        // maximum value is 3600000 (one hour);
        // If the value passed is null, the synchronization is disabled. 
        set sync_rate(value) {
            if (value === null) this[GRAZE_SYNC_RATE] = -1;
            else
                this[GRAZE_SYNC_RATE] = Math.min(3600000, Math.max(1000, parseInt(value) || 1000));
            this.setAutoSync(GRAZE_SYNC_RATE, GRAZE_SYNC_INTERVAL_REF);
        }

        get sync_rate() {
            return this[GRAZE_SYNC_RATE];
        }

        //Sets the synchronization 
        setAutoSync(rate_symbol, interval_reference) {
            if (rate_symbol === GRAZE_SYNC_RATE && GRAZE_SYNC_INTERVAL_REF === interval_reference) {

                if (this[interval_reference] > -1)
                    clearInterval(this[interval_reference]);

                if (this[rate_symbol] > 0)
                    this[interval_reference] = setInterval(this.sync.bind(this), this[rate_symbol]);
            }
        }

        // Synchronizes changed notes with the server and updates the local cache 
        // with any notes that have been changed remotely. **Candidate for web worker**
        async sync() {
            const server = this[GRAZE_SERVER],
                queue = this[GRAZE_UPDATE_QUEUE];

            if (server) {

                //get all updated notes from the store. 
                const uids = await server.getUpdatedUIDs(this.lastCheck);

                if (uids.length > 0)
                    this.lastCheck = Date.now();

                for (const uid of uids)
                    this.retrieve(uid);

                const out_queue = queue.slice();

                queue.length = 0;

                if (out_queue.length > 0) {

                    for (const note of out_queue) {

                        const RESULT = (await server.storeNote(note[GRAZE_NOTE_PREPARE_FOR_SERVER]()));

                        if (!RESULT) {
                            console.warn(`Unable to sync note ${id} with uid ${note.uid}`);
                        } else {
                            note[GRAZE_NOTE_BODY].modified = (new Date).valueOf();
                        }

                        note[GRAZE_NOTE_SYNC](RESULT);
                    }
                }


            } else
                this.sync_rate = null; //Make sure auto sync is off.
        }

        //*************************** NOTE HANDLING *********************************//

        // Removes all notes from the Graze instance. Any existing client notes will still exists,
        // and can be reconnected by changing one of its values.
        purgeCache() {
            this[GRAZE_NOTES] = new Map;
        }

        createUID() { return new UID }

        get sort_indexes() { return NoteContainer.sort_indexes; }

        // Deprecate in favor of sync
        async store(...vals) {
            var RESULT = 0,
                note;

            for (const candidate of vals) {

                if (!(note = candidate.__graze_retrieve_note__))
                    note = candidate;

                RESULT += (await this[GRAZE_SERVER].storeNote(note)) | 0;
            }

            return RESULT;
        }

        // Retrieves notes from server based on query. 
        // Caches all notes received from server.
        // Returns a NoteContainer with all notes reveived.
        // Returns null of no notes matched query.
        async retrieve(
            query // Query string
        ) {

            const
                output = [],
                results = await this[GRAZE_SERVER].query(query);


            if (results) {
                for (const note_data of results) {
                    const uid = note_data.uid.toString();
                    if (!note_data) continue;

                    if (!this[GRAZE_NOTES].has(uid)) {
                        this[GRAZE_NOTES].set(uid, new Note(
                            this,
                            new UID(uid),
                            note_data.id,
                            note_data.tags,
                            note_data.body,
                            note_data.refs || [],
                            note_data.modified,
                            false
                        ));
                    } else {
                        this[GRAZE_NOTES].get(uid)[GRAZE_NOTE_UPDATE](note_data);
                    }

                    output.push(this[GRAZE_NOTES].get(uid));
                }
            }

            return new NoteContainer(...output);
        }

        createNote(
            note_id, // string : String identifier of note. Refere to notes on using container addressing. Required
            note_tags = "", // string | array : Array of string ids or Comma seperated list of ids in a string.
            body = "", // string : String identifier of note. Refere to notes on using container addressing
            uid = this.createUID() // string : String identifier of note. Refere to notes on using container addressing
        ) {
            //Verify arguments.

            if (typeof note_id !== "string")
                throw new Error("note_id argument must be a string value");

            if (typeof note_tags == "string") {
                if (note_tags)
                    note_tags = note_tags.split(",");
                else
                    note_tags = [];
            } else if (!Array.isArray(note_tags) || note_tags.reduce((r, v) => (typeof v !== "string" && typeof v !== "number") || r, false)) {
                throw new Error(`
                                graze.createNote: [note_tags] argument must be a string of comma separated values or an array of [strings | numbers].Got $ { note_tags.map(e => typeof e) }
                                `);
            }

            if (typeof body !== "string")
                throw new Error("body argument must be a string value");

            if (!(uid instanceof UID))
                throw new Error("uid argument must be a UID instance");

            const note = new Note(
                this,
                uid,
                note_id,
                note_tags,
                body,
                [],
                Date.now() | 0,
                true, // Auto sync with server
                GRAZE_NOTES
            );

            this[GRAZE_NOTES].set(uid.toString(), note);

            return note;
        }
    }

    let fn$1 = {}; const 
    /************** Maps **************/

        /* Symbols To Inject into the Lexer */
        symbols$1 = ["&&","||"],

        /* Goto lookup maps */
        gt0$1 = [0,-1,1,2,7,3,9,20,4,-5,26,-1,5,-24,10,8,11,-2,13,12,-2,15],
    gt1$1 = [0,-6,20,32,-5,26,-1,33],
    gt2$1 = [0,-13,26,-1,34],
    gt3$1 = [0,-3,35,-1,9,-34,10,36,11,-2,13,12,-2,15],
    gt4$1 = [0,-5,38,-34,10,37,11,-2,13,12,-2,15],
    gt5$1 = [0,-42,40,-2,13,12,-2,15],
    gt6$1 = [0,-44,41,-2,42,44,43],
    gt7$1 = [0,-9,47,48,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt8 = [0,-14,79,-1,80,65,61,68,62,71,63,64],
    gt9 = [0,-13,26,-1,85],
    gt10 = [0,-5,38,-34,10,86,11,-2,13,12,-2,15],
    gt11 = [0,-47,87,44,43],
    gt12 = [0,-49,88],
    gt13 = [0,-12,97,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt14 = [0,-12,98,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt15 = [0,-12,99,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt16 = [0,-12,100,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt17 = [0,-8,101,102,48,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt18 = [0,-45,103,-3,15],
    gt19 = [0,-45,104,-3,15],
    gt20 = [0,-24,107,108,109,105,120,-2,111,122,-3,112,125,126,106],
    gt21 = [0,-24,107,108,109,137,120,-2,111,122,-3,112,125,126,138],
    gt22 = [0,-24,107,108,109,139,120,-2,111,122,-3,112],
    gt23 = [0,-40,10,142,11,-2,13,12,-2,15],
    gt24 = [0,-9,144,48,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt25 = [0,-9,145,48,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt26 = [0,-9,146,48,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt27 = [0,-9,147,48,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt28 = [0,-10,148,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt29 = [0,-10,149,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt30 = [0,-10,150,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt31 = [0,-10,151,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt32 = [0,-37,125,126,155],
    gt33 = [0,-40,10,159,11,-2,13,12,-2,15],
    gt34 = [0,-28,120,-2,162,122,-3,163],
    gt35 = [0,-33,168,-11,169,-3,15],
    gt36 = [0,-37,125,126,171],
    gt37 = [0,-37,125,126,172],
    gt38 = [0,-24,107,108,109,173,120,-2,111,122,-3,112,125,126,174],
    gt39 = [0,-16,175,65,61,68,62,71,63,64],
    gt40 = [0,-29,179,178],
    gt41 = [0,-34,186,185],
    gt42 = [0,-37,125,126,191],
    gt43 = [0,-33,193,-11,169,-3,15],

        // State action lookup maps
        sm0$1=[0,1,-1,2,-1,0,-2,3,4,0,-3,5,-1,6,7,-1,8,9,10,11,-14,12,13,14,15,16,-39,17],
    sm1$1=[0,18,-3,0,-4,0],
    sm2$1=[0,19,-3,0,-4,0],
    sm3$1=[0,20,-3,0,-4,0,-6,7,-1,8,9,10,11,-14,12,13,14,15,16],
    sm4$1=[0,21,-3,0,-4,0,-26,12,13,14,15,16],
    sm5$1=[0,22,-3,0,-4,0],
    sm6$1=[0,23,-1,2,-1,0,-2,3,4,0,-3,5,-2,23,-1,23,23,23,23,-14,23,23,23,23,23,-39,17],
    sm7$1=[0,24,-1,2,-1,0,-2,3,4,0,-3,5,-2,24,-1,24,24,24,24,-14,24,24,24,24,24,-39,17],
    sm8$1=[0,25,-3,0,-4,0,-5,26,25,-1,25,25,25,25,-14,25,25,25,25,25],
    sm9$1=[0,27,-1,27,-1,0,-2,27,27,0,-3,27,-2,27,-1,27,27,27,27,-14,27,27,27,27,27,-39,27],
    sm10$1=[0,28,-1,2,-1,0,-2,3,4,0,-3,5,-1,28,28,-1,28,28,28,28,28,28,28,28,28,28,28,28,-5,28,28,28,28,28,28,28,-7,28,28,28,28,28,-1,28,-1,28,28,-1,28,-5,28,28,28,28,28,28,28,28,28,28,28,28,-2,17],
    sm11$1=[0,29,-1,29,-1,0,-2,29,29,0,-3,29,-1,29,29,-1,29,29,29,29,29,29,29,29,29,29,29,29,-5,29,29,29,29,29,29,29,-7,29,29,29,29,29,-1,29,-1,29,29,-1,29,-5,29,29,29,29,29,29,29,29,29,29,29,29,-2,29],
    sm12$1=[0,30,-1,30,-1,0,-2,30,30,0,-3,30,-1,30,30,-1,30,30,30,30,30,30,30,30,30,30,30,30,-5,30,30,30,30,30,30,30,-7,30,30,30,30,30,-1,30,-1,30,30,-1,30,-5,30,30,30,30,30,30,30,30,30,30,30,30,-2,30],
    sm13$1=[0,31,-1,31,-1,0,-2,31,31,0,-3,31,-1,31,31,-1,31,31,31,31,31,31,31,31,31,31,31,31,-5,31,31,31,31,31,31,31,-7,31,31,31,31,31,-1,31,-1,31,31,-1,31,-5,31,31,31,31,31,31,31,31,31,31,31,31,-2,31],
    sm14$1=[0,32,-1,2,-1,33,-2,3,4,0,-3,5,-1,32,32,-1,32,32,32,32,32,32,32,32,32,32,32,32,-5,32,32,32,32,32,32,32,-7,32,32,32,32,32,-1,32,-1,32,32,-1,32,32,32,32,32,-1,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,-1,34],
    sm15$1=[0,35,-1,35,-1,35,-2,35,35,0,-3,35,-1,35,35,-1,35,35,35,35,35,35,35,35,35,35,35,35,-5,35,35,35,35,35,35,35,-7,35,35,35,35,35,-1,35,-1,35,35,-1,35,35,35,35,35,-1,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,-1,35],
    sm16$1=[0,36,-1,2,-1,0,-2,3,4,0,-3,5,-16,37,38,39,40,41,-1,36,36,36,36,36,-1,42,43,44,45,46,47,48,-29,49,50,17],
    sm17$1=[0,51,-1,51,-1,0,-2,51,51,0,-3,51,-3,52,-12,51,51,51,51,51,-1,51,51,51,51,51,-1,51,51,51,51,51,51,51,-29,51,51,51],
    sm18$1=[0,51,-1,51,-1,0,-2,51,51,0,-3,51,-3,53,-12,51,51,51,51,51,-1,51,51,51,51,51,-1,51,51,51,51,51,51,51,-29,51,51,51],
    sm19$1=[0,51,-1,51,-1,0,-2,51,51,0,-3,51,-3,54,-12,51,51,51,51,51,-1,51,51,51,51,51,-1,51,51,51,51,51,51,51,-29,51,51,51],
    sm20$1=[0,51,-1,51,-1,0,-2,51,51,0,-3,51,-16,51,51,51,51,51,-1,51,51,51,51,51,-1,51,51,51,51,51,51,51,-29,51,51,51],
    sm21$1=[0,51,-1,51,-1,0,-2,51,51,0,-3,51,-3,55,-12,51,51,51,51,51,-1,51,51,51,51,51,-1,51,51,51,51,51,51,51,-29,51,51,51],
    sm22$1=[0,56,-3,0,-4,0,-32,42,43,44,45,46,47,48],
    sm23$1=[0,57,-3,0,-4,0,-32,57,57,57,57,57,57,57],
    sm24$1=[0,57,-3,0,-4,0,-7,58,-24,57,57,57,57,57,57,57],
    sm25$1=[0,57,-3,0,-4,0,-7,59,-24,57,57,57,57,57,57,57],
    sm26=[0,57,-3,0,-4,0,-7,60,-24,57,57,57,57,57,57,57],
    sm27=[0,57,-3,0,-4,0,-7,61,-24,57,57,57,57,57,57,57],
    sm28=[0,62,-3,0,-4,0,-26,12,13,14,15,16],
    sm29=[0,63,-3,0,-4,0],
    sm30=[0,64,-3,0,-4,0],
    sm31=[0,65,-1,2,-1,0,-2,3,4,0,-3,5,-2,65,-1,65,65,65,65,-14,65,65,65,65,65,-39,17],
    sm32=[0,66,-3,0,-4,0,-5,26,66,-1,66,66,66,66,-14,66,66,66,66,66],
    sm33=[0,67,-3,0,-4,0,-5,26,67,-1,67,67,67,67,-14,67,67,67,67,67],
    sm34=[0,68,-1,68,-1,0,-2,68,68,0,-3,68,-2,68,-1,68,68,68,68,-14,68,68,68,68,68,-39,68],
    sm35=[0,69,-1,69,-1,0,-2,69,69,0,-3,69,-2,69,-1,69,69,69,69,-14,69,69,69,69,69,-39,69],
    sm36=[0,70,-1,70,-1,0,-2,70,70,0,-3,70,-1,70,70,-1,70,70,70,70,70,70,70,70,70,70,70,70,-5,70,70,70,70,70,70,70,-7,70,70,70,70,70,-1,70,-1,70,70,-1,70,-5,70,70,70,70,70,70,70,70,70,70,70,70,-2,70],
    sm37=[0,71,-1,2,-1,33,-2,3,4,0,-3,5,-1,71,71,-1,71,71,71,71,71,71,71,71,71,71,71,71,-5,71,71,71,71,71,71,71,-7,71,71,71,71,71,-1,71,-1,71,71,-1,71,71,71,71,71,-1,71,71,71,71,71,71,71,71,71,71,71,71,71,71,71,-1,34],
    sm38=[0,72,-1,72,-1,72,-2,72,72,0,-3,72,-1,72,72,-1,72,72,72,72,72,72,72,72,72,72,72,72,-5,72,72,72,72,72,72,72,-7,72,72,72,72,72,-1,72,-1,72,72,-1,72,72,72,72,72,-1,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,-1,72],
    sm39=[0,73,-1,73,-1,73,-2,73,73,0,-3,73,-1,73,73,-1,73,73,73,73,73,73,73,73,73,73,73,73,-5,73,73,73,73,73,73,73,-7,73,73,73,73,73,-1,73,-1,73,73,-1,73,73,73,73,73,-1,73,73,73,73,73,73,73,73,73,73,73,73,73,73,73,-1,73],
    sm40=[0,-2,2,-1,0,-2,3,4,0,-3,5],
    sm41=[0,74,-3,0,-4,0,-26,74,74,74,74,74],
    sm42=[0,75,-3,0,-4,0,-12,76,77,78,79,-9,75,75,75,75,75,75],
    sm43=[0,80,-3,0,-4,0,-12,80,80,80,80,81,82,83,84,-5,80,80,80,80,80,80],
    sm44=[0,85,-3,0,-4,0,-12,85,85,85,85,85,85,85,85,-5,85,85,85,85,85,85],
    sm45=[0,-2,2,-1,0,-2,3,4,0,-3,5,-20,41,-7,42,43,44,45,46,47,48,-29,49,50,17],
    sm46=[0,-2,2,-1,0,-2,3,4,0,-3,5,-16,37,38,39,40,41,-7,42,43,44,45,46,47,48,-29,49,50,17],
    sm47=[0,86,-3,0,-4,0,-12,86,86,86,86,86,86,86,86,-5,86,86,86,86,86,86],
    sm48=[0,87,-3,0,-4,0,-12,87,87,87,87,87,87,87,87,-5,87,87,87,87,87,87],
    sm49=[0,88,-3,0,-4,0,-12,88,88,88,88,88,88,88,88,-5,88,88,88,88,88,88,88],
    sm50=[0,89,-3,0,-4,0,-12,89,89,89,89,89,89,89,89,-5,89,89,89,89,89,89,89,-7,90,91,92,93,94,-1,95,-1,96,97,-1,98,-5,99,100,101,102,103,104,105,106,107,108,109,110],
    sm51=[0,111,-3,0,-4,0,-12,111,111,111,111,111,111,111,111,-5,111,111,111,111,111,111,111,-7,111,111,111,111,111,-1,111,-1,111,111,-1,111,-5,111,111,111,111,111,111,111,111,111,111,111,111],
    sm52=[0,112,-3,0,-4,0,-12,112,112,112,112,112,112,112,112,-5,112,112,112,112,112,112,112,-7,90,91,92,93,94,-1,95,-1,96,97,-1,98,-5,99,100,101,102,103,104,105,106,107,108,109,110],
    sm53=[0,113,-3,0,-4,0,-12,113,113,113,113,113,113,113,113,-5,113,113,113,113,113,113,113,-7,113,113,113,113,113,-1,113,-1,113,113,-1,113,-5,113,113,113,113,113,113,113,113,113,113,113,113],
    sm54=[0,-4,0,-4,0,-39,90,91,92,93,94,-1,114,-1,115,97,-1,98,-5,99,100],
    sm55=[0,-4,0,-4,0,-39,116,116,116,116,116,-1,116,-1,116,116,-1,116,-5,116,116],
    sm56=[0,-2,2,-1,0,-2,3,4,0,-3,5,-66,17],
    sm57=[0,117,-1,117,-1,0,-2,117,117,0,-3,117,-16,117,117,117,117,117,-1,117,117,117,117,117,-1,117,117,117,117,117,117,117,-29,117,117,117],
    sm58=[0,118,-3,0,-4,0,-31,119],
    sm59=[0,120,-3,0,-4,0,-31,120],
    sm60=[0,121,-3,0,-4,0,-32,121,121,121,121,121,121,121],
    sm61=[0,122,-3,0,-4,0],
    sm62=[0,123,-3,0,-4,0,-5,26,123,-1,123,123,123,123,-14,123,123,123,123,123],
    sm63=[0,124,-1,124,-1,124,-2,124,124,0,-3,124,-1,124,124,-1,124,124,124,124,124,124,124,124,124,124,124,124,-5,124,124,124,124,124,124,124,-7,124,124,124,124,124,-1,124,-1,124,124,-1,124,124,124,124,124,-1,124,124,124,124,124,124,124,124,124,124,124,124,124,124,124,-1,124],
    sm64=[0,125,-1,125,-1,125,-2,125,125,0,-3,125,-1,125,125,-1,125,125,125,125,125,125,125,125,125,125,125,125,-5,125,125,125,125,125,125,125,-7,125,125,125,125,125,-1,125,-1,125,125,-1,125,125,125,125,125,-1,125,125,125,125,125,125,125,125,125,125,125,125,125,125,125,-1,125],
    sm65=[0,126,-3,0,-4,0,-12,126,126,126,126,126,126,126,126,-5,126,126,126,126,126,126],
    sm66=[0,-4,0,-4,0,-25,127],
    sm67=[0,-4,0,-4,0,-25,128],
    sm68=[0,-4,0,-4,0,-68,129],
    sm69=[0,-4,0,-4,0,-69,130],
    sm70=[0,131,-3,0,-4,0,-12,131,131,131,131,131,131,131,131,-5,131,131,131,131,131,131,131,-13,132,-1,133,-10,101,102,103,104,105,106,107,108,109,110],
    sm71=[0,134,-3,0,-4,0,-12,134,134,134,134,134,134,134,134,-5,134,134,134,134,134,134,134],
    sm72=[0,-1,135,2,-1,0,-2,3,4,0,-3,5,-66,17],
    sm73=[0,-1,136,-2,0,-4,0],
    sm74=[0,-1,137,-2,0,-4,0],
    sm75=[0,-1,138,138,-1,0,-2,138,138,0,-3,138,-39,139,-2,140,-3,98,-5,99,100,-12,138],
    sm76=[0,141,-3,0,-4,0,-12,141,141,141,141,141,141,141,141,-5,141,141,141,141,141,141,141,-13,141,-1,141,-10,141,141,141,141,141,141,141,141,141,141],
    sm77=[0,-1,138,138,-1,0,-2,138,138,0,-3,138,-66,138],
    sm78=[0,-4,0,-4,0,-39,142],
    sm79=[0,143,144,-2,0,-4,0,-12,143,143,143,143,143,143,143,143,-5,143,143,143,143,143,143,143],
    sm80=[0,-1,144,-2,0,-4,0],
    sm81=[0,145,146,-2,0,-4,0,-12,145,145,145,145,145,145,145,145,-5,145,145,145,145,145,145,145],
    sm82=[0,-1,146,-2,0,-4,0],
    sm83=[0,-1,147,-2,0,-4,0],
    sm84=[0,-1,148,-2,0,-4,0],
    sm85=[0,-1,149,2,-1,0,-2,3,4,0,-3,5],
    sm86=[0,-1,150,150,-1,0,-2,150,150,0,-3,150],
    sm87=[0,151,-3,0,-4,0,-12,151,151,151,151,151,151,151,151,-5,151,151,151,151,151,151,151],
    sm88=[0,152,-3,0,-4,0,-12,152,152,152,152,152,152,152,152,-5,152,152,152,152,152,152,152],
    sm89=[0,143,-3,0,-4,0,-12,143,143,143,143,143,143,143,143,-5,143,143,143,143,143,143,143],
    sm90=[0,145,-3,0,-4,0,-12,145,145,145,145,145,145,145,145,-5,145,145,145,145,145,145,145],
    sm91=[0,153,-3,0,-4,0,-12,153,153,153,153,153,153,153,153,-5,153,153,153,153,153,153,153,-13,132,-1,133,-10,101,102,103,104,105,106,107,108,109,110],
    sm92=[0,154,-3,0,-4,0,-12,154,154,154,154,154,154,154,154,-5,154,154,154,154,154,154,154],
    sm93=[0,155,-3,0,-4,0,-12,155,155,155,155,155,155,155,155,-5,155,155,155,155,155,155,155,-13,132,-1,133,-10,101,102,103,104,105,106,107,108,109,110],
    sm94=[0,156,-3,0,-4,0,-12,156,156,156,156,156,156,156,156,-5,156,156,156,156,156,156,156,-7,90,91,92,93,94,-1,95,-1,96,97,-1,98,-5,99,100,101,102,103,104,105,106,107,108,109,110],
    sm95=[0,-4,0,-4,0,-32,42,43,44,45,46,47,48],
    sm96=[0,157,-3,0,-4,0,-25,157,157,157,157,157,157],
    sm97=[0,158,-3,0,-4,0,-12,158,158,158,158,-9,158,158,158,158,158,158],
    sm98=[0,159,-3,0,-4,0,-12,159,159,159,159,159,159,159,159,-5,159,159,159,159,159,159],
    sm99=[0,160,-3,0,-4,0,-12,160,160,160,160,160,160,160,160,-5,160,160,160,160,160,160],
    sm100=[0,161,-3,0,-4,0,-12,161,161,161,161,161,161,161,161,-5,161,161,161,161,161,161,161],
    sm101=[0,162,-3,0,-4,0,-12,162,162,162,162,162,162,162,162,-5,162,162,162,162,162,162,162,-13,162,-1,162,-10,162,162,162,162,162,162,162,162,162,162],
    sm102=[0,163,-3,0,-4,0,-12,163,163,163,163,163,163,163,163,-5,163,163,163,163,163,163,163,-13,163,-1,163,-10,163,163,163,163,163,163,163,163,163,163],
    sm103=[0,164,-3,0,-4,0,-12,164,164,164,164,164,164,164,164,-5,164,164,164,164,164,164,164,-13,164,-1,164,-10,164,164,164,164,164,164,164,164,164,164],
    sm104=[0,165,-3,0,-4,0,-12,165,165,165,165,165,165,165,165,-5,165,165,165,165,165,165,165,-13,165,-1,165,-10,165,165,165,165,165,165,165,165,165,165],
    sm105=[0,166,-3,0,-4,0,-12,166,166,166,166,166,166,166,166,-5,166,166,166,166,166,166,166,-13,166,-1,166,-10,166,166,166,166,166,166,166,166,166,166],
    sm106=[0,-1,167,-2,0,-4,0,-44,168],
    sm107=[0,-1,169,-2,0,-4,0,-44,170],
    sm108=[0,-1,171,171,-1,0,-2,171,171,0,-3,171,-66,171],
    sm109=[0,172,-3,0,-4,0,-12,172,172,172,172,172,172,172,172,-5,172,172,172,172,172,172,172,-13,172,-1,172,-3,173,174,175,176,177,-2,172,172,172,172,172,172,172,172,172,172],
    sm110=[0,178,-3,0,-4,0,-12,178,178,178,178,178,178,178,178,-5,178,178,178,178,178,178,178,-13,178,-1,178,-3,179,180,181,182,-3,178,178,178,178,178,178,178,178,178,178],
    sm111=[0,183,-3,0,-4,0,-12,183,183,183,183,183,183,183,183,-5,183,183,183,183,183,183,183,-13,183,-1,183,-3,183,183,183,183,-3,183,183,183,183,183,183,183,183,183,183],
    sm112=[0,184,-3,0,-4,0,-12,184,184,184,184,184,184,184,184,-5,184,184,184,184,184,184,184],
    sm113=[0,185,-3,0,-4,0,-12,185,185,185,185,185,185,185,185,-5,185,185,185,185,185,185,185],
    sm114=[0,186,-3,0,-4,0,-12,186,186,186,186,186,186,186,186,-5,186,186,186,186,186,186,186,-13,132,-1,133,-10,101,102,103,104,105,106,107,108,109,110],
    sm115=[0,187,-3,0,-4,0,-12,187,187,187,187,187,187,187,187,-5,187,187,187,187,187,187,187],
    sm116=[0,188,-3,0,-4,0,-31,188],
    sm117=[0,-1,189,-2,0,-4,0],
    sm118=[0,-1,190,-2,0,-4,0],
    sm119=[0,191,-3,0,-4,0,-12,191,191,191,191,191,191,191,191,-5,191,191,191,191,191,191,191,-13,191,-1,191,-10,191,191,191,191,191,191,191,191,191,191],
    sm120=[0,-1,192,-2,0,-4,0],
    sm121=[0,-1,193,-2,0,-4,0],
    sm122=[0,194,-3,0,-4,0,-12,194,194,194,194,194,194,194,194,-5,194,194,194,194,194,194,194,-13,194,-1,194,-10,194,194,194,194,194,194,194,194,194,194],
    sm123=[0,-1,195,195,-1,0,-2,195,195,0,-3,195],
    sm124=[0,196,-3,0,-4,0,-12,196,196,196,196,196,196,196,196,-5,196,196,196,196,196,196,196],
    sm125=[0,197,-3,0,-4,0,-12,197,197,197,197,197,197,197,197,-5,197,197,197,197,197,197,197,-13,197,-1,197,-10,197,197,197,197,197,197,197,197,197,197],
    sm126=[0,198,-3,0,-4,0,-12,198,198,198,198,198,198,198,198,-5,198,198,198,198,198,198,198,-13,198,-1,198,-10,198,198,198,198,198,198,198,198,198,198],

        // Symbol Lookup map
        lu$1 = new Map([[1,1],[2,2],[4,3],[8,4],[16,5],[32,6],[64,7],[128,8],[256,9],[512,10],[3,11],[264,12],[200,13],[201,14],["/",15],["?",16],[":",17],["f",18],["filter",19],["Filter",20],["FILTER",21],["&&",22],["AND",23],["And",24],["and",25],["||",26],["OR",27],["Or",28],["or",29],["NOT",30],["Not",31],["not",32],["!",33],["(",34],[")",35],["|",36],["s",37],["sort",38],["SORT",39],["Sort",40],[",",41],["created",42],["CREATED",43],["modifier",44],["MODIFIED",45],["size",46],["SIZE",47],["#",48],["is",49],["equals",50],["=",51],["that",52],["greater",53],["than",54],[">",55],["less",56],["<",57],["lesser",58],[null,2],["from",60],["to",61],["-",62],["TO",63],["To",64],["through",65],["on",66],["date",67],["DES",68],["des",69],["descending",70],["DESCENDING",71],["down",72],["ASC",73],["asc",74],["ascending",75],["ASCENDING",76],["up",77],["\"",78],["'",79],["*",80],["\\",82]]),

        //Reverse Symbol Lookup map
        rlu$1 = new Map([[1,1],[2,2],[3,4],[4,8],[5,16],[6,32],[7,64],[8,128],[9,256],[10,512],[11,3],[12,264],[13,200],[14,201],[15,"/"],[16,"?"],[17,":"],[18,"f"],[19,"filter"],[20,"Filter"],[21,"FILTER"],[22,"&&"],[23,"AND"],[24,"And"],[25,"and"],[26,"||"],[27,"OR"],[28,"Or"],[29,"or"],[30,"NOT"],[31,"Not"],[32,"not"],[33,"!"],[34,"("],[35,")"],[36,"|"],[37,"s"],[38,"sort"],[39,"SORT"],[40,"Sort"],[41,","],[42,"created"],[43,"CREATED"],[44,"modifier"],[45,"MODIFIED"],[46,"size"],[47,"SIZE"],[48,"#"],[49,"is"],[50,"equals"],[51,"="],[52,"that"],[53,"greater"],[54,"than"],[55,">"],[56,"less"],[57,"<"],[58,"lesser"],[2,null],[60,"from"],[61,"to"],[62,"-"],[63,"TO"],[64,"To"],[65,"through"],[66,"on"],[67,"date"],[68,"DES"],[69,"des"],[70,"descending"],[71,"DESCENDING"],[72,"down"],[73,"ASC"],[74,"asc"],[75,"ascending"],[76,"ASCENDING"],[77,"up"],[78,"\""],[79,"'"],[80,"*"],[82,"\\"]]),

        // States 
        state$1 = [sm0$1,
    sm1$1,
    sm2$1,
    sm3$1,
    sm4$1,
    sm5$1,
    sm6$1,
    sm7$1,
    sm8$1,
    sm9$1,
    sm10$1,
    sm11$1,
    sm12$1,
    sm12$1,
    sm13$1,
    sm14$1,
    sm15$1,
    sm15$1,
    sm15$1,
    sm15$1,
    sm16$1,
    sm17$1,
    sm18$1,
    sm19$1,
    sm20$1,
    sm21$1,
    sm22$1,
    sm23$1,
    sm24$1,
    sm25$1,
    sm26,
    sm27,
    sm28,
    sm29,
    sm30,
    sm31,
    sm32,
    sm33,
    sm34,
    sm35,
    sm36,
    sm37,
    sm38,
    sm39,
    sm39,
    sm39,
    sm40,
    sm41,
    sm42,
    sm43,
    sm44,
    sm45,
    sm45,
    sm45,
    sm45,
    sm46,
    sm47,
    sm47,
    sm48,
    sm40,
    sm40,
    sm49,
    sm49,
    sm49,
    sm49,
    sm50,
    sm51,
    sm51,
    sm52,
    sm53,
    sm53,
    sm54,
    sm55,
    sm55,
    sm56,
    sm57,
    sm57,
    sm57,
    sm57,
    sm58,
    sm59,
    sm60,
    sm60,
    sm60,
    sm60,
    sm61,
    sm62,
    sm63,
    sm64,
    sm46,
    sm46,
    sm46,
    sm46,
    sm46,
    sm46,
    sm46,
    sm46,
    sm65,
    sm65,
    sm65,
    sm65,
    sm66,
    sm67,
    sm68,
    sm69,
    sm70,
    sm71,
    sm72,
    sm73,
    sm74,
    sm75,
    sm76,
    sm76,
    sm77,
    sm77,
    sm78,
    sm79,
    sm80,
    sm81,
    sm82,
    sm83,
    sm84,
    sm85,
    sm86,
    sm86,
    sm87,
    sm88,
    sm89,
    sm89,
    sm89,
    sm89,
    sm89,
    sm90,
    sm90,
    sm90,
    sm90,
    sm90,
    sm91,
    sm92,
    sm93,
    sm80,
    sm82,
    sm94,
    sm95,
    sm96,
    sm96,
    sm96,
    sm96,
    sm97,
    sm97,
    sm97,
    sm97,
    sm98,
    sm99,
    sm99,
    sm100,
    sm89,
    sm90,
    sm101,
    sm102,
    sm103,
    sm104,
    sm105,
    sm105,
    sm106,
    sm107,
    sm108,
    sm109,
    sm110,
    sm111,
    sm111,
    sm112,
    sm113,
    sm114,
    sm115,
    sm116,
    sm117,
    sm118,
    sm119,
    sm120,
    sm121,
    sm121,
    sm121,
    sm121,
    sm121,
    sm122,
    sm85,
    sm123,
    sm123,
    sm123,
    sm123,
    sm124,
    sm125,
    sm126],

    /************ Functions *************/

        max$1 = Math.max, min$1 = Math.min,

        //Error Functions
        e$2 = (tk,r,o,l,p)=>{if(l.END)l.throw("Unexpected end of input");else if(l.ty & (264)) l.throw(`Unexpected space character within input "${p.slice(l)}" `) ; else l.throw(`Unexpected token [${l.tx}]`);}, 
        eh$1 = [e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2],

        //Empty Function
        nf$1 = ()=>-1, 

        //Environment Functions
        
    redv$1 = (ret, fn, plen, ln, t, e, o, l, s) => {        ln = max$1(o.length - plen, 0);        const slice = o.slice(-plen);        o.length = ln + 1;        o[ln] = fn(slice, e, l, s, o, plen);        return ret;    },
    rednv$1 = (ret, Fn, plen, ln, t, e, o, l, s) => {        ln = max$1(o.length - plen, 0);        const slice = o.slice(-plen);        o.length = ln + 1;        o[ln] = new Fn(slice, e, l, s, o, plen);        return ret;    },
    redn$1 = (ret, plen, t, e, o) => {        if (plen > 0) {            let ln = max$1(o.length - plen, 0);            o[ln] = o[o.length - 1];            o.length = ln + 1;        }        return ret;    },
    shftf$1 = (ret, fn, t, e, o, l, s) => (fn(o, e, l, s), ret),
    C20_query_body=function (sym){this.container = sym[0];this.filter = sym[1];this.sort = sym[2];},
    C21_query_body=function (sym){this.container = null;this.filter = sym[0];this.sort = sym[1];},
    C22_query_body=function (sym){this.container = sym[0];this.filter = null;this.sort = sym[1];},
    C23_query_body=function (sym){this.container = sym[0];this.filter = sym[1];this.sort = null;},
    C24_query_body=function (sym){this.container = null;this.filter = null;this.sort = sym[0];},
    C25_query_body=function (sym){this.container = null;this.filter = sym[0];this.sort = null;},
    C26_query_body=function (sym){this.container = sym[0];this.filter = null;this.sort = null;},
    C27_query_body=function (){this.container = null;this.filter = null;this.sort = null;},
    R30_container_identifier_list=sym=>(((sym[1] !== null) ? sym[0].push(sym[1]) : null,sym[0])),
    R31_container_identifier_list=sym=>(sym[0] !== null) ? [sym[0]] : [],
    C40_container_clause=function (sym){this.containers = [{ids : [""]},...sym[1]];this.id = sym[2];if(this.id)if(this.id.ids.length == 1 && this.id.ids[0] == "*"){if(!this.containers)this.containers = [];this.containers.push(this.id);this.id = null;}},
    C41_container_clause=function (sym){this.containers = [{ids : [""]},...sym[0]];this.id = sym[1];if(this.id)if(this.id.ids.length == 1 && this.id.ids[0] == "*"){if(!this.containers)this.containers = [];this.containers.push(this.id);this.id = null;}},
    C42_container_clause=function (sym){this.containers = [{ids : [""]}];this.id = sym[1];if(this.id)if(this.id.ids.length == 1 && this.id.ids[0] == "*"){if(!this.containers)this.containers = [];this.containers.push(this.id);this.id = null;}},
    C43_container_clause=function (sym){this.containers = [{ids : [""]},...sym[1]];this.id = null;if(this.id)if(this.id.ids.length == 1 && this.id.ids[0] == "*"){if(!this.containers)this.containers = [];this.containers.push(this.id);this.id = null;}},
    C44_container_clause=function (sym){this.containers = [{ids : [""]}];this.id = sym[0];if(this.id)if(this.id.ids.length == 1 && this.id.ids[0] == "*"){if(!this.containers)this.containers = [];this.containers.push(this.id);this.id = null;}},
    C45_container_clause=function (sym){this.containers = [{ids : [""]},...sym[0]];this.id = null;if(this.id)if(this.id.ids.length == 1 && this.id.ids[0] == "*"){if(!this.containers)this.containers = [];this.containers.push(this.id);this.id = null;}},
    C46_container_clause=function (){this.containers = [{ids : [""]}];this.id = null;if(this.id)if(this.id.ids.length == 1 && this.id.ids[0] == "*"){if(!this.containers)this.containers = [];this.containers.push(this.id);this.id = null;}},
    R50_container_identifier=sym=>sym[0],
    R70_filter_clause=sym=>sym[1],
    R71_filter_clause=()=>null,
    C90_and_expression=function (sym){this.type = "AND";this.left = sym[0];this.right = sym[2];},
    C100_or_expression=function (sym){this.type = "OR";this.left = sym[0];this.right = sym[2];},
    C110_not_expression=function (sym){this.type = "NOT";this.left = sym[1];},
    C120_wrapped_expression=function (sym){this.type = "MATCH";this.value = sym[0];},
    R140_stetement_list=sym=>(((sym[1] !== null) ? sym[0].push(sym[2]) : null,sym[0])),
    C180_created_statement=function (sym){this.type = "CREATED";this.val = sym[1];this.order = sym[2] || 1;},
    C181_created_statement=function (sym){this.type = "CREATED";this.val = null;this.order = sym[1] || 1;},
    C182_created_statement=function (sym){this.type = "CREATED";this.val = sym[1];this.order = 1;},
    C183_created_statement=function (){this.type = "CREATED";this.val = null;this.order = 1;},
    C200_modified_statement=function (sym){this.type = "MODIFIED";this.val = sym[1];this.order = sym[2] || 1;},
    C201_modified_statement=function (sym){this.type = "MODIFIED";this.val = null;this.order = sym[1] || 1;},
    C202_modified_statement=function (sym){this.type = "MODIFIED";this.val = sym[1];this.order = 1;},
    C203_modified_statement=function (){this.type = "MODIFIED";this.val = null;this.order = 1;},
    C220_size_statement=function (sym){this.type = "SIZE";this.val = sym[1];this.order = sym[2] || 1;},
    C221_size_statement=function (sym){this.type = "SIZE";this.val = sym[1];this.order = 1;},
    C230_tag_statement=function (sym){this.type = "TAG";this.id = sym[1];this.val = sym[2];this.order = sym[3] || 1;},
    C231_tag_statement=function (sym){this.type = "TAG";this.id = sym[1];this.val = null;this.order = sym[2] || 1;},
    C232_tag_statement=function (sym){this.type = "TAG";this.id = sym[1];this.val = sym[2];this.order = 1;},
    C233_tag_statement=function (sym){this.type = "TAG";this.id = sym[1];this.val = null;this.order = 1;},
    R270_comparison_expression=sym=>({type : "EQUALS_QUANTITATIVE",val : parseFloat(sym[1])}),
    R271_comparison_expression=sym=>({type : "EQUALS_QUALITATIVE",val : sym[1]}),
    R272_comparison_expression=sym=>({type : "GREATERTHAN",val : parseFloat(sym[1])}),
    R273_comparison_expression=sym=>({type : "LESSTHAN",val : parseFloat(sym[1])}),
    R310_range_expression=sym=>({type : "RANGE",val : [sym[1],sym[2]].map(parseFloat).sort((a,b)=>a < b ? -1 : 1)}),
    R311_range_expression=sym=>({type : "RANGE",val : [sym[1]].map(parseFloat).sort((a,b)=>a < b ? -1 : 1)}),
    R360_date_expression=sym=>({type : "DATE",val : [sym[1],sym[2]].map(d=>new Date(d).valueOf()).sort((a,b)=>a < b ? -1 : 1)}),
    R361_date_expression=sym=>({type : "DATE",val : [sym[1]].map(d=>new Date(d).valueOf()).sort((a,b)=>a < b ? -1 : 1)}),
    R390_order=()=>-1,
    R391_order=()=>1,
    C410_identifier=function (sym){this.ids = sym[0];},
    R440_string_data_val_list=sym=>sym[0] + sym[1],
    R441_string_data_val_list=sym=>sym[0] + "",
    R450_string_data=sym=>[sym[0],...sym[1]].join("").trim(),
    R451_string_data=sym=>[sym[0]].join("").trim(),

        //Sparse Map Lookup
        lsm$1 = (index, map) => {    if (map[0] == 0xFFFFFFFF) return map[index + 1];    for (let i = 1, ind = 0, l = map.length, n = 0; i < l && ind <= index; i++) {        if (ind !== index) {            if ((n = map[i]) > -1) ind++;            else ind += -n;        } else return map[i];    }    return -1;},

        //State Action Functions
        state_funct$1 = [(...v)=>(redn$1(2051,0,...v)),
    e=>78,
    e=>74,
    e=>70,
    e=>66,
    e=>26,
    e=>86,
    e=>90,
    e=>94,
    e=>98,
    e=>102,
    e=>110,
    e=>114,
    e=>118,
    e=>122,
    e=>126,
    e=>58,
    (...v)=>redn$1(5,1,...v),
    (...v)=>redn$1(1031,1,...v),
    (...v)=>rednv$1(2055,C26_query_body,1,0,...v),
    (...v)=>rednv$1(2055,C25_query_body,1,0,...v),
    (...v)=>rednv$1(2055,C24_query_body,1,0,...v),
    (...v)=>rednv$1(4103,C46_container_clause,1,0,...v),
    (...v)=>rednv$1(4103,C45_container_clause,1,0,...v),
    (...v)=>rednv$1(4103,C44_container_clause,1,0,...v),
    e=>158,
    (...v)=>redv$1(3079,R31_container_identifier_list,1,0,...v),
    (...v)=>rednv$1(41991,C410_identifier,1,0,...v),
    (...v)=>redv$1(40967,R31_container_identifier_list,1,0,...v),
    (...v)=>redn$1(43015,1,...v),
    (...v)=>redn$1(47111,1,...v),
    (...v)=>redv$1(46087,R451_string_data,1,0,...v),
    e=>182,
    e=>186,
    (...v)=>redn$1(50183,1,...v),
    (...v)=>redv$1(7175,R71_filter_clause,1,0,...v),
    e=>206,
    e=>210,
    e=>214,
    e=>218,
    e=>222,
    e=>266,
    e=>270,
    e=>278,
    e=>282,
    e=>290,
    e=>294,
    e=>298,
    e=>238,
    e=>242,
    (...v)=>redn$1(6151,1,...v),
    e=>302,
    e=>306,
    e=>310,
    e=>314,
    (...v)=>redv$1(15367,R71_filter_clause,1,0,...v),
    (...v)=>redn$1(13319,1,...v),
    e=>326,
    e=>330,
    e=>334,
    e=>338,
    (...v)=>rednv$1(2059,C23_query_body,2,0,...v),
    (...v)=>rednv$1(2059,C22_query_body,2,0,...v),
    (...v)=>rednv$1(2059,C21_query_body,2,0,...v),
    (...v)=>rednv$1(4107,C43_container_clause,2,0,...v),
    (...v)=>rednv$1(4107,C42_container_clause,2,0,...v),
    (...v)=>rednv$1(4107,C41_container_clause,2,0,...v),
    (...v)=>redv$1(3083,R30_container_identifier_list,2,0,...v),
    (...v)=>redv$1(5131,R50_container_identifier,2,0,...v),
    (...v)=>redv$1(40971,R30_container_identifier_list,2,0,...v),
    (...v)=>redv$1(46091,R450_string_data,2,0,...v),
    (...v)=>redv$1(45063,R441_string_data_val_list,1,0,...v),
    (...v)=>redn$1(48135,1,...v),
    (...v)=>redv$1(7179,R70_filter_clause,2,0,...v),
    (...v)=>redn$1(9223,1,...v),
    e=>358,
    e=>362,
    e=>366,
    e=>370,
    (...v)=>redn$1(10247,1,...v),
    e=>374,
    e=>378,
    e=>382,
    e=>386,
    (...v)=>redn$1(11271,1,...v),
    (...v)=>rednv$1(12295,C120_wrapped_expression,1,0,...v),
    (...v)=>redn$1(12295,1,...v),
    (...v)=>redn$1(16391,1,...v),
    (...v)=>rednv$1(18439,C183_created_statement,1,0,...v),
    e=>442,
    e=>454,
    e=>458,
    e=>462,
    e=>470,
    e=>466,
    e=>474,
    e=>478,
    e=>486,
    e=>494,
    e=>498,
    e=>510,
    e=>514,
    e=>518,
    e=>522,
    e=>526,
    e=>530,
    e=>534,
    e=>538,
    e=>542,
    e=>546,
    (...v)=>redn$1(17415,1,...v),
    (...v)=>rednv$1(20487,C203_modified_statement,1,0,...v),
    (...v)=>redn$1(19463,1,...v),
    e=>562,
    e=>566,
    (...v)=>redn$1(21511,1,...v),
    (...v)=>redn$1(6155,2,...v),
    (...v)=>redv$1(15371,R70_filter_clause,2,0,...v),
    e=>574,
    (...v)=>redv$1(14343,R31_container_identifier_list,1,0,...v),
    (...v)=>redn$1(13323,2,...v),
    (...v)=>rednv$1(2063,C20_query_body,3,0,...v),
    (...v)=>rednv$1(4111,C40_container_clause,3,0,...v),
    (...v)=>redv$1(45067,R440_string_data_val_list,2,0,...v),
    (...v)=>redv$1(49163,R70_filter_clause,2,0,...v),
    (...v)=>rednv$1(11275,C110_not_expression,2,0,...v),
    e=>610,
    (...v)=>redn$1(8199,1,...v),
    e=>614,
    e=>618,
    (...v)=>rednv$1(18443,C182_created_statement,2,0,...v),
    e=>626,
    e=>630,
    (...v)=>rednv$1(18443,C181_created_statement,2,0,...v),
    e=>634,
    e=>642,
    e=>646,
    (...v)=>redn$1(24583,1,...v),
    e=>658,
    e=>662,
    (...v)=>redv$1(27655,R50_container_identifier,1,0,...v),
    e=>666,
    (...v)=>redn$1(37895,1,...v),
    (...v)=>redn$1(25607,1,...v),
    (...v)=>redn$1(38919,1,...v),
    (...v)=>redn$1(26631,1,...v),
    e=>670,
    (...v)=>redn$1(28679,1,...v),
    e=>682,
    (...v)=>redn$1(32775,1,...v),
    (...v)=>redv$1(39943,R390_order,1,0,...v),
    (...v)=>redv$1(39943,R391_order,1,0,...v),
    (...v)=>rednv$1(20491,C202_modified_statement,2,0,...v),
    (...v)=>rednv$1(20491,C201_modified_statement,2,0,...v),
    (...v)=>rednv$1(22539,C221_size_statement,2,0,...v),
    (...v)=>rednv$1(23563,C233_tag_statement,2,0,...v),
    (...v)=>rednv$1(9231,C90_and_expression,3,0,...v),
    (...v)=>rednv$1(10255,C100_or_expression,3,0,...v),
    (...v)=>redv$1(12303,R70_filter_clause,3,0,...v),
    (...v)=>redv$1(44047,R70_filter_clause,3,0,...v),
    (...v)=>rednv$1(18447,C180_created_statement,3,0,...v),
    (...v)=>redv$1(27659,R270_comparison_expression,2,0,...v),
    (...v)=>redv$1(27659,R271_comparison_expression,2,0,...v),
    (...v)=>redv$1(27659,R272_comparison_expression,2,0,...v),
    (...v)=>redv$1(27659,R273_comparison_expression,2,0,...v),
    (...v)=>redv$1(27659,R70_filter_clause,2,0,...v),
    (...v)=>redn$1(25611,2,...v),
    e=>706,
    (...v)=>redn$1(26635,2,...v),
    e=>710,
    (...v)=>redn$1(24587,2,...v),
    (...v)=>redv$1(31755,R311_range_expression,2,0,...v),
    e=>722,
    e=>726,
    e=>730,
    e=>734,
    e=>738,
    (...v)=>redv$1(36875,R361_date_expression,2,0,...v),
    e=>750,
    e=>754,
    e=>758,
    e=>762,
    (...v)=>redn$1(33799,1,...v),
    (...v)=>rednv$1(20495,C200_modified_statement,3,0,...v),
    (...v)=>rednv$1(22543,C220_size_statement,3,0,...v),
    (...v)=>rednv$1(23567,C232_tag_statement,3,0,...v),
    (...v)=>rednv$1(23567,C231_tag_statement,3,0,...v),
    (...v)=>redv$1(14351,R140_stetement_list,3,0,...v),
    (...v)=>redn$1(25615,3,...v),
    (...v)=>redn$1(26639,3,...v),
    (...v)=>redv$1(31759,R310_range_expression,3,0,...v),
    e=>770,
    (...v)=>redn$1(29703,1,...v),
    (...v)=>redv$1(36879,R360_date_expression,3,0,...v),
    (...v)=>redn$1(34823,1,...v),
    (...v)=>rednv$1(23571,C230_tag_statement,4,0,...v),
    (...v)=>redv$1(30731,R70_filter_clause,2,0,...v),
    (...v)=>redv$1(35851,R70_filter_clause,2,0,...v)],

        //Goto Lookup Functions
        goto$1 = [v=>lsm$1(v,gt0$1),
    nf$1,
    nf$1,
    v=>lsm$1(v,gt1$1),
    v=>lsm$1(v,gt2$1),
    nf$1,
    v=>lsm$1(v,gt3$1),
    v=>lsm$1(v,gt4$1),
    nf$1,
    nf$1,
    v=>lsm$1(v,gt5$1),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt6$1),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt7$1),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt8),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt9),
    nf$1,
    nf$1,
    v=>lsm$1(v,gt10),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt11),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt12),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt13),
    v=>lsm$1(v,gt14),
    v=>lsm$1(v,gt15),
    v=>lsm$1(v,gt16),
    v=>lsm$1(v,gt17),
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt18),
    v=>lsm$1(v,gt19),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt20),
    nf$1,
    nf$1,
    v=>lsm$1(v,gt21),
    nf$1,
    nf$1,
    v=>lsm$1(v,gt22),
    nf$1,
    nf$1,
    v=>lsm$1(v,gt23),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt24),
    v=>lsm$1(v,gt25),
    v=>lsm$1(v,gt26),
    v=>lsm$1(v,gt27),
    v=>lsm$1(v,gt28),
    v=>lsm$1(v,gt29),
    v=>lsm$1(v,gt30),
    v=>lsm$1(v,gt31),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt32),
    nf$1,
    v=>lsm$1(v,gt33),
    nf$1,
    nf$1,
    v=>lsm$1(v,gt34),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt35),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt36),
    nf$1,
    v=>lsm$1(v,gt37),
    nf$1,
    nf$1,
    v=>lsm$1(v,gt38),
    v=>lsm$1(v,gt39),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt40),
    v=>lsm$1(v,gt41),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt42),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt43),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1];

    function getToken$1(l, SYM_LU) {
        if (l.END) return 0; /*$eof*/

        switch (l.ty) {
            case 2:
                //*
                if (SYM_LU.has(l.tx)) return 14;
                /*/
                    console.log(l.tx, SYM_LU.has(l.tx), SYM_LU.get(l.tx))
                    if (SYM_LU.has(l.tx)) return SYM_LU.get(l.tx);
                //*/
                return 2;
            case 1:
                return 1;
            case 4:
                return 3;
            case 256:
                return 9;
            case 8:
                return 4;
            case 512:
                return 10;
            default:
                return SYM_LU.get(l.tx) || SYM_LU.get(l.ty);
        }
    }

    /************ Parser *************/

    function parser$1(l, e = {}) {

        fn$1 = e.functions;

        l.IWS = false;
        l.PARSE_STRING = true;

        if (symbols$1.length > 0) {
            symbols$1.forEach(s => { l.addSymbol(s); });
            l.tl = 0;
            l.next();
        }

        const o = [],
            ss = [0, 0];

        let time = 1000000,
            RECOVERING = 100,
            RESTARTED = true,
            tk = getToken$1(l, lu$1),
            p = l.copy(),
            sp = 1,
            len = 0,
            reduceStack = (e.reduceStack = []),
            ROOT = 10000,
            off = 0;

        outer:

            while (time-- > 0) {

                const fn = lsm$1(tk, state$1[ss[sp]]) || 0;

                let r,
                    gt = -1;

                if (fn == 0) {
                    /*Ignore the token*/
                    tk = getToken$1(l.next(), lu$1);
                    continue;
                }

                if (fn > 0) {
                    r = state_funct$1[fn - 1](tk, e, o, l, ss[sp - 1]);
                } else {

                    if (tk == 14) {
                        tk = lu$1.get(l.tx);
                        continue;
                    }

                    if (l.ty == 8 && l.tl > 1) {
                        // Make sure that special tokens are not getting in the way
                        l.tl = 0;
                        // This will skip the generation of a custom symbol
                        l.next(l, false);

                        if (l.tl == 1)
                            continue;
                    }

                    if (RECOVERING > 1 && !l.END) {

                        if (tk !== lu$1.get(l.ty)) {
                            tk = lu$1.get(l.ty);
                            continue;
                        }

                        if (tk !== 13) {
                            tk = 13;
                            RECOVERING = 1;
                            continue;
                        }
                    }

                    tk = getToken$1(l, lu$1);

                    const recovery_token = eh$1[ss[sp]](tk, e, o, l, p, ss[sp], (lex) => getToken$1(lex, lu$1));

                    if (RECOVERING > 0 && recovery_token >= 0) {
                        RECOVERING = -1; /* To prevent infinite recursion */
                        tk = recovery_token;
                        l.tl = 0; /*reset current token */
                        continue;
                    }
                }

                switch (r & 3) {
                    case 0:
                        /* ERROR */

                        if (tk == "$eof")
                            l.throw("Unexpected end of input");

                        l.throw(`Unexpected token [${RECOVERING ? l.next().tx : l.tx}]`);
                        return [null];

                    case 1:
                        /* ACCEPT */
                        break outer;

                    case 2:

                        /*SHIFT */
                        o.push(l.tx);
                        ss.push(off, r >> 2);
                        sp += 2;
                        l.next();
                        off = l.off;
                        tk = getToken$1(l, lu$1);
                        RECOVERING++;
                        break;

                    case 3:
                        /* REDUCE */
                        RESTARTED = true;

                        len = (r & 0x3FC) >> 1;

                        ss.length -= len;
                        sp -= len;
                        gt = goto$1[ss[sp]](r >> 10);

                        if (gt < 0)
                            l.throw("Invalid state reached!");

                        if (reduceStack.length > 0) {
                            let i = reduceStack.length - 1;
                            while (i > -1) {
                                const item = reduceStack[i--];

                                if (item.index == sp) {
                                    item.action(output);
                                } else if (item.index > sp) {
                                    reduceStack.length--;
                                } else {
                                    break;
                                }
                            }
                        }

                        ss.push(off, gt);
                        sp += 2;
                        break;
                }
            }
        return o[0];
    };

    function matchString(strings, to_match_string, offset = 0, index = 0, FOLLOWING_WILD_CARD = (offset == 0)) {

        if (index == strings.length)
            return FOLLOWING_WILD_CARD ? to_match_string.length : offset;

        const string = strings[index];

        if (string == "*")
            return matchString(strings, to_match_string, offset, index + 1, true);
        else if (!string)
            return matchString(strings, to_match_string, offset, index + 1, FOLLOWING_WILD_CARD);
        else {

            const i = to_match_string.indexOf(string, offset);

            if (i >= 0 && (FOLLOWING_WILD_CARD || i == offset))
                return matchString(strings, to_match_string, i + string.length, index + 1)
        }

        return -1;
    }

    function parseId(identifier, string) {
        if (!identifier)
            return true;

        if (!string)
            return false;

        return matchString(identifier.ids, string) >= 0;
    }

    function parseContainer(identifiers, ContainerEntry, output, idI = 0, pI = 0) {}

    function sortValue(value_op, value) {
        if (value_op)
            switch (value_op.type) {
                case "EQUALS_QUANTITATIVE":
                case "GREATERTHAN":
                case "LESSTHAN":
                case "RANGE":
                    return parseFloat(value);
                case "DATE":
                    return new Date(value).valueOf();
            }

        if (!isNaN(value))
            return parseFloat(value);

        return value || true;
    }

    function sortTag(note, tag_op) {

        const ids = tag_op.id.ids;

        for (let i = 0; i < note.tags.length; i++) {

            const tag = (note.tags[i] + "").split(":");

            if (matchString(ids, tag[0]) >= 0) {

                return sortValue(tag_op.val, tag[1]);
            }
        }

        return false;
    }

    function getValue(sort_op, note) {
        switch (sort_op.type) {
            case 'TAG':
                return sortTag(note, sort_op);
                break;
            case 'CREATED':
                return note.created;
                break;
            case 'MODIFIED':
                return note.modified;
                break;
            case 'SIZE':
                return note.body.length;
                break;
        }
    }

    function mergeSort(tuples, start, end, order, temp = tuples.slice()) {
        if (end - start < 2) return tuples;

        const middle = start + ((end - start) >> 1);

        mergeSort(tuples, start, middle, order, temp);
        mergeSort(tuples, middle, end, order, temp);

        let i = 0,
            t = start,
            left = start,
            right = middle;

        if (order > 0)
            while ((left < middle) && (right < end)) {
                if (tuples[left].v <= tuples[right].v)
                    temp[t++] = tuples[left++];
                else
                    temp[t++] = tuples[right++];
            }
        else
            while ((left < middle) && (right < end)) {
                if (tuples[left].v > tuples[right].v)
                    temp[t++] = tuples[left++];
                else
                    temp[t++] = tuples[right++];
            }

        for (i = left; i < middle; i++)
            temp[t++] = tuples[i];

        for (i = right; i < end; i++)
            temp[t++] = tuples[i];

        for(i = start; i < end;i++)
            tuples[i] = temp[i];
    }

    function quickSort(tuples, start, end, order) {
        if (end - start < 2) return tuples;

        // console.log(tuples.map(t=>t.i))

        const
            divide_item = tuples[start],
            divide_val = divide_item.v;

        let low = start;
        let high = end - 1;

        if (order > 0) {
            outer: while (1) {
                while (tuples[high].v >= divide_val) {
                    high--;
                    if (high <= low) {
                        tuples[low] = divide_item;
                        break outer;
                    }
                }
                tuples[low] = tuples[high];
                low++;
                while (tuples[low].v < divide_val) {
                    low++;
                    if (low >= high) {
                        low = high;
                        tuples[low] = divide_item;
                        break outer;
                    }
                }
                tuples[high] = tuples[low];
            }
        }
        else {
            outerb: while (1) {
                while (tuples[high].v <= divide_val) {
                    high--;
                    if (high <= low) {
                        tuples[low] = divide_item;
                        break outerb;
                    }
                }
                tuples[low] = tuples[high];
                low++;
                while (tuples[low].v > divide_val) {
                    low++;
                    if (low >= high) {
                        low = high;
                        tuples[low] = divide_item;
                        break outerb;
                    }
                }
                tuples[high] = tuples[low];
            }
        }

        quickSort(tuples, start, low, order);
        quickSort(tuples, low + 1, end, order);

        return tuples;
    }

    function insertionSort(tuples, start, end, order) {

        //console.log(order, start, end)
        if (order > 0) {
            //console.log("ADASD!!")
            for (let i = start; i < end; i++) {
                for (let j = start; j < i; j++) {
                    if (tuples[j].v > tuples[i].v) {
                        const jv = tuples[i];

                        let e = i;

                        while (e >= j)
                            tuples[e--] = tuples[e];

                        tuples[j] = jv;

                        continue
                    }
                }
            }
        } else {
            //console.log("ADASD", start, end)
            for (let i = start; i < end; i++) {
                for (let j = start; j < i; j++) {
                    if (tuples[j].v < tuples[i].v) {
                        const jv = tuples[i];

                        let e = i;

                        while (e >= j)
                            tuples[e--] = tuples[e];

                        tuples[j] = jv;

                        continue
                    }
                }
            }
        }
    }

    function jsSort(tuples, start, end, order) {
        if (order > 0) {
            tuples.sort((n1, n2) => n1.v < n2.v ? -1 : n1.v > n2.v ? 1 : 0);
        } else {
            tuples.sort((n1, n2) => n1.v < n2.v ? 1 : n1.v > n2.v ? -1 : 0);
        }
    }

    const sortAlgorithm = jsSort;

    function sortProcessor(sort, notes, tuples = [], start = 0, end = notes.length, index = 0) {
        const sort_op = sort[index];

        if (tuples.length == 0)
            //Extract note values
            for (let i = start; i < end; i++)
                tuples.push({ v: getValue(sort_op, notes[i]), i });
        else {
            //console.log(start, end)
            for (let i = start; i < end; i++) {
                tuples[i].v = getValue(sort_op, notes[tuples[i].i]);
            }
        }
        const
            order = sort_op.order || -1;

        //console.log("SSSSSSSSSSSSSSSSSS",order, {start,end})

        //console.log(tuples)
        sortAlgorithm(tuples, start, end, order);

        if (index + 1 < sort.length) {
            //*/
            sortProcessor(sort, notes, tuples, start, end, index + 1);
            /*/ //*
            let
                old_value = null,
                last_index = 0;
            for (let i = 0; i < tuples.length; i++) {

                const val = tuples[i].v;

                if (old_value !== null && old_value != val) {

                    if (i - last_index > 1)
                        sortProcessor(sort, notes, tuples, last_index, i, index + 1);

                    last_index = i;
                }

                old_value = val;
            } //*/
        }

        return tuples
    }

    function sort(query_sort, notes) {
        const start = process.hrtime();
        //*/
        const tuples = sortProcessor(query_sort.reverse(), notes);
        /*/ //*
        const tuples = sortProcessor(query_sort, notes);
        //*/
        //console.log(process.hrtime(start)[1] / 1000000 + "ms")
        //console.log(tuples)
        return tuples.map(t => (notes[t.i]));
    }

    function filterValue(value_op, value) {
    	
    	if(!value_op)
    		return true;

        if (!value)
            return false;

        const val = value_op.val;
        
        switch (value_op.type) {
            case "EQUALS_QUALITATIVE":
                var v = matchString(val.ids, value) >= 0;
                return v
                break;
            case "EQUALS_QUANTITATIVE":
                value = parseFloat(value);
                return !isNaN(value) && (value == val);
                break;
            case "GREATERTHAN":
                value = parseFloat(value);
                return !isNaN(value) && (value < val);
                break;
            case "LESSTHAN":
                value = parseFloat(value);
                return !isNaN(value) && (value > val);
                break;
            case "RANGE":
                value = parseFloat(value);
                return !isNaN(value) && (value >= val[0] && value <= val[1]);
                break;
            case "DATE":

                value = new Date(value).valueOf();

                return !isNaN(value) && (
                    val.length > 1 ?
                    (value >= val && value <= val[1]) :
                    (value & val == value)
                );

                break;
        }
        return false;
    }

    function filterTag(note, tag_op) {

        const ids = tag_op.id.ids;

        for (let i = 0; i < note.tags.length; i++) {

            const tag = (note.tags[i] + "").split(":");

            if (matchString(ids, tag[0]) >= 0) {

                if (tag_op.val)
                    return filterValue(tag_op.val, tag[1]);

                return true;
            }
        }

        return false;
    }

    /* Returns a Boolean value indicating whether the note's data matches the query */
    function filterProcessor(filter, note) {

        switch (filter.type) {
            case "NOT":
                return ! filterProcessor(filter.left, note)
            case "AND":
                return filterProcessor(filter.left, note) && filterProcessor(filter.right, note)
            case "OR":
                return filterProcessor(filter.left, note) || filterProcessor(filter.right, note)
            case "MATCH":
                return matchString(filter.value.ids, note.query_data) >= 0;
            case "TAG":
                return filterTag(note, filter);
                break;
           case 'CREATED':
                return filterValue(filter.val, note.created);;
                break;
            case 'MODIFIED':
                return filterValue(filter.val, note.modified);;
                break;
            case 'SIZE':
                return filterValue(filter.val, note.body.length);;
                break;
        }
    }

    function filter(filter_op, notes){
     	return notes.filter(n=>filterProcessor(filter_op, n));
    }

    function QueryEngine(
        server, // Server functions that the query engine will use 
        CAN_USE_WORKER = false
    ) {

        /** Get Containers Functions should return a list of notes that match the query.container property. **/
        if (!server.getNotesFromContainer)
            throw new Error("Server not implemented with getNotesFromContainer method. Cannot create Query Engine");

        /** Get UID function should return a note indexed by the uid **/
        if (!server.getNoteFromUID)
            throw new Error("Server not implemented with getNoteFromUID method. Cannot create Query Engine");

        const
            SERVER_getNotesFromContainer = server.getNotesFromContainer.bind(server),
            SERVER_getNoteFromUID = server.getNoteFromUID.bind(server);

        const default_container = [{ ids: [""] }];

        /** ((new_note)(js_crawler.function))

        This function handles queries using thread primitives to split query 
        results over multiple threads to ensure maximum throughput.

        Queries occur in multiple passes. 
            - The first pass generates a list of note queriables that are comprised of 
                a. UID
                b. ID - TAG - BODY information
             
             These are selected based on the container portion of the query. i.e. ( => [container.container. id ] <= : ...)
             Multiple lists of this type can be generated based on strategies such as 
                - One MOAL (Mother of all lists), later split into equal parts
                - One list per container
                - Round Robin placement of lists generate per container into buckets
             These strategies can allow container group lookup to be distributed between computing units

            - Once a set of lists are generated, they are distributed to individual computing units to handle the second query action
            Each note is matched against the second query portion (... : =>[...]<=), and winning items are placed in output lists.

            Once all inputs have been processed, items are sorted based on the query criteria, or based on modified date. Results with duplicate UIDs are removed. 

            A list of UIDs are passed back to the client. The client can decide to query the server for the actual note contents, or do something else with the UID information.
        */

        return async function runQuery(query_string, container) {

            var results = [];

            if (!query_string)
                return results;

            if (UID.stringIsUID(query_string + ""))
                return [SERVER_getNoteFromUID(query_string)];

            if (Array.isArray(query_string)) {
                for (const item of query_string)
                    results = results.concat(await runQuery(item));
                return results;
            }

            /************************************* UTILIZING QUERY SYNTAX *********************************************/
            var query;
            try {
                query = parser$1(whind(query_string + ""));
            } catch (e) {
                console.error(e);
                return [];
            }

            const uids = container.query(query.container.containers || default_container);

            for (const uid of uids)
                results.push(...await SERVER_getNotesFromContainer(uid));

            if (query.container && query.container.id) {

                const id = query.container.id;

                results = results.filter(note => parseId(id, container.getNoteID(note.id)));
            }

            if (!results || results.length == 0)
                return [];

            if (query.filter)
                results = filter(query.filter, results);

            if (query.sort)
                results = sort(query.sort, results);

            return results;
        }
    }

    /*
        This Module is responsible for creating lookup and comparison tables for 
        the container syntax of the note system. Container syntax follows a classical
        direcotory structure form, where note is in a location denoted by /dir/dir/../note id.

        The return value of container is a key which represents the bucket | dir | container
        with which the server should store the note. This value is determined by criteria
        such as the number of containers, the number of notes per container, the uniquiness of a particalar
        notes container specifier. 
    */

    function getContainerPortion(id_string, delimeter = "/") {
        const
            string = id_string.toString().trim(),
            val = (string[0] == delimeter ? string : delimeter + string).lastIndexOf(delimeter);

        return string.slice(0, val > -1 && val || 0);
    }

    function getNoteID(id_string, delimeter = "/") {
        const
            string = id_string.toString().trim();

        return string.slice(string.lastIndexOf(delimeter) + 1);
    }

    function getContainerArray(id_string, delimeter = "/") {
        return id_string.trim().split(delimeter);
    }

    function getOrCreateContainerEntry(container_entry, array, index = 1) {

        if (array.length == index)
            return container_entry;

        return getOrCreateContainerEntry(
            container_entry.getContainer(array[index]),
            array,
            index + 1
        );
    }

    class ContainerEntry {

        constructor(id = "", full_name = "") {
            this._ctr_ = null;
            this.id = id + "";
            this.full_name = `${full_name}${this.id}/`;
            this.uid = new UID;
        }

        getContainer(id) {
            if (this.containers.has(id))
                return this._ctr_.get(id);

            const val = new ContainerEntry(id, this.full_name);

            return (this._ctr_.set(id, val), val);
        }

        get containers() {
            if (!this._ctr_)
                this._ctr_ = new Map;
            return this._ctr_;
        }
    }

    function getAll(container, out = []) {
        for (const c of container.values()) {
            out.push(c.uid.string);
            getAll(c, out);
        }
        return out;
    }

    class Container {

        constructor(delimeter = "/") {
            this.root = new ContainerEntry();
        }

        /** Build Or Rebuild Container Index */
        build() {}

        change(old_id, new_id = "", delimeter = "/") {
            //No change on notes with same id
            if (old_id === new_id || !new_id)
                return this.get(old_id);

            if (!new_id)
                return { id: null, val: new_id };

            const { uid, val } = this.get(new_id, delimeter), { uid: old_uid_out, val: old_val } = this.get(old_id, delimeter);

            return { uid, val, old_val, old_uid_out };
        }

        getAll() {
            return getAll(this.root);
        }

        get(id, delimeter = "/") {
            if (id[0] !== delimeter)
                id = delimeter + id;

            const array = getContainerArray(getContainerPortion(id + "", delimeter + ""), delimeter + "");

            var { full_name: val, uid } = getOrCreateContainerEntry(this.root, array);

            return { uid, val };
        }

        query(container_query) {

            const out = [];

            parseContainer$1(container_query, this.root, out);

            return out;
        }

        getContainerID(id) {
            return getContainerPortion(id);
        }

        getNoteID(id) {
            return getNoteID(id);
        }
    }

    function parseContainer$1(identifiers, ContainerEntry, output = [], idI = 1, FOLLOWING_WILD_CARD = false) {

        if (!identifiers || idI == identifiers.length) {

            if (FOLLOWING_WILD_CARD && ContainerEntry._ctr_)
                for (const ctr of ContainerEntry._ctr_.values())
                    parseContainer$1(identifiers, ctr, output, idI, true);

            return output.push(ContainerEntry.uid);
        }

        var offset = 0;

        const
            identifier = identifiers[idI].ids,
            HAS_SUB_CONTAINERS = !!ContainerEntry._ctr_;

        if (identifier[0] == "*" && identifier.length == 1) {

            if (identifiers.length == idI + 1)
                output.push(ContainerEntry.uid);

            if (HAS_SUB_CONTAINERS)
                for (const ctr of ContainerEntry._ctr_.values())
                    parseContainer$1(identifiers, ctr, output, idI + 1, true);

        } else if (HAS_SUB_CONTAINERS) {
            for (const ctnr of ContainerEntry._ctr_.values()) {

                const string = ctnr.id;

                if ((offset = matchString(identifier, string)) >= 0) {

                    if (offset != string.length) continue;

                    parseContainer$1(identifiers, ctnr, output, idI + 1);

                    continue
                } else if (FOLLOWING_WILD_CARD)
                    parseContainer$1(identifiers, ctnr, output, idI, true);
            }
        }
    }

    const fsp = fs.promises;
    var log = "";

    const writeError = e => log += e;
    const warn = e => {};

    function Server(delimeter = "/") {

        let watcher = null,
            file_path = "",
            READ_BLOCK = false;

        var
            uid_store = new Map,
            container_store = new Map,
            container = new Container;

        function getContainer(uid) {

            const id = uid + "";

            if (!container_store.has(id))
                container_store.set(id, new Map);

            return container_store.get(id);
        }

        /* Writes data to the stored file */
        async function write() {

            if (file_path) {

                const out = { data: [] };

                for (const note_store of container_store.values())
                    for (const note of note_store.values())
                        out.data.push(note);

                READ_BLOCK = true;

                try {
                    await fsp.writeFile(file_path, JSON.stringify(out), "utf8");
                } catch (e) {
                    writeError(e);
                }
                READ_BLOCK = false;
            }

            return false;
        }

        /* Read data from file into store */
        async function read(fp = file_path) {

            if (
                /*Prevent reading file that has just been updated from this server.*/
                READ_BLOCK ||
                !fp
            )
                return;

            let data = "",
                STATUS = false;

            await fsp.readFile(fp, "utf8")
                .then((d) => (STATUS = true, data = d))
                .catch(writeError);
            // Create new storage systems.
            container_store = new Map;
            uid_store = new Map;
            container = new Container;

            try {
                if (STATUS) {

                    if (data) {

                        const json = JSON.parse(data);

                        if (json.data)
                            for (const note of json.data) {
                                if (note.uid) {
                                    getContainer(container.get(note.id).uid).set(note.uid, note);

                                    uid_store.set(note.uid, note.id);
                                }
                            }
                    }
                }

                if (data)
                    STATUS = updateDB(data);

            } catch (e) {
                writeError(e);
                STATUS = false;
            }

            return STATUS;
        }


        /* Updates store with data from json_String */
        function updateDB(json_data_string) {
            try {

                const json = JSON.parse(json_data_string);

                if (json.data)
                    for (const note of json.data)
                        if (note.uid) {
                            getContainer(container.get(note.id).uid).set(note.uid, note);
                            uid_store.set(note.uid, note.id);
                        }
                return true;
            } catch (e) {
                writeError(e);
            }
            return false
        }

        function noteFromUID(uid) {
            const id = uid_store.get(uid + "");

            if (!id) return null;

            return noteFromID(id, uid);
        }

        function noteFromID(id, uid) {
            return getContainer(container.get(id, delimeter).uid).get(uid) || null;
        }

        const queryRunner = QueryEngine({
                getNotesFromContainer: container_uid => [...getContainer(container_uid).values()],
                getNoteFromUID: note_uid => noteFromUID(note_uid)
            },
            false
        );

        return new(class Server {

            get type() {
                return "JSONDB"
            }

            /* 
                Connects the server to the given json file. If file does not exist than an attempt is made to create it.
                This will return false if the connection cannot be made
                in cases were the file cannot be accessed, or the data
                within the file cannot be parsed as JSON data. 
                return true otherwise
            */
            async connect(json_file_path) {

                let result = false;

                const temp = path.resolve(process.env.PWD, json_file_path);

                if (await read(temp)) {
                    file_path = temp;
                    result = true;
                } else {
                    try {
                        await fsp.writeFile(temp, "");
                        file_path = temp;
                        result = true;
                    } catch (e) { writeError(e); }
                }
                if (result) {
                    if (watcher)
                        watcher.close();

                    watcher = fs.watch(file_path, { encoding: "utf8" }, (event, data) => {
                        if (event == "change")
                            read();
                    });
                }
                return result;
            }

            /* Stores new note or updates existing note with new values */
            async storeNote(note) {
                var stored_note = null;

                const
                    uid = note.uid.string,
                    modified_time = Date.now();
                    
                stored_note = noteFromUID(uid);

                if (!stored_note)
                    stored_note = { id: note.id };

                const old_id = stored_note.id;

                stored_note.modified = modified_time;
                stored_note.uid = uid;
                stored_note.body = note.body;
                stored_note.id = note.id;
                stored_note.tags = note.tags;
                stored_note.query_data = `${note.id.split(".").pop()} ${note.tags.join(";")} ${note.body}`;

                uid_store.set(uid, note.id);
                getContainer(container.change(old_id, note.id, delimeter).uid).set(uid, stored_note);

                await write();
                return true;
            }

            removeNote(uid) {}

            async query(query_string) {
                await read(); //Hack - mack sure store is up to date;
                return await queryRunner(query_string, container)
            }

            // Return a list of all uid's that a modified time greater than [date] given
            async getUpdatedUIDs(date){
                const d = (new Date(date).valueOf());

                const out = [];

                for(const store of container_store.values()){

                    for(const note of store.values()){
                        if(note.modified > d)
                            out.push(note.uid.toString());
                    }
                }
                return out;
            }

            /* 
                Deletes all data in container_store. 
                Returns a function that returns a function that actually does the clearing.
                Example server.implode()()();
                This is deliberate to force dev to use this intentionally.
             */
            implode() {
                file_path && warn("Warning: Calling the return value can lead to bad things!");
                return () => (file_path && warn(`Calling this return value WILL delete ${file_path}`),
                    async () => {

                        container_store = new Map;
                        uid_store = new Map;
                        container = new Container;

                        try {
                            if (file_path)
                                await fsp.unlink(file_path).catch(e => {});
                        } catch (e) {

                        }

                        file_path = "";
                    })
            }
        })
    }

    function graze_json_server_constructor() {
        if (new.target);
        return Server();
    }

    const server = {
    	json : graze_json_server_constructor
    };

    exports.graze = Graze;
    exports.server = server;

    return exports;

}({}, require("worker_threads"), require("fs"), require("path")));
