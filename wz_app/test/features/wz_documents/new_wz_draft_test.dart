import 'package:flutter_test/flutter_test.dart';
import 'package:wz_app/features/wz_documents/new_wz_draft.dart';

void main() {
  group('NewWzDraftController', () {
    test('addItem merges quantities for the same product and unit', () {
      final controller = NewWzDraftController();
      controller.addItem(const NewWzDraftItem(productId: 1, name: 'Whisky X', sku: 'WX-1', quantity: 2, unit: 'szt.'));
      controller.addItem(const NewWzDraftItem(productId: 1, name: 'Whisky X', sku: 'WX-1', quantity: 3, unit: 'szt.'));

      expect(controller.state.items.single.quantity, 5);
    });

    test('addItem keeps separate entries for different units of the same product', () {
      final controller = NewWzDraftController();
      controller.addItem(const NewWzDraftItem(productId: 1, name: 'Whisky X', sku: 'WX-1', quantity: 2, unit: 'szt.'));
      controller.addItem(const NewWzDraftItem(productId: 1, name: 'Whisky X', sku: 'WX-1', quantity: 1, unit: 'kartony'));

      expect(controller.state.items.length, 2);
    });

    test('removeItem removes only the matching product/unit pair', () {
      final controller = NewWzDraftController();
      controller.addItem(const NewWzDraftItem(productId: 1, name: 'A', sku: 'A', quantity: 1, unit: 'szt.'));
      controller.addItem(const NewWzDraftItem(productId: 2, name: 'B', sku: 'B', quantity: 1, unit: 'szt.'));

      controller.removeItem(1, 'szt.');

      expect(controller.state.items.single.productId, 2);
    });

    test('reset clears the draft back to its initial state', () {
      final controller = NewWzDraftController();
      controller.addItem(const NewWzDraftItem(productId: 1, name: 'A', sku: 'A', quantity: 1, unit: 'szt.'));
      controller.setNote('uwaga');

      controller.reset();

      expect(controller.state.items, isEmpty);
      expect(controller.state.note, '');
      expect(controller.state.client, isNull);
    });
  });
}
