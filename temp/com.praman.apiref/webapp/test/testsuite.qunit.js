sap.ui.define(function () {
	"use strict";

	return {
		name: "QUnit test suite for the UI5 Application: com.praman.apiref",
		defaults: {
			page: "ui5://test-resources/com/praman/apiref/Test.qunit.html?testsuite={suite}&test={name}",
			qunit: {
				version: 2
			},
			sinon: {
				version: 1
			},
			ui5: {
				language: "EN",
				theme: "sap_horizon"
			},
			coverage: {
				only: "com/praman/apiref/",
				never: "test-resources/com/praman/apiref/"
			},
			loader: {
				paths: {
					"com/praman/apiref": "../"
				}
			}
		},
		tests: {
			"unit/unitTests": {
				title: "Unit tests for com.praman.apiref"
			},
			"integration/opaTests": {
				title: "Integration tests for com.praman.apiref"
			}
		}
	};
});
