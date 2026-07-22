import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wz_app/core/api_client.dart';
import 'package:wz_app/core/token_storage.dart';
import 'package:wz_app/features/auth/auth_provider.dart';
import 'package:wz_app/features/auth/auth_repository.dart';
import 'package:wz_app/features/auth/login_screen.dart';

class _RecordingAuthRepository extends AuthRepository {
  _RecordingAuthRepository() : super(ApiClient(), TokenStorage());
  String? lastEmail;
  String? lastPassword;
  bool shouldFail = false;

  @override
  Future<void> login(String email, String password) async {
    lastEmail = email;
    lastPassword = password;
    if (shouldFail) throw ApiException(401, 'Invalid credentials');
  }

  @override
  Future<bool> isLoggedIn() async => false;
}

void main() {
  testWidgets('submits entered credentials to the repository', (tester) async {
    final repository = _RecordingAuthRepository();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authRepositoryProvider.overrideWithValue(repository),
          authControllerProvider.overrideWith((ref) => AuthController(repository)),
        ],
        child: const MaterialApp(home: LoginScreen()),
      ),
    );

    await tester.enterText(find.byKey(const Key('email_field')), 'agent@finespirits.pl');
    await tester.enterText(find.byKey(const Key('password_field')), 'secret');
    await tester.tap(find.byKey(const Key('login_button')));
    await tester.pump();

    expect(repository.lastEmail, 'agent@finespirits.pl');
    expect(repository.lastPassword, 'secret');
  });

  testWidgets('shows an error message when login fails', (tester) async {
    final repository = _RecordingAuthRepository()..shouldFail = true;

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authRepositoryProvider.overrideWithValue(repository),
          authControllerProvider.overrideWith((ref) => AuthController(repository)),
        ],
        child: const MaterialApp(home: LoginScreen()),
      ),
    );

    await tester.tap(find.byKey(const Key('login_button')));
    await tester.pump();

    expect(find.text('Invalid credentials'), findsOneWidget);
  });
}
