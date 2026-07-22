import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import '../auth/auth_provider.dart';
import 'product_model.dart';

export 'product_model.dart';

class ProductsRepository {
  ProductsRepository(this._apiClient);
  final ApiClient _apiClient;

  Future<List<Product>> search(String query) async {
    final response = await _apiClient.get('/products', query: {'search': query});
    return (response as List).map((e) => Product.fromJson(e as Map<String, dynamic>)).toList();
  }
}

final productsRepositoryProvider = Provider<ProductsRepository>(
  (ref) => ProductsRepository(ref.watch(apiClientProvider)),
);
