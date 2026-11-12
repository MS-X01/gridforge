/* GridForge — templates.js : starter schemas */
(function (root) {
  'use strict';
  const GF = (root.GF = root.GF || {});
  GF.templates = {
    contacts: { e: '👥', cols: [['First Name', 'text', 1], ['Last Name', 'text', 1], ['Email', 'email', 1], ['Phone', 'text'], ['Company', 'text'], ['City', 'text'], ['Country', 'text']] },
    products: { e: '📦', cols: [['Product ID', 'text', 1], ['Name', 'text', 1], ['Category', 'select', 0, 'Electronics,Clothing,Food,Sports,Books,Other'], ['Price', 'number', 1], ['Stock', 'number'], ['SKU', 'text'], ['Description', 'text']] },
    tasks: { e: '✅', cols: [['Task', 'text', 1], ['Status', 'select', 0, 'Todo,In Progress,Done,Blocked'], ['Priority', 'select', 0, 'Low,Medium,High,Critical'], ['Assignee', 'text'], ['Due Date', 'date'], ['Tags', 'text']] },
    inventory: { e: '🏭', cols: [['Item Code', 'text', 1], ['Item Name', 'text', 1], ['Quantity', 'number'], ['Unit', 'select', 0, 'pcs,kg,liter,box,pack'], ['Location', 'text'], ['Min Stock', 'number'], ['Last Updated', 'date']] },
    finance: { e: '💰', cols: [['Date', 'date', 1], ['Description', 'text', 1], ['Category', 'select', 0, 'Income,Expense,Transfer,Investment'], ['Amount', 'number', 1], ['Currency', 'select', 0, 'USD,EUR,GBP,IRR,TRY'], ['Account', 'text'], ['Notes', 'text']] },
    employees: { e: '🏢', cols: [['Employee ID', 'text', 1], ['Full Name', 'text', 1], ['Department', 'select', 0, 'Engineering,Sales,Marketing,HR,Finance,Operations'], ['Role', 'text'], ['Email', 'email', 1], ['Start Date', 'date'], ['Salary', 'number'], ['Status', 'select', 0, 'Active,Inactive,On Leave']] },
  };
  /** build a store sheet from a template key */
  GF.templates.make = (key) => {
    const tp = GF.templates[key];
    const S = GF.store;
    const sh = S.mkSheet(key.charAt(0).toUpperCase() + key.slice(1), tp.cols.map((c) => S.mkCol({ name: c[0], type: c[1], required: !!c[2], options: c[3] || '' })), []);
    GF.ops.insertRows(sh, 0, 20);
    return sh;
  };
  /** messy demo data (duplicates, bad emails, mixed case) to show off the cleaning tools */
  GF.templates.demo = () => {
    const S = GF.store, ops = GF.ops;
    const sh = S.mkSheet('Demo', ['Name', 'Email', 'Phone', 'City', 'Amount', 'Joined'].map((n, i) => S.mkCol({ name: n, type: ['text', 'email', 'text', 'text', 'number', 'date'][i], required: i < 2 })), []);
    ops.smartRows(sh, 150, false, 7);
    for (let i = 0; i < 12; i++) sh.rows.push(sh.rows[i * 3].slice()); // exact duplicates
    for (let i = 0; i < 6; i++) { const r = sh.rows[40 + i].slice(); r[0] = '  ' + r[0].toUpperCase() + ' '; r[1] = r[1].toUpperCase(); sh.rows.push(r); } // near duplicates
    sh.rows[5][1] = 'not-an-email'; sh.rows[9][4] = 'abc'; sh.rows[14][0] = ''; sh.rows[20][5] = '31/12/2024';
    return sh;
  };
})(typeof window !== 'undefined' ? window : globalThis);
