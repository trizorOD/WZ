class Product {
  const Product({
    required this.id,
    required this.name,
    required this.sku,
    required this.stockStatus,
    required this.stockQuantity,
  });

  final int id;
  final String name;
  final String sku;
  final String stockStatus;
  final int? stockQuantity;

  factory Product.fromJson(Map<String, dynamic> json) => Product(
        id: json['id'] as int,
        name: json['name'] as String,
        sku: json['sku'] as String,
        stockStatus: json['stockStatus'] as String,
        stockQuantity: json['stockQuantity'] as int?,
      );
}
