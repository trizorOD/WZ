import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:wz_app/core/api_client.dart';
import 'package:wz_app/features/wz_documents/wz_document_model.dart';
import 'package:wz_app/features/wz_documents/wz_documents_repository.dart';
import '../../support/fake_token_storage.dart';

void main() {
  group('WzDocumentsRepository', () {
    test('create posts the mapped payload and returns the created document', () async {
      Map<String, dynamic>? capturedBody;
      final repository = WzDocumentsRepository(ApiClient(
        httpClient: MockClient((request) async {
          capturedBody = jsonDecode(request.body) as Map<String, dynamic>;
          return http.Response(
            jsonEncode({'id': 1, 'number': 'WZ/000001/2026', 'pdfUrl': '/wz-documents/1/pdf'}),
            201,
          );
        }),
        tokenStorage: FakeTokenStorage('token'),
      ));

      final result = await repository.create(
        clientId: 5,
        dispatchDate: '2026-07-23',
        note: '',
        items: [const WzDocumentItemInput(productId: 10, name: 'Whisky X', sku: 'WX-1', quantity: 6, unit: 'szt.')],
      );

      expect(result.number, 'WZ/000001/2026');
      expect(capturedBody!['clientId'], 5);
      expect(capturedBody!['items'], [
        {'productId': 10, 'name': 'Whisky X', 'sku': 'WX-1', 'quantity': 6, 'unit': 'szt.'}
      ]);
    });

    test('list maps the JSON array to WzDocumentSummary objects', () async {
      final repository = WzDocumentsRepository(ApiClient(
        httpClient: MockClient((request) async {
          expect(request.url.path, '/wz-documents');
          return http.Response(
            jsonEncode([
              {'id': 1, 'number': 'WZ/000001/2026', 'client_name': 'Wine Avenue', 'dispatch_date': '2026-07-23'},
            ]),
            200,
          );
        }),
        tokenStorage: FakeTokenStorage('token'),
      ));

      final result = await repository.list(client: 'Wine');

      expect(result.single.clientName, 'Wine Avenue');
    });

    test('fetchPdfBytes returns the raw response bytes', () async {
      final repository = WzDocumentsRepository(ApiClient(
        httpClient: MockClient((request) async => http.Response.bytes([1, 2, 3], 200)),
        tokenStorage: FakeTokenStorage('token'),
      ));

      final bytes = await repository.fetchPdfBytes(1);

      expect(bytes, [1, 2, 3]);
    });
  });
}
