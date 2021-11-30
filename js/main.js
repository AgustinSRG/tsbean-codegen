// Main vue component

window.App = new Vue({
    el: "#app",

    data: {
        inputType: "mysql",
        inputTypes: [
            {
                id: "mysql",
                name: "MySQL / MariaDB",
                placeholder: "-- Tables for testing the driver\n\nDROP TABLE IF EXISTS `person`;\nDROP TABLE IF EXISTS `dummy`;\n\nCREATE TABLE `person` (\n    `id` BIGINT NOT NULL PRIMARY KEY,\n    `name` VARCHAR(255) NOT NULL COLLATE utf8_bin,\n    `surname` VARCHAR(255) NOT NULL COLLATE utf8_bin,\n    `age` INT,\n    `has_driver_license` TINYINT(1),\n    `preferences` TEXT,\n    `birth_date` DATE\n);\n\nCREATE TABLE `dummy` (\n    `id` VARCHAR(255) NOT NULL PRIMARY KEY,\n    `value1` BIGINT,\n    `value2` DOUBLE,\n    `value3` VARCHAR(255),\n    `data` TEXT\n);\n\n",
            },
            {
                id: "postgre",
                name: "PostgreSQL",
                placeholder: "-- Tables for testing the driver\n\nDROP TABLE IF EXISTS \"person\";\nDROP TABLE IF EXISTS \"dummy\";\n\nCREATE TABLE \"person\" (\n    \"id\" BIGINT NOT NULL PRIMARY KEY,\n    \"name\" VARCHAR(255) NOT NULL,\n    \"surname\" VARCHAR(255) NOT NULL,\n    \"age\" INT,\n    \"has_driver_license\" BOOLEAN,\n    \"preferences\" TEXT,\n    \"birth_date\" TIMESTAMPTZ\n);\n\nCREATE TABLE \"dummy\" (\n    \"id\" SERIAL PRIMARY KEY,\n    \"value1\" BIGINT,\n    \"value2\" REAL,\n    \"value3\" VARCHAR(255),\n    \"data\" TEXT\n);\n\n",
            },
        ],

        inputText: "",

        outputClass: "",

        outputClasses: [],

        outputText: "",
    },

    methods: {
        getPlaceholder: function (t) {
            for (var i = 0; i < this.inputTypes.length; i++) {
                if (this.inputTypes[i].id === t) {
                    return this.inputTypes[i].placeholder;
                }
            }
            return "";
        },

        classExists: function (id) {
            for (var i = 0; i < this.outputClasses.length; i++) {
                if (this.outputClasses[i].id === id) {
                    return true;
                }
            }
            return false;
        },

        onUpdateInputCode: function () {
            if (!this.inputText) {
                this.outputClasses = [];
                this.outputClass = "";
                this.outputText = "";
            }

            var classes = [];
            var error = null;

            var parser = new SQLFileParser(function (name, fields) {
                classes.push({ name: name, fields: fields });
            }, function () { }, function (err) {
                error = err;
            });

            parser.update(this.inputText);
            parser.finish();

            if (error) {
                this.outputText = error.message;
                this.outputClasses = [];
                this.outputClass = "";
            } else {
                this.outputText = "";
                this.outputClasses = classes.map(function (c) {
                    return {
                        id: c.name,
                        name: firstUpper(toCamelCase(c.name)),
                        fields: c.fields,
                    };
                });
                if (!this.classExists(this.outputClass)) {
                    if (this.outputClasses.length > 0) {
                        this.outputClass = this.outputClasses[0].id;
                    } else {
                        this.outputClass = "";
                    }
                }
                this.onUpdateOutputClass();
            }
        },

        onUpdateOutputClass: function () {
            if (this.outputClasses.length === 0) {
                return;
            }
            for (var i = 0; i < this.outputClasses.length; i++) {
                if (this.outputClasses[i].id === this.outputClass) {
                    this.outputText = generateBeanClass(this.outputClasses[i]);
                    return;
                }
            }
            this.outputText = "";
        },
    },
});
