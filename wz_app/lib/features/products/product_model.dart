class WarehouseStock {
  const WarehouseStock({
    required this.warehouseId,
    required this.name,
    required this.quantity,
  });

  final String warehouseId;
  final String name;
  final int quantity;

  factory WarehouseStock.fromJson(Map<String, dynamic> json) => WarehouseStock(
        warehouseId: json['warehouseId'] as String,
        name: json['name'] as String,
        quantity: json['quantity'] as int,
      );
}

class Product {
  const Product({
    required this.id,
    required this.name,
    required this.sku,
    required this.stockQuantity,
    this.stocks = const [],
  });

  final int id;
  final String name;
  final String sku;

  /// Total stock across all warehouses.
  final int? stockQuantity;
  final List<WarehouseStock> stocks;

  factory Product.fromJson(Map<String, dynamic> json) => Product(
        id: json['id'] as int,
        name: json['name'] as String,
        sku: json['sku'] as String,
        stockQuantity: json['stockQuantity'] as int?,
        stocks: (json['stocks'] as List? ?? [])
            .map((e) => WarehouseStock.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
