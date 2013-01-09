"use strict"; // run code in ES5 strict mode

var value = require("value");

// Reusing the config object because it's faster
// @see http://jsperf.com/new-vs-reuse-obj
var context = {},
    caster;

function treat(subject) {
    context.subject = subject;
    context.casting = true;
    context.targets = null;

    return treat;
}

function called(varName) {
    context.varName = varName;
}
treat.called = called;

function strictlyAs() {
    context.casting = false;
    as.apply(null, arguments);
}
treat.strictly = {
    as: strictlyAs
};

function as() {
    var targets = arguments,
        l = targets.length,
        subject = context.subject,
        subjectType,
        castedSubject,
        i;

    context.targets = targets;
    for (i = 0; i < l; i++) {
        if (value(subject).typeOf(targets[i])) {
            return subject;
        }
    }

    if (context.casting) {
        subjectType = getTypeString(subject);
        for (i = 0; i < l; i++) {
            castedSubject = doCast(subject, subjectType, getTypeString(targets[i]));
            if (castedSubject !== null) {
                return castedSubject;
            }
        }
    }
    throwTypeError(subject, targets);
}
treat.as = as;

function throwTypeError(subject, targets) {
    var i,
        errMsg,
        targetsString = "";

    for (i = 0; i < targets.length; i++) {
        if (i !== 0) {
            targetsString += ", ";
        }
        targetsString += Object.prototype.toString.call(targets[i]).slice(8, -1);
    }
    if (context.varName) {
        errMsg = "Unexpected type of " + context.varName + ": Expected " + targetsString + " and instead saw " + subject;
    } else {
        errMsg = "Unexpected type: Expected " + targetsString + " and instead saw " + subject;
    }
    throw new TypeError(errMsg);
}

function getTypeString(value) {
    return Object.prototype.toString.call(value).slice(8, -1);
}

function doCast(value, actualType, expectedType) {
    if (caster[actualType] !== undefined && caster[actualType][expectedType] !== undefined) {
        return caster[actualType][expectedType](value);
    }
    return null;
}

caster = {
    String : {
        Date : function (value) {
            var resDate = new Date(value);

            if (resDate.toString() !== "Invalid Date") {
                return resDate;
            }

            return null;
        },
        Number : function (value) {
            var num = parseFloat(value);

            if (isNaN(num)){
                return null;
            }
            return num;
        },
        Boolean: function (value) {
            if (value === "true") {
                return true;
            } else if (value === "false") {
                return false;
            }
            return null;
        },
        Array: function (value) {
            if (/^\s*\[.*\]\s*$/.test(value)) {
                try {
                    return JSON.parse(value);
                } catch (err) { // Catch SyntaxError
                    return null;
                }
            }

            return null;
        },
        Object: function () {
            if (/^\s*\{.*\}\s*$/.test(value)) {
                try {
                    return JSON.parse(value);
                } catch (err) { // Catch SyntaxError
                    return null;
                }
            }

            return null;
        }
    },
    Number : {
        Date : function (value) {
            var resDate;

            // Test if value is a float
            if (value % 1 !== 0) {
                return null;
            }

            resDate = new Date();
            resDate.setTime(value);

            return resDate;
        },
        String : function (value) {
            return String(value);
        }
    },
    Date : {
        String : function (value) {
            return value.toUTCString();
        },
        Number : function (value) {
            return value.getTime();
        }
    }
};

module.exports = treat;