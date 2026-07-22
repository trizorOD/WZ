import 'package:wz_app/core/token_storage.dart';

class FakeTokenStorage extends TokenStorage {
  FakeTokenStorage(this._token);
  String? _token;

  @override
  Future<void> save(String token) async => _token = token;

  @override
  Future<String?> read() async => _token;

  @override
  Future<void> clear() async => _token = null;
}
