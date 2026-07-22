import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:printing/printing.dart';
import 'package:wz_app/core/api_client.dart';
import 'package:wz_app/features/wz_documents/pdf_result_screen.dart';
import 'package:wz_app/features/wz_documents/wz_document_model.dart';
import 'package:wz_app/features/wz_documents/wz_documents_repository.dart';

class _DelayedWzDocumentsRepository extends WzDocumentsRepository {
  _DelayedWzDocumentsRepository(this._future) : super(ApiClient());
  final Future<List<int>> _future;

  @override
  Future<List<int>> fetchPdfBytes(int id) => _future;

  @override
  Future<WzDocumentCreated> create({
    required int clientId,
    required String dispatchDate,
    required String note,
    required List<WzDocumentItemInput> items,
  }) =>
      throw UnimplementedError();

  @override
  Future<List<WzDocumentSummary>> list({String? client, String? number}) async => [];
}

void main() {
  testWidgets('shows a loading indicator until the PDF bytes arrive', (tester) async {
    final completer = Completer<List<int>>();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          wzDocumentsRepositoryProvider.overrideWithValue(_DelayedWzDocumentsRepository(completer.future)),
        ],
        child: const MaterialApp(home: PdfResultScreen(documentId: 1, number: 'WZ/000001/2026')),
      ),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    completer.complete(<int>[1, 2, 3]);
    await tester.pump();

    // PdfPreview does its own internal platform-channel rasterization and
    // shows its own CircularProgressIndicator while that's in flight, which
    // never resolves inside the flutter_test sandbox (no platform channel
    // mock exists for it). Asserting on PdfPreview's internal loading state
    // is out of scope for this screen's own tests. What this screen owns is
    // the transition out of its own FutureBuilder loading branch into
    // rendering PdfPreview, so assert that instead.
    expect(find.byType(PdfPreview), findsOneWidget);
  });
}
