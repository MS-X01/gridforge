# Formula columns

Open **Columns → Formula column**. A formula is evaluated once per row and the result is written as values (it is not a live spreadsheet cell).

```
=[Price] * [Qty] * 1.09
=IF([Qty] = 0, "out", "ok")
=UPPER(LEFT([Name], 1)) & LOWER(MID([Name], 2, 99))
=EXTRACT([Email], "@(.+)$")          // capture group 1 → domain
=DAYS([Start], TODAY())
```

References: `[Column Name]` or `{Column Name}` (a bare word also works if it equals a column name, case-insensitive).
Operators: `+ - * / % ^`, text join `&`, comparison `= <> != < > <= >=`, logic `&& || !`.
Numbers understand Persian digits and thousands separators (`۱٬۲۳۴`).

| Group | Functions |
|---|---|
| Logic | `IF AND OR NOT ISEMPTY` |
| Math | `ROUND FLOOR CEIL ABS SQRT POW MOD MIN MAX SUM AVG NUMBER` |
| Text | `LEN UPPER LOWER TRIM PROPER LEFT RIGHT MID CONCAT REPLACE CONTAINS REGEX EXTRACT DIGITS` |
| Date | `TODAY YEAR MONTH DAY DAYS` |
| Misc | `ROW()` |

Errors per cell: `#DIV/0!`, `#VALUE!`, `#NUM!`, `#ERR`. A syntax error or unknown column is reported in the panel before anything is changed.
