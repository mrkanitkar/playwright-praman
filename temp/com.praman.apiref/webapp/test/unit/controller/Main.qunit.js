/* global QUnit */
sap.ui.define(["com/praman/apiref/controller/Main.controller"], function (MainController) {
	"use strict";

	QUnit.module("Sample Main controller test");

	QUnit.test("The MainController class has a sayHello method", function (assert) {
		// as a very basic test example just check the presence of the "sayHello" method
		assert.strictEqual(typeof MainController.prototype.sayHello, "function");
	});
});
