class WzDocumentItemInput {
  const WzDocumentItemInput({
    required this.productId,
    required this.name,
    required this.sku,
    required this.quantity,
    required this.unit,
  });

  final int productId;
  final String name;
  final String sku;
  final num quantity;
  final String unit;

  Map<String, dynamic> toJson() => {
        'productId': productId,
        'name': name,
        'sku': sku,
        'quantity': quantity,
        'unit': unit,
      };
}

class WzDocumentCreated {
  const WzDocumentCreated({required this.id, required this.number, required this.pdfUrl});

  final int id;
  final String number;
  final String pdfUrl;

  factory WzDocumentCreated.fromJson(Map<String, dynamic> json) => WzDocumentCreated(
        id: json['id'] as int,
        number: json['number'] as String,
        pdfUrl: json['pdfUrl'] as String,
      );
}

class WzDocumentSummary {
  const WzDocumentSummary({
    required this.id,
    required this.number,
    required this.clientName,
    required this.dispatchDate,
  });

  final int id;
  final String number;
  final String clientName;
  final String dispatchDate;

  factory WzDocumentSummary.fromJson(Map<String, dynamic> json) => WzDocumentSummary(
        id: json['id'] as int,
        number: json['number'] as String,
        clientName: json['client_name'] as String,
        dispatchDate: json['dispatch_date'] as String,
      );
}
