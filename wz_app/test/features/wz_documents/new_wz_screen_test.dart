import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wz_app/core/api_client.dart';
import 'package:wz_app/features/clients/client_model.dart';
import 'package:wz_app/features/clients/clients_repository.dart';
import 'package:wz_app/features/products/product_model.dart';
import 'package:wz_app/features/products/products_repository.dart';
import 'package:wz_app/features/wz_documents/new_wz_draft.dart';
import 'package:wz_app/features/wz_documents/new_wz_screen.dart';
import 'package:wz_app/features/wz_documents/wz_document_model.dart';
import 'package:wz_app/features/wz_documents/wz_documents_repository.dart';

class _FakeClientsRepository extends ClientsRepository {
  _FakeClientsRepository() : super(ApiClient());

  @override
  Future<Client> lookupNip(String nip) async =>
      const Client(id: 1, nip: '1133105750', name: 'Wine Avenue', address: 'ul. Szara 10, Warszawa');

  @override
  Future<List<Client>> search(String query) async => [];
}

class _FakeProductsRepository extends ProductsRepository {
  _FakeProductsRepository() : super(ApiClient());

  @override
  Future<List<Product>> search(String query) async => [
        const Product(id: 10, name: 'Whisky X', sku: 'WX-1', stockStatus: 'instock', stockQuantity: 42),
      ];
}

class _RecordingWzDocumentsRepository extends WzDocumentsRepository {
  _RecordingWzDocumentsRepository() : super(ApiClient());
  List<WzDocumentItemInput>? capturedItems;

  @override
  Future<WzDocumentCreated> create({
    required int clientId,
    required String dispatchDate,
    required String note,
    required List<WzDocumentItemInput> items,
  }) async {
    capturedItems = items;
    return const WzDocumentCreated(id: 1, number: 'WZ/000001/2026', pdfUrl: '/wz-documents/1/pdf');
  }

  @override
  Future<List<WzDocumentSummary>> list({String? client, String? number}) async => [];

  @override
  Future<List<int>> fetchPdfBytes(int id) async => [];
}

void main() {
  testWidgets('completes the client -> products -> review flow and submits', (tester) async {
    final wzRepository = _RecordingWzDocumentsRepository();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          clientsRepositoryProvider.overrideWithValue(_FakeClientsRepository()),
          productsRepositoryProvider.overrideWithValue(_FakeProductsRepository()),
          wzDocumentsRepositoryProvider.overrideWithValue(wzRepository),
        ],
        child: const MaterialApp(home: NewWzScreen()),
      ),
    );

    await tester.enterText(find.byKey(const Key('nip_field')), '1133105750');
    await tester.tap(find.byKey(const Key('lookup_nip_button')));
    await tester.pumpAndSettle();

    await tester.enterText(find.byKey(const Key('product_query_field')), 'whisky');
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('product_tile_10')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('quantity_field')), '6');
    await tester.tap(find.byKey(const Key('confirm_quantity_button')));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('go_to_review_button')));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('submit_wz_button')));
    // Submitting navigates (pushReplacement) into PdfResultScreen, which now
    // renders a real PdfPreview (package:printing). PdfPreview runs its own
    // platform-channel rasterization and animates its own loading indicator
    // indefinitely inside the flutter_test sandbox (no platform channel mock
    // exists for it), so it never "settles" — pumpAndSettle would hang/time
    // out here. This test only needs to observe that submit triggered the
    // repository call with the right payload, which happens synchronously
    // inside the fake repository before navigation; a couple of bounded
    // pumps is enough to drive that through without waiting on PdfPreview.
    await tester.pump();
    await tester.pump();

    expect(wzRepository.capturedItems, isNotNull);
    expect(wzRepository.capturedItems!.single.quantity, 6);
    expect(wzRepository.capturedItems!.single.sku, 'WX-1');
  });

  testWidgets('resets an abandoned draft when the screen is re-entered', (tester) async {
    final container = ProviderContainer(
      overrides: [
        clientsRepositoryProvider.overrideWithValue(_FakeClientsRepository()),
        productsRepositoryProvider.overrideWithValue(_FakeProductsRepository()),
        wzDocumentsRepositoryProvider.overrideWithValue(_RecordingWzDocumentsRepository()),
      ],
    );
    addTearDown(container.dispose);

    // Simulate an abandoned draft left over from a previous "Nowy WZ" session
    // (e.g. the user backed out without submitting).
    container.read(newWzDraftProvider.notifier).addItem(
          const NewWzDraftItem(
            productId: 10,
            name: 'Whisky X',
            sku: 'WX-1',
            quantity: 6,
            unit: 'szt.',
            stockQuantity: 42,
          ),
        );
    expect(container.read(newWzDraftProvider).items, isNotEmpty);

    // Re-entering the screen (a fresh instance, as navigation would create)
    // must reset the stale draft as soon as it is created.
    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(home: NewWzScreen()),
      ),
    );

    expect(container.read(newWzDraftProvider).items, isEmpty);
  });

  testWidgets('nip_field strips non-digit characters as they are typed', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          clientsRepositoryProvider.overrideWithValue(_FakeClientsRepository()),
          productsRepositoryProvider.overrideWithValue(_FakeProductsRepository()),
          wzDocumentsRepositoryProvider.overrideWithValue(_RecordingWzDocumentsRepository()),
        ],
        child: const MaterialApp(home: NewWzScreen()),
      ),
    );

    await tester.enterText(find.byKey(const Key('nip_field')), '11-33 10a5750');

    expect(find.text('1133105750'), findsOneWidget);
  });
}
