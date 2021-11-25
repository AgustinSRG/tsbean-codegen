/* SQL file parser */

window.SQLFileParser = function (onCreateTable, onInsert, onError) {
    this.sem = new SQLSemanticParser(onCreateTable, onInsert);
    this.syntax = new SQLSyntaxParser(this.sem.next.bind(this.sem));

    this.onError = onError;

    this.line = 1;
    this.col = 1;
};

SQLFileParser.prototype.update = function (str) {
    for (var i = 0; i < str.length; i++) {
        var c = str.charAt(i);

        try {
            this.syntax.next(c);
        } catch (ex) {
            this.onError(new Error("Syntax error: " + ex.message + " (" + this.line + ":" + this.col + ")"));
            return;
        }

        this.col++;
        if (c === "\n") {
            this.line++;
            this.col = 1;
        }
    }
};

SQLFileParser.prototype.finish = function () {
    // Finished
};
