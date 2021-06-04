"use strict";
const isIE = !!document.documentMode;

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

document.getElementById("serverTime").innerHTML = "cannot reach server at this time";
var version = detectIE();

if (isIE !== true) {
  var source = new EventSource('/sse/server-time'); // handle messages

  source.onmessage = function (event) {
    console.log(event.data);
    document.getElementById("serverTime").innerHTML = event.data;
  };

  source.onclose = function (event) {
    console.log(event);
  };
} else document.getElementById("serverTime").innerHTML = "cannot reach server at this time";

var theme = localStorage.getItem('theme');

if (theme === "dark") {
  var slider = document.getElementById("bigTheme");
  console.log(slider);
  if (slider){
    slider.checked = true;
    var slider1 = document.getElementById("smallTheme");
    console.log(slider1);
    slider1.checked = true;
  }
}

function changeTheme() {
  return _changeTheme.apply(this, arguments);
}

function _changeTheme() {
  _changeTheme = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var localStorage, theme;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            localStorage = window.localStorage;
            theme = localStorage.getItem('theme');
            _context.next = 4;
            return sleep(1000);

          case 4:
            if (theme === "dark") {
              localStorage.setItem('theme', 'light');
            } else {
              localStorage.setItem('theme', 'dark');
            }

            window.location.reload();

          case 6:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _changeTheme.apply(this, arguments);
}

function sleep(ms) {
  return new Promise(function (resolve) {
    return setTimeout(resolve, ms);
  });
}

function signout() {
  console.log('User signed out.');
  window.location.href = "/destroySession";
}

function detectIE() {
  var ua = window.navigator.userAgent;
  var msie = ua.indexOf('MSIE ');

  if (msie > 0) {
    return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
  }

  var trident = ua.indexOf('Trident/');

  if (trident > 0) {
    var rv = ua.indexOf('rv:');
    return 11; //parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
  }

  var edge = ua.indexOf('Edge/');

  if (edge > 0) {
    return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
  }

  return false;
}