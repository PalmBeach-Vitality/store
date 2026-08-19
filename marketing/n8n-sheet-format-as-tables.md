# Sheet tables + dropdown menus

15 looks the way it does because it is a **Google Table**: table menu on the left, filter arrows on every header.

n8n cannot call the Tables API with your Google Sheets login (that credential is blocked on HTTP Request nodes). Run this once from Sheets instead.

## Convert every marketing workbook (one run)

1. Open [15-caption-science-27](https://docs.google.com/spreadsheets/d/1yRVkX7fVzU5wopvHH9LVsenHTszHDDhVR_smOfgOrNk/edit)
2. **Extensions → Apps Script**
3. Delete the stub code and paste `marketing/scripts/sheets_convert_to_tables.gs`
4. Left sidebar **Services → + → Google Sheets API → Add**
5. Run **`convertMarketingSheetsToTables`** → Allow

That walks 15, 13 (all tabs), 14, 3, 9, 4, 12, and 10. Cell data stays put.

## Convert only the file you have open

Reload the sheet. Menu **PB Vitality → Convert this file to a Table**.

## What you get

- Table menu (name chip, views)
- Header dropdowns (filter / sort on every column)
- Chip dropdowns on `status`, `compound_name`, caption `tag2–tag5`, `verify_status`

## One file, by hand

Click the data → **Format → Convert to table** → use row 1 as headers.
