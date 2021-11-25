/* SQL semantic parser */

var SEM_INIT = 0;
var SEM_SENTENCE = 1;

var SEM_INSERT_START = 2;
var SEM_INSERT_TABLE_KNOWN = 3;
var SEM_INSERT_VALUES = 4;

var SEM_CREATE_START = 5;
var SEM_CREATE_TABLE_KNOWN = 6;

var SQL_TYPES = {
    "BIT": "boolean",
    "BOOLEAN": "boolean",

    "TINYINT": "int",
    "SMALLINT": "int",
    "INT": "int",
    "BIGINT": "int",

    "DECIMAL": "number",
    "NUMERIC": "number",
    "FLOAT": "number",
    "REAL": "number",

    "DATE": "date",
    "DATETIME": "date",
    "TIMESTAMP": "date",

    "CHAR": "string",
    "VARCHAR": "string",
    "NCHAR": "string",
    "NVARCHAR": "string",

    "TEXT": "string",
    "NTEXT": "string",
    "SMALLTEXT": "string",
    "MEDIUMTEXT": "string",
    "BIGTEXT": "string"
}

window.SQLSemanticParser = function (onCreateTable, onInsert) {
    this.onCreateTable = onCreateTable || function () { };
    this.onInsert = onInsert || function () { };

    this.sentence = [];
    this.status = SEM_INIT;
    this.lastWord = null;
};

SQLSemanticParser.prototype.next = function (word, type) {
    switch (this.status) {
        case SEM_INIT:
            if (type === "word") {
                if (word.toUpperCase() === "INSERT") {
                    this.sentence = [{ word: word, type: type }];
                    this.status = SEM_INSERT_START;
                } else {
                    this.sentence = [{ word: word, type: type }];
                    this.status = SEM_SENTENCE;
                }
            } else if (type === "string") {
                throw new Error("Unexpected String: " + word)
            } else if (type === "token") {
                if (word !== ";") {
                    throw new Error("Unexpected token: " + word);
                }
            }
            break;
        case SEM_SENTENCE:
            if (type === "word" && word.toUpperCase() === "TABLE" && this.sentence[0] && this.sentence[0].type === "word" && this.sentence[0].word.toUpperCase() === "CREATE") {
                this.status = SEM_CREATE_START;
            } else if (type === "token" && word === ";") {
                this.sentence = [];
                this.status = SEM_INIT;
            }
            break;
        case SEM_INSERT_START:
            if (this.lastWord.type === "word" && this.lastWord.word.toUpperCase() === "INTO") {
                if (type === "token") {
                    throw new Error("Unexpected token: " + word);
                } else {
                    this.currentTable = word;
                    this.status = SEM_INSERT_TABLE_KNOWN;
                    this.currentFields = [];
                    this.expecting = "(";
                }
            }
            break;
        case SEM_INSERT_TABLE_KNOWN:
            switch (this.expecting) {
                case "(":
                    if (type === "token") {
                        if (word === "(") {
                            this.expecting = "field";
                        } else {
                            throw new Error("Unexpected token: " + word);
                        }
                    } else if (type === "string") {
                        throw new Error("Unexpected string: " + word);
                    } else if (type === "word") {
                        throw new Error("Unexpected token: " + word);
                    }
                    break;
                case "field":
                    if (type === "word" || type === "string") {
                        this.currentFields.push(word);
                        this.expecting = ",";
                    } else {
                        throw new Error("Unexpected token: " + word);
                    }
                    break;
                case ",":
                    if (type === "token") {
                        if (word === ")") {
                            this.expecting = "values";
                        } else if (word === ",") {
                            this.expecting = "field";
                        } else {
                            throw new Error("Unexpected token: " + word);
                        }
                    } else if (type === "string") {
                        throw new Error("Unexpected string: " + word);
                    } else if (type === "word") {
                        throw new Error("Unexpected token: " + word);
                    }
                    break;
                case "values":
                    if (type === "word" && word.toUpperCase() === "VALUES") {
                        this.status = SEM_INSERT_VALUES;
                        this.expecting = "(";
                    } else if (type === "string") {
                        throw new Error("Unexpected string: " + word);
                    } else if (type === "token") {
                        throw new Error("Unexpected token: " + word);
                    }
                    break;
            }
            break;
        case SEM_INSERT_VALUES:
            switch (this.expecting) {
                case "(":
                    if (type === "token") {
                        if (word === "(") {
                            this.expecting = "field";
                            this.currentData = [];
                        } else {
                            throw new Error("Unexpected token: " + word);
                        }
                    } else if (type === "string") {
                        throw new Error("Unexpected string: " + word);
                    } else if (type === "word") {
                        throw new Error("Unexpected token: " + word);
                    }
                    break;
                case "field":
                    if (type === "word" && word.toUpperCase() === "NULL") {
                        this.currentData.push(null);
                        this.expecting = ",";
                    } else if (type === "word" || type === "string") {
                        this.currentData.push(word);
                        this.expecting = ",";
                    } else {
                        throw new Error("Unexpected token: " + word);
                    }
                    break;
                case ",":
                    if (type === "token") {
                        if (word === ")") {
                            this.onInsert(this.currentTable, this.currentFields, this.currentData);
                            this.expecting = "next";
                        } else if (word === ",") {
                            this.expecting = "field";
                        } else {
                            throw new Error("Unexpected token: " + word);
                        }
                    } else if (type === "string") {
                        throw new Error("Unexpected string: " + word);
                    } else if (type === "word") {
                        throw new Error("Unexpected token: " + word);
                    }
                    break;
                case "next":
                    if (type === "token") {
                        if (word === ";") {
                            this.status = SEM_INIT;
                        } else if (word === ",") {
                            this.expecting = "(";
                        }
                    }
                    break;
            }
            break;
        case SEM_CREATE_START:
            if (type === "token") {
                throw new Error("Unexpected token: " + word);
            } else if (type !== "word" || ["IF", "NOT", "EXISTS"].indexOf(word.toUpperCase()) === -1) {
                this.currentTable = word;
                this.status = SEM_CREATE_TABLE_KNOWN;
                this.currentFieldsCreate = [];
                this.expecting = "(";
            }
            break;
        case SEM_CREATE_TABLE_KNOWN:
            switch (this.expecting) {
                case "(":
                    if (type === "token" && word === "(") {
                        this.expecting = "field-start";
                        this.currentField = {
                            name: "",
                            type: "",
                            defaultVal: null,
                        };
                    }
                    break;
                case "field-start":
                    if (type === "word" || type === "string") {
                        this.currentField.name = word;
                        this.expecting = "field-type";
                    } else {
                        throw new Error("Unexpected token: " + word);
                    }
                    break;
                case "field-type":
                    if (type === "word" && SQL_TYPES[word.toUpperCase()]) {
                        this.currentField.type = SQL_TYPES[word.toUpperCase()];
                        this.expecting = "field-detail";
                    } else {
                        this.expecting = "field-ignore";
                    }
                    break;
                case "field-detail":
                    if (type === "token") {
                        if (word === "(") {
                            this.expecting = "field-sub";
                        } else if (word === ",") {
                            this.currentFieldsCreate.push(this.currentField);
                            this.expecting = "field-start";
                            this.currentField = {
                                name: "",
                                type: "",
                                defaultVal: null,
                            };
                        } else if (word === ")") {
                            this.currentFieldsCreate.push(this.currentField);
                            this.expecting = "end";
                        }
                    } else if (this.lastWord && this.lastWord.type === "word" && this.lastWord.word.toUpperCase() === "DEFAULT") {
                        if (type === "word" && word.toUpperCase() === "NULL") {
                            this.currentField.defaultVal = null;
                        } else {
                            this.currentField.defaultVal = word;
                        }
                    }
                    break;
                case "field-sub":
                    if (type === "token" && word === ")") {
                        this.expecting = "field-detail";
                    }
                    break;
                case "field-sub-ignore":
                    if (type === "token" && word === ")") {
                        this.expecting = "field-ignore";
                    }
                    break;
                case "field-ignore":
                    if (type === "token") {
                        if (word === "(") {
                            this.expecting = "field-sub-ignore";
                        } else if (word === ",") {

                            this.expecting = "field-start";
                            this.currentField = {
                                name: "",
                                type: "",
                                defaultVal: null,
                            };
                        } else if (word === ")") {
                            this.expecting = "end";
                        }
                    }
                    break;
                case "end":
                    if (type === "token" && word === ";") {
                        this.onCreateTable(this.currentTable, this.currentFieldsCreate);
                        this.status = SEM_INIT;
                    }
                    break;
            }
            break;
    }
    this.lastWord = {
        type: type,
        word: word,
    };
};
