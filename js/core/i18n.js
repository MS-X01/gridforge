/* GridForge — i18n.js : English + Persian (RTL) strings. Add a language by adding a dictionary below. */
(function (root) {
  'use strict';
  const GF = (root.GF = root.GF || {});
  const I = (GF.i18n = { lang: 'en', dict: {} });

  I.dict.en = {
    'act.undo': 'Undo', 'act.redo': 'Redo', 'act.import': 'Import', 'act.export': 'Export', 'act.palette': 'Command palette', 'act.theme': 'Toggle light / dark',
    'act.lang': 'Switch language', 'act.settings': 'Settings', 'act.help': 'Keyboard shortcuts', 'act.close': 'Close', 'act.panel': 'Toggle tool panel',
    'proj.placeholder': 'Untitled workbook', 'drop.here': 'Drop a file to open it',
    'p.columns': 'Columns', 'p.clean': 'Clean', 'p.fill': 'Fill', 'p.validate': 'Validate', 'p.analyze': 'Analyze', 'p.combine': 'Combine',
    'search.ph': 'Search…  ( / )', 'search.allcols': 'All columns', 'tb.filter': 'Filter', 'tb.columns': 'Columns', 'tb.row': 'Row', 'tb.rows': 'Rows ▾',
    'sb.local': '100% local', 'sb.rows': 'Rows', 'sb.cols': 'Cols', 'sb.cells': 'cells', 'sb.saved': 'Saved locally', 'sb.saving': 'Saving…', 'sb.saveerr': 'Autosave unavailable',
    'dlg.ok': 'OK', 'dlg.cancel': 'Cancel', 'dlg.confirm': 'Are you sure?',
    'need.data': 'Add or import some data first.',
    'grid.selectall': 'Select all', 'grid.nomatch': 'No rows match your filters', 'grid.norows': 'No rows yet — press Ctrl+Enter to add one',
    'grid.clipped': 'Pasted — extra columns were clipped', 'grid.pasted': 'Pasted {n} cells', 'grid.needcols': 'Add a column first',
    'grid.delrows.q': 'Delete {n} rows?', 'grid.deleted': 'Deleted {n} rows',
    'toast.copied': 'Copied', 'toast.copyfail': 'Copy failed', 'toast.nothing': 'Nothing to undo', 'toast.pastehint': 'Use Ctrl+V to paste', 'toast.restored': 'Restored your last session ({d})',
    'm.sortasc': 'Sort A → Z', 'm.sortdesc': 'Sort Z → A', 'm.sortclear': 'Clear sort', 'm.filter': 'Filter…', 'm.onlyempty': 'Only empty cells', 'm.onlyfilled': 'Only filled cells',
    'm.showdups': 'Show duplicates only', 'm.showinvalid': 'Show invalid only', 'm.hldups': 'Highlight duplicates', 'm.hidedups': 'Stop highlighting duplicates', 'm.type': 'Column type',
    'm.rename': 'Rename…', 'm.fit': 'Auto-fit width', 'm.selcol': 'Select column', 'm.hide': 'Hide column', 'm.insl': 'Insert column before', 'm.insr': 'Insert column after',
    'm.dupcol': 'Duplicate column', 'm.delcol': 'Delete column', 'm.copy': 'Copy', 'm.paste': 'Paste', 'm.clear': 'Clear cells', 'm.fval': 'Filter: equals “{v}”', 'm.fnval': 'Filter: not this value',
    'm.insabove': 'Insert row above', 'm.insbelow': 'Insert row below', 'm.duprows': 'Duplicate {n} row(s)', 'm.delrows': 'Delete {n} row(s)',
    'f.column': 'Column', 'f.cond': 'Condition', 'f.value': 'Value', 'f.add': 'Add filter', 'f.clear': 'Clear all', 'f.showing': 'Showing {a} of {b} rows',
    'op.contains': 'contains', 'op.notcontains': 'doesn’t contain', 'op.equals': 'equals', 'op.notequals': 'not equals', 'op.starts': 'starts with', 'op.ends': 'ends with',
    'op.gt': '>', 'op.gte': '≥', 'op.lt': '<', 'op.lte': '≤', 'op.empty': 'is empty', 'op.notempty': 'is not empty', 'op.regex': 'matches regex', 'op.dupes': 'is duplicated', 'op.unique': 'is unique', 'op.invalid': 'is invalid',
    'col.new': 'Column', 'col.schema': 'Schema', 'col.none': 'No columns yet.', 'col.add': 'Add column', 'col.showall': 'Show all', 'col.hideall': 'Hide all', 'col.type': 'Type', 'col.default': 'Default value',
    'col.options': 'Options (comma-separated)', 'col.required': 'Required', 'col.unique': 'Must be unique', 'col.conv': 'Normalise values', 'col.conv.tip': 'Rewrite values into the canonical form of the column type', 'col.conv.done': '{n} values normalised',
    'fx.title': 'Formula column', 'fx.hint': 'Row-level formulas. Use [Column Name] to reference a column. Safe parser — no code is executed.', 'fx.expr': 'Expression', 'fx.name': 'New column name', 'fx.target': 'Write result to',
    'fx.newcol': '＋ New column', 'fx.apply': 'Apply formula', 'fx.done': 'Formula applied',
    'tpl.title': 'Templates', 'tpl.contacts': 'Contacts', 'tpl.products': 'Products', 'tpl.tasks': 'Tasks', 'tpl.inventory': 'Inventory', 'tpl.finance': 'Finance', 'tpl.employees': 'Employees',
    'tpl.new.q': 'Add this template as a new sheet?',
    'c.target': 'Where to apply', 'c.scope': 'Rows', 'c.sc.all': 'All rows', 'c.sc.view': 'Rows in current view', 'c.sc.sel': 'Selected rows only', 'c.cols': 'Columns', 'c.cols.hint': 'none selected = all',
    'dup.title': 'Duplicates', 'dup.hint': 'Pick the key columns (none = whole row). Rows with the same key are duplicates.', 'dup.keys': 'Key columns', 'dup.ic': 'Ignore case', 'dup.trim': 'Ignore spaces',
    'dup.keep': 'When removing, keep', 'dup.first': 'First occurrence', 'dup.last': 'Last occurrence', 'dup.none': 'None (remove all copies)', 'dup.find': 'Count', 'dup.hl': 'Highlight', 'dup.remove': 'Remove duplicates', 'dup.tosheet': 'Move to new sheet',
    'dup.found': '{g} duplicate groups · {n} extra rows', 'dup.none.found': 'No duplicates found 🎉', 'dup.q': 'Remove {n} duplicate rows?', 'dup.removed': 'Removed {n} duplicate rows', 'dup.moved': 'Moved {n} duplicate rows to a new sheet',
    'dup.hl.on': 'Duplicates highlighted', 'dup.hl.off': 'Highlight removed', 'dup.hl.chip': 'Duplicates in: {c}',
    'cl.title': 'Text cleanup', 'cl.done': '{n} cells changed', 'cl.trim': 'Trim', 'cl.collapse': 'Trim + collapse spaces', 'cl.upper': 'UPPERCASE', 'cl.lower': 'lowercase', 'cl.titlecase': 'Title Case', 'cl.endigits': 'Digits → English', 'cl.fadigits': 'Digits → Persian',
    'cl.fachars': 'Fix Arabic ي ك', 'cl.diacritics': 'Strip diacritics', 'cl.nonprint': 'Hidden chars', 'cl.html': 'Strip HTML', 'cl.punct': 'Strip punctuation', 'cl.digitsonly': 'Digits only', 'cl.nospaces': 'Remove spaces',
    'st.title': 'Structure', 'st.erows': 'Remove empty rows', 'st.ecols': 'Remove empty columns', 'st.erows.done': 'Removed {n} empty rows', 'st.ecols.done': 'Removed {n} empty columns',
    'st.fill': 'Fill empty cells', 'st.f.down': 'Copy from above', 'st.f.up': 'Copy from below', 'st.f.value': 'Fixed value', 'st.f.mean': 'Mean', 'st.f.median': 'Median', 'st.f.mode': 'Most common', 'st.f.valph': 'Value…', 'st.fillbtn': 'Fill empty cells', 'st.filled': 'Filled {n} cells',
    'st.split': 'Split column', 'st.splitcol': 'Column', 'st.delim': 'Delimiter', 'st.removeorig': 'Remove original column', 'st.splitbtn': 'Split', 'st.split.done': 'Created {n} columns', 'st.split.none': 'Nothing to split', 'st.delim.need': 'Enter a delimiter',
    'st.merge': 'Merge columns', 'st.sep': 'Separator', 'st.mergebtn': 'Merge selected columns', 'st.merge.need': 'Select at least 2 columns (chips above)', 'st.merge.done': 'Columns merged',
    'fr.title': 'Find & replace', 'fr.find': 'Find', 'fr.rep': 'Replace with', 'fr.regex': 'Regex', 'fr.case': 'Match case', 'fr.whole': 'Whole cell', 'fr.count': 'Count', 'fr.do': 'Replace all', 'fr.found': '{n} matching cells', 'fr.done': 'Replaced in {n} cells', 'fr.need': 'Enter something to find',
    'ro.title': 'Rows', 'ro.keep': 'Keep only filtered rows', 'ro.del': 'Delete filtered rows', 'ro.sortperm': 'Apply sort permanently', 'ro.shuffle': 'Shuffle rows', 'ro.removed': 'Removed {n} rows', 'ro.delq': 'Delete {n} rows currently shown?', 'ro.needfilter': 'Add a filter or search first', 'ro.needsort': 'Sort a column first', 'ro.sorted': 'Sort applied', 'ro.shuffled': 'Rows shuffled', 'rows.add': 'Add {n} rows',
    'g.title': 'Generate values', 'g.col': 'Column', 'g.onlyempty': 'Only fill empty cells', 'g.params': 'Parameters', 'g.start': 'Start', 'g.step': 'Step', 'g.seq': 'Number sequence', 'g.rand': 'Random integers (min…max)', 'g.list': 'Pick from list', 'g.fromlist': 'Fill from list', 'g.list.need': 'Enter list values', 'g.pattern': 'Pattern', 'g.applypat': 'Apply pattern',
    'g.numbers': 'Numbers', 'g.letters': 'Letters', 'g.dates': 'Dates', 'g.randdates': 'Random dates', 'g.uuid': 'UUID', 'g.names': 'Names', 'g.namesfa': 'Persian names', 'g.emails': 'Emails', 'g.phones': 'Phones', 'g.phonesir': 'IR mobiles', 'g.prices': 'Prices', 'g.ints': 'Integers', 'g.bools': 'Booleans', 'g.cities': 'Cities', 'g.citiesfa': 'Persian cities', 'g.companies': 'Companies',
    'g.done': 'Filled {n} cells in “{c}”', 'g.smart': 'Smart sample rows', 'g.smart.hint': 'Adds rows with realistic data, guessed from each column’s name and type.', 'g.smart.n': 'Number of rows', 'g.smart.fa': 'Use Persian data', 'g.smart.btn': 'Add sample rows', 'g.smart.done': 'Added {n} rows',
    'v.title': 'Data validation', 'v.hint': 'Checks every cell against its column type, required / unique rules and select options.', 'v.hl': 'Highlight invalid cells', 'v.run': 'Run check', 'v.issues': '{n} issues found', 'v.allok': 'All checks passed ✓', 'v.show': 'Show rows',
    'vk.required': 'empty (required)', 'vk.number': 'not a number', 'vk.date': 'not a date', 'vk.boolean': 'not boolean', 'vk.email': 'bad email', 'vk.url': 'bad URL', 'vk.option': 'not in options', 'vk.dup': 'duplicates',
    'a.overview': 'Overview', 'a.viewonly': 'Only rows in current view', 'a.rows': 'Rows', 'a.cols': 'Columns', 'a.fill': 'Filled', 'a.dups': 'Duplicate rows', 'a.columns': 'Columns', 'a.filled': 'Filled', 'a.empty': 'Empty', 'a.unique': 'Unique', 'a.mean': 'Mean', 'a.median': 'Median', 'a.len': 'Length', 'a.top5': 'Most common',
    'a.group': 'Group & aggregate', 'a.by': 'Group by', 'a.agg': 'Aggregate', 'a.val': 'Of column', 'a.top': 'Top N', 'a.run': 'Show chart', 'a.tosheet': 'Open as new sheet', 'a.empty.res': 'No groups',
    'agg.count': 'Count', 'agg.sum': 'Sum', 'agg.avg': 'Average', 'agg.min': 'Min', 'agg.max': 'Max', 'agg.median': 'Median', 'agg.unique': 'Unique count',
    'cb.title': 'Combine sheets', 'cb.hint': 'Work with another sheet of this workbook. Keys are matched ignoring case and digit style.', 'cb.need2': 'You need at least two sheets. Import another file as a new sheet.', 'cb.other': 'Other sheet', 'cb.ka': 'Key (this sheet)', 'cb.kb': 'Key (other sheet)',
    'cb.join': 'Join (VLOOKUP)', 'cb.kind': 'Join type', 'cb.left': 'Left — keep all of this sheet', 'cb.inner': 'Inner — matches only', 'cb.full': 'Full — keep everything', 'cb.join.btn': 'Create joined sheet', 'cb.sets': 'Compare by key', 'cb.both': 'Rows in both sheets', 'cb.onlya': 'Only in this sheet', 'cb.onlyb': 'Only in other', 'cb.set.both': 'In both', 'cb.set.onlyA': 'Only in A', 'cb.set.onlyB': 'Only in B',
    'cb.append': 'Append', 'cb.append.hint': 'Adds the other sheet’s rows below this one, matching columns by name.', 'cb.append.btn': 'Append rows', 'cb.appended': 'Appended {n} rows', 'cb.done': 'New sheet created',
    'tab.add': 'New sheet', 'tab.sheet': 'Sheet', 'tab.rename': 'Rename sheet', 'tab.dup': 'Duplicate', 'tab.left': 'Move left', 'tab.right': 'Move right', 'tab.del': 'Delete sheet', 'tab.del.q': 'Delete sheet “{n}”?',
    'wl.tag': 'The offline spreadsheet studio. Build, clean, dedupe, validate, analyze and export tabular data — nothing ever leaves your browser.', 'wl.open': 'Open a file', 'wl.paste': 'Paste data', 'wl.paste.s': 'from Excel / web', 'wl.blank': 'Blank table', 'wl.blank.s': 'start from scratch', 'wl.demo': 'Try demo data', 'wl.demo.s': 'messy on purpose', 'wl.privacy': 'Everything runs locally',
    'imp.title': 'Import', 'imp.sub': 'CSV, Excel, JSON or a GridForge project', 'imp.drop': 'Drop a file here or click to browse', 'imp.enc': 'Encoding', 'imp.delim': 'Delimiter', 'imp.auto': 'Auto-detect', 'imp.header': 'First row is the header', 'imp.replace': 'Replace workbook', 'imp.add': 'Add as new sheet(s)',
    'imp.go': 'Import', 'imp.found': '{r} rows · {s} sheet(s) · previewing first rows', 'imp.empty': 'The file looks empty', 'imp.project': 'GridForge project with {n} sheet(s)', 'imp.readerr': 'Could not read the file', 'imp.done': 'Imported {r} rows × {c} columns',
    'paste.title': 'Paste data', 'paste.sub': 'Paste cells copied from Excel, Google Sheets or a web table', 'paste.ph': 'Paste here…',
    'exp.title': 'Export', 'exp.sub': 'Pick a format', 'exp.scope': 'Rows', 'exp.view': 'Current view (filters + sort)', 'exp.all': 'All rows', 'exp.delim': 'CSV delimiter', 'exp.hidden': 'Include hidden columns', 'exp.bom': 'UTF-8 BOM (Excel-friendly)', 'exp.header': 'Include header row', 'exp.allsheets': 'Excel: all sheets', 'exp.copy': 'Copy as TSV to clipboard', 'exp.project': 'Project', 'exp.done': 'Exported {n} rows',
    'fmt.csv': 'Universal', 'fmt.json': 'Array of objects', 'fmt.jsonl': 'One object per line', 'fmt.tsv': 'Tab-separated', 'fmt.md': 'Table', 'fmt.html': 'Styled page',
    'set.title': 'Settings', 'set.theme': 'Theme', 'set.lang': 'Language', 'set.density': 'Row density', 'set.d.compact': 'Compact', 'set.d.normal': 'Normal', 'set.d.comfort': 'Comfy', 'set.font': 'Font size',
    'set.zebra': 'Zebra stripes', 'set.borders': 'Column borders', 'set.freeze': 'Freeze first column', 'set.freeze.h': 'Stays visible while scrolling sideways', 'set.rownums': 'Row numbers', 'set.hl': 'Highlight search matches', 'set.bggrid': 'Background grid', 'set.autosave': 'Autosave locally', 'set.autosave.h': 'Kept in this browser (IndexedDB) only',
    'set.reset': 'Reset settings', 'set.reset.done': 'Settings reset', 'set.wipe': 'Delete saved workbook', 'set.wipe.q': 'Delete the autosaved workbook from this browser?', 'set.wipe.done': 'Saved data deleted', 'set.privacy': 'GridForge never uploads anything. A strict CSP blocks all network requests; your data stays in this browser.',
    'help.title': 'Keyboard shortcuts', 'help.search': 'Focus search', 'help.undo': 'Undo / redo', 'help.edit': 'Edit cell', 'help.esc': 'Cancel / close', 'help.tab': 'Next / previous cell', 'help.arrows': 'Move / extend selection', 'help.all': 'Select all', 'help.clip': 'Copy / cut / paste', 'help.del': 'Clear selection', 'help.fill': 'Fill down / right', 'help.newrow': 'Insert row', 'help.multisort': 'Add sort key', 'help.selcol': 'Select column', 'help.save': 'Save project file', 'help.about': 'GridForge — open source, offline, MIT licensed.',
    'pal.ph': 'Type a command…', 'pal.none': 'No matching command',
    'cmd.saveproj': 'Save project file (.gridforge.json)', 'cmd.paste': 'Paste data…', 'cmd.new': 'New empty workbook', 'cmd.new.q': 'Discard the current workbook and start a new one?', 'cmd.demo': 'Load demo data', 'cmd.dedupe': 'Find & remove duplicates', 'cmd.addrow': 'Add row', 'cmd.addcol': 'Add column', 'cmd.selectall': 'Select all cells', 'cmd.clearfilters': 'Clear filters, search & sort', 'cmd.togglepanel': 'Toggle tool panel', 'cmd.lang': 'Switch language (English / فارسی)',
    'theme.dark': 'Theme: Dark', 'theme.light': 'Theme: Light', 'theme.midnight': 'Theme: Midnight', 'theme.forest': 'Theme: Forest', 'theme.sunset': 'Theme: Sunset', 'theme.ivory': 'Theme: Ivory', 'theme.ocean': 'Theme: Ocean',
  };

  I.dict.fa = {
    'act.undo': 'بازگردانی', 'act.redo': 'انجام مجدد', 'act.import': 'ورود فایل', 'act.export': 'خروجی', 'act.palette': 'پالت دستورها', 'act.theme': 'تغییر روشن / تیره',
    'act.lang': 'تغییر زبان', 'act.settings': 'تنظیمات', 'act.help': 'میانبرهای صفحه‌کلید', 'act.close': 'بستن', 'act.panel': 'نمایش/پنهان‌کردن پنل ابزار',
    'proj.placeholder': 'کارپوشه‌ی بدون‌نام', 'drop.here': 'فایل را اینجا رها کنید',
    'p.columns': 'ستون‌ها', 'p.clean': 'پاک‌سازی', 'p.fill': 'پرکردن', 'p.validate': 'اعتبارسنجی', 'p.analyze': 'تحلیل', 'p.combine': 'ترکیب',
    'search.ph': 'جستجو…  ( / )', 'search.allcols': 'همه‌ی ستون‌ها', 'tb.filter': 'فیلتر', 'tb.columns': 'ستون‌ها', 'tb.row': 'ردیف', 'tb.rows': 'ردیف‌ها ▾',
    'sb.local': '۱۰۰٪ محلی', 'sb.rows': 'ردیف', 'sb.cols': 'ستون', 'sb.cells': 'سلول', 'sb.saved': 'ذخیره‌ی محلی انجام شد', 'sb.saving': 'در حال ذخیره…', 'sb.saveerr': 'ذخیره‌ی خودکار در دسترس نیست',
    'dlg.ok': 'تأیید', 'dlg.cancel': 'انصراف', 'dlg.confirm': 'مطمئن هستید؟',
    'need.data': 'ابتدا داده‌ای اضافه یا وارد کنید.',
    'grid.selectall': 'انتخاب همه', 'grid.nomatch': 'هیچ ردیفی با فیلترها مطابقت ندارد', 'grid.norows': 'هنوز ردیفی نیست — برای افزودن Ctrl+Enter بزنید',
    'grid.clipped': 'چسبانده شد — ستون‌های اضافه نادیده گرفته شدند', 'grid.pasted': '{n} سلول چسبانده شد', 'grid.needcols': 'ابتدا یک ستون اضافه کنید',
    'grid.delrows.q': '{n} ردیف حذف شود؟', 'grid.deleted': '{n} ردیف حذف شد',
    'toast.copied': 'کپی شد', 'toast.copyfail': 'کپی ناموفق بود', 'toast.nothing': 'چیزی برای بازگردانی نیست', 'toast.pastehint': 'برای چسباندن Ctrl+V بزنید', 'toast.restored': 'آخرین نشست شما بازیابی شد ({d})',
    'm.sortasc': 'مرتب‌سازی صعودی', 'm.sortdesc': 'مرتب‌سازی نزولی', 'm.sortclear': 'حذف مرتب‌سازی', 'm.filter': 'فیلتر…', 'm.onlyempty': 'فقط سلول‌های خالی', 'm.onlyfilled': 'فقط سلول‌های پُر',
    'm.showdups': 'فقط تکراری‌ها', 'm.showinvalid': 'فقط نامعتبرها', 'm.hldups': 'هایلایت تکراری‌ها', 'm.hidedups': 'توقف هایلایت تکراری‌ها', 'm.type': 'نوع ستون',
    'm.rename': 'تغییر نام…', 'm.fit': 'تنظیم خودکار عرض', 'm.selcol': 'انتخاب ستون', 'm.hide': 'پنهان‌کردن ستون', 'm.insl': 'درج ستون قبل', 'm.insr': 'درج ستون بعد',
    'm.dupcol': 'تکثیر ستون', 'm.delcol': 'حذف ستون', 'm.copy': 'کپی', 'm.paste': 'چسباندن', 'm.clear': 'پاک‌کردن سلول‌ها', 'm.fval': 'فیلتر: برابر «{v}»', 'm.fnval': 'فیلتر: غیر از این مقدار',
    'm.insabove': 'درج ردیف بالا', 'm.insbelow': 'درج ردیف پایین', 'm.duprows': 'تکثیر {n} ردیف', 'm.delrows': 'حذف {n} ردیف',
    'f.column': 'ستون', 'f.cond': 'شرط', 'f.value': 'مقدار', 'f.add': 'افزودن فیلتر', 'f.clear': 'پاک‌کردن همه', 'f.showing': 'نمایش {a} از {b} ردیف',
    'op.contains': 'شامل', 'op.notcontains': 'شامل نیست', 'op.equals': 'برابر', 'op.notequals': 'نابرابر', 'op.starts': 'شروع با', 'op.ends': 'پایان با',
    'op.gt': '>', 'op.gte': '≥', 'op.lt': '<', 'op.lte': '≤', 'op.empty': 'خالی است', 'op.notempty': 'خالی نیست', 'op.regex': 'مطابق regex', 'op.dupes': 'تکراری است', 'op.unique': 'یکتاست', 'op.invalid': 'نامعتبر است',
    'col.new': 'ستون', 'col.schema': 'ساختار', 'col.none': 'هنوز ستونی نیست.', 'col.add': 'افزودن ستون', 'col.showall': 'نمایش همه', 'col.hideall': 'پنهان‌کردن همه', 'col.type': 'نوع', 'col.default': 'مقدار پیش‌فرض',
    'col.options': 'گزینه‌ها (با کاما جدا کنید)', 'col.required': 'اجباری', 'col.unique': 'باید یکتا باشد', 'col.conv': 'یکدست‌سازی مقادیر', 'col.conv.tip': 'مقادیر را به شکل استاندارد نوع ستون بازنویسی می‌کند', 'col.conv.done': '{n} مقدار یکدست شد',
    'fx.title': 'ستون فرمولی', 'fx.hint': 'فرمول‌های سطری. با [نام ستون] به ستون ارجاع دهید. تحلیلگر امن است — هیچ کدی اجرا نمی‌شود.', 'fx.expr': 'عبارت', 'fx.name': 'نام ستون جدید', 'fx.target': 'نوشتن نتیجه در',
    'fx.newcol': '＋ ستون جدید', 'fx.apply': 'اعمال فرمول', 'fx.done': 'فرمول اعمال شد',
    'tpl.title': 'قالب‌ها', 'tpl.contacts': 'مخاطبین', 'tpl.products': 'محصولات', 'tpl.tasks': 'وظایف', 'tpl.inventory': 'انبار', 'tpl.finance': 'مالی', 'tpl.employees': 'کارکنان',
    'tpl.new.q': 'این قالب به‌عنوان برگه‌ی جدید اضافه شود؟',
    'c.target': 'محدوده‌ی اعمال', 'c.scope': 'ردیف‌ها', 'c.sc.all': 'همه‌ی ردیف‌ها', 'c.sc.view': 'ردیف‌های نمای فعلی', 'c.sc.sel': 'فقط ردیف‌های انتخاب‌شده', 'c.cols': 'ستون‌ها', 'c.cols.hint': 'بدون انتخاب = همه',
    'dup.title': 'حذف تکراری‌ها', 'dup.hint': 'ستون‌های کلید را انتخاب کنید (هیچ‌کدام = کل ردیف). ردیف‌هایی با کلید یکسان تکراری‌اند.', 'dup.keys': 'ستون‌های کلید', 'dup.ic': 'بدون حساسیت به حروف', 'dup.trim': 'نادیده‌گرفتن فاصله‌ها',
    'dup.keep': 'هنگام حذف، نگه‌دار', 'dup.first': 'اولین مورد', 'dup.last': 'آخرین مورد', 'dup.none': 'هیچ‌کدام (حذف همه‌ی نسخه‌ها)', 'dup.find': 'شمارش', 'dup.hl': 'هایلایت', 'dup.remove': 'حذف تکراری‌ها', 'dup.tosheet': 'انتقال به برگه‌ی جدید',
    'dup.found': '{g} گروه تکراری · {n} ردیف اضافه', 'dup.none.found': 'تکراری پیدا نشد 🎉', 'dup.q': '{n} ردیف تکراری حذف شود؟', 'dup.removed': '{n} ردیف تکراری حذف شد', 'dup.moved': '{n} ردیف تکراری به برگه‌ی جدید منتقل شد',
    'dup.hl.on': 'تکراری‌ها هایلایت شدند', 'dup.hl.off': 'هایلایت برداشته شد', 'dup.hl.chip': 'تکراری در: {c}',
    'cl.title': 'پاک‌سازی متن', 'cl.done': '{n} سلول تغییر کرد', 'cl.trim': 'حذف فاصله‌ی کناره‌ها', 'cl.collapse': 'حذف + یکی‌کردن فاصله‌ها', 'cl.upper': 'UPPERCASE', 'cl.lower': 'lowercase', 'cl.titlecase': 'حروف اول بزرگ', 'cl.endigits': 'ارقام ← انگلیسی', 'cl.fadigits': 'ارقام ← فارسی',
    'cl.fachars': 'اصلاح «ي» و «ك» عربی', 'cl.diacritics': 'حذف اعراب', 'cl.nonprint': 'نویسه‌های نامرئی', 'cl.html': 'حذف تگ HTML', 'cl.punct': 'حذف علائم نگارشی', 'cl.digitsonly': 'فقط ارقام', 'cl.nospaces': 'حذف همه‌ی فاصله‌ها',
    'st.title': 'ساختار', 'st.erows': 'حذف ردیف‌های خالی', 'st.ecols': 'حذف ستون‌های خالی', 'st.erows.done': '{n} ردیف خالی حذف شد', 'st.ecols.done': '{n} ستون خالی حذف شد',
    'st.fill': 'پر کردن سلول‌های خالی', 'st.f.down': 'کپی از بالا', 'st.f.up': 'کپی از پایین', 'st.f.value': 'مقدار ثابت', 'st.f.mean': 'میانگین', 'st.f.median': 'میانه', 'st.f.mode': 'پرتکرارترین', 'st.f.valph': 'مقدار…', 'st.fillbtn': 'پر کردن خالی‌ها', 'st.filled': '{n} سلول پر شد',
    'st.split': 'تقسیم ستون', 'st.splitcol': 'ستون', 'st.delim': 'جداکننده', 'st.removeorig': 'حذف ستون اصلی', 'st.splitbtn': 'تقسیم', 'st.split.done': '{n} ستون ساخته شد', 'st.split.none': 'چیزی برای تقسیم نبود', 'st.delim.need': 'جداکننده را وارد کنید',
    'st.merge': 'ادغام ستون‌ها', 'st.sep': 'جداکننده', 'st.mergebtn': 'ادغام ستون‌های انتخابی', 'st.merge.need': 'حداقل ۲ ستون انتخاب کنید (چیپ‌های بالا)', 'st.merge.done': 'ستون‌ها ادغام شدند',
    'fr.title': 'جستجو و جایگزینی', 'fr.find': 'جستجو', 'fr.rep': 'جایگزین با', 'fr.regex': 'Regex', 'fr.case': 'حساس به حروف', 'fr.whole': 'کل سلول', 'fr.count': 'شمارش', 'fr.do': 'جایگزینی همه', 'fr.found': '{n} سلول مطابق', 'fr.done': 'در {n} سلول جایگزین شد', 'fr.need': 'عبارت جستجو را وارد کنید',
    'ro.title': 'ردیف‌ها', 'ro.keep': 'فقط ردیف‌های فیلترشده بماند', 'ro.del': 'حذف ردیف‌های فیلترشده', 'ro.sortperm': 'اعمال دائمی مرتب‌سازی', 'ro.shuffle': 'بُر زدن ردیف‌ها', 'ro.removed': '{n} ردیف حذف شد', 'ro.delq': '{n} ردیفِ نمایش‌داده‌شده حذف شود؟', 'ro.needfilter': 'ابتدا فیلتر یا جستجو اضافه کنید', 'ro.needsort': 'ابتدا یک ستون را مرتب کنید', 'ro.sorted': 'مرتب‌سازی اعمال شد', 'ro.shuffled': 'ردیف‌ها بُر خوردند', 'rows.add': 'افزودن {n} ردیف',
    'g.title': 'تولید مقدار', 'g.col': 'ستون', 'g.onlyempty': 'فقط سلول‌های خالی پر شوند', 'g.params': 'پارامترها', 'g.start': 'شروع', 'g.step': 'گام', 'g.seq': 'دنباله‌ی عددی', 'g.rand': 'عدد صحیح تصادفی (min…max)', 'g.list': 'انتخاب از فهرست', 'g.fromlist': 'پر کردن از فهرست', 'g.list.need': 'مقادیر فهرست را وارد کنید', 'g.pattern': 'الگو', 'g.applypat': 'اعمال الگو',
    'g.numbers': 'اعداد', 'g.letters': 'حروف', 'g.dates': 'تاریخ‌ها', 'g.randdates': 'تاریخ تصادفی', 'g.uuid': 'UUID', 'g.names': 'نام انگلیسی', 'g.namesfa': 'نام فارسی', 'g.emails': 'ایمیل', 'g.phones': 'تلفن', 'g.phonesir': 'موبایل ایران', 'g.prices': 'قیمت', 'g.ints': 'اعداد صحیح', 'g.bools': 'بله/خیر', 'g.cities': 'شهر (EN)', 'g.citiesfa': 'شهر (فارسی)', 'g.companies': 'شرکت',
    'g.done': '{n} سلول در «{c}» پر شد', 'g.smart': 'ردیف‌های نمونه‌ی هوشمند', 'g.smart.hint': 'ردیف‌هایی با داده‌ی واقع‌نما اضافه می‌کند؛ نوع داده از نام و نوع هر ستون حدس زده می‌شود.', 'g.smart.n': 'تعداد ردیف', 'g.smart.fa': 'استفاده از داده‌ی فارسی', 'g.smart.btn': 'افزودن ردیف نمونه', 'g.smart.done': '{n} ردیف اضافه شد',
    'v.title': 'اعتبارسنجی داده', 'v.hint': 'هر سلول را با نوع ستون، قوانین اجباری/یکتا و گزینه‌های انتخابی می‌سنجد.', 'v.hl': 'هایلایت سلول‌های نامعتبر', 'v.run': 'اجرای بررسی', 'v.issues': '{n} مشکل پیدا شد', 'v.allok': 'همه‌ی بررسی‌ها موفق ✓', 'v.show': 'نمایش ردیف‌ها',
    'vk.required': 'خالی (اجباری)', 'vk.number': 'عدد نیست', 'vk.date': 'تاریخ نیست', 'vk.boolean': 'بله/خیر نیست', 'vk.email': 'ایمیل نادرست', 'vk.url': 'آدرس نادرست', 'vk.option': 'خارج از گزینه‌ها', 'vk.dup': 'تکراری',
    'a.overview': 'نمای کلی', 'a.viewonly': 'فقط ردیف‌های نمای فعلی', 'a.rows': 'ردیف', 'a.cols': 'ستون', 'a.fill': 'پُر', 'a.dups': 'ردیف تکراری', 'a.columns': 'ستون‌ها', 'a.filled': 'پُر', 'a.empty': 'خالی', 'a.unique': 'یکتا', 'a.mean': 'میانگین', 'a.median': 'میانه', 'a.len': 'طول', 'a.top5': 'پرتکرارترین‌ها',
    'a.group': 'گروه‌بندی و تجمیع', 'a.by': 'گروه‌بندی بر اساس', 'a.agg': 'تابع تجمیع', 'a.val': 'روی ستون', 'a.top': 'N مورد برتر', 'a.run': 'نمایش نمودار', 'a.tosheet': 'باز کردن در برگه‌ی جدید', 'a.empty.res': 'گروهی نیست',
    'agg.count': 'تعداد', 'agg.sum': 'جمع', 'agg.avg': 'میانگین', 'agg.min': 'کمینه', 'agg.max': 'بیشینه', 'agg.median': 'میانه', 'agg.unique': 'تعداد یکتا',
    'cb.title': 'ترکیب برگه‌ها', 'cb.hint': 'با برگه‌ی دیگری از همین کارپوشه کار کنید. کلیدها بدون توجه به حروف و نوع ارقام مقایسه می‌شوند.', 'cb.need2': 'حداقل دو برگه لازم است. فایل دیگری را به‌عنوان برگه‌ی جدید وارد کنید.', 'cb.other': 'برگه‌ی دیگر', 'cb.ka': 'کلید (این برگه)', 'cb.kb': 'کلید (برگه‌ی دیگر)',
    'cb.join': 'اتصال (مثل VLOOKUP)', 'cb.kind': 'نوع اتصال', 'cb.left': 'چپ — همه‌ی این برگه بماند', 'cb.inner': 'داخلی — فقط مطابق‌ها', 'cb.full': 'کامل — همه چیز بماند', 'cb.join.btn': 'ساخت برگه‌ی متصل', 'cb.sets': 'مقایسه بر اساس کلید', 'cb.both': 'ردیف‌های مشترک', 'cb.onlya': 'فقط در این برگه', 'cb.onlyb': 'فقط در برگه‌ی دیگر', 'cb.set.both': 'مشترک', 'cb.set.onlyA': 'فقط در A', 'cb.set.onlyB': 'فقط در B',
    'cb.append': 'الحاق', 'cb.append.hint': 'ردیف‌های برگه‌ی دیگر را زیر این برگه اضافه می‌کند و ستون‌ها را بر اساس نام تطبیق می‌دهد.', 'cb.append.btn': 'الحاق ردیف‌ها', 'cb.appended': '{n} ردیف الحاق شد', 'cb.done': 'برگه‌ی جدید ساخته شد',
    'tab.add': 'برگه‌ی جدید', 'tab.sheet': 'برگه', 'tab.rename': 'تغییر نام برگه', 'tab.dup': 'تکثیر', 'tab.left': 'انتقال به چپ', 'tab.right': 'انتقال به راست', 'tab.del': 'حذف برگه', 'tab.del.q': 'برگه‌ی «{n}» حذف شود؟',
    'wl.tag': 'استودیوی آفلاین صفحه‌گسترده. داده‌های جدولی را بسازید، پاک‌سازی کنید، تکراری‌ها را حذف کنید، اعتبارسنجی و تحلیل کنید و خروجی بگیرید — هیچ‌چیز از مرورگر شما بیرون نمی‌رود.', 'wl.open': 'باز کردن فایل', 'wl.paste': 'چسباندن داده', 'wl.paste.s': 'از اکسل / وب', 'wl.blank': 'جدول خالی', 'wl.blank.s': 'از صفر شروع کن', 'wl.demo': 'داده‌ی نمونه', 'wl.demo.s': 'عمداً نامرتب', 'wl.privacy': 'همه‌چیز به‌صورت محلی اجرا می‌شود',
    'imp.title': 'ورود فایل', 'imp.sub': 'CSV، اکسل، JSON یا پروژه‌ی GridForge', 'imp.drop': 'فایل را اینجا رها کنید یا کلیک کنید', 'imp.enc': 'کدگذاری', 'imp.delim': 'جداکننده', 'imp.auto': 'تشخیص خودکار', 'imp.header': 'ردیف اول سرستون است', 'imp.replace': 'جایگزینی کارپوشه', 'imp.add': 'افزودن به‌عنوان برگه‌ی جدید',
    'imp.go': 'ورود', 'imp.found': '{r} ردیف · {s} برگه · پیش‌نمایش ردیف‌های اول', 'imp.empty': 'فایل خالی به نظر می‌رسد', 'imp.project': 'پروژه‌ی GridForge با {n} برگه', 'imp.readerr': 'خواندن فایل ممکن نشد', 'imp.done': '{r} ردیف × {c} ستون وارد شد',
    'paste.title': 'چسباندن داده', 'paste.sub': 'سلول‌های کپی‌شده از اکسل، گوگل‌شیت یا جدول وب را بچسبانید', 'paste.ph': 'اینجا بچسبانید…',
    'exp.title': 'خروجی', 'exp.sub': 'قالب را انتخاب کنید', 'exp.scope': 'ردیف‌ها', 'exp.view': 'نمای فعلی (فیلتر + مرتب‌سازی)', 'exp.all': 'همه‌ی ردیف‌ها', 'exp.delim': 'جداکننده‌ی CSV', 'exp.hidden': 'شامل ستون‌های پنهان', 'exp.bom': 'UTF-8 BOM (سازگار با اکسل)', 'exp.header': 'شامل ردیف سرستون', 'exp.allsheets': 'اکسل: همه‌ی برگه‌ها', 'exp.copy': 'کپی TSV در کلیپ‌بورد', 'exp.project': 'پروژه', 'exp.done': '{n} ردیف خروجی گرفته شد',
    'fmt.csv': 'همه‌منظوره', 'fmt.json': 'آرایه‌ای از اشیا', 'fmt.jsonl': 'هر خط یک شیء', 'fmt.tsv': 'جداشده با Tab', 'fmt.md': 'جدول', 'fmt.html': 'صفحه‌ی استایل‌دار',
    'set.title': 'تنظیمات', 'set.theme': 'پوسته', 'set.lang': 'زبان', 'set.density': 'تراکم ردیف', 'set.d.compact': 'فشرده', 'set.d.normal': 'معمولی', 'set.d.comfort': 'راحت', 'set.font': 'اندازه‌ی قلم',
    'set.zebra': 'ردیف‌های راه‌راه', 'set.borders': 'خطوط ستون', 'set.freeze': 'ثابت‌کردن ستون اول', 'set.freeze.h': 'هنگام اسکرول افقی ثابت می‌ماند', 'set.rownums': 'شماره‌ی ردیف', 'set.hl': 'هایلایت نتایج جستجو', 'set.bggrid': 'شبکه‌ی پس‌زمینه', 'set.autosave': 'ذخیره‌ی خودکار محلی', 'set.autosave.h': 'فقط در همین مرورگر (IndexedDB) نگه‌داری می‌شود',
    'set.reset': 'بازنشانی تنظیمات', 'set.reset.done': 'تنظیمات بازنشانی شد', 'set.wipe': 'حذف کارپوشه‌ی ذخیره‌شده', 'set.wipe.q': 'کارپوشه‌ی ذخیره‌ی خودکار از این مرورگر حذف شود؟', 'set.wipe.done': 'داده‌ی ذخیره‌شده حذف شد', 'set.privacy': 'GridForge هیچ‌چیز را آپلود نمی‌کند. یک CSP سخت‌گیرانه همه‌ی درخواست‌های شبکه را مسدود می‌کند؛ داده‌ی شما در همین مرورگر می‌ماند.',
    'help.title': 'میانبرهای صفحه‌کلید', 'help.search': 'رفتن به جستجو', 'help.undo': 'بازگردانی / انجام مجدد', 'help.edit': 'ویرایش سلول', 'help.esc': 'انصراف / بستن', 'help.tab': 'سلول بعدی / قبلی', 'help.arrows': 'حرکت / گسترش انتخاب', 'help.all': 'انتخاب همه', 'help.clip': 'کپی / برش / چسباندن', 'help.del': 'پاک‌کردن انتخاب', 'help.fill': 'پر کردن به پایین / راست', 'help.newrow': 'درج ردیف', 'help.multisort': 'افزودن کلید مرتب‌سازی', 'help.selcol': 'انتخاب ستون', 'help.save': 'ذخیره‌ی فایل پروژه', 'help.about': 'GridForge — متن‌باز، آفلاین، با مجوز MIT.',
    'pal.ph': 'یک دستور بنویسید…', 'pal.none': 'دستوری پیدا نشد',
    'cmd.saveproj': 'ذخیره‌ی فایل پروژه (.gridforge.json)', 'cmd.paste': 'چسباندن داده…', 'cmd.new': 'کارپوشه‌ی خالی جدید', 'cmd.new.q': 'کارپوشه‌ی فعلی کنار گذاشته شود و کارپوشه‌ی جدید شروع شود؟', 'cmd.demo': 'بارگذاری داده‌ی نمونه', 'cmd.dedupe': 'یافتن و حذف تکراری‌ها', 'cmd.addrow': 'افزودن ردیف', 'cmd.addcol': 'افزودن ستون', 'cmd.selectall': 'انتخاب همه‌ی سلول‌ها', 'cmd.clearfilters': 'پاک‌کردن فیلتر، جستجو و مرتب‌سازی', 'cmd.togglepanel': 'نمایش/پنهان‌کردن پنل ابزار', 'cmd.lang': 'تغییر زبان (English / فارسی)',
    'theme.dark': 'پوسته: تیره', 'theme.light': 'پوسته: روشن', 'theme.midnight': 'پوسته: نیمه‌شب', 'theme.forest': 'پوسته: جنگل', 'theme.sunset': 'پوسته: غروب', 'theme.ivory': 'پوسته: عاجی', 'theme.ocean': 'پوسته: اقیانوس',
  };

  I.t = (key, vars) => {
    let s = (I.dict[I.lang] && I.dict[I.lang][key]) || I.dict.en[key] || key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] == null ? m : vars[k]));
    return s;
  };
  I.setLang = (l) => {
    I.lang = I.dict[l] ? l : 'en';
    if (typeof document !== 'undefined') {
      document.documentElement.lang = I.lang;
      document.documentElement.dir = I.lang === 'fa' ? 'rtl' : 'ltr';
    }
  };
  I.apply = (rootEl) => {
    const r = rootEl || document;
    r.querySelectorAll('[data-i18n]').forEach((e) => { e.textContent = I.t(e.dataset.i18n); });
    r.querySelectorAll('[data-i18n-ph]').forEach((e) => { e.placeholder = I.t(e.dataset.i18nPh); });
    r.querySelectorAll('[data-i18n-title]').forEach((e) => { e.title = I.t(e.dataset.i18nTitle); });
  };
})(typeof window !== 'undefined' ? window : globalThis);
