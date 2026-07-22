import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../clients/client_model.dart';
import '../clients/clients_repository.dart';
import '../products/product_model.dart';
import '../products/products_repository.dart';
import 'new_wz_draft.dart';
import 'pdf_result_screen.dart';
import 'wz_document_model.dart';
import 'wz_documents_repository.dart';

class NewWzScreen extends ConsumerStatefulWidget {
  const NewWzScreen({super.key});

  @override
  ConsumerState<NewWzScreen> createState() => _NewWzScreenState();
}

class _NewWzScreenState extends ConsumerState<NewWzScreen> {
  int _step = 0;
  final _nipController = TextEditingController();
  final _productQueryController = TextEditingController();
  List<Client> _clientResults = [];
  List<Product> _productResults = [];
  String? _error;
  bool _isLookingUpNip = false;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _nipController.dispose();
    _productQueryController.dispose();
    super.dispose();
  }

  Future<void> _searchClients(String query) async {
    final results = await ref.read(clientsRepositoryProvider).search(query);
    setState(() => _clientResults = results);
  }

  Future<void> _lookupNip() async {
    if (_isLookingUpNip) return;
    setState(() {
      _error = null;
      _isLookingUpNip = true;
    });
    try {
      final client = await ref.read(clientsRepositoryProvider).lookupNip(_nipController.text.trim());
      ref.read(newWzDraftProvider.notifier).setClient(client);
      setState(() => _step = 1);
    } catch (_) {
      setState(() => _error = 'Nie znaleziono NIP. Sprawdz numer lub dodaj klienta recznie.');
    } finally {
      if (mounted) setState(() => _isLookingUpNip = false);
    }
  }

  Future<void> _searchProducts(String query) async {
    final results = await ref.read(productsRepositoryProvider).search(query);
    setState(() => _productResults = results);
  }

  Future<void> _addProductToCart(Product product) async {
    final quantity = await showDialog<num>(
      context: context,
      builder: (context) => _QuantityDialog(product: product),
    );
    if (quantity == null) return;
    ref.read(newWzDraftProvider.notifier).addItem(NewWzDraftItem(
          productId: product.id,
          name: product.name,
          sku: product.sku,
          quantity: quantity,
          unit: 'szt.',
          stockQuantity: product.stockQuantity,
        ));
    if (product.stockQuantity != null && quantity > product.stockQuantity!) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Uwaga: ilość przekracza dostępny stan magazynowy (${product.stockQuantity})',
          ),
        ),
      );
    }
  }

  Future<void> _submit() async {
    if (_isSubmitting) return;
    setState(() => _isSubmitting = true);
    try {
      final draft = ref.read(newWzDraftProvider);
      final created = await ref.read(wzDocumentsRepositoryProvider).create(
            clientId: draft.client!.id,
            dispatchDate: (draft.dispatchDate ?? DateTime.now()).toIso8601String().substring(0, 10),
            note: draft.note,
            items: draft.items
                .map((i) => WzDocumentItemInput(
                      productId: i.productId,
                      name: i.name,
                      sku: i.sku,
                      quantity: i.quantity,
                      unit: i.unit,
                    ))
                .toList(),
          );
      ref.read(newWzDraftProvider.notifier).reset();
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => PdfResultScreen(documentId: created.id, number: created.number)),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final draft = ref.watch(newWzDraftProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Nowy WZ')),
      body: IndexedStack(
        index: _step,
        children: [_buildClientStep(), _buildProductsStep(draft), _buildReviewStep(draft)],
      ),
    );
  }

  Widget _buildClientStep() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            key: const Key('nip_field'),
            controller: _nipController,
            decoration: const InputDecoration(labelText: 'NIP klienta'),
          ),
          ElevatedButton(
            key: const Key('lookup_nip_button'),
            onPressed: _isLookingUpNip ? null : _lookupNip,
            child: const Text('Szukaj po NIP'),
          ),
          if (_error != null) Text(_error!, style: const TextStyle(color: Colors.red)),
          const SizedBox(height: 16),
          TextField(
            key: const Key('client_search_field'),
            decoration: const InputDecoration(labelText: 'Szukaj zapisanego klienta'),
            onChanged: _searchClients,
          ),
          Expanded(
            child: ListView.builder(
              itemCount: _clientResults.length,
              itemBuilder: (context, index) {
                final client = _clientResults[index];
                return ListTile(
                  title: Text(client.name),
                  subtitle: Text(client.address),
                  onTap: () {
                    ref.read(newWzDraftProvider.notifier).setClient(client);
                    setState(() => _step = 1);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductsStep(NewWzDraft draft) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            key: const Key('product_query_field'),
            controller: _productQueryController,
            decoration: const InputDecoration(labelText: 'Szukaj towaru (nazwa lub SKU)'),
            onChanged: _searchProducts,
          ),
          Expanded(
            child: ListView.builder(
              itemCount: _productResults.length,
              itemBuilder: (context, index) {
                final product = _productResults[index];
                return ListTile(
                  key: Key('product_tile_${product.id}'),
                  title: Text(product.name),
                  subtitle: Text('SKU: ${product.sku} - stan: ${product.stockQuantity ?? '-'}'),
                  onTap: () => _addProductToCart(product),
                );
              },
            ),
          ),
          const Divider(),
          Text('Wybrane pozycje (${draft.items.length})'),
          ...draft.items.map((item) => ListTile(
                title: Text(item.name),
                subtitle: Text('${item.quantity} ${item.unit}'),
                trailing: IconButton(
                  icon: const Icon(Icons.remove_circle_outline),
                  onPressed: () => ref.read(newWzDraftProvider.notifier).removeItem(item.productId, item.unit),
                ),
              )),
          ElevatedButton(
            key: const Key('go_to_review_button'),
            onPressed: draft.items.isEmpty ? null : () => setState(() => _step = 2),
            child: const Text('Dalej'),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewStep(NewWzDraft draft) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Klient: ${draft.client?.name ?? '-'}'),
          Text('Adres: ${draft.client?.address ?? '-'}'),
          const SizedBox(height: 16),
          const Text('Pozycje:'),
          ...draft.items.map((item) => Text('${item.name} - ${item.quantity} ${item.unit}')),
          const SizedBox(height: 16),
          TextField(
            key: const Key('note_field'),
            decoration: const InputDecoration(labelText: 'Uwagi (opcjonalnie)'),
            onChanged: (value) => ref.read(newWzDraftProvider.notifier).setNote(value),
          ),
          const Spacer(),
          ElevatedButton(
            key: const Key('submit_wz_button'),
            onPressed: _isSubmitting
                ? null
                : () {
                    ref.read(newWzDraftProvider.notifier).setDispatchDate(DateTime.now());
                    _submit();
                  },
            child: const Text('Wystaw WZ'),
          ),
        ],
      ),
    );
  }
}

class _QuantityDialog extends StatefulWidget {
  const _QuantityDialog({required this.product});
  final Product product;

  @override
  State<_QuantityDialog> createState() => _QuantityDialogState();
}

class _QuantityDialogState extends State<_QuantityDialog> {
  final _controller = TextEditingController(text: '1');

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.product.name),
      content: TextField(
        key: const Key('quantity_field'),
        controller: _controller,
        keyboardType: TextInputType.number,
        decoration: const InputDecoration(labelText: 'Ilosc (szt.)'),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Anuluj')),
        TextButton(
          key: const Key('confirm_quantity_button'),
          onPressed: () => Navigator.of(context).pop(num.tryParse(_controller.text) ?? 1),
          child: const Text('Dodaj'),
        ),
      ],
    );
  }
}
