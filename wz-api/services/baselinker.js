const axios = require('axios');
const config = require('../config');

const BASELINKER_URL = 'https://api.baselinker.com/connector.php';
const MAX_RESULTS = 20;

let warehouseNamesPromise = null;

async function callBaseLinker(method, parameters = {}) {
  const body = new URLSearchParams({ method, parameters: JSON.stringify(parameters) });
  const response = await axios.post(BASELINKER_URL, body, {
    headers: { 'X-BLToken': config.baselinker.token },
  });
  // BaseLinker reports errors with HTTP 200 and status "ERROR".
  if (response.data.status !== 'SUCCESS') {
    throw new Error(`BaseLinker ${method} failed: ${response.data.error_code} ${response.data.error_message}`);
  }
  return response.data;
}

// Warehouse names rarely change, so they are fetched once per process.
function getWarehouseNames() {
  if (!warehouseNamesPromise) {
    warehouseNamesPromise = callBaseLinker('getInventoryWarehouses')
      .then((data) => new Map(
        data.warehouses.map((w) => [`${w.warehouse_type}_${w.warehouse_id}`, w.name])
      ))
      .catch((err) => {
        warehouseNamesPromise = null;
        throw err;
      });
  }
  return warehouseNamesPromise;
}

function resetWarehouseCache() {
  warehouseNamesPromise = null;
}

async function listProducts(filter) {
  const data = await callBaseLinker('getInventoryProductsList', {
    inventory_id: config.baselinker.inventoryId,
    ...filter,
  });
  return Object.values(data.products);
}

async function searchProducts(search) {
  const [products, warehouseNames] = await Promise.all([
    listProducts({ filter_name: search }),
    getWarehouseNames(),
  ]);

  return products.slice(0, MAX_RESULTS).map((p) => {
    const stocks = Object.entries(p.stock || {}).map(([warehouseId, quantity]) => ({
      warehouseId,
      name: warehouseNames.get(warehouseId) || warehouseId,
      quantity,
    }));
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      stockQuantity: stocks.reduce((sum, s) => sum + s.quantity, 0),
      stocks,
    };
  });
}

module.exports = { searchProducts, resetWarehouseCache };
