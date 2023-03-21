/* Code generation from table definitions */

window.toCamelCase = function (snake) {
    var result = "";
    var nextUpper = false;
    for (var i = 0; i < snake.length; i++) {
        var c = snake.charAt(i);
        if (c === "_") {
            nextUpper = true;
        } else {
            if (nextUpper) {
                result += c.toUpperCase();
            } else {
                result += c.toLowerCase();
            }
            nextUpper = false;
        }
    }
    return result;
}

window.firstUpper = function (str) {
    return str.charAt(0).toUpperCase() + str.substr(1);
};

function findPrimaryKey(table) {
    if (table.fields.length > 0) {
        return table.fields[0].name;
    } else {
        return "";
    }
};

function javascriptTypeFromEnforced(t) {
    switch (t) {
        case "int":
        case "number":
            return "number"
        case "boolean":
            return "boolean";
        case "date":
            return "Date";
        default:
            return "string"
    }
}

window.generateBeanClass = function (table) {
    var code = [];

    var pk = findPrimaryKey(table);

    // Header
    code.push('// ' + table.name + ' - tsbean-orm class (auto generated)');
    code.push('');
    code.push('"use strict";');
    code.push('');

    // Import tsbean-orm
    code.push('import { DataModel, enforceType, GenericRow, DataSource, DataFinder, DataFilter, OrderBy, SelectOptions } from "tsbean-orm";');
    code.push('');

    // Consts
    code.push('const DATA_SOURCE = DataSource.DEFAULT;');
    code.push('const TABLE = "' + table.id + '";');
    code.push('const PRIMARY_KEY = "' + toCamelCase(pk) + '";');

    code.push('');

    // Interface
    code.push('interface ' + table.name + 'Row {');
    for (var i = 0; i < table.fields.length; i++) {
        var field = table.fields[i];

        code.push('    ' + toCamelCase(field.name) + '?: ' + javascriptTypeFromEnforced(field.type) + ';');
    }
    code.push('}');

    code.push('');

    // Class start
    code.push('export class ' + table.name + ' extends DataModel {');
    code.push('');

    // Finder
    code.push('    public static finder = new DataFinder<' + table.name + '>(DATA_SOURCE, TABLE, PRIMARY_KEY, (data: GenericRow) => { return new ' + table.name + '(data) });');
    code.push('');

    // Fields
    for (var i = 0; i < table.fields.length; i++) {
        var field = table.fields[i];

        code.push('    public ' + toCamelCase(field.name) + ": " + javascriptTypeFromEnforced(field.type) + ";");
    }

    code.push('');

    // Contructor
    code.push('    constructor(data: ' + table.name + 'Row) {');

    code.push('        // First, we call DataModel constructor ');
    code.push('        super(DATA_SOURCE, TABLE, PRIMARY_KEY);');
    code.push('');

    code.push('        // Second, we set the class properties');
    code.push('        // The recommended way is to set one by one to prevent prototype pollution');
    code.push('        // You can also enforce the types if you do not trust the data source');
    code.push('        // In that case you can use the enforceType utility function');
    code.push('');

    for (var i = 0; i < table.fields.length; i++) {
        var field = table.fields[i];

        code.push('        this.' + toCamelCase(field.name) + ' = enforceType(data.' + toCamelCase(field.name) + ', "' + field.type + '");');
    }

    code.push('');

    code.push('        // Finally, we must call init()');
    code.push('        this.init();');


    code.push('    }')



    // Class end
    code.push('}');
    code.push('');

    return code.join("\n");
};
