/* Source: SAP OpenUI5 Shopping Cart Demo - Official OPA5 Reference */
sap.ui.define([
	"sap/ui/test/Opa5",
	"./arrangements/component/Startup",
	"./WelcomeJourney",
	"./NavigationJourney",
	"./DeleteProductJourney",
	"./BuyProductJourney",
	"./FilterJourney",
	"./ComparisonJourney"
], (Opa5, Startup) => {
	"use strict";

	Opa5.extendConfig({
		arrangements: new Startup(),
		viewNamespace: "sap.ui.demo.cart.view.",
		autoWait: true
	});
});
