import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:wz_app/core/api_client.dart';
import '../support/fake_token_storage.dart';

void main() {
  group('ApiClient', () {
    test('get attaches the bearer token and returns decoded JSON', () async {
      late http.Request captured;
      final client = ApiClient(
        httpClient: MockClient((request) async {
          captured = request as http.Request;
          return http.Response(jsonEncode({'ok': true}), 200);
        }),
        tokenStorage: FakeTokenStorage('a-token'),
      );

      final result = await client.get('/health');

      expect(result, {'ok': true});
      expect(captured.headers['Authorization'], 'Bearer a-token');
    });

    test('post sends a JSON body without auth when auth is false', () async {
      late http.Request captured;
      final client = ApiClient(
        httpClient: MockClient((request) async {
          captured = request as http.Request;
          return http.Response(jsonEncode({'token': 'xyz'}), 200);
        }),
        tokenStorage: FakeTokenStorage(null),
      );

      final result = await client.post('/auth/login', {'email': 'a@b.pl'}, auth: false);

      expect(result, {'token': 'xyz'});
      expect(captured.headers.containsKey('Authorization'), isFalse);
      expect(jsonDecode(captured.body), {'email': 'a@b.pl'});
    });

    test('throws ApiException with the server message on a 4xx response', () async {
      final client = ApiClient(
        httpClient: MockClient((request) async {
          return http.Response(jsonEncode({'error': 'Invalid credentials'}), 401);
        }),
        tokenStorage: FakeTokenStorage(null),
      );

      await expectLater(
        () => client.get('/products'),
        throwsA(isA<ApiException>()
            .having((e) => e.statusCode, 'statusCode', 401)
            .having((e) => e.message, 'message', 'Invalid credentials')),
      );
    });
  });
}
