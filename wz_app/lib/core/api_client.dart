import 'dart:convert';
import 'package:http/http.dart' as http;
import 'config.dart';
import 'token_storage.dart';

class ApiException implements Exception {
  ApiException(this.statusCode, this.message);
  final int statusCode;
  final String message;

  @override
  String toString() => 'ApiException($statusCode, $message)';
}

class ApiClient {
  ApiClient({http.Client? httpClient, TokenStorage? tokenStorage})
      : _http = httpClient ?? http.Client(),
        _tokenStorage = tokenStorage ?? TokenStorage();

  final http.Client _http;
  final TokenStorage _tokenStorage;

  Future<Map<String, String>> _headers({bool auth = true}) async {
    final headers = {'Content-Type': 'application/json'};
    if (auth) {
      final token = await _tokenStorage.read();
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Uri _uri(String path, [Map<String, String>? query]) =>
      Uri.parse('${AppConfig.apiBaseUrl}$path').replace(queryParameters: query);

  Future<dynamic> get(String path, {Map<String, String>? query, bool auth = true}) async {
    final response = await _http.get(_uri(path, query), headers: await _headers(auth: auth));
    return _decode(response);
  }

  Future<dynamic> post(String path, Map<String, dynamic> body, {bool auth = true}) async {
    final response = await _http.post(
      _uri(path),
      headers: await _headers(auth: auth),
      body: jsonEncode(body),
    );
    return _decode(response);
  }

  Future<List<int>> getBytes(String path) async {
    final response = await _http.get(_uri(path), headers: await _headers());
    if (response.statusCode >= 400) {
      throw ApiException(response.statusCode, 'Request failed');
    }
    return response.bodyBytes;
  }

  dynamic _decode(http.Response response) {
    final body = response.body.isEmpty ? null : jsonDecode(response.body);
    if (response.statusCode >= 400) {
      final message = body is Map && body['error'] != null ? body['error'] as String : 'Request failed';
      throw ApiException(response.statusCode, message);
    }
    return body;
  }
}
