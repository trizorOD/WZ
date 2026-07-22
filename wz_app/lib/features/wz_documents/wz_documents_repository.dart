import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import '../auth/auth_provider.dart';
import 'wz_document_model.dart';

export 'wz_document_model.dart';

class WzDocumentsRepository {
  WzDocumentsRepository(this._apiClient);
  final ApiClient _apiClient;

  Future<WzDocumentCreated> create({
    required int clientId,
    required String dispatchDate,
    required String note,
    required List<WzDocumentItemInput> items,
  }) async {
    final response = await _apiClient.post('/wz-documents', {
      'clientId': clientId,
      'dispatchDate': dispatchDate,
      'note': note,
      'items': items.map((i) => i.toJson()).toList(),
    });
    return WzDocumentCreated.fromJson(response as Map<String, dynamic>);
  }

  Future<List<WzDocumentSummary>> list({String? client, String? number}) async {
    final query = <String, String>{};
    if (client != null && client.isNotEmpty) query['client'] = client;
    if (number != null && number.isNotEmpty) query['number'] = number;
    final response = await _apiClient.get('/wz-documents', query: query);
    return (response as List).map((e) => WzDocumentSummary.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<int>> fetchPdfBytes(int id) => _apiClient.getBytes('/wz-documents/$id/pdf');
}

final wzDocumentsRepositoryProvider = Provider<WzDocumentsRepository>(
  (ref) => WzDocumentsRepository(ref.watch(apiClientProvider)),
);
