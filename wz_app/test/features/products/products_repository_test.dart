import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:wz_app/core/api_client.dart';
import 'package:wz_app/features/products/products_repository.dart';
import '../../support/fake_token_storage.dart';

void main() {
  test('ProductsRepository.search maps the JSON list to Product objects', () async {
    final repository = ProductsRepository(ApiClient(
      httpClient: MockClient((request) async {
        expect(request.url.path, '/products');
        expect(request.url.queryParameters['search'], 'whisky');
        return http.Response(
          jsonEncode([
            {'id': 10, 'name': 'Whisky X', 'sku': 'WX-1', 'stockStatus': 'instock', 'stockQuantity': 42},
          ]),
          200,
        );
      }),
      tokenStorage: FakeTokenStorage('token'),
    ));

    final result = await repository.search('whisky');

    expect(result.single.name, 'Whisky X');
    expect(result.single.stockQuantity, 42);
  });
}
