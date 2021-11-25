/* SQL syntax parser */

var SYNTAX_STATUS_INIT = 0;
var SYNTAX_STATUS_STR = 1;
var SYNTAX_STATUS_COMMENT_SINGLE_LINE = 2;
var SYNTAX_STATUS_COMMENT_MULTI_LINE = 2;

window.SQLSyntaxParser = function (onNextWord) {
    this.onNextWord = onNextWord || function () { };

    this.status = SYNTAX_STATUS_INIT;

    this.pendingWord = "";
    this.pendingString = "";
    this.quote = null;
    this.lastChar = null;
    this.escapeStatus = "";
};

SQLSyntaxParser.prototype.next = function (c) {
    switch (this.status) {
        case SYNTAX_STATUS_INIT:
            {

                if (["`", "'", "\""].indexOf(c) >= 0) {
                    this.status = SYNTAX_STATUS_STR;
                    this.pendingString = "";
                    this.quote = c;
                } else if ([",", ";", "=", "(", ")"].indexOf(c) >= 0) {
                    if (this.pendingWord) {
                        this.onNextWord(this.pendingWord, "word");
                        this.pendingWord = "";
                        this.escapeStatus = "";
                    }
                    this.onNextWord(c, "token");
                } else if ([" ", "\t", "\n", "\r"].indexOf(c) >= 0) {
                    // Space
                    if (this.pendingWord) {
                        this.onNextWord(this.pendingWord, "word");
                        this.pendingWord = "";
                    }
                } else if (c === "-" && this.lastChar === "-") {
                    this.status = SYNTAX_STATUS_COMMENT_SINGLE_LINE;
                } else if (c === "*" && this.lastChar === "/") {
                    this.status = SYNTAX_STATUS_COMMENT_MULTI_LINE;
                } else {
                    this.pendingWord += c;
                }
            }
            break;
        case SYNTAX_STATUS_COMMENT_SINGLE_LINE:
            if (c === "\n") {
                this.status = SYNTAX_STATUS_INIT;
                this.pendingWord = "";
            }
            break;
        case SYNTAX_STATUS_COMMENT_MULTI_LINE:
            if (c === "/" && this.lastChar === "*") {
                this.status = SYNTAX_STATUS_INIT;
                this.pendingWord = "";
            }
            break;
        case SYNTAX_STATUS_STR:
            if (c === "\\" && !this.escapeStatus) {
                this.escapeStatus = c;
            } else if (this.escapeStatus) {
                if (this.escapeStatus.length === 1) {
                    if (c === "b") {
                        this.escapeStatus = "";
                        this.pendingString += "\b";
                    } else if (c === "f") {
                        this.escapeStatus = "";
                        this.pendingString += "\f";
                    } else if (c === "n") {
                        this.escapeStatus = "";
                        this.pendingString += "\n";
                    } else if (c === "r") {
                        this.escapeStatus = "";
                        this.pendingString += "\r";
                    } else if (c === "t") {
                        this.escapeStatus = "";
                        this.pendingString += "\t";
                    } else if (c === "u") {
                        this.escapeStatus += "u";
                    } else {
                        this.escapeStatus = "";
                        this.pendingString += c;
                    }
                } else {
                    this.escapeStatus += c;
                    if (this.escapeStatus.length >= 6) {
                        try {
                            this.pendingString += (JSON.parse('"' + this.escapeStatus + '"'));
                        } catch (ex) {
                            console.error(ex);
                        }
                        this.escapeStatus = "";
                    }
                }
            } else if (c === this.quote) {
                this.onNextWord(this.pendingString, "string");
                this.pendingWord = "";
                this.status = SYNTAX_STATUS_INIT;
            } else {
                this.pendingString += c;
            }
            break;
        default:
            this.status = SYNTAX_STATUS_INIT;
    }
    this.lastChar = c;
}
