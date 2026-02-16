/**
 * Documentation Best Practices Example.
 *
 * This file demonstrates proper TypeScript documentation following:
 * - Microsoft TSDoc Standard
 * - Google TypeScript Style Guide
 * - Node.js Core Documentation Practices
 * - Playwright Documentation Patterns
 * - Claude/Anthropic AI-Friendly Documentation.
 *
 * @packageDocumentation
 * @category Examples
 * @internal
 */

/**
 * Creates a purchase order in the SAP MM (Materials Management) module.
 *
 * This high-level intent method abstracts the multi-step UI interaction required
 * to create a purchase order through the SAP Fiori interface. It handles navigation,
 * field population, validation, and document creation.
 *
 * @remarks
 * This method uses the UI5 control API to interact with SAP Fiori elements.
 * For headless operation, consider using the OData API directly via the `odata`
 * fixture instead.
 *
 * @intent
 * Enables procurement test scenarios:
 * - End-to-end purchase order creation workflows
 * - Testing approval and release processes
 * - Verifying vendor master data integration
 * - Testing goods receipt against purchase orders
 * - Validating pricing and tax calculations
 *
 * @guarantee
 * - Navigates to the "Create Purchase Order" app in SAP Fiori
 * - Fills all mandatory fields with provided data
 * - Performs client-side validation before saving
 * - Saves the purchase order to the SAP backend
 * - Returns a valid 10-digit SAP PO number
 * - PO status will be "Draft" or "Approved" depending on workflow configuration
 *
 * @param data - Purchase order creation data containing vendor code,
 * material number, quantity, and optional plant/delivery date fields.
 *
 * @returns Promise resolving to the created PO number (10-digit string, e.g., "4500012345").
 *
 * @throws \{AuthenticationError\} When user is not logged into SAP Fiori Launchpad.
 * @throws \{MasterDataError\} When vendor or material master record doesn't exist.
 * @throws \{AuthorizationError\} When user lacks MM_PO_CREATE authorization.
 * @throws \{ValidationError\} When quantity exceeds material purchase order limits.
 * @throws \{TimeoutError\} When UI5 controls or OData services don't respond within configured timeout.
 *
 * @failureMode Not authorized - User lacks MM_PO_CREATE authorization in SAP
 * @failureMode Vendor blocked - Vendor is blocked for purchasing in vendor master
 * @failureMode Invalid quantity - Quantity exceeds maximum order quantity from material master
 * @failureMode Network error - OData service unavailable or network connectivity issues
 * @failureMode UI5 not loaded - SAP Fiori app failed to initialize properly
 *
 * @prerequisite User must be logged into SAP Fiori Launchpad
 * @prerequisite User must have MM_PO_CREATE authorization object
 * @prerequisite Vendor master data must exist and be active (not blocked)
 * @prerequisite Material master data must exist with purchasing data view
 * @prerequisite User must have organizational assignment to at least one plant
 *
 * @postcondition Purchase order document created in SAP EKKO/EKPO tables
 * @postcondition PO number assigned from SAP number range
 * @postcondition PO visible in "Manage Purchase Orders" Fiori app
 * @postcondition PO workflow initiated if approval required
 * @postcondition Purchase requisition (if source) updated with PO reference
 *
 * @alternative For test data setup without UI validation, use {@link createPurchaseOrderViaOData}
 * @alternative For simpler scenarios without error handling, use {@link quickCreatePO}
 * @alternative For batch creation of multiple POs, use {@link bulkCreatePurchaseOrders}
 *
 * @sapModule MM (Materials Management)
 * @businessContext
 * Purchase orders are legally binding procurement documents in SAP that authorize
 * the purchase of materials or services from external vendors. They trigger
 * downstream processes like goods receipt, invoice verification, and payment.
 *
 * @ui5Version \>= 1.84.0 (requires sap.ui.test.RecordReplay API)
 * @fioriElement ObjectPage
 * @browserContext Requires active browser session with SAP Fiori Launchpad loaded
 *
 * @aiContext
 * This is a high-level business process method, not a low-level UI interaction.
 * It encapsulates multiple UI steps (navigation, input, validation, save) into
 * a single intent-based API call. The method name follows the pattern:
 * `create<BusinessObject>` which is standard across all SAP modules.
 *
 * @aiHint Always provide vendor and material — these are mandatory in SAP MM
 * @aiHint Use actual SAP master data codes, not placeholders like "TEST" or "DUMMY"
 * @aiHint Await the promise to get the PO number for subsequent verification steps
 * @aiHint Handle errors gracefully — master data issues are common in test environments
 *
 * @aiRequired vendor - Must exist in SAP vendor master (table LFA1)
 * @aiRequired material - Must exist in SAP material master (table MARA)
 * @aiRequired quantity - Must be positive integer, respecting material unit of measure
 *
 * @aiOptional plant - Defaults to user parameter EVO (evaluation group organization)
 * @aiOptional deliveryDate - Defaults to current date + vendor delivery lead time
 *
 * @category MM
 * @public
 *
 * @example Basic usage with minimal required fields
 * ```typescript
 * import { test, expect } from 'playwright-praman';
 *
 * test('create purchase order for standard material', async ({ procurementAPI }) => {
 *   const poNumber = await procurementAPI.createPurchaseOrder({
 *     vendor: 'V001',
 *     material: 'MAT-12345',
 *     quantity: 100
 *   });
 *
 *   // Verify PO number format (10 digits)
 *   expect(poNumber).toMatch(/^\d{10}$/);
 *
 *   // Verify PO exists in system
 *   expect(poNumber).toBeTruthy();
 * });
 * ```
 *
 * @example With all optional fields specified
 * ```typescript
 * test('create PO with delivery date and plant', async ({ procurementAPI }) => {
 *   const poNumber = await procurementAPI.createPurchaseOrder({
 *     vendor: 'V001',
 *     material: 'MAT-12345',
 *     quantity: 100,
 *     plant: 'P001',
 *     deliveryDate: '2026-03-15'
 *   });
 *
 *   console.log(`Created PO: ${poNumber}`);
 * });
 * ```
 *
 * @example Error handling for master data issues
 * ```typescript
 * test('handle missing vendor gracefully', async ({ procurementAPI }) => {
 *   try {
 *     await procurementAPI.createPurchaseOrder({
 *       vendor: 'V999', // Non-existent vendor
 *       material: 'MAT-12345',
 *       quantity: 100
 *     });
 *     // Should not reach here
 *     throw new Error('Expected MasterDataError');
 *   } catch (error) {
 *     expect(error).toBeInstanceOf(MasterDataError);
 *     expect(error.message).toContain('Vendor V999 not found');
 *   }
 * });
 * ```
 *
 * @example Using returned PO number for verification
 * ```typescript
 * test('verify PO details after creation', async ({ procurementAPI, odata }) => {
 *   // Create PO
 *   const poNumber = await procurementAPI.createPurchaseOrder({
 *     vendor: 'V001',
 *     material: 'MAT-12345',
 *     quantity: 100
 *   });
 *
 *   // Verify via OData
 *   const poHeader = await odata.read('PurchaseOrder', { PONumber: poNumber });
 *   expect(poHeader.Vendor).toBe('V001');
 *   expect(poHeader.Items).toHaveLength(1);
 *   expect(poHeader.Items[0].Material).toBe('MAT-12345');
 *   expect(poHeader.Items[0].Quantity).toBe(100);
 * });
 * ```
 *
 * @see {@link https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/8308e6d301d54584a33cd04a9861bc52/4ec41c6e7b4c4e5fb2a0fb48c6fd6e1c.html | SAP Help: Purchase Order Processing}
 * @see {@link createPurchaseOrderViaOData} for OData-based alternative
 * @see {@link PurchaseOrderData} for parameter interface definition
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Example stub function
export async function createPurchaseOrder(data: PurchaseOrderData): Promise<string> {
  // Implementation would go here
  await Promise.resolve();
  return '4500012345';
}

/**
 * Purchase order creation data interface.
 *
 * @remarks
 * This interface defines the minimum required and optional fields for creating
 * a purchase order in SAP MM module. All fields map directly to SAP EKKO/EKPO
 * table fields.
 *
 * @public
 * @category MM
 */
export interface PurchaseOrderData {
  /**
   * SAP vendor code from vendor master (table LFA1).
   *
   * @remarks
   * Must be an active vendor not blocked for purchasing.
   *
   * @example "V001"
   */
  vendor: string;

  /**
   * SAP material number from material master (table MARA).
   *
   * @remarks
   * Material must have purchasing data view maintained.
   *
   * @example "MAT-12345"
   */
  material: string;

  /**
   * Order quantity in base unit of measure.
   *
   * @remarks
   * Must be positive integer. System will validate against:
   * - Minimum order quantity (MARC-MINBE)
   * - Maximum order quantity (MARC-MAXBE)
   * - Rounding quantity (MARC-BSTRF)
   *
   * @example 100
   */
  quantity: number;

  /**
   * Plant code (optional, defaults to user's default plant).
   *
   * @remarks
   * User must have organizational assignment to the specified plant.
   *
   * @example "P001"
   */
  plant?: string;

  /**
   * Requested delivery date (optional, ISO 8601 format).
   *
   * @remarks
   * Defaults to current date plus vendor delivery lead time (LFM1-PLIFZ).
   *
   * @example "2026-03-15"
   */
  deliveryDate?: string;
}
