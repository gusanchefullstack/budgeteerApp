/**
 * Generates Budgeteer-API-v2.postman_collection.json
 * Run: node postman/generate-collection.mjs
 */
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const info = {
  name: 'Budgeteer API v2',
  description:
    'Budgeteer REST API. **Variables:** `baseUrl` defaults to `http://localhost:3000/api/v1` — request paths are relative (e.g. `auth/register`). **Flow:** run **Register** or **Login** (saves `authToken` via collection Bearer auth). **Create budget** or **Get my budget** saves `budgetId`. Nested budget bodies use `type` on line items; **Add item** uses `itemType`. **DELETE** category/group/item sends a JSON body. **List transactions (filtered)** is `GET .../transactions/q` (not `:id` = `q`).',
  schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
};

/** Paths are relative to `baseUrl` (include `/api/v1` in baseUrl). */
const BASE = '{{baseUrl}}';

const variable = [
  { key: 'baseUrl', value: 'http://localhost:3000/api/v1' },
  { key: 'authToken', value: '' },
  { key: 'budgetId', value: '' },
  { key: 'transactionId', value: '' },
];

const collectionAuth = {
  type: 'bearer',
  bearer: [{ key: 'token', value: '{{authToken}}', type: 'string' }],
};

function jsonHeaders() {
  return [{ key: 'Content-Type', value: 'application/json' }];
}

/** @param {object} opts { noAuth?, test?: string[], description? } */
function R(name, method, path, body, opts = {}) {
  const url = `${BASE}${path.startsWith('/') ? path : '/' + path}`;
  const item = {
    name,
    request: {
      method,
      header: jsonHeaders(),
      url,
      description: opts.description ?? '',
      ...(opts.noAuth ? { auth: { type: 'noauth' } } : {}),
    },
  };
  if (body != null) {
    item.request.body = {
      mode: 'raw',
      raw: typeof body === 'string' ? body : JSON.stringify(body, null, 2),
      options: { raw: { language: 'json' } },
    };
  }
  if (opts.test?.length) {
    item.event = [{ listen: 'test', script: { type: 'text/javascript', exec: opts.test } }];
  }
  return item;
}

function folder(name, item) {
  return { name, item };
}

const auth = folder('Auth', [
  R(
    'Register',
    'POST',
    '/auth/register',
    {
      firstName: 'Jane',
      lastName: 'Doe',
      username: 'janedoe',
      password: 'secret12345',
    },
    {
      noAuth: true,
      test: [
        'if (pm.response.code === 201) {',
        '  const j = pm.response.json();',
        "  if (j.token) pm.collectionVariables.set('authToken', j.token);",
        '}',
      ],
    },
  ),
  R(
    'Login',
    'POST',
    '/auth/login',
    { username: 'janedoe', password: 'secret12345' },
    {
      noAuth: true,
      test: [
        'if (pm.response.code === 200) {',
        '  const j = pm.response.json();',
        "  if (j.token) pm.collectionVariables.set('authToken', j.token);",
        '}',
      ],
    },
  ),
  R('Me', 'GET', '/auth/me', null, {}),
  R('Logout', 'POST', '/auth/logout', null, {}),
  R('Unsubscribe (delete account)', 'POST', '/auth/unsubscribe', null, {}),
]);

const budgetCrud = folder('Budget / CRUD', [
  R(
    'Get my budget',
    'GET',
    '/budget',
    null,
    {
      test: [
        'if (pm.response.code === 200) {',
        '  const j = pm.response.json();',
        "  if (j.data && j.data.id) pm.collectionVariables.set('budgetId', j.data.id);",
        '}',
      ],
    },
  ),
  R(
    'Create budget',
    'POST',
    '/budget',
    {
      name: '2026 Annual Budget',
      beginningDate: '2026-01-01',
      endingDate: '2026-12-31',
      incomes: [],
      expenses: [],
    },
    {
      test: [
        'if (pm.response.code === 201) {',
        '  const j = pm.response.json();',
        "  if (j.data && j.data.id) pm.collectionVariables.set('budgetId', j.data.id);",
        '}',
      ],
    },
  ),
  R(
    'Create budget (with nested tree)',
    'POST',
    '/budget',
    {
      name: 'Sample With Tree',
      beginningDate: '2026-01-01',
      endingDate: '2026-12-31',
      incomes: [
        {
          name: 'Work',
          type: 'incomes',
          budgetGroups: [
            {
              name: 'Salary',
              type: 'incomes',
              budgetItems: [
                {
                  name: 'Monthly Pay',
                  plannedDate: '2026-01-01',
                  plannedAmount: 5000,
                  type: 'income',
                  currency: 'USD',
                  frequency: 'monthly',
                },
              ],
            },
          ],
        },
      ],
      expenses: [],
    },
    { description: 'Nested items use field **type** (`income`/`expense`), not `itemType`.' },
  ),
  R('Get budget by id', 'GET', '/budget/{{budgetId}}', null, {}),
  R(
    'Get transactions (for budget owner)',
    'GET',
    '/budget/{{budgetId}}/transactions',
    null,
    {},
  ),
  R(
    'Update budget (partial)',
    'PATCH',
    '/budget/{{budgetId}}',
    { name: '2026 Annual Budget Updated' },
    {},
  ),
  R('Delete budget', 'DELETE', '/budget/{{budgetId}}', null, {}),
]);

const category = folder('Budget / Category', [
  R(
    'Add category',
    'POST',
    '/budget/{{budgetId}}/category',
    { section: 'expenses', name: 'Home', budgetGroups: [] },
    {},
  ),
  R(
    'Update category (rename)',
    'PATCH',
    '/budget/{{budgetId}}/category',
    { section: 'expenses', categoryName: 'Home', name: 'Household' },
    {},
  ),
  R(
    'Delete category',
    'DELETE',
    '/budget/{{budgetId}}/category',
    { section: 'expenses', categoryName: 'Household' },
    {},
  ),
]);

const group = folder('Budget / Group', [
  R(
    'Add group',
    'POST',
    '/budget/{{budgetId}}/group',
    { section: 'expenses', categoryName: 'Household', name: 'Utilities', budgetItems: [] },
    {},
  ),
  R(
    'Update group (rename)',
    'PATCH',
    '/budget/{{budgetId}}/group',
    {
      section: 'expenses',
      categoryName: 'Household',
      groupName: 'Utilities',
      name: 'Bills',
    },
    {},
  ),
  R(
    'Delete group',
    'DELETE',
    '/budget/{{budgetId}}/group',
    { section: 'expenses', categoryName: 'Household', groupName: 'Bills' },
    {},
  ),
]);

const item = folder('Budget / Item', [
  R(
    'Add item',
    'POST',
    '/budget/{{budgetId}}/item',
    {
      section: 'expenses',
      categoryName: 'Household',
      groupName: 'Bills',
      name: 'Electric',
      plannedDate: '2026-01-01',
      plannedAmount: 120,
      itemType: 'expense',
      currency: 'USD',
      frequency: 'monthly',
    },
    { description: 'This endpoint uses **itemType**; nested arrays in Create budget use **type**.' },
  ),
  R(
    'Update item',
    'PATCH',
    '/budget/{{budgetId}}/item',
    {
      section: 'expenses',
      categoryName: 'Household',
      groupName: 'Bills',
      itemName: 'Electric',
      plannedAmount: 130,
    },
    {},
  ),
  R(
    'Delete item',
    'DELETE',
    '/budget/{{budgetId}}/item',
    {
      section: 'expenses',
      categoryName: 'Household',
      groupName: 'Bills',
      itemName: 'Electric',
    },
    {},
  ),
]);

const transactions = folder('Transactions', [
  R(
    'Create transaction',
    'POST',
    '/transactions',
    {
      txdatetime: '2026-03-15T10:00:00.000Z',
      txcurrency: 'USD',
      txamount: 125.5,
      txtype: 'expense',
      txcategory: 'Household',
      txgroup: 'Bills',
      txitem: 'Electric',
    },
    {
      test: [
        'if (pm.response.code === 201) {',
        '  const j = pm.response.json();',
        "  if (j.data && j.data.id) pm.collectionVariables.set('transactionId', j.data.id);",
        '}',
      ],
    },
  ),
  R('List all transactions', 'GET', '/transactions', null, {}),
  R(
    'List transactions (filtered)',
    'GET',
    '/transactions/q?startDate=2026-01-01&endDate=2026-12-31&txtype=expense',
    null,
    {
      description:
        'Path must be **/transactions/q** (not `:id`). Optional query: startDate, endDate, txtype, txcategory, txgroup, txitem, txcurrency. If both dates set, endDate >= startDate.',
    },
  ),
  R(
    'Get transaction by id',
    'GET',
    '/transactions/{{transactionId}}',
    null,
    {},
  ),
]);

const docs = folder('Documentation (static)', [
  R(
    'OpenAPI YAML',
    'GET',
    '/docs/openapi.yaml',
    null,
    { noAuth: true, description: 'Machine-readable spec; no JWT required.' },
  ),
]);

const collection = {
  info,
  auth: collectionAuth,
  variable,
  item: [auth, budgetCrud, category, group, item, transactions, docs],
};

const out = join(__dirname, 'Budgeteer-API-v2.postman_collection.json');
writeFileSync(out, JSON.stringify(collection, null, 2) + '\n', 'utf8');
console.log('Wrote', out);
