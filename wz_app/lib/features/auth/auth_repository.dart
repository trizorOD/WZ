import '../../core/api_client.dart';
import '../../core/token_storage.dart';

class AuthRepository {
  AuthRepository(this._apiClient, this._tokenStorage);

  final ApiClient _apiClient;
  final TokenStorage _tokenStorage;

  Future<void> login(String email, String password) async {
    final response = await _apiClient.post(
      '/auth/login',
      {'email': email, 'password': password},
      auth: false,
    );
    final token = response['token'] as String;
    await _tokenStorage.save(token);
  }

  Future<void> logout() => _tokenStorage.clear();

  Future<bool> isLoggedIn() async => (await _tokenStorage.read()) != null;
}
