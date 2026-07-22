import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import '../../core/token_storage.dart';
import 'auth_repository.dart';

final tokenStorageProvider = Provider<TokenStorage>((ref) => TokenStorage());

final apiClientProvider = Provider<ApiClient>(
  (ref) => ApiClient(tokenStorage: ref.watch(tokenStorageProvider)),
);

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(apiClientProvider), ref.watch(tokenStorageProvider)),
);

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  const AuthState(this.status, {this.error});
  final AuthStatus status;
  final String? error;
}

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._repository) : super(const AuthState(AuthStatus.unknown)) {
    checkInitialAuth();
  }

  final AuthRepository _repository;

  Future<void> checkInitialAuth() async {
    final loggedIn = await _repository.isLoggedIn();
    state = AuthState(loggedIn ? AuthStatus.authenticated : AuthStatus.unauthenticated);
  }

  Future<void> login(String email, String password) async {
    try {
      await _repository.login(email, password);
      state = const AuthState(AuthStatus.authenticated);
    } on ApiException catch (e) {
      state = AuthState(AuthStatus.unauthenticated, error: e.message);
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    state = const AuthState(AuthStatus.unauthenticated);
  }
}

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>(
  (ref) => AuthController(ref.watch(authRepositoryProvider)),
);
