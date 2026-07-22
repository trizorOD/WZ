import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:wz_app/core/api_client.dart';
import 'package:wz_app/features/auth/auth_repository.dart';
import '../../support/fake_token_storage.dart';

void main() {
  group('AuthRepository', () {
    test('login saves the token on success', () async {
      final tokenStorage = FakeTokenStorage(null);
      final repository = AuthRepository(
        ApiClient(
          httpClient: MockClient((request) async => http.Response(jsonEncode({'token': 'abc123'}), 200)),
          tokenStorage: tokenStorage,
        ),
        tokenStorage,
      );

      await repository.login('a@finespirits.pl', 'secret');

      expect(await tokenStorage.read(), 'abc123');
    });

    test('login throws and does not save a token on invalid credentials', () async {
      final tokenStorage = FakeTokenStorage(null);
      final repository = AuthRepository(
        ApiClient(
          httpClient: MockClient((request) async => http.Response(jsonEncode({'error': 'Invalid credentials'}), 401)),
          tokenStorage: tokenStorage,
        ),
        tokenStorage,
      );

      await expectLater(
        () => repository.login('a@finespirits.pl', 'wrong'),
        throwsA(isA<ApiException>()),
      );
      expect(await tokenStorage.read(), isNull);
    });

    test('isLoggedIn reflects whether a token is stored', () async {
      final tokenStorage = FakeTokenStorage('abc123');
      final repository = AuthRepository(ApiClient(tokenStorage: tokenStorage), tokenStorage);

      expect(await repository.isLoggedIn(), isTrue);
      await repository.logout();
      expect(await repository.isLoggedIn(), isFalse);
    });
  });
}
