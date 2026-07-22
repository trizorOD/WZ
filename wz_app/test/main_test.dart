import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wz_app/core/api_client.dart';
import 'package:wz_app/core/token_storage.dart';
import 'package:wz_app/features/auth/auth_provider.dart';
import 'package:wz_app/features/auth/auth_repository.dart';
import 'package:wz_app/features/auth/login_screen.dart';
import 'package:wz_app/features/home/home_screen.dart';
import 'package:wz_app/main.dart';

class _NoopAuthRepository extends AuthRepository {
  _NoopAuthRepository() : super(ApiClient(), TokenStorage());
}

class _FixedAuthController extends AuthController {
  _FixedAuthController(AuthState initial) : super(_NoopAuthRepository()) {
    state = initial;
  }

  @override
  Future<void> checkInitialAuth() async {}
}

void main() {
  testWidgets('shows the login screen when unauthenticated', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authControllerProvider.overrideWith(
            (ref) => _FixedAuthController(const AuthState(AuthStatus.unauthenticated)),
          ),
        ],
        child: const WzApp(),
      ),
    );
    await tester.pump();

    expect(find.byType(LoginScreen), findsOneWidget);
  });

  testWidgets('shows the home screen when authenticated', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authControllerProvider.overrideWith(
            (ref) => _FixedAuthController(const AuthState(AuthStatus.authenticated)),
          ),
        ],
        child: const WzApp(),
      ),
    );
    await tester.pump();

    expect(find.byType(HomeScreen), findsOneWidget);
  });
}
