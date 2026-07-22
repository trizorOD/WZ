import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import '../auth/auth_provider.dart';
import 'client_model.dart';

export 'client_model.dart';

class ClientsRepository {
  ClientsRepository(this._apiClient);
  final ApiClient _apiClient;

  Future<List<Client>> search(String query) async {
    final response = await _apiClient.get('/clients', query: {'query': query});
    return (response as List).map((e) => Client.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Client> lookupNip(String nip) async {
    final response = await _apiClient.get('/clients/lookup/$nip');
    return Client.fromJson(response as Map<String, dynamic>);
  }
}

final clientsRepositoryProvider = Provider<ClientsRepository>(
  (ref) => ClientsRepository(ref.watch(apiClientProvider)),
);
