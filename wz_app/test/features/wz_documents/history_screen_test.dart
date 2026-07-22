import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wz_app/core/api_client.dart';
import 'package:wz_app/features/wz_documents/history_screen.dart';
import 'package:wz_app/features/wz_documents/wz_document_model.dart';
import 'package:wz_app/features/wz_documents/wz_documents_repository.dart';

class _RecordingRepository extends WzDocumentsRepository {
  _RecordingRepository(this._documents) : super(ApiClient());
  final List<WzDocumentSummary> _documents;
  String? lastQuery;

  @override
  Future<List<WzDocumentSummary>> list({String? client, String? number}) async {
    lastQuery = client;
    return _documents;
  }

  @override
  Future<WzDocumentCreated> create({
    required int clientId,
    required String dispatchDate,
    required String note,
    required List<WzDocumentItemInput> items,
  }) =>
      throw UnimplementedError();

  @override
  Future<List<int>> fetchPdfBytes(int id) async => [];
}

void main() {
  testWidgets('lists documents and re-queries the repository on search input', (tester) async {
    final repository = _RecordingRepository([
      const WzDocumentSummary(id: 1, number: 'WZ/000001/2026', clientName: 'Wine Avenue', dispatchDate: '2026-07-23'),
    ]);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [wzDocumentsRepositoryProvider.overrideWithValue(repository)],
        child: const MaterialApp(home: HistoryScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('WZ/000001/2026'), findsOneWidget);

    await tester.enterText(find.byKey(const Key('history_search_field')), 'Wine');
    await tester.pumpAndSettle();

    expect(repository.lastQuery, 'Wine');
  });
}
