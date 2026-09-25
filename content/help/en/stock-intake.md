# Stock Intake

The Stock Intake document is used to receive products from the existing [catalog](/help/items) into the [warehouse](/help/warehouses) — increasing the stock level in the corresponding cell.

## Creating a document

When creating a document, a point, warehouse and cell are selected — these values apply to all rows by default. The cell can be changed individually for any row if needed.

## Adding a row

Each row selects a product from the existing catalog — new products are not created through this document. A quantity is entered; the cost field is optional — if left empty, the product's standard price is used.

## Uploading via Excel

Instead of entering a large number of products manually, a ready-made template can be downloaded, filled in, and uploaded via "Upload from Excel". Products are matched first by code, then by name if no code matches. Rows not found in the catalog are reported separately; the remaining rows are added without issue.

## Deleting a document

When a document is deleted, the quantities it contains are automatically subtracted from the corresponding warehouse stock.
