import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:wz_app/core/api_client.dart';
import 'package:wz_app/features/clients/clients_repository.dart';
import '../../support/fake_token_storage.dart';

void main() {
  group('ClientsRepository', () {
    test('search maps the JSON list to Client objects', () async {
      final repository = ClientsRepository(ApiClient(
        httpClient: MockClient((request) async {
          expect(request.url.path, '/clients');
          expect(request.url.queryParameters['query'], 'wine');
          return http.Response(
            jsonEncode([
              {'id': 1, 'nip': '1133105750', 'name': 'Wine Avenue', 'address': 'ul. Szara 10, Warszawa'},
            ]),
            200,
          );
        }),
        tokenStorage: FakeTokenStorage('token'),
      ));

      final result = await repository.search('wine');

      expect(result, [const Client(id: 1, nip: '1133105750', name: 'Wine Avenue', address: 'ul. Szara 10, Warszawa')]);
    });

    test('lookupNip maps the JSON object to a Client', () async {
      final repository = ClientsRepository(ApiClient(
        httpClient: MockClient((request) async {
          expect(request.url.path, '/clients/lookup/1133105750');
          return http.Response(
            jsonEncode({'id': 1, 'nip': '1133105750', 'name': 'Wine Avenue', 'address': 'ul. Szara 10, Warszawa'}),
            200,
          );
        }),
        tokenStorage: FakeTokenStorage('token'),
      ));

      final result = await repository.lookupNip('1133105750');

      expect(result.name, 'Wine Avenue');
    });

    test('lookupNip throws ApiException on a 404', () async {
      final repository = ClientsRepository(ApiClient(
        httpClient: MockClient((request) async => http.Response(jsonEncode({'error': 'NIP not found'}), 404)),
        tokenStorage: FakeTokenStorage('token'),
      ));

      await expectLater(() => repository.lookupNip('0000000000'), throwsA(isA<ApiException>()));
    });

    test('createManual posts the form fields and maps the JSON object to a Client', () async {
      final repository = ClientsRepository(ApiClient(
        httpClient: MockClient((request) async {
          expect(request.url.path, '/clients');
          expect(request.method, 'POST');
          final body = jsonDecode(request.body) as Map<String, dynamic>;
          expect(body, {
            'nip': '5253079419',
            'name': 'Manual Sp. z o.o.',
            'address': 'ul. Ręczna 5, Warszawa',
            'regon': '111222333',
          });
          return http.Response(
            jsonEncode({
              'id': 2,
              'nip': '5253079419',
              'name': 'Manual Sp. z o.o.',
              'address': 'ul. Ręczna 5, Warszawa',
            }),
            201,
          );
        }),
        tokenStorage: FakeTokenStorage('token'),
      ));

      final result = await repository.createManual(
        nip: '5253079419',
        name: 'Manual Sp. z o.o.',
        address: 'ul. Ręczna 5, Warszawa',
        regon: '111222333',
      );

      expect(result.name, 'Manual Sp. z o.o.');
    });

    test('createManual throws ApiException on a 409 duplicate NIP', () async {
      final repository = ClientsRepository(ApiClient(
        httpClient: MockClient(
          (request) async => http.Response(jsonEncode({'error': 'Client with this NIP already exists'}), 409),
        ),
        tokenStorage: FakeTokenStorage('token'),
      ));

      await expectLater(
        () => repository.createManual(nip: '5253079419', name: 'X', address: 'Y'),
        throwsA(isA<ApiException>()),
      );
    });
  });
}
