/* global QUnit */
/* Source: SAP OpenUI5 Shopping Cart Demo - Official OPA5 Reference */
/* https://github.com/SAP/openui5/blob/master/src/sap.m/test/sap/m/demokit/cart/webapp/test/integration/BuyProductJourney.js */

sap.ui.define([
	"sap/base/i18n/Localization",
	"sap/ui/test/opaQunit",
	"./pages/Home",
	"./pages/Category",
	"./pages/Product",
	"./pages/Cart",
	"./pages/Checkout",
	"./pages/OrderCompleted",
	"./pages/Welcome"
], (Localization, opaTest) => {
	"use strict";

	const sDefaultLanguage = Localization.getLanguage();

	QUnit.module("Buy Product Journey", {
		before() {
			Localization.setLanguage("en-US");
		},
		after() {
			Localization.setLanguage(sDefaultLanguage);
		}
	});

	opaTest("Should see the category list", (Given, When, Then) => {
		// Arrangements
		Given.iStartMyApp();

		// Assertions
		Then.onHome.iShouldSeeTheCategoryList().
			and.iShouldSeeSomeEntriesInTheCategoryList();
	});

	opaTest("Should see the product list", (Given, When, Then) => {
		// Actions
		When.onHome.iPressOnTheFlatScreensCategory();

		// Assertions
		Then.onTheCategory.iShouldBeTakenToTheFlatScreensCategory().
			and.iShouldSeeTheProductList().
			and.iShouldSeeSomeEntriesInTheProductList();
	});

	opaTest("Should see an avatar button on the product page", (Given, When, Then) => {
		// Actions
		When.onTheCategory.iPressOnTheFirstProduct();
		// Assertions
		Then.onTheProduct.iShouldSeeAnAvatarButton();
	});

	opaTest("Should add a product to the cart", (Given, When, Then) => {
		// Actions
		When.onTheProduct.iAddTheDisplayedProductToTheCart();
		When.onTheProduct.iToggleTheCart();

		// Assertions
		Then.onTheCart.iShouldSeeTheProductInMyCart()
			.and.iShouldSeeTheTotalPriceUpdated();

		// Cleanup
		Then.iTeardownMyApp();
	});

	opaTest("Should keep the cart when reloading", (Given, When, Then) => {
		// Arrangements
		Given.iStartMyApp({
			keepStorage: true
		});

		// Actions
		When.onHome.iPressOnTheFlatScreensCategory();
		When.onTheWelcomePage.iToggleTheCart();

		// Assertions
		Then.onTheCart.iShouldSeeTheProductInMyCart();

		// Cleanup
		Then.iTeardownMyApp();
	});

	opaTest("Should navigate to checkout", (Given, When, Then) => {
		// Actions
		When.onTheCart.iPressOnTheProceedButton();

		// Assertions
		Then.onCheckout.iShouldSeeTheWizardStepContentsStep();
	});

	opaTest("Should navigate to Payment Step", (Given, When, Then) => {
		// Actions
		When.onCheckout.iPressOnTheNextStepButton();

		// Assertions
		Then.onCheckout.iShouldSeeTheWizardStepPaymentTypeStep();
	});

	opaTest("Should see Step 4 Button", (Given, When, Then) => {
		// Actions
		When.onCheckout.iEnterCreditCardInformation("My name", "1234567891234567", "123", "01/2020");

		// Assertions
		Then.onCheckout.iShouldSeeTheStep4Button();
	});

	opaTest("Should submit order and navigate to order completed", (Given, When, Then) => {
		// Actions
		When.onCheckout.iPressOnTheSubmitButton().and.iPressOnTheYesButton();

		// Assertions
		Then.onOrderCompleted.iShouldSeeTheOrderCompletedPage();
	});

	opaTest("Should return to the shop welcome screen", (Given, When, Then) => {
		// Actions
		When.onOrderCompleted.iPressOnTheReturnToShopButton();

		// Assertions
		Then.onTheWelcomePage.iShouldSeeTheWelcomePage();

		// Cleanup
		Then.iTeardownMyApp();
	});
});
