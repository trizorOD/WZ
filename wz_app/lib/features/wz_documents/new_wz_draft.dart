import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../clients/client_model.dart';

class NewWzDraftItem {
  const NewWzDraftItem({
    required this.productId,
    required this.name,
    required this.sku,
    required this.quantity,
    required this.unit,
    this.stockQuantity,
  });

  final int productId;
  final String name;
  final String sku;
  final num quantity;
  final String unit;
  final int? stockQuantity;

  NewWzDraftItem withQuantity(num newQuantity) => NewWzDraftItem(
        productId: productId,
        name: name,
        sku: sku,
        quantity: newQuantity,
        unit: unit,
        stockQuantity: stockQuantity,
      );
}

class NewWzDraft {
  const NewWzDraft({this.client, this.items = const [], this.dispatchDate, this.note = ''});

  final Client? client;
  final List<NewWzDraftItem> items;
  final DateTime? dispatchDate;
  final String note;
}

class NewWzDraftController extends StateNotifier<NewWzDraft> {
  NewWzDraftController() : super(const NewWzDraft());

  void setClient(Client client) {
    state = NewWzDraft(client: client, items: state.items, dispatchDate: state.dispatchDate, note: state.note);
  }

  void addItem(NewWzDraftItem item) {
    final existingIndex =
        state.items.indexWhere((i) => i.productId == item.productId && i.unit == item.unit);

    if (existingIndex >= 0) {
      final updated = [...state.items];
      final existing = updated[existingIndex];
      updated[existingIndex] = existing.withQuantity(existing.quantity + item.quantity);
      state = NewWzDraft(client: state.client, items: updated, dispatchDate: state.dispatchDate, note: state.note);
    } else {
      state = NewWzDraft(
        client: state.client,
        items: [...state.items, item],
        dispatchDate: state.dispatchDate,
        note: state.note,
      );
    }
  }

  void removeItem(int productId, String unit) {
    state = NewWzDraft(
      client: state.client,
      items: state.items.where((i) => !(i.productId == productId && i.unit == unit)).toList(),
      dispatchDate: state.dispatchDate,
      note: state.note,
    );
  }

  void setDispatchDate(DateTime date) {
    state = NewWzDraft(client: state.client, items: state.items, dispatchDate: date, note: state.note);
  }

  void setNote(String note) {
    state = NewWzDraft(client: state.client, items: state.items, dispatchDate: state.dispatchDate, note: note);
  }

  void reset() => state = const NewWzDraft();
}

final newWzDraftProvider = StateNotifierProvider<NewWzDraftController, NewWzDraft>(
  (ref) => NewWzDraftController(),
);
